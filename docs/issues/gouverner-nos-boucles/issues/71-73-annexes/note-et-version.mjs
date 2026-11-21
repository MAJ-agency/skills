// Pose la version et la note du lot 5 (tickets 71 à 73) sur la branche de la session, quel que soit le `main` de départ
// (A-186). À lancer depuis la racine, après `git checkout HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json` :
//   node <scratchpad>/note-et-version.mjs <scratchpad>/lot-5.patch
// La version : celle de `.claude-plugin/plugin.json` (celle de `main`), le deuxième nombre plus un, le troisième à zéro
// (7.38.2 donne 7.39.0). La note : le texte que le patch ajoute à `NOTES-DE-VERSION.md`, pris tel quel, son titre à cette
// version et à la date du jour (UTC), posé avant la première note du fichier. Écrit la version et la date prises.
// Sortie 1 sans rien écrire : pas de note dans le patch, ou cette version déjà notée (le script a déjà été joué).
import { readFileSync, writeFileSync } from 'node:fs';

const patch = readFileSync(process.argv[2], 'utf8');
const bloc = patch.split(/^diff --git /m).find((x) => x.startsWith('a/NOTES-DE-VERSION.md '));
if (!bloc) {
  console.error('note-et-version : le patch ne porte pas de note (NOTES-DE-VERSION.md)');
  process.exit(1);
}
const note = `${bloc.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n')}\n`;
const pj = readFileSync('.claude-plugin/plugin.json', 'utf8');
const [majeur, mineur] = JSON.parse(pj).version.split('.').map(Number);
const version = `${majeur}.${mineur + 1}.0`;
const jour = new Date().toISOString().slice(0, 10);
const notes = readFileSync('NOTES-DE-VERSION.md', 'utf8');
if (notes.includes(`\n## ${version} — `)) {
  console.error(`note-et-version : ${version} est déjà notée : rien n'est écrit`);
  process.exit(1);
}
const i = notes.indexOf('\n## ') + 1;
writeFileSync('NOTES-DE-VERSION.md', notes.slice(0, i) + note.replace(/^## [0-9.]+ — \d{4}-\d\d-\d\d/, `## ${version} — ${jour}`) + notes.slice(i));
writeFileSync('.claude-plugin/plugin.json', pj.replace(/"version": "[^"]+"/, `"version": "${version}"`));
console.log(`${version} — ${jour}`);
