// Mutations de la retouche du tour 3 (retouche-154-tour-3.patch, sur ffa0063) : chacune remplace un texte exact, joue
// les bancs qu'elle vise, dit ROUGE ou VERTE, et remet le fichier. À lancer depuis la racine d'un clone à ffa0063, la
// retouche posée : `node <chemin>/retouche-t3.mjs [<nom>…]`. Sortie 0 toujours.
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
  ['G1 SKILL : la phrase de ffa0063 (« plus large, jamais plus lâche » pour le sujet)', K, "jamais à la fusion recalculée de `coverage-diff`, et chacune a son angle mort : le sujet quand il a plus de commits que develop n'en apporte, la base de la CI, qui ne voit pas plus que le gate ce que la mise à jour défait de develop (une règle, un cas, une criticité remis comme sur le sujet) : la livraison du sujet, comparée à develop, le juge ;", "jamais à la fusion recalculée de `coverage-diff` : le sujet quand il a plus de commits que develop n'en apporte (plus large, jamais plus lâche) ;", [PS]],
  ['G2 SKILL : la livraison qui juge ce que la mise à jour défait de develop n\'est plus dite', K, ' : la livraison du sujet, comparée à develop, le juge ;', ' ;', [PS]],
  ['G3 SKILL : les exemples de ce que develop ne voit pas retirés (F1)', K, ' (une règle, un cas, une criticité remis comme sur develop) :', ' :', [PS]],
  ['G4 CONTENU : la phrase d\'avant (la base la plus proche, « jamais plus lâche »)', 'skills/monorepo/socle-tests/references/CONTENU.md', "Au pre-push et en fin de tour, une branche de mise à jour d'un sujet se compare à la plus proche de ses deux bases, jamais à la fusion recalculée : contre le sujet (il a plus de commits que develop n'en apporte), ce que la mise à jour défait de develop ne se voit pas, ni en CI, qui compare au même sujet, et la livraison du sujet le juge ; contre develop (il en apporte autant ou plus), ce qu'elle défait du sujet ne se voit pas, et la CI le juge.", "Une PR de mise à jour d'un sujet se compare à la base la plus proche, jamais à la fusion recalculée : plus large, jamais plus lâche.", [PS]],
  ['G5 CONTENU : la condition renversée (develop quand le sujet a plus)', 'skills/monorepo/socle-tests/references/CONTENU.md', "contre le sujet (il a plus de commits que develop n'en apporte)", "contre le sujet (develop apporte plus de commits qu'il n'en a)", [PS]],
  ['G6 CONTENU : BASE_DEFAUT retiré des imports', 'skills/monorepo/socle-tests/references/CONTENU.md', '(`BASE_DEFAUT`, `baseDepuisPush`', '(`baseDepuisPush`', [PS]],
  ['G7 preuves.mjs, en-tête : « la CI non plus » retiré (commentaire, sans banc)', P, 'mais ne voit pas, la CI non plus, ce que', 'mais ne voit pas ce que', [BP, PS, DT]],
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
