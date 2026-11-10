#!/usr/bin/env node
/**
 * Gate Anchorpost (skill `anchorpost`) : un relais vers la CLI, pour que `.claude/chaine.json`
 * (`gatesRapides`) et le hook de fin de tour trouvent le gate sous `scripts/verify/` comme les autres.
 *
 * La vérification elle-même est dans le paquet `@maj-agency/anchorpost`, versionnée : la liste de ce
 * que `check` refuse ne se patche pas dépôt par dépôt. Ce fichier ne fait rien d'autre qu'appeler
 * `pnpm anchorpost:check` et rendre sa sortie.
 *
 * Usage : node scripts/verify/anchorpost.mjs   (pnpm check:anchorpost — CI)
 */
import { spawnSync } from 'node:child_process';

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const r = spawnSync('pnpm', ['anchorpost:check'], { cwd: ROOT, stdio: 'inherit' });
process.exit(r.status ?? 1);
