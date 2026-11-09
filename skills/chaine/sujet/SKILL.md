---
name: sujet
description: Branche de sujet — un lot de PR liées vit sur `sujet/<nom>` dès sa première PR et entre dans develop en une PR, par un commit de merge. `demarrer` place une branche de travail sur le sujet de son ticket ; le capitaine fusionne les sous-PR étiquetées `à-fusionner`, tient le sujet à jour avec develop, repère et regroupe les séries ; `livrer` ouvre la PR finale. À utiliser au début de tout travail sur un ticket ou un lot (« démarre SOC-1.02 », « ouvre un sujet pour la démo », « regroupe les PR SOC-1 », « où en sont les sujets », « livre le sujet socle »). `poser` l'installe une fois dans le dépôt.
argument-hint: 'poser | demarrer <ticket|nom> | etat | series | regrouper <nom> <pr>… | livrer <nom> "<titre>" | ouvrir | fusionner | rafraichir | relancer'
---

# Branches de sujet

Un lot de PR liées vit sur `sujet/<nom>` **dès sa première PR**, et entre dans develop en **une** PR, par un commit de merge qui garde un commit par sous-PR. Il paie ainsi une passe de CI complète au lieu d'une par PR, et ses conflits internes se règlent dans le sujet, pas au passage du capitaine. Décision et raisons : l'ADR « branches de sujet » du dépôt, posée par `socle-chaine-de-production`.

## Étape 0 — poser (une fois par dépôt, `poser`)

`scripts/sujet.sh` → `scripts/chaine/sujet.sh` (exécutable), avec son banc d'essai `scripts/sujet.test.mjs`, `scripts/depot-jouet.mjs` et `scripts/faux-gh.mjs` → `scripts/chaine/` (les tests du capitaine s'en servent aussi). Il s'appuie sur `scripts/chaine/github.sh` et `revue-exigee.mjs`, posés par `fusionner poser` ; les deux skills se posent ensemble. Dépendances : `git`, `jq`, `gh` authentifié pour tout ce qui écrit sur GitHub (sans lui, le script affiche l'appel de l'outil GitHub MCP à faire). Tests : `node --test scripts/chaine/*.test.mjs` (le socle les joue dans `check:tickets`).

## Quand un sujet

- **Oui** : une spec découpée en plusieurs tickets ; une série du même chantier ; tout travail qui aurait donné une PR empilée sur une autre.
- **Non** : un correctif isolé, et surtout un correctif de démo ou de recette qui doit arriver seul. Il va directement vers develop, avec `prio:haute` s'il presse et `hors-sujet` si son ticket déclare un sujet.

Le sujet se **déclare au découpage** : `Sujet: sujet/<nom>` en tête de la spec (tous ses tickets) ou d'un ticket (`docs/agents/issue-tracker.md`). La PR de specs du lot vise le sujet dès son ouverture : `sujet.sh ouvrir <nom> --specs <pr>`. Sans ticket, la première session du lot choisit le nom et le transmet aux suivantes.

## Session de travail

1. **Réserver** le ticket : `docs/agents/issue-tracker.md` § « Réserver un ticket ».
2. **Avant le premier commit** : `bash scripts/chaine/sujet.sh demarrer <ticket|nom>`, qui place la branche sur le sujet du ticket et affiche `base=…` (`develop` : le ticket n'a pas de sujet). Ses refus (sortie 4) et leur raison sont dans l'en-tête de `sujet.sh` : spec pas encore sur la base, `Blocked by:` pas fait, branche partie d'une branche de specs. Cas vécu : douze PR en conflit au squash de leurs specs.
3. La PR vise la base affichée. Son titre suit Conventional Commits, car il deviendra un commit de develop, et tient en 120 caractères avec ` (#n)`. Label `à-fusionner` et PR jamais empilée : `CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine » ; la suite d'un travail repart du sujet.

## Capitaine (automatique)

`boucle.sh` du capitaine fusionne les sous-PR, recible, rafraîchit, livre et regroupe les sujets : règles et ordre dans l'en-tête de `scripts/chaine/boucle.sh`. En fin de boucle, le capitaine propose à l'utilisateur les séries restantes ; regrouper une série non déclarée se fait **sur son accord**.

## Commandes

Chaque commande, son effet et ses sorties : en-tête de `sujet.sh` ; `sujet.sh` sans argument affiche l'aide. Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours · 4 refus corrigeable par l'auteur · 7 sautée. `fusionner` a deux sorties de plus : 5, la sous-PR a bougé pendant sa mise à jour (reprise au tour suivant) ; 8, la sous-PR était en conflit avec son sujet **sur des index générés seuls** — le capitaine a fusionné le sujet dans sa branche (merge, avance rapide, jamais de force), régénéré les index, poussé : CI relancée, aucun squash, la boucle la laisse dans la file (`MISE À JOUR`). Un conflit hors index reste un renvoi (sortie 3).

## Livrer

Le capitaine livre lui-même un sujet « prêt à livrer » (`livrer-prets`) : plus de sous-PR ouverte **et** tickets déclarés tous faits, ou sujet né d'un regroupement (`sujet-auto`). À la main, pour livrer plus tôt ou un sujet `sujet-manuel` : `livrer <nom> "<type>(<scope>): <résumé du lot>"`. Un sujet « VIEUX » (plus de 5 jours) ou « EN RETARD » (plus de 20 commits de develop non fusionnés) se livre en l'état ou se découpe. S'il est renvoyé (conflit, CI rouge) : corriger sur le sujet, retirer `fusion-bloquée`, remettre `à-fusionner`.

## Branches fusionnées

Avec le réglage « Automatically delete head branches » du dépôt (liste de l'admin), GitHub supprime la branche d'une sous-PR fusionnée dans son sujet, puis recible de lui-même sur le sujet les PR empilées dessus. Les branches `sujet/*` ne sont pas protégées : le push forcé est refusé aux sessions par le hook `garde-commandes`, et la suppression automatique n'intervient qu'à la fusion de la PR finale.

## Ne jamais

- Rebaser ou pousser en force une branche de sujet.
- Fusionner une sous-PR dont un check exigé est rouge ou en cours.
- Regrouper une série non déclarée sans l'accord de l'utilisateur, ou mettre un correctif de démo dans un sujet.
