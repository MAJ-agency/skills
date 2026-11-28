// Le hook garde-fichiers sur un dépôt jouet, en régime 8 (relecture indépendante, lot 5b : A-74, A-76) : un chemin
// sensible ne s'écrit que si la ligne `Sensibles:` du ticket de la branche le couvre, lue sur `origin/sujet/*` (sur
// `origin/develop` pour un ticket sans sujet). Les hooks sont copiés dans un dossier `scripts/` jouet, avec
// `scripts/docs/identifiants.mjs` et le contrat `.claude/chaine.json` à côté, comme dans un projet ; CLAUDE_PROJECT_DIR
// désigne le clone de travail.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Posé dans un projet, scripts/docs/ est à côté de scripts/agent/ ; dans le plugin, le dépôt jouet est dans le skill
// tickets et la grammaire dans le skill socle-monorepo.
const PROJET = existsSync(new URL('../docs/identifiants.mjs', import.meta.url));
const DOCS = PROJET ? new URL('../docs/', import.meta.url) : new URL('../../../tickets/references/scripts/docs/', import.meta.url);
const GRAMMAIRE = PROJET ? new URL('../docs/identifiants.mjs', import.meta.url) : new URL('../../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs', import.meta.url);
const { ENV, depotJouet } = await import(new URL('depot-jouet.mjs', DOCS).href);

const TICKET = 'docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md';
const ticket = (ligne) => `# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
const ACCORD = 'Sensibles: `scripts/agent/**`, docs/agents/regles.md — accord de la MOA, 2026-11-21';
const CONTRAT = { cheminsSensibles: ['scripts/agent/**', 'docs/agents/'], relecture: { depuis: '2026-11-21T09:00:00Z' } };

/** Dépôt jouet : develop porte le ticket avec `surDevelop` ; `surSujet` (non nul) le pose sur `origin/sujet/demo`. */
function depot({ surSujet = ACCORD, surDevelop = 'Sensibles: —', contrat = CONTRAT, branche = 'feat/spec-all-demo-1-01-garde' } = {}) {
  const d = depotJouet({ fichiers: { [TICKET]: ticket(surDevelop) } });
  if (surSujet !== null) {
    writeFileSync(join(d.travail, TICKET), ticket(surSujet));
    d.git('commit', '-q', '--allow-empty', '-am', 'sensibles');
    d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  }
  d.git('fetch', '-q', 'origin');
  d.git('checkout', '-q', '-b', branche, 'origin/develop');
  const outils = join(d.racine, 'outils');
  mkdirSync(join(outils, 'scripts/agent'), { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-fichiers.mjs']) copyFileSync(new URL(f, import.meta.url), join(outils, 'scripts/agent', f));
  mkdirSync(join(outils, 'scripts/docs'), { recursive: true });
  copyFileSync(GRAMMAIRE, join(outils, 'scripts/docs/identifiants.mjs'));
  mkdirSync(join(outils, '.claude'), { recursive: true });
  if (contrat !== null) writeFileSync(join(outils, '.claude/chaine.json'), JSON.stringify(contrat));
  return { ...d, script: join(outils, 'scripts/agent/garde-fichiers.mjs') };
}
const ecrire = ({ travail, bin, script }, chemin) =>
  spawnSync(process.execPath, [script], {
    cwd: travail,
    env: { ...ENV, PATH: bin, CLAUDE_PROJECT_DIR: travail },
    input: JSON.stringify({ tool_input: { file_path: join(travail, chemin) } }),
    encoding: 'utf8',
  });
const refuse = (r, motif) => {
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, motif ?? /chemin sensible \(`cheminsSensibles`\) hors de la ligne `Sensibles:` du ticket/);
};
const passe = (r) => assert.equal(r.status, 0, r.stderr);

test('régime 8 : la ligne `Sensibles:` du ticket, lue sur le sujet, couvre le chemin → écrit ; un chemin sensible qu’elle ne couvre pas → refusé ; un chemin ordinaire passe', () => {
  const d = depot();
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
  passe(ecrire(d, 'docs/agents/regles.md'));
  refuse(ecrire(d, 'docs/agents/autre.md'));
  passe(ecrire(d, 'docs/notes.md'));
});

test('régime 7 (sans la clé `relecture`) : un chemin sensible s’écrit comme avant, sans ligne lue', () => {
  const d = depot({ surSujet: null, contrat: { cheminsSensibles: ['scripts/agent/**'] } });
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
});

test('régime 8 : la copie du sujet fait foi, jamais l’arbre de travail ; sans sujet, celle de develop ; sans ticket, tout chemin sensible est refusé', () => {
  const d = depot({ surSujet: 'Sensibles: —' });
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  refuse(ecrire(d, 'scripts/agent/garde.mjs'), /chemin sensible/);
  const dev = depot({ surSujet: null, surDevelop: ACCORD });
  passe(ecrire(dev, 'scripts/agent/garde.mjs'));
  const sans = depot({ branche: 'feat/sans-ticket' });
  refuse(ecrire(sans, 'scripts/agent/garde.mjs'), /Aucune ligne lue : branche sans ticket/);
});

test('régime 8 : une copie locale du sujet que origin ne porte pas ne compte pas ; une ligne illisible refuse en le disant', () => {
  const d = depot({ surSujet: 'Sensibles: —' });
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  d.git('commit', '-q', '-am', 'local');
  d.git('update-ref', 'refs/remotes/origin/sujet/demo', 'HEAD');
  refuse(ecrire(d, 'scripts/agent/garde.mjs'));
  const mal = depot({ surSujet: 'Sensibles: ../scripts/agent/** — accord de la MOA, 2026-11-21' });
  refuse(ecrire(mal, 'scripts/agent/garde.mjs'), /Ligne illisible : « \.\.\/scripts\/agent\/\*\* » n'est pas un chemin/);
});

test('régime 8 : une copie locale du sujet en retard sur origin n’est pas lue, et le refus dit le geste qui la relit ; relue, le chemin accordé passe', () => {
  const d = depot();
  // Le sujet avance sur origin (une autre sous-PR fusionnée) sans que la session l'ait relu.
  const avant = d.git('rev-parse', 'origin/sujet/demo').trim();
  d.git('switch', '-q', '--detach', 'origin/sujet/demo');
  writeFileSync(join(d.travail, 'docs/autre.md'), 'autre\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'autre sous-PR');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  d.git('update-ref', 'refs/remotes/origin/sujet/demo', avant);
  d.git('switch', '-q', 'feat/spec-all-demo-1-01-garde');
  const r = ecrire(d, 'scripts/agent/garde.mjs');
  refuse(r, /^scripts\/agent\/garde\.mjs : d'abord, relire les copies du ticket \(origin\/sujet\/demo n'est pas au sommet d'origin\) : `git fetch --prune origin '\+refs\/heads\/develop:refs\/remotes\/origin\/develop' '\+refs\/heads\/sujet\/\*:refs\/remotes\/origin\/sujet\/\*'`, puis refaire l'écriture\. Encore refusée : chemin sensible/);
  // Le geste du refus, tel qu'il est écrit, puis l'écriture refaite.
  const geste = /`(git fetch --prune origin [^`]+)`/.exec(r.stderr)[1];
  const args = geste.split(' ').slice(1).map((a) => a.replace(/^'|'$/g, ''));
  d.git(...args);
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
});

test('régime 8 : une copie de sujet héritée de develop (le sujet ne l’a pas écrite) ne compte pas ; celle de develop fait foi (contre-relecture de la PR 149, tour 2)', () => {
  // Develop porte le ticket sans accord ; un autre sujet en part ; puis l'accord entre dans develop.
  const d = depot({ surSujet: null });
  d.git('push', '-q', 'origin', 'origin/develop:refs/heads/sujet/autre');
  d.git('switch', '-q', '--detach', 'origin/develop');
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  d.git('commit', '-q', '-am', 'accord');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  d.git('switch', '-q', 'feat/spec-all-demo-1-01-garde');
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
  refuse(ecrire(d, 'docs/agents/autre.md'));
});

test('régime 8 : le refus ne nomme que les copies en retard qui portent le ticket ; sans copie lue, « Aucune ligne lue » dit aussi de relire', () => {
  // Un autre sujet, qui ne porte pas le ticket (parti d'ailleurs), avance sur origin sans être relu : il n'est pas nommé.
  const d = depot();
  d.git('switch', '-q', '--orphan', 'ailleurs');
  writeFileSync(join(d.travail, 'ailleurs.md'), 'a\n');
  d.git('add', 'ailleurs.md');
  d.git('commit', '-q', '-m', 'ailleurs');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/autre');
  d.git('fetch', '-q', 'origin');
  const avant = d.git('rev-parse', 'origin/sujet/autre').trim();
  writeFileSync(join(d.travail, 'ailleurs2.md'), 'b\n');
  d.git('add', 'ailleurs2.md');
  d.git('commit', '-q', '-m', 'ailleurs 2');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/autre');
  d.git('update-ref', 'refs/remotes/origin/sujet/autre', avant);
  d.git('clean', '-qfdx');
  d.git('switch', '-q', '-f', 'feat/spec-all-demo-1-01-garde');
  const r = ecrire(d, 'docs/agents/autre.md');
  refuse(r);
  assert.doesNotMatch(r.stderr, /origin\/sujet\/autre/, 'un sujet qui ne porte pas le ticket');
  // Le ticket .02 ne vit que sur le sujet, dont la copie locale est en retard : aucune ligne lue, et le geste.
  const s = depot({ branche: 'feat/spec-all-demo-1-02-garde' });
  const deux = TICKET.replace('.01.', '.02.');
  s.git('switch', '-q', '--detach', 'origin/sujet/demo');
  writeFileSync(join(s.travail, deux), ticket(ACCORD).replace('.01', '.02'));
  s.git('add', '-A');
  s.git('commit', '-q', '-m', 'ticket .02');
  s.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  s.git('fetch', '-q', 'origin');
  const vieux = s.git('rev-parse', 'origin/sujet/demo').trim();
  writeFileSync(join(s.travail, 'docs/autre.md'), 'autre\n');
  s.git('add', '-A');
  s.git('commit', '-q', '-m', 'autre sous-PR');
  s.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/demo');
  s.git('update-ref', 'refs/remotes/origin/sujet/demo', vieux);
  s.git('switch', '-q', 'feat/spec-all-demo-1-02-garde');
  refuse(ecrire(s, 'scripts/agent/garde.mjs'), /^scripts\/agent\/garde\.mjs : d'abord, relire les copies du ticket \(origin\/sujet\/demo n'est pas au sommet d'origin\) : .*Encore refusée : .*\(Aucune ligne lue : /);
});

test('régime 8 : dans un clone superficiel, la base de fusion d’un sujet ne se lit pas : la copie héritée compte, et le refus dit d’approfondir le clone ; approfondi, le chemin accordé passe (contre-relecture de la PR 149, tour 3)', () => {
  // Develop porte le ticket sans accord ; un autre sujet en part ; develop avance, puis l'accord y entre.
  const d = depot({ surSujet: null });
  d.git('push', '-q', 'origin', 'origin/develop:refs/heads/sujet/autre');
  d.git('switch', '-q', '--detach', 'origin/develop');
  for (const i of [1, 2, 3]) {
    writeFileSync(join(d.travail, `docs/f${i}.md`), `${i}\n`);
    d.git('add', '-A');
    d.git('commit', '-q', '-m', `f${i}`);
  }
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  d.git('commit', '-q', '-am', 'accord');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  // Le clone d'une session cloud : superficiel, develop seul, puis les sujets relus.
  const ombre = join(d.racine, 'ombre');
  const g = (...a) => execFileSync('git', a, { cwd: ombre, env: ENV, encoding: 'utf8' }).trim();
  execFileSync('git', ['clone', '-q', '--depth', '1', '--single-branch', '-b', 'develop', `file://${join(d.racine, 'origine.git')}`, ombre], { env: ENV });
  g('fetch', '-q', 'origin', '+refs/heads/develop:refs/remotes/origin/develop', '+refs/heads/sujet/*:refs/remotes/origin/sujet/*');
  g('switch', '-q', '-c', 'feat/spec-all-demo-1-01-garde', 'origin/develop');
  const r = ecrire({ ...d, travail: ombre }, 'scripts/agent/garde.mjs');
  refuse(r, /^scripts\/agent\/garde\.mjs : d'abord, approfondir le clone \(clone superficiel : la base de fusion d'un sujet avec develop ne s'y lit pas, [^)]+\) : `git fetch --unshallow origin`, puis refaire l'écriture\. Encore refusée : chemin sensible/);
  g('fetch', '-q', '--unshallow', 'origin');
  passe(ecrire({ ...d, travail: ombre }, 'scripts/agent/garde.mjs'));
});

// --- Suites du lot 5 (contre-relecture de la PR 149, tours 3 et 4 ; ticket 79) -------------------------------------

test('régime 8 : l’héritage d’une copie de sujet se juge contre le develop d’origin ; une copie locale de develop en retard ne juge rien, le refus dit de la relire, et relue, le chemin accordé passe (la suite M4 du lot 5)', () => {
  // Develop : le ticket sans accord (D0), puis un accord sur `docs/agents/regles.md` (D1), que le sujet `autre` reçoit,
  // puis l'accord sur `scripts/agent/**` (D2). La session a relu le sujet, pas develop : sa copie est restée à D0.
  const d = depot({ surSujet: null });
  const d0 = d.git('rev-parse', 'origin/develop').trim();
  d.git('switch', '-q', '--detach', 'origin/develop');
  writeFileSync(join(d.travail, TICKET), ticket('Sensibles: docs/agents/regles.md — accord de la MOA, 2026-11-21'));
  d.git('commit', '-q', '-am', 'accord étroit');
  d.git('push', '-q', 'origin', 'HEAD:develop', 'HEAD:refs/heads/sujet/autre');
  writeFileSync(join(d.travail, TICKET), ticket(ACCORD));
  d.git('commit', '-q', '-am', 'accord large');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  d.git('update-ref', 'refs/remotes/origin/develop', d0);
  d.git('switch', '-q', 'feat/spec-all-demo-1-01-garde');
  const r = ecrire(d, 'scripts/agent/garde.mjs');
  refuse(r, /^scripts\/agent\/garde\.mjs : d'abord, relire les copies du ticket \(origin\/develop n'est pas au sommet d'origin\) : `git fetch --prune origin [^`]+`, puis refaire l'écriture\. Encore refusée : chemin sensible/);
  // Le geste du refus, tel qu'il est écrit, puis l'écriture refaite : la copie du sujet est héritée de D1, D2 fait foi.
  const geste = /`(git fetch --prune origin [^`]+)`/.exec(r.stderr)[1];
  d.git(...geste.split(' ').slice(1).map((a) => a.replace(/^'|'$/g, '')));
  passe(ecrire(d, 'scripts/agent/garde.mjs'));
  // Develop en retard ne juge rien, même pour une copie que le sujet a écrite : elle ne compte qu'une fois develop relu
  // (comptée sans lui, une copie héritée d'un accord que develop a retiré l'accorderait encore) ; relu, elle compte.
  const e = depot();
  const e0 = e.git('rev-parse', 'origin/develop').trim();
  e.git('switch', '-q', '--detach', 'origin/develop');
  writeFileSync(join(e.travail, 'docs/autre.md'), 'autre\n');
  e.git('add', '-A');
  e.git('commit', '-q', '-m', 'develop avance');
  e.git('push', '-q', 'origin', 'HEAD:develop');
  e.git('update-ref', 'refs/remotes/origin/develop', e0);
  e.git('switch', '-q', 'feat/spec-all-demo-1-01-garde');
  const re = ecrire(e, 'scripts/agent/garde.mjs');
  refuse(re, /^scripts\/agent\/garde\.mjs : d'abord, relire les copies du ticket \(origin\/develop n'est pas au sommet d'origin\) : /);
  e.git(...(/`(git fetch --prune origin [^`]+)`/.exec(re.stderr)[1]).split(' ').slice(1).map((a) => a.replace(/^'|'$/g, '')));
  passe(ecrire(e, 'scripts/agent/garde.mjs'));
  // Un accord que develop a retiré, hérité par un sujet : develop en retard ne le rend pas (essai du relecteur des
  // tickets 75 à 79, accord-retire.test.mjs).
  const f = depot({ surSujet: null, surDevelop: ACCORD });
  const f0 = f.git('rev-parse', 'origin/develop').trim();
  f.git('push', '-q', 'origin', `${f0}:refs/heads/sujet/autre`);
  f.git('switch', '-q', '--detach', 'origin/develop');
  writeFileSync(join(f.travail, TICKET), ticket('Sensibles: —'));
  f.git('commit', '-q', '-am', 'accord retiré');
  f.git('push', '-q', 'origin', 'HEAD:develop');
  f.git('fetch', '-q', 'origin');
  f.git('update-ref', 'refs/remotes/origin/develop', f0);
  f.git('switch', '-q', 'feat/spec-all-demo-1-01-garde');
  refuse(ecrire(f, 'scripts/agent/garde.mjs'), /relire les copies du ticket \(origin\/develop n'est pas au sommet d'origin\)/);
  f.git('fetch', '-q', 'origin', '+refs/heads/develop:refs/remotes/origin/develop');
  refuse(ecrire(f, 'scripts/agent/garde.mjs'), /^scripts\/agent\/garde\.mjs : chemin sensible/);
  // Une copie locale de develop absente est traitée de même : le refus dit de relire develop.
  const g = depot();
  g.git('update-ref', '-d', 'refs/remotes/origin/develop');
  refuse(ecrire(g, 'scripts/agent/garde.mjs'), /^scripts\/agent\/garde\.mjs : d'abord, relire les copies du ticket \(origin\/develop n'est pas au sommet d'origin\) : /);
});

test('régime 8 : dans un clone entier, un refus ne nomme jamais le clone superficiel, même quand la base de fusion ne se lit pas (un sujet orphelin) (la suite 23 du lot 5)', () => {
  const d = depot({ surSujet: null, surDevelop: ACCORD });
  d.git('switch', '-q', '--orphan', 'orphelin');
  mkdirSync(join(d.travail, 'docs/features/demo/all/issues'), { recursive: true });
  writeFileSync(join(d.travail, TICKET), ticket('Sensibles: —'));
  d.git('add', TICKET);
  d.git('commit', '-q', '-m', 'sujet orphelin');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/orphelin');
  d.git('fetch', '-q', 'origin');
  d.git('clean', '-qfdx');
  d.git('switch', '-q', '-f', 'feat/spec-all-demo-1-01-garde');
  assert.equal(d.git('rev-parse', '--is-shallow-repository').trim(), 'false');
  const r = ecrire(d, 'scripts/agent/garde.mjs');
  refuse(r, /^scripts\/agent\/garde\.mjs : chemin sensible/);
  assert.doesNotMatch(r.stderr, /superficiel|unshallow/, 'le geste du clone superficiel échouerait dans un clone entier');
});

// A-260 : hors des chemins sensibles de CONTRAT, le refus ne peut venir que de la liste des index générés.
test('un index généré de la liste du projet est refusé, sa commande nommée ; sans la liste, le même chemin passe ; un segment de plus passe', () => {
  const d = depot();
  passe(ecrire(d, 'docs/index/regles.md'));
  const docs = join(d.racine, 'outils/scripts/docs');
  writeFileSync(join(docs, 'index-generes.json'), JSON.stringify({ index: [{ chemin: 'docs/index/*.md', commande: 'node scripts/docs/index.mjs' }] }));
  refuse(ecrire(d, 'docs/index/regles.md'), /docs\/index\/regles\.md est généré : le régénérer avec « node scripts\/docs\/index\.mjs »/);
  passe(ecrire(d, 'docs/index/sous/regles.md'));
});
