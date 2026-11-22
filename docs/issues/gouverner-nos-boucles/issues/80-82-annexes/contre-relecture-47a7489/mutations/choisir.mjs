// Tirage de n mutations parmi les noms donnés, graine fixée (mulberry32).
const [graine, n, ...noms] = process.argv.slice(2);
let a = Number(graine) >>> 0;
const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const l = [...noms];
for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
console.log(l.slice(0, Number(n)).join(' '));
