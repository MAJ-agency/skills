// Essai de la contre-relecture de la PR 152 (mineur 3) : le hook d'édition, régime 8, une copie locale de develop absente
// (un clone qui n'a jamais lu develop) ou en retard sans le ticket, et un ticket que seul develop porte (aucun sujet) ; ou un
// sujet qu'origin porte avec l'accord mais que le clone n'a jamais lu. Le refus dit-il le geste qui relit develop et les
// sujets, avant la demande au conducteur ? À poser à côté de garde-fichiers.test.mjs
// (`skills/chaine/socle-chaine-de-production/references/agent/`), `node --test <ce fichier>`, puis retiré. Les aides sont
// celles de garde-fichiers.test.mjs, recopiées telles quelles (ses lignes 1 à 55).
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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


const geste = (r) => /`(git fetch --prune origin [^`]+)`/.exec(r.stderr)?.[1];
const jouerGeste = (d) => d.git('fetch', '--prune', 'origin', '+refs/heads/develop:refs/remotes/origin/develop', '+refs/heads/sujet/*:refs/remotes/origin/sujet/*');
const dire = (nom, r) => console.log(`${nom} : sortie ${r.status} ; geste en tête : ${/ : d'abord, /.test(r.stderr) ? 'oui' : 'non'} ; ${r.stderr.trim().slice(0, 60)}… ${r.stderr.includes('Aucune ligne lue') ? '(Aucune ligne lue …)' : ''}`);

test('E1 : develop absent du clone, le ticket (accordé) sur develop seul', () => {
  const d = depot({ surSujet: null, surDevelop: ACCORD });
  d.git('update-ref', '-d', 'refs/remotes/origin/develop');
  const r = ecrire(d, 'scripts/agent/garde.mjs');
  dire('E1 develop absent', r);
  refuse(r);
  assert.equal(geste(r), undefined, 'aucun geste dit (le constat)');
  jouerGeste(d);
  passe(ecrire(d, 'scripts/agent/garde.mjs')); // le geste qu'on ne lui a pas dit aurait levé le refus
});

test('E2 : sujet porté par origin avec l’accord, jamais lu par le clone (develop à jour, sans accord)', () => {
  const d = depot(); // sujet/demo écrit l'accord (copie du sujet)
  d.git('update-ref', '-d', 'refs/remotes/origin/sujet/demo');
  const r = ecrire(d, 'scripts/agent/garde.mjs');
  dire('E2 sujet jamais lu', r);
  refuse(r);
  assert.equal(geste(r), undefined, 'aucun geste dit (le constat, d’avant la PR)');
  jouerGeste(d);
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
});
