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
 *   3. `Sujet:` : une ou plusieurs valeurs `sujet/<kebab>` séparées par des virgules ;
 *   0. les fiches docs/agents/issue-tracker.md et triage-labels.md sont celles du skill `tickets`
 *      (sections « Réserver un ticket », « Un ticket prêt pour agent », « Archivage » ; valeurs
 *      `en cours — <branche>` et `Fait — PR #<n>`) : rejouer setup-matt-pocock-skills les écrase,
 *   4. la fiche d'une carte de chantier (`docs/**\/*.map.md` à ligne `Sujet:`) : `Phase:`, `Responsable:`
 *      (une personne, pas un identifiant `session_…`), `Conducteur:`, `## Coût` dès `4-vague-1` (aucune section
 *      `## Rétro` n'est exigée, pas même à `fini`) ; une ligne de `## Coût` au-delà du plafond de son rôle (`plafonds` de `.claude/chaine.json`,
 *      l'égalité compte : `fille` 400 k tokens, `conducteur` 400 k tokens, le coût ne se juge pas ; l'`architecte` n'a pas de plafond, tout autre rôle, `relecture` compris, n'est pas jugé) exige une
 *      ligne de `## Dépassements` pour la même session (sans contrat, aucun plafond ; une carte gelée n'est pas
 *      jugée sur ses dépassements) ; `Architecte:` est facultative. Une carte d'avant ces deux lignes, gelée
 *      dans la clé `fiches` de la dette, écrite une seule fois (`--geler-fiches`), garde l'ancienne règle :
 *      `Architecte:` non vide ;
 *   5. un identifiant de spec n'est porté que par une spec ;
 *   6. un ticket `ready-for-agent` a `Modèle:` et les sections `## Où`, `## Décisions`, `## Surfaces`,
 *      `## Vérification` non vides (docs/agents/chaine-de-production.md § 3), sauf s'il est gelé dans
 *      `tickets-dette.json` (prêts d'avant l'installation du gate). La dette ne grandit pas : un ticket
 *      nouveau ne s'y ajoute jamais ; `--elaguer` retire les entrées éteintes ;
 *   7. un ticket `ready-for-agent` dont `Fichiers chauds:` touche un motif de `cheminsSensibles`
 *      (`.claude/chaine.json`) porte `Label: contre-revue` (l'ancienne valeur `architecte` reste acceptée) ;
 *   8. deux cartes ouvertes ne réservent pas le même horodatage de migration (ligne `Migrations:` de
 *      la fiche ; une carte `fini` ne réserve plus) ;
 *   9. `Type:` ∈ task, défaut, grilling, research ; absente, elle n'est tolérée que pour un ticket gelé
 *      dans la clé `types` de la dette, écrite une seule fois, à l'arrivée du gate (`--geler-types`) ;
 *  10. `Règles:`, si la ligne est là, vaut `—` (aucune règle) ou cite au moins une règle, chacune `RULE_<CTX>_<TRI>-<n>` ayant son
 *      fichier `docs/metier/regles/<ctx>/RULE_….md`, du contexte du ticket ou de `ALL` ;
 *  11. un `Type: défaut` à `Fait — PR #n` nomme dans la colonne « Preuve » de `## Surfaces` des tests
 *      (`fichier.test.ts` « titre ») qui existent dans les fichiers de tests suivis et sont actifs ;
 *  12. `Sensibles:`, si la ligne est dans l'en-tête, vaut `—` ou des chemins (ou des motifs) séparés par des
 *      virgules puis ` — accord de <nom>, <AAAA-MM-JJ>` : la forme seule est jugée, la ligne n'est jamais exigée ;
 *  13. `Relecture:`, si la ligne est dans l'en-tête, vaut `double` ; elle n'est jamais exigée.
 *
 * Usage : node scripts/verify/tickets.mjs [--elaguer | --geler-types | --geler-fiches]   (pnpm check:tickets — CI)
 * Sortie 2 : `scripts/docs/identifiants.mjs` absent (posé par `socle-monorepo`).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
// La grammaire est posée par socle-monorepo, pas par ce skill : sans elle, un refus qui la nomme
// plutôt qu'un module introuvable.
if (!existsSync(new URL('../docs/identifiants.mjs', import.meta.url))) {
  console.error('tickets : scripts/docs/identifiants.mjs introuvable (grammaire des identifiants, posée par /maj-skills:socle-monorepo)');
  process.exit(2);
}
const { dossierDuContexte, identifiantDeLaRegle, lireIdentifiant } = await import('../docs/identifiants.mjs');
const {
  FICHIER_DE_TEST,
  controlerCarte,
  controlerTicket,
  ecartsFiches,
  ficheNommeResponsableEtConducteur,
  ecartsFormatPret,
  estArchive,
  etatDuTest,
  identifiant,
  identifiantsEnDouble,
  lireCheminsSensibles,
  lirePlafonds,
  reservationsEnDouble,
} = await import('./tickets-regles.mjs');

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
const typesGeles = new Set(dette.types ?? []);
const fichesGelees = new Set(dette.fiches ?? []);

// Registre des règles : un fichier `RULE_<CTX>_<TRI>-<n>.md` dans le dossier de son contexte. Le nom suffit.
const regles = new Set(
  ls('docs/metier/regles/*/RULE_*.md')
    .map((c) => ({ c, id: identifiantDeLaRegle(basename(c)) }))
    .filter(({ c, id }) => id && c === `docs/metier/regles/${dossierDuContexte(lireIdentifiant(id).contexte)}/${id}.md`)
    .map(({ id }) => id),
);
const regleExiste = (id) => regles.has(id);

// Fichiers de tests suivis, lus à la demande : seul un défaut `Fait` les fait ouvrir.
let fichiersDeTest = null;
const textes = new Map();
const testExiste = (fichier, titre) => {
  fichiersDeTest ??= [...new Set(['*.test.*', '*.spec.*', '*.e2e-spec.*'].flatMap(ls))].filter((c) => FICHIER_DE_TEST.test(c));
  // Un chemin vise ce fichier ; un nom seul, tout fichier de ce nom. Un seul `actif` suffit.
  const nom = fichier.replace(/^\.\//, '');
  const candidats = fichiersDeTest.filter((c) => c === nom || c.endsWith(`/${nom}`));
  let etat = 'absent';
  for (const c of candidats) {
    if (!textes.has(c)) textes.set(c, readFileSync(join(ROOT, c), 'utf8'));
    const e = etatDuTest(textes.get(c), titre);
    if (e === 'actif') return e;
    if (e === 'désactivé') etat = e;
  }
  return etat;
};

const CHAINE = join(ROOT, '.claude/chaine.json');
let cheminsSensibles;
let plafonds;
try {
  const contrat = existsSync(CHAINE) ? readFileSync(CHAINE, 'utf8') : null;
  cheminsSensibles = lireCheminsSensibles(contrat);
  plafonds = lirePlafonds(contrat);
} catch (e) {
  console.error(`tickets : ${e.message}`);
  process.exit(1);
}

const erreurs = [];
// Les fiches que les skills lisent : celles du skill `tickets`, pas celles d'origine de Matt Pocock.
const fiche = (nom) => (existsSync(join(ROOT, 'docs/agents', nom)) ? readFileSync(join(ROOT, 'docs/agents', nom), 'utf8') : null);
erreurs.push(...ecartsFiches({ issueTracker: fiche('issue-tracker.md'), triageLabels: fiche('triage-labels.md') }));
const doublons = identifiantsEnDouble(ls('docs/**'));
for (const d of doublons.filter((x) => !doublonsGeles.has(x.id))) {
  const { type, contexte, trigramme } = lireIdentifiant(d.id);
  erreurs.push(
    `${d.id} : identifiant porté par plusieurs specs (${d.fichiers.join(', ')}). Prendre le suivant par \`node scripts/docs/next-id.mjs ${type} ${contexte} ${trigramme}\`, puis renommer la spec la plus récente et ses tickets.`,
  );
}
const detteActive = new Set();
const sansType = [];
for (const chemin of chemins) {
  const texte = readFileSync(join(ROOT, chemin), 'utf8');
  const r = controlerTicket({
    nom: basename(chemin),
    texte,
    existe: (id) => ids.has(id),
    gele: geles.has(chemin),
    typeGele: typesGeles.has(chemin),
    cheminsSensibles,
    regleExiste,
    testExiste,
  });
  for (const e of r.erreurs) erreurs.push(`${chemin}:${e.ligne} : ${e.message}`);
  if (geles.has(chemin) && r.pret && ecartsFormatPret(texte, cheminsSensibles).length > 0) detteActive.add(chemin);
  if (r.type === null) sansType.push(chemin);
}
const typesEnDette = new Set(sansType.filter((c) => typesGeles.has(c)));

// La dette `types` s'écrit une fois, à l'arrivée du gate : la liste des tickets qui n'ont pas encore
// de `Type:`. La clé posée, elle ne reçoit plus rien.
if (process.argv.includes('--geler-types')) {
  if (Array.isArray(dette.types)) {
    console.error('tickets : la dette `types` est déjà gelée (clé présente dans tickets-dette.json) ; elle ne grandit jamais. Poser `Type:` sur le ticket.');
    process.exit(1);
  }
  dette.types = sansType;
  writeFileSync(DETTE, `${JSON.stringify(dette, null, 2)}\n`);
  console.log(`tickets : dette \`types\` gelée — ${sansType.length} ticket(s) sans \`Type:\``);
  process.exit(0);
}
// Les gabarits de docs/agents/gabarits/ portent des placeholders : ils ne sont pas des cartes.
const cartes = ls('docs/**/*.map.md').filter((c) => !c.startsWith('docs/agents/gabarits/'));
const textesDesCartes = new Map(cartes.map((c) => [c, readFileSync(join(ROOT, c), 'utf8')]));
// Cartes de chantier dont la fiche ne nomme pas encore `Responsable:` et `Conducteur:`.
const sansFicheNouvelle = cartes.filter(
  (c) => controlerCarte({ nom: basename(c), texte: textesDesCartes.get(c) }).carte && !ficheNommeResponsableEtConducteur(textesDesCartes.get(c)),
);

// La dette `fiches` s'écrit une fois, à la pose : les cartes d'avant `Responsable:` et `Conducteur:`.
// La clé posée, elle ne reçoit plus rien.
if (process.argv.includes('--geler-fiches')) {
  if (Array.isArray(dette.fiches)) {
    console.error(
      'tickets : la dette `fiches` est déjà gelée (clé présente dans tickets-dette.json) ; elle ne grandit jamais. Poser `Responsable:` et `Conducteur:` dans la fiche de la carte.',
    );
    process.exit(1);
  }
  dette.fiches = sansFicheNouvelle;
  writeFileSync(DETTE, `${JSON.stringify(dette, null, 2)}\n`);
  console.log(`tickets : dette \`fiches\` gelée — ${sansFicheNouvelle.length} carte(s) sans \`Responsable:\` et \`Conducteur:\``);
  process.exit(0);
}
const fichesEnDette = new Set(sansFicheNouvelle.filter((c) => fichesGelees.has(c)));
const cartesEnDette = new Set();
for (const chemin of cartes) {
  const r = controlerCarte({ nom: basename(chemin), texte: textesDesCartes.get(chemin), ficheGelee: fichesEnDette.has(chemin), plafonds });
  if (cartesGelees.has(chemin)) {
    if (r.erreurs.length > 0) cartesEnDette.add(chemin);
    continue;
  }
  for (const e of r.erreurs) erreurs.push(`${chemin}:${e.ligne} : ${e.message}`);
}
erreurs.push(
  ...reservationsEnDouble(
    cartes.filter((c) => !cartesGelees.has(c)).map((chemin) => ({ chemin, texte: textesDesCartes.get(chemin) })),
  ),
);
const eteintes = [
  ...(dette.tickets ?? []).filter((c) => !detteActive.has(c)),
  ...[...cartesGelees].filter((c) => !cartesEnDette.has(c)),
  ...[...doublonsGeles].filter((id) => !doublons.some((d) => d.id === id)),
  ...[...typesGeles].filter((c) => !typesEnDette.has(c)),
  ...[...fichesGelees].filter((c) => !fichesEnDette.has(c)),
];

if (process.argv.includes('--elaguer')) {
  const presents = new Set(chemins);
  dette.tickets = (dette.tickets ?? []).filter((c) => detteActive.has(c) || !presents.has(c));
  dette.cartes = (dette.cartes ?? []).filter((c) => cartesEnDette.has(c) || !cartes.includes(c));
  dette.identifiants = (dette.identifiants ?? []).filter((id) => doublons.some((d) => d.id === id));
  if (Array.isArray(dette.types)) dette.types = dette.types.filter((c) => typesEnDette.has(c));
  if (Array.isArray(dette.fiches)) dette.fiches = dette.fiches.filter((c) => fichesEnDette.has(c));
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
console.log(
  `tickets : OK — ${chemins.length} tickets, dette gelée ${detteActive.size}, ${typesEnDette.size} sans Type: gelé(s), ${cartes.length} carte(s) dont ${cartesEnDette.size} gelée(s), ${fichesEnDette.size} fiche(s) d'avant Responsable:/Conducteur:${elaguer}`,
);
