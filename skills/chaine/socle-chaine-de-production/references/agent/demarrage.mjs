#!/usr/bin/env node
/**
 * Hook SessionStart : met l'environnement d'une session en état de coder et de pousser.
 * Idempotent : sur un dépôt prêt, aucune action. Ne bloque jamais la session : un échec s'affiche
 * avec la commande à lancer. Les étapes se lancent seulement si leur état n'est pas déjà prêt.
 *
 * Étapes posées par le socle : `fetch-develop` (la couverture du diff et la revue comparent à
 * develop), `origin-head`, `install` (si le lockfile a changé), le certificat du proxy des sessions
 * cloud. Les étapes d'une base locale sont écrites, désactivées : les activer dans `ETAPES_ACTIVES`
 * quand le projet a sa base (ticket « couche base de données »), avec la commande `db:test:prepare`.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './entree.mjs';

const ETAPES_ACTIVES = new Set(['fetch-develop', 'origin-head', 'install' /* , 'postgres', 'base-test' */]);
const PG = { host: process.env.PGHOST ?? 'localhost', port: process.env.PGPORT ?? '5432' };
/** Autorité de certification du proxy des sessions cloud : à poser seulement si elle existe. */
const CA_SESSION_CLOUD = '/root/.ccr/ca-bundle.crt';

const sh = (cmd, args, timeout = 300_000, options = {}) =>
  spawnSync(cmd, args, { cwd: RACINE, encoding: 'utf8', timeout, stdio: 'pipe', ...options });
const ok = (cmd, args) => sh(cmd, args, 20_000).status === 0;
const mtime = (chemin) => {
  try {
    return statSync(join(RACINE, chemin)).mtimeMs;
  } catch {
    return 0;
  }
};
const postgresRepond = () => ok('pg_isready', ['-h', PG.host, '-p', PG.port]);

/** Étapes à lancer, dans l'ordre : seules celles dont l'état n'est pas prêt. */
export function planDemarrage(etat) {
  const etapes = [];
  if (!etat.originDevelop) etapes.push('fetch-develop');
  if (!etat.originHead) etapes.push('origin-head');
  if (!etat.nodeModules || etat.lockfileMtime > etat.installMtime) etapes.push('install');
  if (etat.postgres === false) etapes.push('postgres');
  if (etat.baseTest === false) etapes.push('base-test');
  return etapes.filter((e) => ETAPES_ACTIVES.has(e));
}

const ACTIONS = {
  'fetch-develop': () => sh('git', ['fetch', 'origin', 'develop'], 120_000),
  'origin-head': () => sh('git', ['remote', 'set-head', 'origin', 'develop']),
  install: () => sh('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], 600_000),
  postgres: () => sh('docker', ['compose', 'up', '-d', 'db'], 120_000),
  'base-test': () => sh('pnpm', ['db:test:prepare'], 300_000),
};
const A_LANCER = {
  'fetch-develop': 'git fetch origin develop',
  'origin-head': 'git remote set-head origin develop',
  install: 'pnpm install --frozen-lockfile --prefer-offline',
  postgres: 'docker compose up -d db (ou démarrer le Postgres local)',
  'base-test': 'pnpm db:test:prepare',
};

if (process.env.CLAUDE_ENV_FILE && existsSync(CA_SESSION_CLOUD) && !process.env.NODE_EXTRA_CA_CERTS) {
  appendFileSync(process.env.CLAUDE_ENV_FILE, `export NODE_EXTRA_CA_CERTS=${CA_SESSION_CLOUD}\n`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const etat = {
    originDevelop: ok('git', ['rev-parse', '--verify', '-q', 'refs/remotes/origin/develop']),
    originHead: ok('git', ['rev-parse', '--verify', '-q', 'refs/remotes/origin/HEAD']),
    nodeModules: existsSync(join(RACINE, 'node_modules')),
    lockfileMtime: mtime('pnpm-lock.yaml'),
    installMtime: mtime('node_modules/.modules.yaml'),
    postgres: ETAPES_ACTIVES.has('postgres') ? postgresRepond() : null,
    baseTest: null,
  };
  const plan = planDemarrage(etat);
  const sortie = [];
  for (const etape of plan) {
    let r;
    try {
      r = ACTIONS[etape]();
    } catch (e) {
      r = { status: 1, stderr: String(e) };
    }
    sortie.push(r.status === 0 ? `démarrage : ${etape} — fait` : `démarrage : ${etape} — échec, à lancer : ${A_LANCER[etape]}`);
  }
  if (sortie.length) process.stdout.write(`${sortie.join('\n')}\n`);
  process.exit(0);
}
