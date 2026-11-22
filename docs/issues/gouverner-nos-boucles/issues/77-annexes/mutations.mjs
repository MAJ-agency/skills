// Les mutations du ticket 77 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit
// les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `ticket-77.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`. 
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const S = 'skills/chaine/relecteur/SKILL.md';
const BT = 'scripts/relecteur.test.mjs';

const MUTATIONS = [
  ["T1 SKILL.md : la sortie 5 sans borne ni « rejouer au réveil suivant » (le texte d'avant, constat 8 de la PR 147)", S, "| 5 | GitHub n'a pas répondu : rejouer au réveil suivant ; `jouer <n>` sorti en 5 pour la seconde fois de suite sur la même PR : l'architecte, et `--taire <n>` |", "| 5 | GitHub n'a pas répondu : rien, le réveil suivant rejoue |", [BT]],
  ["T2 SKILL.md : la sortie 5 sans sa borne", S, " ; `jouer <n>` sorti en 5 pour la seconde fois de suite sur la même PR : l'architecte, et `--taire <n>` |", " |", [BT]],
  ["T3 SKILL.md : la borne de 5 sans « sur la même PR »", S, "pour la seconde fois de suite sur la même PR : l'architecte", "pour la seconde fois de suite : l'architecte", [BT]],
  ["T4 SKILL.md : la sortie 9 sans « de suite »", S, "| 9 | le verrou n'est pas venu en 5 minutes : rejouer au réveil suivant ; à la seconde fois de suite,", "| 9 | le verrou n'est pas venu en 5 minutes : rejouer au réveil suivant ; à la seconde fois,", [BT]],
  ["T5 SKILL.md : la sortie 7 sans « de suite »", S, "au second refus de suite, l'architecte", "au second refus, l'architecte", [BT]],
  ["T6 SKILL.md : `create_session` en échec, « rejouer le geste au réveil suivant » (le texte d'avant)", S, "`create_session` en échec pour une autre cause : rejouer au réveil suivant ; à la seconde fois de suite,", "`create_session` en échec pour une autre cause : rejouer le geste au réveil suivant ; à la seconde fois de suite,", [BT]],
  ["T7 SKILL.md : la sortie 6 ne nomme pas la sortie 69 des calculs", S, "un calcul dit qu'un outil de la chaîne manque au poste (sa sortie 69 : git plus ancien que 2.41, `jq` absent), ou `flock` manque", "ou `flock` manque", [BT]],
  ["T8 SKILL.md : `reecrire` ne dit plus qu'il peut rendre `panne`", S, ", qui rend `remplacer`, ou `panne` (une session déjà remplacée dans ce tour) : ses lignes (« Les lignes ») |", ", qui rend `remplacer` |", [BT]],
  ["T9 SKILL.md : « sans les deux champs, `couple` » (le texte d'avant, mineur 9 de la PR 147)", S, "il lui faut les deux champs ; un champ absent, `couple`.", "sans les deux champs, `couple`.", [BT]],
  ["T10 SKILL.md : le plafond rejoué n'est plus écrit", S, " Une exception, voulue : rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur (son étiquette s'est posée avant son commentaire) ; ces lignes partent comme les autres.", "", [BT]],
  ["T11 SKILL.md : le plafond rejoué écrit dans « L'état des sessions », hors de « Les lignes »", S, "(`remplacer`, cause `couple`).\n\n## Les lignes\n\n`lignes` est une liste de `{ a, session, texte }`. `a` vaut `auteur` ou `conducteur` : le `texte` part à `session` par `send_message`, tel quel ; `session` vaut `null` (une PR écrite sans session, `Session: —`) : personne n'est sonné. `a` vaut `architecte` : le `texte` part à la session de la ligne « Architecte : ». Jamais un constat, jamais un résumé, jamais un mot de plus. `jouer` ne rend une ligne qu'au changement d'étiquette, ou avec le commentaire du plafond : rejoué, il n'en rend aucune. Une exception, voulue : rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur (son étiquette s'est posée avant son commentaire) ; ces lignes partent comme les autres.", "(`remplacer`, cause `couple`). Une exception, voulue : rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur (son étiquette s'est posée avant son commentaire) ; ces lignes partent comme les autres.\n\n## Les lignes\n\n`lignes` est une liste de `{ a, session, texte }`. `a` vaut `auteur` ou `conducteur` : le `texte` part à `session` par `send_message`, tel quel ; `session` vaut `null` (une PR écrite sans session, `Session: —`) : personne n'est sonné. `a` vaut `architecte` : le `texte` part à la session de la ligne « Architecte : ». Jamais un constat, jamais un résumé, jamais un mot de plus. `jouer` ne rend une ligne qu'au changement d'étiquette, ou avec le commentaire du plafond : rejoué, il n'en rend aucune.", [BT]],
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
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
