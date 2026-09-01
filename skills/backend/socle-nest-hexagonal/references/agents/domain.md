# Documentation de domaine — règles de lecture

Comment les skills doivent **consommer** la documentation de domaine de ce dépôt en explorant le code.

> Ce fichier ne dit pas comment **écrire** une ADR ni comment tenir le glossaire — ça vit dans [`../methode/decisions.md`](../methode/decisions.md) (critères, format MADR, règles du glossaire) et [`../methode/nomenclature.md`](../methode/nomenclature.md) (nommage). Une seule source de vérité par sujet.

## Avant d'explorer, lire

- **`CONTEXT.md`** à la racine — le glossaire, le langage ubiquitaire.
- **`docs/adr/`** — les ADR qui touchent la zone où tu t'apprêtes à travailler.

Si l'un de ces fichiers est absent ou vide, **continuer en silence**. Ne pas signaler l'absence, ne pas proposer de les créer d'avance. `/domain-modeling` (atteint via `/grill-with-docs`) les remplit paresseusement, quand un terme ou une décision est réellement tranché.

> **`CONTEXT.md` est aujourd'hui vide, et c'est voulu** : le langage du projet se construit au grilling, terme par terme. Ne pas le pré-remplir depuis les documents sources.

## Structure

Contexte **unique** — un seul domaine métier dans ce dépôt :

```
/
├── CONTEXT.md          ← glossaire, et rien d'autre
├── docs/adr/           ← ARC-0001, ARC-0002, ARC-0002…
└── apps/ · packages/
```

Il n'y a pas de `CONTEXT-MAP.md` : `pnpm-workspace.yaml` et `packages/` signalent des **paquets**, pas des contextes métier. Un service et un paquet de contrats restent un seul domaine. Si plusieurs domaines distincts apparaissaient un jour, la bascule vers un `CONTEXT-MAP.md` serait à décider explicitement.

## Utiliser le vocabulaire du glossaire

Quand ta production nomme un concept du domaine — titre d'issue, proposition de refactoring, hypothèse, nom de test — employer le terme tel que `CONTEXT.md` le définit. Ne pas dériver vers un synonyme que le glossaire écarte explicitement.

Si le concept dont tu as besoin n'est pas encore au glossaire, **c'est un signal** : soit tu inventes un langage que le projet n'emploie pas (à reconsidérer), soit il y a un vrai manque (à noter pour `/domain-modeling`).

## Signaler un conflit avec une ADR

Si ta production contredit une ADR existante, le dire explicitement plutôt que de l'écraser en silence :

> _Contredit `ARC-0002` (transactions et isolation) — mais mérite d'être rouvert parce que…_

Les ADR se citent par leur **identifiant court** (`ARC-0002`), jamais par leur chemin.
