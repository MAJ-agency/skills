# Le gabarit des index générés ne nomme plus l'API qu'un projet n'a pas, et six phrases de la documentation disent ce que l'usage a montré

Status: needs-triage
Type: défaut
Modèle: sonnet — une entrée retirée d'un gabarit JSON et écrite par les deux skills qui en ont besoin, des phrases à poser là où les relectures et l'essai les ont relevées, un banc de texte ; rien à concevoir hors de la décision `A-263`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/index-generes.json` (l'entrée `apps/api/openapi.json`, ligne 4 ; le `$comment`, ligne 2) ; `skills/chaine/socle-chaine-de-production/SKILL.md` (étape 3, ligne 34) et `references/CONTENU.md` (lignes 9 et 13) ; `skills/backend/socle-nest-hexagonal/SKILL.md` (étape 3, après la ligne 78) ; `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md` (deux puces, section « Dépôt, branches, worktrees », après la ligne 15) ; `README.md` (ligne 207) ; `scripts/chaine-seule.test.mjs` (un test neuf, après 72) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Seul dans sa PR, sans ordre imposé** : aucun des tickets 93 à 110 ne touche ces fichiers hors des deux fichiers de version. Le ticket 114 pose le gabarit `index-generes.json` dans son garde : la seconde PR à entrer rejoue `scripts/socle-pose-passe-son-gate.test.mjs` et `scripts/references-posees.test.mjs` sur `main` (le second, joué ici sans l'entrée OpenAPI : vert). Le ticket 111 (`needs-info`) touche `README.md` : le second à entrer relit la ligne 207 sur `main`. `scripts/chaine-seule.test.mjs:66` épingle la phrase « Puis générer chaque index de la liste par sa `commande` … » de l'étape 3 : elle ne change pas. Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

## Le besoin

Sept points de la liste des suites, tous de texte, sauf un gabarit.

1. **L'entrée OpenAPI du gabarit `index-generes.json` est posée sans API** (ticket 91, « Ce qui a été trouvé en plus », 5) : inerte, mais elle nomme une brique absente, et l'essai l'a retirée à la main.
2. **La phrase Prisma** (journal de la carte, 2026-11-22, 16 h 20 UTC) : un projet a vu deux fois `regenerer_index` réécrire un index avec un client Prisma périmé, après la réception de develop dans un sujet. L'avis rendu : la commande de l'entrée régénère d'abord ce dont elle dépend, et une `verification` tient le résultat. Le socle ne le dit pas.
3. **`m2` de la contre-relecture de la PR 156** : `README.md:207`, « Un banc du plugin […] vit sous `scripts/` de son skill » : faux pour `fusionner`, `sujet`, `revue-adversariale` et `revue-de-ticket`, dont les `scripts/` sont posés en entier.
4. **`m3`** : `socle-chaine-de-production/references/CONTENU.md:13`, « chaque cas donne son régime et ses chemins sensibles » : la plupart des cas ne donnent rien et valent pour un dépôt sans contrat.
5. **La note 8.0.1** (tour 3 de la PR 152, journal de la carte, 2026-11-22, 18 h 45 UTC, « à la prochaine note ») ne dit pas ce que devient une PR de fourche vers `develop`.
6. **La longueur du pre-push** (essai, journal de la carte, 2026-11-22, 17 h 48 UTC) : il joue `pnpm check` entier, 590 s pour trois fichiers.
7. **L'avertissement de commitlint sur le pied de page** (même entrée) : `footer-leading-blank` sur un corps à paragraphes.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `socle-chaine-de-production/references/index-generes.json:4` : `{ "chemin": "apps/api/openapi.json", "commande": "pnpm --filter @{{SCOPE}}/{{PROJET}}-api openapi:emit", "verification": "… openapi:check" }`, posé « s'il n'existe pas » par l'étape 3 (`SKILL.md:34`), qui dit aussi « Y ajouter les index que le projet connaît déjà (OpenAPI de l'API, …) » sans en écrire l'entrée. `socle-nest-hexagonal/SKILL.md` ne nomme pas `scripts/docs/index-generes.json` : une API posée après la chaîne n'y entre pas. `socle-monorepo/SKILL.md:119` installe les services avant la chaîne (`:177`) : dans l'ordre ordinaire, l'API est déjà là à l'étape 3. **Joué** : les 30 bancs de `references/` posés par `scripts/pose-du-socle.mjs` avec le gabarit sans cette entrée, au régime 8 : sortie 0, 414 tests, 413 verts, le saut admis ; aucun banc ne la lit.
2. `CONTENU.md:9` décrit la `verification` (« le gate anti-dérive de l'index ») ; ni lui ni l'étape 3 ne disent qu'une commande dont l'entrée lit un autre fichier généré (un client Prisma) doit le régénérer d'abord : `regenerer_index` joue la commande sur l'arbre de la fusion, où ce client peut dater d'avant.
3. `README.md:207` (la dernière phrase) ; `scripts/poses.test.mjs:18` (`POSES`) pose `skills/chaine/{fusionner,sujet,revue-adversariale,revue-de-ticket}/scripts/` sous `scripts/chaine/`.
4. `CONTENU.md:13`, la phrase sur `regles.test.mjs` ; la tête du banc (`regles.test.mjs:8-11`) dit juste : « Chaque cas donne ce qui le concerne ; sans, il vaut pour un dépôt sans contrat ».
5. `NOTES-DE-VERSION.md`, section 8.0.1 : la fourche sautée par `passer.sh`, `sujet.sh fusionner` et `relancer`, la sous-PR de fourche qui ne tient pas son sujet. Pour une PR de fourche vers `develop` : `file.sh:163-165` ne la marque pas (la marque ne vaut que vers un sujet) ; la boucle la prend « prête » (`boucle.sh:592`), `passer.sh:133-137` la saute en 7 avant tout fetch, et la boucle la met de côté pour son lancement (`boucle.sh:643`, `sautees`) : elle ne bloque aucune autre PR, et chaque lancement de la boucle la relit et la saute de nouveau.
6. `socle-monorepo/references/husky/pre-push:64` : `pnpm run check` entier, quel que soit le nombre de fichiers poussés, après le seul raccourci « rien de neuf » (`rien_de_neuf`, `:27-56`). `pieges.md` ne dit pas sa durée.
7. `socle-monorepo/references/racine/commitlint.config.mjs` étend `@commitlint/config-conventional`, où `footer-leading-blank` est un avertissement. **Rejoué** dans le dépôt jouet de l'essai du ticket 91, sur `3daedcd` : un corps à deux paragraphes et deux lignes de pied (`Co-Authored-By:`, `Claude-Session:`) précédées d'une ligne vide, aucun avertissement ; une ligne `closes #12` ou `BREAKING CHANGE: …` au milieu d'un paragraphe : `⚠ footer must have leading blank line [footer-leading-blank]`, sortie 0. Le commit passe.

## Décisions

Décidée le 2026-11-27 par l'architecte : **`A-263`**. Ce qui suit l'applique ; rien n'y est à trancher.

1. **L'entrée OpenAPI quitte le gabarit.** `index-generes.json` ne garde que `docs/agents/couts.md` ; son `$comment` ne change pas, hors « Chaque socle de service y ajoute ses entrées » qui reste vrai. L'étape 3 du socle de la chaîne écrit l'entrée entière, pour un projet qui a `apps/api/` : `{ "chemin": "apps/api/openapi.json", "commande": "pnpm --filter @<scope>/<projet>-api openapi:emit", "verification": "pnpm --filter @<scope>/<projet>-api openapi:check" }`. `socle-nest-hexagonal`, étape 3 (après le paragraphe d'`openapi.json`, `:78`) : « Si la chaîne est posée (`scripts/docs/index-generes.json` existe), y ajouter la même entrée. » La phrase « Puis générer chaque index de la liste par sa `commande` … » de l'étape 3 reste telle quelle (`chaine-seule.test.mjs:66`).
2. **La phrase Prisma**, à l'étape 3 et dans `CONTENU.md:9`, sans nommer de projet : « La `commande` d'un index qui lit un autre fichier généré (un client Prisma, des types émis) régénère d'abord ce fichier (`prisma generate && …`) : `regenerer_index` la joue sur l'arbre de la fusion, où il peut dater d'avant ; et sa `verification` joue le banc qui verrait l'index faux. »
3. **`m2`** : `README.md:207`, la dernière phrase devient : « Un banc du plugin, qui lit l'arbre du plugin (un gabarit, un autre skill), vit sous `scripts/` d'un skill que rien ne pose (hors de `POSES` de `scripts/poses.test.mjs`), jamais sous `references/`. »
4. **`m3`** : `CONTENU.md:13`, « chaque cas donne son régime et ses chemins sensibles » devient « chaque cas qui en dépend donne son régime et ses chemins sensibles ; les autres valent pour un dépôt sans contrat ».
5. **La fourche vers `develop`** : la note de la version de ce ticket porte une puce « Précision sur 8.0.1 » qui dit « La cause » (5) en deux phrases. Les notes passées ne se récrivent pas.
6. **Deux pièges**, dans `pieges.md`, section « Dépôt, branches, worktrees », à sa fin : « **Le pre-push joue `pnpm run check` entier**, quel que soit le nombre de fichiers poussés (590 s pour trois fichiers sur un dépôt d'essai) : pousser en tâche de fond, avec un délai d'au moins quinze minutes ; jamais le sauter (`--no-verify` est refusé). » ; « **commitlint avertit `footer-leading-blank`** quand une ligne du corps commence par un mot de référence (`closes #<n>`, `fixes #<n>`, `resolves #<n>`) ou par `BREAKING CHANGE:` au milieu d'un paragraphe : un avertissement, le commit passe ; ces lignes vont en pied, après une ligne vide. » La dette gelée d'un projet ne dépend pas des numéros de ligne (`references-agent.mjs:101-104`) : ajouter des lignes à `pieges.md` ne rallume pas sa référence gelée.
7. **Le banc** : `scripts/chaine-seule.test.mjs`, un test neuf : le gabarit `index-generes.json` ne nomme aucun chemin sous `apps/` ; l'étape 3 du socle de la chaîne et l'étape 3 de `socle-nest-hexagonal` écrivent l'entrée `apps/api/openapi.json` avec sa `commande` et sa `verification`.
8. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre. La note dit qu'un projet sans API retire l'entrée `apps/api/openapi.json` de son `scripts/docs/index-generes.json` s'il l'a, qu'un projet avec API n'a rien à faire, et la précision sur 8.0.1 (décision 5).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/socle-chaine-de-production/references/index-generes.json:4` | l'entrée retirée (décision 1) |
| `skills/chaine/socle-chaine-de-production/SKILL.md:34` | l'entrée OpenAPI écrite ; la phrase Prisma (décisions 1 et 2) |
| `skills/chaine/socle-chaine-de-production/references/CONTENU.md:9`, `:13` | décisions 2 et 4 |
| `skills/backend/socle-nest-hexagonal/SKILL.md:78` | décision 1, une phrase |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md` | décision 6, deux puces |
| `README.md:207` | décision 3 |
| `scripts/chaine-seule.test.mjs` | le test neuf (décision 7), sur le modèle de `:60-72` |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note (décisions 5 et 8) |

## À faire, dans l'ordre

1. **Partir de `main`** : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Le banc, rouge** (décision 7).
3. **Le gabarit et les deux étapes** (décision 1), puis les phrases (décisions 2 à 4 et 6). Le banc vert.
4. Un commit ; la version et sa note (décisions 5 et 8).
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| le gabarit ne nomme rien sous `apps/` | `scripts/chaine-seule.test.mjs`, test neuf |
| les deux étapes écrivent l'entrée OpenAPI entière | de même |
| les bancs posés passent avec le gabarit sans l'entrée | `scripts/references-posees.test.mjs`, inchangé (joué ici : vert) |
| l'étape 3 garde la phrase du registre des coûts | `scripts/chaine-seule.test.mjs:60`, inchangé |
| les phrases des décisions 2 à 6 | relues dans la PR (texte seul) ; aucun banc de texte n'épingle `README.md:207`, `CONTENU.md:13` ni `pieges.md` |

## Mutations

| Mutation | Rougit |
| --- | --- |
| l'entrée OpenAPI remise dans le gabarit | le test neuf |
| l'entrée OpenAPI retirée de l'étape 3 de `socle-nest-hexagonal` | le test neuf |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test scripts/chaine-seule.test.mjs scripts/references-posees.test.mjs`, verts (le second : quelques minutes).
2. Joué en écrivant ce ticket, sur `3daedcd` : les bancs posés avec le gabarit sans l'entrée (« La cause », 1) ; l'avertissement de commitlint (« La cause », 7).
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus le test neuf), recopié dans la PR.

## Ce qui n'a pas été établi

- **Ce qui a déclenché l'avertissement de commitlint à l'essai** : le commit du dépôt jouet n'a pas été relu d'ici ; le piège dit les deux déclencheurs reproduits.
- Le temps du pre-push sur un projet avec services : le chiffre de l'essai vaut pour un dépôt « chaîne seule » avec un paquet.

## Hors périmètre

- **Le skill `chantier` et une PR de code du conducteur vers `develop` hors socle** (essai, cadrage 1, journal de la carte, 2026-11-22, 17 h 33 UTC : le conducteur a ouvert la PR du paquet seul vers `develop`). `chantier/SKILL.md` § « Ne jamais » interdit au conducteur de coder un ticket, et ne dit rien d'un prérequis de code hors sujet. Le permettre, et sous quelle forme, ou l'interdire et dire qui l'écrit, change le sens d'une règle du rôle : une question à l'architecte, pas tranchée ici. Le texte se poserait sur celui des tickets 104, 102, 100, 108 et 109, qui touchent `chantier/SKILL.md`.
- Raccourcir le pre-push (ne jouer que ce que le diff touche) : un changement du gate, pas une phrase.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur `origin/main` à `3daedcd` (plugin 8.5.0), sur la liste des suites (ticket 91, « Hors périmètre » ; famille documentation) ; les bancs posés joués sans l'entrée OpenAPI, l'avertissement de commitlint reproduit, chaque phrase relue à sa source.
