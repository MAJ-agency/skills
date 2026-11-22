# Contre-relecture de la PR 152 (tickets 78 et 79), tour 3 — sommet `d1e2854`

**Verdict : conforme** au sommet `d1e285485e9b7c8477aafe3bf84c6cfe8be6017b`. Aucun bloquant, aucun à corriger ; trois
mineurs, dont un avec sa retouche essayée (`retouches/retouche-152-tour-3.patch`) ; un constat hors du delta pour la liste
des suites.

Relu sur un clone neuf de `https://github.com/MAJ-agency/skills`, limité au delta `8cd21e5..d1e2854` (un commit, la retouche
du tour 2, cinq fichiers) et à ce qu'il fait au reste ; `A-208` et le rapport du tour 2 lus sur
`claude/hopeful-lovelace-ouk6tz`. Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge de 1,3 à
6,3, notée aux bords de chaque passe). Lecture seule : rien de poussé, aucun commentaire, aucune étiquette.

**Le delta est le patch du tour 2** : `contre-relecture-8cd21e5/retouches/retouche-152-tour-2.patch` (sha256 `030b559a…`,
celui de son `SHA256SUMS`) appliqué sur `8cd21e5` donne un arbre identique à `d1e2854` (`git diff d1e2854` vide). Un
relecteur neuf relit donc la retouche d'un autre relecteur : ce rapport ne s'appuie sur aucun relevé du tour 2, il les
rejoue.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | mineur | La note 8.0.1 dit une PR de fourche « sautée … sans renvoi », et sa sous-PR jamais relancée ; elle ne dit pas qu'une PR de fourche vers `develop` est encore relancée puis renvoyée, ou reciblée dans un sujet (la suite de `A-208`) |
| 2 | mineur | Le corps de la PR donne encore `# tests 114` au § 2 du ticket 78 ; le même bloc joue 118 tests au sommet, 118 verts |
| 3 | mineur | Le bras neuf `sujet/*' : fourche'` de `boucle.sh` prend aussi « sujet/<nom> : CI rouge : fourche » (un check exigé nommé `fourche`) : une ligne de journal fausse, rien d'autre ; la même faiblesse que les bras existants |
| H | hors delta | `sujet.sh regrouper` recible dans un sujet une PR de fourche vers `develop` dont le titre cite un ticket du sujet ; elle y reste ouverte, comptée par `sujet.sh etat` : pour la suite de `A-208`, l'état « fourche » vers `develop` doit précéder « vers sujet/<nom> » |

## Les cinq questions

1. **Comment `file.sh` reconnaît une fourche.** `fourche: ((.head.repo.full_name // "") != (.base.repo.full_name // ""))`,
   lu sur la liste des PR ouvertes qu'il lit déjà (`file.sh`, ligne 73) : le même critère, au caractère près, que la garde de
   `passer.sh` (ligne 134), celles de `sujet.sh fusionner` et `relancer` (lignes 923 et 1267) et le Relecteur
   (`relecteur.mjs`, ligne 185) ; aucune lecture de plus.
   - *Une PR du dépôt prise pour une fourche ?* Non sur GitHub : la tête et la base d'une PR du dépôt portent le même objet
     de dépôt, donc le même `full_name`, renommage ou transfert compris. Une liste sans aucun champ `repo` (un `gh` de banc
     plus ancien) donne `"" = ""`, une PR du dépôt : joué, `essais/file-avant-apres.txt`, « liste sans champ repo »,
     identique à `8cd21e5`. Seule une liste qui aurait `base.repo` sans `head.repo` ferait de chaque PR une fourche, ce que
     GitHub ne rend pas ; T6 (le défaut `"?"` d'un côté) est rouge par cet essai, vert par les bancs de la PR (le faux
     GitHub pose toujours les deux champs).
   - *Une fourche prise pour une PR du dépôt ?* Non : son `head.repo` est un autre dépôt, ou nul pour une fourche supprimée,
     `"" != "maj/jouet"` ; R3 (la tête sans dépôt prise pour une tête du dépôt) est rouge par le banc `file.sh`.
   - *La liste et la lecture d'une PR en désaccord* : `fourche_sautee` reste en défense, joué par les cas « garde seule »
     (P1 à P4 rouges). Elle ne joue que pour une sous-PR « prête », « sans CI » ou « en conflit » : une fourche que la liste
     dirait du dépôt et dont la CI tourne tiendrait encore son sujet, et le commentaire de `boucle.sh` (« rend de même le
     sujet dans le tour ») est plus large que cela. Ce cas n'a pas de chemin réel (les deux lectures rendent le même champ de
     la même PR) : rien à corriger.
2. **Une PR de fourche vers `develop`** : son traitement ne change pas, comme `A-208` le veut (la suite).
   - Par `file.sh` (`essais/file-avant-apres.txt`, cas 1) : huit PR de fourche hors des sujets, vers `develop` ou empilée (prête,
     rouge, CI en cours, sans CI, tête sans dépôt et rouge, « vers sujet/lot », « attend #10 », brouillon), même ligne avant et après, dans les
     trois lectures de la liste.
   - Par la boucle (`essais/fourche-vers-develop.txt`, les deux régimes, les scripts de chaque sommet publiés sur le develop
     d'un dépôt jouet) : CI rouge à la première tentative, `[#80] RELANCE des jobs rouges` ; à la seconde,
     `[#80] RENVOI : CI rouge sur le sommet de la PR, aussi à la relance`, `à-fusionner` retiré, `fusion-bloquée` posé, un
     commentaire ; un titre qui cite un ticket de `sujet/lot`, `[#80] REGROUPÉE dans sujet/lot`. Lignes, écritures, base et
     étiquettes identiques avant et après ; 6 sur 6.
   - Aucun banc de la PR ne tient ce traitement : T1 (`file.sh` donne « fourche » à toute PR de fourche, vers `develop`
     comprise) est vert par `suites-du-lot-5.test.mjs`, rouge par mon essai seul. C'est la suite de `A-208` qui le changera ;
     pas un défaut de ce delta.
3. **Le régime 7 hors fourche est inchangé.**
   - `file.sh` (`essais/file-avant-apres.txt`, cas 1) : le `file.sh` de `8cd21e5` et celui de `d1e2854`, chacun avec le
     `github.sh` et le `sujet.sh` de son arbre (identiques aux deux sommets), sur le même dépôt jouet au régime 7 : une file de
     33 PR étiquetées `à-fusionner` et une sans étiquette, qui couvre chaque état de l'en-tête hors « fourche » (prête, sans CI, en conflit,
     CI en cours, CI rouge, `prio:haute`, brouillon, bloquée, humain, attend #N, à recibler, à recibler sur un sujet,
     livraison, vers sujet, `hors-sujet`, sujet livré en 4e colonne, sous-PR prête, sans CI, en conflit, CI en cours, CI rouge,
     brouillon, bloquée, humain, gelée). Tableau, `--next`, `--rouges` : sortie, sortie d'erreur, code et liste des 75 appels
     `gh`, identiques, dans les trois lectures de la liste.
   - `boucle.sh` : le delta n'ajoute qu'un bras, qui ne prend qu'un état finissant par « : fourche », que `file.sh` n'écrit
     que pour une sous-PR de fourche (hors le mineur 3) ; et un commentaire. `veille.sh`, `traiter_rouges`, la boucle
     principale et `FILE VIDE` lisent la file par `/CI rouge/`, `/sans CI/`, `/prête/`, `/^prête/`, `/CI rouge : /` et
     `/CI en cours$/` : « sujet/<nom> : fourche » n'en prend aucun.
   - Avec des sous-PR de fourche (cas 2) : seules leurs lignes changent, la sous-PR de fourche rouge sort de `--rouges`, et
     `file.sh` lit moins (88 appels `gh` avant, 79 après, pour quatre fourches : ni checks ni `pulls/<n>` pour elles).
   - Les bancs de `file.sh` et de la boucle sur `d1e2854` : question 5.
4. **Les mutations**, chacune seule, le fichier remis après, l'arbre propre après chaque série :
   - celles du tour 2 sur `d1e2854` : R1, R2, R3 (`mutations/retouche-R1-R3-sur-d1e2854.txt`), Q1 à Q4 et Q6 avec
     `BANCS_BS=1` (`mutations/tour-2-Q-sur-d1e2854.txt`), P1 à P4 du tour 1 (`mutations/tour-1-P-sur-d1e2854.txt`) : 12 rouges
     sur 12, chacune par les assertions du cas qu'elle vise ;
   - les miennes (`mutations/mutations-tour-3.mjs`, `mutations/tour-3-T-sur-d1e2854.txt`) : 6 rouges sur 6 (18:30 → 18:40 UTC, charge 4,0 puis 4,9) :
     T2 (la sous-PR « fourche » rangée avec les états en route : elle tient son sujet), T3 (une fourche à la CI rouge reste
     « CI rouge »), T4 (une fourche dont la CI tourne reste « CI en cours » : le constat du tour 2) et T5 (la fourche nommée,
     puis renvoyée) par les bancs de la PR ; T1 (toute PR de fourche, vers `develop` comprise, lue « fourche ») et T6 (le
     défaut `"?"` pour une tête sans champ `repo`) par mon essai `essais/file-avant-apres.test.mjs` seul, verts par
     `suites-du-lot-5.test.mjs` (questions 1 et 2).
5. **Les bancs** sur `d1e2854`, arbre propre : `suites-du-lot-5.test.mjs` seul, `# tests 10`, `# pass 10`, `# fail 0`, 104 s
   (`essais/suites-du-lot-5-sur-d1e2854.txt`) ; puis un par un, deux à la fois (`essais/bancs/`) : `une-sous-pr-a-la-fois.test.mjs` 19 sur 19 (520 s),
   `fusionner.test.mjs` 107 sur 107 (398 s), `sujet-fusionner.test.mjs` 60 sur 60, `boucle-outils.test.mjs` 24 sur 24,
   `veille.test.mjs` 41 sur 41, `sensibles-du-capitaine.test.mjs` 10 sur 10, `verdict-du-capitaine.test.mjs` 25 sur 25,
   `chemins-sensibles.test.mjs` 13 sur 13, `faux-gh.test.mjs` 19 sur 19 ; 318 sur 318, aucun échec, aucun délai
   (18:31 → 18:42 UTC, charge 4,5 puis 3,1).
   La CI de GitHub sur `d1e2854` (lue en lecture seule) : verte (`essais/ci-github-d1e2854.txt`) : le job `bancs` (run
   45053523805, 18:10 → 18:24 UTC), « # tests 1409 », « # pass 1409 », « # fail 0 » ; CodeQL, « Analyze (actions) » et
   « Analyze (javascript-typescript) » : `success`.

## Bloquant

Aucun.

## À corriger

Aucun. Le delta ferme `A-208` : une sous-PR de fourche ne tient jamais son sujet, y compris pendant sa CI (le banc de la
boucle, CI « en cours », dans les deux régimes ; R1 et T4 rouges) ; `file.sh` lui donne « sujet/<nom> : fourche », jamais
en route, ni dans `--rouges`, ni dans `--next` (le banc `file.sh` ; T3 rouge) ; `boucle.sh` la nomme sans renvoi (R2, T5
rouges) ; `fourche_sautee` est gardée en défense et sa lecture stricte a son banc (Q1 à Q4, Q6, P1 à P4 rouges) ;
`fusionner/SKILL.md` et la note disent la fourche, `file.sh` est dans « Ce qu'un projet fait ».

## Mineurs

### 1. La note 8.0.1 ne dit pas l'exception d'une PR de fourche vers `develop`

**Fichier** : `NOTES-DE-VERSION.md`, ligne 9. Son titre dit « Une PR de fourche est sautée par le capitaine », ses gestes
« sans renvoi », et le delta y ajoute, pour une sous-PR, « sans la mettre à jour, la renvoyer ni relancer ses jobs rouges ».
Un architecte qui la lit pour reposer les scripts croit le capitaine muet sur toute fourche. Or une PR de fourche vers
`develop` est encore relancée puis renvoyée (une relance de ses jobs rouges, puis ses étiquettes échangées et un commentaire), ou, quand son titre cite
le ticket d'un sujet, reciblée dans ce sujet avec un commentaire (`essais/fourche-vers-develop.txt`) : c'est la suite de
`A-208`, que la note ne nomme pas.

**Retouche** : `retouches/retouche-152-tour-3.patch` (sha256 `0b294ab1…`, `retouches/SHA256SUMS`), `git apply` sur
`d1e2854`, une phrase en fin de la même ligne : « Une PR de fourche vers `develop` n'a pas encore d'état à part (`A-208`, à
la liste des suites) : sa CI rouge est encore relancée puis la PR renvoyée, et un titre qui cite le ticket d'un sujet la
fait recibler dans ce sujet, où elle reste ouverte sans jamais y entrer. » `git apply --check` sur `d1e2854` : appliqué. Sur
l'arbre retouché, `scripts/depot.test.mjs` et `scripts/relecture.test.mjs` entiers, qui lisent la note : `# tests 108`,
`# pass 108`, `# fail 0` (`retouches/note-avec-la-retouche.txt`).

### 2. Le corps de la PR, § 2 du ticket 78

`A-208` décide « le corps de la PR mis aux comptes du sommet ». Le corps l'est pour la suite (1 409), le `--stat` (13
fichiers) et les bancs de la retouche (29) ; il donne encore, au § 2 du ticket 78, `# tests 114`, `# pass 114`. Le bloc du
§ 2 (`suites-du-lot-5`, `sensibles-du-capitaine`, `verdict-du-capitaine`, `sujet-fusionner`, `chemins-sensibles`) joue au
sommet `# tests 118`, `# pass 118`, `# fail 0` : 10, 10, 25, 60 et 13 (`essais/bancs/`, plus `essais/suites-du-lot-5-sur-d1e2854.txt`). Texte proposé : « Ticket 78, § 1
(avant le code, sur `4afd6e2`) : `# tests 6`, `# pass 1`, `# fail 5` ; § 2, au sommet `d1e2854` : `# tests 118`, `# pass 118`, `# fail 0`. » Le ticket 78
lui-même (branche de documentation : « Où », « Surfaces », § 2 « Attendu : 114 ») décrit toujours `4afd6e2` ; `A-208` ne
l'a pas demandé.

### 3. Le bras neuf prend aussi une sous-PR rouge dont le dernier check rouge s'appelle `fourche`

**Fichier** : `skills/chaine/fusionner/scripts/boucle.sh`, ligne 464. Le motif `sujet/*' : fourche'` prend tout état qui
finit par « : fourche » : « sujet/lot : CI rouge : fourche » (le seul check exigé rouge s'appelle `fourche`) ou « … : CI
rouge : build : fourche » ; joué sur le `case` seul, pas « … : lint, fourche ». La boucle écrit alors `[#<n>] sous-PR de
fourche, sautée (aucun renvoi) : elle ne tient pas sujet/<nom>` pour une sous-PR du dépôt, rien de plus : elle n'était pas en
route, et `traiter_rouges` la relance et la renvoie comme avant. Les bras existants ont la même faiblesse, avec plus d'effet
(un check exigé nommé `prête` ferait prendre la sous-PR rouge pour « prête » et jouer `sujet.sh fusionner`). Aucune
retouche demandée ici ; si l'architecte le veut, à la liste des suites, un bras `sujet/*' : CI rouge : '*) ;;` en tête des
deux `case` de `traiter_sujets`.

## Hors du delta, pour la liste des suites

**`sujet.sh regrouper` n'a pas de garde de fourche.** Une PR de fourche vers `develop` dont le titre (joué) ou la branche (lu) cite
un ticket d'un sujet est lue « vers sujet/<nom> » par `file.sh`, puis reciblée par la boucle : `PATCH pulls/<n>` (base
`sujet/lot`), étiquette `sujet-auto`, et un commentaire qui lui promet un squash « dès que sa CI légère est verte ». Elle
n'y entre jamais (sautée à chaque tour), et `sujet.sh etat` la compte comme sous-PR (sa ligne : `lot`, une sous-PR, `#80`, « en cours ») : le sujet
n'est ni rafraîchi ni livré tant qu'elle est ouverte (`A-201` point 5, déjà noté). Joué avant et après le delta, à
l'identique (`essais/fourche-vers-develop.txt`, « regroupée », les deux régimes) : ce n'est pas ce delta. Pour la suite de
`A-208` : l'état « fourche » d'une PR vers `develop` doit précéder « vers sujet/<nom> » dans `file.sh`, et
`regrouper-series` (lu, non joué) peut lui aussi prendre une fourche dans une série.

## Ce qui a été joué

- **Clone et arbres** : clone neuf, `git fetch origin claude/suites-capitaine claude/hopeful-lovelace-ouk6tz`, `pnpm install
  --frozen-lockfile`. Arbres détachés : `d1e2854` (lecture, bancs), `8cd21e5` (le « avant » des essais), `8cd21e5` + le patch
  du tour 2 (comparé à `d1e2854`, retiré ensuite), trois arbres de mutation à `d1e2854`, un arbre de la retouche.
  `graphify-out/` n'existe pas dans le clone.
- **Le delta contre le patch du tour 2** : identiques.
- **`essais/file-avant-apres.test.mjs`** (`essais/file-avant-apres.txt`, 18:17 → 18:20 UTC, charge 2,2 puis 3,0) : 2 sur 2.
- **`essais/fourche-vers-develop.test.mjs`** (`essais/fourche-vers-develop.txt`, 18:27 → 18:30 UTC, charge 5,9 puis 4,2) : 6
  sur 6. Un premier passage était rouge sur le seul sha de develop d'une ligne `[sujet/lot] … à jour avec develop (<sha>)`
  (deux dépôts jouets, deux horloges) : les sha sont normalisés depuis.
- **Les bancs** : question 5.
- **Les mutations** : question 4.
- **La retouche du mineur 1** : `git apply --check`, les bancs de la note (mineur 1).
- **La CI de GitHub et le corps de la PR** : lus par l'outil GitHub en lecture seule (question 5, mineur 2).

## Ce qui n'a pas été établi

1. **Une vraie fourche sur GitHub** : la liste des PR d'une fourche supprimée (`head.repo` nul) est jouée par le faux GitHub
   et des `gh` de banc, comme aux tours 1 et 2, pas lue sur GitHub.
2. **L'espion des 19 bancs du tour 1** n'est pas rejoué : l'inchangé hors fourche est établi par la comparaison directe de
   `file.sh` (cas 1), par le diff de `boucle.sh` (un bras, un commentaire), et par les bancs de la question 5.
3. **La suite entière** n'est pas rejouée ici (la session : 1 409 sur 1 409 ; la CI de GitHub, question 5).
4. **`regrouper-series` sur une fourche** : lu, non joué.
5. **Le mineur 3** : joué sur le `case` seul, pas par la boucle.
