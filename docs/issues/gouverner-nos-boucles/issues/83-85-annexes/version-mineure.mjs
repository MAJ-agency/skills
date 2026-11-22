// Pose la version et la note d'une PR de la part de `skills` de la preuve suffisante (tickets 83 à 89) sur la branche de
// la session, quel que soit le `main` de départ. Ces PR ajoutent un comportement : la version est la mineure suivante.
// À lancer depuis la racine, après `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md` du
// patch de la PR (ou après la reprise des deux fichiers de `main`, sur une fusion de `main`) :
//   node <scratchpad>/version-mineure.mjs <scratchpad>/<patch de la PR>
// La version : celle de `.claude-plugin/plugin.json` (celle de `main`), le deuxième nombre plus un, le troisième à zéro
// (8.0.0 donne 8.1.0, 8.0.1 donne 8.1.0, 8.1.0 donne 8.2.0). La note : le texte que le patch ajoute à
// `NOTES-DE-VERSION.md`, pris tel quel, son titre à cette version et à la date du jour (UTC), posé avant la première
// note du fichier, donc au-dessus de celle de `main`. Écrit la version et la date prises. Sortie 1 sans rien écrire :
// pas de note dans le patch, ou la note déjà posée (le script a déjà été joué), ou cette version déjà notée.
import { readFileSync, writeFileSync } from 'node:fs';

const patch = readFileSync(process.argv[2], 'utf8');
const bloc = patch.split(/^diff --git /m).find((x) => x.startsWith('a/NOTES-DE-VERSION.md '));
if (!bloc) {
  console.error('version-mineure : le patch ne porte pas de note (NOTES-DE-VERSION.md)');
  process.exit(1);
}
const note = `${bloc.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n')}\n`;
const pj = readFileSync('.claude-plugin/plugin.json', 'utf8');
const [majeur, mineur] = JSON.parse(pj).version.split('.').map(Number);
const version = `${majeur}.${mineur + 1}.0`;
const jour = new Date().toISOString().slice(0, 10);
const notes = readFileSync('NOTES-DE-VERSION.md', 'utf8');
// Déjà jouée : le corps de la note (sans son titre) est déjà dans le fichier, quelle que soit sa version.
const corps = note.slice(note.indexOf('\n') + 1).trim();
if (notes.includes(`\n## ${version} — `) || notes.includes(corps)) {
  console.error(`version-mineure : la note est déjà posée (ou ${version} déjà notée) : rien n'est écrit`);
  process.exit(1);
}
const i = notes.indexOf('\n## ') + 1;
writeFileSync('NOTES-DE-VERSION.md', notes.slice(0, i) + note.replace(/^## [0-9.]+ — \d{4}-\d\d-\d\d/, `## ${version} — ${jour}`) + notes.slice(i));
writeFileSync('.claude-plugin/plugin.json', pj.replace(/"version": "[^"]+"/, `"version": "${version}"`));
console.log(`${version} — ${jour}`);
