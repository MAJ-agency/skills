// Les cas du ticket 64 contre la mise en œuvre jetable et contre `aDesSousTests` de main.
// node cas-code-seul.mjs <racine d'un clone à e64f93b> [fichiers à juger…]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { aDesSousTests, codeSeul } from "./code-seul.mjs";

const [racine, ...fichiers] = process.argv.slice(2);
const main = await import(join(racine, "scripts/tranches.mjs"));
const cas = [
  ["pas", "const m = `feat(${nom}): suite (#2)`;"],
  ["pas", 'const t = "la suite (x)";'],
  ["pas", "const t = 'it (x)';"],
  ["pas", '// describe("x")'],
  ["pas", 'a = 1; /* t.test("x", */ b = 2;'],
  ["pas", "if (/[\"'`]/.test(x)) {}"],
  ["pas", 'test("… describe ( …", () => {});'],
  ["oui", 't.test("x", () => {});'],
  ["oui", "t.test(`x`, () => {});"],
  ["oui", 'describe("x", () => {});'],
  ["oui", 'it("x", () => {});'],
  ["oui", 'const s = `${ t.test("x") }`;'],
  ["oui", 'f(x => t.test("y", () => {}));'],
  ["oui", 'a = /"/.test(b) || t.test("y", () => {});'],
  ["oui", 'n = i++ / 2; await t.test("x", () => {}); m = k / 3;'],
  ["oui", 'const r = `a` / 2; await t.test("x", () => {}); q = b / c;'],
  ["oui", 'function f() { return /\'/.test(s) && t.test("x", f); // \'\n}'],
  ["oui", "// commentaire\r" + 't.test("x", () => {});'],
  ["doute", "const m = `pas fermé;"],
  ["doute", 'const m = "pas fermé;\nb = 1;'],
  ["doute", "const m = `${ x;"],
];
let fautes = 0;
for (const [attendu, source] of cas) {
  const code = codeSeul(source);
  const verdict = code === null ? "doute" : aDesSousTests(source) ? "oui" : "pas";
  const veut = attendu === "pas" ? false : true;
  const avant = main.aDesSousTests(source);
  const ok = attendu === verdict || (attendu === "oui" && verdict === "doute");
  if (!ok) fautes++;
  console.log(`${ok ? "ok  " : "FAUX"} attendu=${attendu} rendu=${verdict} main=${avant}${avant === veut ? "" : " (rouge avant)"}\t${JSON.stringify(source)}`);
}
for (const f of fichiers) {
  const s = readFileSync(f, "utf8");
  const code = codeSeul(s);
  console.log(`${code === null ? "DOUTE" : aDesSousTests(s) ? "SOUS " : "non  "} main=${main.aDesSousTests(s)}\t${f}`);
}
console.log(`fautes ${fautes}`);
