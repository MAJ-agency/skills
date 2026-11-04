/**
 * Source UNIQUE des clés de cache TanStack Query. Une feature n'écrit jamais un
 * tableau de clé à la main : elle prend la fabrique ici, pour que l'invalidation
 * d'un sujet (`all`) atteigne toutes ses requêtes (apps/mobile/CLAUDE.md, State).
 *
 * Un espace par sujet : `all`, puis `list(filters)` / `detail(id)` selon le besoin.
 */
export const queryKeys = {
  health: {
    all: ["health"] as const,
    status: () => [...queryKeys.health.all, "status"] as const,
  },
} as const;
