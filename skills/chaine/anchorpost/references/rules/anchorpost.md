---
paths:
  - "docs/**"
  - "anchorpost/**"
---

# Documentation lue par Anchorpost

Ce dépôt est lu par Anchorpost, qui montre à la MOA ses règles métier, leurs preuves, ses défauts et ses demandes depuis un seul fichier généré, `anchorpost/anchorpost.json`. Cette fiche dit ce qu'il faut écrire pour être lu. La convention complète : `docs/methode/nomenclature.md` (identifiants), `docs/methode/decisions.md` § « Registre des règles métier », `docs/agents/issue-tracker.md` (tickets et demandes), `.claude/rules/tests.md` (étiquettes de tests).

## Identifiants

Tout se cite par un identifiant complet `<TYPE>_<CTX>_<TRI>-<n>` : `RULE_ALL_LIC-3`, `SPEC_FNSMR_PAY-3.02`, `ADR_ALL_ARC-11`, `REQ_ALL_LIC-7`. Le contexte s'écrit toujours, `ALL` compris. Le prochain numéro : `node scripts/docs/next-id.mjs RULE ALL LIC`. Un identifiant existant ne se renomme jamais.

**Un sigle, un domaine, un sens.** Un sigle a un seul sens dans tout le dépôt ; le partager entre contextes est normal (`LIC` partout). Avant d'en créer un, prendre un domaine existant du registre. Une collision se règle par `renames` (`anchorpost/identifiers-resolutions.json`, `anchorpost migrate identifiers`), **avant la première lecture par Anchorpost** : après, plus aucun renommage. Voir `docs/methode/nomenclature.md` § « Résoudre une collision de sigles ».

## Ce qu'est une règle

Une règle dit ce que le logiciel permet, exige, calcule ou refuse. Une fonctionnalité voulue (« Billetterie », « Partenaires ») est une **demande** `REQ`. Une règle de l'organisation cliente sans rapport avec le logiciel (une règle fédérale d'équipement, la composition d'une instance) est un **document** `DOC`, avec son énoncé, sa source et sa raison. Dans le doute, c'est une règle, et la question remonte au produit.

## Une règle est un fichier

`docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, d'après `docs/agents/gabarits/regle.md`. En haut, un en-tête YAML ; en bas, l'énoncé en markdown libre, dans la langue du projet, avec ses précisions datées et ses passages barrés.

- **Qui écrit quoi.** `validation` (`candidate`, `validated`, `rejected`, `obsolete`, avec `date`, `by`, `reason`) est écrite par un humain. **Un agent n'écrit jamais `validated`** ; il crée une règle `candidate` et le dit. La réalisation (à construire, configurée, prouvée) **ne s'écrit pas** : elle se lit dans les tests. Seules `exception: not-applicable` et `exception: contradiction` s'écrivent, avec leur raison.
- **Les liens** se déclarent dans l'en-tête (`links`, `instanceOf`), typés. Citer une autre règle dans l'énoncé par son identifiant complet suffit pour qu'Anchorpost déduise un lien « mentionne » ; ce n'est pas un lien déclaré.
- **Les noms des personnes s'écrivent** (`by`, `decisions[].by`, les sources). Anchorpost les affiche avec leur rôle quand la table du manifeste le connaît.
- **Une règle n'est jamais supprimée** : `rejected` ou `obsolete`, avec la raison.

## Les tests prouvent

Un test qui prouve une règle porte son identifiant entre crochets en tête de son nom : `it('[RULE_ALL_LIC-3] should …')`. Plusieurs étiquettes se juxtaposent ; une étiquette sur un `describe` vaut pour ses tests. Jamais d'étiquette sur un test qui ne prouve pas la règle, jamais sur un test de recette. La catégorie et le niveau de la preuve viennent du chemin et du suffixe du fichier (`.claude/rules/tests.md`).

## Les tickets et les demandes

- Chaque ticket porte `Type:` (`task`, `défaut`, `grilling`, `research`) et, s'il réalise ou corrige des règles, `Règles:` avec leurs identifiants complets. Le gate refuse une règle absente.
- Un ticket `Type: défaut` nomme dans `## Surfaces` les tests qui prouvent la correction ; `Fait`, ces tests existent et ne sont pas désactivés.
- Une demande de la MOA est un fichier `docs/demandes/<ctx>/REQ_<CTX>_<TRI>-<n>-<slug>.md` (`docs/agents/gabarits/demande.md`), `Status: needs-triage` à sa naissance, `Suite:` vers la spec qu'elle produit. La spec porte `Origine:`.
- Une question ouverte (`docs/questions-ouvertes.md`) dont la ligne `Bloque :` cite une règle la marque « a une question ouverte » dans Anchorpost, sans changer ses statuts.

## Le manifeste et l'index

- `anchorpost/manifest.json` est écrit à la main : nom, pitch, contextes, EPIC, documents à rendre, table nom → rôle, planchers. Un EPIC est un module de l'application, un pan fonctionnel (`{ "id": "licences", "name": "Gestion des licences", "domains": ["LIC"] }`) qui regroupe un ou plusieurs domaines ; l'EPIC « Technique » est fourni par défaut, et la santé signale un domaine qu'aucun EPIC ne liste. Un chemin hors convention se déclare sur son contexte (`rules`, `features`, `requests`). Un plancher se relève à la main, jamais ne se baisse.
- `anchorpost/anchorpost.json` est **généré** par `pnpm anchorpost:index`, **jamais édité** : le hook d'agent refuse, le gate `pnpm anchorpost:check` compare. Après toute modification de `docs/`, d'un test étiqueté ou d'un ticket : régénérer, puis `pnpm anchorpost:check` avant le push. Le capitaine régénère à chaque fusion.
- La section `health` de l'index liste ce que la CLI tolère mais signale : une `candidate` qui a des tests, une règle dite couverte sans test, un défaut sans règle. La lire après chaque régénération.
