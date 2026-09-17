# Brancher la session côté web

Status: needs-info
Type: task

Le client web est prêt pour une session par **cookie httpOnly** : `lib/api-client.ts` envoie les cookies et porte une file de rafraîchissement à un seul vol, inerte tant que l'API ne répond jamais 401. Rien d'autre n'existe : ni page de connexion, ni garde de route, ni notion d'utilisateur courant.

Bloqué par : `05-authentification` — la session est posée par l'API, le client ne fait que la porter.

## À faire, quand l'API expose `/auth/*`

1. `features/auth/` : formulaire de connexion (`zodResolver` sur le schéma du contrat), déconnexion.
2. `lib/auth/` : `useUtilisateurCourant()` (`/auth/me`, `staleTime: Infinity`, `retry: false`) — dans `lib/` parce que toutes les features le lisent.
3. Brancher `definirOnSessionPerdue` dans `app/layout.tsx` : redirection vers la page de connexion.
4. Garde de route **optimiste** dans `proxy.ts` (Next 16 ; `middleware.ts` avant) : redirige un visiteur sans cookie vers la connexion. **Ce n'est pas une frontière de sécurité** — l'API refuse elle-même — c'est du confort. Ne jamais y mettre une décision d'accès.
5. CSRF : en-tête `X-CSRF-Token` posé par l'intercepteur de requête sur les mutations, valeur lue depuis le cookie non-httpOnly que l'API pose (signed double-submit, `apps/api/CLAUDE.md`).

## Rappels non négociables

- Le client **ne voit jamais un jeton**. Pas de `localStorage`, pas d'en-tête `Authorization` fabriqué côté client.
- `CORS_ORIGIN` de l'API = l'origine du client déployé. En développement, le relais `/api` rend CORS inutile.

## Comments
