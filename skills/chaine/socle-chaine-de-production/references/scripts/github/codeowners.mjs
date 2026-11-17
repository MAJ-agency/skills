#!/usr/bin/env node
/**
 * `.github/CODEOWNERS`, généré depuis le contrat de la chaîne (ADR « CODEOWNERS »).
 *
 * Pourquoi. Les chemins sensibles (`cheminsSensibles` de `.claude/chaine.json`) disent déjà ce qu'un
 * humain doit relire : la contre-revue et `/security-review` les lisent. GitHub, lui, ne lit que
 * CODEOWNERS. Deux listes tenues à la main divergent ; une seule source, et ce fichier en est la copie :
 * chaque chemin sensible, plus CODEOWNERS lui-même et `.claude/chaine.json`, appartient aux
 * `proprietaires` du contrat. Avec la règle « Require review from Code Owners » sur develop et main
 * (`docs/agents/chaine-admin.md`), une PR qui les touche attend l'approbation d'un propriétaire.
 *
 * Usage : node scripts/github/codeowners.mjs            gate : écart → sortie 1, avec la commande qui régénère
 *         node scripts/github/codeowners.mjs --ecrire   régénère le fichier (pnpm codeowners)
 * Sortie 2 : contrat illisible, ou qu'aucun CODEOWNERS ne sait dire (motif, propriétaire) ; rien n'est écrit.
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 */
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FICHIER = '.github/CODEOWNERS';
export const CONTRAT = '.claude/chaine.json';
export const COMMANDE = 'pnpm codeowners (node scripts/github/codeowners.mjs --ecrire)';

/** Toujours possédés, en plus des chemins sensibles : le fichier lui-même, et la source dont il est copié. */
export const TOUJOURS = [FICHIER, CONTRAT];

/**
 * Un motif de `cheminsSensibles` (moteur du gate `tickets` : relatif à la racine, `**` = tout, `*` = un
 * segment, `/` final = un dossier) que CODEOWNERS dit à l'identique, une fois ancré par `/`. Refusés : ce
 * que GitHub lit autrement (`?` et `[…]` y sont des jokers, `!` une négation qu'il ne prend pas, `#` un
 * commentaire, `\` un échappement, un blanc une fin de motif) et un motif ancré ou vide, qui ne touche rien.
 */
export function motifCodeowners(motif) {
  if (typeof motif !== 'string' || motif.trim() === '') return { erreur: 'motif vide' };
  if (motif.startsWith('/')) return { erreur: `« ${motif} » : un chemin sensible est relatif à la racine, sans « / » initial` };
  if (/[\s?[\]!#\\]/.test(motif))
    return { erreur: `« ${motif} » : blanc, « ? », « [ ] », « ! », « # » ou « \\ » ne se disent pas à l'identique dans CODEOWNERS` };
  return { motif: `/${motif.replace(/^\.\//, '')}` };
}

/** Un propriétaire que GitHub accepte : `@utilisateur`, `@organisation/équipe` ou une adresse de courriel. */
export const PROPRIETAIRE = /^(@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)?|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

/**
 * Le texte attendu de CODEOWNERS pour un contrat, ou ses erreurs.
 * @returns {{ texte: string } | { erreurs: string[] }}
 */
export function genererCodeowners(chaine) {
  const erreurs = [];
  const sensibles = chaine?.cheminsSensibles;
  const proprietaires = chaine?.proprietaires;
  if (!Array.isArray(sensibles)) erreurs.push('cheminsSensibles : une liste de chemins attendue');
  if (!Array.isArray(proprietaires) || proprietaires.length === 0)
    erreurs.push('proprietaires : au moins un propriétaire attendu (`@utilisateur`, `@organisation/équipe`) ; deux humains si les sessions publient sous le compte d’un humain (ADR « CODEOWNERS »)');
  else
    for (const p of proprietaires)
      if (typeof p !== 'string' || !PROPRIETAIRE.test(p)) erreurs.push(`proprietaires : « ${p} » n'est ni @utilisateur, ni @organisation/équipe, ni une adresse`);
  const motifs = [];
  for (const m of [...(Array.isArray(sensibles) ? sensibles : []), ...TOUJOURS]) {
    const lu = motifCodeowners(m);
    if (lu.erreur) erreurs.push(`cheminsSensibles : ${lu.erreur}`);
    else if (!motifs.includes(lu.motif)) motifs.push(lu.motif);
  }
  if (erreurs.length > 0) return { erreurs };
  const qui = [...new Set(proprietaires)].join(' ');
  const largeur = Math.max(...motifs.map((m) => m.length));
  return {
    texte: [
      `# Généré depuis ${CONTRAT} (cheminsSensibles, proprietaires) : ne pas éditer.`,
      `# Modifier ${CONTRAT}, puis régénérer : ${COMMANDE}.`,
      '# GitHub lit ce fichier sur la branche visée par la PR : une PR qui le modifie est jugée par l’ancienne version.',
      '',
      ...motifs.map((m) => `${m.padEnd(largeur)} ${qui}`),
      '',
    ].join('\n'),
  };
}

/**
 * Écarts entre le CODEOWNERS du dépôt (`null` s'il manque) et celui qu'on attend : `[]` s'ils sont égaux.
 * Les fins de ligne `\r\n` comptent comme `\n` ; tout le reste compte, commentaires compris.
 */
export function ecartsCodeowners(actuel, attendu) {
  if (actuel === null) return [`${FICHIER} absent`];
  if (actuel.replace(/\r\n/g, '\n') === attendu) return [];
  const a = actuel.replace(/\r\n/g, '\n').split('\n');
  const b = attendu.split('\n');
  const i = a.findIndex((l, k) => l !== b[k]);
  const n = i < 0 ? Math.min(a.length, b.length) : i;
  return [`${FICHIER}:${n + 1} : « ${a[n] ?? '(fin du fichier)'} », attendu « ${b[n] ?? '(fin du fichier)'} »`];
}

function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (estPointEntree()) {
  const racine = process.env.PROJET_RACINE ?? fileURLToPath(new URL('../..', import.meta.url));
  let chaine;
  try {
    chaine = JSON.parse(readFileSync(join(racine, CONTRAT), 'utf8'));
  } catch (e) {
    console.error(`codeowners : ${CONTRAT} illisible (${e.message}) : rien n'est généré`);
    process.exit(2);
  }
  const genere = genererCodeowners(chaine);
  if (genere.erreurs) {
    console.error(`codeowners : ${CONTRAT} ne se dit pas en CODEOWNERS (ADR « CODEOWNERS ») :`);
    for (const e of genere.erreurs) console.error(`  ${CONTRAT} : ${e}`);
    process.exit(2);
  }
  const chemin = join(racine, FICHIER);
  if (process.argv.includes('--ecrire')) {
    mkdirSync(dirname(chemin), { recursive: true });
    writeFileSync(chemin, genere.texte);
    console.log(`codeowners : ${FICHIER} régénéré depuis ${CONTRAT}`);
    process.exit(0);
  }
  const ecarts = ecartsCodeowners(existsSync(chemin) ? readFileSync(chemin, 'utf8') : null, genere.texte);
  if (ecarts.length > 0) {
    console.error(`codeowners : ${FICHIER} ne suit pas cheminsSensibles et proprietaires de ${CONTRAT} :`);
    for (const e of ecarts) console.error(`  ${e}`);
    console.error(`Régénérer : ${COMMANDE} ; jamais à la main (ADR « CODEOWNERS »).`);
    process.exit(1);
  }
  console.log('codeowners : OK');
}
