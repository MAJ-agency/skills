# ARC-3 — Forme de l'authentification par client

- Statut : **accepté**
- Date : {{DATE}}
- Portée : sécurité, API (`apps/api`) et ses clients

> **Gabarit à sections par client.** Garder les sections des clients installés, supprimer les autres **et leurs marqueurs**. Sans aucun client, cette ADR n'existe pas : le ticket `3` reste ouvert.

## Contexte

La forme de l'authentification dépend de la nature du client — un navigateur veut des cookies, une application mobile veut des jetons porteurs — et cette forme décide de la réponse des endpoints `/auth/*`, des gardes globales de l'API et de ce que chaque client stocke. Le socle a été amorcé avec ses clients : la question « y a-t-il un client, et lequel ? » est tranchée par construction. Ce qui reste à fixer est **comment une même API sert chacun**.

## Décision

- **Mêmes endpoints `/auth/*` pour tous les clients.** Aucune route par client. Le client se déclare par l'en-tête **`X-Client-Type`** ; l'API adapte la **forme de la réponse**, pas la logique. **En-tête absent → navigateur** (la forme la plus contrainte) ; **valeur inconnue → `400`**. La forme ne se devine jamais depuis `User-Agent`.
- **Une seule logique d'authentification** : Argon2id, JWT d'accès court signé avec liste blanche d'algorithmes, refresh opaque haché au repos avec rotation et détection de réutilisation (un rejeu révoque toute la famille, journalisé dans `audit_log`). Seule la forme de la réponse change par client.
<!-- ══ CLIENT-WEB ══ -->
- **Navigateur (`apps/web`) — session par cookies.** JWT d'accès dans un cookie **`__Host-`, httpOnly** ; **CSRF signed double-submit** (HMAC de l'identifiant de session, en-tête `X-CSRF-Token`, `Origin` exigé sur mutation) ; CORS avec `credentials`, origine unique égale à `CORS_ORIGIN`. Le client **ne voit jamais un jeton**. C'est la recette de `apps/api/CLAUDE.md` § _Invariants_ ; `WEB-1` dit comment le client la porte.
<!-- ══ /CLIENT-WEB ══ -->
<!-- ══ CLIENT-MOBILE ══ -->
- **Mobile (`apps/mobile`) — session par jetons porteurs.** Avec `X-Client-Type: mobile`, la réponse d'authentification est **JSON** (`{ acces, refresh }`) au lieu de `Set-Cookie` ; les appels portent `Authorization: Bearer` ; **ni cookie, ni CSRF** (pas d'origine, pas de navigateur). La garde CSRF ignore une requête Bearer mais **refuse (`400`) un Bearer accompagné d'un cookie de session** : pas de session mixte. Les jetons vivent dans le **Keychain** (`lib/secure-store.ts`), jamais en AsyncStorage (`MOB-1`). **Le contrat est expand/contract** : une application installée ne se met pas à jour de force ; on ajoute avant de retirer, et on retire après une période de recouvrement écrite dans la PR.
<!-- ══ /CLIENT-MOBILE ══ -->
- **La session porte l'identité** — et, selon `ARC-2`, le tenant et le rôle — quel que soit le client. Rien de tout cela ne vient d'un en-tête ni d'un corps client.

## Alternatives écartées

- **Jetons porteurs pour le navigateur aussi** — un jeton lisible par JavaScript est exposé au premier XSS ; le cookie httpOnly ne l'est pas.
- **Cookies pour le mobile** — pas de jar fiable, pas de same-origin : une session fragile.
- **Des routes séparées par client** (`/mobile/*`) — deux surfaces à documenter, tester et faire dériver, pour une différence qui tient à la forme de la réponse.
- **Laisser la question ouverte** (le ticket `3` d'origine) — les clients sont installés : la question n'est plus ouverte, le ticket serait du bruit.

## Conséquences

**Positives.** Une seule logique d'authentification, une forme de réponse par client. Chaque client stocke sa session là où sa plateforme la protège. Un changement de règle d'authentification se fait une fois.

**Coûts.** Une forme de réponse à tester par client (`supertest` avec et sans `X-Client-Type`). La garde CSRF a deux branches, donc deux jeux de tests.

**Risques & parades.**

| Risque | Parade |
| --- | --- |
| Un script dans le navigateur envoie `X-Client-Type: mobile` pour lire des jetons | Il n'obtient rien de plus que ce que sa session lui donne ; CORS limite les origines qui appellent avec `credentials` ; la réponse JSON ne pose pas de cookie. |
| Une requête Bearer sans CSRF est acceptée sur mutation | Voulu : sans cookie, pas de CSRF possible. La garde refuse un Bearer accompagné d'un cookie de session. |
| Un client installé face à un contrat modifié | Expand/contract obligatoire ; la période de recouvrement est écrite dans la PR qui retire. |

## Liens

- `ARC-2` — ce que la session porte (tenant, rôle)
- Règles impératives : [`../../apps/api/CLAUDE.md`](../../apps/api/CLAUDE.md) § _Frozen architecture decisions_ et § _Invariants_
- Tickets : `5-authentification` (API), puis le ticket de session de chaque client
