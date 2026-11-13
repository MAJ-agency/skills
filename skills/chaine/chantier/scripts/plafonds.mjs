// =============================================================================
// Plafonds de session : le conducteur (et l'architecte, à chaque fin d'étape) ne juge pas lui-même
// si une session a dépassé son plafond, il passe ses relevés à ce script et suit le verdict.
//
// Règle (A-9, P-3) : rôle `fille` → `interrompre` dès que le contexte atteint `contexteFille` ou que
// le coût atteint `coutFille` ; rôles `conducteur` et `architecte` → `passer-la-main` dès que le
// contexte atteint `contextePilote` ; sinon `ok`. Un plafond est atteint dès l'égalité.
// Les valeurs viennent de `plafonds` dans .claude/chaine.json ; sans fichier ou sans cette clé, les
// valeurs par défaut (300000, 20, 400000, 3). Clé présente mais mal formée : sortie 2.
//
// Usage : echo '[{"session":"s1","role":"fille","contexte":310000,"cout":4.2}]' | node plafonds.mjs
//   entrée standard : liste JSON d'objets { session, role, contexte (tokens), cout (dollars) }.
//   sortie : une ligne par session, `<session><TAB><verdict><TAB><motif>`.
// Sortie 0 verdicts rendus · 2 entrée ou contrat illisible (rôle inconnu, mesure illisible, contrat
// mal formé) : jamais un `ok` par défaut.
// Les mesures se lisent par `get_session` : `context_usage.used_tokens` et `external_metadata.usage.cost_usd`.
// =============================================================================
import { existsSync, readFileSync } from "node:fs";

export const PAR_DEFAUT = Object.freeze({
  contexteFille: 300000,
  coutFille: 20,
  contextePilote: 400000,
  renvoisParPR: 3,
});

const positif = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

/** Plafonds d'un contrat déjà lu (objet) : valeurs par défaut sans clé, erreur si la clé est mal formée. */
export function plafondsDe(contrat) {
  if (!contrat || contrat.plafonds === undefined) return { ...PAR_DEFAUT };
  const p = contrat.plafonds;
  if (typeof p !== "object" || p === null || Array.isArray(p))
    throw new Error("`plafonds` de .claude/chaine.json doit être un objet");
  const inconnues = Object.keys(p).filter((k) => !(k in PAR_DEFAUT));
  if (inconnues.length)
    throw new Error(`plafonds : clé inconnue ${inconnues.join(", ")}`);
  for (const [k, v] of Object.entries(p))
    if (!positif(v)) throw new Error(`plafonds.${k} doit être un nombre strictement positif`);
  return { ...PAR_DEFAUT, ...p };
}

/** Lit le contrat à son chemin ; sans fichier, les valeurs par défaut. */
export function lirePlafonds(chemin = ".claude/chaine.json") {
  if (!existsSync(chemin)) return { ...PAR_DEFAUT };
  let contrat;
  try {
    contrat = JSON.parse(readFileSync(chemin, "utf8"));
  } catch (e) {
    throw new Error(`${chemin} illisible : ${e.message}`);
  }
  return plafondsDe(contrat);
}

/**
 * Règle pure. Rend { verdict, motif } pour une session { role, contexte, cout }.
 * Lève sur un rôle inconnu ou une mesure illisible.
 */
export function juger({ role, contexte, cout }, plafonds = PAR_DEFAUT) {
  if (role === "fille") {
    if (!(Number.isFinite(contexte) && contexte >= 0) || !(Number.isFinite(cout) && cout >= 0))
      throw new Error("mesure illisible : contexte et cout sont des nombres positifs");
    const motifs = [];
    if (contexte >= plafonds.contexteFille)
      motifs.push(`contexte ${contexte} tokens ≥ plafond ${plafonds.contexteFille}`);
    if (cout >= plafonds.coutFille) motifs.push(`coût ${cout} $ ≥ plafond ${plafonds.coutFille} $`);
    return motifs.length
      ? { verdict: "interrompre", motif: motifs.join(" ; ") }
      : { verdict: "ok", motif: "sous les plafonds de la fille" };
  }
  if (role === "conducteur" || role === "architecte") {
    if (!(Number.isFinite(contexte) && contexte >= 0))
      throw new Error("mesure illisible : contexte est un nombre positif");
    return contexte >= plafonds.contextePilote
      ? { verdict: "passer-la-main", motif: `contexte ${contexte} tokens ≥ plafond ${plafonds.contextePilote}` }
      : { verdict: "ok", motif: "sous le plafond du pilote" };
  }
  throw new Error(`rôle inconnu « ${role} » (fille, conducteur ou architecte)`);
}

/** Juge une liste de sessions ; lève sur la première entrée douteuse, nommée. */
export function jugerTout(sessions, plafonds = PAR_DEFAUT) {
  if (!Array.isArray(sessions)) throw new Error("l'entrée est une liste JSON de sessions");
  return sessions.map((s, i) => {
    const nom = s?.session ?? `#${i}`;
    if (typeof s?.session !== "string" || s.session === "")
      throw new Error(`entrée ${i} : session manquante`);
    try {
      return { session: nom, ...juger(s, plafonds) };
    } catch (e) {
      throw new Error(`session ${nom} : ${e.message}`);
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const plafonds = lirePlafonds();
    const entree = JSON.parse(readFileSync(0, "utf8"));
    for (const r of jugerTout(entree, plafonds)) console.log(`${r.session}\t${r.verdict}\t${r.motif}`);
  } catch (e) {
    console.error(`plafonds.mjs : ${e.message}`);
    process.exit(2);
  }
}
