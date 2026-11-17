---
paths:
  - "docs/**"
  - "anchorpost/**"
---

# Documentation lue par Anchorpost

Ce dépôt est lu par Anchorpost, qui montre à la MOA ses règles métier, leurs preuves, ses défauts et ses demandes depuis un seul fichier généré, `anchorpost/anchorpost.json`. Cette fiche dit ce qu'il faut écrire pour être lu. La convention complète : `docs/methode/nomenclature.md` (identifiants), `docs/methode/decisions.md` § « Registre des règles métier », `docs/agents/issue-tracker.md` (tickets et demandes), `.claude/rules/tests.md` (étiquettes de tests).

## Identifiants

Tout se cite par un identifiant complet `<TYPE>_<CTX>_<TRI>-<n>` : `RULE_ALL_LIC-3`, `SPEC_FNSMR_PAY-3.02`, `ADR_ALL_ARC-11`, `REQ_ALL_LIC-7`. Le contexte s'écrit toujours, `ALL` compris. Le prochain numéro : `node scripts/docs/next-id.mjs RULE ALL LIC`. Un identifiant existant ne se renomme pas, sauf pour résoudre une collision de sigles avant la première lecture par Anchorpost (ci-dessous).

**Un sigle, un domaine, un sens.** Un sigle a un seul sens dans tout le dépôt ; le partager entre contextes est normal (`LIC` partout). Avant d'en créer un, prendre un domaine existant du registre. Une collision se règle par `renames` (`anchorpost/identifiers-resolutions.json`, `anchorpost migrate identifiers`), **avant la première lecture par Anchorpost** : après, plus aucun renommage. Voir `docs/methode/nomenclature.md` § « Résoudre une collision de sigles ».

**Rejouer la migration.** Si les anciens documents du socle s'écrivaient `ALL-LIC-1-…`, poser `"bareAliases": false` dans `extensions.anchorpost.migrate` du manifeste **avant le premier `--apply`** de `anchorpost migrate identifiers` ; avec la forme nue `LIC-1-…`, ou pour un projet neuf, ne rien poser. Le plan à blanc affiche la valeur lue : la relire avant `--apply`. « Laisser tel quel » s'écrit dans `resolutions`, `to` = le mot lui-même (`{ "word": "LIC-05", "to": "LIC-05" }`) ; les plages `GRD-01-05` sont signalées par le plan et se corrigent à la main ; il faut `@maj-agency/anchorpost` ≥ 1.1.1.

## Ce qu'est une règle

Une règle dit ce que le logiciel permet, exige, calcule ou refuse. Une fonctionnalité voulue (« Billetterie », « Partenaires ») est une **demande** `REQ`. Une règle de l'organisation cliente sans rapport avec le logiciel (une règle fédérale d'équipement, la composition d'une instance) est un **document** `DOC`, avec son énoncé, sa source et sa raison. Dans le doute, c'est une règle, et la question remonte au produit.

## Une règle est un fichier

`docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, d'après `docs/agents/gabarits/regle.md`. En haut, un en-tête YAML ; en bas, l'énoncé en markdown libre, dans la langue du projet, avec ses précisions datées et ses passages barrés.

- **Qui écrit quoi.** `validation` (`candidate`, `validated`, `rejected`, `obsolete`, avec `date`, `by`, `reason`) est écrite par un humain. **Un agent n'écrit jamais `validated`** ; il crée une règle `candidate` et le dit. Le fichier d'une règle est écrit par la session qui écrit la spec qui la porte, à l'étape de la spec, avant tout code. **La criticité est fixée par un agent** : toute session qui crée un fichier de règle ou change son énoncé lance le skill `maj-skills:criticite`, dont un sous-agent en contexte vierge rend le niveau et sa raison, les cas attendus et les dix familles ; elle écrit le niveau rendu ou un plus haut, et porte la commande jouée et chaque sortie brute dans la section `## Criticité` de sa PR. Toute PR qui écrit ou change `criticality`, `cases` ou `notApplicableFamilies` dans un fichier de règle, ou qui retire une règle d'une ligne `Règles:`, porte toujours cette section, avec la sortie du sous-agent ou la raison écrite du geste. **Un agent écrit toujours `by: agent`**, quel que soit son rôle : le nom d'une personne n'est écrit que par cette personne, dans sa PR. Un agent peut monter une criticité, jamais la baisser, et ne réécrit jamais celle qu'une personne a fixée. Hors du skill `criticite`, aucune session n'ajoute de `notApplicableFamilies`. **La session qui code un ticket** ne retire aucun cas attendu, ne change ni le `kind`, ni le `scope`, ni le sens du titre d'un cas, et ne baisse aucun niveau : si un cas lui paraît faux, elle le dit dans sa PR et s'arrête sur ce point. Retirer une règle d'une ligne `Règles:` pour baisser sa criticité est le geste d'une personne : la session le signale, elle ne le fait pas. `criticality` sous la forme `{ level, by, reason }`, `cases` et `notApplicableFamilies` ne s'écrivent que si l'index du projet est au pivot 3 (`"schema": "3"`, CLI Anchorpost 2.0.0) ; avant, la règle reste « à classer » et le skill ne classe rien. La forme nue (`criticality: high`) est celle d'avant, qu'on n'écrit plus. La réalisation (à construire, configurée, prouvée) **ne s'écrit pas** : elle se lit dans les tests. Seules `exception: not-applicable` et `exception: contradiction` s'écrivent, avec leur raison.
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

- `anchorpost/manifest.json` est écrit à la main : nom, pitch, contextes, EPIC, documents à rendre, table nom → rôle, planchers. Un EPIC est un module de l'application, un pan fonctionnel (`{ "id": "licences", "name": "Gestion des licences", "domains": ["LIC"] }`) ; un domaine est une entité transverse, qui peut concerner plusieurs modules. `domains` liste, à titre informatif, les domaines qu'un module concerne ; un domaine peut figurer dans plusieurs modules, sans effet sur le rangement. Une règle a un module si elle le déclare (`epics: [licences, vie-equipe]` dans son en-tête), ou si une spec déclare la réaliser par un en-tête `Règles:` de la spec ou de l'un de ses tickets ; une spec déclare son module en tête (`EPIC: licences`). Un domaine ne donne pas de module. Sinon, la règle est sans module : la santé l'alerte, et Anchorpost la range dans « Règles sans module ». Une règle seulement citée dans le corps d'une spec ne prend pas son module. « Technique » est un module ordinaire. Le `Règles:` d'une spec ne porte que des identifiants complets de règles existantes (`check` refuse le reste). `epics: []` : sans module, volontairement. `anchorpost migrate epics` écrit `epics:` dans les règles, d'abord à partir d'une répartition commise règle par règle, `anchorpost/epics-assignments.json` (`{ "rules": { "<id>": ["<module>"] } }`), puis à partir de `domains` pour un domaine listé par un seul module. Elle liste, sans les écrire, les autres règles, et ne réécrit jamais une règle qui porte déjà `epics`. Sans EPIC au manifeste, chaque domaine est son EPIC, comme en 1.1.x (CLI 1.2.0 et suivantes). Un chemin hors convention se déclare sur son contexte (`rules`, `features`, `requests`). Un plancher se relève à la main, jamais ne se baisse.
- `anchorpost/anchorpost.json` est **généré** par `pnpm anchorpost:index`, **jamais édité** : le hook d'agent refuse, le gate `pnpm anchorpost:check` compare. Après toute modification de `docs/`, d'un test étiqueté ou d'un ticket : régénérer, puis `pnpm anchorpost:check` avant le push. Le capitaine régénère à chaque fusion.
- La section `health` de l'index liste ce que la CLI tolère mais signale : une `candidate` qui a des tests, une règle dite couverte sans test, un défaut sans règle. La lire après chaque régénération.
