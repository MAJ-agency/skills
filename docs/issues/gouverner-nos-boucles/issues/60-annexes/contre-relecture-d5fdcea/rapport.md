# Contre-relecture n° 2 de la PR 134 (ticket 60, « double relecture exigée »), sommet d5fdcea

Sommet relu : `d5fdcea2f69a7c3fd5a46e675b9d1e0f9819dfd6` (branche `claude/ticket-60-double-relecture`), base `origin/main` à `988a6c3`, dans un clone privé (`clone/`, `git -C clone rev-parse HEAD` → ce sha ; `gh api repos/MAJ-agency/skills/pulls/134` → même tête, PR ouverte). Le premier agent a été coupé presque au départ ; cette session a repris son dossier, ses copies (`priv/`, `plat/`, `lab/`) et ses premiers tirages (`res/p151` … `v141`, comptés à part).

## Verdict : conforme après retouches

La propriété de sûreté tient sur tout ce que j'ai pu frapper : **aucune réponse « non exigée » à tort**, aucun en-tête lu plus bas que `yaml` 2.9.1, aucun « hors vigueur » à tort, aucun `code` différent, aucun en-tête lu là où `yaml` refuse — sur 3 227 776 en-têtes tirés ou énumérés contre le sommet par cette session (dont 1 527 776 énumérés exhaustivement), plus 540 552 placements de caractères, 103 cas à la main, 80 fichiers de règle réels, 30 histoires de bout en bout et 55 lignes `safe.directory`. Mon juge compare **l'arbre entier** du lecteur à celui de `yaml`, pas seulement les trois clés : zéro écart partout.

Un défaut livré (B1, côté sûr) et deux mineurs. Retouches nommées :

1. **B1** — admettre la troisième forme de Prettier (`clé:` puis le flux entier, seul, sur la ligne suivante, au retrait R+2), avec un cas du banc et ses abîmées ; corriger la note 7.32.0, l'en-tête du module et le `LISEZ-MOI.md` de l'annexe (« deux formes », « deux écritures de Prettier restent hors liste »). Prototype de 7 lignes éprouvé (`moi/p1/retouche-p1.patch`).
2. **m1** — deux cas au banc : un statut voisin de `rejected` (`rejected x`) reste en vigueur ; `code:` vide suivi d'une clé sœur est « illisible ».
3. **m2** — quatre précisions de texte (note et en-tête du module).

## Préparation

- `git diff 988a6c3 d5fdcea --stat` : cinq fichiers (plugin.json, NOTES-DE-VERSION.md, fusionner/SKILL.md, double-relecture.mjs, double-relecture.test.mjs), 2 518 ajouts, 2 retraits. `git ls-remote origin refs/heads/claude/ticket-60-annexes` : vide.
- Poste : node 22.23.5, git 2.43.0, 4 cœurs partagés (charge 7 à 10 pendant les mutations), `yaml` 2.9.1 et Prettier 3.10.1 dans `lab/`, hors dépôt (`npm view prettier dist-tags` → `latest: '3.10.1'`, la dernière 3.x). Pas de `graphify-out/` dans le clone. Tout `TMPDIR` sous `tmp/`.
- Banc posé à plat (`plat/scripts/chaine`, `plat/scripts/docs`, `cmp` contre le clone : égaux) : `node --test scripts/chaine/double-relecture.test.mjs` → `# pass 47`, `# fail 0`. Suite entière non lancée (consigne).
- La CLI Anchorpost du dépôt de projet lit l'en-tête par `yaml` 2.9.1, options par défaut, entre deux lignes `---` (espaces ou tabulations finales admises), CRLF ramenés à LF : la référence `ref.mjs` de l'annexe de 484e991 et mon juge découpent de même.
- Mes outils (`moi/`) : `arbre.mjs` (l'arbre entier du lecteur, par une copie instrumentée `moi/arbre/dr-arbre.mjs` = le module plus deux exports, contre l'arbre de `yaml`) ; `un-arbre.mjs` (cas à la main) ; `gen.mjs` (mon générateur) ; `enum.mjs` (énumération exhaustive) ; `unicode.mjs` ; `reels.mjs` (fichiers réels, comptes seuls) ; `prettier-lire.mjs` ; `jouets/s5.sh`, `h6seul.sh`, `h8.sh` ; `mut/` (mutations) ; `comparer-controles.mjs`, `controles-hasard.mjs`, `gen-controles.mjs` (les contrôles retirés).

## Le lecteur lu comme du code (point 1)

Formes admises, telles que le code les tient (lignes 131-429) : ligne vide ou d'espaces ; commentaire à tout retrait ; `clé: valeur` ; `clé:` suivie d'un bloc plus profond, d'une liste au même retrait, ou de rien ; `- valeur` ; `- clé: valeur` / `- clé:` (le mappage au retrait du tiret plus 2) ; valeurs : nu (premier caractère lettre, chiffre, `.`, `_` ; ni `: ` ni `:` final ; ` #` ouvre le commentaire), `"…"` (seuls `\"` et `\\`), `'…'` (`''`), `{ clé: scalaire, … }` et `[ scalaire, … ]` sur la ligne (nu de flux : lettres, chiffres, espace, `_ . / ( ) ' ’ « » ; -`) ; les plis de Prettier (`clé: {`, `clé:` puis `{` à R+2, `- {`, entrées à R+4 suivies de leur virgule, fermant à R+2, commentaire après le fermant). Clé `[A-Za-z_][A-Za-z0-9_-]*`, 100 caractères au plus, ni booléen, ni nul, ni nombre, jamais deux fois dans un mappage. Alphabet : tout sauf C0, DEL à U+00A0, U+00AD, U+1680, U+180E, U+2000-200F, U+2028-202F, U+205F-206F, U+3000, U+FEFF, U+FFFD-FFFF. Retrait : des espaces.

Pour chaque forme, j'ai cherché une écriture admise que `yaml` lirait autrement (liste au retrait de sa clé dans un élément de liste, flux plié dans un élément, `...` et `---` dans l'en-tête et dans une valeur, `<<`, `yes:`/`Yes:`, typage des nus de `code`, guillemets et apostrophes dans un pli, virgule dans un nu, `#` collé, deux-points sans blanc, clé vide, retraits décalés, fermant suivi d'autre chose, pli dans un pli, ligne vide ou commentaire ou fin de fichier dans le pli, caractères de commande, insécable, tabulation, `\r`, BOM, formes YAML 1.1) : **aucune**. Cas à la main (`moi/h1.txt`, `moi/h2.txt`) : 103 en-têtes, 57 lus, 0 arbre différent, 0 lu là où `yaml` refuse.

Ce qui est neuf depuis le prototype :

- **Les plis de Prettier** : tenus (un pli lu n'a qu'un sens pour `yaml` : chaque entrée finit par sa virgule sur sa ligne, le scalaire y est fermé). Seul trou : la troisième forme du formateur, qu'ils n'admettent pas (B1).
- **Le chemin « cause, sortie 20 »** : voir les histoires ; une règle hors liste est une cause sur chacun des quatre arbres lus (base, tête, `origin/develop`, départ).
- **Les contrôles d'alignement retirés** (« redondants avec le contrôle final », corps de la PR) : j'ai remis dans une copie les quatre du prototype (valeur suivie d'une ligne plus profonde, dans un mappage et dans une liste ; fin de mappage et fin de liste devant une ligne plus profonde) et comparé ce qu'elle accepte au sommet : `comparer-controles.mjs` → `{"n":1254630,"diff":0}` (toutes les suites de 1 à 3 lignes d'un alphabet de 30 formes × 7 retraits) ; `controles-hasard.mjs 5 1000000` → `diff: 0` ; `gen-controles.mjs 401 500000` → `{"lusA":90495,"diff":0}`. Redondants, comme dit.
- **Le code dit mort et retiré** : `~` dans `PAS_UN_TEXTE` (un nu ne commence jamais par `~`, une clé non plus : mort) ; dans `scalaire()` (ligne `Relecture:`), le contrôle de la barre oblique inverse et `''` : toute valeur qui en porte ressort différente de `double`, donc « illisible » comme avant. Mort aussi.

## Constats

### B1 — La troisième forme de Prettier, la plus courante sous le réglage du socle, est hors liste ; la note dit qu'il n'en reste que deux

Gravité : B au sens « défaut livré » (côté sûr : « exigée », jamais « non exigée »).

Fait. Un mappage ou une liste en ligne trop longs pour la ligne de leur clé, mais qui tiennent seuls sur la ligne suivante : Prettier 3.10.1 écrit `clé:` puis, au retrait R+2, **le flux entier sur une ligne**. Le lecteur refuse cette ligne ; `yaml` y lit l'arbre d'origine. Le socle pose `printWidth: 100` (`skills/monorepo/socle-monorepo/references/racine/.prettierrc`) et passe chaque `.md` stagé par `prettier --write` (`racine/package.json`, `lint-staged`, ligne 44 ; `format:check` à côté) : la forme repliée revient à chaque commit. Une liste `code:` de trois chemins ordinaires suffit.

```
$ cd moi/p1 && cp <clone>/skills/monorepo/socle-monorepo/references/racine/.prettierrc . \
    && prettier RULE_ALL_FAC-16.md > formate.md && diff RULE_ALL_FAC-16.md formate.md
< code: [apps/api/src/facture/total.ts, apps/api/src/facture/lignes.ts, apps/web/src/facture/total.tsx]
> code:
>   [apps/api/src/facture/total.ts, apps/api/src/facture/lignes.ts, apps/web/src/facture/total.tsx]
RULE_ALL_FAC-16.md
  module : {"niveau":"high","code":["apps/api/src/facture/total.ts",…],"enVigueur":true}
formate.md
  module : ILLISIBLE ligne 6 : ni `clé: valeur`, ni `clé:`, ni `- valeur` : [apps/api/src/facture/total.ts, apps/api/src/facture/lignes.
  yaml   : {…,"criticality":"high","code":["apps/api/src/facture/total.ts","apps/api/src/facture/lignes.ts","apps/web/src/facture/total.tsx"],…}
```

La forme du gabarit, `criticality: { level: high, by: agent, reason: "…" }`, y tombe dès qu'une raison passe une cinquantaine de caractères (`moi/p1/crit.md`, réglages par défaut → `criticality:`⏎`  { level: high, by: agent, reason: "Une erreur sur le total coûte de l'argent au client" }` → « ILLISIBLE ligne 4 »).

Prettier sous dix réglages, 22 entrées (les 7 de l'annexe, les 3 gabarits remplis de 484e991, 12 à moi : valeurs longues et moyennes, commentaires, apostrophes, retraits profonds, clés longues ; `moi/prettier-lire.mjs`, `res/prettier-sommet.txt`) : 220 sorties, 128 lues, 92 refusées, **0 lue autrement que `yaml`**. Des refus, 16 sont la troisième forme, et le prototype les lit (`res/prettier-proto.txt`) :

| Réglage | Sorties | Lues | Refusées | dont la troisième forme |
| --- | --- | --- | --- | --- |
| défaut | 22 | 17 | 5 | 2 |
| socle (`printWidth: 100`, `trailingComma: all`) | 22 | 16 | 6 | 3 |
| `proseWrap: always` | 22 | 7 | 15 | 1 |
| socle + `proseWrap: always` | 22 | 8 | 14 | 2 |
| `trailingComma: none` | 22 | 6 | 16 | 0 |
| `trailingComma: es5` | 22 | 17 | 5 | 2 |
| `printWidth: 40` | 22 | 17 | 5 | 2 |
| `tabWidth: 4` | 22 | 6 | 16 | 0 |
| `singleQuote` | 22 | 17 | 5 | 2 |
| `bracketSpacing: false` | 22 | 17 | 5 | 2 |

Sous le réglage du socle, les six refus sont : trois fois la troisième forme (`nue.md`, `en-ligne.md` de l'annexe, `cle-longue.md`), deux textes nus à virgule dans un mappage en ligne (refus annoncé), un flux imbriqué (hors liste avant Prettier).

Ce que disent les textes :
- `A-143` : « les deux formes qu'un formateur donne à un mappage en ligne trop long (**le mappage seul sur la ligne suivante** ; une paire par ligne entre accolades) sont admises si elles tiennent les mêmes quatre zéros, sinon elles restent « illisible » et la note le dit ». La forme que Prettier écrit sous ce nom n'est ni admise ni nommée par la note.
- Note 7.32.0 : « les deux formes que Prettier 3 donne … » et « **Deux écritures de Prettier restent hors liste** : une chaîne pliée sur deux lignes (`--prose-wrap always`) et un texte nu à virgule » ; en-tête du module : « les deux formes qu'un formateur (Prettier 3) donne ». Il y en a une troisième, et c'est elle qu'on rencontre d'abord sous le réglage du socle.
- `LISEZ-MOI.md` de l'annexe : « Lues par le lecteur : toutes les sorties, sauf … » : vrai aux réglages par défaut sur ses sept entrées, faux sous `printWidth: 100` (`nue.md`, `en-ligne.md`).
- Le banc n'a aucun cas de cette forme (`sed -n 742,880p double-relecture.test.mjs`).

Effet. Dans un projet du socle, une règle dont un flux en ligne mesure entre ~90 et ~100 colonnes est récrite par Prettier, à chaque commit, dans une forme hors liste ; toute PR du dépôt répond « exigée » tant qu'un humain ne passe pas l'en-tête en bloc. C'est le bruit qu'`A-143` voulait éviter en admettant les formes du formateur, et la note ne le dit pas à qui l'appelle.

Retouche. Admettre `<R>clé:` (rien après, ni commentaire) suivie, à la ligne suivante exactement, de `<R+2>{ … }` ou `<R+2>[ … ]` sur une ligne (la grammaire de `fluxEnLigne`, puis `finDeLigne`). Un cas du banc recopié de Prettier sous `printWidth: 100`, et ses abîmées (retrait R+1 et R+3, ligne vide ou commentaire entre la clé et le flux, commentaire après `clé:`, ligne plus profonde après le flux, flux non refermé). Corriger la note, l'en-tête du module et le `LISEZ-MOI.md`. À défaut, `A-143` demande que la note nomme cette forme parmi les refus.

Prototype : `moi/p1/retouche-p1.patch`, 7 lignes dans `valeurDeCle` :

```js
      if ((suivante.texte[0] === '{' || suivante.texte[0] === '[') && reste === '' && suivante.retrait === R + 2 && suivante.n === u.n + 1) {
        i++;
        const [lu, suite] = fluxEnLigne(suivante.texte, suivante.n);
        finDeLigne(suivante.texte, suite, suivante.n);
        return lu;
      }
```

Éprouvé : banc 47 sur 47 (`plat3/`) ; `gen.mjs` (qui écrit maintenant cette forme à R+1 à R+4) graine 301, 300 000 tirés, 68 455 lus, 0 arbre différent, 0 lu là où `yaml` refuse, 0 dans les quatre comptes ; `enum.mjs` sur toutes les suites de 1 à 3 lignes, 1 527 776, 8 572 lus (124 de plus), 0 écart ; Prettier : 144 sorties lues au lieu de 128, 0 écart.

### m1 — Deux trous du banc sur le lecteur

Fait. Trois de mes 22 mutations restent vertes contre le banc (`moi/mut/miennes.py`, `res/mut-miennes.log` : « 19 rouges sur 22 jouées ») ; une est équivalente pour le verdict, deux ne le sont pas :

- **N16** `enVigueur: !HORS_VIGUEUR.some((h) => statut.startsWith(h))` : `status: rejected x`, `rejectedness`, `obsolete-2` mettent la règle hors vigueur, là où `yaml` lit un statut qui n'est ni `rejected` ni `obsolete`. C'est l'un des quatre comptes. Le module est juste (`printf … | node moi/un-arbre.mjs` : `status: rejected x` → `"enVigueur":true`, `yaml` → `"status":"rejected x"`) ; seul le tirage le garde.
- **N13** `return suivante && suivante.retrait === R ? liste(R) : null;` : `code:` sans valeur suivie d'une clé au même retrait devient une liste vide, lue ; le module la refuse (`code:`⏎`criticality: high` → « ligne 2 : `code` : attendu une liste de chemins » ; `yaml` : `"code":null`). Sans danger de niveau, mais la promesse n'est tenue par aucun cas.
- N18 (un en-tête hors liste efface aussi la lecture de l'index de cette règle) : équivalente pour le verdict, la cause « en-tête illisible » est toujours là quand l'effacement a lieu ; seules des lignes de cause de la même règle tombent.

Retouche. Deux cas au banc : `validation:`⏎`  status: rejected x` (et `"rejected "`) → en vigueur ; `code:`⏎`criticality: high` → « illisible », ligne de `code`.

### m2 — Quatre phrases à préciser

1. Note, point 4 : « la forme en bloc de préférence …, qu'aucun formateur ne plie ». Sous `--prose-wrap always`, Prettier plie justement la raison de la forme en bloc (`en-bloc.prose-wrap-always.md` de l'annexe ; la note le dit deux paragraphes plus haut). Dire « qu'aucun formateur ne plie aux réglages du socle ».
2. Note : `trailingComma: "none"` (aucune virgule après la dernière entrée d'un pli) et une largeur de retrait autre que 2 rendent tout pli hors liste (16 refus sur 22 chacun, table de B1) ; le corps de la PR le dit pour `--tab-width 4`, la note non.
3. Note et en-tête du module : « une ligne hors liste » fait « exigée » ; un en-tête dans la liste mais refusé au sens (niveau hors vocabulaire, `criticality` sans `level`, `code` qui n'est pas une liste, chemin nu lu comme un nombre, fichier sans en-tête) fait la même cause. Et un ticket archivé partout est « introuvable » (banc, histoire K2), ce que la note ne dit pas.
4. En-tête du module : « Un fichier de règle dont l'en-tête est hors liste est une cause quoi que l'index en dise ». Avec un index illisible dans le même arbre, l'arbre entier est illisible avant que les en-têtes soient lus : sortie 21, pas de cause (histoire I5). Côté sûr ; dire « … quoi que dise un index lisible ».

## Tirages (point 2)

| Tirage (module de d5fdcea) | Tirés | Lus par le lecteur | Lus plus bas | « Hors vigueur » à tort | `code` différent | Lus, refusés par `yaml` | Arbre entier différent | `X3` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `moi/gen.mjs`, graines 201 et 202 | 1 000 000 | 272 449 | 0 | 0 | 0 | 0 | 0 | 34 793 |
| `moi/enum.mjs`, toutes les suites de 1 à 3 lignes (31 formes × 7 retraits) | 1 527 776 | 8 448 | 0 | 0 | 0 | 0 | 0 | — |
| `moi/unicode.mjs`, chaque point de code du plan de base (hors demi-codets) et 4 081 des autres plans, à 8 places | 540 552 | 420 208 | 0 | 0 | 0 | 0 | 0 | — |
| `presque-plie.mjs` de l'annexe, graine 153 | 300 000 | 173 234 | 0 | 0 | 0 | 0 | — | 4 275 |
| `structure-plie.mjs` de l'annexe, graine 163 | 200 000 | 4 202 | 0 | 0 | 0 | 0 | — | 894 |
| `en-tetes.mjs` de l'annexe (graine d'origine) | 200 000 | 21 496 | 0 | 0 | 0 | 0 | — | 1 117 |
| Sous-total, cette session | 3 768 328 | 900 037 | 0 | 0 | 0 | 0 | 0 | |
| Premier agent (`res/p151`, `p152` presque-plie ; `s161` structure-plie ; `t141` tirage ; `v141` valide), non rejoués | 1 200 000 | 356 342 | 0 | 0 | 0 | 0 | — | 10 811 |
| Prototype de B1 : `gen.mjs` graine 301, puis `enum.mjs` | 1 827 776 | 77 027 | 0 | 0 | 0 | 0 | 0 | 8 571 |

`gen.mjs` : un arbre d'en-tête tiré (criticité nue ou en mappage avec leurres, `code`, `validation`, clés au hasard, mappages et listes imbriqués à 1 à 4 de retrait, listes au retrait de leur clé à toute profondeur, plis de Prettier à toute place, `- clé: {`, `- {`, `- [`), écrit dans les formes admises, puis abîmé de 0, 1 ou 2 caractères près des signes (31 signes, insécable, tabulation, `\r` compris) ou d'une torsion de ligne (retrait ±1 ou ±2, ligne doublée, retirée, échangée, jointe, coupée, clé voisine insérée : `"level": low`, `level : low`, `? level`, `- level: low`…). 15 % intacts. Juges : l'arbre entier contre `yaml`, et `classer` de `ref.mjs` (les quatre comptes). `X3` : même lecture que `yaml`, seul un schéma strict refuserait. Les résultats de l'annexe sont retrouvés au caractère près (`en-tetes.mjs` : 21 496 lus, 1 117 `X3`, comme `resultats/annexe.json`).

Aucun non-zéro : pas d'en-tête minimal à rendre.

## Le calcul de bout en bout (point 3 ; `moi/jouets/s5.sh` et `h8.sh`, sortie `res/jouets-s5.txt` : 30 lignes `ok`, 0 `ÉCART`)

Dépôts jouets, ligne de commande, diff donné par git comme l'usage le dit (`lib.sh` de l'annexe de 484e991). 30 histoires, toutes à l'attendu :

- Les sept histoires de 484e991 (S8, S8b à S8g ; sans index, index à jour, index en retard) : `exigée`, sortie 20, cause `RULE_…⇥en-tête illisible⇥<fichier>⇥<réf>`, puis `# illisible : <réf>:<fichier> : ligne <n> : <raison>`.
- Une règle haute lisible à côté d'un fichier hors liste (H1) : deux causes, `en-tête illisible` et `code`, sortie 20.
- Un fichier hors liste sur un seul arbre : la cible seule (`origin/sujet/x` a avancé), la tête seule, `origin/develop` seul (PR vers un sujet en retard), le départ seul (supprimé par la PR et par develop) : 20 chaque fois, la réf nommée (`le départ de la PR` pour le dernier). Des homonymes hors liste hors du chemin des règles (sous-dossier, dépôt jouet d'un projet) : `non exigée`, 0. L'en-tête récrit dans develop, une PR ouverte avant : 20 ; la même mise à jour : 0.
- Ticket absent de tous les arbres, ou archivé partout : 20, cause `ticket introuvable`, remarque `# ticket … absent de …`. Ticket sur la tête seule (`Règles: —`) : 0 ; sur un sujet seul, citant une règle moyenne : 0, citant la règle haute : 20, réf `origin/sujet/facture`. Ni titre ni branche ne nomment de ticket : 0.
- Index à jour (haute effective, en-tête moyen, code touché) : 20 ; en retard (la PR monte l'en-tête) : 20, causes `fichier` et `niveau` ; corrompu : 21, même avec un en-tête haut et son code touché, même avec un en-tête hors liste à côté (m2, point 4).
- Clone superficiel : 21, une ligne de raison et son remède. Témoins : règle moyenne, code touché : 0 ; règle haute lisible : 20.

Codes de sortie et lignes de cause : ceux que la note et l'en-tête disent. (Une première écriture de l'histoire « départ seul » rendait 0 : mon montage faisait deux commits identiques, au même sha, la tête était le départ ; refaite, 20.)

## Les fichiers de règle réels (point 4)

Lus sur place, rien recopié :
- le dossier des règles du dépôt de projet (`docs/metier/regles/`) : 32 `.md`, dont 31 fichiers de règle et un registre sans en-tête à la racine du dossier, que le calcul ne prend pas pour une règle ; les 31 lus, 0 « illisible », 0 arbre différent de `yaml`, 0 classe de `ref.mjs` ;
- les fichiers de règle des bancs de la CLI (`RULE_*.md` sous `apps/cli/`, hors `node_modules`) : 49 lus, 0 « illisible », 0 arbre différent, 0 classe ;
- le gabarit `regle.md` du plugin : « illisible » ligne 3 (ses jokers), comme annoncé.

## Prettier (point 5)

Voir la table de B1. Les deux refus annoncés se retrouvent (`en-ligne-nu.md`, `en-bloc.prose-wrap-always.md`, sorties identiques au caractère près à celles de l'annexe, `cmp`). Aucune sortie n'est lue autrement que `yaml` la lit.

Le texte nu « coupé en deux entrées » : ce n'est pas Prettier qui le coupe, c'est YAML, dès l'entrée (`{ …, reason: une raison, et une autre }` est déjà, pour `yaml`, une clé `et une autre` sans valeur) ; Prettier ne fait que le mettre sur deux lignes. Un vrai fichier peut le rencontrer à l'écriture, sous la forme en ligne que montre le gabarit : le lecteur le refuse avant et après Prettier (« attendu `clé: scalaire` »), et le schéma strict de la CLI refuse une clé inconnue. Rien à lire de travers.

## `safe.directory` (point 6)

`preparer.sh`, `matrice.sh`, `suite.sh` de l'annexe de 484e991, rejoués contre le sommet (`res/safe-matrice.txt`, `res/safe-suite.txt`) : 55 lignes, **0 violation** (`grep -c VIOLATION` → 0 et 0). La ligne 33 qui échouait (système exact ; XDG remet à zéro ; `~/.gitconfig` existe) : `git:refuse calcul:illisible ok`. La ligne 35 (XDG déclare, `~/.gitconfig` existe) passe de « illisible » à « non exigée », comme git ; `GIT_CONFIG_NOSYSTEM=0x0` et `0k` aussi (git obéit lui-même à la variable).

## Mutations (point 7)

- Mes 22 (`moi/mut/miennes.py`, 19 sur le lecteur, 3 sur le chemin des causes, jouées une à une contre le banc entier, `res/mut-miennes.log`) : 19 rouges, 3 vertes (m1 : N13, N16 ; N18 équivalente pour le verdict).
- Échantillon de 60 des 296 de `mutations.py` (rangs tirés par `random.seed(134)`, `moi/mut/echantillon-rangs.txt` ; le fichier de l'annexe est égal à la copie, `assert`) : **60 rouges sur 60**, aucun « ancien » introuvable ou en double (`res/mut-echantillon.log`, témoin vert d'abord).

## Les textes (point 8)

- La note 7.32.0 dit le prix d'`A-143` : un en-tête hors liste fait répondre « exigée » tant qu'il n'est pas récrit ; la sortie dit la règle, le fichier, la réf, la ligne et la raison (vérifié sur les histoires). Faux ou incomplets : B1 (« deux formes », « deux écritures restent hors liste ») et m2.
- L'en-tête du module décrit le lecteur ligne pour ligne comme le code le fait, hors B1 et m2 (4).
- Le mot de `fusionner/SKILL.md` (étape 0 : `scripts/double-relecture.mjs` parmi les scripts copiés) : juste ; aucun script n'appelle le calcul (`grep -rl double-relecture` : le module, son banc, `SKILL.md`, la note).
- `plugin.json` : la seule ligne `"version"`, 7.31.2 → 7.32.0.

## Ce qui tient

- Aucune réponse « non exigée » à tort trouvée, par aucun des chemins ci-dessus.
- Les 80 fichiers réels que la session n'avait pas pu relire : lus, sans écart.
- Les contrôles d'alignement retirés : redondants (mesuré).
- Le code dit mort : mort.
- m1 et m3 de 484e991 : fermés (ligne 33, histoires K1 et K2).

## Ce que je n'ai pas regardé

- La suite entière (`pnpm test`), les contrôles de la PR sur GitHub.
- 236 des 296 mutations de `mutations.py`.
- `tirage.mjs` et `valide.mjs` de l'annexe : seulement par le premier agent (`res/t141.json`, `res/v141.json`), pas rejoués par moi.
- Prettier hors 3.10.1 (le 4.0 en alpha), d'autres formateurs (dprint, l'éditeur), `proseWrap` sur d'autres entrées que les miennes.
- PyYAML ; le schéma Anchorpost au pivot 3 (celui du dépôt de projet est au pivot 2).
- Un chemin de règles hors convention déclaré au manifeste (`contexts[].rules`) : limite écrite au ticket (décision 10), non éprouvée.
- Le coût sur un grand dépôt réel ; Windows ; un dépôt `sha256` ; `git` antérieur à `--show-scope`.
- `map.md` (consigne).
- Hors des cinq fichiers : la décision 16 du ticket (`60-double-relecture-exigee.issue.md`, copie de l'architecte) décrit encore le lecteur d'avant `A-143` (« le commentaire de chaque ligne retiré avant de les joindre ») ; non relue au-delà.
