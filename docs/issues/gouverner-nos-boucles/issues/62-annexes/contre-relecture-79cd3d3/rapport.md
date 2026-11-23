# Contre-relecture de la PR 140, premier tour (P-65)

Sommet relu : `79cd3d3f17c699cda876176ab33269d510e4afa1` (branche `claude/petits-correctifs-plugin`, base `main` à
`5d05f4b`). git 2.43.0, Node 22.23.5, poste à 4 cœurs partagé et chargé (charge 6 à 10). Clone privé
`<dossier du contre-relecteur>/clone`, copie de mutation `<dossier du contre-relecteur>/mut`. Outils et sorties brutes :
`<dossier du contre-relecteur>/bin/` et `<dossier du contre-relecteur>/res/`.

Banc de la matrice (`bin/preparer.sh`, `bin/jouer.sh`, `bin/matrice.sh`, `bin/cellules-*.sh`) : un vrai dépôt d'un
autre propriétaire (le dépôt jouet donné à l'uid 65534 par `chown` ; git, joué en root, le tient pour douteux :
« detected dubious ownership »), un dépôt nu à moi dont le nom ne finit pas par `.git` (`nu`), un dépôt nu d'un autre
propriétaire (`nu-autre`), un arbre de travail à moi (`mien`). Chaque cellule joue, sous `env -i`, git lui-même
(`git rev-parse --verify -q HEAD`), `meme-contenu.sh V T develop` et `echo docs/b.md | node double-relecture.mjs
--base develop --tete T`, avec `HOME`, `XDG_CONFIG_HOME` et `GIT_CONFIG_SYSTEM` dans des dossiers du banc. « lit » =
toute réponse autre que `illisible` (ici `différent` et `non exigée`). VIOLATION = un calcul lit, git refuse ;
plus-strict = l'inverse.

## Constats

### B1 — `safe.bareRepository` : une valeur invalide qui n'est pas la dernière est ignorée ; git, lui, meurt dessus (les deux calculs)

**Fait.** git valide **chaque** valeur de `safe.bareRepository` lue aux portées protégées, dans l'ordre : la première
qui n'est ni `explicit` ni `all` (vide, inconnue, casse différente, clé sans `=`) le fait mourir (« bad config variable
'safe.barerepository' », ou un segfault pour la clé sans `=`), même si une valeur valide la suit. Les deux calculs ne
gardent que la **dernière** valeur (`DERNIERE` dans `declarations`, `valeur = m[2]` dans `bareDeclare`) et la
reportent : `… bidon` puis `all` donne `all`, et le dépôt nu est lu. La décision 13 bis (et `A-154`, « dernière
valeur ») ne voit l'échec de git que sur la dernière valeur ; le banc ne joue que `all` puis `bidon` (la dernière).

**Commande** : `TRAVAIL=…/lab/m CLONE=…/clone bash bin/cellules-nu.sh` (sortie `res/matrice-nu.propre.txt`) :

```
b08 nu, globale bogus puis all                 git:refuse  meme:VIOL  double:VIOL
b09 nu, système vide, globale all              git:refuse  meme:VIOL  double:VIOL
b10 nu, système sans = (NULL), globale all     git:refuse  meme:VIOL  double:VIOL   (git : Segmentation fault)
b11 nu, système Explicit (casse), globale all  git:refuse  meme:VIOL  double:VIOL
b12 nu, globale explicit puis bogus puis all   git:refuse  meme:VIOL  double:VIOL
b23 mien/.git, bogus puis all                  git:refuse  meme:VIOL  double:VIOL
```

avec, pour b08 : `git:refuse (fatal: bad config variable 'safe.barerepository' in file '/h…)`,
`meme-contenu:différent [le commit aa155106e n'est ni une fusion de la cible…] VIOLATION`,
`double-relecture:non exigée [] VIOLATION`.

**Retouche.** Dans `declarations` (bash) et `bareDeclare` (JS) : si une seule des valeurs lues, à n'importe quel rang,
n'est pas exactement `explicit` ou `all`, reporter `explicit` (git échoue sur ce dépôt : refuser est le côté sûr, et la
cause nommée, « une valeur qu'il ne lit pas », vaut) ; sinon la dernière. Cas de banc : `bidon` puis `all`, vide puis
`all`, `Explicit` au système puis `all` à l'utilisateur ; mutation « seule la dernière est validée » à voir rouge.
Corriger aussi la note 7.35.0 et la décision 13 bis (« sa dernière valeur est reportée » : faux dès qu'une valeur
antérieure est invalide).

### B2 — `safe.directory` : une valeur `~utilisateur/…` que git ne sait pas étendre le fait mourir ; les deux calculs l'ignorent et admettent le dépôt

**Fait.** git 2.43 passe chaque valeur de `safe.directory` (autre que vide et `*`) par `git_config_pathname`, qui
meurt (« failed to expand user dir in: '~nosuchuser42/x' ») sur un `~utilisateur/` inconnu, quel que soit son rang :
le dépôt d'un autre propriétaire est refusé. Les deux calculs comparent la valeur à la lettre, l'écartent comme
« autre chemin », et admettent le dépôt dès qu'une autre valeur vaut la racine ou `*`, puis reportent
`safe.directory=<racine>` seule au dépôt réel, qui l'admet. Nouveau dans `meme-contenu.sh` (cette PR) ; dans
`double-relecture.mjs`, `declareSur` est entré par la PR 134 et n'est pas touché ici, mais la règle « dans les deux
calculs » vaut.

**Commande** : `bash bin/cellules-sd.sh` (sortie `res/matrice-sd.txt`) :

```
s38 ~inconnu puis exacte
  git:refuse (fatal: failed to expand user dir in: '~nosuchuser42/x')
  meme-contenu:différent [le commit aa155106e n'est ni une fusion de la cibl] VIOLATION
  double-relecture:non exigée [] VIOLATION
s39 exacte puis ~inconnu           git:refuse  → les deux : VIOLATION
s40 * (système) puis ~inconnu      git:refuse  → les deux : VIOLATION
```

**Retouche.** Une valeur qui commence par `~` (ou toute valeur que git interpole : `~`, `%(prefix)/`) : rien n'est
admis (refuser ce que git admettrait peut-être, jamais l'inverse). Un cas de banc par calcul.

### B3 — Un lieu de configuration relatif (`GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `HOME`, `XDG_CONFIG_HOME`) est résolu depuis `/`, git le résout depuis le dossier courant (les deux calculs)

**Fait.** Les deux lectures (`declarations` : `cd / && git config …` ; `declareSur` et `bareDeclare` :
`execFileSync(…, { cwd: '/' })`) passent `GIT_CONFIG_GLOBAL` et `GIT_CONFIG_SYSTEM` telles que l'appelant les a
posées, et `HOME`, `XDG_CONFIG_HOME` hérités ; un chemin relatif y désigne un fichier sous `/`, souvent absent, que git
lit comme vide. git, lui, ouvre le chemin relatif depuis le dossier courant de l'appelant, au moment de la découverte du
dépôt. Une remise à zéro de `safe.directory`, ou `safe.bareRepository = explicit`, écrite dans ce fichier est vue par
git et pas par les calculs.

**Commande** : `bash bin/cellules-rel.sh` et `bash bin/cellules-rel2.sh` :

```
s51 GIT_CONFIG_GLOBAL relatif, remise à zéro dans cwd ; système exacte
  git:refuse (fatal: detected dubious ownership in repository at '/home/us)
  meme-contenu:différent […] VIOLATION
  double-relecture:non exigée [] VIOLATION
s51b témoin : même fichier en chemin absolu        git:refuse  meme:illisible ok  double:illisible ok
b26 nu, GIT_CONFIG_GLOBAL relatif explicit          git:refuse  meme:VIOL  double:VIOL
b35 nu, HOME relatif (h/.gitconfig explicit)        git:refuse  (cannot use bare repository)  meme:VIOL  double:VIOL
b36 nu, XDG_CONFIG_HOME relatif                     git:refuse  meme:VIOL  double:VIOL
b37 nu, GIT_CONFIG_SYSTEM relatif                   git:refuse  meme:VIOL  double:VIOL
```

**Retouche.** Avant la lecture depuis `/` : si l'une de `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `HOME`,
`XDG_CONFIG_HOME` est posée, non vide et ne commence pas par `/`, rien n'est admis et `safe.bareRepository` vaut
`explicit` (ou la rendre absolue par `$(pwd -P)/…`, ce que fait `open`). Un cas de banc par variable et par calcul.

### m1 — Clone partiel : la cause n'est pas nommée quand la marque vit dans un `include` du dépôt ou dans `config.worktree`

**Fait.** `r config --local --get-regexp …` ne suit pas les inclusions et ne lit pas `config.worktree` ; git, lui, y
lit `remote.<nom>.promisor`. La réponse reste `illisible` (jamais `même` ni `différent` à tort : un objet manquant
fait échouer la lecture), mais avec l'ancienne raison qui ne dit pas la cause. Les cas ordinaires sont bien nommés.

**Commande** : `bash bin/partiel.sh` (sortie `res/partiel.txt`) :

```
entier                                       même       de V à T : 1 fusion(s) de origin/develop, 0 commit(s) d'index générés
--filter=blob:none                           illisible  dépôt partiel : des objets manquent et ce calcul ne télécharge rien, …
--filter=tree:0                              illisible  dépôt partiel : …
--filter=blob:limit=1                        illisible  dépôt partiel : …
--filter=sparse:oid                          illisible  dépôt partiel : …
--depth=1                                    illisible  dépôt superficiel : l'historique est tronqué, …
--depth=1 --filter=blob:none                 illisible  dépôt superficiel : …
  puis --unshallow (reste partiel)           illisible  dépôt partiel : …
blob:none puis fetch --refetch sans filtre   illisible  dépôt partiel : …          (objets tous là, marque restée : prudent)
  puis marques retirées (objets tous là)     même       de V à T : 1 fusion(s) …
blob:none, marques retirées, objets manquants  illisible  scripts/docs/index-generes.json de origin/develop illisible
tree:0, marques retirées, objets manquants     illisible  arbre de origin/develop illisible
blob:none, promisor dans un include du dépôt   illisible  scripts/docs/index-generes.json de origin/develop illisible
  git y voit-il un promisor ? true ; --local sans --includes : rien
blob:none, promisor sur un autre distant     illisible  dépôt partiel : …
blob:none, promisor = False (casse)          illisible  dépôt partiel : …
blob:none, promisor dans config.worktree     illisible  scripts/docs/index-generes.json de origin/develop illisible
```

**Retouche.** `r config --includes --get-regexp …` sans `--local` (le dépôt réel est lu avec `GIT_CONFIG_GLOBAL` et
`GIT_CONFIG_SYSTEM` à `/dev/null` : restent le dépôt, `config.worktree` et les deux reports, qu'aucune clé du motif ne
nomme), ou l'écrire dans les limites connues.

### m2 — `aDesSousTests` ne voit pas un sous-test au nom calculé (`t.test(nom, …)`) ni un `test(` global appelé dans le corps d'un test

**Fait.** Le motif `\b\w+\.test\(\s*["'`]` exige un nom littéral, et un `test(…)` global appelé pendant un test est un
sous-test pour Node 22 (il s'attache au test qui tourne). Un banc qui en écrit serait découpé, et la tranche de reste
sauterait sans le voir un sous-test, d'un test de premier niveau non lu, dont le nom égale un nom lu (décision 2 du
ticket). Aucun banc posé n'en écrit aujourd'hui : la simulation des plans sur les 23 bancs posés (faux `node:test`
qui note les noms réels, motifs appliqués comme Node) donne 610 tests réels de premier niveau, 0 écart.

**Commande** : `lab/n/sous.test.mjs` (A à sous-tests littéraux, D qui appelle `test("E")` et `test("C")` dans son corps) :

```
rc=0 args= | journal: A;A>B;A>C;C;D;D>E (test global imbriqué);D>C (test global imbriqué); | rapporteur: {"nom":"A"} {"nom":"C"} {"nom":"D"}
rc=0 args=--test-name-pattern=^(?:C)$ | journal: C; | rapporteur: {"nom":"C"}
aDesSousTests: true            (à cause de t.test("B") littéral)
avec noms en variable, aDesSousTests: false   (t.test(nomB, …) et test("E") imbriqué ne sont plus vus)
```

et `node bin/simuler.mjs clone tmp` : `total réels 610, écarts 0` (`res/simulation.txt`).

**Retouche.** `\b\w+\.test\s*\(` sans exiger de guillemet, et dire dans `tranches.mjs` et le `README.md` que le `test(`
global imbriqué n'est pas vu ; ou l'écrire en limite.

### m3 — Un dépôt d'un autre propriétaire refusé dit « pas dans un dépôt git », sans sa cause

**Fait.** Dans les deux calculs, le refus d'un dépôt d'un autre propriétaire (non déclaré, déclaré par une forme non
admise, ou admis par git mais pas par le calcul : `GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS`, `.git` déclaré) rend
« pas dans un dépôt git ». Dans les sessions cloud, où `GIT_CONFIG_COUNT` est toujours posée (décision 13 quater), c'est
la raison de tout dépôt d'un autre propriétaire. Le refus d'un dépôt nu, lui, nomme sa cause. Sous `LC_ALL=C`, la sortie
d'erreur de git dit « detected dubious ownership » : la cause se lit.

**Retouche.** Nommer la cause (« dépôt d'un autre propriétaire : déclaré sûr par son chemin exact ou `*`, portées
system ou global, sans `GIT_CONFIG_COUNT` ni `GIT_CONFIG_PARAMETERS` »), comme pour le dépôt nu.

### m4 — Textes : la décision 13 bis et la note 7.35.0 promettent plus que le code ; « Quatre petits correctifs » pour cinq puces

**Fait.** La décision 13 bis et la note disent qu'une valeur vide ou inconnue de `safe.bareRepository` fait refuser le
dépôt nu : vrai pour la dernière seulement (B1). La note annonce « Quatre petits correctifs » et en liste cinq (deux pour
le défaut 4). La décision 6 dit « Prettier 3.6.2 laisse la forme en bloc inchangée » : vrai aux réglages par défaut ;
avec `tabWidth: 4` ou `8`, Prettier la réindente (4 ou 8 espaces), sans la replier, et le lecteur de `main` la lit
encore (`lab/y/p4.mjs`, ci-dessous) : sans conséquence.

**Retouche.** Avec B1, réécrire 13 bis et la puce de la note ; « Cinq » ou regrouper les deux puces.


### m5 — Deux garanties du calcul `safe.directory` de `meme-contenu.sh` ne sont gardées par aucun cas du banc

**Fait.** Deux mutations de mon cru restent vertes sur le banc entier de `meme-contenu.test.mjs` (59 tests), et ne sont
pas équivalentes :

- **MC3** : reporter `safe.directory=*` au lieu de la racine (la décision 13 : « jamais le motif qui l'a admise »).
  Cellule s53 (un `.git` vide dans `docs/`, `docs` déclaré, dossier courant `docs`) : le code livré refuse comme git ;
  le mutant lit (`meme-contenu:différent […] VIOLATION`, git : « detected dubious ownership »).
- **MC2** : chercher la racine par `-d` au lieu de `-e` (un `.git` fichier : arbre lié, sous-module). Cellule w02 (arbre
  lié d'un autre propriétaire, déclaré par son chemin) : le code livré lit comme git ; le mutant refuse (plus strict).

**Commande** : `node bin/muter.mjs mut bin/mutations.json M` (`res/mutations-MC-MD.txt`) puis
`bin/cellules-mc3.sh` et `bin/cellules-wt.sh` sous chaque mutant (sorties citées dans la section Mutations).

- **MD6**, la même que MC3 dans `double-relecture.mjs` (la ligne `reports`, écrite par cette PR) : verte sur le banc
  entier (50 tests) ; cellule s53 sous le mutant : `double-relecture:non exigée [] VIOLATION`, code livré :
  `illisible [# illisible : pas dans un dépôt git] ok`.

**Retouche.** Deux cas par calcul : la cellule s53 (la racine du calcul diffère de celle de git, la déclaration de la
première n'admet rien) et un arbre lié d'un autre propriétaire déclaré par son chemin.

## Matrice `safe.directory` et `safe.bareRepository` (point 1)

101 cellules, chacune jouée contre git et les deux calculs (202 comparaisons) : `res/matrice-sd.txt` (59 cellules
`safe.directory`, dépôt d'un autre propriétaire), `res/matrice-nu.propre.txt` (37 cellules `safe.bareRepository`, dépôt
nu), `res/matrice-wt.txt` (4, arbre lié d'un autre propriétaire), s53. Les deux calculs répondent de même dans
toutes les cellules, sauf s53 sous mutant.

**VIOLATION (un calcul lit, git refuse) : 14 cellules, dans les deux calculs** — s38, s39, s40 (B2) ; s51, b26, b35,
b36, b37 (B3) ; b08, b09, b10, b11, b12, b23 (B1).

**Conformes à git (lit quand git admet, refuse quand git refuse)** : aucune déclaration ; chemin exact ; `*` ; barre
finale ; `parent/*` ; autre dépôt ; système exact ; `GIT_CONFIG_NOSYSTEM` = `1`, `0`, `false`, `no`, vide, `abc`
(git meurt : « bad boolean »), `yes` ; remises à zéro (globale après système, avant et après l'exacte, `*` du système
puis vide) ; `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` qui remettent à zéro ; `GIT_CONFIG_GLOBAL` ailleurs qui
déclare ; `GIT_CONFIG_GLOBAL=/dev/null` avec `~/.gitconfig` qui déclare ; `include` qui déclare ; exacte puis `include`
d'une remise à zéro ; `includeIf gitdir:` (remise à zéro ou déclaration : git ne les suit pas en portée protégée, les
calculs non plus) ; `includeIf onbranch:` ; `~/../depot` ; lien symbolique déclaré ; dossier courant par un lien, avec
`PWD` ; sous-dossier, sous-dossier profond ; `.git` comme dossier courant, racine déclarée ; casse ; XDG avec et sans
`~/.gitconfig`, XDG qui remet à zéro avec et sans `~/.gitconfig` ; clé sans `=` (NULL) avant et après l'exacte ;
valeur à saut de ligne (seule, ou suivie de l'exacte) ; `.` et `..` ; `GIT_CEILING_DIRECTORIES` qui borne ; espace
finale ; système qui déclare par `include` ; `NOSYSTEM=1` et `GIT_CONFIG_SYSTEM` ailleurs ; arbre lié (rien, son
chemin, le dépôt principal, `*`). Dépôt nu : rien, `explicit`, `all`, système et utilisateur dans les deux ordres,
dernière valeur vide ou inconnue, `COUNT` ou `PARAMETERS` qui posent `explicit`, `GIT_CONFIG_GLOBAL` ailleurs, XDG avec
`~/.gitconfig` sans rien ou à `all`, `include`, `includeIf gitdir:` (non suivi par git, ni par les calculs), `mien/.git`
sous `explicit` (git 2.43 le refuse aussi), sous-dossier d'un dépôt nu, `NOSYSTEM=1`, valeur à saut de ligne, clé en
majuscules, dépôt nu d'un autre propriétaire sous `*` et `explicit`, arbre de travail sous `explicit` et sous une valeur
inconnue (git ne la lit pas : lu).

**Plus strict (git admet, le calcul refuse) : 9 cellules, les deux calculs**, et ce que voit l'utilisateur :

| cellule | raison affichée |
| --- | --- |
| s14 `GIT_CONFIG_COUNT` déclare, s16 `COUNT=0`, s18 `PARAMETERS` déclare | « pas dans un dépôt git » (voulu, `A-135`) |
| s32 `.git` déclaré, dossier courant `.git` | « pas dans un dépôt git » |
| s52 un `.git` vide dans le sous-dossier courant | « pas dans un dépôt git » |
| b14 globale `explicit`, `COUNT` pose `all` | « dépôt nu trouvé sans --git-dir, que git refuse … : appeler ce calcul depuis un arbre de travail » (voulu) |
| b21 `GIT_DIR` donné (les calculs l'écartent, S1) | la même phrase : juste (« depuis un arbre de travail ») |
| b29, b30 dépôt nu d'un autre propriétaire déclaré (chemin, `*`) | « pas dans un dépôt git » (la racine cherche un `.git`) |

Hors matrice, non joué faute d'un autre git : au-dessus de 2.43, `dossier/*` (2.46) et la normalisation des chemins
déclarés rendraient plus strictes d'autres cellules (s05, s27), jamais l'inverse : les calculs reportent la racine et
git juge.

## Tranches (point 3)

- **Découpe sans perte ni doublon** : `node bin/plan.mjs clone` (`res/plan.txt`) et `node bin/simuler.mjs clone tmp`
  (`res/simulation.txt`) : un faux `node:test` (chargé par `--import`, hooks `resolve`) note le nom de chaque test réel
  de premier niveau de chacun des 23 bancs posés, sans rien jouer ; chaque plan est appliqué avec les mêmes
  expressions régulières que Node. **610 tests réels (594 lus, 16 écrits en boucle dans `fusionner.test.mjs`), 0 écart**
  : chacun tourne exactement une fois. Aucun doublon de nom dans les bancs posés ; aucun `describe` ni sous-test.
- **Sémantique de Node 22.23.5 vérifiée** (`lab/n/sous.test.mjs`) : `--test-name-pattern` ne voit que les noms de
  premier niveau, un test qui y répond joue tous ses sous-tests, un test qui n'y répond pas n'en joue aucun ;
  `--test-skip-pattern` saute par nom. Le rapporteur ne rend que le premier niveau.
- **Caractères spéciaux, doublons, CRLF, fichier sans fin de ligne, nom calculé, concaténé** : couverts par
  `tranches.test.mjs` ; un fichier vide donne `[]` et un banc `entier`.
- **Un échec dans une tranche fait échouer `pnpm test`** : voir « Échec injecté » ci-dessous.
- **La CI** (`.github/workflows/ci.yml`, job `bancs`) joue `pnpm test`, dont `scripts/*.test.mjs` : `poses.test.mjs` et
  `tranches.test.mjs` y sont. Les bancs de `scripts/docs/` et `scripts/verify/`, posés mais non rejoués par le garde,
  sont joués depuis le plugin par les motifs de `pnpm test` (inchangé depuis `main`).
- **Durée sous charge** : dans ma suite entière (charge 8 à 10 sur 4 cœurs, d'autres sessions tournaient),
  `poses.test.mjs` a pris **455 s**, pour un plafond de 620 s (le ticket mesure 279 s sur un poste calme). Le gain est
  réel mais la marge, sous une forte charge, reste de l'ordre de 165 s : à surveiller, pas un défaut.

## Textes (point 4)

- **Forme en bloc et forme en ligne** (`lab/y/forme.mjs`, `yaml` 2.9.1 et `prettier` 3.6.2 posés dans un dossier
  privé, aucune dépendance au dépôt) : le bloc du gabarit décommenté, commentaires gardés, donne avec `yaml` 2.9.1
  `{"level":"medium","by":"agent","reason":"…"}`, le même objet que la forme en ligne ; `enTeteDeRegle` de `main`
  (`5d05f4b`) et de la branche lisent `{"niveau":"medium",…}` pour les deux. Raison à « : » et virgule entre
  guillemets : lue partout. Raison nue à « : » : refusée par `yaml` et par le lecteur (« des deux-points dans un
  texte nu »), d'où les guillemets du gabarit. Prettier aux réglages par défaut laisse le bloc inchangé et replie la
  forme en ligne ; avec `tabWidth` 4 ou 8 il réindente le bloc, sans le replier, et le lecteur de `main` le lit encore
  (`lab/y/p4.mjs`).
- **Fiche de tests et gabarits** : `tests-creux.mjs` ne lit pas la langue (il ne cite « should create » qu'en
  commentaire ; son banc garde le cas observé et reçoit le cas français, vert). Aucun `should` ni nom de test anglais
  ailleurs dans `skills/` (`grep -rnE "\b(it|test)\(…(returns|rejects|throws|…)"` : rien ; le seul `should` restant est
  de la prose, `ARCHITECTURE_GUIDELINES.md:495`). Aucun `criticality: {` hors `double-relecture*`.
- **Note 7.35.0** : voir m4 (et B1, qu'elle décrit comme couvert).

## Mutations (point 5)

21 mutations de mon cru (`bin/mutations.json`, `bin/muter.mjs` : appliquée seule dans la copie `mut`, les tests visés
puis, si vert, le banc entier, le fichier restauré ; témoins verts avant : `tranches.test.mjs` 6 sur 6 aux deux
sommets, les 3 tests nouveaux de `meme-contenu.test.mjs`, le test nouveau de `double-relecture.test.mjs`).

| id | fichier | mutation | résultat |
| --- | --- | --- | --- |
| MC1 | meme-contenu.sh | `remote.<nom>.promisor` n'est plus lu | rouge |
| MC2 | meme-contenu.sh | racine par `-d` au lieu de `-e` (`.git` fichier) | **verte**, non équivalente (m5) |
| MC3 | meme-contenu.sh | report `safe.directory=*` au lieu de la racine | **verte**, non équivalente (m5, VIOLATION en s53) |
| MC4 | meme-contenu.sh | cause nommée sous `explicit` seul | rouge |
| MC5 | meme-contenu.sh | diagnostic en échec (vide) lu comme « nu » | rouge |
| MC6 | meme-contenu.sh | `GIT_CONFIG_NOSYSTEM` plus transmise | rouge |
| MD1 | double-relecture.mjs | `bareDeclare` sans les trois variables de lieu | rouge |
| MD2 | double-relecture.mjs | `GIT_CONFIG_PARAMETERS` ne donne plus `explicit` | rouge |
| MD3 | double-relecture.mjs | `OutilManquant` plus relancée dans `ouvrir` | verte, **équivalente** (`OutilManquant extends Illisible`) |
| MD4 | double-relecture.mjs | une valeur vide plus reportée | rouge |
| MD5 | double-relecture.mjs | diagnostic `!== 'false'` | verte, **équivalente** (git en échec lève, rien n'est affecté) |
| MD6 | double-relecture.mjs | report `safe.directory=*` au lieu de la racine | **verte**, non équivalente (m5, VIOLATION en s53) |
| MT1 | tranches.mjs | le motif n'échappe plus `\|` | rouge |
| MT2 | tranches.mjs | `< taille` au lieu de `<=` | rouge |
| MT3 | tranches.mjs | une tranche n'attend plus ses doublons | rouge |
| MT4 | tranches.mjs | échappements du nom plus retirés | rouge |
| MT5 | tranches.mjs | `t.test( "…"` (espace) plus vu | **verte** (m2 : la même famille) |
| MT6 | tranches.mjs | banc entier sans ses doublons | rouge |
| MT7 | tranches.mjs | le reste joue les noms au lieu de les sauter | rouge |
| MT8 | tranches.mjs | plus de tranche de reste | rouge |
| MT9 | tranches.mjs | le rapporteur ne compte plus un test en échec | verte, équivalente pour la sûreté (la sortie non nulle de l'enfant fait échouer ; un `todo` en échec ferait une fausse alerte, jamais une perte) |

Bilan : 14 rouges, 7 vertes, dont 3 équivalentes et 4 non équivalentes (MC2, MC3, MD6, MT5). MT1 à MT9 rejouées au
sommet `557cbc3` : les mêmes résultats (`res/mutations-MT-557cbc3.txt`).

## Suite entière (une fois)

`pnpm test` au sommet `79cd3d3`, `TMPDIR` privé, `node_modules` posé par `pnpm install --frozen-lockfile` (sans lui,
`tests-creux.test.mjs` ne trouve pas `typescript`) : **1 143 tests, 1 143 verts, 0 échec, 596 s**, sortie 0
(`res/suite.txt`). Le chiffre annoncé (1 143) tient.

## Échec injecté (point 3)

Dans la copie `mut`, deux tests en échec ajoutés à deux bancs posés, puis `node --test scripts/poses.test.mjs` seul
(fichiers restaurés ensuite, `diff -rq mut/skills clone/skills` vide) : `test("échec volontaire en tranche", …)` en
fin de `veille.test.mjs` (lu, donc dans une tranche) et un test au nom calculé en fin de `faux-gh.test.mjs` (non lu,
donc dans le reste). Sortie (`res/poses-injecte.txt`) :

```
✖ les bancs posés à plat sous scripts/chaine/ tournent hors du plugin (454673.619688ms)
  AssertionError [ERR_ASSERTION]: ── scripts/chaine/veille.test.mjs (tranche, sortie 1)
  ✖ échec volontaire en tranche (5.302177ms)
  ── scripts/chaine/faux-gh.test.mjs (reste, sortie 1)
  ✖ échec volontaire du reste (0.42336ms)
rc=1 durée 455 s
```

L'échec d'une tranche comme celui du reste font échouer le garde, sortie 1, et chacun est nommé avec son banc.

## Le delta `79cd3d3..557cbc3` (commit « le banc jouet est un texte constant », A-157)

`git diff --stat 79cd3d3 557cbc3` : `scripts/tranches.test.mjs` (+24 −10) et le ticket (+1 ligne de commentaire), rien
d'autre. Le banc jouet devient la constante `BANC_JOUET`, sans aucune valeur interpolée dans du code : le chemin du
journal passe par `jouet.json` (lu par `new URL("./jouet.json", import.meta.url)`), et chaque test note `t.name`.
Seules restent des interpolations dans des arguments de processus et dans l'écriture d'un JSON de données
(`grep -n 'JSON.stringify\|\${' scripts/tranches.test.mjs`). Ce que le banc tenait, il le tient : mêmes onze tests
(neuf noms lus, un calculé, un concaténé ; un doublon ; préfixes ; caractères de motif), même journal attendu ; `t.name`
est le nom que le coureur a joué, ce que l'ancien journal écrivait à la main. Témoin 6 sur 6 vert aux deux sommets, et
mes mutations MT1 à MT9 donnent les mêmes résultats aux deux sommets, dont MT7 et MT8, que seul ce banc jouet tue.
Non rejoué à `557cbc3` : la suite entière et CodeQL.

## Verdict

**Conforme après retouches.** Les retouches B1, B2 et B3 sont bloquantes (chacune une cellule où un calcul lit ce que
git refuse, dans les deux calculs) ; m1 à m5 sont recommandées. Le reste tient : clone partiel nommé dans les cas
ordinaires et jamais de réponse fausse ; tranches sans perte ni doublon sur les 610 tests réels, échec d'une tranche ou
du reste vu ; gabarit en bloc lu comme la forme en ligne par `yaml` 2.9.1 et par le lecteur de `main` ; noms de tests
en français partout ; suite entière verte (1 143).

Retouches, une par une :

1. **B1** : `declarations` (`meme-contenu.sh`) et `bareDeclare` (`double-relecture.mjs`) : toute valeur de
   `safe.bareRepository`, à n'importe quel rang, autre que `explicit` ou `all` à la lettre → `explicit` ; cas `bidon`
   puis `all`, vide puis `all`, `Explicit` au système puis `all` ; corriger 13 bis et la note.
2. **B2** : `declarations` et `declareSur` : une valeur de `safe.directory` qui commence par `~` (et `%(prefix)/`)
   → rien n'est admis ; un cas par calcul.
3. **B3** : les deux calculs : `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `HOME` ou `XDG_CONFIG_HOME` posée, non vide
   et relative → rien n'est admis, `explicit` (ou la rendre absolue depuis `pwd -P`) ; un cas par variable.
4. m1 : `--includes` sans `--local` pour la marque du partiel, ou la limite écrite.
5. m2 : `\b\w+\.test\s*\(` dans `SOUS_TEST`, et la limite du `test(` global imbriqué écrite.
6. m3 : nommer la cause du refus d'un dépôt d'un autre propriétaire.
7. m4 : textes (13 bis, note, « Quatre »).
8. m5 : cas de banc pour « jamais le motif » (s53) et pour l'arbre lié d'un autre propriétaire, dans les deux bancs.

## Ce que je n'ai pas regardé

- Un autre git que 2.43.0 : la CI (`ubuntu-24.04`) a sans doute un git plus récent ; `is_implicit_bare_repo` (`.git`
  admis sous `explicit`, 2.45), `dossier/*` (2.46), la normalisation des chemins déclarés, et le sort de `~inconnu`
  (B2) au-dessus de 2.43 ne sont pas joués.
- Un sous-module d'un autre propriétaire (seul l'arbre lié est joué) ; `includeIf "hasconfig:remote.*.url:"`.
- `double-relecture.mjs`, `partiel()` (entré par la PR 134, hors du diff) : une lecture de configuration en échec y vaut
  « non partiel », là où `meme-contenu.sh` rend `illisible` ; sans conséquence trouvée (les objets manquants font
  échouer plus loin), non approfondi.
- La CLI Anchorpost (privée, non installée) et tout autre formateur que Prettier 3.6.2.
- La suite entière et l'analyse CodeQL au sommet `557cbc3` ; l'état de la CI de `79cd3d3`.
- La dépendance d'ordre entre tests d'un même banc au-delà d'une recherche des crochets `before`/`after` et des
  variables de module (deux `after` de ménage, rien d'autre) ; la suite verte ne la montre pas.
- `docs/issues/gouverner-nos-boucles/map.md` (consigne) ; de la spec de l'architecte, seules `A-135`, `A-143`, `A-149`
  et `A-154` sont lues.
