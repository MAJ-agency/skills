// Les douze mutations de la contre-relecture de la PR 151, premier tour (K1 à K12). Chacune change une phrase d'un
// texte du régime 8 ou une ligne du tableau d'avancement, joue les bancs qu'elle nomme, et doit en rendre un rouge ; le
// fichier est remis après chaque mutation. K1 à K6 visent un texte présent au sommet 47a7489 comme après les retouches
// (elles survivent au sommet, rougissent après) ; K7 à K12 retirent un texte que les retouches ajoutent (introuvables au
// sommet, où ce texte manque : c'est le trou du constat). À lancer depuis la racine d'un clone :
// `node <chemin>/mutations-contre.mjs [<nom>…]`. Sortie 0 : toutes rouges ; une introuvable compte comme non rouge.
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
  ['K1 cdp § 5, étape 6 : au plafond, la fille redemande la relecture sans attendre la décision', F.cdp, remplacer('la fille attend la décision', 'la fille redemande la relecture aussitôt'), [B]],
  ['K2 chantier § 6.5 : après l’arbitrage, c’est le conducteur qui redemande la relecture', F.chantier, remplacer('la fille redemande la relecture', 'le conducteur redemande la relecture'), [B]],
  ['K3 architecte § 5 : la décision de plafond n’est dite à personne', F.architecte, retirer('et le produit en est informé en une ligne'), [B]],
  ['K4 cdp § 5, étape 7 : le réveil de secours armé à la seule première demande', F.cdp, remplacer('à chaque demande de relecture', 'à la première demande de relecture'), [B]],
  ['K5 avancement : « en relecture » perd la PR renvoyée qui redemande sa relecture', F.avReg, remplacer("enRelecture: lignes.filter((l) => aEtiquette(l, 'à-relire')).map((l) => l.id),", "enRelecture: lignes.filter((l) => aEtiquette(l, 'à-relire') && !aEtiquette(l, 'fusion-bloquée')).map((l) => l.id),"), [A]],
  ['K6 architecte § 4 : un Relecteur dans tout dépôt, avant la repose', F.architecte, tete('**un Relecteur** se lance en même temps que le capitaine', 'Dans tout dépôt, '), [B]],
  ['K7 chantier § 6.5 : la règle sans étiquette reprend les brouillons et les PR en régime 7', F.chantier, retirer(', hors brouillon (une fille qui code, ou arrêtée avant sa demande) et en régime 8 (ouvertes après `relecture.depuis` de leur base ; une PR en régime 7 sans étiquette attend sa contre-revue, `references/regime-7.md`)'), [B]],
  ['K8 chantier § 6.1 : le Relecteur sort du contrôle de vie du conducteur', F.chantier, retirer(" et, en régime 8, au Relecteur du dépôt (l'identifiant de la ligne `Relecteur:` de la fiche ; une ligne d'une fille, « `à-relire` depuis plus de trois heures sans distribution », le fait relever aussitôt)"), [B]],
  ['K9 lancement : la garde supprimée sur son seul nom', F.lancement, retirer(' dont `persistent_session_id` est la session de ce capitaine, jamais sur le seul nom, que porte la garde de chaque capitaine du compte'), [B]],
  ['K10 architecte, Archiver : les réveils en attente d’une session ne sont plus supprimés', F.architecte, retirer(', et supprimé d\'abord ses réveils en attente (`list_triggers`, les entrées dont `persistent_session_id` est cette session, `delete_trigger`) : un réveil de secours qui sonne réveille une session archivée'), [B]],
  ['K11 chantier § 0.6 : le Relecteur vérifié sans regarder la clé', F.chantier, retirer(', quand `.claude/chaine.json` d\'`origin/develop` porte la clé `relecture` (sans elle, aucun Relecteur : la ligne `Relecteur:` vaut « absent »)'), [B]],
  ['K12 cdp § 5, étape 6 : un bloquant contesté n’attend plus son arbitrage', F.cdp, retirer(" **Un bloquant contesté attend son arbitrage** : la relecture se redemande une fois l'arbitrage écrit (maintenu : le bloquant corrigé d'abord), au même sommet si rien n'a été poussé, jamais avant (le Relecteur remettrait `à-reprendre`)."), [B]],
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
