// Les mutations ajoutées par la contre-relecture de la PR 153, dans la forme des annexes des tickets 75 à 77 : chacune
// remplace un texte exact, joue les bancs qu'elle vise, et le fichier est remis après. À lancer depuis la racine d'un
// arbre de la PR (sommet 5213463, ou avec la retouche pour G1 et C6) : `node <chemin>/mutations-contre.mjs [<nom>…]`.
// Une mutation verte n'est pas un échec du script : elle est écrite, avec ce qu'elle dit (équivalente, ou non tenue).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const E = 'skills/chaine/fusionner/scripts/revue-exigee.mjs';
const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const P = 'skills/chaine/fusionner/scripts/passer.sh';
const S = 'skills/chaine/sujet/scripts/sujet.sh';
const K = 'skills/chaine/relecteur/SKILL.md';
const BV = 'skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BT = 'scripts/relecteur.test.mjs';
const CAUSE = "`${r.stderr ?? ''}\\n${r.stdout ?? ''}`";
const INVERSE = "`${r.stdout ?? ''}\\n${r.stderr ?? ''}`";

const MUTATIONS = [
  ['C1 revue-exigee.mjs : la cause lue sur la sortie standard d’abord (décision 4 : la sortie d’erreur d’abord)', E, `const cause = ${CAUSE}`, `const cause = ${INVERSE}`, [BV]],
  ['C2 relecteur.mjs : la cause lue sur la sortie standard d’abord', R, `const cause = ${CAUSE}`, `const cause = ${INVERSE}`, [BR]],
  ['C3 passer.sh : une revue du capitaine en échec (3) au premier contrôle lue comme une lecture illisible (sautée en 7)', P, '    21) sortir 7 "$(tail -n 1 <<<"$revue") : sautée sans renvoi, son auteur n\'y peut rien (le Relecteur prévient l\'architecte)" ;;', '    21 | 3) sortir 7 "$(tail -n 1 <<<"$revue") : sautée sans renvoi, son auteur n\'y peut rien (le Relecteur prévient l\'architecte)" ;;', [BV]],
  ['C4 sujet.sh juger_revue : une revue du capitaine en échec (3) lue comme une lecture illisible (sautée en 7)', S, '    21) sortir 7 "#$n : $(tail -n 1 <<<"$revu") : sautée sans renvoi', '    21 | 3) sortir 7 "#$n : $(tail -n 1 <<<"$revu") : sautée sans renvoi', [BV]],
  ['C6 passer.sh : une revue du capitaine en échec (3) au second contrôle lue comme une lecture illisible (sautée en 7)', P, '    21) quitter_capitaine; sortir 7 "$(tail -n 1 <<<"$revue") (contrôle juste avant la fusion) : sautée sans renvoi, son auteur n\'y peut rien" ;;', '    21 | 3) quitter_capitaine; sortir 7 "$(tail -n 1 <<<"$revue") (contrôle juste avant la fusion) : sautée sans renvoi, son auteur n\'y peut rien" ;;', [BV]],
  ['C5 relecteur.mjs : la sortie 69 d’un calcul en 3 (« le geste a changé » : la session rejoue `passe`, en rond ; A-197 point 1)', R, '  arreter(6, `${calcul} : un outil de la chaîne manque au poste', '  arreter(3, `${calcul} : un outil de la chaîne manque au poste', [BR]],
  ['T12 SKILL.md : la phrase de `--attendre` sans « de suite » (décision 2 du ticket 77)', K, 'compterait pour la seconde fois de suite.', 'compterait pour la seconde fois.', [BT]],
  ['G1 relecteur.mjs (retouche) : `github.sh` sorti en 69 lu « GitHub illisible » (5), le code du sommet 5213463', R, "  sansOutil('github.sh', r);\n", '', [BR]],
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
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 1_500_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 90)).join(' | ') : '';
  const comptes = (r.stdout.match(/^# (tests|pass|fail) \d+/gm) ?? []).join(', ');
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s ; ${comptes})${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
