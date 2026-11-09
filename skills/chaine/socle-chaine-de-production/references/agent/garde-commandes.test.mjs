// Le hook garde-commandes sur un dépôt jouet : la ligne `Dépendances:` du ticket ne compte que lue
// sur `origin/sujet/*`. Les hooks sont copiés dans un dossier `scripts/` jouet, avec
// `scripts/docs/identifiants.mjs` (skill `tickets`), comme dans un projet ; CLAUDE_PROJECT_DIR
// désigne le clone de travail.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Posé dans un projet, scripts/docs/ est à côté de scripts/agent/ ; dans le plugin, il est dans le skill tickets.
const DOCS = existsSync(new URL('../docs/identifiants.mjs', import.meta.url)) ? new URL('../docs/', import.meta.url) : new URL('../../../tickets/references/scripts/docs/', import.meta.url);
const { ENV, depotJouet } = await import(new URL('depot-jouet.mjs', DOCS).href);

const TICKET = 'docs/features/demo/issues/DEMO-1-demo.01.issue.md';
const ticket = (dependances) => `# DEMO-1.01 — x\n\nStatus: ready-for-agent\n${dependances}\n\n## Le besoin\n\nx\n`;

/** Dépôt jouet : le ticket sur develop sans ligne, `origin/sujet/demo` le porte avec `ligneSujet`. */
function depot(ligneSujet, { avecIdentifiants = true } = {}) {
  const d = depotJouet({ fichiers: { [TICKET]: ticket('Modèle: sonnet') } });
  writeFileSync(join(d.travail, TICKET), ticket(ligneSujet));
  d.git('commit', '-q', '--allow-empty', '-am', 'dépendances');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  d.git('checkout', '-q', '-b', 'feat/demo-1-01-carte', 'origin/develop');
  const outils = join(d.racine, 'outils/scripts');
  mkdirSync(join(outils, 'agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-commandes.mjs']) copyFileSync(new URL(f, import.meta.url), join(outils, 'agent', f));
  if (avecIdentifiants) {
    mkdirSync(join(outils, 'docs'), { recursive: true });
    copyFileSync(new URL('identifiants.mjs', DOCS), join(outils, 'docs/identifiants.mjs'));
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
const demande = (r) => /"permissionDecision":"ask"/.test(r.stdout);

test('ticket du sujet avec Dépendances: `leaflet` → pnpm add leaflet passe, zod demande', () => {
  const d = depot('Dépendances: `leaflet`');
  const r = lancer(d, 'pnpm add leaflet@1.9.4');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(demande(r), false, r.stdout);
  assert.equal(demande(lancer(d, 'pnpm add leaflet zod')), true);
});

test('ticket modifié dans l’arbre de travail ou sur la branche, pas sur le sujet → demander', () => {
  const d = depot('Modèle: sonnet');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `leaflet`'));
  assert.equal(demande(lancer(d, 'pnpm add leaflet')), true, 'arbre de travail');
  d.git('commit', '-qam', "je m'autorise");
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/feat/demo-1-01-carte');
  assert.equal(demande(lancer(d, 'pnpm add leaflet')), true, 'branche de la session');
});

test('ref locale du sujet déplacée sans que origin la porte → demander', () => {
  const d = depot('Modèle: sonnet');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `leaflet`'));
  d.git('commit', '-qam', "je m'autorise");
  d.git('update-ref', 'refs/remotes/origin/sujet/demo', 'HEAD');
  assert.equal(demande(lancer(d, 'pnpm add leaflet')), true);
});

test('hors d’une branche de ticket : demander, comme avant', () => {
  const d = depot('Dépendances: `leaflet`');
  d.git('checkout', '-q', '-b', 'docs/relecture');
  assert.equal(demande(lancer(d, 'pnpm add leaflet')), true);
  d.git('checkout', '-q', '--detach');
  assert.equal(demande(lancer(d, 'pnpm add leaflet')), true);
});

test('ticket sur deux sujets : seuls les paquets que toutes ses copies prévoient passent', () => {
  const d = depot('Dépendances: `leaflet`, `zod`');
  d.git('checkout', '-q', 'origin/develop');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `leaflet`'));
  d.git('commit', '-qam', 'autre sujet');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/autre');
  d.git('fetch', '-q', 'origin');
  d.git('checkout', '-q', 'feat/demo-1-01-carte');
  assert.equal(demande(lancer(d, 'pnpm add leaflet')), false);
  assert.equal(demande(lancer(d, 'pnpm add zod')), true);
});

test('écrire la ligne puis pousser soi-même sur le sujet est refusé à l’étape push', () => {
  const d = depot('Modèle: sonnet');
  writeFileSync(join(d.travail, TICKET), ticket('Dépendances: `zod`'));
  d.git('commit', '-qam', "je m'autorise");
  const r = lancer(d, 'git push origin HEAD:refs/heads/sujet/demo');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /ne pousse jamais sur un sujet/);
  assert.equal(demande(lancer(d, 'pnpm add zod')), true);
});

test('scripts/docs/identifiants.mjs absent : le hook ne tombe pas, il demande et garde ses refus', () => {
  const d = depot('Dépendances: `leaflet`', { avecIdentifiants: false });
  const r = lancer(d, 'pnpm add leaflet');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(demande(r), true);
  assert.equal(lancer(d, 'git push --force origin x').status, 2);
});
