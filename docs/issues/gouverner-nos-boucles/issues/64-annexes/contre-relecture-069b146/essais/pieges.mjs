// Pièges adverses contre codeSeul / aDesSousTests au sommet 069b146. Usage : node pieges.mjs <chemin de tranches.mjs>
import { pathToFileURL } from "node:url";
const { codeSeul, aDesSousTests } = await import(pathToFileURL(process.argv[2]).href);
const T = 't.test("x", () => {});';
const D = 'describe("x", () => {});';
// [nom, source, attendu aDesSousTests] — toutes celles qui cachent un vrai sous-test doivent rendre true.
const cas = [
  ["${} imbriqué 3 niveaux", "const a = `x${ `y${ `z${ q }` }` }`; " + T, true],
  ["sous-test dans ${} imbriqué", "const a = `x${ `y${ t.test(\"z\") }` }`;", true],
  ["objet dans ${}", "const a = `x${ {a: 1}.a }y`; " + T, true],
  ["accolade de bloc dans ${} puis texte", "const a = `${ (() => { return 1; })() } it(x)`;", false],
  ["regex avec [/]", "const r = /[/]/; " + T, true],
  ["regex avec \\/", "const r = /\\//; " + T, true],
  ["regex avec \" dans classe", "const r = /[\"]/; " + T, true],
  ["regex avec ' puis appel", "x = /'/; " + T + " // '", true],
  ["commentaire dans chaîne", "const s = \"/* \"; " + T + " // */", true],
  ["// dans chaîne", "const s = 'http://x'; " + T, true],
  ["chaîne dans commentaire", "// \"\n" + T, true],
  ["chaîne dans bloc", "/* ' */ " + T, true],
  ["U+2028 dans chaîne", "const s = \"a b\"; " + T, true],
  ["U+2028 fin de //", "// c " + T, true],
  ["U+2029 fin de //", "// c " + T, true],
  ["\\r fin de //", "// c\r" + T, true],
  ["\\r\\n fin de //", "// c\r\n" + T, true],
  ["\\r dans chaîne → doute", "const s = \"a\rb\"; ", true],
  ["division après )", "x = (a) / 2; " + T + " y = b / c;", true],
  ["division après ]", "x = a[0] / 2; " + T + " y = b / c;", true],
  ["division après ident", "x = a / 2; " + T + " y = b / c;", true],
  ["++ / → doute", "x = i++ / 2; ", true],
  ["return /x/", "function f() { return /\"/.test(s) || " + T + " }", true],
  ["typeof /x/", "x = typeof /\"/; " + T, true],
  ["regex après ) qui cache (limite écrite)", "if (a) /\"/.test(b); " + T + ' // "', true],
  ["regex après } (doute)", "if (a) {} /\"/.test(b); " + T, true],
  ["division après chaîne", "x = 'a' / 2; " + T + " y = b / c;", true],
  ["division après nombre", "x = 1 / 2; " + T + " y = b / c;", true],
  ["nombre 1.5e3 / ", "x = 1.5e3 / 2; " + T + " y = b / c;", true],
  ["nombre .5 / ", "x = .5 / 2; " + T + " y = b / c;", true],
  ["0x1F / ", "x = 0x1F / 2; " + T + " y = b / c;", true],
  ["1n / ", "x = 1n / 2; " + T + " y = b / c;", true],
  ["1_000 / ", "x = 1_000 / 2; " + T + " y = b / c;", true],
  ["mot-clé this /", "x = this / 2; " + T + " y = b / c;", true],
  ["mot-clé await /re/", "await /\"/.test(b); " + T + ' // "', true],
  ["yield /re/", "function* g() { yield /\"/; " + T + " }", true],
  ["regex drapeaux puis /", "x = /a/g / 2; " + T + " y = b / c;", true],
  ["=> /re/", "f(x => /\"/.test(x)); " + T, true],
  ["chaîne avec échappement de guillemet", "const s = \"a\\\"b\"; " + T, true],
  ["gabarit avec \\`", "const s = `a\\`b`; " + T, true],
  ["gabarit avec \\${", "const s = `a\\${b`; " + T, true],
  ["$ seul dans gabarit", "const s = `a$b{`; " + T, true],
  ["describe après gabarit vide", "``; " + D, true],
  ["suite( après regex", "/x/; suite(\"a\", () => {});", true],
  ["it( dans ${} d'un gabarit en commentaire? non", "// `${ it(x) }`\nx = 1;", false],
  ["identifiant unicode / ", "x = é / 2; " + T + " y = b / c;", true],
  ["#private / ", "class A { #p = 1; f() { return this.#p / 2; } } " + T, true],
  ["?. puis /", "x = a?.b / 2; " + T + " y = b / c;", true],
  ["?? /re/", "x = a ?? /\"/; " + T + ' // "', true],
  ["} d'un objet puis / → doute", "x = {} / 2; ", true],
  ["regex avec // dedans? /\\/\\//", "x = /\\/\\//; " + T, true],
  ["bloc commentaire non fermé → doute", "/* " + T, true],
  ["template se fermant dans ${} via }", "const a = `${ '}' }`; " + T, true],
  ["chaîne '}' dans ${}", "const a = `${ \"`\" }`; " + T, true],
  ["regex dans ${}", "const a = `${ /`/.source }`; " + T, true],
  ["commentaire dans ${}", "const a = `${ /* ` */ 1 }`; " + T, true],
  ["// dans ${} sur deux lignes", "const a = `${ 1 // `\n }`; " + T, true],
  ["shebang", "#!/usr/bin/env node\n" + T, true],
  ["HTML comment <!--", "x = 1; <!-- \" \n" + T, true],
  ["JSX-ish </", "x = a </\"/; " + T, true],
  ["mot réservé let /", "let / 2;" + T, true],
  ["break label /", "x: for(;;) { break x\n/\"/.test(a); " + T + ' // "\n}', true],
];
let fautes = 0;
for (const [nom, s, attendu] of cas) {
  let code, a;
  try { code = codeSeul(s); a = aDesSousTests(s); } catch (e) { console.log(`EXC  ${nom}: ${e.message}`); fautes++; continue; }
  const longueur = code === null || code.length === s.length;
  const ok = a === attendu && longueur;
  if (!ok) fautes++;
  console.log(`${ok ? "ok  " : "FAUX"} ${nom} → aDesSousTests=${a} attendu=${attendu} ${code === null ? "(doute)" : ""}${longueur ? "" : " LONGUEUR"}`);
}
console.log(`fautes ${fautes} sur ${cas.length}`);
