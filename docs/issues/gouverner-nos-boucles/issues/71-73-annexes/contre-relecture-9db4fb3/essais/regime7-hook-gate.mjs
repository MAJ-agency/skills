// Régime 7 (sans la clé `relecture`), le hook d'édition et le gate `tickets`, joués avec les fichiers d'un arbre donné
// (`main` ou la PR) dans un projet jouet ; un espion sur `git` journalise chaque appel (sous-commande et arguments), et
// le rapport donne, par scénario, le code de sortie, la sortie d'erreur et les appels, normalisés. Deux arbres qui font
// la même chose écrivent le même rapport, sauf les appels `git` locaux que la PR ajoute (listés à part par le diff).
// Usage : node regime7-hook-gate.mjs <racine de l'arbre>
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const arbre = process.argv[2];
const GIT = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
const NODE = process.execPath;
const racine = mkdtempSync(join(tmpdir(), 'regime7-'));
const journal = join(racine, 'git.log');
const bin = join(racine, 'bin');
mkdirSync(bin);
writeFileSync(join(bin, 'git'), `#!/bin/sh\necho "git $*" >> ${JSON.stringify(journal)}\nexec ${GIT} "$@"\n`);
chmodSync(join(bin, 'git'), 0o755);
const ENV = { PATH: `${bin}:${dirname(NODE)}:/usr/bin:/bin`, HOME: racine, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'j', GIT_AUTHOR_EMAIL: 'j@j', GIT_COMMITTER_NAME: 'j', GIT_COMMITTER_EMAIL: 'j@j' };
const git = (cwd, ...a) => execFileSync(GIT, a, { cwd, env: ENV, encoding: 'utf8' });
const ecrire = (d, chemin, texte) => {
  mkdirSync(dirname(join(d, chemin)), { recursive: true });
  writeFileSync(join(d, chemin), texte);
};
const copier = (d, depuis, vers) => {
  mkdirSync(dirname(join(d, vers)), { recursive: true });
  copyFileSync(join(arbre, depuis), join(d, vers));
};
const appels = () => (existsSync(journal) ? readFileSync(journal, 'utf8').trim().split('\n').filter(Boolean) : []);
const vider = () => writeFileSync(journal, '');
const dire = (nom, r) => {
  const a = appels();
  console.log(`### ${nom}\nsortie ${r.status}\nerreur : ${(r.stderr ?? '').trim().replace(/\/[^ :]*regime7-[^ :/]*/g, '<tmp>')}\nsortie standard : ${(r.stdout ?? '').trim().split('\n').at(-1) ?? ''}\nappels git (${a.length}) :${a.map((l) => `\n  ${l.replace(/\/[^ :]*regime7-[^ :/]*/g, '<tmp>')}`).join('')}\nappels réseau : ${a.filter((l) => / (fetch|ls-remote|push|pull) /.test(`${l} `)).length}`);
};

// Le projet : origin nu, develop, un sujet ; un ticket de sujet qui accorde un chemin ; le contrat sans la clé.
const origine = join(racine, 'origine.git');
const projet = join(racine, 'projet');
git(racine, 'init', '-q', '--bare', '-b', 'develop', origine);
git(racine, 'clone', '-q', origine, projet);
const CONTRAT = { cheminsSensibles: ['scripts/agent/**', 'docs/agents/'], migrations: 'apps/api/src/db/migrations/' };
ecrire(projet, '.claude/chaine.json', `${JSON.stringify(CONTRAT)}\n`);
for (const f of ['entree.mjs', 'regles.mjs', 'garde-fichiers.mjs']) copier(projet, `skills/chaine/socle-chaine-de-production/references/agent/${f}`, `scripts/agent/${f}`);
copier(projet, 'skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs', 'scripts/docs/identifiants.mjs');
for (const f of ['tickets.mjs', 'tickets-regles.mjs']) copier(projet, `skills/chaine/tickets/references/scripts/verify/${f}`, `scripts/verify/${f}`);
// Les modules que le gate importe à côté (scripts/docs/), comme la pose du skill `tickets` dans un projet.
const DOCS = 'skills/chaine/tickets/references/scripts/docs';
for (const f of (await import('node:fs')).readdirSync(join(arbre, DOCS)).filter((f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs') && f !== 'depot-jouet.mjs')) copier(projet, `${DOCS}/${f}`, `scripts/docs/${f}`);
ecrire(projet, 'scripts/verify/tickets-dette.json', '{"tickets":[],"cartes":[],"identifiants":[]}\n');
ecrire(projet, 'docs/agents/issue-tracker.md', '# Suivi\n\n## Réserver un ticket (sessions parallèles)\n\n## Un ticket prêt pour agent\n\n## Archivage\n');
ecrire(projet, 'docs/agents/triage-labels.md', '`en cours — <branche>` · `Fait — PR #<n>`\n');
ecrire(projet, 'docs/metier/regles/all/RULE_ALL_SOC-1.md', '---\nkey: RULE_ALL_SOC-1\ncriticality:\n  level: high\n---\n# Règle\n');
const TICKET = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
// Un ticket prêt qui touche un chemin sensible sans `Label: contre-revue` (règle 7) et cite une règle haute sans
// `Relecture: double` : en régime 7, la règle 7 refuse, la règle 14 ne joue pas.
ecrire(projet, TICKET, '# x\n\nStatus: ready-for-agent\nType: task\nModèle: sonnet\nRègles: RULE_ALL_SOC-1\nFichiers chauds: `scripts/agent/x.mjs`\nBlocked by: —\nDépendances: —\nSensibles: `scripts/agent/**` — accord de la MOA, 2026-11-21\n\n## Le besoin\n\nx\n');
ecrire(projet, 'apps/api/src/db/migrations/0001-init.sql', 'select 1;\n');
git(projet, 'add', '-A');
git(projet, 'commit', '-q', '-m', 'initial');
git(projet, 'push', '-q', 'origin', 'HEAD:develop', 'HEAD:refs/heads/sujet/socle');
git(projet, 'fetch', '-q', 'origin');
git(projet, 'checkout', '-q', '-b', 'feat/spec-all-soc-1-01-x', 'origin/develop');

const hook = (chemin) =>
  spawnSync(NODE, [join(projet, 'scripts/agent/garde-fichiers.mjs')], { cwd: projet, env: { ...ENV, CLAUDE_PROJECT_DIR: projet }, input: JSON.stringify({ tool_input: { file_path: join(projet, chemin) } }), encoding: 'utf8' });
for (const [nom, chemin] of [
  ['hook, chemin sensible accordé', 'scripts/agent/x.mjs'],
  ['hook, chemin sensible non accordé', 'docs/agents/regles.md'],
  ['hook, chemin ordinaire', 'docs/notes.md'],
  ['hook, migration livrée', 'apps/api/src/db/migrations/0001-init.sql'],
  ['hook, fichier généré', 'pnpm-lock.yaml'],
]) {
  vider();
  dire(nom, hook(chemin));
}
// Sur une branche sans ticket : même chose en régime 7.
git(projet, 'checkout', '-q', '-b', 'feat/sans-ticket', 'origin/develop');
vider();
dire('hook, branche sans ticket, chemin sensible', hook('scripts/agent/y.mjs'));
// Le gate, dans l'arbre de travail du projet (suivi par git).
vider();
dire('gate tickets', spawnSync(NODE, [join(projet, 'scripts/verify/tickets.mjs')], { cwd: projet, env: { ...ENV, PROJET_RACINE: projet }, encoding: 'utf8' }));
