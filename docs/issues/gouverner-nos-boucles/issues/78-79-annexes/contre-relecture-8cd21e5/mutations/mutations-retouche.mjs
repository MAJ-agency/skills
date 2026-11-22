// Les mutations de la retouche du tour 2 (`retouches/retouche-152-tour-2.patch`, sur 8cd21e5) : `file.sh` qui lit une
// sous-PR de fourche « sujet/<nom> : fourche », la ligne de `boucle.sh` qui la nomme. Même mécanique que
// `mutations-tour-2.mjs`. À lancer depuis la racine d'un clone au sommet 8cd21e5 avec la retouche :
// `node <chemin>/mutations-retouche.mjs [<nom>…]`. Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FI = 'skills/chaine/fusionner/scripts/file.sh';
const BO = 'skills/chaine/fusionner/scripts/boucle.sh';
const BS = 'skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs';
const CLASSE = '  elif [[ "$base" == sujet/* ]] && [ "$fourche" = true ]; then';
const ARM = `      sujet/*' : fourche') echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas \${etat%% :*}" ;;\n`;

const MUTATIONS = [
  ['R1 file.sh ne lit pas la fourche (le code de 8cd21e5 : « CI en cours », elle tient son sujet)', FI, CLASSE, '  elif false; then', [BS]],
  ['R2 file.sh lit la fourche, mais la boucle ne la nomme pas', BO, ARM, '', [BS]],
  ['R3 file.sh ne lit la fourche que si sa tête a un dépôt (une fourche supprimée passe pour une PR du dépôt)', FI, '  fourche: ((.head.repo.full_name // "") != (.base.repo.full_name // ""))', '  fourche: ((.head.repo.full_name // .base.repo.full_name // "") != (.base.repo.full_name // ""))', [BS]],
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
  if (r.status === null || (rouge && !echecs)) vertes++; // un délai, ou un rouge sans test nommé : pas une preuve
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
