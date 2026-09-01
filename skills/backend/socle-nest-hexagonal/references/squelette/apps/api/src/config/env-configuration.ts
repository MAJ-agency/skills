// Charge le `.env` local (gitignored) dans process.env avant toute lecture.
// Le fichier vit à la RACINE du monorepo, mais l'API peut être lancée depuis
// `apps/api` (pnpm --dir) comme depuis la racine (turbo) : on prend le premier
// des deux qui existe. Sans ce repli, un lancement depuis `apps/api` ne verrait
// AUCUN `.env` et retomberait silencieusement sur les défauts de dev.
import { existsSync } from "node:fs";
import { config as chargerEnv } from "dotenv";
// …sauf sous Vitest : les tests ne doivent JAMAIS hériter du `.env` de la
// machine (identifiants réels compris) — ils tournent sur les défauts
// déterministes de `env.development.ts`, plus les variables posées
// explicitement (overrides de suite, CI).
if (!process.env.VITEST) {
  chargerEnv({ path: existsSync(".env") ? ".env" : "../../.env" });
}
import { z } from "zod";
import { devDefaults } from "./env.development";

/**
 * Validation de l'environnement au démarrage (fail-fast).
 * L'API refuse de booter si une variable est absente ou malformée.
 *
 * Deux familles de variables :
 *  - **indépendantes de l'environnement** → un `.default()` est légitime ici
 *    (même valeur partout : PORT, TTL des jetons…).
 *  - **dépendantes de l'environnement** → AUCUN default ici. Les valeurs de
 *    dev/test viennent de `env.development.ts` (committé, appliqué hors prod) ;
 *    en production elles DOIVENT être fournies par l'environnement (secrets via
 *    `.env` local gitignored, ou l'env de l'hébergeur), sinon le boot échoue.
 *
 * Toute variable propre à une intégration du projet s'ajoute ici — et dans
 * `.env.example` — au moment où son adapter est écrit, jamais d'avance.
 */
const MIN_SECRET_PROD = 32;

const EnvSchema = z
  .object({
    // — Indépendantes de l'environnement (default légitime) —
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900), // 15 min
    REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

    // — Dépendantes de l'environnement (pas de default ; cf. env.development.ts) —
    // Deux rôles PostgreSQL : le runtime en rôle restreint, les migrations en
    // rôle propriétaire. Elle vaut même sans RLS — cette séparation
    // reste utile pour elle-même : le runtime n'a pas à pouvoir modifier le schéma.
    DATABASE_URL: z.string().url(),
    DATABASE_MIGRATOR_URL: z.string().url(),
    CORS_ORIGIN: z.string(),
    JWT_ACCESS_SECRET: z.string().min(16),
    CSRF_HMAC_SECRET: z.string().min(16),
  })
  // Durcissement production : secrets longs + origine https.
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== "production") return;
    for (const champ of ["JWT_ACCESS_SECRET", "CSRF_HMAC_SECRET"] as const) {
      if (cfg[champ].length < MIN_SECRET_PROD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [champ],
          message: `${champ} doit faire au moins ${MIN_SECRET_PROD} caractères en production.`,
        });
      }
    }
    if (!cfg.CORS_ORIGIN.startsWith("https://")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGIN"],
        message:
          "CORS_ORIGIN doit être une origine https:// explicite en production (le check CSRF Origin en dépend).",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

// Hors production, les valeurs de dev/test comblent les variables non fournies ;
// process.env (shell, `.env`, env de l'hébergeur) garde toujours la priorité.
const nodeEnv = process.env.NODE_ENV ?? "development";
const source: Record<string, unknown> =
  nodeEnv === "production" ? { ...process.env } : { ...devDefaults, ...process.env };

export const env: Env = EnvSchema.parse(source);
