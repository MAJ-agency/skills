import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type ReactNode } from "react";
import { messageErreurApi } from "@/lib/api-error";
import { toast } from "@/lib/toast";

/**
 * Retour utilisateur des mutations, traité UNE fois ici et jamais dans un
 * écran : chaque mutation déclare `meta.messageSucces` ou `meta.silencieuse`,
 * et `meta.messageErreur` en repli du message prescriptif de l'API
 * (apps/mobile/CLAUDE.md, Mutations). Même contrat que le client web.
 */
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
      queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
    mutationCache: new MutationCache({
      onSuccess: (_donnees, _variables, _contexte, mutation) => {
        const meta = mutation.meta;
        if (meta?.silencieuse || !meta?.messageSucces) return;
        toast.succes(meta.messageSucces);
      },
      onError: (erreur, _variables, _contexte, mutation) => {
        const meta = mutation.meta;
        if (meta?.silencieuse) return;
        toast.erreur(messageErreurApi(erreur, meta?.messageErreur ?? "Une erreur est survenue."));
      },
    }),
    queryCache: new QueryCache({
      onError: (erreur) => {
        const statut = isAxiosError(erreur) ? erreur.response?.status : undefined;
        if (statut === undefined || statut >= 500) toast.erreur("Le serveur ne répond pas.");
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(creerQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
