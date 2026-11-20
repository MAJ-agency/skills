// Banc du Relecteur (skill relecteur, lot 4) : `relecteur.mjs` joué comme la session le joue, dans une copie du
// dépôt jouet qui ne sert qu'à lui, avec les vrais scripts de la chaîne posés sur develop et le faux GitHub. Chaque
// cas monte son état, lance la sous-commande, et lit ce qu'elle écrit (sa ligne JSON) et ce qu'elle a fait sur
// GitHub (le journal du faux). Aucun réseau ; l'heure est posée (`RELECTEUR_HORLOGE_BANC`, `maintenant` du faux).
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

test('les étiquettes se comparent en NFC : `à-fusionner` décomposée est déjà posée, aucune pose, aucune ligne', () => {
  const d = monter();
  const sha = pr(d, { labels: ['a\u0300-relire', 'a\u0300-fusionner'] });
  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3]);
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.geste, g.poser, g.lignes], ['etiqueter', 'à-fusionner', []]);
  assert.ok(!ecritures(d).some((e) => e.startsWith('POST')), 'rien de posé');
});

test('une étiquette déjà posée avant le geste n’envoie aucune ligne : l’ancienne est retirée, sans redire le verdict', () => {
  const d = monter();
  const sha = pr(d, { labels: ['à-relire', 'à-fusionner'] });
  const p = d.etat().pulls[0];
  p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) });
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

test('le plafond : au troisième tour refusé, le commentaire `Plafond — décision attendue`, puis `à-reprendre` ; l’architecte prévenu', () => {
  const d = monter();
  const sha = pr(d);
  const p = d.etat().pulls[0];
  let m = 2;
  for (const tour of [1, 2, 3]) p.commentaires.push({ body: distribution(tour, sha, ['session_rel1']), created_at: minute(m++) }, { body: verdict(sha, tour, 'session_rel1', 'refusé'), created_at: minute(m++) });
  d.github({ pulls: [p] });
  const g = d.json(d.lancer('jouer', '12'))[0];
  assert.deepEqual([g.regle, g.geste, g.joue], [1, 'plafonner', true]);
  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur', 'architecte']);
  assert.deepEqual(ecritures(d), ['POST issues/12/comments', 'POST issues/12/labels à-reprendre', 'DELETE issues/12/labels/à-relire']);
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
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.raison]), [[2, 'rien', 'etiquette-en-place']]);
  // Un commit de l'auteur après le verdict : le contenu a changé, `à-reprendre` (r3).
  d.ecrire('src/a.mjs', 'export const a = 2;\n');
  d.commit('fix: a');
  d.git('push', '-q', 'origin', 'HEAD:feat/a');
  assert.deepEqual(d.json(d.lancer('passe')).map((x) => [x.regle, x.geste, x.poser]), [[3, 'etiqueter', 'à-reprendre']]);
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
  assert.match(p.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — dépendances de develop : /);
  assert.deepEqual(p.json(r)[0].lignes.map((l) => l.a), ['architecte']);
  const tentatives = () => readFileSync(join(p.racine, 'faux-gh/pnpm.log'), 'utf8').split('\n').filter((l) => l.startsWith('pnpm install')).length;
  assert.equal(tentatives(), 1);
  assert.equal(p.lancer('passe').status, 0);
  assert.equal(tentatives(), 1, 'en échec, l’installation ne se retente qu’au prochain lockfile');
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

test('N12 — deux pages de commentaires : la décision les lit toutes, le verdict de la seconde compte', () => {
  for (const separateur of ['', '\\n']) {
    const d = monter();
    const sha = pr(d);
    ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3]);
    const faux = join(CHAINE, 'sujet/scripts/faux-gh.mjs');
    writeFileSync(join(d.racine, 'bin/gh'), `#!/bin/sh\ncase "$*" in *--paginate*comments*) out=$(node ${JSON.stringify(faux)} "$@") || exit $?; printf '%s' "$out" | node -e 'let s="";process.stdin.on("data",(c)=>(s+=c)).on("end",()=>{const a=JSON.parse(s);const h=Math.ceil(a.length/2);process.stdout.write(JSON.stringify(a.slice(0,h))+"${separateur}"+JSON.stringify(a.slice(h))+"\\n")})'; exit 0 ;; esac\nexec node ${JSON.stringify(faux)} "$@"\n`);
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
