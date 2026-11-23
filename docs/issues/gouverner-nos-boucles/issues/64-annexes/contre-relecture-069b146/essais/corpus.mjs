import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const { codeSeul, aDesSousTests } = await import(pathToFileURL(process.argv[2] + "/scripts/tranches.mjs").href);
const fichiers = execFileSync("git", ["ls-files", "*.mjs", "*.js"], { cwd: process.argv[2], encoding: "utf8" }).trim().split("\n");
let doute = 0, sous = 0;
const brut = /\b\w+\.test\s*\(\s*["'`]|\b(?:describe|suite|it)\s*\(/;
for (const f of fichiers) {
  const s = readFileSync(process.argv[2] + "/" + f, "utf8");
  const c = codeSeul(s);
  if (c === null) { doute++; console.log("doute", f); }
  else if (c.length !== s.length) console.log("LONGUEUR", f);
  if (aDesSousTests(s)) { sous++; if (c !== null) console.log("sous-tests", f); }
  if (brut.test(s) && !aDesSousTests(s) && f.endsWith(".test.mjs")) console.log("brut→code : levé", f);
}
console.log(`${fichiers.length} fichiers, doute ${doute}, sous-tests ${sous}`);
