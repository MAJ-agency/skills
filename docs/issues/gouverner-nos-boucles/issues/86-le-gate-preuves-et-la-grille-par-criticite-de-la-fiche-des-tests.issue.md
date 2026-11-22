# La preuve suffisante, part de `skills` (K2) : le gate `preuves`, relais d'`anchorpost compare`, et la grille par criticité de la fiche des tests

Status: Fait — PR 154 (`56ba394`, plugin 8.2.0)
Type: task
Label: contre-revue
Modèle: sonnet — un relais d'une commande de la CLI 2.0.0 et une grille de la spec recopiée, rien à concevoir ; le code et le texte entiers sont dans le patch commun aux tickets 86, 87 et 88 ([`86-88-annexes/pr-socle-tests.patch`](86-88-annexes/pr-socle-tests.patch), sha256 `2d18d2842e677e39788054dbbe949cbde74009f57f648e24eabb2f9613a8e74a`, `git apply` sur `main` à `ddb4265`, plugin 8.0.0), décrit fichier par fichier ci-dessous ; les bancs de la PR sont rouges avant le patch et verts après, les mutations de [`86-88-annexes/mutations.mjs`](86-88-annexes/mutations.mjs) toutes rouges. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Premier des trois tickets de la PR « socle-tests » (86, 87, 88) : ce ticket porte les gestes de la PR entière (« À faire, dans l'ordre »).
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-tests/references/scripts/verify/preuves.mjs` et `preuves.test.mjs` (neufs), `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md`, `skills/monorepo/socle-tests/SKILL.md` et `references/CONTENU.md` (communs aux tickets 87 et 88), `scripts/points-d-entree.test.mjs` (une ligne), `scripts/preuve-suffisante-socle-tests.test.mjs` (neuf, commun au ticket 88) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, communs à la PR (ticket 88). Aucun ticket de suite ouvert (75 à 79) ne touche ces fichiers hors des deux fichiers de version ; les PR « tickets » (83 à 85) et « anchorpost » (89) non plus.

## Le besoin

La carte du chantier de la preuve suffisante d'Anchorpost (`SPEC_ALL_ANC-5-preuve-suffisante.map.md`, « Part de skills ») porte `K2` : « la grille par criticité dans le gabarit de `.claude/rules/tests.md` (aujourd'hui une seule mention de `P0`, `P1`, `P2`) et l'étiquette de cas `[RULE_…#cas]` ; le relais `scripts/verify/preuves.mjs` (joue `anchorpost compare`, base choisie comme `coverage-diff --base-auto`), son entrée dans `gatesRapides` et au pre-push ; le niveau `e2e-cli` si `Q-1` le retient. » Le § 5 de la spec : « Le gate `preuves` : le relais `scripts/verify/preuves.mjs`, posé par `socle-tests` (§ 8), joue la même commande au pre-push et en fin de tour (`gatesRapides`), avec la base choisie comme le fait déjà `coverage-diff`. » `Q-1` est tranchée (option A, 2026-11-17) : la CLI 2.0.x range `*.e2e-cli.spec.ts`, qui lance la CLI construite en sous-processus, en P2 (`apps/cli/src/proofs/categories.ts`, `A-220`).

Sur `main` à `ddb4265`, aucun gate ne joue `compare` : un projet au pivot 3 ne voit ses cas sans preuve qu'en CI, s'il en a écrit le job, et la fiche des tests ne dit ni la grille, ni l'étiquette de cas, ni le niveau du bout en bout d'une CLI. La fiche est le gabarit du skill `socle-monorepo` (`references/racine/.claude/rules/tests.md`), que `socle-tests` complète à sa pose.

## Une PR, trois tickets

`P-65` : une famille de fichiers par PR, trois tickets au plus. La PR « socle-tests » : ce ticket (le gate `preuves`, la fiche des tests), le ticket 87 (la mutation du `code` des règles au pivot 3, `proven` et `partial`, et la mesure par règle) et le ticket 88 (la mesure datée publiée en artefact, la baisse d'une règle moyenne, le workflow, l'ADR, la version et la note). Les PR « tickets » et « anchorpost » ne touchent aucun de ses fichiers hors des deux fichiers de version : celle qui entre en second suit la règle du § 3.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `socle-tests/references/scripts/verify/preuves.mjs` | neuf : le relais (son en-tête dit ce qu'il fait, l'usage, les sorties) ; `etatDeLIndex` et `resume` exportées |
| `socle-tests/references/scripts/verify/preuves.test.mjs` | neuf : huit tests, sur de vrais dépôts git jetables, la CLI remplacée par un talon |
| `socle-monorepo/references/racine/.claude/rules/tests.md` | « Règles » : le niveau P2 de `*.e2e-cli.spec.ts`, et l'étiquette de cas ; la section « Ce qu'une règle doit prouver, selon sa criticité » (la grille, « prouvée » et « partielle », les familles, le gate) |
| `socle-tests/SKILL.md` | étape 2.3 : le script `check:preuves`, la ligne du pre-push, l'entrée dans `gatesRapides`, la limite du relais dans le dépôt de la CLI elle-même ; étape 2.4 : l'étape de CI ; étape 3 : la commande de vérification |
| `socle-tests/references/CONTENU.md` | la section « Le gate `preuves` » |
| `scripts/points-d-entree.test.mjs` | `preuves.mjs` agit quand on le lance, par chacun des six accès ; la sortie attendue de `mutation-regles-synthese.mjs`, à son titre neuf (ticket 87) |
| `scripts/preuve-suffisante-socle-tests.test.mjs` | « la fiche des tests porte la grille par criticité, l'étiquette de cas et le niveau du bout en bout d'une CLI » ; « le relais preuves dit qu'il sort en 2 quand la CLI est un paquet de l'espace de travail, et que ce dépôt l'adapte » |

## Décisions

1. **Un relais, jamais un juge** : `preuves.mjs` joue `node_modules/.bin/anchorpost compare --base <base> --json` depuis la racine et rend sa sortie (0 sans écart ou en `observe`, 1 sur un écart en `enforce`) ; la liste des écarts et le mode jugé sont ceux de la CLI (`SPEC_ALL_ANC-5` § 4), versionnés dans le paquet, comme le relais `anchorpost.mjs` du skill `anchorpost` pour `check`.
2. **Rien sans index au pivot 3** : `anchorpost/anchorpost.json` absent, ou d'un `schema` autre que `"3"` : « rien à comparer », sortie 0, la CLI n'est pas lancée. Le régime d'avant reste celui de `main` pour un projet qui n'a pas l'index au pivot 3 (`A-56` : seul l'index compte). Présent mais pas un objet JSON : sortie 2.
3. **La base, comme `coverage-diff --base-auto`**, par les fonctions pures de `coverage-diff-regles.mjs` (`baseDepuisPush`, `choisirBase`, `decisionSansBase`, `BASE_DEFAUT`), sans les recopier : `--base <ref>` nommée (la CI) ; sinon, avec ou sans `--base-auto`, le sujet visé par le push (`PRE_PUSH_REFS`, que le pre-push exporte déjà), puis le plus proche d'`origin/develop` et des `origin/sujet/*`, develop à égalité. La fin de tour joue le gate sans option. Une base introuvable : premier push d'un dépôt neuf, sortie 0 ; sinon sortie 2 avec le geste (`git fetch origin <branche>`). **Limite dite dans l'en-tête** : une PR de mise à jour d'un sujet se compare à la base la plus proche, pas à la fusion recalculée de `coverage-diff` : plus large, jamais plus lâche.
4. **Un résumé court, le rapport entier ailleurs** : une ligne (la base, le mode jugé, les comptes), puis une par écart (`refus` en `enforce`, `avertissement (observe)` sinon) et par avertissement, et la commande du rapport entier ; toute valeur du rapport ramenée à une ligne. Sous GitHub Actions (`GITHUB_STEP_SUMMARY`), le markdown entier de `compare` s'ajoute au résumé du job, par un second passage de la CLI dont la sortie est ignorée.
5. **Les pannes sont des sorties 2, la cause dite** : la CLI absente (`pnpm install`), une sortie autre que 0 et 1 (sa dernière ligne d'erreur), un rapport qui ne se lit pas, un usage faux.
6. **Où le gate se pose** : `check:preuves` dans `package.json` ; au pre-push, `pnpm run check:preuves --base-auto` après `check:coverage` ; `scripts/verify/preuves.mjs` dans `gatesRapides` si la chaîne est posée ; en CI, `node scripts/verify/preuves.mjs --base "origin/$BASE"` sur `pull_request`, `env:` et `fetch-depth: 0` comme pour `coverage-diff`. Le fichier est posé partout : sans Anchorpost, il dit « rien à comparer ».
7. **Le relais dans le dépôt de la CLI elle-même** (`A-202`, question 1) : il lance `node_modules/.bin/anchorpost` à la racine ; là où la CLI est un paquet de l'espace de travail et non une dépendance installée (Anchorpost, `apps/cli`), ce fichier n'existe pas, et le relais sort en 2, au pre-push comme à chaque fin de tour qui a changé un fichier. Le relais ne change pas : `SKILL.md` le dit, et ce dépôt l'adapte à la pose, comme son relais `anchorpost.mjs`.
8. **La fiche des tests porte la grille de la spec** (§ 2, `RULE_ALL_ANC-28`) telle quelle, l'étiquette de cas (`RULE_ALL_ANC-26`) et le niveau P2 d'un `*.e2e-cli.spec.ts`, sous la seule condition « projet suivi par Anchorpost, index au pivot 3 ».

## Questions à l'architecte

1. **Le coût en fin de tour.** `compare` construit deux index (celui de la base dans un arbre jetable, celui de l'arbre courant) : mesuré sur un clone d'Anchorpost, **8 s** (charge 4). Le hook de fin de tour ne joue les gates que si un fichier a changé. **Recommandation : dans `gatesRapides`, comme la spec le dit** ; si un projet le trouve trop lent, le pre-push suffit, et c'est son choix.
2. **Le job de PR qui mute le `code` des règles hautes touchées** (§ 7, troisième point ; `K6`, « si le socle le porte ») n'est pas dans ce ticket : `preuves.mjs` ne lit pas `highRuleCodeFiles`. **Recommandation : le laisser à Anchorpost** (`SPEC_ALL_ANC-5.24`, son `ci.yml`), puis le porter au socle quand il a tourné, par un ticket qui reprend son job.

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser. Les trois tickets de la PR se jouent ensemble dans la même branche, par un seul patch : les § 0 à 3 de ce ticket valent pour 86, 87 et 88.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main '+refs/heads/claude/hopeful-lovelace-ouk6tz:refs/remotes/origin/claude/hopeful-lovelace-ouk6tz'
git switch -C claude/preuve-suffisante-socle-tests origin/main
mkdir -p "$S/pr" && for f in pr-socle-tests.patch mutations.mjs version-mineure.mjs; do git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/86-88-annexes/$f" > "$S/pr/$f"; done
sha256sum "$S/pr/pr-socle-tests.patch"
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation qui porte ces tickets y est entrée), et s'écrivent dans `S`. La somme attendue : **`2d18d2842e677e39788054dbbe949cbde74009f57f648e24eabb2f9613a8e74a`** ; une autre : s'arrêter. La version de `main` : 8.0.0 (`ddb4265`) ; une autre : le § 2 le dit.

### § 1 — Les bancs d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='*.test.mjs' "$S/pr/pr-socle-tests.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap scripts/points-d-entree.test.mjs skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.test.mjs skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.test.mjs scripts/preuve-suffisante-socle-tests.test.mjs skills/monorepo/socle-tests/references/scripts/verify/preuves.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Cinq fichiers posés (trois ` M`, deux `??`). Attendu : `# tests 103`, `# pass 79`, `# fail 24` : les six accès de `preuves` et les six de `mutation-regles-synthese` (son titre neuf, ticket 87) (`points-d-entree`), les trois bancs de texte (ticket 86 : la fiche, la limite du relais ; ticket 88 : le workflow), deux fichiers qui ne se chargent pas (`preuves.test.mjs`, `mutation-regles-synthese.test.mjs` : leurs modules n'exportent pas encore ce qu'ils importent), et sept cas de `mutation-regles.test.mjs` (ticket 87 : quatre cas existants dont la forme change, trois neufs). Recopier les comptes dans la PR.

### § 2 — Le patch, dans la branche, et ses bancs verts

Sur `main` à 8.0.0 :

```bash
git apply "$S/pr/pr-socle-tests.patch" && git status --short
```

Sur un `main` à une autre version : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/pr/pr-socle-tests.patch" && node "$S/pr/version-mineure.mjs" "$S/pr/pr-socle-tests.patch"`. Puis :

```bash
timeout 900 node --test --test-reporter=tap scripts/points-d-entree.test.mjs skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.test.mjs skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.test.mjs scripts/preuve-suffisante-socle-tests.test.mjs skills/monorepo/socle-tests/references/scripts/verify/preuves.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Seize fichiers (treize ` M`, trois `??`) ; attendu : `# tests 125`, `# pass 125`, `# fail 0`.

Le patch, pour ce ticket (il fait foi) :

- **`preuves.mjs`** : l'en-tête (pourquoi un relais, ce qu'il fait dans l'ordre, la limite, l'usage, les sorties) ; `INDEX`, `CLI` ; `etatDeLIndex(texte)` (`absent`, `illisible`, `autre` avec `schema`, `pivot-3`) ; `ligne` (une valeur sur une ligne, `\p{Cc}`, U+2028 et U+2029 en espaces) ; `resume(rapport, base)` ; `main(args)` : l'usage, l'index, la base (décision 3), la CLI, le résumé, `GITHUB_STEP_SUMMARY` ; `estPointEntree` (l'idiome du ticket 43).
- **`preuves.test.mjs`** : « etatDeLIndex : … », « resume : … », « sans index, ou d'un autre schéma que 3 : rien à comparer … », « un index illisible, une CLI absente ou en panne, un rapport illisible, un usage faux : sortie 2 … », « la base : nommée par --base ; sinon le sujet visé par le push ; sinon la plus proche … », « une base introuvable : premier push d'un dépôt neuf, sortie 0 ; sinon sortie 2 … », « la sortie de la CLI est rendue … », « sous GitHub Actions, le rapport entier en markdown s'ajoute au résumé du job … ». Le talon de la CLI écrit ses arguments, rend un rapport donné, sort en 0, 1 ou 2 ; les dossiers sont retirés après (`after`), l'environnement est celui des bancs (`environnementDeBanc`).
- **`tests.md`** : dans « Règles », la parenthèse des niveaux finit par « `*.e2e-cli.spec.ts` qui lance la CLI construite en sous-processus, bout en bout d'une CLI, P2 » et une puce « **Un test qui prouve un cas attendu de la règle le nomme après un `#`** » ; avant « Le jour et l'heure », la section de la grille (décision 8).
- **`SKILL.md`**, **`CONTENU.md`** : décisions 6 et 7, et la section du gate.
- **`points-d-entree.test.mjs`** : `{ nom: "preuves", …, args: ["--tout"], statut: 2, sortie: /preuves : usage : node scripts\/verify\/preuves\.mjs/ }` ; la sortie attendue de `mutation-regles-synthese`, `/Mutation sur les règles prouvées et partielles : périmètre vide/`.
- **`preuve-suffisante-socle-tests.test.mjs`** : sa tête (lecture à plat, comme `depot.test.mjs`), le banc de la fiche et celui de la limite du relais (décision 7).

Puis le ticket 87, puis le ticket 88 : leurs § « Le patch » se lisent sur le même arbre.

### § 3 — Vérifier, commiter, livrer la PR

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "feat(socle-tests): le gate preuves, la grille par criticité, la mutation au pivot 3 datée (plugin <version>)"
git status --short
```

`<version>` : 8.1.0, ou celle que `version-mineure.mjs` a écrite. La dernière ligne du `--stat` : `16 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `1900000` :

```bash
timeout 1800 node "$S/pr/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE' "$S/mutations.log"; grep -v '^ROUGE' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `35` rouges, la ligne `toutes rouges`, `git status --short` vide. Puis la suite entière, seule, en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# fail 0`, et `# tests` (égal à `# pass`) : **le compte de `main` au départ, plus 26** (les tests de cette PR). Le compte de `main` : 1 396 sur `ddb4265`, soit `# tests 1422` ; sur un `main` qui a bougé, 1 396 plus les tests de chaque PR entrée depuis `ddb4265`, que donne la table du cas « `main` bouge » ci-dessous. Recopier le calcul dans la PR. Puis :

```bash
git push origin claude/preuve-suffisante-socle-tests
```

La PR vers `main`, prête, sans étiquette, son titre le message du commit (moins de 120 caractères, numéro compris, `A-197`). Dans le corps : les rouges avant et les verts après, le journal des mutations, la suite entière (compte, durée, charge avant et après). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire. La session rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` bouge entre l'ouverture de la PR et sa fusion** : la règle du ticket 83, § 3, avec ce patch :

```bash
git fetch origin main
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/pr/version-mineure.mjs" "$S/pr/pr-socle-tests.patch"
git add -A && git commit --no-edit && git push origin claude/preuve-suffisante-socle-tests
```

Un autre fichier en conflit que ces deux-là : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, et le titre de la PR à la version prise.

Ce que donne chaque `main` de départ, au § 2 (`--exclude` et `version-mineure.mjs`) comme au § 3 (la fusion). La version prise est toujours la mineure suivante de celle de `main`. `NOTES-DE-VERSION.md` est toujours en conflit au § 3 ; `.claude-plugin/plugin.json` l'est quand la version de `main` diffère de celle de la branche. Une PR qui n'était pas fusionnée quand ce ticket a été écrit donne son compte dans le corps de sa PR (« la suite entière ») : c'est lui qui compte, pas le nombre de la table.

| PR entrées dans `main` depuis `ddb4265` | version de `main` | version prise | tests à ajouter à 1 396 pour le compte de `main` |
| --- | --- | --- | --- |
| aucune | 8.0.0 | 8.1.0 | 0 (suite attendue : 1 422) |
| la PR A des suites (tickets 75 à 77) | 8.0.1 | 8.1.0 | 6 |
| la PR B des suites (tickets 78 et 79, PR 152) | 8.0.1 | 8.1.0 | 9 au sommet `4afd6e2` ; son tour 1 peut en ajouter : le compte de son corps |
| les PR A et B | 8.0.2 | 8.1.0 | 6, plus celui de la PR B |
| la PR « tickets » (83 à 85), avec ou sans A et B | 8.1.0, ou 8.1.x | 8.2.0 | 9, plus ceux de A et de B entrées |

La PR « anchorpost » (89) n'entre jamais avant celle-ci (`Blocked by: 85, 88`).

## Surfaces

| Surface | Preuve |
| --- | --- |
| sans index au pivot 3 : rien à comparer, la CLI pas lancée | `preuves.test.mjs`, « sans index, ou d'un autre schéma que 3 … », « etatDeLIndex … » ; R1, R2 |
| la base : nommée ; le sujet du push ; la plus proche ; develop pour une branche partie de develop | « la base : nommée par --base … » ; R5, R6 |
| premier push d'un dépôt neuf : 0 ; une base absente : 2, le geste dit | « une base introuvable … » ; R7 |
| la sortie de la CLI rendue ; un écart dit « refus » en `enforce` | « la sortie de la CLI est rendue … », « resume … » ; R3, R9 |
| les pannes et l'usage faux : 2, la cause dite | « un index illisible, une CLI absente ou en panne … » ; R4, R10 |
| le rapport entier dans le résumé du job | « sous GitHub Actions … » ; R8 |
| le point d'entrée par les six accès | `points-d-entree.test.mjs`, « preuves agit quand on le lance : … » |
| la limite du relais dans le dépôt de la CLI, dite par `SKILL.md` | `preuve-suffisante-socle-tests.test.mjs`, « le relais preuves dit qu'il sort en 2 … » ; F3 |
| la grille, l'étiquette de cas, le niveau P2 d'une CLI dans la fiche | `preuve-suffisante-socle-tests.test.mjs`, « la fiche des tests porte la grille … » ; F1, F2 |

## Mutations

[`86-88-annexes/mutations.mjs`](86-88-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) ; journal : [`86-88-annexes/mutations.txt`](86-88-annexes/mutations.txt). Celles de ce ticket :

| Mutation | Banc | Issue |
| --- | --- | --- |
| R1 un index d'un autre schéma se compare quand même | `preuves.test.mjs` | rouge |
| R2 sans index, la CLI est lancée | `preuves.test.mjs` | rouge |
| R3 la sortie de la CLI n'est pas rendue (toujours 0) | `preuves.test.mjs` | rouge |
| R4 une panne de la CLI (sortie 2) passe pour un rapport | `preuves.test.mjs` | rouge |
| R5 le sujet visé par le push est ignoré | `preuves.test.mjs` | rouge |
| R6 develop toujours, jamais le sujet le plus proche | `preuves.test.mjs` | rouge |
| R7 le premier push d'un dépôt neuf est refusé | `preuves.test.mjs` | rouge |
| R8 le rapport entier n'entre pas dans le résumé du job | `preuves.test.mjs` | rouge |
| R9 en enforce, un écart se dit « avertissement » | `preuves.test.mjs` | rouge |
| R10 une option inconnue est acceptée | `preuves.test.mjs` | rouge |
| F1 la grille d'une règle haute n'exige pas le bout en bout | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| F2 sans l'étiquette de cas | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| F3 SKILL : la limite du relais dans le dépôt de la CLI n'est plus dite | `preuve-suffisante-socle-tests.test.mjs` | rouge |

Les autres mutations de la PR (22) sont dans les tickets 87 et 88.

## Vérification

1. § 1 : 24 rouges sur 103 avant le patch ; § 2 : 125 verts sur 125.
2. Les mutations de la PR, la branche commitée : « toutes rouges » (35).
3. La suite entière, verte (§ 3).

### Ce qui a été joué en écrivant ce ticket

_Avec le patch d'avant les retouches d'`A-202` ; les comptes d'après sont sous « Rejoué par la relecture » (ticket 85 pour la PR entière)._

- **Le relais contre la vraie CLI** (`@maj-agency/anchorpost` 2.0.1, installée à part), sur un arbre jetable d'un clone d'Anchorpost (`develop`, `2be4e7e`, index au pivot 3, `observe`), `preuves.mjs` et `coverage-diff-regles.mjs` copiés à part, `PROJET_RACINE` à la racine de l'arbre : `--base HEAD~3` donne `preuves : base HEAD~3, mode jugé observe ; 5 règle(s) touchée(s), 1 écart(s), 0 avertissement(s)`, puis `avertissement (observe) case-without-proof RULE_ALL_ANC-19 : Le cas source-invalide de RULE_ALL_ANC-19 n'a aucune preuve.` et la commande du rapport entier, sortie 0 ; `--base develop` sur un commit plus ancien que develop : 0 règle touchée. 7,8 s pour un passage, charge 4. L'arbre jetable retiré après.
- Le reste de la PR : ticket 88.

## Ce qui n'a pas été établi

1. **Le gate dans un vrai pre-push et une vraie fin de tour** : joué par ses bancs et à la main ; la repose dans Anchorpost (`.21`) le posera. **Dans Anchorpost, le relais tel quel sort en 2** : la CLI y est le paquet `apps/cli` de l'espace de travail, `node_modules/.bin/anchorpost` n'existe pas à la racine (son relais `anchorpost.mjs` est déjà adapté pour cela) ; `.21` l'adapte de même, sinon chaque fin de tour qui a changé un fichier est bloquée (décision 7 ; `SKILL.md`, étape 2.3, le dit).
2. **L'étape de CI** : écrite dans `SKILL.md`, jamais jouée sous GitHub Actions ; le résumé du job est joué par son banc (`GITHUB_STEP_SUMMARY` posé à un fichier).

## Hors périmètre

- Le job de PR qui mute le `code` des règles hautes : question 2.
- Ce que `compare` juge : la CLI.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `K2` de la carte de `SPEC_ALL_ANC-5`, ses § 2 et 5, et la CLI 2.0.1, sur un clone neuf de `main` à `ddb4265` (plugin 8.0.0).
- 2026-11-22 — Retouché par le relecteur du tour 1 (`83-89-relecture-tour-1/rapport.md`, « Retouches portées »), sur les décisions d'`A-202` : le patch commun régénéré (sha256 `2d18d2842e677e39788054dbbe949cbde74009f57f648e24eabb2f9613a8e74a`) ; la limite du relais dans le dépôt de la CLI dite par `SKILL.md` (décision 7, F3) ; § 1 à 24 rouges sur 103, § 2 à 125, 35 mutations ; la suite se compte « `main` au départ + 26 », avec la table de chaque ordre d'entrée.
