# Ce que contient le skill sujet, et pourquoi

## `scripts/sujet.sh`

Une commande par geste : `demarrer`, `ouvrir`, `fusionner`, `rafraichir`, `livrer`, `livrer-prets`, `relancer`, `series`, `regrouper`, `regrouper-series`, `carte`, `carte <nom>`, `etat`, `de`. Chaque refus a un code de sortie et un motif, nés d'un incident : une branche partie d'une branche de specs non fusionnée, une dépendance fusionnée localement, un titre refusé par commitlint après quatorze minutes de CI, un sujet livré alors qu'un ticket n'avait pas commencé, un merge-base faux sur un clone superficiel, une migration de sujet plus ancienne que la dernière de develop (`livrer`, par `migrations-ordre.mjs` du skill `fusionner`, cherché à côté de `sujet.sh` puis dans `../../fusionner/scripts/`). Tout GitHub en REST (`gh api`) : GraphQL est refusé depuis les sessions cloud.

`carte <nom>` est le seul geste d'écriture d'une session sur un sujet, car le hook d'agent refuse tout `git push` vers `sujet/…` : sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. La commande ne laisse passer que des mises à jour en place de la carte qui déclare déjà ce sujet (statut `M`, mode 100644, un seul fichier par commit, ligne `Sujet:` exacte avant et après, Prettier passé) et pousse le sommet qu'elle a vérifié, sans force ; tout le reste sort en 9. Cas vécu : un commit pouvait créer sur le sujet une seconde carte que `phase_carte` aurait lue la première, ou réécrire la carte d'un autre sujet pour citer celui-ci.

Ce qui vient du projet : l'identifiant de ticket (`SPEC_ALL_SOC-1.03` dans un titre de PR ou un nom de fichier, `spec-all-soc-1-03` dans une branche), lu par `identifiant.mjs` du skill `fusionner`, qui importe la grammaire de `scripts/docs/identifiants.mjs` (skill `socle-monorepo`) : `sujet.sh` n'écrit plus la grammaire (type, contexte, trigramme), il ne fait que retirer l'index `.NN` d'un identifiant déjà lu et chercher un fichier par son identifiant littéral, les index générés et leurs commandes (`scripts/docs/index-generes.json`), la branche d'intégration `develop`.

## `scripts/depot-jouet.mjs`, `scripts/faux-gh.mjs`

Le banc d'essai partagé avec `fusionner` : un `origin` nu local, un clone de travail, et en tête de PATH un faux `gh` qui répond à `gh api` depuis un état JSON et fusionne pour de vrai dans le dépôt nu, un faux `pnpm` et un `sleep` immédiat. Aucun réseau.

## `scripts/sujet.test.mjs`

Les garde-fous de `demarrer`, `ouvrir` sans protection, le regroupement des séries et des piles, la livraison automatique, avec le contexte `ALL` et un autre ; l'ancienne forme (`SOC-1.01`) n'est plus lue. Un sujet sans carte est reconnu livré sur le commit de merge que `passer.sh` écrit vraiment, une fois sa branche supprimée, jamais sur un message forgé pour le test ; `sujet/demo` ne reconnaît pas `sujet/demo-2`.

## `scripts/sujet-carte.test.mjs`

`carte <nom>` sur le dépôt jouet : la poussée des commits de carte, l'avance rapide d'une branche en retard, et chaque refus en sortie 9 sans rien pousser (autre fichier, création, suppression, renommage, mode, carte d'un autre sujet, ligne `Sujet:` inexacte, fusion, divergence, Prettier, option de force, nom vide, sujet absent). Le « Prettier » est un faux `pnpm` du jouet.
