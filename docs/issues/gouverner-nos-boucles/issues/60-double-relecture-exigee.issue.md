# « Double relecture exigée » : un seul calcul, avec son lecteur de règles et d'index, écrit et testé avant tout appelant

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — deux fichiers neufs donnés entiers (le calcul, son banc), un mot ajouté à une phrase, une version et sa note données mot pour mot ; le tout a été joué sur une copie jetable de `origin/main`, suite entière et mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: — dans ce programme comme dans l'autre : le lot 3c part tout de suite (`A-109`). Les tickets 58 (lot 3a) et 59 (lot 3b) partent en même temps, prennent eux aussi une version et une note, et le 58 ajoute lui aussi un mot à la même phrase de `fusionner/SKILL.md`, que l'autre programme écrit aussi : partir de `main`, reprendre `main` avant de livrer.
Dépendances: —
Fichiers chauds: `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `skills/chaine/fusionner/SKILL.md` (un mot, étape 0). Deux fichiers neufs, que personne d'autre n'écrit : `skills/chaine/fusionner/scripts/double-relecture.mjs`, `skills/chaine/fusionner/scripts/double-relecture.test.mjs`.

## Le besoin

Ce ticket réalise le lot 3c de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (sixième version, `A-110` à `A-117` compris) : la décision `A-82`, amendée par `A-113` et `A-117`, pour la décision du produit `P-56` (« Règle de criticité haute : deux relectures indépendantes, et un message d'information au produit, sans que la PR l'attende ») et pour `A-90`.

**La décision.** `A-82`, mot pour mot :

> **« Double relecture exigée », un seul calcul**, de même. (Amendée par `A-113` : la ligne `Règles:` est lue aussi, le niveau se lit en plus sur `origin/develop`, l'en-tête du ticket se lit comme `Sensibles:`, et un changement de niveau vers ou depuis « haute » suffit.) Une PR l'exige quand son ticket porte la ligne `Relecture: double`, ou quand son diff touche le fichier d'une règle de criticité haute ou un fichier que le champ `code:` de cette règle nomme. Le niveau se lit sur la base **et** sur la tête de la PR (une PR qui monte elle-même une règle à haute est vue) : dans l'index Anchorpost du dépôt quand il en a un, qui porte le niveau effectif, criticité reçue d'une feature comprise — le ticket nomme le champ après lecture du schéma pivot, aucun lecteur n'existe aujourd'hui dans le plugin ; sinon dans l'en-tête des fichiers de règle (`criticality`, valeur `high`, sous ses deux formes), qui ne voit pas une criticité reçue d'une feature. `code:` est facultatif : une PR sans ticket qui touche le code d'une règle haute sans champ `code:` n'est pas vue, c'est écrit dans les limites. Le calcul tourne depuis la copie de travail de la boucle du capitaine, qui n'a que `scripts/chaine` et `scripts/docs/identifiants.mjs`, repris d'`origin/develop` à chaque tour, et aucune dépendance (amendée en sixième version) : il lit l'en-tête YAML des règles sans bibliothèque, son lecteur de règles vit sous `scripts/chaine`, et c'est la version de `develop` qui juge une sous-PR. La ligne `Relecture: double` se lit sur la base de la PR, par l'identifiant du ticket de sa branche. Le Relecteur et le capitaine refont tous deux ce calcul au moment de décider : le nombre écrit dans une distribution n'est qu'une information.

Et `A-113`, qui tranche les points que la première version de ce ticket avait fait remonter : « le calcul ne doit laisser passer aucune PR qui réalise ou déplace une règle haute avec une seule relecture, et se trompe du seul côté sûr ». Ses cinq changements, mot pour mot :

> - **La ligne `Règles:` du ticket est lue.** Une PR exige la double relecture quand son ticket cite une règle dont le niveau effectif est haut, même sans champ `code:` ni ligne `Relecture: double`. `Relecture: double` reste, comme ordre écrit à la main.
> - **Le niveau se lit sur trois arbres** : la base de la PR, sa tête, et `origin/develop` ; le plus haut l'emporte. Un sujet en retard sur `develop` ne cache pas une règle montée. C'est ce que `revue-exigee.mjs` fait déjà pour le contrat.
> - **L'en-tête du ticket se lit là où `A-74` lit `Sensibles:`** : sur la base de la PR, sur `origin/develop` et sur les `origin/sujet/*` ; une seule lecture qui dit « double » ou cite une règle haute suffit. Une PR `hors-sujet` dont le ticket ne vit que sur son sujet est vue.
> - **Une PR qui change le niveau effectif d'une règle vers ou depuis « haute »** exige la double relecture, même si elle ne touche ni le fichier de la règle ni son code : c'est le cas d'une criticité fixée sur une feature dans le manifeste.
> - **Le ticket de la PR** a une seule définition dans le plugin, celle que le capitaine emploie déjà ; quand le titre et la branche nomment deux tickets, les deux sont lus.

Et `A-117`, après la relecture adversariale de ce ticket, qui avait reproduit quatre faux « non exigée » :

> - Le calcul se place à la racine du dépôt et n'obéit à aucun réglage du dépôt, de l'utilisateur ou du dossier courant, comme « même contenu propre » (`A-114`) ; les références se lisent en entier (`refs/remotes/origin/…`).
> - Les lignes `Règles:` et `Relecture:` se reconnaissent par le motif que le gate `tickets` emploie déjà (gras, puce, casse) : une ligne que le gate lit ne peut pas échapper au calcul.
> - Le lecteur d'en-tête YAML retire le commentaire de chaque ligne et refuse une clé en double ; un index à deux entrées de même clé est illisible ; les chemins de `code` sont normalisés.
> - L'entrée du calcul est contrôlée : une liste de fichiers qui n'a pas la forme attendue, ou qui nomme un chemin absent du départ comme de la tête, est illisible ; l'appelant la produit sans détection de renommage.
> - **Le ticket se lit aussi sur la tête de la PR** : un ticket que la PR crée elle-même est vu.
> - **Un ticket sans ligne `Règles:` hérite de celle de sa spec** ; un ticket qui porte `Règles: —` dit lui-même qu'il n'en réalise aucune, et sa spec n'est alors pas lue. Raison : dans le doute, deux relectures, et le conducteur garde un moyen écrit de dire « aucune ».

`A-90` : « Une règle montée à haute après un tour validé à un seul verdict : le tour redevient en cours, et la règle 5 lui ajoute une session. » `A-106` donne la règle des lectures : « Une lecture en échec ne vaut jamais « même » » ; ici, jamais « non exigée ».

**Le fait, sur `origin/main` à `085d7d4`** (plugin 7.20.0) :

- Aucun script du plugin ne lit la criticité d'une règle. `contexte-ticket.mjs` (revue de ticket) et `contexte-regle.mjs` (skill `criticite`) rendent un fichier de règle tel quel, sans lire son en-tête ; `mutation-regles.mjs` (socle-tests) lit dans l'index le champ `code` des règles prouvées, au schéma "2", mais il se pose sous `scripts/verify/`, que la copie de travail de la boucle ne porte pas.
- Personne n'appelle encore ce calcul : ses deux appelants sont le Relecteur (lot 4) et le capitaine (lot 5a), qui lui passeront, eux, le diff qu'ils jugent.
- L'étape 0 de `fusionner/SKILL.md` (`:14`) pose tous les `.sh`, nomme les `.mjs` un à un, et fait suivre tous les bancs : un `.mjs` neuf qu'elle ne nomme pas laisserait partir son banc seul dans un projet qui repose.

**Quand le ticket est fait** : un fichier sans dépendance, à côté des scripts du capitaine, répond pour une PR (la liste de ses fichiers changés, sa cible, son sommet, son titre, sa branche) « exigée » avec les règles ou le ticket en cause, « non exigée », ou « illisible » ; son banc le tient sur des fichiers de règle et un index à la forme du standard, joue la ligne de commande depuis une copie des outils faite comme celle de la boucle, et chaque mutation de la liste le fait rougir ; l'étape 0 de `fusionner` nomme le module. Rien d'autre ne change dans le plugin : aucun script ne l'appelle.

## Où

Base : `origin/main` à `085d7d4` (plugin **7.20.0**). `main` a avancé sept fois depuis le `1c4acb1` de la spec (PR 113, 111, 116, 117, 118, 114 et 120). La dernière, le ticket 8 de l'autre programme, a touché `boucle.sh`, `veille.sh` et `fusionner/SKILL.md` (hors de sa ligne 14) : les repères de ligne ci-dessous valent à `085d7d4`. Les versions 7.19.0 et 7.20.0, que les états précédents de ce ticket prenaient, sont prises. La session relit `main` avant de partir.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/double-relecture.mjs` | **neuf** : le calcul, ses lecteurs, sa ligne de commande (§ 2) |
| `skills/chaine/fusionner/scripts/double-relecture.test.mjs` | **neuf** : son banc, 35 tests (§ 1) |
| `skills/chaine/fusionner/SKILL.md:14` | un mot : le module entre dans la liste des `.mjs` posés (§ 3) |
| `.claude-plugin/plugin.json:3` | la version, mineure (§ 4) |
| `NOTES-DE-VERSION.md` | la note, en tête (§ 4) |

Aucun autre fichier : la vérification le montre par une commande.

### Lus, non modifiés

- `skills/chaine/fusionner/scripts/boucle.sh:54-60` et `:212-238` (`rafraichir_outils`) : à chaque tour, `git archive origin/develop scripts/chaine` (`:221`) puis `scripts/docs/identifiants.mjs` (`:225`), extraits dans `<git-common-dir>/boucle-outils`. Rien d'autre n'y est : ni `scripts/verify/`, ni `scripts/docs/` hors la grammaire, ni `node_modules`, ni `docs/`, ni `anchorpost/`.
- `skills/chaine/fusionner/scripts/identifiant.mjs:27-29` : la grammaire des identifiants cherchée en trois endroits (`../docs/`, à côté, puis dans le plugin). Le calcul fait de même.
- `skills/chaine/fusionner/scripts/revue-exigee.mjs:70` (`cheminLu`, les guillemets de `git diff --name-only`), `:122` (`lireBase` ajoute le contrat d'`origin/develop` à celui d'un sujet), `:165` (`lireGit`).
- `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs:52-53`, `:73`, `:104`, `:134` (ci-dessous).
- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:14` (`enTete` : le motif par lequel le gate reconnaît une ligne d'en-tête, en gras, en puce, sans égard à la casse), `:41` (`reglesCitees` : comment il découpe une ligne `Règles:`), `:435` (`ecartsRegles` : il refuse aujourd'hui `Règles: —`).
- `skills/chaine/tickets/references/gabarits/regle.md:20-21` (les clés `code` et `criticality` du gabarit), `skills/chaine/criticite/SKILL.md:21` et `:58` (le pivot, les formes de `criticality`), `skills/chaine/anchorpost/references/rules/anchorpost.md:23` et `:43` (« Une règle est un fichier », « Le manifeste et l'index »).
- `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs:34`, `:80-82` : le seul lecteur de l'index du plugin (`rules[].key`, `rules[].code`, schéma "2").
- `skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs` : `lireIdentifiant`, `dossierDuContexte`, `fichierDuTicket`, `estArchive`, `identifiantDeBranche` (`:120`), `ticketDeLaPr` (`:170`).
- `scripts/poses.test.mjs:14-22`, `:49`, `:75` ; `scripts/points-d-entree.test.mjs:17-27` ; `scripts/depot.test.mjs:1093-1103` ; `README.md:169`, `:188`.
- Dans Anchorpost, le schéma pivot : `packages/schema/src/v2/index-schema.ts` et `enums.ts` sur son `develop`, `packages/schema/src/v3/index-schema.ts` sur `sujet/preuve-suffisante-cas` à `74a37c8`.

### Les formes lues

**Un fichier de règle** : `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, un en-tête YAML entre deux lignes `---`, puis l'énoncé. Trois clés de premier niveau comptent ici.

````yaml
---
id: RULE_ALL_FAC-16
title: Le total d'une facture est la somme de ses lignes
validation:
  status: validated # candidate | validated | rejected | obsolete
  date: 2026-11-16
criticality: # la forme d'aujourd'hui, pivot 3 ; aussi sur une ligne : { level: high, by: agent, reason: "…" }
  level: high
  by: agent
  reason: "Une erreur coûte de l'argent."
code: # facultatif ; aussi sur une ligne : [ apps/api/src/facture/total.ts ]
  - apps/api/src/facture/total.ts
---
````

La forme d'avant, au pivot 2 : `criticality: high`, nue. Ce sont « ses deux formes » d'`A-82`.

**L'index** : `anchorpost/anchorpost.json`, généré par la CLI Anchorpost, clés triées, `"schema"` vaut `"2"` ou `"3"`. Chaque règle est une entrée de `rules` :

- `key` : l'identifiant de la règle, tel qu'il est écrit, zéros de tête compris (`RULE_FNSMR_LIC-05`) ;
- **`criticality.level`** (`low`, `medium`, `high`) : **le champ qu'`A-82` demande de nommer**, le niveau effectif, le plus haut de ce que la règle reçoit de son fichier ou d'une feature ; `criticality.origin` dit d'où (`declared`, `feature`), `criticality.declared`, au pivot 3 seul, garde ce que le fichier fixe. Sans `criticality`, la règle est « à classer » ;
- `code` : la liste des chemins de l'en-tête, triée ;
- `validation.status`.

`criticality` est dans le schéma de l'index **dès le pivot 2** (objet `{ level, origin, features? }`, facultatif : un index écrit par une CLI plus ancienne ne le porte sur aucune règle) ; le pivot 3 lui ajoute `declared`. Le calcul lit donc le même champ aux deux pivots.

### Ce que la copie de travail de la boucle impose

1. **Le fichier vit dans `fusionner/scripts/`**, que l'étape 0 de `fusionner` copie dans `scripts/chaine/` d'un projet : c'est de là, une fois dans `develop`, que la boucle le reprend. Un projet qui n'a pas reposé ne l'a pas ; ses appelants (lots 4 et 5a) en répondent.
2. **Il ne lit jamais l'arbre de travail.** La copie est sous `.git`, hors du dépôt : `new URL('../..', import.meta.url)`, l'idiome de `contexte-ticket.mjs`, y désignerait la copie. Et l'arbre de travail du capitaine est sur une autre branche que la PR jugée. Tout se lit dans des objets git : `rev-parse`, `merge-base`, `for-each-ref`, `ls-tree`, `cat-file --batch`. Et de la même façon d'où qu'il soit lancé (`A-117`) : une réf est d'abord résolue en entier (`refs/remotes/origin/…`) vers son sha, toutes les lectures prennent ce sha, les arbres se listent depuis la racine (`ls-tree --full-tree`), un objet se nomme `<sha>:<chemin>`, et `git` est lancé avec `--no-replace-objects`.
3. **Il n'importe que `node:*` et la grammaire** `scripts/docs/identifiants.mjs`, que la copie porte. Ni `yaml`, ni `zod`, ni un script de `scripts/verify/` ou de `scripts/docs/` (le lecteur des lignes `Relecture:` et `Règles:` du gate `tickets`, celui de `mutation-regles.mjs`) : ils n'y sont pas. D'où un lecteur d'en-tête YAML écrit ici, pour trois clés, et le motif du gate recopié ici, avec sa découpe d'une ligne `Règles:`.
4. **C'est la version de `develop` qui juge**, sous-PR d'un sujet plus ancien comprise : le lecteur accepte donc ce qu'un sujet en retard porte encore (un index au pivot 2, la forme nue de `criticality`).

### Ce que ce lecteur partage avec `contexte-ticket.mjs`, et ce qu'il ne partage pas

Il partage **la grammaire** (`identifiants.mjs` : aucun des deux n'écrit un motif d'identifiant), **la convention du chemin d'une règle** (`docs/metier/regles/<dossier du contexte>/<identifiant>.md`, `contexte-ticket.mjs:134`), **la recherche du fichier d'un ticket** par `fichierDuTicket` hors archive, **la recherche de sa spec** par `identifiantDeLaSpec`, **la limite de l'en-tête d'un ticket** (avant la première section `## `, `:104`) et **la ligne `Règles:`** de cet en-tête comme liste des règles du ticket.

Il ne partage **aucun code** : `contexte-ticket.mjs` s'exécute à l'import, n'exporte rien, lit le disque depuis la racine qu'il déduit de son propre chemin (`:52-53`, `:73`), reçoit un seul ticket en argument, et rend un fichier de règle sans lire son en-tête. Ici tout se lit sur des réfs, plusieurs pour un même ticket, la ligne `Règles:` se reconnaît à toutes les formes que le gate lit, celle de la spec remplace celle qui manque au ticket, l'en-tête des règles est lu, et un jeton de `Règles:` que la grammaire ne lit pas est une lecture en échec, pas une ligne « illisible » rendue à un relecteur.

## Décisions

Tenues de la spec : `A-82`, `A-90`, `A-106` (les lectures), `A-108` (les règles de `main`), `A-113` (ce que ce lot fixe, les codes de sortie, la pose), `A-114` (le verdict en dernière ligne, le calcul à la racine), `A-117` (les corrections de la relecture adversariale). **Six précisions restent celles de ce ticket** (dans les décisions 3, 5, 9, 13 et 14) : elles sont reprises dans « Ce qui n'a pas été établi ».

1. **Un fichier, un nom.** `skills/chaine/fusionner/scripts/double-relecture.mjs`, posé `scripts/chaine/double-relecture.mjs`. Aucun fichier de ce nom dans les quatre dossiers que `scripts/poses.test.mjs` pose au même endroit (il refuse un nom posé deux fois).
2. **L'appel.**

   ````bash
   git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> \
     | node scripts/chaine/double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]
   ````

   - **Entrée standard** : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only --no-renames` les écrit, guillemets de git compris. C'est l'appelant qui choisit le diff : celui que la relecture lit (`A-76`, `A-78`), que ce calcul ne recalcule pas. **`--no-renames` est dû** : avec la détection des renommages, un fichier de code renommé ne paraît plus sous son ancien nom, celui que la règle nomme ; l'usage et l'en-tête du module le disent.
   - **L'entrée est contrôlée** (`A-117`) : une tabulation ou un octet nul (`--name-status`, `-z`) ; une ligne entre guillemets mal formée ; un chemin qui n'existe ni au départ ni à la tête de la PR : « illisible », et aucune cause n'est tirée du reste de l'entrée. Un fichier supprimé existe au départ, un fichier ajouté à la tête. Un diff vide rend « non exigée » si rien d'autre ne l'exige : l'appelant répond de sa lecture (`A-113`).
   - `--base` : **la branche cible de la PR, un nom de branche** (`develop`, `sujet/<nom>`), comme au ticket 59 : jamais une réf, ni `HEAD`, ni une réf symbolique, ni un texte à blanc, à retour ligne ou à tiret initial. Le calcul lit `refs/remotes/origin/<branche>` en entier, **que l'appelant vient de relire** par un refspec explicite (`A-106`), comme `origin/develop` et les `origin/sujet/*` : ni un tag ni une branche locale du même nom ne la remplacent. `--tete` : **le sommet jugé, un sha de 40 caractères**. Tout autre texte est refusé, sans être recopié ; un nom de branche valide qui n'est pas une branche d'origin est « introuvable ».
   - `--titre`, `--branche` : le titre de la PR et le nom de sa branche de tête, vides admis. Le ticket de la PR est celui que rend `ticketDeLaPr` de la grammaire (le premier que le titre cite, sinon celui de la branche), la définition que les scripts du capitaine emploient déjà par `identifiant.mjs` (`ticket-de-pr`) ; quand la branche en porte un autre, les deux sont lus. Ni l'un ni l'autre : la PR n'a pas de ticket.
   - En module : `doubleRelecture({ fichiers, base, tete, tickets, develop, lecteur })` (`base` et `develop` : des noms de branche ; `tete` : un sha) rend `{ reponse, causes, illisibles, remarques, outilManquant }` ; `ticketsDeLaPr(titre, branche)` rend la liste des tickets ; `brancheDOrigin(nom)` rend la réf entière d'une branche cible, `sommet(sha)` contrôle un sommet ; `lecteur` est le lecteur git par défaut, remplacé par des arbres en mémoire dans le banc.
3. **Les sorties.** La sortie standard porte une ligne par cause, quatre champs séparés par une tabulation (la règle ou le ticket ; le motif, `fichier`, `code`, `niveau`, `Règles:` ou `Relecture: double` ; le chemin ; la réf où c'est lu), puis une ligne `# illisible : …` par lecture en échec et une ligne `# …` par remarque, et, **en dernière ligne, le seul verdict** (`A-114`) : `exigée`, `non exigée` ou `illisible`. Chaque champ et chaque message tient sur une ligne, sans caractère de commande, borné à 500 caractères ; une réf refusée, un chemin inconnu, une ligne mal citée ne sont jamais recopiés : rien de ce qui est reçu ou lu dans le dépôt n'écrit une ligne de plus, ni une ligne qui ressemble au verdict.

   | Sortie | Dernière ligne | Sens |
   | --- | --- | --- |
   | 0 | `non exigée` | une relecture suffit |
   | 20 | `exigée` | deux relectures |
   | 21 | `illisible` | le calcul ne peut pas conclure, usage faux compris |
   | 69 | `illisible` | un outil manque au poste : `git`, ou la grammaire `identifiants.mjs` |

   Ce sont les codes accordés avec le ticket 59 (`A-113`) ; il n'y a pas de code propre à l'usage, qui sort en 21 comme chez lui. Précision de ce ticket : la grammaire introuvable sort en 69, comme un outil manquant (`identifiant.mjs` sort en 6 dans ce cas, code pris par la boucle). **Qui appelle ne lit « non exigée » que sur la sortie 0 et la dernière ligne ensemble** ; tout autre code que 0 et 20, un plantage de `node` (sortie 1) compris, se lit « illisible ».
4. **Cinq causes**, chacune suffit : (a) le ticket de la PR porte `Relecture: double` ; (b) il cite en `Règles:` une règle haute, ou sa spec le fait pour lui ; (c) un fichier du diff est le fichier d'une règle haute ; (d) un fichier du diff est nommé par le champ `code` d'une règle haute ; (e) la PR change le niveau d'une règle vers ou depuis « haute ».
5. **Trois arbres, jamais l'arbre de travail.** Une règle est haute si elle l'est sur la base, sur la tête **ou** sur `origin/develop`. La base est la cible telle que l'appelant vient de la relire, pas la base de fusion : c'est ce qui fait voir une règle montée par une autre PR après le verdict (`A-90`). La tête fait voir la PR qui monte elle-même une règle. `origin/develop` fait voir la règle montée dans `develop` à la sous-PR d'un sujet en retard. Un même commit n'est lu qu'une fois. Précision de ce ticket : un dépôt sans `origin/develop` est « illisible » (aucun dépôt à chaîne n'en manque).
6. **Avec un index** sur l'arbre : `criticality.level` de l'entrée de `rules`, par sa `key` ; `code` et `validation.status` de la même entrée. Schéma `"2"` ou `"3"` ; tout autre schéma est « illisible », comme deux entrées de même `key` (`A-117`).
7. **Sans index** sur l'arbre : l'en-tête de chaque fichier de règle, sous les deux formes de `criticality`. Une criticité reçue d'une feature n'est pas vue : limite écrite de la spec. Ni index ni fichier de règle : aucune règle haute (un projet sans règles métier).
8. **Avec un index, l'en-tête des fichiers de règle que le diff touche est lu en plus, et le plus haut gagne.** Une règle montée, créée haute, ou dont le `code` change dans la PR est vue par son fichier, index régénéré ou non.
9. **Le changement de niveau (cause e) se lit du départ de la PR à sa tête** : l'ensemble des règles hautes et en vigueur du départ, comparé à celui de la tête ; toute règle qui n'est que d'un côté est une cause, lue dans l'index quand la tête en a un, dans les en-têtes sinon. **Précision de ce ticket : le départ est la base de fusion de la cible et de la tête (`git merge-base`), pas la pointe de la cible.** Comparée à la pointe, toute PR ouverte, en retard sur une cible où une autre PR vient de monter ou de baisser une règle, exigerait deux relectures sans rien avoir changé, jusqu'à la mise à jour qui la remettrait d'accord avec sa cible. Une PR à jour a pour départ la pointe de sa cible : la lecture d'`A-113` est alors la même. C'est aussi contre ce départ et cette tête que l'entrée est contrôlée (décision 2). Limite : tant que la PR n'a pas régénéré son index, une criticité fixée au manifeste ne se lit nulle part ; elle est vue dès que l'index de la tête est régénéré, par l'auteur ou par le capitaine avant son second contrôle (`A-105`).
10. **Le fichier d'une règle** est `docs/metier/regles/<dossier du contexte>/<identifiant>.md`, à la racine du dépôt. Un homonyme ailleurs n'en est pas un : les dépôts jouets d'un projet en portent (`apps/…/fixtures/…/docs/metier/regles/all/RULE_….md`). Un chemin de règles hors convention, déclaré au manifeste Anchorpost (`contexts[].rules`), n'est pas reconnu : limite écrite.
11. **Une entrée de `code` nomme un fichier, ou un dossier** : le chemin du diff lui est égal, ou est dessous. Elle est normalisée avant d'être comparée (`A-117`) : `apps//api/…`, `apps/api/./src/…`, `./apps/…`, un détour par `..` nomment le même fichier ; une entrée qui sort du dépôt ne nomme rien.
12. **Une règle `rejected` ou `obsolete` ne compte pas.** Lu sur chaque arbre : la PR qui rejette une règle haute est vue par la base, où elle est encore en vigueur, et par le changement de niveau. Une règle `candidate` compte.
13. **L'en-tête du ticket** (avant la première section `## `) se lit sur la base, sur `origin/develop`, **sur la tête de la PR** (`A-117` : le ticket que la PR crée elle-même est vu) et sur chaque `origin/sujet/*` ; une seule de ces lectures suffit, et un même commit n'est lu qu'une fois. La PR qui retire une ligne de son ticket n'y gagne rien : la base la porte encore. Sur chaque arbre :
    - **Les lignes se reconnaissent par le motif du gate** (`enTete`, `A-117`) : `Règles: …`, `- Règles: …`, `**Règles:** …`, sans égard à la casse ; de même pour `Relecture:`. Une ligne en retrait ou précédée d'un autre texte n'est pas la ligne, pour le gate non plus.
    - `Relecture: double` (un commentaire ` # …` peut suivre) : cause (a). Une ligne `Relecture:` reconnue dont la valeur n'est pas `double` : « illisible ».
    - `Règles:` : des identifiants de règle séparés par des virgules ou des blancs, entre accents graves ou nus, comme le gate les découpe (`reglesCitees`), ou `—`. Chaque règle citée qui est haute sur l'un des trois arbres de la décision 5 est une cause (b). Précisions de ce ticket : un jeton qui n'est pas un identifiant de règle est « illisible » (le gate le refuse, il ne se devine pas) ; le niveau d'une règle citée se lit sur ces trois arbres, pas sur le sujet où vit le ticket.
    - **Un ticket sans ligne `Règles:`** : celle de sa spec est lue à sa place (`A-117`), dans le même arbre, par le même motif, dans l'en-tête de la spec ; la cause nomme alors le fichier de la spec. **`Règles: —` est une ligne** : le ticket dit lui-même qu'il n'en réalise aucune, et la spec n'est pas lue ; de même s'il ne cite que des règles qui ne sont pas hautes.
    - Deux fichiers pour un même ticket, ou pour sa spec, dans un arbre : « illisible ». Un ticket archivé n'est pas lu. Un ticket qu'aucun de ces arbres ne porte : une remarque, aucune cause.
14. **Le ticket de la PR** : `ticketDeLaPr(titre, branche)`, importée de la grammaire sans modifier aucun fichier, puis `identifiantDeBranche(branche)` s'il est autre. Précision de ce ticket : d'un titre qui cite plusieurs tickets, seul le premier est lu, comme `ticketDeLaPr` le fait partout ailleurs.
15. **« Illisible » n'est jamais « non exigée », et une cause établie suffit.** Chaque lecture (l'entrée, chaque arbre, le départ, chaque arbre du ticket) est jouée à part ; une réf refusée ou introuvable, un index qui n'est pas du JSON ou d'un autre schéma, un en-tête que le lecteur ne comprend pas, une entrée mal formée sont des lectures en échec. Si une cause est établie malgré elles, la réponse est « exigée », et les échecs sont dits ; sinon, un seul échec donne « illisible ». Un échec est dit une fois par commit, avec la réf qui l'a lu la première. Ce que le Relecteur et le capitaine font d'« illisible » est dans `A-113` et aux lots 4 et 5a.
16. **Le lecteur d'en-tête ne lit que trois clés de premier niveau** (`criticality`, `code`, `validation`) et refuse ce qu'il ne comprend pas : pas d'en-tête, une clé écrite deux fois, à ce niveau comme dans un mappage en ligne (`A-117` : la dernière ne l'emporte pas), une ligne de première colonne qui n'est ni une clé ni un commentaire, un niveau hors `low`, `medium`, `high`, un `code` qui n'est pas une liste. Il lit la forme nue, le bloc, le mappage et la liste en ligne, même pliés sur plusieurs lignes par un formateur, **le commentaire de chaque ligne retiré avant de les joindre** (`A-117` : celui d'une ligne pliée avalait la suite, ou devenait la valeur), un `#` entre guillemets restant dans sa valeur ; une clé imbriquée (`extensions.<projet>.criticality`) ou commentée n'est pas la clé. Un statut qu'il ne comprend pas laisse la règle en vigueur. **Lecture en temps linéaire** : l'en-tête d'une PR est une entrée que son auteur écrit.
17. **Aucun import d'un autre script de la chaîne.** `cheminDuDiff` est la copie de `cheminLu` de `revue-exigee.mjs`, un fichier que deux tickets de l'autre programme récrivent (16 et 18) ; le banc garde la parité, comme `revue-exigee.test.mjs` le fait pour `regexDuMotif`. Le motif `enTete` du gate est recopié de même : le gate n'est pas dans la copie de la boucle, et le banc tient les mêmes formes.
18. **Deux fichiers neufs, et un mot** (`A-113`, la pose). Le nom du module entre dans la liste de l'étape 0 de `fusionner/SKILL.md:14` : un projet qui repose ne reçoit jamais le banc sans son module. Aucun test du dépôt ne fige cette phrase (`git grep -n "commits-a-relire" -- 'scripts/*.test.mjs'` ne rend rien), et le fichier reste à 117 lignes. Ne sont pas touchés, et le ticket le dit pour qui les écrira : la ligne du calcul dans `fusionner/references/CONTENU.md`, dans `scripts/points-d-entree.test.mjs` et dans l'arbre du `README.md:169` (la spec : « au plus tard avec 3d »). Aucun test de `main` n'exige qu'un script de `fusionner/scripts/` y soit listé (suite jouée : verte) ; en attendant, **le banc prouve lui-même le point d'entrée** (lien symbolique, `--preserve-symlinks-main`, dossier à espace et à accent).
19. **Banc court** : 35 tests, six secondes environ ; le calcul se joue sur des arbres en mémoire, sept tests seulement montent un dépôt git. Il est rejoué, posé à plat, par `scripts/poses.test.mjs` (plafond de 600 s pour l'ensemble, `:75`) : il ne lit jamais l'arbre du plugin, et prend la grammaire là où le module l'a trouvée (`GRAMMAIRE`).
20. **Version : mineure** (7.20.0 → **7.21.0** sur `085d7d4`) : un script de plus dans un skill. **Règle de repli** : les tickets 58 et 59 prennent une version en même temps, et `main` a déjà pris cinq versions pendant l'écriture de ce ticket. Si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, remonte sa note en tête avec ce numéro, garde dans `fusionner/SKILL.md` les mots que les autres y ont ajoutés, puis vérifie (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, `git diff origin/main -- skills/chaine/fusionner/SKILL.md` ne montre que le mot).
21. **`Label: contre-revue`** : le fichier se pose sous `scripts/chaine/`, chemin sensible du gabarit de `.claude/chaine.json`, et il gardera l'entrée des PR. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): double relecture exigée, un calcul et son lecteur de règles et d'index (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Comparer la pointe de la cible à la tête** pour le changement de niveau : décision 9.
- **Lire le manifeste** (`featureCriticality`) pour voir une criticité de feature avant que l'index soit régénéré : le niveau effectif est un calcul de la CLI Anchorpost (la feature, ses specs, leurs lignes `Règles:`), que ce fichier ne refait pas.
- **Ne lire le ticket que sur la tête** : la PR retirerait elle-même la ligne qui l'oblige ; la tête s'ajoute aux autres lectures, elle ne les remplace pas.
- **Le verdict en première ligne** (les deux premières versions) : accordé sur `A-114`, il est la dernière ligne, et la seule qui en ait la forme.
- **Lire une réf par son nom court** (`develop`, `origin/develop`) : un tag ou une branche locale du même nom passait devant.
- **Recevoir `origin/<branche>` ou un sha pour la base** (l'état d'avant) : accordé sur le ticket 59, la base est un nom de branche nu, la tête un sha.
- **Lire la spec même quand le ticket porte sa ligne `Règles:`** : le conducteur n'aurait plus de moyen écrit de dire « aucune ».
- **Une bibliothèque YAML**, ou le schéma de la CLI : la copie de la boucle n'a aucune dépendance.
- **Importer `cheminLu` de `revue-exigee.mjs`**, ou les lecteurs du gate `tickets` : le premier est dans un fichier que l'autre programme récrit, les seconds ne sont pas dans la copie de la boucle.
- **Lire tous les en-têtes même avec un index** : plus d'un millier de fichiers sur un dépôt réel, à chaque PR et à chaque réveil du Relecteur, pour un gain nul.
- **Ne lire que l'index quand il existe** : une PR qui monte une règle sans régénérer son index ne serait pas vue (décision 8).
- **Recevoir le ticket en argument** : deux appelants le déduiraient chacun à sa façon. Le calcul reçoit le titre et la branche, et applique la définition de la grammaire.
- **Calculer le diff dans le calcul** : le diff relu n'est pas le même pour une sous-PR, une PR vers `develop` et une PR de mise à jour (`sujet.sh a-juger`, ticket 16 de l'autre programme) ; c'est l'appelant qui le sait.
- **Un code de sortie propre à l'usage** (22 dans la première version) : accordé sur le ticket 59, l'usage sort en 21.
- **Répondre « illisible » dès qu'une lecture échoue**, même avec une cause établie : la réponse ne peut plus monter, et la PR resterait bloquée pour rien.

## À faire, dans l'ordre

### § 0 — Partir de `main`

`git fetch origin main`, une branche depuis `origin/main`. Relever la version de `.claude-plugin/plugin.json` et la ligne 14 de `skills/chaine/fusionner/SKILL.md` : si la version n'est plus 7.20.0 ou si la phrase a changé, les § 3 et 4 suivent la règle de repli (décision 20).

### § 1 — Le banc d'abord, vu rouge

Créer `skills/chaine/fusionner/scripts/double-relecture.test.mjs`, tel quel. Le lancer : `node --test skills/chaine/fusionner/scripts/double-relecture.test.mjs` échoue à l'import, le module n'existe pas.

**Les cas, un par un.** Le calcul se joue sur des arbres en mémoire : `origin/develop`, la tête (donnée par un sha, écrite `tete` ci-dessous), le départ de la PR (la base, quand la PR est à jour), et au besoin `origin/sujet/facture`. Les fichiers du diff existent dans ces arbres, sauf au cas 21. `R16` est `docs/metier/regles/all/RULE_ALL_FAC-16.md`, `CODE` est `apps/api/src/facture/total.ts`, le ticket est `SPEC_ALL_FAC-1.03`. Sauf mention, la PR vise `origin/develop`.

| n° | Montage | Fichiers du diff | Attendu |
| --- | --- | --- | --- |
| 1 | index (pivot 3) : `RULE_ALL_FAC-16` `high`, `code: [CODE]` ; `RULE_ALL_FAC-17` `medium` | `R16` | « exigée », cause `RULE_ALL_FAC-16 · fichier · R16 · origin/develop` |
| 1 bis | le même | `README.md`, `CODE` | « exigée », cause `RULE_ALL_FAC-16 · code · CODE · origin/develop` |
| 1 ter | le même | un voisin de `CODE`, `README.md` | « non exigée » |
| 2 | index : la règle `high` par `origin: feature`, son fichier sans `criticality` | `CODE` | « exigée » ; le même arbre sans index : « non exigée » (limite écrite) |
| 3 | index (pivot 2) : une règle `low`, une `medium` avec `code: [CODE]`, une sans `criticality` | les deux fichiers de règle, `CODE` | « non exigée », aucune cause, aucun échec |
| 4 | **montée après le verdict** (`A-90`) : la PR est partie de la cible d'avant (`medium`) et n'a pas bougé ; la cible d'après dit `high` | `CODE` | cible d'avant : « non exigée » ; cible d'après, mêmes fichiers, même tête, même départ : « exigée », une seule cause, `code`, lue sur `origin/develop` (pas de cause `niveau` : la PR n'a rien changé) ; avec `README.md` seul : « non exigée » |
| 5 | la PR monte elle-même la règle : base `medium`, tête `high`, index régénéré, puis index périmé (celui de la base) | `R16` | « exigée » dans les deux cas, causes `fichier` et `niveau`, lues sur `tete` |
| 5 bis | règle neuve et haute dans la tête, absente de l'index, avec son `code` | son fichier, `CODE` | « exigée », trois causes : `fichier`, `code`, `niveau` |
| 5 ter | la PR baisse une règle haute, ou supprime son fichier | `R16` | « exigée » |
| 6 | règle haute `rejected`, puis `obsolete`, avec et sans index | `R16`, `CODE` | « non exigée » |
| 6 bis | base : haute et en vigueur ; tête : la même, `rejected` ou `obsolete` | `R16` | « exigée » |
| 6 ter | règle `candidate`, haute, sans index | `R16` | « exigée » |
| 7 | **projet sans index**, quatre écritures : nue ; bloc avec commentaire ; mappage en ligne dont la raison porte une virgule ; entre guillemets. `code` en liste d'une ligne, avec un dossier | `R16`, puis `CODE`, puis un fichier du dossier | « exigée » chaque fois ; un fichier d'une règle moyenne et un voisin du dossier : « non exigée » |
| 7 bis | ni index ni règle | `apps/api/src/main.ts` | « non exigée » |
| 8 | la vraie règle haute dans l'arbre ; ses homonymes sous `apps/…/fixtures/…`, dans le dossier d'un autre contexte, et un `notes.md` du dossier des règles ; avec et sans index | chaque homonyme, seul | « non exigée » |
| 9 | **index illisible** : JSON coupé ; schéma "1" ; schéma "4" ; sans `rules` ; `criticality.level` inconnu ; `code` qui n'est pas une liste ; deux entrées de même `key`, l'une `high`, l'autre `low` (`A-117`) | `README.md` | « illisible », deux échecs, `origin/develop : …` et `<tête> : …`, le motif nommé |
| 9 bis | en-tête `criticality: haute`, sans index, le même commit pour la base, la tête et le départ | `README.md` | « illisible », un seul échec, qui nomme la réf, le fichier et la valeur |
| 9 ter | la tête n'existe pas ; `origin/develop` n'existe pas ; une ligne du diff citée et non refermée | `README.md` | « illisible » ; la ligne mal citée n'est pas recopiée dans le message |
| 10 | base : règle haute et son `code` ; tête : index qui n'est pas du JSON | `CODE` | « exigée », l'échec de la tête écrit en `# illisible : <tête> : …`, le verdict en dernière ligne |
| 11 | **`Relecture: double` écrite à la main** dans l'en-tête du ticket, sur la base, avec un commentaire | `README.md`, ticket `SPEC_ALL_FAC-1.03` | « exigée », cause `SPEC_ALL_FAC-1.03 · Relecture: double · <fichier du ticket> · origin/develop` |
| 11 bis | le même montage, **PR sans ticket**, puis PR du ticket `.04` | `README.md` | « non exigée » |
| 11 ter | la ligne dans le corps du ticket, après `## Le besoin` | `README.md` | « non exigée » |
| 11 quater | la PR retire la ligne de son ticket ; la PR l'ajoute | le fichier du ticket | retirée : « exigée » (la base la porte) ; ajoutée : « exigée », lue sur la tête (`A-117`) |
| 12 | `Relecture: triple`, `Double`, `double, puis simple`, vide ; puis deux fichiers pour le ticket | `README.md` | « illisible » |
| 12 bis | ticket absent de la base ; ticket dans `issues/archive/` avec la ligne | `README.md` | « non exigée », remarque « ticket … absent de origin/develop, <tête> : aucun en-tête lu » |
| 13 | **ticket qui cite une règle haute sans `code`** (`A-113`) : index, `RULE_ALL_FAC-16` `high` par une feature, `RULE_ALL_FAC-17` `medium` ; la ligne `Règles:` du ticket cite les deux, la haute entre accents graves, un commentaire à la suite | `CODE` | « exigée », cause `RULE_ALL_FAC-16 · Règles: · <fichier du ticket> · origin/develop` |
| 13 bis | le même index, aucune spec dans l'arbre ; **ticket sans ligne `Règles:`** ; `Règles: —` ; la règle moyenne seule ; une règle inconnue ; la ligne dans le corps ; PR sans ticket | `CODE` | « non exigée » |
| 13 ter | `Règles: FAC-16` ; `RULE_ALL_FAC-16 (en partie)` ; `SPEC_ALL_FAC-1.03` | `CODE` | « illisible », le jeton nommé |
| 13 quater | sans index : la règle citée haute par son en-tête ; moyenne ; moyenne sur la base et montée par la PR | `CODE`, puis `R16` | « exigée » ; « non exigée » ; « exigée », la cause `Règles:` parmi les autres |
| 14 | **règle montée dans `develop` seul** (`A-113`) : sous-PR vers `origin/sujet/facture` ; le sujet et la tête disent `medium`, `origin/develop` dit `high`, `code: [CODE]` | `CODE` | « exigée », une seule cause, `RULE_ALL_FAC-16 · code · CODE · origin/develop` ; `develop` à `medium` : « non exigée » ; `README.md` seul : « non exigée » |
| 14 bis | le même, le ticket du sujet cite la règle en `Règles:` | `README.md` | « exigée », cause `RULE_ALL_FAC-16 · Règles: · <ticket> · origin/sujet/facture` |
| 15 | **ticket présent sur le sujet seul, PR vers `develop`** (`A-113`, PR `hors-sujet`) : `origin/develop` sans le ticket ; `origin/sujet/facture` le porte avec `Relecture: double`, puis avec `Règles:` d'une règle haute, puis sans rien | `README.md` | « exigée », cause lue sur `origin/sujet/facture` ; idem ; « non exigée » |
| 15 bis | le ticket sur un autre sujet (`origin/sujet/autre`) ; sur aucune réf ; une sous-PR dont le ticket n'est que sur `origin/develop` | `README.md` | « exigée », lue sur `origin/sujet/autre` ; « non exigée » et la remarque nomme les réfs lues ; « exigée », lue sur `origin/develop` |
| 15 ter | `Relecture: triple` sur le sujet ; la même, et `Relecture: double` sur un autre sujet | `README.md` | « illisible » ; « exigée », un échec dit |
| 16 | **niveau changé par le manifeste** (`A-113`) : index de la base, la règle `medium` ; index de la tête, `high` par `origin: feature` ; une autre règle `high` des deux côtés | `anchorpost/manifest.json`, l'index | « exigée », une seule cause, `RULE_ALL_FAC-16 · niveau · anchorpost/anchorpost.json · tete` ; dans l'autre sens, de même |
| 16 bis | le manifeste changé, l'index de la tête non régénéré | `anchorpost/manifest.json` | « non exigée » (limite, décision 9) |
| 16 ter | la règle haute devient `rejected` dans l'index ; une règle passe de `medium` à `low` ; sans index, l'en-tête passe de `medium` à `high` | l'index ; `README.md` | « exigée » ; « non exigée » ; « exigée », cause `niveau · docs/metier/regles/ · tete` |
| 17 | **titre et branche qui nomment deux tickets** (`A-113`) : titre `feat(api): total (SPEC_ALL_FAC-1.04)`, branche `feat/spec-all-fac-1-03-total` ; `Relecture: double` sur le `.03` seul, puis sur le `.04` seul, puis sur aucun | `README.md` | « exigée » ; « exigée » ; « non exigée » ; `ticketsDeLaPr` rend le `.04` puis le `.03`, un seul quand ils sont les mêmes, celui du titre seul quand la branche est un sujet, aucun quand ni le titre ni la branche n'en nomment |

| 18 | **dossier courant hors de la racine** (`A-117`), sur un dépôt git, montage M : `origin/develop` porte l'index avec la règle `high` et `code: [CODE]`, la PR modifie `CODE` ; le calcul est lancé depuis `<dépôt>/apps`, `<dépôt>/apps/api/src/facture`, `<dépôt>/docs` | `CODE` | sortie 20, `RULE_ALL_FAC-16 · code · CODE · origin/develop` puis `exigée`, comme depuis la racine |
| 18 bis | M ; la branche locale `develop`, un tag `develop`, un tag et une branche locale `origin/develop` pointent un commit sans règle ni index ; puis ce commit **remplace** celui de la cible (`git replace`) | `CODE` | sortie 20 dans les deux cas : la cible se lit en entier (`refs/remotes/origin/develop`), les objets remplacés ne sont pas suivis |
| 18 ter | `refs/remotes/origin/HEAD` et `refs/remotes/origin/alias`, réfs symboliques vers `origin/develop` : `--base HEAD`, `--base alias` | `README.md` | sortie 21 : « branche refusée » pour `HEAD`, « origin/alias est une référence symbolique » pour l'alias |
| 19 | **formes que le gate lit** (`A-117`) : `**Règles:** RULE_ALL_FAC-16`, `- Règles: …`, `règles: …`, `- **RÈGLES** : …`, une fin de ligne CRLF ; `**Relecture:** double`, `- Relecture: double`, `relecture: double` | `README.md` | « exigée » chaque fois, cause `Règles:` ou `Relecture: double` |
| 19 bis | `**Relecture:** triple`, `- Relecture: simple`, `RELECTURE: Double` ; puis `Les règles: …`, une ligne en retrait, une citation `> Règles: …` | `README.md` | « illisible » ; « non exigée » (le gate ne lit pas ces trois-là non plus) |
| 20 | **commentaire dans un mappage plié** (`A-117`) : `criticality:`, puis `{`, `level: high,`, `by: agent, # avant: x, level: low`, `}` ; `validation` pliée de même avec `# a: b, status: rejected` ; un `#` entre guillemets dans une liste `code` pliée | — | le niveau lu est `high` ; la règle est en vigueur ; le `#` entre guillemets reste dans le chemin |
| 20 bis | `criticality: { level: low, by: agent, level: high }` ; la même clé deux fois dans un mappage plié ; une clé vide | — | refusé (« illisible »), jamais la dernière valeur |
| 21 | **entrée non contrôlée** (`A-117`), les fichiers n'existent que là où le montage les écrit : M avec `git diff --name-only -z`, puis `--name-status` ; une tabulation en fin de ligne | l'entrée telle que git l'écrit | « illisible », sortie 21, aucune cause |
| 21 bis | un chemin de l'entrée absent du départ comme de la tête, seul, puis à côté de `CODE` ; `CODE` supprimé par la PR (au départ seul) ; ajouté (à la tête seule) ; absent des deux alors que la cible le porte | — | « illisible », le message compte les chemins sans les nommer, même avec `CODE` à côté ; « exigée » ; « exigée » ; « illisible » |
| 21 ter | des lignes vides, une fin de ligne CRLF ; un diff vide | `README.md` ; rien | « non exigée » |
| 22 | **renommage** (`A-117`), sur un dépôt git : la PR renomme `CODE` sans le modifier | la sortie de `git diff --no-renames --name-only` | sortie 20, cause `code` sur l'ancien nom ; la sortie de `git diff --name-only` avec la détection des renommages ne porte pas l'ancien nom : d'où l'usage |
| 23 | **argument refusé** (`A-117`) : `--base HEAD` ; `--base` d'un texte de deux lignes dont la seconde est `non exigée` ; `--base --all` ; `--base a..b` ; `--tete HEAD`, `--tete origin/develop`, un sha de 12 caractères, un sha suivi d'une ligne `non exigée` ; un titre et une branche de tête de deux lignes | `README.md` ; `CODE` | sortie 21, une ligne `# illisible : branche refusée : …` ou `sommet refusé : …` qui ne recopie rien, puis `illisible` ; le titre hostile n'écrit rien : sortie 20 |
| 23 bis | `--base origin/develop` (un nom de branche valide, qui n'est pas une branche d'origin) ; `--base absente` ; un sha de 40 zéros | `README.md` | sortie 21, « référence … introuvable » |
| 24 | **chemins de `code`** (`A-117`) : `apps//api/src/facture/total.ts`, `apps/api/./src/…`, `./apps/…`, un détour par `..`, le dossier avec deux slashs finaux, une autre casse ; dans l'index puis dans l'en-tête | `CODE` | « exigée » ; `../apps/…`, une entrée vide, `.`, `/`, le chemin sans son extension : « non exigée » |
| 25 | **la sortie** (`A-117`) : un message et un champ de cause qui portent un saut de ligne, une tabulation, un séparateur de ligne d'Unicode, le mot `non exigée` ; un message de 5 000 caractères | — | une ligne chacun, une seule ligne de la sortie est un verdict, la dernière ; le message est borné à 500 caractères |
| 26 | **le ticket créé par la PR** (`A-117`) : la base n'a pas le ticket, la tête le porte avec `Règles:` d'une règle haute, puis avec `Relecture: double`, puis sans rien, puis avec `Relecture: triple` | le fichier du ticket | « exigée », cause lue sur `tete` ; idem ; « non exigée » ; « illisible » |
| 26 bis | le ticket est sur la base sans ligne `Règles:`, la PR la lui ajoute ; la base la porte, la PR la lui retire | le fichier du ticket | « exigée », lue sur `tete` ; « exigée », lue sur `origin/develop` |
| 27 | **ticket sans ligne `Règles:`, spec qui en porte une** (`A-117`) : la spec `SPEC_ALL_FAC-1` cite la règle haute et une moyenne dans son en-tête | `README.md` | « exigée », cause `RULE_ALL_FAC-16 · Règles: · <fichier de la spec> · origin/develop` |
| 27 bis | la même spec ; le ticket porte `Règles: —`, puis `- **Règles** : —`, puis une règle moyenne | `README.md` | « non exigée » : le ticket porte sa ligne, la spec n'est pas lue |
| 27 ter | la spec ne cite que la moyenne ; la cite dans son corps ; n'a pas de ligne ; n'est pas dans l'arbre ; la spec d'à côté cite la règle haute | `README.md` | « non exigée » |
| 27 quater | un jeton illisible dans la ligne de la spec ; deux fichiers pour la spec ; le ticket et sa spec sur un sujet seul, PR vers `develop` | `README.md` | « illisible » ; « illisible » ; « exigée », cause lue sur `origin/sujet/facture` |

Puis les lecteurs (l'en-tête : onze écritures lues, dix-sept refusées ; trois en-têtes hostiles de 300 000 caractères en moins de 2 s ; l'index aux deux pivots ; les lignes du diff, en parité avec `revue-exigee.mjs` ; les arguments, les noms de branche et les sommets admis) et, sur un dépôt git jouet, la ligne de commande lancée **depuis une copie des outils faite comme celle de la boucle** (`scripts/chaine/double-relecture.mjs` et `scripts/docs/identifiants.mjs`, rien d'autre, hors du dépôt), l'arbre de travail du dépôt disant le contraire des réfs (règle basse, index supprimé) : sorties 20, 0, 21 (réf absente, hors de tout dépôt, usage) et 69 (sans `git` au `PATH`), un chemin que git cite, le ticket lu dans le titre, dans la branche, les deux à la fois, sur une branche de sujet du dépôt, sur la tête, le lecteur git (`merge-base`, `for-each-ref`, l'arbre entier), le point d'entrée par un lien symbolique.

````js
// `node --test scripts/chaine/double-relecture.test.mjs` : « double relecture exigée », sur des arbres donnés en
// mémoire (le calcul), puis sur un dépôt jouet et une copie des outils hors du dépôt (les lectures git, la ligne de
// commande). Les fichiers de règle et l'index ont la forme du standard : gabarit `regle.md` du skill `tickets`,
// entrée `rules` d'un index Anchorpost au pivot 2 ou 3.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  brancheDOrigin,
  EXIGEE,
  GRAMMAIRE,
  ILLISIBLE,
  INDEX,
  Illisible,
  NON_EXIGEE,
  SORTIES,
  cheminDuDiff,
  doubleRelecture,
  enTeteDeRegle,
  lecteurGit,
  lireArguments,
  reglesDeLIndex,
  sommet,
  texte,
  ticketsDeLaPr,
} from './double-relecture.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));

// Jamais le vrai dépôt : sous un hook git, GIT_DIR et ses semblables sont exportés (même précaution que
// `commits-a-relire.test.mjs`). NODE_TEST_CONTEXT : avec lui, un `node` enfant rend ses résultats au parent.
for (const cle of Object.keys(process.env)) if (cle.startsWith('GIT_')) delete process.env[cle];
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';
const ENV_PROPRE = Object.fromEntries(Object.entries(process.env).filter(([cle]) => cle !== 'NODE_TEST_CONTEXT'));
const dossiers = [];
const dossier = (prefixe) => {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiers.push(d);
  return d;
};
after(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true });
});

// ── Montages ──────────────────────────────────────────────────────────────────────────────────────────────────────
const R16 = 'docs/metier/regles/all/RULE_ALL_FAC-16.md';
const R17 = 'docs/metier/regles/all/RULE_ALL_FAC-17.md';
const CODE = 'apps/api/src/facture/total.ts';
const TICKET = 'docs/features/facture/all/issues/SPEC_ALL_FAC-1-facture.03.issue.md';
const BRANCHE = 'feat/spec-all-fac-1-03-total';

/** Un fichier de règle à la forme du gabarit ; `criticite` et `code` : les lignes d'en-tête, telles qu'on les écrit. */
const regle = (id, { criticite = '', code = '', statut = 'validated' } = {}) =>
  `---\nid: ${id}\ntitle: Le total d'une facture est la somme de ses lignes : arrondi au centime\nvalidation:\n  status: ${statut}\n  date: 2026-11-16\n${criticite}${code}sources:\n  - { ref: "réunion du 2026-11-10, point 3", path: docs/metier/reunions/r.md }\n---\n\nLe total est la somme des lignes.\n`;
const HAUTE_NUE = 'criticality: high\n';
const HAUTE_BLOC = 'criticality:\n  level: high # low | medium | high\n  by: agent\n  reason: "Une erreur coûte de l\'argent, level: low n\'y change rien."\n';
const MOYENNE = 'criticality:\n  level: medium\n  by: agent\n';
const CODE_BLOC = `code:\n  - ${CODE}\n`;

/** Une entrée de `rules` de l'index, avec les champs que le calcul lit et quelques autres. */
const entree = (key, { niveau, origin = 'declared', code = [], statut = 'validated' } = {}) => ({
  key,
  context: 'all',
  id: key.replace(/^RULE_ALL_/, ''),
  title: 't',
  validation: { status: statut, date: '2026-11-16' },
  realisation: { status: 'to-build', levels: [], proofCount: 0, inherited: false },
  code,
  proofs: [],
  ...(niveau ? { criticality: { level: niveau, origin, ...(origin === 'feature' ? { features: ['SPEC_ALL_FAC-1'] } : {}) } } : {}),
});
const index = (rules, schema = '3') => JSON.stringify({ rules, schema }, null, 1);
const ticket = (lignes = '', corps = '') =>
  `# Total d'une facture\n\nStatus: ready-for-agent\nType: task\n${lignes}Blocked by: —\n\n## Le besoin\n\n${corps}\n`;

const DEVELOP = 'origin/develop';
const SUJET = 'origin/sujet/facture';
const TETE = 'a'.repeat(40); // le sommet d'une PR se donne par son sha
const DEPART = 'd'.repeat(40);
const SPEC = 'docs/features/facture/all/SPEC_ALL_FAC-1-facture.spec.md';
const spec = (lignes = '', corps = '') => `# Facture\n\nStatus: en cours\n${lignes}\n## Les tickets\n\n${corps}\n`;

/**
 * Un lecteur sur des arbres en mémoire : `{ <réf>: { <chemin>: <texte> } }`, les réfs nommées comme on les passe au
 * calcul (`origin/…`, ou un sha). Deux réfs du même arbre sont le même commit. `existants` : des chemins qui sont
 * dans tous les arbres sans y être écrits (les fichiers d'un diff que le montage ne détaille pas).
 */
const lecteur = (refs, existants = []) => {
  const arbres = new Map(); // commit → arbre
  const commits = new Map(); // arbre → commit
  const arbre = (commit) => arbres.get(commit) ?? assert.fail(`commit inconnu du montage : ${commit}`);
  return {
    verifier(nom) {
      const ref = nom.replace(/^refs\/remotes\//, '');
      if (!(ref in refs)) throw new Illisible(`référence ${ref} introuvable`);
      if (!commits.has(refs[ref])) commits.set(refs[ref], `${commits.size}`.padStart(40, 'c'));
      arbres.set(commits.get(refs[ref]), refs[ref]);
      return commits.get(refs[ref]);
    },
    baseDeFusion() {
      return this.verifier(DEPART);
    },
    sujets: () => Object.keys(refs).filter((r) => r.startsWith('origin/sujet/')).map((r) => `refs/remotes/${r}`),
    chemins: (commit) => [...Object.keys(arbre(commit)), ...existants],
    lister: (commit, prefixe) => Object.keys(arbre(commit)).filter((p) => p === prefixe || p.startsWith(prefixe)),
    lire: (commit, chemins) => new Map(chemins.map((c) => [c, arbre(commit)[c]])),
  };
};
/**
 * Le calcul sur des arbres : `develop`, `sujet` (la base de la PR s'il est donné et que `versDevelop` ne l'est pas),
 * `tete` (la base, quand la PR ne change ni règle ni index), `depart` (la base, quand la PR est à jour). Les fichiers
 * du diff existent dans tous les arbres, sauf `existants: []`.
 */
function calculer({ fichiers, develop = {}, sujet, tete, depart, tickets = [], versDevelop = false, refs = {}, existants = fichiers.filter((f) => !f.startsWith('"')) }) {
  const base = sujet && !versDevelop ? 'sujet/facture' : 'develop'; // un nom de branche : le calcul lit `origin/<branche>`
  const arbres = { [DEVELOP]: develop, ...(sujet ? { [SUJET]: sujet } : {}), ...refs };
  arbres[TETE] = tete ?? arbres[`origin/${base}`];
  arbres[DEPART] = depart ?? arbres[`origin/${base}`];
  return doubleRelecture({ fichiers, base, tete: TETE, tickets, lecteur: lecteur(arbres, existants) });
}
/** Une PR vers develop : `tete` vaut `base` quand elle ne change ni règle ni index, `depart` vaut `base` quand elle est à jour. */
const juger = (fichiers, base, tete = base, ticketDeLaPr = null, depart = base) =>
  calculer({ fichiers, develop: base, tete, depart, tickets: ticketDeLaPr ? [ticketDeLaPr] : [] });
/** Les causes, la tête écrite `tete` plutôt que son sha. */
const causes = (r) => r.causes.map((c) => `${c.sujet} · ${c.motif} · ${c.chemin} · ${c.ref === TETE ? 'tete' : c.ref}`);

// ── Le calcul ─────────────────────────────────────────────────────────────────────────────────────────────────────
test('règle haute touchée, avec index : son fichier, ou un fichier de son `code`, exige deux relectures ; les causes nomment la règle', () => {
  const arbre = {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] }), entree('RULE_ALL_FAC-17', { niveau: 'medium' })]),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }),
    [R17]: regle('RULE_ALL_FAC-17', { criticite: MOYENNE }),
  };
  const parFichier = juger([R16], arbre);
  assert.equal(parFichier.reponse, EXIGEE);
  assert.deepEqual(causes(parFichier), [`RULE_ALL_FAC-16 · fichier · ${R16} · origin/develop`]);
  const parCode = juger(['README.md', CODE], arbre);
  assert.equal(parCode.reponse, EXIGEE);
  assert.deepEqual(causes(parCode), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`]);
  assert.equal(juger(['apps/api/src/facture/total.spec.ts', 'README.md'], arbre).reponse, NON_EXIGEE, 'un voisin du fichier de code ne compte pas');
});

test("le niveau de l'index est le niveau effectif : une criticité reçue d'une feature compte, que l'en-tête ne dit pas", () => {
  const arbre = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { code: CODE_BLOC }) };
  assert.equal(juger([CODE], arbre).reponse, EXIGEE);
  assert.equal(juger([CODE], { [R16]: arbre[R16] }).reponse, NON_EXIGEE, "sans index, la criticité reçue d'une feature n'est pas vue (limite écrite)");
});

test('règle moyenne seule, ou basse, ou à classer : non exigée', () => {
  const arbre = {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'low' }), entree('RULE_ALL_FAC-17', { niveau: 'medium', code: [CODE] }), entree('RULE_ALL_FAC-18')], '2'),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: 'criticality: low\n' }),
    [R17]: regle('RULE_ALL_FAC-17', { criticite: 'criticality: medium\n', code: CODE_BLOC }),
  };
  const r = juger([R16, R17, CODE], arbre);
  assert.deepEqual([r.reponse, r.causes, r.illisibles], [NON_EXIGEE, [], []]);
});

test("règle montée à haute après le verdict : mêmes fichiers, même tête, la cible a avancé, la réponse change (A-90)", () => {
  const avant = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE, code: CODE_BLOC }) };
  const apres = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }) };
  assert.equal(juger([CODE], avant, avant).reponse, NON_EXIGEE);
  // La PR est partie de la cible d'avant : son départ est `avant`, la cible relue est `apres`.
  const r = juger([CODE], apres, avant, null, avant);
  assert.equal(r.reponse, EXIGEE, 'la tête de la PR dit encore « moyenne » : la base relue fait foi');
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], "ce qu'une autre PR a changé dans la cible n'est pas un changement de niveau de celle-ci");
  assert.equal(juger(['README.md'], apres, avant, null, avant).reponse, NON_EXIGEE, 'une PR en retard qui ne touche ni la règle ni son code');
});

test("une PR qui monte elle-même une règle à haute est vue sur sa tête, même si elle n'a pas régénéré l'index", () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium' })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }) };
  const regenere = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC }) };
  const perime = { [INDEX]: base[INDEX], [R16]: regenere[R16] };
  const montee = [`RULE_ALL_FAC-16 · fichier · ${R16} · tete`, `RULE_ALL_FAC-16 · niveau · ${INDEX} · tete`];
  assert.deepEqual(causes(juger([R16], base, regenere)), montee);
  assert.deepEqual(causes(juger([R16], base, perime)), montee, "index périmé : l'en-tête du fichier touché est lu en plus");
  // Une règle neuve, haute, que l'index de la tête ne connaît pas encore, avec son code dans la même PR.
  const neuve = { ...base, [R17]: regle('RULE_ALL_FAC-17', { criticite: HAUTE_NUE, code: CODE_BLOC }) };
  assert.deepEqual(causes(juger([R17, CODE], base, neuve)), [`RULE_ALL_FAC-17 · fichier · ${R17} · tete`, `RULE_ALL_FAC-17 · code · ${CODE} · tete`, `RULE_ALL_FAC-17 · niveau · ${INDEX} · tete`]);
  // Une PR qui baisse une règle haute, ou la supprime : la base la dit haute.
  assert.equal(juger([R16], regenere, base).reponse, EXIGEE);
  assert.equal(juger([R16], regenere, {}).reponse, EXIGEE);
});

test("règle haute rejetée ou obsolète : elle ne compte pas ; la PR qui la rejette est vue par la base", () => {
  for (const statut of ['rejected', 'obsolete']) {
    const hors = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE], statut })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC, statut }) };
    assert.equal(juger([R16, CODE], hors).reponse, NON_EXIGEE, statut);
    assert.equal(juger([R16, CODE], { [R16]: hors[R16] }).reponse, NON_EXIGEE, `${statut}, sans index`);
    const enVigueur = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }) };
    assert.equal(juger([R16], enVigueur, hors).reponse, EXIGEE, `la PR qui écrit ${statut}`);
  }
  const candidate = { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE, statut: 'candidate' }) };
  assert.equal(juger([R16], candidate).reponse, EXIGEE, 'une règle candidate haute compte');
});

test("projet sans index : le niveau se lit dans l'en-tête de chaque fichier de règle, sous ses deux formes ; projet sans règles : non exigée", () => {
  const FORMES = [HAUTE_NUE, HAUTE_BLOC, 'criticality: { level: high, by: agent, reason: "Une erreur, même rare, coûte de l\'argent" }   # fixée par le skill\n', 'criticality: "high"\n'];
  for (const criticite of FORMES) {
    const arbre = { [R16]: regle('RULE_ALL_FAC-16', { criticite, code: `code: [ ${CODE}, "apps/web/src/facture/" ]\n` }), [R17]: regle('RULE_ALL_FAC-17', { criticite: MOYENNE }) };
    assert.deepEqual(causes(juger([R16], arbre)), [`RULE_ALL_FAC-16 · fichier · ${R16} · origin/develop`], criticite);
    assert.deepEqual(causes(juger([CODE], arbre)), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], criticite);
    assert.equal(juger(['apps/web/src/facture/Total.tsx'], arbre).reponse, EXIGEE, 'une entrée de `code` peut nommer un dossier');
    assert.equal(juger([R17, 'apps/web/src/factures.ts'], arbre).reponse, NON_EXIGEE, criticite);
  }
  assert.equal(juger(['apps/api/src/main.ts'], { 'README.md': 'x' }).reponse, NON_EXIGEE, 'ni index ni règle');
});

test("seul un fichier `docs/metier/regles/<ctx>/<RULE_…>.md` de la racine est le fichier d'une règle", () => {
  const jouet = 'apps/cli/test/fixtures/depot/docs/metier/regles/all/RULE_ALL_FAC-16.md';
  const ailleurs = 'docs/metier/regles/fnsmr/RULE_ALL_FAC-16.md';
  // La vraie règle, haute, est dans l'arbre et hors du diff : ses homonymes ne sont pas son fichier.
  const arbre = { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), [jouet]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), [ailleurs]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), 'docs/metier/regles/all/notes.md': 'criticality: high' };
  for (const avecIndex of [{}, { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) }])
    for (const chemin of [jouet, ailleurs, 'docs/metier/regles/all/notes.md']) assert.equal(juger([chemin], { ...arbre, ...avecIndex }).reponse, NON_EXIGEE, chemin);
});

test('index illisible, schéma inconnu, en-tête illisible, référence introuvable, ligne du diff mal citée : « illisible », jamais « non exigée »', () => {
  const haute = regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC });
  for (const [nom, contenu, attendu] of [
    ['JSON coupé', '{"schema": "3", "rules": [', /n'est pas du JSON/],
    ['schéma 1', index([], '1'), /de schéma "1" : ce lecteur lit "2" et "3"/],
    ['schéma 4', index([entree('RULE_ALL_FAC-16', { niveau: 'high' })], '4'), /de schéma "4"/],
    ['sans rules', '{"schema": "3"}', /sans liste `rules`/],
    ['niveau inconnu', index([{ key: 'RULE_ALL_FAC-16', criticality: { level: 'haute' } }]), /`criticality.level` de RULE_ALL_FAC-16 illisible/],
    ['code hors forme', index([{ key: 'RULE_ALL_FAC-16', code: 'apps/a.ts' }]), /`code` de RULE_ALL_FAC-16 illisible/],
    ['deux entrées de même clé', index([entree('RULE_ALL_FAC-16', { niveau: 'high' }), entree('rule_all_fac-16', { niveau: 'low' })]), /deux entrées pour rule_all_fac-16/],
  ]) {
    const r = juger(['README.md'], { [INDEX]: contenu, [R16]: haute }, { [INDEX]: contenu, [R16]: haute });
    assert.equal(r.reponse, ILLISIBLE, nom);
    assert.deepEqual(r.illisibles.map((m) => m.split(' : ')[0]), ['origin/develop', TETE], `${nom} : la base et la tête, chacune dite une fois`);
    assert.match(r.illisibles[0], attendu, nom);
  }
  const enTete = juger(['README.md'], { [R16]: regle('RULE_ALL_FAC-16', { criticite: 'criticality: haute\n' }) });
  assert.equal(enTete.reponse, ILLISIBLE);
  assert.equal(enTete.illisibles.length, 1, 'la base, la tête et le départ sont le même commit : dit une fois');
  assert.match(enTete.illisibles[0], /^origin\/develop:docs\/metier\/regles\/all\/RULE_ALL_FAC-16\.md : criticité « haute »/);
  const sansTete = doubleRelecture({ fichiers: ['README.md'], base: 'develop', tete: TETE, lecteur: lecteur({ [DEVELOP]: {}, [DEPART]: {} }, ['README.md']) });
  assert.deepEqual([sansTete.reponse, sansTete.illisibles], [ILLISIBLE, [`référence ${TETE} introuvable`]]);
  const sansDevelop = doubleRelecture({ fichiers: ['README.md'], base: 'sujet/facture', tete: TETE, lecteur: lecteur({ [SUJET]: {}, [TETE]: {}, [DEPART]: {} }, ['README.md']) });
  assert.deepEqual([sansDevelop.reponse, sansDevelop.illisibles], [ILLISIBLE, ['référence origin/develop introuvable']], 'un dépôt sans origin/develop');
  const cite = juger(['"docs/m\\303\\251tier', 'README.md'], {});
  assert.equal(cite.reponse, ILLISIBLE);
  assert.deepEqual(cite.illisibles, ["une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit"], "la ligne n'est pas recopiée");
});

test('une cause établie suffit : une lecture en échec à côté ne retire pas « exigée », et reste dite', () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]) };
  const r = juger([CODE], base, { [INDEX]: '{' });
  assert.equal(r.reponse, EXIGEE);
  assert.equal(r.illisibles.length, 1);
  assert.equal(texte(r), `RULE_ALL_FAC-16\tcode\t${CODE}\torigin/develop\n# illisible : ${TETE} : ${INDEX} n'est pas du JSON\nexigée\n`, 'le verdict est la dernière ligne');
});

test('`Relecture: double` écrite sur le ticket, dans son en-tête, sur la base : exigée, quels que soient les fichiers', () => {
  const base = { [TICKET]: ticket('Relecture: double # règle de criticité haute\n') };
  const r = juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.03');
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`]);
  assert.equal(juger(['README.md'], base, {}).reponse, NON_EXIGEE, 'PR sans ticket : la ligne de ce ticket ne la concerne pas');
  assert.equal(juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.04').reponse, NON_EXIGEE, "le ticket d'à côté");
  assert.equal(juger(['README.md'], { [TICKET]: ticket('', '- Relecture: double\n\nRelecture: double\n') }, {}, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, 'dans le corps, ce n\'est pas la ligne');
  // Une PR ne retire pas la ligne de son propre ticket : la base la porte. Et la ligne qu'elle ajoute est lue sur sa tête.
  assert.equal(juger([TICKET], base, { [TICKET]: ticket() }, 'SPEC_ALL_FAC-1.03').reponse, EXIGEE);
  assert.deepEqual(causes(juger([TICKET], { [TICKET]: ticket() }, base, 'SPEC_ALL_FAC-1.03')), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · tete`]);
});

test('ligne `Relecture:` d\'une autre valeur, ticket en double : illisible ; ticket absent de la base ou archivé : une remarque, pas une cause', () => {
  for (const valeur of ['triple', 'Double', 'double, puis simple', '']) {
    const r = juger(['README.md'], { [TICKET]: ticket(`Relecture: ${valeur}\n`) }, {}, 'SPEC_ALL_FAC-1.03');
    assert.equal(r.reponse, ILLISIBLE, valeur);
    assert.match(r.illisibles[0], /ligne `Relecture:` « .* », seule valeur `double`$/);
  }
  const double = juger(['README.md'], { [TICKET]: ticket(), [TICKET.replace('-facture', '-total')]: ticket() }, {}, 'SPEC_ALL_FAC-1.03');
  assert.equal(double.reponse, ILLISIBLE);
  const archive = TICKET.replace('/issues/', '/issues/archive/');
  for (const base of [{}, { [archive]: ticket('Relecture: double\n') }]) {
    const r = juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.03');
    assert.deepEqual([r.reponse, r.remarques], [NON_EXIGEE, [`ticket SPEC_ALL_FAC-1.03 absent de origin/develop, ${TETE} : aucun en-tête lu`]]);
  }
});

test("un ticket qui cite une règle haute en `Règles:` exige deux relectures, sans champ `code` ni ligne `Relecture: double` (A-113)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature' }), entree('RULE_ALL_FAC-17', { niveau: 'medium' })]) };
  const avec = (ligne) => juger([CODE], { ...regles, [TICKET]: ticket(ligne) }, undefined, 'SPEC_ALL_FAC-1.03');
  const r = avec('Règles: RULE_ALL_FAC-17, `RULE_ALL_FAC-16` # la règle du total\n');
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`]);
  for (const ligne of ['', 'Règles: —\n', 'Règles: RULE_ALL_FAC-17\n', 'Règles: RULE_ALL_FAC-99\n']) assert.equal(avec(ligne).reponse, NON_EXIGEE, ligne || 'sans ligne `Règles:`');
  assert.equal(juger([CODE], { ...regles, [TICKET]: ticket('', 'Règles: RULE_ALL_FAC-16\n') }, undefined, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, "dans le corps, ce n'est pas la ligne");
  assert.equal(juger([CODE], { ...regles, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') }).reponse, NON_EXIGEE, 'PR sans ticket');
  for (const mal of ['FAC-16', 'RULE_ALL_FAC-16 (en partie)', 'SPEC_ALL_FAC-1.03']) {
    const illisible = avec(`Règles: ${mal}\n`);
    assert.equal(illisible.reponse, ILLISIBLE, mal);
    assert.match(illisible.illisibles[0], /ligne `Règles:`, « .* » n'est pas un identifiant de règle$/);
  }
  // Sans index, le niveau vient de l'en-tête ; la règle haute sur la tête seule (la PR la monte) compte aussi.
  const enTetes = { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }), [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') };
  assert.deepEqual(causes(juger([CODE], enTetes, undefined, 'SPEC_ALL_FAC-1.03')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`]);
  const moyenne = { [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }), [TICKET]: enTetes[TICKET] };
  assert.equal(juger([CODE], moyenne, undefined, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE);
  assert.ok(causes(juger([R16], moyenne, enTetes, 'SPEC_ALL_FAC-1.03')).includes(`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`));
});

test("le niveau se lit aussi sur origin/develop : une règle montée dans develop seul est vue par la sous-PR d'un sujet en retard (A-113)", () => {
  const moyenne = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE, code: CODE_BLOC }) };
  const haute = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }) };
  const r = calculer({ fichiers: [CODE], develop: haute, sujet: moyenne });
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], "ni le sujet ni la tête ne la disent haute, et ce n'est pas un changement de la PR");
  assert.equal(calculer({ fichiers: [CODE], develop: moyenne, sujet: moyenne }).reponse, NON_EXIGEE);
  assert.equal(calculer({ fichiers: ['README.md'], develop: haute, sujet: moyenne }).reponse, NON_EXIGEE, 'la sous-PR ne touche ni la règle ni son code');
  // Le ticket de la sous-PR cite la règle : haute dans develop seul, elle compte.
  const cite = calculer({ fichiers: ['README.md'], develop: haute, sujet: { ...moyenne, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') }, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(cite), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · ${SUJET}`]);
});

test("l'en-tête du ticket se lit sur la base, sur origin/develop et sur chaque origin/sujet/* : une PR hors-sujet vers develop, dont le ticket ne vit que sur son sujet, est vue (A-113)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) };
  const horsSujet = (sujet, refs = {}) => calculer({ fichiers: ['README.md'], develop: regles, sujet, versDevelop: true, tickets: ['SPEC_ALL_FAC-1.03'], refs });
  assert.deepEqual(causes(horsSujet({ ...regles, [TICKET]: ticket('Relecture: double\n') })), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · ${SUJET}`]);
  assert.deepEqual(causes(horsSujet({ ...regles, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') })), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · ${SUJET}`]);
  assert.equal(horsSujet({ ...regles, [TICKET]: ticket() }).reponse, NON_EXIGEE);
  const autre = horsSujet({ ...regles }, { 'origin/sujet/autre': { [TICKET]: ticket('Relecture: double\n') } });
  assert.deepEqual(causes(autre), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/sujet/autre`], 'un autre sujet que celui du montage');
  const nullePart = horsSujet({ ...regles });
  assert.deepEqual([nullePart.reponse, nullePart.remarques], [NON_EXIGEE, [`ticket SPEC_ALL_FAC-1.03 absent de origin/develop, ${SUJET} : aucun en-tête lu`]], 'la tête est le même commit que la base : nommée une fois');
  // Une sous-PR : sa base est le sujet, et le ticket, entré d'abord dans develop, y est lu aussi.
  const sousPr = calculer({ fichiers: ['README.md'], develop: { ...regles, [TICKET]: ticket('Relecture: double\n') }, sujet: { ...regles }, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(sousPr), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`]);
  // Une lecture en échec sur un sujet ne se tait pas, et une cause lue ailleurs suffit.
  const mal = horsSujet({ ...regles, [TICKET]: ticket('Relecture: triple\n') });
  assert.equal(mal.reponse, ILLISIBLE);
  const malEtDouble = horsSujet({ ...regles, [TICKET]: ticket('Relecture: triple\n') }, { 'origin/sujet/autre': { [TICKET]: ticket('Relecture: double\n') } });
  assert.deepEqual([malEtDouble.reponse, malEtDouble.illisibles.length], [EXIGEE, 1]);
});

test("une PR qui change le niveau d'une règle vers ou depuis « haute » exige deux relectures sans toucher ni son fichier ni son code : une criticité fixée sur une feature, au manifeste (A-113)", () => {
  const MANIFESTE = 'anchorpost/manifest.json';
  const moyenne = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium', code: [CODE] }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]), [MANIFESTE]: '{}' };
  const haute = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', origin: 'feature', code: [CODE] }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]), [MANIFESTE]: '{"featureCriticality": []}' };
  const vers = juger([MANIFESTE, INDEX], moyenne, haute);
  assert.equal(vers.reponse, EXIGEE);
  assert.deepEqual(causes(vers), [`RULE_ALL_FAC-16 · niveau · ${INDEX} · tete`], 'la règle restée haute des deux côtés ne compte pas');
  assert.deepEqual(causes(juger([MANIFESTE, INDEX], haute, moyenne)), [`RULE_ALL_FAC-16 · niveau · ${INDEX} · tete`], 'depuis « haute »');
  assert.equal(juger([MANIFESTE], moyenne, { ...moyenne, [MANIFESTE]: haute[MANIFESTE] }).reponse, NON_EXIGEE, "limite : tant que la PR n'a pas régénéré son index, rien ne dit le niveau nouveau");
  // Une règle qui cesse d'être en vigueur, ou qui change de niveau sous « haute », et les projets sans index.
  const rejetee = { ...haute, [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', statut: 'rejected' }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]) };
  assert.equal(juger([INDEX], haute, rejetee).reponse, EXIGEE);
  const basse = { ...moyenne, [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'low' }), entree('RULE_ALL_FAC-17', { niveau: 'high' })]) };
  assert.equal(juger([INDEX], moyenne, basse).reponse, NON_EXIGEE, 'de moyenne à basse');
  const sansIndex = juger(['README.md'], { [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }) }, { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE }) });
  assert.deepEqual(causes(sansIndex), ['RULE_ALL_FAC-16 · niveau · docs/metier/regles/ · tete']);
});

test("le ticket de la PR est celui de `ticketDeLaPr` ; quand le titre et la branche en nomment deux, les deux sont lus et l'un suffit (A-113)", () => {
  const TITRE = 'feat(api): total (SPEC_ALL_FAC-1.04)';
  assert.deepEqual(ticketsDeLaPr(TITRE, BRANCHE), ['SPEC_ALL_FAC-1.04', 'SPEC_ALL_FAC-1.03']);
  assert.deepEqual(ticketsDeLaPr('feat(api): total (SPEC_ALL_FAC-1.03)', BRANCHE), ['SPEC_ALL_FAC-1.03']);
  assert.deepEqual(ticketsDeLaPr('feat(api): total', BRANCHE), ['SPEC_ALL_FAC-1.03']);
  assert.deepEqual(ticketsDeLaPr(TITRE, 'docs/une-note'), ['SPEC_ALL_FAC-1.04']);
  assert.deepEqual(ticketsDeLaPr(TITRE, 'sujet/spec-all-fac-1-03'), ['SPEC_ALL_FAC-1.04']);
  for (const [titre, branche] of [['docs: une note', 'docs/une-note'], ['', ''], [undefined, undefined]]) assert.deepEqual(ticketsDeLaPr(titre, branche), []);
  const TICKET_04 = TICKET.replace('.03.', '.04.');
  for (const [double, simple] of [[TICKET, TICKET_04], [TICKET_04, TICKET]]) {
    const r = calculer({ fichiers: ['README.md'], develop: { [double]: ticket('Relecture: double\n'), [simple]: ticket() }, tickets: ticketsDeLaPr(TITRE, BRANCHE) });
    assert.equal(r.reponse, EXIGEE, double);
    assert.equal(r.causes[0].chemin, double);
  }
  assert.equal(calculer({ fichiers: ['README.md'], develop: { [TICKET]: ticket(), [TICKET_04]: ticket() }, tickets: ticketsDeLaPr(TITRE, BRANCHE) }).reponse, NON_EXIGEE);
});

test("les lignes `Règles:` et `Relecture:` se lisent aux formes que le gate `tickets` lit : en gras, en puce, sans égard à la casse (A-117)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) };
  const avec = (ligne) => juger(['README.md'], { ...regles, [TICKET]: ticket(ligne) }, undefined, 'SPEC_ALL_FAC-1.03');
  for (const ligne of ['**Règles:** RULE_ALL_FAC-16\n', '- Règles: RULE_ALL_FAC-16\n', 'règles: RULE_ALL_FAC-16\n', '- **RÈGLES** : `RULE_ALL_FAC-16`\n', 'Règles : RULE_ALL_FAC-16\r\n'])
    assert.deepEqual(causes(avec(ligne)), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`], ligne);
  for (const ligne of ['**Relecture:** double\n', '- Relecture: double\n', 'relecture: double\n', '- **Relecture** : double # deux relectures\n'])
    assert.deepEqual(causes(avec(ligne)), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`], ligne);
  for (const ligne of ['**Relecture:** triple\n', '- Relecture: simple\n', 'RELECTURE: Double\n']) assert.equal(avec(ligne).reponse, ILLISIBLE, ligne);
  for (const ligne of ['Les règles: RULE_ALL_FAC-16\n', '  Règles: RULE_ALL_FAC-16\n', '> Règles: RULE_ALL_FAC-16\n']) assert.equal(avec(ligne).reponse, NON_EXIGEE, `${ligne} : le gate ne la lit pas non plus`);
});

test("le ticket que la PR crée elle-même est lu sur sa tête : une règle haute qu'il cite, ou sa ligne `Relecture: double`, suffit (A-117)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]) };
  const cree = (ligne) => juger([TICKET], regles, { ...regles, [TICKET]: ticket(ligne) }, 'SPEC_ALL_FAC-1.03');
  assert.deepEqual(causes(cree('Règles: RULE_ALL_FAC-16\n')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · tete`]);
  assert.deepEqual(causes(cree('Relecture: double\n')), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · tete`]);
  assert.equal(cree('').reponse, NON_EXIGEE);
  assert.equal(cree('Relecture: triple\n').reponse, ILLISIBLE);
  // Le ticket est sur la base sans la ligne, la PR la lui ajoute : lue sur la tête ; la PR la lui retire : lue sur la base.
  const sans = { ...regles, [TICKET]: ticket() };
  const cite = { ...regles, [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n') };
  assert.deepEqual(causes(juger([TICKET], sans, cite, 'SPEC_ALL_FAC-1.03')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · tete`]);
  assert.deepEqual(causes(juger([TICKET], cite, sans, 'SPEC_ALL_FAC-1.03')), [`RULE_ALL_FAC-16 · Règles: · ${TICKET} · origin/develop`]);
});

test("un ticket sans ligne `Règles:` : celle de sa spec est lue à sa place ; `Règles: —` sur le ticket dit « aucune », et la spec n'est pas lue (A-117)", () => {
  const regles = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' }), entree('RULE_ALL_FAC-17', { niveau: 'medium' })]) };
  const avec = (ligneDuTicket, laSpec = spec('Règles: RULE_ALL_FAC-17, RULE_ALL_FAC-16\n')) =>
    juger(['README.md'], { ...regles, [TICKET]: ticket(ligneDuTicket), ...(laSpec ? { [SPEC]: laSpec } : {}) }, undefined, 'SPEC_ALL_FAC-1.03');
  assert.deepEqual(causes(avec('')), [`RULE_ALL_FAC-16 · Règles: · ${SPEC} · origin/develop`], 'la cause nomme la spec');
  for (const ligne of ['Règles: —\n', '- **Règles** : —\n', 'Règles: RULE_ALL_FAC-17\n']) assert.equal(avec(ligne).reponse, NON_EXIGEE, `${ligne} : le ticket porte sa ligne`);
  assert.equal(avec('', spec('Règles: RULE_ALL_FAC-17\n')).reponse, NON_EXIGEE, 'la spec ne cite que la règle moyenne');
  assert.equal(avec('', spec('', 'Règles: RULE_ALL_FAC-16\n')).reponse, NON_EXIGEE, "dans le corps de la spec, ce n'est pas la ligne");
  assert.equal(avec('', spec()).reponse, NON_EXIGEE, 'ni le ticket ni la spec');
  assert.equal(avec('', null).reponse, NON_EXIGEE, 'pas de spec dans cet arbre');
  assert.equal(avec('', spec('Règles: FAC-16\n')).reponse, ILLISIBLE, 'un jeton illisible dans la spec');
  // La spec d'à côté n'est pas celle du ticket ; deux fichiers pour la même spec : illisible.
  const voisine = SPEC.replace('FAC-1-facture', 'FAC-2-avoir');
  assert.equal(juger(['README.md'], { ...regles, [TICKET]: ticket(), [voisine]: spec('Règles: RULE_ALL_FAC-16\n') }, undefined, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE);
  const double = { ...regles, [TICKET]: ticket(), [SPEC]: spec(), [SPEC.replace('-facture.spec', '-total.spec')]: spec() };
  assert.equal(juger(['README.md'], double, undefined, 'SPEC_ALL_FAC-1.03').reponse, ILLISIBLE);
  // Le ticket vit sur un sujet, sa spec aussi : la spec lue est celle du même arbre.
  const surSujet = calculer({ fichiers: ['README.md'], develop: regles, sujet: { ...regles, [TICKET]: ticket(), [SPEC]: spec('Règles: RULE_ALL_FAC-16\n') }, versDevelop: true, tickets: ['SPEC_ALL_FAC-1.03'] });
  assert.deepEqual(causes(surSujet), [`RULE_ALL_FAC-16 · Règles: · ${SPEC} · ${SUJET}`]);
});

test("l'entrée : une tabulation ou un octet nul, un chemin qui n'existe ni au départ ni à la tête : « illisible », jamais « non exigée » (A-117)", () => {
  const arbre = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]), [CODE]: 'x', 'README.md': 'x' };
  const lire = (fichiers, tete = arbre, depart = arbre) => calculer({ fichiers, develop: arbre, tete, depart, existants: [] });
  assert.equal(lire([CODE]).reponse, EXIGEE);
  assert.equal(lire(['README.md']).reponse, NON_EXIGEE);
  for (const [nom, fichiers] of [['--name-status', [`M\t${CODE}`]], ['-z', [`${CODE}\0README.md\0`]], ['une tabulation à la fin', [`${CODE}\t`]]]) {
    const r = lire(fichiers);
    assert.deepEqual([r.reponse, r.causes], [ILLISIBLE, []], nom);
    assert.match(r.illisibles[0], /^l'entrée porte une tabulation ou un octet nul/);
  }
  const absent = lire(['README.md', 'apps/absent.ts']);
  assert.deepEqual([absent.reponse, absent.illisibles], [ILLISIBLE, ["1 chemin(s) de l'entrée n'existent ni au départ ni à la tête de la PR : attendu la sortie de `git diff --name-only --no-renames`"]]);
  assert.equal(lire([CODE, 'apps/absent.ts']).reponse, ILLISIBLE, 'un chemin inconnu rend toute l\'entrée suspecte : aucune cause n\'en est tirée');
  // Supprimé par la PR : au départ seul. Ajouté par la PR : à la tête seule. Casse et accents comparés comme git les écrit.
  const sansCode = { [INDEX]: arbre[INDEX], 'README.md': 'x' };
  assert.equal(lire([CODE], sansCode, arbre).reponse, EXIGEE);
  assert.equal(lire([CODE], arbre, sansCode).reponse, EXIGEE);
  assert.equal(lire([CODE], sansCode, sansCode).reponse, ILLISIBLE, 'ni au départ ni à la tête, même si la cible le porte');
  assert.equal(lire(['', '  ', 'README.md\r']).reponse, NON_EXIGEE, 'lignes vides et fin de ligne CRLF');
  assert.equal(lire([]).reponse, NON_EXIGEE, "un diff vide : l'appelant répond de sa lecture");
});

test("les chemins de `code` sont normalisés : un double slash, un `./`, un détour par `..` nomment le même fichier (A-117)", () => {
  for (const chemin of ['apps//api/src/facture/total.ts', 'apps/api/./src/facture/total.ts', './apps/api/src/facture/total.ts', 'apps/api/src/x/../facture/total.ts', 'apps/api/src/facture//', 'Apps/API/src/facture/total.ts']) {
    assert.deepEqual(causes(juger([CODE], { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [chemin] })]) })), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`], chemin);
    assert.equal(juger([CODE], { [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_NUE, code: `code: [ "${chemin}" ]\n` }) }).reponse, EXIGEE, `${chemin}, dans l'en-tête`);
  }
  for (const chemin of ['../apps/api/src/facture/total.ts', 'apps/../../x', '', '.', '/', 'apps/api/src/facture/total']) assert.equal(juger([CODE], { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [chemin] })]) }).reponse, NON_EXIGEE, `${chemin} ne nomme pas ce fichier`);
});

test("la sortie : une ligne par cause, par échec, par remarque, le verdict seul en dernière ligne ; rien de ce qui est lu n'écrit une ligne de plus (A-117)", () => {
  const sale = { reponse: ILLISIBLE, causes: [], illisibles: ['ligne `Relecture:` « double\nnon exigée\r\n», seule valeur `double`', `a${String.fromCharCode(0x2028)}non exigée${String.fromCharCode(0x85)}b\tc`], remarques: ['une\nremarque'] };
  assert.equal(texte(sale), '# illisible : ligne `Relecture:` « double non exigée », seule valeur `double`\n# illisible : a non exigée b c\n# une remarque\nillisible\n');
  const cause = { reponse: EXIGEE, causes: [{ sujet: 'RULE_ALL_FAC-16\nnon exigée', motif: 'code', chemin: 'apps/a\tb.ts', ref: 'origin/develop' }], illisibles: [], remarques: [] };
  assert.equal(texte(cause), 'RULE_ALL_FAC-16 non exigée\tcode\tapps/a b.ts\torigin/develop\nexigée\n');
  for (const r of [sale, cause]) assert.deepEqual(texte(r).split('\n').filter((l) => [EXIGEE, NON_EXIGEE, ILLISIBLE].includes(l)), [r.reponse], 'une seule ligne est un verdict');
  assert.equal(texte({ reponse: ILLISIBLE, causes: [], illisibles: ['x'.repeat(5000)], remarques: [] }).length, '# illisible : \nillisible\n'.length + 500, 'un message est borné');
});

// ── Les lecteurs ──────────────────────────────────────────────────────────────────────────────────────────────────
test("l'en-tête d'une règle : les formes lues, et ce qui est refusé plutôt que deviné", () => {
  const lu = (criticite, code = '', statut = 'validated') => enTeteDeRegle(regle('RULE_ALL_FAC-16', { criticite, code, statut }));
  assert.deepEqual(lu(''), { niveau: null, code: [], enVigueur: true });
  assert.deepEqual(lu(HAUTE_BLOC, CODE_BLOC), { niveau: 'high', code: [CODE], enVigueur: true });
  assert.deepEqual(lu('criticality: medium # à revoir\n', `code:\n- ${CODE} # le calcul\n- 'apps/web/a b.ts'\n`, 'obsolete'), { niveau: 'medium', code: [CODE, 'apps/web/a b.ts'], enVigueur: false });
  assert.deepEqual(lu("criticality: { reason: 'jamais, level: high', level: low, by: agent }\n", 'code: []\n').niveau, 'low', 'un `level:` dans une raison entre guillemets n\'est pas le niveau');
  assert.deepEqual(lu('criticality:\n  {\n    level: high,\n    by: agent,\n  }\n', `code:\n  [\n    ${CODE},\n    "apps/web/a.ts",\n  ]\n`), { niveau: 'high', code: [CODE, 'apps/web/a.ts'], enVigueur: true }, 'mappage et liste en ligne pliés par un formateur');
  // Un commentaire dans un mappage plié ne cache pas la suite, et ne devient pas la valeur (A-117).
  assert.equal(lu('criticality:\n  {\n    level: high,\n    by: agent, # avant: x, level: low\n  }\n').niveau, 'high');
  assert.equal(lu('criticality: { # avant, level: low\n  level: high, by: agent }\n').niveau, 'high');
  assert.equal(enTeteDeRegle('---\nid: RULE_ALL_FAC-16\nvalidation:\n  {\n    status: validated, # a: b, status: rejected\n    date: 2026-11-16,\n  }\ncriticality: high\n---\n').enVigueur, true);
  assert.deepEqual(lu('', 'code:\n  [\n    a.ts, # b.ts, c.ts\n    "d # e.ts",\n  ]\n').code, ['a.ts', 'd # e.ts'], 'un `#` entre guillemets reste dans la valeur');
  assert.equal(lu('# criticality: high\nextensions:\n  projet:\n    criticality: high\n').niveau, null, 'ni un commentaire ni une clé imbriquée ne sont la clé');
  assert.equal(enTeteDeRegle(String.fromCharCode(0xfeff) + '---\r\nid: RULE_ALL_FAC-16\r\ncriticality: high\r\nvalidation: { status: rejected, date: 2026-11-16 }\r\n---\r\n').enVigueur, false, 'BOM, CRLF, validation en ligne');
  for (const [nom, texte] of [
    ['sans en-tête', 'criticality: high\n'],
    ['en-tête non refermé', '---\ncriticality: high\n'],
    ['niveau hors vocabulaire', regle('R', { criticite: 'criticality: HIGH\n' })],
    ['criticality vide', regle('R', { criticite: 'criticality:\n' })],
    ['criticality sans level', regle('R', { criticite: 'criticality:\n  by: agent\n' })],
    ['level deux fois', regle('R', { criticite: 'criticality:\n  level: low\n  level: high\n' })],
    ['clé deux fois', regle('R', { criticite: 'criticality: low\ncriticality: high\n' })],
    ['mappage non refermé', regle('R', { criticite: 'criticality: { level: high,\n  by: agent\n' })],
    ['clé en double dans un mappage', regle('R', { criticite: 'criticality: { level: low, by: agent, level: high }\n' })],
    ['clé en double dans un mappage plié', regle('R', { criticite: 'criticality:\n  {\n    level: high,\n    level: low,\n  }\n' })],
    ['clé vide dans un mappage', regle('R', { criticite: 'criticality: { : high }\n' })],
    ['texte puis mappage', regle('R', { criticite: 'criticality: haute { level: high }\n' })],
    ['clé entre guillemets', regle('R', { criticite: '"criticality": high\n' })],
    ['code en texte', regle('R', { code: 'code: apps/a.ts\n' })],
    ['code en mappage', regle('R', { code: 'code:\n  fichier: apps/a.ts\n' })],
    ['liste non refermée', regle('R', { code: 'code: [ apps/a.ts\n' })],
    ['texte après la liste', regle('R', { code: 'code: [ apps/a.ts ] et b.ts\n' })],
  ])
    assert.throws(() => enTeteDeRegle(texte), Illisible, nom);
});

test("lecture en temps linéaire : trois en-têtes hostiles de 300 000 caractères, lus ou refusés en moins de 2 s", () => {
  const debut = Date.now();
  const n = 300_000;
  assert.throws(() => enTeteDeRegle(regle('R', { criticite: `criticality: {${' '.repeat(n)}level: high\n` })), Illisible, 'des blancs sans fin, mappage non refermé');
  assert.equal(enTeteDeRegle(regle('R', { criticite: `criticality: { level: high, reason: "${'a, '.repeat(n / 3)}" }${' '.repeat(n)}# fin\n` })).niveau, 'high');
  assert.equal(enTeteDeRegle(regle('R', { code: `code:\n${'  - a.ts\n'.repeat(n / 10)}` })).code.length, n / 10);
  assert.ok(Date.now() - debut < 2000, `${Date.now() - debut} ms`);
});

test("l'index : `rules[].key`, `criticality.level`, `code`, `validation.status`, aux pivots 2 et 3", () => {
  for (const schema of ['2', '3']) {
    const regles = reglesDeLIndex(index([entree('RULE_FNSMR_LIC-05', { niveau: 'high', origin: 'feature', code: ['a.ts'], statut: 'obsolete' }), entree('RULE_ALL_FAC-1')], schema));
    assert.deepEqual(regles.get('rule_fnsmr_lic-05'), { cle: 'RULE_FNSMR_LIC-05', niveau: 'high', code: ['a.ts'], enVigueur: false });
    assert.deepEqual(regles.get('rule_all_fac-1'), { cle: 'RULE_ALL_FAC-1', niveau: null, code: [], enVigueur: true });
  }
  assert.throws(() => reglesDeLIndex('[]'), Illisible);
  assert.throws(() => reglesDeLIndex(index([{ title: 'sans clé' }])), Illisible);
});

test('les lignes de `git diff --name-only`, citées ou non ; les arguments', () => {
  assert.equal(cheminDuDiff('  Docs/Metier/Regles/ALL/RULE_ALL_FAC-16.md '), 'docs/metier/regles/all/rule_all_fac-16.md');
  assert.equal(cheminDuDiff('"docs/m\\303\\251tier/a\\tb.md"'), 'docs/métier/a\tb.md');
  for (const mal of ['"docs/a.md', '"docs/\\q.md"', '"a"b"']) assert.throws(() => cheminDuDiff(mal), Illisible, mal);
  assert.deepEqual(lireArguments(['--base', 'develop', '--tete', 'abc', '--branche', BRANCHE]), { base: 'develop', tete: 'abc', branche: BRANCHE });
  // La base : un nom de branche, lu `refs/remotes/origin/<branche>` en entier. La tête : un sha. Rien d'autre, et le refus ne recopie pas l'argument.
  assert.equal(brancheDOrigin('develop'), 'refs/remotes/origin/develop');
  assert.equal(brancheDOrigin('sujet/facture-2.x'), 'refs/remotes/origin/sujet/facture-2.x');
  for (const mal of ['HEAD', '', ' develop', 'develop ', 'a b', 'develop\nnon exigée', 'develop\n', '-develop', '--all', 'a..b', 'a//b', 'sujet/', '/develop', 'sujet/.x', 'x.lock', 'x.', 'develop^', 'develop~1', 'a:b', 'a*', 'origin/develop@{1}', undefined, 42])
    assert.throws(() => brancheDOrigin(mal), (e) => e instanceof Illisible && e.message === 'branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`', `${mal}`);
  assert.equal(sommet(TETE), TETE);
  for (const mal of ['HEAD', 'develop', 'origin/develop', TETE.slice(1), `${TETE}0`, TETE.toUpperCase(), `${TETE}^`, `${TETE}\nnon exigée`, '', undefined])
    assert.throws(() => sommet(mal), (e) => e instanceof Illisible && e.message === 'sommet refusé : attendu un sha de 40 caractères', `${mal}`);
  assert.deepEqual(lireArguments(['--titre', '', '--branche', '', '--tete', 'abc', '--base', 'b']), { titre: '', branche: '', tete: 'abc', base: 'b' }, 'un titre ou une branche vides sont admis');
  for (const mal of [[], ['--base', 'x'], ['--tete', 'x'], ['--base', 'x', '--tete'], ['--base', 'x', '--tete', 'y', '--ticket', 'z'], ['--base', 'x', '--base', 'y', '--tete', 'z'], ['--base', '', '--tete', 'y']])
    assert.equal(lireArguments(mal), null, mal.join(' '));
});

test('les lignes du diff se lisent comme `revue-exigee.mjs` les lit : la copie est tenue en parité', async () => {
  const { cheminLu } = await import('./revue-exigee.mjs');
  assert.equal(typeof cheminLu, 'function', '`cheminLu` de revue-exigee.mjs, posé à côté dans scripts/chaine/');
  for (const ligne of ['apps/A.ts', ' Docs/É.md ', '"docs/m\\303\\251tier/a\\tb.md"', '"a\\"b\\\\c"', 'docs/e\u0301.md', 'ſ.md']) assert.equal(cheminDuDiff(ligne), cheminLu(ligne), ligne);
  for (const mal of ['"docs/a.md', '"docs/\\q.md"', '"a"b"', '"']) {
    assert.equal(cheminLu(mal), null, mal);
    assert.throws(() => cheminDuDiff(mal), Illisible, mal);
  }
});

// ── Les lectures git et la ligne de commande, depuis une copie des outils hors du dépôt ───────────────────────────
function g(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: ENV_PROPRE }).trim();
}
/** Écrit `fichiers` dans le dépôt et les commite sur la branche courante ; rend le sha. */
function commit(depot, fichiers, message) {
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(depot, chemin)), { recursive: true });
    writeFileSync(join(depot, chemin), contenu);
  }
  g(depot, 'add', '-A');
  g(depot, 'commit', '-q', '-m', message);
  return g(depot, 'rev-parse', 'HEAD');
}
/** Le montage M : `origin/develop` porte l'index avec la règle haute et son `code`, et une branche de ticket modifie ce fichier de code. */
function depotJouet() {
  const depot = dossier('double-relecture-');
  g(depot, 'init', '-q', '-b', 'develop');
  g(depot, 'config', 'user.email', 'jouet@example.invalid');
  g(depot, 'config', 'user.name', 'Jouet');
  g(depot, 'config', 'core.quotePath', 'true');
  const socle = commit(depot, {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }),
    [TICKET]: ticket(),
    [CODE]: 'export const total = 0;\n',
    'README.md': 'jouet\n',
    'docs/métier/note.md': 'n\n',
  }, 'chore: socle');
  g(depot, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
  g(depot, 'checkout', '-q', '-b', BRANCHE);
  const tete = commit(depot, { [CODE]: 'export const total = 1;\n', 'docs/métier/note.md': 'm\n' }, 'feat(api): total');
  // L'arbre de travail ment : s'il était lu, la règle serait basse et l'index absent.
  writeFileSync(join(depot, R16), regle('RULE_ALL_FAC-16', { criticite: 'criticality: low\n' }));
  rmSync(join(depot, INDEX));
  return { depot, socle, tete };
}
/** Les outils tels que la boucle les reprend d'origin/develop : `scripts/chaine` et `scripts/docs/identifiants.mjs`, rien d'autre. */
function copieDesOutils(nom = 'outils-') {
  const copie = dossier(nom);
  mkdirSync(join(copie, 'scripts/chaine'), { recursive: true });
  mkdirSync(join(copie, 'scripts/docs'));
  copyFileSync(join(ICI, 'double-relecture.mjs'), join(copie, 'scripts/chaine/double-relecture.mjs'));
  copyFileSync(GRAMMAIRE, join(copie, 'scripts/docs/identifiants.mjs'));
  return join(copie, 'scripts/chaine/double-relecture.mjs');
}
/** Lance la ligne de commande ; rend son code, sa sortie, et `verdict`, la dernière ligne de sa sortie. */
function lancer(script, args, { cwd, entree: input = '', options = [], env = {} }) {
  const r = spawnSync(process.execPath, [...options, script, ...args], { cwd, input, encoding: 'utf8', env: { ...ENV_PROPRE, ...env }, timeout: 30_000 });
  return { code: r.status, sortie: r.stdout, erreur: r.stderr, verdict: r.stdout.replace(/\n$/, '').split('\n').pop() };
}
const CAUSE_M = `RULE_ALL_FAC-16\tcode\t${CODE}\torigin/develop\n`;
const USAGE = '# illisible : usage : git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> | node double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]\n';

test("en ligne de commande, depuis la copie des outils de la boucle : les réfs sont lues, jamais l'arbre de travail ; sorties 0, 20, 21, 69 ; le verdict est la dernière ligne", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  const m = ['--base', 'develop', '--tete', tete];
  const diff = g(depot, 'diff', '--no-renames', '--name-only', 'origin/develop', tete);
  assert.match(diff, /^"docs\/m\\303\\251tier\/note\.md"$/m, 'le montage porte un chemin que git cite');
  const exigee = lancer(script, [...m, '--branche', BRANCHE], { cwd: depot, entree: `${diff}\n` });
  assert.deepEqual([exigee.code, exigee.sortie], [SORTIES[EXIGEE], `${CAUSE_M}exigée\n`]);
  assert.equal(SORTIES[EXIGEE], 20);
  const non = lancer(script, m, { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([non.code, non.sortie], [0, 'non exigée\n']);
  const illisible = lancer(script, ['--base', 'absente', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([illisible.code, illisible.sortie], [21, '# illisible : référence origin/absente introuvable\nillisible\n']);
  const sansSommet = lancer(script, ['--base', 'develop', '--tete', '0'.repeat(40)], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([sansSommet.code, sansSommet.sortie], [21, `# illisible : référence ${'0'.repeat(40)} introuvable\nillisible\n`]);
  const horsDepot = lancer(script, m, { cwd: dirname(script), entree: 'README.md\n' });
  assert.deepEqual([horsDepot.code, horsDepot.verdict], [21, 'illisible'], 'hors de tout dépôt git');
  const usage = lancer(script, ['--base', 'develop'], { cwd: depot });
  assert.deepEqual([usage.code, usage.sortie], [21, `${USAGE}illisible\n`]);
  // Sans `git` au PATH : un outil manquant, sortie 69, et toujours « illisible » pour verdict.
  const sansGit = lancer(script, m, { cwd: depot, entree: `${CODE}\n`, env: { PATH: dossier('sans-git-') } });
  assert.deepEqual([sansGit.code, sansGit.sortie], [69, '# illisible : git est requis par les scripts de la chaîne\nillisible\n']);
  assert.deepEqual([SORTIES[NON_EXIGEE], SORTIES[ILLISIBLE], SORTIES.outilManquant], [0, 21, 69]);
});

test("le calcul se place à la racine du dépôt et n'obéit ni au dossier courant, ni à un objet remplacé, ni à un tag ou une branche locale du nom de la cible ; une réf symbolique n'est pas une cible", () => {
  const { depot, socle, tete } = depotJouet();
  const script = copieDesOutils();
  const m = ['--base', 'develop', '--tete', tete];
  // Depuis un sous-dossier : `ls-tree` sans `--full-tree` n'y verrait ni l'index ni les règles.
  for (const sous of ['apps', 'apps/api/src/facture', 'docs']) {
    const r = lancer(script, m, { cwd: join(depot, sous), entree: `${CODE}\n` });
    assert.deepEqual([r.code, r.sortie], [20, `${CAUSE_M}exigée\n`], sous);
  }
  // Un commit sans règle ni index, enfant du socle : ce que la cible ne dit pas.
  g(depot, 'checkout', '-q', '-f', '-b', 'vide', socle);
  rmSync(join(depot, INDEX));
  rmSync(join(depot, R16));
  g(depot, 'add', '-A');
  g(depot, 'commit', '-q', '-m', 'chore: sans règle');
  const vide = g(depot, 'rev-parse', 'HEAD');
  // La branche locale `develop`, un tag `develop`, un tag et une branche locale `origin/develop` disent autre chose que
  // la branche d'origin : `git rev-parse develop` et `git rev-parse origin/develop` les lui préfèrent.
  g(depot, 'branch', '-f', 'develop', vide);
  g(depot, 'tag', 'develop', vide);
  g(depot, 'tag', 'origin/develop', vide);
  g(depot, 'branch', 'origin/develop', vide);
  for (const court of ['develop', 'origin/develop']) assert.equal(g(depot, 'rev-parse', '--verify', '-q', `${court}^{commit}`), vide, `le montage trompe bien une lecture par le nom court ${court}`);
  assert.deepEqual([lancer(script, m, { cwd: depot, entree: `${CODE}\n` }).sortie], [`${CAUSE_M}exigée\n`]);
  for (const nom of ['develop', 'origin/develop']) g(depot, 'tag', '-d', nom);
  g(depot, 'branch', '-D', 'origin/develop');
  // Une réf symbolique n'est pas une branche cible : `origin/HEAD` par son nom, un alias par sa nature.
  g(depot, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/develop');
  g(depot, 'symbolic-ref', 'refs/remotes/origin/alias', 'refs/remotes/origin/develop');
  const parHead = lancer(script, ['--base', 'HEAD', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([parHead.code, parHead.sortie], [21, '# illisible : branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`\nillisible\n']);
  const alias = lancer(script, ['--base', 'alias', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([alias.code, alias.sortie], [21, '# illisible : origin/alias est une référence symbolique\nillisible\n']);
  // Un objet remplacé : le commit de la cible lu comme le commit sans règle.
  g(depot, 'replace', socle, vide);
  assert.equal(g(depot, 'rev-parse', `${socle}^{tree}`), g(depot, 'rev-parse', `${vide}^{tree}`), 'le montage remplace bien le commit de la cible');
  assert.deepEqual([lancer(script, m, { cwd: depot, entree: `${CODE}\n` }).sortie], [`${CAUSE_M}exigée\n`]);
});

test("l'entrée est contrôlée : `-z`, `--name-status`, un chemin qui n'existe ni au départ ni à la tête sont « illisibles » ; un argument refusé n'est pas recopié", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  const m = ['--base', 'develop', '--tete', tete];
  for (const forme of [['--name-only', '-z'], ['--name-status']]) {
    const entree = execFileSync('git', ['diff', '--no-renames', ...forme, 'origin/develop', tete], { cwd: depot, encoding: 'utf8', env: ENV_PROPRE });
    assert.ok(entree.includes(CODE), 'le chemin du code est bien dans cette entrée');
    const r = lancer(script, m, { cwd: depot, entree });
    assert.deepEqual([r.code, r.sortie], [21, "# illisible : l'entrée porte une tabulation ou un octet nul : attendu la sortie de `git diff --name-only --no-renames`, un chemin par ligne\nillisible\n"], forme.join(' '));
  }
  const inconnu = lancer(script, m, { cwd: depot, entree: `${CODE}\napps/api/src/facture/absent.ts\n` });
  assert.deepEqual([inconnu.code, inconnu.sortie], [21, "# illisible : 1 chemin(s) de l'entrée n'existent ni au départ ni à la tête de la PR : attendu la sortie de `git diff --name-only --no-renames`\nillisible\n"], 'même avec un chemin qui aurait suffi');
  // Un fichier supprimé par la PR existe au départ ; un fichier ajouté, à la tête ; des fins de ligne CRLF passent.
  assert.equal(lancer(script, m, { cwd: depot, entree: `${CODE}\r\nREADME.md\r\n` }).code, 20);
  // Une réf refusée, un titre hostile : rien de ce qui est reçu n'écrit une ligne de verdict.
  for (const base of ['HEAD', 'develop\nnon exigée', '--all', 'a..b']) {
    const r = lancer(script, ['--base', base, '--tete', tete], { cwd: depot, entree: 'README.md\n' });
    assert.deepEqual([r.code, r.sortie], [21, '# illisible : branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`\nillisible\n'], base);
  }
  for (const sha of ['HEAD', 'origin/develop', `${tete}\nnon exigée`, tete.slice(0, 12)]) {
    const r = lancer(script, ['--base', 'develop', '--tete', sha], { cwd: depot, entree: 'README.md\n' });
    assert.deepEqual([r.code, r.sortie], [21, '# illisible : sommet refusé : attendu un sha de 40 caractères\nillisible\n'], sha);
  }
  // Un nom de branche valide qui n'est pas une branche d'origin : introuvable, jamais lu ailleurs.
  assert.equal(lancer(script, ['--base', 'origin/develop', '--tete', tete], { cwd: depot, entree: 'README.md\n' }).sortie, '# illisible : référence origin/origin/develop introuvable\nillisible\n');
  const titre = lancer(script, [...m, '--titre', 'feat: x (SPEC_ALL_FAC-1.03)\nnon exigée', '--branche', 'docs/x\nnon exigée'], { cwd: depot, entree: `${CODE}\n` });
  assert.deepEqual([titre.code, titre.sortie], [20, `${CAUSE_M}exigée\n`]);
});

test("un fichier de code renommé : avec `--no-renames`, son ancien nom est dans l'entrée et la règle qui le nomme est vue", () => {
  const { depot } = depotJouet();
  const script = copieDesOutils();
  g(depot, 'checkout', '-q', '-f', '-b', 'refactor/renomme', 'origin/develop');
  g(depot, 'mv', CODE, 'apps/api/src/facture/somme.ts');
  g(depot, 'commit', '-q', '-m', 'refactor(api): renomme');
  const tete = g(depot, 'rev-parse', 'HEAD');
  const avec = g(depot, 'diff', '--no-renames', '--name-only', 'origin/develop', tete);
  const sans = g(depot, '-c', 'diff.renames=true', 'diff', '--name-only', 'origin/develop', tete);
  assert.ok(avec.split('\n').includes(CODE) && !sans.split('\n').includes(CODE), "sans `--no-renames`, l'ancien nom manque à l'entrée : l'usage l'exige");
  const r = lancer(script, ['--base', 'develop', '--tete', tete], { cwd: depot, entree: `${avec}\n` });
  assert.deepEqual([r.code, r.sortie], [20, `${CAUSE_M}exigée\n`]);
});

test('le ticket se lit dans le titre et dans le nom de la branche de tête, et son en-tête sur la base, la tête et les sujets', () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  g(depot, 'checkout', '-q', '-f', 'develop');
  const base = commit(depot, { [TICKET]: ticket('Relecture: double\n'), [INDEX]: index([]) }, 'docs: relecture double');
  // La cible est une autre branche d'origin que develop : le ticket n'y porte la ligne que là.
  g(depot, 'update-ref', 'refs/remotes/origin/sujet/total', base);
  const args = ['--base', 'sujet/total', '--tete', tete];
  const attendu = `SPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\torigin/sujet/total\nexigée\n`;
  const avec = lancer(script, [...args, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([avec.code, avec.sortie], [20, attendu]);
  for (const branche of ['docs/une-note', 'sujet/spec-all-fac-1-03']) assert.equal(lancer(script, [...args, '--branche', branche], { cwd: depot, entree: 'README.md\n' }).code, 0, branche);
  assert.equal(lancer(script, args, { cwd: depot, entree: 'README.md\n' }).code, 0, 'sans --branche');
  const parLeTitre = lancer(script, [...args, '--titre', 'feat(api): total (SPEC_ALL_FAC-1.03)', '--branche', 'docs/une-note'], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([parLeTitre.code, parLeTitre.sortie], [20, attendu]);
  // Le titre nomme un ticket, la branche un autre : les deux sont lus, celui de la branche suffit.
  const deux = lancer(script, [...args, '--titre', 'feat(api): total (SPEC_ALL_FAC-1.04)', '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.equal(deux.code, 20);
  assert.match(deux.sortie, /^SPEC_ALL_FAC-1\.03\tRelecture: double\t.*\n# ticket SPEC_ALL_FAC-1\.04 absent de .*\nexigée\n$/);
  // Une branche de sujet du dépôt porte le ticket avec la ligne, la base non : il est lu là aussi.
  const surLeSujet = lancer(script, ['--base', 'develop', '--tete', tete, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([surLeSujet.code, surLeSujet.sortie], [20, attendu], 'la cible est develop, le ticket est lu sur la branche de sujet');
  // La PR écrit la ligne sur son propre ticket : lue sur sa tête.
  g(depot, 'update-ref', '-d', 'refs/remotes/origin/sujet/total');
  g(depot, 'checkout', '-q', '-f', BRANCHE);
  const avecTicket = commit(depot, { [TICKET]: ticket('**Relecture:** double\n') }, 'docs: ticket');
  const surLaTete = lancer(script, ['--base', 'develop', '--tete', avecTicket, '--branche', BRANCHE], { cwd: depot, entree: `${TICKET}\n` });
  assert.deepEqual([surLaTete.code, surLaTete.sortie], [20, `SPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\t${avecTicket}\nexigée\n`]);
});

test("le lecteur git : un fichier absent du commit, plusieurs fichiers en une lecture, un contenu à accents, la base de fusion, les branches de sujet", () => {
  const { depot, tete } = depotJouet();
  const l = lecteurGit(depot);
  const develop = l.verifier('refs/remotes/origin/develop');
  assert.match(develop, /^[0-9a-f]{40}$/);
  assert.deepEqual(l.lister(tete, 'docs/metier/regles/'), [R16]);
  assert.deepEqual(l.lister(tete, 'absent/'), []);
  assert.deepEqual(l.chemins(tete).sort(), [INDEX, CODE, R16, TICKET, 'README.md', 'docs/métier/note.md'].sort());
  const lus = l.lire(tete, [R16, CODE]);
  assert.match(lus.get(R16), /arrondi au centime[\s\S]*Le total est la somme des lignes\.\n$/);
  assert.equal(lus.get(CODE), 'export const total = 1;\n');
  assert.throws(() => l.lire(tete, ['absent.md']), Illisible);
  assert.throws(() => l.verifier('refs/remotes/origin/absente'), /référence origin\/absente introuvable/);
  g(depot, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/develop');
  assert.throws(() => l.verifier('refs/remotes/origin/HEAD'), /origin\/HEAD est une référence symbolique/);
  assert.equal(l.baseDeFusion(develop, tete), develop);
  assert.deepEqual(l.sujets(), []);
  g(depot, 'update-ref', 'refs/remotes/origin/sujet/facture', tete);
  g(depot, 'update-ref', 'refs/remotes/origin/autre', tete);
  assert.deepEqual(l.sujets(), ['refs/remotes/origin/sujet/facture']);
  const orphelin = g(depot, 'commit-tree', '-m', 'sans parent', `${tete}^{tree}`);
  assert.throws(() => l.baseDeFusion(develop, orphelin), /pas de base de fusion/);
});

test("le point d'entrée est reconnu par un lien symbolique, depuis un dossier à espace et à accent", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils('outils é -');
  const lien = join(dirname(script), 'lien-double-relecture.mjs');
  symlinkSync(script, lien);
  for (const [nom, chemin, options] of [['direct', script, []], ['lien', lien, []], ['lien, --preserve-symlinks-main', lien, ['--preserve-symlinks-main']]]) {
    const r = lancer(chemin, ['--base', 'develop', '--tete', tete], { cwd: depot, entree: `${CODE}\n`, options });
    assert.deepEqual([r.code, r.verdict], [20, 'exigée'], nom);
  }
});
````

### § 2 — `skills/chaine/fusionner/scripts/double-relecture.mjs`

Créer le fichier, tel quel. Le banc du § 1 devient vert, 35 sur 35.

````js
#!/usr/bin/env node
// =============================================================================
// « Double relecture exigée », un seul calcul pour le Relecteur et pour le capitaine.
//
// Une PR exige deux relectures indépendantes quand :
//   - son ticket porte la ligne `Relecture: double`, ou cite sur sa ligne `Règles:` une règle de criticité haute
//     (sans ligne `Règles:` sur le ticket, celle de sa spec est lue à sa place) ;
//   - son diff touche le fichier d'une règle haute, ou un fichier que le champ `code` de cette règle nomme ;
//   - elle change le niveau d'une règle vers ou depuis « haute » (une criticité fixée sur une feature, par exemple).
//
//   git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> \
//     | node scripts/chaine/double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]
//
// Entrée standard : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only --no-renames` les
// écrit. `--no-renames` : sans lui, un fichier de code renommé ne paraît plus sous son ancien nom, celui que la
// règle nomme. Une tabulation ou un octet nul dans l'entrée (`--name-status`, `-z`), ou un chemin qui n'existe ni
// au départ ni à la tête de la PR : « illisible ».
// `--base` : la branche cible de la PR, un nom de branche (`develop`, `sujet/<nom>`), jamais une réf, ni `HEAD`, ni
// une réf symbolique ; le calcul lit `refs/remotes/origin/<branche>` en entier, que qui appelle vient de relire : ni
// un tag ni une branche locale du même nom ne la remplacent. `--tete` : le sommet de la PR, un sha de 40 caractères.
// `--titre`, `--branche` : le titre de la PR et le nom de sa branche de tête,
// d'où se lit son ticket (`ticketDeLaPr` de la grammaire ; quand le titre et la branche en nomment deux, les deux
// sont lus).
//
// Tout se lit dans des objets git, jamais dans l'arbre de travail, et de la même façon quels que soient le dossier
// courant et les réglages du dépôt ou de l'utilisateur (objets remplacés, chemins relatifs) : ce fichier tourne
// depuis la copie des outils que la boucle du capitaine reprend d'origin/develop, hors du dépôt, avec
// `scripts/chaine` et `scripts/docs/identifiants.mjs` pour tout bagage. Aucune dépendance : l'en-tête YAML d'une
// règle est lu ici, pour trois clés seulement (`criticality`, `code`, `validation`), et ce que ce lecteur ne
// comprend pas est « illisible », jamais « non exigée ».
//
// Le niveau d'une règle se lit sur trois arbres, la base, la tête et `origin/develop` (un sujet en retard ne cache
// pas une règle montée dans develop) ; le plus haut l'emporte. Dans l'index Anchorpost de l'arbre
// (`anchorpost/anchorpost.json`, schéma "2" ou "3") : `criticality.level` de l'entrée de `rules` dont la `key`
// est l'identifiant de la règle, le niveau effectif, criticité reçue d'une feature comprise ; ses fichiers de
// code dans `code`, son statut dans `validation.status`. Sans index : dans l'en-tête de chaque fichier de règle
// (`docs/metier/regles/<ctx>/<RULE_…>.md`), qui ne voit pas une criticité reçue d'une feature. Avec un index,
// l'en-tête des fichiers de règle que le diff touche est lu en plus, et le plus haut gagne : un index que la PR
// n'a pas régénéré ne cache pas une règle qu'elle monte. Une règle `rejected` ou `obsolete` ne compte pas.
// Le changement de niveau se lit entre le départ de la PR (la base de fusion de sa cible et de sa tête) et sa tête :
// ce qu'une autre PR a changé dans la cible depuis n'est pas un changement de celle-ci.
//
// L'en-tête du ticket (`Relecture:`, `Règles:`, aux formes que le gate `tickets` lit) se lit sur la base, sur
// `origin/develop`, sur la tête et sur chaque `origin/sujet/*` : une seule de ces lectures qui dit « double » ou
// cite une règle haute suffit.
//
// Sortie standard : une ligne par cause
// (`<règle ou ticket>\t<fichier | code | niveau | Règles: | Relecture: double>\t<chemin>\t<réf>`), une ligne
// `# …` par lecture en échec ou remarque, et, EN DERNIÈRE LIGNE, le seul verdict : `exigée`, `non exigée` ou
// `illisible`. Une cause établie suffit : « illisible » n'est rendu que si aucune ne l'est.
// Sorties : 0 non exigée · 20 exigée · 21 illisible (usage compris) · 69 outil manquant (`git`, ou la grammaire
// des identifiants), dernière ligne `illisible`. Qui appelle ne lit « non exigée » que sur la sortie 0 ET la
// dernière ligne ; tout autre code que 0 et 20 (un plantage de node sort en 1) se lit « illisible ».
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXIGEE = 'exigée';
export const NON_EXIGEE = 'non exigée';
export const ILLISIBLE = 'illisible';
export const SORTIES = { [NON_EXIGEE]: 0, [EXIGEE]: 20, [ILLISIBLE]: 21, outilManquant: 69 };
export const DEVELOP = 'develop';
export const INDEX = 'anchorpost/anchorpost.json';
const REGLES = 'docs/metier/regles/';
const NIVEAUX = ['low', 'medium', 'high'];
const HORS_VIGUEUR = ['rejected', 'obsolete'];

// La grammaire des identifiants, cherchée comme le fait identifiant.mjs : `../docs/` (un projet, et la copie de la
// boucle), à côté de ce fichier (copie à plat), puis dans le plugin.
const ICI = dirname(fileURLToPath(import.meta.url));
export const GRAMMAIRE = ['../docs/identifiants.mjs', 'identifiants.mjs', '../../../monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs']
  .map((c) => join(ICI, c))
  .find(existsSync);
const G = GRAMMAIRE ? await import(pathToFileURL(GRAMMAIRE).href) : null;

/** Une lecture en échec : elle ne vaut jamais « non exigée ». */
export class Illisible extends Error {}
/** Un outil de la chaîne manque au poste (`git`, la grammaire des identifiants) : une lecture en échec, sortie 69. */
export class OutilManquant extends Illisible {}
const illisible = (message) => {
  throw new Illisible(message);
};

// Comparable, comme `revue-exigee.mjs` : NFC, majuscules puis minuscules, pour les chemins et les identifiants.
// `cheminDuDiff` est la copie de son `cheminLu` (ce fichier ne dépend d'aucun autre script de la chaîne) ; le banc
// garde la parité.
const comparable = (s) => s.normalize('NFC').toUpperCase().toLowerCase();
const ECHAPPEMENTS = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };

/** Chemin comparable d'une ligne de `git diff --name-only`, guillemets de git défaits ; ligne citée mal formée : illisible. */
export function cheminDuDiff(ligne) {
  const f = ligne.trim();
  if (!f.startsWith('"')) return comparable(f);
  if (f.length < 2 || !f.endsWith('"')) illisible("une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit");
  const car = [...f.slice(1, -1)];
  const octets = [];
  for (let i = 0; i < car.length; i++) {
    if (car[i] === '"') illisible("une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit");
    if (car[i] !== '\\') {
      octets.push(...Buffer.from(car[i]));
      continue;
    }
    const e = car[++i];
    const octal = car.slice(i, i + 3).join('');
    if (e in ECHAPPEMENTS) octets.push(ECHAPPEMENTS[e]);
    else if (/^[0-3][0-7]{2}$/.test(octal)) {
      octets.push(parseInt(octal, 8));
      i += 2;
    } else illisible("une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit");
  }
  return comparable(Buffer.from(octets).toString('utf8'));
}

// ── L'en-tête YAML d'une règle, trois clés, sans bibliothèque ─────────────────────────────────────────────────────
const EN_TETE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
// La marque d'ordre des octets, écrite par son code : un caractère invisible ne se relit pas dans un source.
const BOM = String.fromCharCode(0xfeff);

/** Découpe `a, "b, c", {d, e}` aux virgules de premier niveau, hors guillemets ; guillemet ou crochet non refermé : illisible. */
function decouper(texte) {
  const parts = [];
  let debut = 0;
  let niveau = 0;
  let guillemet = null;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemet) {
      if (guillemet === '"' && c === '\\') i++;
      else if (c === guillemet) guillemet = null;
    } else if (c === '"' || c === "'") guillemet = c;
    else if (c === '{' || c === '[') niveau++;
    else if (c === '}' || c === ']') niveau--;
    else if (c === ',' && niveau === 0) {
      parts.push(texte.slice(debut, i));
      debut = i + 1;
    }
    if (niveau < 0) illisible('crochet fermé sans être ouvert');
  }
  if (guillemet || niveau !== 0) illisible('guillemet ou crochet non refermé');
  parts.push(texte.slice(debut));
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

/** Une valeur simple : commentaire ` # …` retiré hors guillemets, guillemets retirés. */
function scalaire(brut) {
  const v = brut.trim();
  const g = v[0];
  if (g === '"' || g === "'") {
    const fin = v.indexOf(g, 1);
    if (fin === -1 || !/^\s*(#.*)?$/.test(v.slice(fin + 1)) || v.slice(1, fin).includes('\\')) illisible(`valeur illisible : ${v}`);
    return v.slice(1, fin);
  }
  const i = v.search(/\s#/);
  return (v.startsWith('#') ? '' : i === -1 ? v : v.slice(0, i)).trim();
}

/** La valeur en ligne d'une clé : vide quand la ligne ne porte qu'un commentaire. */
const valeurEnLigne = (v) => (/^\s*#/.test(v) ? '' : v.trim());

/** L'intérieur d'un `{ … }` ou d'un `[ … ]` écrit sur une ligne, un commentaire ` # …` pouvant suivre ; autre chose : illisible. */
function interieur(valeur, ouvrant, fermant) {
  const v = valeur.trim();
  const fin = v.lastIndexOf(fermant);
  if (!v.startsWith(ouvrant) || fin === -1 || !/^\s*(#.*)?$/.test(v.slice(fin + 1))) illisible(`valeur illisible : ${v.slice(0, 80)}`);
  return v.slice(1, fin);
}

/** `{ a: 1, b: 2 }` sur une ligne → Map ; une clé écrite deux fois : illisible (la dernière ne l'emporte pas). */
function mappageEnLigne(valeur) {
  const m = new Map();
  for (const part of decouper(interieur(valeur, '{', '}'))) {
    const i = part.indexOf(':');
    const cle = part.slice(0, Math.max(i, 0)).trim();
    if (cle === '' || m.has(cle)) illisible(`mappage illisible : ${part.slice(0, 80)}`);
    m.set(cle, part.slice(i + 1));
  }
  return m;
}

/** Une ligne sans son commentaire (` # …`, ou `#` en tête), les guillemets respectés. */
function sansCommentaire(ligne) {
  let guillemet = null;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (guillemet) {
      if (guillemet === '"' && c === '\\') i++;
      else if (c === guillemet) guillemet = null;
    } else if (c === '"' || c === "'") guillemet = c;
    else if (c === '#' && (i === 0 || ligne[i - 1] === ' ' || ligne[i - 1] === '\t')) return ligne.slice(0, i);
  }
  return ligne;
}

/** Les lignes d'un bloc à son premier niveau d'indentation (les plus profondes sont le contenu d'une de ces lignes). */
function premierNiveau(bloc) {
  const retrait = (l) => l.length - l.trimStart().length;
  const min = bloc.reduce((m, l) => Math.min(m, retrait(l)), Infinity);
  return bloc.filter((l) => retrait(l) === min).map((l) => l.trim());
}

/** La valeur d'une clé qui ouvre un mappage ou une liste en ligne (`{ … }`, `[ … ]`), ramenée sur une ligne si elle est pliée, sans ses commentaires ; sinon `null`. */
function enLigne(cle) {
  const debut = cle.valeur !== '' ? cle.valeur : (cle.bloc[0] ?? '').trim();
  // Chaque ligne perd son commentaire avant d'être jointe : celui d'une ligne pliée avalerait sinon la suite.
  return /^[[{]/.test(debut) ? [cle.valeur, ...cle.bloc].map((l) => sansCommentaire(l).trim()).filter(Boolean).join(' ') : null;
}

/** Un champ d'un mappage écrit en ligne (`{ … }`) ou en bloc ; absent : `undefined` ; deux fois : illisible. */
function champ(cle, nom) {
  const ligne = enLigne(cle);
  if (ligne !== null) return mappageEnLigne(ligne).get(nom);
  if (cle.valeur !== '') illisible(`mappage illisible : ${cle.valeur.slice(0, 80)}`);
  if (cle.bloc.length === 0) illisible('clé sans valeur');
  const lignes = premierNiveau(cle.bloc).filter((l) => new RegExp(`^${nom}[ \\t]*:`).test(l));
  if (lignes.length > 1) illisible(`\`${nom}\` écrit deux fois`);
  return lignes[0]?.slice(lignes[0].indexOf(':') + 1);
}

/**
 * Ce que l'en-tête d'un fichier de règle dit de sa criticité : `{ niveau, code, enVigueur }`.
 * `niveau` : `low`, `medium`, `high`, ou `null` sans clé `criticality` (« à classer ») ; les deux formes sont lues,
 * la nue (`criticality: high`) et `{ level, by, reason }`, en ligne ou en bloc. `code` : la liste, en ligne ou en
 * bloc, vide sans la clé. `enVigueur` : faux pour `validation.status` `rejected` ou `obsolete` seulement.
 * Sans en-tête, ou une de ces clés écrite autrement : `Illisible`.
 */
export function enTeteDeRegle(texte) {
  const m = EN_TETE.exec(texte.startsWith(BOM) ? texte.slice(1) : texte);
  if (!m) illisible("pas d'en-tête YAML (`---` en première ligne, refermé par `---`)");
  const cles = new Map();
  let courante = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    if (/^\s*(#.*)?$/.test(ligne)) continue;
    const cle = /^([A-Za-z_][\w-]*)[ \t]*:(?:[ \t]+(.*))?$/.exec(ligne);
    if (cle) {
      if (cles.has(cle[1])) illisible(`clé \`${cle[1]}\` écrite deux fois`);
      courante = { valeur: valeurEnLigne(cle[2] ?? ''), bloc: [] };
      cles.set(cle[1], courante);
    } else if (courante && /^(\s|- |-$)/.test(ligne)) courante.bloc.push(ligne);
    else illisible(`ligne d'en-tête illisible : ${ligne.slice(0, 80)}`);
  }

  let niveau = null;
  const criticite = cles.get('criticality');
  if (criticite) {
    const brut = criticite.valeur !== '' && enLigne(criticite) === null ? criticite.valeur : champ(criticite, 'level');
    niveau = brut === undefined ? illisible('`criticality` sans `level`') : scalaire(brut);
    if (!NIVEAUX.includes(niveau)) illisible(`criticité « ${niveau} » : attendu low, medium ou high`);
  }

  let code = [];
  const c = cles.get('code');
  if (c) {
    let items;
    const ligne = enLigne(c);
    if (ligne !== null) items = decouper(interieur(ligne, '[', ']'));
    else {
      if (c.valeur !== '' || c.bloc.length === 0) illisible(`\`code\` illisible : ${c.valeur.slice(0, 80) || 'sans valeur'}`);
      items = premierNiveau(c.bloc).map((l) => (/^-\s+\S/.test(l) ? l.slice(1) : illisible(`\`code\` illisible : ${l}`)));
    }
    code = items.map(scalaire);
    if (code.some((p) => p === '')) illisible('`code` porte un chemin vide');
  }

  let statut;
  try {
    const validation = cles.get('validation');
    statut = validation ? scalaire(champ(validation, 'status') ?? '') : '';
  } catch {
    statut = ''; // statut que ce lecteur ne comprend pas : la règle compte
  }
  return { niveau, code, enVigueur: !HORS_VIGUEUR.includes(statut) };
}

// ── L'index Anchorpost ────────────────────────────────────────────────────────────────────────────────────────────
/** Les règles d'un index au pivot 2 ou 3 : Map clé comparable → `{ cle, niveau, code, enVigueur }`. Autre chose : `Illisible`. */
export function reglesDeLIndex(texte) {
  let index;
  try {
    index = JSON.parse(texte);
  } catch {
    illisible(`${INDEX} n'est pas du JSON`);
  }
  if (index === null || typeof index !== 'object' || Array.isArray(index)) illisible(`${INDEX} n'est pas un objet`);
  if (index.schema !== '2' && index.schema !== '3') illisible(`${INDEX} de schéma ${JSON.stringify(index.schema)} : ce lecteur lit "2" et "3"`);
  if (!Array.isArray(index.rules)) illisible(`${INDEX} sans liste \`rules\``);
  const regles = new Map();
  for (const r of index.rules) {
    if (typeof r?.key !== 'string' || r.key === '') illisible(`${INDEX} : une règle sans \`key\``);
    if (regles.has(comparable(r.key))) illisible(`${INDEX} : deux entrées pour ${r.key}`);
    const niveau = r.criticality === undefined ? null : r.criticality?.level;
    if (niveau !== null && !NIVEAUX.includes(niveau)) illisible(`${INDEX} : \`criticality.level\` de ${r.key} illisible`);
    const code = r.code ?? [];
    if (!Array.isArray(code) || code.some((p) => typeof p !== 'string')) illisible(`${INDEX} : \`code\` de ${r.key} illisible`);
    regles.set(comparable(r.key), { cle: r.key, niveau, code, enVigueur: !HORS_VIGUEUR.includes(r.validation?.status) });
  }
  return regles;
}

// ── Les lectures git ──────────────────────────────────────────────────────────────────────────────────────────────
const SHA = /^[0-9a-f]{40}$/;
const NOM_DE_BRANCHE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Un nom de branche reçu (`develop`, `sujet/<nom>`) devient la réf qui ne se lit que d'une façon,
 * `refs/remotes/origin/<branche>`. Tout autre texte (`HEAD`, une réf, un texte à blanc ou à retour ligne, un tiret
 * en tête) est refusé, sans être recopié.
 */
export function brancheDOrigin(nom) {
  if (typeof nom !== 'string' || !NOM_DE_BRANCHE.test(nom) || nom === 'HEAD' || /\.\.|\/\/|\/$|\.lock$|\.lock\/|\/\.|\.$/.test(nom))
    illisible('branche refusée : attendu un nom de branche, `develop` ou `sujet/<nom>`');
  return `refs/remotes/origin/${nom}`;
}
/** Le sommet d'une PR : un sha de 40 caractères, et rien d'autre. */
export function sommet(sha) {
  return typeof sha === 'string' && SHA.test(sha) ? sha : illisible('sommet refusé : attendu un sha de 40 caractères');
}
/** Le nom qu'on écrit d'une réf : `origin/develop` pour `refs/remotes/origin/develop`. */
const court = (nom) => nom.replace(/^refs\/remotes\//, '');

/**
 * Lecteur d'objets git du dépôt de `cwd`. `verifier(nom)` → le sha du commit d'un sha ou d'une réf entière, qui n'est
 * pas une réf symbolique ;
 * les autres lectures prennent ce sha : `baseDeFusion(a, b)`, `chemins(commit)` (tout l'arbre),
 * `lister(commit, prefixe)`, `lire(commit, chemins)` → Map chemin → texte ; `sujets()` → les
 * `refs/remotes/origin/sujet/*`. Chaque commande porte ses options : les chemins partent de la racine du dépôt quel
 * que soit le dossier courant (`--full-tree`, `<commit>:<chemin>`), et les objets remplacés ne sont pas suivis.
 */
export function lecteurGit(cwd = process.cwd()) {
  const git = (args, input) => {
    try {
      return execFileSync('git', ['--no-replace-objects', ...args], { cwd, input, maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (e) {
      if (e?.code === 'ENOENT') throw new OutilManquant('git est requis par les scripts de la chaîne');
      throw e;
    }
  };
  const essayer = (args, message, input) => {
    try {
      return git(args, input);
    } catch (e) {
      if (e instanceof Illisible) throw e;
      illisible(message);
    }
  };
  const lignes = (sortie, separateur) => sortie.toString('utf8').split(separateur).filter(Boolean);
  // `git symbolic-ref -q` sort en 0 pour une réf symbolique (`origin/HEAD`), en 1 pour une réf ordinaire ou absente.
  const symbolique = (nom) => {
    try {
      git(['symbolic-ref', '-q', nom]);
      return true;
    } catch (e) {
      if (e instanceof Illisible) throw e;
      return false;
    }
  };
  return {
    verifier(nom) {
      if (nom.startsWith('refs/') && symbolique(nom)) illisible(`${court(nom)} est une référence symbolique`);
      const commit = essayer(['rev-parse', '--verify', '-q', `${nom}^{commit}`], `référence ${court(nom)} introuvable`).toString('utf8').trim();
      return SHA.test(commit) ? commit : illisible(`référence ${court(nom)} introuvable`);
    },
    baseDeFusion(a, b) {
      const commit = essayer(['merge-base', a, b], 'pas de base de fusion entre la cible et la tête').toString('utf8').trim();
      return SHA.test(commit) ? commit : illisible('pas de base de fusion entre la cible et la tête');
    },
    sujets() {
      return lignes(essayer(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/sujet/'], 'branches de sujet illisibles'), '\n');
    },
    chemins(commit) {
      return lignes(essayer(['ls-tree', '-r', '-z', '--full-tree', '--name-only', commit], `arbre de ${commit} illisible`), '\0');
    },
    lister(commit, prefixe) {
      return lignes(essayer(['ls-tree', '-r', '-z', '--full-tree', '--name-only', commit, '--', prefixe], `arbre de ${commit} illisible`), '\0');
    },
    lire(commit, chemins) {
      const textes = new Map();
      if (chemins.length === 0) return textes;
      const brut = essayer(['cat-file', '--batch'], `objets de ${commit} illisibles`, chemins.map((c) => `${commit}:${c}\n`).join(''));
      let i = 0;
      for (const chemin of chemins) {
        const fin = brut.indexOf(10, i);
        const taille = / blob (\d+)$/.exec(brut.subarray(i, Math.max(fin, i)).toString('utf8'))?.[1];
        if (fin === -1 || taille === undefined) illisible(`${chemin} illisible dans ${commit}`);
        textes.set(chemin, brut.subarray(fin + 1, fin + 1 + Number(taille)).toString('utf8'));
        i = fin + 2 + Number(taille);
      }
      return textes;
    },
  };
}

// ── Le calcul ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** `docs/metier/regles/<ctx>/<RULE_…>.md`, à la racine du dépôt et dans le dossier de son contexte → clé comparable, sinon `null`. */
function regleDuChemin(chemin) {
  const m = /^docs\/metier\/regles\/([^/]+)\/([^/]+)\.md$/.exec(comparable(chemin));
  const lu = m && G.lireIdentifiant(m[2]);
  return lu?.type === 'RULE' && lu.index === undefined && comparable(G.dossierDuContexte(lu.contexte)) === m[1] ? m[2] : null;
}

/** Un chemin de `code`, comparable et sans détour (`apps//api`, `apps/./api`, `apps/x/../api`) ; `null` s'il sort du dépôt ou ne nomme rien. */
function cheminDeCode(chemin) {
  const segments = [];
  for (const segment of chemin.trim().split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment !== '..') segments.push(segment);
    else if (segments.pop() === undefined) return null;
  }
  return segments.length ? comparable(segments.join('/')) : null;
}

/** Les règles hautes et en vigueur de l'arbre d'un commit : `{ regles: Map clé comparable → { cle, code }, source }`. `nom` : la réf, pour les messages. */
function hautes(nom, commit, touchees, lecteur) {
  const fichiers = new Map(); // clé comparable → chemin réel
  for (const chemin of lecteur.lister(commit, REGLES)) {
    const cle = regleDuChemin(chemin);
    if (cle) fichiers.set(cle, chemin);
  }
  const avecIndex = lecteur.lister(commit, INDEX).includes(INDEX);
  const regles = avecIndex ? reglesDeLIndex(lecteur.lire(commit, [INDEX]).get(INDEX)) : new Map();
  // Sans index : tous les en-têtes. Avec : ceux des fichiers de règle que le diff touche, en plus.
  const aLire = [...fichiers].filter(([cle]) => !avecIndex || touchees.has(cle));
  const textes = lecteur.lire(commit, aLire.map(([, chemin]) => chemin));
  for (const [cle, chemin] of aLire) {
    let lu;
    try {
      lu = enTeteDeRegle(textes.get(chemin));
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      illisible(`${nom}:${chemin} : ${e.message}`);
    }
    const connu = regles.get(cle);
    const rang = (n) => NIVEAUX.indexOf(n);
    regles.set(cle, {
      cle: connu?.cle ?? chemin.split('/').pop().slice(0, -3),
      niveau: connu && rang(connu.niveau) > rang(lu.niveau) ? connu.niveau : lu.niveau,
      code: [...(connu?.code ?? []), ...lu.code],
      enVigueur: (connu?.enVigueur ?? false) || lu.enVigueur,
    });
  }
  return { regles: new Map([...regles].filter(([, r]) => r.niveau === 'high' && r.enVigueur)), source: avecIndex ? INDEX : REGLES };
}

// Une ligne d'en-tête, aux formes que le gate `tickets` lit (`enTete`, `tickets-regles.mjs`) : `Règles: …`,
// `- Règles: …`, `**Règles:** …`, sans égard à la casse.
const ligneDEnTete = (nom) => new RegExp(`^(?:- )?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');
const RELECTURE = ligneDEnTete('Relecture');
const REGLES_CITEES = ligneDEnTete('Règles');
/** Les valeurs d'une ligne dans l'en-tête d'un document : avant sa première section `## `. */
function valeursDEnTete(texte, motif) {
  const lignes = texte.split(/\r?\n/);
  const fin = lignes.findIndex((l) => /^## /.test(l));
  return (fin === -1 ? lignes : lignes.slice(0, fin)).map((l) => motif.exec(l)?.[1]).filter((v) => v !== undefined);
}
/** Les règles que des lignes `Règles:` citent, clés comparables : des identifiants séparés par des virgules ou des blancs, entre accents graves ou nus, ou `—`. */
function reglesCitees(valeurs, ou) {
  const regles = [];
  for (const v of valeurs)
    for (const morceau of scalaire(v).split(/[\s,]+/).filter((m) => m !== '' && !/^[—–-]$/.test(m))) {
      const nu = /^`([^`]+)`$/.exec(morceau)?.[1] ?? morceau;
      const lu = G.lireIdentifiant(nu);
      if (lu?.type !== 'RULE' || lu.index !== undefined) illisible(`${ou} : ligne \`Règles:\`, « ${morceau.slice(0, 80)} » n'est pas un identifiant de règle`);
      regles.push(comparable(nu));
    }
  return regles;
}

/**
 * Ce que l'en-tête du ticket dit dans l'arbre d'un commit : `{ chemin, double, regles: [{ cle, chemin }] }`, ou `null`
 * si l'arbre ne le porte pas. Sans ligne `Règles:` sur le ticket, celle de sa spec est lue à sa place ; `Règles: —`
 * est une ligne : le ticket dit lui-même qu'il n'en réalise aucune, et la spec n'est pas lue.
 */
function enTeteDuTicket(ticket, nom, commit, lecteur) {
  const motif = G.fichierDuTicket(ticket) ?? illisible(`${ticket} n'est pas un identifiant de ticket`);
  const docs = lecteur.lister(commit, 'docs/');
  const un = (fichiers, quoi) => (fichiers.length > 1 ? illisible(`${fichiers.length} fichiers pour ${quoi} sur ${nom} : ${fichiers.join(', ')}`) : fichiers[0]);
  const chemin = un(docs.filter((p) => motif.test(`/${p}`) && !G.estArchive(`/${p}`)), `le ticket ${ticket}`);
  if (chemin === undefined) return null;
  const texte = lecteur.lire(commit, [chemin]).get(chemin);
  const relectures = valeursDEnTete(texte, RELECTURE);
  for (const v of relectures) if (scalaire(v) !== 'double') illisible(`${nom}:${chemin} : ligne \`Relecture:\` « ${v.trim().slice(0, 80)} », seule valeur \`double\``);
  const lignes = valeursDEnTete(texte, REGLES_CITEES);
  const regles = reglesCitees(lignes, `${nom}:${chemin}`).map((cle) => ({ cle, chemin }));
  if (lignes.length === 0) {
    const { spec } = G.lireTicket(ticket);
    const fichier = un(docs.filter((p) => G.identifiantDeLaSpec(p.split('/').pop()) === spec), `la spec ${spec}`);
    if (fichier !== undefined)
      for (const cle of reglesCitees(valeursDEnTete(lecteur.lire(commit, [fichier]).get(fichier), REGLES_CITEES), `${nom}:${fichier}`)) regles.push({ cle, chemin: fichier });
  }
  return { chemin, double: relectures.length > 0, regles };
}

/**
 * La PR exige-t-elle deux relectures ? `fichiers` : les lignes de `git diff --name-only --no-renames` ; `base`,
 * `tete` : la branche cible (un nom de branche) et le sommet (un sha) ; `tickets` : les identifiants des tickets de la PR
 * (aucun, un, ou deux quand son titre et sa branche n'en nomment pas le même) ; `develop` : le nom de la branche d'intégration.
 * Rend `{ reponse, causes, illisibles, remarques, outilManquant }`.
 */
export function doubleRelecture({ fichiers, base: cible, tete: sha, tickets = [], develop: integration = DEVELOP, lecteur = lecteurGit() }) {
  const causes = [];
  const illisibles = [];
  const remarques = [];
  let outilManquant = false;
  const essayer = (lecture) => {
    try {
      return lecture();
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      outilManquant ||= e instanceof OutilManquant;
      if (!illisibles.includes(e.message)) illisibles.push(e.message);
      return undefined;
    }
  };
  if (!G) return { reponse: ILLISIBLE, causes, illisibles: [`scripts/docs/identifiants.mjs introuvable depuis ${ICI}`], remarques, outilManquant: true };

  // Trois réfs : deux branches d'origin, lues en entier, et un sha. Tout ce qui suit lit leurs commits.
  const [base, tete, develop] = [{ branche: cible }, { sommet: sha }, { branche: integration }];
  const reference = (ref) => ('branche' in ref ? brancheDOrigin(ref.branche) : sommet(ref.sommet));
  const commitDe = (ref) => lecteur.verifier(reference(ref));
  const nomDe = (ref) => court(reference(ref));

  // 0. L'entrée : des chemins, un par ligne, qui existent au départ ou à la tête de la PR.
  let chemins = [];
  essayer(() => {
    const lignes = fichiers.filter((f) => f.trim() !== '');
    if (lignes.some((f) => /[\t\0]/.test(f))) illisible("l'entrée porte une tabulation ou un octet nul : attendu la sortie de `git diff --name-only --no-renames`, un chemin par ligne");
    chemins = lignes.map((f) => ({ ecrit: f.trim(), lu: cheminDuDiff(f) }));
  });
  const depart = essayer(() => lecteur.baseDeFusion(commitDe(base), commitDe(tete)));
  essayer(() => {
    if (depart === undefined || chemins.length === 0) return;
    const connus = new Set([...lecteur.chemins(depart), ...lecteur.chemins(commitDe(tete))].map(comparable));
    const inconnus = chemins.filter((c) => !connus.has(c.lu)).length;
    if (inconnus > 0) {
      chemins = [];
      illisible(`${inconnus} chemin(s) de l'entrée n'existent ni au départ ni à la tête de la PR : attendu la sortie de \`git diff --name-only --no-renames\``);
    }
  });
  const touchees = new Set(chemins.map((c) => regleDuChemin(c.lu)).filter(Boolean));

  // Les règles hautes d'un arbre, lues une fois par commit : la base est souvent `origin/develop`, ou le départ.
  // Un échec est gardé comme une réussite, avec la réf qui l'a lu la première : il n'est dit qu'une fois.
  const parCommit = new Map();
  const hautesDe = (commit, nom) => {
    if (!parCommit.has(commit)) {
      try {
        parCommit.set(commit, hautes(nom, commit, touchees, lecteur));
      } catch (e) {
        if (!(e instanceof Illisible) || e instanceof OutilManquant) throw e;
        parCommit.set(commit, new Illisible(e.message.startsWith(`${nom}:`) ? e.message : `${nom} : ${e.message}`));
      }
    }
    const lu = parCommit.get(commit);
    if (lu instanceof Illisible) throw lu;
    return lu;
  };

  // 1. Le diff touche le fichier d'une règle haute, ou un fichier de son `code` : sur la base, la tête et develop.
  const hautesQuelquePart = new Map(); // clé comparable → clé écrite
  for (const ref of [base, tete, develop])
    essayer(() => {
      const nom = nomDe(ref);
      const { regles } = hautesDe(commitDe(ref), nom);
      const parCode = new Map();
      for (const [cle, r] of regles) {
        hautesQuelquePart.set(cle, r.cle);
        for (const p of r.code) {
          const entree = cheminDeCode(p);
          if (entree !== null) parCode.set(entree, [...(parCode.get(entree) ?? []), r.cle]);
        }
      }
      for (const c of chemins) {
        const regle = regles.get(regleDuChemin(c.lu));
        if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref: nom });
        // Le chemin lui-même, puis chacun de ses dossiers : une entrée de `code` peut nommer un dossier.
        for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')
          for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref: nom });
      }
    });

  // 2. La PR change le niveau d'une règle vers ou depuis « haute » : de son départ à sa tête.
  essayer(() => {
    if (depart === undefined) return;
    const avant = hautesDe(depart, 'le départ de la PR');
    const apres = hautesDe(commitDe(tete), nomDe(tete));
    for (const [cle, r] of [...avant.regles, ...apres.regles])
      if (avant.regles.has(cle) !== apres.regles.has(cle)) causes.push({ sujet: r.cle, motif: 'niveau', chemin: apres.source, ref: nomDe(tete) });
  });

  // 3. Le ticket : `Relecture: double`, ou une règle haute citée en `Règles:` (la sienne, sinon celle de sa spec),
  //    sur la base, develop, la tête et chaque sujet.
  if (tickets.length > 0) {
    const refs = new Map(); // commit → nom : un même commit n'est lu qu'une fois
    for (const ref of [base, develop, tete]) essayer(() => refs.has(commitDe(ref)) || refs.set(commitDe(ref), nomDe(ref)));
    for (const nom of essayer(() => lecteur.sujets()) ?? []) essayer(() => refs.has(lecteur.verifier(nom)) || refs.set(lecteur.verifier(nom), court(nom)));
    for (const ticket of new Set(tickets)) {
      let trouve = false;
      for (const [commit, nom] of refs)
        essayer(() => {
          const lu = enTeteDuTicket(ticket, nom, commit, lecteur);
          if (!lu) return;
          trouve = true;
          if (lu.double) causes.push({ sujet: ticket, motif: 'Relecture: double', chemin: lu.chemin, ref: nom });
          for (const { cle, chemin } of lu.regles) if (hautesQuelquePart.has(cle)) causes.push({ sujet: hautesQuelquePart.get(cle), motif: 'Règles:', chemin, ref: nom });
        });
      if (!trouve) remarques.push(`ticket ${ticket} absent de ${[...refs.values()].join(', ')} : aucun en-tête lu`);
    }
  }

  // Une cause par (règle ou ticket, motif, chemin) : la première réf où elle est lue.
  const vues = new Set();
  const uniques = causes.filter((c) => {
    const k = `${c.sujet}\t${c.motif}\t${c.chemin}`;
    return !vues.has(k) && vues.add(k);
  });
  const reponse = uniques.length ? EXIGEE : illisibles.length ? ILLISIBLE : NON_EXIGEE;
  return { reponse, causes: uniques, illisibles, remarques, outilManquant: reponse === ILLISIBLE && outilManquant };
}

/**
 * Ce que la ligne de commande écrit : les causes, les lectures en échec et les remarques en `# …`, puis le verdict,
 * seul sur la dernière ligne. Chaque champ et chaque message tient sur une ligne, sans tabulation ni caractère de
 * commande : rien de ce qui est lu dans le dépôt ne peut écrire une ligne de plus.
 */
export function texte({ reponse, causes, illisibles, remarques }) {
  // Tout caractère de commande, séparateurs de ligne d'Unicode compris (U+0085, U+2028, U+2029), devient une espace.
  const SEPARATEURS = [0x85, 0x2028, 0x2029].map((c) => String.fromCharCode(c)).join('');
  const propre = (t) => `${t}`.replace(new RegExp(`[\\x00-\\x1f\\x7f${SEPARATEURS}]+`, 'g'), ' ').slice(0, 500);
  return [
    ...causes.map((c) => [c.sujet, c.motif, c.chemin, c.ref].map(propre).join('\t')),
    ...illisibles.map((m) => `# illisible : ${propre(m)}`),
    ...remarques.map((m) => `# ${propre(m)}`),
    reponse,
  ]
    .map((l) => `${l}\n`)
    .join('');
}

const USAGE = 'usage : git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> | node double-relecture.mjs --base <branche> --tete <sha> [--titre <titre>] [--branche <branche de tête>]';

/** `--base` et `--tete`, exigées et non vides ; `--titre` et `--branche`, facultatives, vides admises. Autre chose : `null`. */
export function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    const valeur = argv[i + 1];
    if (!['--base', '--tete', '--titre', '--branche'].includes(cle) || valeur === undefined || cle.slice(2) in options) return null;
    options[cle.slice(2)] = valeur;
  }
  return options.base && options.tete ? options : null;
}

/** Les tickets d'une PR : celui que `ticketDeLaPr` rend (le titre d'abord), et celui de la branche s'il est autre. */
export function ticketsDeLaPr(titre = '', branche = '') {
  return G ? [...new Set([G.ticketDeLaPr(titre, branche), G.identifiantDeBranche(branche)].filter(Boolean))] : [];
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (estPointEntree()) {
  const options = lireArguments(process.argv.slice(2));
  let resultat;
  if (!options) resultat = { reponse: ILLISIBLE, causes: [], illisibles: [USAGE], remarques: [] };
  else
    try {
      const fichiers = readFileSync(0, 'utf8').split('\n');
      resultat = doubleRelecture({ fichiers, base: options.base, tete: options.tete, tickets: ticketsDeLaPr(options.titre, options.branche) });
    } catch (e) {
      resultat = { reponse: ILLISIBLE, causes: [], illisibles: ['le calcul a échoué sans conclure'], remarques: [] };
    }
  process.stdout.write(texte(resultat));
  process.exitCode = resultat.outilManquant ? SORTIES.outilManquant : SORTIES[resultat.reponse];
}
````

### § 3 — Le mot de l'étape 0

`skills/chaine/fusionner/SKILL.md:14`, dans la phrase qui nomme les `.mjs` posés. Rien d'autre ne change dans ce fichier.

Ancien :

````markdown
`scripts/commits-a-relire.mjs` → `scripts/chaine/` (exécutables)
````

Nouveau :

````markdown
`scripts/commits-a-relire.mjs`, `scripts/double-relecture.mjs` → `scripts/chaine/` (exécutables)
````

Si le ticket 58 est entré avant, la liste porte déjà ses deux modules : le mot s'ajoute à la suite, avant la flèche.

### § 4 — La version et la note

`.claude-plugin/plugin.json:3` : `"version": "7.20.0"` devient `"version": "7.21.0"` (règle de repli : décision 20).

`NOTES-DE-VERSION.md` : cette note, entre le paragraphe d'introduction et `## 7.20.0 — 2026-11-18`, avec la date du jour de la livraison :

````markdown
## 7.21.0 — 2026-11-18

### Ce qui change

Le skill `fusionner` porte un calcul nouveau, `scripts/double-relecture.mjs` : il dit si une PR exige deux relectures indépendantes, parce que son ticket porte la ligne `Relecture: double` ou cite en `Règles:` une règle de criticité haute (sans cette ligne, celle de sa spec est lue), que son diff touche le fichier d'une règle haute ou un fichier que le champ `code` de cette règle nomme, ou qu'elle change le niveau d'une règle vers ou depuis « haute ». Il rend, en dernière ligne de sa sortie, « exigée », « non exigée » ou « illisible », après les règles en cause ; une lecture en échec ne vaut jamais « non exigée ». Aucun script ne l'appelle encore : c'est une brique de la relecture indépendante, qui arrive par étapes. L'étape 0 de `fusionner` (`poser`) le nomme parmi les scripts à copier.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Rien d'autre pour l'instant : aucun script de la chaîne n'appelle ce calcul, rien ne change au passage du capitaine, et il n'y a pas à le relancer.
3. À la prochaine repose de `fusionner`, son étape 0 copie `scripts/double-relecture.mjs` dans `scripts/chaine/` avec son banc : rien à faire de plus.
````

### § 5 — Livrer

1. « Vérification », points 1 à 5.
2. Commit, push, PR vers `main` hors brouillon, sans `à-fusionner` (décision 21). Dans le corps de la PR : ce que le fichier rend, les six précisions de ce ticket (« Ce qui n'a pas été établi »), pour que l'architecte les lise à la contre-revue.
3. Si `main` a bougé : règle de repli, puis « Vérification » à nouveau.

## Surfaces

| Surface | Preuve (`double-relecture.test.mjs`) |
| --- | --- |
| le fichier d'une règle haute, ou un fichier de son `code`, exige deux relectures ; les causes nomment la règle, le motif, le chemin, la réf | « règle haute touchée, avec index … » |
| le niveau de l'index est le niveau effectif, criticité reçue d'une feature comprise ; sans index, elle n'est pas vue | « le niveau de l'index est le niveau effectif … » |
| une règle moyenne, basse ou à classer n'exige rien | « règle moyenne seule, ou basse, ou à classer : non exigée » |
| la base relue fait foi : une règle montée après le verdict change la réponse (`A-90`), sans être un changement de la PR | « règle montée à haute après le verdict … » |
| la tête est lue : une PR qui monte une règle est vue, index régénéré ou non ; une PR qui la baisse ou la supprime aussi | « une PR qui monte elle-même une règle à haute est vue sur sa tête … » |
| une règle rejetée ou obsolète ne compte pas ; la PR qui la rejette est vue | « règle haute rejetée ou obsolète … » |
| sans index, l'en-tête sous ses deux formes ; `code` en ligne, en bloc, dossier ; projet sans règles | « projet sans index … » |
| seul le chemin de la convention, à la racine, est le fichier d'une règle | « seul un fichier `docs/metier/regles/<ctx>/<RULE_…>.md` de la racine … » |
| une lecture en échec ne vaut jamais « non exigée » ; elle est dite une fois par commit ; un index à deux entrées de même clé ; un dépôt sans `origin/develop` | « index illisible, schéma inconnu, en-tête illisible, référence introuvable, ligne du diff mal citée … » |
| une cause établie suffit, l'échec reste dit, le verdict vient en dernier | « une cause établie suffit … » |
| `Relecture: double` : l'en-tête du ticket, pour le ticket de la PR seul ; retirée par la PR, lue sur la base ; ajoutée, lue sur la tête | « `Relecture: double` écrite sur le ticket … » |
| une autre valeur, un ticket en double : illisible ; ticket absent ou archivé : une remarque | « ligne `Relecture:` d'une autre valeur … » |
| `Règles:` : une règle haute citée suffit ; la forme de la ligne ; un jeton qui n'est pas une règle | « un ticket qui cite une règle haute en `Règles:` … » |
| le niveau se lit aussi sur `origin/develop` | « le niveau se lit aussi sur origin/develop … » |
| l'en-tête du ticket sur la base, `origin/develop` et chaque sujet | « l'en-tête du ticket se lit sur la base, sur origin/develop et sur chaque origin/sujet/* … » |
| le changement de niveau, vers et depuis « haute », du départ à la tête | « une PR qui change le niveau d'une règle vers ou depuis « haute » … », et « règle montée à haute après le verdict … » pour le départ |
| le ticket de la PR : `ticketDeLaPr`, puis la branche | « le ticket de la PR est celui de `ticketDeLaPr` … », « le ticket se lit dans le titre et dans le nom de la branche de tête … » |
| les lignes d'en-tête aux formes du gate : gras, puce, casse (`A-117`) | « les lignes `Règles:` et `Relecture:` se lisent aux formes que le gate `tickets` lit … » |
| le ticket que la PR crée est lu sur sa tête (`A-117`) | « le ticket que la PR crée elle-même est lu sur sa tête … » |
| sans ligne `Règles:`, celle de la spec ; `Règles: —` dit « aucune » (`A-117`) | « un ticket sans ligne `Règles:` : celle de sa spec est lue à sa place … » |
| l'entrée contrôlée : tabulation, octet nul, chemin inconnu ; diff vide (`A-117`) | « l'entrée : une tabulation ou un octet nul … », « l'entrée est contrôlée : `-z`, `--name-status` … » |
| les chemins de `code` normalisés (`A-117`) | « les chemins de `code` sont normalisés … » |
| la sortie : une ligne par message, le verdict seul en dernière ligne (`A-117`, `A-114`) | « la sortie : une ligne par cause, par échec, par remarque … » |
| l'en-tête YAML : formes lues, formes refusées, commentaire d'une ligne pliée, clé en double, temps linéaire | « l'en-tête d'une règle : les formes lues … », « lecture en temps linéaire … » |
| l'index : `key`, `criticality.level`, `code`, `validation.status`, pivots 2 et 3 | « l'index : `rules[].key` … » |
| les lignes de `git diff --name-only`, en parité avec `revue-exigee.mjs` ; les arguments ; les noms de branche et les sommets admis et refusés | « les lignes de `git diff --name-only` … », « les lignes du diff se lisent comme `revue-exigee.mjs` les lit … » |
| depuis la copie des outils de la boucle : les réfs, jamais l'arbre de travail ; sorties 0, 20, 21, 69 | « en ligne de commande, depuis la copie des outils de la boucle … » |
| à la racine du dépôt, sans obéir au dossier courant, à un objet remplacé, à un tag ou une branche locale du nom de la cible, ni à une réf symbolique (`A-117`) | « le calcul se place à la racine du dépôt … » |
| un fichier de code renommé, vu par `--no-renames` (`A-117`) | « un fichier de code renommé … » |
| le lecteur git : un objet absent, plusieurs objets en une lecture, l'arbre entier, la base de fusion, les branches de sujet | « le lecteur git … » |
| le point d'entrée par un lien symbolique, un dossier à espace et à accent | « le point d'entrée est reconnu … » |
| l'étape 0 nomme le module | `git diff origin/main -- skills/chaine/fusionner/SKILL.md` (aucun test ne lit cette phrase) ; le garde des bancs posés pose le dossier entier |
| version et note | test existant de `scripts/depot.test.mjs:1093` |

## Vérification

### Pour la session

1. `pnpm install --frozen-lockfile && pnpm test` : la suite entière, verte. Sur `085d7d4`, **848 tests** avec ces fichiers (813 sans : 848 moins les 35 du banc).
2. `node --test skills/chaine/fusionner/scripts/double-relecture.test.mjs` : 35 sur 35, en six secondes environ.
3. `git diff --stat origin/main` : cinq fichiers, deux neufs et trois modifiés ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` ; `git diff origin/main -- skills/chaine/fusionner/SKILL.md` ne montre qu'une ligne, et dans cette ligne le seul mot ajouté.
4. Le banc posé à plat : il est rejoué par `scripts/poses.test.mjs` dans la suite du point 1 ; pour le voir seul, copier les deux fichiers et `revue-exigee.mjs` dans `<dossier>/scripts/chaine/`, `skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs` dans `<dossier>/scripts/docs/`, puis `node --test <dossier>/scripts/chaine/double-relecture.test.mjs`.
5. Les mutations : le script ci-dessous sur ce dossier posé à plat, `python3 <fichier> <dossier>/scripts/chaine` : **101 rouges sur 101**, en une dizaine de minutes. Il remet le fichier après chaque mutation.

### Ce qui a été joué en écrivant ce ticket

Le 2026-11-18, dans des clones jetables de `origin/main`, sous un `TMPDIR` privé : la première version à `99a6214` puis `22b2d49`, la deuxième (`A-113`) à `6fc652d`, celle-ci (`A-117`) dans un clone neuf à `e45a504`, puis à `085d7d4` quand `main` a encore bougé. Les blocs de ce ticket (banc, module, mutations, mot de l'étape 0, note) ont été relus par un script qui les tire du texte et les rejoue : ce qui suit est le résultat de ce texte, pas d'un brouillon.

- Le banc : 35 sur 35, six secondes environ, dans l'arbre du plugin et posé à plat ; rien ne reste dans le dossier temporaire.
- La suite entière : 848 sur 848 à `085d7d4`, avec les deux fichiers, le mot de l'étape 0, la version 7.21.0 et sa note, deux fois (avant et après l'alignement de `--base` sur le ticket 59) ; 830 sur 830 à `e45a504` plus tôt. Le banc y est rejoué posé à plat par `scripts/poses.test.mjs`, dont le test a duré de 4 minutes 30 à 7 minutes 15 sur les 10 de son plafond, sur une machine partagée et chargée (jusqu'à une charge de 10 pour 4 cœurs ; le banc neuf y pèse six secondes) : marge à surveiller, elle ne tient pas à ce ticket. Les versions précédentes avaient passé la suite à `99a6214`, `22b2d49` et `6fc652d`.
- Les mutations : 101 rouges sur 101, après un passage témoin vert ; chaque attaque de la relecture adversariale a la sienne.
- **Les quatre faux « non exigée » de la relecture adversariale**, rejoués sur le montage M par la ligne de commande : depuis `<dépôt>/apps`, sortie 20 ; `**Règles:**`, `- Règles:`, `règles:`, « exigée » ; le mappage plié à commentaire, `high` ; `-z` et `--name-status`, sortie 21.
- **Sur des données réelles, en lecture seule.** Le lecteur d'en-tête de la première version avait lu les 1 923 fichiers de règle de trois dépôts réels sans un refus, avec le même ensemble de chemins `code` et le même statut que leur index ; celui-ci, qui retire en plus les commentaires et refuse les clés en double, a relu les mêmes 1 923 fichiers sans un refus et sans un écart avec leur index. La ligne de commande, lancée depuis la copie des outils **et depuis un sous-dossier** (`apps/`) du dépôt d'Anchorpost, a jugé le diff sans renommage du départ de `origin/sujet/preuve-suffisante-cas` à sa tête contre `develop` (293 fichiers, index au pivot 2 sur la base, au pivot 3 sur la tête) : « exigée », par le fichier de la règle haute et quatre fichiers de son `code`, le verdict en dernière ligne ; le même diff en `--name-status` : « illisible » ; `README.md` seul : « non exigée ». Sur le plus gros des trois dépôts (près de treize mille fichiers, plus d'un millier de règles), une réponse prend de 0,2 à 0,4 s.

Non joué : aucun appelant n'existe, donc ni le Relecteur ni le capitaine n'ont lancé ce calcul ; la vraie boucle (`boucle.sh`) n'a pas repris le fichier d'un `origin/develop`, c'est le banc qui imite sa copie ; le schéma pivot a été lu dans Anchorpost aux commits nommés dans « Où », pas la CLI exécutée ; aucune PR réelle ne change une criticité par le manifeste dans les dépôts lus : la cause `niveau` n'est jouée que sur les arbres du banc ; la suite de `main` seul à `085d7d4` n'a pas été rejouée (le compte sans ces fichiers est le total moins les 35 du banc).

### Le script des mutations

Chaque mutation est jouée seule : le module est changé, le banc est lancé, le module est remis. Elle est « rouge » si le banc échoue. Le script refuse de partir si le banc est rouge sans mutation ; il nomme toute mutation restée verte, et tout « ancien » qui ne se trouve pas exactement une fois dans le module ; il sort en 0 si toutes sont rouges.

````python
# Mutations du calcul « double relecture exigée ». Usage : python3 mutations.py <dossier scripts/chaine posé à plat>
# Chaque mutation est jouée seule sur double-relecture.mjs, le banc est lancé, le fichier est remis. « Rouge » : le banc échoue.
import pathlib, subprocess, sys
d = pathlib.Path(sys.argv[1])
f = d / "double-relecture.mjs"
origine = f.read_text()
M = [
    ("un jeton de `Règles:` qui n'est pas une règle est sauté", "if (lu?.type !== 'RULE' || lu.index !== undefined) illisible(", "if (lu?.type !== 'RULE' || lu.index !== undefined) continue; else if (false) illisible("),
    ("le ticket : le titre seul, quand il en nomme un", "[...new Set([G.ticketDeLaPr(titre, branche), G.identifiantDeBranche(branche)].filter(Boolean))]", "[...new Set([G.ticketDeLaPr(titre, branche)].filter(Boolean))]"),
    ("le ticket : la branche seule", "[...new Set([G.ticketDeLaPr(titre, branche), G.identifiantDeBranche(branche)].filter(Boolean))]", "[...new Set([G.identifiantDeBranche(branche)].filter(Boolean))]"),
    ("sans `git`, la sortie est 21", "outilManquant: 69 };", "outilManquant: 21 };"),
    ("`git` introuvable se lit comme une réf introuvable", "if (e?.code === 'ENOENT') throw new OutilManquant('git est requis par les scripts de la chaîne');", ""),
    ("les branches de sujet : toute branche d'origin", "'refs/remotes/origin/sujet/'], 'branches de sujet illisibles'", "'refs/remotes/origin/'], 'branches de sujet illisibles'"),
    ("avec un index, l'en-tête des fichiers de règle touchés n'est plus lu", "filter(([cle]) => !avecIndex || touchees.has(cle))", "filter(() => !avecIndex)"),
    ("une règle rejetée compte", "const HORS_VIGUEUR = ['rejected', 'obsolete'];", "const HORS_VIGUEUR = ['obsolete'];"),
    ("une règle obsolète compte", "const HORS_VIGUEUR = ['rejected', 'obsolete'];", "const HORS_VIGUEUR = ['rejected'];"),
    ("une règle moyenne compte", "r.niveau === 'high' && r.enVigueur", "r.niveau !== 'low' && r.niveau !== null && r.enVigueur"),
    ("une règle haute ne compte plus", "r.niveau === 'high' && r.enVigueur", "r.niveau === 'haute' && r.enVigueur"),
    ("l'index : le niveau déclaré au lieu du niveau effectif", "const niveau = r.criticality === undefined ? null : r.criticality?.level;", "const niveau = r.criticality === undefined || r.criticality?.origin === 'feature' ? null : r.criticality?.level;"),
    ("l'index : tout schéma est lu", "if (index.schema !== '2' && index.schema !== '3')", "if (false)"),
    ("l'index : le pivot 2 n'est plus lu", "if (index.schema !== '2' && index.schema !== '3')", "if (index.schema !== '3')"),
    ("l'index : un JSON illisible vaut un index vide", "illisible(`${INDEX} n'est pas du JSON`);", "index = { schema: '3', rules: [] };"),
    ("l'index : un niveau inconnu vaut « à classer »", "if (niveau !== null && !NIVEAUX.includes(niveau)) illisible(`${INDEX} : \\`criticality.level\\` de ${r.key} illisible`);", ""),
    ("l'index : son champ `code` n'est plus lu", "regles.set(comparable(r.key), { cle: r.key, niveau, code,", "regles.set(comparable(r.key), { cle: r.key, niveau, code: [],"),
    ("l'index : son statut n'est plus lu", "enVigueur: !HORS_VIGUEUR.includes(r.validation?.status) });", "enVigueur: true });"),
    ("une lecture en échec vaut « non exigée »", "const reponse = uniques.length ? EXIGEE : illisibles.length ? ILLISIBLE : NON_EXIGEE;", "const reponse = uniques.length ? EXIGEE : NON_EXIGEE;"),
    ("une lecture en échec efface une cause établie", "const reponse = uniques.length ? EXIGEE : illisibles.length ? ILLISIBLE : NON_EXIGEE;", "const reponse = illisibles.length ? ILLISIBLE : uniques.length ? EXIGEE : NON_EXIGEE;"),
    ("une ligne `Relecture:` d'une autre valeur est ignorée", "for (const v of relectures) if (scalaire(v) !== 'double') illisible(", "for (const v of relectures) if (false) illisible("),
    ("la ligne `Relecture: double` n'est plus lue", "if (lu.double) causes.push(", "if (false) causes.push("),
    ("un ticket archivé compte", "&& !G.estArchive(`/${p}`)", ""),
    ("un fichier de règle à toute profondeur", "/^docs\\/metier\\/regles\\/([^/]+)\\/([^/]+)\\.md$/", "/docs\\/metier\\/regles\\/([^/]+)\\/([^/]+)\\.md$/"),
    ("un fichier de règle hors du dossier de son contexte", "&& comparable(G.dossierDuContexte(lu.contexte)) === m[1] ? m[2] : null", "? m[2] : null"),
    ("une entrée de `code` ne nomme plus un dossier", "for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')", "for (let p = c.lu; p !== ''; p = '')"),
    ("une cause par réf (doublons)", "return !vues.has(k) && vues.add(k);", "return true;"),
    ("les chemins ne sont plus repliés en minuscules", "const comparable = (s) => s.normalize('NFC').toUpperCase().toLowerCase();", "const comparable = (s) => s.normalize('NFC');"),
    ("en-tête : une clé imbriquée est lue comme une clé", "const cle = /^([A-Za-z_][\\w-]*)[ \\t]*:(?:[ \\t]+(.*))?$/.exec(ligne);", "const cle = /^\\s*([A-Za-z_][\\w-]*)[ \\t]*:(?:[ \\t]+(.*))?$/.exec(ligne);"),
    ("en-tête : une clé écrite deux fois, la dernière gagne", "if (cles.has(cle[1])) illisible(`clé \\`${cle[1]}\\` écrite deux fois`);", ""),
    ("en-tête : un niveau hors vocabulaire vaut « à classer »", "if (!NIVEAUX.includes(niveau)) illisible(`criticité « ${niveau} » : attendu low, medium ou high`);", "if (!NIVEAUX.includes(niveau)) niveau = null;"),
    ("en-tête : la forme nue n'est plus lue", "const brut = criticite.valeur !== '' && enLigne(criticite) === null ? criticite.valeur : champ(criticite, 'level');", "const brut = champ(criticite, 'level');"),
    ("en-tête : `level` écrit deux fois, le premier gagne", "if (lignes.length > 1) illisible(`\\`${nom}\\` écrit deux fois`);", ""),
    ("en-tête : la marque d'ordre des octets n'est plus retirée", "EN_TETE.exec(texte.startsWith(BOM) ? texte.slice(1) : texte)", "EN_TETE.exec(texte)"),
    ("en-tête : sans en-tête, la règle est « à classer »", "if (!m) illisible(\"pas d'en-tête YAML (`---` en première ligne, refermé par `---`)\");", "if (!m) return { niveau: null, code: [], enVigueur: true };"),
    ("en-tête : un `code` en texte est lu comme vide", "if (c.valeur !== '' || c.bloc.length === 0) illisible(`\\`code\\` illisible : ${c.valeur.slice(0, 80) || 'sans valeur'}`);", "if (c.valeur !== '' || c.bloc.length === 0) return { niveau, code: [], enVigueur: true };"),
    ("en-tête : ce qui suit un mappage ou une liste en ligne n'est plus regardé", "if (!v.startsWith(ouvrant) || fin === -1 || !/^\\s*(#.*)?$/.test(v.slice(fin + 1))) illisible(", "if (!v.startsWith(ouvrant) || fin === -1) illisible("),
    ("en-tête : le commentaire final se retire par un motif quadratique", "const v = valeur.trim();\n  const fin = v.lastIndexOf(fermant);", "const v = valeur.trim().replace(/\\s+#[^\"'}\\]]*$/, '');\n  const fin = v.lastIndexOf(fermant);"),
    ("en-tête : le statut n'est plus lu", "return { niveau, code, enVigueur: !HORS_VIGUEUR.includes(statut) };", "return { niveau, code, enVigueur: true };"),
    ("sortie de « exigée » : 1", "[EXIGEE]: 20,", "[EXIGEE]: 1,"),
    ("sortie de « illisible » : 0", "[ILLISIBLE]: 21,", "[ILLISIBLE]: 0,"),
    ("un usage faux sort en 0", "if (!options) resultat = { reponse: ILLISIBLE,", "if (!options) resultat = { reponse: NON_EXIGEE,"),
    ("un argument inconnu est ignoré", "if (!['--base', '--tete', '--titre', '--branche'].includes(cle) || valeur === undefined", "if (valeur === undefined"),
    ("un titre vide est un usage faux", "|| valeur === undefined || cle.slice(2) in options) return null;", "|| !valeur || cle.slice(2) in options) return null;"),
    ("sans --tete, la base sert de tête", "return options.base && options.tete ? options : null;", "return options.base ? { tete: options.base, ...options } : null;"),
    ("le point d'entrée sans chemins résolus", "return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);", "return fileURLToPath(import.meta.url) === process.argv[1];"),
    ("la grammaire n'est plus cherchée dans ../docs/", "['../docs/identifiants.mjs', 'identifiants.mjs',", "['identifiants.mjs',"),
    ("une branche de sujet donne un ticket", "return G ? [...new Set([G.ticketDeLaPr(titre, branche),", "return G ? [...new Set([G.ticketDeLaPr(titre, branche.replace(/^sujet\\//, '')),"),
    ("le niveau n'est lu que sur la base et develop", "for (const ref of [base, tete, develop])", "for (const ref of [base, develop])"),
    ("le niveau n'est lu que sur la tête et develop", "for (const ref of [base, tete, develop])", "for (const ref of [tete, develop])"),
    ("le niveau n'est plus lu sur origin/develop", "for (const ref of [base, tete, develop])", "for (const ref of [base, tete])"),
    ("le changement de niveau n'est plus une cause", "if (avant.regles.has(cle) !== apres.regles.has(cle)) causes.push(", "if (false) causes.push("),
    ("le changement de niveau : vers « haute » seulement", "if (avant.regles.has(cle) !== apres.regles.has(cle)) causes.push(", "if (!avant.regles.has(cle) && apres.regles.has(cle)) causes.push("),
    ("le changement de niveau : depuis « haute » seulement", "if (avant.regles.has(cle) !== apres.regles.has(cle)) causes.push(", "if (avant.regles.has(cle) && !apres.regles.has(cle)) causes.push("),
    ("le départ de la PR est la pointe de sa cible, plus leur base de fusion", "const depart = essayer(() => lecteur.baseDeFusion(commitDe(base), commitDe(tete)));", "const depart = essayer(() => commitDe(base));"),
    ("la ligne `Règles:` n'est plus lue", "for (const { cle, chemin } of lu.regles) if (hautesQuelquePart.has(cle)) causes.push(", "for (const { cle, chemin } of lu.regles) if (false) causes.push("),
    ("toute règle citée en `Règles:` compte, haute ou non", "if (hautesQuelquePart.has(cle)) causes.push({ sujet: hautesQuelquePart.get(cle),", "if (true) causes.push({ sujet: hautesQuelquePart.get(cle) ?? cle,"),
    ("l'en-tête d'un ticket ou d'une spec : tout le document", "return (fin === -1 ? lignes : lignes.slice(0, fin)).map((l) => motif.exec(l)?.[1])", "return lignes.map((l) => motif.exec(l)?.[1])"),
    ("les lignes d'en-tête : la forme nue seule, plus celles du gate (gras, puce, casse)", "const ligneDEnTete = (nom) => new RegExp(`^(?:- )?\\\\**${nom}\\\\**\\\\s*:\\\\**\\\\s*(.*)$`, 'i');", "const ligneDEnTete = (nom) => new RegExp(`^${nom}\\\\s*:\\\\s*(.*)$`);"),
    ("les lignes d'en-tête : sensibles à la casse", "\\\\s*:\\\\**\\\\s*(.*)$`, 'i');", "\\\\s*:\\\\**\\\\s*(.*)$`);"),
    ("l'en-tête du ticket ne se lit plus sur les sujets", "for (const nom of essayer(() => lecteur.sujets()) ?? [])", "for (const nom of [])"),
    ("l'en-tête du ticket ne se lit plus sur origin/develop", "for (const ref of [base, develop, tete]) essayer(", "for (const ref of [base, tete]) essayer("),
    ("l'en-tête du ticket ne se lit plus sur la base", "for (const ref of [base, develop, tete]) essayer(", "for (const ref of [develop, tete]) essayer("),
    ("l'en-tête du ticket ne se lit plus sur la tête", "for (const ref of [base, develop, tete]) essayer(", "for (const ref of [base, develop]) essayer("),
    ("la spec n'est plus lue pour un ticket sans ligne `Règles:`", "if (lignes.length === 0) {", "if (false) {"),
    ("la spec est lue aussi quand le ticket dit `Règles: —`", "if (lignes.length === 0) {", "if (regles.length === 0) {"),
    ("la spec d'à côté est lue", "G.identifiantDeLaSpec(p.split('/').pop()) === spec)", "G.identifiantDeLaSpec(p.split('/').pop()) !== null)"),
    ("une lecture en échec est redite à chaque arbre du même commit", "parCommit.set(commit, new Illisible(e.message.startsWith(`${nom}:`) ? e.message : `${nom} : ${e.message}`));", "throw new Illisible(e.message.startsWith(`${nom}:`) ? e.message : `${nom} : ${e.message}`);"),
    ("un ticket ou une spec en double : le premier est pris", "(fichiers.length > 1 ? illisible(", "(false ? illisible("),
    ("le fichier d'une règle haute ne compte plus", "if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref: nom });", ""),
    ("le code d'une règle haute ne compte plus", "for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref: nom });", ""),
    ("une ligne du diff mal citée est sautée", "if (f.length < 2 || !f.endsWith('\"')) illisible(\"une ligne de l'entrée, entre guillemets, ne se lit pas comme git l'écrit\");", "if (f.length < 2 || !f.endsWith('\"')) return '';"),
    ("l'entrée : une tabulation ou un octet nul passe", "if (lignes.some((f) => /[\\t\\0]/.test(f))) illisible(", "if (false) illisible("),
    ("l'entrée : un octet nul passe", "if (lignes.some((f) => /[\\t\\0]/.test(f))) illisible(", "if (lignes.some((f) => /[\\t]/.test(f))) illisible("),
    ("l'entrée : un chemin qui n'existe nulle part passe", "if (inconnus > 0) {", "if (false) {"),
    ("l'entrée : un chemin inconnu n'empêche pas de juger les autres", "if (inconnus > 0) {\n      chemins = [];", "if (inconnus > 0) {"),
    ("l'entrée : les chemins se cherchent à la tête seule", "new Set([...lecteur.chemins(depart), ...lecteur.chemins(commitDe(tete))].map(comparable))", "new Set([...lecteur.chemins(commitDe(tete))].map(comparable))"),
    ("l'entrée : les chemins se cherchent au départ seul", "new Set([...lecteur.chemins(depart), ...lecteur.chemins(commitDe(tete))].map(comparable))", "new Set([...lecteur.chemins(depart)].map(comparable))"),
    ("en-tête : un mappage ou une liste pliés sur plusieurs lignes ne sont plus lus", "return /^[[{]/.test(debut) ? [cle.valeur, ...cle.bloc].map((l) => sansCommentaire(l).trim()).filter(Boolean).join(' ') : null;", "return /^[[{]/.test(cle.valeur) ? cle.valeur : null;"),
    ("en-tête : le commentaire d'une ligne pliée n'est plus retiré", "[cle.valeur, ...cle.bloc].map((l) => sansCommentaire(l).trim())", "[cle.valeur, ...cle.bloc].map((l) => l.trim())"),
    ("en-tête : une clé en double dans un mappage en ligne, la dernière gagne", "if (cle === '' || m.has(cle)) illisible(", "if (cle === '') illisible("),
    ("en-tête : les guillemets ne protègent plus une virgule", "} else if (c === '\"' || c === \"'\") guillemet = c;\n    else if (c === '{' || c === '[') niveau++;", "}\n    else if (c === '{' || c === '[') niveau++;"),
    ("en-tête : les guillemets ne protègent plus un `#`", "} else if (c === '\"' || c === \"'\") guillemet = c;\n    else if (c === '#' &&", "}\n    else if (c === '#' &&"),
    ("un chemin de `code` n'est plus normalisé", "if (segment === '' || segment === '.') continue;", ""),
    ("un chemin de `code` : `..` n'est plus suivi", "else if (segments.pop() === undefined) return null;", "else return null;"),
    ("l'index : deux entrées de même clé, la dernière gagne", "if (regles.has(comparable(r.key))) illisible(`${INDEX} : deux entrées pour ${r.key}`);", ""),
    ("un objet absent du commit est lu comme vide", "if (fin === -1 || taille === undefined) illisible(`${chemin} illisible dans ${commit}`);", "if (fin === -1 || taille === undefined) { textes.set(chemin, ''); continue; }"),
    ("les arbres se listent depuis le dossier courant", "'--full-tree', '--name-only', commit, '--', prefixe]", "'--name-only', commit, '--', prefixe]"),
    ("les objets remplacés sont suivis", "execFileSync('git', ['--no-replace-objects', ...args],", "execFileSync('git', [...args],"),
    ("le verdict n'est plus la dernière ligne", "    ...causes.map((c) => [c.sujet, c.motif, c.chemin, c.ref].map(propre).join('\\t')),\n    ...illisibles.map((m) => `# illisible : ${propre(m)}`),\n    ...remarques.map((m) => `# ${propre(m)}`),\n    reponse,\n", "    reponse,\n    ...causes.map((c) => [c.sujet, c.motif, c.chemin, c.ref].map(propre).join('\\t')),\n    ...illisibles.map((m) => `# illisible : ${propre(m)}`),\n    ...remarques.map((m) => `# ${propre(m)}`),\n"),
    ("un message ou un champ peut porter un saut de ligne", "' ').slice(0, 500);", "'$&').slice(0, 500);"),
    ("un message n'est plus borné", "' ').slice(0, 500);", "' ');"),
    ("l'usage ne dit plus `--no-renames`", "const USAGE = 'usage : git -c core.quotePath=false diff --no-renames --name-only", "const USAGE = 'usage : git -c core.quotePath=false diff --name-only"),
    ("la branche cible se lit par son nom court, plus en entier", "return `refs/remotes/origin/${nom}`;", "return nom;"),
    ("`HEAD` est admis comme branche cible", " || nom === 'HEAD' || ", " || "),
    ("tout texte est admis comme branche cible", "if (typeof nom !== 'string' || !NOM_DE_BRANCHE.test(nom) || nom === 'HEAD' || /\\.\\.|\\/\\/|\\/$|\\.lock$|\\.lock\\/|\\/\\.|\\.$/.test(nom))", "if (typeof nom !== 'string')"),
    ("une branche cible peut porter `..`, un slash final ou un point final", " || /\\.\\.|\\/\\/|\\/$|\\.lock$|\\.lock\\/|\\/\\.|\\.$/.test(nom))", ")"),
    ("une réf symbolique est admise comme branche cible", "if (nom.startsWith('refs/') && symbolique(nom)) illisible(`${court(nom)} est une référence symbolique`);", ""),
    ("le sommet : tout texte est admis", "return typeof sha === 'string' && SHA.test(sha) ? sha : illisible('sommet refusé : attendu un sha de 40 caractères');", "return sha;"),
    ("la branche d'intégration n'est plus `develop`", "export const DEVELOP = 'develop';", "export const DEVELOP = 'main';"),
    ("une réf introuvable n'est plus vérifiée", "const commit = essayer(['rev-parse', '--verify', '-q', `${nom}^{commit}`], `référence ${court(nom)} introuvable`).toString('utf8').trim();", "const commit = 'f'.repeat(40);"),
]
temoin = subprocess.run(["node", "--test", str(d / "double-relecture.test.mjs")], capture_output=True, text=True, timeout=120)
if temoin.returncode != 0:
    sys.exit("le banc est rouge sans mutation : rien n'est prouvé")
rouges, vertes, absentes = 0, [], []
for nom, ancien, nouveau in M:
    if origine.count(ancien) != 1:
        absentes.append(nom); continue
    f.write_text(origine.replace(ancien, nouveau))
    try:
        r = subprocess.run(["node", "--test", str(d / "double-relecture.test.mjs")], capture_output=True, text=True, timeout=120)
    finally:
        f.write_text(origine)
    if r.returncode != 0: rouges += 1
    else: vertes.append(nom)
print(f"{rouges} rouges sur {len(M)}")
for n in vertes: print("VERTE :", n)
for n in absentes: print("ANCIEN INTROUVABLE OU EN DOUBLE :", n)
sys.exit(0 if rouges == len(M) else 1)
````

## Ce qui n'a pas été établi

`A-113` a tranché les quatorze points de la première version de ce ticket, `A-117` les onze de sa relecture adversariale (« Comments »). Restent six précisions prises ici, que la spec ne dit pas, et huit limites, chacune avec sa conséquence. L'architecte les lit à la contre-revue ; chacune tient à une décision et à un test nommés.

**Précisions de ce ticket**

1. **Le changement de niveau se lit depuis la base de fusion, pas depuis la pointe de la cible** (décision 9). `A-113` dit « index de la base contre index de la tête ». Pourquoi la base de fusion : la pointe de la cible porte aussi ce que d'autres PR y ont fait entrer depuis le départ de celle-ci ; comparée à elle, toute PR ouverte, en retard sur une cible où une règle vient de changer de niveau, exigerait deux relectures sans avoir rien changé, et ce jusqu'à sa mise à jour. La base de fusion ne montre que ce que la PR change ; une PR à jour a pour base de fusion la pointe de sa cible, et les deux lectures sont alors la même. Cas 4 du banc, et la mutation « le départ de la PR est la pointe de sa cible ».
2. **Un jeton de `Règles:` qui n'est pas un identifiant de règle : « illisible »**, sur le ticket comme sur la spec (décision 13, cas 13 ter et 27 quater). Le gate `tickets` le refuse déjà hors dette gelée ; un ticket gelé qui en porte un rendrait ses PR illisibles jusqu'à sa correction.
3. **Le niveau d'une règle citée se lit sur les trois arbres, pas sur le sujet où vit le ticket** (décision 13) : une règle montée sur un autre sujet que la base n'est pas vue avant d'entrer dans `develop`.
4. **Un dépôt sans `origin/develop` : « illisible »** (décision 5, cas 9 ter).
5. **La grammaire introuvable sort en 69**, l'usage en 21 (décision 3).
6. **D'un titre qui cite plusieurs tickets, seul le premier est lu** (décision 14) : c'est `ticketDeLaPr`, telle quelle.

**Limites**

7. **`Règles: —` est refusée aujourd'hui par le gate `tickets`** (`ecartsRegles`, `tickets-regles.mjs:435` : « citer au moins une règle, ou retirer la ligne », et un `—` n'est pas un identifiant de règle). Le calcul la lit quand même comme « ce ticket ne réalise aucune règle » (`A-117`) ; c'est le lot 2 (ticket 55, à rejouer sur `main`) qui la fera accepter par le gate, pas ce ticket. **Conséquence d'ici là** : le conducteur ne peut pas écrire « aucune » sur un ticket que le gate juge ; un ticket sans ligne `Règles:` hérite donc de sa spec, et, si celle-ci cite une règle haute qu'il ne réalise pas, sa PR reçoit deux relecteurs de trop. Jamais un de moins.
8. **Une criticité fixée au manifeste n'est vue qu'une fois l'index de la tête régénéré** (décision 9, cas 16 bis). Le Relecteur, qui juge avant, peut ne distribuer qu'une relecture ; le changement est vu par le premier calcul joué sur une tête dont l'index est régénéré.
9. **Une entrée produite avec la détection des renommages, mais bien formée, reste invisible au calcul** (décision 2, cas 22) : l'ancien nom d'un fichier de code renommé n'y est pas, et rien dans une liste de chemins ne dit comment elle a été produite. C'est la faute de l'appelant : les lots 4 et 5a produisent l'entrée par `git diff --no-renames --name-only`, comme `passer.sh` le fait déjà pour la revue exigée, et l'usage du module le dit.
10. **Un chemin de l'entrée absent du départ comme de la tête rend « illisible »**, même légitime (décision 2, cas 21 bis) : la PR de mise à jour d'un sujet dont la résolution supprime un fichier que `develop` seul apportait. Le cas est rare, et l'erreur est du côté sûr : le capitaine saute la PR sans la renvoyer, le Relecteur ne distribue ni ne valide, et l'architecte est prévenu (`A-113`).
11. **Les branches de sujet lues sont celles du dépôt de l'appelant** : une `origin/sujet/*` qu'il n'a pas relue, ou une branche supprimée qu'il n'a pas élaguée, donne une lecture en retard ou en trop. Le fetch est à l'appelant (lots 4 et 5a).
12. **Un chemin de règles déclaré au manifeste** (`contexts[].rules`) n'est pas reconnu comme le fichier d'une règle (décision 10) ; l'index, lui, porte quand même son niveau et son `code`.
13. **Une ligne d'en-tête que le gate ne lit pas n'est pas lue non plus** (en retrait, dans une citation, cas 19 bis) : le calcul suit le gate, il ne le dépasse pas. Et le motif du gate est recopié, pas importé : s'il change dans `tickets-regles.mjs`, rien ne le dit ici.
14. **Le coût** croît avec le nombre de branches de sujet (un `git ls-tree` de `docs/` par sujet) et avec la taille du dépôt (deux `git ls-tree` de l'arbre entier par appel, pour contrôler l'entrée) ; non mesuré au-delà de quatre sujets.

## Hors périmètre

- **Tout appelant** : le Relecteur (lot 4), le capitaine à ses deux contrôles (lot 5a, `A-105`), le diff qu'ils passent, le fetch de la cible, de `origin/develop` et des sujets, ce qu'ils font d'« illisible » (`A-113`), le nombre qu'ils tirent de la réponse.
- **Le gate `tickets`**, auquel ce ticket ne touche pas : la forme de `Relecture: double` (ticket 55, lot 2) ; **l'écriture `Règles: —`**, qu'il refuse aujourd'hui et que le lot 2 (ticket 55, à rejouer sur `main`) lui fera accepter (limite 7 : d'ici là, un ticket sans ligne `Règles:` hérite de sa spec, au pire deux relecteurs de trop) ; l'exigence de `Relecture: double` sur un ticket qui cite une règle haute (lot 5c).
- **Le message d'information au produit** (`A-90`), qui part du conducteur.
- **`fusionner/references/CONTENU.md`, `scripts/points-d-entree.test.mjs`, l'arbre du `README.md`** : au plus tard avec 3d (décision 18). De `fusionner/SKILL.md`, seul le mot du § 3.
- **« Même contenu propre »** (lot 3b, ticket 59) et **le lecteur de verdict** (lot 3a, ticket 58).
- **Le skill `criticite`, la fiche et le gabarit de règle** : lus, pas un mot ne change.

## Comments

- 2026-11-18 — Écrit par un agent rédacteur sur la sixième version de la spec et sur `origin/main` à `22b2d49`, module et banc joués. Quatorze points remontés à l'architecte : le pivot 2 ; `Règles:` non lue ; l'index non régénéré ; la règle rejetée ; le fichier d'une règle et `code` ; la base d'une sous-PR ; où se lit `Relecture: double` ; le ticket de la PR ; une autre valeur de `Relecture:` ; que faire d'« illisible » ; le diff vide ; la criticité d'une feature ; la pose ; les codes de sortie.
- 2026-11-18 — Décisions de l'architecte portées au ticket (`A-113`), sur `origin/main` à `6fc652d`. Cinq changent le calcul : `Règles:` est lue ; le niveau se lit sur trois arbres, `origin/develop` compris ; l'en-tête du ticket se lit sur la base, `origin/develop` et les sujets ; un changement de niveau vers ou depuis « haute » suffit ; le ticket de la PR est celui de `ticketDeLaPr`, et celui de la branche s'il est autre. Confirmés : les pivots 2 et 3, l'en-tête des règles touchées lu en plus de l'index, la règle rejetée ou obsolète, le chemin de convention et `code`, `Relecture:` d'une autre valeur, le diff vide. Accordés avec le ticket 59 : les sorties 0, 20, 21 et 69, sans 22. La pose : un mot à l'étape 0 de `fusionner/SKILL.md`. Rejoué dans un clone neuf : banc, suite entière, mutations.
- 2026-11-18 — Relecture adversariale par un agent neuf : « prêt après retouches », quatre faux « non exigée » reproduits, six mineurs, un point à trancher ; toutes les corrections adoptées (`A-117`) et portées ici, chaque attaque devenue un cas du banc avec sa mutation. Bloquants : le dossier courant hors de la racine (`--full-tree`, et le calcul à la racine sans obéir à la configuration) ; les formes de `Règles:` que le gate lit ; le commentaire d'un mappage plié et la clé en double ; l'entrée standard non contrôlée. Mineurs : `--no-renames` dans l'usage et un test de renommage ; les réfs lues en entier ; les chemins de `code` normalisés ; l'index à deux entrées de même clé ; `Relecture:` aux formes du gate ; un message par ligne, aucun argument refusé recopié, le verdict en dernière ligne. Tranché : le ticket se lit aussi sur la tête ; un ticket sans `Règles:` hérite de sa spec, `Règles: —` dit « aucune ». Base relue : `origin/main` à `085d7d4` (7.20.0 ; la version devient 7.21.0). Rejoué dans un clone neuf : banc, suite entière, mutations (« Vérification »).
- 2026-11-18 — Deux retouches avant le second tour du relecteur. `--base` s'aligne sur le ticket 59 : un nom de branche nu (`develop`, `sujet/<nom>`), validé (ni `HEAD`, ni réf symbolique, ni retour ligne, ni tiret initial), lu `refs/remotes/origin/<nom>` en entier ; `--tete` est un sha de 40 caractères ; mêmes mots dans l'usage, l'en-tête du module et le banc. `Règles: —` : le gate la refuse aujourd'hui, le calcul la lit comme « aucune », le lot 2 la fera accepter (limite 7, « Hors périmètre »). La précision 1 et les limites 9 et 10 disent leur raison et leur conséquence. Rejoué dans un clone neuf à `085d7d4`.
