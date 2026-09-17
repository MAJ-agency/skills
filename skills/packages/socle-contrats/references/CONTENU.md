# Ce que contient le socle contrats, et pourquoi

## Règles — `packages/CLAUDE.md`

En anglais, pour rester diffable avec les règles des services. Cinq blocs : ce qui vit dans `packages/` et rien d'autre ; **une seule grammaire de validation**, Zod, déclarée une fois et consommée par l'API (`createZodDto`), les formulaires (`zodResolver`) et le document OpenAPI ; les **univers de types étanches** (un client n'importe que `contracts`, jamais une ligne de base ni un modèle de domaine) ; **zéro framework, plat** (aucune dépendance entre paquets) ; la consommation **par les sources**, sans `dist/`.

La règle qui fait la différence avec un dépôt qui sépare « types » et « validators » : **les formes de réponse sont des schémas Zod**, donc le type client, la sérialisation API et le document OpenAPI dérivent du même objet. Il n'y a rien à tenir à la main, donc rien qui dérive.

## Squelette — `squelette/contracts/`

- **`package.json`** — `main: ./src/index.ts` : les sources sont exposées directement, aucun build, aucune dépendance `^build` pour les consommateurs. `zod` en seule dépendance. `vitest run --passWithNoTests` : les schémas sont déclaratifs, un test n'apparaît qu'avec un `refine`.
- **`eslint.rules.mjs`** — chargé par l'ESLint racine : interdit tout import de framework (`react`, `@nestjs/*`, `kysely`, `next`, `expo`…) et tout import d'un autre paquet `@{{SCOPE}}/*`. C'est ce qui garantit qu'un contrat tourne côté Node comme côté client.
- **`src/index.ts`** — le barrel, avec `ErreurDto` : le corps d'erreur commun, déclaré une fois, exposé une fois en réponse `4XX` globale du document OpenAPI de l'API.

## Squelette — `squelette/utils/`

Le même paquet, sans Zod, avec Vitest configuré : **posé seulement à la première fonction partagée**. Sa garde de lint interdit aussi `zod` : un utilitaire est une fonction pure, pas un contrat.

## Fragments — `fragments/`

Ce que le paquet ajoute aux fichiers génériques de la racine : la ligne `packages/CLAUDE.md` dans la carte d'orientation de `CLAUDE.md`, la sous-arborescence `packages/` et la règle dans `README.md`.
