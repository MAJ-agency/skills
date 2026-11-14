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
function depot(ligneSujet, { avecIdentifiants = true } = {}) {
  const d = depotJouet({ fichiers: { [TICKET]: ticket('Modèle: sonnet') } });
  writeFileSync(join(d.travail, TICKET), ticket(ligneSujet));
  d.git('commit', '-q', '--allow-empty', '-am', 'dépendances');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  d.git('checkout', '-q', '-b', 'feat/spec-all-demo-1-01-carte', 'origin/develop');
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
