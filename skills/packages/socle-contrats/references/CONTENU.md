# Ce que contient le socle contrats, et pourquoi

## Règles — `packages/CLAUDE.md`

En anglais, pour rester diffable avec les règles des services. Cinq blocs : ce qui vit dans `packages/` et rien d'autre ; **une seule grammaire de validation**, Zod, déclarée une fois et consommée par l'API (`createZodDto`), les formulaires (`zodResolver`) et le document OpenAPI ; les **univers de types étanches** (un client n'importe que `contracts`, jamais une ligne de base ni un modèle de domaine) ; **zéro framework, plat** (aucune dépendance entre paquets) ; la consommation **par les sources**, sans `dist/`. Les conventions de nommage sont anglaises (`Create{Entity}Dto`, `Update{Entity}Dto`, `{Entity}ListDto`, `ErrorDto`), le nom d'entité étant le nom en code de `GLOSSARY.md` (`ARC-4`). La puce `ROLES-B` « The role catalogue lives here » est une branche : elle reste avec des rôles, part sans.

La règle qui fait la différence avec un dépôt qui sépare « types » et « validators » : **les formes de réponse sont des schémas Zod**, donc le type client, la sérialisation API et le document OpenAPI dérivent du même objet. Il n'y a rien à tenir à la main, donc rien qui dérive.

## Squelette — `squelette/contracts/`

- **`package.json`** — `main: ./src/index.ts` : les sources sont exposées directement, aucun build, aucune dépendance `^build` pour les consommateurs. `zod` en seule dépendance. `vitest run --passWithNoTests` : les schémas sont déclaratifs, un test n'apparaît qu'avec un `refine`.
- **`tsconfig.json`** — `noEmit` et `allowImportingTsExtensions`, pas d'`outDir` : le paquet ne construit rien, et ses imports relatifs portent l'extension `.ts` parce que Node charge les sources **en direct** depuis le `dist/` de l'API (`openapi:check`, `main.js`) et exige le chemin complet d'un module ESM. Sans l'extension, le typecheck passe et `openapi:check` casse au premier sujet (`ERR_MODULE_NOT_FOUND`) ; sans l'option, le typecheck refuse l'extension (`TS5097`). Chaque consommateur l'admet aussi : `rewriteRelativeImportExtensions` pour l'API qui émet, `allowImportingTsExtensions` pour les clients. Même `tsconfig.json` pour `utils`.
- **`eslint.rules.mjs`** — chargé par l'ESLint racine : interdit tout import de framework (`react`, `@nestjs/*`, `kysely`, `next`, `expo`…) et tout import d'un autre paquet `@{{SCOPE}}/*`. C'est ce qui garantit qu'un contrat tourne côté Node comme côté client.
- **`src/index.ts`** — le barrel, avec `ErrorDto` (identifiants anglais et généralistes, `ARC-4` ; un sujet par fichier : `error.ts`, `roles.ts`…, ré-exporté **avec son extension** : `export * from "./roles.ts";`) : le corps d'erreur commun, déclaré une fois, exposé une fois en réponse `4XX` globale du document OpenAPI de l'API.

## Squelette — `squelette/utils/`

Le même paquet, sans Zod, avec Vitest configuré : **posé seulement à la première fonction partagée**. Sa garde de lint interdit aussi `zod` : un utilitaire est une fonction pure, pas un contrat.

## Fragments — `fragments/`

Ce que le paquet ajoute aux fichiers génériques de la racine : la ligne `packages/CLAUDE.md` dans la carte d'orientation de `CLAUDE.md`, la sous-arborescence `packages/` et la règle dans `README.md`.
