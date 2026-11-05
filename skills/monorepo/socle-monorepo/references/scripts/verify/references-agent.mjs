#!/usr/bin/env node
/**
 * Gate `references-agent`.
 *
 * Pourquoi. Sur un premier projet, un audit a relevé treize références fausses dans ce que lisent
 * les agents : skills absentes, commandes absentes, dossier inexistant, sections de CLAUDE.md
 * déplacées. Une session les lit comme des faits. Même esprit que le gate `tickets` : une
 * référence est une donnée, elle se vérifie.
 *
 * Fichiers lus : tout CLAUDE.md (racine, apps/*, packages/*), GLOSSARY.md, .claude/rules/*.md,
 * .claude/skills/**\/*.md, .claude/commands/*.md, docs/agents/**\/*.md. Natures (règles pures :
 * references-agent-regles.mjs) : chemin, commande, skill qualifiée (plugins installés listés dans
 * references-agent-integrees.json), section de CLAUDE.md ou des règles, identifiant de ticket
 * (`SOC-1.03`, présent sous docs/**\/issues/).
 *
 * Dette : `references-agent-dette.json`, références cassées à l'allumage gelées par
 * `fichier:ligne:référence`. Jamais d'entrée nouvelle : on corrige la référence.
 * `--elaguer` retire les entrées éteintes (référence corrigée ou ligne déplacée).
 *
 * Usage : node scripts/verify/references-agent.mjs [--elaguer]   (pnpm check, étape check:contexte)
 * Racine : le dépôt qui contient scripts/ ; `PROJET_RACINE` la remplace (tests).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cleDette, intitulesTable, referencesCassees, titres } from './references-agent-regles.mjs';

const ROOT = process.env.PROJET_RACINE ?? new URL('../..', import.meta.url).pathname;
const DETTE = join(ROOT, 'scripts/verify/references-agent-dette.json');
const INTEGREES = join(ROOT, 'scripts/verify/references-agent-integrees.json');

const suivis = execFileSync('git', ['ls-files', '-z'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
  .split('\0')
  .filter(Boolean);
const suivisSet = new Set(suivis);

const lus = suivis.filter(
  (f) =>
    /(^|\/)CLAUDE\.md$/.test(f) ||
    f === 'GLOSSARY.md' ||
    /^\.claude\/rules\/[^/]+\.md$/.test(f) ||
    /^\.claude\/skills\/.+\.md$/.test(f) ||
    /^\.claude\/commands\/[^/]+\.md$/.test(f) ||
    /^docs\/agents\/.+\.md$/.test(f),
);

const lire = (f) => readFileSync(join(ROOT, f), 'utf8');
const claudeMd = lire('CLAUDE.md');
const sections = {
  titres: [
    claudeMd,
    ...suivis.filter((f) => /^\.claude\/rules\/[^/]+\.md$/.test(f) || /^(apps|packages)\/[^/]+\/CLAUDE\.md$|^packages\/CLAUDE\.md$/.test(f)).map(lire),
  ].flatMap(titres),
  table: intitulesTable(claudeMd),
};
const listes = JSON.parse(readFileSync(INTEGREES, 'utf8'));
const integrees = new Set([...(listes.commandes ?? []), ...(listes['routes-http'] ?? [])]);
const skillsPlugins = new Set(listes['skills-plugins'] ?? []);
const racines = new Set(suivis.map((f) => f.split('/')[0]));
const existeChemin = (c) =>
  suivisSet.has(c) || suivis.some((f) => f.startsWith(c.replace(/\/?$/, '/')));
const tickets = new Set(
  suivis
    .filter((f) => /\/issues\/[^/]+\.issue\.md$/.test(f))
    .map((f) => /\/((?:[A-Z][A-Z0-9]*-)+\d+)-[a-z0-9-]+\.(\d{2})\.issue\.md$/.exec(f))
    .filter(Boolean)
    .map((m) => `${m[1]}.${m[2]}`),
);
const ticketExiste = (id) => tickets.has(id);
// Les documents qui définissent la convention des tickets citent des identifiants d'exemple
// (`SOC-1.03`) : ils ne sont pas lus pour cette nature.
const CONVENTION = /^docs\/agents\/(issue-tracker|triage-labels|chaine-de-production)\.md$|^docs\/agents\/gabarits\//;
const skillExiste = (nom) => skillsPlugins.has(nom) || existsSync(join(ROOT, '.claude/skills', nom, 'SKILL.md'));
const commandeExiste = (nom) =>
  skillExiste(nom) || existsSync(join(ROOT, '.claude/commands', `${nom}.md`)) || integrees.has(nom) || [...skillsPlugins].some((s) => s.endsWith(`:${nom}`));

const cassees = [];
for (const fichier of lus) {
  for (const c of referencesCassees({
    texte: lire(fichier),
    dossier: dirname(fichier),
    existeChemin,
    commandeExiste,
    skillExiste,
    ticketExiste: CONVENTION.test(fichier) ? undefined : ticketExiste,
    sections,
    racines,
  })) {
    cassees.push({ fichier, ...c, cle: cleDette(fichier, c) });
  }
}

const dette = JSON.parse(readFileSync(DETTE, 'utf8'));
// Gel par fichier + référence : insérer une ligne au-dessus d'une référence gelée ne la fait pas
// ressortir comme nouvelle (la ligne ne sert qu'à la retrouver).
const sansLigne = (cle) => cle.replace(/:\d+:/, ':');
const geles = new Set(dette.references.map(sansLigne));
const actives = new Set(cassees.map((c) => sansLigne(c.cle)));
const nouvelles = cassees.filter((c) => !geles.has(sansLigne(c.cle)));
const eteintes = dette.references.filter((c) => !actives.has(sansLigne(c)));

if (process.argv.includes('--elaguer')) {
  dette.references = cassees.map((c) => c.cle).filter((c) => geles.has(sansLigne(c)));
  writeFileSync(DETTE, `${JSON.stringify(dette, null, 2)}\n`);
  console.log(
    `references-agent : dette élaguée — ${dette.references.length} référence(s) gelée(s)`,
  );
  process.exit(0);
}

if (nouvelles.length > 0) {
  console.error(`references-agent : ${nouvelles.length} référence(s) cassée(s) nouvelle(s) :`);
  for (const c of nouvelles) {
    console.error(`  ${c.fichier}:${c.ligne} — ${c.nature} « ${c.reference} » introuvable`);
  }
  console.error(
    "  Corriger la référence (elle n'a pas de raison légitime d'être fausse : un agent la lirait comme un fait).",
  );
  process.exit(1);
}
const elaguer =
  eteintes.length > 0 ? ` ; ${eteintes.length} entrée(s) éteinte(s), à retirer par --elaguer` : '';
console.log(
  `references-agent : OK — ${lus.length} fichiers, 0 nouvelle, ${cassees.length} gelée(s)${elaguer}`,
);
