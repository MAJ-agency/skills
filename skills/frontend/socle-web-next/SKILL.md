---
name: socle-web-next
description: Amorce un client web Next.js (App Router) dans un monorepo — routes minces, features feuilles verrouillées par le lint, un seul client HTTP à cookies, état serveur TanStack Query, formulaires sur les schémas partagés, shadcn/ui vendored, Vitest sur la logique pure — avec ses règles, son ADR et les tickets de ce qui reste à trancher. Use when adding a web front-end to a monorepo, scaffolding a Next.js client, or when a browser client must consume a NestJS API through shared Zod contracts.
---

# Socle web Next.js

Amorce un client web qui démarre, ses règles d'architecture, ses gardes de frontière et ce qui reste à trancher — dans un monorepo dont la racine est posée par `/maj-skills:socle-monorepo` et les contrats par `/maj-skills:socle-contrats`.

**Ce socle ne contient aucune règle métier.** Sa seule feature, `sante`, interroge `GET /health` de l'API : elle montre la forme d'une feature et prouve la chaîne complète, puis disparaît avec la première feature métier.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders.

## Avant de commencer — vérifier le terrain

1. **La racine est-elle posée ?** Si `pnpm-workspace.yaml` est absent, **invoquer `/maj-skills:socle-monorepo`** avec `web` (et l'API si elle est voulue) : il pose la racine, les contrats, puis revient ici.
2. **Les contrats sont-ils posés ?** Si `packages/contracts/` est absent, **invoquer `/maj-skills:socle-contrats`** : le client lit `ErreurDto` et, demain, tous ses schémas.
3. Si `apps/web/` existe déjà, **s'arrêter et demander**.
4. Les placeholders sont ceux fixés par `socle-monorepo`, plus un dérivé : `{{LANGUE_HTML}}` = `fr` si la langue est le français, `en` sinon (attribut `lang` du document).

Ce skill ne pose **aucune question** : le choix « navigateur » est fait par le fait de l'invoquer ; la forme de l'authentification en découle (cookies httpOnly), et le reste part en tickets.

## Étape 1 — poser le client

| Source                              | Destination                                                       |
| ----------------------------------- | ----------------------------------------------------------------- |
| `references/squelette/apps/web/*`   | `apps/web/` — **`gitignore` se copie en `.gitignore`** ; `eslint.rules.mjs` est chargé par l'ESLint racine |
| `references/web/CLAUDE.md`          | `apps/web/CLAUDE.md`                                              |
| `references/web/docs/*`             | `apps/web/docs/`                                                  |
| `references/adr/web/WEB-1-*`     | `docs/adr/web/` — décision rattachée au sujet `WEB`, donc dans son sous-dossier |
| `references/tickets/*`              | `docs/features/socle/issues/`                                     |

Puis **composer les fichiers de la racine** — chaque fragment s'insère **immédiatement au-dessus** du marqueur de sa zone, sans supprimer le marqueur :

| Fragment                                            | Fichier racine    | Zone                                |
| --------------------------------------------------- | ----------------- | ----------------------------------- |
| `references/fragments/claude-md-routing.md`         | `CLAUDE.md`       | `<!-- socle:routing -->`             |
| `references/fragments/claude-md-avant-code.md`      | `CLAUDE.md`       | `<!-- socle:avant-code -->`          |
| `references/fragments/readme-ou-vit-quoi.md`        | `README.md`       | `<!-- socle:ou-vit-quoi -->`         |
| `references/fragments/readme-demarrage.md`          | `README.md`       | `<!-- socle:demarrage -->`           |
| `references/fragments/readme-commandes.md`          | `README.md`       | `<!-- socle:commandes -->`           |
| `references/fragments/readme-lire-ensuite.md`       | `README.md`       | `<!-- socle:lire-ensuite -->`        |
| `references/fragments/readme-regles.md`             | `README.md`       | `<!-- socle:regles -->`              |
| `references/fragments/readme-regles-transverses.md` | `README.md`       | `<!-- socle:regles-transverses -->`  |
| `references/fragments/env.example.txt`              | `.env.example`    | **en fin de fichier**                |
| `references/fragments/prettierignore.txt`           | `.prettierignore` | **en fin de fichier**                |

Substituer les placeholders dans tout ce qui vient d'être copié.

**Branches.** `apps/web/CLAUDE.md` et le ticket `10` portent des blocs entre marqueurs `<!-- ══ TENANT-B ══ -->` / `<!-- ══ ROLES-B ══ -->` : les **garder** si la réponse à la question correspondante (multi-tenance, rôles — posée par `socle-monorepo` ou par le skill API) est oui, les **supprimer avec leurs marqueurs** sinon. Aucun marqueur `══` ne doit subsister. Le trigramme `WEB` est déjà au registre de `docs/methode/nomenclature.md` (réservé) : passer son statut à « actif ».

**Si `apps/api/` existe**, deux ajustements que l'API ne peut pas connaître d'avance :

- dans `apps/api/CLAUDE.md`, la décision « **no client, for now** » est caduque : la remplacer par « **DECISION — a browser client (`apps/web`).** Auth is cookie-shaped (`__Host-`, httpOnly, CSRF signed double-submit, CORS `credentials`) — the recipe in Invariants applies. » ;
- dans `.env.example`, `CORS_ORIGIN` de l'API devient l'origine du client (`http://localhost:3001` en développement).

## Étape 2 — vérifier, puis seulement conclure

```bash
pnpm install
pnpm check                                          # build (next build compris) · lint · typecheck · cycles · gates (check:dette)
pnpm --filter @<scope>/<projet>-web test            # api-error, query-keys
```

Puis, **avec l'API lancée** (`pnpm --filter @<scope>/<projet>-api dev`), lancer `pnpm --filter @<scope>/<projet>-web dev` et ouvrir `http://localhost:3001` : la page affiche « `<projet>-api — ok` ». C'est la preuve de la chaîne complète (relais `/api`, client Axios, parsing Zod, TanStack Query, rendu).

Vérifier que **les gardes de frontière mordent** — créer `apps/web/src/features/sonde/index.ts` contenant `export { SantePanel } from "@/features/sante";`, confirmer que `pnpm lint` échoue avec le message « n'importe jamais une autre feature », **puis le supprimer**. Faire de même avec un import relatif remontant (`../lib/utils`) dans un composant : le lint doit refuser.

Contrôler qu'il ne reste **aucun placeholder `{{…}}`** (chercher `{{[A-Z_]+}}` — les doubles accolades JSX ne comptent pas) dans les fichiers posés, et que les marqueurs `<!-- socle:… -->` sont toujours là.

## Étape 3 — déposer les tickets

Les gabarits de `references/tickets/` sont dans la plage `10`–`12` réservée au web : brancher la session (bloqué par l'authentification de l'API), design system et tokens (grilling → `DES-1`), parcours de bout en bout (bloqué par le pare-feu CI).

**Adapter chaque ticket à ce qui est déjà connu du projet.** Une charte graphique existante répond à la moitié du ticket `11` : le dire dans le ticket, ou le convertir en ADR.

**Ne pas commiter** : l'historique est écrit par `socle-monorepo` à la fin.

## Ce que ce skill ne fait pas

- **Aucune règle métier, aucun écran métier.** La feature `sante` est un placeholder étiqueté comme tel.
- **Aucune session.** Le client la porte (cookies, file de refresh inerte) mais ne la crée pas : c'est le ticket `10`, bloqué par l'API.
- **Aucun design system.** Un jeu de tokens et une primitive pour montrer la forme ; le reste est le ticket `11`.
- **Aucun store client global**, aucun préchargement serveur par défaut : `WEB-1` dit pourquoi, et comment les ajouter le jour venu.

## Anti-patterns

| Tentation                                                     | Pourquoi c'est faux                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| « Je mets un composant dans `app/`, c'est juste une page »    | `app/` ne contient que des routes. Un écran vit dans sa feature, pour bouger de route sans casser. |
| « `features/a` importe `features/b`, c'est un petit import » | Une feature est une feuille. Ce qui est partagé va dans `components/shared`, `lib/` ou `packages/`. |
| « Je déclare l'interface de la réponse dans `api/`, c'est plus lisible » | Deux sources de vérité. La forme vient de `packages/contracts` et se **parse** à la frontière. |
| « Un `toast` dans `onSuccess`, c'est plus direct »            | Trente features, trente formulations. Le `MutationCache` le fait une fois, depuis `meta`.     |
| « J'ajoute Zustand, on en aura besoin »                       | Pas de dépendance pour un besoin qui n'existe pas. Le jour venu, une ADR.                     |
| « `fetch` ici, c'est un cas simple »                          | Un seul client HTTP, sinon cookies et erreurs se traitent en deux endroits.                   |
| « J'annonce que le client tourne »                            | Pas avant `pnpm check` vert et la page d'accueil qui affiche l'état de l'API.                |
