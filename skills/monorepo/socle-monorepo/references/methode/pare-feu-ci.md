# Pare-feu CI — les invariants sont vérifiés par la machine

Règle de configuration, non négociable.

> **Aucun invariant critique ne doit dépendre d'un relecteur.** Chacun est un test bloquant en CI.

Le raisonnement : à petite équipe, sans QA ni relecteur sécurité dédié, une régression sur un invariant critique est soit invisible à l'œil, soit détectable uniquement par un relecteur expert **et disponible** — deux conditions qu'on ne peut pas garantir. La revue humaine reste utile, mais elle ne **porte** aucun invariant critique.

---

## Règle d'activation par surface

C'est la nuance qui rend le dispositif praticable :

> **Un gate devient bloquant au sprint où apparaît la surface de code qu'il protège, et cette surface ne merge pas sans son gate.**

- Activer les 5 gates dès le premier sprint **teste du vide** : la surface n'existe pas, le gate donne une fausse assurance et freine le flux pour rien.
- Tant que la surface n'existe pas, le gate existe en **squelette** : structure de test présente, assertions vides ou minimales.
- **Aucun gate n'est jamais abandonné.** Un gate désactivé est une dette, pas une simplification.

---

## Catalogue des gates

Chaque gate protège **un** invariant. À définir précisément pour le projet une fois le grilling fait — les entrées ci-dessous sont le patron hérité, pas une liste close.

### Gate — isolation des données

Deux formes, selon la décision prise sur la multi-tenance ([`ARC-2`](../adr/ARC-2-transactions-et-isolation.md)). **Une seule s'applique — ne pas porter les deux.**

**Si mono-tenant (sans RLS) — le gate d'appartenance.** Il n'y a pas de filet : la vérification explicite dans le use case EST la protection. Le gate le prouve.

1. Pour chaque route touchant une ressource possédée, un cas « compte A demande la ressource de compte B » → refus (404 de préférence : ne pas révéler l'existence).
2. Aucune route de ce type sans son cas de refus. Une route ajoutée sans test d'appartenance est un trou.

**Si multi-tenant (avec RLS PostgreSQL) — le gate anti-fuite tenant.** Trois vérifications, jouées contre une base migrée :

1. **Introspection SQL.** Toute table du schéma `public` doit satisfaire : `relrowsecurity AND relforcerowsecurity` (RLS activée **et** forcée), colonne `tenant_id NOT NULL`, et des policies portant `USING` **et** `WITH CHECK`. Toute table non conforme doit figurer dans une **allowlist versionnée** — sinon échec.

```sql
-- échoue si une table public n'est ni RLS-forcée ni allowlistée
SELECT c.relname
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND NOT (c.relrowsecurity AND c.relforcerowsecurity)
  AND c.relname <> ALL(:allowlist);
```

2. **Test de fuite cross-tenant.** Sous un `withTenant(A)`, une lecture des données du tenant B renvoie **0 ligne** (fail-closed) ; une écriture violant le `WITH CHECK` est **rejetée**.
3. **Test de fuite de GUC.** Après `withTenant()`, le réglage de session **est réinitialisé** hors transaction. Plus un grep anti-`SET` non-`LOCAL` : tout `set_config(..., false)` fuirait entre requêtes sur une connexion poolée.

L'allowlist est **versionnée et revue** : son diff est visible en PR. C'est la parade au contournement par allowlist laxiste.

### Gate — anti-drift des sources de vérité

Les sources de vérité sont étanches et régénérables ; la CI échoue si l'une dérive.

- **Types data** (`kysely-codegen`) régénérés depuis la base migrée : `git diff` non vide → échec (schéma et types désynchronisés, ou édition manuelle de `types.ts`).
- **OpenAPI interne** généré depuis les schémas Zod : diff non vide → échec.
- **Frontières verrouillées** : `no-restricted-imports` / `eslint-plugin-boundaries` interdisent l'import de DTO externes hors des adapters et le mélange des univers de types.

### Gate — concurrence sur une ressource limitée

Patron applicable à tout compteur plafonné (places, quotas, tirages).

- Scénario **spike** (k6 ou équivalent) : rafale de tentatives au-delà de la capacité.
- **Assertion invariante** : `confirmés <= capacité` **toujours vraie** ; le surplus bascule dans l'état de repli prévu ; idempotence vérifiée (rejeu de la clé → pas de double effet).
- Gate lourd → relégué en **nightly**, les gates rapides restant en PR. Le pattern applicatif (UPDATE atomique conditionnel) est sûr par construction ; ce gate est un filet de non-régression.

### Gate — canal sûr de transition d'état

Patron applicable à toute transition sensible (un titre devient valide, un paiement est confirmé, un droit est accordé).

- Test asserttant qu'**aucun chemin** hors des canaux sûrs désignés (webhook signé, tâche planifiée) ne peut déclencher la transition. Un retour navigateur ne confirme jamais rien.
- Durcissement du webhook testé : signature sur le **`rawBody`** avec `timingSafeEqual`, anti-rejeu ±5 min, idempotence par `event_id UNIQUE … ON CONFLICT DO NOTHING`.

### Gate — accessibilité

> Applicable si le projet embarque une interface. Le RGAA est une **obligation légale** pour un service fédéral.

- **axe-core** sur les écrans clés, 0 violation de niveau bloquant.
- Vérifications propres au SPA : `<title>` par route, gestion du focus au changement de route, régions `aria-live`.
- **Chaque nouvelle vue entre dans le gate axe dès sa naissance.** Un gate au niveau des composants seuls donne une fausse assurance : les défauts d'assemblage (groupes de radios non étiquetés, changements d'étape silencieux) sont invisibles composant par composant.

### Gate — doc-drift

Même patron que l'anti-drift : la CI régénère la couche déterministe de la documentation et échoue si le diff est non vide.

```yaml
docs-drift:
  - pnpm docs:generate
  - git diff --exit-code <dossier généré> # non vide → rouge
```

Prérequis : des générateurs **déterministes** (tri stable, aucun horodatage dans la sortie). Un générateur flottant fait clignoter le gate, et un gate qui clignote finit ignoré.

### Gate — secrets

Analyse du dépôt à chaque PR (`gitleaks` ou équivalent), configuration versionnée. Les secrets vivent dans `.env` (gitignored) ; seul `.env.example` est commité.

---

## Récapitulatif de cadence

| Étape | Bloquants                               | Squelettes |
| ----- | --------------------------------------- | ---------- |
| S1    | anti-drift, secrets                     | les autres |
| S2-3  | + canal sûr, a11y (leur surface arrive) | —          |
| S3-4  | + concurrence (nightly)                 | —          |

À réviser au grilling en fonction des invariants réellement identifiés pour le projet.

---

## Garde locale — avant le push

En complément des gates CI, un hook Git `pre-push` (Husky, installé au `pnpm install`, donc partagé par toute l'équipe) rejoue le garde-fou complet **hors tests** :

```
build + lint + typecheck + check:cycles
```

Les tests en sont exclus parce qu'ils exigent Postgres ; ils restent à la CI. Le but est d'attraper à la seconde ce qui coûterait un aller-retour CI.

---

## Risques connus et parades

| Risque                                             | Parade                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| Contournement d'un gate par allowlist trop laxiste | Allowlist **versionnée et revue** — diff visible en PR                |
| Gate en nightly = détection différée               | Le pattern applicatif est sûr par construction ; le gate est un filet |
| Gates lents cassant le flux                        | Gates rapides en PR, gates lourds en nightly                          |
| Générateur non déterministe → gate qui clignote    | Tri stable, aucun horodatage dans la sortie                           |
| Surface nouvelle arrivée sans son gate             | Discipline C5 : la surface ne merge pas sans son gate                 |
