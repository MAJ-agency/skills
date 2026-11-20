# Les bancs de la CI : un banc posé joué entier par erreur, des bornes qui ne suivent pas le travail, une précondition qui dépend de l'horloge

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet. Quatre défauts mesurés, chacun avec sa décision, ses fichiers, ses cas de banc et ses mutations. Les sorties exactes de `codeSeul` sont données, et le changement entier du défaut 4 aussi. La séquence du rouge sur la CI est écrite pas à pas. Rien n'est à concevoir au-delà de ce que le ticket donne ; les décisions de l'architecte sont `A-171` et `A-172`.
Blocked by: PR 141
Dépendances: —
Fichiers chauds: `scripts/poses.test.mjs` (la PR 141 y relève le délai à 900 s, `A-166` ; ce ticket part de `main` une fois la PR 141 entrée, `A-171` (2), et remplace cette ligne). `scripts/tranches.mjs` et `scripts/tranches.test.mjs` : aucune PR ouverte ne les touche. `skills/chaine/fusionner/scripts/double-relecture.test.mjs` : aucune PR ouverte ne le touche ; ce ticket n'y change que `commit`, `depotNiveau` et un commentaire. `README.md`, seulement le paragraphe sur `POSES`. `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : les PR 141 et 44 les touchent aussi ; la note s'écrit en tête au moment de livrer, sur la version de `main` d'alors.

## Le besoin

Ce ticket fait suite à `A-166` et à `A-163` (1), dans la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` de la branche de l'architecte. `A-166` relève le délai du test `poses` à 900 s sur la PR 141, en attendant, et renvoie à un ticket de suite pour que ce test ne fixe plus la durée de la CI. `A-163` (1) demande un ticket pour la précondition instable de `double-relecture.test.mjs`. `A-169` fait récrire par la PR 141 le titre qui déclenche le défaut 1, et `A-171` et `A-172` tranchent ce que la première version de ce ticket laissait ouvert (§ « Ce que l'architecte a décidé »).

Les faits sont lus sur `origin/main` à `e64f93b` (plugin 7.36.0) et sur la branche de la PR 141 (`claude/tickets-55-57`) à `fc12fd8`, lue sans être modifiée. Les numéros de ligne sont ceux de `e64f93b`, sauf mention de `fc12fd8`.

Les défauts 1 à 3 sont ceux de `scripts/tranches.mjs` et de `scripts/poses.test.mjs`, qui jouent en tranches les bancs posés depuis le ticket 62. Le défaut 4 est celui de `double-relecture.test.mjs`. La spec l'appelle « le défaut 2 » (`A-171`, `A-172`) : c'est le même.

Les essais joués pour ce ticket et ceux du relecteur sont sous `64-annexes/`. Le rapport du tour de relecture est dans `64-annexes/relecture-tour-1.md`.

### 1. Un banc posé est joué entier à cause d'un mot dans une chaîne

**Le fait.** La PR 141 ajoute un banc posé, `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` (18 tests, tous lus par `nomsDesTests`). À `fc12fd8`, `poses` le joue **entier**, en un seul processus, parce qu'`aDesSousTests` le croit à sous-tests. Le motif `SOUS_TEST` (`scripts/tranches.mjs:27`) est `` /\b\w+\.test\s*\(\s*["'`]|\b(?:describe|suite|it)\s*\(/ ``. À la ligne 45 de ce banc, à `fc12fd8`, il attrape le texte `suite (` du littéral `` `feat(${nom}): suite (#2)` ``. C'est le message de commit d'un dépôt jouet, pas un appel. `A-169` fait récrire ce titre par la PR 141 en `feat(${nom}): suite, #2` : une fois la PR 141 entrée, ce banc se découpe déjà, et le défaut ne se voit plus sur `main`. Le cas du banc porte donc sa propre source (Cas de test).

Sur la CI de la PR 141 au sommet `4d23f66`, premier essai, `poses` rougit à 615 s. Ce n'est pas son délai de 620 s qui coupe, c'est la minuterie de la tranche :

```
not ok 139 - les bancs posés à plat sous scripts/chaine/ tournent hors du plugin
  duration_ms: 615141.978618
  error: |-
    ── scripts/chaine/une-sous-pr-a-la-fois.test.mjs (entier, sortie SIGKILL)
```

Au second essai, `poses` est annulé à 620 s (1 173 réussis, 1 annulé, 813 s de suite) : c'est le cas d'`A-166`.

**La mesure.** Le script `64-annexes/essais/jouer-tranches.mjs` joue un banc comme `poses` : mêmes `travaux`, même rapporteur, `PARALLELE` à la fois. On l'a lancé sur un arbre à `fc12fd8`, avec `taskset -c 0-3` :

```
$ taskset -c 0-3 node jouer-tranches.mjs <arbre à fc12fd8> skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs entier
entier	sortie 0	328.8 s	18 tests
travaux 1, parallèle 3, total 328.8 s, couverture []
$ taskset -c 0-3 node jouer-tranches.mjs <arbre à fc12fd8> skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs decoupe   # entier: false
tranche	sortie 0	224.4 s	10 tests
tranche	sortie 0	170.9 s	8 tests
reste	sortie 0	0.1 s	0 tests
travaux 3, parallèle 3, total 224.4 s, couverture []
```

La charge était de 3,7 au début, de 6,95 entre les deux mesures et de 4,08 à la fin (`uptime`, quatre cœurs, `nproc` = 4). Une autre session jouait `poses` sur la même machine pendant ce temps.

- Joué entier, le banc prend 328,8 s, au-dessus de la minuterie de 300 s : **aucune marge**. Dans `poses`, il est tué dès que la machine est un peu chargée.
- Découpé, sa plus longue tranche prend 224,4 s, soit **25 % de marge** sous 300 s.
- `scripts/poses.test.mjs` seul à `fc12fd8` (`taskset -c 0-3`) prend **502 s** tel quel. Sur une copie jetable de l'arbre où `aDesSousTests` rend `false`, il prend **351 s**. Les deux passent ; la charge était de 1,4 au début et de 1,7 à la fin. La session de la PR 141 avait mesuré, sur quatre cœurs, 182 s à `8a64453`, 454 s à `4d23f66` et 513 s dans la suite entière à `fc12fd8`.

Sur `main` à `e64f93b`, aucun des 23 bancs posés n'est pris pour un banc à sous-tests (`aDesSousTests` appliqué à chacun, et le relecteur l'a rejoué), et aucun n'en écrit. Le défaut reviendra pourtant : les noms de tests et les messages des dépôts jouets sont en français, où « suite ( » et « describe ( » sont du texte ordinaire.

**La cause.** `aDesSousTests` cherche son motif dans toute la source, littéraux de chaîne et commentaires compris. Le côté sûr est le bon : un banc à sous-tests doit se jouer entier, car Node 22 saute sous `--test-skip-pattern` un sous-test dont le nom égale un nom lu, sans le rendre. C'est vérifié ici sur Node 22.23.5 : un sous-test « lu A » d'un test au nom calculé n'est pas joué par la tranche de reste. Mais un mot dans une chaîne n'est pas un appel.

### 2. Le tri compte les travaux, pas les tests : un banc entier part en dernier

**Le fait.** `poses` trie les bancs par `b.length` (`scripts/poses.test.mjs:90`), c'est-à-dire par nombre de travaux, du plus grand au plus petit. Un banc joué entier n'a qu'un travail : il part **parmi les derniers**, quel que soit son poids. À `fc12fd8`, le banc de 18 tests et de 329 s, joué entier, part ainsi après toutes les tranches des bancs découpés, et s'ajoute presque en entier à la fin du test.

**La cause.** Le tri date du ticket 62, où aucun banc lourd ne se jouait entier. Le nombre de travaux ne dit le poids d'un banc que s'il est découpé.

### 3. Les bornes sont des constantes, le travail croît

**Le fait.** Deux constantes bornent `poses`. La première est le délai du test : 620 s sur `main` (`scripts/poses.test.mjs:57`), 900 s sur la PR 141 (`A-166`). La seconde est la minuterie de chaque travail : 300 s (`scripts/poses.test.mjs:100`), la même pour une tranche de 10 noms, pour un reste et pour un banc entier de toute taille. Chaque banc posé, et chaque cas ajouté à un banc posé, allonge le travail sans rien changer aux bornes. Le défaut 1 a fait sauter la seconde, et le second essai de la PR 141 la première. La marge n'est écrite nulle part : on ne la connaît qu'après un rouge.

Un travail tué ne s'arrête pas toujours à sa minuterie. Sa promesse se résout sur `close`, et `close` attend que tous les flux de l'enfant se ferment. Un petit-enfant qui tient le tube garde donc le travail ouvert après le `SIGKILL`. C'est l'essai du relecteur, rejoué ici (`64-annexes/essais-du-relecteur/close.mjs`) :

```
$ node close.mjs
exit SIGKILL 1.005
close SIGKILL 6.027
```

**La mesure.** Tout est mesuré sur un clone neuf, à `e64f93b`, sur quatre cœurs (`nproc` = 4), avec Node 22.23.5 et git 2.43.0, la charge lue par `uptime` pour chaque mesure.

| Mesure | Durée | Tests | Charge (début → fin) |
| --- | --- | --- | --- |
| La suite entière (les quatre motifs de `pnpm test`, par `node --test`) | **317 s** (`user` 11 min 56 s, `sys` 4 min 13 s) | 1 174, 0 échec | 1,04 → 3,34 |
| `poses` dans cette suite | **221 s** (TAP `duration_ms` 220 619) | 1 | — |
| `poses` seul | **194 s** (`user` 5 min 36 s, `sys` 2 min 3 s) ; relecteur : 185,9 s | 1 | 1,38 → 2,57 |
| Les 23 bancs posés, chacun seul, l'un après l'autre, dans le plugin | **534 s** en tout | 610 | 1,45 → 3,23 |
| La suite sans `poses` | **250 s** | 1 173 | 2,00 → 2,73 |
| La suite sans les 23 bancs posés côté plugin (une seule passe, `poses` compris) | **232 s**, dont `poses` 231 s | 564 | 2,73 → 4,73 |

Par banc posé, joué seul : `fusionner.test.mjs` **223,2 s** (107 tests), `sujet-fusionner.test.mjs` 110,5 s, `boucle-outils.test.mjs` 43,1 s, `meme-contenu.test.mjs` 42,8 s, `sujet.test.mjs` 22,8 s, `veille.test.mjs` 22,0 s, `double-relecture.test.mjs` 14,5 s, `github.test.mjs` 13,5 s, `sujet-clore.test.mjs` 9,0 s. Les quatorze autres prennent moins de 5 s chacun. Le test le plus long pèse 25,5 s seul (`fusionner.test.mjs`). La plus longue tranche de `main`, estimée par la somme des durées de ses tests joués seuls, est une tranche de `fusionner.test.mjs` : **51,8 s**, soit 17 % de la minuterie de 300 s. Le reste de ce banc pèse 32,0 s.

Sur la CI (exécuteur `ubuntu-24.04`, git 2.56.1), les durées sont lues dans les journaux des jobs `bancs` :

| Sommet | `poses` | Suite | Issue |
| --- | --- | --- | --- |
| `9e4d8df` (PR 142, dernier sommet avant l'entrée) | 295 s | 389 s, 1 174 tests | vert |
| `fc06f17` (PR 142), second essai | 352 s | 465 s, 1 172 tests | vert |
| `4d23f66` (PR 141), premier essai | 615 s | 695 s | rouge : tranche tuée (défaut 1) |
| `4d23f66` (PR 141), second essai | 620 s | 813 s | annulé : délai du test (`A-166`) |

La double passe des bancs posés coûte ici 85 s : la suite passe de 317 s à 232 s quand ils ne tournent qu'une fois. `A-171` (1) les garde toutes les deux.

**La cause.** Une borne fixe garde contre un blocage (`A-166`), mais elle ne suit pas le travail qu'elle borne. Le délai du test borne la somme de tous les travaux, et la minuterie borne un travail sans savoir combien de tests il porte. Un travail tué, enfin, n'est vraiment arrêté que si tout son groupe de processus l'est.

### 4. La précondition « le montage trompe bien une lecture dans le dépôt réel » dépend de l'horloge

**Le fait.** Il s'agit du test « un environnement hostile ne pèse pas : des greffes, … (A-122) », à `skills/chaine/fusionner/scripts/double-relecture.test.mjs:1421` ; son assertion est à la ligne 1436, inchangée depuis `fc06f17`. Le test greffe la tête comme parent du socle (`.git/info/grafts`), ce qui fait un cycle, puis exige que `git merge-base socle tete`, lu dans le dépôt réel, ne rende pas le socle. Sur la CI de la PR 142, au sommet `fc06f17`, premier essai, il rougit :

```
not ok 315 - un environnement hostile ne pèse pas : des greffes, `GIT_GRAFT_FILE`, …
  location: '…/skills/chaine/fusionner/scripts/double-relecture.test.mjs:1421:1'
  error: 'le montage trompe bien une lecture dans le dépôt réel'
  expected: 'a286484eceb886ed5cfe669fe018a9f64edbd8ca'
  actual: 'a286484eceb886ed5cfe669fe018a9f64edbd8ca'
  operator: 'notStrictEqual'
```

Il passe à la relance. L'exécuteur utilise git 2.56.1 (`git version 2.56.1` dans le même journal).

**La mesure.** Le montage est rejoué en shell avec git 2.43.0 (le git de ce poste), en forçant les dates du socle et de la tête (`GIT_COMMITTER_DATE`, `GIT_AUTHOR_DATE`). On joue trente dépôts par écart, avec un contenu différent à chaque fois, donc des sha différents :

```
ecart(tete-socle)=-1 vide : 30
ecart(tete-socle)=-2 vide : 30
ecart(tete-socle)=0 tete : 30
ecart(tete-socle)=1 vide : 30
ecart(tete-socle)=2 vide : 30
```

On a ensuite sondé, dans le banc même, la sortie de `git merge-base` sous les trois ordres de dates du correctif ci-dessous :

```
socle daté après la tête (le correctif) : # SONDE merge-base sortie=1 rend=rien   # pass 1
socle daté avant la tête                : # SONDE merge-base sortie=1 rend=rien   # pass 1
dates égales                            : # SONDE merge-base sortie=0 rend=tete   # pass 1
```

Avec git 2.43, la base de fusion dépend de l'ordre des dates (la tête, ou aucune base) et n'est jamais le socle : **l'échec ne se reproduit pas avec ce git**. Le relecteur a rejoué la sonde, avec le même résultat.

**La cause, lue dans la source de git 2.55.0** (`commit-reach.c`, archive `git_2.55.0.orig.tar.xz` du miroir Ubuntu). Le parcours `paint_down_to_common` y a une file sans doublons (`nonstale_queue_put_dedup`) et s'arrête dès que le dernier commit non périmé est sorti.

- Quand la tête est plus récente que le socle, la tête sort la première et marque le socle de ses deux couleurs. Le socle sort ensuite, il est noté comme résultat, et le parcours s'arrête avant de le marquer périmé : git rend le socle.
- Quand les dates sont égales, la file départage par ordre d'entrée, et le socle sort le premier.
- Quand le socle est plus récent, il sort le premier dans tous les cas.

Dans les deux derniers cas, c'est la tête qui reçoit la première les deux couleurs, et git rend la tête. Le relecteur a simulé ce parcours à la main, avec le même résultat.

Le banc date ses commits par l'horloge. Les deux commits tombent presque toujours dans la même seconde : dates égales, la tête est rendue, le test est vert. S'ils tombent dans deux secondes différentes, la tête est plus récente, et git 2.55 et plus rend le socle : rouge. git 2.43 ne le fait jamais. Les notes de version de git annoncent une optimisation du calcul de la base de fusion en 2.52 et en 2.55.

## Où

- `scripts/tranches.mjs`
  - `codeSeul` et `aDesSousTests` (défaut 1) ;
  - `travaux`, dont chaque travail porte son `poids` et sa `borne` (défauts 2 et 3) ;
  - des fonctions pures nouvelles : `ordre`, `pireCas`, `recit`, `bilan` et `conclure` (défauts 2 et 3, `A-172` (2)) ;
  - `lancer`, qui joue un travail dans son groupe de processus (défaut 3, `A-172` (4)) ;
  - les constantes `BORNE_PAR_TEST`, `BORNE_MINIMALE` et `PLAFOND` ;
  - l'en-tête du fichier, sa limite sur les sous-tests réécrite.
- `scripts/tranches.test.mjs` : deux tests existants complétés et six tests nouveaux (Cas de test).
- `scripts/poses.test.mjs`, le premier test. Il appelle `ordre`, `lancer` et `conclure`, prend `PLAFOND` pour délai, et sa garde du plafond tue les groupes en cours. `TAILLE`, `PARALLELE`, la liste des fichiers posés, la couverture et le plancher ne changent pas.
- `skills/chaine/fusionner/scripts/double-relecture.test.mjs` : `commit` (un paramètre `date`), `depotNiveau` (deux dates fixées) et un commentaire du test « un environnement hostile ».
- `README.md`, le paragraphe sur `POSES`.
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

## Décisions

### Défaut 1 : un mot dans une chaîne n'est pas un sous-test

1. **Le motif `SOUS_TEST` ne change pas.** Il se cherche dans `codeSeul(source)`, une fonction nouvelle et exportée de `scripts/tranches.mjs`.
   - **Son interface.** Elle rend une chaîne de **même longueur** que la source, ou `null` dans le doute. On a donc `aDesSousTests(source) === (codeSeul(source) === null || SOUS_TEST.test(codeSeul(source)))`.
   - **Ce qu'elle blanchit.** Chaque unité de code UTF-16 du **contenu** des littéraux et des commentaires devient une espace, sauf les fins de ligne. C'est le contenu des commentaires `//…` et `/*…*/`, des chaînes `'…'` et `"…"`, du texte des gabarits `` `…` ``, et du corps des expressions régulières littérales, classes `[…]` comprises.
   - **Ce qui reste.** Les fins de ligne restent : `\n`, `\r`, U+2028 et U+2029. Les délimiteurs restent aussi : `//`, `/*`, `*/`, les guillemets, l'accent grave, `${`, la `}` qui ferme un `${`, et les deux `/` d'une expression régulière, avec ses drapeaux. Ils sont nécessaires : le motif `` \w+\.test\s*\(\s*["'`] `` exige le guillemet qui ouvre le nom. Le code des `${…}` d'un gabarit reste du code, à toute profondeur d'imbrication : un `t.test("x")` écrit dans un `${…}` est vu.
   - **Les fins de ligne.** Un commentaire `//` finit à la première fin de ligne parmi `\n`, `\r`, U+2028 et U+2029, comme en JavaScript : après un `\r` seul, la suite est du code. Une chaîne `'…'` ou `"…"` ne peut contenir ni `\n` ni `\r`, même après une barre oblique inverse. U+2028 et U+2029 y sont permis, comme en JavaScript : `revue-exigee.test.mjs` en écrit un dans une chaîne, à sa ligne 345.
2. **La nature d'une `/` se lit sur le jeton significatif qui la précède**, blancs et commentaires sautés, et sur lui seul, selon une liste fermée (`A-172`).
   - **Division** : après un identifiant (un mot qui n'est pas dans la liste des mots de l'expression régulière), après un littéral (nombre, chaîne, gabarit fermé, expression régulière), après `)` ou après `]`.
   - **Expression régulière** : après une ponctuation ouvrante ou un opérateur, `(`, `[`, `{`, `,`, `;`, `:`, `?`, `!`, `=`, `&`, `|`, `^`, `~`, `+`, `-`, `*`, `%`, `<` et `>`, ou après un des mots `return`, `typeof`, `case`, `do`, `else`, `in`, `of`, `new`, `delete`, `void`, `throw`, `instanceof`, `yield` et `await`.
   - **Le doute** : après tout autre jeton, à savoir `}`, `++`, `--`, `.`, ou rien, au début de la source.

   Une expression régulière finit au `/` suivant qui n'est pas échappé et n'est pas dans une classe `[…]`, sur la même ligne.
3. **Dans le doute, le banc se joue entier, comme aujourd'hui.** `codeSeul` rend `null` dans les cas suivants :
   - la source finit dans un gabarit, un `${` ou un `/*` non fermé ;
   - une chaîne `'…'` ou `"…"` rencontre `\n` ou `\r` avant de se fermer ;
   - une expression régulière rencontre une fin de ligne avant de se fermer ;
   - une `/` tombe dans le doute de la décision 2.
4. **Raison.** C'est la décision la plus simple qui tienne : le motif et le côté sûr ne changent pas. Seul le texte, qui n'est jamais un appel, cesse d'être lu comme un appel. Les trois faux négatifs trouvés par le relecteur sont fermés par la liste fermée : `i++ / 2` tombe dans le doute, `` `a` / 2 `` se lit comme une division, et `return /'/` comme une expression régulière. Resserrer le motif ferait au contraire manquer de vrais sous-tests (`=> t.test(`, `return t.test(`), du mauvais côté. Jouée sur le dépôt, la mise en œuvre jetable `64-annexes/essais/code-seul.mjs` donne les résultats suivants :
   - les 23 bancs posés de `main`, plus `une-sous-pr-a-la-fois.test.mjs` à `fc12fd8`, sont lus sans sous-tests ;
   - aucun des 128 fichiers `.mjs` et `.js` du dépôt n'est dans le doute ;
   - les 21 cas de la table de cas sont rendus comme attendu (`64-annexes/essais/cas-code-seul.mjs`, « fautes 0 »).

### Défaut 2 : les plus lourds d'abord, comptés en tests

5. **Chaque travail porte un `poids`**, le nombre de tests de premier niveau qu'il est sûr de jouer, et au moins 1.
   - Une `tranche` pèse le nombre de ses noms, doublons compris (`t.noms.length`).
   - Un banc `entier` pèse le nombre de ses noms lus.
   - Le `reste` pèse le nombre de lignes de la source qui commencent par `test(`, moins le nombre de noms lus. Un test écrit en boucle est en retrait : il ne compte pas, et c'est le plancher qui donne 1 au reste de `fusionner.test.mjs` (16 tests en boucle).
6. **`ordre(liste)`**, une fonction pure de `scripts/tranches.mjs`, rend une copie de la liste à plat de tous les travaux, tous bancs confondus, triée par poids décroissant. Le tri est stable : à poids égal, l'ordre de la liste reçue est gardé. `poses.test.mjs` construit la liste banc par banc, dans l'ordre alphabétique des bancs, sans tri préalable, puis appelle `ordre`. Le tri par bancs (`b.length`) disparaît.
7. **Raison.** Le poids en tests est la seule mesure que la source donne sans rien jouer. Un banc entier de 18 tests part avant une tranche de 10, au lieu de partir le dernier. Sur `main`, aucun banc n'est entier par sous-tests. L'ordre y change seulement entre bancs : les tranches de 10 noms de tous les bancs partent d'abord. L'effet sur la durée n'est pas mesuré à part.

### Défaut 3 : les bornes suivent le travail, un travail tué s'arrête, la marge se lit

8. **La borne d'un travail suit son poids** : `borne = max(BORNE_MINIMALE, BORNE_PAR_TEST × poids)`, en millisecondes, avec `BORNE_PAR_TEST = 60_000` et `BORNE_MINIMALE = 300_000`. `travaux` la calcule pour chaque travail. Une tranche de 10 noms a 600 s, jamais moins que les 300 s d'aujourd'hui. Un banc entier de 18 noms aurait 1 080 s.
9. **Un travail se joue par `lancer(args, { cwd, env, borne })`**, une fonction de `scripts/tranches.mjs`, qui suit `A-172` (4). Elle rend une promesse de `{ code, signal, tue, ms, sortie }`.
   - L'enfant se lance dans son propre groupe de processus (`detached: true`, `stdio: ["ignore", "pipe", "pipe"]`).
   - À sa borne, `lancer` le tue par son groupe (`process.kill(-pid, "SIGKILL")`, l'erreur `ESRCH` ignorée). Elle se résout alors sur `exit`, après avoir détruit les flux de l'enfant.
   - Sans kill, elle se résout sur `close`, comme aujourd'hui, pour ne rien perdre de la sortie.
   - `ms` est la durée mesurée, en millisecondes.

   Contre l'essai du relecteur, cette forme donne ceci (`64-annexes/essais/close-groupe.mjs`) :

   ```
   $ node close-groupe.mjs
   exit SIGKILL 1.009
   résolue 1.009
   close SIGKILL 1.009
   sleep 6 encore là à 3 s : false
   ```
10. **Le délai de `poses` est le plafond, `PLAFOND = 1_800_000` ms (1 800 s), `A-172` (4).**
    - Le délai du `test(…)` vaut `PLAFOND + 60_000`.
    - Une garde interne se déclenche à `PLAFOND`, mesuré depuis le premier travail lancé. Elle tue les groupes en cours, ne lance plus rien, et marque la course comme `depasse`. Le test rougit alors par `conclure` (décision 12), avec un diagnostic qui dit le plafond atteint et les travaux non joués : c'est le signal de découper.
    - **La valeur calculée sur `main`.** La première version de ce ticket faisait du délai un calcul : la somme des bornes divisée par `parallele`, plus la plus grande borne, plus 60 s. Sur `main` à `e64f93b`, ce calcul donne **14 440 s** : 84 travaux, une somme des bornes de 41 340 s, une plus grande borne de 600 s, `parallele` = 3. À `fc12fd8`, défaut 1 corrigé, il donne **14 980 s**. Ces valeurs sont rejouées par `64-annexes/essais/delai.mjs` et, avant, par le relecteur. Elles sont huit fois le plafond. Lu à la lettre, « un calcul qui dépasse le plafond rougit » ferait donc rougir `poses` sur `main` dès aujourd'hui.
    - **Ce que le ticket en fait.** Ce calcul devient `pireCas(liste, parallele)`, la somme des bornes divisée par `parallele` plus la plus grande borne, en millisecondes. C'est la durée si chaque travail allait jusqu'à sa borne. Il n'est plus le délai : il est **écrit dans le bilan**. Ce qui rougit, c'est la durée mesurée qui atteint le plafond.
    - Aujourd'hui, `poses` prend 194 s seul ici, 295 s sur la CI à `9e4d8df`, et 577 s à 620 s à `fc12fd8`. La marge est donc de 3 à 6 fois.
11. **La liste se calcule une seule fois, après la pose**, sur les copies posées, comme aujourd'hui, et le test joue cette même liste. Rien n'est calculé au chargement du fichier, puisque le délai ne dépend plus de la liste (m8). Toutes les durées sont en millisecondes dans le code. Les diagnostics les écrivent en secondes, avec une décimale.
12. **Trois fonctions pures font le compte rendu, et `poses` ne fait que les appeler (`A-172` (2)).**
    - **`recit(resultat)`** raconte un travail en échec. Un travail tué donne `── <banc> (<sorte>, tué à sa borne de <borne> s)`. Les autres donnent `── <banc> (<sorte>, sortie <code ou signal>)`. Suivent, comme aujourd'hui, les lignes `✖` et `not ok` de la sortie, puis ses 40 dernières lignes.
    - **`bilan(liste, resultats, { parallele, duree })`** rend les lignes du diagnostic :
      - d'abord `poses : <n> travaux, <P> à la fois, <durée> s sur un plafond de 1800 s (<part> %), pire cas <pireCas> s` ;
      - puis, pour les trois travaux joués les plus proches de leur borne, `<banc> (<sorte>, <poids> tests) : <durée> s sur <borne> s, marge <m> %`.
    - **`conclure(liste, resultats, { parallele, duree, depasse, plancher })`** rend `{ diagnostics, fautes }`. `diagnostics` vaut le bilan, en vert comme en rouge. `fautes` reçoit :
      - le récit de chaque travail en échec ;
      - si `depasse` est vrai, `poses a atteint son plafond de 1800 s : <k> travaux non joués ; découper (un banc trop lourd, ou TAILLE)` ;
      - les fautes de `couverture` ;
      - le plancher manqué.

      `poses.test.mjs` rend d'abord chaque ligne de `diagnostics` par `t.diagnostic`, **avant toute assertion**, puis exige `fautes` vide.
13. **Raison.** `A-166` le dit : un délai garde contre un blocage, ce n'est pas une assertion. Avec des bornes par poids et un kill par groupe, chaque travail s'arrête à sa borne ; le plafond ne garde plus que l'ensemble, et il se lit à chaque CI. Aucun cas n'est retiré. La couverture (chaque test de premier niveau joué une seule fois) et le plancher de 150 tests restent. Les deux passes des bancs posés restent aussi (`A-171` (1)).

### Défaut 4 : les dates du montage sont fixées

14. **Le socle et la tête de `depotNiveau` ont des dates fixées, le socle daté une heure après la tête.** `commit` prend un paramètre `date` facultatif, sans effet sur ses autres appels. Le test reste joué, et sa précondition est inchangée : `assert.notEqual(trompe.stdout.trim(), socle, …)`. Seul le commentaire qui la précède change.
15. **Pourquoi le socle après la tête, et pas des dates égales.** Avec le socle plus récent, git le parcourt le premier par la seule règle « du plus récent au plus ancien » : la tête reçoit la première les deux couleurs, et la base rendue ne peut pas être le socle. Avec des dates égales, l'ordre dépend du départage de la file de git, un détail d'implémentation (ordre d'entrée en 2.43 comme en 2.55, non documenté). Les deux choix sont verts avec git 2.43, ce qui est joué, et avec git 2.55, selon sa source. Le premier ne dépend que de la règle documentée du parcours.
16. **Les autres appels de `commit` et les autres montages gardent l'horloge.** Aucun autre test du banc n'interroge git sur un cycle de greffes. `meme-contenu.test.mjs` (« un sommet remplacé ou greffé », sans cycle) et `sujet-clore.test.mjs` (« une greffe locale », sans cycle) ne sont pas touchés.
17. **Le rouge se voit sur la CI, dans cet ordre, et pas autrement (`A-171` (2), `A-172` (5)).** La CI ne tourne que sur une PR vers `main` (`.github/workflows/ci.yml`, `pull_request`) et annule un job en cours à chaque nouveau push (`concurrency`, `cancel-in-progress`). D'où la séquence :
    1. La branche part de `main` une fois la PR 141 entrée.
    2. Le premier commit porte le changement entier ci-dessous, **mais avec les deux dates permutées** : `DATE_DU_SOCLE = '2026-11-16T11:00:00+00:00'` et `DATE_DE_LA_TETE = '2026-11-16T12:00:00+00:00'`. La tête est alors plus récente, ce que fait l'horloge quand une seconde passe entre les deux commits. Ce commit ne touche rien d'autre.
    3. On pousse ce commit, puis on ouvre la PR vers `main` **en brouillon**.
    4. On attend que le job `bancs` de ce sommet finisse en `failure`, sans rien pousser d'autre avant : un push annulerait le job, et la preuve serait perdue.
    5. On recopie dans la PR la ligne `not ok` du test « un environnement hostile … (A-122) », puis son `expected` et son `actual`, égaux au sha du socle. On vérifie que c'est bien ce test, et cette assertion, qui rougit.
    6. Alors seulement, on pousse le correctif des dates, puis le reste du ticket.

    **Si ce commit sort vert**, ou rouge pour une autre cause, la session s'arrête. Elle écrit à l'architecte le sommet, l'issue du job et les lignes utiles, et ne pousse pas le correctif. Le comportement de git 2.56.1 est déduit de la source de 2.55, pas joué (« Ce qui n'a pas été établi »).

Le changement entier, sur `e64f93b`. `git apply --check` le passe sans `--recount`, et appliqué, il donne 50 tests sur 50 en 15,2 s, puis 16,5 s au second essai :

```diff
diff --git a/skills/chaine/fusionner/scripts/double-relecture.test.mjs b/skills/chaine/fusionner/scripts/double-relecture.test.mjs
index 9a687aa..16cb5b7 100644
--- a/skills/chaine/fusionner/scripts/double-relecture.test.mjs
+++ b/skills/chaine/fusionner/scripts/double-relecture.test.mjs
@@ -1160,14 +1160,15 @@ test('les lignes du diff se lisent comme `revue-exigee.mjs` les lit : la copie e
 function g(cwd, ...args) {
   return execFileSync('git', args, { cwd, encoding: 'utf8', env: ENV_PROPRE }).trim();
 }
-/** Écrit `fichiers` dans le dépôt et les commite sur la branche courante ; rend le sha. */
-function commit(depot, fichiers, message) {
+/** Écrit `fichiers` dans le dépôt et les commite sur la branche courante ; rend le sha. `date` : la date d'auteur et de commit, fixée (sinon l'horloge). */
+function commit(depot, fichiers, message, { date } = {}) {
   for (const [chemin, contenu] of Object.entries(fichiers)) {
     mkdirSync(dirname(join(depot, chemin)), { recursive: true });
     writeFileSync(join(depot, chemin), contenu);
   }
   g(depot, 'add', '-A');
-  g(depot, 'commit', '-q', '-m', message);
+  const env = date === undefined ? ENV_PROPRE : { ...ENV_PROPRE, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
+  execFileSync('git', ['commit', '-q', '-m', message], { cwd: depot, encoding: 'utf8', env });
   return g(depot, 'rev-parse', 'HEAD');
 }
 /** Le montage M : `origin/develop` porte l'index avec la règle haute et son `code`, et une branche de ticket modifie ce fichier de code. */
@@ -1405,16 +1406,24 @@ test("le lecteur git lit par un dépôt propre, jetable : un fichier absent du c
   assert.deepEqual(readdirSync(temporaire), [], 'le dépôt propre est retiré');
 });
 
+// Les dates du montage de niveau, fixées (ticket 64) : la greffe du test « un environnement hostile » fait de la tête le
+// parent du socle, un cycle, et la base de fusion que git y lit dépend de l'ordre des dates. Le socle est daté après la
+// tête : git parcourt du plus récent au plus ancien, le socle passe le premier, et c'est la tête qui porte la première
+// les deux marques (git 2.43 : aucune base ; git 2.55, lu dans sa source : la tête). Daté par l'horloge, la tête passe
+// la première dès que les deux commits tombent dans deux secondes différentes, et git 2.56.1 (CI, PR 142, `fc06f17`)
+// rend le socle : la précondition rougit.
+const DATE_DU_SOCLE = '2026-11-16T12:00:00+00:00';
+const DATE_DE_LA_TETE = '2026-11-16T11:00:00+00:00';
 /** Une PR qui monte une règle par l'index seul : develop la dit moyenne, la tête haute, ni son fichier ni son code ne sont touchés. */
 function depotNiveau() {
   const depot = dossier('double-relecture-');
   g(depot, 'init', '-q', '-b', 'develop');
   g(depot, 'config', 'user.email', 'jouet@example.invalid');
   g(depot, 'config', 'user.name', 'Jouet');
-  const socle = commit(depot, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium' })]), 'anchorpost/manifest.json': '{}\n', 'README.md': 'jouet\n' }, 'chore: socle');
+  const socle = commit(depot, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium' })]), 'anchorpost/manifest.json': '{}\n', 'README.md': 'jouet\n' }, 'chore: socle', { date: DATE_DU_SOCLE });
   g(depot, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
   g(depot, 'checkout', '-q', '-b', 'feat/criticite');
-  const tete = commit(depot, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature' })]), 'anchorpost/manifest.json': '{"featureCriticality": []}\n' }, 'feat: criticité');
+  const tete = commit(depot, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature' })]), 'anchorpost/manifest.json': '{"featureCriticality": []}\n' }, 'feat: criticité', { date: DATE_DE_LA_TETE });
   return { depot, socle, tete, entree: `anchorpost/manifest.json\n${INDEX}\n` };
 }
 
@@ -1431,7 +1440,7 @@ test("un environnement hostile ne pèse pas : des greffes, `GIT_GRAFT_FILE`, un
   mkdirSync(join(depot, '.git/info'), { recursive: true });
   writeFileSync(join(depot, '.git/info/grafts'), greffe);
   // La greffe fait un cycle (la tête descend déjà de la cible) : lue dans le dépôt réel, la base de fusion est la tête, ou
-  // n'est pas calculable, selon l'ordre des dates ; jamais la cible.
+  // n'est pas calculable, selon la version de git ; jamais la cible, les dates du montage étant fixées (DATE_DU_SOCLE).
   const trompe = spawnSync('git', ['merge-base', socle, tete], { cwd: depot, env: ENV_PROPRE, encoding: 'utf8' });
   assert.notEqual(trompe.stdout.trim(), socle, 'le montage trompe bien une lecture dans le dépôt réel');
   assert.equal(juger().sortie, attendu, '.git/info/grafts');
```

### Version

18. Rien ne change pour un projet, sauf le banc posé `double-relecture.test.mjs`, qu'un projet reçoit en reposant. C'est donc le troisième nombre, sur **la suivante de `main` au moment de livrer**. Aucun test n'écrit de version en dur ; les tests de version existants de `depot.test.mjs` suffisent. La note dit ce qui change pour qui joue la CI du plugin (les bornes, le plafond, le bilan) et pour un projet (une précondition de banc stable).

## Cas de test

Chacun est vu rouge avant le correctif puis vert après, sauf mention contraire.

| Défaut | Cas | Avant |
| --- | --- | --- |
| 1 | `scripts/tranches.test.mjs`, test nouveau « `codeSeul` garde la longueur, les fins de ligne et les délimiteurs, garde le code des `${…}`, et blanchit le texte » : égalité exacte sur les cinq sources du tableau qui suit. | rouge : `codeSeul` absent |
| 1 | `scripts/tranches.test.mjs`, test existant « un banc qui écrit des sous-tests est reconnu : il se jouera entier », complété par trois listes : « pas de sous-test », « des sous-tests » et « le doute » (deuxième tableau). | neuf cas rouges : six « pas de sous-test » et les trois du doute (détail ci-dessous) |
| 1 | `scripts/tranches.test.mjs`, test nouveau « aucun banc posé du plugin n'est pris pour un banc à sous-tests, et aucun n'est dans le doute » : il lit les sources que `poses` pose. | vert avant, comme après : sur `main` après la PR 141, il garde le verdict d'aujourd'hui contre une lecture qui se tromperait sur un vrai banc |
| 2, 3 | `scripts/tranches.test.mjs`, test existant « un banc court se joue entier ; un banc long en tranches de `taille` noms, plus une tranche de reste », complété. Le `poids` et la `borne` d'une tranche de 10 (10, 600 000) et d'une tranche de 3 (3, 300 000). Ceux d'un banc entier de 18 noms (18, 1 080 000) et d'un banc entier sans nom lu (1, 300 000). Ceux d'un reste dont deux lignes `test(` ne sont pas lues (2, 300 000), puis d'un reste sans ligne non lue (1, 300 000). | rouge : champs absents |
| 2 | `scripts/tranches.test.mjs`, test nouveau « `ordre` : les plus lourds d'abord, tous bancs confondus ; à poids égal, l'ordre reçu ». La liste reçue est `[a: tranche 10, a: reste 1, b: entier 18, c: tranche 3, a: tranche 3]`. `ordre` rend `[b: entier 18, a: tranche 10, c: tranche 3, a: tranche 3, a: reste 1]`, et la liste reçue n'est pas modifiée. | rouge : `ordre` absent |
| 3 | `scripts/tranches.test.mjs`, test nouveau « `pireCas` : la somme des bornes sur `parallele`, plus la plus grande ». Quatre travaux de bornes 300 000, 300 000, 600 000 et 1 080 000 ms, `parallele` = 2 : 2 280 000 / 2 + 1 080 000 = **2 220 000** ms (`A-172` (3)). Divisé par le nombre de travaux, le résultat serait 1 650 000. Sans la plus grande borne, 1 140 000. | rouge : `pireCas` absent |
| 3 | `scripts/tranches.test.mjs`, test nouveau « `recit`, `bilan` et `conclure` : un travail tué nomme sa borne, le plafond atteint rougit et le dit, le bilan est rendu en vert comme en rouge ». Il donne l'égalité exacte des lignes de `bilan` sur trois résultats inventés, avec la part du plafond et les trois marges. Puis : `recit` d'un travail tué (« tué à sa borne de 600 s ») et d'un travail sorti en 1 ; `conclure` vert (aucune faute, bilan rendu) ; `conclure` avec un échec (sa faute, le bilan rendu quand même) ; `conclure` avec `depasse` (la faute du plafond, avec le nombre de travaux non joués). | rouge : fonctions absentes |
| 3 | `scripts/tranches.test.mjs`, test nouveau « `lancer` : un travail tué se résout à sa borne, même quand un petit-enfant tient ses flux, et son groupe est mort ». C'est l'essai `close.mjs` en banc : borne de 1 000 ms, un enfant qui lance `sleep 6` en héritant de ses flux et écrit son pid. On attend `tue === true`, une résolution en moins de 3 000 ms, et un `sleep` absent ou zombie (`/proc/<pid>/stat`) au retour. Un second cas : un travail qui finit seul se résout sur `close`, sortie complète, `tue === false`. | rouge : `lancer` absent |
| 3 | `scripts/poses.test.mjs` : son délai vaut `PLAFOND + 60_000`. Il appelle `ordre`, `lancer` avec `t.borne` et `conclure`, et rend les diagnostics avant les assertions (vu dans le TAP). La couverture et le plancher sont inchangés. | le même test, réécrit |
| 4 | `double-relecture.test.mjs`, « un environnement hostile … (A-122) », avec les dates fixées. **Le rouge se voit sur la CI** (git 2.56.1) par la séquence de la décision 17 ; le vert vient ensuite, avec le correctif. Avec git 2.43, les deux sont verts : c'est joué ici (« socle daté avant la tête : # pass 1 ») et par le relecteur. | rouge, avec git 2.56.1 : `notStrictEqual`, le socle rendu (journal de `fc06f17`) |

Les cinq sources du test de `codeSeul` et leurs sorties exactes, en notation JSON. Les cinq gardent leur longueur.

| Source | `codeSeul(source)` |
| --- | --- |
| `` "a = \"x(y)\"; b = 'z';" `` | `` "a = \"    \"; b = ' ';" `` |
| `` "n = a / b; /* t.test(\"x\" */ m = c / 2;" `` (deux divisions, un bloc) | `` "n = a / b; /*            */ m = c / 2;" `` |
| `` "f(/[/\"]\\//g, 1); // it(\"x\")\rg();" `` (une expression régulière, un `//` fini par `\r`) | `` "f(/      /g, 1); //        \rg();" `` |
| `` "s = `t ${ u(\"v\") } w`;" `` | `` "s = `  ${ u(\" \") }  `;" `` |
| `` "x = `a${ `b${ c }d` }e`;" `` | `` "x = ` ${ ` ${ c } ` } `;" `` |

Les cas du test de `aDesSousTests`, avec ce que rend `main` à `e64f93b` (joués par `64-annexes/essais/cas-code-seul.mjs` contre `main` et contre la mise en œuvre jetable) :

| Liste | Source | `main` |
| --- | --- | --- |
| pas de sous-test | `` const m = `feat(${nom}): suite (#2)`; `` | `true`, rouge |
| pas de sous-test | `const t = "la suite (x)";` | `true`, rouge |
| pas de sous-test | `const t = 'it (x)';` | `true`, rouge |
| pas de sous-test | `// describe("x")` | `true`, rouge |
| pas de sous-test | `a = 1; /* t.test("x", */ b = 2;` | `true`, rouge |
| pas de sous-test | `` if (/["'`]/.test(x)) {} `` | `false`, vert : il tue « le corps des expressions régulières n'est plus lu » |
| pas de sous-test | `test("… describe ( …", () => {});` | `true`, rouge |
| des sous-tests | `t.test("x", () => {});` ; `` t.test(`x`, () => {}); `` ; `describe("x", () => {});` ; `it("x", () => {});` | `true`, vert |
| des sous-tests | `` const s = `${ t.test("x") }`; `` ; `f(x => t.test("y", () => {}));` ; `a = /"/.test(b) \|\| t.test("y", () => {});` | `true`, vert |
| des sous-tests (faux négatifs du relecteur) | `n = i++ / 2; await t.test("x", () => {}); m = k / 3;` (doute) ; `` const r = `a` / 2; await t.test("x", () => {}); q = b / c; `` ; `function f() { return /'/.test(s) && t.test("x", f); // '` puis une fin de ligne et `}` | `true`, vert ; ces cas tuent les mutations de la liste fermée |
| des sous-tests | `// commentaire` puis `\r` puis `t.test("x", () => {});` | `true`, vert |
| le doute | `` const m = `pas fermé; `` ; `const m = "pas fermé;` puis `\n` puis `b = 1;` ; `` const m = `${ x; `` | `false`, rouge (attendu : `true`) |

Sur ces cas, `main` est rouge sur **six** cas « pas de sous-test » sur sept, et sur les **trois** cas du doute. Le septième cas « pas de sous-test », celui de l'expression régulière, est vert avant comme après. La première version du ticket disait sept rouges : c'était faux.

## Surfaces

| Surface | Preuve |
| --- | --- |
| `codeSeul`, `aDesSousTests` | `scripts/tranches.test.mjs`, trois tests |
| `travaux` (`poids`, `borne`) | `scripts/tranches.test.mjs`, un test existant complété |
| `ordre`, `pireCas`, `recit`, `bilan`, `conclure` | `scripts/tranches.test.mjs`, trois tests nouveaux |
| `lancer` (groupe, kill, `exit`) | `scripts/tranches.test.mjs`, un test nouveau |
| `scripts/poses.test.mjs` | lui-même, et le TAP d'une CI verte (Vérification) |
| `double-relecture.test.mjs`, le montage de niveau | le test « un environnement hostile », rouge puis vert sur la CI ; le banc entier (50 tests) vert |
| `README.md`, `POSES` | relu (texte) |
| version et note | les tests de version existants de `depot.test.mjs` |

## Vérification

1. La suite entière, `pnpm test`, verte d'un seul tenant sur la branche. On note le nombre de tests, la durée et la charge (`nproc`, `uptime` avant et après).
2. `scripts/poses.test.mjs` joué seul, sur `main` (PR 141 entrée) puis sur la branche, avec `taskset -c 0-3` et la charge notée. Le TAP de la branche montre le bilan : la part du plafond, le pire cas, les trois marges les plus courtes. `une-sous-pr-a-la-fois.test.mjs` y est découpé avant comme après, puisque son titre est récrit par la PR 141 (`A-169`) : sa présence découpée ne prouve rien du correctif. Ce qui le prouve, ce sont les cas de `tranches.test.mjs`.
3. Sur la CI de la PR, le journal du job `bancs` montre les lignes `# poses : …` sous le test `poses`. On les recopie dans la PR : la marge de la CI, enfin écrite.
4. Le rouge du défaut 4, par la séquence de la décision 17, recopié dans la PR avant le correctif.
5. Mutations, chacune appliquée seule, le cas joué, le fichier restauré. Un passage témoin vert précède chaque série.
   - **Défaut 1**, mutations de `codeSeul` et `aDesSousTests` (tuées par les trois tests du défaut 1) :
     - `aDesSousTests` cherche dans la source brute ;
     - le doute rend `false` au lieu de `true` ;
     - les délimiteurs sont blanchis ;
     - le code des `${…}` est blanchi ;
     - le corps des expressions régulières n'est plus lu ;
     - toute `/` est prise pour une division, puis pour une expression régulière (deux mutations) ;
     - `++` est lu comme un opérateur avant une expression régulière ;
     - `return` n'est plus dans la liste ;
     - un gabarit fermé n'est plus un littéral ;
     - `/* */` est lu comme du code ;
     - `//` ne finit plus à `\r` ;
     - U+2028 dans une chaîne la met dans le doute (tuée par le test « aucun banc posé », sur `revue-exigee.test.mjs`) ;
     - la longueur n'est plus gardée.
   - **Défaut 2**, mutations de `ordre` et du poids :
     - le tri regroupe par banc (le tri par `b.length` rétabli) ;
     - le tri n'est plus stable ;
     - le tri devient croissant ;
     - `ordre` trie la liste reçue en place ;
     - le poids d'un banc entier vaut 1 ;
     - le reste pèse 0.
   - **Défaut 3**, mutations de la borne, de `pireCas`, de `recit`, `bilan`, `conclure` et `lancer` :
     - la borne vaut 300 000 fixe ;
     - le plancher est ôté ;
     - `pireCas` sans la plus grande borne ;
     - `pireCas` divisé par le nombre de travaux ;
     - `conclure` ne rend le bilan qu'en vert ;
     - `recit` dit « sortie SIGKILL » sans la borne ;
     - `conclure` oublie la faute du plafond ;
     - `bilan` trie les marges à l'envers ;
     - `lancer` tue l'enfant seul (`process.kill(pid)`) ;
     - `lancer` se résout sur `close` après un kill ;
     - `lancer` ne détruit pas les flux (selon ce que Node fait du tube, vert possible : on note l'issue).
   - **Défaut 4** : les deux dates permutées, rouge sur la CI (c'est le pas 2 de la décision 17) ; les deux dates retirées (l'horloge), vert le plus souvent, ce qui est le défaut même.

## Ce qui n'a pas été établi

- **Le rouge du défaut 4 n'a pas été vu ici.** Le git de ce poste (2.43.0) ne rend jamais le socle, quelles que soient les dates. Construire git 2.55.0 depuis sa source, pour le jouer sur ce poste, a été refusé par le système de permissions de la session ; il l'a été aussi pour le relecteur. Ce qui est établi :
  - le rouge de la CI (git 2.56.1, `actual` égal au socle, dans le journal de `fc06f17`) ;
  - la dépendance aux dates avec git 2.43 (jouée) ;
  - le parcours de git 2.55, lu dans sa source et simulé à la main par le relecteur.

  Que git 2.56.1 se comporte comme la source de 2.55 est **déduit, non joué**. D'où l'arrêt de la décision 17 si le commit aux dates permutées sort vert.
- **`codeSeul` est une lecture, pas un analyseur de JavaScript**, et deux limites restent écrites.
  - Une expression régulière après `)` ou `]` se lit comme une division, selon la liste fermée d'`A-172`, par exemple `if (a) /"/.test(b); t.test("x", …)`. Ses guillemets peuvent alors s'apparier sur la ligne et cacher un appel. Ce cas n'est pas fermé, et aucun banc du dépôt ne l'écrit.
  - Un `}` avant une `/` met le banc dans le doute, même quand la `/` est une division évidente. C'est le côté sûr, au prix du temps.

  Le relecteur et la mise en œuvre jetable n'ont trouvé aucun autre faux négatif. On ne l'a pas prouvé pour toute source.
- **Un banc entier dont aucun nom n'est lu** pèse 1 et a la borne minimale de 300 s, quelle que soit sa taille : les défauts 2 et 3 restent entiers pour lui. Aucun banc posé ne l'est aujourd'hui : sur les 23 bancs de `main`, le nombre de lignes `test(` égale le nombre de noms lus, et seuls les 16 tests en boucle de `fusionner.test.mjs` tombent au reste. Cette limite est écrite dans l'en-tête de `tranches.mjs`.
- **`BORNE_PAR_TEST = 60 s`** vient de deux mesures : le test le plus long des bancs posés pèse 25,5 s seul, et le banc de la PR 141 fait 18 s par test, joué entier sous charge. Dans un travail d'un seul test, un test de plus de 300 s sous la charge de la CI ferait encore tuer ce travail. La borne reste une garde contre un blocage.
- **Le plafond de 1 800 s est fixe.** Un banc de plus finira par l'approcher ; le bilan le montre à chaque CI, et l'atteindre rougit avec le signal de découper (`A-172` (4)).
- **Les durées de ce poste et celles de la CI ne se comparent pas en valeur.** `poses` prend 194 s seul ici et 295 s sur la CI, au même contenu. Une autre session jouait les mêmes bancs sur la même machine pendant une partie des mesures ; les charges notées le disent, jusqu'à 6,95.
- **L'effet du tri par poids sur la durée totale** n'est pas mesuré à part. Le tri ne compte vraiment que pour un banc à sous-tests, et aucun banc posé n'en écrit aujourd'hui.

## Ce que l'architecte a décidé

- **`A-171` (1) : les bancs posés gardent leurs deux passes.** La suite passerait de 317 s à 232 s avec une seule passe, mais une seule passe ne jouerait plus, dans le plugin, les deux chargeurs du gate `tickets-regles.mjs` (`revue-exigee.test.mjs:227`, `chemins-sensibles.test.mjs:16`).
- **`A-171` (2) et `A-172` (5) : le rouge du défaut 4 se voit sur la CI**, par la séquence de la décision 17. Le ticket est bloqué par la PR 141.
- **`A-172` (1) à (4)** : le blocage par la PR 141 ; les fonctions pures `ordre`, `bilan`, `recit` et `conclure` ; le cas du délai à quatre travaux pour `parallele` = 2 ; le kill par groupe, la résolution sur `exit` et le plafond de 1 800 s. Pour le plafond, le ticket ne prend pas à la lettre « un calcul qui dépasse le plafond rougit » : le calcul vaut 14 440 s sur `main`, et ferait rougir `poses` dès aujourd'hui (décision 10). C'est la durée mesurée qui rougit au plafond, et le calcul s'écrit dans le bilan.

## Hors périmètre

- Les bancs posés eux-mêmes : on ne raccourcit aucun de leurs tests. Le titre de `une-sous-pr-a-la-fois.test.mjs` est récrit par la PR 141 (`A-169`), pas par ce ticket.
- `TAILLE` (10 noms par tranche) et `PARALLELE` (cœurs moins un) ne changent pas. Avec des tests de 18 s, une tranche de 10 reste lourde (224 s mesurés), et la borne par poids l'absorbe.
- `.github/workflows/ci.yml` n'a pas de `timeout-minutes`, et ce ticket n'en ajoute pas : le plafond de `poses` borne le test le plus long de la suite.
- Les autres montages à greffes (`meme-contenu.test.mjs`, `sujet-clore.test.mjs`) : sans cycle, ils ne dépendent pas des dates.

## Comments

- 2026-11-20 — Tour unique de relecture : « prêt après retouches », 5 bloquants et 8 mineurs (`64-annexes/relecture-tour-1.md`). Retouches portées selon `A-172` :
  - B1 : `Blocked by: PR 141`, le cas du faux positif porte sa propre source, et la Vérification 2 se lit sur `main` après la PR 141.
  - B2 : `ordre`, `recit`, `bilan` et `conclure` sont des fonctions pures, avec leurs cas.
  - B3 : le cas de `pireCas` prend quatre travaux, avec `parallele` = 2.
  - B4 : `lancer` tue par le groupe et se résout sur `exit` ; le délai est le plafond de 1 800 s, et le calcul (14 440 s sur `main`) est écrit dans le bilan.
  - B5 : la séquence de la décision 17.
  - Les mineurs m1 à m8 sont portés : les numéros de ligne de `e64f93b` ; six rouges et trois cas du doute ; le vrai nom du test ; l'interface de `codeSeul` et ses cinq sources ; la liste fermée et les trois faux négatifs en cas ; les limites écrites ; le diff passé par `git apply --check` sans `--recount` ; la liste, les unités et l'ordre du diagnostic.
