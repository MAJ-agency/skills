#!/usr/bin/env node
/** Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit) : fichiers protégés. */
import { execFileSync } from 'node:child_process';
import { lireToolInput, relatif, RACINE } from './entree.mjs';
import { refusEdition } from './regles.mjs';

// Le chemin visé : `file_path` (Edit, Write, MultiEdit), `notebook_path` (NotebookEdit). Entrée illisible,
// ou chemin absent, vide ou d'un autre type : refusé, la garde échoue fermée. Hors du dépôt : permis.
const entree = lireToolInput();
const vise = entree?.file_path ?? entree?.notebook_path;
if (typeof vise !== 'string' || vise === '') {
  process.stderr.write('entrée de hook illisible (tool_input.file_path ou notebook_path, un chemin, attendu) : refusé\n');
  process.exit(2);
}
const chemin = relatif(vise);
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
