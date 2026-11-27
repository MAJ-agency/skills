# Le capitaine contrôle le verdict avant d'attendre la CI : une PR au verdict périmé est renvoyée dès qu'il la voit

Status: needs-triage
Type: défaut
Modèle: opus — une option de lecture seule dans `passer.sh` et dans `sujet.sh fusionner`, qui s'arrêtent avant le verrou, un geste de plus dans `boucle.sh` (PR « CI en cours », et avant la relance d'une CI rouge), une ligne de sonde de plus dans `veille.sh`, et leurs bancs ; l'interface et les sorties sont fixées par la décision `A-243`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 101
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/passer.sh` (en-tête 1-70 ; éligibilité et premier contrôle 187-236 ; verrou 238-245) ; `skills/chaine/sujet/scripts/sujet.sh` (en-tête de `fusionner`, 17-26 ; `fusionner` 914-997) ; `skills/chaine/fusionner/scripts/boucle.sh` (`traiter_rouges` 279-298 ; `traiter_sujets` 385-540, le `case "$etat"` 453-538) ; `skills/chaine/fusionner/scripts/veille.sh` (en-tête 3-7 ; `etat_file` 286-300) ; `skills/chaine/fusionner/SKILL.md` (« Le verdict », 27-29 ; la veille, 88) et `references/CONTENU.md` ; `skills/chaine/sujet/SKILL.md` (36) ; `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` et `veille.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 106 et 107, en premier** : 106 touche `renvoyer.sh` et la section « Renvoyer une PR » de `SKILL.md` (112-115), 107 `github.sh`, `boucle.sh` (au démarrage, avant la ligne 574) et `CONTENU.md`. Le ticket 94 ajoute un test à `verdict-du-capitaine.test.mjs`, le ticket 101 touche `SKILL.md:16` et `github.sh` : d'où `Blocked by: 101` (101 attend 96, qui attend 94 et 95). Le ticket 109 touche aussi `sujet.sh` (`livrer`, `carte_sujet`), dans une autre PR : la seconde à entrer relit `sujet.sh` sur `main`. Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 104 : relire chaque ligne citée sur la branche.

## Le besoin

Constat (3) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 18 h 12 et 18 h 42 UTC, cas 4 bis ; entrée « Fin de l'essai réel du régime 8 »). Sur la PR #10 du jouet, une sous-PR du sujet, la session a poussé un commit après un verdict validé. Le Relecteur était en panne simulée : `à-fusionner` est restée posée sur un verdict d'un sommet plus ancien. Le capitaine a été relancé à 17:59. Sa boucle a vu #10 « CI en cours », lui a laissé tenir le sujet, et n'a rien fait d'autre. Le renvoi (« aucun tour de relecture validé pour le contenu de ce sommet ») n'est venu qu'à 18:35, une fois la CI verte. Pendant ces 36 minutes, #10 tenait son sujet, et aucune autre sous-PR du sujet ne pouvait entrer.

Le contrôle du verdict ne coûte qu'une lecture des commentaires de la PR, sans CI. Le besoin : **le capitaine contrôle le verdict d'une PR dès qu'il la voit dans sa file, avant d'attendre sa CI**, et la renvoie aussitôt si aucun tour validé ne couvre son sommet. Rien ne change en régime 7.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/fusionner/scripts/file.sh:14` et `:122-131` : une PR dont un check exigé n'a pas conclu se lit « CI en cours », sous-PR comprise (« sujet/<nom> : CI en cours »).
2. `skills/chaine/fusionner/scripts/boucle.sh:592` : la boucle ne prend que les PR vers develop dont l'état commence par « prête ». Une PR « CI en cours » n'est jamais présentée à `passer.sh`.
3. `boucle.sh:441-451` : une sous-PR « CI en cours » tient son sujet. Le `case "$etat"` de `:453-538` n'a aucune branche pour cet état : aucun geste, et la ligne `:539` écrit « tenu par #n (CI en cours) ». `sujet.sh fusionner` n'est lancé que sur « prête » (`:505-507`).
4. Le premier contrôle du verdict existe, mais il ne joue qu'au passage. `passer.sh:187-218` (`revue_du_capitaine`, régime 8) le place « avant toute mise à jour et toute CI » d'un passage. `sujet.sh:944-973` le place de même dans `fusionner`. Les deux ne sont appelés que sur une PR « prête ».
5. `boucle.sh:279-298` (`traiter_rouges`) : une PR « CI rouge » voit ses jobs relancés une fois, puis elle est renvoyée pour sa CI. Son verdict n'est pas lu : une PR rouge sans tour validé coûte une relance de CI, puis un renvoi qui ne dit pas qu'il manque le verdict.
6. `skills/chaine/fusionner/scripts/veille.sh:7` et `:286-300` (`etat_file`) : la sonde n'écrit que les lignes « rouge », « sans-ci » et « prête ». Une PR qui passe en « CI en cours » ne relance pas la boucle. `SKILL.md:88` le dit : « « CI en cours », « attend », « bloquée » et brouillon ne relancent rien d'eux-mêmes ». Le banc `veille.test.mjs:140` le tient (« PR seulement « CI en cours » : pas de relance »).

## Décisions

Décidée le 2026-11-27 par l'architecte : **`A-243`** (il la versera à la spec `relecture-independante.spec.md`). Ce qui suit l'applique ; rien n'y est à trancher.

1. **`passer.sh --eligibilite <n>`** joue tout ce qui précède le verrou du passage (`passer.sh:1-236` : la PR lue, le fetch, la revue selon le régime, la garde des fichiers sensibles, les liens sur un index, l'ordre des migrations), puis sort, **sans verrou, sans commentaire, sans label, sans push**. Ses sorties sont celles de `passer.sh` à ces étapes : 0 éligible, 4 refus que l'auteur corrige (dernière ligne, le motif), 7 sautée, 5 illisible, 3 panne. **En régime 7, elle sort en 0 sans rien juger** : la section de revue continue de se lire au seul passage, comme aujourd'hui. Une livraison de sujet sort en 0, comme au passage (elle est dispensée de la revue, `passer.sh:194`).
2. **`sujet.sh fusionner --eligibilite <pr>`** de même : tout ce qui précède `verrouiller` (`sujet.sh:914-996`), puis sortie, sans verrou ni écriture ; mêmes codes que `fusionner` à ces étapes (4, 7, 5, 11) ; en régime 7, sortie 0 sans rien juger (`REGIME`, lu par `revue_du_capitaine`, vaut 7). `CAPITAINE_ID` n'est pas exigé : rien ne se signe.
3. **La boucle** joue l'éligibilité de chaque PR « CI en cours » de sa file, vers develop ou vers un sujet, **une fois par sommet**. Elle garde les paires « numéro sommet » déjà jouées dans `<git-common-dir>/boucle-eligibles`, comme `TENUS` (`boucle.sh:350`). Sortie 4 : renvoi par `refus.sh`, avec le motif ; la sous-PR rend son sujet (`tenus`, comme une sortie 4 de `fusionner`, `boucle.sh:534-536`). Sorties 0, 5, 7, 11 ou 3 : rien de plus, la ligne de la boucle dit la sortie (`[#n] éligibilité avant la CI : sortie <k>`), et le sommet n'est pas noté joué sur 5, 3 ou 11 (il se rejoue au tour suivant). La ligne d'un renvoi commence par `[#n] RENVOI` (`renvoyer.sh:65`) : la veille la lit déjà (`veille.sh:268`).
4. **Avant de relancer une CI rouge** (`traiter_rouges`), la boucle joue la même éligibilité. Sortie 4 : renvoi par `refus.sh` avec ce motif, sans relance.
5. **La veille** ajoute à sa sonde la ligne « n en-cours » pour chaque PR « CI en cours », **si la clé `relecture` est sur `origin/develop` ou sur un `origin/sujet/*`** (`cle_relecture_sur`, lecture locale, comme `renvoyer.sh:24-28` ; `veille.sh` source `github.sh` pour cela). Une PR qui entre en « CI en cours » relance ainsi la boucle une fois, à la règle de toute ligne neuve (`veille.sh:326-329`). Sans la clé, la sonde est celle d'aujourd'hui : le régime 7 ne change pas.
6. **Ce que la boucle ne voit pas** : un second push pendant la CI laisse la ligne « n en-cours » inchangée ; ce sommet se juge au lancement suivant de la boucle, quelle qu'en soit la raison, ou à son passage. Le second contrôle (`passer.sh` 5 ter, `verdict_avant_fusion` de `sujet.sh`) reste ce qu'il est.
7. **Les textes** : `fusionner/SKILL.md:27-29` (« Le verdict ») dit que le premier contrôle se joue aussi dès la file, pour une PR « CI en cours » et avant la relance d'une CI rouge, une fois par sommet ; `:88` dit que « CI en cours » relance la boucle une fois en régime 8 ; `references/CONTENU.md`, la raison d'`A-243` en deux phrases (le cas 4 bis, 36 minutes de sujet tenu). L'en-tête de `passer.sh` et celui de `sujet.sh` (`fusionner`) décrivent l'option.
8. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre, avec 106 et 107 dans la même PR ; la note dit ce qui change en régime 8 seul, et que les projets reposent les scripts de la chaîne (`fusionner poser`, `sujet poser`).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/passer.sh:1-70` | l'en-tête : l'option, ses sorties (décision 1) |
| `skills/chaine/fusionner/scripts/passer.sh:236-245` | la sortie de `--eligibilite`, après l'ordre des migrations (`:236`) et avant la trappe du verrou (`:245`) |
| `skills/chaine/sujet/scripts/sujet.sh:17-26` et `:914-996` | l'option de `fusionner`, sa sortie juste avant `verrouiller` (`:997`), `CAPITAINE_ID` non exigé avec elle (`:917-918`) |
| `skills/chaine/fusionner/scripts/boucle.sh:279-298` | `traiter_rouges` : l'éligibilité avant la relance (décision 4) |
| `skills/chaine/fusionner/scripts/boucle.sh:453-538` | une branche « CI en cours » (`sujet/*' : CI en cours'`, et la PR vers develop « CI en cours » lue dans la même liste) ; la mémoire `boucle-eligibles` |
| `skills/chaine/fusionner/scripts/veille.sh:3-7`, `:286-300` | la ligne « en-cours », sous la clé (décision 5) ; l'en-tête |
| `skills/chaine/fusionner/SKILL.md:27-29`, `:88` | décision 7 |
| `skills/chaine/fusionner/references/CONTENU.md` | la raison d'`A-243` |
| `skills/chaine/sujet/SKILL.md:36` | l'option de `fusionner` parmi les sorties |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | les tests neufs (« Surfaces ») |
| `skills/chaine/fusionner/scripts/veille.test.mjs` | un test neuf ; **`:140` ne change pas** (jouet sans clé : pas de relance) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèles à imiter : `verdict-du-capitaine.test.mjs:56` (« sans verdict, renvoyée en sortie 4 avant toute mise à jour et toute CI ») et `:204` pour `sujet.sh fusionner` ; `:273` pour la boucle sur les calculs de develop ; `veille.test.mjs:140` et `:179` pour la sonde.

## À faire, dans l'ordre

1. **Partir de `main`**, 101 entré : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** : les tests de « Surfaces ». Les voir rouges.
3. **`passer.sh --eligibilite`**, puis **`sujet.sh fusionner --eligibilite`** (décisions 1 et 2).
4. **La boucle** (décisions 3 et 4), puis **la veille** (décision 5).
5. **Les textes** (décision 7). Les bancs verts.
6. **La version** et sa note, dans la PR de 105 à 107 ; un commit par ticket.
7. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `passer.sh --eligibilite`, régime 8 : sans tour validé pour le sommet, sortie 4, motif en dernière ligne ; validé, 0 ; aucun commentaire, label, push ni verrou écrit (le faux GitHub n'a reçu aucune écriture) | `verdict-du-capitaine.test.mjs`, test neuf |
| `passer.sh --eligibilite`, régime 7 : sortie 0 sans section de revue, rien de lu au-delà de la PR | test neuf |
| `sujet.sh fusionner --eligibilite`, régime 8 : sous-PR sans tour validé, sortie 4 ; sans `CAPITAINE_ID`, rien de refusé ; aucune écriture | test neuf |
| la boucle, régime 8 : une sous-PR « CI en cours » au verdict périmé est renvoyée au premier tour (`fusion-bloquée`, `à-fusionner` retirée), sans attendre la CI ; l'autre sous-PR du sujet entre au même tour | test neuf, sur le modèle de `:273` |
| la boucle : le même sommet n'est joué qu'une fois (un second tour ne relit pas les commentaires) ; un sommet neuf l'est | test neuf (compte des lectures de `issues/<n>/comments` du faux GitHub) |
| la boucle, régime 8 : une PR « CI rouge » sans tour validé est renvoyée pour son verdict, sans relance de ses jobs | test neuf |
| la boucle, régime 7 : une PR « CI en cours » sans section de revue n'est ni renvoyée ni lue ; une CI rouge est relancée comme avant | test neuf |
| la veille, clé `relecture` sur develop : une PR qui passe en « CI en cours » relance la boucle une fois ; sans la clé, aucune relance | `veille.test.mjs`, test neuf ; `:140` inchangé et vert |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `--eligibilite` qui ne sort pas avant le verrou (le passage continue) | le test « aucune écriture » de `passer.sh` |
| `--eligibilite` qui juge la section de revue en régime 7 | le test du régime 7 |
| la branche « CI en cours » retirée de la boucle | le test de la sous-PR renvoyée au premier tour |
| la mémoire `boucle-eligibles` ignorée | le test « une fois par sommet » |
| la mémoire qui note un sommet sorti en 5 | un cas du test « une fois par sommet » (5 puis 0 au tour suivant) |
| l'éligibilité retirée de `traiter_rouges` | le test de la CI rouge |
| la ligne « en-cours » de la sonde écrite sans la clé | le test de la veille sans clé |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs skills/chaine/sujet/scripts/sujet.test.mjs skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus les tests neufs), recopié dans la PR.

## Ce qui n'a pas été établi

- La charge d'une boucle relancée à chaque PR qui entre en « CI en cours » sur un dépôt actif. Elle n'a pas été mesurée ; elle ne coûte que des lectures GitHub et le temps de la machine du capitaine, aucune session.
- Que le Relecteur, vivant, retire toujours `à-fusionner` avant que la boucle ne joue l'éligibilité. Les deux contrôles se recouvrent alors ; l'éligibilité sortirait en 7 (PR sans label). Cela n'a pas été joué.

## Hors périmètre

- Le second contrôle, juste avant la fusion : inchangé.
- La cadence de la veille du Relecteur (ticket 98).
