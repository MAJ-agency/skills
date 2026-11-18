#!/usr/bin/env node
/**
 * Hook PostToolUse (Edit, Write, MultiEdit) : Prettier puis ESLint sur le fichier édité
 * (ADR « chaîne de production »). Une erreur ESLint revient à l'agent tout de suite (code 2),
 * au lieu d'attendre le pre-push : l'agent corrige pendant qu'il a encore le fichier en tête.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Ticket 18 : les modules de la garde se chargent en dynamique protégé, avant toute autre chose. Un module cassé
// (tronqué, ou qui lève à son évaluation) ne fait pas tomber le hook sur une trace de Node : il le dit sur la sortie d'erreur et sort en 0 (ce hook ne garde rien)
// et dit comment sortir. Le code est ici, et pas dans un module commun, qui pourrait être cassé lui aussi.
const charger = (fichier) =>
  import(`./${fichier}`).catch((e) => {
    process.stderr.write(`apres-edition : scripts/agent/${fichier} ne se charge pas (${String(e?.message ?? e).split('\n')[0]}) : tout outil est refusé tant qu'il n'est pas restauré, la garde ne s'ouvre jamais sur un fichier cassé. La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/\n`);
    process.exit(0);
  });
const { lireEntree, relatif, RACINE } = await charger('entree.mjs');
const { lintable } = await charger('regles.mjs');

const chemin = relatif(lireEntree().tool_input?.file_path);
if (!chemin || !lintable(chemin) || !existsSync(join(RACINE, chemin))) process.exit(0);

const bin = (nom) => join(RACINE, 'node_modules/.bin', nom);
if (existsSync(bin('prettier'))) {
  try {
    execFileSync(bin('prettier'), ['--write', '--log-level', 'warn', chemin], { cwd: RACINE, stdio: 'ignore' });
  } catch {
    // Fichier que Prettier ne sait pas lire (erreur de syntaxe) : ESLint la dira.
  }
}
if (!existsSync(bin('eslint'))) process.exit(0);
try {
  execFileSync(bin('eslint'), ['--no-warn-ignored', '--max-warnings', '0', chemin], {
    cwd: RACINE,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  process.stderr.write(`ESLint signale des problèmes dans ${chemin} :\n${e.stdout ?? ''}${e.stderr ?? ''}`);
  process.exit(2);
}
