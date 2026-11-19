// diff-revue.sh : le diff relu, refusé si la base n'a pas pu être rapatriée ou si le diff est vide.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const { depotJouet, dossierTemporaire } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const SCRIPT = new URL("./diff-revue.sh", import.meta.url).pathname;

// Dépôt jouet sur une branche qui change src/a.ts et l'index docs/adr/README.md.
function jouetAvecBranche() {
  const d = depotJouet();
  d.branche("feat/x", "origin/develop", { "src/a.ts": "export const a = 1;\n", "docs/adr/README.md": "- ADR_x\n" });
  const dir = dossierTemporaire("revue-");
  const revue = (...args) => d.lancer("-c", `REVUE_DIR=${dir} bash ${SCRIPT} ${args.join(" ")}`);
  return { d, dir, revue };
}

test("diff-revue : une branche qui change du code écrit un diff non vide, sans l'index généré", () => {
  const { dir, revue } = jouetAvecBranche();
  const r = revue("origin/develop");
  assert.equal(r.status, 0, r.stderr);
  const diff = readFileSync(join(dir, "diff.patch"), "utf8");
  assert.match(diff, /src\/a\.ts/);
  assert.doesNotMatch(diff, /docs\/adr\/README\.md/);
});

test("diff-revue : un fetch en échec sur une base origin/… sort en 1", () => {
  const { d, revue } = jouetAvecBranche();
  d.git("remote", "set-url", "origin", join(d.racine, "absent.git"));
  const r = revue("origin/develop");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /fetch/);
});

test("diff-revue : une base locale n'est jamais fetchée", () => {
  const { d, revue } = jouetAvecBranche();
  d.git("remote", "set-url", "origin", join(d.racine, "absent.git"));
  const r = revue("HEAD~1");
  assert.equal(r.status, 0, r.stderr);
});

test("diff-revue : un diff vide sort en 1 et écrase l'ancien diff.patch", () => {
  const { d, dir, revue } = jouetAvecBranche();
  assert.equal(revue("origin/develop").status, 0);
  d.git("switch", "-q", "-C", "vide", "origin/develop");
  const r = revue("origin/develop");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /diff vide/);
  assert.equal(readFileSync(join(dir, "diff.patch"), "utf8"), "");
});

test("diff-revue : un diff fait d'un seul index généré est vide et sort en 1", () => {
  const d = depotJouet();
  d.branche("feat/index", "origin/develop", { "docs/adr/README.md": "- ADR_x\n" });
  const dir = dossierTemporaire("revue-");
  const r = d.lancer("-c", `REVUE_DIR=${dir} bash ${SCRIPT} origin/develop`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /diff vide/);
});
