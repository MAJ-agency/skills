# Contre-relecture de la PR 134 (ticket 60, « double relecture exigée »)

Sommet relu : `484e991bf18e5e1d0d205d9fad78538e4d99d9ee`, base `origin/main` à `a018502`, dans un clone privé du plugin. Poste : node 22.23.5, git 2.43.0, `yaml` 2.9.1 installée dans un dossier privé, hors de tout dépôt. Écrit le 2026-11-19 par l'agent de contre-relecture.

Ce dossier porte le rapport et de quoi tout rejouer : voir « Rejouer » et « Les pièces » en fin de rapport. Les chemins sont relatifs à ce dossier.

## Verdict : non conforme

Le calcul répond « non exigée », sortie 0, sans une ligne d'alerte, pour une règle que `yaml` 2.9.1 **et** le schéma strict de la CLI Anchorpost lisent « haute, validée ». Deux causes indépendantes, aucune des deux n'est un des quatre traits d'`A-133`. Quatre bloquants, quatre mineurs. Chaque retouche est nommée ; les cinq retouches du lecteur ont été essayées sur une copie privée (`cinq-retouches.patch`) : banc 44 sur 44, 81 fichiers réels lus sans refus, 1 000 000 de tirages sans lecture plus basse. Depuis, l'architecte a demandé d'éprouver une autre règle, la liste blanche d'`A-143` : son prototype et sa mesure sont la dernière section.

## Constats

### B1 — Un mappage en ligne plié : un texte qui continue sur une ligne commençant par un guillemet, suivi d'un commentaire, fait lire `low` pour `high` et « rejetée » pour « validée »

Fait. Dans un mappage `{ … }` plié, `sansCommentaire` prend un guillemet en début de ligne pour l'ouverture d'une chaîne et garde le ` # …` qui suit. Pour YAML, cette ligne est la suite d'un texte nu : le guillemet est du texte, le `#` ouvre un commentaire. Les lignes sont ensuite jointes et `decouper`, lui, ne voit plus ce guillemet en tête de valeur : le commentaire devient des paires. Le vrai `level` (ou `status`), écrit entre guillemets à la ligne suivante, est avalé par une chaîne que le lecteur croit ouverte.

En-tête minimal :

```yaml
criticality: { by: agent, reason: voir
  ' # , level: low, '
  , level: 'high' }
```

Commande et sortie (`essais/un.mjs` lit un en-tête par le module puis par `yaml` 2.9.1) :

```
$ MODULE=<double-relecture.mjs de 484e991> node essais/un.mjs < cas/b1-flux-plie.txt
  module : {"niveau":"low","code":[],"enVigueur":true}
  yaml   : {"criticality":{"by":"agent","reason":"voir '","level":"high"}}
```

Même forme sur `validation`, fichier entier `cas/b1-regle-haute-validee-lue-rejetee.md` (une règle inventée pour l'essai). Le lecteur réel de la CLI Anchorpost, joué en privé sur ce fichier, hors de ce dossier, le tient pour valide et y lit `criticality: high` et `validation.status: validated`. `yaml` 2.9.1 seule suffit à le revoir :

```
$ MODULE=<…> node essais/reels.mjs cas/b1-regle-haute-validee-lue-rejetee.md
ÉCART cas/b1-regle-haute-validee-lue-rejetee.md {"niveau":"high","code":["apps/api/src/facture/total.ts"],"enVigueur":false} {…,"niveau":"high",…,"statut":"validated","enVigueur":true}
```

De bout en bout, sur dépôt jouet, en ligne de commande (`jouets/s4.sh`) :

```
S8  règle haute et validée (yaml 2.9.1, schéma Anchorpost), citée par le ticket, code touché ; sans index   non exigée  0
S8b la PR crée une règle haute (flux plié, sans « ? »), la cite et écrit son code ; sans index              non exigée  0
S8e la PR crée la règle haute sans régénérer l'index (index en retard)                                      non exigée  0
S8d même règle, avec un index à jour (haute, validée)                                                       exigée     20
```

Portée : sans index, ou avec un index en retard sur la règle. Un index à jour rattrape (S8d).

Retouche. Dans `enLigne`, refuser (« illisible ») un mappage ou une liste pliés dont un saut de ligne ne touche pas un indicateur de flux : la ligne d'avant ne finit pas par `,`, `[` ou `{`, et la ligne d'après ne commence pas par `,`, `]` ou `}`. Un cas du banc par forme (criticité, statut, `code`), et les mutations.

### B2 — La clé explicite (`? clé`) n'est pas refusée : `low` lu pour `high`

Fait. `? ` n'est ni une forme refusée ni une « tête » : un guillemet qui le suit n'est contrôlé ni par `refuserLesFormesNonLues` ni par `enTeteDeValeur`. Le lecteur découpe l'intérieur de la chaîne aux virgules.

En-tête minimal :

```yaml
criticality: { ? "a: 1, level: low, b" : x, ? level : high }
```

```
$ MODULE=<…> node essais/un.mjs < cas/b2-cle-explicite.txt
  module : {"niveau":"low","code":[],"enVigueur":true}
  yaml   : {"criticality":{"a: 1, level: low, b":"x","level":"high"}}
```

Combinée à B1, la forme est valide pour un schéma strict (deuxième cas de `cas/b2-cle-explicite.txt`) :

```yaml
criticality: { ? level : high, by: agent, reason: abc
  "def # , level: low, x: y"
  }
```

```
  module : {"niveau":"low","code":[],"enVigueur":true}
  yaml   : {"criticality":{"level":"high","by":"agent","reason":"abc \"def"}}
```

De bout en bout : `S8c … clé explicite « ? » … non exigée 0` (`jouets/s4.sh`).

Retouche. Un cinquième trait refusé dans `refuserLesFormesNonLues` : `?` suivi d'un blanc ou d'une fin de ligne, en tête. Cas du banc en flux et en bloc.

### B3 — Un statut ou un niveau lu là où YAML ne lit pas cette paire : une règle haute passe pour « rejetée »

Fait. Quatre écritures, même effet : la bibliothèque trouve `criticality: high` et aucun statut `rejected`, le lecteur rend `enVigueur: false` sans refuser, la règle ne compte plus.

| En-tête (sous `criticality: high`) | Module | `yaml` 2.9.1 |
| --- | --- | --- |
| `validation: { status:rejected }` (sans blanc) | hors vigueur | `{"status:rejected": null}` |
| `validation:`⏎`  status:rejected` | hors vigueur | `"status:rejected"` (un texte) |
| `validation:`⏎`<U+00A0>status: rejected` (aussi `\r`, `\f`, `\v`, U+FEFF) | hors vigueur | `validation: null` |
| `validation:`⏎`  status: rejected`⏎`    x` (texte plié) | hors vigueur | `"rejected x"` |
| `validation:`⏎` \|`⏎` status: rejected` | hors vigueur | `"status: rejected\n"` |

Commande : `MODULE=<…> node essais/un.mjs < cas/b3-statut-et-niveau.txt`. De bout en bout (`jouets/s4.sh`) :

```
S8f « status:rejected » sans blanc : yaml n'y lit aucun statut (règle haute, en vigueur)   non exigée  0
S8g « status: rejected » en retrait d'une espace insécable : yaml lit validation vide      non exigée  0
```

Les mêmes écritures sur `level` font lire `low` là où la bibliothèque ne lit aucun `level` (`criticality: { level:low }`, 652 fois sur les 200 000 tirages du générateur de l'annexe, qui écrit lui-même cette forme). Sur `code`, une entrée pliée (`- apps/x`⏎` y/f.ts`) est lue `apps/x` pour `apps/x y/f.ts`.

Causes : `indexOf(':')` et le motif `^nom[ \t]*:` n'exigent pas de blanc après les deux-points ; `trim()` et `\s` prennent pour des blancs des caractères que YAML tient pour du texte ; `premierNiveau` jette les lignes plus profondes sans voir qu'elles prolongent une valeur.

Retouches. (a) Une paire n'est lue que si un blanc ou la fin suit les deux-points, sinon « illisible ». (b) Seules l'espace et la tabulation sont des blancs (ne pas refuser tout l'en-tête pour une espace insécable : un titre français en porte). (c) Une valeur en ligne suivie d'une ligne plus profonde, une forme nue suivie d'une suite, des entrées de `code` à retraits inégaux, `|` ou `>` seul sur sa ligne : « illisible ».

### B4 — À la lettre de la consigne : le lecteur lit des en-têtes que la bibliothèque refuse

Fait. Sur les 200 000 tirages du générateur de l'annexe (`../en-tetes.mjs`, graine d'origine), 2 492 en-têtes sont lus par le lecteur et refusés par `yaml` 2.9.1 ; dans 2 108, la lecture rendue n'est pas « haute et en vigueur ».

```
$ node ../en-tetes.mjs <double-relecture.mjs de 484e991> 200000 | MODULE=<le même> node essais/comparer.mjs
 "tirages": 200000, "refus": 159343,
 "comptes": { "X1-erreur-yaml": 2108, "X1-erreur-yaml-module-haut": 384, … }
```

Exemples minimaux (`cas/b4-lus-refuses-par-yaml.txt`), tous lus `low` (ou `null`) par le module :

| En-tête | Erreur de `yaml` |
| --- | --- |
| `criticality: low`⏎`  level: high` | Nested mappings are not allowed in compact mappings |
| `criticality:`⏎`<tab>level: low` | Tabs are not allowed as indentation |
| `criticality: { level: low, by: agent, reason: voir: ici }` | Block collections are not allowed within flow collections |
| `criticality:`⏎`  level: low`⏎`  reason: @produit` | Plain value cannot start with reserved character @ |
| `criticality:`⏎`  level: 'low'#` | Comments must be separated from other tokens by white space |
| `code: [ >-`⏎`      apps/api/src/bloc.ts ]` | Plain value cannot start with block scalar indicator > |

Le banc lui-même en écrit un : le titre du montage `regle()` (`title: Le total d'une facture est la somme de ses lignes : arrondi au centime`, un texte nu qui porte ` : `) est refusé par `yaml` 2.9.1, « Nested mappings are not allowed in compact mappings ». Tous les fichiers de règle du banc sont donc des en-têtes que la bibliothèque refuse.

Le ticket connaissait cette classe (« 702 lus par le lecteur et refusés par la bibliothèque », sur 80 000) et ne la comptait pas dangereuse : un tel fichier est refusé par la CLI Anchorpost. La consigne de cette contre-relecture la compte. Le corps de la PR et l'en-tête du module écrivent pourtant « ce que ce lecteur ne comprend pas est « illisible » ».

Retouche. À trancher par l'architecte : ou bien la décision dit que cette classe est admise et pourquoi (et le module ne promet plus de refuser ce qu'il ne comprend pas), ou bien le lecteur ferme les familles nommées ci-dessus. Les retouches de B3 (c) en ferment une part ; un lecteur écrit à la main ne les fermera pas toutes.

### m1 — `A-135` : le calcul admet un dépôt que git refuse, quand la remise à zéro est dans la configuration XDG

Fait. `git config --global --get-all` ne lit que `~/.gitconfig` quand il existe, jamais `$XDG_CONFIG_HOME/git/config` en plus ; git, lui, lit les deux. Système : `safe.directory = <dépôt>` ; XDG : `safe.directory =` (vide) ; `~/.gitconfig` présent. Git refuse le dépôt, le calcul le lit.

```
$ bash safe-directory/suite.sh   (dépôt d'un autre propriétaire, uid 65534, créé par safe-directory/preparer.sh)
33 système exact ; XDG remet à zéro ; ~/.gitconfig existe (sans safe)    git:refuse  calcul:non exigée  VIOLATION
34 système exact ; XDG remet à zéro ; pas de ~/.gitconfig                git:refuse  calcul:illisible    ok
35 XDG déclare ; ~/.gitconfig existe (sans safe)                         git:admet   calcul:illisible    ok
```

55 lignes jouées (47 par `safe-directory/matrice.sh`, 8 par `safe-directory/suite.sh`), une seule violation. Les autres tiennent la règle : chemin exact, `*`, barre finale, `dossier/*`, lien symbolique, `~/`, casse, `include`, `includeIf`, remise à zéro globale, `GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS`, vingt-trois valeurs de `GIT_CONFIG_NOSYSTEM`.

Retouche. Lire par `git config --show-scope --includes --get-all safe.directory` depuis `/`, en gardant les lignes `system` et `global` : git y lit les deux fichiers globaux dans son ordre et obéit lui-même à `GIT_CONFIG_NOSYSTEM` (vérifié sur ce poste), ce qui retire aussi le motif écrit à la main d'`A-130`. Un cas du banc.

### m2 — Dix-sept mutations de mon cru restent vertes contre le banc à 44 tests

Fait. 34 mutations inventées (`mutations.txt`, au format du script du ticket, chacune avec son résultat), une à la fois : 14 rouges, 20 vertes. Trois vertes sont équivalentes (C10, C35, C56). Les dix-sept autres changent le comportement.

Neuf font lire plus bas qu'une lecture correcte, chacune montrée sur un cas :

| Mutation | Cas | Module | Mutant |
| --- | --- | --- | --- |
| C1 un `#` collé ouvre un commentaire dans la garde | `{ reason: a#b, r: !!str 'x, level: low, z: "', level: high, by: "agent" }` | refus | `low` (yaml : `high`) |
| C4 `"clé" :` avec un blanc n'est plus une clé entre guillemets | `{ "r" :'x, level: low, z: "', "level" : high }` | refus | `low` (yaml : `high`) |
| C12 `\` entre guillemets doubles lu tel quel | `code: [ "apps/api/total.ts" ]` | refus | chemin faux |
| C14 un `#` collé coupe la valeur | `- apps/api/total#1.ts` | chemin entier | `apps/api/total` |
| C20 une ligne ni clé ni suite est sautée | `? criticality`⏎`: high` | refus | `null` (yaml : `high`) |
| C24 statut incompris : la règle ne compte plus | `validation: validated` | en vigueur | hors vigueur |
| C37 `sansLigne` : le dernier arbre décide | ticket sans ligne sur develop, `Règles: —` à la tête, spec haute | exigée | non exigée |
| C48 `---x` ferme l'en-tête | `---x: 1`⏎`criticality: high` | refus | `null` (yaml : `high`) |
| C52 en vigueur selon l'en-tête seul | index validé, en-tête rejeté, code touché | exigée | non exigée |

Six font lire ce que YAML refuse ou lit autrement (C13, C16, C17, C19, C21, C49) ; deux font refuser plus (C9, C33).

Retouche. Un cas du banc par mutation verte non équivalente, les dix-sept ajoutées au script.

### m3 — Un ticket absent de tous les arbres : sa spec n'est pas lue

Fait. `jouets/s2.sh` :

```
S23  ticket .03 absent partout, sa spec cite une règle haute                    non exigée  0
      # ticket SPEC_ALL_FAC-1.03 absent de origin/develop, ea80a95… : aucun en-tête lu
S23b ticket .03 présent, sans ligne Règles:, sa spec cite une règle haute       exigée     20
```

Le cas 12 bis du ticket décide « non exigée, une remarque » pour un ticket absent, sans parler de la spec, que l'identifiant suffit pourtant à trouver.

Retouche. À trancher : lire la spec aussi quand le ticket n'est trouvé nulle part, ou l'écrire en limite.

### m4 — Trois phrases disent plus que le code

- Note 7.32.0 et corps de la PR : « le calcul n'admet jamais un dépôt que git refuserait » (faux dans le cas m1).
- Corps de la PR, `A-133` : « Le lecteur ne lit jamais plus bas qu'une bibliothèque YAML » (faux : B1, B2).
- En-tête du module : « ce que ce lecteur ne comprend pas est « illisible », jamais « non exigée » » (faux : B1 à B4).

Le reste de la note et le mot de `fusionner/SKILL.md` disent ce que le code fait : aucun script n'appelle le calcul (`grep -rl double-relecture` : le module, son banc, `SKILL.md`, la note) ; posé à plat avec `revue-exigee.mjs`, `depot-jouet.mjs`, `scripts/docs/identifiants.mjs` et `environnement-de-banc.mjs`, le banc passe 44 sur 44 ; sorties 0, 20, 21, 69 vues.

Retouche. Corriger ces phrases avec le code.

## Ce qui tient

1. **La fusion de `main`.** `git diff a018502 484e991 --stat` : cinq fichiers, 2 074 ajouts, 2 retraits. `plugin.json` : la seule ligne `"version"`. Note 7.32.0 en tête (ligne 5), 7.31.1 dessous (ligne 17), identique à `main` jusqu'à la fin du fichier. Le commit de fusion apporte à son premier parent exactement ce que `main` a changé depuis `a3c2a7c`, hors les deux fichiers en conflit. Le module est le même objet qu'à `bfc5ce1` (`79ff8be9…`) ; seul le banc a pris 28 lignes.
2. **Les six cas d'`A-133`** (g1, g2 étiquette et ancre, f1, g5, g7, g8 ancre et alias, scalaire en bloc dans `code` : neuf textes, `cas/a133-six-cas.txt`) : tous refusés, `yaml` y lit « haute ».
3. **Les mutations rejouées** : les onze d'`A-140`, rouges ; « la profondeur de flux n'est plus tenue d'une ligne à l'autre », rouge ; 45 des 171 tirées au hasard (graine 134), rouges. 57 sur 57. Les 171 se refont du ticket et de l'annexe : chaque « ancien » se trouve une fois dans le module.
4. **Les fichiers de règle réels** : les 31 fichiers de règle d'un dépôt de projet, les 49 des bancs de la CLI Anchorpost, le gabarit `regle.md` du plugin (lus sur place, aucun n'est recopié ici) : 81 lus, 0 « illisible », 0 écart avec `yaml` 2.9.1 sur le niveau, le statut et `code`.
5. **`A-130`** : vingt-trois valeurs de `GIT_CONFIG_NOSYSTEM`, le calcul ne lit jamais le système quand git l'écarte ; il lit moins que git pour `0x0`, `0k` et un blanc devant.
6. **Le calcul entier**, 60 histoires sur dépôts jouets (`jouets/s1.sh` à `s4.sh`) : citation par `Règles:`, fichier et code d'une règle haute, suppression, renommage, niveau changé sur la tête, sur `origin/develop` seul, sur la base seule, au départ seul, règle rejetée ou supprimée, index de la tête seul, ticket sur son sujet seul, titre et branche de deux tickets, clone superficiel, partiel, d'une seule branche, sommet inconnu, sous-dossier, arbre de travail lié, index vide, tronqué, d'un autre schéma, sans `rules`, liste, `null`, niveau hors vocabulaire, à marque d'ordre des octets, périmé, contredit par l'en-tête. Toutes rendent l'attendu, hors celles de B1 à B3 et de m3, et deux où mon attente était fausse : un index précédé d'une marque d'ordre des octets est « illisible » (côté sûr), et un index à deux clés `rules` est lu comme `JSON.parse` le lit, la dernière.

## Les comptes

| Tirage contre le module d'origine | Tirés | Comparés | Lus plus bas | « Hors vigueur » à tort | `code` autre | Lus, refusés par `yaml` |
| --- | --- | --- | --- | --- | --- | --- |
| `en-tetes.mjs` de l'annexe | 200 000 | 200 000 | 0 | 0 | 0 | 2 492 |
| `essais/tirage.mjs` (soupe, mutants, lignes, cible ; graines 1, 11, 12, 31, 32) | 1 620 000 | 1 620 000 | 4 | 270 | 629 | 213 094 |
| `essais/valide.mjs` (YAML valide par construction ; graines 1, 101, 102) | 1 230 000 | 878 171 | 11 | 22 | 0 | 7 250 |
| Total | 3 050 000 | 2 698 171 | 15 | 292 | 629 | 222 836 |

Contre la copie retouchée (cinq retouches) : 1 000 000 tirés, 0 lu plus bas, 3 « hors vigueur » à tort (la famille `|` seul, ajoutée depuis à B3), 0 `code` autre.

Le générateur de l'annexe ne fabrique ni clé explicite ni texte plié : son zéro est vrai et ne dit rien de B1 ni de B2.

## Ce que je n'ai pas regardé

- La suite entière (`pnpm test`) et les contrôles de la PR sur GitHub : non joués, non consultés.
- 126 des 171 mutations.
- La forme `{ level, by, reason }` contre un schéma réel au pivot 3 : le schéma dont je disposais est au pivot 2 (forme nue). B1 sur `validation` est vérifié contre ce schéma réel, en privé ; sur `criticality`, contre `yaml` et un schéma écrit par moi d'après le gabarit.
- PyYAML, la référence du ticket : remplacée par `yaml` 2.9.1.
- Un dépôt nu d'un autre propriétaire, un dépôt `sha256`, `git clone --shared`, Windows, le coût sur un grand dépôt.
- Les décisions du ticket lues en entier : seules « Le besoin », 12 à 16, « Vérification », « Ce qui n'a pas été établi », « Hors périmètre » et « Comments » l'ont été. `map.md` non ouvert.
- `README.md`, `CONTENU.md`, `points-d-entree.test.mjs` : hors périmètre décidé.


## Rejouer

Hors du dépôt : copier ce dossier dans un dossier privé, avec `en-tetes.mjs` de l'annexe un cran au-dessus, y lancer `npm install yaml@2.9.1`, cloner le plugin au sommet voulu. `MODULE` est le chemin du `double-relecture.mjs` à lire ; pour le prototype, appliquer d'abord `liste-blanche.patch` au clone.

```bash
MODULE=<clone>/skills/chaine/fusionner/scripts/double-relecture.mjs
MODULE=$MODULE node essais/un.mjs < cas/b1-flux-plie.txt                                  # un cas : le module, puis yaml
node ../en-tetes.mjs $MODULE 200000 | MODULE=$MODULE node essais/comparer.mjs             # le générateur de l'annexe
MODULE=$MODULE node essais/tirage.mjs 41 300000 soupe,mutant,lignes,cible dangers.jsonl   # soupe, mutants, lignes, cible
MODULE=$MODULE node essais/valide.mjs 41 300000 dangers.jsonl                             # YAML valide, toutes écritures
MODULE=$MODULE node essais/presque.mjs 51 300000 dangers.jsonl                            # formes admises, abîmées d'un caractère
MODULE=$MODULE node essais/structure.mjs 61 200000 dangers.jsonl                          # lignes admises, retraits au hasard
MODULE=$MODULE node essais/reduire.mjs S-,N- 100 dangers.jsonl                            # réduit et regroupe les dangers
MODULE=$MODULE node essais/reels.mjs <fichiers de règle>                                  # des fichiers réels contre yaml
MODULE=$MODULE TRAVAIL=<dossier privé> bash jouets/s4.sh                                  # les histoires de bout en bout
TRAVAIL=<dossier privé> bash safe-directory/preparer.sh && MODULE=$MODULE TRAVAIL=<le même> bash safe-directory/suite.sh
```

Le classement de `essais/ref.mjs` a été affiné en cours de route (classes `V` et `Y` ajoutées, chemins de `code` comparés au caractère près) : un rejeu des premières graines peut ranger quelques cas dans une autre colonne que la table des comptes, jamais retirer un « lu plus bas ».

## Prototype de la liste blanche (`A-143`)

L'architecte a demandé d'éprouver la règle inverse : le lecteur n'admet qu'une liste fermée de formes de ligne, et toute ligne hors de cette liste rend le fichier « illisible ». Le prototype est `liste-blanche.patch`, un diff contre le module de `484e991` : une proposition, la session du ticket l'écrira à sa façon.

### Résultat

| Tirage contre le prototype | Tirés | Lus par le prototype | Lus plus bas | « Hors vigueur » à tort | `code` différent | Lus, refusés par `yaml` | Autre écart | Même lecture, hors schéma strict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `../en-tetes.mjs` de l'annexe | 200 000 | 20 223 | 0 | 0 | 0 | 0 | 0 | 1 032 |
| `essais/tirage.mjs`, graine 41 | 300 000 | 4 090 | 0 | 0 | 0 | 0 | 0 | 1 697 |
| `essais/valide.mjs`, graine 41 | 300 000 | 2 110 | 0 | 0 | 0 | 0 | 0 | 0 |
| `essais/presque.mjs`, graines 51 et 52 | 600 000 | 339 085 | 0 | 0 | 0 | 0 | 0 | 10 234 |
| `essais/structure.mjs`, graines 61 et 62 | 400 000 | 25 086 | 0 | 0 | 0 | 0 | 0 | 5 401 |
| Total | 1 800 000 | 390 594 | 0 | 0 | 0 | 0 | 0 | 18 364 |

Les quatre comptes visés sont à zéro. « Autre écart » compte toute différence avec `yaml` 2.9.1, même sans danger (un niveau lu plus haut, un chemin de plus, un niveau lu où la bibliothèque lit autre chose) : zéro aussi. Sur 390 594 en-têtes lus, le prototype lit le niveau, le statut et `code` comme la bibliothèque, au caractère près.

La dernière colonne n'est pas un écart : le prototype et la bibliothèque y lisent la même chose, et seul un schéma strict refuserait le fichier (`validation:` sans `status`, une clé de plus sous `criticality`). La règle y compte comme la bibliothèque la lit ; aucune de ces lectures ne peut rendre « non exigée » à tort.

`presque.mjs` écrit un en-tête dans les seules formes admises, puis l'abîme d'un caractère (inséré, retiré, remplacé) ou d'une torsion visée (plus de blanc après les deux-points, une ligne plus profonde après une valeur, une clé en double ou presque, un retrait décalé, un indicateur devant une valeur, un flux plié, une chaîne non refermée, un scalaire en bloc). Un cinquième des tirages n'est pas abîmé : 119 861 en-têtes intacts, tous lus par le prototype, aucun refusé par `yaml`.

Deux formes ne viennent pas du tirage, mais de la lecture des règles de la bibliothèque, et un tirage ne les aurait pas trouvées. Le prototype les refuse (`cas/liste-blanche-cles.txt`) :

- `true: a` puis `True: b` : pour YAML, deux fois la même clé (un booléen), « Map keys must be unique ». Une clé n'est donc jamais `true`, `false` ni `null`, sous aucune casse.
- une clé de plus de 1 024 caractères : « The : indicator must be at most 1024 chars after the start of an implicit block mapping key ». Une clé a 100 caractères au plus.

### Les formes retenues

Tout l'en-tête est lu, pas trois clés seulement : une ligne hors liste sous `sources:` ou `extensions:` rend le fichier « illisible » comme une autre. Le lecteur construit l'arbre entier, puis y prend `criticality`, `code` et `validation.status`.

| Forme | Admise | Refusée |
| --- | --- | --- |
| Ligne vide, ligne de commentaire | à tout retrait | |
| Retrait | des espaces ; toutes les lignes d'un bloc au même retrait ; un bloc plus profond que sa clé | une tabulation, un retrait entre deux niveaux, un premier niveau hors de la première colonne |
| `clé: valeur` | clé nue `[A-Za-z_][A-Za-z0-9_-]*`, 100 caractères au plus, `:` collé à la clé, puis une espace au moins | clé entre guillemets, `? clé`, `clé :`, `clé:valeur`, `true`, `false`, `null`, une clé écrite deux fois dans son mappage |
| `clé:` seule | suivie d'un bloc plus profond (mappage ou liste), d'une liste au même retrait, ou de rien | une valeur à la ligne suivante qui n'est ni une clé ni un élément de liste (texte plié, `{`, `[`, `\|`, `>`) |
| `- valeur`, `- clé: valeur`, `- clé:` | une espace après le tiret ; le mappage d'un élément est au retrait de sa clé | `-` seul, `- - x`, deux espaces après le tiret |
| Scalaire nu, en bloc | commence par une lettre, un chiffre, `.` ou `_` ; ` #` ouvre le commentaire | `: ` dans le texte, `:` final, tout autre premier caractère (`!`, `&`, `*`, `\|`, `>`, `@`, `%`, `-`, `?`, un guillemet non refermé) |
| `"…"`, `'…'` | ouverte et fermée sur la ligne ; `\"` et `\\` entre guillemets doubles, `''` entre apostrophes | tout autre échappement, une chaîne non refermée, du texte après la fermeture |
| `{ clé: scalaire, … }`, `[ scalaire, … ]` | sur une ligne ; `{}` et `[]` ; scalaires entre guillemets, ou nus dans l'alphabet lettres, chiffres, espace, `_ . / ( ) ' ’ « » ; -` | sur plusieurs lignes, imbriqués, virgule finale, clé sans valeur, `clé:valeur` |
| Commentaire de fin de ligne | une espace au moins avant `#` | `#` collé à une chaîne ou à un crochet |
| Valeur suivie d'une ligne plus profonde | | toujours |
| Caractères | | tabulation, `\r` isolé, caractère de commande, marque d'ordre des octets (elle n'est plus retirée), espace insécable et autres blancs ou marques invisibles d'Unicode, U+FFFD |
| `criticality` | `low`, `medium`, `high`, nue ou entre guillemets ; ou un mappage, en bloc ou en ligne, dont `level` est un de ces mots | clé sans valeur, mappage sans `level`, autre mot |
| `code` | une liste, en bloc ou en ligne, de textes non vides | un texte, un mappage, un chemin vide, un chemin nu que YAML lit comme un nombre, un booléen ou nul |
| `validation.status` | lu quand `validation` est un mappage et `status` un scalaire | rien : sans statut lu, la règle compte |

Par rapport à l'énoncé d'`A-143`, trois formes de plus, chacune sûre pour YAML et écrite quelque part :

- **le mappage et la liste en ligne, sur une seule ligne** : le gabarit `regle.md` les écrit (`- { ref: …, path: … }`, `code: [ … ]`, `criticality: { level, by, reason }`), les fichiers réels écrivent `epics: [x]` ;
- **le commentaire**, en ligne entière et en fin de ligne : le gabarit en porte à chaque clé ;
- **la liste au retrait de sa clé** (`code:` puis `- …` sans retrait) : aucun fichier réel ni gabarit ne l'écrit, mais PyYAML l'écrit par défaut et le banc actuel la lit. À retirer si l'architecte la veut plus étroite : une ligne du prototype.

Et, pour les fichiers réels : les listes de mappages en bloc (`- clé: valeur` puis des clés au retrait de la première), à des retraits de 0 à 8.

### Les fichiers réels

Les 80 fichiers de règle réels (31 d'un dépôt de projet, 49 des bancs de la CLI Anchorpost) : 80 lus, 0 « illisible », 0 écart avec `yaml` 2.9.1. Leurs en-têtes ne portent que huit formes : `clé: nu`, `clé: "…"`, `clé: '…'`, `clé: [a, b]`, `clé:`, `- nu`, `- clé: nu` et `- clé: "…"`, à des retraits de 0, 2, 4, 6 et 8 ; ni commentaire, ni tabulation, ni espace insécable.

Le gabarit `regle.md`, lui, n'est plus lu tant qu'il n'est pas rempli : ses jokers `{{…}}` en tête de valeur sont pour YAML des mappages imbriqués à clé seule, et un schéma strict refuse déjà ce fichier. Rempli, il est lu : `cas/gabarit-rempli-en-ligne.md` (toutes ses lignes décommentées, forme `{ level, by, reason }` en ligne), `cas/gabarit-rempli-en-bloc.md` (la forme que le skill `criticite` écrit) et `cas/forme-nue-pivot-2.md`, 3 lus, 0 écart.

### Le banc actuel

Avec le prototype et le banc de `484e991` tel quel : 18 verts, 26 rouges. Vingt-trois des vingt-six le sont pour une seule ligne : le titre du montage `regle()`, un texte nu qui porte ` : `, que `yaml` refuse aussi (constat B4). Ce titre mis entre guillemets, trois tests changent d'attendu, treize assertions :

| Test | Assertion | Attendu d'avant | Attendu avec la liste blanche |
| --- | --- | --- | --- |
| « les formes lues, et ce qui est refusé plutôt que deviné » | huit lectures d'un mappage ou d'une liste pliés sur plusieurs lignes (lignes 509, 511 à 514, 516, 521, 528) | lus | « illisible » |
| le même | marque d'ordre des octets, `\r\n`, `validation` en ligne (ligne 530) | lu | « illisible » pour la marque ; `\r\n` et `validation` en ligne restent lus |
| « une clé entre guillemets, une étiquette, une ancre… » (`A-133`) | « ce qui reste lu » : `note: \|` et `autre: >-` | lus | « illisible » ; le guillemet, l'étoile et le `!` dans un texte nu restent lus |
| « un trait interdit après une virgule… » (`A-133`, `A-140`) | trois « ce qui reste lu », qui portent un scalaire en bloc | lus | « illisible » |

Tout ce que ces trois tests exigeaient « illisible » le reste. `banc-liste-blanche.patch` porte ces changements : 44 sur 44 avec le prototype. Le test de temps linéaire passe (trois en-têtes de 300 000 caractères en 60 ms). Des 182 mutations, 43 visent des lignes que la liste blanche retire (la garde des formes, le découpage, le commentaire) : elles sont à récrire pour le nouveau lecteur, comme 17 de mes 34.

De bout en bout, avec le prototype : les 53 histoires ordinaires de `jouets/s1.sh` à `s3.sh` rendent ce qu'elles rendaient (52 conformes, plus m3) ; les sept de `jouets/s4.sh` rendent « illisible », sortie 21, au lieu de « non exigée ».

### Avis

**La liste blanche ferme la famille.** Les cinq contre-relectures ont trouvé chacune une forme que le lecteur lisait autrement que YAML, parce qu'il lisait trois clés et devinait le reste. Ici il n'y a plus rien à deviner : chaque ligne admise n'a qu'un sens pour YAML, l'arbre entier est construit, et la mesure le montre au caractère près. Une lecture plus basse demanderait une ligne admise que YAML comprend autrement ; je n'en vois pas, et 1 800 000 tirages n'en ont pas trouvé.

**Ce qui peut rester : des en-têtes lus que `yaml` refuse, pour une règle propre à la bibliothèque.** J'en ai trouvé deux par la lecture de ses règles, pas par le tirage ; il peut en rester de cette sorte. Elles ne peuvent pas rendre « non exigée » à tort : la valeur lue est celle qui est écrite sur la ligne, la bibliothèque refuse le fichier pour une autre ligne.

**Le prix est ailleurs, et il est réel.**

- Un formateur qui plie un mappage en ligne trop long rend la règle « illisible ». Le gabarit montre `criticality: { level, by, reason }` en ligne, avec une raison en texte libre : c'est la forme qui dépasse 80 colonnes. Le skill `criticite` écrit la forme en bloc. À aligner : le gabarit devrait montrer la forme en bloc.
- Un seul en-tête hors liste rend illisible tout l'arbre où il se trouve, donc toute PR du dépôt, jusqu'à sa correction. C'est le côté sûr, et c'est bruyant. La même lecture devrait tourner dans un gate du projet, pour que l'auteur le voie à son commit et pas le Relecteur à la PR.
- Un chemin de `code` qui commence par autre chose qu'une lettre, un chiffre, `.` ou `_`, ou qui porte un crochet dans une liste en ligne, s'écrit entre guillemets.

**Hors du lecteur d'en-tête, rien ne change** : m1 (`safe.directory`), m3 (ticket absent) et les trous du banc sur le reste du calcul (C24, C37, C52 de `mutations.txt`) restent à traiter.

**Taille.** La section du lecteur est remplacée d'un bloc : 246 lignes retirées, 230 posées, commentaires compris (le module passe de 929 à 913 lignes). `enTeteDeValeur`, `fermeture`, `refuserLesFormesNonLues`, `decouper`, `valeurEnLigne`, `interieur`, `mappageEnLigne`, `sansCommentaire`, `premierNiveau`, `enLigne` et `champ` disparaissent ; `scalaire` ne sert plus qu'à la ligne `Relecture:` d'un ticket. Le reste du module ne change pas d'une ligne ; l'en-tête du fichier, qui décrit le lecteur (lignes 30 à 43), est à récrire avec.

## Les pièces

- `rapport.md` : ce rapport.
- `essais/ref.mjs` : la référence (un découpage d'en-tête écrit pour l'essai, `yaml` 2.9.1) et le classement ; `un.mjs` (un cas), `comparer.mjs` (le générateur de l'annexe), `tirage.mjs`, `valide.mjs`, `presque.mjs`, `structure.mjs` (les générateurs), `reduire.mjs` (réduction et regroupement), `reels.mjs` (des fichiers réels).
- `cas/` : `b1-flux-plie.txt`, `b1-regle-haute-validee-lue-rejetee.md`, `b2-cle-explicite.txt`, `b3-statut-et-niveau.txt`, `b4-lus-refuses-par-yaml.txt`, `a133-six-cas.txt`, `liste-blanche-cles.txt`, `gabarit-rempli-en-ligne.md`, `gabarit-rempli-en-bloc.md`, `forme-nue-pivot-2.md`. Les règles y sont inventées.
- `jouets/lib.sh`, `s1.sh` à `s4.sh` : le calcul entier sur dépôts jouets ; `s4.sh` porte les histoires de B1 à B3.
- `safe-directory/preparer.sh`, `matrice.sh`, `suite.sh` : m1 est la ligne 33 de `suite.sh`.
- `mutations.txt` : mes 34 mutations au format du script du ticket, chacune avec son résultat.
- `liste-blanche.patch` : le prototype. `banc-liste-blanche.patch` : le banc adapté. `cinq-retouches.patch` : les cinq retouches d'avant, pour mémoire.
