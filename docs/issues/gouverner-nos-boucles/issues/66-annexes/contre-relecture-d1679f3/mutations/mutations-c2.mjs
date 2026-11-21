// Contre-relecture de la PR 146, second tour : cinq mutations D1 à D5, sur le seul delta d1679f3..a32476a (les
// retouches du premier tour). Même mécanique que mutations-c1.mjs. À lancer depuis la racine de l'arbre :
// `node <chemin>/mutations-c2.mjs [D<n>…]`. Sortie 0 : toutes rouges ; 1 : une au moins verte, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const S = 'skills/chaine/relecteur/SKILL.md';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BT = 'scripts/relecteur.test.mjs';

const MUTATIONS = [
  ['D1 veille : une pause qui finit après la durée recommence', R, '    if (k > 0 && Date.now() + pause * 1000 > fin) break;\n', '', [BR]],
  ['D2 veille : la sortie d’erreur des passes jetée', R, '    if (r.status === 0 && r.stderr) process.stderr.write(r.stderr);\n', '', [BR]],
  ['D3 plafond : l’architecte retiré des lignes rendues', R, "if (g.geste === 'plafonner') lignes = g.lignes;", "if (g.geste === 'plafonner') lignes = g.lignes.filter((l) => l.a !== 'architecte');", [BR]],
  ['D4 SKILL.md : la phrase d’A-182 retirée de « L’état des sessions »', S, "; sinon `vivante`. Sans compte de tokens (`context_usage`), la session n'est pas tenue au plafond ; sans `effort_level`, le couple n'est pas tenu pour égal, et la PR reçoit une session neuve.", '; sinon `vivante`.', [BT]],
  ['D5 SKILL.md : plus de suite pour une sortie hors table', S, "\n| autre, ou aucune (l'outil a arrêté la commande) | rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |", '', [BT]],
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
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
