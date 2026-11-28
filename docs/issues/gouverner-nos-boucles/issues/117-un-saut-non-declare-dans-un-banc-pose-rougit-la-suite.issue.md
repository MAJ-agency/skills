# Un test sauté sans déclaration dans un banc posé rougit la suite, et une seule liste fermée tient les sauts admis

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une ligne de plus dans le rapporteur de `tranches.mjs`, une option de `conclure`, la lecture des lignes neuves dans `poses.test.mjs`, et la liste `SAUTES` de `references-posees.test.mjs` déplacée dans un module neuf que les deux gardes lisent. Rien à concevoir hors des décisions `A-266` à `A-268`. Le comportement de Node 22 sur lequel repose le ticket a été joué en l'écrivant (« Vérification », 2). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `scripts/tranches.mjs` (`conclure` 273-287 ; `RAPPORTEUR` 374-385) ; `scripts/tranches.test.mjs` (le test de `conclure`, 253-295, inchangé ; deux tests neufs en fin de fichier, après 410) ; **neuf** `scripts/sautes-admis.test.mjs` ; `scripts/poses.test.mjs` (la lecture du rapport, 99-103 ; l'appel de `conclure`, 129) ; `scripts/references-posees.test.mjs` (`SAUTES`, 16-20 ; la comparaison, 59-60 et 66) ; **neuf** `scripts/sautes-admis.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Le ticket 114 (`needs-info`) touche `scripts/pose-du-socle.mjs` : la liste ne va pas dans ce fichier, d'où le module neuf. Le ticket 116 rejoue `scripts/references-posees.test.mjs` : la seconde PR à entrer le rejoue sur `main`. Le ticket 106 (PR #179) ne touche aucun de ces fichiers ; sa contre-relecture a sorti de son banc posé le test de texte sauté qui a révélé ce défaut (le test va dans `scripts/bascule.test.mjs`). Les tickets 107, 108, 109 et 115 ne touchent aucun de ces fichiers hors des deux fichiers de version. Lignes lues sur `origin/main` à `36accb9` (plugin 8.9.2).

## Le besoin

Constat de la contre-relecture de la PR #179, le 2026-11-28 (journal de la carte, 07 h 30 UTC). Un banc posé dans les projets peut porter un test sauté, et aucun garde ne le voit. Un banc posé est un banc copié à plat sous `scripts/chaine/` ou `scripts/github/` d'un projet, joué par `scripts/poses.test.mjs`. Le test peut être sauté de cinq façons : `{ skip: … }`, `test.skip`, `it.skip`, `describe.skip` ou `t.skip()`. Il peut aussi être marqué « todo ». Dans le plugin, un tel test se lit vert. Dans un projet, il ne juge plus rien. L'intangible du dépôt dit : « jamais de test sauté ou assoupli ».

La liste fermée `SAUTES` de `scripts/references-posees.test.mjs` tient déjà cette règle, mais pour les bancs de `references/` seulement. Le besoin : **un saut ou un « todo » qui n'est pas déclaré dans un banc posé rougit la suite**, et les sauts admis tiennent dans une liste fermée, chacun avec sa raison, sur le modèle de `SAUTES`.

## La cause, à la source

Lignes lues sur `origin/main` à `36accb9` (plugin 8.9.2).

1. **`poses.test.mjs` ne lit pas les sauts.** Le garde joue les bancs de `scripts/chaine/` et de `scripts/github/` du projet jouet (`:76-80`), tranche par tranche, avec deux rapporteurs : `spec` sur la sortie standard, et `RAPPORTEUR` de `tranches.mjs` dans un fichier par travail (`:94`). Il lit ce fichier en une liste de noms (`:101`). `conclure` ne juge que quatre choses : les échecs (sortie non nulle), le plafond, la couverture et le plancher (`tranches.mjs:274-287`). Le garde ne lit jamais de TAP, donc jamais `# skipped` ni `# SKIP`.
2. **Le rapporteur rend un test sauté comme un test joué.** `RAPPORTEUR` (`tranches.mjs:378-385`) écrit `{ nom }` pour tout `test:pass` de niveau 0. Or Node 22 émet un test sauté ou « todo » comme un `test:pass` qui porte `data.skip` ou `data.todo`. Le saut compte donc comme un passage, dans la couverture comme dans le plancher. Un sous-test (`nesting` > 0) et une suite (`details.type === "suite"`) ne sont jamais écrits : un `it.skip` dans un `describe` ne laisse aucune trace.
3. **`SAUTES` ne couvre que `references/`.** `references-posees.test.mjs:17-20` compare les lignes TAP `# SKIP` de son passage (`:60`, sous-tests indentés compris) à la liste (`:66`), et refuse tout « todo » (`:65`). Mais ce garde ne joue que les bancs des dossiers `references/` (`bancsDesReferences`, `pose-du-socle.mjs`). Les bancs de `skills/chaine/{fusionner,sujet,revue-adversariale,revue-de-ticket}/scripts/` n'y passent qu'en voisins, jamais comme bancs.
4. **Le relevé des sauts d'aujourd'hui.** Un grep de `skip` et de `todo` sur les 43 bancs des dossiers de `POSES` et de `FICHIERS_POSES` (`poses.test.mjs:18-33`) trouve un seul saut réel : `pr-titre.test.mjs:308`, `{ skip: !existsSync(new URL('../../ci/pr-titre.yml', import.meta.url)) }`. Posé sous `scripts/github/`, le banc cherche `<projet>/ci/pr-titre.yml`, qui n'existe pas : le test est sauté dans `poses.test.mjs` comme dans `references-posees.test.mjs`. C'est l'entrée unique de `SAUTES` aujourd'hui. Les autres occurrences sont du texte de cas, dans les chaînes de `tickets.test.mjs:418-508` et de `tickets-gate.test.mjs:75`. Ces deux bancs sont copiés sous `scripts/verify/` par `poses.test.mjs`, mais ils n'y sont pas joués (`:76` ne joue que `scripts/chaine` et `scripts/github`). Ils sont joués par `references-posees.test.mjs`.
5. **Les sauts de `socle-tests` sans `apps/api/`** (`A-257`, PR #171). Ce sont deux tests de `mutation-regles.test.mjs:240` et `:258`, sous `{ skip: SANS_CONFIG }`. Ce banc est sous `references/` : `poses.test.mjs` ne le joue pas. `references-posees.test.mjs`, lui, pose les gabarits Stryker sous `apps/api/` (`VOISINS` de `pose-du-socle.mjs`) : `SANS_CONFIG` y est faux, et rien n'y est sauté. Ces sauts ne se produisent donc dans aucun garde (décision 3).

## Décisions

Décidées le 2026-11-28 par l'architecte : **`A-266`**, **`A-267`** et **`A-268`**. Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-266` — Une seule liste, dans un module neuf, lue par les deux gardes.** `scripts/sautes-admis.mjs` exporte `SAUTES`, un tableau gelé de `{ banc, nom, raison }`. `banc` est le chemin du banc **dans le projet** (`scripts/github/pr-titre.test.mjs`), le même dans les deux gardes. Le module exporte aussi `sautesAttendus(bancs)`, qui rend les entrées dont le `banc` est dans `bancs`, triées par `banc` puis par `nom`. L'entrée d'aujourd'hui : ``{ banc: "scripts/github/pr-titre.test.mjs", nom: "le workflow donne PR_OUVERTE, la date d’ouverture de la PR, comme les autres entrées : par `env:`", raison: "le workflow vit sous .github/workflows/ dans un projet ; le banc ne le lit que dans le plugin" }`` (le nom recopié de `pr-titre.test.mjs:308`, à la lettre). L'en-tête du module reprend la phrase de `references-posees.test.mjs:16` : un autre saut est un banc qui ne se juge plus une fois posé. Pourquoi une seule liste : le saut de `pr-titre.test.mjs` est vu par les deux gardes. Avec deux listes, il serait écrit deux fois, avec deux raisons qui divergeraient. Pourquoi pas `pose-du-socle.mjs` : le ticket 114 le touche, et `poses.test.mjs` ne l'importe pas.
2. **`A-267` — Le rapporteur écrit les sauts, et `conclure` les juge.**
   - `RAPPORTEUR` écrit en plus, pour **tout** `test:pass` qui porte `data.skip` ou `data.todo` et pour **tout** `test:fail` qui porte `data.todo`, quels que soient son niveau et son type (suite comprise), une ligne `{ saute: <nom>, sorte: "skip" | "todo" }`. La ligne `{ nom }` des tests de niveau 0 ne change pas ; un test de niveau 0 sauté écrit les deux lignes. Un « todo » dont le corps échoue sort en `test:fail` portant `data.todo`, et `node --test` sort 0 quand même (joué : « Vérification », 2) : sans la lecture des `test:fail`, il passerait sans faute. Un test filtré par `--test-name-pattern` ou par `--test-skip-pattern` n'émet aucun événement sous Node 22 : les tranches et le reste n'écrivent pas de faux saut.
   - `poses.test.mjs:101` lit les deux sortes de lignes : `noms` (les seules lignes qui portent `nom`, filtrées : une ligne `saute` n'y entre jamais, sinon la couverture compterait un nom `undefined`) et `sautes` (lignes à `saute`, avec leur `sorte`), rendus dans le résultat du travail. Il passe `admis: sautesAttendus(bancs)` à `conclure` (`:129`).
   - `conclure` prend une option `admis` (par défaut `[]`) et lit `r.sautes` (par défaut `[]`). Il rattache chaque saut au `banc` de son travail et ajoute trois fautes :
     - `<banc> : « <nom> » est sauté sans être dans SAUTES (scripts/sautes-admis.mjs) : le rendre jugeable une fois posé, ou l'y déclarer avec sa raison`, pour un saut hors de la liste ;
     - `<banc> : « <nom> » est en todo : jamais jugé`, pour tout « todo » (aucun n'est admis, comme à `references-posees.test.mjs:65`) ;
     - `<banc> : « <nom> » est dans SAUTES mais n'a pas été sauté : retirer l'entrée`, pour une entrée admise non vue. La comparaison porte sur le couple `(banc, nom)` des seules lignes de `sorte` « skip » : un saut de même nom dans un autre banc, ou un « todo » de même nom, ne satisfait pas l'entrée. Cette faute est jugée seulement quand le plafond n'est pas atteint (sinon, la faute du plafond dit déjà les travaux non joués).
   - `bilan`, la couverture et le plancher ne changent pas : un test sauté compte toujours comme joué une fois.
3. **`A-268` — `references-posees.test.mjs` lit la même liste ; les sauts de `socle-tests` sans API n'y entrent pas.**
   - `SAUTES` quitte `references-posees.test.mjs:16-20` pour un import de `./sautes-admis.mjs`. L'assertion de `:66` devient `assert.deepEqual([...sautes].sort(), sautesAttendus(bancs).map((s) => s.nom).sort(), …)`, avec le même message. Le TAP ne nomme pas le fichier d'un test : la comparaison reste par noms, sur les seuls bancs de ce garde.
   - Les deux sauts de `mutation-regles.test.mjs` (`A-257`) ne vont pas dans la liste. Ils ne se produisent dans aucun garde (« La cause », 5) : déclarés, ils rougiraient les deux régimes en « n'a pas été sauté ». Leur raison est écrite dans le banc (`SANS_CONFIG`), et ils ne sautent que dans un projet sans API, où `A-257` les admet.
   - Une phrase de l'en-tête de `sautes-admis.mjs` le dit : la liste tient les sauts qu'un garde voit, et un saut conditionnel qu'aucun garde ne produit n'y entre pas.
4. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre (8.9.4 si la PR #179 est entrée en 8.9.3). La note dit que les gardes du plugin rougissent un saut non déclaré dans un banc posé, et qu'**un projet n'a rien à reposer** : `scripts/poses.test.mjs`, `scripts/references-posees.test.mjs`, `scripts/tranches.mjs` et `scripts/sautes-admis.mjs` ne sont jamais posés.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `scripts/sautes-admis.mjs` | **neuf** : `SAUTES` et `sautesAttendus` (décision 1) |
| `scripts/tranches.mjs:374-385` | `RAPPORTEUR` : la ligne `{ saute, sorte }` (décision 2) ; le commentaire qui le précède la décrit |
| `scripts/tranches.mjs:273-287` | `conclure` : l'option `admis`, les trois fautes (décision 2) ; l'en-tête du fichier (2-28) dit en une phrase que les sauts se jugent |
| `scripts/poses.test.mjs:99-103`, `:129` | **change à dessein** : la lecture rend `noms` et `sautes` ; `conclure` reçoit `admis: sautesAttendus(bancs)` ; l'import de `./sautes-admis.mjs` |
| `scripts/references-posees.test.mjs:16-20`, `:66` | **change à dessein** : `SAUTES` importée, la comparaison sur `sautesAttendus(bancs)`, triée ; même message, même résultat aujourd'hui (le seul saut de `pr-titre.test.mjs`) |
| `scripts/tranches.test.mjs:253-295` | **inchangé** : `conclure` sans `admis` ni `sautes` rend les mêmes fautes et les mêmes diagnostics |
| `scripts/tranches.test.mjs:385-405` | **inchangé** : le banc jouet n'a aucun saut ; il lit `JSON.parse(l).nom`, et aucune ligne `saute` n'y est écrite |
| `scripts/tranches.test.mjs`, après 410 | deux tests neufs (« Surfaces ») : le rapporteur, `conclure` |
| `scripts/sautes-admis.test.mjs` | **neuf** : un test, `sautesAttendus` (« Surfaces ») ; `pnpm test` le joue déjà (`scripts/*.test.mjs`) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note (décision 4) |

Modèles : `references-posees.test.mjs:59-66` pour la lecture des sauts et leur message ; `tranches.test.mjs:385-405` pour un vrai banc jouet joué sous le rapporteur, en texte constant, sans valeur interpolée (`A-157`).

## À faire, dans l'ordre

1. **Partir de `main`** : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** : les deux tests neufs de `tranches.test.mjs` (le rapporteur n'écrit pas encore de saut, `conclure` ne lit pas `admis`) et celui de `sautes-admis.test.mjs` (le module absent). Trois tests neufs en tout.
3. **`sautes-admis.mjs`**, puis **`RAPPORTEUR`** et **`conclure`** (décisions 1 et 2), puis **`poses.test.mjs`**, puis **`references-posees.test.mjs`** (décision 3). Les bancs verts.
4. Un commit ; la version et sa note.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `RAPPORTEUR` sur un banc jouet constant qui porte `test("a", (t) => { t.skip("raison"); })`, `test("b", { todo: "plus tard" }, …)`, `test("b2", { todo: true }, () => { throw new Error("x"); })`, `test("c", async (t) => { await t.test("sous", { skip: true }, …); })`, `test.skip("d", …)`, `describe("e", () => { it.skip("f", …); })` et `test("g", …)` : le joueur sort 0 ; les lignes `saute` sont exactement `a` skip, `b` todo, `b2` todo, `sous` skip, `d` skip, `f` skip ; les lignes `nom` sont celles d'aujourd'hui (`a`, `b`, `b2`, `c`, `d`, `g`) | `tranches.test.mjs`, test neuf |
| le même banc joué avec `--test-skip-pattern=^g$` : aucune ligne `saute` pour `g` ; puis avec `--test-name-pattern=^a$` : la seule ligne `saute` est `a`, aucune pour les tests filtrés | de même |
| `conclure` : un saut admis vu, aucune faute ; un saut hors de la liste, sa faute ; un « todo », sa faute ; une entrée admise non vue, sa faute ; une entrée admise vue seulement dans un autre banc, ou seulement en « todo », sa faute « n'a pas été sauté » ; la même avec `depasse` vrai, pas de faute « n'a pas été sauté » ; sans `admis` ni `sautes`, les fautes d'aujourd'hui | `tranches.test.mjs`, test neuf |
| `sautesAttendus` : les entrées des seuls bancs donnés, triées par `banc` puis `nom` ; `SAUTES` gelé | `scripts/sautes-admis.test.mjs`, test neuf |
| les bancs posés sous `scripts/chaine/` et `scripts/github/` : le saut de `pr-titre.test.mjs` vu et admis, rien d'autre | `scripts/poses.test.mjs`, vert |
| les bancs de `references/`, régimes 8 et 7 : même résultat qu'aujourd'hui | `scripts/references-posees.test.mjs`, vert |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `{ skip: true }` ajouté au premier test de `skills/chaine/sujet/scripts/sujet.test.mjs` (un saut hors de la liste) | `poses.test.mjs` : « est sauté sans être dans SAUTES » |
| dans le premier test de `skills/chaine/sujet/scripts/sujet-refs.test.mjs` (`:30`), un sous-test `await t.test("sous", { skip: true }, () => {})` : le banc, à sous-tests, se joue entier, et aucun banc posé n'en écrit aujourd'hui (`tranches.test.mjs:161`) | `poses.test.mjs` : « est sauté sans être dans SAUTES » (le sous-test, niveau 1) ; `tranches.test.mjs:161` rougit aussi, à juste titre |
| `{ todo: true }` ajouté à un test de `skills/chaine/fusionner/scripts/` | `poses.test.mjs` : « est en todo » |
| l'entrée de `pr-titre.test.mjs` retirée de `SAUTES` | `poses.test.mjs` (saut hors de la liste) et `references-posees.test.mjs`, régimes 8 et 7 |
| une entrée de plus dans `SAUTES`, sur un test de `scripts/chaine/` qui n'est pas sauté | `poses.test.mjs` : « n'a pas été sauté » |
| `RAPPORTEUR` qui n'écrit les sauts qu'au niveau 0 | le test neuf du rapporteur (`sous`, `f`) |
| `RAPPORTEUR` qui ne lit que `test:pass` | le test neuf du rapporteur (`b2`) |
| `conclure` qui ignore `admis` (toute ligne `saute` acceptée) | le test neuf de `conclure` |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test scripts/tranches.test.mjs scripts/sautes-admis.test.mjs`, rouge à l'étape 2 et vert après ; puis `env -u NODE_PATH node --test scripts/poses.test.mjs scripts/references-posees.test.mjs`, en tâche de fond, verts.
2. Joué en écrivant ce ticket, sous Node 22.23 : `pr-titre.test.mjs` posé sous `scripts/github/` d'un jouet (avec `scripts/chaine/`, `scripts/docs/` et `scripts/verify/` posés), TAP `# skipped 1`, la ligne `ok 12 - le workflow donne PR_OUVERTE… # SKIP`. Sous un rapporteur qui écrit les événements, ce test sort en `test:pass` avec `skip: true`, au niveau 0. `t.skip("raison")` sort avec `skip: "raison"`, `{ todo }` avec `todo`, un « todo » dont le corps lève en `test:fail` avec `todo: true` (le joueur sort 0), un sous-test sauté au niveau 1, `describe.skip` en `test:pass` de niveau 0 avec `skip`, et `it.skip` dans un `describe` au niveau 1. Un test filtré par `--test-name-pattern` ou `--test-skip-pattern` n'émet rien (`--test-name-pattern=^a$` : la seule ligne est `a`).
3. Les mutations : toutes rouges.
4. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` plus `# skipped`. Le relevé part du compte de `main` au départ, plus les tests neufs ; il est recopié dans la PR. La session lit le job `bancs` de sa PR avant de rendre la main (`A-212`).

## Ce qui n'a pas été établi

- Les bancs copiés sous `scripts/docs/` et `scripts/verify/` par `poses.test.mjs` ne sont pas joués par lui ; `references-posees.test.mjs` les joue. Le ticket n'élargit pas ce que `poses.test.mjs` joue.
- Un projet sans `apps/api/` saute les deux tests de `mutation-regles.test.mjs` (`A-257`). Aucun garde du plugin ne joue cette configuration : ces sauts ne sont ni vus ni comptés.
- Un saut obtenu sans `skip` ni `todo` (un test qui sort tôt par un `return` sous une condition) : invisible pour Node, donc pour ce garde. Le gate `tests-creux` des projets ne le voit pas non plus.

## Hors périmètre

- La règle « saut avec ticket » des tests de code d'un projet (`tests-creux`, `socle-tests`) : inchangée.
- Le garde étendu au lint et à `check:contexte` : ticket 114.

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `36accb9` (plugin 8.9.2), sur le constat de la contre-relecture de la PR #179. Les sauts des 43 bancs des dossiers posés ont été relevés par grep. Le saut de `pr-titre.test.mjs` posé et les événements de Node 22 pour chaque forme de saut ont été joués.
- 2026-11-28 — Retouche après relecture : le « todo » qui échoue (`test:fail` portant `todo`) écrit sa ligne `saute`, joué sous Node 22.23 ; cas `b2` et sa mutation ; `--test-name-pattern` au banc jouet ; `sautes-admis.test.mjs` neuf ; le couple `(banc, nom)` de la faute « n'a pas été sauté » ; le filtre de `noms` ; la mutation du sous-test nommée sur `sujet-refs.test.mjs`. `Status: ready-for-agent`.
