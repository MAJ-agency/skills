import { z } from "zod";
import { apiClient } from "@/lib/api-client";

/**
 * Fonctions d'appel de la feature, UNE par endpoint : elles ne connaissent ni
 * React ni le cache. La forme de réponse vient du contrat quand il existe ;
 * `/health` n'en a pas (sonde anonyme de l'API), on la déclare donc ici, au plus
 * près de l'appel — et nulle part ailleurs.
 */
const HealthStatus = z.object({ status: z.string(), service: z.string() });
export type HealthStatus = z.infer<typeof HealthStatus>;

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await apiClient.get<unknown>("/health");
  return HealthStatus.parse(response.data);
}
