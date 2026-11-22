// Mutations du relecteur (tour unique sur les tickets 80 à 82) : neuf, écrites à part de l'annexe, sur les textes qu'une
// session Sonnet suit et sur le gate `settings-json`. Même mécanique que `mutations.mjs` de l'annexe : chaque mutation
// change un passage trouvé une fois, joue les bancs nommés, et doit en rendre un rouge ; le fichier est remis après.
// À lancer depuis la racine d'un clone où `lot-6.patch` est appliqué : `node <chemin>/mutations-relecteur.mjs [R1 …]`.
// Sortie 0 : toutes rouges ; 1 : au moins une verte (un trou du banc).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const C = 'skills/chaine';
const CDP = `${C}/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`;
const B = 'scripts/bascule.test.mjs';
const D = 'scripts/depot.test.mjs';
const S = `${C}/socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs`;
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));

const MUTATIONS = [
  ['R1 chantier, Ne jamais : archive_session de nouveau permis', `${C}/chantier/SKILL.md`, remplacer(', ou appeler `archive_session` (`P-62`).', '.'), [B]],
  ['R2 chaine-de-production § 5, étape 5 : le sha court du dernier push', CDP, remplacer("le sha entier du dernier push ; puis l'étiquette", "le sha court du dernier push ; puis l'étiquette"), [B]],
  ['R3 réveil de secours : relancer le Relecteur soi-même au lieu de l’écrire au conducteur', CDP, remplacer("l'écrire au conducteur (un Relecteur arrêté)", 'relancer soi-même le Relecteur'), [B]],
  ['R4 architecte § 8 : `depuis` écrit avant l’ouverture de la PR de repose', `${C}/architecte/SKILL.md`, remplacer('le dernier de cette PR, écrit après son ouverture', 'le premier de cette PR, écrit avant son ouverture'), [B]],
  ['R5 regime-7.md : la fille d’un ticket Label: contre-revue livre de nouveau avec à-fusionner', `${C}/chantier/references/regime-7.md`, remplacer('la fille livre **sans** `à-fusionner` ; le conducteur contre-relit, puis pose le label lui-même.', 'la fille livre avec `à-fusionner` ; le conducteur contre-relit ensuite.'), [B, D]],
  ['R6 chantier § 6.5 : le conducteur pose à-fusionner sur une PR sans étiquette', `${C}/chantier/SKILL.md`, remplacer('il pose lui-même `à-relire` avec le commentaire', 'il pose lui-même `à-fusionner` avec le commentaire'), [B]],
  ['R7 fusionner, Le verdict : une lecture illisible devient un renvoi', `${C}/fusionner/SKILL.md`, remplacer("n'est pas un renvoi : la PR est sautée (7)", 'est un renvoi : la PR est renvoyée (4)'), [B, D]],
  ['R8 settings-json : le motif de create_session sans ancre de fin', `${C}/socle-chaine-de-production/references/scripts/verify/settings-json-regles.mjs`, remplacer('__create_session$/', '__create_session/'), [S]],
  ['R9 settings-json : une clé relecture à null lue absente (du côté non sûr)', `${C}/socle-chaine-de-production/references/scripts/verify/settings-json.mjs`, remplacer("Object.hasOwn(c, 'relecture')", 'c.relecture != null'), [S]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
let jouees = 0;
for (const [nom, fichier, muter, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) { console.log(`INTROUVABLE ${nom}`); vertes++; continue; }
  jouees++;
  writeFileSync(fichier, mute);
  let r;
  try { r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 }); } finally { writeFileSync(fichier, texte); }
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom}${echecs ? ` — ${echecs}` : ''}`);
}
console.log(`${jouees - vertes} rouges sur ${jouees} jouées`);
process.exit(vertes === 0 ? 0 : 1);
