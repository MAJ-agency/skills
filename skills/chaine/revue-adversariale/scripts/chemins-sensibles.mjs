// =============================================================================
// Chemins sensibles touchés par une branche (étape 2 de la revue adversariale).
//
// Lit `cheminsSensibles` dans `.claude/chaine.json` (dossier courant) et, sur l'entrée standard, les
// chemins d'un diff, un par ligne. Écrit `chemin<TAB>motif` pour chaque chemin qui touche un motif,
// rien sinon. Sortie 0 dans les deux cas, et sans `.claude/chaine.json` (aucun motif, comme le gate).
// Sortie 2 si le contrat est illisible ou si `cheminsSensibles` n'est pas une liste de chaînes, motif
// sur la sortie d'erreur : un contrôle de sécurité échoue fermé, comme le gate.
//
// Usage : git -c core.quotepath=false diff --name-only --no-renames <base>...HEAD | node scripts/chaine/chemins-sensibles.mjs
//
// Autonome, sans import : le moteur des motifs est celui du gate `tickets`
// (`tickets/references/scripts/verify/tickets-regles.mjs`, `regexDuMotif` et `motifSensibleTouche`),
// recopié à l'identique ; `chemins-sensibles.test.mjs` garde la parité.
// =============================================================================
import { existsSync, readFileSync } from "node:fs";

/**
 * Motif de chemin (`**` = tout, y compris zéro dossier avant `/` ; `*` = un segment) → expression
 * régulière. Copie de `regexDuMotif` du gate (`tickets-regles.mjs`).
 */
function regexDuMotif(motif) {
  // Un motif qui finit par `/` désigne un dossier : tout ce qu'il contient (`src/auth/` = `src/auth/**`).
  const complet = motif.endsWith("/") ? `${motif}**` : motif;
  // Un seul passage : `**/` → dossiers facultatifs, `**` → tout, `*` → un segment.
  const re = complet.replace(/\*\*\/|\*\*|\*|[.+?^${}()|[\]\\]/g, (m) => {
    if (m === "**/") return "(?:.*/)?";
    if (m === "**") return ".*";
    if (m === "*") return "[^/]*";
    return `\\${m}`;
  });
  return new RegExp(`^${re}$`);
}

/** Motif sensible touché par un chemin, ou `null` (copie de `motifSensibleTouche` du gate). */
function motifSensibleTouche(chemin, cheminsSensibles) {
  const c = chemin.replace(/^\.\//, "");
  return cheminsSensibles.find((motif) => regexDuMotif(motif).test(c)) ?? null;
}

function lireMotifs(fichier = ".claude/chaine.json") {
  if (!existsSync(fichier)) return [];
  let contrat;
  try {
    contrat = JSON.parse(readFileSync(fichier, "utf8"));
  } catch (e) {
    throw new Error(`.claude/chaine.json illisible : ${e.message}`);
  }
  const liste = contrat?.cheminsSensibles ?? [];
  if (!Array.isArray(liste) || liste.some((m) => typeof m !== "string"))
    throw new Error("`.claude/chaine.json` : `cheminsSensibles` doit être une liste de motifs");
  return liste;
}

try {
  const motifs = lireMotifs();
  const chemins = readFileSync(0, "utf8").split("\n").filter(Boolean);
  for (const chemin of chemins) {
    const motif = motifSensibleTouche(chemin, motifs);
    if (motif !== null) console.log(`${chemin}\t${motif}`);
  }
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
