// Check `PR titre` (pr-titre.mjs, ticket 16) sur le dépôt jouet du skill `sujet` : il juge comme le capitaine, avec
// ses fonctions (`revue-exigee.mjs`, `sujet.sh a-juger`, `sujet.sh est-livraison`). Aucun réseau : le faux `pnpm` du
// jouet tient lieu de commitlint.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Posé dans un projet, le dépôt jouet est dans scripts/chaine/ ; dans le plugin, dans le skill sujet.
const PROJET = existsSync(new URL('../chaine/depot-jouet.mjs', import.meta.url));
const { depotJouet, script, dossierTemporaire } = await import(
  PROJET ? '../chaine/depot-jouet.mjs' : '../../../../sujet/scripts/depot-jouet.mjs'
);
const CHECK = fileURLToPath(new URL('./pr-titre.mjs', import.meta.url));
const REVUE_CLI = script('fusionner', 'revue-exigee.mjs');
const REVUE = '## Résumé\n\nx\n\n## Revue de ticket\n\n- Sommet relu : `abc1234`\n- Écarts : aucun\n';
const CONFORME = /Titre et description conformes : le capitaine les acceptera\./;

/** Joue le check dans le clone de travail du jouet ; `ci` : GITHUB_ACTIONS=true. `null` retire la variable. */
function check(d, entrees, { ci = false, script: chemin = CHECK } = {}) {
  const env = { ...d.env, GITHUB_ACTIONS: ci ? 'true' : '' };
  for (const v of ['PR_TITRE', 'PR_NUMERO', 'PR_BASE', 'PR_TETE', 'PR_SOMMET', 'PR_CORPS', 'PR_OUVERTE']) delete env[v];
  if (!ci) delete env.GITHUB_ACTIONS;
  const valeurs = { PR_NUMERO: '12', PR_CORPS: '', ...entrees };
  for (const [v, x] of Object.entries(valeurs)) if (x !== null) env[v] = x;
  return spawnSync(process.execPath, [chemin], { cwd: d.travail, env, encoding: 'utf8' });
}
const motifs = (r) => r.stderr.split('\n').filter((l) => l.startsWith('✗ ')).map((l) => l.slice(2));

/** Le motif que la CLI du capitaine écrit pour ces fichiers, ce corps et ce titre (passer.sh : base origin/develop). */
function motifCapitaine(d, fichiers, corps, titre, base = 'origin/develop') {
  const r = spawnSync(process.execPath, [REVUE_CLI, corps, titre, base], { cwd: d.travail, env: d.env, input: fichiers, encoding: 'utf8' });
  return r.stdout.trim();
}

/** Faux pnpm dont commitlint refuse un titre hors Conventional Commits, et qui journalise chaque appel. */
function pnpmCommitlint(d) {
  const f = join(d.racine, 'bin', 'pnpm');
  writeFileSync(
    f,
    `#!/bin/sh
echo "pnpm $*" >> ${JSON.stringify(join(d.racine, 'faux-gh', 'pnpm.log'))}
case "$1 $2" in
  "exec commitlint") awk 'NR == 1 { l = $0 } END { exit !(l ~ /^[a-z]+(\\([^)]*\\))?!?: /) }' ;;
  *) cat > /dev/null ;;
esac
`,
  );
  chmodSync(f, 0o755);
}
const pnpmJoue = (d) => {
  const f = join(d.racine, 'faux-gh', 'pnpm.log');
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};

test('PR vers develop : du code sans section de revue est refusé avec le motif exact du capitaine ; avec la section, conforme ; de la documentation seule, conforme', () => {
  const d = depotJouet();
  const sommet = d.branche('feat/x', 'origin/develop', { 'apps/x.ts': 'export const x = 1;\n' }, 'feat: x');
  const entrees = { PR_TITRE: 'feat(demo): x', PR_BASE: 'develop', PR_TETE: 'feat/x', PR_SOMMET: sommet };
  const refus = check(d, entrees);
  assert.equal(refus.status, 1, refus.stdout + refus.stderr);
  const attendu = motifCapitaine(d, 'apps/x.ts\n', '', 'feat(demo): x');
  assert.match(attendu, /sans section « Revue de ticket »/);
  assert.deepEqual(motifs(refus), [attendu], 'le motif, au caractère près, celui de la CLI du capitaine');
  assert.doesNotMatch(refus.stdout, CONFORME);
  const revue = check(d, { ...entrees, PR_CORPS: REVUE });
  assert.equal(revue.status, 0, revue.stdout + revue.stderr);
  assert.match(revue.stdout, CONFORME);
  const doc = d.branche('docs/y', 'origin/develop', { 'docs/y.md': 'y\n' }, 'docs: y');
  const r = check(d, { PR_TITRE: 'docs(demo): y', PR_BASE: 'develop', PR_TETE: 'docs/y', PR_SOMMET: doc });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, CONFORME);
});

test('régime 8 (lot 5a) : la base porte la clé `relecture` et la PR est ouverte après `depuis` : du code sans section de revue est conforme, le titre de code sur la documentation reste refusé ; ouverte avant, régime 7 ; clé mal formée ou date absente : 3', () => {
  const d = depotJouet();
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ cheminsSensibles: ['apps/**'], relecture: { depuis: '2026-11-17T09:00:00Z' } })}\n`);
  d.commit('chore: contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const sommet = d.branche('feat/x', 'origin/develop', { 'apps/x.ts': 'export const x = 1;\n' }, 'feat: x');
  const entrees = { PR_TITRE: 'feat(demo): x', PR_BASE: 'develop', PR_TETE: 'feat/x', PR_SOMMET: sommet };
  const huit = check(d, { ...entrees, PR_OUVERTE: '2026-11-17T11:00:00Z' });
  assert.equal(huit.status, 0, huit.stdout + huit.stderr);
  assert.match(huit.stdout, /régime 8 : la relecture se lit dans le verdict/);
  assert.match(huit.stdout, CONFORME);
  const sept = check(d, { ...entrees, PR_OUVERTE: '2026-11-17T08:00:00Z' });
  assert.equal(sept.status, 1, sept.stdout + sept.stderr);
  assert.match(motifs(sept)[0], /sans section « Revue de ticket »/);
  const doc = d.branche('docs/y', 'origin/develop', { 'docs/y.md': 'y\n' }, 'docs: y');
  const titre = check(d, { PR_TITRE: 'feat(demo): y', PR_BASE: 'develop', PR_TETE: 'docs/y', PR_SOMMET: doc, PR_OUVERTE: '2026-11-17T11:00:00Z' });
  assert.equal(titre.status, 1, titre.stdout + titre.stderr);
  assert.match(motifs(titre)[0], /mais le diff ne contient que de la documentation/);
  const sansDate = check(d, entrees);
  assert.equal(sansDate.status, 3, sansDate.stdout + sansDate.stderr);
  assert.match(sansDate.stderr, /le régime ne se lit pas \(date d'ouverture de la PR illisible/);
  d.git('switch', '-q', 'develop');
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ relecture: { depuis: 'hier' } })}\n`);
  d.commit('chore: clé mal formée');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  const mal = check(d, { ...entrees, PR_OUVERTE: '2026-11-17T11:00:00Z' });
  assert.equal(mal.status, 3, mal.stdout + mal.stderr);
  assert.match(mal.stderr, /clé relecture de origin\/develop:\.claude\/chaine\.json mal formée/);
});

test('sujet du squash à plus de 120 caractères : refusé ; titre de code sur un diff de documentation seule : refusé', () => {
  const d = depotJouet();
  const doc = d.branche('docs/y', 'origin/develop', { 'docs/y.md': 'y\n' }, 'docs: y');
  const long = `docs(demo): ${'é'.repeat(103)}`; // 115 caractères, 121 avec « (#12) »
  const r = check(d, { PR_TITRE: long, PR_BASE: 'develop', PR_TETE: 'docs/y', PR_SOMMET: doc });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.deepEqual(motifs(r), ['sujet du squash à 121 caractères (> 120) : raccourcir le titre de la PR']);
  const juste = check(d, { PR_TITRE: long.slice(0, -1), PR_BASE: 'develop', PR_TETE: 'docs/y', PR_SOMMET: doc });
  assert.equal(juste.status, 0, '120 caractères passent : ' + juste.stderr);
  const feat = check(d, { PR_TITRE: 'feat(demo): y', PR_BASE: 'develop', PR_TETE: 'docs/y', PR_SOMMET: doc });
  assert.equal(feat.status, 1, feat.stdout + feat.stderr);
  assert.deepEqual(motifs(feat), [motifCapitaine(d, 'docs/y.md\n', '', 'feat(demo): y')]);
  assert.match(motifs(feat)[0], /titre « feat » mais le diff ne contient que de la documentation/);
});

test('sous-PR : titre refusé par commitlint, refusé ; PR vers develop : commitlint n’est pas joué', () => {
  const d = depotJouet();
  d.branche('sujet/lot', 'origin/develop', { 'docs/lot.md': 'lot\n' }, 'docs: lot');
  const sous = d.branche('docs/sous', 'origin/sujet/lot', { 'docs/sous.md': 's\n' }, 'docs: sous');
  pnpmCommitlint(d);
  const refus = check(d, { PR_TITRE: 'Mise à jour de la doc', PR_BASE: 'sujet/lot', PR_TETE: 'docs/sous', PR_SOMMET: sous });
  assert.equal(refus.status, 1, refus.stdout + refus.stderr);
  assert.deepEqual(motifs(refus), ['titre refusé par commitlint (Conventional Commits) : Mise à jour de la doc']);
  assert.match(pnpmJoue(d), /pnpm exec commitlint/);
  const bon = check(d, { PR_TITRE: 'docs(lot): sous', PR_BASE: 'sujet/lot', PR_TETE: 'docs/sous', PR_SOMMET: sous });
  assert.equal(bon.status, 0, bon.stdout + bon.stderr);
  // Vers develop, le même titre passe : passer.sh ne joue pas commitlint, et le check ne refuse pas plus que lui.
  const avant = pnpmJoue(d);
  const develop = check(d, { PR_TITRE: 'Mise à jour de la doc', PR_BASE: 'develop', PR_TETE: 'docs/sous', PR_SOMMET: sous });
  assert.equal(develop.status, 0, develop.stdout + develop.stderr);
  assert.equal(pnpmJoue(d), avant, 'aucun appel à pnpm vers develop');
});

// PR de réception de develop dans un sujet, telle que le skill sujet la décrit (« Recevoir develop dans un sujet »),
// sur le modèle de `miseAJour` de sujet-fusionner.test.mjs : le sujet et develop changent `docs/f.md` et l'index
// généré ; develop apporte `apps/a.ts`. `retouches(d)` agit après la fusion, `secondeFusion` fusionne develop encore.
const ADR = 'docs/adr';
const index = (...adr) => adr.map((f) => `- ${f}\n`).join('');
function reception({ sujetEnPlus = {}, retouches = () => {} } = {}) {
  const d = depotJouet();
  d.ecrire('docs/f.md', '0\n');
  d.commit('docs: base');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  d.branche('sujet/lot', 'origin/develop', {
    'docs/f.md': 'sujet\n',
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: '# 3\n',
    [`${ADR}/README.md`]: index('ADR_ALL_ARC-3-c.md'),
    ...sujetEnPlus,
  }, 'feat: sujet avance');
  d.branche('develop', 'origin/develop', {
    'docs/f.md': 'develop\n',
    'apps/a.ts': 'export const a = 1;\n',
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: '# 2\n',
    [`${ADR}/README.md`]: index('ADR_ALL_ARC-2-b.md'),
  }, 'feat: develop avance');
  d.git('switch', '-q', '-C', 'maj/lot', 'origin/sujet/lot');
  const m = spawnSync('git', ['merge', '-q', '--no-edit', 'origin/develop'], { cwd: d.travail, env: d.env, encoding: 'utf8' });
  assert.equal(m.status, 1, 'conflit attendu : ' + m.stdout + m.stderr);
  d.ecrire('docs/f.md', 'résolu\n');
  d.ecrire(`${ADR}/README.md`, index('ADR_ALL_ARC-3-c.md'));
  d.git('add', '-A');
  d.git('commit', '-q', '--no-edit');
  retouches(d);
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/maj/lot');
  d.git('fetch', '-q', 'origin');
  const sommet = d.git('rev-parse', 'HEAD');
  d.git('switch', '-q', '--detach', 'origin/develop');
  return { d, sommet, entrees: { PR_TITRE: 'chore(sujet): met lot à jour avec develop', PR_BASE: 'sujet/lot', PR_TETE: 'maj/lot', PR_SOMMET: sommet } };
}
const NON_FORMATE = { 'apps/s.ts': 'export const s = "x";  \n' };
const formate = (d) => {
  d.ecrire('apps/s.ts', "export const s = 'x';\n");
  d.commit('style: formate avec Prettier 3.9.10');
};

test('PR de réception sans conflit de code ni retouche de code : conforme sans section de revue', () => {
  const { d, sommet, entrees } = reception();
  // Le diff base...tête compte le code que develop apporte : c'est ce que le check ne doit pas lire (A6).
  assert.match(d.git('diff', '--name-only', `origin/sujet/lot...${sommet}`), /^apps\/a\.ts$/m);
  const r = check(d, entrees);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, CONFORME);
});

test('PR de réception avec une retouche de formatage sous apps/ : refusée sans section de revue, conforme avec', () => {
  const { d, entrees } = reception({ sujetEnPlus: NON_FORMATE, retouches: formate });
  const refus = check(d, entrees);
  assert.equal(refus.status, 1, refus.stdout + refus.stderr);
  assert.equal(motifs(refus).length, 1, refus.stderr);
  assert.match(motifs(refus)[0], /sans section « Revue de ticket » ni « Revue adversariale ».*\(apps\/s\.ts\)/);
  assert.doesNotMatch(refus.stderr, /apps\/a\.ts/, 'le develop apporté n’est jamais jugé');
  const r = check(d, { ...entrees, PR_CORPS: `Met lot à jour.\n\n${REVUE}` });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// Contre-relecture A : le capitaine juge la résolution seule avant les checks, puis l'union avec les retouches. Une
// résolution de documentation seule sous un titre `fix` est refusée par lui (titre de code sur de la documentation),
// même quand une retouche apporte du code : le check doit la refuser de même.
test('PR de réception titrée fix dont la résolution ne touche que docs/, retouche sous apps/ et section de revue : refusée comme par le capitaine (titre de code sur la résolution)', () => {
  const { d, entrees } = reception({ sujetEnPlus: NON_FORMATE, retouches: formate });
  const titre = 'fix(sujet): met lot à jour avec develop';
  const r = check(d, { ...entrees, PR_TITRE: titre, PR_CORPS: REVUE });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  const resolution = `${ADR}/README.md\ndocs/f.md\n`;
  assert.deepEqual(motifs(r), [motifCapitaine(d, resolution, REVUE, titre, 'origin/sujet/lot')]);
  assert.match(motifs(r)[0], /titre « fix » mais le diff ne contient que de la documentation \(2 fichier\(s\) sous docs\/\)/);
});

test('PR de réception en deux fusions : refusée avec le motif de sujet.sh', () => {
  const secondeFusion = (d) => {
    d.git('switch', '-q', '--detach', 'origin/develop');
    d.ecrire('docs/d2.md', 'd2\n');
    d.commit('docs: develop encore');
    d.git('push', '-q', 'origin', 'HEAD:develop');
    d.git('fetch', '-q', 'origin');
    d.git('switch', '-q', 'maj/lot');
    d.git('merge', '-q', '--no-edit', 'origin/develop');
  };
  const { d, entrees } = reception({ retouches: secondeFusion });
  const r = check(d, { ...entrees, PR_CORPS: REVUE });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.equal(motifs(r).length, 1, r.stderr);
  assert.match(motifs(r)[0], /^#12, PR de mise à jour : une seule fusion de develop dans sujet\/lot, son premier commit/);
});

test('livraison de sujet (tête sujet/<nom>) : section non exigée, et la sortie le dit', () => {
  const d = depotJouet();
  const sommet = d.branche('sujet/lot', 'origin/develop', { 'apps/lot.ts': 'export const lot = 1;\n' }, 'feat: lot');
  const r = check(d, { PR_TITRE: 'feat(lot): livre le sujet lot', PR_BASE: 'develop', PR_TETE: 'sujet/lot', PR_SOMMET: sommet });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /livraison de sujet prouvée : chaque sous-PR a passé la revue/);
  assert.match(r.stdout, CONFORME);
  // Contre-relecture B : un sommet qui n'est pas celui d'origin/sujet/<nom> n'est pas la livraison du sujet.
  const etranger = d.branche('feat/etranger', 'origin/develop', { 'apps/e.ts': 'export const e = 1;\n' }, 'feat: e');
  const faux = check(d, { PR_TITRE: 'feat(lot): livre le sujet lot', PR_BASE: 'develop', PR_TETE: 'sujet/lot', PR_SOMMET: etranger });
  assert.equal(faux.status, 1, faux.stdout + faux.stderr);
  assert.doesNotMatch(faux.stdout, /livraison de sujet prouvée/);
  assert.deepEqual(motifs(faux), [motifCapitaine(d, 'apps/e.ts\n', '', 'feat(lot): livre le sujet lot')]);
});

test('branche livraison/ qui n’apporte pas un sommet du sujet : section exigée', () => {
  const d = depotJouet();
  d.branche('sujet/lot', 'origin/develop', { 'apps/lot.ts': 'export const lot = 1;\n' }, 'feat: lot');
  const faux = d.branche('livraison/lot-20261118-1200', 'origin/develop', { 'apps/x.ts': 'export const x = 1;\n' }, 'feat: x');
  const entrees = { PR_TITRE: 'feat(lot): livraison intermédiaire', PR_BASE: 'develop', PR_TETE: 'livraison/lot-20261118-1200', PR_SOMMET: faux };
  const refus = check(d, entrees);
  assert.equal(refus.status, 1, refus.stdout + refus.stderr);
  assert.deepEqual(motifs(refus), [motifCapitaine(d, 'apps/x.ts\n', '', entrees.PR_TITRE)]);
  assert.doesNotMatch(refus.stdout, /livraison de sujet prouvée/);
  // La vraie : un sommet du sujet poussé sur la branche de livraison.
  d.git('push', '-q', 'origin', 'origin/sujet/lot:refs/heads/livraison/lot-20261118-1300');
  d.git('fetch', '-q', 'origin');
  const vraie = check(d, { ...entrees, PR_TETE: 'livraison/lot-20261118-1300', PR_SOMMET: d.git('rev-parse', 'origin/sujet/lot') });
  assert.equal(vraie.status, 0, vraie.stdout + vraie.stderr);
  assert.match(vraie.stdout, /livraison de sujet prouvée/);
});

test('une variable d’entrée manque : sortie 2 ; un corps vide n’en est pas une ; refs absentes pour a-juger : échec dit, jamais conforme ; en CI, un outil absent du projet : rouge, sans repli vers le plugin', () => {
  const d = depotJouet();
  const doc = d.branche('docs/y', 'origin/develop', { 'docs/y.md': 'y\n' }, 'docs: y');
  const entrees = { PR_TITRE: 'docs(demo): y', PR_BASE: 'develop', PR_TETE: 'docs/y', PR_SOMMET: doc };
  for (const v of ['PR_TITRE', 'PR_NUMERO', 'PR_BASE', 'PR_TETE', 'PR_SOMMET']) {
    for (const valeur of [null, '']) {
      const r = check(d, { ...entrees, [v]: valeur });
      assert.equal(r.status, 2, `${v}=${valeur} : ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, new RegExp(v));
    }
  }
  for (const corps of [null, '']) {
    const r = check(d, { ...entrees, PR_CORPS: corps });
    assert.equal(r.status, 0, `PR_CORPS=${corps} : ${r.stdout}${r.stderr}`);
  }
  // Une base de sujet que le clone n'a pas : a-juger sort en 11, le check échoue en le disant.
  const absent = check(d, { ...entrees, PR_BASE: 'sujet/fantome' });
  assert.equal(absent.status, 3, absent.stdout + absent.stderr);
  assert.match(absent.stderr, /sujet\.sh a-juger a échoué.*refs absentes/);
  assert.doesNotMatch(absent.stdout, CONFORME);
  // Un clone superficiel se dit tel quel, jamais « refs absentes ».
  const superficiel = join(d.racine, 'superficiel');
  assert.equal(spawnSync('git', ['clone', '-q', '--depth', '1', '--no-single-branch', `file://${d.origine}`, superficiel], { env: d.env }).status, 0);
  const court = spawnSync(process.execPath, [CHECK], { cwd: superficiel, env: { ...d.env, ...entrees, PR_NUMERO: '12', GITHUB_ACTIONS: '' }, encoding: 'utf8' });
  assert.equal(court.status, 3, court.stdout + court.stderr);
  assert.match(court.stderr, /clone superficiel/);
  assert.doesNotMatch(court.stderr, /refs absentes/);
  // En CI, seul le chemin du projet vaut : depuis le plugin (ou un projet sans scripts/chaine/), rouge.
  const projet = dossierTemporaire('pr-titre-projet-');
  mkdirSync(join(projet, 'scripts', 'github'), { recursive: true });
  copyFileSync(CHECK, join(projet, 'scripts', 'github', 'pr-titre.mjs'));
  for (const chemin of [join(projet, 'scripts', 'github', 'pr-titre.mjs'), ...(PROJET ? [] : [CHECK])]) {
    const r = check(d, entrees, { ci: true, script: chemin });
    assert.equal(r.status, 3, `${chemin} : ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /scripts\/chaine\/sujet\.sh absent \(le poser : \/maj-skills:sujet poser\)/);
    assert.match(r.stderr, /scripts\/chaine\/revue-exigee\.mjs absent \(le poser : \/maj-skills:fusionner poser\)/);
    assert.doesNotMatch(r.stdout, CONFORME);
  }
});

// Le workflow posé avec le check (`ci/pr-titre.yml` du socle) : la date d'ouverture, que le régime lit (lot 5a). Posé dans
// un projet, le workflow vit sous `.github/workflows/` : le banc ne le lit que dans le plugin.
test('le workflow donne PR_OUVERTE, la date d’ouverture de la PR, comme les autres entrées : par `env:`', { skip: !existsSync(new URL('../../ci/pr-titre.yml', import.meta.url)) }, () => {
  const yml = readFileSync(new URL('../../ci/pr-titre.yml', import.meta.url), 'utf8');
  assert.match(yml, /^ {10}PR_OUVERTE: \$\{\{ github\.event\.pull_request\.created_at \}\}$/m);
});
