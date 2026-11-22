/**
 * Synthèse de la mutation « règles qui ont des preuves » : règle → fichiers → mutants survivants, en Markdown, avec,
 * par règle, sa criticité et son score, ou « non mesurée ».
 *
 *   node scripts/verify/mutation-regles-synthese.mjs [--date AAAA-MM-JJ] [--mesure <fichier>] [--precedente <fichier>]
 *       (depuis le paquet muté ; lit reports/mutation/mutation.json)
 *
 * La mesure est datée (`--date`, par défaut le jour UTC du passage) ; `--mesure` l'écrit en JSON (`{ date, regles:
 * [{ regle, criticite, tues, survivants, score }] }`), pour que le workflow la publie en artefact ; `--precedente` lit
 * celle du passage précédent et la synthèse dit chaque baisse de score d'une règle moyenne (`RULE_ALL_ANC-29` : « pour
 * une règle moyenne, la mesure ne baisse plus »), sans rien refuser. Une règle dont aucun mutant n'est atteint par un
 * test rejoué (ses preuves sont sur base, ou ne tournent pas sous Stryker) est « non mesurée », jamais « 0 % ». La
 * mesure ne vit ni dans l'index ni dans le dépôt (`SPEC_ALL_ANC-5`, `A-26`).
 *
 * Joué après `mutation:regles`, et par le workflow `Mutation` dans une étape `always()` qui redirige
 * la sortie vers `$GITHUB_STEP_SUMMARY` : un passage interrompu (délai dépassé, Stryker tué) dit en
 * clair « pas de rapport » au lieu de n'écrire rien. Périmètre vide (pas d'index Anchorpost) : le dit,
 * ce n'est pas une interruption. Sortie 0 (2 sur un usage faux) : le rouge d'un passage vient de Stryker.
 * Variable : `PROJET_RACINE` (racine du dépôt ; par défaut, deux dossiers au-dessus du script).
 * Pas de plancher en V1 : la synthèse nomme les assertions qui manquent, elle ne refuse rien.
 */
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
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
const CRITICITES = { low: "basse", medium: "moyenne", high: "haute" };
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
/** Un jour du calendrier écrit `AAAA-MM-JJ` (`2026-02-30` et `2026-13-45` n'en sont pas). */
const jourValide = (v) => {
  const t = Date.parse(`${v}T00:00:00Z`);
  return JOUR.test(v) && !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
};

/**
 * La mesure de chaque règle : ses mutants tués et survivants (un fichier partagé compte pour chacune de ses règles),
 * et son score en pour cent, ou `null` quand aucun de ses mutants n'est atteint par un test rejoué (« non mesurée »).
 */
export function mesure(regles, mutation, versDepot = (c) => c, date = null) {
  const parFichier = new Map();
  for (const [cle, f] of Object.entries(mutation?.files ?? {})) parFichier.set(versDepot(cle), f?.mutants ?? []);
  return {
    date,
    regles: regles.map(({ regle, criticite = null, fichiers }) => {
      const mutants = [...new Set(fichiers)].flatMap((f) => parFichier.get(f) ?? []);
      const tues = mutants.filter((m) => TUES.has(m.status)).length;
      const survivants = mutants.filter((m) => SURVIVANTS.has(m.status)).length;
      const atteints = tues + mutants.filter((m) => m.status === "Survived").length;
      return { regle, criticite, tues, survivants, score: atteints ? Math.round((100 * tues) / (tues + survivants)) : null };
    }),
  };
}

/** Une mesure publiée, depuis son texte ; `null` si elle ne se lit pas (absente, tronquée, d'une autre forme). */
export function lireMesure(texte) {
  try {
    const m = JSON.parse(texte);
    if (typeof m?.date !== "string" || !Array.isArray(m.regles)) return null;
    return m.regles.every((r) => typeof r?.regle === "string" && (r.score === null || Number.isFinite(r.score))) ? m : null;
  } catch {
    return null;
  }
}

/** Les baisses de score des règles moyennes d'aujourd'hui, mesurées les deux fois : `[{ regle, avant, apres }]`. */
export function baisses(precedente, actuelle) {
  const avant = new Map((precedente?.regles ?? []).map((r) => [r.regle, r.score]));
  return actuelle.regles
    .filter((r) => r.criticite === "medium" && r.score !== null && Number.isFinite(avant.get(r.regle)) && r.score < avant.get(r.regle))
    .map((r) => ({ regle: r.regle, avant: avant.get(r.regle), apres: r.score }));
}

/**
 * @param regles    `[{ regle, fichiers }]` de `perimetre` (ou `perimetreDuPaquet`).
 * @param mutation  le JSON du reporter `json` de Stryker (`files[chemin].mutants[]`).
 * @param versDepot convertit une clé de `mutation.files` en chemin du dépôt (défaut : identité).
 * @param ecartes   `[{ regle, chemin, motif }]` de `perimetre` : la section « Hors périmètre ».
 * @param ailleurs  les fichiers prouvés d'un autre paquet (`perimetreDuPaquet().ailleurs`) : ils ne sont pas mutés ici.
 * @param options   `date` (la date de la mesure, dite en tête) ; `utc` : vrai quand cette date est le jour UTC du passage,
 *                  pas une `--date` donnée ; `precedente` : la mesure précédente (`null` si elle ne se lit pas) ; absente,
 *                  la section des baisses n'est pas écrite.
 */
export function synthese(regles, mutation, versDepot = (c) => c, ecartes = [], ailleurs = [], options = {}) {
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
    "# Mutation sur les règles prouvées et partielles",
    "",
    `${regles.length} règle(s), ${fichiers} fichier(s). ` +
      (mesures ? `Score : ${Math.round((100 * comptes.tues) / mesures)} % (${comptes.tues} tués, ${comptes.survivants} survivants).` : "Aucun mutant mesuré."),
    "",
    "Pas de plancher : ce rapport nomme les assertions qui manquent, il ne refuse rien.",
  ];
  if (options.date) lignes.splice(3, 0, "", `Mesure du ${ligne(options.date)}${options.utc ? " (jour UTC du passage)" : ""}.`);
  const parRegle = mesure(regles, mutation, versDepot).regles;
  if (Object.hasOwn(options, "precedente")) {
    lignes.push("", "## Baisses sur une règle moyenne", "");
    if (!options.precedente) lignes.push("Pas de mesure précédente lisible : aucune baisse ne se juge.");
    else {
      const b = baisses(options.precedente, { regles: parRegle });
      if (!b.length) lignes.push(`Aucune depuis la mesure du ${ligne(options.precedente.date)}.`);
      for (const x of b) lignes.push(`- ${ligne(x.regle)} : ${x.avant} % le ${ligne(options.precedente.date)}, ${x.apres} % aujourd'hui`);
    }
  }
  regles.forEach(({ regle, fichiers: fs }, rang) => {
    const parChemin = fs.map((f) => ({
      f,
      survivants: (parFichier.get(f) ?? []).filter((m) => SURVIVANTS.has(m.status)).sort((a, b) => (a.location?.start?.line ?? 0) - (b.location?.start?.line ?? 0)),
    }));
    const total = parChemin.reduce((n, x) => n + x.survivants.length, 0);
    lignes.push("", `## ${ligne(regle)} — ${total ? `${total} survivant(s)` : "aucun survivant"}`);
    const mr = parRegle[rang];
    lignes.push(
      "",
      `Criticité : ${CRITICITES[mr.criticite] ?? "à classer"}. ` +
        (mr.score === null
          ? "Non mesurée : aucun mutant de son code n'est atteint par un test rejoué (preuves sur base, ou hors de Stryker) ; jamais « 0 % »."
          : `Score : ${mr.score} % (${mr.tues} tués, ${mr.survivants} survivants).`),
    );
    for (const { f, survivants } of parChemin) {
      lignes.push("", `- ${code(f, 200)} — ${survivants.length ? `${survivants.length} survivant(s)` : "aucun survivant"}`);
      for (const m of survivants) {
        const ou = m.location?.start?.line ?? "?";
        lignes.push(`  - ligne ${ou} : ${ligne(m.mutatorName) || "?"}${m.replacement ? ` → ${code(m.replacement)}` : ""} (${m.status === "NoCoverage" ? "aucun test ne l'atteint" : "survécu"})`);
      }
    }
  });
  lignes.push("", "## Hors périmètre", "");
  if (!ecartes.length) lignes.push("Aucun.");
  for (const e of ecartes) lignes.push(`- ${ligne(e.regle)} : ${code(e.chemin, 200)} — ${e.motif}`);
  if (ailleurs.length) {
    lignes.push("", "## Dans un autre paquet", "", "Prouvés mais pas mutés ici : la configuration de leur paquet les mute.", "");
    for (const f of ailleurs) lignes.push(`- ${code(f, 200)}`);
  }
  return `${lignes.join("\n")}\n`;
}

/**
 * Ce que le point d'entrée écrit : la synthèse, ou la raison pour laquelle il n'y en a pas. `options` : `date` ;
 * `mesure`, le fichier où écrire la mesure en JSON ; `precedente`, le fichier de la mesure précédente (absent ou
 * illisible : « pas de mesure précédente lisible »).
 */
export function texteDuPaquet(racine = racineDuDepot(), cwd = process.cwd(), options = {}) {
  const p = perimetreDuPaquet(racine, cwd);
  if (!p.fichiers.length) return `Mutation sur les règles prouvées et partielles : périmètre vide — ${p.raison}\n`;
  const json = join(cwd, RAPPORT_JSON);
  if (!existsSync(json)) return "Pas de rapport de mutation (passage interrompu).\n";
  let mutation;
  try {
    mutation = JSON.parse(readFileSync(json, "utf8"));
  } catch {
    return "Pas de rapport de mutation (rapport illisible, passage interrompu).\n";
  }
  const versDepot = (c) => relative(racine, resolve(cwd, c)).split(sep).join("/");
  const utc = options.date === undefined;
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  if (options.mesure) writeFileSync(resolve(cwd, options.mesure), `${JSON.stringify(mesure(p.regles, mutation, versDepot, date), null, 2)}\n`);
  const avecPrecedente = options.precedente === undefined ? {} : { precedente: existsSync(resolve(cwd, options.precedente)) ? lireMesure(readFileSync(resolve(cwd, options.precedente), "utf8")) : null };
  return synthese(p.regles, mutation, versDepot, p.ecartes, p.ailleurs, { date, utc, ...avecPrecedente });
}

/** Les options du point d'entrée ; `null` sur un usage faux. */
export function lireOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const [nom, valeur] = [args[i], args[i + 1]];
    if (!["--date", "--mesure", "--precedente"].includes(nom) || valeur === undefined || valeur.startsWith("--")) return null;
    if (nom === "--date" && !jourValide(valeur)) return null;
    options[nom.slice(2)] = valeur;
  }
  return options;
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (estPointEntree()) {
  const options = lireOptions(process.argv.slice(2));
  if (options === null) {
    process.stderr.write("usage : node scripts/verify/mutation-regles-synthese.mjs [--date AAAA-MM-JJ] [--mesure <fichier>] [--precedente <fichier>]\n");
    process.exit(2);
  }
  process.stdout.write(texteDuPaquet(racineDuDepot(), process.cwd(), options));
}
