// Régime 7 sans la clé `relecture` : les mêmes scénarios joués avec les scripts d'un arbre donné (base ou patché) ;
// écrit, par scénario, le code de sortie, la dernière ligne et la suite des appels au faux GitHub (méthode, route).
// Usage : node regime7.mjs <racine de l'arbre>
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const PASSER = script('fusionner', 'passer.sh');
const SUJET = script('sujet', 'sujet.sh');
const RENVOYER = script('fusionner', 'renvoyer.sh');
const SECTION = '## Revue adversariale\n\nRien à redire.\n\n`/security-review` : non requise\n';
const contrat = (d) => {
  d.ecrire('.claude/chaine.json', JSON.stringify({ cheminsSensibles: ['scripts/agent/**'] }) + '\n');
  d.commit('chore: contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
};
const GIT = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
const espionner = (d) => {
  const bin = join(d.racine, 'bin');
  const faux = readFileSync(join(bin, 'gh'), 'utf8').split('\n')[1];
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\necho "gh $*" >> ' + JSON.stringify(join(d.racine, 'appels.log')) + '\n' + faux + '\n');
  writeFileSync(join(bin, 'git'), '#!/bin/sh\ncase "$1" in fetch|ls-remote) echo "git $*" >> ' + JSON.stringify(join(d.racine, 'appels.log')) + ';; esac\nexec ' + GIT + ' "$@"\n');
  chmodSync(join(bin, 'gh'), 0o755); chmodSync(join(bin, 'git'), 0o755);
  return d;
};
const resume = (nom, d, r) => {
  const f = join(d.racine, 'appels.log');
  const lus = existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n') : [];
  const appels = lus.map((l) => l.replace(/[0-9a-f]{40}/g, '<sha>').replace(/\/tmp[^ ]*|\/home[^ ]*/g, '<chemin>'));
  const der = (r.stdout.trim().split('\n').at(-1) ?? '').replace(/[0-9a-f]{7,40}/g, '<sha>').replace(/\d{10}/g, '<epoch>');
  console.log('### ' + nom + '\nsortie ' + r.status + '\nderniere: ' + der.replace(/\/home[^ ]*/g, '<chemin>') + '\nappels:\n' + appels.map((a) => '  ' + a).join('\n'));
};
const vers = (d, { fichiers, body, labels = ['à-fusionner'], retard = false }) => {
  d.branche('feat/a', 'origin/develop', fichiers);
  if (retard) d.branche('develop', 'origin/develop', { 'docs/b.md': 'b\n' });
  d.git('switch', '-q', '--detach', 'origin/develop');
  d.github({ exiges: ['qualite'], checks: { '*': { qualite: 'SUCCESS' } }, pulls: [{ number: 30, title: 'feat(x): x', head: 'feat/a', base: 'develop', labels, body }] });
};
for (const [nom, opts] of [
  ['passer, code sans section : renvoi 4', { fichiers: { 'scripts/x.sh': 'echo x\n' }, body: '' }],
  ['passer, code avec section, en retard : mise à jour et fusion', { fichiers: { 'scripts/x.sh': 'echo x\n' }, body: SECTION, retard: true }],
  ['passer, chemin sensible sans la ligne /security-review : renvoi 4', { fichiers: { 'scripts/agent/x.mjs': 'export {};\n' }, body: '## Revue adversariale\n\nok\n' }],
]) {
  const d = espionner(depotJouet());
  contrat(d);
  vers(d, opts);
  resume(nom, d, d.lancer(PASSER, '30'));
}
{
  const d = espionner(depotJouet());
  contrat(d);
  vers(d, { fichiers: { 'docs/a.md': 'a\n' }, body: '' });
  resume('renvoyer.sh', d, d.lancer(RENVOYER, '30', 'motif de banc'));
  console.log('commentaire: ' + JSON.stringify(d.etat().pulls[0].commentaires.at(-1)).replace(/[0-9a-f]{7,40}/g, '<sha>'));
}
for (const [nom, body, retard] of [['sujet.sh fusionner, sous-PR de code sans section : renvoi 4', '', false], ['sujet.sh fusionner, sous-PR de code avec section, en retard : fusion', SECTION, true]]) {
  const d = espionner(depotJouet());
  contrat(d);
  d.branche('sujet/lot', 'origin/develop', { 'docs/lot.md': 'lot\n' });
  d.branche('feat/sous', 'origin/sujet/lot', { 'scripts/y.sh': 'echo y\n' });
  if (retard) d.branche('sujet/lot', 'origin/sujet/lot', { 'docs/lot2.md': 'l2\n' });
  d.git('switch', '-q', '--detach', 'origin/develop');
  d.github({ exiges: ['qualite'], checks: { '*': { qualite: 'SUCCESS' } }, pulls: [{ number: 80, title: 'feat(y): y', head: 'feat/sous', base: 'sujet/lot', labels: ['à-fusionner'], body }] });
  resume(nom, d, d.lancer(SUJET, 'fusionner', '80'));
}
