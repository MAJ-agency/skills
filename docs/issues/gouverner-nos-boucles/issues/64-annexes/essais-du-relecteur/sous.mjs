import { aDesSousTests, nomsDesTests } from "../skills/scripts/tranches.mjs";
import { readFileSync } from "node:fs";
const s = readFileSync(process.argv[2], "utf8");
const re = /\b\w+\.test\s*\(\s*["'`]|\b(?:describe|suite|it)\s*\(/g;
console.log("aDesSousTests", aDesSousTests(s), "noms", nomsDesTests(s).length);
for (const m of s.matchAll(re)) { const l = s.slice(0, m.index).split("\n").length; console.log(l, JSON.stringify(m[0])); }
