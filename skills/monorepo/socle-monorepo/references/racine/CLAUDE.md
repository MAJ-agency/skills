# CLAUDE.md

{{TITRE}} — {{DESCRIPTION}}

**Le code, les commentaires, les commits (conventional commits) et la documentation sont en {{LANGUE}}.** Conserver cette convention.

> **État du dépôt — squelette technique, aucun métier.** Les services démarrent et les gardes de qualité mordent, mais **aucun domaine n'est modélisé** : `CONTEXT.md` est vide et `docs/metier/` n'existe pas. Ce qui reste à faire et ce qui reste à trancher est **déposé en tickets** dans `docs/features/socle/issues/`. Ne rien supposer d'existant qui ne soit pas listé ici.

## Les règles vivent ici — carte d'orientation

| Document                                                       | Fait autorité sur                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`README.md`](README.md)                                       | démarrage, outils, comment se repérer dans le dépôt (pour un humain)                 |
| [`docs/adr/`](docs/adr/)                                       | les décisions structurantes et leur _pourquoi_                                       |
| [`docs/methode/grilling.md`](docs/methode/grilling.md)         | **comment on interroge un plan** avant de l'écrire                                   |
| [`docs/methode/decisions.md`](docs/methode/decisions.md)       | ADR, `CONTEXT.md`, registre de règles, documentation vivante                         |
| [`docs/methode/nomenclature.md`](docs/methode/nomenclature.md) | **nommer un document** : `<TRI>-<N>-<slug>.md`, et le **registre des trigrammes** |
| [`docs/methode/conception.md`](docs/methode/conception.md)     | modules profonds, TDD, revue                                                         |
| [`docs/methode/pare-feu-ci.md`](docs/methode/pare-feu-ci.md)   | les invariants vérifiés par la machine                                               |
| [`CONTEXT.md`](CONTEXT.md)                                     | le langage ubiquitaire (glossaire, et rien d'autre)                                  |
<!-- socle:routing -->

<!-- socle:avant-code -->

Toute divergence par rapport à ces règles fait l'objet d'une **ADR**, justifiée — jamais d'un écart silencieux.

## Méthode de travail

1. **Grilling** — faire tomber les non-dits avant d'écrire quoi que ce soit. Protocole : [`docs/methode/grilling.md`](docs/methode/grilling.md). Le projet est neuf : il est **architectural**, donc questions → approches → design → **spec écrite**.
2. **Documentation** — glossaire, règles métier, ADR, spec technique. Format : [`docs/methode/decisions.md`](docs/methode/decisions.md).
3. **Code** — **par balles traçantes** : construire d'abord une tranche minuscule de bout en bout, la faire tourner, demander un retour, puis étendre à partir de là — une tranche par fenêtre de contexte. À l'intérieur d'une tranche, TDD et les règles impératives du service concerné (`apps/<service>/CLAUDE.md`). Méthode : [`docs/methode/conception.md`](docs/methode/conception.md).

Les documents fournis en cours de projet atterrissent dans [`docs/sources/`](docs/sources/) — ce sont des **entrées brutes**, pas de la spécification.

**Après toute modification de code ou de documentation, lancer `graphify update .`** pour que le graphe de connaissance reste vrai.

## Agent skills

### Issue tracker

Les issues et les specs vivent en markdown sous `docs/features/<feature>/` — pas de tracker externe, et **aucun dossier de travail hors de `docs/`**. Voir [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

Les cinq rôles canoniques, sans renommage, portés par une ligne `Status:` en tête de chaque ticket. Voir [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Contexte unique : `CONTEXT.md` + `docs/adr/` à la racine. Voir [`docs/agents/domain.md`](docs/agents/domain.md).
