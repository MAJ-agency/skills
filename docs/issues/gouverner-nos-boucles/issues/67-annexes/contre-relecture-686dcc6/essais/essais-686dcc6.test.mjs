// Contre-relecture de la PR 147 (tickets 67 à 69), premier tour : attaques sur `relecteur.mjs` au sommet `686dcc6`,
// jouées sur l'arbre de la PR (`APRES`) et sur `25a72c7` (sa base) quand l'essai le dit. Chaque test dit ce que la PR
// doit tenir ; un rouge sur l'arbre de la PR est un constat (son numéro, K<k>, est celui du rapport). Les essais qui
// documentent une tenue (vert attendu sur la PR) le disent dans leur nom : ils servent de banc aux mutations.
// Lancer : APRES=<arbre> node --test essais-686dcc6.test.mjs
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

// --- K1 : le plafond rejoué après un retrait refusé ------------------------------------------------------------------

test('K1 — un plafond entier dont le retrait de `à-relire` a été refusé (et tu) : le rejeu ne redit rien (A-118 ; vert sur 25a72c7)', () => {
  const d = monter();
  const sha = pr(d);
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
  d.outil('gh', RETRAIT_REFUSE_UNE_FOIS);
  const premier = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([premier.geste, premier.lignes.map((l) => l.a)], ['plafonner', ['auteur', 'conducteur', 'architecte']]);
  assert.deepEqual(d.etat().pulls[0].labels.sort(), ['à-relire', 'à-reprendre'], 'le retrait refusé laisse les deux étiquettes');
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 0, r.stderr);
  const rejoue = d.json(r)[0];
  assert.deepEqual([rejoue.regle, rejoue.geste, rejoue.poser], [1, 'etiqueter', 'à-reprendre'], JSON.stringify(rejoue));
  assert.deepEqual(rejoue.lignes.map((l) => [l.a, l.texte]), [], 'un passage rejoué : « décision de plafond attendue » ne repart pas, les lignes du plafond sont parties au premier passage');
  assert.deepEqual(d.etat().pulls[0].labels, ['à-reprendre']);
});

// --- Tenues : la marque est un commentaire à marque, pas un commentaire quelconque ; sans marque, les lignes partent --

test('K2 (tenue) — un passage rejoué suivi d’un commentaire ordinaire (sans marque) : la marque reste le verdict, rien ne repart', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  d.outil('gh', RETRAIT_REFUSE_UNE_FOIS);
  const premier = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual(premier.lignes.map((l) => l.a), ['auteur', 'conducteur']);
  // Un humain écrit sur la PR après la pose (minute 30), avant le rejeu : un commentaire sans marque.
  ajouter(d, ['Merci, je regarde le refus.', 31]);
  const rejoue = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([rejoue.geste, rejoue.marque, rejoue.lignes], ['etiqueter', minute(3), []], JSON.stringify(rejoue));
});

test('K3 (tenue) — une étiquette à poser déjà là, sans aucune marque sur la PR : dans le doute, les lignes partent (ticket 68, décision 1)', () => {
  const d = monter();
  // `à-fusionner` sans tour (règle 3, le contenu a changé) et `à-reprendre` déjà là, posée à la minute 20 ; aucun
  // commentaire : aucune marque.
  pr(d, { labels: ['à-fusionner', 'à-reprendre'], commentaires: [] });
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'à-reprendre', created_at: minute(20) }] }] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.poser, g.marque], [3, 'etiqueter', 'à-reprendre', null], JSON.stringify(g));
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur']);
  assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-fusionner']);
});

// --- Tenues : les lectures neuves en panne -------------------------------------------------------------------------

test('K4 (tenue) — les événements de la PR ne se lisent pas : `jouer` sort en 5 sans rien écrire ; au rejeu, les lignes partent', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  d.github({ pannes: [{ route: '^issues/12/events', fois: 1 }] });
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 5, r.stderr);
  assert.deepEqual(ecritures(d), [], 'rien d’écrit : ni retrait, ni pose');
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur']);
  assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-relire']);
});

test('K5 (tenue) — la seconde lecture d’origin (la tête relue) en échec : `jouer` sort en 12, jamais une tête dite introuvable (ticket 67, décision 4)', () => {
  const d = monter();
  pr(d);
  d.git('switch', '-q', 'feat/a');
  d.ecrire('src/a.mjs', 'export const a = 2;\n');
  d.commit('fix: a');
  // À la lecture de la PR (après la préparation) : un push neuf sur la PR, puis origin du dossier injoignable, une fois.
  d.outil('gh', 'case "$*" in *pulls/12*) if [ ! -e "$FAUX_GH/casse-faite" ]; then touch "$FAUX_GH/casse-faite"; git -C "$BANC_TRAVAIL" push -q origin HEAD:feat/a; node "$BANC_FAUX_GH" "$@"; s=$?; git config remote.origin.url "$BANC_ORIGINE.parti"; exit $s; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"');
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 12, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /^relecteur : git fetch -q --prune origin /m);
  assert.ok(!d.etat().pulls[0].commentaires.some((c) => /^Lecture illisible/.test(c.body ?? c)), 'aucune trace « tête introuvable »');
});

test('K6 (tenue) — les événements sur deux pages, la dernière pose sur la seconde : toutes les pages se lisent, le passage rejoué ne redit rien', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  const evenements = [['labeled', 'à-reprendre', 1], ['unlabeled', 'à-reprendre', 2], ['labeled', 'à-reprendre', 4], ['labeled', 'à-relire', 4]].map(([event, label, m]) => ({ event, label, created_at: minute(m) }));
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements }] });
  // Comme GitHub : sans `--paginate`, la première page seule ; avec, les deux, à la suite.
  d.outil('gh', 'case "$*" in *issues/12/events*) out=$(node "$BANC_FAUX_GH" "$@") || exit $?; case "$*" in *--paginate*) tout=1 ;; *) tout= ;; esac; printf \'%s\' "$out" | TOUT="$tout" node -e \'let s="";process.stdin.on("data",(c)=>(s+=c)).on("end",()=>{const a=JSON.parse(s);const h=Math.ceil(a.length/2);process.stdout.write(JSON.stringify(a.slice(0,h))+(process.env.TOUT?JSON.stringify(a.slice(h)):"")+"\\n")})\'; exit 0 ;; esac\nexec node "$BANC_FAUX_GH" "$@"');
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.poser, g.lignes], ['etiqueter', 'à-reprendre', []], JSON.stringify(g));
});

test('K7 (documente) — une panne des seuls événements : `passe`, qui ne les lit pas, rend le geste à chaque sonde, et `jouer`, qui les lit, sort en 5 à chaque fois ; la sortie 5 n’a pas de borne', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  d.github({ pannes: [{ route: '^issues/12/events', fois: 99 }] });
  for (const tour of [1, 2, 3]) {
    const v = d.lancer('veille', '--pause', '0', '--sondes', '1');
    assert.deepEqual([v.status, v.stdout], [0, 'VEILLE GESTE\nGESTE 12 etiqueter règle 4\n'], `réveil ${tour}`);
    const j = d.lancer('jouer', '12');
    assert.equal(j.status, 5, `réveil ${tour} : ${j.stderr}`);
  }
  assert.deepEqual(ecritures(d), [], 'rien d’écrit, aucune ligne : une boucle muette tant que la panne dure');
});
