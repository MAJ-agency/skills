// Les mutations du ticket 92 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit les
// rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où le patch du
// ticket est appliqué : `node <chemin>/mutations.mjs [<nom>…]` (`B1`, `B2`…).
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const A = 'skills/chaine/anchorpost';
const MF = `${A}/references/manifest.json`;
const SK = `${A}/SKILL.md`;
const FI = `${A}/references/rules/anchorpost.md`;
const DT = 'scripts/depot.test.mjs';
const PS = 'scripts/preuve-suffisante-anchorpost.test.mjs';

const MUTATIONS = [
  ['B1 SKILL, étape 1 : le `.3` retiré (`@^2.0`)', SK, '2. `pnpm add -Dw @maj-agency/anchorpost@^2.0.3`', '2. `pnpm add -Dw @maj-agency/anchorpost@^2.0`', [DT, PS]],
  ['B2 SKILL, étape 1 : `@^2` remis', SK, '2. `pnpm add -Dw @maj-agency/anchorpost@^2.0.3` (`@^2` seul garde une 2.0.x plus ancienne déjà installée ; le hook', '2. `pnpm add -Dw @maj-agency/anchorpost@^2` (le hook', [DT, PS]],
  ['B3 SKILL, pivot 3 : `@^2.0.2` remis', SK, 'puis `pnpm add -Dw @maj-agency/anchorpost@^2.0.3` (`migrate manifest`', 'puis `pnpm add -Dw @maj-agency/anchorpost@^2.0.2` (`migrate manifest`', [DT, PS]],
  ['B4 un autre texte du plugin installe la CLI à `@^2`', 'skills/monorepo/socle-tests/SKILL.md', '\n## ', '\n`pnpm add -Dw @maj-agency/anchorpost@^2`\n\n## ', [DT, PS]],
  ['B5 SKILL : la description dit encore ≥ 2.0.0', SK, '(≥ 2.0.3, publique sur npmjs.com)', '(≥ 2.0.0, publique sur npmjs.com)', [DT, PS]],
  ['B6 README : la ligne du skill dit encore ≥ 2.0.0', 'README.md', 'la CLI (≥ 2.0.3), le manifeste au schéma 3', 'la CLI (≥ 2.0.0), le manifeste au schéma 3', [DT, PS]],
  ['B7 fiche : la phrase `floor.by` retirée', FI, /- \*\*`floor\.by` est une clé de `roles`\*\*[^\n]*\n/, '', [DT, PS]],
  ['B8 fiche : l\'alerte promise dès maintenant (« la CLI alerte », sans 2.0.4)', FI, 'et la CLI 2.0.4 alertera, dans la santé', 'et la CLI alerte, dans la santé', [DT, PS]],
  ['B9 fiche : l\'alerte dite refus', FI, '(une alerte, jamais un refus)', '(un refus)', [DT, PS]],
  ['B10 SKILL, pivot 3 : `by` n\'est plus dit clé de `roles`', SK, ' ; `by` est une clé de la table `roles` du manifeste, que la personne écrit elle-même.', '.', [DT, PS]],
  ['B11 manifeste : le `$comment` ne dit plus `by` clé de `roles`', MF, ' (`by`, une clé de `roles`)', '', [DT, PS]],
  ['B12 manifeste : le gabarit écrit un nom en `floor.by`', MF, '"floor": { "date": "{{DATE}}", "proven": 0', '"floor": { "date": "{{DATE}}", "by": "{{NOM}}", "proven": 0', [DT, PS]],
  ['B13 SKILL, étape 3 : la table `roles` ne dit plus qui y figure', SK, ' Toute personne qui signe un `by` du manifeste (un plancher, une criticité de feature) y figure.', '', [DT, PS]],
  ['B14 note : sans la phrase `floor.by`', 'NOTES-DE-VERSION.md', '- **`floor.by` est une clé de `roles`**', '- **Le plancher**', [DT, PS]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const trouvees = typeof avant === 'string' ? texte.split(avant).length - 1 : (texte.match(new RegExp(avant, 'g')) ?? []).length;
  if (trouvees < 1 || (typeof avant !== 'string' && trouvees !== 1) || (typeof avant === 'string' && trouvees !== 1 && !avant.startsWith('\n## '))) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
