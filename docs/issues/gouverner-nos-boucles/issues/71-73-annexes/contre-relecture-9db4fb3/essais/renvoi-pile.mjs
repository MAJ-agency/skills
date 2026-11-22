// renvoyer.sh pour une PR empilée (base feat/parent), develop en régime 8 : quel texte de suite ?
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const d = depotJouet();
d.ecrire('.claude/chaine.json', JSON.stringify({ cheminsSensibles: [], relecture: { depuis: '2026-11-17T09:00:00Z' } }) + '\n');
d.commit('chore: contrat');
d.git('push', '-q', 'origin', 'HEAD:develop');
d.git('fetch', '-q', 'origin');
d.branche('feat/parent', 'origin/develop', { 'docs/p.md': 'p\n' });
d.branche('feat/a', 'feat/parent', { 'docs/a.md': 'a\n' });
d.github({ pulls: [{ number: 30, title: 'docs(a): a', head: 'feat/a', base: 'feat/parent', labels: ['à-fusionner'] }] });
const r = d.lancer(script('fusionner', 'renvoyer.sh'), '30', 'PR empilée sur feat/parent en régime 8 : le Relecteur ne relit qu\'une PR vers develop ou vers un sujet ; la recibler sur develop, puis demander sa relecture');
console.log(`sortie ${r.status}`);
console.log(d.etat().pulls[0].commentaires.at(-1));
