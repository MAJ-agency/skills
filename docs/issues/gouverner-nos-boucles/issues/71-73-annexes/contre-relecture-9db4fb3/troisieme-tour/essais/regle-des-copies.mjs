// La règle des copies héritées (A-193), aux bords : la garde du capitaine (`chemins-sensibles.mjs --garde`) et le hook
// d'édition (`garde-fichiers.mjs`), joués sur les fichiers d'un arbre donné.
//   E1 un sujet sans base de fusion commune avec develop porte le ticket sans l'accord : sa copie compte (écrite)
//   E2 develop absent du clone : la garde dit illisible (21), jamais un accord
//   E3 un sujet a supprimé le ticket : il n'a plus de copie, celle de develop fait foi
//   E4 un sujet a écrit le ticket puis l'a ramené au contenu de sa base de fusion, et develop a changé depuis : la copie
//      du sujet passe pour héritée, la pointe de develop fait foi (limite d'A-193)
//   E5 le hook dans un clone superficiel (sessions cloud) : la base de fusion ne se lit pas, la copie héritée compte
// Usage : node regle-des-copies.mjs <racine de l'arbre>
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script, GRAMMAIRE } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (ligne) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
const ACCORD = 'Sensibles: `scripts/agent/**` — accord de la MOA, 2026-11-21';
const CONTRAT = { cheminsSensibles: ['scripts/agent/**'], relecture: { depuis: '2026-11-17T09:00:00Z' } };
const garde = (d, base = 'develop') => spawnSync(process.execPath, [script('revue-adversariale', 'chemins-sensibles.mjs'), '--garde', '--base', base, '--titre', 'feat(agent): x', '--branche', 'feat/spec-all-demo-1-01-x'], { cwd: d.travail, env: d.env, input: 'scripts/agent/x.mjs\n', encoding: 'utf8' });
const dire = (nom, r) => console.log(`${nom} : sortie ${r.status} : ${(r.stdout || r.stderr).trim().split('\n').at(-1).slice(0, 220)}`);
const monter = (ligne) => {
  const d = depotJouet();
  d.publierChaine();
  d.ecrire('.claude/chaine.json', `${JSON.stringify(CONTRAT)}\n`);
  d.ecrire(TICKET, ticket(ligne));
  d.commit('docs: ticket');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  return d;
};
// E1
{
  const d = monter(ACCORD);
  d.git('switch', '-q', '--orphan', 'ailleurs');
  d.ecrire(TICKET, ticket('Sensibles: —'));
  d.git('add', TICKET);
  d.git('commit', '-q', '-m', 'ailleurs');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/ailleurs');
  d.git('fetch', '-q', 'origin');
  d.git('switch', '-q', '-f', '--detach', 'origin/develop');
  dire('E1 sujet sans base commune, ticket sans accord', garde(d));
}
// E2
{
  const d = monter(ACCORD);
  d.git('update-ref', '-d', 'refs/remotes/origin/develop');
  dire('E2 develop absent du clone', garde(d));
}
// E3
{
  const d = monter(ACCORD);
  d.branche('sujet/autre', 'origin/develop', { 'docs/autre.md': 'a\n' });
  d.git('rm', '-q', TICKET);
  d.commit('docs: le ticket retiré du sujet');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/autre');
  d.git('fetch', '-q', 'origin');
  d.git('switch', '-q', '--detach', 'origin/develop');
  dire('E3 un sujet a supprimé le ticket, develop porte l’accord', garde(d));
}
// E4 : le sujet écrit l'accord étroit, puis revient au contenu de sa base ; develop élargit ensuite.
{
  const d = monter('Sensibles: `scripts/agent/y.mjs` — accord de la MOA, 2026-11-20');
  d.branche('sujet/demo', 'origin/develop', { [TICKET]: ticket('Sensibles: —') });
  d.branche('sujet/demo', 'origin/sujet/demo', { [TICKET]: ticket('Sensibles: `scripts/agent/y.mjs` — accord de la MOA, 2026-11-20') });
  d.branche('develop', 'origin/develop', { [TICKET]: ticket(ACCORD) });
  d.git('switch', '-q', '--detach', 'origin/develop');
  dire('E4 copie du sujet revenue au contenu de sa base, develop élargi depuis', garde(d, 'sujet/demo'));
}
// E5 : le hook dans un clone superficiel.
{
  const d = monter('Sensibles: —');
  d.branche('sujet/autre', 'origin/develop', { 'docs/autre.md': 'a\n' });
  for (let i = 0; i < 3; i++) d.branche('develop', 'origin/develop', { [`docs/f${i}.md`]: `${i}\n` });
  d.branche('develop', 'origin/develop', { [TICKET]: ticket(ACCORD) });
  const ombre = join(d.racine, 'ombre');
  execFileSync('git', ['clone', '-q', '--depth', '1', '--single-branch', '-b', 'develop', `file://${d.origine}`, ombre], { env: d.env });
  const g = (...a) => execFileSync('git', a, { cwd: ombre, env: d.env, encoding: 'utf8' }).trim();
  g('fetch', '-q', 'origin', '+refs/heads/develop:refs/remotes/origin/develop', '+refs/heads/sujet/*:refs/remotes/origin/sujet/*');
  g('switch', '-q', '-c', 'feat/spec-all-demo-1-01-x', 'origin/develop');
  const outils = join(d.racine, 'outils');
  mkdirSync(join(outils, 'scripts/agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-fichiers.mjs']) copyFileSync(join(racine, 'skills/chaine/socle-chaine-de-production/references/agent', f), join(outils, 'scripts/agent', f));
  mkdirSync(join(outils, 'scripts/docs'), { recursive: true });
  copyFileSync(GRAMMAIRE, join(outils, 'scripts/docs/identifiants.mjs'));
  mkdirSync(join(outils, '.claude'), { recursive: true });
  writeFileSync(join(outils, '.claude/chaine.json'), JSON.stringify(CONTRAT));
  const hook = () => spawnSync(process.execPath, [join(outils, 'scripts/agent/garde-fichiers.mjs')], { cwd: ombre, env: { ...d.env, CLAUDE_PROJECT_DIR: ombre }, input: JSON.stringify({ tool_input: { file_path: join(ombre, 'scripts/agent/x.mjs') } }), encoding: 'utf8' });
  console.log(`E5 clone superficiel : ${g('rev-parse', '--is-shallow-repository')}`);
  dire('E5 hook, clone superficiel, copie héritée', hook());
  g('fetch', '-q', '--unshallow', 'origin');
  dire('E5 hook, après git fetch --unshallow origin', hook());
}
