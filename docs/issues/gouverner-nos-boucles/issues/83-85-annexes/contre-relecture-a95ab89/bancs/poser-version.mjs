// Simulation du geste « main bouge » d'une PR de suite ou de la preuve suffisante : reprend la note que le diff de la
// PR ajoute à NOTES-DE-VERSION.md, la pose au-dessus de celle de main, à la version suivante (correctif : le troisième
// nombre plus un ; mineure : le deuxième plus un). Usage : node poser-version.mjs <diff> correctif|mineure
import { readFileSync, writeFileSync } from 'node:fs';
const [diff, sorte] = process.argv.slice(2);
const bloc = readFileSync(diff, 'utf8').split(/^diff --git /m).find((x) => x.startsWith('a/NOTES-DE-VERSION.md '));
const note = `${bloc.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n')}\n`;
const pj = readFileSync('.claude-plugin/plugin.json', 'utf8');
const [a, b, c] = JSON.parse(pj).version.split('.').map(Number);
const version = sorte === 'mineure' ? `${a}.${b + 1}.0` : `${a}.${b}.${c + 1}`;
const notes = readFileSync('NOTES-DE-VERSION.md', 'utf8');
const i = notes.indexOf('\n## ') + 1;
writeFileSync('NOTES-DE-VERSION.md', notes.slice(0, i) + note.replace(/^## [0-9.]+ — /, `## ${version} — `) + notes.slice(i));
writeFileSync('.claude-plugin/plugin.json', pj.replace(/"version": "[^"]+"/, `"version": "${version}"`));
console.log(version);
