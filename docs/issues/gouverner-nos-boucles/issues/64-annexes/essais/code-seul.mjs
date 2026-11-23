// Mise en œuvre jetable de `codeSeul` selon le ticket 64 (retouches d'A-172), pour vérifier ses cas et le corpus.
// Rend la source de même longueur, le texte des littéraux et des commentaires blanchi, ou `null` dans le doute.
const SOUS_TEST = /\b\w+\.test\s*\(\s*["'`]|\b(?:describe|suite|it)\s*\(/;
const MOTS_AVANT_REGEX = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "instanceof", "yield", "await"]);
const PONCTUATION_AVANT_REGEX = new Set(["(", "[", "{", ",", ";", ":", "?", "!", "=", "&", "|", "^", "~", "+", "-", "*", "%", "<", ">"]);
const FIN_DE_LIGNE = /[\n\r\u2028\u2029]/;
const DEBUT_DE_MOT = /[A-Za-z_$\u0080-￿]/;
const SUITE_DE_MOT = /[\w$\u0080-￿]/;

export function codeSeul(source) {
  const sortie = source.split("");
  const blanchir = (i) => {
    if (!FIN_DE_LIGNE.test(sortie[i])) sortie[i] = " ";
  };
  let i = 0;
  let avant = null; // le jeton significatif précédent : { sorte: "mot" | "litteral" | "ponct", valeur }
  const pile = []; // "accolade" ou "gabarit" (un `${` ouvert)
  const n = source.length;
  // Le texte d'un gabarit, à partir de i (après le ` ou après la } qui ferme un ${) ; rend false au doute.
  const texteDeGabarit = () => {
    while (i < n) {
      const c = source[i];
      if (c === "\\") { blanchir(i); if (i + 1 < n) blanchir(i + 1); i += 2; continue; }
      if (c === "`") { i++; avant = { sorte: "litteral" }; return true; }
      if (c === "$" && source[i + 1] === "{") { pile.push("gabarit"); i += 2; avant = { sorte: "ponct", valeur: "{" }; return true; }
      blanchir(i);
      i++;
    }
    return false;
  };
  while (i < n) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < n && !FIN_DE_LIGNE.test(source[i])) { blanchir(i); i++; }
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      const fin = source.indexOf("*/", i + 2);
      if (fin < 0) return null;
      for (let k = i + 2; k < fin; k++) blanchir(k);
      i = fin + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      i++;
      let ferme = false;
      while (i < n) {
        const d = source[i];
        if (d === "\n" || d === "\r") return null; // U+2028 et U+2029 sont permis dans une chaîne
        if (d === "\\") {
          if (i + 1 < n && (source[i + 1] === "\n" || source[i + 1] === "\r")) return null;
          blanchir(i); blanchir(i + 1); i += 2; continue;
        }
        if (d === c) { ferme = true; i++; break; }
        blanchir(i); i++;
      }
      if (!ferme) return null;
      avant = { sorte: "litteral" };
      continue;
    }
    if (c === "`") {
      i++;
      if (!texteDeGabarit()) return null;
      continue;
    }
    if (c === "/") {
      let regex;
      if (avant === null) return null;
      if (avant.sorte === "litteral") regex = false;
      else if (avant.sorte === "mot") regex = MOTS_AVANT_REGEX.has(avant.valeur);
      else if (avant.valeur === ")" || avant.valeur === "]") regex = false;
      else if (PONCTUATION_AVANT_REGEX.has(avant.valeur)) regex = true;
      else return null; // `}`, `++`, `--`, `.` … : la nature de la `/` ne se lit pas
      if (!regex) { i++; avant = { sorte: "ponct", valeur: "/" }; continue; }
      i++;
      let classe = false;
      let ferme = false;
      while (i < n) {
        const d = source[i];
        if (FIN_DE_LIGNE.test(d)) return null;
        if (d === "\\") { if (i + 1 < n && FIN_DE_LIGNE.test(source[i + 1])) return null; blanchir(i); blanchir(i + 1); i += 2; continue; }
        if (classe) { if (d === "]") classe = false; blanchir(i); i++; continue; }
        if (d === "[") { classe = true; blanchir(i); i++; continue; }
        if (d === "/") { ferme = true; i++; break; }
        blanchir(i); i++;
      }
      if (!ferme) return null;
      while (i < n && SUITE_DE_MOT.test(source[i])) i++; // les drapeaux
      avant = { sorte: "litteral" };
      continue;
    }
    if (DEBUT_DE_MOT.test(c)) {
      const d = i;
      while (i < n && SUITE_DE_MOT.test(source[i])) i++;
      avant = { sorte: "mot", valeur: source.slice(d, i) };
      continue;
    }
    if (/[0-9]/.test(c)) {
      while (i < n && /[\w.]/.test(source[i])) i++;
      avant = { sorte: "litteral" };
      continue;
    }
    if ((c === "+" || c === "-") && source[i + 1] === c) { i += 2; avant = { sorte: "ponct", valeur: c + c }; continue; }
    if (c === "{") { pile.push("accolade"); i++; avant = { sorte: "ponct", valeur: "{" }; continue; }
    if (c === "}") {
      const haut = pile.pop();
      i++;
      if (haut === "gabarit") { if (!texteDeGabarit()) return null; continue; }
      avant = { sorte: "ponct", valeur: "}" };
      continue;
    }
    i++;
    avant = { sorte: "ponct", valeur: c };
  }
  if (pile.includes("gabarit")) return null;
  return sortie.join("");
}

export function aDesSousTests(source) {
  const code = codeSeul(source);
  return code === null || SOUS_TEST.test(code);
}
