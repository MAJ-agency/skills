import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { ENV, depotJouet } from './depot-jouet.mjs';

const SCRIPT = new URL('./ticket-libre.mjs', import.meta.url).pathname;
const TICKET = 'docs/features/socle/issues/SOC-1-socle.03.issue.md';
const lancer = ({ travail, bin }, id = 'SOC-1.03') => spawnSync(process.execPath, [SCRIPT, id], { cwd: travail, env: { ...ENV, PATH: bin }, encoding: 'utf8' });

test('libre côté git, PR non vérifiées sans gh : sortie 3 et la recherche MCP', () => {
  const r = lancer(depotJouet({ fichiers: { [TICKET]: '# SOC-1.03\n\nStatus: ready-for-agent\n' } }));
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /PR NON VÉRIFIÉES/);
  assert.match(r.stdout, /search_pull_requests\(owner: "[^"]+", repo: "origine", query: "SOC-1.03 is:open"\)/);
});

test('pris : ligne Status en cours sur develop, ou branche distante qui porte le slug', () => {
  const r1 = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: en cours — feat/soc-1-03-x\n' } }));
  assert.equal(r1.status, 1);
  assert.match(r1.stdout, /PRIS/);
  const r2 = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' }, branches: ['feat/soc-1-03-couche'] }));
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /branche distante : feat\/soc-1-03-couche/);
});

test('introuvable ou archivé', () => {
  assert.equal(lancer(depotJouet()).status, 2);
  const r = lancer(depotJouet({ fichiers: { 'docs/features/socle/issues/archive/SOC-1-socle.03.issue.md': '# x\n\nStatus: Fait — PR #1\n' } }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /archivé/);
});

test('un ticket vivant seulement sur une branche de sujet est lu, avec un préfixe à deux segments', async () => {
  const d = depotJouet();
  d.git('checkout', '-q', '-b', 'sujet/fof');
  const chemin = 'docs/features/fof/issues/ALL-FOF-11-x.04.issue.md';
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(`${d.travail}/docs/features/fof/issues`, { recursive: true });
  writeFileSync(`${d.travail}/${chemin}`, '# x\n\nStatus: ready-for-agent\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'docs: ticket');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/fof');
  const r = lancer(d, 'ALL-FOF-11.04');
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /ALL-FOF-11\.04 — docs\/features\/fof\/issues\/ALL-FOF-11-x\.04\.issue\.md/);
});
