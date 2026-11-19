/**
 * Plus grand n déjà pris sur `origin/develop` et les branches distantes `origin/sujet/*` et `origin/docs/*`, pour le type,
 * le contexte et le trigramme que lit `numeroDe` (nom de fichier → numéro, ou `null` ; next-id.mjs).
 * Une spec écrite sur une branche de sujet ou de cadrage reste invisible de l'arbre de travail jusqu'à
 * sa fusion : deux specs ont reçu le même numéro le jour où on ne lisait que l'arbre. Sans réseau : le
 * `fetch` est celui de l'appelant (next-id.mjs) ; une branche illisible est ignorée. `git` est injecté pour les tests.
 */
import { execFileSync } from 'node:child_process';

const gitReel = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

export function plusGrandSurBranches(numeroDe, git = gitReel) {
  let refs = [];
  try {
    refs = git([
      'for-each-ref',
      '--format=%(refname:short)',
      'refs/remotes/origin/develop',
      'refs/remotes/origin/sujet',
      'refs/remotes/origin/docs',
    ])
      .split('\n')
      .filter(Boolean);
  } catch {
    return 0;
  }
  let plus = 0;
  for (const ref of refs) {
    try {
      for (const chemin of git(['ls-tree', '-r', '--name-only', ref, 'docs']).split('\n')) {
        plus = Math.max(plus, numeroDe(chemin.split('/').pop()) ?? 0);
      }
    } catch {
      // branche illisible : ignorée
    }
  }
  return plus;
}
