## Revue de ticket

- Ticket : `<ID>` — sommet relu : `<sha court>` — <n> fichiers, <n> lignes (index générés exclus)
- `/security-review` : lancée (chemins : …) | non requise
- Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités)
- Cas laissés à un autre ticket (`T3`, (d)) : cas `<règle>#<id>` porté par `<ticket>` | aucun
- Résultat : <n> bloquants corrigés · <n> à corriger (<n> corrigés, <n> justifiés) · <n> doutes · <n> écartés
- Agent des relecteurs : maj-skills:axe-de-relecture | agent générique, maj-skills:axe-de-relecture introuvable dans cette session (repli)

| Axe | Constat (fichier:ligne — écart) | Critère | Gravité | Suite |
| --- | ------------------------------- | ------- | ------- | ----- |
| Règles | … | S… / P… | … | … |
| Ticket | … | T… | … | … |
| Documentation | … | D… | … | … |

**Doutes et réponses.** …

**Pour le relecteur humain.** Trois lignes : ce que le diff change, où se trouve le risque, ce qu'il faut regarder en premier.

La ligne `/security-review` est lue par le capitaine : `lancée` seulement si la skill a tourné sur ce sommet. Sur une PR qui touche un chemin sensible, une section sans « `/security-review` : lancée » (ou avec « non requise ») est renvoyée.
