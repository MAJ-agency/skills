import { SantePanel } from "@/features/sante";

/**
 * Une page est un emballage mince : elle rend un composant de feature, rien
 * d'autre. Zéro logique, zéro composant défini ici (apps/web/CLAUDE.md, Routes).
 */
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">{{TITRE}}</h1>
      <p className="mt-2 text-sm text-neutral-900/70">{{DESCRIPTION}}</p>
      <div className="mt-8">
        <SantePanel />
      </div>
    </main>
  );
}
