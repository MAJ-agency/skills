```bash
pnpm --filter @{{SCOPE}}/{{PROJET}}-mobile dev
```

Scanner le QR code avec Expo Go, ou appuyer sur `a` / `i` pour un simulateur. Sur un **téléphone physique**, `localhost` désigne le téléphone : créer `apps/mobile/.env.local` avec `EXPO_PUBLIC_API_URL=http://<adresse-LAN-du-poste>:3000`. L'écran d'accueil affiche l'état de l'API : si « ok » s'affiche, la chaîne complète fonctionne.
