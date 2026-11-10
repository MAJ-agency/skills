# CLAUDE.md

{{TITRE}} — {{DESCRIPTION}}

**Les identifiants de code sont en anglais, généralistes ; la prose est en {{LANGUE}}** — commentaires, commits (conventional commits), documentation, textes d'interface, noms de tests. `GLOSSARY.md` fait le pont : chaque terme métier y a son nom en code. Décision et raisons : [`docs/adr/ADR_ALL_ARC-4-langue-des-identifiants-de-code.md`](docs/adr/ADR_ALL_ARC-4-langue-des-identifiants-de-code.md).

> **État du dépôt — squelette technique, aucun métier.** Les services démarrent et les gardes de qualité mordent, mais **aucun domaine n'est modélisé** : `GLOSSARY.md` attend le grilling et `docs/metier/` n'existe pas. Ce qui reste à faire et ce qui reste à trancher est **déposé en tickets** dans `docs/features/socle/issues/`. Ne rien supposer d'existant qui ne soit pas listé ici.

## Les règles vivent ici — carte d'orientation

| Document                                                       | Fait autorité sur                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`README.md`](README.md)                                       | démarrage, outils, comment se repérer dans le dépôt (pour un humain)                        |
| [`docs/adr/`](docs/adr/)                                       | les décisions structurantes et leur _pourquoi_                                              |
| [`docs/methode/grilling.md`](docs/methode/grilling.md)         | **comment on interroge un plan** avant de l'écrire                                          |
| [`docs/methode/decisions.md`](docs/methode/decisions.md)       | ADR, `GLOSSARY.md`, registre de règles, documentation vivante                               |
| [`docs/methode/nomenclature.md`](docs/methode/nomenclature.md) | **nommer et citer** : `<TYPE>_<CTX>_<TRI>-<n>`, les six types, les contextes, le **registre des trigrammes**           |
| [`docs/methode/conception.md`](docs/methode/conception.md)     | modules profonds, TDD, revue                                                                |
| [`docs/methode/pare-feu-ci.md`](docs/methode/pare-feu-ci.md)   | les invariants vérifiés par la machine                                                      |
| [`GLOSSARY.md`](GLOSSARY.md)                                   | le langage ubiquitaire (glossaire, et rien d'autre)                                         |
| [`.claude/rules/`](.claude/rules/)                             | fiches transverses chargées par chemin — `tests.md` pour tout test ou configuration de test |

<!-- socle:routing -->

<!-- socle:avant-code -->

Toute divergence par rapport à ces règles fait l'objet d'une **ADR**, justifiée — jamais d'un écart silencieux.

## Méthode de travail

1. **Grilling** — faire tomber les non-dits avant d'écrire quoi que ce soit. Protocole : [`docs/methode/grilling.md`](docs/methode/grilling.md). Le projet est neuf : il est **architectural**, donc questions → approches → design → **spec écrite**.
   **On grille toujours avec les skills de Matt Pocock, jamais à la main** : `/mattpocock-skills:grill-with-docs`, c'est-à-dire `grilling` + `domain-modeling`. Seul un humain peut taper `grill-with-docs` ; quand l'agent doit griller sans qu'on l'ait tapé, il charge lui-même `mattpocock-skills:grilling` puis `mattpocock-skills:domain-modeling`. Si l'humain tape `grill-me`, l'agent charge aussi `domain-modeling` : ici, un grilling, c'est toujours `grill-with-docs`. Ils lisent et complètent `GLOSSARY.md` à la racine.
2. **Documentation** — glossaire, règles métier, ADR, spec technique. Format : [`docs/methode/decisions.md`](docs/methode/decisions.md).
3. **Code** — **par balles traçantes** : construire d'abord une tranche minuscule de bout en bout, la faire tourner, demander un retour, puis étendre à partir de là — une tranche par fenêtre de contexte. À l'intérieur d'une tranche, TDD et les règles impératives du service concerné (`apps/<service>/CLAUDE.md`). Méthode : [`docs/methode/conception.md`](docs/methode/conception.md).

Les documents fournis en cours de projet atterrissent dans [`docs/sources/`](docs/sources/) — ce sont des **entrées brutes**, pas de la spécification.

**Après toute modification de code ou de documentation, lancer `graphify update .`** pour que le graphe de connaissance reste vrai.

## Agent skills

Les skills de Matt Pocock (`mattpocock-skills`) sont déclarés dans [`.claude/settings.json`](.claude/settings.json) : le marketplace `mattpocock/skills` et le plugin activé. En local, Claude Code propose de les installer à l'ouverture du dépôt ; dans le cloud, c'est le script de configuration de l'environnement qui les installe (`claude plugin marketplace add mattpocock/skills`, puis `claude plugin install mattpocock-skills@mattpocock`) **et les met à jour à chaque démarrage** (`claude plugin marketplace update mattpocock`, puis `claude plugin update mattpocock-skills@mattpocock`) : l'image de l'environnement garde la version de son dernier build, et `install` ne touche pas à un plugin déjà présent ; les commandes gardent le préfixe `/mattpocock-skills:` (par exemple `grill-with-docs`, `code-review`).

Les skills de Maj-agency (`maj-skills`, dépôt [`MAJ-agency/skills`](https://github.com/MAJ-agency/skills)) sont déclarés de la même façon : le marketplace `maj` et le plugin `maj-skills@maj` dans `.claude/settings.json` ; le dépôt est **privé** : en local, un `git` authentifié sur GitHub suffit ; dans le cloud, le script de configuration ne peut pas le cloner, donc `MAJ-agency/skills` figure dans les **Dépôts** de l'environnement et le script installe le plugin depuis ce clone (`claude plugin marketplace add "$PWD/skills"`, puis `claude plugin install maj-skills@maj`), toujours à la version du clone. Préfixe `/maj-skills:` — les socles `socle-monorepo`, `socle-tests`, `socle-contrats`, `socle-nest-hexagonal`, `socle-web-next`, `socle-mobile-expo`, et la chaîne de production `socle-chaine-de-production`, `tickets`, `revue-adversariale`, `revue-de-ticket`, `sujet`, `fusionner`, `chantier`, `recette-humaine` (plugin ≥ 3.2). Ils portent le socle technique et la méthode, aucune règle métier. La version du plugin est figée au démarrage d'une session : un skill absent de la liste installée se lit dans le dépôt `skills` en attendant la session suivante.

### Issue tracker

Les issues et les specs vivent en markdown sous `docs/features/<feature>/` — pas de tracker externe, et **aucun dossier de travail hors de `docs/`**. Voir [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

Les cinq rôles canoniques, sans renommage, portés par une ligne `Status:` en tête de chaque ticket. Voir [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Contexte unique : `GLOSSARY.md` + `docs/adr/` à la racine. Voir [`docs/agents/domain.md`](docs/agents/domain.md).
