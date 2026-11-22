// Huit mutations du relecteur des tickets 75 à 79 : chacune remplace un texte exact (deux pour un déplacement), joue les
// bancs qu'elle vise, et le fichier est remis après. À lancer depuis la racine d'un arbre de la PR qu'elle vise
// (`A` : tickets 75 à 77 ; `B` : 78 et 79) : `node mutations-relecteur.mjs A|B [<nom>…]`.
// Une mutation verte est un écart que les bancs ne tiennent pas ; chacune dit l'issue attendue.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PA = 'skills/chaine/fusionner/scripts/passer.sh';
const SU = 'skills/chaine/sujet/scripts/sujet.sh';
const RG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const RE = 'skills/chaine/fusionner/scripts/revue-exigee.mjs';
const RL = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const SK = 'skills/chaine/relecteur/SKILL.md';
const B78 = 'skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs';
const BGF = 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs';
const BRG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs';
const BVC = 'skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs';
const BRL = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BTX = 'scripts/relecteur.test.mjs';

const GARDE_PA = `[ "$(champ '.head.repo.full_name // ""')" = "$(champ '.base.repo.full_name // ""')" ] ||\n  sortir 7 "PR de fourche ($(champ '.head.repo.full_name // "dépôt supprimé"')) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi"\n`;
const GARDE_SU = `  [ "$(jq -r '.head.repo.full_name // ""' <<<"$pr")" = "$(jq -r '.base.repo.full_name // ""' <<<"$pr")" ] ||\n    sortir 7 "#$n : PR de fourche ($(jq -r '.head.repo.full_name // "dépôt supprimé"' <<<"$pr")) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi"\n`;
const FETCH_PA = 'git_masque fetch -q origin develop "$tete"\n';
const FETCH_SU = '  git_masque fetch -q origin develop "$base" "$(jq -r .head.ref <<<"$pr")"\n';

// [nom, PR, [[fichier, avant, après]…], bancs, issue attendue]
const MUTATIONS = [
  ['R1 passer.sh : la garde de fourche déplacée après le fetch de la tête (la branche d\'origin du même nom lue), avant toute écriture', 'B',
    [[PA, GARDE_PA, ''], [PA, FETCH_PA, FETCH_PA + GARDE_PA]], [B78], 'verte avec le banc du ticket (décision 1, « avant tout fetch », non tenue)'],
  ['R2 sujet.sh fusionner : la garde de fourche déplacée après le fetch de la tête', 'B',
    [[SU, GARDE_SU, ''], [SU, FETCH_SU, FETCH_SU + GARDE_SU]], [B78], 'verte avec le banc du ticket'],
  ['R3 regles.mjs : les deux gestes dans l\'ordre inverse (approfondir, puis relire)', 'B',
    [[RG, "${gestes.join(', puis ')}", "${[...gestes].reverse().join(', puis ')}"]], [BGF, BRG], 'rouge'],
  ['R4 sujet.sh fusionner : le régime d\'abord lu sur develop, pas sur le sujet', 'B',
    [[SU, 'prevu=$(regime_de_la_pr "$base"', 'prevu=$(regime_de_la_pr develop']], [B78], 'verte (develop et le sujet portent le même contrat dans le banc ; coût seul)'],
  ['R5 relecteur.mjs : la sortie 69 en 3 (l\'autre choix de la question 1 du ticket 75)', 'A',
    [[RL, 'arreter(6, `${calcul} : un outil', 'arreter(3, `${calcul} : un outil']], [BRL], 'rouge'],
  ['R6 relecteur.mjs : l\'usage nomme `--sondes` après `--attendre` (l\'ordre de l\'en-tête perdu)', 'A',
    [[RL, '[--taire <n>,…] [--sondes <k>] [--attendre]\');', '[--taire <n>,…] [--attendre] [--sondes <k>]\');']], [BRL], 'rouge'],
  ['R7 SKILL.md : la borne de la sortie 5 sans `--taire <n>`', 'A',
    [[SK, 'sur la même PR : l\'architecte, et `--taire <n>` |', 'sur la même PR : l\'architecte |']], [BTX], 'rouge'],
  ['R8 revue-exigee.mjs : la cause d\'une sortie 69 lue sur la seule sortie standard (celle de meme-contenu.sh perdue)', 'A',
    [[RE, "const cause = `${r.stderr ?? ''}\\n${r.stdout ?? ''}`", "const cause = `${r.stdout ?? ''}`"]], [BVC], 'rouge'],
];

const [pr, ...voulues] = process.argv.slice(2);
for (const [nom, cible, remplacements, bancs, attendu] of MUTATIONS) {
  if (cible !== pr) continue;
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const avant = new Map();
  let introuvable = false;
  for (const [f, a, b] of remplacements) {
    if (!avant.has(f)) avant.set(f, readFileSync(f, 'utf8'));
    const t = readFileSync(f, 'utf8');
    if (t.split(a).length !== 2) { introuvable = true; break; }
    writeFileSync(f, t.replace(a, () => b));
  }
  if (introuvable) {
    for (const [f, t] of avant) writeFileSync(f, t);
    console.log(`INTROUVABLE ${nom}`);
    continue;
  }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  for (const [f, t] of avant) writeFileSync(f, t);
  const rouge = r.status !== 0;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 70)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s ; attendu : ${attendu})${echecs ? ` — ${echecs}` : ''}`);
}
