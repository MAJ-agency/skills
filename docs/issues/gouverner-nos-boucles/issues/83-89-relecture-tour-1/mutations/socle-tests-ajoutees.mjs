// Mutations ajoutées par la relecture, PR « socle-tests » (86 à 88).
const V = 'skills/monorepo/socle-tests/references/scripts/verify';
const PR = `${V}/preuves.mjs`;
const BP = `${V}/preuves.test.mjs`;
const MR = `${V}/mutation-regles.mjs`;
const BM = `${V}/mutation-regles.test.mjs`;
const SY = `${V}/mutation-regles-synthese.mjs`;
const BS = `${V}/mutation-regles-synthese.test.mjs`;
const WF = 'skills/monorepo/socle-tests/references/ci/mutation.yml';
const BW = 'scripts/preuve-suffisante-socle-tests.test.mjs';
export const MUTATIONS = [
  ["Y1 mutation.yml : sans GH_TOKEN (gh n'est pas authentifié : jamais de mesure précédente, sans un mot)", WF, "          GH_TOKEN: ${{ github.token }}\n", "", [BW]],
  ["Y2 mutation.yml : la mesure précédente de n'importe quelle branche", WF, " and .workflow_run.head_branch == env.BRANCHE", "", [BW]],
  ["Y3 mutation.yml : un artefact expiré compte", WF, "select(.expired == false and ", "select(", [BW]],
  ["Y4 mutation.yml : la mesure gardée un jour (un passage manqué la perd)", WF, "          retention-days: 90\n", "          retention-days: 1\n", [BW]],
  ["Y5 mutation.yml : la mesure n'est pas publiée après un échec de la synthèse", WF, "      - name: Mesure datée\n        if: env.CIBLE == 'regles' && always()", "      - name: Mesure datée\n        if: env.CIBLE == 'regles'", [BW]],
  ["Y6 synthèse : une règle non mesurée aujourd'hui est une baisse", SY, ' && r.score !== null && Number.isFinite(', ' && Number.isFinite(', [BS]],
  ["Y7 mutation-regles.mjs : un niveau hors vocabulaire est porté", MR, 'const criticite = NIVEAUX.includes(r?.criticality?.level) ? r.criticality.level : null;', 'const criticite = r?.criticality?.level ?? null;', [BM]],
  ["Y8 preuves.mjs : un index en liste JSON se dit d'un autre schéma (sortie 0)", PR, 'if (lu === null || typeof lu !== "object" || Array.isArray(lu)) return { etat: "illisible" };', 'if (lu === null || typeof lu !== "object") return { etat: "illisible" };', [BP]],
  ["Y9 preuves.mjs : une valeur du rapport garde ses sauts de ligne", PR, '.replace(/[\\p{Cc}\\u2028\\u2029]+/gu, " ")', '.replace(/\\t/g, " ")', [BP]],
  ["Y10 preuves.mjs : le mode jugé lu ailleurs que dans sufficiency (toujours observe)", PR, 'const mode = rapport?.sufficiency === "enforce" ? "enforce" : "observe";', 'const mode = "observe";', [BP]],
];
