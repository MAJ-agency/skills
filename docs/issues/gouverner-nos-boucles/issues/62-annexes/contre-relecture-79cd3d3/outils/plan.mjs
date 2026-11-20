// Le plan des tranches pour chaque banc posé (scripts/chaine, scripts/github), et ce que la lecture manque.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const CLONE = process.argv[2];
const { aDesSousTests, nomsDesTests, travaux } = await import(join(CLONE, "scripts/tranches.mjs"));
const dossiers = ["skills/chaine/fusionner/scripts", "skills/chaine/sujet/scripts", "skills/chaine/revue-adversariale/scripts", "skills/chaine/revue-de-ticket/scripts"];
const bancs = dossiers.flatMap((d) => readdirSync(join(CLONE, d)).filter((n) => n.endsWith(".test.mjs")).map((n) => join(d, n)));
bancs.push("skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs");
let total = 0;
for (const b of bancs) {
  const s = readFileSync(join(CLONE, b), "utf8");
  const noms = nomsDesTests(s);
  const sous = aDesSousTests(s);
  const t = travaux(b, noms, 10, { entier: sous });
  const lignesTest = s.split(/\r?\n/).filter((l) => /^\s*(await\s+)?test\s*\(/.test(l));
  const nonLues = s.split(/\r?\n/).filter((l) => /^test\s*\(/.test(l) && !nomsDesTests(l + "\n").length);
  const indentees = s.split(/\r?\n/).filter((l) => /^\s+(await\s+)?test\s*\(/.test(l));
  const tDot = s.split(/\r?\n/).filter((l) => /\b\w+\.test\s*\(\s*[^"'`)\s]/.test(l) && !/\b(re|RE|MOTIF|motif|regex|[A-Z_]{3,})\.test/.test(l));
  const dup = noms.length - new Set(noms).size;
  total += noms.length;
  console.log(`${b.split("/").pop()} lus=${noms.length} distincts=${new Set(noms).size} doublons=${dup} sousTests=${sous} travaux=${t.length} (${t.map((x) => x.sorte[0]).join("")}) test(-non-lus=${nonLues.length} test(-indentés=${indentees.length} x.test(var=${tDot.length}`);
  for (const l of nonLues) console.log("    non lu : " + l.slice(0, 110));
  for (const l of indentees) console.log("    indenté : " + l.slice(0, 110));
  for (const l of tDot.slice(0, 5)) console.log("    .test(var : " + l.trim().slice(0, 110));
}
console.log("total lus", total);
