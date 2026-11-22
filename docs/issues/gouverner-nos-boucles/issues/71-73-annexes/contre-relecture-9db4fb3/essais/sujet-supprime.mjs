// La garde du capitaine (`chemins-sensibles.mjs --garde`) lit toutes les refs `origin/sujet/*` du clone ; le fetch de
// `revue_du_capitaine` les met à jour sans élaguer (pas de `--prune`) : un sujet supprimé du distant (livré, clos) y
// reste, avec sa copie ancienne du ticket. Le ticket vit maintenant sur develop, l'accord à jour : la copie du sujet
// supprimé fait foi seule, et la PR est renvoyée.
// Usage : node sujet-supprime.mjs <racine de l'arbre>
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const d = depotJouet();
d.publierChaine();
const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (ligne) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
d.ecrire('.claude/chaine.json', `${JSON.stringify({ cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-17T09:00:00Z' } })}\n`);
d.commit('chore: contrat');
d.git('push', '-q', 'origin', 'HEAD:develop');
d.git('fetch', '-q', 'origin');
// Le sujet, avec le ticket sans accord ; livré puis supprimé du distant, la ref locale reste.
d.branche('sujet/ancien', 'origin/develop', { [TICKET]: ticket('Sensibles: —') });
// Supprimé par un autre (`sujet.sh clore` d'un autre clone) : directement dans le dépôt nu.
spawnSync('git', ['--git-dir', d.origine, 'update-ref', '-d', 'refs/heads/sujet/ancien'], { env: d.env });
// Le ticket est sur develop, avec l'accord (une PR de documentation, après la livraison).
d.branche('develop', 'origin/develop', { [TICKET]: ticket('Sensibles: `scripts/agent/**` — accord de la MOA, 2026-11-21') });
d.git('switch', '-q', '--detach', 'origin/develop');
// Le fetch de revue_du_capitaine, tel qu'il est (sans --prune).
d.git('fetch', '-q', 'origin', '+refs/heads/develop:refs/remotes/origin/develop', '+refs/heads/sujet/*:refs/remotes/origin/sujet/*');
const garde = () => spawnSync(process.execPath, [script('revue-adversariale', 'chemins-sensibles.mjs'), '--garde', '--base', 'develop', '--titre', 'feat(agent): x', '--branche', 'feat/spec-all-demo-1-01-x'], { cwd: d.travail, env: d.env, input: 'scripts/agent/x.mjs\n', encoding: 'utf8' });
const r = garde();
console.log(`refs origin/sujet/* : ${d.git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/sujet/') || '—'}`);
console.log(`sans --prune : sortie ${r.status} : ${r.stdout.trim()}`);
d.git('fetch', '-q', '--prune', 'origin', '+refs/heads/develop:refs/remotes/origin/develop', '+refs/heads/sujet/*:refs/remotes/origin/sujet/*');
const r2 = garde();
console.log(`avec --prune : sortie ${r2.status} : ${r2.stdout.trim()}`);
