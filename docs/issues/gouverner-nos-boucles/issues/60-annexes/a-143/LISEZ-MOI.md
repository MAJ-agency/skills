# Annexes d'`A-143` : le lecteur d'en-têtes à liste fermée (ticket 60, PR 134)

Ce qui a servi à prouver le sommet `d5fdcea2f69a7c3fd5a46e675b9d1e0f9819dfd6` de la PR 134, le 2026-11-19 : node 22, git 2.43.0, `yaml` 2.9.1 et Prettier 3.10.1 installés dans un dossier privé, hors de tout dépôt. Rien d'ici n'entre dans le plugin. Les chemins sont relatifs à ce dossier ; `<clone>` est un clone du plugin au sommet voulu.

## `mutations.py` : les 296 mutations

Chaque mutation est jouée seule sur `double-relecture.mjs`, le banc est lancé, le fichier est remis ; « rouge » : le banc échoue. Le script refuse de partir si le banc est rouge sans mutation, nomme toute mutation restée verte et tout « ancien » qui ne se trouve pas exactement une fois dans le module, et sort en 0 si toutes sont rouges.

Poser le banc à plat, puis lancer :

```bash
D=<dossier privé>; R=<clone>/skills/monorepo/socle-monorepo/references/scripts/docs
mkdir -p $D/scripts/chaine $D/scripts/docs
cp <clone>/skills/chaine/fusionner/scripts/{double-relecture.mjs,double-relecture.test.mjs,revue-exigee.mjs} <clone>/skills/chaine/sujet/scripts/depot-jouet.mjs $D/scripts/chaine/
cp $R/identifiants.mjs $R/environnement-de-banc.mjs $D/scripts/docs/
python3 mutations.py $D/scripts/chaine          # 296 rouges sur 296, une heure environ
```

`TRANCHE=i/n python3 mutations.py <copie i>` ne joue que les mutations de rang `i` modulo `n` : `n` copies du dossier, `n` passages en parallèle (quatre tranches : un quart d'heure). Vu : 296 rouges sur 296.

D'où elles viennent : 142 des 182 d'avant et des 34 du contre-relecteur (`../contre-relecture-484e991/mutations.txt`), celles dont la ligne existe encore dans le module ; 154 neuves, nommées `A-143 : …`, `m1 : …`, `m3 : …`. Écartées, avec leur raison : C35 (équivalente selon le rapport) ; « `-` sans espace ouvre un élément » (la liste rendue est vide, la ligne reste refusée par le contrôle final).

## `essais/` : les deux générateurs étendus aux formes d'un formateur

`presque-plie.mjs` et `structure-plie.mjs` sont `presque.mjs` et `structure.mjs` de `../contre-relecture-484e991/essais/`, étendus aux mappages et listes pliés de Prettier (formes intactes aux retraits exacts, puis abîmées). Ils se jouent à côté de `ref.mjs`, dans une copie privée de ce dossier-là, avec `en-tetes.mjs` de l'annexe un cran au-dessus :

```bash
cp -r ../contre-relecture-484e991 <privé>/essai && cp ../en-tetes.mjs <privé>/ && cp essais/*.mjs <privé>/essai/essais/
cd <privé>/essai && npm install yaml@2.9.1
export MODULE=<clone>/skills/chaine/fusionner/scripts/double-relecture.mjs
node ../en-tetes.mjs $MODULE 200000 | node essais/comparer.mjs                      # resultats/annexe.json
node essais/tirage.mjs 41 300000 soupe,mutant,lignes,cible dangers.jsonl            # resultats/tirage.json
node essais/valide.mjs 41 300000 dangers.jsonl                                      # resultats/valide.json
node essais/presque-plie.mjs 51 300000 dangers.jsonl                                # resultats/p51.json ; graine 52 : p52.json
node essais/structure-plie.mjs 61 200000 dangers.jsonl                              # resultats/s61.json ; graine 62 : s62.json
```

## `resultats/` : les sept sorties, 1 800 000 tirages

Les classes sont celles de `ref.mjs`. Les quatre comptes visés sont les classes `S-B`/`N-B` (lu plus bas que `yaml`), `S-D`/`N-D` (« hors vigueur » à tort), `S-E`/`N-E` (un chemin de `code` manquant) et `X1`/`X2` (lu là où `yaml` refuse) ; `V` et `Y` sont les autres écarts. Aucune de ces classes ne paraît dans les sept fichiers : seule `X3`, même lecture que la bibliothèque, qu'un schéma strict seul refuserait.

| Fichier | Tirés | Lus par le lecteur | `X3` |
| --- | --- | --- | --- |
| `annexe.json` | 200 000 | 21 496 | 1 117 |
| `tirage.json` | 300 000 | 5 289 | 1 881 |
| `valide.json` | 300 000 | 2 135 | 0 |
| `p51.json`, `p52.json` | 600 000 | 346 481 | 8 632 |
| `s61.json`, `s62.json` | 400 000 | 8 244 | 1 729 |
| Total | 1 800 000 | 383 645 | 13 359 |

Des 119 977 en-têtes intacts de `presque-plie.mjs`, aucun n'est refusé par le lecteur ni par `yaml`.

## `prettier/` : ce que le formateur fait d'un en-tête de règle

`entrees/` : des en-têtes de règle inventés dont un mappage ou une liste en ligne dépasse la largeur. `sorties/` : ce que Prettier 3.10.1 en écrit, réglages par défaut ; `en-bloc.prose-wrap-always.md` avec `--prose-wrap always`.

```bash
npm install prettier@3.10.1 && for f in prettier/entrees/*.md; do npx prettier $f; done
```

Lues par le lecteur au sommet `06f75d4` (troisième forme admise, `A-151`) : toutes les sorties, aux réglages par défaut comme au réglage du socle (`printWidth: 100`, `trailingComma: all`, sous lequel `nue.md` et `en-ligne.md` prennent la troisième forme, le flux seul sur la ligne qui suit sa clé), sauf `en-ligne-nu.md` (un texte nu à virgule, coupé en deux entrées dont la seconde n'a pas de valeur) et `en-bloc.prose-wrap-always.md` (une chaîne pliée sur deux lignes), hors liste, donc « illisible ». Au sommet `d5fdcea`, la troisième forme était refusée (contre-relecture du même jour, `A-151`). Les sorties de `en-ligne.md` et d'`imbrique.md` sont recopiées dans le banc.
