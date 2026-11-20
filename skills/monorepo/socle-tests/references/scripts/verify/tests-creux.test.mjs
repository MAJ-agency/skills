import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

const ICI = dirname(new URL(import.meta.url).pathname);
// Le script lit la grammaire à `scripts/docs/identifiants.mjs` : posée par socle-monorepo à côté de
// `scripts/verify/` dans un projet ; dans le plugin, dans le skill socle-monorepo. Le banc joue une
// copie posée comme dans un projet.
const GRAMMAIRE = [
  join(ICI, "../docs/identifiants.mjs"),
  join(ICI, "../../../../socle-monorepo/references/scripts/docs/identifiants.mjs"),
].find(existsSync);
// `typescript` vient de la racine jouet : un lien vers celui que le banc trouve.
const TYPESCRIPT = dirname(createRequire(import.meta.url).resolve("typescript/package.json"));

function depot(specs, { avecGrammaire = true } = {}) {
  const racine = mkdtempSync(join(tmpdir(), "tests-creux-"));
  mkdirSync(join(racine, "scripts/verify"), { recursive: true });
  copyFileSync(join(ICI, "tests-creux.mjs"), join(racine, "scripts/verify/tests-creux.mjs"));
  if (avecGrammaire) {
    mkdirSync(join(racine, "scripts/docs"));
    copyFileSync(GRAMMAIRE, join(racine, "scripts/docs/identifiants.mjs"));
  }
  mkdirSync(join(racine, "node_modules"));
  symlinkSync(TYPESCRIPT, join(racine, "node_modules/typescript"));
  for (const [chemin, texte] of Object.entries(specs)) {
    mkdirSync(join(racine, chemin, ".."), { recursive: true });
    writeFileSync(join(racine, chemin), texte);
  }
  return racine;
}
const lancer = (racine) =>
  spawnSync(process.execPath, [join(racine, "scripts/verify/tests-creux.mjs")], { env: { ...process.env, PROJET_RACINE: racine }, encoding: "utf8" });

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

// Les noms de tests sont en français (ADR_ALL_ARC-4) : le gate ne lit pas la langue du nom, il le recopie.
test("un cas creux nommé en français, étiqueté par une règle, est refusé de même", () => {
  const r = lancer(
    depot({
      "apps/api/src/a.spec.ts": `describe('LicenceService', () => {
  it("[RULE_ALL_LIC-2] crée le service quand l'équipe l'appelle", async () => {
    const r = await make();
    expect(r).toBeDefined();
  });
});
`,
    }),
  );
  assert.equal(r.status, 1);
  assert.match(r.stdout, /apps\/api\/src\/a\.spec\.ts:2 : "\[RULE_ALL_LIC-2\] crée le service quand l'équipe l'appelle" — seule\(s\) assertion\(s\) : toBeDefined/);
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


test("un it.skip, it.todo ou describe.skip sans ticket est refusé ; avec un ticket dans le titre ou au-dessus, il passe", () => {
  const r = lancer(
    depot({
      "apps/api/src/e.spec.ts": `it.todo('plus tard');
// eslint-disable-next-line vitest/no-disabled-tests -- skip: SPEC_ALL_SOC-1.07 la base n'est pas posée
it.skip('x', () => { expect(1).toBe(1); });
it.todo('SPEC_ALL_ARC-4 renommer les identifiants');
describe.skip('y', () => { it('z', () => { expect(1).toBe(1); }); });
`,
    }),
  );
  assert.equal(r.status, 1);
  assert.match(r.stdout, /e\.spec\.ts:1 : 'plus tard' — `\.todo` sans ticket/);
  assert.match(r.stdout, /e\.spec\.ts:5 : 'y' — `\.skip` sans ticket/);
  assert.doesNotMatch(r.stdout, /e\.spec\.ts:3 /);
  assert.doesNotMatch(r.stdout, /e\.spec\.ts:4 /);
});

test("un cas désactivé annoté de l'ancienne forme (SOC-1.07) ou d'une règle est refusé : seul un ticket ou une spec de la grammaire compte", () => {
  const r = lancer(
    depot({
      "apps/api/src/f.spec.ts": `// eslint-disable-next-line vitest/no-disabled-tests -- skip: SOC-1.07 la base n'est pas posée
it.skip('x', () => { expect(1).toBe(1); });
it.todo('RULE_ALL_LIC-3 à prouver');
it.todo('SPEC_ALL_SOC-1.07 à écrire');
`,
    }),
  );
  assert.equal(r.status, 1);
  assert.match(r.stdout, /f\.spec\.ts:2 : 'x' — `\.skip` sans ticket/);
  assert.match(r.stdout, /f\.spec\.ts:3 : 'RULE_ALL_LIC-3 à prouver' — `\.todo` sans ticket/);
  assert.doesNotMatch(r.stdout, /f\.spec\.ts:4 /);
});

test("scripts/docs/identifiants.mjs absent : sortie 2, la grammaire nommée", () => {
  const r = lancer(depot({ "apps/api/src/g.spec.ts": "it('x', () => { expect(1).toBe(1); });\n" }, { avecGrammaire: false }));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /scripts\/docs\/identifiants\.mjs introuvable/);
});
