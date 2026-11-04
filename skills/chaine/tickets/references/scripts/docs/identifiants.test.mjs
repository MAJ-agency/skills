import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estSpec, identifiantDeLaSpec, identifiantDuTicket, lireSpec, lireTicket, slug, specDuTicket } from './identifiants.mjs';

test('un préfixe à un segment (SOC) ou plusieurs (ALL-FOF, FFSA-LIC)', () => {
  assert.deepEqual(lireTicket('SOC-1.03'), { spec: 'SOC-1', index: '03' });
  assert.deepEqual(lireTicket('all-fof-11.04'), { spec: 'ALL-FOF-11', index: '04' });
  assert.deepEqual(lireSpec('FFSA-LIC-3'), { prefixe: 'FFSA-LIC', n: 3 });
  assert.equal(lireTicket('SOC-1'), null);
  assert.equal(lireTicket('SOC-1.3'), null);
  assert.equal(estSpec('SOC-12'), true);
  assert.equal(estSpec('socle'), false);
});

test("l'identifiant se lit dans le nom du fichier", () => {
  assert.equal(identifiantDuTicket('SOC-1-socle.03.issue.md'), 'SOC-1.03');
  assert.equal(identifiantDuTicket('ALL-INF-10-chaine-de-production.06.issue.md'), 'ALL-INF-10.06');
  assert.equal(identifiantDuTicket('4-couche-base-de-donnees.issue.md'), null);
  assert.equal(identifiantDeLaSpec('SOC-1-socle.spec.md'), 'SOC-1');
  assert.equal(specDuTicket('SOC-1-socle.03.issue.md'), 'SOC-1');
  assert.equal(slug('SOC-1.03'), 'soc-1-03');
});
