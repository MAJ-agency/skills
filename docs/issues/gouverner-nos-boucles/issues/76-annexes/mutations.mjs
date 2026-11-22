// Les mutations du ticket 76 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit
// les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `ticket-76.patch` (sur `ticket-75.patch`, ou seul) est appliqué : `node <chemin>/mutations.mjs [<nom>…]`. 
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';

const MUTATIONS = [
  ["U1 relecteur.mjs : l'usage omet `--sondes` (le code d'avant, mineur 7 des tickets 67 à 70)", R, "[--taire <n>,…] [--sondes <k>] [--attendre]');", "[--taire <n>,…] [--attendre]');", [BR]],
  ["U2 relecteur.mjs : l'usage omet `--remplace <id>` de `distribuer`", R, "--couple <modele>/<effort> [--remplace <id>] [<session>…] [--sessions <fichier>] | veille", "--couple <modele>/<effort> [<session>…] [--sessions <fichier>] | veille", [BR]],
  ["U3 relecteur.mjs : l'en-tête omet `--sondes`, l'usage le garde (les deux ne disent plus la même chose)", R, "[--taire <n>,…] [--sondes <k>]\n//        [--attendre]", "[--taire <n>,…]\n//        [--attendre]", [BR]],
  ["P1 jouer : un plafond rejoué (règle 1) ne redit rien, même après un retrait refusé (la question 1 tranchée autrement)", R, "else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];", "else if (g.regle === 1 || poseeApres(n, g.poser, g.marque ?? null)) lignes = [];", [BR]],
  ["P2 decision : la marque d'un `etiqueter` de la règle 1 est la date du dernier verdict, pas celle du commentaire du plafond", R, "const marque = geste.geste === 'etiqueter' ? { marque: commentaires[marques.dernier]?.created_at ?? null } : {};", "const marque = geste.geste === 'etiqueter' ? { marque: commentaires[geste.regle === 1 ? marques.verdicts.at(-1)?.rang : marques.dernier]?.created_at ?? null } : {};", [BR]],
  ["N3 decision : les traces d'illisible comptent dans la marque (`dernier` les exclut, A-183 point 6 ; contre-relecture de la PR 147, second tour)", R, "{ marque: commentaires[marques.dernier]?.created_at ?? null }", "{ marque: commentaires[Math.max(marques.dernier, ...marques.illisibles.map((t) => t.rang))]?.created_at ?? null }", [BR]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
