#!/usr/bin/env node
/**
 * Prochain numéro libre d'un type, d'un contexte et d'un trigramme (`docs/methode/nomenclature.md`,
 * skill `tickets`).
 *
 * La numérotation est unique par type, contexte et trigramme dans tout `docs/`, quel que soit le
 * dossier : `SPEC_ALL_SOC-3` n'existe qu'une fois, et `RULE_ALL_SOC-3` est un autre document. Le
 * script relève le plus grand n porté par un nom de fichier (`RULE_ALL_LIC-3.md`, sans slug ;
 * `SPEC_ALL_LIC-12-<slug>.spec.md`, ses tickets et sa carte) dans l'arbre de travail et sur les
 * branches distantes `origin/sujet/*` et `origin/docs/*` (next-id-branches.mjs), et affiche n + 1.
 * Une règle existante garde ses zéros : `RULE_FNSMR_LIC-05` se compte comme 5.
 *
 * Sources, dans l'ordre : le `fetch` (develop s'il existe sur le distant, `sujet/*` et `docs/*`), puis l'arbre
 * de travail, `origin/develop`, `origin/sujet/*`, `origin/docs/*` et les fichiers des PR ouvertes
 * (`pr-ouvertes.mjs`, la lecture de `ticket-libre.mjs`). Sans `gh`, le numéro sort quand même (sortie 0) et
 * la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP.
 *
 * Usage : node scripts/docs/next-id.mjs SPEC ALL SOC     → 2
 *         node scripts/docs/next-id.mjs RULE ALL LIC     → 4
 *         node scripts/docs/next-id.mjs ADR ALL ARC      → 7
 *         node scripts/docs/next-id.mjs SPEC_ALL_SOC-4   → 79 (prochain index de ticket de la spec, sur deux chiffres : 01 à 99)
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { TYPES, estSpec, identifiantDuFichier, identifiantDuTicket, lireIdentifiant, lireTicket } from './identifiants.mjs';
import { plusGrandSurBranches } from './next-id-branches.mjs';
import { lirePrOuvertes } from './pr-ouvertes.mjs';

const args = process.argv.slice(2).map((s) => s.toUpperCase());
// Les trois segments écrits séparément, puis relus par la grammaire : aucune autre forme n'est admise.
const demande = args.length === 3 ? lireIdentifiant(`${args[0]}_${args[1]}_${args[2]}-1`) : null;
// Un seul argument, une spec : le prochain index de ses tickets.
const spec = args.length === 1 && estSpec(args[0]) ? args[0] : null;
if (!demande && !spec) {
  console.error(
    `Usage : node scripts/docs/next-id.mjs <TYPE> <CTX> <TRI>   (ex. SPEC ALL SOC, RULE ALL LIC, ADR ALL ARC ; TYPE parmi ${TYPES.join(', ')})\n` +
      '        node scripts/docs/next-id.mjs <SPEC>   (ex. SPEC_ALL_SOC-4 : prochain index de ticket de la spec)',
  );
  process.exit(2);
}

/**
 * Numéro porté par un nom de fichier, sinon `null` : celui d'un document du type, du contexte et du
 * trigramme demandés, ou, pour une spec demandée, l'index `NN` d'un de ses tickets.
 */
function numeroDe(nomDeFichier) {
  if (spec) {
    const ticket = lireTicket(identifiantDuTicket(nomDeFichier));
    return ticket?.spec === spec ? Number(ticket.index) : null;
  }
  const lu = lireIdentifiant(identifiantDuFichier(nomDeFichier));
  return lu && lu.type === demande.type && lu.contexte === demande.contexte && lu.trigramme === demande.trigramme ? lu.n : null;
}

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;

/** Le fetch : develop s'il existe sur le distant, `sujet/*` et `docs/*`, élagués ; `false` s'il échoue. */
function fetcher() {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const refspecs = ['+refs/heads/sujet/*:refs/remotes/origin/sujet/*', '+refs/heads/docs/*:refs/remotes/origin/docs/*'];
  try {
    let develop = [];
    try {
      git('ls-remote', '--exit-code', '--heads', 'origin', 'develop');
      develop = ['develop'];
    } catch (e) {
      if (e.status !== 2) throw e; // 2 : le distant répond, develop n'y est pas
    }
    git('fetch', '-q', '--prune', 'origin', ...develop, ...refspecs);
    return true;
  } catch {
    return false;
  }
}
const fetchFait = fetcher();

let max = 0;
const walk = (dir) => {
  let entrees = [];
  try {
    entrees = readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // pas encore de docs/ : le premier numéro est 1
  }
  for (const entry of entrees) {
    if (entry.isDirectory()) walk(join(dir, entry.name));
    else max = Math.max(max, numeroDe(entry.name) ?? 0);
  }
};
walk(join(ROOT, 'docs'));
max = Math.max(max, plusGrandSurBranches(numeroDe));
const prs = lirePrOuvertes();
if (prs.verifiees) {
  for (const pr of prs.prs) {
    for (const f of pr.fichiers) {
      if (['added', 'modified', 'renamed', 'copied', 'changed'].includes(f.statut)) {
        max = Math.max(max, numeroDe(f.chemin.split('/').pop()) ?? 0);
      }
    }
  }
}

if (!fetchFait) console.error('fetch impossible : copies locales lues (origin/develop, origin/sujet/*, origin/docs/* du dernier fetch).');
if (!prs.verifiees) {
  console.error(
    'PR ouvertes non lues (gh indisponible) : une PR ouverte peut déjà porter ce numéro. Par l\'outil GitHub MCP : list_pull_requests (state open), puis pull_request_read get_files pour chacune ; prendre le suivant d\'un numéro qu\'un de leurs fichiers porte. Réserver aussitôt (branche et PR brouillon).',
  );
}

if (spec) {
  if (max >= 99) {
    console.error(`plus d'index libre dans ${spec} : découper une nouvelle spec`);
    process.exit(2);
  }
  process.stdout.write(`${String(max + 1).padStart(2, '0')}\n`);
} else {
  process.stdout.write(`${max + 1}\n`);
}
