// Quatre décisions de la relecture indépendante (skill `relecture`) et de la veille du capitaine
// (skill `fusionner`), écrites en fonctions pures pour l'essai réel du régime 8
// (SPEC_ALL_ESS-1.07). Le module n'a pas d'appelant : ni la relecture ni la veille ne l'importent,
// seul son banc le lit.

const TICKET_SUFFIXES = [".issue.md", ".spec.md", ".map.md"];
const RULES_DIR = "docs/metier/regles/";
const CODE_SUFFIXES = [".mjs", ".js", ".cjs", ".ts", ".tsx", ".sh", ".json", ".yml", ".yaml"];

/** L'axe qui relit un fichier du diff (skill `relecture`, étape 4). */
export function axesForPath(path) {
  if (TICKET_SUFFIXES.some((s) => path.endsWith(s))) return "tickets";
  if (path.startsWith(RULES_DIR) || path === "GLOSSARY.md") return "regles-metier";
  if (path.endsWith(".md")) return "documentation";
  if (CODE_SUFFIXES.some((s) => path.endsWith(s))) return "code";
  return null;
}

/**
 * Une ligne que la PR de mise à jour retire vient-elle de `develop` (skill `relecture`, étape 7) ?
 * `removal` et chaque retrait de `developRemovals` : `{ path, line, text }`, `line` sur la base commune.
 */
export function isRemovalFromDevelop(removal, developRemovals) {
  return developRemovals.some((r) => r.path === removal.path && r.text === removal.text);
}

const KEYWORDS_BEFORE_REGEX = new Set([
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "throw",
  "case",
  "do",
  "else",
  "yield",
  "await",
]);

const PUNCTUATION_BEFORE_REGEX = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"]);
const isBlank = (c) => c === " " || c === "\t" || c === "\n" || c === "\r";
const isWordChar = (c) =>
  (c >= "a" && c <= "z") ||
  (c >= "A" && c <= "Z") ||
  (c >= "0" && c <= "9") ||
  c === "_" ||
  c === "$";

/** La barre oblique `source[index]` ouvre-t-elle une expression régulière ? D'après le jeton qui la précède. */
export function slashStartsRegex(source, index) {
  let i = index - 1;
  while (i >= 0 && isBlank(source[i])) i--;
  if (i < 0) return true;
  const c = source[i];
  if (c === ")" || c === "]") return false;
  if (!isWordChar(c)) return PUNCTUATION_BEFORE_REGEX.has(c);
  let start = i;
  while (start > 0 && isWordChar(source[start - 1])) start--;
  const word = source.slice(start, i + 1);
  return KEYWORDS_BEFORE_REGEX.has(word);
}

/** Les étapes de la veille relancée avec `--reprendre` (skill `fusionner`, la garde de la veille), dans l'ordre. */
export function resumeSteps({ loopLockFree }) {
  if (!loopLockFree) return ["prendre le verrou de la veille", "sortie 9"];
  return [
    "prendre le verrou de la veille",
    "préparer",
    "retirer le fichier d'arrêt",
    "lancer la boucle",
  ];
}
