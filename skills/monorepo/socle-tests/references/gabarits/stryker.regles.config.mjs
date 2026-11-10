// Mutation des règles prouvées (skill socle-tests, ADR « score de mutation ») :
// `pnpm --filter @{{SCOPE}}/{{PROJET}}-api mutation:regles` (script `node ../../scripts/verify/mutation-regles.mjs --lancer`).
// Le périmètre n'est pas écrit ici : c'est l'union des `code` des règles `proven` de l'index commis
// `anchorpost/anchorpost.json`, restreinte aux fichiers de ce paquet (une config par paquet qui teste).
// Sans index Anchorpost, le script ne lance rien et le dit. Aucun plancher : le rapport des survivants
// par règle (règle → fichiers → mutants) est la sortie ; le plancher reste celui du noyau (`mutation`).
// Dépendances, à la première mesure : pnpm add -D @stryker-mutator/core @stryker-mutator/vitest-runner --filter <paquet>
import { perimetreDuPaquet } from "../../scripts/verify/mutation-regles.mjs";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  // pnpm n'expose pas les plugins à la découverte automatique de Stryker : on les nomme.
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.config.ts" }, // les suites sans base : chaque mutant les rejoue
  coverageAnalysis: "perTest",
  mutate: perimetreDuPaquet().mutate,
  incremental: true,
  incrementalFile: "reports/stryker-regles-incremental.json",
  // `json` : le rapport des survivants par règle en est lu (`mutation-regles.mjs --lancer`).
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: "reports/mutation-regles/index.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  // Pas de `thresholds.break` : un plancher se pose sous une mesure, et il n'y en a pas encore.
  thresholds: { high: 90, low: 80 },
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
};
