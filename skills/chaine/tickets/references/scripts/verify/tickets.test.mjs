import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cheminsChauds,
  controlerCarte,
  controlerTicket,
  migrationsReservees,
  reservationsEnDouble,
  ecartsFormatPret,
  estArchive,
  identifiant,
  identifiantsEnDouble,
  lireCheminsSensibles,
  motifSensibleTouche,
  statusValide,
  ticketsCites,
  ecartsFiches,
  etatDuTest,
  reglesCitees,
  testsNommes,
  typeValide,
} from './tickets-regles.mjs';

const NOM = 'SPEC_ALL_SOC-1-socle.06.issue.md';
const EXISTANTS = new Set(['SPEC_ALL_SOC-1.05', 'SPEC_ALL_SOC-1.06', 'SPEC_FNSMR_STR-6.01']);
const existe = (id) => EXISTANTS.has(id);
const PRET = `# SPEC_ALL_SOC-1.06 — Tableau\n\nStatus: ready-for-agent\nType: task\nBlocked by: 05\nModèle: sonnet\nFichiers chauds: —\n\n## Le besoin\n\nDu texte.\n\n## Où\n\n- \`scripts/docs/avancement.mjs\`\n\n## Décisions\n\n- Pourcentage = tickets faits.\n\n## Surfaces\n\n| surface | preuve |\n\n## Vérification\n\n\`node --test\`\n`;

test("l'identifiant se lit dans le nom du fichier", () => {
  assert.equal(identifiant(NOM), 'SPEC_ALL_SOC-1.06');
  assert.equal(identifiant('SPEC_FFSB_STR-1-secteurs-drome.01.issue.md'), 'SPEC_FFSB_STR-1.01');
  assert.equal(identifiant('notes.md'), null);
  assert.ok(estArchive('docs/x/all/issues/archive/SPEC_ALL_SOC-1-socle.01.issue.md'));
});

test('vocabulaire fermé de Status', () => {
  for (const v of ['ready-for-agent', 'needs-info — question n° 2', 'wontfix — renvoyé', 'en cours — chore/spec-all-soc-1-05-gate', 'Fait — PR #683', 'Fait — PR #552 (sous-PR de sujet/x)']) assert.equal(statusValide(v), true, v);
  for (const v of ['À faire', 'done — PR #466', 'resolved', 'Fait — lot B2b', 'ready-for-agent!', 'en cours', '']) assert.equal(statusValide(v), false, v);
});

test('Blocked by : identifiants complets partout, numéros courts en tête seulement', () => {
  assert.deepEqual(ticketsCites('05', 'SPEC_ALL_SOC-1.06'), ['SPEC_ALL_SOC-1.05']);
  assert.deepEqual(ticketsCites('01, .03 (raison)', 'SPEC_ALL_SOC-1.06'), ['SPEC_ALL_SOC-1.01', 'SPEC_ALL_SOC-1.03']);
  assert.deepEqual(ticketsCites('SPEC_FNSMR_STR-6.01 puis 10 adhérents', 'SPEC_ALL_SOC-1.06'), ['SPEC_FNSMR_STR-6.01']);
});

test('un ticket prêt conforme passe ; sans section ou sans modèle, il est refusé', () => {
  assert.deepEqual(controlerTicket({ nom: NOM, texte: PRET, existe }).erreurs, []);
  assert.deepEqual(ecartsFormatPret(PRET.replace('Modèle: sonnet\n', '').replace('## Surfaces\n\n| surface | preuve |\n', '')), ['ligne `Modèle: sonnet|opus` (avec la raison pour opus) absente', 'section `## Surfaces` absente']);
  const r = controlerTicket({ nom: NOM, texte: '# x\n\nStatus: À faire\nType: task\nBlocked by: 09\nSujet: Socle\n', existe });
  assert.deepEqual(r.erreurs.map((e) => e.message.split(' ')[0]), ['Status', 'Blocked', 'Sujet']);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: '# x\n\nStatus: ready-for-agent\nType: task\n', existe, gele: true }).erreurs, []);
});

test('identifiants en double : deux specs, ou un ticket au nom d’une autre spec', () => {
  assert.deepEqual(identifiantsEnDouble(['docs/a/all/SPEC_ALL_SOC-1-socle.spec.md', 'docs/a/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md', 'docs/b/all/SPEC_ALL_SOC-1-autre.spec.md']), [{ id: 'SPEC_ALL_SOC-1', fichiers: ['docs/a/all/SPEC_ALL_SOC-1-socle.spec.md', 'docs/a/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md', 'docs/b/all/SPEC_ALL_SOC-1-autre.spec.md'] }]);
  assert.deepEqual(identifiantsEnDouble(['docs/a/all/SPEC_ALL_SOC-1-socle.spec.md', 'docs/a/all/SPEC_ALL_SOC-1-socle.map.md', 'docs/a/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md']), []);
});

test('carte de chantier : fiche, phase, architecte, coût dès la vague 1, rétro à fini', () => {
  const carte = (phase, extra = '') => controlerCarte({ nom: 'SPEC_ALL_SOC-1-socle.map.md', texte: `# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: ${phase}\nArchitecte: session_x\n${extra}` });
  assert.deepEqual(carte('1-grilling').erreurs, []);
  assert.match(carte('4-vague-1').erreurs[0].message, /Coût/);
  assert.deepEqual(carte('4-vague-2', '\n## Coût\n\n| a |\n').erreurs, []);
  assert.match(carte('fini', '\n## Coût\n\n| a |\n').erreurs[0].message, /Rétro/);
  assert.match(carte('7-x').erreurs[0].message, /hors vocabulaire/);
  assert.equal(controlerCarte({ nom: 'x.map.md', texte: '# sans sujet\n' }).carte, false);
});

test('les fiches du skill passent ; une fiche réécrite par setup-matt-pocock-skills, ou absente, est nommée avec son remède', () => {
  const tracker = '# Suivi\n\n## Conventions\n\n## Réserver un ticket (sessions parallèles)\n\n## Un ticket prêt pour agent\n\n## Archivage\n';
  const triage = '| `en cours — <branche>` | … |\n| `Fait — PR #<n>` | … |\n';
  assert.deepEqual(ecartsFiches({ issueTracker: tracker, triageLabels: triage }), []);
  const ancien = '# Issue tracker\n\n## Conventions\n\n## Quand une skill dit « publish to the issue tracker »\n';
  const e = ecartsFiches({ issueTracker: ancien, triageLabels: '| needs-triage |\n' });
  assert.equal(e.length, 5);
  assert.match(e[0], /issue-tracker\.md : section « Réserver un ticket » absente — rejouer `\/maj-skills:tickets poser`/);
  assert.match(e[3], /triage-labels\.md : valeur « en cours — <branche> » absente/);
  assert.deepEqual(ecartsFiches({ issueTracker: null, triageLabels: null }).length, 2);
});

const SENSIBLES = ['apps/api/src/**/auth/**', 'apps/api/src/db/migrations/**', 'packages/contracts/src/auth*.ts'];
const sur = (chauds, label = '') =>
  PRET.replace('Fichiers chauds: —', `Fichiers chauds: ${chauds}`).replace('Modèle: sonnet\n', `Modèle: sonnet\n${label}`);

test("un ticket prêt sur un chemin sensible sans `Label: architecte` est refusé ; avec, accepté ; hors chemin sensible, rien n'est exigé", () => {
  const refus = ecartsFormatPret(sur('`apps/api/src/infrastructure/auth/jwt.ts`'), SENSIBLES);
  assert.equal(refus.length, 1);
  assert.match(refus[0], /Label: architecte.*absente.*apps\/api\/src\/\*\*\/auth\/\*\*/);
  assert.deepEqual(ecartsFormatPret(sur('`apps/api/src/infrastructure/auth/jwt.ts`', 'Label: architecte\n'), SENSIBLES), []);
  assert.deepEqual(ecartsFormatPret(sur('`scripts/docs/avancement.mjs`'), SENSIBLES), []);
  assert.deepEqual(ecartsFormatPret(sur('—'), SENSIBLES), []);
  const r = controlerTicket({ nom: NOM, texte: sur('`packages/contracts/src/auth.ts`'), existe, cheminsSensibles: SENSIBLES });
  assert.match(r.erreurs[0].message, /ready-for-agent : ligne `Label: architecte` absente/);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: sur('`packages/contracts/src/auth.ts`'), existe, gele: true, cheminsSensibles: SENSIBLES }).erreurs, []);
});

test('les chemins chauds se lisent entre accents graves ou en liste, et un motif `**/` accepte zéro dossier', () => {
  assert.deepEqual(cheminsChauds('`a/b.ts`, `c/*` — raison'), ['a/b.ts', 'c/*']);
  assert.deepEqual(cheminsChauds('a/b.ts, c/d.ts'), ['a/b.ts', 'c/d.ts']);
  assert.deepEqual(cheminsChauds('—'), []);
  assert.equal(motifSensibleTouche('apps/api/src/auth/x.ts', SENSIBLES), SENSIBLES[0]);
  assert.equal(motifSensibleTouche('apps/api/src/db/migrations/*', SENSIBLES), SENSIBLES[1]);
  assert.equal(motifSensibleTouche('apps/api/src/application/users/u.ts', SENSIBLES), null);
  const dossier = ['apps/api/src/infrastructure/**/auth/'];
  assert.equal(motifSensibleTouche('apps/api/src/infrastructure/auth/jwt.ts', dossier), dossier[0], 'un motif à barre finale désigne le dossier entier');
  assert.equal(motifSensibleTouche('apps/api/src/infrastructure/http/auth/guard.ts', dossier), dossier[0]);
  assert.equal(motifSensibleTouche('apps/api/src/infrastructure/authz/x.ts', dossier), null);
});

test('cheminsSensibles : contrat absent → aucun motif ; présent mais illisible ou mal formé → le gate échoue fermé', () => {
  assert.deepEqual(lireCheminsSensibles(null), []);
  assert.deepEqual(lireCheminsSensibles('{}'), []);
  assert.deepEqual(lireCheminsSensibles('{"cheminsSensibles":["a/**"]}'), ['a/**']);
  assert.throws(() => lireCheminsSensibles('{ pas du json'), /chaine\.json illisible/);
  assert.throws(() => lireCheminsSensibles('{"cheminsSensibles":"a/**"}'), /liste de motifs/);
});

const carteAvec = (migrations, phase = '4-vague-1') =>
  `# X — Carte\n\nSujet: sujet/x\n\n## Fiche\n\nPhase: ${phase}\nArchitecte: s\n${migrations === undefined ? '' : `Migrations: ${migrations}\n`}\n## Coût\n`;

test('Migrations: se lit en liste d’horodatages ; « — » et l’absence de ligne ne réservent rien', () => {
  assert.deepEqual(migrationsReservees(carteAvec('202611271000, 202611271100')), ['202611271000', '202611271100']);
  assert.deepEqual(migrationsReservees(carteAvec('—')), []);
  assert.deepEqual(migrationsReservees(carteAvec(undefined)), []);
});

test('Migrations: de forme fausse est une erreur de la carte', () => {
  const r = controlerCarte({ nom: 'x.map.md', texte: carteAvec('2026-11-27') });
  assert.match(r.erreurs[0].message, /Migrations.*12 chiffres/);
  assert.equal(controlerCarte({ nom: 'x.map.md', texte: carteAvec('202611271000') }).erreurs.length, 0);
});

test('deux cartes ouvertes qui réservent le même horodatage : écart ; une carte finie ne réserve plus', () => {
  const cartes = [
    { chemin: 'a.map.md', texte: carteAvec('202611271000') },
    { chemin: 'b.map.md', texte: carteAvec('202611281000, 202611271000') },
    { chemin: 'c.map.md', texte: carteAvec('202611281000', 'fini') },
  ];
  const e = reservationsEnDouble(cartes);
  assert.equal(e.length, 1);
  assert.match(e[0], /202611271000.*a\.map\.md.*b\.map\.md/);
});

const ticket = (entetes, corps = '') => `# x\n\n${entetes}\n${corps}`;
const messages = (r) => r.erreurs.map((e) => e.message);

test('Type: absent, hors vocabulaire ou vide est refusé ; gelé dans la dette, l’absence seule est tolérée', () => {
  for (const v of ['task', 'défaut', 'grilling', 'research', 'task # task | défaut | grilling | research']) assert.equal(typeValide(v), true, v);
  for (const v of ['bug', 'defaut', 'Task', 'task, défaut', '']) assert.equal(typeValide(v), false, v);
  assert.match(messages(controlerTicket({ nom: NOM, texte: ticket('Status: needs-triage'), existe }))[0], /ligne `Type:` absente \(attendu : task, défaut, grilling, research\)/);
  const hors = controlerTicket({ nom: NOM, texte: ticket('Status: needs-triage\nType: bug'), existe });
  assert.deepEqual(hors.erreurs, [{ ligne: 4, message: 'Type « bug » hors vocabulaire (attendu : task, défaut, grilling, research)' }]);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: ticket('Status: needs-triage'), existe, typeGele: true }).erreurs, []);
  assert.equal(controlerTicket({ nom: NOM, texte: ticket('Status: needs-triage\nType: bug'), existe, typeGele: true }).erreurs.length, 1, 'la dette ne couvre que l’absence');
  assert.equal(controlerTicket({ nom: NOM, texte: ticket('Status: needs-triage', '## Décisions\n\nType: task\n'), existe }).erreurs.length, 1, 'le corps n’est pas un en-tête');
});

const REGISTRE = new Set(['RULE_ALL_LIC-3', 'RULE_FNSMR_LIC-05']);
const regleExiste = (id) => REGISTRE.has(id);
const NOM_FNSMR = 'SPEC_FNSMR_STR-6-secteurs.02.issue.md';
const avecRegles = (ligne, nom = NOM_FNSMR) => messages(controlerTicket({ nom, texte: ticket(`Status: needs-triage\nType: task\n${ligne}`), existe, regleExiste }));

test('Règles: virgules ou espaces, accents graves ou non ; seuls des identifiants de règle complets', () => {
  assert.deepEqual(reglesCitees('RULE_ALL_LIC-3, RULE_FNSMR_LIC-05'), { cites: ['RULE_ALL_LIC-3', 'RULE_FNSMR_LIC-05'], malformes: [] });
  assert.deepEqual(reglesCitees('`RULE_ALL_LIC-3` `RULE_FNSMR_LIC-05`,RULE_ALL_LIC-3'), { cites: ['RULE_ALL_LIC-3', 'RULE_FNSMR_LIC-05'], malformes: [] });
  assert.deepEqual(reglesCitees('LIC-3, SPEC_ALL_SOC-1 voir rule_all_lic-3').malformes, ['LIC-3', 'SPEC_ALL_SOC-1', 'voir', 'rule_all_lic-3']);
});

test('Règles: existante passe ; absente, d’un autre contexte, mal formée ou vide est refusée', () => {
  assert.deepEqual(avecRegles('Règles: RULE_ALL_LIC-3, `RULE_FNSMR_LIC-05`'), []);
  assert.deepEqual(avecRegles('Règles : RULE_ALL_LIC-3'), [], 'la typographie française « Règles : » est un en-tête');
  assert.deepEqual(avecRegles('Règles: RULE_FNSMR_LIC-7'), ["Règles cite RULE_FNSMR_LIC-7, absente du registre (docs/metier/regles/fnsmr/RULE_FNSMR_LIC-7.md)"]);
  assert.deepEqual(avecRegles('Règles: RULE_FNSMR_LIC-5'), ["Règles cite RULE_FNSMR_LIC-5, absente du registre (docs/metier/regles/fnsmr/RULE_FNSMR_LIC-5.md)"], 'un identifiant s’écrit avec ses zéros');
  assert.deepEqual(avecRegles('Règles: RULE_FNSMR_LIC-05', NOM), ['Règles cite RULE_FNSMR_LIC-05, du contexte FNSMR : un ticket du contexte ALL ne cite que des règles de ALL']);
  assert.match(avecRegles('Règles: RULE_FFSA_LIC-1')[0], /du contexte FFSA : un ticket du contexte FNSMR ne cite que des règles de FNSMR ou de ALL/);
  assert.match(avecRegles('Règles: LIC-3')[0], /Règles cite « LIC-3 », qui n'est pas un identifiant de règle complet/);
  assert.match(avecRegles('Règles: RULE_ALL_LIC-3, voir la section 3')[0], /« voir »/);
  assert.deepEqual(avecRegles('Règles:'), ['ligne `Règles:` vide : citer au moins une règle, ou retirer la ligne']);
  assert.deepEqual(avecRegles(''), [], 'sans ligne `Règles:`, rien à vérifier');
  assert.match(avecRegles('Règles: RULE_FNSMR_LIC-05', 'notes.issue.md')[0], /pas d'identifiant lisible, seules les règles de ALL/);
  assert.deepEqual(avecRegles('Règles: RULE_ALL_LIC-3', 'notes.issue.md'), []);
});

const SPEC_TS = [
  "import { describe, it } from 'vitest';",
  '',
  "describe('licences', () => {",
  "  it('[RULE_ALL_LIC-3] refuse une licence expirée', () => {",
  '    expect(1).toBe(1);',
  '  });',
  '  // skip: SPEC_ALL_SOC-1.04 — rouge de recette',
  "  it.skip('recette.licence accepte un mineur', () => {});",
  "  describe.skip('en attente', () => {",
  "    it('accepte un renouvellement', () => {});",
  '  });',
  "  it('après un bloc désactivé', () => {});",
  "  xit('ancienne forme', () => {});",
  "  it.todo('à écrire');",
  "  it.each([[1], [2]])('table %s', (n) => {});",
  "  // it('commenté', () => {});",
  '});',
  "test('node:test désactivé', { skip: 'ticket' }, () => {});",
  'test("guillemets doubles", () => {});',
].join('\n');

test('état d’un test : actif, désactivé sur la ligne ou par un bloc englobant, absent', () => {
  for (const t of ['[RULE_ALL_LIC-3] refuse une licence expirée', 'après un bloc désactivé', 'table %s', 'guillemets doubles']) assert.equal(etatDuTest(SPEC_TS, t), 'actif', t);
  for (const t of ['recette.licence accepte un mineur', 'accepte un renouvellement', 'ancienne forme', 'à écrire', 'node:test désactivé']) assert.equal(etatDuTest(SPEC_TS, t), 'désactivé', t);
  for (const t of ['commenté', 'refuse une licence', 'licence (expirée)', 'inexistant']) assert.equal(etatDuTest(SPEC_TS, t), 'absent', t);
});

const DEFAUT = (status, preuve) =>
  `# x\n\nStatus: ${status}\nType: défaut\nRègles: RULE_ALL_LIC-3\n\n## Surfaces\n\n| Surface | Preuve |\n| ------- | ------ |\n| licence | ${preuve} |\n`;
const ETATS = { 'refuse une licence expirée': 'actif', 'accepte un mineur': 'désactivé' };
const testExiste = (fichier, titre) => (fichier.endsWith('licence.spec.ts') ? (ETATS[titre] ?? 'absent') : 'absent');
const defaut = (status, preuve) => messages(controlerTicket({ nom: NOM, texte: DEFAUT(status, preuve), existe, regleExiste, testExiste }));

test('Surfaces : la colonne Preuve nomme un fichier de test entre accents graves puis ses titres', () => {
  const lignes = DEFAUT('Fait — PR #9', '`apps/api/src/licence.spec.ts` « a », "b", couvre `src/licence.ts` ; `e2e/x.e2e-spec.ts` « d » \\| e').split('\n');
  assert.deepEqual(testsNommes(lignes).tests, [
    { fichier: 'apps/api/src/licence.spec.ts', titre: 'a' },
    { fichier: 'apps/api/src/licence.spec.ts', titre: 'b' },
    { fichier: 'e2e/x.e2e-spec.ts', titre: 'd' },
  ]);
  assert.deepEqual(testsNommes(DEFAUT('Fait — PR #9', '`x.spec.md` « une spec de doc »').split('\n')).tests, []);
});

test('défaut Fait : test actif passe ; test it.skip, introuvable ou non nommé est refusé ; avant Fait, rien n’est exigé', () => {
  assert.deepEqual(defaut('Fait — PR #9', '`licence.spec.ts` « refuse une licence expirée »'), []);
  assert.deepEqual(defaut('Fait — PR #9', '`licence.spec.ts` « accepte un mineur »'), [
    'défaut Fait : le test « accepte un mineur » de `licence.spec.ts` est désactivé (skip, todo, x) : il ne prouve pas la correction',
  ]);
  assert.deepEqual(defaut('Fait — PR #9', '`licence.spec.ts` « inventé »'), ['défaut Fait : le test « inventé » est introuvable dans `licence.spec.ts`']);
  assert.match(defaut('Fait — PR #9', 'vérifié à la main')[0], /défaut Fait : aucun test nommé dans la colonne « Preuve »/);
  assert.match(defaut('Fait — PR #9', '`licence.spec.ts` seul')[0], /nomme `licence.spec.ts` sans titre de test/);
  assert.deepEqual(defaut('en cours — fix/spec-all-soc-1-06-x', '`licence.spec.ts` « accepte un mineur »'), []);
  const tache = DEFAUT('Fait — PR #9', '`licence.spec.ts` « inventé »').replace('Type: défaut', 'Type: task');
  assert.deepEqual(controlerTicket({ nom: NOM, texte: tache, existe, regleExiste, testExiste }).erreurs, []);
});
