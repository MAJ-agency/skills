// Lit un .jsonl de en-tetes.mjs (ou des textes bruts JSON {texte}) et compte les lectures dangereuses.
import { createInterface } from 'node:readline';
import { classer, compteurs } from './ref.mjs';
const comptes = {}; const exemples = {}; let n = 0, refus = 0;
for await (const ligne of createInterface({ input: process.stdin })) {
  if (!ligne) continue;
  const { texte, refus: r } = JSON.parse(ligne); n++; if (r) refus++;
  const c = classer(texte);
  if (!c) continue;
  comptes[c.classe] = (comptes[c.classe] ?? 0) + 1;
  (exemples[c.classe] ??= []);
  if (exemples[c.classe].length < 3 || texte.length < Math.max(...exemples[c.classe].map((e) => e.texte.length))) { exemples[c.classe].push({ texte, ...c }); exemples[c.classe].sort((a, b) => a.texte.length - b.texte.length); exemples[c.classe].length = Math.min(3, exemples[c.classe].length); }
}
console.log(JSON.stringify({ tirages: n, 'lus par le module': compteurs.lus, 'refusés par le module': compteurs.refus, comptes }, null, 1));
for (const [k, v] of Object.entries(exemples)) for (const e of v.slice(0, 2)) console.log(k, JSON.stringify(e.texte), '\n   module', JSON.stringify(e.module), '\n   lib', JSON.stringify(e.lib));
