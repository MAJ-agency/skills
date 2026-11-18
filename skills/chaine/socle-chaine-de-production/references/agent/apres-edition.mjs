#!/usr/bin/env node
/**
 * Hook PostToolUse (Edit, Write, MultiEdit) : Prettier puis ESLint sur le fichier édité
 * (ADR « chaîne de production »). Une erreur ESLint revient à l'agent tout de suite (code 2),
 * au lieu d'attendre le pre-push : l'agent corrige pendant qu'il a encore le fichier en tête.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Ticket 18 : les modules du hook se chargent en dynamique protégé, avant toute autre chose, et chaque nom lu est
// vérifié : un module cassé (tronqué, qui lève à son évaluation, ou qui se charge sans l'export attendu) fait sauter
// le hook, le dit en une ligne qui dit comment sortir, et sort en 0 (il ne garde rien). Le code est ici, et pas dans un
// module commun, qui pourrait être cassé lui aussi.
/** Comment sortir : jamais en contournant la garde. */
const RESTAURER =
  "La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/";
const cause = (e) => String(e?.message ?? e).split('\n')[0];
const echec = (fichier, raison) => {
  process.stderr.write(`apres-edition : scripts/agent/${fichier} ne se charge pas (${raison}) : ce hook est sauté, et les gardes refusent tout outil tant qu'il n'est pas restauré. ${RESTAURER}\n`);
  process.exit(0);
};
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
const { lireEntree, relatif, RACINE } = await charger('entree.mjs', { lireEntree: 'function', relatif: 'function', RACINE: 'string' });
const { lintable } = await charger('regles.mjs', { lintable: 'function' });

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
