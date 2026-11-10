import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ENV, depotJouet, script } from './depot-jouet.mjs';

const SCRIPT = script('docs/archiver-tickets.mjs');
const ISSUES = 'docs/features/socle/all/issues';
const FICHIERS = {
  'docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md': '# SPEC_ALL_SOC-1\n\n[le ticket 01](issues/SPEC_ALL_SOC-1-socle.01.issue.md)\n',
  [`${ISSUES}/SPEC_ALL_SOC-1-socle.01.issue.md`]: '# SPEC_ALL_SOC-1.01\n\nStatus: Fait — PR #4\nType: task\n\nVoir [la spec](../SPEC_ALL_SOC-1-socle.spec.md).\n',
  [`${ISSUES}/SPEC_ALL_SOC-1-socle.02.issue.md`]: '# SPEC_ALL_SOC-1.02\n\nStatus: ready-for-agent\nType: task\n',
  // Une ancienne forme n'est lue par aucun script : elle reste en place, à migrer d'abord.
  'docs/features/vieux/issues/SOC-9-vieux.01.issue.md': '# SOC-9.01\n\nStatus: Fait — PR #2\n',
};
const lancer = (d, ...args) => spawnSync(process.execPath, [SCRIPT, '--aujourdhui=2099-01-01', ...args], { cwd: d.travail, env: { ...ENV, PATH: d.bin }, encoding: 'utf8' });

test('dry-run : seul le ticket de la convention, fait depuis plus de 180 jours, est annoncé', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = lancer(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 ticket\(s\) Fait depuis plus de 180 jours \(dry-run/);
  assert.match(r.stdout, /SPEC_ALL_SOC-1-socle\.01\.issue\.md {2}\(PR #4/);
  assert.doesNotMatch(r.stdout, /SOC-9-vieux|socle\.02/);
  assert.ok(existsSync(`${d.travail}/${ISSUES}/SPEC_ALL_SOC-1-socle.01.issue.md`));
});

test('--appliquer : le ticket passe dans issues/archive/, les liens qui le visent et les siens sont réécrits', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = lancer(d, '--appliquer');
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(`${d.travail}/${ISSUES}/archive/SPEC_ALL_SOC-1-socle.01.issue.md`, 'utf8'), /\(\.\.\/\.\.\/SPEC_ALL_SOC-1-socle\.spec\.md\)/);
  assert.match(readFileSync(`${d.travail}/docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md`, 'utf8'), /\(issues\/archive\/SPEC_ALL_SOC-1-socle\.01\.issue\.md\)/);
  assert.ok(existsSync(`${d.travail}/docs/features/vieux/issues/SOC-9-vieux.01.issue.md`));
  assert.match(lancer(d).stdout, /rien à archiver/);
});
