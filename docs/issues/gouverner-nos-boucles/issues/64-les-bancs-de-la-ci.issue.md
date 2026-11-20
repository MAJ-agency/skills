# Les bancs de la CI : un banc posé joué entier par erreur, des bornes qui ne suivent pas le travail, une précondition qui dépend de l'horloge

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet. Quatre défauts mesurés, chacun avec sa décision, ses fichiers, ses cas de banc et ses mutations. Le changement entier du défaut 4 est donné. Une question reste à l'architecte (§ « Question à l'architecte ») : elle ne bloque pas ce ticket, qui garde les deux passes des bancs posés.
Blocked by: —
Dépendances: —
Fichiers chauds: `scripts/poses.test.mjs`. La PR 141, ouverte, y relève le délai à 900 s (`A-166`, une ligne et son commentaire) ; ce ticket remplace cette ligne par la borne calculée. `scripts/tranches.mjs` et `scripts/tranches.test.mjs` : aucune PR ouverte ne les touche. `skills/chaine/fusionner/scripts/double-relecture.test.mjs` : aucune PR ouverte ne le touche, ce ticket n'y change que `commit` et `depotNiveau`. `README.md` : la PR 141 touche une autre ligne, ce ticket ne change que le paragraphe sur `POSES`. `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : les PR 141 et 44, ouvertes, les touchent aussi ; la note s'écrit en tête au moment de livrer, sur la version de `main` d'alors.

## Le besoin

Ce ticket fait suite à `A-166` (spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md`, branche de l'architecte) et à la décision `A-163` (1). `A-166` relève le délai du test `poses` à 900 s sur la PR 141, en attendant, et renvoie à un ticket de suite pour que ce test ne fixe plus la durée de la CI. `A-163` (1) demande un ticket pour la précondition instable de `double-relecture.test.mjs`. Les faits sont lus sur `origin/main` à `e64f93b` (plugin 7.36.0) et sur la branche de la PR 141 (`claude/tickets-55-57`) à `fc12fd8`, lue sans être modifiée.

Les défauts 1 à 3 sont ceux de `scripts/tranches.mjs` et de `scripts/poses.test.mjs`, qui jouent en tranches les bancs posés depuis le ticket 62. Le défaut 4 est celui de `double-relecture.test.mjs`.

### 1. Un banc posé est joué entier à cause d'un mot dans une chaîne

**Le fait.** La PR 141 ajoute un banc posé, `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` (18 tests, tous lus par `nomsDesTests`). `poses` le joue **entier**, en un seul processus : `aDesSousTests` le croit à sous-tests. Le motif `SOUS_TEST` (`scripts/tranches.mjs:27`) est `` /\b\w+\.test\s*\(\s*["'`]|\b(?:describe|suite|it)\s*\(/ ``. À la ligne 45 du banc, il attrape le texte `suite (` dans le littéral `` `feat(${nom}): suite (#2)` ``. C'est un message de commit d'un dépôt jouet, pas un appel.

Sur la CI de la PR 141 au sommet `4d23f66`, premier essai, `poses` rougit à 615 s. Ce n'est pas son délai de 620 s qui coupe, c'est la minuterie de la tranche :

```
not ok 139 - les bancs posés à plat sous scripts/chaine/ tournent hors du plugin
  duration_ms: 615141.978618
  error: |-
    ── scripts/chaine/une-sous-pr-a-la-fois.test.mjs (entier, sortie SIGKILL)
```

Au second essai, `poses` est annulé à 620 s (1 173 réussis, 1 annulé, 813 s de suite) : c'est le cas d'`A-166`.

**La mesure.** La commande jouée tient dans un script jetable hors du dépôt, qui joue un banc comme `poses` : mêmes `travaux`, même rapporteur, `PARALLELE` à la fois. On l'a lancée à `fc12fd8`, avec `taskset -c 0-3` :

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

La charge était de 3,7 au début, de 6,95 entre les deux mesures et de 4,08 à la fin (`uptime`, quatre cœurs, `nproc` = 4). Une autre session jouait `poses` sur la même machine en même temps.

- Joué entier, le banc prend 328,8 s, au-dessus de la minuterie de 300 s : **aucune marge**, il est tué dans `poses` dès que la machine est un peu chargée.
- Découpé, sa plus longue tranche prend 224,4 s, soit **25 % de marge** sous 300 s.
- `scripts/poses.test.mjs` seul à `fc12fd8` (`taskset -c 0-3`) prend **502 s** tel quel. Sur une copie jetable de l'arbre où `aDesSousTests` rend `false`, il prend **351 s**. Les deux passent. La charge était de 1,4 au début et de 1,7 à la fin. La session de la PR 141 avait mesuré, sur quatre cœurs, 182 s à `8a64453`, 454 s à `4d23f66` et 513 s dans la suite entière à `fc12fd8`.

Sur `main` à `e64f93b`, aucun des 23 bancs posés n'est pris pour un banc à sous-tests. C'est vérifié en appliquant `aDesSousTests` à chacun, et aucun n'en écrit. Le défaut n'y est donc pas visible, mais il reviendra : les noms de tests et les messages des dépôts jouets sont en français, où « suite ( » et « describe ( » sont du texte ordinaire.

**La cause.** `aDesSousTests` cherche son motif dans toute la source, littéraux de chaîne et commentaires compris. Le côté sûr est le bon : un banc à sous-tests doit se jouer entier. Node 22 saute sous `--test-skip-pattern` un sous-test dont le nom égale un nom lu, sans le rendre. C'est vérifié ici sur Node 22.23.5 : un sous-test « lu A » d'un test au nom calculé n'est pas joué par la tranche de reste. Mais un mot dans une chaîne n'est pas un appel.

### 2. Le tri compte les travaux, pas les tests : un banc entier part en dernier

**Le fait.** `poses` trie les bancs par `b.length` (`scripts/poses.test.mjs:92`), le nombre de travaux de chacun, du plus grand au plus petit. Un banc joué entier n'a qu'un travail. Il part donc **parmi les derniers**, quel que soit son poids. À `fc12fd8`, le banc de 18 tests et de 329 s, joué entier, part après toutes les tranches des bancs découpés (84 travaux en tout sur `main`, d'après `travaux`). Il s'ajoute presque en entier à la fin du test.

**La cause.** Le tri date du ticket 62, où aucun banc lourd ne se jouait entier. Le nombre de travaux ne dit le poids d'un banc que s'il est découpé.

### 3. Les bornes sont des constantes, le travail croît

**Le fait.** Deux constantes bornent `poses`. La première est le délai du test : 620 s sur `main`, 900 s sur la PR 141 (`A-166`). La seconde est la minuterie de chaque travail, 300 s (`scripts/poses.test.mjs:102`), la même pour une tranche de 10 noms, pour un reste et pour un banc entier de n'importe quelle taille. Chaque banc posé, et chaque cas ajouté à un banc posé, allonge le travail sans rien changer aux bornes. Le défaut 1 a fait sauter la seconde, le second essai de la PR 141 la première. La marge n'est écrite nulle part : on ne la connaît qu'après un rouge.

**La mesure.** Tout est mesuré sur un clone neuf, à `e64f93b`, sur quatre cœurs (`nproc` = 4), avec Node 22.23.5 et git 2.43.0. La charge lue par `uptime` est donnée pour chaque mesure.

| Mesure | Durée | Tests | Charge (début, fin) |
| --- | --- | --- | --- |
| La suite entière (les quatre motifs de `pnpm test`, par `node --test`) | **317 s** (`user` 11 min 56 s, `sys` 4 min 13 s) | 1 174, 0 échec | 1,04 → 3,34 |
| `poses` dans cette suite | **221 s** (TAP `duration_ms` 220 619) | 1 | — |
| `poses` seul | **194 s** (`user` 5 min 36 s, `sys` 2 min 3 s) | 1 | 1,38 → 2,57 |
| Les 23 bancs posés, chacun seul, l'un après l'autre, dans le plugin | **534 s** en tout | 610 | 1,45 → 3,23 |
| La suite sans `poses` | **250 s** | 1 173 | 2,00 → 2,73 |
| La suite sans les 23 bancs posés côté plugin (une seule passe, `poses` compris) | **232 s**, dont `poses` 231 s | 564 | 2,73 → 4,73 |

Par banc posé, joué seul : `fusionner.test.mjs` **223,2 s** (107 tests), `sujet-fusionner.test.mjs` 110,5 s, `boucle-outils.test.mjs` 43,1 s, `meme-contenu.test.mjs` 42,8 s, `sujet.test.mjs` 22,8 s, `veille.test.mjs` 22,0 s, `double-relecture.test.mjs` 14,5 s, `github.test.mjs` 13,5 s, `sujet-clore.test.mjs` 9,0 s. Les quatorze autres prennent moins de 5 s chacun. Le test le plus long pèse 25,5 s seul (`fusionner.test.mjs`).

Estimée par la somme des durées de ses tests, joués seuls, la plus longue tranche de `main` est une tranche de `fusionner.test.mjs` : **51,8 s**, soit 17 % de la minuterie de 300 s. Le reste de ce banc pèse 32,0 s.

Sur la CI, avec l'exécuteur `ubuntu-24.04` et git 2.56.1, les durées sont lues dans les journaux des jobs `bancs` :

| Sommet | `poses` | Suite | Issue |
| --- | --- | --- | --- |
| `9e4d8df` (PR 142, dernier sommet avant l'entrée) | 295 s | 389 s, 1 174 tests | vert |
| `fc06f17` (PR 142), second essai | 352 s | 465 s, 1 172 tests | vert |
| `4d23f66` (PR 141), premier essai | 615 s | 695 s | rouge : tranche tuée (défaut 1) |
| `4d23f66` (PR 141), second essai | 620 s | 813 s | annulé : délai du test (`A-166`) |

Ce que coûtent les deux passes des bancs posés : la suite passe de 317 s à 232 s quand ils ne tournent qu'une fois. Le travail des bancs posés est de 534 s joués seuls, et il est fait deux fois.

**La cause.** Une borne fixe garde contre un blocage (`A-166`), mais elle ne suit pas le travail qu'elle borne. Le délai du test borne la somme de tous les travaux, et la minuterie borne un travail sans savoir combien de tests il porte.

### 4. La précondition « le montage trompe bien une lecture dans le dépôt réel » dépend de l'horloge

**Le fait.** Le test se trouve à `skills/chaine/fusionner/scripts/double-relecture.test.mjs:1436` sur `e64f93b`, la ligne n'a pas bougé depuis `fc06f17`. Il s'agit du test « un environnement hostile ne pèse pas : des greffes, … (A-122) ». Il greffe la tête comme parent du socle (`.git/info/grafts`), ce qui fait un cycle, puis exige que `git merge-base socle tete`, lu dans le dépôt réel, ne rende pas le socle. Sur la CI de la PR 142, au sommet `fc06f17`, premier essai, il rougit :

```
not ok 315 - un environnement hostile ne pèse pas : des greffes, `GIT_GRAFT_FILE`, …
  location: '…/skills/chaine/fusionner/scripts/double-relecture.test.mjs:1421:1'
  error: 'le montage trompe bien une lecture dans le dépôt réel'
  expected: 'a286484eceb886ed5cfe669fe018a9f64edbd8ca'
  actual: 'a286484eceb886ed5cfe669fe018a9f64edbd8ca'
  operator: 'notStrictEqual'
```

Il passe à la relance. L'exécuteur utilise git 2.56.1 (`git version 2.56.1` dans le même journal).

**La mesure.** Le montage est rejoué en shell avec git 2.43.0 (le git de ce poste), en forçant les dates du socle et de la tête (`GIT_COMMITTER_DATE` et `GIT_AUTHOR_DATE`). Trente dépôts sont joués par écart, avec un contenu différent à chaque fois, donc des sha différents :

```
ecart(tete-socle)=-1 vide : 30
ecart(tete-socle)=-2 vide : 30
ecart(tete-socle)=0 tete : 30
ecart(tete-socle)=1 vide : 30
ecart(tete-socle)=2 vide : 30
```

Puis dans le banc même, en sondant la sortie de `git merge-base` sous les trois ordres de dates du correctif ci-dessous :

```
socle daté après la tête (le correctif) : # SONDE merge-base sortie=1 rend=rien   # pass 1
socle daté avant la tête                : # SONDE merge-base sortie=1 rend=rien   # pass 1
dates égales                            : # SONDE merge-base sortie=0 rend=tete   # pass 1
```

Avec git 2.43, la base de fusion dépend de l'ordre des dates (la tête, ou aucune base), mais n'est jamais le socle : **l'échec ne se reproduit pas avec ce git**.

**La cause, lue dans la source de git 2.55.0** (`commit-reach.c`, archive `git_2.55.0.orig.tar.xz` du miroir Ubuntu). Le parcours `paint_down_to_common` y a une file sans doublons (`nonstale_queue_put_dedup`) et s'arrête dès que le dernier commit non périmé est sorti. Quand la tête est plus récente que le socle, la tête sort la première et marque le socle de ses deux couleurs. Le socle sort ensuite, il est noté comme résultat, et le parcours s'arrête avant de le marquer périmé : git rend le socle. Quand les deux dates sont égales, la file départage par ordre d'entrée et le socle sort le premier. Quand le socle est plus récent, il sort le premier dans tous les cas. Dans ces deux cas, c'est la tête qui reçoit la première les deux couleurs, et git rend la tête.

Le banc date ses commits par l'horloge. Les deux commits tombent presque toujours dans la même seconde (dates égales, la tête rendue, vert). S'ils tombent dans deux secondes différentes, la tête est plus récente et git 2.55 et plus rend le socle : rouge. git 2.43 ne le fait jamais. Les notes de version de git annoncent une optimisation du calcul de la base de fusion en 2.52 et en 2.55.

## Où

- `scripts/tranches.mjs`
  - `aDesSousTests`, avec une lecture nouvelle qui ne garde que le code (défaut 1) ;
  - `travaux` : chaque travail porte son `poids` et sa `borne` (défauts 2 et 3) ;
  - une fonction nouvelle, `delai(liste, parallele)` (défaut 3) ;
  - l'en-tête du fichier, sa limite sur les sous-tests réécrite.
- `scripts/tranches.test.mjs` : des cas dans les tests existants et deux tests nouveaux.
- `scripts/poses.test.mjs`
  - le tri, qui suit `poids` ;
  - la minuterie, qui suit `t.borne` ;
  - le délai du test, qui suit `delai(…)` ;
  - la durée de chaque travail, mesurée et rendue (`t.diagnostic`) ;
  - le récit d'un travail tué, qui nomme sa borne.

  La liste des fichiers posés, `TAILLE`, `PARALLELE`, la couverture et le plancher ne changent pas.
- `skills/chaine/fusionner/scripts/double-relecture.test.mjs` : `commit` (un paramètre `date`), `depotNiveau` (deux dates fixées) et un commentaire du test « un environnement hostile ».
- `README.md`, le paragraphe sur `POSES`.
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

## Décisions

### Défaut 1 : un mot dans une chaîne n'est pas un sous-test

1. **Le motif `SOUS_TEST` ne change pas.** Il se cherche dans la source privée de ses commentaires et du **contenu** de ses littéraux. C'est le travail d'une fonction nouvelle de `scripts/tranches.mjs`, `codeSeul(source)`, qui rend une chaîne de même longueur :
   - le contenu des commentaires `//…` et `/*…*/` est remplacé par des espaces ;
   - de même pour le contenu des chaînes `'…'` et `"…"`, du texte des gabarits `` `…` `` et des expressions régulières littérales ;
   - les délimiteurs restent. Ils sont nécessaires : le motif `` \w+\.test\s*\(\s*["'`] `` exige le guillemet qui ouvre le nom.
   - les fins de ligne restent ;
   - le code des `${…}` d'un gabarit reste du code, à toute profondeur d'imbrication. Un `t.test("x")` écrit dans un `${…}` est donc vu.
2. **Une expression régulière littérale** commence à un `/` dont le caractère non blanc qui précède n'est ni une lettre, ni un chiffre, ni `_`, ni `$`, ni `)`, ni `]`. Ce `/` ne doit pas non plus ouvrir un commentaire. Elle finit au `/` suivant qui n'est pas échappé et n'est pas dans une classe `[…]`, sur la même ligne.
3. **Dans le doute, le banc se joue entier, comme aujourd'hui.** `aDesSousTests` rend `true`, sans chercher le motif, dans trois cas :
   - la lecture finit dans un littéral ou dans un commentaire (gabarit, `${`, `/*` non fermés) ;
   - une chaîne `'…'` ou `"…"` ne se ferme pas sur sa ligne ;
   - une expression régulière littérale ne se ferme pas sur sa ligne.

   Une lecture qui se trompe d'état (une division prise pour une expression régulière, ou l'inverse) appaire mal ses guillemets. Elle finit presque toujours dans l'un de ces trois cas, donc du côté sûr. Ce « presque » reste dans « Ce qui n'a pas été établi ».
4. **Raison.** C'est la décision la plus simple qui tienne : le motif et le côté sûr ne changent pas. Seul le texte, qui n'est jamais un appel, cesse d'être lu comme un appel. Resserrer le motif (un appel en début de ligne, par exemple) ferait au contraire manquer de vrais sous-tests (`=> t.test(`, `return t.test(`). Ce serait le mauvais côté : des tests perdus sans être vus.

### Défaut 2 : les plus lourds d'abord, comptés en tests

5. **Chaque travail porte un `poids`, le nombre de tests qu'il est sûr de jouer.**
   - Une `tranche` pèse le nombre de ses noms, doublons compris (`t.noms.length`).
   - Un banc `entier` pèse le nombre de ses noms lus, au moins 1.
   - Le `reste` pèse le nombre d'appels `test(` en début de ligne que la lecture n'a pas reconnus, au moins 1. Un test écrit en boucle compte pour un.
6. **`poses` trie tous les travaux, tous bancs confondus**, par poids décroissant. À poids égal, l'ordre d'aujourd'hui est gardé (tri stable sur la liste à plat). Le tri par bancs (`b.length`) disparaît.
7. **Raison.** Le poids en tests est la seule mesure que la source donne sans rien jouer. Un banc entier de 18 tests part avant une tranche de 10, au lieu de partir le dernier. Sur `main`, aucun banc n'est entier par sous-tests ; l'ordre change entre bancs (les tranches de 10 noms de tous les bancs d'abord), ce qui n'est pas mesuré à part.

### Défaut 3 : les bornes suivent le travail, et la marge se lit

8. **La minuterie d'un travail suit son poids** : `borne = max(300 s, 60 s × poids)`. Elle porte le nom `BORNE_PAR_TEST = 60_000` et le plancher `BORNE_MINIMALE = 300_000`, dans `scripts/tranches.mjs`, et `travaux` la calcule pour chaque travail. Une tranche de 10 noms garde au moins ses 300 s d'aujourd'hui, et jamais moins. Le banc entier de la PR 141, s'il restait entier, aurait 1 080 s.
9. **Le délai du test se calcule** : `delai(liste, parallele) = somme des bornes / parallele + plus grande borne + 60 s`. Un ordonnancement glouton de `parallele` files, dont chaque travail s'arrête au plus à sa borne, finit avant `somme / parallele + max`. Les 60 s couvrent la pose et la lecture des rapports. Le délai de `test(…)` est donc `delai(liste, PARALLELE)`. La liste se calcule **avant** l'appel à `test`, au chargement du fichier : on lit les sources des bancs dans le plugin, sans les poser. Les 620 s de `main`, comme les 900 s de la PR 141, disparaissent. Un banc posé de plus allonge le délai de lui-même.
10. **La marge se mesure.** `poses` note la durée de chaque travail. À la fin, vert ou rouge, il rend par `t.diagnostic` deux sortes de lignes (le TAP de la CI les montre sous `# …`) :
    - une ligne de bilan : `poses : <n> travaux, <P> à la fois, <durée> s, délai <délai> s` ;
    - les trois travaux les plus proches de leur borne : `<banc> (<sorte>, <poids> tests) : <durée> s sur <borne> s, marge <m> %`.

    Un travail tué se raconte par `── <banc> (<sorte>, tué à sa borne de <borne> s)` au lieu de « sortie SIGKILL ».
11. **Raison.** `A-166` le dit : un délai garde contre un blocage, ce n'est pas une assertion. Une borne qui suit le poids reste une garde, et ce n'est plus un banc de plus qui la fait sauter. Ce qui reste fixe, `BORNE_PAR_TEST`, porte sur un seul test : le plus long des bancs posés pèse 25,5 s seul, et le banc de la PR 141, joué entier sous une charge de 4 à 7, fait 18 s par test. La marge, enfin, se lit à chaque CI, sans attendre un rouge. Aucun cas n'est retiré, et la couverture (chaque test de premier niveau joué une seule fois) et le plancher de 150 tests restent.
12. **Les deux passes des bancs posés restent** : chacun tourne dans le plugin et posé. La question d'une seule passe est posée à l'architecte (§ « Question à l'architecte »). Ce ticket ne retire aucune preuve.

### Défaut 4 : les dates du montage sont fixées

13. **Le socle et la tête de `depotNiveau` ont des dates fixées, le socle daté une heure après la tête.** `commit` prend un paramètre `date` facultatif, sans effet sur ses autres appels. Le test reste joué et la précondition est inchangée : `assert.notEqual(trompe.stdout.trim(), socle, …)`. Seul le commentaire qui la précède change.
14. **Pourquoi le socle après la tête, et pas des dates égales.** Avec le socle plus récent, git le parcourt le premier par la seule règle « du plus récent au plus ancien ». La tête reçoit alors la première les deux couleurs, et la base rendue ne peut pas être le socle. Avec des dates égales, l'ordre dépend du départage de la file de git, qui est un détail d'implémentation : ordre d'entrée en 2.43 comme en 2.55, mais non documenté. Les deux choix sont verts avec git 2.43 (joué) et, selon la source, avec git 2.55. Le premier ne dépend que de la règle documentée du parcours.
15. **Les autres appels de `commit` et les autres montages gardent l'horloge.** Aucun autre test du banc n'interroge git sur un cycle de greffes. `meme-contenu.test.mjs` (« un sommet remplacé ou greffé », sans cycle) et `sujet-clore.test.mjs` (« une greffe locale », sans cycle) ne sont pas touchés.

Le changement entier, appliqué et joué sur `e64f93b` (50 tests sur 50, 15,2 s) :

```diff
--- a/skills/chaine/fusionner/scripts/double-relecture.test.mjs
+++ b/skills/chaine/fusionner/scripts/double-relecture.test.mjs
@@ -1160,14 +1160,15 @@
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
@@ -1405,16 +1406,24 @@
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
@@ -1431,7 +1440,7 @@
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

16. Rien ne change pour un projet, sauf le banc posé `double-relecture.test.mjs`, qu'un projet reçoit en reposant. C'est donc le troisième nombre, sur **la suivante de `main` au moment de livrer**. Aucun test n'écrit de version en dur ; les tests de version existants de `depot.test.mjs` suffisent. La note dit ce qui change pour qui joue la CI du plugin (les bornes, la marge rendue) et pour un projet (une précondition de banc stable).

## Cas de test

Chacun est vu rouge avant le correctif, puis vert après.

| Défaut | Cas | Rouge avant |
| --- | --- | --- |
| 1 | `scripts/tranches.test.mjs`, test existant « un banc à sous-tests reconnu », complété. **Pas de sous-test** : `` `feat(${nom}): suite (#2)` `` ; `"la suite (x)"` ; `'it (x)'` ; `// describe("x")` ; `/* t.test("x", */` ; `` if (/["'`]/.test(x)) {} `` ; un test au nom `"… describe ( …"`. **Des sous-tests** : `t.test("x", …)`, `` t.test(`x`, …) ``, `describe("x", …)`, `it("x", …)`, `` `${ t.test("x") }` ``, `x => t.test("y", …)` et `/"/.test(a) \|\| t.test("y", …)`. **Le doute** : un gabarit non fermé, une chaîne `"` non fermée sur sa ligne, `${` non fermé. | les sept premières : `true` (faux positifs) |
| 1 | `scripts/tranches.test.mjs`, test nouveau « `codeSeul` garde la longueur, les fins de ligne, les délimiteurs et le code des `${…}` ; il blanchit le texte ». Égalité exacte sur cinq sources courtes. | module sans `codeSeul` |
| 1 | `scripts/tranches.test.mjs`, test nouveau « aucun banc posé du plugin n'est pris pour un banc à sous-tests ». Il lit les sources que `poses` pose et rend `false` pour chacune, ce qui est le verdict d'aujourd'hui sur `main`. La PR 141 y ajoute son banc, vert. | vert avant sur `main` ; à `fc12fd8`, rouge (`une-sous-pr-a-la-fois.test.mjs`) |
| 2 | `scripts/tranches.test.mjs`, test « les travaux d'un banc… », complété. Le `poids` d'une tranche, d'un banc entier, d'un reste (appels `test(` non lus, au moins 1). Un banc entier de 18 noms trié avant une tranche de 10, puis le tri stable à poids égal. | champ absent |
| 3 | `scripts/tranches.test.mjs`, même test. La `borne` vaut 300 s pour une tranche de 1 à 5 tests et pour un reste de poids 1, 600 s pour une tranche de 10, 1 080 s pour un banc entier de 18. `delai` est calculé sur une liste de trois travaux (300 s, 600 s, 1 080 s) avec `parallele` = 3, et doit valoir 660 + 1 080 + 60 = 1 800 s. | fonctions absentes |
| 3 | `scripts/poses.test.mjs` : le délai du test est `delai(liste, PARALLELE)`, la minuterie de chaque travail est `t.borne`, les lignes `t.diagnostic` sont rendues (vu dans le TAP), et la couverture et le plancher sont inchangés. | (le même test, réécrit) |
| 4 | `double-relecture.test.mjs`, « un environnement hostile … (A-122) », avec les dates fixées. **Rouge à voir sur la CI** (git 2.56.1) : un commit de la branche où `DATE_DE_LA_TETE` vaut une heure **après** `DATE_DU_SOCLE` (la tête plus récente, ce que l'horloge fait au passage d'une seconde) ; puis vert, avec le correctif. Avec git 2.43, les deux sont verts (joué : « socle daté avant la tête : # pass 1 »). | avec git 2.56.1 : `notStrictEqual`, le socle rendu (journal de `fc06f17`) |

## Surfaces

| Surface | Preuve |
| --- | --- |
| `codeSeul`, `aDesSousTests` | `scripts/tranches.test.mjs`, trois tests |
| `travaux` (`poids`, `borne`), `delai` | `scripts/tranches.test.mjs`, un test complété |
| `scripts/poses.test.mjs` (tri, minuterie, délai, marge) | lui-même, et le TAP d'une CI verte (Vérification) |
| `double-relecture.test.mjs`, le montage de niveau | le test « un environnement hostile », rouge puis vert sur la CI ; le banc entier (50 tests) vert |
| `README.md`, `POSES` | relu (texte) |
| version et note | les tests de version existants de `depot.test.mjs` |

## Vérification

1. La suite entière, `pnpm test`, verte d'un seul tenant sur la branche. On note le nombre de tests, la durée et la charge (`nproc`, `uptime` avant et après).
2. `scripts/poses.test.mjs` joué seul, sur `main` puis sur la branche, avec `taskset -c 0-3` et la charge notée. Le TAP de la branche doit montrer :
   - la ligne de bilan et les trois marges les plus courtes ;
   - un délai calculé, égal à la formule sur la liste du moment.

   Si la PR 141 est entrée dans `main`, `une-sous-pr-a-la-fois.test.mjs` y apparaît découpé (deux tranches et un reste), et non entier.
3. Sur la CI de la PR, le journal du job `bancs` montre les mêmes lignes `# …` sous le test `poses`. On les recopie dans la PR : la marge de la CI, enfin écrite.
4. Mutations, chacune appliquée seule, le cas joué, le fichier restauré. Un passage témoin vert précède chaque série.
   - **Défaut 1** (`scripts/tranches.test.mjs`) :
     - `aDesSousTests` cherche dans la source brute, et non dans `codeSeul(source)` ;
     - `codeSeul` blanchit aussi les délimiteurs ;
     - il blanchit les `${…}` ;
     - il ne lit plus les expressions régulières littérales ;
     - il prend toute division pour une expression régulière ;
     - un gabarit non fermé rend `false` ;
     - une chaîne non fermée sur sa ligne rend `false` ;
     - les commentaires `/* */` sont lus comme du code ;
     - la longueur n'est plus gardée.
   - **Défaut 2** :
     - le poids d'un banc entier vaut 1 ;
     - le reste pèse 0 ;
     - le tri par bancs (`b.length`) est rétabli ;
     - le tri n'est plus stable à poids égal.
   - **Défaut 3** :
     - la borne vaut 300 s fixe ;
     - le plancher est ôté (une tranche de 1 test à 60 s) ;
     - `delai` sans la plus grande borne ;
     - `delai` divisé par le nombre de travaux et non par `parallele` ;
     - le diagnostic n'est plus rendu en rouge ;
     - le récit dit « SIGKILL » sans la borne.
   - **Défaut 4** : les deux dates permutées, rouge sur la CI ; les deux dates retirées (l'horloge), vert le plus souvent, ce qui est le défaut même. On la joue une fois sur la CI pour la noter, sans en attendre le rouge.

## Ce qui n'a pas été établi

- **Le rouge du défaut 4 n'a pas été vu ici.** Le git de ce poste (2.43.0) ne rend jamais le socle, quelles que soient les dates : la sonde donne aucune base ou la tête. Construire git 2.55.0 depuis sa source, pour le jouer sur ce poste, a été refusé par le système de permissions de la session. Ce qui est établi :
  - le rouge de la CI (git 2.56.1, `actual` égal au socle, dans le journal de `fc06f17`) ;
  - la dépendance aux dates avec git 2.43 (jouée) ;
  - le parcours de git 2.55, lu dans sa source.

  Que git 2.56.1 se comporte comme la source de 2.55 est **déduit, non joué**. La session qui livre voit le rouge sur la CI, par la mutation des dates permutées, avant de pousser le correctif.
- **`codeSeul` est une lecture, pas un analyseur de JavaScript.** Une division prise pour une expression régulière, ou l'inverse, appaire mal les guillemets. Les cas du doute le rendent presque toujours `true`, mais on n'a pas prouvé que toute erreur d'état finit dans le doute. Le côté sûr d'aujourd'hui reste la règle : sur les 23 bancs posés de `main`, le verdict ne change pas.
- **`BORNE_PAR_TEST = 60 s`** vient de deux mesures : le test le plus long des bancs posés pèse 25,5 s seul, et le banc de la PR 141 fait 18 s par test, joué entier sous charge. Un test de plus de 60 s sous la charge de la CI, dans un travail d'un seul test, ferait encore tuer ce travail, au bout de 300 s au moins. La borne reste une garde contre un blocage.
- **Les durées de ce poste et celles de la CI ne se comparent pas en valeur.** `poses` prend 194 s seul ici et 295 s sur la CI, au même contenu. Une autre session jouait les mêmes bancs sur la même machine pendant une partie des mesures : les charges notées le disent (jusqu'à 6,95).
- **L'effet du tri par poids sur la durée totale** n'est pas mesuré à part. À `fc12fd8`, le défaut 1 corrigé suffit à découper le banc (502 s, puis 351 s, mesurés) ; le tri ne compte que pour un banc vraiment à sous-tests, et aucun banc posé n'en écrit aujourd'hui.

## Question à l'architecte

**Les bancs posés tournent deux fois dans `pnpm test`, une fois dans le plugin et une fois posés. Faut-il ne les jouer qu'une fois ?** Ici, la suite prend 317 s avec les deux passes et 232 s avec une seule. Le travail des 23 bancs posés est de 534 s, joués seuls, et il est fait deux fois.

1. **Recommandé : garder les deux passes (ce ticket).** Aucune preuve n'est retirée. Le problème de la PR 141 tenait aux bornes et au faux positif, pas au doublement : la double passe coûte 85 s ici (27 %), et ce coût croît avec le travail sans plus rien faire sauter, puisque les bornes le suivent.
2. **Une seule passe.** `pnpm test` ne joue plus les bancs posés depuis le plugin. Ils ne tournent que posés, par `poses`, et une passe de chargement (`node --test --test-skip-pattern=.` sur chacun, dans le plugin) prouve que leurs imports s'y résolvent. C'est joué sur une sonde avec Node 22.23.5 : le module se charge, aucun corps de test ne tourne. Le gain est de 85 s ici. La perte : les branches du plugin qui ne se chargent qu'au fil d'un test ne seraient plus jouées. Ce sont les chargeurs du gate `tickets-regles.mjs` de `revue-exigee.test.mjs:227` et de `chemins-sensibles.test.mjs:16`, qui passent par `tickets/references/scripts/docs/depot-jouet.mjs`. C'est une preuve retirée ; il faudrait un ticket à part, avec une commande `pnpm test` qui exclut ces fichiers (`node --help` de Node 22.23.5 n'offre aucune option d'exclusion de fichiers pour `--test`, hors couverture).

Une troisième voie, deux jobs de CI (la suite sans `poses`, et `poses` seul), donnerait environ 250 s ici. Elle ne retire rien, mais elle demande qu'un administrateur rende exigé un contrôle de plus sur `main`. Ce ticket ne la propose pas.

## Hors périmètre

- Les bancs posés eux-mêmes : on ne raccourcit aucun de leurs tests. Le texte `suite (#2)` de la PR 141 n'est pas réécrit, c'est la lecture qui change.
- `TAILLE` (10 noms par tranche) et `PARALLELE` (cœurs moins un) ne changent pas. Avec des tests de 18 s, une tranche de 10 reste lourde (224 s mesurés), ce que la borne par poids absorbe.
- Le délai de 900 s de la PR 141 : si elle entre avant ce ticket, la ligne est remplacée par le délai calculé. Sinon, la PR 141 se met à jour sur ce ticket.
- Les autres montages à greffes (`meme-contenu.test.mjs`, `sujet-clore.test.mjs`) : sans cycle, ils ne dépendent pas des dates.

## Comments
