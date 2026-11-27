# La sourdine de la veille du Relecteur tombe d'elle-même quand sa cause disparaît

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une option de `veille` qui prend une clé au lieu d'un numéro, sa levée calculée par le script, la ligne `SOURDINES` que la veille rend, le texte du skill qui suit ; la forme et les cas de levée sont les décisions `A-225` et `A-239` (2) et (3). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 94
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/scripts/relecteur.mjs` (usage, lignes 10 et 487 ; en-tête de la veille, 61-68 ; `veille`, 413-452) et `relecteur.test.mjs` (les lignes de la veille, « Où ») ; `skills/chaine/relecteur/SKILL.md` (lignes 38, 52, 53, 55, 57, 66, 92-99) ; `scripts/relecteur.test.mjs` (lignes 66, 78, 200, 201, 209) ; `skills/chaine/relecteur/references/CONTENU.md` (11, 17) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 94 et 96, dans l'ordre 94, 95, 96** (`A-232`) : ce ticket reprend la trace, le geste `noter` et la ligne de table du ticket 94, et ses numéros de ligne sont lus sur `main` **avant** 94 (94 touche l'en-tête de `relecteur.mjs`, `decision`, `jouerGeste`, la table de `SKILL.md` et `relecteur.test.mjs` : relire chaque ligne citée après lui). Le ticket 96 suit et lit la veille réécrite ici ; le ticket 97 touche ensuite `SKILL.md` (« Qui le lance », 95, 107), une PR plus tard.

## Le besoin

Constat (17) de l'essai réel du régime 8 (carte, entrée « Fin de l'essai réel du régime 8 ») : **`--taire <PR>` survit à la levée de la cause** ; la PR reste muette jusqu'à un ordre explicite (sur #7, entrée du 2026-11-23 à 10 h 52 : « le Relecteur lève sa sourdine », une fois la cause corrigée, par un geste de sa session). Le besoin : **la sourdine levée quand sa cause disparaît**, sans ordre, sans que la session du Relecteur ait à s'en souvenir.

## Le mécanisme, établi à la source

Lignes lues sur `origin/main` à `b57eae7` (plugin 8.5.0 ; `skills/chaine/relecteur/` est celui de 8.4.0, inchangé), avant le ticket 94.

- `relecteur.mjs:421` lit `--taire` comme un ensemble de **numéros** de PR ; `:445` écarte toute ligne de `passe` dont la PR est dans l'ensemble, quel que soit son geste, sa règle ou sa tête, et écarte de même `rien`, `hors-regime` et `pause`, les gestes muets. Une PR tue ne réveille donc plus la veille, même quand son geste a changé.
- La levée n'est écrite qu'en prose, à la charge de la session : `SKILL.md:99`, « Une PR tue le reste, d'une veille à la suivante, tant que la passe lui rend le même geste à la même règle ; son geste ne se joue pas au réveil. Un autre geste, ou une autre règle, la fait sortir de `--taire`. » La veille ne rend rien qui permette de le voir : `VEILLE FINIE` (`:451`) ne nomme aucune PR, et la session relance la veille avec la liste qu'elle tient en mémoire. Après une compaction, un réveil sans passe lue, ou un Relecteur relancé, la liste reste telle quelle, ou se perd.
- Les causes de sourdine : `SKILL.md:38` (`contrat-illisible`), `:52` (sortie 1), `:53` (sortie 2, deux fois), `:55` (sortie 5 de `jouer`, deux fois), `:57` (sortie 7, deux fois), `:66` (`create_session` refuse `effort` ; `create_session` en échec, deux fois). Chacune est un geste qui ne peut pas se jouer **en l'état de la PR** ; `contrat-illisible` excepté, dont la cause est la base et non la PR.
- Le journal de la veille : `SKILL.md:92`, `veille --duree 25 > <scratchpad>/relecteur-veille.log 2>&1`, récrit à chaque veille. `VEILLE ARRÊTÉE` s'écrit après la sortie d'erreur de la passe (`relecteur.mjs:442`) : la dernière ligne de cette sortie est la ligne qui précède `VEILLE ARRÊTÉE`.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-225`**, précisée par **`A-239` (2) et (3)** et **`A-240` (2)** (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **La clé** : `--taire <clé>[,<clé>…]`, `<clé>` valant `<n>:<geste>:<règle>:<tête>`, recopiée **de la ligne de `passe`** qui a rendu le geste (jamais de la ligne de `jouer`) : `pr`, `geste`, `regle` (`—` quand elle vaut `null`), `tete` (40 caractères hexadécimaux minuscules). **`contrat-illisible`** porte `*` pour la tête (`A-239` (2)) : `<n>:contrat-illisible:—:*` ; sa cause est la base, une autre tête ne la lève pas. `*` n'est admis qu'avec `contrat-illisible`. Un numéro seul, une clé mal formée, `*` avec un autre geste, ou deux clés pour la même PR : sortie 2, la cause dite, rien n'est veillé.
2. **Tant que la passe rend, pour la PR, la même clé** (même geste, même règle, même tête ou `*`) : la ligne est écartée, comme aujourd'hui.
3. **La passe rend, pour la PR, un geste à jouer sous une autre clé** (autre geste, autre règle ou autre tête) : la sourdine tombe, et la PR réveille la veille comme toute autre (`GESTE <n> …`).
4. **La passe rend `rien` ou `hors-regime` pour la PR, ou ne la nomme plus** (fermée) : la sourdine tombe, sans réveil.
5. **`pause`** (commentaires illisibles) : la sourdine reste ; ce n'est pas un état neuf de la PR. Une passe sortie en 5 (`PAUSE GitHub illisible`) ne lit rien : toutes les sourdines restent.
6. **Une sourdine levée à une passe ne revient pas** à la passe suivante de la même veille : la veille tient sa liste, qui ne fait que décroître.
7. **La veille rend les sourdines qui tiennent** : sa dernière ligne, à toute fin (après `VEILLE GESTE` et ses lignes `GESTE`, après `VEILLE FINIE`, après `VEILLE ARRÊTÉE sortie <c>`), est `SOURDINES <clé>,…` dans l'ordre reçu, ou `SOURDINES aucune`. Après `VEILLE ARRÊTÉE` ou après des passes toutes en `PAUSE`, c'est la liste telle que la dernière passe lue l'a laissée ; sans aucune passe lue, la liste reçue, inchangée.
8. **La session relance la veille avec cette liste**, plus la clé d'une PR qu'elle vient de faire taire, jamais avec sa mémoire. **Un Relecteur relancé, ou une veille tuée sans ligne `SOURDINES`** (l'outil l'a arrêtée), reprend la dernière ligne `SOURDINES` de son journal précédent, ou aucune (`A-239` (3)) ; la PR dont la cause tient se re-tait après deux échecs, comme aujourd'hui. Pour qu'un journal précédent existe quand la veille en cours a été tuée (`A-240` (2)), la session, avant chaque relance, ajoute le journal de la veille finie à un journal des veilles (`cat <scratchpad>/relecteur-veille.log >> <scratchpad>/relecteur-veilles.log`), puis lit `grep '^SOURDINES ' <scratchpad>/relecteur-veilles.log | tail -n 1` ; rien : `aucune`. Un Relecteur neuf n'a pas ce fichier : aucune sourdine. Le lanceur ne change pas (`veille --duree 25 > <scratchpad>/relecteur-veille.log 2>&1`, le banc `scripts/relecteur.test.mjs:54` le tient), `--taire` vient après lui.
9. **Pas d'échéance, pas de ligne de levée** (`A-225`) : une cause qui disparaît sans changer l'état de la PR (sorties 5 et 7 de `jouer`, `create_session` en échec) garde la sourdine jusqu'à un ordre, comme aujourd'hui ; les quatre formes des lignes à l'architecte (`SKILL.md:80`) ne changent pas. La cadence reste à 120 secondes : le ticket 98 est `wontfix` (`A-230`).
10. **Les gestes neufs** : `noter` (ticket 94) est un geste à jouer : il réveille la veille, et lève une sourdine de clé autre. `signaler` (ticket 96, après celui-ci) le sera de même, sans rien ajouter à la veille.
11. **La version** : celle du ticket 94 (une seule montée pour 94, 95 et 96) ; ce ticket ajoute à sa note la clé de `--taire`, la ligne `SOURDINES` et le journal des veilles.

## Où

Lignes lues sur `origin/main` à `b57eae7`, avant le ticket 94.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | l'usage de l'en-tête (10) et celui de la sortie 2 (487), ensemble (le banc de l'usage, `relecteur.test.mjs:1005-1013`, les compare) : `[--taire <n>:<geste>:<règle>:<tête>,…]` ; l'en-tête de la veille (61-68) : la clé, la levée, `SOURDINES` ; `veille` (413-452) : lire les clés (421) et sortir en 2 sur une clé mal formée, garder une ligne à clé égale, lever sur un autre geste à jouer, sur `rien`, `hors-regime` ou une PR absente, garder sur `pause` (445) ; écrire `SOURDINES` en dernière ligne de chaque fin (`VEILLE ARRÊTÉE`, 441-444 ; `VEILLE GESTE`, 446-449 ; `VEILLE FINIE`, 451) |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | **les lignes qui rougissent avec `SOURDINES` en dernière ligne, et leur valeur neuve** : 312, 321, 828 (`'VEILLE GESTE\nGESTE 12 distribuer règle 6\nSOURDINES aucune\n'`) ; 326, 687, 823 (`'VEILLE FINIE\nSOURDINES aucune\n'`) ; 322 (`--taire 12` devient `--taire 12:distribuer:6:<tête>`, sortie `'VEILLE FINIE\nSOURDINES 12:distribuer:6:<tête>\n'`, et `--taire 12` seul sort en 2) ; 329 (`/^PAUSE GitHub illisible : .*\nVEILLE GESTE\nGESTE 12 distribuer règle 6\nSOURDINES aucune\n$/`) ; 332 (`/VEILLE ARRÊTÉE sortie 6\nSOURDINES aucune\n$/`) ; 569, 622 (`/\nVEILLE ARRÊTÉE sortie 6\nSOURDINES aucune\n$/`) ; 690 (`.at(-1)` vaut `'SOURDINES aucune'`, `.at(-2)` `'VEILLE FINIE'`) ; 820 (`.at(-1)` vaut `'SOURDINES aucune'`, `.at(-2)` `'VEILLE ARRÊTÉE sortie 12'`). Puis les cas neufs (« À faire », étape 2) |
| `skills/chaine/relecteur/SKILL.md` | lignes 38, 52, 53, 55, 57, 66 : chaque `--taire <n>` devient « `--taire` avec la clé de la PR (`<n>:<geste>:<règle>:<tête>`, recopiée de sa ligne de `passe`) », et 38 dit `<n>:contrat-illisible:—:*` ; 92 : la relance (décision 8) ; 94-97 : chaque fin porte `SOURDINES` en dernière ligne ; **96** (puce `VEILLE ARRÊTÉE`) : « avec la dernière ligne du journal » devient « avec la ligne qui précède `VEILLE ARRÊTÉE` » ; 99 : la levée par la veille (décisions 2 à 7) et la relance avec la ligne `SOURDINES` (décision 8), à la place de « Une PR tue le reste, d'une veille à la suivante, tant que la passe lui rend le même geste à la même règle … la fait sortir de `--taire` » ; la ligne 80 (les lignes à l'architecte) ne change pas |
| `scripts/relecteur.test.mjs` | les phrases tenues suivent `SKILL.md` : 66 (`--taire <n>` de la sortie 7), 200 (sortie 5), 201 (sortie 7), 209 (`create_session`), à la clé ; **78** (« tant que la passe lui rend le même geste à la même règle », phrase de `SKILL.md:99` réécrite) devient une phrase de la levée par la veille ; un test neuf : la puce `VEILLE ARRÊTÉE` dit « la ligne qui précède `VEILLE ARRÊTÉE` », « La veille » dit `SOURDINES` et le journal des veilles. **84 ne change pas** : il tient la phrase de la relance avec `--attendre` de la même puce, que ce ticket garde ; 183 non plus (la ligne 80) |
| `skills/chaine/relecteur/references/CONTENU.md` | 11 (la phrase de la veille : la clé, la levée, `SOURDINES`) et 17 (les cas du banc) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note du ticket 94, complétée (décision 11) ; aucune montée de plus |

Modèle à imiter : la boucle de `veille` elle-même (`relecteur.mjs:426-450`) ; la lecture d'une option qui sort en 2 sur une valeur mal formée : `lireSessions` (`:249-265`).

## À faire, dans l'ordre

1. **Sur la branche du ticket 94**, son commit fait : relire chaque ligne citée ici dans `relecteur.mjs`, `relecteur.test.mjs` et `SKILL.md`, que 94 a décalées.
2. **Les bancs, rouges** (`relecteur.test.mjs`, par `d.lancer('veille', '--pause', '0', '--sondes', '<k>', '--taire', '<clé>')` sur le faux GitHub, la tête changée par un push du dépôt jouet, le geste par un verdict ajouté) : les lignes de « Où » à leur valeur neuve, puis :
   - une PR tue sous `12:distribuer:6:<T>` ne réveille pas la veille tant que la passe rend cette clé ; dernière ligne `SOURDINES 12:distribuer:6:<T>` ;
   - un push sur la PR (tête T2) : `VEILLE GESTE`, `GESTE 12 distribuer règle 6`, puis `SOURDINES aucune` ;
   - la même tête, un autre geste (une distribution et un verdict validé ajoutés au fil, `ajouter` : `etiqueter` règle 2) : réveil, sourdine levée ;
   - la même tête, le même geste, une autre règle : `--taire 12:distribuer:4:<T>` quand la passe rend `distribuer` règle 6 sur T : réveil, sourdine levée ;
   - la PR passe à `rien` (étiquette en place) ou est fermée : aucun réveil, `VEILLE FINIE` puis `SOURDINES aucune` ;
   - une passe `pause` pour la PR (un commentaire presque à la forme) : la sourdine tient ;
   - `--sondes 2`, la sourdine levée à la première passe par `rien`, la PR de nouveau sous l'ancienne clé à la seconde (l'étiquette retirée entre les deux, `d.github`) : elle réveille la veille (décision 6) ;
   - `contrat-illisible` sous `12:contrat-illisible:—:*` : un push ne la lève pas ;
   - le geste `noter` du ticket 94 sous une PR tue d'une autre clé : réveil et levée ;
   - `--taire 12`, `12:distribuer:6`, `12:distribuer:6:*`, deux clés pour la PR 12 : sortie 2, la cause dite, aucune passe ;
   - `VEILLE ARRÊTÉE` après une passe qui a levé une sourdine : `SOURDINES` sans elle ; toutes les passes en `PAUSE` : la liste reçue.
   Les voir rouges.
3. **Le code** (`relecteur.mjs`) : décisions 1 à 7, l'usage (10 et 487) et l'en-tête (61-68). Les bancs verts, et tout `relecteur.test.mjs`.
4. **Les textes** : `SKILL.md` (lignes de « Où », décisions 8 et 9), `scripts/relecteur.test.mjs` (les phrases suivent, le test neuf rouge avant le texte, vert après), `CONTENU.md`.
5. **La note de version** du ticket 94, complétée ; un commit.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| la clé tient tant que la passe la rend ; `SOURDINES` la redit | `relecteur.test.mjs`, la PR tue sous sa clé ; ligne 322 |
| une autre tête, un autre geste ou une autre règle lèvent la sourdine et réveillent | `relecteur.test.mjs`, push ; verdict tombé ; autre règle ; `noter` |
| `rien`, `hors-regime`, une PR fermée lèvent sans réveil ; `pause` garde | `relecteur.test.mjs` |
| une levée ne revient pas dans la même veille | `relecteur.test.mjs`, `--sondes 2` |
| `contrat-illisible` à `*` : une autre tête ne lève pas | `relecteur.test.mjs` |
| une clé mal formée sort en 2, sans passe | `relecteur.test.mjs` |
| `SOURDINES` en dernière ligne de chaque fin, la liste juste après `VEILLE ARRÊTÉE` et après des `PAUSE` | `relecteur.test.mjs`, lignes de « Où » et les deux cas neufs |
| l'usage et l'en-tête disent la clé, ensemble | `relecteur.test.mjs:1005-1013` |
| le skill dit la clé à chaque `--taire`, la relance par `SOURDINES` et le journal des veilles, « la ligne qui précède `VEILLE ARRÊTÉE` » | `scripts/relecteur.test.mjs`, lignes 66, 78, 200, 201, 209 et le test neuf |

## Mutations

Chacune seule, le fichier remis après, sur `relecteur.test.mjs` et `scripts/relecteur.test.mjs` : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la clé réduite au numéro (un numéro seul admis) | la clé mal formée ; le push |
| la tête ôtée de la comparaison | le push |
| la règle ôtée de la comparaison | la même tête, le même geste, une autre règle |
| `*` admis pour un autre geste que `contrat-illisible` | la clé mal formée |
| `*` ignoré (la tête de `contrat-illisible` comparée) | `contrat-illisible`, le push |
| une sourdine levée sur `pause` | la passe `pause` |
| une sourdine gardée sur `rien` | `rien` ou fermée |
| une levée qui revient à la passe suivante | `--sondes 2` |
| la ligne `SOURDINES` absente de `VEILLE FINIE` | lignes 326, 687, 823 |
| la ligne `SOURDINES` absente de `VEILLE ARRÊTÉE` | lignes 332, 569, 622, 820 |
| `SOURDINES` qui rend la liste reçue après une levée suivie d'un arrêt | `VEILLE ARRÊTÉE` après levée |
| `SKILL.md:96` qui redit « la dernière ligne du journal » | `scripts/relecteur.test.mjs`, le test neuf |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/relecteur/scripts/relecteur.test.mjs scripts/relecteur.test.mjs`, rouges à l'étape 2 et 4, verts après ; puis ceux du ticket 94 (`decision-relecteur.test.mjs`, `verdict-du-capitaine.test.mjs`), toujours verts.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte d'après 94, plus les tests neufs).

## Hors périmètre

- Une échéance de la sourdine et une ligne de levée à l'architecte : écartées (`A-225`).
- La cadence de la passe (constat 11) : `wontfix` (`A-230`, ticket 98).
- Les autres constats de la famille relecture : (1) la demande modifiée écartée en silence (ticket 96), (2) `interrupt_session` et la veille (ticket 97), (15) la session de relecture réemployée (`wontfix`, `A-231`).
- La note de même contenu : ticket 94.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur le constat (17) de l'essai réel du régime 8, le code lu sur `origin/main` (plugin 8.4.0). Aucun banc joué : le ticket décrit ce qui est à écrire.
- 2026-11-27 — Passé `ready-for-agent` après relecture : `A-225` décidée (ni échéance ni ligne de levée), `A-239` (2) (`*` pour `contrat-illisible`) et (3) (la reprise par la dernière ligne `SOURDINES`, d'où le journal des veilles, défaut fixé par ce ticket) ; les treize lignes de `relecteur.test.mjs` qui rougissent nommées avec leur valeur ; `SKILL.md:96` et le banc `scripts/relecteur.test.mjs:78`, que la première version oubliait ; l'usage de la ligne 487 ; une levée qui ne revient pas, `SOURDINES` après un arrêt ; le ticket 98 `wontfix` (`A-230`) ; lignes relues sur `b57eae7` (8.5.0).
