# Contre-relecture de la PR 154 (tickets 86, 87, 88), tour 3

PR https://github.com/MAJ-agency/skills/pull/154, branche `claude/preuve-suffisante-socle-tests`, **le delta seul** entre
le sommet du tour 2 `597e05c737acc504296a190795520facf38d4171` et le sommet `ffa0063574fd12205d20a335136e1fbe84a1c0c4` (un
commit, « docs(socle-tests): les deux bases d'une mise à jour dites à l'endroit, la ligne Reposer complète (retouche du
tour 2) », cinq fichiers, `44 insertions(+), 12 deletions(-)`), base `main`. Relu le 2026-11-22 par un relecteur neuf, sur
un clone neuf de `MAJ-agency/skills`, Node 22.23.5, pnpm 10.28.0, git 2.43.0, charge entre 1,3 et 3,4. Lecture seule : rien
de poussé, aucun commentaire ni étiquette. Ce que le delta doit fermer : `A-210` (`relecture-independante.spec.md`, branche
`claude/hopeful-lovelace-ouk6tz`) et le rapport `contre-relecture-597e05c/rapport.md`. Anchorpost : un clone de `develop`
à `31afa3d` (index au pivot 3), en lecture, et la CLI publiée `@maj-agency/anchorpost` 2.0.2 installée à part.

## Verdict : non conforme au sommet `ffa0063574fd12205d20a335136e1fbe84a1c0c4`

Aucun bloquant. Le delta est la retouche du tour 2 à l'octet (`597e05c` plus `retouche-154-tour-2.patch`, sha256
`48fb0c01…6fc7` vérifié, donne l'arbre `ef10b8db…`, celui de `ffa0063`). Il ne change aucune ligne exécutée de
`preuves.mjs`. Il ferme quatre des cinq points d'`A-210` : la condition est dite à l'endroit et le texte la tient contre le
code (joué) ; les bancs d'ordre et la garde de `mutation.yml`, la ligne « Reposer », l'argument après `--base <ref>` et
l'énumération de « partielle » ont leurs bancs (D4, D8, D9, D12, D17 à D19 rouges sur `ffa0063`). La CI de GitHub est
verte sur `ffa0063` (1 422 sur 1 422).

Il reste **deux écarts à corriger**, tous deux dans le texte des deux bases :

- le delta garde « plus large, jamais plus lâche » pour le cas du sujet. C'est faux contre la fusion recalculée que la
  phrase écarte. Joué contre la vraie CLI, en `enforce` : une mise à jour qui retire une règle apportée par develop passe
  la fin de tour, et passe aussi la CI de sa PR (sortie 0, 0 écart). La fusion recalculée la refuse, la livraison du sujet
  aussi (`rule-removed`, sortie 1) ;
- `references/CONTENU.md`, que la PR ajoute et que ni le delta ni le tour 2 n'ont touché, garde mot pour mot la phrase
  qu'`A-210` a jugée fausse (« plus large, jamais plus lâche » pour les deux bases, sans condition). Il omet aussi
  `BASE_DEFAUT` des imports.

Une retouche, `retouches/retouche-154-tour-3.patch` sur `ffa0063` (sha256
`4c603735ab5d8a8f9d68348a2f811727155dcda4c493d12107510c0aac80438f`, `retouches/SHA256SUMS`), porte les deux. Elle ne
change que du texte et un banc de texte, aucune ligne exécutée (l'AST de `preuves.mjs` sans commentaires reste
`5db9cacc…`), et n'ajoute aucun test : la suite attendue reste 1 422.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | `preuves.mjs` (« Limites ») et `SKILL.md` (étape 3) : contre le sujet, « plus large, jamais plus lâche » est faux. Ce que la mise à jour défait de develop échappe au gate local et à la CI de la PR de mise à jour ; la fusion recalculée le voit, et la livraison du sujet le juge |
| 2 | **à corriger** | `references/CONTENU.md`, ligne 19 : l'ancienne phrase (« la base la plus proche … plus large, jamais plus lâche »), restée hors du delta, et trois imports sur quatre |
| 3 | mineur, sans retouche à part | `SKILL.md` : les exemples « (une règle, un cas, une criticité remis comme sur develop) » ne sont pas tenus par le banc (F1 verte) ; la partie 1 de la retouche exige la phrase entière |

## Ce que le delta ferme (`A-210`)

| Demandé par `A-210` | Au sommet `ffa0063` | Preuve |
| --- | --- | --- |
| les deux bases d'une branche de mise à jour dites à l'endroit, dans `preuves.mjs` et `SKILL.md` | **fermé** pour la condition | `essais/base-de-la-mise-a-jour.txt` : S=5, D=1 → le sujet ; S=1, D=5 → develop ; S=3, D=3 → develop. C'est ce que disent « le sujet quand il a plus de commits que develop n'en apporte » et « develop, quand il en apporte autant ou plus ». E1 et E4 rouges |
| … « sans jamais plus lâche » (faux contre develop) | fermé contre develop ; **non** contre le sujet | contre develop, le texte dit vrai (`essais/mise-a-jour-plus-lache.txt` : fin de tour 0 écart, CI `rule-removed`, sortie 1 en `enforce`) ; contre le sujet, constat 1 ; ailleurs dans la PR, constat 2 |
| `mutation.yml` : « mutation, puis synthèse », le `if:` de « Mesure précédente » | fermé | D8, D9 rouges |
| la ligne « Reposer » : `BASE_DEFAUT`, `coverage-diff-regles.mjs` 3.10.4, le projet sans `environnement-de-banc.mjs` | fermé | E5, E6, E7, D17, D18, D19 rouges ; F3 (« d'avant 3.10.4 » au lieu de « 3.10.1 ») rouge. Le texte dit vrai : `BASE_DEFAUT`, `baseDepuisPush` et `choisirBase` entrent en 3.10.1 (`1b7c7fb`, `plugin.json` 3.9.0 → 3.10.1), `decisionSansBase(…, branche)` en 3.10.4 (`a6d8e16`, 3.10.3 → 3.10.4) |
| un argument après `--base <ref>` refusé | fermé | D4 rouge ; le cas `["--base", "origin/develop", "HEAD~3"]` est dans la boucle d'usage |
| l'énumération de « partielle » de la fiche | fermé | D12 rouge |

## Les constats

### 1. À corriger : contre le sujet, « jamais plus lâche » est faux

**Où.** `skills/monorepo/socle-tests/references/scripts/verify/preuves.mjs`, lignes 26 et 27 :

> Le sujet, quand il a plus de commits que develop n'en apporte : la comparaison juge aussi des règles que develop a
> touchées, plus large, jamais plus lâche.

et `skills/monorepo/socle-tests/SKILL.md`, ligne 31 : « … jamais à la fusion recalculée de `coverage-diff` : le sujet quand
il a plus de commits que develop n'en apporte (plus large, jamais plus lâche) ; … ». Le banc de texte exige la phrase
(F2 rouge).

**Pourquoi c'est faux.** La phrase pose la comparaison contre la fusion recalculée (« pas à la fusion recalculée … juge
*aussi* des règles que develop a touchées ») : c'est par rapport à elle que « plus large » a un sens, puisque contre le
sujet la comparaison est exactement celle de la CI. Or les écarts de `compare` se lisent de la base à la tête. Le tour 2
l'a montré contre develop, et c'est symétrique ici. Contre le sujet, ce que la résolution défait de develop (une règle, un
cas, une criticité qu'elle remet comme sur le sujet) n'est ni dans la base ni dans la tête, donc rien ne se voit. La
fusion recalculée, qui contient l'apport de develop, le voit. La CI de la PR de mise à jour compare au même sujet (sa
cible, skill `sujet` § « Recevoir develop dans un sujet ») et ne le voit pas non plus. Seule la livraison du sujet,
comparée à develop, le juge.

**Joué** (`essais/mise-a-jour-defait-develop.sh`, `.txt`) : le relais de `ffa0063` et la CLI 2.0.2, sur un clone
d'Anchorpost `develop`. Le sujet a trois commits, develop en apporte un, qui ajoute `RULE_ALL_ANC-99`. La mise à jour
fusionne develop, puis retire la règle. Les distances sont de 3 au sujet et de 5 à develop.

| Comparaison | `observe` | `enforce` |
| --- | --- | --- |
| fin de tour, sans option (`base origin/sujet/x`) | 0 écart, sortie 0 | **0 écart, sortie 0** |
| CI de la PR de mise à jour (`--base origin/sujet/x`) | 0 écart, sortie 0 | **0 écart, sortie 0** |
| fusion recalculée (`--base HEAD~1`, la fusion propre) | `rule-removed RULE_ALL_ANC-99` | refus, sortie 1 |
| livraison du sujet (`--base origin/develop`) | `rule-removed RULE_ALL_ANC-99` | refus, sortie 1 |

**Pourquoi « à corriger ».** Le gate local n'est pas plus lâche que la CI de la PR : il est aussi lâche qu'elle. Mais
c'est le texte qu'`A-210` a fait récrire pour dire « sans jamais plus lâche » là où c'est faux, et il l'affirme pour
l'autre moitié, où c'est faux aussi. L'angle mort est de plus partagé avec la CI. En `enforce`, il ne se découvre qu'à la
livraison du sujet, loin de la mise à jour qui l'a causé. Le tour 2 avait jugé la phrase « juste contre le sujet » :
c'est vrai contre la CI, pas contre la fusion recalculée que la phrase écarte. Le code n'est pas en cause (la plus proche
est la décision 3 du ticket 86).

**La retouche** (partie 1, `preuves.mjs` en-tête seul, `SKILL.md`, le banc de texte) : chacune des deux bases a son angle
mort. Contre le sujet, la base de la CI, ni le gate ni la CI ne voient ce que la mise à jour défait de develop, et la
livraison du sujet le juge. Contre develop, la phrase de `ffa0063` est gardée. Le banc exige la phrase entière de
`SKILL.md`, exemples compris (ce qui ferme aussi le constat 3). G1, G2 et G3 rouges la retouche posée ; G7 (l'en-tête,
un commentaire) verte, comme E8 au tour 2.

### 2. À corriger : `CONTENU.md` garde l'ancienne phrase

**Où.** `skills/monorepo/socle-tests/references/CONTENU.md`, ligne 19, ajoutée par `42c5149` et touchée ni par `597e05c`
ni par `ffa0063` :

> Une PR de mise à jour d'un sujet se compare à la base la plus proche, jamais à la fusion recalculée : plus large, jamais
> plus lâche.

C'est la phrase qu'`A-210` a jugée fausse contre develop (joué au tour 2 et rejoué ici, `essais/mise-a-jour-plus-lache.txt`),
et elle est fausse aussi contre le sujet (constat 1). `CONTENU.md` est la page « ce que chaque pièce fait et pourquoi »
que `SKILL.md` (ligne 10) envoie lire à qui pose le socle. Le texte faux vit donc encore dans la PR, à un troisième
endroit, hors des deux qu'`A-210` nommait. Le même paragraphe nomme trois imports sur quatre (`BASE_DEFAUT` manque),
l'écart que la note a corrigé (E5). Aucun banc ne lit ce paragraphe.

**La retouche** (partie 2, `CONTENU.md`, le banc de texte) : les deux bases avec leur condition et leur angle mort, comme
`SKILL.md`, et les quatre imports. Le banc de texte exige les deux. G4 (l'ancienne phrase), G5 (la condition renversée)
et G6 (`BASE_DEFAUT` retiré) rouges la retouche posée.

### 3. Mineur : les exemples de ce que develop ne voit pas

Le banc de texte exige la phrase de `SKILL.md` en deux morceaux, de « Au pre-push » à « défait du sujet », puis « la CI,
qui compare à la cible de la PR, le juge. ». La parenthèse entre les deux n'est pas tenue : **F1** (« (une règle, un cas,
une criticité remis comme sur develop) » retiré) est verte sur `ffa0063`. Sans conséquence propre. La partie 1 de la
retouche exige la phrase entière, et F1 et G3 sont rouges la retouche posée.

**Pour mémoire, sans retouche.** L'en-tête de `preuves.mjs` est un commentaire sans banc. E8 et F5 sur `ffa0063`, puis G7
la retouche posée, sont vertes. Le banc tient la phrase de `SKILL.md`, qui dit la même chose ; le tour 2 l'a admis.

## La retouche du tour 3

`retouches/retouche-154-tour-3.patch`, sur `ffa0063`, sha256 `4c603735ab5d8a8f9d68348a2f811727155dcda4c493d12107510c0aac80438f`
(`retouches/SHA256SUMS`) ; `git apply --check` propre sur un arbre neuf à `ffa0063` ; quatre fichiers, `18 insertions(+),
10 deletions(-)`, aucun neuf, aucun test ajouté.

| Partie | Constat | Fichiers |
| --- | --- | --- |
| 1 | 1 et 3 (le cas du sujet) | `preuves.mjs` (l'en-tête seul, lignes de 120 caractères au plus), `SKILL.md` (étape 3), `scripts/preuve-suffisante-socle-tests.test.mjs` |
| 2 | 2 (`CONTENU.md`) | `references/CONTENU.md`, `scripts/preuve-suffisante-socle-tests.test.mjs` |

**Rouge avant, vert après** (`essais/bancs-et-ci.txt`). Quatre bancs ont tourné, les trois demandés et
`points-d-entree.test.mjs`, soit 152 tests. Sur `ffa0063`, les 152 sont verts. Avec le seul banc de la retouche posé sur
`ffa0063`, 151 sont verts et 1 rouge (« le relais preuves dit qu'il sort en 2 … », passage absent de `SKILL.md`). La
retouche entière posée, les 152 sont verts. **Mutations, la retouche posée** (`mutations/retouche-t3-sur-retouche.txt`) :
G1 à G6 rouges, G7 verte (le commentaire). Celles du tour 2 (`retouche-t2.mjs`) : D4, D8, D9, D12, D17 à D19, E1, E3 à E7
rouges ; E2 et E8 introuvables, leurs textes sont récrits et G1 et G7 les remplacent. Celles de ce tour sur `ffa0063`
(`tour-3.mjs`) : F1, F3 et F4 rouges, F2 et F5 introuvables (récrites).

## Ce qui a été joué

- **L'identité du delta** : `retouche-154-tour-2.patch` (sha256 vérifié) posé sur `597e05c`, arbre `ef10b8db…`, celui de
  `ffa0063` (`essais/lignes-de-code.txt`).
- **Les lignes exécutées de `preuves.mjs`** (`essais/lignes-de-code.txt`). Le diff hors commentaires est vide : les huit
  lignes changées sont dans le bloc `/** */`. Le fichier réimprimé sans commentaires par l'AST de TypeScript 5.9.3 est
  identique aux deux sommets (`5db9cacc…`, 133 lignes) et la retouche posée.
- **La base d'une mise à jour** (`essais/base-de-la-mise-a-jour.sh`, `.txt`), l'essai du tour 2 rejoué sur `ffa0063` avec
  une troisième forme, l'égalité : le relais suit le texte dans les trois cas.
- **Contre develop**, l'essai `mise-a-jour-plus-lache` du tour 2 rejoué sur `ffa0063` (CLI 2.0.2, Anchorpost `31afa3d`,
  `observe` et `enforce`) : le texte du delta dit vrai.
- **Contre le sujet**, l'essai miroir `mise-a-jour-defait-develop` (constat 1).
- **Mutations** : `retouche-t2.mjs` du tour 2 sur `ffa0063`, 14 rouges sur 15, E8 verte (le commentaire, comme au tour 2),
  donc D4, D8, D9, D12, D17, D18 et D19 rouges (`mutations/retouche-t2-sur-ffa0063.txt`). `tour-3.mjs`, cinq mutations des
  textes neufs du delta (F1 à F5) : F2, F3, F4 rouges, F1 et F5 vertes (`mutations/tour-3-sur-ffa0063.txt`). Puis la
  retouche posée (ci-dessus).
- **Les bancs touchés** sur `597e05c` et `ffa0063` (80 et 80 tests verts : le delta ajoute des assertions, pas de test),
  puis la retouche (ci-dessus).
- **La CI de GitHub sur `ffa0063`** (lecture seule) : job « bancs » success, `# tests 1422`, `# pass 1422` ; CodeQL
  (`actions`, `javascript-typescript`) success.

## Ce qui n'a pas été établi

1. **La suite entière** : pas jouée ici, ni sur `ffa0063` (la CI et la session la donnent à 1 422) ni sur la retouche.
   Seuls les quatre bancs touchés ont tourné (152 sur 152). Le compte de 1 422 tient par construction : aucun test
   ajouté.
2. **Les autres écarts relatifs à la base** (criticité, cas, plancher), contre le sujet comme contre develop : seul
   `rule-removed` a été joué ; les autres se déduisent du même sens de lecture, base vers tête.
3. **Ce que la fusion recalculée voit contre develop** : joué contre le sujet seulement (`--base HEAD~1`). Que la fusion
   recalculée voie aussi ce que la mise à jour défait du sujet se déduit sans avoir été joué. La retouche ne l'affirme
   pas : elle dit « chacune a son angle mort », sans prêter à la fusion recalculée de n'en avoir aucun.
4. **Une mise à jour en conflit** : les essais fusionnent sans conflit, et la résolution y est un commit à part. La
   distance compte ce commit des deux côtés, la condition ne change pas.
5. **Le workflow de mutation sous GitHub Actions** et **un vrai `git push`** sous husky : non joués, comme aux tours 1 et 2.

## Question à l'architecte

1. **Les constats 1 et 2, par le texte ou par le code ?** Retenir pour une branche de mise à jour la fusion recalculée de
   `coverage-diff` (`fusionRecalculee`) fermerait les deux angles morts à la fois, au gate local comme en CI. La CI compare
   aujourd'hui à la cible de la PR et partage l'angle mort du sujet. **Recommandation : le texte dans cette PR** (la
   retouche). La plus proche est la décision 3 du ticket 86, et la livraison du sujet rattrape ce que la CI de la mise à
   jour laisse passer. Le code serait une décision à part, à prendre si un projet en `enforce` s'y heurte.
