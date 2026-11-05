#!/usr/bin/env node
/**
 * Budget de contexte des agents : `CLAUDE.md` court, le détail dans des règles
 * chargées par chemin.
 *
 * Pourquoi. `CLAUDE.md` se charge en entier à chaque session de l'assistant. Sur un premier projet
 * il a atteint 926 lignes ; la documentation Claude Code vise moins de 200 lignes par fichier, au-delà
 * les consignes sont moins bien suivies. Le détail est passé dans `.claude/rules/*.md`, chargés
 * seulement quand l'agent lit ou édite un fichier qui correspond à leur `paths:`. Sans contrôle,
 * le fichier racine regrossit une règle à la fois, et une règle sans `paths:` (ou dont le `paths:`
 * ne se lit pas) se charge à chaque session, ce qui annule le découpage.
 *
 * Règles :
 *   1. `CLAUDE.md` racine : au plus 200 lignes ;
 *   2. chaque `.claude/rules/**\/*.md` : au plus 200 lignes, et un frontmatter YAML qui ouvre le
 *      fichier avec un `paths:` non vide (liste YAML ou chaîne séparée par des virgules) ;
 *   3. au moins un motif de `paths:` désigne un fichier du dépôt (suivi, ou nouveau et non
 *      ignoré) : une règle dont aucun motif ne charge est une règle morte, en silence ; un motif
 *      vers un dossier à venir est toléré tant qu'un autre charge la règle ;
 *   4. chaque `.claude/skills/*\/SKILL.md` : au plus 200 lignes, annexes non comptées :
 *      le `SKILL.md` se charge en entier à l'invocation, les annexes à l'étape qui les nomme.
 *
 * Usage : node scripts/verify/budget-contexte.mjs   (pnpm check, étape check:contexte — job CI qualite)
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const MAX_LIGNES = 200;
const DOSSIER_REGLES = join(ROOT, '.claude/rules');
const DOSSIER_SKILLS = join(ROOT, '.claude/skills');

const lignes = (texte) => texte.replace(/\n$/, '').split('\n').length;

/** Fichiers `.md` de `.claude/rules/`, sous-dossiers compris (Claude Code les découvre tous). */
function reglesMarkdown(dossier) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return reglesMarkdown(chemin);
    return entree.name.endsWith('.md') ? [chemin] : [];
  });
}

/** Découpe une liste « a, b » sur les virgules hors accolades (`src/*.{ts,tsx}` reste entier). */
function horsAccolades(valeur) {
  const parts = [''];
  let accolades = 0;
  for (const c of valeur) {
    if (c === '{') accolades += 1;
    if (c === '}') accolades = Math.max(0, accolades - 1);
    if (c === ',' && accolades === 0) parts.push('');
    else parts[parts.length - 1] += c;
  }
  return parts;
}

/** Motifs du `paths:` du frontmatter, ou `null` s'il n'y a pas de frontmatter. */
function motifsDuFrontmatter(texte) {
  const bloc = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(texte);
  if (!bloc) return null;
  const yaml = bloc[1].split(/\r?\n/);
  const debut = yaml.findIndex((l) => /^paths\s*:/.test(l));
  if (debut === -1) return [];
  const sansGuillemets = (v) =>
    v
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
      .trim();
  const enLigne = yaml[debut].replace(/^paths\s*:/, '').trim();
  if (enLigne) {
    const valeur = sansGuillemets(enLigne).replace(/^\[(.*)\]$/, '$1');
    return horsAccolades(valeur).map(sansGuillemets).filter(Boolean);
  }
  const motifs = [];
  for (const ligne of yaml.slice(debut + 1)) {
    const item = /^\s+-\s+(.*)$/.exec(ligne);
    if (!item) break;
    motifs.push(sansGuillemets(item[1]));
  }
  return motifs.filter(Boolean);
}

/** Glob (`**`, `*`, `?`, `{a,b}`) → expression régulière sur un chemin relatif à la racine. */
function globEnRegex(motif) {
  let re = '';
  let accolades = 0;
  for (let i = 0; i < motif.length; i += 1) {
    const c = motif[i];
    if (c === '*' && motif[i + 1] === '*') {
      const suiviDeSlash = motif[i + 2] === '/';
      re += suiviDeSlash ? '(?:.*/)?' : '.*';
      i += suiviDeSlash ? 2 : 1;
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '{') {
      accolades += 1;
      re += '(?:';
    } else if (c === '}' && accolades > 0) {
      accolades -= 1;
      re += ')';
    } else if (c === ',' && accolades > 0) re += '|';
    else re += c.replace(/[.+^$(){}|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

const fichiersDuDepot = () =>
  execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\0')
    .filter(Boolean);

function verifier() {
  const erreurs = [];
  const racine = join(ROOT, 'CLAUDE.md');
  const nRacine = lignes(readFileSync(racine, 'utf8'));
  if (nRacine > MAX_LIGNES) {
    erreurs.push(
      `CLAUDE.md : ${nRacine} lignes (> ${MAX_LIGNES}) — déplacer le détail dans une règle .claude/rules/ à paths:, ou réduire à une ligne une règle tenue par un gate`,
    );
  }

  const regles = reglesMarkdown(DOSSIER_REGLES);
  const fichiers = regles.length > 0 ? fichiersDuDepot() : [];
  for (const chemin of regles) {
    const nom = relative(ROOT, chemin);
    const texte = readFileSync(chemin, 'utf8');
    const n = lignes(texte);
    if (n > MAX_LIGNES)
      erreurs.push(`${nom} : ${n} lignes (> ${MAX_LIGNES}) — découper par chemin`);
    const motifs = motifsDuFrontmatter(texte);
    if (motifs === null) {
      erreurs.push(
        `${nom} : pas de frontmatter --- paths: --- en tête (la règle se chargerait à chaque session)`,
      );
      continue;
    }
    if (motifs.length === 0) {
      erreurs.push(
        `${nom} : frontmatter sans paths: non vide (la règle se chargerait à chaque session)`,
      );
      continue;
    }
    // Un motif qui ne désigne rien n'est un écart que si aucun motif de la règle n'en désigne : une
    // règle peut nommer des dossiers à venir (migrations, tests sur base) tant qu'un autre la charge.
    let unQuiCharge = false;
    const sansFichier = [];
    for (const motif of motifs) {
      let re;
      try {
        re = globEnRegex(motif);
      } catch {
        erreurs.push(`${nom} : motif « ${motif} » illisible (accolades non fermées ?)`);
        continue;
      }
      if (fichiers.some((f) => re.test(f))) unQuiCharge = true;
      else sansFichier.push(motif);
    }
    if (!unQuiCharge && sansFichier.length > 0) {
      erreurs.push(
        `${nom} : aucun motif de paths: ne désigne un fichier du dépôt (${sansFichier.map((m) => `« ${m} »`).join(', ')}) — la règle ne se chargerait jamais`,
      );
    }
  }

  const skills = existsSync(DOSSIER_SKILLS)
    ? readdirSync(DOSSIER_SKILLS, { withFileTypes: true })
        .filter((e) => e.isDirectory() && existsSync(join(DOSSIER_SKILLS, e.name, 'SKILL.md')))
        .map((e) => join(DOSSIER_SKILLS, e.name, 'SKILL.md'))
    : [];
  for (const chemin of skills) {
    const n = lignes(readFileSync(chemin, 'utf8'));
    if (n > MAX_LIGNES) {
      erreurs.push(
        `${relative(ROOT, chemin)} : ${n} lignes (> ${MAX_LIGNES}) — passer le détail dans une annexe lue à l'étape qui en a besoin, ou dans l'en-tête du script`,
      );
    }
  }
  return { erreurs, nRacine, nRegles: regles.length, nSkills: skills.length };
}

const { erreurs, nRacine, nRegles, nSkills } = verifier();
if (erreurs.length > 0) {
  console.error(`budget-contexte : ${erreurs.length} écart(s) :`);
  for (const e of erreurs) console.error(`  ${e}`);
  process.exit(1);
}
console.log(
  `budget-contexte : OK — CLAUDE.md ${nRacine} lignes, ${nRegles} règles par chemin, ${nSkills} SKILL.md ≤ ${MAX_LIGNES} lignes`,
);
