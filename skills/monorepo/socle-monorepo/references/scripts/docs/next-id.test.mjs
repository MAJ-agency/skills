import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { plusGrandSurBranches } from './next-id-branches.mjs';

// Dépôt jouet : un `origin` nu local avec `develop`, un clone de travail, un PATH réduit à `git` et
// `node`. Écrit ici plutôt qu'importé : le socle pose ce banc sans la chaîne, donc sans le
// `depot-jouet.mjs` du skill `tickets`. Sans les GIT_* hérités : sous un hook git, ils visent le vrai dépôt.
const ENV = {
  ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.org',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.org',
};
function depotJouet({ fichiers = {}, branches = [] } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'next-id-'));
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  const git = (...args) => execFileSync('git', args, { cwd: travail, env: ENV, encoding: 'utf8' });
  execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origine], { env: ENV });
  execFileSync('git', ['clone', '-q', origine, travail], { env: ENV });
  writeFileSync(join(travail, 'README.md'), 'jouet\n');
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(travail, chemin)), { recursive: true });
    writeFileSync(join(travail, chemin), contenu);
  }
  git('add', '-A');
  git('commit', '-q', '-m', 'initial');
  git('push', '-q', 'origin', 'HEAD:develop');
  for (const b of branches) git('push', '-q', 'origin', `HEAD:refs/heads/${b}`);
  const bin = join(racine, 'bin');
  mkdirSync(bin);
  for (const outil of ['git', 'node']) symlinkSync(execFileSync('which', [outil], { encoding: 'utf8' }).trim(), join(bin, outil));
  return { racine, travail, bin, git };
}

const SCRIPT = new URL('./next-id.mjs', import.meta.url).pathname;
const lancer = ({ travail, bin }, ...args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { cwd: travail, env: { ...ENV, PATH: bin, PROJET_RACINE: travail }, encoding: 'utf8' });
const prochain = (d, ...args) => {
  const r = lancer(d, ...args);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};

const FICHIERS = {
  'docs/metier/regles/all/RULE_ALL_LIC-3.md': '---\nid: RULE_ALL_LIC-3\n---\n',
  'docs/metier/regles/all/RULE_ALL_LIC-1.md': '---\nid: RULE_ALL_LIC-1\n---\n',
  'docs/metier/regles/fnsmr/RULE_FNSMR_LIC-05.md': '---\nid: RULE_FNSMR_LIC-05\n---\n',
  'docs/features/licences/all/SPEC_ALL_LIC-12-licences.spec.md': '# Licences\n',
  'docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md': '# Socle\n',
  'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': '# x\n\nStatus: needs-triage\n',
  'docs/adr/ADR_ALL_ARC-1-identifiants-types-et-contextes.md': '# ADR_ALL_ARC-1\n',
  'docs/adr/web/ADR_ALL_WEB-1-client.md': '# ADR_ALL_WEB-1\n',
  'docs/demandes/all/REQ_ALL_LIC-7-licence-famille.md': '# Demande\n',
  // L'ancienne forme n'est lue par personne : elle ne réserve aucun numéro.
  'docs/adr/ARC-9-ancienne-forme.md': '# ARC-9\n',
  'docs/features/vieux/LIC-40-vieux.spec.md': '# LIC-40\n',
};

test('une règle sans slug et une spec à slug : RULE ALL LIC rend 4, SPEC ALL LIC rend 13', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.equal(prochain(d, 'RULE', 'ALL', 'LIC'), '4');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'LIC'), '13');
});

test('le numéro est unique par type, contexte et trigramme ; 05 se compte comme 5', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.equal(prochain(d, 'RULE', 'FNSMR', 'LIC'), '6');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'SOC'), '2');
  assert.equal(prochain(d, 'ADR', 'ALL', 'ARC'), '2', "l'ancienne forme ARC-9 ne compte pas");
  assert.equal(prochain(d, 'ADR', 'ALL', 'WEB'), '2');
  assert.equal(prochain(d, 'REQ', 'ALL', 'LIC'), '8');
  assert.equal(prochain(d, 'RULE', 'FFSA', 'LIC'), '1');
  assert.equal(prochain(d, 'DSG', 'ALL', 'DES'), '1');
  assert.equal(prochain(d, 'spec', 'all', 'soc'), '2', 'la casse des arguments est indifférente');
});

test('un dépôt sans docs/ commence à 1', () => {
  assert.equal(prochain(depotJouet(), 'SPEC', 'ALL', 'SOC'), '1');
});

test('une spec et une règle écrites sur une branche de sujet ou de cadrage non fusionnée comptent', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const ecrire = (branche, chemin) => {
    d.git('checkout', '-q', '-b', branche, 'origin/develop');
    mkdirSync(dirname(join(d.travail, chemin)), { recursive: true });
    writeFileSync(join(d.travail, chemin), '# x\n');
    d.git('add', '-A');
    d.git('commit', '-q', '-m', 'docs: x');
    d.git('push', '-q', 'origin', `HEAD:refs/heads/${branche}`);
  };
  ecrire('sujet/licences', 'docs/features/licences/all/SPEC_ALL_LIC-14-renouvellement.spec.md');
  ecrire('docs/regles-licences', 'docs/metier/regles/all/RULE_ALL_LIC-8.md');
  ecrire('feat/hors-champ', 'docs/metier/regles/all/RULE_ALL_LIC-99.md');
  d.git('checkout', '-q', 'develop');
  d.git('fetch', '-q', 'origin');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'LIC'), '15');
  assert.equal(prochain(d, 'RULE', 'ALL', 'LIC'), '9', 'sujet/* et docs/* seulement');
});

test("l'ancien usage et un type inconnu sont refusés, sortie 2", () => {
  const d = depotJouet({ fichiers: FICHIERS });
  for (const args of [[], ['SOC'], ['ALL', 'FOF'], ['ARC'], ['EPIC', 'ALL', 'SOC'], ['SPEC', 'ALL', 'SOCLE'], ['SPEC', 'ALL', 'SOC', '1'], ['SPEC_ALL_SOC']]) {
    const r = lancer(d, ...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /Usage : node scripts\/docs\/next-id\.mjs <TYPE> <CTX> <TRI>/);
  }
});

test('le numéro sort nu, sans couleur, même avec FORCE_COLOR=1', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = spawnSync(process.execPath, [SCRIPT, 'RULE', 'ALL', 'LIC'], {
    cwd: d.travail,
    env: { ...ENV, PATH: d.bin, PROJET_RACINE: d.travail, FORCE_COLOR: '1' },
    encoding: 'utf8',
  });
  assert.equal(r.stdout, '4\n');
});

test('plusGrandSurBranches : git injecté, branche illisible ignorée', () => {
  const git = (args) => {
    if (args[0] === 'for-each-ref') return 'origin/sujet/a\norigin/docs/b\n';
    if (args[3] === 'origin/docs/b') throw new Error('illisible');
    return 'docs/metier/regles/all/RULE_ALL_LIC-7.md\ndocs/x/notes.md\n';
  };
  assert.equal(plusGrandSurBranches((nom) => (nom === 'RULE_ALL_LIC-7.md' ? 7 : null), git), 7);
  assert.equal(plusGrandSurBranches(() => null, () => { throw new Error('pas de git'); }), 0);
});
