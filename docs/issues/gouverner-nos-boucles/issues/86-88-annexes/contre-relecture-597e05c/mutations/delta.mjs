// Mutations du tour 2 de la contre-relecture de la PR 154, sur le seul delta 42c5149..597e05c : chacune remplace un
// texte exact, joue les bancs qu'elle vise, dit ROUGE ou VERTE, et remet le fichier. À lancer depuis la racine d'un
// clone à 597e05c : `node <chemin>/delta.mjs [<nom>…]`. Sortie 0 toujours ; le journal dit l'issue de chacune.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const V = 'skills/monorepo/socle-tests/references/scripts/verify';
const P = `${V}/preuves.mjs`;
const BP = `${V}/preuves.test.mjs`;
const W = 'skills/monorepo/socle-tests/references/ci/mutation.yml';
const F = 'skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md';
const K = 'skills/monorepo/socle-tests/SKILL.md';
const N = 'NOTES-DE-VERSION.md';
const PS = 'scripts/preuve-suffisante-socle-tests.test.mjs';
const DT = 'scripts/depot.test.mjs';
const PE = 'scripts/points-d-entree.test.mjs';

const SYNTHESE = "      - name: Synthèse par règle\n        # `always()` : un passage interrompu (délai, Stryker tué) dit « pas de rapport » au lieu de se taire.\n        if: env.CIBLE == 'regles' && always()\n        working-directory: apps/api\n        run: node ../../scripts/verify/mutation-regles-synthese.mjs --mesure reports/mutation/mesure-regles.json --precedente \"$RUNNER_TEMP/precedente/mesure-regles.json\" >> \"$GITHUB_STEP_SUMMARY\"\n";
const MUTATION = "      - name: Mutation des règles qui ont des preuves\n        if: env.CIBLE == 'regles'\n        run: pnpm --filter @{{SCOPE}}/{{PROJET}}-api mutation:regles\n";

const MUTATIONS = [
  // Le code neuf de preuves.mjs : le filtre des arguments.
  ['D1 preuves.mjs : sans --base, le premier argument est exempté (le garde « i !== -1 » retiré)', P, '&& !(k === i + 1 && i !== -1));', '&& !(k === i + 1));', [BP]],
  ['D2 preuves.mjs : --base-auto refusé', P, 'a !== "--base" && a !== "--base-auto" && !(k', 'a !== "--base" && !(k', [BP]],
  ['D3 preuves.mjs : --base refusé', P, '(a, k) => a !== "--base" && a !== "--base-auto"', '(a, k) => a !== "--base-auto"', [BP]],
  ['D4 preuves.mjs : tout ce qui suit --base est accepté (--base x HEAD~3)', P, '&& !(k === i + 1 && i !== -1));', '&& !(k > i && i !== -1));', [BP]],
  ['D5 preuves.mjs : le refus d\'usage sort en 0', P, 'return refuser("usage : node scripts/verify/preuves.mjs [--base <ref> | --base-auto]");', 'return refuser("usage : node scripts/verify/preuves.mjs [--base <ref> | --base-auto]", 0);', [BP, PE]],
  // Le premier push d'un sujet neuf : la repli.
  ['D6 preuves.mjs : premier push d\'un sujet neuf, repli sur develop et non sur la plus proche', P, '    if (poussee && existe(poussee)) base = poussee;\n    else {', '    if (poussee && existe(poussee)) base = poussee;\n    else if (poussee) base = BASE_DEFAUT;\n    else {', [BP]],
  ['D7 preuves.mjs : premier push d\'un sujet neuf, rien à comparer (sortie 0 sans la CLI)', P, '    if (poussee && existe(poussee)) base = poussee;\n    else {', '    if (poussee && !existe(poussee)) return 0;\n    if (poussee && existe(poussee)) base = poussee;\n    else {', [BP]],
  // Le workflow : l'ordre des étapes et la lecture de la précédente.
  ['D8 mutation.yml : la synthèse avant la mutation (elle lit un rapport absent)', W, MUTATION + SYNTHESE, SYNTHESE + MUTATION, [PS, DT]],
  ['D9 mutation.yml : la mesure précédente lue sur noyau seulement', W, "      - name: Mesure précédente\n        # Le dernier artefact `mesure-regles` de la branche par défaut ; aucun, ou illisible : la synthèse le dit.\n        if: env.CIBLE == 'regles'", "      - name: Mesure précédente\n        # Le dernier artefact `mesure-regles` de la branche par défaut ; aucun, ou illisible : la synthèse le dit.\n        if: env.CIBLE == 'noyau'", [PS, DT]],
  ['D10 mutation.yml : le plus ancien artefact, pas le dernier', W, '][0].workflow_run.id', '][-1].workflow_run.id', [PS]],
  ['D11 mutation.yml : le dossier de la précédente change (la synthèse ne la trouve plus)', W, '-n mesure-regles -D "$RUNNER_TEMP/precedente"', '-n mesure-regles -D "$RUNNER_TEMP"', [PS]],
  // La fiche.
  ['D12 fiche : « pas de cas normal » retiré de « partielle »', F, ', aucun cas déclaré, pas de cas normal, une famille sans réponse)', ', aucun cas déclaré, une famille sans réponse)', [PS, DT]],
  ['D13 fiche : les familles exigées de la seule règle haute', F, 'et, moyenne ou haute, que chacune des dix familles', 'et, haute, que chacune des dix familles', [PS]],
  ['D14 fiche : la question ouverte compte pour une réponse', F, 'ou une question ouverte, qui la laisse partielle)', 'ou une question ouverte)', [PS]],
  // SKILL.md.
  ['D15 SKILL : « la CI juge le commit » retiré', K, ' un travail en cours peut le bloquer ; la CI juge le commit.', ' un travail en cours peut le bloquer.', [PS]],
  ['D16 SKILL : « plus large, jamais plus lâche » retiré', K, 'jamais à la fusion recalculée de `coverage-diff` : plus large, jamais plus lâche.', 'jamais à la fusion recalculée de `coverage-diff`.', [PS]],
  // La note.
  ['D17 note : le point 5 de l\'ADR du projet n\'est plus dit', N, ' ; le point 5 de l\'ADR du score de mutation du projet s\'amende comme le gabarit.', '.', [PS, DT]],
  ['D18 note : l\'adaptation dans le dépôt de la CLI n\'est plus dite', N, ' ; dans le dépôt de la CLI elle-même, le relais s\'adapte comme son `anchorpost.mjs`)', ')', [PS, DT]],
  ['D19 note : ce qui casse sans les deux appuis n\'est plus dit', N, 'les repose avec, sinon le relais ne se charge pas, ou le banc fait échouer `check:tickets` ;', 'les repose avec ;', [PS, DT]],
  ['D20 note : la version de l\'environnement de banc fausse', N, 'environnement-de-banc.mjs` du socle 7.21.0', 'environnement-de-banc.mjs` du socle 7.12.0', [PS]],
  // L'en-tête de preuves.mjs (texte seul).
  ['D21 preuves.mjs, en-tête : les « Limites » sans l\'arbre de travail', P, ' Et `compare` juge l\'arbre\n * de travail, non commis et non suivi compris, pas le commit poussé : au pre-push, une preuve restée hors du commit le\n * fait passer, un travail en cours peut le bloquer ; la CI juge le commit.', '', [BP, PS, DT]],
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
