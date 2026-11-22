# PR 150 (ticket 74), la veille du capitaine : contre-relecture, premier tour

Contre-relecteur, 2026-11-22, effort extra (`P-64` : la PR touche la veille et le skill du capitaine). Lecture seule vis-à-vis de GitHub : rien poussé, rien commenté, aucun label. Relu : la PR 150 au sommet `fb0ecb0bed43c4dfb708d73a2a7cc615ab939c85` (base `main` à `2e87bae`, plugin 7.38.2), le ticket 74 et ses annexes sur la branche de documentation du programme (`ticket-74.patch`, sha256 `c5608c9b…` vérifié ; `mutations.mjs` ; `relecture-tour-1/`), `A-180` point 1, `A-185` point 7, `A-187`, `A-190`. Joué sur un clone neuf de `https://github.com/MAJ-agency/skills`, Node 22.23.5, git 2.43.0, bash 5.2.21, util-linux 2.39.3, quatre cœurs, sur une machine partagée avec un autre agent (charge de 0,2 à 7,9 selon l'heure, notée à chaque passe).

## Conclusion : non conforme au sommet `fb0ecb0`, sans bloquant

Les trois défauts du besoin sont fermés : la veille se lance sous le `timeout` de deux heures, une fin sans ligne finale a sa suite, et une garde à 60 minutes voit une veille morte avec son conteneur. Le code tient ce que le ticket décrit : l'arbre est le patch, les 17 rouges et les 63 verts se rejouent, les 15 mutations tirées sont rouges, et les essais du tour 1 sont tous fermés par les retouches d'`A-190`. La liste des états de `--etat` est entière à une exception près, et aucun fils qui dure ne garde le descripteur 7.

Restent quatre écarts à corriger, tous dans le chemin que le ticket ouvre :

- **`--reprendre` transmis à la première boucle défait un arrêt neuf** (constat 1) : depuis la retouche R1 du tour 1, la veille a déjà retiré le fichier d'arrêt, et `boucle.sh --reprendre` ne peut plus retirer qu'un arrêt posé pendant le démarrage. L'essai N3 le montre : `--arreter` répond « fichier d'arrêt posé », puis la boucle passe quand même.
- **Le texte de la garde laisse deux gestes à improviser** : lever un arrêt demandé (constat 2), et réarmer ou non après `VEILLE VIVANTE : rien` (constat 3).
- **La sortie 9 d'une boucle qui tient le verrou tourne en rond** (constat 4, essai N7) : le skill renvoie à `--etat`, qui ne dit rien d'une boucle.
- **Sept des dix mutations à moi survivent** (constat 5), dont celle qui arme la garde à chaque lancement (`A-187` point 1).

Les retouches (`retouches-tour-1.patch`) ferment ces quatre écarts et deux mineurs. Elles sont prouvées : bancs touchés verts, toutes les mutations survivantes rouges, retouches défaites rouges, suite entière verte (« Les retouches »). Deux d'entre elles changent une phrase que le ticket avait décidée (questions 1 et 2).

## Constats

| # | Gravité | Constat | Preuve | Retouche |
| --- | --- | --- | --- | --- |
| 1 | **à corriger** | `--reprendre` est transmis à la première boucle (`lancer`, décision 9 : « le premier lancement de la boucle est encore `boucle.sh --reprendre` »). Depuis la retouche R1 du tour 1, la veille retire le fichier d'arrêt, sous `boucle.verrou`, avant sa préparation. Le seul fichier que la boucle trouve ensuite a donc été posé pendant le démarrage, c'est-à-dire un arrêt neuf. `boucle.sh --reprendre` le retire (sa ligne 203), et la boucle fusionne. La fenêtre va du retrait au départ de la boucle : la lecture initiale de la file (une lecture GitHub), le fetch de la préparation et ses deux sommeils (5 s et 10 s). Pendant la commande de préparation elle-même, la veille tient `boucle.verrou`, et `--arreter` la tue. Avant ce ticket, la veille ne passait jamais `--reprendre`, et un arrêt posé à tout moment tenait. | N3 : `--arreter` pendant la lecture initiale répond « aucune boucle en cours ; fichier d'arrêt posé », puis la veille lance `boucle --reprendre`, le fichier est retiré, `FILE VIDE`, sortie 0. Témoin sans `--reprendre` : la boucle sort en 10, le fichier reste. | La boucle ne reçoit jamais `--reprendre` (`lancer` simplifié, en-tête, `CONTENU.md`). Le test « --reprendre : le premier lancement… » devient « … la boucle ne reçoit jamais --reprendre … un arrêt posé pendant le démarrage reste posé ». La décision 9 du ticket change d'une phrase (question 1). |
| 2 | **à corriger** | Point 2 de la garde : « `VEILLE ARRÊTÉE` ou `arrêt demandé`, rien de plus que sa suite ci-dessus ». La suite d'un arrêt demandé, dans la liste des fins (sortie 10), est « la veille relancée avec `--reprendre` quand on veut repartir ». Une session de garde peut lire qu'elle veut repartir, et lever l'arrêt d'un humain. La décision 6 du ticket (« un arrêt posé par un humain […] n'est jamais levé par un réveil de garde ») n'est écrite nulle part dans le skill, et aucun banc ne la tient. | Lecture ; mutation X2 (« la relancer avec `--reprendre` ») verte sur `fb0ecb0`. | La phrase est dite au point 2 : « un arrêt demandé ne se lève jamais au réveil de garde : `--reprendre` attend qui l'a posé, un humain, ou le capitaine après son action à la main ». Le banc des textes l'exige (X2 rouge). |
| 3 | **à corriger** | Le point 2 dit « `VEILLE VIVANTE`, sortie 0 : rien », et le point 4 « Réarmer » ne dit pas qu'il suit chaque branche. Une session qui lit « rien » comme la fin de la garde ne réarme pas. La garde meurt alors à son premier réveil, qui tombe presque toujours sur une veille vivante (60 minutes contre 75), et le défaut 1 du ticket revient une heure après le premier lancement. Seule la branche 64 dit « ne plus réarmer » : les autres le laissent à déduire. | Lecture ; aucun banc n'en dit rien. | Point 4 : « Réarmer, quelle qu'ait été la suite des points 2 et 3 (`VEILLE VIVANTE` comprise), sauf « ne plus réarmer » (point 2) ». Le banc des textes l'exige (D5 rouge). |
| 4 | **à corriger** | La puce « Sortie 9 » met dans une même phrase « une autre boucle tient le verrou » et « une autre veille tourne », avec une seule suite : « `veille.sh --etat` : la suite de son point 2 ». Or `--etat` ne parle que des veilles. Pour une boucle sans veille qui la porte (une orpheline, ou un démon du projet qui a hérité du descripteur 9, le « couplage fragile » de l'en-tête de `boucle.sh`), `--etat` rend la ligne finale de la veille, `VEILLE ARRÊTÉE … la boucle est sortie en 9`, ou « arrêt demandé » après `--reprendre`. Le point 2 renvoie alors à « sa suite ci-dessus », qui est cette puce même, déjà donnée : rien n'est fait, le lanceur n'est pas prévenu, et chaque garde suivante relit la même ligne. La file n'est plus servie, en silence. Les lignes des scripts disent pourtant le geste (`REFUS … '--arreter' d'abord` ; `« boucle.sh --arreter », puis --reprendre`). | N7.a et N7.b : les lignes, puis `--etat` deux fois de suite, `VEILLE TERMINÉE : VEILLE ARRÊTÉE … sortie en 9`. N7.c : `boucle.sh --arreter` arrête le démon, et la boucle passe son verrou. | La puce sépare les deux cas : « une autre veille tourne » garde sa suite ; « une boucle tient le verrou sans veille qui la porte » prend le point 3 de la garde (`--arreter` de la copie, puis la veille relancée avec `--reprendre`), puis le dire au lanceur. Le banc des textes l'exige (D6 rouge). C'est un geste de plus que l'ancien « ne rien relancer avant de savoir laquelle » (question 2). |
| 5 | **à corriger** | Des décisions ne sont tenues par aucun banc. Sept de mes dix mutations restent vertes sur `fb0ecb0` : la garde armée à chaque lancement de la veille (X1 : les réveils s'empilent, `A-187` point 1) ; la suite d'une copie d'avant `--etat`, relancée avec `--reprendre` (X3, le constat 4 du tour 1 rouvert) ou réarmée (X4) ; la garde sans son `message` (X5 : la session réveillée ne saurait pas qu'il faut jouer la garde) ; la condition du point 1 sans `test -f` de la copie (X6) ; l'état `lancee` ajouté au fichier plutôt que de le remplacer (X7 : une veille tuée après une veille finie se lirait `VEILLE TERMINÉE : VEILLE FINIE`, et la garde la relancerait sans `--arreter`). | `mutations/mutations-contre.txt` (sur `fb0ecb0`) : X1 à X7 vertes, X8 à X10 rouges. | Le banc des textes exige ces phrases ; `veille.test.mjs` pose la fin d'une veille d'avant dans « veille tuée pendant sa pause ». Les dix sont rouges avec les retouches. |
| 6 | mineur | Un fichier du verrou qui ne s'ouvre pas (`exec 7>>` en échec) donne `VEILLE VIVANTE`, sortie 0 : `flock -n` sort en 65 sur le descripteur fermé, et `--etat` prend toute sortie non nulle pour un verrou tenu. La garde ne fait alors plus rien, pour toujours. La veille, de son côté, sort en 9 avec « une veille tourne déjà ». C'est le seul trou de la liste des états. Il est rare (EACCES, EROFS, EMFILE), mais c'est une veille vivante inventée. | N1.i et N1.j (un répertoire à la place du fichier). | `{ : >&7; }` avant le verdict : `--etat` sort en 6 (« verrou de la veille illisible »), la veille aussi. Un test neuf ; D2 et D3 rouges. |
| 7 | mineur | « **Sans veille en cours** » dit toujours « se réveille seul (`send_later`) » : une veille arrêtée et pas encore relancée (`VEILLE ARRÊTÉE` qui attend un humain) pousse à un second message programmé, à côté de la garde qui attend déjà. | Lecture. | « le réveil de garde, s'il attend, en tient lieu, jamais un second `send_later` ». Le banc des textes l'exige (D7 rouge). |
| 8 | mineur | Point 2 : « une autre sortie (64 : la copie est d'avant `--etat` …) : pas de garde, … ne plus réarmer ». `--etat` sort aussi en 64 hors d'un dépôt git (« à lancer depuis le worktree du capitaine »). Une session lancée du mauvais dossier lirait 64 et éteindrait la garde. Le point 2 dit « Depuis le worktree », et un dossier qui n'est pas un dépôt est peu probable. | N1.b. | Ticket de suite (6b) : nommer la ligne de la copie d'avant, `CAPITAINE_ID requis`, plutôt que la seule sortie. |
| 9 | mineur | Le paragraphe `CAPITAINE_ID` (§ « Mise en place ») cite encore `boucle.sh --reprendre` parmi les gestes à la main, alors que « **Reprendre** » dit maintenant « jamais `boucle.sh --reprendre` au premier plan ». | Lecture, ligne 64. | Ticket de suite (6b, qui récrit `fusionner/SKILL.md`). |
| 10 | mineur | Le ticket (branche de documentation), § 0 : « `sha256sum` rend `6b3b5368…` » est l'empreinte de la première version du patch ; l'en-tête et le patch posé disent `c5608c9b…`. Si la question 1 est acceptée, la décision 9, la table « Surfaces » et celle des mutations (M18 et M19 deviennent introuvables, de même que T10b avec le constat 4) changent aussi. | `sha256sum`. | À l'architecte, dans le ticket. |
| 11 | mineur | Un trou reste entre les deux gestes du point 3 : `--arreter` pose l'arrêt, et c'est la veille relancée qui le retire. Si la session n'arrive pas à la relance (conteneur recyclé entre les deux appels de l'outil, relance refusée avant le verrou), chaque garde suivante lit « arrêt demandé » et, comme la décision 6 le veut (constat 2), ne le lève pas. | Raisonnement ; le même état que N3 « préparation » produit à la main. | Partie 6b, avec le `trigger_id` de la garde : la session note l'heure de son `--arreter`, et un arrêt « posé le » à cette heure est le sien. |

## Le tour, point par point

### 1. L'arbre est le patch

Sur un worktree neuf de `2e87bae` : `git apply --index --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md ticket-74.patch`, puis `git diff --stat fb0ecb0 -- . ':!.claude-plugin/plugin.json' ':!NOTES-DE-VERSION.md'`. La sortie est vide, avec le banc neuf compris (`A scripts/veille-du-capitaine.test.mjs`, six fichiers, 533 lignes ajoutées et 37 retirées). Hors de ces six fichiers, la PR change `plugin.json` (7.38.2 → 7.38.3) et la note, dont le texte est celui du patch à son titre près (`## 7.38.3 — 2026-11-22`). Les huit fichiers font 545 lignes ajoutées et 38 retirées.

### 2. Les rouges avant, et quinze mutations de l'annexe

- **Avant le code** (sur `2e87bae`, avec les seuls trois bancs de `fb0ecb0` posés) : **17 rouges sur 63** (8 min 16 s, charge 4,8 à 6,1). Ce sont les 4 du banc des textes, 11 des 12 tests neufs de `veille.test.mjs` plus « démon lancé par la préparation », et le test neuf d'`une-sous-pr-a-la-fois.test.mjs`. Le douzième, « une veille qui démarre pendant qu'un --etat tient le verrou… », est vert, comme le ticket l'annonce.
- **Après** (sur `fb0ecb0`) : **63 verts sur 63** (7 min 23 s, charge 5,9 à 5,4).
- **Quinze mutations de l'annexe**, `mutations.mjs` du ticket, graine 150 (`mutations/echantillon-15.mjs` : M4, M5b, M12 et T12 imposées, onze tirées parmi les 37 autres par mulberry32) : M4 M5b M12 T12 M6 M11 T10b M26 M24 M17 M9 T3 T13 M3 T11. Résultat : **15 rouges sur 15**, chacune sur le test qui la vise. M4 rougit « un démon laissé par la boucle ou par file.sh » et « veille tuée pendant une sonde lente ». M5b rougit « démon lancé par la préparation » et « --reprendre : le fichier d'arrêt est retiré… ». M12 rougit « une seconde veille ». T12 rougit le troisième test du banc des textes. L'arbre était propre après la passe (03:15 → 03:24 UTC, `mutations/echantillon-15.txt`).

### 3. Les essais E1 à E13 du tour 1, sur l'arbre de la PR

Les scripts du tour 1 ont été rejoués tels quels contre `veille.sh` et `boucle.sh` de `fb0ecb0`, avec la copie d'avant de `2e87bae` pour E12. Trois essais sont refaits ici : E2, E5 et E6, que le tour 1 avait joués à la main ou par les bancs ; et E13, avec le `>>` du skill et une première veille de 8 s, puisque l'attente de 3 s laissait la seconde prendre le verrou d'une première de 4 s. Sorties : `essais/sorties-fb0ecb0.txt`.

| Essai | Tour 1, sur le patch d'avant | `fb0ecb0` | Fermé par (retouches du tour 1) |
| --- | --- | --- | --- |
| E1, deux veilles au même instant, 20 fois | une tourne, l'autre sort en 9 | 20 fois une seule tourne (9 fois 0/9, 11 fois 9/0), une boucle | — (déjà tenu) |
| E2, E5, E6, kill -9 pendant le sommeil, la boucle, `tee` | `MORTE` | `MORTE` 0,3 s après, personne ne tient `veille.verrou` | — |
| E3, kill -9 pendant une sonde lente | **`VIVANTE`** | `MORTE` | R3 (`A-190` point 4, constat 2 du tour 1) |
| E4, kill -9 pendant la préparation | **`VIVANTE`** | `MORTE` | R3 |
| E7, `--etat` pendant le démarrage, 40 veilles | 5 refus en 9 | **0 sur 40** | R4 (`flock -w 3`), R2 |
| E8, `--etat` pendant la fin | 1 ou 2 `MORTE` fausses | 1 `MORTE (aucune trace)` sur 1 600, lue avant que la première veille de l'essai prenne son verrou : vraie à cet instant | R2 (l'état lu sous le verrou) |
| E9, garde, `--reprendre` tuée pendant la préparation, puis préparation en 13 | **« arrêt demandé » pour toujours** | `MORTE`, puis la fin du 13 écrite, puis `VEILLE FINIE` sans `--reprendre` | R1 (`A-190` point 1, le bloquant du tour 1) |
| E10, dépôt neuf | `MORTE (aucune trace)`, sortie 1 | pareil, et `--etat` n'écrit que `veille.verrou` | — |
| E11, 11 contenus × arrêt × verrou, 44 cas | la table du tour 1 | la même table, cas pour cas | — |
| E12, copie d'avant le ticket | `--etat` et `--reprendre` en 64 | pareil : la suite est dans le texte (point 2, sortie 64) | texte (`A-190` point 4, constat 4 du tour 1) |
| E13, seconde veille sur le même journal | journal tronqué, dernière ligne illisible | refus dans le journal, aucun octet NUL, dernière ligne `VEILLE FINIE` | `>>` (`A-190` point 3) |

Les treize sont fermés. La `MORTE` d'E8 n'est pas une course : un `--etat` lu avant que la toute première veille ait pris son verrou ne voit aucune trace, et c'est le cas (le tour 1 en comptait 2 avec sa retouche).

### 4. `veille.sh`, attaqué

**La liste des états de `--etat` est entière, à une exception près.** Le bloc lit trois choses : le verrou, la présence de `boucle-arret`, et la première ligne de `veille.etat`. N1 joue chaque sortie, et E11 joue les 44 combinaisons de contenu.

| Condition, dans l'ordre | Sortie | Essai |
| --- | --- | --- |
| un argument de plus | 64, usage | N1.a |
| hors d'un dépôt git | 64, « à lancer depuis le worktree » ; rien d'écrit | N1.b |
| `flock` absent | 6 | N1.c |
| verrou tenu | 0, `VEILLE VIVANTE (lancée à …)` si l'état est lisible | N1.f, E11 |
| **fichier du verrou qui ne s'ouvre pas** | **0, `VEILLE VIVANTE`** (constat 6 ; 6 avec la retouche) | N1.i |
| `boucle-arret` posé | 2, arrêt demandé | N1.h, E11 |
| `fin <n> <ligne>` | 2, la ligne | N1.g, E11 |
| tout le reste | 1, `VEILLE MORTE`, avec l'heure si `lancee <n>` | N1.d, N1.e, E10, E11 |

Les sorties de la veille elle-même : 0 (`VEILLE FINIE`), le code de la boucle, 6 (`flock` absent ; avec la retouche, verrou illisible), 9 (une veille tourne déjà ; une boucle tient le verrou, avec `--reprendre`), 13 (préparation), et 64 avant le verrou (`CAPITAINE_ID`, une option, hors d'un dépôt). Toute fin d'après le verrou passe par `finir`, sauf le refus en 9 d'une seconde veille, qui n'écrit pas l'état, et c'est voulu.

**Le descripteur 7 : aucun fils qui dure ne le garde.** N2 met un témoin devant chaque commande externe que la veille et ses fils appellent par le `PATH` (22 noms). Trois veilles sont jouées : la première avec `--reprendre`, la préparation, un fetch raté puis son sommeil, deux sondes et une relance ; la deuxième finit à l'échéance ; la troisième voit la boucle sortir en 10. Le témoin note si le descripteur 7 vise `veille.verrou`.

- **Fermé** (lancés avec `7>&-`, ou dans un sous-shell qui le ferme d'abord) : `bash boucle.sh` et tous ses fils, `bash file.sh` et ses fils, `tee`, chaque `sleep` (la pause, le sommeil entre deux fetch, celui de la préparation), `git fetch`, `sh -c` de la préparation. Ce sont les seuls qui peuvent durer.
- **Ouvert** : `date`, `cat`, `tr`, `sed`, `sort`, `comm`, `jq`, `mktemp`, `mv`, `rm`, `flock -n 8` et `flock -w 3 7` lui-même, `git rev-parse`, `git cat-file`, `git show`, `git status`, `git switch`. Tous rendent la main en quelques millisecondes. Les deux derniers peuvent lancer un hook (`post-checkout`) ou un moniteur de fichiers. Le relais `post-checkout` du socle (`socle-monorepo/references/husky/post-checkout`) appelle celui de graphify, qui sort aussitôt dans un worktree lié et lance sa reconstruction avec `close_fds=True` : il ne garde rien.
- **Sous-shells sans `exec`** (relevés dans le source après le verrou) : `$(heure)`, `$(date +%s)`, les tubes `cat | tr`, `printf | jq`, `sed | sort`, `sed | jq`, `printf | tr | sed`, et `comm` avec ses deux `<(printf …)`. Chacun dure le temps de ses commandes, qui sont dans la liste « ouvert ». Les deux sous-shells longs, `$(exec 7>&-; etat_file)` et `(exec 7>&- 8>&-; …)`, ferment le descripteur d'abord.

**`--reprendre` et R1, la préparation tuée à chaque étape.** N4 pose le fichier d'arrêt, change le `boot_id`, et tue la veille relancée avec `--reprendre` à cinq moments : pendant un fetch lent, pendant le sommeil entre deux essais du fetch, pendant la commande de préparation, pendant la boucle, et pendant une sonde. Chaque fois, `--etat` dit `MORTE` 0,3 s après, le fichier d'arrêt est retiré, et personne ne tient `veille.verrou`. Pendant la boucle, la boucle orpheline et son `sleep` tiennent `boucle.verrou`. Puis le point 3 : `--arreter` (sortie 0 ; « boucle arrêtée » quand une orpheline vivait), et la veille relancée avec `--reprendre` finit en `VEILLE FINIE`, que `--etat` relit. Les deux `7>&-` du fetch, qu'aucun banc ne tenait (« Ce qui n'a pas été établi » du ticket), sont joués ici : le fetch et son sommeil ne gardent pas le verrou.

**Deux veilles, et un `--etat` pendant le démarrage.** E1 et E7 ci-dessus. N5 lance une seconde veille avec `--reprendre`, un arrêt posé, pendant qu'une première tourne : elle sort en 9 en 3,0 s, l'état et le fichier d'arrêt restent, une seule boucle est lancée.

**Un recyclage simulé.** N6 lance la veille comme le fait l'outil Bash : un `bash -c` dans son propre groupe, journal en ajout, et une boucle qui tient `boucle.verrou` en dormant. Les cas joués :

- l'outil ne tue que le bash de la veille : la boucle orpheline tient `boucle.verrou`, `--etat` dit `MORTE`, `--arreter` arrête l'orpheline ;
- l'outil tue le groupe ;
- machine recyclée, clone refait : le répertoire commun est neuf, et `--etat` dit `MORTE (aucune trace)` ;
- machine recyclée, répertoire commun gardé, `boot_id` changé.

Dans les quatre cas, la veille relancée avec `--reprendre` finit, et `--etat` dit `VEILLE TERMINÉE : VEILLE FINIE`.

**Le journal en ajout.** E13 rejoué avec `>>` : le refus de la seconde veille reste dans le journal, et la dernière ligne est celle de la première.

**Mes dix mutations** (`mutations/mutations-contre.mjs`, journal sur `fb0ecb0` : `mutations/mutations-contre.txt`). Sur `fb0ecb0`, X1 à X7 restent vertes et X8 à X10 sont rouges :

- X8 (toute veille retire le fichier d'arrêt) est rouge, par le test du verrou de la boucle tenu (13) et par la vraie boucle (520 s) ;
- X9 (`--reprendre` garde `boucle.verrou` ouvert, la vraie boucle refuse en 9) n'est rouge que par le banc lent de la vraie boucle (456 s) ;
- X10 (le retrait avant le verrou de la veille) est rouge, par le test du verrou de la boucle tenu.

Avec les retouches, les dix sont rouges, X9 aussi par `veille.test.mjs`.

### 5. Le texte du skill, joué par un capitaine Sonnet

J'ai suivi chaque réveil comme le ferait un capitaine Sonnet qui lit le skill à la lettre.

| Réveil | Ce que le texte fait faire | Geste à improviser ? |
| --- | --- | --- |
| Premier lancement | la copie, la veille en tâche de fond avec `timeout` 7200000 et `>>`, puis `send_later` à 60 minutes, avec son nom et son message | non |
| `VEILLE FINIE` | la relancer telle quelle, sans garde | non |
| `VEILLE ARRÊTÉE`, sortie 9, une veille tourne | `--etat` : `VIVANTE`, rien | non |
| `VEILLE ARRÊTÉE`, sortie 9, une boucle tient le verrou | `--etat` rend la ligne même, qui renvoie à elle-même : rien, en silence | **oui, constat 4** |
| `VEILLE ARRÊTÉE`, sortie 10 | « quand on veut repartir » : qui ? | à demi (le constat 2 le ferme pour la garde) |
| Aucune ligne finale | points 1 à 3, sans réarmer | non |
| Garde, `VIVANTE` | « rien », puis le point 4 ? | **oui, constat 3** |
| Garde, arrêt demandé | « rien de plus que sa suite », qui est `--reprendre` « quand on veut repartir » | **oui, constat 2** |
| Garde, `MORTE` | `--arreter` de la copie, puis la seconde ligne du bloc avec `--reprendre`, en tâche de fond, sans recopier, puis réarmer | non |
| Garde, sortie 64 d'une copie non reposée | pas de garde, le dire une fois, ne plus réarmer ; après une fin sans ligne finale, relancer sans `--reprendre` | non (le constat 8 en est un cas voisin) |
| Sans veille en cours | `send_later` à côté de la garde | **constat 7** |

Aucun réveil ne s'empile sur le chemin écrit :

- la garde ne se réarme qu'au point 4 ;
- la quatrième puce ne joue que les points 1 à 3 ;
- `VEILLE FINIE` relance sans armer.

Le texte ne le garantit pourtant que par des phrases qu'aucun banc ne tenait (X1, X5), et « Sans veille en cours » en ouvrait un second (constat 7). Les retouches ferment les quatre lignes en gras.

### 6. La suite entière

`pnpm test` à `fb0ecb0`, d'un seul tenant, en tâche de fond avec un `timeout` explicite (2 700 000 ms) : **1 313 tests, 1 313 verts**, aucun échec, sauté, annulé ni « todo ». 13 min 20 s (03:46:39 → 04:00:00 UTC, `duration_ms` 800222), charge 0,22 au départ, 1,04 à la fin, arbre propre après. Le ticket comptait 1 296 sur `25a72c7` avec le patch : les 17 de plus sont entrés dans `main` avec les plugins 7.38.1 et 7.38.2.

## Les retouches, `retouches-tour-1.patch`

Le patch s'applique sur `fb0ecb0` par `git apply`. Il touche sept fichiers : 77 lignes ajoutées, 29 retirées. Empreinte : `sha256sum retouches-tour-1.patch` donne `5229b6d04596cd1c61d8039680c0d6e7bd0f617af191afd3bcd4ed6e2686e3de`. La version ne change pas (7.38.3), et la note gagne une ligne sous la 7.38.3.

- **`veille.sh`** :
  - `lancer` ne passe plus `--reprendre` à la boucle (constat 1 ; en-tête et commentaires) ;
  - `{ : >&7; }` avant `VEILLE VIVANTE` et avant « une veille tourne déjà » : un descripteur 7 que l'`exec` n'a pas ouvert sort en 6, « verrou de la veille illisible » (constat 6).

  Les cibles des mutations de l'annexe restent, sauf M2 (reprise en M2c), M18 et M19 (sans objet : D1 les remplace) et T10b (reprise en T10c).
- **`fusionner/SKILL.md`** :
  - la puce « Sortie 9 » en deux cas (constat 4) ;
  - le point 2 dit qu'un arrêt demandé ne se lève jamais au réveil de garde (constat 2) ;
  - le point 4 suit chaque suite (constat 3) ;
  - « Sans veille en cours » sans second `send_later` (constat 7).
- **`references/CONTENU.md`** : une phrase (constats 1 et 6).
- **`veille.test.mjs`** :
  - « --reprendre : le premier lancement de la boucle seul reçoit --reprendre » devient « --reprendre : la veille retire le fichier d'arrêt, la boucle ne reçoit jamais --reprendre et trouve son verrou libre ; un arrêt posé pendant le démarrage reste posé ; sans l'option, la veille ne retire rien » (constat 1, X8, X9) ;
  - un test neuf, « un fichier du verrou de la veille qui ne s'ouvre pas : --etat et la veille sortent en 6… » (constat 6) ;
  - « veille tuée pendant sa pause » pose d'abord la fin d'une veille d'avant (X7) ;
  - « une seconde veille » est lancée avec `--reprendre`, un arrêt posé, qu'elle garde (X10).
- **`une-sous-pr-a-la-fois.test.mjs`** : le titre et le commentaire du test de `--reprendre` (c'est la veille qui retire le fichier, plus la boucle).
- **`scripts/veille-du-capitaine.test.mjs`** :
  - la sortie 9 en deux cas ;
  - au troisième test : « Au premier lancement de la veille dans la session », le `message` de la garde, la condition du point 1, la clause 64 entière, la phrase de l'arrêt demandé, le point 4 et « Sans veille en cours ».
- **`NOTES-DE-VERSION.md`** : une ligne sous la 7.38.3.

| Ce qui est joué | Où | Résultat |
| --- | --- | --- |
| Les bancs de la retouche, sans son code | `fb0ecb0` + les trois bancs retouchés | rouges : « --reprendre : la veille retire… » et « … qui ne s'ouvre pas… » (`veille.test.mjs`), tests 2 et 3 du banc des textes ; verts, comme attendu : « veille tuée pendant sa pause » et « une seconde veille », qui tiennent X7 et X10, pas un défaut du code |
| Les trois bancs et la vérification 3 (`depot`, `relecteur`, `fusionner.test`) | `fb0ecb0` + retouches | **250 sur 250** (64 des trois bancs, 186 de la vérification 3), 6 min 43 s, charge 0,8 à 3,7 |
| Mes mutations X1 à X10 | `fb0ecb0` + retouches | **10 rouges sur 10** : X1 à X6 par le banc des textes ; X7 par « veille tuée pendant sa pause » ; X8 et X9 aussi par « --reprendre : la veille retire… » de `veille.test.mjs`, en une minute, et plus seulement par le banc lent de la vraie boucle ; X10 aussi par « une seconde veille » |
| Les retouches défaites, D1 à D7, et M2c, T10c | `fb0ecb0` + retouches | **9 rouges sur 9**, chacune par le test qui la tient (`mutations/sur-retouches-defaites-et-textes.txt`) |
| Les 41 mutations de l'annexe | `fb0ecb0` + retouches | **37 rouges sur 37 trouvées** (23 du code, 14 du texte) ; M2, M18, M19 et T10b introuvables, reprises par M2c, D1 et T10c ; le diff relu après chaque passe est le patch |
| La suite entière, `pnpm test` d'un seul tenant, en tâche de fond avec un `timeout` explicite | `fb0ecb0` + retouches | **1 314 tests, 1 314 verts**, aucun échec, sauté, annulé ni « todo » (1 313 + le test neuf) ; 15 min 19 s (04:11:07 → 04:26:29 UTC, `duration_ms` 918626), charge 2,62 au départ, 3,84 à la fin ; le diff relu avant et après la suite est le patch (`5229b6d0…`) |
| Les essais E1 à E13 et N1 à N7 | `fb0ecb0` + retouches | N1.i et N1.j sortent en 6, « verrou de la veille illisible » ; N3 avec `--reprendre` : l'arrêt posé pendant le démarrage tient (sortie 10, fichier gardé) ; N6 : la boucle relancée sans `--reprendre` ; le reste comme sur `fb0ecb0` (`essais/sorties-retouches.txt`) |

Si les retouches entrent, le ticket change aussi :

- la décision 9 (question 1) et la décision 13 (question 2) ;
- les tables « Surfaces » et « Mutations » : M18 et M19 sans objet, M2c, T10c, D1 à D7 et X1 à X10 ;
- l'empreinte du § 0 (constat 10).

## Questions à l'architecte

1. **La boucle lancée par la veille ne reçoit plus `--reprendre`** (constat 1). Cela contredit une phrase de la décision 9 (« Le premier lancement de la boucle est encore `boucle.sh --reprendre` »), que la retouche R1 du tour 1 avait gardée. Depuis cette retouche, ce `--reprendre` ne peut plus que défaire un arrêt neuf. **Recommandation : oui**, la retouche le fait. Si c'est non, il faut retirer du patch le hunk de `lancer`, les trois phrases d'en-tête et de `CONTENU.md` qui le disent, la phrase de la note, le titre du test d'`une-sous-pr-a-la-fois.test.mjs`, et le nouveau test « --reprendre : la veille retire… », que l'on remplace par celui de `fb0ecb0`.
2. **Une boucle qui tient le verrou sans veille qui la porte prend le point 3 de la garde** (constat 4) : `--arreter`, puis la veille relancée avec `--reprendre`, puis le dire au lanceur. L'ancien texte disait « ne rien relancer avant de savoir laquelle ». `A-190` point 2 accepte déjà qu'une orpheline soit interrompue en plein passage. Dans un clone de capitaine, une boucle sans veille est une orpheline ou un démon. Le produit veut des gestes, pas des autorisations. **Recommandation : oui.** Si c'est non, la puce doit au moins dire « le dire au lanceur » pour ce cas, et ne pas renvoyer à `--etat`.

## Ce qui n'a pas été établi

- **Ce que l'outil Bash tue au plafond**, le bash seul ou son groupe : N6 joue les deux, aucun contre l'outil lui-même.
- **Un vrai recyclage** : il est simulé par un clone refait et un `boot_id` changé (N6, E9, E10).
- **Une session Sonnet réelle** : le point 5 est une lecture à la lettre, pas un essai. Les bancs tiennent des places, pas une conduite.
- **Un hook de projet** lancé par `git switch` ou `git status` pendant la préparation hériterait du descripteur 7 le temps de sa vie. Seul le relais du socle est examiné, et il ne garde rien.

## Comptes, et temps

Le détail est dans `comptes.txt`. Les essais sont sous `essais/` : `rejouer.sh <arbre> <veille.sh d'avant> <essais du tour 1>` les rejoue tous, et leurs sorties, chemins privés masqués, sont dans `sorties-fb0ecb0.txt` et `sorties-retouches.txt`. Les mutations sont sous `mutations/`.

Le temps : de 02:57 à 05:15 UTC le 2026-11-22, soit 2 h 18. Chaque passe publiée a été jouée seule, l'une après l'autre ; les deux passes de la suite entière ont duré 13 min 20 s et 15 min 19 s.
