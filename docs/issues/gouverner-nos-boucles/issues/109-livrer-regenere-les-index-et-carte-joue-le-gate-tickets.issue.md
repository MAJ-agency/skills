# Ce que `sujet.sh` pousse sur un sujet passe ce que la CI jugera : `livrer` régénère les index, `carte` joue le gate `tickets`

Status: needs-triage
Type: défaut
Modèle: sonnet — deux gestes de `sujet.sh` qui poussent sur un sujet gagnent le contrôle que la CI fait ensuite (`livrer` : la régénération des index, sur le modèle de `rafraichir` ; `carte <nom>` : le gate `tickets`, dans un worktree détaché), deux phrases du skill `sujet` et leurs bancs ; la forme est fixée par les décisions `A-248` et `A-249`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 108
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh` (en-tête de `livrer` et de `carte <nom>`, 29-35 et 59-67 ; `livrer` 1176-1244 ; `carte_sujet` 1640-1683) ; `skills/chaine/sujet/SKILL.md` (« Pousser la carte », 88-91 ; « Livrer », 92-94) et `references/CONTENU.md` ; `skills/chaine/chantier/SKILL.md` (§ 7, point 1, 120) ; `skills/chaine/sujet/scripts/sujet.test.mjs` (`livrer`, 548-640) et `sujet-carte.test.mjs` (39-216) ; `skills/chaine/sujet/scripts/depot-jouet.mjs` (un faux gate `tickets`, si le jouet n'en a pas) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 108, en second** : 108 touche `sujet.sh` (`sujet_livre`, `regrouper-series`, `clore`), `sujet/SKILL.md:94-98`, `chantier/SKILL.md:120` et `:124`, et `sujet.test.mjs` après `:546` ; d'où `Blocked by: 108`. Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 108 : relire chaque ligne citée sur la branche.

## Le besoin

Deux trouvailles, un défaut commun : un geste de `sujet.sh` pousse sur un sujet un état que la CI refusera ensuite, alors que le contrôle tient sur le poste qui pousse.

1. **`livrer` ne régénère pas les index** (cas 12 de l'essai réel, 2026-11-22, 13 h 30 et 13 h 28 UTC ; passation du 2026-11-23, « Les trouvailles du cas 12 »). La livraison d'`anchorpost-essai` (PR 5) est partie avec `anchorpost/anchorpost.json` périmé : l'index porte un état croisé de deux sous-PR, que chacune, régénérée sans l'autre, ne pouvait pas voir. Sa CI `qualite` est tombée deux fois, et le capitaine l'a renvoyée ; le conducteur a régénéré l'index à la main. « Gravité basse : le pire cas est une livraison rouge puis renvoyée, jamais un develop abîmé. » Le même défaut vaut pour tout commit poussé sur le sujet sans régénération (la carte, par exemple).
2. **`sujet.sh carte <nom>` ne joue pas le gate `tickets`** (passation du 2026-11-23, point 3). Le conducteur a poussé sur le sujet une carte au gate rouge (une cellule de `## Dépassements`), corrigée au commit suivant.

Le besoin : **`livrer` régénère les index sur la tête de la livraison avant d'ouvrir la PR ; `carte <nom>` refuse une carte dont le gate `tickets` est rouge**, avant de pousser.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/sujet/scripts/sujet.sh:1176-1244` (`livrer`) : lecture du gel, de la phase, des sous-PR ouvertes, de l'ordre des migrations, puis la PR (`:1227`). Aucune régénération. La livraison intermédiaire pousse sa branche jetable depuis `origin/sujet/<nom>` tel quel (`:1218`).
2. Le passage du capitaine régénère bien, mais trop tard pour cette PR : `passer.sh:328` (`regenerer_index`) ne joue que sur une PR « prête ». Une livraison dont la CI est rouge à l'ouverture n'y arrive pas : la boucle relance ses jobs (`boucle.sh:279-293`), puis la renvoie (`:295`).
3. Le modèle existe : `rafraichir` (`sujet.sh:1109-1172`) se place sur le sujet (`:1118`), installe (`:1149`), régénère (`regenerer_index`, `:1150`), commite (`:1151-1156`) et pousse sous les hooks (`pousser`, `:1159`), avec ses sorties 3, 5, 6 et 11.
4. `skills/chaine/sujet/scripts/sujet.sh:1640-1683` (`carte_sujet`) : chaque commit ne touche qu'une carte, en place, qui cite le sujet avant et après, formatée par Prettier (`:1673-1677`) ; puis le push (`:1681`). Le gate `tickets` (`scripts/verify/tickets.mjs` du projet, skill `tickets`) n'est pas joué. Il lit les fichiers suivis par git (`git ls-files`) depuis la racine où il est, sans dépendance : il se joue dans un worktree détaché.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-248`** et **`A-249`** (il les versera à la spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-248` — `livrer` régénère les index de la tête qu'il va livrer**, avant d'ouvrir la PR et avant de pousser la branche jetable, comme `rafraichir` : arbre de travail propre exigé (sortie 6, sinon), placement sur `origin/sujet/<nom>` (`git switch -q -C sujet/<nom> origin/sujet/<nom>`), `pnpm install --frozen-lockfile --prefer-offline`, `regenerer_index`, puis, si l'index a changé, `git commit -q -m 'docs: régénère les index avant la livraison'` sous les hooks. Livraison complète : ce commit est poussé sur `sujet/<nom>` (`pousser`, sommet lu avant le push) avant la PR. Livraison intermédiaire : la branche jetable part de ce commit (`HEAD`), `sujet/<nom>` n'est pas poussé. Rien à régénérer : rien de poussé de plus. La branche courante d'avant est rendue à la fin, quelle que soit l'issue (`git switch -q -`).
2. **Ses sorties** : celles de `rafraichir` pour ces étapes, avec un motif propre à `livrer` : 6 arbre pas propre ; 3 régénération en échec ou commit refusé par un hook, ou push refusé par le hook pre-push, « aucune PR ouverte » ; 5 le sujet a bougé ; 11 push refusé par le distant. Aucune PR n'est ouverte sur un échec. **Sans `gh` utilisable** (`livraison_sans_gh`, sortie 14), la régénération se fait de même ; en livraison complète, son commit est poussé avant la sortie 14 ; en intermédiaire, la consigne de pousser la branche jetable (`:1254-1255`) nomme ce commit.
3. **`A-249` — `carte <nom>` joue le gate `tickets` sur le sommet qui part**, après le dernier contrôle de Prettier et avant le push : si `scripts/verify/tickets.mjs` est dans l'arbre de ce sommet, `git worktree add -q --detach <temporaire> <sommet>`, `node scripts/verify/tickets.mjs` depuis ce worktree, puis `git worktree remove --force <temporaire>`. Rouge : `REFUS : gate tickets rouge sur <sommet court> : <dernière ligne non vide de sa sortie> ; corriger la carte, puis relancer`, sortie 9, rien de poussé. Absent : la ligne `gate tickets absent du sommet : non joué`, et le push. Jamais `pnpm` : le gate est un script `node` sans dépendance.
4. **Les textes** : l'en-tête de `sujet.sh` (`livrer`, `carte <nom>`) ; `sujet/SKILL.md:88-91` (« Pousser la carte ») dit le gate ; `:94`, que la livraison régénère les index ; `chantier/SKILL.md:120`, qu'une livraison proposée au produit demande un arbre propre ; `sujet/references/CONTENU.md`, les deux raisons en une phrase chacune (le cas 12, la carte de l'essai).
5. **La version** : celle de la PR de 108 et 109 ; la note : les projets reposent `sujet.sh` (`sujet poser`).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/sujet/scripts/sujet.sh:29-35`, `:59-67` | l'en-tête de `livrer` et de `carte <nom>` |
| `skills/chaine/sujet/scripts/sujet.sh:1176-1244` | la régénération avant la PR (décisions 1 et 2) ; modèle `rafraichir`, `:1109-1172` |
| `skills/chaine/sujet/scripts/sujet.sh:1246-1264` | `livraison_sans_gh` : la consigne de la branche jetable (décision 2) |
| `skills/chaine/sujet/scripts/sujet.sh:1677-1681` | le gate, entre Prettier et le push (décision 3) |
| `skills/chaine/sujet/SKILL.md:88-91`, `:94`, `references/CONTENU.md` | décision 4 |
| `skills/chaine/chantier/SKILL.md:120` | décision 4 |
| `skills/chaine/sujet/scripts/sujet.test.mjs` | les tests neufs de `livrer`, après `:640` ; **`:548` à `:640` changent à dessein** : leurs jouets sont propres et sans index déclaré, ils rendent les mêmes sorties qu'aujourd'hui ; un jouet sale y rendrait 6 |
| `skills/chaine/sujet/scripts/sujet-carte.test.mjs` | les tests neufs du gate, après `:216` ; **`:39` à `:216` inchangés** (leur jouet n'a pas `scripts/verify/tickets.mjs` : « non joué ») |
| `skills/chaine/sujet/scripts/depot-jouet.mjs` | un faux gate posable (`scripts/verify/tickets.mjs` qui sort en 1 sur un motif écrit dans la carte) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note |

Modèles à imiter : `sujet-fusionner.test.mjs:164` (« relancer : conflit sur un index généré seul, la branche est mise à jour, index régénéré, poussée ») pour un index déclaré dans un jouet ; `sujet.test.mjs:570` (« livrer en phase 4 : la PR part d'une branche jetable ») et `:581` (« livrer en 5-livraison ») ; `sujet-carte.test.mjs:99` (« refuse un fichier que Prettier changerait »).

## À faire, dans l'ordre

1. **Partir de la branche de la PR**, 108 commité : relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces »). Les voir rouges.
3. **`livrer`** (décisions 1 et 2), puis **`carte <nom>`** (décision 3).
4. **Les textes** (décision 4). Les bancs verts.
5. Un commit ; la version de la PR, sa note complétée.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| livraison complète, index périmé sur le sujet : le commit `docs: régénère les index avant la livraison` est sur `origin/sujet/<nom>` avant la PR ; le corps de la PR le liste | `sujet.test.mjs`, test neuf |
| livraison intermédiaire, index périmé : la branche jetable porte le commit, `origin/sujet/<nom>` n'a pas bougé | test neuf |
| index à jour : aucun commit, aucun push de plus ; la PR s'ouvre comme aujourd'hui | test neuf ; `:548` à `:640` verts |
| arbre sale : sortie 6, aucune PR, aucune branche poussée ; la branche courante rendue | test neuf |
| sans `gh` (sortie 14), livraison complète : le commit de régénération est poussé avant la sortie | test neuf, sur le modèle de `:601` |
| `carte <nom>`, gate rouge sur le sommet : `REFUS`, sortie 9, rien de poussé, la dernière ligne du gate dite ; aucun worktree temporaire laissé (`git worktree list`) | `sujet-carte.test.mjs`, test neuf |
| `carte <nom>`, gate vert : poussée ; gate absent : « non joué », poussée | test neuf ; `:39` vert |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la régénération retirée de `livrer` | le test de la livraison complète |
| la branche jetable partie de `origin/sujet/<nom>` au lieu de `HEAD` | le test de la livraison intermédiaire |
| `sujet/<nom>` poussé en livraison intermédiaire | le test de la livraison intermédiaire |
| l'arbre propre non exigé | le test de l'arbre sale |
| le gate joué dans l'arbre de travail au lieu du sommet | le test du gate rouge (la carte rouge n'est que dans le commit) |
| le worktree temporaire non retiré | le test du gate rouge (`git worktree list`) |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/sujet/scripts/sujet.test.mjs skills/chaine/sujet/scripts/sujet-carte.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass`, recopié dans la PR.

## Ce qui n'a pas été établi

- La durée de la régénération sur un projet réel au moment d'une livraison (`pnpm install` puis les commandes de `index-generes.json`, sous le hook pre-commit du projet) : non mesurée. Au cas 12, le pre-commit du commit de régénération du capitaine avait joué la suite entière (2026-11-22, 13 h 03 UTC), une trouvaille restée à confirmer.
- Que `scripts/verify/tickets.mjs` ne lise rien hors des fichiers suivis par git : vu à sa source (`git ls-files`, la racine du script), non joué dans un worktree détaché d'un projet réel.

## Hors périmètre

- Les autres écritures d'un sujet (`geler`, `degeler`) : elles ne changent que la ligne `Gel:`.
- Le hook pre-commit lourd sur un commit de régénération (trouvaille du cas 12, non reproduite).
