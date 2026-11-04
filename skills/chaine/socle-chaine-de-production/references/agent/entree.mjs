import { readFileSync } from 'node:fs';
import { relative, isAbsolute } from 'node:path';

/** Entrée JSON d'un hook Claude Code (stdin). */
export function lireEntree() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

/** Racine du dépôt : celle que Claude Code annonce, sinon celle de ce script. */
export const RACINE = process.env.CLAUDE_PROJECT_DIR ?? new URL('../..', import.meta.url).pathname;

/** Chemin relatif à la racine, ou `null` s'il est hors du dépôt. */
export function relatif(chemin) {
  if (!chemin) return null;
  const r = isAbsolute(chemin) ? relative(RACINE, chemin) : chemin;
  return r.startsWith('..') ? null : r;
}
