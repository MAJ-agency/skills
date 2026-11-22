// Mutations du tour 3, sur le delta 597e05c..ffa0063 : les textes que le delta ajoute et que les mutations du tour 2 ne
// touchent pas. Chacune remplace un texte exact, joue les bancs qu'elle vise, dit ROUGE ou VERTE, et remet le fichier.
// À lancer depuis la racine d'un clone à ffa0063 : `node <chemin>/tour-3.mjs [<nom>…]`. Sortie 0 toujours.
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
  ['F1 SKILL : ce que develop ne voit pas, sans ses exemples (une règle, un cas, une criticité)', K, ' (une règle, un cas, une criticité remis comme sur develop) :', ' :', [PS]],
  ['F2 SKILL : « plus large, jamais plus lâche » retiré du cas du sujet', K, 'n\'en apporte (plus large, jamais plus lâche) ;', 'n\'en apporte ;', [PS]],
  ['F3 note : la version où le relais se charge dite 3.10.4 au lieu de 3.10.1', N, "(`coverage-diff-regles.mjs` d'avant 3.10.1)", "(`coverage-diff-regles.mjs` d'avant 3.10.4)", [PS]],
  ['F4 SKILL : « Au pre-push et en fin de tour » retiré (la CI comprise à tort)', K, ' Au pre-push et en fin de tour, une branche de mise à jour', ' Une branche de mise à jour', [PS]],
  ['F5 preuves.mjs, en-tête : « ne voit pas ce que la mise à jour défait du sujet » retiré (commentaire)', P, ', mais ne voit pas ce que la mise à jour défait du sujet (une\n * règle, un cas, une criticité que la résolution remet comme sur develop) ; la CI, qui compare à la cible de la PR, le\n * sujet, le juge.', '.', [BP, PS, DT]],
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
