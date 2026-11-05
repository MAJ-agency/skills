import assert from "node:assert/strict";
import { test } from "node:test";
import { exemption, fusionner, inScope, metriques, plages, verdict } from "./coverage-diff-regles.mjs";

const entree = (hits, branches = [[1, 0]], fonctions = [1]) => ({
  statementMap: Object.fromEntries(hits.map((_, i) => [i, { start: { line: i + 1 } }])),
  s: Object.fromEntries(hits.map((h, i) => [i, h])),
  b: Object.fromEntries(branches.map((b, i) => [i, b])),
  f: Object.fromEntries(fonctions.map((f, i) => [i, f])),
});

test("le périmètre : le code des apps et des paquets, hors specs, routes, migrations, types générés et ui vendored", () => {
  for (const f of ["apps/api/src/domain/x.ts", "packages/contracts/src/a.ts", "apps/web/src/features/health/api/use-health.ts"])
    assert.ok(inScope(f), f);
  for (const f of [
    "apps/api/src/domain/x.spec.ts",
    "apps/api/src/x.property.spec.ts",
    "apps/api/src/db/migrations/202611-a.ts",
    "apps/api/src/db/types.ts",
    "apps/api/src/main.ts",
    "apps/api/src/app.module.ts",
    "apps/web/src/app/page.tsx",
    "apps/mobile/app/index.tsx",
    "apps/web/src/components/ui/button.tsx",
    "scripts/verify/x.mjs",
    "docs/a.md",
  ])
    assert.ok(!inScope(f), f);
});

test("les métriques lisent lignes, branches, fonctions et lignes non couvertes", () => {
  const m = metriques(entree([1, 0, 3, 0], [[2, 0], [1, 1]], [2, 0]));
  assert.deepEqual(m, { lignes: 50, branches: 75, fonctions: 50, totalFonctions: 2, totalLignes: 4, nonCouvertes: [2, 4] });
  assert.equal(plages([2, 4, 5, 6, 9]), "2, 4-6, 9");
});

test("le verdict : jamais exécuté, sous les seuils, nouveau plus exigeant, ou rien", () => {
  assert.deepEqual(verdict(metriques(entree([0, 0], [[0, 0]], [0])), { nouveau: false }), ["aucun test n'exécute ce fichier"]);
  assert.deepEqual(verdict(null, { nouveau: false }), ["aucun test n'exécute ce fichier"]);
  const moyen = metriques(entree([1, 1, 1, 1, 0], [[1, 0], [1, 1]], [1])); // 80 % lignes, 75 % branches
  assert.deepEqual(verdict(moyen, { nouveau: false }), []);
  assert.deepEqual(verdict(moyen, { nouveau: true }), ["lignes 80 % < 90 %"]);
  const faible = metriques(entree([1, 0, 0], [[1, 0, 0]], [1]));
  assert.deepEqual(verdict(faible, { nouveau: false }), ["lignes 33.3 % < 80 %", "branches 33.3 % < 70 %"]);
  assert.deepEqual(verdict(metriques(entree([1], [], [])), { nouveau: true }), []); // pas de branche, pas de fonction : n/a
});

test("la fusion additionne les compteurs des suites sans base et des suites sur base", () => {
  const sans = { "/r/a.ts": entree([1, 0], [[1, 0]], [1, 0]) };
  const avec = { "/r/a.ts": entree([0, 2], [[0, 3]], [0, 1]), "/r/b.ts": entree([1]) };
  const f = fusionner(sans, avec);
  assert.deepEqual(f["/r/a.ts"].s, { 0: 1, 1: 2 });
  assert.deepEqual(f["/r/a.ts"].b, { 0: [1, 3] });
  assert.deepEqual(f["/r/a.ts"].f, { 0: 1, 1: 1 });
  assert.ok(f["/r/b.ts"]);
});

test("l'exemption se lit dans les dix premières lignes, avec sa raison", () => {
  assert.equal(exemption("// coverage-diff: ignore — amorçage Nest, pas testable en unitaire\nexport {};"), "amorçage Nest, pas testable en unitaire");
  assert.equal(exemption("export {};\n".repeat(12) + "// coverage-diff: ignore — trop tard"), null);
});
