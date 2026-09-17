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
function origineApi(): string {
  const navigateurEnDev = typeof window !== "undefined" && env.NODE_ENV === "development";
  return navigateurEnDev ? "/api" : env.NEXT_PUBLIC_API_URL;
}

export const apiClient = axios.create({
  baseURL: origineApi(),
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
 * ticket. Quand elle arrive, seul `CHEMIN_REFRESH` et `onSessionPerdue`
 * sont à brancher.
 */
const CHEMIN_REFRESH = "/auth/refresh";
const CHEMINS_SANS_REFRESH = ["/auth/login", "/auth/logout", CHEMIN_REFRESH];

let refreshEnVol: Promise<void> | undefined;
let onSessionPerdue: () => void = () => {};

/** Branché par le layout : quoi faire quand la session ne peut pas être rétablie. */
export function definirOnSessionPerdue(callback: () => void): void {
  onSessionPerdue = callback;
}

apiClient.interceptors.response.use(undefined, async (erreur: unknown) => {
  if (!axios.isAxiosError(erreur) || erreur.response?.status !== 401 || !erreur.config) {
    throw erreur;
  }
  const config = erreur.config as typeof erreur.config & { _rejouee?: boolean };
  const chemin = config.url ?? "";
  if (config._rejouee || CHEMINS_SANS_REFRESH.some((c) => chemin.startsWith(c))) {
    throw erreur;
  }
  try {
    refreshEnVol ??= apiClient.post(CHEMIN_REFRESH).then(() => undefined);
    await refreshEnVol;
  } catch {
    onSessionPerdue();
    throw erreur;
  } finally {
    refreshEnVol = undefined;
  }
  config._rejouee = true;
  return apiClient.request(config);
});
