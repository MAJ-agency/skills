// Pose la note du lot 5 (prise telle quelle dans le patch) en tête de NOTES-DE-VERSION.md, à la version suivante de
// celle de .claude-plugin/plugin.json (deuxième nombre plus un, troisième à zéro) et à la date du jour, et écrit cette
// version dans plugin.json. Usage, depuis la racine : node note-et-version.mjs <lot-5.patch>
import { readFileSync, writeFileSync } from 'node:fs';
const patch = readFileSync(process.argv[2], 'utf8');
const bloc = patch.split(/^diff --git /m).find((x) => x.startsWith('a/NOTES-DE-VERSION.md '));
const note = bloc.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n') + '\n';
const pj = readFileSync('.claude-plugin/plugin.json', 'utf8');
const [a, b] = JSON.parse(pj).version.split('.').map(Number);
const version = a + '.' + (b + 1) + '.0';
const jour = new Date().toISOString().slice(0, 10);
const notes = readFileSync('NOTES-DE-VERSION.md', 'utf8');
const i = notes.indexOf('\n## ') + 1;
writeFileSync('NOTES-DE-VERSION.md', notes.slice(0, i) + note.replace(/^## [0-9.]+ — \d{4}-\d\d-\d\d/, '## ' + version + ' — ' + jour) + notes.slice(i));
writeFileSync('.claude-plugin/plugin.json', pj.replace(/"version": "[^"]+"/, '"version": "' + version + '"'));
console.log(version + ' — ' + jour);
