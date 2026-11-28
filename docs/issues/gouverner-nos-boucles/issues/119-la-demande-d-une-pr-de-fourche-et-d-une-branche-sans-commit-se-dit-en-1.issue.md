# La demande d'une PR de fourche se dit « PR de fourche », et une branche sans commit sort en 1, jamais en 12

Status: ready-for-agent
Type: défaut
Modèle: sonnet — deux messages et une lecture de git dans `demande.mjs`, une phrase de `architecte/SKILL.md` et leurs bancs ; la règle est celle de la fourche déjà écrite (`A-192` (2), `A-201` (2), `A-208`) : une PR de fourche ne reçoit ni verdict ni fusion. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/demande.mjs` (en-tête 11-14 et 21-22 ; `principal` 94-116) ; `skills/chaine/fusionner/scripts/demande.test.mjs` (cas 2, 35-50 ; cas 3, 52-60 ; deux tests neufs après 108) ; `skills/chaine/architecte/SKILL.md` (108) ; `scripts/bascule.test.mjs` (281, et un test neuf) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Une PR pour 119, 120 et 121, dans cet ordre, une seule montée de version** : 120 touche `fusionner/SKILL.md:22`, `sujet/SKILL.md:28`, `README.md:180` et `scripts/bascule.test.mjs:131` ; 121 touche `file.sh`, `sujet.sh`, `boucle.sh` (l'en-tête 51-54 et `vers sujet/`, 517-525), `suites-du-lot-5.test.mjs` et `sujet.test.mjs`. Le ticket 123 (PR seule) touche `boucle.sh:320-347`, le ticket 122 (PR seule) `relecteur/`, `scripts/relecteur.test.mjs` et `scripts/bascule.test.mjs` : la PR qui entre après une autre se remet sur `main`, les deux fichiers de version et `scripts/bascule.test.mjs` en conflit possible. Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

## Le besoin

Deux remarques de relecture, laissées pour une suite (journal de la carte, 2026-11-28).

1. **PR #177** (ticket 104), 05 h 27 UTC : « une PR de fourche fait sortir `--branche` en 1 ». L'architecte demande la relecture d'une PR étrangère au programme par `demande.mjs --branche <tête de la PR> --session — --conducteur —` (`architecte/SKILL.md:108`). La PR d'un tiers vient souvent d'une fourche. Sa tête ne vit pas sur `origin` : le script sort en 1, « la branche <b> est absente d'origin : la demande ne nomme qu'un sommet poussé ». Le message dit un geste faux (pousser) à qui ne peut pas pousser la branche d'un autre. Pire : si la fourche porte une branche du même nom qu'une branche d'`origin`, le script rend le sommet de la branche d'`origin`, celui d'une autre PR.
2. **PR #176** (ticket 101), 03 h 45 UTC : « une branche sans commit sort en 12 plutôt qu'en 1 ». Sur une branche née sans commit (`git switch --orphan`, ou un dépôt neuf), `git rev-parse HEAD` échoue, et le script dit « git ne lit pas HEAD », sortie 12, la panne de `origin`. Rien n'est en panne : il n'y a aucun sommet à relire.

Le besoin : **la demande d'une PR de fourche est refusée par un message qui dit la fourche**, et l'architecte ne la demande pas ; **une branche sans commit sort en 1**, avec sa cause.

## La cause, à la source

Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

1. `skills/chaine/fusionner/scripts/demande.mjs:108-112` : `git ls-remote --exit-code origin refs/heads/<branche>`, sortie 2 de git, puis « la branche ${branche} est absente d'origin : la demande ne nomme qu'un sommet poussé », sortie 1. Le script n'appelle que git, sans aucune dépendance (son en-tête, `:23`) : il ne peut pas savoir qu'une tête est celle d'une PR de fourche. Seul un appel à GitHub (`head.repo.full_name` contre `base.repo.full_name`) le dit. Qu'il n'ait rien à lire de plus est la décision 1 de ce ticket, sur `A-271` (1).
2. `demande.mjs:11-14` (en-tête) : « Avec `--branche`, c'est la tête de cette branche sur `origin` […] l'architecte pour la PR d'une personne ». Rien n'y dit la fourche.
3. `skills/chaine/architecte/SKILL.md:108` : « En régime 8, une PR étrangère au programme se traite de même, mais l'architecte copie la ligne que rend `node scripts/chaine/demande.mjs --branche <tête de la PR> --session — --conducteur —`, puis pose `à-relire` ». La PR étrangère se lit par `pull_request_read` `get` (`:107`, « `<sha>` le `head.sha` lu par `pull_request_read` `get` avant le diff »), qui rend `head.repo` et `base.repo`, mais le texte ne dit pas de les comparer.
4. Une PR de fourche ne reçoit jamais de verdict : le Relecteur la dit « Lecture illisible — PR de fourche » à l'architecte (`relecteur.mjs:220`), le capitaine la saute sans renvoi dans les deux régimes (`passer.sh:152-156`, `sujet.sh:940-942` et `:1289-1292`, `file.sh:163-165`). Une demande sur elle n'ouvre aucun tour.
5. `demande.mjs:101-105` : `git rev-parse HEAD` en échec, « git ne lit pas HEAD », sortie 12. L'en-tête (`:21-22`) réserve 12 à « `origin` illisible ».

## Décisions

Déduites des décisions écrites ; la décision 3 applique `A-271` (1), tranchée par l'architecte.

1. **Pas de lecture de `refs/pull/<n>/head`, ni de GitHub.** Une PR de fourche ne reçoit ni demande ni verdict (`A-271` (1)) : le Relecteur la dit illisible et le capitaine la saute (`A-192` (2), `A-201` (2), `A-208`). Lire la tête de la PR rendrait une demande qui n'ouvre aucun tour ; lire GitHub donnerait au script une dépendance qu'il n'a pas (`demande.mjs:23`). Le côté sûr est le refus, et la fourche se reconnaît chez l'architecte (décision 3).
2. **Le message de la sortie 1, branche absente** (`:108-112`), dit les deux causes possibles, en une ligne : `demande : la branche <b> est absente d'origin : un sommet jamais poussé (le pousser d'abord), ou la tête d'une PR de fourche, qui ne reçoit ni verdict ni fusion (A-192) : aucune demande`. La sortie reste 1 (refus corrigeable par qui lance), jamais une sortie neuve : le script ne sait pas laquelle des deux causes vaut.
3. **L'architecte reconnaît la fourche avant de lancer le script**, par le critère de la chaîne (« fourche reconnue par le même critère partout », carte, 2026-11-22, 18 h 45) : `head.repo.full_name` différent de `base.repo.full_name`, ou `head.repo` nul (dépôt supprimé), lus par `pull_request_read` `get`, qu'il lit déjà pour `head.sha`. Une PR de fourche ne reçoit ni demande ni `à-relire`. Cette lecture couvre aussi la fourche dont la branche porte le nom d'une branche d'`origin`, que le script ne peut pas voir (il rendrait le sommet d'`origin`).
4. **Une branche sans commit** (décidé par l'architecte à la relecture du ticket, le 2026-11-28) : `git rev-parse --verify -q HEAD` à la place de `git rev-parse HEAD` (`:101`), et deux cas selon sa sortie. **Sortie 1** (aucun commit : git le rend ainsi sur une branche `--orphan`, joué) : `demande : la branche <b> n'a aucun commit : rien à relire`, sortie 1. **Toute autre sortie non nulle** (une panne de git, 128) : « git ne lit pas HEAD », sortie 12, comme aujourd'hui. Une branche courante sans commit n'est pas une panne de git ; une panne de git en reste une. Hors d'un dépôt, `symbolic-ref` échoue avant (`:95-98`, « tête détachée », sortie 1) : ce cas ne change pas.
5. **L'en-tête** (`:11-14`, `:21-22`) dit : avec `--branche`, une branche absente d'`origin` est soit non poussée, soit la tête d'une PR de fourche, que le script ne distingue pas ; la sortie 1 compte « une branche sans commit » ; la sortie 12 compte `origin` illisible et git qui ne lit pas `HEAD` sur une branche qui a des commits.
6. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre, une pour la PR de 119 à 121 ; la note dit que `demande.mjs` nomme la fourche et sort en 1 sur une branche sans commit, et que les projets reposent les scripts de la chaîne (`fusionner`, posé sous `scripts/chaine/`) pour en profiter.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/demande.mjs:101-105` | `rev-parse --verify -q HEAD` ; une branche sans commit sort en 1 (décision 4) |
| `skills/chaine/fusionner/scripts/demande.mjs:108-112` | le message de la branche absente (décision 2) |
| `skills/chaine/fusionner/scripts/demande.mjs:11-14`, `:21-22` | l'en-tête (décision 5) |
| `skills/chaine/fusionner/scripts/demande.test.mjs:35-50`, `:52-60` | **change à dessein** : le cas 2 lit en plus « aucune demande » (une chaîne du message neuf), le cas 3 lit le message neuf |
| `skills/chaine/fusionner/scripts/demande.test.mjs`, après 108 | deux tests neufs (« Surfaces ») |
| `skills/chaine/architecte/SKILL.md:108` | la phrase de la fourche ajoutée à la fin de la puce, sur la même ligne (le banc de `:281` lit la puce jusqu'à la fin de ligne) ; texte exact ci-dessous |
| `scripts/bascule.test.mjs:281` | **inchangé** : la commande et `à-relire` restent dans la phrase |
| `scripts/bascule.test.mjs` | un test neuf de texte (« Surfaces ») |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note, que 120 et 121 complètent |

La phrase ajoutée à la fin de `architecte/SKILL.md:108`, à la lettre :

> **Une PR de fourche**, dans les deux régimes (`head.repo.full_name` différent de `base.repo.full_name`, ou `head.repo` nul, lus par `pull_request_read` `get` avant le script), ne reçoit ni demande, ni `à-relire`, ni `à-fusionner` : ni verdict ni fusion ne lui viennent (`A-192`, `A-271`). L'architecte qui en veut le contenu, son diff lu à la source et sans risque, rapatrie sa tête sur une branche d'`origin` (`git fetch origin pull/<n>/head:<branche>`, puis `git push origin <branche>`) et ouvre depuis elle une PR neuve qui cite la première ; elle est relue comme toute PR écrite par une personne (en régime 8, la ligne que rend `node scripts/chaine/demande.mjs --branche <branche> --session — --conducteur —`, puis `à-relire`).

Le test neuf de `scripts/bascule.test.mjs` lit `entre(arch, "- **En régime 8**, une PR étrangère", "\n")` (la puce de `:281`) et y exige, chacune telle quelle : « **Une PR de fourche**, dans les deux régimes », « `head.repo.full_name` différent de `base.repo.full_name`, ou `head.repo` nul », « ne reçoit ni demande, ni `à-relire`, ni `à-fusionner` », « `git fetch origin pull/<n>/head:<branche>`, puis `git push origin <branche>` », « ouvre depuis elle une PR neuve qui cite la première », « elle est relue comme toute PR écrite par une personne » et « `node scripts/chaine/demande.mjs --branche <branche> --session — --conducteur —` » ; et que « **Une PR de fourche** » vienne après « puis pose `à-relire`, jamais `à-fusionner` » (la phrase d'aujourd'hui reste en tête de la puce).

Modèles : `demande.test.mjs:35-50` (cas 2) pour un jouet dont la branche n'est pas poussée ; `suites-du-lot-5.test.mjs:66` pour le nom d'une fourche qui porte celui d'une branche d'`origin` ; `verdict-du-capitaine.test.mjs:464-465` pour une doublure de `git` posée dans `<racine>/bin` du jouet, qui passe tout au vrai git sauf la commande visée.

## À faire, dans l'ordre

1. **Partir de `main`** : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces ») : les deux tests neufs de `demande.test.mjs`, le test neuf de `scripts/bascule.test.mjs`.
3. **`demande.mjs`** (décisions 2, 4, 5), puis **`architecte/SKILL.md:108`** (décision 3, `A-271` (1)). Les bancs verts.
4. Un commit ; **la version** et sa note.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `--branche feat/fourche`, absente d'`origin` : sortie 1, le message nomme « la tête d'une PR de fourche » et « aucune demande », rien sur la sortie standard | `demande.test.mjs`, test neuf |
| une branche courante née sans commit (`git switch -q --orphan feat/vide` dans le jouet poussé) : sortie 1, « n'a aucun commit », jamais 12 ; `origin` illisible garde sa sortie 12 (cas 6 inchangé) | `demande.test.mjs`, test neuf |
| git en panne à la lecture de `HEAD` : une doublure de `git` dans `<racine>/bin` qui sort en 128 (« fatal: … ») sur `rev-parse --verify -q HEAD` et passe le reste au vrai git ; sur la branche poussée du jouet : sortie 12, « git ne lit pas HEAD », jamais 1. (Un dossier hors dépôt ne l'atteint pas : `symbolic-ref` y sort avant, en 1, « tête détachée ».) | `demande.test.mjs`, le même test neuf |
| sans `--branche`, une branche locale jamais poussée : sortie 1, le même message neuf (cas 2, qui exige `absente d'origin` et « aucune demande ») | `demande.test.mjs:35-50`, à dessein |
| `architecte/SKILL.md`, la puce « En régime 8, une PR étrangère » : les sept chaînes exactes ci-dessus (« Où »), après la phrase d'aujourd'hui ; la commande `--branche <tête de la PR> --session — --conducteur —` toujours là (`:281`) | `scripts/bascule.test.mjs`, test neuf |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| l'ancien message de la branche absente | le test neuf de la fourche |
| `git rev-parse HEAD` remis (sans `--verify -q`) | le test de la branche sans commit : sur `--orphan`, `rev-parse HEAD` sort en 128, lu comme une panne, sortie 12 au lieu de 1 |
| toute sortie non nulle de `rev-parse --verify -q HEAD` lue « aucun commit » | le test neuf, la doublure de git (sortie 1 au lieu de 12) |
| la branche sans commit sortie en 12 avec le message neuf | le test de la branche sans commit |
| la phrase de la fourche retirée de `architecte/SKILL.md`, ou mise à la ligne suivante | le test neuf de `scripts/bascule.test.mjs` |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test skills/chaine/fusionner/scripts/demande.test.mjs scripts/bascule.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH`, une fois la PR de 119 à 121 complète (ticket 121, « Vérification »).

## Ce qui n'a pas été établi

- Le nombre de PR étrangères qui viennent d'une fourche dans les dépôts de la chaîne : la remarque de la PR #177 est un cas lu à la source, pas un relevé.

## Hors périmètre

- Une option `--pr <n>` qui lirait GitHub : non retenue, le script n'a aucune dépendance (`demande.mjs:23`) et une fourche ne reçoit ni demande ni verdict (`A-271` (1)) : rien à lire.
- La fourche dans le capitaine, le Relecteur et `regrouper` : déjà gardée, sauf `regrouper` (ticket 121).
- L'ADR du socle (`ADR_ALL_ARC-N-relecture-independante.md:14`), qui écrit la forme de la demande : c'est la décision, pas un geste ; inchangée.

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `b5c7ac3` (plugin 8.9.5), sur les remarques de relecture des PR #176 et #177. Chaque ligne citée a été relue à ce sommet. `Status: ready-for-agent` ; la question 1 attend l'architecte.
- 2026-11-28 — Question de l'architecte tranchée sur la recommandation du rédacteur : le geste d'`A-271` (1) ; la section « Questions à l'architecte » est retirée.
- 2026-11-28 — Relu (agent neuf) ; écarts corrigés : la décision 4 distingue la sortie 1 de `rev-parse --verify -q` (aucun commit) d'une panne de git (12), avec sa surface et deux mutations qui rougissent ; la phrase exacte de `architecte/SKILL.md:108` et les chaînes qu'exige le banc ; `sujet.test.mjs` et `boucle.sh:51-54` dans les fichiers chauds de 121 ; la lecture de GitHub écartée sur `demande.mjs:23` et `A-271` (1), plus sur `A-234`.
- 2026-11-28 — Second tour de relecture : le cas 2 de `demande.test.mjs` lit une chaîne du message neuf (« aucune demande »), pour que la surface « le même message » soit tenue (corrigé par l'architecte).
