---
name: socle-mobile-expo
description: Amorce un client mobile Expo (Expo Router, NativeWind) dans un monorepo — même architecture que le client web, session par jetons porteurs dans le Keychain, un seul client HTTP, état serveur TanStack Query, formulaires sur les schémas partagés, bundle Metro comme gate — avec ses règles, son ADR et les tickets de ce qui reste à trancher. Use when adding a mobile app to a monorepo, scaffolding an Expo client, or when iOS/Android must consume a NestJS API through shared Zod contracts.
---

# Socle mobile Expo

Amorce un client mobile qui démarre, ses règles d'architecture, ses gardes de frontière et ce qui reste à trancher — dans un monorepo dont la racine est posée par `/maj-skills:socle-monorepo` et les contrats par `/maj-skills:socle-contrats`.

**Ce socle ne contient aucune règle métier.** Sa seule feature, `sante`, interroge `GET /health` de l'API depuis l'écran d'accueil : elle montre la forme d'une feature et la coquille `Screen`, puis disparaît avec la première feature métier.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders.

## Avant de commencer — vérifier le terrain

1. **La racine est-elle posée ?** Si `pnpm-workspace.yaml` est absent, **invoquer `/maj-skills:socle-monorepo`** avec `mobile` (et l'API si elle est voulue).
2. **Les contrats sont-ils posés ?** Si `packages/contracts/` est absent, **invoquer `/maj-skills:socle-contrats`**.
3. Si `apps/mobile/` existe déjà, **s'arrêter et demander**.
4. Les placeholders sont ceux fixés par `socle-monorepo`.

Ce skill ne pose **aucune question** : le choix « application mobile » est fait par le fait de l'invoquer ; la forme de l'authentification en découle (jetons porteurs), et le reste part en tickets.

## Étape 1 — poser le client

| Source                                  | Destination                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `references/squelette/apps/mobile/*`    | `apps/mobile/` — **`gitignore` se copie en `.gitignore`** ; `eslint.rules.mjs` est chargé par l'ESLint racine |
| `references/mobile/CLAUDE.md`           | `apps/mobile/CLAUDE.md`                                                     |
| `references/mobile/docs/*`              | `apps/mobile/docs/`                                                         |
| `references/adr/mobile/MOB-1-*`      | `docs/adr/mobile/` — décision rattachée au sujet `MOB`                      |
| `references/tickets/*`                  | `docs/features/socle/issues/`                                               |

Le trigramme **`MOB`** n'est pas au registre de `docs/methode/nomenclature.md` : **l'y inscrire avant de copier l'ADR** (sujet : « guides et décisions propres au client mobile (`apps/mobile/`) », statut actif). Registre d'abord, fichier ensuite.

Puis **composer les fichiers de la racine** — chaque fragment s'insère **immédiatement au-dessus** du marqueur de sa zone, sans supprimer le marqueur :

| Fragment                                            | Fichier racine    | Zone                                |
| --------------------------------------------------- | ----------------- | ----------------------------------- |
| `references/fragments/claude-md-routing.md`         | `CLAUDE.md`       | `<!-- socle:routing -->`             |
| `references/fragments/claude-md-avant-code.md`      | `CLAUDE.md`       | `<!-- socle:avant-code -->`          |
| `references/fragments/readme-ou-vit-quoi.md`        | `README.md`       | `<!-- socle:ou-vit-quoi -->`         |
| `references/fragments/readme-prerequis.md`          | `README.md`       | `<!-- socle:prerequis -->`           |
| `references/fragments/readme-demarrage.md`          | `README.md`       | `<!-- socle:demarrage -->`           |
| `references/fragments/readme-commandes.md`          | `README.md`       | `<!-- socle:commandes -->`           |
| `references/fragments/readme-lire-ensuite.md`       | `README.md`       | `<!-- socle:lire-ensuite -->`        |
| `references/fragments/readme-regles.md`             | `README.md`       | `<!-- socle:regles -->`              |
| `references/fragments/readme-regles-transverses.md` | `README.md`       | `<!-- socle:regles-transverses -->`  |
| `references/fragments/env.example.txt`              | `.env.example`    | **en fin de fichier**                |
| `references/fragments/prettierignore.txt`           | `.prettierignore` | **en fin de fichier**                |
| `references/fragments/npmrc.txt`                    | `.npmrc`          | **en fin de fichier** (commentaire : la parade `node-linker=hoisted`, à n'activer que si le bundle échoue) |

Substituer les placeholders dans tout ce qui vient d'être copié.

**Branches.** `apps/mobile/CLAUDE.md` et le ticket `13` portent des blocs entre marqueurs `<!-- ══ TENANT-B ══ -->` / `<!-- ══ ROLES-B ══ -->` : les **garder** si la réponse à la question correspondante (multi-tenance, rôles — posée par `socle-monorepo` ou par le skill API) est oui, les **supprimer avec leurs marqueurs** sinon. Aucun marqueur `══` ne doit subsister.

**Si `apps/api/` existe**, la décision client dans `apps/api/CLAUDE.md` évolue :

- s'il n'y a pas de client web, remplacer « **no client, for now** » par « **DECISION — a mobile client (`apps/mobile`).** Auth is token-shaped: Bearer access token + rotating refresh, returned as JSON when `X-Client-Type: mobile`; no cookies, no CSRF. Contract changes are expand/contract: a mobile app does not update by force. » ;
- s'il y a déjà un client web, compléter sa décision : « **… and a mobile client (`apps/mobile`)**: same endpoints, `X-Client-Type: mobile` switches the auth response to JSON Bearer tokens instead of `Set-Cookie`. Contract changes are expand/contract. »

## Étape 2 — vérifier, puis seulement conclure

```bash
pnpm install
pnpm check                                             # lint · typecheck · cycles · gates (check:bundle = expo export)
pnpm --filter @<scope>/<projet>-mobile test            # api-error, query-keys
pnpm --filter @<scope>/<projet>-mobile doctor          # expo-doctor : versions natives cohérentes
```

`expo-doctor` signale **un** contrôle en échec, attendu : « Modifying the metro.config.js is dangerous ». C'est le prix d'un monorepo pnpm (`watchFolders`, liens symboliques) ; tout autre contrôle en échec est un vrai problème.

Le bundle est la preuve sans appareil : `expo export --platform android` traverse Metro (résolution du monorepo pnpm), NativeWind et Babel. S'il échoue sur la résolution d'un module natif, activer `node-linker=hoisted` dans le `.npmrc` racine (le commentaire ajouté le dit), refaire `pnpm install`, relancer.

Puis, **avec l'API lancée**, `pnpm --filter @<scope>/<projet>-mobile dev` et ouvrir dans Expo Go ou un simulateur : l'écran affiche « `<projet>-api — ok` ». Sur un téléphone physique, `EXPO_PUBLIC_API_URL` doit pointer vers l'adresse LAN du poste. **Si aucun appareil ni simulateur n'est disponible, le dire** : le bundle prouve la construction, pas le rendu.

Vérifier que **les gardes mordent** — créer `apps/mobile/src/features/sonde/index.ts` avec `export { SanteEcran } from "@/features/sante";` : le lint refuse (« n'importe jamais une autre feature »). Créer `apps/mobile/src/features/sante/lib/sonde.ts` avec `import * as S from "expo-secure-store"; export const s = S;` : le lint refuse (« Un jeton vit dans lib/secure-store.ts »). Créer un composant avec `import { StyleSheet } from "react-native";` : le lint refuse. **Supprimer les trois sondes.**

Contrôler qu'il ne reste **aucun placeholder `{{…}}`** (chercher `{{[A-Z_]+}}` — les doubles accolades JSX ne comptent pas), et que les marqueurs `<!-- socle:… -->` sont toujours là.

## Étape 3 — déposer les tickets

Les gabarits de `references/tickets/` sont dans la plage `13`–`15` réservée au mobile : brancher la session (bloqué par l'authentification de l'API), distribution EAS et stores (grilling → `MOB-2`), parcours sur appareil (bloqué par le pare-feu CI et la distribution).

**Adapter chaque ticket à ce qui est déjà connu.** Un compte développeur existant, une politique OTA déjà tranchée : le dire dans le ticket, ou le convertir en ADR.

**Ne pas commiter** : l'historique est écrit par `socle-monorepo` à la fin.

## Ce que ce skill ne fait pas

- **Aucune règle métier, aucun écran métier.** La feature `sante` est un placeholder étiqueté.
- **Aucune session.** Le Keychain et le client Bearer sont prêts, inertes : ticket `13`.
- **Aucune distribution.** Ni `eas.json`, ni icônes, ni comptes : ticket `14`. Les identifiants de bundle dérivés du projet sont des valeurs de départ, pas des décisions.
- **Ni biométrie, ni hors-ligne, ni notifications** : chacun est un ticket avec sa revue de sécurité, le jour où le besoin existe.
- **Aucun paquet UI partagé avec le web** : `MOB-1` dit pourquoi.

## Anti-patterns

| Tentation                                                     | Pourquoi c'est faux                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| « Je range le jeton dans AsyncStorage, c'est plus simple »    | AsyncStorage est un fichier en clair. Le Keychain, via `lib/secure-store.ts`, et le lint le garde. |
| « Je crée `/api/mobile/…`, c'est plus pratique »              | Mêmes endpoints que le web ; `X-Client-Type` suffit. Deux routes, deux dérives.                |
| « Un `StyleSheet.create`, juste pour cet écran »              | Il réintroduit des couleurs en dur. NativeWind partout, le lint refuse l'import.                |
| « Je partage les composants avec le web via `packages/ui` »   | React Native n'est pas le DOM. On partage types, schémas, utils ; pas les composants.           |
| « Je saute `check:bundle`, c'est long »                       | C'est la seule preuve sans appareil que Metro résout encore le monorepo.                        |
| « J'annonce que l'app tourne »                                | Pas avant `pnpm check` vert, bundle compris — et l'écran qui affiche l'état de l'API si un appareil existe. |
