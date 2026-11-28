// Ticket 90 : tout banc rangé sous `references/` d'un skill est posé dans les projets, et un projet le joue (`check:tickets`
// au pre-push et en CI, l'étape 3 du socle de la chaîne). Le garde le pose comme un projet le pose (`pose-du-socle.mjs`),
// avec le contrat du gabarit, au régime 8 puis au régime 7, et le joue : un banc qui lit, par un défaut, le contrat ou
// l'arbre du dépôt où il tourne, ou qui importe un chemin du plugin, y tombe. Dans le plugin, aucun contrat n'est à côté
// des bancs : leur passage vert ici ne dit rien de leur passage dans un projet.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { environnementDeBanc } from '../skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs';
import { sautesAttendus } from './sautes-admis.mjs';
import { bancsDesReferences, destinationDuDossier, jouerEnGroupe, poserLeSocle } from './pose-du-socle.mjs';

// Plancher du nombre de tests joués (plus de 400 à l'écriture) : sous lui, le garde ne joue pas ce qu'il croit.
const PLANCHER = 350;

test('destinationDuDossier : agent/ et scripts/<d>/ de references/ ont leur place, rien d’autre', () => {
  assert.equal(destinationDuDossier('skills/chaine/socle-chaine-de-production/references/agent'), 'scripts/agent');
  assert.equal(destinationDuDossier('skills/chaine/socle-chaine-de-production/references/scripts/github'), 'scripts/github');
  assert.equal(destinationDuDossier('skills/monorepo/socle-tests/references/scripts/verify'), 'scripts/verify');
  for (const d of ['skills/chaine/x/references', 'skills/chaine/x/references/ci', 'skills/chaine/x/references/scripts/a/b', 'skills/chaine/x/scripts'])
    assert.equal(destinationDuDossier(d), null, d);
  assert.ok(bancsDesReferences().length >= 25, 'les bancs des références sont lus');
});

for (const regime of [8, 7]) {
  test(`les bancs de references/, posés dans un projet au régime ${regime} (contrat du gabarit), y passent`, { timeout: 900_000 }, async (t) => {
    const racine = mkdtempSync(join(tmpdir(), `references-posees-${regime}-`));
    try {
      const projet = join(racine, 'projet');
      const temporaire = join(racine, 'tmp');
      mkdirSync(projet);
      mkdirSync(temporaire);
      const { bancs, fautes } = poserLeSocle(projet, { regime });
      assert.deepEqual(fautes, [], 'la pose');
      const contrat = JSON.parse(readFileSync(join(projet, '.claude/chaine.json'), 'utf8'));
      assert.equal(Object.hasOwn(contrat, 'relecture'), regime === 8, 'le régime du contrat posé');
      assert.ok(contrat.cheminsSensibles.includes('.claude/**'), 'les chemins sensibles du gabarit');
      for (const b of bancs) assert.ok(existsSync(join(projet, b)), b);
      // Sans `NODE_PATH` : un module installé hors du dépôt (un `typescript` global du poste) ne fait jamais passer un banc
      // posé que la CI du plugin, qui n'en a pas, rougirait ; le jouet résout ses dépendances par son `node_modules`.
      const env = { ...environnementDeBanc(), TMPDIR: temporaire };
      delete env.NODE_PATH;
      // Un poste qui garde les dépôts jouets (GARDER_JOUETS) laisserait des dossiers : l'assertion sur TMPDIR le lirait à tort.
      delete env.GARDER_JOUETS;
      // Un banc à la fois : `pnpm test` joue déjà ses fichiers en parallèle. Les durées de `regles.test.mjs` se bornent en
      // étalons depuis le ticket 91 (une charge ne les fait plus dépasser) ; un à la fois garde le garde court en mémoire.
      // Au délai, tout le groupe de processus est tué (A-259) : un banc qui a lancé un processus ne le laisse pas orphelin.
      const r = await jouerEnGroupe(['--test', '--test-concurrency=1', '--test-reporter=tap', ...bancs], { cwd: projet, env, borne: 840_000 });
      assert.equal(r.tue, false, `régime ${regime} : délai de 840 s atteint, groupe tué`);
      const compte = (nom) => Number((r.stdout.match(new RegExp(`^# ${nom} (\\d+)$`, 'm')) ?? [])[1]);
      const echecs = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1]);
      t.diagnostic(`régime ${regime} : ${bancs.length} bancs, ${compte('tests')} tests, ${compte('pass')} verts, ${compte('skipped')} sautés`);
      // Un sous-test sauté sort indenté : il compte comme les autres.
      const sautes = [...r.stdout.matchAll(/^ *ok \d+ - (.*) # SKIP\b/gm)].map((m) => m[1]);
      assert.deepEqual(echecs, [], `régime ${regime} : bancs posés en échec`);
      assert.equal(r.status, 0, `régime ${regime} : sortie ${r.status} ${r.signal ?? ''}\n${r.stderr.slice(-2000)}`);
      assert.equal(compte('fail'), 0);
      assert.equal(compte('cancelled'), 0);
      assert.equal(compte('todo'), 0, `régime ${regime} : tests « todo », jamais jugés`);
      assert.deepEqual([...sautes].sort(), sautesAttendus(bancs).map((s) => s.nom).sort(), `régime ${regime} : tests sautés`);
      // Un banc posé qui n'écrit aucun test (ses tests ne s'écrivent que dans le plugin) sort comme un test vert au nom de
      // son fichier : posé, il ne se juge plus, comme un banc sauté.
      const vides = [...r.stdout.matchAll(/^ok \d+ - (.*)$/gm)].map((m) => m[1]).filter((nom) => bancs.includes(nom));
      assert.deepEqual(vides, [], `régime ${regime} : bancs posés qui n'écrivent aucun test`);
      assert.ok(compte('tests') >= PLANCHER, `régime ${regime} : ${compte('tests')} tests joués, plancher ${PLANCHER}`);
      // Chaque banc retire ce qu'il crée (A-258) : un banc neuf qui laisse un dossier rougit ici, sans liste à tenir.
      assert.deepEqual(readdirSync(temporaire), [], `régime ${regime} : dossiers laissés dans TMPDIR par les bancs posés`);
    } finally {
      rmSync(racine, { recursive: true, force: true });
    }
  });
}

// Un petit-enfant vivant à l'heure du délai : le kill par groupe le tue (A-259). Modèle : `lancer` de `tranches.mjs`.
test('jouerEnGroupe : tué à sa borne, le groupe entier est mort, même quand un petit-enfant tient les flux', { timeout: 30_000 }, async () => {
  const env = { PATH: process.env.PATH };
  const script = "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['60'], { stdio: 'inherit' }); console.log(e.pid); setInterval(() => {}, 1000);";
  const debut = Date.now();
  const p = jouerEnGroupe(['-e', script], { cwd: tmpdir(), env, borne: 1_000 });
  let pid;
  let minuterie;
  try {
    const r = await Promise.race([p, new Promise((_, refuse) => (minuterie = setTimeout(() => refuse(new Error('jouerEnGroupe : non résolu en 10 s')), 10_000)))]);
    pid = Number(r.stdout.split('\n')[0]);
    assert.equal(r.tue, true);
    assert.ok(Date.now() - debut < 3_000, `résolue en ${Date.now() - debut} ms`);
    assert.ok(pid > 0, r.stdout);
    await new Promise((fin) => setTimeout(fin, 300));
    const stat = `/proc/${pid}/stat`;
    assert.ok(!existsSync(stat) || /^\d+ \(.*\) Z/.test(readFileSync(stat, 'utf8')), 'le petit-enfant est mort');
  } finally {
    clearTimeout(minuterie);
    for (const cible of [pid && -pid, pid].filter(Boolean)) {
      try {
        process.kill(cible, 'SIGKILL');
      } catch {}
    }
  }
});

test('jouerEnGroupe : non tué, chaque sortie reste à part et le statut est rendu', async () => {
  const r = await jouerEnGroupe(['-e', "console.log('dehors'); console.error('erreur');"], { cwd: tmpdir(), env: { PATH: process.env.PATH }, borne: 10_000 });
  assert.equal(r.tue, false);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), 'dehors');
  assert.equal(r.stderr.trim(), 'erreur');
});
