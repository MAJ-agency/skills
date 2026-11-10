import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cheminsChauds,
  controlerCarte,
  controlerTicket,
  ecartsFormatPret,
  estArchive,
  identifiant,
  identifiantsEnDouble,
  lireCheminsSensibles,
  motifSensibleTouche,
  statusValide,
  ticketsCites,
  ecartsFiches,
} from './tickets-regles.mjs';

const NOM = 'SOC-1-socle.06.issue.md';
const EXISTANTS = new Set(['SOC-1.05', 'SOC-1.06', 'ALL-STR-6.01']);
const existe = (id) => EXISTANTS.has(id);
const PRET = `# SOC-1.06 — Tableau\n\nStatus: ready-for-agent\nBlocked by: 05\nModèle: sonnet\nFichiers chauds: —\n\n## Le besoin\n\nDu texte.\n\n## Où\n\n- \`scripts/docs/avancement.mjs\`\n\n## Décisions\n\n- Pourcentage = tickets faits.\n\n## Surfaces\n\n| surface | preuve |\n\n## Vérification\n\n\`node --test\`\n`;

test("l'identifiant se lit dans le nom du fichier", () => {
  assert.equal(identifiant(NOM), 'SOC-1.06');
  assert.equal(identifiant('FFSB-STR-1-secteurs-drome.01.issue.md'), 'FFSB-STR-1.01');
  assert.equal(identifiant('notes.md'), null);
  assert.ok(estArchive('docs/x/issues/archive/SOC-1-socle.01.issue.md'));
});

test('vocabulaire fermé de Status', () => {
  for (const v of ['ready-for-agent', 'needs-info — question n° 2', 'wontfix — renvoyé', 'en cours — chore/soc-1-05-gate', 'Fait — PR #683', 'Fait — PR #552 (sous-PR de sujet/x)']) assert.equal(statusValide(v), true, v);
  for (const v of ['À faire', 'done — PR #466', 'resolved', 'Fait — lot B2b', 'ready-for-agent!', 'en cours', '']) assert.equal(statusValide(v), false, v);
});

test('Blocked by : identifiants complets partout, numéros courts en tête seulement', () => {
  assert.deepEqual(ticketsCites('05', 'SOC-1.06'), ['SOC-1.05']);
  assert.deepEqual(ticketsCites('01, .03 (raison)', 'SOC-1.06'), ['SOC-1.01', 'SOC-1.03']);
  assert.deepEqual(ticketsCites('ALL-STR-6.01 puis 10 adhérents', 'SOC-1.06'), ['ALL-STR-6.01']);
});

test('un ticket prêt conforme passe ; sans section ou sans modèle, il est refusé', () => {
  assert.deepEqual(controlerTicket({ nom: NOM, texte: PRET, existe }).erreurs, []);
  assert.deepEqual(ecartsFormatPret(PRET.replace('Modèle: sonnet\n', '').replace('## Surfaces\n\n| surface | preuve |\n', '')), ['ligne `Modèle: sonnet|opus` (avec la raison pour opus) absente', 'section `## Surfaces` absente']);
  const r = controlerTicket({ nom: NOM, texte: '# x\n\nStatus: À faire\nBlocked by: 09\nSujet: Socle\n', existe });
  assert.deepEqual(r.erreurs.map((e) => e.message.split(' ')[0]), ['Status', 'Blocked', 'Sujet']);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: '# x\n\nStatus: ready-for-agent\n', existe, gele: true }).erreurs, []);
});

test('identifiants en double : deux specs, ou un ticket au nom d’une autre spec', () => {
  assert.deepEqual(identifiantsEnDouble(['docs/a/SOC-1-socle.spec.md', 'docs/a/issues/SOC-1-socle.01.issue.md', 'docs/b/SOC-1-autre.spec.md']), [{ id: 'SOC-1', fichiers: ['docs/a/SOC-1-socle.spec.md', 'docs/a/issues/SOC-1-socle.01.issue.md', 'docs/b/SOC-1-autre.spec.md'] }]);
  assert.deepEqual(identifiantsEnDouble(['docs/a/SOC-1-socle.spec.md', 'docs/a/SOC-1-socle.map.md', 'docs/a/issues/SOC-1-socle.01.issue.md']), []);
});

test('carte de chantier : fiche, phase, architecte, coût dès la vague 1, rétro à fini', () => {
  const carte = (phase, extra = '') => controlerCarte({ nom: 'SOC-1-socle.map.md', texte: `# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: ${phase}\nArchitecte: session_x\n${extra}` });
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
