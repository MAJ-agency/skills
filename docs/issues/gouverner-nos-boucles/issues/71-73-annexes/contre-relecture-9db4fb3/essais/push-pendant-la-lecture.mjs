// Un push de l'auteur entre la lecture de la PR (`pr_json`, sommet X, que le Relecteur a validé) et le `git fetch` de
// `passer.sh` (origin/<tête> à O) : en régime 8, le premier contrôle juge O, que rien n'a relu, et renvoie la PR (4,
// `fusion-bloquée`) au lieu de la sauter comme le fait le contrôle du verrou (« sommet changé », 7). Le faux GitHub
// rend X (`sha` de la PR) quand origin porte O : la fenêtre, figée.
// Usage : node push-pendant-la-lecture.mjs <racine de l'arbre>
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const { ecrireDistribution } = await import(pathToFileURL(script('fusionner', 'decision-relecteur.mjs')).href);
const { ecrireVerdict } = await import(pathToFileURL(script('fusionner', 'verdict.mjs')).href);
const d = depotJouet();
d.ecrire('.claude/chaine.json', `${JSON.stringify({ cheminsSensibles: [], relecture: { depuis: '2026-11-17T09:00:00Z' } })}\n`);
d.commit('chore: contrat');
d.git('push', '-q', 'origin', 'HEAD:develop');
d.git('fetch', '-q', 'origin');
const x = d.branche('feat/a', 'origin/develop', { 'docs/a.md': 'a\n' });
d.branche('feat/a', 'feat/a', { 'docs/a2.md': 'a2\n' }, 'docs(a): suite');
d.git('switch', '-q', '--detach', 'origin/develop');
const commentaires = [ecrireDistribution({ tour: 1, sommet: x, sessions: ['session_rel1'] }), `${ecrireVerdict({ sommet: x, tour: 1, verdict: 'validé', bloquants: 0, session: 'session_rel1', securite: null })}\n\n- constats`];
d.github({ exiges: ['qualite'], checks: { '*': { qualite: 'SUCCESS' } }, pulls: [{ number: 30, title: 'docs(a): a', head: 'feat/a', sha: x, base: 'develop', labels: ['à-fusionner'], commentaires }] });
const r = d.lancer(script('fusionner', 'passer.sh'), '30');
console.log(`sortie ${r.status} : ${r.stdout.trim().split('\n').at(-1).replace(/[0-9a-f]{12,40}/g, '<sha>')}`);
