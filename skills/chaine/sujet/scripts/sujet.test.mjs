// `sujet.sh` sur le dépôt jouet partagé (depot-jouet.mjs) : garde-fous de `demarrer`,
// `ouvrir` sans protection de branche, `regrouper-series` et `livrer-prets`.
// GitHub est simulé par le faux `gh` du dépôt jouet ; aucun réseau.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depotJouet, script } from './depot-jouet.mjs';

const SCRIPT = script('sujet', 'sujet.sh');
const SPEC = 'docs/features/demo/all/ALL-DEM-1-demo.spec.md';
const ticket = (nn) => `docs/features/demo/all/issues/ALL-DEM-1-demo.${nn}.issue.md`;

const demarrer = (d, id) => d.lancer(SCRIPT, 'demarrer', id);

// Sujet ouvert, spec et deux tickets dessus, `.02` bloqué par `.01`.
function sujetAvecTickets(blocage = '01') {
  const d = depotJouet();
  d.ecrire(SPEC, '# ALL-DEM-1\n\n- **Sujet :** sujet/demo\n');
  d.ecrire(ticket('01'), '# .01\n\nStatus: ready-for-agent\nBlocked by: —\n');
  d.ecrire(ticket('02'), `# .02\n\nStatus: ready-for-agent\nBlocked by: ${blocage}\n`);
  d.commit('docs: specs');
  d.git('push', '-q', 'origin', 'HEAD:develop', 'HEAD:refs/heads/sujet/demo');
  d.git('switch', '-q', '-c', 'feat/all-dem-1-02-travail', 'origin/develop');
  return d;
}

test('demarrer refuse un ticket dont le Blocked by: n’est pas fait sur le sujet', () => {
  const d = sujetAvecTickets('01');
  const r = demarrer(d, 'ALL-DEM-1.02');
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /bloqué par ALL-DEM-1\.01, pas encore fait sur sujet\/demo/);
});

test('demarrer accepte le ticket une fois son bloquant fait sur le sujet', () => {
  const d = sujetAvecTickets('01');
  d.git('switch', '-q', '-c', 'tmp', 'origin/sujet/demo');
  d.ecrire(ticket('01'), '# .01\n\nStatus: Fait — PR #1\nBlocked by: —\n');
  d.commit('feat: .01');
  d.git('push', '-q', 'origin', 'HEAD:sujet/demo');
  d.git('switch', '-q', 'feat/all-dem-1-02-travail');
  const r = demarrer(d, 'ALL-DEM-1.02');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/demo$/m);
});

test('demarrer lit les identifiants complets et ignore les parenthèses', () => {
  const d = sujetAvecTickets('— (ALL-DEM-1.01 conseillé avant)');
  assert.equal(demarrer(d, 'ALL-DEM-1.02').status, 0);
  const e = sujetAvecTickets('ALL-DEM-1.01 (registre)');
  const r = demarrer(e, 'ALL-DEM-1.02');
  assert.equal(r.status, 4);
  assert.match(r.stdout, /bloqué par ALL-DEM-1\.01/);
});

test('demarrer signale une ligne Blocked by: qui ne cite aucun ticket, sans refuser', () => {
  const d = sujetAvecTickets('tous les tickets du sujet');
  const r = demarrer(d, 'ALL-DEM-1.02');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /ne cite aucun ticket/);
});

test('demarrer refuse quand la spec du ticket n’est pas encore sur le sujet', () => {
  const d = depotJouet();
  // Le sujet existe depuis avant la spec, entrée ensuite dans develop seulement.
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  d.ecrire(SPEC, '# ALL-DEM-1\n\nSujet: sujet/demo\n');
  d.ecrire(ticket('01'), '# .01\n\nStatus: ready-for-agent\nBlocked by: —\n');
  d.commit('docs: specs');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('switch', '-q', '-c', 'feat/all-dem-1-01-travail', 'origin/develop');
  const r = demarrer(d, 'ALL-DEM-1.01');
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /spec ALL-DEM-1 n'est pas encore sur sujet\/demo/);
  assert.match(r.stdout, /rafraichir demo/);
});

test('demarrer refuse un ticket dont la spec n’est que sur une branche de specs', () => {
  const d = depotJouet();
  d.git('switch', '-q', '-c', 'docs/demo-specs');
  d.ecrire(SPEC, '# ALL-DEM-1\n\nSujet: sujet/demo\n');
  d.ecrire(ticket('01'), '# .01\n\nStatus: ready-for-agent\nBlocked by: —\n');
  d.commit('docs: specs');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/docs/demo-specs');
  d.git('switch', '-q', '-c', 'feat/all-dem-1-01-travail');
  const r = demarrer(d, 'ALL-DEM-1.01');
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /ni sur develop ni sur un sujet/);
});

test('ouvrir crée le sujet par git push et ne tente aucun appel de protection', () => {
  const d = depotJouet();
  const r = d.lancer(SCRIPT, 'ouvrir', 'demo');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^sujet\/demo ouverte sur develop \([0-9a-f]+\)$/m);
  assert.doesNotMatch(r.stdout, /protég|admin/);
  assert.equal(
    d.git('ls-remote', '--heads', 'origin', 'sujet/demo').split('\t')[0],
    d.git('rev-parse', 'origin/develop'),
  );
  assert.deepEqual(d.journal(), [], 'aucune écriture GitHub, protection comprise');
});

// File du capitaine : une série de 3 PR (ALL-DEM-2), une pile de 2 (#5 ← #6), une série de 3 dont
// une prio:haute (ALL-DEM-3), une série de 3 dont une hors-sujet (ALL-DEM-4, il en reste 2).
function fileAvecSeries() {
  const d = depotJouet();
  const pr = (number, head, autres = {}) => ({
    number,
    title: `feat(demo): ${head}`,
    head,
    base: 'develop',
    labels: [],
    ...autres,
  });
  d.github({
    pulls: [
      pr(1, 'feat/all-dem-2-01-a'),
      pr(2, 'feat/all-dem-2-02-b'),
      pr(3, 'feat/all-dem-2-03-c'),
      pr(5, 'feat/racine'),
      pr(6, 'feat/etage', { base: 'feat/racine' }),
      pr(7, 'feat/all-dem-3-01-a'),
      pr(8, 'feat/all-dem-3-02-b', { labels: ['prio:haute'] }),
      pr(9, 'feat/all-dem-3-03-c'),
      pr(10, 'feat/all-dem-4-01-a'),
      pr(11, 'feat/all-dem-4-02-b'),
      pr(12, 'feat/all-dem-4-03-c', { labels: ['hors-sujet'] }),
    ],
  });
  return d;
}
const numeros = (liste) => liste.trim().split(' ').sort().join(' ');

test('regrouper-series --dry-run : série de 3 et pile de 2 annoncées, prio:haute et hors-sujet exclues, rien d’écrit', () => {
  const d = fileAvecSeries();
  const r = d.lancer(SCRIPT, 'regrouper-series', '--dry-run');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const lignes = r.stdout.trim().split('\n');
  assert.equal(lignes.length, 2, r.stdout);
  const [, cle, nom, prs] = lignes[0].match(
    /^série « (.+) » → sujet\/(\S+) : ([#0-9 ]+) \(--dry-run/,
  );
  assert.deepEqual([cle, nom, numeros(prs)], ['spec ALL-DEM-2', 'all-dem-2', '#1 #2 #3']);
  const [, cleP, nomP, prsP] = lignes[1].match(
    /^série « (.+) » → sujet\/(\S+) : ([#0-9 ]+) \(--dry-run/,
  );
  assert.deepEqual([cleP, nomP, numeros(prsP)], ['pile #5', 'pile-5', '#5 #6']);
  assert.deepEqual(d.journal(), []);
  assert.equal(d.git('ls-remote', '--heads', 'origin', 'sujet/*'), '', 'aucun sujet ouvert');
});

test('regrouper-series recible la série et la racine de la pile, puis s’arrête', () => {
  const d = fileAvecSeries();
  const r = d.lancer(SCRIPT, 'regrouper-series');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const bases = Object.fromEntries(d.etat().pulls.map((p) => [p.number, p.base]));
  assert.deepEqual(bases, {
    1: 'sujet/all-dem-2',
    2: 'sujet/all-dem-2',
    3: 'sujet/all-dem-2',
    5: 'sujet/pile-5',
    6: 'feat/racine',
    7: 'develop',
    8: 'develop',
    9: 'develop',
    10: 'develop',
    11: 'develop',
    12: 'develop',
  });
  const etiquetees = d
    .etat()
    .pulls.filter((p) => p.labels.includes('sujet-auto'))
    .map((p) => p.number);
  assert.deepEqual(etiquetees, [1, 2, 3, 5]);
  assert.match(
    d.git('ls-remote', '--heads', 'origin', 'sujet/*'),
    /sujet\/all-dem-2[\s\S]*sujet\/pile-5/,
  );
});

// Quatre sujets sans sous-PR ouverte : prêt (tickets déclarés et faits), sujet-manuel, un ticket
// sans PR (cas #575), ni tickets déclarés ni sujet-auto.
function sujetsALivrer() {
  const d = depotJouet();
  const spec = (n, nom) => ({
    [`docs/features/demo/all/ALL-DEM-${n}-demo.spec.md`]: `# ALL-DEM-${n}\n\nSujet: sujet/${nom}\n`,
  });
  const tk = (n, nn, statut) => ({
    [`docs/features/demo/all/issues/ALL-DEM-${n}-demo.${nn}.issue.md`]: `# .${nn}\n\nStatus: ${statut}\n`,
  });
  d.branche(
    'sujet/pret',
    'origin/develop',
    { ...spec(5, 'pret'), ...tk(5, '01', 'Fait — PR #60') },
    'feat(demo): pret (#60)',
  );
  d.branche(
    'sujet/manuel',
    'origin/develop',
    { ...spec(6, 'manuel'), ...tk(6, '01', 'Fait — PR #61') },
    'feat(demo): manuel (#61)',
  );
  d.branche(
    'sujet/inacheve',
    'origin/develop',
    { ...spec(7, 'inacheve'), ...tk(7, '01', 'Fait — PR #62'), ...tk(7, '02', 'ready-for-agent') },
    'feat(demo): inacheve (#62)',
  );
  d.branche(
    'sujet/libre',
    'origin/develop',
    { 'docs/libre.md': 'libre\n' },
    'fix(demo): libre (#63)',
  );
  const fermee = (number, base, labels = []) => ({
    number,
    title: `feat(demo): ${number}`,
    head: `feat/sous-${number}`,
    base,
    labels,
    state: 'closed',
    merged_at: '2026-10-19T00:00:00Z',
  });
  d.github({
    pulls: [
      fermee(60, 'sujet/pret'),
      fermee(61, 'sujet/manuel', ['sujet-manuel']),
      fermee(62, 'sujet/inacheve'),
      fermee(63, 'sujet/libre'),
    ],
  });
  d.git('switch', '-q', '--detach', 'origin/develop');
  return d;
}

test('livrer-prets --dry-run : seul le sujet prêt est annoncé, rien n’est ouvert', () => {
  const d = sujetsALivrer();
  const r = d.lancer(SCRIPT, 'livrer-prets', '--dry-run');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /^sujet\/pret prêt : livrerait « feat\(demo\): sujet pret — 1 sous-PR » \(--dry-run/m,
  );
  assert.match(r.stdout, /^sujet\/manuel prêt, mais label sujet-manuel/m);
  assert.match(
    r.stdout,
    /^sujet\/libre sans sous-PR ouverte, mais ni tickets déclarés ni sujet-auto/m,
  );
  assert.doesNotMatch(r.stdout, /inacheve/, 'un ticket sans PR : le sujet est « en cours »');
  assert.deepEqual(d.journal(), []);
  assert.match(d.lancer(SCRIPT, 'etat').stdout, /^inacheve\t1\t0\t—\tALL-DEM-7\.02 \ten cours$/m);
});

test('livrer-prets ouvre la PR du seul sujet prêt, étiquetée à-fusionner', () => {
  const d = sujetsALivrer();
  const r = d.lancer(SCRIPT, 'livrer-prets');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^PR #64 ouverte \(sujet\/pret → develop\), étiquetée à-fusionner$/m);
  assert.deepEqual(
    d.journal().map((e) => `${e.methode} ${e.route} ${e.champs.head ?? e.champs['labels[]']}`),
    ['POST pulls sujet/pret', 'POST issues/64/labels à-fusionner'],
  );
});

// Un préfixe à un seul segment (SOC-1) se lit comme ALL-DEM-1.
test('demarrer accepte un identifiant à un seul segment de préfixe', () => {
  const d = depotJouet();
  d.ecrire('docs/features/socle/SOC-1-socle.spec.md', '# SOC-1\n\nSujet: sujet/socle\n');
  d.ecrire('docs/features/socle/issues/SOC-1-socle.01.issue.md', '# .01\n\nStatus: ready-for-agent\n');
  d.commit('docs: specs');
  d.git('push', '-q', 'origin', 'HEAD:develop', 'HEAD:refs/heads/sujet/socle');
  d.git('switch', '-q', '-c', 'feat/soc-1-01-travail', 'origin/develop');
  const r = demarrer(d, 'SOC-1.01');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/socle$/m);
  assert.equal(d.lancer(SCRIPT, 'de', 'SOC-1.01').stdout.trim(), 'socle');
});
