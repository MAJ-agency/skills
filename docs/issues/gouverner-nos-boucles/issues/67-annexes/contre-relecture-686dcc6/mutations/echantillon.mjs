// Tire un échantillon de 15 mutations de 67-annexes/mutations.mjs, graine donnée (mulberry32), dans l'ordre du fichier.
import { readFileSync } from 'node:fs';
const [chemin, graine = '686'] = process.argv.slice(2);
const noms = [...readFileSync(chemin, 'utf8').matchAll(/^  \['([ABC]\d+b?) /gm)].map((m) => m[1]);
let a = Number(graine) >>> 0;
const alea = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const tas = [...noms];
for (let i = tas.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [tas[i], tas[j]] = [tas[j], tas[i]]; }
const pris = new Set(tas.slice(0, 15));
console.log(`${noms.length} mutations, graine ${graine} : ${noms.filter((n) => pris.has(n)).join(' ')}`);
