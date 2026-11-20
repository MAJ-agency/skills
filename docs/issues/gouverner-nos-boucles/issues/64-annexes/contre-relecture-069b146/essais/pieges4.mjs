// Attaques de la règle d'A-177. Chaque source est écrite en .mjs (ou .cjs) et passée à `node --check` : seules les valides comptent.
// "vu" : doit rendre true (un vrai t.test). "cout" : une division certaine, on note si elle tombe dans le doute.
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const { codeSeul, aDesSousTests } = await import(pathToFileURL(process.argv[2]).href);
const T = 't.test("y", f);';
const cas = [
  ["vu", "ASI ident + regex g.exec (JS lit une division, pas d'appel réel)", `a = b\n/"/g.exec(c); ${T} // "`, "mjs", false],
  ["vu", "ident + fin de ligne + regex (vrai appel après)", `a = b\n/ 2; ${T}`, "mjs", true],
  ["vu", ") d'une condition imbriquée + regex", `if ((a) && (b)) /"/.test(c) && ${T} // "`, "mjs", true],
  ["vu", ") d'arrow puis regex en corps", `const g = (a) => /"/.test(a) && ${T} // "`, "mjs", true],
  ["vu", ") d'un for(;;) + regex", `for (;;) /"/.test(c) && ${T} // "`, "mjs", true],
  ["vu", ") d'un while après do-bloc", `do {} while (a) /"/.test(b) && ${T} // "`, "mjs", true],
  ["vu", "] puis regex impossible : ] / 2 division", `x = a[0] / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "gabarit imbriqué fermé puis /", "x = `a${ `b${ c }` }` / 2; " + T + " q = r / s;", "mjs", true],
  ["vu", "gabarit dans ${} contenant regex", "x = `${ /`/.source }${ `${ t.test(\"y\") }` }`;", "mjs", true],
  ["vu", "regex dans ${} imbriqué", "x = `${ `${ /\"/.test(b) }` }`; " + T + ' // "', "mjs", true],
  ["vu", "async ident /", `const async = 4; x = async / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "async arrow + regex", `const g = async (a) => /"/.test(a) && ${T} // "`, "mjs", true],
  ["vu", "get/set dans un objet puis /", `const o = { get x() { return 1 / 2; }, set x(v) { y = v / 2; } }; ${T} c = d / e;`, "mjs", true],
  ["vu", "get comme clé", `const o = { get: 1 / 2, set: 3 / 4 }; ${T} c = d / e;`, "mjs", true],
  ["vu", "{ return: 1 }", `const o = { return: 1, if: 2 }; x = o.return / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "{ return: /re/ }", `const o = { return: /"/ }; ${T} // "`, "mjs", true],
  ["vu", "méthode de classe nommée par un mot", `class A { return() { return 1 / 2; } static if(a) { return a / 2; } } ${T} c = d / e;`, "mjs", true],
  ["vu", "await en module + regex", `await /"/.test(b) && ${T} // "`, "mjs", true],
  ["vu", "yield dans un générateur", `function* g() { yield /"/.test(b) && ${T} // "\n}`, "mjs", true],
  ["vu", "await identifiant (script, .cjs)", `var await = 4; x = await / 2; ${T} c = d / e;`, "cjs", true],
  ["vu", "yield identifiant (script, .cjs)", `var yield = 4; x = yield / 2; ${T} c = d / e;`, "cjs", true],
  ["vu", "#! puis code", `#!/usr/bin/env node\n${T}`, "mjs", true],
  ["vu", "?.( puis /", `x = a?.(b) / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "this.#p /", `class A { #p = 1; f() { return this.#p / 2; } } ${T} c = d / e;`, "mjs", true],
  ["vu", "spread de regex", `f(.../"/.source); ${T} // "`, "mjs", true],
  ["vu", "new.target / ", `function F() { return new.target / 2; } ${T} c = d / e;`, "mjs", true],
  ["vu", "import.meta / ", `x = import.meta / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "label puis regex", `l: /"/.test(b) && ${T} // "`, "mjs", true],
  ["vu", "typeof dans parenthèses", `x = typeof (a) / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "void(0) / ", `x = void (0) / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "x\\u0061 identifiant échappé", `var x\\u0061 = 1; y = xa / 2; ${T} c = d / e;`, "mjs", true],
  ["vu", "commentaire // dans regex classe", `x = /[//]/; ${T}`, "mjs", true],
  ["cout", "this / 2", `class A { f() { return this / 2; } }`, "mjs"],
  ["cout", "null / 2", `x = null / 2;`, "mjs"],
  ["cout", "true / 2", `x = true / 2;`, "mjs"],
  ["cout", "super.x pas touché ; super / ? (invalide) -> new.target", `x = new.target / 2;`, "mjs"],
  ["cout", "import.meta / 2", `x = import.meta / 2;`, "mjs"],
  ["cout", "set(a) / 2 (appel)", `x = set(a) / 2;`, "mjs"],
  ["cout", "of(a) / 2", `x = of(a) / 2;`, "mjs"],
  ["cout", "async(a) / 2", `x = async(a) / 2;`, "mjs"],
  ["cout", "typeof (a) / 2", `x = typeof (a) / 2;`, "mjs"],
  ["cout", "} d'objet / 2", `x = {}.a / 2;`, "mjs"],
  ["cout", "i++ / 2", `x = i++ / 2;`, "mjs"],
  ["cout", "fonction () / ", `x = (function () { return 1; })() / 2;`, "mjs"],
];
let fautes = 0, n = 0;
for (const [sorte, nom, s, ext, attendu] of cas) {
  const f = `js4/${n++}.${ext}`;
  writeFileSync(f, s + "\n");
  const ok = spawnSync(process.execPath, ["--check", f]).status === 0;
  if (!ok) { console.log(`invalide  ${nom}`); continue; }
  const c = codeSeul(s), a = aDesSousTests(s);
  if (sorte === "vu") {
    const bon = a === attendu;
    if (!bon) fautes++;
    console.log(`${bon ? "ok   " : "FAUX "} ${nom} → ${a}${c === null ? " (doute)" : ""}`);
  } else console.log(`coût ${c === null ? "DOUTE" : "lu   "} ${nom}`);
}
console.log(`fautes ${fautes}`);
