"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";

/**
 * Retour utilisateur des mutations, traité UNE fois ici et jamais dans un
 * composant : chaque mutation déclare `meta.successMessage` ou `meta.silent`,
 * et `meta.errorMessage` en repli du message prescriptif de l'API
 * (apps/web/CLAUDE.md, Mutations).
 */
// Un alias de type, pas une interface : `Register` exige un `Record<string, unknown>`,
// et une interface (sans signature d'index) n'y est pas assignable — le meta
// retomberait silencieusement sur `Record<string, unknown>`.
type MutationMeta = {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationMeta;
  }
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        const meta = mutation.meta;
        if (meta?.silent || !meta?.successMessage) return;
        toast.success(meta.successMessage);
      },
      onError: (error, _variables, _context, mutation) => {
        const meta = mutation.meta;
        if (meta?.silent) return;
        toast.error(apiErrorMessage(error, meta?.errorMessage ?? "Une erreur est survenue."));
      },
    }),
    queryCache: new QueryCache({
      onError: (error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === undefined || status >= 500) toast.error("Le serveur ne répond pas.");
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Un client par montage, jamais partagé entre requêtes serveur.
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
