/**
 * Règles des hooks Claude Code du projet (ADR « chaîne de production »), en fonctions pures : les
 * scripts de hook (garde-fichiers, garde-commandes) les appliquent, et `regles.test.mjs` les éprouve
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
export function refusEdition(chemin, { migrationExistante, migrations = CHAINE.migrations ?? 'apps/api/src/db/migrations/' }) {
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
  [/(^|[;&|]\s*|\s)npm\s+(i|install|ci|add|uninstall|update)\b/, 'npm : le gestionnaire du projet est pnpm.'],
  [/(^|[;&|]\s*|\s)yarn(\s|$)/, 'yarn : le gestionnaire du projet est pnpm.'],
  [/\bgit\s+push\b[^;&|]*\s(--force(?!-with-lease)|-f)(\s|$)/, "git push --force : interdit (réécrit l'historique partagé). --force-with-lease sur sa propre branche seulement."],
  [/\bgit\s+(commit|push)\b[^;&|]*\s--no-verify\b/, "--no-verify : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  [/\bgit\s+push\b[^;&|]*[\s:](develop|main)(\s|$)/, 'pousser sur develop ou main : jamais directement, une PR passe par le capitaine de fusion.'],
  [/\bgit\s+(rebase|reset\s+--hard)\b[^;&|]*\b(origin\/)?(develop|main|sujet\/)/, 'rebase ou reset --hard sur une branche partagée : jamais ; un sujet se rafraîchit par merge (sujet.sh rafraichir).'],
];

const RAISON_DEPENDANCE =
  "Nouvelle dépendance : vérifier qu'elle existe depuis longtemps, ses mainteneurs, ses téléchargements, et qu'aucun code interne ne suffit. Un paquet prévu par la ligne `Dépendances:` du ticket, sur le sujet, passe sans question.";

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
 * `.npmrc` d'un autre dossier)… demandent toujours.
 */
const OPTIONS_SANS_RISQUE = new Set(['-D', '--save-dev', '-P', '--save-prod', '-O', '--save-optional', '-E', '--save-exact', '--save-peer', '-w', '--workspace-root', '--filter', '-F', '--prefer-offline', '--offline']);

/** Chaque ajout de la commande (`pnpm add`, `pnpm install <paquet>`) : `{ paquets, options }`. */
function ajouts(code) {
  const commandes = code.replace(/\d*(>>?|<)&?\s*[^\s;&|]*/g, ' ').split(/[;&|\n]+/);
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

/**
 * Paquets qu'ajoute la commande (`pnpm add <paquet>`, `pnpm install <paquet>`), noms sans version.
 * Un chemin, une URL ou un alias reste tel quel : il ne figure dans aucune ligne `Dépendances:`.
 */
export const paquetsAjoutes = (code) => ajouts(code).flatMap(({ paquets }) => paquets);

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

/**
 * Préfixe d'identifiant de la convention `tickets` : même motif que `PREFIXE` de
 * `scripts/docs/identifiants.mjs`, recopié ici pour que les hooks qui lisent ce module (garde-fichiers,
 * apres-edition, fin-de-tour) ne dépendent pas d'un autre skill.
 */
const PREFIXE_TICKET = '[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*';

/**
 * Identifiant du ticket porté par une branche de ticket (`docs/agents/issue-tracker.md`,
 * « Réserver un ticket ») : `feat/soc-1-04-hook` → `SOC-1.04`, `feat/all-fof-12-03-x` → `ALL-FOF-12.03`.
 * Branche de sujet, sans identifiant ou détachée (`HEAD`) → `null`.
 */
const BRANCHE_DE_TICKET = new RegExp(`^[a-z]+/(${PREFIXE_TICKET})-(\\d+)-(\\d{2})(?:-|$)`);

export function identifiantDeBranche(branche) {
  const m = BRANCHE_DE_TICKET.exec(branche ?? '');
  if (!m || (branche ?? '').startsWith('sujet/')) return null;
  return `${m[1].toUpperCase()}-${m[2]}.${m[3]}`;
}

/** La commande sans son texte libre : corps de heredoc et chaînes entre guillemets. */
export function sansTexte(commande) {
  return commande
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

const RAISON_PUSH_SUJET = 'une branche de ticket ne pousse jamais sur un sujet : le capitaine y squashe les sous-PR (sujet.sh).';

/**
 * Vrai si un `git push` de la commande a pour destination une branche de sujet : `HEAD:sujet/x`,
 * `HEAD:refs/heads/sujet/x`, ou `sujet/x` seul. Sans ce refus, une session écrirait elle-même, sur
 * le sujet, la ligne `Dépendances:` qui l'autorise (faille relevée en contre-revue).
 */
export function pousseSurUnSujet(code) {
  return code.split(/[;&|\n]+/).some((commande) => {
    const mots = commande.trim().split(/\s+/);
    const i = mots.findIndex((mot, k) => mot === 'push' && mots[k - 1] === 'git');
    if (i < 0) return false;
    const positionnels = mots.slice(i + 1).filter((mot) => !mot.startsWith('-'));
    return positionnels.slice(1).some((refspec) => /^\+?(refs\/heads\/)?sujet\//.test(refspec.split(':').pop() ?? ''));
  });
}

/**
 * Décision sur une commande shell : `{ decision: 'refuser' | 'demander', raison }`, ou `null`.
 * @param {{ dependancesPrevues?: () => string[] | null, brancheCourante?: () => string | null }} [contexte]
 *   `brancheCourante` : branche de la session ; depuis une branche de ticket, un `git push` vers un
 *   `sujet/…` est refusé, sans quoi la session écrirait elle-même la ligne qui l'autorise.
 *   `dependancesPrevues` : paquets de la ligne `Dépendances:` du ticket de la branche, lue sur le
 *   sujet (`null` si introuvable) ; appelée seulement si la commande ajoute un paquet. Une commande
 *   passe sans question quand chacun de ses paquets y figure et qu'aucune option ne change la source
 *   (`--registry`, `--config.*`) ; un seul paquet absent ou une telle option, et elle demande.
 */
export function decisionCommande(commande, { dependancesPrevues = () => null, brancheCourante = () => null } = {}) {
  const code = sansTexte(commande);
  for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code)) return { decision: 'refuser', raison };
  if (pousseSurUnSujet(code) && identifiantDeBranche(brancheCourante())) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  const liste = ajouts(code);
  if (liste.length === 0) return null;
  const sansRisque = liste.every(({ options }) => options.every((o) => OPTIONS_SANS_RISQUE.has(o)));
  const prevues = sansRisque ? dependancesPrevues() : null;
  const paquets = liste.flatMap((a) => a.paquets);
  if (Array.isArray(prevues) && paquets.every((p) => prevues.includes(p))) return null;
  return { decision: 'demander', raison: RAISON_DEPENDANCE };
}

/** Un fichier que le hook d'après-édition passe à Prettier puis ESLint. */
export const lintable = (chemin) =>
  /\.(ts|tsx|mjs|js)$/.test(chemin) && !/(^|\/)(node_modules|dist|\.next|\.expo|coverage|\.turbo)\//.test(chemin);
