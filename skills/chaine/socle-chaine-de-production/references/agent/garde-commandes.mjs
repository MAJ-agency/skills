#!/usr/bin/env node
/** Hook PreToolUse (Bash) : commandes interdites (le hook refuse et dit quoi faire, il ne demande jamais rien à un humain). */
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
  process.stderr.write(`garde-commandes : ${texte}\n`);
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
const { brancheParDefaut, lireToolInput, RACINE } = await charger('entree.mjs', { brancheParDefaut: 'function', lireToolInput: 'function', RACINE: 'string' });
const { decisionCommande, lireDependances } = await charger('regles.mjs', { decisionCommande: 'function', lireDependances: 'function' });

// Grammaire des identifiants du skill `socle-monorepo` : le ticket d'une branche (`feat/spec-all-soc-1-04-hook`
// → `SPEC_ALL_SOC-1.04`) et celui d'un fichier ne se lisent que par elle, aucune expression n'en est
// recopiée ici. Absente, le hook garde ses refus et refuse toute dépendance, au lieu de tomber
// entier sur un module manquant.
const identifiants = await import('../docs/identifiants.mjs').catch(() => null);

const git = (...args) => execFileSync('git', args, { cwd: RACINE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 }).trim();

/** Branche courante, `HEAD` si détachée, `null` si git échoue. */
function brancheCourante() {
  try {
    return git('rev-parse', '--abbrev-ref', 'HEAD');
  } catch {
    return null;
  }
}

/**
 * Paquets que prévoit le ticket de la branche courante : sa ligne `Dépendances:` telle qu'elle est
 * sur `origin/sujet/*`, jamais dans l'arbre de travail ni sur la branche de la session. Une copie
 * locale du sujet que `origin` ne porte pas (ref déplacée à la main) ne compte pas. Ticket présent
 * sur plusieurs sujets : seuls les paquets que toutes ses copies prévoient. Toute erreur, ou
 * `scripts/docs/identifiants.mjs` absent → `null`, donc un refus.
 */
function dependancesPrevues() {
  try {
    const id = identifiants?.identifiantDeBranche(brancheCourante());
    if (!id) return null;
    // Un paquet prévu ne passe sans question que si ce qui décide d'où il vient n'a pas bougé par
    // rapport à develop : un `.npmrc` ou un workspace modifié sur la branche, ou créé hors de l'index
    // (que `git diff` ne voit pas), et on refuse.
    const source = ['--', '.npmrc', 'pnpm-workspace.yaml'];
    if (git('diff', '--name-only', 'origin/develop', ...source) !== '' || git('ls-files', '--others', ...source) !== '') return null;
    const { estArchive, identifiantDuTicket } = identifiants;
    const distants = new Map(
      git('ls-remote', '--heads', 'origin', 'refs/heads/sujet/*')
        .split('\n')
        .filter(Boolean)
        .map((ligne) => ligne.split(/\s+/).reverse()),
    );
    const copies = [];
    for (const ligne of git('for-each-ref', '--format=%(objectname) %(refname)', 'refs/remotes/origin/sujet/').split('\n').filter(Boolean)) {
      const [sha, ref] = ligne.split(' ');
      if (distants.get(ref.replace('refs/remotes/origin/', 'refs/heads/')) !== sha) continue;
      for (const chemin of git('ls-tree', '-r', '-z', '--name-only', sha, 'docs').split('\0').filter(Boolean))
        if (!estArchive(chemin) && identifiantDuTicket(chemin.split('/').pop() ?? '') === id) copies.push(lireDependances(git('show', `${sha}:${chemin}`)));
    }
    if (copies.length === 0) return null;
    return copies.reduce((communs, prevus) => communs.filter((p) => prevus.includes(p)));
  } catch {
    return null;
  }
}

// Entrée illisible, ou `command` qui n'est pas une chaîne : refusé, la garde échoue fermée.
const commande = lireToolInput()?.command;
if (typeof commande !== 'string') {
  process.stderr.write('entrée de hook illisible (tool_input.command, une chaîne, attendue) : refusé\n');
  process.exit(2);
}
const d = decisionCommande(commande, { dependancesPrevues, brancheCourante, brancheParDefaut });
if (d) {
  process.stderr.write(`${d.raison}\n`);
  process.exit(2);
}
