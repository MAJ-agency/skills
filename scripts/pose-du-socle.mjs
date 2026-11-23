// Pose, dans un dossier neuf, les scripts que les skills du socle copient dans un projet, rangés à leur place de projet,
// avec le contrat `.claude/chaine.json` du gabarit au régime voulu : 8 (le gabarit tel quel, `{{DEPUIS}}` rempli), 7 (le
// gabarit sans la clé `relecture`). Lu par `references-posees.test.mjs` (ticket 90) ; une table, pour que la pose de la
// racine (`socle-monorepo`, TABLE-RACINE.md) puisse s'y ajouter sans réécrire le garde.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { environnementDeBanc } from '../skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs';

export const RACINE = fileURLToPath(new URL('..', import.meta.url));
const CONTRAT = 'skills/chaine/socle-chaine-de-production/references/chaine.json';
const INDEX = 'skills/chaine/socle-chaine-de-production/references/index-generes.json';

// Sous `references/` d'un skill, un banc est posé : `agent/` va sous `scripts/agent/` (socle de la chaîne, étape 2.4),
// `scripts/<d>/` sous `scripts/<d>/` (les étapes `poser` de `socle-monorepo`, `tickets`, `socle-tests` et du socle de la
// chaîne), avec tous les fichiers de son dossier. Un banc rangé ailleurs sous `references/` n'a pas de place connue.
export function destinationDuDossier(dossier) {
  const m = /^skills\/[^/]+\/[^/]+\/references\/(agent|scripts\/[^/]+)$/.exec(dossier);
  if (!m) return null;
  return m[1] === 'agent' ? 'scripts/agent' : m[1];
}

/** Les bancs sous `references/` des skills du plugin : `[{ banc, dossier }]`, chemins relatifs à la racine du plugin. */
export function bancsDesReferences() {
  const out = [];
  const parcourir = (d) => {
    for (const e of readdirSync(join(RACINE, d), { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) parcourir(p);
      else if (e.name.endsWith('.test.mjs') && p.includes('/references/')) out.push({ banc: p, dossier: d });
    }
  };
  for (const famille of readdirSync(join(RACINE, 'skills'))) parcourir(`skills/${famille}`);
  return out.sort((a, b) => a.banc.localeCompare(b.banc));
}

// Ce que les bancs posés appellent à côté d'eux, posé comme un projet le pose : les scripts du capitaine, des sujets
// et de la revue (`scripts/chaine/`, que le check `PR titre` appelle), les gabarits Stryker sous `apps/api/` (étape 5 de
// `socle-tests`), et deux fichiers de la racine (`socle-monorepo`).
export const VOISINS_PAR_DOSSIER = [
  ['skills/chaine/fusionner/scripts', 'scripts/chaine'],
  ['skills/chaine/sujet/scripts', 'scripts/chaine'],
  ['skills/chaine/revue-adversariale/scripts', 'scripts/chaine'],
  ['skills/chaine/revue-de-ticket/scripts', 'scripts/chaine'],
];
const VOISINS = [
  ['skills/monorepo/socle-tests/references/gabarits/stryker.config.mjs', 'apps/api/stryker.config.mjs'],
  ['skills/monorepo/socle-tests/references/gabarits/stryker.regles.config.mjs', 'apps/api/stryker.regles.config.mjs'],
  ['skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs', 'commitlint.config.mjs'],
  ['skills/monorepo/socle-monorepo/references/husky/pre-push', '.husky/pre-push'],
];

/**
 * Pose le projet jouet sous `projet` (un dossier vide) au régime `regime` (8 ou 7). Rend `{ bancs, fautes }` : les bancs
 * posés (chemins du projet) et les fautes de la pose (banc sans place connue, fichier posé deux fois).
 */
export function poserLeSocle(projet, { regime }) {
  const fautes = [];
  const poses = new Map();
  const poser = (source, destination) => {
    if (poses.has(destination)) return fautes.push(`${destination} posé deux fois : ${poses.get(destination)} et ${source}`);
    poses.set(destination, source);
    mkdirSync(join(projet, destination, '..'), { recursive: true });
    copyFileSync(join(RACINE, source), join(projet, destination));
    if (/\.sh$|pre-(commit|push)$/.test(destination)) chmodSync(join(projet, destination), 0o755);
  };
  const poserLeDossier = (dossier, vers) => {
    for (const nom of readdirSync(join(RACINE, dossier)).sort())
      if (statSync(join(RACINE, dossier, nom)).isFile()) poser(`${dossier}/${nom}`, `${vers}/${nom}`);
  };
  const bancs = [];
  const dossiers = new Map();
  for (const { banc, dossier } of bancsDesReferences()) {
    const vers = destinationDuDossier(dossier);
    if (vers === null) {
      fautes.push(`${banc} : banc sous references/ sans place dans un projet (agent/ ou scripts/<dossier>/) : le poser, ou le ranger hors de references/`);
      continue;
    }
    dossiers.set(dossier, vers);
    bancs.push(`${vers}/${banc.split('/').pop()}`);
  }
  for (const [dossier, vers] of dossiers) poserLeDossier(dossier, vers);
  for (const [dossier, vers] of VOISINS_PAR_DOSSIER) poserLeDossier(dossier, vers);
  for (const [source, destination] of VOISINS) poser(source, destination);

  const contrat = JSON.parse(readFileSync(join(RACINE, CONTRAT), 'utf8'));
  if (regime === 8) contrat.relecture.depuis = '2026-11-22T00:00:00Z';
  else if (regime === 7) delete contrat.relecture;
  else throw new Error(`régime ${regime} : 8 ou 7`);
  mkdirSync(join(projet, '.claude'), { recursive: true });
  writeFileSync(join(projet, '.claude/chaine.json'), `${JSON.stringify(contrat, null, 2)}\n`);
  writeFileSync(join(projet, 'scripts/docs/index-generes.json'), readFileSync(join(RACINE, INDEX), 'utf8').replaceAll('{{SCOPE}}', 'jouet').replaceAll('{{PROJET}}', 'jouet'));
  writeFileSync(join(projet, 'package.json'), '{ "name": "jouet", "private": true, "type": "module" }\n');
  // Comme un projet, le jouet a ses dépendances à sa racine (`pnpm install`) : un banc posé y résout `typescript`
  // (`tests-creux.test.mjs`), jamais par un `NODE_PATH` ou un dossier parent du poste. Un lien vers celles du plugin,
  // hors de l'index du jouet.
  writeFileSync(join(projet, '.gitignore'), '/node_modules\n');
  symlinkSync(join(RACINE, 'node_modules'), join(projet, 'node_modules'), 'dir');

  const env = { ...environnementDeBanc(), GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...args) => execFileSync('git', args, { cwd: projet, env, stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('-c', 'user.email=jouet@example.org', '-c', 'user.name=jouet', 'commit', '-q', '-m', 'chore: pose du socle');
  return { bancs: bancs.sort(), fautes };
}
