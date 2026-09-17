"use client";

import { useQuery } from "@tanstack/react-query";
import { lireEtatSante } from "@/features/sante/api/sante-api";
import { queryKeys } from "@/lib/query-keys";

/** Le hook de requête : la clé vient de lib/query-keys, l'appel de api/. */
export function useEtatSante() {
  return useQuery({ queryKey: queryKeys.sante.etat(), queryFn: lireEtatSante, retry: 0 });
}
