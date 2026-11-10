# Ce que contient le skill fusionner, et pourquoi

## `scripts/github.sh`

La bibliothèque commune, sourcée par les autres scripts : `DEPOT`, `ID_SPEC` (la convention `tickets`), les index générés lus dans `scripts/docs/index-generes.json` avec leurs commandes et leurs contrôles (`index_generes`, `index_commandes`, `index_verifications`, `regenerer_index`, `ajouter_index`) : `regenerer_index` joue les `verification` après toutes les régénérations, et un contrôle en échec fait échouer la mise à jour du sujet (`sujet.sh rafraichir`), la boucle et `passer.sh` (sortie 3), au lieu de laisser partir un index régénéré contre un état faux (des types lus sur une base sans les migrations du sujet, cas vécu) ; une PR en JSON, son sommet, les checks d'un commit (un par nom, le plus récent : deux exécutions d'un même workflow laissent deux checks du même nom), les checks exigés lus dans la protection de develop, les labels, les commentaires. Tout en REST.

## `scripts/file.sh`

La file : les PR `à-fusionner` dans l'ordre de passage, sous-PR de sujet, livraisons de sujet, `prio:haute`, puis numéro, chacune avec son état. « Sans CI » veut dire aucun check exigé posé : un check d'une appli tierce ne prouve pas que la CI a démarré.

## `scripts/passer.sh`

Fait passer une PR : éligibilité (label, brouillon, titre de 120 caractères, section de revue, pile, ordre des migrations), mise à jour par merge de develop (conflit de pile résolu comme un rebase, index régénérés, tout autre conflit renvoyé), push en avance rapide, attente des checks exigés, squash lié au sommet testé ou commit de merge pour un sujet, vérification que l'arbre fusionné est l'arbre testé. Sept codes de sortie, chacun avec sa suite. Il tourne depuis une copie, car il change de branche.

## `scripts/boucle.sh`

La boucle : rouges relancés une fois puis renvoyés, séries regroupées, sous-PR squashées dans leur sujet, reciblages, sujets rafraîchis quand ils sont au repos et livrés quand ils sont finis, puis la file vers develop, PR par PR. Une sous-PR en conflit avec son sujet sur des index générés seuls est mise à jour par `sujet.sh fusionner` (sortie 8, `MISE À JOUR`), pas renvoyée : deux sous-PR qui régénèrent le même `openapi.json` tombaient l'une après l'autre en conflit (cas vécu). Elle s'arrête sur ce qu'elle ne sait pas traiter.

Elle ne joue jamais les scripts du worktree ni une copie faite à son lancement : à chaque tour, `git fetch origin develop`, puis `scripts/chaine` d'`origin/develop` extrait dans un dossier voisin de `<git-common-dir>/boucle-outils` et échangé d'un coup (un bash qui lit encore l'ancien fichier le garde) ; si `boucle.sh` a changé, `exec` sur la nouvelle version, les PR sautées passées par l'environnement. Cas vécu : des livraisons de sujet parties en double alors que le correctif de `sujet.sh` était déjà dans develop, la boucle jouant la copie faite à son lancement, et le capitaine recopiant à la main à chaque tour. Sans `origin/develop` après trois fetch : arrêt, sortie 6, jouer des scripts périmés est pire qu'attendre.

## `scripts/veille.sh`

La veille : `boucle.sh` s'arrête sur `FILE VIDE`, et une PR étiquetée ensuite n'était vue par personne (cas vécu : une file restée pleine jusqu'à ce qu'on prévienne le capitaine à la main). La veille lance la boucle, sonde `file.sh` toutes les 2 min et la relance dès qu'une PR devient prête ou rouge, ou qu'une PR mise de côté sans CI reçoit sa CI ; elle s'arrête d'elle-même sous la limite de 2 h d'une tâche de fond (`VEILLE FINIE`) ou avec la boucle (`VEILLE ARRÊTÉE`), ce qui réveille le capitaine.

## `scripts/renvoyer.sh`, `refus.sh`, `proprietaire.sh`

Le renvoi : labels échangés, cause commentée, worktree propriétaire retrouvé pour prévenir la session. `refus.sh` renvoie avec le dernier motif d'un refus corrigeable.

## `scripts/revue-exigee.mjs`

Le garde-fou de la revue adversariale : une PR qui touche `apps/`, `packages/` ou `scripts/` n'est éligible que si sa description porte un titre « Revue adversariale » hors bloc de code ; et une PR dont le titre annonce du code mais dont le diff ne contient que de la documentation est refusée (le label posé avant que le push n'aboutisse).

## `scripts/migrations-ordre.mjs`

L'ordre des migrations à l'arrivée dans develop : une migration ajoutée (présente dans la tête, absente de develop) a un horodatage strictement postérieur à la dernière migration de develop, sinon le migrateur, à ordre strict, refuserait la livraison. Cas vécu : un horodatage réservé au cadrage dépassé par des chantiers livrés avant le sien, et deux cartes sur le même horodatage. Règle pure (`controlerOrdre`) qui propose l'horodatage libre suivant, par pas de 10 minutes ; le dossier vient de `migrations` dans `.claude/chaine.json`, seuls les fichiers `<AAAAMMJJHHMM>-<slug>.ts` comptent. Appelé par `passer.sh` (sortie 4, renvoi avec le motif), `sujet.sh livrer` (sortie 4, aucune PR ouverte) et l'étape CI « Ordre des migrations » des PR vers develop ; une sous-PR vers un sujet n'est pas concernée. Les réservations des cartes, elles, sont vérifiées par `check:tickets` (skill `tickets`).

## Les tests

`fusionner.test.mjs` et `revue-exigee.test.mjs`, sur le dépôt jouet du skill `sujet` : ordre de la file, conflit d'index régénéré, conflit de code jamais résolu, pile dont la parente est squashée, checks exigés rouges ou non exigés, renvoi, titre trop long, boucle qui renvoie et saute. `github.test.mjs` : les contrôles de `regenerer_index` (ordre, dédoublonnage, échec qui annule `rafraichir`). `sujet-fusionner.test.mjs` : la sous-PR en conflit sur un index mise à jour (sortie 8), le conflit de code renvoyé, la boucle qui ne renvoie pas. `boucle-outils.test.mjs`, sur des scripts de remplacement publiés sur le develop du jouet : un script modifié sur develop pendant la boucle joué au tour suivant, `boucle.sh` modifié relancée une seule fois, la copie du worktree jamais jouée, `origin/develop` introuvable arrêtée sans rien jouer ; les autres suites de la boucle publient les vrais scripts par `publierChaine()`. `migrations-ordre.test.mjs` : la règle (horodatage, pas de 10 minutes qui passe l'heure, le jour et l'année, refus et horodatage proposé), la CLI, `passer.sh` qui refuse sans fusionner, `sujet.sh livrer` qui n'ouvre aucune PR. `veille.test.mjs`, avec des doublures de `boucle.sh` et `file.sh` : relance sur une PR prête ou rouge, pas sur « CI en cours », une seule relance pour une PR sautée, PR sans CI reprise, `VEILLE FINIE`, `VEILLE ARRÊTÉE`.
