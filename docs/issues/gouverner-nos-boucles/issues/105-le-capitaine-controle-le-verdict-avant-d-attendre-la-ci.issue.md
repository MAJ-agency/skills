# Le capitaine contrôle le verdict avant d'attendre la CI : une PR au verdict périmé est renvoyée dès qu'il la voit

Status: ready-for-agent
Type: défaut
Modèle: opus — une option de lecture seule dans `passer.sh` et dans `sujet.sh fusionner`, qui lit le régime d'abord et s'arrête avant le verrou ; un geste de plus dans `boucle.sh` (la PR « CI en cours », et avant la relance d'une CI rouge) ; une ligne de sonde de plus dans `veille.sh`, et leurs bancs. L'interface, les sorties et la portée sont fixées par les décisions `A-243` et `A-256` (1) et (2). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 101
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/passer.sh` (en-tête 2-101 ; le régime et le premier contrôle 187-236 ; la trappe du verrou 245) ; `skills/chaine/sujet/scripts/sujet.sh` (en-tête de `fusionner`, 18-28 ; `fusionner` 914-997) ; `skills/chaine/fusionner/scripts/boucle.sh` (`traiter_rouges` 279-298 ; `traiter_sujets` 385-540, le `case "$etat"` 453-538) ; `skills/chaine/fusionner/scripts/veille.sh` (en-tête 3-7 ; `etat_file` 286-300) ; `skills/chaine/fusionner/SKILL.md` (« Le verdict », 27-29 ; la veille, 88) et `references/CONTENU.md` ; `skills/chaine/sujet/SKILL.md` (36) ; `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` et `veille.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 106, en premier** (`A-256` (5)) : 106 touche `renvoyer.sh`, `github.sh` (après 464) et `SKILL.md:104`, `:112-119`. Le ticket 107 vient dans la PR suivante. Le ticket 94 ajoute un test à `verdict-du-capitaine.test.mjs`, le ticket 101 touche `SKILL.md:16` et `github.sh` : d'où `Blocked by: 101` (101 attend 96, qui attend 94 et 95). Le ticket 108 touche `sujet.sh` (`sujet_livre`, `regrouper-series`, `clore`) et 109 (`livrer`, `carte_sujet`), dans une autre PR : la seconde à entrer relit `sujet.sh` sur `main`. Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 104 : relire chaque ligne citée sur la branche.

## Le besoin

Constat (3) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 18 h 12 et 18 h 42 UTC, cas 4 bis ; entrée « Fin de l'essai réel du régime 8 »). Sur la PR #10 du jouet, une sous-PR, la session a poussé un commit après un verdict validé. Le Relecteur était en panne simulée : `à-fusionner` est restée posée sur le verdict d'un sommet plus ancien. Le capitaine a été relancé à 17:59. Sa boucle a vu #10 « CI en cours », l'a laissée tenir le sujet, et n'a rien fait d'autre. Le renvoi (« aucun tour de relecture validé pour le contenu de ce sommet ») n'est venu qu'à 18:35, la CI verte. Pendant ces 36 minutes, aucune autre sous-PR du sujet ne pouvait entrer.

Le contrôle du verdict ne coûte qu'une lecture des commentaires, sans CI. Le besoin : **en régime 8, le capitaine contrôle le verdict d'une PR dès qu'il la voit dans sa file, avant d'attendre sa CI**, et la renvoie aussitôt si aucun tour validé ne couvre son sommet. Rien ne change en régime 7.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/fusionner/scripts/file.sh:14` et `:122-131` : une PR dont un check exigé n'a pas conclu se lit « CI en cours », sous-PR comprise (« sujet/<nom> : CI en cours »).
2. `skills/chaine/fusionner/scripts/boucle.sh:592` : la boucle ne prend que les PR vers develop dont l'état commence par « prête ». Une PR « CI en cours » n'est jamais présentée à `passer.sh`.
3. `boucle.sh:441-451` : une sous-PR « CI en cours » tient son sujet. Le `case "$etat"` de `:453-538` n'a aucune branche pour cet état : aucun geste, et la ligne `:539` écrit « tenu par #n (CI en cours) ». `sujet.sh fusionner` n'est lancé que sur « prête » (`:505-507`).
4. Le premier contrôle du verdict existe, mais il ne joue qu'au passage : `passer.sh:187-218` (`revue_du_capitaine`, régime 8, « avant toute mise à jour et toute CI » d'un passage) et `sujet.sh:944-973` dans `fusionner`. Les deux ne sont appelés que sur une PR « prête ».
5. `boucle.sh:279-298` (`traiter_rouges`) : une PR « CI rouge » voit ses jobs relancés une fois, puis elle est renvoyée pour sa CI. Son verdict n'est pas lu.
6. `skills/chaine/fusionner/scripts/veille.sh:7` et `:286-300` (`etat_file`) : la sonde n'écrit que « rouge », « sans-ci » et « prête ». Une PR qui passe en « CI en cours » ne relance pas la boucle (`SKILL.md:88`). La veille ne source pas `github.sh` : son banc ne copie que `veille.sh` à côté de sa doublure de boucle (`veille.test.mjs:52`).

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-243`** et **`A-256` (1), (2) et (5)** (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`passer.sh --eligibilite <n>`** lit la PR, fait le fetch, puis **lit d'abord le régime** (`regime_de_la_pr` de `github.sh` sur `origin/<base>`, `origin/develop` pour une pile). Régime 7 ou `illisible` : sortie 0, avant tout autre contrôle. Régime 8 : il joue ensuite ce qui précède le verrou (`passer.sh:187-236` : la revue, la garde des fichiers sensibles, les liens sur un index, l'ordre des migrations), puis sort, **sans verrou, sans commentaire, sans label, sans push**. Sorties : 0 éligible, 4 refus que l'auteur corrige (dernière ligne, le motif), 7 sautée, 5 illisible, 3 panne ; 6, 64 et 69 restent ce qu'elles sont dans `passer.sh`. **Une livraison de sujet** est dispensée de la revue (`passer.sh:195`), mais les liens sur un index et l'ordre des migrations se jouent pour elle, comme au passage : sortie 4 possible.
2. **`sujet.sh fusionner --eligibilite <pr>`** de même : la PR lue, le fetch, le régime lu d'abord sur `origin/<base>` (régime 7 ou `illisible` : sortie 0), puis tout ce qui précède `verrouiller` (`sujet.sh:914-996`), puis sortie, sans verrou ni écriture ; mêmes codes que `fusionner` à ces étapes (4, 7, 5, 11, 69). `CAPITAINE_ID` n'est pas exigé avec l'option : rien ne se signe.
3. **La boucle ne joue l'éligibilité que si la clé `relecture` est sur la base** de la PR (`cle_relecture_sur origin/<base>`, lecture locale, comme `renvoyer.sh:24-28`), **une fois par sommet**. Pour une sous-PR, **seule celle qui tient ou prend son sujet** est contrôlée (la règle d'`A-104`, `boucle.sh:441-451`) ; les autres attendent leur tour, sans lecture. Une PR vers develop « CI en cours » est contrôlée.
4. **La mémoire** : `<git-common-dir>/boucle-eligibles`, une ligne « numéro sommet » par contrôle fait, comme `TENUS` (`boucle.sh:350`). Le sommet se lit par `pr_sommet` (`github.sh:518-524`) ; en échec (sortie 5), aucun contrôle à ce tour, rien de noté. Le fichier est réécrit à chaque tour avec les seules PR encore « CI en cours » de la file : une PR sortie de la file en sort aussi.
5. **Les suites** : sortie 4, renvoi par `refus.sh` avec le motif, la sous-PR rend son sujet (comme une sortie 4 de `fusionner`, `boucle.sh:534-536`), le sommet est noté. Sorties 0 et 7 : notées, rien de plus. Sorties 5, 3, 11 : rien de noté, rejouée au tour suivant. Sorties 6, 64 et 69 : dites au journal, sans renvoi, rien de noté. Chaque contrôle écrit une ligne : `[#n] éligibilité avant la CI : sortie <k>` (suivie de la dernière ligne de l'outil sur 4) ; c'est l'observable des bancs. Un renvoi écrit ensuite `[#n] RENVOI` (`renvoyer.sh:65`), que la veille lit déjà (`veille.sh:268`).
6. **Avant de relancer une CI rouge** (`traiter_rouges`), même règle de clé : la PR est lue (`pr_json`) pour choisir l'outil, `passer.sh --eligibilite` vers develop, `sujet.sh fusionner --eligibilite` vers un sujet, chacun lancé avec `</dev/null` (la boucle de `traiter_rouges` lit son entrée standard, `:281`). Sortie 4 : renvoi par `refus.sh` avec ce motif, sans relance. Toute autre sortie : la relance d'aujourd'hui.
7. **La veille** (`A-256` (2)) ajoute à sa sonde la ligne « n en-cours » pour chaque PR « CI en cours », **si la clé `relecture` est sur `origin/develop` ou sur un `origin/sujet/*`**, lue par `git show <réf>:.claude/chaine.json` et `jq -e 'type == "object" and has("relecture")'`, sans sourcer `github.sh`. Une PR qui entre en « CI en cours » relance ainsi la boucle une fois, à la règle de toute ligne neuve (`veille.sh:326-329`). Sans la clé, la sonde est celle d'aujourd'hui. Un second push pendant la CI laisse la ligne inchangée : ce sommet se juge au lancement suivant de la boucle, ou au passage. Le second contrôle (`passer.sh` 5 ter, `verdict_avant_fusion` de `sujet.sh`) ne change pas.
8. **Les textes** : `fusionner/SKILL.md:27-29` (« Le verdict ») dit le contrôle dès la file, en régime 8, une fois par sommet, pour la PR « CI en cours » qui tient ou prend son sujet et avant la relance d'une CI rouge ; `:88`, que « CI en cours » relance la boucle une fois sous la clé ; `references/CONTENU.md`, la raison d'`A-243` en deux phrases (le cas 4 bis). L'en-tête de `passer.sh` (2-101) et celui de `fusionner` dans `sujet.sh` (18-28) décrivent l'option ; `sujet/SKILL.md:36` la nomme.
9. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre, une pour la PR de 105 et 106 ; la note dit ce qui change en régime 8 seul, et que les projets reposent les scripts de la chaîne (`fusionner poser`, `sujet poser`).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/passer.sh:2-101` | l'en-tête : l'option, ses sorties (décision 1) |
| `skills/chaine/fusionner/scripts/passer.sh:187-245` | le régime lu d'abord sous l'option ; la sortie après l'ordre des migrations (`:236`), avant la trappe du verrou (`:245`) |
| `skills/chaine/sujet/scripts/sujet.sh:18-28`, `:914-996` | l'option de `fusionner`, sa sortie avant `verrouiller` (`:997`), `CAPITAINE_ID` non exigé avec elle (`:917-918`) |
| `skills/chaine/fusionner/scripts/boucle.sh:279-298` | `traiter_rouges` (décision 6) |
| `skills/chaine/fusionner/scripts/boucle.sh:385-540` | l'éligibilité de la PR « CI en cours » qui tient ou prend son sujet, et des PR vers develop « CI en cours » ; la mémoire `boucle-eligibles` (décisions 3 à 5) |
| `skills/chaine/fusionner/scripts/veille.sh:3-7`, `:286-300` | la ligne « en-cours », sous la clé (décision 7) ; l'en-tête |
| `skills/chaine/fusionner/scripts/github.sh:518-524` | **rien** : `pr_sommet` est lu tel quel |
| `skills/chaine/fusionner/SKILL.md:27-29`, `:88`, `references/CONTENU.md` | décision 8 |
| `skills/chaine/sujet/SKILL.md:36` | l'option de `fusionner` |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | les tests neufs (« Surfaces »), à la fin du fichier ; aucun test existant ne change |
| `skills/chaine/fusionner/scripts/veille.test.mjs` | un test neuf ; **`:140` inchangé** (jouet sans clé : « PR seulement « CI en cours » : pas de relance ») ; **`:52` inchangé** (la veille copiée seule, sans `github.sh`) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèles à imiter : `verdict-du-capitaine.test.mjs:56` (« sans verdict, renvoyée en sortie 4 avant toute mise à jour et toute CI ») et `:204` pour `sujet.sh fusionner` ; `:273` pour la boucle sur les calculs de develop ; `veille.test.mjs:140` et `:179` pour la sonde.

## À faire, dans l'ordre

1. **Partir de `main`**, 101 entré : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces »). Les voir rouges.
3. **`passer.sh --eligibilite`**, puis **`sujet.sh fusionner --eligibilite`** (décisions 1 et 2).
4. **La boucle** (décisions 3 à 6), puis **la veille** (décision 7).
5. **Les textes** (décision 8). Les bancs verts.
6. Un commit ; **la version** et sa note, que 106 complète dans la même PR.
7. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `passer.sh --eligibilite`, régime 8 : sans tour validé pour le sommet, sortie 4, motif en dernière ligne ; validé, 0 ; le faux GitHub n'a reçu aucune écriture (commentaire, label, push, verrou) | `verdict-du-capitaine.test.mjs`, test neuf |
| `passer.sh --eligibilite`, régime 7 (sans clé, ou PR ouverte avant `depuis`) et régime `illisible` : sortie 0, aucune lecture des commentaires | test neuf |
| `passer.sh --eligibilite`, livraison de sujet en régime 8 avec une migration plus ancienne que develop : sortie 4 | test neuf |
| `sujet.sh fusionner --eligibilite`, régime 8 : sous-PR sans tour validé, sortie 4 ; sans `CAPITAINE_ID`, rien de refusé ; aucune écriture | test neuf |
| la boucle, régime 8 : la sous-PR « CI en cours » au verdict périmé qui tient le sujet est renvoyée au premier tour (`fusion-bloquée`, `à-fusionner` retirée), la ligne `[#n] éligibilité avant la CI : sortie 4` au journal ; l'autre sous-PR du sujet, qui attendait, n'a aucune ligne d'éligibilité, puis prend le sujet | test neuf, sur le modèle de `:273` |
| la boucle : au second tour, même sommet, aucune ligne `éligibilité avant la CI` pour cette PR ; après un push (sommet neuf), une ligne | test neuf |
| la boucle : `pr_sommet` illisible (panne de `pulls/<n>`) : aucune ligne d'éligibilité, rien de noté ; au tour suivant, la ligne | test neuf |
| la boucle, régime 8 : une PR « CI rouge » sans tour validé est renvoyée pour son verdict, sans relance de ses jobs (aucun `POST …/rerun-failed-jobs` au faux GitHub) | test neuf |
| la boucle, régime 7 : une PR « CI en cours » sans section de revue : aucune ligne d'éligibilité, aucun renvoi ; une CI rouge est relancée comme avant | test neuf |
| la veille, clé `relecture` sur develop : une PR qui passe en « CI en cours » relance la boucle une fois ; sans la clé, aucune relance | `veille.test.mjs`, test neuf ; `:140` et `:52` inchangés et verts |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `--eligibilite` qui ne sort pas avant le verrou (le passage continue) | le test « aucune écriture » de `passer.sh` |
| `--eligibilite` qui juge la revue avant de lire le régime (régime 7) | le test du régime 7 |
| la branche « CI en cours » retirée de la boucle | le test de la sous-PR renvoyée au premier tour |
| toutes les sous-PR « CI en cours » contrôlées, pas seulement celle qui tient le sujet | le test de la sous-PR qui attend |
| la mémoire `boucle-eligibles` ignorée | le test du second tour |
| un sommet illisible noté | le test de `pr_sommet` illisible |
| l'éligibilité retirée de `traiter_rouges` | le test de la CI rouge |
| la ligne « en-cours » de la sonde écrite sans la clé | le test de la veille sans clé |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/sujet/scripts/sujet.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus les tests neufs), recopié dans la PR.

## Ce qui n'a pas été établi

- La charge d'une boucle relancée à chaque PR qui entre en « CI en cours » sur un dépôt actif : non mesurée. Elle ne coûte que des lectures GitHub et le temps de la machine du capitaine, aucune session.
- Que le Relecteur, vivant, retire `à-fusionner` avant que la boucle ne joue l'éligibilité. Les deux contrôles se recouvrent alors ; l'éligibilité sortirait en 7 (PR sans label). Non joué.

## Hors périmètre

- Le second contrôle, juste avant la fusion : inchangé.
- La cadence de la veille du Relecteur (ticket 98).
