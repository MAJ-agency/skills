"use client";

import { Button } from "@/components/ui/button";
import { useEtatSante } from "@/features/sante/hooks/use-sante";
import { messageErreurApi } from "@/lib/api-error";

/**
 * Feature d'exemple — PLACEHOLDER. Elle montre la forme d'une feature
 * (api/ → hooks/ → components/, barrel index.ts) sur le seul endpoint que
 * l'API expose. Elle disparaît avec la première feature métier.
 */
export function SantePanel() {
  const { data, error, isPending, refetch } = useEtatSante();

  return (
    <section aria-labelledby="sante-titre" className="rounded-lg border border-neutral-900/10 bg-white p-6">
      <h2 id="sante-titre" className="text-lg font-medium">
        État de l&apos;API
      </h2>
      <p className="mt-2 text-sm" role="status">
        {isPending && "Interrogation…"}
        {error && <span className="text-error-500">{messageErreurApi(error, "L'API ne répond pas.")}</span>}
        {data && (
          <span className="text-success-500">
            {data.service} — {data.status}
          </span>
        )}
      </p>
      <Button className="mt-4" variante="secondaire" taille="sm" onClick={() => void refetch()}>
        Réinterroger
      </Button>
    </section>
  );
}
