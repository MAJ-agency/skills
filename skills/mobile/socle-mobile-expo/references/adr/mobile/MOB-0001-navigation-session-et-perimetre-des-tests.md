# MOB-0001 — Navigation, session et périmètre des tests du client mobile

- Statut : **accepté**
- Date : {{DATE}}
- Portée : `apps/mobile`

## Contexte

Un client mobile peut être bâti de plusieurs façons (React Native nu ou Expo, navigation impérative ou par fichiers), porter sa session de plusieurs façons (cookies, jetons, où les stocker), et se tester à plusieurs niveaux. Ne pas choisir, c'est laisser chaque écran choisir.

## Décision

1. **Expo, avec Expo Router.** Le SDK géré évite le projet natif versionné (`ios/`, `android/` sont générés par `prebuild`) ; le routage par fichiers donne à `app/` la même règle qu'au web : des routes minces, les écrans dans `features/`.
2. **Même architecture que le client web** — `features/<module>/{api,hooks,components}` feuilles, `lib/` en dessous, frontières par le lint. Ce qui est partagé passe par `packages/` ; composants, client HTTP et stores ne se partagent pas.
3. **Session par jetons porteurs dans le Keychain**, sur les mêmes endpoints que le web, discriminés par `X-Client-Type: mobile`. Jamais AsyncStorage pour un secret, jamais une route `/mobile/*`.
4. **Le bundle est un gate** : `expo export` dans `pnpm check`. Les tests unitaires s'arrêtent à la logique pure (Vitest, Node) ; les parcours se testent sur appareil, de bout en bout.

## Alternatives écartées

- **React Native nu** — un projet natif versionné à maintenir à chaque montée de version, pour un gain nul tant qu'aucun module natif sur mesure n'est nécessaire.
- **Cookies côté mobile** — pas de jar fiable, pas de same-origin : une session par cookie dans une app mobile est une session fragile.
- **Un paquet `api-client` partagé web/mobile** — deux transports (cookie / Bearer), deux gestions d'erreur d'UI : le partage force des branches par plateforme dans du code censé être commun.
- **Tests de composants avec une couche native simulée** — ils testent le simulacre.

## Conséquences

**Positives.** Un développeur web lit le mobile sans apprentissage. Le bundle casse en CI, pas sur l'appareil du testeur. Un jeton n'est jamais lisible hors de l'app.

**Coûts.** Deux versions de Tailwind dans le monorepo (NativeWind v4 = Tailwind 3) tant que NativeWind 5 n'est pas stable. Les tokens sont alignés à la main entre `globals.css` et `tailwind.config.js` jusqu'au paquet de design tokens.

**Risque et parade.** Une feature qui stocke « juste un flag » en AsyncStorage finit par y mettre un jeton. Parade : le lint interdit `expo-secure-store` hors de `lib/secure-store.ts` et AsyncStorage partout.

## Liens

- Règles : `apps/mobile/CLAUDE.md` ; le pourquoi : `apps/mobile/docs/MOBILE_GUIDELINES.md`
- Frontières : `apps/mobile/eslint.rules.mjs`
