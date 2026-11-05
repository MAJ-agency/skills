import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { ENV, depotJouet } from '../docs/depot-jouet.mjs';

const SCRIPT = new URL('./tickets.mjs', import.meta.url).pathname;
const DETTE = {
  'scripts/verify/tickets-dette.json': '{"tickets":[],"cartes":[],"identifiants":[]}\n',
  'docs/agents/issue-tracker.md': '# Suivi\n\n## Réserver un ticket (sessions parallèles)\n\n## Un ticket prêt pour agent\n\n## Archivage\n',
  'docs/agents/triage-labels.md': '`en cours — <branche>` · `Fait — PR #<n>`\n',
};
const lancer = (d) => spawnSync(process.execPath, [SCRIPT], { cwd: d.travail, env: { ...ENV, PATH: d.bin, PROJET_RACINE: d.travail }, encoding: 'utf8' });

test('un dépôt conforme passe, un Status hors vocabulaire échoue avec le chemin et la ligne', () => {
  const ok = depotJouet({ fichiers: { ...DETTE, 'docs/features/socle/SOC-1-socle.spec.md': '# s\n', 'docs/features/socle/issues/SOC-1-socle.01.issue.md': '# x\n\nStatus: needs-triage\n' } });
  const r = lancer(ok);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tickets : OK — 1 tickets/);
  const ko = depotJouet({ fichiers: { ...DETTE, 'docs/features/socle/issues/SOC-1-socle.01.issue.md': '# x\n\nStatus: À faire\n' } });
  const r2 = lancer(ko);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SOC-1-socle\.01\.issue\.md:3 : Status « À faire » hors vocabulaire/);
});
