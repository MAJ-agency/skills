import axios, { type AxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { tokens } from "@/lib/secure-store";

/**
 * L'UNIQUE client HTTP de l'app. Jamais `fetch` brut dans une feature.
 *
 * Différences avec le client web : pas de cookie, un jeton porteur lu dans le
 * Keychain à chaque requête, et l'en-tête `X-Client-Type: mobile` pour que
 * l'API rende les jetons en JSON plutôt qu'en `Set-Cookie`. Les MÊMES endpoints
 * que le web : jamais une route `/mobile/*` dédiée (apps/mobile/CLAUDE.md, API client).
 */
export const apiClient = axios.create({
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json", "X-Client-Type": "mobile" },
});

apiClient.interceptors.request.use(async (config) => {
  const access = await tokens.getAccess();
  if (access) config.headers.set("Authorization", `Bearer ${access}`);
  return config;
});

/**
 * Rafraîchissement à un seul vol : sur un 401, UNE requête de refresh part,
 * les autres attendent son résultat puis rejouent avec le nouveau jeton. Sans
 * cette file, dix requêtes simultanées déclenchent dix refresh, et la rotation
 * révoque la famille (apps/api/CLAUDE.md, Invariants — auth).
 *
 * Inerte tant que l'API ne répond jamais 401. Quand la session arrive, seuls
 * `REFRESH_PATH`, la forme de sa réponse et `onSessionLost` sont à brancher.
 */
const REFRESH_PATH = "/auth/refresh";
type RetryableConfig = AxiosRequestConfig & { _retried?: boolean };

let refreshInFlight: Promise<string | null> | undefined;
let onSessionLost: () => void = () => {};

/** Branché par la racine de navigation : quoi faire quand la session ne peut pas être rétablie. */
export function setOnSessionLost(callback: () => void): void {
  onSessionLost = callback;
}

async function refreshSession(): Promise<string | null> {
  const refresh = await tokens.getRefresh();
  if (!refresh) return null;
  try {
    const response = await axios.post<{ access: string; refresh: string }>(
      `${env.EXPO_PUBLIC_API_URL}${REFRESH_PATH}`,
      {},
      {
        headers: { "X-Client-Type": "mobile", Authorization: `Bearer ${refresh}` },
        timeout: 15_000,
      },
    );
    await tokens.set(response.data.access, response.data.refresh);
    return response.data.access;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) throw error;
  const config = error.config as RetryableConfig;
  if (config._retried || (config.url ?? "").startsWith(REFRESH_PATH)) throw error;

  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = undefined;
  });
  const newAccess = await refreshInFlight;
  if (!newAccess) {
    await tokens.clear();
    onSessionLost();
    throw error;
  }
  config._retried = true;
  return apiClient.request({
    ...config,
    headers: { ...config.headers, Authorization: `Bearer ${newAccess}` },
  });
});
