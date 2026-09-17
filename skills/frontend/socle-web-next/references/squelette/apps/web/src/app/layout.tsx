import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{TITRE}}",
  description: "{{DESCRIPTION}}",
};

/**
 * Racine de composition du client : providers globaux et rien d'autre.
 * L'état serveur (TanStack Query), l'état d'URL (nuqs) et les toasts sont
 * posés ici une fois pour toutes (apps/web/CLAUDE.md, State).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="{{LANGUE_HTML}}">
      <body>
        <NuqsAdapter>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
