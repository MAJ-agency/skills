# « Double relecture exigée » : un seul calcul, avec son lecteur de règles et d'index, écrit et testé avant tout appelant

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — deux fichiers neufs donnés entiers (le calcul, son banc), une version et sa note données mot pour mot ; le tout a été joué sur une copie jetable de `origin/main`, suite entière et mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: — dans ce programme comme dans l'autre : le lot 3c n'écrit que des fichiers neufs et part tout de suite (`A-109`). Les tickets 58 (lot 3a) et 59 (lot 3b) partent en même temps et prennent eux aussi une version et une note : partir de `main`, reprendre `main` avant de livrer.
Dépendances: —
Fichiers chauds: `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`. Deux fichiers neufs, que personne d'autre n'écrit : `skills/chaine/fusionner/scripts/double-relecture.mjs`, `skills/chaine/fusionner/scripts/double-relecture.test.mjs`.

## Le besoin

Ce ticket réalise le lot 3c de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (sixième version, `A-110` et `A-111` compris) : la décision `A-82`, pour la décision du produit `P-56` (« Règle de criticité haute : deux relectures indépendantes, et un message d'information au produit, sans que la PR l'attende ») et pour `A-90`.

**La décision.** `A-82`, mot pour mot :

> **« Double relecture exigée », un seul calcul**, de même. Une PR l'exige quand son ticket porte la ligne `Relecture: double`, ou quand son diff touche le fichier d'une règle de criticité haute ou un fichier que le champ `code:` de cette règle nomme. Le niveau se lit sur la base **et** sur la tête de la PR (une PR qui monte elle-même une règle à haute est vue) : dans l'index Anchorpost du dépôt quand il en a un, qui porte le niveau effectif, criticité reçue d'une feature comprise — le ticket nomme le champ après lecture du schéma pivot, aucun lecteur n'existe aujourd'hui dans le plugin ; sinon dans l'en-tête des fichiers de règle (`criticality`, valeur `high`, sous ses deux formes), qui ne voit pas une criticité reçue d'une feature. `code:` est facultatif : une PR sans ticket qui touche le code d'une règle haute sans champ `code:` n'est pas vue, c'est écrit dans les limites. Le calcul tourne depuis la copie de travail de la boucle du capitaine, qui n'a que `scripts/chaine` et `scripts/docs/identifiants.mjs`, repris d'`origin/develop` à chaque tour, et aucune dépendance (amendée en sixième version) : il lit l'en-tête YAML des règles sans bibliothèque, son lecteur de règles vit sous `scripts/chaine`, et c'est la version de `develop` qui juge une sous-PR. La ligne `Relecture: double` se lit sur la base de la PR, par l'identifiant du ticket de sa branche. Le Relecteur et le capitaine refont tous deux ce calcul au moment de décider : le nombre écrit dans une distribution n'est qu'une information.

Et `A-90` : « Une règle montée à haute après un tour validé à un seul verdict : le tour redevient en cours, et la règle 5 lui ajoute une session. » (`A-110` dit ce que le Relecteur fait alors de l'étiquette.) `A-106` donne la règle des lectures que ce calcul reprend : « Une lecture en échec ne vaut jamais « même » » ; ici, jamais « non exigée ».

**Le fait, sur `origin/main` à `22b2d49`** (plugin 7.18.1) :

- Aucun script du plugin ne lit la criticité d'une règle. `contexte-ticket.mjs` (revue de ticket) et `contexte-regle.mjs` (skill `criticite`) rendent un fichier de règle tel quel, sans lire son en-tête ; `mutation-regles.mjs` (socle-tests) lit dans l'index le champ `code` des règles prouvées, au schéma "2", mais il se pose sous `scripts/verify/`, que la copie de travail de la boucle ne porte pas.
- Personne n'appelle encore ce calcul : ses deux appelants sont le Relecteur (lot 4) et le capitaine (lot 5a), qui lui passeront, eux, le diff qu'ils jugent.

**Quand le ticket est fait** : un fichier sans dépendance, à côté des scripts du capitaine, répond pour une PR (la liste de ses fichiers changés, sa cible, son sommet, sa branche) « exigée » avec les règles ou le ticket en cause, « non exigée », ou « illisible » ; son banc le tient sur des fichiers de règle et un index à la forme du standard, joue la ligne de commande depuis une copie des outils faite comme celle de la boucle, et chaque mutation de la liste le fait rougir. Rien d'autre ne change dans le plugin : aucun script ne l'appelle, aucun texte ne le cite.

## Où

Base : `origin/main` à `22b2d49` (plugin **7.18.1**). `main` a avancé depuis le `1c4acb1` de la spec (PR 113, 111 et 116 : socle mobile, documents de l'autre programme, `demarrer-local`), la dernière fois pendant l'écriture de ce ticket, sans toucher un fichier de la chaîne : les repères de ligne ci-dessous sont les mêmes à `99a6214` et à `22b2d49`. La session relit `main` avant de partir.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/double-relecture.mjs` | **neuf** : le calcul, ses lecteurs, sa ligne de commande (§ 2) |
| `skills/chaine/fusionner/scripts/double-relecture.test.mjs` | **neuf** : son banc, 22 tests (§ 1) |
| `.claude-plugin/plugin.json:3` | la version, mineure (§ 3) |
| `NOTES-DE-VERSION.md` | la note, en tête (§ 3) |

Aucun autre fichier : la vérification le montre par une commande.

### Lus, non modifiés

- `skills/chaine/fusionner/scripts/boucle.sh:54-60` et `:194-220` (`rafraichir_outils`) : à chaque tour, `git archive origin/develop scripts/chaine` (`:203`) puis `scripts/docs/identifiants.mjs` (`:207`), extraits dans `<git-common-dir>/boucle-outils`. Rien d'autre n'y est : ni `scripts/verify/`, ni `scripts/docs/` hors la grammaire, ni `node_modules`, ni `docs/`, ni `anchorpost/`.
- `skills/chaine/fusionner/scripts/identifiant.mjs:27-29` : la grammaire des identifiants cherchée en trois endroits (`../docs/`, à côté, puis dans le plugin). Le calcul fait de même.
- `skills/chaine/fusionner/scripts/revue-exigee.mjs:70` (`cheminLu`, les guillemets de `git diff --name-only`), `:165` (`lireGit`, la lecture d'une réf).
- `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs:52-53`, `:73`, `:104`, `:134` (ci-dessous).
- `skills/chaine/tickets/references/gabarits/regle.md:20-21` (les clés `code` et `criticality` du gabarit), `skills/chaine/criticite/SKILL.md:21` et `:58` (le pivot, les formes de `criticality`), `skills/chaine/anchorpost/references/rules/anchorpost.md:23` et `:43` (« Une règle est un fichier », « Le manifeste et l'index »).
- `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs:34`, `:80-82` : le seul lecteur de l'index du plugin (`rules[].key`, `rules[].code`, schéma "2").
- `skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs` : `lireIdentifiant`, `dossierDuContexte`, `fichierDuTicket`, `estArchive`, `identifiantDeBranche`.
- `scripts/poses.test.mjs:14-22`, `:49`, `:75` ; `scripts/points-d-entree.test.mjs:17-27` ; `scripts/depot.test.mjs:1032-1041` ; `skills/chaine/fusionner/SKILL.md:14` ; `README.md:169`, `:188`.
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

1. **Le fichier vit dans `fusionner/scripts/`**, que `fusionner poser` copie dans `scripts/chaine/` d'un projet : c'est de là, une fois dans `develop`, que la boucle le reprend. Un projet qui n'a pas reposé ne l'a pas ; ses appelants (lots 4 et 5a) en répondent.
2. **Il ne lit jamais l'arbre de travail.** La copie est sous `.git`, hors du dépôt : `new URL('../..', import.meta.url)`, l'idiome de `contexte-ticket.mjs`, y désignerait la copie. Et l'arbre de travail du capitaine est sur une autre branche que la PR jugée. Tout se lit dans des objets git, par `git` lancé depuis le dossier courant : `rev-parse`, `ls-tree`, `cat-file --batch`.
3. **Il n'importe que `node:*` et la grammaire** `scripts/docs/identifiants.mjs`, que la copie porte. Ni `yaml`, ni `zod`, ni un script de `scripts/verify/` ou de `scripts/docs/` (le lecteur de la ligne `Relecture:` du gate `tickets`, celui de `mutation-regles.mjs`) : ils n'y sont pas. D'où un lecteur d'en-tête YAML écrit ici, pour trois clés.
4. **C'est la version de `develop` qui juge**, sous-PR d'un sujet plus ancien comprise : le lecteur accepte donc ce qu'un sujet en retard porte encore (un index au pivot 2, la forme nue de `criticality`), et les données, elles, se lisent sur les réfs qu'on lui nomme, jamais sur `develop` d'office.

### Ce que ce lecteur partage avec `contexte-ticket.mjs`, et ce qu'il ne partage pas

Il partage **la grammaire** (`identifiants.mjs` : aucun des deux n'écrit un motif d'identifiant), **la convention du chemin d'une règle** (`docs/metier/regles/<dossier du contexte>/<identifiant>.md`, `contexte-ticket.mjs:134`), **la recherche du fichier d'un ticket** par `fichierDuTicket` hors archive, et **la limite de l'en-tête d'un ticket** (avant la première section `## `, `:104`).

Il ne partage **aucun code** : `contexte-ticket.mjs` s'exécute à l'import, n'exporte rien, lit le disque depuis la racine qu'il déduit de son propre chemin (`:52-53`, `:73`), et rend un fichier de règle sans lire son en-tête. Ici tout se lit sur une réf, l'en-tête est lu, et la ligne `Règles:` du ticket ne l'est pas (décision 4).

## Décisions

Tenues de la spec : `A-82`, `A-90`, `A-106` (les lectures), `A-108` (les règles de `main`), `A-109` (fichiers neufs seuls). **Sept points sont proposés par ce ticket** là où la spec ne tranche pas (décisions 6, 8, 9, 10, 11, 12 et 13) : ils sont repris un à un dans « Ce qui n'a pas été établi », et l'architecte les confirme ou les change avant le lancement.

1. **Un fichier, un nom.** `skills/chaine/fusionner/scripts/double-relecture.mjs`, posé `scripts/chaine/double-relecture.mjs`. Aucun fichier de ce nom dans les quatre dossiers que `scripts/poses.test.mjs` pose au même endroit (il refuse un nom posé deux fois).
2. **L'appel.**

   ````bash
   git -c core.quotePath=false diff --no-renames --name-only <départ> <sommet> \
     | node scripts/chaine/double-relecture.mjs --base <réf> --tete <réf> [--branche <branche de tête>]
   ````

   - **Entrée standard** : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only` les écrit, guillemets de git compris. C'est l'appelant qui choisit le diff : celui que la relecture lit (`A-76`, `A-78`), que ce calcul ne recalcule pas.
   - `--base` : la cible de la PR (`origin/develop`, `origin/sujet/<nom>`), **que l'appelant vient de relire** par un refspec explicite (`A-106`). `--tete` : le sommet jugé, un sha ou une réf présente dans le dépôt.
   - `--branche` : le nom de la branche de tête de la PR. Le ticket de la PR s'en déduit par `identifiantDeBranche` (`A-82` : « par l'identifiant du ticket de sa branche ») ; une branche `sujet/…`, une branche sans ticket, ou pas d'option : la PR n'a pas de ticket.
   - En module : `doubleRelecture({ fichiers, base, tete, ticket, lecteur })` rend `{ reponse, causes, illisibles, remarques }` ; `lecteur` est le lecteur git par défaut, remplacé par des arbres en mémoire dans le banc.
3. **Les sorties.** Première ligne de la sortie standard : `exigée`, `non exigée` ou `illisible`. Puis une ligne par cause, quatre champs séparés par une tabulation : la règle (ou le ticket), le motif (`fichier`, `code`, `Relecture: double`), le chemin, la réf où c'est lu. Puis une ligne `# illisible : …` par lecture en échec et une ligne `# …` par remarque.

   | Sortie | Sens |
   | --- | --- |
   | 0 | « non exigée » |
   | 20 | « exigée » |
   | 21 | « illisible » |
   | 22 | usage (rien sur la sortie standard) |

   Aucun de ces codes n'est pris dans la chaîne : `passer.sh`, `sujet.sh`, `boucle.sh`, `veille.sh` et `github.sh` emploient 0 à 12, 64, 69, 130 et 143 ; un code qui remonterait d'un appelant ne se confond avec aucun (`A-108`). **Qui appelle ne lit « non exigée » que sur la sortie 0 et la première ligne ensemble** ; tout autre code, un plantage de `node` (sortie 1) compris, se lit « illisible ».
4. **« Touche »** est ce qu'`A-82` écrit, et rien de plus : (a) le ticket de la PR porte `Relecture: double` ; (b) un fichier du diff est le fichier d'une règle haute ; (c) un fichier du diff est nommé par le champ `code` d'une règle haute. **La ligne `Règles:` du ticket n'est pas lue** : la spec fait passer ce lien par le gate `tickets`, qui exigera `Relecture: double` sur un ticket ouvert citant une règle haute (`A-90`, lot 5c). Tant que ce gate n'est pas posé, une PR dont le ticket cite une règle haute sans champ `code`, sans la ligne, et dont le diff ne touche pas le fichier de la règle, n'a qu'une relecture : le banc le fige, pour que le jour où l'on voudra le changer soit un geste voulu.
5. **Deux réfs, jamais l'arbre de travail.** Une règle compte si elle est haute sur la base **ou** sur la tête. La base est la cible telle que l'appelant vient de la relire, pas la base de fusion : c'est ce qui fait voir une règle montée à haute par une autre PR après le verdict (`A-90`). La tête fait voir la PR qui monte elle-même une règle.
6. **Avec un index** sur la réf : `criticality.level` de l'entrée de `rules`, par sa `key` ; `code` et `validation.status` de la même entrée. Schéma `"2"` ou `"3"`. **Tout autre schéma est « illisible »** (proposé) : un pivot que ce lecteur ne connaît pas ne se devine pas, et sa forme a pu changer.
7. **Sans index** sur la réf : l'en-tête de chaque fichier de règle de la réf, sous les deux formes de `criticality`. Une criticité reçue d'une feature n'est pas vue : limite écrite de la spec. Ni index ni fichier de règle : aucune règle haute, « non exigée » (un projet sans règles métier).
8. **Avec un index, l'en-tête des fichiers de règle que le diff touche est lu en plus, et le plus haut gagne** (proposé). Sans cela, la parenthèse d'`A-82` (« une PR qui monte elle-même une règle à haute est vue ») ne tient que si la PR a régénéré son index ; or c'est le capitaine qui régénère à la fusion. Ainsi une règle montée, créée haute, ou dont le `code` change dans la PR est vue par son fichier, index périmé ou non.
9. **Le fichier d'une règle** est `docs/metier/regles/<dossier du contexte>/<identifiant>.md`, à la racine du dépôt (proposé : la spec dit « le fichier d'une règle » sans dire où). Un homonyme ailleurs n'en est pas un : les dépôts jouets d'un projet en portent (`apps/…/fixtures/…/docs/metier/regles/all/RULE_….md`). Un chemin de règles hors convention, déclaré au manifeste Anchorpost (`contexts[].rules`), n'est pas reconnu : limite.
10. **Une entrée de `code` nomme un fichier, ou un dossier** (proposé) : le chemin du diff lui est égal, ou est dessous. Le gabarit dit « fichiers de code », le schéma dit une liste de textes, la CLI vérifie seulement que le chemin existe.
11. **Une règle `rejected` ou `obsolete` ne compte pas** (proposé : la spec n'en dit rien). Lu sur chaque réf : la PR qui rejette une règle haute est vue par la base, où elle est encore en vigueur. Une règle `candidate` compte.
12. **La ligne `Relecture:`** se lit dans l'en-tête du ticket, sur la base, à la forme que le ticket 55 fixe (`Relecture: double`, un commentaire ` # …` pouvant suivre). Proposé, pour ce que la spec ne dit pas : une ligne d'une autre valeur est « illisible » (le gate la refusera une fois le ticket 55 entré, elle ne se devine pas) ; un ticket que la base ne porte pas donne une remarque et aucune cause (la PR ne s'ajoute ni ne se retire la ligne : seule la base est lue) ; un ticket archivé n'est pas lu ; deux fichiers pour un même ticket : « illisible ».
13. **« Illisible » n'est jamais « non exigée », et une cause établie suffit** (proposé pour la seconde moitié). Chaque lecture (les lignes du diff, le ticket, la base, la tête) est jouée à part ; une réf introuvable, un index qui n'est pas du JSON ou d'un autre schéma, un en-tête que le lecteur ne comprend pas, une ligne du diff mal citée sont des lectures en échec. Si une cause est établie malgré elles, la réponse est « exigée », et les échecs sont dits ; sinon, un seul échec donne « illisible ».
14. **Le lecteur d'en-tête ne lit que trois clés de premier niveau** (`criticality`, `code`, `validation`) et refuse ce qu'il ne comprend pas : pas d'en-tête, une clé écrite deux fois, une ligne de première colonne qui n'est ni une clé ni un commentaire, un niveau hors `low`, `medium`, `high`, un `code` qui n'est pas une liste. Il lit la forme nue, le bloc, le mappage et la liste en ligne, même pliés sur plusieurs lignes par un formateur ; une clé imbriquée (`extensions.<projet>.criticality`) ou commentée n'est pas la clé. Un statut qu'il ne comprend pas laisse la règle en vigueur. **Lecture en temps linéaire** : l'en-tête d'une PR est une entrée que son auteur écrit.
15. **Aucun import d'un autre script de la chaîne.** `cheminDuDiff` est la copie de `cheminLu` de `revue-exigee.mjs`, un fichier que deux tickets de l'autre programme récrivent (16 et 18) ; le banc garde la parité, comme `revue-exigee.test.mjs` le fait pour `regexDuMotif`.
16. **Fichiers neufs seuls** (`A-109`). Ne sont pas touchés, et le ticket le dit pour qui les écrira : la ligne du calcul dans `fusionner/references/CONTENU.md` et dans `scripts/points-d-entree.test.mjs` (la spec : « au plus tard avec 3d ») ; la liste de l'étape 0 de `fusionner/SKILL.md:14`, qui nomme un à un les `.mjs` qu'un projet copie (`A-111` : « le premier lot qui appelle ces modules depuis un script posé (lot 4 ou 5a) y écrit leur ligne » ; la phrase vise les deux modules du lot 3a, la même règle est prise ici pour ce fichier) ; et l'arbre du `README.md:169`, que la spec ne nomme pas. Aucun test de `main` n'exige qu'un script de `fusionner/scripts/` soit listé quelque part (suite jouée avec les deux fichiers : verte) ; `commits-a-relire.mjs`, autre ligne de commande du même dossier, n'est pas non plus dans `points-d-entree.test.mjs`. En attendant, **le banc prouve lui-même le point d'entrée** (lien symbolique, `--preserve-symlinks-main`, dossier à espace et à accent), et **la note de version dit le geste** : l'étape 0 fait suivre tous les `*.test.mjs`, donc à la repose d'un projet le banc partirait sans son module, et tomberait à l'import.
17. **Banc court** : 22 tests, environ 1,5 s sur le poste d'essai ; le calcul se joue sur des arbres en mémoire, quatre tests seulement montent un dépôt git. Il est rejoué, posé à plat, par `scripts/poses.test.mjs` (plafond de 600 s pour l'ensemble, `:75`) : il ne lit jamais l'arbre du plugin, et prend la grammaire là où le module l'a trouvée (`GRAMMAIRE`).
18. **Version : mineure** (7.18.1 → **7.19.0** sur `22b2d49`) : un script de plus dans un skill. **Règle de repli** : les tickets 58 et 59 prennent une version en même temps. Si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, remonte sa note en tête avec ce numéro, puis vérifie (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`).
19. **`Label: contre-revue`** : le fichier se pose sous `scripts/chaine/`, chemin sensible du gabarit de `.claude/chaine.json`, et il gardera l'entrée des PR. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): double relecture exigée, un calcul et son lecteur de règles et d'index (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Lire la ligne `Règles:` du ticket** pour exiger la double relecture dès qu'elle cite une règle haute : ce n'est pas ce qu'`A-82` écrit, et le lien passe par le gate (`A-90`). Le trou est décrit (décision 4, « Ce qui n'a pas été établi », point 2) ; le fermer ici serait une quinzaine de lignes, sur décision de l'architecte.
- **Une bibliothèque YAML**, ou le schéma de la CLI : la copie de la boucle n'a aucune dépendance.
- **Importer `cheminLu` de `revue-exigee.mjs`**, ou le lecteur de `Relecture:` du gate `tickets` : le premier est dans un fichier que l'autre programme récrit, le second n'est pas dans la copie de la boucle.
- **Lire tous les en-têtes même avec un index** : plus d'un millier de fichiers sur un dépôt réel, à chaque PR et à chaque réveil du Relecteur, pour un gain nul (l'index porte déjà le niveau de la règle et celui qu'elle reçoit d'une feature).
- **Ne lire que l'index quand il existe** : une PR qui monte une règle sans régénérer son index ne serait pas vue (décision 8).
- **Ajouter d'office `origin/develop` à la base d'un sujet**, comme `lireBase` le fait pour le contrat : la spec dit « sur la base et sur la tête » ; signalé, non fait (point 6).
- **Recevoir le ticket en argument** : deux appelants le déduiraient chacun à sa façon (`ticketDeLaPr` lit d'abord le titre). Le calcul le déduit lui-même, de la branche seule.
- **Calculer le diff dans le calcul** : le diff relu n'est pas le même pour une sous-PR, une PR vers `develop` et une PR de mise à jour (`sujet.sh a-juger`, ticket 16 de l'autre programme) ; c'est l'appelant qui le sait.
- **Les sorties 1 et 2** de la famille des `.mjs` du plugin (refus, usage) : 2 est « conflit » et 1 un échec quelconque pour les scripts du capitaine qui l'appelleront.
- **Répondre « illisible » dès qu'une lecture échoue**, même avec une cause établie : la réponse ne peut plus monter, et la PR resterait bloquée pour rien.

## À faire, dans l'ordre

### § 0 — Partir de `main`

`git fetch origin main`, une branche depuis `origin/main`. Relever la version de `.claude-plugin/plugin.json` : si ce n'est plus 7.18.1, la version et la note du § 3 suivent la règle de repli (décision 18).

### § 1 — Le banc d'abord, vu rouge

Créer `skills/chaine/fusionner/scripts/double-relecture.test.mjs`, tel quel. Le lancer : `node --test skills/chaine/fusionner/scripts/double-relecture.test.mjs` échoue à l'import, le module n'existe pas.

**Les cas, un par un.** Le calcul se joue sur deux arbres en mémoire, `origin/develop` (la base) et `tete` ; `R16` est `docs/metier/regles/all/RULE_ALL_FAC-16.md`, `CODE` est `apps/api/src/facture/total.ts`, le ticket est `SPEC_ALL_FAC-1.03`.

| n° | Montage | Fichiers du diff | Attendu |
| --- | --- | --- | --- |
| 1 | index (pivot 3) : `RULE_ALL_FAC-16` `high`, `code: [CODE]` ; `RULE_ALL_FAC-17` `medium` | `R16` | « exigée », cause `RULE_ALL_FAC-16 · fichier · R16 · origin/develop` |
| 1 bis | le même | `README.md`, `CODE` | « exigée », cause `RULE_ALL_FAC-16 · code · CODE · origin/develop` |
| 1 ter | le même | un voisin de `CODE`, `README.md` | « non exigée » |
| 2 | index : la règle `high` par `origin: feature`, son fichier sans `criticality` | `CODE` | « exigée » ; le même arbre sans index : « non exigée » (limite écrite) |
| 3 | index (pivot 2) : une règle `low`, une `medium` avec `code: [CODE]`, une sans `criticality` | les deux fichiers de règle, `CODE` | « non exigée », aucune cause, aucun échec |
| 4 | **montée après le verdict** (`A-90`) : la tête dit `medium` ; base d'avant, `medium` ; base d'après, `high` | `CODE` | base d'avant : « non exigée » ; base d'après, mêmes fichiers, même tête : « exigée », cause lue sur `origin/develop` |
| 5 | la PR monte elle-même la règle : base `medium`, tête `high`, index régénéré, puis index périmé (celui de la base) | `R16` | « exigée » dans les deux cas, cause lue sur `tete` |
| 5 bis | règle neuve et haute dans la tête, absente de l'index, avec son `code` | son fichier, `CODE` | « exigée », deux causes, `fichier` puis `code` |
| 5 ter | la PR baisse une règle haute, ou supprime son fichier | `R16` | « exigée » : la base la dit haute |
| 6 | règle haute `rejected`, puis `obsolete`, avec et sans index | `R16`, `CODE` | « non exigée » |
| 6 bis | base : haute et en vigueur ; tête : la même, `rejected` ou `obsolete` | `R16` | « exigée » |
| 6 ter | règle `candidate`, haute, sans index | `R16` | « exigée » |
| 7 | **projet sans index**, quatre écritures : nue ; bloc avec commentaire ; mappage en ligne dont la raison porte une virgule ; entre guillemets. `code` en liste d'une ligne, avec un dossier | `R16`, puis `CODE`, puis un fichier du dossier | « exigée » chaque fois ; un fichier d'une règle moyenne et un voisin du dossier : « non exigée » |
| 7 bis | ni index ni règle | `apps/api/src/main.ts` | « non exigée » |
| 8 | la vraie règle haute dans l'arbre ; ses homonymes sous `apps/…/fixtures/…`, dans le dossier d'un autre contexte, et un `notes.md` du dossier des règles ; avec et sans index | chaque homonyme, seul | « non exigée » |
| 9 | **index illisible** : JSON coupé ; schéma "1" ; schéma "4" ; sans `rules` ; `criticality.level` inconnu ; `code` qui n'est pas une liste | `README.md` | « illisible », deux échecs (la base et la tête), le motif nommé |
| 9 bis | en-tête `criticality: haute`, sans index | `README.md` | « illisible », l'échec nomme la réf, le fichier et la valeur |
| 9 ter | la tête n'existe pas ; une ligne du diff citée et non refermée | `README.md` | « illisible » |
| 10 | base : règle haute et son `code` ; tête : index qui n'est pas du JSON | `CODE` | « exigée », et l'échec de la tête écrit en `# illisible : …` |
| 11 | **`Relecture: double` écrite à la main** dans l'en-tête du ticket, sur la base, avec un commentaire | `README.md`, ticket `SPEC_ALL_FAC-1.03` | « exigée », cause `SPEC_ALL_FAC-1.03 · Relecture: double · <fichier du ticket> · origin/develop` |
| 11 bis | le même montage, **PR sans ticket**, puis PR du ticket `.04` | `README.md` | « non exigée » |
| 11 ter | la ligne dans le corps du ticket, après `## Le besoin` | `README.md` | « non exigée » |
| 11 quater | la PR retire la ligne de son ticket ; la PR l'ajoute | le fichier du ticket | retirée : « exigée » (la base la porte) ; ajoutée : « non exigée » (lue une fois entrée dans la base) |
| 12 | `Relecture: triple`, `Double`, `double, puis simple`, vide ; puis deux fichiers pour le ticket | `README.md` | « illisible » |
| 12 bis | ticket absent de la base ; ticket dans `issues/archive/` avec la ligne | `README.md` | « non exigée », remarque « ticket … absent de origin/develop : aucune ligne `Relecture:` lue » |
| 13 | **ticket qui cite la règle haute en `Règles:`**, sans `Relecture: double` ; règle sans champ `code` ; puis **ticket sans ligne `Règles:`** | `CODE` | « non exigée » dans les deux cas (décision 4) |

Puis les lecteurs (l'en-tête : sept écritures lues, quatorze refusées ; trois en-têtes hostiles de 300 000 caractères en moins de 2 s ; l'index aux deux pivots ; les lignes du diff, en parité avec `revue-exigee.mjs` ; les arguments) et, sur un dépôt git jouet, la ligne de commande lancée **depuis une copie des outils faite comme celle de la boucle** (`scripts/chaine/double-relecture.mjs` et `scripts/docs/identifiants.mjs`, rien d'autre, hors du dépôt), l'arbre de travail du dépôt disant le contraire des réfs (règle basse, index supprimé) : sorties 20, 0, 21, 22, un chemin que git cite, hors de tout dépôt, le ticket lu dans le nom de la branche, le point d'entrée par un lien symbolique.

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

/** Un lecteur sur des arbres en mémoire : `{ <réf>: { <chemin>: <texte> } }`. */
const lecteur = (refs) => ({
  verifier(ref) {
    if (!(ref in refs)) throw new Illisible(`référence ${ref} introuvable`);
  },
  lister: (ref, prefixe) => Object.keys(refs[ref]).filter((p) => p === prefixe || p.startsWith(prefixe)),
  lire: (ref, chemins) => new Map(chemins.map((c) => [c, refs[ref][c]])),
});
/** Le calcul sur deux arbres ; `tete` vaut `base` quand la PR ne change ni règle ni index. */
const juger = (fichiers, base, tete = base, ticketDeLaPr = null) =>
  doubleRelecture({ fichiers, base: 'origin/develop', tete: 'tete', ticket: ticketDeLaPr, lecteur: lecteur({ 'origin/develop': base, tete }) });
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
  const r = juger([CODE], apres, avant);
  assert.equal(r.reponse, EXIGEE, 'la tête de la PR dit encore « moyenne » : la base relue fait foi');
  assert.deepEqual(causes(r), [`RULE_ALL_FAC-16 · code · ${CODE} · origin/develop`]);
});

test("une PR qui monte elle-même une règle à haute est vue sur sa tête, même si elle n'a pas régénéré l'index", () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'medium' })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: MOYENNE }) };
  const regenere = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]), [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC }) };
  const perime = { [INDEX]: base[INDEX], [R16]: regenere[R16] };
  assert.deepEqual(causes(juger([R16], base, regenere)), [`RULE_ALL_FAC-16 · fichier · ${R16} · tete`]);
  assert.deepEqual(causes(juger([R16], base, perime)), [`RULE_ALL_FAC-16 · fichier · ${R16} · tete`], "index périmé : l'en-tête du fichier touché est lu en plus");
  // Une règle neuve, haute, que l'index de la tête ne connaît pas encore, avec son code dans la même PR.
  const neuve = { ...base, [R17]: regle('RULE_ALL_FAC-17', { criticite: HAUTE_NUE, code: CODE_BLOC }) };
  assert.deepEqual(causes(juger([R17, CODE], base, neuve)), [`RULE_ALL_FAC-17 · fichier · ${R17} · tete`, `RULE_ALL_FAC-17 · code · ${CODE} · tete`]);
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
    const r = juger(['README.md'], { [INDEX]: contenu, [R16]: haute });
    assert.equal(r.reponse, ILLISIBLE, nom);
    assert.equal(r.illisibles.length, 2, `${nom} : la base et la tête`);
    assert.match(r.illisibles[0], attendu, nom);
  }
  const enTete = juger(['README.md'], { [R16]: regle('RULE_ALL_FAC-16', { criticite: 'criticality: haute\n' }) });
  assert.equal(enTete.reponse, ILLISIBLE);
  assert.match(enTete.illisibles[0], /^origin\/develop:docs\/metier\/regles\/all\/RULE_ALL_FAC-16\.md : criticité « haute »/);
  const sansTete = doubleRelecture({ fichiers: ['README.md'], base: 'origin/develop', tete: 'tete', lecteur: lecteur({ 'origin/develop': {} }) });
  assert.deepEqual([sansTete.reponse, sansTete.illisibles], [ILLISIBLE, ['référence tete introuvable']]);
  const cite = juger(['"docs/m\\303\\251tier', 'README.md'], {});
  assert.equal(cite.reponse, ILLISIBLE);
  assert.match(cite.illisibles[0], /ligne du diff illisible/);
});

test('une cause établie suffit : une lecture en échec à côté ne retire pas « exigée », et reste dite', () => {
  const base = { [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high', code: [CODE] })]) };
  const r = juger([CODE], base, { [INDEX]: '{' });
  assert.equal(r.reponse, EXIGEE);
  assert.equal(r.illisibles.length, 1);
  assert.match(texte(r), /^exigée\nRULE_ALL_FAC-16\tcode\tapps\/api\/src\/facture\/total\.ts\torigin\/develop\n# illisible : anchorpost\/anchorpost\.json n'est pas du JSON\n$/);
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
    assert.deepEqual([r.reponse, r.remarques], [NON_EXIGEE, ['ticket SPEC_ALL_FAC-1.03 absent de origin/develop : aucune ligne `Relecture:` lue']]);
  }
});

test("la ligne `Règles:` du ticket n'est pas lue : un ticket qui cite une règle haute sans `Relecture: double`, et dont le diff ne touche ni la règle ni son code, n'exige rien", () => {
  const arbre = {
    [INDEX]: index([entree('RULE_ALL_FAC-16', { niveau: 'high' })]),
    [R16]: regle('RULE_ALL_FAC-16', { criticite: HAUTE_BLOC }),
    [TICKET]: ticket('Règles: RULE_ALL_FAC-16\n'),
  };
  assert.equal(juger([CODE], arbre, arbre, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, 'règle haute sans champ `code` : limite écrite de la spec');
  assert.equal(juger([CODE], { ...arbre, [TICKET]: ticket() }, arbre, 'SPEC_ALL_FAC-1.03').reponse, NON_EXIGEE, 'ticket sans ligne `Règles:`');
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
function lancer(script, args, { cwd, entree: input = '', options = [] }) {
  const r = spawnSync(process.execPath, [...options, script, ...args], { cwd, input, encoding: 'utf8', env: ENV_PROPRE, timeout: 30_000 });
  return { code: r.status, sortie: r.stdout, erreur: r.stderr };
}

test("en ligne de commande, depuis la copie des outils de la boucle : les réfs sont lues, jamais l'arbre de travail ; sorties 0, 20, 21, 22", () => {
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
  assert.deepEqual([usage.code, usage.sortie], [22, '']);
  assert.match(usage.erreur, /^usage : git diff --name-only … \| node double-relecture\.mjs --base <réf> --tete <réf> \[--branche <branche de tête>\]\n$/);
});

test('le ticket se lit dans le nom de la branche de tête, et sa ligne sur la base', () => {
  const { depot, tete } = depotJouet();
  const script = copieDesOutils();
  g(depot, 'checkout', '-q', '-f', 'develop');
  const base = commit(depot, { [TICKET]: ticket('Relecture: double\n'), [INDEX]: index([]) }, 'docs: relecture double');
  const args = ['--base', base, '--tete', tete];
  const avec = lancer(script, [...args, '--branche', BRANCHE], { cwd: depot, entree: 'README.md\n' });
  assert.deepEqual([avec.code, avec.sortie], [20, `exigée\nSPEC_ALL_FAC-1.03\tRelecture: double\t${TICKET}\t${base}\n`]);
  for (const branche of ['docs/une-note', 'sujet/spec-all-fac-1-03']) assert.equal(lancer(script, [...args, '--branche', branche], { cwd: depot, entree: 'README.md\n' }).code, 0, branche);
  assert.equal(lancer(script, args, { cwd: depot, entree: 'README.md\n' }).code, 0, 'sans --branche');
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

Créer le fichier, tel quel. Le banc du § 1 devient vert, 22 sur 22.

````js
#!/usr/bin/env node
// =============================================================================
// « Double relecture exigée », un seul calcul pour le Relecteur et pour le capitaine.
//
// Une PR exige deux relectures indépendantes quand son ticket porte la ligne `Relecture: double`, ou quand son
// diff touche le fichier d'une règle de criticité haute ou un fichier que le champ `code` de cette règle nomme.
//
//   git diff --name-only … | node scripts/chaine/double-relecture.mjs --base <réf> --tete <réf> [--branche <branche de tête>]
//
// Entrée standard : les fichiers changés de la PR, un par ligne, tels que `git diff --name-only` les écrit.
// `--base` : la cible de la PR, relue par qui appelle (`origin/develop`, `origin/sujet/<nom>`). `--tete` : son
// sommet (un sha ou une réf). `--branche` : le nom de sa branche de tête, d'où se lit son ticket ; sans elle, ou
// sans ticket dans ce nom, la PR n'a pas de ticket.
//
// Tout se lit dans des objets git, jamais dans l'arbre de travail : ce fichier tourne depuis la copie des outils
// que la boucle du capitaine reprend d'origin/develop, hors du dépôt, avec `scripts/chaine` et
// `scripts/docs/identifiants.mjs` pour tout bagage. Aucune dépendance : l'en-tête YAML d'une règle est lu ici,
// pour trois clés seulement (`criticality`, `code`, `validation`), et ce que ce lecteur ne comprend pas est
// « illisible », jamais « non exigée ».
//
// Le niveau d'une règle se lit sur la base ET sur la tête. Dans l'index Anchorpost de la réf
// (`anchorpost/anchorpost.json`, schéma "2" ou "3") : `criticality.level` de l'entrée de `rules` dont la `key`
// est l'identifiant de la règle, le niveau effectif, criticité reçue d'une feature comprise ; ses fichiers de
// code dans `code`, son statut dans `validation.status`. Sans index : dans l'en-tête de chaque fichier de règle
// (`docs/metier/regles/<ctx>/<RULE_…>.md`), qui ne voit pas une criticité reçue d'une feature. Avec un index,
// l'en-tête des fichiers de règle que le diff touche est lu en plus, et le plus haut gagne : un index que la PR
// n'a pas régénéré ne cache pas une règle qu'elle monte. Une règle `rejected` ou `obsolete` ne compte pas.
//
// Sortie standard : `exigée`, `non exigée` ou `illisible` en première ligne ; puis une ligne par cause
// (`<règle ou ticket>\t<fichier | code | Relecture: double>\t<chemin>\t<réf>`), puis une ligne `# …` par lecture
// en échec ou remarque. Une cause établie suffit : « illisible » n'est rendu que si aucune ne l'est.
// Sorties : 0 non exigée · 20 exigée · 21 illisible · 22 usage. Qui appelle ne lit « non exigée » que sur la
// sortie 0 ET la première ligne ; tout autre code (un plantage de node sort en 1) se lit « illisible ».
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXIGEE = 'exigée';
export const NON_EXIGEE = 'non exigée';
export const ILLISIBLE = 'illisible';
export const SORTIES = { [NON_EXIGEE]: 0, [EXIGEE]: 20, [ILLISIBLE]: 21, usage: 22 };
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
/** Lecteur d'objets git du dépôt `cwd` : `verifier(ref)`, `lister(ref, prefixe)` → chemins, `lire(ref, chemins)` → Map chemin → texte. */
export function lecteurGit(cwd = process.cwd()) {
  const git = (args, input) => execFileSync('git', args, { cwd, input, maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] });
  return {
    verifier(ref) {
      // Une réf qui commence par un tiret serait lue par git comme une option.
      if (typeof ref !== 'string' || ref.startsWith('-')) illisible(`référence ${ref} refusée`);
      try {
        git(['rev-parse', '--verify', '-q', `${ref}^{commit}`]);
      } catch {
        illisible(`référence ${ref} introuvable`);
      }
    },
    lister(ref, prefixe) {
      try {
        return git(['ls-tree', '-r', '-z', '--name-only', ref, '--', prefixe]).toString('utf8').split('\0').filter(Boolean);
      } catch {
        illisible(`arbre de ${ref} illisible`);
      }
    },
    lire(ref, chemins) {
      const textes = new Map();
      if (chemins.length === 0) return textes;
      let brut;
      try {
        brut = git(['cat-file', '--batch'], chemins.map((c) => `${ref}:${c}\n`).join(''));
      } catch {
        illisible(`objets de ${ref} illisibles`);
      }
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

/** Les règles hautes et en vigueur d'une réf : Map clé comparable → `{ cle, code }`. */
function hautes(ref, touchees, lecteur) {
  lecteur.verifier(ref);
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
  return new Map([...regles].filter(([, r]) => r.niveau === 'high' && r.enVigueur));
}

/** Les causes que la ligne `Relecture:` du ticket donne, lue dans son en-tête sur la base. */
function causesDuTicket(ticket, base, lecteur, remarques) {
  const motif = G.fichierDuTicket(ticket) ?? illisible(`${ticket} n'est pas un identifiant de ticket`);
  lecteur.verifier(base);
  const fichiers = lecteur.lister(base, 'docs/').filter((p) => motif.test(`/${p}`) && !G.estArchive(`/${p}`));
  if (fichiers.length > 1) illisible(`${fichiers.length} fichiers pour le ticket ${ticket} sur ${base} : ${fichiers.join(', ')}`);
  if (fichiers.length === 0) {
    remarques.push(`ticket ${ticket} absent de ${base} : aucune ligne \`Relecture:\` lue`);
    return [];
  }
  const lignes = lecteur.lire(base, fichiers).get(fichiers[0]).split(/\r?\n/);
  const fin = lignes.findIndex((l) => /^## /.test(l));
  const valeurs = (fin === -1 ? lignes : lignes.slice(0, fin)).map((l) => /^Relecture\s*:\s*(.*)$/.exec(l)?.[1]).filter((v) => v !== undefined);
  for (const v of valeurs)
    if (scalaire(v) !== 'double') illisible(`${base}:${fichiers[0]} : ligne \`Relecture:\` « ${v.trim()} », seule valeur \`double\``);
  return valeurs.length ? [{ sujet: ticket, motif: 'Relecture: double', chemin: fichiers[0], ref: base }] : [];
}

/**
 * La PR exige-t-elle deux relectures ? `fichiers` : les lignes de `git diff --name-only` ; `base`, `tete` : les réfs
 * lues ; `ticket` : l'identifiant du ticket de la PR, ou rien. Rend `{ reponse, causes, illisibles, remarques }`.
 */
export function doubleRelecture({ fichiers, base, tete, ticket = null, lecteur = lecteurGit() }) {
  const causes = [];
  const illisibles = [];
  const remarques = [];
  const essayer = (lecture) => {
    try {
      lecture();
    } catch (e) {
      if (!(e instanceof Illisible)) throw e;
      illisibles.push(e.message);
    }
  };
  if (!G) return { reponse: ILLISIBLE, causes, illisibles: [`scripts/docs/identifiants.mjs introuvable depuis ${ICI}`], remarques };
  let chemins = [];
  essayer(() => {
    chemins = fichiers.filter((f) => f.trim() !== '').map((f) => ({ ecrit: f.trim(), lu: cheminDuDiff(f) }));
  });
  if (ticket) essayer(() => causes.push(...causesDuTicket(ticket, base, lecteur, remarques)));
  const touchees = new Set(chemins.map((c) => regleDuChemin(c.lu)).filter(Boolean));
  for (const ref of [base, tete])
    essayer(() => {
      const regles = hautes(ref, touchees, lecteur);
      const parCode = new Map();
      for (const r of regles.values())
        for (const p of r.code) {
          const dossier = comparable(p.trim().replace(/^\.\//, '').replace(/\/+$/, ''));
          parCode.set(dossier, [...(parCode.get(dossier) ?? []), r.cle]);
        }
      for (const c of chemins) {
        const regle = regles.get(regleDuChemin(c.lu));
        if (regle) causes.push({ sujet: regle.cle, motif: 'fichier', chemin: c.ecrit, ref });
        // Le chemin lui-même, puis chacun de ses dossiers : une entrée de `code` peut nommer un dossier.
        for (let p = c.lu; p !== ''; p = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')
          for (const cle of parCode.get(p) ?? []) causes.push({ sujet: cle, motif: 'code', chemin: c.ecrit, ref });
      }
    });
  // Une cause par (règle ou ticket, motif, chemin) : la base d'abord.
  const vues = new Set();
  const uniques = causes.filter((c) => {
    const k = `${c.sujet}\t${c.motif}\t${c.chemin}`;
    return !vues.has(k) && vues.add(k);
  });
  const reponse = uniques.length ? EXIGEE : illisibles.length ? ILLISIBLE : NON_EXIGEE;
  return { reponse, causes: uniques, illisibles, remarques };
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

export function lireArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const cle = argv[i];
    const valeur = argv[i + 1];
    if (!['--base', '--tete', '--branche'].includes(cle) || valeur === undefined || valeur === '' || cle.slice(2) in options) return null;
    options[cle.slice(2)] = valeur;
  }
  return options.base && options.tete ? options : null;
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
  if (!options) {
    process.stderr.write('usage : git diff --name-only … | node double-relecture.mjs --base <réf> --tete <réf> [--branche <branche de tête>]\n');
    process.exitCode = SORTIES.usage;
  } else {
    let resultat;
    try {
      const fichiers = readFileSync(0, 'utf8').split('\n');
      const ticket = options.branche && G ? G.identifiantDeBranche(options.branche) : null;
      resultat = doubleRelecture({ fichiers, base: options.base, tete: options.tete, ticket });
    } catch (e) {
      resultat = { reponse: ILLISIBLE, causes: [], illisibles: [`${e?.message ?? e}`], remarques: [] };
    }
    process.stdout.write(texte(resultat));
    process.exitCode = SORTIES[resultat.reponse];
  }
}
````

### § 3 — La version et la note

`.claude-plugin/plugin.json:3` : `"version": "7.18.1"` devient `"version": "7.19.0"` (règle de repli : décision 18).

`NOTES-DE-VERSION.md` : cette note, entre le paragraphe d'introduction et `## 7.18.1 — 2026-11-18`, avec la date du jour de la livraison :

````markdown
## 7.19.0 — 2026-11-18

### Ce qui change

Le skill `fusionner` porte un calcul nouveau, `scripts/double-relecture.mjs` : il dit si une PR exige deux relectures indépendantes, parce que son ticket porte la ligne `Relecture: double`, ou que son diff touche le fichier d'une règle de criticité haute ou un fichier que le champ `code` de cette règle nomme. Il rend « exigée » avec les règles en cause, « non exigée » ou « illisible » ; une lecture en échec ne vaut jamais « non exigée ». Aucun script ne l'appelle encore : c'est une brique de la relecture indépendante, qui arrive par étapes.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Rien d'autre pour l'instant : aucun script de la chaîne n'appelle ce calcul, rien ne change au passage du capitaine, et il n'y a pas à le relancer.
3. À la prochaine repose de `fusionner` (son étape 0), copier aussi `scripts/double-relecture.mjs` dans `scripts/chaine/` : son banc `double-relecture.test.mjs` suit avec les autres tests, et il échoue sans lui.
````

### § 4 — Livrer

1. « Vérification », points 1 à 5.
2. Commit, push, PR vers `main` hors brouillon, sans `à-fusionner` (décision 19). Dans le corps de la PR : ce que le fichier rend, les sept points proposés de la section « Décisions », et la liste de « Ce qui n'a pas été établi », pour que l'architecte les lise à la contre-revue.
3. Si `main` a bougé : règle de repli, puis « Vérification » à nouveau.

## Surfaces

| Surface | Preuve (`double-relecture.test.mjs`) |
| --- | --- |
| le fichier d'une règle haute, ou un fichier de son `code`, exige deux relectures ; les causes nomment la règle, le motif, le chemin, la réf | « règle haute touchée, avec index … » |
| le niveau de l'index est le niveau effectif, criticité reçue d'une feature comprise ; sans index, elle n'est pas vue | « le niveau de l'index est le niveau effectif … » |
| une règle moyenne, basse ou à classer n'exige rien | « règle moyenne seule, ou basse, ou à classer : non exigée » |
| la base relue fait foi : une règle montée après le verdict change la réponse (`A-90`) | « règle montée à haute après le verdict … » |
| la tête est lue : une PR qui monte une règle est vue, index régénéré ou non ; une PR qui la baisse ou la supprime aussi | « une PR qui monte elle-même une règle à haute est vue sur sa tête … » |
| une règle rejetée ou obsolète ne compte pas ; la PR qui la rejette est vue | « règle haute rejetée ou obsolète … » |
| sans index, l'en-tête sous ses deux formes ; `code` en ligne, en bloc, dossier ; projet sans règles | « projet sans index … » |
| seul le chemin de la convention, à la racine, est le fichier d'une règle | « seul un fichier `docs/metier/regles/<ctx>/<RULE_…>.md` de la racine … » |
| une lecture en échec ne vaut jamais « non exigée » | « index illisible, schéma inconnu, en-tête illisible, référence introuvable, ligne du diff mal citée … » |
| une cause établie suffit, l'échec reste dit ; la forme de la sortie | « une cause établie suffit … » |
| `Relecture: double` : l'en-tête du ticket, sur la base, pour le ticket de la PR seul | « `Relecture: double` écrite sur le ticket … » |
| une autre valeur, un ticket en double : illisible ; ticket absent ou archivé : une remarque | « ligne `Relecture:` d'une autre valeur … » |
| la ligne `Règles:` n'est pas lue | « la ligne `Règles:` du ticket n'est pas lue … » |
| l'en-tête YAML : formes lues, formes refusées, temps linéaire | « l'en-tête d'une règle : les formes lues … », « lecture en temps linéaire … » |
| l'index : `key`, `criticality.level`, `code`, `validation.status`, pivots 2 et 3 | « l'index : `rules[].key` … » |
| les lignes de `git diff --name-only`, en parité avec `revue-exigee.mjs` ; les arguments | « les lignes de `git diff --name-only` … », « les lignes du diff se lisent comme `revue-exigee.mjs` les lit … » |
| depuis la copie des outils de la boucle : les réfs, jamais l'arbre de travail ; sorties 0, 20, 21, 22 | « en ligne de commande, depuis la copie des outils de la boucle … » |
| le ticket vient du nom de la branche de tête | « le ticket se lit dans le nom de la branche de tête … » |
| le lecteur git : un objet absent, plusieurs objets en une lecture, une réf qui commence par un tiret | « le lecteur git … » |
| le point d'entrée par un lien symbolique, un dossier à espace et à accent | « le point d'entrée est reconnu … » |
| version et note | test existant de `scripts/depot.test.mjs:1032` |

## Vérification

### Pour la session

1. `pnpm install --frozen-lockfile && pnpm test` : la suite entière, verte. Sur `22b2d49`, **772 tests** sans ces fichiers, **794** avec (772 + 22).
2. `node --test skills/chaine/fusionner/scripts/double-relecture.test.mjs` : 22 sur 22, en deux secondes environ.
3. `git diff --stat origin/main` : quatre fichiers, deux neufs et deux modifiés ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`.
4. Le banc posé à plat : il est rejoué par `scripts/poses.test.mjs` dans la suite du point 1 ; pour le voir seul, copier les deux fichiers et `revue-exigee.mjs` dans `<dossier>/scripts/chaine/`, `skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs` dans `<dossier>/scripts/docs/`, puis `node --test <dossier>/scripts/chaine/double-relecture.test.mjs`.
5. Les mutations : le script ci-dessous sur ce dossier posé à plat, `python3 <fichier> <dossier>/scripts/chaine` : **55 rouges sur 55**. Il remet le fichier après chaque mutation.

### Ce qui a été joué en écrivant ce ticket

Le 2026-11-18, dans deux clones jetables de `origin/main`, à `99a6214` puis à `22b2d49` quand `main` a bougé, sous un `TMPDIR` privé. Les trois blocs de ce ticket (banc, module, mutations) ont été relus par un script qui les tire du texte et les rejoue : ce qui suit est le résultat de ce texte, pas d'un brouillon.

- Le banc : 22 sur 22, environ 1,5 s, dans l'arbre du plugin et posé à plat ; rien ne reste dans le dossier temporaire ; vert aussi sous un `GIT_DIR` hérité d'un hook.
- La suite entière : 794 sur 794 à `22b2d49` avec les deux fichiers, la version 7.19.0 et sa note ; 772 sur 772 à `22b2d49` sans rien ; 787 sur 787 à `99a6214` avec eux. Le banc y est rejoué posé à plat par `scripts/poses.test.mjs`, dont le test a duré de 3 à 5 minutes sur les 10 de son plafond. Une première version des deux fichiers avait passé la même suite sans la version ni la note (785 sur 785 à `99a6214`) : aucun test de `main` n'exige qu'un script de `fusionner/scripts/` soit listé.
- Les mutations : 55 rouges sur 55, après un passage témoin vert.
- **Sur des données réelles, en lecture seule.** Le lecteur d'en-tête a lu les 1 923 fichiers de règle de trois dépôts réels sans un refus, et y trouve, règle par règle, le même ensemble de chemins `code` et le même statut que leur index (1 923 entrées comparées ; l'index trie `code`, l'en-tête garde son ordre). La ligne de commande, lancée depuis la copie posée à plat, a jugé dans le dépôt d'Anchorpost le diff de `origin/develop` (index au pivot 2, criticité nue) à `origin/sujet/preuve-suffisante-cas` (pivot 3, criticité en bloc), 293 fichiers : « exigée », par le fichier de la règle haute lu sur la base et par quatre fichiers de son `code` lus sur la tête, en 0,2 s ; sans le fichier de la règle, « exigée » encore par le `code` ; avec `README.md` seul, « non exigée ». Sur le plus gros des trois dépôts (un index de plus d'un millier de règles), une réponse prend moins de 0,2 s.

Non joué : aucun appelant n'existe, donc ni le Relecteur ni le capitaine n'ont lancé ce calcul ; la vraie boucle (`boucle.sh`) n'a pas repris le fichier d'un `origin/develop`, c'est le banc qui imite sa copie ; le schéma pivot a été lu dans Anchorpost aux commits nommés dans « Où », pas la CLI exécutée ; un index au schéma "1" n'a été vu dans aucun dépôt.

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
    ("le niveau n'est lu que sur la base", "for (const ref of [base, tete])", "for (const ref of [base])"),
    ("le niveau n'est lu que sur la tête", "for (const ref of [base, tete])", "for (const ref of [tete])"),
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
    ("la ligne `Relecture:` se lit sur la tête", "essayer(() => causes.push(...causesDuTicket(ticket, base, lecteur, remarques)));", "essayer(() => causes.push(...causesDuTicket(ticket, tete, lecteur, remarques)));"),
    ("la ligne `Relecture:` se lit dans tout le ticket", "(fin === -1 ? lignes : lignes.slice(0, fin))", "(lignes)"),
    ("une ligne `Relecture:` d'une autre valeur est ignorée", "if (scalaire(v) !== 'double') illisible(", "if (false) illisible("),
    ("toute ligne `Relecture:` vaut double", "return valeurs.length ? [{ sujet: ticket", "return lignes.some((l) => /^Relecture/.test(l)) ? [{ sujet: ticket"),
    ("la ligne `Relecture: double` n'est plus lue", "return valeurs.length ? [{ sujet: ticket", "return false ? [{ sujet: ticket"),
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
    ("sortie d'usage : 2", "usage: 22 };", "usage: 2 };"),
    ("un argument inconnu est ignoré", "if (!['--base', '--tete', '--branche'].includes(cle) || valeur === undefined", "if (valeur === undefined"),
    ("sans --tete, la base sert de tête", "return options.base && options.tete ? options : null;", "return options.base ? { tete: options.base, ...options } : null;"),
    ("le point d'entrée sans chemins résolus", "return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);", "return fileURLToPath(import.meta.url) === process.argv[1];"),
    ("la grammaire n'est plus cherchée dans ../docs/", "['../docs/identifiants.mjs', 'identifiants.mjs',", "['identifiants.mjs',"),
    ("une réf introuvable n'est plus vérifiée", "illisible(`référence ${ref} introuvable`);", "return;"),
    ("un objet absent de la réf est lu comme vide", "if (fin === -1 || taille === undefined) illisible(`${ref}:${chemin} illisible`);", "if (fin === -1 || taille === undefined) { textes.set(chemin, ''); continue; }"),
    ("le ticket se lit dans le titre de la branche de sujet", "const ticket = options.branche && G ? G.identifiantDeBranche(options.branche) : null;", "const ticket = options.branche && G ? G.identifiantDeBranche(options.branche.replace(/^sujet\\//, '')) : null;"),
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

Ce que la spec laisse ambigu, contradictoire ou sans réponse pour ce lot, et le choix fait ici. L'architecte confirme ou change avant le lancement ; chaque point tient à une décision et à un test nommés.

1. **Pivot 2.** `A-82` suppose un lecteur du « schéma pivot » sans dire lequel, et le skill `criticite` ne classe qu'au pivot 3 ; or l'index porte `criticality.level` dès le pivot 2, et les projets lus sont au pivot 2. Choix : lire `"2"` et `"3"`, tout autre schéma « illisible » (décision 6).
2. **`Règles:` n'est pas lue**, à la lettre d'`A-82`. Conséquence : jusqu'au gate du lot 5c, et pour un ticket antérieur à la montée d'une règle, une PR dont le ticket cite une règle haute sans `code` et sans `Relecture: double` n'a qu'une relecture, si son diff ne touche pas le fichier de la règle. La spec n'écrit cette limite que pour « une PR sans ticket » (décision 4, cas 13).
3. **Index non régénéré sur la tête.** La spec lit « l'index quand il en a un, sinon l'en-tête » ; à la lettre, une PR qui monte une règle sans régénérer son index ne serait pas vue, contre sa propre parenthèse. Choix : l'en-tête des fichiers de règle touchés est lu en plus (décision 8).
4. **Règle rejetée ou obsolète** : la spec n'en dit rien. Choix : elle ne compte pas (décision 11).
5. **Où est « le fichier d'une règle »**, et ce que nomme une entrée de `code` : la spec ne le dit pas. Choix : le chemin de la convention à la racine ; un fichier ou un dossier (décisions 9 et 10). Un chemin de règles déclaré au manifeste n'est pas reconnu.
6. **Base d'une sous-PR.** « Sur la base et sur la tête », et « c'est la version de `develop` qui juge » ne parle que du script. Une règle montée à haute dans `develop` n'est donc pas vue par les sous-PR d'un sujet qui n'a pas encore reçu `develop`, et la livraison du sujet n'est pas relue (`A-92`). `lireBase` de `revue-exigee.mjs` ajoute, lui, le contrat de `develop` à celui d'un sujet. Non tranché : le calcul lit les deux réfs qu'on lui nomme ; l'appelant peut le rejouer avec `--base origin/develop`.
7. **Où se lit `Relecture: double`.** `A-82` dit « sur la base de la PR » ; `A-74` lit `Sensibles:` sur `origin/sujet/*` et, sans sujet, sur `origin/develop`. Les deux lignes du même en-tête n'ont pas la même règle : une PR `hors-sujet` vers `develop`, dont le ticket vit sur le sujet, n'a pas de ligne lue. Choix : `A-82` à la lettre, et une remarque en sortie (décision 12).
8. **Le ticket de la PR.** `A-82` : « du ticket de sa branche ». `ticketDeLaPr`, que le capitaine emploie ailleurs, lit d'abord le titre. Choix : la branche seule (décision 2).
9. **Une ligne `Relecture:` d'une autre valeur** : « illisible » (décision 12). La spec ne le dit pas ; le ticket 55, qui la fera refuser par le gate, n'est pas entré.
10. **Que faire d'« illisible ».** La spec donne à la fonction de décision un « nombre de verdicts exigés » (`A-85`) : « exigée » vaut 2, « non exigée » vaut 1, et « illisible » n'a pas de nombre. Elle ne dit ni ce que fait le Relecteur (attendre, distribuer à deux, le dire à quelqu'un), ni si le capitaine renvoie ou s'arrête. Aux lots 4 et 5a. De même pour la moitié « une cause établie suffit » de la décision 13.
11. **Un diff vide** rend « non exigée » (hors `Relecture: double`). Le calcul ne sait pas distinguer une PR sans fichier d'un `git diff` en échec chez l'appelant ; et la PR de mise à jour d'un sujet sans conflit a bien une liste vide à juger. Non tranché : refuser une liste vide ici bloquerait ce dernier cas.
12. **Une criticité fixée sur une feature** (`featureCriticality` du manifeste) monte des règles sans toucher ni leur fichier ni leur code : la PR qui l'écrit n'a qu'une relecture, à la lettre d'`A-82`. La spec ne le dit pas.
13. **La pose.** La spec renvoie « au plus tard à 3d » la ligne du `CONTENU.md` et de `points-d-entree.test.mjs`, et `A-111` renvoie au lot 4 ou 5a la liste de l'étape 0 de `fusionner/SKILL.md` pour les deux modules du lot 3a ; elle ne nomme pas ce fichier-ci dans cette phrase, ni l'arbre du `README.md`. Et elle ne voit pas ceci : l'étape 0 fait suivre **tous** les `scripts/*.test.mjs`, donc un projet qui repose entre-temps reçoit le banc sans le module (cela vaut aussi pour les bancs du lot 3a). Choix : la même règle qu'`A-111`, et la note de version dit le geste (décision 16). La sortie la plus étroite, si l'architecte la préfère à l'attente : un mot ajouté à `fusionner/SKILL.md:14`, fichier chaud de l'autre programme.
14. **Les codes 20, 21 et 22** sont libres sur `main` ; les tickets 58 et 59, écrits en même temps, n'ont pas été accordés avec celui-ci sur ce point.

## Hors périmètre

- **Tout appelant** : le Relecteur (lot 4), le capitaine à ses deux contrôles (lot 5a, `A-105`), le diff qu'ils passent, le fetch de la cible, le nombre qu'ils tirent de la réponse.
- **Le gate `tickets`** : la forme de `Relecture: double` (ticket 55, lot 2), son exigence sur un ticket qui cite une règle haute (lot 5c).
- **Le message d'information au produit** (`A-90`), qui part du conducteur.
- **`fusionner/references/CONTENU.md`, `scripts/points-d-entree.test.mjs`, `fusionner/SKILL.md`, `README.md`** : au plus tard avec 3d (décision 16).
- **« Même contenu propre »** (lot 3b, ticket 59) et **le lecteur de verdict** (lot 3a, ticket 58).
- **Le skill `criticite`, la fiche et le gabarit de règle** : lus, pas un mot ne change.

## Comments

- 2026-11-18 — Écrit par un agent rédacteur sur la sixième version de la spec (lue à `a662c4d`, puis ses amendements `A-110` et `A-111`, lus dans l'arbre de travail avant leur commit : ils ne changent pas `A-82`) et sur `origin/main` à `22b2d49`, module et banc joués (« Vérification »). Pas encore relu par un agent neuf. Sept choix proposés là où la spec ne tranche pas (décisions 6, 8, 9, 10, 11, 12, 13), quatorze points dans « Ce qui n'a pas été établi ».
