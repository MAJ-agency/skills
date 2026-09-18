# {{TITRE}}

{{DESCRIPTION}}

> **⚠️ Squelette technique, aucun métier.** Les services démarrent, la configuration est en place et les gardes de qualité mordent — mais **aucun domaine n'est modélisé** : pas d'entité, pas de use case, pas de base. `CONTEXT.md` est vide.
>
> **Ce qui reste à faire et ce qui reste à trancher est déposé en tickets** dans [`docs/features/socle/issues/`](docs/features/socle/issues/). Commencer par `1-modeliser-le-domaine` : presque tout en dépend.

---

## Comment ce dépôt fonctionne

Le projet se construit en trois temps, dans cet ordre. Chaque étape a ses règles écrites, et rien ne commence avant que la précédente soit close.

```
1. GRILLING          les sources sont interrogées jusqu'à ce que rien
   docs/sources/      ne reste supposé en silence
        │             → docs/methode/grilling.md
        ▼
2. DOCUMENTATION     ce qui est tranché est écrit : vocabulaire, décisions,
   CONTEXT.md         règles métier
   docs/adr/          → docs/methode/decisions.md · docs/methode/nomenclature.md
   docs/metier/
        │
        ▼
3. CODE              TDD, en suivant les règles du service concerné
   apps/<service>/    → apps/<service>/CLAUDE.md
```

**Le projet est neuf** : il n'a aucun flux existant à modifier. Toute demande de fonctionnalité est donc **architecturale** — questions, approches, design, puis spec écrite. Pas de code avant validation explicite.

### Comment une feature traverse le dépôt

Les briques ne se connaissent que dans un sens, et ce sens est vérifié par le lint :

```
packages/contracts      schémas Zod : corps, réponses, erreurs, enums    ← ne dépend de rien
packages/utils          fonctions pures partagées                        ← ne dépend de rien
        ▲                        ▲
        │                        │
apps/api                un service, hexagonal : domain ← application ← infrastructure
apps/web · apps/mobile  un client, en feuilles : lib ← components ← features ← app
```

Une règle métier s'écrit **une fois**, comme schéma Zod dans `packages/contracts`. Ce même objet :

1. **valide l'entrée de l'API** — le DTO du use case en dérive (`createZodDto`), le pipe global refuse ce qui ne passe pas ;
2. **valide le formulaire du client** — `zodResolver` sur le même schéma, aucune règle réécrite côté client ;
3. **type la réponse** — le client la **parse** à la frontière (`Schema.parse`), donc une API qui ment échoue là, pas trois composants plus loin ;
4. **produit le document OpenAPI** — généré, jamais écrit à la main, et `openapi:check` refuse toute dérive.

Un changement de contrat casse le typecheck de **tous** les consommateurs en même temps : c'est voulu, c'est le gate. Le détail de chaque brique vit dans son `CLAUDE.md` ; ce schéma dit seulement comment elles se tiennent.

## Où vit quoi

```
README.md                démarrage, outils, règles — ce fichier
CLAUDE.md                les mêmes repères, en instructions pour un agent
CONTEXT.md               glossaire du domaine (langage ubiquitaire) — et rien d'autre

apps/                    un dossier par service — chacun porte son CLAUDE.md
packages/                paquets partagés entre services

docs/                    TOUTE la documentation, triée par thème (l'arbre complet : docs/methode/nomenclature.md)
  adr/                   décisions et leur pourquoi — ARC-1, ARC-2… (sans zéro de tête)
  architecture/          guides techniques qui ne sont pas des décisions
  infrastructure/        hébergement, base, CI/CD, déploiement
  design/                design system
  metier/                ce qui reste vrai après les features
    regles/              registre des règles métier — identifiants stables, candidate → validée
    reference/           référence fonctionnelle : le produit tel qu'il est
    reunions/            comptes rendus datés
  features/<slug>/       le travail en cours : <slug>.spec.md + issues/<N>-<titre>.issue.md
  methode/               comment on travaille (grilling, décisions, nomenclature, conception, CI)
  agents/                configuration des skills (tracker, labels, domaine)
  sources/               documents bruts fournis en entrée — pas de la spec
  questions-ouvertes.md  les questions non tranchées, datées et sourcées

.husky/                  hooks git partagés par l'équipe
```

<!-- socle:ou-vit-quoi -->

**Tout vit sous `docs/`, trié par thème** — il n'y a aucun dossier de travail à côté. Les dossiers naissent avec leur premier document. Une spec de feature **cite** les règles métier du registre, elle ne les formule pas : la règle vit dans `metier/regles/`, la feature dans `features/`.

Il n'y a **pas de sommaire** dans `docs/adr/` : le nom d'un fichier porte son identité (`ARC-1`), donc lister le dossier suffit.

## Prérequis

| Outil      | Version                | Pour quoi                                                          |
| ---------- | ---------------------- | ------------------------------------------------------------------ |
| **Node**   | ≥ 22 (`.nvmrc`)        | lancer et construire les services                                  |
| **pnpm**   | ≥ 9                    | gestionnaire de paquets du monorepo                                |
| **git**    | —                      | tout                                                               |
<!-- socle:prerequis -->

## Démarrage

```bash
pnpm install
```

`pnpm install` installe Husky au passage : les hooks git de l'équipe sont posés sans geste supplémentaire.

Aucun `.env` n'est nécessaire en local : chaque service embarque ses valeurs de développement. Pour des secrets locaux, copier `.env.example` en `.env` (gitignored) — `process.env` garde toujours la priorité.

<!-- socle:demarrage -->

### Vérifier

```bash
pnpm check
```

`build` + `lint` + `typecheck` + `check:cycles` + `check:gates` (les gates propres à chaque brique : frontières d'architecture, dérive de contrat, cliquet de dette). C'est aussi ce que joue le hook `pre-push`, donc un push qui casse la qualité est refusé avant d'atteindre le dépôt.

| Commande                                            | Effet                                                          |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm build` · `pnpm lint` · `pnpm typecheck`       | par brique, orchestré par Turborepo                            |
| `pnpm test`                                          | les tests de chaque brique                                     |
<!-- socle:commandes -->

### Puis lire, dans cet ordre

1. Ce fichier — tu y es.
2. [`docs/features/socle/issues/`](docs/features/socle/issues/) — ce qui reste à faire et à trancher.
<!-- socle:lire-ensuite -->

## Les règles à suivre

| Document                                                       | Fait autorité sur                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`docs/methode/grilling.md`](docs/methode/grilling.md)         | comment interroger un plan avant de l'écrire                          |
| [`docs/methode/decisions.md`](docs/methode/decisions.md)       | quand écrire une ADR, tenir le glossaire et le registre de règles     |
| [`docs/methode/nomenclature.md`](docs/methode/nomenclature.md) | nommer un document, et créer un trigramme qui manque au registre      |
| [`docs/methode/conception.md`](docs/methode/conception.md)     | modules profonds, TDD, revue                                          |
| [`docs/methode/pare-feu-ci.md`](docs/methode/pare-feu-ci.md)   | les invariants que la machine doit garantir                           |
<!-- socle:regles -->

Quelques règles transverses, pour ne pas avoir à les chercher :

- **Tout est en {{LANGUE}}** — code, commentaires, commits (conventional commits), documentation.
<!-- socle:regles-transverses -->
- **Un document de contenu se nomme `<TRI>-<N>-<slug>.md`** et se cite par son identifiant court (`ARC-1`), jamais par son chemin. Si le sujet n'a pas de trigramme, **on l'inscrit au registre avant de créer le fichier**.
- **Aucun invariant critique ne dépend d'un relecteur** : chacun est un test bloquant en CI.
- **Rien n'est « validé » sans un geste humain.** Ni skill, ni agent n'écrit ce statut.

## Ce fichier doit rester vrai

Un README faux est pire que pas de README : il envoie chercher une commande qui n'existe pas, ou tait celle qui existe.

| Déclencheur                                       | À mettre à jour ici                    |
| ------------------------------------------------- | -------------------------------------- |
| Une commande de développement change              | **Démarrage**                          |
| Un outil devient nécessaire                       | **Prérequis**                          |
| Un dossier de premier niveau apparaît / disparaît | **Où vit quoi**                        |
| Une règle transverse est ajoutée ou levée         | **Les règles à suivre**                |
| Le premier module métier arrive                   | l'encadré d'état — il dit « aucun métier » |
