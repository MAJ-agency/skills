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
// .claude/chaine.json ; sans ce fichier ou sans cette clé, rien à contrôler. Seuls les fichiers
// `<AAAAMMJJHHMM>-<slug>.ts` comptent (convention du socle API) ; un autre format est ignoré.
//
// Usage : node migrations-ordre.mjs <réf base> <réf tête>      (depuis la racine du dépôt)
// Sortie 0 ordre bon · 1 refus, motif (fichier à renommer, horodatage libre suivant) sur la sortie.
// =============================================================================
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const FORME = /^(\d{12})-.+\.ts$/;

/** Horodatage `AAAAMMJJHHMM` d'un nom de migration, ou null. */
export function horodatage(nom) {
  return FORME.exec(nom.split("/").pop())?.[1] ?? null;
}

/** Horodatage + 10 minutes, au même format (UTC). */
export function plus10Minutes(h) {
  const d = new Date(
    Date.UTC(+h.slice(0, 4), +h.slice(4, 6) - 1, +h.slice(6, 8), +h.slice(8, 10), +h.slice(10, 12)),
  );
  d.setUTCMinutes(d.getUTCMinutes() + 10);
  return d.toISOString().replace(/\D/g, "").slice(0, 12);
}

/**
 * Règle pure. `base` et `ajoutees` : noms de fichiers de migration.
 * Renvoie la liste des refus : { fichier, horodatage, dernier, propose }.
 */
export function controlerOrdre({ base, ajoutees }) {
  const pris = new Set(base.map(horodatage).filter(Boolean));
  const dernier = [...pris].sort().at(-1);
  if (!dernier) return [];
  const refus = [];
  let plancher = dernier;
  for (const fichier of [...ajoutees].sort()) {
    const h = horodatage(fichier);
    if (!h) continue;
    if (h > dernier) {
      plancher = h > plancher ? h : plancher;
      continue;
    }
    let propose = plus10Minutes(plancher);
    while (pris.has(propose)) propose = plus10Minutes(propose);
    pris.add(propose);
    plancher = propose;
    refus.push({ fichier, horodatage: h, dernier, propose });
  }
  return refus;
}

export function message(refus) {
  return refus
    .map(
      (r) =>
        `migration ${r.fichier} : horodatage ${r.horodatage} pas postérieur à la dernière migration de develop (${r.dernier}) ; ` +
        `renommer en ${r.propose}-${r.fichier.replace(/^\d{12}-/, "")} (git mv, et corriger la réservation dans la carte)`,
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

if (import.meta.url === `file://${process.argv[1]}`) {
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
