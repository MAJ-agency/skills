// Le barrel : ce que la feature expose aux routes. Rien d'autre n'est importable de l'extérieur.
export { SanteEcran } from "./components/sante-ecran";
export { useEtatSante } from "./hooks/use-sante";
export type { EtatSante } from "./api/sante-api";
