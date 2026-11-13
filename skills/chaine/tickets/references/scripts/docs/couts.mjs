#!/usr/bin/env node
/**
 * Registre des coûts de production, généré depuis les cartes de chantier.
 *
 * Pourquoi. Le coût d'une session ne se lit que par `get_session`. Le conducteur le relève dans la
 * section `## Coût` de sa carte (`docs/agents/chaine-de-production.md` § 6). Le coût de production
 * restait donc éparpillé, une carte par chantier. Ce script les agrège en un seul registre :
 * `docs/agents/couts.md`. C'est un index généré (`scripts/docs/index-generes.json`) : le capitaine
 * le régénère après chaque fusion, personne ne l'édite à la main, et deux chantiers en parallèle
 * ne s'y marchent pas dessus. La carte reste la seule source.
 *
 * Usage : node scripts/docs/couts.mjs [--verify]
 *   --verify : n'écrit rien, sort en 1 si le registre n'est pas à jour
 *     ou si une cellule « Coût $ » n'est ni un montant ni une valeur attendue.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { lireTicket } from "./identifiants.mjs";

export const REGISTRE = "docs/agents/couts.md";

/** `68,92` ou `68.92` → 68.92 ; tout le reste → null. */
export function montant(texte) {
  const t = texte.trim().replace(/\s/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

/** 68.92 → `68,92`. */
export function enEuros(n) {
  return n.toFixed(2).replace(".", ",");
}

const cellules = (ligne) =>
  ligne
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/**
 * Une carte → son chantier, sa phase, ses lignes de coût et ses lignes illisibles. Une ligne
 * sans montant (gabarit, relevé à venir, cellule vide) est ignorée sans bruit ; une ligne dont la
 * cellule porte autre chose est rendue dans `illisibles` (`{ cout, ligne }`) : `--verify` la refuse.
 */
export function lireCarte(chemin, texte) {
  const sujet = /^Sujet:[ \t]*(?:sujet\/)?(\S+)/m.exec(texte);
  const phase = /^Phase:[ \t]*(\S.*)$/m.exec(texte);
  const section = /^## Coût[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texte);
  const lignes = [];
  const illisibles = [];
  if (section) {
    const table = section[1].split("\n").filter((l) => l.trim().startsWith("|"));
    for (const l of table.slice(2)) {
      const [role = "", ticket = "", session = "", modele = "", contexte = "", cout = ""] =
        cellules(l);
      const valeur = montant(cout);
      if (valeur === null) {
        // Un gabarit, un relevé à venir ou une cellule vide sont attendus ; tout le reste est une
        // ligne mal écrite qui fausserait le total sans bruit.
        if (cout && !/^\{\{.*\}\}$|^—$|^à relever$/i.test(cout)) {
          illisibles.push({ cout, ligne: l.trim() });
        }
        continue;
      }
      lignes.push({ role, ticket, session, modele, contexte, cout: valeur });
    }
  }
  return {
    chemin,
    chantier: sujet ? sujet[1] : chemin.replace(/^.*\//, "").replace(/\.map\.md$/, ""),
    phase: phase ? phase[1].trim() : "—",
    lignes,
    illisibles,
  };
}

/** Les messages d'erreur des lignes illisibles de toutes les cartes, une carte et une ligne par message. */
export function messagesIllisibles(cartes) {
  return cartes.flatMap((c) =>
    c.illisibles.map((i) => `couts : ${c.chemin} — coût illisible « ${i.cout} », ligne ignorée : ${i.ligne}`),
  );
}

const somme = (lignes) => lignes.reduce((s, l) => s + l.cout, 0);
const estTicket = (t) => lireTicket(t) !== null;

/** Bilan d'un chantier : total, part des filles, tickets distincts et moyenne par ticket. */
export function bilan(carte) {
  const filles = carte.lignes.filter((l) => l.role === "fille");
  const tickets = new Set(filles.map((l) => l.ticket).filter(estTicket));
  const coutFilles = somme(filles);
  return {
    total: somme(carte.lignes),
    filles: coutFilles,
    tickets: tickets.size,
    parTicket: tickets.size ? coutFilles / tickets.size : null,
  };
}

/** Une table Markdown alignée comme Prettier l'écrit : le registre sort déjà formaté. */
export function table(entetes, lignes) {
  const largeur = (t) => [...t].length;
  const l = entetes.map((e, i) => Math.max(3, largeur(e), ...lignes.map((r) => largeur(r[i]))));
  const ligne = (r) => `| ${r.map((c, i) => c + " ".repeat(l[i] - largeur(c))).join(" | ")} |`;
  return [ligne(entetes), `| ${l.map((n) => "-".repeat(n)).join(" | ")} |`, ...lignes.map(ligne)];
}

/** Le registre complet, en Markdown (déterministe : cartes triées par chemin). */
export function enMarkdown(cartes) {
  const triees = [...cartes]
    .filter((c) => c.lignes.length)
    .sort((a, b) => (a.chemin < b.chemin ? -1 : 1));
  const toutes = triees.flatMap((c) => c.lignes);
  const tousTickets = triees.reduce((n, c) => n + bilan(c).tickets, 0);
  const coutFilles = triees.reduce((n, c) => n + bilan(c).filles, 0);
  const out = [
    "# Registre des coûts de production",
    "",
    "> Généré par `node scripts/docs/couts.mjs` depuis la section `## Coût` des cartes de chantier",
    "> (`docs/**/*.map.md`). Ne pas éditer à la main : corriger la carte, le capitaine régénère ce",
    "> registre après chaque fusion. Relevé des coûts : `docs/agents/chaine-de-production.md` § 6.",
    "",
    `**Total : ${enEuros(somme(toutes))} $** sur ${toutes.length} session(s) et ${triees.length} chantier(s).` +
      (tousTickets
        ? ` Filles : ${enEuros(coutFilles)} $ pour ${tousTickets} ticket(s), soit ${enEuros(coutFilles / tousTickets)} $ par ticket.`
        : ""),
    "",
    "## Par chantier",
    "",
    ...table(
      ["Chantier", "Phase", "Sessions", "Tickets", "Filles $", "Total $", "Par ticket $", "Carte"],
      triees.map((c) => {
        const b = bilan(c);
        return [
          c.chantier,
          c.phase,
          String(c.lignes.length),
          String(b.tickets),
          enEuros(b.filles),
          enEuros(b.total),
          b.parTicket === null ? "—" : enEuros(b.parTicket),
          `\`${c.chemin}\``,
        ];
      }),
    ),
    "",
    "## Par session",
    "",
    ...table(
      ["Chantier", "Rôle", "Ticket", "Session", "Modèle", "Contexte max", "Coût $"],
      triees.flatMap((c) =>
        c.lignes.map((l) => [
          c.chantier,
          l.role,
          l.ticket,
          l.session,
          l.modele,
          l.contexte,
          enEuros(l.cout),
        ]),
      ),
    ),
  ];
  return `${out.join("\n")}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const racine = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const cartes = execFileSync("git", ["ls-files", "--full-name", ":/docs"], {
    encoding: "utf8",
    cwd: racine,
  })
    .split("\n")
    .filter((f) => f.endsWith(".map.md") && !f.includes("/gabarits/"))
    .map((f) => lireCarte(f, readFileSync(join(racine, f), "utf8")));
  const illisibles = messagesIllisibles(cartes);
  for (const m of illisibles) console.error(m);
  const attendu = enMarkdown(cartes);
  const cible = join(racine, REGISTRE);
  if (process.argv.includes("--verify")) {
    const actuel = existsSync(cible) ? readFileSync(cible, "utf8") : "";
    if (illisibles.length) {
      console.error(
        `couts : ${illisibles.length} coût(s) illisible(s) — corriger la carte (un montant, \`à relever\`, \`—\` ou rien)`,
      );
      process.exit(1);
    }
    if (actuel !== attendu) {
      console.error(`couts : ${REGISTRE} n'est pas à jour — node scripts/docs/couts.mjs`);
      process.exit(1);
    }
    console.log(`couts : ${REGISTRE} à jour`);
  } else {
    writeFileSync(cible, attendu);
    console.log(`couts : ${REGISTRE} écrit (${cartes.length} carte(s))`);
  }
}
