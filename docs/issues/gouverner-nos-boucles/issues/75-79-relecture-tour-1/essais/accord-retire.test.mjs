// Essai du relecteur des tickets 75 à 79 (ticket 79, décision 1) : « la copie du sujet compte (le côté sûr) » quand la
// copie locale de develop n'est pas confirmée. Un cas où compter la copie ouvre la garde : develop accordait le chemin
// (D0), le sujet `autre` hérite de cet accord, puis develop le retire (D1). La session a relu le sujet, pas develop (sa
// copie à D0). Avec develop à jour, la règle d'A-193 refuse (la copie du sujet est héritée, D1 fait foi). On compare.
// Lancer : ARBRE=<racine d'un arbre> node --test accord-retire.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
const ARBRE = process.env.ARBRE;
const AGENT = join(ARBRE, 'skills/chaine/socle-chaine-de-production/references/agent');
const { ENV, depotJouet } = await import(join(ARBRE, 'skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs'));
const GRAMMAIRE = join(ARBRE, 'skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs');
const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (ligne) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
const ACCORD = 'Sensibles: `scripts/agent/**` — accord de la MOA, 2026-11-21';
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-21T09:00:00Z' } };

function depot() {
  const d = depotJouet({ fichiers: { [TICKET]: ticket(ACCORD) } });
  d.git('fetch', '-q', 'origin');
  d.git('checkout', '-q', '-b', 'feat/spec-all-demo-1-01-garde', 'origin/develop');
  const outils = join(d.racine, 'outils');
  mkdirSync(join(outils, 'scripts/agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-fichiers.mjs']) copyFileSync(join(AGENT, f), join(outils, 'scripts/agent', f));
  mkdirSync(join(outils, 'scripts/docs'), { recursive: true });
  copyFileSync(GRAMMAIRE, join(outils, 'scripts/docs/identifiants.mjs'));
  mkdirSync(join(outils, '.claude'), { recursive: true });
  writeFileSync(join(outils, '.claude/chaine.json'), JSON.stringify(CONTRAT));
  return { ...d, script: join(outils, 'scripts/agent/garde-fichiers.mjs') };
}
const ecrire = ({ travail, bin, script }, chemin) =>
  spawnSync(process.execPath, [script], { cwd: travail, env: { ...ENV, PATH: bin, CLAUDE_PROJECT_DIR: travail }, input: JSON.stringify({ tool_input: { file_path: join(travail, chemin) } }), encoding: 'utf8' });

test('accord retiré de develop, hérité par un sujet ; develop local en retard, puis relu', () => {
  const d = depot();
  const d0 = d.git('rev-parse', 'origin/develop').trim();
  // Le sujet `autre` part de D0 : il hérite de l'accord.
  d.git('push', '-q', 'origin', `${d0}:refs/heads/sujet/autre`);
  // D1 : develop retire l'accord.
  d.git('switch', '-q', '--detach', 'origin/develop');
  writeFileSync(join(d.travail, TICKET), ticket('Sensibles: —'));
  d.git('commit', '-q', '-am', 'accord retiré');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  d.git('update-ref', 'refs/remotes/origin/develop', d0); // la session n'a relu que le sujet
  d.git('switch', '-q', 'feat/spec-all-demo-1-01-garde');
  const enRetard = ecrire(d, 'scripts/agent/garde.mjs');
  console.log(`# develop local en retard : sortie ${enRetard.status} ${enRetard.stderr.trim().slice(0, 160)}`);
  d.git('fetch', '-q', 'origin', '+refs/heads/develop:refs/remotes/origin/develop');
  const aJour = ecrire(d, 'scripts/agent/garde.mjs');
  console.log(`# develop relu : sortie ${aJour.status} ${aJour.stderr.trim().slice(0, 120)}`);
  assert.equal(aJour.status, 2, 'develop à jour : refus (la règle d’A-193)');
  assert.equal(enRetard.status, 2, 'develop en retard : la garde doit refuser aussi (le côté sûr), au plus avec le geste qui relit develop');
});
