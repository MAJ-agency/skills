# Le bilan de fin de chantier sort du plugin, et le gate `tickets` juge la forme de trois écritures nouvelles sans les exiger : la ligne `Sensibles:`, la ligne `Relecture: double`, le rôle `relecture` d'une ligne de coût ; il accepte `Règles: —`

Status: Fait — PR 141 (`860cd9c`, plugin 7.37.0)
Type: task
Label: contre-revue
Modèle: opus — les sessions tournent sur Opus jusqu'au 2026-11-22. Une obligation retirée du gate, deux lecteurs de ligne donnés entiers avec leur banc, `Règles: —` accepté, le lecteur d'un banc retouché, quarante et un blocs donnés mot pour mot (ancien, nouveau), une version et une note communes avec le ticket 57 ; tout est joué sur une copie jetable de `main` où la PR 138 est entrée, mutations comprises (voir « Vérification »). Rien à concevoir : qui veut changer une décision l'écrit à son lanceur. Ce ticket part dans une même PR que le ticket 57 : « Dans la même PR que le ticket 57 ».
Blocked by: 54
Dépendances: —
Fichiers chauds: `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs`, `skills/chaine/tickets/references/scripts/docs/couts.test.mjs`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/tickets/references/gabarits/ticket.issue.md`, `skills/chaine/tickets/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/chantier/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `README.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

**La décision du produit** (`P-57` de la carte « gouverner nos boucles », 2026-11-18, grilling du chantier 3, question `Q7`) : « Le bilan de fin de chantier est supprimé, sans rien à la place ». La question acceptée : « supprimer cette obligation, sans rien créer à la place » ; sa réponse : « oui ». Ses mots, avant : « quel est l'intérêt d'une session bilan et quel usage ferait-on du bilan ? revue adversariale sur cette idée », puis, au tableau de chiffres proposé en remplacement : « pas compris: à quel moment on fait ce tableau ? les relectures vont déjà déclencher des écrits sur la PR que le chantier va prendre en compte. » La carte en tire : « L'obligation `## Rétro` non vide pour passer une carte à `fini` sort du plugin. »

**Pourquoi** (revue de l'architecte sur sa propre idée, même ligne de la carte) : aucun bilan n'a produit d'amélioration dans ce programme, toutes sont venues d'incidents traités sur le moment ; un bilan arrive trop tard, coûte une grosse session, tourne à la généralité. D'où `A-95` de la spec du chantier 3 : un incident donne un ticket au moment où il arrive.

**L'autre moitié du ticket** prépare les lots suivants du chantier 3, sans rien en allumer. Trois écritures nouvelles vont apparaître dans les tickets et les cartes : la ligne `Sensibles:` d'un ticket (`A-74` : les chemins sensibles qu'il modifie, et qui a accordé, quand), la ligne `Relecture: double` d'un ticket (`A-82`), et le rôle `relecture` d'une ligne de `## Coût` (`A-87`). Le gate doit les connaître avant que rien ne les exige : une ligne mal écrite se corrige au découpage, pas le jour où une garde la lit. Une quatrième, `Règles: —`, dit qu'un ticket ne réalise aucune règle : le calcul « double relecture exigée » du lot 3c la lit ainsi et ne lit alors pas la spec du ticket (`A-117`) ; le gate doit l'accepter.

**Deux reports s'y ajoutent** : la retouche du lecteur d'un banc du ticket 54, reportée ici par `A-145` (« Code Owners » écrit avec plusieurs blancs ou à cheval sur deux lignes ne rougit pas le lecteur), et les deux constats de la revue de ticket de la PR 138 qui vont avec (aucune entrée piégée à fin de ligne CRLF, ni sur une dernière ligne sans fin de ligne).

**Le fait, sur `main` à `6087604` (plugin 7.32.0), la PR 138 (ticket 54) entrée** (branche `claude/ticket-54-codeowners-sort-du-plugin` à `7b2be5b`, plugin 7.33.0 ; les repères de ce ticket sont ceux de cet arbre) :

- Le gate refuse une carte `Phase: fini` sans section `## Rétro` non vide (`tickets-regles.mjs:581-584`), le skill `chantier` fait écrire cette section (`chantier/SKILL.md:113-115`), le gabarit de carte la porte (`carte.map.md:50-52`), la méthode en fait la septième étape du cycle (`chaine-de-production.md:29`, `:40`).
- **Le gate ne refuse aujourd'hui aucune des trois écritures nouvelles**, parce qu'il ne les lit pas : `controlerTicket` (`tickets-regles.mjs:479`) ne cherche que les lignes qu'il connaît, et une ligne `Sensibles: n'importe quoi` ou `Relecture: triple` passe ; `plafondsDeLaCarte` ne juge que `fille` et `conducteur` (`:359`), et `couts.mjs` lit le rôle comme un texte libre (`:60`, `:96`). « Accepter sans exiger » veut donc dire ici : **juger la forme quand la ligne est là**, et prouver par des tests que la ligne bien formée, comme son absence, passe.
- **Le gate refuse `Règles: —`** : `ecartsRegles` (`tickets-regles.mjs:435`) prend le tiret pour un identifiant mal formé et rend « Règles cite « — », qui n'est pas un identifiant de règle complet (`RULE_<CTX>_<TRI>-<n>`, `RULE_ALL_LIC-3`) ; rien d'autre sur la ligne » (vu sur cet arbre, par `controlerTicket` comme par `ecartsRegles`).
- **Le lecteur `DE_CODEOWNERS`** (`scripts/depot.test.mjs:1284`) lit `code[ _-]?owners?` ligne à ligne (`mentionsFautives`, `:1288-1297`) : « Code  Owners » (deux espaces), « Code Owners » avec une espace insécable, ou « Code » et « Owners » de part et d'autre d'une fin de ligne passent sans faute ; ses entrées piégées (`:1299-1313`) n'ont ni fin de ligne CRLF ni dernière ligne sans fin de ligne.

Quand le ticket est fait :

1. Une carte passe à `fini` sans section `## Rétro` ; une carte d'avant, qui garde la sienne, passe aussi.
2. Le skill `chantier`, la méthode, `pieges.md`, le `README.md` et le gabarit de carte ne demandent plus de bilan, et disent qu'un incident donne un ticket au moment où il arrive.
3. Une ligne `Sensibles:` mal formée, ou une ligne `Relecture:` qui ne vaut pas `double`, est refusée par le gate, le fichier et la ligne nommés ; bien formées ou absentes, le ticket passe.
4. Une ligne de coût de rôle `relecture` passe le gate sans être jugée au plafond, et compte au registre des coûts dans le total, pas dans la part des filles : un test le prouve, le code ne change pas.
5. Les gabarits de ticket et de carte montrent les trois écritures, et le gabarit de ticket `Règles: —`.
6. `Label: contre-revue` reste exigé, comme aujourd'hui.
7. `Règles: —`, seul, passe le gate ; mêlé à une règle, ou écrit d'un autre tiret, il est refusé.
8. Le lecteur des mentions de CODEOWNERS lit « Code Owners » écrit avec des blancs quelconques, et une mention coupée par une fin de ligne, LF ou CRLF ; ses entrées piégées portent des fins de ligne CRLF et une dernière ligne sans fin de ligne.

Rien d'autre du chantier 3 n'entre ici : ni garde, ni hook, ni skill.

## Où

Base : `origin/main` une fois la PR 138 (ticket 54) entrée. Rejoué le 2026-11-19 sur `6087604` (plugin 7.32.0) où la branche de la PR 138 est fusionnée, sommet `7b2be5b` (plugin 7.33.0, 1 080 tests selon la description de la PR 138, et le compte vu ici moins 25) : les numéros de ligne sont ceux de cet arbre. Depuis `4a45634`, où ce ticket a été écrit, `main` n'a touché ni le gate (`scripts/verify/`), ni `couts.mjs` et son banc, ni les deux gabarits ; il a déplacé `README.md` (l. 88 devenue 90) et le `CONTENU.md` du socle, et ajouté à `scripts/depot.test.mjs` les tests du ticket 54 et ceux de l'autre programme. Ce ticket part dans la même PR que le ticket 57 : « Dans la même PR que le ticket 57 » dit l'ordre.

| Fichier | Ce qu'il dit | Ce qu'il devient |
| --- | --- | --- |
| `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:581-584` (`controlerCarte`) | à `fini`, section `## Rétro` absente ou vide : erreur | G1 : les quatre lignes sortent |
| `tickets-regles.mjs:175`, `:430`, `:518` | `LABEL` ; `ecartsRegles` ; `controlerTicket` | G2, G4, G5 : deux motifs, deux fonctions exportées, leur appel sur chaque ligne de l'en-tête |
| `tickets-regles.mjs:431-436` (`ecartsRegles`) | `Règles: —` refusé comme identifiant mal formé | G9 : `—` seul, rien à vérifier |
| `tickets-regles.mjs:345` (commentaire de `plafondsDeLaCarte`) | « Tout autre rôle n'est pas jugé » | G3 : nomme `relecture` ; le code (`:356-359`) ne change pas |
| `skills/chaine/tickets/references/scripts/verify/tickets.mjs:17-19`, `:35`, `:38` (en-tête) | règle 4 : « `## Rétro` à `fini` » ; règle 10, `Règles:` ; onze règles | G6 à G8 : la règle 4 sans le bilan, les règles 12 et 13 ; G10 : la règle 10 nomme `—` |
| `…/scripts/verify/tickets.test.mjs:11`, `:67`, `:73`, `:171`, `:341`, `:416` | le test de la carte exige le refus sans `## Rétro` | B1 à B5, B11 |
| `…/scripts/verify/tickets-gate.test.mjs` (202 lignes) | — | B6 : un test ajouté |
| `…/scripts/docs/couts.test.mjs:67` | — | B7 : un test ajouté |
| `scripts/depot.test.mjs:194-201` | le test du gabarit de carte | B8 ; B9 ajoute deux tests à la fin du fichier |
| `scripts/depot.test.mjs:1284`, `:1295-1296`, `:1312-1313` | le lecteur `DE_CODEOWNERS`, `mentionsFautives`, ses entrées piégées | L1, L2 ; B10 : des entrées piégées |
| `skills/chaine/tickets/references/gabarits/carte.map.md:34-36`, `:48-52` | `## Coût` sans ses rôles ; la section `## Rétro` | M1, M2 |
| `…/gabarits/ticket.issue.md:5`, `:10` | `Règles: {{…}}` ; `Label: contre-revue # …` | M4 : `—` ; M3 : deux lignes après `Label:` |
| `skills/chaine/chantier/SKILL.md:3`, `:43`, `:110`, `:113-115` | « livraison par le capitaine et rétro » ; « (…, incidents, rétro) » ; « Phase 5 — livraison et rétro » ; « 2. Rétro dans la carte, section `## Rétro` : » et ses deux puces | R1 à R4 |
| `skills/chaine/chantier/references/CONTENU.md:7` | « `docs/agents/pieges.md` que la rétro alimente » | R5 |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:29-30`, `:35`, `:40` | le schéma du cycle finit par « ──► rétro » ; « (…, incidents, rétro) » ; « 7. **Rétro.** » | R6 à R8 |
| `…/references/docs-agents/pieges.md:3` | « La rétro d'un chantier (skill `chantier` § 7) ajoute ici une ligne… » | R9 |
| `…/references/CONTENU.md:37` | « `pieges.md` : la liste que la rétro de chaque chantier alimente » | R10 |
| `skills/chaine/tickets/references/CONTENU.md:29` | ce que le gate contrôle | R11 |
| `README.md:90` | « suivi sans attente active, rétro ; reprenable » | R12 |
| `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md:5` | la version de `main` ; la première note | V1, N1 : une version et une note, communes avec le ticket 57 |

### Gardé tel quel, après lecture

- **`skills/chaine/tickets/references/scripts/docs/couts.mjs`** (213 lignes) : rien n'y change. Le rôle d'une ligne de coût y est un texte libre (`:60`) ; `bilan` (`:95-96`) ne compte comme filles que le rôle `fille`, et le total prend toutes les lignes. Une ligne `relecture` y est donc déjà comptée comme il faut ; B7 le prouve.
- **Le code de `plafondsDeLaCarte`** (`tickets-regles.mjs:348-377`) : seuls `fille` et `conducteur` sont jugés (`:359`). `tickets.test.mjs:414-415` le prouve déjà pour `capitaine` et pour un rôle libre ; B4 y ajoute `relecture`, vert dès l'écriture.
- **`Label: contre-revue`** : `ecartsFormatPret` (`tickets-regles.mjs:404-428`) ne change pas ; ses tests (`tickets.test.mjs:152`, `tickets-gate.test.mjs:46`) restent verts sans retouche, et B5 prouve que `Sensibles:` ne le remplace pas.
- **`couts.test.mjs:15`**, la section `## Rétro` de la carte d'essai : une carte d'avant garde la sienne ; elle prouve que la lecture de `## Coût` s'arrête à la section suivante.
- **« venus des rétros d'Anchorpost »** (`skills/chaine/revue-de-ticket/references/CONTENU.md:9`, `skills/chaine/revue-adversariale/references/CONTENU.md:13`) : l'origine de sept critères, un fait passé.
- **`chaine-de-production.md:146`** (« Relevé des coûts ») : le relevé reste, et « le coût moyen par ticket, comparé d'un chantier à l'autre » se lit au registre, pas dans un bilan.
- **`chaine-de-production.md:59-68`** (§ 3, l'en-tête d'un ticket prêt) : il ne nomme pas encore les deux lignes ; voir « Hors périmètre ».
- **Les gabarits `programme.md`, `spec.spec.md`, `regle.md`, `demande.md`**, `tickets/SKILL.md`, `tickets/references/agents/issue-tracker.md`, `architecte/SKILL.md` : aucun ne nomme de rétro (`git grep -n -i 'rétro' -- skills scripts README.md`, sur l'arbre de la PR 138, ne rend que les fichiers de ce ticket et les deux `CONTENU.md` ci-dessus ; « retrouver » et « retrouve », qu'il rend aussi, ne sont pas le mot).
- **Les autres lecteurs de `Règles:`** : `revue-de-ticket` ignore déjà un tiret seul (`skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs:122-125`) ; `avancement-regles.mjs` (`:143-150`) et `criticite/scripts/contexte-regle.mjs` cherchent un identifiant nommé, que `—` n'est pas. Rien n'y change.
- **Le message d'une ligne `Règles:` vide** (« citer au moins une règle, ou retirer la ligne », `tickets-regles.mjs:440`) : un test le tient mot pour mot (`tickets.test.mjs:260`) ; il ne nomme pas `—`, que le gabarit montre (M4).
- **La CLI Anchorpost** ne tire d'une ligne `Règles:` que des identifiants de règle (`ruleIdsIn`, `apps/cli/src/read/tracking/headers.ts:52`, lu dans la copie locale d'un des trois projets) : `—` n'en donne aucun, rien n'y rougit.
- **`DISENT_LE_RETRAIT` et les quatre tests du ticket 54** (`scripts/depot.test.mjs:1245-1401`) : seuls le motif, `mentionsFautives` et les entrées piégées changent ; le parcours du dépôt (« CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré ») reste vert avec le lecteur élargi, vu sur cet arbre, ce ticket seul et avec le ticket 57.

### Repose dans un projet

Le gate et les gabarits sont des copies posées (`/maj-skills:tickets poser`) : un projet les reçoit à sa prochaine repose. Lu le 2026-11-18 sur `origin/develop` des trois projets du programme : aucun ticket ne porte de ligne `Sensibles:` ni `Relecture:` dans son en-tête, donc rien n'y rougira ; un ticket porte une ligne `- Relecture : …` dans son corps, sous `## Décisions`, que le gate ne lit pas (décision 4). Relu le 2026-11-19 sur la copie locale d'un des trois (`e323464`, pas `origin/develop`), sous les formes que lit maintenant le gate (`X:`, `**X:**`, `- X:`, `* X:`, toute casse) : aucun en-tête de ticket ne porte `Sensibles:`, `Relecture:` ni `Règles: —`. Les cartes déjà `fini` gardent leur section `## Rétro`, sans effet.

## Décisions

1. **Le bilan sort, rien ne le remplace** (`P-57`, `A-95`). Le gate n'exige plus de section `## Rétro` ; il ne la refuse pas non plus dans une carte d'avant. Ni colonne nouvelle au registre des coûts, ni section de remplacement.
2. **Un incident donne un ticket au moment où il arrive** (`A-95`) : un renvoi du capitaine ou une vague ratée donne, sur le moment, un ticket (un gate, un critère de la revue adversariale) ou, faute de gate, une ligne de `pieges.md`, qui reste la liste des pièges connus. Les textes le disent là où ils demandaient la rétro (R4, R8, R9).
3. **La ligne `Sensibles:`** a deux formes, et pas d'autre :
   - `Sensibles: —` : le ticket ne modifie aucun chemin sensible ;
   - `Sensibles: <chemin>, <chemin> — accord de <nom>, <AAAA-MM-JJ>` : des chemins ou des motifs séparés par des virgules, entre accents graves ou nus, puis ` — accord de ` (une espace, un tiret cadratin, une espace), le nom de qui a accordé, une virgule, le jour de l'accord.

   Un chemin est relatif à la racine du dépôt : sans blanc, sans `/` initial, sans segment `..`, sans accolade (un gabarit non rempli) ; `*` et `**` sont permis. Le nom est celui d'une personne : ni vide, ni un identifiant `session_…`, ni un gabarit (`<nom>`, `{{…}}`) ; il peut porter une virgule, la date est ce qui suit la dernière. La date est un jour qui existe. Des chemins sans accord sont refusés : la ligne ne se remplit qu'une fois l'accord donné (`A-75`). Un commentaire de gabarit (` # …`) peut suivre, comme sur `Type:`.
4. **Les deux lignes se lisent dans l'en-tête seul**, avant la première section `## ` (`tete`, `tickets-regles.mjs:29`), **chaque ligne**, et **sous toutes les formes que lit le calcul « double relecture exigée »** du lot 3c : `X:`, `**X:**`, `- X:`, `* X:`, sans égard à la casse de la clé. `A-113` veut que ce calcul reconnaisse `Relecture:` « par le motif que le gate `tickets` emploie déjà (gras, puce, casse) » ; sur la branche du ticket 60 (PR 134, `719f531`), `double-relecture.mjs:742` (`ligneDEnTete`) le fait, lit toutes les lignes `Relecture:` de l'en-tête et rend « illisible » toute valeur autre que `double`. Le gate prend le même motif, pour qu'une ligne que le calcul lira ne passe jamais le gate mal écrite. `Type:` et `Règles:` se lisent déjà ainsi, sans la puce étoile (`enTete`, `tickets-regles.mjs:14`) ; la version de ce ticket du 2026-11-18 les disait lues « à leur forme nue », ce qui était faux. La garde de commandes lit `Dépendances:` à sa seule forme nue (`skills/chaine/socle-chaine-de-production/references/agent/regles.mjs:148`) : une garde future qui lirait `Sensibles:` ainsi en lirait moins que le gate n'en juge, jamais plus. Un exemple cité dans le corps d'un ticket n'est pas la ligne. Elles sont jugées sur **tout ticket**, quel que soit son `Status:`, même gelé dans la dette : elles n'existaient pas avant, aucune dette n'est à geler.
5. **Jamais exigées, jamais recoupées.** Le gate ne demande ni `Sensibles:` ni `Relecture:`, ne compare pas `Sensibles:` à `Fichiers chauds:` ni à `cheminsSensibles` (`A-74` : « le gate vérifie la forme, pas que le chemin est déjà sensible »), et ne sait pas si l'accord a été donné.
6. **La ligne `Relecture:`** ne vaut que `double`, à la casse près ; toute autre valeur est refusée avec « sinon retirer la ligne ». Un commentaire de gabarit peut suivre.
7. **`Label: contre-revue` reste exigé comme aujourd'hui** quand `Fichiers chauds:` touche un chemin sensible ; `Sensibles:` ne le remplace pas. Il ne tombe qu'avec le régime de la relecture indépendante.
8. **Le rôle `relecture`** d'une ligne de `## Coût` : le gate ne le juge pas au plafond, le registre le compte dans le total et pas dans la part des filles. Aucun code ne change : le vocabulaire des rôles n'est pas fermé, et ne le devient pas.
9. **Les gabarits montrent les écritures nouvelles** : le ticket porte les deux lignes après `Label:`, chacune avec « retirer la ligne » et la mention qu'aucune garde ne la lit encore ; la carte nomme ses rôles sous `## Coût`, `relecture` compris, et perd `## Rétro`.
10. **Lecture en temps linéaire** : les deux lecteurs découpent la valeur par recherche de chaîne (`indexOf`, `lastIndexOf`, un motif de deux caractères), sans quantificateur imbriqué ; le banc lit trois valeurs hostiles de 300 000 caractères en moins de 2 s.
11. **Version : la suivante de `main` au moment de livrer**, mineure (deux gabarits changent, le gate lit deux lignes de plus, un comportement du capitaine change avec le ticket 57) ; **une seule pour les tickets 55 et 57**, et une seule note (`A-149`, `A-153`). Aucun numéro n'est écrit ici : d'autres PR du plugin prendront peut-être les numéros suivants avant celle-ci (V1, N1). **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, la recale dans `plugin.json` et dans le titre de la note commune, remonte cette note en tête de `NOTES-DE-VERSION.md`, puis vérifie (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`). `plugin.json` se fusionne sans conflit même quand les deux côtés ont pris le même numéro : c'est le piège, la valeur se relève à la main.
12. **`Label: contre-revue`** : la PR est commune avec le ticket 57, qui le porte (`boucle.sh` et `veille.sh` se posent sous `scripts/chaine/**`, chemin sensible du gabarit de `.claude/chaine.json`). Les fichiers de ce ticket seul ne se posent sous aucun chemin sensible (`scripts/agent/**`, `scripts/chaine/**`, `scripts/github/**`, `.husky/**`, `.github/workflows/**`, `.github/actions/**`, `scripts/docs/identifiants.mjs`, `.claude/**`) : le gate se pose sous `scripts/verify/`, `couts.test.mjs` sous `scripts/docs/`, les gabarits sous `docs/agents/gabarits/`, et `scripts/depot.test.mjs` ne se pose pas. PR vers `main`, hors brouillon, **sans `à-fusionner` ni commentaire `à-fusionner au sommet <sha>`** : l'architecte la fait relire (deux tours sur la PR, par un même agent neuf : `P-65`), pose l'ordre après, puis la fait entrer. Titre de la PR commune : `feat(chaine): une sous-PR à la fois par sujet tenue par le capitaine, le bilan de fin de chantier sort, le gate juge Sensibles et Relecture (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.
13. **`Blocked by: 54`** : les deux tickets écrivent `skills/chaine/chantier/SKILL.md`, le `CONTENU.md` du socle de la chaîne, `chaine-de-production.md`, `README.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. La session part de `origin/main` une fois la PR 138 entrée (`A-149`). Si le sommet de la PR 138 bouge encore avant d'entrer (retouches de relecture), « Si la PR 138 bouge encore » dit quoi refaire.
14. **`Règles: —` passe** (`A-117`) : seul sur la ligne, blancs autour admis, sous les formes d'en-tête que `enTete` lit déjà ; le ticket dit lui-même qu'il ne réalise aucune règle. Mêlé à un identifiant (`—, RULE_…`), répété (`— —`), entre accents graves, ou écrit d'un autre tiret (`-`, `–`), il reste refusé, avec le message d'aujourd'hui : le calcul du lot 3c lit aussi `-` et `–` comme « aucune » (`double-relecture.mjs`, `reglesCitees`, sur la branche du ticket 60), le gate n'en demande qu'une forme, celle du gabarit (M4), comme `Sensibles: —`, `Migrations: —` et `Fichiers chauds: —`. Pas de commentaire de gabarit sur cette ligne : le gate n'en accepte sur aucune valeur de `Règles:` aujourd'hui, et pour le calcul une ligne `Règles:` qui porte autre chose que des identifiants, leurs séparateurs ou `—` est « illisible » (`A-136`).
15. **Le lecteur des mentions de CODEOWNERS** (`A-145`, la retouche essayée par le relecteur du ticket 54, mot pour mot) : le motif devient `code[\s_-]*owners?` (des blancs quelconques, espace insécable et tabulation comprises, des tirets ou des tirets bas, en nombre quelconque) ; et, quand aucune ligne n'est fautive, le texte entier se relit blancs réduits, pour une mention coupée par une fin de ligne (« mention à cheval sur deux lignes »). Les deux constats de la revue de ticket de la PR 138 (critère `S19`) deviennent des entrées piégées : des fins de ligne CRLF, une dernière ligne sans fin de ligne, pour une mention comme pour un passage admis. Ces entrées sont vertes dès l'écriture sur le lecteur d'aujourd'hui (il découpe déjà par `/\r?\n/`) : elles tiennent ce qu'il fait, et les mutations du lecteur le montrent (« Vérification »). Rien d'autre du banc du ticket 54 ne change, ni `DISENT_LE_RETRAIT`, ni ses passages admis.
16. **Une PR avec le ticket 57** (`P-65`, `A-149`, `A-153`) : voir « Dans la même PR que le ticket 57 ». Ce ticket ne change rien de ce que le 57 écrit ; il lui prend sa note, qui devient la première partie de la note commune (N1).

### Remèdes écartés

- **Remplacer le bilan par une colonne « allers-retours de relecture » au registre des coûts** : la carte dit qu'elle « pourra s'ajouter » ; rien ne la demande, et il n'y a pas encore de relecture à compter.
- **Refuser une section `## Rétro` restée dans une carte** : les cartes finies des projets en ont une ; elles n'ont rien de faux.
- **Fermer le vocabulaire des rôles de `## Coût`** (`fille`, `conducteur`, `architecte`, `capitaine`, `relecture`) : des cartes existantes portent des rôles libres, que le gate laisse passer par décision (`tickets.test.mjs:414`).
- **Exiger `Sensibles:` dès qu'un chemin chaud est sensible**, ou comparer ses chemins à `cheminsSensibles` : c'est la garde des lots suivants, et `A-74` l'écarte pour le gate.
- **Accepter `Relecture: simple`** pour dire « une seule » : l'absence de ligne le dit déjà.
- **Lire les deux lignes dans tout le fichier**, comme `Label:` et `Modèle:` : un ticket qui cite la ligne en exemple (celui-ci le fait) serait refusé.
- **Lire les deux lignes à leur seule forme nue, et la première seulement** (la version du 2026-11-18) : le calcul du lot 3c lit `- Relecture: triple`, `**relecture:** x` et une seconde ligne `Relecture:` ; ces lignes passeraient le gate et rendraient le calcul « illisible » le jour où il les lit.
- **Accepter `Règles: -` et `Règles: –` comme le calcul** : trois graphies d'un même « aucune » ; le gate en fixe une, celle des autres lignes du ticket.
- **Changer le message d'une ligne `Règles:` vide pour qu'il nomme `—`** : un test le tient mot pour mot ; le gabarit montre `—`.
- **Lire tout le texte du banc blancs réduits, sans la lecture ligne à ligne** : une mention fautive ne serait plus nommée par sa ligne.
- **Une expression régulière pour toute la ligne `Sensibles:`** (`^(.+?)\s+—\s+accord de\s+(.+?),\s*(…)$`) : deux quantificateurs paresseux et des blancs répétés, au carré sur une valeur hostile.

## Dans la même PR que le ticket 57

`P-65` et `A-149` mettent les tickets 55 et 57 dans une PR, `A-153` le confirme : **une version, une note**, deux tours de relecture sur la PR. Le ticket 57 (`57-le-capitaine-ne-prend-qu-une-sous-pr-a-la-fois-par-sujet.issue.md`, `ready-for-agent`) garde ses décisions et ses blocs ; ce ticket ne change rien de ce qu'il écrit, sauf sa note, qui devient la première partie de la note commune (N1).

**Fichiers communs**, quatre ; aucune ligne n'est écrite par les deux tickets (repères de l'arbre de la PR 138) :

| Fichier | Ticket 57 | Ticket 55 |
| --- | --- | --- |
| `skills/chaine/chantier/SKILL.md` | l. 95, la fin du point 5 du § 6 (sa Décision 10 c) | l. 3, 43, 110, 113 à 115 (R1 à R4) |
| `scripts/depot.test.mjs` | l. 1136 à 1146, le test « la règle d'ascendance du plugin 7.16.0… » (titre, dernière ligne), et un test ajouté après lui (son annexe E) | l. 194 à 201 (B8), l. 1284 (L1), l. 1295 (L2), l. 1312 (B10), la fin du fichier (B9) |
| `.claude-plugin/plugin.json` | sa Décision 12 | V1 |
| `NOTES-DE-VERSION.md` | sa Décision 12 | N1 |

Les autres fichiers sont à un seul des deux : ceux de « Fichiers chauds » ici, ceux de sa ligne `Fichiers chauds:` pour le 57 (`boucle.sh`, `veille.sh` et leurs bancs, `une-sous-pr-a-la-fois.test.mjs`, nouveau, `fusionner/SKILL.md`, `fusionner/references/CONTENU.md`, le gabarit d'ADR des branches de sujet). En tout, 25 fichiers.

**Ordre d'application.**

1. Partir d'`origin/main` à jour, la PR 138 entrée ; relever sa version.
2. **Le ticket 57**, ses étapes 1 à 5 telles qu'il les écrit (son contrôle de la Décision 13, banc vu rouge, code, banc vert, textes de sa Décision 10), **sauf sa version et sa note** : à leur place, V1 et N1 de ce ticket, une seule fois. `node --test scripts/depot.test.mjs` : vert. Puis ses mutations (son étape 6). Sa « Vérification » 4 et sa Décision 10 (`1 1`, 128 lignes pour `chantier/SKILL.md`) se lisent sur ce diff-là, avant ce ticket, comme il le dit.
3. **Ce ticket**, §§ 0 à 4 (le § 5 est fait) : le banc d'abord, vu rouge (125 tests, 10 rouges), puis les blocs, puis ses mutations.
4. **Une seule fois pour les deux** : la suite entière (étape 7 du 57, point 3 de la « Vérification » ici) ; reprendre `main` avant de livrer et recaler la version et la note (étape 8 du 57, décision 11 ici) ; la livraison (décision 12).

L'ordre inverse (ce ticket d'abord) donne le même arbre, vu à l'octet ; l'ordre ci-dessus est celui que le 57 écrit, et garde ses contrôles sur son seul diff.

**Une version, une note.** La version est la suivante de `main` au moment de livrer, aucun numéro n'est écrit dans aucun des deux tickets ; elle s'écrit une fois dans `plugin.json` et une fois dans le titre de la note. La note est N1 : celle du ticket 57, mot pour mot, puis deux paragraphes et deux points de ce ticket. La Décision 12 du 57 ne s'écrit pas en plus. Le test de l'annexe E du 57 exige deux de ses phrases, B9 deux de celles-ci, n'importe où dans `NOTES-DE-VERSION.md` : aucun ne lit de numéro.

**Ce que la session vérifie sur le diff commun** (`git diff origin/main`, une fois les deux tickets appliqués) :

- 25 fichiers : les 17 de ce ticket (« Fichiers chauds ») et les 12 du ticket 57, moins les quatre communs ; un seul nouveau, `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs`.
- `git diff origin/main --numstat` : `5 7` pour `skills/chaine/chantier/SKILL.md` (126 lignes) ; `1 1` pour `.claude-plugin/plugin.json`, qui ne change que `"version"` ; `NOTES-DE-VERSION.md` n'ajoute qu'une note, en tête, dont le titre commence par la version de `plugin.json`.
- La ligne 95 de `chantier/SKILL.md` est celle du ticket 57 (sa Décision 10 c, sur l'arbre de la PR 138) : ni « chemin possédé », ni « puis le repose sur la suivante » ; et le fichier ne nomme plus de rétro.
- Les cinq empreintes du ticket 57 (« Si le ticket 54 est entré avant ») : ce ticket ne touche aucun de ces cinq fichiers.
- `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` : 2.
- La suite entière, verte, le compte d'`origin/main` plus 25.

## Si la PR 138 bouge encore

Ce ticket a été joué sur la branche de la PR 138 à `7b2be5b`. Si des retouches de relecture la font bouger avant qu'elle entre, la session, partie d'`origin/main` où elle est entrée, ne refait rien de plus que ceci :

1. `git diff 7b2be5b origin/main -- skills/chaine/chantier/SKILL.md skills/chaine/chantier/references/CONTENU.md skills/chaine/socle-chaine-de-production/references/CONTENU.md skills/chaine/socle-chaine-de-production/references/docs-agents README.md scripts/depot.test.mjs skills/chaine/tickets` : les fichiers de ce ticket que la PR 138 ou une autre PR peuvent avoir touchés (si `7b2be5b` n'est plus sur `origin`, `git fetch origin pull/138/head` le ramène). Vide : rien à refaire.
2. Sinon, retrouver chaque « Ancien » et chaque borne, une fois dans son fichier. Les plus exposés sont **L1, L2 et B10**, dans le banc même du ticket 54 : si ses retouches ont déjà porté le motif `code[\s_-]*owners?` ou la lecture du texte entier, le bloc qui l'écrit est déjà fait quand le texte est celui du « Nouveau », mot pour mot ; s'il est autre, ou qu'une borne ne se trouve plus, ou se trouve deux fois, la session s'arrête et l'écrit à son lanceur, avec le texte trouvé. Elle ne recolle rien à la main.
3. Rejouer le compte du § 0 (un test de plus ou de moins dans `scripts/depot.test.mjs` change le total, pas les dix rouges) et celui de la suite (la base de `main` plus 25).
4. La version : la suivante de `main`, quelle que soit celle que la PR 138 a prise (décision 11).

## À faire, dans l'ordre

Chaque « Ancien » se retrouve par son texte ; il apparaît une fois, une seule, dans son fichier, sur `main` où la PR 138 est entrée, que le ticket 57 y soit déjà appliqué ou non (vu sur les deux arbres). Un bloc « Nouveau » se recopie tel quel, sans la ligne de clôture. Les blocs s'appliquent dans l'ordre du texte : B1 à B11, G1 à G10, L1 et L2, M1 à M4, R1 à R12, puis V1 et N1, une seule fois pour les tickets 55 et 57.

### 0. Le banc d'abord, vu rouge

#### B1 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:11`

Les deux fonctions nouvelles entrent dans la liste importée.

Ancien :

````js
  ecartsFormatPret,
  estArchive,
````

Nouveau :

````js
  ecartsFormatPret,
  ecartsRelecture,
  ecartsSensibles,
  estArchive,
````

#### B2 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:67`

Ancien :

````js
test('carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1, rétro à fini', () => {
````

Nouveau :

````js
test('carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1 ; à fini, aucune section `## Rétro` n’est exigée', () => {
````

#### B3 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:73`

L'assertion qui exigeait le refus devient trois assertions : `fini` sans `## Rétro` passe, une carte d'avant qui garde sa section passe, `## Coût` reste exigée.

Ancien :

````js
  assert.match(carte('fini', '\n## Coût\n\n| a |\n').erreurs[0].message, /Rétro/);
````

Nouveau :

````js
  assert.deepEqual(carte('fini', '\n## Coût\n\n| a |\n').erreurs, [], 'le bilan de fin de chantier est supprimé : `fini` sans `## Rétro` passe');
  assert.deepEqual(carte('fini', '\n## Coût\n\n| a |\n\n## Rétro\n\nRien.\n').erreurs, [], 'une carte d’avant garde sa section, sans effet');
  assert.match(carte('fini').erreurs[0].message, /Coût/, '`## Coût` reste exigée à `fini`');
````

#### B4 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:416`

Dans le test « une ligne de coût au-delà du plafond de son rôle… ».

Ancien :

````js
  // Sans contrat (plafonds null), rien n'est jugé.
````

Nouveau :

````js
  // Une session de relecture d'une PR (rôle `relecture`) n'est pas jugée non plus, même illisible.
  assert.equal(juger(COUT('| relecture | SPEC_ALL_SOC-1.02 | s10 | sonnet | 900 k | 9,00 |', '| relecture | t | s11 | sonnet | beaucoup | 9,00 |')).length, 0);
  // Sans contrat (plafonds null), rien n'est jugé.
````

#### B5 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:171`

Trois tests ajoutés avant le test des chemins chauds, qui ne change pas. `PRET`, `NOM`, `existe`, `sur` et `SENSIBLES` existent déjà dans le fichier.

Ancien :

````js
test('les chemins chauds se lisent entre accents graves ou en liste, et un motif `**/` accepte zéro dossier', () => {
````

Nouveau :

````js
const ACCORD = 'accord de Camille Martin, 2026-11-18';

test('Sensibles: `—`, ou des chemins puis l’accord (nom, date), passe ; toute autre forme est refusée, en temps borné', () => {
  for (const v of [
    '—',
    '— # aucun chemin sensible',
    `\`scripts/chaine/passer.sh\`, \`scripts/chaine/passer*.test.mjs\` — ${ACCORD}`,
    `scripts/agent/**, .claude/chaine.json — ${ACCORD}`,
    'apps/api/src/paiement/ — accord de Martin, Camille, 2026-11-18 # un dossier qu’un ticket précédent rend sensible',
  ])
    assert.deepEqual(ecartsSensibles(v), [], v);
  const FORME = /^Sensibles « .* » : attendu `—`, ou des chemins séparés par des virgules puis ` — accord de <nom>, <AAAA-MM-JJ>`$/;
  for (const v of ['', 'scripts/chaine/passer.sh', 'scripts/chaine/passer.sh, scripts/agent/regles.mjs', 'scripts/chaine/passer.sh — accord de Camille Martin', `— ${ACCORD}`, `scripts/chaine/passer.sh - ${ACCORD}`, `scripts/chaine/passer.sh —  ${ACCORD}`, '— —']) {
    const e = ecartsSensibles(v);
    assert.equal(e.length, 1, v);
    assert.match(e[0], FORME, v);
  }
  const refus = [
    ['scripts/chaine/passer.sh — accord de Camille Martin, 18/11/2026', /date « 18\/11\/2026 »/],
    ['scripts/chaine/passer.sh — accord de Camille Martin, 2026-02-30', /date « 2026-02-30 »/],
    ['scripts/chaine/passer.sh — accord de session_01Abc, 2026-11-18', /accord de « session_01Abc » : attendu la personne qui a accordé/],
    ['scripts/chaine/passer.sh — accord de <nom>, 2026-11-18', /accord de « <nom> »/],
    [`\`{{chemin ou motif}}\` — ${ACCORD}`, /n'est pas un chemin/],
    [`scripts/chaine/passer.sh,, scripts/agent/regles.mjs — ${ACCORD}`, /«  » n'est pas un chemin/],
    [`/scripts/chaine/passer.sh — ${ACCORD}`, /« \/scripts\/chaine\/passer\.sh » n'est pas un chemin/],
    [`scripts/../.claude/chaine.json — ${ACCORD}`, /n'est pas un chemin/],
    [`scripts/chaine/mon script.sh — ${ACCORD}`, /« scripts\/chaine\/mon script\.sh » n'est pas un chemin/],
    [`scripts/chaine/passer.sh, — — ${ACCORD}`, /« — » n'est pas un chemin/],
  ];
  for (const [v, motif] of refus) {
    const e = ecartsSensibles(v);
    assert.equal(e.length, 1, `${v} : ${e.join(' | ')}`);
    assert.match(e[0], motif, v);
  }
  assert.equal(ecartsSensibles('/a, b c — accord de session_x, 2026-13-01').length, 4, 'chaque écart est rendu');
  const debut = performance.now();
  ecartsSensibles(`${'a, '.repeat(100_000)}b — ${ACCORD}`);
  ecartsSensibles(`${' \t'.repeat(150_000)}x`);
  ecartsSensibles(`a${' — accord de '.repeat(20_000)}x, 2026-11-18`);
  assert.ok(performance.now() - debut < 2000, 'trois valeurs hostiles de 300 000 caractères lues en moins de 2 s');
});

test('Relecture: `double` passe ; toute autre valeur est refusée, la valeur nommée', () => {
  for (const v of ['double', 'double # règle de criticité haute']) assert.deepEqual(ecartsRelecture(v), [], v);
  for (const v of ['', 'simple', 'Double', 'double double', 'doubles', '2', 'oui']) {
    const e = ecartsRelecture(v);
    assert.equal(e.length, 1, v);
    assert.match(e[0], /^Relecture « .* » : seule valeur `double` ; sinon retirer la ligne$/, v);
  }
});

test('`Sensibles:` et `Relecture:` ne se lisent que dans l’en-tête, ne sont jamais exigées, et `Label: contre-revue` reste exigé à côté d’elles', () => {
  const avec = (enTete) => PRET.replace('Modèle: sonnet\n', `Modèle: sonnet\n${enTete}`);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: PRET, existe }).erreurs, [], 'absentes : rien n’est exigé');
  assert.deepEqual(controlerTicket({ nom: NOM, texte: avec('Sensibles: —\nRelecture: double\n'), existe }).erreurs, []);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: avec(`Sensibles: scripts/chaine/passer.sh — ${ACCORD}\r\nRelecture: double\r\n`), existe }).erreurs, [], 'CRLF');
  assert.deepEqual(controlerTicket({ nom: NOM, texte: avec('Relecture: triple\r\n'), existe }).erreurs.map((e) => e.ligne), [7], 'CRLF, mal formée');
  const ko = controlerTicket({ nom: NOM, texte: avec('Sensibles: scripts/chaine/passer.sh\nRelecture: triple\n'), existe });
  assert.deepEqual(ko.erreurs.map((e) => [e.ligne, e.message.split(' ')[0]]), [[7, 'Sensibles'], [8, 'Relecture']]);
  // Toutes les formes que lit le calcul « double relecture exigée » sont jugées, chaque ligne de l'en-tête.
  const formes = controlerTicket({ nom: NOM, texte: avec('- Relecture: triple\n**Sensibles:** scripts/chaine/passer.sh\n* relecture : simple\nRelecture: double\nRelecture: Double\n'), existe });
  assert.deepEqual(formes.erreurs.map((e) => e.ligne), [7, 8, 9, 11]);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: avec('- **Relecture:** double\nsensibles: —\n'), existe }).erreurs, [], 'puce, gras, casse de la clé');
  // Dans le corps (un exemple cité par le ticket), la ligne n'est pas lue.
  assert.deepEqual(controlerTicket({ nom: NOM, texte: `${PRET}\nSensibles: scripts/chaine/passer.sh\nRelecture: triple\n`, existe }).erreurs, []);
  // Un ticket qui n'est pas prêt, ou gelé dans la dette, est jugé de même : la forme vaut pour tout ticket.
  assert.equal(controlerTicket({ nom: NOM, texte: '# x\n\nStatus: needs-triage\nType: task\nRelecture: simple\n', existe }).erreurs.length, 1);
  assert.equal(controlerTicket({ nom: NOM, texte: '# x\n\nStatus: ready-for-agent\nType: task\nSensibles: a\n', existe, gele: true }).erreurs.length, 1);
  // `Label: contre-revue` reste exigé sur un chemin sensible : `Sensibles:` ne le remplace pas.
  const accorde = `Sensibles: apps/api/src/infrastructure/auth/jwt.ts — ${ACCORD}\n`;
  const sans = controlerTicket({ nom: NOM, texte: sur('`apps/api/src/infrastructure/auth/jwt.ts`', accorde), existe, cheminsSensibles: SENSIBLES });
  assert.equal(sans.erreurs.length, 1);
  assert.match(sans.erreurs[0].message, /ready-for-agent : ligne `Label: contre-revue` absente/);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: sur('`apps/api/src/infrastructure/auth/jwt.ts`', `Label: contre-revue\n${accorde}`), existe, cheminsSensibles: SENSIBLES }).erreurs, []);
});

test('les chemins chauds se lisent entre accents graves ou en liste, et un motif `**/` accepte zéro dossier', () => {
````

#### B6 — fin de `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs`

Le gate lancé pour de vrai, sur un dépôt jouet. `DETTE`, `depotJouet` et `lancer` existent déjà dans le fichier.

Ajouté à la fin du fichier, après une ligne vide :

````js
test('gate complet : `Sensibles:` ou `Relecture:` mal formée est refusée avec le chemin et la ligne ; bien formées, avec `Règles: —`, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture, passe', () => {
  const ticket = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
  const corps = (enTete) => `# x\n\nStatus: needs-triage\nType: task\n${enTete}`;
  const carte = 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.map.md';
  const finie =
    '# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: fini\nResponsable: Camille Martin\nConducteur: session_z\n\n## Coût\n\n| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |\n| --- | --- | --- | --- | --- | --- |\n| relecture | SPEC_ALL_SOC-1.01 | session_r | sonnet | 900 k | 2,00 |\n';
  const ok = depotJouet({ fichiers: { ...DETTE, '.claude/chaine.json': '{}\n', [carte]: finie, [ticket]: corps('Sensibles: scripts/chaine/passer.sh, scripts/agent/** — accord de Camille Martin, 2026-11-18\nRelecture: double\nRègles: —\n') } });
  const r = lancer(ok);
  assert.equal(r.status, 0, r.stderr);
  const ko = depotJouet({ fichiers: { ...DETTE, [ticket]: corps('Sensibles: scripts/chaine/passer.sh\nRelecture: triple\n') } });
  const r2 = lancer(ko);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:5 : Sensibles « scripts\/chaine\/passer\.sh » : attendu `—`, ou des chemins/);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:6 : Relecture « triple » : seule valeur `double`/);
});
````

#### B7 — `skills/chaine/tickets/references/scripts/docs/couts.test.mjs:67`

Un test ajouté avant celui-ci, qui ne change pas.

Ancien :

````js
test("une carte sans section Coût ni Sujet garde le nom de son fichier et n'apparaît pas au registre", () => {
````

Nouveau :

````js
test("une session de relecture compte dans le total et les sessions, pas dans les filles ni dans les tickets", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"],
      ["relecture", "SPEC_ALL_SOC-9.01", "s2", "sonnet", "90 k", "1,50"],
      ["relecture", "SPEC_ALL_SOC-9.02", "s3", "sonnet", "80 k", "0,50"],
    ]),
  );
  assert.deepEqual(bilan(c), { total: 5, filles: 3, tickets: 1, parTicket: 3 });
  const md = plat(enMarkdown([c]));
  assert.match(md, /\*\*Total : 5,00 \$\*\* sur 3 session\(s\) et 1 chantier\(s\)\. Filles : 3,00 \$ pour 1 ticket\(s\), soit 3,00 \$ par ticket\./);
  assert.match(md, /\| demo \| relecture \| SPEC_ALL_SOC-9\.01 \| s2 \| sonnet \| 90 k \| 1,50 \|/);
});

test("une carte sans section Coût ni Sujet garde le nom de son fichier et n'apparaît pas au registre", () => {
````

#### B8 — `scripts/depot.test.mjs:194`

Le test du gabarit de carte gagne deux assertions et un titre plus long.

Bloc retiré : de la ligne qui commence par

````js
// La carte de chantier : son gabarit porte la ligne `Gel:` (vide) dans la fiche
````

jusqu'à la ligne, non comprise, qui commence par

````js
// Un skill propre au projet (`P-21`)
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````js
// La carte de chantier : son gabarit porte la ligne `Gel:` (vide) dans la fiche et la section `## Journal`
// où le conducteur écrit ses arrêts ; le gate des cartes n'exige ni l'une ni l'autre. Il n'a plus de section
// `## Rétro` (ticket 55 : le bilan de fin de chantier est supprimé) et nomme le rôle `relecture` sous `## Coût`.
const CARTE = "skills/chaine/tickets/references/gabarits/carte.map.md";
test("le gabarit de la carte de chantier porte `Gel:` dans sa fiche et la section `## Journal`, nomme le rôle `relecture` sous `## Coût`, et n'a plus de section `## Rétro`", () => {
  const texte = readFileSync(join(RACINE, CARTE), "utf8");
  assert.ok(lignes(section(texte, "Fiche")).includes("Gel:"), `${CARTE} : la fiche porte la ligne Gel: vide`);
  assert.ok(titres(texte).includes("## Journal"), `${CARTE} : section ## Journal`);
  assert.deepEqual(titres(texte), ["## Fiche", "## Decisions-so-far", "## Fog", "## Vagues", "## Coût", "## Dépassements", "## Journal"], `${CARTE} : ses sections, sans ## Rétro`);
  assert.ok(lignes(section(texte, "Coût")).some((l) => /^<!-- Rôles : fille, conducteur, architecte, capitaine, relecture \(/.test(l)), `${CARTE} : la section ## Coût nomme ses rôles, relecture compris`);
});
````

#### B9 — fin de `scripts/depot.test.mjs`

Deux tests, à la fin du fichier, après le dernier d'aujourd'hui (« verdict de contre-relecture : la règle est dite dans le prompt de la session d'un ticket… », de l'autre programme). `SKILLS_CHAINE`, `REF`, `lignes` et `exiger` existent déjà dans le fichier.

Ajouté à la fin du fichier, après une ligne vide :

````js
// Le bilan de fin de chantier est supprimé (ticket 55 ; décision du produit du 2026-11-18, sans rien à la place) :
// les textes qui le demandaient ne nomment plus de rétro, et disent qu'un incident donne un ticket quand il arrive.
// Le gabarit de ticket montre les deux lignes que le gate accepte sans les exiger.
const SANS_RETRO = [
  `${SKILLS_CHAINE}/chantier/SKILL.md`,
  `${SKILLS_CHAINE}/chantier/references/CONTENU.md`,
  `${REF}/docs-agents/chaine-de-production.md`,
  `${REF}/docs-agents/pieges.md`,
  `${REF}/CONTENU.md`,
  "skills/chaine/tickets/references/gabarits/carte.map.md",
  "README.md",
];
test("le bilan de fin de chantier est supprimé : plus aucune rétro dans les textes du conducteur, un incident donne un ticket au moment où il arrive", () => {
  for (const f of SANS_RETRO) {
    const fautes = lignes(readFileSync(join(RACINE, f), "utf8")).flatMap((l, i) => (/rétro/i.test(l) ? [`${f}:${i + 1}`] : []));
    assert.deepEqual(fautes, [], `le bilan de fin de chantier est supprimé : ${fautes.join(" ; ")}`);
  }
  exiger(`${SKILLS_CHAINE}/chantier/SKILL.md`, [
    "## 7. Phase 5 — livraison (`Phase: 5-livraison`), phase 6 — nettoyage (`Phase: 6-nettoyage`, puis `Phase: fini`)",
    "**Aucun bilan de fin de chantier** : un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive — un gate, un critère de `revue-adversariale` — ou, faute de gate, une ligne de `docs/agents/pieges.md` ; vécu deux fois sans gate, il est signalé au produit.",
  ]);
  exiger(`${REF}/docs-agents/chaine-de-production.md`, [
    "──► vagues de filles ──► sujet livré (produit,",
    "7. **Un incident donne un ticket au moment où il arrive.** Chaque renvoi du capitaine et chaque échec de vague donne, sur le moment, un ticket (un gate, un critère de la revue adversariale) ou, faute de gate, une ligne de `pieges.md`. Il n'y a pas de bilan de fin de chantier. Un piège vécu deux fois sans gate est une dette.",
  ]);
  exiger(`${REF}/docs-agents/pieges.md`, [
    "Un incident qui n'a pas encore son gate reçoit ici sa ligne au moment où il arrive, avec son ticket (skill `chantier` § 7) : il n'y a pas de bilan de fin de chantier.",
  ]);
  // La note de version le dit, sans numéro : la version est la suivante de `main` au moment de livrer.
  exiger("NOTES-DE-VERSION.md", [
    "Le bilan de fin de chantier est supprimé (décision du produit du 2026-11-18), sans rien à la place :",
    "Le gate `tickets` juge la forme de deux lignes d'en-tête qu'il ne lisait pas, sans les exiger :",
  ]);
});

const GABARIT_TICKET = "skills/chaine/tickets/references/gabarits/ticket.issue.md";
test("le gabarit de ticket montre `Sensibles:` et `Relecture: double` dans son en-tête, après `Label:`, chacune à retirer quand elle ne sert pas, et `Règles: —` pour un ticket sans règle", () => {
  const enTete = lignes(readFileSync(join(RACINE, GABARIT_TICKET), "utf8").split(/^## /m)[0]);
  const rang = (debut) => enTete.findIndex((l) => l.startsWith(debut));
  const [label, sensibles, relecture, dependances] = ["Label: contre-revue", "Sensibles: ", "Relecture: double # ", "Dépendances: "].map(rang);
  assert.ok(label >= 0 && sensibles === label + 1 && relecture === label + 2 && dependances === label + 3, `${GABARIT_TICKET} : Label, Sensibles, Relecture, Dépendances, dans cet ordre`);
  assert.match(enTete[sensibles], /^Sensibles: `\{\{chemin ou motif\}\}`, `\{\{chemin ou motif\}\}` — accord de \{\{la personne qui a accordé\}\}, \{\{AAAA-MM-JJ\}\} # .*ou `—` s'il n'en modifie aucun.*sans exiger la ligne.*ou retirer la ligne$/);
  assert.match(enTete[relecture], /^Relecture: double # .*seule valeur acceptée par le gate `tickets`, qui n'exige pas la ligne.*sinon retirer la ligne$/);
  assert.match(enTete[rang("Règles: ")], /; `—` seul s'il n'en réalise aucune ; ou retirer la ligne\}\}$/, `${GABARIT_TICKET} : Règles: — pour un ticket sans règle`);
});
````

#### B10 — `scripts/depot.test.mjs:1312`

Les entrées piégées du lecteur des mentions de CODEOWNERS (décision 15), à la fin de leur test, « lecteur des mentions de CODEOWNERS : entrées piégées », dont le titre ne change pas. `admis`, `mentionsFautives` et `deCodeowners` existent déjà dans le test et dans le fichier.

Ancien :

````js
  assert.deepEqual(mentionsFautives("f", "a\n.github/CODEOWNERS\n"), ["f:2"]);
});
````

Nouveau :

````js
  assert.deepEqual(mentionsFautives("f", "a\n.github/CODEOWNERS\n"), ["f:2"]);
  // Plusieurs blancs, une espace insécable, une tabulation entre les deux mots : la mention reste lue (ticket 55).
  for (const l of ["Require review from Code  Owners", "Require review from Code\u00a0Owners", "code\towners", "code -_ owner"]) assert.equal(deCodeowners(l), true, JSON.stringify(l));
  // À cheval sur deux lignes, en LF comme en CRLF : lue sur le texte entier, blancs réduits, et dite.
  const cheval = "f : mention à cheval sur deux lignes";
  assert.deepEqual(mentionsFautives("f", "a\n- cocher « Require review from Code\nOwners »\n"), [cheval]);
  assert.deepEqual(mentionsFautives("f", "a\r\n- une PR qui touche un chemin\r\npossédé\r\n"), [cheval]);
  assert.deepEqual(mentionsFautives("f", "a\n- elle attend\nun propriétaire\n"), [cheval]);
  // Fins de ligne CRLF, dernière ligne sans fin de ligne : la ligne fautive est nommée, un passage admis passe.
  assert.deepEqual(mentionsFautives("f", "a\r\n.github/CODEOWNERS\r\nb\r\n"), ["f:2"]);
  assert.deepEqual(mentionsFautives("f", "a\nb\npnpm codeowners"), ["f:3"]);
  assert.deepEqual(mentionsFautives("f", `a\r\n- ${admis} ; b\r\n`, [admis]), []);
  assert.deepEqual(mentionsFautives("f", `a\n- ${admis}`, [admis]), []);
  // Deux lignes voisines sans mention ne s'en fabriquent pas une.
  assert.deepEqual(mentionsFautives("f", "le code\nouvre la session propriétaire\r\nb"), []);
});
````

#### B11 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:341`

Un test ajouté avant cette ligne, qui ne change pas : `Règles: —` (décision 14). `avecRegles` existe déjà dans le fichier.

Ancien :

````js
const SPEC_TS = [
````

Nouveau :

````js
test('Règles: `—` seul dit que le ticket ne réalise aucune règle et passe ; mêlé à une règle, ou un autre tiret, est refusé', () => {
  assert.deepEqual(avecRegles('Règles: —'), []);
  assert.deepEqual(avecRegles('Règles:   —  '), [], 'les blancs autour ne comptent pas');
  assert.deepEqual(avecRegles('- **Règles:** —'), [], 'sous les trois formes d’en-tête');
  for (const [ligne, motif] of [
    ['Règles: —, RULE_ALL_LIC-3', /« — »/],
    ['Règles: RULE_ALL_LIC-3 —', /« — »/],
    ['Règles: -', /« - »/],
    ['Règles: –', /« – »/],
    ['Règles: — —', /« — »/],
    ['Règles: `—`', /« `—` »/],
  ])
    assert.match(avecRegles(ligne).join(' | '), motif, ligne);
});

const SPEC_TS = [
````

Après B1 à B11, sur `main` où la PR 138 est entrée et rien d'autre : `node --test scripts/depot.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/docs/couts.test.mjs` rend **124 tests, 10 rouges** : dans `depot.test.mjs`, le test du gabarit de carte, le test des entrées piégées du lecteur (B10) et les deux tests ajoutés (B9) ; dans `tickets.test.mjs`, le test de la carte, les trois tests ajoutés par B5 (les deux fonctions n'existent pas encore) et celui de B11 ; dans `tickets-gate.test.mjs`, le test ajouté. Sur l'arbre où le ticket 57 est appliqué avec la note commune (« Dans la même PR que le ticket 57 »), le même compte, plus les tests du 57 : **125 tests, 10 rouges**, les mêmes. Le test ajouté à `couts.test.mjs` et l'assertion de B4 sont **verts dès l'écriture** : ils prouvent un comportement que le code a déjà (décision 8) ; de B10, les entrées CRLF et sans dernière fin de ligne aussi (décision 15).

### 1. Le gate

#### G1 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:581`

Dans `controlerCarte` : l'obligation sort, rien ne la remplace.

Ancien :

````js
  if (phase && /^fini(\s|$)/.test(phase.valeur)) {
    const retro = corps.get('Rétro');
    if (!retro || retro.length === 0) erreurs.push({ ligne: phase.ligne, message: `carte ${nom} : section \`## Rétro\` absente ou vide (obligatoire à \`fini\`)` });
  }
  const migrations = chercher(lignes, MIGRATIONS);
````

Nouveau :

````js
  const migrations = chercher(lignes, MIGRATIONS);
````

#### G2 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:175`

Ancien :

````js
const LABEL = /^Label\s*:\s*(.*)$/;
````

Nouveau :

````js
const LABEL = /^Label\s*:\s*(.*)$/;
// `Sensibles:` et `Relecture:` se lisent sous toutes les formes que lit le calcul « double relecture exigée » du
// skill `fusionner` (`A-113`) : `X:`, `**X:**`, `- X:`, `* X:`, sans égard à la casse. Une ligne qu'il lit, le gate la juge.
const ligneDEnTete = (nom) => new RegExp(`^(?:[-*][ \\t]+)?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');
const SENSIBLES = ligneDEnTete('Sensibles');
const RELECTURE = ligneDEnTete('Relecture');
````

#### G3 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:345`

Le commentaire de `plafondsDeLaCarte` nomme le rôle ; son code ne change pas.

Ancien :

````js
 * Tout autre rôle n'est pas jugé ; une cellule
````

Nouveau :

````js
 * Tout autre rôle n'est pas jugé (`capitaine`, `relecture` : une session de relecture d'une PR) ; une cellule
````

#### G4 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:430`

Deux fonctions exportées, `ecartsSensibles` et `ecartsRelecture`, et leurs trois aides, avant `ecartsRegles`, qui ne change pas.

Ancien :

````js
/**
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier.
````

Nouveau :

````js
/** La valeur sans son commentaire de gabarit (` # …`), comme sur `Type:`. Recherche d'un motif de deux caractères : linéaire. */
const sansCommentaire = (valeur) => {
  const i = valeur.search(/\s#/);
  return (i === -1 ? valeur : valeur.slice(0, i)).trim();
};

/** `AAAA-MM-JJ` d'un jour qui existe (`2026-02-30` n'en est pas un). */
const dateValide = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const jour = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(jour.getTime()) && jour.toISOString().slice(0, 10) === date;
};

const ACCORD = ' — accord de ';

/**
 * Écarts de la ligne `Sensibles:` d'un ticket : les chemins sensibles qu'il modifie et l'accord donné avant.
 * Deux formes : `—` seul (aucun chemin sensible), ou des chemins ou des motifs séparés par des virgules, entre
 * accents graves ou nus, puis ` — accord de <nom>, <AAAA-MM-JJ>`. Seule la forme est jugée : ni que le chemin est
 * déjà dans `cheminsSensibles` (un ticket peut nommer le dossier qu'un ticket précédent rendra sensible), ni que
 * l'accord a été donné. La ligne n'est jamais exigée. Lecture par découpes de chaîne : linéaire.
 */
export function ecartsSensibles(valeur) {
  const v = sansCommentaire(valeur);
  if (v === '—') return [];
  const forme = 'attendu `—`, ou des chemins séparés par des virgules puis ` — accord de <nom>, <AAAA-MM-JJ>`';
  const i = v.indexOf(ACCORD);
  const accord = i === -1 ? '' : v.slice(i + ACCORD.length);
  const j = accord.lastIndexOf(',');
  if (i <= 0 || j <= 0) return [`Sensibles « ${v} » : ${forme}`];
  const ecarts = [];
  for (const brut of v.slice(0, i).split(',')) {
    const c = brut.trim().replace(/^`([^`]*)`$/, '$1').trim();
    if (c === '' || /[\s`{}]/.test(c) || c === '—' || c.startsWith('/') || c.split('/').includes('..'))
      ecarts.push(`Sensibles : « ${brut.trim()} » n'est pas un chemin ni un motif relatif à la racine du dépôt (sans blanc, sans \`/\` initial, sans \`..\`) ; ${forme}`);
  }
  const nom = accord.slice(0, j).trim();
  const date = accord.slice(j + 1).trim();
  if (nom === '' || /^session_/.test(nom) || /[<>{}]/.test(nom))
    ecarts.push(`Sensibles : accord de « ${nom} » : attendu la personne qui a accordé, pas un identifiant de session ni un gabarit`);
  if (!dateValide(date)) ecarts.push(`Sensibles : date « ${date} » : attendu le jour de l'accord, AAAA-MM-JJ`);
  return ecarts;
}

/** Écarts de la ligne `Relecture:` d'un ticket : seule valeur `double` (deux relectures indépendantes). Jamais exigée. */
export function ecartsRelecture(valeur) {
  return sansCommentaire(valeur) === 'double' ? [] : [`Relecture « ${valeur} » : seule valeur \`double\` ; sinon retirer la ligne`];
}

/**
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier.
````

#### G5 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:518`

Dans `controlerTicket`, après le contrôle de `Sujet:` : pour tout ticket, prêt ou non, gelé ou non, chaque ligne de l'en-tête (décision 4).

Ancien :

````js
  const pret = status?.valeur === 'ready-for-agent';
````

Nouveau :

````js
  // Lues dans l'en-tête seul, chaque ligne : un exemple cité dans le corps du ticket n'est pas la ligne.
  tete(lignes).forEach((brute, i) => {
    const l = brute.replace(/\r$/, '');
    const sensibles = SENSIBLES.exec(l);
    if (sensibles) for (const e of ecartsSensibles(sensibles[1].trim())) erreurs.push({ ligne: i + 1, message: e });
    const relecture = RELECTURE.exec(l);
    if (relecture) for (const e of ecartsRelecture(relecture[1].trim())) erreurs.push({ ligne: i + 1, message: e });
  });
  const pret = status?.valeur === 'ready-for-agent';
````

#### G6 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:17`

Ancien :

````js
`Conducteur:`, `## Coût` dès `4-vague-1`, `## Rétro`
 *      à `fini` ; une ligne de `## Coût`
````

Nouveau :

````js
`Conducteur:`, `## Coût` dès `4-vague-1` (aucune section
 *      `## Rétro` n'est exigée, pas même à `fini`) ; une ligne de `## Coût`
````

#### G7 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:19`

Ancien :

````js
l'`architecte` n'a pas de plafond) exige une
````

Nouveau :

````js
l'`architecte` n'a pas de plafond, tout autre rôle, `relecture` compris, n'est pas jugé) exige une
````

#### G8 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:38`

Ancien :

````js
 *      (`fichier.test.ts` « titre ») qui existent dans les fichiers de tests suivis et sont actifs.
````

Nouveau :

````js
 *      (`fichier.test.ts` « titre ») qui existent dans les fichiers de tests suivis et sont actifs ;
 *  12. `Sensibles:`, si la ligne est dans l'en-tête, vaut `—` ou des chemins (ou des motifs) séparés par des
 *      virgules puis ` — accord de <nom>, <AAAA-MM-JJ>` : la forme seule est jugée, la ligne n'est jamais exigée ;
 *  13. `Relecture:`, si la ligne est dans l'en-tête, vaut `double` ; elle n'est jamais exigée.
````

#### G9 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:431`

`ecartsRegles` : `Règles: —`, seul, ne demande rien (décision 14). La valeur arrive rognée (`chercher`). G4 a ajouté ses fonctions avant ce commentaire, qu'il garde tel quel.

Ancien :

````js
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier. Présente, elle cite au moins une
 * règle, chacune bien formée, existante (`regleExiste(id)`) et du contexte du ticket ou de `ALL`.
 * `contexte` : celui de l'identifiant du ticket, `null` s'il est illisible (seul `ALL` est alors sûr).
 */
export function ecartsRegles(valeur, { contexte, regleExiste }) {
  const { cites, malformes } = reglesCitees(valeur);
````

Nouveau :

````js
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier. `Règles: —`, seul : le ticket dit lui-même
 * qu'il ne réalise aucune règle (`A-117`), rien à vérifier. Sinon elle cite au moins une
 * règle, chacune bien formée, existante (`regleExiste(id)`) et du contexte du ticket ou de `ALL`.
 * `contexte` : celui de l'identifiant du ticket, `null` s'il est illisible (seul `ALL` est alors sûr).
 */
export function ecartsRegles(valeur, { contexte, regleExiste }) {
  if (valeur === '—') return [];
  const { cites, malformes } = reglesCitees(valeur);
````

#### G10 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:35`

Ancien :

````js
 *  10. `Règles:`, si la ligne est là, cite au moins une règle, chacune `RULE_<CTX>_<TRI>-<n>` ayant son
````

Nouveau :

````js
 *  10. `Règles:`, si la ligne est là, vaut `—` (aucune règle) ou cite au moins une règle, chacune `RULE_<CTX>_<TRI>-<n>` ayant son
````

### 2. Le lecteur du banc des mentions de CODEOWNERS

#### L1 — `scripts/depot.test.mjs:1284`

Le motif (décision 15) : des blancs quelconques entre « code » et « owner ». Seul le début de la ligne change.

Ancien :

````js
const DE_CODEOWNERS = /code[ _-]?owners?|
````

Nouveau :

````js
const DE_CODEOWNERS = /code[\s_-]*owners?|
````

#### L2 — `scripts/depot.test.mjs:1295`

Dans `mentionsFautives` : une mention coupée par une fin de ligne.

Ancien :

````js
  lignes(texte).forEach((l, i) => deCodeowners(l) && fautes.push(`${fichier}:${i + 1}`));
  return fautes;
````

Nouveau :

````js
  lignes(texte).forEach((l, i) => deCodeowners(l) && fautes.push(`${fichier}:${i + 1}`));
  // Une mention coupée par une fin de ligne (LF ou CRLF) se lit d'un seul tenant sur le texte entier, blancs réduits.
  if (fautes.length === 0 && deCodeowners(texte.replace(/\s+/g, " "))) fautes.push(`${fichier} : mention à cheval sur deux lignes`);
  return fautes;
````

### 3. Les gabarits

#### M1 — `skills/chaine/tickets/references/gabarits/carte.map.md:34`

Un commentaire sous le titre, comme celui de la ligne 5 du gabarit ; le tableau ne change pas.

Bloc retiré : de la ligne qui commence par

````text
## Coût
````

jusqu'à la ligne, non comprise, qui commence par

````text
| Rôle | Ticket | Session
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````text
## Coût

<!-- Rôles : fille, conducteur, architecte, capitaine, relecture (une session de relecture d'une PR). Le gate `tickets` ne juge au plafond que fille et conducteur. -->
````

#### M2 — `skills/chaine/tickets/references/gabarits/carte.map.md:48`

La section `## Rétro` sort ; le gabarit finit sur `## Journal`.

Ancien :

````text
- {{AAAA-MM-JJ}} — {{ce qui s'est passé : gel, interruption des filles, dégel}}

## Rétro

{{À la fin : incidents, ce qui a donné un gate ou un critère de revue, coût total et par ticket.}}
````

Nouveau :

````text
- {{AAAA-MM-JJ}} — {{ce qui s'est passé : gel, interruption des filles, dégel}}
````

#### M3 — `skills/chaine/tickets/references/gabarits/ticket.issue.md:10`

Deux lignes après `Label:`, qui ne change pas.

Ancien :

````text
Label: contre-revue # obligatoire quand `Fichiers chauds` touche `cheminsSensibles` (le gate `tickets` le vérifie) — sinon retirer la ligne
````

Nouveau :

````text
Label: contre-revue # obligatoire quand `Fichiers chauds` touche `cheminsSensibles` (le gate `tickets` le vérifie) — sinon retirer la ligne
Sensibles: `{{chemin ou motif}}`, `{{chemin ou motif}}` — accord de {{la personne qui a accordé}}, {{AAAA-MM-JJ}} # les chemins sensibles que le ticket modifie et l'accord donné avant, ou `—` s'il n'en modifie aucun ; le gate `tickets` juge la forme sans exiger la ligne ; aucune garde ne la lit encore — ou retirer la ligne
Relecture: double # deux relectures indépendantes, pour un ticket qui touche une règle de criticité haute ; seule valeur acceptée par le gate `tickets`, qui n'exige pas la ligne ; sans effet pour l'instant — sinon retirer la ligne
````

#### M4 — `skills/chaine/tickets/references/gabarits/ticket.issue.md:5`

La ligne `Règles:` du gabarit nomme `—` (décision 14).

Ancien :

````text
; ou retirer la ligne}}
Sujet: sujet/{{nom}}
````

Nouveau :

````text
; `—` seul s'il n'en réalise aucune ; ou retirer la ligne}}
Sujet: sujet/{{nom}}
````

### 4. Les textes, mot pour mot

#### R1 — `skills/chaine/chantier/SKILL.md:3`

Ancien :

````text
livraison par le capitaine et rétro. Le grilling complet
````

Nouveau :

````text
livraison par le capitaine. Le grilling complet
````

#### R2 — `skills/chaine/chantier/SKILL.md:43`

Ancien :

````text
(phase, sessions d'une vague, coût, incidents, rétro)
````

Nouveau :

````text
(phase, sessions d'une vague, coût, incidents)
````

#### R3 — `skills/chaine/chantier/SKILL.md:110`

Ancien :

````text
## 7. Phase 5 — livraison et rétro (`Phase: 5-livraison`)
````

Nouveau :

````text
## 7. Phase 5 — livraison (`Phase: 5-livraison`)
````

#### R4 — `skills/chaine/chantier/SKILL.md:113`

Le point 2 et ses deux puces (`chantier/SKILL.md:113-115`) deviennent un point d'une ligne : le relevé des coûts reste, le bilan sort, l'incident donne un ticket quand il arrive.

Bloc retiré : de la ligne qui commence par

````text
2. Rétro dans la carte, section `## Rétro` :
````

jusqu'à la ligne, non comprise, qui commence par

````text
3. Sessions filles finies :
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````text
2. **Coût** : section `## Coût` de la carte (source du registre `docs/agents/couts.md`, index généré, qui donne le total et le coût par ticket), une ligne par session (`get_session` : `external_metadata.usage.cost_usd`, `context_usage.used_tokens`, `last_served_model`) — filles du tag `chantier:<nom>` relevées à chaque fin de vague, puis capitaine et cette session-ci (rôle `conducteur`) en fin de chantier. **Aucun bilan de fin de chantier** : un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive — un gate, un critère de `revue-adversariale` — ou, faute de gate, une ligne de `docs/agents/pieges.md` ; vécu deux fois sans gate, il est signalé au produit.
````

#### R5 — `skills/chaine/chantier/references/CONTENU.md:7`

Ancien :

````text
le fichier `docs/agents/pieges.md` que la rétro alimente.
````

Nouveau :

````text
le fichier `docs/agents/pieges.md`, où un incident sans gate reçoit sa ligne au moment où il arrive.
````

#### R6 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:29`

Le schéma du cycle perd sa dernière étape et le rôle écrit dessous.

Ancien :

````text
──► vagues de filles ──► sujet livré ──► rétro
(produit,     (architecte,      (conducteur)          (capitaine)                         (filles)            (capitaine)   (conducteur)
````

Nouveau :

````text
──► vagues de filles ──► sujet livré
(produit,     (architecte,      (conducteur)          (capitaine)                         (filles)            (capitaine)
````

#### R7 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:35`

Ancien :

````text
(phase, sessions, coûts, incidents, rétro)
````

Nouveau :

````text
(phase, sessions, coûts, incidents)
````

#### R8 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:40`

Ancien :

````text
7. **Rétro.** Chaque renvoi du capitaine et chaque échec de vague donne une ligne : un piège documenté, un critère de la revue adversariale, ou un gate. Un piège vécu deux fois sans gate est une dette.
````

Nouveau :

````text
7. **Un incident donne un ticket au moment où il arrive.** Chaque renvoi du capitaine et chaque échec de vague donne, sur le moment, un ticket (un gate, un critère de la revue adversariale) ou, faute de gate, une ligne de `pieges.md`. Il n'y a pas de bilan de fin de chantier. Un piège vécu deux fois sans gate est une dette.
````

#### R9 — `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md:3`

Ancien :

````text
La rétro d'un chantier (skill `chantier` § 7) ajoute ici une ligne par incident qui n'a pas encore son gate. Un piège vécu deux fois sans gate est une dette.
````

Nouveau :

````text
Un incident qui n'a pas encore son gate reçoit ici sa ligne au moment où il arrive, avec son ticket (skill `chantier` § 7) : il n'y a pas de bilan de fin de chantier. Un piège vécu deux fois sans gate est une dette.
````

#### R10 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:37`

Ancien :

````text
À côté, `pieges.md` : la liste que la rétro de chaque chantier alimente, amorcée avec les pièges déjà connus.
````

Nouveau :

````text
À côté, `pieges.md` : la liste des pièges déjà connus, où un incident sans gate reçoit sa ligne au moment où il arrive.
````

#### R11 — `skills/chaine/tickets/references/CONTENU.md:29`

Ancien :

````text
(une carte `fini` ne réserve plus : sinon deux chantiers se découvrent à la livraison du second), format prêt pour agent,
````

Nouveau :

````text
(une carte `fini` ne réserve plus : sinon deux chantiers se découvrent à la livraison du second ; aucune section `## Rétro` n'est exigée), lignes `Sensibles:` (des chemins puis l'accord, ou `—`) et `Relecture: double` bien formées quand elles sont là, jamais exigées, `Règles: —` pour un ticket qui ne réalise aucune règle, format prêt pour agent,
````

#### R12 — `README.md:90`

Huit espaces à la fin du « Nouveau » : la colonne du tableau garde sa largeur.

Ancien :

````text
suivi sans attente active, rétro ; reprenable ; signale un plafond sans rien couper, arrête un chantier gelé
````

Nouveau :

````text
suivi sans attente active ; reprenable ; signale un plafond sans rien couper, arrête un chantier gelé        
````

### 5. La version et la note, une seule fois pour les tickets 55 et 57

#### V1 — `.claude-plugin/plugin.json:3`

La version est **la suivante de `main` au moment de livrer** (décision 11) : le deuxième nombre de la version d'`origin/main`, plus un, le troisième à zéro. Elle s'écrit dans la ligne `"version"` de `.claude-plugin/plugin.json`, seule ligne du fichier qui change, et dans le titre de la note (N1), ensemble. Aucun numéro n'est écrit dans ce ticket.

#### N1 — `NOTES-DE-VERSION.md:5`

Une seule note pour les tickets 55 et 57 (`A-149`, `A-153`), en tête du fichier, avant la première note d'aujourd'hui (`## <X.Y.Z> — …`), suivie d'une ligne vide ; `<version>` remplacé par la version de V1, `<AAAA-MM-JJ>` par le jour de la livraison. Sa première partie est la note du ticket 57 (sa Décision 12) **mot pour mot** : le titre, le paragraphe de « Ce qui change », les points 1 à 4 ; ce ticket y ajoute deux paragraphes et les points 5 et 6. Elle remplace la note que le ticket 57 écrirait seul : la session ne l'écrit pas deux fois.

````markdown
## <version> — <AAAA-MM-JJ>

### Ce qui change

« Une sous-PR à la fois par sujet » est tenue par le capitaine, plus par le conducteur. À chaque tour de sa boucle, le capitaine ne prend qu'une sous-PR étiquetée par sujet ; les autres attendent leur tour avec leur étiquette (`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` dans le journal), sans mise à jour, ni CI, ni renvoi. Qui tient le sujet le garde, avant tout ordre de numéro : une sous-PR en passage chez un autre capitaine, sinon celle que la boucle tenait au tour précédent, sinon une sous-PR dont la CI tourne ; personne ne le tient, la plus ancienne (le plus petit numéro) le prend. La suivante est prise dans le tour où celle qui tient entre ou sort de la file ; tant que le sujet reste tenu, la boucle le dit à chaque tour (`[sujet/<nom>] tenu par #<n> (<raison>)`). La veille relance la boucle quand la sous-PR qui tient un sujet change d'état ou quitte la file, et une fois quand le verrou d'un autre capitaine qui tenait un sujet a expiré. Le conducteur étiquette toutes les sous-PR prêtes d'une vague : il ne retire ni ne repose plus `à-fusionner` (skill `chantier` § 6), ce qui coûtait jusqu'à 45 minutes d'attente par sous-PR. Une PR de mise à jour d'un sujet s'ouvre, comme avant, sans sous-PR étiquetée devant elle : derrière une sous-PR plus ancienne en route, elle attend son tour, puis elle est à refaire.

Le bilan de fin de chantier est supprimé (décision du produit du 2026-11-18), sans rien à la place : le gate `tickets` n'exige plus de section `## Rétro` pour passer une carte à `fini`, et le skill `chantier`, la méthode, `pieges.md` et le gabarit de carte ne la demandent plus. Un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive, ou, faute de gate, une ligne de `docs/agents/pieges.md`. Une carte qui garde sa section `## Rétro` passe aussi.

Le gate `tickets` juge la forme de deux lignes d'en-tête qu'il ne lisait pas, sans les exiger : `Sensibles:` (`—`, ou des chemins puis ` — accord de <nom>, <AAAA-MM-JJ>`) et `Relecture: double`. Il les lit dans l'en-tête seul, sous les formes `X:`, `**X:**`, `- X:` et `* X:`, sans égard à la casse de la clé ; mal formée, une ligne est refusée, le fichier et la ligne nommés. Aucune garde ne les lit encore. Il accepte `Règles: —`, seul, pour un ticket qui ne réalise aucune règle. Le rôle `relecture` d'une ligne de `## Coût` passe sans être jugé au plafond et compte au registre dans le total, pas dans la part des filles. `Label: contre-revue` reste exigé comme avant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts du capitaine, dans une PR du projet : `/maj-skills:fusionner poser`.
3. Relancer chaque capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). La boucle se remplace d'elle-même par la version de develop ; la veille tourne sur sa copie, c'est elle qu'il faut recopier.
4. D'ici là, le conducteur garde l'ancienne discipline, une seule sous-PR étiquetée à la fois par sujet : un capitaine dont les scripts ne sont pas reposés prend encore toutes les sous-PR étiquetées d'un sujet dans le même tour. Avec plusieurs capitaines, il ne l'abandonne qu'une fois tous relancés.
5. Reposer le gate et les gabarits, dans une PR du projet : `/maj-skills:tickets poser` (`scripts/verify/tickets-regles.mjs`, `tickets.mjs` et leurs tests, `scripts/docs/couts.test.mjs`, les gabarits de ticket et de carte). Une ligne `Sensibles:` ou `Relecture:` mal formée dans l'en-tête d'un ticket rougit alors le gate : la corriger, ou la retirer.
6. Dans la même PR, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) le § 2 sans rétro (le schéma du cycle, la parenthèse du point 2 et le point 7), et dans `docs/agents/pieges.md` sa phrase d'en-tête : un incident donne un ticket au moment où il arrive. Une carte déjà `fini` garde sa section `## Rétro`, sans effet.
````

Contrôle : la note du ticket 57 extraite de sa Décision 12 (le bloc indenté de quatre espaces, l'indentation retirée) se retrouve dans ce bloc ligne pour ligne, dans le même ordre, les deux paragraphes et les deux points de ce ticket ôtés.

## Surfaces

| Surface | Preuve |
| --- | --- |
| une carte `fini` sans `## Rétro` passe ; une carte d'avant qui garde la sienne passe ; `## Coût` reste exigée à `fini` | `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` « carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1 ; à fini, aucune section `## Rétro` n’est exigée » |
| `Sensibles:` : `—`, ou des chemins puis l'accord, passe, avec ou sans accents graves, avec un commentaire ; refusés : valeur vide, chemins sans accord, tiret simple, deux espaces, date mal formée ou qui n'existe pas, nom `session_…` ou gabarit, chemin vide, absolu, à `..`, à blanc, à accolades ; chaque écart est rendu ; trois valeurs hostiles lues en moins de 2 s | `tickets.test.mjs` « Sensibles: `—`, ou des chemins puis l’accord (nom, date), passe ; toute autre forme est refusée, en temps borné » |
| `Relecture:` : `double` passe, avec un commentaire ; toute autre valeur est refusée, majuscule comprise | `tickets.test.mjs` « Relecture: `double` passe ; toute autre valeur est refusée, la valeur nommée » |
| les deux lignes ne se lisent que dans l'en-tête, chaque ligne, sous les formes `X:`, `**X:**`, `- X:`, `* X:`, toute casse de la clé, en LF comme en CRLF ; absentes, rien n'est exigé ; mal formées, l'erreur porte leur ligne ; elles valent pour un ticket qui n'est pas prêt et pour un ticket gelé ; `Label: contre-revue` reste exigé à côté de `Sensibles:` | `tickets.test.mjs` « `Sensibles:` et `Relecture:` ne se lisent que dans l’en-tête, ne sont jamais exigées, et `Label: contre-revue` reste exigé à côté d’elles » |
| `Label: contre-revue` exigé comme avant | `tickets.test.mjs` « un ticket prêt sur un chemin sensible sans `Label: contre-revue` est refusé ; avec, accepté ; l'ancienne valeur `architecte` reste acceptée ; hors chemin sensible, rien n'est exigé », `tickets-gate.test.mjs` « un ticket prêt dont `Fichiers chauds` touche `cheminsSensibles` sans `Label: contre-revue` est refusé ; avec, ou avec l'ancienne valeur, il passe », sans retouche |
| une ligne de coût de rôle `relecture` n'est pas jugée au plafond, même illisible | `tickets.test.mjs` « une ligne de coût au-delà du plafond de son rôle est refusée sans ligne de dépassement pour sa session ; avec, elle passe » (une assertion ajoutée) |
| le gate lancé pour de vrai : `Sensibles:` et `Relecture:` mal formées refusées avec le chemin et la ligne ; bien formées, avec `Règles: —`, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture à 900 k tokens, passe | `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs` « gate complet : `Sensibles:` ou `Relecture:` mal formée est refusée avec le chemin et la ligne ; bien formées, avec `Règles: —`, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture, passe » |
| `Règles: —` seul passe, blancs autour et formes d'en-tête comprises ; mêlé à une règle, répété, entre accents graves, `-` ou `–` sont refusés | `tickets.test.mjs` « Règles: `—` seul dit que le ticket ne réalise aucune règle et passe ; mêlé à une règle, ou un autre tiret, est refusé » |
| le lecteur des mentions de CODEOWNERS lit plusieurs blancs, l'espace insécable, la tabulation, et une mention à cheval sur deux lignes, LF ou CRLF ; il nomme la ligne fautive en CRLF et sur une dernière ligne sans fin de ligne ; un passage admis passe en CRLF et en dernière ligne ; deux lignes voisines sans mention ne s'en fabriquent pas une | `scripts/depot.test.mjs` « lecteur des mentions de CODEOWNERS : entrées piégées » (des entrées ajoutées) ; « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré », sans retouche, reste vert sur le dépôt |
| une session de relecture compte au registre dans le total et les sessions, pas dans les filles ni les tickets | `skills/chaine/tickets/references/scripts/docs/couts.test.mjs` « une session de relecture compte dans le total et les sessions, pas dans les filles ni dans les tickets » |
| le gabarit de carte n'a plus de `## Rétro` et nomme le rôle `relecture` sous `## Coût` | `scripts/depot.test.mjs` « le gabarit de la carte de chantier porte `Gel:` dans sa fiche et la section `## Journal`, nomme le rôle `relecture` sous `## Coût`, et n'a plus de section `## Rétro` » |
| le gabarit de ticket montre les deux lignes après `Label:`, et `—` sur `Règles:` | `scripts/depot.test.mjs` « le gabarit de ticket montre `Sensibles:` et `Relecture: double` dans son en-tête, après `Label:`, chacune à retirer quand elle ne sert pas, et `Règles: —` pour un ticket sans règle » |
| `chantier/SKILL.md`, son `CONTENU.md`, `chaine-de-production.md`, `pieges.md`, le `CONTENU.md` du socle, le gabarit de carte et `README.md` ne nomment plus de rétro ; le skill, la méthode et `pieges.md` disent qu'un incident donne un ticket au moment où il arrive ; la note de version le dit | `scripts/depot.test.mjs` « le bilan de fin de chantier est supprimé : plus aucune rétro dans les textes du conducteur, un incident donne un ticket au moment où il arrive » |
| l'en-tête de `tickets.mjs` et le `CONTENU.md` du skill `tickets` | lecture, en revue (pas de test) |
| la version et la note, une seule pour les tickets 55 et 57 | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` ; `scripts/depot.test.mjs` « la règle d'ascendance du plugin 7.16.0 : version, note de version en tête, renvoi du README » (titre du ticket 57) tient la version et la note en tête ; le test de l'annexe E du ticket 57 et celui du bilan (B9) en exigent chacun deux phrases |

## Vérification

Rejoué le 2026-11-19, sous Node 22.23.5 et pnpm 10.28.0, sur des copies jetables d'un clone de `main` à `6087604` où la branche de la PR 138 est fusionnée (avance rapide, sommet `7b2be5b`, plugin 7.33.0). Chaque bloc de ce ticket a été tiré de ce fichier par un script qui ne lit que lui (« Ancien », « Nouveau », « Bloc retiré », « Ajouté à la fin du fichier », V1 et N1) et appliqué dans l'ordre du texte : ce qui suit est le résultat de ce texte. Le ticket 57 a été appliqué par l'outil de son rédacteur, qui ne lit que le ticket 57 (ses annexes A à F et sa Décision 10), sans sa version ni sa note, remplacées par V1 et N1. Pour jouer, V1 a pris 7.34.0 et N1 le 2026-11-19 : la session prend les siens (décision 11).

- **Les bornes** : les quarante et un blocs, chacun une fois dans son fichier, sur l'arbre de la PR 138 comme sur cet arbre où le ticket 57 est déjà appliqué.
- **Le banc d'abord** (§ 0, B1 à B11), sur l'arbre de la PR 138 : **124 tests, 10 rouges**, ceux que nomme le § 0 ; sur l'arbre où le ticket 57 et la note commune sont déjà là : **125 tests, 10 rouges**, les mêmes (le test de plus est celui de l'annexe E du 57, vert).
- **Tout appliqué** (§§ 0 à 5) : les quatre fichiers du banc, **124 sur 124** sur l'arbre de la PR 138, **125 sur 125** avec le ticket 57. Ce ticket seul : 17 fichiers, ceux de « Fichiers chauds », 310 insertions, 37 retraits ; `chantier/SKILL.md` : 126 lignes (128 avant), `git diff --numstat` `4 6`. L'arbre obtenu par les blocs est, fichier par fichier, celui où ce ticket a été écrit et joué.
- **Les deux tickets ensemble** : 25 fichiers (24 modifiés, un nouveau, `une-sous-pr-a-la-fois.test.mjs`), 1 048 insertions, 56 retraits ; dans les quatre fichiers communs, `git diff --numstat` : `5 7` pour `chantier/SKILL.md` (126 lignes), `104 5` pour `scripts/depot.test.mjs`, `1 1` pour `plugin.json`, `19 0` pour `NOTES-DE-VERSION.md`. Le ticket 57 d'abord puis celui-ci, ou celui-ci d'abord puis le 57, donnent le même arbre (`git write-tree` : `8333143a2d965e3c58e056a8481d7eb3f3d9bdf7`, avec 7.34.0 et le 2026-11-19). Les cinq empreintes du ticket 57 (« Si le ticket 54 est entré avant ») s'y retrouvent : `boucle.sh` `c608d88c…`, `veille.test.mjs` `55675e93…`, `veille.sh` `1bc3dd1d…`, `une-sous-pr-a-la-fois.test.mjs` `418917f5…`, `sujet-fusionner.test.mjs` `16919936…`. Le ticket 57 appliqué avec la note commune, avant ce ticket : `node --test scripts/depot.test.mjs`, 64 sur 64.
- **`git diff -- '*.test.mjs' | grep -c "^-.*assert"`** : **1** pour ce ticket seul (l'assertion de B3, remplacée par trois), **2** pour les deux tickets (s'y ajoute celle de l'annexe C du 57). `couts.mjs` ne change pas.
- **Mutations**, sur l'arbre des deux tickets, chacune jouée seule, ses tests rejoués (le ou les fichiers du banc qui la tiennent), puis le texte remis (`git status` identique avant et après) : **55 rouges sur 55**, et deux vertes attendues, nommées ci-dessous.

  | Changement | Mutations, toutes rouges |
  | --- | --- |
  | le bilan (G1, M2, R1 à R12) | `## Rétro` de nouveau exigée à `fini` ; `## Rétro` remise dans le gabarit de carte ; « et rétro » remis dans `chantier/SKILL.md` ; l'ancienne phrase remise dans `pieges.md` ; le point 7 de la méthode redevenu « **Rétro.** » ; « rétro » remis dans le `README.md` ; la phrase « **Aucun bilan de fin de chantier** » récrite en demande de bilan |
  | `Sensibles:` (G4) | la date non vérifiée au calendrier ; un nom `session_…` accepté ; le commentaire de gabarit refusé ; des chemins sans accord acceptés ; un segment `..` accepté ; un chemin absolu accepté ; `—` suivi d'autre chose accepté |
  | `Relecture:` (G4) | `ecartsRelecture` qui accepte tout ; la valeur lue sans égard à la casse ; le commentaire de gabarit refusé ; `double double` accepté ; la valeur absente du message |
  | l'en-tête (G2, G5) | les lignes lues dans tout le fichier ; la forme nue seule (la version du 2026-11-18) ; la clé lue à la casse près ; la puce étoile non lue ; la première ligne `Relecture:` seulement ; la fin de ligne CRLF gardée ; un ticket gelé dispensé ; `Sensibles:` qui dispense de `Label: contre-revue` |
  | `Règles: —` (G9, M4) | `—` refusé ; `—` suivi d'une règle accepté ; `-` et `–` acceptés ; `—` entre accents graves accepté ; `— —` accepté ; le gabarit de ticket sans `—` |
  | le lecteur du banc (L1, L2, B10) | le motif d'avant ; ni espace insécable ni tabulation (`[ _-]*`) ; le texte entier non relu ; relu sans réduire les blancs ; relu en ne réduisant que les fins de ligne LF (la mention en CRLF rougit) ; relu même après une faute ; la dernière ligne non lue ligne à ligne (l'entrée sans dernière fin de ligne rougit) |
  | le rôle `relecture` (B4, B6, B7, M1) | jugé au plafond comme une fille ; jugé comme le conducteur ; compté comme une fille au registre ; retiré du total ; retiré du gabarit de carte |
  | le gabarit de ticket (M3) | la ligne `Relecture:` retirée ; la ligne `Sensibles:` retirée ; `Sensibles:` sans « ou retirer la ligne » ; `Relecture:` dite exigée ; les deux lignes après `Dépendances:` |
  | la note commune (V1, N1) | le paragraphe du bilan retiré ; le paragraphe du gate retiré ; la partie du ticket 57 retirée ; la note placée sous la précédente ; `plugin.json` en avance sur la note |

  Vertes, attendues : **un bilan redemandé ailleurs sans le mot « rétro »** (un point « Faire le bilan du chantier dans la carte, section `## Bilan` » ajouté au § 7 de `chantier/SKILL.md`), limite écrite dans « Ce qui n'a pas été établi » ; **les lignes du lecteur coupées au seul LF** (`texte.split("\n")` au lieu de `lignes(texte)` dans `mentionsFautives`), mutation équivalente : le `\r` restant ne change ni le numéro de ligne ni ce que le motif reconnaît.
- **Le gate lancé pour de vrai**, par B6 : `tickets.mjs` joué en ligne de commande sur deux dépôts jouets (`depotJouet`), l'un conforme (avec `Règles: —`), l'autre aux deux lignes mal formées.
- **La suite entière, une fois**, sur l'arbre des deux tickets, après `pnpm install --frozen-lockfile` : **1 105 tests, 1 104 verts** en 15 min 57 s (charge de 7 à 12, deux autres agents sur la machine) ; le seul rouge, « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (`scripts/poses.test.mjs`), l'est par son plafond de 600 s : l'enfant a été coupé au milieu de ses bancs (600 103 ms, aucun cas en échec dans sa sortie, statut 1 au lieu de 0). Rejoué seul juste après, sur le même arbre : **1 sur 1, vert, en 552 s**. 1 105, c'est 1 080 (le compte d'`origin/main` avec la PR 138, qu'annonce sa description) plus les 25 tests que les deux tickets déclarent en plus (29 `test(` ajoutés, 4 retirés, tous récrits : 17 du ticket 57, 8 de celui-ci).

Pour la session :

1. Partir d'`origin/main`, la PR 138 entrée ; jouer d'abord le ticket 57 jusqu'à ses textes, puis la version et la note communes, puis ce ticket : « Dans la même PR que le ticket 57 ». Sur cet arbre, le § 0 : **dix rouges**, ceux que nomme le § 0. Les §§ 1 à 4 : les quatre fichiers du banc, verts.
2. Les mutations du tableau ci-dessus, une à la fois, chacune retirée avant la suivante : chacune rougit au moins un test des quatre fichiers du banc.
3. La suite entière, une fois pour les deux tickets : `pnpm install --frozen-lockfile`, puis `pnpm test`, verte, **le compte d'`origin/main` plus 25** (17 du ticket 57, 8 de celui-ci : quatre dans `tickets.test.mjs`, un dans `tickets-gate.test.mjs`, un dans `couts.test.mjs`, deux dans `depot.test.mjs`). Si `scripts/poses.test.mjs` est le seul rouge et qu'il l'est par son plafond de 600 s sur une machine chargée, le rejouer seul (`node --test scripts/poses.test.mjs`), et le dire.
4. Sur le diff commun : `git diff origin/main --stat` ne montre que les 25 fichiers (« Dans la même PR que le ticket 57 ») ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend **2** ; `git diff origin/main --stat -- skills/chaine/tickets/references/scripts/docs/couts.mjs` ne rend rien ; `wc -l skills/chaine/chantier/SKILL.md` : 126 ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` ; `NOTES-DE-VERSION.md` porte une seule note nouvelle, en tête, à la version de `plugin.json`.
5. Revue de ticket (ses trois axes), sa section dans le corps de la PR, pour chacun des deux tickets.
6. La PR vise `main`, hors brouillon, **sans `à-fusionner`** ni commentaire `à-fusionner au sommet <sha>` ; la session écrit à l'architecte dès sa PR livrée. Elle lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Que la forme de `Sensibles:` retenue ici soit celle que liront les gardes** : `A-74` donne un exemple et une phrase, pas une grammaire. Les précisions de la décision 3 (accents graves facultatifs, commentaire de gabarit, nom qui n'est pas une session, jour qui existe, `..` refusé) sont du rédacteur. Si le ticket des gardes en veut une autre, le gate et son banc suivent dans ce ticket-là.
- **L'accord lui-même** : c'est une session qui écrit le nom de qui a accordé ; le gate lit une forme, il ne prouve rien (limite écrite dans la spec, « Ce que cette spec ne ferme pas »).
- **Le plafond de contexte d'une session de relecture** : `A-87` dit qu'elle « se signale au conducteur, comme tout plafond » ; ce ticket ne la juge pas, comme tout rôle autre que `fille` et `conducteur`.
- **Les cartes des projets** n'ont pas été relues une à une : seule l'absence des deux lignes dans les tickets a été vérifiée (« Repose dans un projet »).
- **Le banc des textes** tient l'absence du mot « rétro » dans sept fichiers et trois passages mot pour mot ; une phrase qui redemanderait un bilan sous un autre mot passerait (mutation jouée, verte : « Vérification »).
- **Le motif du calcul « double relecture exigée »** : lu sur la branche du ticket 60 (PR 134, `719f531`), pas dans `main`. Si cette PR change `ligneDEnTete` avant d'entrer, ou lit `Sensibles:` autrement, le gate et le calcul ne liront plus les mêmes lignes ; la session de ce ticket ne le vérifie pas, celle du ticket 60 ne connaît pas ce ticket. Qui fera entrer la seconde des deux devrait comparer les deux motifs.
- **Le lecteur élargi du banc sur un autre dépôt** : vu vert sur ce dépôt seul (le parcours « CODEOWNERS n'est plus nommé… », sur l'arbre de ce ticket et sur celui des deux tickets). Un texte futur qui finirait une ligne par « code » et commencerait la suivante par « owner » serait pris pour une mention.
- **Le ticket 57 joué ici** l'a été par l'outil de son rédacteur (`appliquer.mjs`, qui ne lit que le ticket 57), pas à la main ; ses mutations et sa suite propre n'ont pas été rejouées ici, seulement la suite entière des deux tickets ensemble.
- **Les cartes et tickets des deux autres projets** n'ont pas été relus le 2026-11-19 : seule la copie locale d'un des trois l'a été (« Repose dans un projet »).

## Hors périmètre

- **Les gardes des fichiers sensibles** (`A-73` à `A-76`) : le hook d'édition, `sujet.sh fusionner`, `passer.sh`, la section `## Fichiers sensibles` de la carte. Aucune ne lit encore la ligne.
- **`Relecture: double` exigée** sur un ticket qui cite une règle haute, et **`Label: contre-revue` relâché** : avec le régime de la relecture indépendante, pas avant.
- **Le skill `relecture`, le Relecteur**, les lignes `Relecteur:` et `Relecteurs:` des cartes, le coût relevé d'une session de relecture par qui archive.
- **Le § 3 de `chaine-de-production.md`** et `issue-tracker.md`, qui décrivent l'en-tête d'un ticket prêt : ils nommeront les deux lignes quand une garde les lira.
- **Une colonne « allers-retours de relecture »** au registre des coûts.
- **La repose dans les projets** : par leur architecte.

## Comments

- 2026-11-18 — Rédigé sur `4a45634` (plugin 7.15.0, 738 tests) et sur le ticket 54 joué (711 tests), d'après `P-57`, `A-95`, `A-74`, `A-82`, `A-87` et le lot 2 de la spec du chantier 3. Inventaire refait par recherche (`Rétro`, `rétro`, `bilan`, `Sensibles`, `Relecture:`, les rôles de `## Coût`), chaque occurrence lue. Joué sur un clone jetable : 718 tests, dix-huit mutations rouges. Écart avec la spec, relevé : elle fait « accepter » au gate trois écritures qu'il ne refuse pas aujourd'hui, et range `couts.mjs` parmi les fichiers du lot alors que rien n'y change ; ce ticket fait juger la forme (décisions 3 à 6) et prouve le reste par des tests. Choix du rédacteur : (1) la grammaire de `Sensibles:` (décision 3) ; (2) les deux lignes lues dans l'en-tête seul, sur tout ticket (décision 4) ; (3) `Relecture:` à la casse près (décision 6) ; (4) le vocabulaire des rôles laissé ouvert (décision 8) ; (5) `pieges.md` gardé comme liste des pièges, alimenté à l'incident (décision 2) ; (6) les mots des gabarits (décision 9).

- 2026-11-18 — Architecte : ticket écrit et joué sur `origin/main` à `4a45634` (7.15.0). `main` est depuis à `1c4acb1` (7.17.0) et le programme « capitaine à jour et testé » modifie plusieurs fichiers de ce ticket (`passer.sh`, `boucle.sh`, `faux-gh.mjs`, `regles.mjs`, `chantier/SKILL.md`). **`needs-info` jusqu'au rejeu des blocs sur `main`**, une fois ses tickets chauds entrés : repères de ligne, compte de tests, numéro de version et note dans `NOTES-DE-VERSION.md` (fichier né en 7.16.0) sont à reprendre ; les décisions du ticket, elles, tiennent.

- 2026-11-19 — **Rejoué sur `main` à `6087604` (plugin 7.32.0), la PR 138 (ticket 54) entrée** (sa branche fusionnée, sommet `7b2be5b`, 7.33.0), complété, et passé `ready-for-agent` (`Label: contre-revue`, `Blocked by: 54`, `Modèle: opus`). Les décisions 1 à 3 et 5 à 10 tiennent telles quelles.
  **Ce que le rejeu a changé.** (1) Les trente-deux blocs d'avant se retrouvent chacun une fois ; `main` n'a touché ni le gate, ni `couts.mjs`, ni les gabarits. Bougent : des repères (`README.md:90`, `chaine-de-production.md:146` ; R10 est à la l. 37, pas à la l. 33 qu'annonçait la version d'avant), l'en-tête de B9 (le fichier ne finit plus sur les tests du ticket 54 mais sur ceux du ticket 21 de l'autre programme), les comptes. (2) **La décision 4 était fausse** sur un fait : `Type:` et `Règles:` ne se lisent pas « à leur forme nue » mais sous trois formes (`enTete`, déjà à `4a45634`) ; et le calcul du lot 3c (branche du ticket 60) lit `Relecture:` sous quatre formes, sur chaque ligne de l'en-tête (`A-113`). G2 et G5 prennent son motif, B5 gagne ses cas. (3) **`A-117` manquait** : `main` refuse `Règles: —` (vu) ; G9, G10, M4, B11, décision 14. (4) **`A-145` porté** : L1, L2, B10, décision 15, et les deux constats de la revue de ticket de la PR 138 (CRLF, dernière ligne sans fin de ligne) en entrées piégées. (5) La version sort du ticket (V1, sans numéro) et une note commune avec le ticket 57 entre (N1, sa note mot pour mot puis la nôtre) ; `NOTES-DE-VERSION.md` rejoint « Fichiers chauds ». (6) Deux sections nouvelles : « Dans la même PR que le ticket 57 », « Si la PR 138 bouge encore » ; la décision 12 passe à `Label: contre-revue` (PR commune) et deux tours sur la PR (`P-65`).
  **Choix du rédacteur.** (a) Le gate lit `Sensibles:` et `Relecture:` comme le calcul du lot 3c, toutes formes et chaque ligne, plutôt que la forme nue de la première : une ligne que le calcul lira ne passe jamais le gate mal écrite. (b) `Règles: —` strict : le seul tiret cadratin, seul sur la ligne ; `-` et `–` restent refusés alors que le calcul les lit, et le message d'une ligne vide ne change pas (un test le tient mot pour mot). (c) Le gabarit de ticket montre `—` sur `Règles:` (M4) : `A-117` veut un moyen écrit de dire « aucune ». (d) Les entrées CRLF et sans dernière fin de ligne sont vertes dès l'écriture : elles tiennent ce que le lecteur fait déjà, et deux mutations (fins de ligne LF seules réduites, dernière ligne non lue) les font rougir ; une troisième, les lignes coupées au seul LF, est équivalente et reste verte. (e) La note commune est donnée entière dans N1, la note du 57 recopiée de sa Décision 12 et contrôlée mot pour mot, plutôt qu'une consigne d'insertion. (f) Une section de revue de ticket par ticket, dans la même PR. (g) L'ordre : le ticket 57 d'abord, comme il l'écrit ; l'ordre inverse donne le même arbre.
  **Comptes vus**, sur des copies jetables : 41 blocs, chacun une fois, sur l'arbre de la PR 138 et sur celui où le ticket 57 est appliqué ; banc vu rouge, 124 tests et 10 rouges (125 et 10 avec le ticket 57), puis 124 sur 124 (125 sur 125) ; ce ticket seul, 17 fichiers, 310 insertions, 37 retraits ; les deux tickets, 25 fichiers, le même arbre dans les deux ordres (`8333143a…`), les cinq empreintes du ticket 57 retrouvées ; mutations, 55 rouges sur 55, et deux vertes attendues ; suite entière, une fois, sur l'arbre des deux tickets : 1 105 tests, 1 104 verts, le seul rouge étant `scripts/poses.test.mjs` à son plafond de 600 s sous charge (de 7 à 12), vert rejoué seul (552 s). Lu en plus : `main` refuse `Règles: —` ; la branche du ticket 60 (`719f531`) lit `Relecture:` par `ligneDEnTete` ; le CLI d'Anchorpost ne tire que des identifiants d'une ligne `Règles:` ; la copie locale d'un projet n'a ni `Sensibles:`, ni `Relecture:`, ni `Règles: —` dans un en-tête.
