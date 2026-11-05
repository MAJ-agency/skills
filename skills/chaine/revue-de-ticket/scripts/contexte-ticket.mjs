#!/usr/bin/env node
/**
 * Contexte d'un ticket pour la revue de ticket (skill `revue-de-ticket`, axe Ticket) : le ticket
 * entier, la ligne de sa spec qui le concerne, puis chaque règle métier et chaque ADR qu'ils
 * citent, telles que le dépôt les écrit. Le sous-agent relit le diff contre ce contexte, et rien
 * d'autre : il n'explore pas le dépôt pour deviner ce que le ticket voulait.
 *
 * Règles cherchées sous deux formes, celles des projets connus : une ligne de registre markdown
 * (`docs/metier/regles/<TRI>-regles.md`, ligne de table qui commence par `| <ID> |`) ou une
 * entrée d'un `rules.json` (`federations/<slug>/rules.json`, objet dont `id` ou `code` vaut
 * l'identifiant). ADR : le fichier de `docs/**` dont le nom commence par l'identifiant.
 *
 * Usage : node scripts/chaine/contexte-ticket.mjs <SOC-1.03> [> <scratchpad>/revue/contexte.md]
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 * Sorties : 0 · 2 usage ou ticket introuvable.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { lireTicket, specDuTicket } from "../docs/identifiants.mjs";

const ROOT = process.env.PROJET_RACINE ?? new URL("../..", import.meta.url).pathname;
const id = (process.argv[2] ?? "").toUpperCase();
if (!lireTicket(id)) {
  console.error("Usage : node scripts/chaine/contexte-ticket.mjs <PRÉFIXE-n.NN>   (ex. SOC-1.03)");
  process.exit(2);
}

/** Tous les fichiers sous `dir` (récursif), hors node_modules. */
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

// ── Le ticket et sa spec ───────────────────────────────────────────────────────────────
const nn = id.split(".")[1];
const spec = id.split(".")[0];
const ticket = docs.find((p) => /\/issues\/[^/]+\.issue\.md$/.test(p) && !/\/issues\/archive\//.test(p) && basename(p).startsWith(`${spec}-`) && basename(p).endsWith(`.${nn}.issue.md`));
if (!ticket) {
  console.error(`contexte-ticket : ticket ${id} introuvable sous docs/`);
  process.exit(2);
}
const texteTicket = lire(ticket);
const fichierSpec = docs.find((p) => basename(p).startsWith(`${spec}-`) && p.endsWith(".spec.md"));
const ligneSpec = fichierSpec ? lire(fichierSpec).split("\n").filter((l) => l.includes(`${id}`) || l.includes(`${spec}.${nn}`) || new RegExp(`^\\|\\s*${nn}\\s*\\|`).test(l)) : [];

// ── Règles et ADR cités ────────────────────────────────────────────────────────────────
const corpus = texteTicket + "\n" + ligneSpec.join("\n");
const cites = [...new Set(corpus.match(/\b[A-Z]{2,}(?:-[A-Z]{2,})*-\d+\b/g) ?? [])].filter((c) => c !== spec && !c.startsWith(`${spec}.`)).sort();
const registresMd = docs.filter((p) => /regles?\.md$/.test(p) || /\/regles\//.test(p));
const registresJson = walk(join(ROOT, "federations")).filter((p) => basename(p) === "rules.json");

function regle(code) {
  const trouvees = [];
  for (const p of registresMd) {
    for (const l of lire(p).split("\n")) if (new RegExp(`^\\|\\s*${code}\\s*\\|`).test(l)) trouvees.push(`- ${relative(ROOT, p)} :\n  ${l.trim()}`);
  }
  for (const p of registresJson) {
    try {
      const json = JSON.parse(lire(p));
      const liste = Array.isArray(json) ? json : (json.rules ?? json.regles ?? Object.values(json).flat());
      for (const r of liste) if (r && (r.id === code || r.code === code)) trouvees.push(`- ${relative(ROOT, p)} :\n  ${JSON.stringify(r)}`);
    } catch {
      /* pas un registre */
    }
  }
  return trouvees;
}
const adr = (code) => docs.filter((p) => basename(p).startsWith(`${code}-`) && p.endsWith(".md") && !p.endsWith(".spec.md") && !p.includes("/issues/"));

// ── Sortie ─────────────────────────────────────────────────────────────────────────────
const out = [];
out.push(`# Contexte du ticket ${id}`, "", `## Ticket — ${relative(ROOT, ticket)}`, "", texteTicket.trim(), "");
out.push(`## Spec — ${fichierSpec ? relative(ROOT, fichierSpec) : "introuvable"}`, "", ...(ligneSpec.length ? ligneSpec.map((l) => l.trim()) : ["(aucune ligne de la spec ne cite ce ticket)"]), "");
out.push("## Règles et décisions citées", "");
if (cites.length === 0) out.push("(aucune)");
for (const code of cites) {
  const r = regle(code);
  const a = adr(code);
  if (r.length) out.push(`### ${code} (règle)`, ...r, "");
  else if (a.length) out.push(`### ${code} (ADR)`, ...a.map((p) => `- ${relative(ROOT, p)} : ${lire(p).split("\n")[0].replace(/^#\s*/, "")}`), "");
  else out.push(`### ${code}`, "- introuvable dans docs/ ni federations/ : le ticket cite un identifiant que le dépôt ne porte pas", "");
}
console.log(out.join("\n"));
