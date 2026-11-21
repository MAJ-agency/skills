# Le capitaine juge l'éligibilité par les verdicts, deux fois : à l'éligibilité, puis juste avant l'appel de fusion (lot 5a)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le code entier est dans le patch commun aux tickets 71, 72 et 73 ([`71-73-annexes/lot-5.patch`](71-73-annexes/lot-5.patch), `git apply` sur `25a72c7`), décrit fichier par fichier ci-dessous ; les bancs neufs ou changés sont rouges avant le code, la suite entière est verte après, et les mutations de [`71-73-annexes/mutations.mjs`](71-73-annexes/mutations.mjs) (série A) sont toutes rouges (« Vérification »). Rien à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/revue-exigee.mjs` et `revue-exigee.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs` et `faux-gh.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.mjs` et `pr-titre.test.mjs`, `skills/chaine/socle-chaine-de-production/references/ci/pr-titre.yml`, `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` (neuf), `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`. Les tickets 72 et 73 écrivent `passer.sh`, `sujet.sh` et `github.sh` après lui, dans la même PR. Les tickets 67 à 70 (suites du lot 4) ajoutent aussi à `faux-gh.mjs` et à `faux-gh.test.mjs` : la PR qui entre en second fusionne `origin/main` et garde les deux ajouts (le patch de ce ticket ne touche que `deplacerPendantCi`, l'en-tête de `pendantCi` et un test placé avant « faux gh, avantFusion »).

## Le besoin

Ce ticket réalise la partie **5a** de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (section « Les lots », point 5) : en régime 8, le capitaine ne lit plus la section de revue du corps de la PR, il exige un **tour de relecture validé pour le contenu du sommet**, et il le contrôle **deux fois**. Il porte `A-91` (le capitaine juge par les verdicts), tel qu'amendé par `A-105` (deux contrôles, aux endroits du rapport § 2.1), `A-107` (la ligne `/security-review:` du verdict remplace celle du corps, et le check `pr-titre` devient sensible au régime), `A-108` (commentaires lus par un fichier ; contrôle hors de `motifSansRevue` ; faux GitHub), `A-97` (le régime se lit sur la base et sur la date d'ouverture), `A-92` (la livraison d'un sujet n'a pas de verdict ; la PR de mise à jour d'un sujet en a un), `A-106` (« même contenu propre » : une mise à jour du capitaine garde le verdict), `A-113` (une lecture illisible fait sauter la PR sans renvoi), `A-126` (le capitaine approfondit son clone avant d'appeler les calculs : c'est déjà le cas, `passer.sh` et `sujet.sh` le font en tête) et `A-141` (le capitaine partage `tourValide`, la règle 2 du Relecteur).

Le régime 7 ne change pas : sans la clé `relecture` dans le `.claude/chaine.json` de la base, ou pour une PR ouverte avant `depuis`, le capitaine juge comme sur `main`. Le régime 8 (la bascule, lot 6) n'est pas allumé par ce ticket : aucun gabarit ne pose la clé.

Ce qui est acquis et que ce ticket ne refait pas : la décision (`tourValide`, `sommetsDesTours` de `decision-relecteur.mjs`), le lecteur de verdict (`verdict.mjs`), « même contenu propre » (`meme-contenu.sh`), « double relecture exigée » (`double-relecture.mjs`), `sujet.sh a-juger`. Le capitaine **les joue**, sur les mêmes faits que le Relecteur (`relecteur.mjs`, lot 4).

## Où

Base : `origin/main` à `25a72c7` (plugin **7.38.0**), le 2026-11-21. Les repères valent à ce commit ; les ajouts se placent par leur texte.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/revue-exigee.mjs` | en-tête ; `motifsDuCapitaine` reçoit `regime` ; neuves : `lireCleRelecture`, `regimeDeLaPr`, `verdictDuCapitaine`, `lireOptions` ; la CLI prend quatre options après ses trois arguments (décisions 1 à 4) |
| `skills/chaine/fusionner/scripts/github.sh` | neuve : `revue_du_capitaine` (décision 5) ; `pr_json` documente `created_at` |
| `skills/chaine/fusionner/scripts/passer.sh` | en-tête (étapes 1 et 5 ter, sorties 4 et 7) ; le bloc de la revue de l'étape 1 ; le second contrôle, juste avant le squash (décisions 6 et 7) |
| `skills/chaine/sujet/scripts/sujet.sh` | en-tête (`fusionner`, sorties 4 et 7) ; neuves `juger_revue` et `verdict_avant_fusion` ; `fusionner` : le premier contrôle après le jugement des fichiers, le second avant d'avancer le sujet (PR de mise à jour) ou avant le squash (décision 8) |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.mjs` | le régime lu, `PR_OUVERTE` (décision 9) |
| `skills/chaine/socle-chaine-de-production/references/ci/pr-titre.yml` | `PR_OUVERTE: ${{ github.event.pull_request.created_at }}` |
| `skills/chaine/sujet/scripts/faux-gh.mjs` | `pendantCi` : un commentaire ou des étiquettes qui tombent pendant la CI (décision 10) |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | **neuf** : le banc, 16 tests |
| `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` | 5 tests neufs, en fin de fichier |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs` | 2 tests neufs ; `PR_OUVERTE` retirée de l'environnement de chaque cas |
| `skills/chaine/sujet/scripts/faux-gh.test.mjs` | 1 test neuf |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version et la note, communes aux trois tickets (§ Version) |

Aucun autre fichier pour ce ticket. En particulier ni `boucle.sh` (aucun code de sortie neuf : décision 7), ni `decision-relecteur.mjs`, ni `relecteur.mjs`, ni `fusionner/SKILL.md` (aucun `.mjs` neuf à poser : la CLI est celle de `revue-exigee.mjs`), ni `sujet/scripts/faux-gh.mjs` pour la date d'ouverture d'une PR et la date de modification d'un commentaire, que la spec donnait au lot 5a (`A-108`) : le faux les rend déjà (`created_at` d'une PR depuis le ticket 66, `updated_at` d'un commentaire édité depuis le ticket 4 de l'autre programme). Ni l'un ni l'autre des deux `depot-jouet.mjs` que nomme la spec ne change : celui de `sujet/scripts/` publierait les calculs sur le develop du jouet, mais le banc du Relecteur (`relecteur.test.mjs`, lot 4) les y pose lui-même par-dessus, et un commit sans changement le casse (essayé : un test du Relecteur rouge) ; le banc de la boucle de ce ticket les pose donc lui-même, comme celui du Relecteur. Celui de `tickets/references/scripts/docs/` n'a rien à porter.

## Décisions

1. **Le régime d'une PR, une seule fonction : `regimeDeLaPr`** (`A-97`), dans `revue-exigee.mjs`. 8 quand sa base, `develop` ou `sujet/<nom>` et celle-là seule, porte la clé `relecture` (lue sur `refs/remotes/origin/<base>`) **et** que la PR a été ouverte strictement après `depuis` ; 7 sinon, une base hors de la chaîne comprise, comme le Relecteur. La forme de la clé est celle que le Relecteur lit (`contrat` de `relecteur.mjs`, `A-179`), recopiée dans `lireCleRelecture` : `depuis` UTC en `Z`, avec ou sans millisecondes ; `delai` entier ≥ 1 ; `ordinaire` et `sensible` `{ modele: opus|sonnet, effort: low…max }`. Une clé mal formée, un contrat qui ne se lit pas ou une date d'ouverture illisible : `{ illisible }`, jamais un régime. Raison : une clé que le Relecteur ne lit pas, le capitaine ne la lit pas non plus, et la PR n'est ni relue ni fusionnée. Limite écrite : `Date.parse` reporte un 30 février au 2 mars, chez le Relecteur comme ici (le banc le fige).
2. **En régime 8, la section de revue ne se lit plus** (`A-107`) : `motifsDuCapitaine({ …, regime: 8 })` ne rend que `motifTitreSansCode` (un titre de code sur de la documentation seule reste un refus). La ligne `/security-review: lancée` est exigée **dans le verdict** sur un chemin sensible : c'est `compter` de `decision-relecteur.mjs` qui le fait, par le fait `sensible` (déjà codé, ticket 66).
3. **Le verdict, la règle 2 jouée par la même fonction** (`A-91`, `A-141`) : `verdictDuCapitaine` appelle `tourValide` sur `{ commentaires, tete, exiges, sensible, memeContenu }`. Les faits sont ceux du Relecteur : `sensible` par `cheminSensible` sur le contrat de la base (`lireBase`, qui ajoute celui de develop à une base de sujet : ce que lit `chemins-sensibles.mjs <base>` depuis le dossier du Relecteur, placé sur develop) ; `exiges` par `double-relecture.mjs` (0 → 1, 20 → 2, autre → `illisible`) ; `memeContenu` par `meme-contenu.sh V T B` pour chaque sommet de tour autre que la tête (0 → vrai, 20 → faux, autre → `illisible`). Sans tour validé, le motif dit ce qui manque, dont « deux verdicts validés de deux sessions exigés » et « chemin sensible : `/security-review: lancée` exigée dans le verdict ». Une `LectureIllisible` (commentaires, marque presque à la forme, calcul illisible) : `Illisible`, jamais « validé ».
4. **La CLI de `revue-exigee.mjs`** (`A-108`) : `printf fichiers | node revue-exigee.mjs "$corps" "$titre" "origin/<base>" --ouverte <date> --tete <sha> --branche <tête> --commentaires <fichier>`. Les options suivent les trois arguments, **toutes ou aucune** (`lireOptions`) : un corps qui commence par `--ouverte` reste un corps (le banc le tient). Les commentaires passent par un fichier, le tableau de **toutes** les pages. Avec `--ouverte`, la première ligne dit le régime : `régime 7`, `régime 8` (puis le motif, sortie 1) ou `régime 8 : tour <k> validé au sommet <sha>` (sortie 0). Sortie 21 : lecture illisible, la cause sur la sortie standard. Sortie 2 : options mal formées. Sans les options, rien ne change (le check `pr-titre`, `gestes.sh` du skill `relecture`, les bancs existants).
5. **`revue_du_capitaine <json de la PR> <sommet> <base>`** (`github.sh`), le diff propre sur l'entrée standard : relit `origin/develop` et les `origin/sujet/*` par refspecs explicites (un clone `--single-branch` ne les met pas à jour sur un fetch nu ; les calculs ne lisent pas le réseau, `A-126`), lit les commentaires par `lire_github --paginate` (pages concaténées en un tableau ; GitHub illisible : 5), puis joue la CLI avec `created_at`, le sommet et la tête. Une seule fonction pour `passer.sh`, `sujet.sh` et les deux contrôles. En régime 7, elle lit aussi les commentaires (une lecture GitHub de plus par passage) : le jugement ne change pas.
6. **`passer.sh`, premier contrôle** (`A-105`), à l'endroit de l'ancienne revue de l'étape 1, sous la dispense des livraisons (`A-92`), sur la tête lue après le `git fetch` et le diff `depart..origine` : 0, on continue ; 1, sortie 4 (renvoi, le motif) ; 21, sortie 7 (sautée sans renvoi, `A-113`) ; 5, sortie 5 ; autre, sortie 3. Le régime, lu sur la première ligne, vaut pour la suite du passage. **Une PR empilée** (base qui n'est ni develop ni un sujet) dont develop est en régime 8 est renvoyée (sortie 4, « PR empilée … ») : le Relecteur ne la relirait jamais (`hors-regime`), et la recibler sur develop sans verdict ouvrirait une porte (question 1).
7. **`passer.sh`, second contrôle** (`A-105`, étape 5 ter), une fois le contrôle d'ascendance rendu « à-jour », avant le squash, en régime 8 seulement : la PR relue (`pr_json`) — fermée, brouillon, sans `à-fusionner`, `fusion-bloquée` : sortie 7, « PR plus éligible juste avant la fusion » ; sommet changé : sortie 5 — puis `revue_du_capitaine` sur le sommet fusionné et le diff `merge-base(sommet, develop)..sommet` : 1 → 4 avec « (contrôle juste avant la fusion) », 21 → 7. Sur 4, 7 et 3, le capitaine quitte sa branche (`quitter_capitaine`). **Aucun code de sortie neuf** (`A-108` : ne pas réemployer un code pris, et aucun n'est ajouté) : `boucle.sh` traite déjà 4 (renvoi par `refus.sh`) et 7 (sautée).
8. **`sujet.sh fusionner`** : premier contrôle juste après le jugement des fichiers (`fichiers_a_juger`), avant `liens_sur_index`, le verrou et le premier contrôle d'ascendance (`A-105`). En régime 7, la revue porte comme avant sur la résolution seule d'une PR de mise à jour, et ses retouches se jugent après les checks (`juger_retouches`). En régime 8, une PR de mise à jour **n'est pas exemptée** (`A-92`) : son verdict se juge sur la résolution et les retouches (la seconde liste de `a-juger`, ce que le Relecteur lit), et `juger_retouches` ne joue plus (les retouches sont dans le verdict). Le second contrôle (`verdict_avant_fusion`) : avant `avancer_sujet` pour une PR de mise à jour ; après la boucle d'ascendance « à-jour », avant le `PUT …/merge`, pour une sous-PR ordinaire, sur `merge-base(sommet, origin/<base>)..sommet`. `sujet.sh fusionner` lit là les étiquettes, ce qu'il ne fait nulle part ailleurs. Suites : `juger_revue` (0 rien ; 1 → 4 ; 21 → 7 ; 5 → 5 ; autre → 11, côté capitaine).
9. **Le check `PR titre`** (`A-107`) : `regimeDeLaPr` sur `PR_BASE` et `PR_OUVERTE` (le `created_at` de la PR, ajouté au workflow) ; en régime 8, les motifs du capitaine en régime 8, et une note « régime 8 : la relecture se lit dans le verdict… ». La date n'est lue que si la base porte la clé ; illisible : sortie 3 (le check ne conclut pas, jamais un vert). Il reste non exigé par la protection de develop.
10. **Le faux GitHub et le dépôt jouet** (`A-108`) : `pendantCi` reçoit deux formes de plus, `{ lectures, pr, commentaire }` et `{ lectures, pr, labels }` : un `refusé` ou une étiquette du Relecteur qui tombent pendant la CI d'un passage, ce que le second contrôle doit voir. Un comportement ajouté au faux a son test (`faux-gh.test.mjs`). Le banc de la boucle pose sur le develop du jouet `decision-relecteur.mjs`, `verdict.mjs`, `double-relecture.mjs`, `meme-contenu.sh` et `chemins-sensibles.mjs` : la boucle joue la copie de develop, comme dans un projet qui a reposé `fusionner` et `revue-adversariale`.

## Questions à l'architecte

1. **Une PR empilée en régime 8** (décision 6). La spec ne dit rien : le Relecteur ne regarde qu'une PR vers develop ou un sujet (`A-97`), et `passer.sh` recible une pile sur develop. Écrit : la renvoyer, avec le motif qui dit de la recibler puis de demander sa relecture. Autre choix : la juger comme une PR vers develop (régime et verdict lus sur develop), ce qui suppose que le Relecteur la relise aussi. **Recommandation : garder le renvoi** ; la chaîne interdit déjà les piles (`CLAUDE.md` des projets), et c'est le côté sûr.
2. **Une sous-PR sautée pour une lecture illisible garde son sujet** (décision 8 : sortie 7, que `traiter_sujets` traite comme le verrou d'un autre capitaine). Les autres sous-PR du sujet attendent tant que la cause demeure ; le Relecteur, lui, prévient l'architecte. Ajouter un code qui rende le sujet toucherait `boucle.sh`, hors des fichiers du lot. **Recommandation : laisser ainsi** (une cause d'illisible est presque toujours commune aux PR d'un dépôt : un en-tête de règle, un clone partiel), et l'écrire dans le skill `fusionner` à la partie 6b.

## À faire, dans l'ordre

### § 0 — Partir de `main`, et la règle de repli

`git fetch origin main`, une branche depuis `origin/main`. Les annexes se lisent sous `docs/issues/gouverner-nos-boucles/issues/71-73-annexes/` de `main` si la PR de documentation qui porte ces tickets y est entrée, sinon sur la branche de documentation du programme (`git fetch origin <branche>`, puis `git show FETCH_HEAD:<chemin>`), écrites dans le scratchpad de la session, jamais dans le dépôt.

- **Les trois tickets 71, 72 et 73 font une seule PR** (`A-149`) : le patch [`lot-5.patch`](71-73-annexes/lot-5.patch) porte les trois. Si `main` est encore à `25a72c7`, `git apply --check <scratchpad>/lot-5.patch` puis `git apply <scratchpad>/lot-5.patch` depuis la racine pose tout ; sinon, `git apply -3` puis la résolution fichier par fichier, ce ticket et ses décisions faisant foi.
- **La version** : celle de `.claude-plugin/plugin.json` sur `main` au moment de livrer, le deuxième nombre plus un, le troisième à zéro (7.38.0 donne **7.39.0**) ; si `main` a bougé, la session reprend la version suivante de `main` et la date du jour dans la note.
- **Si `decision-relecteur.mjs`, `verdict.mjs`, `meme-contenu.sh` ou `double-relecture.mjs` ont changé sur `main`** : le banc `verdict-du-capitaine.test.mjs` les joue tels quels et dit ce qui ne tient plus.
- **Si `main` bouge entre l'ouverture de la PR et sa fusion** : fusionner `origin/main` dans la branche par un commit de fusion (jamais de rebase ni de push forcé), reprendre la version, puis « Vérification » à nouveau.

### § 1 — Les bancs d'abord, vus rouges

Les bancs du patch posés seuls sur `25a72c7` (`git apply --include='*.test.mjs' <scratchpad>/lot-5.patch`) : voir « Vérification », point 1.

### § 2 — Le code

Le patch, appliqué. Ce que chaque fichier reçoit est dit au tableau « Où » et aux décisions ; le patch fait foi.

### § 3 — Livrer

La PR des trois tickets vers `main`, titre `feat(chaine): le capitaine juge par les verdicts, les gardes des fichiers sensibles, renvois et gate selon le régime (plugin <version>)`. `Label: contre-revue` : l'architecte la fait contre-relire (deux tours sur la PR, `P-65`). Dans le corps, la sortie de la « Vérification » (comptes, mutations, suite entière).

## Surfaces

| Surface | Prouvée par |
| --- | --- |
| Régime 8 sans verdict : renvoi en 4, aucune mise à jour, aucune fusion | `verdict-du-capitaine.test.mjs`, « sans verdict, renvoyée en sortie 4 avant toute mise à jour » |
| Section de revue non lue en régime 8 ; un tour validé fait entrer ; second contrôle dit | « la section de revue n'est plus lue » |
| Régime 7 : sans la clé, ouverte avant `depuis`, ouverte à l'instant de `depuis` | « régime 7, passer.sh » |
| Une mise à jour du capitaine garde le verdict | « develop a bougé, le capitaine met la PR à jour » |
| Un `refusé` pendant la CI : renvoi au second contrôle | « un `refusé` tombé pendant la CI » (passer.sh et sujet.sh) |
| `à-fusionner` retirée pendant la CI : sautée | « `à-fusionner` retirée pendant la CI » (passer.sh et sujet.sh) |
| Lecture illisible (marque presque à la forme, clé mal formée) : sautée en 7 | « une lecture illisible » |
| Chemin sensible : `lancée` exigée dans le verdict | « sur un chemin sensible » |
| Deux verdicts exigés (`Relecture: double`) | « deux verdicts exigés » |
| GitHub illisible sur les commentaires : pause (5) | « GitHub illisible sur les commentaires » |
| PR empilée renvoyée | « une PR empilée » |
| Sous-PR : premier contrôle avant toute mise à jour, validée en retard puis mise à jour et fusionnée | `sujet.sh fusionner : une sous-PR sans verdict…` |
| PR de mise à jour non exemptée | « une PR de mise à jour n'est pas exemptée » |
| La boucle joue les calculs de develop ; renvoi par `refus.sh` | « régime 8, boucle.sh » |
| `lireCleRelecture`, `regimeDeLaPr`, `motifsDuCapitaine` en 8, `verdictDuCapitaine`, `lireOptions` | `revue-exigee.test.mjs`, les cinq tests « lot 5a » |
| `PR titre` en régime 8, `PR_OUVERTE` | `pr-titre.test.mjs`, « régime 8 (lot 5a) » et « le workflow donne PR_OUVERTE » |
| `pendantCi` : commentaire, étiquettes | `faux-gh.test.mjs`, « pendantCi : un commentaire ou des étiquettes » |

## Vérification

Les comptes de la « Vérification » des trois tickets sont ceux du patch entier, mesurés ensemble (une seule PR) ; ils sont dans le ticket 73, § « Vérification », et répétés ici pour la série A.

1. **Rouge avant le code.** Les bancs du patch seuls sur `25a72c7` (`git apply --include='*.test.mjs'`), chacun par `node --test <fichier>` : **23 rouges pour ce ticket** — `verdict-du-capitaine.test.mjs` 15 sur 16 (le cas « régime 7 » passe déjà : il fige le comportement d'aujourd'hui), `revue-exigee.test.mjs` 5 sur 37, `pr-titre.test.mjs` 2 sur 12 (le régime, le workflow), `faux-gh.test.mjs` 1 sur 16.
2. **Vert après.** Les mêmes, le patch entier appliqué : tous verts ; puis la suite entière (ticket 73, « Vérification », point 3).
3. **Mutations.** `node <scratchpad>/mutations.mjs A` depuis la racine : « toutes rouges » (série A, 30 mutations ; ticket 73, point 4).
4. `git diff --stat origin/main` : les fichiers de « Où » des trois tickets, et eux seuls.

## Ce qui n'a pas été établi

1. **Les gestes réels** : une vraie PR en régime 8 sur un vrai GitHub (pagination réelle des commentaires, `created_at` réel, clone superficiel d'une session cloud) n'est jouée par aucun banc ; c'est l'essai de la partie 6c (« Vérification d'ensemble »).
2. **Un `refusé` tombé après le second contrôle et avant le `PUT`** (quelques secondes) n'est vu par personne : la fenêtre que `A-105` réduit, il ne la ferme pas.
3. **La résolution d'un conflit de pile par le capitaine** donne « différent » (`A-106`, limite écrite) : la PR repart en relecture. Non rejoué ici (la pile est renvoyée en régime 8).
4. **Le coût** : en régime 7, une lecture GitHub des commentaires de plus par passage ; en régime 8, deux lectures et deux jeux des calculs par PR fusionnée. Non mesuré.

## Hors périmètre

- **Les gardes des fichiers sensibles** (lot 5b, ticket 72) et **les renvois, messages et gate selon le régime** (lot 5c, ticket 73), dans la même PR.
- **La clé `relecture` dans le gabarit `chaine.json`, les skills des rôles à deux régimes** (lot 6). `fusionner/SKILL.md` ne dit pas encore le régime 8 (partie 6b).
- **`boucle.sh`** : aucun changement (décision 7 ; question 2).

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur la spec (lot 5, partie a ; `A-91`, `A-97`, `A-105`, `A-107`, `A-108`, `A-113`, `A-126`) et sur `origin/main` à `25a72c7` (plugin 7.38.0). Code, bancs et mutations joués sur un clone neuf (« Vérification »). Points remontés à l'architecte : les deux « Questions à l'architecte ».
