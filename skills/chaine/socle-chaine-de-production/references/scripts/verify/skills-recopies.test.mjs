// Le gate `skills-recopies` sur des projets jouets. Posé dans un projet, ce banc ne dépend que de lui :
// il construit ses dossiers (fichiers et manifeste, sha256 calculé ici) et lance le script du gate
// avec PROJET_RACINE. Seul le dernier test cherche scripts/recopier-skills.mjs, présent dans le dépôt
// `skills` seulement.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const GATE = fileURLToPath(new URL('skills-recopies.mjs', import.meta.url));
const sha = (texte) => createHash('sha256').update(texte).digest('hex');

/** Projet jouet : `fichiers` (chemin relatif à `.claude/skills/` → contenu) et, si `manifeste`, son manifeste. */
function projet(fichiers, manifeste) {
  const racine = mkdtempSync(join(tmpdir(), 'skills-recopies-'));
  const ecrire = (chemin, contenu) => {
    mkdirSync(dirname(join(racine, '.claude/skills', chemin)), { recursive: true });
    writeFileSync(join(racine, '.claude/skills', chemin), contenu);
  };
  for (const [chemin, contenu] of Object.entries(fichiers)) ecrire(chemin, contenu);
  if (manifeste !== undefined) ecrire('maj-skills.json', typeof manifeste === 'string' ? manifeste : JSON.stringify(manifeste));
  return { racine, ecrire };
}
const lancer = ({ racine }) => spawnSync(process.execPath, [GATE], { env: { ...process.env, PROJET_RACINE: racine }, encoding: 'utf8' });
const manifesteDe = (fichiers, skills = ['chantier']) => ({
  source: 'MAJ-agency/skills',
  version: '5.0.2',
  skills,
  fichiers: Object.fromEntries(Object.entries(fichiers).map(([c, t]) => [c, sha(t)])),
});
const COPIE = { 'chantier/SKILL.md': '# chantier\n', 'chantier/references/a.md': 'a\n' };
const intacte = () => projet(COPIE, manifesteDe(COPIE));

test('copie intacte : code 0', () => {
  const r = lancer(intacte());
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OK \(maj-skills 5\.0\.2\)/);
});

test('fichier modifié : code 1, le chemin nommé', () => {
  const p = intacte();
  p.ecrire('chantier/SKILL.md', '# chantier modifié\n');
  const r = lancer(p);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\.claude\/skills\/chantier\/SKILL\.md : modifié/);
  assert.match(r.stderr, /la copie des skills diffère de son manifeste \(maj-skills 5\.0\.2\) : elle ne se modifie pas dans ce projet\. La rétablir depuis la branche d'intégration, ou attendre la PR de recopie\./);
});

test('fichier supprimé : code 1, le chemin nommé', () => {
  const p = projet({ 'chantier/SKILL.md': COPIE['chantier/SKILL.md'] }, manifesteDe(COPIE));
  const r = lancer(p);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /chantier\/references\/a\.md : absent/);
});

test('fichier ajouté dans un dossier recopié : code 1, « en trop »', () => {
  const p = intacte();
  p.ecrire('chantier/references/profond/b.md', 'b\n');
  const r = lancer(p);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /chantier\/references\/profond\/b\.md : en trop/);
});

test('un skill propre au projet, que le manifeste ne nomme pas, est sans effet', () => {
  const p = intacte();
  p.ecrire('parcours-federation/SKILL.md', '# propre\n');
  const r = lancer(p);
  assert.equal(r.status, 0, r.stderr);
});

test('sans manifeste : code 0, aucune copie déclarée', () => {
  const r = lancer(projet({ 'parcours-federation/SKILL.md': '# propre\n' }));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /aucune copie de skills déclarée/);
});

test('manifeste invalide : code 1, le fichier nommé', () => {
  for (const manifeste of ['{ pas du json', '[]', '{"skills":"chantier","fichiers":{}}', '{"skills":[1],"fichiers":{}}', '{"skills":[],"fichiers":[]}', '{"skills":[],"fichiers":{"a":1}}']) {
    const r = lancer(projet({}, manifeste));
    assert.equal(r.status, 1, manifeste);
    assert.match(r.stderr, /\.claude\/skills\/maj-skills\.json/, manifeste);
  }
});

test('les autres clés du manifeste sont ignorées, une version absente s’affiche « ? »', () => {
  const p = projet(COPIE, { $comment: 'x', skills: ['chantier'], fichiers: manifesteDe(COPIE).fichiers, autre: 1 });
  assert.equal(lancer(p).status, 0);
  p.ecrire('chantier/SKILL.md', 'autre\n');
  assert.match(lancer(p).stderr, /maj-skills \?\)/);
});

const RECOPIER = fileURLToPath(new URL('../../../../../../scripts/recopier-skills.mjs', import.meta.url));
// Dans le dépôt `skills` seulement : le script de copie n'existe pas dans un projet.
test('la copie que pose scripts/recopier-skills.mjs passe le gate : les deux empreintes sont les mêmes', { skip: !existsSync(RECOPIER) }, () => {
  const racine = mkdtempSync(join(tmpdir(), 'skills-recopies-'));
  try {
    const copie = spawnSync(process.execPath, [RECOPIER, racine], { encoding: 'utf8' });
    assert.equal(copie.status, 0, copie.stderr);
    const r = lancer({ racine });
    assert.equal(r.status, 0, r.stderr);
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});
