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

// Ticket 18 : les modules de la garde se chargent en dynamique protégé, avant toute autre chose. Un module cassé
// (tronqué, ou qui lève à son évaluation) ne fait pas tomber le hook sur une trace de Node : il refuse l'outil (sortie 2)
// et dit comment sortir. Le code est ici, et pas dans un module commun, qui pourrait être cassé lui aussi.
const charger = (fichier) =>
  import(`./${fichier}`).catch((e) => {
    process.stderr.write(`garde-github : scripts/agent/${fichier} ne se charge pas (${String(e?.message ?? e).split('\n')[0]}) : tout outil est refusé tant qu'il n'est pas restauré, la garde ne s'ouvre jamais sur un fichier cassé. La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/\n`);
    process.exit(2);
  });
const { brancheParDefaut, lireEntree, RACINE } = await charger('entree.mjs');
const { decisionOutilGithub, OUTILS_GITHUB_GARDES } = await charger('regles.mjs');

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
