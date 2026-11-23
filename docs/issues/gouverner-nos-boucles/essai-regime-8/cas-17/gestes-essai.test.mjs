import assert from "node:assert/strict";
import { test } from "node:test";
import {
  axesForPath,
  isRemovalFromDevelop,
  resumeSteps,
  slashStartsRegex,
} from "./gestes-essai.mjs";

test("axesForPath range chaque fichier dans son axe", () => {
  assert.equal(axesForPath("scripts/chaine/verdict.mjs"), "code");
  assert.equal(axesForPath(".github/workflows/ci.yml"), "code");
  assert.equal(
    axesForPath("docs/features/essai/all/issues/SPEC_ALL_ESS-1-essai-regime-8.01.issue.md"),
    "tickets",
  );
  assert.equal(
    axesForPath("docs/features/essai/all/SPEC_ALL_ESS-1-essai-regime-8.spec.md"),
    "tickets",
  );
  assert.equal(axesForPath("docs/metier/regles/all/RULE_ALL_PAR-1.md"), "regles-metier");
  assert.equal(axesForPath("GLOSSARY.md"), "regles-metier");
  assert.equal(axesForPath("README.md"), "documentation");
});

test("isRemovalFromDevelop reconnaît un retrait venu de develop", () => {
  const removal = { path: "src/a.mjs", line: 12, text: "  return garde();" };
  assert.equal(isRemovalFromDevelop(removal, [{ ...removal }]), true);
  assert.equal(isRemovalFromDevelop(removal, [{ ...removal, path: "src/b.mjs" }]), false);
  assert.equal(isRemovalFromDevelop(removal, []), false);
});

test("slashStartsRegex sépare une expression régulière d'une division", () => {
  assert.equal(slashStartsRegex("x = /a/", 4), true);
  assert.equal(slashStartsRegex("/a/.test(s)", 0), true);
  assert.equal(slashStartsRegex("a / 2", 2), false);
  assert.equal(slashStartsRegex("f(x) / 2", 5), false);
  assert.equal(slashStartsRegex("t[0] / 2", 5), false);
  assert.equal(slashStartsRegex("return /a/", 7), true);
  assert.equal(slashStartsRegex("typeof /a/", 7), true);
});

test("resumeSteps rend les étapes de la reprise", () => {
  const steps = resumeSteps({ loopLockFree: true });
  for (const step of [
    "prendre le verrou de la veille",
    "retirer le fichier d'arrêt",
    "préparer",
    "lancer la boucle",
  ])
    assert.ok(steps.includes(step), step);
  assert.deepEqual(resumeSteps({ loopLockFree: false }), [
    "prendre le verrou de la veille",
    "sortie 9",
  ]);
});
