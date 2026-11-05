// Mutation testing du noyau critique (skill socle-tests, ADR « score de mutation ») :
// `pnpm --filter @{{SCOPE}}/{{PROJET}}-api mutation`. Lancé à la main, après une modification
// d'un fichier du périmètre et avant de relever le plancher — jamais à chaque PR (coût).
// Périmètre : les fonctions pures qui portent l'argent, les dates, les fichiers et les exports.
// Dépendances, à la première mesure : pnpm add -D @stryker-mutator/core @stryker-mutator/vitest-runner --filter <paquet>
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  // pnpm n'expose pas les plugins à la découverte automatique de Stryker : on les nomme.
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.config.ts" }, // les suites sans base : chaque mutant les rejoue
  coverageAnalysis: "perTest",
  mutate: [
    // "src/domain/<module>/<fonction-pure>.ts",
  ],
  incremental: true,
  incrementalFile: "reports/stryker-incremental.json",
  reporters: ["clear-text", "progress", "html"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  // Plancher daté : posé sous la mesure du jour, relevé quand elle progresse, jamais baissé.
  // {{DATE}} : pas encore de mesure → break 0 ; poser le plancher à la première mesure.
  thresholds: { high: 90, low: 80, break: 0 },
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
};
