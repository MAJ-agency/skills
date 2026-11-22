// Mutations neuves du tour 2 (sommet 8fc10ba), sur les phrases que la retouche du tour 1 ajoute ; même mécanique que
// mutations-contre.mjs du tour 1. Depuis la racine d'un clone au sommet : `node <chemin>/mutations-t2.mjs`. Sortie 0 : un relevé.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const A = 'skills/chaine/anchorpost';
const SK = `${A}/SKILL.md`, FI = `${A}/references/rules/anchorpost.md`, MF = `${A}/references/manifest.json`, NV = 'NOTES-DE-VERSION.md';
const BANCS = ['scripts/preuve-suffisante-anchorpost.test.mjs', 'scripts/depot.test.mjs', 'scripts/relecture.test.mjs', 'scripts/preuve-suffisante-socle-tests.test.mjs'];
const MUTATIONS = [
  ['D1 note : le pivot 3 revient à init', NV, '`anchorpost migrate manifest` qui écrit le manifeste au schéma 3 tel que la CLI le lit déjà', '`anchorpost init` qui réécrit le manifeste au schéma 3 sans rien retirer'],
  ['D2 note : sans le plancher 2.0.2', NV, 'la CLI (≥ 2.0.2), ', 'la CLI, '],
  ['D3 SKILL pivot-3 : sans « Commiter »', SK, ' Commiter : la commande suivante exige un arbre propre.', ''],
  ['D4 SKILL pivot-3 : la reason ajoutée au manifeste 2', SK, 'le manifeste se réécrit alors au schéma 3 à la main, aux mêmes conversions, avec la `reason`', 'ajouter la `reason` au manifeste 2, puis relancer la commande'],
  ['D5 SKILL pivot-3 : le plancher re-mesuré', SK, 'sa date gardée, jamais re-mesuré', 're-mesuré et daté du jour'],
  ['D6 SKILL pivot-3 : une clé perdue sans refus', SK, 'elle refuse, sans rien écrire, une clé que le schéma 3 perdrait', 'elle retire une clé que le schéma 3 ne porte pas'],
  ['D7 fiche : la question ouverte rend prouvée', FI, 'ou une question ouverte dont la ligne `Bloque :` nomme la règle, qui la laisse « partielle »', 'ou une question ouverte dont la ligne `Bloque :` nomme la règle'],
  ['D8 fiche : un cas refusal répond à invalid-input', FI, '(un cas `invalid` répond à `invalid-input`)', '(un cas `refusal` répond à `invalid-input`)'],
  ['D9 fiche : partielle sans le cas nominal', FI, ', pas de cas `nominal`, une famille sans réponse', ''],
  ['D10 manifeste : « dès high »', MF, 'dès medium, chaque famille répondue', 'dès high, chaque famille répondue'],
  ['D11 SKILL pivot-3 : la commande que nomme l\'alerte, retirée', SK, ' : la commande que nomme l\'alerte `manifest-schema-old`.', '.'],
  ['D9b fiche : partielle sans le cas nominal (texte retouché)', FI, ' ; pas de cas `nominal` ou une famille sans réponse', ' ; une famille sans réponse'],
  ['D12 SKILL pivot-3 : la session écrit la reason', SK, ' que donne la personne nommée par `by` : une session ne l\'écrit pas à sa place, elle la demande dans sa PR', ''],
];
for (const [nom, fichier, avant, apres] of MUTATIONS) {
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) { console.log(`INTROUVABLE ${nom}`); continue; }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...BANCS], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  console.log(`${r.status !== 0 ? 'ROUGE' : 'VERTE'} ${nom}`);
}
