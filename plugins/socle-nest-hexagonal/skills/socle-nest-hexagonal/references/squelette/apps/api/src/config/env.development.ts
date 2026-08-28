/**
 * Valeurs par défaut de DÉVELOPPEMENT / TEST pour les variables qui dépendent de
 * l'environnement. Ce fichier est **committé** : ce ne sont PAS des secrets de
 * production — les vrais secrets vivent dans `.env` (gitignored) en local, ou
 * dans l'environnement de l'hébergeur en production.
 *
 * Elles ne sont appliquées QUE lorsque `NODE_ENV !== "production"`
 * (cf. env-configuration.ts) ; `process.env` (export shell, `.env` local, env
 * de l'hébergeur) a toujours priorité. En production, aucune de ces valeurs
 * n'est injectée : une variable manquante fait échouer le boot (fail-fast).
 *
 * Les placeholders de secret ci-dessous sont publics, et suffisamment longs
 * pour passer la validation de dev. Ils NE doivent jamais servir en production
 * — le durcissement `superRefine` les refuserait de toute façon.
 */
export const devDefaults = {
  DATABASE_URL: "postgres://{{PROJET_SNAKE}}_app:wallet_dev@localhost:5433/{{PROJET_SNAKE}}",
  DATABASE_MIGRATOR_URL: "postgres://{{PROJET_SNAKE}}_migrator:wallet_dev@localhost:5433/{{PROJET_SNAKE}}",
  CORS_ORIGIN: "http://localhost:5173",
  JWT_ACCESS_SECRET: "dev-access-secret-change-me-0123456789",
  CSRF_HMAC_SECRET: "dev-csrf-secret-change-me-0123456789",
} as const;
