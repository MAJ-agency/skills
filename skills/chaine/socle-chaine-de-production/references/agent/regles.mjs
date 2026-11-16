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
  const c = chemin.replace(/\\/g, '/').replace(/^\.\//, '');
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
export const paquetsAjoutes = (code) => lireCommande(code).textes.flatMap(ajouts).flatMap(({ paquets }) => paquets);

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
  "un sujet ne se pousse jamais à la main, quelle que soit la branche : seul sujet.sh y écrit (demarrer, rafraichir, fusionner, livrer, carte). Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. Pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
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
  exp(brut) {
    const mot = this.mot;
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
          b.exp();
          return;
        }
      }
      this.i += 2;
      this.substitution();
      b.exp();
    } else if (n === '{') {
      const debut = this.i;
      this.i += 2;
      this.plonger(() => this.accolade());
      b.exp(s.slice(debut, this.i));
    } else if (debutDeNom(n ?? '')) {
      const debut = this.i;
      this.i += 2;
      while (suiteDeNom(s[this.i] ?? '')) this.i++;
      b.exp(s.slice(debut, this.i));
    } else if (n !== undefined && '0123456789@*#?$!-'.includes(n)) {
      this.i += 2;
      b.exp(s.slice(this.i - 2, this.i));
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
        b.exp();
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
    const mot = { valeur: '', expansion: false, brut: '', cite: false, texte: '', blancCite: false, queue: null, litteral: false, debut };
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
          b.exp();
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
 * Une lecture d'une commande simple, pour les décideurs de `git push` et de `gh` : ses mots, son texte, et
 * `suite()`, le source à partir de cette commande.
 */
class Lecture {
  constructor(mots, segment, source, debut) {
    this.mots = mots;
    this.segment = segment;
    this.source = source;
    this.debut = debut;
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
    lectures: Object.freeze(eclate.map(({ segment, mots }) => new Lecture(mots, segment, { suite: () => commande }, 0))),
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
 *   lectures: readonly { mots: string[], segment: string, suite(): string }[],
 *   segments: readonly { segment: string, suite: string }[],
 *   sansTexte: string,
 * }}
 * - `commandes` : les commandes simples, dans l'ordre du source ; `debut`, leur position dans la commande
 *   (celle du mot ou du corps qui les porte, pour un accent grave, un `-c`, un `eval` ou un corps `<<-`). Un
 *   `Mot` : `{ valeur, expansion, brut, cite }` — `valeur` sans guillemets, `$SUBSTITUTION` s'il porte une
 *   expansion ; `brut`, son texte dans la source ; `cite`, s'il a une partie citée. Un here-string porte son
 *   mot en `contenu`.
 * - `heredocs` : tous les here-docs et here-strings, ceux d'une commande composée (`{ …; } <<EOF`, `done <<EOF`)
 *   compris, dans l'ordre de lecture, chacun avec sa lecture retenue.
 * - `prudences` : les corps relus par prudence, guillemets et barres obliques inverses retirés, accents graves lus
 *   comme des `;` ; chacun de leurs segments passe par tous les décideurs, comme un `textes` et une `lectures`.
 * - `textes` (L3) : les mots de chaque commande simple, mots réservés retirés, affectations gardées, un mot dont
 *   une partie citée porte un blanc ou un séparateur lu `""`, un mot à expansion lu par son texte (paramètres
 *   gardés, substitutions en `$SUBSTITUTION`) ; c'est ce que lisent `COMMANDES_INTERDITES` et
 *   les ajouts de dépendances. Les valeurs d'un tableau (`a=(git push -f)`) s'y lisent comme une commande.
 * - `lectures` (L1 et L2) : ce que lisent les décideurs de `git push` et de `gh` — les mots de chaque commande
 *   simple (L1), sa lecture éclatée (L2 : valeurs jointes, recoupées sur les blancs et les séparateurs, puis
 *   relues dénudées, sans guillemets ni barres obliques inverses, accents graves coupant le segment), le
 *   texte qui suit chaque mot à expansion relu comme un début de commande (son premier segment, en temps
 *   linéaire), les valeurs des tableaux, et les corps relus par prudence ;
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
  const lireMots = (m, debut) => {
    const s = m.join(' ');
    if (s.includes('g') || s.includes('G')) lectures.push(new Lecture(m, s, tete, debut));
  };
  /** Les mots d'une commande simple (ou les valeurs d'un tableau), en L1, L2 et L3. */
  const lireElements = (elements, debut) => {
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
    lireMots(l1, debut);
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
      for (const { segment: s, mots: m } of eclater(texte)) f(s, m);
      const nu = denuder(texte);
      if (nu !== texte) for (const { segment: s, mots: m } of eclater(nu)) f(s, m);
    };
    eclaterDeuxFois(textesDesElements.join(' '), (s, m) => {
      if (m.length !== l1.length || m.some((x, k) => x !== l1[k])) lectures.push(new Lecture(m, s, tete, debut));
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
      eclaterDeuxFois(s, (seg, m) => lectures.push(new Lecture(m, seg, tete, debut)));
    }
  };
  for (let n = 0; n < lu.commandes.length; n++) {
    const cmd = lu.commandes[n];
    lireElements(lu.elements[n], cmd.debut);
    // Les valeurs d'un tableau (`a=(git push -f)`) : `"${a[@]}"` les lance comme une commande.
    for (const valeurs of cmd.tableaux) lireElements(valeurs, cmd.debut);
    if (budget < 0) return lectureIllisible(commande, 'commande trop coûteuse à lire');
  }
  // Un corps relu par prudence passe par tous les décideurs : push et gh (L2), `COMMANDES_INTERDITES` et
  // dépendances (ses segments, lus comme les mots d'une commande).
  for (const { texte, segments: s } of prudences) {
    const source = { suite: () => texte };
    for (const { segment, mots } of s) {
      lectures.push(new Lecture(mots, segment, source, 0));
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

/** La lecture de `pushs`, sans mémoire, sur les mots des lectures. */
function lirePushs(lectures) {
  return lectures.flatMap(({ mots, segment }) =>
    !/git/i.test(segment) ? [] :
    // Deux lectures du programme : la prudente, et celle d'avant (premier `git` à la casse exacte), pour que
    // rien de ce qu'elle refusait ne passe (`sudo -u GIT -H git push …`).
    lecturesDuProgramme(mots, /(^|[/$])git$/i, /(^|\/)git$/).flatMap((i) => {
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
    }),
  );
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
  return pushs(commande).some(
    ({ refspecs, tout, illisible }) => tout || illisible || refspecs.some((refspec) => /[$`]/.test(refspec) || /[*?[{]/.test(destination(refspec, () => null))),
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
export function decisionCommande(commande, { dependancesPrevues = () => null, brancheCourante = () => null, brancheParDefaut = () => null } = {}) {
  const lu = lireCommande(commande);
  // Ce que le lecteur ne sait pas lire est refusé avant tout autre refus : il ne devine pas.
  if (lu.illisible) return { decision: 'refuser', raison: RAISON_ILLISIBLE };
  // Chaque commande simple en lecture L3 : un mot cité seul (`"git"`, `$'git'`, `"--no-verify"`) se lit sans ses
  // guillemets, un texte cité qui porte un blanc ou un séparateur se lit `""`.
  for (const mots of lu.textes) {
    const code = mots.join(' ');
    // Chaque motif nomme npm, yarn ou git : un texte qui n'en porte aucun n'est pas relu motif par motif.
    if (!/npm|yarn|git/i.test(code)) continue;
    for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code)) return { decision: 'refuser', raison };
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
  const liste = lu.textes.flatMap(ajouts);
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
