// Mutations de la contre-relecture de la PR 157 (sommet 6feef8d) : chacune remplace un texte exact, joue les bancs
// visés, et dit ROUGE (un banc échoue) ou VERTE (rien ne la voit). Le fichier est remis après chaque mutation.
// Depuis la racine d'un clone au sommet : `node <chemin>/mutations-contre.mjs [<nom>…]`. Sortie 0 toujours : c'est un relevé.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const A = 'skills/chaine/anchorpost';
const SK = `${A}/SKILL.md`;
const FI = `${A}/references/rules/anchorpost.md`;
const AD = `${A}/references/fragments/admin.md`;
const MF = `${A}/references/manifest.json`;
const NV = 'NOTES-DE-VERSION.md';
const BANCS = ['scripts/preuve-suffisante-anchorpost.test.mjs', 'scripts/depot.test.mjs'];

const MUTATIONS = [
  ['C1 SKILL pivot-3 : init avec --force', SK, '`pnpm anchorpost init` (sans `--force`)', '`pnpm anchorpost init --force`'],
  ['C2 SKILL étape 4 : le manifeste hors de cheminsSensibles', SK, "5. `.claude/chaine.json` : `anchorpost/manifest.json` dans `cheminsSensibles` (le plancher, `sufficiency` et `featureCriticality` ne se baissent que par une personne).\n", ''],
  ['C3 fiche : une règle sans criticité est basse', FI, "une règle sans l'une ni l'autre est « à classer », jamais « basse »", "une règle sans l'une ni l'autre est « basse »"],
  ['C4 fiche : le plus bas des deux niveaux', FI, 'prend le plus haut des deux', 'prend le plus bas des deux'],
  ['C5 fiche : la raison obligatoire pour high', FI, '`reason` (obligatoire pour `low`)', '`reason` (obligatoire pour `high`)'],
  ['C6 fiche : les portées inversées', FI, '`scope` (`business` un cas que la MOA reconnaît, `technical` un cas que seule l\'équipe voit)', '`scope` (`technical` un cas que la MOA reconnaît, `business` un cas que seule l\'équipe voit)'],
  ['C7 fiche : une étiquette de cas inconnue tolérée', FI, 'est refusée par `anchorpost check`', 'est ignorée par `anchorpost check`'],
  ['C8 fiche : un agent peut baisser', FI, 'Un agent ne lève jamais un écart en baissant un niveau, un cas ou un plancher', 'Un agent lève un écart en baissant un niveau, un cas ou un plancher'],
  ['C9 fiche : la criticité d\'une feature descend par Prouve:', FI, 'la criticité d\'une feature ne descend que par `Règles:`', 'la criticité d\'une feature descend aussi par `Prouve:`'],
  ['C10 fiche : le manifeste plus sensible', FI, "C'est un chemin sensible : un agent n'y baisse ni un plancher, ni une criticité, ni `sufficiency`.", ''],
  ['C11 admin.md : enforce écrit par un agent', AD, 'est une décision du produit : la personne écrit', 'se décide en session : un agent écrit'],
  ['C12 SKILL pivot-3 : enforce posé par la session', SK, '5. Le passage à `enforce` est une décision du produit, projet par projet : une PR où une personne écrit `"sufficiency": "enforce"`.', '5. Le passage à `enforce` est une décision du produit, projet par projet : la session écrit `"sufficiency": "enforce"` dès que `check` est vert.'],
  ['C13 note 8.3.0 : sans cheminsSensibles', NV, ", et ajouter `anchorpost/manifest.json` aux `cheminsSensibles` de `.claude/chaine.json` (étape 4, point 5)", ''],
  ['C14 note 8.3.0 : installer avant de retirer', NV, 'retire d\'abord de `.npmrc` les lignes `@maj-agency:registry=…` et `…_authToken=…`, puis installe la CLI', 'installe la CLI, puis retire de `.npmrc` les lignes `@maj-agency:registry=…` et `…_authToken=…`'],
  ['C15 SKILL pivot-3 : le plancher baissé à la main', SK, 'le plancher relevé d\'après la mesure du jour', 'le plancher ramené à la mesure du jour'],
  ['C16 manifeste : enforce d\'office', MF, '"sufficiency": "observe",', '"sufficiency": "enforce",'],
  ['C17 fiche : prouvée sans qu\'un cas manque', FI, '« partielle » quand elle a une preuve et qu\'un cas manque, ou qu\'elle n\'en déclare aucun', '« prouvée » aussi quand elle n\'en déclare aucun'],
  ['C18 SKILL check : enforce sans refus de criticité', SK, 'en `enforce`, une règle `validated` sans criticité', 'en `observe`, une règle `validated` sans criticité'],
];

const voulues = process.argv.slice(2);
for (const [nom, fichier, avant, apres] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) { console.log(`INTROUVABLE ${nom}`); continue; }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...BANCS], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const echecs = r.status !== 0 ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${r.status !== 0 ? 'ROUGE' : 'VERTE'} ${nom}${echecs ? ` — ${echecs}` : ''}`);
}
