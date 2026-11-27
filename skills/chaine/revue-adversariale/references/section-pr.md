## Revue adversariale

- Sommet relu : `<sha court>` — <n> fichiers, <n> lignes (index générés exclus)
- `/security-review` : lancée (chemins : …) | non requise
- Résultat : <n> bloquants corrigés · <n> à corriger (<n> corrigés, <n> justifiés) · <n> doutes · <n> écartés
- Agent des relecteurs : maj-skills:axe-de-relecture | agent générique, maj-skills:axe-de-relecture introuvable dans cette session (repli)

| Constat (fichier:ligne — écart) | Règle | Gravité | Suite |
| ------------------------------- | ----- | ------- | ----- |

**Doutes et réponses.** …

**Pour le relecteur humain.** Trois lignes : ce que le diff change, où se trouve le risque, ce qu'il faut regarder en premier.

La ligne `/security-review` est lue par le capitaine : `lancée` seulement si la skill a tourné sur ce sommet. Sur une PR qui touche un chemin sensible, une section sans « `/security-review` : lancée » (ou avec « non requise ») est renvoyée.
