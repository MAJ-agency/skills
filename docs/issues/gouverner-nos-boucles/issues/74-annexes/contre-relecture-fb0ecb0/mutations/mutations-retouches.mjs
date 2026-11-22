// Les retouches de la contre-relecture de la PR 150, défaites une à une : chacune remet une ligne de `veille.sh` ou une
// phrase de `fusionner/SKILL.md` comme à fb0ecb0, joue les bancs qu'elle nomme, et doit en rendre un rouge ; le fichier est
// remis après chaque mutation ; M2c et T10c reprennent M2 et T10b de l'annexe sur le texte retouché. À lancer depuis la
// racine d'un clone à fb0ecb0 avec `retouches-tour-1.patch` appliqué :
// `node <chemin>/mutations-retouches.mjs [<nom>…]` (`D2`…). Sortie 0 : toutes rouges.
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
  ['D1 veille.sh : la première boucle reçoit encore --reprendre (fb0ecb0)', V, remplacer('lancer() {\n  preparer_si_besoin\n  bash "$outils/boucle.sh" 7>&- |', 'lancer() {\n  local suite=()\n  [ "$reprendre" = 0 ] || suite=(--reprendre)\n  reprendre=0\n  preparer_si_besoin\n  bash "$outils/boucle.sh" "${suite[@]}" 7>&- |'), [BV]],
  ['D2 veille.sh --etat : un verrou qui ne s’ouvre pas se lit VEILLE VIVANTE (fb0ecb0)', V, remplacer('    { : >&7; } 2>/dev/null || { echo "veille.sh --etat : verrou de la veille illisible ($VERROU_VEILLE)" >&2; exit 6; }\n', ''), [BV]],
  ['D3 veille.sh : un verrou qui ne s’ouvre pas se lit « une veille tourne déjà » (fb0ecb0)', V, remplacer('  { : >&7; } 2>/dev/null || { echo "VEILLE ARRÊTÉE $(heure) : verrou de la veille illisible ($VERROU_VEILLE)"; exit 6; }\n', ''), [BV]],
  ['D4 SKILL.md : point 2, la garde ne dit plus qu’un arrêt demandé ne se lève jamais (fb0ecb0)', S, remplacer(" ; un arrêt demandé ne se lève jamais au réveil de garde : `--reprendre` attend qui l'a posé, un humain, ou le capitaine après son action à la main)", ')'), [BT]],
  ['D5 SKILL.md : point 4, « Réarmer » sans dire qu’il suit chaque suite (fb0ecb0)', S, remplacer("4. Réarmer, quelle qu'ait été la suite des points 2 et 3 (`VEILLE VIVANTE` comprise), sauf « ne plus réarmer » (point 2) : `send_later`, comme ci-dessus.", '4. Réarmer : `send_later`, comme ci-dessus.'), [BT]],
  ['D6 SKILL.md : la sortie 9 d’une boucle renvoyée à --etat (fb0ecb0)', S, remplacer("Sortie 9 : une autre veille tourne (`une veille tourne déjà`) : ne rien relancer, `veille.sh --etat` et la suite de son point 2 (« Réveil de garde ») ; ou une boucle tient le verrou sans veille qui la porte (`la boucle est sortie en 9`, après le `REFUS` de la boucle, ou `une boucle tient le verrou` de `--reprendre`), une orpheline ou un démon du projet qui garde son verrou : le point 3 du « Réveil de garde », puis le dire au lanceur ;", "Sortie 9 : une autre boucle tient le verrou, ou une autre veille tourne (`une veille tourne déjà`) : ne rien relancer avant de savoir laquelle (`veille.sh --etat`) : la suite de son point 2 (« Réveil de garde ») ;"), [BT]],
  ['D7 SKILL.md : sans veille en cours, un second send_later à côté de la garde (fb0ecb0)', S, remplacer("ou se réveille seul et relit sa file : le réveil de garde, s'il attend, en tient lieu, jamais un second `send_later`.", 'ou se réveille seul (`send_later`) et relit sa file.'), [BT]],
  // Les cibles de l'annexe que la retouche déplace (M18 et M19 n'ont plus d'objet : D1 les remplace).
  ['M2c veille.sh : la boucle hérite du verrou de la veille (M2 sur le texte retouché)', V, remplacer('bash "$outils/boucle.sh" 7>&- |', 'bash "$outils/boucle.sh" |'), [BV]],
  ['T10c SKILL.md : la sortie 9 ne nomme plus une autre veille, ni la suite par --etat (T10b sur le texte retouché)', S, remplacer("Sortie 9 : une autre veille tourne (`une veille tourne déjà`) : ne rien relancer, `veille.sh --etat` et la suite de son point 2 (« Réveil de garde ») ; ou une boucle", 'Sortie 9 : une boucle'), [BT]],
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
