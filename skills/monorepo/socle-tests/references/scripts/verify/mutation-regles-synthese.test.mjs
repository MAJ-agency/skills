import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { synthese, texteDuPaquet } from "./mutation-regles-synthese.mjs";

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

test("sans index : la synthèse dit périmètre vide, pas « interrompu »", () => {
  const racine = projet({});
  const t = texteDuPaquet(racine, join(racine, "apps/api"));
  assert.match(t, /périmètre vide — pas d'index/);
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
