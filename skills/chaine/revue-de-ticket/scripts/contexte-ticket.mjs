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
 * Le ticket, sa spec, leurs fichiers et les identifiants cités se lisent par
 * `scripts/docs/identifiants.mjs`, la grammaire `<TYPE>_<CTX>_<TRI>-<n>`. Une règle et une ADR citées
 * se cherchent encore par leur identifiant littéral, sous les deux formes de registre ci-dessus.
 *
 * Usage : node scripts/chaine/contexte-ticket.mjs <SPEC_ALL_SOC-1.03> [> <scratchpad>/revue/contexte.md]
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 * Sorties : 0 · 2 usage ou ticket introuvable.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  estArchive,
  fichierDuTicket,
  identifiantDeLaSpec,
  identifiantsCites,
  lireTicket,
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
/** Un identifiant devient un motif littéral : ses caractères spéciaux de regex sont échappés. */
const litteral = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── Le ticket et sa spec ───────────────────────────────────────────────────────────────
const { spec, index: nn } = lireTicket(id);
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
          l.includes(`${id}`) ||
          l.includes(`${spec}.${nn}`) ||
          new RegExp(`^\\|\\s*${litteral(nn)}\\s*\\|`).test(l),
      )
  : [];

// ── Règles et ADR cités ────────────────────────────────────────────────────────────────
const corpus = texteTicket + "\n" + ligneSpec.join("\n");
// Règle, ADR, spec ou ticket : `SPEC_ALL_SOC-1.06` n'est pas lu comme `SPEC_ALL_SOC-1`.
const cites = identifiantsCites(corpus)
  .filter((c) => c !== spec && c !== id)
  .sort();
const registresMd = docs.filter(
  (p) => /regles?\.md$/.test(p) || /\/regles\//.test(p),
);
const registresJson = walk(join(ROOT, "federations")).filter(
  (p) => basename(p) === "rules.json",
);

function regle(code) {
  const trouvees = [];
  for (const p of registresMd) {
    for (const l of lire(p).split("\n"))
      if (new RegExp(`^\\|\\s*${litteral(code)}\\s*\\|`).test(l))
        trouvees.push(`- ${relative(ROOT, p)} :\n  ${l.trim()}`);
  }
  for (const p of registresJson) {
    try {
      const json = JSON.parse(lire(p));
      const liste = Array.isArray(json)
        ? json
        : (json.rules ?? json.regles ?? Object.values(json).flat());
      for (const r of liste)
        if (r && (r.id === code || r.code === code))
          trouvees.push(`- ${relative(ROOT, p)} :\n  ${JSON.stringify(r)}`);
    } catch {
      /* pas un registre */
    }
  }
  return trouvees;
}
const adr = (code) =>
  docs.filter(
    (p) =>
      basename(p).startsWith(`${code}-`) &&
      p.endsWith(".md") &&
      !p.endsWith(".spec.md") &&
      !p.includes("/issues/"),
  );

// ── Sortie ─────────────────────────────────────────────────────────────────────────────
const out = [];
out.push(
  `# Contexte du ticket ${id}`,
  "",
  `## Ticket — ${relative(ROOT, ticket)}`,
  "",
  texteTicket.trim(),
  "",
);
out.push(
  `## Spec — ${fichierSpec ? relative(ROOT, fichierSpec) : "introuvable"}`,
  "",
  ...(ligneSpec.length
    ? ligneSpec.map((l) => l.trim())
    : ["(aucune ligne de la spec ne cite ce ticket)"]),
  "",
);
out.push("## Règles et décisions citées", "");
if (cites.length === 0) out.push("(aucune)");
for (const code of cites) {
  if (lireTicket(code)) {
    const t = docs.find((p) => fichierDuTicket(code).test(p));
    out.push(
      `### ${code} (ticket)`,
      t
        ? `- ${relative(ROOT, t)} : ${lire(t).split("\n")[0].replace(/^#\s*/, "")}`
        : "- introuvable dans docs/ : le ticket cité n'existe pas",
      "",
    );
    continue;
  }
  const r = regle(code);
  const a = adr(code);
  if (r.length) out.push(`### ${code} (règle)`, ...r, "");
  else if (a.length)
    out.push(
      `### ${code} (ADR)`,
      ...a.map(
        (p) =>
          `- ${relative(ROOT, p)} : ${lire(p).split("\n")[0].replace(/^#\s*/, "")}`,
      ),
      "",
    );
  else
    out.push(
      `### ${code}`,
      "- introuvable dans docs/ ni federations/ : le ticket cite un identifiant que le dépôt ne porte pas",
      "",
    );
}
console.log(out.join("\n"));
