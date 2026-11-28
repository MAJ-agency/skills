#!/usr/bin/env node
// =============================================================================
// La demande `À relire`, fabriquée par un script, jamais tapée (A-234, A-235, A-241).
//
//   node scripts/chaine/demande.mjs --session <id|—> --conducteur <id|—> [--branche <nom>]
//
// Écrit sur la sortie une ligne, `À relire — sommet <sha> — Session: <…> — Conducteur: <…>`, que la session copie
// telle quelle dans `add_issue_comment` : le script n'écrit rien sur GitHub. C'est le seul endroit qui écrit la forme
// de la demande ; `decision-relecteur.mjs` (`FORME_DEMANDE`) la lit, tolérant, et ne change pas.
//
// Le sommet vient de git, jamais du clavier. Sans `--branche`, c'est `HEAD`, et il doit être poussé : une branche
// courante (pas une tête détachée), présente sur `origin`, à la même tête. Avec `--branche`, c'est la tête de cette
// branche sur `origin`, quelle que soit la branche courante (le conducteur pour une fille finie, l'architecte pour
// la PR d'une personne).
//
// `--session` et `--conducteur` sont exigés : un identifiant `session_<lettres et chiffres>` ou `—` (`-` accepté).
// `Session:` est la session qui écrit la demande, `—` quand elle est posée à la place d'une session finie ou d'une
// personne ; `Conducteur:` est le conducteur du chantier quand il n'est pas l'auteur, `—` quand l'auteur l'est lui-même
// ou hors chantier. « moi » est refusé, comme deux identifiants égaux ; `—` aux deux champs est permis.
//
// Sorties : 0 la ligne ; 1 un sommet non poussé, une tête détachée ou une branche absente d'`origin` ; 2 un appel
// mal formé (les options se lisent avant tout appel à git) ; 12 `origin` illisible.
// Aucune dépendance.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHA = /^[0-9a-f]{40}$/;
const SESSION = /^session_[A-Za-z0-9]+$/;
const TIRET = '—';
const USAGE = 'usage : node demande.mjs --session <id|—> --conducteur <id|—> [--branche <nom>]';

/** Erreur d'appel : la sortie 2. */
class AppelMalForme extends Error {}

const champ = (nom, valeur) => {
  if (valeur === '-' || valeur === TIRET) return TIRET;
  if (typeof valeur === 'string' && SESSION.test(valeur)) return valeur;
  throw new AppelMalForme(`${nom} : « ${valeur ?? ''} » n'est ni un identifiant de session (session_…) ni —`);
};

/** La ligne de la demande, seul endroit qui écrit sa forme. Lève `AppelMalForme` sur un appel mal formé. */
export function demande({ sommet, session, conducteur }) {
  if (!SHA.test(sommet ?? '')) throw new AppelMalForme(`sommet : « ${sommet ?? ''} » n'est pas un sha de 40 caractères`);
  const s = champ('--session', session);
  const c = champ('--conducteur', conducteur);
  if (s !== TIRET && s === c) {
    throw new AppelMalForme("deux identifiants égaux : l'auteur qui conduit écrit `--conducteur —`");
  }
  return `À relire — sommet ${sommet} — Session: ${s} — Conducteur: ${c}`;
}

function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const nom = argv[i];
    if (!['--session', '--conducteur', '--branche'].includes(nom) || i + 1 >= argv.length) return null;
    const cle = nom.slice(2);
    if (cle in options) return null;
    options[cle] = argv[i + 1];
  }
  if (!('session' in options) || !('conducteur' in options)) return null;
  if ('branche' in options && options.branche === '') return null;
  return options;
}

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

function principal() {
  const options = lireArguments(process.argv.slice(2));
  if (!options) {
    console.error(USAGE);
    return 2;
  }
  // Les champs se jugent avant tout appel à git.
  try {
    demande({ sommet: 'a'.repeat(40), session: options.session, conducteur: options.conducteur });
  } catch (e) {
    console.error(`demande : ${e.message}`);
    return 2;
  }
  let branche = options.branche;
  let tete = null;
  if (!branche) {
    const sym = git('symbolic-ref', '--short', '-q', 'HEAD');
    if (sym.status !== 0 || !sym.stdout.trim()) {
      console.error('demande : tête détachée, aucune branche : la demande ne nomme qu\'un sommet poussé');
      return 1;
    }
    branche = sym.stdout.trim();
    const head = git('rev-parse', 'HEAD');
    if (head.status !== 0) {
      console.error('demande : git ne lit pas HEAD');
      return 12;
    }
    tete = head.stdout.trim();
  }
  const distant = git('ls-remote', '--exit-code', 'origin', `refs/heads/${branche}`);
  if (distant.status === 2) {
    console.error(`demande : la branche ${branche} est absente d'origin : la demande ne nomme qu'un sommet poussé`);
    return 1;
  }
  if (distant.status !== 0) {
    console.error(`demande : git ne lit pas origin : ${(distant.stderr || '').trim().split('\n').pop()}`);
    return 12;
  }
  const sommet = distant.stdout.split('\t')[0].trim();
  if (tete !== null && tete !== sommet) {
    console.error(`demande : la tête locale ${tete} n'est pas celle d'origin/${branche} (${sommet}) : pousser d'abord`);
    return 1;
  }
  try {
    console.log(demande({ sommet, session: options.session, conducteur: options.conducteur }));
  } catch (e) {
    console.error(`demande : ${e.message}`);
    return 2;
  }
  return 0;
}

if (estPointEntree()) process.exitCode = principal();
