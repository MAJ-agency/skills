import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { normaliser, perimetre, perimetreDuDepot, perimetreDuPaquet, rapport } from "./mutation-regles.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
const CONFIG = join(ICI, "../../gabarits/stryker.regles.config.mjs");

const regle = (key, status, code) => ({ key, realisation: { status, levels: [], proofCount: 0, inherited: false }, code });
const index = (rules, schema = "2") => ({ schema, rules });
const tous = () => true;

test("deux règles prouvées, trois fichiers : l'union, triée, avec ses fichiers par règle", () => {
  const p = perimetre(
    index([
      regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/b.ts", "apps/api/src/a.ts"]),
      regle("RULE_ALL_LIC-2", "proven", ["packages/x/src/c.ts"]),
    ]),
    tous,
  );
  assert.deepEqual(p.fichiers, ["apps/api/src/a.ts", "apps/api/src/b.ts", "packages/x/src/c.ts"]);
  assert.deepEqual(p.regles, [
    { regle: "RULE_ALL_LIC-1", fichiers: ["apps/api/src/b.ts", "apps/api/src/a.ts"] },
    { regle: "RULE_ALL_LIC-2", fichiers: ["packages/x/src/c.ts"] },
  ]);
  assert.deepEqual(p.ecartes, []);
  assert.equal(p.raison, undefined);
});

test("une règle to-build, configured ou contradiction n'entre pas, même avec du code déclaré", () => {
  const p = perimetre(
    index([
      regle("RULE_ALL_LIC-1", "proven", ["a.ts"]),
      regle("RULE_ALL_LIC-2", "to-build", ["b.ts"]),
      regle("RULE_ALL_LIC-3", "configured", ["c.ts"]),
      regle("RULE_ALL_LIC-4", "contradiction", ["d.ts"]),
    ]),
    tous,
  );
  assert.deepEqual(p.fichiers, ["a.ts"]);
  assert.deepEqual(p.ecartes, []);
});

test("un chemin de code absent du dépôt est écarté, nommé avec sa règle, et le reste est gardé", () => {
  const p = perimetre(index([regle("RULE_FNSMR_LIC-05", "proven", ["src/ici.ts", "src/absent.ts"])]), (c) => c === "src/ici.ts");
  assert.deepEqual(p.fichiers, ["src/ici.ts"]);
  assert.deepEqual(p.ecartes, [{ regle: "RULE_FNSMR_LIC-05", chemin: "src/absent.ts", motif: "absent du dépôt" }]);
});

test("la clé d'une règle garde ses zéros de tête, telle que l'index l'écrit", () => {
  const p = perimetre(index([regle("RULE_FNSMR_LIC-05", "proven", ["a.ts"])]), tous);
  assert.equal(p.regles[0].regle, "RULE_FNSMR_LIC-05");
});

test("un fichier déclaré par deux règles est muté une fois et figure sous les deux", () => {
  const p = perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts", "./a.ts"]), regle("RULE_ALL_LIC-2", "proven", ["a.ts"])]), tous);
  assert.deepEqual(p.fichiers, ["a.ts"]);
  assert.deepEqual(p.regles.map((r) => [r.regle, r.fichiers]), [["RULE_ALL_LIC-1", ["a.ts"]], ["RULE_ALL_LIC-2", ["a.ts"]]]);
});

test("pas d'index : périmètre vide, raison dite, rien d'écarté", () => {
  const p = perimetre(undefined, tous);
  assert.deepEqual([p.fichiers, p.regles, p.ecartes], [[], [], []]);
  assert.match(p.raison, /pas d'index anchorpost\/anchorpost\.json.*ne suit pas Anchorpost/);
});

test("index illisible, d'un autre schéma ou sans liste de règles : vide, avec une raison propre à chaque cas", () => {
  assert.match(perimetre(null, tous).raison, /illisible/);
  assert.match(perimetre([], tous).raison, /illisible/);
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts"])], "1"), tous).raison, /schéma "1".*schéma "2"/);
  assert.match(perimetre({ schema: "2" }, tous).raison, /sans liste de règles/);
  for (const p of [perimetre(null, tous), perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts"])], "1"), tous)]) assert.deepEqual(p.fichiers, []);
});

test("des règles prouvées sans fichier de code, ou sans règle prouvée : vide, et la raison les distingue", () => {
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "proven", undefined)]), tous).raison, /1 règle\(s\) prouvée\(s\), aucune ne déclare de fichier/);
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "to-build", ["a.ts"])]), tous).raison, /aucune règle prouvée/);
  assert.match(perimetre(index([]), tous).raison, /aucune règle prouvée/);
});

test("un chemin qui sort du dépôt, un test, une déclaration ou un autre langage est écarté, jamais muté", () => {
  const p = perimetre(
    index([regle("RULE_ALL_LIC-1", "proven", ["../hors.ts", "/etc/passwd.ts", "C:/x.ts", "a/../../b.ts", "src/a.spec.ts", "src/a.d.ts", "db/schema.sql", 42, "src/ok.ts"])]),
    tous,
  );
  assert.deepEqual(p.fichiers, ["src/ok.ts"]);
  assert.deepEqual(
    p.ecartes.map((e) => [e.chemin, e.motif.split(" ")[0]]),
    [["../hors.ts", "hors"], ["/etc/passwd.ts", "hors"], ["C:/x.ts", "hors"], ["a/../../b.ts", "hors"], ["src/a.spec.ts", "pas"], ["src/a.d.ts", "pas"], ["db/schema.sql", "pas"], ["42", "hors"]],
  );
});

test("normaliser : ./ et // retirés, slashs, sorties du dépôt refusées", () => {
  assert.equal(normaliser("./apps//api/src/a.ts"), "apps/api/src/a.ts");
  assert.equal(normaliser("apps\\api\\a.ts"), "apps/api/a.ts");
  for (const mauvais of ["", ".", "..", "../a", "/a", "D:\\a", null, undefined, 3]) assert.equal(normaliser(mauvais), null);
});

function depot(contenu, fichiers = []) {
  const racine = mkdtempSync(join(tmpdir(), "mutation-regles-"));
  for (const f of fichiers) {
    mkdirSync(join(racine, f, ".."), { recursive: true });
    writeFileSync(join(racine, f), "export const x = 1;\n");
  }
  if (contenu !== undefined) {
    mkdirSync(join(racine, "anchorpost"), { recursive: true });
    writeFileSync(join(racine, "anchorpost/anchorpost.json"), typeof contenu === "string" ? contenu : JSON.stringify(contenu));
  }
  return racine;
}

test("perimetreDuDepot lit l'index commis : un fichier réel est retenu, un dossier ou un absent est écarté", () => {
  const racine = depot(index([regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/a.ts", "apps/api/src", "apps/api/src/b.ts"])]), ["apps/api/src/a.ts"]);
  const p = perimetreDuDepot(racine);
  assert.deepEqual(p.fichiers, ["apps/api/src/a.ts"]);
  assert.deepEqual(p.ecartes.map((e) => e.chemin), ["apps/api/src", "apps/api/src/b.ts"]);
});

test("perimetreDuDepot : index absent ou JSON invalide → vide, sans lever", () => {
  assert.match(perimetreDuDepot(depot(undefined)).raison, /pas d'index/);
  assert.match(perimetreDuDepot(depot("{ pas du json")).raison, /illisible/);
});

test("perimetreDuPaquet ne garde que les fichiers du paquet, en chemins relatifs, et compte ce qui est ailleurs", () => {
  const racine = depot(
    index([regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/a.ts", "packages/x/src/c.ts"]), regle("RULE_ALL_LIC-2", "proven", ["packages/x/src/c.ts"])]),
    ["apps/api/src/a.ts", "packages/x/src/c.ts"],
  );
  const p = perimetreDuPaquet(racine, join(racine, "apps/api"));
  assert.deepEqual(p.mutate, ["src/a.ts"]);
  assert.deepEqual(p.regles, [{ regle: "RULE_ALL_LIC-1", fichiers: ["apps/api/src/a.ts"] }]);
  assert.equal(p.dehors, 1);
  assert.equal(p.raison, undefined);
  const autre = perimetreDuPaquet(racine, join(racine, "apps/web"));
  assert.deepEqual(autre.mutate, []);
  assert.match(autre.raison, /aucun des 2 fichier\(s\) du périmètre n'est dans ce paquet/);
});

const stryker = {
  files: {
    "src/a.ts": {
      mutants: [
        { id: "1", mutatorName: "ConditionalExpression", status: "Killed", location: { start: { line: 3 } } },
        { id: "2", mutatorName: "EqualityOperator", status: "Survived", replacement: "a <= b", location: { start: { line: 12 } } },
        { id: "3", mutatorName: "StringLiteral", status: "NoCoverage", replacement: '"x`y"', location: { start: { line: 7 } } },
      ],
    },
    "src/b.ts": { mutants: [{ id: "4", mutatorName: "BlockStatement", status: "Killed", location: { start: { line: 1 } } }] },
  },
};
const versDepot = (c) => `apps/api/${c}`;

test("le rapport range les survivants par règle puis par fichier, triés par ligne, avec le score", () => {
  const md = rapport(
    [
      { regle: "RULE_FNSMR_LIC-05", fichiers: ["apps/api/src/a.ts"] },
      { regle: "RULE_ALL_LIC-2", fichiers: ["apps/api/src/b.ts"] },
    ],
    stryker,
    versDepot,
  );
  assert.match(md, /^# Mutation des règles prouvées/);
  assert.match(md, /2 règle\(s\), 2 fichier\(s\)\. Score : 50 % \(2 tués, 2 survivants\)/);
  const a = md.indexOf("## RULE_FNSMR_LIC-05 — 2 survivant(s)");
  const b = md.indexOf("## RULE_ALL_LIC-2 — aucun survivant");
  assert.ok(a > 0 && b > a, "l'ordre des règles est celui de l'entrée, les zéros sont gardés");
  assert.ok(md.indexOf("ligne 7 :") < md.indexOf("ligne 12 :"), "les survivants sont triés par ligne");
  assert.match(md, /ligne 12 : EqualityOperator → `a <= b` \(survécu\)/);
  assert.match(md, /ligne 7 : StringLiteral → `"x'y"` \(aucun test ne l'atteint\)/);
});

test("un fichier partagé par deux règles figure sous les deux sans être compté deux fois dans le score", () => {
  const md = rapport(
    [
      { regle: "RULE_ALL_LIC-1", fichiers: ["apps/api/src/a.ts"] },
      { regle: "RULE_ALL_LIC-2", fichiers: ["apps/api/src/a.ts"] },
    ],
    stryker,
    versDepot,
  );
  assert.match(md, /Score : 33 % \(1 tués, 2 survivants\)/);
  assert.equal(md.match(/ligne 12 :/g).length, 2);
});

test("un rapport sans mutant mesuré le dit, et un remplacement multiligne reste sur une ligne", () => {
  assert.match(rapport([{ regle: "RULE_ALL_LIC-1", fichiers: ["a.ts"] }], { files: {} }), /Aucun mutant mesuré/);
  const md = rapport(
    [{ regle: "RULE_ALL_LIC-1", fichiers: ["a.ts"] }],
    { files: { "a.ts": { mutants: [{ mutatorName: "Block", status: "Survived", replacement: "{\n}\n# titre", location: { start: { line: 1 } } }] } } },
  );
  assert.match(md, /→ `\{ \} # titre`/);
});

function projet({ avecIndex }) {
  const racine = depot(avecIndex ? index([regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/a.ts"]), regle("RULE_ALL_LIC-2", "proven", ["apps/api/src/gone.ts"]), regle("RULE_ALL_LIC-3", "to-build", ["apps/api/src/c.ts"])]) : undefined, [
    "apps/api/src/a.ts",
    "apps/api/src/c.ts",
  ]);
  mkdirSync(join(racine, "scripts/verify"), { recursive: true });
  copyFileSync(join(ICI, "mutation-regles.mjs"), join(racine, "scripts/verify/mutation-regles.mjs"));
  copyFileSync(CONFIG, join(racine, "apps/api/stryker.regles.config.mjs"));
  return racine;
}
const lancer = (racine, args, cwd = racine) =>
  spawnSync(process.execPath, [join(racine, "scripts/verify/mutation-regles.mjs"), ...args], { cwd, encoding: "utf8", env: { ...process.env, PROJET_RACINE: undefined, GITHUB_STEP_SUMMARY: undefined } });

test("--list : un fichier par ligne sur stdout, ce qui est écarté sur stderr, sortie 0", () => {
  const r = lancer(projet({ avecIndex: true }), ["--list"]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "apps/api/src/a.ts\n");
  assert.match(r.stderr, /écarté RULE_ALL_LIC-2 apps\/api\/src\/gone\.ts — absent du dépôt/);
});

test("--list sans index : rien sur stdout, la raison sur stderr, sortie 0", () => {
  const r = lancer(projet({ avecIndex: false }), ["--list"]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /périmètre vide — pas d'index anchorpost\/anchorpost\.json/);
});

test("--lancer sans index : ne lance rien (ni pnpm ni Stryker), le dit, sortie 0", () => {
  const racine = projet({ avecIndex: false });
  const r = lancer(racine, ["--lancer"], join(racine, "apps/api"));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /périmètre vide — pas d'index/);
  assert.doesNotMatch(r.stdout, /fichier\(s\) à muter/);
});

test("sans option, usage et sortie 2", () => {
  const r = lancer(projet({ avecIndex: false }), []);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage/);
});

test("la config Stryker des règles lit le périmètre du paquet : mutate relatif, vide sans index", () => {
  const lire = (racine) =>
    JSON.parse(
      spawnSync(process.execPath, ["--input-type=module", "-e", "import('./stryker.regles.config.mjs').then((m) => console.log(JSON.stringify(m.default)))"], {
        cwd: join(racine, "apps/api"),
        encoding: "utf8",
        env: { ...process.env, PROJET_RACINE: undefined },
      }).stdout,
    );
  const avec = lire(projet({ avecIndex: true }));
  assert.deepEqual(avec.mutate, ["src/a.ts"]);
  assert.equal(avec.thresholds.break, undefined, "pas de plancher en V1");
  assert.ok(avec.reporters.includes("json"));
  assert.deepEqual(lire(projet({ avecIndex: false })).mutate, []);
});
