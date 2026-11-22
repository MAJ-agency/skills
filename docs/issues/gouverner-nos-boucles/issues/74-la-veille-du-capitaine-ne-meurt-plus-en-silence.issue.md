# La veille du capitaine ne meurt plus en silence : lancée sous le plafond de l'outil Bash, une fin sans ligne finale a sa suite, un réveil de garde voit la veille morte avec son conteneur

Status: Fait — PR 150 (`37233f8`, plugin 7.38.3)
Type: défaut
Label: contre-revue
Modèle: sonnet — trois défauts de la veille du capitaine (`A-185`, point 7 ; `A-180`, point 1), chacun avec sa décision et son banc ; le code entier est dans le patch ([`74-annexes/ticket-74.patch`](74-annexes/ticket-74.patch), sha256 `c5608c9b6ee2fe288d39666e9665355e59c15bc15d24712c93a84eefc2d4670f`, `git apply` sur `25a72c7`, plugin 7.38.0 ; retouché après sa relecture, `A-190`), décrit fichier par fichier ci-dessous ; les bancs neufs ou changés sont rouges avant le code et verts après, les mutations de [`74-annexes/mutations.mjs`](74-annexes/mutations.mjs) sont toutes rouges, la suite entière est verte (« Vérification »). Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/veille.sh` et `veille.test.mjs`, `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `scripts/veille-du-capitaine.test.mjs` (neuf) : aucun des patchs des tickets 67 à 73 ne les touche (vérifié fichier par fichier sur leurs trois patchs). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : chacune des PR A (67 à 69), B (70) et du lot 5 (71 à 73) les touche ; la version est la suivante de `main` au moment de livrer.

## Le besoin

Trois défauts de la veille du capitaine, que l'architecte a mis hors des fichiers du lot 5 et envoyés à ce ticket (`A-185`, point 7, spec `relecture-independante.spec.md` de la branche de documentation). Les faits sont lus sur `main` à `25a72c7` (plugin 7.38.0), sur un clone neuf ; les numéros de ligne sont ceux de `25a72c7`.

### 1. La veille morte avec son conteneur ne prévient personne

Le 2026-11-19, une veille de capitaine est morte avec son conteneur, la file vide, et personne n'a relu la file pendant 5 h 40 (passation du 2026-11-19, « Tickets du plugin notés », point 2 ; carte, 2026-11-19, 07 h 05 ; ticket 73, « Les quatre suites rangées avec le lot 5 » : le capitaine d'Anchorpost a posé de lui-même un réveil horaire de garde). La veille ne réveille sa session que par la fin de sa tâche de fond (`fusionner/SKILL.md`, ligne 83 : « La veille s'arrête d'elle-même, et sa fin réveille la session ») ; un conteneur arrêté tue la tâche sans que la session soit réveillée. Rien ne relit l'état de la veille : `veille.sh` n'a ni verrou propre ni état écrit, et le seul paragraphe qui parle d'une session sans veille (« **Sans veille en cours** », ligne 93) suppose qu'un réveil arrive.

### 2. Le plafond de 30 minutes

`veille.sh` compte sur deux heures : `limite=${VEILLE_LIMITE:-120}` (ligne 76), `--marge 40`, `--duree 75`, et l'en-tête dit « Une tâche de fond est tuée à 2 h » (ligne 50). L'outil Bash arrête une tâche de fond à **30 minutes par défaut**, sauf `timeout` explicite, au plus 7 200 000 ms (sa description : « `timeout` is how long the command may run in the background (default 1800000, max 7200000); at that limit it is stopped »). Le skill dit de lancer la veille « **en tâche de fond** » (ligne 72), sans `timeout` : elle meurt à 30 minutes, sans ligne finale, au milieu d'un passage s'il le faut. La veille du Relecteur a été réglée pour cette raison (`A-180`, point 1 : `--duree 25`, « **25 minutes, pas plus** : l'outil Bash arrête une tâche de fond à 30 minutes par défaut », `relecteur/SKILL.md`, ligne 90, à `main`).

### 3. Une fin sans ligne finale n'a pas de suite

La liste des fins (`fusionner/SKILL.md`, lignes 85 à 87) a trois puces : `VEILLE FINIE`, `VEILLE ARRÊTÉE`, `VEILLE ARRÊTÉE`, sortie 13. Une tâche arrêtée par l'outil, ou par un conteneur qui redémarre, ne rend aucune de ces lignes : la session réveillée n'a rien à faire, et une boucle orpheline peut tenir encore le verrou (`boucle.verrou`), si bien qu'une veille relancée sortirait en 9. Le skill `relecteur` a la quatrième puce (« **aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE` », ligne 95) ; `fusionner` ne l'a pas.

## Une PR à lui

`A-185`, point 9 : « Le ticket 74 passe après le lot 5 s'il touche les mêmes fichiers, sinon après la PR B. » Il n'en touche aucun, hors des deux fichiers de version : il passe **après la PR B** (ticket 70), et peut partir avant le lot 6, qui récrira `fusionner/SKILL.md` (6b) sur le `main` qu'il trouvera. Vérifié : le patch s'applique sur `25a72c7` seul, et sur `25a72c7` plus les patchs des tickets 67 à 69, 70 et 71 à 73 (`71-73-annexes/lot-5.patch`, sha256 `4e97a67c…` ; dans cet ordre, les deux fichiers de version exclus des deux derniers) avec `--exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md`.

## Où

- `skills/chaine/fusionner/scripts/veille.sh` : l'en-tête (l'échéance, « Une veille à la fois, et son état », l'usage) ; `--etat` avant la vérification de `CAPITAINE_ID`, qui lit l'état sous le verrou ; l'option `--reprendre`, qui retire le fichier d'arrêt avant la préparation ; le verrou `veille.verrou` (`flock -w 3`) et l'état `veille.etat` ; la fonction `finir`, par où passe chaque ligne finale ; `7>&-` sur chaque fils qui peut survivre à la veille, et `exec 7>&-` dans les sous-shells de la sonde et de la préparation.
- `skills/chaine/fusionner/scripts/veille.test.mjs` : la doublure de `boucle.sh` note ses arguments ; douze tests neufs ; une assertion de plus dans « démon lancé par la préparation ».
- `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` : `veilleReelle` prend des options de plus ; un test neuf avec la vraie boucle.
- `skills/chaine/fusionner/SKILL.md`, § « Mise en place » et § « Boucle » : le journal en ajout dans les deux commandes de la veille ; le paragraphe « **Reprendre** » ; le lancement de la veille, la ligne de sa commande, la puce « Sortie 9 » et la sortie 10, une quatrième puce, le paragraphe « **Réveil de garde.** » et ses quatre points, la puce `VEILLE FINIE`.
- `skills/chaine/fusionner/references/CONTENU.md`, § `scripts/veille.sh` : un paragraphe.
- `scripts/veille-du-capitaine.test.mjs` (neuf) : le banc des textes, chaque phrase à sa place.
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

`boucle.sh`, `file.sh`, `passer.sh` et les gabarits de lancement (`architecte/references/lancement.md`) ne changent pas.

## Décisions

### Le plafond : le `timeout` à 7 200 000 ms, la veille gardée à deux heures

1. **La veille se lance avec le `timeout` de l'outil Bash à `7200000`**, en tâche de fond (`run_in_background`). `veille.sh` garde sa limite de 120 minutes, sa marge de 40 et sa durée de 75 : rien de son calcul de l'échéance ne change, ni aucun des bancs qui le tiennent.
2. **Raison, et pourquoi pas une veille sous le plafond.** La recommandation du rédacteur du lot 5 laissait le choix ; la veille courte est la moins sûre :
   - la marge doit être sous la limite (`veille.sh`, ligne 95 : `--marge` « sous la limite ») ; sous 30 minutes, la marge de 40 est impossible, et elle « couvre un passage ordinaire, pas un passage qui attend plusieurs CI » (`CONTENU.md`, § `scripts/veille.sh`). Un passage dure « 10 à 15 min avec les E2E » (en-tête de `boucle.sh`) : avec une limite de 30 et une marge de 15, aucun passage ne commencerait après la quinzième minute, et une CI plus longue serait coupée en plein passage ;
   - la veille du Relecteur peut durer 25 minutes parce qu'elle ne fait aucun geste (`relecteur/SKILL.md`, ligne 90 : « une passe, sans aucun geste ») ; celle du capitaine lance la boucle, qui fusionne ;
   - une veille de 25 minutes réveille la session trois fois plus souvent (une fois par 25 minutes au lieu d'une par 75), chaque réveil coûtant un tour.

   Le risque qui reste : une session qui oublie le `timeout`. Sa veille meurt à 30 minutes sans ligne finale ; c'est le défaut 3, dont la suite (décision 7) termine la boucle orpheline et relance.
3. **Le skill dit la raison au lancement** : sans ce `timeout`, l'outil arrête la tâche à 30 minutes, sans ligne finale, au milieu d'un passage ; la veille compte sur deux heures. L'en-tête de `veille.sh` dit la même chose (« Échéance »), et la puce `VEILLE FINIE` parle de « la limite de 2 h du `timeout` ».

### La veille morte : un verrou, un état écrit, `--etat`

4. **`veille.sh` tient un verrou à lui**, `<git-common-dir>/veille.verrou` (`flock -w 3` sur le descripteur 7, gardé jusqu'à la sortie). Une seconde veille sort en 9 après 3 s (l'attente d'un `--etat` en cours, qui tient ce verrou le temps de sa lecture, décision 6 ; sans elle, un `--etat` lancé pendant le démarrage faisait refuser une veille seule, 3 à 5 fois sur 40 dans la relecture) : « `VEILLE ARRÊTÉE <hh:mm> : une veille tourne déjà (<verrou>) : une seule à la fois, « veille.sh --etat »` », sans lancer de boucle ni toucher l'état. Aucun fils qui peut survivre à la veille n'hérite du descripteur : la boucle, `tee`, `file.sh`, le `sleep` de la pause, le `git fetch`, le `sleep` entre deux essais du fetch et la commande de préparation sont lancés avec `7>&-`, et les sous-shells de la sonde (`$(exec 7>&-; etat_file)`) et de la préparation (`(exec 7>&- 8>&-; cd … && sh -c …)`) ferment le descripteur d'abord : sinon ils le gardent pendant toute la sonde ou toute la préparation, et une veille tuée là se lit vivante (relecture, constat 2). Raison : un démon laissé par un passage (PostgreSQL de `demarrer-local.sh`, le couplage fragile que l'en-tête de `boucle.sh` nomme pour son descripteur 9), ou un `sleep` orphelin quand l'outil ne tue que le `bash` de la veille, garderaient le verrou et feraient croire la veille vivante.
5. **`veille.sh` écrit son état**, `<git-common-dir>/veille.etat` : « `lancee <epoch>` » dès le verrou pris, puis « `fin <epoch> <ligne finale>` » avec sa ligne finale. Toute fin d'après le verrou passe par une seule fonction, `finir <code> <ligne>`, qui écrit l'état, puis la ligne au journal, puis sort : `VEILLE FINIE` (durée ou échéance), `VEILLE ARRÊTÉE` de la boucle (son code) et de la préparation (13). Les refus d'usage d'avant le verrou (sortie 64 : `CAPITAINE_ID`, une option) n'écrivent rien. Une veille tuée n'écrit pas sa fin : l'état reste « `lancee` ». Le répertoire commun, hors de l'arbre de travail, survit au redémarrage de la machine (c'est là que la préparation garde déjà son `capitaine-boot-id`).
6. **`veille.sh --etat`**, depuis le worktree, sans `CAPITAINE_ID` ni réseau, n'écrit rien (hors le fichier du verrou, créé s'il manque) et dit, dans cet ordre, l'état lu verrou tenu (pris sur le descripteur 7 le temps de la lecture : aucune veille ne l'écrit entre la lecture et le verdict ; lu avant, une veille qui finissait se lisait morte) :

   | Ligne | Sortie | Quand |
   | --- | --- | --- |
   | `VEILLE VIVANTE (lancée à <hh:mm>)` | 0 | une veille tient le verrou |
   | `VEILLE TERMINÉE : arrêt demandé (<git-common-dir>/boucle-arret, posé le <date>) ; « veille.sh --reprendre » quand on veut repartir` | 2 | le fichier d'arrêt de `boucle.sh --arreter` est posé |
   | `VEILLE TERMINÉE : <ligne finale>` | 2 | la fin est écrite |
   | `VEILLE MORTE (lancée à <hh:mm>, sans ligne finale) : « boucle.sh --arreter », puis la relancer avec --reprendre` | 1 | rien de cela ; « `(aucune trace de veille)` » sans état, ou un état illisible |

   L'arrêt demandé passe avant la fin écrite et avant la veille morte : un arrêt posé par un humain (ou par le capitaine avant une action à la main, « Enseignements ») n'est jamais levé par un réveil de garde. `--etat` suivi d'un argument : sortie 64.

### La suite d'une veille morte : `--arreter`, puis `--reprendre`

7. **Une fin sans ligne finale est une veille morte**, quatrième puce de la liste des fins : « **Aucune de ces lignes** (l'outil a arrêté la tâche, hors un `TaskStop` joué par la session elle-même ; le conteneur a redémarré) : une veille morte, jamais une fin sans suite : « Réveil de garde », points 1 à 3, tout de suite. » Le `TaskStop` de la session est exclu : c'est le geste d'avant une action à la main, que la session suit de `boucle.sh --arreter` (« Enseignements »).
8. **`boucle.sh --arreter` avant de relancer**, depuis le worktree mais **la copie** (`<scratchpad>/outils/boucle.sh`) : une boucle orpheline tiendrait le verrou (la veille relancée sortirait en 9), et le worktree peut être resté sur la branche d'une PR (jouer son `boucle.sh` serait jouer le code de la PR). La trappe de la boucle tuée remet le worktree propre. `--arreter` en échec (sortie 1, des processus tiennent encore le verrou après KILL) : le dire au lanceur, ne rien relancer.
9. **`veille.sh --reprendre`** : `--arreter` pose le fichier d'arrêt, que la boucle refuse (sortie 10). Avec `--reprendre`, la veille, son verrou pris, prend un instant celui de la boucle (`boucle.verrou`, descripteur 8) : libre, elle retire le fichier, **avant sa préparation** ; tenu, `VEILLE ARRÊTÉE <hh:mm> : une boucle tient le verrou (<verrou>) : fichier d'arrêt gardé ; « boucle.sh --arreter », puis --reprendre`, sortie 9. La boucle ne reçoit jamais `--reprendre`, à aucun lancement (`A-194`, point 1) : la veille a déjà retiré le fichier, et un `--reprendre` transmis ne pouvait plus que défaire un arrêt demandé pendant le démarrage, qui reste donc posé. Raisons : `boucle.sh --reprendre` à la main lancerait une boucle au premier plan, que l'outil Bash coupe à 2 minutes par défaut (10 au plus), au milieu d'un passage ; et un fichier retiré par la seule boucle restait posé si la veille relancée par la garde mourait pendant sa préparation, ou s'y arrêtait en 13 : chaque garde suivante lisait « arrêt demandé » et ne faisait plus rien (`A-190`, point 1). Le paragraphe « **Reprendre** » du skill passe par la veille, et la sortie 10 dit « la veille relancée avec `--reprendre` ».

### Le réveil de garde

10. **Un réveil de garde** : au premier lancement de la veille dans la session, `send_later` (chargé par ToolSearch, `select:mcp__claude-code-remote__send_later`), `delay_minutes` `60`, `name` « Garde de la veille du capitaine », `message` « Réveil de garde : skill fusionner, « Réveil de garde » ». Raison : un message programmé survit au redémarrage du conteneur (description de `send_later` : « Delivery survives container restarts »), la tâche de fond non.
11. **Il ne se réarme qu'au réveil de garde**, jamais à un autre réveil : la recommandation du rédacteur du lot 5 disait « réarmé à chaque réveil », mais une veille finit toutes les 75 minutes et chaque fin est un réveil : les réveils de garde s'empileraient. Un seul attend à la fois. `send_later` absent (session locale) : pas de garde, le dire une fois au lanceur.
12. **À chaque réveil de garde, dans l'ordre** (mot pour mot dans le patch) : (1) la copie et le worktree présents, sinon `git worktree prune`, « Mise en place » et la copie, sans lancer la veille ; (2) `veille.sh --etat` : `VIVANTE`, rien ; `TERMINÉE`, la suite de sa ligne (`VEILLE FINIE` : la relancer telle quelle ; `VEILLE ARRÊTÉE` ou arrêt demandé : rien de plus, et seulement si cette suite n'a pas déjà été donnée : ce qui a été dit au lanceur ne se redit pas chaque heure) ; une autre sortie (64 : une copie d'avant `--etat`, les scripts du projet pas reposés) : pas de garde, le dire une fois au lanceur, ne plus réarmer, et après une fin sans ligne finale relancer la veille sans `--reprendre` (sinon `--reprendre` y sort en 64 aussitôt, une fin sans ligne finale, et la garde tourne en rond) ; `MORTE`, le point 3 ; (3) `boucle.sh --arreter` de la copie, puis la veille relancée par la seconde ligne de son bloc, **sans recopier** (le worktree peut être resté sur une PR, dont les scripts seraient copiés), avec `--reprendre` ; (4) réarmer.
13. **La puce « Sortie 9 »** sépare deux cas (`A-194`, point 2) : une autre veille tourne (`une veille tourne déjà`) : sa suite par `veille.sh --etat`, le point 2 du « Réveil de garde » ; une boucle tient le verrou sans veille qui la porte (une orpheline, ou un démon qui a hérité du descripteur) : le point 3 de la garde (`boucle.sh --arreter` de la copie, puis la veille relancée avec `--reprendre`), puis le dire au lanceur. Cela remplace « ne rien relancer avant de savoir laquelle », qui laissait la file sans service et personne de prévenu. Un verrou de la veille qui ne s'ouvre pas (`exec 7>>` en échec) sort en 6, « verrou de la veille illisible », pour `--etat` comme pour la veille, jamais `VEILLE VIVANTE`.

### Le journal en ajout

16. **Les deux commandes du skill qui lancent la veille ouvrent son journal en ajout**, `>> <scratchpad>/veille.log` (§ « Mise en place », paragraphe `CAPITAINE_ID`, et le bloc du § « Boucle »), et l'usage de l'en-tête de `veille.sh` le dit. Raison (`A-190`, point 3) : une seconde veille, qui sort en 9, ouvrait le journal par `>` et le tronquait ; les écritures de la première se mêlaient à sa ligne de refus, et la dernière ligne devenait illisible (relecture, essai E13). Le passage en ajout était déjà noté par le ticket 20 (« Le journal de la veille écrasé à la relance »).

### Les bancs

14. **Les comportements** sont tenus dans `veille.test.mjs` (doublures de `boucle.sh` et `file.sh`) et, pour `--reprendre` avec la vraie boucle, dans `une-sous-pr-a-la-fois.test.mjs` (dépôt jouet et faux GitHub du skill `sujet`).
15. **Les phrases sont tenues à leur place** par un banc neuf, `scripts/veille-du-capitaine.test.mjs` : le `timeout` dans le paragraphe qui lance la veille et avant sa commande ; le journal en ajout dans ce paragraphe et dans la commande, et aucune commande du skill qui le tronque ; le paragraphe « **Reprendre** » par la veille et la sortie 10 ; le nom de la garde (que `list_triggers` retrouvera, `A-187` point 3) ; au point 2, l'autre sortie (64) et « seulement si elle n'a pas déjà été donnée » ; au point 3, la relance sans recopier ; la quatrième puce après les trois lignes finales ; le réveil de garde entre la liste des fins et « Suivre le journal », avant « **Sans veille en cours** », avec ses quatre points dans l'ordre ; et les états que le skill nomme sont ceux qu'écrit `--etat`, chacun avec sa sortie. Un banc à lui plutôt qu'un test de plus dans `scripts/depot.test.mjs` : aucun autre ticket ouvert ne l'écrit, et le lot 6b, qui récrira `fusionner/SKILL.md`, saura quel banc suivre.

## À faire, dans l'ordre

### § 0 — Partir de `main`, et la règle de repli

`git fetch origin main`, une branche depuis `origin/main`. Les annexes se lisent sous `docs/issues/gouverner-nos-boucles/issues/74-annexes/` de `main` si la PR de documentation y est entrée, sinon sur la branche de documentation du programme ; les écrire dans le scratchpad, jamais dans le dépôt. Vérifier l'empreinte : `sha256sum <scratchpad>/ticket-74.patch` rend `c5608c9b6ee2fe288d39666e9665355e59c15bc15d24712c93a84eefc2d4670f` (le patch retouché d'`A-190`, celui de l'en-tête ; `6b3b5368…` était sa première version). Ce qui est entré dans `main` (PR 150, `37233f8`) : ce patch, puis les retouches du premier tour de sa contre-relecture, [`74-annexes/contre-relecture-fb0ecb0/retouches-tour-1.patch`](74-annexes/contre-relecture-fb0ecb0/retouches-tour-1.patch) (sha256 `5229b6d04596cd1c61d8039680c0d6e7bd0f617af191afd3bcd4ed6e2686e3de`, `A-194`) : les décisions 9 et 13, « Surfaces » et « Mutations » disent l'arbre entré.

- `main` encore à `25a72c7` : `git apply <scratchpad>/ticket-74.patch` pose tout, version 7.38.1 comprise.
- `main` a bougé (les PR A, B ou du lot 5 entrées) : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md <scratchpad>/ticket-74.patch`, puis, à la main, la version de `.claude-plugin/plugin.json` sur **la suivante de `main`** (le troisième nombre plus un : 7.39.1 si `main` est à 7.39.0), et la note du patch (son texte entier, sous `## <version> — <date du jour>`) avant la première note de `NOTES-DE-VERSION.md`. Un hunk qui ne s'applique pas hors de ces deux fichiers : s'arrêter et l'écrire à son lanceur, ne rien reprendre à la main.

### § 1 — Les bancs, rouges avant le code

Sur `main` sans le code, avec les seuls trois bancs du patch posés (`veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs`, `scripts/veille-du-capitaine.test.mjs`) : `node --test` sur ces trois fichiers, **17 rouges sur 63** (mesuré sur `25a72c7`) :

- `scripts/veille-du-capitaine.test.mjs` : ses 4 tests ;
- `veille.test.mjs` : 11 des 12 tests neufs et « démon lancé par la préparation » (son assertion neuve lit `--etat`, qui n'existe pas) ; le douzième, « une veille qui démarre pendant qu'un --etat tient le verrou l'attend… », est vert sans le code (une veille sans verrou ne refuse rien) : il tient l'attente de 3 s contre une régression ;
- `une-sous-pr-a-la-fois.test.mjs` : « veille.sh --reprendre après boucle.sh --arreter… ».

Puis le code : **63 verts sur 63**. Recopier les deux comptes dans la PR.

### § 2 — Le patch, fichier par fichier

**`veille.sh`.**

- En-tête : le paragraphe « Échéance » dit le plafond de l'outil et le `timeout` à 7200000 ; un paragraphe neuf, « Une veille à la fois, et son état » (le verrou, l'état, la table de `--etat`, `--reprendre`) ; l'usage nomme `--reprendre`, `--etat` et le `timeout`.
- `heure`, `heure_de`, `COMMUN`, `VERROU_VEILLE`, `ETAT_VEILLE` et `ARRET` remontent avant la vérification de `CAPITAINE_ID` ; le bloc `--etat` suit, puis la vérification, inchangée.
- `--reprendre` est une option sans valeur (`reprendre=1; shift; continue`) ; l'usage d'une option inconnue le nomme.
- Le bloc `--etat` : `lire_etat` (le mot, l'epoch, la ligne ; « lancée à » pour un `lancee` lisible), `exec 7>>"$VERROU_VEILLE"` et `flock -n 7` (tenu : `VIVANTE`, l'état relu pour l'heure), puis `lire_etat`, verrou tenu, et la table de la décision 6.
- Après `export BOUCLE_ECHEANCE` : dépôt git exigé (sortie 64), `flock` exigé (sortie 6, le code de la boucle sans `flock`), `exec 7>>"$VERROU_VEILLE"`, `flock -w 3 7` (sinon sortie 9), l'état « `lancee` », puis `finir`, puis, avec `--reprendre`, le retrait du fichier d'arrêt sous `boucle.verrou` (décision 9).
- `arreter_preparation`, la sortie non nulle de la boucle, l'échéance et la fin passent par `finir` ; leurs lignes ne changent pas.
- `lancer` passe `--reprendre` à son premier appel de la boucle seulement ; `7>&-` sur la boucle, `tee`, `file.sh`, `sleep`, `git fetch`, le `sleep` entre deux essais du fetch ; `exec 7>&-` en tête des sous-shells `$(… etat_file)` et de celui de la préparation (`exec 7>&- 8>&-`).

**`veille.test.mjs`.** La doublure de `boucle.sh` écrit ses arguments (`echo boucle "$@" >> arguments`), et `lancer` les rend (`arguments`). Tests neufs :

| Test | Ce qu'il tient |
| --- | --- |
| « --etat : MORTE sans trace, VIVANTE pendant la veille, TERMINÉE avec sa ligne finale… » | les trois états ; `--etat` lancé par la doublure pendant la boucle ; la fin écrite pour `VEILLE FINIE`, la sortie 3 de la boucle, la sortie 13 de la préparation et l'échéance ; sans `CAPITAINE_ID` ; rien d'écrit ; un argument de plus, 64 |
| « --etat : le fichier d'arrêt posé… passe avant la fin écrite et avant une veille morte » | l'ordre de la table ; un état illisible lu sans trace |
| « veille tuée pendant sa pause (kill -9…) » | aucune ligne finale, l'état reste `lancee`, `--etat` dit `MORTE` aussitôt alors que le `sleep` de 30 s vit encore (un `sleep` du `PATH` du banc note son pid, que le banc tue) |
| « un démon laissé par la boucle ou par file.sh… » | la boucle et `file.sh` n'héritent pas du verrou (démons écrivant hors du tube) |
| « veille tuée pendant que `tee` attend un démon de la boucle… » | `tee` n'hérite pas du verrou : un démon qui garde le tube fait attendre `tee`, et la veille avec lui ; tuée là, elle se lit `MORTE` |
| « une seconde veille pendant qu'une tourne : VEILLE ARRÊTÉE, sortie 9… » | la seconde ne lance rien et n'écrit pas l'état (un état témoin, « `lancee 1` », posé avant elle, reste) |
| « --reprendre : le premier lancement de la boucle seul reçoit --reprendre… » | `--reprendre`, puis rien ; sans l'option, rien ; `--reprendre oui`, 64 |
| « --reprendre : le fichier d'arrêt est retiré avant la préparation ; tuée pendant sa préparation… » | le fichier retiré dès la ligne `préparation (`, la veille tuée là se lit `MORTE`, jamais « arrêt demandé » (une préparation du contrat note son pid, que le banc tue) |
| « --reprendre : préparation en échec (13), le fichier d'arrêt déjà retiré… ; une boucle qui tient son verrou : sortie 9, fichier gardé » | la fin écrite du 13 se lit ; `boucle.verrou` tenu (`flock` autour de la veille) : sortie 9, fichier gardé, aucune boucle |
| « veille tuée pendant une sonde lente (file.sh) ou pendant sa préparation… » | les sous-shells de la lecture initiale de la file, de la sonde de la boucle de la veille et de la préparation ne gardent pas le verrou : `MORTE` aussitôt |
| « une veille qui démarre pendant qu'un --etat tient le verrou l'attend… » | `flock <verrou> sleep 1`, comme un `--etat` lent : la veille démarre après lui, sortie 0, une boucle |
| « --etat lit l'état sous le verrou de la veille… » | un `date` du `PATH`, appelé pour l'heure de « `lancee` », note que le verrou est tenu à ce moment |

Et dans « démon lancé par la préparation » : `--etat` sort en 2 après la veille, le démon de la préparation vivant.

**`une-sous-pr-a-la-fois.test.mjs`.** `veilleReelle(d, etapes, sondes, plus = [])`. Test neuf, avec la vraie boucle : `boucle.sh --arreter` sans boucle pose le fichier d'arrêt ; la veille relancée sans `--reprendre` sort en 10 (`VEILLE ARRÊTÉE … : la boucle est sortie en 10`), rien n'est fusionné ; avec `--reprendre`, le fichier est retiré, la sous-PR #80 entre, et `--etat` dit `VEILLE TERMINÉE : VEILLE FINIE`.

**`fusionner/SKILL.md`**, mot pour mot dans le patch : au § « Mise en place », `>>` dans la commande du paragraphe `CAPITAINE_ID` ; au § « Boucle », le paragraphe « **Reprendre** » (par la veille, jamais `boucle.sh --reprendre` au premier plan), le lancement « **en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `7200000`** (deux heures, son maximum) », son journal « ouvert en ajout (`>>` …) » et sa raison ; `>>` et `--reprendre (après une veille morte)` dans la commande ; la puce `VEILLE FINIE` (« la limite de 2 h du `timeout` ») ; la puce « Sortie 9 » et la sortie 10 ; la quatrième puce ; le paragraphe « **Réveil de garde.** » et ses quatre points.

**`references/CONTENU.md`**, § `scripts/veille.sh` : un paragraphe, « Trois défauts de la veille morte (ticket 74…) ».

**`scripts/veille-du-capitaine.test.mjs`** (neuf) : quatre tests (décisions 15 et 16).

**Version et note.** 7.38.1 sur `25a72c7` ; la note dit ce qui change et ce qu'un projet fait (mettre à jour le plugin ; reposer les scripts, `/maj-skills:fusionner poser`, puisque `veille.sh` change ; un capitaine en marche garde sa copie jusqu'à une nouvelle copie).

### § 3 — Livrer

Une PR vers `main`, titre `fix(fusionner): la veille du capitaine sous le timeout de l'outil, son état lu par un réveil de garde (plugin <version>)`. `Label: contre-revue`. Le ticket passe à `Status: Fait — PR <n> (…)` à la fusion, par l'architecte. Dans le corps : les rouges avant et les verts après (§ 1), le tableau des mutations, la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| Le lancement sous le `timeout` de 7200000, avec sa raison | `scripts/veille-du-capitaine.test.mjs`, premier test ; mutations T1, T2, T11 |
| Le journal en ajout, dans les deux commandes | le premier test ; T13 |
| « Reprendre » par la veille, et la sortie 10 | le deuxième test ; T15 |
| La quatrième puce, après les trois lignes finales | le deuxième test ; T3, T4 |
| La puce « Sortie 9 » en deux cas : une autre veille, sa suite par `--etat` ; une boucle sans veille, le point 3 de la garde, puis le lanceur prévenu | le deuxième test ; T10c, D6, Y3, Y4 |
| Le réveil de garde : sa place, `send_later` à 60 minutes, son nom et son message, armé au premier lancement seul et réarmé au seul réveil de garde, ses quatre points dans l'ordre, la copie vue au point 1, l'autre sortie (64) au point 2 entière, un arrêt demandé jamais levé par la garde, `--reprendre` et la relance sans recopier au point 3, le point 4 après chaque suite, aucun second `send_later` sans veille en cours | le troisième test ; T5 à T8, T9b, T12, T14, X1 à X6, D4, D5, D7 |
| Les états que nomme le skill sont ceux de `--etat`, avec leurs sorties | le quatrième test ; M15, M16 |
| Le verrou de la veille, une seule à la fois ; une veille qui démarre attend un `--etat` en cours | `veille.test.mjs`, « une seconde veille… », « une veille qui démarre pendant qu'un --etat… » ; M6, M12, M24, X10 |
| Un verrou de la veille qui ne s'ouvre pas : sortie 6, pour `--etat` comme pour la veille, jamais `VEILLE VIVANTE` | « un fichier du verrou de la veille qui ne s'ouvre pas… » ; D2, D3, Y1, Y2 |
| Aucun fils ne garde le verrou | « veille tuée pendant sa pause », « un démon laissé… », « veille tuée pendant que `tee` attend… », « démon lancé par la préparation », « veille tuée pendant une sonde lente… » ; M1, M2c, M3, M4, M5b, M22, M23, M26 |
| L'état écrit : `lancee`, qui remplace la fin d'une veille d'avant, puis la fin par `finir` | « --etat : MORTE sans trace… », « veille tuée pendant sa pause » ; M7 à M11, X7 |
| `--etat` : l'ordre, l'arrêt demandé, sans `CAPITAINE_ID`, l'état lu sous le verrou | « --etat : le fichier d'arrêt posé… », « --etat : MORTE sans trace… », « --etat lit l'état sous le verrou… » ; M13, M14, M17, M25 |
| `--reprendre` : le fichier retiré avant la préparation, sous le verrou de la veille, gardé si une boucle tient son verrou ; sans l'option, rien de retiré ; la boucle ne reçoit jamais `--reprendre`, et un arrêt posé pendant le démarrage reste posé | « --reprendre : le fichier d'arrêt est retiré… », « --reprendre : préparation en échec (13)… », « --reprendre : la veille retire le fichier d'arrêt, la boucle ne reçoit jamais --reprendre… », « une seconde veille… » ; avec la vraie boucle, `une-sous-pr-a-la-fois.test.mjs` ; M20, M21, D1, X8, X9, X10 |
| La version et la note | les tests de version de `scripts/depot.test.mjs` |

## Mutations

[`74-annexes/mutations.mjs`](74-annexes/mutations.mjs), depuis la racine d'un clone où le patch est appliqué : `node <scratchpad>/mutations.mjs [<nom>…]`. Chacune seule, le fichier remis après, sur les bancs qu'elle nomme ; journal : [`74-annexes/mutations.txt`](74-annexes/mutations.txt). Sur l'arbre entré (le patch et `retouches-tour-1.patch`), M2, M18, M19 et T10b sont introuvables : M2c et T10c les reprennent sur le texte retouché, D1 remplace M18 et M19 ; les retouches défaites (D1 à D7), les mutations de la contre-relecture (X1 à X10) et celles de son second tour (Y1 à Y4) s'y ajoutent, jouées par le relecteur ([`contre-relecture-fb0ecb0/mutations/`](74-annexes/contre-relecture-fb0ecb0/mutations/), [`second-tour-950f94e/mutations/sur-950f94e.txt`](74-annexes/contre-relecture-fb0ecb0/second-tour-950f94e/mutations/sur-950f94e.txt)).

| Mutation | Bancs | Issue |
| --- | --- | --- |
| M1 veille.sh : le `sleep` de la pause hérite du verrou de la veille | `veille.test.mjs` | rouge (49 s) |
| M2 veille.sh : la boucle hérite du verrou de la veille | `veille.test.mjs` | rouge (49 s) ; introuvable sur l'arbre entré, reprise en M2c |
| M2c veille.sh : la boucle hérite du verrou de la veille (M2 sur le texte retouché) | `veille.test.mjs` | rouge (49 s, sur `950f94e`) |
| M3 veille.sh : `tee` hérite du verrou de la veille | `veille.test.mjs` | rouge (49 s) |
| M4 veille.sh : file.sh hérite du verrou de la veille (lecture initiale) | `veille.test.mjs` | rouge (49 s) |
| M5b veille.sh : la commande de préparation hérite du verrou de la veille | `veille.test.mjs` | rouge (53 s) |
| M6 veille.sh : pas de verrou (une seconde veille démarre) | `veille.test.mjs` | rouge (49 s) |
| M7 veille.sh : l’état « lancee » n’est pas écrit | `veille.test.mjs` | rouge (51 s) |
| M8 veille.sh : la ligne finale n’est pas écrite dans l’état | `veille.test.mjs` | rouge (52 s) |
| M9 veille.sh : l’arrêt de la préparation n’écrit pas sa fin | `veille.test.mjs` | rouge (52 s) |
| M10 veille.sh : la fin à l’échéance n’écrit pas sa fin | `veille.test.mjs` | rouge (55 s) |
| M11 veille.sh : la boucle sortie en code non nul n’écrit pas sa fin | `veille.test.mjs` | rouge (52 s) |
| M12 veille.sh : l’état écrit avant le verrou (une seconde veille l’écrase) | `veille.test.mjs` | rouge (54 s) |
| M13 veille.sh --etat : le fichier d’arrêt n’est pas lu | `veille.test.mjs` | rouge (53 s) |
| M14 veille.sh --etat : la fin écrite lue avant le fichier d’arrêt | `veille.test.mjs` | rouge (52 s) |
| M15 veille.sh --etat : VIVANTE sort en 1 | `veille.test.mjs`, `veille-du-capitaine.test.mjs` | rouge (49 s) |
| M16 veille.sh --etat : MORTE sort en 2 | `veille.test.mjs`, `veille-du-capitaine.test.mjs` | rouge (49 s) |
| M17 veille.sh --etat : exige CAPITAINE_ID | `veille.test.mjs` | rouge (46 s) |
| M18 veille.sh : --reprendre transmis à chaque lancement de la boucle | `veille.test.mjs` | rouge (51 s) ; sans objet sur l'arbre entré (la boucle ne reçoit plus `--reprendre`) : D1 la remplace |
| M19 veille.sh : --reprendre jamais transmis | `veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs` | rouge (383 s) ; sans objet sur l'arbre entré : c'est son comportement voulu (`A-194`, point 1) |
| M20 veille.sh : --reprendre ne retire plus le fichier d’arrêt avant la préparation | `veille.test.mjs` | rouge (50 s) |
| M21 veille.sh : --reprendre retire le fichier d’arrêt même quand une boucle tient son verrou | `veille.test.mjs` | rouge (50 s) |
| M22 veille.sh : la lecture initiale de la file garde le descripteur 7 dans son sous-shell | `veille.test.mjs` | rouge (49 s) |
| M26 veille.sh : la sonde de la boucle de la veille garde le descripteur 7 dans son sous-shell | `veille.test.mjs` | rouge (50 s) |
| M23 veille.sh : le sous-shell de la préparation garde le descripteur 7 | `veille.test.mjs` | rouge (49 s) |
| M24 veille.sh : la veille n’attend pas un --etat en cours (flock -n) | `veille.test.mjs` | rouge (47 s) |
| M25 veille.sh --etat : l’état lu avant le verrou | `veille.test.mjs` | rouge (49 s) |
| T1 SKILL.md : le timeout dit après la commande de la veille, plus dans le paragraphe qui la lance | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T2 SKILL.md : le `timeout` à 600000 au lieu de 7200000 | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T3 SKILL.md : la puce « Aucune de ces lignes » avant celle de la sortie 13 | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T4 SKILL.md : la puce « Aucune de ces lignes » retirée | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T5 SKILL.md : le réveil de garde déplacé après le suivi du journal | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T6 SKILL.md : le réveil de garde réarmé à chaque réveil | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T7 SKILL.md : la garde à 120 minutes | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T8 SKILL.md : les points 2 et 3 du réveil de garde échangés | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T9b SKILL.md : `--reprendre` retiré du point 3, et la relance recopie | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T10b SKILL.md : la sortie 9 ne nomme plus une autre veille, ni la suite par --etat | `veille-du-capitaine.test.mjs` | rouge (0 s) ; introuvable sur l'arbre entré, reprise en T10c |
| T10c SKILL.md : la sortie 9 ne nomme plus une autre veille, ni la suite par --etat (T10b sur le texte retouché) | `veille-du-capitaine.test.mjs` | rouge (0 s, sur `950f94e`) |
| T11 veille.sh : l’en-tête ne dit plus le timeout | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T12 SKILL.md : la garde perd son nom | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T13 SKILL.md : la commande de la veille tronque son journal (`>`) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T14 SKILL.md : le point 2 sans suite pour une autre sortie (64) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T15 SKILL.md : « Reprendre » rejoue boucle.sh --reprendre | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| D1 veille.sh : la première boucle reçoit encore --reprendre (fb0ecb0) | `veille.test.mjs` | rouge (51 s, sur `950f94e`) |
| D2 veille.sh --etat : un verrou qui ne s’ouvre pas se lit VEILLE VIVANTE (fb0ecb0) | `veille.test.mjs` | rouge (50 s) |
| D3 veille.sh : un verrou qui ne s’ouvre pas se lit « une veille tourne déjà » (fb0ecb0) | `veille.test.mjs` | rouge (49 s) |
| D4 SKILL.md : point 2, la garde ne dit plus qu’un arrêt demandé ne se lève jamais (fb0ecb0) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| D5 SKILL.md : point 4, « Réarmer » sans dire qu’il suit chaque suite (fb0ecb0) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| D6 SKILL.md : la sortie 9 d’une boucle renvoyée à --etat (fb0ecb0) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| D7 SKILL.md : sans veille en cours, un second send_later à côté de la garde (fb0ecb0) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X1 SKILL.md : la garde armée à chaque lancement de la veille (les réveils de garde s’empilent) | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X2 SKILL.md : point 2, un arrêt demandé levé par la garde | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X3 SKILL.md : point 2, une copie d’avant --etat relancée avec --reprendre | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X4 SKILL.md : point 2, une copie d’avant --etat, la garde réarmée | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X5 SKILL.md : la garde sans son message | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X6 SKILL.md : point 1, la copie manquante n’est plus vue | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| X7 veille.sh : l’état « lancee » ajouté au lieu de remplacer la fin d’avant | `veille.test.mjs` | rouge (49 s) |
| X8 veille.sh : toute veille retire le fichier d’arrêt, --reprendre ou pas | `veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs` | rouge (359 s) |
| X9 veille.sh : --reprendre garde boucle.verrou ouvert (descripteur 8) | `veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs` | rouge (353 s) |
| X10 veille.sh : --reprendre retire le fichier d’arrêt avant le verrou de la veille | `veille.test.mjs` | rouge (50 s) |
| Y1 veille.sh --etat : le contrôle du verrou ouvert lit le descripteur 8 (une veille vivante se lit « verrou illisible ») | `veille.test.mjs` | rouge (47 s) |
| Y2 veille.sh : un verrou de la veille illisible sort en 9, comme une seconde veille | `veille.test.mjs` | rouge (50 s) |
| Y3 SKILL.md : sortie 9 d’une boucle sans veille, le lanceur n’est plus prévenu | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| Y4 SKILL.md : sortie 9 d’une autre veille, le point 3 (sa boucle arrêtée en plein passage) | `veille-du-capitaine.test.mjs` | rouge (0 s) |

Sur le patch seul : 41 rouges sur 41, de 0 à 383 secondes chacune. Sur l'arbre entré, celui de `950f94e` (64c2c2a5…), que la PR 150 a fait entrer : les 37 trouvées de l'annexe, M2c, T10c, D1 à D7, X1 à X10 et Y1 à Y4, toutes rouges (60). Deux mutations sont vues vertes en écrivant ce ticket : M12 (l'état écrit avant le verrou), dont le test « une seconde veille… » ne lisait que l'état de fin, et qui pose désormais un état témoin avant la seconde veille ; et, à la relecture, le nom de la garde, que le banc des textes n'exigeait pas (T12). M5, T9 et T10 changent de cible avec les retouches de la relecture (M5b, T9b, T10b), M6 et M12 suivent le `flock -w 3`, et M4 aussi : la lecture initiale ferme le descripteur dans son sous-shell, si bien que `file.sh` n'en hérite plus que si les deux `7>&-` tombent ensemble ; M20 à M26 et T12 à T15 tiennent ces retouches.

## Vérification

1. § 1 : 17 rouges sur 63 avant le code, 63 verts après.
2. Les mutations : `node <scratchpad>/mutations.mjs` depuis la racine, « toutes rouges » (41).
3. `node --test scripts/depot.test.mjs scripts/relecteur.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs` vert (la version, la note, les textes des autres skills qui lisent `fusionner/SKILL.md`, `CAPITAINE_ID`).
4. La suite entière, `pnpm test`, d'un seul tenant, avec son compte, sa durée et la charge (`uptime` avant et après) : **1 296 tests, 1 296 verts** sur `25a72c7` avec le patch (1 279 à `25a72c7`, plus 17 cas : 12 dans `veille.test.mjs`, 1 dans `une-sous-pr-a-la-fois.test.mjs`, 4 dans le banc neuf).
5. `git diff --stat origin/main` : les huit fichiers, et eux seuls (545 lignes ajoutées, 38 retirées sur `25a72c7`).

### Ce qui a été joué en écrivant ce ticket

Le patch retouché (`A-190`), sur un clone neuf de `https://github.com/MAJ-agency/skills` à `25a72c7` (plugin 7.38.0), le 2026-11-22, Node 22.23.5, git 2.43.0, bash 5.2.21, quatre cœurs (d'autres agents travaillaient sur la machine) :

- **Le patch** : `git apply --check` puis `git apply` sur `25a72c7` ; l'arbre obtenu est celui d'où le patch est tiré. Et sur un worktree neuf de `25a72c7` : `ticket-67-68-69.patch`, puis `ticket-70.patch` et `71-73-annexes/lot-5.patch` (sha256 `4e97a67c…`), chacun avec `--exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md`, puis `git apply --check` du patch avec les mêmes `--exclude` : il s'applique (sans eux, seuls ces deux fichiers refusent). Sur cette chaîne, le patch posé : les trois bancs, `depot`, `relecteur` et `fusionner.test`, **248 sur 248**.
- **Les bancs avant le code** (§ 1, les trois bancs seuls posés) : **17 rouges sur 63** (6 min 09 s) ; après : **63 verts sur 63**.
- **Les mutations** : les 41 de l'annexe, chacune seule, sur le clone avec le patch : **41 rouges sur 41** : 40 en une passe (de 01:32 à 02:00 UTC ; M19 joue aussi `une-sous-pr-a-la-fois.test.mjs`), puis T10b seule, sur le même clone, sa cible ayant changé après la passe (T10 y était introuvable sur le texte retouché) ; le fichier remis après chacune, l'arbre vérifié identique au patch après chaque passe.
- **La suite entière**, les quatre motifs de `pnpm test` joués par `node --test`, d'un seul tenant, en tâche de fond avec un `timeout` explicite : **1 296 tests, 1 296 verts**, aucun échec, sauté ni annulé ; 13 min 28 s (01:06:52 → 01:20:20 UTC, `duration_ms` 807676), charge 0,08 au départ, 0,94 à la fin, notée aux bords seulement.
- La première version du patch (sha256 `6b3b5368…`) avait été jouée de même le 2026-11-21 (13 rouges sur 58, 58 verts, 30 mutations rouges, 1 291 tests verts) ; sa relecture est dans `74-annexes/relecture-tour-1/`.

## Questions à l'architecte

Tranchées : les cinq par `A-187`, sur ces recommandations ; les trois de la relecture par `A-190` (oui aux trois : R1, l'orpheline interrompue au point 3, le journal en ajout dans ce ticket).

1. **Le réveil de garde réarmé au seul réveil de garde, pas « à chaque réveil »** (décision 11). La recommandation du lot 5 disait « réarmé à chaque réveil » ; écrit ainsi, une veille de 75 minutes et une garde de 60 empilent les réveils programmés, puisque `send_later` ne remplace pas le précédent. **Recommandation : garder** ce que le patch écrit, un seul réveil de garde en attente, la chaîne garde → garde.
2. **La garde continue de sonner, une fois par heure, quand la veille est arrêtée à dessein** (`VEILLE ARRÊTÉE`, arrêt demandé) : un tour court par heure. Autre choix : ne pas réarmer quand `--etat` dit `TERMINÉE`, et réarmer à la relance ; deux règles au lieu d'une. **Recommandation : garder** une seule règle.
3. **Une garde qui sonne dans une session de capitaine archivée.** Rien n'efface le réveil de garde quand l'architecte arrête un capitaine (fin de chantier, ou capitaine remplacé) : il réveillerait une session qu'on croit finie. Le patch n'en dit rien. **Recommandation :** dans la partie 6b, qui récrit `fusionner/SKILL.md` et `chantier/SKILL.md` avec l'archivage des sessions (`A-87`, `P-62`), le capitaine note le `trigger_id` que rend chaque `send_later`, et celui qui l'archive l'efface (`delete_trigger`) avant ; à défaut, `list_triggers` le retrouve par son nom, « Garde de la veille du capitaine ».
4. **`send_later` chargé par le skill, pas par le gabarit de lancement.** La ligne « Outils : » du capitaine (`architecte/references/lancement.md`) ne charge que `send_message`. Le patch fait charger `send_later` par le skill, au premier lancement de la veille, pour un capitaine lancé sans l'architecte aussi. **Recommandation : garder**, et ne pas toucher `lancement.md` ici (le banc `scripts/relecteur.test.mjs` y compare des lignes du capitaine et du Relecteur, que la PR A change).
5. **La version, troisième nombre** (7.38.1 sur `25a72c7`). Deux options neuves d'un script posé (`--etat`, `--reprendre`) ; aucune clé de contrat ni aucun comportement d'un projet ne change sans repose. **Recommandation : le troisième nombre**, comme le ticket 65 pour un script posé corrigé.

## Ce qui n'a pas été établi

- **Ce que l'outil Bash tue au plafond** : le `bash` de la veille seul, ou son groupe de processus. Les deux cas sont couverts : `--arreter` termine une boucle orpheline, et `7>&-` empêche un `sleep` ou un démon orphelin de tenir la veille pour vivante. Ni l'un ni l'autre n'est joué contre l'outil lui-même : le banc tue la veille par `kill -9`.
- **Ce qui survit à un recyclage de la machine** : le patch suppose que le répertoire commun du clone de la session survit (la préparation y garde déjà `capitaine-boot-id` : « Deux défauts vécus chez Iroki », `CONTENU.md`) et que le scratchpad peut disparaître (le point 1 du réveil de garde). Aucun recyclage n'a été provoqué.
- **Le `7>&-` du `git fetch`, et celui du `sleep` entre deux essais**, ne sont tenus par aucun banc : un `git gc --auto` détaché, qui hériterait du premier, ne s'est pas laissé provoquer simplement, et le second ne garderait le verrou que 5 à 10 s ; ils sont posés par symétrie avec `boucle.sh` (`gc.autoDetach`) et avec les autres fils.
- **Une veille relancée par une ancienne copie** (`<scratchpad>/outils/` d'avant ce ticket, ou les scripts d'un projet pas reposés) n'a ni `--etat` ni `--reprendre` (sortie 64) : le point 2 de la garde le dit (pas de garde, le lanceur prévenu une fois), mais aucun banc ne joue une ancienne copie contre le texte.
- **Les courses de `--etat`** (une veille qui démarre ou qui finit pendant sa lecture) sont tenues par deux bancs déterministes (un verrou tenu par `flock … sleep 1`, un `date` du `PATH` qui note le verrou) ; les courses elles-mêmes n'ont été mesurées que dans la relecture, sur un jouet (`74-annexes/relecture-tour-1/`, essais E7 et E8).
- **La relance sans recopier** (point 3) suppose une copie faite depuis un worktree sur `origin/develop` : au premier lancement, ou au point 1 depuis un worktree neuf. Une copie faite plus tôt depuis un worktree resté sur une PR n'est pas détectée.
- **Le banc des textes tient des places, pas une conduite** : il garantit que le skill dit la suite où elle se lit, pas qu'une session Sonnet la suive.

## Hors périmètre

- La veille du Relecteur (`relecteur.mjs veille`) : déjà sous le plafond (`A-180`).
- `boucle.sh`, `file.sh`, `passer.sh` : inchangés ; `--arreter` et `--reprendre` gardent leur sens.
- Le gabarit de lancement du capitaine (`architecte/references/lancement.md`), et l'archivage des sessions (partie 6b, question 3).
- Le point 1 de la garde quand seule la copie manque (« Mise en place » refait un worktree qui existe déjà), et une garde armée deux fois par une session compactée qui ne se souvient plus de l'avoir armée : partie 6b, avec le `trigger_id` de la garde (`A-187` point 3, `A-190` point 4 ; relecture, mineur 12).

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur `A-185` (point 7), `A-180` (point 1), le ticket 73 (« Le ticket à part recommandé ») et la passation du 2026-11-19 ; bancs, mutations et suite joués sur un clone neuf de `25a72c7` (« Vérification »).
- 2026-11-22 — Relu en un tour (`74-annexes/relecture-tour-1/rapport.md`, « prêt après retouches », un bloquant) ; retouches d'`A-190` portées par le relecteur : `ticket-74.patch` neuf (R1 à R4, les textes des constats 3, 4, 5 et 9, le journal en ajout, le nom de la garde), `mutations.mjs` à 40 mutations (M5 et T9 changent de cible, M5b et T9b) ; bancs, mutations et suite rejoués sur un clone neuf de `25a72c7`.
- 2026-11-22 — Après la fusion (`A-194`, point 4 ; mineur 10 de la contre-relecture de la PR 150) : l'empreinte du § 0 (celle du patch retouché, `c5608c9b…`), les décisions 9 et 13, « Surfaces » et « Mutations » disent l'arbre entré, `retouches-tour-1.patch` compris. Documentation seule, par le rédacteur des tickets 75 à 79.
