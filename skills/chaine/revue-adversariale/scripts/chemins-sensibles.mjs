// =============================================================================
// Chemins sensibles touchés par une branche (étape 2 de la revue adversariale).
//
// Lit `cheminsSensibles` dans `.claude/chaine.json` (dossier courant) et, sur l'entrée standard, les
// chemins d'un diff, un par ligne. Écrit `chemin<TAB>motif` pour chaque chemin qui touche un motif,
// rien sinon. Sortie 0 dans les deux cas, et sans `.claude/chaine.json` (aucun motif, comme le gate).
// Sortie 2 si le contrat est illisible, si `cheminsSensibles` n'est pas une liste de chaînes, ou si
// l'entrée est vide (diff vide, ou git a échoué en amont : jamais lu comme « rien de sensible »),
// motif sur la sortie d'erreur : un contrôle de sécurité échoue fermé, comme le gate.
//
// Usage : set -o pipefail; git -c core.quotepath=false diff --name-only --no-renames <base>...HEAD | node scripts/chaine/chemins-sensibles.mjs [<base>]
//
// Les motifs sont ceux du contrat de l'arbre de travail **et** ceux du contrat de la base (`lireBase` de
// revue-exigee.mjs, skill fusionner : à côté dans un projet) : une branche qui retire son propre chemin de
// `chaine.json` le garde sensible. `<base>` : celle du diff (`origin/develop`, `origin/sujet/<nom>`). Sans elle :
// le sujet du ticket de la branche (`sujet.sh de`, ticket lu dans le nom de branche par `identifiant.mjs`) s'il en
// déclare un et que `origin/sujet/<nom>` existe, sinon `origin/develop`. Hors d'un dépôt git, ou sans
// `origin/develop` ni base donnée : le contrat de l'arbre seul, dit sur la sortie d'erreur. Base donnée
// introuvable, contrat de base illisible, ou sujet du ticket qui ne se lit pas : chaque chemin est sensible
// (`chemin<TAB>(base illisible : …)`), jamais une garde ouverte. revue-exigee.mjs introuvable alors qu'une base
// est à lire : sortie 2.
//
// Le moteur des motifs est celui du gate `tickets` (`tickets/references/scripts/verify/tickets-regles.mjs`,
// `regexDuMotif` et `motifSensibleTouche`), recopié à l'identique ; `chemins-sensibles.test.mjs` garde la parité.
//
// Chaque ligne est lue décitée (git cite encore, sous `core.quotepath=false`, un chemin qui porte `"`, `\`,
// une tabulation ou un saut de ligne), en NFC (macOS écrit souvent en NFD) et sans casse (sur un système de
// fichiers insensible à la casse, `Scripts/agent/` est `scripts/agent/`), motifs compris ; une ligne citée mal formée : sortie 2. Le moteur reste celui du gate.
// =============================================================================
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
// Un outil de la chaîne : à côté (scripts/chaine/ d'un projet), sinon dans son skill du plugin.
const outil = (skill, nom) => [join(ICI, nom), join(ICI, "../..", skill, "scripts", nom)].find(existsSync);

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
  return new RegExp(`^${re}$`, 's');
}

/** Motif sensible touché par un chemin, ou `null` (copie de `motifSensibleTouche` du gate). */
function motifSensibleTouche(chemin, cheminsSensibles) {
  const c = chemin.replace(/^\.\//, "");
  return cheminsSensibles.find((motif) => regexDuMotif(motif).test(c)) ?? null;
}

const ECHAPPEMENTS = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, "\\": 92 };
/** Ligne de git décitée et en minuscules, `null` si sa citation est mal formée (copie de `cheminLu`, revue-exigee.mjs). */
function cheminLu(ligne) {
  const f = ligne.trim();
  if (!f.startsWith('"')) return f.normalize("NFC").toUpperCase().toLowerCase();
  if (f.length < 2 || !f.endsWith('"')) return null;
  const car = [...f.slice(1, -1)];
  const octets = [];
  for (let i = 0; i < car.length; i++) {
    if (car[i] === '"') return null;
    if (car[i] !== "\\") {
      octets.push(...Buffer.from(car[i]));
      continue;
    }
    const e = car[++i];
    const octal = car.slice(i, i + 3).join("");
    if (e in ECHAPPEMENTS) octets.push(ECHAPPEMENTS[e]);
    else if (/^[0-3][0-7]{2}$/.test(octal)) {
      octets.push(parseInt(octal, 8));
      i += 2;
    } else return null;
  }
  return Buffer.from(octets).toString("utf8").normalize("NFC").toUpperCase().toLowerCase();
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

/**
 * Base du diff quand l'appelant n'en donne pas : `{ ref }`, `{ illisible }`, ou `null` (pas de base : hors d'un
 * dépôt git, ou sans `origin/develop`).
 */
function baseParDefaut() {
  const git = (...a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  const existe = (ref) => {
    try {
      git("rev-parse", "--verify", "-q", `${ref}^{commit}`);
      return true;
    } catch {
      return false;
    }
  };
  let branche;
  try {
    branche = git("rev-parse", "--abbrev-ref", "HEAD");
  } catch {
    return null;
  }
  const identifiant = outil("fusionner", "identifiant.mjs");
  const ticket = identifiant ? spawnSync("node", [identifiant, "ticket-de-pr", "", branche], { encoding: "utf8" }).stdout?.trim() ?? "" : "";
  if (ticket) {
    const sujet = outil("sujet", "sujet.sh");
    if (!sujet) return { illisible: `sujet.sh introuvable : le sujet du ticket ${ticket} ne se lit pas` };
    const r = spawnSync("bash", [sujet, "de", ticket], { encoding: "utf8" });
    if (r.status !== 0) return { illisible: `sujet du ticket ${ticket} illisible (sujet.sh de, sortie ${r.status})` };
    const nom = r.stdout.trim().split("\n").pop();
    if (nom && existe(`origin/sujet/${nom}`)) return { ref: `origin/sujet/${nom}` };
  }
  return existe("origin/develop") ? { ref: "origin/develop" } : null;
}

/** Motifs du contrat de la base, ou `{ illisible }`. */
async function motifsDeLaBase(base) {
  if (base === null) {
    console.error("chemins-sensibles : aucune base (ni argument, ni origin/develop) : le contrat de l'arbre de travail seul");
    return [];
  }
  if (base.illisible) return base;
  const module = outil("fusionner", "revue-exigee.mjs");
  if (!module) throw new Error("revue-exigee.mjs introuvable (skill fusionner) : le contrat de la base ne se lit pas ; la revue s'arrête");
  const lue = (await import(pathToFileURL(module).href)).lireBase(base.ref);
  return lue.illisible ? { illisible: lue.illisible } : lue.sensibles;
}

try {
  const deLaBase = await motifsDeLaBase(process.argv[2] ? { ref: process.argv[2] } : baseParDefaut());
  const motifs = Array.isArray(deLaBase) ? [...lireMotifs(), ...deLaBase] : lireMotifs();
  const chemins = readFileSync(0, "utf8").split("\n").filter(Boolean);
  if (chemins.length === 0)
    throw new Error("aucun fichier reçu : le diff est vide ou git a échoué ; la revue s'arrête");
  for (const chemin of chemins) {
    const lu = cheminLu(chemin);
    if (lu === null) throw new Error(`ligne illisible : ${chemin} (citation de git mal formée) ; la revue s'arrête`);
    if (!Array.isArray(deLaBase)) {
      console.log(`${chemin}\t(base illisible : ${deLaBase.illisible})`);
      continue;
    }
    const motif = motifs.find((m) => motifSensibleTouche(lu, [m.normalize("NFC").toUpperCase().toLowerCase()]) !== null);
    if (motif !== undefined) console.log(`${chemin}\t${motif}`);
  }
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
