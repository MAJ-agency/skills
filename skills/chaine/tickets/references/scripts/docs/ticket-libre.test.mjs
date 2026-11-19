import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { ENV, depotJouet, script } from './depot-jouet.mjs';

const SCRIPT = script('docs/ticket-libre.mjs');
const TICKET = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.03.issue.md';
const lancer = ({ travail, bin }, id = 'SPEC_ALL_SOC-1.03') => spawnSync(process.execPath, [SCRIPT, id], { cwd: travail, env: { ...ENV, PATH: bin }, encoding: 'utf8' });

test('libre côté git, PR non vérifiées sans gh : sortie 3 et la recherche MCP', () => {
  const r = lancer(depotJouet({ fichiers: { [TICKET]: '# SPEC_ALL_SOC-1.03\n\nStatus: ready-for-agent\n' } }));
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /PR NON VÉRIFIÉES/);
  assert.match(r.stdout, /search_pull_requests\(owner: "[^"]+", repo: "origine", query: "SPEC_ALL_SOC-1\.03 is:open"\)/);
});

test('pris : ligne Status en cours sur develop, ou branche distante qui porte le slug', () => {
  const r1 = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: en cours — feat/spec-all-soc-1-03-x\n' } }));
  assert.equal(r1.status, 1);
  assert.match(r1.stdout, /PRIS/);
  const r2 = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' }, branches: ['feat/spec-all-soc-1-03-couche'] }));
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /branche distante : feat\/spec-all-soc-1-03-couche/);
});

test("une branche à l'ancienne forme, ou d'un autre ticket, ne prend pas le ticket", () => {
  const r = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' }, branches: ['feat/soc-1-03-couche', 'feat/spec-all-soc-1-04-autre', 'feat/spec-all-soc-11-03-autre'] }));
  assert.equal(r.status, 3, r.stdout);
});

test("introuvable, archivé, ou demandé à l'ancienne forme", () => {
  assert.equal(lancer(depotJouet()).status, 2);
  const r = lancer(depotJouet({ fichiers: { 'docs/features/socle/all/issues/archive/SPEC_ALL_SOC-1-socle.03.issue.md': '# x\n\nStatus: Fait — PR #1\n' } }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /archivé/);
  const ancien = lancer(depotJouet({ fichiers: { [TICKET]: '# x\n\nStatus: ready-for-agent\n' } }), 'SOC-1.03');
  assert.equal(ancien.status, 2);
  assert.match(ancien.stderr, /Usage : node scripts\/docs\/ticket-libre\.mjs <SPEC>\.<NN>/);
});

test("un ticket vivant seulement sur une branche de sujet est lu, dans le dossier d'un autre contexte", async () => {
  const d = depotJouet();
  d.git('checkout', '-q', '-b', 'sujet/fof');
  const chemin = 'docs/features/fof/fnsmr/issues/SPEC_FNSMR_FOF-11-x.04.issue.md';
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(`${d.travail}/docs/features/fof/fnsmr/issues`, { recursive: true });
  writeFileSync(`${d.travail}/${chemin}`, '# x\n\nStatus: ready-for-agent\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'docs: ticket');
  d.git('push', '-q', 'origin', 'HEAD:refs/heads/sujet/fof');
  const r = lancer(d, 'spec_fnsmr_fof-11.04');
  assert.equal(r.status, 3, r.stderr);
  assert.match(r.stdout, /SPEC_FNSMR_FOF-11\.04 — docs\/features\/fof\/fnsmr\/issues\/SPEC_FNSMR_FOF-11-x\.04\.issue\.md/);
});

/**
 * Un faux `gh` dans `bin` : un script Node qui répond selon l'URL de son argument et ignore `--jq`
 * en rendant directement les lignes TSV attendues. `reponses` : `{ sous-chaîne d'URL: sortie }`, la
 * première qui correspond ; `ECHEC` fait sortir 1.
 */
const ECHEC = Symbol('echec');
function fauxGh({ bin }, reponses) {
  const table = Object.entries(reponses).map(([motif, sortie]) => [motif, sortie === ECHEC ? null : sortie]);
  writeFileSync(
    `${bin}/gh`,
    `#!${process.execPath}\nconst url = process.argv.find((a) => a.startsWith('repos/')) ?? '';\n` +
      `for (const [motif, sortie] of ${JSON.stringify(table)}) if (url.includes(motif)) { if (sortie === null) process.exit(1); process.stdout.write(sortie); process.exit(0); }\nprocess.exit(1);\n`,
  );
  chmodSync(`${bin}/gh`, 0o755);
}
const OUVERTES = 'pulls?state=open';
const LIBRE_ST = { [TICKET]: '# x\n\nStatus: ready-for-agent\n' };

test('pris : une PR ouverte ajoute le fichier du ticket, sans l\'identifiant ni dans son titre ni dans sa branche', () => {
  const d = depotJouet({ fichiers: LIBRE_ST });
  fauxGh(d, { [OUVERTES]: '42\tfeat/autre-chose\ttrue\tfeat: autre chose\n', 'pulls/42/files': `modified\t${TICKET}\t\n` });
  const r = lancer(d);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /PRIS/);
  assert.match(r.stdout, /PR #42 \(brouillon\) : feat: autre chose \[feat\/autre-chose\] — modifie docs\/features\/socle\/all\/issues\/SPEC_ALL_SOC-1-socle\.03\.issue\.md/);
});

test('pris : une PR ouverte ajoute le même numéro sous un autre slug', () => {
  const d = depotJouet({ fichiers: LIBRE_ST });
  fauxGh(d, { [OUVERTES]: '43\tfeat/x\tfalse\tfeat: x\n', 'pulls/43/files': 'added\tdocs/features/socle/all/issues/SPEC_ALL_SOC-1-autre-nom.03.issue.md\t\n' });
  const r = lancer(d);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /PR #43 : feat: x \[feat\/x\] — ajoute .*autre-nom\.03\.issue\.md/);
});

test('libre : une PR ouverte qui supprime le fichier, ou l\'archive, ne prend rien', () => {
  const d = depotJouet({ fichiers: LIBRE_ST });
  fauxGh(d, {
    [OUVERTES]: '44\tfeat/a\tfalse\tfeat: a\n45\tfeat/b\tfalse\tfeat: b\n46\tfeat/c\tfalse\tfeat: c\n',
    'pulls/44/files': `removed\t${TICKET}\t\n`,
    'pulls/45/files': 'added\tdocs/features/socle/all/issues/archive/SPEC_ALL_SOC-1-socle.03.issue.md\t\n',
    'pulls/46/files': `renamed\tdocs/autre.md\t${TICKET}\n`,
  });
  const r = lancer(d);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /LIBRE/);
});

test('libre : la branche distante d\'une PR fermée ne prend plus le ticket ; sans PR, elle le prend toujours', () => {
  const branche = 'feat/spec-all-soc-1-03-abandon';
  const ferme = depotJouet({ fichiers: LIBRE_ST, branches: [branche] });
  const tete = ferme.git('rev-parse', 'HEAD').trim();
  fauxGh(ferme, { [OUVERTES]: '', 'state=all': `closed\t${tete}\n` });
  const r1 = lancer(ferme);
  assert.equal(r1.status, 0, r1.stdout);
  assert.match(r1.stdout, /branche d'une PR fermée, ignorée : feat\/spec-all-soc-1-03-abandon/);
  assert.doesNotMatch(r1.stdout, /PRIS/);

  const sans = depotJouet({ fichiers: LIBRE_ST, branches: [branche] });
  fauxGh(sans, { [OUVERTES]: '', 'state=all': '' });
  const r2 = lancer(sans);
  assert.equal(r2.status, 1, r2.stdout);
  assert.match(r2.stdout, /branche distante : feat\/spec-all-soc-1-03-abandon/);

  // une PR fermée dont la tête n'est plus celle de la branche : la branche a repris vie
  const repris = depotJouet({ fichiers: LIBRE_ST, branches: [branche] });
  fauxGh(repris, { [OUVERTES]: '', 'state=all': 'closed\t0000000000000000000000000000000000000000\n' });
  assert.equal(lancer(repris).status, 1);
});

test('sans gh, le repli fait lire les fichiers des PR ouvertes et ne retient que l\'identifiant entier', () => {
  const d = depotJouet({ fichiers: LIBRE_ST, branches: ['feat/spec-all-soc-1-03-couche'] });
  const r = lancer(d);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /branche distante : feat\/spec-all-soc-1-03-couche \(PR non vérifiée\)/);
  assert.match(r.stdout, /list_pull_requests\(owner: "[^"]+", repo: "origine", head: "[^"]+:feat\/spec-all-soc-1-03-couche", state: "all"\)/);
  const libre = lancer(depotJouet({ fichiers: LIBRE_ST }));
  assert.equal(libre.status, 3, libre.stdout);
  assert.match(libre.stdout, /query: "SPEC_ALL_SOC-1\.03 is:open"/);
  assert.match(libre.stdout, /identifiant entier/);
  assert.match(libre.stdout, /list_pull_requests\(owner: "[^"]+", repo: "origine", state: "open"\)/);
  assert.match(libre.stdout, /pull_request_read\(method: "get_files", owner: "[^"]+", repo: "origine", pullNumber: <n>\)/);
  assert.match(libre.stdout, /SPEC_ALL_SOC-1-<slug>\.03\.issue\.md/);
});

test('un gh qui échoue à la lecture des fichiers : PR non vérifiées, jamais « libre »', () => {
  const d = depotJouet({ fichiers: LIBRE_ST });
  fauxGh(d, { [OUVERTES]: '42\tfeat/a\tfalse\tfeat: a\n', 'pulls/42/files': ECHEC });
  assert.equal(lancer(d).status, 3);
});

test('un ticket qui n\'existe que dans une PR ouverte sort en 2 : sa spec n\'est pas fusionnée', () => {
  const d = depotJouet();
  fauxGh(d, { [OUVERTES]: '42\tfeat/a\tfalse\tfeat: a\n', 'pulls/42/files': `added\t${TICKET}\t\n` });
  const r = lancer(d);
  assert.equal(r.status, 2, r.stdout);
  assert.match(r.stderr, /introuvable/);
});
