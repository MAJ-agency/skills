# Contre-relecture de la PR 146 — skill `relecteur` (ticket 66)

## Premier tour

Sommet vérifié : `git ls-remote origin refs/pull/146/head` → `d1679f35c22743cac7c0faff61d2b1edf58945a9`. main à `5bf4f39`. Clone neuf en 5 s (charge 0,15).

### 1. La PR contre le patch du ticket

`git apply --index ticket-66.patch` sur `5bf4f39`, puis `git write-tree` : `f314f83e…`, identique à `git rev-parse pr146^{tree}`. Aucun écart. Le premier commit `a67c1e3` ne porte que les six bancs (692 lignes) : rouges avant le code.


Revérifié par le second contre-relecteur (même tour), en une commande : `git apply --index ticket-66.patch` sur un arbre neuf de `5bf4f39`, `git write-tree` → `f314f83e880e…`, égal à `d1679f3^{tree}`. Sommet de la PR relu : `d1679f35c22743cac7c0faff61d2b1edf58945a9`. Dans la suite, `APRES` est cet arbre (main à `5bf4f39` et le patch du ticket), et « l'arbre retouché » est `APRES` plus [`retouches-tour-1.patch`](retouches-tour-1.patch) (arbre `bad0cc45…`).

### 2. Les essais X1 à X17 du relecteur du ticket, rejoués

Rejoués sur `APRES` par [`essais/rejeu-x.test.mjs`](essais/rejeu-x.test.mjs) : le montage d'origine, l'appel de `distribuer` mis à la forme nouvelle (`--sommet`, `--couple`), et l'assertion de ce qu'`A-180` voulait. Les numéros X2, X4, X6, X9, X10 et X11 n'ont pas d'essai dans l'annexe du relecteur (onze essais, numérotés X1 à X17 avec des trous). **11 sur 11 verts sur `APRES`**, et sur l'arbre retouché.

| Essai | Constat d'origine | Sur `d1679f3` | Fermé par |
| --- | --- | --- | --- |
| X1 | un push entre `passe` et `distribuer` : distribution écrite au sommet neuf, couple non recomparé | sortie 3 sur le sommet, puis sortie 3 sur le couple (`opus/xhigh` attendu), rien d'écrit | `A-180.2` |
| X3 | `depuis` à millisecondes refusé | admis ; `+00:00` refusé, limite écrite | `A-180.4` |
| X5 | `--sessions` à mot faux : sortie 1 et pile | sortie 2, la cause dite, aucune pile | `A-180.4` |
| X7 | PR fermée : `jouer` rend `distribuer`, `distribuer` écrit | sortie 3 pour les deux, rien d'écrit | `A-180.4` |
| X8 | deux pages concaténées (tenait) | tient ; le banc N12 le garde | `A-180.6` |
| X12 | `à-fusionner` à la main sans tour : `à-reprendre` posée avant le retrait | tient, conforme à `A-84` (règle 3 du lot 3a) | — (pas un défaut) |
| X13 | plafond, le troisième refus sur un autre sommet | `plafonner` | `A-179.2` |
| X14 | lockfile et `package.json` de la PR changés : une installation, celle de develop | tient | `A-179.3` |
| X15 | forme refusée par `a-juger` dite « double relecture illisible », à l'architecte | « forme refusée par `sujet.sh a-juger` : … », à l'auteur | `A-180.5` |
| X16 | 1 préparation sur 18 en sortie 12 | 30 sur 30 en 0 | `A-180.5` (`flock`) |
| X17 | hook `post-checkout` : passes 2 et 3 en 6 | 0, 0, 0, fichier suivi intact | `A-180.5` |

Les dix-neuf mineurs du relecteur hors essai sont tenus aussi (TaskStop chargé, `get_session` dans les règles 4, 5 et 6, sorties 1, 2, 7 et 12 suivies, `--remplace`, « quatre » fichiers du socle dans le ticket, VEILLE FINIE à 500 000 tokens), sauf ce que les constats 4 et 11 ci-dessous reprennent : le champ de `get_session` à lire n'est pas nommé, et `references/CONTENU.md` dit encore « pour la seule règle 5 ».

### 3. `A-180`, point par point, sur le code de la PR

1. **La veille** : `--duree 25`, défaut du script et du skill ; tenu, mais pas borné : constat 1.
2. **Le couple** : `distribuer` reçoit `--sommet` et `--couple` et sort en 3 s'ils ont changé (banc X1) ; tenu. Le réemploi « à couple égal » ne se joue pas tel qu'écrit : constat 4.
3. **Les suites** : une ligne de table pour 0, 1, 2, 3, 5, 6, 7, 9 et 12 ; `--taire` au second refus ; `passe` d'abord à chaque réveil ; `get_session` dans les règles 4, 5 et 6 ; 700 000 et 500 000 tokens ; `TaskStop` dans la requête de mise en place : tenus. Manquent la commande coupée par l'outil, une sortie hors table et une erreur de `passe`, qui ne nomme aucune PR : constat 3.
4. **Les entrées** : `MODELES` vaut `opus`, `sonnet` ; `depuis` à `Z`, avec ou sans millisecondes ; `--sessions` mal formé en 2 ; `--remplace` ; une PR fermée en 3 : tenus (X3, X5, X7).
5. **Le dossier et git** : `flock -w 300` (X16) ; `core.hooksPath` vide et `core.fsmonitor=false` ajoutés aux `GIT_CONFIG_*` de la session, prouvé entier par C4 : les vingt-huit noms de hook de git, dans `.git/hooks` comme sous un `core.hooksPath` local, et un fsmonitor, d'une passe à une distribution, avec une installation, `a-juger` et « même contenu propre », sans qu'aucun ne joue. L'installation en échec écrit sa sortie d'erreur et ne se retente qu'au lockfile suivant ; la cause « dépendances de develop » ; les causes d'illisible nommées une à une : tenus. Mais la sortie d'erreur se perd quand c'est une passe de la veille qui installe : constat 5.
6. **Les bancs de N1 à N4, N7, N9, N10, N12, N13** : présents ; N9 reste équivalente, comme le ticket le dit. Mais quatorze autres garanties de ce même point ne sont tenues par aucun banc : constat 7.

`A-181`, alerte 25 : `relecteur.mjs:103` est `spawnSync(commande, args, { … })` sur un tableau d'arguments, sans l'option `shell` (aucune occurrence de `shell` dans le fichier) ; les deux `bash -c` du script ont un texte constant, et la route, la fonction et ses arguments y passent en paramètres positionnels (`"$1"`, `"$2"`, `"$@"`), jamais dans le texte. Fausse alerte, acceptée.

### 4. Les attaques sur `relecteur.mjs`

[`essais/essais-c1.test.mjs`](essais/essais-c1.test.mjs), lancé par `node --test` avec `APRES` pointé sur l'arbre voulu (19 essais, 50 s, charge 0,0 → 0,2). Sur `APRES` : **14 verts, 5 rouges** (C1, C5, C8, C11, C12). Sur l'arbre retouché : **17 verts, 2 rouges** (C11 et C12, les deux mineurs laissés à un ticket de suite). Ce que chaque essai prouve :

- **C1, la veille.** `veille --pause 6 --duree 0.02` (1,2 s) dure 6,4 s : la boucle ne compare l'heure qu'avant la pause, donc la dernière pause commence à 24 min 59 s, et la dernière passe, qui attend jusqu'à 300 s le verrou et peut installer les dépendances, commence à 26 min 59 s. Une veille tuée par l'outil (signal au groupe de processus, en pleine pause) n'écrit aucune des trois lignes finales, et le skill n'en dit rien.
- **C2, le verrou et le délai de l'outil.** Un geste attend le verrou autant qu'une passe le tient (jusqu'à 300 s) ; l'outil Bash coupe une commande au premier plan à 120 s par défaut. Une commande coupée n'a pas de code de sortie. Sonde à part : un `git` tué en plein `switch` laisse `.git/index.lock`, et chaque passe sort alors en 12 (« remove the file manually ») ; la suite de 12 arrête le Relecteur à la seconde fois.
- **C3, les `GIT_CONFIG_*` de la session** : une réécriture d'URL (`GIT_CONFIG_COUNT=1`) tient ; tenu, mais aucun banc ne le garde (K1).
- **C4, les hooks** : la liste entière, ci-dessus ; tenu, mais le banc ne garde ni le fsmonitor (K2) ni l'emplacement par défaut des hooks (K3).
- **C5, l'installation en échec** : dans la veille, la passe sort en 0 et la veille jette sa sortie d'erreur : l'erreur de `pnpm install` n'est nulle part. Tenus : `--frozen-lockfile --prefer-offline` ; une sous-PR ordinaire vers un sujet se distribue malgré l'échec ; la cause reste la même au passage suivant.
- **C6, la fourche supprimée** (`head.repo` nul) : « PR de fourche » ; tenu, sans banc (K15).
- **C7, un verdict édité** : un `validé` modifié ne vaut rien, la session attendue est remplacée pour silence après le délai ; tenu.
- **C8, le plafond** : trois tours refusés sur trois sommets puis un push : le plafond, pas un quatrième tour ; tenu (`A-89`, `A-179.2`). Mais sur une PR où `à-reprendre` est restée posée (une étiquette que l'auteur n'a pas retirée en redemandant), `jouer` écrit `Plafond — décision attendue` et rend `lignes: []` : ni l'auteur, ni le conducteur, ni l'architecte, qui décide au plafond, n'en sont prévenus, et la PR attend sans fin.
- **C9, la reprise après arbitrage**, la préférée morte : une session neuve, le tour 2 `(après arbitrage, non compté)` ; tenu.
- **C10, les causes d'« illisible »** : `a-juger` en échec (sortie 11), le diff vers develop en échec (une tête sans base commune), une forme refusée sur une PR sans session d'auteur (à l'architecte), une trace redite après `relecture.delai` et pas avant : tenus, sans banc (K4, K5, K8, K9). Les autres causes (tête introuvable, fourche, dépendances, forme refusée, « double relecture » et « même contenu » illisibles) ont leur banc.
- **C11 et C12, deux mineurs pour un ticket de suite** : un refus (règle 4) sur une `à-reprendre` restée ne prévient pas l'auteur, pour la même raison que C8 ; un plafond à moitié écrit (commentaire posé, pose de l'étiquette refusée, sortie 7) ne prévient pas l'architecte au rejeu, la règle 1 ne sonnant alors que l'auteur et le conducteur.

**La liste de ce qui s'exécute, entière** (plutôt que celle des dangers) : `git`, sous les `GIT_CONFIG_*` de la session plus `core.hooksPath` vide et `core.fsmonitor=false`, sur des objets (aucune extraction de la tête d'une PR : `cat-file`, `merge-base`, `diff --name-only`, `merge-tree`, et un seul `switch`, vers `origin/develop`) ; les scripts de `scripts/chaine/` de develop (`github.sh`, `sujet.sh`, `meme-contenu.sh`, `decision-relecteur.mjs`, `verdict.mjs`, `double-relecture.mjs`, `chemins-sensibles.mjs`) ; `pnpm install --frozen-lockfile --prefer-offline` sur le lockfile et les scripts de cycle de vie de develop, et `pnpm exec commitlint` de develop, qui lit en entrée le message d'une retouche ; `gh` et `jq`. D'une PR, seuls entrent des données : sa liste de fichiers, ses messages de commit, son titre (en argument, jamais en code), ses commentaires. Une configuration git qui exécute (filtre, `textconv`, `sshCommand`) ne peut venir que de la session ou de develop. Aucune ligne de la PR ne s'exécute : tenu, comme `A-180` l'écrit.

### 5. Les textes joués par une session Sonnet

`SKILL.md`, `references/prompt-session.md`, `references/CONTENU.md` et le gabarit de `lancement.md`, lus geste par geste. Ce qui tient : chaque outil est chargé avant usage (`ToolSearch` de la mise en place, quatre outils) ; chaque seuil est un nombre (2 et 25 minutes, 300 s, 700 000 et 500 000 tokens, « une fois », « au second refus ») ; les messages aux sessions de relecture et au conducteur ont leur forme (prompt, relance, « session de relecture <id> remplacée au plafond de contexte, PR <n> ») ; les lignes de `jouer` partent telles quelles. Ce qui reste à improviser, repris par les constats 2, 3, 4, 8 à 11 : la commande coupée par l'outil et toute sortie hors table ; la veille arrêtée sans ligne finale ; le champ de `get_session` à lire et la comparaison d'un alias (`opus`) à l'identifiant que rend `get_session` (`claude-opus-…`), d'un effort au champ `session_context.effort_level` ; la forme des lignes à l'architecte ; « un outil absent : l'écrire à l'architecte », impossible quand c'est `send_message` qui manque ; la sortie d'une PR de `--taire` ; `create_session` en échec pour une autre cause que `effort` ; la sortie 3 d'une distribution écrite dont la réponse s'est perdue. Les champs nommés par le patch sont ceux qu'un `get_session` rend dans une session cloud de ce jour : `session_context.model`, `session_context.effort_level`, `status_bucket`, `external_metadata.context_usage.used_tokens` (et `max_tokens`).

### 6. Mutations

- **Annexe** : 20 mutations de `66-annexes/mutations.mjs` tirées au hasard (graine 20261121 ; liste et journal : [`mutations/annexe-20-d1679f3.txt`](mutations/annexe-20-d1679f3.txt)), jouées sur `d1679f3` : **20 sur 20 rouges** (6 min, charge 0,03 → 5,24 → 2,00). Sur l'arbre retouché, les textes visés par les 73 mutations de l'annexe sont tous là, une fois chacun (aucune « INTROUVABLE »).
- **Les miennes** : quinze, K1 à K15 ([`mutations/mutations-c1.mjs`](mutations/mutations-c1.mjs)), ciblées sur ce que les essais ont trouvé tenu sans banc. Sur `d1679f3` : **14 survivantes**, seule K13 (le verrou jamais pris) rouge, par X16, un banc à course ([`mutations/c1-d1679f3.txt`](mutations/c1-d1679f3.txt)). Sur l'arbre retouché : **15 sur 15 rouges**, chacune par un cas nommé ([`mutations/c1-retouches.txt`](mutations/c1-retouches.txt)).

### 7. La suite entière

`pnpm install` puis `pnpm test` sur `APRES`, une fois : **1 270 tests, 1 270 verts**, aucun sauté ni annulé, le compte du ticket ; 13 min 35 s (18:09:53 → 18:23:28 UTC, charge 0,94 au départ, 1,09 à la fin). Sur l'arbre retouché, de même : **1 279 tests, 1 279 verts**, aucun sauté ni annulé (les huit cas neufs du banc du skill et le cas neuf du banc des textes) ; 13 min 31 s (17:56:04 → 18:09:35 UTC, charge 0,44 au départ, 5,0 relevée à 17:58, 1,32 à la fin). Journaux des essais sur les deux arbres : [`essais/journal.txt`](essais/journal.txt).

### Constats

| N° | Gravité | Objet | Preuve | Retouche |
| --- | --- | --- | --- | --- |
| 1 | à corriger | La veille dépasse sa durée d'une pause et d'une passe : « 25 minutes, pas plus » est faux, et le plafond de 30 minutes de l'outil n'est pas tenu (`A-180.1`) | C1 (1,2 s demandées, 6,4 s jouées) ; K12 survit | la veille ne commence aucune pause qui finirait après sa durée ; banc « la veille finit à sa durée » |
| 2 | à corriger | Une veille arrêtée par l'outil, sans ligne finale, n'a pas de suite | C1 (tenue) | quatrième puce de « La veille » : comme `VEILLE FINIE` |
| 3 | à corriger | Les sous-commandes au premier plan ont le délai par défaut de l'outil, 120 s, sous l'attente du verrou, 300 s ; ni une commande coupée, ni une sortie hors table, ni une erreur de `passe` n'ont de suite (`A-180.3`) | C2 ; la sonde de `index.lock` | `timeout` 600000 dit dans le skill ; une ligne « autre, ou aucune » ; la sortie 1 de `passe` |
| 4 | à corriger | Le réemploi « à couple égal » compare `model` à un alias que `get_session` ne rend jamais tel quel, et aucun champ de `get_session` n'est nommé (couple, contexte, échec) | la forme rendue par `get_session` | les champs nommés dans « Créer ou relancer », « L'état des sessions » et `VEILLE FINIE` |
| 5 | à corriger | L'erreur d'une installation lancée par une passe de la veille est jetée (`A-180.5`) | C5 | la veille écrit la sortie d'erreur de ses passes ; banc |
| 6 | à corriger | Le plafond se tait sur une `à-reprendre` restée posée : l'architecte n'apprend jamais le plafond (`A-89`) | C8 | les lignes du plafond partent toujours (son commentaire est neuf par construction ; `A-118` tient) ; banc |
| 7 | à corriger | Quatorze garanties sans banc : les `GIT_CONFIG_*` complétés (K1), le fsmonitor (K2), les hooks hors de leur place par défaut (K3), `a-juger` ou le diff en échec, qui distribueraient sur une liste vide, jamais sensible (K4, K5), les dépendances (K6, K7, K10, K11), la trace redite après le délai (K8), la forme refusée sans session (K9), la durée de la veille (K12), la seconde liste d'une PR de mise à jour, qui ferait relire une retouche sensible au couple ordinaire (K14), la fourche supprimée (K15) | 14 survivantes | huit cas de banc neufs, trois prolongés ; 15 sur 15 rouges |
| 8 | à corriger | `A-181.1` : l'alerte 24, le faux `gh` à deux pages écrit par interpolation | `relecteur.test.mjs:526` | `DEUX_PAGES`, un texte constant qui lit `BANC_FAUX_GH` et `BANC_SEPARATEUR` ; aucun faux outil ajouté par le patch n'interpole rien |
| 9 | mineur (porté) | Les lignes du Relecteur à l'architecte n'ont pas de forme exacte | lecture | trois formes, dans « Les lignes » |
| 10 | mineur (porté) | « Un outil absent : l'écrire à l'architecte », impossible sans `send_message` (le gabarit dit « <outil> absent » dans la réponse) | lecture | aligné sur le gabarit |
| 11 | mineur (porté) | `references/CONTENU.md` : « l'état des sessions, pour la seule règle 5 », contre `A-180.3` | lecture | « pour les règles 4, 5 et 6 » |
| 12 | mineur (porté) | Une PR tue ne sort jamais de `--taire` ; `create_session` en échec pour une autre cause et la sortie 3 d'une distribution écrite (réponse perdue, session dite orpheline à tort) sans suite | lecture | une phrase chacune dans le skill |
| 13 | mineur (suite) | Un refus (règle 4) sur une `à-reprendre` restée ne prévient pas l'auteur : `jouer` ne distingue pas une étiquette restée d'un passage rejoué (`A-118`) sans l'historique des étiquettes | C11 | ticket de suite : que la décision rende le rang de la marque qui déclenche, et que `jouer` le compare à la date de l'étiquette (événements de la PR) |
| 14 | mineur (suite) | Un plafond à moitié écrit (sortie 7 à la pose de l'étiquette) ne prévient pas l'architecte au rejeu | C12 | ticket de suite : au plafond, poser l'étiquette avant le commentaire (la nouvelle reste avant l'ancienne), ou la règle 1 rend aussi l'architecte |
| 15 | mineur (suite) | Une PR devenue sensible ou « double » sans push (le contrat de develop, ou le titre, a changé) : `reecrire` et `completer` gardent la session du tour à l'ancien couple ; `--couple` se compare au couple du geste, pas à celui de la session | lecture | question 2 |
| 16 | mineur (suite) | `send_message` en échec (une ligne, une relance) : aucune suite | lecture | ticket de suite |
| 17 | mineur (suite) | Une installation en échec par une panne passagère ne se retente qu'au lockfile suivant (voulu par `A-180`) : rien ne dit comment la relancer, sinon un Relecteur neuf | lecture | ticket de suite : un mot dans la cause « dépendances de develop » |
| 18 | mineur (suite) | « tête introuvable » par une course (un push entre le `fetch` de la préparation et la lecture de la PR, dans `jouer`) : un commentaire et une ligne à l'architecte pour rien | lecture | ticket de suite : relire une fois la tête avant de la dire introuvable |

Aucun bloquant : rien de faux ni de dangereux n'entre à la fusion, et aucune ligne d'une PR ne s'exécute. Les constats 1 à 8 sont à porter dans ce tour.

### Les retouches

[`retouches-tour-1.patch`](retouches-tour-1.patch) : `git apply` sur `d1679f3` (vérifié sur quatre arbres neufs), cinq fichiers, 236 lignes ajoutées et 22 retirées. Il porte les constats 1 à 12 et l'alerte 24 :

- `skills/chaine/relecteur/scripts/relecteur.mjs` : la veille ne commence aucune pause qui finirait après sa durée, et écrit sur sa sortie d'erreur celle de ses passes sorties en 0 ; au plafond, `lignes` reste celles de la décision ; l'en-tête le dit.
- `skills/chaine/relecteur/SKILL.md` : le `timeout` de l'outil ; la ligne « autre, ou aucune » et la sortie 1 de `passe` ; la sortie 3 précisée ; les champs de `get_session` ; les trois formes des lignes à l'architecte ; « <outil> absent » ; `create_session` en échec ; la veille arrêtée sans ligne ; la sortie de `--taire`. 105 lignes. Les textes que visent les mutations M55 à M58 de l'annexe n'ont pas bougé.
- `skills/chaine/relecteur/references/CONTENU.md` : les règles 4, 5 et 6 ; la veille et le plafond ; les cas neufs du banc.
- `skills/chaine/relecteur/scripts/relecteur.test.mjs` : N12 par `DEUX_PAGES` (alerte 24) ; « les dépendances » prolongé (la commande exacte, un lockfile neuf réinstallé) ; X15 prolongé (la même cause au passage suivant, une PR sans session d'auteur) ; huit cas neufs (l'installation en échec dans la veille, les autres causes d'illisible, la veille finie à sa durée, le plafond sur une étiquette restée, les `GIT_CONFIG_*`, tous les hooks et le fsmonitor, le verrou attendu, une PR de mise à jour acceptée). 34 tests.
- `scripts/relecteur.test.mjs` : un cas qui tient les phrases neuves du skill. 8 tests.

Choix d'écriture du patch, que la spec ne dicte pas mot pour mot, à confirmer : la suite d'une sortie hors table (comme 12 : rejouer, puis l'architecte et l'arrêt) ; une veille sans ligne finale lue comme `VEILLE FINIE` ; une PR tue tant que la passe lui rend le même geste à la même règle ; les trois formes des lignes à l'architecte. `NOTES-DE-VERSION.md` et `plugin.json` ne bougent pas (7.38.0).

Preuves, sur `APRES` plus le patch : les bancs touchés verts (`relecteur.test.mjs` du skill 34 sur 34, `scripts/relecteur.test.mjs` 8 sur 8) ; les quinze mutations K rouges ; mes essais : 28 sur 30 verts, les deux rouges étant C11 et C12, laissés à la suite ; la suite entière : **1 279 tests, 1 279 verts**, aucun sauté (1 270 sur `APRES`).

### Questions à l'architecte

1. **Un champ absent de `get_session`.** Le patch nomme les champs ; il ne dit pas quoi faire quand `get_session` ne rend pas `context_usage` ou `effort_level` (l'outil prévient qu'un effort peut être baissé, remplacé ou retiré). Recommandation : sans compte de tokens, la session n'est pas au plafond ; sans `effort_level`, ce n'est pas le même couple, donc une session neuve. Une phrase dans « Créer ou relancer » et « L'état des sessions ».
2. **Un couple qui change sans push** (constat 15). Recommandation : ticket de suite, avec une cause de plus pour `remplacer` (« couple ») dans la décision du lot 3a ; d'ici là, le cas est rare (le contrat de develop ou le titre de la PR doit changer pendant un tour).
3. **`create_session` pré-approuvé.** L'outil refuse `effort` quand `create_session` est pré-approuvé dans la session qui l'appelle (sa propre description le dit), et le skill n'en crée alors aucune. Un projet de la chaîne observé pré-approuve `create_session` dans les `permissions.allow` de son `.claude/settings.json` : un Relecteur lancé sur ce dépôt ne créerait aucune session de relecture. Ce n'est pas un défaut de la PR (le skill s'arrête et le dit) ; c'est à trancher avant la repose du lot 7 : retirer cette pré-approbation des projets en régime 8, ou admettre une session créée sans `effort`, ce que `P-64` exclut aujourd'hui.

### Verdict proposé

**Non conforme** au sommet `d1679f35c22743cac7c0faff61d2b1edf58945a9` : aucun bloquant, huit constats à corriger (1 à 8), quatre mineurs portés par le patch (9 à 12), six mineurs pour un ticket de suite (13 à 18). Conforme une fois `retouches-tour-1.patch` porté, à vérifier au second tour sur le delta. Alerte 24 fermée par le patch ; alerte 25, fausse alerte, acceptée.

Coût : 1 h 10 min de bout en bout (17:18 → 18:28 UTC), dont deux suites entières de 13 min 30 s chacune, jouées seules, et trois lots de mutations sur quatre copies (6 min, 4 min 37 s, 7 min 25 s).
