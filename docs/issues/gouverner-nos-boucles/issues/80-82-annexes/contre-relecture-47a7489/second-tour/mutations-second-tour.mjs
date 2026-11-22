// Quatre mutations du second tour de la contre-relecture de la PR 151 (K13 à K16), sur le seul delta 47a7489..45d72a6.
// K13 à K15 doivent rougir ; K16 est une sonde : elle change la raison donnée entre parenthèses à l'étape 6, que rien ne
// fige (mineur N2 du second tour). À lancer depuis la racine d'un clone : `node <chemin>/mutations-second-tour.mjs`.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const C = 'skills/chaine';
const F = {
  cdp: `${C}/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`,
  chantier: `${C}/chantier/SKILL.md`,
  architecte: `${C}/architecte/SKILL.md`,
  lancement: `${C}/architecte/references/lancement.md`,
  avReg: `${C}/tickets/references/scripts/docs/avancement-regles.mjs`,
};
const B = 'scripts/bascule.test.mjs';
const A = `${C}/tickets/references/scripts/docs/avancement.test.mjs`;
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));
const retirer = (bloc) => remplacer(bloc, '');
// Dans la ligne qui porte `repere`, tout ce qui précède `repere` devient `debut`.
const tete = (repere, debut) => (t) => {
  const j = t.indexOf(repere);
  if (j < 0 || t.indexOf(repere, j + 1) >= 0) return null;
  const i = t.lastIndexOf('\n', j) + 1;
  return t.slice(0, i) + debut + t.slice(j);
};

const MUTATIONS = [
  ['K13 cdp § 1 : le conducteur ne pose jamais à-fusionner, sans l’exception de la livraison', F.cdp, remplacer("poser `à-fusionner` (une livraison de sujet exceptée) ;", "poser `à-fusionner` ;"), [B]],
  ['K14 fusionner, La règle : le propriétaire renvoyé ne remet jamais à-fusionner, livraison comprise', `${C}/fusionner/SKILL.md`, remplacer("| remettre `à-fusionner` (une livraison de sujet exceptée), fusionner", "| remettre `à-fusionner`, fusionner"), [B]],
  ['K15 architecte § 8.3 : la PR de repose sans la quatrième ADR', F.architecte, retirer(", la quatrième ADR du socle (`next-id.mjs ADR ALL ARC`, son identifiant à la place du placeholder `ADR_RELECTURE` de ces documents)"), [B]],
  ['K16 cdp § 5, étape 6 : la raison de « jamais avant » récrite (sonde : rien ne la fige)', F.cdp, remplacer("jamais avant (le Relecteur remettrait `à-reprendre`).", "jamais avant (le Relecteur distribuerait un tour compté)."), [B]],
];

const voulues = process.argv.slice(2);
let nonRouges = 0;
let jouees = 0;
let rouges = 0;
for (const [nom, fichier, muter, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) {
    console.log(`INTROUVABLE ${nom}`);
    nonRouges++;
    continue;
  }
  jouees++;
  writeFileSync(fichier, mute);
  let r;
  try {
    r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  } finally {
    writeFileSync(fichier, texte);
  }
  const rouge = r.status !== 0;
  if (rouge) rouges++;
  else nonRouges++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom}${echecs ? ` — ${echecs}` : ''}`);
}
console.log(`${rouges} rouges sur ${jouees} jouées, ${MUTATIONS.length} dans le fichier`);
console.log(nonRouges === 0 ? 'toutes rouges' : `${nonRouges} mutation(s) non rouge(s)`);
process.exit(nonRouges === 0 ? 0 : 1);
