# ADR_ALL_ARC-{{N}} — L'index Anchorpost est commis dans le dépôt, généré et vérifié par la CLI, lu sans calcul

- Statut : **accepté**
- Date : {{DATE}}
- Décideurs : {{qui a tranché}}
- Portée : `anchorpost/`, les gates

## Contexte

Ce projet est lu par Anchorpost, qui montre à la MOA ses règles métier, leurs preuves, ses défauts et ses demandes. Ces informations vivent dans la documentation du dépôt, au standard du socle (`ADR_ALL_ARC-1`, le registre un fichier par règle). Trois façons de les faire lire étaient possibles : Anchorpost analyse le dépôt lui-même ; Anchorpost calcule un index côté serveur à chaque push ; le dépôt génère et commet un index qu'Anchorpost lit tel quel. Et le code qui génère cet index pouvait être copié dans chaque dépôt, comme les scripts du socle, ou vivre dans un paquet.

## Décision

**Le dépôt génère et commet `anchorpost/anchorpost.json`**, l'index au schéma pivot, produit par la CLI `@maj-agency/anchorpost`, régénéré par qui pousse et par le capitaine à la fusion, vérifié par le gate `anchorpost check` dans `pnpm check`. **Anchorpost le lit par GitHub** sur la branche de l'espace, le valide à nouveau et ne calcule rien depuis les sources.

**La CLI est un paquet npm public** sur npmjs.com, installé en devDependency, sans jeton (Anchorpost `ADR_ALL_ARC-16`). **Elle est hors ligne** : elle lit et écrit dans le dépôt, ne parle jamais au service, n'a aucune authentification propre. Ce qu'elle produit n'entre dans la branche de base que par le circuit normal du dépôt.

**Le manifeste `anchorpost/manifest.json` est écrit à la main**, jamais généré : nom, pitch, contextes, chemins hors convention, planchers, documents à rendre, table nom → rôle.

## Alternatives écartées

- **Anchorpost analyse le dépôt** — chaque retouche de la forme d'un projet casse l'application ; le contrat est implicite et invérifiable côté projet.
- **Calcul côté serveur sans fichier commis** — rien dans le dépôt pour les agents (la revue de ticket veut savoir quelles règles ont une preuve), pas de retour local avant le push, Anchorpost dans le chemin critique de la CI.
- **Scripts copiés par le skill** — un analyseur et un validateur de schéma qui évoluent, copiés dans chaque dépôt, divergent au premier correctif.
- **Paquet privé sur GitHub Packages** — un jeton de lecture partout où `pnpm install` tourne, et un point de panne à chaque expiration ; le paquet ne porte ni règle ni donnée d'un projet.
- **Une CLI connectée au service** — une authentification de plus, et un canal d'écriture qui contournerait le dépôt comme seule source de vérité.
- **Un README du registre généré pour la lecture humaine** — l'index est l'annuaire, Anchorpost la lecture ; un second artefact généré double l'information.

## Conséquences

**Positives.** Le dépôt reste lisible sans Anchorpost. Le contrat est un schéma versionné, vérifié des deux côtés. Les agents lisent le même index que la MOA. La liste de ce que `check` refuse est une version du paquet, pas un patch par dépôt.

**Coûts.** Un fichier généré de plusieurs mégaoctets dans un gros projet (il est déjà hors du diff de revue et régénéré par le capitaine). Un changement non compatible du schéma est une version majeure du paquet.

**Risques et parades.**

| Risque                                      | Parade                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Index périmé poussé avec une vieille CLI    | `anchorpost check` en CI, et la même validation rejouée par Anchorpost avant affichage   |
| Un agent écrit l'index à la main            | `index-generes.json` : le hook refuse l'édition, le gate compare à la génération          |
| Le plancher baisse sans que personne le voie | Le gate refuse un compte de règles prouvées sous le plancher du contexte                 |

## Liens

- `ADR_ALL_ARC-1` — les identifiants ; `ADR_ALL_ARC-<N>` — le registre, un fichier par règle
- `.claude/rules/anchorpost.md` — la fiche d'écriture ; `docs/agents/admin.md` — la recette de la clé
- Anchorpost : `ANC-2` (le schéma pivot), `ARC-11`, `ARC-13` du dépôt `MAJ-agency/anchorpost`, cités sous la forme que ce dépôt leur donne tant qu'il n'a pas migré vers le standard
