// `develop.sh` sur un dépôt jouet : origin nu qui n'a que `main`, clone de travail dont le hook
// pre-push est celui du socle (`husky/pre-push`, augmenté de la ligne que `socle-tests` fait ajouter),
// avec un faux `pnpm` qui journalise ses appels et refuse. Le push de develop.sh passe sous le hook :
// rien de neuf ne part, le hook ne joue rien. Aucun réseau. Banc du plugin, jamais posé : `develop.sh` part seul dans un
// projet (étape 9 du skill), et ce banc lit le pre-push du gabarit de `socle-monorepo`, pas celui du projet ; hors de
// `references/`, où tout banc est posé et joué dans un projet (ticket 90, `scripts/references-posees.test.mjs`).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { environnementDeBanc } from '../../sujet/scripts/depot-jouet.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(ICI, '../references/scripts/github/develop.sh');
// Le pre-push du socle : le gabarit de `socle-monorepo`, dans le plugin.
const HOOK_SOCLE = join(ICI, '../../../monorepo/socle-monorepo/references/husky/pre-push');

// Sans les GIT_* hérités : sous un hook pre-push, GIT_DIR et GIT_INDEX_FILE visent le vrai dépôt.
const ENV = {
  ...environnementDeBanc(),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.org',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.org',
};

// Origin nu (branche initiale `main`), clone `travail`, le pre-push du socle et un faux `pnpm` (journal
// des appels et de GIT_DIR / GIT_INDEX_FILE ; sort avec PNPM_STATUT, 1 par défaut ; avec PNPM_JOUET,
// fait un `git init` puis un commit dans un dossier temporaire, comme un banc de projet).
function depotJouet({ avecMain = true } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'develop-sh-'));
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  const journal = join(racine, 'pnpm.log');
  const bin = join(racine, 'bin');
  mkdirSync(bin);
  writeFileSync(
    join(bin, 'pnpm'),
    `#!/bin/sh
echo "$* GIT_DIR=\${GIT_DIR-absent} GIT_INDEX_FILE=\${GIT_INDEX_FILE-absent}" >> ${JSON.stringify(journal)}
if [ -n "$PNPM_JOUET" ]; then
  d=$(mktemp -d)
  git init -q "$d" && git -C "$d" commit -q --allow-empty -m jouet
fi
exit "\${PNPM_STATUT-1}"
`,
  );
  chmodSync(join(bin, 'pnpm'), 0o755);
  const env = { ...ENV, TMPDIR: racine, PATH: `${bin}:${process.env.PATH}` };
  const git = (...args) => execFileSync('git', args, { cwd: travail, env, encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origine], { env });
  execFileSync('git', ['clone', '-q', origine, travail], { env, stdio: 'ignore' });
  writeFileSync(join(travail, 'README.md'), 'jouet\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'chore: racine');
  if (avecMain) git('push', '-q', 'origin', 'HEAD:refs/heads/main');
  const hooks = join(racine, 'hooks');
  mkdirSync(hooks);
  const hook = join(hooks, 'pre-push');
  // Husky lance ses hooks sous `sh -e` : le premier échec arrête le hook.
  const [shebang, ...corps] = readFileSync(HOOK_SOCLE, 'utf8').split('\n');
  writeFileSync(hook, `${shebang}\nset -e\n${corps.join('\n')}pnpm run check:coverage --base-auto\n`);
  chmodSync(hook, 0o755);
  git('config', 'core.hooksPath', hooks);
  const lancer = () => spawnSync('bash', [SCRIPT], { cwd: travail, env, encoding: 'utf8' });
  const tetes = () =>
    Object.fromEntries(
      git('ls-remote', '--heads', 'origin')
        .split('\n')
        .filter(Boolean)
        .map((l) => l.split('\t').reverse()),
    );
  const appels = () => (existsSync(journal) ? readFileSync(journal, 'utf8').trim().split('\n') : []);
  return { racine, hook, travail, env, git, lancer, tetes, appels, hookJoue: () => appels().length > 0 };
}

test('crée develop sous le hook pre-push du socle, qui ne joue rien : rien de neuf ne part, et la rapatrie', () => {
  const d = depotJouet();
  // Le hook mord bien : un commit neuf est refusé (pnpm run check sort 1).
  writeFileSync(join(d.travail, 'neuf.md'), 'neuf\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'chore: neuf');
  const ordinaire = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: d.env });
  assert.notEqual(ordinaire.status, 0);
  assert.deepEqual(d.appels().map((l) => l.split(' ')[0]), ['run']);
  d.git('reset', '-q', '--hard', 'origin/main');
  const avant = d.tetes();
  assert.deepEqual(Object.keys(avant), ['refs/heads/main']);

  const r = d.lancer();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /develop créée sur le distant depuis main/);
  const apres = d.tetes();
  assert.equal(apres['refs/heads/develop'], avant['refs/heads/main']);
  assert.equal(d.git('rev-parse', 'refs/remotes/origin/develop'), avant['refs/heads/main']);
  // Le journal de pnpm n'a que l'appel du push d'essai : ni `check`, ni `check:coverage` pour develop.sh.
  assert.equal(d.appels().length, 1);
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

test('refuse (6) un distant injoignable, sans le confondre avec une main absente, et ne pousse rien', () => {
  const d = depotJouet();
  d.git('remote', 'set-url', 'origin', join(d.travail, '..', 'inexistant.git'));
  const r = d.lancer();
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.match(r.stderr, /distant injoignable/);
  assert.doesNotMatch(r.stderr, /main absente/);
  assert.equal(d.hookJoue(), false);
});

// Le pre-push du socle, seul.
const pnpmJoue = (d) => d.appels().map((l) => l.replace(/ GIT_DIR.*/, ''));

test('pre-push du socle : un commit neuf joue `pnpm run check` et un échec refuse le push', () => {
  const d = depotJouet();
  writeFileSync(join(d.travail, 'neuf.md'), 'neuf\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'chore: neuf');
  const r = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: d.env });
  assert.notEqual(r.status, 0);
  assert.deepEqual(pnpmJoue(d), ['run check']);
  assert.deepEqual(Object.keys(d.tetes()), ['refs/heads/main']);
  // Réussi, il joue aussi la couverture du diff, après `check`.
  const bon = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], {
    cwd: d.travail,
    env: { ...d.env, PNPM_STATUT: '0' },
  });
  assert.equal(bon.status, 0, bon.stderr.toString());
  assert.deepEqual(pnpmJoue(d).slice(1), ['run check', 'run check:coverage --base-auto']);
});

test('pre-push du socle : entrée vide ou illisible, il contrôle (jamais de sortie 0 par défaut)', () => {
  for (const entree of ['', '\n', 'refs/heads/x\n', 'refs/heads/x abc refs/heads/x\n']) {
    const d = depotJouet();
    const r = spawnSync('sh', [d.hook, 'origin', 'file:///x'], { cwd: d.travail, env: d.env, input: entree, encoding: 'utf8' });
    assert.equal(r.status, 1, `entrée ${JSON.stringify(entree)} : ${r.stderr}`);
    assert.deepEqual(pnpmJoue(d), ['run check'], `entrée ${JSON.stringify(entree)}`);
  }
  // Un sha qui ne nomme aucun commit : il contrôle aussi.
  const d = depotJouet();
  const sha = 'a'.repeat(40);
  const r = spawnSync('sh', [d.hook, 'origin', 'file:///x'], {
    cwd: d.travail,
    env: d.env,
    input: `refs/heads/x ${sha} refs/heads/x ${'0'.repeat(40)}\n`,
    encoding: 'utf8',
  });
  assert.equal(r.status, 1);
  assert.deepEqual(pnpmJoue(d), ['run check']);
});

test('pre-push du socle : une ref de suivi fabriquée sur place, ou un distant nommé par son URL, ne dispense pas du contrôle', () => {
  const leurres = [
    (d) => d.git('update-ref', 'refs/remotes/leurre/x', 'HEAD'),
    (d) => d.git('update-ref', 'refs/remotes/origin/leurre', 'HEAD'),
    (d) => d.git('fetch', '-q', '.', 'HEAD:refs/remotes/origin/leurre'),
    (d) => d.git('replace', '--graft', d.git('rev-parse', 'origin/main'), 'HEAD'),
  ];
  for (const [i, leurre] of leurres.entries()) {
    const d = depotJouet();
    writeFileSync(join(d.travail, 'neuf.md'), 'neuf\n');
    d.git('add', '-A');
    d.git('commit', '-q', '-m', 'chore: neuf');
    leurre(d);
    const r = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: d.env, encoding: 'utf8' });
    assert.notEqual(r.status, 0, `leurre ${i} : ${r.stderr}`);
    assert.deepEqual(pnpmJoue(d), ['run check'], `leurre ${i}`);
    assert.deepEqual(Object.keys(d.tetes()), ['refs/heads/main'], `leurre ${i}`);
  }
  // Un commit déjà sur le distant, mais le distant nommé par son URL : aucune ref de suivi ne le nomme.
  const d = depotJouet();
  const url = d.git('remote', 'get-url', 'origin');
  const sha = d.git('rev-parse', 'HEAD');
  const r = spawnSync('sh', [d.hook, url, url], { cwd: d.travail, env: d.env, input: `HEAD ${sha} refs/heads/x ${'0'.repeat(40)}\n`, encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(pnpmJoue(d), ['run check']);
});

test('pre-push du socle : les contrôles ne voient pas les variables du capitaine, et voient PRE_PUSH_REFS', () => {
  const d = depotJouet();
  const vu = join(d.racine, 'env.log');
  writeFileSync(join(d.racine, 'bin', 'pnpm'), `#!/bin/sh\nenv | grep -E '^(PASSER_OUTILS|BOUCLE_[A-Z_]+|PRE_PUSH_REFS)=' | sort >> ${JSON.stringify(vu)}\nexit 0\n`);
  writeFileSync(join(d.travail, 'neuf.md'), 'neuf\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'chore: neuf');
  const capitaine = { PASSER_OUTILS: '/capitaine/outils', BOUCLE_COPIE: '/capitaine/copie', BOUCLE_SAUTEES: ' 12 ', BOUCLE_ATTENTE: ' 13 ', BOUCLE_VERROU_PID: '4242' };
  const r = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: { ...d.env, ...capitaine }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const lignes = readFileSync(vu, 'utf8').trim().split('\n');
  assert.equal(lignes.length, 2, lignes.join('\n'));
  for (const l of lignes) assert.match(l, /^PRE_PUSH_REFS=HEAD [0-9a-f]{40} refs\/heads\/essai 0{40}$/);
});

test('pre-push du socle : supprimer une branche distante ne joue rien', () => {
  const d = depotJouet();
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/x');
  assert.deepEqual(pnpmJoue(d), [], 'un commit déjà distant : rien à contrôler');
  const r = spawnSync('git', ['push', '-q', 'origin', ':refs/heads/x'], { cwd: d.travail, env: d.env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(Object.keys(d.tetes()), ['refs/heads/main']);
  assert.deepEqual(pnpmJoue(d), []);
});

test('pre-push du socle : sous un git worktree, pnpm ne voit ni GIT_DIR ni GIT_INDEX_FILE, et le banc jouet n\'écrit rien dans le worktree', () => {
  const d = depotJouet();
  const wt = join(d.racine, 'wt');
  d.git('worktree', 'add', '-q', '-b', 'wt', wt, 'origin/main');
  const gitWt = (...args) => execFileSync('git', args, { cwd: wt, env: d.env, encoding: 'utf8' }).trim();
  writeFileSync(join(wt, 'wt.md'), 'wt\n');
  gitWt('add', '-A');
  gitWt('commit', '-q', '-m', 'chore: wt');
  const sommet = gitWt('rev-parse', 'HEAD');
  const r = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/wt'], {
    cwd: wt,
    env: { ...d.env, PNPM_STATUT: '0', PNPM_JOUET: '1' },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(d.appels(), [
    'run check GIT_DIR=absent GIT_INDEX_FILE=absent',
    'run check:coverage --base-auto GIT_DIR=absent GIT_INDEX_FILE=absent',
  ]);
  assert.equal(gitWt('rev-parse', 'HEAD'), sommet, 'aucun commit « jouet » sur la branche du worktree');
  assert.notEqual(d.git('config', '--get', 'core.bare'), 'true');
});

// La PR de mise à jour avec retouches (en-tête de sujet.sh) : la fusion seule ne passe pas un `pnpm check` rouge
// sur ce que develop apporte, la fusion suivie de sa retouche, poussée d'un arbre propre à son sommet, passe. Le hook
// juge l'arbre de travail, pas chaque commit qui part.
test("pre-push du socle : il juge l'arbre de travail, le sommet poussé d'un arbre propre : la fusion seule est refusée, suivie de sa retouche elle passe", () => {
  const d = depotJouet();
  writeFileSync(join(d.racine, 'bin', 'pnpm'), '#!/bin/sh\n[ "$*" = "run check" ] || exit 0\n! grep -rqs --exclude-dir=.git NON_FORMATE .\n');
  writeFileSync(join(d.travail, 'a.ts'), 'NON_FORMATE\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'chore: fusion');
  const seule = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/maj/lot'], { cwd: d.travail, env: d.env });
  assert.notEqual(seule.status, 0, 'la fusion seule est refusée');
  writeFileSync(join(d.travail, 'a.ts'), 'formaté\n');
  d.git('commit', '-q', '-am', 'style: formate');
  const avec = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/maj/lot'], { cwd: d.travail, env: d.env });
  assert.equal(avec.status, 0, avec.stderr.toString());
  assert.equal(d.tetes()['refs/heads/maj/lot'], d.git('rev-parse', 'HEAD'));
});
