// Le découpage d'un banc `node --test` en tranches (ticket 62) : `scripts/tranches.mjs`. Les noms se lisent dans la
// source ; chaque tranche joue ses noms, une tranche de reste joue ce que la lecture n'a pas reconnu ; la couverture
// dit si chaque test a tourné exactement une fois. Le dernier cas joue un vrai banc jouet, tranche par tranche.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { aDesSousTests, bilan, codeSeul, conclure, couverture, lancer, MOTS_ECMASCRIPT, motif, nomsDesTests, ordre, pireCas, recit, RAPPORTEUR, travaux } from "./tranches.mjs";
import { existsSync, readdirSync, readFileSync as lire } from "node:fs";
import { fileURLToPath } from "node:url";

test("les noms se lisent aux `test(` de début de ligne, nom littéral suivi d'une virgule", () => {
  const source = [
    'test("double", () => {});',
    "test('simple', { timeout: 1 }, () => {});",
    "test(`gabarit sans substitution`, () => {});",
    'test("échappés : \\" \\\\ fin", () => {});',
    "test('l\\'apostrophe', () => {});",
    'test("deux fois", () => {});',
    'test("deux fois", () => {});',
    "  test(\"en retrait : un sous-test ou un appel, pas un test du fichier\", () => {});",
    "test(`avec ${variable}`, () => {});",
    'test("con" + "caténé", () => {});',
    'test("\\n saut échappé", () => {});',
    "test(nom, () => {});",
    'it("pas test", () => {});',
  ].join("\n");
  assert.deepEqual(nomsDesTests(source), ["double", "simple", "gabarit sans substitution", 'échappés : " \\ fin', "l'apostrophe", "deux fois", "deux fois"]);
  // Fins de ligne CRLF, et une dernière ligne lue sans fin de ligne : les mêmes noms ; la variante en retrait, non.
  assert.deepEqual(nomsDesTests('test("un", () => {});\r\n  test("retrait", () => {});\r\ntest(\'deux\', () => {});'), ["un", "deux"]);
});

test("un banc qui écrit des sous-tests est reconnu : il se jouera entier", () => {
  for (const s of ['await t.test("enfant", () => {});', "describe('suite', () => {});", "  it(`cas`, () => {});", 'suite("s", () => {});', "await contexte.test('x', () => {});", 'await t.test( "espace", () => {});', "await t.test ('espace avant', () => {});"])
    assert.ok(aDesSousTests(s), s);
  for (const s of ['test("seul", () => {});', "if (/^x/.test(ligne)) {}", "const ok = MOTIF.test(nom);", 'assert.ok(re.test(nom), "édit");', "const split = (x) => x;"])
    assert.ok(!aDesSousTests(s), s);
  // Fins de ligne CRLF, et un sous-test sur la dernière ligne sans fin de ligne : reconnus.
  assert.ok(aDesSousTests('test("a", async (t) => {\r\n  await t.test("b", () => {});\r\n});'));
  assert.ok(aDesSousTests('test("a", () => {});\r\ndescribe("s", () => {})'));
  assert.ok(!aDesSousTests('test("a", () => {});\r\nconst ok = re.test(x);'));
  // Pas de sous-test : du texte (chaîne, gabarit, commentaire, expression régulière), jamais un appel.
  for (const s of ["const m = `feat(${nom}): suite (#2)`;", 'const t = "la suite (x)";', "const t = 'it (x)';", '// describe("x")', 'a = 1; /* t.test("x", */ b = 2;', "if (/[\"'`]/.test(x)) {}", 'test("… describe ( …", () => {});'])
    assert.ok(!aDesSousTests(s), s);
  // Des sous-tests : du code, y compris dans un `${…}`, après une flèche, après une expression régulière ; les faux négatifs
  // que la liste fermée des `/` ferme (`i++ / 2`, un gabarit divisé, `return /'/`).
  for (const s of ['t.test("x", () => {});', "t.test(`x`, () => {});", 'describe("x", () => {});', 'it("x", () => {});', 'const s = `${ t.test("x") }`;', 'f(x => t.test("y", () => {}));', 'a = /"/.test(b) || t.test("y", () => {});', 'n = i++ / 2; await t.test("x", () => {}); m = k / 3;', 'const r = `a` / 2; await t.test("x", () => {}); q = b / c;', "function f() { return /'/.test(s) && t.test(\"x\", f); // '\n}", '// commentaire\rt.test("x", () => {});'])
    assert.ok(aDesSousTests(s), s);
  // Le doute : le banc se joue entier.
  for (const s of ["const m = `pas fermé;", 'const m = "pas fermé;\nb = 1;', "const m = `${ x;"]) {
    assert.equal(codeSeul(s), null, s);
    assert.ok(aDesSousTests(s), s);
  }
});

test("`codeSeul` garde la longueur, les fins de ligne et les délimiteurs, garde le code des `${…}`, et blanchit le texte", () => {
  const cas = [
    ["a = \"x(y)\"; b = 'z';", "a = \"    \"; b = ' ';"],
    ['n = a / b; /* t.test("x" */ m = c / 2;', "n = a / b; /*            */ m = c / 2;"],
    ['f(/[/"]\\//g, 1); // it("x")\rg();', "f(/      /g, 1); //        \rg();"],
    ['s = `t ${ u("v") } w`;', 's = `  ${ u(" ") }  `;'],
    ["x = `a${ `b${ c }d` }e`;", "x = ` ${ ` ${ c } ` } `;"],
    // Les fins de ligne restent dans un commentaire bloc et dans un gabarit.
    ["a /* x\ny */ b", "a /*  \n  */ b"],
    ["s = `a\nb`;", "s = ` \n `;"],
    // Le corps d'une expression régulière sans classe ni échappement est blanchi aussi.
    ["x = /a(b)c/g;", "x = /     /g;"],
  ];
  for (const [source, attendu] of cas) {
    assert.equal(codeSeul(source), attendu, source);
    assert.equal(codeSeul(source).length, source.length);
  }
});

// La liste des mots d'ECMAScript (ES2024), écrite ici contre celle de `tranches.mjs` : mots réservés, mots réservés du mode
// strict, et les mots contextuels `let`, `static`, `yield`, `await`, `async`, `of`, `get`, `set`.
const RESERVES = "await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield".split(" ");
const STRICT = "implements interface let package private protected public static yield".split(" ");
const CONTEXTUELS = "let static yield await async of get set".split(" ");
const AVANT_REGEX = ["return", "typeof", "case", "do", "else", "in", "instanceof", "new", "delete", "void", "throw", "yield", "await"];

test("`codeSeul` : la liste des mots d'ECMAScript est entière ; une `/` est une division sur certitude seule, une regex après un ouvrant sûr, le doute ailleurs (A-177)", () => {
  assert.deepEqual([...MOTS_ECMASCRIPT].sort(), [...new Set([...RESERVES, ...STRICT, ...CONTEXTUELS])].sort());
  const T = 't.test("y", f);';
  // Une regex en tête de source, ou après un mot qui ouvre une expression : lue (le `t.test` qui suit est vu, sans doute).
  const apres = (avant) => `${avant} /"/.test(b); ${T} // "`;
  assert.ok(aDesSousTests(`/"/.test(b); ${T} // "`) && codeSeul(`/"/.test(b); ${T} // "`) !== null, "en tête de source");
  for (const m of AVANT_REGEX) {
    assert.notEqual(codeSeul(apres(m)), null, m);
    assert.ok(aDesSousTests(apres(m)), m);
  }
  // Tout autre mot de la liste : la `/` qui le suit est dans le doute.
  for (const m of MOTS_ECMASCRIPT) {
    if (AVANT_REGEX.includes(m)) continue;
    assert.equal(codeSeul(`${m} / 2; ${T} c = d / e;`), null, m);
  }
  // Une division certaine, lue sans doute : après un nombre, une chaîne, un gabarit, `]`, un identifiant, un nom de propriété
  // (même celui d'un mot de la liste), le `)` d'une `(` sans mot.
  for (const s of ["x = 1 / 2;", "x = 'a' / 2;", "x = `a` / 2;", "x = a[0] / 2;", "x = a / 2;", "x = a.return / 2;", "x = a?.of / 2;", "x = a.if / 2;", "x = (a + b) / 2;", "x = f(a) / 2;", "x = o.if(a) / 2;"]) {
    const complet = `${s} ${T} c = d / e;`;
    assert.notEqual(codeSeul(complet), null, s);
    assert.ok(aDesSousTests(complet), s);
  }
  // Le `)` d'une `(` que précède un autre mot de la liste : le doute ; celui de `if`, `while`, `for`, `with` : une regex.
  for (const m of ["catch", "function", "switch", "return", "typeof", "async"]) assert.equal(codeSeul(`${m} (a) / 2; ${T}`), null, m);
  assert.equal(codeSeul(`for await (const x of y) /"/.test(b) && ${T} // "`), null);
  for (const m of ["if", "while", "for", "with"]) assert.notEqual(codeSeul(`${m} (a) /"/.test(b) && ${T} // "`), null, m);
  // `}`, `++`, `--` : le doute.
  for (const s of ["if (a) {} / 2;", "x = i++ / 2;", "x = i-- / 2;"]) assert.equal(codeSeul(s), null, s);
  // Une `/` après `...` ouvre une regex.
  assert.notEqual(codeSeul(`f(.../"/.source); ${T} // "`), null);
});

test("`codeSeul` : une étiquette après `break` ou `continue`, une pile de parenthèses déséquilibrée, une continuation de ligne : le doute (A-176)", () => {
  const T = 't.test("y", f);';
  for (const m of ["break", "continue"]) {
    const s = `a: for (;;) { ${m} a\n/"/.test(b); ${T} // "\n}`;
    assert.equal(codeSeul(s), null, s);
    assert.ok(aDesSousTests(s), s);
  }
  for (const s of ["a = 1);", "f((a);", "f(a", "x = ) / 2;"]) assert.equal(codeSeul(s), null, s);
  // Une continuation de ligne dans une chaîne : le doute.
  assert.equal(codeSeul('const s = "a\\\nb";'), null);
  // Un nom de propriété, même celui d'un mot de la liste, est un identifiant : la division qui le suit est lue.
  for (const s of [`x = a.return / 2; ${T} c = d / e;`, `x = m.delete / 2; ${T} c = d / e;`, `x = a?.typeof / 2; ${T} c = d / e;`]) {
    assert.notEqual(codeSeul(s), null, s);
    assert.ok(aDesSousTests(s), s);
  }
});

test("`codeSeul` : les six sources de la contre-relecture et ses cas ne cachent aucun appel (régressions par rapport à `main`)", () => {
  const T = 't.test("y", f);';
  const sources = [
    `for (;;) { break\n/"/.test(s); ${T} // "\n}`,
    `for (;;) { continue\n/"/.test(s); ${T} // "\n}`,
    `debugger\n/"/.test(s); ${T} // "`,
    `async function g() { for await (const x of y) /"/.test(b) && ${T} // "\n}`,
    `export default /"/.test(b) && ${T} // "`,
    `class A extends /"/ {}; ${T} // "`,
  ];
  for (const s of sources) assert.ok(aDesSousTests(s), s);
  const cas = [
    `x = a?.of / 2; ${T} c = d / e;`, `x = x.let / y; ${T} c = d / e;`,
    `label: for (;;) { continue label\n/"/.test(s); ${T} // "\n}`,
    `if ((a)) /"/.test(b) && ${T} // "`, `x = foo(if_) / 2; ${T} c = d / e;`,
    `x = f("(") / 2; ${T} c = d / e;`, `x = /\\(/; if (a) /"/.test(b) && ${T} // "`,
    `/* ( */ if (a) /"/.test(b) && ${T} // "`, "x = `(`; if (a) /\"/.test(b) && " + T + ' // "',
    `f((a); ${T}`, `a); ${T}`,
    `for (;;) { break\n/"/.test(s); ${T} // "\n}`, `for (;;) { continue\n/"/.test(s); ${T} // "\n}`, `debugger\n/"/.test(s); ${T} // "`,
    `async function g() { for await (const x of y) /"/.test(b) && ${T} // "\n}`,
    `if (b) {} else if (a) /"/.test(b) && ${T} // "`, `if /* c */ (a) /"/.test(b) && ${T} // "`,
    `x = o.if(a) / 2; ${T} c = d / e;`, `if (f(a)) /"/.test(b) && ${T} // "`,
    `do {} while (x) /"/.test(b) && ${T} // "`, "x = `${ (a) }`; if (a) /\"/.test(b) && " + T + ' // "',
    `x = [...of / 2]; ${T} c = d / e;`, `function* g() { yield /"/; ${T} // "\n}`, "let / 2;",
  ];
  for (const s of cas) assert.ok(aDesSousTests(s), s);
});

test("aucun banc posé du plugin n'est pris pour un banc à sous-tests, et aucun n'est dans le doute", () => {
  const racine = fileURLToPath(new URL("..", import.meta.url));
  // Les dossiers que `poses` pose, lus dans `poses.test.mjs` (pas recopiés), plus le banc `pr-titre` qu'il pose à part.
  const poses = lire(join(racine, "scripts/poses.test.mjs"), "utf8");
  const bloc = poses.slice(poses.indexOf("const POSES = ["), poses.indexOf("];", poses.indexOf("const POSES = [")));
  const dossiers = [...bloc.matchAll(/\["([^"]+)",/g)].map((m) => m[1]);
  assert.ok(dossiers.length >= 7, `${dossiers.length} dossiers lus dans POSES`);
  let vus = 0;
  for (const d of dossiers)
    for (const n of readdirSync(join(racine, d)).filter((x) => x.endsWith(".test.mjs"))) {
      const source = lire(join(racine, d, n), "utf8");
      assert.notEqual(codeSeul(source), null, `${d}/${n} : dans le doute`);
      assert.ok(!aDesSousTests(source), `${d}/${n} : pris pour un banc à sous-tests`);
      vus++;
    }
  const prTitre = "skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs";
  assert.ok(!aDesSousTests(lire(join(racine, prTitre), "utf8")), `${prTitre} : pris pour un banc à sous-tests`);
  assert.notEqual(codeSeul(lire(join(racine, prTitre), "utf8")), null, `${prTitre} : dans le doute`);
  assert.ok(vus >= 20, `${vus} bancs lus`);
});

test("le filtre de `poses.test.mjs` ne retient que des `.test.mjs` : `codeSeul` ne lit que des modules", () => {
  const racine = fileURLToPath(new URL("..", import.meta.url));
  const poses = lire(join(racine, "scripts/poses.test.mjs"), "utf8");
  // La liste des bancs que `poses` lit : un seul `.filter(…)`, sur le suffixe `.test.mjs`.
  const bancs = /const bancs = [^;]*;/.exec(poses)?.[0];
  assert.ok(bancs, "la liste `bancs` de `poses.test.mjs` n'est plus lue");
  assert.equal((bancs.match(/\.filter\(/g) ?? []).length, 1, bancs);
  assert.match(bancs, /\.filter\(\(n\) => n\.endsWith\("\.test\.mjs"\)\)/);
  // Rien d'autre que ces bancs n'est donné à `aDesSousTests` : la source lue est celle d'un banc de la liste.
  assert.equal((poses.match(/aDesSousTests\(/g) ?? []).length, 1);
  assert.match(poses, /const source = readFileSync\(join\(projet, banc\), "utf8"\);\s*return travaux\(banc, nomsDesTests\(source\), TAILLE, \{ entier: aDesSousTests\(source\), source \}\)/);
});

test("le motif d'une liste de noms est ancré et lit chaque caractère à la lettre", () => {
  const noms = ["a.b", "x (y) [z] {1} * + ? ^ $ | \\ /", "préfixe", "deux fois", "deux fois"];
  const re = new RegExp(motif(noms));
  for (const nom of noms) assert.ok(re.test(nom), nom);
  for (const autre of ["axb", "préfixe et suite", "un préfixe", "x (y) [z] {1} * + ? ^ $ | \\", ""]) assert.ok(!re.test(autre), autre);
});

test("un banc court se joue entier ; un banc long en tranches de `taille` noms, plus une tranche de reste", () => {
  assert.deepEqual(travaux("b.test.mjs", ["a", "b"], 2), [{ banc: "b.test.mjs", args: ["b.test.mjs"], noms: ["a", "b"], sorte: "entier", poids: 2, borne: 300_000 }]);
  const t = travaux("b.test.mjs", ["a", "b", "c", "d", "e"], 2);
  assert.deepEqual(t.map((x) => [x.sorte, x.noms]), [["tranche", ["a", "b"]], ["tranche", ["c", "d"]], ["tranche", ["e"]], ["reste", ["a", "b", "c", "d", "e"]]]);
  assert.deepEqual(t[0].args, [`--test-name-pattern=${motif(["a", "b"])}`, "b.test.mjs"]);
  assert.deepEqual(t[3].args, [`--test-skip-pattern=${motif(["a", "b", "c", "d", "e"])}`, "b.test.mjs"]);
  assert.throws(() => travaux("b.test.mjs", ["a"], 0), /taille/);
  // Le seuil compte les noms distincts : trois tests de deux noms tiennent dans une tranche de deux.
  assert.deepEqual(travaux("b.test.mjs", ["a", "a", "b"], 2).map((x) => x.sorte), ["entier"]);
  // Un banc à sous-tests se joue entier, quelle que soit sa taille.
  assert.deepEqual(travaux("b.test.mjs", ["a", "b", "c"], 1, { entier: true }).map((x) => x.sorte), ["entier"]);
  // Deux tests de même nom répondent au même motif : ils vont ensemble dans une seule tranche.
  const doubles = travaux("b.test.mjs", ["a", "d", "b", "d"], 1);
  assert.deepEqual(doubles.map((x) => [x.sorte, x.noms]), [["tranche", ["a"]], ["tranche", ["d", "d"]], ["tranche", ["b"]], ["reste", ["a", "d", "b", "d"]]]);
  // Le poids et la borne : une tranche de 10 (10, 600 000), une tranche de 3 (3, 300 000, la borne minimale).
  const dix = Array.from({ length: 13 }, (_, i) => `n${i}`);
  const grand = travaux("b.test.mjs", dix, 10);
  assert.deepEqual(grand.map((x) => [x.sorte, x.poids, x.borne]), [["tranche", 10, 600_000], ["tranche", 3, 300_000], ["reste", 1, 300_000]]);
  // Un banc entier de 18 noms (18, 1 080 000) ; sans nom lu (1, 300 000).
  const dixHuit = travaux("b.test.mjs", Array.from({ length: 18 }, (_, i) => `n${i}`), 1, { entier: true });
  assert.deepEqual([dixHuit[0].poids, dixHuit[0].borne], [18, 1_080_000]);
  const aucun = travaux("b.test.mjs", [], 5, { entier: true });
  assert.deepEqual([aucun[0].poids, aucun[0].borne], [1, 300_000]);
  // Le reste pèse les lignes `test(` de la source moins les noms lus : deux lignes non lues (2), puis aucune (1).
  const noms = ["a", "b", "c"];
  const deuxNonLues = 'test("a", f);\ntest("b", f);\ntest("c", f);\ntest(nom1, f);\ntest(nom2, f);\n  test("retrait", f);\n';
  assert.equal(travaux("b.test.mjs", noms, 2, { source: deuxNonLues }).at(-1).poids, 2);
  assert.equal(travaux("b.test.mjs", noms, 2, { source: 'test("a", f);\ntest("b", f);\ntest("c", f);\n' }).at(-1).poids, 1);
  assert.equal(travaux("b.test.mjs", noms, 2, { source: deuxNonLues }).at(-1).borne, 300_000);
  // CRLF, et une dernière ligne `test(` sans fin de ligne : comptées de même.
  assert.equal(travaux("b.test.mjs", noms, 2, { source: deuxNonLues.replaceAll("\n", "\r\n").trimEnd() }).at(-1).poids, 2);
  assert.equal(travaux("b.test.mjs", noms, 2, { source: 'test("a", f);\ntest("b", f);\ntest("c", f);\ntest(nom, f);\ntest(nom2, f)' }).at(-1).poids, 2);
});

test("`ordre` : les plus lourds d'abord, tous bancs confondus ; à poids égal, l'ordre reçu", () => {
  const w = (banc, sorte, poids) => ({ banc, sorte, poids, borne: 300_000 });
  const recue = [w("a", "tranche", 10), w("a", "reste", 1), w("b", "entier", 18), w("c", "tranche", 3), w("a", "tranche", 3)];
  const copie = [...recue];
  assert.deepEqual(ordre(recue).map((x) => [x.banc, x.sorte, x.poids]), [["b", "entier", 18], ["a", "tranche", 10], ["c", "tranche", 3], ["a", "tranche", 3], ["a", "reste", 1]]);
  assert.deepEqual(recue, copie, "la liste reçue n'est pas modifiée");
  // Beaucoup d'égalités : l'ordre reçu est gardé de bout en bout.
  const egaux = Array.from({ length: 40 }, (_, i) => w(`b${i}`, "tranche", 1));
  assert.deepEqual(ordre(egaux).map((x) => x.banc), egaux.map((x) => x.banc));
});

test("`pireCas` : la somme des bornes sur `parallele`, plus la plus grande", () => {
  const liste = [300_000, 300_000, 600_000, 1_080_000].map((borne) => ({ borne }));
  assert.equal(pireCas(liste, 2), 2_220_000);
});

const t = (banc, sorte, poids, borne) => ({ banc, sorte, poids, borne });
test("`recit`, `bilan` et `conclure` : un travail tué nomme sa borne, le plafond atteint rougit et le dit, le bilan est rendu en vert comme en rouge", () => {
  const liste = [t("a.test.mjs", "tranche", 10, 600_000), t("b.test.mjs", "entier", 18, 1_080_000), t("c.test.mjs", "reste", 1, 300_000), t("d.test.mjs", "entier", 2, 300_000)];
  const ok = (ms, noms = ["x"]) => ({ code: 0, signal: null, tue: false, ms, sortie: "", noms });
  const resultats = [ok(540_000), ok(108_000), ok(30_000), ok(150_000)];
  const lignes = bilan(liste, resultats, { parallele: 2, duree: 900_000 });
  assert.deepEqual(lignes, [
    "poses : 4 travaux, 2 à la fois, 900.0 s sur un plafond de 1800 s (50.0 %), pire cas 2220.0 s",
    "a.test.mjs (tranche, 10 tests) : 540.0 s sur 600 s, marge 10.0 %",
    "d.test.mjs (entier, 2 tests) : 150.0 s sur 300 s, marge 50.0 %",
    "b.test.mjs (entier, 18 tests) : 108.0 s sur 1080 s, marge 90.0 %",
  ]);
  // Un travail tué nomme sa borne ; un autre, sa sortie.
  const tue = { code: null, signal: "SIGKILL", tue: true, ms: 600_000, sortie: "a\nb", t: liste[0], noms: [] };
  assert.match(recit(tue), /^── a\.test\.mjs \(tranche, tué à sa borne de 600 s\)/);
  const echec = { code: 1, signal: null, tue: false, ms: 5, sortie: "ok 1\nnot ok 2 - cassé\n  ✖ cassé", t: liste[2], noms: [] };
  assert.match(recit(echec), /^── c\.test\.mjs \(reste, sortie 1\)\nnot ok 2 - cassé\n {2}✖ cassé/);
  // Les 40 dernières lignes de la sortie, pas moins, pas plus.
  const longue = { code: 1, signal: null, tue: false, ms: 5, sortie: Array.from({ length: 60 }, (_, i) => `l${i}`).join("\n"), t: liste[2], noms: [] };
  const vingt = recit(longue).split("\n");
  assert.equal(vingt.length, 41);
  assert.ok(vingt.includes("l20") && !vingt.includes("l19"));
  // Un travail arrêté par la garde du plafond le dit, sans parler de sa borne.
  const arrete = { code: null, signal: "SIGKILL", tue: true, arrete: true, ms: 5, sortie: "", t: liste[0], noms: [] };
  assert.match(recit(arrete), /^── a\.test\.mjs \(tranche, arrêté au plafond\)/);
  // Vert : aucune faute, le bilan rendu.
  const reel = travaux("e.test.mjs", ["a", "b"], 5);
  const vert = conclure(reel, [ok(1_000, ["a", "b"])], { parallele: 2, duree: 1_000, depasse: false, plancher: 2 });
  assert.deepEqual(vert.fautes, []);
  assert.equal(vert.diagnostics.length, 2);
  // Un échec : sa faute et le bilan quand même.
  const rouge = conclure(reel, [{ ...tue, t: reel[0] }], { parallele: 2, duree: 300_000, depasse: false, plancher: 0 });
  assert.ok(rouge.fautes.some((f) => f.startsWith("── e.test.mjs (entier, tué à sa borne de 300 s)")), rouge.fautes.join("\n"));
  assert.equal(rouge.diagnostics.length, 2);
  // Le plafond atteint : sa faute dit les travaux non joués ; la couverture et le plancher jugent ceux qui ont tourné.
  const lus = liste.map((x) => ({ ...x, noms: ["x"] }));
  const plafond = conclure(lus, [ok(1_000), undefined, undefined, undefined], { parallele: 2, duree: 1_800_000, depasse: true, plancher: 0 });
  assert.deepEqual(plafond.fautes, ["poses a atteint son plafond de 1800 s : 3 travaux non joués ; découper (un banc trop lourd, ou TAILLE)"]);
  assert.match(plafond.diagnostics[0], /100\.0 %/);
  const maigre = conclure(lus, [ok(1_000), undefined, undefined, undefined], { parallele: 2, duree: 1_800_000, depasse: true, plancher: 5 });
  assert.match(maigre.fautes.join("\n"), /ont joué 1 tests, plancher 5/);
  const trou = conclure(lus, [ok(1_000, []), undefined, undefined, undefined], { parallele: 2, duree: 1_800_000, depasse: true, plancher: 0 });
  assert.match(trou.fautes.join("\n"), /a\.test\.mjs : « x » a tourné 0 fois dans sa tranche/);
});

// Joue `lancer` sous un garde-fou : le groupe de l'enfant est tué dans un `finally`, et une promesse qui ne se résout pas fait
// rougir le test au lieu de le faire pendre.
async function jouer(args, options, { attente = 10_000, verifier } = {}) {
  const p = lancer(args, options);
  let minuterie;
  try {
    const r = await Promise.race([p, new Promise((_, refuse) => (minuterie = setTimeout(() => refuse(new Error(`lancer : non résolu en ${attente} ms`)), attente)))]);
    await verifier?.(r);
    return r;
  } finally {
    clearTimeout(minuterie);
    for (const cible of [-p.pid, p.pid]) {
      try {
        process.kill(cible, "SIGKILL");
      } catch {}
    }
  }
}

test("`lancer` : un travail tué se résout à sa borne, même quand un petit-enfant tient ses flux, et son groupe est mort", { timeout: 30_000 }, async () => {
  const env = { PATH: process.env.PATH };
  const script = "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['6'], { stdio: 'inherit' }); console.log(e.pid); setInterval(() => {}, 1000);";
  const debut = Date.now();
  // Le petit-enfant est mort avant tout nettoyage : le kill de `lancer` a tué le groupe, pas seulement l'enfant.
  const r = await jouer(["-e", script], { cwd: tmpdir(), env, borne: 1_000 }, {
    verifier: async (resultat) => {
      assert.equal(resultat.tue, true);
      assert.ok(Date.now() - debut < 3_000, `résolue en ${Date.now() - debut} ms`);
      const pid = Number(resultat.sortie.split("\n")[0]);
      assert.ok(pid > 0, resultat.sortie);
      await new Promise((fin) => setTimeout(fin, 300));
      const stat = `/proc/${pid}/stat`;
      assert.ok(!existsSync(stat) || /^\d+ \(.*\) Z/.test(lire(stat, "utf8")), "le petit-enfant est mort");
    },
  });
  assert.equal(r.tue, true);
  // Un petit-enfant détaché (`setsid`) sort du groupe : il survit au kill, mais la résolution se fait sur `exit`, flux
  // détruits, à l'heure. Sans cela (close attendu, tube tenu par le petit-enfant), elle attendrait ses 8 s.
  const detache = "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['8'], { stdio: 'inherit', detached: true }); console.log(e.pid); setInterval(() => {}, 1000);";
  const debutDetache = Date.now();
  const d = await jouer(["-e", detache], { cwd: tmpdir(), env, borne: 1_000 }, { attente: 5_000 });
  try {
    assert.equal(d.tue, true);
    assert.ok(Date.now() - debutDetache < 3_000, `résolue en ${Date.now() - debutDetache} ms`);
  } finally {
    try {
      process.kill(Number(d.sortie.split("\n")[0]), "SIGKILL");
    } catch {}
  }
  // Un travail qui finit seul : sortie complète, pas tué.
  const fini = await jouer(["-e", "console.log('a'); console.error('b');"], { cwd: tmpdir(), env, borne: 30_000 });
  assert.equal(fini.tue, false);
  assert.equal(fini.code, 0);
  assert.deepEqual(fini.sortie.split("\n").sort(), ["a", "b"]);
});

test("la couverture : chaque nom lu a tourné exactement une fois, dans sa tranche ; le reste ne rejoue aucun nom lu", () => {
  const t = travaux("b.test.mjs", ["a", "b", "c"], 2);
  const ok = [["a", "b"], ["c"], ["dynamique"]];
  assert.deepEqual(couverture(t, ok), []);
  assert.match(couverture(t, [["a"], ["c"], []]).join("\n"), /b\.test\.mjs : « b » a tourné 0 fois dans sa tranche, attendu 1/);
  assert.match(couverture(t, [["a", "b", "b"], ["c"], []]).join("\n"), /« b » a tourné 2 fois/);
  assert.match(couverture(t, [["a", "b"], ["c"], ["a"]]).join("\n"), /la tranche de reste a rejoué « a »/);
  assert.match(couverture(t, [["a", "b", "z"], ["c"], []]).join("\n"), /« z » a tourné dans une tranche qui ne le nomme pas/);
  const entier = travaux("b.test.mjs", ["a", "deux", "deux"], 5);
  assert.deepEqual(couverture(entier, [["a", "deux", "deux", "dynamique"]]), []);
  assert.match(couverture(entier, [["a", "deux"]]).join("\n"), /« deux » a tourné 1 fois, attendu 2/);
});

// Onze tests : des noms à caractères de motif, un préfixe d'un autre, un doublon, un nom calculé, un nom concaténé.
const BANC_JOUET = `import { appendFileSync, readFileSync } from "node:fs";
import { test } from "node:test";
const { journal } = JSON.parse(readFileSync(new URL("./jouet.json", import.meta.url), "utf8"));
const noter = (t) => appendFileSync(journal, t.name + "\\n");
test("un", noter);
test("deux (2) [b]", noter);
test("trois.*", noter);
test("un préfixe", noter);
test("un préfixe et sa suite", noter);
test("double", noter);
test("double", noter);
test("six", noter);
test("sept", noter);
const dyn = "dynamique";
test(\`\${dyn}\`, noter);
test("con" + "caténé", noter);
`;

test("un vrai banc joué tranche par tranche : chaque test tourne une fois, ceux que la lecture ne nomme pas compris", () => {
  const dossier = mkdtempSync(join(tmpdir(), "tranches-"));
  try {
    const journal = join(dossier, "journal");
    writeFileSync(join(dossier, "rapporteur.mjs"), RAPPORTEUR);
    // Le banc jouet est un texte constant, sans aucune valeur interpolée (A-157) : le chemin du journal se lit dans
    // un fichier JSON posé à côté de lui, et chaque test note son propre nom.
    writeFileSync(join(dossier, "jouet.json"), JSON.stringify({ journal }));
    writeFileSync(join(dossier, "jouet.test.mjs"), BANC_JOUET);
    const banc = BANC_JOUET;
    const noms = nomsDesTests(banc);
    assert.equal(noms.length, 9, "les neuf noms littéraux sont lus, pas les deux autres");
    const t = travaux("jouet.test.mjs", noms, 3);
    const executes = t.map((x, i) => {
      const sortie = join(dossier, `rapport-${i}`);
      const r = spawnSync(process.execPath, ["--test", "--test-reporter=./rapporteur.mjs", `--test-reporter-destination=${sortie}`, ...x.args], { cwd: dossier, encoding: "utf8", env: { PATH: process.env.PATH } });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      return readFileSync(sortie, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).nom);
    });
    assert.deepEqual(couverture(t, executes), []);
    const joues = readFileSync(journal, "utf8").split("\n").filter(Boolean).sort();
    assert.deepEqual(joues, ["concaténé", "deux (2) [b]", "double", "double", "dynamique", "sept", "six", "trois.*", "un", "un préfixe", "un préfixe et sa suite"].sort());
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});
