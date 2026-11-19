// Lectures des sujets (`etat`, `carte`, `de`, `demarrer`) : le fetch de `carte` élague les refs
// `origin/sujet/*` d'un sujet supprimé du distant, sans toucher develop ni une autre ref distante,
// et dit sur la sortie d'erreur qu'il n'a pas pu lire origin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { depotJouet, script } from "./depot-jouet.mjs";

const SCRIPT = script("sujet", "sujet.sh");
const spec = (n, nom) => ({
  [`docs/features/demo/all/SPEC_ALL_DEM-${n}-demo.spec.md`]: `# SPEC_ALL_DEM-${n}\n\nSujet: sujet/${nom}\n`,
  [`docs/features/demo/all/issues/SPEC_ALL_DEM-${n}-demo.01.issue.md`]: `# .01\n\nStatus: ready-for-agent\n`,
});

// Deux sujets ouverts (a : SPEC_ALL_DEM-1, b : SPEC_ALL_DEM-2) et une branche distante hors sujet/* ;
// les refs distantes sont lues une première fois par `etat`.
function depot() {
  const d = depotJouet();
  d.branche("sujet/a", "origin/develop", spec(1, "a"), "feat(demo): a");
  d.branche("sujet/b", "origin/develop", spec(2, "b"), "feat(demo): b");
  d.branche("autre/x", "origin/develop", { "x.md": "x\n" }, "feat: x");
  d.git("switch", "-q", "--detach", "origin/develop");
  assert.equal(d.lancer(SCRIPT, "etat").status, 0);
  return d;
}
const supprimerSurLeDistant = (d, branche) =>
  d.git("--git-dir", d.origine, "update-ref", "-d", `refs/heads/${branche}`);
const refs = (d) => d.git("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin").split("\n");

test("un sujet supprimé du distant disparaît de etat, carte et de ; les sujets ouverts restent", () => {
  const d = depot();
  assert.match(d.lancer(SCRIPT, "etat").stdout, /^b\t/m);
  supprimerSurLeDistant(d, "sujet/b");
  const etat = d.lancer(SCRIPT, "etat").stdout;
  assert.match(etat, /^a\t/m);
  assert.doesNotMatch(etat, /^b\t/m);
  const carte = d.lancer(SCRIPT, "carte").stdout;
  assert.match(carte, /SPEC_ALL_DEM-1\ta/);
  assert.doesNotMatch(carte, /SPEC_ALL_DEM-2/);
  assert.equal(d.lancer(SCRIPT, "de", "SPEC_ALL_DEM-2.01").stdout.trim(), "");
  assert.equal(d.lancer(SCRIPT, "de", "SPEC_ALL_DEM-1.01").stdout.trim(), "a");
});

test("l'élagage ne touche ni origin/develop ni une ref distante hors sujet/*", () => {
  const d = depot();
  supprimerSurLeDistant(d, "sujet/b");
  // Supprimée du distant aussi : un fetch qui élague tout la ferait disparaître, celui des sujets seuls la laisse.
  supprimerSurLeDistant(d, "autre/x");
  assert.equal(d.lancer(SCRIPT, "carte").status, 0);
  const lues = refs(d);
  assert.ok(lues.includes("origin/develop"), lues.join());
  assert.ok(lues.includes("origin/autre/x"), lues.join());
  assert.ok(lues.includes("origin/sujet/a"), lues.join());
});

test("un sujet ouvert par un autre clone après la dernière lecture est vu par etat, carte et demarrer", () => {
  const d = depot();
  const sommet = d.branche("tmp/c", "origin/develop", spec(3, "c"), "feat(demo): c");
  d.git("--git-dir", d.origine, "update-ref", "refs/heads/sujet/c", sommet);
  d.git("--git-dir", d.origine, "update-ref", "-d", "refs/heads/tmp/c");
  d.git("switch", "-q", "--detach", "origin/develop");
  assert.match(d.lancer(SCRIPT, "etat").stdout, /^c\t/m);
  assert.match(d.lancer(SCRIPT, "carte").stdout, /SPEC_ALL_DEM-3\tc/);
  d.git("update-ref", "-d", "refs/remotes/origin/sujet/c");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-3-01-travail", "origin/develop");
  const r = d.lancer(SCRIPT, "demarrer", "SPEC_ALL_DEM-3.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/c$/m);
});

test("fetch en échec : les refs locales sont lues, et la sortie d'erreur le dit", () => {
  const d = depot();
  d.git("remote", "set-url", "origin", join(d.racine, "absent.git"));
  const r = d.lancer(SCRIPT, "carte");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /SPEC_ALL_DEM-1\ta/);
  assert.match(r.stderr, /sujet\.sh : fetch d'origin impossible : refs locales de develop et des sujets lues telles quelles \(un sujet supprimé peut y paraître\)/);
});
