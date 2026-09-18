# Brancher la session côté mobile

Status: needs-info
Type: task

Le client mobile est prêt pour une session par **jetons porteurs** : `lib/secure-store.ts` (Keychain), `lib/api-client.ts` (Bearer, `X-Client-Type: mobile`, file de rafraîchissement à un seul vol), tous inertes tant que l'API n'émet pas de jetons.

Bloqué par : `05-authentification` — l'API doit répondre en JSON (`{ acces, refresh }`) quand `X-Client-Type: mobile` est présent, au lieu de `Set-Cookie`.

## À faire, quand l'API expose `/auth/*`

1. `features/auth/` : écran de connexion (`zodResolver` sur le schéma du contrat), déconnexion (effacer le Keychain, vider le cache TanStack).
2. `lib/auth/` : `useUtilisateurCourant()` (`/auth/me`), lu par toutes les features.
3. Brancher `definirOnSessionPerdue` dans `app/_layout.tsx` : `router.replace` vers la connexion.
4. La porte d'entrée : `app/index.tsx` lit `jetons.lireAcces()` et redirige vers la connexion ou l'espace connecté. Ce n'est pas une frontière de sécurité, l'API refuse elle-même.
5. Aligner la forme de la réponse de refresh dans `rafraichir()` sur le contrat une fois écrit.

## Rappels non négociables

- Le jeton ne sort **jamais** de `lib/secure-store.ts`. Pas d'AsyncStorage, pas d'état React, pas de log.
- Mêmes endpoints que le web. Un changement de contrat est expand/contract : une app mobile ne se met pas à jour de force.

## Comments
