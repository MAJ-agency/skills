// Le barrel : ce que la feature expose aux routes. Rien d'autre n'est importable de l'extérieur.
export { SantePanel } from "./components/sante-panel";
export { useEtatSante } from "./hooks/use-sante";
export type { EtatSante } from "./api/sante-api";
