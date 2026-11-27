import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { environnementDeBanc } from './environnement-de-banc.mjs';
import { plusGrandSurBranches } from './next-id-branches.mjs';

// Chaque dossier créé par le banc est retiré à la fin (A-258).
const DOSSIERS = [];
after(() => {
  for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true });
});

// Dépôt jouet : un `origin` nu local avec `develop`, un clone de travail, un PATH réduit à `git` et
// `node`. Écrit ici plutôt qu'importé : le socle pose ce banc sans la chaîne, donc sans le
// `depot-jouet.mjs` du skill `tickets`. Sans les GIT_* hérités : sous un hook git, ils visent le vrai dépôt.
const ENV = {
  ...environnementDeBanc(),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.org',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.org',
};
function depotJouet({ fichiers = {}, branches = [] } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'next-id-'));
  DOSSIERS.push(racine);
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  const git = (...args) => execFileSync('git', args, { cwd: travail, env: ENV, encoding: 'utf8' });
  execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origine], { env: ENV });
  execFileSync('git', ['clone', '-q', origine, travail], { env: ENV });
  writeFileSync(join(travail, 'README.md'), 'jouet\n');
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(travail, chemin)), { recursive: true });
    writeFileSync(join(travail, chemin), contenu);
  }
  git('add', '-A');
  git('commit', '-q', '-m', 'initial');
  git('push', '-q', 'origin', 'HEAD:develop');
  for (const b of branches) git('push', '-q', 'origin', `HEAD:refs/heads/${b}`);
  const bin = join(racine, 'bin');
  mkdirSync(bin);
  for (const outil of ['git', 'node']) symlinkSync(execFileSync('which', [outil], { encoding: 'utf8' }).trim(), join(bin, outil));
  // Faux `gh` : répond aux deux appels de `lirePrOuvertes` depuis `gh.json` du banc ; sort en 1 quand
  // ce fichier manque (gh indisponible). Sans `faux-gh.mjs` : le socle pose ce banc sans la chaîne.
  writeFileSync(
    join(bin, 'gh'),
    `#!/usr/bin/env node
import { readFileSync } from 'node:fs';
let d;
try { d = JSON.parse(readFileSync(process.env.FAUX_GH, 'utf8')); } catch { process.exit(1); }
const chemin = process.argv[4] ?? '';
const fichiers = /pulls\\/(\\d+)\\/files/.exec(chemin);
if (fichiers) {
  const pr = d.prs.find((p) => p.numero === Number(fichiers[1]));
  console.log((pr?.fichiers ?? []).map((f) => f.join('\\t')).join('\\n'));
} else {
  console.log(d.prs.map((p) => [p.numero, p.tete, p.brouillon ?? false, p.titre ?? 't'].join('\\t')).join('\\n'));
}
`,
    { mode: 0o755 },
  );
  const prOuvertes = (prs) => writeFileSync(join(racine, 'gh.json'), JSON.stringify({ prs }));
  // L'autre session : un second clone du même dépôt nu, qui pousse sans que `travail` le sache.
  const autre = join(racine, 'autre');
  const gitAutre = (...args) => execFileSync('git', args, { cwd: autre, env: ENV, encoding: 'utf8' });
  const autreSession = (branche, chemin, depart = 'develop') => {
    try {
      execFileSync('git', ['clone', '-q', origine, autre], { env: ENV, stdio: 'ignore' });
    } catch {
      // déjà cloné
    }
    gitAutre('fetch', '-q', 'origin');
    gitAutre('checkout', '-q', '-B', branche, `origin/${depart}`);
    mkdirSync(dirname(join(autre, chemin)), { recursive: true });
    writeFileSync(join(autre, chemin), '# x\n');
    gitAutre('add', '-A');
    gitAutre('commit', '-q', '-m', 'docs: x');
    gitAutre('push', '-q', 'origin', `HEAD:refs/heads/${branche}`);
  };
  return { racine, origine, travail, bin, git, prOuvertes, autreSession };
}

const SCRIPT = new URL('./next-id.mjs', import.meta.url).pathname;
const lancer = ({ travail, bin, racine }, ...args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { cwd: travail, env: { ...ENV, PATH: bin, PROJET_RACINE: travail, FAUX_GH: join(racine, 'gh.json') }, encoding: 'utf8' });
const prochain = (d, ...args) => {
  const r = lancer(d, ...args);
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};

const FICHIERS = {
  'docs/metier/regles/all/RULE_ALL_LIC-3.md': '---\nid: RULE_ALL_LIC-3\n---\n',
  'docs/metier/regles/all/RULE_ALL_LIC-1.md': '---\nid: RULE_ALL_LIC-1\n---\n',
  'docs/metier/regles/fnsmr/RULE_FNSMR_LIC-05.md': '---\nid: RULE_FNSMR_LIC-05\n---\n',
  'docs/features/licences/all/SPEC_ALL_LIC-12-licences.spec.md': '# Licences\n',
  'docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md': '# Socle\n',
  'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': '# x\n\nStatus: needs-triage\n',
  'docs/adr/ADR_ALL_ARC-1-identifiants-types-et-contextes.md': '# ADR_ALL_ARC-1\n',
  'docs/adr/web/ADR_ALL_WEB-1-client.md': '# ADR_ALL_WEB-1\n',
  'docs/demandes/all/REQ_ALL_LIC-7-licence-famille.md': '# Demande\n',
  // L'ancienne forme n'est lue par personne : elle ne réserve aucun numéro.
  'docs/adr/ARC-9-ancienne-forme.md': '# ARC-9\n',
  'docs/features/vieux/LIC-40-vieux.spec.md': '# LIC-40\n',
};

test('une règle sans slug et une spec à slug : RULE ALL LIC rend 4, SPEC ALL LIC rend 13', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.equal(prochain(d, 'RULE', 'ALL', 'LIC'), '4');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'LIC'), '13');
});

test('le numéro est unique par type, contexte et trigramme ; 05 se compte comme 5', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.equal(prochain(d, 'RULE', 'FNSMR', 'LIC'), '6');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'SOC'), '2');
  assert.equal(prochain(d, 'ADR', 'ALL', 'ARC'), '2', "l'ancienne forme ARC-9 ne compte pas");
  assert.equal(prochain(d, 'ADR', 'ALL', 'WEB'), '2');
  assert.equal(prochain(d, 'REQ', 'ALL', 'LIC'), '8');
  assert.equal(prochain(d, 'RULE', 'FFSA', 'LIC'), '1');
  assert.equal(prochain(d, 'DSG', 'ALL', 'DES'), '1');
  assert.equal(prochain(d, 'spec', 'all', 'soc'), '2', 'la casse des arguments est indifférente');
});

test('un dépôt sans docs/ commence à 1', () => {
  assert.equal(prochain(depotJouet(), 'SPEC', 'ALL', 'SOC'), '1');
});

test('une spec et une règle écrites sur une branche de sujet ou de cadrage non fusionnée comptent', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const ecrire = (branche, chemin) => {
    d.git('checkout', '-q', '-b', branche, 'origin/develop');
    mkdirSync(dirname(join(d.travail, chemin)), { recursive: true });
    writeFileSync(join(d.travail, chemin), '# x\n');
    d.git('add', '-A');
    d.git('commit', '-q', '-m', 'docs: x');
    d.git('push', '-q', 'origin', `HEAD:refs/heads/${branche}`);
  };
  ecrire('sujet/licences', 'docs/features/licences/all/SPEC_ALL_LIC-14-renouvellement.spec.md');
  ecrire('docs/regles-licences', 'docs/metier/regles/all/RULE_ALL_LIC-8.md');
  ecrire('feat/hors-champ', 'docs/metier/regles/all/RULE_ALL_LIC-99.md');
  d.git('checkout', '-q', 'develop');
  d.git('fetch', '-q', 'origin');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'LIC'), '15');
  assert.equal(prochain(d, 'RULE', 'ALL', 'LIC'), '9', 'sujet/* et docs/* seulement');
});

test("l'ancien usage et un type inconnu sont refusés, sortie 2", () => {
  const d = depotJouet({ fichiers: FICHIERS });
  for (const args of [[], ['SOC'], ['ALL', 'FOF'], ['ARC'], ['EPIC', 'ALL', 'SOC'], ['SPEC', 'ALL', 'SOCLE'], ['SPEC', 'ALL', 'SOC', '1'], ['SPEC_ALL_SOC']]) {
    const r = lancer(d, ...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /Usage : node scripts\/docs\/next-id\.mjs <TYPE> <CTX> <TRI>/);
  }
});

test('le numéro sort nu, sans couleur, même avec FORCE_COLOR=1', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = spawnSync(process.execPath, [SCRIPT, 'RULE', 'ALL', 'LIC'], {
    cwd: d.travail,
    env: { ...ENV, PATH: d.bin, PROJET_RACINE: d.travail, FORCE_COLOR: '1', NO_COLOR: undefined },
    encoding: 'utf8',
  });
  assert.equal(r.stdout, '4\n');
});

test('plusGrandSurBranches : git injecté, branche illisible ignorée', () => {
  const git = (args) => {
    if (args[0] === 'for-each-ref') return 'origin/sujet/a\norigin/docs/b\n';
    if (args[3] === 'origin/docs/b') throw new Error('illisible');
    return 'docs/metier/regles/all/RULE_ALL_LIC-7.md\ndocs/x/notes.md\n';
  };
  assert.equal(plusGrandSurBranches((nom) => (nom === 'RULE_ALL_LIC-7.md' ? 7 : null), git), 7);
  assert.equal(plusGrandSurBranches(() => null, () => { throw new Error('pas de git'); }), 0);
});

const SOC2 = { 'docs/features/socle/all/SPEC_ALL_SOC-2-x.spec.md': '# x\n' };
const specSur = (n) => `docs/features/y/all/SPEC_ALL_SOC-${n}-y.spec.md`;
const ticket = (spec, nn, dossier = 'issues') => `docs/features/y/all/${dossier}/SPEC_ALL_SOC-${spec}-y.${nn}.issue.md`;

test('une spec entrée dans develop après la dernière lecture compte : next-id fait un fetch et lit origin/develop', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.autreSession('develop', specSur(3));
  assert.equal(prochain(d, 'SPEC', 'ALL', 'SOC'), '4');
});

test('un sujet ouvert par une autre session après la dernière lecture compte', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.autreSession('sujet/y', specSur(7));
  assert.equal(prochain(d, 'SPEC', 'ALL', 'SOC'), '8');
});

test('une spec que seule une PR ouverte ajoute compte', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.prOuvertes([
    { numero: 12, tete: 'feat/z', brouillon: true, fichiers: [['added', specSur(5), '']] },
    { numero: 13, tete: 'feat/w', fichiers: [['removed', specSur(40), ''], ['renamed', specSur(41), specSur(42)]] },
  ]);
  const r = lancer(d, 'SPEC', 'ALL', 'SOC');
  assert.equal(r.stdout, '42\n', "un fichier retiré ne compte pas, l'ancien chemin d'un renommage non plus");
  d.prOuvertes([{ numero: 12, tete: 'feat/z', brouillon: true, fichiers: [['added', specSur(5), '']] }]);
  const r2 = lancer(d, 'SPEC', 'ALL', 'SOC');
  assert.equal(r2.stdout, '6\n');
  assert.doesNotMatch(r2.stderr, /non lues/, 'tout a été lu : rien à dire');
});

test('gh indisponible : le numéro sort, sortie 0, et la sortie d\'erreur dit comment lire les PR ouvertes par l\'outil GitHub MCP', () => {
  const d = depotJouet({ fichiers: SOC2 });
  const r = lancer(d, 'SPEC', 'ALL', 'SOC');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '3\n');
  assert.match(r.stderr, /PR ouvertes non lues \(gh indisponible\)/);
  assert.match(r.stderr, /list_pull_requests/);
  assert.match(r.stderr, /pull_request_read get_files/);
  assert.match(r.stderr, /Réserver aussitôt/);
});

test('tickets : next-id SPEC_ALL_SOC-4 rend le prochain index sur deux chiffres, lu dans l\'arbre, develop, les sujets, les PR ouvertes et l\'archive', () => {
  const d = depotJouet({ fichiers: { ...SOC2, [specSur(4)]: '# x\n', [ticket(4, '01')]: '# x\n' } });
  writeFileSync(join(d.travail, ticket(4, '03')), '# x\n');
  writeFileSync(join(d.travail, ticket(5, '20')), '# autre spec\n');
  writeFileSync(join(d.travail, ticket(40, '30')), '# autre spec, même préfixe\n');
  d.autreSession('sujet/y', ticket(4, '07'));
  d.autreSession('develop', ticket(4, '11', 'issues/archive'));
  d.prOuvertes([{ numero: 9, tete: 'feat/t', fichiers: [['added', ticket(4, '12'), '']] }]);
  assert.equal(prochain(d, 'SPEC_ALL_SOC-4'), '13');
  d.prOuvertes([]);
  assert.equal(prochain(d, 'SPEC_ALL_SOC-4'), '12', "sans la PR, l'index archivé sur develop (.11) est le plus grand");
  d.prOuvertes([{ numero: 9, tete: 'feat/t', fichiers: [['added', ticket(4, '12'), '']] }]);
  assert.equal(prochain(d, 'spec_all_soc-4'), '13', 'la casse est indifférente');
  assert.equal(prochain(d, 'SPEC_ALL_SOC-6'), '01', 'une spec sans ticket');
  assert.equal(prochain(d, 'SPEC_ALL_SOC-99'), '01', 'une spec introuvable : pas une erreur');
});

test('tickets : au-delà de 99, sortie 2 et le message de découpage', () => {
  const d = depotJouet({ fichiers: { [ticket(4, '99')]: '# x\n' } });
  const r = lancer(d, 'SPEC_ALL_SOC-4');
  assert.equal(r.status, 2);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /plus d'index libre dans SPEC_ALL_SOC-4 : découper une nouvelle spec/);
  assert.equal(prochain(d, 'SPEC_ALL_SOC-5'), '01');
});

test('fetch en échec : copies locales lues, numéro rendu, la sortie d\'erreur le dit', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.autreSession('sujet/y', specSur(7));
  d.git('fetch', '-q', 'origin');
  d.git('remote', 'set-url', 'origin', join(d.racine, 'absent.git'));
  const r = lancer(d, 'SPEC', 'ALL', 'SOC');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '8\n');
  assert.match(r.stderr, /fetch impossible : copies locales lues/);
});

test('dépôt sans develop : le fetch ne nomme pas develop, les sujets et les docs sont lus, le numéro sort', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.autreSession('develop', specSur(30));
  d.git('fetch', '-q', 'origin'); // la copie locale d'origin/develop porte la spec 30
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/main');
  d.autreSession('sujet/z', specSur(9), 'main');
  execFileSync('git', ['update-ref', '-d', 'refs/heads/develop'], { cwd: d.origine, env: ENV });
  const r = lancer(d, 'SPEC', 'ALL', 'SOC');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '10\n', "la copie d'origin/develop, disparue du distant, n'est plus lue");
  assert.doesNotMatch(r.stderr, /fetch impossible/);
});

test('un sujet supprimé du distant ne garde pas son numéro pris', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.autreSession('sujet/z', specSur(9));
  d.autreSession('autre/w', specSur(30));
  d.git('fetch', '-q', 'origin');
  assert.equal(prochain(d, 'SPEC', 'ALL', 'SOC'), '10');
  // supprimée dans le dépôt nu : le clone de travail garde son origin/sujet/z, seul `--prune` l'efface
  execFileSync('git', ['update-ref', '-d', 'refs/heads/sujet/z'], { cwd: d.origine, env: ENV });
  assert.equal(prochain(d, 'SPEC', 'ALL', 'SOC'), '3', 'sujet/z élagué : son numéro est libre');
  assert.ok(d.git('rev-parse', '--verify', 'refs/remotes/origin/autre/w').trim(), "autre/w n'est pas élagué");
});

test('un clone --single-branch : develop est fetché avec sa destination, origin/develop est à jour', () => {
  const d = depotJouet({ fichiers: SOC2 });
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/main');
  const mince = join(d.racine, 'mince');
  // sa configuration ne suit que main : sans destination, develop n'ira que dans FETCH_HEAD
  execFileSync('git', ['clone', '-q', '--single-branch', '-b', 'main', d.origine, mince], { env: ENV });
  d.autreSession('develop', specSur(3));
  const r = spawnSync(process.execPath, [SCRIPT, 'SPEC', 'ALL', 'SOC'], {
    cwd: mince,
    env: { ...ENV, PATH: d.bin, PROJET_RACINE: mince, FAUX_GH: join(d.racine, 'gh.json') },
    encoding: 'utf8',
  });
  assert.equal(r.stdout, '4\n', r.stderr);
});
