# Critères de la revue adversariale

Liste **fermée** : le relecteur ne rend que des écarts rattachés à l'un de ces critères, et chaque constat cite la règle écrite qu'il applique. Les critères renvoient aux règles du projet sans les recopier : le sous-agent les lit à la source. Une nouvelle ADR qui pose une règle de code ajoute son critère ici, ou en complète un.

Les critères `S` viennent du socle ; les critères `P` sont ceux du projet, ajoutés au fil des décisions. Un critère qui ne s'applique pas au projet (pas de mobile, mono-tenant) se retire.

```text
Critères (liste fermée) :

S1  Sens des dépendances — apps/api/CLAUDE.md § « Golden rule — dependency direction », § « Layer rules ».
    domain/ et application/ n'importent ni infrastructure/, ni NestJS, ni Kysely, ni une lib d'I/O ;
    un cas d'usage parle à un port, jamais à un adaptateur ; un contrôleur ne porte pas de logique
    métier ; les alias de chemin, jamais de chemin relatif qui remonte.
S2  Contrats partagés — packages/CLAUDE.md, apps/api/CLAUDE.md § « Contract boundaries ». Un corps
    d'écriture et une forme de réponse sont des schémas Zod de packages/contracts ; aucune
    interface locale qui les double ; un type de ligne (src/db/types.ts) ne sort jamais du repository ;
    un client n'importe que contracts.
S3  Transactions et isolation des tenants (multi-tenant seulement) — apps/api/CLAUDE.md
    § « Transactions », .claude/rules/isolation-tenant.md. Tout accès à une donnée de tenant passe
    par runInTenant ; le tenantId ne vient jamais d'un en-tête ni d'un corps ; une coordonnée d'URL
    est prouvée par un SELECT dans la transaction ; réglage de session LOCAL seulement ; une table
    nouvelle porte tenant_id et sa politique RLS, ou entre dans l'allowlist avec son ADR ;
    l'appartenance à l'intérieur du tenant se prouve dans le cas d'usage.
S4  Erreurs — apps/api/CLAUDE.md § « Error handling ». Une erreur de domaine est une DomainError
    traduite par le filtre global ; code <MODULE>_<DESCRIPTION>, message en français ; jamais une
    réponse d'erreur formatée à la main ni un statut HTTP décidé dans le domaine.
S5  Migrations et types — .claude/rules/migrations-kysely.md. Un changement de schéma vient avec sa
    migration et src/db/types.ts régénéré dans le même commit ; une migration existante n'est jamais
    éditée ; un changement destructif est explicite ; une opération qui casse le code déployé se fait
    en expand puis contract ; SQL brut par le tag sql seulement, dans un repository ou une migration.
S6  Typage — apps/api/CLAUDE.md, apps/web/CLAUDE.md. Aucun any (ni as any, ni paramètre implicite),
    aucun non-null assertion sans raison écrite, aucun @ts-ignore.
S7  Tests — .claude/rules/tests.md. Un repository se teste contre un vrai Postgres ; un cas d'usage
    avec ses ports mockés ; une route a son test de refus (401, 403, 404 hors périmètre) ; aucun test
    creux (sans assertion, toBeDefined seul, assertion sous condition, skip sans ticket, setTimeout) ;
    un test qui couvre une règle du registre porte son identifiant entre crochets en tête de son nom
    ([RULE_<CTX>_<TRI>-<n>], plusieurs permis, un sur un describe vaut pour ses tests), jamais un
    test de recette.
S8  Injection — apps/api/CLAUDE.md § « Dependency injection ». Tout provider nouveau ou nouvellement
    injecté est fourni dans chaque graphe qui le consomme (AppModule, et le graphe d'un worker s'il
    existe) ; un port est injecté par son token ; pas de forwardRef ni de dépendance circulaire
    (check:cycles) ; jamais un new Logger(), un new Date() ou un uuid() en dur à la place du port.
S9  Concurrence et idempotence — apps/api/CLAUDE.md § « Invariants ». Une règle « au plus N »,
    « une seule », « pas déjà » est tenue par une contrainte unique ou sous transaction avec verrou,
    jamais par une lecture puis une écriture hors verrou ; un job rejoué ou un webhook renvoyé ne
    double ni envoi, ni ligne, ni montant.
S10 Configuration et secrets — apps/api/CLAUDE.md § « Frozen architecture decisions ». L'environnement
    est lu par le schéma Zod de config, jamais par process.env ailleurs ; aucun secret, aucune URL
    d'environnement en dur ; une variable nouvelle est déclarée dans .env.example.
S11 Langue des identifiants — ARC-4, GLOSSARY.md. Identifiants en anglais, d'après les noms en code du
    glossaire ; prose, messages et textes d'interface en français ; un terme du domaine nouveau sans
    entrée au glossaire est un écart. Hors règle : les scripts posés par le plugin maj-skills
    (scripts/docs, verify, chaine, agent, github), copies verbatim en français (ARC-4 § exception).
S12 Clients web et mobile — apps/web/CLAUDE.md, apps/mobile/CLAUDE.md. Une route est mince et délègue
    à une feature ; aucun import entre features (hors dette déclarée) ; sens unique lib → components →
    features → app ; un seul client HTTP ; un formulaire valide par le schéma partagé ; l'état serveur
    par TanStack Query, jamais un cache maison.
S13 Parité web et mobile (si les deux existent) — une évolution d'un client est répercutée sur
    l'autre, ou nommée comme trou de parité dans la PR ; les deux lisent le même schéma.
S14 Chemins sensibles — .claude/chaine.json (cheminsSensibles). Un diff qui introduit du code
    d'authentification, de droits, de chiffrement, de paiement ou d'export de données hors des chemins
    déclarés est un écart : le chemin manque à la liste, et /security-review n'a pas tourné.
```

## Critères du projet

```text
P1  <sujet> — <règle : fichier § « … » ou ADR>. <ce qu'on vérifie, en deux lignes>.
```
