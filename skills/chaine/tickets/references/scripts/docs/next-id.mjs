#!/usr/bin/env node
/**
 * Prochain numéro libre pour un préfixe de la nomenclature (`ARC-1` du socle, skill `tickets`).
 *
 * La numérotation est unique par préfixe dans tout `docs/`, quel que soit le dossier : `SOC-3` ou
 * `ALL-FOF-12` n'existe qu'une fois. Le script relève le plus grand n dans l'arbre de travail et sur
 * les branches distantes `origin/sujet/*` et `origin/docs/*` (next-id-branches.mjs), et affiche n + 1.
 *
 * Usage : node scripts/docs/next-id.mjs SOC        → 2
 *         node scripts/docs/next-id.mjs ALL FOF    → 13   (les segments du préfixe, séparés)
 *         node scripts/docs/next-id.mjs ARC        → 7    (vaut pour les ADR aussi)
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { plusGrandSurBranches } from './next-id-branches.mjs';

const prefixe = process.argv.slice(2).map((s) => s.toUpperCase()).join('-');
if (!/^[A-Z][A-Z0-9]*(-[A-Z][A-Z0-9]*)*$/.test(prefixe)) {
  console.error('Usage : node scripts/docs/next-id.mjs <PRÉFIXE…>   (ex. SOC, ALL FOF, ARC)');
  process.exit(2);
}

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const RE = new RegExp(`^${prefixe}-(\\d+)-`);

let max = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(join(dir, entry.name));
    else {
      const m = entry.name.match(RE);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
};
walk(join(ROOT, 'docs'));
max = Math.max(max, plusGrandSurBranches(RE));
console.log(max + 1);
console.error(
  'Branches origin/sujet/* et origin/docs/* lues sans fetch : faire `git fetch origin` si le dernier date.',
);
