// Deux mutations de l'annexe du lot 6 (V5, A3), récrites sur le texte des retouches du premier tour de la
// contre-relecture de la PR 151, qui change leur repère : même effet, même banc. Au sommet 47a7489 elles sont
// introuvables (on y joue V5 et A3 de l'annexe) ; après les retouches, rouges. À lancer depuis la racine d'un clone :
// `node <chemin>/mutations-annexe-recrites.mjs [<nom>…]`. Sortie 0 : toutes rouges.
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
  ['V5r fusionner : le trigger_id de la garde n’est plus noté (V5 de l’annexe, sur le texte retouché)', `${C}/fusionner/SKILL.md`, retirer(" Noter le `trigger_id` qu'il rend, chaque fois, le dernier remplaçant le précédent : avant tout arrêt du capitaine et son archivage, `delete_trigger` sur lui ; perdu, le retrouver par `list_triggers`, sous ce nom et sur cette session (`persistent_session_id`, l'id de `CAPITAINE_ID`) : chaque capitaine du compte a une garde de ce nom."), ['scripts/veille-du-capitaine.test.mjs']],
  ['A3r avancement : un renvoi (`fusion-bloquée`) n’est plus « à reprendre » (A3 de l’annexe, sur le code retouché)', F.avReg, remplacer(" || (aEtiquette(l, 'fusion-bloquée') && !aEtiquette(l, 'à-relire'))", ''), [A]],
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
