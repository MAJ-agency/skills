// Contre-relecture de la PR 147, premier tour : dix mutations neuves sur ce qui est apparu fragile. Chacune remplace un
// texte exact, joue les bancs du dépôt qu'elle vise, puis, si elle en a un, l'essai de ce tour qui la vise
// (`essais/essais-686dcc6.test.mjs`, `APRES` = la racine) ; le fichier est remis après chaque mutation. Une mutation
// verte sur les bancs du dépôt est une survivante : un constat. À lancer depuis la racine d'un clone, au sommet voulu :
//   node <chemin>/mutations-686dcc6.mjs [<nom>…]
// Sortie 0 : toutes rouges aux bancs du dépôt ; 1 sinon (les survivantes sont nommées).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESSAIS = join(dirname(fileURLToPath(import.meta.url)), '../essais/essais-686dcc6.test.mjs');
const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const S = 'skills/chaine/relecteur/SKILL.md';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BT = 'scripts/relecteur.test.mjs';

const MUTATIONS = [
  ['M1 decision : la marque est le dernier commentaire, à marque ou non (A-183 point 6)', R, '{ marque: commentaires[marques.dernier]?.created_at ?? null }', '{ marque: commentaires.at(-1)?.created_at ?? null }', [BR], 'K2'],
  ['M2 poseeApres : sans marque, un passage rejoué (ticket 68, décision 1 : les lignes partent)', R, 'if (marque === null || !Number.isFinite(Date.parse(marque))) return false;', 'if (marque === null || !Number.isFinite(Date.parse(marque))) return true;', [BR], 'K3'],
  ['M3 poseeApres : des événements illisibles font partir les lignes au lieu de sortir en 5', R, 'const evenements = lire(`${ROUTE}/issues/${n}/events?per_page=100`, { pages: true });', 'let evenements; try { evenements = lire(`${ROUTE}/issues/${n}/events?per_page=100`, { pages: true }); } catch { return false; }', [BR], 'K4'],
  // M4 : pour un `etiqueter` dont l'étiquette est déjà là, le retrait joué avant la lecture des événements, et lui seul
  // (pas de second retrait) : les écritures ne changent que si la lecture échoue. Une première forme, qui laissait le
  // second retrait, était tuée par ce retrait en double, sans rien dire de la lecture en panne.
  ['M4 jouer : l’ancienne étiquette retirée avant la lecture des événements (les lignes perdues si elle échoue)', R, "    else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];\n    joue = true;\n  }\n  // Au plafond, après l'étiquette : un commentaire refusé laisse le plafond à décider de nouveau, ses lignes entières.\n  if (g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible') {\n    ecrire('commenter', String(n), g.commentaire);\n    joue = true;\n  }\n  for (const e of g.retirer ?? []) ecrire('retirer_label', String(n), e);", "    else { if (g.geste === 'etiqueter') for (const e of g.retirer ?? []) ecrire('retirer_label', String(n), e); if (poseeApres(n, g.poser, g.marque ?? null)) lignes = []; }\n    joue = true;\n  }\n  // Au plafond, après l'étiquette : un commentaire refusé laisse le plafond à décider de nouveau, ses lignes entières.\n  if (g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible') {\n    ecrire('commenter', String(n), g.commentaire);\n    joue = true;\n  }\n  for (const e of g.geste === 'etiqueter' && avant.includes(g.poser) ? [] : g.retirer ?? []) ecrire('retirer_label', String(n), e);", [BR], 'K4'],
  ['M5 liste : la seconde lecture d’origin en échec se tait (ticket 67, décision 4 : sortie 12)', R, '  if (!presente()) rapatrier();\n', "  if (!presente()) git('fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*');\n", [BR], 'K5'],
  ['M6 poseeApres : les événements lus sur leur première page seule', R, 'lire(`${ROUTE}/issues/${n}/events?per_page=100`, { pages: true })', 'lire(`${ROUTE}/issues/${n}/events?per_page=100`)', [BR], 'K6'],
  ['M7 SKILL.md : la quatrième forme retirée de la liste des formes (A-183 point 4)', S, " ; « PR <n> : send_message en échec vers <session> : <sa dernière ligne non vide> », une ligne perdue. La `<cause>`", '. La `<cause>`', [BT], null],
  ['M8 SKILL.md : la forme « Relecteur arrêté » retirée de la liste des formes', S, "« Relecteur arrêté : <cause> » quand il s'arrête ; ", '', [BT], null],
  ['M9 SKILL.md : la sortie 12 sans borne', S, "| 12 | git ne lit pas `origin` : rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |", '| 12 | git ne lit pas `origin` : rejouer au réveil suivant |', [BT], null],
  ['M10 SKILL.md : une sortie hors de la table sans borne', S, "| autre, ou aucune (l'outil a arrêté la commande) | rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |", "| autre, ou aucune (l'outil a arrêté la commande) | rejouer au réveil suivant |", [BT], null],
];

const voulues = process.argv.slice(2);
let survivantes = 0;
const jouer = (args, env = {}) => spawnSync(process.execPath, ['--test', ...args], { encoding: 'utf8', timeout: 900_000, env: { ...process.env, ...env } });
const echecs = (r) => (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ');
for (const [nom, fichier, avant, apres, bancs, essai] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    survivantes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  let depot;
  let parEssai = null;
  try {
    depot = jouer(bancs);
    if (essai) parEssai = jouer([`--test-name-pattern=^${essai} `, ESSAIS], { APRES: process.cwd() });
  } finally {
    writeFileSync(fichier, texte);
  }
  const rouge = depot.status !== 0;
  if (!rouge) survivantes++;
  const ditEssai = parEssai === null ? '' : ` ; essai ${essai} : ${parEssai.status === 0 ? 'vert' : `rouge — ${echecs(parEssai)}`}`;
  console.log(`${rouge ? 'ROUGE' : 'SURVIT'} aux bancs du dépôt : ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${rouge ? ` — ${echecs(depot)}` : ''}${ditEssai}`);
}
console.log(survivantes === 0 ? 'toutes rouges aux bancs du dépôt' : `${survivantes} survivante(s) aux bancs du dépôt`);
process.exit(survivantes === 0 ? 0 : 1);
