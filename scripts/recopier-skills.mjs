// Recopie les skills de la chaîne (`skills/chaine/`) dans `.claude/skills/` d'un projet, avec un manifeste.
// Usage : node scripts/recopier-skills.mjs <dossier du projet> [--remplacer] [--source <racine d'un dépôt skills>]
// Codes : 0 copie à jour ou refaite, 1 refus (rien n'est écrit), 2 usage.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE_DEPOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GROUPE = "skills/chaine/";
const COMMENTAIRE =
  "Copie générée depuis MAJ-agency/skills par scripts/recopier-skills.mjs. Ne pas modifier : une modification se fait dans skills, la copie arrive par PR.";
const USAGE = "usage : node scripts/recopier-skills.mjs <dossier du projet> [--remplacer] [--source <racine d'un dépôt skills>]";

export class Usage extends Error {}
export class Refus extends Error {}

export const sha256 = (octets) => createHash("sha256").update(octets).digest("hex");
const estLien = (chemin) => lstatSafe(chemin)?.isSymbolicLink() === true;
function lstatSafe(chemin) {
  try {
    return lstatSync(chemin);
  } catch {
    return null;
  }
}

export function lireArguments(argv) {
  let projet = null;
  let remplacer = false;
  let source = RACINE_DEPOT;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--remplacer") remplacer = true;
    else if (a === "--source") {
      if (i + 1 >= argv.length) throw new Usage("--source sans valeur");
      source = argv[++i];
    } else if (a.startsWith("--")) throw new Usage(`option inconnue : ${a}`);
    else if (projet === null) projet = a;
    else throw new Usage(`argument en trop : ${a}`);
  }
  if (projet === null) throw new Usage("dossier du projet manquant");
  const st = lstatSafe(projet);
  if (!st || !statSync(projet).isDirectory()) throw new Usage(`${projet} : dossier absent ou qui n'est pas un dossier`);
  return { projet, remplacer, source };
}

// Ce que git suit sous skills/chaine/ de la source : { nom → [{ chemin (relatif au skill), mode, source }] }.
export function lireSource(source) {
  let sortie;
  try {
    sortie = execFileSync("git", ["-C", source, "ls-files", "-s", "-z", "--", GROUPE], { encoding: "utf8", maxBuffer: 1 << 28 });
  } catch (e) {
    throw new Refus(`${source} : git ls-files a échoué (${e.message.split("\n")[0]})`);
  }
  const parNom = new Map();
  for (const entree of sortie.split("\0").filter(Boolean)) {
    const [meta, chemin] = entree.split("\t");
    const mode = meta.split(" ")[0];
    const [nom, ...reste] = chemin.slice(GROUPE.length).split("/");
    if (reste.length === 0) continue;
    if (!parNom.has(nom)) parNom.set(nom, []);
    parNom.get(nom).push({ chemin: reste.join("/"), mode, source: join(source, chemin) });
  }
  const skills = new Map();
  for (const [nom, fichiers] of [...parNom].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (fichiers.some((f) => f.chemin === "SKILL.md")) skills.set(nom, fichiers);
  }
  return skills;
}

const nomValide = (n) => typeof n === "string" && /^[A-Za-z0-9][\w.-]*$/.test(n);

function lireManifeste(chemin) {
  if (!lstatSafe(chemin)) return { absent: true };
  try {
    const m = JSON.parse(readFileSync(chemin, "utf8"));
    if (!Array.isArray(m?.skills) || !m.skills.every(nomValide)) throw new Error("tableau skills absent ou invalide");
    return { skills: m.skills };
  } catch {
    return { illisible: true };
  }
}

const fichiersDe = (dossier, base = dossier) =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const p = join(dossier, e.name);
    return e.isDirectory() ? fichiersDe(p, base) : [relative(base, p).split("/").join("/")];
  });

export function recopier({ projet, remplacer = false, source = RACINE_DEPOT }) {
  const skills = lireSource(source);
  const version = JSON.parse(readFileSync(join(source, ".claude-plugin/plugin.json"), "utf8")).version;
  const refus = [];

  for (const [nom, fichiers] of skills)
    for (const f of fichiers) if (f.mode === "120000") refus.push(`${GROUPE}${nom}/${f.chemin} : lien symbolique dans la source`);

  const dossierClaude = join(projet, ".claude");
  const dossierSkills = join(dossierClaude, "skills");
  for (const p of [dossierClaude, dossierSkills]) if (estLien(p)) refus.push(`${relative(projet, p)} : lien symbolique côté projet`);
  for (const nom of skills.keys()) if (estLien(join(dossierSkills, nom))) refus.push(`.claude/skills/${nom} : lien symbolique côté projet`);

  const cheminManifeste = join(dossierSkills, "maj-skills.json");
  const precedent = refus.length === 0 ? lireManifeste(cheminManifeste) : { absent: true };
  let anciens = [];
  if (precedent.illisible) {
    if (!remplacer) refus.push(`.claude/skills/maj-skills.json : manifeste illisible (--remplacer le traite comme absent)`);
  } else if (precedent.skills) anciens = precedent.skills;

  const enTrop = [];
  if (refus.length === 0)
    for (const nom of skills.keys())
      if (existsSync(join(dossierSkills, nom)) && !anciens.includes(nom)) enTrop.push(nom);
  if (enTrop.length > 0 && !remplacer)
    for (const nom of enTrop) refus.push(`.claude/skills/${nom}/ existe sans que le manifeste le nomme (--remplacer pour le remplacer)`);
  if (refus.length > 0) throw new Refus(refus.join("\n"));

  const lignes = new Map();
  const manifesteFichiers = {};
  for (const [nom, fichiers] of skills) {
    const cible = join(dossierSkills, nom);
    if (enTrop.includes(nom)) rmSync(cible, { recursive: true, force: true });
    const voulus = new Set(fichiers.map((f) => f.chemin));
    let change = !existsSync(cible);
    if (!change) {
      for (const p of fichiersDe(cible)) if (!voulus.has(p)) {
        rmSync(join(cible, p), { force: true });
        change = true;
      }
      purgerDossiersVides(cible);
    }
    for (const f of fichiers) {
      const octets = readFileSync(f.source);
      const destination = join(cible, f.chemin);
      const modeVoulu = f.mode === "100755" ? 0o755 : 0o644;
      const existant = lstatSafe(destination);
      const identique = existant?.isFile() && readFileSync(destination).equals(octets);
      if (!identique) {
        if (existant) rmSync(destination, { recursive: true, force: true });
        mkdirSync(dirname(destination), { recursive: true });
        writeFileSync(destination, octets);
        change = true;
      }
      if ((statSync(destination).mode & 0o777) !== modeVoulu) {
        if (identique) change = true;
        chmodSync(destination, modeVoulu);
      }
      manifesteFichiers[`${nom}/${f.chemin}`] = sha256(octets);
    }
    lignes.set(nom, change ? "copié" : "à jour");
  }
  for (const nom of anciens)
    if (!skills.has(nom)) {
      rmSync(join(dossierSkills, nom), { recursive: true, force: true });
      lignes.set(nom, "supprimé");
    }

  const trier = (a) => [...a].sort();
  const fichiers = {};
  for (const k of trier(Object.keys(manifesteFichiers))) fichiers[k] = manifesteFichiers[k];
  const manifeste = { $comment: COMMENTAIRE, source: "MAJ-agency/skills", version, skills: trier(skills.keys()), fichiers };
  mkdirSync(dossierSkills, { recursive: true });
  writeFileSync(cheminManifeste, JSON.stringify(manifeste, null, 2) + "\n");

  return { version, lignes: trier(lignes.keys()).map((nom) => `${nom} : ${lignes.get(nom)}`) };
}

function purgerDossiersVides(dossier) {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = join(dossier, e.name);
    purgerDossiersVides(p);
    if (readdirSync(p).length === 0) rmSync(p, { recursive: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { lignes, version } = recopier(lireArguments(process.argv.slice(2)));
    for (const l of lignes) console.log(l);
    console.log(`maj-skills ${version}`);
  } catch (e) {
    if (e instanceof Usage) {
      console.error(`recopier-skills.mjs : ${e.message}\n${USAGE}`);
      process.exit(2);
    }
    console.error(`recopier-skills.mjs : ${e.message}`);
    process.exit(1);
  }
}
