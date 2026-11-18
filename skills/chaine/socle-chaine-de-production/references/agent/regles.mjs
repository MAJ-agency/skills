/**
 * Règles des hooks Claude Code du projet (ADR « chaîne de production »), en fonctions pures : les
 * scripts de hook (garde-fichiers, garde-commandes, garde-github) les appliquent, et `regles.test.mjs` les éprouve
 * (`node --test scripts/agent/`, dans `pnpm check:tickets`).
 *
 * Ce que les règles disent « jamais » et qu'une consigne ne garantit pas : le hook le refuse avant
 * que l'agent ne construise dessus, au lieu d'attendre le pre-push ou la CI.
 *
 * Ce qui est propre au projet vient de deux fichiers : `.claude/chaine.json` (le dossier des
 * migrations) et `scripts/docs/index-generes.json` (les fichiers générés et leur commande).
 */
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';

const lireJson = (url) => {
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch {
    return null;
  }
};

/** Le contrat du projet (`.claude/chaine.json`). */
export const CHAINE = lireJson(new URL('../../.claude/chaine.json', import.meta.url)) ?? {};

/** Index générés : `[{ chemin, commande }]`, `*` = un segment de chemin. */
export const INDEX_GENERES = lireJson(new URL('../docs/index-generes.json', import.meta.url))?.index ?? [];

/**
 * Fichiers générés : ils se régénèrent, ils ne s'éditent pas. Chemin (`*` = un segment) → commande.
 * Les index de `INDEX_GENERES` y sont tous, plus le lockfile.
 */
export const FICHIERS_GENERES = Object.fromEntries([
  ...INDEX_GENERES.map(({ chemin, commande }) => [chemin, commande]),
  ['pnpm-lock.yaml', 'pnpm install / pnpm add (jamais à la main)'],
]);

/** Motif → expression régulière (`*` = un segment de chemin). */
const cheminDuMotif = (motif) => new RegExp(`^${motif.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}$`);

/**
 * CODEOWNERS, aux trois places où GitHub le lit (`.github/`, la racine, `docs/` ; la casse ignorée : un système de
 * fichiers insensible à la casse écrit `.GitHub/codeowners` au même endroit). Il se génère depuis `.claude/chaine.json`
 * (`scripts/github/codeowners.mjs`, ADR « CODEOWNERS ») : une seule source, que le gate `codeowners` compare.
 */
const CODEOWNERS = /^(\.github\/|docs\/)?codeowners$/i;
const RAISON_CODEOWNERS = (c) =>
  `${c} ne s'édite pas : il est généré depuis .claude/chaine.json. Modifier \`cheminsSensibles\` ou \`proprietaires\` dans .claude/chaine.json, puis régénérer avec « pnpm codeowners » (node scripts/github/codeowners.mjs --ecrire) ; le gate \`codeowners\` refuse tout écart (ADR « CODEOWNERS »).`;

/**
 * Refus d'éditer un fichier, ou `null` si l'édition est permise.
 * @param {string} chemin chemin relatif à la racine du dépôt
 * @param {{ migrationExistante: (chemin: string) => boolean, migrations?: string }} contexte
 *   `migrations` : dossier des migrations (défaut : `CHAINE.migrations`, sinon `apps/api/src/db/migrations/`)
 */
export function refusEdition(
  chemin,
  {
    migrationExistante,
    migrations = CHAINE.migrations ?? 'apps/api/src/db/migrations/',
  },
) {
  // Normalisé avant toute comparaison : `.github//CODEOWNERS`, `.github/./CODEOWNERS` ou `docs/../CODEOWNERS` visent le même fichier.
  const c = posix.normalize(chemin.replace(/\\/g, '/')).replace(/^(\.\/)+/, '');
  if (CODEOWNERS.test(c)) return RAISON_CODEOWNERS(c);
  const genere = Object.keys(FICHIERS_GENERES).find((motif) => cheminDuMotif(motif).test(c));
  if (genere) return `${c} est généré : le régénérer avec « ${FICHIERS_GENERES[genere]} ».`;
  const nom = c.split('/').pop() ?? '';
  if (/^\.env(\..+)?$/.test(nom) && nom !== '.env.example') {
    return `${c} : fichier d'environnement local, jamais édité par un agent (secrets). Modifier .env.example.`;
  }
  const dossier = migrations.replace(/\/+$/, '');
  if (c.startsWith(`${dossier}/`) && /\.(ts|sql|js|mjs)$/.test(c) && migrationExistante(c)) {
    return `${c} : une migration déjà livrée ne se modifie jamais. Créer une nouvelle migration.`;
  }
  return null;
}

/** Commandes refusées : motif → raison. */
const COMMANDES_INTERDITES = [
  [/(^|[;&|]\s*|\s)npm\s+(i|install|ci|add|uninstall|update)\b/i, 'npm : le gestionnaire du projet est pnpm.'],
  [/(^|[;&|]\s*|\s)yarn(\s|$)/i, 'yarn : le gestionnaire du projet est pnpm.'],
  [/\bgit\s+(commit|push)\b[^;&|]*\s--no-verify\b/i, "--no-verify : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  // Ses abréviations (`--no-veri`, `--no-verif`) ; `--no-verify-signatures`, option de `merge` et `pull`, passe.
  [/\bgit\s+(commit|push|merge|am|rebase)\b[^;&|]*\s--no-veri(fy?)?(?![\w-])/i, "--no-verify : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  // `git commit -n` est `--no-verify`, seul ou groupé (`-nm`, `-an`).
  [/\bgit\s+commit\b[^;&|]*\s-[a-z]*n[a-z]*(\s|$)/i, "-n de git commit (--no-verify) : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  [/\bgit\s+push\b[^;&|]*[\s:](develop|main)(\s|$)/i, 'pousser sur develop ou main : jamais directement, une PR passe par le capitaine de fusion.'],
  [/\bgit\s+(rebase|reset\s+--hard)\b[^;&|]*\b(origin\/)?(develop|main|sujet\/)/i, 'rebase ou reset --hard sur une branche partagée : jamais ; un sujet se rafraîchit par merge (sujet.sh rafraichir).'],
];

const RAISON_DEPENDANCE =
  "Dépendance nouvelle refusée : elle n'est pas sur la ligne `Dépendances:` du ticket, lue sur le sujet (ou cette ligne ne se lit pas : origin injoignable, option qui change la source, `.npmrc` modifié, ticket hors sujet, branche sans ticket). Écris à qui a lancé ta session, ton conducteur dans un chantier : le paquet, pourquoi, ce qu'il remplace. C'est lui qui l'accorde, en complétant la ligne sur le sujet. Un paquet prévu par cette ligne passe.";

/** Options de pnpm suivies d'une valeur, qu'il ne faut pas prendre pour un paquet. */
const OPTIONS_A_VALEUR = new Set(['--filter', '-F', '--dir', '-C', '--reporter', '--loglevel', '--store-dir', '--modules-dir', '--lockfile-dir', '--network-concurrency', '--child-concurrency']);

/**
 * Nom d'un paquet sans sa version : `leaflet@1.9.4` → `leaflet`, `@types/leaflet@^1` → `@types/leaflet`.
 * Seule une version ou une étiquette se retire : un alias ou une source (`leaflet@npm:autre`,
 * `x@github:…`, `x@file:…`) garde la spécification entière, qu'aucune ligne `Dépendances:` ne porte.
 */
export const nomDuPaquet = (specification) => {
  const arobase = specification.indexOf('@', specification.startsWith('@') ? 1 : 0);
  if (arobase < 0) return specification;
  const version = specification.slice(arobase + 1);
  return /^[\w.^~<>=*|+-]*$/.test(version) ? specification.slice(0, arobase) : specification;
};

/**
 * Options de `pnpm add` qui ne changent ni la source ni la cible de l'installation : seules celles-ci
 * laissent passer un paquet prévu. `--registry`, `--config.*`, `--global`, `-C`/`--dir` (qui lit le
 * `.npmrc` d'un autre dossier)… sont toujours refusées.
 */
const OPTIONS_SANS_RISQUE = new Set(['-D', '--save-dev', '-P', '--save-prod', '-O', '--save-optional', '-E', '--save-exact', '--save-peer', '-w', '--workspace-root', '--filter', '-F', '--prefer-offline', '--offline']);

/**
 * L'ajout d'une commande simple (`pnpm add`, `pnpm install <paquet>`), lue sur ses mots en lecture L3
 * (`lireCommande`) : `[{ paquets, options }]`, ou `[]` si elle n'ajoute rien.
 * @param {readonly string[]} mots
 */
function ajouts(mots) {
  let i = mots.findIndex((mot) => /(^|\/)pnpm$/.test(mot));
  if (i < 0) return [];
  const positionnels = [];
  // Ce qui précède pnpm (`npm_config_registry=… pnpm`, `env …`) peut changer la source.
  const options = i > 0 ? ['(préfixe)'] : [];
  for (i++; i < mots.length; i++) {
    if (!mots[i].startsWith('-')) positionnels.push(mots[i]);
    else {
      options.push(mots[i].split('=')[0]);
      if (OPTIONS_A_VALEUR.has(mots[i])) i++;
    }
  }
  const [sousCommande, ...paquets] = positionnels;
  return ['add', 'i', 'install'].includes(sousCommande) && paquets.length > 0 ? [{ paquets: paquets.map(nomDuPaquet), options }] : [];
}

/**
 * Paquets qu'ajoute la commande (`pnpm add <paquet>`, `pnpm install <paquet>`), noms sans version.
 * Un chemin, une URL ou un alias reste tel quel : il ne figure dans aucune ligne `Dépendances:`.
 */
export const paquetsAjoutes = (code) => {
  const lu = lireCommande(code);
  return [...lu.textes, ...lu.cites].flatMap(ajouts).flatMap(({ paquets }) => paquets);
};

/** Vrai si la commande ajoute un paquet (`pnpm add <paquet>`, `pnpm install <paquet>`). */
export const ajouteUneDependance = (code) => paquetsAjoutes(code).length > 0;

/**
 * Paquets que le ticket prévoit : sa ligne d'en-tête `Dépendances:` (avant la première section),
 * noms entre accents graves ou nus, séparés par des virgules, jusqu'à un ` — ` ou ` # ` de commentaire.
 * `—` ou ligne absente → `[]`.
 */
export function lireDependances(texteDuTicket) {
  const enTete = (texteDuTicket ?? '').split(/^## /m)[0];
  const ligne = (/^Dépendances:[ \t]*(.*)$/m.exec(enTete)?.[1] ?? '').split(/\s[—#]\s/)[0];
  return ligne
    .split(',')
    .map((nom) => nom.replace(/`/g, '').trim())
    .filter((nom) => nom && !/^[—–-]+$/.test(nom))
    .map(nomDuPaquet);
}

const RAISON_PUSH_SUJET =
  "un sujet ne se pousse jamais à la main, quelle que soit la branche : seul sujet.sh y écrit (demarrer, rafraichir, fusionner, livrer, carte, clore). Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. Pour la carte : `bash scripts/chaine/sujet.sh carte <nom>` ; pour supprimer un sujet livré : `bash scripts/chaine/sujet.sh clore <nom>`.";
const RAISON_NOM_ILLISIBLE =
  "nom de branche illisible (segment . ou .., %, barre finale, caractère de contrôle, blancs autour) : un client d'URL le résout, il pourrait viser un sujet, develop ou main. Écris le nom en clair ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
const RAISON_PUSH_GARDEE =
  "pousser sur develop, main ou la branche par défaut, sous quelque graphie que ce soit (refs/heads/develop, heads/main, majuscules) : jamais directement, une PR passe par le capitaine de fusion.";
const RAISON_PUSH_FORCE =
  "push forcé (--force, --force-with-lease, --force-if-includes, -f, refspec +…) : jamais, sur aucune branche, la sienne comprise (il réécrit un historique publié). Une branche à reprendre se refait : branche neuve, `git cherry-pick`, nouvelle PR.";
const RAISON_PUSH_ILLISIBLE =
  "git push dont la destination ne se lit pas (variable, substitution, motif, --all, --mirror) : elle pourrait viser un sujet. Écris le refspec en clair ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";

// ——— Le lecteur de commandes ———————————————————————————————————————————————————————————————————————————

/** Mot qui remplace une expansion dans la commande englobante : il porte `$`, donc se lit illisible. */
const SUBSTITUTION = '$SUBSTITUTION';

/** La raison d'un refus de ce que `lireCommande` ne sait pas lire. Elle passe avant tout autre refus. */
export const RAISON_ILLISIBLE =
  "commande que la garde ne sait pas lire (here-doc non fermé ou fermé autrement que par son délimiteur seul sur sa ligne, guillemet ou substitution non fermés, syntaxe inconnue) : elle est refusée plutôt que devinée. Récris-la plus simplement ; un message long passe par un here-doc quoté (<<'EOF' … EOF seul sur sa ligne) ou par git commit -F <fichier> / gh … --body-file <fichier>.";

/** Borne de l'imbrication : substitutions, sous-shells, groupes, commandes composées, `-c`, `eval`, corps relus. */
const PROFONDEUR_MAX = 32;

/** Les shells : un corps de here-doc ou une chaîne `-c` qui leur est donnée est lue comme des commandes. */
const SHELLS = new Set(['bash', 'sh', 'dash', 'zsh', 'ksh', 'mksh', 'busybox']);
/** Ce qui exécute ce qu'on lui donne comme des commandes de shell. */
const VERS_UN_SHELL = new Set([...SHELLS, 'source', '.', 'eval']);
/**
 * Les exécuteurs : un seul, où qu'il soit dans la commande entière, et aucun corps de here-doc n'est retiré
 * (il pourrait lancer ce qu'un `cat > s.sh <<'EOF'` a écrit). S'y ajoutent un programme donné par un chemin
 * dont le nom n'est ni `git` ni `gh`, un programme donné par une expansion, `env -S`, `alias` et toute
 * définition de fonction.
 */
const EXECUTEURS = new Set([...VERS_UN_SHELL, 'python', 'python2', 'python3', 'node', 'deno', 'bun', 'perl', 'ruby', 'php', 'lua', 'osascript', 'xargs', 'find', 'parallel', 'watch', 'ssh', 'su', 'script', 'sudo', 'doas']);
/**
 * Les consommateurs inertes : un corps de here-doc quoté qui ne va qu'à eux n'est pas lu. S'y ajoutent
 * `git commit`, `git tag`, `git notes`, `gh pr|issue|release create|edit|comment` et `gh api`.
 */
const INERTES = new Set(['cat', 'tee', 'head', 'tail', 'wc', 'sort', 'uniq', 'tr', 'cut', 'grep', 'diff', 'jq', 'base64', 'echo', 'printf']);
const GIT_INERTES = new Set(['commit', 'tag', 'notes']);
/** Les mots réservés de bash, reconnus en tête de commande seulement. */
const RESERVES = new Set(['if', 'then', 'elif', 'else', 'fi', 'do', 'done', 'while', 'until', 'for', 'select', 'case', 'esac', 'function', 'coproc', 'time', '{', '}', '!', '[[']);
/** Les mots réservés par premier caractère : un mot qui commence autrement n'en est pas un. */
const RESERVES_PAR_INITIALE = new Map();
for (const w of RESERVES) RESERVES_PAR_INITIALE.set(w[0], [...(RESERVES_PAR_INITIALE.get(w[0]) ?? []), w]);
/** Les mots réservés qui ferment une commande composée : en tête d'une commande qu'ils ne ferment pas, illisibles. */
const FERMANTS = new Set(['then', 'elif', 'else', 'fi', 'do', 'done', 'esac', '}']);

/** Le motif d'illisibilité, levé par le lecteur et rendu par `lireCommande`. */
class Illisible extends Error {
  constructor(motif) {
    super(motif);
    this.motif = motif;
  }
}

const metacaractere = (c) => c === ' ' || c === '\t' || c === '\n' || c === ';' || c === '&' || c === '|' || c === '(' || c === ')' || c === '<' || c === '>';
const separateur = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\v' || c === '\f' || c === ';' || c === '&' || c === '|' || c === '(' || c === ')' || c === '<' || c === '>';
const aUnSeparateur = (texte) => {
  for (const c of texte) if (separateur(c)) return true;
  return false;
};
const nomDeBase = (valeur) => {
  const k = valeur.lastIndexOf('/');
  return k < 0 ? valeur : valeur.slice(k + 1);
};
/** Les caractères qu'un mot lit tels quels : ni métacaractère, ni citation, ni expansion. */
const ordinaire = (c) => !metacaractere(c) && c !== '\\' && c !== "'" && c !== '"' && c !== '$' && c !== '`';
const estChemin = (v) => v.startsWith('/') || v.startsWith('./') || v.startsWith('../') || v.startsWith('~/');
const chiffre = (c) => c >= '0' && c <= '9';
const debutDeNom = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
const suiteDeNom = (c) => debutDeNom(c) || chiffre(c);
const MUET = { lit() {}, exp() {} };
const VIDE = Object.freeze([]);

/** Les échappements d'une citation ANSI-C (`$'…'`), à partir de la barre oblique inverse en `i` : `[valeur, fin]`. */
function echappementC(s, i) {
  const n = s[i + 1];
  const simples = { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', e: '\x1b', E: '\x1b', f: '\f', v: '\v', '\\': '\\', "'": "'", '"': '"', '?': '?' };
  if (n in simples) return [simples[n], i + 2];
  const hexa = (debut, max) => {
    let j = debut;
    while (j < debut + max && /[0-9a-fA-F]/.test(s[j] ?? '')) j++;
    return j;
  };
  if (n === 'x' || n === 'u' || n === 'U') {
    const j = hexa(i + 2, n === 'x' ? 2 : n === 'u' ? 4 : 8);
    if (j === i + 2) return ['\\' + n, i + 2];
    const code = parseInt(s.slice(i + 2, j), 16);
    return [code <= 0x10ffff ? String.fromCodePoint(code) : '', j];
  }
  if (n >= '0' && n <= '7') {
    let j = i + 1;
    while (j < i + 4 && s[j] >= '0' && s[j] <= '7') j++;
    return [String.fromCharCode(parseInt(s.slice(i + 1, j), 8) & 0xff), j];
  }
  if (n === 'c' && i + 2 < s.length) return [String.fromCharCode(s.charCodeAt(i + 2) & 0x1f), i + 3];
  return [n === undefined ? '\\' : '\\' + n, n === undefined ? i + 1 : i + 2];
}

/** Le délimiteur d'un here-doc, citations retirées comme bash le fait (`'EOF'`, `"EOF"`, `\EOF`, `E'O'F`, `$'EOF'` → `EOF`). */
function retirerCitations(brut) {
  let v = '';
  for (let i = 0; i < brut.length; ) {
    const c = brut[i];
    if (c === '\\') {
      if (brut[i + 1] !== '\n') v += brut[i + 1] ?? '';
      i += 2;
    } else if (c === "'") {
      const j = brut.indexOf("'", i + 1);
      v += brut.slice(i + 1, j < 0 ? brut.length : j);
      i = j < 0 ? brut.length : j + 1;
    } else if (c === '$' && brut[i + 1] === "'") {
      for (i += 2; i < brut.length && brut[i] !== "'"; ) {
        if (brut[i] === '\\') {
          const [e, j] = echappementC(brut, i);
          v += e;
          i = j;
        } else v += brut[i++];
      }
      i++;
    } else if (c === '"' || (c === '$' && brut[i + 1] === '"')) {
      for (i += c === '$' ? 2 : 1; i < brut.length && brut[i] !== '"'; i++) {
        if (brut[i] === '\\' && '$`"\\\n'.includes(brut[i + 1])) i++;
        v += brut[i];
      }
      i++;
    } else v += brut[i++];
  }
  return v;
}

/** Les caractères que la lecture L2 dénudée retire d'un texte (l'accent grave y coupe le segment). */
const aDenuderDans = (texte) => texte.includes('"') || texte.includes("'") || texte.includes('\\') || texte.includes('`');
/** Un texte sans ses guillemets ni ses barres obliques inverses, accents graves lus comme des `;` (lecture L2 dénudée). */
function denuder(texte) {
  if (!aDenuderDans(texte)) return texte;
  let nu = '';
  for (const c of texte) if (c === '`') nu += ';';
  else if (c !== '"' && c !== "'" && c !== '\\') nu += c;
  return nu;
}
/** Les caractères où `eclater` coupe un segment. */
const separateurDeSegment = (c) => c === ';' || c === '&' || c === '|' || c === '(' || c === ')' || c === '\n';
const premierSeparateur = (texte) => {
  for (let i = 0; i < texte.length; i++) if (separateurDeSegment(texte[i])) return i;
  return -1;
};
const aUnSeparateurDeSegment = (texte) => premierSeparateur(texte) >= 0;

/** La lecture éclatée (L2) d'un texte : coupé sur `;`, `&`, `|`, `(`, `)` et le saut de ligne, puis sur les blancs. */
function eclater(texte) {
  const segments = [];
  let debut = 0;
  const blanc = (c) => c === ' ' || c === '\t' || c === '\r' || c === '\v' || c === '\f';
  const fermer = (fin) => {
    const mots = [];
    for (let k = debut; k < fin; ) {
      while (k < fin && blanc(texte[k])) k++;
      const d = k;
      while (k < fin && !blanc(texte[k])) k++;
      if (k > d) mots.push(texte.slice(d, k));
    }
    if (mots.length) segments.push({ segment: texte.slice(debut, fin), mots });
  };
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (c === ';' || c === '&' || c === '|' || c === '(' || c === ')' || c === '\n') {
      fermer(i);
      debut = i + 1;
    }
  }
  fermer(texte.length);
  return segments;
}

/**
 * Le programme d'une commande simple : l'index du premier mot après les préfixes que le lecteur connaît
 * (`env` sans `-S`, `command`, `nice`, `nohup`, `time`, `timeout <durée>`) ; `executeur` si `env -S`.
 * Tout autre préfixe (`exec`, `sudo`, `stdbuf`…) est le programme : il n'est pas transparent.
 */
const programmes = new WeakMap();
const valeurLisible = (mots, j) => (mots[j] && !mots[j].expansion ? mots[j].valeur : null);
function optionsDuPrefixe(mots, k, aValeur) {
  for (let o = valeurLisible(mots, k); o !== null && o.startsWith('-') && o !== '-'; o = valeurLisible(mots, k)) {
    k += aValeur.includes(o) ? 2 : 1;
    if (o === '--') break;
  }
  return k;
}
function programme(mots) {
  let p = programmes.get(mots);
  if (!p) programmes.set(mots, (p = lireProgramme(mots)));
  return p;
}
const SANS_VALEUR = [];
const NICE_A_VALEUR = ['-n', '--adjustment'];
const TIME_A_VALEUR = ['-f', '-o', '--format', '--output'];
const TIMEOUT_A_VALEUR = ['-s', '-k', '--signal', '--kill-after'];
function lireProgramme(mots) {
  const v = (j) => valeurLisible(mots, j);
  const options = (k, aValeur) => optionsDuPrefixe(mots, k, aValeur);
  for (let k = 0; ; ) {
    const w = valeurLisible(mots, k);
    if (w !== 'env' && w !== 'command' && w !== 'nice' && w !== 'nohup' && w !== 'time' && w !== 'timeout') return { k };
    if (w === 'env') {
      for (k++; ; ) {
        const o = v(k);
        if (o === null) return { k };
        if (o.startsWith('--split-string') || (o.startsWith('-') && !o.startsWith('--') && o.includes('S'))) return { k, executeur: true };
        if (o === '-u' || o === '-C' || o === '--unset' || o === '--chdir') k += 2;
        else if (o === '--') {
          k++;
          break;
        } else if (o.startsWith('-') || (debutDeNom(o[0]) && o.includes('='))) k++;
        else break;
      }
    } else if (w === 'command' || w === 'nohup') k = options(k + 1, SANS_VALEUR);
    else if (w === 'nice') k = options(k + 1, NICE_A_VALEUR);
    else if (w === 'time') k = options(k + 1, TIME_A_VALEUR);
    else k = options(k + 1, TIMEOUT_A_VALEUR) + 1;
  }
}

/** Les positionnels de `gh` après le programme, sans `-R`, `--repo`, `--hostname` ni leur valeur. */
function positionnelsGh(mots, i) {
  const pos = [];
  for (let k = i + 1; k < mots.length; k++) {
    const v = mots[k].valeur;
    if (v === '-R' || v === '--repo' || v === '--hostname') k++;
    else if (!v.startsWith('-')) pos.push(v);
  }
  return pos;
}

/** Vrai si une commande simple ne lit son entrée que comme du texte (`cat`, `git commit`, `gh pr create`…). */
function inerte(commande) {
  const { mots } = commande;
  if (!mots.length) return true;
  const { k, executeur } = programme(mots);
  if (executeur) return false;
  const w = mots[k];
  if (!w) return true;
  if (w.expansion) return false;
  if (INERTES.has(w.valeur)) return true;
  if (w.valeur === 'git') {
    let j = k + 1;
    while (j < mots.length && !mots[j].expansion && mots[j].valeur.startsWith('-')) j += OPTIONS_GIT_A_VALEUR.has(mots[j].valeur) ? 2 : 1;
    return Boolean(mots[j]) && !mots[j].expansion && GIT_INERTES.has(mots[j].valeur);
  }
  if (w.valeur === 'gh') {
    const [a, b] = positionnelsGh(mots, k);
    return a === 'api' || (['pr', 'issue', 'release'].includes(a) && ['create', 'edit', 'comment'].includes(b));
  }
  return false;
}

/** Vrai si un mot de la commande simple est un shell, `source` ou `eval` (où qu'il soit), ou si son programme est `.`. */
function versUnShell(commande) {
  if (!commande) return false;
  const { mots } = commande;
  const w = mots[programme(mots).k];
  if (w && !w.expansion && w.valeur === '.') return true;
  for (const m of mots) if (!m.expansion && m.valeur !== '.' && VERS_UN_SHELL.has(nomDeBase(m.valeur))) return true;
  return false;
}

/** Vrai si la commande simple porte un exécuteur (`EXECUTEURS`), en programme ou en mot. */
function aUnExecuteur(commande) {
  const { mots } = commande;
  const { k, executeur } = programme(mots);
  if (executeur) return true;
  const w = mots[k];
  if (w && (w.expansion || (w.valeur.includes('/') && !['git', 'gh'].includes(nomDeBase(w.valeur))) || EXECUTEURS.has(w.valeur) || w.valeur === 'alias')) return true;
  for (const m of mots) if (!m.expansion && m.valeur !== '.' && (EXECUTEURS.has(m.valeur) || (estChemin(m.valeur) && EXECUTEURS.has(nomDeBase(m.valeur))))) return true;
  return false;
}

/** L'index de la chaîne de commande d'un shell placé en `s` (`bash -c '…'`, `sh -ec "…"`), ou -1. */
function indexDeLaChaineC(mots, s) {
  let c = false;
  for (let k = s + 1; k < mots.length; k++) {
    const w = mots[k].valeur;
    if (!mots[k].expansion && w.length > 1 && (w[0] === '-' || w[0] === '+')) {
      if (w === '--') return c && k + 1 < mots.length ? k + 1 : -1;
      if (w.startsWith('--')) {
        if (w === '--rcfile' || w === '--init-file') k++;
        continue;
      }
      if (w[0] === '-' && w.includes('c')) c = true;
      if (w.includes('o') || w.includes('O')) k++;
      continue;
    }
    return c ? k : -1;
  }
  return -1;
}

const estShell = (mot) => !mot.expansion && SHELLS.has(nomDeBase(mot.valeur));

/** Vrai si le mot de la commande est un argument d'`eval`, la chaîne `-c` d'un shell, ou suit un shell, `source` ou `eval`. */
function donneAUnShell(commande, mot) {
  const { mots } = commande;
  const k = mots.indexOf(mot);
  if (k < 0) return false;
  for (let j = 0; j < k; j++) if (!mots[j].expansion && mots[j].valeur !== '.' && VERS_UN_SHELL.has(nomDeBase(mots[j].valeur))) return true;
  const w = mots[programme(mots).k];
  return Boolean(w) && !w.expansion && w.valeur === '.' && mots.indexOf(w) < k;
}

/**
 * Le lecteur : une source lue de gauche à droite, comme bash, en un passage. Les substitutions de la même
 * source se lisent sur place ; une source dérivée (accents graves, `-c`, `eval`, corps de here-doc) se lit
 * par un lecteur à part, qui partage le recueil `lu`.
 */
class Lecteur {
  constructor(src, lu, { profondeur = 0, origine = 'tete', base = 0, exact = true, racine = false, pileSubst = [], dehors = false } = {}) {
    this.src = src;
    this.lu = lu;
    this.profondeur = profondeur;
    this.origine = origine;
    this.base = base;
    this.exact = exact;
    this.racine = racine;
    this.pileSubst = pileSubst;
    this.dehors = dehors;
    this.i = 0;
    this.attente = [];
    this.cmd = null;
    this.mot = null;
    this.apresExpansion = false;
    this.reserveEn = -1;
    this.reserve = null;
  }

  echec(motif) {
    throw new Illisible(motif);
  }

  /** Ajoute au mot en cours un texte littéral, cité ou non. */
  lit(v, cite) {
    const mot = this.mot;
    if (this.apresExpansion && v) {
      mot.texte += ' ';
      this.apresExpansion = false;
    }
    if (v) mot.litteral = true;
    if (!cite) mot.nu += v;
    mot.valeur += v;
    mot.texte += v;
    if (mot.queue !== null) mot.queue += v;
    if (cite) {
      mot.cite = true;
      if (!mot.blancCite && aUnSeparateur(v)) mot.blancCite = true;
    }
  }

  /**
   * Marque le mot en cours comme portant une expansion. Dans son `texte` (lectures L2 et L3), une substitution
   * de commande se lit `$SUBSTITUTION`, suivie d'un blanc si le mot continue ; un paramètre (`$x`, `${…}`)
   * garde son texte, comme 7.9.0 le lisait : `GH=gh; $GH pr merge 3` reste refusé.
   */
  exp(brut, cite = false) {
    const mot = this.mot;
    if (!mot.expansion) mot.prefixe = mot.valeur;
    if (!cite) mot.nonCitee = true;
    // `"$@"`, `"${a[@]}"`, `"${!p@}"` : un mot par élément, même entre guillemets doubles.
    if (brut !== undefined && (brut === '$@' || (brut.startsWith('${') && brut.includes('@')))) mot.nonCitee = true;
    mot.expansion = true;
    mot.queue = '';
    if (brut === undefined) {
      mot.texte += SUBSTITUTION;
      this.apresExpansion = true;
    } else {
      if (this.apresExpansion) mot.texte += ' ';
      mot.texte += brut;
      this.apresExpansion = false;
    }
  }

  /** Position dans la commande d'origine : exacte dans la source de tête et ses sous-chaînes, celle du mot porteur sinon. */
  pos(i = this.i) {
    return this.exact ? this.base + i : this.base;
  }

  plonger(f) {
    if (++this.profondeur > PROFONDEUR_MAX) this.echec('imbrication trop profonde');
    try {
      return f();
    } finally {
      this.profondeur--;
    }
  }

  remplacer(debut, fin, texte) {
    if (this.racine && this.lu.remplacements) this.lu.remplacements.push([debut, fin, texte]);
  }

  /** Blancs, lignes continuées et commentaire (un `#` en début de mot), sans le saut de ligne. */
  blancs() {
    const s = this.src;
    for (;;) {
      const c = s[this.i];
      if (c === ' ' || c === '\t') this.i++;
      else if (c === '\\' && s[this.i + 1] === '\n') this.i += 2;
      else if (c === '#') {
        const j = s.indexOf('\n', this.i);
        this.i = j < 0 ? s.length : j;
      } else return;
    }
  }

  /** Blancs et sauts de ligne ; chaque saut de ligne lit les corps de here-doc en attente. */
  sauterLignes() {
    for (;;) {
      this.blancs();
      if (this.src[this.i] !== '\n') return;
      this.i++;
      if (this.dehors) this.echec('saut de ligne dans une substitution alors qu’un here-doc attend son corps');
      if (this.attente.length) this.lireCorps();
    }
  }

  /** Le mot réservé qui commence en `i`, s'il est suivi d'un métacaractère ou de la fin. */
  motReserve() {
    if (this.reserveEn === this.i) return this.reserve;
    this.reserveEn = this.i;
    return (this.reserve = this.lireMotReserve());
  }

  lireMotReserve() {
    const s = this.src;
    const candidats = RESERVES_PAR_INITIALE.get(s[this.i]);
    if (!candidats) return null;
    for (const w of candidats) {
      const fin = this.i + w.length;
      if (s.startsWith(w, this.i) && (fin >= s.length || metacaractere(s[fin]))) return w;
    }
    return null;
  }

  motIn() {
    const s = this.src;
    return s[this.i] === 'i' && s[this.i + 1] === 'n' && (this.i + 2 >= s.length || metacaractere(s[this.i + 2]));
  }

  /** L'opérateur de contrôle qui commence en `i`, ou `null`. */
  operateur() {
    const s = this.src;
    const a = s[this.i];
    const b = s[this.i + 1];
    const c = s[this.i + 2];
    if (a === ';') return b === ';' ? (c === '&' ? ';;&' : ';;') : b === '&' ? ';&' : ';';
    if (a === '&') return b === '&' ? '&&' : b === '>' ? null : '&';
    if (a === '|') return b === '|' ? '||' : b === '&' ? '|&' : '|';
    if (a === '\n' || a === '(' || a === ')') return a;
    return null;
  }

  /** La source entière : une liste, puis la fin. */
  lireSource() {
    const r = this.lireListe(new Set());
    if (r !== 'fin') this.echec(r === ')' ? 'parenthèse fermante sans ouvrante' : 'syntaxe inconnue');
    if (this.attente.length) this.echec('here-doc non fermé');
  }

  /**
   * Une liste de pipelines jusqu'à la fin, un `)`, un mot réservé de `fins`, ou (dans un `case`) `;;`, `;&`, `;;&`,
   * rendu sans être consommé.
   */
  lireListe(fins, { cas = false } = {}) {
    const s = this.src;
    for (;;) {
      this.sauterLignes();
      if (this.i >= s.length) return 'fin';
      if (s[this.i] === ')') return ')';
      const kw = this.motReserve();
      if (kw && fins.has(kw)) return kw;
      const o = this.operateur();
      if (cas && (o === ';;' || o === ';&' || o === ';;&')) return o;
      if (o && o !== '(') this.echec('opérateur là où bash veut une commande');
      this.lirePipeline();
      this.blancs();
      const sep = this.operateur();
      if (sep === '&&' || sep === '||') {
        this.i += 2;
        this.sauterLignes();
        const k = this.motReserve();
        if (this.i >= s.length || s[this.i] === ')' || (k && FERMANTS.has(k))) this.echec('commande attendue après && ou ||');
        continue;
      }
      if (sep === ';' || sep === '&') {
        this.i++;
        continue;
      }
      if (sep === '\n') continue;
      if (cas && (sep === ';;' || sep === ';&' || sep === ';;&')) return sep;
      if (sep === ')') return ')';
      if (this.i >= s.length) return 'fin';
      const k = this.motReserve();
      if (k && fins.has(k)) return k;
      this.echec('syntaxe inconnue');
    }
  }

  lirePipeline() {
    const s = this.src;
    for (;;) {
      this.blancs();
      const kw = this.motReserve();
      if (kw === '!') this.i++;
      else if (kw === 'time') {
        this.i += 4;
        this.blancs();
        while ((s.startsWith('-p', this.i) || s.startsWith('--', this.i)) && (this.i + 2 >= s.length || metacaractere(s[this.i + 2]))) {
          this.i += 2;
          this.blancs();
        }
      } else break;
    }
    const segments = [];
    for (;;) {
      segments.push(this.lireCommandeUne());
      this.blancs();
      const o = this.operateur();
      if (o !== '|' && o !== '|&') break;
      this.i += o.length;
      this.sauterLignes();
      if (this.i >= s.length || s[this.i] === ')') this.echec('commande attendue après |');
    }
    for (let index = 0; index < segments.length; index++)
      for (const h of segments[index].heredocs) {
        h.pipeline = segments;
        h.index = index;
      }
  }

  /** Une commande : composée (avec ses redirections) ou simple. Rend `{ simple, heredocs }`. */
  lireCommandeUne() {
    const s = this.src;
    this.blancs();
    if (s[this.i] === '(') {
      if (s[this.i + 1] === '(') {
        const fin = this.finArithmetique(this.i + 2);
        if (fin >= 0) {
          this.plonger(() => this.arithmetique(this.i + 2, fin));
          this.i = fin + 2;
          return this.apresComposee();
        }
      }
      this.i++;
      this.plonger(() => this.sousListe('sous-shell'));
      return this.apresComposee();
    }
    const kw = this.motReserve();
    if (kw === null) return this.commandeSimple();
    if (FERMANTS.has(kw)) this.echec(`mot réservé inattendu : ${kw}`);
    const attendre = (mot, fins, opts) => {
      const r = this.lireListe(new Set(fins), opts);
      if (r !== mot && !(Array.isArray(mot) && mot.includes(r))) this.echec(`commande composée non fermée (${fins.join(', ')} attendu)`);
      return r;
    };
    const consommer = (mot) => {
      this.i += mot.length;
    };
    switch (kw) {
      case '!':
      case 'time':
        consommer(kw);
        return this.lireCommandeUne();
      case '{':
        consommer('{');
        this.plonger(() => attendre('}', ['}']));
        consommer('}');
        return this.apresComposee();
      case 'if':
        consommer('if');
        this.plonger(() => {
          attendre('then', ['then']);
          consommer('then');
          for (;;) {
            const r = attendre(['elif', 'else', 'fi'], ['elif', 'else', 'fi']);
            consommer(r);
            if (r === 'fi') break;
            if (r === 'elif') {
              attendre('then', ['then']);
              consommer('then');
            } else {
              attendre('fi', ['fi']);
              consommer('fi');
              break;
            }
          }
        });
        return this.apresComposee();
      case 'while':
      case 'until':
        consommer(kw);
        this.plonger(() => {
          attendre('do', ['do']);
          consommer('do');
          attendre('done', ['done']);
          consommer('done');
        });
        return this.apresComposee();
      case 'for':
      case 'select':
        consommer(kw);
        this.plonger(() => this.boucle(kw, attendre, consommer));
        return this.apresComposee();
      case 'case':
        consommer('case');
        this.plonger(() => this.cas());
        return this.apresComposee();
      case '[[':
        consommer('[[');
        this.plonger(() => this.doubleCrochet());
        return this.apresComposee();
      case 'function': {
        consommer('function');
        this.blancs();
        if (!this.lireMot()) this.echec('fonction sans nom');
        this.blancs();
        if (s[this.i] === '(') {
          this.i++;
          this.blancs();
          if (s[this.i] !== ')') this.echec('syntaxe inconnue');
          this.i++;
        }
        this.sauterLignes();
        this.lu.fonctions = true;
        return { simple: null, heredocs: this.plonger(() => this.lireCommandeUne()).heredocs };
      }
      case 'coproc': {
        consommer('coproc');
        this.blancs();
        const composees = ['{', 'if', 'while', 'until', 'for', 'select', 'case', '[['];
        if (s[this.i] === '(' || composees.includes(this.motReserve())) return this.lireCommandeUne();
        const sauve = this.i;
        const nom = this.lireMot();
        this.blancs();
        if (nom && !nom.expansion && !nom.cite && (s[this.i] === '(' || composees.includes(this.motReserve()))) return this.lireCommandeUne();
        this.i = sauve;
        return this.commandeSimple();
      }
      default:
        return this.commandeSimple();
    }
  }

  boucle(kw, attendre, consommer) {
    const s = this.src;
    this.blancs();
    if (kw === 'for' && s[this.i] === '(' && s[this.i + 1] === '(') {
      const fin = this.finArithmetique(this.i + 2);
      if (fin < 0) this.echec('for (( … )) non fermé');
      this.arithmetique(this.i + 2, fin);
      this.i = fin + 2;
      this.blancs();
      if (s[this.i] === ';') this.i++;
    } else {
      if (!this.lireMot()) this.echec('for sans nom');
      this.sauterLignes();
      if (this.motIn()) {
        this.i += 2;
        for (;;) {
          this.blancs();
          const c = s[this.i];
          if (c === ';') {
            this.i++;
            break;
          }
          if (c === '\n' || this.i >= s.length) break;
          if (!this.lireMot()) this.echec('liste de for illisible');
        }
      } else if (s[this.i] === ';') this.i++;
    }
    this.sauterLignes();
    const k = this.motReserve();
    if (k === 'do') {
      consommer('do');
      attendre('done', ['done']);
      consommer('done');
    } else if (k === '{') {
      consommer('{');
      attendre('}', ['}']);
      consommer('}');
    } else this.echec('boucle sans do');
  }

  cas() {
    const s = this.src;
    this.blancs();
    if (!this.lireMot()) this.echec('case sans mot');
    this.sauterLignes();
    if (!this.motIn()) this.echec('case sans in');
    this.i += 2;
    for (;;) {
      this.sauterLignes();
      if (this.i >= s.length) this.echec('case non fermé');
      if (this.motReserve() === 'esac') {
        this.i += 4;
        return;
      }
      if (s[this.i] === '(') this.i++;
      for (;;) {
        this.blancs();
        if (!this.lireMot()) this.echec('motif de case illisible');
        this.blancs();
        if (s[this.i] === '|') this.i++;
        else if (s[this.i] === ')') {
          this.i++;
          break;
        } else this.echec('motif de case illisible');
      }
      const r = this.lireListe(new Set(['esac']), { cas: true });
      if (r === ';;' || r === ';&' || r === ';;&') this.i += r.length;
      else if (r === 'esac') {
        this.i += 4;
        return;
      } else this.echec('case non fermé');
    }
  }

  /** `[[ … ]]` : des mots et des opérateurs de test, aucune commande ; leurs substitutions se lisent. */
  doubleCrochet() {
    const s = this.src;
    for (;;) {
      this.sauterLignes();
      if (this.i >= s.length) this.echec('[[ non fermé');
      if (s[this.i] === ']' && s[this.i + 1] === ']' && (this.i + 2 >= s.length || metacaractere(s[this.i + 2]))) {
        this.i += 2;
        return;
      }
      const c = s[this.i];
      if (c === ';') this.echec('syntaxe inconnue dans [[ ]]');
      if ((c === '<' || c === '>') && s[this.i + 1] === '(') this.lireMot();
      else if (c === '&' || c === '|' || c === '(' || c === ')' || c === '<' || c === '>') this.i++;
      else if (!this.lireMot()) this.i++;
    }
  }

  /** Le contenu d'un sous-shell, `(` déjà lu, jusqu'à son `)`. */
  sousListe(origine) {
    const avant = this.origine;
    this.origine = origine;
    try {
      if (this.lireListe(new Set()) !== ')') this.echec('sous-shell non fermé');
      this.i++;
    } finally {
      this.origine = avant;
    }
  }

  /** Les redirections qui suivent une commande composée ; ses here-docs ont pour consommateur la commande composée. */
  apresComposee() {
    const noeud = { simple: null, heredocs: [] };
    for (;;) {
      this.blancs();
      const r = this.redirection(null);
      if (!r) return noeud;
      if (r.heredoc) noeud.heredocs.push(r.heredoc);
    }
  }

  commandeSimple() {
    const s = this.src;
    const cmd = { affectations: [], mots: [], redirections: [], heredocs: [], tableaux: [], origine: this.origine, debut: this.pos(), profondeur: this.profondeur };
    const elements = [];
    const cmdAvant = this.cmd;
    const motAvant = this.mot;
    this.cmd = cmd;
    try {
      for (;;) {
        this.blancs();
        if (this.i >= s.length) break;
        const r = this.redirection(cmd);
        if (r) {
          if (r.heredoc) {
            cmd.heredocs.push(r.heredoc);
            if (r.heredoc.operateur === '<<<') elements.push('<<< ' + r.heredoc.contenu.texte);
          } else {
            cmd.redirections.push(r.redirection);
            elements.push(r.redirection.operateur + ' ' + r.redirection.cible.texte);
          }
          continue;
        }
        const c = s[this.i];
        if (c === '(') {
          const [nom] = cmd.mots;
          if (cmd.mots.length === 1 && !cmd.affectations.length && elements.length === 1 && !nom.cite && !nom.expansion && !nom.valeur.includes('=')) {
            this.i++;
            this.blancs();
            if (s[this.i] !== ')') this.echec('syntaxe inconnue');
            this.i++;
            this.sauterLignes();
            this.lu.fonctions = true;
            return { simple: null, heredocs: this.plonger(() => this.lireCommandeUne()).heredocs };
          }
          this.echec('parenthèse inattendue');
        }
        // `<(…)` et `>(…)` commencent un mot (substitution de processus), pas une redirection.
        if (metacaractere(c) && !((c === '<' || c === '>') && s[this.i + 1] === '(')) break;
        const mot = this.lireMot();
        if (!cmd.mots.length && this.affectation(cmd, mot)) {
          elements.push(mot);
          continue;
        }
        cmd.mots.push(mot);
        elements.push(mot);
      }
    } finally {
      this.cmd = cmdAvant;
      this.mot = motAvant;
    }
    if (!elements.length) this.echec('commande attendue');
    this.lu.commandes.push(cmd);
    this.lu.elements.push(elements);
    this.relire(cmd);
    return { simple: cmd, heredocs: cmd.heredocs };
  }

  /** Une affectation de tête (`X=1`, `X+=y`, `a[1]=x`, `a=(x y)`) : vrai si `mot` en est une, alors rangée dans `cmd`. */
  affectation(cmd, mot) {
    const b = mot.brut;
    if (!debutDeNom(b[0])) return false;
    let j = 1;
    while (j < b.length && suiteDeNom(b[j])) j++;
    const nom = b.slice(0, j);
    if (b[j] === '[') {
      const f = b.indexOf(']', j);
      if (f < 0) return false;
      j = f + 1;
    }
    if (b[j] === '+') j++;
    if (b[j] !== '=') return false;
    cmd.affectations.push({ nom, mot });
    if (j === b.length - 1 && this.src[this.i] === '(') {
      // Un tableau : `a=(x "y z" $(cmd))`, des mots, aucune commande. Ses valeurs se relisent comme une commande
      // (`a=(git push -f); "${a[@]}"` lance `git push -f`) : `lire` les donne à tous les décideurs.
      const valeurs = [];
      this.i++;
      for (;;) {
        this.sauterLignes();
        if (this.i >= this.src.length) this.echec('tableau non fermé');
        if (this.src[this.i] === ')') {
          this.i++;
          break;
        }
        const valeur = this.lireMot();
        if (!valeur) this.echec('tableau illisible');
        valeurs.push(valeur);
      }
      if (valeurs.length) cmd.tableaux.push(valeurs);
    }
    return true;
  }

  /** Les arguments d'`eval` et la chaîne `-c` d'un shell, relus comme une source. */
  relire(cmd) {
    const { mots } = cmd;
    let e = -1;
    for (let j = 0; j < mots.length && e < 0; j++) if (!mots[j].expansion && nomDeBase(mots[j].valeur) === 'eval') e = j;
    if (e >= 0 && e < mots.length - 1)
      this.sousSource(
        mots
          .slice(e + 1)
          .map((m) => m.texte)
          .join(' '),
        'eval',
        mots[e + 1],
      );
    for (let s = 0; s < mots.length; s++) {
      if (!estShell(mots[s])) continue;
      const k = indexDeLaChaineC(mots, s);
      if (k >= 0) this.sousSource(mots[k].texte, '-c', mots[k]);
    }
  }

  sousSource(texte, origine, mot, exact = false) {
    this.plonger(() => new Lecteur(texte, this.lu, { profondeur: this.profondeur, origine, base: this.pos(mot.debut), exact }).lireSource());
  }

  /** Une redirection en `i` (descripteur, opérateur, cible), ou `null` sans rien consommer. */
  redirection(cmd) {
    const s = this.src;
    const debut = this.i;
    let k = this.i;
    let descripteur = null;
    if (chiffre(s[k])) {
      while (chiffre(s[k])) k++;
      if (s[k] !== '<' && s[k] !== '>') return null;
      descripteur = s.slice(debut, k);
    } else if (s[k] === '{') {
      const f = s.indexOf('}', k);
      if (f < 0 || f - k > 64 || (s[f + 1] !== '<' && s[f + 1] !== '>') || !debutDeNom(s[k + 1])) return null;
      for (let j = k + 1; j < f; j++) if (!suiteDeNom(s[j])) return null;
      descripteur = s.slice(k, f + 1);
      k = f + 1;
    }
    const a = s[k];
    const b = s[k + 1];
    const c = s[k + 2];
    let operateur;
    if (a === '<') {
      if (b === '(') return null;
      operateur = b === '<' ? (c === '<' ? '<<<' : c === '-' ? '<<-' : '<<') : b === '>' ? '<>' : b === '&' ? '<&' : '<';
    } else if (a === '>') {
      if (b === '(') return null;
      operateur = b === '>' ? '>>' : b === '|' ? '>|' : b === '&' ? '>&' : '>';
    } else if (a === '&' && descripteur === null && b === '>') operateur = c === '>' ? '&>>' : '&>';
    else return null;
    const debutOperateur = k;
    this.i = k + operateur.length;
    this.blancs();
    const cible = this.lireMot();
    if (!cible) this.echec(operateur.startsWith('<<') ? 'here-doc sans délimiteur' : 'redirection sans cible');
    if (operateur === '<<' || operateur === '<<-') {
      const delimiteur = retirerCitations(cible.brut);
      if (delimiteur.includes('\n')) this.echec('délimiteur de here-doc sur plusieurs lignes');
      const quote = cible.brut.includes("'") || cible.brut.includes('"') || cible.brut.includes('\\');
      const h = { operateur, delimiteur, quote, corps: null, lecture: null, commande: cmd, pileSubst: this.pileSubst.length ? this.pileSubst.slice() : VIDE, pipeline: null, index: 0, profondeur: this.profondeur, racine: this.racine, debut: this.pos(debutOperateur) };
      this.remplacer(debutOperateur, this.i, '<<heredoc');
      this.attente.push(h);
      this.lu.heredocs.push(h);
      return { heredoc: h };
    }
    if (operateur === '<<<') {
      const h = { operateur, delimiteur: null, quote: cible.cite, corps: cible.valeur, contenu: cible, lecture: null, commande: cmd, pileSubst: this.pileSubst.length ? this.pileSubst.slice() : VIDE, pipeline: null, index: 0, profondeur: this.profondeur, racine: false, debut: this.pos(debutOperateur) };
      this.lu.heredocs.push(h);
      return { heredoc: h };
    }
    return { redirection: { operateur, descripteur, cible } };
  }

  /** Les corps des here-docs en attente, le saut de ligne de leur ligne d'ouverture lu. */
  lireCorps() {
    const s = this.src;
    const attente = this.attente;
    this.attente = [];
    for (const h of attente) {
      const debut = this.i;
      for (;;) {
        if (this.i >= s.length) this.echec('here-doc non fermé');
        // La ligne logique : dans un corps non quoté, bash recolle une ligne qui finit par un nombre impair de
        // barres obliques inverses à la suivante (la barre et le saut de ligne retirés), puis compare le tout au
        // délimiteur, tabulations de tête retirées pour `<<-` : `\` puis `EOF`, `E\` puis `OF`, `EOF\` puis une
        // ligne vide ferment le here-doc.
        const ligne = this.i;
        let logique = '';
        let j;
        for (;;) {
          j = s.indexOf('\n', this.i);
          const fin = j < 0 ? s.length : j;
          let n = 0;
          if (!h.quote) for (let x = fin - 1; x >= this.i && s[x] === '\\'; x--) n++;
          if (n % 2 === 1 && j >= 0) {
            logique += s.slice(this.i, fin - 1);
            this.i = j + 1;
            continue;
          }
          logique += s.slice(this.i, fin);
          break;
        }
        const fin = j < 0 ? s.length : j;
        let k = 0;
        if (h.operateur === '<<-') while (logique[k] === '\t') k++;
        if (logique.length - k === h.delimiteur.length && logique.startsWith(h.delimiteur, k)) {
          h.corps = s.slice(debut, ligne);
          h.debutCorps = this.pos(debut);
          this.i = j < 0 ? s.length : j + 1;
          h.finCorps = this.pos(this.i);
          this.remplacer(debut - 1, fin, '');
          break;
        }
        this.i = j < 0 ? s.length : j + 1;
      }
      if (h.operateur === '<<-') h.corps = h.corps.replace(/^\t+/gm, '');
      // Un corps non quoté : bash y développe `$(…)`, les accents graves et `${…}`, quel que soit le consommateur.
      if (!h.quote)
        this.plonger(() => new Lecteur(h.corps, this.lu, { profondeur: this.profondeur, origine: 'corps', base: h.debutCorps, exact: h.operateur !== '<<-' }).expansions());
    }
  }

  /** Les expansions d'un texte lu comme un corps non quoté : seuls `\`, `$` et l'accent grave y sont spéciaux. */
  expansions() {
    const s = this.src;
    while (this.i < s.length) {
      const c = s[this.i];
      if (c === '\\') this.i += 2;
      else if (c === '$') this.dollar(MUET, true);
      else if (c === '`') this.accentsGraves(false);
      else this.i++;
    }
  }

  /**
   * La fin d'une expansion arithmétique dont le contenu commence en `p` (après `$((` ou `((`) : l'index du
   * premier `)` de `))`, ou -1 si les parenthèses ne se ferment pas ainsi (c'est alors une substitution ou un
   * sous-shell). Les citations y sont sautées comme bash le fait pour trouver la fin.
   */
  finArithmetique(p) {
    const s = this.src;
    let d = 0;
    for (let k = p; k < s.length; k++) {
      if (--this.lu.budget < 0) this.echec('commande trop coûteuse à lire');
      const c = s[k];
      if (c === '\\') k++;
      else if (c === "'") {
        const j = s.indexOf("'", k + 1);
        if (j < 0) return -1;
        this.lu.budget -= j - k;
        k = j;
      } else if (c === '"') {
        for (k++; k < s.length && s[k] !== '"'; k++) {
          this.lu.budget--;
          if (s[k] === '\\') k++;
        }
        if (k >= s.length) return -1;
      } else if (c === '(') d++;
      else if (c === ')') {
        if (d > 0) d--;
        else return s[k + 1] === ')' ? k : -1;
      }
    }
    return -1;
  }

  /** Le contenu d'une expansion arithmétique, `[debut, fin)` : ses substitutions se lisent, comme dans un texte entre guillemets. */
  arithmetique(debut, fin) {
    const sauve = this.i;
    const s = this.src;
    this.i = debut;
    while (this.i < fin) {
      const c = s[this.i];
      if (c === '\\') this.i += 2;
      else if (c === '$') this.dollar(MUET, true);
      else if (c === '`') this.accentsGraves(false);
      else this.i++;
    }
    if (this.i !== fin) this.echec('expansion arithmétique illisible');
    this.i = sauve;
  }

  /** Un `$` en `i` : substitution, arithmétique, `${…}`, paramètre, ou `$` littéral. */
  dollar(b, cite) {
    const s = this.src;
    const n = s[this.i + 1];
    if (n === '(') {
      if (s[this.i + 2] === '(') {
        const fin = this.finArithmetique(this.i + 3);
        if (fin >= 0) {
          this.plonger(() => this.arithmetique(this.i + 3, fin));
          this.i = fin + 2;
          b.exp(undefined, cite);
          return;
        }
      }
      this.i += 2;
      this.substitution();
      b.exp(undefined, cite);
    } else if (n === '{') {
      const debut = this.i;
      this.i += 2;
      this.plonger(() => this.accolade());
      b.exp(s.slice(debut, this.i), cite);
    } else if (debutDeNom(n ?? '')) {
      const debut = this.i;
      this.i += 2;
      while (suiteDeNom(s[this.i] ?? '')) this.i++;
      b.exp(s.slice(debut, this.i), cite);
    } else if (n !== undefined && '0123456789@*#?$!-'.includes(n)) {
      this.i += 2;
      b.exp(s.slice(this.i - 2, this.i), cite);
    } else {
      b.lit('$', cite);
      this.i++;
    }
  }

  /** `$(` lu : la liste jusqu'à son `)`, avec ses propres here-docs. */
  substitution() {
    this.plonger(() => {
      const [attente, dehors, cmd, mot, origine] = [this.attente, this.dehors, this.cmd, this.mot, this.origine];
      this.pileSubst.push({ mot, commande: cmd });
      this.dehors = dehors || attente.length > 0;
      this.attente = [];
      this.origine = 'substitution';
      try {
        if (this.lireListe(new Set()) !== ')') this.echec('substitution non fermée');
        if (this.attente.length) this.echec('here-doc non fermé dans une substitution');
        this.i++;
      } finally {
        [this.attente, this.dehors, this.cmd, this.mot, this.origine] = [attente, dehors, cmd, mot, origine];
        this.pileSubst.pop();
      }
    });
  }

  /** `${` lu : jusqu'à son `}`, citations, substitutions et `${…}` imbriqués compris. */
  accolade() {
    const s = this.src;
    for (;;) {
      if (this.i >= s.length) this.echec('expansion ${…} non fermée');
      const c = s[this.i];
      if (c === '}') {
        this.i++;
        return;
      }
      if (c === '\\') this.i += 2;
      else if (c === "'") {
        const j = s.indexOf("'", this.i + 1);
        if (j < 0) this.echec('guillemet non fermé');
        // Entre guillemets doubles, bash garde ces apostrophes littérales : leurs substitutions s'y développent.
        const texte = s.slice(this.i + 1, j);
        if (texte.includes('$') || texte.includes('`')) this.plonger(() => new Lecteur(texte, this.lu, { profondeur: this.profondeur, origine: this.origine, base: this.pos(this.i + 1), exact: this.exact }).expansions());
        this.i = j + 1;
      } else if (c === '"') this.doubleGuillemets(MUET);
      else if (c === '$') this.dollar(MUET, true);
      else if (c === '`') this.accentsGraves(false);
      else this.i++;
    }
  }

  /** Un texte entre guillemets doubles, en `i`. */
  doubleGuillemets(b) {
    const s = this.src;
    const debut = this.i;
    this.i++;
    b.lit('', true);
    for (;;) {
      if (this.i >= s.length) this.echec('guillemet non fermé');
      const c = s[this.i];
      if (c === '"') {
        this.i++;
        break;
      }
      if (c === '\\') {
        const n = s[this.i + 1];
        if (n === '\n') this.i += 2;
        else if (n === '$' || n === '`' || n === '"' || n === '\\') {
          b.lit(n, true);
          this.i += 2;
        } else {
          b.lit('\\', true);
          this.i++;
        }
      } else if (c === '$') this.dollar(b, true);
      else if (c === '`') {
        this.accentsGraves(true);
        b.exp(undefined, true);
      } else {
        b.lit(c, true);
        this.i++;
      }
    }
    this.remplacer(debut, this.i, '""');
  }

  /** Une substitution entre accents graves, en `i` : son contenu, échappements retirés, se lit comme une source. */
  accentsGraves(entreGuillemets) {
    const s = this.src;
    const debut = this.i;
    let contenu = '';
    for (this.i++; ; ) {
      if (this.i >= s.length) this.echec('substitution non fermée');
      const c = s[this.i];
      if (c === '`') {
        this.i++;
        break;
      }
      const n = s[this.i + 1];
      if (c === '\\' && (n === '$' || n === '`' || n === '\\' || (entreGuillemets && n === '"'))) {
        contenu += n;
        this.i += 2;
      } else {
        contenu += c;
        this.i++;
      }
    }
    if ((this.dehors || this.attente.length) && contenu.includes('\n')) this.echec('saut de ligne dans une substitution alors qu’un here-doc attend son corps');
    const pileSubst = [...this.pileSubst, { mot: this.mot, commande: this.cmd }];
    this.plonger(() => new Lecteur(contenu, this.lu, { profondeur: this.profondeur, origine: 'substitution', base: this.pos(debut), exact: false, pileSubst }).lireSource());
  }

  /**
   * Un mot de bash en `i`, jusqu'au premier métacaractère hors citation : `{ valeur, expansion, brut, cite }`
   * (et, pour les lectures, `texte`, `blancCite`, `queue`, `debut`), ou `null` si aucun mot ne commence là.
   */
  lireMot() {
    const s = this.src;
    const debut = this.i;
    const mot = { valeur: '', expansion: false, brut: '', cite: false, texte: '', blancCite: false, queue: null, litteral: false, debut, prefixe: null, nonCitee: false, nu: '' };
    const precedent = this.mot;
    const apresAvant = this.apresExpansion;
    this.mot = mot;
    this.apresExpansion = false;
    const b = this;
    try {
      while (this.i < s.length) {
        const c = s[this.i];
        const n = s[this.i + 1];
        if (c === '<' || c === '>') {
          if (n !== '(') break;
          this.i += 2;
          this.substitution();
          // Une substitution de processus rend un seul chemin (`/dev/fd/63`) : bash ne la découpe pas.
          b.exp(undefined, true);
        } else if (metacaractere(c)) break;
        else if (c === '\\') {
          if (n === '\n') this.i += 2;
          else if (n === undefined) {
            b.lit('\\', false);
            this.i++;
          } else {
            b.lit(n, true);
            this.i += 2;
          }
        } else if (c === "'") {
          const j = s.indexOf("'", this.i + 1);
          if (j < 0) this.echec('guillemet non fermé');
          b.lit(s.slice(this.i + 1, j), true);
          this.remplacer(this.i, j + 1, "''");
          this.i = j + 1;
        } else if (c === '"') this.doubleGuillemets(b);
        else if (c === '$' && n === "'") {
          const d = this.i;
          let v = '';
          for (this.i += 2; ; ) {
            if (this.i >= s.length) this.echec('guillemet non fermé');
            if (s[this.i] === "'") break;
            if (s[this.i] === '\\') {
              const [e, j] = echappementC(s, this.i);
              v += e;
              this.i = j;
            } else v += s[this.i++];
          }
          this.i++;
          b.lit(v, true);
          this.remplacer(d + 1, this.i, "''");
        } else if (c === '$' && n === '"') {
          this.i++;
          this.doubleGuillemets(b);
        } else if (c === '$') this.dollar(b, false);
        else if (c === '`') {
          this.accentsGraves(false);
          b.exp();
        } else {
          let j = this.i + 1;
          while (j < s.length && ordinaire(s[j])) j++;
          b.lit(s.slice(this.i, j), false);
          this.i = j;
        }
      }
    } finally {
      this.mot = precedent;
      this.apresExpansion = apresAvant;
    }
    if (this.i === debut) return null;
    mot.brut = s.slice(debut, this.i);
    mot.debut = debut;
    if (mot.expansion) mot.valeur = SUBSTITUTION;
    return mot;
  }
}

/**
 * La lecture d'un corps de here-doc (décision 4 du ticket 33) :
 * - `commandes` s'il atteint un shell : consommateur ou commande suivante du pipeline qui porte un shell, `source`
 *   ou `eval`, ou substitution qui le contient donnée à l'un d'eux (`eval "$(cat <<'EOF' …)"`, `sh -c "$(…)"`) ;
 * - `retire` si son consommateur et les commandes qui le suivent dans le pipeline sont inertes, si chaque
 *   substitution qui le contient est un argument d'une commande inerte (ou une affectation), et si aucun
 *   exécuteur ne figure dans la commande entière ;
 * - `prudence` sinon : consommateur inconnu (`python3 -`, `exec cat`), commande composée, exécuteur présent.
 * Un here-string (`<<<`) se lit `commandes` s'il va à un shell, `texte` sinon.
 */
function lectureDuCorps(h, { executeur, unShell }) {
  if (h.operateur === '<<<') return versUnShell(h.commande) ? 'commandes' : 'texte';
  const segments = h.pipeline ?? [{ simple: h.commande, heredocs: [h] }];
  const consommateur = segments[h.index].simple;
  const suivants = h.index + 1 < segments.length ? segments.slice(h.index + 1) : VIDE;
  const contextes = h.pileSubst;
  if (versUnShell(consommateur) || suivants.some((n) => versUnShell(n.simple)) || (contextes.length && contextes.some(({ commande, mot }) => commande && donneAUnShell(commande, mot)))) return 'commandes';
  if (!consommateur) return unShell() ? 'commandes' : 'prudence';
  if (executeur || !inerte(consommateur)) return 'prudence';
  if (suivants.length && suivants.some((n) => !n.simple || !inerte(n.simple))) return 'prudence';
  const contexteInerte = ({ commande, mot }) => Boolean(commande) && (commande.affectations.some((a) => a.mot === mot) || inerte(commande));
  if (contextes.length && !contextes.every(contexteInerte)) return 'prudence';
  return 'retire';
}

/**
 * Une lecture d'une commande simple, pour les décideurs de `git push`, de `gh` et des appels de git : ses mots,
 * son texte, le `debut` de la commande simple qu'elle relit, et `suite()`, le source à partir de cette commande.
 * `appariable` : faux pour une lecture qui ne relit pas les mots d'une commande simple (valeurs d'un tableau,
 * corps relu par prudence, commande illisible), jamais appariée à une commande (`appelsGit`). `exacte` : la
 * lecture L1, les mots mêmes de la commande simple.
 */
class Lecture {
  constructor(mots, segment, source, debut, { appariable = true, exacte = false } = {}) {
    this.mots = mots;
    this.segment = segment;
    this.source = source;
    this.debut = debut;
    this.appariable = appariable;
    this.exacte = exacte;
  }

  suite() {
    return this.source.suite(this.debut);
  }
}

/** Le nom d'un mot qui n'est qu'un paramètre (`$X`, `${X}`, `"$X"`), ou `null`. */
function parametreSeul(brut) {
  let b = brut;
  if (b.length > 2 && b[0] === '"' && b[b.length - 1] === '"') b = b.slice(1, -1);
  if (b[0] !== '$') return null;
  b = b.startsWith('${') && b.endsWith('}') ? b.slice(2, -1) : b.slice(1);
  if (!b || !debutDeNom(b[0])) return null;
  for (const c of b) if (!suiteDeNom(c)) return null;
  return b;
}

/** Ce que `lireCommande` rend pour une commande qu'elle ne sait pas lire : la raison, et une lecture éclatée du texte brut. */
function lectureIllisible(commande, motif) {
  const eclate = eclater(commande);
  return Object.freeze({
    illisible: motif,
    commandes: Object.freeze([]),
    heredocs: Object.freeze([]),
    prudences: Object.freeze([]),
    textes: Object.freeze(eclate.map(({ mots }) => mots)),
    cites: Object.freeze([]),
    lectures: Object.freeze(eclate.map(({ segment, mots }) => new Lecture(mots, segment, { suite: () => commande }, 0, { appariable: false }))),
    segments: Object.freeze(eclate.map(({ segment }) => Object.freeze({ segment, suite: commande }))),
    sansTexte: commande,
  });
}

/**
 * Lit une commande shell comme bash, de gauche à droite, en un passage (ticket 33) : mots (`'…'`, `"…"`,
 * `$'…'`, `$"…"`, `\x`, `\⏎`), expansions (`$x`, `${…}`, `$(…)`, accents graves, `$((…))`, `<(…)`, `>(…)`),
 * opérateurs (`;`, `&`, `&&`, `||`, `|`, `|&`, saut de ligne, `;;`, `;&`, `;;&`), groupes, sous-shells, mots
 * réservés et commandes composées, définitions de fonction, affectations de tête, redirections, here-docs
 * (`<<`, `<<-` : délimiteur quoté si une partie l'est, terminateur seul sur sa ligne, tabulations de tête
 * retirées pour `<<-`, plusieurs par ligne dans l'ordre) et here-strings, commentaires. Elle lit les commandes
 * partout où bash en exécute : en tête, dans les substitutions, sous-shells, groupes et commandes composées,
 * dans un corps de here-doc donné à un shell (`lectureDuCorps`), dans la chaîne `-c` d'un shell et dans les
 * arguments d'`eval`, relus comme une source.
 *
 * Ce qu'elle ne sait pas lire, elle ne le devine pas : `illisible` porte le motif (here-doc non fermé, ou fermé
 * seulement en fin de substitution ; guillemet, substitution, expansion ou groupe non fermés ; opérateur là où
 * bash veut une commande ; syntaxe qu'elle ne couvre pas ; imbrication au-delà de `PROFONDEUR_MAX`).
 *
 * @param {string} commande la commande telle que l'outil Bash la reçoit
 * @returns {{
 *   illisible: string | null,
 *   commandes: readonly {
 *     affectations: { nom: string, mot: Mot }[],
 *     mots: Mot[],
 *     redirections: { operateur: string, descripteur: string | null, cible: Mot }[],
 *     heredocs: { operateur: '<<' | '<<-' | '<<<', delimiteur: string | null, quote: boolean, corps: string, lecture: 'retire' | 'commandes' | 'prudence' | 'texte' }[],
 *     origine: 'tete' | 'substitution' | 'sous-shell' | 'corps' | '-c' | 'eval',
 *     debut: number,
 *     profondeur: number,
 *   }[],
 *   heredocs: readonly { operateur: string, delimiteur: string | null, quote: boolean, corps: string, lecture: string }[],
 *   prudences: readonly { texte: string, segments: { segment: string, mots: string[] }[] }[],
 *   textes: readonly string[][],
 *   cites: readonly string[][],
 *   lectures: readonly { mots: string[], segment: string, debut: number, appariable: boolean, exacte: boolean, suite(): string }[],
 *   segments: readonly { segment: string, suite: string }[],
 *   sansTexte: string,
 * }}
 * - `commandes` : les commandes simples, dans l'ordre du source ; `debut`, leur position dans la commande
 *   (celle du mot ou du corps qui les porte, pour un accent grave, un `-c`, un `eval` ou un corps `<<-`). Un
 *   `Mot` : `{ valeur, expansion, brut, cite, prefixe, nonCitee, nu }` — `valeur` sans guillemets,
 *   `$SUBSTITUTION` s'il porte une expansion ; `brut`, son texte dans la source ; `cite`, s'il a une partie citée ;
 *   `prefixe`, le texte littéral avant sa première expansion (`user.name=` pour `user.name="$n"`) ; `nonCitee`,
 *   s'il porte une expansion hors de guillemets doubles (bash la découpe en mots) ; `nu`, ses parties littérales
 *   non citées (où bash lit un motif ou des accolades). Un here-string porte son mot en `contenu`.
 * - `heredocs` : tous les here-docs et here-strings, ceux d'une commande composée (`{ …; } <<EOF`, `done <<EOF`)
 *   compris, dans l'ordre de lecture, chacun avec sa lecture retenue.
 * - `prudences` : les corps relus par prudence, guillemets et barres obliques inverses retirés, accents graves lus
 *   comme des `;` ; chacun de leurs segments passe par tous les décideurs, comme un `textes` et une `lectures`.
 * - `textes` (L3) : les mots de chaque commande simple, mots réservés retirés, affectations gardées, un mot dont
 *   une partie citée porte un blanc ou un séparateur lu `""`, un mot à expansion lu par son texte (paramètres
 *   gardés, substitutions en `$SUBSTITUTION`) ; c'est ce que lisent `COMMANDES_INTERDITES` et
 *   les ajouts de dépendances. Les valeurs d'un tableau (`a=(git push -f)`) s'y lisent comme une commande.
 * - `cites` : les segments de L2 (et de L2 dénudée) qui commencent dans un texte cité, après un séparateur qu'il
 *   porte : `COMMANDES_INTERDITES` et les dépendances les lisent en plus de `textes`.
 * - `lectures` (L1 et L2) : ce que lisent les décideurs de `git push` et de `gh` — les mots de chaque commande
 *   simple (L1), sa lecture éclatée (L2 : valeurs jointes, recoupées sur les blancs et les séparateurs, puis
 *   relues dénudées, sans guillemets ni barres obliques inverses, accents graves coupant le segment), le
 *   texte qui suit chaque mot à expansion relu comme un début de commande (son premier segment, en temps
 *   linéaire), les valeurs des tableaux, et les corps relus par prudence ; `debut`, celui de la commande simple
 *   relue ; `appariable`, faux pour les valeurs d'un tableau et les corps relus par prudence (ils ne relisent
 *   pas les mots d'une commande simple) ; `exacte`, vrai pour L1 ;
 *   `suite()`, le source à partir de la commande, corps retirés exclus, commentaires compris.
 * - `segments` : le rendu de L2 seul (`segmentsDeCommande`), substitutions d'abord.
 * - `sansTexte` : la commande, textes cités vidés et corps de here-doc retirés (`sansTexte`).
 */
export function lireCommande(commande) {
  if (derniereLecture.commande === commande) return derniereLecture.lecture;
  const lecture = lire(String(commande));
  derniereLecture = { commande, lecture };
  return lecture;
}

/** La dernière lecture : `decisionCommande` et ses décideurs lisent la même commande plusieurs fois. */
let derniereLecture = { commande: null, lecture: null };

function lire(commande, avecRemplacements = false) {
  const lu = { commandes: [], heredocs: [], elements: [], fonctions: false, remplacements: avecRemplacements ? [] : null, budget: 16 * commande.length + 4096 };
  const prudences = [];
  try {
    new Lecteur(commande, lu, { racine: true }).lireSource();
    const corps = lu.heredocs.length > 0;
    const executeur = corps && (lu.fonctions || lu.commandes.some(aUnExecuteur));
    let shell;
    const unShell = () => (shell ??= lu.commandes.some(versUnShell));
    for (let n = 0; n < lu.heredocs.length; n++) {
      const h = lu.heredocs[n];
      h.lecture = lectureDuCorps(h, { executeur, unShell });
      if (h.lecture === 'commandes') {
        const texte = h.operateur === '<<<' ? h.contenu.texte : h.corps;
        if (h.profondeur + 1 > PROFONDEUR_MAX) throw new Illisible('imbrication trop profonde');
        new Lecteur(texte, lu, { profondeur: h.profondeur + 1, origine: 'corps', base: h.debutCorps ?? h.debut, exact: false }).lireSource();
      } else if (h.lecture === 'prudence') {
        const texte = denuder(h.corps);
        prudences.push({ texte, segments: eclater(texte) });
      }
    }
  } catch (e) {
    // Une erreur du lecteur lui-même ne casse pas la garde : la commande est illisible, donc refusée.
    return lectureIllisible(commande, e instanceof Illisible ? e.motif : 'erreur du lecteur');
  }
  const commandes = [...lu.commandes].sort((a, b) => a.debut - b.debut);
  // Le source sans les corps retirés, pour `suite` : calculé au premier besoin.
  const retires = lu.heredocs.filter((h) => h.lecture === 'retire' && h.racine).map((h) => [h.debutCorps, h.finCorps]);
  let sansCorps = null;
  const tete = { suite: (debut) => suiteDe(debut) };
  const suiteDe = (debut) => {
    if (sansCorps === null) {
      sansCorps = { texte: '', decalages: [] };
      let fin = 0;
      for (const [a, b] of retires) {
        sansCorps.texte += commande.slice(fin, a);
        sansCorps.decalages.push([a, b]);
        fin = b;
      }
      sansCorps.texte += commande.slice(fin);
    }
    let d = debut;
    for (const [a, b] of sansCorps.decalages) if (debut >= b) d -= b - a;
    return sansCorps.texte.slice(Math.max(0, d));
  };
  const textes = [];
  const lectures = [];
  const cites = [];
  // Les valeurs littérales affectées dans la commande (`F=--force; git push $F …`, `export X=…`), où qu'elles soient.
  const connues = new Map();
  for (const cmd of lu.commandes) {
    const exportees = cmd.mots.length && ['export', 'readonly', 'declare', 'typeset', 'local'].includes(cmd.mots[0].valeur) ? cmd.mots.slice(1) : [];
    for (const m of [...cmd.affectations.map((a) => a.mot), ...exportees]) {
      const egal = m.valeur.indexOf('=');
      if (m.expansion || egal < 1) continue;
      const nom = m.valeur.slice(0, m.valeur[egal - 1] === '+' ? egal - 1 : egal);
      const valeurs = connues.get(nom);
      if (valeurs) valeurs.push(m.valeur.slice(egal + 1));
      else connues.set(nom, [m.valeur.slice(egal + 1)]);
    }
  }
  // Les relectures (après un mot à expansion) ont un budget linéaire : au-delà, la commande est illisible.
  let budget = 16 * commande.length + 4096;
  // Les décideurs de `git push` et de `gh` ne lisent qu'un segment qui nomme git ou gh : sans « g », rien à lire.
  const lireMots = (m, debut, options) => {
    const s = m.join(' ');
    if (s.includes('g') || s.includes('G')) lectures.push(new Lecture(m, s, tete, debut, options));
  };
  /** Les mots d'une commande simple (ou les valeurs d'un tableau, `appariable` faux), en L1, L2 et L3. */
  const lireElements = (elements, debut, appariable = true) => {
    const mots = [];
    const l3 = [];
    const l1 = [];
    let simple = true;
    let expansion = false;
    let aDenuder = false;
    for (const e of elements) {
      if (typeof e === 'string') {
        simple = false;
        continue;
      }
      mots.push(e);
      l1.push(e.valeur);
      l3.push(e.blancCite ? '""' : e.expansion ? e.texte : e.valeur);
      if (e.expansion) expansion = true;
      if (simple && aUnSeparateur(e.texte)) simple = false;
      if (!aDenuder && aDenuderDans(e.texte)) aDenuder = true;
    }
    textes.push(l3);
    lireMots(l1, debut, { appariable, exacte: appariable });
    // La commande telle que bash la lance si ses expansions sont vides (`git $X push -f`), ou valent ce que la
    // commande leur a affecté (`X=--no-verify; git commit $X`) : des lectures en plus, jamais à la place.
    if (expansion) {
      const variantes = [];
      if (mots.some((m) => m.expansion && !m.litteral)) variantes.push(mots.filter((m) => !m.expansion || m.litteral));
      for (const m of mots) {
        if (variantes.length >= 16) break;
        const nom = m.expansion ? parametreSeul(m.brut) : null;
        for (const v of (nom && connues.get(nom)) || VIDE) {
          if (variantes.length >= 16) break;
          const valeurs = m.brut.startsWith('"') ? [v] : eclater(v).flatMap((x) => x.mots);
          variantes.push(mots.flatMap((x) => (x === m ? valeurs : [x])));
        }
      }
      for (const variante of variantes) {
        textes.push(variante.map((x) => (typeof x === 'string' ? (aUnSeparateur(x) ? '""' : x) : x.blancCite ? '""' : x.expansion ? x.texte : x.valeur)));
        lireMots(
          variante.map((x) => (typeof x === 'string' ? x : x.valeur)),
          debut,
          { appariable },
        );
      }
    }
    // Sans blanc, séparateur, guillemet, barre oblique inverse ni accent grave dans ses textes, la lecture éclatée
    // est celle des mots : elle n'est pas refaite.
    if (simple && !expansion && !aDenuder) return;
    const textesDesElements = elements.map((e) => (typeof e === 'string' ? e : e.texte));
    // L2, et L2 dénudée : les guillemets, barres obliques inverses et accents graves que les valeurs portent
    // encore (`ruby -e '\`gh pr merge 1\`'`, `trap '\\git push -f' EXIT`, `perl -e 'system "git push -f"'`) sont
    // retirés, comme 7.9.x les retirait ; un accent grave y coupe le segment.
    const eclaterDeuxFois = (texte, f) => {
      eclater(texte).forEach(({ segment: s, mots: m }, rang) => f(s, m, rang));
      const nu = denuder(texte);
      if (nu !== texte) eclater(nu).forEach(({ segment: s, mots: m }, rang) => f(s, m, rang));
    };
    eclaterDeuxFois(textesDesElements.join(' '), (s, m, rang) => {
      if (m.length !== l1.length || m.some((x, k) => x !== l1[k])) lectures.push(new Lecture(m, s, tete, debut, { appariable }));
      // Un segment qui commence dans un texte cité (après un séparateur qu'il porte) est une commande qu'un
      // interprète peut lancer (`python3 -c 'os.system("git commit --no-verify")'`, `eval '…'` imbriqués) :
      // `COMMANDES_INTERDITES` et les dépendances le lisent aussi. Le premier segment est la commande elle-même,
      // déjà lue en L3 : un message de commit qui cite `--no-verify` passe.
      if (rang > 0) cites.push(m);
    });
    // Ce qui suit un mot à expansion se relit comme un début de commande : `sudo -u git $(true) git push …`.
    // Seul le premier segment de cette relecture est neuf (les suivants sont ceux de la lecture entière), et une
    // relecture qui ne voit ni « g » ni séparateur avant le mot à expansion suivant lit le même programme que
    // celle-ci, avec moins de mots : elle n'est pas faite. Le temps reste linéaire.
    let ouverte = false;
    for (let k = 0; k < elements.length; k++) {
      const e = elements[k];
      const t = textesDesElements[k];
      if (typeof e === 'string' || !e.expansion) {
        if (ouverte && (t.includes('g') || t.includes('G') || aUnSeparateurDeSegment(t))) ouverte = false;
        continue;
      }
      if (ouverte && !t.includes('g') && !t.includes('G') && !aUnSeparateurDeSegment(t)) continue;
      ouverte = !e.queue.includes('g') && !e.queue.includes('G') && !aUnSeparateurDeSegment(e.queue);
      let s = e.queue;
      const coupe = premierSeparateur(s);
      if (coupe >= 0) s = s.slice(0, coupe);
      else
        for (let j = k + 1; j < elements.length; j++) {
          const u = textesDesElements[j];
          if ((budget -= u.length + 1) < 0) return;
          const c = premierSeparateur(u);
          s += ' ' + (c < 0 ? u : u.slice(0, c));
          if (c >= 0) break;
        }
      if ((budget -= s.length + 1) < 0) return;
      eclaterDeuxFois(s, (seg, m) => lectures.push(new Lecture(m, seg, tete, debut, { appariable })));
    }
  };
  for (let n = 0; n < lu.commandes.length; n++) {
    const cmd = lu.commandes[n];
    lireElements(lu.elements[n], cmd.debut);
    // Les valeurs d'un tableau (`a=(git push -f)`) : `"${a[@]}"` les lance comme une commande.
    for (const valeurs of cmd.tableaux) lireElements(valeurs, cmd.debut, false);
    if (budget < 0) return lectureIllisible(commande, 'commande trop coûteuse à lire');
  }
  // Un corps relu par prudence passe par tous les décideurs : push et gh (L2), `COMMANDES_INTERDITES` et
  // dépendances (ses segments, lus comme les mots d'une commande).
  for (const { texte, segments: s } of prudences) {
    const source = { suite: () => texte };
    for (const { segment, mots } of s) {
      lectures.push(new Lecture(mots, segment, source, 0, { appariable: false }));
      textes.push(mots);
    }
  }
  // Le rendu de L2 (`segmentsDeCommande`) : les substitutions d'abord, des plus profondes aux moins profondes,
  // chacune dans l'ordre du source, puis les corps relus par prudence.
  const rendre = () => {
    const segments = [];
    lu.commandes.forEach((cmd, n) => {
      const texte = lu.elements[n].map((e) => (typeof e === 'string' ? e : e.texte)).join(' ');
      for (const { segment } of eclater(texte)) segments.push({ segment, profondeur: cmd.profondeur, debut: cmd.debut, n: segments.length, suite: () => suiteDe(cmd.debut) });
    });
    for (const { texte, segments: s } of prudences) for (const { segment } of s) segments.push({ segment, profondeur: -1, debut: Infinity, n: segments.length, suite: () => texte });
    segments.sort((a, b) => b.profondeur - a.profondeur || a.debut - b.debut || a.n - b.n);
    return Object.freeze(
      segments.map(({ segment, suite }) => {
        const r = { segment };
        Object.defineProperty(r, 'suite', { get: suite, enumerable: true });
        return Object.freeze(r);
      }),
    );
  };
  // `sansTexte` : les spans de citations et de here-docs de la source de tête, les plus extérieurs.
  const vider = () => {
    const spans = [...lu.remplacements].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    let texte = '';
    let fin = 0;
    for (const [a, b, t] of spans) {
      if (a < fin) continue;
      texte += commande.slice(fin, a) + t;
      fin = b;
    }
    return texte + commande.slice(fin);
  };
  let rendus = null;
  let vide = null;
  return Object.freeze({
    illisible: null,
    commandes: Object.freeze(commandes),
    heredocs: Object.freeze([...lu.heredocs]),
    prudences: Object.freeze(prudences),
    textes: Object.freeze(textes),
    cites: Object.freeze(cites),
    lectures: Object.freeze(lectures),
    get segments() {
      return (rendus ??= rendre());
    },
    get sansTexte() {
      // Les citations ne sont relevées qu'à la demande : `decisionCommande` n'en a pas besoin.
      return (vide ??= lu.remplacements ? vider() : lire(commande, true).sansTexte);
    },
  });
}

/** La commande sans son texte libre : corps de here-doc et textes cités vidés, lus par `lireCommande`. */
export function sansTexte(commande) {
  return lireCommande(commande).sansTexte;
}

/**
 * Les segments d'une commande shell en lecture L2 (`lireCommande`) : `{ segment, suite }`, où `suite` est le
 * source à partir de la commande du segment, corps de here-doc retirés exclus. Les substitutions viennent
 * d'abord, remplacées dans la commande englobante par `$SUBSTITUTION` : `git -C "$(pwd)" push origin
 * HEAD:sujet/x` se lit `pwd`, puis `git -C $SUBSTITUTION push origin HEAD:sujet/x`.
 * @param {string} commande la commande telle que l'outil Bash la reçoit
 * @returns {readonly { segment: string, suite: string }[]}
 */
export function segmentsDeCommande(commande) {
  return lireCommande(commande).segments;
}

/**
 * Options de `git` placées avant la sous-commande et suivies d'une valeur (`git -C .. push`). `--config-env`
 * en est (ticket 17) : sans lui, sa valeur était prise pour la sous-commande, et `git --config-env k=V push
 * origin HEAD:sujet/x` passait le refus des sujets.
 */
const OPTIONS_GIT_A_VALEUR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix', '--attr-source', '--config-env']);
/** Options de `git push` suivies d'une valeur séparée : cette valeur n'est ni le remote ni un refspec. */
const OPTIONS_PUSH_A_VALEUR = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);

/**
 * Index du programme d'un segment : le premier mot que `motif` reconnaît, hors affectation (`X=/a/git`),
 * option (`--chdir=/w/git`) et valeur d'option suivie du vrai programme (`env -C /w/git git …`,
 * `sudo -u git gh …`) ; un chemin qui contient `=` (`./a=b/git`) reste un programme ; -1 sinon.
 */
function indexDuProgramme(mots, motif) {
  // Le mot suivant ne compte que s'il pourrait être un programme : `git --work-tree=/x/git push` reste `git`.
  const candidat = (mot) => motif.test(mot) && !/^(-|[A-Za-z_]\w*=)/.test(mot);
  return mots.findIndex((mot, k) => candidat(mot) && !candidat(mots[k + 1] ?? ''));
}

/**
 * Les index où lire le programme d'un segment : celui d'`indexDuProgramme`, et le premier mot que `exact`
 * reconnaît (la lecture d'avant, à la casse exacte), pour que rien de ce qu'elle refusait ne passe.
 */
function lecturesDuProgramme(mots, motif, exact) {
  return [...new Set([indexDuProgramme(mots, motif), mots.findIndex((mot) => exact.test(mot))])].filter((i) => i >= 0);
}

/**
 * Chaque `git push` de la commande, `git` nu ou par son chemin (`/usr/bin/git`), avec ou sans options
 * (`git -C . push`, `git -c x=y push`), derrière n'importe quel préfixe (`timeout 5 git push`), dans
 * un sous-shell, une substitution, un corps de here-doc donné à un shell, une chaîne `-c` ou un `eval` : ses
 * refspecs, c'est-à-dire les positionnels après le remote (tous, si `--repo` porte le remote), et `tout` pour
 * `--all`, `--mirror` ou `--branches`. Il se lit sur les lectures L1 et L2 de `lireCommande` : `"HEAD:sujet/x"`
 * vise le même sujet que `HEAD:sujet/x`. Seul le premier `git` d'un segment compte : `git commit -m "… git
 * push …"` n'est pas un push.
 */
function pushs(commande) {
  if (derniersPushs.commande !== commande) derniersPushs = { commande, pushs: Object.freeze(lirePushs(lireCommande(commande).lectures)) };
  return derniersPushs.pushs;
}

/**
 * Les derniers `pushs` lus : `decisionCommande` les demande six fois pour la même commande (sujet, nom
 * illisible, branche gardée, push nu, force, illisible) ; la lecture n'est faite qu'une fois.
 */
let derniersPushs = { commande: null, pushs: [] };

/**
 * L'appel de git dont le programme est en `i` dans `mots` : ses options globales (`-C`, `-c`, `--git-dir`,
 * `--config-env`…), chacune avec sa valeur (le mot suivant pour une option de `OPTIONS_GIT_A_VALEUR`, quel
 * qu'il soit, opaque compris ; ce qui suit le `=` d'une forme collée ; `null` sinon), l'index `j` de la
 * sous-commande, la sous-commande en minuscules (`null` si elle manque ou porte `$` ou un accent grave), et
 * les arguments.
 * @param {readonly string[]} mots
 * @param {number} i
 */
function appelDeGit(mots, i) {
  const globales = [];
  let j = i + 1;
  while (j < mots.length && mots[j].startsWith('-')) {
    const option = mots[j];
    if (OPTIONS_GIT_A_VALEUR.has(option)) {
      globales.push({ option, valeur: mots[j + 1] ?? null });
      j += 2;
    } else {
      const egal = option.indexOf('=');
      globales.push(egal > 0 ? { option: option.slice(0, egal), valeur: option.slice(egal + 1) } : { option, valeur: null });
      j++;
    }
  }
  const mot = mots[j];
  const sous = mot === undefined || /[$`]/.test(mot) ? null : mot.toLowerCase();
  return { i, j, globales, sous, args: mots.slice(j + 1) };
}

/**
 * Chaque appel de git des lectures (`lireCommande(…).lectures`) : `{ globales, sous, args, i, j, lecture }`
 * (`appelDeGit`). Le programme se lit comme pour `pushs` : `git` nu ou par son chemin, derrière un préfixe, et
 * seul le premier `git` d'un segment compte (`git commit -m "… git config …"` n'est pas un `git config`).
 */
export function appelsGit(lectures) {
  return lectures.flatMap((lecture) =>
    !/git/i.test(lecture.segment) ? [] : [...lecturesDuProgramme(lecture.mots, /(^|[/$])git$/i, /(^|\/)git$/).map((i) => appelDeGit(lecture.mots, i)), ...appelsInternes(lecture.mots)].map((appel) => ({ ...appel, lecture })),
  );
}

/**
 * Les programmes internes de git (`/usr/lib/git-core/git-commit`, `"$(git --exec-path)/git-push"`, ou
 * `git-commit` quand ce dossier est dans le `PATH`) : git lui-même, sous-commande comprise, sans options
 * globales. Le premier mot du segment qui en nomme un compte.
 */
const PROGRAMME_INTERNE = /(^|\/)git-([a-z][a-z-]*)$/i;
/** Les préfixes qui prennent un positionnel avant le programme : la durée de `timeout`, la priorité de `chrt`. */
const PREFIXES_A_POSITIONNEL = new Set(['timeout', 'chrt']);
function appelsInternes(mots) {
  // Chaque mot qui en nomme un : une valeur d'option placée avant (`env -C /tmp/git-w …`) ne masque pas le vrai.
  return mots.flatMap((mot, k) =>
    PROGRAMME_INTERNE.test(mot) ? [{ i: k, j: k, globales: [], sous: PROGRAMME_INTERNE.exec(mot)[2].toLowerCase(), args: mots.slice(k + 1), interne: true }] : [],
  );
}

/** Les mots d'un appel interne (`git-commit -n`) relus comme `git commit -n`, pour `lireAppel`. */
const commeGit = (W, i, sous) => [...W.slice(0, i), motDuTexte('git'), { ...W[i], valeur: sous, vue: sous }, ...W.slice(i + 1)];

/** La lecture de `pushs`, sans mémoire, sur les mots des lectures. */
function lirePushs(lectures) {
  // Deux lectures du programme (`appelsGit`) : la prudente, et celle d'avant (premier `git` à la casse exacte),
  // pour que rien de ce qu'elle refusait ne passe (`sudo -u GIT -H git push …`).
  return appelsGit(lectures).flatMap(({ j, sous, lecture: { mots } }) => {
      if (sous !== 'push') return [];
      const positionnels = [];
      let tout = false;
      let remoteEnOption = false;
      let force = false;
      let illisible = false;
      for (let k = j + 1; k < mots.length; k++) {
        const mot = mots[k];
        if (/[$`]/.test(mot)) illisible = true;
        if (!mot.startsWith('-')) {
          positionnels.push(mot);
          continue;
        }
        if (/^--(all|mirror|branches)$/.test(mot)) tout = true;
        // Git accepte les abréviations non ambiguës (`--force-w`, `--force-wi`, `--force-i`) ; `--for…` les couvre
        // toutes, et refuse aussi `--forc`, que git rejette comme ambigu : prudence sans coût.
        if (/^(--for[a-z-]*(=.*)?|-[a-zA-Z]*f[a-zA-Z]*)$/.test(mot)) force = true;
        if (/^--repo(=|$)/.test(mot)) remoteEnOption = true;
        if (OPTIONS_PUSH_A_VALEUR.has(mot)) k++;
      }
      const refspecs = remoteEnOption ? positionnels : positionnels.slice(1);
      return [{ refspecs, tout, illisible, force: force || refspecs.some((refspec) => refspec.startsWith('+')) }];
  });
}

/** La branche distante qu'écrit un refspec ; `HEAD` ou `@` seuls poussent la branche courante. */
function destination(refspec, brancheCourante) {
  const cible = refspec.replace(/^\+/, '').split(':').pop() ?? '';
  return cible === 'HEAD' || cible === '@' ? (brancheCourante() ?? '') : cible;
}

/**
 * Vrai si un `git push` de la commande a pour destination une branche de sujet : `HEAD:sujet/x`,
 * `HEAD:refs/heads/sujet/x`, `sujet/x` seul, cités ou non, ou `HEAD` depuis une branche `sujet/…`.
 * Un sujet ne s'écrit que par `sujet.sh` (que le hook ne voit pas, il lance un script) : sans ce
 * refus, une session écrirait elle-même, sur le sujet, la ligne `Dépendances:` qui l'autorise (faille
 * relevée en contre-revue, puis en revue de sécurité : la première version ne refusait que depuis une
 * branche de ticket, et laissait passer un refspec entre guillemets, `git -C`, `git` par son chemin,
 * une autre branche courante, ou `git` derrière un préfixe comme `timeout 5`).
 */
export function pousseSurUnSujet(commande, brancheCourante = () => null) {
  return pushs(commande).some(({ refspecs }) => refspecs.some((refspec) => (nomDeBranche(destination(refspec, brancheCourante)) ?? '').startsWith('sujet/')));
}

/** Vrai si un `git push` de la commande vise un nom que `nomDeBranche` ne lit pas (`./feat/x`, `feat/./x`, `develop/`). */
export function pousseVersUnNomIllisible(commande, brancheCourante = () => null) {
  return pushs(commande).some(({ refspecs }) =>
    refspecs.some((refspec) => {
      const cible = destination(refspec, brancheCourante);
      return Boolean(cible) && cible !== 'HEAD' && nomDeBranche(cible) === null;
    }),
  );
}

/**
 * Vrai si un `git push` de la commande écrit une branche gardée (`brancheGardee` : sujet, `develop`,
 * `main`, branche par défaut), sous toutes ses graphies (`HEAD:refs/heads/develop`, `HEAD:heads/develop`,
 * `HEAD:DEVELOP`), ou pousse sans refspec, ou vers `HEAD`, depuis une telle branche. Une destination
 * vide (branche courante inconnue) n'est pas lue ici. `develop:feat/x` écrit `feat/x` : il passe.
 */
export function pousseSurUneBrancheGardee(commande, brancheCourante = () => null, brancheParDefaut = () => null) {
  let parDefaut;
  const defaut = () => (parDefaut === undefined ? (parDefaut = brancheParDefaut()) : parDefaut);
  // `develop`, `main` et les sujets se lisent sans la branche par défaut : elle n'est demandée que pour un autre nom.
  const gardee = (b) => Boolean(b) && b !== 'HEAD' && (brancheGardee(b) || brancheGardee(b, defaut()));
  return pushs(commande).some(({ refspecs }) =>
    refspecs.length === 0 ? gardee(brancheCourante()) : refspecs.some((refspec) => gardee(destination(refspec, brancheCourante))),
  );
}

/**
 * Vrai si un `git push` de la commande a un refspec qu'on ne peut pas lire : variable ou
 * substitution, destination en motif (`refs/heads/*`), ou `--all`, `--mirror`, `--branches`.
 */
export function pushIllisible(commande) {
  return (
    pushs(commande).some(
      // `git push origin :` (« matching ») pousse toute branche de même nom, develop comprise : la destination ne s'y lit pas.
      ({ refspecs, tout, illisible }) => tout || illisible || refspecs.some((refspec) => refspec === ':' || refspec === '+:' || /[$`]/.test(refspec) || /[*?[{]/.test(destination(refspec, () => null))),
    ) || lireGit(lireCommande(commande)).push
  );
}

/**
 * Vrai si un `git push` de la commande force : `--force`, `--force-with-lease`, `--force-if-includes`,
 * leurs abréviations (`--force-w`), avec ou sans valeur, `-f` seul ou groupé (`-uf`), ou un refspec
 * `+…`, cité ou non. Aucune branche n'en est exemptée : les règles du produit interdisent tout push forcé.
 */
export const pousseEnForce = (commande) => pushs(commande).some(({ force }) => force);

/** Vrai si un `git push` de la commande n'a aucun refspec : il pousse la branche courante vers son amont. */
export function pushSansRefspec(commande) {
  return pushs(commande).some(({ refspecs }) => refspecs.length === 0);
}

// ——— Les appels de git : hooks sautés, arguments illisibles, refs de suivi (ticket 17) ————————————————————

export const RAISON_HOOKS_GIT =
  "hooks git sautés (--no-verify, -n, HUSKY=0, core.hooksPath, include.path, alias.*, GIT_CONFIG_*) : ils sont le pare-feu local, corriger ce qu'ils signalent. Un banc installe ses hooks dans son dépôt jouet par son script, jamais par une commande de session.";
export const RAISON_ARGUMENT_ILLISIBLE =
  'argument de git illisible (variable, substitution ou motif non cité là où git peut lire une option) : écris-le en clair. Une expansion n\'est admise que dans une valeur : `-m "$msg"`, `--author="$a"` ; des chemins à motif vont après `--` : `git commit -m x -- src/*.ts`.';
/** Le refus de `COMMANDES_INTERDITES` pour un rebase ou un `reset --hard` d'une branche partagée, repris derrière les options globales. */
const RAISON_REBASE_PARTAGE = 'rebase ou reset --hard sur une branche partagée : jamais ; un sujet se rafraîchit par merge (sujet.sh rafraichir).';
/** Les sous-commandes qu'un programme à expansion suivi d'elles fait lire comme un appel de git. */
const SOUS_GARDEES = new Set(['commit', 'am', 'merge', 'rebase', 'pull', 'push', 'config', 'update-ref', 'reset']);
/** Un mot exact qui porte un motif ou des accolades non cités. */
const motifExact = (w) => /[*?[]/.test(w.nu ?? '') || ((w.nu ?? '').includes('{') && ((w.nu ?? '').includes(',') || (w.nu ?? '').includes('..')));
export const RAISON_REF_DE_SUIVI =
  'une ref de suivi (refs/remotes/…) ne se fabrique pas : des scripts de la chaîne la lisent comme l\'état du distant. `git fetch origin` la met à jour.';

/**
 * Les options des sous-commandes qui font un commit ou lancent un hook, relevées sur `git <sous-commande> -h`
 * (git 2.43) : courtes à valeur obligatoire (reste du groupe ou mot suivant), courtes à valeur facultative (reste
 * du groupe seulement : `-uno`, `-S<clé>`), longues à valeur obligatoire (mot suivant, ou collée). Une longue à
 * valeur facultative (`--gpg-sign[=<clé>]`) ne prend jamais le mot suivant : elle n'est pas listée. Une option
 * absente des listes est sans valeur, le mot suivant est lu : c'est le défaut prudent.
 */
const OPTIONS_DE_SOUS_COMMANDE = {
  commit: { obligatoires: 'mFcCt', facultatives: 'uS', longues: new Set(['--message', '--file', '--reuse-message', '--reedit-message', '--template', '--author', '--date', '--fixup', '--squash', '--cleanup', '--trailer', '--pathspec-from-file']) },
  am: { obligatoires: 'Cp', facultatives: 'S', longues: new Set(['--directory', '--exclude', '--include', '--whitespace', '--patch-format', '--resolvemsg', '--quoted-cr']) },
  merge: { obligatoires: 'mFsX', facultatives: 'S', longues: new Set(['--message', '--file', '--strategy', '--strategy-option', '--cleanup', '--into-name']) },
  rebase: { obligatoires: 'CsXx', facultatives: 'Sr', longues: new Set(['--onto', '--strategy', '--strategy-option', '--exec', '--whitespace']) },
  pull: { obligatoires: 'sXo', facultatives: 'Srj', longues: new Set(['--strategy', '--strategy-option', '--cleanup', '--upload-pack', '--depth', '--shallow-since', '--shallow-exclude', '--deepen', '--refmap', '--server-option', '--negotiation-tip']) },
  push: { obligatoires: 'o', facultatives: '', longues: OPTIONS_PUSH_A_VALEUR },
};

/** Les clés de configuration qui coupent ou déplacent les hooks, ou font d'un nom une autre commande (comparées en minuscules). */
const CLE_HOOKS = /^(core\.hookspath|include\.path|includeif\..*\.path|alias\..*)$/;
/** Les clés qui portent la destination d'un push : la commande ne la dit plus. */
const CLE_PUSH = /^(push\.default|remote\.pushdefault|remote\..+\.(push|mirror)|branch\..+\.pushremote)$/;
/** Les clés dont la valeur est une commande que git lance par un shell : la valeur se relit comme une commande. */
const CLE_COMMANDE = /^(core\.(editor|pager|sshcommand|fsmonitor|askpass)|sequence\.editor|pager\..+|diff\.external|diff\..+\.(command|textconv)|merge\..+\.driver|filter\..+\.(clean|smudge|process)|gpg\.(.+\.)?program|credential\.(.+\.)?helper|interactive\.difffilter|(diff|merge)tool\..+\.cmd)$/;
const sectionHooks = (s) => /^(core|include|includeif|alias)(\.|$)/.test(s);
const sectionPush = (s) => /^(push|remote|branch)(\.|$)/.test(s);
/** `git config` : options sans effet sur ce qu'il fait, sans valeur puis avec valeur (séparée ou collée). */
const CONFIG_NEUTRES = new Set(['--global', '--local', '--system', '--worktree', '--show-origin', '--show-scope', '--null', '-z', '--name-only', '--includes', '--no-includes']);
const CONFIG_NEUTRES_A_VALEUR = new Set(['--file', '-f', '--blob', '--type', '--default', '--comment']);
const CONFIG_LECTURES = new Set(['--get', '--get-all', '--get-regexp', '--get-urlmatch', '--list', '-l']);
const CONFIG_ECRITURES = new Set(['--add', '--replace-all', '--unset', '--unset-all']);
const CONFIG_SECTIONS = new Set(['--remove-section', '--rename-section']);
const CONFIG_MODES = new Set(['get', 'list', 'set', 'unset', 'remove-section', 'rename-section', 'edit']);

/** Les variables d'environnement qui coupent les hooks : husky lit `HUSKY`, git lit sa configuration dans les deux autres. */
const VARIABLE_HOOKS = /^(HUSKY|GIT_CONFIG_PARAMETERS|GIT_CONFIG_COUNT)$/;
const nomNuGarde = (nom) => VARIABLE_HOOKS.test(nom) || nom.startsWith('GIT_CONFIG_');
/** Les préfixes qui lancent un programme et acceptent des affectations `NOM=…` avant lui. */
const PREFIXES_A_AFFECTATIONS = new Set(['env', 'sudo', 'doas', 'nohup', 'exec', 'command', 'nice', 'time', 'timeout', 'stdbuf', 'setsid', 'ionice', 'chrt']);
const DECLARATIONS = new Set(['export', 'declare', 'typeset', 'readonly', 'local']);

/** Un mot exact d'une commande simple (un `Mot` du lecteur), vu par la lecture des appels de git. */
const motExact = (m) => ({ valeur: m.valeur, vue: m.expansion ? (m.prefixe ?? '') + SUBSTITUTION : m.valeur, expansion: m.expansion, prefixe: m.prefixe ?? '', nonCitee: m.nonCitee, nu: m.nu ?? '' });
/** Un mot d'une lecture (une chaîne) : ses expansions ne se jugent pas, il n'en reste que le texte. */
const motDuTexte = (s) => ({ valeur: s, vue: s, expansion: /[$`]/.test(s), prefixe: '', nonCitee: false, nu: '' });
const aExpansion = (texte) => /[$`]/.test(texte);
/** Le nom d'un mot `NOM=…` (`HUSKY=0`, `HUSKY="$x"`, `HUSKY+=x`), ou `null`. */
const nomAffecte = (w) => /^([A-Za-z_][A-Za-z0-9_]*)(\[[^\]]*\])?\+?=/.exec(w.expansion ? w.prefixe : w.valeur)?.[1] ?? null;

/**
 * L'appel de git dont le programme est en `i` dans `W` (des mots de `motExact` ou de `motDuTexte`), porté dans
 * le recueil `r` : `hooks`, `argument`, `ref`, `push` (vrais pour un refus), et `relectures` (les valeurs que git
 * lancera comme des commandes). Sur les mots exacts (`exacte`), une expansion n'est admise que dans une valeur,
 * citée (Décision 0 du ticket 17) ; sur le texte d'une lecture non appariée, seuls les noms se jugent.
 */
function lireAppel(W, i, exacte, r, { sousLue = false } = {}) {
  // Un motif de chemin ou d'accolades non cité (`*`, `?`, `[`, `{a,b}`) : bash en fait d'autres mots, comme d'une
  // expansion non citée (`git {-c,core.hooksPath=/x} commit`).
  const motif = (w) => exacte && (/[*?[]/.test(w.nu) || (w.nu.includes('{') && (w.nu.includes(',') || w.nu.includes('..'))));
  const libre = (w) => exacte && ((w.expansion && w.nonCitee) || motif(w));
  let j = i + 1;
  let globaleLibre = false;
  let nomIllisible = false;
  const cles = [];
  for (; j < W.length && W[j].vue.startsWith('-'); j++) {
    const w = W[j];
    const v = w.vue;
    if (OPTIONS_GIT_A_VALEUR.has(v)) {
      const valeur = W[++j];
      if (!valeur) break;
      if (libre(valeur)) globaleLibre = true;
      if (v === '-c' || v === '--config-env') cles.push({ option: v, texte: valeur.vue, w: valeur });
      continue;
    }
    const egal = v.indexOf('=');
    if (aExpansion(egal > 0 ? v.slice(0, egal) : v) || (egal < 0 && motif(w))) nomIllisible = true;
    if (egal > 0) {
      if (libre(w)) globaleLibre = true;
      if (v.slice(0, egal) === '--config-env') cles.push({ option: '--config-env', texte: v.slice(egal + 1), w });
    }
  }
  const ws = W[j];
  if (!ws) {
    if (nomIllisible || globaleLibre) r.hooks = true;
    return;
  }
  // Une sous-commande à expansion est illisible : `git $(echo commit) …` (Décision 0). Sur une lecture non appariée
  // d'un git que les mots exacts lisent (`sousLue` : une variante qui a retiré `"$d"` de `git -C "$d" add "$f"`),
  // ce n'est pas une sous-commande : la lecture exacte en juge.
  if (aExpansion(ws.vue) || motif(ws)) {
    if (!sousLue) r.hooks = true;
    return;
  }
  const sous = ws.vue.toLowerCase();
  const enPush = sous === 'push';
  if (nomIllisible) r[enPush ? 'push' : 'hooks'] = true;
  // Une expansion non citée dans la valeur d'une option globale peut y écrire une seconde option (`-C $X` où X
  // vaut `. -c alias.x=…`), devant n'importe quelle sous-commande : l'appel est illisible.
  if (globaleLibre) r[enPush ? 'push' : 'argument'] = true;
  for (const { option, texte, w } of cles) {
    const egal = texte.indexOf('=');
    const cle = (egal < 0 ? texte : texte.slice(0, egal)).toLowerCase();
    if (aExpansion(cle) || motif(w)) {
      r[enPush ? 'push' : 'hooks'] = true;
      continue;
    }
    if (CLE_HOOKS.test(cle)) r.hooks = true;
    else if (enPush && CLE_PUSH.test(cle)) r.push = true;
    else if (CLE_COMMANDE.test(cle)) {
      const valeur = egal < 0 ? '' : texte.slice(egal + 1);
      // `--config-env` lit sa valeur dans l'environnement : la commande ne se lit pas.
      if (option === '--config-env' || (exacte && w.expansion) || aExpansion(valeur)) r.argument = true;
      else if (exacte) r.relectures.push(valeur);
    }
  }
  const args = W.slice(j + 1);
  // `git --no-pager rebase origin/develop`, `git -C /tmp/w reset --hard origin/sujet/x` : le motif de
  // `COMMANDES_INTERDITES` veut la sous-commande juste après `git`.
  if ((sous === 'rebase' || (sous === 'reset' && args.some((w) => w.vue === '--hard'))) && args.some((w) => /\b(origin\/)?(develop|main|sujet\/)/i.test(w.vue))) r.rebase = true;
  if (OPTIONS_DE_SOUS_COMMANDE[sous]) lireOptions(sous, args, { exacte, motif, libre }, r);
  else if (sous === 'config') lireConfig(args, { exacte, motif, libre }, r);
  else if (sous === 'update-ref') lireUpdateRef(args, { exacte, motif }, r);
}

/** Les arguments de `commit`, `am`, `merge`, `rebase`, `pull` ou `push` : `--no-verify`, `-n`, les expansions. */
function lireOptions(sous, args, { exacte, motif, libre }, r) {
  const { obligatoires, facultatives, longues } = OPTIONS_DE_SOUS_COMMANDE[sous];
  const nNeVerifiePas = sous === 'commit' || sous === 'am';
  const enPush = sous === 'push';
  const nom = enPush ? 'push' : 'hooks';
  const valeur = enPush ? 'push' : 'argument';
  // `git rebase -x <commande>` lance la commande par un shell à chaque commit : elle se relit.
  const relire = (w, texte = w?.valeur) => {
    if (sous !== 'rebase' || !w || !exacte) return;
    if (w.expansion) r.argument = true;
    else r.relectures.push(texte);
  };
  for (let k = 0; k < args.length; k++) {
    const w = args[k];
    const v = w.vue;
    // Après `--`, des chemins : git ne les lit plus comme des options.
    if (v === '--') break;
    if (v.startsWith('-') && v !== '-') {
      if (v.startsWith('--')) {
        const egal = v.indexOf('=');
        const long = egal < 0 ? v : v.slice(0, egal);
        if (aExpansion(long) || (egal < 0 && motif(w))) {
          if (exacte) r[nom] = true;
          continue;
        }
        // `--no-verify` et ses abréviations : git accepte toute abréviation non ambiguë (`--no-veri` ; pour `am`, qui
        // n'a pas de `--verbose`, `--no-v` déjà). `--no-verify-signatures` n'en est pas une.
        if (long.length >= 6 && '--no-verify'.startsWith(long.toLowerCase())) r.hooks = true;
        // `--exec` et ses abréviations (`--exe`, `--ex`) : git les accepte, la commande se relit.
        const exec = long.length >= 4 && '--exec'.startsWith(long);
        if (egal >= 0) {
          if (libre(w)) r[valeur] = true;
          if (exec) relire(w, v.slice(egal + 1));
        } else if (longues.has(long) || (sous === 'rebase' && exec)) {
          const suivant = args[++k];
          if (suivant && libre(suivant)) r[valeur] = true;
          if (exec) relire(suivant);
        }
        continue;
      }
      // Un groupe d'options courtes : `-n` avant la première lettre à valeur ; après elle, la valeur.
      // Un motif parmi les lettres (`-*`, `-[n]`, `-{n,}`) : bash en fait d'autres mots, un fichier `-n` suffit.
      if (motif(w)) {
        r[nom] = true;
        continue;
      }
      const lettres = exacte && w.expansion ? w.prefixe : v;
      // Un caractère qui n'est ni lettre ni chiffre avant la première lettre à valeur : git refuse le groupe
      // (« unknown switch », sortie 129, rien n'est fait), il ne saute aucun hook (`git commit -n!`).
      const finDesNoms = [...lettres].findIndex((l, c) => c > 0 && (obligatoires.includes(l) || facultatives.includes(l)));
      if (/[^A-Za-z0-9]/.test(lettres.slice(1, finDesNoms < 0 ? lettres.length : finDesNoms))) continue;
      let valeurPrise = false;
      for (let c = 1; c < lettres.length; c++) {
        const l = lettres[c];
        if (l === 'n' && nNeVerifiePas) r.hooks = true;
        const obligatoire = obligatoires.includes(l);
        if (!obligatoire && !facultatives.includes(l)) continue;
        valeurPrise = true;
        const colle = c < lettres.length - 1 || (exacte && w.expansion);
        if (colle) {
          if (libre(w)) r[valeur] = true;
          if (l === 'x') relire(w, v.slice(c + 1));
        } else if (obligatoire) {
          const suivant = args[++k];
          if (suivant && libre(suivant)) r[valeur] = true;
          if (l === 'x') relire(suivant);
        }
        break;
      }
      // Une expansion ou un motif parmi les lettres : un nom d'option illisible (`-$(echo n)`).
      if (!valeurPrise && exacte && (w.expansion || motif(w))) r[nom] = true;
      continue;
    }
    // Un positionnel à expansion : git peut le lire comme une option (A-38). Pour `push`, `lirePushs` le refuse aussi.
    if (exacte && (w.expansion || motif(w))) r[valeur] = true;
  }
}

/**
 * `git config` : refusé s'il écrit, vide ou retire une clé de `CLE_HOOKS` (ou de `CLE_PUSH`, refus de push
 * illisible), retire ou renomme une section gardée, ou ouvre l'éditeur. Une action de lecture avant la clé, ou la
 * clé seule, passe ; une option inconnue devant la clé ferme l'exemption de lecture.
 */
function lireConfig(args, { motif, libre }, r) {
  let lecture = false;
  let inconnue = false;
  let ecriture = false;
  let section = false;
  const positionnels = [];
  let modeLisible = true;
  for (let k = 0; k < args.length; k++) {
    const w = args[k];
    const v = w.vue;
    if (v === '--') {
      positionnels.push(...args.slice(k + 1));
      break;
    }
    if (!v.startsWith('-') || v === '-') {
      if (!positionnels.length && inconnue) modeLisible = false;
      positionnels.push(w);
      continue;
    }
    const egal = v.startsWith('--') ? v.indexOf('=') : -1;
    const option = egal > 0 ? v.slice(0, egal) : v;
    if (aExpansion(option) || motif(w)) {
      r.hooks = true;
      continue;
    }
    if (CONFIG_NEUTRES.has(option)) continue;
    if (CONFIG_NEUTRES_A_VALEUR.has(option)) {
      if (egal < 0) k++;
    } else if (CONFIG_LECTURES.has(option)) {
      if (!positionnels.length && !inconnue) lecture = true;
    } else if (CONFIG_ECRITURES.has(option)) ecriture = true;
    else if (CONFIG_SECTIONS.has(option)) section = true;
    else if (option === '-e' || option === '--edit') {
      r.hooks = true;
      return;
    } else {
      inconnue = true;
      // git accepte toute abréviation non ambiguë d'une option longue (`--unset-a`, `--remove-sec`) : une option qui
      // en abrège une d'écriture, de section ou d'édition en prend l'effet (plusieurs à la fois si elle est ambiguë).
      const abrege = (liste) => option.startsWith('--') && option.length >= 4 && [...liste].some((o) => o.startsWith(option));
      if (abrege(CONFIG_ECRITURES)) ecriture = true;
      if (abrege(CONFIG_SECTIONS)) section = true;
      if (abrege(['--edit'])) {
        r.hooks = true;
        return;
      }
    }
  }
  let reste = positionnels;
  let mode = null;
  if (reste.length && !reste[0].expansion && CONFIG_MODES.has(reste[0].vue)) {
    mode = reste[0].vue;
    reste = reste.slice(1);
  }
  if (mode === 'edit') {
    r.hooks = true;
    return;
  }
  if (section || mode === 'remove-section' || mode === 'rename-section') {
    const renomme = mode === 'rename-section' || args.some((w) => w.vue.length >= 4 && '--rename-section'.startsWith(w.vue));
    for (const w of reste) {
      const s = w.vue.toLowerCase();
      if (aExpansion(s) || motif(w) || sectionHooks(s)) r.hooks = true;
      else if (renomme && sectionPush(s)) r.push = true;
    }
    return;
  }
  const [cle, ...valeurs] = reste;
  if (!cle) return;
  if ((lecture || ((mode === 'get' || mode === 'list') && modeLisible)) && !ecriture) return;
  // Une clé à expansion est un nom illisible (Décision 0) ; la lecture, ci-dessus, l'admet.
  if (aExpansion(cle.vue) || motif(cle)) {
    r.hooks = true;
    return;
  }
  // La clé seule se lit, sauf derrière une option inconnue : elle peut être une écriture que la garde ne connaît pas.
  if (!ecriture && !inconnue && mode !== 'set' && mode !== 'unset' && valeurs.length === 0) return;
  const nom = cle.vue.toLowerCase();
  if (CLE_HOOKS.test(nom)) r.hooks = true;
  else if (CLE_PUSH.test(nom)) r.push = true;
  else if (CLE_COMMANDE.test(nom) && valeurs[0]) {
    if (valeurs[0].expansion) r.argument = true;
    else r.relectures.push(valeurs[0].valeur);
  }
  if (valeurs.some(libre)) r.argument = true;
}

/** `git update-ref` vers `refs/remotes/…`, ou `--stdin` (son entrée ne se lit pas) : une ref de suivi fabriquée. */
function lireUpdateRef(args, { exacte, motif }, r) {
  for (let k = 0; k < args.length; k++) {
    const w = args[k];
    const v = w.vue;
    if (v !== '--' && v.startsWith('-') && v !== '-') {
      if (v === '-m') k++;
      else if (v.length >= 3 && '--stdin'.startsWith(v)) {
        r.ref = true;
        return;
      }
      continue;
    }
    const ref = v === '--' ? args[k + 1] : w;
    if (!ref) return;
    if (exacte && (ref.expansion || motif(ref))) r.argument = true;
    else if (/^refs\/+remotes\//i.test(ref.vue)) r.ref = true;
    return;
  }
}

/**
 * Vrai si la commande simple affecte ou exporte `HUSKY`, `GIT_CONFIG_PARAMETERS` ou `GIT_CONFIG_COUNT` : en
 * position d'affectation, en mot `NOM=…` derrière un préfixe qui lance un programme (`env`, `sudo`, `exec`…),
 * en argument d'une déclaration (`export`, `declare`…, `NOM=…` ou nom nu, `GIT_CONFIG_*` nu compris), de
 * `read`, de `printf -v` ou de `let`. En argument d'un autre programme, ces mots passent (`echo HUSKY=0`).
 */
function affecteLesHooks(cmd) {
  if (cmd.affectations.some((a) => VARIABLE_HOOKS.test(a.nom))) return true;
  const W = cmd.mots.map(motExact);
  // Derrière un lanceur hors de la liste (`taskset 1 env HUSKY=0 git …`, `flock f env …`) : un `env` n'importe où
  // suivi d'une affectation gardée, ou une affectation gardée placée avant le programme git.
  const programmeGit = W.findIndex((w) => !w.expansion && (/(^|\/)git$/i.test(w.valeur) || PROGRAMME_INTERNE.test(w.valeur)));
  for (let k = 0; k < W.length; k++) {
    if (programmeGit >= 0 && k < programmeGit && VARIABLE_HOOKS.test(nomAffecte(W[k]) ?? '')) return true;
    if (W[k].expansion || nomDeBase(W[k].valeur) !== 'env') continue;
    for (let e = k + 1; e < W.length; e++) {
      // `env GIT_CONFIG_{COUNT=1,KEY_0=…}` : bash en fait des affectations que la garde ne lit pas.
      if (motifExact(W[e])) return true;
      const nom = nomAffecte(W[e]);
      if (nom && VARIABLE_HOOKS.test(nom)) return true;
      if (!nom && !W[e].vue.startsWith('-') && !(['-u', '-C', '--unset', '--chdir'].includes(W[e - 1].vue))) break;
    }
  }
  const premier = W[0];
  if (!premier || premier.expansion) return false;
  const programme = nomDeBase(premier.valeur);
  // `set -a` (`allexport`) exporte toute variable affectée ensuite, par `((…))`, `${X:=…}`, `for X in …` : la
  // garde ne lit pas ces affectations-là, l'option elle-même est refusée, comme `set -k` (`keyword`).
  if (programme === 'set' || programme === 'shopt') {
    for (let k = 1; k < W.length; k++) {
      const v = W[k].vue;
      if (v === '--') break;
      // `set -k` (`keyword`) fait de tout mot `NOM=…` de la commande une variable d'environnement, même après git.
      if (W[k].expansion || /^-[A-Za-z]*[ak]/.test(v) || (/^(allexport|keyword)$/.test(v) && /^-[A-Za-z]*o/.test(W[k - 1]?.vue ?? '')) || /^-o(allexport|keyword)$/.test(v)) return true;
    }
    return false;
  }
  if (PREFIXES_A_AFFECTATIONS.has(programme)) {
    // La valeur d'une option du préfixe (`sudo -u x`, `nice -n 5`) se saute, puis la durée de `timeout` ou la
    // priorité de `chrt`, même derrière des options (`timeout -s KILL 5 env …`).
    let valeur = false;
    let positionnels = PREFIXES_A_POSITIONNEL.has(programme) ? 1 : 0;
    for (let k = 1; k < W.length; k++) {
      const w = W[k];
      if (motifExact(w)) return true;
      const nom = nomAffecte(w);
      if (nom) {
        if (VARIABLE_HOOKS.test(nom)) return true;
        valeur = false;
      } else if (w.vue.startsWith('-')) valeur = true;
      else if (!w.expansion && PREFIXES_A_AFFECTATIONS.has(nomDeBase(w.valeur))) {
        valeur = false;
        positionnels = PREFIXES_A_POSITIONNEL.has(nomDeBase(w.valeur)) ? 1 : 0;
      } else if (valeur) valeur = false;
      else if (positionnels > 0) positionnels--;
      // `env "$X" git …` : l'expansion peut être une affectation.
      else return w.expansion;
    }
    return false;
  }
  let p = 0;
  while (W[p] && !W[p].expansion && (W[p].valeur === 'builtin' || W[p].valeur === 'command')) p++;
  const d = W[p]?.expansion ? null : W[p]?.valeur;
  const args = W.slice(p + 1);
  if (DECLARATIONS.has(d) || d === 'let') {
    for (const w of args) {
      if (!w.expansion && (w.valeur.startsWith('-') || w.valeur.startsWith('+'))) continue;
      const nom = nomAffecte(w);
      if (nom) {
        // `declare -n r=HUSKY` : `r` devient HUSKY.
        if (VARIABLE_HOOKS.test(nom) || (!w.expansion && nomNuGarde(w.valeur.slice(w.valeur.indexOf('=') + 1)))) return true;
      } else if (w.expansion || (d !== 'let' && nomNuGarde(w.valeur))) return true;
    }
    return false;
  }
  if (d === 'read') {
    for (let k = 0; k < args.length; k++) {
      const w = args[k];
      if (!w.expansion && w.valeur.startsWith('-')) {
        // `-p <invite>`, `-d <délimiteur>`… : la valeur se saute ; celle de `-a` est un nom.
        const derniere = w.valeur[w.valeur.length - 1];
        if (w.valeur.length === 2 && 'dinNptu'.includes(derniere)) k++;
        continue;
      }
      if (w.expansion || nomNuGarde(w.valeur)) return true;
    }
    return false;
  }
  if (d === 'printf') {
    for (let k = 0; k < args.length; k++) {
      const w = args[k];
      if (w.expansion || !w.valeur.startsWith('-v')) continue;
      const nom = w.valeur === '-v' ? args[k + 1] : motDuTexte(w.valeur.slice(2));
      if (nom && (nom.expansion || nomNuGarde(nom.valeur))) return true;
    }
  }
  return false;
}

/** La même lecture sur le texte d'une lecture non appariée (texte cité, corps relu, here-string) : prudente. */
function affecteLesHooksDansLeTexte(mots) {
  let declaration = false;
  for (const m of mots) {
    if (/^(HUSKY|GIT_CONFIG_PARAMETERS|GIT_CONFIG_COUNT)(\[[^\]]*\])?\+?=/.test(m)) return true;
    if (declaration && nomNuGarde(m)) return true;
    if (DECLARATIONS.has(m) || m === 'read' || m === 'printf' || m === 'let') declaration = true;
  }
  return false;
}

const lecturesDeGit = new WeakMap();
/**
 * Les appels de git d'une lecture de `lireCommande`, et les affectations qui coupent les hooks : `{ hooks,
 * argument, ref, push, relectures }`. Chaque commande simple se lit sur ses mots exacts ; chaque lecture
 * (L2, variantes, corps relus, textes cités) qui n'est pas appariée à une commande simple qui porte ce git (même
 * `debut`, même programme au même rang, mêmes mots jusqu'à la sous-commande comprise) se lit sur son texte : un
 * texte cité qui porte une commande git refusée est refusé (Décision 6 bis du ticket 17).
 */
function lireGit(lu) {
  let r = lecturesDeGit.get(lu);
  if (r) return r;
  r = { hooks: false, argument: false, ref: false, push: false, rebase: false, relectures: [] };
  const exacts = [];
  const programmeGit = /(^|[/$])git$/i;
  const programmeExact = /(^|\/)git$/;
  // Les alias définis dans la commande (`alias g='git commit --no-verify'`) : leur valeur se relit, et une commande
  // qui appelle l'un d'eux se relit, l'alias remplacé par sa valeur.
  const aliases = new Map();
  for (const cmd of lu.commandes) {
    const [premier, ...reste] = cmd.mots;
    if (!premier || premier.expansion || premier.valeur !== 'alias') continue;
    for (const m of reste) {
      const egal = m.valeur.indexOf('=');
      if (m.expansion) r.argument = true;
      else if (egal > 0) {
        aliases.set(m.valeur.slice(0, egal), m.valeur.slice(egal + 1));
        r.relectures.push(m.valeur.slice(egal + 1));
      }
    }
  }
  for (const cmd of lu.commandes) {
    if (affecteLesHooks(cmd)) r.hooks = true;
    const W = [...cmd.affectations.map((a) => a.mot), ...cmd.mots].map(motExact);
    const valeurs = W.map((w) => w.valeur);
    const premier = cmd.mots[0];
    if (premier && !premier.expansion && aliases.has(premier.valeur)) r.relectures.push([aliases.get(premier.valeur), ...cmd.mots.slice(1).map((m) => m.valeur)].join(' '));
    // `env -S '…'`, `env -S'…'`, `env --split-string=…` : la chaîne est découpée en mots puis lancée, avec ce qui suit.
    for (let k = 0; k < W.length; k++) {
      if (W[k].expansion || nomDeBase(W[k].valeur) !== 'env') continue;
      for (let e = k + 1; e < W.length && W[e].vue.startsWith('-'); e++) {
        const v = W[e].vue;
        const court = /^-[A-Za-z]*S/.exec(v);
        const long = v.startsWith('--') && v.length >= 4 && '--split-string'.startsWith(v.split('=')[0]);
        if (!court && !long) continue;
        const colle = court ? v.slice(court[0].length) : v.includes('=') ? v.slice(v.indexOf('=') + 1) : '';
        const porteur = colle ? W[e] : W[e + 1];
        if (!porteur) break;
        if (porteur.expansion) r.argument = true;
        else r.relectures.push([colle || porteur.valeur, ...W.slice(colle ? e + 1 : e + 2).map((w) => w.valeur)].join(' '));
        break;
      }
    }
    // Un programme à expansion (`$(echo git) commit`, `${G:-git} -c … commit`, `sudo $g push …`) : lu comme git,
    // ses arguments jugés comme ceux de git ; un push y est illisible (sa destination n'est pas lue).
    const vues = W.map((w) => w.vue);
    const candidats = new Set();
    const p = cmd.affectations.length + programme(cmd.mots).k;
    if (W[p]?.expansion) candidats.add(p);
    W.forEach((w, k) => {
      if (w.expansion && SOUS_GARDEES.has(appelDeGit(vues, k).sous ?? '')) candidats.add(k);
    });
    // Un mot à expansion placé après un git lisible en est une valeur ou un argument (`git -C "$d" push …`).
    const premierGit = Math.min(...lecturesDuProgramme(valeurs, programmeGit, programmeExact), ...appelsInternes(valeurs).map(({ i }) => i), Infinity);
    for (const k of [...candidats].filter((k) => k < premierGit)) {
      exacts.push({ debut: cmd.debut, i: k, tete: valeurs.slice(0, appelDeGit(valeurs, k).j + 1) });
      lireAppel(W, k, true, r);
      if (appelDeGit(vues, k).sous === 'push') r.push = true;
    }
    if (!/git/i.test(valeurs.join(' '))) continue;
    for (const i of lecturesDuProgramme(valeurs, programmeGit, programmeExact)) {
      exacts.push({ debut: cmd.debut, i, tete: valeurs.slice(0, appelDeGit(valeurs, i).j + 1) });
      lireAppel(W, i, true, r);
    }
    // Un programme interne (`git-commit`) se lit comme `git commit`, sans options globales.
    for (const { i, sous } of appelsInternes(valeurs)) {
      exacts.push({ debut: cmd.debut, i, tete: valeurs.slice(0, i + 1) });
      lireAppel(commeGit(W, i, sous), i, true, r);
    }
  }
  for (const lecture of lu.lectures) {
    if (lecture.exacte) continue;
    let apparieeAGit = false;
    for (const { i, j, sous, interne } of appelsGit([lecture])) {
      const tete = lecture.mots.slice(0, j + 1);
      const appariee = lecture.appariable && exacts.some((e) => e.debut === lecture.debut && e.i === i && e.tete.length === tete.length && e.tete.every((m, k) => m === tete[k]));
      const W = lecture.mots.map(motDuTexte);
      // Le même git (même `debut`, même rang) lu sur les mots exacts : sa sous-commande y est lue.
      const sousLue = lecture.appariable && exacts.some((e) => e.debut === lecture.debut && e.i === i);
      if (appariee) apparieeAGit = true;
      else lireAppel(interne ? commeGit(W, i, sous) : W, i, false, r, { sousLue });
    }
    if (!apparieeAGit && affecteLesHooksDansLeTexte(lecture.mots)) r.hooks = true;
  }
  lecturesDeGit.set(lu, r);
  return r;
}

/** Vrai si la commande saute les hooks git : `--no-verify`, `-n`, `core.hooksPath`, `include`, `alias.*`, `HUSKY`, `GIT_CONFIG_*`… */
export const sauteLesHooks = (commande) => lireGit(lireCommande(commande)).hooks;
/** Vrai si un argument de git porte une expansion là où git peut lire une option (Décision 0 du ticket 17). */
export const argumentDeGitIllisible = (commande) => lireGit(lireCommande(commande)).argument;
/** Vrai si la commande fabrique une ref de suivi : `git update-ref refs/remotes/…`, `git update-ref --stdin`. */
export const ecritUneRefDeSuivi = (commande) => lireGit(lireCommande(commande)).ref;

/**
 * Décision sur une commande shell : `{ decision: 'refuser', raison }`, ou `null`. Le hook ne demande
 * jamais rien à un humain : ce qu'il ne laisse pas passer, il le refuse et dit quoi faire.
 * @param {{ dependancesPrevues?: () => string[] | null, brancheCourante?: () => string | null }} [contexte]
 *   Tout `git push` vers un `sujet/…` est refusé, quelle que soit la branche courante : un sujet ne
 *   s'écrit que par `sujet.sh`, sans quoi la session écrirait elle-même la ligne qui l'autorise. Un
 *   `git push` sans refspec, ou vers `HEAD`, depuis une branche `sujet/…` (`brancheCourante`, lue
 *   une fois au plus) l'est aussi ; un refspec illisible (variable, substitution, motif, `--all`)
 *   l'est aussi.
 *   `dependancesPrevues` : paquets de la ligne `Dépendances:` du ticket de la branche, lue sur le
 *   sujet (`null` si introuvable) ; appelée seulement si la commande ajoute un paquet. Une commande
 *   passe sans question quand chacun de ses paquets y figure et qu'aucune option ne change la source
 *   (`--registry`, `--config.*`) ; un seul paquet absent ou une telle option, et elle est refusée.
 */
export function decisionCommande(commande, contexte = {}) {
  // Le plafond avant toute lecture : la lecture par jetons, comme celle de 7.9.x, coûte au carré sur certaines formes
  // (`git commit -m x ` répété) ; au-delà, la commande est refusée sans être lue, bien avant le délai du hook.
  if (commande.length > TAILLE_MAX_LECTURE_7_9) return { decision: 'refuser', raison: RAISON_TROP_LONGUE };
  // Le contexte (lectures du dépôt : `git ls-remote`, ticket) est lu une fois au plus, pour les deux lectures.
  const memoire = {};
  for (const cle of ['dependancesPrevues', 'brancheCourante', 'brancheParDefaut'])
    if (typeof contexte[cle] === 'function') memoire[cle] = uneFois(contexte[cle]);
  const lu = lireCommande(commande);
  const decision = decisionDuLecteur(lu, commande, memoire);
  if (decision || lu.illisible) return decision;
  // L'union (A-51 ter) : ce que la lecture de 7.9.x refuse sur la commande d'origine est refusé. Elle la lit
  // entière, sans rien en retirer : tout refus de 7.9.x reste un refus de la garde, par construction.
  return LECTURE_7_9.decisionCommande(commande, memoire);
}

/** `f` appelée une fois au plus : les appels suivants rendent la même valeur. */
function uneFois(f) {
  let lue = false;
  let valeur;
  return () => {
    if (!lue) {
      valeur = f();
      lue = true;
    }
    return valeur;
  };
}

/** La décision du lecteur par jetons seul (ticket 33), sur une lecture de `lireCommande`. */
function decisionDuLecteur(lu, commande, { dependancesPrevues = () => null, brancheCourante = () => null, brancheParDefaut = () => null } = {}) {
  // Ce que le lecteur ne sait pas lire est refusé avant tout autre refus : il ne devine pas.
  if (lu.illisible) return { decision: 'refuser', raison: RAISON_ILLISIBLE };
  // Chaque commande simple en lecture L3 : un mot cité seul (`"git"`, `$'git'`, `"--no-verify"`) se lit sans ses
  // guillemets, un texte cité qui porte un blanc ou un séparateur se lit `""`.
  for (const mots of [...lu.textes, ...lu.cites]) {
    const code = mots.join(' ');
    // Chaque motif nomme npm, yarn ou git : un texte qui n'en porte aucun n'est pas relu motif par motif.
    if (!/npm|yarn|git/i.test(code)) continue;
    for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code)) return { decision: 'refuser', raison };
  }
  // Les appels de git (ticket 17) : hooks sautés, argument illisible, ref de suivi fabriquée, puis ce que git
  // lancera comme une commande (`git rebase -x …`, `-c core.pager=…`), relu comme une commande de la session.
  const git = lireGit(lu);
  if (git.hooks) return { decision: 'refuser', raison: RAISON_HOOKS_GIT };
  if (git.argument) return { decision: 'refuser', raison: RAISON_ARGUMENT_ILLISIBLE };
  if (git.ref) return { decision: 'refuser', raison: RAISON_REF_DE_SUIVI };
  if (git.rebase) return { decision: 'refuser', raison: RAISON_REBASE_PARTAGE };
  for (const texte of git.relectures) {
    const relue = lire(texte);
    const decision = decisionDuLecteur(relue, texte, { dependancesPrevues, brancheCourante, brancheParDefaut });
    if (decision) return decision;
  }
  let branche;
  const courante = () => (branche === undefined ? (branche = brancheCourante()) : branche);
  if (pousseSurUnSujet(commande, courante)) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  if (pushSansRefspec(commande) && (courante() ?? '').startsWith('sujet/')) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  if (pousseVersUnNomIllisible(commande, courante)) return { decision: 'refuser', raison: RAISON_NOM_ILLISIBLE };
  if (pousseSurUneBrancheGardee(commande, courante, brancheParDefaut)) return { decision: 'refuser', raison: RAISON_PUSH_GARDEE };
  if (pousseEnForce(commande)) return { decision: 'refuser', raison: RAISON_PUSH_FORCE };
  if (ecritParGh(commande)) return { decision: 'refuser', raison: RAISON_GH_ECRIT };
  if (pushIllisible(commande)) return { decision: 'refuser', raison: RAISON_PUSH_ILLISIBLE };
  const liste = [...lu.textes, ...lu.cites].flatMap(ajouts);
  if (liste.length === 0) return null;
  const sansRisque = liste.every(({ options }) => options.every((o) => OPTIONS_SANS_RISQUE.has(o)));
  const prevues = sansRisque ? dependancesPrevues() : null;
  const paquets = liste.flatMap((a) => a.paquets);
  if (Array.isArray(prevues) && paquets.every((p) => prevues.includes(p))) return null;
  return { decision: 'refuser', raison: RAISON_DEPENDANCE };
}

/** Un fichier que le hook d'après-édition passe à Prettier puis ESLint. */
export const lintable = (chemin) =>
  /\.(ts|tsx|mjs|js)$/.test(chemin) && !/(^|\/)(node_modules|dist|\.next|\.expo|coverage|\.turbo)\//.test(chemin);

/**
 * Nom d'une branche tel que GitHub le lira, ou `null` s'il porte des blancs autour (`" develop"`) :
 * barres doublées réduites, préfixes `refs/`, `heads/`, `remotes/` et `origin/` retirés (dans le doute,
 * `origin/develop` se lit `develop`), en minuscules.
 */
export function nomDeBranche(branche) {
  const brute = String(branche ?? '');
  if (brute.trim() !== brute) return null;
  // Un segment `.` ou `..`, un `%`, un caractère de contrôle ou une barre finale : un client d'URL le résout ou le décode
  // (`./develop` se lit `develop` chez GitHub) ; le nom ne se lit pas, il est gardé.
  if (brute.split('/').some((s) => s === '.' || s === '..') || /[%\x00-\x1f\x7f]|\/$/.test(brute)) return null;
  return brute
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/^((refs|heads|remotes|origin)\/)+/i, '')
    .toLowerCase();
}

/**
 * Branche gardée : un sujet (`sujet/…`), `develop`, `main`, la branche par défaut du dépôt, ou un nom
 * vide ou entouré de blancs. Une session n'y écrit jamais elle-même : le capitaine par ses scripts, le
 * conducteur par `sujet.sh`. Une seule définition pour `git push`, `gh` et les outils GitHub.
 */
export function brancheGardee(branche, brancheParDefaut = null) {
  const b = nomDeBranche(branche);
  if (!b) return true;
  const parDefaut = nomDeBranche(brancheParDefaut);
  return b.startsWith('sujet/') || b === 'develop' || b === 'main' || (Boolean(parDefaut) && b === parDefaut);
}

const RAISON_OUTIL_ECRIT =
  "écrire par un outil GitHub (push_files, create_or_update_file, delete_file, create_branch) sur un sujet, develop, main ou la branche par défaut : jamais. Un sujet ne s'écrit que par sujet.sh, sans quoi une session écrirait elle-même la ligne `Dépendances:` qui l'autorise ; develop et main ne reçoivent que des PR fusionnées par le capitaine. Écrire sur sa branche de travail, puis ouvrir une PR ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
const RAISON_OUTIL_FUSION =
  "fusionner par un outil GitHub une PR dont la base est un sujet, develop, main ou la branche par défaut, ou dont la base ne se lit pas : jamais. Le capitaine fusionne par ses scripts (passer.sh, sujet.sh fusionner), qui vérifient les contrôles exigés.";
const RAISON_OUTIL_MISE_A_JOUR =
  "mettre à jour par un outil GitHub une PR dont la tête est un sujet, develop, main ou la branche par défaut, ou dont la tête ne se lit pas : jamais, l'outil écrirait sur cette branche. Un sujet se rafraîchit par sujet.sh rafraichir (le capitaine) ; une branche de travail se met à jour par l'outil, ou par git merge puis un push ordinaire.";
const RAISON_GH_ECRIT =
  "écrire par `gh` une branche, un fichier ou une règle de branche (gh api en écriture vers git/refs, contents, merges, merge-upstream, pulls/<n>/merge ou update-branch, branches/<b>/protection ou rename, rulesets, une mutation GraphQL ou une requête illisible, gh pr merge, gh pr update-branch, gh pr close --delete-branch, gh repo sync, gh alias set ou import) : jamais à la main. On pousse sa branche par git push, une PR se fusionne par le capitaine (passer.sh, sujet.sh fusionner), un sujet ne s'écrit que par sujet.sh ; une PR se met à jour par l'outil update_pull_request_branch, ou par git merge puis un push ordinaire.";

/** Outils GitHub d'écriture, par nom court (après le dernier `__`) : leur paramètre `branch` porte la branche visée. */
export const OUTILS_GITHUB_ECRITURE = ['push_files', 'create_or_update_file', 'delete_file', 'create_branch'];
/** Outils GitHub de fusion, par nom court : ils ne portent que `pullNumber`, la base se lit à part. */
export const OUTILS_GITHUB_FUSION = ['merge_pull_request', 'enable_pr_auto_merge'];
/** Outil GitHub de mise à jour d'une PR, par nom court : il écrit sur la tête de la PR, qui se lit à part. */
export const OUTILS_GITHUB_MISE_A_JOUR = ['update_pull_request_branch'];
/** Les sept outils que garde `garde-github`, et rien d'autre. */
export const OUTILS_GITHUB_GARDES = [...OUTILS_GITHUB_ECRITURE, ...OUTILS_GITHUB_FUSION, ...OUTILS_GITHUB_MISE_A_JOUR];

/**
 * Décision sur un appel d'outil MCP (hook `garde-github`) : `{ decision: 'refuser', raison }` ou `null`.
 * Le serveur se reconnaît au nom court de l'outil, quel que soit son préfixe (`mcp__github__`, ou un
 * serveur nommé autrement par le projet). Une branche absente, vide ou qui n'est pas un texte se lit
 * comme gardée : l'API écrirait sur la branche par défaut.
 * @param {string} outil nom complet de l'outil (`mcp__github__push_files`)
 * @param {Record<string, unknown>} entree `tool_input`
 * @param {{ brancheParDefaut?: string | null, refsDeLaPr?: (entree: Record<string, unknown>) => { tete: string, base: string } | null }} [contexte]
 *   `refsDeLaPr` : la tête et la base de la PR visée (`null` si elles ne se lisent pas), appelée pour une
 *   fusion ou une mise à jour seulement ; une fusion regarde la base, une mise à jour la tête.
 */
export function decisionOutilGithub(outil, entree = {}, { brancheParDefaut = null, refsDeLaPr = () => null } = {}) {
  const court = String(outil).split('__').pop();
  if (OUTILS_GITHUB_ECRITURE.includes(court)) {
    const branche = entree?.branch;
    if (typeof branche === 'string' && branche !== '' && nomDeBranche(branche) === null) return { decision: 'refuser', raison: RAISON_NOM_ILLISIBLE };
    return typeof branche !== 'string' || brancheGardee(branche, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_ECRIT } : null;
  }
  if (OUTILS_GITHUB_FUSION.includes(court)) {
    return brancheGardee(refsDeLaPr(entree)?.base, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_FUSION } : null;
  }
  if (OUTILS_GITHUB_MISE_A_JOUR.includes(court)) {
    return brancheGardee(refsDeLaPr(entree)?.tete, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_MISE_A_JOUR } : null;
  }
  return null;
}

/** Options de `gh api` suivies d'une valeur séparée. */
const OPTIONS_GH_API_A_VALEUR = new Set(['-X', '--method', '-f', '--raw-field', '-F', '--field', '-H', '--header', '--input', '-q', '--jq', '-t', '--template', '--hostname', '--cache', '-p', '--preview']);
/** Routes REST qui écrivent une branche, un fichier ou une règle de branche, en écriture. */
const CHEMIN_GH_ECRIT = /(^|\/)(git\/refs(\/|$)|contents(\/|$)|merges$|merge-upstream$|pulls\/[^/]+\/(merge|update-branch|ccr\/auto_merge)$|branches\/[^/]+\/protection(\/|$)|branches\/.+\/rename$|rulesets(\/|$))/;

/**
 * Vrai si la commande écrit une branche, un fichier ou une règle de branche par `gh` : `gh pr merge`,
 * `gh pr close -d`, `gh repo sync`, `gh alias set` et `gh alias import` (avec ou sans `-R`/`--repo`,
 * avant ou après la sous-commande) ; `gh api` vers une route de `CHEMIN_GH_ECRIT`, ou vers un chemin
 * illisible (variable, substitution, encodé), avec une méthode autre que GET (explicite, ou implicite : un
 * champ `-f`/`-F` ou `--input` fait un POST) ; `gh api graphql` (ou la route `/graphql`) dont la requête,
 * cherchée dans la commande à partir de `gh`, est une mutation ou ne se lit pas (`query=@fichier`,
 * `--input`, variable).
 */
export function ecritParGh(commande) {
  return lireCommande(commande).lectures.some((lecture) => {
    const { mots: lus, segment } = lecture;
    if (!/gh/i.test(segment)) return false;
    // `-i` est la seule option booléenne courte de `gh api` : `-iX PUT`, `-iXPUT`, `-ifk=v` se lisent `-X`, `-f`.
    const mots = lus.map((mot) => mot.replace(/^-i+(?=[XfF])/, '-'));
    // Seul le premier programme du segment compte : `git commit -m "gh pr merge 3"` n'est pas une fusion.
    // `$'gh'` se lit `$gh` sans ses guillemets ; un système de fichiers insensible à la casse lance `GH`.
    return lecturesDuProgramme(mots, /(^|[/$])(gh|git)$/i, /(^|\/)(gh|git)$/).some((i) => {
      if (!/(^|[/$])gh$/i.test(mots[i])) return false;
      // Positionnels après `gh`, sans `-R`, `--repo`, `--hostname` ni leur valeur : `gh -R o/r pr merge 3` est `pr merge`.
      const pos = [];
      for (let k = i + 1; k < mots.length; k++) {
        if (mots[k] === '-R' || mots[k] === '--repo' || mots[k] === '--hostname') k++;
        else if (!mots[k].startsWith('-')) pos.push(mots[k]);
      }
      if ((pos[0] === 'pr' && (pos[1] === 'merge' || pos[1] === 'update-branch')) || (pos[0] === 'repo' && pos[1] === 'sync')) return true;
      if (pos[0] === 'alias' && (pos[1] === 'set' || pos[1] === 'import')) return true;
      if (pos[0] === 'pr' && pos[1] === 'close' && mots.some((mot) => /^(-[a-zA-Z]*d[a-zA-Z]*|--delete-branch)(=.*)?$/.test(mot))) return true;
      if (pos[0] !== 'api') return false;
      let chemin = null;
      const positionnels = [];
      let methode = null;
      let champs = false;
      for (let k = mots.indexOf('api', i + 1) + 1; k < mots.length; k++) {
        const mot = mots[k];
        if (!mot.startsWith('-')) {
          chemin ??= mot;
          positionnels.push(mot);
          continue;
        }
        const [option, valeurJointe] = mot.split(/=(.*)/s);
        const valeur = valeurJointe ?? (OPTIONS_GH_API_A_VALEUR.has(option) ? mots[++k] : undefined);
        if (option === '-X' || option === '--method') methode = String(valeur ?? '').toUpperCase();
        else if (/^-X./.test(mot)) methode = mot.slice(2).toUpperCase();
        // `-fcle=valeur` : un champ collé à son option fait un POST comme `-f cle=valeur`.
        if (['-f', '--raw-field', '-F', '--field', '--input'].includes(option) || /^-[fF]./.test(option)) champs = true;
      }
      // Route lue comme gh l'enverra : hôte, barres de tête, de fin, doublées et `./` retirés, requête et fragment
    // (`#…`, jamais envoyé) coupés, en minuscules.
      const routeDe = (c) => c.replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/\/(\.\/)+/g, '/').replace(/\/{2,}/g, '/').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').toLowerCase();
      const route = routeDe(chemin ?? '');
      // Un champ cité à blancs placé avant la route (`-f message="add file" … repos/…/contents/a`) laisse des mots
      // devant elle : chaque positionnel qui a la forme d'une route (`repos/…`, `graphql`, une URL) compte aussi.
      const routes = [route, ...positionnels.slice(1).filter((p) => /^(\/?repos\/|\/?graphql$|[a-z]+:\/\/)/i.test(p)).map(routeDe)];
      // La mutation se cherche de `gh` à la fin de la commande : ni avant (un message de commit), ni bornée au
      // segment (la découpe sur `(` couperait `query A { a(x: 1) } mutation B { … }`).
      if (routes.some((r) => /(^|\/)graphql$/.test(r)) && (/\bmutation\b/i.test(lecture.suite()) || /query=@|--input|[$]/.test(segment))) return true;
      if (/(^|\/)graphql$/.test(route)) return false;
      const ecrit = (methode ?? (champs ? 'POST' : 'GET')) !== 'GET';
      // Un chemin qui ne se lit pas (variable, substitution, encodé, segment `..`) pourrait viser une branche : refusé en écriture.
      return ecrit && chemin !== null && (/[$%]/.test(chemin) || /(^|\/)\.\.(\/|$|[?#])/.test(chemin) || routes.some((r) => CHEMIN_GH_ECRIT.test(r)));
    });
  });
}

/**
 * Au-delà de cette taille de la commande, aucune lecture n'est jouée (ni le lecteur par jetons, ni celle de 7.9.x) :
 * la commande est refusée (échec fermé). Les deux lectures coûtent au carré de la taille sur certaines formes : une option
 * d'une lettre répétée sans fin de mot (`gh pr close 1 -ddd…!`, `git commit -nnn…!`, `git push -fff…!`, que des motifs
 * comme `-[a-zA-Z]*d[a-zA-Z]*` relisent pour chaque lettre), des accents graves, `$(…)` ou `git push ` répétés. Mesuré
 * le 2026-11-16 (ticket 48, quatre cœurs, un processus neuf par mesure, comme le hook) : à 20 000 caractères, le pire cas
 * est de 1,2 s (`gh pr close 1 -ddd…!`), 2,5 s avec deux fois plus de processus que de cœurs ; sous l'ancien plafond de
 * 100 000, la même forme prenait 26 s à 99 980 caractères. Le délai du hook est de 60 s ; `regles.test.mjs` borne le
 * pire cas à 10 s.
 */
const TAILLE_MAX_LECTURE_7_9 = 20_000;

export const RAISON_TROP_LONGUE =
  "commande trop longue pour la garde (plus de 20 000 caractères) : elle est refusée plutôt que lue à moitié. Écris le texte long dans un fichier (git commit -F <fichier>, gh … --body-file <fichier>) ou découpe la commande.";

/**
 * La lecture de 7.9.x (décisions A-51 bis et ter), reprise telle quelle de `76d90c7` : `decisionCommande` la
 * joue sur la commande d'origine, sans rien en retirer, et refuse ce qu'elle refuse. L'union est ainsi au moins
 * aussi stricte que 7.9.x par construction, refus à tort des here-docs à apostrophe compris (A-51 bis retirait
 * les corps inertes ; retirer un corps change la façon dont 7.9.x apparie ses here-docs, et une commande que bash
 * exécute passait). Ses découpages par motifs lisent large, et rattrapent des formes imbriquées
 * (`ssh h "bash -c '…'"`) que le lecteur par jetons laisse passer. Les décideurs
 * qu'elle partage avec le lecteur (`COMMANDES_INTERDITES`, raisons, options, `nomDeBranche`, `brancheGardee`,
 * `CHEMIN_GH_ECRIT`) sont ceux du module ; ses découpages et ses mémoires vivent dans cette fermeture.
 */
export const LECTURE_7_9 = (() => {
  /**
   * Ce que rendait `texte.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')` dans
   * 76d90c7, à l'identique, sans son coût : ce motif revenait en arrière sur chaque `\n\s*` pour chaque `<<`, au cube
   * de la taille (37 s pour dix `<<A` et 20 000 sauts de ligne). Ici, chaque `<<` se lit une fois ; ses terminateurs
   * possibles (un mot entier après un saut de ligne et des blancs, suivi d'un blanc ou de la fin) sont relevés une
   * fois et cherchés par dichotomie. L'égalité avec le motif est prouvée par `regles.test.mjs`.
   */
  const BLANC = /\s/;
  const MOT = /\w/;
  function sansHeredocs79(s) {
    if (!s.includes('<<')) return s;
    const n = s.length;
    const blanc = (i) => i < n && BLANC.test(s[i]);
    const mot = (i) => i < n && MOT.test(s[i]);
    // Les terminateurs possibles : après un saut de ligne et les blancs qui le suivent, un mot entier suivi d'un blanc ou
    // de la fin. Pour chacun : la position b du mot, et le dernier saut de ligne de la suite de blancs qui le précède.
    let termes = null;
    const lesTermes = () => {
      termes = new Map();
      for (let i = 0; i < n; ) {
        if (!blanc(i)) { i++; continue; }
        let j = i, nl = -1;
        while (j < n && BLANC.test(s[j])) { if (s[j] === '\n') nl = j; j++; }
        if (nl >= 0 && mot(j)) {
          let k = j;
          while (mot(k)) k++;
          if (k === n || blanc(k)) {
            const w = s.slice(j, k);
            let l = termes.get(w);
            if (!l) termes.set(w, (l = { b: [], nl: [] }));
            l.b.push(j); l.nl.push(nl);
          }
        }
        i = j;
      }
    };
    // Le premier terminateur `w` dont la suite de blancs porte un saut de ligne à partir de `depuis`.
    const terminateur = (w, depuis) => {
      if (termes === null) lesTermes();
      const l = termes.get(w);
      if (!l) return -1;
      let lo = 0, hi = l.nl.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (l.nl[m] >= depuis) hi = m; else lo = m + 1; }
      return lo < l.nl.length ? l.b[lo] : -1;
    };
    let sortie = '';
    let fin = 0;
    for (let p = s.indexOf('<<'); p >= 0; p = s.indexOf('<<', p + 1)) {
      let j = p + 2;
      if (s[j] === '-') j++;
      while (blanc(j)) j++;
      const q = s[j] === "'" || s[j] === '"' ? s[j] : '';
      const debut = j + q.length;
      let we = debut;
      while (mot(we)) we++;
      if (we === debut) continue;
      let bout = -1;
      if (q) {
        if (s[we] !== q) continue;
        const z = s.indexOf('\n', we + 1);
        if (z < 0) continue;
        const b = terminateur(s.slice(debut, we), z + 1);
        if (b >= 0) bout = b + (we - debut);
      } else {
        const z = s.indexOf('\n', we);
        if (z < 0) continue;
        for (let x = we; x > debut && bout < 0; x--) {
          const b = terminateur(s.slice(debut, x), z + 1);
          if (b >= 0) bout = b + (x - debut);
        }
      }
      if (bout < 0) continue;
      sortie += s.slice(fin, p) + '<<heredoc';
      fin = bout;
      p = bout - 1;
    }
    return fin === 0 ? s : sortie + s.slice(fin);
  }

  /**
   * Chaque ajout de la commande (`pnpm add`, `pnpm install <paquet>`) : `{ paquets, options }`. Le `(?<!\d)` (ticket 48,
   * repris d'anchorpost) évite de relancer la recherche sur chaque chiffre d'une longue suite, sans changer le
   * remplacement : une redirection qui commencerait après un chiffre commence déjà sur lui (preuve : `regles.test.mjs`).
   */
  function ajouts(code) {
    const commandes = code.replace(/(?<!\d)\d*(>>?|<)&?\s*[^\s;&|]*/g, ' ').split(/[;&|\n]+/);
    return commandes.flatMap((commande) => {
      const mots = commande.trim().split(/\s+/);
      let i = mots.findIndex((mot) => /(^|\/)pnpm$/.test(mot));
      if (i < 0) return [];
      const positionnels = [];
      // Ce qui précède pnpm (`npm_config_registry=… pnpm`, `env …`) peut changer la source.
      const options = i > 0 ? ['(préfixe)'] : [];
      for (i++; i < mots.length; i++) {
        if (!mots[i].startsWith('-')) positionnels.push(mots[i]);
        else {
          options.push(mots[i].split('=')[0]);
          if (OPTIONS_A_VALEUR.has(mots[i])) i++;
        }
      }
      const [sousCommande, ...paquets] = positionnels;
      return ['add', 'i', 'install'].includes(sousCommande) && paquets.length > 0 ? [{ paquets: paquets.map(nomDuPaquet), options }] : [];
    });
  }

  /** La commande sans son texte libre : corps de heredoc et chaînes entre guillemets. */
  function sansTexte(commande) {
    return sansHeredocs79(commande)
      .replace(/'[^']*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""');
  }

  /**
   * La commande sans ses corps de heredoc, ses guillemets ni ses barres obliques inverses, lignes continuées
   * recollées : un refspec cité se lit comme un refspec nu, `\git` comme `git`, `gh pr \⏎ merge` comme
   * `gh pr merge`. Tous les lecteurs de commandes (`pushs`, `ecritParGh`) partent de ce texte.
   */
  function sansGuillemets(commande) {
    return sansHeredocs79(commande)
      .replace(/\\\r?\n/g, ' ')
      .replace(/["'\\]/g, '');
  }

  /** Mot qui remplace une substitution dans la commande englobante : il porte `$`, donc se lit illisible. */
  const SUBSTITUTION = '$SUBSTITUTION';
  /** Le texte où chaque `$(…)`, parenthèses équilibrées (non fermée : jusqu'à la fin), devient `SUBSTITUTION`. */
  function sansSubstitutionsParenthesees(texte) {
    let sortie = '';
    for (let i = 0; i < texte.length; i++) {
      if (texte[i] !== '$' || texte[i + 1] !== '(') {
        sortie += texte[i];
        continue;
      }
      let j = i + 1;
      for (let profondeur = 0; j < texte.length; j++) {
        if (texte[j] === '(') profondeur++;
        else if (texte[j] === ')' && --profondeur === 0) break;
      }
      sortie += SUBSTITUTION + (/^[^\s;&|()]/.test(texte.slice(j + 1)) ? ' ' : '');
      i = j;
    }
    return sortie;
  }

  /**
   * Le dernier découpage : `decisionCommande` lit la même commande six fois (sujet, branche gardée, push
   * nu, force, illisible, `gh`) ; `sansGuillemets`, dont le motif de here-doc coûte, n'y passe qu'une fois.
   */
  let dernierDecoupage = { commande: null, segments: [] };

  /**
   * Les segments d'une commande shell, utilitaire commun des lecteurs de commandes (`pushs`, `ecritParGh`,
   * et `appelsGit` du ticket 28) : `{ segment, suite }`, où `suite` est le texte de la source du segment à
   * partir de lui. La commande passe d'abord par `sansGuillemets` (`\git` s'y lit `git`). Chaque
   * substitution, `$(…)` ou entre accents graves, est extraite des plus intérieures aux plus extérieures et
   * lue comme une source à part, puis remplacée dans la commande englobante par `SUBSTITUTION` :
   * `git -C "$(pwd)" push origin HEAD:sujet/x` se lit `git -C $SUBSTITUTION push origin HEAD:sujet/x`.
   * Chaque source se découpe sur `;`, `&`, `|`, saut de ligne et sous-shell `( … )`.
   * @param {string} commande la commande telle que l'outil Bash la reçoit
   * @returns {readonly { segment: string, suite: string }[]} figé : le dernier découpage est gardé pour la commande suivante identique
   */
  function segmentsDeCommande(commande) {
    if (dernierDecoupage.commande === commande) return dernierDecoupage.segments;
    // Un séparateur cité n'en est pas un (`-f message="fix(api): x"`, `-c user.name="a;b"`) : la commande se lit en
    // plus avec les séparateurs et les blancs de ses textes cités neutralisés (hors texte à substitution, lu comme
    // avant). Une lecture en plus : rien de ce que la première refuse ne passe.
    const cites = commande.replace(/'[^']*'|"(?:[^"\\$`]|\\[^$`])*"/g, (cite) => cite.replace(/[;&|()\s]/g, '_'));
    const segments = Object.freeze([...lireSegments(commande), ...(cites === commande ? [] : lireSegments(cites))].map((x) => Object.freeze(x)));
    dernierDecoupage = { commande, segments };
    return segments;
  }

  /** Le découpage d'une lecture de `segmentsDeCommande`. */
  function lireSegments(commande) {
    const decouper = (source) =>
      [...source.matchAll(/[^;&|\n()]+/g)].filter(([segment]) => segment.trim()).map(({ 0: segment, index }) => ({ segment, suite: source.slice(index) }));
    // Des accents graves échappés (`echo \`git push …\``) sont une substitution imbriquée : lus comme `$(…)` avant
    // que `sansGuillemets` retire les barres obliques inverses.
    let reste = sansGuillemets(commande.replace(/\\`([^`]*?)\\`/g, '$($1)')).replace(/`([^`]*)`/g, '$($1)');
    const segments = [];
    for (let m = /\$\(([^()]*)\)/.exec(reste); m; m = /\$\(([^()]*)\)/.exec(reste)) {
      segments.push(...decouper(m[1]));
      const apres = reste.slice(m.index + m[0].length);
      // Suivi d'une espace si un mot y est collé : `$(true)git push …` exécute `git push …`.
      reste = reste.slice(0, m.index) + SUBSTITUTION + (/^[^\s;&|()]/.test(apres) ? ' ' : '') + apres;
    }
    // Une substitution qui contient des parenthèses (`$( (pwd) )`, `$((1))`) n'est pas extraite et se découpe sur `(`
    // et `)` comme avant ; la commande englobante se lit en plus avec chacune remplacée par `SUBSTITUTION` : sans quoi
    // `git -c a.b=$((1)) push …` serait coupé avant `push`.
    const aplatie = sansSubstitutionsParenthesees(reste);
    const enPlus = aplatie === reste ? [] : decouper(aplatie);
    return [...segments, ...decouper(reste), ...enPlus];
  }

  /** Options de `git` placées avant la sous-commande et suivies d'une valeur (`git -C .. push`). */
  const OPTIONS_GIT_A_VALEUR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix', '--attr-source']);
  /** Options de `git push` suivies d'une valeur séparée : cette valeur n'est ni le remote ni un refspec. */
  const OPTIONS_PUSH_A_VALEUR = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);

  /**
   * Index du programme d'un segment : le premier mot que `motif` reconnaît, hors affectation (`X=/a/git`),
   * option (`--chdir=/w/git`) et valeur d'option suivie du vrai programme (`env -C /w/git git …`,
   * `sudo -u git gh …`) ; un chemin qui contient `=` (`./a=b/git`) reste un programme ; -1 sinon.
   */
  function indexDuProgramme(mots, motif) {
    // Le mot suivant ne compte que s'il pourrait être un programme : `git --work-tree=/x/git push` reste `git`.
    const candidat = (mot) => motif.test(mot) && !/^(-|[A-Za-z_]\w*=)/.test(mot);
    return mots.findIndex((mot, k) => candidat(mot) && !candidat(mots[k + 1] ?? ''));
  }

  /** Le découpage d'avant `segmentsDeCommande`, tel quel : guillemets retirés, accents graves lus `$(`, coupé sur `(` et `)`. */
  function segmentsDAvant(commande) {
    return sansHeredocs79(commande)
      .replace(/["']/g, '')
      .replace(/\\\r?\n/g, ' ')
      .replace(/\\(.)/g, '$1')
      .replace(/`/g, '$(')
      .split(/[;&|\n()]+/);
  }

  /**
   * Les index où lire le programme d'un segment : celui d'`indexDuProgramme`, et le premier mot que `exact`
   * reconnaît (la lecture d'avant, à la casse exacte), pour que rien de ce qu'elle refusait ne passe.
   */
  function lecturesDuProgramme(mots, motif, exact) {
    return [...new Set([indexDuProgramme(mots, motif), mots.findIndex((mot) => exact.test(mot))])].filter((i) => i >= 0);
  }

  /**
   * Chaque `git push` de la commande, `git` nu ou par son chemin (`/usr/bin/git`), avec ou sans options
   * (`git -C . push`, `git -c x=y push`), derrière n'importe quel préfixe (`timeout 5 git push`), dans
   * un sous-shell ou une substitution (`(…)`, `$(…)`, accents graves) : ses refspecs, c'est-à-dire les
   * positionnels après le remote (tous, si `--repo` porte le remote), et `tout` pour `--all`,
   * `--mirror` ou `--branches`. Les guillemets sont retirés d'abord : `"HEAD:sujet/x"` vise le même sujet
   * que `HEAD:sujet/x`. Seul le premier `git` d'un segment compte : `git commit -m "… git push …"` n'est
   * pas un push.
   */
  function pushs(commande) {
    if (derniersPushs.commande !== commande) derniersPushs = { commande, pushs: Object.freeze(lirePushs(commande)) };
    return derniersPushs.pushs;
  }

  /**
   * Les derniers `pushs` lus : `decisionCommande` les demande six fois pour la même commande (sujet, nom
   * illisible, branche gardée, push nu, force, illisible) ; la lecture, qui coûte, n'est faite qu'une fois.
   */
  let derniersPushs = { commande: null, pushs: [] };

  /** La lecture de `pushs`, sans mémoire. */
  function lirePushs(commande) {
    // Le découpage de `segmentsDeCommande`, et en plus celui d'avant (texte qui suit une substitution lu comme un
    // segment à part : `sudo -u git $(true) git push …`), pour que rien de ce qu'il refusait ne passe.
    return [...segmentsDeCommande(commande).map(({ segment }) => segment), ...segmentsDAvant(commande)]
      .flatMap((segment) => {
        const mots = segment.trim().split(/\s+/);
        // Deux lectures du programme : la prudente, et celle d'avant (premier `git` à la casse exacte), pour que
        // rien de ce qu'elle refusait ne passe (`sudo -u GIT -H git push …`).
        return lecturesDuProgramme(mots, /(^|[/$])git$/i, /(^|\/)git$/).flatMap((i) => {
          let j = i + 1;
          while (j < mots.length && mots[j].startsWith('-')) j += OPTIONS_GIT_A_VALEUR.has(mots[j]) ? 2 : 1;
          if (mots[j]?.toLowerCase() !== 'push') return [];
          const positionnels = [];
          let tout = false;
          let remoteEnOption = false;
          let force = false;
          let illisible = false;
          for (let k = j + 1; k < mots.length; k++) {
            const mot = mots[k];
            if (/[$`]/.test(mot)) illisible = true;
            if (!mot.startsWith('-')) {
              positionnels.push(mot);
              continue;
            }
            if (/^--(all|mirror|branches)$/.test(mot)) tout = true;
            // Git accepte les abréviations non ambiguës (`--force-w`, `--force-wi`, `--force-i`) ; `--for…` les couvre
            // toutes, et refuse aussi `--forc`, que git rejette comme ambigu : prudence sans coût.
            if (/^(--for[a-z-]*(=.*)?|-[a-zA-Z]*f[a-zA-Z]*)$/.test(mot)) force = true;
            if (/^--repo(=|$)/.test(mot)) remoteEnOption = true;
            if (OPTIONS_PUSH_A_VALEUR.has(mot)) k++;
          }
          const refspecs = remoteEnOption ? positionnels : positionnels.slice(1);
          return [{ refspecs, tout, illisible, force: force || refspecs.some((refspec) => refspec.startsWith('+')) }];
        });
      });
  }

  /** La branche distante qu'écrit un refspec ; `HEAD` ou `@` seuls poussent la branche courante. */
  function destination(refspec, brancheCourante) {
    const cible = refspec.replace(/^\+/, '').split(':').pop() ?? '';
    return cible === 'HEAD' || cible === '@' ? (brancheCourante() ?? '') : cible;
  }

  /**
   * Vrai si un `git push` de la commande a pour destination une branche de sujet : `HEAD:sujet/x`,
   * `HEAD:refs/heads/sujet/x`, `sujet/x` seul, cités ou non, ou `HEAD` depuis une branche `sujet/…`.
   * Un sujet ne s'écrit que par `sujet.sh` (que le hook ne voit pas, il lance un script) : sans ce
   * refus, une session écrirait elle-même, sur le sujet, la ligne `Dépendances:` qui l'autorise (faille
   * relevée en contre-revue, puis en revue de sécurité : la première version ne refusait que depuis une
   * branche de ticket, et laissait passer un refspec entre guillemets, `git -C`, `git` par son chemin,
   * une autre branche courante, ou `git` derrière un préfixe comme `timeout 5`).
   */
  function pousseSurUnSujet(commande, brancheCourante = () => null) {
    return pushs(commande).some(({ refspecs }) => refspecs.some((refspec) => (nomDeBranche(destination(refspec, brancheCourante)) ?? '').startsWith('sujet/')));
  }

  /** Vrai si un `git push` de la commande vise un nom que `nomDeBranche` ne lit pas (`./feat/x`, `feat/./x`, `develop/`). */
  function pousseVersUnNomIllisible(commande, brancheCourante = () => null) {
    return pushs(commande).some(({ refspecs }) =>
      refspecs.some((refspec) => {
        const cible = destination(refspec, brancheCourante);
        return Boolean(cible) && cible !== 'HEAD' && nomDeBranche(cible) === null;
      }),
    );
  }

  /**
   * Vrai si un `git push` de la commande écrit une branche gardée (`brancheGardee` : sujet, `develop`,
   * `main`, branche par défaut), sous toutes ses graphies (`HEAD:refs/heads/develop`, `HEAD:heads/develop`,
   * `HEAD:DEVELOP`), ou pousse sans refspec, ou vers `HEAD`, depuis une telle branche. Une destination
   * vide (branche courante inconnue) n'est pas lue ici. `develop:feat/x` écrit `feat/x` : il passe.
   */
  function pousseSurUneBrancheGardee(commande, brancheCourante = () => null, brancheParDefaut = () => null) {
    let parDefaut;
    const defaut = () => (parDefaut === undefined ? (parDefaut = brancheParDefaut()) : parDefaut);
    // `develop`, `main` et les sujets se lisent sans la branche par défaut : elle n'est demandée que pour un autre nom.
    const gardee = (b) => Boolean(b) && b !== 'HEAD' && (brancheGardee(b) || brancheGardee(b, defaut()));
    return pushs(commande).some(({ refspecs }) =>
      refspecs.length === 0 ? gardee(brancheCourante()) : refspecs.some((refspec) => gardee(destination(refspec, brancheCourante))),
    );
  }

  /**
   * Vrai si un `git push` de la commande a un refspec qu'on ne peut pas lire : variable ou
   * substitution, destination en motif (`refs/heads/*`), ou `--all`, `--mirror`, `--branches`.
   */
  function pushIllisible(commande) {
    return pushs(commande).some(
      ({ refspecs, tout, illisible }) => tout || illisible || refspecs.some((refspec) => /[$`]/.test(refspec) || /[*?[{]/.test(destination(refspec, () => null))),
    );
  }

  /**
   * Vrai si un `git push` de la commande force : `--force`, `--force-with-lease`, `--force-if-includes`,
   * leurs abréviations (`--force-w`), avec ou sans valeur, `-f` seul ou groupé (`-uf`), ou un refspec
   * `+…`, cité ou non. Aucune branche n'en est exemptée : les règles du produit interdisent tout push forcé.
   */
  const pousseEnForce = (commande) => pushs(commande).some(({ force }) => force);

  /** Vrai si un `git push` de la commande n'a aucun refspec : il pousse la branche courante vers son amont. */
  function pushSansRefspec(commande) {
    return pushs(commande).some(({ refspecs }) => refspecs.length === 0);
  }

  /**
   * Décision sur une commande shell : `{ decision: 'refuser', raison }`, ou `null`. Le hook ne demande
   * jamais rien à un humain : ce qu'il ne laisse pas passer, il le refuse et dit quoi faire.
   * @param {{ dependancesPrevues?: () => string[] | null, brancheCourante?: () => string | null }} [contexte]
   *   Tout `git push` vers un `sujet/…` est refusé, quelle que soit la branche courante : un sujet ne
   *   s'écrit que par `sujet.sh`, sans quoi la session écrirait elle-même la ligne qui l'autorise. Un
   *   `git push` sans refspec, ou vers `HEAD`, depuis une branche `sujet/…` (`brancheCourante`, lue
   *   une fois au plus) l'est aussi ; un refspec illisible (variable, substitution, motif, `--all`)
   *   l'est aussi.
   *   `dependancesPrevues` : paquets de la ligne `Dépendances:` du ticket de la branche, lue sur le
   *   sujet (`null` si introuvable) ; appelée seulement si la commande ajoute un paquet. Une commande
   *   passe sans question quand chacun de ses paquets y figure et qu'aucune option ne change la source
   *   (`--registry`, `--config.*`) ; un seul paquet absent ou une telle option, et elle est refusée.
   */
  function decisionCommande(commande, { dependancesPrevues = () => null, brancheCourante = () => null, brancheParDefaut = () => null } = {}) {
    const code = sansTexte(commande);
    // Aussi sur la commande aux mots dénudés : un mot cité seul (`"git"`, `$'git'`, `"--no-verify"`), des
    // guillemets vides ou une barre oblique inverse dans un mot (`g''it`, `g\it`) ne cachent pas un motif.
    const nu = sansTexte(motsDenudes(commande));
    for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code) || motif.test(nu)) return { decision: 'refuser', raison };
    let branche;
    const courante = () => (branche === undefined ? (branche = brancheCourante()) : branche);
    if (pousseSurUnSujet(commande, courante)) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
    if (pushSansRefspec(commande) && (courante() ?? '').startsWith('sujet/')) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
    if (pousseVersUnNomIllisible(commande, courante)) return { decision: 'refuser', raison: RAISON_NOM_ILLISIBLE };
    if (pousseSurUneBrancheGardee(commande, courante, brancheParDefaut)) return { decision: 'refuser', raison: RAISON_PUSH_GARDEE };
    if (pousseEnForce(commande)) return { decision: 'refuser', raison: RAISON_PUSH_FORCE };
    if (ecritParGh(commande)) return { decision: 'refuser', raison: RAISON_GH_ECRIT };
    if (pushIllisible(commande)) return { decision: 'refuser', raison: RAISON_PUSH_ILLISIBLE };
    const liste = ajouts(code);
    if (liste.length === 0) return null;
    const sansRisque = liste.every(({ options }) => options.every((o) => OPTIONS_SANS_RISQUE.has(o)));
    const prevues = sansRisque ? dependancesPrevues() : null;
    const paquets = liste.flatMap((a) => a.paquets);
    if (Array.isArray(prevues) && paquets.every((p) => prevues.includes(p))) return null;
    return { decision: 'refuser', raison: RAISON_DEPENDANCE };
  }

  /**
   * La commande aux mots dénudés, pour les motifs de `COMMANDES_INTERDITES` : lignes continuées recollées,
   * barres obliques inverses et guillemets vides retirés, un mot cité seul (sans blanc) sans ses guillemets ni
   * le `$` d'une citation ANSI-C (`$'git'`). Un texte cité qui porte un blanc reste un texte.
   */
  function motsDenudes(commande) {
    return commande
      .replace(/\\\r?\n/g, ' ')
      .replace(/\\/g, '')
      .replace(/(['"])\1/g, '')
      .replace(/\$?(['"])([^\s'"$`]+)\1/g, '$2');
  }

  /**
   * Vrai si la commande écrit une branche, un fichier ou une règle de branche par `gh` : `gh pr merge`,
   * `gh pr close -d`, `gh repo sync`, `gh alias set` et `gh alias import` (avec ou sans `-R`/`--repo`,
   * avant ou après la sous-commande) ; `gh api` vers une route de `CHEMIN_GH_ECRIT`, ou vers un chemin
   * illisible (variable, substitution, encodé), avec une méthode autre que GET (explicite, ou implicite : un
   * champ `-f`/`-F` ou `--input` fait un POST) ; `gh api graphql` (ou la route `/graphql`) dont la requête,
   * cherchée dans la commande à partir de `gh`, est une mutation ou ne se lit pas (`query=@fichier`,
   * `--input`, variable).
   */
  function ecritParGh(commande) {
    return segmentsDeCommande(commande).some(({ segment, suite }) => {
      // `-i` est la seule option booléenne courte de `gh api` : `-iX PUT`, `-iXPUT`, `-ifk=v` se lisent `-X`, `-f`.
      const mots = segment.trim().split(/\s+/).map((mot) => mot.replace(/^-i+(?=[XfF])/, '-'));
      // Seul le premier programme du segment compte : `git commit -m "gh pr merge 3"` n'est pas une fusion.
      // `$'gh'` se lit `$gh` sans ses guillemets ; un système de fichiers insensible à la casse lance `GH`.
      return lecturesDuProgramme(mots, /(^|[/$])(gh|git)$/i, /(^|\/)(gh|git)$/).some((i) => {
        if (!/(^|[/$])gh$/i.test(mots[i])) return false;
        // Positionnels après `gh`, sans `-R`, `--repo`, `--hostname` ni leur valeur : `gh -R o/r pr merge 3` est `pr merge`.
        const pos = [];
        for (let k = i + 1; k < mots.length; k++) {
          if (mots[k] === '-R' || mots[k] === '--repo' || mots[k] === '--hostname') k++;
          else if (!mots[k].startsWith('-')) pos.push(mots[k]);
        }
        if ((pos[0] === 'pr' && (pos[1] === 'merge' || pos[1] === 'update-branch')) || (pos[0] === 'repo' && pos[1] === 'sync')) return true;
        if (pos[0] === 'alias' && (pos[1] === 'set' || pos[1] === 'import')) return true;
        if (pos[0] === 'pr' && pos[1] === 'close' && mots.some((mot) => /^(-[a-zA-Z]*d[a-zA-Z]*|--delete-branch)(=.*)?$/.test(mot))) return true;
        if (pos[0] !== 'api') return false;
        let chemin = null;
        const positionnels = [];
        let methode = null;
        let champs = false;
        for (let k = mots.indexOf('api', i + 1) + 1; k < mots.length; k++) {
          const mot = mots[k];
          if (!mot.startsWith('-')) {
            chemin ??= mot;
            positionnels.push(mot);
            continue;
          }
          const [option, valeurJointe] = mot.split(/=(.*)/s);
          const valeur = valeurJointe ?? (OPTIONS_GH_API_A_VALEUR.has(option) ? mots[++k] : undefined);
          if (option === '-X' || option === '--method') methode = String(valeur ?? '').toUpperCase();
          else if (/^-X./.test(mot)) methode = mot.slice(2).toUpperCase();
          // `-fcle=valeur` : un champ collé à son option fait un POST comme `-f cle=valeur`.
          if (['-f', '--raw-field', '-F', '--field', '--input'].includes(option) || /^-[fF]./.test(option)) champs = true;
        }
        // Route lue comme gh l'enverra : hôte, barres de tête, de fin, doublées et `./` retirés, requête et fragment
      // (`#…`, jamais envoyé) coupés, en minuscules.
        const routeDe = (c) => c.replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/\/(\.\/)+/g, '/').replace(/\/{2,}/g, '/').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').toLowerCase();
        const route = routeDe(chemin ?? '');
        // Un champ cité à blancs placé avant la route (`-f message="add file" … repos/…/contents/a`) laisse des mots
        // devant elle : chaque positionnel qui a la forme d'une route (`repos/…`, `graphql`, une URL) compte aussi.
        const routes = [route, ...positionnels.slice(1).filter((p) => /^(\/?repos\/|\/?graphql$|[a-z]+:\/\/)/i.test(p)).map(routeDe)];
        // La mutation se cherche de `gh` à la fin de la commande : ni avant (un message de commit), ni bornée au
        // segment (la découpe sur `(` couperait `query A { a(x: 1) } mutation B { … }`).
        if (routes.some((r) => /(^|\/)graphql$/.test(r)) && (/\bmutation\b/i.test(suite) || /query=@|--input|[$]/.test(segment))) return true;
        if (/(^|\/)graphql$/.test(route)) return false;
        const ecrit = (methode ?? (champs ? 'POST' : 'GET')) !== 'GET';
        // Un chemin qui ne se lit pas (variable, substitution, encodé, segment `..`) pourrait viser une branche : refusé en écriture.
        return ecrit && chemin !== null && (/[$%]/.test(chemin) || /(^|\/)\.\.(\/|$|[?#])/.test(chemin) || routes.some((r) => CHEMIN_GH_ECRIT.test(r)));
      });
    });
  }

  return Object.freeze({ decisionCommande, sansHeredocs79 });
})();
