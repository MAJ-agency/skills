import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
const APRES = process.env.APRES; // arbre de main avec le patch du ticket 66 appliqué
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const DEBUT = Date.UTC(2026, 10, 20, 10, 0);
const iso = (ms) => new Date(ms).toISOString().replace(/\.000Z$/, 'Z');
const minute = (m) => iso(DEBUT + m * 60_000);
const CALCULS = [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']];
function monter() {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-20T09:00:00Z' } }, null, 2)}\n`);
  d.ecrire('suivi.txt', 'graphe\n');
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + 30 * 60_000) };
  const lancer = (...args) => spawnSync(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env, encoding: 'utf8', timeout: 120_000 });
  const lancerAsync = (...args) => new Promise((ok) => { const p = spawn(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env }); let e = ''; p.stderr.on('data', (c) => (e += c)); p.on('close', (c) => ok({ status: c, stderr: e })); });
  return { ...d, dossier, env, lancer, lancerAsync };
}
function pr(d) {
  const sha = d.branche('feat/a', 'origin/develop', { 'src/a.mjs': 'export const a = 1;\n' });
  d.github({ pulls: [{ number: 12, title: 'feat(a): a', base: 'develop', head: 'feat/a', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: `À relire — sommet ${sha} — Session: s_a — Conducteur: s_c`, created_at: minute(1) }] }], maintenant: minute(30) });
}

test('X16 deux préparations en même temps (veille + geste) dans le même dossier', async () => {
  const d = monter();
  pr(d);
  let codes = [];
  for (let i = 0; i < 6; i++) {
    const r = await Promise.all([d.lancerAsync('passe'), d.lancerAsync('passe'), d.lancerAsync('jouer', '12')]);
    codes.push(r.map((x) => x.status).join('/'));
    const e = r.find((x) => x.status !== 0);
    if (e) console.log('X16 erreur', e.status, e.stderr.trim().split('\n').at(-1));
  }
  console.log('X16 codes', codes.join(' '));
});

test('X17 un hook post-checkout qui récrit un fichier suivi : la passe suivante sort en 6', () => {
  const d = monter();
  pr(d);
  const hooks = join(d.dossier, '.hooks');
  mkdirSync(hooks);
  writeFileSync(join(hooks, 'post-checkout'), '#!/bin/sh\ndate +%s%N > "$(git rev-parse --show-toplevel)/suivi.txt"\n');
  chmodSync(join(hooks, 'post-checkout'), 0o755);
  writeFileSync(join(d.dossier, '.git/info/exclude'), '.hooks\n');
  execFileSync('git', ['config', 'core.hooksPath', hooks], { cwd: d.dossier });
  const a = d.lancer('passe');
  // develop avance : le switch suivant change HEAD et joue le hook.
  d.git('switch', '-q', 'develop'); d.ecrire('README.md', 'avance\n'); d.commit('docs: avance'); d.git('push', '-q', 'origin', 'HEAD:develop');
  const b = d.lancer('passe');
  const c = d.lancer('passe');
  console.log('X17', a.status, b.status, c.status, c.stderr.trim());
});
