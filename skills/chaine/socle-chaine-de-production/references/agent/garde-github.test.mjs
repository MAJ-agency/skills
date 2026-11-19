// Le hook garde-github tel que Claude Code le lance : l'entrée JSON d'un outil MCP sur stdin, sortie 2
// et la raison sur stderr pour un refus. GitHub est remplacé par un faux `gh` qui rend la base de la
// PR (ou échoue) ; `origin/HEAD` d'un dépôt jouet donne la branche par défaut. Aucun réseau.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('garde-github.mjs', import.meta.url));

/** Dépôt jouet dont `origin/HEAD` vise `parDefaut`, et un faux `gh` qui rend `tete` puis `base` (`base` vide : il échoue). */
function jouet({ parDefaut = 'trunk', base = '', tete = 'feat/x' } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'garde-github-'));
  const bin = join(racine, 'bin');
  execFileSync('mkdir', ['-p', bin]);
  writeFileSync(join(bin, 'gh'), base ? `#!/bin/sh\necho "$*" >> "${racine}/gh.log"\nprintf '%s\\n%s\\n' '${tete}' '${base}'\n` : '#!/bin/sh\nexit 1\n');
  chmodSync(join(bin, 'gh'), 0o755);
  const env = { PATH: `${bin}:${dirname(process.execPath)}:/usr/bin:/bin`, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...args) => execFileSync('git', args, { cwd: racine, env, stdio: 'ignore' });
  git('init', '-q');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'x');
  git('update-ref', `refs/remotes/origin/${parDefaut}`, 'HEAD');
  git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${parDefaut}`);
  return { racine, env };
}

const brut = ({ racine, env }, input) =>
  spawnSync(process.execPath, [SCRIPT], { cwd: racine, env: { ...env, CLAUDE_PROJECT_DIR: racine }, input, encoding: 'utf8' });
const lancer = (j, tool_name, tool_input) => brut(j, JSON.stringify({ hook_event_name: 'PreToolUse', tool_name, tool_input }));

const fichiers = (branch) => ({ owner: 'o', repo: 'r', branch, message: 'm', files: [{ path: 'docs/a.md', content: 'x' }] });

test('garde-github refuse push_files sur un sujet, develop, main ou la branche par défaut, laisse la branche de travail', () => {
  const j = jouet();
  for (const branche of ['sujet/demo', 'refs/heads/sujet/demo', 'develop', 'main', 'trunk', '', ' sujet/demo', 'Develop', 'origin/develop']) {
    const r = lancer(j, 'mcp__github__push_files', fichiers(branche));
    assert.equal(r.status, 2, `${branche} : ${r.stderr}`);
    assert.match(r.stderr, /sujet\.sh carte <nom>/);
  }
  const r = lancer(j, 'mcp__github__push_files', fichiers('feat/spec-all-demo-1-01-travail'));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
});

test('garde-github refuse create_or_update_file, delete_file et create_branch vers un sujet, sous tout préfixe de serveur', () => {
  const j = jouet();
  for (const [outil, entree] of [
    ['mcp__github__create_or_update_file', { owner: 'o', repo: 'r', path: 'docs/a.md', content: 'x', message: 'm', branch: 'sujet/demo' }],
    ['mcp__github__delete_file', { owner: 'o', repo: 'r', path: 'docs/a.md', message: 'm', branch: 'sujet/demo' }],
    ['mcp__github__create_branch', { owner: 'o', repo: 'r', branch: 'sujet/neuf', from_branch: 'develop' }],
    ['mcp__github-perso__create_or_update_file', { owner: 'o', repo: 'r', path: 'a', content: 'x', message: 'm', branch: 'develop' }],
  ])
    assert.equal(lancer(j, outil, entree).status, 2, outil);
  assert.equal(lancer(j, 'mcp__github__create_branch', { owner: 'o', repo: 'r', branch: 'feat/x', from_branch: 'sujet/demo' }).status, 0);
});

test('garde-github : une PR vers un sujet, develop, main ou la branche par défaut ne se fusionne pas par un outil ; base illisible : refusée', () => {
  for (const base of ['sujet/demo', 'develop', 'main', 'trunk']) {
    const j = jouet({ base });
    const r = lancer(j, 'mcp__github__merge_pull_request', { owner: 'o', repo: 'r', pullNumber: 12, merge_method: 'squash' });
    assert.equal(r.status, 2, `${base} : ${r.stderr}`);
    assert.match(r.stderr, /passer\.sh, sujet\.sh fusionner/);
    assert.equal(lancer(j, 'mcp__github__enable_pr_auto_merge', { owner: 'o', repo: 'r', pullNumber: 12 }).status, 2, base);
  }
  const ordinaire = jouet({ base: 'feat/y' });
  assert.equal(lancer(ordinaire, 'mcp__github__merge_pull_request', { owner: 'o', repo: 'r', pullNumber: 12 }).status, 0);
  assert.equal(lancer(jouet(), 'mcp__github__merge_pull_request', { owner: 'o', repo: 'r', pullNumber: 12 }).status, 2, 'gh en échec');
  for (const [owner, repo, pullNumber] of [['o;rm', 'r', 12], ['..', 'r', 12], ['o', '.git', 12], ['o', 'r', -1], ['o', 'r', 0], ['o', 'r', 1.5], ['o', 'r', '12'], ['o', 'r', undefined], [undefined, undefined, 12], [['o'], 'r', 12]])
    assert.equal(lancer(ordinaire, 'mcp__github__merge_pull_request', { owner, repo, pullNumber }).status, 2, `${owner} ${repo} ${pullNumber}`);
});

test('garde-github : une PR dont la tête est gardée ne se met pas à jour par un outil ; tête ordinaire : permis ; tête illisible : refusée', () => {
  const mettreAJour = (j) => lancer(j, 'mcp__github__update_pull_request_branch', { owner: 'o', repo: 'r', pullNumber: 12 });
  for (const tete of ['sujet/demo', 'main', 'develop', 'trunk']) {
    const r = mettreAJour(jouet({ tete, base: 'develop' }));
    assert.equal(r.status, 2, `${tete} : ${r.stderr}`);
    assert.match(r.stderr, /sujet\.sh rafraichir/);
  }
  assert.equal(mettreAJour(jouet({ tete: 'feat/x', base: 'sujet/demo' })).status, 0);
  for (const tete of ['a b', '..', '-x', 'a/../b'])
    assert.equal(mettreAJour(jouet({ tete, base: 'develop' })).status, 2, `tête ${tete} : pas la forme d’un nom de branche`);
  assert.equal(mettreAJour(jouet()).status, 2, 'gh en échec');
});

test('garde-github échoue fermé : entrée vide, null, JSON illisible, sans tool_name ou outil hors de son matcher', () => {
  const j = jouet();
  for (const entree of ['', '{', '{}', 'null', '[]', '"x"', JSON.stringify({ tool_input: { branch: 'feat/x' } }), JSON.stringify({ tool_name: 'mcp__github__get_me', tool_input: {} }), JSON.stringify({ tool_name: 'push_files', tool_input: { branch: 'feat/x' } })]) {
    const r = brut(j, entree);
    assert.equal(r.status, 2, entree);
    assert.match(r.stderr, /entrée de hook illisible : refusé/);
  }
});

test('garde-github lit la branche par défaut sur le distant quand origin/HEAD manque', () => {
  const j = jouet({ parDefaut: 'trunk' });
  const nu = join(j.racine, 'origine.git');
  const git = (...args) => execFileSync('git', args, { cwd: j.racine, env: j.env, stdio: 'ignore' });
  git('init', '-q', '--bare', '-b', 'trunk', nu);
  git('remote', 'add', 'origin', nu);
  git('push', '-q', 'origin', 'HEAD:refs/heads/trunk');
  git('symbolic-ref', '--delete', 'refs/remotes/origin/HEAD');
  assert.equal(lancer(j, 'mcp__github__push_files', fichiers('trunk')).status, 2, 'trunk, lue par ls-remote --symref');
  assert.equal(lancer(j, 'mcp__github__push_files', fichiers('feat/x')).status, 0);
});
