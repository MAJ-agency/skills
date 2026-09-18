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

## Ce qui suit ce ticket : une balle traçante, pas des couches

La sortie du grilling n'est pas « le domaine modélisé » puis les tickets de couche un à un. C'est **une première tranche verticale** : un use case réel, du schéma dans `packages/contracts` à l'écran de chaque client, en passant par le port, le use case, l'adapter et la table — avec **juste ce que ce chemin exige** des tickets de couche (`4`, `5`, et les sessions des clients). Ces tickets se dimensionnent à la tranche ; ils ne se finissent pas avant elle. Découpage : `/mattpocock-skills:to-tickets` sur la spec issue du grilling ; méthode : `docs/methode/conception.md` § _La balle traçante_.

## Comments
