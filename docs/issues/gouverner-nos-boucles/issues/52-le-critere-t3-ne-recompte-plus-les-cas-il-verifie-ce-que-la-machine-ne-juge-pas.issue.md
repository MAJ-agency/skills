# Le critère `T3` de la revue de ticket ne recompte plus les cas : il vérifie ce que la machine ne juge pas, et lit ce qu'elle a compté

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — dix-huit remplacements donnés mot pour mot (ancien, nouveau), dont trois lignes de commentaire d'un script et la version, et un banc donné entier ; tout est joué sur une copie jetable de `origin/main`, mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/revue-de-ticket/references/criteres-ticket.md`, `skills/chaine/revue-de-ticket/references/prompt-ticket.md`, `skills/chaine/revue-de-ticket/references/section-pr.md`, `skills/chaine/revue-de-ticket/references/CONTENU.md`, `skills/chaine/revue-de-ticket/SKILL.md`, `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

Ce ticket réalise `P-38` de la carte `docs/issues/gouverner-nos-boucles/map.md`, que la carte du chantier de la preuve suffisante, dans Anchorpost, porte à sa ligne `K4`.

**La décision du produit** (`P-38`, 2026-11-17, redite le même soir). Ses mots :

> Le relecteur ne recompte pas les cas, la CLI le fait. Il vérifie ce que la machine ne juge pas : ce que le test affirme correspond au titre du cas, le genre de test convient au code, et un cas dit technique l'est vraiment. Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient au relecteur indépendant du chantier 3.

**Ce que le standard fixe.** Les règles `RULE_ALL_ANC-26` à `-29` sont validées dans `develop` d'Anchorpost (PR 269 de ce dépôt, commit `c1f375d`, 2026-11-17 ; `P-46` de la carte) ; la spec `SPEC_ALL_ANC-5` (§ 1, § 2, § 4, § 8) se lit sur sa branche `sujet/preuve-suffisante-cas`.

- Les cas attendus d'une règle s'écrivent dans l'en-tête de son fichier, clé `cases` (chaque cas : `id`, `title`, `kind`, `scope`, `family` facultatif). La clé n'existe qu'au pivot 3 de l'index (`"schema": "3"`, CLI Anchorpost 2.0.0).
- Une preuve nomme le cas qu'elle prouve : `[RULE_ALL_ANC-3#lien-expire]` en tête du titre du test. L'étiquette sans `#` reste valable : elle prouve la règle sans prouver aucun de ses cas.
- Un cas est prouvé quand une preuve porte son étiquette **et** que le niveau exigé par la criticité de la règle est là : un refus ou une entrée invalide d'une règle moyenne ou haute, « à la frontière de l'API » (niveau `P1`, ou `P2`) ; le cas normal d'une règle haute, « de bout en bout » (niveau `P2`). Pour une règle basse ou « à classer », toute preuve suffit.
- `A-25` de la spec : « Le gate ne juge que ce qu'il calcule exactement. Il vérifie le niveau des preuves (frontière de l'API, bout en bout). Qu'un dépôt de données soit prouvé sur base réelle ou un invariant chiffré par une propriété reste un critère de la revue de ticket (`T3`, réécrit) : la nature du code ne se déduit pas sûrement d'un chemin. »
- `RULE_ALL_ANC-27`, à `c1f375d` : « Un cas métier est une situation que la MOA reconnaît : un refus, une exception. Un cas technique est une situation que seule l'équipe voit : une saisie vide, un doublon, deux actions simultanées. » Un cas métier ajouté à une règle validée repasse devant la MOA, un cas technique non ; et : « Retirer ou affaiblir un cas demande le geste daté d'une personne : la MOA pour un cas métier, une personne de l'équipe pour un cas technique, avec sa raison. » `anchorpost compare` (§ 4, sortie 4) ne retient que les cas `scope: business` : un cas métier écrit `technical` passe sans validation, et aucune machine ne le voit.
- **Le § 8 de la spec est dépassé sur ce point.** Il écrit encore que `T3` « ne dit plus « les cas de bord que la règle énonce » mais « chaque cas attendu de la règle a sa preuve, du genre que la nature du code impose » ». C'est un décompte demandé au relecteur : `P-38`, postérieure, le remplace. La spec s'amende côté Anchorpost ; ce ticket suit la décision du produit.

**Ce que la CLI écrit au pivot 3**, lu dans Anchorpost sur `sujet/preuve-suffisante-cas` à `126f885` (`packages/schema/src/v3/index-schema.ts` et `enums.ts`, `apps/cli/src/build/cases.ts` et `realisation.ts`, `apps/cli/src/proofs/scan.ts` et `cases.ts`), puis exécuté sur trois règles jouets (« Vérification ») :

- Chaque règle est une entrée de `rules`, reconnue par sa `key` (l'identifiant de la règle). Elle porte `realisation`, `proofs`, `cases` et, si elle est classée, `criticality`.
- **`realisation.status` se calcule dans cet ordre** : une `exception` écrite dans l'en-tête donne son statut (`not-applicable`, `contradiction`) ; puis, **sans aucune preuve**, `configured` ou `to-build`, « des cas déclarés n'y changent rien » ; puis, avec au moins une preuve, `proven` si la règle déclare au moins un cas et que chacun est prouvé, sinon `partial`. Donc `partial` n'existe qu'avec au moins une preuve, et, pour une règle qui déclare au moins un cas, `partial` veut dire exactement « un cas n'est pas prouvé ». Une famille sans réponse n'est jamais un statut : c'est un avertissement, ou un refus de `check` (groupe 8).
- **Ce qui manque se lit cas par cas.** Chaque cas de `cases` porte `id`, `title`, `kind`, `scope`, ses `proofs` (`file`, `title`), `proven` (vrai ou faux) et, quand il n'est pas prouvé, `missing` : `reason` vaut `no-proof` (aucune preuve ne le nomme) ou `level-too-low` (celles qui le nomment sont d'un niveau que la grille n'accepte pas), et `levels` liste les niveaux dont un seul suffirait. Il n'y a pas de champ `realisation.missing`. Une règle sans preuve garde ses cas, chacun `proven: false`.
- **La criticité effective** d'une règle est `criticality.level` de son entrée (`low`, `medium`, `high`) : la plus haute de ce qu'elle reçoit, de son fichier ou d'une feature ; `origin` dit d'où elle vient (`declared` ou `feature`), `declared` garde le niveau que la règle fixe elle-même. Sans `criticality`, la règle est « à classer ».
- **Le niveau qu'un test reçoit** est `proofs[].level` (`P0`, `P1`, `P2`), à côté de son `file`, de son `title` (le titre du test tel qu'il est écrit) et, s'il nomme un cas, de `case`.
- Le scanner fait hériter à un test les étiquettes de tous les `describe` qui l'englobent, étiquettes de cas comprises.
- Un fichier `cas/*.json` de la forme `{ domaine, cas: [{ regle, cas? }] }` donne une preuve unitaire de niveau `P0` par règle et par cas nommé, sans que la CLI cherche quel test lit ce fichier.

**Le fait, sur `origin/main` à `fa30c30`** (plugin 7.14.0) :

- `T3` (`skills/chaine/revue-de-ticket/references/criteres-ticket.md:12`) fait compter le relecteur : « au moins un test » par règle de la ligne `Règles:`, « les cas de bord que la règle énonce […] ont chacun un cas ». Il refuse une PR dont une règle citée n'a aucun test, et signale le cas de bord que l'énoncé dit et qu'aucun test ne porte. Il ne connaît ni les cas déclarés, ni l'étiquette de cas, ni les niveaux.
- Trois textes citent `T3` (`git grep -n "T3" origin/main -- skills`) : le critère, `references/CONTENU.md:5` (« liste fermée des règles que `T3` doit trouver prouvées ») et le commentaire de tête de `scripts/contexte-ticket.mjs:11` (« la liste fermée que l'axe Ticket (`T3`) doit trouver prouvée »).
- `contexte-ticket.mjs` rend déjà chaque fichier de règle « tel quel, en-tête YAML compris », puis « Identifiants cités », où chaque ticket cité est marqué trouvé ou introuvable, avec son chemin.
- Aucun banc ne tient `criteres-ticket.md`, `prompt-ticket.md` ni `section-pr.md`.
- Le relecteur indépendant du chantier 3 n'existe pas, et les projets qui posent ce plugin ne sont pas tous au pivot 3.

**Ce que l'architecte a décidé** (2026-11-17 et 2026-11-18, en quatre temps : à la commande du ticket, à sa première lecture, après une relecture à neuf, puis à la vérification de la version corrigée) :

1. **Pas de trou pendant la transition.** Le compte des cas par la CLI n'existe qu'au pivot 3. Le nouveau `T3` a deux branches, écrites sans ambiguïté : au pivot 3, le relecteur ne recompte pas ; ailleurs, l'ancien contrôle reste, mot pour mot ou presque.
2. **Les trois vérifications de la décision, dites de façon observable** : (a) le relecteur lit l'assertion, pas le nom ; (b) le genre de test convient au code ; (c) un cas dit technique l'est vraiment.
3. **Le critère nouveau est au moins aussi fort que l'ancien.** Le relecteur ne recompte pas, **mais il lit ce que la CLI a compté** : une quatrième vérification, (d), dans le bloc du critère. Elle **juge le cas, pas le statut** : un cas `proven: false` est un écart, que la règle ait des preuves ou non. Un cas de bord que l'énoncé dit et que `cases` ne porte pas reste un écart, et son test reste dû. L'exception de (d), le cas qu'un autre ticket porte, ne se prend pas seul. Et un index à jour est un préalable de la revue, pas un de ses tours.
4. **Qui joue ce contrôle pour une règle moyenne ou haute** : le relecteur indépendant du chantier 3. Tant qu'il n'est pas posé, l'axe Ticket garde ce contrôle pour toutes les criticités, et la section de PR le dit en une ligne. Le ticket n'invente pas ce relecteur : il écrit la phrase qui lui passera la main, et dit où elle se lit.
5. **Rien d'autre ne bouge sans raison.** `D8` reste tel quel ; aucune phrase ne le contredit. Toute citation de `T3` est accordée.
6. **Version** : la mineure suivante.

Quand le ticket est fait : `T3` a deux branches, choisies règle par règle ; dans la première (index du projet au pivot 3, règle qui déclare au moins un cas), le relecteur ne recompte pas, vérifie (a), (b) et (c), puis lit dans l'index ce que la CLI a compté, (d), et relève le cas de bord de l'énoncé qu'aucun cas déclaré ne porte ; dans la seconde (toute autre règle), l'ancien contrôle reste ; le prompt de l'axe Ticket dit ce que le relecteur peut lire, liste fermée, connaît l'étiquette de cas, gradue les écarts nouveaux et rend le cas laissé à un autre ticket ; la phrase qui passera la main au relecteur indépendant se lit dans `criteres-ticket.md`, hors du bloc que reçoit le sous-agent, et la section de PR porte deux lignes de plus ; la session qui code ne change ni n'écrit elle-même un cas, mais livre le test du cas de bord que l'énoncé dit ; le skill fait vérifier les index générés avant tout sous-agent ; `CONTENU.md` et le commentaire de `contexte-ticket.mjs` sont accordés ; un banc tient chaque passage, et chaque mutation de la liste le fait rougir.

Ticket de documentation et de banc : aucun hook ne change, aucune ligne de code exécutée ne change (`contexte-ticket.mjs` : trois lignes de commentaire), rien de nouveau n'est posé dans un projet.

## Où

Base : `origin/main` à `fa30c30` (PR 109 du ticket 49, le skill de criticité, fusionnée, plugin **7.14.0**, **732 tests**). La session retrouve chaque « Ancien » par son texte ; chacun y apparaît une seule fois.

| Texte | Ce qu'il dit | Verdict |
| --- | --- | --- |
| `skills/chaine/revue-de-ticket/references/criteres-ticket.md:3` (introduction) | ce que reçoit le relecteur : le contexte du ticket et le diff | R1 : l'en-tête YAML des règles nommé ; il lit dans l'index le champ `schema` et l'entrée `rules` de chaque règle du ticket |
| `…/criteres-ticket.md:12` (`T3`) | un test étiqueté par règle, un cas par cas de bord | R2 : deux branches ; dans la première, (a) à (c), (d), le cas de bord de l'énoncé, et aucun décompte |
| `…/criteres-ticket.md:36` (fin du bloc) | — | R3 : le paragraphe « Qui joue `T3` », hors du bloc |
| `…/prompt-ticket.md:2` (ce que le relecteur peut lire) | les fichiers du diff, les tests, le glossaire, les règles | R4 : une liste fermée, « Rien d'autre » |
| `…/prompt-ticket.md:6` (la mission) | « une règle citée sans test ou sans ses cas de bord » | R5 : les écarts nouveaux nommés |
| `…/prompt-ticket.md:13` (l'étiquette) | l'étiquette de règle ; « les règles à trouver prouvées » | R6 : l'étiquette de cas, sur le test ou sur un `describe` ; ce qu'il ne recompte pas et ce qu'il lit ; toutes criticités |
| `…/prompt-ticket.md:23` (la gravité) | bloquant : règle citée sans test ; à corriger : cas de bord sans test | R7 : les gravités des deux branches |
| `…/prompt-ticket.md:32` (le format de sortie) | une ligne par constat, puis les critères non concernés | R8 : une ligne par cas laissé à un autre ticket |
| `…/section-pr.md:4` | la ligne `/security-review` | R9 : les lignes « Contrôle des preuves » et « Cas laissés à un autre ticket » |
| `skills/chaine/revue-de-ticket/SKILL.md:30` (étape 1, fin du paragraphe) | les chemins sensibles | R10 : les index générés vérifiés avant tout sous-agent |
| `…/SKILL.md:52` (étape 4, point 3) | un bloquant ouvert après deux tours | R11 : un point 4, ce que la session ne corrige pas elle-même et ce qu'elle livre ; un point 5, l'index que le relecteur voit périmé malgré l'étape 1 |
| `…/SKILL.md:56` (étape 5) | la section de PR | R12 : ce que disent ses deux lignes nouvelles |
| `…/references/CONTENU.md:5`, `:9`, `:13`, `:17` | le script, les critères, les prompts, la section | R13 à R16 : accordés |
| `…/scripts/contexte-ticket.mjs:11` (commentaire de tête) | « la liste fermée que l'axe Ticket (`T3`) doit trouver prouvée » | R17 : accordé, trois lignes de commentaire |
| `.claude-plugin/plugin.json:3` | 7.14.0 | R18 : 7.15.0 |
| fin de `scripts/depot.test.mjs` | — | § 0 : six tests |

### Gardé tel quel, après lecture

- **`D8`** (`references/criteres-documentation.md`) et **`prompt-documentation.md`** : pas un mot ne change. Vérifié phrase par phrase : `D8` juge la trace d'un geste sur `criticality`, `cases` ou `notApplicableFamilies` dans la section `## Criticité` de la PR ; `T3` juge les tests du diff contre les cas déclarés, et lit l'index. Deux points de contact : la portée d'un cas (`D8` tient pour bloquant « un cas rendu […] qui a changé de kind, de scope ou de sens […] sans sa raison écrite dans la section ») et l'ajout d'un cas (`D8` exige la section pour tout diff qui écrit `cases`). Les deux critères tiennent ensemble parce que la session qui code ne change ni n'écrit un cas elle-même (décisions 6 et 10, R11) : elle ne fait pas le geste que `D8` surveille.
- **`T5`** (« index régénérés ») : inchangé, et tenu par le banc, puisque (d) y renvoie (décision 9).
- **Le code de `contexte-ticket.mjs`** et son banc : le script rend déjà l'en-tête de chaque règle et l'état « trouvé » de chaque ticket cité ; il n'a rien à apprendre (décisions 2 et 8).
- **Trois résumés de l'axe Ticket** qui disent « règles citées avec leurs cas de bord », sans citer `T3` : la description de `skills/chaine/revue-de-ticket/SKILL.md:3`, `README.md:84` (« règles et cas de bord ») et le gabarit d'ADR `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-chaine-de-production.md:20`. Ils restent vrais de la seconde branche ; la description est ce qui déclenche le skill, et l'ADR est une copie posée dans chaque projet. Laissés tels quels : décision 17.
- **`.claude/rules/tests.md`** (gabarit de `socle-monorepo`) et **la fiche `.claude/rules/anchorpost.md`** : la grille par criticité et l'écriture d'une étiquette de cas sont les lignes `K2` et `K5` de la carte du chantier (« Hors périmètre »). `T3` s'appuie sur ce que ces fiches disent déjà : « `.spec.ts` unitaire P0, `.db.spec.ts` base réelle P0, `.property.spec.ts` propriétés P0, `apps/api/test/**` intégration P1, `tests/**` et `e2e/**` e2e P2 », « Jamais la base mockée dans un repository », « Une fonction pure qui porte un invariant métier chiffré […] gagne un test de propriétés ».
- **La revue adversariale** (axe Règles) : elle ne reçoit ni ticket ni règle.

### Les limites, relevées

- **Un `SKILL.md` a au plus 200 lignes** (`scripts/depot.test.mjs:12`). Après le ticket, `revue-de-ticket/SKILL.md` : **70** lignes (68 + les points 4 et 5 de l'étape 4 ; la phrase de l'étape 1 s'ajoute à une ligne existante).
- **Le sous-agent de l'axe Ticket reçoit le bloc des critères, et lui seul** (`SKILL.md`, étape 2 : « les critères sont le bloc de code entier du fichier, jamais réduit »). Ce qui est dans le bloc lui est dit ; ce qui est hors du bloc ne l'est pas. Le paragraphe « Qui joue `T3` » est hors du bloc pour cette raison (décision 14), et le banc le vérifie ; (d) est dans le bloc pour la même raison.
- **Le relecteur est en contexte vierge** : il ne sait de la CLI que ce que le critère lui dit. Tout ce que (b) et (d) lui demandent se lit dans un champ nommé de l'entrée de la règle, pas d'après une convention de chemins qu'il ne connaît pas.
- **Les critères, le prompt et la section ne se posent pas dans un projet** : ils se lisent dans le dossier du skill. Seul `contexte-ticket.mjs` est posé (`scripts/chaine/`), et il ne change que par son commentaire : aucune repose n'est due. Une session joue le nouveau `T3` dès que son plugin est en 7.15.0.
- **L'index d'un projet est gros et ses clés sont triées** (plusieurs centaines de milliers de caractères, `"schema"` vers la fin) : le relecteur lit un champ et l'entrée de quelques règles, pas le fichier (R4).
- **Le diff que reçoit le relecteur ne porte pas l'index** : `diff-revue.sh` écrit `diff.patch` « sans lockfile, index générés ni snapshots ». Le relecteur lit donc l'index dans le dépôt, tel que la branche relue le laisse ; (d) lui dit à quoi il voit qu'il n'a pas été régénéré.

## Décisions

Toutes sont arrêtées : celles que le rédacteur avait proposées ont été acceptées par l'architecte, les décisions 7 à 10, 12 et 13 sont les siennes (« Comments »).

1. **Deux branches, choisies règle par règle.** La première, « cas déclarés », vaut pour une règle quand deux faits sont vrais ensemble : l'index commis du projet, `anchorpost/anchorpost.json`, porte `"schema": "3"` ; et l'en-tête de la règle déclare au moins un cas sous `cases`. La seconde, « sans cas déclarés », vaut pour toute autre règle. Raison : c'est seulement quand les deux sont vrais que la CLI compte quelque chose pour cette règle. Une clé `cases` écrite dans un projet dont l'index n'est pas au pivot 3 n'est comptée par aucune machine ; une clé `cases` vide ne mène pas à la première branche.
2. **Comment le relecteur sait dans quelle branche il est, sans explorer le dépôt.** Les cas : il les lit dans son contexte, « Règles du ticket », où `contexte-ticket.mjs` rend chaque fichier de règle avec son en-tête YAML. Le pivot : il lit lui-même le champ `schema` de l'index commis ; jamais ce qu'en disent le ticket ou la PR. C'est ce que fait déjà le skill `criticite` (étape 1 : « Seul l'index compte ») et ce que `D8` exige du relecteur de l'axe Documentation. Le script ne change pas.
3. **Première branche : le relecteur ne recompte pas, il lit le compte.** Le critère dit qui compte et ce que la machine écrit : « la CLI Anchorpost le fait : elle écrit `proven: false` sur chaque cas déclaré qui n'a pas sa preuve au niveau exigé ». Il ne demande aucun décompte au relecteur ; le banc refuse quatre façons d'en écrire un dans cette branche (décision 18). La phrase que l'ancien `T3` gardait de juste y est reprise, étendue à l'étiquette de cas : « Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart. »
4. **(a) Ce que le test affirme correspond au titre du cas.** Le relecteur lit l'assertion, pas le nom ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart. Le chapeau du critère dit sur quoi portent (a) à (c) : « chaque test du diff qui porte l'étiquette d'un cas de la règle […] et […] chaque preuve que l'entrée de la règle range dans un fichier de cas ». **Les fichiers de cas** : une preuve écrite dans un fichier `cas/*.json` (entrées `regle` et `cas`) n'affirme rien si aucun test du diff ou du dépôt ne lit ce fichier, et c'est un écart ; la CLI compte l'entrée sans chercher ce test, c'est donc au relecteur de le voir.
5. **(b) Le genre de test convient au code, lisible en contexte vierge.** Deux correspondances de nature, que la machine ne juge pas (`A-25`) : un calcul pur, un test unitaire, et un test de propriétés s'il porte un invariant chiffré ; une requête, un test sur base réelle, jamais sur une base simulée. Deux correspondances de niveau, bornées par la criticité : un refus ou une entrée invalide **d'une règle moyenne ou haute**, à la frontière de l'API (niveau `P1`), par un test qui passe par la route ; le cas normal **d'une règle haute**, de bout en bout (niveau `P2`), par un vrai parcours. Le relecteur lit la criticité dans `criticality.level` de l'entrée de la règle (`medium`, `high`), et le niveau qu'un test a reçu dans `proofs[].level`, pas d'après un chemin. **Il ne compte pas les niveaux** : « Le niveau exigé, la CLI le compte ». Il vérifie qu'un test mérite le niveau qu'il porte : « un `P1` qui ne passe pas par la route, un `P2` qui n'est pas un parcours » est un écart, parce que la CLI donne le niveau d'après le chemin du fichier et ne lit pas le test. Un seul mot pour ce niveau : « niveau ».
6. **(c) Un cas dit technique l'est vraiment.** Les définitions sont celles de `RULE_ALL_ANC-27`, déjà copiées dans le prompt du skill `criticite`. Le contrôle porte sur chaque cas `scope: technical` qu'un test du diff étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle (la ligne `K4` : « pour chaque cas qu'une preuve étiquette »). **La session qui code ne corrige pas ce constat elle-même** : la fiche `.claude/rules/anchorpost.md` lui interdit de changer le `scope` ou le titre d'un cas, et `RULE_ALL_ANC-27` réserve au geste daté d'une personne le retrait ou l'affaiblissement d'un cas. Le constat reste dans la section de PR, bloquant, la PR en brouillon, et la session le dit au conducteur du chantier (sans chantier, au produit) : R11.
7. **(d) juge le cas, pas le statut.** « Une de ces règles dont un cas de `cases` porte `proven: false` est un écart, quel que soit `realisation.status` (`partial` si elle a des preuves, `to-build` ou `configured` si elle n'en a aucune : `proofs` est alors vide) ». Raison, vue sur la CLI (« Le besoin ») : sans aucune preuve, une règle n'est pas `partial` ; un critère écrit sur `partial` laissait passer la règle citée dont aucun cas n'a de test, que l'ancien `T3` refuse. « Ces règles » sont celles de la tête du critère, comme dans l'ancien : la ligne `Règles:` entière et, à défaut de ligne, chaque règle que le ticket cite ; un ticket de défaut corrige une règle sans la « réaliser ». Les deux raisons de `missing.reason` sont nommées, `no-proof` et `level-too-low` : un cas dont les preuves sont d'un niveau trop bas n'est pas prouvé non plus. « Le relecteur ne refait pas le compte : il lit celui de l'index. »
8. **L'exception de (d) ne se prend pas seul.** Un cas `proven: false` n'est laissé à un autre ticket qu'aux cinq conditions réunies : le ticket relu nomme ce ticket ; ce ticket est « trouvé » dans « Identifiants cités » du contexte, sans « (archivé) », et n'est pas le ticket relu ; il est ouvert, son `Status:` n'est ni `Fait` ni `wontfix` ; sa ligne `Règles:` cite la règle ; ni la mention ni cette ligne `Règles:` ne sont ajoutées par le diff relu. Les quatre dernières ne dépendent pas de ce que l'auteur écrit dans sa branche : un ticket inventé est « introuvable » ; un ticket fait, abandonné ou archivé ne portera plus rien, et l'ancien critère aurait relevé le cas ; un ticket qui ne cite pas la règle ne la porte pas ; une mention ou une ligne `Règles:` ajoutée par le diff ne compte pas. `contexte-ticket.mjs` écrit « trouvé (archivé) » pour un ticket d'archive, et ne rend pas le `Status:` d'un ticket cité : le relecteur lit pour cela l'en-tête du ticket nommé, et rien d'autre de lui (R4). Un cas ainsi laissé reste visible : le relecteur rend « cas <règle>#<id> porté par <ticket> » (R8), et la section de PR le porte (R9, R12).
9. **L'index à jour est un préalable, pas un tour.** (d) ne vaut que sur un index que le diff a régénéré. L'étape 1 du skill fait donc jouer, avant tout sous-agent, le gate de chaque index généré du projet (ceux de `scripts/docs/index-generes.json` ; pour l'index Anchorpost, le gate Anchorpost du projet) : un index périmé arrête la revue avant qu'elle commence, se régénère par sa commande, et ne consomme aucun des deux tours de l'étape 4 (R10). Le critère garde l'écart de `T5` pour le cas où le relecteur voit quand même un index périmé, borné à l'index que (d) lit, bloquant. Trois signes, visibles sans rien lancer : une de ces règles absente de `rules` ; un test étiqueté du diff dont le titre manque aux `proofs` de la règle (le titre, pas le fichier : le cas courant est un test ajouté à un fichier déjà listé) ; des `id` de cas qui diffèrent entre l'en-tête de la règle et son entrée. « Se rejoue » veut dire une chose : l'index régénéré, **l'axe Ticket seul** est relancé, un sous-agent, pas les trois ; et ce n'est aucun des deux tours (R11, point 5).
10. **Un cas de bord que l'énoncé dit et que `cases` ne porte pas reste un écart.** L'ancien `T3` jugeait « les cas de bord que la règle énonce » d'après son texte ; sans cette phrase, la première branche ne confronterait plus l'énoncé aux cas déclarés, et l'auteur passerait seul d'une branche à l'autre en écrivant un unique cas `nominal`. La phrase n'est pas un décompte de preuves : elle confronte deux textes, l'énoncé et `cases`. « Qu'une famille soit dite sans objet n'y change rien » : un « sans objet » de `notApplicableFamilies` ne fait pas disparaître un cas que l'énoncé dit. « Le cas se dit, la session ne l'écrit pas elle-même » : seule l'écriture du cas sous `cases` attend le skill `criticite`, et `D8` surveille tout diff qui l'écrit. **Le test, lui, reste dû** : « son test, étiqueté de la règle sans nom de cas, est dû dans le diff », comme l'ancien `T3` l'exigeait ; le point 4 de l'étape 4 du skill le dit à la session (R11). Gravité : à corriger, pour le cas absent de `cases` comme pour son test manquant.
11. **L'étiquette de cas sur un `describe`** vaut pour les tests qu'il contient, comme l'étiquette de règle. Le critère et le prompt le disent en une phrase chacun ; c'est ce que fait le scanner de la CLI, vérifié sur une règle jouet (« Vérification »).
12. **Les gravités** (prompt, R7).
    - Bloquant, **dans les deux branches** : une règle citée sans aucune preuve qui la nomme (aux cas déclarés : `proofs` vide dans son entrée de l'index).
    - Bloquant, pour une règle aux cas déclarés : une preuve de cas qui n'affirme pas ce que le titre du cas promet ; un fichier de cas que rien ne lit ; un test qui porte un niveau qu'il n'a pas ; un cas dit technique qui est une décision du métier ; un cas `proven: false` **que ce ticket porte** (un test du diff l'étiquette, ou la table « Surfaces » l'annonce). Et, de `T5`, un index que le diff n'a pas régénéré.
    - À corriger, pour une règle aux cas déclarés : tout autre cas `proven: false` ; un cas de bord que l'énoncé dit et qu'aucun cas déclaré ne porte ; le test de ce cas de bord s'il manque au diff ; un genre de test qui ne convient pas au code sans que son niveau en dépende.
    - Seconde branche, comme aujourd'hui : à corriger, un cas de bord énoncé sans cas de test.
13. **Ce que le relecteur peut lire** (prompt, R4) : une liste fermée et complète, close par « Rien d'autre ». Les fichiers entiers touchés par le diff, les tests, le glossaire et les règles du dépôt, comme aujourd'hui ; le code qu'un test du diff exerce, quand le diff ne le touche pas (sans lui, (b) ne se juge pas) ; un fichier `cas/*.json` hors du diff qu'une preuve cite ((a)) ; dans l'index, le champ `schema` et l'entrée `rules` de chaque règle du ticket ((b), (d)) ; l'en-tête du ticket que le ticket relu nomme pour porter un cas ((d)).
14. **Qui joue `T3`, et où se lit la phrase qui passera la main.** Un paragraphe « Qui joue `T3` » à la fin de `criteres-ticket.md`, **hors du bloc** : le sous-agent de l'axe Ticket ne reçoit que le bloc, et le bloc lui dit « quelle que soit la criticité de la règle » ; s'il lisait qu'un autre jouera ce contrôle pour les règles moyennes et hautes, il les sauterait. Le paragraphe ne nomme ni « chantier 3 », que seule la carte du programme connaît, ni la forme de ce relecteur : « un relecteur indépendant de l'auteur, que le plugin ne pose pas encore ». Le ticket qui posera ce relecteur n'aura que ce paragraphe, une ligne de la section et deux phrases (`SKILL.md` étape 5, `CONTENU.md`) à réécrire ; le critère, lui, est écrit pour être repris tel quel.
15. **Deux lignes de plus dans la section de PR**, toujours écrites. « Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités) » : sans condition sur la criticité, que la session n'a pas à calculer. Et « Cas laissés à un autre ticket (`T3`, (d)) » : chaque cas rendu par l'axe Ticket, ou « aucun ».
16. **`T3` change de titre** : « Règles citées et leurs preuves », au lieu de « Règles citées et cas de bord ». La seconde branche garde les cas de bord, mot pour mot ; seul son sujet change (« La règle a au moins un test […] », au lieu de « Chaque règle de la ligne `Règles:` […] a au moins un test »), parce que la liste des règles est dite une fois, en tête, pour les deux branches.
17. **Les citations de `T3` accordées, trois résumés laissés.** `CONTENU.md:5` et le commentaire de `contexte-ticket.mjs:11` ne disent plus que `T3` « doit trouver prouvées » les règles de la ligne `Règles:`, mais qu'il « relit les preuves » de ces règles ; le prompt dit « Les règles que T3 regarde ». `CONTENU.md` dit aussi les deux branches, ce que le relecteur lit dans l'index, et le passage de main. Les trois résumés qui disent « cas de bord » sans citer `T3` (« Gardé tel quel, après lecture ») restent tels quels.
18. **Le banc tient ce qu'il lit, et rien de plus.** À plat (blancs et sauts de ligne réduits à une espace), des passages d'un seul tenant, comme au ticket 49. Un lecteur pur, `critereT3`, coupe le critère en sa tête et ses deux branches ; chaque branche est exigée dans sa branche, pas dans le fichier. Il tient, entiers : la tête, les conditions de la première branche, (a), (b), (c), (d), la phrase du cas de bord de l'énoncé, la phrase gardée, la seconde branche ; le prompt (droits de lecture, mission, étiquette, gravités, format) ; le paragraphe « Qui joue `T3` » et sa place hors du bloc ; les deux lignes de la section ; la phrase de l'étape 1, les points 4 et 5 de l'étape 4 et la phrase de l'étape 5 du skill ; les quatre passages de `CONTENU.md` ; le texte de `T5` auquel (d) renvoie ; le commentaire du script (R17) ; et la version, par plancher (7.15.0 ou plus : une égalité rougirait à la version suivante). Le motif `DECOMPTE` refuse dans la première branche, sans égard à la casse, quatre façons de demander un décompte : « au moins un test », « ont chacun un cas », « chaque cas attendu (ou déclaré) … a sa (ou une) preuve », « tous les cas déclarés (ou attendus) sont couverts (ou ont leur preuve) ». **Limite avouée** : toute autre phrase glissée entre deux passages exigés passe, même contraire à ce qui l'entoure, même un décompte écrit autrement. Aucun test existant n'est retiré, sauté ni assoupli.
19. **Version : mineure** (`.claude-plugin/plugin.json:3`, 7.14.0 → **7.15.0** sur `fa30c30`), décision de l'architecte : un critère de revue change pour toute session qui joue la revue de ticket. **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, puis vérifie la valeur après la fusion (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`). **Le plancher du banc suit la règle de repli** : si la mineure prévue est prise, le plancher de l'assertion (`auMoins(version, "7.15.0")`) et son message montent avec elle, à la version retenue.
20. **`Label: contre-revue`**, à cause d'un seul fichier : `contexte-ticket.mjs` se pose dans un projet sous `scripts/chaine/`, chemin sensible du gabarit de `.claude/chaine.json`. Le ticket n'y change que trois lignes de commentaire (R17, gardé), et la vérification le montre par une commande. Pas de `/security-review` demandée : aucune ligne exécutée ne change. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): le critère T3 de la revue de ticket ne recompte plus les cas, il vérifie ce que la machine ne juge pas et lit ce qu'elle a compté (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Choisir la branche au seul champ `schema`, pour le projet entier** : une règle qui ne déclare pas encore ses cas, dans un projet au pivot 3, n'aurait plus ni le compte de la CLI (elle n'a rien à compter) ni l'ancien contrôle.
- **Choisir la branche à la seule clé `cases`** : dans un projet dont l'index n'est pas au pivot 3, aucune CLI ne compte.
- **Faire écrire le schéma de l'index, ou l'entrée des règles, par `contexte-ticket.mjs`** dans le contexte : le script est posé dans chaque projet, les critères se lisent dans le plugin ; les deux n'avancent pas ensemble, et un projet non reposé recevrait le nouveau critère sans le signal.
- **Laisser le compte à la seule CLI, sans (d)** (première version de ce ticket) : en `observe` et sans rapport `compare`, plus personne ne refuserait le cas sans preuve ; refusé par l'architecte.
- **Écrire (d) sur le statut `partial`** (deuxième version) : une règle sans aucune preuve sort `to-build`, et passait ; refusé à la relecture à neuf.
- **Une exception de (d) que le ticket relu suffit à ouvrir** (deuxième version : « sauf si le ticket nomme le ticket qui porte ce cas ») : l'auteur l'écrivait lui-même dans la branche relue.
- **Faire recompter le relecteur dans la première branche** (confronter lui-même `cases` et les étiquettes du diff) : c'est ce que `P-38` retire ; il lit `proven` et `missing`, que la CLI a calculés avec la grille des niveaux.
- **Laisser la session écrire le cas de bord qui manque à `cases`** : c'est le geste du skill `criticite`, tracé dans la PR (`D8`) ; la session le dit.
- **Faire juger le niveau d'un test d'après son chemin** (deuxième version : « de l'étage où son chemin le range ») : le relecteur, en contexte vierge, ne connaît pas la convention de chemins du projet ; il lit `proofs[].level`.
- **Compter parmi les deux tours le rejeu sur un index régénéré** (troisième version) : un index périmé n'est pas un constat de la revue, c'est un préalable manqué ; l'étape 1 l'arrête avant tout sous-agent (décision 9).
- **Laisser tout le constat du cas de bord de l'énoncé au skill de criticité** (troisième version : « ne se corrige pas dans la session ») : le test, que l'ancien `T3` exigeait, ne serait plus dû ; seule l'écriture sous `cases` attend (décision 10).
- **Une exception de (d) vers un ticket fait, abandonné ou archivé** : le cas n'aurait plus personne (décision 8).
- **Tenir la version par une égalité dans le banc** : le test rougirait à la version suivante du plugin ; un plancher tient ce qui compte, que le critère nouveau n'existe pas avant 7.15.0.
- **Écrire la phrase de passage de main dans le bloc des critères** : le sous-agent sauterait les règles moyennes et hautes (décision 14).
- **N'écrire la ligne « Contrôle des preuves » que si la PR touche une règle moyenne ou haute** : la session devrait calculer une criticité qu'elle n'a pas à lire (décision 15).
- **Recopier la grille par criticité dans `T3`** : c'est la ligne `K2` (le gabarit de `.claude/rules/tests.md`), et la CLI la calcule.
- **Retirer la seconde branche le jour où tous les projets sont au pivot 3** : elle vaut aussi pour une règle qui ne déclare pas encore ses cas ; elle se retirera par un ticket, quand plus aucune règle n'est dans ce cas.

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge

Après le dernier test de `scripts/depot.test.mjs` (« chaque skill du plugin a sa ligne au README et passe le gate references-agent d'un projet qui le cite », ajouté par la PR 109), une ligne vide, puis, rien d'autre :

````js
// Le critère T3 de la revue de ticket (ticket 52, décision du produit P-38) : pour une règle qui déclare ses cas, dans un
// projet dont l'index Anchorpost est au pivot 3, le relecteur ne recompte pas les cas, la CLI le fait ; il vérifie ce que
// la machine ne juge pas, puis lit ce qu'elle a compté. Pour toute autre règle, l'ancien contrôle reste. Le banc tient
// les deux branches, les trois vérifications, la lecture de l'index, la phrase qui passera la main au relecteur
// indépendant, et l'absence de tout décompte demandé au relecteur dans la branche « cas déclarés ». Même lecture à plat
// que le banc du skill de criticité, même limite : une phrase glissée entre deux passages exigés passe, même contraire.
const REVUE_DE_TICKET = `${SKILLS_CHAINE}/revue-de-ticket`;
const CRITERES_TICKET = `${REVUE_DE_TICKET}/references/criteres-ticket.md`;
const CAS_DECLARES = "Branche « cas déclarés »";
const SANS_CAS_DECLARES = "Branche « sans cas déclarés »";
const DECOMPTE = /au moins un test|ont chacun un cas|chaque cas (attendu|déclaré)[^.;:]* a (sa|une) preuve|tous les cas (attendus|déclarés) (sont couverts|ont (leur|une) preuve)/i;
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
// Une version « a.b.c » vaut au moins « x.y.z ».
const auMoins = (version, plancher) => {
  const [a, b] = [version, plancher].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test("lecteurs du critère T3 : entrées piégées", () => {
  const t3 = (corps) => `T2  x\nT3  Tête. ${corps}\nT4  y\n`;
  assert.deepEqual(critereT3(t3(`${CAS_DECLARES} — a.\n    ${SANS_CAS_DECLARES} — b.`)), { tete: "T3 Tête. ", declares: " — a. ", sans: " — b. " });
  assert.equal(critereT3("T2  x\nT4  y\n"), null, "sans T3");
  assert.equal(critereT3(t3("un seul contrôle")), null, "sans branche");
  assert.equal(critereT3(t3(`${CAS_DECLARES} — a.`)), null, "sans la branche « sans cas déclarés »");
  assert.equal(critereT3(t3(`${SANS_CAS_DECLARES} — b.`)), null, "sans la branche « cas déclarés »");
  assert.equal(critereT3(t3(`${SANS_CAS_DECLARES} — b. ${CAS_DECLARES} — a.`)), null, "branches dans le désordre");
  assert.equal(critereT3(t3(`${CAS_DECLARES} — a. ${CAS_DECLARES} — a. ${SANS_CAS_DECLARES} — b.`)), null, "une branche écrite deux fois");
  assert.equal(DECOMPTE.test("chaque cas déclaré de la règle a sa preuve"), true, "un décompte demandé au relecteur");
  assert.equal(DECOMPTE.test("Chaque cas attendu a une preuve"), true, "un décompte en tête de phrase");
  assert.equal(DECOMPTE.test("Tous les cas déclarés sont couverts"), true, "un décompte dit autrement");
  assert.equal(DECOMPTE.test("La règle a AU MOINS UN TEST"), true, "sans égard à la casse");
  assert.equal(DECOMPTE.test("tant qu'un cas déclaré n'a pas sa preuve"), false, "ce que dit la CLI n'est pas un décompte demandé au relecteur");
  assert.equal(DECOMPTE.test("elle écrit `proven: false` sur chaque cas déclaré qui n'a pas sa preuve au niveau exigé"), false, "ce qu'écrit la CLI non plus");
  assert.equal(auMoins("7.15.0", "7.15.0"), true);
  assert.equal(auMoins("7.14.9", "7.15.0"), false, "une mineure en dessous");
  assert.equal(auMoins("7.100.0", "7.15.0"), true, "des nombres, pas des chaînes");
  assert.equal(auMoins("8.0.0", "7.15.0"), true);
});

test("T3, branche « cas déclarés » : index au pivot 3 et règle qui déclare ses cas, le relecteur ne recompte pas, il vérifie ce que la machine ne juge pas et lit ce qu'elle a compté", () => {
  const { tete, declares } = lireT3();
  exigerDans("T3, tête", tete, [
    "T3 Règles citées et leurs preuves — registre de règles, `.claude/rules/tests.md` § Règles. Les règles sont celles de la ligne `Règles:` du ticket (« Règles du ticket » du contexte ; à défaut de ligne, chaque règle que le ticket cite). Deux branches, choisies règle par règle, quelle que soit la criticité de la règle.",
  ]);
  exigerDans("T3, branche « cas déclarés »", declares, [
    "— seulement si l'index commis du projet, anchorpost/anchorpost.json, porte \"schema\": \"3\" (le relecteur lit ce champ dans l'index, jamais dans ce que disent le ticket ou la PR) et si l'en-tête de la règle, rendu dans « Règles du ticket », déclare au moins un cas sous `cases`.",
    "Le relecteur ne recompte pas les cas, la CLI Anchorpost le fait : elle écrit `proven: false` sur chaque cas déclaré qui n'a pas sa preuve au niveau exigé. Il vérifie ce que la machine ne juge pas, (a) à (c), sur chaque test du diff qui porte l'étiquette d'un cas de la règle (`[RULE_ALL_FAC-3#montant-nul]` : l'identifiant de la règle, `#`, celui du cas ; portée par un `describe`, elle vaut pour les tests qu'il contient) et sur chaque preuve que l'entrée de la règle range dans un fichier de cas, puis il lit ce que la machine a compté, (d), dans l'entrée de la règle sous `rules` de l'index de la branche relue (par sa `key`) :",
    "(a) ce que le test affirme correspond au titre du cas : le relecteur lit l'assertion, pas le nom ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart ; une preuve écrite dans un fichier de cas (`cas/*.json`, entrées `regle` et `cas`) n'affirme rien si aucun test du diff ou du dépôt ne lit ce fichier : c'est un écart ;",
    "(b) le genre de test convient au code que le cas exerce, selon les catégories de `.claude/rules/tests.md` : un calcul pur se prouve par un test unitaire, et par un test de propriétés s'il porte un invariant chiffré ; une requête, par un test sur base réelle, jamais sur une base simulée ; un refus ou une entrée invalide d'une règle moyenne ou haute (`criticality.level` de l'entrée vaut `medium` ou `high`), exigés à la frontière de l'API (niveau `P1`), par un test qui passe par la route ; le cas normal d'une règle haute (`high`), exigé de bout en bout (niveau `P2`), par un vrai parcours. Le niveau exigé, la CLI le compte ; le niveau qu'elle donne à un test se lit dans `proofs[].level` de l'entrée : un test qui porte un niveau qu'il n'a pas (un `P1` qui ne passe pas par la route, un `P2` qui n'est pas un parcours) est un écart ;",
    "(c) un cas dit technique l'est vraiment : chaque cas `scope: technical` qu'un test du diff étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle, est une situation que seule l'équipe voit (une saisie vide, un doublon, deux actions simultanées) ; s'il est une décision du métier (un refus, une exception que la MOA reconnaîtrait), c'est un écart : il échappe à la validation de la MOA ;",
    "(d) ce que la CLI a compté : une de ces règles dont un cas de `cases` porte `proven: false` est un écart, quel que soit `realisation.status` (`partial` si elle a des preuves, `to-build` ou `configured` si elle n'en a aucune : `proofs` est alors vide) ; `missing.reason` dit pourquoi : `no-proof`, aucune preuve ne nomme le cas, ou `level-too-low`, ses preuves sont d'un niveau trop bas. Le relecteur ne refait pas le compte : il lit celui de l'index. L'écart ne tombe que pour un cas qu'un autre ticket porte, aux cinq conditions réunies : le ticket relu nomme ce ticket ; il est « trouvé » dans « Identifiants cités » du contexte, sans « (archivé) », et n'est pas le ticket relu ; il est ouvert, son `Status:` n'est ni `Fait` ni `wontfix` ; sa ligne `Règles:` cite la règle ; ni la mention ni cette ligne `Règles:` ne sont ajoutées par le diff relu. Le relecteur rend alors « cas <règle>#<id> porté par <ticket> », pour la section de PR. Un index que le diff n'a pas régénéré est un écart de T5, pour le seul index que (d) lit : il se régénère, et l'axe Ticket seul se rejoue. Ses signes : une de ces règles absente de `rules` ; un test étiqueté du diff dont le titre manque aux `proofs` de la règle ; des `id` de cas qui diffèrent entre l'en-tête de la règle et son entrée.",
    "Un cas de bord que l'énoncé de la règle dit et qu'aucun cas de `cases` ne porte est un écart, et qu'une famille soit dite sans objet n'y change rien : le cas se dit, la session ne l'écrit pas elle-même ; son test, étiqueté de la règle sans nom de cas, est dû dans le diff.",
    "Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart.",
  ]);
  assert.ok(!DECOMPTE.test(declares), "T3, branche « cas déclarés » : aucun décompte n'est demandé au relecteur, la CLI compte");
  assert.ok(!/étage/.test(declares), "T3, branche « cas déclarés » : un seul mot pour le niveau d'une preuve");
});

test("T3, branche « sans cas déclarés » : pour toute autre règle, l'ancien contrôle reste", () => {
  const { sans } = lireT3();
  exigerDans("T3, branche « sans cas déclarés »", sans, [
    "— toute autre règle : index absent ou d'un autre schéma, ou en-tête sans aucun cas sous `cases`. La règle a au moins un test qui porte son identifiant entre crochets en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ; les cas de bord que la règle énonce (limite, zéro, dépassement, chevauchement, passage à minuit, montant nul ou négatif, doublon) ont chacun un cas ; un test qui porte un identifiant de règle qu'il ne prouve pas est un écart.",
  ]);
});

test("l'axe Ticket lit dans l'index le schéma et l'entrée des règles du ticket, et son prompt porte les deux branches : ce qu'il peut lire, l'étiquette de cas, ce qu'il ne recompte pas, les gravités, le cas laissé à un autre ticket", () => {
  exiger(CRITERES_TICKET, [
    "chaque fichier de règle tel que le dépôt l'écrit, en-tête YAML compris — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**, et lit dans l'index commis du projet, `anchorpost/anchorpost.json`, s'il existe, le champ `schema` et l'entrée `rules` de chaque règle du ticket.",
  ]);
  exiger(`${REVUE_DE_TICKET}/references/prompt-ticket.md`, [
    "Tu travailles en lecture seule. Pour vérifier un point, tu peux lire : les fichiers entiers touchés par le diff, les tests, le glossaire et les règles du dépôt ; le code qu'un test du diff exerce, quand le diff ne le touche pas ; un fichier `cas/*.json` hors du diff qu'une preuve cite ; dans l'index anchorpost/anchorpost.json, le champ `schema` et l'entrée `rules` de chaque règle du ticket ; l'en-tête du ticket que le ticket relu nomme pour porter un cas (critère T3, (d)). Rien d'autre. Tu ne modifies rien, tu ne lances aucune commande qui écrit.",
    "Ta seule mission : trouver les ÉCARTS entre le diff et le ticket — une surface sans test, une décision non tenue, une règle citée sans test ou sans ses cas de bord, une preuve de cas qui n'affirme pas ce que le titre du cas promet, un test qui porte un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier, un cas déclaré que l'index dit non prouvé, un cas de bord de l'énoncé qu'aucun cas déclaré ne porte, du code hors ticket — selon la liste fermée de critères ci-dessous et elle seule.",
    "Il prouve un cas attendu de la règle quand l'étiquette nomme ce cas après un `#` (`[RULE_ALL_LIC-3#seconde-licence]`), sur le test ou sur un `describe` qui le contient : les cas d'une règle sont la clé `cases` de son en-tête, dans « Règles du ticket ». Tu ne recomptes pas les cas d'une règle qui les déclare, quand l'index du projet porte \"schema\": \"3\" : la CLI Anchorpost le fait ; tu juges ce qu'elle ne juge pas, et tu lis dans l'index ce qu'elle a compté (critère T3), quelle que soit la criticité de la règle. Les règles que T3 regarde sont celles de « Règles du ticket » dans le contexte ; celles d'« Identifiants cités » sont du contexte, pas une liste à prouver.",
    "- bloquant : une surface du ticket sans aucun test, une décision tranchée contredite par le code ; dans les deux branches de T3, une règle citée sans aucune preuve qui la nomme (aux cas déclarés : `proofs` vide dans son entrée de l'index) ; pour une règle aux cas déclarés, une preuve de cas qui n'affirme pas ce que le titre du cas promet, un fichier de cas que rien ne lit, un test qui porte un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier, un cas `proven: false` que ce ticket porte (un test du diff l'étiquette, ou la table « Surfaces » l'annonce) ; un index que le diff n'a pas régénéré (T5) ;",
    "- à corriger : un cas de bord qu'une règle sans cas déclarés énonce, sans cas de test ; pour une règle aux cas déclarés, tout autre cas `proven: false`, un cas de bord que l'énoncé dit et qu'aucun cas déclaré ne porte, le test de ce cas de bord s'il manque au diff, un genre de test qui ne convient pas au code sans que son niveau en dépende ; un fichier hors « Où » non justifié, un statut ou un commentaire de ticket manquant ;",
    "- ou, s'il n'y a rien : « aucun écart » - puis une ligne par cas non prouvé que T3 (d) laisse à un autre ticket : « cas <règle>#<id> porté par <ticket> » - puis une dernière ligne : « Critères non concernés : T… ».",
  ]);
});

test("qui joue T3 : la phrase qui passera la main au relecteur indépendant, hors du bloc des critères, les lignes de la section de PR, et ce que la session fait autour de la revue", () => {
  exiger(CRITERES_TICKET, [
    "**Qui joue `T3`.** Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore. Tant qu'il n'est pas posé, l'axe Ticket garde ce contrôle pour toutes les criticités, et la section de PR le dit en une ligne : « Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant ». Le critère est écrit pour que ce relecteur le reprenne tel quel. Ce paragraphe reste hors du bloc : le sous-agent de l'axe Ticket ne reçoit que le bloc, et ne saute aucune règle pour sa criticité.",
  ]);
  const blocs = blocsTexte(readFileSync(join(RACINE, CRITERES_TICKET), "utf8"));
  assert.equal(blocs.length, 1, `${CRITERES_TICKET} : un seul bloc de critères, celui que reçoit le sous-agent`);
  assert.ok(!/relecteur indépendant/.test(plat(blocs[0])), `${CRITERES_TICKET} : le bloc que reçoit le sous-agent ne lui dit pas qu'un autre jouera ce contrôle`);
  exiger(`${REVUE_DE_TICKET}/references/section-pr.md`, [
    "- Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités) - Cas laissés à un autre ticket (`T3`, (d)) : cas `<règle>#<id>` porté par `<ticket>` | aucun",
  ]);
  exiger(`${REVUE_DE_TICKET}/SKILL.md`, [
    "**Les index générés d'abord** : avant tout sous-agent, jouer le gate de chaque index généré du projet (`scripts/docs/index-generes.json` ; pour l'index Anchorpost, le gate Anchorpost du projet). Un index périmé arrête la revue ici : il se régénère par sa commande, et ce n'est aucun des deux tours de l'étape 4.",
    "4. Deux constats de `T3` ne se corrigent pas en entier dans la session : un cas dit technique jugé métier, et un cas de bord de l'énoncé qu'aucun cas déclaré ne porte. Elle ne change ni le `scope` ni le titre d'un cas (fiche `.claude/rules/anchorpost.md`), et n'en écrit aucun sous `cases` : cela seul attend le skill `criticite`. Le test du cas de bord, étiqueté de la règle sans nom de cas, se livre dans la PR. Le constat reste dans la section de PR et la session le dit au conducteur du chantier (sans chantier, au produit) ; le premier, bloquant, garde la PR en brouillon. 5. Si le relecteur de l'axe Ticket voit malgré l'étape 1 un index que le diff n'a pas régénéré (`T5`, les signes de `T3` (d)), l'index se régénère par sa commande, puis l'axe Ticket seul se rejoue. Ce n'est aucun des deux tours.",
    "Sa ligne « Contrôle des preuves » dit qui a joué `T3` : la revue de ticket, pour toutes les criticités, tant que le relecteur indépendant d'une règle moyenne ou haute n'est pas posé ([`references/criteres-ticket.md`](references/criteres-ticket.md), « Qui joue `T3` »). Sa ligne « Cas laissés à un autre ticket » reprend chaque « cas … porté par … » que l'axe Ticket a rendu, ou « aucun ».",
  ]);
  exiger(`${REVUE_DE_TICKET}/references/CONTENU.md`, [
    "la ligne `Règles:`, liste fermée des règles dont `T3` relit les preuves, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris : c'est là que le relecteur lit si une règle déclare ses cas (clé `cases`) —",
    "règles citées et leurs preuves (`T3`, deux branches, choisies règle par règle : si l'index du projet est au pivot 3 et que la règle déclare ses cas, le relecteur ne recompte pas les cas, la CLI Anchorpost le fait, et il vérifie ce que la machine ne juge pas — ce que le test affirme correspond au titre du cas, le genre de test convient au code, un cas dit technique l'est vraiment — puis il lit dans l'index ce qu'elle a compté : une règle citée dont un cas déclaré porte `proven: false` est un écart, qu'elle ait des preuves ou non, sauf pour un cas qu'un autre ticket, encore ouvert, porte, à cinq conditions que l'auteur ne remplit pas seul ; un cas de bord que l'énoncé dit et qu'aucun cas déclaré ne porte est un écart aussi, et son test reste dû ; sinon, l'ancien contrôle reste — un test étiqueté par règle, un cas par cas de bord énoncé),",
    "Celui de l'axe Ticket reçoit le contexte du ticket, et lit lui-même, dans l'index du projet, le champ `schema` et l'entrée `rules` de chaque règle du ticket, jamais ce qu'en disent le ticket ou la PR ; ce qu'il peut lire est une liste fermée, écrite dans son prompt ;",
    "Sa ligne « Contrôle des preuves » dit qui a joué `T3`. Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore : tant qu'il n'est pas posé, l'axe Ticket le garde pour toutes les criticités, et la ligne le dit (« Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant »). Le jour où ce relecteur est posé, cette ligne et le paragraphe « Qui joue `T3` » de `criteres-ticket.md` lui passent la main. Sa ligne « Cas laissés à un autre ticket » garde visible chaque cas non prouvé que `T3` (d) laisse à un autre ticket.",
  ]);
});

test("ce que T3 suppose autour de lui : le critère T5 auquel (d) renvoie, le commentaire du script qui rend les règles, la version du plugin", () => {
  exiger(CRITERES_TICKET, [
    "T5 Vérification — ticket § « Vérification ». Les commandes ciblées du ticket ont un équivalent vert dans le diff (specs nommées présentes, index régénérés, specs de garde complétées).",
  ]);
  exiger(`${REVUE_DE_TICKET}/scripts/contexte-ticket.mjs`, [
    "* 3. « Règles du ticket » : la ligne `Règles:` de l'en-tête, la liste fermée des règles dont l'axe * Ticket (`T3`) relit les preuves, puis chaque fichier de règle rendu tel quel, en-tête YAML * compris (c'est là que se lit si une règle déclare ses cas, clé `cases`) ;",
  ]);
  const { version } = JSON.parse(readFileSync(join(RACINE, ".claude-plugin/plugin.json"), "utf8"));
  assert.ok(auMoins(version, "7.15.0"), `.claude-plugin/plugin.json : version ${version} ; le critère T3 à deux branches est celui du plugin 7.15.0 et des suivants`);
});
````

Sur le texte de `fa30c30`, `node --test scripts/depot.test.mjs` : **45 tests, 40 verts, 5 rouges**. Vert parmi les six ajoutés : « lecteurs du critère T3 : entrées piégées », qui ne lit aucun fichier. Rouges : « T3, branche « cas déclarés » … » et « T3, branche « sans cas déclarés » … » (le critère n'a pas ses deux branches : `critereT3` rend `null`) ; « l'axe Ticket lit dans l'index le schéma et l'entrée des règles du ticket … » (premier passage absent : l'introduction des critères) ; « qui joue T3 … » (premier passage absent : le paragraphe « Qui joue `T3` ») ; « ce que T3 suppose autour de lui … » (le commentaire du script ; le texte de `T5`, lui, est déjà là). Les 39 tests d'avant restent verts.

### 1. Les remplacements, mot pour mot

Chaque « Ancien » apparaît **une seule fois** dans son fichier à `fa30c30`. Si une PR fusionnée depuis l'a modifié, la session le retrouve par son sens et applique le « Nouveau » à la même place. Les fins de ligne des blocs sont celles du fichier : les critères et le prompt sont coupés vers 100 caractères, les autres textes tiennent sur une ligne.

#### R1 — `skills/chaine/revue-de-ticket/references/criteres-ticket.md:3`

Ancien :

````text
Le relecteur reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>` : le ticket, sa ligne de spec, ses règles — la ligne `Règles:` et chaque fichier de règle tel que le dépôt l'écrit — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**. Il ne rend que des écarts rattachés à l'un de ces critères.
````

Nouveau :

````text
Le relecteur reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>` : le ticket, sa ligne de spec, ses règles — la ligne `Règles:` et chaque fichier de règle tel que le dépôt l'écrit, en-tête YAML compris — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**, et lit dans l'index commis du projet, `anchorpost/anchorpost.json`, s'il existe, le champ `schema` et l'entrée `rules` de chaque règle du ticket. Il ne rend que des écarts rattachés à l'un de ces critères.
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
    moins un cas sous `cases`. Le relecteur ne recompte pas les cas, la CLI Anchorpost le fait :
    elle écrit `proven: false` sur chaque cas déclaré qui n'a pas sa preuve au niveau exigé. Il
    vérifie ce que la machine ne juge pas, (a) à (c), sur chaque test du diff qui porte
    l'étiquette d'un cas de la règle (`[RULE_ALL_FAC-3#montant-nul]` : l'identifiant de la règle,
    `#`, celui du cas ; portée par un `describe`, elle vaut pour les tests qu'il contient) et sur
    chaque preuve que l'entrée de la règle range dans un fichier de cas, puis il lit ce que la
    machine a compté, (d), dans l'entrée de la règle sous `rules` de l'index de la branche relue
    (par sa `key`) :
    (a) ce que le test affirme correspond au titre du cas : le relecteur lit l'assertion, pas le
        nom ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart ; une preuve
        écrite dans un fichier de cas (`cas/*.json`, entrées `regle` et `cas`) n'affirme rien si
        aucun test du diff ou du dépôt ne lit ce fichier : c'est un écart ;
    (b) le genre de test convient au code que le cas exerce, selon les catégories de
        `.claude/rules/tests.md` : un calcul pur se prouve par un test unitaire, et par un test
        de propriétés s'il porte un invariant chiffré ; une requête, par un test sur base réelle,
        jamais sur une base simulée ; un refus ou une entrée invalide d'une règle moyenne ou
        haute (`criticality.level` de l'entrée vaut `medium` ou `high`), exigés à la frontière de
        l'API (niveau `P1`), par un test qui passe par la route ; le cas normal d'une règle haute
        (`high`), exigé de bout en bout (niveau `P2`), par un vrai parcours. Le niveau exigé, la
        CLI le compte ; le niveau qu'elle donne à un test se lit dans `proofs[].level` de
        l'entrée : un test qui porte un niveau qu'il n'a pas (un `P1` qui ne passe pas par la
        route, un `P2` qui n'est pas un parcours) est un écart ;
    (c) un cas dit technique l'est vraiment : chaque cas `scope: technical` qu'un test du diff
        étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle, est une situation
        que seule l'équipe voit (une saisie vide, un doublon, deux actions simultanées) ; s'il est
        une décision du métier (un refus, une exception que la MOA reconnaîtrait), c'est un
        écart : il échappe à la validation de la MOA ;
    (d) ce que la CLI a compté : une de ces règles dont un cas de `cases` porte `proven: false`
        est un écart, quel que soit `realisation.status` (`partial` si elle a des preuves,
        `to-build` ou `configured` si elle n'en a aucune : `proofs` est alors vide) ;
        `missing.reason` dit pourquoi : `no-proof`, aucune preuve ne nomme le cas, ou
        `level-too-low`, ses preuves sont d'un niveau trop bas. Le relecteur ne refait pas le
        compte : il lit celui de l'index. L'écart ne tombe que pour un cas qu'un autre ticket
        porte, aux cinq conditions réunies : le ticket relu nomme ce ticket ; il est « trouvé »
        dans « Identifiants cités » du contexte, sans « (archivé) », et n'est pas le ticket
        relu ; il est ouvert, son `Status:` n'est ni `Fait` ni `wontfix` ; sa ligne `Règles:` cite
        la règle ; ni la mention ni cette ligne `Règles:` ne sont ajoutées par le diff relu. Le
        relecteur rend alors « cas <règle>#<id> porté par <ticket> », pour la section de PR. Un
        index que le diff n'a pas régénéré est un écart de T5, pour le seul index que (d) lit : il
        se régénère, et l'axe Ticket seul se rejoue. Ses signes : une de ces règles absente de
        `rules` ; un test étiqueté du diff dont le titre manque aux `proofs` de la règle ; des
        `id` de cas qui diffèrent entre l'en-tête de la règle et son entrée.
    Un cas de bord que l'énoncé de la règle dit et qu'aucun cas de `cases` ne porte est un écart,
    et qu'une famille soit dite sans objet n'y change rien : le cas se dit, la session ne l'écrit
    pas elle-même ; son test, étiqueté de la règle sans nom de cas, est dû dans le diff.
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
prétend réaliser. Tu travailles en lecture seule. Pour vérifier un point, tu peux lire : les
fichiers entiers touchés par le diff, les tests, le glossaire et les règles du dépôt ; le code
qu'un test du diff exerce, quand le diff ne le touche pas ; un fichier `cas/*.json` hors du diff
qu'une preuve cite ; dans l'index anchorpost/anchorpost.json, le champ `schema` et l'entrée `rules`
de chaque règle du ticket ; l'en-tête du ticket que le ticket relu nomme pour porter un cas
(critère T3, (d)). Rien d'autre. Tu ne modifies rien, tu ne lances aucune commande qui écrit.
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
n'affirme pas ce que le titre du cas promet, un test qui porte un niveau qu'il n'a pas, un cas dit
technique qui est une décision du métier, un cas déclaré que l'index dit non prouvé, un cas de
bord de l'énoncé qu'aucun cas déclaré ne porte, du code hors ticket — selon la liste fermée de
critères ci-dessous et elle seule.
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
(`[RULE_ALL_LIC-3#seconde-licence]`), sur le test ou sur un `describe` qui le contient : les cas
d'une règle sont la clé `cases` de son en-tête, dans « Règles du ticket ». Tu ne recomptes pas les
cas d'une règle qui les déclare, quand l'index du projet porte "schema": "3" : la CLI Anchorpost
le fait ; tu juges ce qu'elle ne juge pas, et tu lis dans l'index ce qu'elle a compté (critère
T3), quelle que soit la criticité de la règle. Les règles que T3 regarde sont celles de « Règles
du ticket » dans le contexte ; celles d'« Identifiants cités » sont du contexte, pas une liste à
prouver.
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
  dans les deux branches de T3, une règle citée sans aucune preuve qui la nomme (aux cas
  déclarés : `proofs` vide dans son entrée de l'index) ; pour une règle aux cas déclarés, une
  preuve de cas qui n'affirme pas ce que le titre du cas promet, un fichier de cas que rien ne
  lit, un test qui porte un niveau qu'il n'a pas, un cas dit technique qui est une décision du
  métier, un cas `proven: false` que ce ticket porte (un test du diff l'étiquette, ou la table
  « Surfaces » l'annonce) ; un index que le diff n'a pas régénéré (T5) ;
- à corriger : un cas de bord qu'une règle sans cas déclarés énonce, sans cas de test ; pour une
  règle aux cas déclarés, tout autre cas `proven: false`, un cas de bord que l'énoncé dit et
  qu'aucun cas déclaré ne porte, le test de ce cas de bord s'il manque au diff, un genre de test
  qui ne convient pas au code sans que son niveau en dépende ; un fichier hors « Où » non
  justifié, un statut ou un commentaire de ticket manquant ;
````

#### R8 — `skills/chaine/revue-de-ticket/references/prompt-ticket.md:32`

Ancien :

````text
- ou, s'il n'y a rien : « aucun écart »
- puis une dernière ligne : « Critères non concernés : T… ».
````

Nouveau :

````text
- ou, s'il n'y a rien : « aucun écart »
- puis une ligne par cas non prouvé que T3 (d) laisse à un autre ticket :
  « cas <règle>#<id> porté par <ticket> »
- puis une dernière ligne : « Critères non concernés : T… ».
````

#### R9 — `skills/chaine/revue-de-ticket/references/section-pr.md:4`

Ancien :

````text
- `/security-review` : lancée (chemins : …) | non requise
````

Nouveau :

````text
- `/security-review` : lancée (chemins : …) | non requise
- Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant (critère `T3`, toutes criticités)
- Cas laissés à un autre ticket (`T3`, (d)) : cas `<règle>#<id>` porté par `<ticket>` | aucun
````

#### R10 — `skills/chaine/revue-de-ticket/SKILL.md:30`

À la fin du paragraphe de l'étape 1, sur la même ligne.

Ancien :

````text
Chemins sensibles : comme la revue adversariale (étape 2 de son SKILL).
````

Nouveau :

````text
Chemins sensibles : comme la revue adversariale (étape 2 de son SKILL). **Les index générés d'abord** : avant tout sous-agent, jouer le gate de chaque index généré du projet (`scripts/docs/index-generes.json` ; pour l'index Anchorpost, le gate Anchorpost du projet). Un index périmé arrête la revue ici : il se régénère par sa commande, et ce n'est aucun des deux tours de l'étape 4.
````

#### R11 — `skills/chaine/revue-de-ticket/SKILL.md:52`

Deux points, 4 et 5, à la suite du point 3.

Ancien :

````text
3. Un bloquant de l'axe Ticket ouvert après deux tours : la PR reste en brouillon, le ticket repasse `en cours`, le conducteur est prévenu.
````

Nouveau :

````text
3. Un bloquant de l'axe Ticket ouvert après deux tours : la PR reste en brouillon, le ticket repasse `en cours`, le conducteur est prévenu.
4. Deux constats de `T3` ne se corrigent pas en entier dans la session : un cas dit technique jugé métier, et un cas de bord de l'énoncé qu'aucun cas déclaré ne porte. Elle ne change ni le `scope` ni le titre d'un cas (fiche `.claude/rules/anchorpost.md`), et n'en écrit aucun sous `cases` : cela seul attend le skill `criticite`. Le test du cas de bord, étiqueté de la règle sans nom de cas, se livre dans la PR. Le constat reste dans la section de PR et la session le dit au conducteur du chantier (sans chantier, au produit) ; le premier, bloquant, garde la PR en brouillon.
5. Si le relecteur de l'axe Ticket voit malgré l'étape 1 un index que le diff n'a pas régénéré (`T5`, les signes de `T3` (d)), l'index se régénère par sa commande, puis l'axe Ticket seul se rejoue. Ce n'est aucun des deux tours.
````

#### R12 — `skills/chaine/revue-de-ticket/SKILL.md:56`

Ancien :

````text
Elle remplace `## Revue adversariale` : le capitaine accepte l'un ou l'autre titre, et renvoie une PR de code qui n'a ni l'un ni l'autre.
````

Nouveau :

````text
Elle remplace `## Revue adversariale` : le capitaine accepte l'un ou l'autre titre, et renvoie une PR de code qui n'a ni l'un ni l'autre. Sa ligne « Contrôle des preuves » dit qui a joué `T3` : la revue de ticket, pour toutes les criticités, tant que le relecteur indépendant d'une règle moyenne ou haute n'est pas posé ([`references/criteres-ticket.md`](references/criteres-ticket.md), « Qui joue `T3` »). Sa ligne « Cas laissés à un autre ticket » reprend chaque « cas … porté par … » que l'axe Ticket a rendu, ou « aucun ».
````

#### R13 — `skills/chaine/revue-de-ticket/references/CONTENU.md:5`

Ancien :

````text
la ligne `Règles:`, liste fermée des règles que `T3` doit trouver prouvées, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris —
````

Nouveau :

````text
la ligne `Règles:`, liste fermée des règles dont `T3` relit les preuves, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris : c'est là que le relecteur lit si une règle déclare ses cas (clé `cases`) —
````

#### R14 — `skills/chaine/revue-de-ticket/references/CONTENU.md:9`

Ancien :

````text
L'axe Ticket (T1–T9) : surfaces prouvées, décisions tenues, règles citées avec leurs cas de bord, « Où »,
````

Nouveau :

````text
L'axe Ticket (T1–T9) : surfaces prouvées, décisions tenues, règles citées et leurs preuves (`T3`, deux branches, choisies règle par règle : si l'index du projet est au pivot 3 et que la règle déclare ses cas, le relecteur ne recompte pas les cas, la CLI Anchorpost le fait, et il vérifie ce que la machine ne juge pas — ce que le test affirme correspond au titre du cas, le genre de test convient au code, un cas dit technique l'est vraiment — puis il lit dans l'index ce qu'elle a compté : une règle citée dont un cas déclaré porte `proven: false` est un écart, qu'elle ait des preuves ou non, sauf pour un cas qu'un autre ticket, encore ouvert, porte, à cinq conditions que l'auteur ne remplit pas seul ; un cas de bord que l'énoncé dit et qu'aucun cas déclaré ne porte est un écart aussi, et son test reste dû ; sinon, l'ancien contrôle reste — un test étiqueté par règle, un cas par cas de bord énoncé), « Où »,
````

#### R15 — `skills/chaine/revue-de-ticket/references/CONTENU.md:13`

Ancien :

````text
Celui de l'axe Ticket reçoit le contexte du ticket ;
````

Nouveau :

````text
Celui de l'axe Ticket reçoit le contexte du ticket, et lit lui-même, dans l'index du projet, le champ `schema` et l'entrée `rules` de chaque règle du ticket, jamais ce qu'en disent le ticket ou la PR ; ce qu'il peut lire est une liste fermée, écrite dans son prompt ;
````

#### R16 — `skills/chaine/revue-de-ticket/references/CONTENU.md:17`

Ancien :

````text
Une seule section, `## Revue de ticket`, qui remplace `## Revue adversariale` : le capitaine et le relecteur humain lisent les trois axes au même endroit.
````

Nouveau :

````text
Une seule section, `## Revue de ticket`, qui remplace `## Revue adversariale` : le capitaine et le relecteur humain lisent les trois axes au même endroit. Sa ligne « Contrôle des preuves » dit qui a joué `T3`. Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore : tant qu'il n'est pas posé, l'axe Ticket le garde pour toutes les criticités, et la ligne le dit (« Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant »). Le jour où ce relecteur est posé, cette ligne et le paragraphe « Qui joue `T3` » de `criteres-ticket.md` lui passent la main. Sa ligne « Cas laissés à un autre ticket » garde visible chaque cas non prouvé que `T3` (d) laisse à un autre ticket.
````

#### R17 — `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs:11`

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

#### R18 — `.claude-plugin/plugin.json:3`

Ancien :

````text
  "version": "7.14.0",
````

Nouveau :

````text
  "version": "7.15.0",
````

### 2. La version

R18 : 7.14.0 → 7.15.0 si rien n'a bougé ; règle de repli, et plancher du banc qui la suit : décision 19.

## Surfaces

| Surface | Preuve |
| --- | --- |
| `T3` a deux branches, dans l'ordre, chacune une seule fois ; sa tête dit quelles règles il regarde, que les branches se choisissent règle par règle, quelle que soit la criticité ; le motif `DECOMPTE` et la comparaison de versions lisent ce qu'ils doivent | `scripts/depot.test.mjs` « lecteurs du critère T3 : entrées piégées » et « T3, branche « cas déclarés » … » |
| première branche : ses deux conditions ; le relecteur ne recompte pas, la CLI écrit `proven: false` ; l'étiquette de cas, sur le test ou sur un `describe` ; la portée de (a) à (c), tests étiquetés du diff et preuves rangées dans un fichier de cas ; (a), avec le fichier de cas que rien ne lit ; (b), avec `criticality.level`, `proofs[].level` et le niveau qu'un test n'a pas ; (c) ; (d) : le cas `proven: false` quel que soit le statut, `to-build` et `configured` nommés, les deux raisons, « ne refait pas le compte », l'exception et ses cinq conditions, le cas rendu pour la section, l'index non régénéré, borné à celui que (d) lit, ses trois signes, le renvoi à `T5` et le rejeu de l'axe Ticket seul ; le cas de bord de l'énoncé que `cases` ne porte pas, la famille dite sans objet qui n'y change rien, son test dû ; la phrase gardée de l'ancien `T3` ; aucun décompte demandé ; plus d'« étage » | « T3, branche « cas déclarés » … » |
| seconde branche : toute autre règle ; l'ancien contrôle, un test étiqueté par règle, un cas par cas de bord énoncé, l'étiquette qui ne prouve pas | « T3, branche « sans cas déclarés » … » |
| l'introduction des critères et le prompt : ce que le relecteur peut lire, liste fermée ; la mission ; l'étiquette de cas ; « Tu ne recomptes pas », « tu lis dans l'index ce qu'elle a compté » ; toutes criticités ; les gravités des deux branches ; la ligne du cas laissé à un autre ticket | « l'axe Ticket lit dans l'index le schéma et l'entrée des règles du ticket … » |
| la phrase de passage de main, hors du bloc que reçoit le sous-agent ; les deux lignes de la section de PR ; dans le skill, les index générés vérifiés avant tout sous-agent (étape 1), ce que la session ne corrige pas et ce qu'elle livre, le rejeu de l'axe Ticket seul (étape 4), les lignes de la section (étape 5) ; `CONTENU.md` accordé | « qui joue T3 : la phrase qui passera la main au relecteur indépendant … » |
| le texte de `T5` auquel (d) renvoie ; le commentaire de `contexte-ticket.mjs` (R17) ; la version, 7.15.0 ou plus | « ce que T3 suppose autour de lui … » |
| `revue-de-ticket/SKILL.md` reste sous 200 lignes | test existant « aucun SKILL.md ne dépasse 200 lignes » |
| `contexte-ticket.mjs` ne change que par son commentaire | la commande du point 2 de « Pour la session » ; son banc `contexte-ticket.test.mjs` reste vert, inchangé |

## Vérification

Rejoué le 2026-11-18, après la vérification de l'architecte, dans des `git worktree` jetables de `fa30c30`, sous un `TMPDIR` privé, puis les copies retirées. Ce ticket a été relu par un script qui en tire le banc du § 0, chaque bloc « Ancien » / « Nouveau » et le script des mutations ci-dessous, et les applique à une copie neuve : ce qui suit est le résultat de ce texte, pas d'un brouillon.

- Sur `fa30c30` sans rien : `pnpm install --frozen-lockfile && pnpm test`, **732 sur 732**.
- Le banc du § 0 sur le texte de `fa30c30` : `node --test scripts/depot.test.mjs`, 45 tests, 40 verts, les 5 rouges nommés au § 0.
- Les dix-huit « Ancien » : chacun trouvé une fois, une seule, dans son fichier, à la ligne que son titre annonce.
- Banc, remplacements et version (7.15.0) : `node --test scripts/depot.test.mjs` vert, 45 tests ; `skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs` vert, 10 tests, inchangé ; la suite entière : **738 sur 738** (732 + 6 tests du banc).
- Les contrôles du point 2 de « Pour la session » : huit fichiers au diff ; 0 assertion retirée ; 0 ligne hors commentaire dans le diff de `contexte-ticket.mjs` ; `criteres-documentation.md` et `prompt-documentation.md` sans diff ; `SKILL.md` à 70 lignes.
- **Mutations : 158 rouges sur 158**, par le script ci-dessous, tiré de ce ticket et lancé sur la copie où le ticket est appliqué.

**Essai sur la CLI du pivot 3.** La CLI de `sujet/preuve-suffisante-cas` d'Anchorpost, extraite à `126f885` dans un dossier jetable (`git archive`, `pnpm install --frozen-lockfile`), a écrit l'index (`tsx src/cli.ts index`) d'une copie de son dépôt jouet (`apps/cli/test/fixtures/depot-v2`) où trois règles ont reçu des cas. Ce que l'index porte, et ce qu'en dit le texte final du critère, lu par le rédacteur (aucun sous-agent n'a joué la revue) :

| Règle jouet | Ce que l'index écrit | Lu par le texte final |
| --- | --- | --- |
| deux cas déclarés (`nominal`, `refusal`), criticité `medium`, **aucune preuve** | `realisation.status: "to-build"`, `realisation.cases: { declared: 2, proven: 0 }`, `proofs: []`, chaque cas `proven: false` avec `missing.reason: "no-proof"` | écart de (d), « quel que soit `realisation.status` […] `to-build` ou `configured` si elle n'en a aucune » ; bloquant : « une règle citée sans aucune preuve qui la nomme (aux cas déclarés : `proofs` vide […]) ». L'ancien `T3` la refusait ; la deuxième version de ce ticket, écrite sur `partial`, la laissait passer |
| règle à `exception: not-applicable`, un cas déclaré sans preuve | `realisation.status: "not-applicable"`, le cas `proven: false`, `no-proof` | écart de (d), pour la même phrase |
| quatre cas déclarés, criticité `medium`, des preuves | `realisation.status: "partial"`, `cases: { declared: 4, proven: 2 }`, `criticality: { level: "medium", origin: "declared", … }` ; le cas `nominal`, étiqueté sur un `describe` seul, a pour preuve le test contenu (`case: "nominal"`, `title` : le titre du test tel qu'il est écrit) et sort `proven: true` ; le refus, prouvé par un test unitaire, sort `proven: false`, `missing: { reason: "level-too-low", levels: ["P1", "P2"] }` ; l'entrée invalide sans test, `no-proof` ; le cas nommé dans un fichier `cas/*.json` sort `proven: true`, preuve `unit` de niveau `P0`, sans qu'aucun test ne soit cherché | écart de (d) pour le refus et pour l'entrée invalide ; l'étiquette sur un `describe` vaut bien pour le test qu'il contient ; le fichier de cas est compté sans test : c'est (a) qui demande qu'un test le lise |

**Le script des mutations.** Chaque mutation est jouée seule sur le texte corrigé, puis le texte est remis ; elle est rouge si `node --test scripts/depot.test.mjs` échoue. Une phrase glissée entre deux passages exigés reste verte, hors les quatre formes de décompte dans la première branche (décision 18) : elle n'est pas dans la liste. Pour le rejouer : copier le bloc dans un fichier, puis `python3 <fichier> <racine de la copie>` ; il sort en 0 si toutes sont rouges.

````python
# Mutations du ticket 52. Usage : python3 mutations.py <racine d'une copie où le ticket est appliqué>
# Chaque mutation est jouée seule : le texte est changé, `node --test scripts/depot.test.mjs` est lancé, le texte est
# remis. Elle est « rouge » si au moins un test échoue. Un « ancien » écrit en clair se lit à plat (une espace y vaut
# toute suite de blancs et de sauts de ligne) ; R(...) est une expression régulière. Chacun doit se trouver une fois.
import pathlib, re, subprocess, sys

racine = pathlib.Path(sys.argv[1])
RT = "skills/chaine/revue-de-ticket"
CRIT, PROMPT = f"{RT}/references/criteres-ticket.md", f"{RT}/references/prompt-ticket.md"
SECTION, SKILL, CONTENU = f"{RT}/references/section-pr.md", f"{RT}/SKILL.md", f"{RT}/references/CONTENU.md"
SCRIPT, PLUGIN = f"{RT}/scripts/contexte-ticket.mjs", ".claude-plugin/plugin.json"
R = re.compile


def motif(ancien):
    return ancien if isinstance(ancien, re.Pattern) else R(r"\s+".join(re.escape(m) for m in ancien.split(" ")))


# (nom, fichier, ancien, nouveau)
M = [
    ("critères, tête : « quelle que soit la criticité de la règle » retiré", CRIT, "Deux branches, choisies règle par règle, quelle que soit la criticité de la règle.", "Deux branches, choisies règle par règle."),
    ("critères, tête : les branches choisies pour le projet entier", CRIT, "choisies règle par règle, quelle", "choisies pour le projet entier, quelle"),
    ("critères, tête : « à défaut de ligne, chaque règle que le ticket cite » retiré", CRIT, "(« Règles du ticket » du contexte ; à défaut de ligne, chaque règle que le ticket cite). Deux", "(« Règles du ticket » du contexte). Deux"),
    ("cas déclarés : la condition de l'index retirée", CRIT, "seulement si l'index commis du projet, anchorpost/anchorpost.json, porte \"schema\": \"3\" (le relecteur lit ce champ dans l'index, jamais dans ce que disent le ticket ou la PR) et si l'en-tête", "seulement si l'en-tête"),
    ("cas déclarés : l'index en \"2\" accepté", CRIT, "porte \"schema\": \"3\" (le relecteur", "porte \"schema\": \"2\" (le relecteur"),
    ("cas déclarés : le schéma lu dans ce que dit la PR", CRIT, "jamais dans ce que disent le ticket ou la PR)", "ou dans ce que dit la PR)"),
    ("cas déclarés : la condition de l'en-tête `cases` retirée", CRIT, " et si l'en-tête de la règle, rendu dans « Règles du ticket », déclare au moins un cas sous `cases`.", "."),
    ("cas déclarés : une clé `cases` vide suffit", CRIT, "déclare au moins un cas sous `cases`.", "porte `cases`."),
    ("cas déclarés : le relecteur recompte", CRIT, "Le relecteur ne recompte pas les cas, la CLI Anchorpost le fait :", "Le relecteur recompte les cas, comme la CLI Anchorpost :"),
    ("cas déclarés : ce que la CLI écrit sur un cas sans preuve retiré", CRIT, " : elle écrit `proven: false` sur chaque cas déclaré qui n'a pas sa preuve au niveau exigé.", "."),
    ("cas déclarés : un décompte glissé entre deux passages (chaque cas déclaré a sa preuve)", CRIT, "(par sa `key`) : (a)", "(par sa `key`) : chaque cas déclaré a sa preuve ; (a)"),
    ("cas déclarés : un décompte glissé en tête de phrase (Tous les cas déclarés sont couverts)", CRIT, "qu'il ne prouve pas est un écart. Branche « sans cas déclarés »", "qu'il ne prouve pas est un écart. Tous les cas déclarés sont couverts. Branche « sans cas déclarés »"),
    ("cas déclarés : « au moins un test » glissé entre deux passages", CRIT, "qu'il ne prouve pas est un écart. Branche « sans cas déclarés »", "qu'il ne prouve pas est un écart. La règle a au moins un test. Branche « sans cas déclarés »"),
    ("cas déclarés : l'étiquette de cas retirée", CRIT, " (`[RULE_ALL_FAC-3#montant-nul]` : l'identifiant de la règle, `#`, celui du cas ; portée par un `describe`, elle vaut pour les tests qu'il contient) et sur", " et sur"),
    ("cas déclarés : l'étiquette de cas portée par un `describe` retirée", CRIT, " ; portée par un `describe`, elle vaut pour les tests qu'il contient) et sur", ") et sur"),
    ("cas déclarés : les preuves rangées dans un fichier de cas sortent de la portée de (a) à (c)", CRIT, " et sur chaque preuve que l'entrée de la règle range dans un fichier de cas, puis", ", puis"),
    ("cas déclarés : « puis il lit ce que la machine a compté » retiré", CRIT, ", puis il lit ce que la machine a compté, (d), dans l'entrée de la règle sous `rules` de l'index de la branche relue (par sa `key`) :", " :"),
    ("cas déclarés : le compte lu dans la description de la PR", CRIT, "dans l'entrée de la règle sous `rules` de l'index de la branche relue (par sa `key`) :", "dans la description de la PR :"),
    ("(a) retiré", CRIT, R(r"\(a\) ce que le test affirme[\s\S]*?ne lit ce fichier : c'est un écart ;\s+\(b\)"), "(b)"),
    ("(a) : le relecteur lit le nom, pas l'assertion", CRIT, "le relecteur lit l'assertion, pas le nom ;", "le relecteur lit le nom, pas l'assertion ;"),
    ("(a) : le refus non affirmé n'est plus un écart", CRIT, " ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart ;", " ;"),
    ("(a) : le fichier de cas que rien ne lit n'est plus un écart", CRIT, " une preuve écrite dans un fichier de cas (`cas/*.json`, entrées `regle` et `cas`) n'affirme rien si aucun test du diff ou du dépôt ne lit ce fichier : c'est un écart ;", ""),
    ("(a) : un test du dépôt qui lit le fichier de cas ne suffit plus", CRIT, "aucun test du diff ou du dépôt ne lit ce fichier", "aucun test du diff ne lit ce fichier"),
    ("(b) retiré", CRIT, R(r"\(b\) le genre de test[\s\S]*?n'est pas un parcours\) est un écart ;\s+\(c\)"), "(c)"),
    ("(b) : le renvoi à `.claude/rules/tests.md` retiré", CRIT, ", selon les catégories de `.claude/rules/tests.md` :", " :"),
    ("(b) : le calcul pur retiré", CRIT, "un calcul pur se prouve par un test unitaire, et par un test de propriétés s'il porte un invariant chiffré ; une requête", "une requête"),
    ("(b) : l'invariant chiffré retiré", CRIT, ", et par un test de propriétés s'il porte un invariant chiffré ;", " ;"),
    ("(b) : la base réelle retirée", CRIT, " une requête, par un test sur base réelle, jamais sur une base simulée ;", ""),
    ("(b) : la base simulée admise", CRIT, ", jamais sur une base simulée ;", " ou simulée ;"),
    ("(b) : la frontière de l'API retirée", CRIT, " un refus ou une entrée invalide d'une règle moyenne ou haute (`criticality.level` de l'entrée vaut `medium` ou `high`), exigés à la frontière de l'API (niveau `P1`), par un test qui passe par la route ;", ""),
    ("(b) : la frontière de l'API exigée quelle que soit la criticité", CRIT, " d'une règle moyenne ou haute (`criticality.level` de l'entrée vaut `medium` ou `high`), exigés", ", exigés"),
    ("(b) : le champ `criticality.level` retiré", CRIT, " (`criticality.level` de l'entrée vaut `medium` ou `high`),", ","),
    ("(b) : le test qui passe par la route remplacé par un test unitaire", CRIT, "par un test qui passe par la route ;", "par un test unitaire ;"),
    ("(b) : le bout en bout retiré", CRIT, " le cas normal d'une règle haute (`high`), exigé de bout en bout (niveau `P2`), par un vrai parcours.", ""),
    ("(b) : « Le niveau exigé, la CLI le compte » retiré", CRIT, "Le niveau exigé, la CLI le compte ; le niveau", "Le niveau"),
    ("(b) : le niveau deviné au chemin, plus lu dans `proofs[].level`", CRIT, "le niveau qu'elle donne à un test se lit dans `proofs[].level` de l'entrée :", "le niveau d'un test se devine à son chemin :"),
    ("(b) : un niveau que le test n'a pas n'est plus un écart", CRIT, " : un test qui porte un niveau qu'il n'a pas (un `P1` qui ne passe pas par la route, un `P2` qui n'est pas un parcours) est un écart ;", " ;"),
    ("(b) : « étage » revient", CRIT, "un test qui porte un niveau qu'il n'a pas (un", "un test au mauvais étage (un"),
    ("(c) retiré", CRIT, R(r"\(c\) un cas dit technique[\s\S]*?validation de la MOA ;\s+\(d\)"), "(d)"),
    ("(c) : un cas dit technique qui est une décision du métier n'est plus un écart", CRIT, "c'est un écart : il échappe à la validation de la MOA ;", "ce n'est pas un écart ;"),
    ("(c) : « il échappe à la validation de la MOA » retiré", CRIT, "c'est un écart : il échappe à la validation de la MOA ;", "c'est un écart ;"),
    ("(c) : les cas que le diff ajoute ou modifie ne sont plus regardés", CRIT, ", ou que le diff ajoute ou modifie dans le fichier de la règle, est", " est"),
    ("(c) : les exemples de l'équipe retirés", CRIT, " (une saisie vide, un doublon, deux actions simultanées) ;", " ;"),
    ("(d) retiré", CRIT, R(r" ;\s+\(d\) ce que la CLI a compté[\s\S]*?et son entrée\."), "."),
    ("(d) : un cas `proven: false` n'est plus un écart", CRIT, "porte `proven: false` est un écart, quel que soit", "porte `proven: false` n'est pas un écart, quel que soit"),
    ("(d) : `to-build` n'est plus un écart (seule une règle `partial` l'est)", CRIT, "quel que soit `realisation.status` (`partial` si elle a des preuves, `to-build` ou `configured` si elle n'en a aucune : `proofs` est alors vide) ;", "si `realisation.status` vaut `partial` ;"),
    ("(d) : `to-build` et `configured` retirés de la parenthèse", CRIT, ", `to-build` ou `configured` si elle n'en a aucune : `proofs` est alors vide)", ")"),
    ("(d) : « une de ces règles » redevient « une règle que le ticket réalise »", CRIT, "une de ces règles dont un cas de `cases`", "une règle que le ticket réalise dont un cas de `cases`"),
    ("(d) : `level-too-low` retiré", CRIT, ", ou `level-too-low`, ses preuves sont d'un niveau trop bas.", "."),
    ("(d) : le relecteur refait le compte", CRIT, "Le relecteur ne refait pas le compte : il lit celui de l'index.", "Le relecteur refait le compte."),
    ("(d) : l'exception sans ses cinq conditions", CRIT, R(r"L'écart ne tombe que pour un cas qu'un autre ticket\s+porte, aux cinq conditions réunies :[\s\S]*?par le diff relu\."), "L'écart tombe si le ticket nomme le ticket qui porte ce cas."),
    ("(d) : la condition « trouvé dans Identifiants cités » retirée", CRIT, "il est « trouvé » dans « Identifiants cités » du contexte, sans « (archivé) », et n'est pas le ticket relu ;", "il n'est pas le ticket relu ;"),
    ("(d) : un ticket archivé suffit", CRIT, ", sans « (archivé) », et n'est pas", " et n'est pas"),
    ("(d) : la condition « il est ouvert » retirée", CRIT, " il est ouvert, son `Status:` n'est ni `Fait` ni `wontfix` ;", ""),
    ("(d) : un ticket `wontfix` suffit", CRIT, "n'est ni `Fait` ni `wontfix` ;", "n'est pas `Fait` ;"),
    ("(d) : un ticket `Fait` suffit", CRIT, "n'est ni `Fait` ni `wontfix` ;", "n'est pas `wontfix` ;"),
    ("(d) : la condition « n'est pas le ticket relu » retirée", CRIT, ", sans « (archivé) », et n'est pas le ticket relu ;", ", sans « (archivé) » ;"),
    ("(d) : la condition « sa ligne `Règles:` cite la règle » retirée", CRIT, " sa ligne `Règles:` cite la règle ;", ""),
    ("(d) : la condition « la mention n'est pas ajoutée par le diff relu » retirée", CRIT, " cite la règle ; ni la mention ni cette ligne `Règles:` ne sont ajoutées par le diff relu.", " cite la règle."),
    ("(d) : la ligne `Règles:` du ticket nommé peut être ajoutée par le diff relu", CRIT, "ni la mention ni cette ligne `Règles:` ne sont ajoutées par le diff relu.", "la mention n'est pas ajoutée par le diff relu."),
    ("(d) : « cinq conditions réunies » devient « l'une de ces conditions »", CRIT, "aux cinq conditions réunies :", "à l'une de ces conditions :"),
    ("(d) : le cas laissé à un autre ticket n'est plus rendu", CRIT, " Le relecteur rend alors « cas <règle>#<id> porté par <ticket> », pour la section de PR.", ""),
    ("(d) : l'index non régénéré n'est plus un écart de T5", CRIT, "Un index que le diff n'a pas régénéré est un écart de T5, pour le seul index que (d) lit : il se régénère, et l'axe Ticket seul se rejoue. Ses signes", "Un index peut ne pas avoir été régénéré. Ses signes"),
    ("(d) : « il se régénère, et l'axe Ticket seul se rejoue » retiré", CRIT, " : il se régénère, et l'axe Ticket seul se rejoue.", "."),
    ("(d) : toute la revue se rejoue, plus l'axe Ticket seul", CRIT, "et l'axe Ticket seul se rejoue. Ses", "et la revue se rejoue. Ses"),
    ("(d) : l'écart de T5 n'est plus borné à l'index que (d) lit", CRIT, ", pour le seul index que (d) lit :", " :"),
    ("(d) : le signe de la règle absente de `rules` retiré", CRIT, " une de ces règles absente de `rules` ;", ""),
    ("(d) : le signe du titre absent des `proofs` retiré", CRIT, " un test étiqueté du diff dont le titre manque aux `proofs` de la règle ;", ""),
    ("(d) : le signe du titre redevient celui du fichier", CRIT, "dont le titre manque aux `proofs`", "dont le fichier manque aux `proofs`"),
    ("(d) : le signe des `id` de cas retiré", CRIT, R(r" ; des\s+`id` de cas qui diffèrent entre l'en-tête de la règle et son entrée\."), "."),
    ("cas déclarés : le cas de bord de l'énoncé que `cases` ne porte pas n'est plus un écart", CRIT, R(r"\s+Un cas de bord que l'énoncé de la règle dit[\s\S]*?est dû dans le diff\."), ""),
    ("cas déclarés : « qu'une famille soit dite sans objet n'y change rien » retiré", CRIT, ", et qu'une famille soit dite sans objet n'y change rien :", " :"),
    ("cas déclarés : le test du cas de bord de l'énoncé n'est plus dû", CRIT, " ; son test, étiqueté de la règle sans nom de cas, est dû dans le diff.", "."),
    ("cas déclarés : la session écrit elle-même le cas de bord manquant", CRIT, "le cas se dit, la session ne l'écrit pas elle-même ;", "la session l'écrit elle-même ;"),
    ("cas déclarés : la phrase gardée de l'ancien T3 retirée", CRIT, " Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart. Branche", " Branche"),
    ("sans cas déclarés : la branche retirée", CRIT, R(r"\n    Branche « sans cas déclarés »[\s\S]*?prouve pas est un écart\.(?=\nT4)"), ""),
    ("sans cas déclarés : réduite aux projets sans index", CRIT, "toute autre règle : index absent ou d'un autre schéma, ou en-tête sans aucun cas sous `cases`.", "un projet sans index."),
    ("sans cas déclarés : une clé `cases` vide n'y mène plus", CRIT, "ou en-tête sans aucun cas sous `cases`.", "ou en-tête sans `cases`."),
    ("sans cas déclarés : « au moins un test » retiré", CRIT, "La règle a au moins un test qui porte son identifiant entre crochets en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ; les cas de bord", "Les cas de bord"),
    ("sans cas déclarés : les cas de bord retirés", CRIT, " ; les cas de bord que la règle énonce (limite, zéro, dépassement, chevauchement, passage à minuit, montant nul ou négatif, doublon) ont chacun un cas ;", " ;"),
    ("sans cas déclarés : l'étiquette qui ne prouve pas n'est plus un écart", CRIT, R(r" ; un test qui porte un identifiant\s+de règle qu'il ne prouve pas est un écart\.(?=\nT4)"), "."),
    ("les deux branches fondues en une", CRIT, "Branche « sans cas déclarés » — toute autre règle", "Pour toute autre règle"),
    ("critères, introduction : la lecture de l'index retirée", CRIT, ", et lit dans l'index commis du projet, `anchorpost/anchorpost.json`, s'il existe, le champ `schema` et l'entrée `rules` de chaque règle du ticket.", "."),
    ("critères, introduction : l'entrée `rules` des règles du ticket retirée", CRIT, ", le champ `schema` et l'entrée `rules` de chaque règle du ticket.", ", le champ `schema`."),
    ("qui joue T3 : le paragraphe retiré", CRIT, R(r"\n\n\*\*Qui joue `T3`\.\*\*[^\n]*"), ""),
    ("qui joue T3 : l'axe Ticket ne garde que les règles basses", CRIT, "l'axe Ticket garde ce contrôle pour toutes les criticités", "l'axe Ticket garde ce contrôle pour les règles basses"),
    ("qui joue T3 : la ligne de la section de PR retirée du paragraphe", CRIT, ", et la section de PR le dit en une ligne : « Contrôle des preuves joué par la revue de ticket, faute de relecteur indépendant ».", "."),
    ("qui joue T3 : « ce contrôle revient à un relecteur indépendant » retiré", CRIT, "Pour une PR qui touche une règle moyenne ou haute, ce contrôle revient à un relecteur indépendant de l'auteur, que le plugin ne pose pas encore. Tant qu'il n'est pas posé, l'axe", "L'axe"),
    ("qui joue T3 : la phrase passée dans le bloc que reçoit le sous-agent", CRIT, "prouve pas est un écart.\nT4", "prouve pas est un écart. Pour une règle moyenne ou haute, ce contrôle revient au relecteur indépendant.\nT4"),
    ("T5 : « index régénérés » retiré du critère auquel (d) renvoie", CRIT, "(specs nommées présentes, index régénérés, specs de garde complétées)", "(specs nommées présentes, specs de garde complétées)"),
    ("prompt, droits : « Rien d'autre. » retiré", PROMPT, " Rien d'autre. Tu ne modifies rien", " Tu ne modifies rien"),
    ("prompt, droits : l'index n'est plus lisible", PROMPT, " dans l'index anchorpost/anchorpost.json, le champ `schema` et l'entrée `rules` de chaque règle du ticket ;", ""),
    ("prompt, droits : l'entrée `rules` des règles du ticket n'est plus lisible", PROMPT, "le champ `schema` et l'entrée `rules` de chaque règle du ticket ;", "le champ `schema` ;"),
    ("prompt, droits : l'index entier lisible", PROMPT, "le champ `schema` et l'entrée `rules` de chaque règle du ticket ;", "tout ce qu'il porte ;"),
    ("prompt, droits : l'en-tête du ticket nommé n'est plus lisible", PROMPT, " ; l'en-tête du ticket que le ticket relu nomme pour porter un cas (critère T3, (d)). Rien", ". Rien"),
    ("prompt, droits : le ticket nommé lisible en entier", PROMPT, "l'en-tête du ticket que le ticket relu nomme", "le ticket que le ticket relu nomme"),
    ("prompt, droits : le code qu'un test du diff exerce n'est plus lisible", PROMPT, " le code qu'un test du diff exerce, quand le diff ne le touche pas ;", ""),
    ("prompt, droits : le fichier de cas hors du diff n'est plus lisible", PROMPT, " un fichier `cas/*.json` hors du diff qu'une preuve cite ;", ""),
    ("prompt : la mission sans les écarts nouveaux", PROMPT, " une preuve de cas qui n'affirme pas ce que le titre du cas promet, un test qui porte un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier, un cas déclaré que l'index dit non prouvé, un cas de bord de l'énoncé qu'aucun cas déclaré ne porte,", ""),
    ("prompt : la mission sans le cas déclaré que l'index dit non prouvé", PROMPT, " un cas déclaré que l'index dit non prouvé,", ""),
    ("prompt : la mission sans le cas de bord de l'énoncé", PROMPT, " un cas de bord de l'énoncé qu'aucun cas déclaré ne porte,", ""),
    ("prompt : l'étiquette de cas retirée", PROMPT, "Il prouve un cas attendu de la règle quand l'étiquette nomme ce cas après un `#` (`[RULE_ALL_LIC-3#seconde-licence]`), sur le test ou sur un `describe` qui le contient : les cas d'une règle sont la clé `cases` de son en-tête, dans « Règles du ticket ». Tu", "Tu"),
    ("prompt : l'étiquette de cas sur un `describe` retirée", PROMPT, ", sur le test ou sur un `describe` qui le contient :", " :"),
    ("prompt : « Tu recomptes »", PROMPT, "Tu ne recomptes pas les cas", "Tu recomptes les cas"),
    ("prompt : « tu lis dans l'index ce qu'elle a compté » retiré", PROMPT, ", et tu lis dans l'index ce qu'elle a compté (critère", " (critère"),
    ("prompt : « quelle que soit la criticité de la règle » retiré", PROMPT, "T3), quelle que soit la criticité de la règle.", "T3)."),
    ("prompt : l'index en \"2\"", PROMPT, "porte \"schema\": \"3\" : la CLI", "porte \"schema\": \"2\" : la CLI"),
    ("prompt, gravité : la règle citée sans aucune preuve n'est plus bloquante", PROMPT, " dans les deux branches de T3, une règle citée sans aucune preuve qui la nomme (aux cas déclarés : `proofs` vide dans son entrée de l'index) ;", ""),
    ("prompt, gravité : la règle sans aucune preuve n'est bloquante que sans cas déclarés", PROMPT, "dans les deux branches de T3, une règle citée sans aucune preuve qui la nomme (aux cas déclarés : `proofs` vide dans son entrée de l'index) ;", "une règle sans cas déclarés citée sans aucune preuve qui la nomme ;"),
    ("prompt, gravité : les bloquants de la branche « cas déclarés » retirés", PROMPT, " pour une règle aux cas déclarés, une preuve de cas qui n'affirme pas ce que le titre du cas promet, un fichier de cas que rien ne lit, un test qui porte un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier, un cas `proven: false` que ce ticket porte (un test du diff l'étiquette, ou la table « Surfaces » l'annonce) ;", ""),
    ("prompt, gravité : le cas `proven: false` que ce ticket porte n'est plus bloquant", PROMPT, ", un cas `proven: false` que ce ticket porte (un test du diff l'étiquette, ou la table « Surfaces » l'annonce) ;", " ;"),
    ("prompt, gravité : le cas qu'un test du diff étiquette n'est plus « porté par ce ticket »", PROMPT, "(un test du diff l'étiquette, ou la table « Surfaces » l'annonce)", "(la table « Surfaces » l'annonce)"),
    ("prompt, gravité : l'index non régénéré n'est plus bloquant", PROMPT, " ; un index que le diff n'a pas régénéré (T5) ;", " ;"),
    ("prompt, gravité : le fichier de cas que rien ne lit retiré", PROMPT, " un fichier de cas que rien ne lit,", ""),
    ("prompt, gravité : le niveau qu'un test n'a pas retiré", PROMPT, " un test qui porte un niveau qu'il n'a pas, un cas dit technique qui est une décision du métier, un cas `proven", " un cas dit technique qui est une décision du métier, un cas `proven"),
    ("prompt, gravité : tout autre cas `proven: false` retiré", PROMPT, " tout autre cas `proven: false`,", ""),
    ("prompt, gravité : le cas de bord de l'énoncé retiré", PROMPT, " un cas de bord que l'énoncé dit et qu'aucun cas déclaré ne porte,", ""),
    ("prompt, gravité : le test manquant du cas de bord de l'énoncé retiré", PROMPT, " le test de ce cas de bord s'il manque au diff,", ""),
    ("prompt, gravité : le cas de bord sans test de la seconde branche retiré", PROMPT, " un cas de bord qu'une règle sans cas déclarés énonce, sans cas de test ;", ""),
    ("prompt, gravité : le genre de test retiré", PROMPT, ", un genre de test qui ne convient pas au code sans que son niveau en dépende ;", " ;"),
    ("prompt, format : la ligne du cas laissé à un autre ticket retirée", PROMPT, R(r"\n- puis une ligne par cas non prouvé[^\n]*\n[^\n]*"), ""),
    ("section de PR : la ligne « Contrôle des preuves » retirée", SECTION, R(r"\n- Contrôle des preuves[^\n]*"), ""),
    ("section de PR : « faute de relecteur indépendant » retiré", SECTION, ", faute de relecteur indépendant", ""),
    ("section de PR : « toutes criticités » retiré", SECTION, " (critère `T3`, toutes criticités)", " (critère `T3`)"),
    ("section de PR : la ligne « Cas laissés à un autre ticket » retirée", SECTION, R(r"\n- Cas laissés à un autre ticket[^\n]*"), ""),
    ("SKILL, étape 4 : le point 4 retiré", SKILL, R(r"\n4\. Deux constats de `T3`[^\n]*\n5\. "), "\n4. "),
    ("SKILL, étape 4 : la session change le `scope`", SKILL, "Elle ne change ni le `scope` ni le titre d'un cas", "Elle change le `scope` du cas"),
    ("SKILL, étape 4 : la session écrit elle-même le cas manquant", SKILL, ", et n'en écrit aucun sous `cases` : cela seul attend le skill `criticite`.", "."),
    ("SKILL, étape 4 : le test du cas de bord ne se livre plus dans la PR", SKILL, " Le test du cas de bord, étiqueté de la règle sans nom de cas, se livre dans la PR.", ""),
    ("SKILL, étape 4 : le test du cas de bord attend lui aussi le skill de criticité", SKILL, "se livre dans la PR.", "attend lui aussi le skill `criticite`."),
    ("SKILL, étape 4 : le conducteur n'est plus prévenu", SKILL, " et la session le dit au conducteur du chantier (sans chantier, au produit) ;", " ;"),
    ("SKILL, étape 4 : le cas dit technique jugé métier ne garde plus la PR en brouillon", SKILL, " ; le premier, bloquant, garde la PR en brouillon.", "."),
    ("SKILL, étape 4 : le point 5 retiré", SKILL, R(r"\n5\. Si le relecteur de l'axe Ticket voit[^\n]*"), ""),
    ("SKILL, étape 4 : le rejeu de l'axe Ticket compte parmi les deux tours", SKILL, "Ce n'est aucun des deux tours.", "Ce tour compte parmi les deux."),
    ("SKILL, étape 4 : toute la revue se rejoue, plus l'axe Ticket seul", SKILL, "puis l'axe Ticket seul se rejoue.", "puis la revue se rejoue."),
    ("SKILL, étape 1 : le gate des index générés avant tout sous-agent retiré", SKILL, R(r" \*\*Les index générés d'abord\*\*[^\n]*?de l'étape 4\."), ""),
    ("SKILL, étape 1 : le gate des index joué après les sous-agents", SKILL, "avant tout sous-agent, jouer le gate", "après les sous-agents, jouer le gate"),
    ("SKILL, étape 1 : un index périmé consomme un tour", SKILL, "et ce n'est aucun des deux tours de l'étape 4.", "et c'est l'un des deux tours de l'étape 4."),
    ("SKILL, étape 1 : un index périmé n'arrête plus la revue", SKILL, "Un index périmé arrête la revue ici : il", "Un index périmé se signale : il"),
    ("SKILL, étape 5 : la ligne « Contrôle des preuves » retirée", SKILL, R(r" Sa ligne « Contrôle des preuves » dit qui a joué `T3` :[^\n]*?« Qui joue `T3` »\)\."), ""),
    ("SKILL, étape 5 : « pour toutes les criticités » retiré", SKILL, "la revue de ticket, pour toutes les criticités, tant que", "la revue de ticket, tant que"),
    ("SKILL, étape 5 : la ligne « Cas laissés à un autre ticket » retirée", SKILL, " Sa ligne « Cas laissés à un autre ticket » reprend chaque « cas … porté par … » que l'axe Ticket a rendu, ou « aucun ».", ""),
    ("CONTENU : « doit trouver prouvées » rétabli", CONTENU, "liste fermée des règles dont `T3` relit les preuves", "liste fermée des règles que `T3` doit trouver prouvées"),
    ("CONTENU : « ne recompte pas » retiré", CONTENU, "le relecteur ne recompte pas les cas, la CLI Anchorpost le fait, et il vérifie", "le relecteur vérifie"),
    ("CONTENU : ce que la CLI a compté retiré", CONTENU, R(r" — puis il lit dans l'index ce qu'elle a compté :[^\n]*?et son test reste dû ; sinon"), " ; sinon"),
    ("CONTENU : « qu'elle ait des preuves ou non » retiré", CONTENU, " est un écart, qu'elle ait des preuves ou non, sauf", " est un écart, sauf"),
    ("CONTENU : les cinq conditions de l'exception retirées", CONTENU, ", à cinq conditions que l'auteur ne remplit pas seul ;", " ;"),
    ("CONTENU : le ticket qui porte le cas n'a plus à être ouvert", CONTENU, " ticket, encore ouvert, porte,", " ticket porte,"),
    ("CONTENU : le test du cas de bord de l'énoncé n'est plus dû", CONTENU, " est un écart aussi, et son test reste dû ;", " est un écart aussi ;"),
    ("CONTENU : le cas de bord de l'énoncé retiré", CONTENU, " un cas de bord que l'énoncé dit et qu'aucun cas déclaré ne porte est un écart aussi, et son test reste dû ;", ""),
    ("CONTENU : l'ancien contrôle de la seconde branche retiré", CONTENU, " ; sinon, l'ancien contrôle reste — un test étiqueté par règle, un cas par cas de bord énoncé)", ")"),
    ("CONTENU : la lecture de l'index par l'axe Ticket retirée", CONTENU, ", et lit lui-même, dans l'index du projet, le champ `schema` et l'entrée `rules` de chaque règle du ticket, jamais ce qu'en disent le ticket ou la PR ; ce qu'il peut lire est une liste fermée, écrite dans son prompt ;", " ;"),
    ("CONTENU : « ce qu'il peut lire est une liste fermée » retiré", CONTENU, " ; ce qu'il peut lire est une liste fermée, écrite dans son prompt ;", " ;"),
    ("CONTENU : le passage de main retiré", CONTENU, R(r" Sa ligne « Contrôle des preuves » dit qui a joué `T3`\.[^\n]*lui passent la main\."), ""),
    ("CONTENU : « pour toutes les criticités » retiré", CONTENU, "l'axe Ticket le garde pour toutes les criticités, et", "l'axe Ticket le garde, et"),
    ("CONTENU : la ligne « Cas laissés à un autre ticket » retirée", CONTENU, " Sa ligne « Cas laissés à un autre ticket » garde visible chaque cas non prouvé que `T3` (d) laisse à un autre ticket.", ""),
    ("script : le commentaire dit de nouveau « doit trouver prouvée »", SCRIPT, "la liste fermée des règles dont l'axe * Ticket (`T3`) relit les preuves, puis", "la liste fermée que l'axe * Ticket (`T3`) doit trouver prouvée, puis"),
    ("version : le plugin revient à 7.14.0", PLUGIN, "\"version\": \"7.15.0\"", "\"version\": \"7.14.0\""),
]

rouges, vertes = 0, []
for i, (nom, fichier, ancien, nouveau) in enumerate(M, 1):
    f = racine / fichier
    origine = f.read_text(encoding="utf8")
    m = motif(ancien)
    trouves = len(m.findall(origine))
    assert trouves == 1, f"mutation {i} ({nom}) : « ancien » trouvé {trouves} fois"
    f.write_text(m.sub(lambda _: nouveau, origine, count=1), encoding="utf8")
    try:
        r = subprocess.run(["node", "--test", "scripts/depot.test.mjs"], cwd=racine, capture_output=True, text=True)
    finally:
        f.write_text(origine, encoding="utf8")
    echecs = re.findall(r"^not ok \d+ - (.*)$", r.stdout, re.M)
    if r.returncode != 0 and echecs:
        rouges += 1
        print(f"{i}. ROUGE  {nom}")
    else:
        vertes.append(nom)
        print(f"{i}. VERTE  {nom}")
print(f"\n{rouges} mutations rouges sur {len(M)}")
sys.exit(1 if vertes else 0)
````

Pour la session :

1. Le § 0 : les cinq rouges qu'il annonce. Les §§ 1 et 2, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 6** (738 si `main` est à `fa30c30`).
2. `git diff origin/main --stat` ne montre que les huit fichiers de « Fichiers chauds » ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0 ; `git diff origin/main -- skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs | grep '^[-+]' | grep -v '^[-+][-+]' | grep -vc '^[-+] \*'` rend 0 (seules des lignes de commentaire changent) ; `git diff origin/main --stat -- skills/chaine/revue-de-ticket/references/criteres-documentation.md skills/chaine/revue-de-ticket/references/prompt-documentation.md` ne rend rien (`D8` intact) ; `wc -l skills/chaine/revue-de-ticket/SKILL.md` : 70.
3. Revue de ticket (ses trois axes), sa section dans le corps de la PR, avec les deux lignes que ce ticket ajoute.
4. La PR vise `main`, hors brouillon, **sans `à-fusionner`** (`Label: contre-revue`) ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Le jugement du sous-agent** : le banc tient le texte, pas ce qu'un relecteur en fait. L'essai sur les règles jouets est une lecture du texte par son rédacteur. La première revue de ticket jouée sur une règle aux cas déclarés dira si (a) à (d) rendent des constats justes, et combien de faux ; (c) est le plus exposé : « métier ou technique » est un jugement.
- **Une règle qu'aucun ticket ne cite n'est vue par aucune revue de ticket.** (d) ne lit que les règles de la ligne `Règles:` du ticket relu : il rend à `T3` la force de l'ancien critère, pas plus. Le reste est le travail d'`anchorpost compare` et du mode `enforce`.
- **La CLI 2.0.0 publiée n'a pas été lue.** Les noms viennent du schéma et du code de `sujet/preuve-suffisante-cas` à `126f885`, et de son exécution sur un dépôt jouet. L'index commis d'Anchorpost, sur cette branche, ne porte encore aucune règle à cas (`cases: []` partout, à la lecture de `65a832d`). Si un nom change à la publication, `T3`, le prompt et le banc se corrigent avec la ligne `K5`.
- **Un index périmé sans l'un des trois signes** (un test retiré, un titre de cas réécrit) ne se voit pas à la lecture ; c'est le gate de l'étape 1 qui l'arrête. Un projet qui n'a pas de gate pour un index généré n'a que les trois signes.
- **Le cas de bord de l'énoncé** est un jugement sur un texte libre, comme dans l'ancien `T3` : deux relecteurs peuvent ne pas lire le même énoncé de la même façon.
- **« Porté par ce ticket »** s'entend de deux signes, l'étiquette d'un test du diff et la table « Surfaces » ; un cas que le ticket décrit en prose, sans l'un ni l'autre, tombe en « à corriger ».
- **Les fichiers de cas** : le critère demande qu'un test du diff ou du dépôt lise le fichier ; il ne dit pas comment ce test doit s'en servir.
- **La portée d'un cas n'est relue qu'à la première preuve.** Une règle est classée par une PR de documentation, qui n'a pas de revue de ticket (limite déjà écrite au ticket 49) ; (c) ne voit un cas `technical` que le jour où un test du diff l'étiquette, ou quand le diff le touche.
- **Le banc** : toute phrase glissée entre deux passages exigés passe, même contraire, hors les quatre formes de décompte dans la première branche (décision 18).

## Hors périmètre

- **Le relecteur indépendant** d'une PR qui touche une règle moyenne ou haute (`P-6`, chantier 3 du programme) : ni sa forme, ni qui le lance, ni la lecture par une personne nommée pour une règle haute. Ce ticket écrit la phrase qui lui passera la main, rien de lui.
- **L'amendement du § 8 de `SPEC_ALL_ANC-5`**, côté Anchorpost (« Le besoin »).
- **Les autres lignes de la part de `skills`** dans la carte du chantier de la preuve suffisante : la copie de la spec dans `docs/issues/standard-documentation/` (`K1`) ; la grille par criticité dans le gabarit de `.claude/rules/tests.md`, le relais `preuves.mjs` et son entrée dans les gates rapides (`K2`) ; le gate des tickets, la ligne `Prouve:` et le tableau `## Surfaces` qui nomme la preuve de chaque cas attendu (`K3`) ; le skill `anchorpost` qui suit la CLI 2.0.0 et sa fiche sur l'écriture d'un cas et d'une étiquette de cas (`K5`) ; la mutation des règles (`K6`).
- **Les trois résumés gardés tels quels** (décision 17).
- **La repose dans un projet** : rien n'est à reposer (« Les limites, relevées »). La copie du commentaire de `contexte-ticket.mjs` suivra à la prochaine repose de la chaîne.

## Comments

- 2026-11-17 — Rédigé sur `fa30c30` (plugin 7.14.0, 732 tests) d'après `P-38`, les décisions de l'architecte du même jour, la ligne `K4` de la carte du chantier, `SPEC_ALL_ANC-5` (§ 1, § 2, § 4, § 8, `A-25`) et `RULE_ALL_ANC-26` à `-28`. Première version (`b5e8456`) : 737 tests, 72 mutations rouges. Elle laissait à trancher neuf choix du rédacteur, et écrivait qu'entre le pivot 3 et le refus, personne ne refuserait un cas sans preuve.
- 2026-11-17 — **Arbitrages de l'architecte** (deuxième version, `4d3d240` : 737 tests, 94 mutations rouges). Acceptés tels quels : la branche choisie règle par règle ; le relecteur lit lui-même le champ `schema` ; l'invariant chiffré prouvé par un test de propriétés ; (c) limité aux cas `technical` que le diff étiquette ou touche ; la phrase de passage de main hors du bloc, sans nommer « chantier 3 » ; la ligne de la section sans condition ; le titre « Règles citées et leurs preuves » ; les trois résumés laissés ; la version mineure ; `Label: contre-revue` et le commentaire du script gardé. Refusé : le trou ; le relecteur lit ce que la CLI a compté, (d). Deux précisions : l'étiquette de cas sur un `describe`, le fichier de cas que rien ne lit.
- 2026-11-17 — **Relecture à neuf, corrections décidées par l'architecte** (troisième version, `a1167ab` : 738 tests, 137 mutations rouges). La mécanique de la deuxième version était exacte, mais (d) n'était pas « au moins aussi fort que l'ancien », par trois chemins. (B1) (d) jugeait le statut `partial`, qu'une règle sans aucune preuve n'a pas : il juge maintenant le cas `proven: false`, quel que soit le statut, et une règle citée sans aucune preuve est bloquante dans les deux branches (décisions 7 et 12). (B2) Un cas de bord que l'énoncé dit et que `cases` ne porte pas reste un écart (décision 10). (B3) L'exception de (d) demande quatre conditions que l'auteur ne remplit pas seul, et le cas laissé reste visible dans la section de PR (décision 8). Puis : les gravités de (d) (décision 12) ; les deux signes d'un index non régénéré, `T5` bloquant, (d) rejoué (décision 9) ; (b) lisible en contexte vierge, par `criticality.level` et `proofs[].level`, sans « étage » (décision 5) ; les droits de lecture en liste fermée (décision 13) ; le motif `DECOMPTE` sans égard à la casse et élargi, le banc qui tient `T5`, le commentaire du script et la version (décision 18) ; les faits redressés dans « Le besoin » (l'ordre du calcul de `realisation.status`, la famille sans réponse qui n'est pas un statut, les règles validées à `c1f375d`, le § 8 de la spec dépassé) ; la ligne d'en-tête `Réalise:` retirée, aucun ticket voisin ne l'ayant ; les mutations données avec leurs remplacements. Rejoué : voir « Vérification ».
- 2026-11-18 — **Vérification de l'architecte, sept retouches décidées** (cette version) : les trois bloquants de la relecture à neuf sont fermés et les comptes de la troisième version sont vrais. (1) L'exception de (d) a une cinquième condition, le ticket nommé est ouvert et n'est pas archivé, et la ligne `Règles:` de ce ticket n'est pas ajoutée par le diff relu (décision 8). (2) Le test du cas de bord de l'énoncé reste dû ; seule l'écriture du cas sous `cases` attend le skill de criticité (décision 10). (3) Le chapeau dit la portée de (a) à (c), preuves rangées dans un fichier de cas comprises (décision 4). (4) Une famille dite sans objet ne change rien au cas de bord de l'énoncé (décision 10). (5) L'index à jour est un préalable, vérifié à l'étape 1 du skill avant tout sous-agent ; le rejeu est celui de l'axe Ticket seul, et n'est aucun des deux tours (décision 9). (6) (d) dit « une de ces règles », et une règle absente de `rules` est le troisième signe d'un index non régénéré (décisions 7 et 9). (7) Le plancher de version du banc suit la règle de repli (décision 19). `Status:` passe à `ready-for-agent`. Rejoué : voir « Vérification ».
