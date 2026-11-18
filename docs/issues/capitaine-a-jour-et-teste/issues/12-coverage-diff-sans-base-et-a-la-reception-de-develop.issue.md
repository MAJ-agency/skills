# coverage-diff : un fichier que seules des suites sur base couvrent ne fait plus échouer un pre-push sans base, et la réception de develop ne remesure plus ce que develop apporte

Status: ready-for-agent
Type: défaut
Modèle: sonnet — deux règles pures à ajouter à `coverage-diff-regles.mjs` sur le modèle de celles qui y sont, deux points d'appel dans `coverage-diff.mjs`, et des bancs sur dépôt jouet avec un faux Vitest ; le correctif d'Iroki sert de référence de comportement.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff-regles.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff-regles.test.mjs`, `skills/monorepo/socle-tests/references/CONTENU.md`, `skills/monorepo/socle-tests/SKILL.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 12 (points C9 et C10, décision `A-24` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 9 et 10. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests** ; `coverage-diff.test.mjs` 10 tests, `coverage-diff-regles.test.mjs` 12 tests). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Deux défauts vécus chez Iroki.**

- **Sans base locale, le pre-push échoue sur un repository.** Le capitaine d'Iroki tourne sur une machine recyclée, sans `DATABASE_URL`. `coverage-diff` ne joue alors pas les suites `*.db.spec.ts` (`coverage-diff.mjs:275`). Un fichier qu'elles seules couvrent sort à 0 %, et le pre-push échoue (l. 305-319), alors que la CI, qui a Postgres, l'aurait jugé vert.
- **La réception de develop dans un sujet remesure le code de develop.** Le plugin le sait déjà pour une forme : la PR de mise à jour dont le premier commit est la fusion de develop dans le sujet (`fusionRecalculee`, l. 105-123, depuis 7.10.1). Toute autre forme se mesure contre la base entière : une fusion dont le premier parent est develop, une retouche avant la fusion, un sujet qui a avancé depuis, la fusion d'essai de GitHub. Le code apporté par develop y compte comme du code neuf.

**Quand le ticket est fait :**

1. Sans `DATABASE_URL`, un fichier en échec qu'une suite `*.db.spec.ts` de son paquet cible (par un import relatif ou par un alias du `tsconfig.json`) passe en **avertissement** : marque `⚠`, une ligne `AVERTISSEMENT`, sortie 0 s'il n'y a pas d'autre échec. Avec `DATABASE_URL`, rien ne change. Sous GitHub Actions, jamais d'avertissement.
2. Quand `fusionRecalculee` ne reconnaît pas la forme, que HEAD contient `origin/develop` et que la base ne le contient pas, le diff se lit contre `origin/develop`, et la sortie le dit. Sinon, rien ne change.
3. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet recopie.

## Où

`cov/` abrège `skills/monorepo/socle-tests/references/scripts/verify/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `cov/coverage-diff-regles.mjs` | 1-6 | En-tête : les deux règles nouvelles. |
| idem | après 184 (fin, après `choisirBase`) | `importsDe(source)`, `suiteSurBaseCible(fichier, specs, alias, existe)` et `referenceDuDiff({ base, fusion, developLisible, headContientDevelop, baseContientDevelop })` (Décisions 1 et 3). Pures, sans git ni fichier : modèle `decisionSansBase` (commentaire l. 112-119, fonction l. 120-127). |
| `cov/coverage-diff.mjs` | 1-42 | En-tête : étape 1 (le repli sur `origin/develop`), étape 3 (l'avertissement sans base). Les sorties ne changent pas. |
| idem | 172-175 | `fusion`, `REFERENCE` et `COMPARE_A` passent par `referenceDuDiff` : la fusion recalculée d'abord, puis le repli, puis la base. |
| idem | 186-191 | Le message « aucun fichier de code » nomme la référence réellement lue. |
| idem | 274-293 | Par paquet : `sansBase` (un `vitest.db.config.ts`, pas de `DATABASE_URL`, pas `GITHUB_ACTIONS=true`), une ligne `⚠ suites sur base non jouées …` une fois, puis le classement de chaque fichier en échec (Décision 2). |
| idem | 300-320 | La marque `⚠`, les lignes `AVERTISSEMENT`, et `echecs` qui ne compte que les vrais échecs. |
| `cov/coverage-diff-regles.test.mjs` | fin | Les tests des trois règles (voir « Ordre de travail »). |
| `cov/coverage-diff.test.mjs` | 14-77, 153-176, fin | Le faux Vitest et le dépôt à suite sur base ; les deux tests qui changent de sens ; les tests nouveaux. |
| `skills/monorepo/socle-tests/references/CONTENU.md` | 15 | Le paragraphe de la base : le repli sur `origin/develop`, et l'avertissement sans base ; « toute autre forme […] se mesure comme avant, contre la base entière » devient faux, à réécrire. |
| `skills/monorepo/socle-tests/SKILL.md` | 17 | Même correction, en une phrase. |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (voir « La version et la note »). |

Appelants réels : `.husky/pre-push` du projet (`pnpm run check:coverage --base-auto`, `SKILL.md:31`), le job CI qui a Postgres (`--base "origin/$BASE"` avec `DATABASE_URL`, `SKILL.md:32`), et le pre-push lancé par `passer.sh` et `sujet.sh` du capitaine quand ils poussent une mise à jour.

**Références, à réécrire et jamais à copier** (les scripts d'Iroki ont divergé : ils n'ont pas `fusionRecalculee`), sur `develop` d'Iroki :

- C9, `SPEC_ALL_SOC-4.77`, PR #633 (`ba743007`) : `scripts/verify/coverage-diff-regles.mjs:196-243` (`importsDe`, `suiteSurBaseCible`) ; `scripts/verify/coverage-diff.mjs:269-308` (`suitesSurBase`, `sansBase`) et `:330-378` (classement, marque, lignes `AVERTISSEMENT`) ; banc `scripts/verify/coverage-diff-sans-base.test.mjs` (son faux Vitest, l. 17-31).
- C10, `SPEC_ALL_SOC-4.82`, PR #649 (`232b8b0d`) : `scripts/verify/coverage-diff-regles.mjs:172-194` (`referenceDuDiff`) ; `scripts/verify/coverage-diff.mjs:123-157` ; banc `scripts/verify/coverage-diff-reception-develop.test.mjs`.

Règles à lire : l'en-tête de `cov/coverage-diff.mjs` (l. 1-42) et `cov/coverage-diff-regles.mjs` en entier.

## Décisions

Tenue (spec) : `A-24` — un fichier couvert seulement par des suites sur base passe en avertissement quand `DATABASE_URL` manque, la CI juge ; à la réception de develop, `fusionRecalculee` reste et le critère d'Iroki s'y ajoute en repli (HEAD contient `origin/develop`, la base non : diff contre `origin/develop`).

Précisions du ticket :

1. **« Couvert seulement par des suites sur base » se lit dans les sources, jamais mesuré.** `suiteSurBaseCible(fichier, specs, alias, existe)` est vrai si une spec `*.db.spec.ts` du paquet (suivie ou non suivie, hors ignorées) importe le fichier, ou son module : le dossier s'il porte un `index.*` et qu'aucun fichier frère `<dossier>.ts` n'existe, ou le `<dossier>.module` voisin. Import relatif, ou par un alias de `compilerOptions.paths` du `tsconfig.json` du paquet (`"@x/*": ["src/x/*"]`) ; `tsconfig.json` illisible : seuls les imports relatifs comptent. `import type` et `export type … from` ne comptent pas : un type n'est pas exécuté. Lu dans `from "…"`, `import "…"` et `import("…")`.
2. **Le classement.** Un fichier dont `verdict` rend des problèmes devient un avertissement si, et seulement si : son paquet a un `vitest.db.config.ts`, `DATABASE_URL` est absente, `GITHUB_ACTIONS` ne vaut pas `true`, et `suiteSurBaseCible` est vrai. Sinon l'échec reste, comme aujourd'hui. Sorties et messages, à garder tels quels (les bancs les lisent) :
   - une fois, avant les paquets : `  ⚠ suites sur base non jouées (*.db.spec.ts) : DATABASE_URL absente (<paquets>). Un fichier que seules elles ciblent est seulement signalé, jugé par la CI avec Postgres.` ;
   - par fichier, après le tableau : `  AVERTISSEMENT <fichier> : couverture non mesurée sans base : la CI la juge avec Postgres (<problèmes>)`.
   La garde `GITHUB_ACTIONS` est un ajout du ticket. Un job de CI sans `DATABASE_URL` (mal configuré) ferait sinon passer en avertissement ce que personne d'autre ne juge. Le capitaine et les sessions cloud n'ont pas cette variable : ils gardent l'avertissement.
3. **Le repli à la réception.** `referenceDuDiff` rend `{ reference, sorte, note }`, `sorte` valant `fusion`, `develop` ou `base` :
   - `fusion` non nulle (la forme stricte de `fusionRecalculee`) : elle gagne, comme aujourd'hui ;
   - sinon, si `base` vaut `origin/develop` : `base` ;
   - sinon, si `origin/develop` est illisible : `base`, avec la note `origin/develop illisible : diff lu contre <base>, sans repli` ;
   - sinon, si HEAD contient `origin/develop` et que la base ne le contient pas : `develop`. La référence est alors `git merge-base origin/develop HEAD`, et `COMPARE_A` vaut `origin/develop (<sha court>), HEAD contient develop et <base> non : le code que develop apporte n'est pas remesuré` ;
   - sinon : `base`.
   Le critère est le contenu, jamais le nom de la branche. Une sous-PR d'un sujet qui a déjà reçu develop ne change pas : sa base contient develop. Une PR de develop vers `main` se lit contre develop, donc sans fichier : ce qu'elle porte a été jugé dans develop.
4. **Limite connue, écrite dans l'en-tête et dans `CONTENU.md`.** Dans le repli, le travail propre du sujet qui n'est pas dans develop est remesuré : il diffère de develop. C'est plus que l'écart à la fusion, jamais moins. La fusion recalculée reste la mesure la plus juste quand elle s'applique.
5. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne de `referenceDuDiff`, le nom des fonctions de lecture des specs dans `coverage-diff.mjs`, le découpage des tests. Elle ne tranche **pas** : l'ordre de la Décision 3, la garde `GITHUB_ACTIONS`, les messages.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Chaque test est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Les règles pures (`cov/coverage-diff-regles.test.mjs`)

- « suiteSurBaseCible : un import relatif ou par alias du fichier, de son dossier à index ou de son module voisin cible le fichier ; un import de type, d'un autre fichier ou d'un dossier qui a un fichier frère ne le cible pas »
- « referenceDuDiff : la fusion recalculée gagne ; base develop inchangée ; develop illisible, la base et la note ; HEAD contient develop et la base non, develop ; sinon la base »

Rouges sur `main` : les deux fonctions n'existent pas.

### 2. Les bancs sur dépôt jouet (`cov/coverage-diff.test.mjs`)

Un faux Vitest, écrit par le banc dans `apps/api/node_modules/.bin/vitest` du dépôt jouet (c'est celui que `vitestBin` prend, l. 224-227) : il écrit, pour chaque fichier de `related`, une entrée istanbul à zéro dans `--coverage.reportsDirectory`, et imprime ` Test Files  1 passed (1)`. Modèle : le faux Vitest d'Iroki (`coverage-diff-sans-base.test.mjs:17-31`). Le paquet du dépôt porte `vitest.db.config.ts`, et `node_modules` est ignoré par `.gitignore`. `DATABASE_URL` et `GITHUB_ACTIONS` sont retirées de l'environnement du banc, sauf quand un test les pose.

Tests nouveaux, titres à garder tels quels :

1. « sans DATABASE_URL, un fichier que seule une suite sur base cible passe en avertissement, sortie 0 » — **rouge sur `main`** (sortie 1).
2. « sans DATABASE_URL, un fichier non couvert qu'aucune suite sur base ne cible échoue, comme avant » — vert sur `main` aussi (non-régression).
3. « avec DATABASE_URL, le même fichier non couvert échoue, sans avertissement » — vert sur `main` aussi.
4. « sous GitHub Actions sans DATABASE_URL, aucun avertissement : le fichier échoue » — vert sur `main` aussi ; il garde la Décision 2.
5. « réception de develop dont la fusion a develop pour premier parent : lue contre origin/develop, aucun fichier de develop ne compte » — dans `depot()`, une branche partie de develop qui fusionne `sujet/x`, `--dry-run --base origin/sujet/x` : `s.ts` listé, ni `d1.ts` ni `d2.ts`, la phrase `HEAD contient develop` — **rouge sur `main`** (`d1.ts` listé).
6. « réception de develop précédée d'une retouche : lue contre origin/develop » — une retouche commitée sur le sujet avant la fusion de develop : la retouche listée, pas `d1.ts` — rouge sur `main`.
7. « origin/develop illisible : pas de repli, la sortie le dit » — la ref `origin/develop` retirée du clone, `--base origin/sujet/x` : la note `origin/develop illisible` — rouge sur `main`.

Les tests existants restent verts tels quels, sauf deux qui **changent de sens**. Chacun est gardé, réécrit au plus près de son sens, et nommé dans la PR :

- l. 153, « un sujet qui a avancé depuis la fusion : la forme n'est plus celle d'une mise à jour, la mesure est celle d'avant ». Après le ticket, le repli s'applique : `d1.ts` n'est plus listé, `s.ts` l'est. Nouveau titre : « un sujet qui a avancé depuis la fusion : plus de fusion recalculée, repli sur origin/develop, les fichiers de develop ne comptent plus ».
- l. 165, « la fusion d'essai de GitHub (refs/pull/N/merge) n'est pas reconnue : la mesure est celle d'avant, la plus stricte ». Elle garde `doesNotMatch(/la fusion recalculée/)`, et lit désormais le repli : `d1.ts` n'est plus listé. Nouveau titre : « la fusion d'essai de GitHub (refs/pull/N/merge) n'est pas une mise à jour reconnue : repli sur origin/develop ».

Les tests l. 79-151 (fusion recalculée, sous-PR, PR vers develop) ne changent pas : ils prouvent que la fusion recalculée gagne et que rien d'autre ne bouge.

### 3. Le code

`coverage-diff-regles.mjs`, puis `coverage-diff.mjs` (l. 172-175, puis l. 274-320), puis l'en-tête. Puis `CONTENU.md:15` et `SKILL.md:17`.

### 4. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une correction d'un gate : un patch. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne, recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  `coverage-diff` (socle-tests) : sans `DATABASE_URL`, un fichier en échec qu'une suite `*.db.spec.ts` cible passe en avertissement, et la CI, qui a Postgres, le juge ; sous GitHub Actions, rien ne change. À la réception de develop dans un sujet, quand la forme n'est pas celle d'une PR de mise à jour (fusion recalculée), le diff se lit contre `origin/develop` dès que HEAD le contient et que la base ne le contient pas : le code que develop apporte n'est plus remesuré.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
  2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/scripts/verify/` vers `scripts/verify/` : `coverage-diff.mjs`, `coverage-diff-regles.mjs`, `coverage-diff.test.mjs` et `coverage-diff-regles.test.mjs`. Aucune commande `poser` : socle-tests se met à jour pièce par pièce (`SKILL.md:16`).
  3. Vérifier que l'étape de couverture de la CI porte `DATABASE_URL` (`SKILL.md:32`) : c'est elle qui juge ce que le pre-push signale.

  **Iroki** : ses deux correctifs (#633 et #649) sont déjà chez lui, sous une autre forme, sans `fusionRecalculee`. Recopier les fichiers du plugin remplace son `referenceDuDiff` et son `suiteSurBaseCible`, et y ajoute la fusion recalculée. À faire en une PR qui garde ses deux bancs (`coverage-diff-sans-base.test.mjs`, `coverage-diff-reception-develop.test.mjs`) et les rejoue contre les fichiers du plugin ; un message qui diffère se nomme dans la PR.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `suiteSurBaseCible` : import relatif, alias, dossier à index, module voisin, import de type | `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff-regles.test.mjs` « suiteSurBaseCible : un import relatif ou par alias du fichier, de son dossier à index ou de son module voisin cible le fichier ; un import de type, d'un autre fichier ou d'un dossier qui a un fichier frère ne le cible pas » |
| `referenceDuDiff` : ordre fusion, develop, base, note | idem, « referenceDuDiff : la fusion recalculée gagne ; base develop inchangée ; develop illisible, la base et la note ; HEAD contient develop et la base non, develop ; sinon la base » |
| Avertissement sans base, échec sinon, garde `GITHUB_ACTIONS` | `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs` « sans DATABASE_URL, un fichier que seule une suite sur base cible passe en avertissement, sortie 0 », « sans DATABASE_URL, un fichier non couvert qu'aucune suite sur base ne cible échoue, comme avant », « avec DATABASE_URL, le même fichier non couvert échoue, sans avertissement », « sous GitHub Actions sans DATABASE_URL, aucun avertissement : le fichier échoue » |
| Repli sur `origin/develop` à la réception | idem, « réception de develop dont la fusion a develop pour premier parent : lue contre origin/develop, aucun fichier de develop ne compte », « réception de develop précédée d'une retouche : lue contre origin/develop », « origin/develop illisible : pas de repli, la sortie le dit », « un sujet qui a avancé depuis la fusion : plus de fusion recalculée, repli sur origin/develop, les fichiers de develop ne comptent plus », « la fusion d'essai de GitHub (refs/pull/N/merge) n'est pas une mise à jour reconnue : repli sur origin/develop » |
| Fusion recalculée inchangée | idem, les tests existants des l. 79-151 |

## Vérification

1. Ciblée : `node --test skills/monorepo/socle-tests/references/scripts/verify/coverage-diff-regles.test.mjs skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs` (22 tests avant, 22 + 9 après) ; `node skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.mjs --dry-run` depuis la racine du plugin, sans erreur.
2. `pnpm test` complet : le nombre de `main` au départ (**738** sur `4a45634`), plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli ; les deux tests qui changent de sens sont nommés dans la PR.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi : `suiteSurBaseCible` rend toujours vrai (test 2) ; la garde `GITHUB_ACTIONS` retirée (test 4) ; le repli ignoré (tests 5 et 6) ; le repli pris avant la fusion recalculée (tests existants des l. 79-127, qui doivent rougir sur la phrase `la fusion recalculée`).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(socle-tests): coverage-diff sans base et à la réception de develop (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Les seuils, le périmètre (`IN_SCOPE`, `OUT_OF_SCOPE`) et `baseAuto` : inchangés.
- La fiche `.claude/rules/tests.md` du socle (`socle-monorepo`), que le ticket 15 touche : sa phrase sur `DATABASE_URL` (l. 41) reste vraie.
- La préparation de la base du capitaine (ticket 8) : elle rendra la base au capitaine ; l'avertissement reste pour une session sans base.
- La repose chez Iroki : son conducteur la fait d'après la note.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634` et sur `develop` d'Iroki. Écarts avec la spec :
  - La spec situe `fusionRecalculee` aux l. 108-122 ; la fonction est aux l. 112-123, son commentaire aux l. 105-111. Les l. 275 et 305-319 sont exactes.
  - La spec ne dit pas que deux tests existants changent de sens (l. 153 et l. 165) : le repli s'y applique. Le ticket les réécrit, sans les supprimer.
  - La garde `GITHUB_ACTIONS` (Décision 2) est un ajout du ticket, par défaut prudent : `A-24` suppose une CI qui a la base. À confirmer à la contre-relecture.
