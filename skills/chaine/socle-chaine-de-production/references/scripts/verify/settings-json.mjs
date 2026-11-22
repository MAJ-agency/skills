#!/usr/bin/env node
/**
 * Gate `settings-json` : la forme de `.claude/settings.json`.
 *
 * Pourquoi. Sur un premier projet, quatre retouches du fichier en deux heures : une
 * virgule en trop (JSON invalide, fichier ignoré en entier, hooks compris), une indentation
 * refusée par Prettier (`develop` rouge), un tableau `allow` remis à la racine au lieu de
 * `permissions.allow` (liste blanche inerte). Prettier attrape l'indentation, rien d'autre.
 *
 * Règles (pures : settings-json-regles.mjs) : JSON valide ; `permissions.allow` tableau non vide s'il existe,
 * `allow`/`deny`/`permissions` à leur place seulement, aucune entrée qui autorise ce que
 * `scripts/agent/regles.mjs` interdit ; hooks SessionStart, PreToolUse (Edit|Write… et Bash),
 * PostToolUse, Stop ; une commande qui cite scripts/agent/ vise un fichier existant (un outil
 * externe comme graphify est accepté tel quel). Quand `.claude/chaine.json` porte la clé `relecture` (régime 8), aucune
 * entrée ne pré-approuve `create_session` ; un contrat illisible qui nomme la clé compte comme s'il la portait.
 *
 * Le gate lit, il ne corrige pas : une session ne touche pas à ses droits (ADR « chaîne de production »).
 *
 * Usage : node scripts/verify/settings-json.mjs   (pnpm check, étape check:settings)
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ecartsSettings } from './settings-json-regles.mjs';

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const FICHIER = '.claude/settings.json';

// La clé `relecture` du contrat, quelle que soit sa forme (comme le gate `tickets`) ; illisible, lue présente si le
// texte la nomme : du côté sûr.
function aCleRelecture() {
  const chemin = join(ROOT, '.claude/chaine.json');
  if (!existsSync(chemin)) return false;
  const texte = readFileSync(chemin, 'utf8');
  try {
    const c = JSON.parse(texte);
    return c !== null && typeof c === 'object' && Object.hasOwn(c, 'relecture');
  } catch {
    return /"relecture"\s*:/.test(texte);
  }
}

const ecarts = ecartsSettings(readFileSync(join(ROOT, FICHIER), 'utf8'), {
  fichierExiste: (chemin) => existsSync(join(ROOT, chemin)),
  relecture: aCleRelecture(),
});

if (ecarts.length > 0) {
  console.error(
    `settings-json : ${FICHIER} n'a pas la forme attendue (ADR « chaîne de production ») :`,
  );
  for (const e of ecarts) console.error(`  ${FICHIER}:${e}`);
  process.exit(1);
}
console.log('settings-json : OK');
