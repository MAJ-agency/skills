import { execFileSync } from 'node:child_process';
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

/**
 * `tool_input` de l'entrée JSON d'une garde PreToolUse, ou `null` s'il ne se lit pas : entrée vide, JSON
 * illisible, autre chose qu'un objet, `tool_input` absent ou autre chose qu'un objet. Une garde refuse sur
 * `null` : elle échoue fermée. `lireEntree`, qui rend `{}`, reste celle des hooks qui ne gardent rien.
 */
export function lireToolInput() {
  const objet = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
  const entree = lireEntree();
  return objet(entree) && objet(entree.tool_input) ? entree.tool_input : null;
}

/** Racine du dépôt : celle que Claude Code annonce, sinon celle de ce script. */
export const RACINE = process.env.CLAUDE_PROJECT_DIR ?? new URL('../..', import.meta.url).pathname;

/** Chemin relatif à la racine, ou `null` s'il est hors du dépôt. */
export function relatif(chemin) {
  if (!chemin) return null;
  const r = isAbsolute(chemin) ? relative(RACINE, chemin) : chemin;
  return r.startsWith('..') ? null : r;
}

/**
 * Branche par défaut du dépôt : `origin/HEAD` (posé par demarrage.mjs) ; s'il manque, le distant, une
 * fois (`git ls-remote --symref origin HEAD`) ; `null` si les deux échouent : restent gardées `develop`,
 * `main` et `sujet/*`. Limite : `git remote set-head origin <x>` ou `git symbolic-ref` détournent la
 * lecture locale ; seule une branche par défaut d'un autre nom que `develop` ou `main` y est exposée.
 */
export function brancheParDefaut() {
  const git = (...args) => execFileSync('git', args, { cwd: RACINE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 }).trim();
  try {
    return git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD').replace(/^origin\//, '') || null;
  } catch {
    try {
      return /^ref: refs\/heads\/(\S+)\s+HEAD$/m.exec(git('ls-remote', '--symref', 'origin', 'HEAD'))?.[1] ?? null;
    } catch {
      return null;
    }
  }
}
