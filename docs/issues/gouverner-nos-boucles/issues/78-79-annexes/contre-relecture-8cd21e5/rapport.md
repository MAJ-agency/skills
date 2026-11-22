# Contre-relecture de la PR 152 (tickets 78 et 79), tour 2 — sommet `8cd21e5`

**Verdict : non conforme** au sommet `8cd21e5f978731434d0d47604def845e89378aa0`. Aucun bloquant ; un à corriger, avec sa
retouche essayée ; trois mineurs.

Relu sur un clone neuf de `https://github.com/MAJ-agency/skills`, limité au delta `4afd6e2..8cd21e5` (un commit, la retouche
du tour 1) et à ce qu'il fait au reste ; les décisions et le rapport du tour 1 lus sur `claude/hopeful-lovelace-ouk6tz`
(`A-201`, `contre-relecture-4afd6e2/rapport.md`). Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents
(charge de 13 à 24 pendant tout le relevé, notée aux bords de chaque passe). Lecture seule : rien de poussé, aucun
commentaire, aucune étiquette ; les commits de la retouche sont locaux, sur un arbre détaché.

**Le delta est le patch du tour 1** : `retouche-152-tour-1.patch` (sha256 `3858cda0…`) appliqué sur `4afd6e2` donne un arbre
identique à `8cd21e5` (`git diff --stat 8cd21e5` vide ; `essais/delta-et-patch.txt`). Trois fichiers : `boucle.sh`
(`fourche_sautee`, deux sites, deux lignes), `suites-du-lot-5.test.mjs`, `NOTES-DE-VERSION.md`.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | Une sous-PR de fourche dont la CI tourne tient son sujet, dans les deux régimes : `A-201` point 2 n'est tenu que pour une fourche « prête », « sans CI » ou « en conflit », et la note 8.0.1 comme le commentaire de `boucle.sh` disent le contraire |
| 2 | mineur | La lecture stricte de `fourche_sautee` (la dernière ligne, le motif entier, le numéro ; jamais la lecture illisible) n'est tenue par aucun banc : seul le verrou d'un autre capitaine l'est |
| 3 | mineur | Le corps de la PR et le ticket 78 décrivent `4afd6e2` (6 et 114 tests, 1 405, 10 fichiers) ; `fusionner/SKILL.md` ne dit pas la fourche |
| 4 | mineur | P5 du tour 1 n'a pas été rouge par une assertion sur ce relevé : le banc entier a atteint le délai de 900 s sous la charge ; rejouée sur les cas du verrou (P5ʹ), rouge par ses assertions |

## Les cinq questions

1. **`fourche_sautee` ne reconnaît-elle que la sortie 7 de la garde de fourche ?** Oui, par le code : elle compare la dernière
   ligne non vide de la sortie, entière (le `==` de bash ancre les deux bouts), au motif de `sortir 7` des deux gardes de
   `sujet.sh` (lignes 924 et 1268), le numéro de la PR compris ; seul le dépôt entre parenthèses est libre. Les huit autres
   `sortir 7` de `sujet.sh` (lignes 863, 873, 884, 906, 920, 921, 930, 989) finissent tous par un texte fixe qui n'est pas
   celui-là : le verrou (« … : sautée sans renvoi », `PASSAGE_MOTIF`), la lecture illisible (« … son auteur n'y peut rien (le
   Relecteur prévient l'architecte) »), les chemins sensibles illisibles (« … son auteur n'y peut rien »), le gel, la PR plus
   éligible, fermée, en brouillon. Un titre ou un nom de branche n'est recopié dans aucune de ces lignes, et aucune ne finit
   par un texte de la PR : on ne la trompe pas sans faire écrire à `sujet.sh` une ligne entière qu'il n'écrit pas. Le seul
   chemin restant est un programme de la PR elle-même (un script d'index, un hook) qui écrirait ce motif puis sortirait en 7
   sous `set -e` : c'est une PR hostile qui exécute du code chez le capitaine, hors de ce que la spec ferme (« Ce que cette
   spec ne ferme pas », premier point), et non joué. Par les bancs, c'est moins sûr : mineur 2.
   **Le sujet rendu laisse-t-il l'autre sous-PR entrer au même tour, sans laisser la fourche en boucle ?** Oui pour une
   fourche « prête » ou « sans CI » (le banc, quatre cas ; et une fourche que la mémoire `boucle-tenus` donnait pour tenante,
   rendue de même, `essais/fourche-ci-en-cours-sur-8cd21e5.txt`, E2). Pas de boucle en rond : une sous-PR n'est jamais le `n`
   de la boucle principale (`$2 ~ /^prête/`), la boucle sort sur `FILE VIDE` quand aucune PR vers develop n'est prête, et la
   veille ne relance que sur un changement d'état ; la fourche est relue et redite à chaque tour, une lecture GitHub, rien
   d'écrit. **Non** quand la CI de la fourche tourne : constat 1.
2. **Les bancs neufs sont-ils creux ?** Non pour ce qu'ils visent : X1 à X4 et P1 à P4 rouges sur `8cd21e5`, par les
   assertions attendues (`mutations/tour-1-sur-8cd21e5.txt`) ; mes mutations des deux sites, de leur table et de la garde de
   `relancer` (Q5, Q7 à Q12, P5ʹ) rouges aussi (`mutations/tour-2-sur-8cd21e5.txt`). Ils ne tiennent pas la lecture stricte de `fourche_sautee` (Q1 à Q4, Q6 vertes : mineur 2), ni la fourche « CI en
   cours » (constat 1 : la retouche le joue).
3. **Le régime 7, hors la fourche** : la boucle est inchangée. Le delta n'ajoute que `[ "$rc" != 7 ] || ! fourche_sautee … ||
   rc=fourche` après `relancer` et après `fusionner`, et un bras `fourche)` avant `7)` : sur une sortie autre que 7, rien n'est
   lu ; sur une sortie 7 dont la dernière ligne n'est pas le motif de la garde, `rc` reste 7 et suit la même table qu'à
   `4afd6e2`. Aucun autre fichier de code ne bouge (`passer.sh`, `sujet.sh`, `file.sh`, le hook : ceux de `4afd6e2`, que
   l'espion du tour 1 a comparés à 8.0.0 sur 19 bancs). Les bancs du verrou (sorties 7 qui tiennent) restent rouges sous
   P5ʹ, Q5, Q7, Q8.
4. **La note 8.0.1** : vraie sur M1, M2, le hook, les trois chemins, le régime 7 (relu contre le code : en régime 7, le
   premier contrôle d'une PR de mise à jour ne joue qu'une revue, `prevu` et le régime relu valant 7 ; la garde des chemins
   sensibles de `sujet.sh` et celle du hook ne jouent qu'en régime 8). Fausse sur un point : « Une sous-PR de fourche ne tient
   pas son sujet » ne vaut pas pendant sa CI (constat 1). « Ce qu'un projet fait » est complet pour le delta (`boucle.sh` est
   posé par `fusionner poser`) ; avec la retouche, `file.sh` s'y ajoute.
5. **La CI de GitHub sur `8cd21e5`** : verte (`essais/ci-github-8cd21e5.txt`, lue par l'outil GitHub en lecture seule). Le job
   `bancs` du workflow « CI » (run 45042478966, tentative 1, `head_sha` `8cd21e5…`) : `success`, `pnpm test` de 16:12:14 à
   16:26:34 UTC, « # tests 1407 », « # pass 1407 », « # fail 0 » ; CodeQL, « Analyze (actions) » et « Analyze
   (javascript-typescript) » : `success`. La PR est `blocked` (protection de branche), 11 fichiers contre `main`.

## Bloquant

Aucun.

## À corriger

### 1. Une sous-PR de fourche « CI en cours » tient son sujet

**Fichiers** : `skills/chaine/fusionner/scripts/boucle.sh`, ligne 420 (au début du tour, une sous-PR « CI en cours » prend le
sujet), lignes 440 à 449 (dans la boucle, « CI en cours » le prend aussi et rien ne le rend : aucun `sujet.sh` n'est joué, donc
`fourche_sautee` ne lit rien), ligne 536 (« tenu par #n (CI en cours) ») ; le commentaire des lignes 340 à 342 (« Une sous-PR de
fourche … n'est jamais en route ») ; `NOTES-DE-VERSION.md`, ligne 9 (« Une sous-PR de fourche ne tient pas son sujet (`A-201`) »).
`skills/chaine/fusionner/scripts/file.sh`, ligne 155 : une sous-PR de fourche y reçoit les états de sa CI, comme toute autre.

**Ce que la décision exige** : `A-201` point 2, « Une sous-PR de fourche ne tient pas son sujet … Elle est sautée sans renvoi et
sans tenir son sujet, dans les deux régimes », avec pour raison qu'« une garde qui bloque un sujet entier sur une PR que
n'importe qui peut ouvrir n'est plus une protection ». Le delta classe la fourche sur la sortie 7 de `sujet.sh` ; or la boucle
ne joue `sujet.sh` que pour une sous-PR « prête », « prête (sans CI) » ou « prête (en conflit) ». Une sous-PR dont la CI tourne
est « en route » : elle prend le sujet au début du tour (règle 3 de l'en-tête, avant la plus ancienne) ou dans la boucle, et le
garde jusqu'à la fin de sa CI.

**Le scénario** : une fourche étiquetée `à-fusionner` dans un sujet qui a une autre sous-PR prête, la CI de la fourche en cours
(la CI d'une PR de fourche tourne quand GitHub la lance, après l'approbation d'un premier contributeur ; chaque push de son
auteur la relance).
`essais/fourche-ci-en-cours.test.mjs`, joué sur `8cd21e5` (`essais/fourche-ci-en-cours-sur-8cd21e5.txt`), régimes 8 et 7, mêmes
lignes :

| | tour 1, CI de la fourche en cours | tour 2, sa CI verte |
| --- | --- | --- |
| la boucle | `[sujet/lot] tenu par #80 (CI en cours)` ; `[#81] attend son tour : #80 passe d'abord dans sujet/lot` | `[#80] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas sujet/lot` ; `[#81] FUSIONNÉE dans sujet/lot` |
| fusionnées | aucune | #81 |

Le sujet attend donc la CI d'une PR que le capitaine ne fusionnera jamais ; un auteur de fourche qui pousse en continu le tient
sans fin, jusqu'à ce qu'on lui retire l'étiquette. C'était déjà le cas sur 8.0.0 (pas un recul), mais la PR dit désormais le
contraire : la note, le commentaire de `boucle.sh`, et le nom du banc (« ne tient pas son sujet »).

**La retouche** : `retouches/retouche-152-tour-2.patch` (sha256 `030b559a…`, `retouches/SHA256SUMS`), `git apply` sur
`8cd21e5`, cinq fichiers.

- `file.sh` lit la fourche sur la liste des PR qu'il lit déjà (`head.repo.full_name` contre `base.repo.full_name`, une tête sans
  dépôt comprise, aucune lecture de plus) et donne à une sous-PR de fourche l'état `sujet/<nom> : fourche`, avant sa CI, après
  brouillon, bloquée, gelée et humain ; son en-tête le dit. Cet état n'est pas « en route » (`enroute` de `boucle.sh` ne prend
  que les quatre états de CI) : la fourche ne tient jamais son sujet, ni au début du tour, ni dans la boucle ; elle n'est
  jamais dans `--rouges` (ses jobs rouges ne sont plus relancés, ni la fourche renvoyée, la moitié « sous-PR » de la suite
  `A-201` point 5) ni dans `--next` ; la veille ne la compte ni prête ni rouge.
- `boucle.sh` : un bras `sujet/*' : fourche'` écrit la même ligne que le delta, `[#<n>] sous-PR de fourche, sautée (aucun
  renvoi) : elle ne tient pas sujet/<nom>`. `fourche_sautee` reste, en défense : une fourche que seule la garde de `sujet.sh`
  verrait. Le commentaire d'en-tête le dit.
- Le banc : le cas de la boucle joue la CI de la fourche verte, absente et **en cours**, dans les deux régimes, puis la fourche
  vue par la garde de `sujet.sh` seule (`fusionner` en régime 8, `relancer` en régime 7 : la liste la dit du dépôt, sa lecture
  `pulls/80` sans dépôt), huit lancements ; un cas `file.sh` (fourche à la CI rouge, en cours, absente, tête sans dépôt dans la
  liste : `sujet/lot : fourche` ; la sous-PR ordinaire rouge seule dans `--rouges` ; `--next` vide ; rien d'écrit) ; et le banc
  de `fourche_sautee` du mineur 2.
- La note 8.0.1 (la fourche « quelle que soit sa CI », `file.sh`, ses jobs rouges non relancés ; `file.sh` dans « Ce qu'un
  projet fait ») ; `fusionner/SKILL.md`, dans la phrase « … ne tient rien » (mineur 3).

**Rouge avant, vert après** : le banc de la retouche (celui de `f5e595a`, avant le cas « tête sans dépôt dans la liste »,
rouge de même par le cas `file.sh` entier) sur le code de `8cd21e5` : `# tests 10`, `# pass 8`, `# fail 2` — le cas de
la boucle (« CI de la fourche IN_PROGRESS : [sujet/lot] tenu par #80 (CI en cours) ») et le cas `file.sh` ; le banc de
`fourche_sautee` vert (il tient le code du delta) (`retouches/rouge-avant-sur-8cd21e5.txt`). Sur l'arbre retouché (`ce75a47`, commit local) : `# tests 10`, `# pass 10`, `# fail 0` (16:48 → 16:52 UTC, charge 21,7 puis
21,6 ; `retouches/vert-apres-sur-la-retouche.txt`).
Mutations sur l'arbre retouché, chacune seule, le fichier remis après (`mutations/retouche-sur-ce75a47.txt`, 16:52 → 17:26 UTC,
charge 21,6 puis 6,6) : R1 (`file.sh` ne lit pas la fourche : le code de `8cd21e5`), R2 (la boucle ne la nomme pas), R3 (une
tête sans dépôt dans la liste passe pour une PR du dépôt ; `mutations/mutations-retouche.mjs`) rouges ; Q1 à Q4 et Q6 rouges
par le banc de `fourche_sautee` (mineur 2) ; P1 à P4 du tour 1 rouges par les cas « garde seule » (la défense) : 12 rouges sur
12, par leurs assertions, l'arbre propre après. La suite entière sur l'arbre retouché (`f5e595a`, le même code ; son banc sans
le cas « tête sans dépôt dans la liste », ajouté ensuite) : `# tests 1409`, `# pass 1408`, `# fail 1`, 2 368 s (16:44 → 17:23
UTC, charge 18 puis 5,6 ; `retouches/suite-entiere-sur-la-retouche.txt`). Le rouge est `scripts/poses.test.mjs` (« les bancs
posés à plat … tournent hors du plugin ») : deux tranches de `une-sous-pr-a-la-fois.test.mjs` tuées à leur borne (600 s, 540 s)
sous une charge de 18 à 27, où mes mutations tournaient aussi ; aucun test de ces tranches n'y a échoué sur une assertion.
Rejoué seul sur `ce75a47`, la charge retombée : `une-sous-pr-a-la-fois.test.mjs`, `# tests 19`, `# pass 19`, 748 s (17:27 →
17:39 UTC, charge 7,1 puis 10 ; `retouches/une-sous-pr-a-la-fois-sur-la-retouche.txt`) ; `scripts/poses.test.mjs`, `# tests 1`, `# pass 1`, 657 s (17:40 → 17:51 UTC, charge 8,2 puis 5,4 ;
`retouches/poses-sur-la-retouche.txt`). La suite est donc verte sur la retouche, aux bornes de temps près sous la charge.

**L'autre voie**, si l'architecte ne veut pas toucher `file.sh` dans cette PR : dire l'exception dans la note, le commentaire de
`boucle.sh` et le nom du banc (« … une fourche dont la CI tourne tient son sujet comme toute sous-PR « CI en cours », jusqu'à la
fin de sa CI »), et mettre le reste à la liste des suites. Question 1.

## Mineurs

### 2. La lecture stricte de `fourche_sautee` n'est tenue par aucun banc

**Fichier** : `skills/chaine/fusionner/scripts/boucle.sh`, lignes 375 à 383. Le code est juste (question 1, plus haut) ; c'est
ce que le commentaire promet (« sur la DERNIÈRE ligne … jamais sur un motif cherché dans toute la sortie ») qui n'est joué
nulle part, hors le verrou. Mes mutations sur `8cd21e5` (`mutations/mutations-tour-2.mjs`, `mutations/tour-2-sur-8cd21e5.txt`) :

| Mutation | Sur `8cd21e5` |
| --- | --- |
| Q1 `fourche_sautee` cherche le motif dans toute la sortie, pas sur la dernière ligne | **verte** (97 s) |
| Q2 elle lit la première ligne non vide, pas la dernière | **verte** (106 s) |
| Q3 elle ne vérifie pas le numéro de la PR | **verte** (112 s) |
| Q4 elle ne vérifie pas la fin du motif | **verte** (110 s) |
| Q6 elle reconnaît aussi la lecture illisible de la revue (la sortie 21 rendue en 7) | **verte** (125 s) |
| Q5 elle reconnaît toute dernière ligne qui finit par « sautée sans renvoi » (le verrou compris) | rouge (96 s) : les deux cas du verrou de `une-sous-pr-a-la-fois.test.mjs` |

Aucune n'est atteignable sans une sortie de `sujet.sh` que `sujet.sh` n'écrit pas : c'est la garde d'une modification future
(un motif élargi « pour simplifier », la lecture illisible classée avec la fourche) qui manque. La retouche du constat 1 porte
un banc : un `sujet.sh` de banc, copié sur le develop du jouet comme la boucle les copie, qui écrit pour `fusionner 80` l'une
de sept sorties 7 (le motif ; le motif suivi d'une ligne ; le motif d'un autre numéro ; le motif tronqué ; le verrou ; la
lecture illisible ; les chemins sensibles illisibles) : seule la première rend le sujet. Sur l'arbre retouché, Q1 à Q4 et Q6 le rougissent
(`mutations/retouche-sur-ce75a47.txt`).

### 3. Le corps de la PR, le ticket 78, `fusionner/SKILL.md`

- Le corps de la PR (« Preuves ») et le ticket 78 (`claude/hopeful-lovelace-ouk6tz`, § 1 « `# tests 6` », § 2 « `# tests 114` »,
  « `--stat` : 10 fichiers », le tableau « Surfaces » sans `boucle.sh`) décrivent `4afd6e2`. Au sommet, le § 1 joue 8 tests (6
  rouges sur 8.0.0, rapport du tour 1), le § 2 116, la suite 1 407, `--stat` 11 fichiers ; le commentaire de la PR du 16:12 UTC
  le dit, le corps non. Avec la retouche : § 1, 10 tests ; § 2, 118 ; la suite, 1 409 ; 13 fichiers (`file.sh` et `fusionner/SKILL.md` en plus).
- `fusionner/SKILL.md`, § « Une sous-PR à la fois par sujet », ne dit pas qu'une sous-PR de fourche ne tient rien ; le capitaine
  lit la ligne de la boucle, qui la nomme. La retouche l'ajoute à la phrase « … ne tient rien », sans ligne de plus.

### 4. P5 du tour 1, rouge par délai sur ce relevé

`mutations/tour-1-sur-8cd21e5.txt` : X1 à X4 et P1 à P4 rouges par leurs assertions ; P5 « ROUGE » à 900 s, sans test nommé :
le délai de `spawnSync` (900 s) a coupé `une-sous-pr-a-la-fois.test.mjs` entier, charge 21. Ce n'est pas une preuve. P5ʹ, la
même mutation jouée sur les deux cas du verrou de ce banc (`--test-name-pattern`, celui de `fusionner` et celui de
`relancer`) : rouge par leurs assertions, en 91 s (« `[#79] attend son tour : #78 passe d'abord dans sujet/course` » et
« `[#82] en passage chez un autre capitaine : sautée (aucun renvoi)` » non trouvées). Rien à corriger dans la PR ; dit pour que le compte « 28 rouges sur 28 » du tour 1 ne soit pas relu comme
rejoué ici.

## Questions à l'architecte

1. **La fourche pendant sa CI** (constat 1) : la retouche par `file.sh` (la fourche jamais en route, ses jobs rouges jamais
   relancés pour une sous-PR), ou l'exception dite et la suite ? Avec `file.sh`, `fourche_sautee` ne joue plus qu'en défense
   (une fourche que la liste des PR ne montrerait pas) : la garder (la retouche la garde, et son banc), ou la retirer ?
2. **La moitié « develop » de la suite `A-201` point 5** : avec la retouche, une sous-PR de fourche à la CI rouge n'est plus
   relancée ni renvoyée ; une PR de fourche vers develop l'est encore (`traiter_rouges`, puis `renvoyer.sh`). Étendre l'état
   `fourche` de `file.sh` aux PR vers develop (`passer.sh` ne serait plus joué pour elles, sa garde restant en défense), ici ou
   dans la suite ?
3. **Une PR ouverte vers un sujet, fourche comprise, étiquetée ou non**, est comptée comme sous-PR par `sujet.sh etat` (ligne
   1455 : toute PR ouverte dont la base est le sujet) : le sujet n'est alors ni mis à jour avec develop (`rafraichir_sujets`) ni
   livré (`livrer-prets`), tant qu'elle est ouverte. Sur un dépôt public, n'importe qui l'ouvre, sans étiquette. Lu, non joué,
   d'avant la PR ; c'est la même raison que `A-201` point 2. À la liste des suites, avec le point 3b du tour 1 ?

## Ce qui a été joué

- **Clone et arbres** : clone neuf, `git fetch origin claude/suites-capitaine claude/hopeful-lovelace-ouk6tz`, `pnpm install
  --frozen-lockfile` dans chaque arbre détaché : `8cd21e5` (lecture, bancs, mutations), `4afd6e2` + le patch du tour 1
  (comparaison), `8cd21e5` avec le seul banc de la retouche (rouge avant), `8cd21e5` + la retouche (vert après, mutations,
  suite). `graphify-out/` n'existe pas dans le clone.
- **Le delta contre le patch** (`essais/delta-et-patch.txt`) : identiques.
- **Le banc touché sur `8cd21e5`** (`essais/suites-du-lot-5-sur-8cd21e5.txt`) : `# tests 8`, `# pass 8`, `# fail 0` (16:15 →
  16:17 UTC, charge 13,4 puis 14,6).
- **Les mutations du tour 1** sur `8cd21e5` (`contre-relecture-4afd6e2/mutations/mutations-contre-relecture.mjs`, tel quel), chacune seule, le fichier remis après (`mutations/tour-1-sur-8cd21e5.txt`, 16:17 →
  16:42 UTC, charge 17 puis 21) : X1 à X4, P1 à P4 rouges par leurs assertions ; P5 au délai (mineur 4) ; arbre propre après.
- **Mes mutations** sur `8cd21e5` (`mutations/mutations-tour-2.mjs`, `mutations/tour-2-sur-8cd21e5.txt`) : Q5, Q7 à Q12 et P5ʹ rouges par leurs assertions (les cas du verrou de
  `fusionner` et de `relancer` dans `une-sous-pr-a-la-fois.test.mjs` ; le banc de la boucle ; Q12, la garde de `relancer` en
  régime 8 seulement : le cas `relancer` en régime 7 et le banc de la boucle, « `couldn't find remote ref refs/heads/fourche/a` ») ;
  Q1 à Q4 et Q6 vertes (mineur 2) ; arbre propre après (16:43 → 17:05 UTC, charge 19 puis 24).
- **L'essai du constat 1** (`essais/fourche-ci-en-cours.test.mjs`, `essais/fourche-ci-en-cours-sur-8cd21e5.txt`, 16:21 → 16:22
  UTC, charge 17) : E1 dans les deux régimes, E2 (la mémoire `boucle-tenus`).
- **La retouche** : rouge avant, vert après, 12 mutations, la suite entière, `une-sous-pr-a-la-fois.test.mjs` et
  `scripts/poses.test.mjs` rejoués seuls (constat 1) ; `git apply --check` sur un arbre
  neuf de `8cd21e5` : appliqué, l'arbre identique au commit local de la retouche (`retouches/apply-sur-8cd21e5.txt`).
- **La CI de GitHub** : `essais/ci-github-8cd21e5.txt`.

## Ce qui n'a pas été établi

1. **Une vraie fourche sur GitHub** : `head.repo` d'un autre dépôt, ou nul, est joué par le faux GitHub et des `gh` de banc ; si
   un workflow qui attend l'approbation (premier contributeur) pose des check runs « en attente » sur le sommet (la fourche
   « CI en cours », constat 1) ou aucun (« sans CI ») n'est pas vérifié.
2. **Le chemin hostile de `fourche_sautee`** (un script de la PR qui écrit le motif et sort en 7 sous `set -e`) : lu, non joué,
   hors de ce que la spec ferme.
3. **L'espion du régime 7** n'est pas rejoué sur `8cd21e5` : l'inchangé hors la fourche est établi par le diff (la fonction, deux
   lignes de classement et deux bras, tous derrière `rc = 7` et le motif entier) et par les mutations des sorties 7 qui tiennent ; avec la retouche,
   `file.sh` ne change que pour une sous-PR de fourche (la colonne neuve n'est lue que là).
4. **La suite entière sur `8cd21e5` seul** n'est pas rejouée ici : la CI de GitHub (1 407 sur 1 407) et la session la donnent.
5. **La question 3** : lue, non jouée.
6. **La suite entière sur `ce75a47` lui-même** : jouée sur `f5e595a` (le même code ; le banc sans le cas « tête sans dépôt dans
   la liste »), puis le banc changé rejoué seul et, posé à plat, par `scripts/poses.test.mjs`.
