# Le conducteur ne met plus le sujet à jour avec develop : c'est le geste du capitaine seul

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une phrase d'un skill remplacée par un texte donné mot pour mot, un test de dépôt, la version et sa note. Rien à concevoir.
Blocked by: — dans ce programme. Hors programme : `skills/chaine/chantier/SKILL.md` est un fichier chaud du programme « capitaine à jour et testé » (ses tickets 4 et 5) ; partir de `main` une fois leurs PR entrées, ou reprendre `main` avant de livrer.
Dépendances: —
Fichiers chauds: `skills/chaine/chantier/SKILL.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

## Le besoin

Ce ticket réalise la décision `A-69` de la carte `docs/issues/gouverner-nos-boucles/map.md` (2026-11-18).

**Le fait.** Le 2026-11-18, sur un projet, un sujet a reçu `develop` deux fois de suite, par deux sessions : le capitaine, dont c'est le geste, et le conducteur du chantier, qui suivait son skill. Rien n'a été perdu ce jour-là, mais deux sessions qui écrivent la même branche partagée finissent par se gêner (sortie 5 de l'une, tour perdu, ou index régénérés deux fois).

**La contradiction du plugin**, lue sur `origin/main` à `1c4acb1` (plugin 7.17.0 ; `chantier/SKILL.md` et `scripts/depot.test.mjs` y sont les mêmes qu'à `59b8233`) :

- `skills/chaine/chantier/SKILL.md:96` (§ 6, point 6) dit au conducteur : « Puis `bash scripts/chaine/sujet.sh rafraichir <nom>` : entre deux vagues aucune sous-PR n'est ouverte, c'est le moment de recevoir develop. »
- `skills/chaine/fusionner/scripts/boucle.sh` (`rafraichir_sujets`, appelée au début et à la fin de chaque lancement de la boucle, `boucle.sh:350` et `:403`) fait déjà ce geste pour tout sujet non livré qui n'a aucune sous-PR ouverte, avec `--abandon-si-conflit`, et écrit dans son journal `SUJET EN CONFLIT` (sortie 2) ou `SUJET NON MIS À JOUR` (sortie 3 et autres).
- Le fragment de `CLAUDE.md` posé chez les projets dit du capitaine qu'il « met à jour avec `develop` » et d'une session de travail : « ne jamais […] remettre la branche à jour avec `develop` ».

Le conducteur n'a donc rien à lancer : le capitaine reçoit `develop` de lui-même dès qu'aucune sous-PR n'est ouverte.

**Ce qui tient déjà** et que ce ticket ne change pas : `sujet.sh rafraichir` refuse en sortie 5 quand le sujet a bougé pendant sa mise à jour (`pousser` avec le sommet attendu, `skills/chaine/sujet/scripts/sujet.sh`, fonction `rafraichir`). La seconde moitié de `A-69` (« `rafraichir` refuse quand le sujet a bougé depuis sa lecture ») est donc déjà vraie sur `main` : aucun script n'est touché ici.

## Où

- `skills/chaine/chantier/SKILL.md`, § 6 « Suivi (à chaque réveil) », point 6 : la seule occurrence de `rafraichir` du fichier.
- `scripts/depot.test.mjs` : les tests qui exigent des phrases des skills (`exiger(…)`).
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

## Décisions

1. **Le conducteur ne lance jamais `sujet.sh rafraichir`** (`A-69`). Il ne fait que constater.
2. **Il constate par une lecture git, sans rien écrire** : `git merge-base --is-ancestor origin/develop origin/sujet/<nom>` après un `fetch`. Raison : c'est le test que `rafraichir` fait lui-même en tête, et il ne dépend d'aucun message du capitaine.
3. **Tant que le sujet est en retard, aucune vague ne part ; s'il le reste, il demande au capitaine, il ne devine pas.** `rafraichir_sujets` saute tout sujet qui a une sous-PR ouverte (`boucle.sh:254`) : lancer la vague figerait le retard. Le skill `fusionner` n'est pas touché par ce ticket (fichier chaud d'un autre programme) : c'est le conducteur qui pose la question, et la réponse du capitaine (`SUJET EN CONFLIT`, ou `SUJET NON MIS À JOUR (sortie 3)`) décide de la suite, inchangée : une session fille ouvre la PR de mise à jour.
4. **Version** : un correctif (troisième chiffre), sur la version de `main` au moment de livrer ; une note dans `NOTES-DE-VERSION.md` à la forme des précédentes.

## À faire, dans l'ordre

1. Dans `skills/chaine/chantier/SKILL.md`, point 6 du § 6, remplacer exactement le passage qui va de « Puis `bash scripts/chaine/sujet.sh rafraichir <nom>` » à « Le capitaine la fait entrer avant la vague suivante. » (bornes comprises) par :

   > Puis le sujet reçoit develop, **et ce n'est jamais le conducteur qui le fait** : le capitaine reporte develop dans chaque sujet de lui-même, au début et à la fin de chaque lancement de sa boucle, dès qu'aucune sous-PR du sujet n'est ouverte ; le conducteur ne lance jamais `sujet.sh rafraichir` (deux sessions ont fait ce geste en même temps sur un même sujet). Il constate seulement : `git fetch -q origin develop sujet/<nom>`, puis `git merge-base --is-ancestor origin/develop origin/sujet/<nom>`. Sortie 0, sujet à jour : il continue. Sortie 1, sujet en retard : aucune vague ne part (une sous-PR ouverte empêcherait le capitaine de recevoir develop), `send_later` à 45 min ; encore en retard au réveil suivant, il demande au capitaine pourquoi (`send_message`), sans rien lancer. Le capitaine répond `SUJET EN CONFLIT` (conflit de code avec develop) ou `SUJET NON MIS À JOUR (sortie 3)` (fusion refusée sans conflit par un hook, par exemple `pnpm check` rouge après la montée d'un formateur dans develop) : le conducteur lance alors une session fille pour ce geste, qui ouvre la PR de mise à jour du sujet, avec ses retouches (en-tête de `sujet.sh`) ; il ne résout jamais lui-même. Toute autre réponse (`PAS PROPRE`, sortie 5 ou 11) : rien à lancer, le capitaine corrige chez lui. Le capitaine la fait entrer avant la vague suivante.

   Le reste du point 6 (avant et après) ne change pas d'un caractère.
2. Dans `scripts/depot.test.mjs`, un test nouveau, à côté de ceux qui lisent `chantier/SKILL.md` : il exige la phrase « le conducteur ne lance jamais `sujet.sh rafraichir` » par `exiger`, et refuse que le fichier contienne la chaîne `bash scripts/chaine/sujet.sh rafraichir` (sans accent grave fermant : l'ancien texte continue par ` <nom>`) par `assert.ok(!texte.includes(…))`, comme le fait déjà le test de la ligne 658 ; il n'existe pas d'aide pour refuser un texte.
3. `.claude-plugin/plugin.json` : le correctif suivant de la version de `main` (7.17.1 si `main` est encore en 7.17.0 au moment de livrer). `NOTES-DE-VERSION.md` : la note, en haut. « Ce qui change » : le conducteur ne met plus le sujet à jour, le capitaine seul le fait. « Ce qu'un projet fait pour en profiter » : mettre à jour le plugin ; aucun script à reposer ; un conducteur déjà lancé garde son ancien skill jusqu'à sa relève, lui dire de ne plus lancer `rafraichir`.

## Surfaces

| Surface | Preuve |
| ------- | ------ |
| `chantier/SKILL.md` § 6 point 6 | le test nouveau de `scripts/depot.test.mjs` |
| version et note | les tests de version existants de `scripts/depot.test.mjs` |

## Vérification

1. La suite entière du dépôt, verte (commande du `README.md`).
2. Mutation : remettre l'ancienne phrase dans `chantier/SKILL.md` → le test nouveau rougit ; retirer la phrase nouvelle → il rougit aussi. Les deux mutations sont retirées avant de livrer.
3. `git diff origin/main -- skills/chaine/chantier/SKILL.md` : une seule ligne changée, le point 6.
4. `git grep -n "rafraichir" -- skills/chaine/chantier` : une seule occurrence, celle de l'interdit.

## Ce qui n'a pas été établi

- Le skill `fusionner` ne dit pas, sur `main`, que le capitaine prévient le conducteur d'un `SUJET EN CONFLIT` : il le voit dans son journal. D'où la Décision 3 (le conducteur demande). Si un ticket de l'autre programme l'écrit avant celui-ci, la phrase « il demande au capitaine » reste juste et ne se retire pas.

## Hors périmètre

- Tout script (`sujet.sh`, `boucle.sh`) : rien à y changer. Reliquat connu, laissé : le refus de `demarrer` (`sujet.sh:204`) conseille encore `sujet.sh rafraichir <nom>` à une session ; il vit dans un fichier chaud de l'autre programme.
- `fusionner/SKILL.md`, `sujet/SKILL.md` : la réception de develop y est documentée par le ticket 11 du programme « capitaine à jour et testé ».

## Comments

- 2026-11-18 — Relecture par un agent neuf : « prêt après retouches ». Portées : le trou du premier constat « en retard » (aucune vague ne part, réveil à 45 min, puis la question au capitaine ; les autres réponses du capitaine), « chaque lancement de la boucle » et non « chaque tour », la forme du test de refus, la base `1c4acb1` (7.17.0), le reliquat de `sujet.sh:204` en hors périmètre. Vérifié par le relecteur : les deux bornes existent une fois chacune, seule occurrence de `rafraichir` du fichier, aucune autre prose du plugin ne dit au conducteur de lancer `rafraichir`, tests de version en `depot.test.mjs:1032-1041`. Non vérifié : la suite n'a pas été jouée.
