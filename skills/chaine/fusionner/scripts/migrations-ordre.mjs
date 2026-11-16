// =============================================================================
// Ordre des migrations à l'arrivée dans develop.
//
// Le migrateur (Kysely, ordre strict) refuse une migration plus ancienne qu'une migration déjà
// jouée. Des chantiers parallèles réservent leurs horodatages dans leur carte et livrent dans
// un ordre imprévisible : seul l'ordre d'arrivée dans develop compte. Règle : une migration AJOUTÉE
// par la PR a un horodatage strictement postérieur à la dernière migration de la base (develop).
// Une sous-PR vers un sujet n'est pas concernée : on ne contrôle que les PR vers develop.
//
// Ajoutée = présente dans la tête, absente de la base. Le dossier vient de `migrations` dans
// .claude/chaine.json ; sans ce fichier ou sans cette clé, rien à contrôler. Deux formes comptent :
// Kysely, un fichier `<AAAAMMJJHHMM>-<slug>.ts` (convention du socle API), et Prisma, un dossier
// `<AAAAMMJJHHMMSS>_<slug>` ; un autre nom (`migration_lock.toml`, un README) est ignoré.
//
// Usage : node migrations-ordre.mjs <réf base> <réf tête>      (depuis la racine du dépôt)
// Sortie 0 ordre bon · 1 refus, motif (fichier à renommer, horodatage libre suivant) sur la sortie.
// =============================================================================
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FORMES = [/^(\d{12})-.+\.ts$/, /^(\d{14})_[^/]+$/];

/** Horodatage d'un nom de migration, chiffres tels qu'écrits (12 Kysely, 14 Prisma), ou null. */
export function horodatage(nom) {
  const dernier = nom.split("/").pop();
  for (const forme of FORMES) {
    const h = forme.exec(dernier)?.[1];
    if (h) return h;
  }
  return null;
}

/** Horodatage + 10 minutes (UTC), à la longueur reçue : 12 chiffres, ou 14 (secondes conservées). */
export function plus10Minutes(h) {
  const d = new Date(
    Date.UTC(+h.slice(0, 4), +h.slice(4, 6) - 1, +h.slice(6, 8), +h.slice(8, 10), +h.slice(10, 12), +(h.slice(12, 14) || 0)),
  );
  d.setUTCMinutes(d.getUTCMinutes() + 10);
  return d.toISOString().replace(/\D/g, "").slice(0, 14).slice(0, h.length);
}

const norm = (h) => h.padEnd(14, "0");

/**
 * Règle pure. `base` et `ajoutees` : noms de fichiers de migration.
 * Renvoie la liste des refus : { fichier, horodatage, dernier, propose }.
 */
export function controlerOrdre({ base, ajoutees }) {
  // Tout se compare sur 14 chiffres (Kysely complété de zéros) ; un projet n'a qu'une forme.
  const ecrits = new Map(); // 14 chiffres → chiffres tels qu'écrits
  for (const b of base) {
    const h = horodatage(b);
    if (h) ecrits.set(norm(h), h);
  }
  const pris = new Set(ecrits.keys());
  const dernier14 = [...pris].sort().at(-1);
  if (!dernier14) return [];
  const dernier = ecrits.get(dernier14);
  const refus = [];
  let plancher = dernier14;
  for (const fichier of [...ajoutees].sort()) {
    const h = horodatage(fichier);
    if (!h) continue;
    const h14 = norm(h);
    if (h14 > dernier14) {
      plancher = h14 > plancher ? h14 : plancher;
      continue;
    }
    let propose14 = plus10Minutes(plancher);
    while (pris.has(propose14)) propose14 = plus10Minutes(propose14);
    pris.add(propose14);
    plancher = propose14;
    refus.push({ fichier, horodatage: h, dernier, propose: propose14.slice(0, h.length) });
  }
  return refus;
}

export function message(refus) {
  return refus
    .map(
      (r) =>
        `migration ${r.fichier} : horodatage ${r.horodatage} pas postérieur à la dernière migration de develop (${r.dernier}) ; ` +
        `renommer en ${r.propose}${r.fichier.replace(/^\d{12,14}/, "")} (git mv, et corriger la réservation dans la carte)`,
    )
    .join(" ; ");
}

const liste = (ref, dossier) =>
  execFileSync("git", ["ls-tree", "--name-only", ref, dossier], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((c) => c.split("/").pop());

/** Les migrations refusées entre une base et une tête, lues dans git. */
export function refusEntre(base, tete, chaine = ".claude/chaine.json") {
  if (!existsSync(chaine)) return [];
  const dossier = JSON.parse(readFileSync(chaine, "utf8")).migrations;
  if (!dossier) return [];
  const d = dossier.endsWith("/") ? dossier : `${dossier}/`;
  const avant = liste(base, d);
  const apres = new Set(avant);
  return controlerOrdre({ base: avant, ajoutees: liste(tete, d).filter((f) => !apres.has(f)) });
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
  const [base, tete] = process.argv.slice(2);
  if (!base || !tete) {
    console.error("usage : node migrations-ordre.mjs <réf base> <réf tête>");
    process.exit(2);
  }
  const refus = refusEntre(base, tete);
  if (refus.length > 0) {
    console.log(message(refus));
    process.exit(1);
  }
}
