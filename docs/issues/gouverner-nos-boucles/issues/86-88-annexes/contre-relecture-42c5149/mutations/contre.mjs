// Mutations de la contre-relecture de la PR 154 (sommet 42c5149) : chacune remplace un texte exact d'un fichier, joue
// les bancs qu'elle vise, dit ROUGE (un banc échoue) ou VERTE (aucun banc ne la voit), et remet le fichier. Deux séries :
//  - « seul » : les mutations W et F de l'annexe (86-88-annexes/mutations.mjs), rejouées contre le seul banc de texte
//    (`scripts/preuve-suffisante-socle-tests.test.mjs`), sans `scripts/depot.test.mjs` : c'est ce banc qui doit les voir ;
//  - « C » : les mutations ajoutées par la contre-relecture.
// À lancer depuis la racine d'un clone à 42c5149 (ou retouché) : `node <chemin>/contre.mjs [<nom>…]`. Sortie 0 toujours :
// le journal dit l'issue de chacune, comparée à celle qu'on attend (`attendu`).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const V = 'skills/monorepo/socle-tests/references/scripts/verify';
const P = `${V}/preuves.mjs`;
const BP = `${V}/preuves.test.mjs`;
const M = `${V}/mutation-regles.mjs`;
const BM = `${V}/mutation-regles.test.mjs`;
const S = `${V}/mutation-regles-synthese.mjs`;
const BS = `${V}/mutation-regles-synthese.test.mjs`;
const W = 'skills/monorepo/socle-tests/references/ci/mutation.yml';
const F = 'skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md';
const K = 'skills/monorepo/socle-tests/SKILL.md';
const PS = 'scripts/preuve-suffisante-socle-tests.test.mjs';

const MUTATIONS = [
  // L'annexe, contre le seul banc de texte.
  ['W1 seul : sans la permission de lire l\'artefact précédent', W, "  actions: read # lire l'artefact de la mesure précédente\n", '', [PS]],
  ['W2 seul : la mesure n\'est pas publiée', W, '          name: mesure-regles\n          path: apps/api/reports/mutation/mesure-regles.json', '          name: mesure-regles\n          path: apps/api/reports/mutation/', [PS]],
  ['W3 seul : une expression dans un run:', W, 'id=$(gh api "repos/$GITHUB_REPOSITORY/', 'id=$(gh api "repos/${{ github.repository }}/', [PS]],
  ['W4 seul : sans GH_TOKEN', W, '          GH_TOKEN: ${{ github.token }}\n', '', [PS]],
  ['W5 seul : la mesure précédente de n\'importe quelle branche', W, ' and .workflow_run.head_branch == env.BRANCHE', '', [PS]],
  ['W6 seul : un artefact expiré compte', W, 'select(.expired == false and ', 'select(', [PS]],
  ['W7 seul : la mesure gardée un jour', W, '          retention-days: 90\n', '          retention-days: 1\n', [PS]],
  ['W8 seul : la mesure n\'est pas publiée après un échec', W, "      - name: Mesure datée\n        if: env.CIBLE == 'regles' && always()", "      - name: Mesure datée\n        if: env.CIBLE == 'regles'", [PS]],
  ['F1 seul : la grille d\'une règle haute n\'exige pas le bout en bout', F, '| haute                 | une preuve P2          |', '| haute                 | une preuve             |', [PS]],
  ['F2 seul : sans l\'étiquette de cas', F, "`it('[RULE_ALL_LIC-2#seconde-licence] refuse", "`it('[RULE_ALL_LIC-2] refuse", [PS]],
  ['F3 seul : la limite du relais dans le dépôt de la CLI n\'est plus dite', K, " Le relais lance `node_modules/.bin/anchorpost` à la racine : dans un dépôt où la CLI est un paquet de l'espace de travail et non une dépendance installée (le dépôt de la CLI elle-même), ce fichier n'existe pas et le relais sort en 2, au pre-push comme en fin de tour ; ce dépôt l'adapte à la pose, comme son relais `anchorpost.mjs`.", '', [PS]],

  // Ajoutées : le workflow (le banc de texte est sa seule garde, A-202).
  ['C1 mutation.yml : l\'artefact cherché sans son nom (le dernier artefact de la branche, de n\'importe quel workflow)', W, 'actions/artifacts?name=mesure-regles&per_page=30', 'actions/artifacts?per_page=30', [PS]],
  ['C2 mutation.yml : la mesure datée publiée avant que la synthèse ne l\'écrive', W,
    "      - name: Synthèse par règle\n        # `always()` : un passage interrompu (délai, Stryker tué) dit « pas de rapport » au lieu de se taire.\n        if: env.CIBLE == 'regles' && always()\n        working-directory: apps/api\n        run: node ../../scripts/verify/mutation-regles-synthese.mjs --mesure reports/mutation/mesure-regles.json --precedente \"$RUNNER_TEMP/precedente/mesure-regles.json\" >> \"$GITHUB_STEP_SUMMARY\"\n      - name: Mesure datée\n        if: env.CIBLE == 'regles' && always()\n        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2\n        with:\n          name: mesure-regles\n          path: apps/api/reports/mutation/mesure-regles.json\n          if-no-files-found: ignore\n          retention-days: 90\n",
    "      - name: Mesure datée\n        if: env.CIBLE == 'regles' && always()\n        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2\n        with:\n          name: mesure-regles\n          path: apps/api/reports/mutation/mesure-regles.json\n          if-no-files-found: ignore\n          retention-days: 90\n      - name: Synthèse par règle\n        # `always()` : un passage interrompu (délai, Stryker tué) dit « pas de rapport » au lieu de se taire.\n        if: env.CIBLE == 'regles' && always()\n        working-directory: apps/api\n        run: node ../../scripts/verify/mutation-regles-synthese.mjs --mesure reports/mutation/mesure-regles.json --precedente \"$RUNNER_TEMP/precedente/mesure-regles.json\" >> \"$GITHUB_STEP_SUMMARY\"\n",
    [PS]],
  ['C3 mutation.yml : un appel à l\'API en échec fait échouer le passage (bash -e, plus de mutation)', W, "--jq '[.artifacts[] | select(.expired == false and .workflow_run.head_branch == env.BRANCHE)][0].workflow_run.id // empty') || id=''", "--jq '[.artifacts[] | select(.expired == false and .workflow_run.head_branch == env.BRANCHE)][0].workflow_run.id // empty')", [PS]],
  ['C4 mutation.yml : un téléchargement en échec fait échouer le passage', W, ' || echo "mesure précédente illisible"', '', [PS]],

  // Ajoutées : la fiche et SKILL.md.
  ['C5 fiche : la grille sans sa condition (projet suivi par Anchorpost, index au pivot 3)', F, "Projet suivi par Anchorpost, index au pivot 3 (`RULE_ALL_ANC-28` d'Anchorpost) : jamais", '`RULE_ALL_ANC-28` d\'Anchorpost : jamais', [PS]],
  ['C6 SKILL : la ligne du pre-push n\'est plus posée', K, ', puis `pnpm run check:preuves --base-auto`', '', [PS]],
  ['C7 SKILL : preuves.mjs n\'entre plus dans gatesRapides', K, ' Si la chaîne est posée, `scripts/verify/preuves.mjs` entre dans `gatesRapides` de `.claude/chaine.json` : la fin de tour le joue sans option, la base choisie de même (quelques secondes : la CLI construit l\'index de la base et celui de l\'arbre).', '', [PS]],
  ['C8 SKILL : l\'étape de CI de preuves n\'est plus posée', K, ' Dans le job de qualité, sur `pull_request`, le rapport de preuves : `node scripts/verify/preuves.mjs --base "origin/$BASE"` (même `env:`, `fetch-depth: 0`) ; il écrit le rapport entier de `anchorpost compare` dans le résumé du job, et ne refuse qu\'en `enforce`.', '', [PS]],

  // Ajoutées : le relais.
  ['C9 preuves.mjs : le sujet visé par un premier push (absent en local) est pris pour base', P, '    if (poussee && existe(poussee)) base = poussee;', '    if (poussee) base = poussee;', [BP]],
  ['C10 preuves.mjs : une base nommée absente en local est passée telle quelle à la CLI', P, '  if (!existe(base)) {', '  if (!nommee && !existe(base)) {', [BP]],
  ['C11 preuves.mjs : le geste d\'une base absente nomme toujours develop', P, '    const branche = base.replace(/^origin\\//, "");', '    const branche = "develop";', [BP]],
  ['C12 preuves.mjs : le rapport JSON lu sous le tampon par défaut (1 Mio)', P, '  const r = spawnSync(cli, ["compare", "--base", base, "--json"], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });', '  const r = spawnSync(cli, ["compare", "--base", base, "--json"], { cwd: ROOT, encoding: "utf8" });', [BP]],
  ['C13 preuves.mjs : les avertissements du rapport ne sont pas résumés', P, '  for (const a of avertissements) lignes.push(', '  for (const a of []) lignes.push(', [BP]],
  ['C14 preuves.mjs : la CLI lancée depuis le dossier courant, pas la racine', P, '  const r = spawnSync(cli, ["compare", "--base", base, "--json"], { cwd: ROOT,', '  const r = spawnSync(cli, ["compare", "--base", base, "--json"], { cwd: process.cwd(),', [BP]],

  // Ajoutées : la mutation et sa synthèse.
  ['C15 mutation-regles.mjs : perimetreDuPaquet ne porte pas la criticité (toujours null)', M, 'criticite: r.criticite, fichiers: r.fichiers.filter', 'criticite: null, fichiers: r.fichiers.filter', [BM, BS]],
  ['C16 synthèse : une mesure précédente dont une règle n\'a pas de clé se lit', S, 'm.regles.every((r) => typeof r?.regle === "string" && (r.score === null', 'm.regles.every((r) => (r.score === null', [BS]],
  ['C17 synthèse : le score arrondi par défaut (une baisse de 0,6 point cachée ou montrée autrement)', S, 'score: atteints ? Math.round((100 * tues) / (tues + survivants)) : null', 'score: atteints ? Math.floor((100 * tues) / (tues + survivants)) : null', [BS]],
];

const voulues = process.argv.slice(2);
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
