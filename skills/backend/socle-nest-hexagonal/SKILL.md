---
name: socle-nest-hexagonal
description: Amorce un backend NestJS hexagonal complet dans un monorepo — le service, ses paquets de contrats, ses règles d'architecture verrouillées par la machine, sa documentation et les tickets de ce qui reste à trancher. Pose la racine du monorepo via socle-monorepo si elle n'existe pas. Use when starting a new backend project, scaffolding a NestJS service, or adding an API to an existing monorepo.
---

# Socle NestJS hexagonal

Amorce un backend NestJS qui démarre, ses règles d'architecture, ses gardes de couche et ce qui reste à trancher — dans un monorepo dont la racine est posée par `/maj-skills:socle-monorepo`.

**Ce socle ne contient aucune règle métier**, et n'en contiendra jamais : il ne porte que de la configuration, de l'architecture et de la méthode. Le métier arrive après, par le grilling.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders : ce sont des fichiers éprouvés, pas des suggestions à reformuler.

## Avant de commencer — vérifier le terrain

1. **La racine est-elle posée ?** Si `pnpm-workspace.yaml` est absent, **invoquer `/maj-skills:socle-monorepo`** avec `api` comme seul service : il pose la racine, l'outillage, la méthode, les contrats, puis revient ici. Ne pas poser la racine à la main.
2. **Les contrats sont-ils posés ?** Si `packages/contracts/` est absent, **invoquer `/maj-skills:socle-contrats`** : l'API en dépend (`ErreurDto`, document OpenAPI).
3. Si `apps/api/` existe déjà, **s'arrêter et demander** : appliquer le socle par-dessus écraserait des fichiers.
4. Les placeholders (`{{PROJET}}`, `{{PROJET_SNAKE}}`, `{{SCOPE}}`, `{{TITRE}}`, `{{DESCRIPTION}}`, `{{LANGUE}}`, `{{DATE}}`) sont ceux fixés par `socle-monorepo`. S'ils ne sont pas dans la conversation, les relire dans `package.json` (`name`, `description`) et `CLAUDE.md` (titre, langue).

## Étape 1 — la question

Une seule, avec sa recommandation, puis attendre :

**Multi-tenance et gestion de rôles** — _(Recommandé : **non** aux deux.)_ C'est la seule question structurante qui ne peut pas attendre : elle décide de la signature du port de transaction, de la présence d'une colonne sur chaque table et d'un gate CI. Les deux branches sont écrites dans [`references/adr/ARC-2-transactions-et-isolation.md`](references/adr/ARC-2-transactions-et-isolation.md) ; en garder **une**, supprimer l'autre.

> **Ne pas poser d'autres questions ici.** L'hébergement, la nature du client, l'authentification, la base de données : tout ça part en tickets à l'étape 4. Les poser maintenant, c'est demander d'arbitrer avant de savoir.

## Étape 2 — poser le service

Copier `references/` vers le dépôt selon cette table, puis substituer les placeholders **dans tous les fichiers copiés**.

| Source                              | Destination                                        |
| ----------------------------------- | -------------------------------------------------- |
| `references/squelette/apps/api/*`   | `apps/api/` — dont `eslint.rules.mjs`, chargé par l'ESLint racine |
| `references/squelette/compose.yaml` | `compose.yaml` (racine) — PostgreSQL local          |
| `references/api/CLAUDE.md`          | `apps/api/CLAUDE.md`                               |
| `references/api/docs/*`             | `apps/api/docs/`                                   |
| `references/adr/ARC-2-*`         | `docs/adr/` — **après avoir tranché la branche**   |
| `references/tickets/*`              | `docs/features/socle/issues/`                      |

Puis **composer les fichiers de la racine** — chaque fragment s'insère **immédiatement au-dessus** du marqueur de sa zone, sans supprimer le marqueur :

| Fragment                                          | Fichier racine     | Zone                             |
| ------------------------------------------------- | ------------------ | -------------------------------- |
| `references/fragments/claude-md-routing.md`       | `CLAUDE.md`        | `<!-- socle:routing -->`          |
| `references/fragments/claude-md-avant-code.md`    | `CLAUDE.md`        | `<!-- socle:avant-code -->`       |
| `references/fragments/readme-ou-vit-quoi.md`      | `README.md`        | `<!-- socle:ou-vit-quoi -->`      |
| `references/fragments/readme-prerequis.md`        | `README.md`        | `<!-- socle:prerequis -->`        |
| `references/fragments/readme-demarrage.md`        | `README.md`        | `<!-- socle:demarrage -->`        |
| `references/fragments/readme-commandes.md`        | `README.md`        | `<!-- socle:commandes -->`        |
| `references/fragments/readme-lire-ensuite.md`     | `README.md`        | `<!-- socle:lire-ensuite -->`     |
| `references/fragments/readme-regles.md`           | `README.md`        | `<!-- socle:regles -->`           |
| `references/fragments/readme-regles-transverses.md` | `README.md`      | `<!-- socle:regles-transverses -->` |
| `references/fragments/env.example.txt`            | `.env.example`     | **en fin de fichier**             |
| `references/fragments/prettierignore.txt`         | `.prettierignore`  | **en fin de fichier**             |

**Ne pas créer** `apps/api/src/db/` ni `docs/architecture/` : ils naissent avec leur premier fichier.

Détail de ce que contient le squelette et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Étape 3 — vérifier, puis seulement conclure

Ne pas annoncer que ça marche sans l'avoir constaté :

```bash
pnpm install
pnpm --filter @<scope>/<projet>-api openapi:emit   # émet apps/api/openapi.json — AVANT le premier check, sinon openapi:check le déclare absent
pnpm check                                         # build · lint · typecheck · cycles · gates (check:arch + openapi:check)
pnpm --filter @<scope>/<projet>-api dev            # puis curl localhost:3000/health
```

`openapi.json` est généré, jamais édité à la main, et **committé** : c'est le témoin que `openapi:check` compare aux schémas Zod à chaque `pnpm check`.

Vérifier aussi que **les gardes de couche mordent** — c'est ce qui distingue une règle écrite d'une règle appliquée. Créer un fichier de sonde important `Logger` depuis `@nestjs/common` dans `application/`, confirmer que `pnpm lint` échoue, **puis le supprimer**. Si le lint ne mord pas, c'est que `apps/api/eslint.rules.mjs` n'est pas chargé par l'ESLint racine.

Contrôler enfin qu'il ne reste **aucun placeholder `{{…}}`** (chercher `{{[A-Z_]+}}` — les doubles accolades JSX ne comptent pas) dans les fichiers posés, et que les marqueurs `<!-- socle:… -->` sont toujours dans `README.md` et `CLAUDE.md`.

## Étape 4 — déposer les tickets

Les gabarits de `references/tickets/` deviennent `docs/features/socle/issues/`, dans la plage `4`–`6` réservée à l'API : couche base de données, authentification, journal d'audit. Les tickets transverses (`1` domaine, `2` hébergement, `3` client, `7` CI, `8` observabilité, `9` règles métier) sont déposés par `socle-monorepo`.

**Adapter chaque ticket à ce qui est déjà connu du projet.** Un ticket qui pose une question déjà tranchée est du bruit : le supprimer, ou le convertir en ADR. Si `socle-monorepo` a converti le ticket `3` en ADR (un client web ou mobile est installé), faire pointer `5` vers cette ADR.

**Ne pas commiter** : l'historique est écrit par `socle-monorepo` à la fin, une fois tous les services posés.

## Ce que ce skill ne fait pas

- **Aucune règle métier.** Ni entité, ni use case, ni code d'erreur de domaine. La table de correspondance code → statut HTTP est livrée **vide**, avec sa procédure d'ajout.
- **Aucune couche base de données.** L'environnement valide `DATABASE_URL`, mais rien ne s'y connecte : le schéma dépend d'un domaine qui n'existe pas encore. C'est le ticket `4`.
- **Aucun front.** Un client a son propre skill.
- **Aucune décision d'hébergement**, donc `trust proxy` reste non configuré — le défaut échoue du bon côté.
- **Ni racine, ni méthode, ni outillage** : c'est `socle-monorepo`. **Ni contrats** : c'est `socle-contrats`, l'API les consomme.

## Anti-patterns

| Tentation                                            | Pourquoi c'est faux                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| « Je reformule les gabarits à ma sauce »             | Ce sont des règles éprouvées. Les paraphraser en perd la précision.                          |
| « Je pose la racine moi-même, c'est trois fichiers » | La racine est une seule source, dans `socle-monorepo`. Deux copies divergent.                |
| « Je mets mes règles de couche dans l'ESLint racine » | La racine ne connaît aucune stack. Elles vivent dans `apps/api/eslint.rules.mjs`, un bloc par couche. |
| « Je pose `trust proxy: 1`, c'est l'usage »          | C'est inventer une topologie. Trop haut, l'attaquant choisit son IP.                         |
| « Je tranche l'authentification tout de suite »      | Sa forme dépend du client. Cookies pour un navigateur, jetons pour du mobile, rien pour un pass. |
| « J'annonce que le socle tourne »                    | Pas avant `pnpm check` vert et `/health` qui répond 200.                                      |
