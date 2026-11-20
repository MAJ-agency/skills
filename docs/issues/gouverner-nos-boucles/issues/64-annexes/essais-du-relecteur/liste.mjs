// liste les bancs posés comme poses.test.mjs, sans poser
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const R = process.argv[2];
const { aDesSousTests, nomsDesTests, travaux } = await import(join(R, "scripts/tranches.mjs"));
const POSES = [["skills/chaine/fusionner/scripts","scripts/chaine"],["skills/chaine/sujet/scripts","scripts/chaine"],["skills/chaine/revue-adversariale/scripts","scripts/chaine"],["skills/chaine/revue-de-ticket/scripts","scripts/chaine"],["skills/monorepo/socle-monorepo/references/scripts/docs","scripts/docs"],["skills/chaine/tickets/references/scripts/docs","scripts/docs"],["skills/chaine/tickets/references/scripts/verify","scripts/verify"]];
const out = [];
for (const [d, v] of POSES) for (const n of readdirSync(join(R, d))) if (v === "scripts/chaine" && n.endsWith(".test.mjs")) out.push(join(d, n));
out.push("skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs");
let tot = 0;
for (const b of out.sort()) { const s = readFileSync(join(R, b), "utf8"); const noms = nomsDesTests(s); const tr = travaux(b, noms, 10, { entier: aDesSousTests(s) }); tot += tr.length; console.log(aDesSousTests(s) ? "SOUS" : "    ", noms.length, tr.length, b); }
console.log("bancs", out.length, "travaux", tot);
