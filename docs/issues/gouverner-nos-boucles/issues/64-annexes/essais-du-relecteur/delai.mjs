import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const R = process.argv[2]; const fauxFix = process.argv[3] === "fix";
const { aDesSousTests, nomsDesTests, travaux } = await import(join(R, "scripts/tranches.mjs"));
const POSES = [["skills/chaine/fusionner/scripts","scripts/chaine"],["skills/chaine/sujet/scripts","scripts/chaine"],["skills/chaine/revue-adversariale/scripts","scripts/chaine"],["skills/chaine/revue-de-ticket/scripts","scripts/chaine"]];
const bancs = [];
for (const [d] of POSES) for (const n of readdirSync(join(R, d))) if (n.endsWith(".test.mjs")) bancs.push(join(d, n));
bancs.push("skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs");
const L = [];
for (const b of bancs.sort()) {
  const s = readFileSync(join(R, b), "utf8"); const noms = nomsDesTests(s);
  const debut = (s.match(/^test\(/gm) ?? []).length; const indent = (s.match(/^\s+test\(/gm) ?? []).length;
  const tr = travaux(b, noms, 10, { entier: fauxFix ? false : aDesSousTests(s) });
  for (const t of tr) { const poids = t.sorte === "tranche" ? t.noms.length : t.sorte === "entier" ? Math.max(1, t.noms.length) : Math.max(1, debut - noms.length); L.push({ b, sorte: t.sorte, poids, borne: Math.max(300, 60 * poids) }); }
  if (debut - noms.length || indent) console.log("non lus", b, "debut", debut, "lus", noms.length, "en retrait", indent);
}
const P = 3, somme = L.reduce((a, t) => a + t.borne, 0), max = Math.max(...L.map((t) => t.borne));
console.log("travaux", L.length, "somme", somme, "max", max, "delai", somme / P + max + 60, "s =", ((somme / P + max + 60) / 60).toFixed(1), "min");
const c = {}; for (const t of L) c[t.borne] = (c[t.borne] ?? 0) + 1; console.log("bornes", c);
