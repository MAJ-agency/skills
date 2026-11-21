// Contre-relecture de la PR 146, troisième tour : ce que la phrase neuve de `VEILLE ARRÊTÉE` (R1) fait d'une sortie qui
// revient à chaque passe. Jouer sur l'arbre de 643dd10 (`APRES` pointé dessus). R5 est un mineur, pour un ticket de suite.
// Lancer : APRES=<arbre> node --test essais-c3.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const APRES = process.env.APRES;
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const SKILL = readFileSync(join(APRES, 'skills/chaine/relecteur/SKILL.md'), 'utf8');

test('R5 (tenue) — la veille relancée rejoue sa première passe sans pause : un `index.lock` resté donne deux `VEILLE ARRÊTÉE sortie 12` en quelques secondes, et la suite de 12 arrête le Relecteur à la seconde', () => {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']]) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ relecture: { depuis: '2026-11-20T09:00:00Z' } })}\n`);
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  d.github({ pulls: [] });
  // Un `git` tué en plein travail a laissé son verrou : chaque passe sort en 12.
  writeFileSync(join(dossier, '.git/index.lock'), '');
  const t0 = Date.now();
  const fins = [1, 2].map(() => spawnSync(process.execPath, [RELECTEUR, 'veille', '--duree', '25'], { cwd: dossier, env: d.env, encoding: 'utf8', timeout: 60_000 }));
  const ecoule = (Date.now() - t0) / 1000;
  assert.deepEqual(fins.map((r) => [r.status, r.stdout.trim().split('\n').at(-1)]), [[12, 'VEILLE ARRÊTÉE sortie 12'], [12, 'VEILLE ARRÊTÉE sortie 12']]);
  assert.ok(ecoule < 20, `deux veilles, deux arrêts, en ${ecoule.toFixed(1)} s : « au réveil suivant » vaut « tout de suite »`);
});

test('R5 (tenue) — la sortie 9 renvoie au réveil suivant sans borne : relancée à chaque arrêt, la veille se rendort au plus cinq minutes, sans fin, et `VEILLE FINIE`, seul point où le Relecteur relève son contexte, ne vient jamais', () => {
  const neuf = SKILL.split('\n').find((l) => l.startsWith('| 9 |'));
  const douze = SKILL.split('\n').find((l) => l.startsWith('| 12 |'));
  assert.match(SKILL, /quand cette suite dit « rejouer au réveil suivant » \(9, 12, autre\), relancer la veille/);
  assert.match(douze, /à la seconde fois, l'architecte, et s'arrêter/);
  assert.doesNotMatch(neuf, /seconde fois/, 'la sortie 9 a une borne');
});
