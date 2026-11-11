# SPEC_ALL_SOC-1.05 — Implémenter l'authentification

Status: needs-info
Type: task

Dépend de `SPEC_ALL_SOC-1.03`. La recette ci-dessous ne vaut **que pour un client navigateur**. Si un client a été installé, `SPEC_ALL_SOC-1.03` est devenu `ADR_ALL_ARC-3` : la forme est tranchée, ce ticket implémente et ne re-décide pas — remplacer ce paragraphe par un renvoi à `ADR_ALL_ARC-3` et passer le statut à `ready-for-human`.

## Recette navigateur (défaut, sans `X-Client-Type`)

- **Argon2id** pour les mots de passe.
- **JWT d'accès court** dans un cookie `__Host-`, httpOnly. Signature et vérification avec une **liste blanche d'algorithmes** (`algorithms: ["HS256"]`) — sans elle, confusion d'algorithme possible.
- **Refresh opaque, haché au repos**, avec **rotation et détection de réutilisation** : un rejeu révoque toute la famille.
- **CSRF signed double-submit** : HMAC de l'identifiant de session, en-tête `X-CSRF-Token`. La garde exige un `Origin` égal à l'origine attendue et **rejette aussi son absence** sur mutation.
- **Gardes globales** : toute route est authentifiée par défaut, toute mutation authentifiée exige Origin + CSRF. Les méthodes sûres (`GET`/`HEAD`/`OPTIONS`) sautent le CSRF. L'exemption est explicite et **chaque exemption est un point de revue**.
- Ordre d'exécution : authentification **puis** CSRF.
<!-- ══ TENANT-B ══ -->
- **La session porte le `tenantId`** (`ADR_ALL_ARC-2`) : il ne vient jamais d'un en-tête ni d'un corps client. Un compte rattaché à plusieurs tenants choisit son tenant actif par un endpoint dédié, qui réémet la session.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
- **La session porte le rôle** (`ADR_ALL_ARC-2`), lu dans la table d'affectation à l'authentification et à chaque refresh. Le catalogue est le `z.enum` de `packages/contracts/src/roles.ts`.
<!-- ══ /ROLES-B ══ -->

## Recette mobile — si un client mobile est installé (`X-Client-Type: mobile`)

> Supprimer cette section s'il n'y a pas de client mobile. Sinon elle décline `ADR_ALL_ARC-3` : **mêmes endpoints** `/auth/*`, l'en-tête choisit la forme de la réponse, jamais la logique.

- La réponse d'authentification est **JSON** (`{ access, refresh }`) au lieu de `Set-Cookie` ; les appels portent `Authorization: Bearer`.
- **Ni cookie, ni CSRF.** La garde CSRF ignore une requête Bearer, mais refuse (`400`) un Bearer accompagné d'un cookie de session.
- Rotation et détection de réutilisation du refresh : **le même code** que pour le navigateur — seule la forme de la réponse change.
- Valeur inconnue de `X-Client-Type` → `400`. En-tête absent → navigateur.
- Tests `supertest` **avec et sans** l'en-tête, pour chaque route `/auth/*`.

## Cadence des endpoints publics

Compteur en base, hors session (la cadence se mesure **avant** toute authentification), incrémenté par UPSERT atomique. **Double clef** : par IP et par cible visée, **cible hachée** — le compteur ne stocke pas la liste des adresses. Refus **générique** (`429`, message identique quel que soit le cas, jamais un oracle), posé dans une garde **avant** la validation et avant tout hachage. **Fail-open tracé** : si le compteur tombe, la requête passe et l'erreur part au journal — une panne du compteur ne doit pas devenir un déni de service de l'authentification.

Dépend de `SPEC_ALL_SOC-1.02` : le comptage par IP exige un `req.ip` fiable.

## Comments
