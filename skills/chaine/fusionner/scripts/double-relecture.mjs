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
// YAML d'une règle est lu ici, sans bibliothèque, par une liste fermée de formes de ligne (`A-143`). Le lecteur ne
// lit que ce que cette liste admet, sur tout l'en-tête ; une seule ligne hors liste, ou un en-tête refusé au sens
// (niveau hors vocabulaire, `criticality` sans `level`, `code` qui n'est pas une liste, fichier sans en-tête), et la
// règle n'est pas lue :
// on ne prouve pas ce qu'on ne lit pas, elle est une cause (« en-tête illisible »), la réponse est « exigée », et
// le message dit le fichier, la ligne et la raison. Tant que cet en-tête n'est pas récrit, toute PR du dépôt
// répond « exigée ». De même un ticket que la PR nomme et qu'aucun arbre ne porte, ou que tous portent archivé
// (« ticket introuvable »).
//
// Le niveau d'une règle se lit sur trois arbres, la base, la tête et `origin/develop` (un sujet en retard ne cache
// pas une règle montée dans develop) ; le plus haut l'emporte. Dans l'index Anchorpost de l'arbre
// (`anchorpost/anchorpost.json`, schéma "2" ou "3") : `criticality.level` de l'entrée de `rules` dont la `key`
// est l'identifiant de la règle, le niveau effectif, criticité reçue d'une feature comprise ; ses fichiers de
// code dans `code`, son statut dans `validation.status`. Sans index : dans l'en-tête de chaque fichier de règle
// (`docs/metier/regles/<ctx>/<RULE_…>.md`), qui ne voit pas une criticité reçue d'une feature. Avec un index,
// les en-têtes sont lus aussi, à chaque référence : une règle est haute et comptée dès que l'une des deux lectures
// le dit, et son `code` est l'union des deux ; un index ancien, incomplet ou que la PR n'a pas régénéré ne cache
// rien. Une règle `rejected` ou `obsolete` (des deux côtés, quand il y a un index) ne compte pas. Un fichier de
// règle dont l'en-tête est hors liste est une cause quoi que dise un index lisible ; les autres règles restent lues
// (un index illisible rend l'arbre entier illisible avant que les en-têtes soient lus : sortie 21, pas de cause).
// Le changement de niveau se lit entre le départ de la PR (la base de fusion de sa cible et de sa tête) et sa tête :
// ce qu'une autre PR a changé dans la cible depuis n'est pas un changement de celle-ci.
//
// L'en-tête du ticket (`Relecture:`, `Règles:`, aux formes que le gate `tickets` lit, puce étoile en plus) se lit
// sur la base, sur `origin/develop`, sur la tête et sur chaque `origin/sujet/*` : une seule de ces lectures qui dit
// « double » ou cite une règle haute suffit. Un ticket sans ligne `Règles:` (une ligne vide n'en est pas une) hérite
// de celle de sa spec, cherchée dans les mêmes arbres ; `Règles: —` dit « aucune ».
//
// Sortie standard : une ligne par cause
// (`<règle ou ticket>\t<fichier | code | niveau | Règles: | Relecture: double | en-tête illisible | ticket introuvable>\t<chemin>\t<réf>`),
// une ligne `# …` par lecture en échec ou remarque, et, EN DERNIÈRE LIGNE, le seul verdict : `exigée`, `non exigée`
// ou `illisible`. Une cause établie suffit : « illisible » n'est rendu que si aucune ne l'est (un index illisible,
// une réf introuvable, un dépôt superficiel, un ticket trouvé et mal lu, un usage faux).
// Sorties : 0 non exigée · 20 exigée · 21 illisible (usage compris) · 69 outil manquant (`git`, ou la grammaire
// des identifiants), dernière ligne `illisible`. Qui appelle ne lit « non exigée » que sur la sortie 0 ET la
// dernière ligne ; tout autre code que 0 et 20 (un plantage de node sort en 1) se lit « illisible ».
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
// Deux motifs de cause qui ne disent pas « haute », mais « pas lu » : on ne prouve pas ce qu'on ne lit pas (`A-143`).
export const EN_TETE_ILLISIBLE = 'en-tête illisible';
export const TICKET_INTROUVABLE = 'ticket introuvable';

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

// ── L'en-tête YAML d'une règle : une liste fermée de formes de ligne, sans bibliothèque (A-143) ───────────────────
// Le lecteur n'admet que les formes ci-dessous ; toute autre ligne rend l'en-tête « illisible », et le message dit
// le numéro de la ligne dans le fichier et la raison. Tout l'en-tête est lu, pas trois clés seulement : une ligne
// hors liste sous `sources:` ou `extensions:` est « illisible » comme une autre. Chaque ligne admise n'a qu'un sens
// pour une bibliothèque YAML ; l'arbre entier est construit, puis `criticality`, `code` et `validation.status` y
// sont pris.
//
//   ligne vide, ou d'espaces                         (sautée)
//   <retrait># commentaire                           (sautée)
//   <retrait>clé: <valeur>                           une paire ; aucune ligne plus profonde ne la suit
//   <retrait>clé:                                    un bloc plus profond la suit (mappage ou liste), ou une liste au
//                                                    même retrait (`clé:` puis `- …`), ou rien (`null`, que `code`
//                                                    refuse : « attendu une liste de chemins »)
//   <retrait>- <valeur>                              un élément de liste
//   <retrait>- clé: <valeur>   |   <retrait>- clé:   un élément qui ouvre un mappage, au retrait de sa clé
//
//   <valeur>   un scalaire nu | "…" | '…' | { clé: scalaire, … } | [ scalaire, … ], le tout sur la ligne ;
//              ` # commentaire` peut suivre.
//   retrait    des espaces seules ; les lignes d'un bloc ont toutes le même ; un bloc est plus profond que sa clé.
//   clé        [A-Za-z_][A-Za-z0-9_-]*, nue, 100 caractères au plus, `:` collé, puis une espace ou la fin ; jamais
//              `true`, `false`, `null` ni un nombre (YAML n'y lit pas un texte : `true:` et `True:` seraient la même
//              clé) ; deux fois dans un mappage : illisible.
//   nu         commence par une lettre, un chiffre, `.` ou `_` ; ne porte ni `: `, ni `:` final ; ` #` ouvre le
//              commentaire. Dans { } et [ ] : lettres, chiffres, espace et _ . / ( ) ' ’ « » ; - seulement.
//   "…"        fermée sur la ligne ; seuls échappements `\"` et `\\`.      '…'   fermée sur la ligne ; `''` pour l'apostrophe.
//   { } [ ]    ouverts et fermés sur la ligne, sans imbrication, sans virgule finale ; `{}` et `[]`.
//
// Et les trois formes qu'un formateur (Prettier 3) donne à un mappage ou à une liste en ligne trop longs, à ses
// retraits exacts, R étant le retrait de la clé ou du tiret :
//
//   <R>clé:                          le flux entier, `{ … }` ou `[ … ]` comme ci-dessus, seul sur la ligne qui suit
//   <R+2>{ clé: scalaire, … }        sa clé, au retrait R+2 ; `clé:` sans rien après, pas même un commentaire ; ni
//                                    ligne vide ni commentaire entre les deux (`A-151`).
//
//   <R>clé:            <R>clé: {           <R>- {              l'ouvrant, `{` ou `[`, seul : sur sa ligne au retrait
//   <R+2>{             <R+4>clé: scalaire, <R+4>clé: scalaire,  R+2, ou en fin de la ligne de la clé ou du tiret ;
//   <R+4>clé: scalaire,<R+2>}              <R+2>}              une entrée par ligne, au retrait R+4, virgule finale
//   <R+2>}                                                     collée, la dernière comprise ; le fermant au retrait
//                                                              R+2, ` # commentaire` pouvant le suivre.
//   Entre l'ouvrant et le fermant : ni ligne vide, ni commentaire, ni entrée sur deux lignes, ni imbrication.
//   Hors liste, donc : ce que Prettier écrit sous `proseWrap: always` (une chaîne pliée), sous `trailingComma: none`
//   (la dernière entrée sans virgule) ou à un retrait autre que 2 ; le réglage du socle n'en écrit aucune.
//
// Tabulation, `\r` isolé, caractère de commande, marque d'ordre des octets, espace insécable et autres blancs
// d'Unicode : illisible, où qu'ils soient. Scalaire en bloc (`|`, `>`), texte plié sur plusieurs lignes, étiquette,
// ancre, alias, clé entre guillemets, clé explicite (`? `) : hors liste, donc illisible.
const EN_TETE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const INTERDITS = /[\u0000-\u001f\u007f-\u00a0\u00ad\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ufeff\ufffd-\uffff]/;
const CLE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: +(.*))?$/;
const CLE_D_ELEMENT = /^[A-Za-z_][A-Za-z0-9_-]*:(?: |$)/;
// Motifs « collants » : ils se jouent à une position de la ligne, qui n'est jamais recopiée (lecture en temps linéaire).
const CITE = /"((?:[^"\\]|\\["\\])*)"|'((?:[^']|'')*)'/y;
const NU_EN_FLUX = /[\p{L}\p{N}._][\p{L}\p{N} _.\/()'’«»;-]*/uy;
const CLE_EN_FLUX = /([A-Za-z_][A-Za-z0-9_-]*): +/y;
const DEBUT_DE_NU = /^[\p{L}\p{N}._]/u;
// Ce que YAML ne lit pas comme un texte : nul, booléen, nombre. Ni une clé ni un chemin de `code` nu ne peuvent en être un.
const PAS_UN_TEXTE = /^(?:null|Null|NULL|true|True|TRUE|false|False|FALSE|[-+]?[0-9]+|0o[0-7]+|0x[0-9a-fA-F]+|[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/;
const LONGUEUR_DE_CLE = 100; // YAML refuse une clé de plus de 1 024 caractères

/** Une ligne de l'en-tête est refusée : le numéro est celui de la ligne dans le fichier, la première étant `---`. */
const ligneRefusee = (n, raison, texte = '') => illisible(`ligne ${n} : ${raison}${texte === '' ? '' : ` : ${texte.slice(0, 60)}`}`);

/** Une clé admise : assez courte, et un texte pour YAML. */
const cleAdmise = (cle) => cle.length <= LONGUEUR_DE_CLE && !PAS_UN_TEXTE.test(cle);

/** Un scalaire lu : son texte, et s'il était nu. */
const unTexte = (texte, nu) => ({ texte, nu });
const estScalaire = (v) => v !== null && typeof v === 'object' && typeof v.texte === 'string';

/** `s` sans ses espaces finales, sans motif à retour arrière. */
function sansEspacesFinales(s) {
  let fin = s.length;
  while (fin > 0 && s[fin - 1] === ' ') fin--;
  return fin === s.length ? s : s.slice(0, fin);
}

/** Un motif collant joué à la position `p` de `s` → `[correspondance, position suivante]`, sinon `null`. */
function colle(motif, s, p) {
  motif.lastIndex = p;
  const m = motif.exec(s);
  return m ? [m, motif.lastIndex] : null;
}

/** Une chaîne entre guillemets à la position `p` de `s` → `[scalaire, position suivante]`, sinon `null`. */
function chaine(s, p) {
  const lu = colle(CITE, s, p);
  if (!lu) return null;
  const [m, suite] = lu;
  return [unTexte(m[1] !== undefined ? m[1].replace(/\\(["\\])/g, '$1') : m[2].replaceAll("''", "'"), false), suite];
}

/** Ce qui peut suivre une valeur sur sa ligne, à partir de `p` : rien, ou une espace au moins et un commentaire. */
function finDeLigne(s, p, n) {
  let q = p;
  while (s[q] === ' ') q++;
  if (q === s.length || (q > p && s[q] === '#')) return;
  ligneRefusee(n, 'après une valeur, ni la fin de la ligne ni un commentaire', s.slice(p));
}

/**
 * Une entrée d'un mappage ou d'une liste en ligne, à la position `p` de `s` : `clé: scalaire` (dans une `Map`) ou
 * `scalaire` (dans une liste), rangée dans `lu` → la position qui suit le scalaire, espaces finales d'un nu comprises.
 */
function entreeDeFlux(s, p, lu, n) {
  let cle;
  let q = p;
  if (lu instanceof Map) {
    const k = colle(CLE_EN_FLUX, s, q);
    if (!k || !cleAdmise(k[0][1])) ligneRefusee(n, 'dans un mappage en ligne, attendu `clé: scalaire`', s.slice(q));
    if (lu.has(k[0][1])) ligneRefusee(n, `clé \`${k[0][1]}\` écrite deux fois`);
    [cle, q] = [k[0][1], k[1]];
  }
  let valeur;
  const cite = chaine(s, q);
  if (cite) [valeur, q] = cite;
  else {
    const nu = colle(NU_EN_FLUX, s, q) ?? ligneRefusee(n, 'dans un mappage ou une liste en ligne, attendu un scalaire entre guillemets, ou nu et sans autre signe que _ . / ( ) \' ’ « » ; -', s.slice(q));
    valeur = unTexte(sansEspacesFinales(nu[0][0]), true);
    q = nu[1];
  }
  if (lu instanceof Map) lu.set(cle, valeur);
  else lu.push(valeur);
  return q;
}

/** `{ clé: scalaire, … }` ou `[ scalaire, … ]` en tête de `s`, sur une ligne, sans imbrication → `[Map | liste, position suivante]`. */
function fluxEnLigne(s, n) {
  const fermant = s[0] === '{' ? '}' : ']';
  const lu = s[0] === '{' ? new Map() : [];
  let p = 1;
  while (s[p] === ' ') p++;
  if (s[p] === fermant) return [lu, p + 1];
  for (;;) {
    p = entreeDeFlux(s, p, lu, n);
    while (s[p] === ' ') p++;
    if (s[p] === fermant) return [lu, p + 1];
    if (s[p] !== ',') ligneRefusee(n, `dans un mappage ou une liste en ligne, attendu \`,\` ou \`${fermant}\` sur la même ligne`, s.slice(p));
    p++;
    while (s[p] === ' ') p++;
  }
}

/** La valeur écrite sur une ligne, après `clé: ` ou `- ` : un scalaire, un mappage ou une liste en ligne. */
function valeurDeLigne(s, n) {
  if (s[0] === '"' || s[0] === "'") {
    const cite = chaine(s, 0) ?? ligneRefusee(n, 'chaîne entre guillemets non refermée sur sa ligne, ou échappement autre que `\\"`, `\\\\` et `\'\'`', s);
    finDeLigne(s, cite[1], n);
    return cite[0];
  }
  if (s[0] === '{' || s[0] === '[') {
    const [lu, suite] = fluxEnLigne(s, n);
    finDeLigne(s, suite, n);
    return lu;
  }
  if (!DEBUT_DE_NU.test(s)) ligneRefusee(n, 'une valeur nue commence par une lettre, un chiffre, `.` ou `_`', s);
  const i = s.indexOf(' #');
  const nu = sansEspacesFinales(i === -1 ? s : s.slice(0, i));
  if (nu.includes(': ') || nu.endsWith(':')) ligneRefusee(n, 'des deux-points dans un texte nu, à mettre entre guillemets', nu);
  return unTexte(nu, true);
}

/** L'en-tête entier → `[arbre, lignes des clés du premier niveau]` ; l'arbre : `Map` (mappage), liste, scalaire `{ texte, nu }` ou `null` (clé sans valeur). */
function arbreDeLEnTete(lignes) {
  const utiles = []; // les lignes qui portent autre chose qu'un commentaire : `{ n, retrait, texte }`
  lignes.forEach((brute, k) => {
    const n = k + 2;
    if (INTERDITS.test(brute)) ligneRefusee(n, "une tabulation, un caractère de commande, une marque invisible ou un blanc autre que l'espace");
    const ligne = sansEspacesFinales(brute);
    let retrait = 0;
    while (ligne[retrait] === ' ') retrait++;
    if (retrait === ligne.length || ligne[retrait] === '#') return;
    utiles.push({ n, retrait, texte: ligne.slice(retrait) });
  });
  const lignesDesCles = new Map(); // les clés du premier niveau → leur ligne
  let i = 0;
  const refuser = (u, raison) => ligneRefusee(u.n, raison, u.texte);

  // Le mappage ou la liste pliés par un formateur. `R` : le retrait de la clé ou du tiret ; `n` : la ligne de l'ouvrant.
  const fluxPlie = (R, ouvrant, n) => {
    const fermant = ouvrant === '{' ? '}' : ']';
    const lu = ouvrant === '{' ? new Map() : [];
    for (let attendue = n + 1; ; attendue++) {
      const u = utiles[i];
      if (!u || u.n !== attendue) ligneRefusee(attendue, `dans un mappage ou une liste pliés, attendu une entrée ou \`${fermant}\`, sans ligne vide ni commentaire`);
      if (u.retrait === R + 2 && u.texte[0] === fermant) {
        if ((lu instanceof Map ? lu.size : lu.length) === 0) refuser(u, 'un mappage ou une liste pliés sans entrée');
        finDeLigne(u.texte, 1, u.n);
        i++;
        break;
      }
      if (u.retrait !== R + 4) refuser(u, `dans un mappage ou une liste pliés, une entrée est au retrait ${R + 4} et \`${fermant}\` au retrait ${R + 2}`);
      const p = entreeDeFlux(u.texte, 0, lu, u.n);
      if (u.texte[p] !== ',' || p + 1 !== u.texte.length || u.texte[p - 1] === ' ') refuser(u, 'dans un mappage ou une liste pliés, une entrée par ligne, suivie de sa virgule');
      i++;
    }
    return lu;
  };

  // Ce qu'une clé du retrait `R` ouvre, `reste` étant ce qui suit `clé: ` sur sa ligne.
  const valeurDeCle = (u, reste, R) => {
    if (reste === '{' || reste === '[') return fluxPlie(R, reste, u.n);
    if (reste !== '' && reste[0] !== '#') return valeurDeLigne(reste, u.n);
    const suivante = utiles[i];
    if (suivante && suivante.retrait > R) {
      if (suivante.texte === '{' || suivante.texte === '[') {
        if (reste !== '' || suivante.retrait !== R + 2 || suivante.n !== u.n + 1) refuser(suivante, `l'ouvrant d'un mappage ou d'une liste pliés suit sa clé, seul sur sa ligne, au retrait ${R + 2}`);
        i++;
        return fluxPlie(R, suivante.texte, suivante.n);
      }
      // La troisième forme du formateur : le mappage ou la liste en ligne entiers, seuls sur la ligne qui suit leur
      // clé (`clé:` sans rien après, pas même un commentaire), au retrait R+2 exactement.
      if (suivante.texte[0] === '{' || suivante.texte[0] === '[') {
        if (reste !== '' || suivante.retrait !== R + 2 || suivante.n !== u.n + 1) refuser(suivante, `un mappage ou une liste en ligne sous sa clé la suit immédiatement, sans commentaire après la clé, au retrait ${R + 2}`);
        i++;
        const [lu, suite] = fluxEnLigne(suivante.texte, suivante.n);
        finDeLigne(suivante.texte, suite, suivante.n);
        return lu;
      }
      return suivante.texte.startsWith('- ') ? liste(suivante.retrait) : mappage(suivante.retrait);
    }
    return suivante && suivante.retrait === R && suivante.texte.startsWith('- ') ? liste(R) : null;
  };

  const mappage = (R) => {
    const lu = new Map();
    while (i < utiles.length && utiles[i].retrait === R) {
      const u = utiles[i];
      const cle = CLE.exec(u.texte);
      if (!cle || !cleAdmise(cle[1])) refuser(u, 'ni `clé: valeur`, ni `clé:`, ni `- valeur`');
      if (lu.has(cle[1])) refuser(u, `clé \`${cle[1]}\` écrite deux fois`);
      if (R === 0) lignesDesCles.set(cle[1], u.n);
      i++;
      lu.set(cle[1], valeurDeCle(u, cle[2] ?? '', R));
    }
    return lu;
  };

  const liste = (R) => {
    const lu = [];
    while (i < utiles.length && utiles[i].retrait === R && utiles[i].texte.startsWith('- ')) {
      const u = utiles[i];
      const reste = u.texte.slice(2);
      if (reste === '{' || reste === '[') {
        i++;
        lu.push(fluxPlie(R, reste, u.n));
      } else if (CLE_D_ELEMENT.test(reste)) {
        // L'élément ouvre un mappage, au retrait de sa clé.
        utiles[i] = { n: u.n, retrait: R + 2, texte: reste };
        lu.push(mappage(R + 2));
      } else {
        i++;
        lu.push(valeurDeLigne(reste, u.n));
      }
    }
    return lu;
  };

  if (utiles.length === 0) return [new Map(), lignesDesCles];
  if (utiles[0].retrait !== 0) refuser(utiles[0], "l'en-tête ne commence pas en première colonne");
  const racine = mappage(0);
  // Un mappage et une liste s'arrêtent à la première ligne qui n'est pas à leur retrait ; une ligne que personne n'a
  // prise est plus profonde que ce qui la précède sans en être le bloc, ou à un retrait entre deux niveaux.
  if (i < utiles.length) refuser(utiles[i], 'ligne mal alignée : ni au retrait de son bloc, ni le bloc de la clé qui la précède');
  return [racine, lignesDesCles];
}

/** La valeur d'une ligne `Relecture:` d'un ticket : commentaire ` # …` retiré, guillemets retirés ; autre chose après une chaîne : illisible. */
function scalaire(brut) {
  const v = brut.trim();
  const g = v[0];
  if (g === '"' || g === "'") {
    const cite = (g === "'" ? /^'([^']*)'/ : /^"([^"]*)"/).exec(v);
    if (!cite || !/^\s*(#.*)?$/.test(v.slice(cite[0].length))) illisible(`valeur illisible : ${v}`);
    return cite[1];
  }
  const i = v.search(/\s#/);
  return (v.startsWith('#') ? '' : i === -1 ? v : v.slice(0, i)).trim();
}

/**
 * Ce que l'en-tête d'un fichier de règle dit de sa criticité : `{ niveau, code, enVigueur }`.
 * `niveau` : `low`, `medium`, `high`, ou `null` sans clé `criticality` (« à classer ») ; les deux formes sont lues,
 * la nue (`criticality: high`) et `{ level, by, reason }`, en bloc, en ligne ou pliée par un formateur. `code` : la
 * liste, de même, vide sans la clé. `enVigueur` : faux pour `validation.status` `rejected` ou `obsolete` seulement.
 * Sans en-tête, ou une ligne hors de la liste fermée des formes, où qu'elle soit : `Illisible`, dont le message
 * commence par `ligne <n> : `, le numéro de la ligne dans le fichier.
 */
export function enTeteDeRegle(contenu) {
  const m = EN_TETE.exec(contenu);
  if (!m) illisible("ligne 1 : pas d'en-tête YAML (`---` en première ligne, sans rien devant, refermé par une ligne `---`)");
  const [racine, lignes] = arbreDeLEnTete(m[1].split(/\r?\n/));
  const refuser = (cle, raison) => ligneRefusee(lignes.get(cle), raison);

  let niveau = null;
  if (racine.has('criticality')) {
    const criticite = racine.get('criticality');
    const lu = criticite instanceof Map ? criticite.get('level') : criticite;
    if (!estScalaire(lu)) refuser('criticality', criticite instanceof Map ? '`criticality` sans `level`' : '`criticality` : attendu low, medium ou high, ou un mappage qui porte `level`');
    niveau = lu.texte;
    if (!NIVEAUX.includes(niveau)) refuser('criticality', `criticité « ${niveau.slice(0, 40)} » : attendu low, medium ou high`);
  }

  let code = [];
  if (racine.has('code')) {
    const c = racine.get('code');
    if (!Array.isArray(c) || !c.every(estScalaire)) refuser('code', '`code` : attendu une liste de chemins');
    if (c.some((p) => p.texte === '' || (p.nu && PAS_UN_TEXTE.test(p.texte)))) refuser('code', '`code` porte un chemin vide, ou une valeur nue que YAML ne lit pas comme un texte');
    code = c.map((p) => p.texte);
  }

  // Un statut que ce lecteur ne trouve pas (pas de `validation`, pas de `status`, autre chose qu'un scalaire) : la règle compte.
  const validation = racine.get('validation');
  const statut = validation instanceof Map && estScalaire(validation.get('status')) ? validation.get('status').texte : '';
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
 * d'utilisateur ou de système que le lecteur reprend, et il le reprend pour ce dossier seul, jamais le `*` qui l'a
 * admis. Le dossier est le premier, en remontant, qui porte `.git` : celui que git compare. Les déclarations sont
 * celles que git lit lui-même hors de tout dépôt, aux portées `system` et `global`, dans son ordre
 * (`git config --show-scope`, `A-143`). Le lecteur lit moins que git (`A-135`) : ne vaut qu'une valeur égale à ce
 * chemin, caractère pour caractère, ou `*` : ni barre finale, ni `dossier/*`, ni `.`, ni `~/`, ni lien symbolique.
 * Une déclaration faite par `git -c`, `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` n'est pas vue, et la présence
 * d'une de ces deux variables, où une remise à zéro peut se trouver, fait qu'aucune déclaration n'est admise.
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
  if ('GIT_CONFIG_COUNT' in process.env || 'GIT_CONFIG_PARAMETERS' in process.env) return null;
  // Où vit la configuration de l'utilisateur : ces trois variables le disent, aucune autre `GIT_*` n'est héritée.
  const LIEU = ['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_SYSTEM', 'GIT_CONFIG_NOSYSTEM'];
  const env = Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_') || LIEU.includes(cle)));
  // Les déclarations que git lirait lui-même, dans son ordre, lues par lui et hors de tout dépôt : la portée de
  // système s'il ne l'écarte pas (`GIT_CONFIG_NOSYSTEM`), puis les deux fichiers de l'utilisateur
  // (`$XDG_CONFIG_HOME/git/config`, puis `~/.gitconfig`), leurs `include` compris. `git config --global`, nommé,
  // ne lirait que le second quand il existe : une remise à zéro écrite dans le premier serait manquée.
  let lus = [];
  try {
    lus = execFileSync('git', ['config', '--show-scope', '--includes', '--get-all', 'safe.directory'], { cwd: '/', env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n');
    lus.pop();
  } catch {
    // Aucune déclaration (sortie 1), une configuration que git refuse, ou git absent : la première lecture du dépôt le dira.
  }
  let declares = [];
  for (const ligne of lus) {
    const m = /^(system|global)\t(.*)$/.exec(ligne);
    // Une ligne d'une autre portée, ou la suite d'une valeur à saut de ligne : rien n'est admis.
    if (!m) return null;
    // Comme git : une valeur vide efface les déclarations qui la précèdent.
    declares = m[2] === '' ? [] : [...declares, m[2]];
  }
  return declares.some((v) => v === '*' || v === racine) ? racine : null;
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

/**
 * Les règles hautes et en vigueur de l'arbre d'un commit : `{ regles: Map clé comparable → { cle, code }, connues, horsListe, source }`.
 * `connues` : toutes les règles de l'arbre, quel que soit leur niveau. `horsListe` : les fichiers de règle dont l'en-tête
 * est hors de la liste fermée des formes, `[{ cle, chemin, message }]` ; on ne prouve pas ce qu'on ne lit pas, chacun
 * est une cause (`A-143`), et les autres règles de l'arbre restent lues. `nom` : la réf, pour les messages.
 */
function hautes(nom, commit, lecteur) {
  const fichiers = new Map(); // clé comparable → chemin réel
  for (const chemin of lecteur.lister(commit, REGLES)) {
    const cle = regleDuChemin(chemin);
    if (!cle) continue;
    // Deux fichiers pour un même identifiant, à la casse près : lequel dit le niveau ne se devine pas.
    if (fichiers.has(cle)) illisible(`${nom} : deux fichiers pour la règle ${chemin.split('/').pop().slice(0, -3)}`);
    fichiers.set(cle, chemin);
  }
  const avecIndex = lecteur.lister(commit, INDEX).includes(INDEX);
  const regles = avecIndex ? reglesDeLIndex(lecteur.lire(commit, [INDEX]).get(INDEX)) : new Map();
  // Tous les en-têtes, index ou pas (`A-134`) : un index ancien, incomplet ou en retard sur ses fichiers ne cache pas
  // ce qu'un en-tête dit. Le plus haut niveau gagne, le `code` est l'union, et l'un des deux suffit à dire « en vigueur ».
  const aLire = [...fichiers];
  const textes = lecteur.lire(commit, aLire.map(([, chemin]) => chemin));
  const horsListe = [];
  for (const [cle, chemin] of aLire) {
    const ecrite = chemin.split('/').pop().slice(0, -3);
    let lu;
    try {
      lu = enTeteDeRegle(textes.get(chemin));
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      horsListe.push({ cle: regles.get(cle)?.cle ?? ecrite, chemin, message: `${nom}:${chemin} : ${e.message}` });
      continue;
    }
    const connu = regles.get(cle);
    const rang = (n) => NIVEAUX.indexOf(n);
    regles.set(cle, {
      cle: connu?.cle ?? ecrite,
      niveau: connu && rang(connu.niveau) > rang(lu.niveau) ? connu.niveau : lu.niveau,
      code: [...(connu?.code ?? []), ...lu.code],
      enVigueur: (connu?.enVigueur ?? false) || lu.enVigueur,
    });
  }
  return { regles: new Map([...regles].filter(([, r]) => r.niveau === 'high' && r.enVigueur)), connues: new Set([...regles.keys(), ...fichiers.keys()]), horsListe, source: avecIndex ? INDEX : REGLES };
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
/**
 * Les règles que des lignes `Règles:` citent, `[{ cle, ecrit }]` : des identifiants séparés par des virgules ou des
 * blancs, entre accents graves ou nus, ou `—`. Rien d'autre (`A-136`) : la ligne n'a pas de commentaire, le gate
 * `tickets` lirait `RULE_… # RULE_…` comme deux règles et un jeton mal formé.
 */
function reglesCitees(valeurs, ou) {
  const regles = [];
  for (const v of valeurs)
    for (const morceau of v.split(/[\s,]+/).filter((m) => m !== '' && !/^[—–-]$/.test(m))) {
      const nu = /^`([^`]+)`$/.exec(morceau)?.[1] ?? morceau;
      const lu = G.lireIdentifiant(nu);
      if (lu?.type !== 'RULE' || lu.index !== undefined) illisible(`${ou} : ligne \`Règles:\`, « ${morceau.slice(0, 80)} » n'est pas un identifiant de règle`);
      regles.push({ cle: comparable(nu), ecrit: nu });
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
  const lignes = valeursDEnTete(texte, REGLES_CITEES).filter((v) => v.trim() !== '');
  const regles = reglesCitees(lignes, `${nom}:${chemin}`).map((r) => ({ ...r, chemin }));
  return { chemin, double: relectures.length > 0, regles, sansLigne: lignes.length === 0 };
}

/** Les règles que la spec du ticket cite dans son en-tête, dans l'arbre d'un commit : `[{ cle, chemin }]`, vide sans spec. */
function reglesDeLaSpec(ticket, nom, commit, lecteur) {
  const { spec } = G.lireTicket(ticket);
  const chemin = unSeul(lecteur.lister(commit, 'docs/').filter((p) => G.identifiantDeLaSpec(p.split('/').pop()) === spec), `la spec ${spec}`, nom);
  if (chemin === undefined) return [];
  return reglesCitees(valeursDEnTete(lecteur.lire(commit, [chemin]).get(chemin), REGLES_CITEES), `${nom}:${chemin}`).map((r) => ({ ...r, chemin }));
}

/**
 * La PR exige-t-elle deux relectures ? `fichiers` : les lignes de `git diff --name-only --no-renames` ; `base`,
 * `tete` : la branche cible (un nom de branche) et le sommet (un sha) ; `tickets` : les identifiants des tickets de la PR
 * (aucun, un, ou deux quand son titre et sa branche n'en nomment pas le même) ; `develop` : le nom de la branche d'intégration.
 * `lecteur` : le lecteur git, par défaut celui du dépôt courant. Rend `{ reponse, causes, illisibles, remarques, avertissements, outilManquant }` ;
 * `avertissements` : ce qui se dit sans peser sur la réponse (une règle citée qu'aucun arbre ne connaît), écrit sur la sortie d'erreur.
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
  const avertissements = [];
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
  if (!G) return { reponse: ILLISIBLE, causes, illisibles: [`scripts/docs/identifiants.mjs introuvable depuis ${ICI}`], remarques, avertissements, outilManquant: true };

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
  // Les règles hautes d'un arbre, lues une fois par commit : la base est souvent `origin/develop`, ou le départ.
  // Un échec est gardé comme une réussite, avec la réf qui l'a lu la première : il n'est dit qu'une fois.
  const parCommit = new Map();
  const hautesDe = (commit, nom) => {
    if (!parCommit.has(commit)) {
      try {
        parCommit.set(commit, hautes(nom, commit, lecteur));
      } catch (e) {
        if (!(e instanceof Illisible) || e instanceof OutilManquant) throw e;
        parCommit.set(commit, new Illisible(e.message.startsWith(`${nom}:`) ? e.message : `${nom} : ${e.message}`));
      }
    }
    const lu = parCommit.get(commit);
    if (lu instanceof Illisible) throw lu;
    // Un en-tête hors de la liste fermée : la règle n'est pas lue, donc pas prouvée basse. Une cause, et son message.
    for (const h of lu.horsListe) {
      causes.push({ sujet: h.cle, motif: EN_TETE_ILLISIBLE, chemin: h.chemin, ref: nom });
      if (!illisibles.includes(h.message)) illisibles.push(h.message);
    }
    return lu;
  };

  // 1. Le diff touche le fichier d'une règle haute, ou un fichier de son `code` : sur la base, la tête et develop.
  const hautesQuelquePart = new Map(); // clé comparable → clé écrite
  const connues = new Set(); // toutes les règles de ces trois arbres, quel que soit leur niveau
  let arbresLus = 0;
  for (const ref of [base, tete, develop])
    essayer(() => {
      const nom = nomDe(ref);
      const lues = hautesDe(commitDe(ref), nom);
      const { regles } = lues;
      for (const cle of lues.connues) connues.add(cle);
      arbresLus++;
      const parCode = new Map(); // un chemin de `code`, ou l'un de ses dossiers ancêtres → les règles
      const ajouter = (chemin, cle) => parCode.get(chemin)?.add(cle) ?? parCode.set(chemin, new Set([cle]));
      for (const [cle, r] of regles) {
        hautesQuelquePart.set(cle, r.cle);
        for (const p of r.code) {
          // Une entrée qui nomme la racine du dépôt, ou en sort, ne dit pas quels fichiers réalisent la règle : pas « aucun ».
          const entree = cheminDeCode(p) ?? illisible(`${nom} : une entrée de \`code\` de ${r.cle} nomme la racine du dépôt ou en sort`);
          // Un chemin du diff qui contient l'entrée (le lien d'un sous-module, `vendor/lib` pour `vendor/lib/src/x.ts`) la touche aussi.
          for (let a = entree; a !== ''; a = a.includes('/') ? a.slice(0, a.lastIndexOf('/')) : '') ajouter(a === entree ? a : `${a}/`, r.cle);
        }
      }
      for (const c of chemins) {
        const regle = regles.get(regleDuChemin(c.lu));
        if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref: nom });
        // Le chemin lui-même, puis chacun de ses dossiers : une entrée de `code` peut nommer un dossier.
        for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')
          for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref: nom });
        // Le chemin du diff est un ancêtre d'une entrée de `code`.
        for (const cle of parCode.get(`${c.lu}/`) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref: nom });
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
      for (const { cle, ecrit, chemin } of regles) {
        if (hautesQuelquePart.has(cle)) causes.push({ sujet: hautesQuelquePart.get(cle), motif: 'Règles:', chemin, ref: nom });
        // Une règle qu'aucun des trois arbres ne connaît reste ignorée (les tickets archivés en citent), mais se dit.
        else if (arbresLus === 3 && !connues.has(cle)) {
          const avis = `règle ${ecrit} citée par ${chemin} (${nom}) : aucun arbre ne la connaît, elle est ignorée`;
          if (!avertissements.includes(avis)) avertissements.push(avis);
        }
      }
    };
    for (const ticket of new Set(tickets)) {
      let absences = 0; // les arbres lus qui ne portent pas le ticket
      let sansLigne = false;
      for (const [commit, nom] of refs)
        essayer(() => {
          const lu = enTeteDuTicket(ticket, nom, commit, lecteur);
          if (!lu) return void absences++;
          sansLigne ||= lu.sansLigne;
          if (lu.double) causes.push({ sujet: ticket, motif: 'Relecture: double', chemin: lu.chemin, ref: nom });
          citer(lu.regles, nom);
        });
      if (sansLigne) for (const [commit, nom] of refs) essayer(() => citer(reglesDeLaSpec(ticket, nom, commit, lecteur), nom));
      // Un ticket que la PR nomme et qu'aucun arbre ne porte : ni sa ligne `Relecture:`, ni ses règles ne sont prouvées
      // (`A-143`). Un ticket trouvé et mal lu, lui, a déjà dit sa lecture en échec.
      if (absences === refs.size && refs.size > 0) {
        causes.push({ sujet: ticket, motif: TICKET_INTROUVABLE, chemin: '—', ref: [...refs.values()].join(', ') });
        remarques.push(`ticket ${ticket} absent de ${[...refs.values()].join(', ')} : aucun en-tête lu`);
      }
    }
  }

  // Une cause par (règle ou ticket, motif, chemin) : la première réf où elle est lue.
  const vues = new Set();
  const uniques = causes.filter((c) => {
    const k = `${c.sujet}\t${c.motif}\t${c.chemin}`;
    return !vues.has(k) && vues.add(k);
  });
  const reponse = uniques.length ? EXIGEE : illisibles.length ? ILLISIBLE : NON_EXIGEE;
  return { reponse, causes: uniques, illisibles, remarques, avertissements, outilManquant: reponse === ILLISIBLE && outilManquant };
}

// Tout caractère de commande, séparateurs de ligne d'Unicode compris (U+0085, U+2028, U+2029), devient une espace.
const SEPARATEURS = [0x85, 0x2028, 0x2029].map((c) => String.fromCharCode(c)).join('');
const surUneLigne = (t) => `${t}`.replace(new RegExp(`[\\x00-\\x1f\\x7f${SEPARATEURS}]+`, 'g'), ' ').slice(0, 500);

/**
 * Ce que la ligne de commande écrit : les causes, les lectures en échec et les remarques en `# …`, puis le verdict,
 * seul sur la dernière ligne. Chaque champ et chaque message tient sur une ligne, sans tabulation ni caractère de
 * commande : rien de ce qui est lu dans le dépôt ne peut écrire une ligne de plus.
 */
export function texte({ reponse, causes, illisibles, remarques }) {
  const propre = surUneLigne;
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
  // Les avertissements ne pèsent pas sur la réponse : sur la sortie d'erreur, une ligne chacun.
  for (const avis of resultat.avertissements ?? []) process.stderr.write(`# ${surUneLigne(avis)}\n`);
  process.exitCode = resultat.outilManquant ? SORTIES.outilManquant : SORTIES[resultat.reponse];
}
