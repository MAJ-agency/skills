import { z } from "zod";

/**
 * Point d'entrée du paquet de contrats : UN fichier par sujet sous `src/`,
 * ré-exporté ici. Les consommateurs n'importent que depuis ce barrel, jamais
 * un chemin interne (packages/CLAUDE.md).
 *
 * Aucun contrat métier ici : ils naissent avec le premier use case, une fois
 * le domaine modélisé (ticket 01).
 */

/**
 * Corps d'erreur commun de l'API. C'est la forme que le `DomainErrorFilter`
 * global rend pour TOUT refus — déclarée une fois ici, exposée une fois en
 * réponse `4XX` globale du document OpenAPI.
 *
 * `code` est le code stable de l'erreur de domaine : il fait partie du contrat
 * public, un client peut brancher dessus. `message` est prescriptif — il dit
 * quoi faire, pas seulement ce qui a échoué.
 */
export const ErreurDto = z.object({
  code: z.string(),
  message: z.string(),
});
export type ErreurDto = z.infer<typeof ErreurDto>;
