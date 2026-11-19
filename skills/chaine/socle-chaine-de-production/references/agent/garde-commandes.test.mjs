// Le hook garde-commandes sur un dépôt jouet : la ligne `Dépendances:` du ticket ne compte que lue
// sur `origin/sujet/*`. Les hooks sont copiés dans un dossier `scripts/` jouet, avec
// `scripts/docs/identifiants.mjs` (skill `socle-monorepo`), comme dans un projet ; CLAUDE_PROJECT_DIR
// désigne le clone de travail.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Posé dans un projet, scripts/docs/ est à côté de scripts/agent/ ; dans le plugin, le dépôt jouet est
// dans le skill tickets et la grammaire dans le skill socle-monorepo.
const PROJET = existsSync(new URL('../docs/identifiants.mjs', import.meta.url));
const DOCS = PROJET ? new URL('../docs/', import.meta.url) : new URL('../../../tickets/references/scripts/docs/', import.meta.url);
const GRAMMAIRE = PROJET ? new URL('../docs/identifiants.mjs', import.meta.url) : new URL('../../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs', import.meta.url);
const { ENV, depotJouet } = await import(new URL('depot-jouet.mjs', DOCS).href);

const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (dependances) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${dependances}\n\n## Le besoin\n\nx\n`;

/** Dépôt jouet : le ticket sur develop sans ligne, `origin/sujet/demo` le porte avec `ligneSujet`. */
function depot(ligneSujet, { avecIdentifiants = true, chemin = TICKET, branche = 'feat/spec-all-demo-1-01-carte', copies = {} } = {}) {
  const d = depotJouet({ fichiers: { [chemin]: ticket('Modèle: sonnet') } });
  writeFileSync(join(d.travail, chemin), ticket(ligneSujet));
  for (const [autre, ligne] of Object.entries(copies)) {
    mkdirSync(join(d.travail, autre, '..'), { recursive: true });
    writeFileSync(join(d.travail, autre), ticket(ligne));
    d.git('add', autre);
  }
  d.git('commit', '-q', '--allow-empty', '-am', 'dépendances');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  d.git('checkout', '-q', '-b', branche, 'origin/develop');
  const outils = join(d.racine, 'outils/scripts');
  mkdirSync(join(outils, 'agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-commandes.mjs']) copyFileSync(new URL(f, import.meta.url), join(outils, 'agent', f));
  if (avecIdentifiants) {
    mkdirSync(join(outils, 'docs'), { recursive: true });
    copyFileSync(GRAMMAIRE, join(outils, 'docs/identifiants.mjs'));
  }
  return { ...d, script: join(outils, 'agent/garde-commandes.mjs') };
}

const lancer = ({ travail, bin, script }, command) =>
  spawnSync(process.execPath, [script], {
    cwd: travail,
    env: { ...ENV, PATH: bin, CLAUDE_PROJECT_DIR: travail },
    input: JSON.stringify({ tool_input: { command } }),
    encoding: 'utf8',
  });
/** La commande est refusée : code 2, la raison sur la sortie d'erreur. */
const refuse = (r, message) => {
  assert.equal(r.status, 2, message ?? r.stdout);
  assert.notEqual(r.stderr.trim(), '', message);
};
/** La commande passe : code 0, rien sur la sortie d'erreur. */
const passe = (r, message) => {
  assert.equal(r.status, 0, message ?? r.stderr);
  assert.equal(r.stderr, '', message);
};

test('ticket du sujet avec Dépendances: `leaflet` → pnpm add leaflet passe, zod est refusé', () => {
  const d = depot('Dépendances: `leaflet`');
  passe(lancer(d, 'pnpm add leaflet@1.9.4'));
  refuse(lancer(d, 'pnpm add leaflet zod'));
});

test('ticket rangé hors de docs/features/ avec Dépendances: `leaflet` sur le sujet → pnpm add leaflet passe', () => {
  const d = depot('Dépendances: `leaflet`', {
    chemin: 'docs/infrastructure/all/issues/SPEC_ALL_INF-1-hebergement.01.issue.md',
    branche: 'feat/spec-all-inf-1-01-mesure',
  });
  passe(lancer(d, 'pnpm add leaflet@1.9.4'));
  refuse(lancer(d, 'pnpm add leaflet zod'));
});

test('ticket seul sous un dossier au nom accentué : son paquet prévu passe', () => {
  const d = depot('Dépendances: `leaflet`', { chemin: 'docs/sécurité/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md' });
  passe(lancer(d, 'pnpm add leaflet@1.9.4'));
});

test('deux copies du ticket, la stricte sous un dossier accentué, la large sous docs/features/ : l’intersection, zod refusé', () => {
  const d = depot('Dépendances: `leaflet`, `zod`', {
    copies: { 'docs/sécurité/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md': 'Dépendances: `leaflet`' },
  });
  passe(lancer(d, 'pnpm add leaflet'));
  refuse(lancer(d, 'pnpm add zod'));
});

test('ticket modifié dans l’arbre de travail ou sur la branche, pas sur le sujet → refusé', () => {
  const d = depot('Modèle: sonnet');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `leaflet`'));
  refuse(lancer(d, 'pnpm add leaflet'), 'arbre de travail');
  d.git('commit', '-qam', "je m'autorise");
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/feat/spec-all-demo-1-01-carte');
  refuse(lancer(d, 'pnpm add leaflet'), 'branche de la session');
});

test('ref locale du sujet déplacée sans que origin la porte → refusé', () => {
  const d = depot('Modèle: sonnet');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `leaflet`'));
  d.git('commit', '-qam', "je m'autorise");
  d.git('update-ref', 'refs/remotes/origin/sujet/demo', 'HEAD');
  refuse(lancer(d, 'pnpm add leaflet'));
});

test('hors d’une branche de ticket : refusé, comme avant', () => {
  const d = depot('Dépendances: `leaflet`');
  d.git('checkout', '-q', '-b', 'docs/relecture');
  refuse(lancer(d, 'pnpm add leaflet'));
  d.git('checkout', '-q', '--detach');
  refuse(lancer(d, 'pnpm add leaflet'));
});

test('ticket sur deux sujets : seuls les paquets que toutes ses copies prévoient passent', () => {
  const d = depot('Dépendances: `leaflet`, `zod`');
  d.git('checkout', '-q', 'origin/develop');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `leaflet`'));
  d.git('commit', '-qam', 'autre sujet');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/autre');
  d.git('fetch', '-q', 'origin');
  d.git('checkout', '-q', 'feat/spec-all-demo-1-01-carte');
  passe(lancer(d, 'pnpm add leaflet'));
  refuse(lancer(d, 'pnpm add zod'));
});

test('écrire la ligne puis pousser soi-même sur le sujet est refusé à l’étape push', () => {
  const d = depot('Modèle: sonnet');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `zod`'));
  d.git('commit', '-qam', "je m'autorise");
  const r = lancer(d, 'git push origin HEAD:refs/heads/sujet/demo');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /un sujet ne se pousse jamais à la main/);
  assert.match(r.stderr, /sujet\.sh carte <nom>/);
  // Les formes qui contournaient la première version : refspec cité, `git -C`, `git` par son chemin.
  for (const commande of ['git push origin "HEAD:refs/heads/sujet/demo"', 'git -C . push origin HEAD:sujet/demo', '/usr/bin/git push origin HEAD:sujet/demo'])
    assert.equal(lancer(d, commande).status, 2, commande);
  refuse(lancer(d, 'pnpm add zod'));
});

test('un .npmrc ou un pnpm-workspace.yaml qui diffère de develop, même hors de l’index, suspend le laissez-passer', () => {
  for (const fichier of ['.npmrc', 'pnpm-workspace.yaml']) {
    const d = depot('Dépendances: `leaflet`');
    passe(lancer(d, 'pnpm add leaflet'), 'avant : le paquet prévu passe');
    writeFileSync(join(d.travail, fichier), 'registry=https://registre.example/\n');
    refuse(lancer(d, 'pnpm add leaflet'), `${fichier} non suivi dans l’arbre de travail`);
    d.git('add', fichier);
    d.git('commit', '-qm', 'registre');
    refuse(lancer(d, 'pnpm add leaflet'), `${fichier} commité sur la branche`);
  }
});

test('toutes les formes de push vers un sujet sont refusées, sujet.sh carte passe', () => {
  const d = depot('Modèle: sonnet');
  for (const commande of ['git push origin "HEAD:sujet/demo"', `git -C ${d.travail} push origin HEAD:sujet/demo`, '/usr/bin/git push origin HEAD:sujet/demo']) {
    const r = lancer(d, commande);
    assert.equal(r.status, 2, commande);
    assert.match(r.stderr, /bash scripts\/chaine\/sujet\.sh carte <nom>/);
  }
  d.git('checkout', '-q', '-b', 'sujet/local', 'origin/sujet/demo');
  assert.equal(lancer(d, 'git push').status, 2, 'git push nu depuis une branche sujet/…');
  refuse(lancer(d, 'git push origin "$REF"'), 'refspec illisible');
  const ok = lancer(d, 'bash scripts/chaine/sujet.sh carte x');
  assert.equal(ok.status, 0, ok.stderr);
  passe(ok, ok.stdout);
});

test('scripts/docs/identifiants.mjs absent : le hook ne tombe pas, il refuse la dépendance et garde ses refus', () => {
  const d = depot('Dépendances: `leaflet`', { avecIdentifiants: false });
  refuse(lancer(d, 'pnpm add leaflet'));
  assert.equal(lancer(d, 'git push --force origin x').status, 2);
});

test('la sortie standard ne porte jamais permissionDecision, commande refusée ou non', () => {
  const d = depot('Dépendances: `leaflet`');
  for (const commande of ['pnpm add zod', 'pnpm add leaflet', 'git push origin "$REF"', 'git push --force origin x', 'pnpm check'])
    assert.doesNotMatch(lancer(d, commande).stdout, /permissionDecision/, commande);
});

/** Les gardes copiées dans un dépôt jouet, lancées sur une entrée brute : stdin tel quel, ou l'objet en JSON. */
function gardes() {
  const d = depotJouet();
  const agent = join(d.racine, 'outils/scripts/agent');
  mkdirSync(agent, { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-commandes.mjs', 'garde-fichiers.mjs']) copyFileSync(new URL(f, import.meta.url), join(agent, f));
  const brut = (garde, entree) =>
    spawnSync(process.execPath, [join(agent, `${garde}.mjs`)], {
      cwd: d.travail,
      env: { ...ENV, PATH: d.bin, CLAUDE_PROJECT_DIR: d.travail },
      input: typeof entree === 'string' ? entree : JSON.stringify(entree),
      encoding: 'utf8',
    });
  return { ...d, brut };
}
/** Entrées qu'aucune garde ne lit : vide, JSON illisible, autre chose qu'un objet, `tool_input` absent ou d'un autre type. */
const ILLISIBLES = ['', '{"tool_input":', 'null', '[]', '"Bash"', {}, { tool_name: 'Bash' }, { tool_input: null }, { tool_input: 'git push --force origin x' }, { tool_input: ['git', 'status'] }];

test('garde-commandes refuse une entrée illisible ou une commande qui n’est pas une chaîne, et laisse passer l’entrée de Bash', () => {
  const g = gardes();
  for (const entree of [...ILLISIBLES, { tool_name: 'Bash', tool_input: {} }, { tool_input: { command: 42 } }, { tool_input: { command: ['git', 'push', '--force', 'origin', 'x'] } }, { tool_input: { command: null } }, { tool_input: { cmd: 'git status' } }]) {
    const r = g.brut('garde-commandes', entree);
    refuse(r, `garde-commandes : ${JSON.stringify(entree)}`);
    assert.match(r.stderr, /entrée de hook illisible/);
  }
  passe(g.brut('garde-commandes', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git status', description: 'État', timeout: 120000, run_in_background: false } }));
  refuse(g.brut('garde-commandes', { tool_name: 'Bash', tool_input: { command: 'git push --force origin x' } }));
});

test('garde-fichiers refuse une entrée illisible ou un chemin absent, vide ou d’un autre type, et laisse passer Edit, Write, MultiEdit, NotebookEdit', () => {
  const g = gardes();
  for (const entree of [...ILLISIBLES, { tool_name: 'Write', tool_input: { content: 'x' } }, { tool_input: { file_path: 42 } }, { tool_input: { file_path: ['README.md'] } }, { tool_input: { file_path: '' } }, { tool_input: { notebook_path: {} } }]) {
    const r = g.brut('garde-fichiers', entree);
    refuse(r, `garde-fichiers : ${JSON.stringify(entree)}`);
    assert.match(r.stderr, /entrée de hook illisible/);
  }
  const dans = (chemin) => join(g.travail, chemin);
  for (const entree of [
    { tool_name: 'Edit', tool_input: { file_path: dans('README.md'), old_string: 'jouet', new_string: 'x', replace_all: false } },
    { tool_name: 'Write', tool_input: { file_path: dans('docs/a.md'), content: 'x\n' } },
    { tool_name: 'MultiEdit', tool_input: { file_path: dans('README.md'), edits: [{ old_string: 'jouet', new_string: 'x' }] } },
    { tool_name: 'NotebookEdit', tool_input: { notebook_path: dans('n.ipynb'), cell_id: 'a', new_source: 'x' } },
    { tool_name: 'Write', tool_input: { file_path: join(g.racine, 'hors-du-depot.md'), content: 'x\n' } },
  ])
    passe(g.brut('garde-fichiers', entree), entree.tool_name);
  refuse(g.brut('garde-fichiers', { tool_name: 'Write', tool_input: { file_path: dans('.env'), content: 'x' } }));
  refuse(g.brut('garde-fichiers', { tool_name: 'NotebookEdit', tool_input: { notebook_path: dans('pnpm-lock.yaml'), new_source: 'x' } }));
});

test('ticket 17 : le hook refuse git -C . commit --no-verify et dit hooks git', () => {
  const g = gardes();
  for (const command of ['git -C . commit --no-verify -m x', 'git -c core.hooksPath=/dev/null commit -m x', 'HUSKY=0 git commit -m x']) {
    const r = g.brut('garde-commandes', { tool_name: 'Bash', tool_input: { command } });
    refuse(r, command);
    assert.match(r.stderr, /hooks git sautés/, command);
    assert.doesNotMatch(r.stdout, /permissionDecision/, command);
  }
  passe(g.brut('garde-commandes', { tool_name: 'Bash', tool_input: { command: 'git commit -m "fix -n option"' } }));
});
