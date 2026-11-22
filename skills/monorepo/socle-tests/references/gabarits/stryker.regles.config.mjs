// Mutation des règles qui ont des preuves (skill socle-tests, ADR « score de mutation ») :
// `pnpm --filter @{{SCOPE}}/{{PROJET}}-api mutation:regles`. Hérite de la configuration du noyau
// (`stryker.config.mjs` : runner Vitest, plugins, analyse de couverture) et n'en change que ceci.
// Le périmètre n'est pas écrit ici : c'est l'union des `code` des règles `proven` (et `partial` au pivot 3) de l'index
// commis `anchorpost/anchorpost.json`, restreinte aux fichiers de ce paquet (une config par paquet qui teste).
// Sans index Anchorpost, `mutation-regles.mjs --lancer` ne lance rien et le dit. `STRYKER_MUTATE`
// (fichiers séparés par des virgules, relatifs au paquet) remplace le périmètre pour un essai local ;
// `PROJET_RACINE` (racine du dépôt) n'a besoin d'être posée que si le dépôt n'a pas la forme du socle.
import base from "./stryker.config.mjs";
import { perimetreDuPaquet } from "../../scripts/verify/mutation-regles.mjs";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  ...base,
  mutate: process.env.STRYKER_MUTATE ? process.env.STRYKER_MUTATE.split(",") : perimetreDuPaquet().mutate,
  incrementalFile: "reports/stryker-incremental-regles.json",
  // `json` : la synthèse par règle en est lue (`mutation-regles-synthese.mjs`).
  reporters: ["clear-text", "progress", "html", "json"],
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  // `break: 0` : rapport seulement. Le plancher du noyau (`stryker.config.mjs`) ne s'applique pas ici :
  // un plancher se pose sous une mesure, et il n'y a pas encore de mesure par règle.
  thresholds: { high: 90, low: 80, break: 0 },
};
