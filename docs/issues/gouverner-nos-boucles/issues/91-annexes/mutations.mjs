// Les mutations du ticket 91 : chacune remplace des textes exacts d'un fichier (ou ajoute un fichier), joue le banc
// qu'elle vise, et doit le rendre rouge ; le fichier est remis (ou retiré) après chaque mutation. À lancer depuis la
// racine d'un clone où `ticket-91.patch` est appliqué et commité : `node <chemin>/mutations.mjs [<nom>…]`.
// Une ligne par mutation : `ROUGE` (tuée), `DÉLAI` (le banc a dépassé son délai : rien n'est prouvé, elle ne compte pas
// pour tuée), `VERTE` (elle survit), `INTROUVABLE` (un texte à remplacer absent, ou présent plusieurs fois) ; puis les
// tests en échec. Sortie 0 : toutes rouges ; 1 : une au moins non rouge, nommée.
// V13 à V15 mutent `regles.mjs` seul : jouées depuis un clone de `main` à `24fbd72` (le banc d'avant), elles y sont
// rouges aussi (`--test-name-pattern` lu sur les deux noms) ; V16 n'y existe pas (INTROUVABLE).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PI = 'skills/monorepo/socle-monorepo/references/racine/.prettierignore';
const EC = 'skills/monorepo/socle-monorepo/references/racine/eslint.config.mjs';
const PKG = 'skills/monorepo/socle-monorepo/references/racine/package.json';
const GH = 'skills/chaine/fusionner/scripts/github.sh';
const FILE = 'skills/chaine/fusionner/scripts/file.sh';
const BOUCLE = 'skills/chaine/fusionner/scripts/boucle.sh';
const PASSER = 'skills/chaine/fusionner/scripts/passer.sh';
const SUJET = 'skills/chaine/sujet/scripts/sujet.sh';
const R = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const RT = 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs';
const D = ['scripts/dossiers-poses.test.mjs'];
const CS = ['scripts/chaine-seule.test.mjs'];
const CEV = ['skills/chaine/fusionner/scripts/checks-exiges-vides.test.mjs'];
const SF = ['--test-name-pattern=checks exigés vide', 'skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs'];
const PLAFOND = ['--test-name-pattern=le plafond à 20 000', RT];
const AJOUTS = ['--test-name-pattern=ajouts\\(code\\)', RT];
const RE_CLOSE = '/^(-[a-zA-Z]*d[a-zA-Z]*|--delete-branch)(=.*)?$/.test(mot)';

// [nom, fichier, remplacements [[avant, après, toutes?]…] ou null (le fichier est ajouté, son contenu ensuite), bancs]
const MUTATIONS = [
  ['V1 .prettierignore du gabarit : scripts/github/ sort du bloc socle:poses-du-plugin', PI, [['scripts/github/\n', '']], D],
  ['V2 .prettierignore du gabarit : scripts/db/ (au projet) entre dans le bloc', PI, [['scripts/verify/\n', 'scripts/verify/\nscripts/db/\n']], D],
  ['V3 eslint.config.mjs du gabarit : les dossiers lus ne vont pas aux ignores', EC, [['      ...posesDuPlugin,\n', '']], D],
  ['V4 un skill pose un dossier de scripts/ de plus (references/scripts/nouveau/), hors du bloc', 'skills/chaine/tickets/references/scripts/nouveau/x.mjs', null, "export const x = 1;\n", D],
  ['V5 lint-staged du gabarit : ESLint sans --no-warn-ignored', PKG, [['"eslint --max-warnings 0 --no-warn-ignored"', '"eslint --max-warnings 0"']], D],
  ['V6 checks_exiges : une règle de ruleset vide se lit [] (le code d’avant)', GH, [['  if [ "$(jq \'[.[] | select(.type == "required_status_checks")] | length\' <<<"$regles")" != 0 ]; then', '  if false; then']], CEV],
  ['V7 checks_exiges : une protection de branche à liste vide se lit []', GH, [['  [ "$exiges" != \'[]\' ] || { reglage_checks_vides "la protection de branche de develop (Settings → Branches)"; return; }\n', '']], CEV],
  ['V8 file.sh : le réglage du dépôt sort en 5 (lu « GitHub illisible », la boucle en pause)', FILE, [['requis=$(checks_exiges) || exit $? #', 'requis=$(checks_exiges) || exit 5 #']], CEV],
  ['V9 boucle.sh : la sortie 6 de file.sh n’est pas dite réglage du dépôt', BOUCLE, [['    6) echo "ARRÊT : réglage du dépôt (file.sh, sortie 6, motif ci-dessus) : un admin le fait, puis le capitaine relance"; exit 6 ;;\n', '']], CEV],
  ['V10 passer.sh : la sortie 6 d’attendre_ci lue « checks toujours en attente »', PASSER, [['    6) sortir 3 "réglage du dépôt', '    6000) sortir 3 "réglage du dépôt']], CEV],
  ['V11 sujet.sh fusionner : la sortie 6 d’attendre_ci lue comme une CI pas finie', SUJET, [['      6) sortir 11 "#$n : réglage du dépôt', '      6000) sortir 11 "#$n : réglage du dépôt']], SF],
  ['V12 sujet.sh fusionner : la lecture unique d’une PR de mise à jour lit le réglage « GitHub illisible »', SUJET, [['      [ $? != 6 ] || sortir 11', '      [ $? != 6000 ] || sortir 11']], SF],
  ['V13 regles.mjs : `(?<!\\d)` retiré, la lecture de 7.9.x redevient quadratique sur une suite de chiffres', R, [["code.replace(/(?<!\\d)\\d*(>>?|<)&?\\s*[^\\s;&|]*/g, ' ')", "code.replace(/\\d*(>>?|<)&?\\s*[^\\s;&|]*/g, ' ')"]], AJOUTS],
  ['V14 regles.mjs : le plafond se teste après les deux lectures (une commande de 20 001 caractères est lue)', R, [
    ["  if (commande.length > TAILLE_MAX_LECTURE_7_9) return { decision: 'refuser', raison: RAISON_TROP_LONGUE };\n  // Le contexte", '  // Le contexte'],
    ['  if (decision || lu.illisible) return decision;\n', "  if (decision || lu.illisible) return commande.length > TAILLE_MAX_LECTURE_7_9 ? { decision: 'refuser', raison: RAISON_TROP_LONGUE } : decision;\n"],
    ['  return LECTURE_7_9.decisionCommande(commande, memoire);\n}', "  const d79 = LECTURE_7_9.decisionCommande(commande, memoire);\n  return commande.length > TAILLE_MAX_LECTURE_7_9 ? { decision: 'refuser', raison: RAISON_TROP_LONGUE } : d79;\n}"],
  ], PLAFOND],
  ['V15 regles.mjs : le pire cas `gh pr close 1 -ddd…!` dix fois plus lent (son option lue dix fois)', R, [[RE_CLOSE, `Array.from({ length: 10 }, () => ${RE_CLOSE}).some(Boolean)`, true]], PLAFOND],
  ['V16 regles.test.mjs : l’étalon ne recule plus (une expression linéaire), toute borne serait vide', RT, [['/^-[a-z]*a[a-z]*$/.test(ETALON)', '/^-[a-z]*$/.test(ETALON)']], PLAFOND],
  ['V17 anchorpost : la recette de l’admin de nouveau dans docs/agents/admin.md', 'skills/chaine/anchorpost/SKILL.md', [['à `docs/agents/chaine-admin.md` (posé par la chaîne)', 'à `docs/agents/admin.md` (posé par la chaîne)']], CS],
  ['V18 conception.md : le lien vers apps/api/CLAUDE.md de retour', 'skills/monorepo/socle-monorepo/references/methode/conception.md', [["(le `CLAUDE.md` de chaque service, `apps/<service>/CLAUDE.md`)", '([`apps/api/CLAUDE.md`](../../apps/api/CLAUDE.md))']], CS],
  ['V19 socle-chaine-de-production : la génération du registre des coûts n’est plus dite', 'skills/chaine/socle-chaine-de-production/SKILL.md', [[' Puis générer chaque index de la liste par sa `commande` : `node scripts/docs/couts.mjs` écrit le registre des coûts, `docs/agents/couts.md`, que `chaine-de-production.md` cite (sans lui, `check:contexte` est rouge).', '']], CS],
  ['V20 socle-monorepo : le gel à l’allumage n’est plus dit', 'skills/monorepo/socle-monorepo/SKILL.md', [['Celles-là, et elles seules, se gèlent à cet allumage', 'Elles se corrigent']], CS],
  ['V21 chaine-admin.md : la case des checks exigés ne dit plus la règle vide', 'skills/chaine/socle-chaine-de-production/references/admin.md', [['**jamais une règle sans check** : ', '']], CS],
];

const voulues = process.argv.slice(2);
let nonRouges = 0;
for (const [nom, fichier, remplacements, ...reste] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const bancs = reste.at(-1);
  let remettre;
  if (remplacements === null) {
    if (existsSync(fichier)) {
      console.log(`INTROUVABLE ${nom} (${fichier} existe déjà)`);
      nonRouges++;
      continue;
    }
    const dossier = dirname(fichier);
    const neuf = !existsSync(dossier);
    mkdirSync(dossier, { recursive: true });
    writeFileSync(fichier, reste[0]);
    remettre = () => (neuf ? rmSync(dossier, { recursive: true, force: true }) : rmSync(fichier, { force: true }));
  } else {
    const texte = readFileSync(fichier, 'utf8');
    let mute = texte;
    const manque = remplacements.find(([avant, , toutes]) => (toutes ? mute.split(avant).length < 2 : mute.split(avant).length !== 2));
    if (manque) {
      console.log(`INTROUVABLE ${nom}`);
      nonRouges++;
      continue;
    }
    for (const [avant, apres, toutes] of remplacements) mute = toutes ? mute.replaceAll(avant, () => apres) : mute.replace(avant, () => apres);
    writeFileSync(fichier, mute);
    remettre = () => writeFileSync(fichier, texte);
  }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 1_200_000, maxBuffer: 64 * 1024 * 1024 });
  remettre();
  const etat = r.status === null ? 'DÉLAI' : r.status !== 0 ? 'ROUGE' : 'VERTE';
  if (etat !== 'ROUGE') nonRouges++;
  const echecs = (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 70)).join(' | ');
  // La première ligne de l'erreur du premier test en échec (`error: |-` puis le message, indenté).
  const raison = ((/^ +error: (?:[|>]-?\n +)?(.+)$/m.exec(r.stdout) ?? [])[1] ?? '').trim().slice(0, 160);
  console.log(`${etat} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}${raison ? ` — ${raison}` : ''}`);
}
console.log(nonRouges === 0 ? 'toutes rouges' : `${nonRouges} mutation(s) non rouge(s)`);
process.exit(nonRouges === 0 ? 0 : 1);
