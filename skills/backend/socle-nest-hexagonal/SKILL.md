---
name: socle-nest-hexagonal
description: Amorce un backend NestJS hexagonal complet dans un dépôt vide — configuration, règles d'architecture, méthode de travail, documentation structurée, outillage agent, et les tickets de ce qui reste à trancher. Use when starting a new backend project, scaffolding a NestJS service, or bootstrapping a repository's engineering rules and documentation structure.
---

# Socle NestJS hexagonal

Amorce un dépôt **vide** avec un backend NestJS qui démarre, ses règles d'architecture, sa méthode de travail, sa documentation structurée et son outillage agent — puis dépose en tickets tout ce qui reste à trancher.

**Ce socle ne contient aucune règle métier**, et n'en contiendra jamais : il ne porte que de la configuration, de l'architecture et de la méthode. Le métier arrive après, par le grilling.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders : ce sont des fichiers éprouvés, pas des suggestions à reformuler.

## Avant de commencer — vérifier le terrain

Ce skill **écrit beaucoup de fichiers**. Il suppose un dépôt vide ou quasi vide.

1. `git status` et `ls -A`. Si le dépôt contient déjà du code, **s'arrêter et demander** : appliquer le socle par-dessus l'existant écraserait des fichiers.
2. Si ce n'est pas un dépôt git, proposer `git init -b main`.

## Étape 1 — les cinq questions

Poser **la frontière en un seul tour**, chacune avec une recommandation, puis attendre. Ne pas enchaîner question par question.

1. **Nom du projet** (kebab-case) — sert au nom du dépôt, au titre, aux paquets. Ex. `licence-wallet`.
2. **Portée npm** (sans `@`) — ex. `ffsa` → `@ffsa/licence-wallet-api`.
3. **Titre lisible et description en une phrase** — pour le README et le document OpenAPI.
4. **Langue de la documentation** — français ou anglais. _(Recommandé : celle de l'équipe. `apps/api/CLAUDE.md` et `ARCHITECTURE_GUIDELINES.md` restent en anglais dans les deux cas, pour rester diffables avec le gabarit.)_
5. **Multi-tenance et gestion de rôles** — _(Recommandé : **non** aux deux.)_ C'est la seule question structurante qui ne peut pas attendre : elle décide de la signature du port de transaction, de la présence d'une colonne sur chaque table et d'un gate CI. Les deux branches sont écrites dans [`references/adr/ARC-0002-transactions-et-isolation.md`](references/adr/ARC-0002-transactions-et-isolation.md) ; en garder **une**, supprimer l'autre.

> **Ne pas poser les autres questions ici.** L'hébergement, la nature du client, l'authentification, la base de données : tout ça part en tickets à l'étape 5. Les poser maintenant, c'est demander d'arbitrer avant de savoir.

Les placeholders des gabarits : `{{PROJET}}` (kebab), `{{PROJET_SNAKE}}` (snake, pour les identifiants SQL), `{{SCOPE}}`, `{{TITRE}}`, `{{DESCRIPTION}}`, `{{LANGUE}}`, `{{DATE}}` (AAAA-MM-JJ).

## Étape 2 — poser le socle

Copier `references/` vers le dépôt selon cette table, puis substituer les placeholders **dans tous les fichiers copiés**.

| Source                                | Destination                              |
| ------------------------------------- | ---------------------------------------- |
| `references/squelette/racine/*`       | racine du dépôt — **`gitignore` se copie en `.gitignore`** (il est stocké sans point pour ne pas s'appliquer au dépôt du skill lui-même) |
| `references/squelette/husky/*`        | `.husky/` (les rendre exécutables)        |
| `references/squelette/apps/api/*`     | `apps/api/`                               |
| `references/squelette/packages/*`     | `packages/`                               |
| `references/methode/*`                | `docs/methode/`                           |
| `references/api/CLAUDE.md`            | `apps/api/CLAUDE.md`                      |
| `references/api/docs/*`               | `apps/api/docs/`                          |
| `references/adr/ARC-0001-*`           | `docs/adr/`                               |
| `references/adr/ARC-0002-*`           | `docs/adr/` — **après avoir tranché la branche** |
| `references/tickets/*`                | `docs/features/socle/issues/`             |
| `references/sources/README.md`        | `docs/sources/README.md`                  |

**Ne pas créer** `docs/metier/`, `docs/architecture/` ni `docs/features/<autre>/` : ils naissent avec leur premier document.

Détail de ce que contient le squelette et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Étape 3 — installer l'outillage

**graphify** — graphe de connaissance du dépôt, tenu à jour par des hooks git :

```bash
uv tool install graphifyy && graphify install && graphify claude install && graphify hook install
```

`graphify claude install` pose la section `## graphify` dans `CLAUDE.md` **et** les hooks `PreToolUse`. `graphify hook install` pose les hooks git — d'où les relais `post-commit` / `post-checkout` du squelette : Husky détourne `core.hooksPath`, donc sans relais git ignorerait les hooks de graphify. **Vérifier que le relais répond** après `pnpm install` : `sh .husky/post-commit`.

**Les plugins de skills** — vérifier ce qui est déjà installé (`claude plugin list`) avant d'installer :

```bash
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install mattpocock-skills@claude-plugins-official
claude plugin install superpowers@claude-plugins-official
```

Si une commande échoue (permissions, réseau, session non interactive), **le dire et donner la commande à jouer à la main** — ne pas faire comme si c'était passé.

## Étape 4 — configurer les skills Matt Pocock

**Invoquer `/mattpocock-skills:setup-matt-pocock-skills`** — ne pas écrire `docs/agents/` à la main.

Répondre avec les valeurs du socle :

- **Tracker** : markdown local, mais **corriger le chemin** — le gabarit amont propose `.scratch/`, or **toute la documentation vit sous `docs/`**. Le tracker est `docs/features/<feature>/`. Si le dépôt a déjà un remote GitHub, choisir GitHub à la place.
- **Labels de triage** : les cinq rôles par défaut.
- **Contexte** : unique. `pnpm-workspace.yaml` signale des paquets, pas des contextes métier — ne pas se laisser piéger par ce faux positif.

Puis vérifier trois points que la skill amont ne connaît pas :

1. `docs/agents/` et `docs/features/<slug>/spec.md` + `issues/` figurent bien dans les **exclusions** de `docs/methode/nomenclature.md`, sinon ces fichiers violent la nomenclature du dépôt.
2. `docs/agents/domain.md` **renvoie** vers `docs/methode/decisions.md` et `nomenclature.md` pour les règles d'écriture au lieu de les répéter.
3. Les ADR se citent `ARC-0001`, pas `ADR-0001` : le gabarit amont suppose la numérotation plate.

> **Si la skill amont ne peut pas tourner** (plugin absent, session non interactive), copier `references/agents/*` vers `docs/agents/` : ce sont les mêmes réponses, déjà corrigées sur ces trois points. Le dire explicitement plutôt que de laisser `CLAUDE.md` pointer vers des fichiers absents.

## Étape 5 — déposer les tickets

Les gabarits de `references/tickets/` deviennent `docs/features/socle/issues/`. Ils portent ce que le socle a **délibérément** laissé ouvert : modélisation du domaine, hébergement et `trust proxy`, nature du client et forme de l'authentification, couche base de données, journal d'audit, pare-feu CI, observabilité, registre des règles métier.

**Adapter chaque ticket à ce qui est déjà connu du projet.** Un ticket qui pose une question déjà tranchée est du bruit : le supprimer, ou le convertir en ADR. Si le contexte appelle des tickets absents des gabarits — une intégration amont, une contrainte réglementaire — **en écrire**, dans le même format.

Écrire aussi `docs/features/socle/spec.md` : une page qui dit ce qu'est le socle, ce qu'il ne fait pas, et dans quel ordre attaquer les tickets.

## Étape 6 — vérifier, puis seulement conclure

Ne pas annoncer que ça marche sans l'avoir constaté :

```bash
pnpm install
pnpm check                                      # build · lint · typecheck · cycles
pnpm --filter @<scope>/<projet>-api check:arch  # domain+application sans infrastructure
pnpm --filter @<scope>/<projet>-api openapi:emit
pnpm --filter @<scope>/<projet>-api dev         # puis curl localhost:3000/health
```

Vérifier aussi que **les gardes de couche mordent** — c'est ce qui distingue une règle écrite d'une règle appliquée. Créer un fichier de sonde important `Logger` depuis `@nestjs/common` dans `application/`, confirmer que le lint échoue, **puis le supprimer**.

Contrôler enfin qu'aucun lien markdown n'est cassé, et qu'il ne reste **aucun placeholder `{{…}}`** dans le dépôt généré.

## Étape 7 — l'historique

Des commits qui racontent le projet, pas la séance. Conventional commits, dans la langue du dépôt, corps replié à 100 caractères (commitlint le vérifie). Un découpage qui marche :

1. `chore: initialise le dépôt et son outillage` — **package.json en premier**, sinon commitlint n'a pas de configuration et le commit est refusé
2. `docs: établit la méthode de travail`
3. `docs(adr): consigne les décisions d'amorçage`
4. `docs(api): pose les règles d'architecture back`
5. `feat(api): amorce le service NestJS`
6. `docs: rédige le README, le guide agent et le glossaire`
7. `chore(agents): configure les skills` + `docs: dépose les tickets du socle`

Chaque commit doit laisser le dépôt **constructible**. Ne pas découper le service NestJS en morceaux qui ne compilent pas.

## Ce que ce skill ne fait pas

- **Aucune règle métier.** Ni entité, ni use case, ni code d'erreur de domaine. La table de correspondance code → statut HTTP est livrée **vide**, avec sa procédure d'ajout.
- **Aucune couche base de données.** L'environnement valide `DATABASE_URL`, mais rien ne s'y connecte : le schéma dépend d'un domaine qui n'existe pas encore. C'est le ticket `04`.
- **Aucun front.** Le jour où un client naît, ses règles se reprennent **en bloc**, pas à la carte.
- **Aucune décision d'hébergement**, donc `trust proxy` reste non configuré — le défaut échoue du bon côté.

## Anti-patterns

| Tentation                                            | Pourquoi c'est faux                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| « Je reformule les gabarits à ma sauce »             | Ce sont des règles éprouvées. Les paraphraser en perd la précision.                          |
| « Je pré-remplis `CONTEXT.md` avec le domaine »      | Le glossaire se construit au grilling, terme par terme. Le pré-remplir fige un non-dit.      |
| « J'invente des trigrammes métier »                  | Un trigramme désigne un sujet tranché. Seuls les trigrammes structurels sont posés d'avance. |
| « Je pose `trust proxy: 1`, c'est l'usage »          | C'est inventer une topologie. Trop haut, l'attaquant choisit son IP.                         |
| « Je crée `docs/metier/` et `docs/architecture/` »   | Les dossiers naissent avec leur premier document, jamais d'avance.                           |
| « Je tranche l'authentification tout de suite »      | Sa forme dépend du client. Cookies pour un navigateur, jetons pour du mobile, rien pour un pass. |
| « J'annonce que le socle tourne »                    | Pas avant `pnpm check` vert et `/health` qui répond 200.                                      |
