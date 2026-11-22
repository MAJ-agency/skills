// Les mutations de la contre-relecture de la PR 152, tour 3 (sommet d1e2854), en plus de R1 à R3 (`mutations-retouche.mjs`),
// Q1 à Q4 et Q6 (`mutations-tour-2.mjs`, `BANCS_BS=1`) et P1 à P4 (`mutations-contre-relecture.mjs`) des tours 1 et 2 :
// chacune remplace un texte exact du delta, joue les bancs qu'elle vise et dit s'ils sont rouges ; le fichier est remis
// après chaque mutation. Même mécanique que les tours 1 et 2. À lancer depuis la racine d'un clone au sommet d1e2854 :
// `node <chemin>/mutations-tour-3.mjs [<nom>…]`. Une mutation verte n'est pas forcément un défaut : le rapport le dit.
// Sortie 0 : toutes rouges ; 1 : une au moins verte, introuvable, au délai ou rouge sans test nommé.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FI = 'skills/chaine/fusionner/scripts/file.sh';
const BO = 'skills/chaine/fusionner/scripts/boucle.sh';
const BS = 'skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs';
// `ESSAI` : le chemin de `essais/file-avant-apres.test.mjs` (avec ses variables ARBRE, AVANT et APRES, APRES le
// `file.sh` de cet arbre-ci, muté), joué en plus par T1 et T6.
const ESSAI = process.env.ESSAI ? [process.env.ESSAI] : [];
const CLASSE = '  elif [[ "$base" == sujet/* ]] && [ "$fourche" = true ]; then';
const ETAT = '    etat="$base : fourche"\n';
const ARM = `      sujet/*' : fourche') echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas \${etat%% :*}" ;;\n`;
const TIENT = "      sujet/*' : prête' | sujet/*' : prête (sans CI)' | sujet/*' : prête (en conflit)' | sujet/*' : CI en cours')\n        tient=${etat%% : *}";

const MUTATIONS = [
  // Le point 2 de la question : une PR de fourche vers develop prend l'état « fourche » (la suite de A-208, pas ce delta).
  ['T1 file.sh lit « fourche » toute PR de fourche, vers develop comprise', FI, CLASSE, '  elif [ "$fourche" = true ]; then', [BS, ...ESSAI]],
  // La fourche nommée, mais elle tient son sujet (le bras « fourche » rangé avec les états en route).
  ['T2 boucle.sh : la sous-PR « fourche » est en route et tient son sujet', BO, TIENT, TIENT.replace("sujet/*' : CI en cours')", "sujet/*' : CI en cours' | sujet/*' : fourche')"), [BS]],
  // Une fourche à la CI rouge reste rouge : relancée, puis renvoyée (`--rouges`).
  ['T3 file.sh : une sous-PR de fourche à la CI rouge reste « CI rouge »', FI, ETAT, '    etat=$(ci_de) || exit 5\n    case "$etat" in "CI rouge"*) ;; *) etat=fourche ;; esac\n    etat="$base : $etat"\n', [BS]],
  // Le constat du tour 2 rouvert à moitié : une fourche dont la CI tourne reste « CI en cours » (elle tient son sujet).
  ['T4 file.sh : une sous-PR de fourche dont la CI tourne reste « CI en cours »', FI, ETAT, '    etat=$(ci_de) || exit 5\n    case "$etat" in "CI en cours") ;; *) etat=fourche ;; esac\n    etat="$base : $etat"\n', [BS]],
  // La fourche nommée, et renvoyée à son auteur (le « sans renvoi » perdu).
  ['T5 boucle.sh : la sous-PR « fourche » est renvoyée', BO, ARM, `      sujet/*' : fourche') echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas \${etat%% :*}"; bash "$outils/renvoyer.sh" "$n" "fourche" ;;\n`, [BS]],
  // `file.sh` ne lit plus la fourche que sur la base : une tête du dépôt vers un sujet passe pour une fourche quand
  // `head.repo` manque à la liste (un `gh` de banc ancien, sans champ `repo`).
  ['T6 file.sh : sans champ repo dans la liste, toute sous-PR passe pour une fourche', FI, '  fourche: ((.head.repo.full_name // "") != (.base.repo.full_name // ""))', '  fourche: ((.head.repo.full_name // "?") != (.base.repo.full_name // ""))', [BS, ...ESSAI]],
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
  const erreurs = rouge ? (r.stdout.match(/^  error: [^\n]*\n\s+[^\n]*/gm) ?? []).map((l) => l.replace(/\s+/g, ' ').slice(0, 160)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s, sortie ${r.status ?? r.signal})${echecs ? ` — ${echecs}` : ''}${erreurs ? `\n    ${erreurs}` : ''}`);
  if (r.status === null || (rouge && !echecs)) vertes++;
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
