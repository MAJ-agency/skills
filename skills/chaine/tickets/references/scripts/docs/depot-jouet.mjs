/**
 * Dépôt jouet pour les tests des scripts : un `origin` nu local avec `develop`, un clone de travail,
 * et un PATH réduit à `git` et `node` (donc sans `gh`, comme une session cloud).
 * Sans les GIT_* hérités : sous un hook git, GIT_DIR et GIT_INDEX_FILE visent le vrai dépôt.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
/** La grammaire et la numérotation, posées par `socle-monorepo` à `scripts/docs/`, pas par ce skill. */
const DU_SOCLE = ['identifiants.mjs', 'next-id.mjs', 'next-id-branches.mjs'];
// Dans le plugin, elles vivent dans le skill `socle-monorepo` : skills/monorepo/socle-monorepo/.
const SOCLE = join(ICI, '../../../../../monorepo/socle-monorepo/references/scripts/docs');
let pose;

/**
 * Le dossier `scripts/` tel que le projet le porte : `docs/` et `verify/` côte à côte, la grammaire
 * du socle dans `docs/`. Dans un projet, c'est celui de ce fichier ; dans le plugin, une copie des
 * scripts du skill augmentée de ceux du socle, faite une fois par processus de test.
 */
export function scripts() {
  if (existsSync(join(ICI, 'identifiants.mjs'))) return dirname(ICI);
  if (!pose) {
    pose = join(mkdtempSync(join(tmpdir(), 'tickets-poses-')), 'scripts');
    cpSync(dirname(ICI), pose, { recursive: true });
    for (const f of DU_SOCLE) copyFileSync(join(SOCLE, f), join(pose, 'docs', f));
  }
  return pose;
}
/** Chemin d'un script posé : `script('docs/vagues.mjs')`. */
export const script = (chemin) => join(scripts(), chemin);
/** Module d'un script posé, pour un test qui l'importe : `await module('docs/vagues.mjs')`. */
export const module = (chemin) => import(pathToFileURL(script(chemin)).href);

export const ENV = {
  ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.org',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.org',
};

/** `fichiers` : `{ chemin: contenu }`, commités et poussés sur `develop` ; `branches` : refs poussées en plus. */
export function depotJouet({ fichiers = {}, branches = [] } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'jouet-'));
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  const git = (...args) => execFileSync('git', args, { cwd: travail, env: ENV, encoding: 'utf8' });
  execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origine], { env: ENV });
  execFileSync('git', ['clone', '-q', origine, travail], { env: ENV });
  writeFileSync(join(travail, 'README.md'), 'jouet\n');
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(travail, chemin)), { recursive: true });
    writeFileSync(join(travail, chemin), contenu);
  }
  git('add', '-A');
  git('commit', '-q', '-m', 'initial');
  git('push', '-q', 'origin', 'HEAD:develop');
  for (const b of branches) git('push', '-q', 'origin', `HEAD:refs/heads/${b}`);
  const bin = join(racine, 'bin');
  mkdirSync(bin);
  for (const outil of ['git', 'node']) symlinkSync(execFileSync('which', [outil], { encoding: 'utf8' }).trim(), join(bin, outil));
  return { racine, travail, bin, git };
}
