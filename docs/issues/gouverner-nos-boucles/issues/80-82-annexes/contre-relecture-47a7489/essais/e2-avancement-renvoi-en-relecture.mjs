// Essai E2 (constat 6) : une PR renvoyée dont la relecture est redemandée garde `fusion-bloquée` avec `à-relire`
// (A-196 point 2) ; le tableau d'avancement la range « À reprendre » et « En relecture » à la fois.
// Usage : node e2-avancement-renvoi-en-relecture.mjs <racine d'un clone de skills> <dossier temporaire vide>
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [racine, tmp] = process.argv.slice(2);
mkdirSync(join(tmp, 'docs'), { recursive: true });
copyFileSync(join(racine, 'skills/chaine/tickets/references/scripts/docs/avancement-regles.mjs'), join(tmp, 'docs/avancement-regles.mjs'));
copyFileSync(join(racine, 'skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs'), join(tmp, 'docs/identifiants.mjs'));
const { avancement, enMarkdown, lireTicket } = await import(pathToFileURL(join(tmp, 'docs/avancement-regles.mjs')).href);
const t = lireTicket('docs/x/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md', '# SPEC_ALL_SOC-1.01 — Objet 01\n\nStatus: Fait — PR #1\n');
const a = avancement([t], [{ numero: 1, titre: 'x (SPEC_ALL_SOC-1.01)', branche: 'b1', etat: 'ouverte', labels: ['fusion-bloquée', 'à-relire'] }]);
console.log(enMarkdown('sujet/x', a).split('\n').filter((l) => /À reprendre|En relecture/.test(l)).join('\n'));
