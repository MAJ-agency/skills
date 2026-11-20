import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ENV, depotJouet, script } from '../docs/depot-jouet.mjs';

const SCRIPT = script('verify/tickets.mjs');
const DETTE = {
  'scripts/verify/tickets-dette.json': '{"tickets":[],"cartes":[],"identifiants":[]}\n',
  'docs/agents/issue-tracker.md': '# Suivi\n\n## Réserver un ticket (sessions parallèles)\n\n## Un ticket prêt pour agent\n\n## Archivage\n',
  'docs/agents/triage-labels.md': '`en cours — <branche>` · `Fait — PR #<n>`\n',
};
const lancer = (d, ...args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: d.travail, env: { ...ENV, PATH: d.bin, PROJET_RACINE: d.travail }, encoding: 'utf8' });

test('un dépôt conforme passe, un Status hors vocabulaire échoue avec le chemin et la ligne', () => {
  const ok = depotJouet({ fichiers: { ...DETTE, 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md': '# s\n', 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': '# x\n\nStatus: needs-triage\nType: task\n' } });
  const r = lancer(ok);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tickets : OK — 1 tickets/);
  const ko = depotJouet({ fichiers: { ...DETTE, 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': '# x\n\nStatus: À faire\n' } });
  const r2 = lancer(ko);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:3 : Status « À faire » hors vocabulaire/);
});

test('un identifiant porté par deux specs est refusé, avec la commande next-id à trois segments', () => {
  const d = depotJouet({
    fichiers: {
      ...DETTE,
      'docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md': '# s\n',
      'docs/features/autre/all/SPEC_ALL_SOC-1-autre.spec.md': '# a\n',
      'docs/features/autre/fnsmr/SPEC_FNSMR_SOC-1-autre.spec.md': '# un autre contexte : un autre identifiant\n',
    },
  });
  const r = lancer(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tickets : 1 écart\(s\)/);
  assert.match(r.stderr, /SPEC_ALL_SOC-1 : identifiant porté par plusieurs specs .* `node scripts\/docs\/next-id\.mjs SPEC ALL SOC`/);
});

const PRET_SENSIBLE = (label) =>
  `# x\n\nStatus: ready-for-agent\nType: task\nModèle: sonnet\nFichiers chauds: \`apps/api/src/infrastructure/auth/jwt.ts\`\n${label}\n## Où\n\n- a\n\n## Décisions\n\n- b\n\n## Surfaces\n\n- c\n\n## Vérification\n\n- d\n`;
const CHAINE = { '.claude/chaine.json': '{"cheminsSensibles":["apps/api/src/**/auth/**"]}\n' };

test("un ticket prêt dont `Fichiers chauds` touche `cheminsSensibles` sans `Label: contre-revue` est refusé ; avec, ou avec l'ancienne valeur, il passe", () => {
  const ko = depotJouet({ fichiers: { ...DETTE, ...CHAINE, 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': PRET_SENSIBLE('') } });
  const r = lancer(ko);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:3 : ready-for-agent : ligne `Label: contre-revue` absente : `Fichiers chauds` touche `apps\/api\/src\/infrastructure\/auth\/jwt\.ts`/);
  for (const label of ['Label: contre-revue\n', 'Label: architecte\n']) {
    const ok = depotJouet({ fichiers: { ...DETTE, ...CHAINE, 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': PRET_SENSIBLE(label) } });
    const r2 = lancer(ok);
    assert.equal(r2.status, 0, `${label}${r2.stderr}`);
  }
});

test('un `.claude/chaine.json` illisible fait sortir le gate en erreur, au lieu de cesser d\'exiger', () => {
  const d = depotJouet({ fichiers: { ...DETTE, '.claude/chaine.json': '{ cassé', 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': '# x\n\nStatus: needs-triage\n' } });
  const r = lancer(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tickets : \.claude\/chaine\.json illisible/);
});

const REGISTRE = {
  'docs/metier/regles/all/RULE_ALL_LIC-3.md': '---\nid: RULE_ALL_LIC-3\n---\n',
  'docs/metier/regles/fnsmr/RULE_FNSMR_LIC-05.md': '---\nid: RULE_FNSMR_LIC-05\n---\n',
  'docs/metier/regles/all/RULE_FNSMR_LIC-7.md': '---\nhors du dossier de son contexte : pas au registre\n---\n',
  'apps/api/src/licence.spec.ts': "describe('licence', () => {\n  it('[RULE_FNSMR_LIC-05] refuse une licence expirée', () => {});\n  it.skip('accepte un mineur', () => {});\n});\n",
};
const FNSMR = 'docs/features/structures/fnsmr/issues/SPEC_FNSMR_STR-6-structures.01.issue.md';
const DEFAUT_FAIT = (regles, titre) =>
  `# Défaut\n\nStatus: Fait — PR #12\nType: défaut\nRègles: ${regles}\n\n## Surfaces\n\n| Surface | Preuve |\n| --- | --- |\n| licence | \`apps/api/src/licence.spec.ts\` « ${titre} » |\n`;

test('gate complet : un défaut Fait du contexte FNSMR, ses deux règles au registre et son test actif passent', () => {
  const d = depotJouet({ fichiers: { ...DETTE, ...REGISTRE, [FNSMR]: DEFAUT_FAIT('RULE_ALL_LIC-3, `RULE_FNSMR_LIC-05`', '[RULE_FNSMR_LIC-05] refuse une licence expirée') } });
  const r = lancer(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tickets : OK — 1 tickets/);
});

test('gate complet : test désactivé, règle hors registre ou d’un autre contexte, Type absent sont refusés, chacun nommé', () => {
  const d = depotJouet({
    fichiers: {
      ...DETTE,
      ...REGISTRE,
      [FNSMR]: DEFAUT_FAIT('RULE_FNSMR_LIC-7', 'accepte un mineur'),
      'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': '# x\n\nStatus: needs-triage\nType: task\nRègles: RULE_FNSMR_LIC-05\n',
      'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.02.issue.md': '# x\n\nStatus: needs-triage\n',
    },
  });
  const r = lancer(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tickets : 4 écart\(s\)/);
  assert.match(r.stderr, /SPEC_FNSMR_STR-6-structures\.01\.issue\.md:5 : Règles cite RULE_FNSMR_LIC-7, absente du registre \(docs\/metier\/regles\/fnsmr\/RULE_FNSMR_LIC-7\.md\)/);
  assert.match(r.stderr, /SPEC_FNSMR_STR-6-structures\.01\.issue\.md:4 : défaut Fait : le test « accepte un mineur » de `apps\/api\/src\/licence\.spec\.ts` est désactivé/);
  assert.match(r.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:5 : Règles cite RULE_FNSMR_LIC-05, du contexte FNSMR : un ticket du contexte ALL ne cite que des règles de ALL/);
  assert.match(r.stderr, /SPEC_ALL_SOC-1-socle\.02\.issue\.md:1 : ligne `Type:` absente/);
});

test('dette `types` : gelée une fois par --geler-types, jamais agrandie, élaguée quand le ticket reçoit son Type', () => {
  const ancien = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
  const d = depotJouet({ fichiers: { ...DETTE, [ancien]: '# x\n\nStatus: needs-triage\n' } });
  assert.equal(lancer(d).status, 1);
  const gel = lancer(d, '--geler-types');
  assert.equal(gel.status, 0, gel.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(d.travail, 'scripts/verify/tickets-dette.json'), 'utf8')).types, [ancien]);
  const r = lancer(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 sans Type: gelé\(s\)/);
  const encore = lancer(d, '--geler-types');
  assert.equal(encore.status, 1);
  assert.match(encore.stderr, /dette `types` est déjà gelée/);
  const nouveau = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.02.issue.md';
  writeFileSync(join(d.travail, nouveau), '# x\n\nStatus: needs-triage\n');
  d.git('add', '-A');
  const r2 = lancer(d);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.02\.issue\.md:1 : ligne `Type:` absente/);
  writeFileSync(join(d.travail, nouveau), '# x\n\nStatus: needs-triage\nType: task\n');
  writeFileSync(join(d.travail, ancien), '# x\n\nStatus: needs-triage\nType: research\n');
  const r3 = lancer(d);
  assert.equal(r3.status, 0, r3.stderr);
  assert.match(r3.stdout, /1 entrée\(s\) éteinte\(s\)/);
  lancer(d, '--elaguer');
  assert.deepEqual(JSON.parse(readFileSync(join(d.travail, 'scripts/verify/tickets-dette.json'), 'utf8')).types, []);
});

const FICHE_CARTE = (lignes) => `# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: 2-decoupage\n${lignes}`;

test('dette des fiches : gelée une fois, jamais agrandie, élaguée quand la carte nomme son responsable et son conducteur', () => {
  const ancienne = 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.map.md';
  const d = depotJouet({ fichiers: { ...DETTE, [ancienne]: FICHE_CARTE('Architecte: session_x\nConducteur: session_z\n') } });
  const lireDette = () => JSON.parse(readFileSync(join(d.travail, 'scripts/verify/tickets-dette.json'), 'utf8'));
  const avant = lancer(d);
  assert.equal(avant.status, 1);
  assert.match(avant.stderr, /SPEC_ALL_SOC-1-socle\.map\.md:1 : carte SPEC_ALL_SOC-1-socle\.map\.md : `Responsable:` absent ou vide/);
  const gel = lancer(d, '--geler-fiches');
  assert.equal(gel.status, 0, gel.stderr);
  assert.deepEqual(lireDette().fiches, [ancienne]);
  const r = lancer(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 fiche\(s\) d'avant Responsable:\/Conducteur:/);
  const encore = lancer(d, '--geler-fiches');
  assert.equal(encore.status, 1);
  assert.match(encore.stderr, /dette `fiches` est déjà gelée/);
  // Gelée, la carte garde l'ancienne règle : `Architecte:` non vide.
  writeFileSync(join(d.travail, ancienne), FICHE_CARTE('Architecte:\n'));
  assert.match(lancer(d).stderr, /`Architecte:` absent ou vide/);
  // Une carte nouvelle n'entre jamais dans la dette.
  const nouvelle = 'docs/features/socle/all/SPEC_ALL_SOC-2-autre.map.md';
  writeFileSync(join(d.travail, ancienne), FICHE_CARTE('Architecte: session_x\n'));
  writeFileSync(join(d.travail, nouvelle), FICHE_CARTE('Architecte: session_x\n'));
  d.git('add', '-A');
  const r2 = lancer(d);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SPEC_ALL_SOC-2-autre\.map\.md:1 : carte SPEC_ALL_SOC-2-autre\.map\.md : `Responsable:` absent ou vide/);
  assert.doesNotMatch(r2.stderr, /SPEC_ALL_SOC-1-socle\.map\.md/);
  writeFileSync(join(d.travail, nouvelle), FICHE_CARTE('Responsable: Camille Martin\nConducteur: session_y\n'));
  writeFileSync(join(d.travail, ancienne), FICHE_CARTE('Responsable: Camille Martin\nConducteur: session_z\n'));
  const r3 = lancer(d);
  assert.equal(r3.status, 0, r3.stderr);
  assert.match(r3.stdout, /1 entrée\(s\) éteinte\(s\)/);
  lancer(d, '--elaguer');
  assert.deepEqual(lireDette().fiches, []);
});

test('scripts/docs/identifiants.mjs absent : sortie 2, la grammaire du socle nommée', async () => {
  const { cpSync, mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { dirname } = await import('node:path');
  const d = depotJouet();
  const sans = join(mkdtempSync(join(tmpdir(), 'tickets-sans-grammaire-')), 'scripts/verify');
  cpSync(dirname(SCRIPT), sans, { recursive: true });
  const r = spawnSync(process.execPath, [join(sans, 'tickets.mjs')], { cwd: d.travail, env: { ...ENV, PATH: d.bin, PROJET_RACINE: d.travail }, encoding: 'utf8' });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /scripts\/docs\/identifiants\.mjs introuvable .*socle-monorepo/);
});

test('gate complet : une fille au-delà du plafond sans dépassement écrit est refusée, la carte et la session nommées', () => {
  const carte = 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.map.md';
  const cout = (suite = '') =>
    `# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: 4-vague-1\nResponsable: Camille Martin\nConducteur: session_z\n\n## Coût\n\n| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |\n| --- | --- | --- | --- | --- | --- |\n| fille | SPEC_ALL_SOC-1.01 | session_f | sonnet | 410 k | 25,00 |\n${suite}`;
  const d = depotJouet({ fichiers: { ...DETTE, '.claude/chaine.json': '{}\n', [carte]: cout() } });
  const r = lancer(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /SPEC_ALL_SOC-1-socle\.map\.md:\d+ : carte SPEC_ALL_SOC-1-socle\.map\.md : `## Coût`, session session_f \(fille\) : contexte 410000 tokens ≥ plafond 400000/);
  writeFileSync(join(d.travail, carte), cout('\n## Dépassements\n\n| Session | Ticket | Mesure | Décision du produit | Date |\n| --- | --- | --- | --- | --- |\n| session_f | SPEC_ALL_SOC-1.01 | 410 k | accepté | 2026-11-13 |\n'));
  d.git('add', '-A');
  const ok = lancer(d);
  assert.equal(ok.status, 0, ok.stderr);
  // Contrat mal formé : le gate échoue fermé ; sans contrat, aucun plafond.
  writeFileSync(join(d.travail, '.claude/chaine.json'), '{"plafonds":{"contexteFille":0}}\n');
  const mal = lancer(d);
  assert.equal(mal.status, 1);
  assert.match(mal.stderr, /plafonds\.contexteFille/);
  // Un contrat posé avant l'abandon du seuil de coût porte encore `coutFille` : il passe.
  writeFileSync(join(d.travail, '.claude/chaine.json'), '{"plafonds":{"coutFille":20}}\n');
  assert.equal(lancer(d).status, 0);
  const sans = depotJouet({ fichiers: { ...DETTE, [carte]: cout() } });
  assert.equal(lancer(sans).status, 0);
});

test('gate complet : `Sensibles:` ou `Relecture:` mal formée est refusée avec le chemin et la ligne ; bien formées, avec `Règles: —`, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture, passe', () => {
  const ticket = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
  const corps = (enTete) => `# x\n\nStatus: needs-triage\nType: task\n${enTete}`;
  const carte = 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.map.md';
  const finie =
    '# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: fini\nResponsable: Camille Martin\nConducteur: session_z\n\n## Coût\n\n| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |\n| --- | --- | --- | --- | --- | --- |\n| relecture | SPEC_ALL_SOC-1.01 | session_r | sonnet | 900 k | 2,00 |\n';
  const ok = depotJouet({ fichiers: { ...DETTE, '.claude/chaine.json': '{}\n', [carte]: finie, [ticket]: corps('Sensibles: scripts/chaine/passer.sh, scripts/agent/** — accord de Camille Martin, 2026-11-18\nRelecture: double\nRègles: —\n') } });
  const r = lancer(ok);
  assert.equal(r.status, 0, r.stderr);
  const ko = depotJouet({ fichiers: { ...DETTE, [ticket]: corps('Sensibles: scripts/chaine/passer.sh\nRelecture: triple\n') } });
  const r2 = lancer(ko);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:5 : Sensibles « scripts\/chaine\/passer\.sh » : attendu `—`, ou des chemins/);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:6 : Relecture « triple » : seule valeur `double`/);
});
