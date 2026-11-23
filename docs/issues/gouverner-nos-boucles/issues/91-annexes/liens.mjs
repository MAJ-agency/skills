// Les liens markdown relatifs cassés d'un dépôt (fichiers suivis par git, hors blocs de code) : `[texte](cible)` dont la
// cible, sans ancre, n'existe pas depuis le dossier du fichier. Usage : node liens.mjs <dépôt>
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const D = process.argv[2];
const fichiers = execFileSync('git', ['ls-files', '*.md'], { cwd: D, encoding: 'utf8' }).split('\n').filter(Boolean);
let n = 0;
for (const f of fichiers) {
  let bloc = false;
  readFileSync(join(D, f), 'utf8').split('\n').forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) bloc = !bloc;
    if (bloc) return;
    for (const m of l.replace(/`[^`]*`/g, (c) => (c.includes('](') ? c : 'X')).matchAll(/\]\(([^)\s]+)\)/g)) {
      const cible = m[1].replace(/#.*$/, '');
      if (!cible || /^[a-z]+:/.test(cible)) continue;
      if (!existsSync(join(D, dirname(f), cible))) { n++; console.log(`${f}:${i + 1} → ${m[1]}`); }
    }
  });
}
console.log(`${n} lien(s) cassé(s) sur ${fichiers.length} fichiers .md suivis`);
