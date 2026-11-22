// Les mutations de la contre-relecture de la PR 149 (tour 1) : X1 à X15, sur ce qui m'a paru fragile, et quatre de
// l'annexe (`71-73-annexes/mutations.mjs`), A32, C6, C16 et C19, récrites sur le texte retouché (`Aʹ32`, `Cʹ6`, `Cʹ16`, `Cʹ19`). Chacune remplace un texte
// exact d'un fichier, joue les bancs qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque
// mutation. À lancer depuis la racine d'un clone : `node <chemin>/mutations-contre.mjs [<nom>…]`. Une mutation dont le
// texte n'est pas dans l'arbre (code neuf des retouches, sur 9db4fb3) est dite INTROUVABLE. Sortie 0 : toutes rouges.
// Une à la fois ; pour aller plus vite, deux clones et deux listes de noms.
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
  ['X1 verdict : un contrat de base illisible ne rend plus le chemin sensible (le Relecteur, lui, le dit sensible)', R, 'const sensible = fichiers.length > 0 && cheminSensible(fichiers, lireBase(`origin/${base}`)) !== null;', 'const sensible = fichiers.length > 0 && cheminSensible(fichiers, { ...lireBase(`origin/${base}`), illisible: null }) !== null;', [BV]],
  ['X2 clé : le mot « relecture » sans ses guillemets suffit à rendre un contrat cassé illisible', R, "return /\"relecture\"/.test(texte) ? 'illisible' : null;", "return /relecture/.test(texte) ? 'illisible' : null;", [BR]],
  ['X3 renvoyer.sh : la clé portée par un seul sujet n’est plus vue', RV, "for r in $(git for-each-ref --format='%(refname)' refs/remotes/origin/develop refs/remotes/origin/sujet/); do", "for r in $(git for-each-ref --format='%(refname)' refs/remotes/origin/develop); do", [BM]],
  ['X4 demarrer : le régime lu sur develop, pas sur le sujet de la PR', S, 'if cle_relecture_sur "origin/$branche"; then', 'if cle_relecture_sur origin/develop; then', [BM]],
  ['X5 renvoyer.sh : une PR empilée lue sur sa parente (régime 7 et « remettre à-fusionner »)', RV, '  case $base in develop | sujet/*) ;; *) base=develop ;; esac\n', '', [BM]],
  ['X6 github.sh : les commentaires lus sur leur première page seule (`--paginate` retiré)', G, 'brut=$(lire_github "$DEPOT/issues/$(jq -r .number <<<"$pr")/comments?per_page=100" --paginate) || return 5', 'brut=$(lire_github "$DEPOT/issues/$(jq -r .number <<<"$pr")/comments?per_page=100") || return 5', [BV]],
  ['X7 github.sh : des pages lues, la première seule gardée', G, `jq -s 'if all(.[]; type == "array") then add else error("pages") end'`, `jq -s 'if all(.[]; type == "array") then .[0] else error("pages") end'`, [BV]],
  ['X8 verdict : « même contenu propre » toujours vrai (un verdict sur un contenu ancien vaut pour le nouveau)', R, 'if (s !== tete) memeContenu[s] = memeContenuDe(s, tete, base);', 'if (s !== tete) memeContenu[s] = true;', [BV]],
  ['X9 CLI : un calcul absent à côté redevient une lecture illisible (21)', R, '    if (!existsSync(join(ICI, calcul))) throw new Error(', '    if (false) throw new Error(', [BV]],
  ['X10 hook : une copie locale en retard sur origin refusée sans dire le geste qui la relit', RG, '  const relire = lu?.perimees\n', '  const relire = false\n', [BGF]],
  ['X11 demarrer : une PR vers develop, en régime 8, ne dit plus comment demander la relecture', S, '      ! cle_relecture_sur origin/develop || demande_de_relecture develop\n      return 0', '      return 0', [BM]],
  ['X12 garde du capitaine : les chemins sensibles du sujet ignorés, ceux de develop seuls lus', CS, 'const contexte = lireBase(`origin/${base}`);', 'const contexte = lireBase("origin/develop");', [BS]],
  ['X13 passer.sh : un push reçu pendant la lecture de la PR, renvoyé faute de verdict', `${F}/passer.sh`, '  [ "$regime" != 8 ] || [ "$statut" != 1 ] || [ "$origine" = "$(champ .head.sha)" ] ||\n', '  true ||\n', [BV]],
  ['X14 github.sh : le fetch de la revue du capitaine n’élague plus les sujets supprimés', G, "    git_masque fetch -q --prune origin '+refs/heads/develop:refs/remotes/origin/develop'", "    git_masque fetch -q origin '+refs/heads/develop:refs/remotes/origin/develop'", [BS]],
  ['X15 gate : un ticket gelé dans la dette dispensé de `Relecture: double` (A-185, point 5)', 'skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs', '  if (regime === 8)\n    for (const e of ecartsRelectureDouble(', '  if (regime === 8 && !gele)\n    for (const e of ecartsRelectureDouble(', ['skills/chaine/tickets/references/scripts/verify/tickets.test.mjs']],
  ['Aʹ32 github.sh : develop et les sujets ne sont plus relus avant les calculs (A32 sur le fetch retouché)', G, "    git_masque fetch -q --prune origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' ||", '    true ||', [BV]],
  ['Cʹ6 sujet.sh demarrer : le refus conseille de nouveau `sujet.sh rafraichir` (C6 sur le texte retouché)', S, "la recible sur le sujet) ; si elle est déjà dans develop, le capitaine la reporte dans le sujet de lui-même à chaque\nlancement de sa boucle (A-69) : attendre, ou l'écrire à ton conducteur (à qui t'a lancé), qui le demande au capitaine ; une session ne lance jamais \\`sujet.sh rafraichir\\`.\"", "la recible sur le sujet), ou \\`sujet.sh rafraichir ${base#sujet/}\\` si elle est déjà dans develop.\"", ['skills/chaine/sujet/scripts/sujet.test.mjs']],
  ["Cʹ16 gate : la criticité de l'en-tête jamais lue (C16 sur le gate retouché)", TK, "        lus.push(enTeteDeRegle(readFileSync(join(ROOT, f), 'utf8')));", "        enTeteDeRegle(readFileSync(join(ROOT, f), 'utf8'));", [BTG]],
  ["Cʹ19 gate : une règle hors vigueur dans l'index et dans son en-tête compte (C19 sur le gate retouché)", TK, '    if (!lus.some((l) => l.enVigueur)) return null;\n', '', [BTG]],
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
