# La preuve suffisante, part de `skills` (K5) : le skill `anchorpost` suit la CLI 2.0.0, publique, au pivot 3 ; sa fiche dit la criticité, les cas, l'étiquette de cas et `compare`

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — du texte, aux mots de la spec et de la CLI 2.0.1, sans rien à concevoir ; le texte entier est dans le patch ([`89-annexes/pr-anchorpost.patch`](89-annexes/pr-anchorpost.patch), sha256 `c329b2bab102767710a8802d51ef8e87ecd6513eb154663cb82d40951053326c`, `git apply` sur `main` à `ddb4265`, plugin 8.0.0), décrit fichier par fichier ci-dessous ; deux bancs neufs, rouges avant le patch et verts après ; les mutations de [`89-annexes/mutations.mjs`](89-annexes/mutations.mjs) toutes rouges. Rien n'est à concevoir : qui veut changer une phrase l'écrit à son lanceur, il ne tranche pas. Seul ticket de la PR « anchorpost ».
Blocked by: 85, 88
Dépendances: —
Fichiers chauds: `skills/chaine/anchorpost/SKILL.md`, `references/manifest.json`, `references/rules/anchorpost.md`, `references/fragments/admin.md`, `references/adr/ADR_ALL_ARC-N-index-anchorpost.md`, `references/CONTENU.md`, `README.md` (la ligne du skill), `scripts/preuve-suffisante-anchorpost.test.mjs` (neuf) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Aucun ticket de suite ouvert ne les touche ; les PR « tickets » et « socle-tests » non plus, hors des deux fichiers de version.

## Le besoin

`K5` de la carte du chantier de la preuve suffisante (`SPEC_ALL_ANC-5-preuve-suffisante.map.md` d'Anchorpost) : « le skill suit la CLI 2.0.0 ; la fiche `.claude/rules/anchorpost.md` dit comment écrire une criticité, un cas, une étiquette de cas, et ce que dit `compare` ». Le ticket 49 lui laissait aussi « la relance du skill de criticité à la repose au pivot 3 sur chaque règle sans criticité » et la lecture du champ `schema` par la CLI 2.0.0 (« si l'index 3 nomme sa version autrement, l'étape 1 du skill et `D8` se corrigent au ticket `K5` »).

Sur `main` à `ddb4265`, le skill `anchorpost` :

- **installe la CLI comme un paquet privé de GitHub Packages**, avec un jeton (`.npmrc`, `NODE_AUTH_TOKEN`, une network secret, l'accès du dépôt au paquet) ; or la CLI est publique sur npmjs.com depuis la 1.x (`ADR_ALL_ARC-16` d'Anchorpost ; `publishConfig.registry` de `apps/cli/package.json` : `https://registry.npmjs.org/` ; `npm view @maj-agency/anchorpost versions` rend 2.0.0 le 2026-11-20 et 2.0.1 le 2026-11-22). Un projet qui suit la recette pointe `@maj-agency` vers GitHub Packages ;
- **pose un manifeste au schéma `"2"`**, plancher `{ date, proven }` ; la CLI 2.0.x l'écrit au schéma `"3"` (`init` : `schema: "3"`, `sufficiency: observe`, plancher `{ date, proven, partial }`) ;
- **sa fiche ne dit ni la criticité, ni les cas, ni l'étiquette de cas, ni `compare`.**

Vérifié sur la CLI 2.0.1 : l'index qu'elle écrit porte `"schema": "3"` (`anchorpost/anchorpost.json` d'Anchorpost à `2be4e7e`) ; l'étape 1 du skill `criticite` et le critère `D8` lisent juste, rien à corriger.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `SKILL.md` | la description et `argument-hint` (`pivot-3`) ; l'étape 1 (paquet public, `@^2`, retirer la recette d'avant) ; l'étape 4 (`code` des règles `proven` et `partial`, le gate `preuves` ; la CI sans jeton ; le manifeste dans `cheminsSensibles`) ; la liste de ce que `check` refuse (le pivot 3) ; l'étape 6 (la recette de l'administrateur) ; la section neuve « Passer au pivot 3 (`pivot-3`) » avant l'étape 8 |
| `references/manifest.json` | `"schema": "3"`, le plancher `{ date, proven, partial }`, `"sufficiency": "observe"`, le `$comment` |
| `references/rules/anchorpost.md` | la section « Criticité et cas attendus (pivot 3, CLI Anchorpost ≥ 2.0.0) » ; l'étiquette de cas dans « Les tests prouvent » ; la section « Ce que dit `anchorpost compare` » ; `Prouve:` et la preuve suffisante dans « Les tickets et les demandes » ; le manifeste au schéma 3 |
| `references/fragments/admin.md` | réécrit : plus de jeton ; l'espace ; le retrait des jetons d'avant ; `enforce` décidé par le produit |
| `references/adr/ADR_ALL_ARC-N-index-anchorpost.md` | la CLI publique ; « paquet privé » parmi les alternatives écartées ; le coût du jeton retiré |
| `references/CONTENU.md`, `README.md` | la même chose, en une phrase |
| `scripts/preuve-suffisante-anchorpost.test.mjs` | deux tests neufs |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.1.0 et sa note |

## Décisions

1. **La CLI est publique, sans jeton** (`ADR_ALL_ARC-16` d'Anchorpost) : `pnpm add -Dw @maj-agency/anchorpost@^2` ; un dépôt qui portait `@maj-agency:registry=https://npm.pkg.github.com` et `NODE_AUTH_TOKEN` dans `.npmrc` les retire, et ses jetons ; plus aucune recette de clé.
2. **Le skill suit la CLI 2.0.0 et les suivantes** (`@^2`) : le gabarit du manifeste est au schéma `"3"` et adopte en `observe` (`A-22` : « un dépôt adopte en `observe`, puis passe en `enforce` », une décision du produit, projet par projet) ; le manifeste entre dans `cheminsSensibles` (`A-55`, garde 1 : « un plancher ne baisse que par une validation nouvelle »).
3. **Passer au pivot 3, dans cet ordre** (la section neuve) : la CLI `@^2` et `anchorpost:index` ; `anchorpost init` sans `--force`, qui réécrit le manifeste au schéma 3 sans rien retirer (plancher converti `proven: N` → `{ proven: 0, partial: N }`, `sufficiency: observe` posée, chaque valeur convertie dite), puis le plancher relevé à la main avec une date nouvelle et `by` ; chaque règle sans criticité ni cas classée par le skill `criticite`, une à la fois, avant tout code qui la touche (la relance que le ticket 49 laissait ici) ; la repose des skills qui lisent le pivot 3 (`tickets`, `socle-tests`, `revue-de-ticket`, la fiche) ; `enforce` par une PR où une personne l'écrit.
4. **La fiche dit l'écriture, la CLI fait foi** : `criticality` (`level`, `by`, `reason`, `date`), `cases` (les cinq champs, les quatre genres de `P-31`, les deux portées, les dix familles), `notApplicableFamilies`, `caseRevision` ; l'étiquette de cas et `cas` dans un fichier `cas/*.json` ; « prouvée » et « partielle » ; ce que `compare` relève, et ses sorties en `observe` et en `enforce` ; la ligne `Prouve:`. Elle reste sous deux cents lignes (`budget-contexte`) : 62.
5. **Après les PR « tickets » et « socle-tests »** (`Blocked by: 85, 88`) : la fiche et la section « Passer au pivot 3 » décrivent la ligne `Prouve:`, la preuve suffisante du gate `tickets` et le gate `preuves` ; entrée avant elles, elle décrirait des gates absents.

## Questions à l'architecte

1. **`init` sur un manifeste 2**, joué ici sur un dépôt jouet avec la CLI 2.0.1 : il écrit le manifeste au schéma 3 et **rebranche aussi** l'index généré, le script `check:anchorpost` et le relais `anchorpost.mjs` (« puis branche le projet », README de la CLI). Le skill le dit (« relire le rapport et le diff »). **Recommandation : tel quel** ; l'étape 4 du skill reste la liste de ce qui doit être branché, qu'`init` le fasse ou non.

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main '+refs/heads/claude/hopeful-lovelace-ouk6tz:refs/remotes/origin/claude/hopeful-lovelace-ouk6tz'
git switch -C claude/preuve-suffisante-anchorpost origin/main
mkdir -p "$S/pr" && for f in pr-anchorpost.patch mutations.mjs version-mineure.mjs; do git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/89-annexes/$f" > "$S/pr/$f"; done
sha256sum "$S/pr/pr-anchorpost.patch"
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

La somme attendue : **`c329b2bab102767710a8802d51ef8e87ecd6513eb154663cb82d40951053326c`** ; une autre : s'arrêter. La version de `main` : 8.2.0 si les PR « tickets » et « socle-tests » sont entrées (`Blocked by`), et la version qui suit les autres PR entrées entre-temps.

### § 1 — Les bancs d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='*.test.mjs' "$S/pr/pr-anchorpost.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap scripts/preuve-suffisante-anchorpost.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Un fichier posé (`??`). Attendu : `# tests 2`, `# pass 0`, `# fail 2` : « le skill anchorpost suit la CLI 2.0.0 … » et « la fiche anchorpost dit comment écrire une criticité … ».

### § 2 — Le patch, la version et la note, dans la branche

```bash
git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/pr/pr-anchorpost.patch" && node "$S/pr/version-mineure.mjs" "$S/pr/pr-anchorpost.patch" && git status --short
timeout 900 node --test --test-reporter=tap scripts/preuve-suffisante-anchorpost.test.mjs scripts/depot.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

`version-mineure.mjs` écrit la version prise (8.3.0 après les deux autres PR ; 8.1.0 sur `ddb4265`, où `git apply` du patch entier donne le même arbre). Dix fichiers (neuf ` M`, un `??`) ; attendu : `# tests 71`, `# pass 71`, `# fail 0` (les 2 de ce ticket et les 69 de `depot.test.mjs`, sur `ddb4265` comme après les deux autres PR).

Le patch (il fait foi) :

- **`SKILL.md`** : la description (« installe la CLI `@maj-agency/anchorpost` (≥ 2.0.0, publique sur npmjs.com), écrit le manifeste au schéma 3, … et passe au pivot 3 un dépôt qui n'y est pas ») ; l'étape 1 (décision 1) ; l'étape 4 (points 4 et 5) et le paragraphe de `code` ; la liste de `check` ; l'étape 6 ; « Passer au pivot 3 (`pivot-3`) » (décision 3), en cinq points.
- **`manifest.json`** : décision 2.
- **`rules/anchorpost.md`** : décision 4.
- **`admin.md`**, **`ADR_ALL_ARC-N-index-anchorpost.md`**, **`CONTENU.md`**, **`README.md`** : décision 1, en leurs mots.
- **`preuve-suffisante-anchorpost.test.mjs`** : « le skill anchorpost suit la CLI 2.0.0 : manifeste au schéma 3, CLI publique sans jeton, passage au pivot 3 » ; « la fiche anchorpost dit comment écrire une criticité, un cas, une étiquette de cas, et ce que dit compare » (et sa longueur, moins de deux cents lignes).
- **`NOTES-DE-VERSION.md`** : la note en tête (« Ce qui change » : le skill suit la CLI 2.0.0, passer au pivot 3, la fiche ; « Ce qu'un projet fait pour en profiter » : reposer la fiche et la recette, retirer le jeton ; un dépôt au schéma 2 suit « Passer au pivot 3 »).

### § 3 — Vérifier, commiter, livrer la PR

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "feat(anchorpost): la CLI 2.0.0, le manifeste au schéma 3, la fiche des cas et de compare (plugin <version>)"
git status --short
```

`<version>` : celle que `version-mineure.mjs` a écrite. La dernière ligne du `--stat` : `10 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` :

```bash
timeout 1800 node "$S/pr/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE' "$S/mutations.log"; grep -v '^ROUGE' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `11` rouges, la ligne `toutes rouges`, `git status --short` vide. Puis la suite entière, seule, en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1431`, `# pass 1431`, `# fail 0` après les PR « tickets » et « socle-tests » (1 396, plus 8, 25 et 2), et le compte de toute autre PR entrée entre-temps. Puis :

```bash
git push origin claude/preuve-suffisante-anchorpost
```

La PR vers `main`, prête, sans étiquette, son titre le message du commit (moins de 120 caractères, numéro compris, `A-197`). Dans le corps : les rouges avant et les verts après, le journal des mutations, la suite entière (compte, durée, charge avant et après). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire. La session rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` bouge entre l'ouverture de la PR et sa fusion** : la règle du ticket 83, § 3, avec ce patch :

```bash
git fetch origin main
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/pr/version-mineure.mjs" "$S/pr/pr-anchorpost.patch"
git add -A && git commit --no-edit && git push origin claude/preuve-suffisante-anchorpost
```

Un autre fichier en conflit que ces deux-là : s'arrêter et l'écrire au lanceur.

## Surfaces

| Surface | Preuve |
| --- | --- |
| le manifeste du gabarit au schéma 3, plancher à deux comptes, `observe` | `preuve-suffisante-anchorpost.test.mjs`, « le skill anchorpost suit la CLI 2.0.0 … » ; A1, A2, A3 |
| l'installation sans jeton ; la recette du jeton retirée de l'administrateur et de l'ADR | le même test ; A4, A7 |
| « Passer au pivot 3 », la relance du skill `criticite`, `enforce` décidé par le produit | le même test ; A5, A6 |
| la fiche : la criticité (sa date), les cas, l'étiquette de cas, `compare` et ses sorties, `Prouve:` ; sous deux cents lignes | « la fiche anchorpost dit comment écrire une criticité … » ; A8 à A11 |

## Mutations

[`89-annexes/mutations.mjs`](89-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) ; journal : [`89-annexes/mutations.txt`](89-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| A1 manifeste : schéma 2 (le gabarit d'avant) | `preuve-suffisante-anchorpost.test.mjs` | rouge |
| A2 manifeste : sans sufficiency | le même | rouge |
| A3 manifeste : le plancher d'avant, sans partial | le même | rouge |
| A4 SKILL : la recette du jeton revient à l'installation | le même | rouge |
| A5 SKILL : sans le passage au pivot 3 | le même | rouge |
| A6 SKILL : la repose ne relance pas le skill de criticité | le même | rouge |
| A7 admin.md : la network secret revient | le même | rouge |
| A8 fiche : sans l'étiquette de cas | le même | rouge |
| A9 fiche : sans ce que dit compare | le même | rouge |
| A10 fiche : enforce ne refuse pas | le même | rouge |
| A11 fiche : la criticité sans sa date | le même | rouge |

11 rouges sur 11.

## Vérification

1. § 1 : 2 rouges sur 2 avant le patch ; § 2 : verts après.
2. Les mutations, la branche commitée : « toutes rouges » (11).
3. La suite entière, verte (§ 3).

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `ddb4265` (plugin 8.0.0), le 2026-11-22 :

- **La CLI 2.0.1**, installée à part depuis npmjs.com sans jeton (`npm i @maj-agency/anchorpost@2.0.1`, `anchorpost --version` : `2.0.1`) ; `init` sur un dépôt jouet au manifeste 2 (plancher `{ proven: 1 }`) : `schema convertie : ancienne valeur remplacée ("2" → "3")`, `contexts[all].floor convertie : … → {"date":"2026-11-01","proven":0,"partial":1}`, `clés posées par init : sufficiency`, puis l'index généré, `package.json` et `scripts/verify/anchorpost.mjs` écrits. Le dépôt jouet retiré après.
- **Le patch** : `git apply --check` seul sur `ddb4265` ; posé après les PR « tickets » et « socle-tests » (par `--exclude` et `version-mineure.mjs`, ou par la fusion du § 3, où `NOTES-DE-VERSION.md` et `plugin.json` sont seuls en conflit), la version prise est 8.3.0, et l'arbre est celui des trois patchs posés.
- **Rouges avant** : **2 sur 2** ; **verts après** : **2 sur 2**, et `depot.test.mjs` vert.
- **Les mutations** : **11 rouges sur 11**.
- **La suite entière**, sur l'arbre des trois PR : la suite entière, les quatre motifs de `pnpm test` d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur l'arbre des trois PR posées l'une sur l'autre (plugin 8.3.0) : **1 431 tests, 1 431 verts**, aucun échec, sauté ni annulé ; 18 min 10 s (12:43:23 → 13:01:33 UTC, `duration_ms` 1090263), charge 0,83 au départ, 3,99 à la fin (d'autres agents jouaient leurs bancs) ; [`89-annexes/suite.txt`](89-annexes/suite.txt). Une première passe, avant le patch de la copie du critère du régime 8, rendait 1 430 sur 1 431 (ticket 85). Sur `ddb4265` seul, la suite compte 1 396 tests (1 431 moins les 35 des trois PR : 8, 25 et 2), compte tiré des bancs touchés joués avant et après chaque patch.

## Ce qui n'a pas été établi

1. **Un vrai `pnpm install` d'un projet** qui retire la recette de GitHub Packages : joué par `npm i` à part, pas dans un monorepo du socle.
2. **Ce que la fiche dit de `compare`** est une lecture du § 4 de la spec et du README de la CLI 2.0.1, en résumé ; la CLI fait foi, et ses écarts évoluent par ses versions.

## Hors périmètre

- Le skill `criticite` (`K7`, 7.14.0) et le critère `D8` : inchangés, ils lisent `"schema": "3"`, que la CLI 2.0.x écrit.
- La criticité d'une feature fixée par un agent (`featureCriticality` à `by: agent`) : un ticket à part (ticket 49, hors périmètre).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `K5` de la carte de `SPEC_ALL_ANC-5`, la spec, `ADR_ALL_ARC-16` d'Anchorpost et la CLI 2.0.1, sur un clone neuf de `main` à `ddb4265`.
