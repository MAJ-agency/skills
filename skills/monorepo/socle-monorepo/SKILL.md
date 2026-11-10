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
   - **tests** — gates de qualité des tests (tests creux, couverture du diff, propriétés, mutation) → `/maj-skills:socle-tests` _(Recommandé : oui. Posé avant le premier code, il passe à blanc et mord dès la première PR ; posé après, il trouve déjà de la dette.)_
   - **chaîne** — chaîne de production (develop/main, labels, hooks d'agent, CI, capitaine, chantiers) → `/maj-skills:socle-chaine-de-production` _(Recommandé : oui dès que plus d'une session travaillera sur le dépôt.)_
6. **Multi-tenance** — le service isole-t-il des organisations clientes les unes des autres, dans une même base ? _(Recommandé : **non**.)_ Elle décide de la signature du port de transaction, d'une colonne sur chaque table, d'un gate CI, et de ce qu'un client ne doit jamais envoyer. **Deux branches** sont écrites partout où elle compte (`ADR_ALL_ARC-2`, règles et guidelines API, tickets, règles des clients) : la réponse choisit la branche.
7. **Gestion de rôles** — plusieurs profils d'utilisateurs aux droits différents dans un même périmètre ? _(Recommandé : **non** ; oui si le besoin est déjà identifié.)_ Indépendante de la précédente : un service mono-tenant peut avoir des rôles. Même mécanique de branches.
8. **Anchorpost ?** — le projet sera-t-il suivi par Anchorpost, le site qui montre à la MOA les règles, les preuves, les défauts et les demandes lus dans ce dépôt ? _(Recommandé : **oui** dès qu'une MOA lira le projet autrement qu'en ouvrant le dépôt.)_ La réponse ne change rien à la racine : le standard de documentation (identifiants, registre, en-têtes de tickets) vaut pour tous les projets. **Oui** invoque `/maj-skills:anchorpost` **en dernier**, après la chaîne de production, parce qu'il exige ses gates (étape 8). **Non** : rien de plus ; le skill se lance plus tard, à la main.

> **Ne pas poser d'autres questions ici.** L'hébergement, l'authentification, l'observabilité : tout ça part en tickets à l'étape 6. Les poser maintenant, c'est demander d'arbitrer avant de savoir. Les réponses 6 et 7 sont **transmises à chaque skill de service** : lancé seul, un skill de service repose la question qui lui manque.

**Les fichiers à branches.** Plusieurs gabarits portent **deux branches entre marqueurs** `<!-- ══ TENANT-A ══ -->` / `<!-- ══ TENANT-B ══ -->` (mono / multi-tenant) et `<!-- ══ ROLES-A ══ -->` / `<!-- ══ ROLES-B ══ -->` (sans / avec rôles), fermées par `<!-- ══ /… ══ -->`. Après la copie, **garder la branche choisie, supprimer l'autre et les quatre marqueurs**. Un fichier livré avec ses deux branches est un fichier **non tranché** : la vérification finale le refuse.

Les placeholders des gabarits, **communs à tous les skills de service** : `{{PROJET}}` (kebab), `{{PROJET_SNAKE}}` (snake, pour les identifiants SQL), `{{SCOPE}}`, `{{TITRE}}`, `{{DESCRIPTION}}`, `{{LANGUE}}`, `{{DATE}}` (AAAA-MM-JJ).

## Étape 2 — poser la racine

Copier `references/` vers le dépôt selon cette table, puis substituer les placeholders **dans tous les fichiers copiés**.

| Source                                         | Destination                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/racine/*`                          | racine du dépôt — **`gitignore` se copie en `.gitignore`** (il est stocké sans point pour ne pas s'appliquer au dépôt du skill lui-même)                                                                                                                                                                                                                                                 |
| `references/racine/docs/questions-ouvertes.md` | `docs/questions-ouvertes.md` — livré vide avec son format, comme `GLOSSARY.md` : les trois documents de méthode qui le citent doivent trouver le fichier                                                                                                                                                                                                                                 |
| `references/husky/*`                           | `.husky/` (les rendre exécutables)                                                                                                                                                                                                                                                                                                                                                       |
| `references/methode/*`                         | `docs/methode/`                                                                                                                                                                                                                                                                                                                                                                          |
| `references/racine/.claude/settings.json`      | `.claude/settings.json` — les marketplaces et plugins de skills, posé **avant** `graphify claude install` (étape 3), qui y ajoute ses hooks                                                                                                                                                                                                                                              |
| `references/scripts/verify/*`                  | `scripts/verify/` — les gates de la racine : `budget-contexte` (CLAUDE.md et règles ≤ 200 lignes, `paths:` qui désignent des fichiers) et `references-agent` (tout chemin, commande, skill ou section cité dans ce que lisent les agents existe ; plugins et commandes intégrées dans `references-agent-integrees.json`, dette gelée vide), joués par `check:contexte` dans `pnpm check` |
| `references/racine/.claude/rules/tests.md`     | `.claude/rules/tests.md` — la fiche transverse des tests, chargée par chemin ; sa zone `<!-- socle:tests -->` reçoit la ligne de chaque service                                                                                                                                                                                                                                          |
| `references/adr/ADR_ALL_ARC-*`                 | `docs/adr/` — `ADR_ALL_ARC-1` (identifiants à type et contexte), `ADR_ALL_ARC-4` (langue des identifiants) et `ADR_ALL_ARC-N-registre-un-fichier-par-regle.md` (numéro par `next-id.mjs ADR ALL ARC`, `{{N}}` substitué) ; `ADR_ALL_ARC-3` attend l'étape 6, il n'existe qu'avec un client                                                                                               |
| `references/racine/docs/metier/regles/all/`    | `docs/metier/regles/all/` — le registre du contexte `ALL`, posé vide : une règle est un fichier `RULE_ALL_<TRI>-<n>.md` (gabarit posé par le skill `tickets`, `docs/agents/gabarits/regle.md`)                                                                                                                                                                                             |
| `references/sources/README.md`                 | `docs/sources/README.md`                                                                                                                                                                                                                                                                                                                                                                 |

**Ne pas créer** `apps/`, `packages/`, `docs/architecture/`, `docs/demandes/` ni `docs/features/<autre>/` : ils naissent avec leur premier fichier. Seul `docs/metier/regles/all/` est posé d'avance : le dossier de contexte existe toujours (`ADR_ALL_ARC-1`).

**Les zones d'insertion.** `README.md`, `CLAUDE.md` et `.claude/rules/tests.md` contiennent des marqueurs `<!-- socle:<zone> -->` : c'est là que chaque skill de service insère ses lignes (une ligne de table, un paragraphe, un bloc). Les marqueurs **restent dans le fichier généré** — invisibles au rendu, ils permettent d'ajouter un service plus tard. Ne pas les supprimer, ne pas les déplacer.

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

**Le premier graphe se construit à la main.** Les hooks git ne réextraient que le **code** (AST) ; la partie la plus utile pour comprendre l'architecture — les règles, les ADR, la méthode — est une extraction **sémantique** des documents, que seul `/graphify` lance. Après le dernier commit de l'étape 8, **invoquer `/graphify`** une fois sur le dépôt. Ensuite les hooks tiennent le code à jour, et `graphify update .` après une modification de documentation fait le reste.

**Les plugins de skills** — `.claude/settings.json` du gabarit (posé à l'étape 2, **avant** `graphify claude install` qui y ajoute ses hooks) déclare déjà les marketplaces `mattpocock` (`mattpocock/skills`) et `maj` (`MAJ-agency/skills`) et active `mattpocock-skills@mattpocock` et `maj-skills@maj` : en local, Claude Code propose de les installer à l'ouverture du dépôt. Pour la session courante et pour un script de configuration cloud, vérifier ce qui est déjà installé (`claude plugin list`) puis :

```bash
claude plugin marketplace add mattpocock/skills
claude plugin install mattpocock-skills@mattpocock
claude plugin marketplace add MAJ-agency/skills
claude plugin install maj-skills@maj
```

`superpowers` (`anthropics/claude-plugins-official`) reste optionnel : `grilling.md` cite `superpowers:brainstorming` pour la classification de l'effort, rien ne l'exige.

Si une commande échoue (permissions, réseau, session non interactive), **le dire et donner la commande à jouer à la main** — ne pas faire comme si c'était passé.

## Étape 4 — configurer les skills Matt Pocock

**Invoquer `/mattpocock-skills:setup-matt-pocock-skills`** — ne pas écrire `docs/agents/` à la main.

Répondre avec les valeurs du socle :

- **Tracker** : markdown local, mais **corriger le chemin** — le gabarit amont propose `.scratch/`, or **toute la documentation vit sous `docs/`**, selon l'arbre de `docs/methode/nomenclature.md` § _Tout vit sous `docs/`_. Le tracker est `docs/features/<feature>/` ; les règles métier qu'une spec découvre vont dans `docs/metier/regles/`, jamais dans la spec. Si le dépôt a déjà un remote GitHub, choisir GitHub à la place.
- **Labels de triage** : les cinq rôles par défaut.
- **Contexte** : unique. `pnpm-workspace.yaml` signale des paquets, pas des contextes métier — ne pas se laisser piéger par ce faux positif.
- **Fichier** : `CLAUDE.md`, qui existe déjà — le bloc `## Agent skills` y est, la skill amont le met à jour en place.

Puis vérifier trois points que la skill amont ne connaît pas :

1. `docs/agents/issue-tracker.md` décrit des specs `SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md` sous `docs/features/<feature>/<ctx>/` et des tickets `.<NN>.issue.md`, pas le `<slug>.spec.md` et les `<N>-<titre>.issue.md` du gabarit amont (`docs/methode/nomenclature.md`).
2. `docs/agents/domain.md` **renvoie** vers `docs/methode/decisions.md` et `nomenclature.md` pour les règles d'écriture au lieu de les répéter.
3. Les ADR se citent `ADR_ALL_ARC-1`, pas `ADR-0001` : le gabarit amont suppose la numérotation plate à zéros. Ici, le type, le contexte, le trigramme, et ni zéros de tête ni index.

> **Si la skill amont ne peut pas tourner** (plugin absent, session non interactive), copier `references/agents/*` vers `docs/agents/` : ce sont les mêmes réponses, déjà corrigées sur ces trois points. Le dire explicitement plutôt que de laisser `CLAUDE.md` pointer vers des fichiers absents.

## Étape 5 — installer les contrats, puis les services

**D'abord les contrats**, dès qu'au moins un service est choisi : invoquer `/maj-skills:socle-contrats`. Il pose `packages/contracts` et `packages/CLAUDE.md`, sans question — c'est ce que l'API et ses clients partagent, il précède tout service.

Puis, pour chaque service choisi à l'étape 1, **invoquer son skill**, dans l'ordre api → web → mobile. Le skill trouve la racine et les contrats posés et n'a plus qu'à poser le service ; les placeholders sont ceux de l'étape 1, déjà dans la conversation.

**Tests** coché : invoquer ensuite `/maj-skills:socle-tests`. Il mesure les paquets Vitest que les services viennent de poser ; sans code, ses gates passent à blanc. Il ne commite pas : l'historique est écrit à l'étape 8.

### Le contrat d'un skill de service

Un skill de service **suppose la racine posée** (`pnpm-workspace.yaml` présent) et, s'il est lancé seul dans un dépôt vide, **invoque ce skill** avec lui seul comme service coché. Il ne touche qu'à :

- `apps/<service>/` — ses fichiers, dont `apps/<service>/eslint.rules.mjs` pour ses règles de lint, chargé par l'ESLint racine (même mécanique pour un paquet sous `packages/`) ;
- ses **fragments** dans les zones `<!-- socle:… -->` de `README.md` et `CLAUDE.md` — chaque fragment s'insère **immédiatement au-dessus** du marqueur de sa zone ;
- ses **ajouts en fin de fichier** dans `.env.example` et `.prettierignore` ;
- sa ligne dans `.claude/rules/tests.md` : la zone `<!-- socle:tests -->` ferme le tableau des types de tests — chaque service y insère **immédiatement au-dessus** la ligne de ses suites à infrastructure (une base réelle en `.db.spec.ts`, un rendu, un bundle) et, sous `<!-- socle:tests-commandes -->`, la commande qui les joue (`pnpm --filter … test:db`) ; le marqueur reste ;
- ses fichiers de racine propres (un `compose.yaml` pour une base locale, par exemple) ;
- ses ADR dans `docs/adr/` et ses tickets dans `docs/features/socle/issues/`, **dans sa plage de numéros** (voir étape 6).

Il ne commite pas : l'historique est écrit ici, à l'étape 8.

## Étape 6 — déposer les tickets

Les gabarits de `references/tickets/` deviennent `docs/features/socle/issues/`. Ils portent ce que la racine a **délibérément** laissé ouvert : modélisation du domaine, hébergement, nature du client et forme de l'authentification, pare-feu CI, observabilité, registre des règles métier.

Les numéros sont **réservés par skill**, pour que deux skills n'écrivent jamais le même : `1`–`3` et `7`–`9` pour la racine, `4`–`6` pour l'API, `10`–`12` pour le web, `13`–`15` pour le mobile, `16` et suivants pour les services à venir. Un numéro absent (service non installé) est un trou, pas une erreur : les numéros ne se réutilisent jamais.

**Adapter chaque ticket à ce qui est déjà connu du projet.** Un ticket qui pose une question déjà tranchée est du bruit : le supprimer, ou le convertir en ADR. En particulier, **si un client web ou mobile a été coché à l'étape 1, le ticket `3` est tranché** : **ne pas le copier**, et poser à sa place [`references/adr/ADR_ALL_ARC-3-forme-de-l-authentification-par-client.md`](references/adr/ADR_ALL_ARC-3-forme-de-l-authentification-par-client.md) dans `docs/adr/` — un gabarit à sections par client (`<!-- ══ CLIENT-WEB ══ -->`, `<!-- ══ CLIENT-MOBILE ══ -->`) : garder celles des clients installés, supprimer les autres et leurs marqueurs. Le ticket `5` de l'API pointe déjà vers `ADR_ALL_ARC-3`. Le skill de chaque client a remplacé la décision « no client, for now » dans `apps/api/CLAUDE.md` ; vérifier que `ADR_ALL_ARC-3` et cette décision disent la même chose. Sans aucun client, le ticket `3` reste un ticket et `ADR_ALL_ARC-3` n'existe pas. Si le contexte appelle des tickets absents des gabarits — une intégration amont, une contrainte réglementaire — **en écrire**, dans le même format.

Écrire aussi la spec du socle, `docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md` (le trigramme `SOC` est au registre du gabarit) : une page qui dit ce qu'est le socle, quels services sont installés, ce qu'il ne fait pas, et dans quel ordre attaquer les tickets — les siens **et** ceux des services. **L'ordre n'est pas par couche.** Après le ticket `1`, la suite est une **première balle traçante** — un use case réel de bout en bout, du contrat à l'écran — et les tickets de couche (`4`, `5`, sessions) se dimensionnent à ce qu'elle exige. Un ordre « base, puis authentification, puis sessions » avant qu'un écran ne montre une donnée métier est exactement l'anti-pattern que `conception.md` nomme.

## Étape 7 — vérifier, puis seulement conclure

Ne pas annoncer que ça marche sans l'avoir constaté :

```bash
pnpm install
pnpm check          # build · lint · typecheck · cycles, toutes briques
sh .husky/post-commit   # le relais graphify répond (silencieux = OK)
```

Chaque skill de service a ses propres vérifications (un service qui démarre, des gardes de couche qui mordent) : **les avoir toutes jouées** avant de conclure.

Contrôler enfin qu'aucun lien markdown n'est cassé, qu'il ne reste **aucun placeholder `{{…}}`** (chercher `{{[A-Z_]+}}` — les doubles accolades JSX ne comptent pas) dans le dépôt généré, que les marqueurs `<!-- socle:… -->` sont toujours là, et qu'**aucun marqueur de branche ne subsiste** : `grep -rn '══' --include='*.md' .` doit ne rien renvoyer. Un marqueur restant est une décision non prise.

## Étape 8 — l'historique

Des commits qui racontent le projet, pas la séance. Conventional commits, dans la langue du dépôt, en-tête de 120 caractères au plus, corps en prose replié à la main (`commitlint.config.mjs` le vérifie). Un découpage qui marche :

1. `chore: initialise le dépôt et son outillage` — **package.json et `commitlint.config.mjs` en premier**, sinon commitlint n'a pas de configuration et le commit est refusé
2. `docs: établit la méthode de travail`
3. `docs(adr): consigne les décisions d'amorçage`
4. `feat(contracts): pose le paquet de contrats`
5. par service, dans l'ordre d'installation : `docs(<service>): pose les règles d'architecture` puis `feat(<service>): amorce le service`
6. `docs: rédige le README, le guide agent et le glossaire`
7. `chore(agents): configure les skills` + `docs: dépose les tickets du socle`
8. **tests** coché : `chore(tests): pose les gates de qualité des tests` + `docs(adr): consigne les tests sans infrastructure, les propriétés et le score de mutation`

Chaque commit doit laisser le dépôt **constructible**. Ne pas découper un service en morceaux qui ne compilent pas.

**Chaîne** cochée : pousser `main` (ce socle exige un remote GitHub), puis invoquer `/maj-skills:socle-chaine-de-production`. Il pose `tickets`, écrit ses propres commits et `docs/agents/admin.md` (develop, rulesets, labels : ce que l'admin fait à la main). Sans remote encore : le dire, et le lancer plus tard — `chantier` le réclame avant toute fille (son § 0).

**Anchorpost** coché : invoquer `/maj-skills:anchorpost` **en tout dernier**, après la chaîne. Il exige `scripts/check.mjs`, `scripts/docs/index-generes.json` et le gate des tickets, et refuse sinon ; il installe la CLI, écrit le manifeste, génère le premier index et écrit ses propres commits. Sans chaîne : le dire, et le lancer plus tard.

## Ce que ce skill ne fait pas

- **Aucune règle métier.** Ni entité, ni use case, ni glossaire pré-rempli.
- **Ni service ni paquet par lui-même.** Il pose la racine et délègue : les contrats ont leur skill, chaque service a le sien, et chacun garde son indépendance.
- **Aucune décision d'hébergement, d'authentification ni d'observabilité.** Ce sont des tickets.

## Anti-patterns

| Tentation                                            | Pourquoi c'est faux                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| « Je reformule les gabarits à ma sauce »             | Ce sont des règles éprouvées. Les paraphraser en perd la précision.                                       |
| « Je pré-remplis `GLOSSARY.md` avec le domaine »     | Le glossaire se construit au grilling, terme par terme. Le pré-remplir fige un non-dit.                   |
| « J'invente des trigrammes métier »                  | Un trigramme désigne un sujet tranché. Seuls les trigrammes structurels sont posés d'avance.              |
| « Je mets les règles de l'API dans l'ESLint racine » | La racine ne connaît aucune stack. Les règles d'un service vivent dans `apps/<service>/eslint.rules.mjs`. |
| « Je supprime les marqueurs `socle:` du README »     | Ils sont invisibles au rendu et permettent d'ajouter un service plus tard.                                |
| « Je crée `docs/metier/` et `docs/architecture/` »   | Les dossiers naissent avec leur premier document, jamais d'avance.                                        |
| « J'annonce que le socle tourne »                    | Pas avant `pnpm check` vert et les vérifications de chaque service jouées.                                |
