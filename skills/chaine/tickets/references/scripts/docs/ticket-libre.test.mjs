import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { ENV, depotJouet, script } from './depot-jouet.mjs';

const SCRIPT = script('docs/ticket-libre.mjs');
const TICKET = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.03.issue.md';
const lancer = ({ travail, bin }, id = 'SPEC_ALL_SOC-1.03') => spawnSync(process.execPath, [SCRIPT, id], { cwd: travail, env: { ...ENV, PATH: bin }, encoding: 'utf8' });

test('libre côté git, PR non vérifiées sans gh : sortie 3 et la recherche MCP', () => {
  const r = lancer(depotJouet({ fichiers: { [TICKET]: '# SPEC_ALL_SOC-1.03\n\nStatus: ready-for-agent\n' } }));
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /PR NON VÉRIFIÉES/);
  assert.match(r.stdout, /search_pull_requests\(owner: "[^"]+", repo: "origine", query: "SPEC_ALL_SOC-1\.03 is:open"\)/);
});

test('pris : ligne Status en cours sur develop, ou branche distante qui porte le slug', () => {
  const r1 = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: en cours — feat/spec-all-soc-1-03-x\n' } }));
  assert.equal(r1.status, 1);
  assert.match(r1.stdout, /PRIS/);
  const r2 = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' }, branches: ['feat/spec-all-soc-1-03-couche'] }));
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /branche distante : feat\/spec-all-soc-1-03-couche/);
});

test("une branche à l'ancienne forme, ou d'un autre ticket, ne prend pas le ticket", () => {
  const r = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' }, branches: ['feat/soc-1-03-couche', 'feat/spec-all-soc-1-04-autre', 'feat/spec-all-soc-11-03-autre'] }));
  assert.equal(r.status, 3, r.stdout);
});

test("introuvable, archivé, ou demandé à l'ancienne forme", () => {
  assert.equal(lancer(depotJouet()).status, 2);
  const r = lancer(depotJouet({ fichiers: { 'docs/features/socle/all/issues/archive/SPEC_ALL_SOC-1-socle.03.issue.md': '# x\n\nStatus: Fait — PR #1\n' } }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /archivé/);
  const ancien = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' } }), 'SOC-1.03');
  assert.equal(ancien.status, 2);
  assert.match(ancien.stderr, /Usage : node scripts\/docs\/ticket-libre\.mjs <SPEC>\.<NN>/);
});

test("un ticket vivant seulement sur une branche de sujet est lu, dans le dossier d'un autre contexte", async () => {
  const d = depotJouet();
  d.git('checkout', '-q', '-b', 'sujet/fof');
  const chemin = 'docs/features/fof/fnsmr/issues/SPEC_FNSMR_FOF-11-x.04.issue.md';
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(`${d.travail}/docs/features/fof/fnsmr/issues`, { recursive: true });
  writeFileSync(`${d.travail}/${chemin}`, '# x\n\nStatus: ready-for-agent\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'docs: ticket');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/fof');
  const r = lancer(d, 'spec_fnsmr_fof-11.04');
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /SPEC_FNSMR_FOF-11\.04 — docs\/features\/fof\/fnsmr\/issues\/SPEC_FNSMR_FOF-11-x\.04\.issue\.md/);
});
