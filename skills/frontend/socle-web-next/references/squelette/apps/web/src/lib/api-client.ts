import axios from "axios";
import { env } from "@/lib/env";

/**
 * L'UNIQUE client HTTP du front. Jamais `fetch` brut dans une feature : tout
 * passe ici, pour que cookies, erreurs et rafraîchissement de session soient
 * traités une fois (apps/web/CLAUDE.md, API client).
 *
 * - `withCredentials` : la session est un cookie httpOnly posé par l'API. Le
 *   client ne voit jamais un jeton, ne le stocke jamais.
 * - En développement le navigateur appelle `/api` (même origine) et Next relaie
 *   vers l'API (next.config.ts) : sinon le cookie d'une autre origine n'est pas
 *   renvoyé.
 */
function apiOrigin(): string {
  const browserInDev = typeof window !== "undefined" && env.NODE_ENV === "development";
  return browserInDev ? "/api" : env.NEXT_PUBLIC_API_URL;
}

export const apiClient = axios.create({
  baseURL: apiOrigin(),
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Un corps FormData fixe son propre Content-Type (multipart + boundary).
apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

/**
 * Rafraîchissement de session, à un seul vol : sur un 401, UNE requête de
 * refresh part, les autres attendent son résultat puis rejouent. Sans cette
 * file, dix requêtes simultanées déclenchent dix refresh, et la rotation du
 * refresh token révoque la famille (apps/api/CLAUDE.md, Invariants — auth).
 *
 * Inerte tant que l'API ne répond jamais 401 : l'authentification est un
 * ticket. Quand elle arrive, seul `REFRESH_PATH` et `onSessionLost`
 * sont à brancher.
 */
const REFRESH_PATH = "/auth/refresh";
const PATHS_WITHOUT_REFRESH = ["/auth/login", "/auth/logout", REFRESH_PATH];

let refreshInFlight: Promise<void> | undefined;
let onSessionLost: () => void = () => {};

/** Branché par le layout : quoi faire quand la session ne peut pas être rétablie. */
export function setOnSessionLost(callback: () => void): void {
  onSessionLost = callback;
}

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    throw error;
  }
  const config = error.config as typeof error.config & { _retried?: boolean };
  const path = config.url ?? "";
  if (config._retried || PATHS_WITHOUT_REFRESH.some((p) => path.startsWith(p))) {
    throw error;
  }
  try {
    refreshInFlight ??= apiClient.post(REFRESH_PATH).then(() => undefined);
    await refreshInFlight;
  } catch {
    onSessionLost();
    throw error;
  } finally {
    refreshInFlight = undefined;
  }
  config._retried = true;
  return apiClient.request(config);
});
