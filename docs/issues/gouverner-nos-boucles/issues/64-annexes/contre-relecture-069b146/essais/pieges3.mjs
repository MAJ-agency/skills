import { pathToFileURL } from "node:url";
const { codeSeul, aDesSousTests } = await import(pathToFileURL(process.argv[2]).href);
const T = 't.test("y", f);';
const cas = [
  // [nom, source, doit voir le sous-test (true) / ne pas (false)]
  ["a?.of / 2", `x = a?.of / 2; ${T} c = d / e;`, true],
  ["x.let / y", `x = x.let / y; ${T} c = d / e;`, true],
  ["continue label + saut de ligne", `label: for (;;) { continue label\n/"/.test(s); ${T} // "\n}`, true],
  ["if ((a)) /re/", `if ((a)) /"/.test(b) && ${T} // "`, true],
  ["foo(if_) / 2", `x = foo(if_) / 2; ${T} c = d / e;`, true],
  ["( dans une chaîne", `x = f("(") / 2; ${T} c = d / e;`, true],
  ["( dans une regex", `x = /\\(/; if (a) /"/.test(b) && ${T} // "`, true],
  ["( dans un commentaire", `/* ( */ if (a) /"/.test(b) && ${T} // "`, true],
  ["( dans un gabarit", "x = `(`; if (a) /\"/.test(b) && " + T + ' // "', true],
  ["pile déséquilibrée ((", `f((a); ${T}`, true],
  ["pile déséquilibrée )", `a); ${T}`, true],
  ["break seul + saut de ligne", `for (;;) { break\n/"/.test(s); ${T} // "\n}`, true],
  ["continue seul + saut de ligne", `for (;;) { continue\n/"/.test(s); ${T} // "\n}`, true],
  ["debugger + saut de ligne", `debugger\n/"/.test(s); ${T} // "`, true],
  ["for await (…) /re/", `async function g() { for await (const x of y) /"/.test(b) && ${T} // "\n}`, true],
  ["else if (a) /re/", `if (b) {} else if (a) /"/.test(b) && ${T} // "`, true],
  ["if/*c*/(a) /re/", `if /* c */ (a) /"/.test(b) && ${T} // "`, true],
  ["x.if(a) / 2", `x = o.if(a) / 2; ${T} c = d / e;`, true],
  ["if (f(a)) /re/", `if (f(a)) /"/.test(b) && ${T} // "`, true],
  ["do {} while (x) /re/", `do {} while (x) /"/.test(b) && ${T} // "`, true],
  ["${ ( } gabarit", "x = `${ (a) }`; if (a) /\"/.test(b) && " + T + ' // "', true],
  ["...of / 2", `x = [...of / 2]; ${T} c = d / e;`, true],
  ["yield dans un générateur", `function* g() { yield /"/; ${T} // "\n}`, true],
  ["let / → doute", `let / 2;`, true],
];
let fautes = 0;
for (const [nom, s, attendu] of cas) {
  const c = codeSeul(s), a = aDesSousTests(s);
  const ok = a === attendu;
  if (!ok) fautes++;
  console.log(`${ok ? "ok  " : "FAUX"} ${nom} → ${a}${c === null ? " (doute)" : ""}`);
}
console.log(`fautes ${fautes} sur ${cas.length}`);
