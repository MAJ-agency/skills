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

const RAISON_DEPENDANCE = "Nouvelle dépendance : vérifier qu'elle existe depuis longtemps, ses mainteneurs, ses téléchargements, et qu'aucun code interne ne suffit.";

/** Options de pnpm suivies d'une valeur, qu'il ne faut pas prendre pour un paquet. */
const OPTIONS_A_VALEUR = new Set(['--filter', '-F', '--dir', '-C', '--reporter', '--loglevel', '--store-dir', '--modules-dir', '--lockfile-dir', '--network-concurrency', '--child-concurrency']);

/** Vrai si la commande ajoute un paquet (`pnpm add <paquet>`, `pnpm install <paquet>`). */
export function ajouteUneDependance(code) {
  const commandes = code.replace(/\d*(>>?|<)&?\s*[^\s;&|]*/g, ' ').split(/[;&|\n]+/);
  return commandes.some((commande) => {
    const mots = commande.trim().split(/\s+/);
    let i = mots.findIndex((mot) => /(^|\/)pnpm$/.test(mot));
    if (i < 0) return false;
    const positionnels = [];
    for (i++; i < mots.length; i++) {
      if (!mots[i].startsWith('-')) positionnels.push(mots[i]);
      else if (OPTIONS_A_VALEUR.has(mots[i])) i++;
    }
    const [sousCommande, ...paquets] = positionnels;
    return ['add', 'i', 'install'].includes(sousCommande) && paquets.length > 0;
  });
}

/** La commande sans son texte libre : corps de heredoc et chaînes entre guillemets. */
export function sansTexte(commande) {
  return commande
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

/** Décision sur une commande shell : `{ decision: 'refuser' | 'demander', raison }`, ou `null`. */
export function decisionCommande(commande) {
  const code = sansTexte(commande);
  for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code)) return { decision: 'refuser', raison };
  if (ajouteUneDependance(code)) return { decision: 'demander', raison: RAISON_DEPENDANCE };
  return null;
}

/** Un fichier que le hook d'après-édition passe à Prettier puis ESLint. */
export const lintable = (chemin) =>
  /\.(ts|tsx|mjs|js)$/.test(chemin) && !/(^|\/)(node_modules|dist|\.next|\.expo|coverage|\.turbo)\//.test(chemin);
