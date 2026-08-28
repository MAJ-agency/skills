import { z } from "zod";

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
