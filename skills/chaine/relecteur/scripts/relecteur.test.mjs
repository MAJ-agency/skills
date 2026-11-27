// Banc du Relecteur (skill relecteur, lot 4) : `relecteur.mjs` joué comme la session le joue, dans une copie du
// dépôt jouet qui ne sert qu'à lui, avec les vrais scripts de la chaîne posés sur develop et le faux GitHub. Chaque
// cas monte son état, lance la sous-commande, et lit ce qu'elle écrit (sa ligne JSON) et ce qu'elle a fait sur
// GitHub (le journal du faux). Aucun réseau ; l'heure est posée (`RELECTEUR_HORLOGE_BANC`, `maintenant` du faux).
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { depotJouet, script } from '../../sujet/scripts/depot-jouet.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const RELECTEUR = join(ICI, 'relecteur.mjs');
const CHAINE = join(ICI, '../..');
const DEBUT = Date.UTC(2026, 10, 20, 10, 0);
const iso = (ms) => new Date(ms).toISOString().replace(/\.000Z$/, 'Z');
const minute = (m) => iso(DEBUT + m * 60_000);
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-20T09:00:00Z' } };
// Les calculs que le Relecteur joue, posés sur develop à côté de ceux que `publierChaine` pose déjà.
const CALCULS = [
  ['fusionner', 'decision-relecteur.mjs'],
  ['fusionner', 'verdict.mjs'],
  ['fusionner', 'double-relecture.mjs'],
  ['fusionner', 'meme-contenu.sh'],
  ['revue-adversariale', 'chemins-sensibles.mjs'],
];

// Le dépôt jouet, la chaîne sur develop, son contrat, et la copie du Relecteur (un clone d'origin).
function monter({ contrat = CONTRAT, superficiel = false, horloge = 30 } = {}) {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  if (contrat !== null) d.ecrire('.claude/chaine.json', `${JSON.stringify(contrat, null, 2)}\n`);
  d.commit('chore: calculs et contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', ...(superficiel ? ['--depth', '1', `file://${d.origine}`] : [d.origine]), dossier], { env: d.env });
  const env = { ...d.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + horloge * 60_000) };
  const lancer = (...args) => spawnSync(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env, encoding: 'utf8', timeout: 120_000 });
  const enFond = (...args) =>
    new Promise((fini) => {
      const p = spawn(process.execPath, [RELECTEUR, ...args], { cwd: dossier, env });
      let erreur = '';
      p.stderr.on('data', (c) => (erreur += c));
      p.on('close', (status) => fini({ status, stderr: erreur }));
    });
  const json = (r) => r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  // Un calcul de develop remplacé par un talon (un calcul en panne, ou qui rend ce que le cas veut).
  const talon = (nom, corps) => {
    d.git('switch', '-q', 'develop');
    d.ecrire(`scripts/chaine/${nom}`, corps);
    d.commit(`test: talon ${nom}`);
    d.git('push', '-q', 'origin', 'HEAD:develop');
  };
  return { ...d, dossier, env, lancer, enFond, json, talon };
}
// `distribuer`, avec le sommet et le couple que le geste nommait.
const distribuer = (d, sha, couple, ...args) => d.lancer('distribuer', '12', '--sommet', sha, '--couple', couple, ...args);
const ajouter = (d, ...commentaires) => {
  const p = d.etat().pulls[0];
  p.commentaires.push(...commentaires.map(([body, m]) => ({ body, created_at: minute(m) })));
  d.github({ pulls: [p] });
};

const DEMANDE = (sha) => `À relire — sommet ${sha} — Session: session_auteur — Conducteur: session_conducteur`;
const verdict = (sha, tour, session, mot, { bloquants = mot === 'refusé' ? 1 : 0, securite = null } = {}) =>
  ['<!-- relecture:verdict -->', `Sommet relu: ${sha}`, `Tour: ${tour}`, `Verdict: ${mot}`, `Bloquants: ${bloquants}`, `Session: ${session}`, ...(securite ? [`/security-review: ${securite}`] : []), '', '- constats'].join('\n');
const distribution = (tour, sha, sessions, suite = '') => `Relecture — tour ${tour} — sommet ${sha} — sessions ${sessions.join(', ')}${suite}`;

// Une PR 12 vers develop, ouverte à 10 h, qui porte `à-relire` et la demande de son auteur ; ses commentaires datés
// à la minute (`[corps, minute]`). `maintenant` du faux : la minute 30, l'heure du Relecteur.
function pr(d, { fichiers = { 'src/a.mjs': 'export const a = 1;\n' }, commentaires = null, labels = ['à-relire'], ouverte = minute(0), base = 'develop', tete = 'feat/a', depuis = 'develop' } = {}) {
  const sha = d.branche(tete, `origin/${depuis}`, fichiers);
  const fil = (commentaires ?? [[DEMANDE(sha), 1]]).map(([body, m]) => ({ body, created_at: minute(m) }));
  d.github({ pulls: [{ number: 12, title: 'feat(a): a', base, head: tete, labels, created_at: ouverte, commentaires: fil }], maintenant: minute(30) });
  return sha;
}
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${decodeURIComponent(e.route)}${e.champs['labels[]'] ? ` ${e.champs['labels[]']}` : ''}`);

test('la file : une PR en régime 8 seulement — clé sur la base et PR ouverte après `depuis` ; une clé mal formée se dit, jamais une file vide', () => {
  const sans = monter({ contrat: { cheminsSensibles: [] } });
  pr(sans);
  assert.deepEqual(sans.json(sans.lancer('passe')).map((g) => [g.pr, g.geste, g.raison]), [[12, 'hors-regime', 'régime 7']]);
  const d = monter();
  pr(d, { ouverte: '2026-11-20T08:59:00Z' });
  assert.deepEqual(d.json(d.lancer('passe')).map((g) => [g.geste, g.raison]), [['hors-regime', 'régime 7']], 'ouverte avant la repose : régime 7');
  const meme = monter();
  pr(meme, { ouverte: '2026-11-20T09:00:00Z' });
  assert.deepEqual(meme.json(meme.lancer('passe')).map((g) => g.raison), ['régime 7'], 'ouverte à l’instant même de `depuis` : pas après');
  const principale = monter();
  pr(principale, { base: 'main', depuis: 'develop' });
  assert.deepEqual(principale.json(principale.lancer('passe')).map((g) => [g.geste, g.raison]), [['hors-regime', 'base hors de la chaîne']]);
  for (const relecture of [{ depuis: 'demain' }, { depuis: '2026-11-20T09:00:00Z', delai: 0 }, { depuis: '2026-11-20T09:00:00Z', sensible: { modele: 'opus', effort: 'fort' } }, null]) {
    const m = monter({ contrat: { relecture } });
    pr(m);
    assert.deepEqual(m.json(m.lancer('passe')).map((g) => g.geste), ['contrat-illisible'], JSON.stringify(relecture));
  }
});

test('nominal : distribuer (r6), écrire la distribution après la session, attendre (r5), puis `à-fusionner` posée avant que `à-relire` parte, une ligne à l’auteur et au conducteur, et rien au passage suivant', () => {
  const d = monter();
  const sha = pr(d);
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.regle, g.geste, g.tour, g.sommet, g.nombre, g.faits], [6, 'distribuer', 1, sha, 1, { sensible: false, exiges: 1, modele: 'opus', effort: 'medium', auteur: 'session_auteur', conducteur: 'session_conducteur' }]);
  const joue = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([joue.geste, joue.joue], ['distribuer', false], 'un geste de session : jouer n’écrit rien');
  assert.deepEqual(ecritures(d), []);
  const r = distribuer(d, sha, 'opus/medium', 'session_rel1');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.json(r)[0].distribution, distribution(1, sha, ['session_rel1']));
  assert.equal(d.etat().pulls[0].commentaires.at(-1).body, distribution(1, sha, ['session_rel1']));
  assert.equal(distribuer(d, sha, 'opus/medium', 'session_rel2').status, 3, 'le tour est distribué : le geste a changé');
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.raison]), [[5, 'rien', 'attente']]);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(31) });
  d.github({ pulls: [p] });
  const fin = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([fin.regle, fin.geste, fin.poser, fin.retirer, fin.joue], [2, 'etiqueter', 'à-fusionner', ['à-relire'], true]);
  assert.deepEqual(fin.lignes.map((l) => [l.a, l.session, l.texte]), [['auteur', 'session_auteur', 'verdict écrit sur la PR 12 : validé'], ['conducteur', 'session_conducteur', 'verdict écrit sur la PR 12 : validé']]);
  assert.deepEqual(ecritures(d).slice(-2), ['POST issues/12/labels à-fusionner', 'DELETE issues/12/labels/à-relire'], 'la nouvelle avant l’ancienne');
  assert.deepEqual(d.etat().pulls[0].labels, ['à-fusionner']);
  const encore = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([encore.geste, encore.raison, encore.joue, encore.lignes], ['rien', 'etiquette-en-place', false, []]);
});

test('les étiquettes se comparent en NFC : `à-fusionner` décomposée est déjà posée (après le verdict, un passage rejoué), aucune pose, aucune ligne', () => {
  const d = monter();
  const sha = pr(d, { labels: ['a\u0300-relire', 'a\u0300-fusionner'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3]);
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'a\u0300-fusionner', created_at: minute(4) }] }] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.poser, g.lignes], ['etiqueter', 'à-fusionner', []]);
  assert.ok(!ecritures(d).some((e) => e.startsWith('POST')), 'rien de posé');
});

test('une étiquette déjà posée après la marque la plus récente (un passage rejoué) n’envoie aucune ligne : l’ancienne est retirée, sans redire le verdict', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-fusionner'] });
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) });
  p.evenements = [{ event: 'labeled', label: 'à-fusionner', created_at: minute(4) }];
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.poser, g.retirer, g.lignes], ['etiqueter', 'à-fusionner', ['à-relire'], []]);
  assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-relire']);
});

test('ticket 66 — sur un chemin sensible, un refus sans « /security-review: lancée » rend la PR à son auteur ; le couple de la session est celui des PR sensibles', () => {
  const d = monter();
  const sha = pr(d, { fichiers: { 'scripts/agent/garde.mjs': 'export const g = 1;\n' } });
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.geste, g.faits.sensible, g.faits.modele, g.faits.effort], ['distribuer', true, 'opus', 'xhigh']);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'refusé'), created_at: minute(3) });
  d.github({ pulls: [p] });
  const refus = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([refus.regle, refus.geste, refus.poser], [4, 'etiqueter', 'à-reprendre']);
  assert.deepEqual(d.etat().pulls[0].labels, ['à-reprendre']);
  // Un `validé` sans la ligne, lui, reste incomplet : la session est relancée, la distribution redite.
  const v = monter();
  const s2 = pr(v, { fichiers: { 'scripts/agent/garde.mjs': 'export const g = 2;\n' } });
  const q = v.etat().pulls[0];
  q.commentaires.push({ body: distribution(1, s2, ['session_rel1']), created_at: minute(2) }, { body: verdict(s2, 1, 'session_rel1', 'validé'), created_at: minute(3) });
  v.github({ pulls: [q] });
  assert.deepEqual(v.json(v.lancer('passe')).map((x) => [x.regle, x.geste, x.session]), [[5, 'reecrire', 'session_rel1']]);
  const r = distribuer(v, s2, 'opus/xhigh');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(v.json(r)[0].distribution, distribution(1, s2, ['session_rel1'], ' (relance session_rel1)'));
});

test('règle 5 : une session que le modèle lit morte est remplacée une fois, la distribution redite `(remplace …)` ; sans l’état, on attend', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) });
  d.github({ pulls: [p] });
  assert.equal(d.json(d.lancer('jouer', '12'))[0].raison, 'attente');
  const etats = join(d.racine, 'sessions.json');
  writeFileSync(etats, JSON.stringify({ session_rel1: 'morte' }));
  const g = d.json(d.lancer('jouer', '12', '--sessions', etats))[0];
  assert.deepEqual([g.geste, g.session, g.cause], ['remplacer', 'session_rel1', 'morte']);
  assert.equal(distribuer(d, sha, 'opus/medium', 'session_rel2').status, 3, 'sans l’état, la décision n’est plus « remplacer »');
  assert.equal(distribuer(d, sha, 'opus/medium', 'a', 'b', '--sessions', etats).status, 2, 'remplacer attend une seule session');
  assert.equal(distribuer(d, sha, 'opus/medium', 'session_rel1', '--sessions', etats).status, 2, 'la remplaçante n’est pas la session remplacée');
  const r = distribuer(d, sha, 'opus/medium', 'session_rel2', '--sessions', etats);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.json(r)[0].distribution, distribution(1, sha, ['session_rel2'], ' (remplace session_rel1)'));
  // Sans fichier : `--remplace` nomme la session hors service (A-180).
  const e = monter();
  const s2 = pr(e);
  ajouter(e, [distribution(1, s2, ['session_rel1']), 2]);
  const q = distribuer(e, s2, 'opus/medium', '--remplace', 'session_rel1', 'session_rel2');
  assert.equal(q.status, 0, q.stderr);
  assert.equal(e.json(q)[0].distribution, distribution(1, s2, ['session_rel2'], ' (remplace session_rel1)'));
});

test('le plafond : au troisième tour refusé, `à-reprendre`, puis le commentaire `Plafond — décision attendue` ; l’architecte prévenu', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  let m = 2;
  for (const tour of [1, 2, 3]) p.commentaires.push({ body: distribution(tour, sha, ['session_rel1']), created_at: minute(m++) }, { body: verdict(sha, tour, 'session_rel1', 'refusé'), created_at: minute(m++) });
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.joue], [1, 'plafonner', true]);
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur', 'architecte']);
  assert.deepEqual(ecritures(d), ['POST issues/12/labels à-reprendre', 'POST issues/12/comments', 'DELETE issues/12/labels/à-relire'], 'l’étiquette, puis le commentaire, puis le retrait (suite du ticket 66)');
  assert.equal(d.etat().pulls[0].commentaires.at(-1).body, 'Plafond — décision attendue');
  assert.equal(d.json(d.lancer('jouer', '12'))[0].geste, 'rien', 'rejoué : rien, aucune ligne de plus');
});

test('« même contenu propre » : une PR que le capitaine a mise à jour avec develop garde son verdict', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) });
  p.labels = ['à-fusionner'];
  d.github({ pulls: [p] });
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'jouet, develop avance\n');
  d.commit('docs: develop avance');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', 'feat/a');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  // Le tour validé vaut pour la tête, l'étiquette est en place : la note seule (`noter`, ticket 94), puis rien.
  const tete = d.git('rev-parse', 'HEAD').trim();
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.note?.tour, x.note?.sommet, x.note?.verdict]), [[2, 'noter', 1, sha, 'validé']]);
  const n = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([n.regle, n.geste, n.joue, n.lignes], [2, 'noter', true, []]);
  assert.deepEqual(ecritures(d), ['POST issues/12/comments'], 'la note seule, aucune étiquette');
  assert.match(d.etat().pulls[0].commentaires.at(-1).body, new RegExp(`^Même contenu — sommet ${tete} — tour 1 validé au sommet ${sha} — \\S`));
  assert.deepEqual(d.etat().pulls[0].labels, ['à-fusionner']);
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.raison]), [[2, 'rien', 'etiquette-en-place']]);
  // Un commit de l'auteur après le verdict : le contenu a changé, `à-reprendre` (r3).
  d.ecrire('src/a.mjs', 'export const a = 2;\n');
  d.commit('fix: a');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.poser]), [[3, 'etiqueter', 'à-reprendre']]);
});

// Ticket 94 : un tour refusé au sommet V, develop fusionné dans la branche (tête T, même contenu propre), `à-relire`
// reposée. Rend la PR montée, V et T.
function refusGarde() {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'jouet, develop avance\n');
  d.commit('docs: develop avance');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', 'feat/a');
  d.git('merge', '-q', '--no-edit', 'develop');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  const tete = d.git('rev-parse', 'HEAD').trim();
  ajouter(d, [DEMANDE(tete), 4]);
  return { d, sha, tete };
}
// La raison que rend le même calcul joué par le banc, dans le dossier du Relecteur (posé sur develop).
const raisonDuCalcul = (d, sommet, tete) => {
  const r = spawnSync('bash', ['scripts/chaine/meme-contenu.sh', sommet, tete, 'develop'], { cwd: d.dossier, env: d.env, encoding: 'utf8' });
  return r.stderr.split('\n').map((l) => l.trim()).filter(Boolean).at(-1);
};
const reposer = (d) => d.github({ pulls: [{ ...d.etat().pulls[0], labels: ['à-relire'] }] });

test('ticket 94 — un refus gardé (#17) : `à-reprendre`, puis la note de même contenu, puis le retrait de `à-relire` ; une seule note par tête et par tour', () => {
  const { d, sha, tete } = refusGarde();
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.poser, g.joue], [4, 'etiqueter', 'à-reprendre', true]);
  assert.deepEqual(g.lignes.map((l) => [l.a, l.texte]), [['auteur', 'verdict écrit sur la PR 12 : refusé'], ['conducteur', 'verdict écrit sur la PR 12 : refusé']]);
  assert.deepEqual(ecritures(d), ['POST issues/12/labels à-reprendre', 'POST issues/12/comments', 'DELETE issues/12/labels/à-relire']);
  const raison = raisonDuCalcul(d, sha, tete);
  assert.ok(raison, 'le calcul écrit sa raison');
  assert.equal(d.etat().pulls[0].commentaires.at(-1).body, `Même contenu — sommet ${tete} — tour 1 refusé au sommet ${sha} — ${raison}`, 'la raison à l’octet');
  // Le retrait perdu (la PR garde `à-relire` et `à-reprendre`), rejoué : l'étiquette est posée avant la note, mais la note
  // n'est pas une marque, la pose suit la marque la plus récente : aucune ligne ne repart, aucune seconde note.
  d.github({ pulls: [{ ...d.etat().pulls[0], labels: ['à-relire', 'à-reprendre'] }] });
  const perdu = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([perdu.geste, perdu.lignes, Object.hasOwn(perdu, 'note')], ['etiqueter', [], false]);
  assert.deepEqual(ecritures(d).slice(3), ['DELETE issues/12/labels/à-relire']);
  // `à-relire` reposée une deuxième fois : l'étiquette, aucune seconde note.
  reposer(d);
  const avant = d.journal().length;
  const encore = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([encore.regle, encore.geste, encore.poser], [4, 'etiqueter', 'à-reprendre']);
  assert.deepEqual(ecritures(d).slice(avant), ['POST issues/12/labels à-reprendre', 'DELETE issues/12/labels/à-relire']);
});

test('ticket 94 — la note refusée : la ligne JSON et ses lignes d’abord, puis la sortie 7, `à-relire` reste ; le refus levé, la note écrite sans renvoyer de ligne', () => {
  const { d, sha, tete } = refusGarde();
  d.github({ commentairesRefuses: '^Même contenu — ' });
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 7, r.stderr);
  const g = d.json(r)[0];
  assert.deepEqual([g.geste, g.joue], ['etiqueter', true]);
  assert.deepEqual(g.lignes.map((l) => [l.a, l.session, l.texte]), [['auteur', 'session_auteur', 'verdict écrit sur la PR 12 : refusé'], ['conducteur', 'session_conducteur', 'verdict écrit sur la PR 12 : refusé']]);
  assert.deepEqual(d.etat().pulls[0].labels, ['à-relire', 'à-reprendre']);
  d.github({ commentairesRefuses: false });
  const rejoue = d.lancer('jouer', '12');
  assert.equal(rejoue.status, 0, rejoue.stderr);
  const h = d.json(rejoue)[0];
  assert.deepEqual([h.geste, h.lignes], ['etiqueter', []], 'l’étiquette posée après la marque la plus récente : aucune ligne ne repart');
  assert.match(d.etat().pulls[0].commentaires.at(-1).body, new RegExp(`^Même contenu — sommet ${tete} — tour 1 refusé au sommet ${sha} — \\S`));
  assert.deepEqual(d.etat().pulls[0].labels, ['à-reprendre']);
});

test('ticket 94 — la raison manque (un calcul qui sort en 0 sans rien sur sa sortie d’erreur) : la note dit `sans raison écrite`', () => {
  const { d, sha, tete } = refusGarde();
  d.talon('meme-contenu.sh', '#!/usr/bin/env bash\necho même\nexit 0\n');
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.etat().pulls[0].commentaires.at(-1).body, `Même contenu — sommet ${tete} — tour 1 refusé au sommet ${sha} — sans raison écrite`);
});

test('une sous-PR vers un sujet : le diff propre est celui de `sujet.sh a-juger`, depuis le départ sur le sujet, pas tout ce que le sujet apporte à develop', () => {
  const d = monter();
  d.branche('sujet/demo', 'origin/develop', { 'scripts/agent/sujet.mjs': 'export const s = 1;\n' }, 'chore(sujet): demo');
  pr(d, { base: 'sujet/demo', depuis: 'sujet/demo', tete: 'feat/b', fichiers: { 'src/b.mjs': 'export const b = 1;\n' } });
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.base, g.geste, g.faits.sensible, g.faits.exiges], ['sujet/demo', 'distribuer', false, 1], 'le chemin sensible du sujet n’est pas dans le diff de la sous-PR');
  const e = monter();
  e.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  pr(e, { base: 'sujet/demo', depuis: 'sujet/demo', tete: 'feat/c', fichiers: { 'scripts/agent/c.mjs': 'export const c = 1;\n' } });
  assert.equal(e.json(e.lancer('passe'))[0].faits.sensible, true);
});

test('un diff propre qui ne se lit pas (la tête est introuvable) : sa cause tracée, l’architecte prévenu ; jamais une distribution', () => {
  const d = monter();
  pr(d);
  const p = d.etat().pulls[0];
  p.sha = '1'.repeat(40);
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.joue], ['illisible', true]);
  assert.match(d.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — tête introuvable : 1{40} /);
  assert.deepEqual(g.lignes.map((l) => l.a), ['architecte']);
});

test('la préparation : un clone superficiel est approfondi (A-126) ; un dossier pas propre, ou sans les calculs, sort en 6 sans rien lire', () => {
  const s = monter({ superficiel: true });
  pr(s);
  assert.equal(spawnSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: s.dossier, encoding: 'utf8' }).stdout.trim(), 'true');
  assert.deepEqual(s.json(s.lancer('passe')).map((g) => g.geste), ['distribuer']);
  assert.equal(spawnSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: s.dossier, encoding: 'utf8' }).stdout.trim(), 'false');
  writeFileSync(join(s.dossier, 'brouillon.txt'), 'x\n');
  const sale = s.lancer('passe');
  assert.deepEqual([sale.status, /pas propre/.test(sale.stderr)], [6, true]);
  const nu = monter({ contrat: null });
  execFileSync('git', ['rm', '-q', 'scripts/chaine/meme-contenu.sh'], { cwd: nu.travail, env: nu.env });
  nu.commit('chore: sans même contenu');
  nu.git('push', '-q', 'origin', 'HEAD:develop');
  execFileSync('git', ['pull', '-q', '--ff-only', 'origin', 'develop'], { cwd: nu.dossier, env: nu.env });
  const r = nu.lancer('passe');
  assert.deepEqual([r.status, /meme-contenu\.sh/.test(r.stderr)], [6, true]);
  assert.deepEqual(nu.journal(), []);
});

test('les dépendances de develop : installées quand son lockfile change, une seule fois pour un même lockfile', () => {
  const d = monter();
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  pr(d);
  const installations = () => (existsSync(join(d.racine, 'faux-gh/pnpm.log')) ? readFileSync(join(d.racine, 'faux-gh/pnpm.log'), 'utf8').split('\n').filter((l) => l.startsWith('pnpm install')).length : 0);
  // Le faux pnpm ne crée pas node_modules : le banc le pose, comme une installation réussie.
  assert.equal(d.lancer('passe').status, 0);
  assert.equal(installations(), 1);
  execFileSync('mkdir', ['-p', join(d.dossier, 'node_modules')]);
  writeFileSync(join(d.dossier, '.git/info/exclude'), 'node_modules\n');
  assert.equal(d.lancer('passe').status, 0);
  assert.equal(installations(), 1, 'même lockfile : rien de plus');
  assert.deepEqual(readFileSync(join(d.racine, 'faux-gh/pnpm.log'), 'utf8').split('\n').filter(Boolean), ['pnpm install --frozen-lockfile --prefer-offline'], 'jamais le lockfile récrit');
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n# une dépendance de plus\n');
  d.commit('chore: lockfile neuf');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  assert.equal(d.lancer('passe').status, 0);
  assert.equal(installations(), 2, 'un lockfile neuf : installé');
});

test('une installation en échec : sa sortie d’erreur au journal de la veille ; une sous-PR ordinaire vers un sujet, qu’`a-juger` juge sans dépendances, se distribue', () => {
  const d = monter();
  writeFileSync(join(d.racine, 'bin/pnpm'), '#!/bin/sh\ncat > /dev/null\necho "pnpm $*" >> "$FAUX_GH/pnpm.log"\necho "ERR_PNPM_FROZEN_LOCKFILE" >&2\nexit 1\n');
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  pr(d, { base: 'sujet/demo', depuis: 'sujet/demo', tete: 'feat/b', fichiers: { 'src/b.mjs': 'export const b = 1;\n' } });
  const r = d.lancer('veille', '--pause', '0', '--sondes', '1');
  assert.equal(r.stdout, 'VEILLE GESTE\nGESTE 12 distribuer règle 6\n', r.stderr);
  assert.match(r.stderr, /pnpm install en échec \(sortie 1\) :\nERR_PNPM_FROZEN_LOCKFILE/, 'la passe de la veille a installé : son erreur est au journal (A-180)');
});

test('la veille : un geste à jouer la réveille (`VEILLE GESTE`), `--taire` la fait passer, GitHub illisible est une pause, jamais une file vide ; 25 minutes par défaut', () => {
  assert.match(readFileSync(RELECTEUR, 'utf8'), /Number\(lireOption\('--duree', '25'\)\)/, 'sous les 30 minutes de l’outil Bash');
  const d = monter();
  pr(d);
  const r = d.lancer('veille', '--pause', '0', '--sondes', '2');
  assert.deepEqual([r.status, r.stdout], [0, 'VEILLE GESTE\nGESTE 12 distribuer règle 6\n'], r.stderr);
  assert.deepEqual(d.lancer('veille', '--pause', '0', '--sondes', '2', '--taire', '12').stdout, 'VEILLE FINIE\n');
  const attente = monter();
  pr(attente);
  assert.equal(distribuer(attente, attente.etat().pulls[0].sha ?? attente.git('rev-parse', 'origin/feat/a'), 'opus/medium', 'session_rel1').status, 0);
  assert.deepEqual(attente.lancer('veille', '--pause', '0', '--sondes', '2').stdout, 'VEILLE FINIE\n', 'une attente (règle 5, rien) ne réveille personne');
  d.github({ pannes: [{ route: '^pulls\\?', fois: 1 }] });
  const p = d.lancer('veille', '--pause', '0', '--sondes', '2');
  assert.match(p.stdout, /^PAUSE GitHub illisible : .*\nVEILLE GESTE\nGESTE 12 distribuer règle 6\n$/);
  writeFileSync(join(d.dossier, 'brouillon.txt'), 'x\n');
  const arret = d.lancer('veille', '--pause', '0', '--sondes', '2');
  assert.deepEqual([arret.status, /VEILLE ARRÊTÉE sortie 6\n$/.test(arret.stdout)], [6, true]);
});

test('une écriture refusée par GitHub sort en 7, et rien n’est retiré avant que la nouvelle étiquette soit posée', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) });
  d.github({ pulls: [p] });
  const bin = join(d.racine, 'bin');
  writeFileSync(join(bin, 'gh'), `#!/bin/sh\ncase "$*" in *"-X POST"*labels*) echo "gh: Forbidden (HTTP 403)" >&2; exit 1 ;; esac\nexec node ${JSON.stringify(join(CHAINE, 'sujet/scripts/faux-gh.mjs'))} "$@"\n`);
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 7, r.stderr);
  assert.deepEqual(d.etat().pulls[0].labels, ['à-relire']);
});

test('X1 — le sommet ou le couple ont changé entre la passe et la distribution : sortie 3, rien d’écrit', () => {
  const d = monter();
  const a = pr(d);
  assert.deepEqual(d.json(d.lancer('passe')).map((g) => [g.geste, g.sommet, g.faits.effort]), [['distribuer', a, 'medium']]);
  assert.equal(distribuer(d, a, 'opus/xhigh', 'session_rel1').status, 3, 'un couple que la PR ne demande pas');
  // L'auteur pousse un fichier sensible pendant que le modèle crée la session au couple ordinaire.
  d.git('switch', '-q', 'feat/a');
  d.ecrire('scripts/agent/garde.mjs', 'export const g = 1;\n');
  d.commit('feat: garde');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  const r = distribuer(d, a, 'opus/medium', 'session_rel1');
  assert.deepEqual([r.status, /le sommet est maintenant/.test(r.stderr)], [3, true]);
  assert.deepEqual(ecritures(d), []);
  const b = d.git('rev-parse', 'HEAD');
  assert.equal(distribuer(d, b, 'opus/medium', 'session_rel1').status, 3, 'la PR est devenue sensible : le couple a changé');
  assert.equal(distribuer(d, b, 'opus/xhigh', 'session_rel1').status, 0);
});

test('X3 — `depuis` : `Z` avec ou sans millisecondes, jamais `+00:00` ; `modele` : `opus` ou `sonnet`, jamais un identifiant daté', () => {
  for (const [relecture, geste] of [
    [{ depuis: '2026-11-20T09:00:00.000Z' }, 'distribuer'],
    [{ depuis: '2026-11-20T09:00:00.5Z' }, 'distribuer'],
    [{ depuis: '2026-11-20T09:00:00+00:00' }, 'contrat-illisible'],
    [{ depuis: '2026-13-45T09:00:00Z' }, 'contrat-illisible'],
    [{ depuis: '2026-11-20T09:00:00Z', ordinaire: { modele: 'sonnet', effort: 'high' } }, 'distribuer'],
    [{ depuis: '2026-11-20T09:00:00Z', ordinaire: { modele: 'claude-opus-4-1-20250805', effort: 'medium' } }, 'contrat-illisible'],
  ]) {
    const m = monter({ contrat: { relecture } });
    pr(m);
    assert.deepEqual(m.json(m.lancer('passe')).map((g) => g.geste), [geste], JSON.stringify(relecture));
  }
});

test('X5 — un fichier `--sessions` mal formé sort en 2, sa cause dite', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2]);
  const f = join(d.racine, 's.json');
  for (const [contenu, cause] of [['{"session_rel1":"vivant"}', /vaut « vivant »/], ['[]', /n'est pas un objet/], ['"morte"', /n'est pas un objet/], ['null', /n'est pas un objet/], ['{', /ne se lit pas en JSON/], ['{"a b":"morte"}', /n'est pas un identifiant/]]) {
    writeFileSync(f, contenu);
    const r = d.lancer('jouer', '12', '--sessions', f);
    assert.deepEqual([r.status, cause.test(r.stderr)], [2, true], `${contenu} : ${r.stderr}`);
  }
  assert.deepEqual(ecritures(d), []);
});

test('X7 — une PR fermée : `jouer` et `distribuer` sortent en 3, rien d’écrit', () => {
  const d = monter();
  const sha = pr(d);
  d.github({ pulls: [{ ...d.etat().pulls[0], state: 'closed' }] });
  const j = d.lancer('jouer', '12');
  assert.deepEqual([j.status, /fermée/.test(j.stderr)], [3, true]);
  assert.equal(distribuer(d, sha, 'opus/medium', 'session_rel1').status, 3);
  assert.deepEqual(ecritures(d), []);
});

test('X15 — les causes d’illisible, une à une : forme refusée par `a-juger` (à l’auteur), PR de fourche, dépendances de develop (à l’architecte) ; une fois signalée, rien', () => {
  // Une « PR de mise à jour » d'un sujet que `a-juger` refuse : deux fusions de develop.
  const mise = (d, { pnpmEnEchec = false } = {}) => {
    if (pnpmEnEchec) {
      writeFileSync(join(d.racine, 'bin/pnpm'), `#!/bin/sh\ncat > /dev/null\necho "pnpm $*" >> ${JSON.stringify(join(d.racine, 'faux-gh/pnpm.log'))}\necho "ERR_PNPM_FROZEN_LOCKFILE" >&2\nexit 1\n`);
      d.git('switch', '-q', 'develop');
      d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
      d.commit('chore: lockfile');
      d.git('push', '-q', 'origin', 'HEAD:develop');
    }
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
  };
  const d = monter();
  mise(d);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.equal(g.geste, 'illisible');
  assert.match(d.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — forme refusée par `sujet\.sh a-juger` : \S/);
  assert.doesNotMatch(d.etat().pulls[0].commentaires.at(-1).body, /: sortie \d+$/, 'le motif de `sujet.sh`, qu’il écrit sur sa sortie standard, pas un code');
  assert.deepEqual(g.lignes.map((l) => [l.a, l.session]), [['auteur', 'session_auteur']]);
  assert.deepEqual(d.json(d.lancer('jouer', '12')).map((x) => [x.geste, x.raison]), [['rien', 'illisible-signale']], 'signalée : rien');
  const f = monter();
  pr(f);
  f.github({ pulls: [{ ...f.etat().pulls[0], fourche: 'autre/jouet' }] });
  const h = f.json(f.lancer('jouer', '12'))[0];
  assert.match(f.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — PR de fourche : /);
  assert.deepEqual(h.lignes.map((l) => l.a), ['architecte']);
  const p = monter();
  mise(p, { pnpmEnEchec: true });
  const r = p.lancer('jouer', '12');
  assert.match(r.stderr, /pnpm install en échec \(sortie 1\) :\nERR_PNPM_FROZEN_LOCKFILE/, 'la sortie d’erreur de l’installation est écrite');
  assert.match(p.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — dépendances de develop : .* ; retentée au prochain lockfile de develop, ou par un Relecteur neuf$/, 'la cause dit comment l’installation se retente (suite du ticket 66)');
  assert.deepEqual(p.json(r)[0].lignes.map((l) => l.a), ['architecte']);
  const tentatives = () => readFileSync(join(p.racine, 'faux-gh/pnpm.log'), 'utf8').split('\n').filter((l) => l.startsWith('pnpm install')).length;
  assert.equal(tentatives(), 1);
  const suivante = p.lancer('passe');
  assert.equal(suivante.status, 0);
  assert.equal(tentatives(), 1, 'en échec, l’installation ne se retente qu’au prochain lockfile');
  assert.deepEqual(p.json(suivante).map((x) => [x.geste, x.raison]), [['rien', 'illisible-signale']], 'la même cause, signalée : jamais une forme refusée à l’auteur');
  // Une PR écrite sans session (`Session: —`) : la forme refusée va à l'architecte, jamais à personne.
  const s = monter();
  mise(s);
  const q = s.etat().pulls[0];
  q.commentaires[0].body = q.commentaires[0].body.replace('Session: session_auteur', 'Session: —');
  s.github({ pulls: [q] });
  assert.deepEqual(s.json(s.lancer('jouer', '12'))[0].lignes.map((l) => [l.a, l.session]), [['architecte', null]]);
});

test('les autres causes d’illisible : `a-juger` en échec, le diff vers develop en échec, une fourche supprimée ; une cause signalée se redit après `relecture.delai`', () => {
  const a = monter();
  a.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  a.talon('sujet.sh', '#!/usr/bin/env bash\necho "refs absentes : origin/sujet/demo introuvable, fetch d\'abord" >&2\nexit 11\n');
  pr(a, { base: 'sujet/demo', depuis: 'sujet/demo', tete: 'feat/b', fichiers: { 'src/b.mjs': 'export const b = 1;\n' } });
  const g = a.json(a.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.commentaire, g.lignes.map((l) => l.a)], ['illisible', "Lecture illisible — `sujet.sh a-juger` en échec (sortie 11) : refs absentes : origin/sujet/demo introuvable, fetch d'abord", ['architecte']]);
  // Une tête sans base commune avec develop : le diff à trois points ne se calcule pas.
  const o = monter();
  o.git('switch', '-q', '--orphan', 'feat/orpheline');
  o.ecrire('src/o.mjs', 'export const o = 1;\n');
  o.git('add', 'src/o.mjs');
  o.git('commit', '-q', '-m', 'feat: orpheline');
  o.git('push', '-q', 'origin', 'HEAD:refs/heads/feat/orpheline');
  const orpheline = o.git('rev-parse', 'HEAD');
  o.github({ pulls: [{ number: 12, title: 'feat: o', base: 'develop', head: 'feat/orpheline', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(orpheline), created_at: minute(1) }] }], maintenant: minute(30) });
  const h = o.json(o.lancer('jouer', '12'))[0];
  assert.deepEqual([h.geste, /^Lecture illisible — diff illisible : /.test(h.commentaire)], ['illisible', true], JSON.stringify(h));
  // Trois heures plus tard (le délai est de deux), la même cause se redit (A-116).
  const tard = { ...o.env, RELECTEUR_HORLOGE_BANC: String(DEBUT + 3 * 60 * 60_000) };
  assert.deepEqual(o.json(spawnSync(process.execPath, [RELECTEUR, 'passe'], { cwd: o.dossier, env: tard, encoding: 'utf8' })).map((x) => x.geste), ['illisible']);
  assert.deepEqual(o.json(o.lancer('passe')).map((x) => x.raison), ['illisible-signale'], 'avant le délai : rien');
  // Une fourche supprimée : GitHub rend `head.repo` nul.
  const f = monter();
  pr(f);
  Object.assign(f.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
  writeFileSync(join(f.racine, 'bin/gh'), '#!/bin/sh\nout=$(node "$BANC_FAUX_GH" "$@") || exit $?\nprintf \'%s\' "$out" | jq -c \'if type == "object" and has("head") then .head.repo = null else . end\'\n');
  assert.match(f.json(f.lancer('jouer', '12'))[0].commentaire, /^Lecture illisible — PR de fourche : /);
});

test('X16 — trois préparations en même temps dans le même dossier (la veille et deux gestes) : le verrou les fait passer l’une après l’autre', async () => {
  const d = monter();
  pr(d);
  for (let i = 0; i < 4; i++) {
    const r = await Promise.all([d.enFond('passe'), d.enFond('passe'), d.enFond('jouer', '12')]);
    assert.deepEqual(r.map((x) => x.status), [0, 0, 0], r.map((x) => x.stderr).join('\n'));
  }
});

test('X17 — aucun hook ne joue : un post-checkout qui récrit un fichier suivi ne salit pas le dossier', () => {
  const d = monter();
  d.git('switch', '-q', 'develop');
  d.ecrire('suivi.txt', '0\n');
  d.commit('chore: suivi');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  pr(d);
  const hooks = join(d.dossier, '.hooks');
  mkdirSync(hooks);
  writeFileSync(join(hooks, 'post-checkout'), '#!/bin/sh\ndate +%s%N > "$(git rev-parse --show-toplevel)/suivi.txt"\n');
  chmodSync(join(hooks, 'post-checkout'), 0o755);
  writeFileSync(join(d.dossier, '.git/info/exclude'), '.hooks\n');
  execFileSync('git', ['config', 'core.hooksPath', hooks], { cwd: d.dossier });
  assert.equal(d.lancer('passe').status, 0);
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'avance\n');
  d.commit('docs: avance');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  for (const k of [1, 2]) {
    const r = d.lancer('passe');
    assert.equal(r.status, 0, `passe ${k} : ${r.stderr}`);
  }
});

test('N1 à N4, N7 — les calculs en panne : chemins sensibles en échec, PR sensible ; « double relecture » ou « même contenu » illisible, tracés ; « exigée », deux sessions au couple sensible', () => {
  const s = monter();
  s.talon('chemins-sensibles.mjs', 'process.exit(2);\n');
  pr(s);
  assert.deepEqual(s.json(s.lancer('passe')).map((g) => [g.geste, g.faits.sensible, g.faits.effort]), [['distribuer', true, 'xhigh']], 'un contrôle de sécurité en panne : sensible');
  const q = monter();
  q.talon('double-relecture.mjs', 'console.log("illisible"); process.exit(21);\n');
  pr(q);
  const g = q.json(q.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.faits.exiges], ['illisible', 'illisible']);
  assert.match(q.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — « double relecture exigée » illisible/);
  const m = monter();
  m.talon('meme-contenu.sh', 'echo illisible; exit 21\n');
  const ancien = pr(m);
  ajouter(m, [distribution(1, ancien, ['session_rel1']), 2], [verdict(ancien, 1, 'session_rel1', 'validé'), 3]);
  m.git('switch', '-q', 'feat/a');
  m.ecrire('src/a.mjs', 'export const a = 2;\n');
  m.commit('fix: a');
  m.git('push', '-q', 'origin', 'HEAD:feat/a');
  const h = m.json(m.lancer('jouer', '12'))[0];
  assert.equal(h.geste, 'illisible', 'ni « même » (qui validerait) ni « différent » (qui redistribuerait)');
  assert.match(m.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — « même contenu propre » illisible/);
  const x = monter();
  x.talon('double-relecture.mjs', 'console.log("exigée"); process.exit(20);\n');
  pr(x);
  assert.deepEqual(x.json(x.lancer('passe')).map((y) => [y.geste, y.nombre, y.faits.exiges, y.faits.effort]), [['distribuer', 2, 2, 'xhigh']], 'une PR double : deux sessions au couple sensible');
  const sommet = x.git('rev-parse', 'origin/feat/a');
  assert.equal(distribuer(x, sommet, 'opus/xhigh', 'session_rel1', 'session_rel1').status, 2, 'deux fois la même session ne font pas deux relectures');
  assert.equal(distribuer(x, sommet, 'opus/xhigh', 'session_rel1', 'session_rel2').status, 0);
});

// Suite du lot 5 (A-192, point 1 ; ticket 75) : un calcul sorti en 69 dit qu'un outil manque au poste, pour toute PR.
test('suite du lot 5 — un calcul sorti en 69 (un outil de la chaîne manque au poste) : la passe et `jouer` sortent en 6, la cause dite, rien d’écrit, jamais une trace d’illisible ; la veille s’arrête', () => {
  const q = monter();
  q.talon('double-relecture.mjs', 'console.log("# illisible : scripts/docs/identifiants.mjs introuvable depuis scripts/chaine");\nconsole.log("illisible");\nprocess.exit(69);\n');
  pr(q);
  const p = q.lancer('passe');
  assert.equal(p.status, 6, p.stdout + p.stderr);
  assert.match(p.stderr, /^relecteur : double-relecture\.mjs : un outil de la chaîne manque au poste \(sortie 69\) : scripts\/docs\/identifiants\.mjs introuvable depuis scripts\/chaine$/m);
  const j = q.lancer('jouer', '12');
  assert.equal(j.status, 6, j.stdout + j.stderr);
  assert.deepEqual(ecritures(q), [], 'ni trace, ni étiquette : la PR n’y est pour rien');
  const v = q.lancer('veille', '--pause', '0', '--sondes', '1');
  assert.equal(v.status, 6, v.stdout + v.stderr);
  assert.match(v.stdout, /\nVEILLE ARRÊTÉE sortie 6\n$/);
  const m = monter();
  m.talon('meme-contenu.sh', 'echo illisible\necho "git ≥ 2.41 requis, ici 2.40" >&2\nexit 69\n');
  const ancien = pr(m);
  ajouter(m, [distribution(1, ancien, ['session_rel1']), 2], [verdict(ancien, 1, 'session_rel1', 'validé'), 3]);
  m.git('switch', '-q', 'feat/a');
  m.ecrire('src/a.mjs', 'export const a = 2;\n');
  m.commit('fix: a');
  m.git('push', '-q', 'origin', 'HEAD:feat/a');
  const h = m.lancer('jouer', '12');
  assert.equal(h.status, 6, h.stdout + h.stderr);
  assert.match(h.stderr, /^relecteur : meme-contenu\.sh : un outil de la chaîne manque au poste \(sortie 69\) : git ≥ 2\.41 requis, ici 2\.40$/m);
  assert.deepEqual(ecritures(m), []);
  // Une sortie 21 reste une lecture illisible, tracée sur la PR (N1 à N4) : seule la sortie 69 est une panne.
  const i = monter();
  i.talon('double-relecture.mjs', 'console.log("illisible"); process.exit(21);\n');
  pr(i);
  assert.equal(i.json(i.lancer('jouer', '12'))[0].geste, 'illisible');
});

// Contre-relecture de la PR 153 : sans `jq`, `github.sh` sort en 69 dès son chargement, avant tout calcul ; le Relecteur
// lisait chaque lecture de GitHub en 5, et la veille faisait une pause sans fin, sans une ligne (A-192 point 1, A-197).
test('suite du lot 5 — un poste sans `jq` : `github.sh` sorti en 69, la passe et `jouer` sortent en 6, rien d’écrit ; la veille s’arrête, jamais une pause sans fin', () => {
  const q = monter();
  pr(q);
  // Un PATH sans `jq` : chaque entrée des dossiers du PATH du banc en lien, dans leur ordre, sauf lui ; `node` lui-même
  // en lien, jamais son dossier, qui peut porter `jq` (`/usr/bin` d'un Node de distribution, `/opt/homebrew/bin`) ; les
  // autres outils restent où le poste les a (`flock` hors de `/usr/bin` et `/bin`, sous macOS).
  const sansJq = join(q.racine, 'sans-jq');
  mkdirSync(sansJq);
  symlinkSync(process.execPath, join(sansJq, 'node'));
  const vus = new Set(['jq', 'node']);
  const entrees = (dossier) => {
    try {
      return readdirSync(dossier);
    } catch {
      return [];
    }
  };
  for (const source of (process.env.PATH ?? '').split(':').filter((s) => s.startsWith('/')))
    for (const nom of entrees(source))
      if (!vus.has(nom)) {
        vus.add(nom);
        symlinkSync(join(source, nom), join(sansJq, nom));
      }
  q.env.PATH = `${join(q.racine, 'bin')}:${sansJq}`;
  assert.notEqual(spawnSync('sh', ['-c', 'command -v jq'], { env: q.env }).status, 0, 'jq absent du PATH du jouet');
  const p = q.lancer('passe');
  assert.equal(p.status, 6, p.stdout + p.stderr);
  assert.match(p.stderr, /^relecteur : github\.sh : un outil de la chaîne manque au poste \(sortie 69\) : ARRÊT : jq est requis par les scripts de la chaîne/m);
  assert.equal(q.lancer('jouer', '12').status, 6);
  const v = q.lancer('veille', '--pause', '0', '--sondes', '2');
  assert.doesNotMatch(v.stdout, /^PAUSE /m);
  assert.match(v.stdout, /\nVEILLE ARRÊTÉE sortie 6\n$/);
  assert.deepEqual(ecritures(q), []);
});

test('N9 — `completer` : une seconde session ajoutée au tour, `(complète)`', () => {
  const d = monter();
  d.talon('double-relecture.mjs', 'console.log("exigée"); process.exit(20);\n');
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.manque], ['completer', 1]);
  assert.equal(distribuer(d, sha, 'opus/xhigh', 'session_rel1').status, 2, 'une session déjà du tour');
  assert.equal(distribuer(d, sha, 'opus/xhigh', 'b', 'c').status, 2, 'une seule manque');
  assert.equal(distribuer(d, sha, 'opus/xhigh', 'b', 'b').status, 2, 'deux fois la même');
  const r = distribuer(d, sha, 'opus/xhigh', 'session_rel2');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.json(r)[0].distribution, distribution(1, sha, ['session_rel1', 'session_rel2'], ' (complète)'));
});

test('N10 — la reprise après arbitrage (règle 4) : un tour neuf aux mêmes sessions, `(après arbitrage, non compté)`', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3], ['Arbitrage — R3, src/a.mjs:1 — écarté — le cas est couvert ailleurs', 4]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.tour, g.preferees], [4, 'distribuer', 2, ['session_rel1']]);
  const r = distribuer(d, sha, 'opus/medium', 'session_rel1');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.json(r)[0].distribution, distribution(2, sha, ['session_rel1'], ' (après arbitrage, non compté)'));
});

// Un faux `gh` qui coupe en deux pages la réponse paginée des commentaires (`[a][b]`, ou `[a]` et `[b]` sur deux
// lignes). Son texte ne contient rien de variable (A-181) : le faux GitHub et le séparateur des pages lui viennent de
// l'environnement (`BANC_FAUX_GH`, `BANC_SEPARATEUR`).
const DEUX_PAGES = `#!/bin/sh
case "$*" in *--paginate*comments*) out=$(node "$BANC_FAUX_GH" "$@") || exit $?; printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",(c)=>(s+=c)).on("end",()=>{const a=JSON.parse(s);const h=Math.ceil(a.length/2);process.stdout.write(JSON.stringify(a.slice(0,h))+process.env.BANC_SEPARATEUR+JSON.stringify(a.slice(h))+"\\n")})'; exit 0 ;; esac
exec node "$BANC_FAUX_GH" "$@"
`;

test('N12 — deux pages de commentaires : la décision les lit toutes, le verdict de la seconde compte', () => {
  for (const separateur of ['', '\n']) {
    const d = monter();
    const sha = pr(d);
    ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3]);
    Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_SEPARATEUR: separateur });
    writeFileSync(join(d.racine, 'bin/gh'), DEUX_PAGES);
    assert.deepEqual(d.json(d.lancer('passe')).map((g) => [g.regle, g.poser]), [[2, 'à-fusionner']], JSON.stringify(separateur));
  }
});

test('N13 — la panne : une session remplacée, la remplaçante muette au-delà du délai : `Relecture en panne`, l’architecte, l’auteur et le conducteur prévenus', () => {
  const d = monter({ horloge: 4 * 60 });
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [distribution(1, sha, ['session_rel2'], ' (remplace session_rel1)'), 3]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.joue], [5, 'panne', true]);
  assert.deepEqual(g.lignes.map((l) => l.a), ['architecte', 'auteur', 'conducteur']);
  assert.equal(d.etat().pulls[0].commentaires.at(-1).body, 'Relecture en panne');
  assert.deepEqual(d.json(d.lancer('jouer', '12')).map((x) => [x.geste, x.raison]), [['rien', 'panne-signalee']]);
});

test('contre-relecture — la veille finit à sa durée : elle ne commence aucune pause qui finirait après, et s’arrête sans `--sondes`', () => {
  const d = monter();
  pr(d, { labels: [] });
  const t0 = Date.now();
  const r = d.lancer('veille', '--pause', '20', '--duree', '0.02');
  assert.deepEqual([r.status, r.stdout], [0, 'VEILLE FINIE\n'], r.stderr);
  assert.ok(Date.now() - t0 < 15_000, `une veille de 1,2 s, pause de 20 s : finie en ${Date.now() - t0} ms`);
  const sans = spawnSync(process.execPath, [RELECTEUR, 'veille', '--pause', '0', '--duree', '0.02'], { cwd: d.dossier, env: d.env, encoding: 'utf8', timeout: 30_000 });
  assert.deepEqual([sans.status, sans.stdout.split('\n').filter(Boolean).at(-1)], [0, 'VEILLE FINIE'], 'sans `--sondes`, la durée seule l’arrête');
});

test('contre-relecture — le plafond se dit à l’auteur, au conducteur et à l’architecte même quand `à-reprendre` est restée posée', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.joue, g.lignes.map((l) => l.a)], ['plafonner', true, ['auteur', 'conducteur', 'architecte']]);
  assert.deepEqual(ecritures(d), ['POST issues/12/comments', 'DELETE issues/12/labels/à-relire']);
  assert.deepEqual(d.json(d.lancer('jouer', '12')).map((x) => [x.geste, x.lignes]), [['rien', []]], 'rejoué : rien, aucune ligne de plus');
});

test('contre-relecture — les `GIT_CONFIG_*` de la session sont complétés, jamais remplacés : une réécriture d’URL tient', () => {
  const d = monter();
  pr(d);
  execFileSync('git', ['remote', 'set-url', 'origin', 'https://depot.invalid/jouet.git'], { cwd: d.dossier });
  Object.assign(d.env, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: `url.${d.origine}.insteadOf`, GIT_CONFIG_VALUE_0: 'https://depot.invalid/jouet.git' });
  const r = d.lancer('passe');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(d.json(r).map((g) => g.geste), ['distribuer']);
});

test('contre-relecture — aucun hook que git connaît ne joue, ni dans `.git/hooks` ni sous un `core.hooksPath` local, ni le fsmonitor, d’une passe à la distribution', () => {
  const d = monter();
  const NOMS = ['applypatch-msg', 'pre-applypatch', 'post-applypatch', 'pre-commit', 'pre-merge-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-rebase', 'post-checkout', 'post-merge', 'pre-push', 'pre-receive', 'update', 'proc-receive', 'post-receive', 'post-update', 'reference-transaction', 'push-to-checkout', 'pre-auto-gc', 'post-rewrite', 'sendemail-validate', 'fsmonitor-watchman', 'p4-changelist', 'p4-prepare-changelist', 'p4-post-changelist', 'p4-pre-submit', 'post-index-change'];
  const traces = join(d.racine, 'traces');
  mkdirSync(traces);
  Object.assign(d.env, { BANC_TRACES: traces });
  const TRACE = '#!/bin/sh\ntouch "$BANC_TRACES/$(basename "$0")"\n';
  for (const dossier of [join(d.dossier, '.git/hooks'), join(d.dossier, '.crochets')]) {
    mkdirSync(dossier, { recursive: true });
    for (const nom of NOMS) {
      writeFileSync(join(dossier, nom), TRACE);
      chmodSync(join(dossier, nom), 0o755);
    }
  }
  writeFileSync(join(d.dossier, '.git/info/exclude'), '.crochets\nnode_modules\n');
  execFileSync('git', ['config', 'core.hooksPath', join(d.dossier, '.crochets')], { cwd: d.dossier });
  writeFileSync(join(d.racine, 'fsmonitor'), TRACE);
  chmodSync(join(d.racine, 'fsmonitor'), 0o755);
  execFileSync('git', ['config', 'core.fsmonitor', join(d.racine, 'fsmonitor')], { cwd: d.dossier });
  // develop avance (le dossier change de commit) et porte un lockfile (une installation) ; une PR au verdict validé,
  // mise à jour avec develop (« même contenu »), une sous-PR vers un sujet (`a-juger`).
  const sha = d.branche('feat/a', 'origin/develop', { 'src/a.mjs': 'export const a = 1;\n' });
  d.branche('sujet/demo', 'origin/develop', { 'docs/demo.md': 'demo\n' }, 'chore(sujet): demo');
  const sous = d.branche('feat/b', 'origin/sujet/demo', { 'src/b.mjs': 'export const b = 1;\n' });
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
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
  const passe = d.lancer('passe');
  assert.deepEqual(d.json(passe).map((g) => [g.pr, g.geste]), [[12, 'etiqueter'], [13, 'distribuer']], passe.stderr);
  assert.equal(d.lancer('jouer', '12').status, 0);
  assert.equal(d.lancer('distribuer', '13', '--sommet', sous, '--couple', 'opus/medium', 'session_rel2').status, 0);
  assert.deepEqual(readdirSync(traces), [], 'aucun hook, aucun fsmonitor');
});

test('contre-relecture — un geste attend le verrou que tient une passe, sans le contourner', () => {
  const d = monter();
  pr(d);
  // Le verrou pris par un autre processus, qui le dit par une marque, puis le tient trois secondes.
  const marque = join(d.racine, 'verrou-pris');
  const tenu = spawn('flock', [join(d.dossier, '.git/relecteur.verrou'), 'sh', '-c', 'touch "$MARQUE"; exec sleep 3'], { env: { ...process.env, MARQUE: marque } });
  for (let k = 0; k < 200 && !existsSync(marque); k++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
  assert.ok(existsSync(marque), 'le verrou est pris');
  const t0 = Date.now();
  const r = d.lancer('jouer', '12');
  const attendu = Date.now() - t0;
  tenu.kill();
  assert.equal(r.status, 0, r.stderr);
  assert.ok(attendu >= 2000, `le geste a attendu le verrou : ${attendu} ms`);
});

test('contre-relecture — une PR de mise à jour qu’`a-juger` accepte : son diff propre est sa seconde liste, la résolution et les retouches', () => {
  const d = monter();
  d.branche('sujet/demo', 'origin/develop', { 'README.md': 'jouet, côté sujet\n' }, 'chore(sujet): demo');
  d.git('switch', '-q', 'develop');
  d.ecrire('README.md', 'jouet, côté develop\n');
  d.commit('docs: develop avance');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', '-C', 'maj/demo', 'origin/sujet/demo');
  // La fusion de develop est en conflit sur README.md, résolu dans la fusion ; une retouche touche un chemin sensible.
  assert.notEqual(spawnSync('git', ['merge', '-q', '--no-edit', 'develop'], { cwd: d.travail, env: d.env }).status, 0);
  d.ecrire('README.md', 'jouet, résolu\n');
  d.git('add', 'README.md');
  d.git('commit', '-q', '--no-edit');
  d.ecrire('scripts/agent/garde.mjs', 'export const g = 1;\n');
  d.commit('fix(chaine): la garde suit la résolution');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/maj/demo');
  const sha = d.git('rev-parse', 'HEAD');
  d.github({ pulls: [{ number: 12, title: 'chore(sujet): met demo à jour avec develop', base: 'sujet/demo', head: 'maj/demo', labels: ['à-relire'], created_at: minute(0), commentaires: [{ body: DEMANDE(sha), created_at: minute(1) }] }], maintenant: minute(30) });
  const [g] = d.json(d.lancer('passe'));
  assert.deepEqual([g.geste, g.faits?.sensible, g.faits?.effort], ['distribuer', true, 'xhigh'], JSON.stringify(g));
});

// --- Suite du ticket 66, ticket 67 : la veille, la préparation, la tête relue -----------------------------------------

test('suite 66 — R3 : une installation en échec dans une passe que GitHub fait ensuite sortir en 5 : son erreur au journal de la veille', () => {
  const d = monter();
  writeFileSync(join(d.racine, 'bin/pnpm'), '#!/bin/sh\ncat > /dev/null\necho "ERR_PNPM_PASSAGERE" >&2\nexit 1\n');
  d.git('switch', '-q', 'develop');
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  // GitHub ne répond pas à la liste des PR, une fois : la passe qui a installé sort en 5.
  d.github({ pulls: [], pannes: [{ route: '^pulls\\?', fois: 1 }] });
  const r = d.lancer('veille', '--pause', '0', '--sondes', '2');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^PAUSE GitHub illisible : /m);
  assert.match(r.stderr, /pnpm install en échec \(sortie 1\) :\nERR_PNPM_PASSAGERE/, 'le témoin dit « echec » : sans cette ligne, l’erreur ne serait écrite nulle part');
});

test('suite 66 — R5 : `veille --attendre` met une pause avant sa première passe, sous la même borne que les autres ; sans lui, la première passe part tout de suite', () => {
  const d = monter();
  pr(d);
  // Un `git` tué en plein travail a laissé son verrou : toute passe sort en 12.
  writeFileSync(join(d.dossier, '.git/index.lock'), '');
  const sans = d.lancer('veille', '--pause', '3', '--duree', '0.01');
  assert.deepEqual([sans.status, sans.stdout.trim().split('\n').at(-1)], [12, 'VEILLE ARRÊTÉE sortie 12']);
  const t0 = Date.now();
  const avec = d.lancer('veille', '--pause', '3', '--duree', '0.01', '--attendre');
  assert.deepEqual([avec.status, avec.stdout], [0, 'VEILLE FINIE\n'], 'une pause qui finirait après la durée ne commence pas, même la première : aucune passe');
  assert.ok(Date.now() - t0 < 2500, 'aucune pause jouée au-delà de la durée');
  execFileSync('rm', [join(d.dossier, '.git/index.lock')]);
  const t1 = Date.now();
  const geste = d.lancer('veille', '--pause', '1', '--sondes', '1', '--attendre');
  assert.deepEqual([geste.status, geste.stdout], [0, 'VEILLE GESTE\nGESTE 12 distribuer règle 6\n'], geste.stderr);
  assert.ok(Date.now() - t1 >= 1000, 'la première passe vient après une pause');
});

test('suite 66 — 18 : un push entre la préparation et la lecture de la PR : la tête est relue une fois, jamais dite introuvable pour rien', () => {
  const d = monter();
  pr(d);
  // Un commit neuf de la PR, poussé par le faux GitHub au moment où `jouer` lit la PR, après la préparation.
  d.git('switch', '-q', 'feat/a');
  d.ecrire('src/a.mjs', 'export const a = 2;\n');
  d.commit('fix: a');
  const neuf = d.git('rev-parse', 'HEAD');
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_TRAVAIL: d.travail });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *pulls/12*) if [ ! -e "$FAUX_GH/pousse-faite" ]; then touch "$FAUX_GH/pousse-faite"; git -C "$BANC_TRAVAIL" push -q origin HEAD:feat/a; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 0, r.stderr);
  const [g] = d.json(r);
  assert.deepEqual([g.tete, g.geste, g.regle], [neuf, 'distribuer', 6], JSON.stringify(g));
  assert.ok(!d.etat().pulls[0].commentaires.some((c) => /^Lecture illisible/.test(c.body ?? c)), 'aucune trace d’illisible');
});

// --- Suite du ticket 66, ticket 68 : une étiquette restée, un plafond à moitié écrit, une session à un autre couple ---

test('suite 66 — C11 : une étiquette restée d’un tour d’avant (posée avant le verdict) n’est pas un passage rejoué : le refus se dit à l’auteur et au conducteur ; à la même seconde, ou sans pose lue, aussi', () => {
  for (const [nom, evenements] of [
    ['posée avant le verdict', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(2) }]],
    ['posée à la seconde du verdict', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(3) }]],
    ['aucune pose lue', []],
    ['un retrait n’est pas une pose', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(2) }, { event: 'unlabeled', label: 'à-reprendre', created_at: minute(5) }]],
    ['la pose d’une autre étiquette ne compte pas', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(2) }, { event: 'labeled', label: 'à-autre', created_at: minute(5) }]],
  ]) {
    const d = monter();
    const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
    ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
    d.github({ pulls: [{ ...d.etat().pulls[0], evenements }] });
    const g = d.json(d.lancer('jouer', '12'))[0];
    assert.deepEqual([g.regle, g.geste, g.marque], [4, 'etiqueter', minute(3)], nom);
    assert.deepEqual(g.lignes.map((l) => [l.a, l.texte]), [['auteur', 'verdict écrit sur la PR 12 : refusé'], ['conducteur', 'verdict écrit sur la PR 12 : refusé']], nom);
    assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-relire'], `${nom} : rien de posé, l’ancienne retirée`);
  }
});

test('suite 66 — C11, A-183 point 6 : une marque plus récente que la pose (une demande refaite sans push) fait repartir les lignes', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  // Le tour refusé (minute 3), `à-reprendre` posée par le Relecteur après lui (minute 4), puis l'auteur redemande la
  // relecture du même sommet (minute 5) sans retirer `à-reprendre` : la marque la plus récente est sa demande.
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3], [DEMANDE(sha), 5]);
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'à-reprendre', created_at: minute(4) }] }] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.marque], [4, 'etiqueter', minute(5)], JSON.stringify(g));
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur'], 'posée avant la marque la plus récente : les lignes partent');
});

test('suite 66 — un passage rejoué (l’étiquette posée par lui, après le verdict, l’ancienne pas retirée) ne redit rien ; la dernière pose compte', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  // Un retrait refusé (et tu, comme `retirer_label` le fait) : la PR garde ses deux étiquettes.
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X DELETE"*labels*) echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const premier = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual(premier.lignes.map((l) => l.a), ['auteur', 'conducteur']);
  assert.deepEqual(d.etat().pulls[0].labels, ['à-relire', 'à-reprendre']);
  const rejoue = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([rejoue.geste, rejoue.poser, rejoue.lignes], ['etiqueter', 'à-reprendre', []], 'posée à la minute 30, après le verdict de la minute 3 : rien ne repart');
  // Posée une première fois avant le verdict, retirée, puis reposée après lui : la dernière pose compte.
  const e = monter();
  const s2 = pr(e, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(e, [distribution(1, s2, ['session_rel1']), 2], [verdict(s2, 1, 'session_rel1', 'refusé'), 3]);
  const evenements = [['labeled', 1], ['unlabeled', 2], ['labeled', 4]].map(([event, m]) => ({ event, label: 'à-reprendre', created_at: minute(m) }));
  e.github({ pulls: [{ ...e.etat().pulls[0], evenements }] });
  assert.deepEqual(e.json(e.lancer('jouer', '12'))[0].lignes, []);
});

test('suite 66 — C12 : un plafond à moitié écrit se rejoue entier : l’étiquette d’abord ; la pose ou le commentaire refusés, le rejeu prévient l’architecte, un seul commentaire', () => {
  for (const refus of ['-X POST*labels', '-X POST*comments']) {
    const d = monter();
    const sha = pr(d);
    let m = 2;
    for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
    // Un gh qui refuse une fois la première écriture de cette forme, puis laisse passer.
    Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_REFUS: refus });
    writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X POST"*) case "$BANC_REFUS:$*" in *labels:*labels*|*comments:*comments*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
    assert.equal(d.lancer('jouer', '12').status, 7, refus);
    const r = d.lancer('jouer', '12');
    assert.equal(r.status, 0, r.stderr);
    const g = d.json(r)[0];
    assert.deepEqual([g.geste, g.lignes.map((l) => l.a)], ['plafonner', ['auteur', 'conducteur', 'architecte']], refus);
    assert.equal(d.etat().pulls[0].commentaires.filter((c) => (c.body ?? c) === 'Plafond — décision attendue').length, 1, refus);
    assert.deepEqual(d.etat().pulls[0].labels, ['à-reprendre'], refus);
  }
});

test('suite 66 — A-182 (2) : une session que le modèle lit à un autre couple (`couple`) est remplacée, cause `couple`, au couple que la PR demande', () => {
  const d = monter();
  const sha = pr(d, { fichiers: { 'scripts/agent/garde.mjs': 'export const g = 1;\n' } });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2]);
  const etats = join(d.racine, 'sessions.json');
  writeFileSync(etats, JSON.stringify({ session_rel1: 'couple' }));
  const g = d.json(d.lancer('jouer', '12', '--sessions', etats))[0];
  assert.deepEqual([g.geste, g.session, g.cause, g.faits.modele, g.faits.effort], ['remplacer', 'session_rel1', 'couple', 'opus', 'xhigh']);
  const r = distribuer(d, sha, 'opus/xhigh', 'session_rel2', '--sessions', etats);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(d.json(r)[0].distribution, distribution(1, sha, ['session_rel2'], ' (remplace session_rel1)'));
});

// --- Contre-relecture de la PR 147, premier tour : la marque, sans marque, les lectures neuves en panne ou paginées ---

test('contre-relecture 147 — la marque est un commentaire à marque : un commentaire ordinaire écrit après la pose ne fait rien repartir au rejeu (A-183, point 6)', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  // Un retrait refusé (et tu) : la PR garde ses deux étiquettes, `à-reprendre` posée à la minute 30.
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X DELETE"*labels*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  assert.deepEqual(d.json(d.lancer('jouer', '12'))[0].lignes.map((l) => l.a), ['auteur', 'conducteur']);
  // Un humain écrit sur la PR après la pose, avant le rejeu : un commentaire sans marque n'est pas la marque.
  ajouter(d, ['Merci, je regarde le refus.', 31]);
  const rejoue = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([rejoue.geste, rejoue.marque, rejoue.lignes], ['etiqueter', minute(3), []], JSON.stringify(rejoue));
});

test('contre-relecture 147 — une étiquette à poser déjà là sur une PR sans aucune marque : dans le doute, les lignes partent (ticket 68, décision 1)', () => {
  const d = monter();
  // `à-fusionner` sans tour (règle 3) et `à-reprendre` déjà là, posée à la minute 20 ; aucun commentaire.
  pr(d, { labels: ['à-fusionner', 'à-reprendre'], commentaires: [] });
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'à-reprendre', created_at: minute(20) }] }] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.poser, g.marque], [3, 'etiqueter', 'à-reprendre', null], JSON.stringify(g));
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur']);
  assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-fusionner']);
});

test('contre-relecture 147 — les événements de la PR ne se lisent pas : `jouer` sort en 5 sans rien écrire, ni retrait ni pose ; au rejeu, les lignes partent', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  d.github({ pannes: [{ route: '^issues/12/events', fois: 1 }] });
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 5, r.stderr);
  assert.deepEqual(ecritures(d), [], 'rien d’écrit avant que les événements se lisent : un retrait fait ici perdrait les lignes');
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur']);
  assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-relire']);
});

test('contre-relecture 147 — la seconde lecture d’origin (la tête relue) en échec : `jouer` sort en 12, aucune tête dite introuvable (ticket 67, décision 4)', () => {
  const d = monter();
  pr(d);
  d.git('switch', '-q', 'feat/a');
  d.ecrire('src/a.mjs', 'export const a = 2;\n');
  d.commit('fix: a');
  // À la lecture de la PR, après la préparation : un commit neuf poussé sur la PR, puis origin du dossier injoignable, une fois.
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_TRAVAIL: d.travail, BANC_ORIGINE: d.origine });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *pulls/12*) if [ ! -e "$FAUX_GH/casse-faite" ]; then touch "$FAUX_GH/casse-faite"; git -C "$BANC_TRAVAIL" push -q origin HEAD:feat/a; node "$BANC_FAUX_GH" "$@"; s=$?; git config remote.origin.url "$BANC_ORIGINE.parti"; exit $s; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 12, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /^relecteur : git fetch -q --prune origin /m);
  assert.ok(!d.etat().pulls[0].commentaires.some((c) => /^Lecture illisible/.test(c.body ?? c)), 'aucune trace « tête introuvable »');
});

test('contre-relecture 147 — les événements sur deux pages, la dernière pose sur la seconde : toutes les pages se lisent, le passage rejoué ne redit rien', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  const evenements = [['labeled', 'à-reprendre', 1], ['unlabeled', 'à-reprendre', 2], ['labeled', 'à-reprendre', 4], ['labeled', 'à-relire', 4]].map(([event, label, m]) => ({ event, label, created_at: minute(m) }));
  d.github({ pulls: [{ ...d.etat().pulls[0], evenements }] });
  // Comme GitHub : sans `--paginate`, la première page seule ; avec, les deux, à la suite.
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *issues/12/events*) out=$(node "$BANC_FAUX_GH" "$@") || exit $?; case "$*" in *--paginate*) tout=1 ;; *) tout= ;; esac; printf \'%s\' "$out" | TOUT="$tout" node -e \'let s="";process.stdin.on("data",(c)=>(s+=c)).on("end",()=>{const a=JSON.parse(s);const h=Math.ceil(a.length/2);process.stdout.write(JSON.stringify(a.slice(0,h))+(process.env.TOUT?JSON.stringify(a.slice(h)):"")+"\\n")})\'; exit 0 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.poser, g.lignes], ['etiqueter', 'à-reprendre', []], JSON.stringify(g));
});

// --- Suites de la PR 147 (ticket 76) : l'usage entier, le plafond rejoué gardé et écrit, la marque sans les traces ---

test('suite de la PR 147 — l’usage nomme chaque option de chaque sous-commande, comme l’en-tête (`--sondes` compris)', () => {
  const r = spawnSync(process.execPath, [RELECTEUR], { encoding: 'utf8' });
  assert.equal(r.status, 2, r.stderr);
  const usage = r.stderr.replace(/\s+/g, ' ');
  const entete = readFileSync(RELECTEUR, 'utf8').split('\n// =====')[1];
  const appels = entete.split("//   node '<dossier du skill>/scripts/relecteur.mjs' ").slice(1).map((a) => a.split('\n//\n')[0].replace(/\n\/\/\s+/g, ' ').trim());
  assert.deepEqual(appels.map((a) => a.split(' ')[0]), ['passe', 'jouer', 'distribuer', 'veille'], 'les quatre appels de l’en-tête');
  for (const a of appels) assert.ok(usage.includes(a), `l’usage : « ${a} » attendu, comme l’en-tête`);
});

test('suite de la PR 147 — un plafond rejoué après un retrait refusé redit « décision de plafond attendue » à l’auteur et au conducteur (A-189, point 1) : son étiquette s’est posée avant son commentaire, la marque la plus récente', () => {
  const d = monter();
  const sha = pr(d);
  let m = 2;
  for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
  // Un retrait refusé une fois (un 502 passager), que `retirer_label` tait : la PR garde `à-relire` et `à-reprendre`.
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X DELETE"*labels*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const premier = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([premier.geste, premier.lignes.map((l) => l.a)], ['plafonner', ['auteur', 'conducteur', 'architecte']]);
  assert.deepEqual([...d.etat().pulls[0].labels].sort(), ['à-relire', 'à-reprendre'], 'le retrait refusé laisse les deux étiquettes');
  const r = d.lancer('jouer', '12');
  assert.equal(r.status, 0, r.stderr);
  const rejoue = d.json(r)[0];
  assert.deepEqual([rejoue.regle, rejoue.geste, rejoue.poser], [1, 'etiqueter', 'à-reprendre'], JSON.stringify(rejoue));
  assert.deepEqual(rejoue.lignes.map((l) => [l.a, l.session, l.texte]), [['auteur', 'session_auteur', 'PR 12 : décision de plafond attendue'], ['conducteur', 'session_conducteur', 'PR 12 : décision de plafond attendue']], 'redit, voulu : la marque la plus récente est le commentaire du plafond, posé après l’étiquette');
  assert.deepEqual(d.etat().pulls[0].labels, ['à-reprendre']);
  assert.equal(d.etat().pulls[0].commentaires.filter((c) => (c.body ?? c) === 'Plafond — décision attendue').length, 1, 'un seul commentaire du plafond');
});

test('suite de la PR 147 — une trace d’illisible écrite entre la pose et le rejeu n’est pas la marque (`dernier` l’exclut, A-183 point 6 ; K8, mutation N3) : rien ne repart', () => {
  const d = monter();
  const sha = pr(d);
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X DELETE"*labels*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  assert.deepEqual(d.json(d.lancer('jouer', '12'))[0].lignes.map((l) => l.a), ['auteur', 'conducteur']);
  // Un passage suivant a écrit une trace (un calcul en panne, revenu depuis) après la pose de la minute 30.
  ajouter(d, ['Lecture illisible — « double relecture exigée » illisible', 31]);
  const rejoue = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([rejoue.geste, rejoue.marque, rejoue.lignes], ['etiqueter', minute(3), []], JSON.stringify(rejoue));
});
