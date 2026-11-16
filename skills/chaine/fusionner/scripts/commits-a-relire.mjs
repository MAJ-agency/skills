#!/usr/bin/env node
// Messages de commit jugés par la CI (jumeau du hook commit-msg), étape « Messages de commit » de ci.yml.
//
//   node scripts/chaine/commits-a-relire.mjs --de <base> --a <tête> [--hors <réf>]
//
// Juge, du plus ancien au plus récent, chaque commit de `<base>..<tête>` ; avec `--hors`, ceux déjà
// atteignables depuis cette réf sont écartés. Sur une PR, `--hors origin/develop` : une PR qui met un
// sujet à jour avec develop (base `sujet/…`) ne relit plus les commits déjà dans develop, qu'on ne
// réécrit pas. Sur une PR vers develop, la base est déjà develop : rien ne change.
//
// L'historique doit être complet (`fetch-depth: 0` au checkout) : sur un clone superficiel,
// `git rev-list` s'arrête à la frontière sans le dire, et un commit fautif passerait (ou un commit de
// develop, non reconnu comme tel, ferait échouer le job). Le script refuse donc un clone superficiel
// (sortie 2) au lieu de juger une liste incomplète.
//
// Chaque message passe par la commande `commitlint` du PATH (variable `COMMITLINT` pour la
// remplacer, utilisée par le banc), un processus par commit, sortie capturée puis réécrite d'un bloc
// synchrone : le journal montre toujours la ligne fautive (le `commitlint --verbose` d'une plage
// longue était coupé avant l'erreur, tube vidé par `process.exit`). Récapitulatif des refusés en fin.
//
// Sorties : 0 tous conformes, 1 au moins un refusé, 2 usage, réf introuvable ou clone superficiel.
import { spawnSync } from 'node:child_process';
import { realpathSync, writeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { ok: r.status === 0, sortie: (r.stdout ?? '').trim(), erreur: (r.stderr ?? '').trim() };
}

function ecrire(fd, texte) {
  writeSync(fd, texte.endsWith('\n') ? texte : `${texte}\n`);
}

export function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    const valeur = argv[i + 1];
    if (!['--de', '--a', '--hors'].includes(cle) || valeur === undefined || valeur === '') {
      return null;
    }
    options[cle.slice(2)] = valeur;
  }
  return options.de && options.a ? options : null;
}

// Liste des commits à juger, du plus ancien au plus récent, ou une erreur expliquée.
export function commitsAJuger({ de, a, hors }, cwd) {
  const superficiel = git(['rev-parse', '--is-shallow-repository'], cwd);
  if (!superficiel.ok) return { erreur: `pas un dépôt git : ${superficiel.erreur}` };
  if (superficiel.sortie === 'true') {
    return { erreur: 'clone superficiel : la liste des commits serait incomplète. Au checkout : fetch-depth: 0.' };
  }
  for (const [nom, ref] of [['--de', de], ['--a', a], ['--hors', hors]]) {
    if (ref === undefined) continue;
    if (!git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd).ok) {
      return { erreur: `${nom} ${ref} : commit introuvable dans le clone.` };
    }
  }
  const exclus = [`^${de}`, ...(hors ? [`^${hors}`] : [])];
  const liste = git(['rev-list', '--reverse', a, ...exclus, '--'], cwd);
  if (!liste.ok) return { erreur: `git rev-list : ${liste.erreur}` };
  return { commits: liste.sortie === '' ? [] : liste.sortie.split('\n') };
}

export function principal(argv, cwd = process.cwd(), env = process.env) {
  const options = lireArguments(argv);
  if (!options) {
    ecrire(2, 'usage : node scripts/chaine/commits-a-relire.mjs --de <base> --a <tête> [--hors <réf>]');
    return 2;
  }
  const { commits, erreur } = commitsAJuger(options, cwd);
  if (erreur) {
    ecrire(2, `✖ commits-a-relire : ${erreur}`);
    return 2;
  }
  const portee = options.hors ? `, hors ${options.hors}` : '';
  ecrire(1, `${commits.length} commit(s) à juger (${options.de}..${options.a}${portee}).`);
  const commande = env.COMMITLINT ?? 'commitlint';
  const refuses = [];
  for (const sha of commits) {
    const message = git(['log', '-1', '--format=%B', sha], cwd).sortie;
    const titre = message.split('\n')[0];
    const r = spawnSync(commande, [], { cwd, input: `${message}\n`, encoding: 'utf8', shell: true });
    if (r.status === 0) {
      ecrire(1, `✔ ${sha.slice(0, 10)} ${titre}`);
      continue;
    }
    refuses.push({ sha, titre });
    ecrire(1, `✖ ${sha.slice(0, 10)} ${titre} (${[...titre].length} caractères)`);
    ecrire(1, `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() || `(commitlint : sortie ${r.status})`);
  }
  if (refuses.length === 0) {
    ecrire(1, 'Tous les messages sont conformes.');
    return 0;
  }
  ecrire(1, `\n${refuses.length} message(s) refusé(s) :`);
  for (const { sha, titre } of refuses) ecrire(1, `  ${sha.slice(0, 10)} ${titre}`);
  return 1;
}

// Point d'entrée (idiome A-50 du plugin) : les deux chemins résolus, dans un `try`. Un lien symbolique, une espace,
// un accent ou `--preserve-symlinks-main` ne doivent jamais laisser le script sortir en 0 sans rien juger.
export function estPointEntree(urlModule, chemin) {
  try {
    return realpathSync(fileURLToPath(urlModule)) === realpathSync(chemin);
  } catch {
    return false;
  }
}

if (estPointEntree(import.meta.url, process.argv[1])) {
  process.exitCode = principal(process.argv.slice(2));
}
