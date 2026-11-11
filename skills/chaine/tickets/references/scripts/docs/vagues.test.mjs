import assert from 'node:assert/strict';
import { test } from 'node:test';
import { module } from './depot-jouet.mjs';

const { enMarkdown, fichiersChauds, lireTickets, sansBarresFinales, seRecouvrent, vagues } = await module('docs/vagues.mjs');

const t = (nn, status, extra = '') => ({ nom: `docs/x/all/issues/SPEC_ALL_SOC-9-demo.${nn}.issue.md`, texte: `# SPEC_ALL_SOC-9.${nn} — Objet ${nn}\n\nStatus: ${status}\n${extra}` });
const ids = (r) => r.vagues.map((v) => v.map((x) => x.id.slice(-2)));

test('un ticket bloqué par un ticket non fait est écarté, et signalé', () => {
  const r = vagues(lireTickets([t('01', 'Fait — PR #1'), t('02', 'en cours — x'), t('03', 'ready-for-agent', 'Blocked by: 01\nFichiers chauds: `a.ts`\n'), t('04', 'ready-for-agent', 'Blocked by: 02\n'), t('05', 'ready-for-agent', 'Blocked by: 09\n')]));
  assert.deepEqual(ids(r), [['03']]);
  assert.deepEqual(r.bloques, [
    { id: 'SPEC_ALL_SOC-9.04', attend: ['SPEC_ALL_SOC-9.02'] },
    { id: 'SPEC_ALL_SOC-9.05', attend: ['SPEC_ALL_SOC-9.09'] },
  ]);
});

test('deux tickets au même fichier chaud vont dans deux vagues, au plus max par vague', () => {
  const r = vagues(lireTickets([t('01', 'ready-for-agent', 'Fichiers chauds: `a.ts`, `b.ts`\n'), t('02', 'ready-for-agent', 'Fichiers chauds: `b.ts`\n'), t('03', 'ready-for-agent', 'Fichiers chauds: `c.ts`\n')]));
  assert.deepEqual(ids(r), [['01', '03'], ['02']]);
  const r2 = vagues(lireTickets([t('01', 'ready-for-agent'), t('02', 'ready-for-agent'), t('03', 'ready-for-agent')]), 2);
  assert.deepEqual(ids(r2), [['01', '02'], ['03']]);
});

test('recouvrements : dossier, joker, nom nu ; accolades développées', () => {
  assert.ok(seRecouvrent('scripts/db/', 'scripts/db/seed-a.ts'));
  assert.ok(seRecouvrent('apps/api/src/db/migrations/*', 'apps/api/src/db/migrations/202611-x.ts'));
  assert.ok(seRecouvrent('schema.prisma', 'apps/api/prisma/schema.prisma'));
  assert.ok(!seRecouvrent('a.ts', 'b.ts'));
  assert.deepEqual(fichiersChauds('`a/{b,c}.ts`, `d.ts`'), ['a/b.ts', 'a/c.ts', 'd.ts']);
  assert.deepEqual(fichiersChauds('—'), []);
});

test('sortie Markdown', () => {
  const md = enMarkdown('SPEC_ALL_SOC-9', vagues(lireTickets([t('01', 'ready-for-agent', 'Modèle: sonnet\nFichiers chauds: `a.ts`\n')])));
  assert.match(md, /^# Vagues proposées — SPEC_ALL_SOC-9/);
  assert.match(md, /\| 1 \| SPEC_ALL_SOC-9\.01 \| Objet 01 \| sonnet \| `a\.ts` \|/);
});

test("un chemin chaud est lu littéralement : le backslash ne devient pas une classe, les barres finales se rognent", () => {
  // `\b` dans un motif non échappé est une limite de mot, pas un backslash.
  assert.ok(seRecouvrent('a\\b.ts', 'a\\b.ts'));
  assert.ok(!seRecouvrent('a\\b.ts', 'ab.ts'));
  assert.ok(seRecouvrent('scripts/db///', 'scripts/db/seed.ts'));
  assert.ok(seRecouvrent('x.ts', 'apps/y/x.ts//'));
  assert.ok(!seRecouvrent('scripts/db///', 'scripts/dbx/seed.ts'));
});

test("sansBarresFinales : même résultat que /\\/+$/, en temps borné sur 200 000 barres non finales", () => {
  for (const c of ['', '/', 'a', 'a/', 'a///', '/a//b/', '///', 'a//b']) assert.equal(sansBarresFinales(c), c.replace(/\/+$/, ''), JSON.stringify(c));
  const hostile = 'a' + '/'.repeat(200000) + 'b'; // l'ancienne expression y met plusieurs dizaines de secondes
  const t0 = process.hrtime.bigint();
  assert.equal(sansBarresFinales(hostile), hostile);
  assert.ok(Number(process.hrtime.bigint() - t0) / 1e6 < 3000);
});
