// Mutations du relecteur, ticket 74, tour 1. Deux familles, chacune jouée depuis la racine d'un clone :
// - X1 à X6 : sur `25a72c7` avec `ticket-74.patch` seul (les bancs du patch doivent-ils les voir ?) ;
// - R1 à R4 : sur `25a72c7` avec `ticket-74.patch` puis `retouches-tour-1.patch` (chacune défait une retouche : les
//   bancs neufs de la retouche doivent la voir).
// `node mutations-relecture.mjs X1 X2 …` ou `node mutations-relecture.mjs R1 …`. Même moteur que `74-annexes/mutations.mjs`.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const V = 'skills/chaine/fusionner/scripts/veille.sh';
const S = 'skills/chaine/fusionner/SKILL.md';
const BV = 'skills/chaine/fusionner/scripts/veille.test.mjs';
const BT = 'scripts/veille-du-capitaine.test.mjs';
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));

const MUTATIONS = [
  ['X1 veille.sh --etat : un état « lancee <illisible> » n’est plus lu sans trace', V, remplacer('[[ "$quand" =~ ^[0-9]+$ ]] || mot=""', 'true'), [BV]],
  ['X2 veille.sh --etat : « fin <epoch> » sans ligne finale se lit TERMINÉE (ligne vide)', V, remplacer('if [ "$mot" = fin ] && [ -n "$ligne" ]; then', 'if [ "$mot" = fin ]; then'), [BV]],
  ['X3 veille.sh : finir sort toujours en 0', V, remplacer('  exit "$1"\n}', '  exit 0\n}'), [BV]],
  ['X4 SKILL.md : la quatrième puce joue les points 1 à 4 (la garde s’empile)', S, remplacer('« Réveil de garde », points 1 à 3, tout de suite.', '« Réveil de garde », points 1 à 4, tout de suite.'), [BT]],
  ['X5 SKILL.md : la garde perd son nom (celui que list_triggers retrouverait, A-187 point 3)', S, remplacer('`name` « Garde de la veille du capitaine », ', ''), [BT]],
  ['X6 veille.sh : le `git fetch` de la préparation hérite du verrou', V, remplacer('git fetch -q origin develop 2>/dev/null 7>&-', 'git fetch -q origin develop 2>/dev/null'), [BV]],
  // Retouches défaites (sur le patch et la retouche).
  ['R1 veille.sh : --reprendre ne retire plus le fichier d’arrêt avant la préparation', V, remplacer('  rm -f "$ARRET"\n  exec 8>&-\nfi\n', '  exec 8>&-\nfi\n'), [BV]],
  ['R2 veille.sh : la sonde garde le descripteur 7 dans son sous-shell', V, remplacer('vu=$(exec 7>&-; etat_file || true)', 'vu=$(etat_file || true)'), [BV]],
  ['R3 veille.sh : le sous-shell de la préparation garde le descripteur 7', V, remplacer('(exec 7>&- 8>&-; cd "$racine" && sh -c "$commande" </dev/null 2>&1)', '(cd "$racine" && sh -c "$commande" </dev/null 2>&1 8>&- 7>&-)'), [BV]],
  ['R4 veille.sh : la veille ne laisse pas finir un --etat (flock -n)', V, remplacer('flock -w 3 7 ||', 'flock -n 7 ||'), [BV]],
  // Les cibles neuves de M5 et T9 de l'annexe, si la retouche entre (sur le patch et la retouche).
  ['M5b veille.sh : la commande de préparation hérite du verrou de la veille (cible après la retouche)', V, remplacer('(exec 7>&- 8>&-; cd', '(exec 8>&-; cd'), [BV]],
  ['T9b SKILL.md : `--reprendre` retiré du point 3 (cible après la retouche)', S, remplacer("puis relancer la veille par la seconde ligne du bloc ci-dessus, sans recopier (le worktree peut être resté sur une PR), en tâche de fond avec le même `timeout`, et avec `--reprendre` : elle retire ce fichier dès son verrou pris, avant sa préparation.", 'puis relancer la veille comme ci-dessus.'), [BT]],
  ['X5b SKILL.md : la garde perd son nom (sur la retouche, qui l’exige)', S, remplacer('`name` « Garde de la veille du capitaine », ', ''), [BT]],
];

const voulues = process.argv.slice(2);
let jouees = 0, rouges = 0, vertes = 0;
for (const [nom, fichier, muter, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) { console.log(`INTROUVABLE ${nom}`); vertes++; continue; }
  jouees++;
  writeFileSync(fichier, mute);
  const t0 = Date.now();
  let r;
  try { r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 }); }
  finally { writeFileSync(fichier, texte); }
  const rouge = r.status !== 0;
  if (rouge) rouges++; else vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(`${rouges} rouges sur ${jouees} jouées`);
