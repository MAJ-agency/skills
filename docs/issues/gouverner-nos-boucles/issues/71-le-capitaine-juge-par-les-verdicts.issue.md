# Le capitaine juge l'éligibilité par les verdicts, deux fois : à l'éligibilité, puis juste avant l'appel de fusion (lot 5a)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le code entier est dans le patch commun aux tickets 71, 72 et 73 ([`71-73-annexes/lot-5.patch`](71-73-annexes/lot-5.patch), écrit sur `25a72c7`, posé selon le § 2 sur `main` après les PR A et B), décrit fichier par fichier ci-dessous ; les bancs neufs ou changés sont rouges avant le code, la suite entière est verte après, et les mutations de [`71-73-annexes/mutations.mjs`](71-73-annexes/mutations.mjs) (série A) sont toutes rouges (« Vérification »). Rien à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/revue-exigee.mjs` et `revue-exigee.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs` et `faux-gh.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.mjs` et `pr-titre.test.mjs`, `skills/chaine/socle-chaine-de-production/references/ci/pr-titre.yml`, `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` (neuf), `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`. Les tickets 72 et 73 écrivent `passer.sh`, `sujet.sh` et `github.sh` après lui, dans la même PR. Les PR A (tickets 67 à 69) et B (ticket 70) entrent avant celle-ci (`A-185`, point 9) et touchent des fichiers voisins : la PR A `faux-gh.mjs` et `faux-gh.test.mjs` (le patch de ce ticket n'y touche que `deplacerPendantCi`, l'en-tête de `pendantCi` et un test placé avant « faux gh, avantFusion ») et `decision-relecteur.mjs`, que ce ticket joue ; la PR B `tickets.test.mjs` (ticket 73). Le patch s'applique sur elles par `git apply -3` sans autre conflit que les deux fichiers de version, et ses bancs y sont verts (essayé, § 2 et « Vérification »).

## Le besoin

Ce ticket réalise la partie **5a** de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (section « Les lots », point 5) : en régime 8, le capitaine ne lit plus la section de revue du corps de la PR, il exige un **tour de relecture validé pour le contenu du sommet**, et il le contrôle **deux fois**. Il porte `A-91` (le capitaine juge par les verdicts), tel qu'amendé par `A-105` (deux contrôles, aux endroits du rapport § 2.1), `A-107` (la ligne `/security-review:` du verdict remplace celle du corps, et le check `pr-titre` devient sensible au régime), `A-108` (commentaires lus par un fichier ; contrôle hors de `motifSansRevue` ; faux GitHub), `A-97` (le régime se lit sur la base et sur la date d'ouverture), `A-92` (la livraison d'un sujet n'a pas de verdict ; la PR de mise à jour d'un sujet en a un), `A-106` (« même contenu propre » : une mise à jour du capitaine garde le verdict), `A-113` (une lecture illisible fait sauter la PR sans renvoi), `A-126` (le capitaine approfondit son clone avant d'appeler les calculs : c'est déjà le cas, `passer.sh` et `sujet.sh` le font en tête) et `A-141` (le capitaine partage `tourValide`, la règle 2 du Relecteur).

Le régime 7 ne change pas : sans la clé `relecture` dans le `.claude/chaine.json` de la base, ou pour une PR ouverte avant `depuis`, le capitaine juge comme sur `main`. Le régime 8 (la bascule, lot 6) n'est pas allumé par ce ticket : aucun gabarit ne pose la clé.

Ce qui est acquis et que ce ticket ne refait pas : la décision (`tourValide`, `sommetsDesTours` de `decision-relecteur.mjs`), le lecteur de verdict (`verdict.mjs`), « même contenu propre » (`meme-contenu.sh`), « double relecture exigée » (`double-relecture.mjs`), `sujet.sh a-juger`. Le capitaine **les joue**, sur les mêmes faits que le Relecteur (`relecteur.mjs`, lot 4).

## Où

Patch écrit sur `origin/main` à `25a72c7` (plugin **7.38.0**), le 2026-11-21 ; il se pose sur le `main` qui aura reçu les PR A et B (§ 2). Les ajouts se placent par leur texte.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/revue-exigee.mjs` | en-tête ; `motifsDuCapitaine` reçoit `regime` ; neuves : `lireCleRelecture`, `regimeDeLaPr`, `verdictDuCapitaine`, `lireOptions` ; la CLI prend quatre options après ses trois arguments ; un contrat illisible qui ne nomme pas la clé reste en régime 7 ; une panne de l'outil en régime 8 sort en 3 (décisions 1 à 4) |
| `skills/chaine/fusionner/scripts/github.sh` | neuve : `revue_du_capitaine` (décision 5) ; `pr_json` documente `created_at` |
| `skills/chaine/fusionner/scripts/passer.sh` | en-tête (étapes 1 et 5 ter, sorties 4 et 7) ; le bloc de la revue de l'étape 1 ; le second contrôle, juste avant le squash (décisions 6 et 7) |
| `skills/chaine/sujet/scripts/sujet.sh` | en-tête (`fusionner`, sorties 4 et 7) ; neuves `juger_revue` et `verdict_avant_fusion` ; `fusionner` : le premier contrôle après le jugement des fichiers, le second avant d'avancer le sujet (PR de mise à jour) ou avant le squash (décision 8) |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.mjs` | le régime lu, `PR_OUVERTE` (décision 9) |
| `skills/chaine/socle-chaine-de-production/references/ci/pr-titre.yml` | `PR_OUVERTE: ${{ github.event.pull_request.created_at }}` |
| `skills/chaine/sujet/scripts/faux-gh.mjs` | `pendantCi` : un commentaire ou des étiquettes qui tombent pendant la CI (décision 10) |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | **neuf** : le banc, 19 tests |
| `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` | 5 tests neufs, en fin de fichier |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs` | 2 tests neufs ; `PR_OUVERTE` retirée de l'environnement de chaque cas |
| `skills/chaine/sujet/scripts/faux-gh.test.mjs` | 1 test neuf |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version et la note, communes aux trois tickets, posées par `note-et-version.mjs` (§ 2) |

Aucun autre fichier pour ce ticket. En particulier ni `boucle.sh` (aucun code de sortie neuf : décision 7), ni `decision-relecteur.mjs`, ni `relecteur.mjs`, ni `fusionner/SKILL.md` (aucun `.mjs` neuf à poser : la CLI est celle de `revue-exigee.mjs`), ni `sujet/scripts/faux-gh.mjs` pour la date d'ouverture d'une PR et la date de modification d'un commentaire, que la spec donnait au lot 5a (`A-108`) : le faux les rend déjà (`created_at` d'une PR depuis le ticket 66, `updated_at` d'un commentaire édité depuis le ticket 4 de l'autre programme). Ni l'un ni l'autre des deux `depot-jouet.mjs` que nomme la spec ne change : celui de `sujet/scripts/` publierait les calculs sur le develop du jouet, mais le banc du Relecteur (`relecteur.test.mjs`, lot 4) les y pose lui-même par-dessus, et un commit sans changement le casse (essayé : un test du Relecteur rouge) ; le banc de la boucle de ce ticket les pose donc lui-même, comme celui du Relecteur. Celui de `tickets/references/scripts/docs/` n'a rien à porter.

## Décisions

1. **Le régime d'une PR, une seule fonction : `regimeDeLaPr`** (`A-97`), dans `revue-exigee.mjs`. 8 quand sa base, `develop` ou `sujet/<nom>` et celle-là seule, porte la clé `relecture` (lue sur `refs/remotes/origin/<base>`) **et** que la PR a été ouverte strictement après `depuis` ; 7 sinon, une base hors de la chaîne comprise, comme le Relecteur. La forme de la clé est celle que le Relecteur lit (`contrat` de `relecteur.mjs`, `A-179`), recopiée dans `lireCleRelecture` : `depuis` UTC en `Z`, avec ou sans millisecondes ; `delai` entier ≥ 1 ; `ordinaire` et `sensible` `{ modele: opus|sonnet, effort: low…max }`. Une clé mal formée, un contrat qui ne se lit pas et nomme la clé (`"relecture"` dans son texte), ou une date d'ouverture illisible : `{ illisible }`, jamais un régime. Raison : une clé que le Relecteur ne lit pas, le capitaine ne la lit pas non plus, et la PR n'est ni relue ni fusionnée. Un contrat qui ne se lit pas et ne nomme pas la clé : régime 7, jugé comme sur `main` (renvoi en 4, « le contrat de origin/<base> illisible ») ; en régime 7, aucun Relecteur ne préviendrait personne d'un saut (`A-186`, point 1). Limite écrite : `Date.parse` reporte un 30 février au 2 mars, chez le Relecteur comme ici (le banc le fige).
2. **En régime 8, la section de revue ne se lit plus** (`A-107`) : `motifsDuCapitaine({ …, regime: 8 })` ne rend que `motifTitreSansCode` (un titre de code sur de la documentation seule reste un refus). La ligne `/security-review: lancée` est exigée **dans le verdict** sur un chemin sensible : c'est `compter` de `decision-relecteur.mjs` qui le fait, par le fait `sensible` (déjà codé, ticket 66).
3. **Le verdict, la règle 2 jouée par la même fonction** (`A-91`, `A-141`) : `verdictDuCapitaine` appelle `tourValide` sur `{ commentaires, tete, exiges, sensible, memeContenu }`. Les faits sont ceux du Relecteur : `sensible` par `cheminSensible` sur le contrat de la base (`lireBase`, qui ajoute celui de develop à une base de sujet : ce que lit `chemins-sensibles.mjs <base>` depuis le dossier du Relecteur, placé sur develop) ; `exiges` par `double-relecture.mjs` (0 → 1, 20 → 2, autre → `illisible`) ; `memeContenu` par `meme-contenu.sh V T B` pour chaque sommet de tour autre que la tête (0 → vrai, 20 → faux, autre → `illisible`). Sans tour validé, le motif dit ce qui manque, dont « deux verdicts validés de deux sessions exigés » et « chemin sensible : `/security-review: lancée` exigée dans le verdict ». Une `LectureIllisible` (commentaires, marque presque à la forme, calcul illisible) : `Illisible`, jamais « validé ».
4. **La CLI de `revue-exigee.mjs`** (`A-108`) : `printf fichiers | node revue-exigee.mjs "$corps" "$titre" "origin/<base>" --ouverte <date> --tete <sha> --branche <tête> --commentaires <fichier>`. Les options suivent les trois arguments, **toutes ou aucune** (`lireOptions`) : un corps qui commence par `--ouverte` reste un corps (le banc le tient). Les commentaires passent par un fichier, le tableau de **toutes** les pages. Avec `--ouverte`, la première ligne dit le régime : `régime 7`, `régime 8` (puis le motif, sortie 1) ou `régime 8 : tour <k> validé au sommet <sha>` (sortie 0). Sortie 21 : lecture illisible, la cause sur la sortie standard. Sortie 2 : options mal formées. Sortie 3 : en régime 8, l'outil en panne (un calcul absent à côté, une exception), « revue du capitaine en échec : … » ; jamais 1, que le capitaine lirait « renvoi » (`passer.sh` : 3 ; `sujet.sh` : 11). Sans les options, rien ne change (le check `pr-titre`, `gestes.sh` du skill `relecture`, les bancs existants).
5. **`revue_du_capitaine <json de la PR> <sommet> <base>`** (`github.sh`), le diff propre sur l'entrée standard : relit `origin/develop` et les `origin/sujet/*` par refspecs explicites (un clone `--single-branch` ne les met pas à jour sur un fetch nu ; les calculs ne lisent pas le réseau, `A-126`), lit les commentaires par `lire_github --paginate` (pages concaténées en un tableau ; GitHub illisible : 5), puis joue la CLI avec `created_at`, le sommet et la tête. Une seule fonction pour `passer.sh`, `sujet.sh` et les deux contrôles. Sans la clé `relecture` sur la base (`cle_relecture_sur`, une lecture locale), elle ne relit ni develop ni les sujets et ne lit pas les commentaires : la CLI juge la section de revue comme sur `main` (mutation A30 ; `A-186`, point 1). Avec la clé et une PR ouverte avant `depuis` (régime 7), elle lit les commentaires pour rien.
6. **`passer.sh`, premier contrôle** (`A-105`), à l'endroit de l'ancienne revue de l'étape 1, sous la dispense des livraisons (`A-92`), sur la tête lue après le `git fetch` et le diff `depart..origine` : 0, on continue ; 1, sortie 4 (renvoi, le motif) ; 21, sortie 7 (sautée sans renvoi, `A-113`) ; 5, sortie 5 ; autre, sortie 3. Le régime, lu sur la première ligne, vaut pour la suite du passage. **Une PR empilée** (base qui n'est ni develop ni un sujet) dont develop est en régime 8 est renvoyée (sortie 4, « PR empilée … ») : le Relecteur ne la relirait jamais (`hors-regime`), et la recibler sur develop sans verdict ouvrirait une porte (question 1).
7. **`passer.sh`, second contrôle** (`A-105`, étape 5 ter), une fois le contrôle d'ascendance rendu « à-jour », avant le squash, en régime 8 seulement : la PR relue (`pr_json`) — fermée, brouillon, sans `à-fusionner`, `fusion-bloquée` : sortie 7, « PR plus éligible juste avant la fusion » ; sommet changé : sortie 5 — puis `revue_du_capitaine` sur le sommet fusionné et le diff `merge-base(sommet, develop)..sommet` : 1 → 4 avec « (contrôle juste avant la fusion) », 21 → 7. Sur 4, 7 et 3, le capitaine quitte sa branche (`quitter_capitaine`). **Aucun code de sortie neuf** (`A-108` : ne pas réemployer un code pris, et aucun n'est ajouté) : `boucle.sh` traite déjà 4 (renvoi par `refus.sh`) et 7 (sautée).
8. **`sujet.sh fusionner`** : premier contrôle juste après le jugement des fichiers (`fichiers_a_juger`), avant `liens_sur_index`, le verrou et le premier contrôle d'ascendance (`A-105`). En régime 7, la revue porte comme avant sur la résolution seule d'une PR de mise à jour, et ses retouches se jugent après les checks (`juger_retouches`). En régime 8, une PR de mise à jour **n'est pas exemptée** (`A-92`) : son verdict se juge sur la résolution et les retouches (la seconde liste de `a-juger`, ce que le Relecteur lit), et `juger_retouches` ne joue plus (les retouches sont dans le verdict). Le second contrôle (`verdict_avant_fusion`) : avant `avancer_sujet` pour une PR de mise à jour ; après la boucle d'ascendance « à-jour », avant le `PUT …/merge`, pour une sous-PR ordinaire, sur `merge-base(sommet, origin/<base>)..sommet`. `sujet.sh fusionner` lit là les étiquettes, ce qu'il ne fait nulle part ailleurs. Suites : `juger_revue` (0 rien ; 1 → 4 ; 21 → 7 ; 5 → 5 ; autre → 11, côté capitaine).
9. **Le check `PR titre`** (`A-107`) : `regimeDeLaPr` sur `PR_BASE` et `PR_OUVERTE` (le `created_at` de la PR, ajouté au workflow) ; en régime 8, les motifs du capitaine en régime 8, et une note « régime 8 : la relecture se lit dans le verdict… ». La date n'est lue que si la base porte la clé ; illisible : sortie 3 (le check ne conclut pas, jamais un vert). Il reste non exigé par la protection de develop.
10. **Le faux GitHub et le dépôt jouet** (`A-108`) : `pendantCi` reçoit deux formes de plus, `{ lectures, pr, commentaire }` et `{ lectures, pr, labels }` : un `refusé` ou une étiquette du Relecteur qui tombent pendant la CI d'un passage, ce que le second contrôle doit voir. Un comportement ajouté au faux a son test (`faux-gh.test.mjs`). Le banc de la boucle pose sur le develop du jouet `decision-relecteur.mjs`, `verdict.mjs`, `double-relecture.mjs`, `meme-contenu.sh` et `chemins-sensibles.mjs` : la boucle joue la copie de develop, comme dans un projet qui a reposé `fusionner` et `revue-adversariale`.

## Questions à l'architecte

1. **Une PR empilée en régime 8** (décision 6). La spec ne dit rien : le Relecteur ne regarde qu'une PR vers develop ou un sujet (`A-97`), et `passer.sh` recible une pile sur develop. Écrit : la renvoyer, avec le motif qui dit de la recibler puis de demander sa relecture. Autre choix : la juger comme une PR vers develop (régime et verdict lus sur develop), ce qui suppose que le Relecteur la relise aussi. **Recommandation : garder le renvoi** ; la chaîne interdit déjà les piles (`CLAUDE.md` des projets), et c'est le côté sûr. **Tranché : le renvoi** (`A-185`, point 1).
2. **Une sous-PR sautée pour une lecture illisible garde son sujet** (décision 8 : sortie 7, que `traiter_sujets` traite comme le verrou d'un autre capitaine). Les autres sous-PR du sujet attendent tant que la cause demeure ; le Relecteur, lui, prévient l'architecte. Ajouter un code qui rende le sujet toucherait `boucle.sh`, hors des fichiers du lot. **Recommandation : laisser ainsi** (une cause d'illisible est presque toujours commune aux PR d'un dépôt : un en-tête de règle, un clone partiel), et l'écrire dans le skill `fusionner` à la partie 6b. **Tranché : ainsi** (`A-185`, point 2).

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main
[ "$(git branch --show-current)" != main ] || git switch -c claude/lot-5-verdicts
git switch -C "$(git branch --show-current)" origin/main
git fetch origin claude/hopeful-lovelace-ouk6tz
for f in lot-5.patch mutations.mjs note-et-version.mjs; do git show FETCH_HEAD:docs/issues/gouverner-nos-boucles/issues/71-73-annexes/$f > "$S/$f"; done
sha256sum "$S/lot-5.patch"
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
```

La branche de la session, sans commit encore, est remise sur `origin/main` (jamais `main` elle-même). Les annexes se lisent sur la branche de documentation du programme, `claude/hopeful-lovelace-ouk6tz` (sur `main` si la PR de documentation qui porte ces tickets y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. La somme rendue est **`4e97a67c94dc185cb0b347481e8011d10bae0e5ea14dbd3845bd2c952e61806f`**, sinon s'arrêter.

**Le `main` attendu** (`A-185`, point 9 ; `A-186`, point 2) : la PR A (tickets 67 à 69) puis la PR B (ticket 70) entrées, plugin **7.38.2** (ou plus si une autre PR est entrée). Si `main` est encore à `25a72c7` (7.38.0 : le lot 5 part seul), les mêmes gestes valent, sans conflit au § 2.

### § 1 — Les bancs d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" origin/main
(cd "$S/rouge" && git apply -3 --include='*.test.mjs' "$S/lot-5.patch" && git status --short | wc -l)
(cd "$S/rouge" && for f in skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/revue-exigee.test.mjs skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs skills/chaine/sujet/scripts/faux-gh.test.mjs skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs scripts/points-d-entree.test.mjs skills/chaine/fusionner/scripts/messages-du-regime.test.mjs skills/chaine/sujet/scripts/sujet.test.mjs skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs; do printf '%s ' "$f"; node --test --test-reporter=tap "$f" 2>&1 | grep -E '^# (tests|pass|fail) ' | tr '\n' ' '; echo; done)
git worktree remove --force "$S/rouge"
```

Treize fichiers posés, jamais dans la branche de la session. Les comptes attendus : « Vérification », point 1.

### § 2 — Le patch, la version et la note, dans la branche

```bash
git apply -3 "$S/lot-5.patch"; git diff --name-only --diff-filter=U
git checkout HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/note-et-version.mjs" "$S/lot-5.patch"
git add -A && git diff --cached --stat origin/main | tail -n 1
```

`git apply -3` sort en 1 et ne laisse en conflit que `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sur le `main` attendu (essayé : PR A, PR B, puis ce patch, sur `25a72c7`), en 0 sur `25a72c7`. Tout autre fichier en conflit : s'arrêter. Ces deux fichiers ne se résolvent jamais à la main : le conflit de la note se coupe en deux blocs, dont le second tombe dans la note de la PR A. `git checkout HEAD --` les remet tels que `main`, et `note-et-version.mjs` pose la version suivante de `main` (le deuxième nombre plus un, le troisième à zéro : 7.38.2 donne **7.39.0**, 7.38.0 aussi) et, en tête de la note, le texte du patch à cette version et à la date du jour ; il écrit la version et la date. La dernière ligne : `28 files changed`. Ce que chaque fichier reçoit est dit au tableau « Où » et aux décisions ; le patch fait foi.

- **Si `decision-relecteur.mjs`, `verdict.mjs`, `meme-contenu.sh` ou `double-relecture.mjs` ont changé sur `main`** (la PR A change `decision-relecteur.mjs`) : le banc `verdict-du-capitaine.test.mjs` les joue tels quels et dit ce qui ne tient plus.
- **Si `main` bouge entre l'ouverture de la PR et sa fusion** : fusionner `origin/main` dans la branche par un commit de fusion (jamais de rebase ni de push forcé) ; si `plugin.json` ou `NOTES-DE-VERSION.md` sont en conflit, les prendre d'`origin/main` (`git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json`) et rejouer `note-et-version.mjs` ; puis « Vérification » à nouveau.

### § 3 — Vérifier, commiter, livrer

Un seul commit, son message égal au titre de la PR (avec la version prise) : `git commit -m "<titre>"`. Puis « Vérification », points 2 à 5, dans l'ordre (le point 1 est le § 1 ; les mutations copient la branche commitée par `git worktree`). Puis `git push -u origin HEAD`. La PR des trois tickets vers `main`, prête (pas en brouillon), sans étiquette, titre `feat(chaine): le capitaine juge par les verdicts, les gardes des fichiers sensibles, renvois et gate selon le régime (plugin <version>)` ; dans le corps, la sortie de la « Vérification » (comptes, mutations, suite entière). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire (deux tours sur la PR, `P-65`). La session rend au lanceur l'URL de la PR et la sortie de la « Vérification », puis s'arrête.

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
| Régime 7 : un contrat illisible qui ne nomme pas la clé est jugé comme sur `main` (renvoi en 4) | « régime 7, passer.sh » |
| `fusion-bloquée` posée pendant la CI d'une sous-PR : sautée en 7 au second contrôle | « `fusion-bloquée` posée pendant la CI » |
| develop et les sujets relus avant les calculs, clone à une branche compris (`A-126`) | « develop et les sujets sont relus avant les calculs » |
| Un calcul absent : panne (3), jamais un renvoi | « un calcul absent à côté de revue-exigee.mjs » |
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

Les comptes sont ceux du patch entier, mesurés ensemble (une seule PR) ; le ticket 73, § « Vérification », les donne tous, pour les deux chemins. Pour ce ticket :

1. **Rouge avant le code** (§ 1, l'arbre à part) : **26 rouges pour ce ticket** — `verdict-du-capitaine.test.mjs` 18 sur 19 (le cas « régime 7 » passe déjà : il fige le comportement de `main`, contrat illisible compris), `revue-exigee.test.mjs` 5 sur 37, `pr-titre.test.mjs` 2 sur 12 (le régime, le workflow), `faux-gh.test.mjs` 1 sur 17 sur `main` après les PR A et B (1 sur 16 sur `25a72c7`).
2. **Vert après.** Les mêmes, dans la branche : tous verts ; puis la suite entière (ticket 73, point 3).
3. **Mutations.** `node "$S/mutations.mjs" A` depuis la racine, la branche commitée : « toutes rouges » (série A, 34 mutations ; ticket 73, point 4).
4. `git diff --stat origin/main` : les 28 fichiers de « Où » des trois tickets, et eux seuls.

## Ce qui n'a pas été établi

1. **Les gestes réels** : une vraie PR en régime 8 sur un vrai GitHub (pagination réelle des commentaires, `created_at` réel, clone superficiel d'une session cloud) n'est jouée par aucun banc ; c'est l'essai de la partie 6c (« Vérification d'ensemble »).
2. **Un `refusé` tombé après le second contrôle et avant le `PUT`** (quelques secondes) n'est vu par personne : la fenêtre que `A-105` réduit, il ne la ferme pas.
3. **La résolution d'un conflit de pile par le capitaine** donne « différent » (`A-106`, limite écrite) : la PR repart en relecture. Non rejoué ici (la pile est renvoyée en régime 8).
4. **Le coût** : en régime 7 sans la clé, aucune lecture ni aucun fetch de plus ; avec la clé et une PR ouverte avant `depuis`, une lecture des commentaires de plus par passage ; en régime 8, deux lectures et deux jeux des calculs par PR fusionnée. Non mesuré.
5. **Un push reçu sur la tête entre la fin de la CI et le second contrôle de `passer.sh`** (« sommet changé », sortie 5) n'est joué par aucun banc : le faux GitHub ne sait pas faire tomber un push dans cette fenêtre (un push pendant la CI est déjà vu avant, « la PR a reçu un push pendant la CI »), et le `PUT …/merge` lié au sommet le refuserait de toute façon.

## Hors périmètre

- **Les gardes des fichiers sensibles** (lot 5b, ticket 72) et **les renvois, messages et gate selon le régime** (lot 5c, ticket 73), dans la même PR.
- **La clé `relecture` dans le gabarit `chaine.json`, les skills des rôles à deux régimes** (lot 6). `fusionner/SKILL.md` ne dit pas encore le régime 8 (partie 6b).
- **`boucle.sh`** : aucun changement (décision 7 ; question 2).

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur la spec (lot 5, partie a ; `A-91`, `A-97`, `A-105`, `A-107`, `A-108`, `A-113`, `A-126`) et sur `origin/main` à `25a72c7` (plugin 7.38.0). Code, bancs et mutations joués sur un clone neuf (« Vérification »). Points remontés à l'architecte : les deux « Questions à l'architecte ».
- 2026-11-21 — Retouché après le tour de relecture du ticket (`A-186` ; rapport `71-73-annexes/relecture-tour-1/rapport.md`), par le relecteur : décision 5 et coût en régime 7 sans lecture de plus, contrat illisible en régime 7 jugé comme sur `main` (décision 1), panne de l'outil en sortie 3 (décision 4), « Fichiers chauds », « À faire » récrit pour `main` après les PR A et B (`note-et-version.mjs`, bancs dans un arbre à part), trois bancs neufs (`fusion-bloquée` pendant la CI, `A-126`, panne) et les mutations A31 à A34. Joué sur les deux chemins (ticket 73, « Vérification »).
