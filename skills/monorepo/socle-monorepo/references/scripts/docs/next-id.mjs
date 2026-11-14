#!/usr/bin/env node
/**
 * Prochain numéro libre d'un type, d'un contexte et d'un trigramme (`docs/methode/nomenclature.md`,
 * skill `tickets`).
 *
 * La numérotation est unique par type, contexte et trigramme dans tout `docs/`, quel que soit le
 * dossier : `SPEC_ALL_SOC-3` n'existe qu'une fois, et `RULE_ALL_SOC-3` est un autre document. Le
 * script relève le plus grand n porté par un nom de fichier (`RULE_ALL_LIC-3.md`, sans slug ;
 * `SPEC_ALL_LIC-12-<slug>.spec.md`, ses tickets et sa carte) dans l'arbre de travail et sur les
 * branches distantes `origin/sujet/*` et `origin/docs/*` (next-id-branches.mjs), et affiche n + 1.
 * Une règle existante garde ses zéros : `RULE_FNSMR_LIC-05` se compte comme 5.
 *
 * Usage : node scripts/docs/next-id.mjs SPEC ALL SOC     → 2
 *         node scripts/docs/next-id.mjs RULE ALL LIC     → 4
 *         node scripts/docs/next-id.mjs ADR ALL ARC      → 7
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TYPES, identifiantDuFichier, lireIdentifiant } from './identifiants.mjs';
import { plusGrandSurBranches } from './next-id-branches.mjs';

const args = process.argv.slice(2).map((s) => s.toUpperCase());
// Les trois segments écrits séparément, puis relus par la grammaire : aucune autre forme n'est admise.
const demande = args.length === 3 ? lireIdentifiant(`${args[0]}_${args[1]}_${args[2]}-1`) : null;
if (!demande) {
  console.error(`Usage : node scripts/docs/next-id.mjs <TYPE> <CTX> <TRI>   (ex. SPEC ALL SOC, RULE ALL LIC, ADR ALL ARC ; TYPE parmi ${TYPES.join(', ')})`);
  process.exit(2);
}

/** Numéro porté par un nom de fichier s'il est du type, du contexte et du trigramme demandés, sinon `null`. */
function numeroDe(nomDeFichier) {
  const lu = lireIdentifiant(identifiantDuFichier(nomDeFichier));
  return lu && lu.type === demande.type && lu.contexte === demande.contexte && lu.trigramme === demande.trigramme ? lu.n : null;
}

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;

let max = 0;
const walk = (dir) => {
  let entrees = [];
  try {
    entrees = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // pas encore de docs/ : le premier numéro est 1
  }
  for (const entry of entrees) {
    if (entry.isDirectory()) walk(join(dir, entry.name));
    else max = Math.max(max, numeroDe(entry.name) ?? 0);
  }
};
walk(join(ROOT, 'docs'));
max = Math.max(max, plusGrandSurBranches(numeroDe));
process.stdout.write(`${max + 1}\n`);
console.error(
  'Branches origin/sujet/* et origin/docs/* lues sans fetch : faire `git fetch origin` si le dernier date.',
);
