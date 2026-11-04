import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ENV, depotJouet } from './depot-jouet.mjs';

const SCRIPT = new URL('./migrer-tickets.mjs', import.meta.url).pathname;
const FICHIERS = {
  'docs/features/socle/socle.spec.md': '# Le socle\n\nTickets : [`4-couche`](issues/4-couche-base-de-donnees.issue.md), `1-modeliser-le-domaine`.\n',
  'docs/features/socle/issues/1-modeliser-le-domaine.issue.md': '# Modéliser\n\nStatus: ready-for-human\n\nBloqué par : rien. À faire avant `4-couche-base-de-donnees`.\n',
  'docs/features/socle/issues/4-couche-base-de-donnees.issue.md': '# Couche\n\nStatus: needs-triage\n\nBloqué par : `1-modeliser-le-domaine`.\n\nVoir [la spec](../socle.spec.md).\n',
  'docs/features/socle/issues/6-journal.issue.md':
    '# Journal\n\nStatus: needs-triage\n\nBloqué par : `4-couche-base-de-donnees` et `1-modeliser-le-domaine` — deux tables.\n',
  'docs/features/socle/issues/7-audit.issue.md':
    '# Audit\n\nStatus: needs-triage\n\nBloqué par : `4-couche-base-de-donnees` (la table des comptes).\n',
  'docs/adr/ARC-2-isolation.md': '# ARC-2\n\nLe ticket [4](../features/socle/issues/4-couche-base-de-donnees.issue.md). Voir [les ADR](../adr/).\n',
};
const lancer = (d, args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: d.travail, env: { ...ENV, PATH: bin(d) }, encoding: 'utf8' });
const bin = (d) => d.bin;

test('dry-run : annonce les renommages, ne touche rien', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = lancer(d, ['socle', 'SOC']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /socle → SOC-1 \(dry-run/);
  assert.match(r.stdout, /issues\/SOC-1-socle\.04\.issue\.md/);
  assert.ok(existsSync(`${d.travail}/docs/features/socle/socle.spec.md`));
});

test('--appliquer : git mv, liens et mentions réécrits, Blocked by sur deux chiffres', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = lancer(d, ['socle', 'SOC', '--appliquer']);
  assert.equal(r.status, 0, r.stderr);
  const spec = readFileSync(`${d.travail}/docs/features/socle/SOC-1-socle.spec.md`, 'utf8');
  assert.match(spec, /\(issues\/SOC-1-socle\.04\.issue\.md\)/);
  assert.match(spec, /`SOC-1-socle\.01`/);
  const t4 = readFileSync(`${d.travail}/docs/features/socle/issues/SOC-1-socle.04.issue.md`, 'utf8');
  assert.match(t4, /^Blocked by: 01$/m);
  const t6 = readFileSync(`${d.travail}/docs/features/socle/issues/SOC-1-socle.06.issue.md`, 'utf8');
  assert.match(t6, /^Blocked by: 01, 04 — deux tables\.$/m);
  const t7 = readFileSync(`${d.travail}/docs/features/socle/issues/SOC-1-socle.07.issue.md`, 'utf8');
  assert.match(t7, /^Blocked by: 04 — la table des comptes$/m); // le « 1 » de SOC-1 n'est pas un numéro ; la raison reste, sans redite
  const adr = readFileSync(`${d.travail}/docs/adr/ARC-2-isolation.md`, 'utf8');
  assert.match(adr, /\]\(\.\.\/adr\/\)/); // un lien sans rapport n'est pas normalisé
  const t1 = readFileSync(`${d.travail}/docs/features/socle/issues/SOC-1-socle.01.issue.md`, 'utf8');
  assert.match(t1, /^Bloqué par : rien\. À faire avant `SOC-1-socle\.04`\.$/m); // « rien » n'est pas une liste
  assert.match(t4, /\(\.\.\/SOC-1-socle\.spec\.md\)/);
  const adr = readFileSync(`${d.travail}/docs/adr/ARC-2-isolation.md`, 'utf8');
  assert.match(adr, /features\/socle\/issues\/SOC-1-socle\.04\.issue\.md/);
  assert.ok(!existsSync(`${d.travail}/docs/features/socle/issues/4-couche-base-de-donnees.issue.md`));
});

test('--n force le numéro ; un index au-delà de 99 est refusé', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.match(lancer(d, ['socle', 'SOC', '--n', '7']).stdout, /socle → SOC-7/);
  const d2 = depotJouet({ fichiers: { 'docs/features/x/issues/120-trop.issue.md': '# x\n' } });
  assert.equal(lancer(d2, ['x', 'X']).status, 2);
});
