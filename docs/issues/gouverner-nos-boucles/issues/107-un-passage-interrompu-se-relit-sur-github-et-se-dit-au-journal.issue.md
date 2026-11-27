# Un passage interrompu se relit sur GitHub et se dit au journal : une fusion n'est plus perdue avec la machine du capitaine

Status: needs-triage
Type: défaut
Modèle: sonnet — un témoin de fichier posé et retiré par le verrou du passage de `github.sh`, une lecture au démarrage de `boucle.sh`, deux phrases du skill et leurs bancs ; la forme et l'ordre sont fixés par la décision `A-245`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 106
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh` (en-tête du verrou, 652-676 ; `prendre_passage` 744-779 ; `finir_passage` 803-833) ; `skills/chaine/fusionner/scripts/boucle.sh` (en-tête 69-90 ; après `rafraichir_outils "$@"`, 274, avant `rafraichir_sujets`, 574) ; `skills/chaine/fusionner/SKILL.md` (« Réveil de garde », 97-102 ; le `Monitor`, 104 ; « Plusieurs capitaines », 138) et `references/CONTENU.md` (32) ; `skills/chaine/fusionner/scripts/github.test.mjs` (après 540) et `boucle-outils.test.mjs` (après 314) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 105 et 106, en dernier** : 105 touche `boucle.sh` (`traiter_rouges`, `traiter_sujets`) et `SKILL.md:27-29`, `:88` ; 106 touche `github.sh` après `:464` et `SKILL.md:104`, `:112-119` ; d'où `Blocked by: 106`. Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 106 : relire chaque ligne citée sur la branche.

## Le besoin

Constat (14 bis) de l'essai réel du régime 8 (journal de la carte, 2026-11-24, 01 h 25 UTC ; entrée « Fin de l'essai réel du régime 8 », cas 14). La livraison #16 du jouet est entrée dans `develop` à 00:49:05, par la boucle du capitaine. Sa ligne `FUSIONNÉE` manque pourtant au journal du capitaine : son conteneur a redémarré. La fusion est sur GitHub ; la preuve du cas 14, qui se lisait au journal, est incomplète.

Le journal est écrit par les processus qui font le passage : `passer.sh` écrit `FUSIONNÉE` (`passer.sh:510`) après l'appel de fusion et la vérification de l'arbre, la boucle et la veille le recopient. Un redémarrage tue tous ces processus d'un coup (`KILL`) : une fusion faite juste avant ne laisse aucune ligne. Le commentaire de passage reste aussi sans « terminé », et tient la PR contre un autre capitaine pendant 90 minutes.

Le besoin : **ce qu'un passage interrompu a fait se relit sur GitHub, au démarrage suivant de la boucle, et se dit au journal** ; son commentaire de passage est terminé à ce moment-là.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/fusionner/scripts/passer.sh:510` : `log "FUSIONNÉE : …"`, écrit après la fusion ; `boucle.sh:514` écrit `[#n] FUSIONNÉE dans <sujet>` après `sujet.sh fusionner`. Les deux lignes passent par des tubes (`boucle.sh:567`, `tee "$sortie"` ; `veille.sh:265`, `tee "$journal_boucle"`) jusqu'au journal ouvert en ajout (`SKILL.md:83`).
2. `skills/chaine/fusionner/scripts/github.sh:670-674` (en-tête du verrou) : « Un passage tué par KILL laisse un verrou qui expire 90 minutes après sa dernière date comptée ». `finir_passage` (`:803-833`) n'est jouée que par la trappe EXIT de l'appelant, que `KILL` ne déclenche pas.
3. Aucune trace d'un passage en cours ne survit à ses processus : `PASSAGE_PR` et `PASSAGE_COMMENTAIRE` (`github.sh:677-682`) sont des variables du shell. `<git-common-dir>` survit au redémarrage (`veille.sh:63-64` y garde `veille.etat` pour cette raison ; `capitaine-boot-id`, `:37-38`).
4. Au démarrage, la boucle ne relit rien de ce qu'elle a fait avant : `boucle.sh:274` recopie les outils, `:574` rafraîchit les sujets, puis elle lit la file.

## Décisions

Décidée le 2026-11-27 par l'architecte : **`A-245`** (il la versera à la spec `relecture-independante.spec.md`). Ce qui suit l'applique ; rien n'y est à trancher.

1. **Le témoin** : `prendre_passage`, une fois le commentaire posé et son id lu (`github.sh:764`, `PASSAGE_COMMENTAIRE=$id`), écrit `<git-common-dir>/capitaine-passages/<n>`, une ligne : `<id du commentaire> <CAPITAINE_ID> <epoch>`. `finir_passage` le retire après avoir terminé le commentaire, et `retirer_passage` après l'avoir retiré. Un témoin par PR ; écriture par fichier temporaire puis `mv`, comme `capitaine-boot-id` (`veille.sh:247`).
2. **Au démarrage de la boucle** (après `rafraichir_outils`, `boucle.sh:274`, avant `rafraichir_sujets`, `:574`), pour chaque témoin, dans l'ordre des numéros : la PR est lue (`pr_json`).
   - Fusionnée (`merged_at` non nul) : `[#n] FUSIONNÉE (passage interrompu, relue sur GitHub au démarrage de la boucle) : <merge_commit_sha court> dans <base>`.
   - Non fusionnée : `[#n] passage interrompu (machine redémarrée ou boucle tuée) : rien n'est entré, la file la reprend`.
   - Illisible (`pr_json` en 5) : `[#n] passage interrompu : PR illisible (cause ci-dessus), relue au prochain démarrage` ; le témoin reste.
   Puis, si le `CAPITAINE_ID` du témoin est celui de la boucle, le commentaire est terminé (`finir_passage`, `PASSAGE_PR` et `PASSAGE_COMMENTAIRE` lus du témoin), et le témoin retiré. D'un autre `CAPITAINE_ID` : la ligne seule, le commentaire laissé (il expire comme aujourd'hui), le témoin retiré.
3. **Le verrou de la boucle d'abord** : la lecture se fait verrou `flock` pris (`boucle.sh:194`). Aucun passage de ce clone ne tourne alors : un témoin présent est toujours celui d'un passage mort.
4. **La ligne `FUSIONNÉE` relue** est filtrée par le même `Monitor` (`SKILL.md:104`, `FUSIONNÉE`) : rien à ajouter au filtre. Le « Réveil de garde » (`SKILL.md:97-102`) dit, au point 3, que la boucle relancée relit les passages interrompus et les dit au journal.
5. **Le texte** : `references/CONTENU.md:32`, la raison d'`A-245` (le cas de #16 ; la fusion vit sur GitHub, la ligne meurt avec le processus ; le verrou libéré tout de suite plutôt qu'à 90 minutes, quand le capitaine est le même).
6. **La version** : celle de la PR de 105 à 107 ; la note : rien à faire dans un projet hors la repose des scripts de la chaîne.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/github.sh:652-676` | l'en-tête du verrou : le témoin, et ce que la boucle en fait |
| `skills/chaine/fusionner/scripts/github.sh:744-779`, `:781-790`, `:803-833` | `prendre_passage` écrit le témoin ; `retirer_passage` et `finir_passage` le retirent (décision 1) |
| `skills/chaine/fusionner/scripts/boucle.sh:69-90`, entre `:274` et `:574` | l'en-tête ; la lecture des témoins (décisions 2 et 3) |
| `skills/chaine/fusionner/SKILL.md:97-102` | le point 3 du « Réveil de garde » (décision 4) |
| `skills/chaine/fusionner/references/CONTENU.md:32` | la raison (décision 5) |
| `skills/chaine/fusionner/scripts/github.test.mjs` | les tests du témoin, après `:540` |
| `skills/chaine/fusionner/scripts/boucle-outils.test.mjs` | les tests du démarrage, après `:314` (le `kill -9` d'une boucle en plein passage, modèle) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note |

Modèles à imiter : `github.test.mjs:540` (`prendre_passage` sur le faux GitHub, commentaires posés et lus) ; `boucle-outils.test.mjs:314` (« boucle morte (kill -9) ») ; `veille.sh:247` pour l'écriture du témoin.

## À faire, dans l'ordre

1. **Partir de la branche de la PR**, 106 commité : relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces »). Les voir rouges.
3. **Le témoin** dans `github.sh` (décision 1), puis **la lecture** dans `boucle.sh` (décisions 2 et 3).
4. **Les textes** (décisions 4 et 5). Les bancs verts.
5. Un commit ; la version de la PR, sa note complétée.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `prendre_passage` pris : le témoin existe, porte l'id du commentaire et le `CAPITAINE_ID` ; `finir_passage` : il n'existe plus ; PR tenue par un autre (sortie 1) ou relecture illisible (3) : aucun témoin ne reste | `github.test.mjs`, test neuf |
| boucle démarrée sur un témoin d'une PR fusionnée : la ligne `FUSIONNÉE (passage interrompu…)` avec le sha de fusion ; le commentaire de passage terminé (`<!-- capitaine:fin -->`) ; le témoin retiré | `boucle-outils.test.mjs`, test neuf |
| témoin d'une PR ouverte : la ligne « rien n'est entré », commentaire terminé, témoin retiré ; la PR passe ensuite dans le même lancement | test neuf |
| témoin d'un autre `CAPITAINE_ID` : la ligne, commentaire intact, témoin retiré | test neuf |
| PR illisible au démarrage : la ligne « illisible », le témoin reste | test neuf |
| de bout en bout : un passage tué par `kill -9` après l'appel de fusion (faux GitHub) puis une boucle relancée : la ligne `FUSIONNÉE` relue est au journal | test neuf |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `finir_passage` qui ne retire pas le témoin | le test du témoin |
| la lecture des témoins retirée de la boucle | le test de bout en bout |
| `merged_at` ignoré (toute PR dite non fusionnée) | le test de la PR fusionnée |
| le commentaire terminé quel que soit le `CAPITAINE_ID` | le test de l'autre capitaine |
| le témoin retiré quand la PR est illisible | le test de la PR illisible |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/fusionner/scripts/github.test.mjs skills/chaine/fusionner/scripts/boucle-outils.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass`, recopié dans la PR.

## Ce qui n'a pas été établi

- Le moment exact du redémarrage, avant ou après l'écriture de la ligne `FUSIONNÉE` dans un tube. Le journal de l'essai ne le dit pas. Le témoin couvre les deux cas : il ne disparaît qu'à la fin du passage.
- Qu'un recyclage complet de la machine (le clone perdu, `SKILL.md:99`, point 1 du « Réveil de garde ») laisse `<git-common-dir>` en place. Sans lui, le témoin est perdu aussi ; la fusion reste lisible sur GitHub, sans ligne au journal.

## Hors périmètre

- Un journal du capitaine tenu hors du conteneur (sur GitHub, dans un fichier poussé) : non retenu, la fusion elle-même est la preuve, lue sur GitHub.
- Le verrou d'un autre capitaine (inchangé : 90 minutes).
