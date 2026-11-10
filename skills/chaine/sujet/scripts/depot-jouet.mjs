// =============================================================================
// Dépôt jouet partagé par les suites de `sujet.sh` et du capitaine (`fusionner/`) : origin nu,
// clone de travail, develop, et en tête de PATH un faux `gh` (faux-gh.mjs), un faux `pnpm` et un
// `sleep` immédiat. Aucun réseau : `gh` ne répond que depuis l'état JSON du test.
// =============================================================================
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
// Racine des skills de la chaîne : <skills>/chaine/<skill>/scripts/<nom>.
export const SKILLS = dirname(dirname(ICI));
// Posés dans un projet, tous les scripts de la chaîne vivent dans le même dossier (scripts/chaine/) ;
// dans le plugin, chacun est dans son skill.
export const script = (skill, nom) => {
  const local = join(ICI, nom);
  return existsSync(local) ? local : join(SKILLS, skill, 'scripts', nom);
};

// Sans les GIT_* hérités : sous le hook pre-push, GIT_DIR et GIT_INDEX_FILE visent le vrai dépôt,
// et les commandes du dépôt jouet y écriraient (commit « initial » sur la branche poussée).
const ENV_GIT = {
  ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.org',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.org',
};

// Index du jouet : la liste des ADR dans docs/adr/README.md, régénérée par la commande que
// scripts/docs/index-generes.json déclare (le projet réel y met ses propres index).
const ADR_INDEX = `import { existsSync, readdirSync, writeFileSync } from 'node:fs';
if (!existsSync('docs/adr')) process.exit(0);
writeFileSync('docs/adr/README.md', readdirSync('docs/adr').filter((f) => /^ADR_/.test(f)).sort().map((f) => '- ' + f + '\\n').join(''));
`;
const INDEX_GENERES = JSON.stringify({ index: [{ chemin: 'docs/adr/README.md', commande: 'node scripts/docs/adr-index.mjs' }] });

// La grammaire des identifiants (skill `tickets`) : `scripts/docs/identifiants.mjs` dans un projet,
// à côté de `scripts/chaine/` ; dans le plugin, dans le skill `tickets`.
export const GRAMMAIRE = [join(ICI, '../docs/identifiants.mjs'), join(SKILLS, 'tickets/references/scripts/docs/identifiants.mjs')].find(existsSync);

// Scripts que la boucle appelle : [skill, nom]. Posés dans un projet, tous vivent dans scripts/chaine/.
const CHAINE = [
  ...[
    'boucle.sh',
    'file.sh',
    'passer.sh',
    'renvoyer.sh',
    'refus.sh',
    'proprietaire.sh',
    'github.sh',
    'identifiant.mjs',
    'revue-exigee.mjs',
    'migrations-ordre.mjs',
  ].map((n) => ['fusionner', n]),
  ['revue-adversariale', 'diff-revue.sh'],
  ['revue-de-ticket', 'contexte-ticket.mjs'],
  ['sujet', 'sujet.sh'],
];

export function depotJouet() {
  const racine = mkdtempSync(join(tmpdir(), 'jouet-'));
  const origine = join(racine, 'origine.git');
  const travail = join(racine, 'travail');
  const bin = join(racine, 'bin');
  const faux = join(racine, 'faux-gh');
  mkdirSync(bin);
  mkdirSync(faux);
  const outil = (nom, corps) => {
    writeFileSync(join(bin, nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(bin, nom), 0o755);
  };
  outil('gh', `exec node ${JSON.stringify(join(ICI, 'faux-gh.mjs'))} "$@"`);
  // Le faux pnpm lit son entrée standard jusqu'au bout, comme le vrai `pnpm exec commitlint` :
  // sinon il sort avant que `printf … | pnpm` n'ait écrit, et sous charge `printf` meurt de
  // SIGPIPE (le tube est rompu), ce que `pipefail` rapporte comme un titre refusé (sortie 4).
  outil('pnpm', `cat > /dev/null\necho "pnpm $*" >> ${JSON.stringify(join(faux, 'pnpm.log'))}`);
  outil('sleep', ':');
  const env = {
    ...ENV_GIT,
    PATH: `${bin}:${process.env.PATH}`,
    TMPDIR: racine,
    FAUX_GH: faux,
    FAUX_GH_ORIGINE: origine,
  };
  writeFileSync(join(faux, 'etat.json'), JSON.stringify({ pulls: [], checks: {}, exiges: [] }));

  const git = (...args) =>
    execFileSync('git', args, { cwd: travail, env, encoding: 'utf8' }).trim();
  execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origine], { env });
  execFileSync('git', ['clone', '-q', origine, travail], { env });
  const ecrire = (chemin, contenu) => {
    mkdirSync(dirname(join(travail, chemin)), { recursive: true });
    writeFileSync(join(travail, chemin), contenu);
  };
  const lire = (chemin) => readFileSync(join(travail, chemin), 'utf8');
  const commit = (message) => {
    git('add', '-A');
    git('commit', '-q', '-m', message);
  };
  // Branche poussée depuis `depuis`, avec ses fichiers : { chemin: contenu }.
  const branche = (nom, depuis, fichiers, message = `feat: ${nom}`) => {
    git('switch', '-q', '-C', nom, depuis);
    for (const [chemin, contenu] of Object.entries(fichiers)) ecrire(chemin, contenu);
    commit(message);
    git('push', '-q', 'origin', `HEAD:refs/heads/${nom}`);
    git('fetch', '-q', 'origin');
    return git('rev-parse', 'HEAD');
  };
  ecrire('README.md', 'jouet\n');
  ecrire('scripts/docs/adr-index.mjs', ADR_INDEX);
  // Index généré que passer.sh et sujet.sh régénèrent puis ajoutent.
  ecrire('scripts/docs/index-generes.json', INDEX_GENERES);
  ecrire('docs/adr/README.md', '');
  commit('initial');
  git('push', '-q', 'origin', 'HEAD:develop');

  const fichierEtat = join(faux, 'etat.json');
  const etat = () => JSON.parse(readFileSync(fichierEtat, 'utf8'));
  // État du faux GitHub, fusionné dans l'existant : { pulls, checks, exiges, runs }.
  const github = (partiel) => writeFileSync(fichierEtat, JSON.stringify({ ...etat(), ...partiel }));
  const journal = () => {
    const f = join(faux, 'journal.jsonl');
    return existsSync(f)
      ? readFileSync(f, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((l) => JSON.parse(l))
      : [];
  };
  const lancer = (script, ...args) =>
    spawnSync('bash', [script, ...args], { cwd: travail, env, encoding: 'utf8' });
  // Publie les vrais scripts de la chaîne sur le develop du jouet (`scripts/chaine/`) : `boucle.sh`
  // joue la copie d'origin/develop, jamais celle du worktree.
  const publierChaine = () => {
    for (const [skill, nom] of CHAINE) {
      const source = script(skill, nom);
      if (existsSync(source)) ecrire(`scripts/chaine/${nom}`, readFileSync(source, 'utf8'));
    }
    // La boucle copie aussi la grammaire d'origin/develop : identifiant.mjs l'importe de ../docs/.
    ecrire('scripts/docs/identifiants.mjs', readFileSync(GRAMMAIRE, 'utf8'));
    commit('chore(chaine): scripts de la chaîne');
    git('push', '-q', 'origin', 'HEAD:develop');
    git('fetch', '-q', 'origin');
  };
  const developDistant = (chemin) => git('show', `origin/develop:${chemin}`);

  return {
    racine,
    origine,
    travail,
    env,
    git,
    ecrire,
    lire,
    commit,
    branche,
    etat,
    github,
    journal,
    lancer,
    developDistant,
    publierChaine,
  };
}
