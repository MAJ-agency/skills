#!/usr/bin/env node
/**
 * Hook Stop : avant de rendre la main, les gates rapides qui portent sur le travail en cours
 * (ADR « chaîne de production »). Un échec renvoie l'agent au travail une fois ; s'il s'arrête
 * encore (`stop_hook_active`), on le laisse : le pre-push et la CI restent le filet.
 *
 * Les gates viennent de `.claude/chaine.json` (`gatesRapides` : chemins de scripts relatifs à la
 * racine) ; seuls ceux qui existent se lancent. Chacun doit tenir en quelques secondes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Ticket 18 : les modules de la garde se chargent en dynamique protégé, avant toute autre chose. Un module cassé
// (tronqué, ou qui lève à son évaluation) ne fait pas tomber le hook sur une trace de Node : il le dit sur la sortie d'erreur et sort en 0 (ce hook ne garde rien ; un `Stop` en sortie 2 bouclerait la session)
// et dit comment sortir. Le code est ici, et pas dans un module commun, qui pourrait être cassé lui aussi.
const charger = (fichier) =>
  import(`./${fichier}`).catch((e) => {
    process.stderr.write(`fin-de-tour : scripts/agent/${fichier} ne se charge pas (${String(e?.message ?? e).split('\n')[0]}) : tout outil est refusé tant qu'il n'est pas restauré, la garde ne s'ouvre jamais sur un fichier cassé. La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/\n`);
    process.exit(0);
  });
const { lireEntree, RACINE } = await charger('entree.mjs');
const { CHAINE } = await charger('regles.mjs');

if (lireEntree().stop_hook_active) process.exit(0);

// --untracked-files=all : sans lui, git replie un dossier nouveau en « ?? apps/ » et le fichier .ts n'est pas vu.
const modifies = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: RACINE, encoding: 'utf8' });
if (!/\.(ts|tsx|mjs|js|json|md|sql|yml|yaml)$/m.test(modifies)) process.exit(0);

const GATES = (CHAINE.gatesRapides ?? []).filter((g) => existsSync(join(RACINE, g)));
const echecs = [];
for (const gate of GATES) {
  try {
    execFileSync('node', [join(RACINE, gate)], { cwd: RACINE, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    echecs.push(`── ${gate}\n${(e.stderr || e.stdout || '').trim()}`);
  }
}
if (echecs.length > 0) {
  process.stderr.write(`Gates rouges sur le travail en cours — corriger avant de rendre la main :\n${echecs.join('\n')}\n`);
  process.exit(2);
}
