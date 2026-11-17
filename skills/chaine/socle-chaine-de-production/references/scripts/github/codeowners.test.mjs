import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { COMMANDE, ecartsCodeowners, FICHIER, genererCodeowners, motifCodeowners } from './codeowners.mjs';

const SCRIPT = fileURLToPath(new URL('./codeowners.mjs', import.meta.url));
// Le contrat : celui du projet quand le banc est posé (`scripts/github/` → `.claude/chaine.json`), sinon le gabarit
// du plugin (`references/scripts/github/` → `references/chaine.json`), sinon les gardes de la chaîne, écrites ici.
const lisible = (url) => {
  const f = fileURLToPath(url);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
};
const GABARIT = lisible(new URL('../../.claude/chaine.json', import.meta.url)) ??
  lisible(new URL('../../chaine.json', import.meta.url)) ?? {
    cheminsSensibles: ['scripts/agent/**', 'scripts/chaine/**', 'scripts/github/**', '.husky/**', '.github/workflows/**', '.github/actions/**', 'scripts/docs/identifiants.mjs', '.claude/**'],
  };
const contrat = (plus = {}) => ({ ...GABARIT, proprietaires: ['@alice', '@exemple/relecteurs'], ...plus });

test('chaque chemin sensible du gabarit, CODEOWNERS et chaine.json appartiennent aux propriétaires, ancrés à la racine', () => {
  const { texte, erreurs } = genererCodeowners(contrat());
  assert.equal(erreurs, undefined);
  const lignes = texte.split('\n').filter((l) => l !== '' && !l.startsWith('#'));
  const motifs = lignes.map((l) => l.split(/\s+/)[0]);
  assert.deepEqual(motifs, [...new Set([...GABARIT.cheminsSensibles, '.github/CODEOWNERS', '.claude/chaine.json'].map((m) => `/${m.replace(/^\.\//, '')}`))]);
  for (const l of lignes) assert.match(l, / @alice @exemple\/relecteurs$/, l);
  assert.match(texte, /^# Généré depuis \.claude\/chaine\.json/);
  assert.ok(texte.includes(COMMANDE), 'l’en-tête dit la commande qui régénère');
  assert.match(texte, /branche visée par la PR/);
});

test('un chemin sensible ajouté par le projet entre dans CODEOWNERS ; un doublon n’y entre qu’une fois', () => {
  const sensibles = [...GABARIT.cheminsSensibles, 'apps/api/src/infrastructure/**/auth/', '.claude/chaine.json'];
  const { texte } = genererCodeowners(contrat({ cheminsSensibles: sensibles }));
  assert.match(texte, /^\/apps\/api\/src\/infrastructure\/\*\*\/auth\/ +@alice/m);
  assert.equal(texte.match(/^\/\.claude\/chaine\.json /gm).length, 1);
});

test('la génération est déterministe : même contrat, même texte', () => {
  assert.equal(genererCodeowners(contrat()).texte, genererCodeowners(contrat()).texte);
});

test('sans propriétaire, ou avec un propriétaire mal formé : erreur, aucun texte', () => {
  for (const proprietaires of [undefined, [], ['alice'], ['@'], ['@a b'], [42], ['bob@exemple.fr']]) {
    const r = genererCodeowners(contrat({ proprietaires }));
    assert.equal(r.texte, undefined, JSON.stringify(proprietaires));
    assert.ok(r.erreurs.some((e) => /^proprietaires/.test(e)), JSON.stringify(proprietaires));
  }
  assert.equal(genererCodeowners(contrat({ proprietaires: ['@alice', '@org/equipe-1', '@org/equipe.x_2'] })).erreurs, undefined);
  assert.ok(genererCodeowners(contrat({ proprietaires: ['bob@exemple.fr'] })).erreurs.some((e) => /courriel/.test(e)), 'un courriel : le capitaine ne le lit pas');
});

test('un motif que CODEOWNERS lit autrement est refusé, jamais traduit', () => {
  for (const m of ['src/?uth/', 'src/[ab]/', '!src/', 'src/#x', 'src\\x', 'src/a b', '/src/', '', '  ']) assert.ok(motifCodeowners(m).erreur, JSON.stringify(m));
  assert.deepEqual(motifCodeowners('scripts/agent/**'), { motif: '/scripts/agent/**' });
  assert.deepEqual(motifCodeowners('./apps/*/auth/'), { motif: '/apps/*/auth/' });
  assert.ok(genererCodeowners(contrat({ cheminsSensibles: ['src/[ab]/'] })).erreurs.some((e) => /cheminsSensibles/.test(e)));
  assert.ok(genererCodeowners(contrat({ cheminsSensibles: 'scripts/**' })).erreurs.some((e) => /cheminsSensibles/.test(e)));
});

test('un ** qui n’est pas un segment entier est refusé : GitHub le lit comme un *', () => {
  for (const m of ['**.sh', 'scripts/**.mjs', 'a**/b', 'a/**b', 'a/b**', '***', 'a/***/b'])
    assert.match(motifCodeowners(m).erreur ?? '', /\*\*/, m);
  for (const m of ['**', '**/', '**/auth/', 'apps/**/auth/', 'scripts/agent/**', '**/*.pem', 'a/**/b/**'])
    assert.equal(motifCodeowners(m).erreur, undefined, m);
});

test('un motif dégénéré est refusé : « . », un segment « . » ou « .. », « // », « ~ »', () => {
  for (const m of ['.', './', '..', 'apps/../scripts/**', 'apps/./auth/', 'a/.', 'apps//auth/', '//', '~/x', 'apps/~auth/', 'a~'])
    assert.ok(motifCodeowners(m).erreur, m);
  for (const m of ['.claude/**', '.github/workflows/**', 'apps/.env.example', 'a.b/c..d/'])
    assert.equal(motifCodeowners(m).erreur, undefined, m);
});

test('ecartsCodeowners : égal → aucun écart ; absent, ligne changée, ligne ajoutée → l’écart avec sa ligne', () => {
  const { texte } = genererCodeowners(contrat());
  assert.deepEqual(ecartsCodeowners(texte, texte), []);
  assert.deepEqual(ecartsCodeowners(texte.replace(/\n/g, '\r\n'), texte), []);
  assert.deepEqual(ecartsCodeowners(null, texte), [`${FICHIER} absent`]);
  const [change] = ecartsCodeowners(texte.replace('/.husky/** ', '/.husky/*  '), texte);
  assert.match(change, /^\.github\/CODEOWNERS:\d+ : « \/\.husky\/\* /);
  assert.equal(ecartsCodeowners(`${texte}/apps/ @mallory\n`, texte).length, 1);
});

const projet = (chaine, codeowners) => {
  const d = mkdtempSync(join(tmpdir(), 'codeowners-'));
  mkdirSync(join(d, '.claude'));
  writeFileSync(join(d, '.claude/chaine.json'), typeof chaine === 'string' ? chaine : JSON.stringify(chaine));
  if (codeowners !== undefined) {
    mkdirSync(join(d, '.github'));
    writeFileSync(join(d, FICHIER), codeowners);
  }
  return d;
};
const jouer = (d, ...args) => spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, PROJET_RACINE: d }, encoding: 'utf8' });

test('le gate : CODEOWNERS régénéré → OK ; un chemin sensible ajouté sans régénérer → rouge, avec la commande', () => {
  const d = projet(contrat());
  try {
    assert.equal(jouer(d).status, 1, 'absent : rouge');
    const ecrit = jouer(d, '--ecrire');
    assert.equal(ecrit.status, 0, ecrit.stderr);
    const ok = jouer(d);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /codeowners : OK/);
    writeFileSync(join(d, '.claude/chaine.json'), JSON.stringify(contrat({ cheminsSensibles: [...GABARIT.cheminsSensibles, 'apps/api/src/auth/'] })));
    const rouge = jouer(d);
    assert.equal(rouge.status, 1);
    assert.ok(rouge.stderr.includes(COMMANDE), rouge.stderr);
    assert.equal(jouer(d, '--ecrire').status, 0);
    assert.equal(jouer(d).status, 0);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('le gate : CODEOWNERS édité à la main → rouge ; contrat illisible ou sans propriétaire → sortie 2, rien d’écrit', () => {
  const d = projet(contrat());
  try {
    jouer(d, '--ecrire');
    const ecrit = readFileSync(join(d, FICHIER), 'utf8');
    writeFileSync(join(d, FICHIER), ecrit.replace(/ @exemple\/relecteurs/g, ''));
    assert.equal(jouer(d).status, 1, 'un propriétaire retiré à la main');
    writeFileSync(join(d, FICHIER), `${ecrit}/apps/ @mallory\n`);
    assert.equal(jouer(d).status, 1, 'une ligne ajoutée à la main');
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
  for (const chaine of ['{ pas du json', { ...GABARIT }]) {
    const e = projet(chaine);
    try {
      const r = jouer(e, '--ecrire');
      assert.equal(r.status, 2, r.stderr);
      assert.equal(spawnSync('test', ['-e', join(e, FICHIER)]).status, 1, 'rien n’est écrit');
      assert.equal(jouer(e).status, 2);
    } finally {
      rmSync(e, { recursive: true, force: true });
    }
  }
});
