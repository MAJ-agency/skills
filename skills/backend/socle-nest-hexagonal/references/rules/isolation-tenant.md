<!-- ══ TENANT-B ══ -->
---
paths:
  - "apps/api/src/**"
  - "packages/contracts/src/**"
  - "apps/web/src/lib/**"
  - "apps/mobile/src/lib/**"
  - "scripts/db/**"
---

# Isolation des tenants

S'applique dès qu'on touche l'API, les contrats partagés, le client HTTP d'un client ou un seed. {{TITRE}} sert plusieurs organisations depuis une même base, isolées par Row-Level Security (`ADR_ALL_ARC-2`). Le mécanisme de transaction est dans `apps/api/CLAUDE.md` § « Transactions » ; cette fiche dit ce qui doit tenir **dans toutes les briques** pour qu'une organisation ne voie jamais une autre.

## Le tenant ne vient jamais du client

- Un client web ou mobile **n'envoie jamais** d'identifiant d'organisation : ni en-tête, ni corps, ni paramètre. Le tenant vient de la session authentifiée, ou d'une coordonnée d'URL **prouvée sous RLS** par un `SELECT` dans la transaction, sinon 404.
- Un schéma Zod de `packages/contracts` **ne porte pas** de champ `tenantId` ou `organizationId` dans un corps d'écriture. S'il apparaît dans une réponse, c'est une donnée affichée, jamais une donnée renvoyée à l'API.
- Les clés de cache TanStack Query des clients ne contiennent pas le tenant : la session le porte, le cache se vide à la déconnexion.

## Jamais un branchement sur une organisation

- **Aucun `if` sur le nom, le slug ou l'identifiant d'une organisation** dans le code, dans aucune brique. Ce qui diffère entre deux organisations passe par **les paramètres de l'organisation**, lus par le service de configuration, jamais par un `switch`.
- **Aucun identifiant d'organisation en dur** hors seeds et tests. Un identifiant en dur dans `src/` est une faute.
- Une règle métier qui dépend du tenant s'écrit une fois, paramétrée. Si un besoin ne s'exprime pas par un paramètre, on en discute avant de coder.

## Toute donnée d'organisation est sous RLS

- Chaque table qui porte une donnée d'organisation a `tenant_id NOT NULL`, `ENABLE` et `FORCE ROW LEVEL SECURITY`, une politique `USING` et `WITH CHECK` fail-closed sur le réglage de session (gabarit : `.claude/rules/migrations-kysely.md`).
- Les tables hors tenant sont une **allowlist versionnée**, chaque entrée justifiée par une ADR. Elle est vide au départ.
- Le rôle runtime de la base est `NOBYPASSRLS`. Le rôle propriétaire ne sert qu'aux migrations.
- RLS est un filet, pas une preuve : un repository cible les bonnes lignes explicitement, et l'appartenance **à l'intérieur** d'un tenant (cette ressource appartient à ce compte) se prouve dans le cas d'usage, avec son test de refus.
<!-- ══ ROLES-B ══ -->

## Rôles

- Le catalogue de rôles vit dans `packages/contracts/src/roles.ts`, `as const` et `z.enum`. L'affectation d'un rôle à un compte est une table tenant-scopée. Un client peut masquer un bouton ; **seule l'API décide**.
<!-- ══ /ROLES-B ══ -->

## Vérification

- Les trois tests d'isolation — fuite cross-tenant, fuite de GUC, introspection SQL — sont bloquants (`docs/methode/pare-feu-ci.md` § isolation).
- Un gate CI refuse les identifiants d'organisation en dur dans `src/` (à poser par le ticket `7-pare-feu-ci`, avec une liste d'exceptions qui ne peut que décroître).
- Toucher l'authentification ou l'adapter de `IUnitOfWork` → rejouer les trois tests d'isolation et les tests de refus par route avant de pousser.
<!-- ══ /TENANT-B ══ -->
