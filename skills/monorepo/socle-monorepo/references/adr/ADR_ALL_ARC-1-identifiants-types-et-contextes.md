# ADR_ALL_ARC-1 — Identifiants à type et contexte : `<TYPE>_<CTX>_<TRI>-<n>`

- Statut : **accepté**
- Date : {{DATE}}
- Portée : tout ce qui se cite dans le dépôt — règles métier, specs et tickets, ADR, design, guides, demandes

## Contexte

Un dépôt du socle cite ses objets par un identifiant court, sans chemin : dans les tickets, les commits, les tests, les autres documents, et dans Anchorpost, qui lit le dépôt pour la MOA. Trois objets différents vivaient sous la même forme `<TRI>-<n>` : une règle métier (`LIC-3`), une spec (`ANC-1`), une ADR (`BEN-1`). La méthode promettait que « `LIC-3` désigne toujours une règle », mais rien ne l'empêchait : dans deux projets, un même identifiant désignait une règle **et** une spec ou une ADR, et le script qui lit le contexte d'un ticket ne pouvait pas les distinguer.

Deux autres besoins sont venus d'Anchorpost. Une règle appartient à un **contexte** (le socle `all`, ou une fédération), et deux contextes peuvent porter le même identifiant de règle (`LIC-05` chez FNSMR et chez FFSA) : la citation devait dire le contexte. Et le lecteur de la MOA doit comprendre un identifiant sans ouvrir le dépôt.

## Décision

**Tout identifiant s'écrit `<TYPE>_<CTX>_<TRI>-<n>`** : le type (`RULE`, `SPEC`, `ADR`, `DSG`, `DOC`, `REQ`), le contexte (`ALL` toujours écrit pour ce qui vaut partout), le trigramme du sujet, le numéro. Un ticket porte l'identifiant de sa spec suivi de `.NN`.

- Le type dit **ce que c'est** : `RULE_ALL_ANC-1` et `SPEC_ALL_ANC-1` coexistent sans se confondre, et aucun trigramme n'a dû être renommé.
- Le contexte dit **pour qui** : `RULE_FNSMR_LIC-05` et `RULE_FFSA_LIC-05` sont deux règles. `ALL` s'écrit toujours, même dans un projet à un seul contexte.
- Le trigramme dit **de quoi ça parle**, et vient toujours du registre de `nomenclature.md`. `ARC` reste le trigramme des décisions transverses.
- Le numéro est unique par type, contexte et trigramme. Un identifiant existant **ne se renomme pas**, même s'il porte des zéros de tête, sauf pour résoudre une collision de sigles avant la première lecture par Anchorpost.
- **Le nom du fichier porte l'identifiant complet.** Un `grep` trouve tout.
- **Le dossier de contexte existe toujours** (`docs/metier/regles/all/`, `docs/features/<feature>/all/`), même dans un projet à un seul contexte.

La règle opérationnelle complète vit dans [`../methode/nomenclature.md`](../methode/nomenclature.md).

## Alternatives écartées

- **Garder `<TRI>-<n>` et distinguer par un registre** (telle colonne dit si un trigramme porte des règles ou des documents). Lisible par un humain qui a le registre sous les yeux, illisible pour une regex et pour la MOA.
- **Un marqueur sur la règle seule** (`R-LIC-3`). Résout la collision règle contre document, pas la collision entre contextes, et laisse les specs et les ADR se confondre.
- **Le contexte en premier segment des specs seulement** (`ALL-ANC-1` spec, `ANC-1` règle, `ARC-11` ADR). Trois grammaires différentes pour trois objets, et une ADR de sujet (`BEN-1`) restait homonyme d'une règle.
- **Ne pas écrire `ALL`** quand le projet n'a qu'un contexte. Économise cinq caractères et crée un doute à chaque lecture, et une migration le jour où un second contexte apparaît.
- **Zéros de tête** pour un tri lexical. On ne trie pas les identifiants, on les cite ; Fedora garde les siens parce qu'un identifiant ne se renomme pas, un projet neuf n'en met pas.

## Conséquences

**Positives.** Un identifiant se lit seul, par un humain comme par un script. Une règle et une spec d'un même sujet portent le même trigramme sans collision. Anchorpost lit la clé d'une règle directement dans son identifiant.

**Coûts.** Des noms plus longs partout, y compris dans les noms de tests. Les dépôts déjà écrits migrent : la commande `anchorpost migrate` réécrit les identifiants dans tout l'arbre, et les scripts du skill `tickets` changent de grammaire.

**Risque et parade.** Un contexte écrit sous deux graphies (`FNSMR`, `Fnsmr`). La parade : majuscules dans l'identifiant, minuscules dans le nom du dossier, et le gate des tickets qui refuse une autre forme.

## Liens

- Règle opérationnelle : [`../methode/nomenclature.md`](../methode/nomenclature.md)
- Le registre, un fichier par règle : `ADR_ALL_ARC-<N>-registre-un-fichier-par-regle.md`
- Format et critères d'écriture des ADR : [`../methode/decisions.md`](../methode/decisions.md)
