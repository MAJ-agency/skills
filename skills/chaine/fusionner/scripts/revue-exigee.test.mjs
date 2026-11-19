import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aSectionRevue, exigeRevue, motifSansRevue, motifTitreSansCode } from './revue-exigee.mjs';
import * as revueExigee from './revue-exigee.mjs';
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const jouet = await import(existsSync(new URL('./depot-jouet.mjs', import.meta.url)) ? './depot-jouet.mjs' : '../../sujet/scripts/depot-jouet.mjs');

const SECTION = '## Résumé\n\nTexte.\n\n## Revue adversariale\n\n- Sommet relu : `abc1234`\n';

test('exigeRevue : apps/, packages/ et scripts/ (seeds compris), pas la documentation', () => {
  assert.equal(exigeRevue(['apps/api/src/worker.module.ts']), true);
  assert.equal(exigeRevue(['docs/README.md', 'packages/shared-types/src/index.ts']), true);
  assert.equal(exigeRevue(['scripts/db/seed-ffsa.ts']), true);
  // `docs/agents/` et `.claude/skills/` l’exigent depuis 7.9.1 : test « la configuration que la chaîne exécute ou lit ».
  assert.equal(exigeRevue(['federations/ffsa/rules.json', 'docs/apps/note.md']), false);
  assert.equal(exigeRevue([]), false);
});

test('aSectionRevue : titre de section, quel que soit son niveau ou sa casse', () => {
  assert.equal(aSectionRevue(SECTION), true);
  assert.equal(aSectionRevue('### revue ADVERSARIALE\n'), true);
  assert.equal(aSectionRevue('## Revue adversariale — deux tours\n'), true);
  assert.equal(aSectionRevue('## Revue de ticket\n'), true);
});

test('aSectionRevue : la mention en texte ou dans un bloc de code ne compte pas', () => {
  assert.equal(aSectionRevue('Revue adversariale à faire.\n'), false);
  assert.equal(aSectionRevue('```markdown\n## Revue adversariale\n```\n'), false);
  assert.equal(aSectionRevue('## Revue adversariales ratées\n'), false);
  assert.equal(aSectionRevue(''), false);
  assert.equal(aSectionRevue(null), false);
});

test('motifSansRevue : code sans section refusé, code avec section ou doc seule acceptés', () => {
  assert.match(
    motifSansRevue({ corps: '## Résumé\n', fichiers: ['apps/api/src/a.ts'] }),
    /Revue adversariale/,
  );
  assert.equal(motifSansRevue({ corps: SECTION, fichiers: ['apps/api/src/a.ts'] }), null);
  assert.equal(motifSansRevue({ corps: '', fichiers: ['docs/README.md'] }), null);
});

test('CLI : fichiers sur l’entrée standard, corps en argument, sortie 1 et motif si non éligible', () => {
  const cli = fileURLToPath(new URL('./revue-exigee.mjs', import.meta.url));
  assert.equal(
    execFileSync('node', [cli, SECTION], { input: 'apps/api/src/a.ts\n' }).toString(),
    '',
  );
  assert.throws(
    () => execFileSync('node', [cli, '## Résumé'], { input: 'apps/api/src/a.ts\n', stdio: 'pipe' }),
    (e) => e.status === 1 && /Revue adversariale/.test(e.stdout.toString()),
  );
});

test('motifTitreSansCode : feat/fix/refactor/perf sans aucun fichier hors docs/ refusés (#844, #939)', () => {
  const ticket = ['docs/features/licences/all/issues/SPEC_ALL_LIC-17-formules.06.issue.md'];
  assert.match(
    motifTitreSansCode({
      titre: 'feat(club): éligibilité des formules (SPEC_ALL_LIC-17.06)',
      fichiers: ticket,
    }),
    /titre « feat » mais le diff ne contient que de la documentation \(1 fichier/,
  );
  assert.match(motifTitreSansCode({ titre: 'fix(web): x', fichiers: ticket }), /« fix »/);
  assert.match(motifTitreSansCode({ titre: 'refactor!: x', fichiers: ticket }), /« refactor »/);
  assert.match(motifTitreSansCode({ titre: 'perf(api): x', fichiers: ticket }), /« perf »/);
});

test('motifTitreSansCode : acceptés dès qu’un fichier hors docs/ est là, ou pour un autre type', () => {
  const ticket = ['docs/features/licences/all/issues/SPEC_ALL_LIC-17-formules.06.issue.md'];
  assert.equal(
    motifTitreSansCode({ titre: 'feat(club): x', fichiers: [...ticket, 'apps/api/src/a.ts'] }),
    null,
  );
  assert.equal(
    motifTitreSansCode({ titre: 'fix(sujet): x', fichiers: ['.claude/skills/sujet/sujet.sh'] }),
    null,
  );
  assert.equal(motifTitreSansCode({ titre: 'docs(licences): x', fichiers: ticket }), null);
  assert.equal(motifTitreSansCode({ titre: 'chore(seed): x', fichiers: ticket }), null);
  assert.equal(motifTitreSansCode({ titre: 'feat(docs): x', fichiers: ticket }), null);
  assert.equal(motifTitreSansCode({ titre: 'feat(club): x', fichiers: [] }), null);
  assert.equal(motifTitreSansCode({ titre: '', fichiers: ticket }), null);
});

test('CLI : le titre en troisième argument déclenche le refus d’un titre feat sur un diff docs seul', () => {
  const cli = fileURLToPath(new URL('./revue-exigee.mjs', import.meta.url));
  assert.throws(
    () =>
      execFileSync('node', [cli, '', 'feat(club): x'], {
        input: 'docs/features/a/b.md\n',
        stdio: 'pipe',
      }),
    (e) => e.status === 1 && /que de la documentation/.test(e.stdout.toString()),
  );
  assert.equal(
    execFileSync('node', [cli, '', 'docs(club): x'], {
      input: 'docs/features/a/b.md\n',
    }).toString(),
    '',
  );
});

// Un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne, git le cite entre guillemets même sous
// `core.quotePath=false` (`"apps/…"`) : il exige la revue comme le chemin nu.
test('exigeRevue : un chemin de code que git cite entre guillemets l’exige aussi', () => {
  for (const cite of ['"apps/api/migrations/2026\\"x.ts"', '"apps/api/migrations/2026\\\\x.ts"', '"scripts/verify/gate\\tx.mjs"', '"packages/a\\nb.ts"'])
    assert.equal(exigeRevue([cite]), true, cite);
  assert.equal(exigeRevue(['"docs/a\\"b.md"']), false);
});

// Ce que la chaîne exécute ou lit pour juger : la CI que la PR fait tourner, les hooks git joués chez le capitaine,
// la configuration de l'agent, ce que lit `pnpm install`, les configurations des outils des gates.
const CONFIGURATION = [
  '.github/workflows/ci.yml',
  '.github/actions/installer/action.yml',
  '.husky/pre-push',
  '.husky/commit-msg',
  '.claude/settings.json',
  '.claude/chaine.json',
  '.claude/rules/tests.md',
  '.claude/skills/x/SKILL.md',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  '.pnpmfile.cjs',
  '.nvmrc',
  'turbo.json',
  'tsconfig.base.json',
  'eslint.config.mjs',
  'vitest.config.ts',
  'playwright.config.ts',
  'commitlint.config.mjs',
  '.prettierrc',
  '.prettierignore',
  '.gitattributes',
  'docs/.gitattributes',
  'outils/x/package.json',
  'e2e/parcours.spec.ts',
  'docs/agents/evals-skills.md',
];
test('exigeRevue : la configuration que la chaîne exécute ou lit l’exige (CI, hooks git et d’agent, install, outils des gates)', () => {
  for (const f of CONFIGURATION) assert.equal(exigeRevue([f]), true, f);
  for (const f of ['README.md', 'CHANGELOG.md', 'GLOSSARY.md', 'docs/features/a/all/issues/SPEC_ALL_A-1-a.01.issue.md', 'docs/metier/regles/all/.gitkeep'])
    assert.equal(exigeRevue([f]), false, f);
  assert.match(motifSansRevue({ corps: '', fichiers: ['docs/a.md', '.github/workflows/ci.yml'] }), /\(\.github\/workflows\/ci\.yml\)/);
});

test('exigeRevue : la casse ne la contourne pas (Apps/, PACKAGES/, .GitHub/, Package.json)', () => {
  for (const f of ['Apps/api/x.ts', 'PACKAGES/a/b.ts', 'Scripts/verify/x.mjs', '.GitHub/workflows/ci.yml', '.Husky/pre-push', 'Package.json', 'outils/x/PACKAGE.JSON', '"Apps/a\\"b.ts"'])
    assert.equal(exigeRevue([f]), true, f);
  assert.equal(exigeRevue(['Docs/README.MD']), false);
});

// `ſ` (U+017F) se met en majuscule `S` : sur un système de fichiers qui replie la casse, `appſ/` est `apps/`.
test('exigeRevue : la casse se replie aussi par la majuscule (ſ lu s)', () => {
  for (const f of ['appſ/api/x.json', 'ſcripts/x.mjs']) assert.equal(exigeRevue([f]), true, f);
});

// Par l'espace de noms : sur une copie d'avant, sans `cheminLu`, ce seul test échoue.
const cheminLu = (ligne) => revueExigee.cheminLu(ligne);
test('cheminLu : décite un chemin comme git le cite, et une citation mal formée rend null', () => {
  assert.equal(cheminLu('"apps/a\\"b.ts"'), 'apps/a"b.ts');
  assert.equal(cheminLu('"docs/\\303\\251t\\303\\251.md"'), 'docs/été.md');
  assert.equal(cheminLu('"docs/a\\tb.md"'), 'docs/a\tb.md');
  assert.equal(cheminLu('Apps/X.ts'), 'apps/x.ts');
  for (const f of ['"docs/a.md', '"docs/a\\qb.md"', '"docs/a"b.md"', '"'])
    assert.equal(cheminLu(f), null, f);
  assert.equal(exigeRevue(['"docs/a.md']), true, 'mal formé : exigée');
});

// Monotonie : la règle de 7.9.0, recopiée ici, sur un corpus de chemins. Tout chemin qu’elle soumettait à la revue
// y reste soumis.
const AVANT = (f) => /^"?(apps|packages|scripts)\//.test(f.trim());
test('exigeRevue : rien de ce que la règle d’avant exigeait n’en est dispensé', () => {
  const prefixes = ['apps/', 'packages/', 'scripts/', '"apps/', '"packages/', '"scripts/', ' apps/', 'scripts/db/', 'docs/', '"docs/', 'apps', ''];
  const suites = ['x.ts', 'a\\"b.ts', '\\303\\251.ts', 'b.md', 'sous/c.json', '"', '\\q', 'x.ts"', '', 'db/seed.ts'];
  const corpus = [];
  for (const p of prefixes) for (const s of suites) corpus.push(p + s);
  // Tirage déterministe, sans dépendance : des chaînes faites des caractères qui comptent pour la règle.
  const alphabet = ['a', 'p', 's', '/', '"', '\\', '.', 'm', 'd', 'A', '3', '0', ' ', 'k', 'g'];
  let graine = 39;
  const tirer = (n) => ((graine = (graine * 1103515245 + 12345) % 2147483648), graine % n);
  for (let i = 0; i < 4000; i++) {
    const base = prefixes[tirer(prefixes.length)];
    let suite = '';
    for (let j = tirer(10); j > 0; j--) suite += alphabet[tirer(alphabet.length)];
    corpus.push(base + suite);
  }
  const exiges = corpus.filter(AVANT);
  assert.ok(exiges.length > 1000, `corpus trop pauvre : ${exiges.length}`);
  for (const f of exiges) assert.equal(exigeRevue([f]), true, JSON.stringify(f));
});

// Ce que l’agent lit pour travailler et pour relire : une PR de documentation ne doit pas affaiblir la revue suivante
// sans être revue.
test('exigeRevue : CLAUDE.md à toute profondeur, docs/agents/ et le fichier des critères l’exigent ; un index généré de docs/agents/ non', () => {
  for (const f of ['CLAUDE.md', 'docs/CLAUDE.md', 'Docs/Claude.MD', 'docs/agents/chaine-de-production.md', 'docs/agents/gabarits/ticket.issue.md', 'docs/agents/criteres-revue.md'])
    assert.equal(exigeRevue([f]), true, f);
  const base = { ...revueExigee.SANS_BASE, criteres: ['./docs/revue/criteres.md'], generes: ['docs/agents/couts.md'] };
  assert.equal(exigeRevue(['docs/revue/criteres.md'], base), true, 'fichier des critères déclaré');
  assert.equal(exigeRevue(['docs/revue/criteres.md']), false, 'sans base : le chemin par défaut seul');
  assert.equal(exigeRevue(['docs/agents/couts.md'], base), false, 'index généré : le capitaine le régénère');
  assert.equal(exigeRevue(['docs/agents/couts.md']), true, 'sans base, aucun index connu');
  for (const f of ['README.md', 'CHANGELOG.md', 'docs/README.md', 'docs/generes/a.json']) assert.equal(exigeRevue([f], base), false, f);
});

test('exigeRevue : un chemin sensible du projet, lu dans la base, l’exige ; un contrat de base illisible l’exige pour tout chemin', () => {
  const base = { ...revueExigee.SANS_BASE, sensibles: ['infra/**', 'federations/*/droits.json'] };
  for (const f of ['infra/main.tf', 'Infra/Main.tf', '"infra/a\\"b.tf"', 'federations/x/droits.json']) assert.equal(exigeRevue([f], base), true, f);
  assert.equal(exigeRevue(['federations/x/regles.json'], base), false);
  assert.equal(exigeRevue(['infra/main.tf']), false, 'sans base : le plancher seul');
  const illisible = { ...revueExigee.SANS_BASE, illisible: 'contrat de origin/develop illisible (x)' };
  assert.equal(exigeRevue(['docs/README.md'], illisible), true);
  assert.match(motifSansRevue({ corps: '', fichiers: ['docs/README.md'], base: illisible }), /contrat de origin\/develop illisible/);
});

// Posé dans un projet, le gate est dans scripts/verify/ ; dans le plugin, le dépôt jouet du skill tickets le pose.
const GATE_POSE = new URL('../verify/tickets-regles.mjs', import.meta.url);
const chargerGate = existsSync(GATE_POSE)
  ? () => import(GATE_POSE.href)
  : async () => (await import('../../tickets/references/scripts/docs/depot-jouet.mjs')).module('verify/tickets-regles.mjs');
test('parité : un chemin sensible de la base se lit comme le gate (motifSensibleTouche)', async () => {
  const gate = await chargerGate();
  const table = [
    ['src/paiement/*webhook*', 'src/paiement/stripe-webhook.json'],
    ['src/paiement/*webhook*', 'src/paiement/sous/webhook.json'],
    ['**/auth/**', 'auth/a.json'],
    ['**/auth/**', 'src/authz/a.json'],
    ['src/paiement/', 'src/paiement/relevé de compte.json'],
    ['src/*.pem', 'src/sous/cle.pem'],
    ['src/a.b+c(d).json', 'src/a.b+c(d).json'],
    ['src/a.b+c(d).json', 'src/aXb+c(d).json'],
  ];
  for (const [motif, chemin] of table) {
    const base = { ...revueExigee.SANS_BASE, sensibles: [motif] };
    assert.equal(exigeRevue([chemin], base), gate.motifSensibleTouche(chemin, [motif]) !== null, `${motif} / ${chemin}`);
  }
});

// La CLI lit le contrat sur la base nommée, jamais dans l’arbre de travail (la PR) : une PR qui retire son chemin
// sensible de chaine.json, ou y renomme le fichier des critères, l’exige encore.
test('CLI : le contrat se lit dans la base ; une PR qui retire son chemin sensible de chaine.json l’exige encore', () => {
  const { dossierTemporaire } = jouet;
  const d = dossierTemporaire('revue-base-');
  const env = {
    ...jouet.environnementDeBanc(),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 't',
    GIT_AUTHOR_EMAIL: 't@example.org',
    GIT_COMMITTER_NAME: 't',
    GIT_COMMITTER_EMAIL: 't@example.org',
  };
  const git = (...a) => execFileSync('git', a, { cwd: d, env, encoding: 'utf8' });
  const contrat = (c) => {
    mkdirSync(join(d, '.claude'), { recursive: true });
    writeFileSync(join(d, '.claude/chaine.json'), JSON.stringify(c));
  };
  git('init', '-q', '-b', 'develop');
  contrat({ cheminsSensibles: ['infra/**'], criteresRevue: 'docs/revue/criteres.md' });
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  git('switch', '-q', '-c', 'pr');
  contrat({ cheminsSensibles: [], criteresRevue: 'docs/autre.md' });
  git('add', '-A');
  git('commit', '-q', '-m', 'retire infra');
  const cli = fileURLToPath(new URL('./revue-exigee.mjs', import.meta.url));
  const lancer = (entree, ...base) => spawnSync('node', [cli, '', '', ...base], { cwd: d, env, input: entree, encoding: 'utf8' });
  for (const f of ['infra/main.tf', 'docs/revue/criteres.md']) {
    const r = lancer(`${f}\n`, 'develop');
    assert.equal(r.status, 1, `${f} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, new RegExp(f.replace(/[./\\]/g, '\\$&')), f);
  }
  assert.equal(lancer('docs/autre.md\n', 'develop').status, 0, 'le fichier des critères de la PR ne compte pas');
  assert.equal(lancer('infra/main.tf\n').status, 0, 'sans base : le plancher seul');
  const introuvable = lancer('docs/README.md\n', 'nulle-part');
  assert.equal(introuvable.status, 1, 'base introuvable : la revue est exigée');
  assert.match(introuvable.stdout, /contrat de nulle-part illisible/);
});

// Une configuration d’outil lue par dossier (lint-staged, Prettier, ESLint prennent la plus proche) et tout fichier
// de code exécutable, à toute profondeur : le capitaine les exécute à son pre-commit, même sous docs/.
test('exigeRevue : un fichier exécutable et un nom de configuration l’exigent à toute profondeur ; le Markdown de docs/ non', () => {
  for (const f of ['docs/prettier.config.mjs', 'docs/lint-staged.config.mjs', 'docs/x/eslint.config.mjs', 'infra/deploy.sh', 'tools/x.mjs', 'docs/design/proto/capture.mjs', 'docs/x/lintstagedrc', 'docs/x/prettierrc.json', 'outils/a.PY', 'docs/package.yaml', 'docs/package.yml', 'docs/x/package.json5'])
    assert.equal(exigeRevue([f]), true, f);
  for (const f of ['docs/a.md', 'docs/design/proto/ecran.html', 'docs/sources/note.txt']) assert.equal(exigeRevue([f]), false, f);
});

test('exigeRevue : CLAUDE.local.md à toute profondeur l’exige', () => {
  for (const f of ['CLAUDE.local.md', 'docs/CLAUDE.local.md', 'apps/web/Claude.Local.md']) assert.equal(exigeRevue([f]), true, f);
});

// macOS écrit souvent les noms en NFD : un motif écrit en NFC (ou l’inverse) touche le même chemin.
test('exigeRevue : un chemin sensible en NFD touche son motif en NFC, et l’inverse', () => {
  const nfc = 'src/paiement/réglé.json'.normalize('NFC');
  const nfd = 'src/paiement/réglé.json'.normalize('NFD');
  assert.notEqual(nfc, nfd);
  assert.equal(exigeRevue([nfd], { ...revueExigee.SANS_BASE, sensibles: [nfc] }), true, 'chemin NFD, motif NFC');
  assert.equal(exigeRevue([nfc], { ...revueExigee.SANS_BASE, sensibles: [nfd] }), true, 'chemin NFC, motif NFD');
});

// L’exception d’index de docs/agents/ ne vaut que pour une entrée littérale qui a une `commande`.
test('lireBase : seul un index littéral à commande sort de docs/agents/ ; chaîne nue et motif l’exigent', () => {
  const lire = (ref, chemin) =>
    chemin === 'scripts/docs/index-generes.json'
      ? JSON.stringify({ index: [{ chemin: 'docs/agents/couts.md', commande: 'node x.mjs' }, 'docs/agents/nu.md', { chemin: 'docs/agents/*.json', commande: 'node y.mjs' }, { chemin: 'docs/agents/sans.md' }] })
      : null;
  const base = revueExigee.lireBase('origin/develop', lire);
  assert.equal(base.illisible, null);
  assert.equal(exigeRevue(['docs/agents/couts.md'], base), false, 'littéral à commande');
  for (const f of ['docs/agents/nu.md', 'docs/agents/a.json', 'docs/agents/sans.md']) assert.equal(exigeRevue([f], base), true, f);
  // L'exception est le chemin exact (NFC), sans repli de casse : un autre fichier qui se replie dessus l'exige.
  for (const f of ['docs/agents/COUTS.md', 'docs/agents/Couts.md', 'docs/agents/coutſ.md']) assert.equal(exigeRevue([f], base), true, f);
  assert.equal(exigeRevue(['docs/agents/COUTS.md', 'docs/agents/couts.md'], base), true);
});

// Un sujet en retard sur develop : le contrat de develop s’ajoute au sien.
test('lireBase : une base de sujet ajoute le contrat d’origin/develop (sujet en retard)', () => {
  const contrats = {
    'origin/sujet/lot': JSON.stringify({ cheminsSensibles: ['lot/**'] }),
    'origin/develop': JSON.stringify({ cheminsSensibles: ['infra/**'], criteresRevue: 'docs/revue/criteres.md' }),
  };
  const lire = (ref, chemin) => (chemin === '.claude/chaine.json' ? contrats[ref] ?? null : null);
  const base = revueExigee.lireBase('origin/sujet/lot', lire);
  for (const f of ['infra/main.tf', 'lot/a.txt', 'docs/revue/criteres.md']) assert.equal(exigeRevue([f], base), true, f);
  assert.equal(exigeRevue(['infra/main.tf'], revueExigee.lireBase('origin/autre', lire)), false, 'une autre base que sujet/ : la sienne seule');
  const casse = revueExigee.lireBase('origin/sujet/lot', (ref, chemin) => (ref === 'origin/develop' ? '{illisible' : lire(ref, chemin)));
  assert.match(casse.illisible ?? '', /origin\/develop/);
});

// Un nom de fichier peut porter un saut de ligne, `\r`, U+2028 ou U+2029 (git les cite : "x\ny", "\342\200\250") : `.` ne les
// franchit pas sans le drapeau `s`, et le chemin échapperait au motif sensible, donc à la revue.
test('exigeRevue : un chemin décité qui porte un saut de ligne ou U+2028 touche encore son motif sensible', async () => {
  const gate = await chargerGate();
  const cas = [
    ['**/secret/**', '"x\\ny/secret/k.md"', 'x\ny/secret/k.md'],
    ['src/auth/**', '"src/auth/a\\nb.md"', 'src/auth/a\nb.md'],
    ['src/auth/**', '"src/auth/a\\rb.md"', 'src/auth/a\rb.md'],
    ['**/secret/**', '"x\\342\\200\\250y/secret/k.md"', 'x y/secret/k.md'],
    ['**/secret/**', '"x\\342\\200\\251y/secret/k.md"', 'x y/secret/k.md'],
  ];
  for (const [motif, cite, brut] of cas) {
    const base = { ...revueExigee.SANS_BASE, sensibles: [motif] };
    assert.equal(exigeRevue([cite], base), true, `${motif} / ${JSON.stringify(brut)}`);
    assert.equal(gate.motifSensibleTouche(brut, [motif]), motif, `gate : ${motif} / ${JSON.stringify(brut)}`);
  }
  assert.equal(exigeRevue(['".github/workflows/x\\342\\200\\250.yml"']), true, 'CI avec U+2028 dans le nom');
});

// ——— Ticket 18 : la ligne « /security-review : lancée » sur une PR qui touche un chemin sensible ————————————————
const INFRA = { sensibles: ['infra/**'], criteres: ['docs/agents/criteres-revue.md'], generes: [], illisible: null };
const REVUE_SANS = '## Résumé\n\nx\n\n## Revue de ticket\n\n- Sommet relu : `abc1234`\n- Écarts : aucun\n';
const avecLigne = (ligne, titre = '## Revue de ticket') => `## Résumé\n\nx\n\n${titre}\n\n- Sommet relu : \`abc1234\`\n${ligne}\n- Écarts : aucun\n\n## Sécurité\n\nRAS\n`;
const LIGNE = '- `/security-review` : lancée (chemins : infra/main.tf)';

test('ticket 18 : chemin sensible sans la ligne /security-review : lancée dans la section de revue : refusée ; avec elle : éligible', () => {
  const motif = revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: ['infra/main.tf'], base: INFRA });
  assert.match(motif ?? '', /section de revue sans la ligne « \/security-review : lancée » alors que la PR touche un chemin sensible \(infra\/main\.tf\)/);
  assert.match(motif, /lancer la skill \/security-review sur ce sommet, puis écrire la ligne dans la section/);
  assert.equal(revueExigee.motifSansSecurite({ corps: avecLigne(LIGNE), fichiers: ['infra/main.tf'], base: INFRA }), null);
  // Les variantes d'espaces, de puce, de casse, d'accents graves et de ponctuation finale que les sessions écrivent.
  for (const ligne of [
    '- `/security-review` : lancée',
    '- `/security-review`: lancée.',
    '- `/security-review`\u00a0: lancée (chemins : infra/**)',
    '- `/security-review`\u202f:\u00a0lancée ; deux constats',
    '* /security-review : lancée, chemins : infra/',
    '+ `/security-review` :   Lancée',
    '  - `/SECURITY-REVIEW` : LANCÉE',
    '- `/security-review` : lance\u0301e (NFD)',
    '- `/security-review` : lancée !',
  ])
    assert.equal(revueExigee.motifSansSecurite({ corps: avecLigne(ligne), fichiers: ['infra/main.tf'], base: INFRA }), null, ligne);
});

test('ticket 18 : « non requise », une ligne hors de la section ou dans un bloc de code ne comptent pas ; la ligne d’une section « Revue adversariale » compte', () => {
  const refusee = (corps, contexte) => assert.notEqual(revueExigee.motifSansSecurite({ corps, fichiers: ['infra/main.tf'], base: INFRA }), null, contexte);
  refusee(avecLigne('- `/security-review` : non requise'), 'non requise');
  refusee(avecLigne('- `/security-review` : lancéeX'), 'mot collé');
  refusee(avecLigne('- `/security-review` : à lancer'), 'à lancer');
  refusee(avecLigne('`/security-review` : lancée'), 'sans puce');
  refusee(`${REVUE_SANS}\n## Sécurité\n\n${LIGNE}\n`, 'dans la section suivante de même niveau');
  refusee(`## Résumé\n\n${LIGNE}\n\n${REVUE_SANS}`, 'avant la section');
  refusee(`# Titre\n\n## Revue de ticket\n\nx\n\n# Annexe\n\n${LIGNE}\n`, 'après un titre de niveau supérieur');
  refusee(avecLigne(`\`\`\`markdown\n${LIGNE}\n\`\`\``), 'bloc de code');
  refusee(avecLigne(`~~~\n${LIGNE}\n~~~`), 'bloc de code ~~~');
  refusee(`## Revue de ticket\n\n\`\`\`\n## Autre\n\`\`\`\n\n## Sécurité\n\n${LIGNE}\n`, 'un titre dans un bloc ne ferme pas la section, et la ligne reste hors');
  assert.equal(revueExigee.motifSansSecurite({ corps: avecLigne(LIGNE, '## Revue adversariale'), fichiers: ['infra/main.tf'], base: INFRA }), null);
  assert.equal(revueExigee.motifSansSecurite({ corps: `## Revue de ticket\n\n### Axe Règles\n\nx\n\n${LIGNE}\n`, fichiers: ['infra/main.tf'], base: INFRA }), null, 'sous-section plus profonde');
});

test('ticket 18 : sans chemin sensible, rien n’est exigé ; base illisible : la ligne est exigée ; un chemin NFD ou d’une autre casse touche son motif', () => {
  assert.equal(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: ['apps/api/src/a.ts', 'docs/a.md'], base: INFRA }), null);
  assert.equal(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: ['infra/main.tf'] }), null, 'sans base : aucun chemin sensible');
  assert.equal(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: ['infra/main.tf'], base: { ...INFRA, sensibles: [] } }), null, 'contrat sans chemins sensibles');
  assert.equal(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: [], base: INFRA }), null);
  const illisible = { ...revueExigee.SANS_BASE, illisible: 'contrat de origin/develop illisible (x)' };
  assert.match(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: ['docs/a.md'], base: illisible }) ?? '', /chemin sensible \(docs\/a\.md/);
  assert.equal(revueExigee.motifSansSecurite({ corps: avecLigne(LIGNE), fichiers: ['docs/a.md'], base: illisible }), null);
  const accents = { ...INFRA, sensibles: ['données/**'] };
  for (const f of ['donne\u0301es/a.json', 'DONNÉES/a.json', 'Infra/Main.tf'])
    assert.notEqual(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: [f], base: f.startsWith('Infra') ? INFRA : accents }), null, f);
  assert.notEqual(revueExigee.motifSansSecurite({ corps: REVUE_SANS, fichiers: ['"docs/a\\qb"'], base: INFRA }), null, 'citation mal formée : exigée, comme cheminExige');
});

test('ticket 18 : la CLI renvoie le motif de la ligne après celui de la section, et avant celui du titre', () => {
  const d = jouet.dossierTemporaire('revue-securite-');
  const env = { ...jouet.environnementDeBanc(), GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.org', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.org' };
  const git = (...a) => execFileSync('git', a, { cwd: d, env, encoding: 'utf8' });
  git('init', '-q', '-b', 'develop');
  mkdirSync(join(d, '.claude'), { recursive: true });
  writeFileSync(join(d, '.claude/chaine.json'), JSON.stringify({ cheminsSensibles: ['infra/**'] }));
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  const cli = fileURLToPath(new URL('./revue-exigee.mjs', import.meta.url));
  const lancer = (corps, titre, fichiers = 'infra/main.tf\n') => spawnSync('node', [cli, corps, titre, 'develop'], { cwd: d, env, input: fichiers, encoding: 'utf8' });
  const sansSection = lancer('## Résumé\n', 'fix: x');
  assert.equal(sansSection.status, 1);
  assert.match(sansSection.stdout, /sans section « Revue de ticket »/, 'sans section : le motif de la section d’abord');
  const sansLigne = lancer(REVUE_SANS, 'fix: x');
  assert.equal(sansLigne.status, 1);
  assert.match(sansLigne.stdout, /sans la ligne « \/security-review : lancée »/);
  // Un titre qui annonce du code sur un diff docs seul : le chemin sensible sous docs/ reçoit d'abord le motif de la ligne.
  writeFileSync(join(d, '.claude/chaine.json'), JSON.stringify({ cheminsSensibles: ['docs/securite/**'] }));
  git('commit', '-q', '-am', 'docs sensibles');
  const avantTitre = lancer(REVUE_SANS, 'feat: x', 'docs/securite/a.md\n');
  assert.equal(avantTitre.status, 1);
  assert.match(avantTitre.stdout, /sans la ligne « \/security-review : lancée »/, 'la ligne avant le titre');
  const titre = lancer(avecLigne(LIGNE), 'feat: x', 'docs/securite/a.md\n');
  assert.equal(titre.status, 1);
  assert.match(titre.stdout, /titre « feat »/, 'la ligne présente : le motif du titre');
  assert.equal(lancer(avecLigne(LIGNE), 'docs: x', 'docs/securite/a.md\n').status, 0);
});

test('ticket 18 (contre-relecture) : un gabarit recopié sans choisir, ou la ligne dans un commentaire HTML, ne comptent pas', () => {
  const refusee = (corps, contexte) => assert.notEqual(revueExigee.motifSansSecurite({ corps, fichiers: ['infra/main.tf'], base: INFRA }), null, contexte);
  refusee(avecLigne('- `/security-review` : lancée (chemins : …) | non requise'), 'gabarit recopié tel quel');
  refusee(avecLigne('- `/security-review` : lancée (chemins : infra/main.tf) | non requise'), 'les deux branches laissées');
  refusee(avecLigne('- `/security-review` : lancée (chemins : …)'), 'chemins non remplis');
  refusee(avecLigne('- `/security-review` : lancée (chemins : ...)'), 'chemins non remplis, trois points');
  refusee(avecLigne(`<!-- ${LIGNE} -->`), 'commentaire HTML sur une ligne');
  refusee(avecLigne(`<!--\n${LIGNE}\n-->`), 'commentaire HTML sur plusieurs lignes');
  refusee(avecLigne(`<!--\n${LIGNE}`), 'commentaire HTML non fermé');
  assert.equal(revueExigee.motifSansSecurite({ corps: avecLigne(`<!-- note -->\n${LIGNE}`), fichiers: ['infra/main.tf'], base: INFRA }), null, 'après un commentaire fermé');
  assert.equal(revueExigee.motifSansSecurite({ corps: avecLigne(`${LIGNE} <!-- relue -->`), fichiers: ['infra/main.tf'], base: INFRA }), null, 'commentaire après la ligne');
});

test('ticket 18 (contre-relecture) : des points de suspension dans la prose comptent ; une parenthèse de chemins vide, laissée en …, ou « / non requise » ne comptent pas', () => {
  const avec = (ligne) => revueExigee.motifSansSecurite({ corps: avecLigne(ligne), fichiers: ['infra/main.tf'], base: INFRA });
  for (const ligne of [
    '- `/security-review` : lancée (chemins : infra/main.tf) — rien à signaler...',
    '- `/security-review` : lancée (chemins : infra/main.tf) — rien à signaler…',
    '- `/security-review` : lancée… deux constats corrigés',
    '- `/security-review` : lancée, chemins infra/**, rien...',
  ])
    assert.equal(avec(ligne), null, ligne);
  for (const ligne of [
    '- `/security-review` : lancée (chemins : )',
    '- `/security-review` : lancée (chemins :)',
    '- `/security-review` : lancée (chemins : … )',
    '- `/security-review` : lancée (chemins : infra/main.tf, ...)',
    '- `/security-review` : lancée (chemins : infra/main.tf) / non requise',
    '- `/security-review` : lancée / non requise',
    '- `/security-review` : lancée | non requise',
  ])
    assert.notEqual(avec(ligne), null, ligne);
});

test('ticket 18 (CodeQL) : un commentaire HTML imbriqué ou recollé ne cache ni ne fabrique la ligne ; deux commentaires de suite puis la vraie ligne comptent', () => {
  const avec = (corps) => revueExigee.motifSansSecurite({ corps: avecLigne(corps), fichiers: ['infra/main.tf'], base: INFRA });
  for (const corps of [
    '<!<!-- x -->-- - `/security-review` : lancée -->',
    '<!<!-- x -->--\n- `/security-review` : lancée\n-->',
    '<!-<!-- x -->- a -->\n<!<!-- y -->-- b\n- `/security-review` : lancée\n-->',
  ])
    assert.notEqual(avec(corps), null, JSON.stringify(corps));
  for (const corps of [
    `<!-- a --><!-- b -->\n${LIGNE}`,
    `<!-- a --><!-- b -->${LIGNE}`,
    `${LIGNE} <!-- a --><!-- b -->`,
    `<!-- a\nb --> <!-- c -->\n${LIGNE}`,
  ])
    assert.equal(avec(corps), null, JSON.stringify(corps));
});
