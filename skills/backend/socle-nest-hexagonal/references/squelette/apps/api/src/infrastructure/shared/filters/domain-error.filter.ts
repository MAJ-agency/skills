import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { DomainError } from "@domain/shared/errors/domain.error";

/**
 * Traduit une erreur de domaine en statut HTTP. C'est le SEUL endroit du dépôt
 * qui fait ce lien : le domaine lève des erreurs typées porteuses d'un `code`
 * stable et ne connaît jamais HTTP (apps/api/CLAUDE.md, Error handling).
 *
 * Le corps rendu est toujours le même — `{ code, message }` — et il est déclaré
 * une fois pour toutes en réponse `4XX` globale du document OpenAPI, puisque le
 * filtre est global : « toute route peut refuser avec ce corps » est la vérité
 * de l'API.
 *
 * ## Ajouter une erreur
 *
 * 1. Créer la classe dans `@domain/<domaine>/errors/`, `extends DomainError`,
 *    avec un `code` en SCREAMING_SNAKE stable — il fait partie du contrat
 *    public, un client peut brancher dessus.
 * 2. Ajouter la ligne `CODE: HttpStatus.X` dans la table ci-dessous.
 *
 * Sans ligne dans la table, le refus tombe sur le défaut `400`. C'est
 * volontairement permissif — un oubli dégrade la précision de la réponse, il
 * ne fait pas tomber la requête.
 *
 * ## Choisir le statut
 *
 * - `400` saisie invalide — la requête est malformée, la corriger peut marcher.
 * - `401` non authentifié · `403` authentifié mais pas autorisé.
 * - `404` introuvable — **y compris quand l'existence elle-même est une info à
 *   ne pas divulguer** : un identifiant inconnu et une ressource interdite
 *   répondent pareil (fail-closed).
 * - `409` conflit d'état — rien n'a été écrit, l'état actuel s'y oppose.
 * - `422` sémantiquement invalide alors que la forme est correcte.
 * - `429` cadence — message générique, jamais un oracle.
 *
 * **Ne jamais faire d'un refus un oracle** : deux situations qu'un attaquant ne
 * doit pas distinguer répondent avec le même statut ET le même message.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly status: Record<string, number> = {
    // Vide : le domaine n'est pas encore modélisé. Une ligne s'ajoute ici
    // avec chaque erreur de domaine créée — voir la procédure ci-dessus.
  };

  catch(err: DomainError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse();
    res
      .status(this.status[err.code] ?? HttpStatus.BAD_REQUEST)
      .json({ code: err.code, message: err.message });
  }
}
