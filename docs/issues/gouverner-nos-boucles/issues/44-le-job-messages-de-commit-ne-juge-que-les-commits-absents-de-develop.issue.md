# Le job « Messages de commit » ne juge, sur une PR, que les commits absents de develop : `commits-a-relire.mjs` (report de `fedora` #1935), posé avec `fusionner` dans `scripts/chaine/`, appelé par l'étape de `ci.yml` du socle

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — un script et son banc donnés entiers (ils existent, éprouvés, sur `fedora`), une étape de `ci.yml` réécrite, quatre phrases de documentation et la version ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification »). Rien à concevoir.
Blocked by: — (`fedora` #1935, la PR dont ce ticket est le report, est **fusionnée** : 2026-11-16 à 13 h 47 UTC, par le produit, sur `develop` de `fedora`. Le ticket attendait cette fusion ; trié par l'architecte le 2026-11-16 : prêt ; zéro commit jugé sur une PR de develop vers main, décision retenue)
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/ci/ci.yml`, `skills/chaine/fusionner/scripts/commits-a-relire.mjs` (créé), `skills/chaine/fusionner/scripts/commits-a-relire.test.mjs` (créé), `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

Report de `fedora` #1935 (« fix(ci): job commits, sur une PR seuls les commits absents de develop sont jugés », ticket `SPEC_ALL_INF-14.17` de `fedora`), décision A-52 de l'architecte (carte, « Retours de `fedora` », 2026-11-16).

**Le défaut, présent dans le gabarit.** `skills/chaine/socle-chaine-de-production/references/ci/ci.yml:39-41`, étape « Messages de commit » du job `qualite`, sur une PR :

```yaml
run: pnpm exec commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }}
```

`commitlint --from X --to Y` juge `git log X..Y`, soit **tous** les commits de la tête qui ne sont pas dans la base. Pour une PR vers `develop` ou vers `main`, c'est la liste voulue. Pour une **PR de mise à jour d'un sujet** (base `sujet/<nom>`, tête = le sujet plus la fusion de develop, forme que le ticket 36 a ouverte et que le ticket 40 prolonge), la liste contient **les commits de develop** que la fusion apporte. Ils ont été jugés à leur entrée dans develop, et on ne les réécrit pas. Un seul ancien en-tête hors règle dans develop (sur `fedora` : un en-tête de 131 caractères, commit de #1856) et **toute PR de mise à jour reste rouge**, sans aucune retouche possible de l'auteur, sauf à étendre à la main la liste d'exceptions `EN_TETES_HISTORIQUES` de `commitlint.config.mjs`.

Rejoué ici sur un dépôt jouet (develop avec un commit `d2`, `sujet/x` parti avant `d2`, branche de mise à jour `maj` = fusion de develop dans le sujet, puis une retouche) : `git rev-list origin/sujet/x..HEAD` rend `retouche`, `merge develop` **et `d2`** ; avec `^origin/develop` en plus, `retouche` et `merge develop`. Le `commitlint` réel n'est pas installé dans la copie jetable : la liste de commits, seule chose qui change, est établie par git (`--from/--to` est `X..Y`) ; le banc ci-dessous joue un faux `commitlint`, comme celui de `fedora`.

**Second défaut, constaté sur `fedora`** : le journal du job était coupé avant l'erreur (`--verbose` sur une plage longue, sortie perdue au `process.exit`). Le script rend la sortie par `writeSync`. Même cause que le ticket 45 pour `coverage-diff` (là, rejoué : voir ce ticket).

### État de `fedora` #1935, relu le 2026-11-16

`MAJ-agency/fedora`, PR 1935, `state: closed`, `merged: true`, `merged_at: 2026-11-16T13:47:44Z`, base `develop`, tête `ci/spec-all-inf-14-17-commits-hors-develop`, 3 commits, 6 fichiers (422 lignes ajoutées, 7 retirées). **Le diff de fusion fait foi, pas la description de la PR** : la description dit encore « checkout `fetch-depth: 0` + `filter: tree:0` », alors que le ticket de la PR et son diff disent que le clone partiel a été **retiré après contre-revue** (voir « Ce qui ne se reporte pas »).

## Où

Base : `origin/main` à `fa7d3eb`, plugin **7.9.0**, **499 tests**. La session retrouve chaque ancrage par son texte.

### Ce que fait `fedora` (le diff de #1935)

- `.github/workflows/ci.yml`, job `commits` (séparé de leurs autres jobs) : `fetch-depth: 0` (au lieu de 100), variable `HORS: ${{ github.event_name == 'pull_request' && 'origin/develop' || '' }}`, et `pnpm dlx --package=@commitlint/cli@… --package=@commitlint/config-conventional@… node scripts/ci/commits-a-relire.mjs --de "$DE" --a "$A" ${HORS:+--hors "$HORS"}` à la place de `commitlint --from "$DE" --to "$A" --verbose`.
- `scripts/ci/commits-a-relire.mjs` (nouveau, 129 lignes) : `git rev-list --reverse <tête> ^<base> ^<hors>`, refus d'un clone superficiel (sortie 2), vérification des réfs, **un processus `commitlint` par commit** (message sur stdin), journal et récapitulatif par `writeSync`, point d'entrée `estPointEntree` (le correctif du ticket 43).
- `scripts/ci/commits-a-relire.test.mjs` (nouveau, huit tests sur dépôt jouet, faux `commitlint` par la variable `COMMITLINT`).
- `scripts/check.sh` : le banc entre dans `pnpm check`.
- Le ticket (`SPEC_ALL_INF-14-ci.17.issue.md`), l'index Anchorpost.

### Où cela vit dans le socle, comment cela est posé

- **Le script va avec `fusionner`, pas avec le socle de la chaîne** : `skills/chaine/fusionner/scripts/commits-a-relire.mjs` et son banc, posés en `scripts/chaine/` avec les autres (`skills/chaine/fusionner/SKILL.md:14` liste les fichiers posés ; `scripts/poses.test.mjs` pose tout le dossier `skills/chaine/fusionner/scripts`, donc le banc tourne aussi posé à plat, hors du plugin). Précédent exact : `migrations-ordre.mjs`, « même calcul que le capitaine » appelé par `ci.yml:38` (`node scripts/chaine/migrations-ordre.mjs origin/develop HEAD`). Raisons : le socle de la chaîne ne pose pas de scripts de `scripts/chaine/` ; `scripts/chaine/**` est déjà un chemin sensible du contrat (`chaine.json:3`), ce qui convient à un fichier que la CI exécute depuis la tête de la PR ; le glob `skills/*/*/scripts/*.test.mjs` de `pnpm test` joue le banc sans rien ajouter.
- **L'étape de `ci.yml`**, dans le job `qualite` (qui a déjà `fetch-depth: 0` et aucun `filter:`, donc rien à changer au checkout ; `origin/develop` y est présent, `actions/checkout` rapatriant toutes les branches à profondeur 0) : à la place du `run:` actuel,

  ```yaml
  - name: Messages de commit
    if: github.event_name == 'pull_request'
    env:
      BASE_SHA: ${{ github.event.pull_request.base.sha }}
      HEAD_SHA: ${{ github.event.pull_request.head.sha }}
    run: pnpm exec node scripts/chaine/commits-a-relire.mjs --de "$BASE_SHA" --a "$HEAD_SHA" --hors origin/develop
  ```

  `pnpm exec` met `node_modules/.bin` dans le `PATH` : le script y trouve le `commitlint` du projet (le même que `pnpm check:commit` et que le hook `commit-msg`), avec la configuration de la racine du projet. Le nom de l'étape et celui du job `qualite` ne changent pas : le check exigé reste le même.
- **`CONTENU.md`** : `skills/chaine/fusionner/references/CONTENU.md` gagne une section `## scripts/commits-a-relire.mjs` (après `migrations-ordre.mjs`, ligne 39) ; `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, section « La CI », gagne une phrase : l'étape « Messages de commit » ne juge que les commits absents de develop ; une PR de mise à jour ne relit pas develop.
- **`fusionner/SKILL.md:14`** : `scripts/commits-a-relire.mjs` s'ajoute à la liste posée dans `scripts/chaine/`.

### Comment ce ticket s'accorde avec `pose-du-socle` n° 1

`docs/issues/pose-du-socle/issues/1-ci-sans-expression-dans-run.issue.md` (`ready-for-agent`, `task`, plugin « 3.10.x », donc ancien) vise **la même ligne** : il fait passer `base.sha` et `head.sha` par `env:` (`BASE_SHA`, `HEAD_SHA`) pour qu'aucune expression `${{ }}` ne reste dans un `run:` (hygiène exigée par l'audit `zizmor` du même fichier ; pas d'injection exploitable : deux empreintes de 40 caractères).

Les deux s'emboîtent sans se contredire, **le second qui passe rebase** : ce ticket réécrit la même étape, avec **les mêmes noms `BASE_SHA` et `HEAD_SHA`** que le ticket 1, et n'y laisse aucune expression dans le `run:`. Donc :

- si ce ticket passe d'abord, le ticket 1 n'a plus rien à faire sur cette étape ; sa surface « aucun `${{` dans un `run:` » doit être revérifiée (`grep -nE '^\s*run:.*\$\{\{' skills/**/ci/*.yml`, vide) et le ticket **fermé** avec la mention « fait par le n° 44 » ;
- si le ticket 1 passe d'abord, ce ticket remplace la ligne `run:` du ticket 1 par celle ci-dessus et garde son `env:`.

Aucun des deux ne **bloque** l'autre. La session de ce ticket lit le ticket 1 avant d'écrire, et le ferme si elle le subsume.

### Ce qui ne se reporte pas (propre à `fedora`)

- Les runners « fedora-rapide » et le volume `/travail` : c'est la raison pour laquelle `fedora` **interdit `filter:`** au checkout du job (le clone partiel écrirait `remote.origin.promisor` dans un `.git` gardé d'un job à l'autre, et les jobs suivants hériteraient du filtre sans jeton pour rapatrier les arbres). Le gabarit tourne sur `ubuntu-24.04`, clone neuf à chaque job, et son job `qualite` n'a pas de `filter:` : rien à interdire, et le commentaire de `fedora` ne se reporte pas.
- Le job `commits` séparé et sa condition `push` : le gabarit a une étape, pour les seules PR (`if: github.event_name == 'pull_request'`). Le script garde la plage d'un push (`--de` `--a` sans `--hors`) parce que son banc la couvre, mais le gabarit ne l'appelle pas ainsi.
- `pnpm dlx --package=@commitlint/cli@… --package=@commitlint/config-conventional@…` : `fedora` n'installe pas les dépendances dans ce job. Le gabarit a joué `pnpm install --frozen-lockfile` plus haut dans `qualite`.
- `scripts/check.sh`, l'index Anchorpost, `required-checks`, les numéros `SPEC_ALL_INF-14.17`, le modèle `scripts/deploy/gel.mjs`, la phrase sur `ADR_ALL_ARC-4`.
- `EN_TETES_HISTORIQUES` : **reste** dans `commitlint.config.mjs` du socle (`racine/commitlint.config.mjs:15`, aujourd'hui vide) ; elle sert encore à la livraison d'un sujet et aux commits qui entrent dans develop.

### Ce que le report change pour un projet

- **PR vers `develop`** : inchangé (la base est déjà develop).
- **PR de mise à jour d'un sujet** (base `sujet/…`) : ne relit plus develop.
- **PR de `develop` vers `main`** (livraison) : **zéro commit jugé**, tous sont dans `origin/develop`. Décision de l'architecte de `fedora` (2026-11-16), reprise : sans elle, cette PR resterait rouge sur le moindre ancien en-tête. Conséquence : un titre hors règle entré dans develop n'est jamais rejugé ; le gabarit ne juge que les PR, pas les pushs. Un commit entre dans develop par une PR vers develop (jugée là) ou par une sous-PR squashée dont le titre est contrôlé par `sujet.sh` avant fusion.
- **Un projet déjà posé** : son `ci.yml` n'est pas réécrit par ce ticket. La ligne de `admin.md` du socle ou du `README` qui dit comment reprendre un gabarit de CI suffit, s'il y en a une ; sinon rien.

## Décisions

1. **Un script, repris de `fedora` presque à l'identique**, donné entier ci-dessous. Écarts : (a) l'en-tête cite `scripts/chaine/` ; (b) le banc **retire ses dossiers temporaires** (`after` de `node:test`, convention du ticket 31 ; `fedora` n'en retire aucun) ; (c) `fileURLToPath(import.meta.url)` à la place de `import.meta.dirname` (plus portable) ; (d) pas de référence à un ticket de `fedora`.
2. **Sur une PR, toujours `--hors origin/develop`**, quelle que soit la base (décision de `fedora`, reprise).
3. **Un clone superficiel est refusé**, sortie 2 : jamais une liste tronquée. Le job `qualite` clone à profondeur 0 ; le refus protège un projet qui réglerait autrement son checkout.
4. **Le point d'entrée** suit l'idiome du ticket 43 (`pathToFileURL(realpathSync(…))` dans un `try`). Ce script le porte déjà, sous la forme exportée `estPointEntree(urlModule, chemin)` que son banc teste ; ce n'est pas la forme sans paramètre du ticket 43 : si 43 passe avant, la session peut aligner la forme (une ligne) et garder le test « point d'entrée » de ce banc, qui joue le script par un lien symbolique et un dossier à espace et accent. **Aucun ordre imposé** entre 43 et 44.
5. **Version** : patch du plugin (`7.9.1` à l'écriture, à recaler sur `main` : les tickets 39, 40 et 43 la montent aussi).

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge sur `origin/main`

Créer `skills/chaine/fusionner/scripts/commits-a-relire.test.mjs` avec le contenu ci-dessous, **mot pour mot**. Sans le script (§ 1), `node --test skills/chaine/fusionner/scripts/commits-a-relire.test.mjs` échoue à l'import : `ERR_MODULE_NOT_FOUND` (joué le 2026-11-16 sur `fa7d3eb`).

```js
// `node --test scripts/chaine/commits-a-relire.test.mjs` : commits jugés par la CI, sur un dépôt jouet.
// Le faux commitlint refuse un en-tête de plus de 120 caractères.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commitsAJuger, estPointEntree, lireArguments, principal } from './commits-a-relire.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const LONG = `docs(x): ${'t'.repeat(122)}`; // 131 caractères, un ancien en-tête entré dans develop

// Les dossiers du banc, retirés à la sortie (convention des bancs de la chaîne).
const dossiers = [];
const dossier = (prefixe) => {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiers.push(d);
  return d;
};
after(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true });
});

function g(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function commit(cwd, titre) {
  g(cwd, 'commit', '--allow-empty', '-q', '-m', titre);
  return g(cwd, 'rev-parse', 'HEAD');
}

// develop : d1 — LONG — d3 ; sujet part de d1 (s1) ; la branche de mise à jour fusionne develop.
function depot() {
  const r = dossier('commits-a-relire-');
  g(r, 'init', '-q', '-b', 'develop');
  g(r, 'config', 'user.email', 'jouet@example.invalid');
  g(r, 'config', 'user.name', 'Jouet');
  const d1 = commit(r, 'chore: d1');
  const long = commit(r, LONG);
  const d3 = commit(r, 'chore: d3');
  g(r, 'checkout', '-q', '-b', 'sujet/jouet', d1);
  const s1 = commit(r, 'feat(jouet): s1');
  g(r, 'checkout', '-q', '-b', 'chore/maj', s1);
  g(r, 'merge', '-q', '--no-ff', '-m', 'chore(sujet): fusionne develop dans sujet/jouet', 'develop');
  const maj = g(r, 'rev-parse', 'HEAD');
  const faux = join(r, 'faux-commitlint.mjs');
  writeFileSync(
    faux,
    [
      "let m = '';",
      "process.stdin.on('data', (c) => (m += c));",
      "process.stdin.on('end', () => {",
      "  const titre = m.split('\\n')[0];",
      '  if ([...titre].length <= 120) process.exit(0);',
      '  process.stdout.write(`✖   header must not be longer than 120 characters, current length is ${[...titre].length} [header-max-length]\\n`);',
      '  process.exit(1);',
      '});',
    ].join('\n'),
  );
  return { r, d1, long, d3, s1, maj, env: { COMMITLINT: `node ${faux}` } };
}

// principal() écrit par writeSync sur les descripteurs 1 et 2 : on le lance dans un processus enfant.
function lancer(argv, cwd, env) {
  try {
    const sortie = execFileSync(process.execPath, [join(ICI, 'commits-a-relire.mjs'), ...argv], {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, sortie, erreur: '' };
  } catch (e) {
    return { code: e.status, sortie: `${e.stdout ?? ''}`, erreur: `${e.stderr ?? ''}` };
  }
}

test('mise à jour de sujet, hors develop : seul le merge est jugé, le vieux titre long ne compte plus', () => {
  const j = depot();
  assert.deepEqual(commitsAJuger({ de: j.s1, a: j.maj, hors: 'develop' }, j.r).commits, [j.maj]);
  const res = lancer(['--de', j.s1, '--a', j.maj, '--hors', 'develop'], j.r, j.env);
  assert.equal(res.code, 0, res.sortie + res.erreur);
  assert.match(res.sortie, /1 commit\(s\) à juger/);
});

test('mise à jour de sujet, sans --hors (comportement précédent) : le titre de develop la rougit', () => {
  const j = depot();
  const res = lancer(['--de', j.s1, '--a', j.maj], j.r, j.env);
  assert.equal(res.code, 1);
  // Le journal montre la ligne fautive et la règle, puis le récapitulatif.
  assert.match(res.sortie, new RegExp(`✖ ${j.long.slice(0, 10)} ${LONG.replace('(x)', '\\(x\\)')} \\(131 caractères\\)`));
  assert.match(res.sortie, /header-max-length/);
  assert.match(res.sortie, /1 message\(s\) refusé\(s\) :\n {2}\S+ docs\(x\)/);
});

test('un commit fautif propre à la PR reste refusé, même hors develop', () => {
  const j = depot();
  const fautif = commit(j.r, `fix(jouet): ${'u'.repeat(115)}`);
  const res = lancer(['--de', j.s1, '--a', fautif, '--hors', 'develop'], j.r, j.env);
  assert.equal(res.code, 1);
  assert.match(res.sortie, new RegExp(`✖ ${fautif.slice(0, 10)} fix\\(jouet\\)`));
  assert.doesNotMatch(res.sortie, new RegExp(j.long.slice(0, 10)));
});

test('PR vers develop : base = develop, la liste est celle de base..tête', () => {
  const j = depot();
  g(j.r, 'checkout', '-q', '-b', 'feat/x', 'develop');
  const f1 = commit(j.r, 'feat(x): f1');
  const f2 = commit(j.r, 'feat(x): f2');
  const avec = commitsAJuger({ de: j.d3, a: f2, hors: 'develop' }, j.r).commits;
  const sans = commitsAJuger({ de: j.d3, a: f2 }, j.r).commits;
  assert.deepEqual(avec, [f1, f2]);
  assert.deepEqual(sans, [f1, f2]);
});

test('push (sans --hors) : la plage poussée, du plus ancien au plus récent', () => {
  const j = depot();
  assert.deepEqual(commitsAJuger({ de: j.d1, a: j.d3 }, j.r).commits, [j.long, j.d3]);
});

test('clone superficiel : refusé en sortie 2, jamais une liste tronquée', () => {
  const j = depot();
  const clone = dossier('commits-a-relire-clone-');
  g(clone, 'clone', '-q', '--depth', '1', '--no-single-branch', `file://${j.r}`, '.');
  const refs = ['--de', 'origin/sujet/jouet', '--a', 'origin/chore/maj', '--hors', 'origin/develop'];
  const res = lancer(refs, clone, j.env);
  assert.equal(res.code, 2);
  assert.match(res.erreur, /clone superficiel/);
  // Le même clone rendu complet juge le merge seul.
  g(clone, 'fetch', '-q', '--unshallow');
  const complet = lancer(refs, clone, j.env);
  assert.equal(complet.code, 0, complet.sortie + complet.erreur);
});

test('réf introuvable ou usage invalide : sortie 2 expliquée', () => {
  const j = depot();
  const absente = lancer(['--de', j.s1, '--a', j.maj, '--hors', 'origin/develop'], j.r, j.env);
  assert.equal(absente.code, 2);
  assert.match(absente.erreur, /--hors origin\/develop : commit introuvable/);
  assert.equal(lireArguments(['--de', 'x']), null);
  assert.equal(lireArguments(['--a', 'y']), null);
  assert.equal(lireArguments(['--de', 'x', '--a', 'y', '--autre', 'z']), null);
  assert.deepEqual(lireArguments(['--de', 'x', '--a', 'y']), { de: 'x', a: 'y' });
  assert.equal(principal(['--de'], j.r, j.env), 2);
});

test("point d'entrée : lancé par un lien symbolique, depuis un dossier à espace et accent, une plage fautive sort en 1", () => {
  const j = depot();
  const dossierAccent = join(dossier('commits-a-relire-'), 'dossier à espace é');
  mkdirSync(dossierAccent);
  const copie = join(dossierAccent, 'commits-a-relire.mjs');
  copyFileSync(join(ICI, 'commits-a-relire.mjs'), copie);
  const lien = join(dossierAccent, 'lien vers le script.mjs');
  symlinkSync(copie, lien);
  for (const script of [copie, lien]) {
    const r = spawnSync(process.execPath, [script, '--de', j.s1, '--a', j.maj], {
      cwd: j.r,
      env: { ...process.env, ...j.env },
      encoding: 'utf8',
    });
    assert.equal(r.status, 1, `${script} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /1 message\(s\) refusé\(s\)/);
  }
  assert.equal(estPointEntree('file:///nulle/part.mjs', undefined), false);
  assert.equal(estPointEntree('file:///nulle/part.mjs', join(dossierAccent, 'absent.mjs')), false);
});
```

### 1. `skills/chaine/fusionner/scripts/commits-a-relire.mjs` (créé)

Avec le contenu ci-dessous, **mot pour mot**. Le banc passe alors : **8 sur 8** (joué le 2026-11-16 sur une copie de `fa7d3eb`, `TMPDIR` privé vide ensuite : aucun dossier `commits-a-relire-*` laissé).

```js
#!/usr/bin/env node
// Messages de commit jugés par la CI (jumeau du hook commit-msg), étape « Messages de commit » de ci.yml.
//
//   node scripts/chaine/commits-a-relire.mjs --de <base> --a <tête> [--hors <réf>]
//
// Juge, du plus ancien au plus récent, chaque commit de `<base>..<tête>` ; avec `--hors`, ceux déjà
// atteignables depuis cette réf sont écartés. Sur une PR, `--hors origin/develop` : une PR qui met un
// sujet à jour avec develop (base `sujet/…`) ne relit plus les commits déjà dans develop, qu'on ne
// réécrit pas. Sur une PR vers develop, la base est déjà develop : rien ne change.
//
// L'historique doit être complet (`fetch-depth: 0` au checkout) : sur un clone superficiel,
// `git rev-list` s'arrête à la frontière sans le dire, et un commit fautif passerait (ou un commit de
// develop, non reconnu comme tel, ferait échouer le job). Le script refuse donc un clone superficiel
// (sortie 2) au lieu de juger une liste incomplète.
//
// Chaque message passe par la commande `commitlint` du PATH (variable `COMMITLINT` pour la
// remplacer, utilisée par le banc), un processus par commit, sortie capturée puis réécrite d'un bloc
// synchrone : le journal montre toujours la ligne fautive (le `commitlint --verbose` d'une plage
// longue était coupé avant l'erreur, tube vidé par `process.exit`). Récapitulatif des refusés en fin.
//
// Sorties : 0 tous conformes, 1 au moins un refusé, 2 usage, réf introuvable ou clone superficiel.
import { spawnSync } from 'node:child_process';
import { realpathSync, writeSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { ok: r.status === 0, sortie: (r.stdout ?? '').trim(), erreur: (r.stderr ?? '').trim() };
}

function ecrire(fd, texte) {
  writeSync(fd, texte.endsWith('\n') ? texte : `${texte}\n`);
}

export function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    const valeur = argv[i + 1];
    if (!['--de', '--a', '--hors'].includes(cle) || valeur === undefined || valeur === '') {
      return null;
    }
    options[cle.slice(2)] = valeur;
  }
  return options.de && options.a ? options : null;
}

// Liste des commits à juger, du plus ancien au plus récent, ou une erreur expliquée.
export function commitsAJuger({ de, a, hors }, cwd) {
  const superficiel = git(['rev-parse', '--is-shallow-repository'], cwd);
  if (!superficiel.ok) return { erreur: `pas un dépôt git : ${superficiel.erreur}` };
  if (superficiel.sortie === 'true') {
    return { erreur: 'clone superficiel : la liste des commits serait incomplète. Au checkout : fetch-depth: 0.' };
  }
  for (const [nom, ref] of [['--de', de], ['--a', a], ['--hors', hors]]) {
    if (ref === undefined) continue;
    if (!git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd).ok) {
      return { erreur: `${nom} ${ref} : commit introuvable dans le clone.` };
    }
  }
  const exclus = [`^${de}`, ...(hors ? [`^${hors}`] : [])];
  const liste = git(['rev-list', '--reverse', a, ...exclus, '--'], cwd);
  if (!liste.ok) return { erreur: `git rev-list : ${liste.erreur}` };
  return { commits: liste.sortie === '' ? [] : liste.sortie.split('\n') };
}

export function principal(argv, cwd = process.cwd(), env = process.env) {
  const options = lireArguments(argv);
  if (!options) {
    ecrire(2, 'usage : node scripts/chaine/commits-a-relire.mjs --de <base> --a <tête> [--hors <réf>]');
    return 2;
  }
  const { commits, erreur } = commitsAJuger(options, cwd);
  if (erreur) {
    ecrire(2, `✖ commits-a-relire : ${erreur}`);
    return 2;
  }
  const portee = options.hors ? `, hors ${options.hors}` : '';
  ecrire(1, `${commits.length} commit(s) à juger (${options.de}..${options.a}${portee}).`);
  const commande = env.COMMITLINT ?? 'commitlint';
  const refuses = [];
  for (const sha of commits) {
    const message = git(['log', '-1', '--format=%B', sha], cwd).sortie;
    const titre = message.split('\n')[0];
    const r = spawnSync(commande, [], { cwd, input: `${message}\n`, encoding: 'utf8', shell: true });
    if (r.status === 0) {
      ecrire(1, `✔ ${sha.slice(0, 10)} ${titre}`);
      continue;
    }
    refuses.push({ sha, titre });
    ecrire(1, `✖ ${sha.slice(0, 10)} ${titre} (${[...titre].length} caractères)`);
    ecrire(1, `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() || `(commitlint : sortie ${r.status})`);
  }
  if (refuses.length === 0) {
    ecrire(1, 'Tous les messages sont conformes.');
    return 0;
  }
  ecrire(1, `\n${refuses.length} message(s) refusé(s) :`);
  for (const { sha, titre } of refuses) ecrire(1, `  ${sha.slice(0, 10)} ${titre}`);
  return 1;
}

// Point d'entrée comparé en URL du chemin réel : un lien symbolique, une espace ou un accent dans
// le chemin ne doivent jamais laisser le script sortir en 0 sans avoir rien jugé.
export function estPointEntree(urlModule, chemin) {
  if (!chemin) return false;
  try {
    return urlModule === pathToFileURL(realpathSync(chemin)).href;
  } catch {
    return false;
  }
}

if (estPointEntree(import.meta.url, process.argv[1])) {
  process.exitCode = principal(process.argv.slice(2));
}
```

### 2. `skills/chaine/socle-chaine-de-production/references/ci/ci.yml`

Remplacer l'étape « Messages de commit » (lignes 39-41) par celle de « Où » (avec `env:`). Le reste du fichier ne change pas. Puis `zizmor` sur le fichier (version épinglée du job `zizmor`) : aucune alerte `template-injection`.

### 3. Les textes

- `skills/chaine/fusionner/SKILL.md:14` : ajouter `scripts/commits-a-relire.mjs` à la liste des fichiers posés dans `scripts/chaine/`.
- `skills/chaine/fusionner/references/CONTENU.md` : section `## scripts/commits-a-relire.mjs` après celle de `migrations-ordre.mjs` : ce qu'il juge (les commits de la tête absents de la base et de develop), pourquoi (une PR de mise à jour ne relit pas develop), le refus d'un clone superficiel, le journal complet, et que la CI du gabarit l'appelle.
- `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, section « La CI » : une phrase (voir « Où »).
- `docs/issues/pose-du-socle/issues/1-…issue.md` : si ce ticket le subsume, `Status:` du n° 1 passe à `Fait — par le n° 44` (forme des tickets faits du dépôt) avec une ligne sous `## Comments`.

### 4. La version : `.claude-plugin/plugin.json:3`

`"version"` seule, patch.

## Surfaces

| Surface | Preuve |
| --- | --- |
| mise à jour de sujet, hors develop : seul le merge est jugé | `commits-a-relire.test.mjs` « mise à jour de sujet, hors develop : seul le merge est jugé, le vieux titre long ne compte plus » |
| sans `--hors`, comportement précédent, ligne fautive au journal | « mise à jour de sujet, sans --hors (comportement précédent) : le titre de develop la rougit » |
| un commit fautif propre à la PR reste refusé | « un commit fautif propre à la PR reste refusé, même hors develop » |
| PR vers develop et push inchangés | « PR vers develop : base = develop, la liste est celle de base..tête », « push (sans --hors) : la plage poussée, du plus ancien au plus récent » |
| clone superficiel refusé | « clone superficiel : refusé en sortie 2, jamais une liste tronquée » |
| réf introuvable, usage invalide | « réf introuvable ou usage invalide : sortie 2 expliquée » |
| point d'entrée par lien symbolique, espace et accent | « point d'entrée : lancé par un lien symbolique, depuis un dossier à espace et accent, une plage fautive sort en 1 » |
| le gabarit appelle le script | `grep -n "commits-a-relire" skills/chaine/socle-chaine-de-production/references/ci/ci.yml` rend l'étape ; aucun `${{` dans un `run:` du fichier |
| le banc tourne posé à plat | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » reste vert (il pose tout `skills/chaine/fusionner/scripts`) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Dans une copie jetable de `origin/main` : `git worktree add --detach <dossier jetable> origin/main`, un `TMPDIR` privé (`export TMPDIR=<dossier jetable>/tmp && mkdir -p "$TMPDIR"`).

- Le banc du § 0 seul : **rouge** (`ERR_MODULE_NOT_FOUND`). Avec le § 1 : **8 verts sur 8**.
- `pnpm install --frozen-lockfile && pnpm test` : le compte de `origin/main` **plus 8** (499 + 8 = **507**), tout vert, sans test retiré ni sauté. `git diff origin/main --stat -- '*.test.mjs'` ne montre que le banc du § 0.
- `ls "$TMPDIR" | grep -c '^commits-a-relire'` vaut **0** après la passe.
- `zizmor` sur `ci.yml` (§ 2). **Non joué ici** : la CI réelle d'un projet posé (`commitlint` du projet, `pnpm exec node …`) ; la session le dit dans sa PR, ou le joue sur un projet jetable si elle en a un. Le banc couvre le choix des commits ; ce que `commitlint` de la racine du projet refuse relève de sa configuration.
- Retirer la copie jetable à la fin (`git worktree remove --force`) et le `TMPDIR` privé.

## Hors périmètre

- Le ticket 40 (PR de mise à jour avec retouches) change ce qu'une PR de mise à jour **contient** ; ce ticket change ce que la CI en **juge**. Après 40, les commits de retouche de la PR sont jugés comme les autres (ils sont absents de develop).
- Un job `commits` séparé et un déclencheur `push` dans le gabarit : non repris.

## Comments

- 2026-11-16 — Rédigé le jour même de la fusion de `fedora` #1935 (13 h 47 UTC). `needs-triage` : l'architecte décide du tri. Le script et son banc ont été retapés depuis le diff de la PR (écarts listés en décision 1), joués sur une copie de `fa7d3eb` : 8 verts sur 8 avec le script, rouge sans. La description de la PR (`filter: tree:0`) est périmée : c'est le diff de fusion qui fait foi.
