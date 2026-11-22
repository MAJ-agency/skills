// Pose la version et la note de la PR du ticket 90 sur la branche de la session, quel que soit le `main` de départ
// (reprise du script du ticket 77, inchangé hors de cet en-tête). À lancer depuis la racine :
//   node <scratchpad>/version-suivante.mjs <patch qui porte la note>
// Deux usages, et deux seuls (A-205 point 2, A-212) : au départ, sur un `main` déjà bougé, après `git apply
// --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md`, avec le patch d'annexe (la branche n'a pas encore
// de note) ; à une fusion de `main`, avec la note de la branche, prise avant la fusion par `git diff $(git merge-base
// origin/main HEAD) HEAD -- NOTES-DE-VERSION.md`, jamais avec l'annexe, qui porte la note d'avant les retouches.
// La version : celle de `.claude-plugin/plugin.json` (celle de `main`), le troisième nombre plus un (8.0.1 donne 8.0.2,
// 8.0.2 donne 8.0.3). La note : le texte que le patch ajoute à `NOTES-DE-VERSION.md`, pris tel quel, son titre à cette
// version et à la date du jour (UTC), posé avant la première note du fichier, donc au-dessus de celle de `main`. Écrit
// la version et la date prises. Sortie 1 sans rien écrire : pas de note dans le patch, ou la note déjà posée (le script
// a déjà été joué), ou cette version déjà notée.
import { readFileSync, writeFileSync } from 'node:fs';

const patch = readFileSync(process.argv[2], 'utf8');
const bloc = patch.split(/^diff --git /m).find((x) => x.startsWith('a/NOTES-DE-VERSION.md '));
if (!bloc) {
  console.error('version-suivante : le patch ne porte pas de note (NOTES-DE-VERSION.md)');
  process.exit(1);
}
const note = `${bloc.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n')}\n`;
const pj = readFileSync('.claude-plugin/plugin.json', 'utf8');
const [majeur, mineur, correctif] = JSON.parse(pj).version.split('.').map(Number);
const version = `${majeur}.${mineur}.${correctif + 1}`;
const jour = new Date().toISOString().slice(0, 10);
const notes = readFileSync('NOTES-DE-VERSION.md', 'utf8');
// Déjà jouée : le corps de la note (sans son titre) est déjà dans le fichier, quelle que soit sa version.
const corps = note.slice(note.indexOf('\n') + 1).trim();
if (notes.includes(`\n## ${version} — `) || notes.includes(corps)) {
  console.error(`version-suivante : la note est déjà posée (ou ${version} déjà notée) : rien n'est écrit`);
  process.exit(1);
}
const i = notes.indexOf('\n## ') + 1;
writeFileSync('NOTES-DE-VERSION.md', notes.slice(0, i) + note.replace(/^## [0-9.]+ — \d{4}-\d\d-\d\d/, `## ${version} — ${jour}`) + notes.slice(i));
writeFileSync('.claude-plugin/plugin.json', pj.replace(/"version": "[^"]+"/, `"version": "${version}"`));
console.log(`${version} — ${jour}`);
