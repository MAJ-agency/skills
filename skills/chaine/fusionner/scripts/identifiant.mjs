#!/usr/bin/env node
/**
 * Point d'entrée des scripts shell de la chaîne (`sujet.sh`, `file.sh`) vers la grammaire des
 * identifiants. Les `.sh` n'écrivent pas la grammaire (type, contexte, trigramme) : ils appellent ce fichier, qui
 * importe `identifiants.mjs` du skill `socle-monorepo` (`slug`, `lireIdentifiant`, `ticketDeLaPr`…).
 *
 *   lire <id>                 l'identifiant de spec ou de ticket, en majuscules ; sortie 1 sinon
 *   slug <id>                 `SPEC_ALL_SOC-1.03` → `spec-all-soc-1-03` (nom de branche, de sujet)
 *   ticket-de-pr <titre> <branche>
 *                             le ticket que le titre cite, sinon celui que la branche porte ; vide sinon
 *   tickets                   (entrée standard : un texte) les tickets cités, un par ligne
 *   fichiers                  (entrée standard : « chemin<TAB>reste ») « identifiant<TAB>reste » pour
 *                             chaque fichier de ticket ou de spec ; les autres lignes sont ignorées
 *   colonne-ticket <t> <b>    (entrée standard : TSV) chaque ligne suivie d'une colonne : le ticket de
 *                             la PR dont le titre est en colonne <t> et la branche en colonne <b>, ou vide
 *
 * `identifiants.mjs` est cherché à côté de `scripts/chaine/` (`../docs/`, dans un projet et dans la
 * copie que `boucle.sh` fait de develop), à côté de ce fichier (copie à plat des outils du capitaine),
 * puis dans le skill `socle-monorepo` du plugin. Sorties : 0 · 1 `lire` d'un autre texte · 2 usage · 6
 * grammaire introuvable.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const grammaire = ['../docs/identifiants.mjs', 'identifiants.mjs', '../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs']
  .map((c) => join(ICI, c))
  .find(existsSync);
if (!grammaire) {
  console.error(`identifiant.mjs : scripts/docs/identifiants.mjs introuvable depuis ${ICI} (posé par le skill socle-monorepo)`);
  process.exit(6);
}
const { identifiantDeLaSpec, identifiantDuTicket, lireIdentifiant, slug, ticketDeLaPr, ticketsCites } = await import(pathToFileURL(grammaire).href);

const [commande, ...args] = process.argv.slice(2);
const entree = () => readFileSync(0, 'utf8');
const lignes = () => entree().split('\n').filter((l) => l !== '');
const sortir = (texte) => process.stdout.write(texte);

switch (commande) {
  case 'lire': {
    const lu = lireIdentifiant(args[0]);
    if (lu?.type !== 'SPEC') process.exit(1);
    sortir(`${args[0].toUpperCase()}\n`);
    break;
  }
  case 'slug':
    if (!lireIdentifiant(args[0])) process.exit(1);
    sortir(`${slug(args[0])}\n`);
    break;
  case 'ticket-de-pr':
    sortir(`${ticketDeLaPr(args[0] ?? '', args[1] ?? '') ?? ''}\n`);
    break;
  case 'tickets':
    sortir(ticketsCites(entree()).map((t) => `${t}\n`).join(''));
    break;
  case 'fichiers':
    for (const ligne of lignes()) {
      const [chemin, ...reste] = ligne.split('\t');
      const nom = chemin.split('/').pop();
      const id = identifiantDuTicket(nom) ?? identifiantDeLaSpec(nom);
      if (id) sortir(`${[id, ...reste].join('\t')}\n`);
    }
    break;
  case 'colonne-ticket': {
    const [t, b] = args.map(Number);
    if (!Number.isInteger(t) || !Number.isInteger(b) || t < 1 || b < 1) {
      console.error('usage : identifiant.mjs colonne-ticket <colonne du titre> <colonne de la branche>');
      process.exit(2);
    }
    for (const ligne of lignes()) {
      const c = ligne.split('\t');
      sortir(`${ligne}\t${ticketDeLaPr(c[t - 1] ?? '', c[b - 1] ?? '') ?? ''}\n`);
    }
    break;
  }
  default:
    console.error('usage : identifiant.mjs lire <id> | slug <id> | ticket-de-pr <titre> <branche> | tickets | fichiers | colonne-ticket <t> <b>');
    process.exit(2);
}
