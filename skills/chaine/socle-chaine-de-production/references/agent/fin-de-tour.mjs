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
import { lireEntree, RACINE } from './entree.mjs';
import { CHAINE } from './regles.mjs';

if (lireEntree().stop_hook_active) process.exit(0);

const modifies = execFileSync('git', ['status', '--porcelain'], { cwd: RACINE, encoding: 'utf8' });
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
