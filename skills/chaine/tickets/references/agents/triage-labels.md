# Triage labels

Les skills parlent en termes de cinq rôles de triage canoniques. Ce fichier fait le lien entre ces rôles et les libellés utilisés dans ce dépôt.

Le tracker est en Markdown local : le « label » est la valeur de la ligne `Status:` en tête de chaque ticket `docs/features/<feature>/issues/<PRÉFIXE>-<n>-<nom>.<NN>.issue.md`.

| Label             | Signification                                     |
| ----------------- | ------------------------------------------------- |
| `needs-triage`    | Un mainteneur doit évaluer ce ticket              |
| `needs-info`      | En attente d'informations du demandeur            |
| `ready-for-agent` | Entièrement spécifié, prêt pour un agent autonome |
| `ready-for-human` | Nécessite une implémentation humaine              |
| `wontfix`         | Ne sera pas traité                                |

Deux états d'avancement s'ajoutent à ces rôles, portés par la même ligne :

| Valeur                 | Signification                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `en cours — <branche>` | Réservé par une session : branche poussée et PR brouillon ouverte (`docs/agents/issue-tracker.md`) |
| `Fait — PR #<n>`       | Livré par la PR `#<n>`                                                                             |

Un complément peut suivre le label après un tiret cadratin : `needs-info — question n° 2`, `wontfix — hors champ`. Le gate `node scripts/verify/tickets.mjs` refuse toute autre valeur.

Un ticket `ready-for-agent` sur develop peut déjà être pris : la ligne n'y arrive qu'à la fusion. Toujours lancer `node scripts/docs/ticket-libre.mjs <identifiant>` avant de commencer.

Quand un skill mentionne un rôle (ex. « appliquer le label prêt pour agent »), utiliser la valeur de la colonne « Label ».
