# Modéliser le domaine

Status: needs-info
Type: grilling

Le socle technique tourne, mais **rien du métier n'est connu** : `CONTEXT.md` est vide, `application/` ne contient aucun use case, `docs/metier/` n'existe pas.

**C'est le ticket bloquant.** Presque tous les autres en dépendent : on ne choisit pas une stratégie d'authentification, un modèle de données ou un gate CI sans savoir ce que le service fait.

## Ce qu'il faut produire

- Le **glossaire** (`CONTEXT.md`) — un terme entre quand il est tranché, pas avant.
- Le **registre des règles métier** (`docs/metier/regles/`), identifiants stables, cycle `candidate → validée`.
- Les **questions ouvertes** (`docs/questions-ouvertes.md`), datées et sourcées.

## Déjà tranché — ne pas rouvrir, mais alimenter

<!-- ══ TENANT-B ══ -->
- `ARC-2` : le service est **multi-tenant**, isolé par RLS. Le grilling doit dire **ce qu'est un tenant** pour ce projet — une organisation ? un client ? un site ? — et quelles données sont **hors tenant** (référentiels partagés), chacune justifiée par une ADR. La forme est fixée, pas le contenu.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
- `ARC-2` : les **rôles** ont un catalogue fermé dans le code. Le grilling doit produire **la liste des rôles** et, pour chacun, les règles qu'il autorise — ce sont des règles métier du registre, pas une table. Le catalogue naît dans `packages/contracts/src/roles.ts` avec le premier rôle validé.
<!-- ══ /ROLES-B ══ -->
- `ARC-3` s'il existe : les clients et la forme de leur authentification.

## Comment

`/grill-with-docs` sur les documents sources déposés dans `docs/sources/`. Protocole complet : `docs/methode/grilling.md`. Le projet est neuf, donc **architectural** : questions → approches → design → spec écrite.

**Ne pas commencer à coder un domaine avant que ce ticket soit résolu.**

## Comments
