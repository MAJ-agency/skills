# La clé relecture dans le contrat du socle, la relecture posée avec lui, l'ADR de la relecture indépendante, la version 8.0.0, et l'essai réel de la vérification d'ensemble (lot 6c, bascule 8.0.0)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le code et le texte entiers sont dans le patch commun aux tickets 80, 81 et 82 ([`80-82-annexes/lot-6.patch`](80-82-annexes/lot-6.patch), sha256 `1ceca4a337704551b77ef241668c3549bc02a3819a161cd095cdf5f5ff850818`, `git apply` sur `97d17e3`), décrits fichier par fichier ci-dessous ; les gestes de la PR sont ceux du ticket 80, « À faire, dans l'ordre ». L'essai réel (« Après la fusion ») n'est pas un geste de la session du ticket : l'architecte le joue. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-relecture-independante.md` (neuf), `ADR_ALL_ARC-N-chaine-de-production.md` et `ADR_ALL_ARC-N-codeowners.md`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json.mjs`, `settings-json-regles.mjs` et `settings-json.test.mjs` ; et, communs aux trois tickets, `scripts/bascule.test.mjs`, `scripts/depot.test.mjs`, `README.md` (« quatre ADR »), `.claude-plugin/plugin.json` (8.0.0), `NOTES-DE-VERSION.md`. Aucun de ces fichiers n'est un script des tickets de suite 75 à 79.

## Le besoin

Ce ticket réalise la partie **6c** de la spec (section « Les lots », point 6) : ce qui rend le régime 8 **posable** (`A-100`) — la clé `relecture` dans le gabarit `chaine.json`, la pose du skill `relecture` par le socle, la phrase des clés de son `CONTENU.md` recomptée (`A-108`), l'ADR « relecture indépendante et accord des fichiers sensibles » (`A-96`), la version 8.0.0 — et l'essai réel de la « Vérification d'ensemble ». Il porte aussi `create_session` non pré-approuvé (`A-182` point 3) : le socle ne pose aucune liste `permissions.allow`, mais il la vérifie (gate `settings-json`) ; la règle entre là.

Après la fusion, rien ne change pour un dépôt déjà posé : il reste en régime 7 tant que sa repose n'a pas posé la clé (lot 7). Un dépôt posé avec 8.0.0 est en régime 8 dès sa première PR ouverte après `depuis` (la PR de pose elle-même, dont la base n'a pas la clé, finit en régime 7).

## Où

| Fichier | Ce qui change (le patch fait foi) |
| --- | --- |
| `…/references/chaine.json` | La clé `relecture` : `depuis` (`{{DEPUIS}}`), `delai` 120, `ordinaire` `{ opus, medium }`, `sensible` `{ opus, xhigh }` (`P-64`, `A-128`) ; le `$comment` la décrit (qui la lit, et où). |
| `…/socle-chaine-de-production/SKILL.md` | La description (« sa relecture indépendante », « quatre ADR ») ; les placeholders `{{DEPUIS}}` et `{{ADR_RELECTURE}}` ; question 1 : un chemin sensible est relu en régime sensible et ne s'écrit qu'avec l'accord ; étape 2.1 : l'« Étape 0 — poser » de `relecture`, lue dans son fichier (le skill porte `disable-model-invocation`, comme `fusionner`) ; étape 2.2 : `{{DEPUIS}}` par `date -u +%Y-%m-%dT%H:%M:%SZ`, le Relecteur à lancer, un dépôt déjà posé reçoit la clé par sa repose ; 4 bis : le gate refuse `create_session` pré-approuvé avec la clé ; étape 8 : quatre ADR ; étape 3 : le Relecteur à dire ; étape 4 : le commit des ADR. |
| `…/references/CONTENU.md` | « **Huit clés**, et rien d'autre », la relecture indépendante décrite dans la phrase ; « Une **neuvième**, facultative » (`preparerCapitaine`) ; le gate `settings-json` et `create_session` ; « **Quatre gabarits** » d'ADR, puis « Un cinquième » (l'ADR retirée). |
| `…/adr/ADR_ALL_ARC-N-relecture-independante.md` (neuf) | La décision en sept points (toute PR relue, le Relecteur, la session de relecture, le capitaine qui ne relit rien, le plafond, l'accord des fichiers sensibles, le régime lu sur la base et la date), ce qu'elle ne ferme pas, les alternatives écartées, les conséquences. Remplace l'ADR « CODEOWNERS », amende les points 1, 4 et 5 de l'ADR de la chaîne. Le plafond tel qu'`A-89` le distribue (l'architecte pour une fille ou le conducteur, le produit pour l'architecte ; sans programme, le conducteur pour une cause technique) ; les trois gardes nommées (le hook d'édition, `sujet.sh fusionner`, `passer.sh`). |
| `…/adr/ADR_ALL_ARC-N-chaine-de-production.md`, `…/adr/ADR_ALL_ARC-N-codeowners.md` | La section « Amendements de la relecture indépendante » ; la ligne « Remplacée par ». |
| `…/scripts/verify/settings-json-regles.mjs`, `settings-json.mjs`, `settings-json.test.mjs` | `preApprouveCreateSession` (l'outil exact `mcp__<serveur>__create_session`, le serveur `mcp__claude-code-remote` entier ou son joker) ; `ecartsSettings(…, { relecture })` le refuse quand le contrat porte la clé, avec sa ligne ; le gate lit la clé dans `.claude/chaine.json` (illisible et la nommant : présente, du côté sûr) ; deux tests neufs. Une clé `relecture` à `null` compte comme présente (du côté sûr), un banc le tient. |
| `README.md` | « quatre ADR » (deux lignes). |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.0.0 ; la note : ce qui change, puis ce qu'un projet fait pour en profiter (la repose, par son architecte). Dans la note : « comme dans la version précédente » (pas un numéro), le capitaine qui n'archive plus, en régime 7 aussi, et les documents du régime 8 qui ne se reposent qu'avec la clé, jamais seuls (`A-196` point 4). |
| `scripts/bascule.test.mjs` | « le gabarit du contrat porte la clé relecture… » : la forme exacte, lue par `lireCleRelecture` (le capitaine), `{{DEPUIS}}` oublié lu illisible, les valeurs par défaut de `relecteur.mjs`, la phrase des clés recomptée, chaque placeholder déclaré, la pose de `relecture`. |
| `scripts/depot.test.mjs` | Le passage de `CONTENU.md` sur l'ADR retirée (« Un cinquième ») ; l'ADR neuve parmi les fichiers qui nomment CODEOWNERS. |

## Décisions

1. **La clé du gabarit porte ses quatre champs**, valeurs par défaut de `P-64` et `A-128` (les mêmes que `DEFAUTS` de `relecteur.mjs`, un banc les tient égales) : un projet les change dans son contrat sans rien recoder.
2. **`depuis` est un placeholder, `{{DEPUIS}}`**, rempli à la pose par `date -u +%Y-%m-%dT%H:%M:%SZ`. Oublié, il se lit « illisible » (`lireCleRelecture`) : aucune PR n'est relue ni fusionnée, du côté sûr, et l'étape 3 du socle (« aucun placeholder restant ») le voit.
3. **`relecture` se pose par son étape 0, lue dans son fichier** : le skill porte `disable-model-invocation: true`, et le banc « aucun SKILL.md ne demande la commande d'un skill marqué » refuse `/maj-skills:relecture` dans un autre skill. La spec dit « `relecture poser` » : c'est le même geste, écrit comme pour `fusionner`.
4. **`create_session` pré-approuvé n'est refusé qu'avec la clé** (régime 8) : en régime 7, aucune session de relecture n'est créée avec un effort, et refuser la ligne d'un projet qui n'a pas encore sa repose ferait rougir son `pnpm check` pour rien. La PR de repose retire l'entrée en même temps qu'elle pose la clé (`architecte` § 8, point 3) : le gate y oblige. Trois formes refusées : `mcp__<serveur>__create_session`, `mcp__claude-code-remote`, `mcp__claude-code-remote__*`.
5. **Quatre ADR posées, une retirée** : la nouvelle ADR est la quatrième que le socle pose (le banc des ADR compte les gabarits, hors l'ADR retirée) ; `{{ADR_RELECTURE}}` est son identifiant dans tous les fichiers posés (la méthode, le fragment, l'ADR de la chaîne).
6. **La version 8.0.0** : le premier nombre, puisqu'un dépôt posé avec cette version est en régime 8. `note-et-version.mjs` la pose sur le `main` qu'on trouve (ticket 80, § 2).

## Questions à l'architecte

Pour la PR entière (tickets 80 à 82). Les huit du rédacteur, chacune avec sa recommandation, ont été **tranchées par `A-195`** sur ces recommandations ; le patch les suit. Les cinq du tour de relecture des tickets ont été **tranchées par `A-196`** : les PR du conducteur demandent leur relecture avec `Conducteur: —` (point 1) ; le réveil de secours ne prend `fusion-bloquée` que sans `à-relire` (point 2) ; le cas 12 de l'essai, le régime 7 sous 8.0.0, se joue le jour de la fusion, en premier (point 3) ; les documents du régime 8 ne se reposent qu'avec la clé, la note le dit (point 4) ; une session de relecture interrompue voit son verdict écrit par l'architecte (point 5, cas 2 de l'essai).

1. **Où vit `regime-7.md`** (ticket 81, décision 1). La spec dit « une référence `regime-7.md` qu'ils citent », sans dossier. Écrit : un seul fichier, `skills/chaine/chantier/references/regime-7.md`, cité par lien relatif. Autre choix : un fichier par skill. **Recommandation : un seul** ; quatre fichiers se contrediraient, et le nettoyage n'en retire qu'un.
2. **`depuis` d'une repose** (`architecte` § 8, point 3). `A-99` veut la PR de repose « ouverte avant `depuis` », alors que c'est elle qui écrit `depuis`. Écrit : l'instant du commit qui pose la clé, le dernier de la PR, écrit après son ouverture. Une PR ouverte entre ce commit et la fusion passe en régime 8 quand sa base reçoit `develop` ; son auteur, qui a suivi le régime 7, voit sa PR renvoyée « faute de verdict » puis redistribuée par le Relecteur (règle 3). **Recommandation : ainsi** ; l'autre voie, un `depuis` posé à l'avance dans le futur, ferait relire en 7 des PR ouvertes après la fusion.
3. **`create_session` refusé seulement en régime 8** (décision 4). **Recommandation : ainsi.**
4. **Le capitaine n'archive aucune session** (ticket 81, décision 5). `P-62` ne parle que du conducteur ; le capitaine tourne dans le même mode « Auto », sans humain, et la garde lui refuserait l'outil de même. Écrit : il nomme à son lanceur une session finie sans tag. **Recommandation : ainsi** ; sinon, le dire par une sonde (un capitaine qui appelle `archive_session` sur une session jetable).
5. **Le conducteur qui pose `à-relire`** sur une PR sans aucune des quatre étiquettes dont la fille est finie ou muette (ticket 81, décision 4). `A-86` dit seulement qu'il « regarde » ces PR ; la spec écrit la limite (« n'est vue que par le conducteur »). Écrit : il l'écrit à la fille, puis, sans réponse possible, pose lui-même `à-relire` avec `Session: —`, comme l'architecte pour une PR écrite par un outil (`A-91`). **Recommandation : ainsi** ; sinon la PR reste sans relecture jusqu'à un humain.
6. **Sans programme, `à archiver` va au produit**, qui archive depuis l'application. **Recommandation : ainsi** ; personne d'autre n'a l'outil.
7. **L'essai réel après la fusion** (« Après la fusion », ci-dessous). `A-100` le faisait jouer par l'architecte avant l'ordre de fusion, et `P-64` voulait son essai de défauts connus « avant la bascule ». Une session de relecture et un Relecteur réels lisent leurs skills dans le marketplace : ce que la PR change ne se joue en vrai qu'une fois publié. Et 8.0.0 ne change rien chez un projet tant que sa repose n'a pas posé la clé (`A-97`) : la bascule effective est la repose. **Recommandation : l'essai après la fusion, avant toute repose (lot 7)** ; un défaut trouvé donne un ticket, et le lot 7 attend sa fusion.
8. **Une session pour les trois parties.** `A-100` prévoyait une session par partie, en relais sur la même PR. Le patch étant entier, et `P-65` (`A-149`) mettant dans une même PR les tickets qui touchent les mêmes fichiers, une session Sonnet joue les trois. **Recommandation : une session**, deux tours de contre-relecture sur la PR.

### Points de la spec rendus caducs par des décisions plus récentes (suivies dans le patch)

- `A-87` « le conducteur pour ses filles » (qui archive) : remplacé par `P-62` et `A-185` point 8 ; le conducteur nomme, l'architecte archive.
- `A-87` « la clé `relecture.modele` » : remplacée par `relecture.ordinaire` et `relecture.sensible` (`A-128`, `P-64`).
- `A-100`, le relais d'une session par partie et la contre-relecture de chaque partie : remplacés par `P-65` et `A-149` (question 8) ; l'essai réel avant l'ordre : question 7.
- `A-73` et le § 0 de `chantier` (« poser un socle est du cadrage ») : en régime 8, un socle posé sur un dépôt à chaîne est un ticket ; seul le premier socle d'un dépôt sans la chaîne reste sans ticket.
- « `socle/SKILL.md` (`relecture poser`) » de la liste du lot 6c : `relecture` ne s'invoque pas d'un autre skill (décision 3).
- La phrase « Une huitième, facultative » de `CONTENU.md` (`A-108`) : recomptée, « neuvième ».

## À faire, dans l'ordre

Comme le ticket 80, § 0 à § 3 : une seule PR, un seul patch, la version 8.0.0.

## Après la fusion : l'essai réel de la « Vérification d'ensemble »

**Ce que le produit fait d'abord** (des réglages qu'il est seul à faire, une question chacun, `architecte` § 7) : créer les deux dépôts privés sous l'organisation (ou dire à l'architecte qu'il peut les créer), y protéger `develop` avec « branche à jour exigée », donner aux sessions l'accès GitHub à ces dépôts, et approuver l'environnement cloud qui les atteint. Sans l'un d'eux, l'essai ne part pas : l'architecte le dit au produit et attend.

**L'ordre** (`A-196` point 3) : le cas 12 d'abord, le jour de la fusion (les projets vivants lisent déjà les skills de 8.0.0 en régime 7) ; puis les autres. Le verdict écrit par l'architecte à la place d'une session interrompue (cas 2) est `A-196` point 5.

**Qui** : l'architecte du programme (`A-100`), après la fusion de la PR dans `main` et avant toute repose (lot 7). Il lance les sessions de l'essai par `create_session` (prompts de `architecte/references/lancement.md`), lit chaque résultat à la source (`get_session`, `pull_request_read`, `git ls-remote`) et l'écrit au journal de la carte. **Où** : jamais dans ce dépôt ni dans un projet vivant. (1) Un **dépôt jouet** privé, `essai-relecture-8` sous l'organisation, posé avec les vrais outils : `/maj-skills:socle-monorepo` puis `socle-chaine-de-production` de la version 8.0.0 (la clé `relecture` posée, `depuis` à l'instant de la pose), `develop` protégée avec « branche à jour exigée », les neuf étiquettes créées (`labels.sh`), une règle métier haute avec un champ `code:`. (2) Pour ce qui demande de vraies sessions sur un vrai projet, une **copie d'un dépôt réel** (Anchorpost, poussée dans un dépôt privé neuf, `essai-relecture-anchorpost`), reposée au régime 8 par le § 8 d'`architecte` (sa PR de repose comprise : elle se fusionne en régime 7). Sur chacun, un capitaine et un Relecteur lancés (`lancement.md`), un environnement cloud dont le réseau atteint GitHub. **Comment** : chaque cas a son geste, son attendu et sa preuve, notée par le lien du commentaire ou la ligne du journal du capitaine ; un attendu manqué arrête le cas, donne un ticket (défaut), et la ligne au journal.

| # | Geste | Attendu | Preuve |
| --- | --- | --- | --- |
| 1 | Une session de ticket (jouet) pousse une PR de code avec un bloquant planté (un test supprimé que le ticket exige), demande la relecture, ne lance aucun relecteur | `à-reprendre`, verdict `refusé` qui cite le bloquant ; puis, corrigée et redemandée, `à-fusionner` posée par le Relecteur, puis fusionnée | les deux verdicts, la distribution, `FUSIONNÉE` |
| 2 | Au cas 1, la session de relecture distribuée est interrompue (`interrupt_session`) avant son verdict ; l'architecte écrit à sa place, sur la PR, le verdict à la forme exacte (son identifiant, le tour, le sommet), et aucun message ne part au Relecteur | l'étiquette arrive quand même au passage suivant de la veille (25 minutes au plus) | l'heure de la pose, après celle du verdict |
| 3 | (a) Une PR dont le tour est distribué, sans verdict encore, étiquetée `à-fusionner` à la main, le Relecteur actif ; (b) la même, le Relecteur interrompu (`interrupt_session`) jusqu'au passage du capitaine | (a) le Relecteur retire `à-fusionner` et pose `à-relire` (règle 3, cause c, « posée sans relecture validée ») ; (b) le capitaine la renvoie, « corriger, puis poser `à-relire` » | (a) la ligne du Relecteur ; (b) le renvoi |
| 4 | Un push après un verdict validé, avant la fusion | `à-reprendre` (contenu changé) ; jamais fusionnée sur l'ancien verdict | le commentaire du Relecteur |
| 4 bis | Le même push, le Relecteur interrompu (`interrupt_session`) jusqu'au passage du capitaine | le capitaine la renvoie (aucun tour validé pour le contenu du sommet), jamais fusionnée | le renvoi |
| 5 | Une PR validée en retard sur `develop` (une autre PR fusionnée avant), sans conflit ; puis deux mises à jour de suite | le capitaine la met à jour et la fusionne sur son verdict, sans nouvelle relecture | aucune distribution neuve ; `FUSIONNÉE` |
| 6 | Un `refusé` écrit (session de relecture remplacée à la main) pendant que le capitaine attend la CI de sa mise à jour | renvoyée au second contrôle, jamais fusionnée | `RENVOI` au second contrôle |
| 7 | Une sous-PR qui touche un chemin sensible hors de sa ligne `Sensibles:` | refusée par le hook d'édition chez l'auteur ; écrite par une commande et poussée, renvoyée par `sujet.sh fusionner` | la sortie du hook ; le renvoi |
| 8 | Trois tours refusés de suite sur une PR | `Plafond — décision attendue`, aucune quatrième distribution avant une `Décision de plafond` | les commentaires |
| 9 | Une PR qui touche le code de la règle haute, une seule session validée, le commentaire du Relecteur disant « 1 » | pas de fusion avec un seul verdict ; une seconde session ajoutée (`(complète)`) | la distribution, le second verdict |
| 10 | Une PR de tickets (documentation seule) | l'axe « Tickets » joué et dit dans le verdict | le verdict |
| 11 | Le Relecteur archivé et relancé à neuf en plein tour | il reprend la file, ne redistribue pas un tour en cours valide | sa première passe |
| 12 | **Le régime 7 sous 8.0.0.** Sur la copie d'Anchorpost **avant sa repose** (ses documents de 7.x, aucune clé), un conducteur et des filles lancés avec le plugin 8.0.0 (`lancement.md`, ligne « Version : ») mènent un ticket `Label: contre-revue` et un ticket ordinaire jusqu'à la fusion | `demarrer` dit le régime 7 ; la fille du ticket ordinaire pose `à-fusionner`, celle du ticket `Label: contre-revue` livre sans ; le conducteur contre-relit et pose `à-fusionner` (`regime-7.md`) et ne pose jamais `à-relire` ; aucun accord de fichiers sensibles n'est demandé au produit ; le capitaine lit la section de revue | les deux fusions, en 7 ; la carte du chantier |
| 13 | Sur la copie d'Anchorpost : une PR ouverte avant la repose, finie après | jugée en 7 ; la suivante, sur le même sujet, jugée en 8 | les deux passages |
| 14 | Deux sous-PR validées d'un même sujet | entrent l'une après l'autre, sans que personne ne touche à leur étiquette | le journal du capitaine |
| 15 | Une sous-PR sautée pour une lecture illisible (un en-tête de règle cassé) | sautée sans renvoi, elle garde son sujet : l'autre sous-PR du sujet attend ; l'architecte prévenu par le Relecteur | `tenu par #n (sortie 7…)` ; la ligne `Lecture illisible` |
| 16 | Un `create_session` pré-approuvé dans `.claude/settings.json` du jouet | `pnpm check` rouge (`check:settings`) ; l'entrée retirée, vert | la sortie du gate |
| 17 | `P-64` : trois ou quatre défauts réels de ce programme, à la réponse connue (trois ou quatre parmi les bloquants de la PR 142, `A-162`, de la PR 144, `A-176`, et du tour de relecture du ticket 74, `A-190`, repris dans des PR du jouet), relus par une session de relecture sensible (Opus, effort extra) | chacun trouvé ; s'il en manque un, `relecture.sensible.modele` passe au modèle le plus fort, et le produit en est informé avec le chiffre | les verdicts, comparés aux rapports |
| 18 | Une fille conteste un bloquant (`Contesté — <critère, fichier et ligne> — <raison>`) ; son conducteur arbitre `écarté` | un tour `(après arbitrage, non compté)` aux mêmes sessions ; le constat écarté n'est pas relevé de nouveau | l'arbitrage, la distribution, le verdict |
| 19 | Réveil de secours : (a) les quatre étiquettes retirées à la main d'une PR en relecture ; (b) le Relecteur interrompu plus de trois heures sur une PR `à-relire` ; (c) une PR renvoyée (`fusion-bloquée`) dont la relecture est redemandée | (a) la fille repose `à-relire` ; (b) elle l'écrit au conducteur ; (c) elle ne redemande rien tant que `à-relire` est là | les étiquettes et l'heure ; la ligne au conducteur |
| 20 | Une PR de ticket qui touche un chemin sensible que sa ligne `Sensibles:` couvre | session de relecture sur `relecture.sensible` (`xhigh`), verdict avec `/security-review: lancée`, fusionnée | l'effort rapporté (`get_session`), le verdict, `FUSIONNÉE` |
| 21 | Une PR de sujet sans aucune des quatre étiquettes, sa fille archivée | le conducteur pose `À relire — … — Session: — — Conducteur: <la sienne>`, puis `à-relire` ; relue | le commentaire du conducteur, la distribution |
| 22 | Au cas 8, l'architecte écrit `Décision de plafond — …` | le compte repart : un quatrième tour se distribue | la décision, la distribution |
| 23 | La PR de cadrage d'un chantier neuf du jouet, puis la livraison de son sujet (`livrer-prets`) | la PR de cadrage demande sa relecture et n'entre que validée ; la livraison entre sans verdict (`P-60`) | les deux `FUSIONNÉE` |

Fin de l'essai : le relevé des coûts (`## Coût` de la carte du programme, rôles `relecture` et `relecteur`), les sessions de l'essai archivées (gardes des capitaines supprimées d'abord), les deux dépôts privés archivés sur GitHub par le produit (un réglage qu'il est seul à faire), et une ligne au journal : les cas passés, les tickets ouverts. Le lot 7 part quand chaque cas a passé, ou que son ticket est fusionné.

## Surfaces

| Surface | Prouvée par |
| --- | --- |
| La clé du gabarit, sa forme exacte, lue par le capitaine ; `{{DEPUIS}}` oublié illisible ; les défauts du Relecteur | `bascule.test.mjs`, « le gabarit du contrat porte la clé relecture… » |
| « Huit clés », « neuvième », la relecture décrite | idem |
| Chaque placeholder des gabarits déclaré dans le skill | idem |
| La relecture posée par son étape 0, lue dans son fichier | idem ; `depot.test.mjs`, « aucun SKILL.md ne demande la commande d'un skill marqué… » |
| `create_session` refusé en régime 8 seulement, trois formes, la ligne de l'écart, des voisines acceptées | `settings-json.test.mjs`, « régime 8 : une entrée allow qui pré-approuve create_session… » |
| Le gate lit la clé : absente, présente, nommée dans le `$comment` seulement, contrat illisible qui la nomme | `settings-json.test.mjs`, « le gate lit la clé relecture… » |
| Quatre ADR posées, comptées dans le skill, `CONTENU.md` et le `README.md` | `depot.test.mjs`, le banc des ADR du socle |
| L'ADR neuve peut nommer CODEOWNERS ; « Un cinquième » | `depot.test.mjs`, « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » |
| 8.0.0, la note en tête avec ses deux sections | `depot.test.mjs`, « la règle d'ascendance du plugin 7.16.0 : version, note… » |

## Vérification

1. à 2., 4. et 5. : ceux du ticket 80. Les mutations de ce ticket : B30 à B36, S1 à S6, R8, R9.
3. **La suite entière**, les quatre motifs de `pnpm test` (ticket 80, § 3), sur le patch posé sur `97d17e3` : **1 396 sur 1 396**, aucun sauté, 1 076 s (patch après le tour de relecture, clone neuf, charge 2,3 au départ : un autre rédacteur sur le poste) ; `main` en avait 1 384, le patch en ajoute 12 (`bascule.test.mjs` 9, `avancement.test.mjs` 1, `settings-json.test.mjs` 2). Sortie : [`80-82-annexes/suite.txt`](80-82-annexes/suite.txt). Sur un `main` plus récent : le total de `main` plus ces 12, aucun rouge.

## Ce qui n'a pas été établi

1. **Tout ce que l'essai réel joue** : les bancs jouent des scripts sur un faux GitHub et des textes ; aucune session réelle n'a suivi ces skills, en régime 8 comme en régime 7 sous 8.0.0 (cas 12, le jour de la fusion).
4. **Les réglages du produit** (les deux dépôts privés, `develop` protégée, l'accès GitHub, l'environnement) ne sont pas encore faits : l'essai attend ses réponses.
2. **`create_session` sans pré-approbation en mode « Auto »** : la session le dit dans `A-182` ; non rejoué ici.
3. **Le coût réel d'une session de relecture** (`P-64`) : mesuré par l'essai, cas 17.

## Hors périmètre

- La repose dans les projets (lot 7), `skills` lui-même (lot 8), le nettoyage (lot 9).
- `admin.md` : aucune case neuve (les étiquettes `à-relire` et `à-reprendre` y sont depuis le lot 4).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur la spec (lot 6, partie c ; `A-96`, `A-99`, `A-100`, `A-108`, `A-128`, `A-182` point 3, `P-64`) et sur `origin/main` à `97d17e3` (plugin 7.39.0). Points remontés à l'architecte : les huit « Questions à l'architecte ».
- 2026-11-22 — Repris par le relecteur des tickets après son tour (`A-196`) : l'essai réel (ce que le produit fait d'abord, l'ordre, les cas 2 et 3 jouables, le cas 4 bis, le cas 12 récrit, les cas 18 à 23), l'ADR (le plafond selon `A-89`, les trois gardes), la note, le banc `settings-json` (`relecture: null`) ; mutations R8, R9.
