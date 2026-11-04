// Le barrel : ce que la feature expose aux routes. Rien d'autre n'est importable de l'extérieur.
export { HealthScreen } from "./components/health-screen";
export { useHealthStatus } from "./hooks/use-health";
export type { HealthStatus } from "./api/health-api";
