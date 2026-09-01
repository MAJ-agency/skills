export const CLOCK = "IClock";

/**
 * Source du temps. Injectée par token plutôt qu'un `new Date()` en dur : c'est
 * ce qui rend déterministe tout test dont le comportement dépend de l'instant.
 * Port technique transverse — il manipule des primitives, pas des modèles.
 */
export interface IClock {
  now(): Date;
}
