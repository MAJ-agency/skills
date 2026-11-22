// Mutations du second tour de contre-relecture de la PR 150 (ticket 74), sur le seul delta fb0ecb0..950f94e (les
// retouches du premier tour) : chacune change une ligne de `veille.sh` ou une phrase de `fusionner/SKILL.md` que ce delta
// a écrite, joue les bancs qu'elle nomme, et doit en rendre un rouge ; le fichier est remis après chaque mutation. À
// lancer depuis la racine d'un clone à 950f94e : `node <chemin>/mutations-delta.mjs [<nom>…]` (`Y2`…). Sortie 0 : toutes rouges.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const V = 'skills/chaine/fusionner/scripts/veille.sh';
const S = 'skills/chaine/fusionner/SKILL.md';
const BV = 'skills/chaine/fusionner/scripts/veille.test.mjs';
const BU = 'skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs';
const BT = 'scripts/veille-du-capitaine.test.mjs';

// `avant` doit se trouver une fois exactement ; sinon la mutation est introuvable.
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));

const MUTATIONS = [
  ['Y1 veille.sh --etat : le contrôle du verrou ouvert lit le descripteur 8 (une veille vivante se lit « verrou illisible »)', V, remplacer('    { : >&7; } 2>/dev/null || { echo "veille.sh --etat : verrou de la veille illisible', '    { : >&8; } 2>/dev/null || { echo "veille.sh --etat : verrou de la veille illisible'), [BV]],
  ['Y2 veille.sh : un verrou de la veille illisible sort en 9, comme une seconde veille', V, remplacer('verrou de la veille illisible ($VERROU_VEILLE)"; exit 6; }', 'verrou de la veille illisible ($VERROU_VEILLE)"; exit 9; }'), [BV]],
  ['Y3 SKILL.md : sortie 9 d’une boucle sans veille, le lanceur n’est plus prévenu', S, remplacer('une orpheline ou un démon du projet qui garde son verrou : le point 3 du « Réveil de garde », puis le dire au lanceur ;', 'une orpheline ou un démon du projet qui garde son verrou : le point 3 du « Réveil de garde » ;'), [BT]],
  ['Y4 SKILL.md : sortie 9 d’une autre veille, le point 3 (sa boucle arrêtée en plein passage)', S, remplacer('Sortie 9 : une autre veille tourne (`une veille tourne déjà`) : ne rien relancer, `veille.sh --etat` et la suite de son point 2 (« Réveil de garde ») ;', 'Sortie 9 : une autre veille tourne (`une veille tourne déjà`) : le point 3 du « Réveil de garde » ;'), [BT]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
let jouees = 0;
let rouges = 0;
for (const [nom, fichier, muter, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  jouees++;
  writeFileSync(fichier, mute);
  const t0 = Date.now();
  let r;
  try {
    r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 1_200_000 });
  } finally {
    writeFileSync(fichier, texte);
  }
  // Rouge : au moins un test en échec (un délai dépassé n'est pas un rouge, il est dit à part).
  const echecs = (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60));
  const rouge = r.status !== 0 && echecs.length > 0;
  if (rouge) rouges++;
  else vertes++;
  const etat = rouge ? 'ROUGE' : r.status === null ? 'DÉLAI' : 'VERTE';
  console.log(`${etat} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs.length ? ` — ${echecs.join(' | ')}` : ''}`);
}
console.log(`${rouges} rouges sur ${jouees} jouées, ${MUTATIONS.length} dans le fichier`);
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
