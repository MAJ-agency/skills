#!/usr/bin/env node
// =============================================================================
// « Double relecture exigée », un seul calcul pour le Relecteur et pour le capitaine.
//
// Une PR exige deux relectures indépendantes quand :
//   - son ticket porte la ligne `Relecture: double`, ou cite sur sa ligne `Règles:` une règle de criticité haute
//     (sans ligne `Règles:` sur le ticket, celle de sa spec est lue à sa place) ;
//   - son diff touche le fichier d'une règle haute, ou un fichier que le champ `code` de cette règle nomme ;
//   - elle change le niveau d'une règle vers ou depuis « haute » (une criticité fixée sur une feature, par exemple).
//
//   git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> \
//     | node scripts/chaine/double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]
//
// Entrée standard : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only --no-renames` les
// écrit. `--no-renames` : sans lui, un fichier de code renommé ne paraît plus sous son ancien nom, celui que la
// règle nomme. Une tabulation ou un octet nul dans l'entrée (`--name-status`, `-z`), ou un chemin qui n'existe ni
// au départ, ni à la tête, ni sur la cible, ni sur develop : « illisible ».
// `--base` : la branche cible de la PR, un nom de branche (`develop`, `sujet/<nom>`), jamais une réf, ni `HEAD`, ni
// une réf symbolique ; le calcul lit `refs/remotes/origin/<branche>` en entier, que qui appelle vient de relire : ni
// un tag ni une branche locale du même nom ne la remplacent. `--tete` : le sommet de la PR, un sha de 40 caractères.
// `--titre`, `--branche` : le titre de la PR et le nom de sa branche de tête,
// d'où se lit son ticket (`ticketDeLaPr` de la grammaire ; quand le titre et la branche en nomment deux, les deux
// sont lus).
//
// Tout se lit dans des objets git, jamais dans l'arbre de travail, et dans un dépôt propre : un dépôt nu jetable,
// créé sous le dossier temporaire, qui emprunte les objets du dépôt réel (`objects/info/alternates`), sans
// configuration d'utilisateur ni de système, sans aucune variable `GIT_*` héritée. Les réfs se résolvent une fois
// en sha dans le dépôt réel, tout le reste se lit par sha dans le dépôt propre : ni la configuration du dépôt, ni
// ses greffes, ni ses objets remplacés, ni le dossier courant ne pèsent. S'il ne se crée pas : « illisible ».
// Ce fichier tourne depuis la copie des outils que la boucle du capitaine reprend d'origin/develop, hors du
// dépôt, avec `scripts/chaine` et `scripts/docs/identifiants.mjs` pour tout bagage. Aucune dépendance : l'en-tête
// YAML d'une règle est lu ici, pour trois clés seulement (`criticality`, `code`, `validation`), et ce que ce
// lecteur ne comprend pas est « illisible », jamais « non exigée ».
//
// Le niveau d'une règle se lit sur trois arbres, la base, la tête et `origin/develop` (un sujet en retard ne cache
// pas une règle montée dans develop) ; le plus haut l'emporte. Dans l'index Anchorpost de l'arbre
// (`anchorpost/anchorpost.json`, schéma "2" ou "3") : `criticality.level` de l'entrée de `rules` dont la `key`
// est l'identifiant de la règle, le niveau effectif, criticité reçue d'une feature comprise ; ses fichiers de
// code dans `code`, son statut dans `validation.status`. Sans index : dans l'en-tête de chaque fichier de règle
// (`docs/metier/regles/<ctx>/<RULE_…>.md`), qui ne voit pas une criticité reçue d'une feature. Avec un index,
// l'en-tête des fichiers de règle que le diff touche est lu en plus, et le plus haut gagne : un index que la PR
// n'a pas régénéré ne cache pas une règle qu'elle monte. Une règle `rejected` ou `obsolete` ne compte pas.
// Le changement de niveau se lit entre le départ de la PR (la base de fusion de sa cible et de sa tête) et sa tête :
// ce qu'une autre PR a changé dans la cible depuis n'est pas un changement de celle-ci.
//
// L'en-tête du ticket (`Relecture:`, `Règles:`, aux formes que le gate `tickets` lit, puce étoile en plus) se lit
// sur la base, sur `origin/develop`, sur la tête et sur chaque `origin/sujet/*` : une seule de ces lectures qui dit
// « double » ou cite une règle haute suffit. Un ticket sans ligne `Règles:` (une ligne vide n'en est pas une) hérite
// de celle de sa spec, cherchée dans les mêmes arbres ; `Règles: —` dit « aucune ».
//
// Sortie standard : une ligne par cause
// (`<règle ou ticket>\t<fichier | code | niveau | Règles: | Relecture: double>\t<chemin>\t<réf>`), une ligne
// `# …` par lecture en échec ou remarque, et, EN DERNIÈRE LIGNE, le seul verdict : `exigée`, `non exigée` ou
// `illisible`. Une cause établie suffit : « illisible » n'est rendu que si aucune ne l'est.
// Sorties : 0 non exigée · 20 exigée · 21 illisible (usage compris) · 69 outil manquant (`git`, ou la grammaire
// des identifiants), dernière ligne `illisible`. Qui appelle ne lit « non exigée » que sur la sortie 0 ET la
// dernière ligne ; tout autre code que 0 et 20 (un plantage de node sort en 1) se lit « illisible ».
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXIGEE = 'exigée';
export const NON_EXIGEE = 'non exigée';
export const ILLISIBLE = 'illisible';
export const SORTIES = { [NON_EXIGEE]: 0, [EXIGEE]: 20, [ILLISIBLE]: 21, outilManquant: 69 };
export const DEVELOP = 'develop';
export const INDEX = 'anchorpost/anchorpost.json';
const REGLES = 'docs/metier/regles/';
const NIVEAUX = ['low', 'medium', 'high'];
const HORS_VIGUEUR = ['rejected', 'obsolete'];

// La grammaire des identifiants, cherchée comme le fait identifiant.mjs : `../docs/` (un projet, et la copie de la
// boucle), à côté de ce fichier (copie à plat), puis dans le plugin.
const ICI = dirname(fileURLToPath(import.meta.url));
export const GRAMMAIRE = ['../docs/identifiants.mjs', 'identifiants.mjs', '../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs']
  .map((c) => join(ICI, c))
  .find(existsSync);
const G = GRAMMAIRE ? await import(pathToFileURL(GRAMMAIRE).href) : null;

/** Une lecture en échec : elle ne vaut jamais « non exigée ». */
export class Illisible extends Error {}
/** Un outil de la chaîne manque au poste (`git`, la grammaire des identifiants) : une lecture en échec, sortie 69. */
export class OutilManquant extends Illisible {}
const illisible = (message) => {
  throw new Illisible(message);
};

// Comparable, comme `revue-exigee.mjs` : NFC, majuscules puis minuscules, pour les chemins et les identifiants.
// `cheminDuDiff` est la copie de son `cheminLu` (ce fichier ne dépend d'aucun autre script de la chaîne) ; le banc
// garde la parité.
const comparable = (s) => s.normalize('NFC').toUpperCase().toLowerCase();
const ECHAPPEMENTS = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };

/** Chemin comparable d'une ligne de `git diff --name-only`, guillemets de git défaits ; ligne citée mal formée : illisible. */
export function cheminDuDiff(ligne) {
  const f = ligne.trim();
  if (!f.startsWith('"')) return comparable(f);
  if (f.length < 2 || !f.endsWith('"')) illisible("une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit");
  const car = [...f.slice(1, -1)];
  const octets = [];
  for (let i = 0; i < car.length; i++) {
    if (car[i] === '"') illisible("une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit");
    if (car[i] !== '\\') {
      octets.push(...Buffer.from(car[i]));
      continue;
    }
    const e = car[++i];
    const octal = car.slice(i, i + 3).join('');
    if (e in ECHAPPEMENTS) octets.push(ECHAPPEMENTS[e]);
    else if (/^[0-3][0-7]{2}$/.test(octal)) {
      octets.push(parseInt(octal, 8));
      i += 2;
    } else illisible("une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit");
  }
  return comparable(Buffer.from(octets).toString('utf8'));
}

// ── L'en-tête YAML d'une règle, trois clés, sans bibliothèque ─────────────────────────────────────────────────────
const EN_TETE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
// La marque d'ordre des octets, écrite par son code : un caractère invisible ne se relit pas dans un source.
const BOM = String.fromCharCode(0xfeff);

/**
 * Un guillemet n'ouvre une chaîne qu'en tête de valeur : au début du texte, après `,`, `[` ou `{`, ou après `:` et
 * un blanc. Partout ailleurs c'est du texte (`c'est grave`), comme une bibliothèque YAML le lit. Dans une chaîne
 * entre apostrophes, `''` est une apostrophe échappée : elle ne ferme pas la chaîne. (Un élément de
 * liste en bloc, `- 'a'`, ne passe pas par ici : `scalaire` lit son guillemet de tête.)
 */
function enTeteDeValeur(texte, i) {
  let j = i - 1;
  while (j >= 0 && (texte[j] === ' ' || texte[j] === '\t')) j--;
  if (j < 0) return true;
  const c = texte[j];
  return c === ',' || c === '[' || c === '{' || (c === ':' && j < i - 1);
}

/** Découpe `a, "b, c", {d, e}` aux virgules de premier niveau, hors guillemets ; guillemet ou crochet non refermé : illisible. */
function decouper(texte) {
  const parts = [];
  let debut = 0;
  let niveau = 0;
  let guillemet = null;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemet) {
      if (guillemet === '"' && c === '\\') i++;
      else if (guillemet === "'" && c === "'" && texte[i + 1] === "'") i++;
      else if (c === guillemet) guillemet = null;
    } else if ((c === '"' || c === "'") && enTeteDeValeur(texte, i)) guillemet = c;
    else if (c === '{' || c === '[') niveau++;
    else if (c === '}' || c === ']') niveau--;
    else if (c === ',' && niveau === 0) {
      parts.push(texte.slice(debut, i));
      debut = i + 1;
    }
    if (niveau < 0) illisible('crochet fermé sans être ouvert');
  }
  if (guillemet || niveau !== 0) illisible('guillemet ou crochet non refermé');
  parts.push(texte.slice(debut));
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

/** Une valeur simple : commentaire ` # …` retiré hors guillemets, guillemets retirés, `''` rendu en apostrophe. */
function scalaire(brut) {
  const v = brut.trim();
  const g = v[0];
  if (g === '"' || g === "'") {
    const chaine = (g === "'" ? /^'((?:[^']|'')*)'/ : /^"([^"]*)"/).exec(v);
    if (!chaine || !/^\s*(#.*)?$/.test(v.slice(chaine[0].length)) || chaine[1].includes('\\')) illisible(`valeur illisible : ${v}`);
    return g === "'" ? chaine[1].replaceAll("''", "'") : chaine[1];
  }
  const i = v.search(/\s#/);
  return (v.startsWith('#') ? '' : i === -1 ? v : v.slice(0, i)).trim();
}

/** La valeur en ligne d'une clé : vide quand la ligne ne porte qu'un commentaire. */
const valeurEnLigne = (v) => (/^\s*#/.test(v) ? '' : v.trim());

/** L'intérieur d'un `{ … }` ou d'un `[ … ]` écrit sur une ligne, un commentaire ` # …` pouvant suivre ; autre chose : illisible. */
function interieur(valeur, ouvrant, fermant) {
  const v = valeur.trim();
  const fin = v.lastIndexOf(fermant);
  if (!v.startsWith(ouvrant) || fin === -1 || !/^\s*(#.*)?$/.test(v.slice(fin + 1))) illisible(`valeur illisible : ${v.slice(0, 80)}`);
  return v.slice(1, fin);
}

/** `{ a: 1, b: 2 }` sur une ligne → Map ; une clé écrite deux fois : illisible (la dernière ne l'emporte pas). */
function mappageEnLigne(valeur) {
  const m = new Map();
  for (const part of decouper(interieur(valeur, '{', '}'))) {
    const i = part.indexOf(':');
    const cle = part.slice(0, Math.max(i, 0)).trim();
    if (cle === '' || m.has(cle)) illisible(`mappage illisible : ${part.slice(0, 80)}`);
    m.set(cle, part.slice(i + 1));
  }
  return m;
}

/** Une ligne sans son commentaire (` # …`, ou `#` en tête), les guillemets respectés. */
function sansCommentaire(ligne) {
  let guillemet = null;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (guillemet) {
      if (guillemet === '"' && c === '\\') i++;
      else if (guillemet === "'" && c === "'" && ligne[i + 1] === "'") i++;
      else if (c === guillemet) guillemet = null;
    } else if ((c === '"' || c === "'") && enTeteDeValeur(ligne, i)) guillemet = c;
    else if (c === '#' && (i === 0 || ligne[i - 1] === ' ' || ligne[i - 1] === '\t')) return ligne.slice(0, i);
  }
  return ligne;
}

/** Les lignes d'un bloc à son premier niveau d'indentation (les plus profondes sont le contenu d'une de ces lignes). */
function premierNiveau(bloc) {
  const retrait = (l) => l.length - l.trimStart().length;
  const min = bloc.reduce((m, l) => Math.min(m, retrait(l)), Infinity);
  return bloc.filter((l) => retrait(l) === min).map((l) => l.trim());
}

/** La valeur d'une clé qui ouvre un mappage ou une liste en ligne (`{ … }`, `[ … ]`), ramenée sur une ligne si elle est pliée, sans ses commentaires ; sinon `null`. */
function enLigne(cle) {
  const debut = cle.valeur !== '' ? cle.valeur : (cle.bloc[0] ?? '').trim();
  // Chaque ligne perd son commentaire avant d'être jointe : celui d'une ligne pliée avalerait sinon la suite.
  return /^[[{]/.test(debut) ? [cle.valeur, ...cle.bloc].map((l) => sansCommentaire(l).trim()).filter(Boolean).join(' ') : null;
}

/** Un champ d'un mappage écrit en ligne (`{ … }`) ou en bloc ; absent : `undefined` ; deux fois : illisible. */
function champ(cle, nom) {
  const ligne = enLigne(cle);
  if (ligne !== null) return mappageEnLigne(ligne).get(nom);
  if (cle.valeur !== '') illisible(`mappage illisible : ${cle.valeur.slice(0, 80)}`);
  if (cle.bloc.length === 0) illisible('clé sans valeur');
  const lignes = premierNiveau(cle.bloc).filter((l) => new RegExp(`^${nom}[ \\t]*:`).test(l));
  if (lignes.length > 1) illisible(`\`${nom}\` écrit deux fois`);
  return lignes[0]?.slice(lignes[0].indexOf(':') + 1);
}

/**
 * Ce que l'en-tête d'un fichier de règle dit de sa criticité : `{ niveau, code, enVigueur }`.
 * `niveau` : `low`, `medium`, `high`, ou `null` sans clé `criticality` (« à classer ») ; les deux formes sont lues,
 * la nue (`criticality: high`) et `{ level, by, reason }`, en ligne ou en bloc. `code` : la liste, en ligne ou en
 * bloc, vide sans la clé. `enVigueur` : faux pour `validation.status` `rejected` ou `obsolete` seulement.
 * Sans en-tête, ou une de ces clés écrite autrement : `Illisible`.
 */
export function enTeteDeRegle(texte) {
  const m = EN_TETE.exec(texte.startsWith(BOM) ? texte.slice(1) : texte);
  if (!m) illisible("pas d'en-tête YAML (`---` en première ligne, refermé par `---`)");
  const cles = new Map();
  let courante = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    if (/^\s*(#.*)?$/.test(ligne)) continue;
    const cle = /^([A-Za-z_][\w-]*)[ \t]*:(?:[ \t]+(.*))?$/.exec(ligne);
    if (cle) {
      if (cles.has(cle[1])) illisible(`clé \`${cle[1]}\` écrite deux fois`);
      courante = { valeur: valeurEnLigne(cle[2] ?? ''), bloc: [] };
      cles.set(cle[1], courante);
    } else if (courante && /^(\s|- |-$)/.test(ligne)) courante.bloc.push(ligne);
    else illisible(`ligne d'en-tête illisible : ${ligne.slice(0, 80)}`);
  }

  let niveau = null;
  const criticite = cles.get('criticality');
  if (criticite) {
    const brut = criticite.valeur !== '' && enLigne(criticite) === null ? criticite.valeur : champ(criticite, 'level');
    niveau = brut === undefined ? illisible('`criticality` sans `level`') : scalaire(brut);
    if (!NIVEAUX.includes(niveau)) illisible(`criticité « ${niveau} » : attendu low, medium ou high`);
  }

  let code = [];
  const c = cles.get('code');
  if (c) {
    let items;
    const ligne = enLigne(c);
    if (ligne !== null) items = decouper(interieur(ligne, '[', ']'));
    else {
      if (c.valeur !== '' || c.bloc.length === 0) illisible(`\`code\` illisible : ${c.valeur.slice(0, 80) || 'sans valeur'}`);
      items = premierNiveau(c.bloc).map((l) => (/^-\s+\S/.test(l) ? l.slice(1) : illisible(`\`code\` illisible : ${l}`)));
    }
    code = items.map(scalaire);
    if (code.some((p) => p === '')) illisible('`code` porte un chemin vide');
  }

  let statut;
  try {
    const validation = cles.get('validation');
    statut = validation ? scalaire(champ(validation, 'status') ?? '') : '';
  } catch {
    statut = ''; // statut que ce lecteur ne comprend pas : la règle compte
  }
  return { niveau, code, enVigueur: !HORS_VIGUEUR.includes(statut) };
}

// ── L'index Anchorpost ────────────────────────────────────────────────────────────────────────────────────────────
/** Les règles d'un index au pivot 2 ou 3 : Map clé comparable → `{ cle, niveau, code, enVigueur }`. Autre chose : `Illisible`. */
export function reglesDeLIndex(texte) {
  let index;
  try {
    index = JSON.parse(texte);
  } catch {
    illisible(`${INDEX} n'est pas du JSON`);
  }
  if (index === null || typeof index !== 'object' || Array.isArray(index)) illisible(`${INDEX} n'est pas un objet`);
  if (index.schema !== '2' && index.schema !== '3') illisible(`${INDEX} de schéma ${JSON.stringify(index.schema)} : ce lecteur lit "2" et "3"`);
  if (!Array.isArray(index.rules)) illisible(`${INDEX} sans liste \`rules\``);
  const regles = new Map();
  for (const r of index.rules) {
    if (typeof r?.key !== 'string' || r.key === '') illisible(`${INDEX} : une règle sans \`key\``);
    if (regles.has(comparable(r.key))) illisible(`${INDEX} : deux entrées pour ${r.key}`);
    const niveau = r.criticality === undefined ? null : r.criticality?.level;
    if (niveau !== null && !NIVEAUX.includes(niveau)) illisible(`${INDEX} : \`criticality.level\` de ${r.key} illisible`);
    const code = r.code ?? [];
    if (!Array.isArray(code) || code.some((p) => typeof p !== 'string')) illisible(`${INDEX} : \`code\` de ${r.key} illisible`);
    regles.set(comparable(r.key), { cle: r.key, niveau, code, enVigueur: !HORS_VIGUEUR.includes(r.validation?.status) });
  }
  return regles;
}

// ── Les lectures git ──────────────────────────────────────────────────────────────────────────────────────────────
const SHA = /^[0-9a-f]{40}$/;
const NOM_DE_BRANCHE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Un nom de branche reçu (`develop`, `sujet/<nom>`) devient la réf qui ne se lit que d'une façon,
 * `refs/remotes/origin/<branche>`. Tout autre texte (`HEAD`, une réf, un texte à blanc ou à retour ligne, un tiret
 * en tête) est refusé, sans être recopié.
 */
export function brancheDOrigin(nom) {
  if (typeof nom !== 'string' || !NOM_DE_BRANCHE.test(nom) || nom === 'HEAD' || /\.\.|\/\/|\/$|\.lock$|\.lock\/|\/\.|\.$/.test(nom))
    illisible('branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`');
  return `refs/remotes/origin/${nom}`;
}
/** Le sommet d'une PR : un sha de 40 caractères, et rien d'autre. */
export function sommet(sha) {
  return typeof sha === 'string' && SHA.test(sha) ? sha : illisible('sommet refusé : attendu un sha de 40 caractères');
}
/** Le nom qu'on écrit d'une réf : `origin/develop` pour `refs/remotes/origin/develop`. */
const court = (nom) => nom.replace(/^refs\/remotes\//, '');

/**
 * Le dossier de ce dépôt, si l'utilisateur l'a déclaré sûr par `safe.directory` ; sinon `null`. C'est le seul réglage
 * d'utilisateur ou de système que le lecteur reprend, et il le reprend pour ce dossier seul : jamais le motif (`*`,
 * `dossier/*`) qui l'a admis. Le dossier est le premier, en remontant, qui porte `.git` : celui que git compare.
 */
function declareSur(cwd) {
  let racine = null;
  try {
    for (let d = realpathSync(resolve(cwd)); racine === null; d = dirname(d)) {
      if (existsSync(join(d, '.git'))) racine = d;
      else if (dirname(d) === d) return null;
    }
  } catch {
    return null;
  }
  // Où vit la configuration de l'utilisateur : ces trois variables le disent, aucune autre `GIT_*` n'est héritée.
  const LIEU = ['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_SYSTEM', 'GIT_CONFIG_NOSYSTEM'];
  const env = Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_') || LIEU.includes(cle)));
  let declares = [];
  for (const portee of ['--system', '--global']) {
    let lus = [];
    try {
      lus = execFileSync('git', ['config', portee, '--includes', '--get-all', 'safe.directory'], { cwd: '/', env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
      lus.pop();
    } catch {
      // Aucune déclaration à cette portée (sortie 1), ou git absent : la première lecture du dépôt le dira.
    }
    // Comme git : une valeur vide efface les déclarations qui la précèdent.
    for (const v of lus) declares = v === '' ? [] : [...declares, v];
  }
  // Le chemin déclaré se compare tel qu'écrit, puis liens symboliques suivis (la racine, elle, l'est déjà).
  const suivi = (chemin) => {
    try {
      return realpathSync(chemin);
    } catch {
      return chemin;
    }
  };
  const admis = (v) => {
    if (v === '*') return true;
    const chemin = (v.startsWith('~/') ? join(homedir(), v.slice(2)) : v).replace(/\/+$/, '');
    if (chemin.endsWith('/*')) return racine.startsWith(chemin.slice(0, -1)) || racine.startsWith(`${suivi(chemin.slice(0, -2))}/`);
    return chemin === racine || suivi(chemin) === racine;
  };
  return declares.some(admis) ? racine : null;
}

/**
 * Lecteur d'objets git du dépôt de `cwd`, par un dépôt propre. `verifier(nom)` → le sha du commit d'un sha ou d'une
 * réf entière, qui n'est pas une réf symbolique ; les autres lectures prennent ce sha : `baseDeFusion(a, b)`,
 * `chemins(commit)` (tout l'arbre), `lister(commit, prefixe)`, `lire(commit, chemins)` → Map chemin → texte ;
 * `sujets()` → les `refs/remotes/origin/sujet/*` ; `fermer()` retire le dépôt propre.
 *
 * Le dépôt réel ne sert qu'à dire où sont ses objets et à résoudre une réf en sha. Tout le reste se lit dans un dépôt
 * nu jetable, créé sous le dossier temporaire, qui emprunte ces objets (`objects/info/alternates`) : il n'a ni
 * configuration, ni greffes, ni `refs/replace`, ni attributs, ni arbre de travail, ni dossier courant (un dépôt nu
 * se lit depuis sa racine). Aucune commande n'hérite d'une
 * variable `GIT_*` (sauf `GIT_CEILING_DIRECTORIES`, qui borne la recherche du dépôt) ni d'une configuration
 * d'utilisateur ou de système, à une exception près : le `safe.directory` par lequel l'utilisateur a déclaré sûr ce
 * dépôt-ci est reporté, pour ce dépôt seul, aux lectures du dépôt réel (sans lui, git refuse le dépôt d'un autre
 * propriétaire). S'il ne se crée pas, si le dépôt est superficiel ou partiel : `Illisible`.
 */
export function lecteurGit(cwd = process.cwd()) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_') || cle === 'GIT_CEILING_DIRECTORIES'));
  Object.assign(env, { GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_ATTR_NOSYSTEM: '1' });
  // Dans le dépôt réel, les greffes et les objets remplacés sont écartés en plus : il ne sert qu'à résoudre des réfs.
  const reel = { cwd, env: { ...env, GIT_GRAFT_FILE: '/dev/null', GIT_NO_REPLACE_OBJECTS: '1' } };
  const sur = declareSur(cwd);
  if (sur) Object.assign(reel.env, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'safe.directory', GIT_CONFIG_VALUE_0: sur });
  const git = (ou, args, input) => {
    try {
      return execFileSync('git', args, { cwd, env, ...ou, input, maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
      if (e?.code === 'ENOENT' && e?.path === 'git') throw new OutilManquant('git est requis par les scripts de la chaîne');
      throw e;
    }
  };
  const essayer = (ou, args, message, input) => {
    try {
      return git(ou, args, input);
    } catch (e) {
      if (e instanceof Illisible) throw e;
      illisible(message);
    }
  };
  const texte = (sortie) => sortie.toString('utf8').trim();
  const lignes = (sortie, separateur) => sortie.toString('utf8').split(separateur).filter(Boolean);

  // Le dépôt propre, créé à la première lecture.
  let dossier = null;
  const retirer = () => {
    if (dossier) rmSync(dossier, { recursive: true, force: true });
    dossier = null;
  };
  const ouvrir = () => {
    if (dossier) return;
    const objets = texte(essayer(reel, ['rev-parse', '--path-format=absolute', '--git-path', 'objects'], 'pas dans un dépôt git'));
    if (!objets.startsWith('/') || objets.includes('\n') || !statSync(objets, { throwIfNoEntry: false })?.isDirectory()) illisible('dossier des objets du dépôt illisible');
    if (texte(essayer(reel, ['rev-parse', '--is-shallow-repository'], 'dépôt illisible')) !== 'false') illisible("dépôt superficiel : l'historique est tronqué, à approfondir avant d'appeler ce calcul (git fetch --unshallow origin)");
    if (partiel()) illisible('dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l\'appeler (git clone sans --filter)');
    try {
      dossier = mkdtempSync(join(tmpdir(), 'double-relecture.'));
      process.once('exit', retirer);
      git({ cwd: dossier }, ['init', '-q', '--bare', '--template=', join(dossier, 'depot')]);
      writeFileSync(join(dossier, 'depot/objects/info/alternates'), `${objets}\n`);
    } catch (e) {
      retirer();
      if (e instanceof Illisible) throw e;
      illisible('dépôt propre impossible à créer sous le dossier temporaire');
    }
  };
  const propre = (args, message, input) => {
    ouvrir();
    return essayer({ cwd: dossier }, [`--git-dir=${join(dossier, 'depot')}`, ...args], message, input);
  };
  // Un clone partiel (`--filter`) : git le marque dans la configuration du dépôt, par un dépôt distant « promisor ».
  // `git config --get-regexp` sort en 1 quand aucune clé ne répond.
  const partiel = () => {
    try {
      return lignes(git(reel, ['config', '--local', '--get-regexp', '^(extensions\\.partialclone|remote\\..+\\.promisor)$']), '\n').some((l) => !/ false$/.test(l));
    } catch (e) {
      if (e instanceof Illisible || e instanceof OutilManquant) throw e;
      return false;
    }
  };
  // `git symbolic-ref -q` sort en 0 pour une réf symbolique (`origin/HEAD`), en 1 pour une réf ordinaire ou absente.
  const symbolique = (nom) => {
    try {
      git(reel, ['symbolic-ref', '-q', nom]);
      return true;
    } catch (e) {
      if (e instanceof Illisible) throw e;
      return false;
    }
  };
  return {
    verifier(nom) {
      const absente = `référence ${court(nom)} introuvable`;
      ouvrir();
      let commit = nom;
      if (nom.startsWith('refs/')) {
        // Dans le dépôt réel : la seule lecture qui lui est faite, avec le dossier de ses objets.
        if (symbolique(nom)) illisible(`${court(nom)} est une référence symbolique`);
        commit = texte(essayer(reel, ['rev-parse', '--verify', '-q', `${nom}^{commit}`], absente));
      }
      if (!SHA.test(commit) || texte(propre(['rev-parse', '--verify', '-q', `${commit}^{commit}`], absente)) !== commit) illisible(absente);
      return commit;
    },
    baseDeFusion(a, b) {
      const commit = texte(propre(['merge-base', a, b], 'pas de base de fusion entre la cible et la tête'));
      return SHA.test(commit) ? commit : illisible('pas de base de fusion entre la cible et la tête');
    },
    sujets() {
      ouvrir();
      return lignes(essayer(reel, ['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/sujet/'], 'branches de sujet illisibles'), '\n');
    },
    chemins(commit) {
      return lignes(propre(['ls-tree', '-r', '-z', '--name-only', commit], `arbre de ${commit} illisible`), '\0');
    },
    lister(commit, prefixe) {
      return lignes(propre(['ls-tree', '-r', '-z', '--name-only', commit, '--', prefixe], `arbre de ${commit} illisible`), '\0');
    },
    lire(commit, chemins) {
      const textes = new Map();
      if (chemins.length === 0) return textes;
      const brut = propre(['cat-file', '--batch'], `objets de ${commit} illisibles`, chemins.map((c) => `${commit}:${c}\n`).join(''));
      let i = 0;
      for (const chemin of chemins) {
        const fin = brut.indexOf(10, i);
        const taille = / blob (\d+)$/.exec(brut.subarray(i, Math.max(fin, i)).toString('utf8'))?.[1];
        if (fin === -1 || taille === undefined) illisible(`${chemin} illisible dans ${commit}`);
        textes.set(chemin, brut.subarray(fin + 1, fin + 1 + Number(taille)).toString('utf8'));
        i = fin + 2 + Number(taille);
      }
      return textes;
    },
    fermer: retirer,
  };
}

// ── Le calcul ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** `docs/metier/regles/<ctx>/<RULE_…>.md`, à la racine du dépôt et dans le dossier de son contexte → clé comparable, sinon `null`. */
function regleDuChemin(chemin) {
  const m = /^docs\/metier\/regles\/([^/]+)\/([^/]+)\.md$/.exec(comparable(chemin));
  const lu = m && G.lireIdentifiant(m[2]);
  return lu?.type === 'RULE' && lu.index === undefined && comparable(G.dossierDuContexte(lu.contexte)) === m[1] ? m[2] : null;
}

/** Un chemin de `code`, comparable et sans détour (`apps//api`, `apps/./api`, `apps/x/../api`) ; `null` s'il sort du dépôt ou nomme sa racine (`.`, `/`, vide). */
function cheminDeCode(chemin) {
  const segments = [];
  for (const segment of chemin.trim().split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment !== '..') segments.push(segment);
    else if (segments.pop() === undefined) return null;
  }
  return segments.length ? comparable(segments.join('/')) : null;
}

/** Les règles hautes et en vigueur de l'arbre d'un commit : `{ regles: Map clé comparable → { cle, code }, source }`. `nom` : la réf, pour les messages. */
function hautes(nom, commit, touchees, lecteur) {
  const fichiers = new Map(); // clé comparable → chemin réel
  for (const chemin of lecteur.lister(commit, REGLES)) {
    const cle = regleDuChemin(chemin);
    if (cle) fichiers.set(cle, chemin);
  }
  const avecIndex = lecteur.lister(commit, INDEX).includes(INDEX);
  const regles = avecIndex ? reglesDeLIndex(lecteur.lire(commit, [INDEX]).get(INDEX)) : new Map();
  // Sans index : tous les en-têtes. Avec : ceux des fichiers de règle que le diff touche, en plus.
  const aLire = [...fichiers].filter(([cle]) => !avecIndex || touchees.has(cle));
  const textes = lecteur.lire(commit, aLire.map(([, chemin]) => chemin));
  for (const [cle, chemin] of aLire) {
    let lu;
    try {
      lu = enTeteDeRegle(textes.get(chemin));
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      illisible(`${nom}:${chemin} : ${e.message}`);
    }
    const connu = regles.get(cle);
    const rang = (n) => NIVEAUX.indexOf(n);
    regles.set(cle, {
      cle: connu?.cle ?? chemin.split('/').pop().slice(0, -3),
      niveau: connu && rang(connu.niveau) > rang(lu.niveau) ? connu.niveau : lu.niveau,
      code: [...(connu?.code ?? []), ...lu.code],
      enVigueur: (connu?.enVigueur ?? false) || lu.enVigueur,
    });
  }
  return { regles: new Map([...regles].filter(([, r]) => r.niveau === 'high' && r.enVigueur)), source: avecIndex ? INDEX : REGLES };
}

// Une ligne d'en-tête, aux formes que le gate `tickets` lit (`enTete`, `tickets-regles.mjs`) : `Règles: …`,
// `- Règles: …`, `**Règles:** …`, sans égard à la casse ; et à la puce étoile (`* Règles: …`), que la CLI
// Anchorpost lit aussi.
const ligneDEnTete = (nom) => new RegExp(`^(?:[-*][ \\t]+)?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');
const RELECTURE = ligneDEnTete('Relecture');
const REGLES_CITEES = ligneDEnTete('Règles');
/** Les valeurs d'une ligne dans l'en-tête d'un document : avant sa première section `## `. */
function valeursDEnTete(texte, motif) {
  const lignes = texte.split(/\r?\n/);
  const fin = lignes.findIndex((l) => /^## /.test(l));
  return (fin === -1 ? lignes : lignes.slice(0, fin)).map((l) => motif.exec(l)?.[1]).filter((v) => v !== undefined);
}
/** Les règles que des lignes `Règles:` citent, clés comparables : des identifiants séparés par des virgules ou des blancs, entre accents graves ou nus, ou `—`. */
function reglesCitees(valeurs, ou) {
  const regles = [];
  for (const v of valeurs)
    for (const morceau of scalaire(v).split(/[\s,]+/).filter((m) => m !== '' && !/^[—–-]$/.test(m))) {
      const nu = /^`([^`]+)`$/.exec(morceau)?.[1] ?? morceau;
      const lu = G.lireIdentifiant(nu);
      if (lu?.type !== 'RULE' || lu.index !== undefined) illisible(`${ou} : ligne \`Règles:\`, « ${morceau.slice(0, 80)} » n'est pas un identifiant de règle`);
      regles.push(comparable(nu));
    }
  return regles;
}

/** Le seul fichier d'une liste, `undefined` si elle est vide ; plusieurs : illisible. */
const unSeul = (fichiers, quoi, nom) => (fichiers.length > 1 ? illisible(`${fichiers.length} fichiers pour ${quoi} sur ${nom} : ${fichiers.join(', ')}`) : fichiers[0]);

/**
 * Ce que l'en-tête du ticket dit dans l'arbre d'un commit : `{ chemin, double, regles: [{ cle, chemin }], sansLigne }`,
 * ou `null` si l'arbre ne le porte pas. `sansLigne` : le ticket n'a pas de ligne `Règles:`, une ligne vide n'en étant
 * pas une ; `Règles: —` en est une, qui dit « aucune ».
 */
function enTeteDuTicket(ticket, nom, commit, lecteur) {
  const motif = G.fichierDuTicket(ticket) ?? illisible(`${ticket} n'est pas un identifiant de ticket`);
  const chemin = unSeul(lecteur.lister(commit, 'docs/').filter((p) => motif.test(`/${p}`) && !G.estArchive(`/${p}`)), `le ticket ${ticket}`, nom);
  if (chemin === undefined) return null;
  const texte = lecteur.lire(commit, [chemin]).get(chemin);
  const relectures = valeursDEnTete(texte, RELECTURE);
  for (const v of relectures) if (scalaire(v) !== 'double') illisible(`${nom}:${chemin} : ligne \`Relecture:\` « ${v.trim().slice(0, 80)} », seule valeur \`double\``);
  const lignes = valeursDEnTete(texte, REGLES_CITEES).filter((v) => scalaire(v) !== '');
  const regles = reglesCitees(lignes, `${nom}:${chemin}`).map((cle) => ({ cle, chemin }));
  return { chemin, double: relectures.length > 0, regles, sansLigne: lignes.length === 0 };
}

/** Les règles que la spec du ticket cite dans son en-tête, dans l'arbre d'un commit : `[{ cle, chemin }]`, vide sans spec. */
function reglesDeLaSpec(ticket, nom, commit, lecteur) {
  const { spec } = G.lireTicket(ticket);
  const chemin = unSeul(lecteur.lister(commit, 'docs/').filter((p) => G.identifiantDeLaSpec(p.split('/').pop()) === spec), `la spec ${spec}`, nom);
  if (chemin === undefined) return [];
  return reglesCitees(valeursDEnTete(lecteur.lire(commit, [chemin]).get(chemin), REGLES_CITEES), `${nom}:${chemin}`).map((cle) => ({ cle, chemin }));
}

/**
 * La PR exige-t-elle deux relectures ? `fichiers` : les lignes de `git diff --name-only --no-renames` ; `base`,
 * `tete` : la branche cible (un nom de branche) et le sommet (un sha) ; `tickets` : les identifiants des tickets de la PR
 * (aucun, un, ou deux quand son titre et sa branche n'en nomment pas le même) ; `develop` : le nom de la branche d'intégration.
 * `lecteur` : le lecteur git, par défaut celui du dépôt courant. Rend `{ reponse, causes, illisibles, remarques, outilManquant }`.
 */
export function doubleRelecture({ lecteur, ...pr }) {
  // Le lecteur par défaut lit par un dépôt propre, jetable : il est retiré quoi qu'il arrive.
  const propre = lecteur ?? lecteurGit();
  try {
    return calculer({ ...pr, lecteur: propre });
  } finally {
    if (!lecteur) propre.fermer();
  }
}

function calculer({ fichiers, base: cible, tete: sha, tickets = [], develop: integration = DEVELOP, lecteur }) {
  const causes = [];
  const illisibles = [];
  const remarques = [];
  let outilManquant = false;
  const essayer = (lecture) => {
    try {
      return lecture();
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      outilManquant ||= e instanceof OutilManquant;
      if (!illisibles.includes(e.message)) illisibles.push(e.message);
      return undefined;
    }
  };
  if (!G) return { reponse: ILLISIBLE, causes, illisibles: [`scripts/docs/identifiants.mjs introuvable depuis ${ICI}`], remarques, outilManquant: true };

  // Trois réfs : deux branches d'origin, lues en entier, et un sha. Tout ce qui suit lit leurs commits.
  const [base, tete, develop] = [{ branche: cible }, { sommet: sha }, { branche: integration }];
  const reference = (ref) => ('branche' in ref ? brancheDOrigin(ref.branche) : sommet(ref.sommet));
  const commitDe = (ref) => lecteur.verifier(reference(ref));
  const nomDe = (ref) => court(reference(ref));

  // 0. L'entrée : des chemins, un par ligne, qui existent au départ ou à la tête de la PR.
  let chemins = [];
  essayer(() => {
    const lignes = fichiers.filter((f) => f.trim() !== '');
    if (lignes.some((f) => /[\t\0]/.test(f))) illisible("l'entrée porte une tabulation ou un octet nul : attendu la sortie de `git diff --name-only --no-renames`, un chemin par ligne");
    chemins = lignes.map((f) => ({ ecrit: f.trim(), lu: cheminDuDiff(f) }));
  });
  const depart = essayer(() => lecteur.baseDeFusion(commitDe(base), commitDe(tete)));
  essayer(() => {
    if (depart === undefined || chemins.length === 0) return;
    // Au départ, à la tête, et sur la cible et develop : la PR de mise à jour d'un sujet peut supprimer un fichier venu de develop.
    const arbres = new Set([depart, commitDe(tete), commitDe(base), commitDe(develop)]);
    const connus = new Set([...arbres].flatMap((commit) => lecteur.chemins(commit)).map(comparable));
    const inconnus = chemins.filter((c) => !connus.has(c.lu)).length;
    if (inconnus > 0) {
      chemins = [];
      illisible(`${inconnus} chemin(s) de l'entrée n'existent ni au départ, ni à la tête, ni sur la cible, ni sur develop : attendu la sortie de \`git diff --name-only --no-renames\``);
    }
  });
  const touchees = new Set(chemins.map((c) => regleDuChemin(c.lu)).filter(Boolean));

  // Les règles hautes d'un arbre, lues une fois par commit : la base est souvent `origin/develop`, ou le départ.
  // Un échec est gardé comme une réussite, avec la réf qui l'a lu la première : il n'est dit qu'une fois.
  const parCommit = new Map();
  const hautesDe = (commit, nom) => {
    if (!parCommit.has(commit)) {
      try {
        parCommit.set(commit, hautes(nom, commit, touchees, lecteur));
      } catch (e) {
        if (!(e instanceof Illisible) || e instanceof OutilManquant) throw e;
        parCommit.set(commit, new Illisible(e.message.startsWith(`${nom}:`) ? e.message : `${nom} : ${e.message}`));
      }
    }
    const lu = parCommit.get(commit);
    if (lu instanceof Illisible) throw lu;
    return lu;
  };

  // 1. Le diff touche le fichier d'une règle haute, ou un fichier de son `code` : sur la base, la tête et develop.
  const hautesQuelquePart = new Map(); // clé comparable → clé écrite
  for (const ref of [base, tete, develop])
    essayer(() => {
      const nom = nomDe(ref);
      const { regles } = hautesDe(commitDe(ref), nom);
      const parCode = new Map();
      for (const [cle, r] of regles) {
        hautesQuelquePart.set(cle, r.cle);
        for (const p of r.code) {
          // Une entrée qui nomme la racine du dépôt, ou en sort, ne dit pas quels fichiers réalisent la règle : pas « aucun ».
          const entree = cheminDeCode(p) ?? illisible(`${nom} : une entrée de \`code\` de ${r.cle} nomme la racine du dépôt ou en sort`);
          parCode.set(entree, [...(parCode.get(entree) ?? []), r.cle]);
        }
      }
      for (const c of chemins) {
        const regle = regles.get(regleDuChemin(c.lu));
        if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref: nom });
        // Le chemin lui-même, puis chacun de ses dossiers : une entrée de `code` peut nommer un dossier.
        for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')
          for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref: nom });
      }
    });

  // 2. La PR change le niveau d'une règle vers ou depuis « haute » : de son départ à sa tête.
  essayer(() => {
    if (depart === undefined) return;
    const avant = hautesDe(depart, 'le départ de la PR');
    const apres = hautesDe(commitDe(tete), nomDe(tete));
    for (const [cle, r] of [...avant.regles, ...apres.regles])
      if (avant.regles.has(cle) !== apres.regles.has(cle)) causes.push({ sujet: r.cle, motif: 'niveau', chemin: apres.source, ref: nomDe(tete) });
  });

  // 3. Le ticket : `Relecture: double`, ou une règle haute citée en `Règles:`, sur la base, develop, la tête et chaque
  //    sujet. Sans ligne `Règles:` dans l'un de ces arbres, celle de sa spec est lue à sa place, dans tous ces arbres.
  if (tickets.length > 0) {
    const refs = new Map(); // commit → nom : un même commit n'est lu qu'une fois
    for (const ref of [base, develop, tete]) essayer(() => refs.has(commitDe(ref)) || refs.set(commitDe(ref), nomDe(ref)));
    for (const nom of essayer(() => lecteur.sujets()) ?? []) essayer(() => refs.has(lecteur.verifier(nom)) || refs.set(lecteur.verifier(nom), court(nom)));
    const citer = (regles, nom) => {
      for (const { cle, chemin } of regles) if (hautesQuelquePart.has(cle)) causes.push({ sujet: hautesQuelquePart.get(cle), motif: 'Règles:', chemin, ref: nom });
    };
    for (const ticket of new Set(tickets)) {
      let trouve = false;
      let sansLigne = false;
      for (const [commit, nom] of refs)
        essayer(() => {
          const lu = enTeteDuTicket(ticket, nom, commit, lecteur);
          if (!lu) return;
          trouve = true;
          sansLigne ||= lu.sansLigne;
          if (lu.double) causes.push({ sujet: ticket, motif: 'Relecture: double', chemin: lu.chemin, ref: nom });
          citer(lu.regles, nom);
        });
      if (sansLigne) for (const [commit, nom] of refs) essayer(() => citer(reglesDeLaSpec(ticket, nom, commit, lecteur), nom));
      if (!trouve && refs.size > 0) remarques.push(`ticket ${ticket} absent de ${[...refs.values()].join(', ')} : aucun en-tête lu`);
    }
  }

  // Une cause par (règle ou ticket, motif, chemin) : la première réf où elle est lue.
  const vues = new Set();
  const uniques = causes.filter((c) => {
    const k = `${c.sujet}\t${c.motif}\t${c.chemin}`;
    return !vues.has(k) && vues.add(k);
  });
  const reponse = uniques.length ? EXIGEE : illisibles.length ? ILLISIBLE : NON_EXIGEE;
  return { reponse, causes: uniques, illisibles, remarques, outilManquant: reponse === ILLISIBLE && outilManquant };
}

/**
 * Ce que la ligne de commande écrit : les causes, les lectures en échec et les remarques en `# …`, puis le verdict,
 * seul sur la dernière ligne. Chaque champ et chaque message tient sur une ligne, sans tabulation ni caractère de
 * commande : rien de ce qui est lu dans le dépôt ne peut écrire une ligne de plus.
 */
export function texte({ reponse, causes, illisibles, remarques }) {
  // Tout caractère de commande, séparateurs de ligne d'Unicode compris (U+0085, U+2028, U+2029), devient une espace.
  const SEPARATEURS = [0x85, 0x2028, 0x2029].map((c) => String.fromCharCode(c)).join('');
  const propre = (t) => `${t}`.replace(new RegExp(`[\\x00-\\x1f\\x7f${SEPARATEURS}]+`, 'g'), ' ').slice(0, 500);
  return [
    ...causes.map((c) => [c.sujet, c.motif, c.chemin, c.ref].map(propre).join('\t')),
    ...illisibles.map((m) => `# illisible : ${propre(m)}`),
    ...remarques.map((m) => `# ${propre(m)}`),
    reponse,
  ]
    .map((l) => `${l}\n`)
    .join('');
}

const USAGE = 'usage : git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> | node double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]';

/** `--base` et `--tete`, exigées et non vides ; `--titre` et `--branche`, facultatives, vides admises. Autre chose : `null`. */
export function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    const valeur = argv[i + 1];
    if (!['--base', '--tete', '--titre', '--branche'].includes(cle) || valeur === undefined || cle.slice(2) in options) return null;
    options[cle.slice(2)] = valeur;
  }
  return options.base && options.tete ? options : null;
}

/** Les tickets d'une PR : celui que `ticketDeLaPr` rend (le titre d'abord), et celui de la branche s'il est autre. */
export function ticketsDeLaPr(titre = '', branche = '') {
  return G ? [...new Set([G.ticketDeLaPr(titre, branche), G.identifiantDeBranche(branche)].filter(Boolean))] : [];
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
  const options = lireArguments(process.argv.slice(2));
  let resultat;
  if (!options) resultat = { reponse: ILLISIBLE, causes: [], illisibles: [USAGE], remarques: [] };
  else
    try {
      const fichiers = readFileSync(0, 'utf8').split('\n');
      resultat = doubleRelecture({ fichiers, base: options.base, tete: options.tete, tickets: ticketsDeLaPr(options.titre, options.branche) });
    } catch (e) {
      resultat = { reponse: ILLISIBLE, causes: [], illisibles: ['le calcul a échoué sans conclure'], remarques: [] };
    }
  process.stdout.write(texte(resultat));
  process.exitCode = resultat.outilManquant ? SORTIES.outilManquant : SORTIES[resultat.reponse];
}
