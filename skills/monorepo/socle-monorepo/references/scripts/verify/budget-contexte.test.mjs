import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";

// Chaque dossier créé par le banc est retiré à la fin (A-258).
const DOSSIERS = [];
after(() => {
  for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true });
});

const SCRIPT = new URL("./budget-contexte.mjs", import.meta.url).pathname;
function depot(fichiers) {
  const racine = mkdtempSync(join(tmpdir(), "budget-contexte-"));
  DOSSIERS.push(racine);
  execFileSync("git", ["init", "-q", racine]);
  for (const [chemin, texte] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(racine, chemin)), { recursive: true });
    writeFileSync(join(racine, chemin), texte);
  }
  return racine;
}
const lancer = (racine) => spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, PROJET_RACINE: racine }, encoding: "utf8" });

test("un CLAUDE.md court et des règles à paths: qui désignent des fichiers passent", () => {
  const r = lancer(depot({ "CLAUDE.md": "# x\n", ".claude/rules/tests.md": "---\npaths:\n  - '**/*.spec.ts'\n  - 'tests-a-venir/**'\n---\n# t\n", "apps/api/src/a.spec.ts": "" }));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /budget-contexte : OK — CLAUDE.md 1 lignes, 1 règles par chemin/);
});

test("CLAUDE.md trop long, règle sans frontmatter, motif qui ne désigne rien : trois écarts nommés", () => {
  const r = lancer(depot({ "CLAUDE.md": "# x\n".repeat(201), ".claude/rules/a.md": "# sans frontmatter\n", ".claude/rules/b.md": "---\npaths:\n  - 'nulle-part/**'\n---\n# b\n" }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /CLAUDE\.md : 201 lignes \(> 200\)/);
  assert.match(r.stderr, /\.claude\/rules\/a\.md : pas de frontmatter/);
  assert.match(r.stderr, /\.claude\/rules\/b\.md : aucun motif de paths: ne désigne un fichier du dépôt \(« nulle-part\/\*\* »\)/);
});
