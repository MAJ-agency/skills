# Décider s'il y a un client, puis la forme de l'authentification

Status: needs-info
Type: grilling

Le socle ne suppose **aucun client** : c'est une API dont la surface publiée est le document OpenAPI. Cette question doit être tranchée avant d'implémenter l'authentification, parce qu'elle en décide la forme.

## Les branches, et ce qu'elles changent

| Client | Forme d'authentification |
| --- | --- |
| **Navigateur** (SPA, PWA) | cookies `__Host-`, CSRF signed double-submit, CORS `credentials` — la recette décrite dans `apps/api/CLAUDE.md` § Invariants |
| **Application mobile** | jetons porteurs plutôt que cookies. Et le **versionnement du contrat devient critique** : un client mobile ne se met pas à jour de force, donc expand/contract sur le contrat lui-même |
| **Pass Apple / Google Wallet** | ni cookies ni CSRF : de la **signature de pass**. Le pass est récupéré par les serveurs d'Apple ou Google, pas par un navigateur |
| **Aucun** (API consommée par un autre service) | authentification service-à-service : clé, mTLS ou jeton signé. Pas de session |

## Attention

La recette d'authentification héritée dans `apps/api/CLAUDE.md` **suppose un navigateur**. Elle est *en attente*, pas *acquise* : ne pas l'implémenter avant d'avoir répondu à ce ticket, sous peine de construire une session par cookies pour un client qui n'en voudra pas.

Si la réponse est « navigateur », les règles front se reprennent **en bloc** (routage, état serveur, design system, conventions) plutôt qu'à la carte — et l'accessibilité devient un gate, obligation légale selon le contexte.

## Comments
