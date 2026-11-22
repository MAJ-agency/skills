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
    // Décision 8 du ticket 86 : la grille sous la seule condition du pivot 3 ; un projet sans index au pivot 3 n'y est pas tenu.
    "Projet suivi par Anchorpost, index au pivot 3 (`RULE_ALL_ANC-28` d'Anchorpost) : jamais un nombre de tests",
    "| basse, ou à classer | une preuve | une preuve | une preuve |",
    "| moyenne | une preuve | une preuve | une preuve P1 ou P2 |",
    "| haute | une preuve P2 | une preuve | une preuve P1 ou P2 |",
    // « Prouvée » comme la CLI 2.0.x la calcule (`realisationOf`, SPEC_ALL_ANC-5.28) et RULE_ALL_ANC-28 la dit : le cas
    // normal déclaré, chaque cas prouvé, et, moyenne ou haute, une réponse à chaque famille ; une question la laisse partielle.
    "Une règle est « prouvée » quand elle déclare un cas normal, que chacun de ses cas est prouvé et, moyenne ou haute, que chacune des dix familles de cas limites a sa réponse",
    "« partielle » quand elle a une preuve sans l'être (un cas sans preuve, aucun cas déclaré, pas de cas normal, une famille sans réponse)",
    "ou une question ouverte, qui la laisse partielle",
    "Le gate `preuves` (`scripts/verify/preuves.mjs`, pre-push et fin de tour, posé par le skill `socle-tests`) joue `anchorpost compare`",
  ]);
});

test("le relais preuves dit qu'il sort en 2 quand la CLI est un paquet de l'espace de travail, et que ce dépôt l'adapte", () => {
  exiger("skills/monorepo/socle-tests/SKILL.md", [
    // Décision 6 du ticket 86 : où le gate se pose (le pre-push, la fin de tour, la CI).
    "seulement `pnpm run check:coverage --base-auto` après `pnpm run check`, puis `pnpm run check:preuves --base-auto`",
    "Si la chaîne est posée, `scripts/verify/preuves.mjs` entre dans `gatesRapides` de `.claude/chaine.json` : la fin de tour le joue sans option",
    // A-205 : le coût mesuré, l'arbre de travail jugé (pas le commit poussé), les deux bases d'une PR de mise à jour.
    "(13 à 17 s par passage, mesurés sur Anchorpost à une charge de 14 à 18 : la CLI construit l'index de la base et celui de l'arbre)",
    "Le gate juge l'arbre de travail, non commis et non suivi compris, pas le commit poussé : au pre-push, une preuve restée hors du commit le fait passer, un travail en cours peut le bloquer ; la CI juge le commit.",
    // Constat 1 du tour 2 : contre develop, la comparaison ne voit pas ce que la mise à jour défait du sujet ; la CI le juge.
    // Constat 1 du tour 3 : contre le sujet, ni le gate ni la CI ne voient ce qu'elle défait de develop ; la livraison le juge.
    "Au pre-push et en fin de tour, une branche de mise à jour d'un sujet se compare à la plus proche de ses deux bases, jamais à la fusion recalculée de `coverage-diff`, et chacune a son angle mort : le sujet quand il a plus de commits que develop n'en apporte, la base de la CI, qui ne voit pas plus que le gate ce que la mise à jour défait de develop (une règle, un cas, une criticité remis comme sur le sujet) : la livraison du sujet, comparée à develop, le juge ; sinon develop, qui ne voit pas ce que la mise à jour défait du sujet (une règle, un cas, une criticité remis comme sur develop) : la CI, qui compare à la cible de la PR, le juge.",
    "Dans le job de qualité, sur `pull_request`, le rapport de preuves : `node scripts/verify/preuves.mjs --base \"origin/$BASE\"` (même `env:`, `fetch-depth: 0`)",
    "dans un dépôt où la CLI est un paquet de l'espace de travail et non une dépendance installée (le dépôt de la CLI elle-même), ce fichier n'existe pas et le relais sort en 2, au pre-push comme en fin de tour ; ce dépôt l'adapte à la pose, comme son relais `anchorpost.mjs`.",
  ]);
  // Constat 2 du tour 3 : le catalogue du skill dit les deux bases comme SKILL.md, et les quatre imports comme la note.
  exiger("skills/monorepo/socle-tests/references/CONTENU.md", [
    "(`BASE_DEFAUT`, `baseDepuisPush`, `choisirBase` et `decisionSansBase` de `coverage-diff-regles.mjs`)",
    "Au pre-push et en fin de tour, une branche de mise à jour d'un sujet se compare à la plus proche de ses deux bases, jamais à la fusion recalculée : contre le sujet (il a plus de commits que develop n'en apporte), ce que la mise à jour défait de develop ne se voit pas, ni en CI, qui compare au même sujet, et la livraison du sujet le juge ; contre develop (il en apporte autant ou plus), ce qu'elle défait du sujet ne se voit pas, et la CI le juge.",
  ]);
  // Ce qu'une repose pièce par pièce doit reposer avec : sans eux, le relais ne se charge pas (exports de la base) ou son
  // banc fait échouer `check:tickets` (l'environnement de banc), dans un projet posé avant ces fichiers (Anchorpost).
  exiger("NOTES-DE-VERSION.md", [
    "le relais importe `BASE_DEFAUT`, `baseDepuisPush`, `choisirBase` et `decisionSansBase` de `scripts/verify/coverage-diff-regles.mjs`, du socle 3.10.4 ou plus récent, et son banc lit `scripts/docs/environnement-de-banc.mjs` du socle 7.21.0 : un projet à qui l'un manque, ou qui l'a d'avant, le repose avec ; sinon le relais ne se charge pas (`coverage-diff-regles.mjs` d'avant 3.10.1), ou son banc fait échouer `check:tickets` ; dans le dépôt de la CLI elle-même, le relais s'adapte comme son `anchorpost.mjs`)",
    "le point 5 de l'ADR du score de mutation du projet s'amende comme le gabarit.",
  ]);
});

test("le workflow de mutation date sa mesure, la publie en artefact et relit la précédente, sans expression dans un run:", () => {
  const MUTATION = "skills/monorepo/socle-tests/references/ci/mutation.yml";
  const texte = readFileSync(join(RACINE, MUTATION), "utf8");
  exiger(MUTATION, [
    "permissions: contents: read actions: read",
    "name: mesure-regles path: apps/api/reports/mutation/mesure-regles.json",
    "run: node ../../scripts/verify/mutation-regles-synthese.mjs --mesure reports/mutation/mesure-regles.json --precedente \"$RUNNER_TEMP/precedente/mesure-regles.json\" >> \"$GITHUB_STEP_SUMMARY\"",
    // Décision 3 du ticket 88 : le dernier artefact de ce nom, et un appel ou un téléchargement en échec ne fait pas
    // échouer le passage (`bash -e`) : la synthèse dit qu'il n'y a pas de mesure précédente lisible.
    "gh api \"repos/$GITHUB_REPOSITORY/actions/artifacts?name=mesure-regles&per_page=30\"",
    "][0].workflow_run.id // empty') || id=''",
    "gh run download \"$id\" -n mesure-regles -D \"$RUNNER_TEMP/precedente\" || echo \"mesure précédente illisible\"",
    // Décision 3 du ticket 88 : `gh` authentifié par le jeton du job, le dernier artefact non expiré de la branche par défaut.
    "if: env.CIBLE == 'regles' env: GH_TOKEN: ${{ github.token }} BRANCHE: ${{ github.event.repository.default_branch }}",
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
  assert.ok(texte.indexOf("name: Mutation des règles qui ont des preuves") < texte.indexOf("name: Synthèse par règle"), "la synthèse lit le rapport de la mutation");
  assert.ok(texte.indexOf("name: Synthèse par règle") < texte.indexOf("name: Mesure datée"), "la mesure se publie après que la synthèse l'a écrite");
});
