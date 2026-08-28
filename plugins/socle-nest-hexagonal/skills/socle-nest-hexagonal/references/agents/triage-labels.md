# Labels de triage

Les skills raisonnent en cinq **rôles canoniques**. Ce fichier fait la correspondance entre ces rôles et les chaînes réellement utilisées par le tracker de ce dépôt.

Le tracker étant en markdown sous `docs/features/` ([`issue-tracker.md`](issue-tracker.md)), un label est la valeur d'une ligne `Status:` en tête du fichier de ticket — pas une étiquette d'un service externe.

| Rôle dans mattpocock/skills | Chaîne dans notre tracker | Signification                                             |
| --------------------------- | ------------------------- | --------------------------------------------------------- |
| `needs-triage`              | `needs-triage`            | À évaluer par un humain                                   |
| `needs-info`                | `needs-info`              | En attente d'une information du demandeur                 |
| `ready-for-agent`           | `ready-for-agent`         | Entièrement spécifié, exécutable par un agent sans humain |
| `ready-for-human`           | `ready-for-human`         | Demande une implémentation humaine                        |
| `wontfix`                   | `wontfix`                 | Ne sera pas traité                                        |

Quand une skill mentionne un rôle (« applique le label AFK-ready »), utiliser la chaîne de la colonne du milieu.

Aucun renommage ici : le dépôt n'avait pas de vocabulaire de triage préexistant à respecter. La colonne du milieu est la seule à modifier si ça change un jour.

> **`ready-for-agent` n'est pas un statut qu'on pose par optimisme.** Il affirme qu'un agent peut exécuter le ticket **sans revenir poser de question** : périmètre clos, critères d'acceptation vérifiables, décisions déjà tranchées. Dans le doute, `needs-info`.
