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

// Ticket 18 : les modules du hook se chargent en dynamique protégé, avant toute autre chose, et chaque nom lu est
// vérifié : un module cassé (tronqué, qui lève à son évaluation, ou qui se charge sans l'export attendu) fait sauter
// le hook, le dit en une ligne qui dit comment sortir, et sort en 0 (un `Stop` en sortie 2 bouclerait la session). Le code est ici, et pas dans un
// module commun, qui pourrait être cassé lui aussi.
/** Comment sortir : jamais en contournant la garde. */
const RESTAURER =
  "La session s'arrête et le dit à qui l'a lancée ; un humain restaure scripts/agent/ depuis un terminal, depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/";
const cause = (e) => String(e?.message ?? e).split('\n')[0];
const echec = (fichier, raison) => {
  process.stderr.write(`fin-de-tour : scripts/agent/${fichier} ne se charge pas (${raison}) : ce hook est sauté, et les gardes refusent tout outil tant qu'il n'est pas restauré. ${RESTAURER}\n`);
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
const { lireEntree, RACINE } = await charger('entree.mjs', { lireEntree: 'function', RACINE: 'string' });
const { CHAINE } = await charger('regles.mjs', { CHAINE: 'object' });

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
