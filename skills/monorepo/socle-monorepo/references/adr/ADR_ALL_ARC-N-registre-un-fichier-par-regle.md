# ADR_ALL_ARC-{{N}} — Le registre des règles métier : un fichier par règle, deux statuts, une réalisation calculée

- Statut : **accepté**
- Date : {{DATE}}
- Portée : `docs/metier/regles/`, les tests qui prouvent une règle, les tickets qui la citent, l'index lu par Anchorpost

## Contexte

Le registre des règles métier est ce qu'un projet a de plus durable : il survit aux features et à la pile technique. Il doit être écrit par des humains et des agents en parallèle, validé par un geste humain, lu par les tests et par les tickets, et lu par Anchorpost pour la MOA.

Deux formes existaient. Un tableau markdown par sujet (une ligne par règle) : lisible sur GitHub, mais une ligne de tableau ne porte ni liste, ni prose longue, ni précision datée sans tricher, et deux sessions qui ajoutent une règle au même tableau entrent en conflit. Un fichier JSON par contexte, validé par un schéma : robuste, mais l'énoncé long d'une règle devient une chaîne échappée, et le geste « valider une règle » édite un fichier de plusieurs centaines d'entrées.

Un troisième point n'était tenu nulle part : le statut « implémentée » était écrit à la main, et mentait. Dans un projet, quatre règles avaient des tests à leur nom et restaient `candidate` ; dans un autre, des règles étaient dites couvertes sans qu'aucun test ne les porte.

## Décision

**Une règle est un fichier.** `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` : un en-tête YAML entre deux lignes `---`, validé par un schéma, puis l'énoncé en markdown libre, aussi long qu'il faut, avec ses précisions datées et ses passages barrés. Les champs de l'en-tête sont en anglais ; la prose est dans la langue du projet.

**Deux statuts distincts.** La **validation** est écrite par un humain : `candidate`, `validated`, `rejected`, `obsolete`, avec la date, qui, et la raison pour un rejet ou une obsolescence. Aucune machine n'écrit `validated`. La **réalisation** est **calculée**, jamais écrite : `proven` quand au moins un test porte l'identifiant de la règle entre crochets dans son nom, avec le niveau du test (P0, P1, P2) ; `configured` quand la règle déclare des clés de configuration et n'a pas de test ; `to-build` sinon. Deux exceptions seulement s'écrivent à la main, avec leur raison : `not-applicable` et `contradiction`.

**Une règle n'est jamais supprimée** : elle devient `rejected` ou `obsolete`. **Un identifiant ne se renomme pas**, sauf pour résoudre une collision de sigles avant la première lecture par Anchorpost.

**Les liens sont typés et déclarés dans l'en-tête** (`replaces`, `refines`, `contradicts`, `parameterized-by`, `blocked-by`), et `instanceOf` désigne la règle de socle qu'un contexte instancie. Une question ouverte (`docs/questions-ouvertes.md`) dont la ligne `Bloque :` cite une règle la marque « a une question ouverte », sans toucher à ses statuts.

**L'annuaire est généré.** La vue d'ensemble d'un registre est `anchorpost/anchorpost.json`, généré par la CLI, qui porte pour chaque règle ses statuts, ses liens et la liste des tests qui la prouvent. Aucun README écrit à la main, aucun tableau à tenir.

Le gabarit d'une règle : `docs/agents/gabarits/regle.md`. La forme de l'étiquette de test : `.claude/rules/tests.md`.

## Alternatives écartées

- **Le tableau markdown durci** (un gabarit de colonnes imposé). Une ligne ne porte pas une liste de sources ou de liens, un `|` dans l'énoncé casse la ligne, et le conflit entre sessions reste.
- **Un JSON par contexte** (la forme d'un projet antérieur). Éprouvé sur 1 682 règles, mais l'énoncé long en chaîne JSON et le fichier unique comme point de conflit l'ont écarté ; ce projet migre par une commande, contexte par contexte.
- **Un fichier YAML pur par règle.** L'énoncé en chaîne multi-lignes perd le rendu markdown sur GitHub, et l'indentation d'une longue chaîne est le piège classique d'un agent. L'en-tête YAML garde la structure, le corps garde la prose.
- **Écrire la réalisation à la main.** C'est ce qui mentait. Ce qui se calcule se calcule.
- **Une règle en statut « question ».** Une règle validée reste validée quand on s'interroge dessus ; la question est un indicateur en plus, pas un statut.

## Conséquences

**Positives.** Un diff par règle, zéro conflit entre sessions, un geste de validation qui touche vingt lignes, une PR qui ne change qu'une règle. La réalisation ne ment plus : elle se lit dans les tests. Anchorpost et les agents lisent le même index.

**Coûts.** Beaucoup de petits fichiers (plusieurs centaines dans un gros projet). La vue d'ensemble demande l'index, donc la CLI. Les projets écrits sous l'ancienne forme migrent par `anchorpost migrate`.

**Risque et parade.** Une règle dite couverte sans test. La parade est le calcul lui-même : elle apparaît `to-build` et l'index la signale dans sa santé.

## Liens

- `ADR_ALL_ARC-1` — la grammaire des identifiants
- [`../methode/decisions.md`](../methode/decisions.md) § « Registre des règles métier »
- [`../methode/grilling.md`](../methode/grilling.md) § « Cycle de validation »
