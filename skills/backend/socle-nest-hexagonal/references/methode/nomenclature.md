# Nomenclature des documents — `<TRI>-<NNNN>-<slug>.md`

Le _pourquoi_ de cette règle, avec ses alternatives écartées, vit dans [`ARC-0001`](../adr/ARC-0001-nomenclature-trigramme.md). Ce fichier porte le _comment_ : périmètre, registre des trigrammes, procédures.

> **Elle s'applique à tous les documents de contenu, pas seulement aux ADR.**

---

## La règle

Tout document de contenu est nommé `<TRI>-<NNNN>-<slug>.md` :

- **`<TRI>`** — trigramme du **sujet**, pas du dossier. Il vient **toujours** du [registre](#registre-des-trigrammes) ci-dessous : soit il y figure déjà, soit **on l'y inscrit avant de créer le fichier**.
- **`<NNNN>`** — séquence **unique par trigramme, tous dossiers confondus**. Pour l'attribuer : scanner tout l'arbre `docs/` à la recherche du plus grand `NNNN` de ce trigramme, et incrémenter. **Les numéros ne sont jamais réutilisés**, même après suppression d'un document.
- **`<slug>`** — kebab-case minuscule, dans la langue du titre du document. Ne pas traduire le titre.

> **Le registre est la source de vérité : un trigramme qui n'y figure pas n'existe pas.** Un fichier nommé avec un trigramme absent du registre est un fichier mal nommé, même si le trigramme « tombe sous le sens ».

**En cas de collision, c'est le nouveau sujet qui prend une quatrième lettre. Le trigramme existant ne change jamais** — sinon toutes les références déjà écrites deviennent fausses.

---

## Pourquoi

Un document se cite par son **identifiant court** (`LIC-0005`), sans chemin, partout : issues, commits, conversations, autres documents. L'identifiant est unique dans tout le dépôt, donc la référence ne devient jamais ambiguë et ne casse pas quand le fichier déménage.

**L'arborescence ne porte plus que le _type_ de document ; le nom porte l'identité.**

Deux alternatives ont été écartées dans l'ADR d'origine :

- **Séquence par dossier** — rend la référence courte `LIC-0001` ambiguë (deux dossiers, deux `LIC-0001`).
- **Trigramme par dossier top-level** — fondrait toutes les features dans une seule séquence, et le trigramme cesserait de désigner un sujet.

---

## Périmètre

### Tout vit sous `docs/`, trié par thème

Il n'y a pas de dossier de travail à côté : ni `.scratch/`, ni brouillon hors de l'arbre. Un document appartient à **un** thème, et son dossier le dit.

| Thème            | Dossier              | Contenu                                                            |
| ---------------- | -------------------- | ------------------------------------------------------------------ |
| **ADR**          | `docs/adr/`          | les décisions et leur _pourquoi_ (`ARC-0001`, `ARC-0002`…)         |
| **Architecture** | `docs/architecture/` | guides techniques qui ne sont **pas** des décisions                |
| **Métier**       | `docs/metier/`       | registre des règles (`regles/`), référence fonctionnelle, réunions |
| **Feature**      | `docs/features/`     | un dossier par feature : sa spec et ses tickets                    |

Quatre dossiers de service complètent l'arbre, hors thème : `methode/` (comment on travaille), `agents/` (config des skills), `sources/` (entrées brutes), `superpowers/` (specs de session).

**Créés paresseusement** : un dossier naît avec son premier document, jamais d'avance.

> **ADR ou architecture ?** Une **ADR** consigne un arbitrage — il y avait des alternatives, on en a choisi une, on dit pourquoi. Un document d'**architecture** explique comment faire quelque chose une fois la décision prise (un guide de création d'endpoint, un schéma d'ensemble). Si le texte ne comporte pas d'alternative écartée, ce n'est pas une ADR.
>
> `apps/api/docs/ARCHITECTURE_GUIDELINES.md` fait exception et **reste près du code** qu'il gouverne : il est lu en même temps que `apps/api/CLAUDE.md`, et les séparer ferait perdre l'un des deux.

### Couvert par `<TRI>-<NNNN>-<slug>.md`

Tout document de contenu : `docs/adr/`, `docs/architecture/`, `docs/metier/regles/`, `docs/infrastructure/`, `docs/design/`, et les documents de fond d'une feature.

### Exclu — la mécanique, qui garde ses propres conventions

| Chemin                                 | Convention                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `docs/features/<slug>/spec.md`         | nom fixe — une spec par feature, consommée par les skills                     |
| `docs/features/<slug>/issues/`         | `<NN>-<slug>.md`, numérotés à partir de `01` — les tickets                    |
| `docs/methode/`                        | nom parlant (`grilling.md`, `conception.md`) — ce sont les règles elles-mêmes |
| `docs/sources/`                        | `<sujet>-<AAAA-MM-JJ>.<ext>` — entrées brutes, datées à la source             |
| `docs/superpowers/`                    | `AAAA-MM-JJ-<sujet>-design.md`                                                |
| `docs/agents/`                         | config des skills (`issue-tracker.md`, `triage-labels.md`, `domain.md`)       |
| `README.md`, `CLAUDE.md`, `CONTEXT.md` | noms conventionnels, jamais renommés                                          |

**Pas de sommaire.** Un dossier de documents n'a pas d'index : le nom du fichier porte son identité, donc lister le dossier suffit. Un sommaire tenu à la main serait une copie de l'arborescence, qui se périme sans que rien ne le signale. (Si un index devenait un jour utile — pour du rendu web par exemple — il serait **généré** depuis les fichiers et vérifié par le gate doc-drift, jamais écrit à la main : voir [`decisions.md`](decisions.md#documentation-vivante--trois-couches).)

**Un `README.md` n'est pas un sommaire.** Il dit à un développeur comment lancer le projet, quels outils installer, quelles règles suivre et comment se repérer dans le dépôt. C'est tout. S'il se met à lister des fichiers, il est en train de devenir un index — et il faut l'arrêter.

---

## Registre des trigrammes

**Ce tableau est la source de vérité.** Il s'étend au fil du projet : on y ajoute une ligne dès qu'un nouveau sujet apparaît, **avant** d'écrire le premier document qui le porte.

| Trigramme | Sujet                                                    | Statut                                          |
| --------- | -------------------------------------------------------- | ----------------------------------------------- |
| `ARC`     | transverse — décisions qui n'appartiennent à aucun sujet | réservé, racine de `docs/adr/`                  |
| `INF`     | infrastructure (hébergement, base, CI/CD, déploiement)   | réservé                                         |
| `SEC`     | sécurité (auth, cadence, audit, RGPD)                    | réservé                                         |
| `API`     | guides propres au service back (`apps/api/`)             | réservé — conditionné à la forme du dépôt       |
| `WEB`     | guides propres au client (`apps/web/`)                   | réservé — conditionné à l'existence d'un client |
| `DES`     | design system                                            | réservé — conditionné à l'existence d'un client |

Le tableau ci-dessus ne contient que les trigrammes **structurels**. Les trigrammes de **sujets métier** (features, epics) n'y sont volontairement pas : ils s'ajoutent quand le sujet apparaît réellement — au grilling, puis au fil du projet. **Ne pas les pré-inventer depuis les documents sources** : un trigramme créé pour un sujet qui n'a pas encore été tranché fige un découpage qui n'existe pas.

---

## Créer un trigramme absent du registre

**C'est un geste normal, pas une exception.** Le registre est incomplet par construction — il grandit avec le projet. Quand le sujet d'un document n'a pas encore de trigramme, **on le crée**, on ne bricole pas et on ne bloque pas.

1. **Nommer le sujet**, pas le document ni le dossier. Le test : ce sujet portera-t-il _plusieurs_ documents dans le temps ? Si la réponse est non, le document appartient probablement à un sujet existant — chercher lequel avant d'en créer un.
2. **Choisir trois lettres** évoquant le sujet, dans la langue du projet.
3. **Vérifier la collision** contre tout le registre. Si les trois lettres sont déjà prises, **c'est le nouveau sujet qui prend une quatrième lettre** — jamais l'existant, qui est déjà cité ailleurs.
4. **Écrire la ligne dans le registre ci-dessus**, avec le sujet en clair et son statut.
5. **Puis seulement** créer le fichier, avec le numéro `0001`.

> **L'ordre compte.** Le registre d'abord, le fichier ensuite. Créer le fichier puis « penser à » enregistrer le trigramme est exactement comme ça qu'un registre se met à mentir.

Ce n'est **pas une question à poser** avant d'agir : c'est une étape à exécuter, visible dans le diff comme n'importe quelle autre modification, et arbitrable en revue. En revanche, ce qui se discute avec un humain, c'est le **découpage en sujets** lui-même — pas les trois lettres.

---

## Créer un document — la procédure

1. Identifier le **sujet** du document (pas son dossier).
2. Chercher son trigramme dans le registre. **S'il n'y figure pas, le créer** — voir [la section ci-dessus](#créer-un-trigramme-absent-du-registre) — puis continuer.
3. Scanner `docs/` pour le plus grand `NNNN` de ce trigramme, **tous dossiers confondus**. Incrémenter.
4. Écrire le slug en kebab-case, dans la langue du titre.
5. Créer le fichier dans le dossier qui correspond à son **type**.

```bash
# étape 3 — le plus grand numéro du trigramme LIC, tous dossiers confondus
ls docs/**/LIC-*.md 2>/dev/null | sed 's/.*LIC-\([0-9]\{4\}\).*/\1/' | sort -n | tail -1
```

---

## Cas particulier des ADR

Cette convention **remplace** la numérotation séquentielle plate `NNNN-slug.md` usuelle des ADR. Une ADR est un document de contenu comme un autre : elle est nommée `<TRI>-<NNNN>-<slug>.md`.

- Une décision **rattachée à un sujet** porte le trigramme de ce sujet et vit dans le sous-dossier de ce sujet sous `docs/adr/`.
- Une décision **transverse**, qui n'appartient à aucun sujet, porte le trigramme réservé `ARC` et vit à la **racine** de `docs/adr/`.
- Une ADR **dit à quoi elle s'applique** quand ce n'est pas évident.

Le format du contenu (MADR simplifié) et les critères pour décider d'écrire une ADR ne changent pas : voir [`decisions.md`](decisions.md#adr--quand-en-écrire-une).

---

## Citer un document

Toujours par son **identifiant court**, jamais par son chemin :

> ✅ « conforme à `ARC-0002` »
> ❌ « conforme à `docs/adr/0002-transactions.md` »

Un lien Markdown vers le fichier reste bienvenu **en plus** de l'identifiant, jamais à sa place.

**Quand une production contredit une ADR existante, le dire explicitement** plutôt que de l'écraser en silence :

> _Contredit `ARC-0007` (contrats Zod) — mais mérite d'être rouvert parce que…_
