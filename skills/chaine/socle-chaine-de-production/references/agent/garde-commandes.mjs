#!/usr/bin/env node
/** Hook PreToolUse (Bash) : commandes interdites (le hook refuse et dit quoi faire, il ne demande jamais rien à un humain). */
import { execFileSync } from 'node:child_process';
import { brancheParDefaut, lireEntree, RACINE } from './entree.mjs';
import { decisionCommande, lireDependances } from './regles.mjs';

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

const commande = lireEntree().tool_input?.command ?? '';
const d = decisionCommande(commande, { dependancesPrevues, brancheCourante, brancheParDefaut });
if (d) {
  process.stderr.write(`${d.raison}\n`);
  process.exit(2);
}
