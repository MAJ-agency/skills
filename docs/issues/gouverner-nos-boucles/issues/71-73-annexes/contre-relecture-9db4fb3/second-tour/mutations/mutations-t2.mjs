// Second tour de la contre-relecture de la PR 149 : cinq mutations neuves sur le seul delta 9db4fb3..450903a (les
// retouches du premier tour), Y1 à Y5, là où les retouches m'ont paru fragiles à la relecture neuve ; et Z1 à Z3 sur le
// patch du tour 2 (`retouches-tour-2.patch`), dont le texte n'est pas au sommet 450903a (INTROUVABLE). Même harnais que
// `../../mutations/mutations-contre.mjs` : chacune remplace un texte exact, joue ses bancs, doit les rendre rouges.
// À lancer depuis la racine d'un clone au sommet 450903a (Y) ou avec le patch du tour 2 (Y et Z) : `node <chemin>/mutations-t2.mjs [<nom>…]`. Sortie 0 : toutes rouges.
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
  ['Y1 passer.sh : le saut d’une PR poussée pendant sa lecture joue aussi en régime 7 (le régime 7 changerait)', `${F}/passer.sh`, '  [ "$regime" != 8 ] || [ "$statut" != 1 ] || [ "$origine" = "$(champ .head.sha)" ] ||\n', '  [ "$statut" != 1 ] || [ "$origine" = "$(champ .head.sha)" ] ||\n', [BV, `${F}/fusionner.test.mjs`]],
  ['Y2 renvoyer.sh : une sous-PR d’un sujet lue sur develop (le sujet n’est plus une base de la chaîne)', RV, '  case $base in develop | sujet/*) ;; *) base=develop ;; esac', '  case $base in develop) ;; *) base=develop ;; esac', [BM]],
  ['Y3 hook : une ref locale en retard qui ne porte pas le ticket est nommée dans le refus', 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs', 'if (fichiers.length > 0 && distants.get(', 'if (distants.get(', [BGF]],
  ['Y4 faux GitHub : une PR sans commentaire, paginée, ne rend aucune page (lue « réponse vide »)', 'skills/chaine/sujet/scripts/faux-gh.mjs', '{ [PAGES]: pages.length ? pages : [[]] }', '{ [PAGES]: pages }', ['skills/chaine/sujet/scripts/faux-gh.test.mjs', BV]],
  ['Z1 garde du capitaine : une copie de sujet héritée de develop compte de nouveau (patch du tour 2)', CS, '        if (surUnSujet && herite(sha, f)) continue;\n', '', [BS]],
  ['Z2 hook : une copie de sujet héritée de develop compte de nouveau (patch du tour 2)', 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs', "if (!(motif.endsWith('/sujet/') && herite(sha, f))) copies.push(", 'if (true) copies.push(', [BGF]],
  ['Z3 garde du capitaine : « héritée » jugée contre le sommet de develop, pas contre la base de fusion (patch du tour 2)', CS, 'return base.status === 0 && objet(`${base.stdout.trim()}:${f}`) === objet(`${sha}:${f}`);', 'return base.status === 0 && objet(`${develop}:${f}`) === objet(`${sha}:${f}`);', [BS]],
  ['Y5 hook : « Aucune ligne lue » ne dit plus de relire une copie en retard', RG, 'ou origin injoignable.)${relire}`;', 'ou origin injoignable.)`;', [BGF]],
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
