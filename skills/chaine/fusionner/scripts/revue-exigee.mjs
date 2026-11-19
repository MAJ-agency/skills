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
// En module : `motifsDuCapitaine` (tous les motifs, dans l'ordre de la CLI) et `lireBase`, que le check `pr-titre` du
// socle de la chaîne appelle (ticket 16).
// `<base>` : la branche que la PR vise (`origin/develop`, `origin/sujet/<nom>`) ; ses `cheminsSensibles` et son
// fichier des critères s'ajoutent au plancher (`lireBase`). Sans elle, le plancher seul.
// Sortie 0 éligible · 1 non éligible, motif sur la sortie standard.
// =============================================================================

import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
export function motifsDuCapitaine({ corps, titre, fichiers, base = SANS_BASE }) {
  return [
    motifSansRevue({ corps, fichiers, base }),
    motifSansSecurite({ corps, fichiers, base }),
    motifTitreSansCode({ titre, fichiers }),
  ].filter((m) => m !== null);
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
  const { readFileSync } = await import('node:fs');
  const fichiers = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  const base = process.argv[4] ? lireBase(process.argv[4]) : SANS_BASE;
  const [motif] = motifsDuCapitaine({ corps: process.argv[2] ?? '', titre: process.argv[3] ?? '', fichiers, base });
  if (motif) {
    process.stdout.write(`${motif}\n`);
    process.exit(1);
  }
}
