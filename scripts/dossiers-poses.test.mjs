// Ticket 91 : les scripts que le plugin pose dans un projet sont du code vendu, que le projet ne modifie jamais et que la
// CI du plugin tient ; le lint et le formateur du projet (gabarit de `socle-monorepo`) les laissent donc de côté, par une
// liste unique : le bloc `socle:poses-du-plugin` de `.prettierignore`, que Prettier et lint-staged suivent d'eux-mêmes et
// qu'`eslint.config.mjs` lit. Ce garde tient la liste égale aux dossiers de `scripts/` que les skills posent : un dossier
// posé hors de la liste ferait rougir le lint de tout projet posé (14 erreurs au plugin 8.3.0), et chaque repose
// rediffèrerait d'avec le plugin, reformatée au commit.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { destinationDuDossier, RACINE, VOISINS_PAR_DOSSIER } from './pose-du-socle.mjs';

const GABARIT = 'skills/monorepo/socle-monorepo/references/racine';
const lire = (chemin) => readFileSync(join(RACINE, chemin), 'utf8');
// Les dossiers de `scripts/` qu'un skill pose sans qu'ils soient du code vendu, chacun avec sa raison.
const HORS_DE_LA_LISTE = {
  // socle-nest-hexagonal, étape « poser » : un script shell, que ni ESLint ni Prettier ne lisent ; le dossier reste au
  // projet, qui y écrit les siens.
  'scripts/db': 'demarrer-local.sh',
};

/** La liste du bloc `socle:poses-du-plugin` d'un `.prettierignore` : `['scripts/agent', …]`, ou `null` sans bloc. */
export function blocDuPlugin(texte) {
  const m = /^# socle:poses-du-plugin\n([\s\S]*?)^# \/socle:poses-du-plugin$/m.exec(texte);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/\/$/, ''));
}

/** Les dossiers de `scripts/` d'un projet que les skills posent, chacun avec ce qui le dit : `Map<dossier, [sources]>`. */
export function dossiersPoses() {
  const poses = new Map();
  const noter = (dossier, source) => poses.set(dossier, [...(poses.get(dossier) ?? []), source]);
  for (const famille of readdirSync(join(RACINE, 'skills')))
    for (const skill of readdirSync(join(RACINE, 'skills', famille))) {
      const base = `skills/${famille}/${skill}`;
      // `references/agent/` et `references/scripts/<d>/` : leur place de projet (la table du ticket 90).
      if (existsSync(join(RACINE, base, 'references/agent'))) noter(destinationDuDossier(`${base}/references/agent`), `${base}/references/agent`);
      for (const sous of ['references/scripts', 'references/squelette/scripts'])
        if (existsSync(join(RACINE, base, sous)))
          for (const d of readdirSync(join(RACINE, base, sous), { withFileTypes: true }))
            if (d.isDirectory()) noter(`scripts/${d.name}`, `${base}/${sous}/${d.name}`);
      // Ce que le texte d'un skill nomme dans `scripts/<d>/` d'un projet (`→ scripts/chaine/`, « posés sous
      // `scripts/verify/` ») : `SKILL.md` et la table de la racine.
      for (const f of ['SKILL.md', 'references/TABLE-RACINE.md'])
        if (existsSync(join(RACINE, base, f)))
          for (const m of lire(`${base}/${f}`).matchAll(/`scripts\/([a-z0-9-]+)\//g)) noter(`scripts/${m[1]}`, `${base}/${f}`);
    }
  // Les scripts des skills de la chaîne posés à plat sous `scripts/chaine/` (étapes `poser`, table de `pose-du-socle.mjs`).
  for (const [source, vers] of VOISINS_PAR_DOSSIER) noter(vers, source);
  return poses;
}

test('blocDuPlugin : la liste entre les deux marqueurs, sans commentaire ni barre finale ; sans bloc, null', () => {
  assert.deepEqual(blocDuPlugin('x\n# socle:poses-du-plugin\n# un mot\nscripts/a/\n\nscripts/b\n# /socle:poses-du-plugin\ny\n'), ['scripts/a', 'scripts/b']);
  assert.equal(blocDuPlugin('scripts/a/\n'), null);
});

test('la liste du gabarit de .prettierignore est celle des dossiers de scripts/ que les skills posent, ni plus ni moins', () => {
  const liste = blocDuPlugin(lire(`${GABARIT}/.prettierignore`));
  assert.ok(liste, `${GABARIT}/.prettierignore : bloc socle:poses-du-plugin absent`);
  const poses = dossiersPoses();
  for (const d of Object.keys(HORS_DE_LA_LISTE)) assert.ok(poses.has(d), `${d} : hors de la liste, mais plus posé par aucun skill`);
  const attendus = [...poses.keys()].filter((d) => !Object.hasOwn(HORS_DE_LA_LISTE, d)).sort();
  const manquants = attendus.filter((d) => !liste.includes(d)).map((d) => `${d} (${poses.get(d).join(', ')})`);
  assert.deepEqual(manquants, [], 'posés par un skill, absents du bloc socle:poses-du-plugin de .prettierignore : les y ajouter');
  assert.deepEqual(liste.filter((d) => !attendus.includes(d)), [], 'dans le bloc, mais posés par aucun skill (ou au projet : HORS_DE_LA_LISTE)');
  assert.ok(attendus.length >= 5, `${attendus.length} dossiers posés lus`);
});

test('eslint.config.mjs du gabarit lit le bloc de .prettierignore et en ignore chaque dossier ; lint-staged ne lint rien d’ignoré', () => {
  const config = lire(`${GABARIT}/eslint.config.mjs`);
  const debut = config.indexOf('const prettierignore = ');
  const fin = config.indexOf(';', config.indexOf('.map((dossier) =>', debut));
  assert.ok(debut >= 0 && fin > debut, 'la lecture du bloc dans eslint.config.mjs');
  // La lecture telle qu'écrite, jouée sur le `.prettierignore` du gabarit.
  const lireLeBloc = new Function('readFileSync', 'join', 'root', `${config.slice(debut, fin + 1)}\nreturn posesDuPlugin;`);
  const globs = lireLeBloc((f) => readFileSync(f, 'utf8'), join, join(RACINE, GABARIT));
  assert.deepEqual(globs, blocDuPlugin(lire(`${GABARIT}/.prettierignore`)).map((d) => `${d}/**`));
  // Un `.prettierignore` en fins de ligne CRLF se lit de même ; sans le bloc, la configuration lève une erreur qui le
  // dit, jamais une liste vide (ESLint relirait les scripts posés : 14 erreurs au plugin 8.3.0). Relecture du ticket 91.
  const sur = (texte) => lireLeBloc(() => texte, join, '/projet');
  assert.deepEqual(sur('x\r\n# socle:poses-du-plugin\r\nscripts/a/\r\n# /socle:poses-du-plugin\r\n'), ['scripts/a/**']);
  for (const texte of ['node_modules\n', '# /socle:poses-du-plugin\nscripts/a/\n# socle:poses-du-plugin\n'])
    assert.throws(() => sur(texte), /\.prettierignore : le bloc « # socle:poses-du-plugin » … « # \/socle:poses-du-plugin » manque/, JSON.stringify(texte));
  const ignores = /ignores: \[([\s\S]*?)\]/.exec(config)?.[1] ?? '';
  assert.match(ignores, /\.\.\.posesDuPlugin,/, 'les dossiers lus vont aux ignores d’ESLint');
  // lint-staged passe les fichiers stagés par leur nom : Prettier saute de lui-même ce que `.prettierignore` ignore, ESLint
  // seulement avec `--no-warn-ignored` (sans lui, un avertissement par fichier ignoré, refusé par `--max-warnings 0`).
  const etapes = Object.values(JSON.parse(lire(`${GABARIT}/package.json`))['lint-staged']).flat();
  for (const e of etapes.filter((e) => e.startsWith('eslint'))) assert.match(e, /--no-warn-ignored/, e);
});
