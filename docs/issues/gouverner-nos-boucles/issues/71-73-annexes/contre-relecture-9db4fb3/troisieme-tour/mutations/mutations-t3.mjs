// Troisième tour de la contre-relecture de la PR 149 : trois mutations neuves sur la seule règle des copies héritées
// (`A-193` : une copie de sujet ne compte que si elle diffère de sa base de fusion avec develop), W1 à W3, au sommet
// ef2b3f8 ; et V1, V2 sur le patch du tour 3 (`retouches-tour-3.patch`, le clone superficiel du hook), INTROUVABLES au
// sommet. Même harnais que `../../mutations/mutations-contre.mjs`. Usage : `node <chemin>/mutations-t3.mjs [<nom>…]`.
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
  ['W1 garde du capitaine : sans base de fusion commune avec develop, la copie de sujet dite héritée (et ignorée)', CS, 'return base.status === 0 && objet(`${base.stdout.trim()}:${f}`) === objet(`${sha}:${f}`);', 'return base.status !== 0 || objet(`${base.stdout.trim()}:${f}`) === objet(`${sha}:${f}`);', [BS]],
  ['W2 hook : la règle des copies héritées jouée aussi sur develop (sa copie ne compterait jamais)', 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs', "if (!(motif.endsWith('/sujet/') && herite(sha, f))) copies.push(", 'if (!herite(sha, f)) copies.push(', [BGF]],
  ['V1 hook : un clone superficiel jamais vu (patch du tour 3)', 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs', "superficiel ||= git('rev-parse', '--is-shallow-repository') === 'true';", 'superficiel ||= false;', [BGF]],
  ['V2 hook : le refus ne dit plus d’approfondir le clone (patch du tour 3)', RG, '    (lu?.superficiel\n', '    (false\n', [BGF]],
  ['Xʹ10 hook : une copie locale en retard refusée sans le geste qui la relit (X10 sur le texte du tour 3)', RG, '    (lu?.perimees\n', '    (false\n', [BGF]],
  ['W3 hook : « héritée » jugée contre le sommet de develop, pas contre la base de fusion', 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs', "return base !== '' && objet(`${base}:${f}`) === objet(`${sha}:${f}`);", "return base !== '' && objet(`${develop}:${f}`) === objet(`${sha}:${f}`);", [BGF]],
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
