// =============================================================================
// Check `PR titre` (skill socle-chaine-de-production, ticket 16) : montre à l'auteur d'une PR vers develop ou un
// sujet, dès l'ouverture, ce que le capitaine refusera à son passage : le sujet du squash à plus de 120 caractères,
// un titre que commitlint refuse (sous-PR vers `sujet/*` seulement, comme `sujet.sh fusionner`), la section de revue
// absente, la ligne `/security-review` absente sur un chemin sensible, un titre de code sur de la documentation seule.
//
// Aucune règle n'est écrite ici : le check appelle celles du capitaine.
//   - `motifsDuCapitaine` et `lireBase` de `revue-exigee.mjs` (skill fusionner) : les motifs, sur le contrat de la base ;
//   - `sujet.sh a-juger` (skill sujet) : les fichiers qu'une sous-PR fait juger, une PR de réception de develop
//     reconnue à sa forme (sa résolution seule, puis sa résolution et ses retouches, jugées chacune comme le capitaine,
//     jamais le develop apporté), et son refus de forme ;
//   - `sujet.sh est-livraison` : une tête `sujet/<nom>` (au sommet d'origin/sujet/<nom>) ou `livraison/<nom>-<AAAAMMJJ-HHMM>` vers develop dispensée de
//     la revue sur la preuve du capitaine (`livraison_intermediaire` de github.sh), jamais sur le seul nom de branche ;
//   - sinon le diff depuis le merge-base de la base, comme `passer.sh`.
//
// Entrées, par l'environnement, jamais par le shell : PR_TITRE, PR_NUMERO, PR_BASE (`base.ref`), PR_TETE
// (`head.ref`), PR_SOMMET (`head.sha`), requises ; PR_CORPS facultative (corps vide ou nul de GitHub : `""`).
// Refs `origin/develop` et `origin/<base>` déjà là (actions/checkout, `fetch-depth: 0`) : aucun appel réseau.
//
// Outils : `../chaine/sujet.sh` et `../chaine/revue-exigee.mjs` dans un projet (`scripts/github/` → `scripts/chaine/`) ;
// dans le plugin, `../../../../sujet/scripts/sujet.sh` et `../../../../fusionner/scripts/revue-exigee.mjs`. En CI
// (`GITHUB_ACTIONS=true`), seul le chemin du projet vaut : un outil absent rend le check rouge, sans repli.
//
// Sorties : 0 conforme · 1 au moins un motif, chacun sur une ligne `✗ <motif>` de la sortie d'erreur · 2 entrée absente
// ou mal formée · 3 lecture impossible (outil absent, refs absentes, clone superficiel, git ou outil en échec) : jamais
// un vert.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const LIMITE = 120;

function echouer(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

/** Les deux outils du capitaine, au chemin du projet ; hors CI, au chemin du plugin à défaut. */
function outils(enCI) {
  const projet = { sujet: join(ICI, '../chaine/sujet.sh'), revue: join(ICI, '../chaine/revue-exigee.mjs') };
  const plugin = { sujet: join(ICI, '../../../../sujet/scripts/sujet.sh'), revue: join(ICI, '../../../../fusionner/scripts/revue-exigee.mjs') };
  const pose = { sujet: '/maj-skills:sujet poser', revue: '/maj-skills:fusionner poser' };
  const trouves = {};
  const manquent = [];
  for (const cle of ['sujet', 'revue']) {
    if (existsSync(projet[cle])) trouves[cle] = projet[cle];
    else if (!enCI && existsSync(plugin[cle])) trouves[cle] = plugin[cle];
    else manquent.push(`scripts/chaine/${cle === 'sujet' ? 'sujet.sh' : 'revue-exigee.mjs'} absent (le poser : ${pose[cle]})`);
  }
  if (manquent.length)
    echouer(3, `PR titre : outil du capitaine introuvable${enCI ? ' (en CI, seul le chemin du projet vaut)' : ''} : ${manquent.join(' ; ')}`);
  return trouves;
}

/** Les entrées, lues dans l'environnement ; une absente ou mal formée : sortie 2. */
function entrees(env) {
  const requises = ['PR_TITRE', 'PR_NUMERO', 'PR_BASE', 'PR_TETE', 'PR_SOMMET'];
  const absentes = requises.filter((v) => (env[v] ?? '') === '');
  if (absentes.length) echouer(2, `PR titre : variable d'entrée absente ou vide : ${absentes.join(', ')}`);
  const e = { titre: env.PR_TITRE, n: env.PR_NUMERO, base: env.PR_BASE, tete: env.PR_TETE, sommet: env.PR_SOMMET, corps: env.PR_CORPS ?? '' };
  if (!/^[1-9][0-9]*$/.test(e.n)) echouer(2, 'PR titre : PR_NUMERO n’est pas un numéro de PR');
  if (!/^[0-9a-f]{7,64}$/.test(e.sommet)) echouer(2, 'PR titre : PR_SOMMET n’est pas un sha de commit');
  // Un nom de branche passe en argument à git et à sujet.sh : jamais une option, jamais un blanc ni un caractère de contrôle.
  for (const [v, ref] of [['PR_BASE', e.base], ['PR_TETE', e.tete]])
    if (ref.startsWith('-') || /[\s\p{Cc}]|\.\.|^\/|\/$/u.test(ref)) echouer(2, `PR titre : ${v} n’est pas un nom de branche`);
  return e;
}

/** Une commande lue : { status, stdout, stderr } ; un lancement impossible rend status null. */
function lancer(commande, args, options = {}) {
  const r = spawnSync(commande, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
  return { status: r.error ? null : r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? (r.error ? String(r.error.message) : '') };
}
const lignes = (texte) => texte.split('\n').filter((l) => l !== '');
const derniere = (texte) => lignes(texte).at(-1) ?? '';
const lectureEchouee = (quoi, r) =>
  echouer(3, `PR titre : ${quoi} a échoué (sortie ${r.status ?? 'injouable'}) : le check ne conclut pas. ${derniere(r.stderr) || derniere(r.stdout)}`.trim());

/**
 * La sortie de `sujet.sh a-juger` : une liste, ou deux séparées par une ligne vide (PR de mise à jour : résolution, puis
 * résolution et retouches). git n'écrit jamais un chemin vide.
 */
function listesAJuger(sortie) {
  if (sortie === '') return [[]];
  const l = sortie.replace(/\n$/, '').split('\n');
  const vide = l.indexOf('');
  return vide < 0 ? [l] : [l.slice(0, vide), l.slice(vide + 1)];
}

/** `sujet.sh est-livraison` : vrai sur une livraison prouvée (0), faux sur une PR ordinaire (1), échec sinon. */
function estLivraison(sujet, e) {
  const r = lancer('bash', [sujet, 'est-livraison', e.tete, e.sommet]);
  if (r.status === 0) return true;
  if (r.status === 1) return false;
  return lectureEchouee('sujet.sh est-livraison', r);
}

async function principal() {
  const enCI = process.env.GITHUB_ACTIONS === 'true';
  const e = entrees(process.env);
  const { sujet, revue } = outils(enCI);
  const { motifsDuCapitaine, lireBase } = await import(pathToFileURL(revue).href);
  // Clone superficiel : merge-base faux, dit tel quel (jamais « refs absentes »).
  const superficiel = lancer('git', ['rev-parse', '--is-shallow-repository']);
  if (superficiel.status !== 0) lectureEchouee('git rev-parse --is-shallow-repository', superficiel);
  if (superficiel.stdout.trim() !== 'false')
    echouer(3, 'PR titre : clone superficiel, merge-base faux : le check ne conclut pas ; git fetch --unshallow d’abord (actions/checkout : fetch-depth: 0)');
  const versSujet = e.base.startsWith('sujet/');
  const motifs = [];
  const notes = [];

  // Le sujet du squash : `<titre> (#<n>)`, en caractères (passer.sh, sujet.sh fusionner).
  const longueur = [...`${e.titre} (#${e.n})`].length;
  if (longueur > LIMITE)
    motifs.push(`sujet du squash à ${longueur} caractères (> ${LIMITE}) : raccourcir le titre${versSujet ? '' : ' de la PR'}`);

  // commitlint : une sous-PR seulement ; le capitaine ne le joue pas vers develop.
  if (versSujet) {
    const r = lancer('pnpm', ['exec', 'commitlint'], { input: `${e.titre} (#${e.n})\n` });
    if (r.status === null) lectureEchouee('pnpm exec commitlint', r);
    if (r.status !== 0) motifs.push(`titre refusé par commitlint (Conventional Commits) : ${e.titre}`);
  }

  // Les listes de fichiers que le capitaine juge, dans son ordre ; `null` : rien à juger (livraison prouvée, ou refus de
  // forme). Une PR de mise à jour en a deux : sa résolution avant les checks, puis l'union avec ses retouches.
  let fichiers;
  if (versSujet) {
    const r = lancer('bash', [sujet, 'a-juger', e.sommet, e.base, e.n]);
    if (r.status === 0) fichiers = listesAJuger(r.stdout);
    else if (r.status === 4) {
      motifs.push(derniere(r.stdout) || 'PR de mise à jour refusée par sujet.sh (forme)');
      fichiers = null;
    } else lectureEchouee('sujet.sh a-juger', r);
  } else if (e.base === 'develop' && /^(sujet|livraison)\//.test(e.tete) && estLivraison(sujet, e)) {
    notes.push('livraison de sujet prouvée : chaque sous-PR a passé la revue (section de revue non exigée)');
    fichiers = null;
  } else {
    const mb = lancer('git', ['merge-base', e.sommet, `origin/${e.base}`]);
    if (mb.status !== 0) lectureEchouee(`git merge-base avec origin/${e.base} (refs absentes : fetch d'abord)`, mb);
    const d = lancer('git', ['-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', mb.stdout.trim(), e.sommet]);
    if (d.status !== 0) lectureEchouee('git diff', d);
    fichiers = [lignes(d.stdout)];
  }

  if (fichiers !== null) {
    const base = lireBase(`origin/${e.base}`);
    for (const liste of fichiers)
      for (const m of motifsDuCapitaine({ corps: e.corps, titre: e.titre, fichiers: liste, base })) if (!motifs.includes(m)) motifs.push(m);
  }

  for (const n of notes) process.stdout.write(`${n}\n`);
  if (motifs.length) {
    for (const m of motifs) process.stderr.write(`✗ ${m}\n`);
    process.exit(1);
  }
  process.stdout.write('Titre et description conformes : le capitaine les acceptera.\n');
}

await principal();
