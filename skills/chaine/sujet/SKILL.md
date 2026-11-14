---
name: sujet
description: Branche de sujet — un lot de PR liées vit sur `sujet/<nom>` dès sa première PR et entre dans develop en une PR, par un commit de merge. `demarrer` place une branche de travail sur le sujet de son ticket ; le capitaine fusionne les sous-PR étiquetées `à-fusionner`, tient le sujet à jour avec develop, repère et regroupe les séries ; `livrer` ouvre la PR finale. À utiliser au début de tout travail sur un ticket ou un lot (« démarre SPEC_ALL_SOC-1.02 », « ouvre un sujet pour la démo », « regroupe les PR SPEC_ALL_SOC-1 », « où en sont les sujets », « livre le sujet socle »). `poser` l'installe une fois dans le dépôt.
argument-hint: 'poser | demarrer <ticket|nom> | etat | series | regrouper <nom> <pr>… | livrer <nom> "<titre>" | carte <nom> | geler <nom> "<raison>" | degeler <nom> | gel <nom> | ouvrir | fusionner | rafraichir | relancer'
---

# Branches de sujet

Un lot de PR liées vit sur `sujet/<nom>` **dès sa première PR**, et entre dans develop en **une** PR, par un commit de merge qui garde un commit par sous-PR. Il paie ainsi une passe de CI complète au lieu d'une par PR, et ses conflits internes se règlent dans le sujet, pas au passage du capitaine. Décision et raisons : l'ADR « branches de sujet » du dépôt, posée par `socle-chaine-de-production`.

## Étape 0 — poser (une fois par dépôt, `poser`)

`scripts/sujet.sh` → `scripts/chaine/sujet.sh` (exécutable), avec son banc d'essai `scripts/sujet.test.mjs`, `scripts/sujet-carte.test.mjs`, `scripts/depot-jouet.mjs`, `scripts/environnement-des-bancs.test.mjs`, `scripts/faux-gh.mjs` et `scripts/faux-gh.test.mjs` → `scripts/chaine/` (les tests du capitaine s'en servent aussi). Il s'appuie sur `scripts/chaine/github.sh`, `identifiant.mjs` (qui lit les identifiants par `scripts/docs/identifiants.mjs`, posé par `tickets`) et `revue-exigee.mjs`, posés par `fusionner poser` ; les deux skills se posent ensemble. Dépendances : `git`, `jq`, `gh` authentifié pour tout ce qui écrit sur GitHub (sans lui, le script affiche l'appel de l'outil GitHub MCP à faire). Tests : `node --test scripts/chaine/*.test.mjs` (le socle les joue dans `check:tickets`).

## Quand un sujet

- **Oui** : une spec découpée en plusieurs tickets ; une série du même chantier ; tout travail qui aurait donné une PR empilée sur une autre.
- **Non** : un correctif isolé, et surtout un correctif de démo ou de recette qui doit arriver seul. Il va directement vers develop, avec `prio:haute` s'il presse et `hors-sujet` si son ticket déclare un sujet.

Le sujet se **déclare au découpage** : `Sujet: sujet/<nom>` en tête de la spec (tous ses tickets) ou d'un ticket (`docs/agents/issue-tracker.md`). La PR de specs du lot vise le sujet dès son ouverture : `sujet.sh ouvrir <nom> --specs <pr>`. Sans ticket, la première session du lot choisit le nom et le transmet aux suivantes.

## Session de travail

1. **Réserver** le ticket : `docs/agents/issue-tracker.md` § « Réserver un ticket ».
2. **Avant le premier commit** : `bash scripts/chaine/sujet.sh demarrer <ticket|nom>`, qui place la branche sur le sujet du ticket et affiche `base=…` (`develop` : le ticket n'a pas de sujet). Ses refus (sortie 4) et leur raison sont dans l'en-tête de `sujet.sh` : spec pas encore sur la base, `Blocked by:` pas fait, branche partie d'une branche de specs. Cas vécu : douze PR en conflit au squash de leurs specs. Une branche qui a déjà des commits partis de develop n'est ni rebasée ni poussée en force : `demarrer` la laisse intacte et affiche la suite qui reprend ses commits sur une branche neuve partie du sujet (`git switch --no-track -c`, `git cherry-pick --no-merges`, `git push -u`) ; la PR de l'ancienne branche se ferme en citant la nouvelle.
3. La PR vise la base affichée. Son titre suit Conventional Commits, car il deviendra un commit de develop, et tient en 120 caractères avec ` (#n)`. Label `à-fusionner` et PR jamais empilée : `CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine » ; la suite d'un travail repart du sujet.

## Capitaine (automatique)

`boucle.sh` du capitaine fusionne les sous-PR, recible, rafraîchit, livre et regroupe les sujets : règles et ordre dans l'en-tête de `scripts/chaine/boucle.sh`. En fin de boucle, le capitaine propose à l'utilisateur les séries restantes ; regrouper une série non déclarée se fait **sur son accord**.

## Commandes

Chaque commande, son effet et ses sorties : en-tête de `sujet.sh` ; `sujet.sh` sans argument affiche l'aide. Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours · 4 refus corrigeable par l'auteur · 6 arbre de travail pas propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR) · 7 sautée · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois. `fusionner` a deux sorties de plus : 5, la sous-PR a bougé pendant sa mise à jour (reprise au tour suivant) ; 8, la sous-PR était en conflit avec son sujet **sur des index générés seuls** — le capitaine a fusionné le sujet dans sa branche (merge, avance rapide, jamais de force), régénéré les index, poussé : CI relancée, aucun squash, la boucle la laisse dans la file (`MISE À JOUR`). Un conflit hors index reste un renvoi (sortie 3).

## Geler un chantier (`geler`, `degeler`, `gel`)

Le gel est une ligne `Gel:` de la fiche de la carte, lue sur `origin/sujet/<nom>` : non vide, le chantier est gelé, quelle qu'en soit la forme (le produit peut l'écrire à la main dans l'éditeur de GitHub, sans session ; le gate ne la refuse jamais). `sujet.sh geler <nom> "<raison>"` écrit `Gel: AAAA-MM-JJ — <raison>` et le pousse, sans toucher à la branche ni à l'arbre de travail de qui l'appelle ; `degeler <nom>` la vide ; `gel <nom>` la lit (sortie 0 si gelé). Un sujet sans carte sur sa branche ne se gèle pas (sortie 4). Effets : `demarrer` et `livrer` refusent (sortie 4, la ligne citée), `fusionner` sort en 7, `file.sh` montre « gelée » pour la sous-PR, la livraison et la PR à recibler, `etat` donne le verdict `gelé` (il prime sur les autres) et `livrer-prets` l'écarte. Le capitaine continue de rafraîchir le sujet. La procédure complète d'arrêt (interrompre les filles, supprimer les réveils) est dans le skill `chantier`.

## Pousser la carte du chantier (`carte <nom>`)

Un sujet ne se pousse jamais à la main : le hook `garde-commandes` refuse tout `git push` vers `sujet/…`, sous toutes ses formes, sans quoi une session écrirait elle-même sur le sujet la ligne `Dépendances:` qui l'autorise. Seule la carte du chantier (`*.map.md`) y avance hors PR, par `bash scripts/chaine/sujet.sh carte <nom>`, depuis un clone normal : commits locaux qui modifient chacun en place ce seul fichier, formaté par Prettier, dont la ligne `Sujet:` nomme exactement `sujet/<nom>` avant comme après. La commande rattrape le sujet par `git merge --ff-only`, vérifie chaque commit, puis pousse sans force le sommet vérifié. Elle refuse (sortie 9, rien n'est poussé) un autre fichier, une carte créée, supprimée, renommée ou changée de mode, la carte d'un autre sujet, une ligne `Sujet:` inexacte, un commit de fusion, un historique divergent, un fichier que Prettier changerait, une option ou un nom vide. `carte` sans argument liste toujours « ticket<TAB>sujet ».

## Livrer

Le capitaine livre lui-même un sujet « prêt à livrer » (`livrer-prets`) : plus de sous-PR ouverte **et** tickets déclarés tous faits, ou sujet né d'un regroupement (`sujet-auto`). À la main, pour livrer plus tôt ou un sujet `sujet-manuel` : `livrer <nom> "<type>(<scope>): <résumé du lot>"`. `livrer` refuse (sortie 4) un sujet qui ajoute une migration pas postérieure à la dernière de develop : le motif nomme le fichier à renommer et l'horodatage libre suivant (`migrations-ordre.mjs`, posé par `fusionner`). Un sujet « VIEUX » (plus de 5 jours) ou « EN RETARD » (plus de 20 commits de develop non fusionnés) se livre en l'état ou se découpe. S'il est renvoyé (conflit, CI rouge) : corriger sur le sujet, retirer `fusion-bloquée`, remettre `à-fusionner`.

## Branches fusionnées

Avec le réglage « Automatically delete head branches » du dépôt (liste de l'admin), GitHub supprime la branche d'une sous-PR fusionnée dans son sujet, puis recible de lui-même sur le sujet les PR empilées dessus. Les branches `sujet/*` ne sont pas protégées : le push forcé est refusé aux sessions par le hook `garde-commandes`, et la suppression automatique n'intervient qu'à la fusion de la PR finale.

## Ne jamais

- Rebaser une branche de sujet, pousser en force une branche, quelle qu'elle soit (la sienne comprise), ou pousser à la main sur un sujet : la carte passe par `sujet.sh carte <nom>`.
- Fusionner une sous-PR dont un check exigé est rouge ou en cours.
- Regrouper une série non déclarée sans l'accord de l'utilisateur, ou mettre un correctif de démo dans un sujet.
