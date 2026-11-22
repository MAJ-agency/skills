// Mutations de la retouche du tour 2 (retouche-154-tour-2.patch, sur 597e05c) : chacune remplace un texte exact, joue
// les bancs qu'elle vise, dit ROUGE ou VERTE, et remet le fichier. À lancer depuis la racine d'un clone à 597e05c, la
// retouche posée : `node <chemin>/retouche-t2.mjs [<nom>…]`. Sortie 0 toujours ; le journal dit l'issue de chacune.
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

const SYNTHESE = "      - name: Synthèse par règle\n        # `always()` : un passage interrompu (délai, Stryker tué) dit « pas de rapport » au lieu de se taire.\n        if: env.CIBLE == 'regles' && always()\n        working-directory: apps/api\n        run: node ../../scripts/verify/mutation-regles-synthese.mjs --mesure reports/mutation/mesure-regles.json --precedente \"$RUNNER_TEMP/precedente/mesure-regles.json\" >> \"$GITHUB_STEP_SUMMARY\"\n";
const MUTATION = "      - name: Mutation des règles qui ont des preuves\n        if: env.CIBLE == 'regles'\n        run: pnpm --filter @{{SCOPE}}/{{PROJET}}-api mutation:regles\n";
const NOUVELLE = " Au pre-push et en fin de tour, une branche de mise à jour d'un sujet se compare à la plus proche de ses deux bases, jamais à la fusion recalculée de `coverage-diff` : le sujet quand il a plus de commits que develop n'en apporte (plus large, jamais plus lâche) ; sinon develop, qui ne voit pas ce que la mise à jour défait du sujet (une règle, un cas, une criticité remis comme sur develop) : la CI, qui compare à la cible de la PR, le juge.";
const ANCIENNE = " Une PR de mise à jour d'un sujet se compare à la plus proche de ses deux bases, le sujet ou develop, jamais à la fusion recalculée de `coverage-diff` : plus large, jamais plus lâche.";

const MUTATIONS = [
  // Les trous du tour 2 sur 597e05c, rejoués sur la retouche.
  ['D4 preuves.mjs : tout ce qui suit --base est accepté (--base x HEAD~3)', P, '&& !(k === i + 1 && i !== -1));', '&& !(k > i && i !== -1));', [BP]],
  ['D8 mutation.yml : la synthèse avant la mutation (elle lit un rapport absent)', W, MUTATION + SYNTHESE, SYNTHESE + MUTATION, [PS, DT]],
  ['D9 mutation.yml : la mesure précédente lue sur noyau seulement', W, "        if: env.CIBLE == 'regles'\n        env:\n          GH_TOKEN", "        if: env.CIBLE == 'noyau'\n        env:\n          GH_TOKEN", [PS, DT]],
  ['D12 fiche : « pas de cas normal » retiré de « partielle »', F, ', aucun cas déclaré, pas de cas normal, une famille sans réponse)', ', aucun cas déclaré, une famille sans réponse)', [PS, DT]],
  ['D17 note : le point 5 de l\'ADR du projet n\'est plus dit', N, ' ; le point 5 de l\'ADR du score de mutation du projet s\'amende comme le gabarit.', '.', [PS, DT]],
  ['D18 note : l\'adaptation dans le dépôt de la CLI n\'est plus dite', N, ' ; dans le dépôt de la CLI elle-même, le relais s\'adapte comme son `anchorpost.mjs`)', ')', [PS, DT]],
  ['D19 note : ce qui casse sans les deux appuis n\'est plus dit', N, ' ; sinon le relais ne se charge pas (`coverage-diff-regles.mjs` d\'avant 3.10.1), ou son banc fait échouer `check:tickets` ;', ' ;', [PS, DT]],
  // La retouche elle-même.
  ['E1 preuves.mjs : une mise à jour se mesure contre le sujet (develop écarté dès qu\'il manque un commit)', P, '      base = choisirBase(candidats);', '      base = choisirBase(candidats.map((c) => (c.ref === BASE_DEFAUT && c.distance > 0 ? { ...c, distance: c.distance + 2 } : c)));', [BP]],
  ['E2 SKILL : la phrase d\'avant (« plus large, jamais plus lâche » pour les deux bases)', K, NOUVELLE, ANCIENNE, [PS]],
  ['E3 SKILL : ce que develop ne voit pas n\'est plus dit', K, ' ; sinon develop, qui ne voit pas ce que la mise à jour défait du sujet (une règle, un cas, une criticité remis comme sur develop) : la CI, qui compare à la cible de la PR, le juge.', ' ; sinon develop.', [PS]],
  ['E4 SKILL : la condition renversée (l\'erreur de 597e05c)', K, 'le sujet quand il a plus de commits que develop n\'en apporte', 'le sujet quand develop apporte plus de commits qu\'il n\'en a', [PS]],
  ['E5 note : BASE_DEFAUT retiré des imports nommés', N, 'le relais importe `BASE_DEFAUT`, `baseDepuisPush`', 'le relais importe `baseDepuisPush`', [PS]],
  ['E6 note : la version de coverage-diff-regles.mjs n\'est plus dite', N, ', du socle 3.10.4 ou plus récent,', ',', [PS]],
  ['E7 note : la repose d\'un fichier qui manque n\'est plus dite', N, 'un projet à qui l\'un manque, ou qui l\'a d\'avant, le repose avec', 'un projet qui a ces deux fichiers d\'avant les repose avec', [PS]],
  ['E8 preuves.mjs, en-tête : la condition renversée (commentaire, sans banc)', P, 'Le sujet, quand il a plus de commits que develop n\'en apporte', 'Le sujet, quand develop en apporte plus', [BP, PS, DT]],
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
