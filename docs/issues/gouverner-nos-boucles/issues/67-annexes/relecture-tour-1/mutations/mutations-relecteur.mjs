// Cinq mutations du relecteur neuf (tour unique sur les tickets 67 à 70), sur le code neuf du ticket 68 : la décision
// (`decision-relecteur.mjs`, l'état `couple` dans la règle 5) et la `marque` que `relecteur.mjs` rend avec elle.
// Chacune remplace un texte exact (présent une fois), joue les bancs qu'elle vise, et doit les rendre rouges ; le fichier
// est remis après chaque mutation. À lancer depuis la racine d'un clone où `ticket-67-68-69.patch` est appliqué :
// `node <chemin>/mutations-relecteur.mjs [<nom>…]`. Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const D = 'skills/chaine/fusionner/scripts/decision-relecteur.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BD = 'skills/chaine/fusionner/scripts/decision-relecteur.test.mjs';

const MUTATIONS = [
  ['G1 décision : une session `couple` remplacée sous la cause `morte`', D,
    'if (horsService(s)) return propre(connues, s);',
    "if (horsService(s)) return propre(connues, s) === 'couple' ? 'morte' : propre(connues, s);", [BD, BR]],
  ['G2 décision : une session `couple` à relancer est relancée (`reecrire`), pas remplacée', D,
    'const aRelancer = attendues.find((s) => verdicts[s] !== undefined && relance(s) === null && !horsService(s));',
    "const aRelancer = attendues.find((s) => verdicts[s] !== undefined && relance(s) === null && !['morte', 'plafond'].includes(propre(connues, s)));", [BD]],
  ['G3 décision : le remplacement pour cause `couple` hors du remplacement unique du tour', D,
    "if (!distributions.some((d) => d.mention === 'remplace')) return geste('remplacer'",
    "if (!distributions.some((d) => d.mention === 'remplace') || panne(enPanne) === 'couple') return geste('remplacer'", [BD]],
  ['G4 décision : une session `couple` remplacée avant que la PR devenue double soit complétée', D,
    "if (sessions.length < exiges) return geste('completer', { manque: exiges - sessions.length });",
    "if (sessions.some((s) => propre(connues, s) === 'couple')) return geste('remplacer', { session: sessions.find((s) => propre(connues, s) === 'couple'), cause: 'couple' });\n    if (sessions.length < exiges) return geste('completer', { manque: exiges - sessions.length });", [BD]],
  ['G5 relecteur.mjs : la marque est la date du dernier verdict, pas celle de la marque la plus récente (`dernier`, A-183 point 6)', R,
    '{ marque: commentaires[marques.dernier]?.created_at ?? null }',
    '{ marque: commentaires[marques.verdicts.at(-1)?.rang]?.created_at ?? null }', [BR]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
