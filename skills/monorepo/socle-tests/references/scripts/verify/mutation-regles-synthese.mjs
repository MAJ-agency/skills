/**
 * Synthèse de la mutation « règles prouvées » : règle → fichiers → mutants survivants, en Markdown.
 *
 *   node scripts/verify/mutation-regles-synthese.mjs   (depuis le paquet muté ; lit reports/mutation/mutation.json)
 *
 * Joué après `mutation:regles`, et par le workflow `Mutation` dans une étape `always()` qui redirige
 * la sortie vers `$GITHUB_STEP_SUMMARY` : un passage interrompu (délai dépassé, Stryker tué) dit en
 * clair « pas de rapport » au lieu de n'écrire rien. Périmètre vide (pas d'index Anchorpost) : le dit,
 * ce n'est pas une interruption. Sortie 0 toujours : le rouge d'un passage vient de Stryker.
 * Pas de plancher en V1 : la synthèse nomme les assertions qui manquent, elle ne refuse rien.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { perimetreDuPaquet, racineDuDepot } from "./mutation-regles.mjs";

export const RAPPORT_JSON = "reports/mutation/mutation.json";

/** Une cellule de code Markdown sûre : une ligne, sans accent grave, tronquée. */
const code = (texte, max = 80) => {
  const t = String(texte ?? "").replace(/\s+/g, " ").replaceAll("`", "'").trim();
  return `\`${t.length > max ? `${t.slice(0, max - 1)}…` : t}\``;
};

/** Une valeur de l'index ou de Stryker dans un titre ou une phrase : une ligne, sans accent grave. */
const ligne = (texte) => String(texte ?? "").replace(/\s+/g, " ").replaceAll("`", "'").trim();

const SURVIVANTS = new Set(["Survived", "NoCoverage"]);
const TUES = new Set(["Killed", "Timeout"]);

/**
 * @param regles    `[{ regle, fichiers }]` de `perimetre` (ou `perimetreDuPaquet`).
 * @param mutation  le JSON du reporter `json` de Stryker (`files[chemin].mutants[]`).
 * @param versDepot convertit une clé de `mutation.files` en chemin du dépôt (défaut : identité).
 * @param ecartes   `[{ regle, chemin, motif }]` de `perimetre` : la section « Hors périmètre ».
 */
export function synthese(regles, mutation, versDepot = (c) => c, ecartes = []) {
  const parFichier = new Map();
  for (const [cle, f] of Object.entries(mutation?.files ?? {})) parFichier.set(versDepot(cle), f?.mutants ?? []);
  const comptes = { tues: 0, survivants: 0 };
  for (const mutants of new Set(regles.flatMap((r) => r.fichiers).map((f) => parFichier.get(f) ?? []))) {
    for (const m of mutants) {
      if (TUES.has(m.status)) comptes.tues += 1;
      else if (SURVIVANTS.has(m.status)) comptes.survivants += 1;
    }
  }
  const mesures = comptes.tues + comptes.survivants;
  const fichiers = new Set(regles.flatMap((r) => r.fichiers)).size;
  const lignes = [
    "# Mutation sur les règles prouvées",
    "",
    `${regles.length} règle(s), ${fichiers} fichier(s). ` +
      (mesures ? `Score : ${Math.round((100 * comptes.tues) / mesures)} % (${comptes.tues} tués, ${comptes.survivants} survivants).` : "Aucun mutant mesuré."),
    "",
    "Pas de plancher : ce rapport nomme les assertions qui manquent, il ne refuse rien.",
  ];
  for (const { regle, fichiers: fs } of regles) {
    const parChemin = fs.map((f) => ({
      f,
      survivants: (parFichier.get(f) ?? []).filter((m) => SURVIVANTS.has(m.status)).sort((a, b) => (a.location?.start?.line ?? 0) - (b.location?.start?.line ?? 0)),
    }));
    const total = parChemin.reduce((n, x) => n + x.survivants.length, 0);
    lignes.push("", `## ${ligne(regle)} — ${total ? `${total} survivant(s)` : "aucun survivant"}`);
    for (const { f, survivants } of parChemin) {
      lignes.push("", `- ${code(f, 200)} — ${survivants.length ? `${survivants.length} survivant(s)` : "aucun survivant"}`);
      for (const m of survivants) {
        const ou = m.location?.start?.line ?? "?";
        lignes.push(`  - ligne ${ou} : ${ligne(m.mutatorName) || "?"}${m.replacement ? ` → ${code(m.replacement)}` : ""} (${m.status === "NoCoverage" ? "aucun test ne l'atteint" : "survécu"})`);
      }
    }
  }
  lignes.push("", "## Hors périmètre", "");
  if (!ecartes.length) lignes.push("Aucun.");
  for (const e of ecartes) lignes.push(`- ${ligne(e.regle)} : ${code(e.chemin, 200)} — ${e.motif}`);
  return `${lignes.join("\n")}\n`;
}

/** Ce que le point d'entrée écrit : la synthèse, ou la raison pour laquelle il n'y en a pas. */
export function texteDuPaquet(racine = racineDuDepot(), cwd = process.cwd()) {
  const p = perimetreDuPaquet(racine, cwd);
  if (!p.fichiers.length) return `Mutation sur les règles prouvées : périmètre vide — ${p.raison}\n`;
  const json = join(cwd, RAPPORT_JSON);
  if (!existsSync(json)) return "Pas de rapport de mutation (passage interrompu).\n";
  let mutation;
  try {
    mutation = JSON.parse(readFileSync(json, "utf8"));
  } catch {
    return "Pas de rapport de mutation (rapport illisible, passage interrompu).\n";
  }
  return synthese(p.regles, mutation, (c) => relative(racine, resolve(cwd, c)).split(sep).join("/"), p.ecartes);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(texteDuPaquet());
