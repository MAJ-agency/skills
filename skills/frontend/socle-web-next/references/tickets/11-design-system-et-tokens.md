# Poser le design system : tokens, primitives, thème

Status: needs-info
Type: grilling

Le client embarque un seul jeu de tokens (`app/globals.css`, `@theme`) et une primitive (`components/ui/button.tsx`) pour montrer la forme. Rien n'est décidé sur l'identité visuelle, la typographie, la grille, le mode sombre ni le thème par tenant.

## Questions à trancher

- **Marque** : palette, typographie, rayons, ombres — d'où viennent-elles (charte existante, Figma, à créer) ?
- **Thème à l'exécution** : un seul thème, ou une surcharge par tenant / par utilisateur (mode sombre) ? Les tokens sont déjà des variables CSS, la mécanique est prête, la décision ne l'est pas.
- **Primitives** : lesquelles importer de shadcn/ui en premier (dialog, table, select, form) ? Chacune est vendored dans `components/ui/`, jamais installée comme bibliothèque.
- **Accessibilité** : quel niveau (RGAA, WCAG AA) est une obligation dans ce contexte ? Il conditionne le seuil du gate axe (`serious`/`critical` par défaut).

## Sortie attendue

Une ADR `DES-0001` (trigramme `DES`, réservé au registre) qui fixe les tokens, la stratégie de thème et le niveau d'accessibilité — puis `app/globals.css` mis à jour, et `docs/design/` créé avec son premier document.

## Comments
