# Ce que contient le skill anchorpost, et pourquoi

## `manifest.json`

Le squelette du manifeste, écrit à la main par un humain et jamais généré après `init`. Il porte ce que les sources ne disent pas : le nom et le pitch du projet, ses publics, ses contextes (identifiant, nom, chemin des sources quand il sort de la convention, plancher), ses regroupements EPIC facultatifs, les documents à rendre tels quels, la table nom → rôle. Clés en anglais, comme le schéma pivot d'Anchorpost (`ANC-2`, version 2) : un seul vocabulaire des fichiers du projet jusqu'à l'écran.

## `rules/anchorpost.md`

La fiche chargée dès qu'un agent touche `docs/**` ou `anchorpost/**`. Elle dit comment écrire pour être lu : une règle est un fichier à en-tête YAML ; la validation est humaine, la réalisation se lit dans les tests ; l'étiquette `[RULE_<CTX>_<TRI>-<n>]` ; les en-têtes `Type:` et `Règles:` ; les demandes ; l'index qu'on régénère et qu'on n'édite jamais. Elle tient en moins de deux cents lignes (`budget-contexte`).

## `scripts/verify/anchorpost.mjs`

Un relais d'une ligne vers `pnpm anchorpost:check`, pour que `.claude/chaine.json` et le hook de fin de tour trouvent le gate comme les autres, sous `scripts/verify/`. La vérification elle-même est dans le paquet, versionnée : un changement de la liste rouge est une version du paquet, pas un patch dans chaque dépôt.

## `adr/ADR_ALL_ARC-N-index-anchorpost.md`

La décision pour le projet : son index est commis dans son dépôt, généré et vérifié par un paquet privé, lu par Anchorpost sans calcul ; la CLI reste hors ligne. Les alternatives écartées (calcul côté serveur, scripts copiés, paquet public) sont celles du grilling d'Anchorpost (`ARC-11`, `ARC-13` de ce dépôt-là, sous sa forme d'avant le standard tant qu'il n'a pas migré), reprises ici pour que le projet n'ait pas à les rejouer.

## `fragments/`

- `admin.md` — ce qu'un administrateur fait à la main : l'accès du dépôt au paquet, la clé par environnement, la création de l'espace. Jamais une valeur.
- `claude-md-routing.md` — la ligne de la carte d'orientation de `CLAUDE.md` qui renvoie à la fiche et au manifeste.
- `readme-ou-vit-quoi.md` — les deux lignes de l'arbre du `README.md` pour `anchorpost/`.
