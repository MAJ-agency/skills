#!/usr/bin/env node
/**
 * Un ticket est-il libre ? À lancer AVANT de commencer un ticket, puis le réserver
 * (docs/agents/issue-tracker.md § « Réserver un ticket »).
 *
 * Plusieurs sessions travaillent en parallèle sur le dépôt. La ligne `Status:` d'un ticket
 * n'arrive sur develop qu'à la fusion de sa PR : elle ne suffit pas à voir qu'une autre
 * session l'a commencé. Le script croise donc trois sources :
 *   1. la ligne `Status:` du ticket sur origin/develop et sur chaque branche `sujet/*`, où un
 *      ticket peut vivre avant develop (Fait, en cours, wontfix → pris) ;
 *   2. les branches distantes dont le nom porte l'identifiant (`feat/soc-1-03-…`) ;
 *   3. les PR ouvertes dont le titre porte l'identifiant ou dont la branche le porte
 *      (`gh api`, REST). Sans `gh` authentifié (session cloud), le script ne conclut pas : il
 *      donne la recherche `search_pull_requests` à faire par l'outil GitHub MCP.
 *
 * Usage : node scripts/docs/ticket-libre.mjs SOC-1.03
 * Sorties : 0 libre · 1 pris (le script dit par qui ; ticket archivé compris) · 2 usage ou ticket introuvable
 *           3 libre côté git, mais PR ouvertes non vérifiées (gh indisponible)
 */
import { execFileSync } from 'node:child_process';
import { lireTicket, slug as slugDe } from './identifiants.mjs';

const id = (process.argv[2] ?? '').toUpperCase();
const t = lireTicket(id);
if (!t) {
  console.error('Usage : node scripts/docs/ticket-libre.mjs <PRÉFIXE>-<n>.<NN>   (ex. SOC-1.03, ALL-FOF-11.04)');
  process.exit(2);
}
const { spec, index: nn } = t;
const slug = slugDe(id);
const dansBranche = new RegExp(`(^|[/-])${slug}(-|$)`);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const pris = [];

// 1. Ligne Status: sur origin/develop et sur les branches de sujet.
try {
  git('fetch', '-q', 'origin', 'develop', '+refs/heads/sujet/*:refs/remotes/origin/sujet/*');
} catch {
  console.warn('! fetch impossible : lecture des copies locales de origin/develop et origin/sujet/*');
}
const refs = [
  'origin/develop',
  ...git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/sujet/')
    .split('\n')
    .filter(Boolean),
];
const motif = new RegExp(`/${spec}-[^/]*\\.${nn}\\.issue\\.md$`);
// Un ticket archivé (`issues/archive/`) est fait : hors du chemin de la réservation.
let archive = false;
const trouves = refs.flatMap((ref) => {
  const candidats = git('ls-tree', '-r', '--name-only', ref, 'docs')
    .split('\n')
    .filter((l) => motif.test(l));
  if (candidats.some((l) => l.includes('/issues/archive/'))) archive = true;
  const f = candidats.find((l) => !l.includes('/issues/archive/'));
  return f ? [{ ref, f }] : [];
});
if (!trouves.length && archive) {
  console.error(`Ticket ${id} archivé (issues/archive/) : il est fait, rien à réserver.`);
  process.exit(1);
}
if (!trouves.length) {
  console.error(
    `Ticket ${id} introuvable sur origin/develop ni sur origin/sujet/* (docs/**/issues/) : sa spec n'est pas fusionnée.`,
  );
  process.exit(2);
}
const fichier = trouves[0].f;
const statuts = trouves.map(({ ref, f }) => {
  const status =
    git('show', `${ref}:${f}`)
      .split('\n')
      .find((l) => /^(- )?\**Status\**\s*:/i.test(l))
      ?.replace(/^(- )?\**Status\**\s*:\**\s*/i, '')
      .trim() ?? '(pas de ligne Status:)';
  if (/^(fait|en cours|wontfix|claimed|resolved|done)/i.test(status))
    pris.push(`Status sur ${ref.replace(/^origin\//, '')} : ${status}`);
  return { nom: ref.replace(/^origin\//, ''), status };
});

// 2. Branches distantes portant l'identifiant.
const branches = git('ls-remote', '--heads', 'origin')
  .split('\n')
  .map((l) => l.split('\trefs/heads/')[1])
  .filter((b) => b && dansBranche.test(b));
for (const b of branches) pris.push(`branche distante : ${b}`);

// 3. PR ouvertes (REST : `gh pr list` passe par GraphQL, refusé depuis les sessions cloud).
let prVerifiees = true;
try {
  const lignes = execFileSync(
    'gh',
    ['api', '--paginate', 'repos/{owner}/{repo}/pulls?state=open&per_page=100', '--jq', '.[] | [.number, .head.ref, .draft, .title] | @tsv'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  for (const ligne of lignes.split('\n').filter(Boolean)) {
    const [num, ref, draft, titre] = ligne.split('\t');
    if (titre.toUpperCase().includes(id) || dansBranche.test(ref)) {
      pris.push(`PR #${num}${draft === 'true' ? ' (brouillon)' : ''} : ${titre} [${ref}]`);
    }
  }
} catch {
  prVerifiees = false;
}

console.log(`${id} — ${fichier}`);
for (const { nom, status } of statuts.filter((s, i) => i === 0 || s.status !== statuts[0].status))
  console.log(`Status sur ${nom} : ${status}`);
if (pris.length) {
  console.log(`\nPRIS — ne pas commencer :`);
  for (const p of pris) console.log(`  - ${p}`);
  process.exit(1);
}
if (!prVerifiees) {
  const depot = git('remote', 'get-url', 'origin').trim().replace(/\.git$/, '').split('/').slice(-2);
  console.log(
    `\nPR NON VÉRIFIÉES (gh indisponible) : statut et branches libres, mais une PR ouverte peut déjà le prendre.
Chercher par l'outil GitHub MCP avant de commencer :
  search_pull_requests(owner: "${depot[0]}", repo: "${depot[1]}", query: "${id} is:open")
Aucun résultat → libre : le réserver tout de suite (branche + PR brouillon, docs/agents/issue-tracker.md).`,
  );
  process.exit(3);
}
console.log('\nLIBRE : le réserver tout de suite (branche + PR brouillon, docs/agents/issue-tracker.md).');
