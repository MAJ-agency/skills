import axios, { type AxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { jetons } from "@/lib/secure-store";

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
  const acces = await jetons.lireAcces();
  if (acces) config.headers.set("Authorization", `Bearer ${acces}`);
  return config;
});

/**
 * Rafraîchissement à un seul vol : sur un 401, UNE requête de refresh part,
 * les autres attendent son résultat puis rejouent avec le nouveau jeton. Sans
 * cette file, dix requêtes simultanées déclenchent dix refresh, et la rotation
 * révoque la famille (apps/api/CLAUDE.md, Invariants — auth).
 *
 * Inerte tant que l'API ne répond jamais 401. Quand la session arrive, seuls
 * `CHEMIN_REFRESH`, la forme de sa réponse et `onSessionPerdue` sont à brancher.
 */
const CHEMIN_REFRESH = "/auth/refresh";
type ConfigRejouable = AxiosRequestConfig & { _rejouee?: boolean };

let refreshEnVol: Promise<string | null> | undefined;
let onSessionPerdue: () => void = () => {};

/** Branché par la racine de navigation : quoi faire quand la session ne peut pas être rétablie. */
export function definirOnSessionPerdue(callback: () => void): void {
  onSessionPerdue = callback;
}

async function rafraichir(): Promise<string | null> {
  const refresh = await jetons.lireRefresh();
  if (!refresh) return null;
  try {
    const reponse = await axios.post<{ acces: string; refresh: string }>(
      `${env.EXPO_PUBLIC_API_URL}${CHEMIN_REFRESH}`,
      {},
      { headers: { "X-Client-Type": "mobile", Authorization: `Bearer ${refresh}` }, timeout: 15_000 },
    );
    await jetons.definir(reponse.data.acces, reponse.data.refresh);
    return reponse.data.acces;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(undefined, async (erreur: unknown) => {
  if (!axios.isAxiosError(erreur) || erreur.response?.status !== 401 || !erreur.config) throw erreur;
  const config = erreur.config as ConfigRejouable;
  if (config._rejouee || (config.url ?? "").startsWith(CHEMIN_REFRESH)) throw erreur;

  refreshEnVol ??= rafraichir().finally(() => {
    refreshEnVol = undefined;
  });
  const nouveau = await refreshEnVol;
  if (!nouveau) {
    await jetons.effacer();
    onSessionPerdue();
    throw erreur;
  }
  config._rejouee = true;
  return apiClient.request({ ...config, headers: { ...config.headers, Authorization: `Bearer ${nouveau}` } });
});
