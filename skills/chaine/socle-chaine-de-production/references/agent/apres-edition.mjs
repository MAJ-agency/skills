#!/usr/bin/env node
/**
 * Hook PostToolUse (Edit, Write, MultiEdit) : Prettier puis ESLint sur le fichier édité
 * (ADR « chaîne de production »). Une erreur ESLint revient à l'agent tout de suite (code 2),
 * au lieu d'attendre le pre-push : l'agent corrige pendant qu'il a encore le fichier en tête.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { lireEntree, relatif, RACINE } from './entree.mjs';
import { lintable } from './regles.mjs';

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
