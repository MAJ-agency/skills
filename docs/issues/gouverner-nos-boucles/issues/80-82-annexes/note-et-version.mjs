// La version et la note du lot 6 (tickets 80 à 82), reposées sur le `main` qu'on trouve : `plugin.json` passe à 8.0.0,
// et la note 8.0.0 du patch se pose en tête de `NOTES-DE-VERSION.md`, au-dessus de la note la plus récente de `main`.
// À jouer depuis la racine, après `git checkout HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json` :
// `node <chemin>/note-et-version.mjs <chemin>/lot-6.patch`. Sortie 0 : écrit ; 1 : la note introuvable dans le patch, ou
// `main` déjà à 8.0.0 ou plus (le dire au lanceur, sans rien écrire).
import { readFileSync, writeFileSync } from 'node:fs';

const patch = readFileSync(process.argv[2], 'utf8').split('\n');
const debut = patch.findIndex((l) => l.startsWith('+## 8.0.0 — '));
if (debut < 0) { console.error('note 8.0.0 introuvable dans le patch'); process.exit(1); }
let fin = debut;
while (fin < patch.length && patch[fin].startsWith('+')) fin++;
const note = patch.slice(debut, fin).map((l) => l.slice(1)).join('\n');

const P = '.claude-plugin/plugin.json';
const plugin = readFileSync(P, 'utf8');
const actuelle = JSON.parse(plugin).version;
if (Number(actuelle.split('.')[0]) >= 8) { console.error(`main est déjà à ${actuelle}`); process.exit(1); }
writeFileSync(P, plugin.replace(`"version": "${actuelle}"`, '"version": "8.0.0"'));

const N = 'NOTES-DE-VERSION.md';
const notes = readFileSync(N, 'utf8');
const i = notes.search(/^## \S/m);
if (i < 0) { console.error(`${N} : aucune note`); process.exit(1); }
writeFileSync(N, `${notes.slice(0, i)}${note}\n${notes.slice(i)}`);
console.log(`${actuelle} → 8.0.0 ; note 8.0.0 posée en tête de ${N}`);
