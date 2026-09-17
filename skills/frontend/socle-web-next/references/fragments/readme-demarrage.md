```bash
pnpm --filter @{{SCOPE}}/{{PROJET}}-web dev
```

Le client écoute sur **3001** et relaie `/api/*` vers l'API en développement (même origine, donc le cookie de session passe). La page d'accueil interroge `GET /health` de l'API : si elle affiche « ok », la chaîne complète fonctionne.
