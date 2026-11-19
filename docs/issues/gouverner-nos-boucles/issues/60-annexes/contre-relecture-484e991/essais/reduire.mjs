// Réduit chaque danger d'un .jsonl à un en-tête minimal de même classe ; regroupe. Usage : node reduire.mjs <préfixes de classes séparés par ,> <max par classe> fichiers...
import { readFileSync } from 'node:fs';
import { classer } from './ref.mjs';
const [prefixes, max, ...fichiers] = process.argv.slice(2);
const P = prefixes.split(',');
const envelopper = (h) => `---\n${h}\n---\n\nL'énoncé.\n`;
const classeDe = (h) => { if (/^(---|\.\.\.)[ \t]*$/m.test(h)) return null; try { return classer(envelopper(h))?.classe ?? null; } catch { return null; } };
function reduire(h, classe) {
  let courant = h;
  for (let pas = 0, change = true; change && pas < 30; pas++) {
    change = false;
    // lignes, puis morceaux de taille décroissante
    let L = courant.split('\n');
    for (let i = 0; i < L.length; i++) { const e = [...L.slice(0, i), ...L.slice(i + 1)].join('\n'); if (L.length > 1 && classeDe(e) === classe) { L = e.split('\n'); courant = e; change = true; i--; } }
    for (const t of [16, 8, 4, 2, 1]) for (let i = 0; i + t <= courant.length; i++) { const e = courant.slice(0, i) + courant.slice(i + t); if (classeDe(e) === classe) { courant = e; change = true; i--; } }
  }
  return courant;
}
const groupes = new Map();
const pris = {};
for (const f of fichiers) for (const l of readFileSync(f, 'utf8').split('\n').filter(Boolean)) {
  const e = JSON.parse(l);
  if (!P.some((p) => e.classe.startsWith(p))) continue;
  if ((pris[e.classe] = (pris[e.classe] ?? 0) + 1) > Number(max)) continue;
  const h = e.texte.slice(4, -16).replace(/\n$/, '');
  if (classeDe(h) !== e.classe) { console.log('NON REPRODUIT', e.classe, JSON.stringify(h)); continue; }
  const r = reduire(h, e.classe);
  const k = `${e.classe}\t${r}`;
  groupes.set(k, (groupes.get(k) ?? 0) + 1);
}
for (const [k, n] of [...groupes].sort((a, b) => b[1] - a[1])) { const [c, h] = k.split("\t"); const x = classer(envelopper(h)); if (!x) continue; console.log(`${n}\t${c}\t${JSON.stringify(h)}\n\t\tM ${JSON.stringify(x.module)}  L ${JSON.stringify(x.lib.brut ?? x.lib.erreur)}`); }
