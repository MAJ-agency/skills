// La copie d'un ticket qu'un sujet n'a pas écrite, seulement héritée de develop (un sujet ouvert depuis develop, ou
// rafraîchi avec develop, porte tous les tickets de develop) : la garde du capitaine la compte comme une copie du
// ticket, et elle fait foi devant celle de develop. Deux cas : (1) un ticket sans sujet, l'accord écrit sur develop,
// un autre sujet ouvert avant l'accord ; (2) un ticket du sujet `demo`, l'accord écrit sur son sujet (A-75), le ticket
// entré dans develop avant (livraison intermédiaire) et reçu par un autre sujet.
// Usage : node copie-heritee.mjs <racine de l'arbre>
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (ligne) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
const ACCORD = 'Sensibles: `scripts/agent/**` — accord de la MOA, 2026-11-21';
const garde = (d, base) => spawnSync(process.execPath, [script('revue-adversariale', 'chemins-sensibles.mjs'), '--garde', '--base', base, '--titre', 'feat(agent): x', '--branche', 'feat/spec-all-demo-1-01-x'], { cwd: d.travail, env: d.env, input: 'scripts/agent/x.mjs\n', encoding: 'utf8' });
const monter = () => {
  const d = depotJouet();
  d.publierChaine();
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-17T09:00:00Z' } })}\n`);
  d.ecrire(TICKET, ticket('Sensibles: —'));
  d.commit('docs: le ticket, sans accord');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  return d;
};
// (1) Le ticket sans sujet : un autre sujet part de develop ; puis l'accord entre dans develop.
const a = monter();
a.branche('sujet/autre', 'origin/develop', { 'docs/autre.md': 'autre\n' });
a.branche('develop', 'origin/develop', { [TICKET]: ticket(ACCORD) });
a.git('switch', '-q', '--detach', 'origin/develop');
const r1 = garde(a, 'develop');
console.log(`(1) ticket sans sujet, accord sur develop, un autre sujet ouvert avant : sortie ${r1.status} : ${r1.stdout.trim()}`);
// (2) Le ticket du sujet demo : entré dans develop (sans accord), reçu par sujet/autre ; l'accord écrit sur sujet/demo.
const b = monter();
b.branche('sujet/autre', 'origin/develop', { 'docs/autre.md': 'autre\n' });
b.branche('sujet/demo', 'origin/develop', { [TICKET]: ticket(ACCORD) });
b.git('switch', '-q', '--detach', 'origin/develop');
const r2 = garde(b, 'sujet/demo');
console.log(`(2) ticket du sujet demo, accord sur son sujet, le ticket hérité par sujet/autre : sortie ${r2.status} : ${r2.stdout.trim()}`);
