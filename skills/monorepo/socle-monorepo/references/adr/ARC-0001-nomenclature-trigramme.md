# ARC-0001 — Nomenclature des documents : `<TRI>-<NNNN>-<slug>.md`

- Statut : **accepté**
- Date : {{DATE}}
- Portée : tous les documents de contenu du dépôt

## Contexte

La convention usuelle numérote les ADR à plat, `NNNN-slug.md`, avec un index tenu à la main. La séquence est unique dans `docs/adr/` et nulle part ailleurs : tous les autres documents — règles métier, référence fonctionnelle, specs de feature — n'ont aucun identifiant et se citent par leur chemin.

Deux conséquences, qui apparaissent dès que le dépôt dépasse la dizaine de documents :

- **Une référence par chemin casse au déplacement.** Réorganiser `docs/` invalide silencieusement toutes les citations déjà écrites dans les commits, les tickets et les autres documents.
- **L'index ment.** Tenu à la main, il diverge dès la première distraction, et rien ne le signale.

Le dépôt part de zéro : aucun document n'est encore nommé, donc le coût de la convention est nul aujourd'hui et croîtra avec chaque fichier créé.

## Décision

**Nommer `<TRI>-<NNNN>-<slug>.md` tout document de contenu**, ADR comprises.

- Le trigramme désigne le **sujet**, jamais le dossier ; il vient toujours d'un **registre** qui fait autorité.
- La séquence `NNNN` est unique **par trigramme, tous dossiers confondus**. Les numéros ne sont jamais réutilisés, même après suppression.
- Un sujet sans trigramme au registre : **on l'y inscrit, puis on crée le fichier.** Jamais l'inverse.
- Une décision transverse porte le trigramme réservé `ARC` et vit à la racine de `docs/adr/`.

Un document se cite alors par son **identifiant court** (`SEC-0005`), sans chemin, partout — commits, tickets, conversations, autres documents. L'arborescence ne porte plus que le _type_ ; le nom porte l'identité.

La **règle opérationnelle complète** — périmètre, exclusions, registre, procédures — vit dans [`../methode/nomenclature.md`](../methode/nomenclature.md). Cette ADR porte la décision et son _pourquoi_ ; elle ne duplique pas le _comment_.

**Corollaire : pas d'index dans `docs/adr/`.** Sous cette convention, un sommaire serait une copie de l'arborescence — il se périme sans que rien ne le signale. Le dossier se lit tel quel.

## Alternatives écartées

- **Numérotation plate `NNNN-slug.md`** — ne couvre que les ADR, laisse tous les autres documents sans identifiant, et impose un index tenu à la main.
- **Séquence par dossier** — rend la référence courte ambiguë : deux dossiers, deux `LIC-0001`. Or c'est la référence courte qui fait tout l'intérêt du dispositif.
- **Trigramme par dossier top-level** — fondrait toutes les features dans une seule séquence, et le trigramme cesserait de désigner un sujet pour ne plus désigner qu'un rangement.
- **Pré-remplir le registre avec les sujets pressentis** — fige un découpage du domaine qui n'a pas encore été tranché. Les trigrammes métier s'ajoutent quand le sujet apparaît réellement.

## Conséquences

**Positives.** Une référence ne casse pas au déplacement d'un fichier. Aucun index à maintenir. Le nom d'un fichier suffit à savoir de quoi il parle.

**Coûts.** Attribuer un numéro demande de scanner tout `docs/` pour le trigramme concerné — c'est une commande, pas un coup d'œil. Et la convention diffère de celle des dépôts voisins qui numérotent à plat : une référence croisée doit dire de quel dépôt elle parle.

**Risque et parade.** Un registre qui ment (fichier créé avant l'entrée) rend la convention inutile. La parade est l'ordre imposé — registre d'abord, fichier ensuite — et le fait que l'ajout au registre soit visible dans le diff, donc arbitrable en revue.

## Liens

- Règle opérationnelle : [`../methode/nomenclature.md`](../methode/nomenclature.md)
- Format et critères d'écriture des ADR : [`../methode/decisions.md`](../methode/decisions.md)
