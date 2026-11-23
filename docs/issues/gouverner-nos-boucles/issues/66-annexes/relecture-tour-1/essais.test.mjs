// Essais du relecteur-66 : attaques sur relecteur.mjs, joués sur l'arbre patché (apres/). Rien n'est écrit dans apres/.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
const APRES = process.env.APRES; // arbre de main avec le patch du ticket 66 appliqué
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const CHAINE = join(APRES, 'skills/chaine');
const DEBUT = Date.UTC(2026, 10, 20, 10, 0);
const iso = (ms) => new Date(ms).toISOString().replace(/\.000Z$/, 'Z');
const minute = (m) => iso(DEBUT + m * 60_000);
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-20T09:00:00Z' } };
const CALCULS = [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']];
function monter({ contrat = CONTRAT } = {}) {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  if (contrat !== null) d.ecrire('.claude/chaine.json', `${JSON.stringify(contrat, null, 2)}\n`);
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + 30 * 60_000) };
  const lancer = (...args) => spawnSync(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env, encoding: 'utf8', timeout: 120_000 });
  const json = (r) => r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { ...d, dossier, env, lancer, json };
}
const DEMANDE = (sha) => `À relire — sommet ${sha} — Session: session_auteur — Conducteur: session_conducteur`;
const verdict = (sha, tour, session, mot, { bloquants = mot === 'refusé' ? 1 : 0, securite = null } = {}) =>
  ['<!-- relecture:verdict -->', `Sommet relu: ${sha}`, `Tour: ${tour}`, `Verdict: ${mot}`, `Bloquants: ${bloquants}`, `Session: ${session}`, ...(securite ? [`/security-review: ${securite}`] : []), '', '- constats'].join('\n');
const distribution = (tour, sha, sessions, suite = '') => `Relecture — tour ${tour} — sommet ${sha} — sessions ${sessions.join(', ')}${suite}`;
function pr(d, { fichiers = { 'src/a.mjs': 'export const a = 1;\n' }, commentaires = null, labels = ['à-relire'], ouverte = minute(0), base = 'develop', tete = 'feat/a', depuis = 'develop', state } = {}) {
  const sha = d.branche(tete, `origin/${depuis}`, fichiers);
  const fil = (commentaires ?? [[DEMANDE(sha), 1]]).map(([body, m]) => ({ body, created_at: minute(m) }));
  d.github({ pulls: [{ number: 12, title: 'feat(a): a', base, head: tete, labels, created_at: ouverte, commentaires: fil, ...(state ? { state } : {}) }], maintenant: minute(30) });
  return sha;
}
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${decodeURIComponent(e.route)}${e.champs['labels[]'] ? ` ${e.champs['labels[]']}` : ''}`);

test('X1 un push entre passe et distribuer (règle 6) : distribuer écrit pour le sommet neuf, le couple de la session n’est pas recomparé', () => {
  const d = monter();
  const a = pr(d);
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.geste, g.sommet, g.faits.effort], ['distribuer', a, 'medium']);
  // L'auteur pousse un fichier sensible pendant que le modèle crée la session (couple ordinaire).
  d.git('switch', '-q', 'feat/a');
  d.ecrire('scripts/agent/garde.mjs', 'export const g = 1;\n');
  d.commit('feat: garde');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  const b = d.git('rev-parse', 'HEAD').trim?.() ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: d.travail, encoding: 'utf8' }).trim();
  const r = d.lancer('distribuer', '12', 'session_rel1');
  console.log('X1 status', r.status, r.stderr.trim());
  const out = d.json(r)[0] ?? {};
  console.log('X1 sortie', JSON.stringify({ sommet: out.sommet, faits: out.faits, distribution: out.distribution }));
  assert.equal(r.status, 0);
  assert.notEqual(out.sommet, a);
  assert.equal(out.faits.effort, 'xhigh');
});

test('X3 depuis avec millisecondes, ou +00:00 : contrat-illisible', () => {
  for (const depuis of ['2026-11-20T09:00:00.000Z', '2026-11-20T09:00:00+00:00']) {
    const m = monter({ contrat: { relecture: { depuis } } });
    pr(m);
    const out = m.json(m.lancer('passe')).map((g) => g.geste);
    console.log('X3', depuis, out);
  }
});

test('X5 un fichier --sessions à un mot faux : sortie non documentée', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) });
  d.github({ pulls: [p] });
  for (const contenu of ['{"session_rel1":"vivant"}', '[]', '"morte"', 'null']) {
    const f = join(d.racine, 's.json');
    writeFileSync(f, contenu);
    const r = d.lancer('jouer', '12', '--sessions', f);
    console.log('X5', contenu, 'status', r.status, (r.stderr || '').split('\n').filter(Boolean).slice(0, 2).join(' | ').slice(0, 200));
  }
});

test('X7 une PR fermée entre la veille et le geste : jouer et distribuer écrivent quand même', () => {
  const d = monter();
  pr(d, { state: 'closed' });
  const r = d.lancer('jouer', '12');
  console.log('X7 jouer', r.status, r.stdout.trim().slice(0, 160));
  const s = d.lancer('distribuer', '12', 'session_rel1');
  console.log('X7 distribuer', s.status, ecritures(d));
});

test('X8 commentaires sur deux pages : concaténés', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) });
  d.github({ pulls: [p] });
  const bin = join(d.racine, 'bin');
  const faux = join(CHAINE, 'sujet/scripts/faux-gh.mjs');
  // Un gh qui coupe en deux pages la réponse paginée des commentaires : « [a][b] » puis « [a]\n[b] ».
  for (const sep of ['', '\\n']) {
    writeFileSync(join(bin, 'gh'), `#!/bin/sh\ncase "$*" in *--paginate*comments*) out=$(node ${JSON.stringify(faux)} "$@") || exit $?; printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const a=JSON.parse(s);const h=Math.ceil(a.length/2);process.stdout.write(JSON.stringify(a.slice(0,h))+"${sep}"+JSON.stringify(a.slice(h))+"\\n")})'; exit 0 ;; esac\nexec node ${JSON.stringify(faux)} "$@"\n`);
    const [g] = d.json(d.lancer('passe'));
    console.log('X8 sep', JSON.stringify(sep), [g.regle, g.geste, g.poser]);
    assert.equal(g.poser, 'à-fusionner');
  }
});

test('X12 à-fusionner posée à la main sans relecture : à-relire posée avant le retrait', () => {
  const d = monter();
  pr(d, { labels: ['à-fusionner'] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  console.log('X12', [g.regle, g.geste, g.poser, g.retirer], ecritures(d), g.lignes.map((l) => l.texte));
});

test('X13 plafond : trois tours refusés, le troisième sur un autre sommet (A-179, 2)', () => {
  const d = monter();
  const sha = pr(d);
  const autre = 'a'.repeat(40);
  const p = d.etat().pulls[0];
  let m = 2;
  for (const tour of [1, 2, 3]) p.commentaires.push({ body: distribution(tour, sha, ['session_rel1']), created_at: minute(m++) }, { body: verdict(tour === 3 ? autre : sha, tour, 'session_rel1', 'refusé'), created_at: minute(m++) });
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  console.log('X13', [g.regle, g.geste, g.joue], ecritures(d));
  assert.equal(g.geste, 'plafonner');
});

test('X14 le lockfile de la PR change, pas celui de develop : aucune installation', () => {
  const d = monter();
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  pr(d, { fichiers: { 'pnpm-lock.yaml': 'lockfileVersion: 9.0\n# hostile\n', 'package.json': '{"scripts":{"preinstall":"touch /tmp/pwn"}}\n' } });
  const log = join(d.racine, 'faux-gh/pnpm.log');
  execFileSync('mkdir', ['-p', join(d.dossier, 'node_modules')]);
  writeFileSync(join(d.dossier, '.git/info/exclude'), 'node_modules\n');
  assert.equal(d.lancer('passe').status, 0);
  const lignes = existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];
  console.log('X14 pnpm', lignes);
  const tete = execFileSync('git', ['rev-parse', 'HEAD:pnpm-lock.yaml'], { cwd: d.dossier, encoding: 'utf8' }).trim();
  const devl = execFileSync('git', ['rev-parse', 'origin/develop:pnpm-lock.yaml'], { cwd: d.dossier, encoding: 'utf8' }).trim();
  console.log('X14 HEAD est develop', tete === devl);
});

test('X15 une sous-PR de mise à jour dont a-juger refuse la forme : la cause dite à l’architecte', () => {
  const d = monter();
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  // Une « PR de mise à jour » mal formée : deux fusions de develop.
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'develop avance\n'); d.commit('docs: avance 1'); d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', '-C', 'maj/demo', 'origin/sujet/demo');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('switch', '-q', 'develop');
  d.ecrire('docs/x.md', 'x\n'); d.commit('docs: avance 2'); d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', 'maj/demo');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/maj/demo');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: d.travail, encoding: 'utf8' }).trim();
  d.github({ pulls: [{ number: 12, title: 'chore: maj', base: 'sujet/demo', head: 'maj/demo', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }] }], maintenant: minute(30) });
  const r = d.lancer('jouer', '12');
  const g = d.json(r)[0] ?? {};
  console.log('X15', r.status, g.geste, g.commentaire, JSON.stringify(g.lignes));
});
