# WEB-0001 — Rendu, routage et périmètre des tests du client web

- Statut : **accepté**
- Date : {{DATE}}
- Portée : `apps/web`

## Contexte

Un client web Next.js offre plusieurs façons de rendre une page (composant serveur, composant client, préchargement serveur puis hydratation) et plusieurs façons de la tester (rendu simulé, rendu réel). Ne pas choisir, c'est laisser chaque feature choisir, et obtenir trois styles dans le même dépôt.

## Décision

1. **Les routes sont minces, les features sont des feuilles.** `app/` ne contient que des fichiers de route ; chaque écran vit dans `features/<module>/` et n'importe jamais une autre feature. Le lint l'applique, avec un cliquet de dette vide.
2. **Les pages sont des composants client par défaut**, qui chargent leurs données via TanStack Query avec le cookie de session. Le préchargement serveur (`HydrationBoundary`) s'ajoute **page par page**, quand une page publique doit s'afficher pleine au premier rendu — jamais comme règle générale.
3. **Les tests unitaires s'arrêtent à la logique pure** (Vitest, environnement Node, `lib/` et `features/*/lib/`). Le rendu et les parcours sont testés **de bout en bout** par Playwright contre une vraie API, avec axe pour l'accessibilité. Ni Testing Library, ni Storybook, ni snapshot.

## Alternatives écartées

- **Composants serveur avec préchargement systématique** — documenté dans un dépôt voisin, jamais appliqué : un back-office derrière une session n'en tire rien, et la règle ignorée fait perdre toute crédibilité aux autres.
- **Tests de rendu avec un DOM simulé** (Testing Library) — un cinquième outil de test pour vérifier que React fonctionne, qui dérive du comportement réel (cookies, redirections). Le rendu est déjà couvré par les parcours de bout en bout.
- **Laisser chaque feature choisir** — trois styles, aucune règle.

## Conséquences

**Positives.** Un écran se déplace de route sans être touché. Une feature se supprime sans casser une autre. Un seul outil de test par niveau.

**Coûts.** Une page publique qui a besoin du premier rendu complet demande un geste explicite (préchargement par page). Un composant sans logique pure n'a pas de test unitaire : sa couverture est le parcours Playwright, qui exige une API qui tourne.

**Risque et parade.** Le cliquet de dette peut être contourné en ajoutant une entrée « pour faire passer un lot ». Parade : la liste est revue à chaque PR qui la touche, et `check:dette` refuse une entrée périmée.

## Liens

- Règles : `apps/web/CLAUDE.md` ; le pourquoi : `apps/web/docs/FRONTEND_GUIDELINES.md`
- Frontières : `apps/web/eslint.rules.mjs`, `apps/web/scripts/verify-dette-imports.mjs`
