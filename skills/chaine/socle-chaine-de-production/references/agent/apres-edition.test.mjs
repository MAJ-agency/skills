// Le hook d'après-édition sur un dépôt jouet : Prettier et ESLint y sont de faux binaires qui
// enregistrent leur appel ; CLAUDE_PROJECT_DIR désigne le jouet.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const ICI = dirname(new URL(import.meta.url).pathname);

function jouet({ eslintSort = 0, avecPrettier = true } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'apres-edition-'));
  mkdirSync(join(racine, 'scripts/agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'apres-edition.mjs']) writeFileSync(join(racine, 'scripts/agent', f), readFileSync(join(ICI, f)));
  mkdirSync(join(racine, 'node_modules/.bin'), { recursive: true });
  const faux = (nom, sortie) => {
    const p = join(racine, 'node_modules/.bin', nom);
    writeFileSync(p, `#!/bin/sh\necho "${nom} $@" >> "${racine}/appels.log"\n${sortie ? `echo "${nom} : problème" ; exit ${sortie}` : 'exit 0'}\n`);
    chmodSync(p, 0o755);
  };
  if (avecPrettier) faux('prettier', 0);
  faux('eslint', eslintSort);
  mkdirSync(join(racine, 'apps/api/src'), { recursive: true });
  writeFileSync(join(racine, 'apps/api/src/a.ts'), 'export const a = 1;\n');
  writeFileSync(join(racine, 'README.md'), '# x\n');
  return racine;
}
const lancer = (racine, chemin) =>
  spawnSync(process.execPath, [join(racine, 'scripts/agent/apres-edition.mjs')], {
    input: JSON.stringify({ tool_input: { file_path: join(racine, chemin) } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: racine },
    encoding: 'utf8',
  });
const appels = (racine) => {
  try {
    return readFileSync(join(racine, 'appels.log'), 'utf8');
  } catch {
    return '';
  }
};

test('un fichier TypeScript édité passe par Prettier puis ESLint ; propre, le hook rend 0', () => {
  const r = jouet();
  const s = lancer(r, 'apps/api/src/a.ts');
  assert.equal(s.status, 0, s.stderr);
  assert.match(appels(r), /prettier --write --log-level warn apps\/api\/src\/a\.ts\neslint --no-warn-ignored --max-warnings 0 apps\/api\/src\/a\.ts/);
});

test("une erreur ESLint revient à l'agent (code 2) avec le fichier et le message", () => {
  const r = jouet({ eslintSort: 1 });
  const s = lancer(r, 'apps/api/src/a.ts');
  assert.equal(s.status, 2);
  assert.match(s.stderr, /ESLint signale des problèmes dans apps\/api\/src\/a\.ts :\neslint : problème/);
});

test('un fichier non lintable (README.md) ou hors du dépôt ne lance rien ; sans Prettier, ESLint tourne quand même', () => {
  const r = jouet({ avecPrettier: false });
  assert.equal(lancer(r, 'README.md').status, 0);
  assert.equal(lancer(r, '/ailleurs/x.ts').status, 0);
  assert.equal(appels(r), '');
  assert.equal(lancer(r, 'apps/api/src/a.ts').status, 0);
  assert.match(appels(r), /^eslint /);
});
