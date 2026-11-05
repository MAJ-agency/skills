# ARC-{{N}} — Les invariants métier se testent par propriétés, pas seulement par exemples

- Statut : **accepté**
- Date : {{DATE}}
- Portée : toute fonction pure qui porte un invariant chiffré — montants, heures, dates, arrondis, signatures, formats d'export

## Contexte

Un test par exemple ne voit que les cas qu'on a imaginés. Quand le même agent écrit le code et ses tests, les deux partagent le même angle mort. Or les invariants les plus coûteux s'énoncent comme des propriétés : la somme des parts égale le total au centime ; une date tombe dans au plus une catégorie ; une signature altérée ne se vérifie pas ; un export relu redonne ce qu'on a écrit.

Mesuré sur un premier projet, à la première passe de propriétés (52 propriétés sur 10 fichiers) : des frais de carte surfacturés d'un centime quand le quotient tombait sur un entier, sur 8 sous-totaux entre 0 et 100 000 € ; un export CSV qui ne neutralisait pas une formule selon le type de la valeur. Aucun exemple écrit à la main ne les montrait.

## Décision

1. **Toute fonction pure qui porte un invariant métier a un `*.property.spec.ts` à côté d'elle**, avec `fast-check` : calculs d'heures et de montants, limites et reports, arrondis, parts d'un tiers, signatures, contrôle de contenu de fichiers, exports.
2. **L'oracle est indépendant de l'implémentation** : entiers exacts pour l'argent, lecture inverse pour un format, aller-retour pour une signature. Un oracle qui appelle la fonction testée ne prouve rien.
3. **Une propriété rouge est un bug, pas une tolérance** : corriger le code, garder le contre-exemple minimal comme test d'exemple.
4. **Pour un agent, la propriété s'écrit avant la fonction** quand une fonction pure du domaine est créée : elle décrit le métier, pas l'implémentation.
5. **Budget** : `numRuns` de 100 à 500, moins de 5 s par fichier ; graine aléatoire, affichée en cas d'échec pour le rejouer.

## Alternatives écartées

- **Plus d'exemples à la main** — ne trouve pas les cas limites flottants : le centime de trop n'apparaissait sur aucun exemple écrit.
- **Graine fixe** — explore toujours les mêmes cas ; la graine d'un échec suffit à le rejouer.
- **Propriétés sur base réelle** — utiles pour les invariants d'isolation, mais lentes ; au cas par cas dans les `*.db.spec.ts`.

## Conséquences

Les invariants chiffrés sont éprouvés sur des milliers d'entrées à chaque passage, pour quelques secondes de tests en plus. Écrire un oracle indépendant demande plus de réflexion qu'un exemple : c'est le prix de la preuve. Une propriété instable (échec rare) est un bug à corriger, jamais une relance ni une tolérance sans ticket.

## Liens

- `.claude/rules/tests.md` § Propriétés — gabarit `docs/agents/gabarits/exemple.property.spec.ts`.
- ADR « score de mutation » — la force des tests, propriétés comprises.
