```
apps/mobile/             le client mobile Expo
  CLAUDE.md              ⚠️ règles impératives mobile — à lire avant tout code
  docs/MOBILE_GUIDELINES.md   le pourquoi des règles, avec exemples
  eslint.rules.mjs       frontières entre features, jeton hors Keychain interdit, StyleSheet interdit
  app/                   routes Expo Router UNIQUEMENT
  src/
    features/<module>/   une feature = une feuille : api/ hooks/ components/ index.ts
    components/ui/       Screen (coquille d'écran), Button — en NativeWind
    lib/                 client HTTP (Bearer), Keychain, query provider, clés, env
```
