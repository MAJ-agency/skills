import { z } from "zod";

/**
 * Environnement PUBLIC du client, validé au chargement du module : fail-fast.
 * Next inline `process.env.NEXT_PUBLIC_*` au build, donc chaque variable est
 * lue LITTÉRALEMENT (jamais `process.env[nom]`), et toute nouvelle variable
 * s'ajoute ici ET dans `.env.example` (apps/web/CLAUDE.md, Environment).
 */
const EnvSchema = z.object({
  /** Origine de l'API, sans slash final. En développement, le client passe par
   *  le relais `/api` de next.config.ts et n'a pas besoin de cette valeur. */
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = EnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
});
