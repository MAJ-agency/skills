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
 *
 * Deux signalements, sans action : `CLAUDE.md` demande graphify (il porte `graphify update`) et la
 * commande ou `graphify-out/graph.json` manque ; le plugin des skills de la chaîne n'est pas installé
 * dans la session (le script de l'environnement ne l'a pas installé). Une erreur de
 * lecture se tait : le hook ne signale que ce qu'il a pu lire, et sort toujours en 0.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { RACINE } from './entree.mjs';

const ETAPES_ACTIVES = new Set(['fetch-develop', 'origin-head', 'install' /* , 'postgres', 'base-test' */]);
const PG = { host: process.env.PGHOST ?? 'localhost', port: process.env.PGPORT ?? '5432' };
/** Autorité de certification du proxy des sessions cloud : à poser seulement si elle existe. */
const CA_SESSION_CLOUD = '/root/.ccr/ca-bundle.crt';
/** Le plugin qui porte les skills de la chaîne, clé de `~/.claude/plugins/installed_plugins.json`. */
const PLUGIN_CHAINE = 'maj-skills@maj';
const PLUGINS_INSTALLES = join(homedir(), '.claude', 'plugins', 'installed_plugins.json');

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

/** Vrai si le texte de `installed_plugins.json` déclare le plugin ; absent, illisible ou sans la clé : faux. */
export function pluginInstalle(texte, nom = PLUGIN_CHAINE) {
  if (typeof texte !== 'string') return false;
  try {
    const plugins = JSON.parse(texte)?.plugins;
    return Boolean(plugins && typeof plugins === 'object' && Object.hasOwn(plugins, nom));
  } catch {
    return false;
  }
}

/**
 * Manques à signaler au démarrage, une ligne chacun, sans rien lancer. `etat.claudeMd` : le texte du
 * `CLAUDE.md` racine, ou `null` ; `etat.pluginsInstalles` : le texte de `installed_plugins.json`, ou
 * `null`. Les signalements graphify ne valent que si `CLAUDE.md` le demande.
 */
export function signalementsDemarrage(etat) {
  const signalements = [];
  if (typeof etat.claudeMd === 'string' && etat.claudeMd.includes('graphify update')) {
    if (!etat.graphifyCommande) {
      signalements.push('démarrage : graphify — CLAUDE.md le demande et la commande est introuvable ; à installer (script de démarrage de l’environnement), puis : graphify update .');
    } else if (!etat.grapheGraphify) {
      signalements.push('démarrage : graphify — CLAUDE.md le demande et graphify-out/graph.json manque ; à lancer : graphify update .');
    }
  }
  if (!pluginInstalle(etat.pluginsInstalles)) {
    signalements.push(
      `démarrage : skills de la chaîne absents de la session (plugin ${PLUGIN_CHAINE} non installé) — les installer soi-même : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; puis lire le skill sous ~/.claude/plugins/marketplaces/maj/skills/ (installé en cours de session, il n’entre pas dans la liste des skills). Le script de l’environnement doit l’installer et le mettre à jour à chaque démarrage : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; claude plugin marketplace update maj ; claude plugin update maj-skills@maj (docs/agents/chaine-de-production.md § 5, étape 5). Si l’installation échoue : le dire à qui a lancé la session et s’arrêter, sans contourner`,
    );
  }
  return signalements;
}

const lireOuNull = (chemin) => {
  try {
    return readFileSync(chemin, 'utf8');
  } catch {
    return null;
  }
};

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
  try {
    sortie.push(
      ...signalementsDemarrage({
        claudeMd: lireOuNull(join(RACINE, 'CLAUDE.md')),
        graphifyCommande: ok('sh', ['-c', 'command -v graphify']),
        grapheGraphify: existsSync(join(RACINE, 'graphify-out', 'graph.json')),
        pluginsInstalles: lireOuNull(PLUGINS_INSTALLES),
      }),
    );
  } catch {
    // Un signalement ne bloque jamais le démarrage : une erreur de lecture se tait.
  }
  if (sortie.length) process.stdout.write(`${sortie.join('\n')}\n`);
  process.exit(0);
}
