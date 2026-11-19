// Le faux `gh` du dépôt jouet doit se comporter comme l'API qu'il imite : une écriture acceptée
// n'est jamais perdue parce qu'un autre appel tournait en même temps. `boucle.sh` lance
// `file.sh | while …` : le producteur lit l'état pendant que le corps de boucle (renvoyer.sh) y écrit.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FAUX = join(dirname(fileURLToPath(import.meta.url)), 'faux-gh.mjs');

const appeler = (dossier, ...args) =>
  new Promise((resolve) => {
    const p = spawn('node', [FAUX, 'api', ...args], { env: { ...process.env, FAUX_GH: dossier, FAUX_GH_ORIGINE: dossier } });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, err }));
  });

test('faux gh : des appels concurrents, lectures comprises, ne perdent aucune écriture', async () => {
  const dossier = mkdtempSync(join(tmpdir(), 'faux-gh-'));
  const fichier = join(dossier, 'etat.json');
  writeFileSync(fichier, JSON.stringify({ pulls: [{ number: 1, title: 't', base: 'develop', head: 'x', labels: [] }], checks: {}, exiges: [] }));
  const N = 25;
  const appels = [];
  for (let i = 0; i < N; i++) {
    appels.push(appeler(dossier, '-X', 'POST', 'repos/{owner}/{repo}/issues/1/labels', '-f', `labels[]=l${i}`));
    appels.push(appeler(dossier, `repos/{owner}/{repo}/commits/${'a'.repeat(40)}/status`));
  }
  const rendus = await Promise.all(appels);
  for (const r of rendus) assert.equal(r.code, 0, r.err);
  const labels = JSON.parse(readFileSync(fichier, 'utf8')).pulls[0].labels;
  assert.deepEqual([...labels].sort(), Array.from({ length: N }, (_, i) => `l${i}`).sort());
});

// Le faux doit refuser et fusionner comme GitHub, sans quoi aucun banc ne montre une PR fusionnée en retard sur sa
// base (le défaut vécu sur `fedora` le 2026-11-18) : « strict », arbre de la fusion, checks par commit et en liste,
// cible qui bouge pendant la CI (`pendantCi`), fusion concurrente juste avant la nôtre (`avantFusion`).
const { depotJouet } = await import('./depot-jouet.mjs');
const { spawnSync } = await import('node:child_process');

const gh = (d, ...args) => spawnSync('gh', ['api', ...args], { cwd: d.travail, env: d.env, encoding: 'utf8' });
const fusionnerPr = (d, n, sha) =>
  spawnSync('gh', ['api', '-X', 'PUT', `repos/{owner}/{repo}/pulls/${n}/merge`, '--input', '-'], {
    cwd: d.travail,
    env: d.env,
    encoding: 'utf8',
    input: JSON.stringify({ merge_method: 'squash', sha, commit_title: `t (#${n})`, commit_message: '' }),
  });
const etatsLus = (d, sha) =>
  JSON.parse(gh(d, `repos/{owner}/{repo}/commits/${sha}/check-runs`).stdout).check_runs.map((c) =>
    `${c.name}=${c.conclusion ?? c.status}`,
  );

// develop reçoit `apps/a.ts` après le départ de `feat/x` (qui ajoute `docs/x.md`) : la PR #1 est en retard.
function enRetard({ conflit = false } = {}) {
  const d = depotJouet();
  const sommet = d.branche('feat/x', 'origin/develop', { 'docs/x.md': 'x\n' });
  const develop = d.branche('develop', 'origin/develop', conflit ? { 'docs/x.md': 'autre\n' } : { 'apps/a.ts': 'a\n' });
  d.git('switch', '-q', '--detach', 'origin/develop');
  d.github({ pulls: [{ number: 1, title: 't', head: 'feat/x', base: 'develop', labels: [] }] });
  return { d, sommet, develop };
}

test('faux gh, strict : une PR en retard sur une base stricte est refusée (405), comme GitHub', () => {
  const { d, sommet, develop } = enRetard();
  d.github({ strict: ['develop'] });
  const r = fusionnerPr(d, 1, sommet);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Head branch is not up to date with the base branch \(HTTP 405\)/);
  assert.equal(d.git('ls-remote', 'origin', 'refs/heads/develop').split('\t')[0], develop, 'develop intact');
});

test('faux gh, arbre de la fusion : le squash d’une PR en retard porte l’arbre de merge-tree, pas celui du sommet', () => {
  const { d, sommet } = enRetard();
  const r = fusionnerPr(d, 1, sommet);
  assert.equal(r.status, 0, r.stderr);
  const squash = JSON.parse(r.stdout).sha;
  d.git('fetch', '-q', 'origin');
  assert.equal(d.git('rev-parse', 'origin/develop'), squash, 'la réponse porte le sha du squash');
  assert.notEqual(d.git('rev-parse', `${squash}^{tree}`), d.git('rev-parse', `${sommet}^{tree}`));
  assert.equal(d.git('show', `${squash}:apps/a.ts`), 'a', 'le develop d’avant est gardé');
  assert.equal(d.git('show', `${squash}:docs/x.md`), 'x');
});

test('faux gh, arbre de la fusion : en conflit, 405 « not mergeable », rien n’est fusionné', () => {
  const { d, sommet, develop } = enRetard({ conflit: true });
  const r = fusionnerPr(d, 1, sommet);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Pull Request is not mergeable \(HTTP 405\)/);
  assert.equal(d.git('ls-remote', 'origin', 'refs/heads/develop').split('\t')[0], develop);
});

// `file.sh` lit `mergeable_state` pour dire une PR sans CI « prête (en conflit) » : GitHub ne le rend que sur la lecture
// d'une PR, jamais dans la liste, et rend `null` tant qu'il ne l'a pas calculé.
test('faux gh, mergeable_state : dirty en conflit avec la base, clean sinon, la clé de la PR prime, absent de la liste', () => {
  const lire = (d) => JSON.parse(gh(d, 'repos/{owner}/{repo}/pulls/1').stdout).mergeable_state;
  const enConflit = enRetard({ conflit: true }).d;
  assert.equal(lire(enConflit), 'dirty');
  const liste = JSON.parse(gh(enConflit, 'repos/{owner}/{repo}/pulls?state=open').stdout);
  assert.ok(liste.length === 1 && !('mergeable_state' in liste[0]), 'la liste ne porte pas la clé');
  assert.equal(lire(enRetard().d), 'clean');
  for (const valeur of [null, 'unknown']) {
    const { d } = enRetard({ conflit: true });
    const etat = d.etat();
    etat.pulls[0].mergeableState = valeur;
    d.github(etat);
    assert.equal(lire(d), valeur);
  }
});

test('faux gh, checks par commit : le sha prime sur #n, qui prime sur * ; une liste se consomme par sha', () => {
  const { d, sommet, develop } = enRetard();
  d.github({ checks: { '*': { q: ['IN_PROGRESS', 'SUCCESS'] }, '#1': { q: 'FAILURE' }, [develop]: { q: 'SUCCESS' } } });
  assert.deepEqual(etatsLus(d, develop), ['q=success'], 'clé du sha');
  assert.deepEqual(etatsLus(d, sommet), ['q=failure'], '#1 : la tête de la PR');
  d.github({ checks: { '*': { q: ['IN_PROGRESS', 'SUCCESS'] } } });
  const autre = d.branche('feat/y', 'origin/develop', { 'y.md': 'y\n' });
  const troisieme = d.branche('feat/z', 'origin/develop', { 'z.md': 'z\n' });
  assert.deepEqual(etatsLus(d, autre), ['q=in_progress'], 'premier élément à la première lecture de ce sha');
  assert.deepEqual(etatsLus(d, troisieme), ['q=in_progress'], 'un autre sha a son propre compte');
  assert.deepEqual(etatsLus(d, autre), ['q=success']);
  assert.deepEqual(etatsLus(d, autre), ['q=success'], 'le dernier une fois la liste épuisée');
  assert.equal(d.etat().lectures[autre], 3);
});

test('faux gh, pendantCi : la cible bouge à la n-ième lecture des checks depuis le déplacement précédent', () => {
  const { d, sommet, develop } = enRetard();
  const un = d.branche('ailleurs', 'origin/develop', { 'b.md': 'b\n' });
  const deux = d.branche('ailleurs', 'origin/ailleurs', { 'c.md': 'c\n' });
  d.github({ pendantCi: [{ lectures: 2, branche: 'develop', vers: un }, { lectures: 1, branche: 'develop', vers: deux }] });
  const tete = () => d.git('ls-remote', 'origin', 'refs/heads/develop').split('\t')[0];
  etatsLus(d, sommet);
  assert.equal(tete(), develop, 'première lecture : rien ne bouge');
  etatsLus(d, sommet);
  assert.equal(tete(), un, 'deuxième lecture : premier déplacement');
  etatsLus(d, sommet);
  assert.equal(tete(), deux, 'lecture suivante : second déplacement');
  assert.deepEqual(d.etat().pendantCi, []);
});

test('faux gh, avantFusion : une fusion concurrente entre juste avant la nôtre, puis le contrôle strict la voit', () => {
  const d = depotJouet();
  const sommet = d.branche('feat/x', 'origin/develop', { 'docs/x.md': 'x\n' });
  const concurrent = d.branche('concurrent', 'origin/develop', { 'apps/c.ts': 'c\n' });
  d.git('switch', '-q', '--detach', 'origin/develop');
  d.github({
    pulls: [{ number: 1, title: 't', head: 'feat/x', base: 'develop', labels: [] }],
    avantFusion: { branche: 'develop', vers: concurrent },
  });
  const r = fusionnerPr(d, 1, sommet);
  assert.equal(r.status, 0, r.stderr);
  const squash = JSON.parse(r.stdout).sha;
  d.git('fetch', '-q', 'origin');
  assert.equal(d.git('rev-parse', `${squash}^`), concurrent, 'le squash part de la fusion concurrente');
  assert.equal(d.etat().avantFusion, undefined, 'joué une fois, puis retiré');

  const strict = depotJouet();
  const s2 = strict.branche('feat/x', 'origin/develop', { 'docs/x.md': 'x\n' });
  const c2 = strict.branche('concurrent', 'origin/develop', { 'apps/c.ts': 'c\n' });
  strict.github({
    strict: ['develop'],
    pulls: [{ number: 1, title: 't', head: 'feat/x', base: 'develop', labels: [] }],
    avantFusion: { branche: 'develop', vers: c2 },
  });
  const x = fusionnerPr(strict, 1, s2);
  assert.equal(x.status, 1);
  assert.match(x.stderr, /not up to date/);
  assert.equal(strict.etat().avantFusion, undefined, 'un refus garde le déplacement joué');
});

// GitHub en panne (`pannes`) : sans lui, aucun banc ne montre un 502 lu comme un état (une file vide, « aucun check
// exigé », « CI non déclenchée »). Une lecture en panne répond la panne autant de fois que dit, puis normalement ;
// une écriture n'est jamais en panne.
test('faux gh, pannes : une route en panne deux fois répond la panne, puis normalement ; une écriture passe', () => {
  const d = depotJouet();
  d.github({
    pulls: [{ number: 1, title: 't', head: 'feat/x', base: 'develop', labels: [] }],
    pannes: [
      { route: '^pulls\\?', fois: 2, sortie: '' },
      { route: '^pulls/1$', fois: 2, sortie: '<html>502 Bad Gateway</html>', erreur: 'gh: Bad Gateway (HTTP 502)' },
      { route: '^user$', sortie: '{"message":"Server Error"}', erreur: 'gh: Server Error (HTTP 500)', code: 1 },
    ],
  });
  for (let i = 0; i < 2; i++) {
    const vide = gh(d, 'repos/{owner}/{repo}/pulls?state=open&per_page=100');
    assert.equal(vide.status, 1);
    assert.equal(vide.stdout, '');
    assert.match(vide.stderr, /Bad Gateway \(HTTP 502\)/);
    const html = gh(d, 'repos/{owner}/{repo}/pulls/1', '--jq', '.number');
    assert.equal(html.status, 1);
    assert.equal(html.stdout, '<html>502 Bad Gateway</html>', 'aucun filtre --jq sur une panne');
  }
  const message = gh(d, 'repos/{owner}/{repo}/user');
  assert.equal(message.status, 1);
  assert.equal(message.stdout, '{"message":"Server Error"}');
  assert.deepEqual(d.etat().pannes, [], 'chaque panne épuisée sort de l’état');
  assert.equal(gh(d, 'repos/{owner}/{repo}/pulls/1', '--jq', '.number').stdout, '1\n');
  assert.equal(JSON.parse(gh(d, 'repos/{owner}/{repo}/pulls?state=open').stdout).length, 1);

  d.github({ pannes: [{ route: 'labels', fois: 5 }] });
  const ecrit = gh(d, '-X', 'POST', 'repos/{owner}/{repo}/issues/1/labels', '-f', 'labels[]=x');
  assert.equal(ecrit.status, 0, ecrit.stderr);
  assert.deepEqual(d.etat().pulls[0].labels, ['x']);
  assert.equal(d.etat().pannes[0].fois, 5, 'une écriture ne décompte rien');
});

// Verrou du passage (ticket 4 de capitaine-a-jour-et-teste) : le capitaine pose, relit, édite et supprime un
// commentaire marqué ; le faux rend les ids, les dates et `author_association` comme GitHub.
const COMMENTAIRES = 'repos/{owner}/{repo}/issues/7/comments';
const jouetCommentaires = (commentaires = []) => {
  const d = depotJouet();
  d.github({ pulls: [{ number: 7, title: 't', base: 'develop', head: 'x', labels: ['à-fusionner'], commentaires }] });
  return d;
};
const lireCommentaires = (d) => JSON.parse(gh(d, COMMENTAIRES).stdout);

test('faux gh, commentaires : le POST rend l’id réel, created_at et author_association ; la lecture rend updated_at et author_association (OWNER par défaut, celle de l’objet sinon)', () => {
  const d = jouetCommentaires(['ancien', { body: 'dehors', auteur: 'passant', association: 'NONE', created_at: '2026-11-17T10:00:00Z', updated_at: '2026-11-17T10:30:00Z' }]);
  const r = gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=neuf');
  assert.equal(r.status, 0, r.stderr);
  const pose = JSON.parse(r.stdout);
  assert.equal(pose.id, 7003, 'numéro × 1000 + rang + 1');
  assert.equal(pose.created_at, '2026-11-17T12:00:02Z');
  assert.equal(pose.author_association, 'OWNER');
  const lus = lireCommentaires(d);
  assert.deepEqual(lus.map((c) => [c.id, c.author_association, c.updated_at]), [
    [7001, 'OWNER', '2026-11-17T12:00:00Z'],
    [7002, 'NONE', '2026-11-17T10:30:00Z'],
    [7003, 'OWNER', '2026-11-17T12:00:02Z'],
  ]);
  assert.equal(lus[1].user.login, 'passant');
});

test('faux gh, commentaires : PATCH réécrit le corps et avance updated_at, DELETE le retire de la lecture, les deux journalisés ; un id inconnu ou supprimé répond 404', () => {
  const d = jouetCommentaires(['premier', 'second']);
  const p = gh(d, '-X', 'PATCH', 'repos/{owner}/{repo}/issues/comments/7001', '-f', 'body=édité');
  assert.equal(p.status, 0, p.stderr);
  let lus = lireCommentaires(d);
  assert.equal(lus[0].body, 'édité');
  assert.equal(lus[0].created_at, '2026-11-17T12:00:00Z');
  assert.ok(lus[0].updated_at > lus[0].created_at, `updated_at ${lus[0].updated_at} après l’édition`);
  assert.equal(lus[1].updated_at, lus[1].created_at, 'un commentaire non édité garde updated_at = created_at');
  assert.equal(gh(d, '-X', 'DELETE', 'repos/{owner}/{repo}/issues/comments/7002').status, 0);
  lus = lireCommentaires(d);
  assert.deepEqual(lus.map((c) => c.id), [7001], 'le supprimé ne se lit plus, les ids restent');
  assert.deepEqual(d.journal().map((e) => `${e.methode} ${e.route}`), ['PATCH issues/comments/7001', 'DELETE issues/comments/7002']);
  assert.match(gh(d, '-X', 'PATCH', 'repos/{owner}/{repo}/issues/comments/7002', '-f', 'body=x').stderr, /HTTP 404/);
  assert.match(gh(d, '-X', 'DELETE', 'repos/{owner}/{repo}/issues/comments/7009').stderr, /HTTP 404/);
});

test('faux gh, concurrent : le commentaire de l’autre capitaine passe juste avant le prochain posé (id plus petit), une fois', () => {
  const d = jouetCommentaires();
  d.github({ concurrent: 'marque de l’autre' });
  const pose = JSON.parse(gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=le mien').stdout);
  assert.equal(pose.id, 7002);
  assert.deepEqual(lireCommentaires(d).map((c) => [c.id, c.body]), [[7001, 'marque de l’autre'], [7002, 'le mien']]);
  assert.equal(d.etat().concurrent, undefined, 'retiré une fois joué');
  gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=encore');
  assert.equal(lireCommentaires(d).length, 3, 'aucune seconde insertion');
});

test('faux gh, apresCommentaire : la PR qui reçoit le prochain commentaire change (fermée, label retiré), une fois', () => {
  const d = jouetCommentaires();
  d.github({ apresCommentaire: { state: 'closed', labels: [] } });
  assert.equal(gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=verrou').status, 0);
  const pr = JSON.parse(gh(d, 'repos/{owner}/{repo}/pulls/7').stdout);
  assert.equal(pr.state, 'closed');
  assert.deepEqual(pr.labels, []);
  assert.equal(d.etat().apresCommentaire, undefined, 'retirée une fois jouée');
});
