# « Double relecture exigée » : un seul calcul, avec son lecteur de règles et d'index, écrit et testé avant tout appelant

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — deux fichiers neufs donnés entiers (le calcul, son banc), un mot ajouté à une phrase, une version et sa note données mot pour mot ; le tout a été joué sur une copie jetable de `origin/main`, suite entière et mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: — dans ce programme comme dans l'autre : le lot 3c part tout de suite (`A-109`). Les tickets 58 (lot 3a) et 59 (lot 3b) partent en même temps, prennent eux aussi une version et une note, et le 58 ajoute lui aussi un mot à la même phrase de `fusionner/SKILL.md`, que l'autre programme écrit aussi : partir de `main`, reprendre `main` avant de livrer.
Dépendances: —
Fichiers chauds: `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `skills/chaine/fusionner/SKILL.md` (un mot, étape 0). Deux fichiers neufs, que personne d'autre n'écrit : `skills/chaine/fusionner/scripts/double-relecture.mjs`, `skills/chaine/fusionner/scripts/double-relecture.test.mjs`.

## Le besoin

Ce ticket réalise le lot 3c de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (sixième version, `A-110` à `A-113` compris) : la décision `A-82`, amendée par `A-113`, pour la décision du produit `P-56` (« Règle de criticité haute : deux relectures indépendantes, et un message d'information au produit, sans que la PR l'attende ») et pour `A-90`.

**La décision.** `A-82`, mot pour mot :

> **« Double relecture exigée », un seul calcul**, de même. (Amendée par `A-113` : la ligne `Règles:` est lue aussi, le niveau se lit en plus sur `origin/develop`, l'en-tête du ticket se lit comme `Sensibles:`, et un changement de niveau vers ou depuis « haute » suffit.) Une PR l'exige quand son ticket porte la ligne `Relecture: double`, ou quand son diff touche le fichier d'une règle de criticité haute ou un fichier que le champ `code:` de cette règle nomme. Le niveau se lit sur la base **et** sur la tête de la PR (une PR qui monte elle-même une règle à haute est vue) : dans l'index Anchorpost du dépôt quand il en a un, qui porte le niveau effectif, criticité reçue d'une feature comprise — le ticket nomme le champ après lecture du schéma pivot, aucun lecteur n'existe aujourd'hui dans le plugin ; sinon dans l'en-tête des fichiers de règle (`criticality`, valeur `high`, sous ses deux formes), qui ne voit pas une criticité reçue d'une feature. `code:` est facultatif : une PR sans ticket qui touche le code d'une règle haute sans champ `code:` n'est pas vue, c'est écrit dans les limites. Le calcul tourne depuis la copie de travail de la boucle du capitaine, qui n'a que `scripts/chaine` et `scripts/docs/identifiants.mjs`, repris d'`origin/develop` à chaque tour, et aucune dépendance (amendée en sixième version) : il lit l'en-tête YAML des règles sans bibliothèque, son lecteur de règles vit sous `scripts/chaine`, et c'est la version de `develop` qui juge une sous-PR. La ligne `Relecture: double` se lit sur la base de la PR, par l'identifiant du ticket de sa branche. Le Relecteur et le capitaine refont tous deux ce calcul au moment de décider : le nombre écrit dans une distribution n'est qu'une information.

Et `A-113`, qui tranche les points que la première version de ce ticket avait fait remonter : « le calcul ne doit laisser passer aucune PR qui réalise ou déplace une règle haute avec une seule relecture, et se trompe du seul côté sûr ». Ses cinq changements, mot pour mot :

> - **La ligne `Règles:` du ticket est lue.** Une PR exige la double relecture quand son ticket cite une règle dont le niveau effectif est haut, même sans champ `code:` ni ligne `Relecture: double`. `Relecture: double` reste, comme ordre écrit à la main.
> - **Le niveau se lit sur trois arbres** : la base de la PR, sa tête, et `origin/develop` ; le plus haut l'emporte. Un sujet en retard sur `develop` ne cache pas une règle montée. C'est ce que `revue-exigee.mjs` fait déjà pour le contrat.
> - **L'en-tête du ticket se lit là où `A-74` lit `Sensibles:`** : sur la base de la PR, sur `origin/develop` et sur les `origin/sujet/*` ; une seule lecture qui dit « double » ou cite une règle haute suffit. Une PR `hors-sujet` dont le ticket ne vit que sur son sujet est vue.
> - **Une PR qui change le niveau effectif d'une règle vers ou depuis « haute »** exige la double relecture, même si elle ne touche ni le fichier de la règle ni son code : c'est le cas d'une criticité fixée sur une feature dans le manifeste.
> - **Le ticket de la PR** a une seule définition dans le plugin, celle que le capitaine emploie déjà ; quand le titre et la branche nomment deux tickets, les deux sont lus.

`A-90` : « Une règle montée à haute après un tour validé à un seul verdict : le tour redevient en cours, et la règle 5 lui ajoute une session. » `A-106` donne la règle des lectures : « Une lecture en échec ne vaut jamais « même » » ; ici, jamais « non exigée ».

**Le fait, sur `origin/main` à `6fc652d`** (plugin 7.18.2) :

- Aucun script du plugin ne lit la criticité d'une règle. `contexte-ticket.mjs` (revue de ticket) et `contexte-regle.mjs` (skill `criticite`) rendent un fichier de règle tel quel, sans lire son en-tête ; `mutation-regles.mjs` (socle-tests) lit dans l'index le champ `code` des règles prouvées, au schéma "2", mais il se pose sous `scripts/verify/`, que la copie de travail de la boucle ne porte pas.
- Personne n'appelle encore ce calcul : ses deux appelants sont le Relecteur (lot 4) et le capitaine (lot 5a), qui lui passeront, eux, le diff qu'ils jugent.
- L'étape 0 de `fusionner/SKILL.md` (`:14`) pose tous les `.sh`, nomme les `.mjs` un à un, et fait suivre tous les bancs : un `.mjs` neuf qu'elle ne nomme pas laisserait partir son banc seul dans un projet qui repose.

**Quand le ticket est fait** : un fichier sans dépendance, à côté des scripts du capitaine, répond pour une PR (la liste de ses fichiers changés, sa cible, son sommet, son titre, sa branche) « exigée » avec les règles ou le ticket en cause, « non exigée », ou « illisible » ; son banc le tient sur des fichiers de règle et un index à la forme du standard, joue la ligne de commande depuis une copie des outils faite comme celle de la boucle, et chaque mutation de la liste le fait rougir ; l'étape 0 de `fusionner` nomme le module. Rien d'autre ne change dans le plugin : aucun script ne l'appelle.

## Où

Base : `origin/main` à `6fc652d` (plugin **7.18.2**). `main` a avancé quatre fois depuis le `1c4acb1` de la spec (PR 113, 111, 116 et 117), sans toucher un script de la chaîne ni `fusionner/SKILL.md` : les repères de ligne ci-dessous valent à `6fc652d`. La session relit `main` avant de partir.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/double-relecture.mjs` | **neuf** : le calcul, ses lecteurs, sa ligne de commande (§ 2) |
| `skills/chaine/fusionner/scripts/double-relecture.test.mjs` | **neuf** : son banc, 26 tests (§ 1) |
| `skills/chaine/fusionner/SKILL.md:14` | un mot : le module entre dans la liste des `.mjs` posés (§ 3) |
| `.claude-plugin/plugin.json:3` | la version, mineure (§ 4) |
| `NOTES-DE-VERSION.md` | la note, en tête (§ 4) |

Aucun autre fichier : la vérification le montre par une commande.

### Lus, non modifiés

- `skills/chaine/fusionner/scripts/boucle.sh:54-60` et `:194-220` (`rafraichir_outils`) : à chaque tour, `git archive origin/develop scripts/chaine` (`:203`) puis `scripts/docs/identifiants.mjs` (`:207`), extraits dans `<git-common-dir>/boucle-outils`. Rien d'autre n'y est : ni `scripts/verify/`, ni `scripts/docs/` hors la grammaire, ni `node_modules`, ni `docs/`, ni `anchorpost/`.
- `skills/chaine/fusionner/scripts/identifiant.mjs:27-29` : la grammaire des identifiants cherchée en trois endroits (`../docs/`, à côté, puis dans le plugin). Le calcul fait de même.
- `skills/chaine/fusionner/scripts/revue-exigee.mjs:70` (`cheminLu`, les guillemets de `git diff --name-only`), `:122` (`lireBase` ajoute le contrat d'`origin/develop` à celui d'un sujet), `:165` (`lireGit`).
- `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs:52-53`, `:73`, `:104`, `:134` (ci-dessous).
- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:41` (`reglesCitees` : comment le gate découpe une ligne `Règles:`).
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
2. **Il ne lit jamais l'arbre de travail.** La copie est sous `.git`, hors du dépôt : `new URL('../..', import.meta.url)`, l'idiome de `contexte-ticket.mjs`, y désignerait la copie. Et l'arbre de travail du capitaine est sur une autre branche que la PR jugée. Tout se lit dans des objets git, par `git` lancé depuis le dossier courant : `rev-parse`, `merge-base`, `for-each-ref`, `ls-tree`, `cat-file --batch`.
3. **Il n'importe que `node:*` et la grammaire** `scripts/docs/identifiants.mjs`, que la copie porte. Ni `yaml`, ni `zod`, ni un script de `scripts/verify/` ou de `scripts/docs/` (le lecteur des lignes `Relecture:` et `Règles:` du gate `tickets`, celui de `mutation-regles.mjs`) : ils n'y sont pas. D'où un lecteur d'en-tête YAML écrit ici, pour trois clés, et une ligne `Règles:` découpée ici comme le gate la découpe.
4. **C'est la version de `develop` qui juge**, sous-PR d'un sujet plus ancien comprise : le lecteur accepte donc ce qu'un sujet en retard porte encore (un index au pivot 2, la forme nue de `criticality`).

### Ce que ce lecteur partage avec `contexte-ticket.mjs`, et ce qu'il ne partage pas

Il partage **la grammaire** (`identifiants.mjs` : aucun des deux n'écrit un motif d'identifiant), **la convention du chemin d'une règle** (`docs/metier/regles/<dossier du contexte>/<identifiant>.md`, `contexte-ticket.mjs:134`), **la recherche du fichier d'un ticket** par `fichierDuTicket` hors archive, **la limite de l'en-tête d'un ticket** (avant la première section `## `, `:104`) et **la ligne `Règles:`** de cet en-tête comme liste des règles du ticket.

Il ne partage **aucun code** : `contexte-ticket.mjs` s'exécute à l'import, n'exporte rien, lit le disque depuis la racine qu'il déduit de son propre chemin (`:52-53`, `:73`), reçoit un seul ticket en argument, et rend un fichier de règle sans lire son en-tête. Ici tout se lit sur des réfs, plusieurs pour un même ticket, l'en-tête des règles est lu, et un jeton de `Règles:` que la grammaire ne lit pas est une lecture en échec, pas une ligne « illisible » rendue à un relecteur.

## Décisions

Tenues de la spec : `A-82`, `A-90`, `A-106` (les lectures), `A-108` (les règles de `main`), `A-113` (ce que ce lot fixe, les codes de sortie, la pose). Les choix de la première version de ce ticket sont confirmés ou changés par `A-113` ; **six précisions restent celles de ce ticket** (dans les décisions 3, 5, 9, 13 et 14) : elles sont reprises dans « Ce qui n'a pas été établi ».

1. **Un fichier, un nom.** `skills/chaine/fusionner/scripts/double-relecture.mjs`, posé `scripts/chaine/double-relecture.mjs`. Aucun fichier de ce nom dans les quatre dossiers que `scripts/poses.test.mjs` pose au même endroit (il refuse un nom posé deux fois).
2. **L'appel.**

   ````bash
   git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> \
     | node scripts/chaine/double-relecture.mjs --base <réf> --tete <réf> [--titre <titre>] [--branche <branche de tête>]
   ````

   - **Entrée standard** : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only` les écrit, guillemets de git compris. C'est l'appelant qui choisit le diff : celui que la relecture lit (`A-76`, `A-78`), que ce calcul ne recalcule pas. Un diff vide rend « non exigée » si rien d'autre ne l'exige : l'appelant répond de sa lecture (`A-113`).
   - `--base` : la cible de la PR (`origin/develop`, `origin/sujet/<nom>`), **que l'appelant vient de relire** par un refspec explicite (`A-106`), comme `origin/develop` et les `origin/sujet/*`. `--tete` : le sommet jugé, un sha ou une réf présente dans le dépôt.
   - `--titre`, `--branche` : le titre de la PR et le nom de sa branche de tête, vides admis. Le ticket de la PR est celui que rend `ticketDeLaPr` de la grammaire (le premier que le titre cite, sinon celui de la branche), la définition que les scripts du capitaine emploient déjà par `identifiant.mjs` (`ticket-de-pr`) ; quand la branche en porte un autre, les deux sont lus. Ni l'un ni l'autre : la PR n'a pas de ticket.
   - En module : `doubleRelecture({ fichiers, base, tete, tickets, develop, lecteur })` rend `{ reponse, causes, illisibles, remarques, outilManquant }` ; `ticketsDeLaPr(titre, branche)` rend la liste des tickets ; `lecteur` est le lecteur git par défaut, remplacé par des arbres en mémoire dans le banc.
3. **Les sorties.** Première ligne de la sortie standard : `exigée`, `non exigée` ou `illisible`. Puis une ligne par cause, quatre champs séparés par une tabulation : la règle (ou le ticket), le motif (`fichier`, `code`, `niveau`, `Règles:`, `Relecture: double`), le chemin, la réf où c'est lu. Puis une ligne `# illisible : …` par lecture en échec et une ligne `# …` par remarque.

   | Sortie | Première ligne | Sens |
   | --- | --- | --- |
   | 0 | `non exigée` | une relecture suffit |
   | 20 | `exigée` | deux relectures |
   | 21 | `illisible` | le calcul ne peut pas conclure, usage faux compris |
   | 69 | `illisible` | un outil manque au poste : `git`, ou la grammaire `identifiants.mjs` |

   Ce sont les codes accordés avec le ticket 59 (`A-113`) ; il n'y a pas de code propre à l'usage, qui sort en 21 comme chez lui. Précision de ce ticket : la grammaire introuvable sort en 69, comme un outil manquant (`identifiant.mjs` sort en 6 dans ce cas, code pris par la boucle). **Qui appelle ne lit « non exigée » que sur la sortie 0 et la première ligne ensemble** ; tout autre code que 0 et 20, un plantage de `node` (sortie 1) compris, se lit « illisible ».
4. **Cinq causes**, chacune suffit : (a) le ticket de la PR porte `Relecture: double` ; (b) il cite en `Règles:` une règle haute ; (c) un fichier du diff est le fichier d'une règle haute ; (d) un fichier du diff est nommé par le champ `code` d'une règle haute ; (e) la PR change le niveau d'une règle vers ou depuis « haute ».
5. **Trois arbres, jamais l'arbre de travail.** Une règle est haute si elle l'est sur la base, sur la tête **ou** sur `origin/develop`. La base est la cible telle que l'appelant vient de la relire, pas la base de fusion : c'est ce qui fait voir une règle montée par une autre PR après le verdict (`A-90`). La tête fait voir la PR qui monte elle-même une règle. `origin/develop` fait voir la règle montée dans `develop` à la sous-PR d'un sujet en retard. Un même commit n'est lu qu'une fois. Précision de ce ticket : un dépôt sans `origin/develop` est « illisible » (aucun dépôt à chaîne n'en manque).
6. **Avec un index** sur l'arbre : `criticality.level` de l'entrée de `rules`, par sa `key` ; `code` et `validation.status` de la même entrée. Schéma `"2"` ou `"3"` ; tout autre schéma est « illisible ».
7. **Sans index** sur l'arbre : l'en-tête de chaque fichier de règle, sous les deux formes de `criticality`. Une criticité reçue d'une feature n'est pas vue : limite écrite de la spec. Ni index ni fichier de règle : aucune règle haute (un projet sans règles métier).
8. **Avec un index, l'en-tête des fichiers de règle que le diff touche est lu en plus, et le plus haut gagne.** Une règle montée, créée haute, ou dont le `code` change dans la PR est vue par son fichier, index régénéré ou non.
9. **Le changement de niveau (cause e) se lit du départ de la PR à sa tête** : l'ensemble des règles hautes et en vigueur du départ, comparé à celui de la tête ; toute règle qui n'est que d'un côté est une cause, lue dans l'index quand la tête en a un, dans les en-têtes sinon. **Précision de ce ticket : le départ est la base de fusion de la cible et de la tête (`git merge-base`), pas la pointe de la cible.** Comparée à la pointe, toute PR ouverte, en retard sur une cible où une autre PR vient de monter ou de baisser une règle, exigerait deux relectures sans rien avoir changé, jusqu'à la mise à jour qui la remettrait d'accord avec sa cible. Une PR à jour a pour départ la pointe de sa cible : la lecture d'`A-113` est alors la même. Limite : tant que la PR n'a pas régénéré son index, une criticité fixée au manifeste ne se lit nulle part ; elle est vue dès que l'index de la tête est régénéré, par l'auteur ou par le capitaine avant son second contrôle (`A-105`).
10. **Le fichier d'une règle** est `docs/metier/regles/<dossier du contexte>/<identifiant>.md`, à la racine du dépôt. Un homonyme ailleurs n'en est pas un : les dépôts jouets d'un projet en portent (`apps/…/fixtures/…/docs/metier/regles/all/RULE_….md`). Un chemin de règles hors convention, déclaré au manifeste Anchorpost (`contexts[].rules`), n'est pas reconnu : limite écrite.
11. **Une entrée de `code` nomme un fichier, ou un dossier** : le chemin du diff lui est égal, ou est dessous.
12. **Une règle `rejected` ou `obsolete` ne compte pas.** Lu sur chaque arbre : la PR qui rejette une règle haute est vue par la base, où elle est encore en vigueur, et par le changement de niveau. Une règle `candidate` compte.
13. **L'en-tête du ticket** (avant la première section `## `) se lit sur la base, sur `origin/develop` et sur chaque `origin/sujet/*`, jamais sur la tête : une PR ne s'ajoute ni ne se retire rien. Sur chaque réf :
    - `Relecture: double`, à la forme du ticket 55 (un commentaire ` # …` peut suivre) : cause (a). Une ligne d'une autre valeur : « illisible ».
    - `Règles:` : des identifiants de règle séparés par des virgules ou des blancs, entre accents graves ou nus, ou `—`, comme le gate les découpe (`reglesCitees`). Chaque règle citée qui est haute sur l'un des trois arbres est une cause (b). Précisions de ce ticket : un jeton qui n'est pas un identifiant de règle est « illisible » (le gate le refuse, il ne se devine pas) ; le niveau d'une règle citée se lit sur les trois arbres de la décision 5, pas sur le sujet où vit le ticket.
    - Deux fichiers pour un même ticket sur une réf : « illisible ». Un ticket archivé n'est pas lu. Un ticket qu'aucune de ces réfs ne porte : une remarque, aucune cause.
14. **Le ticket de la PR** : `ticketDeLaPr(titre, branche)`, importée de la grammaire sans modifier aucun fichier, puis `identifiantDeBranche(branche)` s'il est autre. Précision de ce ticket : d'un titre qui cite plusieurs tickets, seul le premier est lu, comme `ticketDeLaPr` le fait partout ailleurs.
15. **« Illisible » n'est jamais « non exigée », et une cause établie suffit.** Chaque lecture (les lignes du diff, chaque arbre, le départ, chaque réf du ticket) est jouée à part ; une réf introuvable, un index qui n'est pas du JSON ou d'un autre schéma, un en-tête que le lecteur ne comprend pas, une ligne du diff mal citée sont des lectures en échec. Si une cause est établie malgré elles, la réponse est « exigée », et les échecs sont dits ; sinon, un seul échec donne « illisible ». Un échec est dit une fois par commit, avec la réf qui l'a lu la première. Ce que le Relecteur et le capitaine font d'« illisible » est dans `A-113` et aux lots 4 et 5a.
16. **Le lecteur d'en-tête ne lit que trois clés de premier niveau** (`criticality`, `code`, `validation`) et refuse ce qu'il ne comprend pas : pas d'en-tête, une clé écrite deux fois, une ligne de première colonne qui n'est ni une clé ni un commentaire, un niveau hors `low`, `medium`, `high`, un `code` qui n'est pas une liste. Il lit la forme nue, le bloc, le mappage et la liste en ligne, même pliés sur plusieurs lignes par un formateur ; une clé imbriquée (`extensions.<projet>.criticality`) ou commentée n'est pas la clé. Un statut qu'il ne comprend pas laisse la règle en vigueur. **Lecture en temps linéaire** : l'en-tête d'une PR est une entrée que son auteur écrit.
17. **Aucun import d'un autre script de la chaîne.** `cheminDuDiff` est la copie de `cheminLu` de `revue-exigee.mjs`, un fichier que deux tickets de l'autre programme récrivent (16 et 18) ; le banc garde la parité, comme `revue-exigee.test.mjs` le fait pour `regexDuMotif`.
18. **Deux fichiers neufs, et un mot** (`A-113`, la pose). Le nom du module entre dans la liste de l'étape 0 de `fusionner/SKILL.md:14` : un projet qui repose ne reçoit jamais le banc sans son module. Aucun test du dépôt ne fige cette phrase (`git grep -n "commits-a-relire" -- 'scripts/*.test.mjs'` ne rend rien), et le fichier reste à 112 lignes. Ne sont pas touchés, et le ticket le dit pour qui les écrira : la ligne du calcul dans `fusionner/references/CONTENU.md`, dans `scripts/points-d-entree.test.mjs` et dans l'arbre du `README.md:169` (la spec : « au plus tard avec 3d »). Aucun test de `main` n'exige qu'un script de `fusionner/scripts/` y soit listé (suite jouée : verte) ; en attendant, **le banc prouve lui-même le point d'entrée** (lien symbolique, `--preserve-symlinks-main`, dossier à espace et à accent).
19. **Banc court** : 26 tests, deux secondes environ ; le calcul se joue sur des arbres en mémoire, quatre tests seulement montent un dépôt git. Il est rejoué, posé à plat, par `scripts/poses.test.mjs` (plafond de 600 s pour l'ensemble, `:75`) : il ne lit jamais l'arbre du plugin, et prend la grammaire là où le module l'a trouvée (`GRAMMAIRE`).
20. **Version : mineure** (7.18.2 → **7.19.0** sur `6fc652d`) : un script de plus dans un skill. **Règle de repli** : les tickets 58 et 59 prennent une version en même temps. Si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, remonte sa note en tête avec ce numéro, garde dans `fusionner/SKILL.md` les mots que les autres y ont ajoutés, puis vérifie (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, `git diff origin/main -- skills/chaine/fusionner/SKILL.md` ne montre que le mot).
21. **`Label: contre-revue`** : le fichier se pose sous `scripts/chaine/`, chemin sensible du gabarit de `.claude/chaine.json`, et il gardera l'entrée des PR. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): double relecture exigée, un calcul et son lecteur de règles et d'index (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Comparer la pointe de la cible à la tête** pour le changement de niveau : décision 9.
- **Lire le manifeste** (`featureCriticality`) pour voir une criticité de feature avant que l'index soit régénéré : le niveau effectif est un calcul de la CLI Anchorpost (la feature, ses specs, leurs lignes `Règles:`), que ce fichier ne refait pas.
- **Lire aussi le ticket sur la tête** : la PR retirerait elle-même la ligne qui l'oblige.
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

`git fetch origin main`, une branche depuis `origin/main`. Relever la version de `.claude-plugin/plugin.json` et la ligne 14 de `skills/chaine/fusionner/SKILL.md` : si la version n'est plus 7.18.2 ou si la phrase a changé, les § 3 et 4 suivent la règle de repli (décision 20).

### § 1 — Le banc d'abord, vu rouge

Créer `skills/chaine/fusionner/scripts/double-relecture.test.mjs`, tel quel. Le lancer : `node --test skills/chaine/fusionner/scripts/double-relecture.test.mjs` échoue à l'import, le module n'existe pas.

**Les cas, un par un.** Le calcul se joue sur des arbres en mémoire : `origin/develop`, `tete`, le départ de la PR (la base, quand la PR est à jour), et au besoin `origin/sujet/facture`. `R16` est `docs/metier/regles/all/RULE_ALL_FAC-16.md`, `CODE` est `apps/api/src/facture/total.ts`, le ticket est `SPEC_ALL_FAC-1.03`. Sauf mention, la PR vise `origin/develop`.

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
| 9 | **index illisible** : JSON coupé ; schéma "1" ; schéma "4" ; sans `rules` ; `criticality.level` inconnu ; `code` qui n'est pas une liste | `README.md` | « illisible », deux échecs, `origin/develop : …` et `tete : …`, le motif nommé |
| 9 bis | en-tête `criticality: haute`, sans index, le même commit pour la base, la tête et le départ | `README.md` | « illisible », un seul échec, qui nomme la réf, le fichier et la valeur |
| 9 ter | la tête n'existe pas ; `origin/develop` n'existe pas ; une ligne du diff citée et non refermée | `README.md` | « illisible » |
| 10 | base : règle haute et son `code` ; tête : index qui n'est pas du JSON | `CODE` | « exigée », et l'échec de la tête écrit en `# illisible : tete : …` |
| 11 | **`Relecture: double` écrite à la main** dans l'en-tête du ticket, sur la base, avec un commentaire | `README.md`, ticket `SPEC_ALL_FAC-1.03` | « exigée », cause `SPEC_ALL_FAC-1.03 · Relecture: double · <fichier du ticket> · origin/develop` |
| 11 bis | le même montage, **PR sans ticket**, puis PR du ticket `.04` | `README.md` | « non exigée » |
| 11 ter | la ligne dans le corps du ticket, après `## Le besoin` | `README.md` | « non exigée » |
| 11 quater | la PR retire la ligne de son ticket ; la PR l'ajoute | le fichier du ticket | retirée : « exigée » (la base la porte) ; ajoutée : « non exigée » (lue une fois entrée dans la base) |
| 12 | `Relecture: triple`, `Double`, `double, puis simple`, vide ; puis deux fichiers pour le ticket | `README.md` | « illisible » |
| 12 bis | ticket absent de la base ; ticket dans `issues/archive/` avec la ligne | `README.md` | « non exigée », remarque « ticket … absent de origin/develop : aucun en-tête lu » |
| 13 | **ticket qui cite une règle haute sans `code`** (`A-113`) : index, `RULE_ALL_FAC-16` `high` par une feature, `RULE_ALL_FAC-17` `medium` ; la ligne `Règles:` du ticket cite les deux, la haute entre accents graves, un commentaire à la suite | `CODE` | « exigée », cause `RULE_ALL_FAC-16 · Règles: · <fichier du ticket> · origin/develop` |
| 13 bis | le même index ; **ticket sans ligne `Règles:`** ; `Règles: —` ; la règle moyenne seule ; une règle inconnue ; la ligne dans le corps ; PR sans ticket | `CODE` | « non exigée » |
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

Puis les lecteurs (l'en-tête : sept écritures lues, quatorze refusées ; trois en-têtes hostiles de 300 000 caractères en moins de 2 s ; l'index aux deux pivots ; les lignes du diff, en parité avec `revue-exigee.mjs` ; les arguments) et, sur un dépôt git jouet, la ligne de commande lancée **depuis une copie des outils faite comme celle de la boucle** (`scripts/chaine/double-relecture.mjs` et `scripts/docs/identifiants.mjs`, rien d'autre, hors du dépôt), l'arbre de travail du dépôt disant le contraire des réfs (règle basse, index supprimé) : sorties 20, 0, 21 (réf absente, hors de tout dépôt, usage) et 69 (sans `git` au `PATH`), un chemin que git cite, le ticket lu dans le titre, dans la branche, les deux à la fois, sur une branche de sujet du dépôt, le lecteur git (`merge-base`, `for-each-ref`), le point d'entrée par un lien symbolique.

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
  DEVELOP,
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

const SUJET = 'origin/sujet/facture';

/** Un lecteur sur des arbres en mémoire : `{ <réf>: { <chemin>: <texte> } }`. Deux réfs du même arbre sont le même commit. */
const lecteur = (refs) => {
  const commits = new Map();
  return {
    verifier(ref) {
      if (!(ref in refs)) throw new Illisible(`référence ${ref} introuvable`);
      if (!commits.has(refs[ref])) commits.set(refs[ref], `commit-${commits.size}`);
      return commits.get(refs[ref]);
    },
    baseDeFusion: () => 'depart',
    sujets: () => Object.keys(refs).filter((r) => r.startsWith('origin/sujet/')),
    lister: (ref, prefixe) => Object.keys(refs[ref]).filter((p) => p === prefixe || p.startsWith(prefixe)),
    lire: (ref, chemins) => new Map(chemins.map((c) => [c, refs[ref][c]])),
  };
};
/**
 * Le calcul sur des arbres : `develop`, `sujet` (la base de la PR s'il est donné et que `versDevelop` ne l'est pas),
 * `tete` (la base, quand la PR ne change ni règle ni index), `depart` (la base, quand la PR est à jour).
 */
function calculer({ fichiers, develop = {}, sujet, tete, depart, tickets = [], versDevelop = false, refs = {} }) {
  const base = sujet && !versDevelop ? SUJET : DEVELOP;
  const arbres = { [DEVELOP]: develop, ...(sujet ? { [SUJET]: sujet } : {}), ...refs };
  arbres.tete = tete ?? arbres[base];
  arbres.depart = depart ?? arbres[base];
  return doubleRelecture({ fichiers, base, tete: 'tete', tickets, lecteur: lecteur(arbres) });
}
/** Une PR vers develop : `tete` vaut `base` quand elle ne change ni règle ni index, `depart` vaut `base` quand elle est à jour. */
const juger = (fichiers, base, tete = base, ticketDeLaPr = null, depart = base) =>
  calculer({ fichiers, develop: base, tete, depart, tickets: ticketDeLaPr ? [ticketDeLaPr] : [] });
const causes = (r) => r.causes.map((c) => `${c.sujet} · ${c.motif} · ${c.chemin} · ${c.ref}`);

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
  ]) {
    const r = juger(['README.md'], { [INDEX]: contenu, [R16]: haute }, { [INDEX]: contenu, [R16]: haute });
    assert.equal(r.reponse, ILLISIBLE, nom);
    assert.deepEqual(r.illisibles.map((m) => m.split(' : ')[0]), ['origin/develop', 'tete'], `${nom} : la base et la tête, chacune dite une fois`);
    assert.match(r.illisibles[0], attendu, nom);
  }
  const enTete = juger(['README.md'], { [R16]: regle('RULE_ALL_FAC-16', { criticite: 'criticality: haute\n' }) });
  assert.equal(enTete.reponse, ILLISIBLE);
  assert.equal(enTete.illisibles.length, 1, 'la base, la tête et le départ sont le même commit : dit une fois');
  assert.match(enTete.illisibles[0], /^origin\/develop:docs\/metier\/regles\/all\/RULE_ALL_FAC-16\.md : criticité « haute »/);
  const sansTete = doubleRelecture({ fichiers: ['README.md'], base: 'origin/develop', tete: 'tete', lecteur: lecteur({ 'origin/develop': {}, depart: {} }) });
  assert.deepEqual([sansTete.reponse, sansTete.illisibles], [ILLISIBLE, ['référence tete introuvable']]);
  const sansDevelop = doubleRelecture({ fichiers: ['README.md'], base: SUJET, tete: 'tete', lecteur: lecteur({ [SUJET]: {}, tete: {}, depart: {} }) });
  assert.deepEqual([sansDevelop.reponse, sansDevelop.illisibles], [ILLISIBLE, ['référence origin/develop introuvable']], 'un dépôt sans origin/develop');
  const cite = juger(['"docs/m\\303\\251tier', 'README.md'], {});
  assert.equal(cite.reponse, ILLISIBLE);
  assert.match(cite.illisibles[0], /ligne du diff illisible/);
});

test('une cause établie suffit : une lecture en échec à côté ne retire pas « exigée », et reste dite', () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]) };
  const r = juger([CODE], base, { [INDEX]: '{' });
  assert.equal(r.reponse, EXIGEE);
  assert.equal(r.illisibles.length, 1);
  assert.match(texte(r), /^exigée\nRULE_ALL_FAC-16\tcode\tapps\/api\/src\/facture\/total\.ts\torigin\/develop\n# illisible : tete : anchorpost\/anchorpost\.json n'est pas du JSON\n$/);
});

test('`Relecture: double` écrite sur le ticket, dans son en-tête, sur la base : exigée, quels que soient les fichiers', () => {
  const base = { [TICKET]: ticket('Relecture: double # règle de criticité haute\n') };
  const r = juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.03');
  assert.equal(r.reponse, EXIGEE);
  assert.deepEqual(causes(r), [`SPEC_ALL_FAC-1.03 · Relecture: double · ${TICKET} · origin/develop`]);
  assert.equal(juger(['README.md'], base, {}).reponse, NON_EXIGEE, 'PR sans ticket : la ligne de ce ticket ne la concerne pas');
  assert.equal(juger(['README.md'], base, {}, 'SPEC_ALL_FAC-1.04').reponse, NON_EXIGEE, "le ticket d'à côté");
  assert.equal(juger(['README.md'], { [TICKET]: ticket('', '- Relecture: double\n\nRelecture: double\n') }, {}, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, 'dans le corps, ce n\'est pas la ligne');
  // La base seule : une PR ne retire pas la ligne de son propre ticket, et ne se l'ajoute pas non plus.
  assert.equal(juger([TICKET], base, { [TICKET]: ticket() }, 'SPEC_ALL_FAC-1.03').reponse, EXIGEE);
  const ajoutee = juger([TICKET], { [TICKET]: ticket() }, base, 'SPEC_ALL_FAC-1.03');
  assert.equal(ajoutee.reponse, NON_EXIGEE, 'ajoutée par la PR elle-même : lue seulement une fois entrée dans la base');
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
    assert.deepEqual([r.reponse, r.remarques], [NON_EXIGEE, ['ticket SPEC_ALL_FAC-1.03 absent de origin/develop : aucun en-tête lu']]);
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
  assert.deepEqual([nullePart.reponse, nullePart.remarques], [NON_EXIGEE, [`ticket SPEC_ALL_FAC-1.03 absent de origin/develop, ${SUJET} : aucun en-tête lu`]]);
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

// ── Les lecteurs ──────────────────────────────────────────────────────────────────────────────────────────────────
test("l'en-tête d'une règle : les formes lues, et ce qui est refusé plutôt que deviné", () => {
  const lu = (criticite, code = '', statut = 'validated') => enTeteDeRegle(regle('RULE_ALL_FAC-16', { criticite, code, statut }));
  assert.deepEqual(lu(''), { niveau: null, code: [], enVigueur: true });
  assert.deepEqual(lu(HAUTE_BLOC, CODE_BLOC), { niveau: 'high', code: [CODE], enVigueur: true });
  assert.deepEqual(lu('criticality: medium # à revoir\n', `code:\n- ${CODE} # le calcul\n- 'apps/web/a b.ts'\n`, 'obsolete'), { niveau: 'medium', code: [CODE, 'apps/web/a b.ts'], enVigueur: false });
  assert.deepEqual(lu("criticality: { reason: 'jamais, level: high', level: low, by: agent }\n", 'code: []\n').niveau, 'low', 'un `level:` dans une raison entre guillemets n\'est pas le niveau');
  assert.deepEqual(lu('criticality:\n  {\n    level: high,\n    by: agent,\n  }\n', `code:\n  [\n    ${CODE},\n    "apps/web/a.ts",\n  ]\n`), { niveau: 'high', code: [CODE, 'apps/web/a.ts'], enVigueur: true }, 'mappage et liste en ligne pliés par un formateur');
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
  assert.deepEqual(lireArguments(['--base', 'origin/develop', '--tete', 'abc', '--branche', BRANCHE]), { base: 'origin/develop', tete: 'abc', branche: BRANCHE });
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
/** Un dépôt dont `origin/develop` porte une règle haute et son ticket, et une branche de ticket qui touche le code. */
function depotJouet() {
  const depot = dossier('double-relecture-');
  g(depot, 'init', '-q', '-b', 'develop');
  g(depot, 'config', 'user.email', 'jouet@example.invalid');
  g(depot, 'config', 'user.name', 'Jouet');
  g(depot, 'config', 'core.quotePath', 'true');
  commit(depot, {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC, code: CODE_BLOC }),
    [TICKET]: ticket(),
    [CODE]: 'export const total = 0;\n',
    'docs/métier/note.md': 'n\n',
  }, 'chore: socle');
  g(depot, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
  g(depot, 'checkout', '-q', '-b', BRANCHE);
  const tete = commit(depot, { [CODE]: 'export const total = 1;\n', 'docs/métier/note.md': 'm\n' }, 'feat(api): total');
  // L'arbre de travail ment : s'il était lu, la règle serait basse et l'index absent.
  writeFileSync(join(depot, R16), regle('RULE_ALL_FAC-16', { criticite: 'criticality: low\n' }));
  rmSync(join(depot, INDEX));
  return { depot, tete };
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
function lancer(script, args, { cwd, entree: input = '', options = [], env = {} }) {
  const r = spawnSync(process.execPath, [...options, script, ...args], { cwd, input, encoding: 'utf8', env: { ...ENV_PROPRE, ...env }, timeout: 30_000 });
  return { code: r.status, sortie: r.stdout, erreur: r.stderr };
}

test("en ligne de commande, depuis la copie des outils de la boucle : les réfs sont lues, jamais l'arbre de travail ; sorties 0, 20, 21, 69", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  const diff = g(depot, 'diff', '--name-only', 'origin/develop', tete);
  assert.match(diff, /^"docs\/m\\303\\251tier\/note\.md"$/m, 'le montage porte un chemin que git cite');
  const exigee = lancer(script, ['--base', 'origin/develop', '--tete', tete, '--branche', BRANCHE], { cwd: depot, entree: `${diff}\n` });
  assert.deepEqual([exigee.code, exigee.sortie], [SORTIES[EXIGEE], `exigée\nRULE_ALL_FAC-16\tcode\t${CODE}\torigin/develop\n`]);
  assert.equal(SORTIES[EXIGEE], 20);
  const non = lancer(script, ['--base', 'origin/develop', '--tete', tete], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([non.code, non.sortie], [0, 'non exigée\n']);
  const illisible = lancer(script, ['--base', 'origin/develop', '--tete', 'origin/absente'], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([illisible.code, illisible.sortie], [21, 'illisible\n# illisible : référence origin/absente introuvable\n']);
  const horsDepot = lancer(script, ['--base', 'origin/develop', '--tete', tete], { cwd: dirname(script), entree: 'README.md\n' });
  assert.equal(horsDepot.code, 21, 'hors de tout dépôt git : illisible');
  assert.match(horsDepot.sortie, /^illisible\n/);
  const usage = lancer(script, ['--base', 'origin/develop'], { cwd: depot });
  assert.deepEqual([usage.code, usage.sortie], [21, 'illisible\n# illisible : usage : git diff --name-only … | node double-relecture.mjs --base <réf> --tete <réf> [--titre <titre>] [--branche <branche de tête>]\n']);
  // Sans `git` au PATH : un outil manquant, sortie 69, et toujours « illisible » en première ligne.
  const sansGit = lancer(script, ['--base', 'origin/develop', '--tete', tete], { cwd: depot, entree: `${CODE}\n`, env: { PATH: dossier('sans-git-') } });
  assert.deepEqual([sansGit.code, sansGit.sortie], [69, 'illisible\n# illisible : git est requis par les scripts de la chaîne\n']);
  assert.deepEqual([SORTIES[NON_EXIGEE], SORTIES[ILLISIBLE], SORTIES.outilManquant], [0, 21, 69]);
});

test('le ticket se lit dans le titre et dans le nom de la branche de tête, et son en-tête sur la base', () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  g(depot, 'checkout', '-q', '-f', 'develop');
  const base = commit(depot, { [TICKET]: ticket('Relecture: double\n'), [INDEX]: index([]) }, 'docs: relecture double');
  const args = ['--base', base, '--tete', tete];
  const avec = lancer(script, [...args, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([avec.code, avec.sortie], [20, `exigée\nSPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\t${base}\n`]);
  for (const branche of ['docs/une-note', 'sujet/spec-all-fac-1-03']) assert.equal(lancer(script, [...args, '--branche', branche], { cwd: depot, entree: 'README.md\n' }).code, 0, branche);
  assert.equal(lancer(script, args, { cwd: depot, entree: 'README.md\n' }).code, 0, 'sans --branche');
  const parLeTitre = lancer(script, [...args, '--titre', 'feat(api): total (SPEC_ALL_FAC-1.03)', '--branche', 'docs/une-note'], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([parLeTitre.code, parLeTitre.sortie], [20, avec.sortie]);
  // Le titre nomme un ticket, la branche un autre : les deux sont lus, celui de la branche suffit.
  const deux = lancer(script, [...args, '--titre', 'feat(api): total (SPEC_ALL_FAC-1.04)', '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.equal(deux.code, 20);
  assert.match(deux.sortie, /^exigée\nSPEC_ALL_FAC-1\.03\tRelecture: double\t.*\n# ticket SPEC_ALL_FAC-1\.04 absent de /);
  // Une branche de sujet du dépôt porte le ticket avec la ligne, la base non : il est lu là aussi.
  g(depot, 'update-ref', 'refs/remotes/origin/sujet/facture', base);
  const surLeSujet = lancer(script, ['--base', 'origin/develop', '--tete', tete, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([surLeSujet.code, surLeSujet.sortie], [20, `exigée\nSPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\torigin/sujet/facture\n`]);
});

test("le lecteur git : un fichier absent de la réf, plusieurs fichiers en une lecture, un contenu à accents", () => {
  const { depot, tete } = depotJouet();
  const l = lecteurGit(depot);
  assert.deepEqual(l.lister(tete, 'docs/metier/regles/'), [R16]);
  assert.deepEqual(l.lister(tete, 'absent/'), []);
  const lus = l.lire(tete, [R16, CODE]);
  assert.match(lus.get(R16), /arrondi au centime[\s\S]*Le total est la somme des lignes\.\n$/);
  assert.equal(lus.get(CODE), 'export const total = 1;\n');
  assert.throws(() => l.lire(tete, ['absent.md']), Illisible);
  assert.throws(() => l.verifier('origin/absente'), Illisible);
  assert.throws(() => l.verifier('--all'), /référence --all refusée/);
  assert.match(l.verifier('origin/develop'), /^[0-9a-f]{40}$/);
  assert.equal(l.baseDeFusion('origin/develop', tete), l.verifier('origin/develop'));
  assert.deepEqual(l.sujets(), []);
  g(depot, 'update-ref', 'refs/remotes/origin/sujet/facture', tete);
  g(depot, 'update-ref', 'refs/remotes/origin/autre', tete);
  assert.deepEqual(l.sujets(), ['origin/sujet/facture']);
  const orphelin = g(depot, 'commit-tree', '-m', 'sans parent', `${tete}^{tree}`);
  assert.throws(() => l.baseDeFusion('origin/develop', orphelin), /pas de base de fusion/);
  assert.throws(() => l.verifier(`${tete}:README.md`), Illisible, 'un commit, pas un fichier');
});

test("le point d'entrée est reconnu par un lien symbolique, depuis un dossier à espace et à accent", () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils('outils é -');
  const lien = join(dirname(script), 'lien-double-relecture.mjs');
  symlinkSync(script, lien);
  for (const [nom, chemin, options] of [['direct', script, []], ['lien', lien, []], ['lien, --preserve-symlinks-main', lien, ['--preserve-symlinks-main']]]) {
    const r = lancer(chemin, ['--base', 'origin/develop', '--tete', tete], { cwd: depot, entree: `${CODE}\n`, options });
    assert.deepEqual([r.code, r.sortie.split('\n')[0]], [20, 'exigée'], nom);
  }
});
````

### § 2 — `skills/chaine/fusionner/scripts/double-relecture.mjs`

Créer le fichier, tel quel. Le banc du § 1 devient vert, 26 sur 26.

````js
#!/usr/bin/env node
// =============================================================================
// « Double relecture exigée », un seul calcul pour le Relecteur et pour le capitaine.
//
// Une PR exige deux relectures indépendantes quand :
//   - son ticket porte la ligne `Relecture: double`, ou cite sur sa ligne `Règles:` une règle de criticité haute ;
//   - son diff touche le fichier d'une règle haute, ou un fichier que le champ `code` de cette règle nomme ;
//   - elle change le niveau d'une règle vers ou depuis « haute » (une criticité fixée sur une feature, par exemple).
//
//   git diff --name-only … | node scripts/chaine/double-relecture.mjs --base <réf> --tete <réf> [--titre <titre>] [--branche <branche de tête>]
//
// Entrée standard : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only` les écrit.
// `--base` : la cible de la PR, relue par qui appelle (`origin/develop`, `origin/sujet/<nom>`). `--tete` : son
// sommet (un sha ou une réf). `--titre`, `--branche` : le titre de la PR et le nom de sa branche de tête, d'où se
// lit son ticket (`ticketDeLaPr` de la grammaire ; quand le titre et la branche en nomment deux, les deux sont lus).
//
// Tout se lit dans des objets git, jamais dans l'arbre de travail : ce fichier tourne depuis la copie des outils
// que la boucle du capitaine reprend d'origin/develop, hors du dépôt, avec `scripts/chaine` et
// `scripts/docs/identifiants.mjs` pour tout bagage. Aucune dépendance : l'en-tête YAML d'une règle est lu ici,
// pour trois clés seulement (`criticality`, `code`, `validation`), et ce que ce lecteur ne comprend pas est
// « illisible », jamais « non exigée ».
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
// L'en-tête du ticket (`Relecture:`, `Règles:`) se lit sur la base, sur `origin/develop` et sur chaque
// `origin/sujet/*` : une seule de ces lectures qui dit « double » ou cite une règle haute suffit. Jamais sur la
// tête : une PR ne s'ajoute ni ne se retire rien.
//
// Sortie standard : `exigée`, `non exigée` ou `illisible` en première ligne ; puis une ligne par cause
// (`<règle ou ticket>\t<fichier | code | niveau | Règles: | Relecture: double>\t<chemin>\t<réf>`), puis une
// ligne `# …` par lecture en échec ou remarque. Une cause établie suffit : « illisible » n'est rendu que si
// aucune ne l'est.
// Sorties : 0 non exigée · 20 exigée · 21 illisible (usage compris) · 69 outil manquant (`git`, ou la grammaire
// des identifiants), première ligne `illisible`. Qui appelle ne lit « non exigée » que sur la sortie 0 ET la
// première ligne ; tout autre code que 0 et 20 (un plantage de node sort en 1) se lit « illisible ».
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXIGEE = 'exigée';
export const NON_EXIGEE = 'non exigée';
export const ILLISIBLE = 'illisible';
export const SORTIES = { [NON_EXIGEE]: 0, [EXIGEE]: 20, [ILLISIBLE]: 21, outilManquant: 69 };
export const DEVELOP = 'origin/develop';
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
  if (f.length < 2 || !f.endsWith('"')) illisible(`ligne du diff illisible : ${f}`);
  const car = [...f.slice(1, -1)];
  const octets = [];
  for (let i = 0; i < car.length; i++) {
    if (car[i] === '"') illisible(`ligne du diff illisible : ${f}`);
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
    } else illisible(`ligne du diff illisible : ${f}`);
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

/** `{ a: 1, b: 2 }` sur une ligne → Map. */
function mappageEnLigne(valeur) {
  const m = new Map();
  for (const part of decouper(interieur(valeur, '{', '}'))) {
    const i = part.indexOf(':');
    if (i <= 0) illisible(`mappage illisible : ${part}`);
    m.set(part.slice(0, i).trim(), part.slice(i + 1));
  }
  return m;
}

/** Les lignes d'un bloc à son premier niveau d'indentation (les plus profondes sont le contenu d'une de ces lignes). */
function premierNiveau(bloc) {
  const retrait = (l) => l.length - l.trimStart().length;
  const min = bloc.reduce((m, l) => Math.min(m, retrait(l)), Infinity);
  return bloc.filter((l) => retrait(l) === min).map((l) => l.trim());
}

/** La valeur d'une clé qui ouvre un mappage ou une liste en ligne (`{ … }`, `[ … ]`), ramenée sur une ligne si elle est pliée ; sinon `null`. */
function enLigne(cle) {
  const debut = cle.valeur !== '' ? cle.valeur : (cle.bloc[0] ?? '').trim();
  return /^[[{]/.test(debut) ? [cle.valeur, ...cle.bloc.map((l) => l.trim())].filter(Boolean).join(' ') : null;
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
    const niveau = r.criticality === undefined ? null : r.criticality?.level;
    if (niveau !== null && !NIVEAUX.includes(niveau)) illisible(`${INDEX} : \`criticality.level\` de ${r.key} illisible`);
    const code = r.code ?? [];
    if (!Array.isArray(code) || code.some((p) => typeof p !== 'string')) illisible(`${INDEX} : \`code\` de ${r.key} illisible`);
    regles.set(comparable(r.key), { cle: r.key, niveau, code, enVigueur: !HORS_VIGUEUR.includes(r.validation?.status) });
  }
  return regles;
}

// ── Les lectures git ──────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Lecteur d'objets git du dépôt `cwd` : `verifier(ref)` → le sha du commit, `baseDeFusion(a, b)` → un sha,
 * `sujets()` → les `origin/sujet/*`, `lister(ref, prefixe)` → chemins, `lire(ref, chemins)` → Map chemin → texte.
 */
export function lecteurGit(cwd = process.cwd()) {
  const git = (args, input) => {
    try {
      return execFileSync('git', args, { cwd, input, maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] });
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
  return {
    verifier(ref) {
      // Une réf qui commence par un tiret serait lue par git comme une option.
      if (typeof ref !== 'string' || ref.startsWith('-')) illisible(`référence ${ref} refusée`);
      return essayer(['rev-parse', '--verify', '-q', `${ref}^{commit}`], `référence ${ref} introuvable`).toString('utf8').trim();
    },
    baseDeFusion(a, b) {
      return essayer(['merge-base', a, b], `pas de base de fusion entre ${a} et ${b}`).toString('utf8').trim();
    },
    sujets() {
      return essayer(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/sujet/'], 'branches de sujet illisibles').toString('utf8').split('\n').filter(Boolean);
    },
    lister(ref, prefixe) {
      return essayer(['ls-tree', '-r', '-z', '--name-only', ref, '--', prefixe], `arbre de ${ref} illisible`).toString('utf8').split('\0').filter(Boolean);
    },
    lire(ref, chemins) {
      const textes = new Map();
      if (chemins.length === 0) return textes;
      const brut = essayer(['cat-file', '--batch'], `objets de ${ref} illisibles`, chemins.map((c) => `${ref}:${c}\n`).join(''));
      let i = 0;
      for (const chemin of chemins) {
        const fin = brut.indexOf(10, i);
        const taille = / blob (\d+)$/.exec(brut.subarray(i, Math.max(fin, i)).toString('utf8'))?.[1];
        if (fin === -1 || taille === undefined) illisible(`${ref}:${chemin} illisible`);
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

/** Les règles hautes et en vigueur d'un arbre : `{ regles: Map clé comparable → { cle, code }, source }`. */
function hautes(ref, touchees, lecteur) {
  const fichiers = new Map(); // clé comparable → chemin réel
  for (const chemin of lecteur.lister(ref, REGLES)) {
    const cle = regleDuChemin(chemin);
    if (cle) fichiers.set(cle, chemin);
  }
  const avecIndex = lecteur.lister(ref, INDEX).includes(INDEX);
  const regles = avecIndex ? reglesDeLIndex(lecteur.lire(ref, [INDEX]).get(INDEX)) : new Map();
  // Sans index : tous les en-têtes. Avec : ceux des fichiers de règle que le diff touche, en plus.
  const aLire = [...fichiers].filter(([cle]) => !avecIndex || touchees.has(cle));
  const textes = lecteur.lire(ref, aLire.map(([, chemin]) => chemin));
  for (const [cle, chemin] of aLire) {
    let lu;
    try {
      lu = enTeteDeRegle(textes.get(chemin));
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      illisible(`${ref}:${chemin} : ${e.message}`);
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

/** Ce que l'en-tête du ticket dit sur une réf : `{ chemin, double, regles }` (clés comparables), ou `null` si la réf ne le porte pas. */
function enTeteDuTicket(ticket, ref, lecteur) {
  const motif = G.fichierDuTicket(ticket) ?? illisible(`${ticket} n'est pas un identifiant de ticket`);
  lecteur.verifier(ref);
  const fichiers = lecteur.lister(ref, 'docs/').filter((p) => motif.test(`/${p}`) && !G.estArchive(`/${p}`));
  if (fichiers.length > 1) illisible(`${fichiers.length} fichiers pour le ticket ${ticket} sur ${ref} : ${fichiers.join(', ')}`);
  if (fichiers.length === 0) return null;
  const [chemin] = fichiers;
  const lignes = lecteur.lire(ref, fichiers).get(chemin).split(/\r?\n/);
  const fin = lignes.findIndex((l) => /^## /.test(l));
  const valeurs = (nom) => (fin === -1 ? lignes : lignes.slice(0, fin)).map((l) => new RegExp(`^${nom}\\s*:\\s*(.*)$`).exec(l)?.[1]).filter((v) => v !== undefined);
  const relectures = valeurs('Relecture');
  for (const v of relectures) if (scalaire(v) !== 'double') illisible(`${ref}:${chemin} : ligne \`Relecture:\` « ${v.trim().slice(0, 80)} », seule valeur \`double\``);
  // Comme le gate `tickets` : des identifiants de règle séparés par des virgules ou des blancs, entre accents graves ou nus, ou `—`.
  const regles = [];
  for (const v of valeurs('Règles'))
    for (const morceau of scalaire(v).split(/[\s,]+/).filter((m) => m !== '' && !/^[—–-]$/.test(m))) {
      const nu = /^`([^`]+)`$/.exec(morceau)?.[1] ?? morceau;
      const lu = G.lireIdentifiant(nu);
      if (lu?.type !== 'RULE' || lu.index !== undefined) illisible(`${ref}:${chemin} : ligne \`Règles:\`, « ${morceau.slice(0, 80)} » n'est pas un identifiant de règle`);
      regles.push(comparable(nu));
    }
  return { chemin, double: relectures.length > 0, regles };
}

/**
 * La PR exige-t-elle deux relectures ? `fichiers` : les lignes de `git diff --name-only` ; `base`, `tete` : la cible
 * et le sommet ; `tickets` : les identifiants des tickets de la PR (aucun, un, ou deux quand son titre et sa branche
 * n'en nomment pas le même) ; `develop` : `origin/develop`. Rend `{ reponse, causes, illisibles, remarques }`.
 */
export function doubleRelecture({ fichiers, base, tete, tickets = [], develop = DEVELOP, lecteur = lecteurGit() }) {
  const causes = [];
  const illisibles = [];
  const remarques = [];
  let outilManquant = false;
  const essayer = (lecture) => {
    try {
      lecture();
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      outilManquant ||= e instanceof OutilManquant;
      if (!illisibles.includes(e.message)) illisibles.push(e.message);
    }
  };
  if (!G) return { reponse: ILLISIBLE, causes, illisibles: [`scripts/docs/identifiants.mjs introuvable depuis ${ICI}`], remarques, outilManquant: true };
  let chemins = [];
  essayer(() => {
    chemins = fichiers.filter((f) => f.trim() !== '').map((f) => ({ ecrit: f.trim(), lu: cheminDuDiff(f) }));
  });
  const touchees = new Set(chemins.map((c) => regleDuChemin(c.lu)).filter(Boolean));

  // Les règles hautes d'un arbre, lues une fois par commit : la base est souvent `origin/develop`, ou le départ.
  // Un échec est gardé comme une réussite, avec la réf qui l'a lu la première : il n'est dit qu'une fois.
  const parCommit = new Map();
  const hautesDe = (ref) => {
    const commit = lecteur.verifier(ref);
    if (!parCommit.has(commit)) {
      try {
        parCommit.set(commit, hautes(ref, touchees, lecteur));
      } catch (e) {
        if (!(e instanceof Illisible) || e instanceof OutilManquant) throw e;
        parCommit.set(commit, new Illisible(e.message.startsWith(`${ref}:`) ? e.message : `${ref} : ${e.message}`));
      }
    }
    const lu = parCommit.get(commit);
    if (lu instanceof Illisible) throw lu;
    return lu;
  };

  // 1. Le diff touche le fichier d'une règle haute, ou un fichier de son `code` : sur la base, la tête et develop.
  const arbres = [...new Set([base, tete, develop])];
  const hautesQuelquePart = new Map(); // clé comparable → clé écrite
  for (const ref of arbres)
    essayer(() => {
      const { regles } = hautesDe(ref);
      const parCode = new Map();
      for (const [cle, r] of regles) {
        hautesQuelquePart.set(cle, r.cle);
        for (const p of r.code) {
          const dossier = comparable(p.trim().replace(/^\.\//, '').replace(/\/+$/, ''));
          parCode.set(dossier, [...(parCode.get(dossier) ?? []), r.cle]);
        }
      }
      for (const c of chemins) {
        const regle = regles.get(regleDuChemin(c.lu));
        if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref });
        // Le chemin lui-même, puis chacun de ses dossiers : une entrée de `code` peut nommer un dossier.
        for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')
          for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref });
      }
    });

  // 2. La PR change le niveau d'une règle vers ou depuis « haute » : de son départ à sa tête.
  essayer(() => {
    lecteur.verifier(base);
    lecteur.verifier(tete);
    const depart = hautesDe(lecteur.baseDeFusion(base, tete));
    const arrivee = hautesDe(tete);
    for (const [cle, r] of [...depart.regles, ...arrivee.regles])
      if (depart.regles.has(cle) !== arrivee.regles.has(cle)) causes.push({ sujet: r.cle, motif: 'niveau', chemin: arrivee.source, ref: tete });
  });

  // 3. Le ticket : `Relecture: double`, ou une règle haute citée en `Règles:`, sur la base, develop et chaque sujet.
  if (tickets.length > 0) {
    let refs = [base, develop];
    essayer(() => {
      refs = [...new Set([base, develop, ...lecteur.sujets()])];
    });
    for (const ticket of new Set(tickets)) {
      let trouve = false;
      for (const ref of refs)
        essayer(() => {
          const lu = enTeteDuTicket(ticket, ref, lecteur);
          if (!lu) return;
          trouve = true;
          if (lu.double) causes.push({ sujet: ticket, motif: 'Relecture: double', chemin: lu.chemin, ref });
          for (const cle of lu.regles) if (hautesQuelquePart.has(cle)) causes.push({ sujet: hautesQuelquePart.get(cle), motif: 'Règles:', chemin: lu.chemin, ref });
        });
      if (!trouve) remarques.push(`ticket ${ticket} absent de ${refs.join(', ')} : aucun en-tête lu`);
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

/** Ce que la ligne de commande écrit : la réponse, les causes, puis les lectures en échec et les remarques en `# …`. */
export function texte({ reponse, causes, illisibles, remarques }) {
  return [
    reponse,
    ...causes.map((c) => [c.sujet, c.motif, c.chemin, c.ref].join('\t')),
    ...illisibles.map((m) => `# illisible : ${m}`),
    ...remarques.map((m) => `# ${m}`),
  ]
    .map((l) => `${l}\n`)
    .join('');
}

const USAGE = 'usage : git diff --name-only … | node double-relecture.mjs --base <réf> --tete <réf> [--titre <titre>] [--branche <branche de tête>]';

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
      resultat = { reponse: ILLISIBLE, causes: [], illisibles: [`${e?.message ?? e}`], remarques: [] };
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

`.claude-plugin/plugin.json:3` : `"version": "7.18.2"` devient `"version": "7.19.0"` (règle de repli : décision 20).

`NOTES-DE-VERSION.md` : cette note, entre le paragraphe d'introduction et `## 7.18.2 — 2026-11-18`, avec la date du jour de la livraison :

````markdown
## 7.19.0 — 2026-11-18

### Ce qui change

Le skill `fusionner` porte un calcul nouveau, `scripts/double-relecture.mjs` : il dit si une PR exige deux relectures indépendantes, parce que son ticket porte la ligne `Relecture: double` ou cite en `Règles:` une règle de criticité haute, que son diff touche le fichier d'une règle haute ou un fichier que le champ `code` de cette règle nomme, ou qu'elle change le niveau d'une règle vers ou depuis « haute ». Il rend « exigée » avec les règles en cause, « non exigée » ou « illisible » ; une lecture en échec ne vaut jamais « non exigée ». Aucun script ne l'appelle encore : c'est une brique de la relecture indépendante, qui arrive par étapes. L'étape 0 de `fusionner` (`poser`) le nomme parmi les scripts à copier.

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
| une lecture en échec ne vaut jamais « non exigée » ; elle est dite une fois par commit ; un dépôt sans `origin/develop` | « index illisible, schéma inconnu, en-tête illisible, référence introuvable, ligne du diff mal citée … » |
| une cause établie suffit, l'échec reste dit ; la forme de la sortie | « une cause établie suffit … » |
| `Relecture: double` : l'en-tête du ticket, jamais la tête, pour le ticket de la PR seul | « `Relecture: double` écrite sur le ticket … » |
| une autre valeur, un ticket en double : illisible ; ticket absent ou archivé : une remarque | « ligne `Relecture:` d'une autre valeur … » |
| `Règles:` : une règle haute citée suffit ; la forme de la ligne ; un jeton qui n'est pas une règle | « un ticket qui cite une règle haute en `Règles:` … » |
| le niveau se lit aussi sur `origin/develop` | « le niveau se lit aussi sur origin/develop … » |
| l'en-tête du ticket sur la base, `origin/develop` et chaque sujet | « l'en-tête du ticket se lit sur la base, sur origin/develop et sur chaque origin/sujet/* … » |
| le changement de niveau, vers et depuis « haute », du départ à la tête | « une PR qui change le niveau d'une règle vers ou depuis « haute » … », et « règle montée à haute après le verdict … » pour le départ |
| le ticket de la PR : `ticketDeLaPr`, puis la branche | « le ticket de la PR est celui de `ticketDeLaPr` … », « le ticket se lit dans le titre et dans le nom de la branche de tête … » |
| l'en-tête YAML : formes lues, formes refusées, temps linéaire | « l'en-tête d'une règle : les formes lues … », « lecture en temps linéaire … » |
| l'index : `key`, `criticality.level`, `code`, `validation.status`, pivots 2 et 3 | « l'index : `rules[].key` … » |
| les lignes de `git diff --name-only`, en parité avec `revue-exigee.mjs` ; les arguments | « les lignes de `git diff --name-only` … », « les lignes du diff se lisent comme `revue-exigee.mjs` les lit … » |
| depuis la copie des outils de la boucle : les réfs, jamais l'arbre de travail ; sorties 0, 20, 21, 69 | « en ligne de commande, depuis la copie des outils de la boucle … » |
| le lecteur git : un objet absent, plusieurs objets en une lecture, une réf qui commence par un tiret, la base de fusion, les branches de sujet | « le lecteur git … » |
| le point d'entrée par un lien symbolique, un dossier à espace et à accent | « le point d'entrée est reconnu … » |
| l'étape 0 nomme le module | `git diff origin/main -- skills/chaine/fusionner/SKILL.md` (aucun test ne lit cette phrase) ; le garde des bancs posés pose le dossier entier |
| version et note | test existant de `scripts/depot.test.mjs:1093` |

## Vérification

### Pour la session

1. `pnpm install --frozen-lockfile && pnpm test` : la suite entière, verte. Sur `6fc652d`, **801 tests** avec ces fichiers (775 sans : 801 moins les 26 du banc).
2. `node --test skills/chaine/fusionner/scripts/double-relecture.test.mjs` : 26 sur 26, en deux secondes environ.
3. `git diff --stat origin/main` : cinq fichiers, deux neufs et trois modifiés ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` ; `git diff origin/main -- skills/chaine/fusionner/SKILL.md` ne montre qu'une ligne, et dans cette ligne le seul mot ajouté.
4. Le banc posé à plat : il est rejoué par `scripts/poses.test.mjs` dans la suite du point 1 ; pour le voir seul, copier les deux fichiers et `revue-exigee.mjs` dans `<dossier>/scripts/chaine/`, `skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs` dans `<dossier>/scripts/docs/`, puis `node --test <dossier>/scripts/chaine/double-relecture.test.mjs`.
5. Les mutations : le script ci-dessous sur ce dossier posé à plat, `python3 <fichier> <dossier>/scripts/chaine` : **73 rouges sur 73**. Il remet le fichier après chaque mutation.

### Ce qui a été joué en écrivant ce ticket

Le 2026-11-18, dans des clones jetables de `origin/main`, sous un `TMPDIR` privé : la première version à `99a6214` puis `22b2d49`, celle-ci, après `A-113`, dans un clone neuf à `6fc652d`. Les blocs de ce ticket (banc, module, mutations, mot de l'étape 0, note) ont été relus par un script qui les tire du texte et les rejoue : ce qui suit est le résultat de ce texte, pas d'un brouillon.

- Le banc : 26 sur 26, deux secondes environ, dans l'arbre du plugin et posé à plat ; rien ne reste dans le dossier temporaire.
- La suite entière : 801 sur 801 à `6fc652d`, avec les deux fichiers, le mot de l'étape 0, la version 7.19.0 et sa note. Le banc y est rejoué posé à plat par `scripts/poses.test.mjs`, dont le test a duré 3 minutes 20 sur les 10 de son plafond. La première version avait passé la suite à `99a6214` et à `22b2d49` (794 sur 794, 772 sans ses fichiers).
- Les mutations : 73 rouges sur 73, après un passage témoin vert.
- **Sur des données réelles, en lecture seule.** Le lecteur d'en-tête avait lu, dans la première version, les 1 923 fichiers de règle de trois dépôts réels sans un refus, avec le même ensemble de chemins `code` et le même statut que leur index ; ce lecteur n'a pas changé depuis. La ligne de commande d'aujourd'hui, lancée depuis la copie posée à plat, a jugé dans le dépôt d'Anchorpost une PR fictive de `origin/develop` (index au pivot 2, criticité nue) à `origin/sujet/preuve-suffisante-cas` (pivot 3, criticité en bloc), 293 fichiers, quatre branches de sujet : « exigée », par le fichier de la règle haute lu sur la base et par quatre fichiers de son `code` lus sur la tête, sans cause `niveau` (la règle est haute au départ comme à la tête), le ticket nommé par le titre étant trouvé sur son sujet ; avec `README.md` seul sur `origin/develop`, « non exigée ». Sur les deux autres dépôts (un index de plus d'un millier de règles pour le plus gros), une réponse « non exigée » prend un quart de seconde.

Non joué : aucun appelant n'existe, donc ni le Relecteur ni le capitaine n'ont lancé ce calcul ; la vraie boucle (`boucle.sh`) n'a pas repris le fichier d'un `origin/develop`, c'est le banc qui imite sa copie ; le schéma pivot a été lu dans Anchorpost aux commits nommés dans « Où », pas la CLI exécutée ; aucune PR réelle ne change une criticité par le manifeste dans les dépôts lus : la cause `niveau` n'est jouée que sur les arbres du banc ; la suite de `main` seul à `6fc652d` n'a pas été rejouée (775 attendus : 801 moins les 26 du banc ; 772 joués à `22b2d49`).

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
    ("le niveau n'est lu que sur la base et develop", "const arbres = [...new Set([base, tete, develop])];", "const arbres = [...new Set([base, develop])];"),
    ("le niveau n'est lu que sur la tête et develop", "const arbres = [...new Set([base, tete, develop])];", "const arbres = [...new Set([tete, develop])];"),
    ("le niveau n'est plus lu sur origin/develop", "const arbres = [...new Set([base, tete, develop])];", "const arbres = [...new Set([base, tete])];"),
    ("le changement de niveau n'est plus une cause", "if (depart.regles.has(cle) !== arrivee.regles.has(cle)) causes.push(", "if (false) causes.push("),
    ("le changement de niveau : vers « haute » seulement", "if (depart.regles.has(cle) !== arrivee.regles.has(cle)) causes.push(", "if (!depart.regles.has(cle) && arrivee.regles.has(cle)) causes.push("),
    ("le changement de niveau : depuis « haute » seulement", "if (depart.regles.has(cle) !== arrivee.regles.has(cle)) causes.push(", "if (depart.regles.has(cle) && !arrivee.regles.has(cle)) causes.push("),
    ("le changement de niveau se lit de la cible à la tête, plus du départ de la PR", "const depart = hautesDe(lecteur.baseDeFusion(base, tete));", "const depart = hautesDe(base);"),
    ("la ligne `Règles:` n'est plus lue", "for (const cle of lu.regles) if (hautesQuelquePart.has(cle)) causes.push(", "for (const cle of lu.regles) if (false) causes.push("),
    ("toute règle citée en `Règles:` compte, haute ou non", "for (const cle of lu.regles) if (hautesQuelquePart.has(cle)) causes.push({ sujet: hautesQuelquePart.get(cle),", "for (const cle of lu.regles) if (true) causes.push({ sujet: hautesQuelquePart.get(cle) ?? cle,"),
    ("un jeton de `Règles:` qui n'est pas une règle est sauté", "if (lu?.type !== 'RULE' || lu.index !== undefined) illisible(", "if (lu?.type !== 'RULE' || lu.index !== undefined) continue; else if (false) illisible("),
    ("la ligne `Règles:` se lit dans tout le ticket", "for (const v of valeurs('Règles'))", "for (const v of lignes.map((l) => /^Règles\\s*:\\s*(.*)$/.exec(l)?.[1]).filter((v) => v !== undefined))"),
    ("l'en-tête du ticket ne se lit plus sur les sujets", "refs = [...new Set([base, develop, ...lecteur.sujets()])];", "refs = [...new Set([base, develop])];"),
    ("l'en-tête du ticket ne se lit plus sur origin/develop", "refs = [...new Set([base, develop, ...lecteur.sujets()])];", "refs = [...new Set([base, ...lecteur.sujets()])];"),
    ("l'en-tête du ticket ne se lit plus sur la base", "refs = [...new Set([base, develop, ...lecteur.sujets()])];", "refs = [...new Set([develop, ...lecteur.sujets()])];"),
    ("le ticket : le titre seul, quand il en nomme un", "[...new Set([G.ticketDeLaPr(titre, branche), G.identifiantDeBranche(branche)].filter(Boolean))]", "[...new Set([G.ticketDeLaPr(titre, branche)].filter(Boolean))]"),
    ("le ticket : la branche seule", "[...new Set([G.ticketDeLaPr(titre, branche), G.identifiantDeBranche(branche)].filter(Boolean))]", "[...new Set([G.identifiantDeBranche(branche)].filter(Boolean))]"),
    ("sans `git`, la sortie est 21", "outilManquant: 69 };", "outilManquant: 21 };"),
    ("`git` introuvable se lit comme une réf introuvable", "if (e?.code === 'ENOENT') throw new OutilManquant('git est requis par les scripts de la chaîne');", ""),
    ("une lecture en échec est redite à chaque arbre du même commit", "parCommit.set(commit, new Illisible(e.message.startsWith(`${ref}:`) ? e.message : `${ref} : ${e.message}`));", "throw new Illisible(e.message.startsWith(`${ref}:`) ? e.message : `${ref} : ${e.message}`);"),
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
    ("l'en-tête du ticket se lit aussi sur la tête", "refs = [...new Set([base, develop, ...lecteur.sujets()])];", "refs = [...new Set([base, develop, tete, ...lecteur.sujets()])];"),
    ("la ligne `Relecture:` se lit dans tout le ticket", "const relectures = valeurs('Relecture');", "const relectures = lignes.map((l) => /^Relecture\\s*:\\s*(.*)$/.exec(l)?.[1]).filter((v) => v !== undefined);"),
    ("une ligne `Relecture:` d'une autre valeur est ignorée", "for (const v of relectures) if (scalaire(v) !== 'double') illisible(", "for (const v of relectures) if (false) illisible("),

    ("la ligne `Relecture: double` n'est plus lue", "if (lu.double) causes.push(", "if (false) causes.push("),
    ("un ticket archivé compte", "&& !G.estArchive(`/${p}`)", ""),
    ("un ticket en double : le premier est pris", "if (fichiers.length > 1) illisible(", "if (false) illisible("),
    ("un fichier de règle à toute profondeur", "/^docs\\/metier\\/regles\\/([^/]+)\\/([^/]+)\\.md$/", "/docs\\/metier\\/regles\\/([^/]+)\\/([^/]+)\\.md$/"),
    ("un fichier de règle hors du dossier de son contexte", "&& comparable(G.dossierDuContexte(lu.contexte)) === m[1] ? m[2] : null", "? m[2] : null"),
    ("le fichier d'une règle haute ne compte plus", "if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref });", ""),
    ("le code d'une règle haute ne compte plus", "for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref });", ""),
    ("une entrée de `code` ne nomme plus un dossier", "for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')", "for (let p = c.lu; p !== ''; p = '')"),
    ("une cause par réf (doublons)", "return !vues.has(k) && vues.add(k);", "return true;"),
    ("une ligne du diff mal citée est sautée", "if (f.length < 2 || !f.endsWith('\"')) illisible(`ligne du diff illisible : ${f}`);", "if (f.length < 2 || !f.endsWith('\"')) return '';"),
    ("les chemins ne sont plus repliés en minuscules", "const comparable = (s) => s.normalize('NFC').toUpperCase().toLowerCase();", "const comparable = (s) => s.normalize('NFC');"),
    ("en-tête : une clé imbriquée est lue comme une clé", "const cle = /^([A-Za-z_][\\w-]*)[ \\t]*:(?:[ \\t]+(.*))?$/.exec(ligne);", "const cle = /^\\s*([A-Za-z_][\\w-]*)[ \\t]*:(?:[ \\t]+(.*))?$/.exec(ligne);"),
    ("en-tête : une clé écrite deux fois, la dernière gagne", "if (cles.has(cle[1])) illisible(`clé \\`${cle[1]}\\` écrite deux fois`);", ""),
    ("en-tête : un niveau hors vocabulaire vaut « à classer »", "if (!NIVEAUX.includes(niveau)) illisible(`criticité « ${niveau} » : attendu low, medium ou high`);", "if (!NIVEAUX.includes(niveau)) niveau = null;"),
    ("en-tête : la forme nue n'est plus lue", "const brut = criticite.valeur !== '' && enLigne(criticite) === null ? criticite.valeur : champ(criticite, 'level');", "const brut = champ(criticite, 'level');"),
    ("en-tête : un mappage ou une liste pliés sur plusieurs lignes ne sont plus lus", "return /^[[{]/.test(debut) ? [cle.valeur, ...cle.bloc.map((l) => l.trim())].filter(Boolean).join(' ') : null;", "return /^[[{]/.test(cle.valeur) ? cle.valeur : null;"),
    ("une réf qui commence par un tiret passe à git", "if (typeof ref !== 'string' || ref.startsWith('-')) illisible(`référence ${ref} refusée`);", ""),
    ("en-tête : les guillemets ne protègent plus une virgule", "} else if (c === '\"' || c === \"'\") guillemet = c;", "}"),
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
    ("une réf introuvable n'est plus vérifiée", "return essayer(['rev-parse', '--verify', '-q', `${ref}^{commit}`], `référence ${ref} introuvable`).toString('utf8').trim();", "return ref;"),
    ("un objet absent de la réf est lu comme vide", "if (fin === -1 || taille === undefined) illisible(`${ref}:${chemin} illisible`);", "if (fin === -1 || taille === undefined) { textes.set(chemin, ''); continue; }"),
    ("une branche de sujet donne un ticket", "return G ? [...new Set([G.ticketDeLaPr(titre, branche),", "return G ? [...new Set([G.ticketDeLaPr(titre, branche.replace(/^sujet\\//, '')),"),
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

`A-113` a tranché les quatorze points de la première version de ce ticket (« Comments »). Restent six précisions prises ici, que la spec ne dit pas, et quatre limites. L'architecte les lit à la contre-revue ; chacune tient à une décision et à un test nommés.

**Précisions de ce ticket**

1. **Le changement de niveau se lit depuis la base de fusion, pas depuis la pointe de la cible** (décision 9). `A-113` dit « index de la base contre index de la tête » ; à la lettre, toute PR en retard sur une cible où une règle vient de changer de niveau exigerait deux relectures. Cas 4 du banc, et la mutation « le changement de niveau se lit de la cible à la tête ».
2. **Un jeton de `Règles:` qui n'est pas un identifiant de règle : « illisible »** (décision 13, cas 13 ter). Le gate `tickets` le refuse déjà hors dette gelée ; un ticket gelé qui en porte un rendrait ses PR illisibles jusqu'à sa correction.
3. **Le niveau d'une règle citée se lit sur les trois arbres, pas sur le sujet où vit le ticket** (décision 13) : une règle montée sur un autre sujet que la base n'est pas vue avant d'entrer dans `develop`.
4. **Un dépôt sans `origin/develop` : « illisible »** (décision 5, cas 9 ter).
5. **La grammaire introuvable sort en 69**, l'usage en 21 (décision 3).
6. **D'un titre qui cite plusieurs tickets, seul le premier est lu** (décision 14) : c'est `ticketDeLaPr`, telle quelle.

**Limites**

7. **Une criticité fixée au manifeste n'est vue qu'une fois l'index de la tête régénéré** (décision 9, cas 16 bis). Le Relecteur, qui juge avant, peut ne distribuer qu'une relecture ; le changement est vu par le premier calcul joué sur une tête dont l'index est régénéré.
8. **Les branches de sujet lues sont celles du dépôt de l'appelant** : une `origin/sujet/*` qu'il n'a pas relue, ou une branche supprimée qu'il n'a pas élaguée, donne une lecture en retard ou en trop. Le fetch est à l'appelant (lots 4 et 5a).
9. **Un chemin de règles déclaré au manifeste** (`contexts[].rules`) n'est pas reconnu comme le fichier d'une règle (décision 10) ; l'index, lui, porte quand même son niveau et son `code`.
10. **Le coût** croît avec le nombre de branches de sujet : un `git ls-tree` de `docs/` par sujet et par ticket (quelques millisecondes chacun sur les dépôts lus) ; non mesuré au-delà de quatre sujets.

## Hors périmètre

- **Tout appelant** : le Relecteur (lot 4), le capitaine à ses deux contrôles (lot 5a, `A-105`), le diff qu'ils passent, le fetch de la cible, de `origin/develop` et des sujets, ce qu'ils font d'« illisible » (`A-113`), le nombre qu'ils tirent de la réponse.
- **Le gate `tickets`** : la forme de `Relecture: double` (ticket 55, lot 2), son exigence sur un ticket qui cite une règle haute (lot 5c).
- **Le message d'information au produit** (`A-90`), qui part du conducteur.
- **`fusionner/references/CONTENU.md`, `scripts/points-d-entree.test.mjs`, l'arbre du `README.md`** : au plus tard avec 3d (décision 18). De `fusionner/SKILL.md`, seul le mot du § 3.
- **« Même contenu propre »** (lot 3b, ticket 59) et **le lecteur de verdict** (lot 3a, ticket 58).
- **Le skill `criticite`, la fiche et le gabarit de règle** : lus, pas un mot ne change.

## Comments

- 2026-11-18 — Écrit par un agent rédacteur sur la sixième version de la spec et sur `origin/main` à `22b2d49`, module et banc joués. Quatorze points remontés à l'architecte : le pivot 2 ; `Règles:` non lue ; l'index non régénéré ; la règle rejetée ; le fichier d'une règle et `code` ; la base d'une sous-PR ; où se lit `Relecture: double` ; le ticket de la PR ; une autre valeur de `Relecture:` ; que faire d'« illisible » ; le diff vide ; la criticité d'une feature ; la pose ; les codes de sortie.
- 2026-11-18 — Décisions de l'architecte portées au ticket (`A-113`). Cinq changent le calcul : `Règles:` est lue ; le niveau se lit sur trois arbres, `origin/develop` compris ; l'en-tête du ticket se lit sur la base, `origin/develop` et les sujets ; un changement de niveau vers ou depuis « haute » suffit ; le ticket de la PR est celui de `ticketDeLaPr`, et celui de la branche s'il est autre. Confirmés : les pivots 2 et 3, l'en-tête des règles touchées lu en plus de l'index, la règle rejetée ou obsolète, le chemin de convention et `code`, `Relecture:` d'une autre valeur, le diff vide. Accordés avec le ticket 59 : les sorties 0, 20, 21 et 69, sans 22. La pose : un mot à l'étape 0 de `fusionner/SKILL.md`. Base relue : `origin/main` à `6fc652d` (7.18.2). Rejoué dans un clone neuf : banc, suite entière, mutations (« Vérification »). Pas encore relu par un agent neuf.
