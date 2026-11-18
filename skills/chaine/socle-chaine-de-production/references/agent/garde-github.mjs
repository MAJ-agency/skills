#!/usr/bin/env node
/**
 * Hook PreToolUse (outils GitHub d'écriture, par MCP) : la même garde que `garde-commandes` pour git,
 * sur les outils qui écrivent une branche sans passer par git (push_files, create_or_update_file,
 * delete_file, create_branch), qui fusionnent une PR (merge_pull_request, enable_pr_auto_merge) ou qui
 * la mettent à jour en écrivant sur sa tête (update_pull_request_branch). Il refuse et dit quoi faire, il
 * ne demande jamais rien à un humain. Une entrée qu'il ne sait pas lire (vide, `null`, JSON illisible,
 * outil hors des sept de son matcher) est refusée : il échoue fermé.
 */
import { execFileSync } from 'node:child_process';

// Ticket 18 : la garde ne s'ouvre jamais. Ses modules se chargent en dynamique protégé, avant toute autre chose, et
// chaque nom lu est vérifié : un module cassé (tronqué, qui lève à son évaluation, ou qui se charge sans l'export
// attendu) fait refuser l'outil (sortie 2) en une ligne qui dit comment sortir. Filet : toute autre erreur non
// rattrapée refuse aussi, jamais la sortie 1 d'une trace de Node. Le code est ici, et pas dans un module commun, qui
// pourrait être cassé lui aussi.
/** Comment sortir : jamais en contournant la garde. */
const RESTAURER =
  "La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/";
const cause = (e) => String(e?.message ?? e).split('\n')[0];
const refuser = (texte) => {
  process.stderr.write(`garde-github : ${texte}\n`);
  process.exit(2);
};
process.on('uncaughtException', (e) => refuser(`erreur inattendue (${cause(e)}) : tout outil est refusé, la garde ne s'ouvre jamais sur une erreur. ${RESTAURER}`));
process.on('unhandledRejection', (e) => refuser(`erreur inattendue (${cause(e)}) : tout outil est refusé, la garde ne s'ouvre jamais sur une erreur. ${RESTAURER}`));
const echec = (fichier, raison) => refuser(`scripts/agent/${fichier} ne se charge pas (${raison}) : tout outil est refusé tant qu'il n'est pas restauré, la garde ne s'ouvre jamais sur un fichier cassé. ${RESTAURER}`);
/** Le module, chaque nom de `attendus` présent avec son type (`function`, `string`, `object`), ou l'échec. */
const charger = async (fichier, attendus) => {
  let m;
  try {
    m = await import(`./${fichier}`);
  } catch (e) {
    return echec(fichier, cause(e));
  }
  for (const [nom, type] of Object.entries(attendus)) if (typeof m[nom] !== type || m[nom] === null) return echec(fichier, `export ${nom} absent ou qui n'est pas ${type === 'object' ? 'un objet' : type === 'string' ? 'une chaîne' : 'une fonction'}`);
  return m;
};
const { brancheParDefaut, lireEntree, RACINE } = await charger('entree.mjs', { brancheParDefaut: 'function', lireEntree: 'function', RACINE: 'string' });
const { decisionOutilGithub, OUTILS_GITHUB_GARDES } = await charger('regles.mjs', { decisionOutilGithub: 'function', OUTILS_GITHUB_GARDES: 'object' });

/** Un nom de dépôt ou de propriétaire : chaîne de `[\w.-]`, qui ne commence pas par un point. */
const nomGithub = (v) => typeof v === 'string' && /^(?!\.)[\w.-]+$/.test(v);
/** Un nom de branche rendu par GitHub : `[\w./-]`, ni en tête un point ou un tiret, ni `..`. */
const nomDeRef = (v) => /^(?![.-])[\w./-]+$/.test(v) && !v.includes('..');

/**
 * Tête et base de la PR visée, en un appel de l'API REST (`gh api`) ; `null` si elles ne se lisent pas :
 * `owner` ou `repo` absents ou hors de `[\w.-]` (ou commençant par un point), numéro qui n'est pas un
 * entier positif (un nombre, pas un texte), gh absent, refusé, délai de 10 s, ou réponse dont l'une des
 * deux n'a pas la forme d'un nom de branche.
 */
function refsDeLaPr({ owner, repo, pullNumber } = {}) {
  if (!nomGithub(owner) || !nomGithub(repo) || !Number.isSafeInteger(pullNumber) || pullNumber <= 0) return null;
  try {
    const lignes = execFileSync('gh', ['api', `repos/${owner}/${repo}/pulls/${pullNumber}`, '--jq', '.head.ref, .base.ref'], {
      cwd: RACINE,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10_000,
    }).split('\n');
    const [tete, base] = lignes;
    return lignes.length === 3 && lignes[2] === '' && [tete, base].every(nomDeRef) ? { tete, base } : null;
  } catch {
    return null;
  }
}

const entree = lireEntree() ?? {};
const outil = String(entree.tool_name ?? '');
if (!outil.startsWith('mcp__') || !OUTILS_GITHUB_GARDES.includes(outil.split('__').pop())) {
  process.stderr.write('entrée de hook illisible : refusé\n');
  process.exit(2);
}
const d = decisionOutilGithub(outil, entree.tool_input ?? {}, { brancheParDefaut: brancheParDefaut(), refsDeLaPr });
if (d) {
  process.stderr.write(`${d.raison}\n`);
  process.exit(2);
}
