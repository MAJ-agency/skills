import { z } from "zod";

/**
 * Point d'entrée du paquet de contrats : UN fichier par sujet sous `src/`,
 * ré-exporté ici. Les consommateurs n'importent que depuis ce barrel, jamais
 * un chemin interne (packages/CLAUDE.md).
 *
 * Aucun contrat métier ici : ils naissent avec le premier use case, une fois
 * le domaine modélisé (ticket 1).
 */

// Le premier sujet se ré-exporte AVEC son extension : `export * from "./roles.ts";`
// (packages/CLAUDE.md § Layout). L'API charge ces sources en direct par Node, sans
// build, qui exige le chemin complet d'un module ESM : `./roles` nu passe le typecheck
// et casse `openapi:check` (ERR_MODULE_NOT_FOUND). TypeScript l'admet par
// `allowImportingTsExtensions` (paquets et clients, sans émission) et
// `rewriteRelativeImportExtensions` (API, qui émet).

/**
 * Corps d'erreur commun de l'API. C'est la forme que le `DomainErrorFilter`
 * global rend pour TOUT refus — déclarée une fois ici, exposée une fois en
 * réponse `4XX` globale du document OpenAPI.
 *
 * `code` est le code stable de l'erreur de domaine : il fait partie du contrat
 * public, un client peut brancher dessus. `message` est prescriptif — il dit
 * quoi faire, pas seulement ce qui a échoué.
 */
export const ErrorDto = z.object({
  code: z.string(),
  message: z.string(),
});
export type ErrorDto = z.infer<typeof ErrorDto>;
