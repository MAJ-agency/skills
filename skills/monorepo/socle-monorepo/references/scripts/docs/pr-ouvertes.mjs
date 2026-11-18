/**
 * Les PR ouvertes du dépôt et leurs fichiers, lues par `gh api` (REST : `gh pr list` passe par
 * GraphQL, refusé depuis les sessions cloud). `ticket-libre.mjs` et `next-id` la partagent : un
 * ticket ou une spec que la PR d'une autre session ajoute n'est visible ni sur develop ni sur
 * une branche de sujet, et ni son titre ni sa branche ne portent toujours l'identifiant
 * (`SPEC_ALL_INF-26.45` a été pris deux fois).
 *
 * Le module rend, l'appelant dit : aucune sortie sur la console. `gh` est injecté pour les tests
 * (une fonction qui reçoit la liste des arguments et rend la sortie) ; il ne lève jamais vers
 * l'appelant : `gh` absent ou en échec à un seul appel → `verifiees: false`, jamais une liste
 * partielle qu'on prendrait pour complète.
 */
import { execFileSync } from 'node:child_process';

const ghReel = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const lignes = (texte) => texte.split('\n').filter(Boolean).map((l) => l.split('\t'));

/**
 * `{ verifiees: true, prs: [{ numero, tete, brouillon, titre, fichiers: [{ chemin, ancien, statut }] }] }`,
 * ou `{ verifiees: false }`. `fichiers: false` saute la lecture des fichiers (`fichiers` vaut alors `[]`).
 */
export function lirePrOuvertes({ gh = ghReel, fichiers = true } = {}) {
  try {
    const prs = lignes(
      gh([
        'api',
        '--paginate',
        'repos/{owner}/{repo}/pulls?state=open&per_page=100',
        '--jq',
        '.[] | [.number, .head.ref, .draft, .title] | @tsv',
      ]),
    ).map(([numero, tete, brouillon, ...titre]) => ({
      numero: Number(numero),
      tete,
      brouillon: brouillon === 'true',
      titre: titre.join('\t'),
      fichiers: [],
    }));
    if (fichiers) {
      for (const pr of prs) {
        pr.fichiers = lignes(
          gh([
            'api',
            '--paginate',
            `repos/{owner}/{repo}/pulls/${pr.numero}/files?per_page=100`,
            '--jq',
            '.[] | [.status, .filename, (.previous_filename // "")] | @tsv',
          ]),
        ).map(([statut, chemin, ancien = '']) => ({ chemin, ancien, statut }));
      }
    }
    return { verifiees: true, prs };
  } catch {
    return { verifiees: false };
  }
}

/**
 * L'état de la ou des PR d'une branche (ouvertes ou fermées) : `'ouverte'`, `'fermee'` (toutes
 * fermées), `'aucune'`, ou `null` si `gh` manque ou échoue. `tete`, le sha de la branche, ne
 * s'ajoute que pour une PR fermée : une branche dont la tête diffère du dernier sha de chacune
 * de ses PR fermées a reçu des commits depuis, elle n'est pas abandonnée (`'aucune'`).
 */
export function prDeBranche(branche, { gh = ghReel, tete } = {}) {
  try {
    const prs = lignes(
      gh([
        'api',
        '--paginate',
        `repos/{owner}/{repo}/pulls?state=all&per_page=100&head={owner}:${encodeURIComponent(branche)}`,
        '--jq',
        '.[] | [.state, .head.sha] | @tsv',
      ]),
    );
    if (!prs.length) return 'aucune';
    if (prs.some(([etat]) => etat === 'open')) return 'ouverte';
    return tete && !prs.some(([, sha]) => sha === tete) ? 'aucune' : 'fermee';
  } catch {
    return null;
  }
}
