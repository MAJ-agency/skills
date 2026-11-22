// Quatrième tour de la contre-relecture de la PR 149 : deux mutations neuves sur le seul delta ef2b3f8..9d989dc (le
// clone superficiel du hook), T1 et T2, au sommet 9d989dc. Même harnais que `../../mutations/mutations-contre.mjs`.
// Usage : `node <chemin>/mutations-t4.mjs [<nom>…]`, depuis la racine d'un clone au sommet 9d989dc.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const F = 'skills/chaine/fusionner/scripts';
const R = `${F}/revue-exigee.mjs`;
const G = `${F}/github.sh`;
const RV = `${F}/renvoyer.sh`;
const S = 'skills/chaine/sujet/scripts/sujet.sh';
const RG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const CS = 'skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs';
const TK = 'skills/chaine/tickets/references/scripts/verify/tickets.mjs';
const BV = `${F}/verdict-du-capitaine.test.mjs`;
const BS = `${F}/sensibles-du-capitaine.test.mjs`;
const BM = `${F}/messages-du-regime.test.mjs`;
const BR = `${F}/revue-exigee.test.mjs`;
const BGF = 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs';
const BTG = 'skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs';

const MUTATIONS = [
  ['T1 hook : sans base de fusion lue, la copie de sujet dite héritée (ignorée), dans un clone superficiel comme ailleurs', 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs', 'return false; // aucune base commune lue', 'return true; // aucune base commune lue', [BGF]],
  ['T2 hook : le geste du clone superficiel dit à chaque refus, même dans un clone entier', RG, '    (lu?.superficiel\n', '    (true\n', [BGF, 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs']],
];

const voulues = process.argv.slice(2);
const choisies = MUTATIONS.filter(([nom]) => !voulues.length || voulues.some((v) => nom.startsWith(`${v} `)));
const racine = process.cwd();
const jouer = (dossier, [, fichier, avant, apres, bancs]) => {
  const chemin = join(dossier, fichier);
  const texte = readFileSync(chemin, 'utf8');
  if (texte.split(avant).length !== 2) return 'INTROUVABLE';
  writeFileSync(chemin, texte.replace(avant, () => apres));
  try {
    const r = spawnSync(process.execPath, ['--test', ...bancs], { cwd: dossier, encoding: 'utf8', timeout: 900_000 });
    return r.status !== 0 ? 'ROUGE' : 'VERTE';
  } finally {
    writeFileSync(chemin, texte);
  }
};
let nonRouges = 0;
const dire = (nom, issue) => {
  if (issue !== 'ROUGE') nonRouges++;
  console.log(`${issue} ${nom}`);
};
for (const m of choisies) dire(m[0], jouer(racine, m));
console.log(nonRouges === 0 ? `toutes rouges (${choisies.length})` : `${nonRouges} mutation(s) non rouge(s) sur ${choisies.length}`);
process.exit(nonRouges === 0 ? 0 : 1);
