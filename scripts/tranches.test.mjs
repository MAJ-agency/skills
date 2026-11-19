// Le découpage d'un banc `node --test` en tranches (ticket 62) : `scripts/tranches.mjs`. Les noms se lisent dans la
// source ; chaque tranche joue ses noms, une tranche de reste joue ce que la lecture n'a pas reconnu ; la couverture
// dit si chaque test a tourné exactement une fois. Le dernier cas joue un vrai banc jouet, tranche par tranche.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { couverture, motif, nomsDesTests, RAPPORTEUR, travaux } from "./tranches.mjs";

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
});

test("le motif d'une liste de noms est ancré et lit chaque caractère à la lettre", () => {
  const noms = ["a.b", "x (y) [z] {1} * + ? ^ $ | \\ /", "préfixe", "deux fois", "deux fois"];
  const re = new RegExp(motif(noms));
  for (const nom of noms) assert.ok(re.test(nom), nom);
  for (const autre of ["axb", "préfixe et suite", "un préfixe", "x (y) [z] {1} * + ? ^ $ | \\", ""]) assert.ok(!re.test(autre), autre);
});

test("un banc court se joue entier ; un banc long en tranches de `taille` noms, plus une tranche de reste", () => {
  assert.deepEqual(travaux("b.test.mjs", ["a", "b"], 2), [{ banc: "b.test.mjs", args: ["b.test.mjs"], noms: ["a", "b"], sorte: "entier" }]);
  const t = travaux("b.test.mjs", ["a", "b", "c", "d", "e"], 2);
  assert.deepEqual(t.map((x) => [x.sorte, x.noms]), [["tranche", ["a", "b"]], ["tranche", ["c", "d"]], ["tranche", ["e"]], ["reste", ["a", "b", "c", "d", "e"]]]);
  assert.deepEqual(t[0].args, [`--test-name-pattern=${motif(["a", "b"])}`, "b.test.mjs"]);
  assert.deepEqual(t[3].args, [`--test-skip-pattern=${motif(["a", "b", "c", "d", "e"])}`, "b.test.mjs"]);
  assert.throws(() => travaux("b.test.mjs", ["a"], 0), /taille/);
  // Deux tests de même nom répondent au même motif : ils vont ensemble dans une seule tranche.
  const doubles = travaux("b.test.mjs", ["a", "d", "b", "d"], 1);
  assert.deepEqual(doubles.map((x) => [x.sorte, x.noms]), [["tranche", ["a"]], ["tranche", ["d", "d"]], ["tranche", ["b"]], ["reste", ["a", "d", "b", "d"]]]);
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

test("un vrai banc joué tranche par tranche : chaque test tourne une fois, ceux que la lecture ne nomme pas compris", () => {
  const dossier = mkdtempSync(join(tmpdir(), "tranches-"));
  try {
    const journal = join(dossier, "journal");
    writeFileSync(join(dossier, "rapporteur.mjs"), RAPPORTEUR);
    const banc = [
      'import { appendFileSync } from "node:fs";',
      'import { test } from "node:test";',
      `const noter = (n) => appendFileSync(${JSON.stringify(journal)}, n + "\\n");`,
      ...["un", "deux (2) [b]", "trois.*", "un préfixe", "un préfixe et sa suite", "double", "double", "six", "sept"].map((n) => `test(${JSON.stringify(n)}, () => noter(${JSON.stringify(n)}));`),
      'const dyn = "dynamique";',
      "test(`${dyn}`, () => noter(dyn));",
      'test("con" + "caténé", () => noter("concaténé"));',
    ].join("\n");
    writeFileSync(join(dossier, "jouet.test.mjs"), banc);
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
