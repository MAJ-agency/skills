# ARC-0002 — Transactions et isolation des données

- Statut : **accepté**
- Date : {{DATE}}
- Portée : modèle de données, sécurité, couche d'accès aux données

> **Gabarit à deux branches.** Garder **une seule** des deux décisions ci-dessous et **supprimer l'autre**, ainsi que ce paragraphe. Une ADR qui laisse les deux options ouvertes n'a rien décidé.

## Contexte

Deux questions se posent avant la première table, et elles se répondent ensemble :

1. **Le service isole-t-il des organisations clientes les unes des autres ?** (multi-tenance)
2. **Les autorisations sont-elles de la donnée administrable, ou du code ?** (catalogue de rôles)

Elles sont structurantes : elles décident de la signature du port de transaction, de la présence d'une colonne sur chaque table, et de l'existence d'un gate CI. Les laisser ouvertes produit du code mort que quelqu'un finira par prendre pour une contrainte réelle.

<!-- ═══════════ BRANCHE A — mono-tenant (défaut) ═══════════ -->

## Décision — mono-tenant, sans gestion de rôles

- **Aucune colonne `tenant_id`**, aucune politique Row-Level Security.
- **`IUnitOfWork` est une frontière transactionnelle et rien d'autre** : `run(work)`.
- **Aucune table de rôles ni de permissions.** Une autorisation est une **règle métier écrite dans le use case**, pas une entrée dans une table.
- **La preuve d'appartenance est explicite, dans le use case, à l'intérieur de la transaction** : la ressource appartient au compte authentifié, ou la requête est refusée.

> **Le corollaire est la partie qui compte : il n'y a plus de filet.** Avec la RLS, une clause `WHERE` oubliée devient une requête vide, pas une fuite. Ici, **la vérification explicite EST la protection**. Elle n'est jamais optionnelle, jamais déduite d'une clé étrangère (une FK dit qu'une ligne existe, pas qu'elle est à vous), et chaque route qui touche une ressource possédée porte un test prouvant qu'un autre compte est refusé.

La séparation des **deux rôles PostgreSQL** (runtime restreint / propriétaire pour les migrations) est **conservée**. Elle ne sert pas que la RLS : le runtime n'a pas à pouvoir modifier le schéma.

### Alternatives écartées

- **Reprendre la RLS « au cas où »** — un `tenant_id` sur chaque table à valeur constante, trois mécaniques à porter, et un port dont la signature ment. On paie une abstraction pour un axe de variation qui n'existe pas.
- **Un catalogue de rôles générique (RBAC)** — table `role`, table `permission`, table de jointure, et des règles d'autorisation qui deviennent de la **donnée** plutôt que du code. La donnée n'est ni typée, ni testée, ni relue en PR.
- **Garder la décision ouverte** — produit du code mort qu'on finit par croire contraignant.

### Conséquences

**Positives.** Une colonne de moins partout, une politique de moins par table, un port honnête.

**Coûts.** **La perte du filet est le vrai coût.** Un oubli de filtre devient une fuite entre utilisateurs. Contrepartie exigée : preuve d'appartenance explicite + test de refus par route.

**Risques & parades.**

| Risque                                                       | Parade                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Lire une ressource par identifiant sans vérifier le porteur  | Test de refus obligatoire par route ; la revue le cherche explicitement        |
| « La FK garantit que c'est à lui »                           | Non : une FK prouve l'existence, pas l'appartenance                            |
| Un besoin de multi-tenance apparaît plus tard                | Reprise coûteuse (migration + tous les accès) — **c'est assumé**, pas ignoré   |
| Les autorisations se multiplient jusqu'à mériter un RBAC     | Signal d'alerte : si les règles d'accès dépassent la poignée, rouvrir cette ADR |

<!-- ═══════════ BRANCHE B — multi-tenant ═══════════ -->

## Décision — multi-tenant, isolation par Row-Level Security

- **Chaque table tenant porte `tenant_id NOT NULL`**, avec `ENABLE` **et** `FORCE ROW LEVEL SECURITY`, et une politique portant `USING` **et** `WITH CHECK`, fail-closed sur un réglage de session.
- Le runtime se connecte en rôle **`NOBYPASSRLS`** ; migrations et seed tournent en rôle **propriétaire**, qui contourne la RLS. **Jamais** de requête applicative avec le rôle propriétaire.
- **`IUnitOfWork.runInTenant(tenantId, work)`** est le seul chemin vers une donnée tenant. Son adapter ouvre une transaction et pose le réglage en **LOCAL** (effacé au COMMIT, immunisé contre la réutilisation de connexion du pool).
- **La source du `tenantId` n'est jamais un en-tête ni un corps client.** Soit c'est une coordonnée d'URL **prouvée sous RLS** — à l'intérieur de la transaction, un `SELECT` sur la ressource cible doit la trouver, sinon 404 —, soit elle vient de la session authentifiée.
- Ce `SELECT` de preuve est **obligatoire** : **les contraintes de clé étrangère contournent la RLS**, donc sans lui une ligne du tenant B peut référencer une ressource du tenant A.
- Un test d'intégration anti-fuite prouve qu'une requête sous le tenant A ne voit rien du tenant B. C'est un **gate CI bloquant**.

> La RLS est un **filet**, pas un permis d'être négligent : les repositories ciblent quand même les bonnes lignes explicitement. Elle garantit qu'un bug ne se transforme pas en fuite.

**Toute exception est une ADR**, nommant la table, pourquoi elle n'est pas tenant-scopée, et ce qui remplace la RLS comme preuve d'appartenance. Une table lisible sans contexte tenant **ne prouve plus l'appartenance en lecture** — tout code qui a besoin de cette preuve doit filtrer explicitement.

### Alternatives écartées

- **`WHERE tenant_id = …` applicatif** — un oubli suffit, et rien ne le rattrape. La RLS déplace la garantie de la discipline vers la base.
- **Une base par tenant** — isolation forte, mais migrations et coûts d'exploitation multipliés par le nombre de tenants.

### Conséquences

**Positives.** Un bug de filtre ne devient pas une fuite. L'isolation est prouvée par la machine, pas par la revue.

**Coûts.** Une colonne et une politique par table, un gate CI de plus, et une contrainte forte sur l'hébergement : la capacité de créer un rôle `NOBYPASSRLS` **doit être vérifiée avant de s'engager** sur un PostgreSQL managé.

## Liens

- Règles impératives correspondantes : [`../../apps/api/CLAUDE.md`](../../apps/api/CLAUDE.md) § _Frozen architecture decisions_
- Gate CI correspondant : [`../methode/pare-feu-ci.md`](../methode/pare-feu-ci.md) § _Gate — isolation des données_
