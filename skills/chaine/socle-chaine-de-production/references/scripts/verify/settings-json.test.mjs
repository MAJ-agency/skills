import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

test('une garde affaiblie se lit aussi en CRLF et sans dernier saut de ligne ; l’écart nomme la ligne de cette garde, pas d’une voisine', () => {
  const crlf = (objet) => JSON.stringify(objet, null, 2).replace(/\n/g, '\r\n');
  assert.deepEqual(ecartsSettings(crlf(reglesValides()), { fichierExiste: () => true }), []);
  const s = reglesValides();
  delete s.hooks.PreToolUse[1].hooks[0].onFailure;
  const texte = crlf(s);
  const attendue = texte.split('\n').findIndex((l) => l.includes('scripts/agent/garde-commandes.mjs')) + 1;
  const messages = ecartsSettings(texte, { fichierExiste: () => true });
  assert.deepEqual(messages.map((m) => m.split(' : ')[0]), [`ligne ${attendue}`]);
  assert.match(messages[0], /garde-commandes\.mjs sans `"onFailure": "block"`/);
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

// Régime 8 (A-182, point 3) : `create_session` pré-approuvé refuse `effort`, que chaque session de relecture reçoit.
test('régime 8 : une entrée allow qui pré-approuve create_session est un écart ; en régime 7, non', () => {
  for (const entree of ['mcp__claude-code-remote__create_session', 'mcp__claude-code-remote', 'mcp__claude-code-remote__*', 'mcp__autre__create_session']) {
    const s = reglesValides();
    s.permissions.allow.push(entree);
    const texte = JSON.stringify(s, null, 2);
    const huit = ecartsSettings(texte, { fichierExiste: () => true, relecture: true });
    assert.equal(huit.length, 1, `${entree} : ${huit.join(' ; ')}`);
    // Tout caractère spécial échappé, l'antislash compris (alerte CodeQL « Incomplete string escaping or encoding »).
    const motif = entree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(huit[0], new RegExp(`« ${motif} » pré-approuve \`create_session\``));
    assert.match(huit[0], /^ligne (\d+) : /);
    assert.equal(Number(/^ligne (\d+)/.exec(huit[0])[1]), texte.split('\n').findIndex((l) => l.includes(JSON.stringify(entree))) + 1);
    assert.deepEqual(ecartsSettings(texte, { fichierExiste: () => true }), [], `${entree} : régime 7`);
  }
  for (const voisine of ['mcp__claude-code-remote__send_message', 'mcp__claude-code-remote__create_session_x', 'Bash(create_session)', 'mcp__claude-code-remote__list_sessions'])
    assert.deepEqual(ecartsSettings(JSON.stringify({ ...reglesValides(), permissions: { allow: ['Bash(pnpm check)', voisine] } }, null, 2), { fichierExiste: () => true, relecture: true }), [], voisine);
});

test('le gate lit la clé relecture de .claude/chaine.json : présente, absente, contrat illisible qui la nomme, contrat absent', () => {
  const ici = dirname(fileURLToPath(import.meta.url));
  const racine = mkdtempSync(join(tmpdir(), 'settings-json-'));
  try {
    mkdirSync(join(racine, 'scripts/verify'), { recursive: true });
    mkdirSync(join(racine, 'scripts/agent'), { recursive: true });
    mkdirSync(join(racine, '.claude'));
    for (const f of ['settings-json.mjs', 'settings-json-regles.mjs']) cpSync(join(ici, f), join(racine, 'scripts/verify', f));
    // regles.mjs des hooks : posé à côté, comme dans un projet.
    const regles = [join(ici, '../agent'), join(ici, '../../agent')].find((d) => existsSync(join(d, 'regles.mjs')));
    cpSync(regles, join(racine, 'scripts/agent'), { recursive: true });
    const s = reglesValides();
    s.permissions.allow.push('mcp__claude-code-remote__create_session');
    writeFileSync(join(racine, '.claude/settings.json'), JSON.stringify(s, null, 2));
    const jouer = () => spawnSync(process.execPath, [join(racine, 'scripts/verify/settings-json.mjs')], { encoding: 'utf8', env: { ...process.env, PROJET_RACINE: racine } });
    assert.equal(jouer().status, 0, 'sans contrat : régime 7');
    writeFileSync(join(racine, '.claude/chaine.json'), JSON.stringify({ cheminsSensibles: [] }));
    assert.equal(jouer().status, 0, 'contrat sans la clé : régime 7');
    // Le gabarit nomme la clé dans son `$comment` : un contrat lisible qui ne la porte pas reste en régime 7.
    writeFileSync(join(racine, '.claude/chaine.json'), JSON.stringify({ $comment: '`relecture` : la relecture indépendante', cheminsSensibles: [] }));
    assert.equal(jouer().status, 0, 'la clé nommée dans le $comment seulement : régime 7');
    writeFileSync(join(racine, '.claude/chaine.json'), JSON.stringify({ relecture: { depuis: '2026-11-22T08:00:00Z' } }));
    const r = jouer();
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /pré-approuve `create_session`/);
    writeFileSync(join(racine, '.claude/chaine.json'), JSON.stringify({ relecture: null }));
    assert.equal(jouer().status, 1, 'une clé relecture mal formée (null) compte : du côté sûr');
    writeFileSync(join(racine, '.claude/chaine.json'), '{ "relecture": { ');
    assert.equal(jouer().status, 1, 'contrat illisible qui nomme la clé : du côté sûr');
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});
