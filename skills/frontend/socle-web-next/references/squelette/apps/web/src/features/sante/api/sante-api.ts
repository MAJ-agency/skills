import { z } from "zod";
import { apiClient } from "@/lib/api-client";

/**
 * Fonctions d'appel de la feature, UNE par endpoint : elles ne connaissent ni
 * React ni le cache. La forme de réponse vient du contrat quand il existe ;
 * `/health` n'en a pas (sonde anonyme de l'API), on la déclare donc ici, au plus
 * près de l'appel — et nulle part ailleurs.
 */
const EtatSante = z.object({ status: z.string(), service: z.string() });
export type EtatSante = z.infer<typeof EtatSante>;

export async function lireEtatSante(): Promise<EtatSante> {
  const reponse = await apiClient.get<unknown>("/health");
  return EtatSante.parse(reponse.data);
}
