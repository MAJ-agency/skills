import { pathToFileURL } from "node:url";
const { codeSeul, aDesSousTests } = await import(pathToFileURL(process.argv[2]).href);
const cas = [
  ["propriété .return / sur la ligne", 'x = a.return / 2; t.test("y", f); c = d / e;'],
  ["propriété .delete /", 'x = m.delete / 2; t.test("y", f); c = d / e;'],
  ["identifiant of /", 'const of = 4; x = of / 2; t.test("y", f); c = d / e;'],
  ["continue label + saut de ligne", 'a: for (;;) { continue a\n/"/.test(b); t.test("y", f); // "\n}'],
  ["break label + saut de ligne", 'a: for (;;) { break a\n/"/.test(b); t.test("y", f); // "\n}'],
  ["while (x) /re/", 'while (x) /"/.test(b) && t.test("y", f); // "'],
  ["describe en propriété (it.only)", 'it.only("x", () => {});'],
  ["describe.skip", 'describe.skip("x", () => {});'],
  ["t.test sans guillemet immédiat (gabarit à ${})", 't.test(`x ${n}`, () => {});'],
];
for (const [nom, s] of cas) console.log(`${aDesSousTests(s) ? "vu  " : "RATÉ"} ${nom}  codeSeul=${JSON.stringify(codeSeul(s))}`);
