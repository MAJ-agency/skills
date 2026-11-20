
// ── ticket 64 (relecteur) : lecture qui ne garde que le code ──
const MUT = process.env.MUT ?? "";
/** La source privée du contenu de ses commentaires et littéraux, même longueur ; `null` dans le doute. */
export function codeSeul(source) {
  const o = source.split("");
  const blanc = (k) => { if (o[k] !== "\n" && o[k] !== "\r") o[k] = " "; };
  const pile = []; // une entrée par `${` ouvert : la profondeur d'accolades du code qu'il porte
  let i = 0, prec = ""; // prec : dernier caractère non blanc du code
  const n = source.length;
  const gabarit = () => { // i sur le caractère après l'accent grave ouvrant ; rend "fin" ou "expr"
    while (i < n) {
      const c = source[i];
      if (c === "\\") { blanc(i); if (i + 1 < n) blanc(i + 1); i += 2; continue; }
      if (c === "`") { i++; return "fin"; }
      if (c === "$" && source[i + 1] === "{" && MUT !== "blanchit-expr") { i += 2; return "expr"; }
      blanc(i); i++;
    }
    return "ouvert";
  };
  while (i < n) {
    const c = source[i], d = source[i + 1];
    if (c === "/" && d === "/") { i += 2; while (i < n && source[i] !== "\n") { if (MUT !== "delim") blanc(i); i++; } if (MUT === "delim") { /* rien */ } continue; }
    if (c === "/" && d === "*" && MUT !== "bloc-code") { const f = source.indexOf("*/", i + 2); if (f < 0) return null; for (let k = i + 2; k < f; k++) blanc(k); if (MUT === "delim") { blanc(i); blanc(i+1); blanc(f); blanc(f+1); } i = f + 2; prec = "/"; continue; }
    if (c === '"' || c === "'") {
      if (MUT === "delim") blanc(i);
      i++;
      while (i < n && source[i] !== c) { if (source[i] === "\n") return MUT === "chaine-false" ? "" : null; if (source[i] === "\\") { blanc(i); i++; } blanc(i); i++; }
      if (i >= n) return MUT === "chaine-false" ? "" : null;
      if (MUT === "delim") blanc(i);
      i++; prec = c; continue;
    }
    if (c === "`") {
      if (MUT === "delim") blanc(i);
      i++;
      const r = gabarit();
      if (r === "ouvert") return MUT === "gabarit-false" ? "" : null;
      if (r === "expr") pile.push(0);
      prec = "`"; continue;
    }
    if (pile.length && c === "{") { pile[pile.length - 1]++; i++; prec = c; continue; }
    if (pile.length && c === "}") {
      if (pile[pile.length - 1] > 0) { pile[pile.length - 1]--; i++; prec = c; continue; }
      pile.pop(); i++;
      const r = gabarit();
      if (r === "ouvert") return MUT === "gabarit-false" ? "" : null;
      if (r === "expr") pile.push(0);
      prec = "`"; continue;
    }
    const estRegex = MUT === "toute-division" ? true : MUT === "sans-regex" ? false : !/[\w$)\]]/.test(prec);
    if (c === "/" && estRegex) {
      if (MUT === "delim") blanc(i);
      i++; let classe = false;
      while (i < n && (classe || source[i] !== "/")) {
        if (source[i] === "\n") return null;
        if (source[i] === "\\") { blanc(i); i++; if (source[i] === "\n") return null; }
        else if (source[i] === "[") classe = true; else if (source[i] === "]") classe = false;
        blanc(i); i++;
      }
      if (i >= n) return null;
      if (MUT === "delim") blanc(i);
      i++; prec = "/"; continue;
    }
    if (!/\s/.test(c)) prec = c;
    i++;
  }
  if (pile.length) return MUT === "gabarit-false" ? "" : null;
  const r = o.join("");
  return MUT === "longueur" ? r.replace(/ +/g, " ") : r;
}
