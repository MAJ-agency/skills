import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ecartsSettings, MATCHER_GITHUB } from './settings-json-regles.mjs';

const hook = (script) => [
  { hooks: [{ type: 'command', command: `node "$D"/scripts/agent/${script}` }] },
];
const garde = (script) => ({ hooks: [{ type: 'command', command: `node "$D"/scripts/agent/${script}`, timeout: 30, onFailure: 'block' }] });
const reglesValides = () => ({
  permissions: { allow: ['Bash(pnpm check)', 'Bash(git push -u origin:*)'] },
  hooks: {
    SessionStart: hook('demarrage.mjs'),
    PreToolUse: [
      { matcher: 'Edit|Write|MultiEdit|NotebookEdit', ...garde('garde-fichiers.mjs') },
      { matcher: 'Bash', ...garde('garde-commandes.mjs') },
      { matcher: MATCHER_GITHUB, ...garde('garde-github.mjs') },
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

test('PreToolUse sans le matcheur des outils GitHub d’écriture', () => {
  const s = reglesValides();
  s.hooks.PreToolUse = s.hooks.PreToolUse.slice(0, 2);
  assert.ok(ecarts(s).some((m) => m.includes(`sans matcheur « ${MATCHER_GITHUB} »`)));
});

test('une garde affaiblie est un écart : sans "onFailure": "block", sans timeout d’au plus 60 s, en arrière-plan, remplacée, neutralisée, ou déplacée sous un autre matcheur, ou tous les hooks coupés', () => {
  const affaiblies = {
    'onFailure absent': (s) => delete s.hooks.PreToolUse[2].hooks[0].onFailure,
    'onFailure continue': (s) => (s.hooks.PreToolUse[1].hooks[0].onFailure = 'continue'),
    'onFailure Block': (s) => (s.hooks.PreToolUse[0].hooks[0].onFailure = 'Block'),
    async: (s) => (s.hooks.PreToolUse[2].hooks[0].async = true),
    asyncRewake: (s) => (s.hooks.PreToolUse[1].hooks[0].asyncRewake = true),
    'commande remplacée par true': (s) => (s.hooks.PreToolUse[2].hooks[0].command = 'true'),
    'timeout absent': (s) => delete s.hooks.PreToolUse[2].hooks[0].timeout,
    'timeout 600': (s) => (s.hooks.PreToolUse[1].hooks[0].timeout = 600),
    'timeout en texte': (s) => (s.hooks.PreToolUse[0].hooks[0].timeout = '30'),
    'commande suivie de || true': (s) => (s.hooks.PreToolUse[2].hooks[0].command += ' || true'),
    'commande en commentaire': (s) => (s.hooks.PreToolUse[2].hooks[0].command = 'true # node "$D"/scripts/agent/garde-github.mjs'),
    'commande qui cite le script sans le lancer': (s) => (s.hooks.PreToolUse[1].hooks[0].command = 'echo scripts/agent/garde-commandes.mjs'),
    'hook de type prompt': (s) => (s.hooks.PreToolUse[0].hooks[0].type = 'prompt'),
    'disableAllHooks à la racine': (s) => (s.disableAllHooks = true),
    'garde déplacée sous Bash': (s) => {
      s.hooks.PreToolUse[1].hooks.push(s.hooks.PreToolUse[2].hooks[0]);
      s.hooks.PreToolUse[2].hooks = [{ type: 'command', command: 'true', onFailure: 'block' }];
    },
  };
  for (const [nom, affaiblir] of Object.entries(affaiblies)) {
    const s = reglesValides();
    affaiblir(s);
    assert.ok(ecarts(s).length > 0, nom);
  }
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

test('une entrée allow qui autorise une dépendance ou un push illisible est un écart, un joker de pnpm n’en est pas un', () => {
  const avec = (entree) => {
    const s = reglesValides();
    s.permissions.allow.push(entree);
    return ecarts(s);
  };
  assert.ok(avec('Bash(pnpm add zod)').some((m) => /« Bash\(pnpm add zod\) » autorise ce que les hooks refusent/.test(m)));
  assert.ok(avec('Bash(git push --all:*)').some((m) => /autorise ce que les hooks refusent/.test(m)));
  assert.deepEqual(avec('Bash(pnpm:*)'), []);
});
