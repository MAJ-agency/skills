// Le hook de fin de tour sur un dépôt jouet : les gates rapides sont de faux scripts nommés par
// .claude/chaine.json ; un fichier modifié déclenche le passage.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';

// Chaque dossier créé par le banc est retiré à la fin (A-258).
const DOSSIERS = [];
after(() => {
  for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true });
});

const ICI = dirname(new URL(import.meta.url).pathname);

function jouet({ gates = {}, modifie = 'apps/api/src/a.ts' } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'fin-de-tour-'));
  DOSSIERS.push(racine);
  execFileSync('git', ['init', '-q', racine]);
  mkdirSync(join(racine, 'scripts/agent'), { recursive: true });
  mkdirSync(join(racine, 'scripts/verify'), { recursive: true });
  mkdirSync(join(racine, '.claude'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'fin-de-tour.mjs']) writeFileSync(join(racine, 'scripts/agent', f), readFileSync(join(ICI, f)));
  for (const [nom, sortie] of Object.entries(gates)) {
    writeFileSync(join(racine, 'scripts/verify', nom), `console.log("${nom} joué");\n${sortie ? `console.error("${nom} : écart");\nprocess.exit(${sortie});` : ''}\n`);
  }
  writeFileSync(join(racine, '.claude/chaine.json'), JSON.stringify({ gatesRapides: [...Object.keys(gates).map((g) => `scripts/verify/${g}`), 'scripts/verify/absent.mjs'] }));
  // Le jouet est commité avant la modification : seuls les fichiers du cas comptent comme « modifiés ».
  execFileSync('git', ['-C', racine, 'add', '-A']);
  execFileSync('git', ['-C', racine, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '-m', 'jouet']);
  if (modifie) {
    mkdirSync(dirname(join(racine, modifie)), { recursive: true });
    writeFileSync(join(racine, modifie), '// modifié\n');
  }
  return racine;
}
const lancer = (racine, entree = {}) =>
  spawnSync(process.execPath, [join(racine, 'scripts/agent/fin-de-tour.mjs')], {
    input: JSON.stringify(entree),
    env: { ...process.env, CLAUDE_PROJECT_DIR: racine },
    encoding: 'utf8',
  });

test('un gate rouge renvoie l’agent au travail (code 2) avec la sortie du gate ; un gate absent est ignoré', () => {
  const r = lancer(jouet({ gates: { 'vert.mjs': 0, 'rouge.mjs': 1 } }));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Gates rouges sur le travail en cours/);
  assert.match(r.stderr, /── scripts\/verify\/rouge\.mjs\nrouge\.mjs : écart/);
  assert.doesNotMatch(r.stderr, /vert\.mjs|absent\.mjs/);
});

test('tout vert : 0 ; déjà relancé une fois (stop_hook_active) : 0 sans rien jouer ; rien de modifié : 0', () => {
  assert.equal(lancer(jouet({ gates: { 'vert.mjs': 0 } })).status, 0);
  assert.equal(lancer(jouet({ gates: { 'rouge.mjs': 1 } }), { stop_hook_active: true }).status, 0);
  assert.equal(lancer(jouet({ gates: { 'rouge.mjs': 1 }, modifie: null })).status, 0);
});
