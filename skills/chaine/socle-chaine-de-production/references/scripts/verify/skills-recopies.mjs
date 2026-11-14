#!/usr/bin/env node
/**
 * Gate `skills-recopies` : la copie des skills de la chaîne (`.claude/skills/`) est celle que déclare
 * son manifeste `.claude/skills/maj-skills.json` (posés par `scripts/recopier-skills.mjs`).
 *
 * Sans manifeste : rien à contrôler, code 0. Manifeste invalide, ou copie qui en diffère (fichier
 * modifié, absent, ou ajouté dans un dossier recopié) : code 1. Un dossier que le manifeste ne
 * nomme pas est un skill propre au projet : il n'est pas lu. Le hook d'agent refuse déjà l'édition
 * de la copie ; ce gate rattrape ce qu'il ne voit pas (une commande shell).
 *
 * Usage : node scripts/verify/skills-recopies.mjs   (pnpm check, étape check:skills)
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ecartsCopie, lireManifeste, phraseEcart } from './skills-recopies-regles.mjs';

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const COPIE = join(ROOT, '.claude/skills');
const FICHIER = '.claude/skills/maj-skills.json';

if (!existsSync(join(ROOT, FICHIER))) {
  console.log('skills-recopies : aucune copie de skills déclarée');
  process.exit(0);
}

const lu = lireManifeste(readFileSync(join(ROOT, FICHIER), 'utf8'));
if (lu.invalide) {
  console.error(`skills-recopies : ${FICHIER} est invalide : ${lu.invalide}.`);
  process.exit(1);
}

/** Tous les fichiers sous un dossier, chemins relatifs à `.claude/skills/`, barres obliques. */
const fichiersDuSkill = (nom) => {
  const sous = (dossier) =>
    readdirSync(join(COPIE, dossier), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sous(`${dossier}/${e.name}`) : [`${dossier}/${e.name}`]));
  return existsSync(join(COPIE, nom)) ? sous(nom) : [];
};
const empreinte = (chemin) => {
  try {
    return createHash('sha256').update(readFileSync(join(COPIE, chemin))).digest('hex');
  } catch {
    return null;
  }
};

const ecarts = ecartsCopie(lu.manifeste, { empreinte, fichiersDuSkill });
if (ecarts.length > 0) {
  console.error('skills-recopies :');
  for (const e of ecarts) console.error(`  .claude/skills/${e}`);
  console.error(phraseEcart(lu.manifeste.version));
  process.exit(1);
}
console.log(`skills-recopies : OK (maj-skills ${lu.manifeste.version})`);
