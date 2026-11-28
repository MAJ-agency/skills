import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { synthese, texteDuPaquet } from "./mutation-regles-synthese.mjs";

// Chaque dossier créé par le banc est retiré à la fin (A-258).
const DOSSIERS = [];
after(() => {
  for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true });
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

test("la synthèse range les survivants par règle puis par fichier, triés par ligne, avec le score", () => {
  const md = synthese(
    [
      { regle: "RULE_FNSMR_LIC-05", fichiers: ["apps/api/src/a.ts"] },
      { regle: "RULE_ALL_LIC-2", fichiers: ["apps/api/src/b.ts"] },
    ],
    stryker,
    versDepot,
  );
  assert.match(md, /^# Mutation sur les règles prouvées/);
  assert.match(md, /2 règle\(s\), 2 fichier\(s\)\. Score : 50 % \(2 tués, 2 survivants\)/);
  const a = md.indexOf("## RULE_FNSMR_LIC-05 — 2 survivant(s)");
  const b = md.indexOf("## RULE_ALL_LIC-2 — aucun survivant");
  assert.ok(a > 0 && b > a, "l'ordre des règles est celui de l'entrée, les zéros sont gardés");
  assert.ok(md.indexOf("ligne 7 :") < md.indexOf("ligne 12 :"), "les survivants sont triés par ligne");
  assert.match(md, /ligne 12 : EqualityOperator → `a <= b` \(survécu\)/);
  assert.match(md, /ligne 7 : StringLiteral → `"x'y"` \(aucun test ne l'atteint\)/);
});

test("un fichier partagé par deux règles figure sous les deux sans être compté deux fois dans le score", () => {
  const md = synthese(
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

test("une synthèse sans mutant mesuré le dit, et un remplacement multiligne reste sur une ligne", () => {
  assert.match(synthese([{ regle: "RULE_ALL_LIC-1", fichiers: ["a.ts"] }], { files: {} }), /Aucun mutant mesuré/);
  const md = synthese(
    [{ regle: "RULE_ALL_LIC-1", fichiers: ["a.ts"] }],
    { files: { "a.ts": { mutants: [{ mutatorName: "Block", status: "Survived", replacement: "{\n}\n# titre", location: { start: { line: 1 } } }] } } },
  );
  assert.match(md, /→ `\{ \} # titre`/);
});


const regle = (key, status, code) => ({ key, realisation: { status }, code });
function projet({ index, rapport }) {
  const racine = mkdtempSync(join(tmpdir(), "mutation-synthese-"));
  DOSSIERS.push(racine);
  for (const f of ["apps/api/src/a.ts", "apps/api/src/b.ts", "apps/api/src/b.controller.ts"]) {
    mkdirSync(join(racine, f, ".."), { recursive: true });
    writeFileSync(join(racine, f), "export const x = 1;\n");
  }
  if (index) {
    mkdirSync(join(racine, "anchorpost"));
    writeFileSync(join(racine, "anchorpost/anchorpost.json"), JSON.stringify(index));
  }
  if (rapport !== undefined) {
    mkdirSync(join(racine, "apps/api/reports/mutation"), { recursive: true });
    writeFileSync(join(racine, "apps/api/reports/mutation/mutation.json"), typeof rapport === "string" ? rapport : JSON.stringify(rapport));
  }
  return racine;
}
const indexJouet = { schema: "2", rules: [regle("RULE_FNSMR_LIC-05", "proven", ["apps/api/src/a.ts", "apps/api/src/gone.ts", "apps/api/src/b.controller.ts"])] };

test("la synthèse liste le hors périmètre avec son motif, ou dit « Aucun. »", () => {
  const md = synthese([{ regle: "RULE_ALL_LIC-1", fichiers: ["a.ts"] }], { files: {} }, undefined, [{ regle: "RULE_ALL_LIC-1", chemin: "b.controller.ts", motif: "hors périmètre de la mutation (…)" }]);
  assert.match(md, /## Hors périmètre\n\n- RULE_ALL_LIC-1 : `b\.controller\.ts` — hors périmètre/);
  assert.match(synthese([], { files: {} }), /## Hors périmètre\n\nAucun\./);
});

test("la synthèse nomme les fichiers prouvés d'un autre paquet, et n'écrit rien s'il n'y en a pas", () => {
  const md = synthese([], { files: {} }, undefined, [], ["packages/x/src/c.ts"]);
  assert.match(md, /## Dans un autre paquet\n\nProuvés mais pas mutés ici : .*\n\n- `packages\/x\/src\/c\.ts`/);
  assert.doesNotMatch(synthese([], { files: {} }), /autre paquet/);
});

test("sans index : la synthèse dit périmètre vide, pas « interrompu »", () => {
  const racine = projet({});
  const t = texteDuPaquet(racine, join(racine, "apps/api"));
  assert.match(t, /^Mutation sur les règles prouvées et partielles : périmètre vide — pas d'index/, "le titre de la synthèse");
  assert.doesNotMatch(t, /interrompu/);
});

test("index mais pas de rapport (passage interrompu) : « Pas de rapport de mutation »", () => {
  const racine = projet({ index: indexJouet });
  assert.equal(texteDuPaquet(racine, join(racine, "apps/api")), "Pas de rapport de mutation (passage interrompu).\n");
});

test("un rapport tronqué ou illisible dit aussi « pas de rapport », sans lever", () => {
  const racine = projet({ index: indexJouet, rapport: '{"files": {' });
  assert.match(texteDuPaquet(racine, join(racine, "apps/api")), /^Pas de rapport de mutation \(rapport illisible/);
});

test("index et rapport : la synthèse par règle, chemins ramenés à la racine, et les écarts en hors périmètre", () => {
  const racine = projet({
    index: indexJouet,
    rapport: { files: { "src/a.ts": { mutants: [{ mutatorName: "EqualityOperator", status: "Survived", replacement: "a <= b", location: { start: { line: 4 } } }, { mutatorName: "Block", status: "Killed", location: { start: { line: 1 } } }] } } },
  });
  const t = texteDuPaquet(racine, join(racine, "apps/api"));
  assert.match(t, /## RULE_FNSMR_LIC-05 — 1 survivant\(s\)/);
  assert.match(t, /- `apps\/api\/src\/a\.ts` — 1 survivant\(s\)\n  - ligne 4 : EqualityOperator → `a <= b` \(survécu\)/);
  assert.match(t, /Score : 50 %/);
  assert.match(t, /RULE_FNSMR_LIC-05 : `apps\/api\/src\/gone\.ts` — absent du dépôt/);
  assert.match(t, /RULE_FNSMR_LIC-05 : `apps\/api\/src\/b\.controller\.ts` — hors périmètre de la mutation/);
});

test("une clé de règle ou un nom de mutant hostile ne casse pas la mise en forme", () => {
  const md = synthese(
    [{ regle: "RULE_ALL_LIC-1\n# faux titre `x`", fichiers: ["a.ts"] }],
    { files: { "a.ts": { mutants: [{ mutatorName: "Bloc\n## piège", status: "Survived", location: { start: { line: 1 } } }] } } },
  );
  assert.match(md, /^## RULE_ALL_LIC-1 # faux titre 'x' — 1 survivant\(s\)$/m);
  assert.doesNotMatch(md, /^# faux titre/m);
  assert.doesNotMatch(md, /^## piège/m);
});

// La criticité posée par une fonction : aucun texte du plugin ne la montre en ligne (scripts/depot.test.mjs).
const niveauDeclare = (level) => ({ level, origin: "declared" });
// K6 de la preuve suffisante (SPEC_ALL_ANC-5 § 7, RULE_ALL_ANC-29) : la mesure datée, par règle, avec sa criticité ;
// « non mesurée », jamais « 0 % » ; la baisse d'une règle moyenne dite d'un passage à l'autre, sans rien refuser.
import { baisses, lireMesure, lireOptions, mesure } from "./mutation-regles-synthese.mjs";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUR_BASE = { files: { "src/c.ts": { mutants: [{ status: "NoCoverage" }, { status: "NoCoverage" }] }, "src/d.ts": { mutants: [{ status: "Killed" }, { status: "NoCoverage" }] } } };

test("la mesure par règle : tués, survivants, score ; « non mesurée » (score null) quand aucun mutant n'est atteint par un test rejoué", () => {
  const m = mesure(
    [
      { regle: "RULE_ALL_LIC-1", criticite: "medium", fichiers: ["apps/api/src/a.ts", "apps/api/src/a.ts"] },
      { regle: "RULE_ALL_LIC-2", criticite: "high", fichiers: ["apps/api/src/c.ts"] },
      { regle: "RULE_ALL_LIC-3", fichiers: ["apps/api/src/d.ts", "apps/api/src/absent.ts"] },
    ],
    { files: { ...stryker.files, ...SUR_BASE.files } },
    versDepot,
    "2026-11-22",
  );
  assert.deepEqual(m, {
    date: "2026-11-22",
    regles: [
      { regle: "RULE_ALL_LIC-1", criticite: "medium", tues: 1, survivants: 2, score: 33 },
      { regle: "RULE_ALL_LIC-2", criticite: "high", tues: 0, survivants: 2, score: null },
      { regle: "RULE_ALL_LIC-3", criticite: null, tues: 1, survivants: 1, score: 50 },
    ],
  });
  assert.deepEqual(mesure([{ regle: "RULE_ALL_LIC-4", fichiers: ["x.ts"] }], { files: {} }).regles[0].score, null, "aucun mutant : non mesurée");
});

test("la synthèse dit la date, et pour chaque règle sa criticité et son score, ou « non mesurée », jamais « 0 % »", () => {
  const md = synthese(
    [
      { regle: "RULE_ALL_LIC-1", criticite: "medium", fichiers: ["apps/api/src/a.ts"] },
      { regle: "RULE_ALL_LIC-2", criticite: "high", fichiers: ["apps/api/src/c.ts"] },
    ],
    { files: { ...stryker.files, ...SUR_BASE.files } },
    versDepot,
    [],
    [],
    { date: "2026-11-22" },
  );
  assert.match(md, /^# Mutation sur les règles prouvées et partielles\n\n2 règle\(s\), 2 fichier\(s\)\. .*\n\nMesure du 2026-11-22\.\n/, "une date donnée n'est pas dite « jour UTC du passage »");
  assert.match(synthese([], { files: {} }, versDepot, [], [], { date: "2026-11-22", utc: true }), /\n\nMesure du 2026-11-22 \(jour UTC du passage\)\.\n/);
  assert.match(md, /## RULE_ALL_LIC-1 — 2 survivant\(s\)\n\nCriticité : moyenne\. Score : 33 % \(1 tués, 2 survivants\)\./);
  assert.match(md, /## RULE_ALL_LIC-2 — 2 survivant\(s\)\n\nCriticité : haute\. Non mesurée : aucun mutant de son code n'est atteint par un test rejoué/);
  assert.doesNotMatch(md, /Score : 0 %/);
  assert.match(synthese([{ regle: "RULE_ALL_LIC-5", fichiers: ["a.ts"] }], { files: {} }), /Criticité : à classer\. Non mesurée/);
  assert.doesNotMatch(md, /Baisses/, "sans option precedente, pas de section des baisses");
});

test("les baisses : une règle moyenne mesurée les deux fois dont le score descend ; pas une haute, une basse, une non mesurée ou une nouvelle", () => {
  const avant = { date: "2026-11-15", regles: [{ regle: "A", score: 80 }, { regle: "B", score: 80 }, { regle: "C", score: 80 }, { regle: "D", score: null }, { regle: "E", score: 50 }, { regle: "F", score: 70 }] };
  const apres = {
    regles: [
      { regle: "A", criticite: "medium", score: 79 },
      { regle: "B", criticite: "high", score: 10 },
      { regle: "C", criticite: "medium", score: null },
      { regle: "D", criticite: "medium", score: 20 },
      { regle: "E", criticite: "medium", score: 50 },
      { regle: "G", criticite: "medium", score: 1 },
      { regle: "F", criticite: "low", score: 0 },
    ],
  };
  assert.deepEqual(baisses(avant, apres), [{ regle: "A", avant: 80, apres: 79 }]);
  assert.deepEqual(baisses(null, apres), []);
});

test("la section des baisses : listées avec les deux scores et la date d'avant ; aucune ; ou pas de mesure précédente lisible", () => {
  const regles = [{ regle: "RULE_ALL_LIC-1", criticite: "medium", fichiers: ["apps/api/src/a.ts"] }];
  const avec = (precedente) => synthese(regles, stryker, versDepot, [], [], { date: "2026-11-22", precedente });
  assert.match(avec({ date: "2026-11-15", regles: [{ regle: "RULE_ALL_LIC-1", score: 50 }] }), /## Baisses sur une règle moyenne\n\n- RULE_ALL_LIC-1 : 50 % le 2026-11-15, 33 % aujourd'hui\n/);
  assert.match(avec({ date: "2026-11-15", regles: [{ regle: "RULE_ALL_LIC-1", score: 33 }] }), /## Baisses sur une règle moyenne\n\nAucune depuis la mesure du 2026-11-15\./);
  assert.match(avec(null), /## Baisses sur une règle moyenne\n\nPas de mesure précédente lisible : aucune baisse ne se juge\./);
});

test("lireMesure et lireOptions : une mesure d'une autre forme ne se lit pas ; une option inconnue, sans valeur ou une date mal écrite est un usage faux", () => {
  assert.deepEqual(lireMesure('{"date":"2026-11-15","regles":[{"regle":"A","score":null},{"regle":"B","score":12}]}').regles.length, 2);
  for (const t of ["", "{", "null", '{"date":"x"}', '{"date":"x","regles":[{"regle":"A","score":"12"}]}', '{"regles":[]}']) assert.equal(lireMesure(t), null, t);
  assert.deepEqual(lireOptions(["--date", "2026-11-22", "--mesure", "m.json", "--precedente", "p.json"]), { date: "2026-11-22", mesure: "m.json", precedente: "p.json" });
  assert.deepEqual(lireOptions([]), {});
  for (const a of [["--date", "22/11/2026"], ["--date", "2026-13-45"], ["--date", "2026-02-30"], ["--mesure"], ["--mesure", "--date"], ["--tout", "x"]]) assert.equal(lireOptions(a), null, a.join(" "));
  assert.deepEqual(lireOptions(["--date", "2028-02-29"]), { date: "2028-02-29" }, "un 29 février d'année bissextile est un jour");
});

test("le point d'entrée : --mesure écrit la mesure datée en JSON, --precedente dit la baisse ; un usage faux sort en 2", () => {
  const index = { schema: "3", rules: [{ key: "RULE_ALL_LIC-1", realisation: { status: "partial" }, criticality: niveauDeclare("medium"), code: ["apps/api/src/a.ts"] }] };
  const racine = projet({ index, rapport: stryker });
  writeFileSync(join(racine, "apps/api/precedente.json"), JSON.stringify({ date: "2026-11-15", regles: [{ regle: "RULE_ALL_LIC-1", score: 90 }] }));
  const script = fileURLToPath(new URL("./mutation-regles-synthese.mjs", import.meta.url));
  const r = spawnSync(process.execPath, [script, "--date", "2026-11-22", "--mesure", "reports/mutation/mesure-regles.json", "--precedente", "precedente.json"], {
    cwd: join(racine, "apps/api"),
    encoding: "utf8",
    env: { ...process.env, PROJET_RACINE: racine },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /- RULE_ALL_LIC-1 : 90 % le 2026-11-15, 33 % aujourd'hui/);
  assert.match(r.stdout, /Mesure du 2026-11-22\.\n/, "--date donnée : pas « jour UTC du passage »");
  assert.deepEqual(JSON.parse(readFileSync(join(racine, "apps/api/reports/mutation/mesure-regles.json"), "utf8")), {
    date: "2026-11-22",
    regles: [{ regle: "RULE_ALL_LIC-1", criticite: "medium", tues: 1, survivants: 2, score: 33 }],
  });
  const absente = spawnSync(process.execPath, [script, "--precedente", "absente.json"], { cwd: join(racine, "apps/api"), encoding: "utf8", env: { ...process.env, PROJET_RACINE: racine } });
  assert.match(absente.stdout, /Pas de mesure précédente lisible/);
  assert.match(absente.stdout, /Mesure du \d{4}-\d{2}-\d{2} \(jour UTC du passage\)/, "sans --date, le jour UTC du passage");
  const faux = spawnSync(process.execPath, [script, "--date", "hier"], { cwd: join(racine, "apps/api"), encoding: "utf8", env: { ...process.env, PROJET_RACINE: racine } });
  assert.equal(faux.status, 2);
  assert.match(faux.stderr, /usage : node scripts\/verify\/mutation-regles-synthese\.mjs \[--date AAAA-MM-JJ\]/);
});
