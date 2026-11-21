// Un contrat `.claude/chaine.json` de develop qui ne se lit pas (JSON cassé, donc sans clé `relecture` lisible) : une PR
// de code avec sa section de revue, jouée par passer.sh d'un arbre donné. Usage : node contrat-casse.mjs <racine>
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { depotJouet, script } = await import(pathToFileURL(join(process.argv[2], 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const d = depotJouet();
d.ecrire('.claude/chaine.json', '{ "cheminsSensibles": [ \n');
d.commit('chore: contrat cassé');
d.git('push', '-q', 'origin', 'HEAD:develop');
d.git('fetch', '-q', 'origin');
d.branche('feat/a', 'origin/develop', { 'scripts/x.sh': 'echo x\n' });
d.git('switch', '-q', '--detach', 'origin/develop');
d.github({ exiges: ['qualite'], checks: { '*': { qualite: 'SUCCESS' } }, pulls: [{ number: 30, title: 'feat(x): x', head: 'feat/a', base: 'develop', labels: ['à-fusionner'], body: '## Revue adversariale\n\nRien.\n' }] });
const r = d.lancer(script('fusionner', 'passer.sh'), '30');
console.log('sortie ' + r.status + ' : ' + r.stdout.trim().split('\n').at(-1).replace(/[0-9a-f]{7,40}/g, '<sha>'));
