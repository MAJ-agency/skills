// Mutations de la contre-relecture de la PR 150 (ticket 74), premier tour : dix trous que les bancs de fb0ecb0 laissent
// peut-être ouverts. Chacune change une ligne de `veille.sh` ou une phrase de `fusionner/SKILL.md`, joue les bancs
// qu'elle nomme, et doit en rendre un rouge ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un
// clone à fb0ecb0 (ou avec les retouches) : `node <chemin>/mutations-contre.mjs [<nom>…]` (`X3`…). Sortie 0 : toutes rouges.
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
  // SKILL.md : ce que le banc des textes ne tient pas.
  ['X1 SKILL.md : la garde armée à chaque lancement de la veille (les réveils de garde s’empilent)', S, remplacer('Au premier lancement de la veille dans la session, charger `send_later`', 'À chaque lancement de la veille, charger `send_later`'), [BT]],
  ['X2 SKILL.md : point 2, un arrêt demandé levé par la garde', S, remplacer('`VEILLE ARRÊTÉE` ou `arrêt demandé`, rien de plus que sa suite ci-dessus', '`VEILLE ARRÊTÉE` ou `arrêt demandé`, la relancer avec `--reprendre`'), [BT]],
  ['X3 SKILL.md : point 2, une copie d’avant --etat relancée avec --reprendre', S, remplacer('et après une fin sans ligne finale relancer la veille sans `--reprendre`', 'et après une fin sans ligne finale relancer la veille avec `--reprendre`'), [BT]],
  ['X4 SKILL.md : point 2, une copie d’avant --etat, la garde réarmée', S, remplacer('dans une PR du projet), ne plus réarmer, et après', 'dans une PR du projet), réarmer, et après'), [BT]],
  ['X5 SKILL.md : la garde sans son message', S, remplacer(', `message` « Réveil de garde : skill fusionner, « Réveil de garde » »', ''), [BT]],
  ['X6 SKILL.md : point 1, la copie manquante n’est plus vue', S, remplacer('`test -f <scratchpad>/outils/veille.sh && git -C <scratchpad>/capitaine rev-parse -q --verify HEAD` en échec', '`git -C <scratchpad>/capitaine rev-parse -q --verify HEAD` en échec'), [BT]],
  // veille.sh : ce que veille.test.mjs ne tient peut-être pas.
  ['X7 veille.sh : l’état « lancee » ajouté au lieu de remplacer la fin d’avant', V, remplacer(`printf 'lancee %s\\n' "$debut" > "$ETAT_VEILLE"`, `printf 'lancee %s\\n' "$debut" >> "$ETAT_VEILLE"`), [BV]],
  ['X8 veille.sh : toute veille retire le fichier d’arrêt, --reprendre ou pas', V, remplacer('if [ "$reprendre" = 1 ]; then\n  exec 8>>', 'if true; then\n  exec 8>>'), [BV, BU]],
  ['X9 veille.sh : --reprendre garde boucle.verrou ouvert (descripteur 8)', V, remplacer('  rm -f "$ARRET"\n  exec 8>&-\nfi\n', '  rm -f "$ARRET"\nfi\n'), [BV, BU]],
  ['X10 veille.sh : --reprendre retire le fichier d’arrêt avant le verrou de la veille', V, remplacer('exec 7>>"$VERROU_VEILLE"\nflock -w 3 7 ||', '[ "$reprendre" = 0 ] || rm -f "$ARRET"\nexec 7>>"$VERROU_VEILLE"\nflock -w 3 7 ||'), [BV]],
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
