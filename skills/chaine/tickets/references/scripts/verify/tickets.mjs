#!/usr/bin/env node
/**
 * Gate des tickets (skill `tickets`).
 *
 * Pourquoi. Des tickets portaient « À faire », « done », « À cadrer » : hors du vocabulaire que lisent
 * `ticket-libre.mjs`, `sujet.sh` et les skills. Et rien ne vérifiait qu'un ticket `ready-for-agent`
 * dise où coder et comment vérifier : les sessions filles le payaient en exploration.
 *
 * Règles, sur chaque `docs/**\/issues/*.issue.md` suivi par git (règles pures : tickets-regles.mjs) :
 *   1. `Status:` ∈ vocabulaire fermé (docs/agents/triage-labels.md) ;
 *   2. `Blocked by:` ne cite que des tickets qui existent ;
 *   3. `Sujet:` de la forme `sujet/<kebab>` ;
 *   0. les fiches docs/agents/issue-tracker.md et triage-labels.md sont celles du skill `tickets`
 *      (sections « Réserver un ticket », « Un ticket prêt pour agent », « Archivage » ; valeurs
 *      `en cours — <branche>` et `Fait — PR #<n>`) : rejouer setup-matt-pocock-skills les écrase,
 *   4. la fiche d'une carte de chantier (`docs/**\/*.map.md` à ligne `Sujet:`) : `Phase:`, `Architecte:`,
 *      `## Coût` dès `4-vague-1`, `## Rétro` à `fini` ;
 *   5. un identifiant de spec n'est porté que par une spec ;
 *   6. un ticket `ready-for-agent` a `Modèle:` et les sections `## Où`, `## Décisions`, `## Surfaces`,
 *      `## Vérification` non vides (docs/agents/chaine-de-production.md § 3), sauf s'il est gelé dans
 *      `tickets-dette.json` (prêts d'avant l'installation du gate). La dette ne grandit pas : un ticket
 *      nouveau ne s'y ajoute jamais ; `--elaguer` retire les entrées éteintes.
 *
 * Usage : node scripts/verify/tickets.mjs [--elaguer]   (pnpm check:tickets — CI)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { controlerCarte, controlerTicket, ecartsFiches, ecartsFormatPret, estArchive, identifiant, identifiantsEnDouble } from './tickets-regles.mjs';

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const DETTE = join(ROOT, 'scripts/verify/tickets-dette.json');
const ls = (motif) =>
  execFileSync('git', ['ls-files', '-z', motif], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);

const tous = ls('docs/**/issues/*.issue.md');
const chemins = tous.filter((c) => !estArchive(c));
const ids = new Set(tous.map((c) => identifiant(basename(c))).filter(Boolean));
const dette = JSON.parse(readFileSync(DETTE, 'utf8'));
const geles = new Set(dette.tickets ?? []);
const cartesGelees = new Set(dette.cartes ?? []);
const doublonsGeles = new Set(dette.identifiants ?? []);

const erreurs = [];
// Les fiches que les skills lisent : celles du skill `tickets`, pas celles d'origine de Matt Pocock.
const fiche = (nom) => (existsSync(join(ROOT, 'docs/agents', nom)) ? readFileSync(join(ROOT, 'docs/agents', nom), 'utf8') : null);
erreurs.push(...ecartsFiches({ issueTracker: fiche('issue-tracker.md'), triageLabels: fiche('triage-labels.md') }));
const doublons = identifiantsEnDouble(ls('docs/**'));
for (const d of doublons.filter((x) => !doublonsGeles.has(x.id))) {
  erreurs.push(
    `${d.id} : identifiant porté par plusieurs specs (${d.fichiers.join(', ')}). Prendre le suivant par \`node scripts/docs/next-id.mjs ${d.id.split('-').slice(0, -1).join(' ')}\`, puis renommer la spec la plus récente et ses tickets.`,
  );
}
const detteActive = new Set();
for (const chemin of chemins) {
  const texte = readFileSync(join(ROOT, chemin), 'utf8');
  const r = controlerTicket({ nom: basename(chemin), texte, existe: (id) => ids.has(id), gele: geles.has(chemin) });
  for (const e of r.erreurs) erreurs.push(`${chemin}:${e.ligne} : ${e.message}`);
  if (geles.has(chemin) && r.pret && ecartsFormatPret(texte).length > 0) detteActive.add(chemin);
}
// Les gabarits de docs/agents/gabarits/ portent des placeholders : ils ne sont pas des cartes.
const cartes = ls('docs/**/*.map.md').filter((c) => !c.startsWith('docs/agents/gabarits/'));
const cartesEnDette = new Set();
for (const chemin of cartes) {
  const r = controlerCarte({ nom: basename(chemin), texte: readFileSync(join(ROOT, chemin), 'utf8') });
  if (cartesGelees.has(chemin)) {
    if (r.erreurs.length > 0) cartesEnDette.add(chemin);
    continue;
  }
  for (const e of r.erreurs) erreurs.push(`${chemin}:${e.ligne} : ${e.message}`);
}
const eteintes = [
  ...(dette.tickets ?? []).filter((c) => !detteActive.has(c)),
  ...[...cartesGelees].filter((c) => !cartesEnDette.has(c)),
  ...[...doublonsGeles].filter((id) => !doublons.some((d) => d.id === id)),
];

if (process.argv.includes('--elaguer')) {
  const presents = new Set(chemins);
  dette.tickets = (dette.tickets ?? []).filter((c) => detteActive.has(c) || !presents.has(c));
  dette.cartes = (dette.cartes ?? []).filter((c) => cartesEnDette.has(c) || !cartes.includes(c));
  dette.identifiants = (dette.identifiants ?? []).filter((id) => doublons.some((d) => d.id === id));
  writeFileSync(DETTE, `${JSON.stringify(dette, null, 2)}\n`);
  console.log(`tickets : dette élaguée — ${dette.tickets.length} ticket(s) prêt(s) hors format restent gelés`);
  process.exit(0);
}
if (erreurs.length > 0) {
  console.error(`tickets : ${erreurs.length} écart(s) :`);
  for (const e of erreurs) console.error(`  ${e}`);
  process.exit(1);
}
const elaguer = eteintes.length > 0 ? ` ; ${eteintes.length} entrée(s) éteinte(s), à retirer par --elaguer` : '';
console.log(`tickets : OK — ${chemins.length} tickets, dette gelée ${detteActive.size}, ${cartes.length} carte(s) dont ${cartesEnDette.size} gelée(s)${elaguer}`);
