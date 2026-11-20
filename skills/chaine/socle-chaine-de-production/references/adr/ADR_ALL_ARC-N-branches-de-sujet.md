# ADR_ALL_ARC-{{N}} — Une série de PR liées vit sur une branche de sujet et entre dans `develop` en une seule PR, par un commit de merge

- Statut : **accepté**
- Date : {{DATE}}
- Portée : la fusion vers `develop`, la CI, les skills `sujet` et `fusionner`

## Contexte

`develop` exige une branche à jour avant fusion. Chaque fusion remet donc les autres PR en retard, et le capitaine les met à jour et attend leur CI une par une : mesuré sur un premier projet, treize minutes par PR avec les E2E, quatre à cinq PR par heure au mieux. Or une large part de la file est faite de **séries** : plusieurs tickets d'une même spec, qui touchent les mêmes contrats, seeds et migrations. Chacune paie sa passe de CI, et chaque fusion met la suivante en conflit, qui repart en renvoi vers sa session. Une PR empilée sur une autre n'a, elle, aucune CI tant qu'elle n'est pas reciblée.

## Décision

1. **Une série de PR liées vit sur une branche `sujet/<nom>`**, ouverte depuis `develop`, dès sa première PR. Le sujet se **déclare au découpage** : `Sujet: sujet/<nom>` en tête de la spec, ou d'un ticket. Avant son premier commit, une session lance `sujet.sh demarrer <ticket>` : sa branche part du sujet et sa PR le vise. **Une PR n'est jamais empilée sur une autre** : la suite d'un travail repart du sujet.
2. **Les sous-PR n'ont que la CI légère.** Le capitaine les squashe dans le sujet dès qu'elle est verte, sans E2E. Règle d'ascendance (skill `fusionner`) : une sous-PR en retard sur son sujet, documentation comprise, est d'abord mise à jour avec lui et retestée, jamais squashée telle quelle ; dans un sujet, le capitaine ne prend qu'une sous-PR étiquetée à la fois, celle qui tient déjà le sujet, sinon la plus ancienne (le plus petit numéro), et les autres attendent leur tour avec leur étiquette. Un correctif isolé qui doit arriver seul en recette reste une PR directe vers `develop`, avec `prio:haute` s'il presse et `hors-sujet` si son ticket déclare un sujet.
3. **Le capitaine tient le sujet.** Il fusionne `develop` dans le sujet quand aucune sous-PR n'est ouverte, jamais par rebase ; un conflit est annulé et signalé, jamais résolu par lui. Il recible sur son sujet une PR dont le ticket en déclare un, regroupe d'office les séries d'une même spec et les piles, et propose les autres.
4. **Le sujet entre dans `develop` en une PR**, livrée par le capitaine quand tous ses tickets sont faits, fusionnée par un **commit de merge** qui garde un commit par sous-PR : lisible et annulable une par une.

## Alternatives écartées

- **Fusionner sans branche à jour** — deux PR vertes séparément peuvent casser `develop` ensemble.
- **Un train du capitaine** qui assemble N PR indépendantes — échoue sur les séries, dont les PR entrent en conflit entre elles, et le capitaine n'a pas le droit de résoudre un conflit à la place d'une session.
- **La merge queue de GitHub** — Enterprise Cloud sur un dépôt privé.
- **Squasher le sujet** en un seul commit — on perd la lecture et l'annulation PR par PR.
- **Regrouper automatiquement toute série repérée** — une série de démo arriverait en recette plus tard que prévu ; le regroupement d'office reste réservé aux séries déclarées.

## Conséquences

Une passe de CI complète par série au lieu d'une par PR. Les conflits internes à une série se règlent dans le sujet. En échange : rien du sujet n'arrive en recette avant sa livraison, et la PR finale est volumineuse, à relire sous-PR par sous-PR. Les branches `sujet/*` ne sont pas protégées : le push forcé, et toute écriture d'une session (`git push`, `gh` en écriture), y sont refusés par le hook `garde-commandes`, l'écriture par un outil GitHub par le hook `garde-github`, et la suppression automatique des branches par GitHub n'intervient qu'à la fusion de la PR finale.

Mode d'emploi : skill `sujet` et son `sujet.sh` ; ordre de la file et regroupement : skill `fusionner`.
