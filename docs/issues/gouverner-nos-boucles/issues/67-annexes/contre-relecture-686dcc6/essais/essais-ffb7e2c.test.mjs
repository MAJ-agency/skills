// Contre-relecture de la PR 147, second tour (sommet `ffb7e2c`) : l'essai qui tue la mutation N3, que les bancs neufs
// du premier tour laissent passer. Tenue : vert attendu sur l'arbre de la PR, rouge sous N3. Mêmes aides que
// `essais-686dcc6.test.mjs`. Lancer : APRES=<arbre> node --test essais-ffb7e2c.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const APRES = process.env.APRES;
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const FAUX = join(APRES, 'skills/chaine/sujet/scripts/faux-gh.mjs');
const DEBUT = Date.UTC(2026, 10, 20, 10, 0);
const iso = (ms) => new Date(ms).toISOString().replace(/\.000Z$/, 'Z');
const minute = (m) => iso(DEBUT + m * 60_000);
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-20T09:00:00Z' } };
const CALCULS = [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']];

function monter() {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  d.ecrire('.claude/chaine.json', `${JSON.stringify(CONTRAT, null, 2)}\n`);
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  // Les faux outils de ces essais ne contiennent rien de variable : ce qu'ils lisent leur vient de l'environnement.
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + 30 * 60_000), BANC_FAUX_GH: FAUX, BANC_TRAVAIL: d.travail, BANC_ORIGINE: d.origine };
  const lancer = (...args) => spawnSync(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env, encoding: 'utf8', timeout: 120_000 });
  const json = (r) => r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const outil = (nom, corps) => {
    writeFileSync(join(d.racine, 'bin', nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(d.racine, 'bin', nom), 0o755);
  };
  return { ...d, dossier, env, lancer, json, outil };
}
const DEMANDE = (sha) => `À relire — sommet ${sha} — Session: session_auteur — Conducteur: session_conducteur`;
const verdict = (sha, tour, session, mot) =>
  ['<!-- relecture:verdict -->', `Sommet relu: ${sha}`, `Tour: ${tour}`, `Verdict: ${mot}`, `Bloquants: ${mot === 'refusé' ? 1 : 0}`, `Session: ${session}`, '', '- constats'].join('\n');
const distribution = (tour, sha, sessions) => `Relecture — tour ${tour} — sommet ${sha} — sessions ${sessions.join(', ')}`;
function pr(d, { labels = ['à-relire'], commentaires = null } = {}) {
  const sha = d.branche('feat/a', 'origin/develop', { 'src/a.mjs': 'export const a = 1;\n' });
  const fil = (commentaires ?? [[DEMANDE(sha), 1]]).map(([body, m]) => ({ body, created_at: minute(m) }));
  d.github({ pulls: [{ number: 12, title: 'feat(a): a', base: 'develop', head: 'feat/a', labels, created_at: minute(0), commentaires: fil }], maintenant: minute(30) });
  return sha;
}
const ajouter = (d, ...commentaires) => {
  const p = d.etat().pulls[0];
  p.commentaires.push(...commentaires.map(([body, m]) => ({ body, created_at: minute(m) })));
  d.github({ pulls: [p] });
};
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${decodeURIComponent(e.route)}${e.champs['labels[]'] ? ` ${e.champs['labels[]']}` : ''}`);
// Un gh qui refuse une fois le retrait d'une étiquette (un 502 passager), que `retirer_label` tait, puis laisse passer.
const RETRAIT_REFUSE_UNE_FOIS = 'case "$*" in *"-X DELETE"*labels*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"';

// --- K8 : une trace d'illisible entre la pose et le rejeu n'est pas la marque -------------------------------------

test('K8 (tenue) — une trace d’illisible écrite entre la pose et le rejeu n’est pas la marque (`dernier` l’exclut, A-183 point 6) : rien ne repart', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  d.outil('gh', RETRAIT_REFUSE_UNE_FOIS);
  assert.deepEqual(d.json(d.lancer('jouer', '12'))[0].lignes.map((l) => l.a), ['auteur', 'conducteur']);
  // Un passage suivant a écrit une trace (un calcul en panne, revenu depuis) après la pose de la minute 30.
  ajouter(d, ['Lecture illisible — « double relecture exigée » illisible', 31]);
  const rejoue = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([rejoue.geste, rejoue.marque, rejoue.lignes], ['etiqueter', minute(3), []], JSON.stringify(rejoue));
});
