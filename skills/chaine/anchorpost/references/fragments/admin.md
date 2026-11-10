## Anchorpost

La CLI `@maj-agency/anchorpost` est un paquet privé sur GitHub Packages. Il faut une clé pour le télécharger, partout où `pnpm install` tourne. **Jamais une valeur de clé dans le dépôt.**

- [ ] **Accès du dépôt au paquet** : sur la page du paquet `anchorpost` de l'organisation MAJ-agency (Packages → anchorpost → Package settings → Manage Actions access), ajouter ce dépôt en lecture. La CI utilise alors `GITHUB_TOKEN` (`NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` dans le job de qualité).
- [ ] **Sur un poste** : un jeton personnel à grain fin avec `read:packages`, exporté en `NODE_AUTH_TOKEN` dans le shell (jamais dans `.npmrc` du dépôt, qui ne porte que `${NODE_AUTH_TOKEN}`).
- [ ] **Dans l'environnement cloud de Claude Code** : une network secret pour l'hôte `npm.pkg.github.com` (en-tête `Authorization: Bearer`, le jeton), et la variable d'environnement `NODE_AUTH_TOKEN=proxy` : le proxy remplace la valeur factice.
- [ ] **Sur la plateforme de déploiement** (Scalingo) : si le build installe les dépendances de développement, la variable `NODE_AUTH_TOKEN` avec le jeton d'un compte machine `read:packages` ; sinon, un build qui n'installe que la production (`pnpm install --prod`) et la CLI n'y est pas nécessaire.
- [ ] **Créer l'espace dans Anchorpost** : une fois `anchorpost/anchorpost.json` poussé sur la branche suivie, un admin d'Anchorpost crée l'espace en reliant ce dépôt, la branche et le contexte ; les membres sont invités par courriel.

Vérification : `pnpm anchorpost:check` vert sur un poste, et le job de qualité vert en CI.
