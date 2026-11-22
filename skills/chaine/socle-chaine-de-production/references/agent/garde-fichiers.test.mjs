// Le hook garde-fichiers sur un dépôt jouet, en régime 8 (relecture indépendante, lot 5b : A-74, A-76) : un chemin
// sensible ne s'écrit que si la ligne `Sensibles:` du ticket de la branche le couvre, lue sur `origin/sujet/*` (sur
// `origin/develop` pour un ticket sans sujet). Les hooks sont copiés dans un dossier `scripts/` jouet, avec
// `scripts/docs/identifiants.mjs` et le contrat `.claude/chaine.json` à côté, comme dans un projet ; CLAUDE_PROJECT_DIR
// désigne le clone de travail.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Posé dans un projet, scripts/docs/ est à côté de scripts/agent/ ; dans le plugin, le dépôt jouet est dans le skill
// tickets et la grammaire dans le skill socle-monorepo.
const PROJET = existsSync(new URL('../docs/identifiants.mjs', import.meta.url));
const DOCS = PROJET ? new URL('../docs/', import.meta.url) : new URL('../../../tickets/references/scripts/docs/', import.meta.url);
const GRAMMAIRE = PROJET ? new URL('../docs/identifiants.mjs', import.meta.url) : new URL('../../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs', import.meta.url);
const { ENV, depotJouet } = await import(new URL('depot-jouet.mjs', DOCS).href);

const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (ligne) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
const ACCORD = 'Sensibles: `scripts/agent/**`, docs/agents/regles.md — accord de la MOA, 2026-11-21';
const CONTRAT = { cheminsSensibles: ['scripts/agent/**', 'docs/agents/'], relecture: { depuis: '2026-11-21T09:00:00Z' } };

/** Dépôt jouet : develop porte le ticket avec `surDevelop` ; `surSujet` (non nul) le pose sur `origin/sujet/demo`. */
function depot({ surSujet = ACCORD, surDevelop = 'Sensibles: —', contrat = CONTRAT, branche = 'feat/spec-all-demo-1-01-garde' } = {}) {
  const d = depotJouet({ fichiers: { [TICKET]: ticket(surDevelop) } });
  if (surSujet !== null) {
    writeFileSync(join(d.travail, TICKET), ticket(surSujet));
    d.git('commit', '-q', '--allow-empty', '-am', 'sensibles');
    d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  }
  d.git('fetch', '-q', 'origin');
  d.git('checkout', '-q', '-b', branche, 'origin/develop');
  const outils = join(d.racine, 'outils');
  mkdirSync(join(outils, 'scripts/agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-fichiers.mjs']) copyFileSync(new URL(f, import.meta.url), join(outils, 'scripts/agent', f));
  mkdirSync(join(outils, 'scripts/docs'), { recursive: true });
  copyFileSync(GRAMMAIRE, join(outils, 'scripts/docs/identifiants.mjs'));
  mkdirSync(join(outils, '.claude'), { recursive: true });
  if (contrat !== null) writeFileSync(join(outils, '.claude/chaine.json'), JSON.stringify(contrat));
  return { ...d, script: join(outils, 'scripts/agent/garde-fichiers.mjs') };
}
const ecrire = ({ travail, bin, script }, chemin) =>
  spawnSync(process.execPath, [script], {
    cwd: travail,
    env: { ...ENV, PATH: bin, CLAUDE_PROJECT_DIR: travail },
    input: JSON.stringify({ tool_input: { file_path: join(travail, chemin) } }),
    encoding: 'utf8',
  });
const refuse = (r, motif) => {
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, motif ?? /chemin sensible \(`cheminsSensibles`\) hors de la ligne `Sensibles:` du ticket/);
};
const passe = (r) => assert.equal(r.status, 0, r.stderr);

test('régime 8 : la ligne `Sensibles:` du ticket, lue sur le sujet, couvre le chemin → écrit ; un chemin sensible qu’elle ne couvre pas → refusé ; un chemin ordinaire passe', () => {
  const d = depot();
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
  passe(ecrire(d, 'docs/agents/regles.md'));
  refuse(ecrire(d, 'docs/agents/autre.md'));
  passe(ecrire(d, 'docs/notes.md'));
});

test('régime 7 (sans la clé `relecture`) : un chemin sensible s’écrit comme avant, sans ligne lue', () => {
  const d = depot({ surSujet: null, contrat: { cheminsSensibles: ['scripts/agent/**'] } });
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
});

test('régime 8 : la copie du sujet fait foi, jamais l’arbre de travail ; sans sujet, celle de develop ; sans ticket, tout chemin sensible est refusé', () => {
  const d = depot({ surSujet: 'Sensibles: —' });
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  refuse(ecrire(d, 'scripts/agent/garde.mjs'), /chemin sensible/);
  const dev = depot({ surSujet: null, surDevelop: ACCORD });
  passe(ecrire(dev, 'scripts/agent/garde.mjs'));
  const sans = depot({ branche: 'feat/sans-ticket' });
  refuse(ecrire(sans, 'scripts/agent/garde.mjs'), /Aucune ligne lue : branche sans ticket/);
});

test('régime 8 : une copie locale du sujet que origin ne porte pas ne compte pas ; une ligne illisible refuse en le disant', () => {
  const d = depot({ surSujet: 'Sensibles: —' });
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  d.git('commit', '-q', '-am', 'local');
  d.git('update-ref', 'refs/remotes/origin/sujet/demo', 'HEAD');
  refuse(ecrire(d, 'scripts/agent/garde.mjs'));
  const mal = depot({ surSujet: 'Sensibles: ../scripts/agent/** — accord de la MOA, 2026-11-21' });
  refuse(ecrire(mal, 'scripts/agent/garde.mjs'), /Ligne illisible : « \.\.\/scripts\/agent\/\*\* » n'est pas un chemin/);
});
