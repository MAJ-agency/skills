// `develop.sh` sur un dépôt jouet : origin nu qui n'a que `main`, clone de travail dont le hook
// pre-push refuse tout push (il tient le rôle du gate coverage-diff, qui sort en 2 tant que
// `origin/develop` n'existe pas — la branche que ce push crée). Aucun réseau.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'develop.sh');

// Sans les GIT_* hérités : sous un hook pre-push, GIT_DIR et GIT_INDEX_FILE visent le vrai dépôt.
const ENV = {
  ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.org',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.org',
};

// Origin nu (branche initiale `main`), clone `travail`, un hook pre-push qui journalise et refuse.
function depotJouet({ avecMain = true } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'develop-sh-'));
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  const journal = join(racine, 'pre-push.log');
  const env = { ...ENV, TMPDIR: racine };
  const git = (...args) => execFileSync('git', args, { cwd: travail, env, encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origine], { env });
  execFileSync('git', ['clone', '-q', origine, travail], { env, stdio: 'ignore' });
  writeFileSync(join(travail, 'README.md'), 'jouet\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'chore: racine');
  if (avecMain) git('push', '-q', 'origin', 'HEAD:refs/heads/main');
  const hooks = join(racine, 'hooks');
  mkdirSync(hooks);
  writeFileSync(join(hooks, 'pre-push'), `#!/bin/sh\necho "$@" >> ${JSON.stringify(journal)}\nexit 1\n`);
  chmodSync(join(hooks, 'pre-push'), 0o755);
  git('config', 'core.hooksPath', hooks);
  const lancer = () => spawnSync('bash', [SCRIPT], { cwd: travail, env, encoding: 'utf8' });
  const tetes = () =>
    Object.fromEntries(
      git('ls-remote', '--heads', 'origin')
        .split('\n')
        .filter(Boolean)
        .map((l) => l.split('\t').reverse()),
    );
  return { travail, env, git, lancer, tetes, hookJoue: () => existsSync(journal) };
}

test('crée develop sur le distant depuis main, sans passer sous le hook pre-push, et la rapatrie', () => {
  const d = depotJouet();
  // Le hook mord bien : un push ordinaire est refusé.
  const ordinaire = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: d.env });
  assert.notEqual(ordinaire.status, 0);
  assert.ok(d.hookJoue());
  const avant = d.tetes();
  assert.deepEqual(Object.keys(avant), ['refs/heads/main']);

  const r = d.lancer();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /develop créée sur le distant depuis main/);
  const apres = d.tetes();
  assert.equal(apres['refs/heads/develop'], avant['refs/heads/main']);
  assert.equal(d.git('rev-parse', 'refs/remotes/origin/develop'), avant['refs/heads/main']);
  // Le journal du hook n'a que le push d'essai : develop.sh ne l'a pas réveillé.
  assert.equal(execFileSync('wc', ['-l', join(d.travail, '..', 'pre-push.log')], { encoding: 'utf8' }).trim().split(' ')[0], '1');
});

test('idempotent : develop déjà sur le distant, rien de poussé, seulement rapatriée', () => {
  const d = depotJouet();
  assert.equal(d.lancer().status, 0);
  d.git('update-ref', '-d', 'refs/remotes/origin/develop');
  const r = d.lancer();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /existe déjà sur le distant .* rien de poussé/);
  assert.equal(d.git('rev-parse', 'refs/remotes/origin/develop'), d.tetes()['refs/heads/develop']);
});

test('refuse (4) un distant sans main, et un clone sans remote origin', () => {
  const sansMain = depotJouet({ avecMain: false });
  const r = sansMain.lancer();
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stderr, /main absente du distant/);
  assert.deepEqual(sansMain.tetes(), {});

  const seul = depotJouet();
  seul.git('remote', 'remove', 'origin');
  const s = seul.lancer();
  assert.equal(s.status, 4, s.stdout + s.stderr);
  assert.match(s.stderr, /aucun remote origin/);
});
