#!/usr/bin/env node
/**
 * Message du sous-agent du skill `criticite`, pour une règle nommée par son identifiant : le prompt exact
 * (`../references/prompt.md`), l'énoncé de la règle et les specs qui la portent. Le script choisit
 * l'entrée, pas la session : il trouve lui-même le fichier de la règle et ses specs. La session passe
 * sa sortie telle quelle, sans rien y ajouter ni rien y réécrire : le sous-agent « ne connaît que
 * l'énoncé de la règle, sa spec et les définitions » (décision du produit).
 *
 * Le fichier de la règle : `docs/metier/regles/<ctx>/<ID>.md`, le contexte en minuscules. Introuvable :
 * refus, avec le chemin cherché.
 * L'énoncé : le `title` de l'en-tête, puis le corps, l'en-tête YAML retiré (validation, décisions,
 * sources, criticité déjà écrite) et les commentaires HTML retirés, même sur plusieurs lignes, même
 * non refermés. Un BOM de tête est retiré. Le titre se lit sur sa seule ligne, guillemets et
 * commentaire YAML de fin de ligne retirés ; un titre absent, plié ou illisible est refusé. Une règle
 * sans en-tête est acceptée : son corps seul.
 * Les specs : toute `*.spec.md` sous `docs/` dont la ligne `Règles:` de l'en-tête nomme la règle, ou
 * dont un ticket (`<SPEC>-<slug>.<NN>.issue.md`, archive comprise) la nomme dans sa ligne `Règles:` ou
 * `Prouve:`. Les specs passent, au mot près, pas les tickets. Aucune : « aucune spec ne déclare
 * cette règle ».
 * Aucun lien symbolique n'est suivi : une spec qui en est un est ignorée, et le message le dit ; une
 * règle qui en est un, ou dont un dossier en est un, est refusée. Un nom de fichier qui porte un
 * caractère de contrôle est refusé : un chemin n'est écrit qu'après ce refus.
 *
 * Usage : node <dossier du skill>/scripts/contexte-regle.mjs <RULE_<CTX>_<TRI>-<n>>   (depuis la racine du projet)
 * Racine : le dossier courant, sans variable d'environnement.
 * Sorties : 0 · 2 usage, règle introuvable ou lien, nom illisible, titre illisible, ou prompt sans ses marques.
 */
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const EN_TETE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const IDENTIFIANT = /^RULE_([A-Z0-9]+)_([A-Z0-9]+)-(\d+)$/;
export const AUCUNE_SPEC = "aucune spec ne déclare cette règle";

/** Le texte sans le BOM de tête. */
export const sansBom = (texte) => texte.replace(/^\uFEFF/, "");

/** La valeur de `title:` d'un en-tête, sur sa seule ligne ; absente, pliée ou illisible : une erreur. */
export function titreDeLEnTete(entete) {
  const lignes = entete.split(/\r?\n/);
  const k = lignes.findIndex((l) => /^title:/.test(l));
  if (k < 0) throw new Error("en-tête sans `title:`");
  const valeur = lignes[k].replace(/^title:[ \t]*/, "");
  const plie = /^[|>]/.test(valeur) || valeur.trim() === "" || /^[ \t]+\S/.test(lignes[k + 1] ?? "");
  if (plie) throw new Error("titre plié sur plusieurs lignes : l'écrire sur une seule");
  const guillemets = /^(["'])((?:\\.|(?!\1).|'')*)\1[ \t]*(?:#.*)?$/.exec(valeur.trim());
  if (guillemets) {
    const [, q, v] = guillemets;
    return q === "'" ? v.replace(/''/g, "'") : v.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (/^["']/.test(valeur.trim())) throw new Error("titre illisible : guillemet non refermé");
  return valeur.replace(/[ \t]+#.*$/, "").trim();
}

/** L'énoncé d'une règle : `# <title>`, puis le corps, sans BOM, en-tête ni commentaire HTML. */
export function enonceDeLaRegle(texte) {
  const t = sansBom(texte);
  const m = EN_TETE.exec(t);
  const titre = m ? titreDeLEnTete(m[1]) : null;
  const corps = (m ? t.slice(m[0].length) : t).replace(/<!--[\s\S]*?(?:-->|$)/g, "").trim();
  return titre ? `# ${titre}\n\n${corps}`.trimEnd() : corps;
}

/** Vrai quand la ligne `Clé:` de l'en-tête d'un document (avant sa première section) nomme la règle. */
export function ligneNomme(texte, cles, id) {
  const tete = sansBom(texte).split(/\r?\n## /)[0];
  const nom = new RegExp(`(?<![\\w-])${id}(?!\\w)`);
  return tete
    .split(/\r?\n/)
    .some((l) => cles.some((c) => new RegExp(`^${c}\\s*:`).test(l)) && nom.test(l.replace(/\s#.*$/, "")));
}

/** Un texte dans une clôture plus longue que toute suite d'accents graves qu'il porte : rendu entier. */
export function cloture(texte) {
  const c = "`".repeat(Math.max(3, ...(texte.match(/`+/g) ?? []).map((x) => x.length)) + 1);
  return `${c}text\n${texte}\n${c}`;
}

/** Le message entier : le prompt, l'énoncé et les specs, chacun dans sa clôture ; les specs ignorées, nommées. */
export function message({ prompt, regle, specs, ignorees = [] }) {
  const morceaux = prompt.split("<règle>");
  const suite = morceaux.length === 2 ? morceaux[1].split("<spec>") : [];
  if (suite.length !== 2) throw new Error("prompt sans ses marques : une seule <règle>, puis une seule <spec>");
  const texteSpecs = specs.length
    ? specs.map(({ nom, texte }) => `${nom} :\n\n${cloture(texte)}`).join("\n\n")
    : AUCUNE_SPEC;
  const notes = ignorees.map((nom) => `\n\n(spec ignorée, lien symbolique : ${nom})`).join("");
  return morceaux[0] + cloture(enonceDeLaRegle(regle)) + suite[0] + texteSpecs + notes + suite[1];
}

/** Vrai quand un nom de fichier porte un caractère de contrôle. */
export const nomIllisible = (nom) => /[\u0000-\u001f\u007f]/.test(nom);

/** Vrai quand `noms` (le contenu d'un dossier) porte exactement `attendu`, casse comprise. */
export const nomExact = (noms, attendu) => noms.includes(attendu);

/** Tous les fichiers sous `dir`, triés, sans suivre aucun lien : les liens à part, jamais lus. */
function parcourir(dir, out = { fichiers: [], liens: [] }) {
  if (!existsSync(dir)) return out;
  for (const nom of readdirSync(dir).sort()) {
    if (nom === "node_modules" || nom.startsWith(".")) continue;
    const p = join(dir, nom);
    if (nomIllisible(nom)) throw new Error(`nom de fichier illisible sous ${JSON.stringify(dir)} : ${JSON.stringify(nom)}`);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) out.liens.push(p);
    else if (st.isDirectory()) parcourir(p, out);
    else out.fichiers.push(p);
  }
  return out;
}

/** Le contexte d'une règle dans un projet : le chemin de son fichier, son texte, les specs qui la portent, les liens ignorés. */
export function contexteDeLaRegle(racine, id) {
  const lu = IDENTIFIANT.exec(id);
  if (!lu) throw new Error(`identifiant illisible : ${JSON.stringify(id)} (attendu RULE_<CTX>_<TRI>-<n>)`);
  const rel = join("docs/metier/regles", lu[1].toLowerCase(), `${id}.md`);
  const chemin = join(racine, rel);
  let present = false;
  try {
    present = nomExact(readdirSync(dirname(chemin)), `${id}.md`);
  } catch {
    present = false;
  }
  if (!present) throw new Error(`règle introuvable : ${rel}`);
  if (lstatSync(chemin).isSymbolicLink() || realpathSync(chemin) !== join(realpathSync(racine), rel))
    throw new Error(`règle refusée, lien symbolique sur son chemin : ${rel}`);
  const { fichiers: docs, liens } = parcourir(join(racine, "docs"));
  const specs = docs.filter((p) => p.endsWith(".spec.md"));
  const idSpec = (p) => /^(SPEC_[A-Z0-9]+_[A-Z0-9]+-\d+)-/.exec(basename(p))?.[1];
  const portees = new Set(specs.filter((p) => ligneNomme(readFileSync(p, "utf8"), ["Règles"], id)).map(idSpec));
  for (const p of docs.filter((x) => /\.\d+\.issue\.md$/.test(x)))
    if (ligneNomme(readFileSync(p, "utf8"), ["Règles", "Prouve"], id)) portees.add(idSpec(p));
  return {
    chemin,
    regle: readFileSync(chemin, "utf8"),
    specs: specs
      .filter((p) => portees.has(idSpec(p)))
      .map((p) => ({ nom: relative(racine, p), texte: readFileSync(p, "utf8") })),
    ignorees: liens.filter((p) => p.endsWith(".spec.md")).map((p) => relative(racine, p)),
  };
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (estPointEntree()) {
  const sortir = (texte) => {
    console.error(texte);
    process.exit(2);
  };
  const id = process.argv[2] ?? "";
  if (!id || process.argv.length > 3)
    sortir("usage : node contexte-regle.mjs <RULE_<CTX>_<TRI>-<n>>   (depuis la racine du projet)");
  const prompt = join(dirname(fileURLToPath(import.meta.url)), "../references/prompt.md");
  if (!existsSync(prompt)) sortir(`contexte-regle : prompt introuvable : ${prompt}`);
  try {
    const { regle, specs, ignorees } = contexteDeLaRegle(process.cwd(), id);
    process.stdout.write(`${message({ prompt: readFileSync(prompt, "utf8"), regle, specs, ignorees })}\n`);
  } catch (e) {
    sortir(`contexte-regle : ${e.message}`);
  }
}
