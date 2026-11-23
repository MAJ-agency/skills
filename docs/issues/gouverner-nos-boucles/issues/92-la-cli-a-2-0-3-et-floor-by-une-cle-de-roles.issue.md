# Le skill `anchorpost` installe la CLI à `^2.0.3`, et dit que `floor.by` est une clé de `roles`

Status: Fait — PR 158, `6c37fe3` sur `main`, plugin 8.3.1
Type: amélioration
Modèle: sonnet — du texte et un banc, aux mots de la CLI 2.0.3 et de la décision `A-284` d'Anchorpost, sans rien à concevoir ; le code entier est dans le patch ([`92-annexes/ticket-92.patch`](92-annexes/ticket-92.patch), sha256 `55b264b5c2624e5e85e50e6841360abe0eed43453b201bccaeae8a24972bb1b7`, `git diff -U2` sur `main` à `24fbd72`, plugin 8.3.0 : deux lignes de contexte, pour que le patch ne recopie pas l'auteur de `plugin.json`), décrit fichier par fichier ci-dessous, note de version 8.3.1 comprise ; le banc rouge avant le texte (2 sur 3), vert après ; les 21 mutations de [`92-annexes/mutations.mjs`](92-annexes/mutations.mjs) toutes rouges. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/anchorpost/SKILL.md` (lignes 3, 30, 33, 59, 62, 112, 113), `references/rules/anchorpost.md` (une ligne après la 60), `references/manifest.json` (le `$comment`), `README.md` (la ligne du skill, 83), `scripts/preuve-suffisante-anchorpost.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, que toute PR de suite touche (la règle du § 3). Le ticket 91, en vol, touche aussi `anchorpost/SKILL.md` (l'étape 6, ligne 102) et `README.md` (vers la ligne 205) : aucune ligne commune, seuls les deux fichiers de version entrent en conflit.

## Le besoin

1. **La CLI `@maj-agency/anchorpost` 2.0.3 est publiée** sur npmjs.com le 2026-11-23, servie en `latest` (`develop` d'Anchorpost à `8dc9f12`, PR 394, « livraison intermédiaire de la preuve suffisante, .71 à .75 pour la CLI 2.0.3 »). Sur `main` à `24fbd72`, le skill `anchorpost` l'installe à `@^2` (étape 1, `SKILL.md:33`) et à `@^2.0.2` (« Passer au pivot 3 », `SKILL.md:112`), et sa description et sa ligne du README disent « ≥ 2.0.0 » ; `scripts/preuve-suffisante-anchorpost.test.mjs:37-38` tient ces deux plages. `git grep` de `@maj-agency/anchorpost@` sur `main`, hors de `docs/issues` : ces deux lignes seules (et la note 8.3.0 de `NOTES-DE-VERSION.md`, qui est l'histoire).

   Ce que la 2.0.3 apporte (tickets `SPEC_ALL_ANC-5.71` à `.75` d'Anchorpost, tous `Fait`) :

   | Ticket | Ce qui change pour un projet |
   | --- | --- |
   | `.71` (PR 385) | une aide de garde importée par un espace de noms (`import * as p`) ou par défaut est lue comme une aide du fichier ; une aide importée qui saute **sans condition** fait tomber les preuves au lieu de les garder sans note ; une condition de saut qui compare deux fixtures de Playwright (`page !== context`) ou lit une variable du module au nom d'une fixture n'est plus jugée toujours vraie ou toujours fausse : une fausse preuve (déjà en 2.0.1) et deux faux refus de moins ; **une preuve gardée jusqu'ici peut tomber** : `test.skip(page !== context, …)` gardait la sienne (S2a), il la fait tomber |
   | `.72` (PR 389) | la même aide, passée par un **baril** (`export … from`, `export *`) ou **méthode d'un objet ou d'une classe exportés**, ne garde plus sa preuve sans note : une fausse preuve de moins, présente avant `.71` |

   Ce que la 2.0.3 ne lit pas encore : deux formes « du côté non sûr », dites au README de la CLI (§ « Limites tenues par la revue ») et traitées par `.76` (`ready-for-agent`, hors 2.0.3) : l'héritage d'une classe exportée (`export class B extends A {}`, une méthode de `A` qui coupe) et une aide exportée qui appelle une fonction locale non exportée qui saute ; `.77` (prévu en 2.0.4) ajoute l'aide qui appelle une fonction importée d'un chemin relatif. Ces preuves restent gardées, sans note : le skill ne promet pas plus que ce que la 2.0.3 lit.
   | `.73` (PR 391) | le pair `zod` déclaré « 3.25 ou 4 » : un projet en zod 3.25 n'a plus d'avertissement à l'installation ; les types de la bibliothèque se lisent par `zod/v4` |
   | `.74` (PR 390) | `migrate manifest --apply` ne change que ce que la conversion change : la mise en forme du manifeste (tableaux sur une ligne, indentation, fin de fichier) est gardée à l'octet ; sur un projet suivi, 134 lignes de diff pour 16 valeurs changées avant |
   | `.75` (PR 387) | le tirage de `crissCross` borné (un banc de la CLI qui dépassait son délai) : rien pour un projet |

   **Pourquoi `^2.0.3` et pas `^2`** : `pnpm add -Dw @maj-agency/anchorpost@^2` dans un dépôt qui a déjà une 2.0.0, 2.0.1 ou 2.0.2 au lockfile la garde, puisqu'elle satisfait la plage ; le dépôt garde alors les fausses preuves que `.71` et `.72` retirent, et `migrate manifest` y redéplie les tableaux. `^2.0.3` fait monter une 2.0.x plus ancienne et laisse venir les correctifs suivants.

2. **`floor.by` est une clé de `roles`.** Le `by` d'un plancher de contexte (`contexts[].floor.by` du manifeste) est une personne de la table `roles`. Décision `A-284` d'Anchorpost (ticket `SPEC_ALL_ANC-5.78`, `ready-for-agent`, hors 2.0.3) : la CLI 2.0.4 l'alertera, par une **alerte de santé, jamais un refus**, comme un `featureCriticality.by` inconnu ; `compare` tient déjà pour un écart la baisse d'un plancher sans `floor.by` connu de `roles` (`A-55` bis). Sur `main`, le skill dit « la personne qui le pose (`floor { date, by, proven, partial }`) » sans dire que c'est une clé de `roles` ; la fiche (`references/rules/anchorpost.md:60`) dit `by` une clé de `roles` pour la criticité d'une règle, pas pour le plancher ; le `$comment` du gabarit du manifeste non plus.

## Décisions

1. **`^2.0.3` aux deux installations** (étape 1 et « Passer au pivot 3 »), chacune avec sa raison en une parenthèse (« `@^2` seul garde une 2.0.x plus ancienne déjà installée ») ; la description du skill, sa phrase « Ce skill suit la CLI … » (étape 1) et sa ligne du README passent à « ≥ 2.0.3 ». La phrase de l'étape 1 dit exactement les formes que la 2.0.3 lit en plus (`.71`, `.72`), renvoie aux « Limites tenues par la revue » du README de la CLI pour les deux qu'elle ne lit pas, et dit la mise en forme gardée par `migrate manifest` ; jamais « ne rend plus de preuve », que la 2.0.3 ne tient pas (B16). La note dit aussi qu'une preuve gardée jusqu'ici peut tomber (`page !== context`, S2a de `.71`) : l'index d'un projet peut perdre des prouvées à la montée, sans que personne n'ait baissé de plancher (B18, B19).
2. **Les « ≥ 2.0.0 » qui datent un trait de la CLI restent** : le titre « Criticité et cas attendus (pivot 3, CLI Anchorpost ≥ 2.0.0) » de la fiche et ses « CLI Anchorpost 2.0.0 », le `$comment` du gabarit (« version 3, CLI ≥ 2.0.0 »), `CONTENU.md`, le skill `criticite`, le gabarit de règle de `tickets`, et le gate `preuves` de `socle-tests` (`preuves.mjs`, `CONTENU.md`, `SKILL.md`) : le pivot 3 et `compare` existent depuis la 2.0.0, et ces phrases ne disent pas quoi installer. Seuls changent ce qui installe la CLI et ce qui dit quelle CLI le skill suit. Le banc le tient : aucun texte de `skills/` ni le `README.md` n'installe la CLI à une autre plage que `^2.0.3` (`NOTES-DE-VERSION.md` et `docs/issues/` sont l'histoire, hors du banc).
3. **Le gabarit du manifeste n'écrit aucun `floor.by`** : `init` mesure le plancher sans `by` (`apps/cli/src/init/manifest.ts:517` d'Anchorpost à `8dc9f12` : `{ date, proven, partial }`), et un agent n'écrit jamais le nom d'une personne. Le `$comment` dit seulement que la personne qui relève le plancher l'écrit (« `by`, une clé de `roles` ») ; un plancher sans `by` ne donne aucune alerte (`A-284`). Le banc tient l'absence de `by` dans le gabarit.
4. **La règle vaut dès maintenant, l'alerte vient en 2.0.4** : la fiche le dit en ces termes, sans promettre à la 2.0.3 une alerte qu'elle n'a pas ; elle cite ce que `compare` fait déjà (la baisse sans `floor.by` connu). Une mutation (B8) rougit si la fiche dit « la CLI alerte » sans version, une autre (B9) si elle dit l'alerte un refus.
5. **La table `roles` dit qui y figure** (étape 3, question 4) : « Facultative pour un projet où personne ne signe de `by` : toute personne qui signe un `by` du manifeste (par exemple un plancher, une criticité de feature, une validation des preuves) y figure ; sans elle, aucun `by` n'est connu. » La liste est ouverte (« par exemple ») : le manifeste 3 a aussi `proofsValidation.by`, que `compare` juge contre les mêmes `roles`. **Connu veut dire connu sur la base** : `compare` ne reconnaît que les personnes des `roles` de la base de fusion ; une personne ajoutée à `roles` dans la PR même n'y signe pas une baisse de plancher. La fiche, le point 2 de « Passer au pivot 3 » et la note le disent : la personne s'ajoute à `roles` par une PR à part, avant (B20, B21). Et l'étape 3 dit qu'`init` écrit les planchers « sans `by` », et que la personne qui en relève un écrit son nom en `floor.by`.
6. **Un test neuf**, dans le banc du ticket 89 (`preuve-suffisante-anchorpost.test.mjs`), plutôt qu'un banc neuf : c'est le banc qui tient le skill `anchorpost` ; les deux phrases d'installation du premier test passent à `^2.0.3`. La fiche reste sous deux cents lignes (63).
7. **La version est la suivante de `main` au moment de livrer** : le patch porte 8.3.1 (sur `24fbd72`). Le ticket 91, en vol, vise aussi 8.3.1 : la PR qui entre en second fusionne `origin/main` et remonte d'un cran (`version-suivante.mjs`, § 3), et sa note passe au-dessus de l'autre. Patch, pas mineure : un correctif de version et une précision de règle, sans skill ni gabarit ajouté (`README.md`, « Bumper `version` »).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/anchorpost/SKILL.md` | la description (≥ 2.0.3) ; l'étape 1 (la phrase « Ce skill suit la **CLI 2.0.3 et les suivantes** … » et le point 2, `@^2.0.3` et sa raison) ; l'étape 3 (la question 4, qui figure dans `roles` ; les planchers d'`init` sans `by`, `floor.by` une clé de `roles`) ; « Passer au pivot 3 », point 1 (`@^2.0.3`, la 2.0.3 qui garde la mise en forme) et point 2 (`by` une clé de `roles`, que la personne écrit) ; 148 lignes |
| `skills/chaine/anchorpost/references/rules/anchorpost.md` | une puce après celle du manifeste : « **`floor.by` est une clé de `roles`** … la CLI 2.0.4 alertera … » |
| `skills/chaine/anchorpost/references/manifest.json` | le `$comment` : « la personne qui le pose (`by`, une clé de `roles`) » |
| `README.md` | la ligne du skill : « la CLI (≥ 2.0.3) » |
| `scripts/preuve-suffisante-anchorpost.test.mjs` | les deux phrases d'installation du premier test ; un test neuf (les deux formes `@maj-agency/anchorpost@<plage>` et `"@maj-agency/anchorpost": "<plage>"`) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.3.1 et sa note |

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main '+refs/heads/claude-jfrt-fam/lucid-pasteur-q59f3p:refs/remotes/origin/claude-jfrt-fam/lucid-pasteur-q59f3p'
git switch -C claude/anchorpost-2-0-3 origin/main
mkdir -p "$S/92" && for f in ticket-92.patch mutations.mjs version-suivante.mjs; do git show "origin/claude-jfrt-fam/lucid-pasteur-q59f3p:docs/issues/gouverner-nos-boucles/issues/92-annexes/$f" > "$S/92/$f"; done
sha256sum "$S/92/ticket-92.patch"
git log -1 --format=%h origin/main; git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme, `claude-jfrt-fam/lucid-pasteur-q59f3p`, celle qui les porte (sur `main` si la PR de documentation qui porte ce ticket y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. La somme attendue : **`55b264b5c2624e5e85e50e6841360abe0eed43453b201bccaeae8a24972bb1b7`** ; une autre : s'arrêter. `main` attendu : `24fbd72`, `"version": "8.3.0"`, ou `main` après le ticket 91 (`"version": "8.3.1"`) : le § 2 le dit.

### § 1 — Le banc d'abord, vu rouge, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='*.test.mjs' "$S/92/ticket-92.patch" && git status --short)
(cd "$S/rouge" && timeout 300 node --test --test-reporter=tap scripts/preuve-suffisante-anchorpost.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Un fichier ` M` (`scripts/preuve-suffisante-anchorpost.test.mjs`). Attendu : `# tests 3`, `# pass 1`, `# fail 2` : `not ok 1 - le skill anchorpost suit la CLI 2.0.0 …` (les deux phrases d'installation à `^2.0.3`) et `not ok 3 - le skill anchorpost installe la CLI à ^2.0.3, partout, et dit que floor.by est une clé de roles` ([`92-annexes/s1-rouge.txt`](92-annexes/s1-rouge.txt)).

### § 2 — Le patch, dans la branche, et le banc vert

Sur `24fbd72` (8.3.0) :

```bash
git apply "$S/92/ticket-92.patch" && git status --short
```

**Sur un `main` bougé** (le ticket 91 entré, ou une autre PR) :

```bash
git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/92/ticket-92.patch"
node "$S/92/version-suivante.mjs" "$S/92/ticket-92.patch"
git status --short
```

(au départ seulement, la branche n'ayant pas encore de note, l'annexe la donne ; `version-suivante.mjs` écrit la version prise, 8.3.2 après le ticket 91). Un `git apply` qui échoue : s'arrêter et l'écrire au lanceur. Dans les deux cas, sept fichiers ` M`, puis :

```bash
timeout 600 node --test --test-reporter=tap scripts/preuve-suffisante-anchorpost.test.mjs scripts/depot.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Attendu : `# tests 72`, `# pass 72`, `# fail 0` (les 3 de `preuve-suffisante-anchorpost.test.mjs` et les 69 de `depot.test.mjs`), aucun `not ok` ; de même après le ticket 91 ([`92-annexes/essai-apres-91.txt`](92-annexes/essai-apres-91.txt)).

Le patch, fichier par fichier (il fait foi) :

- **`SKILL.md`** : décisions 1, 3 et 5. Ligne 3, « (≥ 2.0.3, publique sur npmjs.com) » ; ligne 30, « Ce skill suit la **CLI 2.0.3 et les suivantes** : le pivot 3 depuis la 2.0.0 (criticité, cas attendus, état « partielle », `compare`) ; la 2.0.3 lit en plus une aide de garde importée par un espace de noms, par défaut, par un baril, ou méthode d'un objet ou d'une classe exportés, et une aide importée qui saute sans condition : la preuve qu'elle fait sauter ou couper tombe ; deux formes restent non lues (README de la CLI, « Limites tenues par la revue ») ; et `migrate manifest` y garde la mise en forme du manifeste. » ; ligne 33, « `pnpm add -Dw @maj-agency/anchorpost@^2.0.3` (`@^2` seul garde une 2.0.x plus ancienne déjà installée ; le hook … » ; ligne 59, la question 4 (décision 5, « Facultative » ne vaut que pour un projet où personne ne signe de `by`) ; ligne 62, « sans `by` ; un humain les relève, jamais ne les baisse, et la personne qui en relève un écrit son nom en `floor.by`, une clé de `roles`. » ; ligne 112, « `@^2.0.3` (`migrate manifest` est de la 2.0.2 et garde la mise en forme du manifeste depuis la 2.0.3 ; `@^2` seul garde une 2.0.x plus ancienne déjà installée) » ; ligne 113, après « (`floor { date, by, proven, partial }`) », « ; `by` est une clé de la table `roles` du manifeste, que la personne écrit elle-même, et qui y figure déjà sur la base : une personne ajoutée à `roles` dans la PR même n'y signe pas, elle s'y ajoute par une PR à part, avant. »
- **`rules/anchorpost.md`** : décisions 4 et 5, une puce de deux phrases (« connu des `roles` de la base », la PR à part, avant).
- **`manifest.json`** : décision 3, dans le `$comment` seul.
- **`README.md`** : décision 1.
- **`preuve-suffisante-anchorpost.test.mjs`** : `readdirSync` importé ; les deux phrases d'installation à `^2.0.3` ; le test « le skill anchorpost installe la CLI à ^2.0.3, partout, et dit que floor.by est une clé de roles » : toute occurrence de `@maj-agency/anchorpost@<plage>` ou de `"@maj-agency/anchorpost": "<plage>"` dans les `.md`, `.json`, `.mjs`, `.sh` et `.yml` de `skills/` et dans `README.md` est `^2.0.3` ; les phrases du skill, du README, de la fiche et de la note ; aucun « ne rend plus de preuve » dans le skill ; le `$comment` du gabarit ; aucun `by` dans le plancher du gabarit.
- **`NOTES-DE-VERSION.md`** : la note 8.3.1 (« Ce qui change » : la CLI à `^2.0.3`, les formes qu'elle lit en plus et les deux qu'elle ne lit pas, la preuve de `page !== context` qui tombe, `floor.by` une clé des `roles` de la base ; « Ce qu'un projet fait pour en profiter » : monter la CLI, régénérer et relire l'index, qui peut perdre des prouvées, sans baisser de plancher, reposer la fiche, vérifier chaque `floor.by`, une personne absente s'ajoutant à `roles` par une PR à part, avant). **`plugin.json`** : 8.3.1.

### § 3 — Vérifier, commiter, livrer

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(anchorpost): la CLI à ^2.0.3, floor.by une clé de roles (plugin <version>)"
git status --short
```

`<version>` : 8.3.1 sur `24fbd72` ; sinon celle que `version-suivante.mjs` a écrite. La dernière ligne du `--stat` : `7 files changed` (`68 insertions(+), 13 deletions(-)` sur `24fbd72`) ; `git status --short` vide. Puis les mutations :

```bash
timeout 1200 node "$S/92/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE ' "$S/mutations.log"; grep -v '^ROUGE ' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `21` rouges, la seule ligne `toutes rouges`, `git status --short` vide. Puis la suite entière, seule, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) :

```bash
uptime; env -u NODE_PATH timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# fail 0`, `# tests` égal à `# pass` : **le compte de `main` au départ, plus 1** (le test neuf) : 1 462 sur `24fbd72` (1 461 sur `main`, `91-annexes/suite-main.txt`) ; 1 472 après le ticket 91 (1 471, plus 1). Recopier le calcul dans la PR. Puis :

```bash
git push origin claude/anchorpost-2-0-3
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit. Dans le corps : le § 1 (rouges avant), le § 2 (verts après), le journal des mutations, la suite entière (compte, durée, charge avant et après), et les décisions 2, 3 et 4 en une phrase chacune. La session ne la fusionne pas. Elle rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` a bougé entre l'ouverture de la PR et sa fusion** (le ticket 91 entré le premier, par exemple) : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; la note se repose depuis la branche, prise avant la fusion ; `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit, et eux seuls, se reprennent de `main`, et la version suivante se pose de nouveau :

```bash
git fetch origin main
git diff "$(git merge-base origin/main HEAD)" HEAD -- NOTES-DE-VERSION.md > "$S/92/note-de-la-branche.patch"
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/92/version-suivante.mjs" "$S/92/note-de-la-branche.patch"
git add -A && git commit --no-edit && git push origin claude/anchorpost-2-0-3
```

Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis le banc du § 2, la suite entière à nouveau, et le titre de la PR à la version prise.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la CLI s'installe à `^2.0.3`, à l'étape 1 et au pivot 3, chacune avec sa raison | `preuve-suffisante-anchorpost.test.mjs`, tests 1 et 3 ; B1, B2, B3 |
| aucun autre texte du plugin n'installe la CLI à une autre plage, ni en commande ni en dépendance d'un `package.json` | le test 3 (le parcours de `skills/` et `README.md`) ; B4, B15 |
| le skill dit les formes que la 2.0.3 lit en plus et renvoie aux limites du README de la CLI, sans promesse absolue | le test 3 ; B16, B17 |
| la description et la ligne du README disent ≥ 2.0.3 | le test 3 ; B5, B6 |
| la fiche dit `floor.by` une clé des `roles` de la base, la règle dès maintenant, l'alerte de santé en 2.0.4, jamais un refus | le test 3 ; B7, B8, B9, B20 |
| le skill (pivot 3, étape 3) et le `$comment` du gabarit disent `floor.by` une clé de `roles`, la personne ajoutée par une PR à part, avant ; « Facultative » limitée ; le gabarit n'écrit aucun nom | le test 3 ; B10, B11, B12, B13, B21 |
| la note dit les deux changements, la preuve de `page !== context` qui tombe et l'index qui peut perdre des prouvées | le test 3 ; B14, B18, B19 |

## Mutations

[`92-annexes/mutations.mjs`](92-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) : `node "$S/92/mutations.mjs"`. Chacune seule, le fichier remis après, sur `preuve-suffisante-anchorpost.test.mjs` et `depot.test.mjs`. Journal : [`92-annexes/mutations.txt`](92-annexes/mutations.txt).

| Mutation | Issue |
| --- | --- |
| B1 SKILL, étape 1 : le `.3` retiré (`@^2.0`) | rouge |
| B2 SKILL, étape 1 : `@^2` remis | rouge |
| B3 SKILL, pivot 3 : `@^2.0.2` remis | rouge |
| B4 un autre texte du plugin (`socle-tests/SKILL.md`) installe la CLI à `@^2` | rouge |
| B5 SKILL : la description dit encore ≥ 2.0.0 | rouge |
| B6 README : la ligne du skill dit encore ≥ 2.0.0 | rouge |
| B7 fiche : la phrase `floor.by` retirée | rouge |
| B8 fiche : l'alerte promise dès maintenant (« la CLI alerte », sans 2.0.4) | rouge |
| B9 fiche : l'alerte dite refus | rouge |
| B10 SKILL, pivot 3 : `by` n'est plus dit clé de `roles` | rouge |
| B11 manifeste : le `$comment` ne dit plus `by` clé de `roles` | rouge |
| B12 manifeste : le gabarit écrit un nom en `floor.by` | rouge |
| B13 SKILL, étape 3 : la table `roles` ne dit plus qui y figure (« Facultative. » seul) | rouge |
| B14 note : sans la phrase `floor.by` | rouge |
| B15 un gabarit de `package.json` du plugin (`socle-web-next`) porte la CLI en dépendance à `^2` | rouge |
| B16 SKILL, étape 1 : la promesse absolue revient (« ne rend plus de preuve ») | rouge |
| B17 SKILL, étape 1 : les deux formes non lues ne sont plus dites | rouge |
| B18 note : la chute de `page !== context` n'est plus dite | rouge |
| B19 note : « Ce qu'un projet fait » ne dit plus la perte de prouvées | rouge |
| B20 fiche : `roles` de la base n'est plus dit | rouge |
| B21 SKILL, pivot 3 : la PR à part, avant, n'est plus dite | rouge |

21 rouges sur 21.

## Vérification

1. § 1 : 2 rouges sur 3 avant le texte.
2. § 2 : 72 verts sur 72 après, sur `24fbd72` comme après le ticket 91.
3. Les mutations, la branche commitée : « toutes rouges » (21).
4. La suite entière : 1 462 sur `24fbd72`, sortie 0, sans `NODE_PATH`.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `main` à `24fbd72` (plugin 8.3.0), le 2026-11-23, Node 22.23.5, git 2.43.0 :

- **Les plages** : `git grep` de `@maj-agency/anchorpost@` hors de `docs/issues` : `SKILL.md:33` (`@^2`), `SKILL.md:112` (`@^2.0.2`), et la note 8.3.0 ; les « ≥ 2.0.0 » listés à la décision 2, lus un à un.
- **La CLI et `A-284`** : les tickets `.71` à `.75` et `.78` de `SPEC_ALL_ANC-5`, le README de la CLI et `apps/cli/src/init/manifest.ts` lus sur `develop` d'Anchorpost à `8dc9f12` (`init` mesure un plancher `{ date, proven, partial }`, sans `by`).
- **§ 1** ([`s1-rouge.txt`](92-annexes/s1-rouge.txt)) : 1 ` M`, **2 rouges sur 3**. **§ 2** : 7 ` M`, **72 sur 72** ; l'essai « 91 entre d'abord » ([`essai-apres-91.txt`](92-annexes/essai-apres-91.txt)) : `ticket-91.patch` posé sur `24fbd72` et commité (8.3.1), puis ce patch sans ses deux fichiers de version : il s'applique, `version-suivante.mjs` écrit `8.3.2 — 2026-11-23`, la note 8.3.2 au-dessus de la 8.3.1, **72 sur 72**. **§ 3** : `7 files changed, 68 insertions(+), 13 deletions(-)` ; les mutations, la branche commitée ([`mutations.txt`](92-annexes/mutations.txt)) : **21 rouges sur 21**, `sortie 0`, arbre propre ; la suite entière, sur le patch d'avant les retouches du tour 1 (qui ne changent que ce banc et des textes ; non rejouée, décision de l'architecte), sans `NODE_PATH` ([`suite.txt`](92-annexes/suite.txt)) : **1 462 tests, 1 462 verts**, aucun échec, saut, annulation ni « todo » (1 461 de `main`, plus le test neuf), 21 min 35 s (08:53:34 → 09:15:09 UTC, `duration_ms` 1294765), charge 1,40 au départ, 5,81 à la fin, montée à 25 en cours (d'autres agents jouaient leurs bancs). Les retouches ne changent pas le compte : le test neuf est le même, ses assertions seules s'ajoutent.
- **La montée d'une 2.0.x déjà installée**, jouée par le relecteur du tour 1 ([`relecture-tour-1.md`](92-annexes/relecture-tour-1.md), m6) : dans un dépôt jouet sous pnpm 10.28.0, `pnpm add -Dw @maj-agency/anchorpost@2.0.1`, puis `@^2`, laisse 2.0.1 au lockfile (`specifier: ^2`, `version: 2.0.1`) ; `@^2.0.3` monte à 2.0.3. La raison de la décision 1 tient.

## Ce qui n'a pas été établi

1. **L'alerte `floor.by` de la 2.0.4** : non publiée ; le texte suit `A-284` tel qu'écrit dans `.78`. Si la 2.0.4 la livre autrement (son message, son code, ou `by: agent` traité à part), la fiche se corrige au ticket qui suivra la 2.0.4.
2. **Le job `bancs` de la CI du plugin** : la suite a tourné sur un poste de session, sous `env -u NODE_PATH`.

## Hors périmètre

- **Les « ≥ 2.0.0 » qui datent un trait de la CLI** (décision 2), dont le message de `preuves.mjs` de `socle-tests` quand la CLI est absente : `compare` existe depuis la 2.0.0, et la plage installée est celle du skill `anchorpost`.
- **L'alerte elle-même** : un ticket d'Anchorpost (`SPEC_ALL_ANC-5.78`, CLI 2.0.4), pas du plugin.
- **Le skill `criticite`** et les `by` de `criticality` : inchangés, la fiche les disait déjà clés de `roles`.

## Comments

- 2026-11-23 — Retouché par son rédacteur après le tour 1 de relecture ([`92-annexes/relecture-tour-1.md`](92-annexes/relecture-tour-1.md), « prêt après retouches », 1 bloquant, 6 mineurs, tous pris par l'architecte, `A-218`, sans second tour) : B1, les formes que la 2.0.3 lit en plus et le renvoi aux limites du README de la CLI au lieu de « ne rend plus de preuve » (`SKILL.md:30` et la note) ; m1, la preuve de `page !== context` qui tombe et l'index qui peut perdre des prouvées (la note) ; m2, « Facultative » limitée, la liste des `by` ouverte, « sans elle, aucun `by` n'est connu » ; m3, « connu des `roles` de la base » et la PR à part, avant (la fiche, le pivot 3, la note) ; m4, la forme de dépendance dans le parcours du test 3 ; m5, le § 0 sur la branche qui porte les annexes ; m6, l'essai pnpm du relecteur sous « Ce qui a été joué ». Patch régénéré (sha256 `55b264b5c2624e5e85e50e6841360abe0eed43453b201bccaeae8a24972bb1b7`), banc rejoué (§ 1 : 2 rouges sur 3 ; § 2 : 72 sur 72, de même après le ticket 91), 21 mutations toutes rouges (7 neuves, B10 et B13 ajustées).
- 2026-11-23 — Le patch est un `git diff -U2` (deux lignes de contexte) : à trois, le contexte de `plugin.json` recopiait le nom de l'auteur, que ce dépôt public porte déjà mais qu'un ticket ne cite pas ; `git apply` le pose de même, et donne le même arbre que la branche commitée.
- 2026-11-23 — Écrit par un agent rédacteur sur la publication de la CLI 2.0.3 (npmjs.com, `develop` d'Anchorpost à `8dc9f12`, PR 394) et la décision `A-284` (ticket `SPEC_ALL_ANC-5.78`), sur un clone neuf de `main` à `24fbd72` (plugin 8.3.0) ; banc, mutations, essai après le ticket 91 et suite joués.
