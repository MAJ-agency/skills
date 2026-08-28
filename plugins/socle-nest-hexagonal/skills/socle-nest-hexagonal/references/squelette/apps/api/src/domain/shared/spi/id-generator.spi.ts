export const ID_GENERATOR = "IIdGenerator";

/**
 * Frappe des identifiants côté application (UUID v7) — jamais par la
 * base. Le modèle reçoit son `id` à la construction ; il ne le demande à
 * personne.
 */
export interface IIdGenerator {
  nouvelId(): string;
}
