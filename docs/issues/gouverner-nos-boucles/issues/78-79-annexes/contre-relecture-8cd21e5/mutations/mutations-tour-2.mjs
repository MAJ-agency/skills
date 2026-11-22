// Les mutations de la contre-relecture de la PR 152, tour 2 (sommet 8cd21e5), en plus de P1 à P5 et X1 à X4 du tour 1
// (`contre-relecture-4afd6e2/mutations/mutations-contre-relecture.mjs`) : chacune remplace un texte exact, joue les bancs
// qu'elle vise, et dit si elle les rend rouges ; le fichier est remis après chaque mutation. Même mécanique que celle du
// tour 1. À lancer depuis la racine d'un clone au sommet 8cd21e5, ou du même avec `retouches/retouche-152-tour-2.patch` :
// `node <chemin>/mutations-tour-2.mjs [<nom>…]` ; `BANCS_BS=1` joue `suites-du-lot-5.test.mjs` en entier à la place des
// cas du verrou (sur l'arbre retouché, il porte le banc de `fourche_sautee`).
// Une mutation verte n'est pas forcément un défaut : le rapport dit, pour chacune, si le comportement muté est atteignable.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SU = 'skills/chaine/sujet/scripts/sujet.sh';
const BO = 'skills/chaine/fusionner/scripts/boucle.sh';
const BS = 'skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs';
const UN = 'skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs';
// Les cas du verrou d'un autre capitaine dans `une-sous-pr-a-la-fois.test.mjs` (fusionner, sortie 7 ; relancer, sortie 7) :
// le banc entier dépasse 15 min sous la charge de la machine (P5 du tour 1 l'a atteint), ses cas du verrou seuls suffisent.
const VERROU = process.env.BANCS_BS ? [BS] : ['--test-name-pattern=en passage chez un autre capitaine tient son sujet \\(sortie 7|relancer laisse le sujet tenu', UN];
const MOTIF = '  [[ "$fin" == "#$1 : PR de fourche ("*") : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi" ]]';
const LIRE = "  fin=$({ grep . \"$2\" || true; } | tail -n 1 | tr -d '\\r')\n" + MOTIF;
const NOMME = '          fourche) echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas ${etat%% :*}" ;;\n';
const GARDE_R = "pousserait sur la branche d'origin du même nom.\n  [ \"$(jq -r '.head.repo.full_name // \"\"' <<<\"$pr\")\" = ";

const MUTATIONS = [
  // La lecture de `fourche_sautee` : la DERNIÈRE ligne, le motif entier, le numéro de la PR.
  ['Q1 fourche_sautee cherche le motif dans toute la sortie, pas sur la dernière ligne', BO, LIRE, "  grep -qx \"#$1 : PR de fourche (.*) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi\" \"$2\"", [BS]],
  ['Q2 fourche_sautee lit la première ligne non vide, pas la dernière', BO, LIRE, LIRE.replace('tail -n 1', 'head -n 1'), [BS]],
  ['Q3 fourche_sautee ne vérifie pas le numéro de la PR', BO, MOTIF, MOTIF.replace('"#$1 : PR de fourche ("', '"#"*" : PR de fourche ("'), [BS]],
  ['Q4 fourche_sautee ne vérifie pas la fin du motif', BO, MOTIF, '  [[ "$fin" == "#$1 : PR de fourche ("* ]]', [BS]],
  // Une autre sortie 7 prise pour une fourche : le verrou d'un autre capitaine (« … : sautée sans renvoi »), la lecture
  // illisible de la revue (« … : sautée sans renvoi, son auteur n'y peut rien … »).
  ['Q5 fourche_sautee reconnaît toute dernière ligne qui finit par « sautée sans renvoi » (le verrou compris)', BO, MOTIF, '  [[ "$fin" == *"sautée sans renvoi" ]]', VERROU],
  ['Q6 fourche_sautee reconnaît aussi la lecture illisible de la revue (sortie 21 rendue en 7)', BO, MOTIF, `${MOTIF} || [[ "$fin" == *"son auteur n'y peut rien"* ]]`, VERROU],
  // Les deux sites de la boucle, chacun seul.
  ['Q7 relancer : toute sortie 7 devient « fourche » (le verrou rend le sujet)', BO, '        [ "$rc" != 7 ] || ! fourche_sautee "$n" "$sortie" || rc=fourche\n        geste="sortie $rc de relancer"', '        [ "$rc" != 7 ] || rc=fourche\n        geste="sortie $rc de relancer"', VERROU],
  ['Q8 fusionner : toute sortie 7 devient « fourche » (le verrou rend le sujet)', BO, '        [ "$rc" != 7 ] || ! fourche_sautee "$n" "$sortie" || rc=fourche\n        geste="sortie $rc de fusionner"', '        [ "$rc" != 7 ] || rc=fourche\n        geste="sortie $rc de fusionner"', VERROU],
  ['Q9 fusionner : le sujet rendu, mais la ligne ne nomme pas la fourche', BO, `${NOMME}          7) echo "[#$n] sous-PR non éligible`, `          fourche) echo "[#$n] sous-PR non éligible (fermée, en brouillon, ou en passage chez un autre capitaine)" ;;\n          7) echo "[#$n] sous-PR non éligible`, [BS]],
  ['Q10 relancer : la fourche nommée, mais elle tient son sujet', BO, 'case "$rc" in 0 | 5 | 6 | 7 | 11 |', 'case "$rc" in 0 | 5 | 6 | 7 | fourche | 11 |', [BS]],
  ['Q11 fusionner : la fourche nommée, mais elle tient son sujet', BO, 'case "$rc" in 5 | 6 | 7 | 8 | 11 |', 'case "$rc" in 5 | 6 | 7 | 8 | fourche | 11 |', [BS]],
  // P5 du tour 1, rejouée sur les cas du verrou seuls (au tour 1 de ce relevé, le banc entier a atteint le délai de 900 s).
  ["P5' boucle.sh : toute sortie 7 rend le sujet (le verrou d'un autre capitaine compris)", BO, MOTIF, '  true', VERROU],
  // La garde de `relancer` en régime 8 seulement (X3 du tour 1 le fait pour `fusionner`).
  ['Q12 sujet.sh relancer : la garde de fourche ne joue qu\'en régime 8', SU, GARDE_R, "pousserait sur la branche d'origin du même nom.\n  [ \"$(regime_de_la_pr \"$(jq -r .base.ref <<<\"$pr\")\" \"$(jq -r '.created_at // \"\"' <<<\"$pr\")\")\" != 8 ] || [ \"$(jq -r '.head.repo.full_name // \"\"' <<<\"$pr\")\" = ", [BS]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2 || avant === apres) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 2_400_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 70)).join(' | ') : '';
  // La première ligne d'erreur de chaque test rouge : une assertion du banc, jamais un délai ou une panne de l'outil.
  const erreurs = rouge ? (r.stdout.match(/^  error: [^\n]*\n\s+[^\n]*/gm) ?? []).map((l) => l.replace(/\s+/g, ' ').slice(0, 160)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s, sortie ${r.status ?? r.signal})${echecs ? ` — ${echecs}` : ''}${erreurs ? `\n    ${erreurs}` : ''}`);
  if (r.status === null || (rouge && !echecs)) vertes++; // un délai, ou un rouge sans test nommé : pas une preuve
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
