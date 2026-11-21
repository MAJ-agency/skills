// Contre-relecture de la PR 146, premier tour : attaques sur `skills/chaine/relecteur/scripts/relecteur.mjs`, jouées
// sur l'arbre de la PR (`APRES`) puis sur l'arbre retouché (`APRES` + retouches-tour-1.patch). Chaque test dit ce que
// la PR doit tenir ; un rouge sur `APRES` est un constat (son numéro, C<k>, est celui du rapport). Les essais qui
// documentent une tenue (vert attendu partout) le disent dans leur nom.
// Lancer : APRES=<arbre> node --test essais-c1.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const APRES = process.env.APRES;
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const CHAINE = join(APRES, 'skills/chaine');
const FAUX = join(CHAINE, 'sujet/scripts/faux-gh.mjs');
const DEBUT = Date.UTC(2026, 10, 20, 10, 0);
const iso = (ms) => new Date(ms).toISOString().replace(/\.000Z$/, 'Z');
const minute = (m) => iso(DEBUT + m * 60_000);
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-20T09:00:00Z' } };
const CALCULS = [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']];

function monter({ contrat = CONTRAT, horloge = 30, env: plus = {} } = {}) {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  if (contrat !== null) d.ecrire('.claude/chaine.json', `${JSON.stringify(contrat, null, 2)}\n`);
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  // Les faux outils de ces essais ne contiennent rien de variable : ce qu'ils lisent leur vient de l'environnement.
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + horloge * 60_000), BANC_FAUX_GH: FAUX, ...plus };
  const lancer = (...args) => spawnSync(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env, encoding: 'utf8', timeout: 120_000 });
  const json = (r) => r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const talon = (nom, corps) => {
    d.git('switch', '-q', 'develop');
    d.ecrire(`scripts/chaine/${nom}`, corps);
    d.commit(`test: talon ${nom}`);
    d.git('push', '-q', 'origin', 'HEAD:develop');
  };
  const outil = (nom, corps) => {
    writeFileSync(join(d.racine, 'bin', nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(d.racine, 'bin', nom), 0o755);
  };
  return { ...d, dossier, env, lancer, json, talon, outil };
}
const DEMANDE = (sha, session = 'session_auteur') => `À relire — sommet ${sha} — Session: ${session} — Conducteur: session_conducteur`;
const verdict = (sha, tour, session, mot, { bloquants = mot === 'refusé' ? 1 : 0 } = {}) =>
  ['<!-- relecture:verdict -->', `Sommet relu: ${sha}`, `Tour: ${tour}`, `Verdict: ${mot}`, `Bloquants: ${bloquants}`, `Session: ${session}`, '', '- constats'].join('\n');
const distribution = (tour, sha, sessions, suite = '') => `Relecture — tour ${tour} — sommet ${sha} — sessions ${sessions.join(', ')}${suite}`;
function pr(d, { fichiers = { 'src/a.mjs': 'export const a = 1;\n' }, labels = ['à-relire'], base = 'develop', tete = 'feat/a', depuis = 'develop', demande } = {}) {
  const sha = d.branche(tete, `origin/${depuis}`, fichiers);
  d.github({ pulls: [{ number: 12, title: 'feat(a): a', base, head: tete, labels, created_at: minute(0), commentaires: [{ body: demande ?? DEMANDE(sha), created_at: minute(1) }] }], maintenant: minute(30) });
  return sha;
}
const ajouter = (d, ...commentaires) => {
  const p = d.etat().pulls[0];
  p.commentaires.push(...commentaires.map(([body, m, plus = {}]) => ({ body, created_at: minute(m), ...plus })));
  d.github({ pulls: [p] });
};
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${decodeURIComponent(e.route)}${e.champs['labels[]'] ? ` ${e.champs['labels[]']}` : ''}`);
// Une PR de mise à jour d'un sujet, à deux fusions de develop : `a-juger` la refuse (sortie 4), comme dans le banc.
function miseAJour(d) {
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  for (const [chemin, message] of [['README.md', 'docs: avance 1'], ['docs/x.md', 'docs: avance 2']]) {
    d.git('switch', '-q', 'develop');
    d.ecrire(chemin, `${message}\n`);
    d.commit(message);
    d.git('push', '-q', 'origin', 'HEAD:develop');
    d.git('switch', '-q', '-C', 'maj/demo', chemin === 'README.md' ? 'origin/sujet/demo' : 'maj/demo');
    d.git('merge', '-q', '--no-edit', 'develop');
  }
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/maj/demo');
  const sha = d.git('rev-parse', 'HEAD');
  d.github({ pulls: [{ number: 12, title: 'chore: maj', base: 'sujet/demo', head: 'maj/demo', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }] }], maintenant: minute(30) });
  return sha;
}

// --- C1 : la veille de 25 minutes ---------------------------------------------------------------------------------

test('C1 — la veille ne commence jamais une pause qui finit après sa durée : 25 minutes, pas 25 plus une pause plus une passe', () => {
  const d = monter();
  pr(d, { labels: ['hors-de-la-file'] });
  const t0 = Date.now();
  const r = d.lancer('veille', '--pause', '6', '--duree', '0.02');
  const ecoule = (Date.now() - t0) / 1000;
  assert.equal(r.stdout, 'VEILLE FINIE\n', r.stderr);
  // Durée 1,2 s, pause 6 s : la veille ne devait pas attendre 6 s de plus après sa durée.
  assert.ok(ecoule < 5, `veille de 1,2 s finie en ${ecoule.toFixed(1)} s`);
});

test('C1 (tenue) — une veille tuée en pleine pause ne laisse aucune ligne finale : le journal n’a ni GESTE, ni FINIE, ni ARRÊTÉE', async () => {
  const d = monter();
  pr(d, { labels: ['hors-de-la-file'] });
  const p = spawn(process.execPath, [RELECTEUR, 'veille', '--pause', '30', '--duree', '1'], { cwd: d.dossier, env: d.env, detached: true });
  let sortie = '';
  p.stdout.on('data', (c) => (sortie += c));
  await new Promise((ok) => setTimeout(ok, 3000));
  process.kill(-p.pid, 'SIGTERM');
  await new Promise((ok) => p.on('close', ok));
  assert.doesNotMatch(sortie, /VEILLE (GESTE|FINIE|ARRÊTÉE)/, 'la suite d’une veille arrêtée par l’outil doit être écrite dans le skill (constat C1)');
});

test('C2 (tenue) — un geste attend le verrou tenu par une passe : il dure autant qu’elle (jusqu’à 300 s, plus que les 120 s par défaut de l’outil Bash)', () => {
  const d = monter();
  pr(d);
  const verrou = join(d.dossier, '.git/relecteur.verrou');
  const tenu = spawn('flock', [verrou, 'node', '-e', 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 4000)']);
  const t0 = Date.now();
  spawnSync('node', ['-e', 'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300)']);
  const r = d.lancer('jouer', '12');
  const ecoule = (Date.now() - t0) / 1000;
  tenu.kill();
  assert.equal(r.status, 0, r.stderr);
  assert.ok(ecoule >= 3.5, `le geste a attendu le verrou : ${ecoule.toFixed(1)} s`);
});

// --- C3 : les GIT_CONFIG_* de la session sont complétés, jamais remplacés -------------------------------------------

test('C3 — une réécriture d’URL de la session (GIT_CONFIG_COUNT=1) tient : le fetch de la préparation passe', () => {
  const d = monter();
  pr(d);
  // L'origin du dossier est une URL que seule la réécriture de la session sait lire.
  execFileSync('git', ['remote', 'set-url', 'origin', 'https://depot.invalid/jouet.git'], { cwd: d.dossier });
  const env = { ...d.env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: `url.${d.origine}.insteadOf`, GIT_CONFIG_VALUE_0: 'https://depot.invalid/jouet.git' };
  const r = spawnSync(process.execPath, [RELECTEUR, 'passe'], { cwd: d.dossier, env, encoding: 'utf8', timeout: 120_000 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout.split('\n')[0]).geste, 'distribuer');
});

// --- C4 : aucun hook, aucun fsmonitor : la liste entière ------------------------------------------------------------

test('C4 — aucun des hooks que git connaît ne joue, ni dans .git/hooks ni sous un core.hooksPath local, ni le fsmonitor : passe, jouer, distribuer, a-juger, même contenu, installation', () => {
  const d = monter();
  // Tous les noms de hook de githooks(5), git 2.43.
  const NOMS = ['applypatch-msg', 'pre-applypatch', 'post-applypatch', 'pre-commit', 'pre-merge-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-rebase', 'post-checkout', 'post-merge', 'pre-push', 'pre-receive', 'update', 'proc-receive', 'post-receive', 'post-update', 'reference-transaction', 'push-to-checkout', 'pre-auto-gc', 'post-rewrite', 'sendemail-validate', 'fsmonitor-watchman', 'p4-changelist', 'p4-prepare-changelist', 'p4-post-changelist', 'p4-pre-submit', 'post-index-change'];
  const traces = join(d.racine, 'traces');
  mkdirSync(traces);
  d.env.BANC_TRACES = traces;
  const TRACE = '#!/bin/sh\ntouch "$BANC_TRACES/$(basename "$0")"\n';
  const poser = (dossier) => {
    mkdirSync(dossier, { recursive: true });
    for (const nom of NOMS) {
      writeFileSync(join(dossier, nom), TRACE);
      chmodSync(join(dossier, nom), 0o755);
    }
  };
  // develop porte un lockfile (une installation) ; une PR vers develop au verdict validé puis mise à jour par le
  // capitaine (« même contenu »), et une sous-PR vers un sujet (a-juger).
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const sha = d.branche('feat/a', 'origin/develop', { 'src/a.mjs': 'export const a = 1;\n' });
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  const sous = d.branche('feat/b', 'origin/sujet/demo', { 'src/b.mjs': 'export const b = 1;\n' });
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'avance\n');
  d.commit('docs: avance');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', 'feat/a');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  d.github({
    pulls: [
      { number: 12, title: 'feat(a): a', base: 'develop', head: 'feat/a', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }, { body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) }] },
      { number: 13, title: 'feat(b): b', base: 'sujet/demo', head: 'feat/b', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sous), created_at: minute(1) }] },
    ],
    maintenant: minute(30),
  });
  poser(join(d.dossier, '.git/hooks'));
  poser(join(d.dossier, '.crochets'));
  writeFileSync(join(d.dossier, '.git/info/exclude'), '.crochets\nnode_modules\n');
  execFileSync('git', ['config', 'core.hooksPath', join(d.dossier, '.crochets')], { cwd: d.dossier });
  writeFileSync(join(d.racine, 'fsmonitor'), TRACE);
  chmodSync(join(d.racine, 'fsmonitor'), 0o755);
  execFileSync('git', ['config', 'core.fsmonitor', join(d.racine, 'fsmonitor')], { cwd: d.dossier });
  const passe = d.lancer('passe');
  assert.equal(passe.status, 0, passe.stderr);
  assert.deepEqual(d.json(passe).map((g) => [g.pr, g.geste, g.poser ?? null]), [[12, 'etiqueter', 'à-fusionner'], [13, 'distribuer', null]]);
  assert.equal(d.lancer('jouer', '12').status, 0);
  assert.equal(d.lancer('distribuer', '13', '--sommet', sous, '--couple', 'opus/medium', 'session_rel2').status, 0);
  assert.deepEqual(readdirSync(traces), [], 'aucun hook, aucun fsmonitor');
});

// --- C5 : une installation en échec, dans la veille ------------------------------------------------------------------

test('C5 — une installation en échec pendant une passe de la veille écrit sa sortie d’erreur dans le journal de la veille', () => {
  const d = monter();
  d.outil('pnpm', 'cat > /dev/null\necho "ERR_PNPM_FROZEN_LOCKFILE ce que pnpm a dit" >&2\nexit 1');
  pr(d);
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const r = d.lancer('veille', '--pause', '0', '--sondes', '1');
  assert.match(r.stdout, /VEILLE GESTE/);
  assert.match(`${r.stdout}\n${r.stderr}`, /pnpm install en échec \(sortie 1\) :\nERR_PNPM_FROZEN_LOCKFILE ce que pnpm a dit/, 'A-180.5 : la sortie d’erreur de l’installation, écrite là où on la lit');
});

test('C5 (tenue) — `--frozen-lockfile --prefer-offline` : l’installation ne récrit jamais le lockfile de develop', () => {
  const d = monter();
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  pr(d);
  assert.equal(d.lancer('passe').status, 0);
  assert.deepEqual(readFileSync(join(d.racine, 'faux-gh/pnpm.log'), 'utf8').split('\n').filter(Boolean), ['pnpm install --frozen-lockfile --prefer-offline']);
});

test('C5 — une installation en échec rend illisible la PR de mise à jour, mais pas une sous-PR ordinaire, qu’`a-juger` juge sans dépendances', () => {
  const d = monter();
  d.outil('pnpm', 'cat > /dev/null\necho "pnpm $*" >> "$FAUX_GH/pnpm.log"\necho "ERR_PNPM" >&2\nexit 1');
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  pr(d, { base: 'sujet/demo', depuis: 'sujet/demo', tete: 'feat/b', fichiers: { 'src/b.mjs': 'export const b = 1;\n' } });
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.geste, g.faits?.sensible], ['distribuer', false], JSON.stringify(g));
  // Rejouée, l'installation en échec n'est pas retentée, et la cause d'une PR qui en a besoin reste la même.
  const e = monter();
  e.outil('pnpm', 'cat > /dev/null\necho "pnpm $*" >> "$FAUX_GH/pnpm.log"\necho "ERR_PNPM" >&2\nexit 1');
  e.git('switch', '-q', 'develop');
  e.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  e.commit('chore: lockfile');
  e.git('push', '-q', 'origin', 'HEAD:develop');
  miseAJour(e);
  const premiere = e.json(e.lancer('passe'))[0];
  const seconde = e.json(e.lancer('passe'))[0];
  assert.match(premiere.commentaire, /dépendances de develop/);
  assert.deepEqual([seconde.geste, seconde.commentaire], ['illisible', premiere.commentaire], 'la même cause au passage suivant');
});

// --- C6 : PR fermée, PR de fourche -----------------------------------------------------------------------------------

test('C6 (tenue) — une PR dont la fourche a été supprimée (`head.repo` nul) : la cause « PR de fourche », jamais une lecture', () => {
  const d = monter();
  pr(d);
  const p = d.etat().pulls[0];
  // Le faux rend toujours un dépôt de tête : un gh qui l'efface, comme GitHub pour une fourche supprimée.
  d.outil('gh', `out=$(node "$BANC_FAUX_GH" "$@") || exit $?\nprintf '%s' "$out" | jq -c 'if type == "object" and has("head") then .head.repo = null elif type == "array" then map(if type == "object" and has("head") then .head.repo = null else . end) else . end'`);
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(g.geste, 'illisible');
  assert.match(g.commentaire, /^Lecture illisible — PR de fourche/);
});

// --- C7 : un verdict édité --------------------------------------------------------------------------------------------

test('C7 (tenue) — un `validé` édité après coup ne vaut rien : on attend, puis la session muette est remplacée', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3, { updated_at: minute(4) }]);
  assert.deepEqual(d.json(d.lancer('passe')).map((g) => [g.regle, g.geste, g.raison]), [[5, 'rien', 'attente']]);
  const tard = monter({ horloge: 3 * 60 });
  const s2 = pr(tard);
  ajouter(tard, [distribution(1, s2, ['session_rel1']), 2], [verdict(s2, 1, 'session_rel1', 'validé'), 3, { updated_at: minute(4) }]);
  assert.deepEqual(tard.json(tard.lancer('passe')).map((g) => [g.geste, g.cause]), [['remplacer', 'muette']]);
});

// --- C8 : le plafond (A-89, A-179 point 2) -----------------------------------------------------------------------------

test('C8 (tenue) — trois tours refusés sur trois sommets, puis un push avant le réveil : le plafond, pas un quatrième tour', () => {
  const d = monter();
  const a = pr(d);
  const sommets = [a];
  for (const k of [2, 3, 4]) {
    d.git('switch', '-q', 'feat/a');
    d.ecrire('src/a.mjs', `export const a = ${k};\n`);
    d.commit(`fix: a ${k}`);
    d.git('push', '-q', 'origin', 'HEAD:feat/a');
    sommets.push(d.git('rev-parse', 'HEAD'));
  }
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sommets[tour - 1], ['session_rel1']), m++], [verdict(tour === 3 ? 'b'.repeat(40) : sommets[tour - 1], tour, 'session_rel1', 'refusé'), m++]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste], [1, 'plafonner']);
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur', 'architecte']);
});

test('C8 — le plafond se dit à l’architecte même si `à-reprendre` traîne encore sur la PR (une étiquette que l’auteur n’a pas retirée)', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.joue], ['plafonner', true]);
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur', 'architecte'], 'un plafond que personne n’apprend');
});

// --- C9 : la reprise après arbitrage ----------------------------------------------------------------------------------

test('C9 (tenue) — la reprise après arbitrage, la session préférée morte : une session neuve, le tour neuf « non compté », puis le plafond compte deux tours', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3], ['Arbitrage — R3, src/a.mjs:1 — écarté — le cas est couvert ailleurs', 4]);
  const g = d.json(d.lancer('passe'))[0];
  assert.deepEqual([g.regle, g.geste, g.preferees], [4, 'distribuer', ['session_rel1']]);
  const r = d.lancer('distribuer', '12', '--sommet', sha, '--couple', 'opus/medium', 'session_neuve');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.json(r)[0].distribution, distribution(2, sha, ['session_neuve'], ' (après arbitrage, non compté)'));
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.raison]), [[5, 'rien', 'attente']]);
});

// --- C10 : chacune des causes d'« illisible » --------------------------------------------------------------------------

test('C10 — `a-juger` en échec (sortie 11) : la cause nommée, à l’architecte, signalée une fois ; jamais une distribution sur un diff inconnu', () => {
  const d = monter();
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  d.talon('sujet.sh', '#!/usr/bin/env bash\necho "refs absentes : origin/sujet/demo introuvable, fetch d\'abord" >&2\nexit 11\n');
  pr(d, { base: 'sujet/demo', depuis: 'sujet/demo', tete: 'feat/b', fichiers: { 'src/b.mjs': 'export const b = 1;\n' } });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(g.geste, 'illisible', JSON.stringify(g));
  assert.equal(g.commentaire, "Lecture illisible — `sujet.sh a-juger` en échec (sortie 11) : refs absentes : origin/sujet/demo introuvable, fetch d'abord");
  assert.deepEqual(g.lignes.map((l) => l.a), ['architecte']);
  assert.deepEqual(d.json(d.lancer('jouer', '12')).map((x) => [x.geste, x.raison]), [['rien', 'illisible-signale']]);
});

test('C10 — le diff vers develop en échec (aucune base commune) : la cause nommée, à l’architecte ; jamais une distribution', () => {
  const d = monter();
  d.git('switch', '-q', '--orphan', 'feat/orpheline');
  d.ecrire('src/o.mjs', 'export const o = 1;\n');
  d.git('add', 'src/o.mjs');
  d.git('commit', '-q', '-m', 'feat: orpheline');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/feat/orpheline');
  const sha = d.git('rev-parse', 'HEAD');
  d.github({ pulls: [{ number: 12, title: 'feat: o', base: 'develop', head: 'feat/orpheline', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }] }], maintenant: minute(30) });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(g.geste, 'illisible', JSON.stringify(g));
  assert.match(g.commentaire, /^Lecture illisible — diff illisible : /);
  assert.deepEqual(d.json(d.lancer('jouer', '12')).map((x) => x.raison), ['illisible-signale']);
});

test('C10 — une forme refusée sur une PR écrite sans session (`Session: —`) : la ligne va à l’architecte, jamais à personne', () => {
  const d = monter();
  const sha = miseAJour(d);
  const p = d.etat().pulls[0];
  p.commentaires[0].body = `À relire — sommet ${sha} — Session: — — Conducteur: —`;
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(g.geste, 'illisible');
  assert.deepEqual(g.lignes.map((l) => [l.a, l.session]), [['architecte', null]]);
});

test('C10 — une cause signalée se redit après `relecture.delai`, pas avant (A-116)', () => {
  const d = monter();
  pr(d);
  const p = d.etat().pulls[0];
  p.sha = '1'.repeat(40);
  d.github({ pulls: [p] });
  assert.equal(d.json(d.lancer('jouer', '12'))[0].geste, 'illisible');
  // La trace est datée de la minute 30 (`maintenant` du faux) ; le Relecteur, trois heures plus tard.
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + 3 * 60 * 60_000) };
  const r = spawnSync(process.execPath, [RELECTEUR, 'passe'], { cwd: d.dossier, env, encoding: 'utf8' });
  assert.deepEqual(d.json(r).map((g) => g.geste), ['illisible']);
});

// --- Mineurs laissés à un ticket de suite : rouges sur la PR comme après les retouches ---------------------------------

test('C11 (mineur, ticket de suite) — un refus (règle 4) sur une PR où `à-reprendre` est restée posée : l’auteur n’est pas prévenu', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste], [4, 'etiqueter']);
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur'], 'un refus que personne n’apprend');
});

test('C12 (mineur, ticket de suite) — un plafond à moitié écrit (commentaire posé, pose de l’étiquette refusée une fois) : au rejeu, l’architecte n’est pas prévenu', () => {
  const d = monter();
  const sha = pr(d);
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
  // Un gh qui refuse la première pose d'étiquette, puis laisse passer.
  d.outil('gh', `case "$*" in *"-X POST"*labels*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"`);
  assert.equal(d.lancer('jouer', '12').status, 7);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(d.etat().pulls[0].commentaires.filter((c) => (c.body ?? c) === 'Plafond — décision attendue').length, 1);
  assert.ok(g.lignes.some((l) => l.a === 'architecte'), `lignes : ${JSON.stringify(g.lignes.map((l) => [l.a, l.texte]))}`);
});
