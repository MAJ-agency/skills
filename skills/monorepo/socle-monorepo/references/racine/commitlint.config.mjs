/**
 * Messages de commit — Conventional Commits, en français, validés par le hook `commit-msg`
 * (.husky/commit-msg) et par le job CI qui relit les commits d'une PR.
 *
 * L'en-tête est plafonné à 120 caractères : le français est plus long que l'anglais, et un
 * titre de PR squashée finit par ` (#n)`. Le corps est de la prose, repliée à la main ; sa
 * longueur de ligne n'est pas contrôlée.
 */

/**
 * Exceptions historiques : en-têtes exacts de commits déjà poussés qui ne se réécrivent pas
 * (jamais de force-push). Comparaison stricte, jamais de motif : la liste ne grandit que par
 * un commit dont la réécriture est impossible.
 */
const EN_TETES_HISTORIQUES = new Set([]);

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'style', 'perf', 'build', 'revert'],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    // Sujet en français : accents, majuscules sur les noms propres. La casse imposée par
    // config-conventional est pensée pour l'anglais.
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
  // Commits produits par GitHub : fusion d'un sujet ou d'une livraison.
  ignores: [
    (msg) => /^Merge (pull request|branch|remote-tracking branch)/.test(msg),
    (msg) => EN_TETES_HISTORIQUES.has(msg.split('\n', 1)[0]),
  ],
};
