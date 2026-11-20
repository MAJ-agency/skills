# Suites du skill `relecture` : la résolution découpée en lots, la branche P9 du tri tenue par le banc, la note de version qui dit la résolution relue

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — trois mineurs mesurés, chacun avec sa décision, ses fichiers, ses cas de banc et ses mutations ; le cas du défaut 2 est donné entier, vu vert puis rouge sous la mutation ; rien à concevoir au-delà de ce que le ticket donne.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/relecture/scripts/gestes.sh`, `scripts/relecture.test.mjs`, `skills/chaine/relecture/SKILL.md`, `skills/chaine/relecture/references/gestes.md`, `skills/chaine/relecture/references/cas-limites.md` (aucune PR ouverte ne les touche) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` (les PR 141 et 44, ouvertes, les touchent aussi : la note de ce ticket s'écrit en tête au moment de livrer, sur la version de `main` d'alors).

## Le besoin

La contre-relecture de la PR 142 (ticket 61, le skill `relecture`), troisième passage, sommet `9e4d8df`, a rendu « conforme » et laissé trois mineurs (rapport : `issues/61-annexes/contre-relecture-40428bf/rapport.md`, section « Troisième passage », essais `e19` et `e21`, bibliothèque `outils/jouet.sh`). La PR est entrée dans `main` à `e64f93b` (plugin 7.36.0) ; les fichiers en cause y sont identiques à `9e4d8df` :

```text
$ git diff --stat 9e4d8df e64f93b -- skills/chaine/relecture scripts/relecture.test.mjs NOTES-DE-VERSION.md .claude-plugin/plugin.json
(rien)
```

Tout ce qui suit est mesuré sur un clone neuf de `origin/main` à `e64f93b`, Node 22.23.5, git 2.43.0, poste à 4 cœurs. Le banc du skill y est vert :

```text
$ node --test --test-reporter=spec scripts/relecture.test.mjs
ℹ tests 31
ℹ pass 31
ℹ fail 0
ℹ duration_ms 32262.489147
```

Les décisions citées vivent dans `relecture-independante.spec.md` (branche de l'architecte) : `A-150` (les lots de plus de 2 000 lignes sont calculés par le script, leur union comparée au diff relu, leurs diffs dans l'empreinte), `A-162` (B7 : une ligne retirée n'est écartée que si `develop` retire le même morceau, au même endroit), `A-164` (sur une PR de mise à jour, le diff de la résolution, `git show --remerge-diff` du commit de fusion, se relit en entier par l'axe Règles ; `tri` n'écarte une ligne retirée que si la résolution n'a ni récrit ni retiré le morceau de `develop`).

### 1. La résolution n'est pas découpée en lots

**Le fait.** `diff` (`gestes.sh`, `diff_relu`) écrit `resolution.patch` et `resolution.txt` (`resolution()`, `gestes.sh:323-332`), puis découpe en lots le seul `diff.patch` (`lots`, `gestes.sh:338-393`, appelée une fois, `:309`). `lus '<brouillons>' 1 resolution` (`gestes.sh:572-577`) compare ce que l'axe a lu à `resolution.txt` entier. Au-delà de 2 000 lignes, la résolution reste un lot, que l'axe Règles reçoit d'un bloc.

**La règle des lots, dans le skill.** `gestes.sh:334-337` (commentaire de `lots`), `SKILL.md:69` (« **Plus de 2 000 lignes** : le script écrit les lots (`lots/lot-<i>/`), vérifie que leur union est le diff relu, et les nomme »), `SKILL.md:108` (« Avec des lots, chaque axe se lance une fois par lot… Sur une PR de mise à jour dont la résolution touche un fichier, l'axe Règles se lance une fois de plus, `{{DIFF}}` étant `resolution.patch`, comme un lot nommé `resolution`. »), `references/gestes.md:42`, `references/cas-limites.md:60` et `:80-82`. Par zone (`apps/<x>`, `packages/<x>`, sinon le premier dossier, la racine à part), une zone entière dans un lot quand elle tient, un fichier de plus de 2 000 lignes seul dans le sien ; un seul lot au total : pas de lots, le diff entier (`gestes.sh:369-372`). La règle vise `diff.patch` seul ; rien ne la dit pour `resolution.patch`.

**La mesure.** L'essai `e19` du rapport rejoué tel quel sur `e64f93b` (`PLUGIN=<clone de main> bash essais/e19-resolution-hostile.sh`) : un conflit sur un fichier au nom hostile et sur `apps/api/src/gros.ts` de 3 000 lignes, résolus « ours ». Sortie brute utile (le chemin des brouillons remplacé par `<brouillons>`) :

```text
diff relu : 0 fichiers, 0 lignes ; hors du diff : 0 ; sans écart : 2 ; binaires : 0, dont illisibles : 0
résolution de la fusion : 2 fichiers
{{DIFF}} de la résolution, pour l'axe Règles : <brouillons>/resolution.patch
diff : sortie 0
--- resolution.patch : 3027 lignes ; en-têtes :
diff --git a/apps/api/src/gros.ts b/apps/api/src/gros.ts
diff --git "a/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts" "b/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts"
résolution de la fusion : 2 fichiers, que l'axe Règles lit
lus : sortie 0
```

Aucune ligne `lot …` ni `lots : …` ; après `diff`, `lots/` ne porte que `resolution/`, que `lus 1 resolution` crée. Lignes par fichier de `resolution.patch` :

```text
$ awk '/^diff --git /{h=$0} {n[h]++} END{for(k in n) print n[k], k}' resolution.patch
11 diff --git "a/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts" "b/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts"
3016 diff --git a/apps/api/src/gros.ts b/apps/api/src/gros.ts
```

La même fonction `lots`, extraite telle quelle de `gestes.sh` (avec `dire`, `quitter`, `lignes`, `RELUS_SED`, `relus_de`) et jouée seule sur une copie où `diff.patch` est ce `resolution.patch` et `relus.txt` ce `resolution.txt`, découpe et vérifie sans retouche :

```text
lot 1 : 1 fichiers, 3016 lignes, {{DIFF}} : <copie>/lots/lot-1/diff.patch
lot 2 : 1 fichiers, 11 lignes, {{DIFF}} : <copie>/lots/lot-2/diff.patch
lots : 2
sortie 0
```

**La cause.** `lots` lit des chemins fixes (`$B/diff.patch`, `$B/relus.txt`, `$B/lots/lot-<i>`), et `diff_relu` ne l'appelle que pour le diff relu. Le contre-relecteur le dit : « ce n'est pas une validation à tort que je puisse montrer : c'est la même confiance que pour un fichier de plus de 2 000 lignes seul dans son lot » ; c'est donc un mineur, mais la règle d'`A-150` ne tient pas pour le second diff que l'axe Règles reçoit.

### 2. La branche « `develop` ne fait que retirer » du contrôle côté fusion n'est pas tenue par le banc

**Le fait.** Dans `meme_retrait` (`gestes.sh:608-648`), le dernier contrôle lit `git diff -U0 <fusion>^2 <fusion>` (ce que la résolution change par rapport à `develop`) et refuse d'écarter la ligne si un morceau de ce diff touche ce que `develop` met à sa place. Trois branches (`gestes.sh:644-646`) :

```awk
      if (k > 0 && o[2] > 0 && o[1] <= c + k - 1 && o[1] + o[2] - 1 >= c) touche = 1
      if (k > 0 && o[2] == 0 && o[1] >= c && o[1] < c + k) touche = 1
      if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }
```

La troisième (`k == 0` : le morceau de `develop` ne fait que retirer ; la fusion insère juste à ce point) n'a aucun cas : la mutation P9 du rapport, qui la retire, reste verte.

**La mesure.** La mutation P9, écrite exactement (la ligne garde son `}`, qui ferme le bloc `/^@@ /`) :

```diff
-      if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }
+      }
```

Attention : supprimer la ligne entière ôte aussi ce `}`, l'`awk` ne se compile plus, `meme_retrait` sort en 1 et `tri` rend « gardé » pour une mauvaise raison (vu : `e21` rend `1 : gardé` sous cette fausse mutation).

- `e21` rejoué sur `e64f93b` : `develop` retire la garde de `lire()` ; la résolution écrit `if (admin === undefined) return 2;` à sa place. `tri` : `1 : gardé`. Sous P9 : `1 : écarté, develop retire seul cette ligne`. Les fichiers de `tri` sous P9, bruts :

  ```text
  == tri-1-develop.diff
  @@ -2 +1,0 @@ export function lire(admin) {
  -  if (!admin) throw new Error("interdit");
  @@ -5 +4 @@ export function lire(admin) {
  == tri-1-fusion.diff
  @@ -1,0 +2 @@ export function lire(admin) {
  +  if (admin === undefined) return 2;
  @@ -4 +5 @@ export function lire(admin) {
  ```

  Le morceau de `develop` est `-2 +1,0` (donc `c = 1`, `k = 0`) ; la fusion insère en `-1,0` (`o[1] = 1`, `o[2] = 0`) : seule la troisième branche le voit.
- Le banc entier sous P9, sans cas nouveau : `ℹ tests 31`, `ℹ pass 31`, `ℹ fail 0`, statut 0.

**La cause.** Les cas d'`A-162` et d'`A-164` au banc couvrent un `develop` qui retire sans que la résolution touche ce point (« 3 : écarté », témoin) et un `develop` qui récrit (`k > 0`, la garde `Forbidden`) ; aucun ne couvre un `develop` qui ne fait que retirer et une résolution qui insère là. L'insertion reste lisible dans le diff relu et dans `resolution.patch` (d'où le mineur), mais sans cette branche `tri` écarterait la ligne retirée.

### 3. La note 7.36.0 ne dit rien de la résolution relue

**Le fait.**

```text
$ grep -c remerge NOTES-DE-VERSION.md
0
$ sed -n 5,16p NOTES-DE-VERSION.md | grep -c -i 'résolution\|mise à jour'
0
```

La note 7.36.0 (lignes 5 à 16) décrit le skill entier, lots compris (« Au-delà de 2 000 lignes, le script découpe les lots et vérifie leur union »), mais pas `A-164`, portée par le second tour sur la PR (`9e4d8df`), après l'écriture de la note.

**La règle des notes, dans le dépôt.** `README.md:193` (« Ajouter un skill », point 4) : bumper `version` dans `.claude-plugin/plugin.json`, « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat. Écrire sa note en tête de `NOTES-DE-VERSION.md` (« Ce qui change », « Ce qu'un projet fait pour en profiter »). » ; `README.md:195` : « Cette règle vaut pour **tout** changement de contenu ». En-tête de `NOTES-DE-VERSION.md:3` : « La plus récente en haut… Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter. » Aucun texte du dépôt ne dit de récrire une note livrée (recherche de « note livrée », « récri… note », « note publiée » dans `README.md`, `CONTEXT.md`, `CLAUDE.md`, `NOTES-DE-VERSION.md`, `docs/agents/` et les `SKILL.md` de la chaîne : rien). La règle ne dit donc pas autre chose que la consigne : une note neuve en tête, la 7.36.0 laissée telle quelle.

**Ce que les bancs en lisent.** `scripts/depot.test.mjs:1203-1213` : la première note commence par la version de `plugin.json` et porte les deux sections. `scripts/relecture.test.mjs:458-461` : la **première** note qui contient « skill `relecture` » porte les deux sections ; si la note neuve écrit ces mots, c'est elle que ce test lit (elle porte les deux sections : rien à changer au banc).

## Où

- `skills/chaine/relecture/scripts/gestes.sh` : `lots` (`:334-393`), son appel dans `diff_relu` (`:309`) et la ligne `{{DIFF}} de la résolution` (`:315-317`) ; `lus` (`:567-590`) ; l'en-tête (`:14`, `:20`). `meme_retrait` n'est pas touché.
- `skills/chaine/relecture/SKILL.md:69` et `:108` ; `references/gestes.md:39`, `:42` et `:68` ; `references/cas-limites.md:60` et `:80-82`.
- `scripts/relecture.test.mjs` : deux tests neufs pour le défaut 1, un pour le défaut 2, après le test « A-164, une PR de mise à jour : la résolution de la fusion se relit… » (`:1919-1945`), en réutilisant `miseAJour` (`:1891`).
- `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`.

## Décisions

### Défaut 1

1. **La résolution se découpe comme le diff relu, par la même fonction, à part.** `lots` prend en arguments le diff à découper, la liste de ses fichiers et le préfixe de ses lots ; `diff_relu` l'appelle pour `diff.patch` (lots `lots/lot-<i>/`, inchangés) puis, s'il y a une résolution, pour `resolution.patch` contre `resolution.txt` (lots `lots/resolution-<j>/`, chacun avec `diff.patch`, `attendus.txt`, `relus.txt`, `binaires.txt`). Même seuil (plus de 2 000 lignes **de `resolution.patch`**, compté seul : la résolution est un passage de plus de l'axe Règles, pas une part du diff relu), même découpe par zone, mêmes vérifications (aucun fichier dans deux lots, l'union est `resolution.txt`, chaque lot porte ses fichiers, leurs lignes font celles de `resolution.patch` ; sinon « lots de la résolution : … », sortie 12, comme « lots : … »). Un seul lot : pas de lots de la résolution, `resolution.patch` entier, comme aujourd'hui.
2. **Deux pièges de `lots` tel qu'il est écrit**, à ne pas reporter sur la résolution : son cas « un seul lot » fait `rm -rf -- "$B/lots"` (`:369-370`), qui jetterait les lots du diff relu déjà écrits ; et son `awk` écrit ses fichiers de travail (`nombre`, `<i>.patch`, `<i>.attendus`) directement sous `$B/lots`. Chaque appel travaille dans son propre dossier temporaire sous `$B/lots`, et le cas « un seul lot » ne retire que celui-là.
3. **Les lots de la résolution vivent sous `$B/lots/`** : l'empreinte de `C1` les porte sans rien changer à `empreinte` (`:148-150`, qui hache tout fichier sous `lots/`), et `diff` les efface en partant (`:245`).
4. **Ce que `diff` écrit** : avec des lots de la résolution, une ligne par lot, `lot resolution-<j> : <n> fichiers, <m> lignes, {{DIFF}} : <brouillons>/lots/resolution-<j>/diff.patch`, puis `lots de la résolution : <n>` (jamais `lots : <n>`, que le banc lit pour le diff relu), à la place de la ligne `{{DIFF}} de la résolution, pour l'axe Règles : …`. Sans lots, la ligne d'aujourd'hui, inchangée.
5. **`lus`** reçoit `resolution-<j>` comme lot : axe 1 seulement (sinon sortie 12, « la résolution de la fusion se lit par l'axe Règles (1) »), le lot doit exister (sinon « lot inconnu »), sortie de l'axe `axe-1-lot-resolution-<j>.txt`, comparée au `relus.txt` du lot. `lus 1 resolution` reste ce qu'il est (sur le modèle du diff relu, où `lus <i>` sans lot n'est pas refusé quand des lots existent : voir la question à l'architecte).
6. **Le texte** : `SKILL.md:108` garde sa phrase et ajoute « ; au-delà de 2 000 lignes, une fois par lot de la résolution (`lots/resolution-<j>/diff.patch`, lot nommé `resolution-<j>`) » (la phrase que `relecture.test.mjs:1970` exige, « l'axe Règles se lance une fois de plus, `{{DIFF}}` étant `resolution.patch` », reste entière) ; `SKILL.md:69`, `gestes.md:39`, `:42`, `:68` et `cas-limites.md:80-82` disent que la résolution se découpe de même, en `lots/resolution-<j>/`. Rien n'est recopié d'un outil externe : la découpe est celle de `lots`.

### Défaut 2

7. **Un cas au banc, rien au script.** Le test ci-dessous, entier, se place juste après le test « A-164, une PR de mise à jour : la résolution de la fusion se relit… » (après sa ligne `});`, `:1945`). Il joue un `develop` qui ne fait que retirer la garde et une résolution qui insère une autre ligne là même (gardé), et un témoin dans la même fusion, où la résolution suit `develop` (écarté), pour que le cas ne passe pas par un `tri` qui garderait tout.

```js
test("A-164, une PR de mise à jour : develop ne fait que retirer une garde, et la résolution écrit autre chose à sa place ; la ligne retirée se garde, et la même sans rien d'inséré s'écarte (P9)", { timeout: 120_000 }, () => {
  const GARDE = '  if (!admin) throw new Error("interdit");';
  const INSERTION = "  if (admin === undefined) return 2;";
  const INSERE = "apps/api/src/facture/insere.ts";
  const TEMOIN = "apps/api/src/facture/temoin.ts";
  const avec = (v, garde = GARDE) => `export function lire(admin) {\n${garde}\n  return 2;\n}\nexport const version = ${v};\n`;
  const sans = (v) => `export function lire(admin) {\n  return 2;\n}\nexport const version = ${v};\n`;
  const { p, m, B } = miseAJour(72, {
    // develop retire la garde, sans rien écrire à sa place ; la résolution insère une autre ligne, là même.
    [INSERE]: { commune: avec(1), sujet: avec(2), develop: sans(3), resolu: avec(2, INSERTION) },
    // Le témoin : la même fusion, la résolution suit develop à cet endroit.
    [TEMOIN]: { commune: avec(1), sujet: avec(2), develop: sans(3), resolu: sans(2) },
  });
  const d = p.joue("diff", m);
  assert.equal(d.status, 0, d.sortie);
  assert.ok(readFileSync(join(B, "resolution.patch"), "utf8").includes(`+${INSERTION}`), "l'insertion de la résolution y paraît");
  writeFileSync(join(B, "tri.txt"), `retirée\t2\t${INSERE}\nretirée\t2\t${TEMOIN}\n`);
  const tri = p.joue("tri", m);
  assert.equal(tri.status, 0, tri.sortie);
  assert.deepEqual(tri.stdout.trim().split("\n"), ["1 : gardé", "2 : écarté, develop retire seul cette ligne", "tri : sortie 0"], tri.sortie);
});
```

   Le numéro `72` est libre (`miseAJour(70` et `(71` sont pris, aucun `PR("72"`).

### Défaut 3

8. **Une note neuve en tête, la 7.36.0 inchangée.** Sa section « Ce qui change » dit les trois changements : la résolution d'une PR de mise à jour se découpe en lots au-delà de 2 000 lignes, comme le diff relu (`lots/resolution-<j>/`, `lus '<brouillons>' 1 resolution-<j>`) ; « Dans le dépôt du plugin seulement » (la forme de la note 7.35.0) : un cas de banc tient la branche du tri où `develop` ne fait que retirer et la résolution insère à ce point. Puis une phrase de rappel : « Depuis 7.36.0, la résolution d'une PR de mise à jour se relit : `git show --remerge-diff` du commit de fusion, que l'axe Règles lit en entier ; une ligne de `develop` qu'elle retire est un constat, jamais écartée (`A-164`). » « Ce qu'un projet fait pour en profiter » : mettre à jour le plugin, rien d'autre (rien n'appelle encore le skill, comme le dit la note 7.36.0).

### Version

9. **Un patch** (`README.md:193` : « Patch pour une correction ») : la suivante de `main` au moment de livrer, au troisième nombre. Aujourd'hui `main` est à 7.36.0 ; les PR 141 et 44, ouvertes, touchent aussi `plugin.json` et la note : celle qui entre avant celle-ci la fait reprendre `main`. Aucune version n'est écrite en dur dans un test : les tests de version existants (`depot.test.mjs:1204-1213`) lisent `plugin.json`.

## Cas de banc

Chacun vu rouge avant le correctif, vert après.

| Défaut | Cas | Rouge avant |
| --- | --- | --- |
| 1 | « A-164, une résolution de plus de 2 000 lignes : la machine la découpe en lots par zone, comme le diff relu, vérifie leur union, et compare ce que l'axe Règles a lu à chaque lot » — `miseAJour` avec `apps/api/src/facture/gros.ts` de 3 000 lignes et un petit fichier sous `apps/web/`, résolus en gardant le sujet. Attendu : `diff` sortie 0 ; deux lignes `lot resolution-<j> : …` et `lots de la résolution : 2`, aucune ligne `lots : ` ; les `relus.txt` des deux lots bout à bout font `resolution.txt`, leurs `diff.patch` bout à bout font `resolution.patch` ; `lus 1 resolution-<j>` en 0 avec le fichier du lot, en 1 sans lui ; `lus 2 resolution-1` en 12 ; après `c1`, `c1/avant.txt` porte `lots/resolution-1/diff.patch`, et ce fichier récrit fait sortir `garde` en 14 | aucune ligne `lot resolution-` ; `lots/resolution-1` absent (mesuré sur `e19`) |
| 1 | « … un diff relu en lots et une résolution d'un seul fichier de plus de 2 000 lignes : les lots du diff relu restent, la résolution se lit entière » — la fusion en conflit sur un gros fichier, puis une retouche après elle sur deux zones de plus de 2 000 lignes en tout (forme vue par `e17`, « la fusion n'est pas le dernier commit »). Attendu : `lots/lot-1` et `lots/lot-2` présents après `diff`, aucun `lots/resolution-*`, `lus 1 resolution` en 0 | vert avant (rien ne se découpe) : il tient le piège de la décision 2 |
| 2 | le test de la décision 7 | vert sur `e64f93b`, rouge sous P9 (ci-dessous) |
| 3 | aucun cas neuf : les tests de version de `depot.test.mjs` et le test « le plugin connaît le skill » de `relecture.test.mjs` | — |

Les tests existants d'`A-164` (`:1919`, `:1947`), dont la résolution fait moins de 2 000 lignes, restent verts sans retouche : `lus 1 resolution` ne change pas.

## Mutations

Chacune seule, sur une copie propre, le banc du skill joué, le fichier restauré ; un passage témoin vert avant chaque série.

**Défaut 2, jouées pour ce ticket** (copie de `e64f93b`, le cas de la décision 7 inséré après `:1945`) :

| Mutation (`gestes.sh:646`) | Banc sans le cas | Banc avec le cas |
| --- | --- | --- |
| aucune (témoin) | 31 sur 31, statut 0 | 32 sur 32, statut 0 |
| P9 : `if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }` devient `}` | 31 sur 31, statut 0 | 32 tests, 31 réussis, 1 échec (le cas), statut 1 |
| M2 : `o[1] == c` devient `o[1] == c + 1` | 31 sur 31, statut 0 | 32 tests, 31 réussis, 1 échec (le cas), statut 1 |

Sortie brute du cas sous P9 :

```text
✖ A-164, une PR de mise à jour : develop ne fait que retirer une garde, et la résolution écrit autre chose à sa place ; la ligne retirée se garde, et la même sans rien d'inséré s'écarte (P9) (965.032295ms)
  AssertionError [ERR_ASSERTION]: 1 : écarté, develop retire seul cette ligne
  2 : écarté, develop retire seul cette ligne
  tri : sortie 0
    [
  +   '1 : écarté, develop retire seul cette ligne',
  -   '1 : gardé',
      '2 : écarté, develop retire seul cette ligne',
      'tri : sortie 0'
    ]
```

**Défaut 1, à jouer par la session** (aucune n'est jouée ici : le correctif n'est pas écrit), chacune rouge sur les deux cas du défaut 1 : la résolution non découpée (l'appel retiré) ; le seuil compté sur `diff.patch` au lieu de `resolution.patch` ; le cas « un seul lot » de la résolution qui retire `$B/lots` (les lots du diff relu perdus) ; la vérification d'union retirée, ou comparée à `relus.txt` au lieu de `resolution.txt` ; la vérification des lignes retirée ; `lus` qui compare un lot `resolution-<j>` à `resolution.txt` entier ; `lus` qui admet `resolution-<j>` pour un autre axe que 1 ; les lots de la résolution écrits hors de `$B/lots` (l'empreinte ne les voit plus) ; la ligne `lots : <n>` écrite pour la résolution.

## Vérification

1. Le banc du skill : `node --test --test-reporter=spec scripts/relecture.test.mjs`, vert (31 tests sur `e64f93b`, 32 avec le cas du défaut 2, 34 avec les deux du défaut 1).
2. Les mutations ci-dessus, toutes rouges, avec la sortie brute dans la PR.
3. La suite entière, `pnpm test`, verte d'un seul tenant sur la branche (non jouée pour ce ticket).
4. `grep -c remerge NOTES-DE-VERSION.md` : 1 ou plus, dans la note neuve ; `git diff origin/main -- NOTES-DE-VERSION.md` n'ôte aucune ligne de la note 7.36.0.

## Ce qui n'est pas établi

- **Le correctif du défaut 1 n'est pas prototypé** : seule la fonction `lots` d'aujourd'hui, jouée à part sur le `resolution.patch` d'`e19`, est mesurée (deux lots, 3 016 et 11 lignes, union vérifiée). Les deux pièges de la décision 2 sont lus dans le code (`gestes.sh:343-370`), pas joués.
- **Un binaire de la seule résolution** (un fichier sans écart contre le sujet, binaire, que la résolution touche) : `lus` retire `binaires.txt`, calculé sur le diff relu ordinaire (`--numstat`), pas sur la résolution. Non regardé ; vaut pour `lus 1 resolution` aujourd'hui comme pour ses lots demain.
- **Qu'un sous-agent lise mieux 3 016 lignes en un lot qu'en deux** n'est pas mesuré : la décision suit la règle d'`A-150`, et un fichier de plus de 2 000 lignes reste seul dans son lot, donné entier, comme pour le diff relu.
- **La suite entière** (`pnpm test`) n'est pas jouée ; seul le banc du skill l'est.

## Question à l'architecte

**Faut-il que `lus` refuse la lecture d'un diff entier quand ses lots existent ?** Recommandation : **non, pas dans ce ticket** ; le noter comme suite possible, pour le diff relu et la résolution ensemble. Aujourd'hui `lus '<brouillons>' <i>` sans lot compare à `relus.txt` entier même quand `lots/lot-<i>/` existe (`gestes.sh:571-582`) ; « un axe n'est joué que si tous ses lots le sont » (`SKILL.md:118`) est une consigne de la session, pas un refus de la machine. Ce ticket garde ce modèle pour la résolution (décision 5) : refuser `lus 1 resolution` seul serait une règle que le diff relu n'a pas. Si l'architecte veut le refus, il vaut pour les deux, et c'est une décision de plus.

## Comments
