# Implémenter l'authentification

Status: needs-info
Type: task

Bloqué par : `3-client-et-forme-de-l-authentification`. La recette ci-dessous ne vaut **que pour un client navigateur**.

## Recette (si navigateur)

- **Argon2id** pour les mots de passe.
- **JWT d'accès court** dans un cookie `__Host-`, httpOnly. Signature et vérification avec une **liste blanche d'algorithmes** (`algorithms: ["HS256"]`) — sans elle, confusion d'algorithme possible.
- **Refresh opaque, haché au repos**, avec **rotation et détection de réutilisation** : un rejeu révoque toute la famille.
- **CSRF signed double-submit** : HMAC de l'identifiant de session, en-tête `X-CSRF-Token`. La garde exige un `Origin` égal à l'origine attendue et **rejette aussi son absence** sur mutation.
- **Gardes globales** : toute route est authentifiée par défaut, toute mutation authentifiée exige Origin + CSRF. Les méthodes sûres (`GET`/`HEAD`/`OPTIONS`) sautent le CSRF. L'exemption est explicite et **chaque exemption est un point de revue**.
- Ordre d'exécution : authentification **puis** CSRF.
<!-- ══ TENANT-B ══ -->
- **La session porte le `tenantId`** (`ARC-2`) : il ne vient jamais d'un en-tête ni d'un corps client. Un compte rattaché à plusieurs tenants choisit son tenant actif par un endpoint dédié, qui réémet la session.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
- **La session porte le rôle** (`ARC-2`), lu dans la table d'affectation à l'authentification et à chaque refresh. Le catalogue est le `z.enum` de `packages/contracts/src/roles.ts`.
<!-- ══ /ROLES-B ══ -->

## Cadence des endpoints publics

Compteur en base, hors session (la cadence se mesure **avant** toute authentification), incrémenté par UPSERT atomique. **Double clef** : par IP et par cible visée, **cible hachée** — le compteur ne stocke pas la liste des adresses. Refus **générique** (`429`, message identique quel que soit le cas, jamais un oracle), posé dans une garde **avant** la validation et avant tout hachage. **Fail-open tracé** : si le compteur tombe, la requête passe et l'erreur part au journal — une panne du compteur ne doit pas devenir un déni de service de l'authentification.

Dépend de `2-hebergement-et-trust-proxy` : le comptage par IP exige un `req.ip` fiable.

## Comments
