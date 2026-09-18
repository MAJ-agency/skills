import { z } from "zod";

/**
 * Environnement PUBLIC de l'app, validé au chargement du module : fail-fast au
 * démarrage plutôt qu'au premier appel réseau. Expo inline `process.env.EXPO_PUBLIC_*`
 * au bundle, donc chaque variable est lue LITTÉRALEMENT (jamais `process.env[nom]`),
 * et toute nouvelle variable s'ajoute ici ET dans `.env.example`.
 *
 * Sur un appareil physique, `localhost` est l'appareil lui-même : pointer
 * EXPO_PUBLIC_API_URL vers l'adresse LAN du poste (`.env.local`, gitignored).
 */
const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
});

const resultat = EnvSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!resultat.success) {
  throw new Error(
    `Configuration invalide — vérifier .env.local et les profils EAS.\n${JSON.stringify(resultat.error.flatten(), null, 2)}`,
  );
}

export const env = resultat.data;
