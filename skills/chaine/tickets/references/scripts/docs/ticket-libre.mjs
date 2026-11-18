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
 *   2. les branches distantes dont le nom porte l'identifiant (`feat/spec-all-soc-1-03-…`), sauf
 *      celles dont la seule PR est fermée : abandonner un ticket ferme la PR, mais une session
 *      cloud ne peut pas supprimer la branche. Une branche sans PR compte (réservation avant la
 *      PR brouillon) ;
 *   3. les PR ouvertes dont le titre porte l'identifiant, dont la branche le porte, ou dont les
 *      fichiers ajoutent ou modifient celui du ticket (`pr-ouvertes.mjs`, `gh api` en REST :
 *      `SPEC_ALL_INF-26.45` a été pris deux fois, sa PR ne le citait ni dans le titre ni dans la
 *      branche). Sans `gh` authentifié (session cloud), le script ne conclut pas : il donne les
 *      recherches à faire par l'outil GitHub MCP.
 *
 * Usage : node scripts/docs/ticket-libre.mjs SPEC_ALL_SOC-1.03
 * Sorties : 0 libre · 1 pris (le script dit par qui ; ticket archivé compris) · 2 usage ou ticket introuvable
 *           3 libre côté git, mais PR ouvertes non vérifiées (gh indisponible)
 */
import { execFileSync } from 'node:child_process';
import { branchePorte, estArchive, fichierDuTicket, lireTicket, texteCite } from './identifiants.mjs';
import { lirePrOuvertes, prDeBranche } from './pr-ouvertes.mjs';

const id = (process.argv[2] ?? '').toUpperCase();
if (!lireTicket(id)) {
  console.error('Usage : node scripts/docs/ticket-libre.mjs <SPEC>.<NN>   (ex. SPEC_ALL_SOC-1.03, SPEC_FNSMR_PAY-3.02)');
  process.exit(2);
}
const dansBranche = (branche) => branchePorte(branche, id);

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
const motif = fichierDuTicket(id);
// Un ticket archivé (`issues/archive/`) est fait : hors du chemin de la réservation.
let archive = false;
const trouves = refs.flatMap((ref) => {
  const candidats = git('ls-tree', '-r', '--name-only', ref, 'docs')
    .split('\n')
    .filter((l) => motif.test(l));
  if (candidats.some(estArchive)) archive = true;
  const f = candidats.find((l) => !estArchive(l));
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

// 2. et 3. Les PR ouvertes d'abord : une branche qui est la tête d'une PR ouverte compte par elle.
const ouvertes = lirePrOuvertes();
const prVerifiees = ouvertes.verifiees;
const infos = [];
const surRepli = [];
const tetes = new Set((ouvertes.prs ?? []).map((p) => p.tete));

// 2. Branches distantes portant l'identifiant (sauf celles dont la seule PR est fermée).
const branches = git('ls-remote', '--heads', 'origin')
  .split('\n')
  .map((l) => l.split('\trefs/heads/').reverse())
  .filter(([b]) => b && dansBranche(b));
for (const [b, sha] of branches) {
  const pr = tetes.has(b) ? 'ouverte' : prDeBranche(b, { tete: sha });
  if (pr === 'fermee') infos.push(`branche d'une PR fermée, ignorée : ${b}`);
  else if (pr === null) {
    pris.push(`branche distante : ${b} (PR non vérifiée)`);
    surRepli.push(b);
  } else pris.push(`branche distante : ${b}`);
}

// 3. PR ouvertes : titre, branche, ou fichiers du ticket (ajoutés, modifiés, renommés, copiés).
const prend = ({ statut, chemin }) =>
  statut !== 'removed' && motif.test(`/${chemin}`) && !estArchive(`/${chemin}`);
for (const pr of ouvertes.prs ?? []) {
  const fichiers = pr.fichiers.filter(prend);
  const par = fichiers.length
    ? ` — ${fichiers.map((f) => `${f.statut === 'added' ? 'ajoute' : 'modifie'} ${f.chemin}`).join(', ')}`
    : '';
  if (texteCite(pr.titre, id) || dansBranche(pr.tete) || fichiers.length) {
    pris.push(`PR #${pr.numero}${pr.brouillon ? ' (brouillon)' : ''} : ${pr.titre} [${pr.tete}]${par}`);
  }
}

console.log(`${id} — ${fichier}`);
for (const { nom, status } of statuts.filter((s, i) => i === 0 || s.status !== statuts[0].status))
  console.log(`Status sur ${nom} : ${status}`);
for (const i of infos) console.log(i);
const depot = () => git('remote', 'get-url', 'origin').trim().replace(/\.git$/, '').split('/').slice(-2);
if (pris.length) {
  console.log(`\nPRIS — ne pas commencer :`);
  for (const p of pris) console.log(`  - ${p}`);
  if (surRepli.length) {
    const [o, r] = depot();
    console.log(`\nBranche sans vérification de sa PR (gh indisponible) : si toutes ses PR sont fermées, elle ne prend pas le ticket.`);
    for (const b of surRepli) console.log(`  ${b} : list_pull_requests(owner: "${o}", repo: "${r}", head: "${o}:${b}", state: "all")`);
  }
  process.exit(1);
}
if (!prVerifiees) {
  const [o, r] = depot();
  console.log(
    `\nPR NON VÉRIFIÉES (gh indisponible) : statut et branches libres, mais une PR ouverte peut déjà le prendre.
Chercher par l'outil GitHub MCP avant de commencer, sur des PR ouvertes seulement :
  search_pull_requests(owner: "${o}", repo: "${r}", query: "${id} is:open")
    → ne retenir que la PR dont le titre ou la branche porte l'identifiant entier (pas ${id}0, pas la spec seule)
  list_pull_requests(owner: "${o}", repo: "${r}", state: "open")
    → pour chaque PR : pull_request_read(method: "get_files", owner: "${o}", repo: "${r}", pullNumber: <n>)
      le ticket est pris si elle ajoute ou modifie un fichier nommé ${id.replace(/\.\d+$/, '')}-<slug>.${id.split('.').pop()}.issue.md hors de issues/archive/
Aucun résultat → libre : le réserver tout de suite (branche + PR brouillon, docs/agents/issue-tracker.md).`,
  );
  process.exit(3);
}
console.log('\nLIBRE : le réserver tout de suite (branche + PR brouillon, docs/agents/issue-tracker.md).');
