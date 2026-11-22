import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

// Lot 5c : en régime 8, le gate lit la criticité des règles citées par les lecteurs de `double-relecture.mjs`, posé à
// `scripts/chaine/` avec la grammaire à `scripts/docs/` ; sans lui, il s'arrête en le disant.
test('régime 8 : sans `Label: contre-revue` un ticket prêt sensible passe ; un ticket ouvert qui cite une règle haute sans `Relecture: double` est refusé ; sans double-relecture.mjs, sortie 2', () => {
  // Posé dans un projet, à côté (scripts/chaine/, scripts/docs/) ; dans le plugin, dans les skills fusionner et socle-monorepo.
  const premier = (...chemins) => readFileSync(chemins.map((c) => new URL(c, import.meta.url)).find((u) => existsSync(u)), 'utf8');
  const OUTILS = {
    'scripts/chaine/double-relecture.mjs': premier('../chaine/double-relecture.mjs', '../../../../fusionner/scripts/double-relecture.mjs'),
    'scripts/docs/identifiants.mjs': premier('../docs/identifiants.mjs', '../../../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs'),
  };
  const REGLE = (niveau) => `---\nkey: RULE_ALL_SOC-1\ncriticality:\n  level: ${niveau}\n---\n# Règle\n`;
  const HUIT = { '.claude/chaine.json': '{"cheminsSensibles":["apps/api/src/**/auth/**"],"relecture":{"depuis":"2026-11-21T09:00:00Z"}}\n' };
  const ticket = (relecture) => PRET_SENSIBLE('').replace('Type: task\n', `Type: task\nRègles: RULE_ALL_SOC-1\n${relecture}`);
  const depot = (niveau, relecture, outils = OUTILS) =>
    depotJouet({ fichiers: { ...DETTE, ...HUIT, ...outils, 'docs/metier/regles/all/RULE_ALL_SOC-1.md': REGLE(niveau), 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': ticket(relecture) } });
  const ok = lancer(depot('medium', ''));
  assert.equal(ok.status, 0, ok.stderr);
  const haute = lancer(depot('high', ''));
  assert.equal(haute.status, 1, haute.stdout + haute.stderr);
  assert.match(haute.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:\d+ : régime 8 : ligne `Relecture: double` absente alors que le ticket cite RULE_ALL_SOC-1, règle de criticité haute/);
  assert.doesNotMatch(haute.stderr, /Label: contre-revue/);
  const double = lancer(depot('high', 'Relecture: double\n'));
  assert.equal(double.status, 0, double.stderr);
  const sans = lancer(depot('high', '', {}));
  assert.equal(sans.status, 2, sans.stdout + sans.stderr);
  assert.match(sans.stderr, /régime 8 et scripts\/chaine\/double-relecture\.mjs introuvable/);
  // Comme le calcul « double relecture exigée » (`hautes`, A-113, A-134) : le plus haut des deux niveaux, et l'un des deux
  // suffit à dire la règle en vigueur ; rejetée dans l'index comme dans son en-tête, elle ne compte pas, même haute.
  // La criticité de l'entrée posée par une variable : aucun texte du plugin ne la montre en ligne (scripts/depot.test.mjs).
  const niveauHaut = { level: 'high' };
  const index = (statut) => ({ 'anchorpost/anchorpost.json': `${JSON.stringify({ schema: '3', rules: [{ key: 'RULE_ALL_SOC-1', criticality: niveauHaut, validation: { status: statut } }] })}\n` });
  const rejetee = lancer(depot('medium', '', { ...OUTILS, ...index('rejected') }));
  assert.equal(rejetee.status, 1, `rejetée dans l'index, en vigueur dans son en-tête : le calcul l'exige (contre-relecture de la PR 149) : ${rejetee.stderr}`);
  assert.match(rejetee.stderr, /régime 8 : ligne `Relecture: double` absente alors que le ticket cite RULE_ALL_SOC-1/);
  const horsVigueur = (statut) => REGLE('medium').replace('criticality:', `validation:\n  status: ${statut}\ncriticality:`);
  const rejeteePartout = depotJouet({ fichiers: { ...DETTE, ...HUIT, ...OUTILS, ...index('rejected'), 'docs/metier/regles/all/RULE_ALL_SOC-1.md': horsVigueur('rejected'), 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md': ticket('') } });
  const rp = lancer(rejeteePartout);
  assert.equal(rp.status, 0, `rejetée dans l'index et dans son en-tête : ${rp.stderr}`);
  const enVigueur = lancer(depot('medium', '', { ...OUTILS, ...index('validated') }));
  assert.equal(enVigueur.status, 1, "règle haute en vigueur dans l'index : Relecture: double exigée");
  assert.match(enVigueur.stderr, /régime 8 : ligne `Relecture: double` absente alors que le ticket cite RULE_ALL_SOC-1/);
});

// ── K3 de la preuve suffisante : l'index commis au pivot 3 décide, son `project.sufficiency` dit refus ou avertissement ─
const K3_TICKET = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
const K3_PRET = (surfaces) =>
  `# x\n\nStatus: ready-for-agent\nType: task\nRègles: RULE_ALL_SOC-1\nProuve: RULE_ALL_SOC-2\nModèle: sonnet\nFichiers chauds: —\n\n## Où\n\n- a\n\n## Décisions\n\n- b\n\n## Surfaces\n\n${surfaces}\n## Vérification\n\n- d\n`;
const K3_REGLES = { 'docs/metier/regles/all/RULE_ALL_SOC-1.md': '---\nid: RULE_ALL_SOC-1\n---\n', 'docs/metier/regles/all/RULE_ALL_SOC-2.md': '---\nid: RULE_ALL_SOC-2\n---\n' };
const k3Niveau = { level: 'medium', origin: 'declared' };
const k3Index = (schema, sufficiency) => ({
  'anchorpost/anchorpost.json': `${JSON.stringify({
    schema,
    ...(sufficiency ? { project: { name: 'p', sufficiency } } : {}),
    rules: [
      { key: 'RULE_ALL_SOC-1', criticality: k3Niveau, cases: [{ id: 'nominal' }] },
      { key: 'RULE_ALL_SOC-2', cases: [] },
    ],
  })}\n`,
});
const k3Lancer = (index, surfaces = '| nominal | [RULE_ALL_SOC-1#nominal] |\n') =>
  lancer(depotJouet({ fichiers: { ...DETTE, ...K3_REGLES, ...index, [K3_TICKET]: K3_PRET(surfaces) } }));

test("K3, gate : sans index ou d'un autre schéma que 3, rien ne change ; un index au pivot 3 en observe signale, en enforce refuse", () => {
  for (const [quoi, index] of [['sans index', {}], ['index au schéma 2', k3Index('2', 'enforce')]]) {
    const r = k3Lancer(index, '| surface | à écrire |\n');
    assert.equal(r.status, 0, `${quoi} : ${r.stderr}`);
    assert.doesNotMatch(r.stdout, /avertissement/, quoi);
    assert.match(r.stdout, /tickets : OK — 1 tickets/, quoi);
  }
  const message = "SPEC_ALL_SOC-1-socle.01.issue.md:3 : ready-for-agent : preuve suffisante (MODE) : RULE_ALL_SOC-2 n'a pas de criticité dans l'index (« à classer »)";
  for (const index of [k3Index('3', 'observe'), k3Index('3')]) {
    const r = k3Lancer(index);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /tickets : 2 avertissement\(s\) de la preuve suffisante \(observe : rien n'est refusé\) :/);
    assert.ok(r.stdout.includes(message.replace('MODE', 'observe')), r.stdout);
    assert.match(r.stdout, /RULE_ALL_SOC-2 ne déclare aucun cas attendu dans l'index/);
    assert.match(r.stdout, /tickets : OK — 1 tickets/);
  }
  const e = k3Lancer(k3Index('3', 'enforce'));
  assert.equal(e.status, 1);
  assert.match(e.stderr, /tickets : 2 écart\(s\) :/);
  assert.ok(e.stderr.includes(message.replace('MODE', 'enforce')), e.stderr);
  const surfaces = k3Lancer(k3Index('3', 'enforce'), '| nominal | à écrire |\n');
  assert.match(surfaces.stderr, /tickets : 3 écart\(s\) :/);
  assert.match(surfaces.stderr, /`## Surfaces` ne nomme pas le cas RULE_ALL_SOC-1#nominal/);
});

test("K3, gate : un index présent qui n'est pas du JSON fait sortir le gate en erreur, la cause dite, au lieu de cesser de juger", () => {
  const r = k3Lancer({ 'anchorpost/anchorpost.json': '{ cassé' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tickets : anchorpost\/anchorpost\.json illisible \(.+\) : la criticité et les cas des règles citées ne se lisent pas ; régénérer l'index/);
});

test("K3, gate : une règle rejetée ou obsolète dans l'index ne se juge pas ; un niveau ou un cas hors de la forme de l'index ne compte pas", () => {
  const regles = Object.fromEntries([1, 2, 3, 4].map((n) => [`docs/metier/regles/all/RULE_ALL_SOC-${n}.md`, `---\nid: RULE_ALL_SOC-${n}\n---\n`]));
  const index = (rules) => ({ 'anchorpost/anchorpost.json': `${JSON.stringify({ schema: '3', project: { name: 'p', sufficiency: 'enforce' }, rules })}\n` });
  const ticket = (cites) =>
    `# x\n\nStatus: ready-for-agent\nType: task\nRègles: ${cites}\nModèle: sonnet\nFichiers chauds: —\n\n## Où\n\n- a\n\n## Décisions\n\n- b\n\n## Surfaces\n\n| nominal | [RULE_ALL_SOC-1#nominal] |\n\n## Vérification\n\n- d\n`;
  const jouer = (rules, cites) => lancer(depotJouet({ fichiers: { ...DETTE, ...regles, ...index(rules), [K3_TICKET]: ticket(cites) } }));
  const classee = { key: 'RULE_ALL_SOC-1', criticality: k3Niveau, cases: [{ id: 'nominal' }] };
  const closes = jouer(
    [classee, { key: 'RULE_ALL_SOC-2', cases: [], validation: { status: 'rejected' } }, { key: 'RULE_ALL_SOC-3', cases: [], validation: { status: 'obsolete' } }],
    'RULE_ALL_SOC-1, RULE_ALL_SOC-2, RULE_ALL_SOC-3',
  );
  assert.equal(closes.status, 0, `rejetée et obsolète : rien n'est jugé, même en enforce\n${closes.stderr}`);
  assert.doesNotMatch(closes.stdout + closes.stderr, /preuve suffisante/);
  const niveauHorsVocabulaire = { level: 'critique' };
  const horsForme = jouer([classee, { key: 'RULE_ALL_SOC-4', criticality: niveauHorsVocabulaire, cases: [{ titre: 'sans id' }] }], 'RULE_ALL_SOC-1, RULE_ALL_SOC-4');
  assert.equal(horsForme.status, 1);
  assert.match(horsForme.stderr, /tickets : 2 écart\(s\) :/, horsForme.stderr);
  assert.match(horsForme.stderr, /RULE_ALL_SOC-4 n'a pas de criticité dans l'index \(« à classer »\)/, 'un niveau hors de low, medium, high : à classer');
  assert.match(horsForme.stderr, /RULE_ALL_SOC-4 ne déclare aucun cas attendu dans l'index/, 'un cas sans identifiant ne compte pas');
  const nombre = lancer(depotJouet({ fichiers: { ...DETTE, ...regles, 'anchorpost/anchorpost.json': `${JSON.stringify({ schema: 3, project: { sufficiency: 'enforce' }, rules: [] })}\n`, [K3_TICKET]: ticket('RULE_ALL_SOC-4') } }));
  assert.equal(nombre.status, 0, `un schema 3 en nombre n'est pas le pivot 3 (la CLI écrit "3") : rien n'est jugé\n${nombre.stderr}`);
});
