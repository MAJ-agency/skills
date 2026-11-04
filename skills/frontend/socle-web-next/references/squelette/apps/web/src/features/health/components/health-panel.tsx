"use client";

import { Button } from "@/components/ui/button";
import { useHealthStatus } from "@/features/health/hooks/use-health";
import { apiErrorMessage } from "@/lib/api-error";

/**
 * Feature d'exemple — PLACEHOLDER. Elle montre la forme d'une feature
 * (api/ → hooks/ → components/, barrel index.ts) sur le seul endpoint que
 * l'API expose. Elle disparaît avec la première feature métier.
 */
export function HealthPanel() {
  const { data, error, isPending, refetch } = useHealthStatus();

  return (
    <section
      aria-labelledby="health-title"
      className="rounded-lg border border-neutral-900/10 bg-white p-6"
    >
      <h2 id="health-title" className="text-lg font-medium">
        État de l&apos;API
      </h2>
      <p className="mt-2 text-sm" role="status">
        {isPending && "Interrogation…"}
        {error && (
          <span className="text-error-500">{apiErrorMessage(error, "L'API ne répond pas.")}</span>
        )}
        {data && (
          <span className="text-success-500">
            {data.service} — {data.status}
          </span>
        )}
      </p>
      <Button className="mt-4" variant="secondary" size="sm" onClick={() => void refetch()}>
        Réinterroger
      </Button>
    </section>
  );
}
