// Bancs de la part de `skills` de la preuve suffisante (SPEC_ALL_ANC-5 § 8, tickets 83 à 89 de gouverner-nos-boucles) :
// les textes que les skills posent, lus à plat comme dans `depot.test.mjs` (blancs et sauts de ligne réduits à une
// espace : une phrase exigée peut changer de ligne, une phrase glissée au milieu d'un passage le rompt).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const RACINE = new URL("..", import.meta.url).pathname;
const SKILLS_CHAINE = "skills/chaine";
const lignes = (w) => w.split(/\r?\n/);
const plat = (t) => t.replace(/\s+/g, " ");
const exiger = (chemin, phrases) => {
  const texte = plat(readFileSync(join(RACINE, chemin), "utf8"));
  const absentes = phrases.filter((p) => !texte.includes(plat(p)));
  assert.deepEqual(absentes, [], `${chemin} : passages absents : ${absentes.join(" | ")}`);
};

// K2 et K6 de la preuve suffisante (SPEC_ALL_ANC-5 § 5, § 7 et § 8) : la grille par criticité de la fiche des tests,
// l'étiquette de cas, et le workflow de mutation qui date sa mesure, la publie et relit la précédente.
test("la fiche des tests porte la grille par criticité, l'étiquette de cas et le niveau du bout en bout d'une CLI", () => {
  const FICHE_TESTS = "skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md";
  exiger(FICHE_TESTS, [
    "`*.e2e-cli.spec.ts` qui lance la CLI construite en sous-processus, bout en bout d'une CLI, P2)",
    "- **Un test qui prouve un cas attendu de la règle le nomme après un `#`** : `it('[RULE_ALL_LIC-2#seconde-licence] refuse une seconde licence quand la saison en a déjà une')`.",
    "## Ce qu'une règle doit prouver, selon sa criticité",
    "| basse, ou à classer | une preuve | une preuve | une preuve |",
    "| moyenne | une preuve | une preuve | une preuve P1 ou P2 |",
    "| haute | une preuve P2 | une preuve | une preuve P1 ou P2 |",
    "Le gate `preuves` (`scripts/verify/preuves.mjs`, pre-push et fin de tour, posé par le skill `socle-tests`) joue `anchorpost compare`",
  ]);
});

test("le relais preuves dit qu'il sort en 2 quand la CLI est un paquet de l'espace de travail, et que ce dépôt l'adapte", () => {
  exiger("skills/monorepo/socle-tests/SKILL.md", [
    "dans un dépôt où la CLI est un paquet de l'espace de travail et non une dépendance installée (le dépôt de la CLI elle-même), ce fichier n'existe pas et le relais sort en 2, au pre-push comme en fin de tour ; ce dépôt l'adapte à la pose, comme son relais `anchorpost.mjs`.",
  ]);
});

test("le workflow de mutation date sa mesure, la publie en artefact et relit la précédente, sans expression dans un run:", () => {
  const MUTATION = "skills/monorepo/socle-tests/references/ci/mutation.yml";
  const texte = readFileSync(join(RACINE, MUTATION), "utf8");
  exiger(MUTATION, [
    "permissions: contents: read actions: read",
    "name: mesure-regles path: apps/api/reports/mutation/mesure-regles.json",
    "run: node ../../scripts/verify/mutation-regles-synthese.mjs --mesure reports/mutation/mesure-regles.json --precedente \"$RUNNER_TEMP/precedente/mesure-regles.json\" >> \"$GITHUB_STEP_SUMMARY\"",
    "gh run download \"$id\" -n mesure-regles -D \"$RUNNER_TEMP/precedente\"",
    // Décision 3 du ticket 88 : `gh` authentifié par le jeton du job, le dernier artefact non expiré de la branche par défaut.
    "env: GH_TOKEN: ${{ github.token }} BRANCHE: ${{ github.event.repository.default_branch }}",
    "select(.expired == false and .workflow_run.head_branch == env.BRANCHE)",
    // Décision 4 : publiée même après un échec, gardée 90 jours.
    "- name: Mesure datée if: env.CIBLE == 'regles' && always() uses: actions/upload-artifact@",
    "name: mesure-regles path: apps/api/reports/mutation/mesure-regles.json if-no-files-found: ignore retention-days: 90",
  ]);
  // Chaque ligne d'un `run:`, la sienne et celles de son bloc (`run: |`, plus indentées que la clé).
  const runs = [];
  let bloc = -1;
  for (const l of texte.split("\n")) {
    const retrait = /^\s*/.exec(l)[0].length;
    if (bloc >= 0 && l.trim() !== "" && retrait <= bloc) bloc = -1;
    if (bloc >= 0) runs.push(l);
    const cle = /^(\s*)(?:- )?run:(.*)$/.exec(l);
    if (cle) {
      runs.push(l);
      if (cle[2].trim() === "|") bloc = cle[1].length;
    }
  }
  assert.ok(runs.some((l) => l.includes("gh run download")), `${MUTATION} : le bloc d'un run: est lu`);
  assert.deepEqual(runs.filter((l) => l.includes("${{")), [], `${MUTATION} : une expression dans un run:`);
  assert.ok(texte.indexOf("name: Mesure précédente") < texte.indexOf("name: Mutation des règles qui ont des preuves"), "la mesure précédente se lit avant que la nouvelle ne soit publiée");
});
