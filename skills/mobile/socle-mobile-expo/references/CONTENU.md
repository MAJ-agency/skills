# Ce que contient le socle mobile, et pourquoi

Inventaire des gabarits, avec la raison d'être de chacun. La racine du monorepo est décrite dans le `CONTENU.md` de `socle-monorepo`, les contrats dans celui de `socle-contrats`, le client web dans celui de `socle-web-next`.

## Règles mobile — `mobile/`

- **`CLAUDE.md`** — les contraintes impératives, en anglais : même architecture que le web (routes minces, features feuilles, sens unique), session dans le Keychain et nulle part ailleurs, un seul client HTTP Bearer sur les mêmes endpoints que le web, les trois sortes d'état, retour des mutations global, `Screen` comme coquille de tout écran, NativeWind seul, environnement et build, périmètre des tests, definition of done.
- **`docs/MOBILE_GUIDELINES.md`** — le _pourquoi_ : Bearer plutôt que cookies, `Screen`, NativeWind plutôt que StyleSheet, le bundle comme gate, les trois réglages Metro d'un monorepo pnpm.

## Squelette — `squelette/apps/mobile/`

- **`package.json`** — Expo SDK 57 (React 19.2, React Native 0.86, aligné sur le web), Expo Router, NativeWind 4 (donc Tailwind 3, distinct du Tailwind 4 du web), Reanimated 4 + worklets et gesture-handler (pairs requis par NativeWind et Expo Router), TanStack Query, Axios, React Hook Form, Zod 3 ; Vitest, dpdm, `expo-doctor`. TypeScript reste celui du monorepo (5.x) : le SDK en attend une autre majeure, `expo.install.exclude` le dit à `expo-doctor` plutôt que d'introduire deux TypeScript. `check:bundle` = `expo export --platform android`, joué par `check:gates`.
- **`app.config.ts`** — dynamique ; nom, slug, schéma et identifiants de bundle dérivés du projet, routes typées. La nouvelle architecture et le bord à bord sont les défauts du SDK, donc absents du fichier. Le reste (icônes, EAS) est le ticket distribution.
- **`metro.config.js`** — les trois réglages d'un monorepo pnpm (`watchFolders`, `nodeModulesPaths`, liens symboliques + `exports`) et le stub `node:` pour les paquets partagés.
- **`babel.config.js`** — `babel-preset-expo` avec le runtime JSX de NativeWind ; ni `nativewind/babel` (v2) ni plugin worklets à la main, le preset l'ajoute.
- **`tailwind.config.js`** — preset NativeWind, tokens **identiques** à `apps/web/src/app/globals.css`, alignés à la main jusqu'au paquet de design tokens.
- **`eslint.rules.mjs`** — les frontières du web, plus deux gardes mobiles : `expo-secure-store` importable seulement depuis `lib/`, AsyncStorage interdit partout, `StyleSheet` interdit. Ignore `.expo/`, `dist/`, `android/`, `ios/`.
- **`app/`** — `_layout.tsx` (gesture handler, zone sûre, TanStack Query, barre d'état, pile de navigation) et `index.tsx` (rend l'écran de la feature `sante`).
- **`src/lib/`** — `env.ts` (`EXPO_PUBLIC_API_URL` validée par Zod au démarrage), `secure-store.ts` (le Keychain, seul dépositaire des jetons), `api-client.ts` (Bearer, `X-Client-Type: mobile`, file de refresh à un seul vol, inerte), `api-error.ts` (lecture d'`ErreurDto` depuis le contrat), `query-keys.ts` et son spec, `query-provider.tsx` (`meta` → `toast`), `toast.ts` (`Alert`, sans module natif, donc Expo Go).
- **`src/components/ui/`** — `screen.tsx` (zone sûre, chargement, erreur avec réessai, vide — décidés une fois) et `button.tsx` (cible ≥ 44 pt, état accessible).
- **`src/features/sante/`** — la feature d'exemple, placeholder étiqueté.
- **`vitest.config.ts`** — Node à dessein ; **`gitignore`** — `.expo/`, `dist/`, `ios/`, `android/` (générés par `prebuild`), clés de signature.

## ADR — `adr/mobile/`

- **`MOB-0001`** — Expo et Expo Router, même architecture que le web, session par jetons dans le Keychain, bundle comme gate. Le trigramme `MOB` s'inscrit au registre avant la copie.

## Tickets — `tickets/`

Plage `13`–`15` : `13` session mobile (bloqué par `05`), `14` distribution EAS et stores (grilling vers `MOB-0002`), `15` parcours sur appareil (bloqué par `07` et `14`).

## Fragments — `fragments/`

Ce que le client ajoute aux fichiers génériques de la racine, dont un commentaire dans `.npmrc` sur la parade `node-linker=hoisted`, à n'activer que si le bundle échoue.
