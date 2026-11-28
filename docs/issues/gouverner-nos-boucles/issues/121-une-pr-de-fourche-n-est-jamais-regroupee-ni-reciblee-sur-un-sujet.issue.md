# Une PR de fourche n'est jamais regroupée ni reciblée sur un sujet : `file.sh`, `series` et `regrouper` la reconnaissent par le même critère que les gardes du capitaine

Status: Fait — PR 185 (`b291d60`, plugin 8.9.8)
Type: défaut
Modèle: sonnet — une condition dans `file.sh`, un filtre dans le `jq` de `series`, une garde dans `regrouper` sur le modèle des trois gardes posées par le ticket 78, un cas de plus dans `boucle.sh`, et leurs bancs sur le faux GitHub (`fourche` y est déjà). La règle est écrite : `A-192` (2), `A-199` (4), `A-201` (2), `A-208`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 120 commité sur la branche
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/file.sh` (en-tête 35-36 ; le sujet du ticket, 133-139 ; `vers sujet/`, 169-170) ; `skills/chaine/sujet/scripts/sujet.sh` (en-tête de `regrouper` 62-64, sorties 117-121 ; `series` 1337-1368, son `jq` 1338-1340 ; `regrouper` 1370-1394 ; `series_a_regrouper` 1403-1423, inchangée) ; `skills/chaine/fusionner/scripts/boucle.sh` (en-tête 51-54 ; `vers sujet/`, 517-525) ; `skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs` (tests neufs après 368) ; `skills/chaine/sujet/scripts/sujet.test.mjs` (après le test de 468-474) ; `NOTES-DE-VERSION.md`. **Dans la PR de 119 à 121, en dernier.** Le ticket 123 (PR seule) touche `boucle.sh:320-347` (`traiter_rouges`), loin de `:517-525` : la seconde PR à entrer se remet sur `main`. Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

## Le besoin

Une suite laissée deux fois. Relecture de la PR 152 (tickets 78 et 79), tour 3, carte du 2026-11-22, 18 h 45 UTC : « Hors delta, à la liste des suites : `sujet.sh regrouper` sans garde de fourche (une fourche vers `develop` qui cite un ticket de sujet y est reciblée et tient le sujet). » Et `A-199` (4) : « `regrouper` qui recible une PR de fourche vers un sujet va à la liste des suites » ; `A-249` la renvoie « au ticket suivant de la famille ».

Le ticket 78 a posé la garde de fourche dans `passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer`, et `A-208` a fait dire « sujet/<nom> : fourche » par `file.sh` à une sous-PR de fourche. Mais une PR de fourche **vers develop** qui cite un ticket déclarant un sujet est dite « vers sujet/<nom> », et la boucle la recible (`PATCH base=sujet/<nom>`, l'étiquette `sujet-auto`, un commentaire). Devenue sous-PR de fourche, elle est sautée à jamais : la PR d'un tiers est déplacée sur une branche où elle n'entrera pas, et `regrouper` a pu ouvrir et rafraîchir un sujet pour elle. Les séries de `regrouper-series` comptent aussi les fourches : trois PR d'une spec, dont une de fourche, ouvrent un sujet.

Le besoin : **une PR de fourche n'est jamais reciblée sur un sujet**, ni par la ligne `Sujet:` de son ticket, ni par une série, ni par un `regrouper` lancé à la main ; la fourche est reconnue par le critère de toutes les autres gardes.

## La cause, à la source

Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

1. `skills/chaine/fusionner/scripts/file.sh:169-170` : `elif [ "$base" = develop ] && [ -n "$sujet_ticket" ] && [ "$hors_sujet" = false ]; then etat="vers sujet/$sujet_ticket"`, sans lire `fourche`, que la liste porte (`:76`, `fourche: ((.head.repo.full_name // "") != (.base.repo.full_name // ""))`) et que la sous-PR lit déjà (`:163-165`). `sujet_ticket` se calcule pour toute PR (`:133-139`), puis sert aussi au sujet livré (`:143`, la 4e colonne, d'où l'étiquette `hors-sujet` posée par la boucle) et au gel (`:153`).
2. `skills/chaine/fusionner/scripts/boucle.sh:517-525` : l'état `vers sujet/*` lance `sujet.sh regrouper <sujet> <n>` ; toute sortie hors 0 et 6 se dit « regroupement dans sujet/<x> impossible (SUJET EN CONFLIT ?) ».
3. `skills/chaine/sujet/scripts/sujet.sh:1370-1394` (`regrouper`) : ouvre le sujet au besoin (`:1376`), le rafraîchit (`:1379`), puis pour chaque PR lit la seule base (`:1382`, `--jq .base.ref`) et, vers develop, `PATCH base=sujet/<nom>` (`:1385`), `sujet-auto` (`:1387`) et un commentaire (`:1388`). Aucune lecture de `head.repo`.
4. `sujet.sh:1337-1368` (`series`) : le `jq` (`:1338-1340`) garde toute PR ouverte hors brouillon et hors `hors-sujet`, fourches comprises ; `series_a_regrouper` (`:1403-1423`) et `regrouper_series` (`:1425-1449`) la reciblent avec la série.
5. Les gardes posées, le modèle : `passer.sh:152-156`, `sujet.sh:940-942` (`fusionner`), `sujet.sh:1289-1292` (`relancer`), toutes `head.repo.full_name // ""` contre `base.repo.full_name // ""`, sortie 7, « PR de fourche (<dépôt ou « dépôt supprimé »>) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi ».

## Décisions

Déduites des décisions écrites ; rien n'y est à trancher.

1. **Le critère, partout le même** (carte, 2026-11-22, 18 h 45 : « fourche reconnue par le même critère partout ») : `(.head.repo.full_name // "") != (.base.repo.full_name // "")`, `head.repo` nul compris (fourche supprimée).
2. **`file.sh`** : le sujet d'un ticket ne se lit que pour une PR qui n'est pas de fourche (`:136`, `if [ -n "$ticket" ] && [ "$fourche" = false ]`). Une PR de fourche vers develop est donc classée comme toute PR vers develop (`ci_de`), puis sautée sans renvoi par `passer.sh` (7) ; elle n'est ni « vers sujet/<nom> », ni gelée par le gel de ce sujet, ni marquée « sujet livré » (aucune étiquette `hors-sujet` posée sur elle). Raison : le sujet que son ticket déclare n'est jamais le sien (`A-201` (2)) ; et rien ne s'écrit sur une fourche que le capitaine ne lit pas.
3. **`series`** : le `jq` (`:1338-1340`) écarte les PR de fourche par le critère 1. Une fourche n'entre dans aucune série, ni « spec », ni « pile », ni « branche » : elle ne compte pas dans les 3 PR d'une spec, et les séries restantes que le capitaine propose ne la nomment pas.
4. **`regrouper`** (défense, comme `fourche_sautee` après `A-208`) : chaque PR est lue d'abord (base et fourche, une lecture par PR), **avant** `ouvrir` et `rafraichir`. Une PR de fourche n'est pas reciblée : `#<n> : PR de fourche (<dépôt ou « dépôt supprimé »>) : sa tête vit hors du dépôt, jamais reciblée sur un sujet`, sur la sortie standard. Les autres PR de la liste sont regroupées ; si toutes sont des fourches, ni le sujet n'est ouvert ni rafraîchi. `regrouper` sort en 7 dès qu'une PR de la liste est une fourche, après les autres (rien à corriger côté auteur, comme les sorties 7 de `fusionner` et `relancer`).
5. **`boucle.sh:521-525`** (décidé par l'architecte à la relecture du ticket, le 2026-11-28) : la sortie 7 de `regrouper` se dit `[#<n>] PR de fourche : jamais reciblée sur sujet/<x> (aucun renvoi)`, jamais « SUJET EN CONFLIT ? ». La boucle n'atteint cette branche que si `file.sh` a dit la PR « vers sujet/<x> » et que `regrouper`, à sa propre lecture, la voit de fourche (décision 4) : défense, comme `fourche_sautee` après `A-208`. Un banc la tient (« Surfaces »), sur le modèle du banc de `fourche_sautee`.
6. **Les en-têtes** : `file.sh:35-36` (« vers sujet/<nom> » : jamais une PR de fourche) ; `sujet.sh:62-64` (`regrouper` ne recible jamais une PR de fourche) et `:117-121` (la sortie 7 de `regrouper`) ; `boucle.sh:51-54` (le regroupement d'office ne compte jamais une PR de fourche).
7. **La version** : celle de la PR de 119 à 121 ; la note dit, pour les deux régimes, qu'une PR de fourche n'est plus reciblée sur un sujet ni comptée dans une série, et que les projets reposent les scripts de `fusionner` et de `sujet`.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/file.sh:136` | décision 2 |
| `skills/chaine/fusionner/scripts/file.sh:35-36` | l'en-tête (décision 6) |
| `skills/chaine/sujet/scripts/sujet.sh:1338-1340` | le filtre de `series` (décision 3) |
| `skills/chaine/sujet/scripts/sujet.sh:1370-1394` | la garde de `regrouper` (décision 4) |
| `skills/chaine/sujet/scripts/sujet.sh:62-64`, `:117-121` | l'en-tête (décision 6) |
| `skills/chaine/fusionner/scripts/boucle.sh:521-525`, `:51-54` | la sortie 7 nommée ; l'en-tête (décisions 5 et 6) |
| `skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs`, après 368 | tests neufs : `file.sh`, la boucle (« Surfaces ») |
| `skills/chaine/sujet/scripts/sujet.test.mjs`, après 474 | tests neufs : `regrouper`, `regrouper-series --dry-run` (« Surfaces ») |
| `sujet.test.mjs:232`, `:257` | **inchangés** : aucune fourche dans leurs séries |
| `NOTES-DE-VERSION.md` | la note de la PR, complétée |

Modèles : `suites-du-lot-5.test.mjs:316-336` (une fourche au faux GitHub, `fourche: "autre/jouet"`, et `sansDepotDansLaListe` pour une fourche supprimée) ; `suites-du-lot-5.test.mjs:227` (un tour de boucle, rien d'écrit sur la fourche : `d.journal()` filtré par `^(issues|pulls)/<n>/`) ; `sujet.test.mjs:232` (`regrouper-series --dry-run`) ; `suites-du-lot-5.test.mjs:268-315` (une doublure de `sujet.sh` dans les scripts que la boucle copie d'`origin/develop` : une commande visée écrit une sortie fixée et sort en 7, le reste passe au vrai, posé à côté en `sujet-vrai.sh`).

## À faire, dans l'ordre

1. Sur la branche de la PR, 120 commité ; relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces »).
3. **`file.sh`**, puis **`series`** et **`regrouper`**, puis **`boucle.sh`**, puis les en-têtes. Les bancs verts.
4. Un commit ; la note complétée.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `file.sh` : une PR de fourche vers develop dont le ticket déclare un sujet ouvert se lit comme une PR directe (son état de CI), jamais « vers sujet/<nom> » ; de même pour une fourche supprimée ; la même PR hors fourche se lit « vers sujet/<nom> » ; une fourche dont le ticket déclare un sujet livré : 4e colonne vide ; un sujet gelé : la fourche n'est pas « gelée » | `suites-du-lot-5.test.mjs`, test neuf |
| `boucle.sh`, un tour, dans les deux régimes : la fourche vers develop qui cite le ticket d'un sujet n'est pas reciblée (sa base reste `develop`), aucune étiquette ni aucun commentaire posés sur elle, aucun `PATCH` de `pulls/<n>` ; la ligne de `passer.sh` dit la fourche sautée | `suites-du-lot-5.test.mjs`, test neuf |
| `regrouper <nom> <fourche> <autre>` : l'autre reciblée, la fourche non, sa ligne « PR de fourche », sortie 7 ; `regrouper <nom2> <fourche>` seul : sortie 7, aucune branche `sujet/<nom2>` créée, aucune écriture | `sujet.test.mjs`, test neuf |
| `boucle.sh` lit la sortie 7 de `regrouper` : une PR #80 hors fourche vers develop qui cite le ticket d'un sujet (`file.sh` la dit « vers sujet/lot ») ; la doublure de `sujet.sh` rend, pour `regrouper lot 80`, la ligne de fourche de la décision 4 et la sortie 7, le reste au vrai `sujet.sh` ; un tour : `[#80] PR de fourche : jamais reciblée sur sujet/lot (aucun renvoi)`, aucun « SUJET EN CONFLIT ? », aucun « REGROUPÉE » | `suites-du-lot-5.test.mjs`, test neuf |
| `regrouper-series --dry-run` : trois PR d'une spec, dont une de fourche, n'annoncent aucune série (deux PR) ; quatre PR d'une autre spec, dont une de fourche, annoncent leur série avec les trois autres seules ; une pile dont la racine est une fourche n'est pas annoncée ; `series` ne nomme pas la fourche | `sujet.test.mjs`, test neuf |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `[ "$fourche" = false ]` retiré de `file.sh:136` | le test de `file.sh` et celui de la boucle |
| le filtre de fourche retiré du `jq` de `series` | le test de `regrouper-series --dry-run` |
| la garde de `regrouper` retirée | le test de `regrouper` |
| la garde de `regrouper` placée après `ouvrir` | le test de `regrouper` (la branche `sujet/<nom2>` créée) |
| `regrouper` qui sort en 0 sur une fourche | le test de `regrouper` |
| dans le `jq` de `series`, la fourche lue sur `.head.ref != .base.ref` au lieu des dépôts | le test neuf de `regrouper-series --dry-run`, et `sujet.test.mjs:232` et `:257` : toute PR vers develop a une tête différente de sa base, toutes se lisent fourches, et plus aucune série n'est annoncée ni regroupée (la série des quatre PR manque) |
| `boucle.sh:521-525` sans le cas 7 (la sortie 7 retombe sur « regroupement dans sujet/<x> impossible (SUJET EN CONFLIT ?) ») | le test neuf de la boucle qui lit la sortie 7 de `regrouper` |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs skills/chaine/sujet/scripts/sujet.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière de la PR de 119 à 121, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` plus `# skipped`. Le relevé part du compte de `main` au départ, plus les tests neufs des trois tickets ; il est recopié dans la PR. La session lit le job `bancs` de sa PR avant de rendre la main (`A-212`).

## Ce qui n'a pas été établi

- Une PR de fourche vers develop dont la CI est rouge : `traiter_rouges` la relance puis la renvoie (`A-201` (5), `A-208`, suites déjà notées). Ce ticket ne change pas ce chemin.

## Hors périmètre

- L'état « fourche » pour une PR de fourche vers develop (`A-208`, liste des suites) : elle reste classée par sa CI, puis sautée par `passer.sh`.
- `sujet.sh etat` qui compte une PR de fourche ouverte vers un sujet (`A-201` (5)).

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `b5c7ac3` (plugin 8.9.5), sur la suite de la relecture de la PR 152 (`A-199` (4), `A-249`). Chaque ligne citée a été relue à ce sommet. `Status: ready-for-agent`.
- 2026-11-28 — Relu (agent neuf) ; écarts corrigés : la mutation du critère sans `// ""` (verte : en jq, `null != "maj/jouet"` est vrai) remplacée par le critère lu sur `head.ref`, qui rougit les bancs de séries ; la ligne de la sortie 7 de `regrouper` dans `boucle.sh` gardée (décision de l'architecte), tenue par un banc de la boucle sur une doublure de `sujet.sh`, avec sa mutation ; une série de quatre PR dont une fourche, pour que le banc des séries lise aussi ce qui est annoncé.
