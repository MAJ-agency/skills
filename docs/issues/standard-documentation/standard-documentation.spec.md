# Standard de documentation — ce qu'un dépôt doit respecter pour qu'Anchorpost le lise

> Brief d'entrée du **second grilling**, écrit le 2026-11-09 à la fin du premier (session de pose d'Anchorpost). À griller avec `/mattpocock-skills:grill-with-docs`, dans une session sur ce dépôt, avec Fedora, Iroki et Anchorpost attachés pour vérifier les faits. Rien ici n'est tranché sauf la section « Déjà décidé ».

## Objet

Anchorpost (`MAJ-agency/anchorpost`) lit un projet depuis la documentation de son dépôt, par un seul fichier généré, `anchorpost/anchorpost.json`, au **schéma pivot** `ANC-2`. Le premier grilling a fixé **ce qu'Anchorpost consomme**. Celui-ci fixe **comment un dépôt le produit** : la forme des registres de règles, la nomenclature des contextes, les en-têtes de tickets, les demandes, les preuves, la CLI qui génère et vérifie, et le skill qui installe tout ça. Il accouche du standard (dans les gabarits de `socle-monorepo` et `tickets`), du skill `anchorpost`, et des chantiers de refonte de Fedora et d'Iroki.

## Entrées à lire d'abord

- `anchorpost/docs/architecture/ANC-2-schema-pivot.md` — le pivot : index, manifeste, deux adaptateurs.
- `anchorpost/docs/metier/regles/ANC-regles.md` — vingt-deux règles validées, `ANC-1` à `ANC-22`.
- `anchorpost/docs/adr/ARC-11`, `ARC-12`, `ARC-13` — index commis et lu par GitHub ; espace tenant ; CLI privée hors ligne.
- `anchorpost/docs/features/anchorpost/ANC-1-anchorpost.spec.md` — ce que V1 construit, et son hors périmètre (la CLI complète, le skill, les refontes : c'est ici).
- `anchorpost/docs/questions-ouvertes.md` — quatre questions ouvertes.
- Ce dépôt : `skills/monorepo/socle-monorepo/references/methode/decisions.md` § « Registre des règles métier » et « Documentation vivante », `nomenclature.md`, `racine/.claude/rules/tests.md`, `skills/chaine/tickets/SKILL.md`, `skills/chaine/revue-de-ticket/references/criteres-ticket.md` (T3).

## Faits relevés le 2026-11-09

**Fedora** (`federations/<slug>/rules.json`, 7 registres, 1 682 règles, 36 domaines `RULE_DOMAINS`) :

- identifiant `{DOM}-{nn}` unique **par fédération seulement** (`LIC-05` chez FNSMR et FFSA) ; clé globale = étiquette `[FNSMR LIC-05]` dans les titres de tests ;
- statut = **réalisation** (`couverte`, `configuree`, `a_construire`, `module`, `contradiction`, `sans_objet`, `question`) ; la validation est un champ `decision {date, texte, par}` ; champs `source`, `config[]` (clé vérifiée), `seed[]`, `code[]`, `note`, `socle` (instance d'une règle de `all`), `tickets[]` (vérifiés), `portee`, `outil`, `proprietaire`, `echeance` ; `plancher.couvertes_prouvees` cliquet daté ;
- preuves dérivées par un gate (`federation-rules.registry.spec.ts`) : niveaux P0 (unitaire ou base réelle sous `configFederation`), P1 (`apps/api/test/`), P2 (`e2e/`) ; cas en données `federations/<slug>/cas/*.json` ; mutation par règle (`mutation-regles.mjs`) ; README généré par fédération (`rules-doc.ts`) ;
- narration dans `docs/produit/federations/<slug>/<CODE>-FED-n-registre-regles-metier.md` ; nouvelles règles par la skill `reunion-federation` (section 7, « additive ») ;
- specs `docs/features/<feature>/<fed>/{FED}-{CODE}-{n}-{nom}.spec.md`, tickets `issues/….{NN}.issue.md`, ligne `Règles :` **libre et non vérifiée** (54 + 33 + 9 formes) ; pas de type défaut : spec `…-defauts-recette-<module>`, test `recette.*` rouge en `it.skip`, jamais étiqueté ;
- aucun lien règle → EPIC/FR (PRD `EPIC-001…014`, sprint plan BMAD obsolète) ; CI sans JUnit ni JSON (Playwright HTML) ; `e2e-api-federation` filtre par étiquette ;
- fonctions réutilisables : `repo-rules.ts` (`readRawRules`, `collectRuleTags`, `collectRuleProofs`, `readSocleInstances`, `readRulesCoverage`, `listTicketFiles`, `readTicketStatus`).

**Iroki** (`docs/metier/regles/<TRI>-regles.md`, 9 registres, 147 règles) :

- table `| Id | Règle | Source | ex | Statut |`, cellule « Règle » en prose (PLA : 350 Ko) avec précisions datées inline `_(précisée 24/09 : R-120)_`, texte barré, mentions de règles, de termes et d'ADR sans lien formel ; colonne `ex` = identifiant provisoire `R-nn` du compte rendu ;
- statut = **validation** (`candidate` → `validée` → `implémentée`, `rejetée`, `obsolète`) **non tenu** : 145 `candidate`, 0 `validée`, alors que `ORG-8`, `ORG-10`, `ORG-11`, `ORG-16` ont des tests nommés `it("ORG-10 — …")` ;
- aucun gate ne lit le registre ; seul `contexte-ticket.mjs` (revue de ticket) trouve une ligne `| <ID> |` ; critère T3 par sous-agent ;
- collisions : `GEO-1` cité sans registre ; `BEN-1` à la fois ADR et règle (la méthode dit « `BEN-3` désigne toujours une règle ») ;
- `questions-ouvertes.md` (52 entrées, `Bloque :`) ; `ORG-1` = paramètre d'organisation (concept de config, doc seulement) ; `PRG-1` lots → chantiers avec colonne « Règles » (l'EPIC de fait) ; tickets `Type:` task/grilling/research, pas de défaut ; comptes rendus classés `nouveau / confirme / précise / contredit` ; protos HTML citant les règles en commentaires ; un seul contexte ; chantier `PRG-2` « toilettage des registres » en cours.

**Le socle (ce dépôt)** : registre `<TRI>-regles.md` hors nomenclature, cycle `candidate → validée (geste humain) → implémentée`, « aucune machine n'écrit validée », source obligatoire, test `it('<TRI>-<N> — …')`, **aucun gabarit de colonnes**, aucun gate de couverture des règles, aucun index JSON ; `decisions.md` prévoit une couche 3 « le site qui agrège 1 + 2 » (Anchorpost) ; `avancement.mjs --json`, `index-generes.json`, `tickets` (ids `<PRÉFIXE>-<n>.<NN>`, `Status:` fermé, ticket prêt pour agent), recette humaine (défauts `D-n`, tickets, `it.skip` avec ticket, pas d'identifiant de règle sur un test de recette).

**Anchorpost lui-même** : forme socle (`ANC-regles.md`, 22 règles `validée (2026-11-09, MOA)`), manifeste `anchorpost/manifest.json`, catalogue des rôles, pas encore d'index ni de CLI. **Collision créée** : `ANC-1` est une règle et la spec, `ANC-2` une règle et le document d'architecture.

## Déjà décidé au premier grilling — ne pas rouvrir

- Un **pivot** unique (`ANC-2`), un **adaptateur** par forme de source ; à terme une seule forme (Q31).
- **Deux axes de statut** : validation (humain) et réalisation (dérivée) ; `implémentée` n'est plus écrit, il est dérivé des preuves (`ANC-6`).
- **Contextes** : `all` toujours présent et socle ; clé de règle = (projet, contexte, id) ; `docs/features/<feature>/<contexte>/` avec `all/` ; un dossier sans contexte vaut `all` (Q21, `ANC-3`).
- **EPIC** = domaine `TRI — Nom` par défaut, regroupements dans le manifeste ; liens entre EPIC déduits (`ANC-7`).
- **Liens typés** déclaré / déduit ; déduits V1 : identifiant cité dans la prose d'une règle, co-citation dans un ticket (`ANC-8`).
- **Preuves** : test qui porte l'identifiant ; catégories techniques, niveaux P0/P1/P2, agrégation MOA ; recette jamais une preuve (`ANC-9`).
- **Défaut** = ticket `Type: défaut` + en-tête `Règles:` vérifié ; résolution par tests nommés dans `## Surfaces` / `## Vérification` (`ANC-11`).
- **Demandes** `REQ-n`, `docs/demandes/REQ-<n>-<slug>.md`, en-têtes `Status:`, `Type: demande`, `Cible:`, `Demandeur: <rôle>`, `Suite:` ; corps = rapport de grilling classé ; `Origine : REQ-n` dans la spec née (`ANC-12`).
- **Rôles** fermés `client`, `MOA`, `MOE` ; la MOA porte la décision ; table nom → rôle dans le manifeste ; aucun nom dans l'index (`ANC-14`).
- **Index** commis dans le dépôt, régénéré par la CLI avant push et par le capitaine (`index-generes.json`), gate `anchorpost check` ; validation rejouée côté serveur (`ANC-20`, `ARC-11`).
- **CLI** `@maj-agency/anchorpost` sur GitHub Packages, hors ligne, sans authentification propre ; `.npmrc` + `NODE_AUTH_TOKEN` ; network secret en environnement cloud ; recette dans `docs/agents/admin.md`, jamais une valeur (`ARC-13`).
- **Skill `anchorpost`** : exige le socle (`check.sh`, `index-generes.json`, gate des tickets) et refuse sinon ; `socle-monorepo` pose la question « Anchorpost ? » et l'invoque en dernier (Q36) ; contenu en huit points (Q29).
- **Manifeste** `anchorpost/manifest.json` : nom, pitch, publics, `contextes[]`, `epics[]`, `documents[]`, `roles` ; pas de `socle: true`, pas de fichier par contexte, pas de `anchorpost-config.json` : l'emplacement des sources d'un contexte se déduit de son identifiant par convention, surcharge de chemin possible (Q30).

## La frontière à griller

1. **Forme source unique des registres.** Recommandation portée : la forme Fedora, état structuré validé par un schéma + narration markdown à côté ; alternative : la table markdown durcie. Que devient `rules.json` de Fedora (il resterait la forme) ; comment Iroki migre (`PRG-2`), et le socle (`ANC-regles.md`) ; quelle place pour la prose datée des précisions et pour `ex`.
2. **Règle et document : deux formes distinctes.** Résoudre la collision (`ANC-1`, `BEN-1`). Pistes : la règle se cite toujours avec son contexte (`all ANC-1`, `[FNSMR LIC-05]`) ; ou un marqueur de règle (`ANC-R1`, `R-ANC-1`) ; ou des trigrammes de règles distincts de ceux des documents. Conséquence sur `identifiants.mjs` (une seule regex `SPEC` capture tout aujourd'hui) et sur `contexte-ticket.mjs`.
3. **Contextes dans l'arborescence.** Où vit le registre d'un contexte (Fedora : `federations/<ctx>/` ; socle : `docs/metier/regles/`) ; forme unique de l'étiquette de test (`[CTX TRI-n]` vs `TRI-n —`) ; règles de socle instanciées (`socle:`) ; comment un projet passe de un à plusieurs contextes sans rien déplacer.
4. **En-têtes de tickets vérifiés** : `Type:` (task, défaut, grilling, research), `Règles:` (règles existantes, gate `tickets.mjs`), test nommé dans `## Surfaces` pour un défaut ; ce que `recette-humaine` change (le ticket de défaut cite `D-n` et son test rouge).
5. **Les demandes `REQ`** dans la chaîne : triage → chantier ; qui crée le fichier (l'App Anchorpost par PR) ; `Status:` du cycle ; `Origine :` dans les specs ; archivage.
6. **Preuves et gates** : un gate de couverture des règles dans le socle (aujourd'hui Fedora seul), **plancher cliquet par contexte** vérifié par `anchorpost check` ; catégories et niveaux par dépôt (le web d'Iroki n'a pas de P1 d'API) ; mutation par règle plus tard.
7. **Validation** : qui écrit `validée` et sous quelle forme (`validée (2026-11-09, MOA)` ? un champ `decision` ?) ; `rejetée`/`obsolète` avec raison ; conversion des `candidate` testées (santé de la doc).
8. **Liens déclarés** : un champ `liens:` dans la forme source (types de `ANC-8`) ; les `Bloque :` de `questions-ouvertes.md` deviennent `bloquée par`.
9. **Anonymisation** : écrire des rôles et plus des noms à l'avenir (sources, décisions, `par`) ; table nom → rôle du manifeste ; gate qui signale un nom de la table resté dans l'index.
10. **La CLI** : commandes `index`, `check`, `init` ; ce que `check` refuse (liste fermée) ; entrée `index-generes.json` ; hooks d'agent (édition interdite de `anchorpost.json`) ; `.npmrc`, `NODE_AUTH_TOKEN`, network secret, Scalingo et devDependencies ; `pnpm dlx` ou devDependency.
11. **Le skill `anchorpost`** : les huit points de Q29, `.claude/rules/anchorpost.md` (paths `docs/**`, `anchorpost/**`), la recette admin, l'option de `socle-monorepo`.
12. **CI par test** (V1.1) : JUnit ou JSON publié par Jest/Vitest/Playwright ; hors V1.
13. **Les spécificités Fedora à préserver** : `config[]`, `seed[]`, `cas/*.json`, `outil`, `proprietaire`/`echeance`, `plancher`, `rules-doc.ts` ; mapping de ses statuts vers l'axe réalisation ; `CONTEXT.md` comme glossaire ; EPIC = `RULE_DOMAINS` ; PRD ignoré.
14. **Les spécificités Iroki** : `ex`, précisions inline, `ORG-1` paramètre, `PRG-1` lots comme regroupement EPIC, protos citant les règles, `questions-ouvertes.md`.

## Sorties attendues

- Le **standard**, dans les gabarits de ce dépôt : `decisions.md` (registre), `nomenclature.md` (contextes, règle vs document), `tests.md` (étiquette), `tickets` (en-têtes, gate), gabarits de spec/ticket/demande, et leurs ADR.
- Le **skill `anchorpost`** (nouveau, catégorie `chaine` ou `monorepo`) et l'option dans `socle-monorepo`.
- Deux **chantiers de refonte**, déposés en specs dans Fedora et Iroki, pilotés par la liste rouge de `anchorpost check`.
- Une **spec Anchorpost** pour les adaptateurs de la CLI (hors périmètre de `ANC-1`), et une révision du pivot si le standard le fait bouger (version 2 du schéma).

## Décisions du second grilling (2026-11-10, cinq tours, Q1 à Q43)

Décisions de l'humain (MOA), sauf mention « défaut » : un choix technique tranché par l'agent par défaut prudent, selon la consigne relayée par le capitaine le 2026-11-10, que l'humain peut rouvrir d'un mot.

1. **Forme source unique : un fichier par règle** (Q1, Q20, Q32), `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, en-tête YAML validé par un schéma, énoncé en markdown libre. Pas de tableau, pas de JSON, pas de README généré : l'index est l'annuaire (Q33).
2. **Champs en anglais**, dans les fichiers de règles comme dans le schéma pivot, qui passe en version 2 (Q2, Q21).
3. **Identifiants `<TYPE>_<CTX>_<TRI>-<n>`** (Q3, Q22, Q34, Q40, Q43) : six types `RULE`, `SPEC`, `ADR`, `DSG`, `DOC`, `REQ` ; un ticket porte l'identifiant de sa spec suivi de `.NN` ; `ARC` reste le trigramme des décisions transverses ; le contexte s'écrit toujours, `ALL` compris (Q4) ; le nom du fichier porte l'identifiant complet ; le numéro est unique par type, contexte et trigramme ; un identifiant existant ne se renomme jamais, zéros compris.
4. **Étiquette de test `[RULE_<CTX>_<TRI>-<n>]`**, plusieurs par titre permises, une sur un `describe` vaut pour ses tests ; jamais sur un test de recette (Q4).
5. **En-têtes de tickets** : `Type:` obligatoire (`task`, `défaut`, `grilling`, `research`), `Règles:` facultative et vérifiée, le lien va du ticket vers la règle seulement ; un défaut nomme ses tests dans `## Surfaces` (Q5).
6. **Demandes** `REQ_<CTX>_<TRI>-<n>` sous `docs/demandes/<ctx>/`, `Status:` au vocabulaire des tickets avec `Fait — <spec>`, `Suite:` et `Origine:`, archivage comme un ticket (Q6).
7. **Catégories et niveaux des preuves** dérivés du chemin et du suffixe, convention fixée dans la CLI, surcharge par le manifeste (Q7, défaut).
8. **Plancher cliquet par contexte, `ALL` compris**, dans le manifeste, posé par `init` à la mesure, relevé à la main, vérifié par `check` (Q8, Q23).
9. **Validation** structurée (`status`, `date`, `by`, `reason`), humaine ; une `candidate` qui a des tests est une alerte, jamais une conversion (Q9).
10. **Liens déclarés** typés dans l'en-tête (`replaces`, `refines`, `contradicts`, `parameterized-by`, `blocked-by`), `instanceOf` pour le socle ; `cited-with` et `mentions` déduits seulement. Une question ouverte qui cite une règle la marque « a une question ouverte » : **un indicateur, pas un statut** ; la règle garde sa validation et sa réalisation (Q10, Q31).
11. **Les noms des personnes restent**, dans les sources comme dans l'index ; Anchorpost affiche le rôle entre parenthèses quand la table du manifeste le connaît ; `ANC-13`, `ANC-14`, `ANC-19` s'amendent (Q11, Q24, Q35).
12. **CLI** : `init`, `index`, `check`, `migrate` ; liste de refus fermée ; le paquet expose une bibliothèque de lecture que les gates des projets importent (Q12, Q25, Q42, défaut pour la liste).
13. **Installation** : paquet privé, devDependency, `index-generes.json`, `check` dans `gatesRapides` et `check.mjs`, clé par environnement, `NODE_AUTH_TOKEN` sur Scalingo ou build sans dépendances de développement (Q13, Q26, défaut).
14. **Skill `anchorpost`**, catégorie `chaine`, huit points reconstruits depuis ce grilling ; `socle-monorepo` pose la question « Anchorpost ? » et l'invoque en dernier (Q14).
15. **CI par test** : rien dans le standard (Q15, Q27).
16. **Fedora** : la réalisation se calcule, « la parole ne prouve pas » ; `sans_objet` et `contradiction` seuls états écrits à la main ; `module` se lit « à construire » et se trie à la refonte ; champs propres sous `extensions` ; `CONTEXT.md` devient `GLOSSARY.md` à la refonte ; les 36 domaines dans le registre des trigrammes ; un EPIC par module à la refonte ; les questions `status: question` deviennent des questions ouvertes (Q16, Q17, Q28, Q37, Q38).
17. **Fedora migre d'abord** : `rules.json` est converti par `migrate rules-json`, contexte par contexte, avant le branchement sur Anchorpost ; le standard n'a qu'une forme ; les gates de Fedora se réécrivent sur la bibliothèque du paquet ; `config.json` et `federation.json` ne bougent pas (Q39, Q42).
18. **Iroki** : `ex` devient une source, les précisions restent dans le texte, les « tranché par » deviennent des `decisions[]` ; `ORG-1` donne des liens `parameterized-by` ; `PRG-1` est un document, pas un EPIC ; les protos sont ignorés (Q18, Q19, Q29, Q30).
19. **Le standard vaut pour tous les projets du socle** ; Anchorpost est une option par-dessus (Q41). La convention de dossiers est posée par le socle et documentée dans le skill `anchorpost` (Q36).
20. **Deux corrections de méthode** : une question de grilling se lit sans ouvrir le dépôt (`grilling.md` § « Écrire une question qu'un humain comprend ») ; les choix techniques ne remontent pas à l'humain.

**Suites hors de ce ticket** : les scripts du skill `tickets` et de la chaîne à la nouvelle grammaire, les gabarits des autres skills, `socle-tests` avec le workflow de mutation hebdomadaire et le périmètre « règles prouvées » depuis l'index, le dépôt des trois specs dans leurs dépôts : tickets `2` à `7` de ce dossier.

## À savoir avant de commencer

- Deux correctifs de gabarits sont en attente dans ce dépôt (cartes de tâche proposées le 2026-11-09, corrigés localement dans Anchorpost) : `coverage-diff` refuse le premier push d'un dépôt neuf (distant vide) ; le barrel de `socle-contrats` doit ré-exporter avec l'extension `.ts` (Node charge les sources en direct), avec `allowImportingTsExtensions` (paquets, web) et `rewriteRelativeImportExtensions` (API).
- Graphify ne sert pas de source : extraction non déterministe, graphe non versionné, absent des sessions cloud. Au mieux un assistant pour proposer des liens candidats.
