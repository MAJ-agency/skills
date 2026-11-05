import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { aSectionRevue, exigeRevue, motifSansRevue, motifTitreSansCode } from './revue-exigee.mjs';

const SECTION = '## Résumé\n\nTexte.\n\n## Revue adversariale\n\n- Sommet relu : `abc1234`\n';

test('exigeRevue : apps/, packages/ et scripts/ (seeds compris), pas la documentation', () => {
  assert.equal(exigeRevue(['apps/api/src/worker.module.ts']), true);
  assert.equal(exigeRevue(['docs/README.md', 'packages/shared-types/src/index.ts']), true);
  assert.equal(exigeRevue(['scripts/db/seed-ffsa.ts']), true);
  assert.equal(exigeRevue(['docs/agents/evals-skills.md', '.claude/skills/x/SKILL.md']), false);
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
  const ticket = ['docs/features/licences/all/issues/ALL-LIC-17.06.issue.md'];
  assert.match(
    motifTitreSansCode({
      titre: 'feat(club): éligibilité des formules (ALL-LIC-17.06)',
      fichiers: ticket,
    }),
    /titre « feat » mais le diff ne contient que de la documentation \(1 fichier/,
  );
  assert.match(motifTitreSansCode({ titre: 'fix(web): x', fichiers: ticket }), /« fix »/);
  assert.match(motifTitreSansCode({ titre: 'refactor!: x', fichiers: ticket }), /« refactor »/);
  assert.match(motifTitreSansCode({ titre: 'perf(api): x', fichiers: ticket }), /« perf »/);
});

test('motifTitreSansCode : acceptés dès qu’un fichier hors docs/ est là, ou pour un autre type', () => {
  const ticket = ['docs/features/licences/all/issues/ALL-LIC-17.06.issue.md'];
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
