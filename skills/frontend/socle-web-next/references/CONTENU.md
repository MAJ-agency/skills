# Ce que contient le socle web, et pourquoi

Inventaire des gabarits, avec la raison d'être de chacun. La racine du monorepo est décrite dans le `CONTENU.md` de `socle-monorepo`, les contrats dans celui de `socle-contrats`.

## Règles front — `web/`

- **`CLAUDE.md`** — les contraintes impératives, en anglais pour rester diffable : règle d'or (routes minces, features feuilles, sens unique des dépendances), nommage, les trois sortes d'état et leur outil, un seul client HTTP et le parsing des réponses à la frontière, retour des mutations global par `meta`, formulaires sur les schémas partagés, shadcn vendored et Tailwind seul, environnement validé, périmètre des tests, definition of done.
- **`docs/FRONTEND_GUIDELINES.md`** — le _pourquoi_, avec l'anatomie d'une feature sur un domaine placeholder (`Demande`) étiqueté comme tel.

## Squelette — `squelette/apps/web/`

- **`package.json`** — Next 16, React 19, TanStack Query 5, Axios, React Hook Form + resolvers, nuqs, Tailwind 4, shadcn (cva, clsx, tailwind-merge, lucide), sonner ; Vitest, dpdm, les plugins ESLint (react-hooks, jsx-a11y, @next/next). Zod reste en 3 comme les contrats. Le client écoute sur **3001**, l'API sur 3000.
- **`next.config.ts`** — `transpilePackages` pour les paquets partagés (ils exposent leurs sources), `standalone`, en-têtes de sécurité, et le **relais `/api` en développement** : le navigateur appelle en même origine, donc le cookie httpOnly posé par l'API est renvoyé. Sans ce relais, une session par cookie ne marche pas en local.
- **`eslint.rules.mjs`** — les frontières : liste des features **lue sur le disque** (une nouvelle feature est protégée dès sa création), un bloc par feature, `lib/` et `components/` qui n'importent aucune feature, **tout import relatif remontant interdit** (l'alias `@/` dit d'où vient un module), pas d'import profond dans un paquet. Plus jsx-a11y en erreur, react-hooks, les règles Next. Le **cliquet de dette** `DETTE_FEATURES`, vide, et son contrat en commentaire.
- **`scripts/verify-dette-imports.mjs`** — le pendant du cliquet : échoue si une entrée déclarée n'est plus utilisée. La dette ne peut que baisser.
- **`src/app/`** — `layout.tsx` (providers : nuqs, TanStack Query, toasts — et rien d'autre), `page.tsx` (rend la feature `sante`), `globals.css` (Tailwind 4, tokens en `@theme` donc en variables CSS, surchargeables à l'exécution).
- **`src/lib/`** — `env.ts` (variables publiques validées par Zod au chargement, fail-fast), `api-client.ts` (Axios, `withCredentials`, relais `/api` en dev, file de refresh à un seul vol, inerte jusqu'à l'authentification), `api-error.ts` (lecture d'`ErreurDto` **depuis le contrat**), `query-keys.ts` (source unique des clés, avec son spec d'invariants), `query-provider.tsx` (`MutationCache` piloté par `meta`), `utils.ts` (`cn`).
- **`src/components/ui/button.tsx`** — la forme d'une primitive shadcn vendored : `cva` + `cn`, variants nommés en français.
- **`src/features/sante/`** — la feature d'exemple, placeholder étiqueté : `api/` (une fonction, réponse parsée), `hooks/` (clé de `lib/query-keys`), `components/` (région nommée, `role="status"`), `index.ts` (barrel).
- **`vitest.config.ts`** — environnement Node à dessein : un test qui touche le DOM échoue immédiatement. Le rendu est couvert par Playwright.
- **`gitignore`** — `.next/`, `next-env.d.ts` (généré), stocké sans point.

## ADR — `adr/web/`

- **`WEB-1`** — rendu, routage et périmètre des tests : routes minces, pages client par défaut, préchargement serveur page par page, tests unitaires sur la logique pure et parcours de bout en bout. Rattachée au sujet `WEB`, donc dans `docs/adr/web/`.

## Tickets — `tickets/`

Plage `10`–`12`, réservée au web : `10` brancher la session (bloqué par `5`), `11` design system et tokens (grilling vers `DES-1`), `12` parcours de bout en bout (bloqué par `7`).

## Fragments — `fragments/`

Ce que le client ajoute aux fichiers génériques de la racine : ses lignes dans la carte d'orientation et l'« avant d'écrire » de `CLAUDE.md`, sa sous-arborescence, son démarrage, ses commandes et ses règles dans `README.md`, ses variables dans `.env.example`, ses fichiers générés dans `.prettierignore`.
