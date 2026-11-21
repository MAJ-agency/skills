# La veille du capitaine ne meurt plus en silence : lancée sous le plafond de l'outil Bash, une fin sans ligne finale a sa suite, un réveil de garde voit la veille morte avec son conteneur

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — trois défauts de la veille du capitaine (`A-185`, point 7 ; `A-180`, point 1), chacun avec sa décision et son banc ; le code entier est dans le patch ([`74-annexes/ticket-74.patch`](74-annexes/ticket-74.patch), `git apply` sur `25a72c7`, plugin 7.38.0), décrit fichier par fichier ci-dessous ; les bancs neufs ou changés sont rouges avant le code et verts après, les mutations de [`74-annexes/mutations.mjs`](74-annexes/mutations.mjs) sont toutes rouges, la suite entière est verte (« Vérification »). Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
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

`A-185`, point 9 : « Le ticket 74 passe après le lot 5 s'il touche les mêmes fichiers, sinon après la PR B. » Il n'en touche aucun, hors des deux fichiers de version : il passe **après la PR B** (ticket 70), et peut partir avant le lot 6, qui récrira `fusionner/SKILL.md` (6b) sur le `main` qu'il trouvera. Vérifié : le patch s'applique sur `25a72c7` seul, et sur `25a72c7` plus les patchs des tickets 67 à 69, 70 et 71 à 73 (dans cet ordre, les deux fichiers de version exclus des deux derniers) avec `--exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md`.

## Où

- `skills/chaine/fusionner/scripts/veille.sh` : l'en-tête (l'échéance, « Une veille à la fois, et son état », l'usage) ; `--etat` avant la vérification de `CAPITAINE_ID` ; l'option `--reprendre` ; le verrou `veille.verrou` et l'état `veille.etat` ; la fonction `finir`, par où passe chaque ligne finale ; `7>&-` sur chaque fils qui peut survivre à la veille.
- `skills/chaine/fusionner/scripts/veille.test.mjs` : la doublure de `boucle.sh` note ses arguments ; sept tests neufs ; une assertion de plus dans « démon lancé par la préparation ».
- `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` : `veilleReelle` prend des options de plus ; un test neuf avec la vraie boucle.
- `skills/chaine/fusionner/SKILL.md`, § « Boucle » : le lancement de la veille, la ligne de sa commande, la puce « Sortie 9 », une quatrième puce, le paragraphe « **Réveil de garde.** » et ses quatre points, la puce `VEILLE FINIE`.
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

4. **`veille.sh` tient un verrou à lui**, `<git-common-dir>/veille.verrou` (`flock -n` sur le descripteur 7, gardé jusqu'à la sortie). Une seconde veille sort aussitôt en 9 : « `VEILLE ARRÊTÉE <hh:mm> : une veille tourne déjà (<verrou>) : une seule à la fois, « veille.sh --etat »` », sans lancer de boucle ni toucher l'état. Aucun fils qui peut survivre à la veille n'hérite du descripteur : la boucle, `tee`, `file.sh`, le `sleep` de la pause, le `git fetch` et la commande de préparation sont lancés avec `7>&-`. Raison : un démon laissé par un passage (PostgreSQL de `demarrer-local.sh`, le couplage fragile que l'en-tête de `boucle.sh` nomme pour son descripteur 9), ou un `sleep` orphelin quand l'outil ne tue que le `bash` de la veille, garderaient le verrou et feraient croire la veille vivante.
5. **`veille.sh` écrit son état**, `<git-common-dir>/veille.etat` : « `lancee <epoch>` » dès le verrou pris, puis « `fin <epoch> <ligne finale>` » avec sa ligne finale. Toute fin d'après le verrou passe par une seule fonction, `finir <code> <ligne>`, qui écrit l'état, puis la ligne au journal, puis sort : `VEILLE FINIE` (durée ou échéance), `VEILLE ARRÊTÉE` de la boucle (son code) et de la préparation (13). Les refus d'usage d'avant le verrou (sortie 64 : `CAPITAINE_ID`, une option) n'écrivent rien. Une veille tuée n'écrit pas sa fin : l'état reste « `lancee` ». Le répertoire commun, hors de l'arbre de travail, survit au redémarrage de la machine (c'est là que la préparation garde déjà son `capitaine-boot-id`).
6. **`veille.sh --etat`**, depuis le worktree, sans `CAPITAINE_ID` ni réseau, n'écrit rien (hors le fichier du verrou que `flock` crée) et dit, dans cet ordre :

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
9. **`veille.sh --reprendre`** : `--arreter` pose le fichier d'arrêt, que la boucle refuse (sortie 10). Avec `--reprendre`, le premier lancement de la boucle est `boucle.sh --reprendre`, qui retire ce fichier une fois son verrou pris (sortie 9 et fichier gardé si une boucle le tient) ; les suivants, `boucle.sh` seul. Raison : `boucle.sh --reprendre` à la main lancerait une boucle au premier plan, hors de la veille et de son échéance ; la veille le fait en tâche de fond, sous le `timeout`.

### Le réveil de garde

10. **Un réveil de garde** : au premier lancement de la veille dans la session, `send_later` (chargé par ToolSearch, `select:mcp__claude-code-remote__send_later`), `delay_minutes` `60`, `name` « Garde de la veille du capitaine », `message` « Réveil de garde : skill fusionner, « Réveil de garde » ». Raison : un message programmé survit au redémarrage du conteneur (description de `send_later` : « Delivery survives container restarts »), la tâche de fond non.
11. **Il ne se réarme qu'au réveil de garde**, jamais à un autre réveil : la recommandation du rédacteur du lot 5 disait « réarmé à chaque réveil », mais une veille finit toutes les 75 minutes et chaque fin est un réveil : les réveils de garde s'empileraient. Un seul attend à la fois. `send_later` absent (session locale) : pas de garde, le dire une fois au lanceur.
12. **À chaque réveil de garde, dans l'ordre** (mot pour mot dans le patch) : (1) la copie et le worktree présents, sinon `git worktree prune`, « Mise en place » et la copie, sans lancer la veille ; (2) `veille.sh --etat` : `VIVANTE`, rien ; `TERMINÉE`, la suite de sa ligne (`VEILLE FINIE` : la relancer telle quelle ; `VEILLE ARRÊTÉE` ou arrêt demandé : rien de plus) ; `MORTE`, le point 3 ; (3) `boucle.sh --arreter` de la copie, puis la veille relancée avec `--reprendre` ; (4) réarmer.
13. **La puce « Sortie 9 »** dit aussi « ou une autre veille tourne (`une veille tourne déjà`) : ne rien relancer avant de savoir laquelle (`veille.sh --etat`) ».

### Les bancs

14. **Les comportements** sont tenus dans `veille.test.mjs` (doublures de `boucle.sh` et `file.sh`) et, pour `--reprendre` avec la vraie boucle, dans `une-sous-pr-a-la-fois.test.mjs` (dépôt jouet et faux GitHub du skill `sujet`).
15. **Les phrases sont tenues à leur place** par un banc neuf, `scripts/veille-du-capitaine.test.mjs` : le `timeout` dans le paragraphe qui lance la veille et avant sa commande ; la quatrième puce après les trois lignes finales ; le réveil de garde entre la liste des fins et « Suivre le journal », avant « **Sans veille en cours** », avec ses quatre points dans l'ordre ; et les états que le skill nomme sont ceux qu'écrit `--etat`, chacun avec sa sortie. Un banc à lui plutôt qu'un test de plus dans `scripts/depot.test.mjs` : aucun autre ticket ouvert ne l'écrit, et le lot 6b, qui récrira `fusionner/SKILL.md`, saura quel banc suivre.

## À faire, dans l'ordre

### § 0 — Partir de `main`, et la règle de repli

`git fetch origin main`, une branche depuis `origin/main`. Les annexes se lisent sous `docs/issues/gouverner-nos-boucles/issues/74-annexes/` de `main` si la PR de documentation y est entrée, sinon sur la branche de documentation du programme ; les écrire dans le scratchpad, jamais dans le dépôt. Vérifier l'empreinte : `sha256sum <scratchpad>/ticket-74.patch` rend `6b3b5368bd99063553a4e2ddae139eab53b51b0a6aa9891b612e3ba043d9312e`.

- `main` encore à `25a72c7` : `git apply <scratchpad>/ticket-74.patch` pose tout, version 7.38.1 comprise.
- `main` a bougé (les PR A, B ou du lot 5 entrées) : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md <scratchpad>/ticket-74.patch`, puis, à la main, la version de `.claude-plugin/plugin.json` sur **la suivante de `main`** (le troisième nombre plus un : 7.39.1 si `main` est à 7.39.0), et la note du patch (son texte entier, sous `## <version> — <date du jour>`) avant la première note de `NOTES-DE-VERSION.md`. Un hunk qui ne s'applique pas hors de ces deux fichiers : s'arrêter et l'écrire à son lanceur, ne rien reprendre à la main.

### § 1 — Les bancs, rouges avant le code

Sur `main` sans le code, avec les seuls trois bancs du patch posés (`veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs`, `scripts/veille-du-capitaine.test.mjs`) : `node --test` sur ces trois fichiers, **13 rouges sur 58** (mesuré sur `25a72c7`) :

- `scripts/veille-du-capitaine.test.mjs` : ses 4 tests ;
- `veille.test.mjs` : les 7 tests neufs et « démon lancé par la préparation » (son assertion neuve lit `--etat`, qui n'existe pas) ;
- `une-sous-pr-a-la-fois.test.mjs` : « veille.sh --reprendre après boucle.sh --arreter… ».

Puis le code : **58 verts sur 58**. Recopier les deux comptes dans la PR.

### § 2 — Le patch, fichier par fichier

**`veille.sh`.**

- En-tête : le paragraphe « Échéance » dit le plafond de l'outil et le `timeout` à 7200000 ; un paragraphe neuf, « Une veille à la fois, et son état » (le verrou, l'état, la table de `--etat`, `--reprendre`) ; l'usage nomme `--reprendre`, `--etat` et le `timeout`.
- `heure`, `heure_de`, `COMMUN`, `VERROU_VEILLE`, `ETAT_VEILLE` et `ARRET` remontent avant la vérification de `CAPITAINE_ID` ; le bloc `--etat` suit, puis la vérification, inchangée.
- `--reprendre` est une option sans valeur (`reprendre=1; shift; continue`) ; l'usage d'une option inconnue le nomme.
- Après `export BOUCLE_ECHEANCE` : dépôt git exigé (sortie 64), `flock` exigé (sortie 6, le code de la boucle sans `flock`), `exec 7>>"$VERROU_VEILLE"`, `flock -n 7` (sinon sortie 9), l'état « `lancee` », puis `finir`.
- `arreter_preparation`, la sortie non nulle de la boucle, l'échéance et la fin passent par `finir` ; leurs lignes ne changent pas.
- `lancer` passe `--reprendre` à son premier appel de la boucle seulement ; `7>&-` sur la boucle, `tee`, `file.sh`, `sleep`, `git fetch` et la commande de préparation.

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

Et dans « démon lancé par la préparation » : `--etat` sort en 2 après la veille, le démon de la préparation vivant.

**`une-sous-pr-a-la-fois.test.mjs`.** `veilleReelle(d, etapes, sondes, plus = [])`. Test neuf, avec la vraie boucle : `boucle.sh --arreter` sans boucle pose le fichier d'arrêt ; la veille relancée sans `--reprendre` sort en 10 (`VEILLE ARRÊTÉE … : la boucle est sortie en 10`), rien n'est fusionné ; avec `--reprendre`, le fichier est retiré, la sous-PR #80 entre, et `--etat` dit `VEILLE TERMINÉE : VEILLE FINIE`.

**`fusionner/SKILL.md`**, § « Boucle », mot pour mot dans le patch : le lancement « **en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `7200000`** (deux heures, son maximum) » et sa raison ; `--reprendre (après une veille morte)` dans le commentaire de la commande ; la puce `VEILLE FINIE` (« la limite de 2 h du `timeout` ») ; la puce « Sortie 9 » ; la quatrième puce ; le paragraphe « **Réveil de garde.** » et ses quatre points.

**`references/CONTENU.md`**, § `scripts/veille.sh` : un paragraphe, « Trois défauts de la veille morte (ticket 74…) ».

**`scripts/veille-du-capitaine.test.mjs`** (neuf) : quatre tests (décision 15).

**Version et note.** 7.38.1 sur `25a72c7` ; la note dit ce qui change et ce qu'un projet fait (mettre à jour le plugin ; reposer les scripts, `/maj-skills:fusionner poser`, puisque `veille.sh` change ; un capitaine en marche garde sa copie jusqu'à une nouvelle copie).

### § 3 — Livrer

Une PR vers `main`, titre `fix(fusionner): la veille du capitaine sous le timeout de l'outil, son état lu par un réveil de garde (plugin <version>)`. `Label: contre-revue`. Le ticket passe à `Status: Fait — PR <n> (…)` à la fusion, par l'architecte. Dans le corps : les rouges avant et les verts après (§ 1), le tableau des mutations, la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| Le lancement sous le `timeout` de 7200000, avec sa raison | `scripts/veille-du-capitaine.test.mjs`, premier test ; mutations T1, T2, T11 |
| La quatrième puce, après les trois lignes finales | le deuxième test ; T3, T4 |
| La puce « Sortie 9 » et `--etat` | le deuxième test ; T10 |
| Le réveil de garde : sa place, `send_later` à 60 minutes, réarmé au seul réveil de garde, ses quatre points dans l'ordre, `--reprendre` au point 3 | le troisième test ; T5 à T9 |
| Les états que nomme le skill sont ceux de `--etat`, avec leurs sorties | le quatrième test ; M15, M16 |
| Le verrou de la veille, une seule à la fois | `veille.test.mjs`, « une seconde veille… » ; M6, M12 |
| Aucun fils ne garde le verrou | « veille tuée pendant sa pause », « un démon laissé… », « veille tuée pendant que `tee` attend… », « démon lancé par la préparation » ; M1 à M5 |
| L'état écrit : `lancee`, puis la fin par `finir` | « --etat : MORTE sans trace… » ; M7 à M11 |
| `--etat` : l'ordre, l'arrêt demandé, sans `CAPITAINE_ID` | « --etat : le fichier d'arrêt posé… », « --etat : MORTE sans trace… » ; M13, M14, M17 |
| `--reprendre` au premier lancement seul | « --reprendre : le premier lancement… » ; avec la vraie boucle, `une-sous-pr-a-la-fois.test.mjs` ; M18, M19 |
| La version et la note | les tests de version de `scripts/depot.test.mjs` |

## Mutations

[`74-annexes/mutations.mjs`](74-annexes/mutations.mjs), depuis la racine d'un clone où le patch est appliqué : `node <scratchpad>/mutations.mjs [<nom>…]`. Chacune seule, le fichier remis après, sur les bancs qu'elle nomme ; journal : [`74-annexes/mutations.txt`](74-annexes/mutations.txt).

| Mutation | Bancs | Issue |
| --- | --- | --- |
| M1 veille.sh : le `sleep` de la pause hérite du verrou de la veille | `veille.test.mjs` | rouge (42 s) |
| M2 veille.sh : la boucle hérite du verrou de la veille | `veille.test.mjs` | rouge (44 s) |
| M3 veille.sh : `tee` hérite du verrou de la veille | `veille.test.mjs` | rouge (50 s) |
| M4 veille.sh : file.sh hérite du verrou de la veille | `veille.test.mjs` | rouge (52 s) |
| M5 veille.sh : la commande de préparation hérite du verrou de la veille | `veille.test.mjs` | rouge (53 s) |
| M6 veille.sh : pas de verrou (une seconde veille démarre) | `veille.test.mjs` | rouge (47 s) |
| M7 veille.sh : l’état « lancee » n’est pas écrit | `veille.test.mjs` | rouge (48 s) |
| M8 veille.sh : la ligne finale n’est pas écrite dans l’état | `veille.test.mjs` | rouge (47 s) |
| M9 veille.sh : l’arrêt de la préparation n’écrit pas sa fin | `veille.test.mjs` | rouge (47 s) |
| M10 veille.sh : la fin à l’échéance n’écrit pas sa fin | `veille.test.mjs` | rouge (49 s) |
| M11 veille.sh : la boucle sortie en code non nul n’écrit pas sa fin | `veille.test.mjs` | rouge (45 s) |
| M12 veille.sh : l’état écrit avant le verrou (une seconde veille l’écrase) | ? | rouge (52 s) |
| M13 veille.sh --etat : le fichier d’arrêt n’est pas lu | `veille.test.mjs` | rouge (50 s) |
| M14 veille.sh --etat : la fin écrite lue avant le fichier d’arrêt | ? | rouge (49 s) |
| M15 veille.sh --etat : VIVANTE sort en 1 | `veille.test.mjs`, `veille-du-capitaine.test.mjs` | rouge (43 s) |
| M16 veille.sh --etat : MORTE sort en 2 | `veille.test.mjs`, `veille-du-capitaine.test.mjs` | rouge (43 s) |
| M17 veille.sh --etat : exige CAPITAINE_ID | `veille.test.mjs` | rouge (39 s) |
| M18 veille.sh : --reprendre transmis à chaque lancement de la boucle | `veille.test.mjs` | rouge (44 s) |
| M19 veille.sh : --reprendre jamais transmis | `veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs` | rouge (517 s) |
| T1 SKILL.md : le timeout dit après la commande de la veille, plus dans le paragraphe qui la lance | ? | rouge (0 s) |
| T2 SKILL.md : le `timeout` à 600000 au lieu de 7200000 | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T3 SKILL.md : la puce « Aucune de ces lignes » avant celle de la sortie 13 | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T4 SKILL.md : la puce « Aucune de ces lignes » retirée | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T5 SKILL.md : le réveil de garde déplacé après le suivi du journal | ? | rouge (0 s) |
| T6 SKILL.md : le réveil de garde réarmé à chaque réveil | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T7 SKILL.md : la garde à 120 minutes | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T8 SKILL.md : les points 2 et 3 du réveil de garde échangés | ? | rouge (0 s) |
| T9 SKILL.md : `--reprendre` retiré du point 3 | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T10 SKILL.md : la sortie 9 ne nomme plus une autre veille | `veille-du-capitaine.test.mjs` | rouge (0 s) |
| T11 veille.sh : l’en-tête ne dit plus le timeout | `veille-du-capitaine.test.mjs` | rouge (0 s) |

30 rouges sur 30. Une mutation est vue verte en écrivant le ticket, M12 (l'état écrit avant le verrou) : le test « une seconde veille… » ne lisait que l'état de fin ; il pose désormais un état témoin avant la seconde veille et le relit après elle.

## Vérification

1. § 1 : 13 rouges sur 58 avant le code, 58 verts après.
2. Les mutations : `node <scratchpad>/mutations.mjs` depuis la racine, « toutes rouges » (30).
3. `node --test scripts/depot.test.mjs scripts/relecteur.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs` vert (la version, la note, les textes des autres skills qui lisent `fusionner/SKILL.md`, `CAPITAINE_ID`).
4. La suite entière, `pnpm test`, d'un seul tenant, avec son compte, sa durée et la charge (`uptime` avant et après) : **1 291 tests, 1 291 verts** sur `25a72c7` avec le patch (1 279 à `25a72c7`, plus 12 cas : 7 dans `veille.test.mjs`, 1 dans `une-sous-pr-a-la-fois.test.mjs`, 4 dans le banc neuf).
5. `git diff --stat origin/main` : les huit fichiers, et eux seuls (396 lignes ajoutées, 33 retirées sur `25a72c7`).

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `25a72c7` (plugin 7.38.0), le 2026-11-21, Node 22.23.5, git 2.43.0, quatre cœurs :

- **Le patch** : `git apply --check` puis `git apply` sur un worktree neuf de `25a72c7` ; et `git apply --check --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md` sur `25a72c7` plus les patchs des tickets 67 à 69, 70 (sans ses deux fichiers de version) et 71 à 73 (de même) : il s'applique.
- **Les bancs avant le code** (§ 1) : 13 rouges sur 58 ; après : 58 verts.
- **Les mutations** : les 30 de l'annexe, chacune seule, sur un worktree neuf de `25a72c7` avec le patch : **30 rouges sur 30** (de 0 à 383 secondes chacune ; M19 joue aussi `une-sous-pr-a-la-fois.test.mjs`) ; le fichier remis après chacune, l'arbre vérifié identique au patch à la fin.
- **La suite entière**, les quatre motifs de `pnpm test` joués par `node --test`, d'un seul tenant, sur un worktree neuf de `25a72c7` avec le patch : **1 291 tests, 1 291 verts**, aucun échec, sauté ni annulé ; 17 min 11 s (22:23:11 → 22:40:22 UTC, `duration_ms` 1031309), charge 1,49 au départ, 3,94 à la fin (d'autres agents travaillaient sur la machine), notée aux bords seulement.

## Questions à l'architecte

1. **Le réveil de garde réarmé au seul réveil de garde, pas « à chaque réveil »** (décision 11). La recommandation du lot 5 disait « réarmé à chaque réveil » ; écrit ainsi, une veille de 75 minutes et une garde de 60 empilent les réveils programmés, puisque `send_later` ne remplace pas le précédent. **Recommandation : garder** ce que le patch écrit, un seul réveil de garde en attente, la chaîne garde → garde.
2. **La garde continue de sonner, une fois par heure, quand la veille est arrêtée à dessein** (`VEILLE ARRÊTÉE`, arrêt demandé) : un tour court par heure. Autre choix : ne pas réarmer quand `--etat` dit `TERMINÉE`, et réarmer à la relance ; deux règles au lieu d'une. **Recommandation : garder** une seule règle.
3. **Une garde qui sonne dans une session de capitaine archivée.** Rien n'efface le réveil de garde quand l'architecte arrête un capitaine (fin de chantier, ou capitaine remplacé) : il réveillerait une session qu'on croit finie. Le patch n'en dit rien. **Recommandation :** dans la partie 6b, qui récrit `fusionner/SKILL.md` et `chantier/SKILL.md` avec l'archivage des sessions (`A-87`, `P-62`), le capitaine note le `trigger_id` que rend chaque `send_later`, et celui qui l'archive l'efface (`delete_trigger`) avant ; à défaut, `list_triggers` le retrouve par son nom, « Garde de la veille du capitaine ».
4. **`send_later` chargé par le skill, pas par le gabarit de lancement.** La ligne « Outils : » du capitaine (`architecte/references/lancement.md`) ne charge que `send_message`. Le patch fait charger `send_later` par le skill, au premier lancement de la veille, pour un capitaine lancé sans l'architecte aussi. **Recommandation : garder**, et ne pas toucher `lancement.md` ici (le banc `scripts/relecteur.test.mjs` y compare des lignes du capitaine et du Relecteur, que la PR A change).
5. **La version, troisième nombre** (7.38.1 sur `25a72c7`). Deux options neuves d'un script posé (`--etat`, `--reprendre`) ; aucune clé de contrat ni aucun comportement d'un projet ne change sans repose. **Recommandation : le troisième nombre**, comme le ticket 65 pour un script posé corrigé.

## Ce qui n'a pas été établi

- **Ce que l'outil Bash tue au plafond** : le `bash` de la veille seul, ou son groupe de processus. Les deux cas sont couverts : `--arreter` termine une boucle orpheline, et `7>&-` empêche un `sleep` ou un démon orphelin de tenir la veille pour vivante. Ni l'un ni l'autre n'est joué contre l'outil lui-même : le banc tue la veille par `kill -9`.
- **Ce qui survit à un recyclage de la machine** : le patch suppose que le répertoire commun du clone de la session survit (la préparation y garde déjà `capitaine-boot-id` : « Deux défauts vécus chez Iroki », `CONTENU.md`) et que le scratchpad peut disparaître (le point 1 du réveil de garde). Aucun recyclage n'a été provoqué.
- **Le `7>&-` du `git fetch`** n'est tenu par aucun banc : un `git gc --auto` détaché, qui en hériterait, ne s'est pas laissé provoquer simplement ; il est posé par symétrie avec `boucle.sh` (`gc.autoDetach`).
- **Une veille relancée par une ancienne copie** (`<scratchpad>/outils/` d'avant ce ticket) n'a ni `--etat` ni `--reprendre` (sortie 64, l'usage) : la garde ne vaut qu'après une copie neuve, comme tout correctif de la veille (« Enseignements »).
- **Le banc des textes tient des places, pas une conduite** : il garantit que le skill dit la suite où elle se lit, pas qu'une session Sonnet la suive.

## Hors périmètre

- La veille du Relecteur (`relecteur.mjs veille`) : déjà sous le plafond (`A-180`).
- `boucle.sh`, `file.sh`, `passer.sh` : inchangés ; `--arreter` et `--reprendre` gardent leur sens.
- Le gabarit de lancement du capitaine (`architecte/references/lancement.md`), et l'archivage des sessions (partie 6b, question 3).

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur `A-185` (point 7), `A-180` (point 1), le ticket 73 (« Le ticket à part recommandé ») et la passation du 2026-11-19 ; bancs, mutations et suite joués sur un clone neuf de `25a72c7` (« Vérification »).
