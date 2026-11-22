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
//
// La garde du capitaine (relecture indépendante, lot 5b : A-74, A-76), en régime 8 :
//   printf '%s\n' "$diff_propre" | node scripts/chaine/chemins-sensibles.mjs --garde --base <branche> --titre <titre> --branche <tête>
//        [--conflits <fichier>] [--tickets <id>,…]
// Le diff propre (celui que la relecture lit) touche-t-il un chemin sensible que la ligne `Sensibles:` de son ticket ne
// couvre pas ? Les chemins sensibles sont ceux du contrat de la base (`lireBase` de revue-exigee.mjs : un sujet ajoute
// celui de develop), jamais de l'arbre de travail. Le ticket est celui de la PR (`ticketsDeLaPr` de double-relecture.mjs,
// la définition du capitaine : son titre, sa branche) ; sa ligne se lit sur les `origin/sujet/*` qui le portent, sinon sur
// `origin/develop` (A-74), et chaque copie doit couvrir le chemin ; avec deux tickets, l'un des deux suffit. Une PR de mise
// à jour d'un sujet (`--conflits`, la liste des fichiers en conflit de sa fusion ; `--tickets`, les tickets et specs que
// déclare le sujet) ne touche un chemin sensible que s'il est en conflit et couvert par la ligne d'un ticket du sujet.
// Sorties : 0 rien à redire ; 20 un motif (renvoi : chemin non couvert, PR sans ticket, ticket introuvable, ligne
// illisible, chemin sensible hors conflit), sur la sortie standard ; 21 lecture illisible (contrat de la base, git) ;
// 2 usage. Qui appelle a relu `origin/<base>`, `origin/develop` et les `origin/sujet/*` juste avant.
// =============================================================================
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
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

const LIGNE_SENSIBLES = /^(?:[-*][ \t]+)?\**Sensibles\**\s*:\**\s*(.*)$/i;
const ACCORD = " — accord de ";
/**
 * Les chemins qu'accorde la ligne `Sensibles:` d'un ticket (A-74, forme du ticket 55), lue dans l'en-tête seul (avant la
 * première section `## `), aux formes que lit le gate `tickets`. `{ chemins: [] }` sans ligne ou pour `—` ; `{ chemins }`
 * pour des chemins ou des motifs séparés par des virgules, entre accents graves ou nus, suivis de ` — accord de <nom>,
 * <date>` ; `{ illisible }` sinon (deux lignes, un accord absent, un chemin à blanc, absolu, à `~`, à `\\` ou à `..`). Un
 * commentaire ` # …` peut suivre. Copie de `lireSensibles` de `scripts/agent/regles.mjs` (le hook d'édition) : les deux
 * bancs gardent la parité, et ce banc-ci celle avec le gate (aucun chemin que le gate refuse n'est accordé).
 */
export function lireSensibles(texteDuTicket) {
  const lignes = (texteDuTicket ?? "").split(/\r?\n/);
  const fin = lignes.findIndex((l) => /^## /.test(l));
  const valeurs = (fin === -1 ? lignes : lignes.slice(0, fin)).map((l) => LIGNE_SENSIBLES.exec(l)?.[1]).filter((v) => v !== undefined);
  if (valeurs.length === 0) return { chemins: [] };
  if (valeurs.length > 1) return { illisible: "deux lignes `Sensibles:` dans l'en-tête" };
  const i0 = valeurs[0].search(/\s#/);
  const v = (i0 === -1 ? valeurs[0] : valeurs[0].slice(0, i0)).trim();
  if (v === "—") return { chemins: [] };
  const i = v.indexOf(ACCORD);
  const accord = i === -1 ? "" : v.slice(i + ACCORD.length);
  if (i <= 0 || !/^\S.*, \d{4}-\d{2}-\d{2}$/.test(accord)) return { illisible: `« ${v.slice(0, 120)} » : attendu \`—\`, ou des chemins puis \` — accord de <nom>, <AAAA-MM-JJ>\`` };
  const chemins = [];
  for (const brut of v.slice(0, i).split(",")) {
    const c = brut.trim().replace(/^`([^`]*)`$/, "$1").trim();
    if (c === "" || /[\s`{}\\]/.test(c) || c === "—" || c.startsWith("/") || c.startsWith("~") || c.split("/").includes(".."))
      return { illisible: `« ${brut.trim().slice(0, 120)} » n'est pas un chemin ni un motif relatif à la racine du dépôt` };
    chemins.push(c);
  }
  return { chemins };
}

const comparable = (s) => s.normalize("NFC").toUpperCase().toLowerCase();
/** Le chemin `lu` (décité, comparable) est-il couvert par chacune des copies (listes de motifs) ? */
export function couvert(lu, copies) {
  return copies.length > 0 && copies.every((motifs) => motifSensibleTouche(lu, motifs.map(comparable)) !== null);
}

class Motif extends Error {}
class Illisible extends Error {}
function lireOptionsDeGarde(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    if (!["--base", "--titre", "--branche", "--conflits", "--tickets"].includes(cle) || argv[i + 1] === undefined || cle.slice(2) in o) return null;
    o[cle.slice(2)] = argv[i + 1];
  }
  return o.base && "titre" in o && "branche" in o ? o : null;
}

/** La garde du capitaine (en-tête) : le motif d'un renvoi, ou `null`. Lève `Illisible`. */
async function garde({ base, titre, branche, conflits, tickets }, fichiers) {
  const revue = outil("fusionner", "revue-exigee.mjs");
  const double = outil("fusionner", "double-relecture.mjs");
  if (!revue || !double) throw new Illisible("revue-exigee.mjs ou double-relecture.mjs introuvable (skill fusionner) : rejouer l'étape 0 de fusionner");
  const { lireBase, cheminSensible } = await import(pathToFileURL(revue).href);
  const { GRAMMAIRE, ticketsDeLaPr } = await import(pathToFileURL(double).href);
  const contexte = lireBase(`origin/${base}`);
  if (contexte.illisible) throw new Illisible(contexte.illisible);
  const sensibles = fichiers.filter((f) => cheminSensible([f], contexte) !== null);
  if (sensibles.length === 0) return null;
  const liste = (f) => sensibles.map((c) => c.trim()).filter(f).join(", ");
  if (conflits !== undefined) {
    const enConflit = new Set(readFileSync(conflits, "utf8").split("\n").map((l) => l.trim()).filter(Boolean));
    const hors = liste((c) => !enConflit.has(c));
    if (hors) throw new Motif(`PR de mise à jour : chemin sensible hors des fichiers en conflit (${hors}) : une retouche d'un chemin sensible passe par un ticket du sujet, avec sa ligne \`Sensibles:\` (A-74)`);
  }
  // La grammaire d'abord : sans elle, `ticketsDeLaPr` rend `[]`, et la PR serait dite « sans ticket » à tort.
  if (!GRAMMAIRE) throw new Illisible("scripts/docs/identifiants.mjs introuvable : le ticket ne se lit pas");
  const ids = tickets !== undefined ? tickets.split(",").map((t) => t.trim()).filter(Boolean) : ticketsDeLaPr(titre, branche);
  if (ids.length === 0) throw new Motif(`PR sans ticket qui touche un chemin sensible (${liste(() => true)}) : en régime 8, un chemin sensible ne se modifie que sur la branche d'un ticket dont la ligne \`Sensibles:\` l'accorde (A-73)`);
  const G = await import(pathToFileURL(GRAMMAIRE).href);
  const git = (...a) => {
    try {
      return execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 30 });
    } catch {
      throw new Illisible(`git ${a.slice(0, 2).join(" ")} en échec`);
    }
  };
  const sujets = git("for-each-ref", "--format=%(objectname)", "refs/remotes/origin/sujet/").split("\n").filter(Boolean);
  const develop = git("rev-parse", "--verify", "-q", "refs/remotes/origin/develop^{commit}").trim();
  // Les copies d'un identifiant (un ticket, ou, avec `--tickets`, une spec : tous ses tickets) sur une liste de commits.
  const copiesSur = (commits, id) => {
    const parTicket = new Map();
    for (const sha of commits)
      for (const f of git("ls-tree", "-r", "-z", "--name-only", sha, "docs").split("\0").filter(Boolean)) {
        const t = G.estArchive(f) ? null : G.identifiantDuTicket(f.split("/").pop() ?? "");
        if (!t || (t !== id && !(tickets !== undefined && t.startsWith(`${id}.`)))) continue;
        if (!parTicket.has(t)) parTicket.set(t, []);
        parTicket.get(t).push(lireSensibles(git("show", `${sha}:${f}`)));
      }
    return parTicket;
  };
  const accords = [];
  for (const id of ids) {
    let parTicket = copiesSur(sujets, id);
    if (parTicket.size === 0) parTicket = copiesSur([develop], id);
    if (parTicket.size === 0 && tickets === undefined) throw new Motif(`ticket ${id} introuvable sur les origin/sujet/* et sur origin/develop : sa ligne \`Sensibles:\` ne se lit pas, et la PR touche un chemin sensible (${liste(() => true)})`);
    for (const [t, copies] of parTicket) {
      const mal = copies.find((c) => c.illisible);
      if (mal) throw new Motif(`ligne \`Sensibles:\` du ticket ${t} illisible (${mal.illisible}) : la corriger sur le sujet`);
      accords.push(copies.map((c) => c.chemins));
    }
  }
  const horsAccord = liste((c) => {
    const lu = cheminLu(c);
    return lu === null || !accords.some((copies) => couvert(lu, copies));
  });
  return horsAccord
    ? `chemin sensible hors de la ligne \`Sensibles:\` de ${ids.length > 1 ? "ses tickets" : `son ticket ${ids[0]}`} (${horsAccord}) : l'accord du produit se demande au conducteur, qui ajoute le chemin au ticket par une PR de documentation vers le sujet (A-75)`
    : null;
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (estPointEntree() && process.argv[2] === "--garde") {
  const options = lireOptionsDeGarde(process.argv.slice(3));
  if (options === null) {
    console.log("usage : chemins-sensibles.mjs --garde --base <branche> --titre <titre> --branche <tête> [--conflits <fichier>] [--tickets <id>,…]");
    process.exit(2);
  }
  try {
    const motif = await garde(options, readFileSync(0, "utf8").split("\n").filter((l) => l.trim() !== ""));
    console.log(motif ?? "aucun chemin sensible hors accord");
    process.exit(motif ? 20 : 0);
  } catch (e) {
    if (e instanceof Motif) {
      console.log(e.message);
      process.exit(20);
    }
    if (!(e instanceof Illisible)) throw e;
    console.log(`lecture illisible : ${e.message}`);
    process.exit(21);
  }
} else if (estPointEntree()) try {
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
