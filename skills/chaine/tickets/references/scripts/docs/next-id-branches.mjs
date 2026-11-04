/**
 * Plus grand n déjà pris par un préfixe sur les branches distantes `origin/sujet/*` et `origin/docs/*`.
 * Une spec écrite sur une branche de sujet ou de cadrage reste invisible de l'arbre de travail jusqu'à
 * sa fusion : deux specs ont reçu le même numéro le jour où on ne lisait que l'arbre. Sans `fetch` ;
 * une branche illisible est ignorée. `git` est injecté pour les tests.
 */
import { execFileSync } from 'node:child_process';

const gitReel = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

export function plusGrandSurBranches(re, git = gitReel) {
  let refs = [];
  try {
    refs = git([
      'for-each-ref',
      '--format=%(refname:short)',
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
        const m = re.exec(chemin.split('/').pop());
        if (m) plus = Math.max(plus, Number(m[1]));
      }
    } catch {
      // branche illisible : ignorée
    }
  }
  return plus;
}
