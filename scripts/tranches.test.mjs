// Le découpage d'un banc `node --test` en tranches (ticket 62) : `scripts/tranches.mjs`. Les noms se lisent dans la
// source ; chaque tranche joue ses noms, une tranche de reste joue ce que la lecture n'a pas reconnu ; la couverture
// dit si chaque test a tourné exactement une fois. Le dernier cas joue un vrai banc jouet, tranche par tranche.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { aDesSousTests, couverture, motif, nomsDesTests, RAPPORTEUR, travaux } from "./tranches.mjs";

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
  // Le seuil compte les noms distincts : trois tests de deux noms tiennent dans une tranche de deux.
  assert.deepEqual(travaux("b.test.mjs", ["a", "a", "b"], 2).map((x) => x.sorte), ["entier"]);
  // Un banc à sous-tests se joue entier, quelle que soit sa taille.
  assert.deepEqual(travaux("b.test.mjs", ["a", "b", "c"], 1, { entier: true }).map((x) => x.sorte), ["entier"]);
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
