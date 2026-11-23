---
name: anchorpost
description: Branche un dépôt du socle sur Anchorpost, le site qui montre à la MOA les règles métier, leurs preuves, les défauts et les demandes lus dans la documentation du dépôt — installe la CLI `@maj-agency/anchorpost` (≥ 2.0.3, publique sur npmjs.com), écrit le manifeste au schéma 3, pose la structure de dossiers du standard ou migre l'existante, déclare l'index généré et son gate, pose la fiche d'écriture `.claude/rules/anchorpost.md` (criticité, cas attendus, étiquette de cas, ce que dit `compare`), la recette de l'administrateur et l'ADR, génère le premier index, et passe au pivot 3 un dépôt qui n'y est pas. Exige le socle de la chaîne de production et refuse sinon. Use when a project must be read by Anchorpost, when socle-monorepo asks « Anchorpost ? », when a repo's rules, tickets or identifiers must be migrated to the documentation standard, or when `anchorpost check` is red.
argument-hint: '[poser | migrer | verifier | pivot-3]'
---

# Anchorpost — brancher un dépôt

Anchorpost lit un projet **dans son dépôt**, par un seul fichier généré, `anchorpost/anchorpost.json`, l'**index**. Il en montre à la MOA les règles métier avec leurs deux statuts, les tests qui les prouvent, les défauts, les demandes, les EPIC. Il ne calcule rien et ne stocke rien du métier : le dépôt reste la seule source de vérité. Ce skill fait tout ce qu'un dépôt doit faire pour être lu, en huit points, et rien d'autre.

**Il n'invente aucune convention.** Le standard de documentation (identifiants `<TYPE>_<CTX>_<TRI>-<n>`, une règle par fichier, en-têtes `Type:` et `Règles:`) est celui du socle, posé par `socle-monorepo` et `tickets`, qu'un projet suive Anchorpost ou non. Ce skill ajoute ce qui n'a de sens qu'avec Anchorpost : la CLI, le manifeste, l'index, son gate, et la fiche qui rappelle comment écrire pour être lu.

Les gabarits vivent dans [`references/`](references/) ; les copier verbatim et substituer les placeholders. Ce que contient chaque fichier et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Étape 0 — exiger le socle, ou refuser

Vérifier, dans cet ordre, et **s'arrêter au premier manque** en nommant le skill qui le pose :

| Attendu                                                       | Posé par                     |
| ------------------------------------------------------------- | ---------------------------- |
| `pnpm-workspace.yaml`, `scripts/check.mjs`                     | `socle-monorepo`             |
| `scripts/docs/index-generes.json`, `.claude/chaine.json`       | `socle-chaine-de-production` |
| `scripts/verify/tickets.mjs`, `docs/agents/gabarits/regle.md`  | `tickets`                    |
| `docs/methode/nomenclature.md` à la grammaire `<TYPE>_<CTX>_<TRI>-<n>` | `socle-monorepo` ≥ 4.0 : sinon, c'est un dépôt à migrer (étape 2) |

Sans ces fichiers, l'index n'aurait ni gate ni protection contre l'édition à la main : Anchorpost lirait un fichier que rien ne tient à jour. Refuser est le bon geste.

## Étape 1 — installer la CLI

La CLI est un paquet npm **public** sur npmjs.com (Anchorpost `ADR_ALL_ARC-16`) : une installation ordinaire, sans jeton ni `.npmrc` particulier. Ce skill suit la **CLI 2.0.3 et les suivantes** : le pivot 3 depuis la 2.0.0 (criticité, cas attendus, état « partielle », `compare`) ; la 2.0.3 lit en plus une aide de garde importée par un espace de noms, par défaut, par un baril, ou méthode d'un objet ou d'une classe exportés, et une aide importée qui saute sans condition : la preuve qu'elle fait sauter ou couper tombe ; deux formes restent non lues (README de la CLI, « Limites tenues par la revue ») ; et `migrate manifest` y garde la mise en forme du manifeste.

1. Un dépôt qui portait la recette d'avant (`@maj-agency:registry=https://npm.pkg.github.com` et `NODE_AUTH_TOKEN` dans `.npmrc`) retire d'abord ces deux lignes : tant qu'elles sont là, `pnpm` cherche le paquet sur GitHub Packages, qui ne le publie plus.
2. `pnpm add -Dw @maj-agency/anchorpost@^2.0.3` (`@^2` seul garde une 2.0.x plus ancienne déjà installée ; le hook d'agent refuse une dépendance que la ligne `Dépendances:` du ticket ne prévoit pas : la prévoir dans le ticket).
3. Dans `package.json` racine, deux scripts : `"anchorpost:index": "anchorpost index"` et `"anchorpost:check": "anchorpost check"`.

## Étape 2 — la structure, ou la migration

La CLI trouve les sources par convention. Vérifier que le dépôt la suit :

| Quoi             | Où                                                                 |
| ---------------- | ------------------------------------------------------------------ |
| règles           | `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`                 |
| specs et tickets | `docs/features/<feature>/<ctx>/` et `issues/`                      |
| demandes         | `docs/demandes/<ctx>/REQ_<CTX>_<TRI>-<n>-<slug>.md`                |
| glossaire        | `GLOSSARY.md` à la racine                                          |
| questions        | `docs/questions-ouvertes.md`                                       |

Le dossier `all/` existe toujours, même pour un projet à un seul contexte. Un dépôt écrit avant le standard (registre en tableau markdown ou en `rules.json`, identifiants sans type ni contexte, specs hors dossier de contexte) **se migre** : `pnpm anchorpost migrate` lit l'ancienne forme, écrit les fichiers par règle, déplace les specs et les tickets dans leur dossier de contexte, réécrit tous les identifiants dans `docs/`, les tests et le code, et pose `Type: task` sur les tickets qui n'en ont pas. Dry-run par défaut, `--apply` pour écrire, un contexte à la fois ; relire le `git diff` avant de continuer. Les étapes propres à un dépôt existant (ses gates, ses scripts) sont dans sa spec de refonte, pas ici.

Un chemin qui ne peut pas bouger (les règles d'une fédération dans `federations/<slug>/`) se déclare dans le manifeste, sur son contexte : `"rules": "federations/fnsmr/rules.json"`. C'est `init` qui le demande quand il ne trouve rien à la place conventionnelle.

## Étape 3 — le manifeste

`pnpm anchorpost init` écrit `anchorpost/manifest.json` depuis [`references/manifest.json`](references/manifest.json) et ce que la conversation sait déjà (nom, description, langue du socle). Ce qu'il faut demander à l'humain, en un tour, chaque question avec sa recommandation :

1. **Le pitch**, une phrase pour la MOA, et les **publics** (qui lira l'espace).
2. **Les contextes** : `all` seul, ou une liste. Chacun a un identifiant court en minuscules et un nom affiché. Recommandation : `all` seul, sauf si le projet sert plusieurs organisations aux règles distinctes.
3. **Les documents à rendre** : le glossaire, le document d'architecture, le programme. Recommandation : `GLOSSARY.md`, et les documents que `CLAUDE.md` nomme dans sa carte d'orientation.
4. **La table nom → rôle** : les personnes citées dans les règles et les décisions, avec leur rôle (`client`, `MOA`, `MOE`). Anchorpost affiche le nom, et le rôle entre parenthèses quand il le connaît. Facultative pour un projet où personne ne signe de `by` : toute personne qui signe un `by` du manifeste (par exemple un plancher, une criticité de feature, une validation des preuves) y figure ; sans elle, aucun `by` n'est connu.
5. **Les modules de l'application (EPIC)** : les grands pans fonctionnels, et pour chaque domaine du registre les modules qu'il concerne (informatif, il sert à `migrate epics`). Recommandation : un EPIC par grand pan fonctionnel ; sans réponse, aucun, et chaque domaine reste son propre EPIC.

Les **EPIC** (`epics`) se déclarent dans le manifeste : un EPIC est un **module de l'application**, un pan fonctionnel (« Gestion des licences », « Gestion des affiliations », « Vie d'équipe »). Un **domaine est une entité transverse** : il peut concerner plusieurs modules. `domains` liste, **à titre informatif**, les domaines qu'un module concerne : un domaine peut figurer dans plusieurs modules, sans effet sur le rangement (`{ "id": "licences", "name": "Gestion des licences", "domains": ["LIC", "PAY"] }`). Une règle a un module de deux façons seulement : elle le déclare (`epics` dans son en-tête), ou une spec déclare la réaliser, par un en-tête `Règles:` de la spec ou de l'un de ses tickets (la spec porte son module en tête, `EPIC:`). **Un domaine ne donne pas de module**, et il n'y a pas de repli : une règle sans module reste sans module, la santé émet une alerte par règle et Anchorpost la range dans « Règles sans module ». Une règle seulement citée dans le corps d'une spec ne prend pas son module. « Technique » est un module ordinaire, que le manifeste déclare s'il le veut. L'en-tête `Règles:` d'une spec ne porte que des identifiants complets de règles qui existent : `check` refuse une entrée mal formée (`LIC-3`) ou une règle absente. `epics: []` dit qu'une règle est sans module, volontairement ; la santé l'alerte comme les autres. Pour écrire `epics:` dans les règles existantes, lancer `anchorpost migrate epics` (plan par défaut, `--apply`, `--check`). Elle lit d'abord `anchorpost/epics-assignments.json`, s'il existe, une répartition commise règle par règle (`{ "rules": { "RULE_ALL_LIC-3": ["licences"] } }`), qui l'emporte. Sinon, elle se rabat sur `domains` : elle écrit le module d'un domaine listé par un seul module, et elle liste, sans les écrire, les règles d'un domaine listé par plusieurs modules ou par aucun. Elle ne réécrit jamais une règle qui porte déjà `epics`. Elle signale une règle qui contredit le fichier, et refuse une règle ou un module inconnus. Sans EPIC au manifeste, chaque domaine reste son propre EPIC, comme en 1.1.x. L'index garde l'origine de chaque rattachement ; la santé signale aussi une spec sans `EPIC:`. Ce modèle demande la CLI 1.2.0 ou une suivante. Les planchers (`floor`) sont écrits par `init` à la valeur mesurée ce jour-là, pour chaque contexte, sans `by` ; un humain les relève, jamais ne les baisse, et la personne qui en relève un écrit son nom en `floor.by`, une clé de `roles`.

**Un sigle, un domaine, un sens.** Un sigle a un seul sens dans tout le dépôt, et un sigle partagé par plusieurs contextes est le cas normal (`LIC` dans chaque fédération). Avant d'en créer un, préférer un domaine existant. Une collision se résout en renommant l'un des deux (de 2 à 4 lettres, par `renames`), **avant la première lecture par Anchorpost** : ensuite, un identifiant ne se renomme plus.

**Une règle dit ce que le logiciel permet, exige, calcule ou refuse.** Une fonctionnalité voulue (« Billetterie ») est une demande `REQ` ; une règle de l'organisation cliente sans rapport avec le logiciel (une règle fédérale d'équipement) est un document `DOC`, qui garde son énoncé, sa source et sa raison ; dans le doute, elle reste une règle et la question remonte au produit. Détail : `docs/methode/nomenclature.md`.

Le registre des trigrammes est unique : pas de nomenclature par contexte. La résolution se joue par la table `renames` d'`anchorpost/identifiers-resolutions.json` et `anchorpost migrate identifiers` (plan, `--apply`, puis `--check`). Un sigle absent du registre donne l'avertissement de santé « domaine sans nom », un domaine sans EPIC l'avertissement « domaine sans EPIC » quand le manifeste déclare des `epics`. Tout cela demande `@maj-agency/anchorpost` **≥ 1.1.0**.

**Rejouer la migration : `bareAliases`.** Un document du socle déjà migré (`SPEC_ALL_LIC-1-…`) garde par défaut l'alias nu `LIC-1`, et `migrate identifiers` le lit encore. Si les anciens documents du socle s'écrivaient `ALL-LIC-1-…`, ce défaut réécrit à tort des données et des citations (une donnée `'LIC-1'` deviendrait `SPEC_ALL_LIC-1`) : un projet de ce genre a compté 463 réécritures fausses au rejeu. **Poser la clé est donc une question de `init` et de la migration, avec sa recommandation** :

1. **Demander** : « Comment s'écrivaient les anciens documents du socle : `ALL-LIC-1-…` ou `LIC-1-…` ? »
2. **Avec `ALL-…`**, poser `"bareAliases": false` dans `extensions.anchorpost.migrate` du manifeste, **avant le premier `--apply`**. **Avec la forme nue**, ne rien poser. **Pour un projet neuf**, sans ancienne forme, ne rien poser.
3. **Relire le plan à blanc** : il affiche en tête la valeur lue et ce qu'elle implique. Le relire avant `--apply` ; s'il dit « oui (défaut) » alors que les anciens documents s'écrivaient `ALL-…`, poser la clé et relancer le plan.

Le reste du standard de la migration :

- **« Laisser tel quel »** est une résolution d'ambiguïté : elle s'écrit dans la clé `resolutions` d'`anchorpost/identifiers-resolutions.json`, avec `to` égal au mot lui-même (`{ "word": "LIC-05", "to": "LIC-05" }`, `"path"` facultatif pour la limiter à un fichier). Le mot reste tel quel et `--check` le compte comme tranché. `renames` ne sert qu'à renommer une règle.
- **Les plages** (`GRD-01-05`, « GRD-01 à 05 ») ne sont jamais réécrites : le plan les signale dans « Plages laissées telles quelles », et elles se corrigent à la main.
- **La version minimale** pour tout ce qui précède (`bareAliases`, plages, « laisser tel quel » dans `--check`) : `@maj-agency/anchorpost` **≥ 1.1.1**.

Le manifeste est écrit à la main et validé par un humain. Il n'est jamais généré après `init` ; `anchorpost migrate manifest` le réécrit au schéma 3 tel que la CLI le lit déjà, sans rien y générer (« Passer au pivot 3 »).

## Étape 4 — l'index, le gate, les hooks

1. `scripts/docs/index-generes.json` : une entrée `{ "chemin": "anchorpost/anchorpost.json", "commande": "pnpm anchorpost:index" }`. Le hook d'agent refuse alors l'édition à la main, et le capitaine régénère l'index à chaque fusion. Rien d'autre à poser côté hooks.
2. `.claude/chaine.json` : `scripts/verify/anchorpost.mjs` dans `gatesRapides`, et le fichier [`references/scripts/verify/anchorpost.mjs`](references/scripts/verify/anchorpost.mjs) copié : il appelle `pnpm anchorpost:check` et ne fait rien d'autre, pour que la chaîne le trouve avec les autres gates.
3. `scripts/check.mjs` : une étape `check:anchorpost` après `check:tickets`, et le script `"check:anchorpost": "anchorpost check"` dans `package.json`.
4. La CI : le job de qualité joue déjà `pnpm check` ; l'installation n'y demande aucun jeton. Le rapport de preuves d'une PR (`anchorpost compare`, en `observe` puis en `enforce`) est l'étape de CI du gate `preuves` de `socle-tests`.
5. `.claude/chaine.json` : `anchorpost/manifest.json` dans `cheminsSensibles` (le plancher, `sufficiency` et `featureCriticality` ne se baissent que par une personne).

`code` est un champ du standard (les fichiers de code qui réalisent une règle) : `socle-tests` lit `rules[].code` des règles `proven`, et `partial` au pivot 3, dans l'index commis pour le périmètre de sa mutation hebdomadaire ; `compare` en tire le `code` des règles hautes qu'une PR touche. Le gate `preuves` de `socle-tests` (`scripts/verify/preuves.mjs`) relaie `anchorpost compare` au pre-push et en fin de tour : le poser avec ce skill si `socle-tests` est là.

Ce que `check` refuse est une liste fermée, portée par le paquet : un fichier de règle mal formé (une criticité, un genre, une famille ou une portée hors vocabulaire, une criticité basse sans raison, deux cas au même identifiant) ; deux règles au même identifiant dans un contexte ; un lien, un `instanceOf` ou une source vers une cible absente, ou un chemin de `code` absent du dépôt ; un ticket dont `Type:` est hors vocabulaire ou dont `Règles:` cite une règle absente ; un défaut `Fait` dont un test nommé n'existe pas ou est désactivé ; une étiquette de test qui cite une règle absente, ou un cas que sa règle ne déclare pas ; un compte de règles prouvées, ou de prouvées et partielles, sous le plancher de son contexte, ou un plancher au-dessus de la mesure ; en `enforce`, une règle `validated` sans criticité ou une règle moyenne ou haute dont une famille n'a pas de réponse (des avertissements en `observe`) ; un index qui n'est pas celui que les sources donnent, octet pour octet.

## Étape 5 — la fiche d'écriture

Copier [`references/rules/anchorpost.md`](references/rules/anchorpost.md) vers `.claude/rules/anchorpost.md`. Chargée dès qu'un agent touche `docs/**` ou `anchorpost/**`, elle dit comment écrire pour être lu : une règle par fichier, qui écrit quoi, l'étiquette des tests, les en-têtes des tickets, l'index qu'on ne touche pas. La fiche cite `maj-skills:criticite` par son nom qualifié : si le projet a `scripts/verify/references-agent-integrees.json` (gate `references-agent`), y ajouter `maj-skills:criticite` et `maj-skills:anchorpost` à la liste `skills-plugins` s'ils y manquent, sans quoi ce gate rougit. Puis le fragment [`references/fragments/claude-md-routing.md`](references/fragments/claude-md-routing.md) au-dessus du marqueur `<!-- socle:routing -->` de `CLAUDE.md`, et [`references/fragments/readme-ou-vit-quoi.md`](references/fragments/readme-ou-vit-quoi.md) dans la zone correspondante du `README.md`.

## Étape 6 — la recette de l'administrateur

Ajouter la section de [`references/fragments/admin.md`](references/fragments/admin.md) à `docs/agents/chaine-admin.md` (posé par la chaîne) : créer l'espace dans Anchorpost une fois l'index poussé ; retirer, d'un dépôt qui les portait, les jetons de lecture de GitHub Packages devenus inutiles. Aucune clé n'est demandée pour installer la CLI.

## Étape 7 — l'ADR

`node scripts/docs/next-id.mjs ADR ALL ARC`, puis [`references/adr/ADR_ALL_ARC-N-index-anchorpost.md`](references/adr/ADR_ALL_ARC-N-index-anchorpost.md) → `docs/adr/`, `{{N}}` et `{{DATE}}` substitués, une ligne `Décideurs`. Elle dit pourquoi l'index est commis dans le dépôt et généré par la CLI, paquet public, et ce qu'on a écarté.

## Passer au pivot 3 (`pivot-3`)

Un dépôt branché avant la CLI 2.0.0 a un manifeste et un index au schéma 2 ; la CLI 2.0.x lit le manifeste 2 converti, sans rien écrire, et le signale (`manifest-schema-old`). Le passage, par une PR relue (le manifeste est un chemin sensible), dans cet ordre :

1. Les deux lignes de GitHub Packages retirées de `.npmrc` s'il les porte (étape 1, point 1), puis `pnpm add -Dw @maj-agency/anchorpost@^2.0.3` (`migrate manifest` est de la 2.0.2 et garde la mise en forme du manifeste depuis la 2.0.3 ; `@^2` seul garde une 2.0.x plus ancienne déjà installée), puis `pnpm anchorpost:index` : l'index passe au schéma `"3"` ; une règle qui avait des preuves y sort « partielle » tant que ses cas ne sont pas écrits. Commiter : la commande suivante exige un arbre propre.
2. `pnpm exec anchorpost migrate manifest` (le plan, rien n'est écrit), puis `pnpm exec anchorpost migrate manifest --apply` : la commande que nomme l'alerte `manifest-schema-old`. Elle écrit le manifeste au schéma `"3"` tel que la CLI le lisait déjà, et rien d'autre : `"sufficiency": "observe"` posé, chaque plancher converti (`proven: N` devient `{ proven: 0, partial: N }`, sa date gardée, jamais re-mesuré), chaque entrée `featureCriticality` d'une version 2 écrite `{ feature, level, by, date }` ; elle refuse, sans rien écrire, une clé que le schéma 3 perdrait. Une entrée `featureCriticality` basse d'une version 2 n'a pas de raison : la commande la refuse, et `init` aussi ; le manifeste se réécrit alors au schéma 3 à la main, aux mêmes conversions, avec la `reason` que donne la personne nommée par `by` : une session ne l'écrit pas à sa place, elle la demande dans sa PR. Jamais `init --force`. Puis, à la main, le plancher relevé d'après la mesure du jour, avec une date nouvelle et la personne qui le pose (`floor { date, by, proven, partial }`) ; `by` est une clé de la table `roles` du manifeste, que la personne écrit elle-même, et qui y figure déjà sur la base : une personne ajoutée à `roles` dans la PR même n'y signe pas, elle s'y ajoute par une PR à part, avant. Puis `pnpm anchorpost:index` et `pnpm anchorpost:check`, verts.
3. Chaque règle sans criticité ni cas (l'alerte de projet de l'index compte celles qui ont des preuves ; les autres ont chacune leur alerte, « sans criticité » ou « aucun cas ») se classe par le skill `criticite`, une règle à la fois, avant tout code qui la touche : c'est là que la repose relance le skill. `code` se renseigne sur les règles qui ont des preuves.
4. La repose des skills qui lisent le pivot 3 : `tickets` (la ligne `Prouve:` et la preuve suffisante d'un ticket prêt), `socle-tests` (le gate `preuves`, la mutation des règles `proven` et `partial`), `revue-de-ticket`, et cette fiche.
5. Le passage à `enforce` est une décision du produit, projet par projet : une PR où une personne écrit `"sufficiency": "enforce"`.

## Étape 8 — le premier index, puis vérifier, puis conclure

```bash
pnpm anchorpost:index    # écrit anchorpost/anchorpost.json
pnpm anchorpost:check    # vert, ou la liste rouge à corriger avant de continuer
pnpm check               # la porte unique, qui joue maintenant check:anchorpost
```

Lire la section `health` de l'index : c'est la liste des écarts que la CLI tolère mais signale (règle `candidate` qui a des tests, règle dite couverte sans test, défaut sans règle). Les corriger ou les laisser visibles, mais les dire.

Puis l'historique, conventional commits dans la langue du dépôt : `chore(anchorpost): installe la CLI et le manifeste`, `docs(anchorpost): pose la fiche d'écriture et la recette d'administration`, `docs(adr): consigne l'index Anchorpost`, `chore(anchorpost): génère le premier index`. Invoqué par `socle-monorepo`, c'est ce skill qui écrit ces commits, en dernier.

L'espace Anchorpost se crée ensuite par un admin, dans l'application, en reliant le dépôt et sa branche : c'est le dernier point de la recette de l'étape 6.

## Ce que ce skill ne fait pas

- **Aucune règle métier, aucune validation.** Il pose la mécanique ; les règles viennent du grilling, `validated` vient d'un humain.
- **Aucune convention nouvelle.** Le standard est celui du socle. Un dépôt qui ne le suit pas se migre, il ne se configure pas.
- **Rien côté Anchorpost.** Il ne crée pas d'espace, n'appelle pas le service : la CLI est hors ligne.
- **Pas de refonte d'un dépôt existant au-delà de `migrate`.** Les gates et scripts propres à un projet qui lisaient l'ancienne forme se réécrivent dans la spec de refonte de ce projet.

## Anti-patterns

| Tentation                                                   | Pourquoi c'est faux                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| « Je corrige l'index à la main, c'est une ligne »           | L'index est une fonction des sources. Le hook refuse, le gate refuse, et Anchorpost rejouerait la vérification. |
| « Je mets `validated` sur les règles qui ont des tests »     | Un test prouve la réalisation, pas la validation. Seul un humain valide.                                       |
| « Je copie la clé dans `.npmrc` pour que ça marche »        | Une clé dans le dépôt est une clé publiée. La recette la met dans l'environnement, jamais dans un fichier.     |
| « Le projet n'a qu'un contexte, pas besoin de `all/` »      | Le jour du second contexte, tout bouge. `all/` existe toujours, `ALL` s'écrit toujours.                        |
| « Je pose un `anchorpost-config.json` pour les chemins »    | Les chemins se déduisent par convention ; une exception se déclare dans le manifeste, sur son contexte.        |
| « J'écris un README du registre pour la lecture humaine »   | L'index est l'annuaire, et Anchorpost la lecture. Un README tenu à la main se périme sans prévenir.           |
