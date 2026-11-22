// L'espion du régime 7 : pose dans `skills/chaine/sujet/scripts/depot-jouet.mjs` d'un clone (le même fichier sur `main`
// et sur la PR) un journal de chaque appel à `gh`, de chaque `git` qui touche le réseau (fetch, ls-remote, push, pull),
// et de chaque script lancé par `lancer` (nom, arguments, code de sortie, dernière ligne de la sortie standard). Le
// journal est le fichier que nomme `ESPION_JOURNAL` dans l'environnement du banc ; sans elle, rien ne change.
// Usage : node espion-poser.mjs <clone>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const fichier = join(process.argv[2], 'skills/chaine/sujet/scripts/depot-jouet.mjs');
let texte = readFileSync(fichier, 'utf8');
const remplacer = (avant, apres) => {
  if (texte.split(avant).length !== 2) throw new Error(`introuvable : ${avant.slice(0, 60)}`);
  texte = texte.replace(avant, () => apres);
};
remplacer(
  "  outil('gh', `exec node ${JSON.stringify(join(ICI, 'faux-gh.mjs'))} \"$@\"`);",
  [
    '  const ESPION = process.env.ESPION_JOURNAL;',
    "  outil('gh', `${ESPION ? `echo \"gh $*\" >> ${JSON.stringify(ESPION)}\\n` : ''}exec node ${JSON.stringify(join(ICI, 'faux-gh.mjs'))} \"$@\"`);",
    // L'espion de git dans un dossier à lui, juste après `bin` : un banc qui écrit son propre `bin/git` (et cherche « le
    // vrai » par `command -v git`) trouve l'espion, jamais lui-même.
    "  const binEspion = join(racine, 'bin-espion');",
    '  if (ESPION) {',
    '    mkdirSync(binEspion);',
    "    const VRAI_GIT = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8', env: { PATH: '/usr/local/bin:/usr/bin:/bin' } }).trim();",
    "    writeFileSync(join(binEspion, 'git'), `#!/bin/sh\\nfor a in \"$@\"; do case $a in fetch|ls-remote|push|pull) echo \"git $*\" >> ${JSON.stringify(ESPION)}; break ;; esac; done\\nexec ${VRAI_GIT} \"$@\"\\n`);",
    "    chmodSync(join(binEspion, 'git'), 0o755);",
    '  }',
  ].join('\n'),
);
remplacer(
  '    PATH: `${bin}:${process.env.PATH}`,',
  '    PATH: process.env.ESPION_JOURNAL ? `${bin}:${join(racine, \'bin-espion\')}:${process.env.PATH}` : `${bin}:${process.env.PATH}`,',
);
remplacer(
  "  const lancer = (script, ...args) =>\n    spawnSync('bash', [script, ...args], { cwd: travail, env, encoding: 'utf8' });",
  [
    '  const lancer = (script, ...args) => {',
    "    const nom = script.split('/').pop();",
    "    if (ESPION) writeFileSync(ESPION, `>>> ${nom} ${args.join(' ')}\\n`, { flag: 'a' });",
    "    const r = spawnSync('bash', [script, ...args], { cwd: travail, env, encoding: 'utf8' });",
    "    if (ESPION) writeFileSync(ESPION, `<<< ${nom} sortie ${r.status} : ${(r.stdout ?? '').trim().split('\\n').at(-1)}\\n`, { flag: 'a' });",
    '    return r;',
    '  };',
  ].join('\n'),
);
writeFileSync(fichier, texte);
console.log(`espion posé : ${fichier}`);
