// Extrait du ticket les fichiers neufs et les diffs ; écrit les neufs dans <out>/neufs/<chemin> et les diffs concaténés dans <out>/diffs.patch
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
const [ticket, out] = process.argv.slice(2);
const lignes = readFileSync(ticket, 'utf8').split('\n');
let chemin = null; let i = 0; const diffs = []; const neufs = [];
while (i < lignes.length) {
  const l = lignes[i];
  const h = l.match(/^#### `([^`]+)`/); if (h) chemin = h[1];
  else if (/^#### /.test(l)) chemin = null;
  const f = l.match(/^(`{3,})(\w*)\s*$/);
  if (f) {
    const fence = f[1]; const corps = []; i++;
    while (i < lignes.length && lignes[i] !== fence) { corps.push(lignes[i]); i++; }
    const texte = corps.join('\n') + '\n';
    if (texte.startsWith('diff --git')) diffs.push(texte);
    else { neufs.push([chemin, texte]); }
  }
  i++;
}
for (const [c, t] of neufs) { const p = join(out, 'neufs', c); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, t); console.log('neuf', c, t.split('\n').length - 1); }
writeFileSync(join(out, 'diffs.patch'), diffs.join(''));
console.log('diffs', diffs.length);
