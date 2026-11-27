#!/usr/bin/env node
// =============================================================================
// Le Relecteur d'un dépôt (skill relecteur) : la file, la décision et la veille, en sous-commandes. Lancé depuis le
// dossier du skill, dans le dossier de la session du Relecteur, une copie du dépôt du projet qui ne sert qu'à lui :
//
//   node '<dossier du skill>/scripts/relecteur.mjs' passe
//   node '<dossier du skill>/scripts/relecteur.mjs' jouer <n> [--sessions <fichier>]
//   node '<dossier du skill>/scripts/relecteur.mjs' distribuer <n> --sommet <sha> --couple <modele>/<effort> [--remplace <id>]
//        [<session>…] [--sessions <fichier>]
//   node '<dossier du skill>/scripts/relecteur.mjs' veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--sondes <k>]
//        [--attendre]
//
// Chaque sous-commande, sauf `veille`, prend d'abord le verrou du dossier (`flock` sur `<dossier git>/relecteur.verrou`,
// attendu 300 secondes au plus : deux préparations ne se croisent jamais), puis prépare le dossier : il doit être propre ; le clone est approfondi
// une fois (A-126), toutes les branches d'origin sont relues, le dossier est placé sur origin/develop (détaché), et
// les dépendances de develop sont installées quand son `pnpm-lock.yaml` a changé depuis la dernière installation.
// Chaque commande git, la sienne comme celle des scripts qu'il joue, porte `core.hooksPath` vide et `core.fsmonitor`
// à `false`, ajoutés aux `GIT_CONFIG_*` de la session, jamais à leur place. Une installation en échec écrit sa sortie
// d'erreur et ne se retente qu'au prochain changement du lockfile, ou dans un Relecteur neuf (un dossier neuf n'a
// pas de témoin). Les scripts joués sont ceux de develop, sous `scripts/chaine/` : la décision (`decision-relecteur.mjs`, la
// même que celle du capitaine), « double relecture exigée », « même contenu propre », les chemins sensibles,
// `sujet.sh a-juger`, et `github.sh`, dont `lire_github` est la seule lecture de GitHub (A-108).
//
// La file : les PR ouvertes en régime 8 (A-97) — leur base, `develop` ou `sujet/<nom>`, porte dans son
// `.claude/chaine.json` la clé `relecture` et sa date `depuis`, et la PR a été ouverte après elle. Pour chacune,
// les faits que `decider` reçoit : ses étiquettes, tous ses commentaires (toutes pages), sa tête, le nombre de
// verdicts exigés, le fait que son diff propre touche un chemin sensible, « même contenu propre » pour chaque sommet
// de tour, l'instant, `relecture.delai`, et l'état des sessions quand le modèle le donne (`--sessions`).
//   - le diff propre : pour une PR vers develop, le diff à trois points sans renommage ; vers un sujet, la sortie de
//     `sujet.sh a-juger` (sa seconde liste pour une PR de mise à jour). Quand il ne se lit pas, aucune règle ne joue :
//     le geste `illisible`, sa cause nommée — PR de fourche, tête introuvable (après une seconde lecture d'origin : un
//     push tombé entre la préparation et la lecture de la PR n'en est pas une), dépendances de develop (une installation
//     en échec), forme refusée par `a-juger` (la ligne va à l'auteur, la seule cause qui soit à lui), `a-juger` ou le
//     diff en échec — et rien tant que cette trace est la plus récente et date de `relecture.delai` au plus (A-116) ;
//   - `--sessions <fichier>` : un objet JSON { <session>: vivante | morte | plafond | couple } que le modèle a lu
//     (get_session ; `couple` : la session tourne à un autre modèle ou un autre effort que `faits`, A-182) ; une autre
//     forme sort en 2, la cause dite.
//
// `passe` écrit une ligne JSON par PR ouverte : `{ pr, base, tete, branche, regle, geste, …, faits }`, `geste` valant
// `hors-regime` (régime 7, ou base hors de la chaîne), `contrat-illisible` (la clé `relecture` mal formée), `pause`
// (des commentaires que la décision ne lit pas), ou le geste de `decider`. `faits` : `sensible`, `exiges`, le couple
// `modele`/`effort` de la session à créer (A-128 : `relecture.sensible` quand le diff touche un chemin sensible ou
// que deux verdicts sont exigés, `relecture.ordinaire` sinon), et `auteur`, `conducteur`, lus sur la dernière demande.
// `jouer <n>` refait la décision de la PR n et joue ce qui s'écrit sur GitHub : une étiquette (la nouvelle posée avant
// que l'ancienne soit retirée, A-84), le commentaire du plafond, de la panne ou de l'illisible ; au plafond, l'étiquette
// d'abord, puis le commentaire : un plafond à moitié écrit se rejoue entier, ses lignes avec lui. Rejoué après un retrait
// refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur : son étiquette s'est posée avant
// son commentaire, la marque la plus récente (A-189, point 1). Il écrit une ligne
// JSON : la décision, `joue` (vrai s'il a écrit), et `lignes`, ce que le modèle envoie (`send_message`). Quand « même
// contenu propre » garde le verdict ou le refus d'un tour au sommet d'avant, la décision porte `note` : `etiqueter` écrit
// la note de même contenu (`Même contenu — sommet <tête> — tour <k> <validé|refusé> au sommet <sha> — <raison>`, la
// raison étant la dernière ligne non vide de la sortie d'erreur du calcul, ou `sans raison écrite`) après la pose et
// avant le retrait ; refusée, la ligne JSON et ses lignes partent avant la sortie 7 (A-240 (1)). `noter` (règle 2,
// l'étiquette déjà en place) n'écrit que la note, ne touche à aucune étiquette, n'a aucune ligne. Une ligne ne
// part qu'au changement d'étiquette (A-85, A-118), ou avec le commentaire du plafond, qui ne s'écrit qu'une fois. Une
// étiquette déjà posée ne renvoie rien si les événements de la PR la disent posée après sa marque la plus récente (un
// passage rejoué) ; posée avant (restée d'un tour d'avant), à la même seconde, ou sans pose lisible, ses lignes
// partent (`marque` : la date de cette marque, rendue avec un geste `etiqueter`). Un geste de
// session (`distribuer`, `completer`, `remplacer`, `reecrire`) n'écrit rien : c'est au modèle de le jouer.
// `distribuer <n> --sommet <sha> --couple <modele>/<effort> [<session>…]` écrit la distribution d'un geste de session,
// après que le modèle a créé ou relancé les sessions (A-85, règle 6) : il refait la décision, refuse (sortie 3) si le
// geste, le sommet ou le couple ont changé depuis ce que le modèle a lu, et compose la liste. `--remplace <id>` : la
// session que le modèle tient pour hors service (morte), quand il n'a pas de fichier `--sessions`. `distribuer`
// (règle 4 ou 6) : les sessions du tour, autant que `nombre` ; `completer` : les sessions ajoutées, autant que
// `manque` ; `remplacer` : la session qui remplace ; `reecrire` : aucune (la distribution est redite, `(relance …)`).
// `veille` lance `passe` toutes les `--pause` secondes (120) pendant `--duree` minutes (25 : l'outil Bash arrête une
// tâche de fond à 30 minutes), sans jamais commencer une pause qui finirait après, et s'arrête dès qu'une
// PR, hors de `--taire`, demande un geste : `VEILLE GESTE`, puis une ligne `GESTE <n> <geste> règle <r>` par PR. Les
// gestes `rien`, `hors-regime` et `pause` ne réveillent personne. GitHub illisible : `PAUSE`, la veille continue.
// Au bout de la durée : `VEILLE FINIE`. Toute autre sortie de `passe` : `VEILLE ARRÊTÉE sortie <c>`, avec son code.
// La sortie d'erreur d'une passe sortie en 0 ou en 5 (une installation en échec, puis GitHub muet) passe sur celle de
// la veille, dans son journal. `--attendre` : une pause avant la première passe aussi (une veille relancée sur une
// sortie à rejouer, 9, 12 ou une autre, rejoue au réveil suivant, pas tout de suite).
//
// Sorties : 0 fait ; 2 usage ou entrée mal formée ; 3 la PR est fermée, ou le geste, le sommet ou le couple ont changé
// (rien n'est écrit) ; 5 GitHub illisible ; 6 le dossier n'est pas celui d'un projet de la chaîne, ou pas propre, ou
// `flock` manque, ou un calcul dit qu'un outil de la chaîne manque au poste (sa sortie 69 : git plus ancien que 2.41,
// `jq` absent, la grammaire des identifiants introuvable ; `jq` absent, `github.sh` le dit aussi, sa sortie 69 à son
// chargement), jamais une lecture illisible ni GitHub illisible (A-192, point 1) ; 7 une écriture sur GitHub refusée (la pose d'une étiquette ou un commentaire ; un retrait refusé ne
// l'est pas : `retirer_label` le tait) ; 9 le verrou du dossier pas obtenu en 300 secondes ; 12 git (fetch, switch) en
// échec. L'horloge est celle de la machine ; `RELECTEUR_HORLOGE_BANC` (millisecondes) la fixe,
// seulement quand `FAUX_GH` (le faux GitHub des bancs) est posé.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = fileURLToPath(import.meta.url);
const DOSSIER = process.cwd();
const CHAINE = join(DOSSIER, 'scripts/chaine');
const OUTILS = ['github.sh', 'decision-relecteur.mjs', 'verdict.mjs', 'double-relecture.mjs', 'meme-contenu.sh', 'chemins-sensibles.mjs', 'revue-exigee.mjs', 'sujet.sh'];
const ROUTE = 'repos/{owner}/{repo}';
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const MODELES = ['opus', 'sonnet'];
const ETATS = ['vivante', 'morte', 'plafond', 'couple'];
const DEFAUTS = { delai: 120, ordinaire: { modele: 'opus', effort: 'medium' }, sensible: { modele: 'opus', effort: 'xhigh' } };

class Arret extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const arreter = (code, message) => {
  throw new Arret(code, message);
};
// `core.hooksPath` vide et `core.fsmonitor` coupé, pour chaque git que le Relecteur ou un script lancent : ajoutés aux
// `GIT_CONFIG_*` de la session (une réécriture d'URL, par exemple), jamais à leur place.
function environnementGit() {
  const env = { ...process.env };
  const n = Number(env.GIT_CONFIG_COUNT ?? 0);
  if (!Number.isSafeInteger(n) || n < 0) arreter(6, `GIT_CONFIG_COUNT illisible : ${env.GIT_CONFIG_COUNT}`);
  [['core.hooksPath', ''], ['core.fsmonitor', 'false']].forEach(([cle, valeur], i) => {
    env[`GIT_CONFIG_KEY_${n + i}`] = cle;
    env[`GIT_CONFIG_VALUE_${n + i}`] = valeur;
  });
  env.GIT_CONFIG_COUNT = String(n + 2);
  return env;
}
let ENV;
const jouer = (commande, args, options = {}) => spawnSync(commande, args, { cwd: DOSSIER, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: (ENV ??= environnementGit()), ...options });
const git = (...args) => jouer('git', args);
const gitOk = (...args) => {
  const r = git(...args);
  if (r.status !== 0) arreter(12, `git ${args.join(' ')} : ${(r.stderr || '').trim().split('\n').at(-1)}`);
  return r.stdout.trim();
};
// Une fonction de github.sh, sourcé depuis scripts/chaine/ de develop.
const github = (fonction, ...args) => jouer('bash', ['-c', 'set -o pipefail; source "$1"; shift; "$@"', '_', join(CHAINE, 'github.sh'), fonction, ...args]);

// La seule lecture de GitHub : `lire_github`, pages concaténées rendues en un tableau.
function lire(route, { pages = false } = {}) {
  const r = jouer('bash', ['-c', `set -o pipefail; source "$1"; lire_github "$2" ${pages ? '--paginate' : ''} | jq -cs 'if length == 1 then .[0] elif all(.[]; type == "array") then add else error("pages") end'`, '_', join(CHAINE, 'github.sh'), route]);
  // `github.sh` sort en 69 dès son chargement quand `jq` manque au poste : il le dirait de chaque lecture. Le poste ne
  // porte pas la chaîne, sortie 6, comme pour la sortie 69 d'un calcul ; jamais « GitHub illisible » (5), dont la veille
  // ferait une pause sans fin, sans une ligne à personne (A-192 point 1, A-197 point 1).
  sansOutil('github.sh', r);
  if (r.status !== 0) arreter(5, (r.stderr || '').trim() || `GitHub illisible (${route})`);
  return JSON.parse(r.stdout);
}

function preparer() {
  const manque = OUTILS.filter((o) => !existsSync(join(CHAINE, o)));
  if (manque.length > 0) arreter(6, `scripts/chaine/ incomplet (${manque.join(', ')}) : rejouer l'étape 0 de fusionner, sujet et relecture`);
  const sale = git('status', '--porcelain');
  if (sale.status !== 0 || sale.stdout.trim() !== '') arreter(6, 'le dossier du Relecteur n\'est pas propre : il ne sert qu\'au Relecteur, rien ne s\'y écrit');
  if (gitOk('rev-parse', '--is-shallow-repository') !== 'false') gitOk('fetch', '-q', '--unshallow', 'origin');
  rapatrier();
  gitOk('switch', '-q', '--detach', 'refs/remotes/origin/develop');
  if (existsSync(join(DOSSIER, 'pnpm-lock.yaml'))) {
    const empreinte = gitOk('rev-parse', 'HEAD:pnpm-lock.yaml');
    const temoin = join(gitOk('rev-parse', '--absolute-git-dir'), 'relecteur-dependances');
    // Le témoin garde l'empreinte du lockfile essayé et l'issue : une installation en échec ne se retente qu'au
    // lockfile suivant, et les PR qui en ont besoin reçoivent la cause « dépendances de develop ».
    const lu = existsSync(temoin) ? readFileSync(temoin, 'utf8').trim().split(' ') : [];
    if (lu[0] === empreinte && (lu[1] === 'echec' || existsSync(join(DOSSIER, 'node_modules')))) DEPENDANCES = lu[1] !== 'echec';
    else {
      const r = jouer('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], { stdio: ['ignore', 'ignore', 'pipe'] });
      DEPENDANCES = r.status === 0;
      if (!DEPENDANCES) process.stderr.write(`relecteur : pnpm install en échec (sortie ${r.status}) :\n${(r.stderr || '').trim()}\n`);
      writeFileSync(temoin, `${empreinte} ${DEPENDANCES ? 'faite' : 'echec'}\n`);
    }
  }
}
let DEPENDANCES = true;
// Toutes les branches d'origin relues : à la préparation, et une seconde fois avant de dire une tête introuvable.
const rapatrier = () => gitOk('fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*');

// La clé `relecture` du contrat d'une base : `null` (pas de contrat, ou pas de clé : régime 7), `'illisible'`, ou
// la clé lue, ses valeurs par défaut complétées. `depuis` : UTC en `Z`, avec ou sans millisecondes ; un décalage
// (`+00:00`) n'est pas admis. `modele` : un alias, `opus` ou `sonnet`, jamais un identifiant daté.
function contrat(base) {
  if (git('cat-file', '-e', `refs/remotes/origin/${base}:.claude/chaine.json`).status !== 0) return null;
  let c;
  try {
    c = JSON.parse(gitOk('show', `refs/remotes/origin/${base}:.claude/chaine.json`));
  } catch {
    return 'illisible';
  }
  if (c === null || typeof c !== 'object' || !Object.hasOwn(c, 'relecture')) return null;
  const r = c.relecture;
  const couple = (x) => x === undefined || (x !== null && typeof x === 'object' && MODELES.includes(x.modele) && EFFORTS.includes(x.effort));
  if (r === null || typeof r !== 'object' || typeof r.depuis !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?Z$/.test(r.depuis) || !Number.isFinite(Date.parse(r.depuis))) return 'illisible';
  if (r.delai !== undefined && !(Number.isSafeInteger(r.delai) && r.delai >= 1)) return 'illisible';
  if (!couple(r.ordinaire) || !couple(r.sensible)) return 'illisible';
  return { depuis: Date.parse(r.depuis), delai: r.delai ?? DEFAUTS.delai, ordinaire: r.ordinaire ?? DEFAUTS.ordinaire, sensible: r.sensible ?? DEFAUTS.sensible };
}

// Le diff propre de la PR : `{ fichiers }`, un chemin par élément, ou `{ cause, a }` quand il ne se lit pas, `a` étant
// le destinataire de la ligne (`auteur` pour une forme refusée, seule cause qui soit à lui ; `architecte` sinon).
// La dernière ligne qu'une commande a écrite, sur sa sortie d'erreur ou sinon sur sa sortie standard (`sujet.sh` écrit
// son motif sur la seconde) ; jamais vide : une trace vide ne se reconnaîtrait plus (`corpsLu` retire les blancs).
const derniere = (r) => `${r.stderr ?? ''}\n${r.stdout ?? ''}`.split('\n').map((l) => l.trim()).filter(Boolean).at(-1) ?? `sortie ${r.status}`;
function liste(pr, json) {
  const { base, tete, n } = pr;
  if ((json.head.repo?.full_name ?? null) !== (json.base.repo?.full_name ?? null)) return { cause: 'PR de fourche : sa tête vit hors du dépôt, le Relecteur ne la lit pas', a: 'architecte' };
  // Un push entre la préparation et la lecture de la PR : la tête n'est pas encore là. Origin relu une fois, avant
  // de la dire introuvable (un commentaire et une ligne à l'architecte pour rien, sinon).
  const presente = () => git('cat-file', '-e', `${tete}^{commit}`).status === 0;
  if (!presente()) rapatrier();
  if (!presente()) return { cause: `tête introuvable : ${tete} n'est sur aucune branche d'origin`, a: 'architecte' };
  if (base === 'develop') {
    const depart = git('merge-base', 'refs/remotes/origin/develop', tete);
    const d = depart.status === 0 ? git('-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', depart.stdout.trim(), tete) : depart;
    return d.status === 0 ? { fichiers: d.stdout.split('\n').filter(Boolean) } : { cause: `diff illisible : ${derniere(d)}`, a: 'architecte' };
  }
  const a = jouer('bash', [join(CHAINE, 'sujet.sh'), 'a-juger', tete, base, String(n)]);
  if (a.status !== 0 && !DEPENDANCES) return { cause: 'dépendances de develop : pnpm install en échec, `sujet.sh a-juger` ne juge pas les retouches ; retentée au prochain lockfile de develop, ou par un Relecteur neuf', a: 'architecte' };
  if (a.status === 4) return { cause: `forme refusée par \`sujet.sh a-juger\` : ${derniere(a)}`, a: 'auteur' };
  if (a.status !== 0) return { cause: `\`sujet.sh a-juger\` en échec (sortie ${a.status}) : ${derniere(a)}`, a: 'architecte' };
  const [premiere, seconde] = a.stdout.replace(/\n$/, '').split(/\n\n/);
  return { fichiers: (seconde ?? premiere ?? '').split('\n').filter(Boolean) };
}

function sensible(fichiers, base) {
  if (fichiers.length === 0) return false;
  const r = jouer('node', [join(CHAINE, 'chemins-sensibles.mjs'), `origin/${base}`], { input: `${fichiers.join('\n')}\n` });
  return r.status !== 0 || r.stdout.trim() !== '';
}

// Un calcul sorti en 69 dit qu'un outil de la chaîne manque au poste (git plus ancien que 2.41, `jq` absent, la grammaire
// des identifiants introuvable) : il le dirait de chaque PR. Le poste ne porte pas la chaîne, sortie 6, comme des
// calculs absents ; jamais « illisible », qui tracerait chaque PR et le redirait à chaque délai (A-192, point 1). La
// cause : la première ligne qui n'est pas le seul mot du verdict, sur la sortie d'erreur puis sur la sortie standard
// (`double-relecture.mjs` écrit la sienne en `# illisible : …`).
function sansOutil(calcul, r) {
  if (r.status !== 69) return;
  const cause = `${r.stderr ?? ''}\n${r.stdout ?? ''}`.split('\n').map((l) => l.replace(/^#\s*(?:illisible\s*:\s*)?/, '').trim()).find((l) => l !== '' && l !== 'illisible');
  arreter(6, `${calcul} : un outil de la chaîne manque au poste (sortie 69) : ${cause ?? 'sans cause écrite'}`);
}

function exiges(fichiers, pr) {
  const r = jouer('node', [join(CHAINE, 'double-relecture.mjs'), '--base', pr.base, '--tete', pr.tete, '--titre', pr.titre, '--branche', pr.branche], { input: fichiers.length ? `${fichiers.join('\n')}\n` : '' });
  sansOutil('double-relecture.mjs', r);
  return r.status === 0 ? 1 : r.status === 20 ? 2 : 'illisible';
}

function horloge() {
  const banc = process.env.RELECTEUR_HORLOGE_BANC;
  return banc !== undefined && (process.env.FAUX_GH ?? '') !== '' ? Number(banc) : Date.now();
}

const MODULES = {};
async function modules() {
  if (!MODULES.decision) {
    MODULES.decision = await import(pathToFileURL(join(CHAINE, 'decision-relecteur.mjs')).href);
    MODULES.verdict = await import(pathToFileURL(join(CHAINE, 'verdict.mjs')).href);
  }
  return MODULES;
}

function lireSessions(argv) {
  const i = argv.indexOf('--sessions');
  if (i === -1) return {};
  const fichier = argv.splice(i, 2)[1];
  let etats;
  try {
    etats = JSON.parse(readFileSync(fichier ?? '', 'utf8'));
  } catch (e) {
    return arreter(2, `--sessions : ${fichier} ne se lit pas en JSON (${e.message})`);
  }
  if (etats === null || typeof etats !== 'object' || Array.isArray(etats)) arreter(2, `--sessions : ${fichier} n'est pas un objet { <session>: vivante | morte | plafond | couple }`);
  for (const [id, etat] of Object.entries(etats)) {
    if (!ID.test(id)) arreter(2, `--sessions : « ${id} » n'est pas un identifiant de session`);
    if (!ETATS.includes(etat)) arreter(2, `--sessions : ${id} vaut « ${etat} », attendu ${ETATS.join(', ')}`);
  }
  return etats;
}
const option = (argv, nom) => {
  const i = argv.indexOf(nom);
  return i === -1 ? null : argv.splice(i, 2)[1] ?? arreter(2, `${nom} : une valeur est attendue`);
};

// La décision d'une PR (son JSON REST), avec les faits que la session à créer demande.
async function decision(json, sessions) {
  const { decision: d, verdict: v } = await modules();
  const pr = { n: json.number, base: json.base.ref, tete: json.head.sha, branche: json.head.ref, titre: json.title ?? '' };
  const tete = { pr: pr.n, base: pr.base, tete: pr.tete, branche: pr.branche };
  if (pr.base !== 'develop' && !/^sujet\/[A-Za-z0-9._-]+$/.test(pr.base)) return { ...tete, regle: null, geste: 'hors-regime', raison: 'base hors de la chaîne' };
  const cle = contrat(pr.base);
  if (cle === 'illisible') return { ...tete, regle: null, geste: 'contrat-illisible', raison: `clé relecture de origin/${pr.base}:.claude/chaine.json mal formée` };
  if (cle === null || !(Date.parse(json.created_at) > cle.depuis)) return { ...tete, regle: null, geste: 'hors-regime', raison: 'régime 7' };
  const etiquettes = (json.labels ?? []).map((l) => l.name);
  const commun = { numero: pr.n, etiquettes, branche: pr.branche, tete: pr.tete, maintenant: horloge(), delaiMs: cle.delai * 60_000, sessions };
  // La file d'abord : hors d'elle, aucun commentaire n'est lu.
  const avant = d.decider({ ...commun, commentaires: [], exiges: 1, sensible: false });
  if (['hors-file', 'livraison', 'renvoi-du-capitaine'].includes(avant.raison)) return { ...tete, ...avant };
  const commentaires = lire(`${ROUTE}/issues/${pr.n}/comments?per_page=100`, { pages: true });
  try {
    const lue = liste(pr, json);
    if (lue.cause !== undefined) return { ...tete, ...illisible(d, commentaires, commun, lue) };
    const { fichiers } = lue;
    const faits = { sensible: sensible(fichiers, pr.base), exiges: exiges(fichiers, pr) };
    const memeContenu = {};
    // La raison de chaque calcul : la dernière ligne non vide de sa sortie d'erreur (la sortie standard est le mot du
    // verdict), pour la note de même contenu (A-224) ; la décision, pure, ne la reçoit pas.
    const raisons = {};
    for (const s of d.sommetsDesTours(commentaires)) {
      if (s === pr.tete) continue;
      const r = jouer('bash', [join(CHAINE, 'meme-contenu.sh'), s, pr.tete, pr.base]);
      sansOutil('meme-contenu.sh', r);
      memeContenu[s] = r.status === 0 ? true : r.status === 20 ? false : 'illisible';
      raisons[s] = (r.stderr ?? '').split('\n').map((l) => l.trim()).filter(Boolean).at(-1) ?? 'sans raison écrite';
    }
    const decide = d.decider({ ...commun, commentaires, exiges: faits.exiges, sensible: faits.sensible, memeContenu });
    const geste = decide.note === undefined ? decide : { ...decide, note: { ...decide.note, raison: raisons[decide.note.sommet] ?? 'sans raison écrite' } };
    const marques = d.lireMarques(commentaires, { tolerant: true });
    const demande = marques.demandes.at(-1) ?? { auteur: null, conducteur: null };
    const couple = faits.sensible || faits.exiges === 'illisible' || faits.exiges >= 2 ? cle.sensible : cle.ordinaire;
    // Pour `jouer` : la date de la marque la plus récente (`dernier`), que la pose d'une étiquette déjà là doit suivre.
    const marque = geste.geste === 'etiqueter' ? { marque: commentaires[marques.dernier]?.created_at ?? null } : {};
    return { ...tete, ...geste, ...marque, faits: { ...faits, modele: couple.modele, effort: couple.effort, auteur: demande.auteur, conducteur: demande.conducteur } };
  } catch (e) {
    if (e instanceof v.LectureIllisible) return { ...tete, regle: null, geste: 'pause', raison: `commentaires illisibles : ${e.message}` };
    throw e;
  }
}

// Un diff propre qui ne se lit pas : le geste `illisible` de la décision, avec sa cause propre (A-113, A-116) ; « rien »
// tant que la trace de cette cause est le plus récent des commentaires à marque et date de `relecture.delai` au plus.
function illisible(d, commentaires, commun, { cause, a }) {
  const marques = d.lireMarques(commentaires, { tolerant: true });
  const commentaire = `${d.TEXTE_ILLISIBLE}${cause}`;
  const signale = marques.illisibles.some((t) => t.rang > marques.dernier && t.texte.startsWith(commentaire) && commun.maintenant - Date.parse(t.date) <= commun.delaiMs);
  if (signale) return { regle: null, geste: 'rien', raison: 'illisible-signale' };
  const demande = marques.demandes.at(-1) ?? { auteur: null };
  const texte = `PR ${commun.numero} : lecture illisible : ${cause}`;
  const lignes = a === 'auteur' && demande.auteur !== null ? [{ a: 'auteur', session: demande.auteur, texte }] : [{ a: 'architecte', session: null, texte }];
  return { regle: null, geste: 'illisible', commentaire, lignes };
}

// Vrai quand la dernière pose de l'étiquette `nom` sur la PR `n` (ses événements, toutes pages) est plus récente que
// `marque` : `jouer` rejoue un passage qui l'a posée, ses lignes sont parties ou perdues avec lui (A-118). Faux quand
// elle est plus ancienne (une étiquette restée d'un tour d'avant, que l'auteur n'a pas retirée), à la même seconde,
// sans marque ou sans pose lue : dans le doute, la ligne part.
function poseeApres(n, nom, marque) {
  if (marque === null || !Number.isFinite(Date.parse(marque))) return false;
  const evenements = lire(`${ROUTE}/issues/${n}/events?per_page=100`, { pages: true });
  if (!Array.isArray(evenements)) arreter(5, `GitHub illisible (événements de la PR ${n})`);
  const pose = evenements.findLast((e) => e?.event === 'labeled' && typeof e.label?.name === 'string' && e.label.name.normalize('NFC') === nom);
  return pose !== undefined && Date.parse(pose.created_at) > Date.parse(marque);
}

const ecrire = (fonction, ...args) => {
  const r = github(fonction, ...args);
  if (r.status !== 0) arreter(7, `écriture refusée (${fonction} ${args[0]}) : ${(r.stderr || '').trim().split('\n').at(-1)}`);
};

async function passe() {
  preparer();
  const pulls = lire(`${ROUTE}/pulls?state=open&per_page=100`, { pages: true });
  for (const json of [...pulls].sort((a, b) => a.number - b.number)) process.stdout.write(`${JSON.stringify(await decision(json, {}))}\n`);
}

const numero = (texte) => (/^[1-9][0-9]*$/.test(texte ?? '') ? Number(texte) : arreter(2, 'un numéro de PR est attendu'));

async function jouerGeste(argv) {
  const sessions = lireSessions(argv);
  const n = numero(argv[0]);
  preparer();
  const json = lire(`${ROUTE}/pulls/${n}`);
  if (json.state !== 'open') arreter(3, `PR ${n} fermée : aucun geste`);
  const g = await decision(json, sessions);
  const avant = (json.labels ?? []).map((l) => l.name.normalize('NFC'));
  let joue = false;
  let lignes = g.lignes ?? [];
  if (g.geste === 'etiqueter' || g.geste === 'plafonner') {
    // La nouvelle avant l'ancienne (A-84) : jamais une PR sans étiquette. Déjà posée après la marque la plus récente :
    // un passage rejoué, aucune ligne ne repart ; posée avant, une étiquette restée : ses lignes partent.
    // Un plafond ne rend pas de `marque` : son commentaire est neuf par construction, ses lignes partent toujours, même
    // sur une étiquette `à-reprendre` restée (le plafond ne se décide que sans commentaire de plafond depuis la
    // dernière décision).
    if (!avant.includes(g.poser)) ecrire('poser_label', String(n), g.poser);
    else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];
    joue = true;
  }
  // Au plafond, après l'étiquette : un commentaire refusé laisse le plafond à décider de nouveau, ses lignes entières.
  if (g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible') {
    ecrire('commenter', String(n), g.commentaire);
    joue = true;
  }
  // La note de même contenu (A-224, A-239 (1)) : après la pose, avant le retrait. Refusée, la ligne JSON part d'abord,
  // ses lignes avec elle, puis la sortie 7 (A-240 (1)) : `à-relire` reste, le rejeu écrit la note sans renvoyer de
  // ligne (l'étiquette est posée après la marque la plus récente, la note n'en est pas une).
  if (g.note !== undefined) {
    const { decision: d } = await modules();
    try {
      ecrire('commenter', String(n), d.ecrireNote({ tete: g.tete, ...g.note }));
    } catch (e) {
      if (e instanceof Arret && e.code === 7) process.stdout.write(`${JSON.stringify({ ...g, joue: true, lignes })}\n`);
      throw e;
    }
    joue = true;
  }
  for (const e of g.retirer ?? []) ecrire('retirer_label', String(n), e);
  process.stdout.write(`${JSON.stringify({ ...g, joue, lignes })}\n`);
}

async function distribuer(argv) {
  const sessions = lireSessions(argv);
  const sommet = option(argv, '--sommet') ?? arreter(2, '--sommet <sha> est attendu : le sommet que le geste nommait');
  const couple = option(argv, '--couple') ?? arreter(2, '--couple <modele>/<effort> est attendu : celui des sessions créées ou réemployées');
  const remplace = option(argv, '--remplace');
  if (remplace !== null) {
    if (!ID.test(remplace)) arreter(2, '--remplace : un identifiant de session est attendu');
    sessions[remplace] ??= 'morte';
  }
  const n = numero(argv[0]);
  const ids = argv.slice(1);
  if (ids.some((s) => !ID.test(s)) || new Set(ids).size !== ids.length) arreter(2, 'des identifiants de session distincts sont attendus');
  preparer();
  const { decision: d } = await modules();
  const json = lire(`${ROUTE}/pulls/${n}`);
  if (json.state !== 'open') arreter(3, `PR ${n} fermée : aucune distribution écrite`);
  const g = await decision(json, sessions);
  const attendu = { distribuer: g.nombre, completer: g.manque, remplacer: 1, reecrire: 0 }[g.geste];
  if (attendu === undefined) arreter(3, `PR ${n} : le geste est maintenant « ${g.geste} » : aucune distribution écrite`);
  if (g.sommet !== sommet) arreter(3, `PR ${n} : le sommet est maintenant ${g.sommet} : aucune distribution écrite`);
  const voulu = `${g.faits.modele}/${g.faits.effort}`;
  if (couple !== voulu) arreter(3, `PR ${n} : le couple est maintenant ${voulu}, pas ${couple} : aucune distribution écrite`);
  if (ids.length !== attendu) arreter(2, `PR ${n} : ${g.geste} attend ${attendu} session(s), ${ids.length} reçue(s)`);
  if (g.geste !== 'distribuer' && ids.some((s) => g.sessions.includes(s))) arreter(2, `PR ${n} : une session ajoutée est déjà du tour`);
  const forme = {
    distribuer: () => ({ sessions: ids, mention: g.regle === 4 ? d.MENTION_ARBITRAGE : null, cible: null }),
    completer: () => ({ sessions: [...g.sessions, ...ids], mention: 'complète', cible: null }),
    remplacer: () => ({ sessions: g.sessions.map((s) => (s === g.session ? ids[0] : s)), mention: 'remplace', cible: g.session }),
    reecrire: () => ({ sessions: g.sessions, mention: 'relance', cible: g.session }),
  }[g.geste]();
  const texte = d.ecrireDistribution({ tour: g.tour, sommet: g.sommet, ...forme });
  ecrire('commenter', String(n), texte);
  process.stdout.write(`${JSON.stringify({ pr: n, geste: g.geste, tour: g.tour, sommet: g.sommet, sessions: forme.sessions, distribution: texte, faits: g.faits })}\n`);
}

function veille(argv) {
  const lireOption = (nom, defaut) => {
    const i = argv.indexOf(nom);
    return i === -1 ? defaut : argv[i + 1];
  };
  const pause = Number(lireOption('--pause', '120'));
  const duree = Number(lireOption('--duree', '25'));
  const sondes = Number(lireOption('--sondes', 'Infinity'));
  const taire = new Set(String(lireOption('--taire', '')).split(',').filter(Boolean).map(Number));
  const differee = argv.includes('--attendre');
  if (![pause, duree].every((x) => Number.isFinite(x) && x >= 0)) arreter(2, '--pause et --duree : des nombres');
  const fin = Date.now() + duree * 60_000;
  const attendre = (s) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000);
  for (let k = 0; k < sondes && Date.now() <= fin; k++) {
    // Jamais une pause qui finirait après la durée : la veille finit sous le plafond de l'outil Bash (A-180). Avec
    // `--attendre`, la première passe aussi vient après une pause : rejouer au réveil suivant, pas tout de suite.
    if (k > 0 || differee) {
      if (Date.now() + pause * 1000 > fin) break;
      attendre(pause);
    }
    const r = jouer(process.execPath, [ICI, 'passe']);
    // Ce que la passe écrit sur sa sortie d'erreur (une installation en échec) va au journal de la veille, même quand
    // GitHub la fait ensuite sortir en 5 : le témoin dit « echec », l'installation ne se retentera pas.
    if ((r.status === 0 || r.status === 5) && r.stderr) process.stderr.write(r.stderr);
    if (r.status === 5) {
      process.stdout.write(`PAUSE GitHub illisible : ${(r.stderr || '').trim().split('\n').at(-1)}\n`);
      continue;
    }
    if (r.status !== 0) {
      process.stdout.write(`${(r.stderr || '').trim()}\nVEILLE ARRÊTÉE sortie ${r.status}\n`);
      process.exit(r.status ?? 1);
    }
    const aJouer = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((g) => !['rien', 'hors-regime', 'pause'].includes(g.geste) && !taire.has(g.pr));
    if (aJouer.length > 0) {
      process.stdout.write(`VEILLE GESTE\n${aJouer.map((g) => `GESTE ${g.pr} ${g.geste} règle ${g.regle ?? '—'}`).join('\n')}\n`);
      return;
    }
  }
  process.stdout.write('VEILLE FINIE\n');
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(ICI) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

// Le verrou du dossier : la sous-commande se relance sous `flock`, qui attend 300 secondes au plus (sortie 9 sinon). La
// veille ne le prend pas : chaque passe qu'elle lance le prend, et un geste du modèle attend la fin de la passe en cours.
function sousVerrou(argv) {
  if (process.env.RELECTEUR_VERROU) return null;
  const dossierGit = spawnSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: DOSSIER, encoding: 'utf8' });
  if (dossierGit.status !== 0) arreter(6, 'le dossier courant n\'est pas un dépôt git');
  if (spawnSync('flock', ['-V']).error) arreter(6, 'flock (util-linux) est requis');
  const verrou = join(dossierGit.stdout.trim(), 'relecteur.verrou');
  const r = spawnSync('flock', ['-w', '300', '-E', '9', verrou, process.execPath, ICI, ...argv], { cwd: DOSSIER, stdio: 'inherit', env: { ...process.env, RELECTEUR_VERROU: verrou } });
  if (r.status === 9) process.stderr.write('relecteur : le dossier est tenu par une autre sous-commande depuis 300 secondes\n');
  return r.status ?? 1;
}

const [sous, ...reste] = process.argv.slice(2);
if (estPointEntree()) {
  try {
    if (['passe', 'jouer', 'distribuer'].includes(sous)) {
      const code = sousVerrou(process.argv.slice(2));
      if (code !== null) process.exit(code);
    }
    if (sous === 'passe') await passe();
    else if (sous === 'jouer') await jouerGeste(reste);
    else if (sous === 'distribuer') await distribuer(reste);
    else if (sous === 'veille') veille(reste);
    else arreter(2, 'usage : relecteur.mjs passe | jouer <n> [--sessions <fichier>] | distribuer <n> --sommet <sha> --couple <modele>/<effort> [--remplace <id>] [<session>…] [--sessions <fichier>] | veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--sondes <k>] [--attendre]');
  } catch (e) {
    if (!(e instanceof Arret)) throw e;
    process.stderr.write(`relecteur : ${e.message}\n`);
    process.exit(e.code);
  }
}
