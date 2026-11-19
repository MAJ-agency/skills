#!/usr/bin/env node
/**
 * Contexte d'un ticket pour la revue de ticket (skill `revue-de-ticket`, axe Ticket) : le ticket
 * entier, la ligne de sa spec qui le concerne, ses règles, puis chaque identifiant qu'ils citent,
 * tels que le dépôt les écrit. Le sous-agent relit le diff contre ce contexte, et rien d'autre : il
 * n'explore pas le dépôt pour deviner ce que le ticket voulait.
 *
 * Ordre de la sortie :
 *   1. le ticket, tel quel ;
 *   2. sa ligne de spec (la ligne qui cite le ticket, ou la ligne de table `| <NN> |`) ;
 *   3. « Règles du ticket » : la ligne `Règles:` de l'en-tête, la liste fermée des règles dont l'axe
 *      Ticket (`T3`) relit les preuves, puis chaque fichier de règle rendu tel quel, en-tête YAML
 *      compris (c'est là que se lit si une règle déclare ses cas, clé `cases`) ;
 *   4. « Identifiants cités » : le reste du corps et la ligne de spec (règles, ADR, specs, tickets,
 *      design, guides, demandes).
 * Chaque identifiant est marqué trouvé ou introuvable, avec le chemin cherché.
 *
 * Où chaque type se cherche (`docs/methode/nomenclature.md`) :
 *   RULE           docs/metier/regles/<ctx>/<ID>.md, le contexte en minuscules, sans slug
 *   SPEC           docs/**\/<ID>-<slug>.spec.md, où qu'elle soit rangée (le nom porte l'identité)
 *   ticket         docs/**\/issues/<SPEC>-<slug>.<NN>.issue.md, archive comprise
 *   ADR, DSG, DOC  le fichier de docs/** dont le nom commence par `<ID>-` ; deux candidats ou plus
 *                  sont tous listés, aucun n'est choisi
 *   REQ            docs/demandes/<ctx>/<ID>-<slug>.md
 * Une règle d'un autre contexte que celui du ticket et `ALL` est rendue, avec une ligne qui le
 * signale : c'est le gate des tickets qui la refuse, pas la revue.
 *
 * Tous les identifiants se lisent par `scripts/docs/identifiants.mjs`, la grammaire
 * `<TYPE>_<CTX>_<TRI>-<n>` ; ce script n'en écrit aucune de son côté. Les anciennes formes de
 * registre (tableau `<TRI>-regles.md`, `rules.json`) ne sont lues nulle part.
 *
 * Usage : node scripts/chaine/contexte-ticket.mjs <SPEC_ALL_SOC-1.03> [> <scratchpad>/revue/contexte.md]
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 * Sorties : 0 · 2 usage ou ticket introuvable.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import {
  dossierDuContexte,
  estArchive,
  fichierDuTicket,
  identifiantDeLaDemande,
  identifiantDeLaRegle,
  identifiantDeLaSpec,
  identifiantsCites,
  lireIdentifiant,
  lireTicket,
  litteral,
  texteCite,
} from "../docs/identifiants.mjs";

const ROOT =
  process.env.PROJET_RACINE ?? new URL("../..", import.meta.url).pathname;
const id = (process.argv[2] ?? "").toUpperCase();
if (!lireTicket(id)) {
  console.error(
    "Usage : node scripts/chaine/contexte-ticket.mjs <SPEC>.<NN>   (ex. SPEC_ALL_SOC-1.03)",
  );
  process.exit(2);
}

/** Tous les fichiers sous `dir` (récursif), hors node_modules et dossiers cachés. */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const docs = walk(join(ROOT, "docs"));
const lire = (p) => readFileSync(p, "utf8");
const rel = (p) => relative(ROOT, p);
/** Le titre d'un document : son premier titre `# …`, sinon sa première ligne non vide. */
function titre(p) {
  const lignes = lire(p).split("\n");
  const l = lignes.find((x) => /^#\s/.test(x)) ?? lignes.find((x) => x.trim());
  return (l ?? "").replace(/^#\s*/, "").trim();
}

// ── Le ticket et sa spec ───────────────────────────────────────────────────────────────
const { spec, index: nn } = lireTicket(id);
const contexteDuTicket = lireIdentifiant(id).contexte;
const ticket = docs.find((p) => fichierDuTicket(id).test(p) && !estArchive(p));
if (!ticket) {
  console.error(`contexte-ticket : ticket ${id} introuvable sous docs/`);
  process.exit(2);
}
const texteTicket = lire(ticket);
const fichierSpec = docs.find((p) => identifiantDeLaSpec(basename(p)) === spec);
const ligneSpec = fichierSpec
  ? lire(fichierSpec)
      .split("\n")
      .filter(
        (l) =>
          texteCite(l, id) ||
          new RegExp(`^\\|\\s*${litteral(nn)}\\s*\\|`).test(l),
      )
  : [];

// ── La ligne `Règles:` de l'en-tête (avant le premier titre de section) ──────────────────
const entete = texteTicket.split(/\n## /)[0];
const ligneRegles = entete
  .split("\n")
  .find((l) => /^Règles\s*:/.test(l))
  ?.trim();
const valeurRegles = (ligneRegles ?? "")
  .replace(/^Règles\s*:/, "")
  .replace(/\s#.*$/, "");
const reglesDuTicket = identifiantsCites(valeurRegles);
/** Un jeton de la ligne sans les `(` de tête ni les `.` et `)` de queue, en un seul passage. */
function rognerJeton(jeton) {
  let debut = 0;
  let fin = jeton.length;
  while (debut < fin && jeton[debut] === "(") debut++;
  while (fin > debut && (jeton[fin - 1] === "." || jeton[fin - 1] === ")")) fin--;
  return jeton.slice(debut, fin);
}
/** Ce que la ligne porte et que la grammaire ne lit pas comme identifiant (`LIC-3`, `ALL-LIC-3`). */
const jetonsIllisibles = valeurRegles
  .split(/[\s,;`]+/)
  .map(rognerJeton)
  .filter((j) => j && !/^[—–-]$/.test(j) && !lireIdentifiant(j));

// ── Les identifiants cités ailleurs ──────────────────────────────────────────────────────
const corps = ligneRegles ? texteTicket.replace(ligneRegles, "") : texteTicket;
const cites = identifiantsCites(corps + "\n" + ligneSpec.join("\n"))
  .filter((c) => c !== spec && c !== id && !reglesDuTicket.includes(c))
  .sort();

// ── Où chaque type se cherche ────────────────────────────────────────────────────────────
function cheminDeLaRegle(code) {
  const { contexte } = lireIdentifiant(code);
  return join(ROOT, "docs/metier/regles", dossierDuContexte(contexte), `${code}.md`);
}

/** Une règle : son fichier rendu tel quel, ou le chemin cherché ; le contexte signalé. */
function rendreRegle(code, marque) {
  const lignes = [`### ${code} (${marque})`];
  const { contexte } = lireIdentifiant(code);
  if (contexte !== "ALL" && contexte !== contexteDuTicket)
    lignes.push(
      `- contexte différent du ticket : ${contexte}, le ticket est ${contexteDuTicket}`,
    );
  const chemin = cheminDeLaRegle(code);
  // Le nom exact, casse comprise : un système de fichiers insensible à la casse ne le rattrape pas.
  const present =
    existsSync(chemin) &&
    readdirSync(dirname(chemin)).some((n) => identifiantDeLaRegle(n) === code);
  if (!present) {
    lignes.push(`- introuvable : ${rel(chemin)}`, "");
    return lignes;
  }
  const texte = lire(chemin).trim();
  // La clôture est plus longue que toute suite d'accents graves du fichier : il est rendu entier.
  const cloture = "`".repeat(
    Math.max(3, ...(texte.match(/`+/g) ?? []).map((m) => m.length)) + 1,
  );
  lignes.push(
    `- trouvée : ${rel(chemin)}`,
    "",
    `${cloture}markdown`,
    texte,
    cloture,
    "",
  );
  return lignes;
}

/** Fichiers candidats d'un document cité, et le motif cherché, selon son type. */
function document(code, lu) {
  if (lireTicket(code))
    return {
      cherche: `docs/**/issues/${lireTicket(code).spec}-<slug>.${lu.index}.issue.md`,
      fichiers: docs.filter((p) => fichierDuTicket(code).test(p)),
    };
  if (lu.type === "SPEC")
    return {
      cherche: `docs/**/${code}-<slug>.spec.md`,
      fichiers: docs.filter((p) => identifiantDeLaSpec(basename(p)) === code),
    };
  if (lu.type === "REQ") {
    const dossier = `docs/demandes/${dossierDuContexte(lu.contexte)}/`;
    return {
      cherche: `${dossier}${code}-<slug>.md`,
      fichiers: docs.filter(
        (p) =>
          rel(p) === dossier + basename(p) &&
          identifiantDeLaDemande(basename(p)) === code,
      ),
    };
  }
  // ADR, DSG, DOC : le nom commence par l'identifiant suivi d'un tiret.
  return {
    cherche: `docs/**/${code}-*`,
    fichiers: docs.filter((p) => basename(p).startsWith(`${code}-`)),
  };
}

const NATURE = {
  ADR: "ADR",
  DSG: "design",
  DOC: "guide",
  REQ: "demande",
  SPEC: "spec",
};

function rendreCite(code) {
  const lu = lireIdentifiant(code);
  if (lu.type === "RULE") return rendreRegle(code, "règle citée");
  const nature = lu.index !== undefined ? "ticket" : NATURE[lu.type];
  const { cherche, fichiers } = document(code, lu);
  const lignes = [`### ${code} (${nature})`];
  if (fichiers.length === 0) lignes.push(`- introuvable : ${cherche}`);
  else if (fichiers.length === 1)
    lignes.push(
      `- trouvé${estArchive(fichiers[0]) ? " (archivé)" : ""} : ${rel(fichiers[0])} — ${titre(fichiers[0])}`,
    );
  else
    lignes.push(
      `- ${fichiers.length} candidats pour ${cherche}, aucun n'est choisi :`,
      ...fichiers.map((p) => `  - ${rel(p)} — ${titre(p)}`),
    );
  lignes.push("");
  return lignes;
}

// ── Sortie ─────────────────────────────────────────────────────────────────────────────
const out = [
  `# Contexte du ticket ${id}`,
  "",
  `## Ticket — ${rel(ticket)}`,
  "",
  texteTicket.trim(),
  "",
  `## Spec — ${fichierSpec ? rel(fichierSpec) : `introuvable : docs/**/${spec}-<slug>.spec.md`}`,
  "",
  ...(ligneSpec.length
    ? ligneSpec.map((l) => l.trim())
    : ["(aucune ligne de la spec ne cite ce ticket)"]),
  "",
  "## Règles du ticket",
  "",
  ligneRegles ?? "(le ticket n'a pas de ligne `Règles:`)",
  "",
];
for (const j of jetonsIllisibles)
  out.push(
    `### ${j}`,
    "- illisible : la ligne `Règles:` porte un jeton qui n'est pas un identifiant de la grammaire",
    "",
  );
for (const code of reglesDuTicket) {
  if (lireIdentifiant(code).type !== "RULE" || lireTicket(code)) {
    out.push(
      `### ${code}`,
      "- pas une règle : la ligne `Règles:` ne porte que des identifiants `RULE_…`",
      "",
    );
    continue;
  }
  out.push(...rendreRegle(code, "règle du ticket"));
}
out.push("## Identifiants cités", "");
if (cites.length === 0) out.push("(aucun)", "");
for (const code of cites) out.push(...rendreCite(code));
console.log(out.join("\n").trimEnd());
