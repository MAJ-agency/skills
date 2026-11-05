import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  estChemin,
  intitulesTable,
  referencesCassees,
  titres,
} from './references-agent-regles.mjs';

const RACINES = new Set(['apps', 'docs', 'scripts', '.claude']);
const CLAUDE_MD = `# Projet

## Fusion vers \`develop\` : une file, un capitaine

## Où sont les règles détaillées

| Sections | Fichier |
| --- | --- |
| Guards Chain, HierarchyGuard & \`@SkipHierarchyCheck()\`, Validation (Zod) | \`.claude/rules/api-controleurs.md\` |
| Inter-Module Communication (notifications), Error Handling | \`.claude/rules/api-services.md\` |
`;
const REGLES = '### Pagination, Filtering & Sorting\n';
const SECTIONS = {
  titres: [...titres(CLAUDE_MD), ...titres(REGLES)],
  table: intitulesTable(CLAUDE_MD),
};

const analyser = (texte, { chemins = [], commandes = [], skills = [] } = {}) =>
  referencesCassees({
    texte,
    dossier: 'docs/agents',
    existeChemin: (c) => chemins.includes(c),
    commandeExiste: (n) => commandes.includes(n),
    skillExiste: (n) => skills.includes(n),
    sections: SECTIONS,
    racines: RACINES,
  });

test('chemin : cassé signalé, existant et dossier acceptés', () => {
  const r = analyser('Voir `scripts/absent.mjs` et `scripts/ok.mjs` et `docs/dossier/`.', {
    chemins: ['scripts/ok.mjs', 'docs/dossier/'],
  });
  assert.deepEqual(r, [{ ligne: 1, nature: 'chemin', reference: 'scripts/absent.mjs' }]);
});

test('chemin : motifs douteux ignorés', () => {
  for (const code of [
    'https://x.fr/a.md',
    '<dossier>/a.md',
    'apps/<app>/src/',
    '$HOME/a.md',
    '~/a.md',
    '{a,b}/c.md',
    '*/a.md',
    'apps/**/a.ts',
    'apps/*.ts',
    'src/shared/a.ts',
    '/root/a.crt',
    'apps/api',
    'apps/web a.ts',
  ]) {
    assert.equal(estChemin(code, RACINES), false, code);
  }
  assert.deepEqual(analyser('`apps/<app>/src/` `src/inconnu/a.ts`'), []);
});

test('chemin : résolu aussi depuis le dossier du fichier, ignoré dans un bloc de code', () => {
  assert.deepEqual(analyser('`docs/agents/x.md`', { chemins: ['docs/agents/x.md'] }), []);
  assert.equal(analyser('`docs/x.md`', { chemins: ['docs/agents/docs/x.md'] }).length, 0);
  assert.equal(analyser('`docs/x.md`').length, 1);
  assert.deepEqual(analyser('```\n`scripts/absent.mjs`\n```'), []);
});

test('commande : inconnue signalée, connue ignorée, route et unité non lues', () => {
  const r = analyser('Lancer `/wayfinder` puis /grill-with-docs, ou `/sujet` et /compact.', {
    commandes: ['sujet', 'compact'],
  });
  assert.deepEqual(
    r.map((c) => c.reference),
    ['/wayfinder', '/grill-with-docs'],
  );
  assert.deepEqual(analyser('Prix /an, et/ou, `;`/`,`/tabulation, https://x.fr/page'), []);
});

test('skill qualifiée : plugin externe absent signalé, étiquette ignorée', () => {
  const r = analyser('`mattpocock-skills:tdd` `prio:haute` `medical:read` `a:b`');
  assert.deepEqual(r, [
    { ligne: 1, nature: 'skill qualifiée', reference: 'mattpocock-skills:tdd' },
  ]);
  assert.deepEqual(analyser('`mattpocock-skills:sujet`', { skills: ['mattpocock-skills:sujet'] }), []);
});

test('section : titre, entrée de la table et titre qualifié acceptés', () => {
  const texte = [
    'CLAUDE.md § « Guards Chain » et § « Validation (Zod) ».',
    '§ « Inter-Module Communication » et CLAUDE.md § « Fusion vers develop ».',
    '§ « Pagination, Filtering & Sorting »',
  ].join('\n');
  assert.deepEqual(analyser(texte), []);
});

test('section : intitulé inexistant signalé, citation d’un autre document ignorée', () => {
  const r = analyser(
    [
      'CLAUDE.md § « Pagination » et § « Notifications (STRICT) ».',
      'docs/agents/chaine-de-production.md § « Inconnu » et ALL-ADR-51 § « Autre ».',
      'Renvoi § 5 et § « … ».',
    ].join('\n'),
  );
  assert.deepEqual(
    r.map((c) => [c.ligne, c.nature, c.reference]),
    [
      [1, 'section', 'Pagination'],
      [1, 'section', 'Notifications (STRICT)'],
    ],
  );
});

test('section : un titre du fichier qui cite répond (renvoi interne)', () => {
  const texte = '## Réserver un ticket (sessions parallèles)\n\nVoir § « Réserver un ticket ».\n';
  assert.deepEqual(analyser(texte), []);
  assert.equal(analyser('Voir § « Réserver un ticket ».').length, 1);
});

test('section nue : une phrase après le § est ignorée, un intitulé court est lu', () => {
  assert.deepEqual(analyser('CLAUDE.md § Guards Chain pour les contrôleurs.'), []);
  assert.equal(analyser('CLAUDE.md § Inconnu.').length, 1);
});

test('section : lue dans un bloc de code et sur deux lignes', () => {
  const r = analyser('```\nC6 CLAUDE.md § « Pagination »\nC8 CLAUDE.md §\n« Rien » fin\n```');
  assert.deepEqual(
    r.map((c) => [c.ligne, c.reference]),
    [
      [2, 'Pagination'],
      [3, 'Rien'],
    ],
  );
});

test('ticket : un identifiant cité qui n’existe pas est signalé, un existant ignoré, un bloc de code non lu', () => {
  const tickets = ['SOC-1.03'];
  const r = referencesCassees({
    texte: 'Voir `SOC-1.03` et SOC-1.09.\n```\nSOC-1.42\n```\n',
    dossier: '.',
    existeChemin: () => true,
    commandeExiste: () => true,
    skillExiste: () => true,
    ticketExiste: (id) => tickets.includes(id),
    sections: { titres: [], table: [] },
    racines: new Set(['docs']),
  });
  assert.deepEqual(r, [{ ligne: 1, nature: 'ticket', reference: 'SOC-1.09' }]);
});
