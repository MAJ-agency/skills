# Ce que contient le skill sujet, et pourquoi

## `scripts/sujet.sh`

Une commande par geste : `demarrer`, `ouvrir`, `fusionner`, `rafraichir`, `livrer`, `livrer-prets`, `relancer`, `series`, `regrouper`, `regrouper-series`, `carte`, `etat`, `de`. Chaque refus a un code de sortie et un motif, nés d'un incident : une branche partie d'une branche de specs non fusionnée, une dépendance fusionnée localement, un titre refusé par commitlint après quatorze minutes de CI, un sujet livré alors qu'un ticket n'avait pas commencé, un merge-base faux sur un clone superficiel. Tout GitHub en REST (`gh api`) : GraphQL est refusé depuis les sessions cloud.

Ce qui vient du projet : l'identifiant de ticket (`ID_SPEC` de `github.sh`, la convention `tickets`), les index générés et leurs commandes (`scripts/docs/index-generes.json`), la branche d'intégration `develop`.

## `scripts/depot-jouet.mjs`, `scripts/faux-gh.mjs`

Le banc d'essai partagé avec `fusionner` : un `origin` nu local, un clone de travail, et en tête de PATH un faux `gh` qui répond à `gh api` depuis un état JSON et fusionne pour de vrai dans le dépôt nu, un faux `pnpm` et un `sleep` immédiat. Aucun réseau.

## `scripts/sujet.test.mjs`

Les garde-fous de `demarrer`, `ouvrir` sans protection, le regroupement des séries et des piles, la livraison automatique, avec des préfixes à un et à deux segments.
