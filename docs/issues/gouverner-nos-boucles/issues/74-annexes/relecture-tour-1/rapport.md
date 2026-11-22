# Ticket 74, la veille du capitaine : relecture, tour 1

Relecteur neuf, 2026-11-21, lecture seule : rien poussé, aucun ticket modifié. Relu : la branche de documentation du programme à `ec1195d`, le ticket 74 et ses annexes (`ticket-74.patch`, sha256 `6b3b5368…` vérifié ; `mutations.mjs`), `A-180` point 1, `A-185` points 7 et 9, `A-187`. Joué sur des clones neufs de `https://github.com/MAJ-agency/skills` à `25a72c7` (plugin 7.38.0), Node 22.23.5, git 2.43.0, bash 5.2.21, quatre cœurs, sur une machine partagée avec d'autres agents.

## Conclusion : prêt après retouches

Les trois défauts du besoin sont fermés sur le chemin ordinaire, et rien d'autre n'est glissé : huit fichiers, aucun de ceux des tickets 67 à 73 hors des deux fichiers de version. Le choix de garder deux heures avec un `timeout` explicite tient. Un trou reste dans le cas même que le ticket vise : **la garde se bloque elle-même**. Le point 3 pose le fichier d'arrêt. La veille relancée ne le retire qu'à sa première boucle, donc après sa préparation. Si cette veille est tuée pendant la préparation, ou si la préparation échoue en 13, l'arrêt de la garde reste. `--etat` le lit alors comme un arrêt demandé, et chaque réveil de garde suivant ne fait plus rien (essai E9). Or une machine recyclée est justement le cas où la préparation se rejoue. La retouche (`retouches-tour-1.patch`) est essayée, avec ses bancs et ses mutations.

## Constats

| # | Gravité | Constat | Preuve | Retouche |
| --- | --- | --- | --- | --- |
| 1 | **bloquant** | Après le point 3 (`--arreter`, puis la veille relancée avec `--reprendre`), une veille tuée pendant sa préparation, ou dont la préparation sort en 13, laisse le fichier d'arrêt de la garde. `--etat` rend alors `VEILLE TERMINÉE : arrêt demandé` : la garde ne fait plus rien, une heure après l'autre. La suite du 13 (« relancer la veille ») repart sans `--reprendre` et sort en 10. | `essais/e9-reprise-tuee.sh` (sorties dans `essais/sorties.txt`, cas 3 à 5) | R1 : `--reprendre` retire le fichier dès le verrou de la veille pris, si celui de la boucle est libre (sinon sortie 9, fichier gardé), avant la préparation. La première boucle reçoit toujours `--reprendre`. Deux tests neufs. |
| 2 | **à corriger** | La promesse « aucun fils ne garde le verrou » (décision 4, Surfaces) ne tient pas pour deux sous-shells. Celui de `$(etat_file)` le garde pendant toute la sonde `file.sh`. Celui de `( cd … && sh -c "$commande" )` le garde pendant toute la préparation. Si la veille est tuée à ce moment-là, `--etat` rend `VEILLE VIVANTE`. Une session réveillée par la quatrième puce ne fait alors rien, jusqu'à la garde suivante (60 min). Le `sleep` entre deux essais de `git fetch` garde aussi le verrou, 5 à 10 s. | E3/E4 : `VEILLE VIVANTE` après `kill -9` pendant une sonde de 6 s ou une préparation de 6 s ; `VEILLE MORTE` après la retouche | R3 : `vu=$(exec 7>&-; etat_file …)`, `actuel=$(exec 7>&-; etat_file)`, `(exec 7>&- 8>&-; cd … && sh -c …)`, `sleep $((essai * 5)) 7>&-`. Un test neuf. |
| 3 | **à corriger** | Le texte contredit la décision 9. Le paragraphe « **Reprendre** » (§ « Boucle ») dit toujours `boucle.sh --reprendre`, puis relancer la veille. La sortie 10 dit « `--reprendre` quand on veut repartir » sans dire de quel script. Une session Sonnet lancerait la boucle au premier plan, alors que l'outil coupe une commande au premier plan à 2 min par défaut (10 min au plus), donc au milieu d'un passage. | lecture ; `SKILL.md` ligne 70 et puce `VEILLE ARRÊTÉE` | Texte dans le patch de retouche, tenu par le banc des textes. |
| 4 | **à corriger** | Le point 2 ne donne aucune suite à une autre sortie de `--etat`. Un projet qui a le plugin 7.38.1 mais pas les scripts reposés a une copie sans `--etat`, et la copie se fait toujours depuis les scripts du projet : `--etat` y sort en 64 avec la ligne `VEILLE ARRÊTÉE … CAPITAINE_ID requis`. `veille.sh --reprendre` y sort aussitôt en 64 sur l'usage : une fin sans ligne finale, qui ramène à la garde, en boucle de tours. | E12 | Texte : une autre sortie (64) donne « pas de garde », le dire une fois au lanceur (scripts à reposer par `poser`), ne plus réarmer, et une veille morte se relance sans `--reprendre`. |
| 5 | **à corriger** | Le point 3 relance la veille « comme ci-dessus », c'est-à-dire avec `cp scripts/chaine/*.sh` depuis le worktree. Or ce worktree peut être resté sur la branche d'une PR (la raison que le point 3 donne lui-même), quand la boucle est morte sans sa trappe. Le capitaine jouerait alors le `veille.sh` et le `file.sh` de la PR pendant deux heures. | lecture ; `boucle.sh` ne recopie que ses propres outils depuis develop | Texte : relancer par la seconde ligne du bloc, sans recopier. La copie du point 1 se fait depuis un worktree neuf détaché sur `origin/develop`. |
| 6 | mineur | Un `--etat` lancé pendant qu'une veille démarre tient le verrou un instant. La veille, seule pourtant, sort en 9 (« une veille tourne déjà ») : 3 à 5 fois sur 40. Le cas réel : la session lance la veille et lit `--etat` dans le même tour d'outils. | E7 | R4 : la veille attend 3 s (`flock -w 3 7`). R2 : `--etat` tient le verrou pendant sa lecture. Un test neuf. Une seconde veille vraie sort donc en 9 après 3 s, et non « aussitôt » (texte de la décision 4 à ajuster). |
| 7 | mineur | `--etat` lit l'état avant de prendre le verrou. Une veille qui finit entre les deux se lit `VEILLE MORTE` : 1 ou 2 lectures sur environ 1 600. Les conséquences sont bénignes, avec un `--arreter` et un `--reprendre` de trop. | E8 | R2 : l'état se lit sous le verrou. |
| 8 | mineur | La commande du skill ouvre le journal avec `>`. Une seconde veille (sortie 9) tronque le journal de celle qui tourne, et les écritures suivantes de la première se mêlent à la ligne de refus. La dernière ligne du journal devient illisible quand la première finit : quatrième puce, et la garde converge par `--etat`. | E13 | Recommandation : `>>` dans les deux commandes du skill. Je n'ai pas fait la retouche : elle touche la ligne de `CAPITAINE_ID`. |
| 9 | mineur | Le point 2 dit « `VEILLE ARRÊTÉE` ou `arrêt demandé` : rien de plus que sa suite ci-dessus ». Lu à chaque garde, cela peut se jouer comme « redire au lanceur » toutes les heures (sortie 12, 13). | lecture | Texte : « et seulement si elle n'a pas déjà été donnée ». |
| 10 | mineur | Le banc des textes n'exige pas le nom « Garde de la veille du capitaine », que `A-187` point 3 fait retrouver par `list_triggers` (X5 reste verte). « `fin <epoch>` » sans ligne finale se lit sans trace, et aucun banc ne tient ce cas (X2 verte, état impossible à écrire par `finir`). Le `7>&-` du `fetch` est sans banc (X6 verte, déjà dit par le ticket). | `mutations-relecture.txt` | Dans la retouche : le nom est exigé par le troisième test (X5b rouge). Le reste peut rester tel quel. |
| 11 | mineur | Tableau « Mutations » du ticket : la colonne « Bancs » dit « ? » pour M12, M14, T1, T5 et T8, alors que `mutations.mjs` leur donne `veille.test.mjs` (M) ou le banc des textes (T). La « Vérification » dit « de 0 à 383 secondes chacune », mais le tableau et `mutations.txt` donnent 517 s pour M19. | lecture | Remplir la colonne et corriger le chiffre. |
| 12 | mineur | Point 1 : quand la copie manque mais que le worktree existe, « Mise en place » échoue sur `git worktree add` (le dossier existe). Et une session compactée qui ne se souvient plus d'avoir armé la garde la réarme « au premier lancement » : deux gardes. | lecture | « refaire la partie manquante seulement » ; le second point va à 6b (trigger_id, question 3). |

## Le besoin

1. **La veille morte avec son conteneur** : fermé par la garde (`send_later`, qui survit au redémarrage) et `--etat`, sauf le constat 1.
2. **Le plafond de 30 minutes** : fermé. La description de l'outil Bash de ma session dit : « `timeout` is how long the command may run in the background (default 1800000, max 7200000); at that limit it is stopped and you are re-invoked ». Le plafond est donc de 30 min par défaut et de 2 h au plus, et la session est réveillée à l'arrêt : c'est la quatrième puce. Pour une commande au premier plan : « default 120000, max 600000 » (constat 3).
3. **Une fin sans ligne finale** : fermé par la quatrième puce, qui renvoie aux points 1 à 3 sans le 4 : la garde ne s'empile pas (`A-187` point 1 ; la mutation X4, « points 1 à 4 », est rouge).

**Deux heures plutôt qu'une veille courte : le choix tient.** L'échéance est à 80 min, et un passage commencé à 79 min a 40 min de marge, donc il finit avant 120 min, sous le `timeout`. Une veille de 25 min laisserait 15 min de marge et ne couvrirait ni un passage avec ses E2E ni une CI lente. Le risque qui reste, une session qui oublie le `timeout`, retombe dans la quatrième puce.

Rien d'autre n'est glissé : `git diff --numstat` donne huit fichiers, 396 lignes ajoutées et 33 retirées, comme le dit le ticket. Les patchs 67-69, 70 et 71-73 ne touchent aucun de ces fichiers hors `plugin.json` et `NOTES-DE-VERSION.md`.

## La liste des états, prouvée entière

`--etat` ne lit que trois choses :
- le verrou (libre ou tenu) ;
- la présence de `boucle-arret` ;
- la première ligne de `veille.etat`, coupée en `mot quand ligne`.

Le résultat suit un ordre strict, et je l'ai vérifié par E11 : 11 contenus, avec et sans arrêt, verrou libre ou tenu, soit 44 cas.

| Condition, dans l'ordre | Ligne | Sortie |
| --- | --- | --- |
| un argument de plus, ou hors d'un dépôt git | usage | 64 |
| `flock` absent | message | 6 |
| verrou tenu | `VEILLE VIVANTE`, suivi de « (lancée à hh:mm) » si `mot` = `lancee` et `quand` numérique | 0 |
| `boucle-arret` présent | `VEILLE TERMINÉE : arrêt demandé (…)` | 2 |
| `mot` = `fin`, `quand` numérique, `ligne` non vide | `VEILLE TERMINÉE : <ligne>` | 2 |
| tout le reste (absent, vide, `lancee` seul, `lancee x`, `fin` seul, `fin x …`, autre mot, binaire, plusieurs lignes : seule la première compte) | `VEILLE MORTE (lancée à hh:mm, sans ligne finale)` si `lancee <n>`, sinon `VEILLE MORTE (aucune trace de veille)` | 1 |

L'état écrit à moitié se lit `MORTE` ou `VIVANTE`, jamais une fin inventée, sauf une ligne `fin <n> <début de ligne>` tronquée, que je n'ai pas provoquée. Un dépôt neuf (recyclage, E10) rend `VEILLE MORTE (aucune trace de veille)` et n'écrit que `veille.verrou`.

## Les essais (le code)

Les scripts sont sous `essais/`, et leurs sorties, chemins privés retirés, dans `essais/sorties.txt`. Chaque essai pose un jouet (doublures de `boucle.sh` et de `file.sh`, dépôt nu, clone) et ne tue que les processus qu'il a lancés, par leur pid noté.

| Essai | Patch | Retouche |
| --- | --- | --- |
| E1 : deux veilles lancées au même instant, 20 fois | 20 fois une seule tourne, l'autre sort en 9, une seule boucle | pareil |
| `kill -9` pendant le sommeil, pendant la boucle, pendant que `tee` attend | `MORTE` (bancs du patch ; pendant la boucle, essai joué à la main sur le jouet) | pareil |
| E3 : `kill -9` pendant une sonde lente | **`VIVANTE`** tant que `file.sh` tourne | `MORTE` |
| E4 : `kill -9` pendant la préparation | **`VIVANTE`** tant que la commande tourne | `MORTE` |
| E7 : `--etat` pendant le démarrage | 3 à 5 refus en 9 sur 40 | 0 sur 40 |
| E8 : `--etat` pendant la fin | 1 ou 2 `MORTE` fausses | aucune |
| E9 : garde, `--reprendre` tuée pendant la préparation, puis préparation en 13 | **`arrêt demandé`**, pour toujours | `MORTE`, puis la fin écrite, puis `VEILLE FINIE` |
| E10 : dépôt neuf | `MORTE (aucune trace)`, sortie 1 | pareil |
| E11 : 44 états | le tableau ci-dessus | pareil |
| E12 : copie d'avant le ticket | `--etat` : `VEILLE ARRÊTÉE … CAPITAINE_ID requis`, 64 ; `--reprendre` : usage, 64 | (texte, constat 4) |
| E13 : seconde veille sur le même journal | journal tronqué, dernière ligne illisible | (constat 8) |

## Le texte, joué par un capitaine Sonnet

Chaque fin a sa suite :
- les quatre puces ;
- la sortie 9 renvoie à `--etat` (la retouche ajoute « la suite de son point 2 ») ;
- `VIVANTE`, `TERMINÉE` et `MORTE` ont chacune leur geste.

Les trous sont les constats 3, 4, 5 et 9. La garde ne s'empile pas, puisqu'elle ne se réarme qu'au point 4, et que ni la quatrième puce ni le `VEILLE FINIE` ne réarment.

Le banc des textes fige les phrases à leur place :
- le `timeout` dans le paragraphe qui lance la veille, avant sa commande ;
- les quatre puces dans l'ordre ;
- la garde entre la liste des fins et le `Monitor`, avant « Sans veille en cours » ;
- les quatre points dans l'ordre ;
- les états de `--etat` avec leur sortie.

Les mutations T de l'annexe que j'ai jouées (T3, T8, T9), et X4, sont rouges. Le banc ne tient pas le nom de la garde (X5).

## Ce que le ticket suppose de `main`

- `git apply` sur `25a72c7` : il s'applique, huit fichiers.
- Après `ticket-67-68-69.patch`, puis `ticket-70.patch` et `lot-5.patch` de la branche (tous deux appliqués avec `--exclude` sur les deux fichiers de version) : `--check` passe avec les deux `--exclude`. Le patch entier, lui, refuse `plugin.json` et `NOTES-DE-VERSION.md`, comme le prévoit le § 0.
- La retouche s'applique sur les deux bases.

## Les comptes

| Ce qui est joué | Où | Résultat |
| --- | --- | --- |
| Les trois bancs, avant le code (les bancs seuls posés) | `25a72c7` | **13 rouges sur 58**, les treize que nomme le § 1 (8 min 55 s) |
| Les trois bancs, après | `25a72c7` + patch | **58 sur 58** |
| Les trois bancs, après | chaîne 67-69, 70, 71-73, puis 74 | **58 sur 58** |
| Les trois bancs avec la retouche | `25a72c7` + patch + retouche | **62 sur 62** (4 tests neufs) |
| Les trois bancs, la vérification 3 et le banc des textes, avec la retouche | chaîne + 74 + retouche | **247 sur 247** (62 des trois bancs, banc des textes compris, et 185 de la vérification 3) |
| Vérification 3 (`depot`, `relecteur`, `fusionner.test`) | `25a72c7` + patch ; chaîne + 74 ; retouche (avec le banc des textes) | **184 sur 184** ; **185 sur 185** ; **188 sur 188** |
| Mutations de l'annexe (M1, M2, M5, M7, M12, M14, M16, T3, T8, T9) | `25a72c7` + patch | **10 rouges sur 10** |
| Mutations à moi (X1 à X6) | `25a72c7` + patch | 3 rouges (X1, X3, X4), 3 vertes (X2, X5, X6 : constat 10) |
| Retouches défaites (R1 à R4) et cibles neuves (M5b, T9b, X5b) | patch + retouche | **7 rouges sur 7** |
| La suite entière, `pnpm test` d'un seul tenant (ses quatre motifs) | `25a72c7` + patch | **1 291 tests, 1 291 verts**, aucun échec, sauté ni annulé ; 17 min 37 s (00:00:16 → 00:17:53 UTC le 2026-11-22, `duration_ms` 1057094) ; charge 1,91 au départ, 1,49 à la fin |

## La retouche, `retouches-tour-1.patch`

Elle s'applique sur `25a72c7` avec `ticket-74.patch`, et sur la chaîne avec 74. Cinq fichiers, 142 lignes ajoutées, 20 retirées. Empreinte : `sha256sum retouches-tour-1.patch` donne `c817d8dd254d0d6aa8805ebb68351571f443241088ac5ce72da23db38de7c1b0`.

- **`veille.sh`** :
  - R1 : le bloc `--reprendre` après `finir` ;
  - R2 : `lire_etat` sous le verrou dans `--etat` ;
  - R3 : `exec 7>&-` dans les sous-shells de la sonde et de la préparation, et `7>&-` sur le `sleep` du fetch ;
  - R4 : `flock -w 3 7` ;
  - l'en-tête de `--reprendre`.
- **`veille.test.mjs`** : quatre tests neufs (constats 1, 2 et 6).
- **`SKILL.md`** : le paragraphe « Reprendre », la sortie 9, la sortie 10, le point 2 (avec la sortie 64 et « si elle n'a pas déjà été donnée ») et le point 3 (sans recopier, `--reprendre` avant la préparation).
- **`CONTENU.md`** : une phrase.
- **`veille-du-capitaine.test.mjs`** : les assertions suivent, dont le nom de la garde.

Si la retouche entre, deux mutations de l'annexe changent de cible :
- M5 : `remplacer('(exec 7>&- 8>&-; cd', '(exec 8>&-; cd')` (M5b, rouge) ;
- T9 : le texte neuf du point 3, `puis relancer la veille par la seconde ligne du bloc ci-dessus, sans recopier (le worktree peut être resté sur une PR), en tâche de fond avec le même \`timeout\`, et avec \`--reprendre\` : elle retire ce fichier dès son verrou pris, avant sa préparation.` remplacé par `puis relancer la veille comme ci-dessus.` (T9b, rouge)

Deux textes du ticket changent aussi : la décision 4 (« aussitôt » devient « après 3 s ») et la décision 9 (le fichier se retire avant la préparation). Le compte attendu de la suite devient 1 295.

## Questions à l'architecte

1. **R1 : le fichier d'arrêt retiré par la veille, avant sa préparation.** L'autre voie : la boucle seule le retire, et le texte dit de repasser `--reprendre` après un 13 et de reconnaître son propre arrêt. Cela fait deux règles de plus pour une session Sonnet, et le cas « tuée pendant la préparation » reste ouvert. **Recommandation : R1.**
2. **Une boucle orpheline tuée en plein passage par le point 3.** `--arreter` l'interrompt, alors qu'elle aurait pu finir. C'est conforme à `A-187`, et la trappe remet le worktree propre. Attendre son verrou ajouterait un état. **Recommandation : garder.**
3. **Le journal en `>>`** (constat 8). **Recommandation : oui**, dans les deux commandes du skill, au même ticket si le banc des textes suit, sinon au lot 6b.

## Ce qui n'a pas été établi

- Ce que l'outil Bash tue au plafond (le `bash` seul ou son groupe) : les essais tuent le seul `bash` de la veille, le cas le plus dur pour le verrou.
- Un vrai recyclage de machine : simulé par un dépôt neuf (E10) et un `boot_id` changé (E9).
- La suite entière avec la retouche : non jouée ; seuls les trois bancs et la vérification 3 l'ont été.
