// `node --test scripts/chaine/double-relecture.test.mjs` : « double relecture exigée », sur des arbres donnés en
// mémoire (le calcul), puis sur un dépôt jouet et une copie des outils hors du dépôt (les lectures git, la ligne de
// commande). Les fichiers de règle et l'index ont la forme du standard : gabarit `regle.md` du skill `tickets`,
// entrée `rules` d'un index Anchorpost au pivot 2 ou 3.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  brancheDOrigin,
  EXIGEE,
  GRAMMAIRE,
  ILLISIBLE,
  INDEX,
  Illisible,
  NON_EXIGEE,
  SORTIES,
  cheminDuDiff,
  doubleRelecture,
  enTeteDeRegle,
  lecteurGit,
  lireArguments,
  reglesDeLIndex,
  sommet,
  texte,
  ticketsDeLaPr,
} from './double-relecture.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));

// Jamais le vrai dépôt : sous un hook git, GIT_DIR et ses semblables sont exportés. Le filtre de ces variables vit en
// un seul endroit, `environnementDeBanc` (`scripts/docs/environnement-de-banc.mjs` du socle, réexporté par
// `depot-jouet.mjs`) : un banc ne le recopie pas (`scripts/un-seul-environnement-de-banc.test.mjs`). Posé dans un
// projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
// NODE_TEST_CONTEXT reste dans ce processus : avec lui, un `node` enfant rendrait ses résultats au parent.
const { environnementDeBanc } = await import(existsSync(new URL('./depot-jouet.mjs', import.meta.url)) ? './depot-jouet.mjs' : '../../sujet/scripts/depot-jouet.mjs');
const SANS = environnementDeBanc();
for (const cle of Object.keys(process.env)) if (!(cle in SANS) && cle !== 'NODE_TEST_CONTEXT') delete process.env[cle];
process.env.NO_COLOR = '1';
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';
// Ni la configuration de système du poste : `git config --system`, nommé, la lit malgré GIT_CONFIG_NOSYSTEM, et un
// poste (un runner de CI) y déclare `safe.directory = *`. Un banc qui dépend de `/etc/gitconfig` n'est pas un banc.
process.env.GIT_CONFIG_SYSTEM = '/dev/null';
const ENV_PROPRE = Object.fromEntries(Object.entries(process.env).filter(([cle]) => cle !== 'NODE_TEST_CONTEXT'));
const dossiers = [];
const dossier = (prefixe) => {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiers.push(d);
  return d;
};
after(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true });
});

// ── Montages ──────────────────────────────────────────────────────────────────────────────────────────────────────
const R16 = 'docs/metier/regles/all/RULE_ALL_FAC-16.md';
const R17 = 'docs/metier/regles/all/RULE_ALL_FAC-17.md';
const CODE = 'apps/api/src/facture/total.ts';
const TICKET = 'docs/features/facture/all/issues/SPEC_ALL_FAC-1-facture.03.issue.md';
const BRANCHE = 'feat/spec-all-fac-1-03-total';

/** Un fichier de règle à la forme du gabarit ; `criticite` et `code` : les lignes d'en-tête, telles qu'on les écrit. */
const regle = (id, { criticite = '', code = '', statut = 'validated' } = {}) =>
  `---\nid: ${id}\ntitle: Le total d'une facture est la somme de ses lignes : arrondi au centime\nvalidation:\n  status: ${statut}\n  date: 2026-11-16\n${criticite}${code}sources:\n  - { ref: "réunion du 2026-11-10, point 3", path: docs/metier/reunions/r.md }\n---\n\nLe total est la somme des lignes.\n`;
const HAUTE_NUE = 'criticality: high\n';
const HAUTE_BLOC = 'criticality:\n  level: high # low | medium | high\n  by: agent\n  reason: "Une erreur coûte de l\'argent, level: low n\'y change rien."\n';
const MOYENNE = 'criticality:\n  level: medium\n  by: agent\n';
const CODE_BLOC = `code:\n  - ${CODE}\n`;

/** Une entrée de `rules` de l'index, avec les champs que le calcul lit et quelques autres. */
const entree = (key, { niveau, origin = 'declared', code = [], statut = 'validated' } = {}) => ({
  key,
  context: 'all',
  id: key.replace(/^RULE_ALL_/, ''),
  title: 't',
  validation: { status: statut, date: '2026-11-16' },
  realisation: { status: 'to-build', levels: [], proofCount: 0, inherited: false },
  code,
  proofs: [],
  ...(niveau ? { criticality: { level: niveau, origin, ...(origin === 'feature' ? { features: ['SPEC_ALL_FAC-1'] } : {}) } } : {}),
});
const index = (rules, schema = '3') => JSON.stringify({ rules, schema }, null, 1);
const ticket = (lignes = '', corps = '') =>
  `# Total d'une facture\n\nStatus: ready-for-agent\nType: task\n${lignes}Blocked by: —\n\n## Le besoin\n\n${corps}\n`;

const DEVELOP = 'origin/develop';
const SUJET = 'origin/sujet/facture';
const TETE = 'a'.repeat(40); // le sommet d'une PR se donne par son sha
const DEPART = 'd'.repeat(40);
const SPEC = 'docs/features/facture/all/SPEC_ALL_FAC-1-facture.spec.md';
const spec = (lignes = '', corps = '') => `# Facture\n\nStatus: en cours\n${lignes}\n## Les tickets\n\n${corps}\n`;

/**
 * Un lecteur sur des arbres en mémoire : `{ <réf>: { <chemin>: <texte> } }`, les réfs nommées comme on les passe au
 * calcul (`origin/…`, ou un sha). Deux réfs du même arbre sont le même commit. `existants` : des chemins qui sont
 * dans tous les arbres sans y être écrits (les fichiers d'un diff que le montage ne détaille pas).
 */
const lecteur = (refs, existants = []) => {
  const arbres = new Map(); // commit → arbre
  const commits = new Map(); // arbre → commit
  const arbre = (commit) => arbres.get(commit) ?? assert.fail(`commit inconnu du montage : ${commit}`);
  return {
    verifier(nom) {
      const ref = nom.replace(/^refs\/remotes\//, '');
      if (!(ref in refs)) throw new Illisible(`référence ${ref} introuvable`);
      if (!commits.has(refs[ref])) commits.set(refs[ref], `${commits.size}`.padStart(40, 'c'));
      arbres.set(commits.get(refs[ref]), refs[ref]);
      return commits.get(refs[ref]);
    },
    baseDeFusion() {
      return this.verifier(DEPART);
    },
    sujets: () => Object.keys(refs).filter((r) => r.startsWith('origin/sujet/')).map((r) => `refs/remotes/${r}`),
    chemins: (commit) => [...Object.keys(arbre(commit)), ...existants],
    lister: (commit, prefixe) => Object.keys(arbre(commit)).filter((p) => p === prefixe || p.startsWith(prefixe)),
    lire: (commit, chemins) => new Map(chemins.map((c) => [c, arbre(commit)[c]])),
  };
};
/**
 * Le calcul sur des arbres : `develop`, `sujet` (la base de la PR s'il est donné et que `versDevelop` ne l'est pas),
 * `tete` (la base, quand la PR ne change ni règle ni index), `depart` (la base, quand la PR est à jour). Les fichiers
 * du diff existent dans tous les arbres, sauf `existants: []`.
 */
function calculer({ fichiers, develop = {}, sujet, tete, depart, tickets = [], versDevelop = false, refs = {}, existants = fichiers.filter((f) => !f.startsWith('"')) }) {
  const base = sujet && !versDevelop ? 'sujet/facture' : 'develop'; // un nom de branche : le calcul lit `origin/<branche>`
  const arbres = { [DEVELOP]: develop, ...(sujet ? { [SUJET]: sujet } : {}), ...refs };
  arbres[TETE] = tete ?? arbres[`origin/${base}`];
  arbres[DEPART] = depart ?? arbres[`origin/${base}`];
  return doubleRelecture({ fichiers, base, tete: TETE, tickets, lecteur: lecteur(arbres, existants) });
}
/** Une PR vers develop : `tete` vaut `base` quand elle ne change ni règle ni index, `depart` vaut `base` quand elle est à jour. */
const juger = (fichiers, base, tete = base, ticketDeLaPr = null, depart = base) =>
  calculer({ fichiers, develop: base, tete, depart, tickets: ticketDeLaPr ? [ticketDeLaPr] : [] });
/** Les causes, la tête écrite `tete` plutôt que son sha. */
const causes = (r) => r.causes.map((c) => `${c.sujet} · ${c.motif} · ${c.chemin} · ${c.ref === TETE ? 'tete' : c.ref}`);

// ── Le calcul ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('règle haute touchée, avec index : son fichier, ou un fichier de son `code`, exige deux relectures ; les causes nomment la règle', () => {
  const arbre = {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] }), entree('RULE_ALL_FAC-17', { niveau: 'medium' })]),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }),
    [R17]: regle('RULE_ALL_FAC-17', { criticite: MOYENNE }),
  };
  const parFichier = juger([R16], arbre);
  assert.equal(parFichier.reponse, EXIGEE);
  assert.deepEqual(causes(parFichier), [`RULE_ALL_FAC-16 · fichier · ${R16} · origin/develop`]);
  const parCode = juger(['README.md', CODE], arbre);
  assert.equal(parCode.reponse, EXIGEE);
  assert.deepEqual(causes(parCode), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`]);
  assert.equal(juger(['apps/api/src/facture/total.spec.ts', 'README.md'], arbre).reponse, NON_EXIGEE, 'un voisin du fichier de code ne compte pas');
});

test("le niveau de l'index est le niveau effectif : une criticité reçue d'une feature compte, que l'en-tête ne dit pas", () => {
  const arbre = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { code: CODE_BLOC }) };
  assert.equal(juger([CODE], arbre).reponse, EXIGEE);
  assert.equal(juger([CODE], { [R16]: arbre[R16] }).reponse, NON_EXIGEE, "sans index, la criticité reçue d'une feature n'est pas vue (limite écrite)");
});

test('règle moyenne seule, ou basse, ou à classer : non exigée', () => {
  const arbre = {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'low' }), entree('RULE_ALL_FAC-17', { niveau: 'medium', code: [CODE] }), entree('RULE_ALL_FAC-18')], '2'),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: 'criticality: low\n' }),
    [R17]: regle('RULE_ALL_FAC-17', { criticite: 'criticality: medium\n', code: CODE_BLOC }),
  };
  const r = juger([R16, R17, CODE], arbre);
  assert.deepEqual([r.reponse, r.causes, r.illisibles], [NON_EXIGEE, [], []]);
});

test("règle montée à haute après le verdict : mêmes fichiers, même tête, la cible a avancé, la réponse change (A-90)", () => {
  const avant = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE, code: CODE_BLOC }) };
  const apres = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }) };
  assert.equal(juger([CODE], avant, avant).reponse, NON_EXIGEE);
  // La PR est partie de la cible d'avant : son départ est `avant`, la cible relue est `apres`.
  const r = juger([CODE], apres, avant, null, avant);
  assert.equal(r.reponse, EXIGEE, 'la tête de la PR dit encore « moyenne » : la base relue fait foi');
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], "ce qu'une autre PR a changé dans la cible n'est pas un changement de niveau de celle-ci");
  assert.equal(juger(['README.md'], apres, avant, null, avant).reponse, NON_EXIGEE, 'une PR en retard qui ne touche ni la règle ni son code');
});

test("une PR qui monte elle-même une règle à haute est vue sur sa tête, même si elle n'a pas régénéré l'index", () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium' })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }) };
  const regenere = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC }) };
  const perime = { [INDEX]: base[INDEX], [R16]: regenere[R16] };
  const montee = [`RULE_ALL_FAC-16 · fichier · ${R16} · tete`, `RULE_ALL_FAC-16 · niveau · ${INDEX} · tete`];
  assert.deepEqual(causes(juger([R16], base, regenere)), montee);
  assert.deepEqual(causes(juger([R16], base, perime)), montee, "index périmé : l'en-tête du fichier touché est lu en plus");
  // Une règle neuve, haute, que l'index de la tête ne connaît pas encore, avec son code dans la même PR.
  const neuve = { ...base, [R17]: regle('RULE_ALL_FAC-17', { criticite: HAUTE_NUE, code: CODE_BLOC }) };
  assert.deepEqual(causes(juger([R17, CODE], base, neuve)), [`RULE_ALL_FAC-17 · fichier · ${R17} · tete`, `RULE_ALL_FAC-17 · code · ${CODE} · tete`, `RULE_ALL_FAC-17 · niveau · ${INDEX} · tete`]);
  // Une PR qui baisse une règle haute, ou la supprime : la base la dit haute.
  assert.equal(juger([R16], regenere, base).reponse, EXIGEE);
  assert.equal(juger([R16], regenere, {}).reponse, EXIGEE);
});

test("règle haute rejetée ou obsolète : elle ne compte pas ; la PR qui la rejette est vue par la base", () => {
  for (const statut of ['rejected', 'obsolete']) {
    const hors = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE], statut })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC, statut }) };
    assert.equal(juger([R16, CODE], hors).reponse, NON_EXIGEE, statut);
    assert.equal(juger([R16, CODE], { [R16]: hors[R16] }).reponse, NON_EXIGEE, `${statut}, sans index`);
    const enVigueur = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }) };
    assert.equal(juger([R16], enVigueur, hors).reponse, EXIGEE, `la PR qui écrit ${statut}`);
  }
  const candidate = { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE, statut: 'candidate' }) };
  assert.equal(juger([R16], candidate).reponse, EXIGEE, 'une règle candidate haute compte');
});

test("projet sans index : le niveau se lit dans l'en-tête de chaque fichier de règle, sous ses deux formes ; projet sans règles : non exigée", () => {
  const FORMES = [HAUTE_NUE, HAUTE_BLOC, 'criticality: { level: high, by: agent, reason: "Une erreur, même rare, coûte de l\'argent" }   # fixée par le skill\n', 'criticality: "high"\n'];
  for (const criticite of FORMES) {
    const arbre = { [R16]: regle('RULE_ALL_FAC-16', { criticite, code: `code: [ ${CODE}, "apps/web/src/facture/" ]\n` }), [R17]: regle('RULE_ALL_FAC-17', { criticite: MOYENNE }) };
    assert.deepEqual(causes(juger([R16], arbre)), [`RULE_ALL_FAC-16 · fichier · ${R16} · origin/develop`], criticite);
    assert.deepEqual(causes(juger([CODE], arbre)), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], criticite);
    assert.equal(juger(['apps/web/src/facture/Total.tsx'], arbre).reponse, EXIGEE, 'une entrée de `code` peut nommer un dossier');
    assert.equal(juger([R17, 'apps/web/src/factures.ts'], arbre).reponse, NON_EXIGEE, criticite);
  }
  assert.equal(juger(['apps/api/src/main.ts'], { 'README.md': 'x' }).reponse, NON_EXIGEE, 'ni index ni règle');
});

test("seul un fichier `docs/metier/regles/<ctx>/<RULE_…>.md` de la racine est le fichier d'une règle", () => {
  const jouet = 'apps/cli/test/fixtures/depot/docs/metier/regles/all/RULE_ALL_FAC-16.md';
  const ailleurs = 'docs/metier/regles/fnsmr/RULE_ALL_FAC-16.md';
  // La vraie règle, haute, est dans l'arbre et hors du diff : ses homonymes ne sont pas son fichier.
  const arbre = { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), [jouet]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), [ailleurs]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), 'docs/metier/regles/all/notes.md': 'criticality: high' };
  for (const avecIndex of [{}, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) }])
    for (const chemin of [jouet, ailleurs, 'docs/metier/regles/all/notes.md']) assert.equal(juger([chemin], { ...arbre, ...avecIndex }).reponse, NON_EXIGEE, chemin);
});

test('index illisible, schéma inconnu, en-tête illisible, référence introuvable, ligne du diff mal citée : « illisible », jamais « non exigée »', () => {
  const haute = regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC });
  for (const [nom, contenu, attendu] of [
    ['JSON coupé', '{"schema": "3", "rules": [', /n'est pas du JSON/],
    ['schéma 1', index([], '1'), /de schéma "1" : ce lecteur lit "2" et "3"/],
    ['schéma 4', index([entree('RULE_ALL_FAC-16', { niveau: 'high' })], '4'), /de schéma "4"/],
    ['sans rules', '{"schema": "3"}', /sans liste `rules`/],
    ['niveau inconnu', index([{ key: 'RULE_ALL_FAC-16', criticality: { level: 'haute' } }]), /`criticality.level` de RULE_ALL_FAC-16 illisible/],
    ['code hors forme', index([{ key: 'RULE_ALL_FAC-16', code: 'apps/a.ts' }]), /`code` de RULE_ALL_FAC-16 illisible/],
    ['deux entrées de même clé', index([entree('RULE_ALL_FAC-16', { niveau: 'high' }), entree('rule_all_fac-16', { niveau: 'low' })]), /deux entrées pour rule_all_fac-16/],
  ]) {
    const r = juger(['README.md'], { [INDEX]: contenu, [R16]: haute }, { [INDEX]: contenu, [R16]: haute });
    assert.equal(r.reponse, ILLISIBLE, nom);
    assert.deepEqual(r.illisibles.map((m) => m.split(' : ')[0]), ['origin/develop', TETE], `${nom} : la base et la tête, chacune dite une fois`);
    assert.match(r.illisibles[0], attendu, nom);
  }
  const enTete = juger(['README.md'], { [R16]: regle('RULE_ALL_FAC-16', { criticite: 'criticality: haute\n' }) });
  assert.equal(enTete.reponse, ILLISIBLE);
  assert.equal(enTete.illisibles.length, 1, 'la base, la tête et le départ sont le même commit : dit une fois');
  assert.match(enTete.illisibles[0], /^origin\/develop:docs\/metier\/regles\/all\/RULE_ALL_FAC-16\.md : criticité « haute »/);
  const sansTete = doubleRelecture({ fichiers: ['README.md'], base: 'develop', tete: TETE, lecteur: lecteur({ [DEVELOP]: {}, [DEPART]: {} }, ['README.md']) });
  assert.deepEqual([sansTete.reponse, sansTete.illisibles], [ILLISIBLE, [`référence ${TETE} introuvable`]]);
  const sansDevelop = doubleRelecture({ fichiers: ['README.md'], base: 'sujet/facture', tete: TETE, lecteur: lecteur({ [SUJET]: {}, [TETE]: {}, [DEPART]: {} }, ['README.md']) });
  assert.deepEqual([sansDevelop.reponse, sansDevelop.illisibles], [ILLISIBLE, ['référence origin/develop introuvable']], 'un dépôt sans origin/develop');
  const cite = juger(['"docs/m\\303\\251tier', 'README.md'], {});
  assert.equal(cite.reponse, ILLISIBLE);
  assert.deepEqual(cite.illisibles, ["une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit"], "la ligne n'est pas recopiée");
});

test('une cause établie suffit : une lecture en échec à côté ne retire pas « exigée », et reste dite', () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]) };
  const r = juger([CODE], base, { [INDEX]: '{' });
  assert.equal(r.reponse, EXIGEE);
  assert.equal(r.illisibles.length, 1);
  assert.equal(texte(r), `RULE_ALL_FAC-16\tcode\t${CODE}\torigin/develop\n# illisible : ${TETE} : ${INDEX} n'est pas du JSON\nexigée\n`, 'le verdict est la dernière ligne');
});

test('`Relecture: double` écrite sur le ticket, dans son en-tête, sur la base : exigée, quels que soient les fichiers', () => {
  const base = { [TICKET]: ticket('Relecture: double # règle de criticité haute\n') };
  const r = juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.03');
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`]);
  assert.equal(juger(['README.md'], base, {}).reponse, NON_EXIGEE, 'PR sans ticket : la ligne de ce ticket ne la concerne pas');
  assert.equal(juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.04').reponse, NON_EXIGEE, "le ticket d'à côté");
  assert.equal(juger(['README.md'], { [TICKET]: ticket('', '- Relecture: double\n\nRelecture: double\n') }, {}, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, 'dans le corps, ce n\'est pas la ligne');
  // Une PR ne retire pas la ligne de son propre ticket : la base la porte. Et la ligne qu'elle ajoute est lue sur sa tête.
  assert.equal(juger([TICKET], base, { [TICKET]: ticket() }, 'SPEC_ALL_FAC-1.03').reponse, EXIGEE);
  assert.deepEqual(causes(juger([TICKET], { [TICKET]: ticket() }, base, 'SPEC_ALL_FAC-1.03')), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · tete`]);
});

test('ligne `Relecture:` d\'une autre valeur, ticket en double : illisible ; ticket absent de la base ou archivé : une remarque, pas une cause', () => {
  for (const valeur of ['triple', 'Double', 'double, puis simple', '']) {
    const r = juger(['README.md'], { [TICKET]: ticket(`Relecture: ${valeur}\n`) }, {}, 'SPEC_ALL_FAC-1.03');
    assert.equal(r.reponse, ILLISIBLE, valeur);
    assert.match(r.illisibles[0], /ligne `Relecture:` « .* », seule valeur `double`$/);
  }
  const double = juger(['README.md'], { [TICKET]: ticket(), [TICKET.replace('-facture', '-total')]: ticket() }, {}, 'SPEC_ALL_FAC-1.03');
  assert.equal(double.reponse, ILLISIBLE);
  const archive = TICKET.replace('/issues/', '/issues/archive/');
  for (const base of [{}, { [archive]: ticket('Relecture: double\n') }]) {
    const r = juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.03');
    assert.deepEqual([r.reponse, r.remarques], [NON_EXIGEE, [`ticket SPEC_ALL_FAC-1.03 absent de origin/develop, ${TETE} : aucun en-tête lu`]]);
  }
});

test("un ticket qui cite une règle haute en `Règles:` exige deux relectures, sans champ `code` ni ligne `Relecture: double` (A-113)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature' }), entree('RULE_ALL_FAC-17', { niveau: 'medium' })]) };
  const avec = (ligne) => juger([CODE], { ...regles, [TICKET]: ticket(ligne) }, undefined, 'SPEC_ALL_FAC-1.03');
  const r = avec('Règles: RULE_ALL_FAC-17, `RULE_ALL_FAC-16` # la règle du total\n');
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`]);
  for (const ligne of ['', 'Règles: —\n', 'Règles: RULE_ALL_FAC-17\n', 'Règles: RULE_ALL_FAC-99\n']) assert.equal(avec(ligne).reponse, NON_EXIGEE, ligne || 'sans ligne `Règles:`');
  assert.equal(juger([CODE], { ...regles, [TICKET]: ticket('', 'Règles: RULE_ALL_FAC-16\n') }, undefined, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, "dans le corps, ce n'est pas la ligne");
  assert.equal(juger([CODE], { ...regles, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') }).reponse, NON_EXIGEE, 'PR sans ticket');
  for (const mal of ['FAC-16', 'RULE_ALL_FAC-16 (en partie)', 'SPEC_ALL_FAC-1.03']) {
    const illisible = avec(`Règles: ${mal}\n`);
    assert.equal(illisible.reponse, ILLISIBLE, mal);
    assert.match(illisible.illisibles[0], /ligne `Règles:`, « .* » n'est pas un identifiant de règle$/);
  }
  // Sans index, le niveau vient de l'en-tête ; la règle haute sur la tête seule (la PR la monte) compte aussi.
  const enTetes = { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') };
  assert.deepEqual(causes(juger([CODE], enTetes, undefined, 'SPEC_ALL_FAC-1.03')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`]);
  const moyenne = { [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }), [TICKET]: enTetes[TICKET] };
  assert.equal(juger([CODE], moyenne, undefined, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE);
  assert.ok(causes(juger([R16], moyenne, enTetes, 'SPEC_ALL_FAC-1.03')).includes(`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`));
});

test("le niveau se lit aussi sur origin/develop : une règle montée dans develop seul est vue par la sous-PR d'un sujet en retard (A-113)", () => {
  const moyenne = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE, code: CODE_BLOC }) };
  const haute = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }) };
  const r = calculer({ fichiers: [CODE], develop: haute, sujet: moyenne });
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], "ni le sujet ni la tête ne la disent haute, et ce n'est pas un changement de la PR");
  assert.equal(calculer({ fichiers: [CODE], develop: moyenne, sujet: moyenne }).reponse, NON_EXIGEE);
  assert.equal(calculer({ fichiers: ['README.md'], develop: haute, sujet: moyenne }).reponse, NON_EXIGEE, 'la sous-PR ne touche ni la règle ni son code');
  // Le ticket de la sous-PR cite la règle : haute dans develop seul, elle compte.
  const cite = calculer({ fichiers: ['README.md'], develop: haute, sujet: { ...moyenne, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') }, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(cite), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · ${SUJET}`]);
});

test("l'en-tête du ticket se lit sur la base, sur origin/develop et sur chaque origin/sujet/* : une PR hors-sujet vers develop, dont le ticket ne vit que sur son sujet, est vue (A-113)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) };
  const horsSujet = (sujet, refs = {}) => calculer({ fichiers: ['README.md'], develop: regles, sujet, versDevelop: true, tickets: ['SPEC_ALL_FAC-1.03'], refs });
  assert.deepEqual(causes(horsSujet({ ...regles, [TICKET]: ticket('Relecture: double\n') })), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · ${SUJET}`]);
  assert.deepEqual(causes(horsSujet({ ...regles, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') })), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · ${SUJET}`]);
  assert.equal(horsSujet({ ...regles, [TICKET]: ticket() }).reponse, NON_EXIGEE);
  const autre = horsSujet({ ...regles }, { 'origin/sujet/autre': { [TICKET]: ticket('Relecture: double\n') } });
  assert.deepEqual(causes(autre), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/sujet/autre`], 'un autre sujet que celui du montage');
  const nullePart = horsSujet({ ...regles });
  assert.deepEqual([nullePart.reponse, nullePart.remarques], [NON_EXIGEE, [`ticket SPEC_ALL_FAC-1.03 absent de origin/develop, ${SUJET} : aucun en-tête lu`]], 'la tête est le même commit que la base : nommée une fois');
  // Une sous-PR : sa base est le sujet, et le ticket, entré d'abord dans develop, y est lu aussi.
  const sousPr = calculer({ fichiers: ['README.md'], develop: { ...regles, [TICKET]: ticket('Relecture: double\n') }, sujet: { ...regles }, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(sousPr), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`]);
  // Une lecture en échec sur un sujet ne se tait pas, et une cause lue ailleurs suffit.
  const mal = horsSujet({ ...regles, [TICKET]: ticket('Relecture: triple\n') });
  assert.equal(mal.reponse, ILLISIBLE);
  const malEtDouble = horsSujet({ ...regles, [TICKET]: ticket('Relecture: triple\n') }, { 'origin/sujet/autre': { [TICKET]: ticket('Relecture: double\n') } });
  assert.deepEqual([malEtDouble.reponse, malEtDouble.illisibles.length], [EXIGEE, 1]);
});

test("une PR qui change le niveau d'une règle vers ou depuis « haute » exige deux relectures sans toucher ni son fichier ni son code : une criticité fixée sur une feature, au manifeste (A-113)", () => {
  const MANIFESTE = 'anchorpost/manifest.json';
  const moyenne = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [CODE] }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]), [MANIFESTE]: '{}' };
  const haute = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature', code: [CODE] }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]), [MANIFESTE]: '{"featureCriticality": []}' };
  const vers = juger([MANIFESTE, INDEX], moyenne, haute);
  assert.equal(vers.reponse, EXIGEE);
  assert.deepEqual(causes(vers), [`RULE_ALL_FAC-16 · niveau · ${INDEX} · tete`], 'la règle restée haute des deux côtés ne compte pas');
  assert.deepEqual(causes(juger([MANIFESTE, INDEX], haute, moyenne)), [`RULE_ALL_FAC-16 · niveau · ${INDEX} · tete`], 'depuis « haute »');
  assert.equal(juger([MANIFESTE], moyenne, { ...moyenne, [MANIFESTE]: haute[MANIFESTE] }).reponse, NON_EXIGEE, "limite : tant que la PR n'a pas régénéré son index, rien ne dit le niveau nouveau");
  // Une règle qui cesse d'être en vigueur, ou qui change de niveau sous « haute », et les projets sans index.
  const rejetee = { ...haute, [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', statut: 'rejected' }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]) };
  assert.equal(juger([INDEX], haute, rejetee).reponse, EXIGEE);
  const basse = { ...moyenne, [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'low' }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]) };
  assert.equal(juger([INDEX], moyenne, basse).reponse, NON_EXIGEE, 'de moyenne à basse');
  const sansIndex = juger(['README.md'], { [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }) }, { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }) });
  assert.deepEqual(causes(sansIndex), ['RULE_ALL_FAC-16 · niveau · docs/metier/regles/ · tete']);
});

test("le ticket de la PR est celui de `ticketDeLaPr` ; quand le titre et la branche en nomment deux, les deux sont lus et l'un suffit (A-113)", () => {
  const TITRE = 'feat(api): total (SPEC_ALL_FAC-1.04)';
  assert.deepEqual(ticketsDeLaPr(TITRE, BRANCHE), ['SPEC_ALL_FAC-1.04', 'SPEC_ALL_FAC-1.03']);
  assert.deepEqual(ticketsDeLaPr('feat(api): total (SPEC_ALL_FAC-1.03)', BRANCHE), ['SPEC_ALL_FAC-1.03']);
  assert.deepEqual(ticketsDeLaPr('feat(api): total', BRANCHE), ['SPEC_ALL_FAC-1.03']);
  assert.deepEqual(ticketsDeLaPr(TITRE, 'docs/une-note'), ['SPEC_ALL_FAC-1.04']);
  assert.deepEqual(ticketsDeLaPr(TITRE, 'sujet/spec-all-fac-1-03'), ['SPEC_ALL_FAC-1.04']);
  for (const [titre, branche] of [['docs: une note', 'docs/une-note'], ['', ''], [undefined, undefined]]) assert.deepEqual(ticketsDeLaPr(titre, branche), []);
  const TICKET_04 = TICKET.replace('.03.', '.04.');
  for (const [double, simple] of [[TICKET, TICKET_04], [TICKET_04, TICKET]]) {
    const r = calculer({ fichiers: ['README.md'], develop: { [double]: ticket('Relecture: double\n'), [simple]: ticket() }, tickets: ticketsDeLaPr(TITRE, BRANCHE) });
    assert.equal(r.reponse, EXIGEE, double);
    assert.equal(r.causes[0].chemin, double);
  }
  assert.equal(calculer({ fichiers: ['README.md'], develop: { [TICKET]: ticket(), [TICKET_04]: ticket() }, tickets: ticketsDeLaPr(TITRE, BRANCHE) }).reponse, NON_EXIGEE);
});

test("les lignes `Règles:` et `Relecture:` se lisent aux formes que le gate `tickets` lit, et à la puce étoile : en gras, en puce, sans égard à la casse (A-117, A-122)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) };
  const avec = (ligne) => juger(['README.md'], { ...regles, [TICKET]: ticket(ligne) }, undefined, 'SPEC_ALL_FAC-1.03');
  for (const ligne of ['**Règles:** RULE_ALL_FAC-16\n', '- Règles: RULE_ALL_FAC-16\n', '* Règles: RULE_ALL_FAC-16\n', '*\t**Règles** : RULE_ALL_FAC-16\n', 'règles: RULE_ALL_FAC-16\n', '- **RÈGLES** : `RULE_ALL_FAC-16`\n', 'Règles : RULE_ALL_FAC-16\r\n'])
    assert.deepEqual(causes(avec(ligne)), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`], ligne);
  for (const ligne of ['**Relecture:** double\n', '- Relecture: double\n', '* Relecture: double\n', 'relecture: double\n', '- **Relecture** : double # deux relectures\n'])
    assert.deepEqual(causes(avec(ligne)), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`], ligne);
  for (const ligne of ['**Relecture:** triple\n', '- Relecture: simple\n', 'RELECTURE: Double\n']) assert.equal(avec(ligne).reponse, ILLISIBLE, ligne);
  for (const ligne of ['Les règles: RULE_ALL_FAC-16\n', '  Règles: RULE_ALL_FAC-16\n', '> Règles: RULE_ALL_FAC-16\n']) assert.equal(avec(ligne).reponse, NON_EXIGEE, `${ligne} : le gate ne la lit pas non plus`);
});

test("le ticket que la PR crée elle-même est lu sur sa tête : une règle haute qu'il cite, ou sa ligne `Relecture: double`, suffit (A-117)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) };
  const cree = (ligne) => juger([TICKET], regles, { ...regles, [TICKET]: ticket(ligne) }, 'SPEC_ALL_FAC-1.03');
  assert.deepEqual(causes(cree('Règles: RULE_ALL_FAC-16\n')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · tete`]);
  assert.deepEqual(causes(cree('Relecture: double\n')), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · tete`]);
  assert.equal(cree('').reponse, NON_EXIGEE);
  assert.equal(cree('Relecture: triple\n').reponse, ILLISIBLE);
  // Le ticket est sur la base sans la ligne, la PR la lui ajoute : lue sur la tête ; la PR la lui retire : lue sur la base.
  const sans = { ...regles, [TICKET]: ticket() };
  const cite = { ...regles, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') };
  assert.deepEqual(causes(juger([TICKET], sans, cite, 'SPEC_ALL_FAC-1.03')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · tete`]);
  assert.deepEqual(causes(juger([TICKET], cite, sans, 'SPEC_ALL_FAC-1.03')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`]);
});

test("un ticket sans ligne `Règles:` : celle de sa spec est lue à sa place, dans tous les arbres ; `Règles: —` sur le ticket dit « aucune », une ligne vide ne dit rien (A-117, A-122)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' }), entree('RULE_ALL_FAC-17', { niveau: 'medium' })]) };
  const avec = (ligneDuTicket, laSpec = spec('Règles: RULE_ALL_FAC-17, RULE_ALL_FAC-16\n')) =>
    juger(['README.md'], { ...regles, [TICKET]: ticket(ligneDuTicket), ...(laSpec ? { [SPEC]: laSpec } : {}) }, undefined, 'SPEC_ALL_FAC-1.03');
  assert.deepEqual(causes(avec('')), [`RULE_ALL_FAC-16 · Règles: · ${SPEC} · origin/develop`], 'la cause nomme la spec');
  for (const ligne of ['Règles: —\n', '- **Règles** : —\n', 'Règles: RULE_ALL_FAC-17\n']) assert.equal(avec(ligne).reponse, NON_EXIGEE, `${ligne} : le ticket porte sa ligne`);
  assert.equal(avec('', spec('Règles: RULE_ALL_FAC-17\n')).reponse, NON_EXIGEE, 'la spec ne cite que la règle moyenne');
  assert.equal(avec('', spec('', 'Règles: RULE_ALL_FAC-16\n')).reponse, NON_EXIGEE, "dans le corps de la spec, ce n'est pas la ligne");
  assert.equal(avec('', spec()).reponse, NON_EXIGEE, 'ni le ticket ni la spec');
  assert.equal(avec('', null).reponse, NON_EXIGEE, 'pas de spec dans cet arbre');
  // Une ligne `Règles:` vide n'est pas « aucune » : elle est ignorée, et la spec est lue (A-122).
  for (const ligne of ['Règles:\n', 'Règles: \n', '- **Règles** :\n', 'Règles: # à remplir\n']) assert.deepEqual(causes(avec(ligne)), [`RULE_ALL_FAC-16 · Règles: · ${SPEC} · origin/develop`], `« ${ligne.trim()} »`);
  assert.equal(avec('Règles:\nRègles: —\n').reponse, NON_EXIGEE, 'une ligne vide et une ligne « aucune » : le ticket porte sa ligne');
  assert.equal(avec('', spec('Règles: FAC-16\n')).reponse, ILLISIBLE, 'un jeton illisible dans la spec');
  // La spec d'à côté n'est pas celle du ticket ; deux fichiers pour la même spec : illisible.
  const voisine = SPEC.replace('FAC-1-facture', 'FAC-2-avoir');
  assert.equal(juger(['README.md'], { ...regles, [TICKET]: ticket(), [voisine]: spec('Règles: RULE_ALL_FAC-16\n') }, undefined, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE);
  const double = { ...regles, [TICKET]: ticket(), [SPEC]: spec(), [SPEC.replace('-facture.spec', '-total.spec')]: spec() };
  assert.equal(juger(['README.md'], double, undefined, 'SPEC_ALL_FAC-1.03').reponse, ILLISIBLE);
  // La spec se cherche dans tous les arbres où le ticket se cherche (A-122) : le ticket que la PR crée, sa spec sur un sujet seul.
  const cree = calculer({ fichiers: [TICKET], develop: regles, sujet: { ...regles, [SPEC]: spec('Règles: RULE_ALL_FAC-16\n') }, tete: { ...regles, [TICKET]: ticket() }, versDevelop: true, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(cree), [`RULE_ALL_FAC-16 · Règles: · ${SPEC} · ${SUJET}`]);
  // Le ticket dit « aucune » sur le sujet, mais n'a pas de ligne sur develop : dans le doute, la spec est lue.
  const partage = calculer({ fichiers: ['README.md'], develop: { ...regles, [TICKET]: ticket(), [SPEC]: spec('Règles: RULE_ALL_FAC-16\n') }, sujet: { ...regles, [TICKET]: ticket('Règles: —\n') }, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.equal(partage.reponse, EXIGEE);
  // Le ticket vit sur un sujet, sa spec aussi.
  const surSujet = calculer({ fichiers: ['README.md'], develop: regles, sujet: { ...regles, [TICKET]: ticket(), [SPEC]: spec('Règles: RULE_ALL_FAC-16\n') }, versDevelop: true, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(surSujet), [`RULE_ALL_FAC-16 · Règles: · ${SPEC} · ${SUJET}`]);
});

test("l'entrée : une tabulation ou un octet nul, un chemin qui n'existe dans aucun des arbres de la PR : « illisible », jamais « non exigée » (A-117, A-122)", () => {
  const arbre = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [CODE]: 'x', 'README.md': 'x' };
  const lire = (fichiers, tete = arbre, depart = arbre) => calculer({ fichiers, develop: arbre, tete, depart, existants: [] });
  assert.equal(lire([CODE]).reponse, EXIGEE);
  assert.equal(lire(['README.md']).reponse, NON_EXIGEE);
  for (const [nom, fichiers] of [['--name-status', [`M\t${CODE}`]], ['-z', [`${CODE}\0README.md\0`]], ['une tabulation à la fin', [`${CODE}\t`]]]) {
    const r = lire(fichiers);
    assert.deepEqual([r.reponse, r.causes], [ILLISIBLE, []], nom);
    assert.match(r.illisibles[0], /^l'entrée porte une tabulation ou un octet nul/);
  }
  const absent = lire(['README.md', 'apps/absent.ts']);
  assert.deepEqual([absent.reponse, absent.illisibles], [ILLISIBLE, ["1 chemin(s) de l'entrée n'existent ni au départ, ni à la tête, ni sur la cible, ni sur develop : attendu la sortie de `git diff --name-only --no-renames`"]]);
  assert.equal(lire([CODE, 'apps/absent.ts']).reponse, ILLISIBLE, 'un chemin inconnu rend toute l\'entrée suspecte : aucune cause n\'en est tirée');
  // Supprimé par la PR : au départ seul. Ajouté par la PR : à la tête seule. Casse et accents comparés comme git les écrit.
  const sansCode = { [INDEX]: arbre[INDEX], 'README.md': 'x' };
  assert.equal(lire([CODE], sansCode, arbre).reponse, EXIGEE);
  assert.equal(lire([CODE], arbre, sansCode).reponse, EXIGEE);
  // Au départ seul : la PR supprime un fichier que sa cible a supprimé aussi depuis.
  assert.equal(calculer({ fichiers: [CODE], develop: sansCode, tete: sansCode, depart: arbre, existants: [] }).reponse, EXIGEE, 'le chemin existe au départ, et la règle le nomme encore');
  // Ni au départ ni à la tête, mais sur la cible : la PR en retard qui supprime un fichier arrivé depuis sur sa cible.
  assert.equal(lire([CODE], sansCode, sansCode).reponse, EXIGEE, 'le chemin existe sur la cible, où la règle le nomme');
  // La PR de mise à jour d'un sujet dont une retouche supprime un fichier venu de develop : ni au départ (le sujet), ni
  // à la tête, ni sur la cible (le sujet) ; sur develop seul. Une PR ordinaire, pas une entrée suspecte (A-122).
  const sujet = { 'README.md': 'x' };
  const maj = calculer({ fichiers: ['apps/venu.ts'], develop: { ...sujet, 'apps/venu.ts': 'x' }, sujet, tete: sujet, existants: [] });
  assert.deepEqual([maj.reponse, maj.illisibles], [NON_EXIGEE, []]);
  assert.equal(calculer({ fichiers: ['apps/venu.ts'], develop: sujet, sujet, tete: sujet, existants: [] }).reponse, ILLISIBLE, 'dans aucun des quatre arbres');
  // La sous-PR en retard qui supprime un fichier arrivé depuis sur son sujet : sur la cible seule.
  const enRetard = calculer({ fichiers: ['apps/arrive.ts'], develop: sujet, sujet: { ...sujet, 'apps/arrive.ts': 'x' }, tete: sujet, depart: sujet, existants: [] });
  assert.deepEqual([enRetard.reponse, enRetard.illisibles], [NON_EXIGEE, []]);
  assert.equal(lire(['', '  ', 'README.md\r']).reponse, NON_EXIGEE, 'lignes vides et fin de ligne CRLF');
  assert.equal(lire([]).reponse, NON_EXIGEE, "un diff vide : l'appelant répond de sa lecture");
});

test("les chemins de `code` sont normalisés : un double slash, un `./`, un détour par `..` nomment le même fichier ; la racine du dépôt n'est pas « aucun fichier » (A-117, A-122)", () => {
  for (const chemin of ['apps//api/src/facture/total.ts', 'apps/api/./src/facture/total.ts', './apps/api/src/facture/total.ts', 'apps/api/src/x/../facture/total.ts', 'apps/api/src/facture//', 'Apps/API/src/facture/total.ts']) {
    assert.deepEqual(causes(juger([CODE], { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [chemin] })]) })), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], chemin);
    assert.equal(juger([CODE], { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE, code: `code: [ "${chemin}" ]\n` }) }).reponse, EXIGEE, `${chemin}, dans l'en-tête`);
  }
  assert.equal(juger([CODE], { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: ['apps/api/src/facture/total'] })]) }).reponse, NON_EXIGEE, 'un autre fichier que celui du diff');
  // Une entrée qui nomme la racine du dépôt, ou en sort, ne dit pas « aucun fichier » : illisible, pour une règle haute (A-122).
  for (const chemin of ['.', './', '/', '', 'apps/..', '../apps/api/src/facture/total.ts', 'apps/../../x']) {
    const r = juger([CODE], { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [chemin] })]) });
    assert.equal(r.reponse, ILLISIBLE, `« ${chemin} »`);
    assert.match(r.illisibles[0], /une entrée de `code` de RULE_ALL_FAC-16 nomme la racine du dépôt ou en sort$/);
    assert.equal(juger([CODE], { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [chemin] })]) }).reponse, NON_EXIGEE, `« ${chemin} » d'une règle moyenne`);
  }
  assert.equal(juger([CODE], { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE, code: 'code: [.]\n' }) }).reponse, ILLISIBLE, '`code: [.]` dans un en-tête');
});

test("la sortie : une ligne par cause, par échec, par remarque, le verdict seul en dernière ligne ; rien de ce qui est lu n'écrit une ligne de plus (A-117)", () => {
  const sale = { reponse: ILLISIBLE, causes: [], illisibles: ['ligne `Relecture:` « double\nnon exigée\r\n», seule valeur `double`', `a${String.fromCharCode(0x2028)}non exigée${String.fromCharCode(0x85)}b\tc`], remarques: ['une\nremarque'] };
  assert.equal(texte(sale), '# illisible : ligne `Relecture:` « double non exigée », seule valeur `double`\n# illisible : a non exigée b c\n# une remarque\nillisible\n');
  const cause = { reponse: EXIGEE, causes: [{ sujet: 'RULE_ALL_FAC-16\nnon exigée', motif: 'code', chemin: 'apps/a\tb.ts', ref: 'origin/develop' }], illisibles: [], remarques: [] };
  assert.equal(texte(cause), 'RULE_ALL_FAC-16 non exigée\tcode\tapps/a b.ts\torigin/develop\nexigée\n');
  for (const r of [sale, cause]) assert.deepEqual(texte(r).split('\n').filter((l) => [EXIGEE, NON_EXIGEE, ILLISIBLE].includes(l)), [r.reponse], 'une seule ligne est un verdict');
  assert.equal(texte({ reponse: ILLISIBLE, causes: [], illisibles: ['x'.repeat(5000)], remarques: [] }).length, '# illisible : \nillisible\n'.length + 500, 'un message est borné');
});

// ── Les lecteurs ──────────────────────────────────────────────────────────────────────────────────────────────────
test("l'en-tête d'une règle : les formes lues, et ce qui est refusé plutôt que deviné", () => {
  const lu = (criticite, code = '', statut = 'validated') => enTeteDeRegle(regle('RULE_ALL_FAC-16', { criticite, code, statut }));
  assert.deepEqual(lu(''), { niveau: null, code: [], enVigueur: true });
  assert.deepEqual(lu(HAUTE_BLOC, CODE_BLOC), { niveau: 'high', code: [CODE], enVigueur: true });
  assert.deepEqual(lu('criticality: medium # à revoir\n', `code:\n- ${CODE} # le calcul\n- 'apps/web/a b.ts'\n`, 'obsolete'), { niveau: 'medium', code: [CODE, 'apps/web/a b.ts'], enVigueur: false });
  assert.deepEqual(lu("criticality: { reason: 'jamais, level: high', level: low, by: agent }\n", 'code: []\n').niveau, 'low', 'un `level:` dans une raison entre guillemets n\'est pas le niveau');
  assert.deepEqual(lu('criticality:\n  {\n    level: high,\n    by: agent,\n  }\n', `code:\n  [\n    ${CODE},\n    "apps/web/a.ts",\n  ]\n`), { niveau: 'high', code: [CODE, 'apps/web/a.ts'], enVigueur: true }, 'mappage et liste en ligne pliés par un formateur');
  // Un commentaire dans un mappage plié ne cache pas la suite, et ne devient pas la valeur (A-117).
  assert.equal(lu('criticality:\n  {\n    level: high,\n    by: agent, # avant: x, level: low\n  }\n').niveau, 'high');
  assert.equal(lu('criticality: { # avant, level: low\n  level: high, by: agent }\n').niveau, 'high');
  assert.equal(enTeteDeRegle('---\nid: RULE_ALL_FAC-16\nvalidation:\n  {\n    status: validated, # a: b, status: rejected\n    date: 2026-11-16,\n  }\ncriticality: high\n---\n').enVigueur, true);
  assert.deepEqual(lu('', 'code:\n  [\n    a.ts, # b.ts, c.ts\n    "d # e.ts",\n  ]\n').code, ['a.ts', 'd # e.ts'], 'un `#` entre guillemets reste dans la valeur');
  // Une apostrophe de texte n'ouvre pas une chaîne : un guillemet ne compte qu'en tête de valeur (A-122).
  assert.equal(lu("criticality:\n  {\n    reason: c'est grave, # ', level: low,\n    by: l'agent, level: high, # '\n  }\n").niveau, 'high');
  assert.equal(lu("criticality: { level: high, by: agent, reason: c'est grave }\n").niveau, 'high');
  // `''` est l'apostrophe échappée de YAML : dans une chaîne entre apostrophes, elle ne la ferme pas (troisième tour).
  assert.equal(lu(`criticality: { reason: 'a'', level: low, z: "', level: high, by: "ag" }\n`).niveau, 'high', "le niveau caché derrière `''` est lu");
  assert.equal(enTeteDeRegle(`---\nid: RULE_ALL_FAC-16\nvalidation: { note: 'a'', status: validated, z: "', status: rejected }\ncriticality: high\n---\n`).enVigueur, false, "le statut caché derrière `''` est lu");
  assert.equal(lu("criticality:\n  {\n    reason: 'l''agent # pas un commentaire', level: high,\n    by: agent,\n  }\n").niveau, 'high', "un `#` après `''` reste dans la chaîne");
  assert.equal(lu("criticality: { reason: '', level: high }\n").niveau, 'high', 'la chaîne vide reste une chaîne vide');
  assert.deepEqual(lu("criticality: 'high' # l''agent\n", "code:\n  - 'apps/l''un/x.ts' # c'est tout\n  - 'apps/''.ts'\n  - ''''\n"), { niveau: 'high', code: ["apps/l'un/x.ts", "apps/'.ts", "'"], enVigueur: true }, "`''` est rendu en apostrophe dans une valeur");
  assert.throws(() => lu('', "code:\n  - 'apps/a.ts''\n"), Illisible, 'une chaîne entre apostrophes non refermée');
  assert.equal(lu("criticality: { reason: l'un, level: low, by: 'x, level: high' }\n").niveau, 'low', "la chaîne ouverte en tête de valeur garde sa virgule");
  assert.deepEqual(lu('', "code: [ apps/l'un.ts, 'apps/a, b.ts', apps/d'un.ts ]\n").code, ["apps/l'un.ts", 'apps/a, b.ts', "apps/d'un.ts"]);
  assert.deepEqual(lu('', "code:\n  - apps/l'un.ts # l'autre\n  - 'apps/a # b.ts' # c'est tout\n  - \"apps/c.ts\"\n").code, ["apps/l'un.ts", 'apps/a # b.ts', 'apps/c.ts']);
  assert.deepEqual(lu('', "code:\n  [\n    apps/l'un.ts, # d'abord\n    'apps/a # b.ts', # l'autre\n  ]\n").code, ["apps/l'un.ts", 'apps/a # b.ts']);
  assert.equal(lu('# criticality: high\nextensions:\n  projet:\n    criticality: high\n').niveau, null, 'ni un commentaire ni une clé imbriquée ne sont la clé');
  assert.equal(enTeteDeRegle(String.fromCharCode(0xfeff) + '---\r\nid: RULE_ALL_FAC-16\r\ncriticality: high\r\nvalidation: { status: rejected, date: 2026-11-16 }\r\n---\r\n').enVigueur, false, 'BOM, CRLF, validation en ligne');
  for (const [nom, texte] of [
    ['sans en-tête', 'criticality: high\n'],
    ['en-tête non refermé', '---\ncriticality: high\n'],
    ['niveau hors vocabulaire', regle('R', { criticite: 'criticality: HIGH\n' })],
    ['criticality vide', regle('R', { criticite: 'criticality:\n' })],
    ['criticality sans level', regle('R', { criticite: 'criticality:\n  by: agent\n' })],
    ['level deux fois', regle('R', { criticite: 'criticality:\n  level: low\n  level: high\n' })],
    ['clé deux fois', regle('R', { criticite: 'criticality: low\ncriticality: high\n' })],
    ['mappage non refermé', regle('R', { criticite: 'criticality: { level: high,\n  by: agent\n' })],
    ['clé en double dans un mappage', regle('R', { criticite: 'criticality: { level: low, by: agent, level: high }\n' })],
    ['clé en double dans un mappage plié', regle('R', { criticite: 'criticality:\n  {\n    level: high,\n    level: low,\n  }\n' })],
    ['clé vide dans un mappage', regle('R', { criticite: 'criticality: { : high }\n' })],
    ['texte puis mappage', regle('R', { criticite: 'criticality: haute { level: high }\n' })],
    ['clé entre guillemets', regle('R', { criticite: '"criticality": high\n' })],
    ['code en texte', regle('R', { code: 'code: apps/a.ts\n' })],
    ['code en mappage', regle('R', { code: 'code:\n  fichier: apps/a.ts\n' })],
    ['liste non refermée', regle('R', { code: 'code: [ apps/a.ts\n' })],
    ['texte après la liste', regle('R', { code: 'code: [ apps/a.ts ] et b.ts\n' })],
  ])
    assert.throws(() => enTeteDeRegle(texte), Illisible, nom);
});

test("lecture en temps linéaire : trois en-têtes hostiles de 300 000 caractères, lus ou refusés en moins de 2 s", () => {
  const debut = Date.now();
  const n = 300_000;
  assert.throws(() => enTeteDeRegle(regle('R', { criticite: `criticality: {${' '.repeat(n)}level: high\n` })), Illisible, 'des blancs sans fin, mappage non refermé');
  assert.equal(enTeteDeRegle(regle('R', { criticite: `criticality: { level: high, reason: "${'a, '.repeat(n / 3)}" }${' '.repeat(n)}# fin\n` })).niveau, 'high');
  assert.equal(enTeteDeRegle(regle('R', { code: `code:\n${'  - a.ts\n'.repeat(n / 10)}` })).code.length, n / 10);
  assert.ok(Date.now() - debut < 2000, `${Date.now() - debut} ms`);
});

test("l'index : `rules[].key`, `criticality.level`, `code`, `validation.status`, aux pivots 2 et 3", () => {
  for (const schema of ['2', '3']) {
    const regles = reglesDeLIndex(index([entree('RULE_FNSMR_LIC-05', { niveau: 'high', origin: 'feature', code: ['a.ts'], statut: 'obsolete' }), entree('RULE_ALL_FAC-1')], schema));
    assert.deepEqual(regles.get('rule_fnsmr_lic-05'), { cle: 'RULE_FNSMR_LIC-05', niveau: 'high', code: ['a.ts'], enVigueur: false });
    assert.deepEqual(regles.get('rule_all_fac-1'), { cle: 'RULE_ALL_FAC-1', niveau: null, code: [], enVigueur: true });
  }
  assert.throws(() => reglesDeLIndex('[]'), Illisible);
  assert.throws(() => reglesDeLIndex(index([{ title: 'sans clé' }])), Illisible);
});

test('les lignes de `git diff --name-only`, citées ou non ; les arguments', () => {
  assert.equal(cheminDuDiff('  Docs/Metier/Regles/ALL/RULE_ALL_FAC-16.md '), 'docs/metier/regles/all/rule_all_fac-16.md');
  assert.equal(cheminDuDiff('"docs/m\\303\\251tier/a\\tb.md"'), 'docs/métier/a\tb.md');
  for (const mal of ['"docs/a.md', '"docs/\\q.md"', '"a"b"']) assert.throws(() => cheminDuDiff(mal), Illisible, mal);
  assert.deepEqual(lireArguments(['--base', 'develop', '--tete', 'abc', '--branche', BRANCHE]), { base: 'develop', tete: 'abc', branche: BRANCHE });
  // La base : un nom de branche, lu `refs/remotes/origin/<branche>` en entier. La tête : un sha. Rien d'autre, et le refus ne recopie pas l'argument.
  assert.equal(brancheDOrigin('develop'), 'refs/remotes/origin/develop');
  assert.equal(brancheDOrigin('sujet/facture-2.x'), 'refs/remotes/origin/sujet/facture-2.x');
  for (const mal of ['HEAD', '', ' develop', 'develop ', 'a b', 'develop\nnon exigée', 'develop\n', '-develop', '--all', 'a..b', 'a//b', 'sujet/', '/develop', 'sujet/.x', 'x.lock', 'x.', 'develop^', 'develop~1', 'a:b', 'a*', 'origin/develop@{1}', undefined, 42])
    assert.throws(() => brancheDOrigin(mal), (e) => e instanceof Illisible && e.message === 'branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`', `${mal}`);
  assert.equal(sommet(TETE), TETE);
  for (const mal of ['HEAD', 'develop', 'origin/develop', TETE.slice(1), `${TETE}0`, TETE.toUpperCase(), `${TETE}^`, `${TETE}\nnon exigée`, '', undefined])
    assert.throws(() => sommet(mal), (e) => e instanceof Illisible && e.message === 'sommet refusé : attendu un sha de 40 caractères', `${mal}`);
  assert.deepEqual(lireArguments(['--titre', '', '--branche', '', '--tete', 'abc', '--base', 'b']), { titre: '', branche: '', tete: 'abc', base: 'b' }, 'un titre ou une branche vides sont admis');
  for (const mal of [[], ['--base', 'x'], ['--tete', 'x'], ['--base', 'x', '--tete'], ['--base', 'x', '--tete', 'y', '--ticket', 'z'], ['--base', 'x', '--base', 'y', '--tete', 'z'], ['--base', '', '--tete', 'y']])
    assert.equal(lireArguments(mal), null, mal.join(' '));
});

test('les lignes du diff se lisent comme `revue-exigee.mjs` les lit : la copie est tenue en parité', async () => {
  const { cheminLu } = await import('./revue-exigee.mjs');
  assert.equal(typeof cheminLu, 'function', '`cheminLu` de revue-exigee.mjs, posé à côté dans scripts/chaine/');
  for (const ligne of ['apps/A.ts', ' Docs/É.md ', '"docs/m\\303\\251tier/a\\tb.md"', '"a\\"b\\\\c"', 'docs/e\u0301.md', 'ſ.md']) assert.equal(cheminDuDiff(ligne), cheminLu(ligne), ligne);
  for (const mal of ['"docs/a.md', '"docs/\\q.md"', '"a"b"', '"']) {
    assert.equal(cheminLu(mal), null, mal);
    assert.throws(() => cheminDuDiff(mal), Illisible, mal);
  }
});

// ── Les lectures git et la ligne de commande, depuis une copie des outils hors du dépôt ───────────────────────────
function g(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: ENV_PROPRE }).trim();
}
/** Écrit `fichiers` dans le dépôt et les commite sur la branche courante ; rend le sha. */
function commit(depot, fichiers, message) {
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(depot, chemin)), { recursive: true });
    writeFileSync(join(depot, chemin), contenu);
  }
  g(depot, 'add', '-A');
  g(depot, 'commit', '-q', '-m', message);
  return g(depot, 'rev-parse', 'HEAD');
}
/** Le montage M : `origin/develop` porte l'index avec la règle haute et son `code`, et une branche de ticket modifie ce fichier de code. */
function depotJouet() {
  const depot = dossier('double-relecture-');
  g(depot, 'init', '-q', '-b', 'develop');
  g(depot, 'config', 'user.email', 'jouet@example.invalid');
  g(depot, 'config', 'user.name', 'Jouet');
  g(depot, 'config', 'core.quotePath', 'true');
  const socle = commit(depot, {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }),
    [TICKET]: ticket(),
    [CODE]: 'export const total = 0;\n',
    'README.md': 'jouet\n',
    'docs/métier/note.md': 'n\n',
  }, 'chore: socle');
  g(depot, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
  g(depot, 'checkout', '-q', '-b', BRANCHE);
  const tete = commit(depot, { [CODE]: 'export const total = 1;\n', 'docs/métier/note.md': 'm\n' }, 'feat(api): total');
  // L'arbre de travail ment : s'il était lu, la règle serait basse et l'index absent.
  writeFileSync(join(depot, R16), regle('RULE_ALL_FAC-16', { criticite: 'criticality: low\n' }));
  rmSync(join(depot, INDEX));
  return { depot, socle, tete };
}
/** Les outils tels que la boucle les reprend d'origin/develop : `scripts/chaine` et `scripts/docs/identifiants.mjs`, rien d'autre. */
function copieDesOutils(nom = 'outils-') {
  const copie = dossier(nom);
  mkdirSync(join(copie, 'scripts/chaine'), { recursive: true });
  mkdirSync(join(copie, 'scripts/docs'));
  copyFileSync(join(ICI, 'double-relecture.mjs'), join(copie, 'scripts/chaine/double-relecture.mjs'));
  copyFileSync(GRAMMAIRE, join(copie, 'scripts/docs/identifiants.mjs'));
  return join(copie, 'scripts/chaine/double-relecture.mjs');
}
/** Lance la ligne de commande ; rend son code, sa sortie, et `verdict`, la dernière ligne de sa sortie. */
function lancer(script, args, { cwd, entree: input = '', options = [], env = {} }) {
  const r = spawnSync(process.execPath, [...options, script, ...args], { cwd, input, encoding: 'utf8', env: { ...ENV_PROPRE, ...env }, timeout: 30_000 });
  return { code: r.status, sortie: r.stdout, erreur: r.stderr, verdict: r.stdout.replace(/\n$/, '').split('\n').pop() };
}
const CAUSE_M = `RULE_ALL_FAC-16\tcode\t${CODE}\torigin/develop\n`;
const USAGE = '# illisible : usage : git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> | node double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]\n';

test("en ligne de commande, depuis la copie des outils de la boucle : les réfs sont lues, jamais l'arbre de travail ; sorties 0, 20, 21, 69 ; le verdict est la dernière ligne", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  const m = ['--base', 'develop', '--tete', tete];
  const diff = g(depot, 'diff', '--no-renames', '--name-only', 'origin/develop', tete);
  assert.match(diff, /^"docs\/m\\303\\251tier\/note\.md"$/m, 'le montage porte un chemin que git cite');
  const exigee = lancer(script, [...m, '--branche', BRANCHE], { cwd: depot, entree: `${diff}\n` });
  assert.deepEqual([exigee.code, exigee.sortie], [SORTIES[EXIGEE], `${CAUSE_M}exigée\n`]);
  assert.equal(SORTIES[EXIGEE], 20);
  const non = lancer(script, m, { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([non.code, non.sortie], [0, 'non exigée\n']);
  const illisible = lancer(script, ['--base', 'absente', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([illisible.code, illisible.sortie], [21, '# illisible : référence origin/absente introuvable\nillisible\n']);
  const sansSommet = lancer(script, ['--base', 'develop', '--tete', '0'.repeat(40)], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([sansSommet.code, sansSommet.sortie], [21, `# illisible : référence ${'0'.repeat(40)} introuvable\nillisible\n`]);
  const horsDepot = lancer(script, m, { cwd: dirname(script), entree: 'README.md\n' });
  assert.deepEqual([horsDepot.code, horsDepot.verdict], [21, 'illisible'], 'hors de tout dépôt git');
  const usage = lancer(script, ['--base', 'develop'], { cwd: depot });
  assert.deepEqual([usage.code, usage.sortie], [21, `${USAGE}illisible\n`]);
  // Sans `git` au PATH : un outil manquant, sortie 69, et toujours « illisible » pour verdict.
  const sansGit = lancer(script, m, { cwd: depot, entree: `${CODE}\n`, env: { PATH: dossier('sans-git-') } });
  assert.deepEqual([sansGit.code, sansGit.sortie], [69, '# illisible : git est requis par les scripts de la chaîne\nillisible\n']);
  assert.deepEqual([SORTIES[NON_EXIGEE], SORTIES[ILLISIBLE], SORTIES.outilManquant], [0, 21, 69]);
});

test("le calcul se place à la racine du dépôt et n'obéit ni au dossier courant, ni à un objet remplacé, ni à un tag ou une branche locale du nom de la cible ; une réf symbolique n'est pas une cible", () => {
  const { depot, socle, tete } = depotJouet();
  const script = copieDesOutils();
  const m = ['--base', 'develop', '--tete', tete];
  // Depuis un sous-dossier : `ls-tree` sans `--full-tree` n'y verrait ni l'index ni les règles.
  for (const sous of ['apps', 'apps/api/src/facture', 'docs']) {
    const r = lancer(script, m, { cwd: join(depot, sous), entree: `${CODE}\n` });
    assert.deepEqual([r.code, r.sortie], [20, `${CAUSE_M}exigée\n`], sous);
  }
  // Un commit sans règle ni index, enfant du socle : ce que la cible ne dit pas.
  g(depot, 'checkout', '-q', '-f', '-b', 'vide', socle);
  rmSync(join(depot, INDEX));
  rmSync(join(depot, R16));
  g(depot, 'add', '-A');
  g(depot, 'commit', '-q', '-m', 'chore: sans règle');
  const vide = g(depot, 'rev-parse', 'HEAD');
  // La branche locale `develop`, un tag `develop`, un tag et une branche locale `origin/develop` disent autre chose que
  // la branche d'origin : `git rev-parse develop` et `git rev-parse origin/develop` les lui préfèrent.
  g(depot, 'branch', '-f', 'develop', vide);
  g(depot, 'tag', 'develop', vide);
  g(depot, 'tag', 'origin/develop', vide);
  g(depot, 'branch', 'origin/develop', vide);
  for (const court of ['develop', 'origin/develop']) assert.equal(g(depot, 'rev-parse', '--verify', '-q', `${court}^{commit}`), vide, `le montage trompe bien une lecture par le nom court ${court}`);
  assert.deepEqual([lancer(script, m, { cwd: depot, entree: `${CODE}\n` }).sortie], [`${CAUSE_M}exigée\n`]);
  for (const nom of ['develop', 'origin/develop']) g(depot, 'tag', '-d', nom);
  g(depot, 'branch', '-D', 'origin/develop');
  // Une réf symbolique n'est pas une branche cible : `origin/HEAD` par son nom, un alias par sa nature.
  g(depot, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/develop');
  g(depot, 'symbolic-ref', 'refs/remotes/origin/alias', 'refs/remotes/origin/develop');
  const parHead = lancer(script, ['--base', 'HEAD', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([parHead.code, parHead.sortie], [21, '# illisible : branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`\nillisible\n']);
  const alias = lancer(script, ['--base', 'alias', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([alias.code, alias.sortie], [21, '# illisible : origin/alias est une référence symbolique\nillisible\n']);
  // Un objet remplacé : le commit de la cible lu comme le commit sans règle.
  g(depot, 'replace', socle, vide);
  assert.equal(g(depot, 'rev-parse', `${socle}^{tree}`), g(depot, 'rev-parse', `${vide}^{tree}`), 'le montage remplace bien le commit de la cible');
  assert.deepEqual([lancer(script, m, { cwd: depot, entree: `${CODE}\n` }).sortie], [`${CAUSE_M}exigée\n`]);
});

test("l'entrée est contrôlée : `-z`, `--name-status`, un chemin qui n'existe dans aucun arbre de la PR sont « illisibles » ; un argument refusé n'est pas recopié", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  const m = ['--base', 'develop', '--tete', tete];
  for (const forme of [['--name-only', '-z'], ['--name-status']]) {
    const entree = execFileSync('git', ['diff', '--no-renames', ...forme, 'origin/develop', tete], { cwd: depot, encoding: 'utf8', env: ENV_PROPRE });
    assert.ok(entree.includes(CODE), 'le chemin du code est bien dans cette entrée');
    const r = lancer(script, m, { cwd: depot, entree });
    assert.deepEqual([r.code, r.sortie], [21, "# illisible : l'entrée porte une tabulation ou un octet nul : attendu la sortie de `git diff --name-only --no-renames`, un chemin par ligne\nillisible\n"], forme.join(' '));
  }
  const inconnu = lancer(script, m, { cwd: depot, entree: `${CODE}\napps/api/src/facture/absent.ts\n` });
  assert.deepEqual([inconnu.code, inconnu.sortie], [21, "# illisible : 1 chemin(s) de l'entrée n'existent ni au départ, ni à la tête, ni sur la cible, ni sur develop : attendu la sortie de `git diff --name-only --no-renames`\nillisible\n"], 'même avec un chemin qui aurait suffi');
  // Un fichier supprimé par la PR existe au départ ; un fichier ajouté, à la tête ; des fins de ligne CRLF passent.
  assert.equal(lancer(script, m, { cwd: depot, entree: `${CODE}\r\nREADME.md\r\n` }).code, 20);
  // Une réf refusée, un titre hostile : rien de ce qui est reçu n'écrit une ligne de verdict.
  for (const base of ['HEAD', 'develop\nnon exigée', '--all', 'a..b']) {
    const r = lancer(script, ['--base', base, '--tete', tete], { cwd: depot, entree: 'README.md\n' });
    assert.deepEqual([r.code, r.sortie], [21, '# illisible : branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`\nillisible\n'], base);
  }
  for (const sha of ['HEAD', 'origin/develop', `${tete}\nnon exigée`, tete.slice(0, 12)]) {
    const r = lancer(script, ['--base', 'develop', '--tete', sha], { cwd: depot, entree: 'README.md\n' });
    assert.deepEqual([r.code, r.sortie], [21, '# illisible : sommet refusé : attendu un sha de 40 caractères\nillisible\n'], sha);
  }
  // Un nom de branche valide qui n'est pas une branche d'origin : introuvable, jamais lu ailleurs.
  assert.equal(lancer(script, ['--base', 'origin/develop', '--tete', tete], { cwd: depot, entree: 'README.md\n' }).sortie, '# illisible : référence origin/origin/develop introuvable\nillisible\n');
  const titre = lancer(script, [...m, '--titre', 'feat: x (SPEC_ALL_FAC-1.03)\nnon exigée', '--branche', 'docs/x\nnon exigée'], { cwd: depot, entree: `${CODE}\n` });
  assert.deepEqual([titre.code, titre.sortie], [20, `${CAUSE_M}exigée\n`]);
});

test("un fichier de code renommé : avec `--no-renames`, son ancien nom est dans l'entrée et la règle qui le nomme est vue", () => {
  const { depot } = depotJouet();
  const script = copieDesOutils();
  g(depot, 'checkout', '-q', '-f', '-b', 'refactor/renomme', 'origin/develop');
  g(depot, 'mv', CODE, 'apps/api/src/facture/somme.ts');
  g(depot, 'commit', '-q', '-m', 'refactor(api): renomme');
  const tete = g(depot, 'rev-parse', 'HEAD');
  const avec = g(depot, 'diff', '--no-renames', '--name-only', 'origin/develop', tete);
  const sans = g(depot, '-c', 'diff.renames=true', 'diff', '--name-only', 'origin/develop', tete);
  assert.ok(avec.split('\n').includes(CODE) && !sans.split('\n').includes(CODE), "sans `--no-renames`, l'ancien nom manque à l'entrée : l'usage l'exige");
  const r = lancer(script, ['--base', 'develop', '--tete', tete], { cwd: depot, entree: `${avec}\n` });
  assert.deepEqual([r.code, r.sortie], [20, `${CAUSE_M}exigée\n`]);
});

test('le ticket se lit dans le titre et dans le nom de la branche de tête, et son en-tête sur la base, la tête et les sujets', () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  g(depot, 'checkout', '-q', '-f', 'develop');
  const base = commit(depot, { [TICKET]: ticket('Relecture: double\n'), [INDEX]: index([]) }, 'docs: relecture double');
  // La cible est une autre branche d'origin que develop : le ticket n'y porte la ligne que là.
  g(depot, 'update-ref', 'refs/remotes/origin/sujet/total', base);
  const args = ['--base', 'sujet/total', '--tete', tete];
  const attendu = `SPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\torigin/sujet/total\nexigée\n`;
  const avec = lancer(script, [...args, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([avec.code, avec.sortie], [20, attendu]);
  for (const branche of ['docs/une-note', 'sujet/spec-all-fac-1-03']) assert.equal(lancer(script, [...args, '--branche', branche], { cwd: depot, entree: 'README.md\n' }).code, 0, branche);
  assert.equal(lancer(script, args, { cwd: depot, entree: 'README.md\n' }).code, 0, 'sans --branche');
  const parLeTitre = lancer(script, [...args, '--titre', 'feat(api): total (SPEC_ALL_FAC-1.03)', '--branche', 'docs/une-note'], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([parLeTitre.code, parLeTitre.sortie], [20, attendu]);
  // Le titre nomme un ticket, la branche un autre : les deux sont lus, celui de la branche suffit.
  const deux = lancer(script, [...args, '--titre', 'feat(api): total (SPEC_ALL_FAC-1.04)', '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.equal(deux.code, 20);
  assert.match(deux.sortie, /^SPEC_ALL_FAC-1\.03\tRelecture: double\t.*\n# ticket SPEC_ALL_FAC-1\.04 absent de .*\nexigée\n$/);
  // Une branche de sujet du dépôt porte le ticket avec la ligne, la base non : il est lu là aussi.
  const surLeSujet = lancer(script, ['--base', 'develop', '--tete', tete, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([surLeSujet.code, surLeSujet.sortie], [20, attendu], 'la cible est develop, le ticket est lu sur la branche de sujet');
  // La PR écrit la ligne sur son propre ticket : lue sur sa tête.
  g(depot, 'update-ref', '-d', 'refs/remotes/origin/sujet/total');
  g(depot, 'checkout', '-q', '-f', BRANCHE);
  const avecTicket = commit(depot, { [TICKET]: ticket('**Relecture:** double\n') }, 'docs: ticket');
  const surLaTete = lancer(script, ['--base', 'develop', '--tete', avecTicket, '--branche', BRANCHE], { cwd: depot, entree: `${TICKET}\n` });
  assert.deepEqual([surLaTete.code, surLaTete.sortie], [20, `SPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\t${avecTicket}\nexigée\n`]);
});

test("le lecteur git lit par un dépôt propre, jetable : un fichier absent du commit, plusieurs fichiers en une lecture, un contenu à accents, la base de fusion, les branches de sujet", () => {
  const { depot, tete } = depotJouet();
  const temporaire = dossier('temporaire-');
  const garde = process.env.TMPDIR;
  process.env.TMPDIR = temporaire;
  const l = lecteurGit(depot);
  try {
    assert.deepEqual(readdirSync(temporaire), [], 'rien avant la première lecture');
    const develop = l.verifier('refs/remotes/origin/develop');
    assert.match(develop, /^[0-9a-f]{40}$/);
    const [propre] = readdirSync(temporaire);
    assert.match(propre, /^double-relecture\./);
    assert.equal(g(join(temporaire, propre, 'depot'), 'rev-parse', '--is-bare-repository'), 'true', 'un dépôt nu');
    assert.deepEqual(readdirSync(join(temporaire, propre, 'depot/refs/heads')), [], 'sans aucune réf : tout se lit par sha');
    assert.deepEqual(l.lister(tete, 'docs/metier/regles/'), [R16]);
    assert.deepEqual(l.lister(tete, 'absent/'), []);
    assert.deepEqual(l.chemins(tete).sort(), [INDEX, CODE, R16, TICKET, 'README.md', 'docs/métier/note.md'].sort());
    const lus = l.lire(tete, [R16, CODE]);
    assert.match(lus.get(R16), /arrondi au centime[\s\S]*Le total est la somme des lignes\.\n$/);
    assert.equal(lus.get(CODE), 'export const total = 1;\n');
    assert.throws(() => l.lire(tete, ['absent.md']), Illisible);
    assert.throws(() => l.verifier('refs/remotes/origin/absente'), /référence origin\/absente introuvable/);
    assert.throws(() => l.verifier('0'.repeat(40)), /introuvable/);
    g(depot, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/develop');
    assert.throws(() => l.verifier('refs/remotes/origin/HEAD'), /origin\/HEAD est une référence symbolique/);
    assert.equal(l.baseDeFusion(develop, tete), develop);
    assert.deepEqual(l.sujets(), []);
    g(depot, 'update-ref', 'refs/remotes/origin/sujet/facture', tete);
    g(depot, 'update-ref', 'refs/remotes/origin/autre', tete);
    assert.deepEqual(l.sujets(), ['refs/remotes/origin/sujet/facture']);
    const orphelin = g(depot, 'commit-tree', '-m', 'sans parent', `${tete}^{tree}`);
    assert.throws(() => l.baseDeFusion(develop, orphelin), /pas de base de fusion/);
    // Le lecteur par défaut du calcul, ouvert sur le dossier courant, est refermé au retour : rien n'attend la fin du processus.
    const courant = process.cwd();
    process.chdir(depot);
    try {
      assert.equal(doubleRelecture({ fichiers: [CODE], base: 'develop', tete }).reponse, EXIGEE);
      assert.equal(readdirSync(temporaire).length, 1, 'seul reste le dépôt propre du lecteur de ce test');
    } finally {
      process.chdir(courant);
    }
  } finally {
    l.fermer();
    if (garde === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = garde;
  }
  assert.deepEqual(readdirSync(temporaire), [], 'le dépôt propre est retiré');
});

/** Une PR qui monte une règle par l'index seul : develop la dit moyenne, la tête haute, ni son fichier ni son code ne sont touchés. */
function depotNiveau() {
  const depot = dossier('double-relecture-');
  g(depot, 'init', '-q', '-b', 'develop');
  g(depot, 'config', 'user.email', 'jouet@example.invalid');
  g(depot, 'config', 'user.name', 'Jouet');
  const socle = commit(depot, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium' })]), 'anchorpost/manifest.json': '{}\n', 'README.md': 'jouet\n' }, 'chore: socle');
  g(depot, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
  g(depot, 'checkout', '-q', '-b', 'feat/criticite');
  const tete = commit(depot, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature' })]), 'anchorpost/manifest.json': '{"featureCriticality": []}\n' }, 'feat: criticité');
  return { depot, socle, tete, entree: `anchorpost/manifest.json\n${INDEX}\n` };
}

test("un environnement hostile ne pèse pas : des greffes, `GIT_GRAFT_FILE`, un `GIT_DIR` hérité vers un autre clone, `GIT_ICASE_PATHSPECS`, un arbre de travail lié ; sans dépôt propre : « illisible » (A-122)", () => {
  const { depot, socle, tete, entree } = depotNiveau();
  const script = copieDesOutils();
  const temporaire = dossier('temporaire-');
  const juger = (env = {}, cwd = depot) => lancer(script, ['--base', 'develop', '--tete', tete], { cwd, entree, env: { TMPDIR: temporaire, ...env } });
  const attendu = `RULE_ALL_FAC-16\tniveau\t${INDEX}\t${tete}\nexigée\n`;
  const temoin = juger();
  assert.deepEqual([temoin.code, temoin.sortie], [20, attendu], 'le témoin : la criticité montée par l\'index seul');
  // Des greffes : la cible aurait la tête pour parent, la base de fusion serait la tête, et la PR ne changerait rien.
  const greffe = `${socle} ${tete}\n`;
  mkdirSync(join(depot, '.git/info'), { recursive: true });
  writeFileSync(join(depot, '.git/info/grafts'), greffe);
  // La greffe fait un cycle (la tête descend déjà de la cible) : lue dans le dépôt réel, la base de fusion est la tête, ou
  // n'est pas calculable, selon l'ordre des dates ; jamais la cible.
  const trompe = spawnSync('git', ['merge-base', socle, tete], { cwd: depot, env: ENV_PROPRE, encoding: 'utf8' });
  assert.notEqual(trompe.stdout.trim(), socle, 'le montage trompe bien une lecture dans le dépôt réel');
  assert.equal(juger().sortie, attendu, '.git/info/grafts');
  rmSync(join(depot, '.git/info/grafts'));
  const greffes = join(dossier('greffes-'), 'greffes');
  writeFileSync(greffes, greffe);
  assert.equal(juger({ GIT_GRAFT_FILE: greffes }).sortie, attendu, 'GIT_GRAFT_FILE');
  // Un GIT_DIR hérité vers un autre clone, où la cible est déjà la tête : le dépôt jugé est celui du dossier courant.
  const autre = join(dossier('autre-'), 'clone');
  g(depot, 'clone', '-q', depot, autre);
  g(autre, 'update-ref', 'refs/remotes/origin/develop', tete);
  assert.equal(juger({ GIT_DIR: join(autre, '.git') }).sortie, attendu, 'GIT_DIR');
  assert.equal(juger({ GIT_ICASE_PATHSPECS: '1' }).sortie, attendu, 'GIT_ICASE_PATHSPECS');
  assert.equal(juger({ GIT_NOGLOB_PATHSPECS: '1', GIT_GLOB_PATHSPECS: '1', GIT_INDEX_FILE: '/dev/null', GIT_OBJECT_DIRECTORY: join(autre, '.git/objects/absent') }).sortie, attendu, "d'autres variables GIT_*");
  // Depuis un arbre de travail lié, celui du capitaine : ses objets sont ceux du dépôt commun.
  const lie = join(dossier('lie-'), 'arbre');
  g(depot, 'worktree', 'add', '-q', '--detach', lie, socle);
  assert.equal(juger({}, lie).sortie, attendu, 'un arbre de travail lié');
  assert.equal(juger({}, join(lie, 'anchorpost')).sortie, attendu, 'un sous-dossier de cet arbre');
  assert.deepEqual(readdirSync(temporaire), [], 'aucun dépôt propre ne reste');
  // Le dépôt propre ne se crée pas : illisible, jamais une lecture dans le dépôt réel.
  const sans = juger({ TMPDIR: join(temporaire, 'absent') });
  assert.deepEqual([sans.code, sans.sortie], [21, '# illisible : dépôt propre impossible à créer sous le dossier temporaire\nillisible\n']);
});

test("un dépôt superficiel : « illisible », la raison nomme la cause et le remède sur une ligne ; le calcul n'approfondit rien lui-même ; le même dépôt, approfondi par l'appelant, rend la vraie réponse (A-126)", () => {
  const { depot, tete, entree } = depotNiveau();
  const script = copieDesOutils();
  const temporaire = dossier('temporaire-');
  // Le clone d'une session cloud : un historique tronqué, où la tête de la PR n'a plus de parent.
  const superficiel = join(dossier('superficiel-'), 'clone');
  g(depot, 'clone', '-q', '--depth', '1', '--no-single-branch', '--branch', 'feat/criticite', `file://${depot}`, superficiel);
  assert.equal(g(superficiel, 'rev-parse', '--is-shallow-repository'), 'true', 'le montage est bien superficiel');
  const troncature = readFileSync(join(superficiel, '.git/shallow'), 'utf8');
  const juger = () => lancer(script, ['--base', 'develop', '--tete', tete], { cwd: superficiel, entree, env: { TMPDIR: temporaire } });
  const tronque = juger();
  assert.deepEqual([tronque.code, tronque.sortie], [21, "# illisible : dépôt superficiel : l'historique est tronqué, à approfondir avant d'appeler ce calcul (git fetch --unshallow origin)\nillisible\n"]);
  assert.match(tronque.sortie, /^# illisible : .*dépôt superficiel.*git fetch --unshallow origin.*\nillisible\n$/, 'la cause et le remède, sur une ligne');
  // Le calcul n'écrit pas dans le dépôt réel et ne lance aucun fetch : le dépôt est tronqué au même point, et rien ne reste.
  assert.equal(readFileSync(join(superficiel, '.git/shallow'), 'utf8'), troncature);
  assert.deepEqual(readdirSync(temporaire), [], 'aucun dépôt propre ne reste');
  // L'appelant approfondit, une fois : la vraie réponse, celle du dépôt complet.
  g(superficiel, 'fetch', '-q', '--unshallow', 'origin');
  assert.equal(g(superficiel, 'rev-parse', '--is-shallow-repository'), 'false');
  const complet = juger();
  assert.deepEqual([complet.code, complet.sortie], [20, `RULE_ALL_FAC-16\tniveau\t${INDEX}\t${tete}\nexigée\n`]);
});

test("un dépôt partiel (`--filter`) : « illisible », la raison nomme la cause et le remède sur une ligne ; le même dépôt cloné en entier rend la vraie réponse (troisième tour)", () => {
  const { depot, tete, entree } = depotNiveau();
  const script = copieDesOutils();
  const temporaire = dossier('temporaire-');
  g(depot, 'config', 'uploadpack.allowFilter', 'true');
  const clones = dossier('clones-');
  const juger = (cwd) => lancer(script, ['--base', 'develop', '--tete', tete], { cwd, entree, env: { TMPDIR: temporaire } });
  // Un clone sans ses fichiers : le dépôt propre, qui ne télécharge rien, n'y lirait ni l'index ni les règles.
  g(depot, 'clone', '-q', '--filter=blob:none', '--no-checkout', '--branch', 'feat/criticite', `file://${depot}`, join(clones, 'partiel'));
  assert.equal(g(join(clones, 'partiel'), 'config', 'remote.origin.promisor'), 'true', 'le montage est bien partiel');
  const partiel = juger(join(clones, 'partiel'));
  assert.deepEqual([partiel.code, partiel.sortie], [21, "# illisible : dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l'appeler (git clone sans --filter)\nillisible\n"]);
  assert.deepEqual(readdirSync(temporaire), [], 'aucun dépôt propre ne reste');
  // Le même dépôt, cloné en entier : la vraie réponse.
  g(depot, 'clone', '-q', '--no-checkout', '--branch', 'feat/criticite', `file://${depot}`, join(clones, 'entier'));
  const entier = juger(join(clones, 'entier'));
  assert.deepEqual([entier.code, entier.sortie], [20, `RULE_ALL_FAC-16\tniveau\t${INDEX}\t${tete}\nexigée\n`]);
});

test("le dépôt d'un autre propriétaire : « illisible » ; déclaré sûr par l'utilisateur (`safe.directory`), il est lu, et la déclaration d'un autre dépôt ne vaut pas pour lui (troisième tour)", () => {
  const { depot, tete, entree } = depotNiveau();
  const script = copieDesOutils();
  const temporaire = dossier('temporaire-');
  // Sans droits particuliers : un `git` de banc, en tête du PATH, fait tenir le dépôt jouet pour celui d'un autre
  // propriétaire (la variable de test de git), et lui seul : le dépôt propre du calcul reste le sien.
  const vrai = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8', env: ENV_PROPRE }).trim();
  const faux = dossier('git-');
  writeFileSync(join(faux, 'git'), `#!/bin/sh\ncase "$PWD/" in "${depot}/"*) GIT_TEST_ASSUME_DIFFERENT_OWNER=1; export GIT_TEST_ASSUME_DIFFERENT_OWNER ;; esac\nexec "${vrai}" "$@"\n`, { mode: 0o755 });
  const configuration = join(dossier('configuration-'), 'gitconfig');
  const juger = (declarations, cwd = depot, env = {}) => {
    // La configuration de l'utilisateur ment sur le reste : le calcul n'en reprend que la déclaration. (Aucun réglage
    // d'utilisateur ne change les lectures du dépôt réel au point de se voir ici : cela tient au code, pas à ce banc.)
    writeFileSync(configuration, `[core]\n\tbare = true\n\tworktree = /ailleurs\n[safe]\n${declarations.map((d) => `\tdirectory = ${d}\n`).join('')}`);
    return lancer(script, ['--base', 'develop', '--tete', tete], { cwd, entree, env: { TMPDIR: temporaire, PATH: `${faux}:${process.env.PATH}`, GIT_CONFIG_GLOBAL: configuration, ...env } });
  };
  const refuse = [21, '# illisible : pas dans un dépôt git\nillisible\n'];
  const lu = [20, `RULE_ALL_FAC-16\tniveau\t${INDEX}\t${tete}\nexigée\n`];
  const rendu = (r) => [r.code, r.sortie];
  assert.deepEqual(rendu(juger([])), refuse, "le témoin : git refuse le dépôt d'un autre propriétaire");
  assert.deepEqual(rendu(juger([depot])), lu, 'déclaré par son chemin');
  mkdirSync(join(depot, 'apps'), { recursive: true });
  assert.deepEqual(rendu(juger([depot], join(depot, 'apps'))), lu, "depuis un sous-dossier : c'est la racine qui est déclarée");
  assert.deepEqual(rendu(juger(['*'])), lu, 'déclaré par `*`');
  assert.deepEqual(rendu(juger([`${dirname(depot)}/*`])), lu, 'déclaré par le dossier qui le contient');
  assert.deepEqual(rendu(juger([`${depot}-autre`, '/ailleurs/*'])), refuse, "la déclaration d'un autre dépôt ne vaut pas pour celui-ci");
  assert.deepEqual(rendu(juger([depot, ''])), refuse, 'une valeur vide efface les déclarations qui la précèdent, comme pour git');
  // La configuration de système (`A-130`) : le calcul lit les déclarations que git lirait lui-même, pas davantage.
  // Avec GIT_CONFIG_NOSYSTEM vrai au sens de git, git ignore le fichier de système : le calcul ne le lit pas non plus.
  const systeme = join(dirname(configuration), 'systeme');
  writeFileSync(systeme, '[safe]\n\tdirectory = *\n');
  const avec = (nosystem) => rendu(juger([], depot, { GIT_CONFIG_SYSTEM: systeme, GIT_CONFIG_NOSYSTEM: nosystem }));
  assert.deepEqual(avec(undefined), lu, 'déclaré par le système, sans GIT_CONFIG_NOSYSTEM : lu');
  for (const v of ['0', 'false', 'no', 'off', 'OFF', '']) assert.deepEqual(avec(v), lu, `GIT_CONFIG_NOSYSTEM=${JSON.stringify(v)} est faux pour git : le système est lu`);
  for (const v of ['1', 'true', 'yes', 'on', 'TRUE', '2']) assert.deepEqual(avec(v), refuse, `GIT_CONFIG_NOSYSTEM=${v} : git ignore le système, le calcul aussi`);
  assert.deepEqual(avec('bidon'), refuse, 'une valeur que git refuse (il échoue alors à toute commande) : le système n\'est pas lu');
  assert.deepEqual(rendu(juger([depot], depot, { GIT_CONFIG_SYSTEM: systeme, GIT_CONFIG_NOSYSTEM: '1' })), lu, "le système ignoré, la déclaration de l'utilisateur vaut toujours");
  assert.deepEqual(readdirSync(temporaire), [], 'aucun dépôt propre ne reste');
});

test("le point d'entrée est reconnu par un lien symbolique, depuis un dossier à espace et à accent", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils('outils é -');
  const lien = join(dirname(script), 'lien-double-relecture.mjs');
  symlinkSync(script, lien);
  for (const [nom, chemin, options] of [['direct', script, []], ['lien', lien, []], ['lien, --preserve-symlinks-main', lien, ['--preserve-symlinks-main']]]) {
    const r = lancer(chemin, ['--base', 'develop', '--tete', tete], { cwd: depot, entree: `${CODE}\n`, options });
    assert.deepEqual([r.code, r.verdict], [20, 'exigée'], nom);
  }
});
