// La demande de relecture écrite comme le message de `sujet.sh demarrer` (9db4fb3) la donne, « À relire — sommet … »,
// sans `Session:` ni `Conducteur:` : une marque presque à la forme. Avec un tour validé pour la tête, `passer.sh` saute
// la PR (7), à chaque passage, sans renvoi. Puis la forme entière (celle des retouches) : la PR entre.
// Usage : node demande-du-message.mjs <racine de l'arbre>
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const { ecrireDistribution } = await import(pathToFileURL(script('fusionner', 'decision-relecteur.mjs')).href);
const { ecrireVerdict } = await import(pathToFileURL(script('fusionner', 'verdict.mjs')).href);
for (const [nom, demande] of [
  ['la demande du message de demarrer, telle quelle', (sha) => `À relire — sommet ${sha}`],
  ['la forme entière', (sha) => `À relire — sommet ${sha} — Session: session_auteur — Conducteur: —`],
]) {
  const d = depotJouet();
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ cheminsSensibles: [], relecture: { depuis: '2026-11-17T09:00:00Z' } })}\n`);
  d.commit('chore: contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  const sha = d.branche('feat/a', 'origin/develop', { 'docs/a.md': 'a\n' });
  d.git('switch', '-q', '--detach', 'origin/develop');
  const commentaires = [demande(sha), ecrireDistribution({ tour: 1, sommet: sha, sessions: ['session_rel1'] }), `${ecrireVerdict({ sommet: sha, tour: 1, verdict: 'validé', bloquants: 0, session: 'session_rel1', securite: null })}\n\n- constats`];
  d.github({ exiges: ['qualite'], checks: { '*': { qualite: 'SUCCESS' } }, pulls: [{ number: 30, title: 'docs(a): a', head: 'feat/a', base: 'develop', labels: ['à-fusionner'], commentaires }] });
  for (const passage of [1, 2]) {
    const r = d.lancer(script('fusionner', 'passer.sh'), '30');
    console.log(`${nom}, passage ${passage} : sortie ${r.status} : ${r.stdout.trim().split('\n').at(-1).replace(/[0-9a-f]{40}/g, '<sha>')}`);
    if (r.status === 0) break;
  }
}
