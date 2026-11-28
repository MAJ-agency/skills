# Fusion par lots — conception

État : conçue ; `scripts/lot.sh` livre la partie qui n'écrit rien sur GitHub (composer, vérifier, couper en deux, lire `strict`). La fusion d'un lot et son branchement dans la boucle attendent les décisions du produit (« Questions au produit », plus bas).

## Le problème

Sur `develop`, la protection exige une PR à jour (`strict: true`). Chaque fusion remet toutes les autres PR en retard. Le capitaine les fait donc passer une à une : mise à jour avec develop, CI d'environ 14 minutes, fusion. Le débit plafonne à 4 PR par heure, quelle que soit la longueur de la file.

Un lot teste N PR en une seule CI : le débit est multiplié par N quand la CI du lot est verte.

## Le déroulé

1. **Composer** (`lot.sh composer --taille <N>`). La composition prend, dans l'ordre de la file (livraisons, `prio:haute`, puis numéro), jusqu'à N PR « prête » vers develop, c'est-à-dire avec la CI exigée verte sur leur sommet. Elle les empile sur `origin/develop` par des fusions successives, en objets git locaux seulement : `git merge-tree --write-tree`, puis `git commit-tree` d'un commit à deux parents, le lot jusque-là et le sommet de la PR. Aucun worktree n'est touché, et rien n'est poussé.

   Le manifeste porte la base, puis, pour chaque PR : son numéro, son sommet, le commit du lot après elle et son arbre.

   Ce qui reste hors du lot passe une à une, comme aujourd'hui :

   - les sous-PR et les livraisons de sujet ;
   - les PR de fourche, en brouillon, sans `à-fusionner` ou avec `fusion-bloquée` ;
   - les PR du régime 7 : leur section de revue ne se juge qu'au passage ;
   - toute PR que `passer.sh --eligibilite` refuse (verdict, gardes des sensibles, migrations, titre) ;
   - les PR sur un chemin sensible : elles passent seules, avec leur revue de sécurité ;
   - les PR sur le dossier `migrations` : l'ordre des migrations se juge une à la fois ;
   - les PR en passage chez un autre capitaine ;
   - les PR dont le sommet change pendant la composition ;
   - les PR en conflit avec le lot déjà empilé.

   **Aucun index généré n'est régénéré**. Le lot est la somme exacte de ses PR. Les squash successifs de la variante A la reproduisent quand chaque PR part de develop sans commit partagé avec une autre : la base de fusion est alors la même dans le lot et dans le squash. Les piles (base ≠ develop) restent hors du lot. Dans le cas contraire, l'arbre comparé après chaque squash le voit, sortie 12. Un index que la somme rend périmé fait rougir la CI du lot, et le lot se coupe en deux.

2. **Pousser et tester** *(à implémenter)*. Le sommet du lot est poussé sur `lot/<CAPITAINE_ID>-<AAAAMMJJ-HHMM>`, sous les hooks du projet. Cette branche n'est pas gardée, et elle appartient au capitaine. CircleCI teste toute branche poussée (ne jamais cocher « Only build pull requests »). L'attente reprend `attendre_ci` sur le sommet du lot, sans numéro de PR. Une CI rouge reçoit une relance CircleCI, une seule par sommet de lot (`relancer_circleci` de `boucle.sh`), avant toute bisection.

3. **Vérifier** (`lot.sh verifier <manifeste>`, juste avant toute fusion). Chaque PR doit être ouverte, porter `à-fusionner`, ne pas être bloquée et avoir le même sommet qu'à l'empilement. `origin/develop` doit être égal à la base. À la moindre différence, rien n'est fusionné et le lot se recompose. Avant chaque appel de fusion, le second contrôle du verdict de `passer.sh` (étape 5 ter, `revue_du_capitaine`) se joue sur la PR, comme au passage. Un verrou de passage (`prendre_passage`) est posé sur chaque PR du lot, du push jusqu'à la fin.

4. **Fusionner** *(à implémenter, selon la variante retenue)*.
   - **Variante A — un squash par PR.** Les PR sont fusionnées une à une, dans l'ordre. Chaque appel porte `sha` = le sommet du manifeste : GitHub refuse la fusion si le sommet a bougé, comme dans `passer.sh`. Après chaque squash, `git rev-parse origin/develop^{tree}` doit être égal à l'arbre du commit du lot après cette PR. Un écart arrête le lot en sortie 12, comme aujourd'hui (`signaler_arbre_different`). Sous `strict: true`, GitHub refuse la deuxième fusion (« Head branch is not up to date ») : cette variante exige de lever `strict`. Le capitaine ne s'en remet de toute façon pas à ce réglage, c'est la règle d'ascendance qui fait foi. Les états intermédiaires de develop, entre la première et la dernière fusion du lot, existent quelques secondes sans avoir été testés seuls. La règle d'ascendance devient alors « testée dans le lot qui la contient ».
   - **Variante B — le lot en un commit.** Une PR `lot/…` → develop est fusionnée par un commit de merge, avec `sha` = le sommet du lot. Develop passe de la base au sommet testé, et son arbre est exactement l'arbre testé. La règle d'ascendance tient telle quelle, et cette variante marche sous `strict: true`. Le lot est fait de merges des sommets des PR : chaque sommet devient un ancêtre de develop, et GitHub marque alors la PR fusionnée d'elle-même. Ce point est à vérifier sur un dépôt d'essai avant tout usage, car les piles et `sujet.sh` lisent `merged_at`. En contrepartie, develop reçoit les commits des PR tels quels, sans squash, sous un merge par lot, comme un sujet.

5. **Rouge : couper en deux** (`lot.sh moities <manifeste>`). Le lot se coupe dans l'ordre, la première moitié recevant la PR de plus. Elle se recompose (`composer --prs`) sur le develop du moment, puis se reteste. Si elle est verte, elle entre, et la seconde moitié se recompose sur le nouveau develop. Si elle est rouge, elle se recoupe. Une moitié d'une seule PR repasse une à une (`passer.sh`) : relance, puis renvoi comme aujourd'hui.

   Le coût, pour un lot de 4 :
   - tout vert : 1 CI pour 4 PR ;
   - une PR rouge : 3 à 4 CI ;
   - deux PR rouges : jusqu'à 6 CI.

   Une file aux PR souvent rouges a donc intérêt à des lots petits.

## Les garanties tenues

- **Aucune PR n'est fusionnée si son sommet a changé depuis l'empilement**. Trois contrôles le garantissent : `verifier` juste avant, `sha` dans chaque appel de fusion, et l'arbre comparé après chaque fusion.
- Le verdict est contrôlé deux fois, comme au passage : `--eligibilite` à la composition, puis la relecture juste avant la fusion.
- `prio:haute` passe en tête : c'est l'ordre de la file.
- Les PR à chemin sensible, les sous-PR et les livraisons de sujet passent une à une.
- Plusieurs capitaines : les PR en passage chez un autre capitaine restent hors du lot, et le verrou de passage est posé sur chaque PR du lot.

## Le branchement dans la boucle *(à implémenter)*

À chaque tour, quand le mode lot est actif et qu'au moins deux PR « prête » vers develop sont dans la file, la boucle compose un lot avant `passer`. Si la composition sort en 1, la boucle passe une à une, comme aujourd'hui. Un lot en cours se reprend au tour suivant par son manifeste, rangé dans `<git-common-dir>/boucle-lot`. La veille compte un lot comme un passage pour son échéance : la CI d'un lot est celle d'une PR.

## Questions au produit

1. **Taille de lot par défaut.** Proposition : 4. Une CI couvre alors 4 PR, et au-delà la probabilité d'un rouge, donc de bisection, monte vite. `lot.sh` n'a aujourd'hui aucun défaut : `--taille` est exigé.
2. **La protection `strict` de develop** (fedora : ancienne protection, `strict: true`). Faut-il la garder, et donc retenir la variante B, ou la lever pour la variante A ?
3. **La forme de l'historique de develop.**
   - Variante A : un squash par PR, comme aujourd'hui.
   - Variante B : les commits des PR sous un merge par lot, comme un sujet.
4. **La règle d'ascendance amendée**, en variante A seulement : « testée dans le lot qui la contient ».
5. **L'activation du mode lot.**
   - Une clé du contrat `.claude/chaine.json`, lue sur develop (proposition : `lots: { "taille": 4 }`).
   - Ou une variable de la session du capitaine.
6. **Relance CircleCI sans `CIRCLECI_TOKEN`.** Faut-il laisser la PR rouge dans la file (le comportement retenu, que la ligne du journal dit à chaque tour) ou la renvoyer sans relance ?
