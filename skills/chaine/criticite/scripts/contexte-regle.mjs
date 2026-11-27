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
 * `Prouve:`. Les specs passent au mot près, leurs commentaires (HTML, ou ligne `[//]: # (…)`) retirés, pas les tickets. Aucune : « aucune spec ne déclare
 * cette règle ».
 * Le plafond : si le message entier passe 300 000 caractères, chaque spec est réduite à son en-tête et aux
 * sections (titre de niveau 1 ou 2, hors clôture de code) qui citent la règle, le message nomme ce qui est
 * retenu, et la sortie d'erreur dit le tri (sortie 0). Encore au-delà après le tri : refus.
 * Aucun lien symbolique n'est suivi : une spec qui en est un est ignorée, et le message le dit ; une
 * règle qui en est un, ou dont un dossier en est un, est refusée. Un nom de fichier qui porte un
 * caractère de contrôle est refusé : un chemin n'est écrit qu'après ce refus.
 *
 * Usage : node <dossier du skill>/scripts/contexte-regle.mjs <RULE_<CTX>_<TRI>-<n>>   (depuis la racine du projet)
 * Racine : le dossier courant, sans variable d'environnement.
 * Sorties : 0 · 2 usage, règle introuvable ou lien, nom illisible, en-tête ou titre illisible, contexte de plus de 300 000
 * caractères après le tri, ou prompt sans ses marques.
 */
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const EN_TETE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
/** Un fichier dont la première ligne non vide est `---` annonce un en-tête YAML. */
const OUVRE_UN_EN_TETE = /^\s*---[ \t]*(?:\r|\n|$)/;
/** Au-delà, le contexte rendu est refusé : la session ne tronque rien à la main. */
export const PLAFOND = 300000;
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

/** Le texte sans commentaire HTML (même sur plusieurs lignes, même non refermé) ni définition de lien vide `[//]: # (…)`, `[//]: <> (…)`, `[comment]: # (…)`. */
export const sansCommentaires = (texte) =>
  texte.replace(/<!--[\s\S]*?(?:-->|$)/g, "").replace(/^[ \t]*\[[^\]\r\n]*\]:[ \t]*(?:#|<>)[ \t]*(?:\([^\r\n]*\)|"[^\r\n]*"|'[^\r\n]*')?[ \t]*(?:\r?\n|$)/gm, "");

/** L'énoncé d'une règle : `# <title>`, puis le corps, sans BOM, en-tête ni commentaire. Un en-tête annoncé mais illisible : une erreur. */
export function enonceDeLaRegle(texte) {
  const t = sansBom(texte);
  const m = EN_TETE.exec(t);
  if (!m && OUVRE_UN_EN_TETE.test(t)) throw new Error("en-tête illisible : `---` en première ligne non vide, mais jamais refermé par `---` (ni ligne vide avant l'ouverture, ni fins de ligne CR seules)");
  const titre = m ? titreDeLEnTete(m[1]) : null;
  const corps = sansCommentaires(m ? t.slice(m[0].length) : t).trim();
  return titre ? `# ${titre}\n\n${corps}`.trimEnd() : corps;
}

/** Le motif de l'identifiant exact, borné des deux côtés : `-30`, `-3-slug` et `-3.03` ne nomment pas `-3`. */
const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const nommePar = (id) => new RegExp(`(?<![\\w-])${echappe(id)}(?![\\w-]|\\.\\d+(?!\\w))`);

/** Vrai quand la ligne `Clé:` de l'en-tête d'un document (avant sa première section) nomme la règle. */
export function ligneNomme(texte, cles, id) {
  const tete = sansBom(texte).split(/\r?\n## /)[0];
  const nom = nommePar(id);
  // Les trois formes du gate tickets (`X:`, `**X:**`, `- X:`), toute casse : tickets-regles.mjs.
  const entete = new RegExp(`^(?:- )?\\**(?:${cles.join("|")})\\**\\s*:`, "i");
  return tete.split(/\r?\n/).some((l) => entete.test(l) && nom.test(l.replace(/\s#.*$/, "")));
}

/** Un texte dans une clôture plus longue que toute suite d'accents graves qu'il porte : rendu entier. */
export function cloture(texte) {
  const c = "`".repeat(Math.max(3, ...(texte.match(/`+/g) ?? []).map((x) => x.length)) + 1);
  return `${c}text\n${texte}\n${c}`;
}

/** Vrai quand la ligne ferme la clôture : 0 à 3 espaces, au moins `n` fois le caractère `car`, puis rien que des espaces ou des tabulations. */
function fermeLaCloture(ligne, { car, n }) {
  let i = 0;
  while (i < 3 && ligne[i] === " ") i++;
  let j = i;
  while (ligne[j] === car) j++;
  return j - i >= n && /^[ \t]*$/.test(ligne.slice(j));
}

/**
 * Un texte coupé en morceaux : `[{ titre: null, texte }, { titre, texte }…]`, l'en-tête (ce qui précède le
 * premier titre de niveau 2) puis les sections. Un titre est une ligne qui commence en colonne 0 par `#` ou
 * `##` et une espace ou une tabulation, hors clôture de code (``` ou ~~~, non refermée : jusqu'à la fin).
 * Une section court jusqu'au titre de niveau 1 ou 2 suivant ; `###` reste dans la sienne. Les morceaux,
 * mis bout à bout, rendent le texte octet pour octet.
 */
export function decouper(texte) {
  const morceaux = [{ titre: null, texte: "" }];
  let cloture = null;
  let enTete = true;
  for (const ligne of texte.split(/(?<=\n)/)) {
    const nue = ligne.replace(/\r?\n$/, "");
    const ouvre = cloture ? null : /^ {0,3}(`{3,}|~{3,})/.exec(nue);
    if (cloture) {
      if (fermeLaCloture(nue, cloture)) cloture = null;
    } else if (ouvre) {
      cloture = { car: ouvre[1][0] === "`" ? "`" : "~", n: ouvre[1].length };
    } else {
      const titre = /^(#{1,2})[ \t]/.exec(nue);
      if (titre && (titre[1] === "##" || !enTete)) {
        enTete = false;
        morceaux.push({ titre: nue.trim(), texte: "" });
      }
    }
    morceaux[morceaux.length - 1].texte += ligne;
  }
  return morceaux;
}

/** L'extrait d'une spec : l'en-tête, puis les sections qui citent la règle (titre compris), chacune entière. */
export function extrait(texte, id) {
  const cite = nommePar(id);
  const [tete, ...sections] = decouper(texte);
  const gardees = sections.filter((m) => cite.test(m.texte));
  return {
    texte: tete.texte + gardees.map((m) => m.texte).join(""),
    titres: gardees.map((m) => m.titre),
    ecartees: sections.length - gardees.length,
  };
}

/** Ce qu'une spec réduite garde, dit en une suite de mots : « en-tête, « ## A » » ou « en-tête seul ». */
const retenu = (titres) => (titres.length ? `en-tête, ${titres.map((t) => `« ${t} »`).join(", ")}` : "en-tête seul");

/** Le message entier : le prompt, l'énoncé et les specs, chacun dans sa clôture ; les specs ignorées, nommées. */
export function message({ prompt, regle, specs, ignorees = [], horsConvention = [] }) {
  const morceaux = prompt.split("<règle>");
  const suite = morceaux.length === 2 ? morceaux[1].split("<spec>") : [];
  if (suite.length !== 2) throw new Error("prompt sans ses marques : une seule <règle>, puis une seule <spec>");
  const texteSpecs = specs.length
    ? specs
        .map(({ nom, texte, titres, ecartees }) => {
          const note = ecartees > 0 ? ` (extrait : ${retenu(titres)} ; écartées : ${ecartees})` : "";
          return `${nom}${note} :\n\n${cloture(texte)}`;
        })
        .join("\n\n")
    : AUCUNE_SPEC;
  const notes = ignorees.map((nom) => `\n\n(spec ignorée, lien symbolique : ${nom})`).join("") +
    horsConvention.map((nom) => `\n\n(spec ignorée : nom hors convention : ${nom})`).join("");
  return morceaux[0] + cloture(enonceDeLaRegle(regle)) + suite[0] + texteSpecs + notes + suite[1];
}

/**
 * Le message, borné : entier s'il tient sous `PLAFOND` ; sinon chaque spec réduite à son extrait, puis
 * recomposé. `reduites` vaut `null` sans tri, sinon une entrée par spec : `{ nom, entier, extrait, titres, ecartees }`.
 */
export function messageBorne({ prompt, regle, specs, ignorees = [], horsConvention = [], id }) {
  const entier = message({ prompt, regle, specs, ignorees, horsConvention });
  if (entier.length <= PLAFOND) return { texte: entier, avant: entier.length, reduites: null };
  const extraits = specs.map((s) => ({ nom: s.nom, ...extrait(s.texte, id) }));
  const texte = message({ prompt, regle, specs: extraits, ignorees, horsConvention });
  const reduites = extraits.map((e, i) => ({
    nom: e.nom,
    entier: specs[i].texte.length,
    extrait: e.texte.length,
    titres: e.titres,
    ecartees: e.ecartees,
  }));
  return { texte, avant: entier.length, reduites };
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
  const idSpec = (p) => /^(SPEC_[A-Z0-9]+_[A-Z0-9]+-\d+)-/.exec(basename(p))?.[1];
  const toutes = docs.filter((p) => p.endsWith(".spec.md"));
  const specs = toutes.filter((p) => idSpec(p));
  // Une spec sans identifiant lisible n'est nommée que si sa ligne `Règles:`, ou celle d'un ticket de même radical, nomme la règle.
  const radical = (p) => basename(p).replace(/\.spec\.md$/, "");
  const nommeLaRegle = (p) =>
    ligneNomme(readFileSync(p, "utf8"), ["Règles"], id) ||
    docs.some((x) => /\.\d+\.issue\.md$/.test(x) && basename(x).startsWith(`${radical(p)}.`) && ligneNomme(readFileSync(x, "utf8"), ["Règles", "Prouve"], id));
  const portees = new Set(specs.filter((p) => ligneNomme(readFileSync(p, "utf8"), ["Règles"], id)).map(idSpec));
  for (const p of docs.filter((x) => /\.\d+\.issue\.md$/.test(x)))
    if (idSpec(p) && ligneNomme(readFileSync(p, "utf8"), ["Règles", "Prouve"], id)) portees.add(idSpec(p));
  return {
    chemin,
    regle: readFileSync(chemin, "utf8"),
    specs: specs
      .filter((p) => portees.has(idSpec(p)))
      .map((p) => ({ nom: relative(racine, p), texte: sansCommentaires(readFileSync(p, "utf8")) })),
    horsConvention: toutes.filter((p) => !idSpec(p) && nommeLaRegle(p)).map((p) => relative(racine, p)),
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
    const { regle, specs, ignorees, horsConvention } = contexteDeLaRegle(process.cwd(), id);
    const { texte, avant, reduites } = messageBorne({ prompt: readFileSync(prompt, "utf8"), regle, specs, ignorees, horsConvention, id });
    const ligne = (r) => `\n${r.nom} : ${r.entier} caractères, ${r.extrait} en extrait (${retenu(r.titres)})`;
    if (texte.length > PLAFOND)
      sortir(
        `contexte-regle : contexte trop long : ${texte.length} caractères (plafond ${PLAFOND}) après le tri, ${avant} avant ; règle : ${regle.length} caractères` +
          reduites.map(ligne).join("") +
          "\nrien n'est tronqué : la session s'arrête et le dit",
      );
    if (reduites)
      console.error(
        `contexte-regle : contexte réduit : ${avant} caractères, ${texte.length} après le tri (plafond ${PLAFOND}) ; chaque spec réduite à son en-tête et aux sections qui citent la règle` +
          reduites.filter((r) => r.ecartees > 0).map(ligne).join(""),
      );
    process.stdout.write(`${texte}\n`);
  } catch (e) {
    sortir(`contexte-regle : ${e.message}`);
  }
}
