import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ecartsSettings } from './settings-json-regles.mjs';

const hook = (script) => [
  { hooks: [{ type: 'command', command: `node "$D"/scripts/agent/${script}` }] },
];
const reglesValides = () => ({
  permissions: { allow: ['Bash(pnpm check)', 'Bash(git push -u origin:*)'] },
  hooks: {
    SessionStart: hook('demarrage.mjs'),
    PreToolUse: [
      { matcher: 'Edit|Write|MultiEdit|NotebookEdit', ...hook('garde-fichiers.mjs')[0] },
      { matcher: 'Bash', ...hook('garde-commandes.mjs')[0] },
    ],
    PostToolUse: hook('apres-edition.mjs'),
    Stop: hook('fin-de-tour.mjs'),
  },
});
const ecarts = (objet, fichierExiste = () => true) =>
  ecartsSettings(JSON.stringify(objet, null, 2), { fichierExiste });

test('un fichier conforme ne donne aucun écart', () => {
  assert.deepEqual(ecarts(reglesValides()), []);
});

test('virgule en trop (20/10) : JSON invalide, avec sa ligne', () => {
  const texte = '{\n  "permissions": {\n    "allow": ["Bash(pnpm check)",]\n  }\n}\n';
  const [e] = ecartsSettings(texte, { fichierExiste: () => true });
  assert.match(e, /^ligne \d+ : JSON invalide/);
});

test('allow remis à la racine (20/10) : mal placé, et permissions.allow manque', () => {
  const s = reglesValides();
  s.allow = s.permissions.allow;
  delete s.permissions;
  const messages = ecarts(s);
  assert.ok(messages.some((m) => /« allow » mal placé/.test(m)));
  assert.ok(messages.some((m) => /permissions\.allow.*tableau non vide/.test(m)));
});

test('indentation fautive (20/10) : valide pour le gate, Prettier la tient', () => {
  const texte = JSON.stringify(reglesValides()).replace(/,/g, ',\n\t\t   ');
  assert.deepEqual(ecartsSettings(texte, { fichierExiste: () => true }), []);
});

test('deny hors de permissions : mal placé', () => {
  const s = reglesValides();
  s.hooks.deny = [];
  assert.ok(ecarts(s).some((m) => /« hooks\.deny » mal placé/.test(m)));
});

test('permissions.allow vide : refusé ; permissions absent : accepté', () => {
  const s = reglesValides();
  s.permissions.allow = [];
  assert.ok(ecarts(s).some((m) => /tableau non vide/.test(m)));
  const sans = reglesValides();
  delete sans.permissions;
  assert.deepEqual(ecarts(sans), []);
});

for (const interdit of [
  'Bash(git push --force:*)',
  'Bash(git commit --no-verify:*)',
  'Bash(npm install:*)',
  'Bash(yarn add:*)',
  'Bash(git push origin develop)',
]) {
  test(`allow qui autorise l'interdit : ${interdit}`, () => {
    const s = reglesValides();
    s.permissions.allow.push(interdit);
    assert.ok(ecarts(s).some((m) => m.includes(interdit) && /les hooks refusent/.test(m)));
  });
}

for (const evenement of ['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop']) {
  test(`hook ${evenement} absent`, () => {
    const s = reglesValides();
    delete s.hooks[evenement];
    assert.ok(ecarts(s).some((m) => m.includes(`hooks.${evenement}\` absent`)));
  });
}

test('PreToolUse sans le matcheur Bash', () => {
  const s = reglesValides();
  s.hooks.PreToolUse = s.hooks.PreToolUse.slice(0, 1);
  assert.ok(ecarts(s).some((m) => /sans matcheur « Bash »/.test(m)));
});

test('commande de hook vers un fichier absent', () => {
  const messages = ecarts(reglesValides(), (f) => !f.endsWith('fin-de-tour.mjs'));
  assert.equal(messages.length, 1);
  assert.match(messages[0], /scripts\/agent\/fin-de-tour\.mjs, qui n'existe pas/);
});

test('commande de hook hors scripts/agent/ (graphify) : acceptée', () => {
  const s = reglesValides();
  s.hooks.PreToolUse.push({ matcher: 'Bash|Grep', hooks: [{ type: 'command', command: 'graphify hook-guard search' }] });
  assert.deepEqual(ecarts(s), []);
});
