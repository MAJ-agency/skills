// Harnais des mutations ajoutées par la relecture (tickets 83 à 89) : chaque mutation remplace un texte exact d'un
// fichier, joue les bancs qu'elle nomme et doit les rendre rouges ; le fichier est remis après chaque mutation.
// Usage, depuis la racine d'un clone où le patch de la PR est commité : node <chemin>/harnais.mjs <liste.mjs> [<préfixe>…]
// <liste.mjs> exporte `MUTATIONS` : [nom, fichier, avant, après, bancs]. Sortie 0 : toutes rouges ; 1 sinon.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { MUTATIONS } = await import(pathToFileURL(resolve(process.argv[2])).href);
const voulues = process.argv.slice(3);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) { console.log(`INTROUVABLE ${nom}`); vertes++; continue; }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
