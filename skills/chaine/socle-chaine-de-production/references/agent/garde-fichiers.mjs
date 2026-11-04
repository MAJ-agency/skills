#!/usr/bin/env node
/** Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit) : fichiers protégés. */
import { execFileSync } from 'node:child_process';
import { lireEntree, relatif, RACINE } from './entree.mjs';
import { refusEdition } from './regles.mjs';

const entree = lireEntree();
const chemin = relatif(entree.tool_input?.file_path ?? entree.tool_input?.notebook_path);
if (!chemin) process.exit(0);

/** Une migration est livrée si `develop` la connaît, à défaut si elle est déjà commitée. */
function migrationExistante(c) {
  for (const ref of ['origin/develop', 'HEAD']) {
    try {
      execFileSync('git', ['cat-file', '-e', `${ref}:${c}`], { cwd: RACINE, stdio: 'ignore' });
      return true;
    } catch {
      // absente de cette référence
    }
  }
  return false;
}

const refus = refusEdition(chemin, { migrationExistante });
if (refus) {
  process.stderr.write(`${refus}\n`);
  process.exit(2);
}
