// Les mutations de la PR « anchorpost » (ticket 89) : chacune remplace un texte exact d'un fichier, joue les bancs
// qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un
// clone où le patch de la PR est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const A = 'skills/chaine/anchorpost';
const MF = `${A}/references/manifest.json`;
const SK = `${A}/SKILL.md`;
const FI = `${A}/references/rules/anchorpost.md`;
const AD = `${A}/references/fragments/admin.md`;
const DT = 'scripts/depot.test.mjs';
const PS = 'scripts/preuve-suffisante-anchorpost.test.mjs';

const MUTATIONS = [
  ["A1 manifeste : schéma 2 (le gabarit d'avant)", MF, '"schema": "3",', '"schema": "2",', [DT, PS]],
  ["A2 manifeste : sans sufficiency", MF, '  "sufficiency": "observe",\n', '', [DT, PS]],
  ["A3 manifeste : le plancher d'avant, sans partial", MF, '"floor": { "date": "{{DATE}}", "proven": 0, "partial": 0 }', '"floor": { "date": "{{DATE}}", "proven": 0 }', [DT, PS]],
  ["A4 SKILL : la recette du jeton revient à l'installation", SK, "1. `pnpm add -Dw @maj-agency/anchorpost@^2` (le hook", "1. Dans `.npmrc` : `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}`, puis `pnpm add -Dw @maj-agency/anchorpost@^2` (le hook", [DT, PS]],
  ["A5 SKILL : sans le passage au pivot 3", SK, "## Passer au pivot 3 (`pivot-3`)", "## Le pivot 3", [DT, PS]],
  ["A6 SKILL : la repose ne relance pas le skill de criticité", SK, "se classe par le skill `criticite`, une règle à la fois", "se classe à la main", [DT, PS]],
  ["A7 admin.md : la network secret revient", AD, "- [ ] **Le passage à `enforce`**", "- [ ] une network secret pour l'hôte `npm.pkg.github.com`\n- [ ] **Le passage à `enforce`**", [DT, PS]],
  ["A8 fiche : sans l'étiquette de cas", FI, "**Un test qui prouve un cas le nomme après un `#`**", "**Un test qui prouve un cas le nomme**", [DT, PS]],
  ["A9 fiche : sans ce que dit compare", FI, "## Ce que dit `anchorpost compare`", "## compare", [DT, PS]],
  ["A10 fiche : enforce ne refuse pas", FI, "en `enforce`, elle sort 1.", "en `enforce` aussi.", [DT, PS]],
  ["A11 fiche : la criticité sans sa date", FI, "et `date` (`AAAA-MM-JJ`), facultative", "et rien d'autre", [DT, PS]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
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
