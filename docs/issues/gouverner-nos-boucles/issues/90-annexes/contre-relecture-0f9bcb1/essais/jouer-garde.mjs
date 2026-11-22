// Pose le jouet comme le garde (poserLeSocle du dépôt passé en argument), joue ses bancs comme le garde, garde le TAP.
// Usage : node jouer-garde.mjs <racine du dépôt> <régime> <fichier TAP de sortie> [--node-path]
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const [depot, regimeTexte, sortie] = process.argv.slice(2);
const garderNodePath = process.argv.includes('--node-path');
const { poserLeSocle } = await import(pathToFileURL(join(depot, 'scripts/pose-du-socle.mjs')).href);
const { environnementDeBanc } = await import(pathToFileURL(join(depot, 'skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs')).href);
const regime = Number(regimeTexte);
const racine = mkdtempSync(join(tmpdir(), `contre-garde-${regime}-`));
const projet = join(racine, 'projet');
const temporaire = join(racine, 'tmp');
mkdirSync(projet); mkdirSync(temporaire);
const { bancs, fautes } = poserLeSocle(projet, { regime });
const env = { ...environnementDeBanc(), TMPDIR: temporaire };
if (!garderNodePath) delete env.NODE_PATH;
const debut = Date.now();
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', '--test-reporter=tap', '--test-reporter-destination=stdout', `--test-reporter=${new URL('./rapporteur.mjs', import.meta.url).pathname}`, `--test-reporter-destination=${sortie}.jsonl`, ...bancs], { cwd: projet, env, encoding: 'utf8', timeout: 840_000, maxBuffer: 64 * 1024 * 1024 });
writeFileSync(sortie, r.stdout);
writeFileSync(`${sortie}.stderr`, r.stderr ?? '');
console.log(JSON.stringify({ regime, bancs: bancs.length, fautes, status: r.status, signal: r.signal, secondes: Math.round((Date.now() - debut) / 1000), projet }));
rmSync(racine, { recursive: true, force: true });
