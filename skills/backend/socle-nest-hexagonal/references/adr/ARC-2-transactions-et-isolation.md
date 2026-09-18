# ARC-2 — Transactions, isolation des données et rôles

- Statut : **accepté**
- Date : {{DATE}}
- Portée : modèle de données, sécurité, couche d'accès aux données

> **Gabarit à deux sections, chacune à deux branches.** Pour chaque section, garder **une** branche, supprimer l'autre et ses marqueurs, puis supprimer ce paragraphe. Une ADR qui laisse une option ouverte n'a rien décidé.

## Contexte

Deux questions se posent avant la première table, et elles sont **indépendantes** :

1. **Le service isole-t-il des organisations clientes les unes des autres, dans une même base ?** (multi-tenance)
2. **Les autorisations sont-elles de la donnée administrable, ou du code ?** (catalogue de rôles)

Elles sont structurantes : la première décide de la signature du port de transaction, de la présence d'une colonne sur chaque table et de l'existence d'un gate CI ; la seconde décide d'où vient un droit et de ce qu'une session transporte. Les laisser ouvertes produit du code mort que quelqu'un finira par prendre pour une contrainte réelle.

<!-- ══ TENANT-A ══ -->
## Décision — mono-tenant

- **Aucune colonne `tenant_id`, aucune Row-Level Security, aucun `runInTenant`.** Le port de transaction est `IUnitOfWork.run(work)` : une frontière transactionnelle, et rien d'autre.
- **L'appartenance se prouve dans le use case**, explicitement, à l'intérieur de la transaction : une ressource appartient au compte authentifié ou la requête est refusée (`404` de préférence). Une clé étrangère n'est pas une preuve d'appartenance.
- La séparation des **deux rôles PostgreSQL** (runtime restreint / propriétaire pour les migrations) est **conservée** : le runtime n'a pas à pouvoir modifier le schéma.
- Le gate CI d'isolation est le **gate d'appartenance** : chaque route touchant une ressource possédée porte un test « le compte B est refusé ».

### Alternatives écartées

- **Multi-tenance « au cas où »** — une colonne et une politique par table, un gate de plus, une contrainte sur l'hébergement, pour un besoin qui n'existe pas. Le jour où il existe, c'est une réouverture de cette ADR : une migration et une revue de chaque accès, pas un drapeau.

### Conséquences

**Positives.** Modèle simple, aucune mécanique cachée. **Coûts.** Aucun filet : la vérification explicite **est** la protection, d'où le gate.
<!-- ══ /TENANT-A ══ -->
<!-- ══ TENANT-B ══ -->
## Décision — multi-tenant, isolation par Row-Level Security

- **Chaque table tenant porte `tenant_id NOT NULL`**, avec `ENABLE` **et** `FORCE ROW LEVEL SECURITY`, et une politique portant `USING` **et** `WITH CHECK`, fail-closed sur un réglage de session.
- Le runtime se connecte en rôle **`NOBYPASSRLS`** ; migrations et seed tournent en rôle **propriétaire**, qui contourne la RLS. **Jamais** de requête applicative avec le rôle propriétaire.
- **`IUnitOfWork.runInTenant(tenantId, work)`** est le seul chemin vers une donnée tenant, **lectures comprises**. Son adapter ouvre une transaction et pose le réglage en **LOCAL** (effacé au COMMIT, immunisé contre la réutilisation de connexion du pool).
- **La source du `tenantId` n'est jamais un en-tête ni un corps client.** Soit c'est une coordonnée d'URL **prouvée sous RLS** — à l'intérieur de la transaction, un `SELECT` sur la ressource cible doit la trouver, sinon 404 —, soit elle vient de la session authentifiée.
- Ce `SELECT` de preuve est **obligatoire** : **les contraintes de clé étrangère contournent la RLS**, donc sans lui une ligne du tenant B peut référencer une ressource du tenant A.
- Un test d'intégration anti-fuite prouve qu'une requête sous le tenant A ne voit rien du tenant B. C'est un **gate CI bloquant**, avec l'introspection SQL et le test de fuite de GUC (`pare-feu-ci.md`).

> La RLS est un **filet**, pas un permis d'être négligent : les repositories ciblent quand même les bonnes lignes, et l'appartenance **à l'intérieur** d'un tenant se prouve toujours dans le use case. Elle garantit qu'un bug ne se transforme pas en fuite entre tenants.

**Toute exception est une ADR**, nommant la table, pourquoi elle n'est pas tenant-scopée, et ce qui remplace la RLS comme preuve d'appartenance. Ces tables sont l'**allowlist versionnée** du gate.

### Alternatives écartées

- **`WHERE tenant_id = …` applicatif** — un oubli suffit, et rien ne le rattrape. La RLS déplace la garantie de la discipline vers la base.
- **Une base par tenant** — isolation forte, mais migrations et coûts d'exploitation multipliés par le nombre de tenants.
- **Un schéma par tenant (`search_path`)** — fragile avec un pool de connexions, et les migrations se rejouent par schéma.

### Conséquences

**Positives.** Un bug de filtre ne devient pas une fuite. L'isolation est prouvée par la machine, pas par la revue.

**Coûts.** Une colonne et une politique par table, un gate CI de plus, et une contrainte forte sur l'hébergement : la capacité de créer un rôle `NOBYPASSRLS` **doit être vérifiée avant de s'engager** sur un PostgreSQL managé.
<!-- ══ /TENANT-B ══ -->

<!-- ══ ROLES-A ══ -->
## Décision — sans gestion de rôles

- **Aucune table de rôles ni de permissions.** Une autorisation est une **règle métier écrite dans le use case**, fondée sur l'appartenance : le compte authentifié agit sur ce qui lui appartient.
- La session porte l'identité, et rien d'autre.

### Alternatives écartées

- **Un catalogue de rôles générique (RBAC)** — table `role`, table `permission`, jointure : des règles d'accès qui deviennent de la donnée, ni typée, ni testée, ni relue en PR, pour un besoin qui n'existe pas. Le jour où plusieurs profils apparaissent, c'est une réouverture de cette ADR.
<!-- ══ /ROLES-A ══ -->
<!-- ══ ROLES-B ══ -->
## Décision — rôles : catalogue fermé dans le code, affectation en données

- **Le catalogue des rôles est du code** : un tuple fermé déclaré une fois dans `packages/contracts/src/roles.ts` (`as const` + `z.enum`), typé, testé et relu en PR. Ce qu'un rôle autorise est une **règle écrite dans le use case**, jamais une ligne d'une table `permission`.
- **L'affectation est de la donnée** : qui porte quel rôle — et, si multi-tenant, dans quel tenant — vit en base, dans une table comme les autres (tenant-scopée si la section précédente l'exige).
- **Le rôle voyage avec la session authentifiée**, jamais dans un en-tête ni un corps client. Un client peut **masquer** une action selon le rôle : c'est de la présentation, l'API seule décide.
- **La liste des rôles n'est pas fixée ici** : elle est du métier et naît au grilling (`1-modeliser-le-domaine`). Cette ADR fixe la forme, pas le contenu.

### Alternatives écartées

- **RBAC administrable** (tables `role`, `permission`, jointure) — les règles d'accès deviennent de la donnée : ni typée, ni testée, ni relue en PR, et un `403` silencieux à la première ligne manquante.
- **Aucun rôle, autorisation par appartenance seule** — écarté : le besoin de profils distincts est identifié dès l'amorçage.
<!-- ══ /ROLES-B ══ -->

## Liens

- Règles impératives correspondantes : [`../../apps/api/CLAUDE.md`](../../apps/api/CLAUDE.md) § _Frozen architecture decisions_ et § _Transactions_
- Gate CI correspondant : [`../methode/pare-feu-ci.md`](../methode/pare-feu-ci.md) § _Gate — isolation des données_
- La forme de l'authentification et ce que la session transporte : `ARC-3` s'il existe
