import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enMarkdown, fichiersChauds, lireTickets, seRecouvrent, vagues } from './vagues.mjs';

const t = (nn, status, extra = '') => ({ nom: `docs/x/issues/SOC-9-demo.${nn}.issue.md`, texte: `# SOC-9.${nn} — Objet ${nn}\n\nStatus: ${status}\n${extra}` });
const ids = (r) => r.vagues.map((v) => v.map((x) => x.id.slice(-2)));

test('un ticket bloqué par un ticket non fait est écarté, et signalé', () => {
  const r = vagues(lireTickets([t('01', 'Fait — PR #1'), t('02', 'en cours — x'), t('03', 'ready-for-agent', 'Blocked by: 01\nFichiers chauds: `a.ts`\n'), t('04', 'ready-for-agent', 'Blocked by: 02\n'), t('05', 'ready-for-agent', 'Blocked by: 09\n')]));
  assert.deepEqual(ids(r), [['03']]);
  assert.deepEqual(r.bloques, [
    { id: 'SOC-9.04', attend: ['SOC-9.02'] },
    { id: 'SOC-9.05', attend: ['SOC-9.09'] },
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
  const md = enMarkdown('SOC-9', vagues(lireTickets([t('01', 'ready-for-agent', 'Modèle: sonnet\nFichiers chauds: `a.ts`\n')])));
  assert.match(md, /^# Vagues proposées — SOC-9/);
  assert.match(md, /\| 1 \| SOC-9\.01 \| Objet 01 \| sonnet \| `a\.ts` \|/);
});
