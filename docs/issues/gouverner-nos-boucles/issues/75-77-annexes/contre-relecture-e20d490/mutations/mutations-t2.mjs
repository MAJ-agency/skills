// Les mutations de la contre-relecture de la PR 153, tour 2, au sommet 34ac533 : chacune remplace un texte exact, joue le
// banc qu'elle vise (le cas qu'elle vise seul quand `motif` est donné, par `--test-name-pattern`), et le fichier est remis
// après. À lancer depuis la racine d'un arbre propre du sommet : `node <chemin>/mutations-t2.mjs [<nom>…]`.
// C3, C4, C6, G1 et T12 sont celles de la contre-relecture du tour 1 (`mutations-contre.mjs`), mêmes textes ; les autres
// sont neuves. Une mutation verte n'est pas un échec du script : elle est écrite.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const P = 'skills/chaine/fusionner/scripts/passer.sh';
const S = 'skills/chaine/sujet/scripts/sujet.sh';
const K = 'skills/chaine/relecteur/SKILL.md';
const BV = 'skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BT = 'scripts/relecteur.test.mjs';
const E1 = 'de bout en bout';
const JQ = 'un poste sans `jq`';

// [nom, fichier, avant, après, bancs, motif]
const MUTATIONS = [
  ['C3 passer.sh : une revue du capitaine en échec (3) au premier contrôle lue comme une lecture illisible (sautée en 7)', P, '    21) sortir 7 "$(tail -n 1 <<<"$revue") : sautée sans renvoi, son auteur n\'y peut rien (le Relecteur prévient l\'architecte)" ;;', '    21 | 3) sortir 7 "$(tail -n 1 <<<"$revue") : sautée sans renvoi, son auteur n\'y peut rien (le Relecteur prévient l\'architecte)" ;;', [BV], E1],
  ['C4 sujet.sh juger_revue : une revue du capitaine en échec (3) lue comme une lecture illisible (sautée en 7)', S, '    21) sortir 7 "#$n : $(tail -n 1 <<<"$revu") : sautée sans renvoi', '    21 | 3) sortir 7 "#$n : $(tail -n 1 <<<"$revu") : sautée sans renvoi', [BV], E1],
  ['C6 passer.sh : une revue du capitaine en échec (3) au second contrôle lue comme une lecture illisible (sautée en 7)', P, '    21) quitter_capitaine; sortir 7 "$(tail -n 1 <<<"$revue") (contrôle juste avant la fusion) : sautée sans renvoi, son auteur n\'y peut rien" ;;', '    21 | 3) quitter_capitaine; sortir 7 "$(tail -n 1 <<<"$revue") (contrôle juste avant la fusion) : sautée sans renvoi, son auteur n\'y peut rien" ;;', [BV], E1],
  ['C8 passer.sh : au premier contrôle, la sortie 3 sans sa cause (la ligne de revue-exigee.mjs tue)', P, '    *) sortir 3 "revue du capitaine en échec (sortie $statut) : $(tail -n 1 <<<"$revue")" ;;', '    *) sortir 3 "revue du capitaine en échec (sortie $statut) : " ;;', [BV], E1],
  ['C9 sujet.sh juger_revue : la sortie 3 d’une revue lue comme GitHub illisible (5, reprise au tour suivant, sans fin)', S, '    5) sortir 5 "#$n : origin ou GitHub illisible à la lecture des commentaires', '    5 | 3) sortir 5 "#$n : origin ou GitHub illisible à la lecture des commentaires', [BV], E1],
  ['G1 relecteur.mjs : `github.sh` sorti en 69 lu « GitHub illisible » (5), le code du sommet 5213463', R, "  sansOutil('github.sh', r);\n", '', [BR], JQ],
  ['G2 relecteur.mjs : `sansOutil` après le test de la sortie 5 (sans effet : la 69 part en 5 avant)', R, "  sansOutil('github.sh', r);\n  if (r.status !== 0) arreter(5, (r.stderr || '').trim() || `GitHub illisible (${route})`);\n", "  if (r.status !== 0) arreter(5, (r.stderr || '').trim() || `GitHub illisible (${route})`);\n  sansOutil('github.sh', r);\n", [BR], JQ],
  ['G3 relecteur.mjs : la cause nommée d’un autre outil que `github.sh`', R, "  sansOutil('github.sh', r);\n", "  sansOutil('meme-contenu.sh', r);\n", [BR], JQ],
  ['G4 relecteur.mjs : la veille lit la sortie 6 comme une pause (PAUSE, la veille continue)', R, '    if (r.status === 5) {\n      process.stdout.write(`PAUSE', '    if (r.status === 5 || r.status === 6) {\n      process.stdout.write(`PAUSE', [BR], JQ],
  ['J1 relecteur.mjs : toute lecture en échec est une panne du poste (6) : une vraie panne de GitHub ne serait plus une pause', R, "  sansOutil('github.sh', r);\n", "  if (r.status !== 0) arreter(6, `github.sh : un outil de la chaîne manque au poste (sortie ${r.status})`);\n", [BR], null],
  ['T12 SKILL.md : la phrase de `--attendre` sans « de suite » (décision 2 du ticket 77)', K, 'compterait pour la seconde fois de suite.', 'compterait pour la seconde fois.', [BT], null],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs, motif] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const filtre = motif ? ['--test-name-pattern', motif.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')] : [];
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...filtre, ...bancs], { encoding: 'utf8', timeout: 1_500_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 90)).join(' | ') : '';
  const comptes = (r.stdout.match(/^# (tests|pass|fail) \d+/gm) ?? []).join(', ');
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s ; ${motif ? `le cas « ${motif} » seul ; ` : ''}${comptes})${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
