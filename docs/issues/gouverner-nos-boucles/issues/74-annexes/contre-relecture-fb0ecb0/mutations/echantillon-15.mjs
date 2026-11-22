// L'échantillon de 15 mutations de l'annexe du ticket 74 rejouées par la contre-relecture : M4, M5b, M12 et T12 imposées,
// puis 11 tirées parmi les 37 autres par mulberry32, graine 150. usage : node echantillon-15.mjs <mutations.mjs de l'annexe>
import { readFileSync } from 'node:fs';
const noms = [...readFileSync(process.argv[2], 'utf8').matchAll(/^\s*\['([A-Z]\d+b?) /gm)].map((m) => m[1]);
const imposees = ['M4', 'M5b', 'M12', 'T12'];
let a = 150;
const alea = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const reste = noms.filter((n) => !imposees.includes(n));
for (let i = reste.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [reste[i], reste[j]] = [reste[j], reste[i]]; }
console.log([...imposees, ...reste.slice(0, 11)].join(' '));
console.error(`${noms.length} mutations dans l'annexe, ${reste.length} hors des imposées`);
