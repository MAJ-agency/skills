## Anchorpost

La CLI `@maj-agency/anchorpost` est un paquet public sur npmjs.com : `pnpm install` l'installe partout, sans clé (poste, CI, environnement cloud, plateforme de déploiement). **Jamais une valeur de clé dans le dépôt.**

- [ ] **Créer l'espace dans Anchorpost** : une fois `anchorpost/anchorpost.json` poussé sur la branche suivie, un admin d'Anchorpost crée l'espace en reliant ce dépôt, la branche et le contexte ; les membres sont invités par courriel.
- [ ] **Un dépôt qui installait la CLI depuis GitHub Packages** : retirer de `.npmrc` les lignes `@maj-agency:registry=…` et `//npm.pkg.github.com/:_authToken=…`, puis supprimer les jetons `read:packages` devenus inutiles (network secret de l'environnement cloud, variable `NODE_AUTH_TOKEN` de la CI et de la plateforme de déploiement).
- [ ] **Le passage à `enforce`** de la preuve suffisante est une décision du produit : la personne écrit `"sufficiency": "enforce"` dans le manifeste, par une PR.

Vérification : `pnpm anchorpost:check` vert sur un poste, et le job de qualité vert en CI.
