# Ce que contient le skill fusionner, et pourquoi

## `scripts/github.sh`

La bibliothèque commune, sourcée par les autres scripts : `DEPOT`, `ID_SPEC` (la convention `tickets`), les index générés lus dans `scripts/docs/index-generes.json` avec leurs commandes (`index_generes`, `index_commandes`, `regenerer_index`, `ajouter_index`), une PR en JSON, son sommet, les checks d'un commit (un par nom, le plus récent : deux exécutions d'un même workflow laissent deux checks du même nom), les checks exigés lus dans la protection de develop, les labels, les commentaires. Tout en REST.

## `scripts/file.sh`

La file : les PR `à-fusionner` dans l'ordre de passage, sous-PR de sujet, livraisons de sujet, `prio:haute`, puis numéro, chacune avec son état. « Sans CI » veut dire aucun check exigé posé : un check d'une appli tierce ne prouve pas que la CI a démarré.

## `scripts/passer.sh`

Fait passer une PR : éligibilité (label, brouillon, titre de 120 caractères, section de revue, pile), mise à jour par merge de develop (conflit de pile résolu comme un rebase, index régénérés, tout autre conflit renvoyé), push en avance rapide, attente des checks exigés, squash lié au sommet testé ou commit de merge pour un sujet, vérification que l'arbre fusionné est l'arbre testé. Sept codes de sortie, chacun avec sa suite. Il tourne depuis une copie, car il change de branche.

## `scripts/boucle.sh`

La boucle : rouges relancés une fois puis renvoyés, séries regroupées, sous-PR squashées dans leur sujet, reciblages, sujets rafraîchis quand ils sont au repos et livrés quand ils sont finis, puis la file vers develop, PR par PR. Elle s'arrête sur ce qu'elle ne sait pas traiter.

## `scripts/renvoyer.sh`, `refus.sh`, `proprietaire.sh`

Le renvoi : labels échangés, cause commentée, worktree propriétaire retrouvé pour prévenir la session. `refus.sh` renvoie avec le dernier motif d'un refus corrigeable.

## `scripts/revue-exigee.mjs`

Le garde-fou de la revue adversariale : une PR qui touche `apps/`, `packages/` ou `scripts/` n'est éligible que si sa description porte un titre « Revue adversariale » hors bloc de code ; et une PR dont le titre annonce du code mais dont le diff ne contient que de la documentation est refusée (le label posé avant que le push n'aboutisse).

## Les tests

`fusionner.test.mjs` et `revue-exigee.test.mjs`, sur le dépôt jouet du skill `sujet` : ordre de la file, conflit d'index régénéré, conflit de code jamais résolu, pile dont la parente est squashée, checks exigés rouges ou non exigés, renvoi, titre trop long, boucle qui renvoie et saute.
