import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const SCRIPT = new URL("./tests-creux.mjs", import.meta.url).pathname;
// Le script importe `typescript` depuis son propre emplacement : la racine jouet n'a pas besoin de node_modules.

function depot(specs) {
  const racine = mkdtempSync(join(tmpdir(), "tests-creux-"));
  for (const [chemin, texte] of Object.entries(specs)) {
    mkdirSync(join(racine, chemin, ".."), { recursive: true });
    writeFileSync(join(racine, chemin), texte);
  }
  return racine;
}
const lancer = (racine) =>
  spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, PROJET_RACINE: racine }, encoding: "utf8" });

test("un cas dont la seule assertion est toBeDefined est refusé, avec son fichier, sa ligne et son titre", () => {
  const r = lancer(
    depot({
      "apps/api/src/a.spec.ts": `describe('A', () => {
  it('should create', async () => {
    const r = await make();
    expect(r).toBeDefined();
  });
});
`,
    }),
  );
  assert.equal(r.status, 1);
  assert.match(r.stdout, /apps\/api\/src\/a\.spec\.ts:2 : 'should create' — seule\(s\) assertion\(s\) : toBeDefined/);
});

test("un cas contraint (toEqual, .not.toBeDefined mêlé à toBe, .resolves.toHaveLength) passe", () => {
  const r = lancer(
    depot({
      "packages/x/src/b.test.ts": `it('a', () => { expect(f()).toEqual({ a: 1 }); });
it('b', () => { expect(f()).toBeDefined(); expect(g()).toBe(2); });
it('c', async () => { await expect(h()).resolves.toHaveLength(3); });
it.each([[1], [2]])('d %i', (n) => { expect(n).not.toBeNaN(); });
`,
    }),
  );
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /tests-creux: 4 cas analysés\ntests-creux: OK/);
});

test("l'exemption commentée sur la ligne au-dessus est comptée, et un fichier hors apps/ ou packages/ n'est pas lu", () => {
  const r = lancer(
    depot({
      "apps/web/src/c.spec.tsx": `// tests-creux: ignore — instanciation du module
it('fumée', () => {
  expect(mod).toBeTruthy();
});
`,
      "scripts/d.spec.ts": `it('x', () => { expect(1).toBeTruthy(); });`,
    }),
  );
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /1 cas analysés \(1 exemption\(s\) commentée\(s\)\)/);
});
