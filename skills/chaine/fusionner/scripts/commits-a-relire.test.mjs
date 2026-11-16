// `node --test scripts/chaine/commits-a-relire.test.mjs` : commits jugés par la CI, sur un dépôt jouet.
// Le faux commitlint refuse un en-tête de plus de 120 caractères.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commitsAJuger, estPointEntree, lireArguments, principal } from './commits-a-relire.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const LONG = `docs(x): ${'t'.repeat(122)}`; // 131 caractères, un ancien en-tête entré dans develop

// Un environnement qui ne vise jamais le vrai dépôt : sous un hook git (un pre-push lancé depuis un worktree),
// GIT_DIR, GIT_INDEX_FILE et leurs semblables sont exportés ; sans les retirer, chaque `git` du banc, ceux des
// processus enfants comme ceux que le module lance dans ce processus (`commitsAJuger`), écrirait dans le dépôt
// du développeur. Même précaution que `depot-jouet.mjs` et `poses.test.mjs`. NODE_TEST_CONTEXT : avec lui, un
// `node --test` enfant rend ses résultats au parent au lieu de les jouer.
for (const cle of Object.keys(process.env)) if (cle.startsWith('GIT_')) delete process.env[cle];
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';
const ENV_PROPRE = Object.fromEntries(Object.entries(process.env).filter(([cle]) => cle !== 'NODE_TEST_CONTEXT'));

// Les dossiers du banc, retirés à la sortie (convention des bancs de la chaîne).
const dossiers = [];
const dossier = (prefixe) => {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiers.push(d);
  return d;
};
after(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true });
});

function g(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: ENV_PROPRE }).trim();
}

function commit(cwd, titre) {
  g(cwd, 'commit', '--allow-empty', '-q', '-m', titre);
  return g(cwd, 'rev-parse', 'HEAD');
}

// develop : d1 — LONG — d3 ; sujet part de d1 (s1) ; la branche de mise à jour fusionne develop.
function depot() {
  const r = dossier('commits-a-relire-');
  g(r, 'init', '-q', '-b', 'develop');
  g(r, 'config', 'user.email', 'jouet@example.invalid');
  g(r, 'config', 'user.name', 'Jouet');
  const d1 = commit(r, 'chore: d1');
  const long = commit(r, LONG);
  const d3 = commit(r, 'chore: d3');
  g(r, 'checkout', '-q', '-b', 'sujet/jouet', d1);
  const s1 = commit(r, 'feat(jouet): s1');
  g(r, 'checkout', '-q', '-b', 'chore/maj', s1);
  g(r, 'merge', '-q', '--no-ff', '-m', 'chore(sujet): fusionne develop dans sujet/jouet', 'develop');
  const maj = g(r, 'rev-parse', 'HEAD');
  const faux = join(r, 'faux-commitlint.mjs');
  writeFileSync(
    faux,
    [
      "let m = '';",
      "process.stdin.on('data', (c) => (m += c));",
      "process.stdin.on('end', () => {",
      "  const titre = m.split('\\n')[0];",
      '  if ([...titre].length <= 120) process.exit(0);',
      '  process.stdout.write(`✖   header must not be longer than 120 characters, current length is ${[...titre].length} [header-max-length]\\n`);',
      '  process.exit(1);',
      '});',
    ].join('\n'),
  );
  return { r, d1, long, d3, s1, maj, env: { COMMITLINT: `node ${faux}` } };
}

// principal() écrit par writeSync sur les descripteurs 1 et 2 : on le lance dans un processus enfant.
function lancer(argv, cwd, env) {
  try {
    const sortie = execFileSync(process.execPath, [join(ICI, 'commits-a-relire.mjs'), ...argv], {
      cwd,
      env: { ...ENV_PROPRE, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, sortie, erreur: '' };
  } catch (e) {
    return { code: e.status, sortie: `${e.stdout ?? ''}`, erreur: `${e.stderr ?? ''}` };
  }
}

test('mise à jour de sujet, hors develop : seul le merge est jugé, le vieux titre long ne compte plus', () => {
  const j = depot();
  assert.deepEqual(commitsAJuger({ de: j.s1, a: j.maj, hors: 'develop' }, j.r).commits, [j.maj]);
  const res = lancer(['--de', j.s1, '--a', j.maj, '--hors', 'develop'], j.r, j.env);
  assert.equal(res.code, 0, res.sortie + res.erreur);
  assert.match(res.sortie, /1 commit\(s\) à juger/);
});

test('mise à jour de sujet, sans --hors (comportement précédent) : le titre de develop la rougit', () => {
  const j = depot();
  const res = lancer(['--de', j.s1, '--a', j.maj], j.r, j.env);
  assert.equal(res.code, 1);
  // Le journal montre la ligne fautive et la règle, puis le récapitulatif.
  assert.match(res.sortie, new RegExp(`✖ ${j.long.slice(0, 10)} ${LONG.replace('(x)', '\\(x\\)')} \\(131 caractères\\)`));
  assert.match(res.sortie, /header-max-length/);
  assert.match(res.sortie, /1 message\(s\) refusé\(s\) :\n {2}\S+ docs\(x\)/);
});

test('un commit fautif propre à la PR reste refusé, même hors develop', () => {
  const j = depot();
  const fautif = commit(j.r, `fix(jouet): ${'u'.repeat(115)}`);
  const res = lancer(['--de', j.s1, '--a', fautif, '--hors', 'develop'], j.r, j.env);
  assert.equal(res.code, 1);
  assert.match(res.sortie, new RegExp(`✖ ${fautif.slice(0, 10)} fix\\(jouet\\)`));
  assert.doesNotMatch(res.sortie, new RegExp(j.long.slice(0, 10)));
});

test('PR vers develop : base = develop, la liste est celle de base..tête', () => {
  const j = depot();
  g(j.r, 'checkout', '-q', '-b', 'feat/x', 'develop');
  const f1 = commit(j.r, 'feat(x): f1');
  const f2 = commit(j.r, 'feat(x): f2');
  const avec = commitsAJuger({ de: j.d3, a: f2, hors: 'develop' }, j.r).commits;
  const sans = commitsAJuger({ de: j.d3, a: f2 }, j.r).commits;
  assert.deepEqual(avec, [f1, f2]);
  assert.deepEqual(sans, [f1, f2]);
});

test('push (sans --hors) : la plage poussée, du plus ancien au plus récent', () => {
  const j = depot();
  assert.deepEqual(commitsAJuger({ de: j.d1, a: j.d3 }, j.r).commits, [j.long, j.d3]);
});

test('clone superficiel : refusé en sortie 2, jamais une liste tronquée', () => {
  const j = depot();
  const clone = dossier('commits-a-relire-clone-');
  g(clone, 'clone', '-q', '--depth', '1', '--no-single-branch', `file://${j.r}`, '.');
  const refs = ['--de', 'origin/sujet/jouet', '--a', 'origin/chore/maj', '--hors', 'origin/develop'];
  const res = lancer(refs, clone, j.env);
  assert.equal(res.code, 2);
  assert.match(res.erreur, /clone superficiel/);
  // Le même clone rendu complet juge le merge seul.
  g(clone, 'fetch', '-q', '--unshallow');
  const complet = lancer(refs, clone, j.env);
  assert.equal(complet.code, 0, complet.sortie + complet.erreur);
});

test('réf introuvable ou usage invalide : sortie 2 expliquée', () => {
  const j = depot();
  const absente = lancer(['--de', j.s1, '--a', j.maj, '--hors', 'origin/develop'], j.r, j.env);
  assert.equal(absente.code, 2);
  assert.match(absente.erreur, /--hors origin\/develop : commit introuvable/);
  assert.equal(lireArguments(['--de', 'x']), null);
  assert.equal(lireArguments(['--a', 'y']), null);
  assert.equal(lireArguments(['--de', 'x', '--a', 'y', '--autre', 'z']), null);
  assert.deepEqual(lireArguments(['--de', 'x', '--a', 'y']), { de: 'x', a: 'y' });
  assert.equal(principal(['--de'], j.r, j.env), 2);
});

test("point d'entrée : lancé par un lien symbolique (aussi sous --preserve-symlinks-main), depuis un dossier à espace et accent, une plage fautive sort en 1", () => {
  const j = depot();
  const dossierAccent = join(dossier('commits-a-relire-'), 'dossier à espace é');
  mkdirSync(dossierAccent);
  const copie = join(dossierAccent, 'commits-a-relire.mjs');
  copyFileSync(join(ICI, 'commits-a-relire.mjs'), copie);
  const lien = join(dossierAccent, 'lien vers le script.mjs');
  symlinkSync(copie, lien);
  const acces = [
    { script: copie, options: [] },
    { script: lien, options: [] },
    { script: lien, options: ['--preserve-symlinks-main'] },
  ];
  for (const { script, options } of acces) {
    const r = spawnSync(process.execPath, [...options, script, '--de', j.s1, '--a', j.maj], {
      cwd: j.r,
      env: { ...ENV_PROPRE, ...j.env },
      encoding: 'utf8',
    });
    assert.equal(r.status, 1, `${options.join(' ')} ${script} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /1 message\(s\) refusé\(s\)/);
  }
  assert.equal(estPointEntree('file:///nulle/part.mjs', undefined), false);
  assert.equal(estPointEntree('file:///nulle/part.mjs', join(dossierAccent, 'absent.mjs')), false);
});

// Le contenu d'un dossier, fichiers et dates comprises : ce qui change quand un `git` y écrit.
function empreinte(racine) {
  const lignes = [];
  const lire = (d) => {
    for (const nom of readdirSync(d).sort()) {
      const chemin = join(d, nom);
      const st = statSync(chemin);
      lignes.push(`${chemin} ${st.size} ${st.mtimeMs}`);
      if (st.isDirectory()) lire(chemin);
      else if (nom === 'config' || nom === 'HEAD') lignes.push(readFileSync(chemin, 'utf8'));
    }
  };
  lire(racine);
  return lignes.join('\n');
}

test('banc isolé : un GIT_DIR hérité (hook pre-push) ne fait écrire aucun git du banc dans le dépôt visé', () => {
  if (process.env.BANC_ENFANT) return; // le banc rejoué plus bas ne se rejoue pas lui-même
  const leurre = dossier('commits-a-relire-leurre-');
  g(leurre, 'init', '-q', '--bare');
  const avant = empreinte(leurre);
  const r = spawnSync(process.execPath, ['--test', join(ICI, 'commits-a-relire.test.mjs')], {
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => cle !== 'NODE_TEST_CONTEXT')),
      GIT_DIR: leurre,
      GIT_INDEX_FILE: join(leurre, 'index-leurre'),
      BANC_ENFANT: '1',
    },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`.slice(-2000));
  assert.equal(empreinte(leurre), avant, 'le banc a écrit dans le dépôt visé par GIT_DIR');
});
