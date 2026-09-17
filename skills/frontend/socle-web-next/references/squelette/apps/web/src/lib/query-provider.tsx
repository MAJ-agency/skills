"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { messageErreurApi } from "@/lib/api-error";

/**
 * Retour utilisateur des mutations, traité UNE fois ici et jamais dans un
 * composant : chaque mutation déclare `meta.messageSucces` ou `meta.silencieuse`,
 * et `meta.messageErreur` en repli du message prescriptif de l'API
 * (apps/web/CLAUDE.md, Mutations).
 */
// Un alias de type, pas une interface : `Register` exige un `Record<string, unknown>`,
// et une interface (sans signature d'index) n'y est pas assignable — le meta
// retomberait silencieusement sur `Record<string, unknown>`.
type MutationMeta = {
  messageSucces?: string;
  messageErreur?: string;
  silencieuse?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationMeta;
  }
}

function creerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
    mutationCache: new MutationCache({
      onSuccess: (_donnees, _variables, _contexte, mutation) => {
        const meta = mutation.meta;
        if (meta?.silencieuse || !meta?.messageSucces) return;
        toast.success(meta.messageSucces);
      },
      onError: (erreur, _variables, _contexte, mutation) => {
        const meta = mutation.meta;
        if (meta?.silencieuse) return;
        toast.error(messageErreurApi(erreur, meta?.messageErreur ?? "Une erreur est survenue."));
      },
    }),
    queryCache: new QueryCache({
      onError: (erreur) => {
        const statut = isAxiosError(erreur) ? erreur.response?.status : undefined;
        if (statut === undefined || statut >= 500) toast.error("Le serveur ne répond pas.");
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Un client par montage, jamais partagé entre requêtes serveur.
  const [client] = useState(creerQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
