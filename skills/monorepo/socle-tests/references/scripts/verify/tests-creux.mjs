#!/usr/bin/env node
/**
 * Tests creux : un `it` dont la SEULE assertion est `toBeDefined()` ou `toBeTruthy()` ne
 * prouve rien — un objet vide, une chaîne quelconque ou une promesse non résolue passent.
 *
 * Observé sur un premier projet : des cas « should create … » dont l'unique assertion est
 * `expect(result).toBeDefined()`, verts sur un retour `{}`. Le lint des tests
 * (`@vitest/eslint-plugin`, `expect-expect`) garantit qu'un `it` contient une assertion, pas
 * qu'elle contraint quelque chose ; cette vérification complète le lint là où ESLint ne sait
 * pas compter.
 *
 * Analyse par l'AST TypeScript (pas de regex). Pour chaque `it(...)` / `test(...)` (et
 * `.only`, `.skip`, `.each(...)(...)`) : l'ensemble des matchers appelés sur un `expect(...)`
 * dans le corps du cas (à travers `.not`, `.resolves`, `.rejects`). Signalé quand cet
 * ensemble est non vide et entièrement inclus dans { toBeDefined, toBeTruthy }. Un cas sans
 * `expect` direct (assertions déléguées à un helper) relève de `vitest/expect-expect`.
 *
 * Échappatoire, pour un cas que l'on assume (fumée d'instanciation d'un module Nest, par
 * exemple) : `// tests-creux: ignore — <raison>` sur l'une des deux lignes au-dessus du `it`.
 *
 * Usage : node scripts/verify/tests-creux.mjs        (pnpm check, après lint)
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 * Sorties : 0 OK · 1 au moins un cas creux.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";

const ROOT = process.env.PROJET_RACINE ?? new URL("../..", import.meta.url).pathname;
// `typescript` est celui du projet analysé (dépendance de la racine) ; à défaut, celui que le
// script trouve depuis son propre emplacement (banc d'essai du skill).
const ts = (() => {
  for (const depuis of [join(ROOT, "package.json"), import.meta.url]) {
    try {
      return createRequire(depuis)("typescript");
    } catch {
      /* suivant */
    }
  }
  throw new Error("tests-creux : `typescript` introuvable (dépendance de la racine du projet)");
})();
const SCAN = ["apps", "packages"].map((d) => join(ROOT, d)).filter((d) => existsSync(d));
const SPEC = /\.(spec|e2e-spec|test)\.tsx?$/;
const IGNORE = /tests-creux:\s*ignore\s*[—–:-]\s*\S/;
const CREUX = new Set(["toBeDefined", "toBeTruthy"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".expo", "coverage", ".turbo"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (SPEC.test(name)) out.push(p);
  }
  return out;
}

/** `it`, `test`, `it.only`, `it.skip`, `it.each(...)` — le nom du cas est le premier argument. */
function isTestCase(call) {
  const callee = call.expression;
  const root = (n) => {
    if (ts.isIdentifier(n)) return n.text;
    if (ts.isPropertyAccessExpression(n)) return root(n.expression);
    if (ts.isCallExpression(n)) return root(n.expression); // it.each(table)(name, fn)
    return null;
  };
  const name = root(callee);
  if (name !== "it" && name !== "test") return false;
  if (ts.isIdentifier(callee) || ts.isPropertyAccessExpression(callee)) return call.arguments.length >= 2;
  return ts.isCallExpression(callee) && call.arguments.length >= 2; // each
}

/** Nom du matcher si `call` est `expect(...)[.not|.resolves|.rejects]*.<matcher>(...)`. */
function matcherOf(call) {
  if (!ts.isPropertyAccessExpression(call.expression)) return null;
  const name = call.expression.name.text;
  let obj = call.expression.expression;
  while (ts.isPropertyAccessExpression(obj) && ["not", "resolves", "rejects"].includes(obj.name.text))
    obj = obj.expression;
  if (ts.isCallExpression(obj) && ts.isIdentifier(obj.expression) && obj.expression.text === "expect") return name;
  if (
    ts.isCallExpression(obj) &&
    ts.isPropertyAccessExpression(obj.expression) &&
    ts.isIdentifier(obj.expression.expression) &&
    obj.expression.expression.text === "expect"
  )
    return name; // expect.soft(...)
  return null;
}

const errors = [];
let cases = 0;
let ignored = 0;
for (const dir of SCAN) {
  for (const file of walk(dir)) {
    const src = readFileSync(file, "utf8");
    if (!src.includes("expect(")) continue;
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
    const lines = src.split("\n");
    const rel = relative(ROOT, file);

    const visit = (n) => {
      if (ts.isCallExpression(n) && isTestCase(n)) {
        cases++;
        const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        const matchers = new Set();
        const collect = (m) => {
          if (ts.isCallExpression(m)) {
            const name = matcherOf(m);
            if (name) matchers.add(name);
          }
          ts.forEachChild(m, collect);
        };
        collect(n.arguments[1]);
        if (matchers.size && [...matchers].every((m) => CREUX.has(m))) {
          const exempt = lines.slice(Math.max(0, line - 3), line - 1).some((l) => IGNORE.test(l));
          if (exempt) ignored++;
          else {
            const title = n.arguments[0].getText(sf).replace(/\s+/g, " ").slice(0, 70);
            errors.push(`${rel}:${line} : ${title} — seule(s) assertion(s) : ${[...matchers].join(", ")}`);
          }
        }
        return; // pas de cas imbriqué
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
}

console.log(`tests-creux: ${cases} cas analysés${ignored ? ` (${ignored} exemption(s) commentée(s))` : ""}`);
for (const e of errors) console.log(`  ✖ ${e}`);
if (errors.length) {
  console.log(
    "  → contraindre le résultat (toEqual, toMatchObject, toHaveLength, toBe…) ; un cas assumé porte\n" +
      "    `// tests-creux: ignore — <raison>` sur la ligne au-dessus.",
  );
  process.exit(1);
}
console.log("tests-creux: OK");
