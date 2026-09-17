/**
 * Point d'entrée du paquet d'utilitaires : UN fichier par sujet sous `src/`,
 * chaque fonction accompagnée de son `*.spec.ts`, ré-exporté ici.
 *
 * Ce paquet n'existe que parce qu'au moins deux briques partagent une fonction
 * pure (formatage, normalisation, calcul sans I/O). Il ne porte ni composant,
 * ni store, ni client HTTP : chaque client a les siens (packages/CLAUDE.md).
 */
export {};
