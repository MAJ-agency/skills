# Annexes d'`A-151` : la troisième forme de Prettier admise (ticket 60, PR 134)

Ce qui a servi à prouver le sommet `06f75d40480353a3e067b1a70304d4fba260d198` de la PR 134, le 2026-11-19 (le sommet suivant, `719f531`, ne fait que fusionner `main` : le module et son banc n'y changent pas). Outils : node 22, `yaml` 2.9.1 et Prettier 3.10.1, installés dans un dossier privé hors de tout dépôt. Rien d'ici n'entre dans le plugin. `<clone>` est un clone du plugin au sommet voulu.

## `mutations-a151.py` : les 331 mutations

Le fichier est tel qu'il a été joué. Il se compose ainsi :

- les 296 de `../a-143/mutations.py` ; trois d'entre elles (« l'ouvrant d'un mappage plié suit un commentaire », « … à tout retrait », « une ligne vide entre la clé et l'ouvrant ») ont leur ancien prolongé de ``suivante, `l'ouvrant``, parce que la retouche reprend la même condition ;
- les 22 de `../contre-relecture-d5fdcea/mutations.py`, telles quelles ;
- 13 neuves, `A-151 T1` à `T13`, sur la forme nouvelle.

Le banc se pose à plat et le script se lance comme dans `../a-143/LISEZ-MOI.md` :

```bash
TRANCHE=i/4 python3 mutations-a151.py <copie i>/scripts/chaine   # i = 0 … 3, quatre copies en parallèle
```

Vu : 330 rouges sur 331 (83, 82, 83, 82 par tranche), aucun « ancien » introuvable ou en double. La seule verte est N18 (« un en-tête hors liste efface aussi la lecture de l'index »). Le rapport de `../contre-relecture-d5fdcea/` la dit équivalente pour le verdict : la cause « en-tête illisible » est toujours là quand l'effacement a lieu, et seules des lignes de cause de la même règle tombent.

## `tiers.mjs` : la forme nouvelle et ses voisines

C'est `../a-143/essais/presque-plie.mjs`, où un pli sur deux devient la troisième forme : `clé:`, puis le flux entier sur la ligne suivante. Ce pli est écrit à l'exact (retrait R+2) sept fois sur dix. Les autres fois, on tire une voisine :

- un autre retrait : R+0, R+1, R+3, R+4 ou R+6 ;
- un commentaire ou des espaces après la clé ;
- une ligne vide ou un commentaire entre la clé et le flux ;
- une ligne de plus après le flux.

La forme est aussi écrite sous une clé imbriquée et sous la clé d'un élément de liste. Il se joue comme `presque-plie.mjs`, à côté de `ref.mjs` (voir `../a-143/LISEZ-MOI.md`).

```bash
node essais/tiers.mjs 71 300000 dangers.jsonl        # puis la graine 72
# La forme exacte seule, intacte : voisines et bruits retirés, quatre plis sur cinq dans la forme nouvelle.
sed "s/const voisine = () => (p(0.7)/const voisine = () => (p(2)/; s/p(0.9) ? ''/p(2) ? ''/g; s/  if (p(0.5)) return tiers(R, cle, entrees, map);/  if (p(0.8)) return tiers(R, cle, entrees, map);/" essais/tiers.mjs > essais/tiers-exact.mjs
PART_INTACTE=1 node essais/tiers-exact.mjs 81 100000 dangers.jsonl
```

## Les comptes, au sommet `06f75d4`

| Générateur | Tirés | Lus | Lus plus bas que `yaml` | « Hors vigueur » à tort | `code` différent | Lus là où `yaml` refuse | `X3` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `en-tetes.mjs` | 200 000 | 21 496 | 0 | 0 | 0 | 0 | 1 117 |
| `tirage.mjs`, graine 41 | 300 000 | 5 408 | 0 | 0 | 0 | 0 | 1 944 |
| `valide.mjs`, graine 41 | 300 000 | 2 181 | 0 | 0 | 0 | 0 | 0 |
| `presque-plie.mjs`, graines 51, 52 | 600 000 | 347 183 | 0 | 0 | 0 | 0 | 8 636 |
| `structure-plie.mjs`, graines 61, 62 | 400 000 | 8 254 | 0 | 0 | 0 | 0 | 1 732 |
| `tiers.mjs`, graines 71, 72 | 600 000 | 214 023 | 0 | 0 | 0 | 0 | 5 734 |
| `tiers-exact.mjs`, graine 81, intacts | 100 000 | 100 000 | 0 | 0 | 0 | 0 | 0 |
| Total | 2 500 000 | 698 545 | 0 | 0 | 0 | 0 | 19 163 |

Les classes sont celles de `ref.mjs`. `X3` : même lecture que la bibliothèque, qu'un schéma strict seul refuserait. Dans `tiers.mjs`, les « intacts refusés par le module » (23 818 et 23 680) sont les voisines tirées sans abîmure : ces refus sont voulus.

Prettier 3.10.1 a été joué sur les sept entrées de `../a-143/prettier/entrees/`, aux réglages par défaut (avec et sans `--prose-wrap always`) et au réglage du socle (`printWidth: 100`, `trailingComma: all`). Aucune sortie n'est lue autrement que par `yaml`. Au réglage du socle, `nue.md` et `en-ligne.md` prennent la troisième forme et sont lues. Restent refusées `en-ligne-nu.md` et les sorties `--prose-wrap always` d'`en-bloc.md`, `en-ligne.md` et `imbrique.md`. Les deux sorties réelles recopiées au banc (au réglage du socle, et imbriquée) viennent de ce même Prettier.
