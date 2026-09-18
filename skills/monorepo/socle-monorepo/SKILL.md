---
name: socle-monorepo
description: Amorce un monorepo pnpm/Turborepo complet dans un dépôt vide — racine, hooks git, méthode de travail, documentation structurée, outillage agent (graphify, skills Matt Pocock) — puis installe les services choisis (api, et à venir web, mobile) en invoquant leur skill. Use when starting a new project, scaffolding a monorepo, or bootstrapping a repository's engineering rules and documentation structure.
---

# Socle monorepo

Amorce un dépôt **vide** avec la racine d'un monorepo qui tient : configuration pnpm/Turborepo, hooks git, méthode de travail, documentation structurée, outillage agent — puis **installe les services que l'utilisateur choisit** en invoquant le skill de chacun, et dépose en tickets tout ce qui reste à trancher.

**Ce socle ne contient aucune règle métier**, et n'en contiendra jamais : il ne porte que de la configuration, de l'architecture et de la méthode. Le métier arrive après, par le grilling.

**Ce socle ne connaît aucune stack de service.** La racine est générique ; c'est chaque skill de service qui pose ses règles, ses fichiers et ses tickets. Voir [le contrat d'un skill de service](#le-contrat-dun-skill-de-service).

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders : ce sont des fichiers éprouvés, pas des suggestions à reformuler.

## Avant de commencer — vérifier le terrain

Ce skill **écrit beaucoup de fichiers**. Il suppose un dépôt vide ou quasi vide.

1. `git status` et `ls -A`. Si le dépôt contient déjà du code, **s'arrêter et demander** : appliquer le socle par-dessus l'existant écraserait des fichiers.
2. Si ce n'est pas un dépôt git, proposer `git init -b main`.
3. Si `pnpm-workspace.yaml` existe déjà, la racine est posée : ne pas la réécrire. Passer directement à l'[étape 5](#étape-5--installer-les-services) pour ajouter un service.

## Étape 1 — les questions

Poser **la frontière en un seul tour**, chacune avec une recommandation, puis attendre. Ne pas enchaîner question par question.

1. **Nom du projet** (kebab-case) — sert au nom du dépôt, au titre, aux paquets. Ex. `licence-wallet`.
2. **Portée npm** (sans `@`) — ex. `ffsa` → `@ffsa/licence-wallet-api`.
3. **Titre lisible et description en une phrase** — pour le README et les manifestes.
4. **Langue de la documentation** — français ou anglais. _(Recommandé : celle de l'équipe. Les règles impératives des services restent en anglais dans les deux cas, pour rester diffables avec leur gabarit.)_
5. **Services à installer** — choix multiple, chacun porté par son skill :
   - **api** — backend NestJS hexagonal → `/maj-skills:socle-nest-hexagonal` _(Recommandé : oui.)_
   - **web** — client Next.js App Router → `/maj-skills:socle-web-next` _(Recommandé : oui s'il y a un utilisateur devant un navigateur.)_
   - **mobile** — client Expo (iOS / Android) → `/maj-skills:socle-mobile-expo` _(Recommandé : seulement si un usage mobile est identifié ; un client web suffit souvent au départ.)_

> **Ne pas poser d'autres questions ici.** Les questions structurantes propres à un service (multi-tenance pour l'API, par exemple) sont posées **par le skill du service**, au moment où il s'installe. L'hébergement, l'authentification, l'observabilité : tout ça part en tickets à l'étape 6. Les poser maintenant, c'est demander d'arbitrer avant de savoir.

Les placeholders des gabarits, **communs à tous les skills de service** : `{{PROJET}}` (kebab), `{{PROJET_SNAKE}}` (snake, pour les identifiants SQL), `{{SCOPE}}`, `{{TITRE}}`, `{{DESCRIPTION}}`, `{{LANGUE}}`, `{{DATE}}` (AAAA-MM-JJ).

## Étape 2 — poser la racine

Copier `references/` vers le dépôt selon cette table, puis substituer les placeholders **dans tous les fichiers copiés**.

| Source                          | Destination                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `references/racine/*`           | racine du dépôt — **`gitignore` se copie en `.gitignore`** (il est stocké sans point pour ne pas s'appliquer au dépôt du skill lui-même) |
| `references/husky/*`            | `.husky/` (les rendre exécutables)                                                                                                       |
| `references/methode/*`          | `docs/methode/`                                                                                                                          |
| `references/adr/ARC-0001-*`     | `docs/adr/`                                                                                                                              |
| `references/sources/README.md`  | `docs/sources/README.md`                                                                                                                 |

**Ne pas créer** `apps/`, `packages/`, `docs/metier/`, `docs/architecture/` ni `docs/features/<autre>/` : ils naissent avec leur premier fichier.

**Les zones d'insertion.** `README.md` et `CLAUDE.md` contiennent des marqueurs `<!-- socle:<zone> -->` : c'est là que chaque skill de service insère ses lignes (une ligne de table, un paragraphe, un bloc). Les marqueurs **restent dans le fichier généré** — invisibles au rendu, ils permettent d'ajouter un service plus tard. Ne pas les supprimer, ne pas les déplacer.

Détail de ce que contient la racine et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Étape 3 — installer l'outillage

**graphify** — graphe de connaissance du dépôt, tenu à jour par des hooks git :

```bash
uv tool install graphifyy && graphify install && graphify claude install && graphify hook install
```

`graphify claude install` pose la section `## graphify` dans `CLAUDE.md` **et** les hooks `PreToolUse` dans `.claude/settings.json`. `graphify hook install` pose les hooks git — d'où les relais `post-commit` / `post-checkout` de `references/husky/` : Husky détourne `core.hooksPath`, donc sans relais git ignorerait les hooks de graphify. **Vérifier que le relais répond** après `pnpm install` : `sh .husky/post-commit`.

Puis **deux corrections** que graphify ne fait pas :

1. `.claude/settings.json` : graphify y écrit le **chemin absolu** de son binaire (`/home/<user>/.local/bin/graphify hook-guard …`). Le remplacer par `graphify hook-guard …` nu, sinon le fichier commité ne fonctionne que sur la machine qui l'a généré.
2. Le hook `post-commit` ne réextrait que le code. La règle « `graphify update .` après toute modification de code ou de documentation » est déjà dans le `CLAUDE.md` du gabarit : vérifier qu'elle y est toujours après le passage de `graphify claude install`.

`graphify-out/` est dans le `.gitignore` du gabarit : le graphe reste local.

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
- **Fichier** : `CLAUDE.md`, qui existe déjà — le bloc `## Agent skills` y est, la skill amont le met à jour en place.

Puis vérifier trois points que la skill amont ne connaît pas :

1. `docs/agents/` et `docs/features/<slug>/spec.md` + `issues/` figurent bien dans les **exclusions** de `docs/methode/nomenclature.md`, sinon ces fichiers violent la nomenclature du dépôt.
2. `docs/agents/domain.md` **renvoie** vers `docs/methode/decisions.md` et `nomenclature.md` pour les règles d'écriture au lieu de les répéter.
3. Les ADR se citent `ARC-0001`, pas `ADR-0001` : le gabarit amont suppose la numérotation plate.

> **Si la skill amont ne peut pas tourner** (plugin absent, session non interactive), copier `references/agents/*` vers `docs/agents/` : ce sont les mêmes réponses, déjà corrigées sur ces trois points. Le dire explicitement plutôt que de laisser `CLAUDE.md` pointer vers des fichiers absents.

## Étape 5 — installer les contrats, puis les services

**D'abord les contrats**, dès qu'au moins un service est choisi : invoquer `/maj-skills:socle-contrats`. Il pose `packages/contracts` et `packages/CLAUDE.md`, sans question — c'est ce que l'API et ses clients partagent, il précède tout service.

Puis, pour chaque service choisi à l'étape 1, **invoquer son skill**, dans l'ordre api → web → mobile. Le skill trouve la racine et les contrats posés et n'a plus qu'à poser le service ; les placeholders sont ceux de l'étape 1, déjà dans la conversation.

### Le contrat d'un skill de service

Un skill de service **suppose la racine posée** (`pnpm-workspace.yaml` présent) et, s'il est lancé seul dans un dépôt vide, **invoque ce skill** avec lui seul comme service coché. Il ne touche qu'à :

- `apps/<service>/` — ses fichiers, dont `apps/<service>/eslint.rules.mjs` pour ses règles de lint, chargé par l'ESLint racine (même mécanique pour un paquet sous `packages/`) ;
- ses **fragments** dans les zones `<!-- socle:… -->` de `README.md` et `CLAUDE.md` — chaque fragment s'insère **immédiatement au-dessus** du marqueur de sa zone ;
- ses **ajouts en fin de fichier** dans `.env.example` et `.prettierignore` ;
- ses fichiers de racine propres (un `compose.yaml` pour une base locale, par exemple) ;
- ses ADR dans `docs/adr/` et ses tickets dans `docs/features/socle/issues/`, **dans sa plage de numéros** (voir étape 6).

Il ne commite pas : l'historique est écrit ici, à l'étape 8.

## Étape 6 — déposer les tickets

Les gabarits de `references/tickets/` deviennent `docs/features/socle/issues/`. Ils portent ce que la racine a **délibérément** laissé ouvert : modélisation du domaine, hébergement, nature du client et forme de l'authentification, pare-feu CI, observabilité, registre des règles métier.

Les numéros sont **réservés par skill**, pour que deux skills n'écrivent jamais le même : `01`–`03` et `07`–`09` pour la racine, `04`–`06` pour l'API, `10`–`12` pour le web, `13`–`15` pour le mobile, `16` et suivants pour les services à venir. Un numéro absent (service non installé) est un trou, pas une erreur : les numéros ne se réutilisent jamais.

**Adapter chaque ticket à ce qui est déjà connu du projet.** Un ticket qui pose une question déjà tranchée est du bruit : le supprimer, ou le convertir en ADR. En particulier, **si un client web ou mobile a été coché à l'étape 1, le ticket `03` est tranché** : le convertir en ADR (`ARC`) qui fixe la forme de l'authentification par client — cookies `__Host-` pour un navigateur, jetons porteurs pour du mobile — et laisser `05` pointer vers cette ADR. Le skill de chaque client a déjà remplacé ou complété la décision « no client, for now » dans `apps/api/CLAUDE.md` (cookies pour le web, jetons porteurs pour le mobile, les deux discriminés par `X-Client-Type`) ; vérifier que l'ADR et cette décision disent la même chose. Si le contexte appelle des tickets absents des gabarits — une intégration amont, une contrainte réglementaire — **en écrire**, dans le même format.

Écrire aussi `docs/features/socle/spec.md` : une page qui dit ce qu'est le socle, quels services sont installés, ce qu'il ne fait pas, et dans quel ordre attaquer les tickets — les siens **et** ceux des services.

## Étape 7 — vérifier, puis seulement conclure

Ne pas annoncer que ça marche sans l'avoir constaté :

```bash
pnpm install
pnpm check          # build · lint · typecheck · cycles, toutes briques
sh .husky/post-commit   # le relais graphify répond (silencieux = OK)
```

Chaque skill de service a ses propres vérifications (un service qui démarre, des gardes de couche qui mordent) : **les avoir toutes jouées** avant de conclure.

Contrôler enfin qu'aucun lien markdown n'est cassé, qu'il ne reste **aucun placeholder `{{…}}`** (chercher `{{[A-Z_]+}}` — les doubles accolades JSX ne comptent pas) dans le dépôt généré, et que les marqueurs `<!-- socle:… -->` sont toujours là.

## Étape 8 — l'historique

Des commits qui racontent le projet, pas la séance. Conventional commits, dans la langue du dépôt, corps replié à 100 caractères (commitlint le vérifie). Un découpage qui marche :

1. `chore: initialise le dépôt et son outillage` — **package.json en premier**, sinon commitlint n'a pas de configuration et le commit est refusé
2. `docs: établit la méthode de travail`
3. `docs(adr): consigne les décisions d'amorçage`
4. `feat(contracts): pose le paquet de contrats`
5. par service, dans l'ordre d'installation : `docs(<service>): pose les règles d'architecture` puis `feat(<service>): amorce le service`
6. `docs: rédige le README, le guide agent et le glossaire`
7. `chore(agents): configure les skills` + `docs: dépose les tickets du socle`

Chaque commit doit laisser le dépôt **constructible**. Ne pas découper un service en morceaux qui ne compilent pas.

## Ce que ce skill ne fait pas

- **Aucune règle métier.** Ni entité, ni use case, ni glossaire pré-rempli.
- **Ni service ni paquet par lui-même.** Il pose la racine et délègue : les contrats ont leur skill, chaque service a le sien, et chacun garde son indépendance.
- **Aucune décision d'hébergement, d'authentification ni d'observabilité.** Ce sont des tickets.

## Anti-patterns

| Tentation                                            | Pourquoi c'est faux                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| « Je reformule les gabarits à ma sauce »             | Ce sont des règles éprouvées. Les paraphraser en perd la précision.                          |
| « Je pré-remplis `CONTEXT.md` avec le domaine »      | Le glossaire se construit au grilling, terme par terme. Le pré-remplir fige un non-dit.      |
| « J'invente des trigrammes métier »                  | Un trigramme désigne un sujet tranché. Seuls les trigrammes structurels sont posés d'avance. |
| « Je mets les règles de l'API dans l'ESLint racine » | La racine ne connaît aucune stack. Les règles d'un service vivent dans `apps/<service>/eslint.rules.mjs`. |
| « Je supprime les marqueurs `socle:` du README »     | Ils sont invisibles au rendu et permettent d'ajouter un service plus tard.                   |
| « Je crée `docs/metier/` et `docs/architecture/` »   | Les dossiers naissent avec leur premier document, jamais d'avance.                           |
| « J'annonce que le socle tourne »                    | Pas avant `pnpm check` vert et les vérifications de chaque service jouées.                   |
