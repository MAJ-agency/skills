// Pose, à la main selon les SKILL.md, un dépôt « chaîne seule » : `socle-monorepo` sans aucun service (ni api, ni web,
// ni mobile, ni tests ; mono-tenant, sans rôles, sans Anchorpost), puis `socle-chaine-de-production` (avec `tickets
// poser`, `revue-adversariale poser`, l'étape 0 de `fusionner`, `sujet poser`, l'étape 0 de `relecture`). Ce que l'essai
// réel a posé, depuis le plugin donné. Sans graphify ni skills Matt Pocock (le repli de l'étape 4 : `references/agents/*`).
// Ne commite rien et n'installe rien : `git init`, puis `pnpm install` et `git add -A` sont joués par l'appelant.
// Usage : node poser-chaine-seule.mjs <plugin> <jouet>
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const [PLUGIN, JOUET] = process.argv.slice(2);
if (!PLUGIN || !JOUET || existsSync(JOUET)) {
  console.error('usage : node poser-chaine-seule.mjs <plugin> <jouet neuf>');
  process.exit(2);
}
const M = join(PLUGIN, 'skills/monorepo/socle-monorepo/references');
const C = join(PLUGIN, 'skills/chaine/socle-chaine-de-production/references');
const T = join(PLUGIN, 'skills/chaine/tickets/references');
const S = join(PLUGIN, 'skills/chaine');
const DATE = '2026-11-23';
const ADR = { REGISTRE: 5, CHAINE: 6, SUJET: 7, RECETTE: 8, RELECTURE: 9 };
const VALEURS = {
  PROJET: 'jouet', PROJET_SNAKE: 'jouet', SCOPE: 'jouet', TITRE: 'Jouet', DESCRIPTION: 'Dépôt jouet posé en chaîne seule.',
  LANGUE: 'français', DATE, DEPUIS: '2026-11-23T00:00:00Z',
  ADR_CHAINE: `ADR_ALL_ARC-${ADR.CHAINE}`, ADR_SUJET: `ADR_ALL_ARC-${ADR.SUJET}`, ADR_RELECTURE: `ADR_ALL_ARC-${ADR.RELECTURE}`,
};
const poses = [];
const substituer = (texte, n) =>
  texte.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k === 'N' && n !== undefined ? String(n) : VALEURS[k] ?? m));
// Branches : garder A (mono-tenant, sans rôles), retirer B, retirer les marqueurs (socle-monorepo, étape 1).
const trancher = (texte) =>
  texte
    .replace(/^<!-- ══ (TENANT|ROLES)-B ══ -->\n[\s\S]*?^<!-- ══ \/\1-B ══ -->\n/gm, '')
    .replace(/^<!-- ══ \/?(TENANT|ROLES)-A ══ -->\n/gm, '');
const binaire = (f) => /\.(png|jpg|woff2?)$/.test(f);
function poser(source, destination, { n } = {}) {
  const d = join(JOUET, destination);
  mkdirSync(dirname(d), { recursive: true });
  // Les scripts et les gabarits de tickets se posent tels quels (leurs placeholders sont des données), hors de la liste
  // des index générés, un gabarit (socle de la chaîne, étape 2.3).
  const tel = destination.replace(/^\.\//, '');
  if (binaire(source) || (/^(scripts|docs\/agents\/gabarits)\//.test(tel) && tel !== 'scripts/docs/index-generes.json')) copyFileSync(source, d);
  else writeFileSync(d, trancher(substituer(readFileSync(source, 'utf8'), n)));
  if (/\.sh$/.test(d) || d.includes('/.husky/')) chmodSync(d, 0o755);
  poses.push(destination);
}
function poserDossier(source, destination, filtre = () => true) {
  for (const e of readdirSync(source, { withFileTypes: true })) {
    const s = join(source, e.name);
    if (e.isDirectory()) poserDossier(s, join(destination, e.name), filtre);
    else if (filtre(e.name, s)) poser(s, join(destination, e.name));
  }
}

// socle-monorepo, étape 2 (TABLE-RACINE.md).
mkdirSync(JOUET, { recursive: true });
poserDossier(join(M, 'racine'), '.', (nom) => nom !== 'gitignore');
poser(join(M, 'racine/gitignore'), '.gitignore');
poserDossier(join(M, 'husky'), '.husky');
poserDossier(join(M, 'methode'), 'docs/methode');
poserDossier(join(M, 'scripts/verify'), 'scripts/verify');
poserDossier(join(M, 'scripts/docs'), 'scripts/docs');
poser(join(M, 'adr/ADR_ALL_ARC-1-identifiants-types-et-contextes.md'), 'docs/adr/ADR_ALL_ARC-1-identifiants-types-et-contextes.md');
poser(join(M, 'adr/ADR_ALL_ARC-4-langue-des-identifiants-de-code.md'), 'docs/adr/ADR_ALL_ARC-4-langue-des-identifiants-de-code.md');
poser(join(M, 'adr/ADR_ALL_ARC-N-registre-un-fichier-par-regle.md'), `docs/adr/ADR_ALL_ARC-${ADR.REGISTRE}-registre-un-fichier-par-regle.md`, { n: ADR.REGISTRE });
poser(join(M, 'sources/README.md'), 'docs/sources/README.md');
// Étape 4, le repli : references/agents/* vers docs/agents/.
poserDossier(join(M, 'agents'), 'docs/agents');
// Étape 6 : les tickets de la racine sans service (01, 03, 07, 09 ; 02 et 08 portent sur le code d'un service).
for (const f of readdirSync(join(M, 'tickets'))) {
  const n = Number(f.split('-')[0]);
  if (![1, 3, 7, 9].includes(n)) continue;
  poser(join(M, 'tickets', f), `docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.${String(n).padStart(2, '0')}.issue.md`);
}
writeFileSync(join(JOUET, 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md'), `# SPEC_ALL_SOC-1 — Socle du dépôt

## Ce qu'on construit

La racine du monorepo et la chaîne de production, sans aucun service.

## Tickets

SPEC_ALL_SOC-1.01, SPEC_ALL_SOC-1.03, SPEC_ALL_SOC-1.07 et SPEC_ALL_SOC-1.09.
`);

// socle-chaine-de-production, étape 2.
// 2.1 tickets poser.
poserDossier(join(T, 'scripts/docs'), 'scripts/docs');
poserDossier(join(T, 'scripts/verify'), 'scripts/verify');
poser(join(T, 'agents/issue-tracker.md'), 'docs/agents/issue-tracker.md');
poser(join(T, 'agents/triage-labels.md'), 'docs/agents/triage-labels.md');
poserDossier(join(T, 'gabarits'), 'docs/agents/gabarits');
// revue-adversariale poser.
poserDossier(join(S, 'revue-adversariale/scripts'), 'scripts/chaine');
{
  const criteres = readFileSync(join(S, 'revue-adversariale/references/criteres-socle.md'), 'utf8');
  // S3 (mono-tenant) et S13 (pas de second client) retirés : chaque critère court jusqu'au suivant.
  const sans = criteres.replace(/^S(3|13) [\s\S]*?(?=^S\d+ |^## )/gm, '');
  mkdirSync(join(JOUET, 'docs/agents'), { recursive: true });
  writeFileSync(join(JOUET, 'docs/agents/criteres-revue.md'), sans);
  poses.push('docs/agents/criteres-revue.md');
}
// fusionner, étape 0 ; sujet poser ; relecture, étape 0 (contexte-ticket de revue-de-ticket).
poserDossier(join(S, 'fusionner/scripts'), 'scripts/chaine');
poserDossier(join(S, 'sujet/scripts'), 'scripts/chaine');
poserDossier(join(S, 'revue-de-ticket/scripts'), 'scripts/chaine');
// 2.2 le contrat : les chemins sensibles du gabarit seuls, 6 filles, pas de base (clé migrations retirée).
{
  const contrat = JSON.parse(substituer(readFileSync(join(C, 'chaine.json'), 'utf8')));
  delete contrat.migrations;
  writeFileSync(join(JOUET, '.claude/chaine.json'), `${JSON.stringify(contrat, null, 2)}\n`);
  poses.push('.claude/chaine.json');
}
// 2.3 à 2.11.
poser(join(C, 'index-generes.json'), 'scripts/docs/index-generes.json');
poserDossier(join(C, 'agent'), 'scripts/agent');
{
  const settings = JSON.parse(readFileSync(join(JOUET, '.claude/settings.json'), 'utf8'));
  const fragment = JSON.parse(readFileSync(join(C, 'settings-hooks.json'), 'utf8')).hooks;
  settings.hooks ??= {};
  for (const [k, v] of Object.entries(fragment)) settings.hooks[k] = [...(settings.hooks[k] ?? []), ...v];
  writeFileSync(join(JOUET, '.claude/settings.json'), `${JSON.stringify(settings, null, 2)}\n`);
}
poserDossier(join(C, 'scripts/verify'), 'scripts/verify');
for (const f of ['pr-titre.mjs', 'pr-titre.test.mjs', 'develop.sh']) poser(join(C, 'scripts/github', f), `scripts/github/${f}`);
poser(join(C, 'labels.sh'), 'scripts/github/labels.sh');
poser(join(C, 'ci/ci.yml'), '.github/workflows/ci.yml');
poser(join(C, 'ci/pr-titre.yml'), '.github/workflows/pr-titre.yml');
poser(join(C, 'docs-agents/chaine-de-production.md'), 'docs/agents/chaine-de-production.md');
poser(join(C, 'docs-agents/pieges.md'), 'docs/agents/pieges.md');
for (const [cle, slug] of [['CHAINE', 'chaine-de-production'], ['SUJET', 'branches-de-sujet'], ['RECETTE', 'recette-humaine'], ['RELECTURE', 'relecture-independante']])
  poser(join(C, `adr/ADR_ALL_ARC-N-${slug}.md`), `docs/adr/ADR_ALL_ARC-${ADR[cle]}-${slug}.md`, { n: ADR[cle] });
{
  const inserer = (fichier, marqueur, fragment) => {
    const p = join(JOUET, fichier);
    const t = readFileSync(p, 'utf8');
    const f = substituer(readFileSync(join(C, 'fragments', fragment), 'utf8'));
    if (marqueur === null) writeFileSync(p, `${t.replace(/\n*$/, '\n\n')}${f}`);
    else {
      if (!t.includes(marqueur)) throw new Error(`${fichier} : ${marqueur} absent`);
      writeFileSync(p, t.replace(marqueur, `${f.replace(/\n*$/, '\n')}${marqueur}`));
    }
  };
  inserer('CLAUDE.md', '<!-- socle:routing -->', 'claude-md-routing.md');
  inserer('CLAUDE.md', null, 'claude-md-fusion.md');
  inserer('README.md', '<!-- socle:commandes -->', 'readme-commandes.md');
  inserer('README.md', '<!-- socle:ou-vit-quoi -->', 'readme-ou-vit-quoi.md');
  inserer('README.md', '<!-- socle:prerequis -->', 'readme-prerequis.md');
}
poser(join(C, 'admin.md'), 'docs/agents/chaine-admin.md');
// package.json : check:tickets (tickets), check:migrations-ordre (fusionner), check:settings (étape 2.4 bis) ;
// scripts/check.mjs : check:tickets après lint, check:settings après check:contexte.
{
  const p = join(JOUET, 'package.json');
  const pkg = JSON.parse(readFileSync(p, 'utf8'));
  pkg.scripts['check:tickets'] = 'node scripts/verify/tickets.mjs && node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs scripts/agent/*.test.mjs scripts/chaine/*.test.mjs';
  pkg.scripts['check:migrations-ordre'] = 'node scripts/chaine/migrations-ordre.mjs origin/develop HEAD';
  pkg.scripts['check:settings'] = 'node scripts/verify/settings-json.mjs';
  writeFileSync(p, `${JSON.stringify(pkg, null, 2)}\n`);
  const k = join(JOUET, 'scripts/check.mjs');
  let t = readFileSync(k, 'utf8');
  const etape = (nom, cmd, msg) => `  [\n    "${nom}",\n    "${cmd}",\n    "${msg}",\n  ],\n`;
  t = t.replace(/(  \[\n    "check:contexte",)/, `${etape('check:tickets', 'pnpm check:tickets', 'un ticket, une carte ou un banc de la chaîne est rouge : le message nomme le fichier.')}$1`);
  t = t.replace(/(  \[\n    "typecheck",)/, `${etape('check:settings', 'pnpm check:settings', '.claude/settings.json ne tient pas le contrat des hooks : le message dit la ligne.')}$1`);
  writeFileSync(k, t);
}
const restes = [];
const parcourir = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) parcourir(p);
    else if ((!/^(scripts|docs\/agents\/gabarits)\//.test(relative(JOUET, p)) || relative(JOUET, p) === 'scripts/docs/index-generes.json') && /\{\{[A-Z_]+\}\}/.test(readFileSync(p, 'utf8'))) restes.push(relative(JOUET, p));
  }
};
parcourir(JOUET);
console.log(`posé : ${poses.length} fichiers ; placeholders restants : ${restes.length ? restes.join(', ') : 'aucun'}`);
