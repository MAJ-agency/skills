# Nomenclature — `<TYPE>_<CTX>_<TRI>-<n>`

Le _pourquoi_ de cette règle, avec ses alternatives écartées, vit dans [`ADR_ALL_ARC-1`](../adr/ADR_ALL_ARC-1-identifiants-types-et-contextes.md). Ce fichier porte le _comment_ : la grammaire, les contextes, l'arborescence, le registre des trigrammes, les procédures.

> **Elle s'applique à tout ce qui se cite** : une règle métier, une spec, un ticket, une ADR, un document de design, un guide, une demande. Un identifiant se lit sans ouvrir le dépôt : il dit **ce que c'est**, **pour qui** et **de quoi ça parle**.

---

## La grammaire

```
<TYPE>_<CTX>_<TRI>-<n>            RULE_ALL_LIC-3 · SPEC_FNSMR_PAY-3 · ADR_ALL_ARC-11
<TYPE>_<CTX>_<TRI>-<n>.<NN>       SPEC_FNSMR_PAY-3.02   (un ticket)
```

| Partie   | Ce qu'elle dit                                  | Forme                                             |
| -------- | ----------------------------------------------- | ------------------------------------------------- |
| `TYPE`   | ce que c'est                                    | l'un des six types ci-dessous                     |
| `CTX`    | le contexte, `ALL` pour ce qui vaut partout     | majuscules, `[A-Z][A-Z0-9]*` ; `ALL` toujours écrit |
| `TRI`    | le **sujet**, pas le dossier                    | 2 à 4 lettres majuscules, du [registre](#registre-des-trigrammes) |
| `n`      | la séquence, unique par type, contexte et trigramme | sans zéro de tête pour un document neuf ; un identifiant existant **ne se renomme pas**, même avec ses zéros (`LIC-05`), sauf pour résoudre une collision de sigles avant la première lecture par Anchorpost ([collision de sigles](#résoudre-une-collision-de-sigles)) |
| `NN`     | l'index d'un ticket dans sa spec                | deux chiffres                                     |

Un tiret bas sépare le type, le contexte et le trigramme. Un tiret simple ne précède que le numéro. Aucune autre forme.

### Les six types

| Type   | Ce qu'il désigne                                                      | Où il vit                                   | Exemple              |
| ------ | --------------------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `RULE` | une règle métier du registre                                          | `docs/metier/regles/<ctx>/`                 | `RULE_ALL_LIC-3`     |
| `SPEC` | une spec de feature ; ses tickets portent son identifiant suivi de `.NN` | `docs/features/<feature>/<ctx>/`         | `SPEC_ALL_LIC-12`    |
| `ADR`  | une décision et son pourquoi                                          | `docs/adr/`, un sous-dossier par sujet      | `ADR_ALL_ARC-11`     |
| `DSG`  | un document de design (charte, tokens, planche)                       | `docs/design/`                              | `DSG_ALL_DES-1`      |
| `DOC`  | un guide : architecture, infrastructure, référence fonctionnelle      | `docs/architecture/`, `docs/infrastructure/`, `docs/metier/reference/` | `DOC_ALL_API-2` |
| `REQ`  | une demande de la MOA, avant sa spec                                  | `docs/demandes/<ctx>/`                      | `REQ_ALL_LIC-7`      |

Un ticket n'a pas de type à lui : il n'existe pas sans sa spec (`SPEC_ALL_LIC-12.03`). Une carte de chantier porte l'identifiant de sa spec (`SPEC_ALL_LIC-12-<slug>.map.md`). Un compte rendu de réunion est daté et n'a pas d'identifiant.

### Le contexte

Un projet a des **contextes** : des partitions de ses règles et de ses features. `ALL` existe toujours : c'est le socle, ce qui vaut pour tout le projet. Un projet qui sert une seule organisation n'a que `ALL`, et l'écrit quand même : `RULE_ALL_LIC-3`, jamais `LIC-3`. Dans un projet qui sert plusieurs fédérations, chaque fédération est un contexte (`FNSMR`, `FFSA`). Un client n'est pas un contexte : un projet qui a plusieurs clients et un seul produit n'a que `ALL`.

Le contexte s'écrit en majuscules dans l'identifiant et en minuscules dans les noms de dossiers (`all/`, `fnsmr/`). La liste des contextes d'un projet est dans son manifeste Anchorpost s'il en a un, sinon dans ce fichier, sous le registre des trigrammes.

Une **règle de socle instanciée** par un contexte (`RULE_FNSMR_MUT-05` qui instancie `RULE_ALL_MUT-01`) le déclare dans son en-tête (`instanceOf`), et hérite des preuves du socle tant qu'elle n'en a pas en propre.

### Le trigramme

Le trigramme désigne le **sujet** : un domaine métier (`LIC` licences, `PLA` planning) ou un sujet technique (`ARC` transverse, `WEB` client web). Il vient toujours du registre, et il a **de deux à quatre lettres**. **Un sigle a un seul sens dans tout le dépôt**, tous contextes confondus : un sigle commun à plusieurs contextes (`LIC` dans chaque fédération) désigne partout le même sujet. Deux sujets différents ne partagent jamais un sigle : voir [Résoudre une collision de sigles](#résoudre-une-collision-de-sigles). Un même trigramme sert aux règles, aux specs, aux ADR et aux documents de ce sujet : le type les distingue, pas le trigramme. `ARC` reste le trigramme des décisions transverses, celles qui n'appartiennent à aucun sujet : `ADR_ALL_ARC-11`.

---

## Pourquoi

Un identifiant se cite **partout** sans chemin : tickets, commits, conversations, tests, autres documents. Il doit donc être unique, stable, et lisible seul. La forme à trois parties garantit les trois : le type empêche qu'une règle et une spec portent le même nom (`RULE_ALL_ANC-1` et `SPEC_ALL_ANC-1` coexistent), le contexte empêche que deux fédérations se confondent (`RULE_FNSMR_LIC-05` et `RULE_FFSA_LIC-05` sont deux règles), et personne n'a besoin d'un registre pour lire un identifiant.

**L'arborescence ne porte plus que le rangement ; le nom porte l'identité.** Un fichier peut déménager, sa citation reste juste.

---

## L'arborescence

Tout vit sous `docs/`, trié par thème. Il n'y a pas de dossier de travail à côté : ni `.scratch/`, ni brouillon hors de l'arbre.

```
docs/
├── adr/                         ADR_ALL_ARC-1-… ; un sous-dossier par sujet (web/, mobile/)
├── architecture/                guides techniques : DOC_ALL_API-1-…
├── infrastructure/              hébergement, base, CI/CD : DOC_ALL_INF-1-…
├── design/                      DSG_ALL_DES-1-… ; proto/ pour les prototypes HTML jetables
├── metier/
│   ├── regles/<ctx>/            le registre : un fichier par règle, RULE_<CTX>_<TRI>-<n>.md
│   ├── reference/               la référence fonctionnelle : DOC_ALL_<TRI>-<n>-…
│   └── reunions/                comptes rendus datés : reunion-<AAAA-MM-JJ>-<sujet>.md
├── features/<feature>/<ctx>/    SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md, .map.md, et issues/
├── demandes/<ctx>/              REQ_<CTX>_<TRI>-<n>-<slug>.md
├── methode/                     comment on travaille (grilling, décisions, nomenclature, conception, CI)
├── agents/                      configuration des skills et gabarits
├── sources/                     documents bruts fournis en entrée, pas de la spec
└── questions-ouvertes.md        les questions non tranchées, datées et sourcées
anchorpost/                      manifest.json (écrit à la main) et anchorpost.json (généré), si le projet est suivi
```

**Le dossier de contexte existe toujours**, même pour un projet à un seul contexte : `docs/metier/regles/all/`, `docs/features/<feature>/all/`, `docs/demandes/all/`. Pas de doute possible sur ce qui vaut partout.

| Thème              | Dossier                 | Contenu                                                           | Frontière                                                                                  |
| ------------------ | ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **ADR**            | `docs/adr/`             | les décisions et leur _pourquoi_                                  | un arbitrage entre alternatives ; sans alternative écartée, ce n'est pas une ADR           |
| **Architecture**   | `docs/architecture/`    | guides techniques qui ne sont **pas** des décisions               | comment faire une fois décidé ; le _pourquoi_ reste dans l'ADR citée                       |
| **Infrastructure** | `docs/infrastructure/`  | hébergement, base, CI/CD, déploiement                             | où et comment ça tourne ; jamais ce que le métier exige                                    |
| **Design**         | `docs/design/`          | charte, tokens, planches, prototypes                              | ce que l'utilisateur voit et touche ; jamais une règle métier déguisée en écran            |
| **Métier**         | `docs/metier/`          | `regles/` (le registre), `reference/`, `reunions/`                | **ce qui reste vrai après** la livraison ; une règle s'y écrit **une fois**                |
| **Feature**        | `docs/features/`        | un dossier par feature, un sous-dossier par contexte              | **du travail en cours** ; une spec **cite** les règles, elle ne les formule jamais         |
| **Demande**        | `docs/demandes/`        | ce que la MOA demande, avant qu'une spec existe                   | une demande naît d'un grilling et meurt dans une spec                                      |

**Créés paresseusement** : un dossier naît avec son premier document, sauf le dossier de contexte `all/`, que le socle pose.

> **Feature ou métier ?** La frontière est la **durée de vie**. Une feature est du travail en cours : une spec et des tickets qui finissent « faits ». Le métier est ce qui reste vrai après : le registre, la référence, les comptes rendus. **Une spec ne formule jamais une règle métier** : une règle découverte en écrivant une spec entre au registre comme `candidate`, avec son identifiant, et la spec la **cite**. Si la règle change, un seul fichier bouge, au registre.

> **ADR ou architecture ?** Une **ADR** consigne un arbitrage. Un document d'**architecture** explique comment faire une fois décidé. `apps/api/docs/ARCHITECTURE_GUIDELINES.md` fait exception et reste près du code qu'il gouverne.

### Les noms de fichiers

Le nom du fichier porte l'identifiant complet. Un `grep` de l'identifiant trouve le fichier et toutes ses citations.

| Objet                   | Nom du fichier                                              |
| ----------------------- | ----------------------------------------------------------- |
| règle                   | `RULE_<CTX>_<TRI>-<n>.md` (le titre est dans l'en-tête, pas dans le nom) |
| spec                    | `SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md`                       |
| ticket                  | `issues/SPEC_<CTX>_<TRI>-<n>-<slug>.<NN>.issue.md`          |
| carte de chantier       | `SPEC_<CTX>_<TRI>-<n>-<slug>.map.md`                        |
| ADR, design, guide      | `ADR_<CTX>_<TRI>-<n>-<slug>.md`, `DSG_…`, `DOC_…`           |
| demande                 | `REQ_<CTX>_<TRI>-<n>-<slug>.md`                             |

Le slug est en kebab-case minuscule, dans la langue du titre. Le nom de branche d'un ticket reprend l'identifiant en minuscules, tirets bas et points devenus tirets : `feat/spec-fnsmr-pay-3-02-<nom>`.

### Hors nomenclature

| Chemin                                  | Convention                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `docs/methode/`                         | nom parlant (`grilling.md`) : ce sont les règles elles-mêmes               |
| `docs/sources/`                         | `<sujet>-<AAAA-MM-JJ>.<ext>`, entrées brutes datées à la source            |
| `docs/metier/reunions/`                 | `reunion-<AAAA-MM-JJ>-<sujet>.md` ; une réunion n'est pas un sujet         |
| `docs/design/proto/`                    | prototypes HTML jetables, un par parcours ; du code qu'on jette            |
| `docs/agents/`                          | config des skills et gabarits                                              |
| `anchorpost/`                           | `manifest.json`, `anchorpost.json` : noms fixes, lus par la CLI            |
| `README.md`, `CLAUDE.md`, `GLOSSARY.md` | noms conventionnels, jamais renommés                                       |
| `docs/questions-ouvertes.md`            | nom conventionnel, les questions non arbitrées                             |

**Pas de sommaire écrit à la main.** Le nom du fichier porte son identité, lister le dossier suffit. Le seul index est **généré** : `anchorpost/anchorpost.json`, quand le projet est suivi par Anchorpost ([`decisions.md`](decisions.md#documentation-vivante--trois-couches)).

**Un `README.md` n'est pas un sommaire.** Il dit comment lancer le projet et se repérer. S'il se met à lister des fichiers, il devient un index, et il faut l'arrêter.

---

## Registre des trigrammes

**Ce tableau est la source de vérité, et il est unique** : un seul registre pour tout le dépôt, pas un par contexte. On y ajoute une ligne dès qu'un sujet apparaît, **avant** d'écrire le premier fichier qui le porte. La colonne « Sujet » est le nom que lit la MOA : c'est le nom du domaine dans Anchorpost, et le titre de l'EPIC quand le manifeste n'en déclare aucun (`PLA — Planning`). Un domaine est transverse : il peut concerner plusieurs modules (EPIC) ; il ne donne pas de module à ses règles : une règle déclare les siens, ou les reçoit d'une spec qui déclare la réaliser.

| Trigramme | Sujet                                                         | Statut                                                 |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `ARC`     | transverse — décisions qui n'appartiennent à aucun sujet      | réservé, racine de `docs/adr/`                         |
| `INF`     | infrastructure (hébergement, base, CI/CD, déploiement)        | réservé                                                |
| `SEC`     | sécurité (auth, cadence, audit, RGPD)                         | réservé                                                |
| `API`     | guides propres au service back (`apps/api/`)                  | réservé — conditionné à la forme du dépôt              |
| `WEB`     | guides propres au client (`apps/web/`)                        | réservé — conditionné à l'existence d'un client        |
| `MOB`     | guides et décisions propres au client mobile (`apps/mobile/`) | réservé — conditionné à l'existence d'un client mobile |
| `DES`     | design system                                                 | réservé — conditionné à l'existence d'un client        |
| `SOC`     | socle technique — la spec et les tickets du squelette         | actif dès la pose du socle                             |

Le tableau ne contient que les trigrammes **structurels**. Les trigrammes de **sujets métier** s'ajoutent quand le sujet apparaît réellement, au grilling, puis au fil du projet. **Ne pas les pré-inventer** depuis les documents sources.

### Contextes du projet

| Contexte | Nom affiché | Statut |
| -------- | ----------- | ------ |
| `ALL`    | {{TITRE}}   | le socle, toujours présent |

Un projet suivi par Anchorpost tient cette liste dans `anchorpost/manifest.json` ; ce tableau en est alors la copie lisible.

---

## Résoudre une collision de sigles

**Le constat.** Deux domaines différents portent le même sigle, souvent dans deux contextes : `DIS` pour les sanctions dans une fédération et pour les disciplines sportives dans une autre. Un sigle **partagé** par plusieurs contextes est le cas normal, tant qu'il garde le même sens partout (`LIC` dans chaque fédération).

**La règle.** Avant de créer un sigle, **préférer un domaine existant** du registre. Si la collision est réelle, le sigle reste au domaine le plus répandu ; l'autre domaine reçoit un nouveau sigle de deux à quatre lettres, une lettre changée ou une quatrième ajoutée (`DIS` → `DISC`), inscrit au registre **avant** tout fichier qui le porte.

**L'outil.** Les règles se renomment par `anchorpost migrate identifiers`, avec la table `renames` d'`anchorpost/identifiers-resolutions.json` :

```json
{ "renames": [{ "from": "RULE_<CTX>_<TRI>-<n>", "to": "RULE_<CTX>_<NOUVEAU>-<m>" }] }
```

On relit le plan, puis `--apply`, puis `--check`, qui doit sortir 0. Il demande `@maj-agency/anchorpost` ≥ 1.1.1. Pour un dépôt dont les anciens documents du socle s'écrivaient `ALL-LIC-1-…`, poser `bareAliases: false` dans `extensions.anchorpost.migrate` avant le premier `--apply` (voir la fiche `.claude/rules/anchorpost.md`).

**Quand.** **Avant la première lecture du dépôt par Anchorpost** : une fois lu, un identifiant ne se renomme plus. Une collision découverte plus tard se règle sur les documents à venir, avec un sigle nouveau.

**Pourquoi.** C'est le seul cas où un identifiant se renomme, et seulement avant cette première lecture : il était faux, puisque son sigle disait autre chose. On le fait une fois, par la table commise, et jamais à la main.

---

## Ce qu'est une règle, ce qui n'en est pas une

Une **règle** (`RULE`) dit ce que le **logiciel** permet, exige, calcule ou refuse. Ce qui n'en est pas une va ailleurs :

| Ce que c'est                                                                         | Où ça va                                  | Exemple                                          |
| ------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| une fonctionnalité voulue                                                            | une **demande** (`REQ`)                   | « Billetterie », « Partenaires »                 |
| une règle de l'organisation cliente sans rapport avec le logiciel                    | un **document** (`DOC`), qui garde son énoncé, sa source et sa raison | une règle fédérale d'équipement, la composition d'une instance |
| un doute sur l'application de la règle par le logiciel                               | reste une règle ; la question remonte au produit |                                          |

## Créer un trigramme absent du registre

**C'est un geste normal, pas une exception.** Quand le sujet d'un document n'a pas encore de trigramme, on le crée.

0. **Préférer un domaine existant.** Parcourir le registre : un sujet qui s'y range n'a pas besoin d'un sigle nouveau.
1. **Nommer le sujet**, pas le document ni le dossier. Ce sujet portera-t-il plusieurs documents ou règles dans le temps ? Sinon, il appartient à un sujet existant.
2. **Choisir deux à quatre lettres** évoquant le sujet, dans la langue du projet.
3. **Vérifier la collision** contre tout le registre. Si les lettres sont prises, **le nouveau sujet prend une lettre de plus** ; l'existant ne change jamais.
4. **Écrire la ligne dans le registre**, avec le sujet en clair.
5. **Puis seulement** créer le fichier, avec le numéro `1`.

Ce n'est pas une question à poser : c'est une étape, visible dans le diff. Ce qui se discute avec un humain, c'est le découpage en sujets, pas les lettres.

---

## Créer un document, une règle, une demande

1. Identifier le **type**, le **contexte** et le **sujet**.
2. Chercher le trigramme dans le registre. S'il n'y figure pas, le créer.
3. Prendre le prochain numéro : `node scripts/docs/next-id.mjs RULE ALL LIC` (le script fait un fetch, puis lit l'arbre, `origin/develop`, les branches de sujet et de cadrage non fusionnées et les fichiers des PR ouvertes ; `next-id.mjs SPEC_ALL_SOC-4` rend l'index du prochain ticket).
4. Créer le fichier dans le dossier de son type et de son contexte, d'après le gabarit de `docs/agents/gabarits/`.

---

## Citer

Toujours par l'identifiant complet, jamais par le chemin :

> ✅ « conforme à `ADR_ALL_ARC-2` », « implémente `RULE_FNSMR_LIC-05` »
> ❌ « conforme à `docs/adr/0002-transactions.md` », « implémente `LIC-05` »

Un lien Markdown vers le fichier est bienvenu **en plus** de l'identifiant, jamais à sa place. Un test qui prouve une règle porte son identifiant entre crochets en tête de son nom : `it('[RULE_FNSMR_LIC-05] …')` (`.claude/rules/tests.md`).

**Quand une production contredit une ADR existante, le dire explicitement** plutôt que de l'écraser en silence :

> _Contredit `ADR_ALL_ARC-7` (contrats Zod), mais mérite d'être rouvert parce que…_
