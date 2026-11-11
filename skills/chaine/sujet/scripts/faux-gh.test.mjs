// Le faux `gh` du dépôt jouet doit se comporter comme l'API qu'il imite : une écriture acceptée
// n'est jamais perdue parce qu'un autre appel tournait en même temps. `boucle.sh` lance
// `file.sh | while …` : le producteur lit l'état pendant que le corps de boucle (renvoyer.sh) y écrit.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FAUX = join(dirname(fileURLToPath(import.meta.url)), 'faux-gh.mjs');

const appeler = (dossier, ...args) =>
  new Promise((resolve) => {
    const p = spawn('node', [FAUX, 'api', ...args], { env: { ...process.env, FAUX_GH: dossier, FAUX_GH_ORIGINE: dossier } });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, err }));
  });

test('faux gh : des appels concurrents, lectures comprises, ne perdent aucune écriture', async () => {
  const dossier = mkdtempSync(join(tmpdir(), 'faux-gh-'));
  const fichier = join(dossier, 'etat.json');
  writeFileSync(fichier, JSON.stringify({ pulls: [{ number: 1, title: 't', base: 'develop', head: 'x', labels: [] }], checks: {}, exiges: [] }));
  const N = 25;
  const appels = [];
  for (let i = 0; i < N; i++) {
    appels.push(appeler(dossier, '-X', 'POST', 'repos/{owner}/{repo}/issues/1/labels', '-f', `labels[]=l${i}`));
    appels.push(appeler(dossier, `repos/{owner}/{repo}/commits/${'a'.repeat(40)}/status`));
  }
  const rendus = await Promise.all(appels);
  for (const r of rendus) assert.equal(r.code, 0, r.err);
  const labels = JSON.parse(readFileSync(fichier, 'utf8')).pulls[0].labels;
  assert.deepEqual([...labels].sort(), Array.from({ length: N }, (_, i) => `l${i}`).sort());
});
