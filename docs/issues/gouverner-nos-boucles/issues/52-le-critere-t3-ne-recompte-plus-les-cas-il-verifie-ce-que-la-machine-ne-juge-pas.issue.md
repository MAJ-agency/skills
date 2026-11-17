# Le critère `T3` de la revue de ticket ne recompte plus les cas : il vérifie ce que la machine ne juge pas

Status: needs-triage
Type: task
Réalise: `P-38` de la carte `docs/issues/gouverner-nos-boucles/map.md` (ligne `K4` de la carte du chantier de la preuve suffisante, dans Anchorpost)
Label: contre-revue
Modèle: sonnet — seize remplacements donnés mot pour mot (ancien, nouveau), dont trois lignes de commentaire d'un script et la version, et un banc donné entier ; tout est joué sur une copie jetable de `origin/main`, mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/revue-de-ticket/references/criteres-ticket.md`, `skills/chaine/revue-de-ticket/references/prompt-ticket.md`, `skills/chaine/revue-de-ticket/references/section-pr.md`, `skills/chaine/revue-de-ticket/references/CONTENU.md`, `skills/chaine/revue-de-ticket/SKILL.md`, `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**La décision du produit** (`P-38` de la carte « gouverner nos boucles », 2026-11-17, redite le même soir). Ses mots :

> Le relecteur ne recompte pas les cas, la CLI le fait. Il vérifie ce que la machine ne juge pas : ce que le test affirme correspond au titre du cas, le genre de test convient au code, et un cas dit technique l'est vraiment. Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient au relecteur indépendant du chantier 3.

**Ce que le standard fixe** (`SPEC_ALL_ANC-5` d'Anchorpost, § 1, § 2, § 4 et § 8, lue sur sa branche `sujet/preuve-suffisante-cas` ; `RULE_ALL_ANC-26`, `-27`, `-28`, validées par le produit le 2026-11-17, `P-46` de la carte) :

- Les cas attendus d'une règle s'écrivent dans l'en-tête de son fichier, clé `cases` (chaque cas : `id`, `title`, `kind`, `scope`, `family` facultatif). La clé n'existe qu'au pivot 3 de l'index (`"schema": "3"`, CLI Anchorpost 2.0.0).
- Une preuve nomme le cas qu'elle prouve : `[RULE_ALL_ANC-3#lien-expire]` en tête du titre du test. L'étiquette sans `#` reste valable : elle prouve la règle sans prouver aucun de ses cas.
- Un cas est prouvé quand une preuve porte son étiquette **et** que le niveau exigé par la criticité de la règle est là : un refus ou une entrée invalide d'une règle moyenne ou haute, « à la frontière de l'API » (niveau `P1`, ou `P2`) ; le cas normal d'une règle haute, « de bout en bout » (niveau `P2`). La CLI déduit le niveau du chemin du fichier de test.
- Une règle qui a au moins une preuve est « prouvée » si elle déclare au moins un cas et que chacun est prouvé ; sinon elle est « partielle ». Une règle qui a des preuves et aucun cas déclaré est donc « partielle ».
- `A-25` de la spec : « Le gate ne juge que ce qu'il calcule exactement. Il vérifie le niveau des preuves (frontière de l'API, bout en bout). Qu'un dépôt de données soit prouvé sur base réelle ou un invariant chiffré par une propriété reste un critère de la revue de ticket (`T3`, réécrit) : la nature du code ne se déduit pas sûrement d'un chemin. »
- `RULE_ALL_ANC-27` : « Un cas métier est une situation que la MOA reconnaît : un refus, une exception. Un cas technique est une situation que seule l'équipe voit : une saisie vide, un doublon, deux actions simultanées. » Un cas métier ajouté à une règle validée repasse devant la MOA, un cas technique non ; `anchorpost compare` (§ 4, sortie 4) ne retient donc que les cas `scope: business`. Un cas métier écrit `technical` passe sans validation, et aucune machine ne le voit.

**Le fait, sur `origin/main` à `fa30c30`** (plugin 7.14.0) :

- `T3` (`skills/chaine/revue-de-ticket/references/criteres-ticket.md:12`) fait compter le relecteur : « au moins un test » par règle de la ligne `Règles:`, « les cas de bord que la règle énonce […] ont chacun un cas ». Il ne connaît ni les cas déclarés, ni l'étiquette de cas, ni les niveaux.
- Trois textes citent `T3` (`git grep -n "T3" origin/main -- skills`) : le critère, `references/CONTENU.md:5` (« liste fermée des règles que `T3` doit trouver prouvées ») et le commentaire de tête de `scripts/contexte-ticket.mjs:11` (« la liste fermée que l'axe Ticket (`T3`) doit trouver prouvée »).
- `contexte-ticket.mjs` rend déjà chaque fichier de règle « tel quel, en-tête YAML compris » : la clé `cases` d'une règle est dans le contexte du relecteur, sans qu'il ouvre un fichier.
- Aucun banc ne tient `criteres-ticket.md`, `prompt-ticket.md` ni `section-pr.md` : `scripts/depot.test.mjs` ne lit, de la revue de ticket, que `criteres-documentation.md`, `prompt-documentation.md` et une ligne de `SKILL.md` (ticket 49).
- Le relecteur indépendant du chantier 3 n'existe pas, et les projets qui posent ce plugin ne sont pas tous au pivot 3.

**Les décisions de l'architecte** (2026-11-17), portées par ce ticket :

1. **Pas de trou pendant la transition.** Le compte des cas par la CLI n'existe qu'au pivot 3. Le nouveau `T3` a deux branches, écrites sans ambiguïté : au pivot 3, le relecteur ne recompte pas, il vérifie les trois choses de la décision, plus ce que l'ancien `T3` gardait de juste (« un test qui porte un identifiant de règle qu'il ne prouve pas est un écart ») ; ailleurs, l'ancien contrôle reste, mot pour mot ou presque.
2. **Les trois vérifications, dites de façon observable.** (a) le relecteur lit l'assertion, pas le nom ; (b) le genre de test convient au code, avec ce que le plugin dit déjà des catégories et des niveaux de preuve ; (c) un cas `scope: technical` qui est une décision du métier est un écart, parce qu'il échappe à la validation de la MOA.
3. **Qui joue ce contrôle pour une règle moyenne ou haute** : le relecteur indépendant du chantier 3. Tant qu'il n'est pas posé, l'axe Ticket garde ce contrôle pour toutes les criticités, et la section de PR le dit en une ligne. Le ticket n'invente pas ce relecteur : il écrit la phrase qui lui passera la main, et dit où elle se lit.
4. **Rien d'autre ne bouge sans raison.** `D8` reste tel quel ; aucune phrase ne le contredit. Toute citation de `T3` est accordée.
5. **Version** : la mineure suivante.

Quand le ticket est fait : `T3` a deux branches, choisies règle par règle ; dans la première (index du projet au pivot 3, règle qui déclare au moins un cas), le relecteur ne recompte pas et vérifie (a), (b) et (c) ; dans la seconde (toute autre règle), l'ancien contrôle reste ; le prompt de l'axe Ticket connaît l'étiquette de cas, lit le champ `schema` de l'index et gradue les écarts nouveaux ; la phrase qui passera la main au relecteur indépendant se lit dans `criteres-ticket.md`, hors du bloc que reçoit le sous-agent, et la section de PR porte sa ligne ; la session qui code ne change pas elle-même la portée d'un cas ; `CONTENU.md` et le commentaire de `contexte-ticket.mjs` sont accordés ; un banc tient chaque passage, et chaque mutation de la liste le fait rougir.

Ticket de documentation et de banc : aucun hook ne change, aucune ligne de code exécutée ne change (`contexte-ticket.mjs` : trois lignes de commentaire), rien de nouveau n'est posé dans un projet.

## Où

Base : `origin/main` à `fa30c30` (PR 109 du ticket 49, le skill de criticité, fusionnée, plugin **7.14.0**, **732 tests**). La session retrouve chaque « Ancien » par son texte ; chacun y apparaît une seule fois.

| Texte | Ce qu'il dit | Verdict |
| --- | --- | --- |
| `skills/chaine/revue-de-ticket/references/criteres-ticket.md:3` (introduction) | ce que reçoit le relecteur : le contexte du ticket et le diff | R1 : l'en-tête YAML des règles nommé ; il lit le champ `schema` de l'index |
| `…/criteres-ticket.md:12` (`T3`) | un test étiqueté par règle, un cas par cas de bord | R2 : deux branches, les trois vérifications, aucun décompte dans la première |
| `…/criteres-ticket.md:36` (fin du bloc) | — | R3 : le paragraphe « Qui joue `T3` », hors du bloc |
| `…/prompt-ticket.md:2` (ce que le relecteur peut lire) | les fichiers du diff, les tests, le glossaire, les règles | R4 : et le seul champ `schema` de l'index |
| `…/prompt-ticket.md:6` (la mission) | « une règle citée sans test ou sans ses cas de bord » | R5 : les trois écarts nouveaux nommés |
| `…/prompt-ticket.md:13` (l'étiquette) | l'étiquette de règle ; « les règles à trouver prouvées » | R6 : l'étiquette de cas ; ce qu'il ne recompte pas ; toutes criticités |
| `…/prompt-ticket.md:23` (la gravité) | bloquant : règle citée sans test ; à corriger : cas de bord sans test | R7 : les gravités des deux branches |
| `…/section-pr.md:4` | la ligne `/security-review` | R8 : la ligne « Contrôle des preuves » |
| `skills/chaine/revue-de-ticket/SKILL.md:52` (étape 4, point 3) | un bloquant ouvert après deux tours | R9 : un point 4, la portée d'un cas ne se corrige pas dans la session |
| `…/SKILL.md:56` (étape 5) | la section de PR | R10 : ce que dit sa ligne « Contrôle des preuves » |
| `…/references/CONTENU.md:5`, `:9`, `:13`, `:17` | le script, les critères, les prompts, la section | R11 à R14 : accordés |
| `…/scripts/contexte-ticket.mjs:11` (commentaire de tête) | « la liste fermée que l'axe Ticket (`T3`) doit trouver prouvée » | R15 : accordé, trois lignes de commentaire |
| `.claude-plugin/plugin.json:3` | 7.14.0 | R16 : 7.15.0 |
| fin de `scripts/depot.test.mjs` | — | § 0 : cinq tests |

### Gardé tel quel, après lecture

- **`D8`** (`references/criteres-documentation.md`) et **`prompt-documentation.md`** : pas un mot ne change. Vérifié phrase par phrase : `D8` juge la trace d'un geste sur `criticality`, `cases` ou `notApplicableFamilies` dans la section `## Criticité` de la PR ; `T3` juge les tests du diff contre les cas déclarés. Le seul point de contact est la portée d'un cas : `D8` tient pour bloquant « un cas rendu […] qui a changé de kind, de scope ou de sens […] sans sa raison écrite dans la section », et le nouveau `T3` (c) relève un cas dit technique qui est une décision du métier. Les deux tiennent ensemble parce que la session qui code ne corrige pas ce constat elle-même (décision 6, R9) : elle ne touche pas à la clé, donc ne fait pas le geste que `D8` surveille.
- **Le code de `contexte-ticket.mjs`** et son banc : le script rend déjà l'en-tête de chaque règle ; il n'a rien à apprendre (décision 2).
- **Trois résumés de l'axe Ticket** qui disent « règles citées avec leurs cas de bord », sans citer `T3` : la description de `skills/chaine/revue-de-ticket/SKILL.md:3`, `README.md:84` (« règles et cas de bord ») et le gabarit d'ADR `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-chaine-de-production.md:20`. Ils restent vrais de la seconde branche ; la description est ce qui déclenche le skill, et l'ADR est une copie posée dans chaque projet. Les réécrire n'est pas demandé par `P-38` : à trancher par l'architecte (« Comments »).
- **`.claude/rules/tests.md`** (gabarit de `socle-monorepo`) et **la fiche `.claude/rules/anchorpost.md`** : la grille par criticité et l'écriture d'une étiquette de cas sont les lignes `K2` et `K5` de la carte du chantier (« Hors périmètre »). `T3` s'appuie sur ce que ces fiches disent déjà : « `.spec.ts` unitaire P0, `.db.spec.ts` base réelle P0, `.property.spec.ts` propriétés P0, `apps/api/test/**` intégration P1, `tests/**` et `e2e/**` e2e P2 », « Jamais la base mockée dans un repository », « Une fonction pure qui porte un invariant métier chiffré […] gagne un test de propriétés ».
- **La revue adversariale** (axe Règles) : elle ne reçoit ni ticket ni règle.

### Les limites, relevées

- **Un `SKILL.md` a au plus 200 lignes** (`scripts/depot.test.mjs:12`). Après le ticket, `revue-de-ticket/SKILL.md` : **69** lignes (68 + le point 4 de l'étape 4).
- **Le sous-agent de l'axe Ticket reçoit le bloc des critères, et lui seul** (`SKILL.md`, étape 2 : « les critères sont le bloc de code entier du fichier, jamais réduit »). Ce qui est dans le bloc lui est dit ; ce qui est hors du bloc ne l'est pas. Le paragraphe « Qui joue `T3` » est hors du bloc pour cette raison (décision 8), et le banc le vérifie.
- **Les critères, le prompt et la section ne se posent pas dans un projet** : ils se lisent dans le dossier du skill. Seul `contexte-ticket.mjs` est posé (`scripts/chaine/`), et il ne change que par son commentaire : aucune repose n'est due. Une session joue le nouveau `T3` dès que son plugin est en 7.15.0.
- **L'index d'un projet est gros et ses clés sont triées** (plusieurs centaines de milliers de caractères, `"schema"` vers la fin) : le relecteur lit un champ, pas le fichier (R4 : « le seul champ `schema` »).

## Décisions

1. **Deux branches, choisies règle par règle.** La première, « cas déclarés », vaut pour une règle quand deux faits sont vrais ensemble : l'index commis du projet, `anchorpost/anchorpost.json`, porte `"schema": "3"` ; et l'en-tête de la règle déclare au moins un cas sous `cases`. La seconde, « sans cas déclarés », vaut pour toute autre règle. Raison : c'est seulement quand les deux sont vrais que la CLI compte quelque chose pour cette règle. Dans un projet au pivot 3, une règle qui n'a pas encore ses cas (pas encore classée) sort « partielle » de la CLI sans que rien ne dise quel cas de bord manque : lui retirer l'ancien contrôle ouvrirait le trou que la décision 1 de l'architecte interdit. Et une clé `cases` écrite dans un projet dont l'index n'est pas au pivot 3 n'est comptée par aucune machine. Une clé `cases` vide ne mène pas à la première branche.
2. **Comment le relecteur sait dans quelle branche il est, sans explorer le dépôt.** Les cas : il les lit dans son contexte, « Règles du ticket », où `contexte-ticket.mjs` rend chaque fichier de règle avec son en-tête YAML. Le pivot : il lit lui-même le champ `schema` de l'index commis, un fichier nommé, un champ ; jamais ce qu'en disent le ticket ou la PR. C'est ce que fait déjà le skill `criticite` (étape 1 : « Seul l'index compte ») et ce que `D8` exige du relecteur de l'axe Documentation (« le relecteur le lit dans l'index, jamais dans ce que dit la PR »). Le script ne change pas : le contexte porte déjà les cas.
3. **Première branche : le relecteur ne recompte pas.** Le critère le dit, dit qui compte (la CLI Anchorpost, qui dit la règle « partielle » tant qu'un cas déclaré n'a pas sa preuve au niveau que sa criticité exige), et ne demande aucun décompte : ni « au moins un test », ni « chacun un cas », ni « chaque cas déclaré a sa preuve ». Le banc refuse ces trois formes dans cette branche. La phrase que l'ancien `T3` gardait de juste y est reprise, étendue à l'étiquette de cas : « Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart. »
4. **(a) Ce que le test affirme correspond au titre du cas.** Le relecteur lit l'assertion, pas le nom ; l'exemple du critère est celui de l'architecte : un test étiqueté d'un refus qui n'affirme pas le refus est un écart. Le contrôle porte sur chaque test du diff qui porte l'étiquette d'un cas de la règle.
5. **(b) Le genre de test convient au code.** Quatre correspondances, celles de l'architecte, dans les mots que le plugin emploie déjà (`.claude/rules/tests.md`, `RULE_ALL_ANC-28`) : un calcul pur, un test unitaire ; une requête, un test sur base réelle, jamais sur une base simulée ; un refus ou une entrée invalide exigés à la frontière de l'API (niveau `P1`), un test qui passe par la route ; le cas normal d'une règle haute, exigé de bout en bout (niveau `P2`), un vrai parcours. Une cinquième vient d'`A-25` de la spec et de la ligne `K4` : un calcul pur qui porte un invariant chiffré se prouve aussi par un test de propriétés ; `.claude/rules/tests.md` l'exige déjà. **Le relecteur ne compte pas les niveaux** : « Le niveau exigé, la CLI le compte ». Il vérifie que le test est de l'étage où son chemin le range : la CLI déduit le niveau du chemin, donc un test rangé dans un dossier ou sous un suffixe qui lui donne un niveau qu'il n'a pas trompe la machine. Le relecteur n'a pas besoin de connaître la criticité de la règle pour cela.
6. **(c) Un cas dit technique l'est vraiment.** Les définitions sont celles de `RULE_ALL_ANC-27`, déjà copiées dans le prompt du skill `criticite`. Le contrôle porte sur chaque cas `scope: technical` qu'un test du diff étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle (la ligne `K4` : « pour chaque cas qu'une preuve étiquette »). **La session qui code ne corrige pas ce constat elle-même** : la fiche `.claude/rules/anchorpost.md` lui interdit de changer le `scope` ou le titre d'un cas (« si un cas lui paraît faux, elle le dit dans sa PR et s'arrête sur ce point »), et un cas qui devient métier sur une règle validée repasse devant la MOA ; `RULE_ALL_ANC-27`, validée le 2026-11-17 (`P-46` de la carte), réserve au geste daté d'une personne le retrait ou l'affaiblissement d'un cas. Le constat reste ouvert dans la section de PR, la PR en brouillon, et la session le dit au conducteur du chantier (sans chantier, au produit) : R9.
7. **Les gravités** (prompt, R7). Bloquant, pour une règle aux cas déclarés : une preuve de cas qui n'affirme pas ce que le titre du cas promet, un test rangé à un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier. Raison commune : dans les trois cas, la CLI dit « prouvé », ou laisse passer sans validation, ce qui ne l'est pas, et rien d'autre ne le rattrape. À corriger : un genre de test qui ne convient pas au code sans que le niveau de la preuve en dépende (une requête prouvée sur une base simulée, un invariant chiffré sans propriété). Les gravités de la seconde branche sont celles d'aujourd'hui : bloquant, une règle citée sans test qui la nomme ; à corriger, un cas de bord énoncé sans cas de test. L'architecte n'a pas fixé ces gravités : à confirmer (« Comments »).
8. **Qui joue `T3`, et où se lit la phrase qui passera la main.** Un paragraphe « Qui joue `T3` » à la fin de `criteres-ticket.md`, **hors du bloc** : le sous-agent de l'axe Ticket ne reçoit que le bloc, et le bloc lui dit « quelle que soit la criticité de la règle » ; s'il lisait qu'un autre jouera ce contrôle pour les règles moyennes et hautes, il les sauterait. Le paragraphe ne nomme ni « chantier 3 », que seule la carte du programme connaît, ni la forme de ce relecteur : « un relecteur indépendant de l'auteur, que le plugin ne pose pas encore ». Le ticket qui posera ce relecteur n'aura que ce paragraphe, la ligne de la section et deux phrases (`SKILL.md` étape 5, `CONTENU.md`) à réécrire ; le critère, lui, est écrit pour être repris tel quel.
9. **La ligne de la section de PR**, toujours écrite : « Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités) ». Sans condition sur la criticité : la session n'a pas à la calculer (une criticité peut venir d'une feature, et ne se lit alors que dans l'index), et le capitaine ou le relecteur humain lit toujours la même ligne au même endroit.
10. **`T3` change de titre** : « Règles citées et leurs preuves », au lieu de « Règles citées et cas de bord ». La seconde branche garde les cas de bord, mot pour mot ; seul son sujet change (« La règle a au moins un test […] », au lieu de « Chaque règle de la ligne `Règles:` […] a au moins un test »), parce que la liste des règles est dite une fois, en tête, pour les deux branches.
11. **Les citations de `T3` accordées** : `CONTENU.md:5` et le commentaire de `contexte-ticket.mjs:11` ne disent plus que `T3` « doit trouver prouvées » les règles de la ligne `Règles:`, mais qu'il « relit les preuves » de ces règles ; le prompt dit « Les règles que T3 regarde ». `CONTENU.md` dit aussi les deux branches, le champ `schema` lu par le relecteur, et le passage de main.
12. **Le banc lit le texte et le tient**, comme celui du ticket 49 : à plat (blancs et sauts de ligne réduits à une espace), des passages d'un seul tenant. Un lecteur pur, `critereT3`, coupe le critère en sa tête et ses deux branches, et rend `null` si une branche manque, est écrite deux fois, ou si elles sont dans le désordre ; il a son test d'entrées piégées. Chaque branche est exigée dans sa branche, pas dans le fichier : une phrase de la seconde recopiée dans la première ne passe pas. **Limite avouée**, la même qu'au ticket 49 : une phrase glissée entre deux passages exigés passe, sauf un décompte dans la première branche, que le motif `DECOMPTE` refuse. Aucun test existant n'est retiré, sauté ni assoupli.
13. **Version : mineure** (`.claude-plugin/plugin.json:3`, 7.14.0 → **7.15.0** sur `fa30c30`), décision de l'architecte : un critère de revue change pour toute session qui joue la revue de ticket. **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, puis vérifie la valeur après la fusion (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`).
14. **`Label: contre-revue`**, à cause d'un seul fichier : `contexte-ticket.mjs` se pose dans un projet sous `scripts/chaine/`, chemin sensible du gabarit de `.claude/chaine.json`. Le ticket n'y change que trois lignes de commentaire (R15), et la vérification le montre par une commande. Pas de `/security-review` demandée : aucune ligne exécutée ne change. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): le critère T3 de la revue de ticket ne recompte plus les cas, il vérifie ce que la machine ne juge pas (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Choisir la branche au seul champ `schema`, pour le projet entier** : une règle qui ne déclare pas encore ses cas, dans un projet au pivot 3, n'aurait plus ni le compte de la CLI (elle n'a rien à compter) ni l'ancien contrôle.
- **Choisir la branche à la seule clé `cases`** : dans un projet dont l'index n'est pas au pivot 3, aucune CLI ne compte ; et la session qui code écrirait elle-même le signal qui la dispense du contrôle.
- **Faire écrire le schéma de l'index par `contexte-ticket.mjs`** dans le contexte : le script est posé dans chaque projet, les critères se lisent dans le plugin ; les deux n'avancent pas ensemble, et un projet non reposé recevrait le nouveau critère sans le signal. Le relecteur lit un champ d'un fichier nommé : c'est plus petit, et c'est ce que fait déjà l'axe Documentation.
- **Écrire la phrase de passage de main dans le bloc des critères** : le sous-agent sauterait les règles moyennes et hautes (décision 8).
- **N'écrire la ligne de la section que si la PR touche une règle moyenne ou haute** : la session devrait calculer une criticité effective qu'elle ne lit pas dans l'en-tête de la règle (décision 9).
- **Faire relire au relecteur ce que la CLI a compté** (lire dans l'index régénéré quelles règles du ticket sortent « partielles ») : ce serait relire le compte, que le produit confie à la CLI et au rapport de PR ; voir « Ce qui n'a pas été établi ».
- **Recopier la grille par criticité dans `T3`** : c'est la ligne `K2` (le gabarit de `.claude/rules/tests.md`), et la CLI la calcule.
- **Retirer la seconde branche le jour où tous les projets sont au pivot 3** : elle vaut aussi pour une règle qui ne déclare pas encore ses cas ; elle se retirera par un ticket, quand plus aucune règle n'est dans ce cas.

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge

Après le dernier test de `scripts/depot.test.mjs` (« chaque skill du plugin a sa ligne au README et passe le gate references-agent d'un projet qui le cite », ajouté par la PR 109), une ligne vide, puis, rien d'autre :

````js
// Le critère T3 de la revue de ticket (ticket 52, décision du produit P-38) : pour une règle qui déclare ses cas, dans un
// projet dont l'index Anchorpost est au pivot 3, le relecteur ne recompte pas les cas, la CLI le fait ; il vérifie ce que
// la machine ne juge pas. Pour toute autre règle, l'ancien contrôle reste. Le banc tient les deux branches, chacune des
// trois vérifications, la phrase qui passera la main au relecteur indépendant, et l'absence de tout décompte demandé au
// relecteur dans la branche « cas déclarés ». Même lecture à plat que le banc du skill de criticité, même limite.
const REVUE_DE_TICKET = `${SKILLS_CHAINE}/revue-de-ticket`;
const CRITERES_TICKET = `${REVUE_DE_TICKET}/references/criteres-ticket.md`;
const CAS_DECLARES = "Branche « cas déclarés »";
const SANS_CAS_DECLARES = "Branche « sans cas déclarés »";
const DECOMPTE = /au moins un test|ont chacun un cas|chaque cas (attendu|déclaré)[^.;:]* a (sa|une) preuve/;
// Le critère T3, à plat, coupé en trois : sa tête, puis ses deux branches. null s'il manque, si l'une de ses branches
// manque ou est écrite deux fois, ou si elles ne sont pas dans cet ordre.
const critereT3 = (texte) => {
  const bloc = texte.match(/^T3 {2}[\s\S]*?(?=^T4 {2})/m);
  if (!bloc) return null;
  const [tete, ...declares] = plat(bloc[0]).split(CAS_DECLARES);
  if (declares.length !== 1 || tete.includes(SANS_CAS_DECLARES)) return null;
  const [branche, ...sans] = declares[0].split(SANS_CAS_DECLARES);
  if (sans.length !== 1) return null;
  return { tete, declares: branche, sans: sans[0] };
};
const exigerDans = (ou, texte, phrases) => {
  const absentes = phrases.filter((p) => !texte.includes(plat(p)));
  assert.deepEqual(absentes, [], `${ou} : passages absents : ${absentes.join(" | ")}`);
};
const lireT3 = () => {
  const t3 = critereT3(readFileSync(join(RACINE, CRITERES_TICKET), "utf8"));
  assert.ok(t3, `${CRITERES_TICKET} : le critère T3, entre « T3 » et « T4 », avec ses deux branches, « cas déclarés » puis « sans cas déclarés »`);
  return t3;
};

test("lecteur du critère T3 : entrées piégées", () => {
  const t3 = (corps) => `T2  x\nT3  Tête. ${corps}\nT4  y\n`;
  assert.deepEqual(critereT3(t3(`${CAS_DECLARES} — a.\n    ${SANS_CAS_DECLARES} — b.`)), { tete: "T3 Tête. ", declares: " — a. ", sans: " — b. " });
  assert.equal(critereT3("T2  x\nT4  y\n"), null, "sans T3");
  assert.equal(critereT3(t3("un seul contrôle")), null, "sans branche");
  assert.equal(critereT3(t3(`${CAS_DECLARES} — a.`)), null, "sans la branche « sans cas déclarés »");
  assert.equal(critereT3(t3(`${SANS_CAS_DECLARES} — b.`)), null, "sans la branche « cas déclarés »");
  assert.equal(critereT3(t3(`${SANS_CAS_DECLARES} — b. ${CAS_DECLARES} — a.`)), null, "branches dans le désordre");
  assert.equal(critereT3(t3(`${CAS_DECLARES} — a. ${CAS_DECLARES} — a. ${SANS_CAS_DECLARES} — b.`)), null, "une branche écrite deux fois");
  assert.equal(DECOMPTE.test("chaque cas déclaré de la règle a sa preuve"), true, "un décompte demandé au relecteur");
  assert.equal(DECOMPTE.test("tant qu'un cas déclaré n'a pas sa preuve"), false, "ce que dit la CLI n'est pas un décompte demandé au relecteur");
});

test("T3, branche « cas déclarés » : index au pivot 3 et règle qui déclare ses cas, le relecteur ne recompte pas, il vérifie ce que la machine ne juge pas", () => {
  const { tete, declares } = lireT3();
  exigerDans("T3, tête", tete, [
    "T3 Règles citées et leurs preuves — registre de règles, `.claude/rules/tests.md` § Règles. Les règles sont celles de la ligne `Règles:` du ticket (« Règles du ticket » du contexte ; à défaut de ligne, chaque règle que le ticket cite). Deux branches, choisies règle par règle, quelle que soit la criticité de la règle.",
  ]);
  exigerDans("T3, branche « cas déclarés »", declares, [
    "— seulement si l'index commis du projet, anchorpost/anchorpost.json, porte \"schema\": \"3\" (le relecteur lit ce champ dans l'index, jamais dans ce que disent le ticket ou la PR) et si l'en-tête de la règle, rendu dans « Règles du ticket », déclare au moins un cas sous `cases`.",
    "Le relecteur ne recompte pas les cas : la CLI Anchorpost le fait, et dit la règle « partielle » tant qu'un cas déclaré n'a pas sa preuve au niveau que sa criticité exige. Il vérifie ce que la machine ne juge pas, sur chaque test du diff qui porte l'étiquette d'un cas de la règle (`[RULE_ALL_FAC-3#montant-nul]` : l'identifiant de la règle, `#`, celui du cas) :",
    "(a) ce que le test affirme correspond au titre du cas : le relecteur lit l'assertion, pas le nom ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart ;",
    "(b) le genre de test convient au code que le cas exerce, selon les catégories et les niveaux de `.claude/rules/tests.md` : un calcul pur se prouve par un test unitaire, et par un test de propriétés s'il porte un invariant chiffré ; une requête, par un test sur base réelle, jamais sur une base simulée ; un refus ou une entrée invalide exigés à la frontière de l'API (niveau P1), par un test qui passe par la route ; le cas normal d'une règle haute, exigé de bout en bout (niveau P2), par un vrai parcours. Le niveau exigé, la CLI le compte ; le relecteur vérifie que le test est bien de l'étage où son chemin le range : un test au mauvais étage, ou rangé dans un dossier ou sous un suffixe qui lui donne un niveau qu'il n'a pas, est un écart ;",
    "(c) un cas dit technique l'est vraiment : chaque cas `scope: technical` qu'un test du diff étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle, est une situation que seule l'équipe voit (une saisie vide, un doublon, deux actions simultanées) ; s'il est une décision du métier (un refus, une exception que la MOA reconnaîtrait), c'est un écart : il échappe à la validation de la MOA.",
    "Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart.",
  ]);
  assert.ok(!DECOMPTE.test(declares), "T3, branche « cas déclarés » : aucun décompte n'est demandé au relecteur, la CLI compte");
});

test("T3, branche « sans cas déclarés » : pour toute autre règle, l'ancien contrôle reste", () => {
  const { sans } = lireT3();
  exigerDans("T3, branche « sans cas déclarés »", sans, [
    "— toute autre règle : index absent ou d'un autre schéma, ou en-tête sans aucun cas sous `cases`. La règle a au moins un test qui porte son identifiant entre crochets en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ; les cas de bord que la règle énonce (limite, zéro, dépassement, chevauchement, passage à minuit, montant nul ou négatif, doublon) ont chacun un cas ; un test qui porte un identifiant de règle qu'il ne prouve pas est un écart.",
  ]);
});

test("l'axe Ticket lit le schéma dans l'index, et son prompt porte les deux branches : l'étiquette de cas, ce qu'il ne recompte pas, les gravités", () => {
  exiger(CRITERES_TICKET, [
    "chaque fichier de règle tel que le dépôt l'écrit, en-tête YAML compris — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**, et lit le champ `schema` de l'index commis du projet, `anchorpost/anchorpost.json`, s'il existe.",
  ]);
  exiger(`${REVUE_DE_TICKET}/references/prompt-ticket.md`, [
    "tu peux lire les fichiers entiers touchés par le diff, les tests, le glossaire, les règles du dépôt et, dans l'index anchorpost/anchorpost.json, le seul champ `schema`, pour vérifier un point ; tu ne modifies rien, tu ne lances aucune commande qui écrit.",
    "Ta seule mission : trouver les ÉCARTS entre le diff et le ticket — une surface sans test, une décision non tenue, une règle citée sans test ou sans ses cas de bord, une preuve de cas qui n'affirme pas ce que le titre du cas promet, un test au mauvais étage, un cas dit technique qui est une décision du métier, du code hors ticket — selon la liste fermée de critères ci-dessous et elle seule.",
    "Il prouve un cas attendu de la règle quand l'étiquette nomme ce cas après un `#` (`[RULE_ALL_LIC-3#seconde-licence]`) : les cas d'une règle sont la clé `cases` de son en-tête, dans « Règles du ticket ». Tu ne recomptes pas les cas d'une règle qui les déclare, quand l'index du projet porte \"schema\": \"3\" : la CLI Anchorpost le fait ; tu juges ce qu'elle ne juge pas (critère T3), quelle que soit la criticité de la règle. Les règles que T3 regarde sont celles de « Règles du ticket » dans le contexte ; celles d'« Identifiants cités » sont du contexte, pas une liste à prouver.",
    "- bloquant : une surface du ticket sans aucun test, une décision tranchée contredite par le code ; une règle sans cas déclarés citée sans test qui la nomme ; pour une règle aux cas déclarés, une preuve de cas qui n'affirme pas ce que le titre du cas promet, un test rangé à un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier ;",
    "- à corriger : un cas de bord qu'une règle sans cas déclarés énonce, sans cas de test ; un genre de test qui ne convient pas au code sans que le niveau de la preuve en dépende ; un fichier hors « Où » non justifié, un statut ou un commentaire de ticket manquant ;",
  ]);
});

test("qui joue T3 : la phrase qui passera la main au relecteur indépendant, hors du bloc des critères, et la ligne de la section de PR", () => {
  exiger(CRITERES_TICKET, [
    "**Qui joue `T3`.** Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore. Tant qu'il n'est pas posé, l'axe Ticket garde ce contrôle pour toutes les criticités, et la section de PR le dit en une ligne : « Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant ». Le critère est écrit pour que ce relecteur le reprenne tel quel. Ce paragraphe reste hors du bloc : le sous-agent de l'axe Ticket ne reçoit que le bloc, et ne saute aucune règle pour sa criticité.",
  ]);
  const blocs = blocsTexte(readFileSync(join(RACINE, CRITERES_TICKET), "utf8"));
  assert.equal(blocs.length, 1, `${CRITERES_TICKET} : un seul bloc de critères, celui que reçoit le sous-agent`);
  assert.ok(!/relecteur indépendant/.test(plat(blocs[0])), `${CRITERES_TICKET} : le bloc que reçoit le sous-agent ne lui dit pas qu'un autre jouera ce contrôle`);
  exiger(`${REVUE_DE_TICKET}/references/section-pr.md`, [
    "- Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités)",
  ]);
  exiger(`${REVUE_DE_TICKET}/SKILL.md`, [
    "4. Un cas dit technique que `T3` juge métier ne se corrige pas dans la session : elle ne change ni le `scope` ni le titre d'un cas (fiche `.claude/rules/anchorpost.md`). Le constat reste ouvert dans la section de PR, la PR en brouillon, et la session le dit au conducteur du chantier (sans chantier, au produit).",
    "Sa ligne « Contrôle des preuves » dit qui a joué `T3` : la revue de ticket, pour toutes les criticités, tant que le relecteur indépendant d'une règle moyenne ou haute n'est pas posé ([`references/criteres-ticket.md`](references/criteres-ticket.md), « Qui joue `T3` »).",
  ]);
  exiger(`${REVUE_DE_TICKET}/references/CONTENU.md`, [
    "la ligne `Règles:`, liste fermée des règles dont `T3` relit les preuves, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris : c'est là que le relecteur lit si une règle déclare ses cas (clé `cases`) —",
    "règles citées et leurs preuves (`T3`, deux branches, choisies règle par règle : si l'index du projet est au pivot 3 et que la règle déclare ses cas, le relecteur ne recompte pas les cas, la CLI Anchorpost le fait, et il vérifie ce que la machine ne juge pas — ce que le test affirme correspond au titre du cas, le genre de test convient au code, un cas dit technique l'est vraiment ; sinon, l'ancien contrôle reste — un test étiqueté par règle, un cas par cas de bord énoncé),",
    "Celui de l'axe Ticket reçoit le contexte du ticket, et lit lui-même le champ `schema` de l'index du projet, jamais ce qu'en disent le ticket ou la PR ;",
    "Sa ligne « Contrôle des preuves » dit qui a joué `T3`. Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore : tant qu'il n'est pas posé, l'axe Ticket le garde pour toutes les criticités, et la ligne le dit (« Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant »). Le jour où ce relecteur est posé, cette ligne et le paragraphe « Qui joue `T3` » de `criteres-ticket.md` lui passent la main.",
  ]);
});
````

Sur le texte de `fa30c30`, `node --test scripts/depot.test.mjs` : **44 tests, 40 verts, 4 rouges**. Vert parmi les cinq ajoutés : « lecteur du critère T3 : entrées piégées », qui ne lit aucun fichier. Rouges : « T3, branche « cas déclarés » … » et « T3, branche « sans cas déclarés » … » (le critère n'a pas ses deux branches : `critereT3` rend `null`) ; « l'axe Ticket lit le schéma dans l'index … » (premier passage absent : l'introduction des critères) ; « qui joue T3 … » (premier passage absent : le paragraphe « Qui joue `T3` »). Les 39 tests d'avant restent verts.

### 1. Les remplacements, mot pour mot

Chaque « Ancien » apparaît **une seule fois** dans son fichier à `fa30c30`. Si une PR fusionnée depuis l'a modifié, la session le retrouve par son sens et applique le « Nouveau » à la même place. Les fins de ligne des blocs sont celles du fichier : les critères et le prompt sont coupés vers 100 caractères, les autres textes tiennent sur une ligne.

#### R1 — `skills/chaine/revue-de-ticket/references/criteres-ticket.md:3`

Ancien :

````text
Le relecteur reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>` : le ticket, sa ligne de spec, ses règles — la ligne `Règles:` et chaque fichier de règle tel que le dépôt l'écrit — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**. Il ne rend que des écarts rattachés à l'un de ces critères.
````

Nouveau :

````text
Le relecteur reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>` : le ticket, sa ligne de spec, ses règles — la ligne `Règles:` et chaque fichier de règle tel que le dépôt l'écrit, en-tête YAML compris — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**, et lit le champ `schema` de l'index commis du projet, `anchorpost/anchorpost.json`, s'il existe. Il ne rend que des écarts rattachés à l'un de ces critères.
````

#### R2 — `skills/chaine/revue-de-ticket/references/criteres-ticket.md:12`

Ancien :

````text
T3  Règles citées et cas de bord — registre de règles, `.claude/rules/tests.md` § Règles. Chaque
    règle de la ligne `Règles:` du ticket (« Règles du ticket » du contexte ; à défaut de ligne,
    chaque règle que le ticket cite) a au moins un test qui porte son identifiant entre crochets
    en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ; les cas de bord
    que la règle énonce (limite, zéro, dépassement, chevauchement, passage à minuit, montant nul
    ou négatif, doublon) ont chacun un cas ; un test qui porte un identifiant de règle qu'il ne
    prouve pas est un écart.
````

Nouveau :

````text
T3  Règles citées et leurs preuves — registre de règles, `.claude/rules/tests.md` § Règles. Les
    règles sont celles de la ligne `Règles:` du ticket (« Règles du ticket » du contexte ; à défaut
    de ligne, chaque règle que le ticket cite). Deux branches, choisies règle par règle, quelle
    que soit la criticité de la règle.
    Branche « cas déclarés » — seulement si l'index commis du projet, anchorpost/anchorpost.json,
    porte "schema": "3" (le relecteur lit ce champ dans l'index, jamais dans ce que disent le
    ticket ou la PR) et si l'en-tête de la règle, rendu dans « Règles du ticket », déclare au
    moins un cas sous `cases`. Le relecteur ne recompte pas les cas : la CLI Anchorpost le fait,
    et dit la règle « partielle » tant qu'un cas déclaré n'a pas sa preuve au niveau que sa
    criticité exige. Il vérifie ce que la machine ne juge pas, sur chaque test du diff qui porte
    l'étiquette d'un cas de la règle (`[RULE_ALL_FAC-3#montant-nul]` : l'identifiant de la règle,
    `#`, celui du cas) :
    (a) ce que le test affirme correspond au titre du cas : le relecteur lit l'assertion, pas le
        nom ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart ;
    (b) le genre de test convient au code que le cas exerce, selon les catégories et les niveaux
        de `.claude/rules/tests.md` : un calcul pur se prouve par un test unitaire, et par un test
        de propriétés s'il porte un invariant chiffré ; une requête, par un test sur base réelle,
        jamais sur une base simulée ; un refus ou une entrée invalide exigés à la frontière de
        l'API (niveau P1), par un test qui passe par la route ; le cas normal d'une règle haute,
        exigé de bout en bout (niveau P2), par un vrai parcours. Le niveau exigé, la CLI le
        compte ; le relecteur vérifie que le test est bien de l'étage où son chemin le range : un
        test au mauvais étage, ou rangé dans un dossier ou sous un suffixe qui lui donne un niveau
        qu'il n'a pas, est un écart ;
    (c) un cas dit technique l'est vraiment : chaque cas `scope: technical` qu'un test du diff
        étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle, est une situation
        que seule l'équipe voit (une saisie vide, un doublon, deux actions simultanées) ; s'il est
        une décision du métier (un refus, une exception que la MOA reconnaîtrait), c'est un
        écart : il échappe à la validation de la MOA.
    Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart.
    Branche « sans cas déclarés » — toute autre règle : index absent ou d'un autre schéma, ou
    en-tête sans aucun cas sous `cases`. La règle a au moins un test qui porte son identifiant
    entre crochets en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ;
    les cas de bord que la règle énonce (limite, zéro, dépassement, chevauchement, passage à
    minuit, montant nul ou négatif, doublon) ont chacun un cas ; un test qui porte un identifiant
    de règle qu'il ne prouve pas est un écart.
````

#### R3 — `skills/chaine/revue-de-ticket/references/criteres-ticket.md:36`

À la fin du fichier : la clôture du bloc des critères, puis une ligne vide et le paragraphe, hors du bloc.

Ancien :

````text
    le dépôt, son commit, la commande et ce qu'elle a changé ; un essai sur un dépôt jouet seul
    est un écart.
```
````

Nouveau :

````text
    le dépôt, son commit, la commande et ce qu'elle a changé ; un essai sur un dépôt jouet seul
    est un écart.
```

**Qui joue `T3`.** Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore. Tant qu'il n'est pas posé, l'axe Ticket garde ce contrôle pour toutes les criticités, et la section de PR le dit en une ligne : « Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant ». Le critère est écrit pour que ce relecteur le reprenne tel quel. Ce paragraphe reste hors du bloc : le sous-agent de l'axe Ticket ne reçoit que le bloc, et ne saute aucune règle pour sa criticité.
````

#### R4 — `skills/chaine/revue-de-ticket/references/prompt-ticket.md:2`

Ancien :

````text
prétend réaliser. Tu travailles en lecture seule : tu peux lire les fichiers entiers touchés par
le diff, les tests, le glossaire et les règles du dépôt pour vérifier un point ; tu ne modifies
rien, tu ne lances aucune commande qui écrit.
````

Nouveau :

````text
prétend réaliser. Tu travailles en lecture seule : tu peux lire les fichiers entiers touchés par
le diff, les tests, le glossaire, les règles du dépôt et, dans l'index anchorpost/anchorpost.json,
le seul champ `schema`, pour vérifier un point ; tu ne modifies rien, tu ne lances aucune commande
qui écrit.
````

#### R5 — `skills/chaine/revue-de-ticket/references/prompt-ticket.md:6`

Ancien :

````text
Ta seule mission : trouver les ÉCARTS entre le diff et le ticket — une surface sans test, une
décision non tenue, une règle citée sans test ou sans ses cas de bord, du code hors ticket —
selon la liste fermée de critères ci-dessous et elle seule.
````

Nouveau :

````text
Ta seule mission : trouver les ÉCARTS entre le diff et le ticket — une surface sans test, une
décision non tenue, une règle citée sans test ou sans ses cas de bord, une preuve de cas qui
n'affirme pas ce que le titre du cas promet, un test au mauvais étage, un cas dit technique qui
est une décision du métier, du code hors ticket — selon la liste fermée de critères ci-dessous et
elle seule.
````

#### R6 — `skills/chaine/revue-de-ticket/references/prompt-ticket.md:13`

Ancien :

````text
porte jamais. Les règles à trouver prouvées sont celles de « Règles du ticket » dans le contexte ;
celles d'« Identifiants cités » sont du contexte, pas une liste à prouver.
````

Nouveau :

````text
porte jamais. Il prouve un cas attendu de la règle quand l'étiquette nomme ce cas après un `#`
(`[RULE_ALL_LIC-3#seconde-licence]`) : les cas d'une règle sont la clé `cases` de son en-tête,
dans « Règles du ticket ». Tu ne recomptes pas les cas d'une règle qui les déclare, quand l'index
du projet porte "schema": "3" : la CLI Anchorpost le fait ; tu juges ce qu'elle ne juge pas
(critère T3), quelle que soit la criticité de la règle. Les règles que T3 regarde sont celles de
« Règles du ticket » dans le contexte ; celles d'« Identifiants cités » sont du contexte, pas une
liste à prouver.
````

#### R7 — `skills/chaine/revue-de-ticket/references/prompt-ticket.md:23`

Ancien :

````text
- bloquant : une surface du ticket sans aucun test, une décision tranchée contredite par le code,
  une règle citée sans test qui la nomme ;
- à corriger : un cas de bord énoncé par une règle sans cas de test, un fichier hors « Où »
  non justifié, un statut ou un commentaire de ticket manquant ;
````

Nouveau :

````text
- bloquant : une surface du ticket sans aucun test, une décision tranchée contredite par le code ;
  une règle sans cas déclarés citée sans test qui la nomme ; pour une règle aux cas déclarés, une
  preuve de cas qui n'affirme pas ce que le titre du cas promet, un test rangé à un niveau qu'il
  n'a pas, un cas dit technique qui est une décision du métier ;
- à corriger : un cas de bord qu'une règle sans cas déclarés énonce, sans cas de test ; un genre
  de test qui ne convient pas au code sans que le niveau de la preuve en dépende ; un fichier hors
  « Où » non justifié, un statut ou un commentaire de ticket manquant ;
````

#### R8 — `skills/chaine/revue-de-ticket/references/section-pr.md:4`

Ancien :

````text
- `/security-review` : lancée (chemins : …) | non requise
````

Nouveau :

````text
- `/security-review` : lancée (chemins : …) | non requise
- Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités)
````

#### R9 — `skills/chaine/revue-de-ticket/SKILL.md:52`

Un point 4, à la suite du point 3.

Ancien :

````text
3. Un bloquant de l'axe Ticket ouvert après deux tours : la PR reste en brouillon, le ticket repasse `en cours`, le conducteur est prévenu.
````

Nouveau :

````text
3. Un bloquant de l'axe Ticket ouvert après deux tours : la PR reste en brouillon, le ticket repasse `en cours`, le conducteur est prévenu.
4. Un cas dit technique que `T3` juge métier ne se corrige pas dans la session : elle ne change ni le `scope` ni le titre d'un cas (fiche `.claude/rules/anchorpost.md`). Le constat reste ouvert dans la section de PR, la PR en brouillon, et la session le dit au conducteur du chantier (sans chantier, au produit).
````

#### R10 — `skills/chaine/revue-de-ticket/SKILL.md:56`

Ancien :

````text
Elle remplace `## Revue adversariale` : le capitaine accepte l'un ou l'autre titre, et renvoie une PR de code qui n'a ni l'un ni l'autre.
````

Nouveau :

````text
Elle remplace `## Revue adversariale` : le capitaine accepte l'un ou l'autre titre, et renvoie une PR de code qui n'a ni l'un ni l'autre. Sa ligne « Contrôle des preuves » dit qui a joué `T3` : la revue de ticket, pour toutes les criticités, tant que le relecteur indépendant d'une règle moyenne ou haute n'est pas posé ([`references/criteres-ticket.md`](references/criteres-ticket.md), « Qui joue `T3` »).
````

#### R11 — `skills/chaine/revue-de-ticket/references/CONTENU.md:5`

Ancien :

````text
la ligne `Règles:`, liste fermée des règles que `T3` doit trouver prouvées, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris —
````

Nouveau :

````text
la ligne `Règles:`, liste fermée des règles dont `T3` relit les preuves, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris : c'est là que le relecteur lit si une règle déclare ses cas (clé `cases`) —
````

#### R12 — `skills/chaine/revue-de-ticket/references/CONTENU.md:9`

Ancien :

````text
L'axe Ticket (T1–T9) : surfaces prouvées, décisions tenues, règles citées avec leurs cas de bord, « Où »,
````

Nouveau :

````text
L'axe Ticket (T1–T9) : surfaces prouvées, décisions tenues, règles citées et leurs preuves (`T3`, deux branches, choisies règle par règle : si l'index du projet est au pivot 3 et que la règle déclare ses cas, le relecteur ne recompte pas les cas, la CLI Anchorpost le fait, et il vérifie ce que la machine ne juge pas — ce que le test affirme correspond au titre du cas, le genre de test convient au code, un cas dit technique l'est vraiment ; sinon, l'ancien contrôle reste — un test étiqueté par règle, un cas par cas de bord énoncé), « Où »,
````

#### R13 — `skills/chaine/revue-de-ticket/references/CONTENU.md:13`

Ancien :

````text
Celui de l'axe Ticket reçoit le contexte du ticket ;
````

Nouveau :

````text
Celui de l'axe Ticket reçoit le contexte du ticket, et lit lui-même le champ `schema` de l'index du projet, jamais ce qu'en disent le ticket ou la PR ;
````

#### R14 — `skills/chaine/revue-de-ticket/references/CONTENU.md:17`

Ancien :

````text
Une seule section, `## Revue de ticket`, qui remplace `## Revue adversariale` : le capitaine et le relecteur humain lisent les trois axes au même endroit.
````

Nouveau :

````text
Une seule section, `## Revue de ticket`, qui remplace `## Revue adversariale` : le capitaine et le relecteur humain lisent les trois axes au même endroit. Sa ligne « Contrôle des preuves » dit qui a joué `T3`. Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore : tant qu'il n'est pas posé, l'axe Ticket le garde pour toutes les criticités, et la ligne le dit (« Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant »). Le jour où ce relecteur est posé, cette ligne et le paragraphe « Qui joue `T3` » de `criteres-ticket.md` lui passent la main.
````

#### R15 — `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs:11`

Trois lignes du commentaire de tête, aucune ligne de code.

Ancien :

````text
 *   3. « Règles du ticket » : la ligne `Règles:` de l'en-tête, la liste fermée que l'axe Ticket (`T3`)
 *      doit trouver prouvée, puis chaque fichier de règle rendu tel quel, en-tête YAML compris ;
````

Nouveau :

````text
 *   3. « Règles du ticket » : la ligne `Règles:` de l'en-tête, la liste fermée des règles dont l'axe
 *      Ticket (`T3`) relit les preuves, puis chaque fichier de règle rendu tel quel, en-tête YAML
 *      compris (c'est là que se lit si une règle déclare ses cas, clé `cases`) ;
````

#### R16 — `.claude-plugin/plugin.json:3`

Ancien :

````text
  "version": "7.14.0",
````

Nouveau :

````text
  "version": "7.15.0",
````

### 2. La version

R16 : 7.14.0 → 7.15.0 si rien n'a bougé ; règle de repli : décision 13.

## Surfaces

| Surface | Preuve |
| --- | --- |
| `T3` a deux branches, dans l'ordre, chacune une seule fois ; sa tête dit quelles règles il regarde, que les branches se choisissent règle par règle, quelle que soit la criticité | `scripts/depot.test.mjs` « lecteur du critère T3 : entrées piégées » et « T3, branche « cas déclarés » … » |
| première branche : ses deux conditions (index en `"3"`, lu dans l'index ; au moins un cas sous `cases`) ; le relecteur ne recompte pas, la CLI compte et dit « partielle » ; l'étiquette de cas ; (a), (b) et (c) entiers ; la phrase gardée de l'ancien `T3` ; aucun décompte demandé | « T3, branche « cas déclarés » … » |
| seconde branche : toute autre règle ; l'ancien contrôle, un test étiqueté par règle, un cas par cas de bord énoncé, l'étiquette qui ne prouve pas | « T3, branche « sans cas déclarés » … » |
| l'introduction des critères et le prompt : le champ `schema` lu dans l'index, et lui seul ; la mission ; l'étiquette de cas ; « Tu ne recomptes pas » ; toutes criticités ; les gravités des deux branches | « l'axe Ticket lit le schéma dans l'index, et son prompt porte les deux branches … » |
| la phrase de passage de main, hors du bloc que reçoit le sous-agent ; la ligne de la section de PR ; l'étape 4 (la portée d'un cas ne se corrige pas dans la session) et l'étape 5 du skill ; `CONTENU.md` accordé (la citation de `T3`, les deux branches, le champ `schema`, le passage de main) | « qui joue T3 : la phrase qui passera la main au relecteur indépendant … » |
| `revue-de-ticket/SKILL.md` reste sous 200 lignes | test existant « aucun SKILL.md ne dépasse 200 lignes » |
| le commentaire de `contexte-ticket.mjs` (R15) | lecture, en contre-revue (pas de test) ; son banc `contexte-ticket.test.mjs` reste vert, inchangé |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Joué le 2026-11-17 dans des `git worktree` jetables de `fa30c30`, sous un `TMPDIR` privé, puis les copies retirées. Ce ticket a été relu par un script qui en tire le banc du § 0 et chaque bloc « Ancien » / « Nouveau », et les applique à une copie neuve : ce qui suit est le résultat de ce texte, pas d'un brouillon.

- Sur `fa30c30` sans rien : `pnpm install --frozen-lockfile && pnpm test`, **732 sur 732**.
- Le banc du § 0 sur le texte de `fa30c30` : `node --test scripts/depot.test.mjs`, 44 tests, 40 verts, les 4 rouges nommés au § 0.
- Les seize « Ancien » : chacun trouvé une fois, une seule, dans son fichier, à la ligne que son titre annonce.
- Banc, remplacements et version (7.15.0) : `node --test scripts/depot.test.mjs` vert, 44 tests ; `skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs` vert, 10 tests, inchangé ; la suite entière : **737 sur 737** (732 + 5 tests du banc).
- Les contrôles du point 2 de « Pour la session » : huit fichiers au diff ; 0 assertion retirée ; 0 ligne hors commentaire dans le diff de `contexte-ticket.mjs` ; `criteres-documentation.md` et `prompt-documentation.md` sans diff ; `SKILL.md` à 69 lignes.
- **Mutations**, chacune jouée seule sur le texte corrigé, puis le texte remis, sous `node --test scripts/depot.test.mjs` : chacune fait rougir au moins un test. **72 mutations sur 72.** Une phrase glissée entre deux passages exigés reste verte, hors un décompte dans la première branche (décision 12) : elle n'est pas dans la liste. La liste :

1. critères, tête : « quelle que soit la criticité de la règle » retiré
2. critères, tête : les branches choisies pour le projet entier
3. critères, tête : « à défaut de ligne, chaque règle que le ticket cite » retiré
4. cas déclarés : la condition de l'index retirée
5. cas déclarés : l'index en "2" accepté
6. cas déclarés : le schéma lu dans ce que dit la PR
7. cas déclarés : la condition de l'en-tête `cases` retirée
8. cas déclarés : une clé `cases` vide suffit
9. cas déclarés : le relecteur recompte
10. cas déclarés : « partielle » et le niveau exigé retirés
11. cas déclarés : un décompte glissé entre deux passages (chaque cas déclaré a sa preuve)
12. cas déclarés : « au moins un test » glissé entre deux passages
13. cas déclarés : l'étiquette de cas retirée
14. (a) retiré
15. (a) : le relecteur lit le nom, pas l'assertion
16. (a) : le refus non affirmé n'est plus un écart
17. (b) retiré
18. (b) : le renvoi à `.claude/rules/tests.md` retiré
19. (b) : le calcul pur retiré
20. (b) : l'invariant chiffré retiré
21. (b) : la base réelle retirée
22. (b) : la base simulée admise
23. (b) : la frontière de l'API retirée
24. (b) : le test qui passe par la route remplacé par un test unitaire
25. (b) : le bout en bout retiré
26. (b) : « Le niveau exigé, la CLI le compte » retiré
27. (b) : le mauvais étage n'est plus un écart
28. (b) : le dossier qui donne un niveau retiré
29. (c) retiré
30. (c) : un cas dit technique qui est une décision du métier n'est plus un écart
31. (c) : « il échappe à la validation de la MOA » retiré
32. (c) : les cas que le diff ajoute ou modifie ne sont plus regardés
33. (c) : les exemples de l'équipe retirés
34. cas déclarés : la phrase gardée de l'ancien T3 retirée
35. sans cas déclarés : la branche retirée
36. sans cas déclarés : réduite aux projets sans index
37. sans cas déclarés : une clé `cases` vide n'y mène plus
38. sans cas déclarés : « au moins un test » retiré
39. sans cas déclarés : les cas de bord retirés
40. sans cas déclarés : l'étiquette qui ne prouve pas n'est plus un écart
41. les deux branches fondues en une
42. critères, introduction : le champ `schema` retiré
43. qui joue T3 : le paragraphe retiré
44. qui joue T3 : l'axe Ticket ne garde que les règles basses
45. qui joue T3 : la ligne de la section de PR retirée du paragraphe
46. qui joue T3 : « ce contrôle revient à un relecteur indépendant » retiré
47. qui joue T3 : la phrase passée dans le bloc que reçoit le sous-agent
48. prompt : l'index n'est plus lisible
49. prompt : l'index entier lisible
50. prompt : la mission sans les trois écarts
51. prompt : l'étiquette de cas retirée
52. prompt : « Tu recomptes »
53. prompt : « quelle que soit la criticité de la règle » retiré
54. prompt : l'index en "2"
55. prompt, gravité : les bloquants de la branche « cas déclarés » retirés
56. prompt, gravité : la règle citée sans test n'est plus bloquante
57. prompt, gravité : le cas de bord sans test retiré
58. prompt, gravité : le genre de test retiré
59. section de PR : la ligne retirée
60. section de PR : « faute de relecteur indépendant » retiré
61. section de PR : « toutes criticités » retiré
62. SKILL, étape 4 : le point 4 retiré
63. SKILL, étape 4 : la session change le `scope`
64. SKILL, étape 4 : le conducteur n'est plus prévenu
65. SKILL, étape 5 : la ligne « Contrôle des preuves » retirée
66. SKILL, étape 5 : « pour toutes les criticités » retiré
67. CONTENU : « doit trouver prouvées » rétabli
68. CONTENU : « ne recompte pas » retiré
69. CONTENU : l'ancien contrôle de la seconde branche retiré
70. CONTENU : le champ `schema` lu par l'axe Ticket retiré
71. CONTENU : le passage de main retiré
72. CONTENU : « pour toutes les criticités » retiré

Pour la session :

1. Le § 0 : les quatre rouges qu'il annonce. Les §§ 1 et 2, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 5** (737 si `main` est à `fa30c30`).
2. `git diff origin/main --stat` ne montre que les huit fichiers de « Fichiers chauds » ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0 ; `git diff origin/main -- skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs | grep '^[-+]' | grep -v '^[-+][-+]' | grep -vc '^[-+] \*'` rend 0 (seules des lignes de commentaire changent) ; `git diff origin/main --stat -- skills/chaine/revue-de-ticket/references/criteres-documentation.md skills/chaine/revue-de-ticket/references/prompt-documentation.md` ne rend rien (`D8` intact) ; `wc -l skills/chaine/revue-de-ticket/SKILL.md` : 69.
3. Revue de ticket (ses trois axes), sa section dans le corps de la PR, avec la ligne « Contrôle des preuves » que ce ticket ajoute.
4. La PR vise `main`, hors brouillon, **sans `à-fusionner`** (`Label: contre-revue`) ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Le jugement du sous-agent** : le banc tient le texte, pas ce qu'un relecteur en fait. La première revue de ticket jouée sur une règle aux cas déclarés (dans Anchorpost, les règles du pilote de `SPEC_ALL_ANC-5`) dira si (a), (b) et (c) rendent des constats justes, et combien de faux ; (c) est le plus exposé : « métier ou technique » est un jugement, et le prompt du skill `criticite` tranche déjà le doute vers `business`.
- **Entre le pivot 3 et le refus, personne ne refuse un cas sans preuve.** Dans la première branche, le relecteur ne compte plus ; la CLI compte, et le dit dans l'index (« partielle »). Mais tant que le projet est en `sufficiency: observe`, ou n'a ni le rapport `anchorpost compare` en CI ni le gate `preuves` (ligne `K2`, pas encore posée par ce plugin), un cas déclaré sans preuve n'est qu'un état dans l'index : il ne bloque aucune PR. C'est la lettre de `P-38` (« la CLI le fait »), et le plancher du manifeste n'empêche que la régression. Si l'architecte veut une garde d'ici là, la plus petite est un critère qui fait lire au relecteur ce que la CLI a compté pour les règles du ticket, sans rien recompter : écartée ici, à trancher.
- **Les mots du pivot 3** (`"schema": "3"`, `cases`, `scope`, l'étiquette `[RULE_…#<cas>]`) sont ceux de la spec et de la branche `sujet/preuve-suffisante-cas` d'Anchorpost, lue à `ee99738` : son index commis porte `"schema": "3"`, et les tests de sa CLI emploient `[RULE_ALL_CAS-3#nominal]`. La CLI 2.0.0 publiée n'a pas été lue. Si l'un de ces mots change à la publication, `T3`, le prompt et le banc se corrigent avec la ligne `K5`.
- **L'étiquette de cas sur un `describe`** : la spec ne dit que « en tête du titre ». Le critère ne dit donc rien d'une étiquette de cas portée par un `describe`. De même, une preuve écrite dans un fichier `cas/*.json` (clé `cas`) n'est pas un test du diff au sens du critère : (a) et (b) ne la regardent pas.
- **La portée d'un cas n'est relue qu'à la première preuve.** Une règle est classée par une PR de documentation, qui n'a pas de revue de ticket (limite déjà écrite au ticket 49) ; (c) ne voit un cas `technical` que le jour où un test du diff l'étiquette, ou quand le diff le touche. Un cas technique que personne ne prouve n'est relu par personne.
- **Le banc** : une phrase glissée entre deux passages exigés passe, hors un décompte dans la première branche (décision 12).

## Hors périmètre

- **Le relecteur indépendant** d'une PR qui touche une règle moyenne ou haute (`P-6`, chantier 3 du programme) : ni sa forme, ni qui le lance, ni la lecture par une personne nommée pour une règle haute. Ce ticket écrit la phrase qui lui passera la main, rien de lui.
- **Les autres lignes de la part de `skills`** dans la carte du chantier de la preuve suffisante : la copie de la spec dans `docs/issues/standard-documentation/` (`K1`) ; la grille par criticité dans le gabarit de `.claude/rules/tests.md`, le relais `preuves.mjs` et son entrée dans les gates rapides (`K2`) ; le gate des tickets, la ligne `Prouve:` et le tableau `## Surfaces` qui nomme la preuve de chaque cas attendu (`K3`) ; le skill `anchorpost` qui suit la CLI 2.0.0 et sa fiche sur l'écriture d'un cas et d'une étiquette de cas (`K5`) ; la mutation des règles (`K6`).
- **Les trois résumés gardés tels quels** (« Gardé tel quel, après lecture »).
- **La repose dans un projet** : rien n'est à reposer (« Les limites, relevées »). La copie du commentaire de `contexte-ticket.mjs` suivra à la prochaine repose de la chaîne.

## Comments

- 2026-11-17 — Rédigé sur `fa30c30` (plugin 7.14.0, 732 tests) d'après `P-38`, les cinq décisions de l'architecte du même jour, la ligne `K4` de la carte du chantier, `SPEC_ALL_ANC-5` (§ 1, § 2, § 4, § 8, `A-25`) et `RULE_ALL_ANC-26` à `-28`. Joué sur des copies jetables : voir « Vérification ». Choix du rédacteur, à confirmer par l'architecte : (1) la branche se choisit **règle par règle**, sur deux faits (index en `"3"` et au moins un cas sous `cases`), et non pour le projet entier (décision 1) ; (2) le relecteur lit lui-même le champ `schema` de l'index, et `contexte-ticket.mjs` ne change pas (décision 2) ; (3) (b) ajoute aux quatre correspondances de l'architecte l'invariant chiffré prouvé par une propriété, d'après `A-25` et `K4` (décision 5) ; (4) (c) ne regarde que les cas `technical` qu'un test du diff étiquette ou que le diff touche, et la session qui code ne corrige pas ce constat elle-même (décision 6, R9) ; (5) les gravités, que l'architecte n'a pas fixées (décision 7) ; (6) la ligne de la section de PR est écrite sans condition (décision 9) ; (7) `T3` change de titre, et trois résumés qui disent « cas de bord » restent tels quels (décision 10, « Gardé tel quel ») ; (8) les textes du plugin disent « un relecteur indépendant de l'auteur, que le plugin ne pose pas encore », sans nommer « chantier 3 », que seule la carte connaît (décision 8) ; (9) `Label: contre-revue` pour trois lignes de commentaire d'un script posé, sans `/security-review` (décision 14) : retirer R15 lève le label, et laisse un commentaire qui dit encore « doit trouver prouvée ».
