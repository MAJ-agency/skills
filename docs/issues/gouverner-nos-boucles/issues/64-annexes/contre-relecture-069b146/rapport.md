# Contre-relecture de la PR 144 (MAJ-agency/skills)

## Premier tour

Sommet vérifié : `git ls-remote origin refs/pull/144/head` → `069b1465c5594a19268f396aa5ccedfe1219a643`. Clone neuf sous `clone/`, `TMPDIR` privé. Node v22.23.5, git 2.43.0, `nproc` 4. Ticket lu sur `claude/compassionate-euler-st84s9` à `49f2fa8` (`git show`, en entier pour le ticket ; ni `map.md` ni la spec).

### Au fil de l'eau

- `scripts/tranches.mjs` `codeSeul` : identique, ligne pour ligne, à `64-annexes/essais/code-seul.mjs` (`diff` des deux fonctions : vide).
- `double-relecture.test.mjs` : le diff de la PR est celui du ticket, à l'octet près (comparé à l'œil, mêmes hunks).
- `.claude-plugin/plugin.json` : 7.37.1 → 7.37.2 ; note en tête de `NOTES-DE-VERSION.md` ; README, seul le paragraphe `POSES`.
- CI `e921846` (job `bancs` 136123388531) : `failure`, `not ok 320 - un environnement hostile … (A-122)`, `expected` = `actual` = `e1866c9f…`, `operator: 'notStrictEqual'`, git 2.56.1. Le second `not ok` (139, `poses`) est la même assertion, rejouée dans le banc posé (`scripts/chaine/double-relecture.test.mjs:1445`) : même cause. Décision 17 tenue.
- CI `069b146` (job 136138494089) : `success`, `# tests 1218`, `# fail 0`, `# poses : 87 travaux, 3 à la fois, 616.0 s sur un plafond de 1800 s (34.2 %), pire cas 14920.0 s`. Le corps de la PR écrit 375,2 s pour `poses` (mesure locale) et 616 s pour la suite locale ; le 616 s de la CI est bien `poses`.
- Bancs joués (charge 0,07 → 0,25) : `tranches.test.mjs` 12/12 en 1,9 s ; `double-relecture.test.mjs` 50/50 en 16,8 s ; `depot.test.mjs` 69/69 en 0,3 s.
- `essais/pieges.mjs` (62 pièges, `node pieges.mjs ../clone/scripts/tranches.mjs`) : 60 justes. `${…}` imbriqués à trois niveaux, regex à `[/]`, `\/`, `["]`, commentaire dans chaîne et chaîne dans commentaire, U+2028/U+2029/`\r`/`\r\n` qui finissent `//`, division après `)`, `]`, identifiant, chaîne, nombres (`1.5e3`, `.5`, `0x1F`, `1n`, `1_000`), `++ /` (doute), `return /"/`, `typeof /"/`, `=> /re/`, `?? /re/`, `#p / 2`, `?.b / 2`, gabarits à `\``, `\${`, `$` seul : tous vus. Deux ratés : `if (a) /"/.test(b); t.test("x", () => {}); // "` (la limite écrite du ticket) et `break x` + fin de ligne + `/"/.test(a); t.test(…)`.
- `essais/pieges2.mjs` : ratés de plus, tous des régressions par rapport à `main` (qui lisait la source brute et jouait entier) : `a.return / 2; t.test("y", f); c = d / e;`, `m.delete / 2; …`, `const of = 4; x = of / 2; t.test(…); c = d / e;`, `continue a` / `break a` + fin de ligne + `/"/…`, `while (x) /"/.test(b) && t.test(…); // "`. Hors périmètre (motif inchangé, déjà raté sur `main`) : `it.only("x", …)`, `describe.skip("x", …)`.
- `essais/corpus.mjs` sur les 129 `.mjs`/`.js` du dépôt : aucun doute, longueur gardée partout ; trois bancs de `verify/` (non joués par `poses`) passent de « sous-tests » à « sans » : leurs `describe(`/`it(` sont dans des chaînes (lu par `grep`).
- `essais/lancer.mjs` (charge 2,10 → 2,17, `poses` tournant en parallèle) : petit-enfant qui tient le tube, borne 1 000 ms → résolue en 1 005 ms, petit-enfant mort ; enfant qui ignore SIGTERM → 1 004 ms, mort ; petit-enfant détaché (`setsid`) → 1 002 ms, mais il survit (hors du groupe) ; enfant sorti 0 et petit-enfant gardant le tube → résolue à la borne, `tue=true code=0` (pas une faute pour `conclure`) ; `arreter()` → 203 ms ; `arreter()` après résolution sans effet ; `cwd` absent → `code null`, pas d'exception.
- Précondition de `double-relecture.test.mjs` (`arbre-mut`, `--test-name-pattern`) : témoin vert ; dates permutées vert avec git 2.43 (attendu, le rouge est sur la CI) ; greffe ôtée → rouge `notStrictEqual`, socle rendu ; greffe sans parent → rouge. Le sha du socle est le même d'un essai à l'autre (`b340976…`) : dates fixées, montage déterministe. La précondition est réelle.
- Diff : rien de privé (`grep` des ajouts : courriels, chemins, jetons) ; les commits portent les lignes d'attribution de session habituelles.
- `poses` seul (`node --test scripts/poses.test.mjs`, clone à `069b146`) : vert, 336 s, charge 0,16 → 1,89 (les 5 dernières secondes partagées avec le début des mutations). Bilan : `87 travaux, 3 à la fois, 336.2 s sur un plafond de 1800 s (18.7 %), pire cas 14920.0 s` ; marges : `une-sous-pr-a-la-fois` (tranche, 10) 179,7 s sur 600 s, 70,0 % ; (tranche, 8) 124,9 s sur 480 s, 74,0 % ; `fusionner` (reste, 1) 32,9 s sur 300 s, 89,0 %. Couverture et plancher verts : chaque test de premier niveau une fois.
- Garde du plafond (`essais/arbre-plafond`, `PLAFOND = 20_000`) : rouge en 20,2 s (charge 0,40 → 0,77), faute `poses a atteint son plafond de 20 s : 75 travaux non joués ; découper …`, bilan rendu dans le TAP (`… 20.0 s sur un plafond de 20 s (100.0 %) …`, trois marges). Un `sleep 30` lancé détaché par `boucle-outils.test.mjs` survit à l'arrêt (hors du groupe) ; le classifieur m'a refusé de le tuer, il s'éteint seul.
- Mutations (`essais/muter.mjs essais/mutations.json`, témoin vert, chacune seule, restaurée ; charge 1,97 → 0,56) : 42 jouées, 29 tuées. Voir le détail dans `essais/mutations.sortie`.
  - Échantillon de la session (17) : 15 tuées ; S14 « se résout sur `close` après un kill » et S15 « ne détruit pas les flux » vivantes. Toutes deux équivalentes **seules** : `tuer` détruit les flux, donc `close` vient de toute façon (S14, petit-enfant `setsid` : 1 024 ms), et le gestionnaire d'`exit` les détruit aussi (S15 : 1 007 ms). Mais S14+S15 ensemble (aucune destruction, aucun rendu sur `exit`) survivent au banc et ne sont équivalentes qu'à un groupe tué : avec un petit-enfant détaché, la résolution passe de 1 006 ms à 8 025 ms (`essais/lancer-setsid.mjs`). Le mécanisme « `exit`, flux détruits » d'A-172 (4) n'est donc prouvé par aucun cas.
  - Les miennes (25) : 14 tuées. Vivantes : M1 (`]` → doute), M4 (continuation de ligne acceptée dans une chaîne), M6 (drapeaux non consommés, équivalente), M8 (`recit` : 4 lignes au lieu de 40), M14 (`tuer` ne rend plus si déjà sorti, équivalente : `close` suit la destruction), M15 (`${` remet `avant` à `null`, côté sûr), M16 (`typeof` retiré de la liste : faux négatif `typeof /"/ … t.test(…)` non gardé), M17 (fins de ligne blanchies : contrat de `codeSeul` non gardé), M19 (couverture des arrêtés, équivalente dans `poses` qui les retire), M24 et M25 (équivalentes sur du JavaScript valide). M13 (`detached: false`) n'est « tuée » que par le `timeout` de 60 s de mon harnais : le test de `lancer` n'a pas de délai et pendrait.

### Verdict du premier tour

conforme après retouches

- B1 `scripts/tranches.mjs:106` (`MOTS_AVANT_REGEX`, l. 34) — un mot de la liste lu comme mot-clé alors qu'il est un nom de propriété (`a.return / 2`, `m.delete / 2`) ou l'identifiant `of`, qui n'est pas réservé (`const of = 4; x = of / 2`), ouvre une fausse regex jusqu'à la `/` suivante de la ligne et cache un vrai `t.test("y", f)` : `aDesSousTests` → `false`, et `main` rendait `true`. C'est la décision 2 du ticket appliquée à la lettre, et cela contredit « aucun autre faux négatif ». Joué par `node essais/pieges2.mjs clone/scripts/tranches.mjs`. Retouche proposée : un mot précédé de `.` ou de `?.` est un identifiant, et `of` tombe dans le doute. Elle demande l'accord de l'architecte, puisqu'elle modifie la liste fermée d'A-172.
- B2 `scripts/tranches.mjs:106` — l'insertion automatique de `;` après `break <label>` ou `continue <label>` suivi d'une fin de ligne : la `/` qui suit est une regex, lue comme une division après l'identifiant. Un `t.test(…)` reste caché derrière des guillemets appariés : `aDesSousTests` → `false`, alors que `main` rendait `true`. Joué par `essais/pieges.mjs` (« break label ») et `essais/pieges2.mjs`. Retouche proposée : un identifiant qui suit `break` ou `continue` met la `/` dans le doute.
- m1 `scripts/tranches.mjs:107` — la regex après `)` (`if (a) /"/.test(b); t.test(…) // "`, `while (x) /"/…`) donne un faux négatif. C'est la limite écrite (en-tête l. 20-21, ticket « Ce qui n'a pas été établi ») et décidée par A-172. Selon la règle « aucun faux négatif », elle serait B : c'est à l'architecte de trancher. Joué par `essais/pieges.mjs`.
- m2 `scripts/tranches.test.mjs:189` — aucun cas ne prouve la résolution sur `exit` ni la destruction des flux. S14 et S15 sont chacune équivalentes ; ensemble, elles survivent au banc et sont distinguables par un petit-enfant `detached` (8 025 ms contre 1 006 ms, `essais/lancer-setsid.mjs`). Par ailleurs, le corps de la PR attribue au ticket deux mutations « vert possible » : le ticket ne marque ainsi que « ne détruit pas les flux ».
- m3 `scripts/tranches.test.mjs:189` — le test de `lancer` n'a pas de `timeout`. Une régression du kill par groupe (M13, `detached: false`) fait pendre le banc au lieu de le faire rougir (`essais/mutations.sortie`).
- m4 `scripts/tranches.test.mjs:34-58` — des trous de cas : `typeof` n'est gardé par aucun cas (M16 vivante, alors que c'est un faux négatif), ni `]` avant une division (M1), ni la conservation d'une fin de ligne dans un littéral (M17, contrat de la décision 1), ni la continuation de ligne en doute (M4), ni les 40 lignes de `recit` (M8). Joué par `essais/muter.mjs`.
- m5 `scripts/tranches.mjs:215` — la branche `arrêté au plafond` de `recit` est morte dans `poses`, qui retire les travaux arrêtés (`poses.test.mjs:128`), et aucun cas ne la joue. Elle est sans effet, et le choix de compter un arrêté comme « non joué » me paraît juste.
- m6 `scripts/tranches.mjs:246-248` — le kill par groupe ne touche pas un petit-enfant qui fait `setsid` : il survit, alors que la résolution reste à l'heure (essai `lancer.mjs`, puis le `sleep 30` de `boucle-outils.test.mjs` à l'arrêt au plafond). L'en-tête dit « le groupe entier est tué » sans écrire cette limite.
- m7 `scripts/poses.test.mjs:83` — le commentaire « les plus gros bancs d'abord » date du tri par banc : ce sont maintenant les travaux les plus lourds d'abord.

Choix propres de la session, jugés :
- `codeSeul` copié de l'annexe : c'est le même code, mot pour mot (`diff` vide). Il porte donc les limites de l'annexe (B1, B2).
- `travaux(…, { source })` facultatif : acceptable, `poses` le passe. Sans `source`, le reste pèse 1, par le plancher.
- Un travail arrêté par la garde compte comme « non joué » : juste. Le plafond rougit avec le compte des travaux non joués, et la couverture ne juge que les travaux qui ont tourné (garde jouée à 20 s).

Fidélité : les décisions 1 à 18 sont codées. Les cas des tables y sont tous, avec les sorties exactes de `codeSeul`, les poids et bornes, `ordre`, `pireCas`, `bilan`, `recit`, `conclure` et `lancer`. Le diff de `double-relecture.test.mjs` est celui du ticket. La séquence de la décision 17 est tenue : `e921846` rouge en CI sur la bonne assertion, puis `f77f569`. La CI à `069b146` est verte, 1 218 sur 1 218, et `poses` y prend 616,0 s sur 1 800.

Comptes : 2 B, 7 m. Pièges `codeSeul` : 62 + 9, dont 10 ratés : 3 pour B1, 3 pour B2, 2 pour la limite `)`, 2 hors périmètre (`it.only`, `describe.skip`, déjà ratés sur `main`). Mutations : 42 jouées (17 de la session, 25 à moi), 29 tuées, 13 vivantes, dont 8 équivalentes (S14, S15, M6, M14, M19, M24, M25, M15 côté sûr) et 5 trous (M1, M4, M8, M16, M17). Bancs : `tranches` 12/12, `double-relecture` 50/50, `depot` 69/69, `poses` 1/1 en 336 s.

## Second tour

Sommet : `git ls-remote origin refs/pull/144/head` → `8d870d00d304d3cb2f54eac14735ea74804e8134`, un seul commit sur `069b146` (`scripts/tranches.mjs`, `scripts/tranches.test.mjs`, `scripts/poses.test.mjs`). `ps` avant tout lancement : aucun de mes processus du premier tour (la machine a redémarré : `up 3 min`). A-176 lu par `grep -n` dans la spec (l. 333-339).

### Au fil de l'eau

- Pièges du premier tour sur `8d870d0` : `pieges.mjs` 0 faute sur 62 ; `pieges2.mjs` : `.return`, `.delete`, `of`, `break a`, `continue a`, `while (x) /re/` tous vus ; seuls `it.only` et `describe.skip` restent ratés (hors périmètre, motif inchangé). `corpus.mjs` : 129 fichiers, 0 doute (aucun fichier réel ne passe dans le doute).
- `essais/pieges3.mjs` (24 attaques des règles neuves) : vus `a?.of / 2`, `x.let / y`, `continue label` + fin de ligne (doute), `if ((a)) /re/`, `foo(if_) / 2`, `(` dans une chaîne, une regex, un commentaire, un gabarit (sans effet sur la pile), `f((a);` et `a);` (doute), `else if`, `if /* c */ (a)`, `o.if(a) / 2`, `if (f(a))`, `do {} while (x)`, `${ (a) }`, `[...of / 2]`, `yield`, `let`. **Ratés** : `break` seul + fin de ligne + `/"/.test(s); t.test(…)`, `continue` seul (idem), `debugger` + fin de ligne (idem), `for await (const x of y) /"/.test(b) && t.test(…)`. Un cinquième, `export default /"/.test(b) && t.test(…)`. Les cinq sources sont du JavaScript valide (`node --check essais/js/{a,b,c,d,e}.mjs`) et `aDesSousTests` y rend `false` ; `main` rendait `true` sur la source brute.
- Sixième raté, même famille : `class A extends /"/ {}; t.test("y", f); // "` (valide, `node --check essais/js/f.mjs`) → `false`.
- Mutations (`essais/muter.mjs essais/mutations2.json`, `arbre-mut` à `8d870d0`, témoin vert, charge 0,04 → 0,12) : 17 jouées, 16 tuées.
  - Vivantes du premier tour, rejouées : M1, M4, M8, M16, M17 tuées par les cas neufs. M13 : le test rougit (`not ok … duration_ms: 30021`) mais le processus `node --test` ne sort pas — `setsid --wait timeout 150 node --test --test-name-pattern=lancer …` sous M13 : `exit=124` à 150 s (`essais/m13.tap`). L'enfant non tué, avec son `setInterval`, tient la boucle du fichier de test.
  - S14+S15 ensemble (`essais/arbre-s1415`) : tuées, `not ok`, `résolue en 8027 ms`, 9 s (`essais/s1415.tap`).
  - Neuves sur A-176 : N1 (un mot après `.` garde sa valeur), N2 (`let` hors du doute), N3 (`continue` hors de la règle des étiquettes), N4 (`with` hors des conditions), N5 (`)` orphelin accepté), N6 (`(` non fermée acceptée), N7 (`(` ne retient pas le mot), N9 (`await` hors du doute), N10 (`)` de condition lu comme une division), N11 (`of` hors du doute) : toutes tuées. N8 (le test `avant.sorte === "doute"` ôté à la `/`) vivante et équivalente : un `avant` de sorte « doute » n'a pas de `valeur`, et tombe de toute façon dans le `return null` final.
- Bancs (charge 0,00) : `tranches.test.mjs` 13/13 en 2,9 s ; `depot.test.mjs` 69/69 en 0,4 s.
- Un processus de la mutation M13 lancée par `muter.mjs` a survécu dans mon groupe (pgid 445) ; arrêté par `kill -KILL -- -445`, il reste un zombie sans parent qu'init récolte. Depuis, chaque lancement passe par `setsid --wait` et `ps` ne montre rien derrière.
- `poses` seul (`setsid --wait node --test scripts/poses.test.mjs`) : vert, 356 s, charge 0,00 → 1,88. `# poses : 87 travaux, 3 à la fois, 356.1 s sur un plafond de 1800 s (19.8 %), pire cas 14920.0 s` ; marge la plus courte 68,1 % (`une-sous-pr-a-la-fois`, tranche de 10, 191,2 s sur 600 s). Rien ne reste derrière (`ps`).

### Verdict du second tour

conforme après retouches

Mes neuf constats du premier tour :
- **B1 fermé.** `a.return`, `m.delete`, `a?.typeof`, `a?.of` et `x.let` sont lus comme des identifiants. `of`, `let`, `yield` et `await` mettent la `/` dans le doute.
- **B2 fermé pour l'étiquette** (`break a`, `continue a`, `continue label`).
- **m1 fermé.** La pile des parenthèses est juste : `if ((a))`, `if (f(a))`, `else if`, `if /* c */ (a)`, `do … while (x)`, et une `(` dans un littéral ne compte pas. Une pile déséquilibrée met dans le doute.
- **m2 fermé.** S14 et S15 jouées ensemble sont tuées.
- **m4 à m7 fermés.** M1, M4, M8, M16 et M17 sont tuées. La branche « arrêté au plafond » de `recit` est jouée. L'en-tête de `lancer` écrit la limite `setsid`. Le commentaire de `poses.test.mjs:83` est corrigé.
- **m3 à moitié fermé** (voir m1 ci-dessous).

Constats neufs :
- **B1** `scripts/tranches.mjs:111-117` (`MOTS_AVANT_REGEX`, l. 36). Après `break` ou `continue` sans étiquette, `debugger`, `default` (`export default`) et `extends`, une `/` est toujours une regex. `codeSeul` la lit comme une division après un identifiant.
  - Exemples, tous valides selon `node --check` : `break` + fin de ligne + `/"/.test(s); t.test("y", f); // "` ; `continue` de même ; `debugger` de même ; `export default /"/.test(b) && t.test(…); // "` ; `class A extends /"/ {}; t.test(…); // "`.
  - `aDesSousTests` y rend `false`, alors que `main` rendait `true` : ce sont des régressions.
  - Commandes : `node essais/pieges3.mjs clone/scripts/tranches.mjs`, et l'essai `essais/js/{a,b,c,e,f}.mjs`.
  - Retouche proposée : ajouter ces cinq mots à `MOTS_AVANT_REGEX`, ou à `MOTS_DU_DOUTE`.
- **B2** `scripts/tranches.mjs:155` (la pile retient `avant.valeur`). Dans `for await (const x of y) /"/.test(b) && t.test(…); // "`, la `(` retient `await` et non `for` : le `)` est lu comme une division. Le cas est valide (`node --check essais/js/d.mjs`) et `aDesSousTests` rend `false`.
  - Retouche proposée : un `)` dont le mot est dans `MOTS_DU_DOUTE` met la `/` dans le doute, ou bien `await` après `for` est retenu comme `for`.
- **m1** `scripts/tranches.test.mjs:233` (`{ timeout: 30_000 }`). Sous M13, le test rougit à 30 s, mais `node --test` ne sort pas : il tourne encore quand je l'arrête à 150 s (`essais/m13.tap`), car l'enfant resté vivant tient la boucle. En CI, sans `timeout-minutes`, le job pendrait jusqu'à la limite de GitHub.
  - Retouche proposée : dans un `finally`, tuer le pid de l'enfant que le test a lancé, ou passer `--test-force-exit` à ce banc.

Le coût est nul : aucun fichier réel du dépôt ne passe dans le doute (`corpus.mjs` : 129 fichiers, 0 doute).

Comptes du second tour :
- 2 B, 1 m.
- Pièges : 62 + 9 rejoués, 0 raté neuf ; seuls restent `it.only` et `describe.skip`, hors périmètre. 24 pièges neufs (`pieges3.mjs`) et 2 sources ajoutées (`essais/js/e.mjs`, `f.mjs`) : 6 faux négatifs en tout.
- Mutations : 17 jouées, dont 6 du premier tour (M1, M4, M8, M13, M16, M17) et 11 neuves. 16 tuées : M13 l'est par son `not ok`, mais elle pend. 1 vivante équivalente (N8). S14 et S15 ensemble : tuées.
- Bancs : `tranches` 13/13, `depot` 69/69, `poses` 1/1 en 356 s.

## Troisième passage

Sommet : `git ls-remote origin refs/pull/144/head` → `31eb5b0c1bf38d919bdaf7f17b19938276dbb6b7`, un commit sur `8d870d0` (`scripts/tranches.mjs`, `scripts/tranches.test.mjs`). A-177 lu par `grep -n` (spec, l. 345-353). Tout lancé sous `setsid --wait`.

### Au fil de l'eau

- Rejeux : `pieges.mjs` 0 faute sur 62 ; `pieges2.mjs` tout vu sauf `it.only`/`describe.skip` (hors périmètre) ; `pieges3.mjs` 0 faute sur 24 ; `js/a` à `js/f` : `aDesSousTests` → `true` (doute) pour les six ; `corpus.mjs` : 129 fichiers, 0 doute.
- `essais/pieges4.mjs` (sources écrites sous `js4/`, chacune passée à `node --check`, les invalides écartées) : 30 sources « vu » valides, 28 justes. Justes : `a = b` + fin de ligne + `/ 2; t.test(…)`, `)` de conditions imbriquées, d'un `for (;;)`, d'un `do {} while (a)`, `)` d'une flèche suivi de `=>`, `a[0] / 2`, gabarits imbriqués (fermés puis `/`, regex dans `${}` imbriqué, `t.test` dans `${}` imbriqué), `async` identifiant (doute), `async (a) => /re/`, `get`/`set` en accesseurs et en clés, `{ return: 1, if: 2 }`, `{ return: /re/ }`, méthodes de classe nommées `return`/`if`, `await /re/` en module, `yield /re/`, `#!`, `a?.(b) / 2`, `this.#p / 2`, `.../re/`, `new.target / 2`, `import.meta / 2`, étiquette puis regex, `xa`, `/[//]/`. La forme du coordinateur `a = b\n/re/g.exec(c)` : JavaScript la lit comme une division, et `codeSeul` aussi ; avec un guillemet pour cacher un appel, elle n'est plus valide (écartée par `node --check`) — la règle ne peut pas s'y tromper. Aucune forme valide « `)` sans mot puis regex » ni « `]` puis regex » n'existe : `]` et le `)` d'une parenthèse d'expression finissent toujours une expression.
- Deux ratés, en code de script seulement (`.cjs`, `node --check` les accepte) : `var await = 4; x = await / 2; t.test("y", f); c = d / e;` et la même chose avec `yield` → `false`. En module, `await` et `yield` sont réservés (`mots.mjs` : les 46 mots réservés et réservés du mode strict sont refusés comme noms en `.mjs`), et `codeSeul` ne lit que des `.test.mjs` (`poses.test.mjs:78`). Limite de domaine, non écrite dans l'en-tête.
- Coûts (division certaine lue comme doute), aucun dans le corpus : `this / 2`, `null / 2`, `true / 2`, `set(a) / 2`, `of(a) / 2`, `async(a) / 2`, `typeof (a) / 2`, `void (0) / 2`, `i++ / 2`. Lues sans doute : `import.meta / 2`, `{}.a / 2`, `(function () {…})() / 2`.
- `MOTS_ECMASCRIPT` (`essais/mots.mjs`, contre ECMA-262 2024 : 38 `ReservedWord`, 9 réservés du mode strict, 8 contextuels d'A-177) : 50 mots attendus, 50 dans la liste, aucun manquant, aucun en trop. Le test (`tranches.test.mjs:79-88`) compare la liste à l'union de ses trois listes écrites, qui sont les mêmes que les miennes.
- M13 (`detached: false`, `arbre-mut` à `31eb5b0`) : `setsid --wait timeout -k 5 120 node --test --test-name-pattern=lancer …` → `exit=1` en 10,1 s, `not ok`, `lancer : non résolu en 10000 ms` (`essais/m13-t3.tap`), charge 0,14 ; aucun processus restant. Le m du second tour est fermé.
- Mutations sur A-177 (`essais/mutations3.json`, témoin vert, charge 0,08 → 0,16) : 14 jouées, 14 tuées (tête de source en doute, identifiant ouvrant une regex, `debugger` retiré de la liste, `)` sans mot ouvrant une regex, `)` d'un autre mot lu comme division, `...` retiré, `...` non reconnu, `yield` retiré des ouvrants, mots non ouvrants traités en identifiants, nom de propriété gardant son sens de mot, `with` retiré, `]` en doute, étiquette sans doute, mot non ouvrant ouvrant une regex).
- Bancs (charge 0,15) : `tranches.test.mjs` 15/15 en 3,0 s ; `depot.test.mjs` 69/69 en 0,4 s. `ps` ensuite : rien. Diff : rien de privé.

### Verdict du troisième passage

conforme

- B1, B2 et m1 du second tour fermés (`pieges3.mjs`, `js/a`–`f`, M13 rouge en 10 s sans pendre).
- m `scripts/tranches.mjs:17-27` — `await` et `yield` employés comme identifiants dans du code de script (`.cjs`) donnent un faux négatif (`essais/pieges4.mjs`, cas `js4/19.cjs` et `js4/20.cjs`). Hors du domaine, puisque `codeSeul` ne lit que des `.test.mjs`, où ces mots sont réservés ; à écrire dans l'en-tête (« une source de module ») si l'on veut que la limite se lise.

Comptes : 0 B, 1 m. Pièges : 62 + 9 + 24 + 6 rejoués sans faute neuve ; 30 sources neuves valides, 2 ratés hors domaine ; 9 coûts nommés, 0 dans le corpus. Mutations : 14 jouées, 14 tuées ; M13 rouge et sortie en 10,1 s. Bancs : `tranches` 15/15, `depot` 69/69.
