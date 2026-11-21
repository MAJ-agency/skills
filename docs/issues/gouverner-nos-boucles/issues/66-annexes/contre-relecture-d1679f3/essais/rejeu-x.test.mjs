// Contre-relecture de la PR 146, premier tour : les essais X1 à X17 du relecteur du ticket, rejoués sur l'arbre de la
// PR (`APRES` : main à 5bf4f39 et ticket-66.patch, l'arbre de d1679f3). Chaque essai garde son montage d'origin
// (relecture-tour-1/essais.test.mjs et essais2.test.mjs) ; seuls changent les appels que la PR a changés
// (`distribuer` prend `--sommet` et `--couple`) et l'assertion, qui dit ce qu'`A-180` voulait.
// Lancer : APRES=<arbre> node --test rejeu-x.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const APRES = process.env.APRES;
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const CHAINE = join(APRES, 'skills/chaine');
const DEBUT = Date.UTC(2026, 10, 20, 10, 0);
const iso = (ms) => new Date(ms).toISOString().replace(/\.000Z$/, 'Z');
const minute = (m) => iso(DEBUT + m * 60_000);
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-20T09:00:00Z' } };
const CALCULS = [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']];
function monter({ contrat = CONTRAT, suivi = false } = {}) {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  if (contrat !== null) d.ecrire('.claude/chaine.json', `${JSON.stringify(contrat, null, 2)}\n`);
  if (suivi) d.ecrire('suivi.txt', 'graphe\n');
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + 30 * 60_000) };
  const lancer = (...args) => spawnSync(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env, encoding: 'utf8', timeout: 120_000 });
  const enFond = (...args) => new Promise((ok) => { const p = spawn(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env }); let e = ''; p.stderr.on('data', (c) => (e += c)); p.on('close', (c) => ok({ status: c, stderr: e })); });
  const json = (r) => r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { ...d, dossier, env, lancer, enFond, json };
}
const DEMANDE = (sha) => `À relire — sommet ${sha} — Session: session_auteur — Conducteur: session_conducteur`;
const verdict = (sha, tour, session, mot, { bloquants = mot === 'refusé' ? 1 : 0 } = {}) =>
  ['<!-- relecture:verdict -->', `Sommet relu: ${sha}`, `Tour: ${tour}`, `Verdict: ${mot}`, `Bloquants: ${bloquants}`, `Session: ${session}`, '', '- constats'].join('\n');
const distribution = (tour, sha, sessions, suite = '') => `Relecture — tour ${tour} — sommet ${sha} — sessions ${sessions.join(', ')}${suite}`;
function pr(d, { fichiers = { 'src/a.mjs': 'export const a = 1;\n' }, labels = ['à-relire'], base = 'develop', tete = 'feat/a', depuis = 'develop', state } = {}) {
  const sha = d.branche(tete, `origin/${depuis}`, fichiers);
  d.github({ pulls: [{ number: 12, title: 'feat(a): a', base, head: tete, labels, created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }], ...(state ? { state } : {}) }], maintenant: minute(30) });
  return sha;
}
const ajouter = (d, ...commentaires) => {
  const p = d.etat().pulls[0];
  p.commentaires.push(...commentaires.map(([body, m]) => ({ body, created_at: minute(m) })));
  d.github({ pulls: [p] });
};
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${decodeURIComponent(e.route)}${e.champs['labels[]'] ? ` ${e.champs['labels[]']}` : ''}`);

test('X1 (A-180.2) — un push entre passe et distribuer : sortie 3, rien d’écrit ; le couple recomparé', () => {
  const d = monter();
  const a = pr(d);
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.geste, g.sommet, g.faits.effort], ['distribuer', a, 'medium']);
  d.git('switch', '-q', 'feat/a');
  d.ecrire('scripts/agent/garde.mjs', 'export const g = 1;\n');
  d.commit('feat: garde');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  const r = d.lancer('distribuer', '12', '--sommet', a, '--couple', 'opus/medium', 'session_rel1');
  assert.deepEqual([r.status, /le sommet est maintenant/.test(r.stderr)], [3, true], r.stderr);
  const b = d.git('rev-parse', 'HEAD');
  const c = d.lancer('distribuer', '12', '--sommet', b, '--couple', 'opus/medium', 'session_rel1');
  assert.deepEqual([c.status, /le couple est maintenant opus\/xhigh/.test(c.stderr)], [3, true], c.stderr);
  assert.deepEqual(ecritures(d), []);
});

test('X3 (A-180.4) — `depuis` à millisecondes admis, `+00:00` refusé (limite écrite)', () => {
  for (const [depuis, geste] of [['2026-11-20T09:00:00.000Z', 'distribuer'], ['2026-11-20T09:00:00+00:00', 'contrat-illisible']]) {
    const m = monter({ contrat: { relecture: { depuis } } });
    pr(m);
    assert.deepEqual(m.json(m.lancer('passe')).map((g) => g.geste), [geste], depuis);
  }
});

test('X5 (A-180.4) — `--sessions` à un mot faux, ou pas un objet : sortie 2, la cause dite, aucune pile', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2]);
  for (const contenu of ['{"session_rel1":"vivant"}', '[]', '"morte"', 'null']) {
    const f = join(d.racine, 's.json');
    writeFileSync(f, contenu);
    const r = d.lancer('jouer', '12', '--sessions', f);
    assert.deepEqual([r.status, /^relecteur : --sessions : /.test(r.stderr), /TypeError|    at /.test(r.stderr)], [2, true, false], `${contenu} : ${r.stderr}`);
  }
});

test('X7 (A-180.4) — une PR fermée : jouer et distribuer sortent en 3, rien d’écrit', () => {
  const d = monter();
  const sha = pr(d, { state: 'closed' });
  assert.equal(d.lancer('jouer', '12').status, 3);
  assert.equal(d.lancer('distribuer', '12', '--sommet', sha, '--couple', 'opus/medium', 'session_rel1').status, 3);
  assert.deepEqual(ecritures(d), []);
});

test('X8 (tenait déjà ; banc N12 d’A-180.6) — deux pages de commentaires, `[a][b]` et `[a]\\n[b]` : concaténées', () => {
  for (const sep of ['', '\n']) {
    const d = monter();
    const sha = pr(d);
    ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3]);
    // Le faux `gh` à deux pages, sans rien de variable dans son texte (A-181) : ce qu'il lit lui vient de l'environnement.
    Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_SEPARATEUR: sep });
    writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *--paginate*comments*) out=$(node "$BANC_FAUX_GH" "$@") || exit $?; printf \'%s\' "$out" | node -e \'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const a=JSON.parse(s);const h=Math.ceil(a.length/2);process.stdout.write(JSON.stringify(a.slice(0,h))+process.env.BANC_SEPARATEUR+JSON.stringify(a.slice(h))+"\\n")})\'; exit 0 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
    const [g] = d.json(d.lancer('passe'));
    assert.deepEqual([g.regle, g.poser], [2, 'à-fusionner'], JSON.stringify(sep));
  }
});

test('X12 (constat de lecture, conforme à A-84 ; règle 3 du lot 3a) — `à-fusionner` posée à la main sans tour : `à-reprendre` posée avant le retrait', () => {
  const d = monter();
  pr(d, { labels: ['à-fusionner'] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.poser, g.retirer], [3, 'etiqueter', 'à-reprendre', ['à-fusionner']]);
  assert.deepEqual(ecritures(d), ['POST issues/12/labels à-reprendre', 'DELETE issues/12/labels/à-fusionner']);
});

test('X13 (A-179.2) — trois tours refusés, le troisième verdict sur un autre sommet : le plafond', () => {
  const d = monter();
  const sha = pr(d);
  const autre = 'a'.repeat(40);
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(tour === 3 ? autre : sha, tour, 'session_rel1', 'refusé'), m++]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.joue], [1, 'plafonner', true]);
});

test('X14 (A-179.3, tenait) — le lockfile et le package.json de la PR changent : une installation, celle de develop', () => {
  const d = monter();
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  pr(d, { fichiers: { 'pnpm-lock.yaml': 'lockfileVersion: 9.0\n# hostile\n', 'package.json': '{"scripts":{"preinstall":"touch hostile"}}\n' } });
  assert.equal(d.lancer('passe').status, 0);
  const log = join(d.racine, 'faux-gh/pnpm.log');
  assert.equal(readFileSync(log, 'utf8').split('\n').filter((l) => l.startsWith('pnpm install')).length, 1);
  const tete = execFileSync('git', ['rev-parse', 'HEAD:pnpm-lock.yaml'], { cwd: d.dossier, encoding: 'utf8' }).trim();
  const devl = execFileSync('git', ['rev-parse', 'origin/develop:pnpm-lock.yaml'], { cwd: d.dossier, encoding: 'utf8' }).trim();
  assert.equal(tete, devl, 'le dossier est sur develop pendant l’installation');
});

test('X15 (A-180.5) — `a-juger` refuse la forme : « forme refusée », à l’auteur, plus « double relecture illisible »', () => {
  const d = monter();
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'develop avance\n'); d.commit('docs: avance 1'); d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', '-C', 'maj/demo', 'origin/sujet/demo');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('switch', '-q', 'develop');
  d.ecrire('docs/x.md', 'x\n'); d.commit('docs: avance 2'); d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', 'maj/demo');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/maj/demo');
  const sha = d.git('rev-parse', 'HEAD');
  d.github({ pulls: [{ number: 12, title: 'chore: maj', base: 'sujet/demo', head: 'maj/demo', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }] }], maintenant: minute(30) });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(g.geste, 'illisible');
  assert.match(g.commentaire, /^Lecture illisible — forme refusée par `sujet\.sh a-juger` : /);
  assert.deepEqual(g.lignes.map((l) => [l.a, l.session]), [['auteur', 'session_auteur']]);
});

test('X16 (A-180.5) — trois préparations simultanées, dix fois : le verrou les range, aucune sortie 12', async () => {
  const d = monter();
  pr(d);
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const r = await Promise.all([d.enFond('passe'), d.enFond('passe'), d.enFond('jouer', '12')]);
    codes.push(...r.map((x) => x.status));
  }
  assert.deepEqual([...new Set(codes)], [0], codes.join(' '));
});

test('X17 (A-180.5) — un hook post-checkout qui récrit un fichier suivi : il ne joue pas, les passes suivantes sortent en 0', () => {
  const d = monter({ suivi: true });
  pr(d);
  const hooks = join(d.dossier, '.hooks');
  mkdirSync(hooks);
  writeFileSync(join(hooks, 'post-checkout'), '#!/bin/sh\ndate +%s%N > "$(git rev-parse --show-toplevel)/suivi.txt"\n');
  chmodSync(join(hooks, 'post-checkout'), 0o755);
  writeFileSync(join(d.dossier, '.git/info/exclude'), '.hooks\n');
  execFileSync('git', ['config', 'core.hooksPath', hooks], { cwd: d.dossier });
  const a = d.lancer('passe');
  d.git('switch', '-q', 'develop'); d.ecrire('README.md', 'avance\n'); d.commit('docs: avance'); d.git('push', '-q', 'origin', 'HEAD:develop');
  const b = d.lancer('passe');
  const c = d.lancer('passe');
  assert.deepEqual([a.status, b.status, c.status], [0, 0, 0], c.stderr);
  assert.equal(existsSync(join(d.dossier, 'suivi.txt')) && readFileSync(join(d.dossier, 'suivi.txt'), 'utf8'), 'graphe\n');
});
