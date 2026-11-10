import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ENV, depotJouet } from './depot-jouet.mjs';

const SCRIPT = new URL('./migrer-tickets.mjs', import.meta.url).pathname;
// Forme A : le socle d'avant le standard, sans identifiant.
const FICHIERS = {
  'docs/features/socle/socle.spec.md': '# Le socle\n\nTickets : [`4-couche`](issues/4-couche-base-de-donnees.issue.md), `1-modeliser-le-domaine`.\n',
  'docs/features/socle/issues/1-modeliser-le-domaine.issue.md': '# Modéliser\n\nStatus: ready-for-human\nType: grilling\n\nBloqué par : rien. À faire avant `4-couche-base-de-donnees`.\n',
  'docs/features/socle/issues/4-couche-base-de-donnees.issue.md': '# Couche\n\nStatus: needs-triage\n\nBloqué par : `1-modeliser-le-domaine`.\n\nVoir [la spec](../socle.spec.md).\n',
  'docs/features/socle/issues/6-journal.issue.md':
    '# Journal\n\nStatus: needs-triage\n\nBloqué par : `4-couche-base-de-donnees` et `1-modeliser-le-domaine` — deux tables.\n',
  'docs/features/socle/issues/7-audit.issue.md':
    '# Audit\n\nBloqué par : `4-couche-base-de-donnees` (la table des comptes).\n\n## Le besoin\n\nType: ceci est du corps, pas un en-tête.\n',
  'docs/adr/ADR_ALL_ARC-2-isolation.md': '# ADR_ALL_ARC-2\n\nLe ticket [4](../features/socle/issues/4-couche-base-de-donnees.issue.md). Voir [les ADR](../adr/).\n',
};
const lancer = (d, args) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: d.travail, env: { ...ENV, PATH: d.bin }, encoding: 'utf8' });
const lire = (d, chemin) => readFileSync(`${d.travail}/${chemin}`, 'utf8');
const ALL = 'docs/features/socle/all';

test('dry-run : annonce les renommages dans le dossier du contexte, ne touche rien', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = lancer(d, ['socle', 'ALL', 'SOC']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /socle → SPEC_ALL_SOC-1 \(dry-run/);
  assert.match(r.stdout, /→ docs\/features\/socle\/all\/SPEC_ALL_SOC-1-socle\.spec\.md/);
  assert.match(r.stdout, /→ docs\/features\/socle\/all\/issues\/SPEC_ALL_SOC-1-socle\.04\.issue\.md/);
  assert.ok(existsSync(`${d.travail}/docs/features/socle/socle.spec.md`));
  assert.ok(!existsSync(`${d.travail}/${ALL}`));
});

test('--appliquer, ancienne forme du socle : git mv sous <ctx>/, liens et mentions réécrits, Blocked by sur deux chiffres', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  const r = lancer(d, ['socle', 'ALL', 'SOC', '--appliquer']);
  assert.equal(r.status, 0, r.stderr);
  const spec = lire(d, `${ALL}/SPEC_ALL_SOC-1-socle.spec.md`);
  assert.match(spec, /\(issues\/SPEC_ALL_SOC-1-socle\.04\.issue\.md\)/);
  assert.match(spec, /`SPEC_ALL_SOC-1-socle\.01`/);
  const t4 = lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.04.issue.md`);
  assert.match(t4, /^Blocked by: 01$/m);
  const t6 = lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.06.issue.md`);
  assert.match(t6, /^Blocked by: 01, 04 — deux tables\.$/m);
  const t7 = lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.07.issue.md`);
  assert.match(t7, /^Blocked by: 04 — la table des comptes$/m); // le « 1 » de SPEC_ALL_SOC-1 n'est pas un numéro ; la raison reste, sans redite
  const t1 = lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.01.issue.md`);
  assert.match(t1, /^Bloqué par : rien\. À faire avant `SPEC_ALL_SOC-1-socle\.04`\.$/m); // « rien » n'est pas une liste
  assert.match(t4, /\(\.\.\/SPEC_ALL_SOC-1-socle\.spec\.md\)/);
  const adr = lire(d, 'docs/adr/ADR_ALL_ARC-2-isolation.md');
  assert.match(adr, /\]\(\.\.\/adr\/\)/); // un lien sans rapport n'est pas normalisé
  assert.match(adr, /features\/socle\/all\/issues\/SPEC_ALL_SOC-1-socle\.04\.issue\.md/);
  assert.ok(!existsSync(`${d.travail}/docs/features/socle/issues/4-couche-base-de-donnees.issue.md`));
  assert.equal(d.git('status', '--porcelain').split('\n').filter((l) => l && !/^[ RM]{2} /.test(l)).length, 0, 'des renommages et des modifications, rien de perdu');
});

test('`Type: task` est posé sur un ticket qui n’a pas de `Type:`, sous `Status:` ou sous le titre ; un `Type:` existant reste', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.equal(lancer(d, ['socle', 'ALL', 'SOC', '--appliquer']).status, 0);
  assert.match(lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.04.issue.md`), /^# Couche\n\nStatus: needs-triage\nType: task\n/);
  const t1 = lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.01.issue.md`);
  assert.match(t1, /^Type: grilling$/m);
  assert.doesNotMatch(t1, /Type: task/);
  // Sans ligne Status: : sous le titre ; un « Type: » dans le corps n'est pas l'en-tête.
  assert.match(lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.07.issue.md`), /^# Audit\n\nType: task\n\nBlocked by: 04/);
  assert.doesNotMatch(lire(d, `${ALL}/SPEC_ALL_SOC-1-socle.spec.md`), /Type: task/, 'une spec ne porte pas de Type:');
});

// Forme B : `<TRI>-<n>` sans type ni contexte.
const ANCIENS = {
  'docs/features/socle/SOC-1-socle.spec.md': '# SOC-1 — Le socle\n\nSujet: sujet/socle\n\n| Ticket | Objet |\n| --- | --- |\n| SOC-1.01 | [modéliser](issues/archive/SOC-1-socle.01.issue.md) |\n| SOC-1.03 | la couche base (RULE_ALL_FAC-3) |\n',
  'docs/features/socle/SOC-1-socle.map.md': '# SOC-1 — Carte\n\nSujet: sujet/socle\n\nVoir [l’analyse](SOC-1-socle.analyse.md).\n',
  'docs/features/socle/SOC-1-socle.analyse.md': '# Analyse pour SOC-1\n',
  'docs/features/socle/SOC-1-hebergement.question.md': '# Question\n\nPosée par [la spec](SOC-1-socle.spec.md).\n',
  'docs/features/socle/issues/SOC-1-socle.03.issue.md': '# SOC-1.03 — Couche base\n\nStatus: ready-for-agent\nBlocked by: 01\nModèle: sonnet\n\nVoir [la spec](../SOC-1-socle.spec.md) et SOC-1.01 ; SOC-12.01 et SOC-10 sont d’autres specs.\n',
  'docs/features/socle/issues/archive/SOC-1-socle.01.issue.md': '# SOC-1.01 — Modéliser\n\nStatus: Fait — PR #4\nType: grilling\n',
  'docs/features/suite/SOC-12-suite.spec.md': '# SOC-12 — La suite, après SOC-1\n',
  'docs/features/suite/issues/SOC-12-suite.01.issue.md': '# SOC-12.01\n\nStatus: needs-triage\nBlocked by: SOC-1.03\n',
  'docs/adr/ADR_ALL_ARC-2-isolation.md': '# ADR_ALL_ARC-2\n\nDécidé pour SOC-1 (ticket SOC-1.03), repris de ALL-SOC-1 et de SPEC_FNSMR_SOC-1.\n',
};

test('forme <TRI>-<n> sans contexte : le numéro, le slug et l’index sont gardés, tout passe sous <ctx>/, archive comprise', () => {
  const d = depotJouet({ fichiers: ANCIENS });
  const sec = lancer(d, ['socle', 'ALL', 'SOC']);
  assert.equal(sec.status, 0, sec.stderr);
  assert.match(sec.stdout, /socle → SPEC_ALL_SOC-1 \(dry-run/);
  const r = lancer(d, ['socle', 'ALL', 'SOC', '--appliquer']);
  assert.equal(r.status, 0, r.stderr);
  // L'analyse et la question portent l'identifiant de la spec : elles la suivent, et leurs liens avec elles.
  assert.match(lire(d, `${ALL}/SPEC_ALL_SOC-1-socle.map.md`), /\[l’analyse\]\(SPEC_ALL_SOC-1-socle\.analyse\.md\)/);
  assert.equal(lire(d, `${ALL}/SPEC_ALL_SOC-1-socle.analyse.md`), '# Analyse pour SPEC_ALL_SOC-1\n');
  assert.match(lire(d, `${ALL}/SPEC_ALL_SOC-1-hebergement.question.md`), /\[la spec\]\(SPEC_ALL_SOC-1-socle\.spec\.md\)/);
  for (const f of ['SPEC_ALL_SOC-1-socle.spec.md', 'SPEC_ALL_SOC-1-socle.map.md', 'issues/SPEC_ALL_SOC-1-socle.03.issue.md', 'issues/archive/SPEC_ALL_SOC-1-socle.01.issue.md'])
    assert.ok(existsSync(`${d.travail}/${ALL}/${f}`), f);
  assert.ok(!existsSync(`${d.travail}/docs/features/socle/SOC-1-socle.spec.md`));
  assert.ok(existsSync(`${d.travail}/docs/features/suite/SOC-12-suite.spec.md`), 'une autre feature ne bouge pas');
});

test('forme <TRI>-<n> : les mentions de la spec migrée sont réécrites partout, jamais celles d’un autre numéro', () => {
  const d = depotJouet({ fichiers: ANCIENS });
  assert.equal(lancer(d, ['socle', 'ALL', 'SOC', '--appliquer']).status, 0);
  const spec = lire(d, `${ALL}/SPEC_ALL_SOC-1-socle.spec.md`);
  assert.match(spec, /^# SPEC_ALL_SOC-1 — Le socle$/m);
  assert.match(spec, /\| SPEC_ALL_SOC-1\.01 \| \[modéliser\]\(issues\/archive\/SPEC_ALL_SOC-1-socle\.01\.issue\.md\) \|/);
  assert.match(spec, /\| SPEC_ALL_SOC-1\.03 \| la couche base \(RULE_ALL_FAC-3\) \|/);
  const t3 = lire(d, `${ALL}/issues/SPEC_ALL_SOC-1-socle.03.issue.md`);
  assert.match(t3, /^# SPEC_ALL_SOC-1\.03 — Couche base\n\nStatus: ready-for-agent\nType: task\nBlocked by: 01\n/);
  assert.match(t3, /\[la spec\]\(\.\.\/SPEC_ALL_SOC-1-socle\.spec\.md\) et SPEC_ALL_SOC-1\.01 ; SOC-12\.01 et SOC-10 sont d’autres specs\./);
  assert.match(lire(d, `${ALL}/issues/archive/SPEC_ALL_SOC-1-socle.01.issue.md`), /^# SPEC_ALL_SOC-1\.01 — Modéliser\n\nStatus: Fait — PR #4\nType: grilling\n$/);
  assert.equal(lire(d, 'docs/features/suite/SOC-12-suite.spec.md'), '# SOC-12 — La suite, après SPEC_ALL_SOC-1\n');
  assert.match(lire(d, 'docs/features/suite/issues/SOC-12-suite.01.issue.md'), /^# SOC-12\.01\n\nStatus: needs-triage\nBlocked by: SPEC_ALL_SOC-1\.03\n$/);
  assert.equal(lire(d, 'docs/adr/ADR_ALL_ARC-2-isolation.md'), '# ADR_ALL_ARC-2\n\nDécidé pour SPEC_ALL_SOC-1 (ticket SPEC_ALL_SOC-1.03), repris de ALL-SOC-1 et de SPEC_FNSMR_SOC-1.\n');
});

test('forme <CTX>-<TRI>-<n>, le contexte dans le préfixe et le dossier déjà là : rangée sous le même identifiant', () => {
  const d = depotJouet({
    fichiers: {
      'docs/features/fof/fnsmr/FNSMR-FOF-11-formules.spec.md': '# FNSMR-FOF-11\n',
      'docs/features/fof/fnsmr/issues/FNSMR-FOF-11-formules.04.issue.md': '# FNSMR-FOF-11.04\n\nStatus: needs-triage\n',
    },
  });
  const r = lancer(d, ['fof', 'FNSMR', 'FOF', '--appliquer']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(lire(d, 'docs/features/fof/fnsmr/SPEC_FNSMR_FOF-11-formules.spec.md'), '# SPEC_FNSMR_FOF-11\n');
  assert.equal(lire(d, 'docs/features/fof/fnsmr/issues/SPEC_FNSMR_FOF-11-formules.04.issue.md'), '# SPEC_FNSMR_FOF-11.04\n\nStatus: needs-triage\nType: task\n');
});

test('une feature sans identifiant prend le numéro après les anciens <TRI>-<n> pas encore migrés', () => {
  const d = depotJouet({ fichiers: { ...FICHIERS, 'docs/features/suite/SOC-12-suite.spec.md': ANCIENS['docs/features/suite/SOC-12-suite.spec.md'] } });
  // socle.spec.md (forme A) côtoie SOC-12 (forme B, autre feature) : le prochain libre est 13, pas 1.
  const r = lancer(d, ['socle', 'ALL', 'SOC']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /→ docs\/features\/socle\/all\/SPEC_ALL_SOC-13-socle\.spec\.md/);
});

test('--n force le numéro ; refus : index au-delà de 99, ancien usage, rien à migrer, --n sur un identifiant existant', () => {
  const d = depotJouet({ fichiers: FICHIERS });
  assert.match(lancer(d, ['socle', 'ALL', 'SOC', '--n', '7']).stdout, /socle → SPEC_ALL_SOC-7 /);
  const d2 = depotJouet({ fichiers: { 'docs/features/x/issues/120-trop.issue.md': '# x\n' } });
  assert.equal(lancer(d2, ['x', 'ALL', 'XYZ']).status, 2);
  const ancienUsage = lancer(d, ['socle', 'SOC']);
  assert.equal(ancienUsage.status, 2);
  assert.match(ancienUsage.stderr, /Usage : node scripts\/docs\/migrer-tickets\.mjs <feature> <CTX> <TRI>/);
  assert.equal(lancer(d, ['socle', 'ALL', 'SOCLE']).status, 2, 'un trigramme a deux à quatre lettres');
  assert.equal(lancer(d, ['absente', 'ALL', 'SOC']).status, 2);
  const d3 = depotJouet({ fichiers: { 'docs/features/socle/SOC-1-socle.spec.md': '# SOC-1\n' } });
  const r = lancer(d3, ['socle', 'ALL', 'SOC', '--n', '7']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /garde son numéro/);
});
