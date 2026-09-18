#!/usr/bin/env node
// `pnpm check` — la porte de qualité unique : jouée par le hook pre-push, rejouée
// à l'identique par le job CI « qualite ». Les étapes vont de la moins chère à la
// plus chère, et chaque échec dit QUOI faire — c'est ce message que lit l'agent.
//
// Critère de découpe : le besoin d'infrastructure, pas la nature de l'étape. Tout
// ce qui tourne sans base ni service est ici ; `*.db.spec.ts` (script test:db)
// tourne en CI avec Postgres. Voir docs/methode/pare-feu-ci.md.
import { spawnSync } from "node:child_process";

const etapes = [
  ["build", "turbo run build", "une brique ne compile pas : lire l'erreur TypeScript ou Next/Metro au-dessus."],
  ["lint", "eslint .", "une règle ESLint est violée — souvent une frontière d'architecture : le message cite le CLAUDE.md qui la fonde."],
  ["typecheck", "turbo run typecheck", "les types ne passent pas : corriger le type, jamais `as` ni `any` pour faire passer."],
  ["test", "turbo run test", "un test rouge : lire son nom, il porte le comportement (et l'identifiant de règle) attendu."],
  ["check:cycles", "turbo run check:cycles", "une dépendance circulaire : casser le cycle par un port, pas par un import paresseux."],
  ["check:gates", "turbo run check:gates", "un gate propre à une brique échoue (check:arch, openapi:check, cliquet de dette, bundle) : son message dit lequel."],
];

const debut = Date.now();
for (const [nom, commande, conseil] of etapes) {
  console.log(`\n▶ ${nom}  (${commande})`);
  const r = spawnSync(commande, { shell: true, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\n✗ check — échec à l'étape « ${nom} ».\n  ${conseil}\n  Relancer seulement cette étape : pnpm ${nom}`);
    process.exit(r.status ?? 1);
  }
}
console.log(`\n✔ check — ${etapes.length} étapes vertes en ${Math.round((Date.now() - debut) / 1000)} s.`);
