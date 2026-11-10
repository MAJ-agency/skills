import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { avancement, enMarkdown, etat, lireTicket, prDuTicket } from './avancement-regles.mjs';

const ticket = (nn, status, extra = '') => lireTicket(`docs/x/all/issues/SPEC_ALL_SOC-1-socle.${nn}.issue.md`, `# SPEC_ALL_SOC-1.${nn} — Objet ${nn}\n\nStatus: ${status}\n${extra}`);

const TICKETS = [
  ticket('01', 'Fait — PR #684'),
  lireTicket('docs/x/all/issues/SPEC_ALL_SOC-1-socle.02.issue.md', '# 02 : Objet 02\n\n**Status:** Fait — PR #683\n'),
  ticket('03', 'ready-for-human'),
  ticket('05', 'en cours — chore/spec-all-soc-1-05-gate-tickets'),
  ticket('06', 'ready-for-agent', 'Blocked by: 05\nModèle: sonnet\n'),
  ticket('07', 'ready-for-agent'),
  ticket('08', 'ready-for-agent', 'Blocked by: 07 (critères)\n'),
  ticket('09', 'needs-triage'),
  ticket('11', 'wontfix — hors champ'),
];
const PRS = [
  { numero: 684, titre: 'feat(agent): hook (SPEC_ALL_SOC-1.01)', branche: 'chore/spec-all-soc-1-01-hook', etat: 'fusionnée', labels: [] },
  { numero: 700, titre: 'chore(agents): gate (SPEC_ALL_SOC-1.05)', branche: 'chore/spec-all-soc-1-05-gate-tickets', etat: 'brouillon', labels: [], ci: 'verte' },
  { numero: 686, titre: 'chore(agents): revue', branche: 'chore/spec-all-soc-1-07-revue', etat: 'ouverte', labels: ['à-fusionner'], ci: 'rouge (1)' },
  { numero: 999, titre: 'autre (SPEC_ALL_SOC-1.010)', branche: 'chore/spec-all-soc-1-010', etat: 'ouverte', labels: [] },
];

test('états lus sur la ligne Status, anciennes valeurs comprises', () => {
  assert.equal(etat('Fait — PR #1'), 'fait');
  assert.equal(etat('resolved'), 'fait');
  assert.equal(etat('en cours — b'), 'en cours');
  assert.equal(etat('wontfix — x'), 'abandonné');
  assert.equal(etat('ready-for-agent'), 'prêt (agent)');
  assert.equal(etat('needs-info — q'), 'à trier');
  assert.equal(etat(null), 'inconnu');
});

test('un ticket lu : identifiant, objet, bloquants relatifs à la spec', () => {
  const t = TICKETS[6];
  assert.equal(t.id, 'SPEC_ALL_SOC-1.08');
  assert.equal(t.titre, 'Objet 08');
  assert.deepEqual(t.blockedBy, ['SPEC_ALL_SOC-1.07']);
  assert.equal(TICKETS[1].titre, 'Objet 02');
});

test('une PR se rattache par le titre ou par la branche, jamais par un préfixe', () => {
  assert.equal(prDuTicket('SPEC_ALL_SOC-1.01', PRS).numero, 684);
  assert.equal(prDuTicket('SPEC_ALL_SOC-1.07', PRS).numero, 686);
  assert.equal(prDuTicket('SPEC_ALL_SOC-1.08', PRS), null);
});

test('pourcentage et prochaines actions', () => {
  const a = avancement(TICKETS, PRS);
  assert.equal(a.total, 8);
  assert.equal(a.faits, 2);
  assert.equal(a.pourcentage, 25);
  assert.deepEqual(a.enCours, ['SPEC_ALL_SOC-1.05', 'SPEC_ALL_SOC-1.07']);
  assert.deepEqual(a.aLancer, []);
  assert.deepEqual(a.bloques, [
    { id: 'SPEC_ALL_SOC-1.06', par: ['SPEC_ALL_SOC-1.05'] },
    { id: 'SPEC_ALL_SOC-1.08', par: ['SPEC_ALL_SOC-1.07'] },
  ]);
  assert.deepEqual(a.humains.map((h) => h.id), ['SPEC_ALL_SOC-1.03', 'SPEC_ALL_SOC-1.09']);
});

test("un bloquant d'une autre spec n'est pas suivi, et un autre contexte se lit", () => {
  const a = avancement([ticket('06', 'ready-for-agent', 'Blocked by: SPEC_FNSMR_STR-6.01\n')], []);
  assert.deepEqual(a.bloques, []);
  assert.deepEqual(a.lignes[0].blockedBy, ['SPEC_FNSMR_STR-6.01']);
});

test('sortie Markdown et PR non vérifiées sans gh', () => {
  const md = enMarkdown('sujet/socle', avancement(TICKETS, PRS));
  assert.match(md, /^# Avancement — sujet\/socle\n\n\*\*25 %\*\* : 2 ticket\(s\) fait\(s\) sur 8/);
  assert.match(md, /\| SPEC_ALL_SOC-1\.07 \| Objet 07 \| ready-for-agent \| #686 \(ouverte\) \| rouge \(1\) \| à-fusionner \|/);
  const sans = enMarkdown('sujet/x', avancement(TICKETS, null));
  assert.match(sans, /PR non vérifiées \(gh indisponible\)/);
});

test('gh en échec : avancement sans PR, ligne search_pull_requests, sortie 3', () => {
  const racine = mkdtempSync(join(tmpdir(), 'avancement-'));
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 't',
    GIT_AUTHOR_EMAIL: 't@t',
    GIT_COMMITTER_NAME: 't',
    GIT_COMMITTER_EMAIL: 't@t',
  };
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8' });
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origine], { env });
  execFileSync('git', ['clone', '-q', origine, travail], { env });
  mkdirSync(join(travail, 'docs/x/all/issues'), { recursive: true });
  writeFileSync(join(travail, 'docs/x/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md'), '# SPEC_ALL_SOC-1.01 — Objet\n\nStatus: ready-for-agent\n');
  git(travail, 'add', '-A');
  git(travail, 'commit', '-q', '-m', 'initial');
  git(travail, 'push', '-q', 'origin', 'develop');
  const bin = join(racine, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\nexit 1\n');
  chmodSync(join(bin, 'gh'), 0o755);
  const r = spawnSync(process.execPath, [new URL('./avancement.mjs', import.meta.url).pathname, 'SPEC_ALL_SOC-1'], { cwd: travail, encoding: 'utf8', env: { ...env, PATH: `${bin}:${process.env.PATH}` } });
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /PR non vérifiées \(gh indisponible\)/);
  assert.match(r.stderr, /requête `SPEC_ALL_SOC-1 is:pr`/);
});
