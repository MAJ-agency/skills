#!/usr/bin/env node
/** Hook PreToolUse (Edit, Write, MultiEdit, NotebookEdit) : fichiers protégés. */
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
  process.stderr.write(`garde-fichiers : ${texte}\n`);
  process.exit(2);
};
process.on('uncaughtException', (e) => refuser(`erreur inattendue (${cause(e)}) : tout outil est refusé, la garde ne s'ouvre jamais sur une erreur. ${RESTAURER}`));
process.on('unhandledRejection', (e) => refuser(`erreur inattendue (${cause(e)}) : tout outil est refusé, la garde ne s'ouvre jamais sur une erreur. ${RESTAURER}`));
// Dernier filet : toute sortie autre que 0 (permis) ou 2 (refusé), comme le 13 d'un `await` de premier niveau qui ne se
// résout jamais, devient un refus. Claude Code laisse passer l'outil sur toute autre sortie.
process.on('exit', (code) => {
  if (code === 0 || code === 2) return;
  process.stderr.write(`garde-fichiers : sortie ${code} inattendue (await jamais résolu ou erreur de Node) : tout outil est refusé, la garde ne s'ouvre jamais sur une erreur. ${RESTAURER}\n`);
  process.exitCode = 2;
});
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
const { lireToolInput, relatif, RACINE } = await charger('entree.mjs', { lireToolInput: 'function', relatif: 'function', RACINE: 'string' });
const { refusEdition } = await charger('regles.mjs', { refusEdition: 'function' });

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
