// Les mutations du ticket 75 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit
// les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `ticket-75.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`. 
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const E = 'skills/chaine/fusionner/scripts/revue-exigee.mjs';
const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const BV = 'skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';

const MUTATIONS = [
  ["Q1 revue-exigee.mjs : la sortie 69 de « double relecture exigée » lue « illisible » (le code d'avant)", E, "  sansOutil('double-relecture.mjs', r);\n  return r.status === 0 ? 1", "  return r.status === 0 ? 1", [BV]],
  ["Q2 revue-exigee.mjs : la sortie 69 de « même contenu propre » lue « illisible »", E, "  sansOutil('meme-contenu.sh', r);\n", "", [BV]],
  ["Q3 revue-exigee.mjs : la sortie 69 est une lecture illisible (21), pas une panne (3)", E, "  throw new Error(`${calcul} : un outil de la chaîne manque au poste", "  throw new Illisible(`${calcul} : un outil de la chaîne manque au poste", [BV]],
  ["Q4 revue-exigee.mjs : la cause est la dernière ligne non vide (« illisible »), pas celle du calcul", E, ".find((l) => l !== '' && l !== 'illisible');\n  throw new Error", ".filter(Boolean).at(-1);\n  throw new Error", [BV]],
  ["Q5 revue-exigee.mjs : toute sortie non nulle est une panne (une sortie 21 aussi)", E, "function sansOutil(calcul, r) {\n  if (r.status !== 69) return;", "function sansOutil(calcul, r) {\n  if (r.status === 0 || r.status === 20) return;", [BV]],
  ["Q6 relecteur.mjs : la sortie 69 de « double relecture exigée » lue « illisible » (le code d'avant)", R, "  sansOutil('double-relecture.mjs', r);\n", "", [BR]],
  ["Q7 relecteur.mjs : la sortie 69 de « même contenu propre » lue « illisible »", R, "      sansOutil('meme-contenu.sh', r);\n", "", [BR]],
  ["Q8 relecteur.mjs : la sortie 69 est GitHub illisible (5, une pause sans fin), pas 6", R, "  arreter(6, `${calcul} : un outil de la chaîne manque au poste", "  arreter(5, `${calcul} : un outil de la chaîne manque au poste", [BR]],
  ["Q9 relecteur.mjs : la cause est la dernière ligne non vide (« illisible »), pas celle du calcul", R, ".find((l) => l !== '' && l !== 'illisible');\n  arreter(6", ".filter(Boolean).at(-1);\n  arreter(6", [BR]],
  ["Q10 relecteur.mjs : toute sortie non nulle est une panne (une sortie 21 aussi)", R, "function sansOutil(calcul, r) {\n  if (r.status !== 69) return;", "function sansOutil(calcul, r) {\n  if (r.status === 0 || r.status === 20) return;", [BR]],
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
