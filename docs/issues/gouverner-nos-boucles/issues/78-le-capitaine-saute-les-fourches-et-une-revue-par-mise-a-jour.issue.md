# Le capitaine, suites de la PR 149 : une PR de fourche sautée, une revue par PR de mise à jour, le motif d'une mise à jour sans ticket

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — trois suites de la contre-relecture de la PR 149 (Q2, M1, M2 ; `A-192` point 2), chacune avec sa décision et ses cas de banc ; le code entier est dans le patch ([`78-annexes/ticket-78.patch`](78-annexes/ticket-78.patch), sha256 `f582b4a1c897fce36cc1ab5f69b1c82047817ec8b0d1730e66a5eb306b5f0283`, `git apply` sur `97d17e3`), décrit ci-dessous ; un banc neuf, rouge avant le code, vert après ; les mutations de [`78-annexes/mutations.mjs`](78-annexes/mutations.mjs) toutes rouges. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Premier des deux tickets de la PR B (78, 79) : « Une PR, deux tickets ».
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs`, `skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs` (neuf) : aucun autre ticket de suite ne les touche, et le lot 6 non plus, d'après sa liste (`fusionner/SKILL.md`, `sujet/SKILL.md`, et non leurs scripts). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : portés par le ticket 79 pour la PR B ; la PR A (tickets 75 à 77) les touche aussi.

## Le besoin

La contre-relecture de la PR 149 (`71-73-annexes/contre-relecture-9db4fb3/rapport.md`, premier tour, question 2 ; troisième tour, « Ce qui reste à la suite », Q2, M1 et M2). Faits lus sur `main` à `97d17e3` (plugin 7.39.0), et rejoués par le banc neuf (§ 1) :

### Q2 — une PR de fourche n'est pas sautée (`A-192`, point 2)

Ni `passer.sh` ni `sujet.sh fusionner` ne regardent `head.repo`. Ils lisent `head.ref` puis `git fetch origin develop "$tete"` et jugent `origin/<tête>` : pour une fourche dont la branche porte le nom d'une branche d'origin, c'est **la branche d'origin du même nom** qui est jugée, mise à jour, poussée et fusionnée. Mesuré : sur le dépôt jouet, une PR de fourche (`head.repo.full_name` « autre/jouet ») à tête `feat/a`, `feat/a` existant sur origin, sort en **0** de `passer.sh`, en régime 8 comme en régime 7, et `sujet.sh fusionner` fusionne de même la sous-PR. **`sujet.sh relancer`** non plus (le tour de relecture, `A-199` point 1) : `boucle.sh` le joue pour une sous-PR « prête (sans CI) » ou « prête (en conflit) », l'état ordinaire d'une fourche, dont les workflows attendent l'approbation d'un membre ; il fetche `+refs/heads/<tête>` d'origin et, la fourche au même sommet que la branche d'origin qu'elle a copiée, y fusionne le sujet et la pousse (`75-79-relecture-tour-1/essais/fourche-relancer.txt` : `push -q origin HEAD:refs/heads/feat/a`, dans les deux régimes, et par `boucle.sh` de bout en bout). Le Relecteur, lui, dit une fourche illisible (« PR de fourche : sa tête vit hors du dépôt »), et une fourche n'a jamais de verdict.

### M1 — une PR de mise à jour d'un sujet joue `revue_du_capitaine` deux fois au premier contrôle

`sujet.sh fusionner`, en régime 8 : la première revue, sur la résolution seule, ne sert qu'à lire le régime ; la seconde rejoue tout (un `git fetch` de develop et des sujets, une lecture paginée des commentaires) sur la résolution et les retouches. Coût seul : mesuré, quatre lectures des commentaires de la PR pour une PR de mise à jour validée qui entre (deux au premier contrôle, une du verrou du passage, une au second contrôle).

### M2 — une PR de mise à jour d'un sujet que rien ne déclare reçoit le motif d'une PR sans ticket

Quand aucun ticket ni aucune spec de la carte ne déclare le sujet, `sujet.sh` passe `--tickets ""` à la garde du capitaine (`chemins-sensibles.mjs --garde`), qui rend « PR sans ticket qui touche un chemin sensible … puis la PR repart de la branche de ce ticket » : ce geste ne vaut pas pour une PR de mise à jour, dont la fusion de develop a résolu un conflit sur ce chemin.

## Une PR, deux tickets

La PR B porte les suites du capitaine et du hook d'édition : ce ticket et le ticket 79 (le hook, `garde-fichiers.mjs` et `regles.mjs`). Elle ne touche aucun fichier de la PR A (tickets 75 à 77) hors des deux fichiers de version : les deux PR partent en parallèle, et celle qui entre en second suit la règle du ticket 79, § 3.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/passer.sh` | après le contrôle de `fusion-bloquée`, la garde de fourche (sortie 7) ; l'en-tête, sortie 7 |
| `skills/chaine/sujet/scripts/sujet.sh` | `fusionner` : la garde de fourche après le brouillon ; le premier contrôle, une seule revue (`prevu`, `lister`) ; `relancer` : la même garde, juste après la lecture de la PR |
| `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs` | `garde` : le motif d'une PR de mise à jour d'un sujet que rien ne déclare |
| `skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs` | neuf : six cas, un espion de `git fetch` et `push` dans les trois cas de fourche |

## Décisions

1. **Une PR de fourche est sautée sans renvoi (7)** par `passer.sh`, par `sujet.sh fusionner` et par `sujet.sh relancer` (`A-199` point 1 : une garde qui manque sur un des trois chemins n'est pas une garde), dans les deux régimes, **avant tout fetch de sa tête**, ce qu'un espion de `git fetch` et `push` prouve dans le banc de chacun : la fourche se lit par `head.repo.full_name` différent de `base.repo.full_name`, une tête sans dépôt (`head.repo` nul, une fourche supprimée) comprise. Motif : « `PR de fourche (<dépôt de la tête>, ou « dépôt supprimé ») : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi` » (`#<n> : ` en tête dans `sujet.sh`, `fusionner` comme `relancer`). Raison (`A-192`, point 2) : comme le Relecteur ; une fourche ne peut pas obtenir de verdict, et sa tête n'est pas `origin/<tête>`. Pas de renvoi : son auteur n'a pas de session de la chaîne à qui renvoyer.
2. **Une seule revue au premier contrôle d'une PR de mise à jour** (M1) : le régime se lit d'abord, sans réseau, sur le sujet que `fusionner` vient de relire (`regime_de_la_pr` de `github.sh`, `regimeDeLaPr` de `revue-exigee.mjs`), et la revue reçoit d'emblée la liste de ce régime (`lister` : en régime 8, la résolution et les retouches ; sinon la résolution seule, comme aujourd'hui). Si la revue lit un autre régime que celui lu d'abord (le contrat du sujet a changé entre les deux lectures), elle est rejouée une fois, sur la liste du régime qu'elle a lu. Une sous-PR ordinaire n'est pas concernée (`prevu` reste 7, la liste est la même dans les deux régimes).
3. **Le motif d'une PR de mise à jour d'un sujet que rien ne déclare** (M2) : quand `--tickets` est donné et vide, `garde` rend (sortie 20) « `PR de mise à jour de <base> : aucun ticket ni aucune spec ne déclare ce sujet (ligne \`Sujet: <base>\`), et sa fusion résout un conflit sur un chemin sensible (<chemins>) : l'écrire au conducteur ; un ticket du sujet, déclaré par cette ligne, accorde le chemin sur sa ligne \`Sensibles:\` par une PR de documentation vers le sujet (A-74, A-75), puis la PR de mise à jour repasse` ». Sans `--tickets`, une PR sans ticket garde son motif (`A-73`). Le chemin hors des conflits est jugé avant, inchangé. `sujet.sh` ne change pas pour ce point : il passe déjà `--tickets` à une PR de mise à jour.

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser. Les deux tickets de la PR B se jouent l'un après l'autre dans la même branche : ce § 0 une fois, puis les § 1 et § 2 de 78 et de 79, puis le § 3 du ticket 79.

### § 0 — Partir de `main`, les annexes des deux tickets

```bash
git fetch origin main '+refs/heads/claude/hopeful-lovelace-ouk6tz:refs/remotes/origin/claude/hopeful-lovelace-ouk6tz'
git switch -C claude/suites-capitaine origin/main
for n in 78 79; do mkdir -p "$S/$n" && for f in ticket-$n.patch mutations.mjs; do git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/$n-annexes/$f" > "$S/$n/$f"; done; done
git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/79-annexes/version-suivante.mjs" > "$S/79/version-suivante.mjs"
sha256sum "$S"/78/ticket-78.patch "$S"/79/ticket-79.patch
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation y est entrée), et s'écrivent dans `S`, jamais dans le dépôt. Les sommes attendues : **`f582b4a1c897fce36cc1ab5f69b1c82047817ec8b0d1730e66a5eb306b5f0283`**, **`126f2e2d48619246f0e34ecdb39d0048d4ac8dffd716a8985dedf5bf0258da5f`** ; une autre : s'arrêter. La version de `main` : 7.39.0 (`97d17e3`), 7.39.1 si la PR A est entrée avant, 8.0.0 depuis l'entrée du lot 6 (`ddb4265`, PR 151, le 2026-11-22 : le cas d'aujourd'hui), 8.0.1 si la PR A y est entrée ensuite ; les gestes sont les mêmes ; les comptes des § 1 et § 2 aussi (le lot 6 ne touche aucun de leurs bancs : rejoué au tour de relecture), ceux de la suite entière sont ceux de la table du ticket 79, § 3.

### § 1 — Le banc neuf d'abord, vu rouge, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='*.test.mjs' "$S/78/ticket-78.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Un fichier posé (`?? skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs`). Attendu : `# tests 6`, `# pass 1`, `# fail 5`, et les `not ok` : les trois cas de fourche (`passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer` : la branche d'origin du même nom lue, fusionnée ou poussée), « … ne joue qu'une revue du capitaine au premier contrôle… » (quatre lectures des commentaires) et « garde du capitaine : une PR de mise à jour d'un sujet qu'aucun ticket ne déclare… » (le motif d'une PR sans ticket). Le cas « … le régime lu d'abord diffère… » est vert sans le code : le code d'avant rejoue toujours la revue sur la liste du régime 8 ; il tient la seconde revue que la décision 2 garde, et la mutation M1b le fait rougir. Recopier les comptes dans la PR.

### § 2 — Le patch, dans la branche, et les bancs verts

```bash
git apply "$S/78/ticket-78.patch" && git status --short
timeout 1200 node --test --test-reporter=tap skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Attendu : `# tests 114`, `# pass 114`, `# fail 0`. Puis le ticket 79, § 1.

Le patch, fichier par fichier (il fait foi) :

- **`passer.sh`** : après `case "$labels" in *,fusion-bloquée,*) …`, le commentaire et la garde : `[ "$(champ '.head.repo.full_name // ""')" = "$(champ '.base.repo.full_name // ""')" ] || sortir 7 "PR de fourche (…) : …"` ; l'en-tête, sortie 7, « PR de fourche » ajouté à la liste.
- **`sujet.sh`**, `relancer` : juste après `pr_json`, avant `refuser_tete_gardee` et tout fetch, la même garde, par `jq` sur `$pr`. `fusionner` : après le contrôle du brouillon, la même garde ; au premier contrôle, `prevu` (7, ou `regime_de_la_pr "$base" <created_at>` pour une PR de mise à jour), `lister <régime>`, une revue, puis, si `REGIME` lu diffère de `prevu` et que la revue a jugé (0 ou 1), une seconde sur `lister "$REGIME"`.
- **`chemins-sensibles.mjs`**, `garde` : juste après le calcul de `ids`, le motif de la décision 3.
- **`suites-du-lot-5.test.mjs`** (neuf) : `espionReseau`, un `git` du `PATH` qui note chaque `fetch` et chaque `push` puis joue le vrai, posé dans les trois cas de fourche (« aucun fetch avant la garde ») ; « passer.sh : une PR de fourche… » (les deux régimes, puis une tête sans dépôt par un `gh` qui rend `head.repo` nul) ; « sujet.sh fusionner : une sous-PR de fourche… » ; « sujet.sh relancer : une sous-PR de fourche « prête (sans CI) »… » (les deux régimes, la fourche au sommet de la branche d'origin qu'elle a copiée, le sujet en avance : rien de fetché ni de poussé) ; « … une PR de mise à jour ne joue qu'une revue du capitaine au premier contrôle… » (un `gh` qui compte les lectures des commentaires : trois) ; « … le régime lu d'abord diffère de celui que la revue relit… » (un `node` du `PATH` qui rend 7 à `regime_de_la_pr`, une retouche sur un chemin sensible hors conflit : la revue rejouée la voit, renvoi en 4) ; « garde du capitaine : une PR de mise à jour d'un sujet qu'aucun ticket ne déclare… » (par `sujet.sh`, puis la garde seule, avec et sans `--tickets`).

## Surfaces

| Surface | Preuve |
| --- | --- |
| `passer.sh` saute une PR de fourche (7), dans les deux régimes, avant tout fetch (l'espion) : la branche d'origin du même nom ne bouge pas, rien n'est écrit | `suites-du-lot-5.test.mjs`, « passer.sh : une PR de fourche… » ; mutations F1, F3ʹ |
| Une tête sans dépôt (fourche supprimée) est une fourche | le même test ; F2 |
| `sujet.sh fusionner` saute une sous-PR de fourche (7), avant tout fetch | « sujet.sh fusionner : une sous-PR de fourche… » ; F4ʹ, F6 |
| `sujet.sh relancer` saute une sous-PR de fourche (7), dans les deux régimes, avant tout fetch : la branche d'origin du même nom n'est ni mise à jour ni poussée | « sujet.sh relancer : une sous-PR de fourche « prête (sans CI) »… » ; F5 |
| Une PR de mise à jour en régime 8 : une revue au premier contrôle, trois lectures des commentaires en tout | « … ne joue qu'une revue du capitaine au premier contrôle… » ; M1a |
| Le régime relu diffère : la revue rejouée sur la liste de son régime, retouches comprises | « … le régime lu d'abord diffère… » ; M1b, M1c |
| Le motif d'une PR de mise à jour d'un sujet que rien ne déclare ; une PR sans ticket garde le sien | « garde du capitaine : une PR de mise à jour d'un sujet qu'aucun ticket ne déclare… » ; M2a, M2b |
| Le régime 7, le reste des gardes et du verdict | les bancs de `sensibles-du-capitaine`, `verdict-du-capitaine`, `sujet-fusionner`, `chemins-sensibles`, et la suite entière |

## Mutations

[`78-annexes/mutations.mjs`](78-annexes/mutations.mjs), depuis la racine, la branche commitée (ticket 79, § 3) : `node "$S/78/mutations.mjs"`. Journal : [`78-annexes/mutations.txt`](78-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| F1 passer.sh : une PR de fourche n'est pas sautée (le code d'avant, Q2 de la PR 149) | `suites-du-lot-5.test.mjs` | rouge (8 s) |
| F2 passer.sh : une tête sans dépôt (fourche supprimée) passe pour une tête du dépôt | `suites-du-lot-5.test.mjs` | rouge (12 s) |
| F3ʹ passer.sh : la garde de fourche déplacée après le fetch de la tête (la branche d'origin du même nom lue), avant toute écriture | `suites-du-lot-5.test.mjs` | rouge (8 s) |
| F4ʹ sujet.sh fusionner : une sous-PR de fourche n'est pas sautée | `suites-du-lot-5.test.mjs` | rouge (12 s) |
| F5 sujet.sh relancer : une sous-PR de fourche n'est pas sautée (le code d'avant : la branche d'origin du même nom mise à jour et poussée) | `suites-du-lot-5.test.mjs` | rouge (9 s) |
| F6 sujet.sh fusionner : la garde de fourche déplacée après le fetch de la tête | `suites-du-lot-5.test.mjs` | rouge (9 s) |
| M1a sujet.sh fusionner : le régime n'est pas lu d'abord (deux revues au premier contrôle, le code d'avant en coût) | `suites-du-lot-5.test.mjs` | rouge (8 s) |
| M1b sujet.sh fusionner : la revue n'est pas rejouée quand le régime relu diffère de celui lu d'abord | `suites-du-lot-5.test.mjs` | rouge (8 s) |
| M1c sujet.sh fusionner : la liste d'une PR de mise à jour en régime 8 sans ses retouches | `suites-du-lot-5.test.mjs` | rouge (8 s) |
| M2a chemins-sensibles.mjs : une PR de mise à jour sans ticket déclaré reçoit le motif d'une PR sans ticket (le code d'avant) | `suites-du-lot-5.test.mjs` | rouge (7 s) |
| M2b chemins-sensibles.mjs : toute PR sans ticket reçoit le motif d'une PR de mise à jour | `suites-du-lot-5.test.mjs` | rouge (7 s) |

11 rouges sur 11. F3ʹ et F6 déplacent la garde (deux remplacements) ; F4ʹ et F5 s'ancrent sur le commentaire de leur garde, dont le texte est deux fois dans `sujet.sh`.

## Vérification

1. § 1 : 5 rouges sur 6 avant le code ; § 2 : 114 verts sur 114 (les cinq bancs).
2. Les mutations : « toutes rouges » (11).
3. La suite entière et le diff : ticket 79, § 3.

### Ce qui a été joué en écrivant ce ticket

Écrit sur un clone neuf de `https://github.com/MAJ-agency/skills` à `97d17e3` (plugin 7.39.0), le 2026-11-22, Node 22.23.5, git 2.43.0 ; puis rejoué au tour de relecture (`75-79-relecture-tour-1/rapport.md`, `A-199`), sur les patchs retouchés, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) :
- **Les patchs** : chacun des deux, `git apply --check` seul sur `97d17e3` ; puis 78 et 79 l'un après l'autre : l'arbre obtenu (`cd47a2b6…`) est celui de la branche que les § 1 à 3 construisent (patchs, `--exclude`, `version-suivante.mjs`, 7.39.1). Les autres ordres d'entrée (le § 3 du ticket 79) : joués de bout en bout, voir ce ticket.
- **Les blocs des § 1 et § 2 des deux tickets**, joués tels quels sur une branche neuve de `97d17e3` : 78, 5 rouges sur 6 puis 114 verts sur 114 ; 79, 5 rouges sur 98 puis 167 verts sur 167 ; `version-suivante.mjs` pose 7.39.1, rejoué il sort en 1 ; `--stat` : 10 fichiers.
- **Les mutations des deux tickets**, chacune seule, sur la branche commitée, le fichier remis après : 11 et 8, **19 rouges sur 19** (journaux dans les annexes).
- **La suite entière** : ticket 79, § 3.
- **Le régime 7 à l'appel près** (tour de relecture, `75-79-relecture-tour-1/essais/espion-comparaison.txt`) : les 19 bancs de `main` sous l'espion de la contre-relecture de la PR 149, contre les scripts de `main` puis contre ceux de la PR B : 560 lancements, 8 022 appels `gh`, 6 567 appels `git` au réseau, identiques ligne pour ligne.

## Ce qui n'a pas été établi

1. **Une vraie PR de fourche sur GitHub** : la forme de `head.repo` est celle de l'API REST (`head.repo.full_name`, `null` pour une fourche supprimée), jouée par le faux GitHub (`fourche`) et un `gh` qui la rend nulle, pas lue sur une vraie fourche.
2. **Une sous-PR de fourche garde son sujet** : `sujet.sh fusionner` et `sujet.sh relancer` sortent en 7, que `traiter_sujets` traite comme le verrou d'un autre capitaine (pour `relancer`, sa ligne dit « en passage chez un autre capitaine », le motif de la fourche étant la ligne d'avant) ; les autres sous-PR du sujet attendent tant qu'elle porte `à-fusionner` (`A-185`, point 2 : la sous-PR sautée qui garde son sujet est au lot 6, partie 6b).
3. **`file.sh`** liste toujours une PR de fourche étiquetée `à-fusionner` : elle est sautée à chaque passage, sans bruit, comme une PR sans verdict lisible. Une étiquette ne se pose sur une fourche que par un membre du dépôt.
4. **`sujet.sh regrouper`** recible une PR de fourche vers develop dans un sujet (`PATCH base`, `sujet-auto`, un commentaire), sans fetch ni push : elle devient une sous-PR, sautée ensuite. Lu, non joué ; à la liste des suites (`A-199` point 4).
5. **`fusionner/SKILL.md`** ne nomme pas « PR de fourche » parmi les sorties 7 : lot 6 ou une suite, pas ce ticket.

## Hors périmètre

- `fusionner/SKILL.md` et `sujet/SKILL.md` (les textes du capitaine) : lot 6.
- Le Relecteur, qui saute déjà une fourche (« PR de fourche », cause d'illisible).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `A-192` (point 2) et la contre-relecture de la PR 149 (Q2 ; M1 et M2, relevés en lecture au premier tour, listés au troisième), sur un clone neuf de `main` à `97d17e3` ; banc, mutations et suite joués (« Ce qui a été joué »).
- 2026-11-22 — Retouché au tour de relecture (`75-79-relecture-tour-1/rapport.md`, constats 1, 2 et 8 ; `A-199` point 1), par le relecteur : la garde de fourche dans `sujet.sh relancer` (le bloquant), l'espion de `git fetch` et `push` dans les trois cas de fourche, un cas neuf ; mutations F3ʹ, F4ʹ, F5, F6 ; `ticket-78.patch` neuf (`f582b4a1…`), comptes du § 1 (6, 5 rouges) et du § 2 (114) ; blocs, mutations et suite rejoués.
