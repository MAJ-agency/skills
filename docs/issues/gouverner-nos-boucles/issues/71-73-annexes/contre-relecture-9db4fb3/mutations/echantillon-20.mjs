// L'échantillon de 20 mutations de l'annexe (`71-73-annexes/mutations.mjs`), tiré à la graine 149 : mulberry32, puis
// Fisher-Yates sur A1…A34, B1…B27, C1…C19 dans cet ordre, les 20 premiers. Écrit les noms, triés, un par ligne.
let s = 149;
const r = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const noms = [...Array.from({ length: 34 }, (_, i) => `A${i + 1}`), ...Array.from({ length: 27 }, (_, i) => `B${i + 1}`), ...Array.from({ length: 19 }, (_, i) => `C${i + 1}`)];
for (let i = noms.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [noms[i], noms[j]] = [noms[j], noms[i]]; }
console.log(noms.slice(0, 20).sort((x, y) => x[0].localeCompare(y[0]) || Number(x.slice(1)) - Number(y.slice(1))).join('\n'));
