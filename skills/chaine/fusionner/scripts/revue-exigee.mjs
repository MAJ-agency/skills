// =============================================================================
// Revue adversariale exigée au passage du capitaine (ADR « chaîne de production »).
//
// Une PR qui touche du code (apps/, packages/, scripts/, donc les seeds de scripts/db/, e2e/) ou ce que la
// chaîne exécute et lit pour juger (voir `exigeRevue`) n'est éligible que si sa description porte une section
// « Revue de ticket » ou « Revue adversariale » : un titre Markdown hors bloc de code. Règles pures, testées par revue-exigee.test.mjs ; la CLI sert
// passer.sh et sujet.sh.
//
// Une PR qui touche un chemin sensible de la base (`cheminsSensibles`, ou tout chemin si le contrat est illisible)
// porte de plus, dans cette section, la ligne « - `/security-review` : lancée » (ticket 18, `motifSansSecurite`).
//
// Garde-fou ajouté le 20/10 (#844, #939) : une PR dont le titre annonce du code (feat, fix…)
// mais dont le diff ne contient que de la documentation est refusée. Cas vécu : la session pose
// `à-fusionner` pendant que son pre-push, long, n'a pas encore poussé le code ; la boucle squashe
// alors la seule ligne Status du commit de réservation et le code reste sur la branche.
//
// Usage : printf '%s\n' "$fichiers" | node revue-exigee.mjs "$corps" ["$titre"] ["<base>"]
//         printf '%s\n' "$fichiers" | node revue-exigee.mjs "$corps" "$titre" "origin/<base>" --ouverte <date> --tete <sha> --branche <tête> --commentaires <fichier>
// En module : `motifsDuCapitaine` (tous les motifs, dans l'ordre de la CLI), `lireBase` et `regimeDeLaPr`, que le check
// `pr-titre` du socle de la chaîne appelle (ticket 16, lot 5a).
// `<base>` : la branche que la PR vise (`origin/develop`, `origin/sujet/<nom>`) ; ses `cheminsSensibles` et son
// fichier des critères s'ajoutent au plancher (`lireBase`). Sans elle, le plancher seul.
// Sortie 0 éligible · 1 non éligible, motif sur la sortie standard.
//
// Le régime d'une PR (A-97, lot 5a). Avec `--ouverte` (le `created_at` de la PR), la CLI lit d'abord le régime sur
// `<base>` (`regimeDeLaPr`) et l'écrit en première ligne de sa sortie standard : `régime 7`, `régime 8` (puis le motif,
// sortie 1), ou `régime 8 : tour <k> validé au sommet <sha>` (sortie 0). En régime 7, elle juge comme sans l'option.
// En régime 8 (A-91, A-105, A-107), la section de revue et la ligne `/security-review` du corps ne sont plus lues : le verdict les remplace. La
// PR veut un tour validé pour le contenu de `--tete`, au sens de la règle 2 du Relecteur (`tourValide` de
// `decision-relecteur.mjs`, la même fonction), sur les mêmes faits que lui : `--commentaires`, un fichier JSON, le
// tableau de TOUS les commentaires de la PR (toutes pages, jamais en argument : un argument trop long est refusé par le
// système) ; le chemin sensible, lu sur le diff reçu avec le contrat de la base (`cheminSensible`, `lireBase`) ; le nombre
// de verdicts exigés (`double-relecture.mjs`, à côté) ; « même contenu propre » de chaque sommet de tour avec `--tete`
// (`meme-contenu.sh`, à côté). Qui appelle a relu `origin/<base>`, `origin/develop` et les `origin/sujet/*` juste avant.
// Le titre de code sur de la documentation seule reste jugé (`motifTitreSansCode`).
// Sortie 21 : lecture illisible (clé `relecture` mal formée, date d'ouverture, commentaires, marque presque à la forme,
// « double relecture exigée » ou « même contenu propre » illisibles) ; la cause sur la sortie standard. Le capitaine
// saute alors la PR sans la renvoyer (A-113) : son auteur n'y peut rien. Sortie 2 : options mal formées. Sortie 3 : en
// régime 8, l'outil en panne (un calcul absent à côté, une exception) : jamais un refus.
// =============================================================================

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Ce qui exige la revue, lu sur le chemin décité, en NFC et en minuscules (`cheminLu`) :
//   - le code : apps/, packages/, scripts/, e2e/ ;
//   - un fichier de code exécutable à toute profondeur (`.js .mjs .cjs .ts .mts .cts .jsx .tsx .sh .bash .zsh
//     .py .rb .pl .ps1 .php`) et un nom de configuration à toute profondeur (`*.config.*`, `*rc`, `*rc.*`) :
//     lint-staged, Prettier ou ESLint prennent la configuration la plus proche du fichier, et l'exécutent au
//     `pre-commit` du capitaine (`docs/lint-staged.config.mjs`) ;
//   - un segment qui commence par un point, sauf un `.gitkeep` : `.github/` (la CI et ses actions, que la PR
//     elle-même fait tourner), `.husky/` (les hooks git, joués chez le capitaine), `.claude/` (hooks d'agent,
//     règles, contrat de la chaîne), `.npmrc`, `.pnpmfile.cjs` (lus par `pnpm install`), `.nvmrc`,
//     `.prettierrc`, `.gitattributes` (un `-diff` cache un fichier au diff relu) ;
//   - un fichier à la racine, hors Markdown : `package.json` (`prepare`, `postinstall`, les commandes des
//     gates), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig*.json`, `eslint.config.*`,
//     `vitest.config.*`, `commitlint.config.*`, `playwright.config.*` ;
//   - un `package.json`, `package.json5`, `package.yaml` ou `package.yml` à toute profondeur : ses scripts tournent au `pnpm install` dès que l'espace de travail
//     l'inclut.
//   - ce que l'agent lit pour travailler et pour relire : un `CLAUDE.md` ou `CLAUDE.local.md` à toute profondeur,
//     `docs/agents/` (sauf un index généré de la base déclaré en littéral avec une `commande`, que le capitaine
//     régénère), le fichier des critères de la revue (`criteresRevue` du contrat de la base,
//     `docs/agents/criteres-revue.md` sans lui) ;
//   - un chemin sensible du projet (`cheminsSensibles` du contrat de la base).
// Le contrat se lit dans la base, jamais dans l'arbre de la PR : sinon une PR retirerait elle-même son chemin. Une
// base de sujet ajoute le contrat d'origin/develop : un sujet en retard ne perd pas un chemin déclaré depuis.
// Les chemins sensibles gardent leur rôle : contre-revue et `/security-review` en plus. Ceux du gabarit sont
// aussi dans le plancher (scripts/depot.test.mjs du plugin).
const CODE = /^(apps|packages|scripts|e2e)\//;
const EXECUTABLE = /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx|sh|bash|zsh|py|rb|pl|ps1|php)$/;
const CONFIGURATION = /(^|\/)[^/]*\.config\.[^/]+$/;
const RC = /(^|\/)\.?[^/]*rc(\.[^/]+)?$/;
const CLAUDE_MD = /(^|\/)claude(\.local)?\.md$/;
// Comparable : NFC (macOS écrit souvent en NFD), majuscules puis minuscules (`ſ` se lit `s`), pour les chemins comme pour les motifs.
const comparable = (s) => s.normalize('NFC').toUpperCase().toLowerCase();
const DOCS_AGENTS = /^docs\/agents\//;
const CRITERES_DEFAUT = 'docs/agents/criteres-revue.md';
/** Contexte d'une PR sans base lue : le plancher seul. */
export const SANS_BASE = Object.freeze({ sensibles: [], criteres: [CRITERES_DEFAUT], generes: [], illisible: null });
const SEGMENT_A_POINT = /(^|\/)\.(?!gitkeep$)/;
const RACINE_HORS_MARKDOWN = /^[^/]+$/;
const PACKAGE_JSON = /(^|\/)package\.(json|json5|ya?ml)$/;
const ECHAPPEMENTS = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };

/**
 * Chemin d'une ligne de `git diff --name-only`, comparable : guillemets de git retirés (`core.quotePath` ; git
 * cite encore, même à `false`, un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne), en minuscules
 * (sur un système de fichiers insensible à la casse, macOS ou Windows, `Apps/` est `apps/`). Une ligne citée
 * mal formée rend `null` : jamais lue comme un chemin de documentation.
 */
export function cheminLu(ligne) {
  const f = ligne.trim();
  if (!f.startsWith('"')) return comparable(f);
  if (f.length < 2 || !f.endsWith('"')) return null;
  const car = [...f.slice(1, -1)];
  const octets = [];
  for (let i = 0; i < car.length; i++) {
    if (car[i] === '"') return null;
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
    } else return null;
  }
  return comparable(Buffer.from(octets).toString('utf8'));
}

/**
 * Motif de chemin (`**` = tout, y compris zéro dossier avant `/` ; `*` = un segment) → expression régulière.
 * Copie de `regexDuMotif` du gate `tickets` (`tickets-regles.mjs`), comme `chemins-sensibles.mjs` ;
 * `revue-exigee.test.mjs` garde la parité.
 */
function regexDuMotif(motif) {
  const complet = motif.endsWith('/') ? `${motif}**` : motif;
  const re = complet.replace(/\*\*\/|\*\*|\*|[.+?^${}()|[\]\\]/g, (m) => {
    if (m === '**/') return '(?:.*/)?';
    if (m === '**') return '.*';
    if (m === '*') return '[^/]*';
    return `\\${m}`;
  });
  return new RegExp(`^${re}$`, 's');
}
/**
 * Contexte de la base : `cheminsSensibles` et `criteresRevue` de `.claude/chaine.json`, et les index générés
 * déclarés en littéral avec une `commande` (`scripts/docs/index-generes.json`), lus sur `<ref>` (`lire(ref,
 * chemin)` rend le contenu, `null` pour un fichier absent, lève si la base ne se lit pas). Sans contrat : le
 * plancher et le fichier des critères par défaut. Base introuvable, contrat illisible ou mal formé :
 * `illisible` (tout chemin exige alors la revue, jamais une garde ouverte). Liste des index illisible : aucun
 * index n'est retiré de `docs/agents/` (plus strict). Une base de sujet (`origin/sujet/<nom>`) ajoute le
 * contrat d'`origin/develop` : union des chemins sensibles et des fichiers des critères, et seuls les index des
 * deux listes restent retirés.
 */
export function lireBase(ref, lire = lireGit) {
  try {
    const base = lireUne(ref, lire);
    if (!/^(origin\/)?sujet\//.test(ref)) return base;
    const develop = lireUne('origin/develop', lire);
    return {
      sensibles: [...base.sensibles, ...develop.sensibles],
      criteres: [...new Set([...base.criteres, ...develop.criteres])],
      generes: base.generes.filter((g) => develop.generes.includes(g)),
      illisible: null,
    };
  } catch (e) {
    return { ...SANS_BASE, illisible: `contrat de ${e.ref ?? ref} illisible (${e.message})` };
  }
}

function lireUne(ref, lire) {
  try {
    const contrat = lire(ref, '.claude/chaine.json');
    let sensibles = [];
    let criteres = CRITERES_DEFAUT;
    if (contrat !== null) {
      const c = JSON.parse(contrat);
      const s = c?.cheminsSensibles ?? [];
      if (!Array.isArray(s) || s.some((m) => typeof m !== 'string')) throw new Error('`cheminsSensibles` doit être une liste de motifs');
      if (c?.criteresRevue !== undefined && (typeof c.criteresRevue !== 'string' || c.criteresRevue.trim() === ''))
        throw new Error('`criteresRevue` doit être un chemin');
      sensibles = s;
      criteres = c?.criteresRevue ?? CRITERES_DEFAUT;
    }
    let generes = [];
    try {
      const index = lire(ref, 'scripts/docs/index-generes.json');
      if (index !== null)
        generes = (JSON.parse(index).index ?? [])
          .filter((e) => typeof e?.chemin === 'string' && !e.chemin.includes('*') && typeof e.commande === 'string' && e.commande.trim() !== '')
          .map((e) => e.chemin);
    } catch {
      generes = [];
    }
    return { sensibles, criteres: [criteres], generes, illisible: null };
  } catch (e) {
    e.ref = ref;
    throw e;
  }
}

function lireGit(ref, chemin) {
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  git('rev-parse', '--verify', '-q', `${ref}^{commit}`);
  try {
    git('cat-file', '-e', `${ref}:${chemin}`);
  } catch {
    return null;
  }
  return git('show', `${ref}:${chemin}`);
}

/** Premier chemin du diff qui exige la revue, tel que git l'écrit, ou `null`. `base` : `lireBase`, ou `SANS_BASE`. */
export function cheminExige(fichiers, base = SANS_BASE) {
  const sensibles = base.sensibles.map((m) => regexDuMotif(comparable(m)));
  // Exception de `docs/agents/` : le chemin exact de l'index (NFC, sans repli de casse), jamais un autre fichier qui se replie dessus.
  const generes = new Set(base.generes.map((g) => g.replace(/^\.\//, '').normalize('NFC')));
  const criteres = new Set(base.criteres.map((c) => comparable(c.replace(/^\.\//, ''))));
  return (
    fichiers.find((f) => {
      if (f.trim() === '') return false;
      const c = cheminLu(f);
      return (
        base.illisible !== null ||
        c === null ||
        CODE.test(c) ||
        SEGMENT_A_POINT.test(c) ||
        (RACINE_HORS_MARKDOWN.test(c) && !c.endsWith('.md')) ||
        PACKAGE_JSON.test(c) ||
        EXECUTABLE.test(c) ||
        CONFIGURATION.test(c) ||
        RC.test(c) ||
        CLAUDE_MD.test(c) ||
        criteres.has(c) ||
        (DOCS_AGENTS.test(c) && !(!f.trim().startsWith('"') && generes.has(f.trim().normalize('NFC')))) ||
        sensibles.some((re) => re.test(c))
      );
    }) ?? null
  );
}

/** Le diff touche-t-il un chemin qui exige la revue ? */
export function exigeRevue(fichiers, base = SANS_BASE) {
  return cheminExige(fichiers, base) !== null;
}

/** La description a-t-elle un titre « Revue de ticket » ou « Revue adversariale » hors bloc de code ? */
export function aSectionRevue(corps) {
  let dansBloc = false;
  for (const ligne of (corps ?? '').split(/\r?\n/)) {
    if (/^\s{0,3}(```|~~~)/.test(ligne)) {
      dansBloc = !dansBloc;
      continue;
    }
    if (!dansBloc && /^\s{0,3}#{1,6}\s+revue (adversariale|de ticket)\b/i.test(ligne)) return true;
  }
  return false;
}

/** Motif de non-éligibilité, ou null si la PR peut passer. */
export function motifSansRevue({ corps, fichiers, base = SANS_BASE }) {
  const chemin = cheminExige(fichiers, base);
  if (chemin === null || aSectionRevue(corps)) return null;
  if (base.illisible !== null)
    return `sans section « Revue de ticket » ni « Revue adversariale » dans la description, et le ${base.illisible} : la revue est exigée pour tout chemin ; lancer le skill revue-de-ticket (ou revue-adversariale pour une PR sans ticket)`;
  return `sans section « Revue de ticket » ni « Revue adversariale » dans la description alors que la PR touche du code ou ce que la chaîne exécute (${chemin.trim()}) : lancer le skill revue-de-ticket (ou revue-adversariale pour une PR sans ticket)`;
}

/**
 * Ticket 18 : premier chemin du diff qui touche un chemin sensible de la base (`base.sensibles`, avec le moteur de
 * `cheminExige` : sans casse ni forme NFD), tel que git l'écrit, ou `null`. Base illisible : chaque chemin est
 * sensible, comme `chemins-sensibles.mjs` le rend alors ; une citation mal formée aussi (prudence de `cheminExige`).
 * Sans contrat, aucun chemin sensible.
 */
export function cheminSensible(fichiers, base = SANS_BASE) {
  const sensibles = base.sensibles.map((m) => regexDuMotif(comparable(m)));
  return (
    fichiers.find((f) => {
      if (f.trim() === '') return false;
      if (base.illisible !== null) return true;
      if (sensibles.length === 0) return false;
      const c = cheminLu(f);
      return c === null || sensibles.some((re) => re.test(c));
    }) ?? null
  );
}

/** Un titre de section « Revue de ticket » ou « Revue adversariale » : son niveau (le nombre de `#`). */
const TITRE_REVUE = /^\s{0,3}(#{1,6})\s+revue (adversariale|de ticket)\b/i;
const TITRE = /^\s{0,3}(#{1,6})(\s|$)/;
const CLOTURE = /^\s{0,3}(```|~~~)/;
/**
 * La ligne des gabarits (`section-pr.md` de revue-de-ticket et revue-adversariale), telle qu'ils l'écrivent :
 * « - `/security-review` : lancée (chemins : …) ». Puce `-`, `*` ou `+` ; accents graves facultatifs ; blancs libres
 * (insécables compris) autour des deux-points ; « lancée » suivi d'un blanc, d'une parenthèse, d'une ponctuation
 * finale ou de la fin de ligne (`\b` ne vaut rien après `é` en JavaScript). Lue en NFC, sans casse.
 */
const LIGNE_SECURITE = /^\s*[-*+]\s+`?\/security-review`?\s*:\s*lancée(?=[\s(.,;:!?…]|$)/iu;
/**
 * Un gabarit recopié sans choisir : la branche « non requise » laissée (`| non requise`, `/ non requise`), ou la
 * parenthèse « (chemins : …) » vide ou laissée en `…` / `...`. Des points de suspension dans la prose comptent.
 */
const nonRemplie = (ligne) => {
  if (/[|/]\s*non requise/iu.test(ligne)) return true;
  const chemins = /\(\s*chemins\s*:([^)]*)\)/iu.exec(ligne);
  return chemins !== null && (chemins[1].trim() === '' || /…|\.\.\./u.test(chemins[1]));
};

/**
 * Le texte d'une ligne sans ses commentaires HTML, et `ouvert` si un `<!--` y reste sans sa fermeture (le texte
 * s'arrête alors avant lui). Coupé par `indexOf`, sans motif : chaque `<!--` … `-->` est retiré et le reste recollé,
 * puis on recommence tant qu'un `<!--` subsiste, recollage compris (`<!<!-- x -->--` se relit `<!--`).
 */
function sansCommentaires(ligne) {
  let texte = ligne;
  for (;;) {
    const ouvre = texte.indexOf('<!--');
    if (ouvre < 0) return { texte, ouvert: false };
    const ferme = texte.indexOf('-->', ouvre + 4);
    if (ferme < 0) return { texte: texte.slice(0, ouvre), ouvert: true };
    texte = texte.slice(0, ouvre) + texte.slice(ferme + 3);
  }
}

/**
 * Vrai si une ligne « - `/security-review` : lancée » se tient dans une section « Revue de ticket » ou « Revue
 * adversariale » : après son titre, avant le titre suivant de niveau égal ou supérieur, hors bloc de code et hors
 * commentaire HTML (`<!-- … -->`, sur une ou plusieurs lignes, non fermé compris), et remplie (ni « | non requise »
 * ni parenthèse « (chemins : …) » vide ou laissée en `…` ; des points de suspension dans la prose comptent).
 */
export function aLigneSecurite(corps) {
  let dansBloc = false;
  let dansCommentaire = false;
  let niveau = 0;
  for (const ligneLue of (corps ?? '').normalize('NFC').split(/\r?\n/)) {
    let brute = ligneLue;
    if (!dansBloc) {
      if (dansCommentaire) {
        const fin = brute.indexOf('-->');
        if (fin < 0) continue;
        brute = brute.slice(fin + 3);
        dansCommentaire = false;
      }
      ({ texte: brute, ouvert: dansCommentaire } = sansCommentaires(brute));
    }
    if (CLOTURE.test(brute)) {
      dansBloc = !dansBloc;
      continue;
    }
    if (dansBloc) continue;
    const revue = TITRE_REVUE.exec(brute);
    if (revue) {
      niveau = revue[1].length;
      continue;
    }
    const titre = TITRE.exec(brute);
    if (titre) {
      if (titre[1].length <= niveau) niveau = 0;
      continue;
    }
    if (niveau > 0 && LIGNE_SECURITE.test(brute) && !nonRemplie(brute)) return true;
  }
  return false;
}

/**
 * Ticket 18 (`A-31`) : une PR qui touche un chemin sensible porte, dans sa section de revue, la ligne
 * « `/security-review` : lancée ». Motif de non-éligibilité, ou `null`. La ligne est déclarative : elle se voit et
 * se renvoie, elle ne se prouve pas. Jouée après `motifSansRevue` : une PR sans section reçoit d'abord ce motif-là.
 */
export function motifSansSecurite({ corps, fichiers, base = SANS_BASE }) {
  const chemin = cheminSensible(fichiers, base);
  if (chemin === null || aLigneSecurite(corps)) return null;
  const ou = base.illisible !== null ? `${chemin.trim()} ; le ${base.illisible} : tout chemin est sensible` : chemin.trim();
  return `section de revue sans la ligne « /security-review : lancée » alors que la PR touche un chemin sensible (${ou}) : lancer la skill /security-review sur ce sommet, puis écrire la ligne dans la section`;
}

const TYPES_AVEC_CODE = /^(feat|fix|refactor|perf)(\([^)]*\))?!?:/;

/** Le titre annonce du code alors que le diff ne contient que de la documentation ? */
export function motifTitreSansCode({ titre, fichiers }) {
  const t = (titre ?? '').trim();
  const m = TYPES_AVEC_CODE.exec(t);
  if (!m || /^(docs?)$/i.test((m[2] ?? '').replace(/[()]/g, ''))) return null;
  const liste = fichiers.map((f) => f.trim()).filter(Boolean);
  if (liste.length === 0 || !liste.every((f) => f.startsWith('docs/'))) return null;
  return `titre « ${m[1]} » mais le diff ne contient que de la documentation (${liste.length} fichier(s) sous docs/) : le code est-il poussé ? Poser à-fusionner après le dernier push (le pre-push est long), ou retitrer en docs:`;
}

/**
 * Ticket 16 : les motifs de non-éligibilité du capitaine, tous, dans l'ordre où la CLI les juge (section de revue,
 * ligne `/security-review`, titre de code sur de la documentation seule) ; `[]` si la PR peut passer. La CLI rend
 * le premier ; le check `pr-titre` du socle les rend tous, sans recopier la règle.
 */
export function motifsDuCapitaine({ corps, titre, fichiers, base = SANS_BASE, regime = 7 }) {
  // Régime 8 (lot 5a) : la section de revue et sa ligne `/security-review` ne se lisent plus, le verdict les remplace.
  if (regime === 8) return [motifTitreSansCode({ titre, fichiers })].filter((m) => m !== null);
  return [
    motifSansRevue({ corps, fichiers, base }),
    motifSansSecurite({ corps, fichiers, base }),
    motifTitreSansCode({ titre, fichiers }),
  ].filter((m) => m !== null);
}

// ── Le régime d'une PR, et son verdict (relecture indépendante, lot 5a) ──────────────────────────────────────────
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const MODELES = ['opus', 'sonnet'];
const DEPUIS = /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?Z$/;
/**
 * La clé `relecture` d'un contrat `.claude/chaine.json`, son texte (`null` : pas de fichier) : `null` sans fichier ou
 * sans clé (régime 7), `'illisible'` pour une clé mal formée ou un JSON illisible, sinon `{ depuis }` en millisecondes.
 * La forme est celle que le Relecteur lit (`contrat` de `relecteur.mjs`, A-179) : `depuis` en UTC, `Z`, avec ou sans
 * millisecondes, un instant qui existe ; `delai`, des minutes, un entier, 1 ou plus ; `ordinaire` et `sensible`,
 * `{ modele: opus | sonnet, effort: low | medium | high | xhigh | max }`. Une clé que le Relecteur ne lit pas, le
 * capitaine ne la lit pas non plus : la PR n'est alors ni relue, ni fusionnée.
 */
export function lireCleRelecture(texte) {
  if (texte === null) return null;
  let c;
  try {
    c = JSON.parse(texte);
  } catch {
    // Un contrat qui ne se lit pas et ne nomme pas la clé : régime 7, jugé comme avant (`lireBase` le dit illisible).
    return /"relecture"/.test(texte) ? 'illisible' : null;
  }
  if (c === null || typeof c !== 'object' || !Object.hasOwn(c, 'relecture')) return null;
  const r = c.relecture;
  const couple = (x) => x === undefined || (x !== null && typeof x === 'object' && MODELES.includes(x.modele) && EFFORTS.includes(x.effort));
  if (r === null || typeof r !== 'object' || typeof r.depuis !== 'string' || !DEPUIS.test(r.depuis) || !Number.isFinite(Date.parse(r.depuis))) return 'illisible';
  if (r.delai !== undefined && !(Number.isSafeInteger(r.delai) && r.delai >= 1)) return 'illisible';
  if (!couple(r.ordinaire) || !couple(r.sensible)) return 'illisible';
  return { depuis: Date.parse(r.depuis) };
}

/**
 * Le régime d'une PR (A-97) : 8 quand sa base, `develop` ou `sujet/<nom>` et celle-là seule, porte la clé `relecture`
 * et que la PR a été ouverte strictement après `depuis` ; 7 sinon, une base hors de la chaîne comprise (comme le
 * Relecteur, qui ne la regarde pas). `base` : un nom de branche, ou `origin/<branche>` ; `ouverte` : le `created_at` de
 * la PR. Rend `{ regime: 7 | 8 }`, ou `{ illisible }`, sa cause : contrat qui ne se lit pas, clé mal formée, date
 * d'ouverture illisible. `lire(ref, chemin)` : comme pour `lireBase`.
 */
export function regimeDeLaPr({ base, ouverte }, lire = lireGit) {
  const nom = String(base ?? '').replace(/^origin\//, '');
  if (nom !== 'develop' && !/^sujet\/[A-Za-z0-9._-]+$/.test(nom)) return { regime: 7 };
  let texte;
  try {
    texte = lire(`refs/remotes/origin/${nom}`, '.claude/chaine.json');
  } catch (e) {
    return { illisible: `contrat de origin/${nom} illisible (${String(e.message).split('\n')[0]})` };
  }
  const cle = lireCleRelecture(texte);
  if (cle === null) return { regime: 7 };
  if (cle === 'illisible') return { illisible: `clé relecture de origin/${nom}:.claude/chaine.json mal formée` };
  const t = Date.parse(ouverte ?? '');
  if (typeof ouverte !== 'string' || !Number.isFinite(t)) return { illisible: `date d'ouverture de la PR illisible (« ${ouverte ?? ''} »)` };
  return { regime: t > cle.depuis ? 8 : 7 };
}

/**
 * Régime 8 (A-91, A-105) : la PR n'entre qu'avec un tour validé pour le contenu de `tete`, la règle 2 du Relecteur
 * jouée par la même fonction (`tourValide`, reçue). `{ tour }` le tour validé, ou `{ motif }`. `LectureIllisible` (des
 * commentaires que le lecteur refuse, une marque presque à la forme, `exiges` ou « même contenu propre » illisible)
 * passe à l'appelant : jamais « validé ». Un `refusé`, un tour en cours, un contenu changé depuis le verdict, un seul
 * verdict quand deux sont exigés, un verdict sans `/security-review: lancée` sur un chemin sensible : le motif.
 */
export function verdictDuCapitaine({ commentaires, tete, exiges, sensible, memeContenu, tourValide }) {
  const tour = tourValide({ commentaires, tete, exiges, sensible, memeContenu });
  if (tour !== null) return { tour };
  const exigences = [exiges >= 2 ? 'deux verdicts validés de deux sessions exigés' : null, sensible ? 'chemin sensible : `/security-review: lancée` exigée dans le verdict' : null].filter(Boolean);
  return { motif: `aucun tour de relecture validé pour le contenu de ce sommet (${tete.slice(0, 12)})${exigences.length ? ` (${exigences.join(' ; ')})` : ''} : le verdict manque, est refusé ou porte sur un autre contenu` };
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

const ICI = dirname(fileURLToPath(import.meta.url));
/** Les options qui suivent les trois arguments : `{ ouverte, tete, branche, commentaires }`, toutes ou aucune ; sinon `null`. */
export function lireOptions(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    if (!['--ouverte', '--tete', '--branche', '--commentaires'].includes(cle) || argv[i + 1] === undefined || cle.slice(2) in options) return null;
    options[cle.slice(2)] = argv[i + 1];
  }
  const n = Object.keys(options).length;
  if (n === 0) return {};
  return n === 4 && /^[0-9a-f]{40}$/.test(options.tete) && options.commentaires !== '' ? options : null;
}

/** Une lecture illisible de la CLI : sa cause, sortie 21. */
class Illisible extends Error {}
/** Le nombre de verdicts exigés (`double-relecture.mjs`, à côté) : 1, 2, ou `'illisible'`. */
function exigesDe(fichiers, { base, tete, titre, branche }) {
  const r = spawnSync(process.execPath, [join(ICI, 'double-relecture.mjs'), '--base', base, '--tete', tete, '--titre', titre, '--branche', branche], {
    input: fichiers.length ? `${fichiers.join('\n')}\n` : '',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return r.status === 0 ? 1 : r.status === 20 ? 2 : 'illisible';
}
/** « Même contenu propre » de V et T vers `base` (`meme-contenu.sh`, à côté) : vrai, faux, ou `'illisible'`. */
function memeContenuDe(v, t, base) {
  const r = spawnSync('bash', [join(ICI, 'meme-contenu.sh'), v, t, base], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? true : r.status === 20 ? false : 'illisible';
}

/** Le verdict d'une PR en régime 8, sur les faits que le Relecteur lit : `{ tour }` ou `{ motif }` ; `Illisible` sinon. */
async function verdictEnLigne({ fichiers, base, tete, titre, branche, commentaires: fichier }) {
  // Un calcul absent à côté est une panne de l'outil (sortie 3), jamais une lecture illisible (21) : `spawnSync` d'un
  // script absent rend un code que les lecteurs disent « illisible », et la PR serait sautée à chaque passage sans que
  // personne ne le sache (décision 4 du ticket 71).
  for (const calcul of ['decision-relecteur.mjs', 'verdict.mjs', 'double-relecture.mjs', 'meme-contenu.sh'])
    if (!existsSync(join(ICI, calcul))) throw new Error(`${calcul} absent à côté de revue-exigee.mjs`);
  const { readFileSync } = await import('node:fs');
  const { sommetsDesTours, tourValide } = await import(pathToFileURL(join(ICI, 'decision-relecteur.mjs')).href);
  const { LectureIllisible } = await import(pathToFileURL(join(ICI, 'verdict.mjs')).href);
  let commentaires;
  try {
    commentaires = JSON.parse(readFileSync(fichier, 'utf8'));
  } catch (e) {
    throw new Illisible(`commentaires de la PR illisibles (${fichier} : ${e.message})`);
  }
  try {
    const sensible = fichiers.length > 0 && cheminSensible(fichiers, lireBase(`origin/${base}`)) !== null;
    const exiges = exigesDe(fichiers, { base, tete, titre, branche });
    const memeContenu = {};
    for (const s of sommetsDesTours(commentaires)) if (s !== tete) memeContenu[s] = memeContenuDe(s, tete, base);
    return verdictDuCapitaine({ commentaires, tete, exiges, sensible, memeContenu, tourValide });
  } catch (e) {
    if (e instanceof LectureIllisible) throw new Illisible(e.message);
    throw e;
  }
}

if (estPointEntree()) {
  const { readFileSync } = await import('node:fs');
  const fichiers = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  const options = lireOptions(process.argv.slice(5));
  if (options === null) {
    process.stdout.write('options : --ouverte <date> --tete <sha de 40 caractères> --branche <tête> --commentaires <fichier>, toutes ou aucune, après les trois arguments\n');
    process.exit(2);
  }
  const base = process.argv[4] ? lireBase(process.argv[4]) : SANS_BASE;
  let regime = 7;
  if (options.ouverte !== undefined) {
    const lu = regimeDeLaPr({ base: process.argv[4] ?? '', ouverte: options.ouverte });
    if (lu.illisible) {
      process.stdout.write(`lecture illisible : ${lu.illisible}\n`);
      process.exit(21);
    }
    regime = lu.regime;
  }
  // Avec `--ouverte`, la première ligne dit le régime, sur une PR éligible comme sur un refus (le motif suit, en dernière ligne).
  const enTete = options.ouverte === undefined ? '' : `régime ${regime}\n`;
  const [motif] = motifsDuCapitaine({ corps: process.argv[2] ?? '', titre: process.argv[3] ?? '', fichiers, base, regime });
  if (motif) {
    process.stdout.write(`${enTete}${motif}\n`);
    process.exit(1);
  }
  if (regime === 8) {
    let lu;
    try {
      lu = await verdictEnLigne({ fichiers, base: process.argv[4].replace(/^origin\//, ''), tete: options.tete, titre: process.argv[3] ?? '', branche: options.branche, commentaires: options.commentaires });
    } catch (e) {
      // Une panne de l'outil (un module absent, une exception) n'est jamais un refus : sortie 3, « côté capitaine »
      // (`passer.sh` : 3 ; `sujet.sh` : 11), jamais 1, que le capitaine lirait « renvoi ».
      if (!(e instanceof Illisible)) {
        process.stdout.write(`revue du capitaine en échec : ${String(e?.message ?? e).split('\n')[0]}\n`);
        process.exit(3);
      }
      process.stdout.write(`lecture illisible : ${e.message}\n`);
      process.exit(21);
    }
    if (lu.motif) {
      process.stdout.write(`${enTete}${lu.motif}\n`);
      process.exit(1);
    }
    process.stdout.write(`régime 8 : tour ${lu.tour.numero} validé au sommet ${lu.tour.sommet}\n`);
  } else if (options.ouverte !== undefined) process.stdout.write('régime 7\n');
}
