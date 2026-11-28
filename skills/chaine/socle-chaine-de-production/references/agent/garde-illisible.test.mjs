// Ticket 18 : une garde qui ne charge pas ses règles refuse et dit comment sortir. Chaque hook est copié dans un
// dossier `scripts/agent/` jouet avec ses modules, comme dans un projet ; puis `regles.mjs` ou `entree.mjs` y est
// cassé (tronqué, ou qui lève à son évaluation). Les gardes refusent (sortie 2) ; les hooks qui ne gardent rien
// (`apres-edition`, `fin-de-tour`, `demarrage`) disent la même chose et sortent en 0. Jamais une trace de pile.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

// Chaque dossier créé par le banc est retiré à la fin (A-258).
const DOSSIERS = [];
after(() => {
  for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true });
});

const HOOKS = ['garde-commandes.mjs', 'garde-fichiers.mjs', 'garde-github.mjs', 'apres-edition.mjs', 'fin-de-tour.mjs', 'demarrage.mjs'];
const MODULES = ['entree.mjs', 'regles.mjs'];
const source = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');

/** Les façons de casser un module : tronqué à mi-réécriture, ou qui lève au premier niveau. */
const CASSES = {
  tronque: (texte) => texte.slice(0, Math.floor(texte.length / 2)),
  leve: (texte) => `throw new Error('boum à l’évaluation');\n${texte}`,
  // Contre-relecture (B1) : des modules qui se chargent sans erreur de syntaxe, mais sans les exports que lisent les hooks.
  coupeAvantExport: (texte) => texte.slice(0, texte.indexOf('\nexport ') + 1),
  exportsRetires: (texte) => texte.replace(/^export (?=(async |function|const|let|class))/gm, ''),
  vide: () => '',
  // Un `await` de premier niveau qui ne se résout jamais : Node sort en 13, sans passer par `uncaughtException`.
  attendSansFin: (texte) => `await new Promise(() => {});\n${texte}`,
  coupeAvantDecisionCommande: (texte) => texte.slice(0, texte.indexOf('export function decisionCommande')),
  // Une fonction de décision qui lève à l'appel : le filet `uncaughtException` des gardes.
  leveALAppel: (texte) =>
    ['decisionCommande', 'refusEdition', 'decisionOutilGithub'].reduce(
      (t, nom) => `${t.replace(`export function ${nom}(`, `export function ${nom}Avant(`)}\nexport function ${nom}() { throw new Error('boum à l’appel'); }\n`,
      texte,
    ),
};

/** Un dépôt jouet qui porte `scripts/agent/` ; `casse` : `{ fichier, facon }`, ou rien pour un dossier sain. */
function jouet(casse) {
  const racine = mkdtempSync(join(tmpdir(), 'garde-illisible-'));
  DOSSIERS.push(racine);
  execFileSync('git', ['init', '-q', '-b', 'feat/x', racine]);
  const agent = join(racine, 'scripts/agent');
  mkdirSync(agent, { recursive: true });
  for (const f of [...HOOKS, ...MODULES]) writeFileSync(join(agent, f), source(f));
  if (casse) writeFileSync(join(agent, casse.fichier), CASSES[casse.facon](source(casse.fichier)));
  return racine;
}

/** Une entrée valide pour chaque hook. */
const entree = (racine, hook) =>
  ({
    'garde-commandes.mjs': { tool_input: { command: 'git status' } },
    'garde-fichiers.mjs': { tool_input: { file_path: join(racine, 'docs/a.md') } },
    'garde-github.mjs': { tool_name: 'mcp__github__push_files', tool_input: { owner: 'o', repo: 'r', branch: 'feat/x' } },
    'apres-edition.mjs': { tool_input: { file_path: join(racine, 'docs/a.md') } },
    'fin-de-tour.mjs': {},
    'demarrage.mjs': {},
  })[hook];

const lancer = (racine, hook, donnees = entree(racine, hook)) =>
  spawnSync(process.execPath, [join(racine, 'scripts/agent', hook)], {
    cwd: racine,
    input: JSON.stringify(donnees),
    // `CLAUDE_ENV_FILE` absent : `demarrage` n'écrit rien hors du jouet.
    env: { PATH: process.env.PATH, HOME: racine, CLAUDE_PROJECT_DIR: racine },
    encoding: 'utf8',
    timeout: 30_000,
  });

/** Le message de la garde illisible : le hook, le module, la restauration par un humain, une ligne, aucune trace. */
function ditCommentSortir(r, hook, fichier, contexte) {
  const message = r.stderr;
  assert.match(message, new RegExp(`^${hook.replace('.mjs', '')} : scripts/agent/${fichier.replace('.', '\\.')} ne se charge pas \\(`), contexte);
  // Une garde refuse ; un hook qui ne garde rien est sauté, il ne refuse rien lui-même.
  if (GARDES.includes(hook)) assert.ok(message.includes('tout outil est refusé tant qu'), `${contexte}\n${message}`);
  else assert.ok(message.includes('ce hook est sauté') && !message.includes('tout outil est refusé'), `${contexte}\n${message}`);
  assert.ok(message.includes('git checkout origin/develop -- scripts/agent/'), `${contexte} : la commande de restauration manque\n${message}`);
  assert.ok(message.includes('dernier commit où les gardes se chargent'), `${contexte} : le dernier commit sain manque\n${message}`);
  assert.ok(message.includes('jamais en contournant la garde'), `${contexte}\n${message}`);
  assert.doesNotMatch(message, /^\s+at /m, `${contexte} : trace de pile\n${message}`);
  assert.equal(message.trimEnd().split('\n').length, 1, `${contexte} : une seule ligne\n${message}`);
}

const GARDES = ['garde-commandes.mjs', 'garde-fichiers.mjs', 'garde-github.mjs'];
const SANS_GARDE = ['apres-edition.mjs', 'fin-de-tour.mjs'];

test('ticket 18 : regles.mjs tronqué : chaque garde refuse (sortie 2) et dit de faire restaurer scripts/agent/, sans trace de pile', () => {
  const racine = jouet({ fichier: 'regles.mjs', facon: 'tronque' });
  for (const hook of GARDES) {
    const r = lancer(racine, hook);
    assert.equal(r.status, 2, `${hook} : ${r.stderr}`);
    ditCommentSortir(r, hook, 'regles.mjs', hook);
  }
});

test('ticket 18 : regles.mjs qui lève à son évaluation, et entree.mjs cassé : même refus', () => {
  for (const casse of [
    { fichier: 'regles.mjs', facon: 'leve' },
    { fichier: 'entree.mjs', facon: 'tronque' },
    { fichier: 'entree.mjs', facon: 'leve' },
  ]) {
    const racine = jouet(casse);
    for (const hook of GARDES) {
      const contexte = `${hook}, ${casse.fichier} ${casse.facon}`;
      const r = lancer(racine, hook);
      assert.equal(r.status, 2, `${contexte} : ${r.stderr}`);
      ditCommentSortir(r, hook, casse.fichier, contexte);
      if (casse.facon === 'leve') assert.ok(r.stderr.includes('boum à l’évaluation'), contexte);
    }
  }
});

test('ticket 18 : apres-edition, fin-de-tour et demarrage sur un regles.mjs ou un entree.mjs cassé : le message, puis sortie 0', () => {
  for (const casse of [
    { fichier: 'regles.mjs', facon: 'tronque' },
    { fichier: 'regles.mjs', facon: 'leve' },
    { fichier: 'entree.mjs', facon: 'tronque' },
    { fichier: 'entree.mjs', facon: 'leve' },
  ]) {
    const racine = jouet(casse);
    // `demarrage` ne charge que `entree.mjs`.
    const hooks = casse.fichier === 'entree.mjs' ? [...SANS_GARDE, 'demarrage.mjs'] : SANS_GARDE;
    for (const hook of hooks) {
      const contexte = `${hook}, ${casse.fichier} ${casse.facon}`;
      const r = lancer(racine, hook);
      assert.equal(r.status, 0, `${contexte} : ${r.stderr}`);
      ditCommentSortir(r, hook, casse.fichier, contexte);
    }
  }
});

test('ticket 18 : regles.mjs sain : les gardes décident comme avant', () => {
  const racine = jouet();
  const cas = [
    ['garde-commandes.mjs', { tool_input: { command: 'git push --force origin feat/x' } }, 2],
    ['garde-commandes.mjs', { tool_input: { command: 'git commit --amend -m x' } }, 2],
    ['garde-commandes.mjs', { tool_input: { command: 'git status' } }, 0],
    ['garde-fichiers.mjs', { tool_input: { file_path: join(racine, 'pnpm-lock.yaml') } }, 2],
    ['garde-fichiers.mjs', { tool_input: { file_path: join(racine, 'docs/a.md') } }, 0],
    ['garde-github.mjs', { tool_name: 'mcp__github__push_files', tool_input: { owner: 'o', repo: 'r', branch: 'develop' } }, 2],
    ['garde-github.mjs', { tool_name: 'mcp__github__push_files', tool_input: { owner: 'o', repo: 'r', branch: 'feat/x' } }, 0],
  ];
  for (const [hook, donnees, attendu] of cas) {
    const r = lancer(racine, hook, donnees);
    const contexte = `${hook} ${JSON.stringify(donnees.tool_input)}`;
    assert.equal(r.status, attendu, `${contexte} : ${r.stderr}`);
    assert.doesNotMatch(r.stderr, /ne se charge pas/, contexte);
    if (attendu === 0) assert.equal(r.stderr, '', contexte);
  }
  // Les hooks qui ne gardent rien chargent leurs modules et ne disent rien du chargement.
  for (const hook of SANS_GARDE) {
    const r = lancer(racine, hook);
    assert.equal(r.status, 0, `${hook} : ${r.stderr}`);
    assert.doesNotMatch(r.stderr, /ne se charge pas/, hook);
  }
});

test('ticket 18 (contre-relecture B1) : un module qui se charge sans ses exports (coupé en fin de ligne avant un export, exports retirés, vide) : les gardes refusent (sortie 2), jamais 1', () => {
  for (const fichier of MODULES)
    for (const facon of ['coupeAvantExport', 'exportsRetires', 'vide']) {
      const racine = jouet({ fichier, facon });
      const casse = join(racine, 'scripts/agent', fichier);
      assert.equal(spawnSync(process.execPath, ['--check', casse]).status, 0, `${fichier} ${facon} : sans erreur de syntaxe`);
      for (const hook of GARDES) {
        const contexte = `${hook}, ${fichier} ${facon}`;
        const r = lancer(racine, hook);
        assert.equal(r.status, 2, `${contexte} : ${r.stderr}`);
        ditCommentSortir(r, hook, fichier, contexte);
        assert.match(r.stderr, /export \w+ absent/, contexte);
      }
      const sansGarde = fichier === 'entree.mjs' ? [...SANS_GARDE, 'demarrage.mjs'] : SANS_GARDE;
      for (const hook of sansGarde) {
        const contexte = `${hook}, ${fichier} ${facon}`;
        const r = lancer(racine, hook);
        assert.equal(r.status, 0, `${contexte} : ${r.stderr}`);
        ditCommentSortir(r, hook, fichier, contexte);
      }
    }
  // Le cas rejoué par la contre-relecture : regles.mjs coupé juste avant `export function decisionCommande`.
  const racine = jouet({ fichier: 'regles.mjs', facon: 'coupeAvantDecisionCommande' });
  for (const command of ['git push --force origin develop', 'git commit --amend -m x', 'git commit --no-verify -m x', 'git status']) {
    const r = lancer(racine, 'garde-commandes.mjs', { tool_input: { command } });
    assert.equal(r.status, 2, `${command} : ${r.stderr}`);
    ditCommentSortir(r, 'garde-commandes.mjs', 'regles.mjs', command);
  }
});

test('ticket 18 (contre-relecture B1) : une erreur inattendue dans une garde la fait refuser (sortie 2), jamais 1, sans trace de pile', () => {
  const racine = jouet({ fichier: 'regles.mjs', facon: 'leveALAppel' });
  assert.equal(spawnSync(process.execPath, ['--check', join(racine, 'scripts/agent/regles.mjs')]).status, 0);
  for (const hook of GARDES) {
    const r = lancer(racine, hook);
    assert.equal(r.status, 2, `${hook} : ${r.stderr}`);
    assert.match(r.stderr, new RegExp(`^${hook.replace('.mjs', '')} : erreur inattendue \\(boum à l’appel\\) : tout outil est refusé`), hook);
    assert.ok(r.stderr.includes('git checkout origin/develop -- scripts/agent/'), hook);
    assert.doesNotMatch(r.stderr, /^\s+at /m, `${hook} : trace de pile\n${r.stderr}`);
    assert.equal(r.stderr.trimEnd().split('\n').length, 1, hook);
  }
});

test('ticket 18 (contre-relecture) : un module dont l’await de premier niveau ne se résout jamais : les gardes refusent (sortie 2), jamais 13', () => {
  for (const fichier of MODULES) {
    const racine = jouet({ fichier, facon: 'attendSansFin' });
    for (const hook of GARDES) {
      const r = lancer(racine, hook);
      assert.equal(r.status, 2, `${hook}, ${fichier} : ${r.stderr}`);
      assert.match(r.stderr, new RegExp(`${hook.replace('.mjs', '')} : sortie 13 inattendue .*tout outil est refusé`), hook);
      assert.ok(r.stderr.includes('git checkout origin/develop -- scripts/agent/'), hook);
    }
  }
});
