# Les bancs de `socle-tests` tournent dans un projet sans API, et rendent leur dossier temporaire

Status: Fait — PR 171 (`b0e112d`, plugin 8.5.2)
Type: défaut
Modèle: sonnet — un import rendu paresseux et deux tests sautés avec leur raison dans `mutation-regles.test.mjs`, une phrase aux étapes 4 et 5 de `socle-tests`, et un `after()` qui retire les dossiers créés dans trois bancs ; rien à concevoir hors des décisions `A-257` et `A-258`. Le correctif de `mutation-regles.test.mjs` a été joué en écrivant ce ticket (« Vérification »). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.test.mjs` (l'import et les configurations, 11-16 ; `depot`, 116-127 ; le dossier `mutation-dehors-`, 137 ; `projet`, 166-176 ; les tests 229 et 247) ; `skills/monorepo/socle-tests/references/scripts/verify/tests-creux.test.mjs` (`depot`, 20-21) et `mutation-regles-synthese.test.mjs` (`projet`, 65-66) ; `skills/monorepo/socle-tests/SKILL.md` (étapes 4 et 5, lignes 32 et 33) et `references/CONTENU.md` (section de la mutation des règles, 25-34) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 113, en premier** (`A-258`) : 113 ajoute au garde `scripts/references-posees.test.mjs` l'assertion « dossier temporaire vide », qui ne passe qu'avec les trois bancs de ce ticket nettoyés ; une seule montée de version pour les deux. Aucun des tickets 93 à 110 ne touche ces fichiers. Le ticket 111 (`needs-info`) relira les exemples d'identifiants des tests de `socle-tests` : le second à entrer relit ces bancs sur `main`. Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

## Le besoin

Deux défauts des bancs que `socle-tests` pose dans un projet (`scripts/verify/`), relevés par le ticket 90 (« Ce qui a été trouvé en plus », 4 et 6) et laissés à la liste des suites (`A-209` point 5).

1. **Sans `apps/api/`, `mutation-regles.test.mjs` lève à l'import.** Un monorepo sans API, ou dont l'API vit ailleurs, a son `pnpm check:tickets` rouge dès la pose de `socle-tests`, sur un test qui ne dit rien de son code.
2. **Trois de ses bancs laissent leurs dossiers dans `TMPDIR`** : 16 `mutation-regles-*`, 1 `mutation-dehors-*`, 7 `tests-creux-*` et 5 `mutation-synthese-*` à chaque passage. Le pre-push et la CI d'un projet les jouent à chaque push.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `mutation-regles.test.mjs:13-16` : `trouver` cherche les deux configurations Stryker dans `../../gabarits/` (le plugin) puis dans `../../apps/api/` (le projet, étape 5 de `socle-tests`). Sans l'un ni l'autre, `CONFIG_NOYAU` vaut `undefined`, et `await import(pathToFileURL(CONFIG_NOYAU).href)` (`:16`) lève `ERR_INVALID_ARG_TYPE` avant le premier test. Rejoué : le banc posé seul sous `scripts/verify/` d'un dossier neuf rend `# tests 1`, `# fail 1`.
2. Seuls deux tests lisent ces configurations : « la config Stryker des règles lit le périmètre du paquet… » (`:229`, il lit `base` à `:242`) et « STRYKER_MUTATE remplace le périmètre… » (`:247`). `projet()` (`:166-176`) les copie dans le jouet (`:173-174`) ; les tests `--list` et `--lancer` (`:180-212`) n'en ont pas besoin : sans index, ou sans fichier du paquet, `--lancer` ne charge pas Stryker.
3. `socle-tests/SKILL.md:33` (étape 5) pose les deux configurations sous `apps/api/` et les scripts `mutation` et `mutation:regles` dans le `package.json` de l'API, sans dire le cas d'un projet sans API ; `:32` (étape 4) pose `mutation.yml`, dont les deux étapes lancent `pnpm --filter @{{SCOPE}}/{{PROJET}}-api` (`references/ci/mutation.yml:45`, `:58`).
4. `mkdtempSync` sans retrait : `mutation-regles.test.mjs:117` (`depot`) et `:137` (`mutation-dehors-`), `tests-creux.test.mjs:21`, `mutation-regles-synthese.test.mjs:66`. Mesuré : les 30 bancs de `references/` posés par `scripts/pose-du-socle.mjs` au régime 8, joués d'un seul `node --test` dans un `TMPDIR` neuf, laissent 96 dossiers, dont ces 29. Les autres sont au ticket 113.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-257`** et **`A-258`**. Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-257` (1) — Le banc sans configuration.** `const SANS_CONFIG = CONFIG && CONFIG_NOYAU ? false : "configuration Stryker absente (apps/api/ sans stryker.config.mjs ni stryker.regles.config.mjs) : rien à éprouver"` ; `base` ne s'importe que si `SANS_CONFIG` est faux. Les deux tests de `:229` et `:247` prennent `{ skip: SANS_CONFIG }` : sautés avec leur raison, visibles en `# SKIP`. `projet()` n'y copie les configurations que si elles existent ; il n'a pas à créer `apps/api/` : `depot()` le crée déjà, par `apps/api/src/a.ts` de ses fichiers (`:166-169`). Aucun autre test ne change. Pourquoi un saut et non un test qui ne s'écrit pas : un test absent ne se voit nulle part ; un saut se lit dans la sortie, avec sa raison. Dans le plugin, et dans le garde `references-posees.test.mjs` qui pose les gabarits sous `apps/api/` (`VOISINS` de `pose-du-socle.mjs:46-47`), `SANS_CONFIG` est faux : rien n'y est sauté, et `SAUTES` du garde ne change pas.
2. **`A-257` (2) — La pose sans API.** `socle-tests/SKILL.md`, étape 5 : « Sans `apps/api/` (un projet sans API, ou une API ailleurs) : ni les deux configurations Stryker, ni les scripts `mutation` et `mutation:regles` ; le banc `mutation-regles.test.mjs` saute alors ses deux tests de configuration, la raison dite. » Étape 4 : sans `apps/api/`, `mutation.yml` n'est pas posé (il lance les scripts de l'API). `references/CONTENU.md` le dit en une phrase dans sa section de la mutation des règles.
3. **`A-258` (1) — Chaque banc retire ce qu'il crée.** Dans chacun des trois bancs : `after` importé de `node:test` et `rmSync` de `node:fs` ; une liste `DOSSIERS` au niveau du module ; chaque `mkdtempSync` y pousse son dossier ; `after(() => { for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true }); })`. C'est la forme de `regles.test.mjs` (`ISOLE`, `after`, lignes 12-13 du banc posé). `rmSync` ne suit pas un lien : le lien vers `typescript` de `tests-creux.test.mjs:29` et le lien `src/lien` de `mutation-regles.test.mjs:140` sont retirés sans toucher leur cible (vérifié). Aucun `GARDER_JOUETS` ici : ce n'est pas le dépôt jouet partagé (`depot-jouet.mjs`), qui a déjà le sien.
4. **`A-258` (2) — La preuve** vient au ticket 113 : l'assertion « dossier temporaire vide » du garde. Ici, le banc ciblé de chaque fichier (« Surfaces »).
5. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre, une pour la PR de 112 et 113. La note dit le défaut corrigé, et qu'un projet repose `scripts/verify/` (`/maj-skills:socle-tests`, la pièce des bancs seule : « une mise à jour se fait pièce par pièce », `SKILL.md`, « Avant de commencer », 3).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.test.mjs:11-16` | `SANS_CONFIG`, l'import de `base` paresseux, le commentaire |
| `…/mutation-regles.test.mjs:116-127`, `:137` | `depot` et `mutation-dehors-` poussent leur dossier dans `DOSSIERS` ; `after` |
| `…/mutation-regles.test.mjs:166-176` | `projet()` : copie des configurations sous condition (`apps/api/` existe déjà par `depot()`) |
| `…/mutation-regles.test.mjs:229`, `:247` | **changent à dessein** : `{ skip: SANS_CONFIG }` en second argument ; leurs corps inchangés |
| `skills/monorepo/socle-tests/references/scripts/verify/tests-creux.test.mjs:20-21` | `DOSSIERS`, `after` |
| `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.test.mjs:65-66` | `DOSSIERS`, `after` |
| `skills/monorepo/socle-tests/SKILL.md:32-33` | décision 2 |
| `skills/monorepo/socle-tests/references/CONTENU.md:25-34` | décision 2, une phrase |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note (décision 5), que 113 complète |

Modèle : `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs:12-13` (`ISOLE`, `after`). Règle à lire : le README du plugin, le paragraphe des bancs posés (ligne 207).

## À faire, dans l'ordre

1. **Partir de `main`** : `git fetch origin main`, une branche neuve depuis `origin/main` ; noter son sommet et sa version.
2. **Les bancs, rouges** : poser les trois bancs seuls sous `scripts/verify/` d'un dossier neuf (avec `mutation-regles.mjs`, `mutation-regles-synthese.mjs`, `tests-creux.mjs`, `scripts/docs/identifiants.mjs` de `socle-monorepo` et un lien `node_modules` vers celui du plugin), et les jouer sous un `TMPDIR` neuf : `mutation-regles.test.mjs` lève à l'import ; les trois laissent leurs dossiers.
3. **Le patch** (décisions 1 et 3). Rejouer l'étape 2 : verts, `TMPDIR` vide.
4. **Les textes** (décision 2). Un commit ; la version et sa note.
5. **Les mutations**, puis **la vérification**. Le ticket 113 suit sur la même branche.

## Surfaces

| Surface | Banc |
| --- | --- |
| posé sans `apps/api/` : `mutation-regles.test.mjs` passe, `# tests 26`, `# pass 24`, `# skipped 2`, les deux sauts nomment leur raison | le banc posé seul (étape 2), recopié dans la PR |
| dans le plugin : `# tests 26`, `# pass 26`, `# skipped 0` | `node --test skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.test.mjs` |
| posé avec les gabarits (le garde, régimes 8 et 7) : aucun saut, `SAUTES` inchangé | `scripts/references-posees.test.mjs` |
| les trois bancs, joués sous un `TMPDIR` neuf, le laissent vide | l'étape 2 rejouée ; puis le garde du ticket 113 |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `base` importé sans condition | le banc posé sans `apps/api/` (levée à l'import) |
| `SANS_CONFIG` toujours vrai | le garde seul (`SAUTES` : deux sauts de plus) ; le banc du plugin, lui, sort en 0 avec deux sauts : ce n'est pas un rouge, la lecture de `# skipped 0` reste à la « Vérification » |
| `projet()` qui copie sans condition | le banc posé sans `apps/api/` (`ERR_INVALID_ARG_TYPE`, un `TypeError` : `copyFileSync(undefined, …)`) |
| l'`after` d'un des trois bancs retiré | l'étape 2 (`TMPDIR` non vide) ; le garde du ticket 113 |

## Vérification

1. Les bancs ciblés, dans le plugin : `env -u NODE_PATH node --test skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.test.mjs skills/monorepo/socle-tests/references/scripts/verify/tests-creux.test.mjs skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.test.mjs`, verts ; pour `mutation-regles.test.mjs`, lire `# skipped 0` dans la sortie (deux sauts dans le plugin sont un défaut, qu'aucun rouge ne dit).
2. Joué en écrivant ce ticket, sur `3daedcd` : le correctif de la décision 1 posé seul sans `apps/api/` rend 26 tests, 24 verts, 2 sautés ; dans le plugin, 26 verts.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH`, après le ticket 113 : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus les tests neufs des deux tickets), recopié dans la PR.

## Ce qui n'a pas été établi

- Une vraie pose de `socle-tests` dans un projet sans API, par une session qui suit `SKILL.md` : non jouée. Les étapes 3 et 6 (le gate `coverage-diff`, les critères de revue) n'y ont pas été relues pour ce cas.
- Une API posée sous un autre nom que `apps/api/` : le banc la tient pour absente, et saute ses deux tests.

## Hors périmètre

- Les bornes en millisecondes de `coverage-diff-regles.test.mjs:352` (2 000 ms) : aucun dépassement vu, une marge de deux ordres ; rien à faire tant qu'aucune ne dépasse (`A-263`).
- Les dossiers laissés par les bancs des autres skills : ticket 113.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur `origin/main` à `3daedcd` (plugin 8.5.0), sur la liste des suites (ticket 90, « Ce qui a été trouvé en plus », 4 et 6) ; le défaut rejoué, le correctif du banc joué dans un dépôt sans `apps/api/` et dans le plugin, les restes de `TMPDIR` mesurés.
