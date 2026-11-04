"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHealthStatus } from "@/features/health/api/health-api";
import { queryKeys } from "@/lib/query-keys";

/** Le hook de requête : la clé vient de lib/query-keys, l'appel de api/. */
export function useHealthStatus() {
  return useQuery({ queryKey: queryKeys.health.status(), queryFn: fetchHealthStatus, retry: 0 });
}
