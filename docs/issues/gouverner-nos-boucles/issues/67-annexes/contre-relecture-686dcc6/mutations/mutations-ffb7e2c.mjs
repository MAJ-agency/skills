// Contre-relecture de la PR 147, second tour : quatre mutations neuves, jouées contre les seuls bancs neufs du premier
// tour (les cas « contre-relecture 147 » du banc du Relecteur, « contre-relecture de la PR 147 » du banc des textes),
// pour voir si l'un d'eux passerait pour une mauvaise raison. Une survivante est rejouée ensuite contre les fichiers de
// banc entiers, pour savoir si un autre cas la tient. À lancer depuis la racine d'un clone au sommet `ffb7e2c` :
//   node <chemin>/mutations-ffb7e2c.mjs [<nom>…]
// Sortie 0 : toutes rouges aux bancs neufs ; 1 sinon.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const S = 'skills/chaine/relecteur/SKILL.md';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BT = 'scripts/relecteur.test.mjs';
const NEUFS = { [BR]: '^contre-relecture 147 ', [BT]: '^contre-relecture de la PR 147 ' };

const MUTATIONS = [
  // Le cas « les événements de la PR ne se lisent pas » doit tenir « rien d'écrit », pas seulement « sortie 5 ».
  ['N1 jouer : le retrait avant la lecture des événements, le retrait final laissé (sortie 5, mais un retrait écrit)', R, '    else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];', "    else { for (const e of g.retirer ?? []) ecrire('retirer_label', String(n), e); if (poseeApres(n, g.poser, g.marque ?? null)) lignes = []; }", BR],
  // Le cas « la seconde lecture d'origin en échec » doit tenir le 12 du `fetch`, pas un 12 quelconque.
  ['N2 liste : la relecture se tait, puis une tête absente sort en 12 (un 12 qui ne vient pas du fetch)', R, "  if (!presente()) rapatrier();\n  if (!presente()) return { cause: `tête introuvable : ${tete} n'est sur aucune branche d'origin`, a: 'architecte' };", "  if (!presente()) git('fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*');\n  if (!presente()) arreter(12, `tête introuvable : ${tete} n'est sur aucune branche d'origin`);", BR],
  // Le cas « la marque est un commentaire à marque » ne joue qu'un commentaire ordinaire : une trace d'illisible, que
  // `dernier` exclut, compterait-elle ?
  ['N3 decision : les traces d’illisible comptent dans la marque (`dernier` les exclut, A-183 point 6)', R, '{ marque: commentaires[marques.dernier]?.created_at ?? null }', '{ marque: commentaires[Math.max(marques.dernier, ...marques.illisibles.map((t) => t.rang))]?.created_at ?? null }', BR],
  // Le cas des quatre formes ne doit pas tenir par le seul compte des « : une forme remplacée par le doublon d'une autre.
  ['N4 SKILL.md : la forme « orpheline » remplacée par un doublon de « PR tue » (toujours quatre «)', S, '« PR <n> : session <id> orpheline, à archiver » ; « PR <n> : send_message', '« PR <n> : <cause> ; PR tue » ; « PR <n> : send_message', BT],
];

const voulues = process.argv.slice(2);
let survivantes = 0;
const jouer = (args) => spawnSync(process.execPath, ['--test', ...args], { encoding: 'utf8', timeout: 1_500_000 });
const echecs = (r) => (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 70)).join(' | ');
const compte = (r) => (r.stdout.match(/^# tests (\d+)/m) ?? [])[1];
for (const [nom, fichier, avant, apres, banc] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    survivantes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  let neufs;
  let entier = null;
  try {
    neufs = jouer([`--test-name-pattern=${NEUFS[banc]}`, banc]);
    if (neufs.status === 0) entier = jouer([banc]);
  } finally {
    writeFileSync(fichier, texte);
  }
  const rouge = neufs.status !== 0;
  if (!rouge) survivantes++;
  const ditEntier = entier === null ? '' : ` ; banc entier (${compte(entier)} cas) : ${entier.status === 0 ? 'vert' : `rouge — ${echecs(entier)}`}`;
  console.log(`${rouge ? 'ROUGE' : 'SURVIT'} aux bancs neufs (${compte(neufs)} cas) : ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${rouge ? ` — ${echecs(neufs)}` : ''}${ditEntier}`);
}
console.log(survivantes === 0 ? 'toutes rouges aux bancs neufs' : `${survivantes} survivante(s) aux bancs neufs`);
process.exit(survivantes === 0 ? 0 : 1);
