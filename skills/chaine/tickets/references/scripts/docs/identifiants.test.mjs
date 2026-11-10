import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TYPES,
  branchePorte,
  dossierDuContexte,
  estArchive,
  estSpec,
  fichierDuTicket,
  fichiersDeLaSpec,
  identifiantDeBranche,
  identifiantDeLaDemande,
  identifiantDeLaRegle,
  identifiantDeLaSpec,
  identifiantDuFichier,
  identifiantDuTicket,
  identifiantsCites,
  lireIdentifiant,
  lireTicket,
  slug,
  specDuTicket,
  texteCite,
  ticketDeLaPr,
  ticketsCites,
} from './identifiants.mjs';

test('chacun des six types se lit : type, contexte, trigramme, numéro', () => {
  assert.deepEqual(TYPES, ['RULE', 'SPEC', 'ADR', 'DSG', 'DOC', 'REQ']);
  assert.deepEqual(lireIdentifiant('RULE_ALL_LIC-3'), { type: 'RULE', contexte: 'ALL', trigramme: 'LIC', n: 3 });
  assert.deepEqual(lireIdentifiant('SPEC_FNSMR_PAY-3'), { type: 'SPEC', contexte: 'FNSMR', trigramme: 'PAY', n: 3 });
  assert.deepEqual(lireIdentifiant('ADR_ALL_ARC-11'), { type: 'ADR', contexte: 'ALL', trigramme: 'ARC', n: 11 });
  assert.deepEqual(lireIdentifiant('DSG_ALL_DES-1'), { type: 'DSG', contexte: 'ALL', trigramme: 'DES', n: 1 });
  assert.deepEqual(lireIdentifiant('DOC_ALL_API-2'), { type: 'DOC', contexte: 'ALL', trigramme: 'API', n: 2 });
  assert.deepEqual(lireIdentifiant('REQ_ALL_LIC-7'), { type: 'REQ', contexte: 'ALL', trigramme: 'LIC', n: 7 });
  assert.deepEqual(lireIdentifiant('rule_u13_li-3'), { type: 'RULE', contexte: 'U13', trigramme: 'LI', n: 3 }, 'casse, contexte à chiffres, trigramme de deux lettres');
});

test('un ticket est sa spec suivie de .NN ; seule une spec porte un index', () => {
  assert.deepEqual(lireIdentifiant('SPEC_ALL_SOC-1.03'), { type: 'SPEC', contexte: 'ALL', trigramme: 'SOC', n: 1, index: '03' });
  assert.deepEqual(lireTicket('SPEC_ALL_SOC-1.03'), { spec: 'SPEC_ALL_SOC-1', index: '03' });
  assert.deepEqual(lireTicket('spec_fnsmr_pay-3.02'), { spec: 'SPEC_FNSMR_PAY-3', index: '02' });
  assert.equal(lireTicket('SPEC_ALL_SOC-1'), null);
  assert.equal(lireTicket('SPEC_ALL_SOC-1.3'), null);
  assert.equal(lireIdentifiant('RULE_ALL_LIC-3.02'), null);
  assert.equal(lireIdentifiant('ADR_ALL_ARC-1.01'), null);
  assert.equal(estSpec('SPEC_ALL_SOC-12'), true);
  assert.equal(estSpec('SPEC_ALL_SOC-1.03'), false);
  assert.equal(estSpec('RULE_ALL_SOC-12'), false);
  assert.equal(estSpec('socle'), false);
});

test('une règle existante garde ses zéros, et 05 se compte comme 5', () => {
  assert.deepEqual(lireIdentifiant('RULE_FNSMR_LIC-05'), { type: 'RULE', contexte: 'FNSMR', trigramme: 'LIC', n: 5 });
  assert.equal(identifiantDeLaRegle('RULE_FNSMR_LIC-05.md'), 'RULE_FNSMR_LIC-05');
  assert.equal(identifiantDuFichier('RULE_FNSMR_LIC-05.md'), 'RULE_FNSMR_LIC-05');
});

test("les refus : l'ancienne forme, un type absent, un contexte absent, un type inconnu", () => {
  for (const id of ['LIC-3', 'SOC-1', 'SOC-1.03', 'ALL-FOF-11.04', 'SPEC_SOC-1', 'ALL_SOC-1', 'SPEC_ALL_SOC', 'SPEC_ALL_SOC-', 'SPEC_ALL_S-1', 'SPEC_ALL_SOCLE-1', 'SPEC_all_SOC-1 x', 'EPIC_ALL_SOC-1', 'SPEC-ALL-SOC-1', 'SPEC_ALL_SOC_1', '', null, undefined])
    assert.equal(lireIdentifiant(id), null, String(id));
});

test("l'identifiant se lit dans le nom du fichier, selon son type", () => {
  assert.equal(identifiantDuTicket('SPEC_ALL_SOC-1-socle.03.issue.md'), 'SPEC_ALL_SOC-1.03');
  assert.equal(identifiantDuTicket('SPEC_FFSA_INF-10-chaine-de-production.06.issue.md'), 'SPEC_FFSA_INF-10.06');
  assert.equal(identifiantDuTicket('SOC-1-socle.03.issue.md'), null);
  assert.equal(identifiantDuTicket('4-couche-base-de-donnees.issue.md'), null);
  assert.equal(identifiantDuTicket('RULE_ALL_SOC-1-socle.03.issue.md'), null);
  assert.equal(identifiantDeLaSpec('SPEC_ALL_SOC-1-socle.spec.md'), 'SPEC_ALL_SOC-1');
  assert.equal(identifiantDeLaSpec('SOC-1-socle.spec.md'), null);
  assert.equal(identifiantDeLaSpec('SPEC_ALL_SOC-1-socle.map.md'), null);
  assert.equal(specDuTicket('SPEC_ALL_SOC-1-socle.03.issue.md'), 'SPEC_ALL_SOC-1');
  assert.equal(identifiantDeLaRegle('RULE_ALL_LIC-3.md'), 'RULE_ALL_LIC-3');
  assert.equal(identifiantDeLaRegle('RULE_ALL_LIC-3-licence.md'), null, 'une règle n’a pas de slug');
  assert.equal(identifiantDeLaRegle('SPEC_ALL_LIC-3.md'), null);
  assert.equal(identifiantDeLaRegle('LIC-3.md'), null);
  assert.equal(identifiantDeLaDemande('REQ_ALL_LIC-7-licence-famille.md'), 'REQ_ALL_LIC-7');
  assert.equal(identifiantDeLaDemande('REQ_ALL_LIC-7.md'), null);
  assert.equal(identifiantDeLaDemande('RULE_ALL_LIC-7-x.md'), null);
});

test("l'identifiant en tête d'un fichier, tous types : c'est ce que lit next-id", () => {
  assert.equal(identifiantDuFichier('ADR_ALL_ARC-1-identifiants-types-et-contextes.md'), 'ADR_ALL_ARC-1');
  assert.equal(identifiantDuFichier('RULE_ALL_LIC-3.md'), 'RULE_ALL_LIC-3');
  assert.equal(identifiantDuFichier('RULE_ALL_LIC-30.md'), 'RULE_ALL_LIC-30');
  assert.equal(identifiantDuFichier('SPEC_ALL_LIC-12-licences.spec.md'), 'SPEC_ALL_LIC-12');
  assert.equal(identifiantDuFichier('SPEC_ALL_LIC-12-licences.map.md'), 'SPEC_ALL_LIC-12');
  assert.equal(identifiantDuFichier('SPEC_ALL_LIC-12-licences.03.issue.md'), 'SPEC_ALL_LIC-12');
  assert.equal(identifiantDuFichier('DSG_ALL_DES-1-charte.md'), 'DSG_ALL_DES-1');
  assert.equal(identifiantDuFichier('ARC-1-nomenclature.md'), null);
  assert.equal(identifiantDuFichier('RULE_ALL_LIC-3x.md'), null);
  assert.equal(identifiantDuFichier('notes.md'), null);
});

test('le slug de branche et son inverse ; le dossier du contexte en minuscules', () => {
  assert.equal(slug('SPEC_ALL_SOC-1.03'), 'spec-all-soc-1-03');
  assert.equal(slug('SPEC_FNSMR_PAY-3'), 'spec-fnsmr-pay-3');
  assert.equal(identifiantDeBranche('feat/spec-all-soc-1-03-couche-base'), 'SPEC_ALL_SOC-1.03');
  assert.equal(identifiantDeBranche('fix/spec-fnsmr-pay-12-03'), 'SPEC_FNSMR_PAY-12.03');
  assert.equal(identifiantDeBranche('spec-all-soc-1-03-x'), 'SPEC_ALL_SOC-1.03');
  assert.equal(identifiantDeBranche('feat/soc-1-03-couche'), null, "l'ancienne forme n'est plus lue");
  assert.equal(identifiantDeBranche('feat/spec-all-soc-1-cadrage'), null, 'une branche de spec ne porte pas de ticket');
  assert.equal(identifiantDeBranche('feat/spec-all-soc-1-031-x'), null);
  assert.equal(identifiantDeBranche('sujet/spec-all-soc-1-03-x'), null);
  assert.equal(identifiantDeBranche('livraison/spec-all-soc-1-20261110-1200'), null);
  assert.equal(identifiantDeBranche('sujet/demo'), null);
  assert.equal(identifiantDeBranche('HEAD'), null);
  assert.equal(identifiantDeBranche(null), null);
  assert.equal(dossierDuContexte('ALL'), 'all');
  assert.equal(dossierDuContexte(lireIdentifiant('RULE_FNSMR_LIC-05').contexte), 'fnsmr');
});

test('une branche ou un texte porte un identifiant, jamais par un préfixe', () => {
  assert.ok(branchePorte('feat/spec-all-soc-1-03-couche', 'SPEC_ALL_SOC-1.03'));
  assert.ok(branchePorte('chore/spec-all-soc-1-03', 'SPEC_ALL_SOC-1.03'));
  assert.ok(!branchePorte('chore/spec-all-soc-1-030', 'SPEC_ALL_SOC-1.03'));
  assert.ok(!branchePorte('chore/spec-all-soc-11-03-x', 'SPEC_ALL_SOC-1.03'));
  assert.ok(texteCite('feat(api): couche (SPEC_ALL_SOC-1.03)', 'SPEC_ALL_SOC-1.03'));
  assert.ok(texteCite('feat(api): couche (spec_all_soc-1.03)', 'SPEC_ALL_SOC-1.03'));
  assert.ok(!texteCite('autre (SPEC_ALL_SOC-1.030)', 'SPEC_ALL_SOC-1.03'));
  assert.ok(!texteCite('autre (XSPEC_ALL_SOC-1.03)', 'SPEC_ALL_SOC-1.03'));
});

test('les identifiants cités dans un texte libre, et le ticket d’une PR', () => {
  assert.deepEqual(ticketsCites('SPEC_ALL_SOC-1.01 puis SPEC_FNSMR_PAY-3.02, et SPEC_ALL_SOC-1.01 encore ; SOC-1.04 non'), ['SPEC_ALL_SOC-1.01', 'SPEC_FNSMR_PAY-3.02']);
  assert.deepEqual(ticketsCites('SPEC_ALL_SOC-1.010'), []);
  assert.deepEqual(identifiantsCites('Applique `RULE_ALL_FAC-3`, selon ADR_ALL_ARC-2 ; voir SPEC_ALL_SOC-1.06 et [RULE_FNSMR_LIC-05]. LIC-3 non.'), [
    'RULE_ALL_FAC-3',
    'ADR_ALL_ARC-2',
    'SPEC_ALL_SOC-1.06',
    'RULE_FNSMR_LIC-05',
  ]);
  assert.equal(ticketDeLaPr('feat(api): couche base (SPEC_ALL_SOC-1.03)', 'feat/autre'), 'SPEC_ALL_SOC-1.03');
  assert.equal(ticketDeLaPr('feat(api): couche base', 'feat/spec-all-soc-1-04-couche'), 'SPEC_ALL_SOC-1.04');
  assert.equal(ticketDeLaPr('feat(api): couche base (SOC-1.03)', 'feat/soc-1-03-couche'), null);
  assert.equal(ticketDeLaPr('chore: rien', 'chore/menage'), null);
});

test("les fichiers d'une spec et d'un ticket dans un chemin ; l'archive", () => {
  assert.ok(fichiersDeLaSpec('SPEC_ALL_SOC-1').test('docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.03.issue.md'));
  assert.ok(!fichiersDeLaSpec('SPEC_ALL_SOC-1').test('docs/features/socle/all/issues/SPEC_ALL_SOC-12-autre.03.issue.md'));
  assert.ok(fichierDuTicket('SPEC_ALL_SOC-1.03').test('docs/features/socle/all/issues/archive/SPEC_ALL_SOC-1-socle.03.issue.md'));
  assert.ok(!fichierDuTicket('SPEC_ALL_SOC-1.03').test('docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.04.issue.md'));
  assert.equal(fichierDuTicket('SPEC_ALL_SOC-1'), null);
  assert.ok(estArchive('docs/x/all/issues/archive/SPEC_ALL_SOC-1-socle.01.issue.md'));
  assert.ok(!estArchive('docs/x/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md'));
});
