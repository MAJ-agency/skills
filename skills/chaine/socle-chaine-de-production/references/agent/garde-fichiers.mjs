#!/usr/bin/env node
/** Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit) : fichiers protégés. */
import { execFileSync } from 'node:child_process';

// Ticket 18 : les modules de la garde se chargent en dynamique protégé, avant toute autre chose. Un module cassé
// (tronqué, ou qui lève à son évaluation) ne fait pas tomber le hook sur une trace de Node : il refuse l'outil (sortie 2)
// et dit comment sortir. Le code est ici, et pas dans un module commun, qui pourrait être cassé lui aussi.
const charger = (fichier) =>
  import(`./${fichier}`).catch((e) => {
    process.stderr.write(`garde-fichiers : scripts/agent/${fichier} ne se charge pas (${String(e?.message ?? e).split('\n')[0]}) : tout outil est refusé tant qu'il n'est pas restauré, la garde ne s'ouvre jamais sur un fichier cassé. La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/\n`);
    process.exit(2);
  });
const { lireToolInput, relatif, RACINE } = await charger('entree.mjs');
const { refusEdition } = await charger('regles.mjs');

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
