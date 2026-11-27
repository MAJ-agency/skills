# Un index généré que « même contenu propre » dispense n'est jamais jugé par `C1` : il va au capitaine, sur toute PR

Status: ready-for-agent
Type: défaut
Modèle: sonnet — un tri de liste à changer dans `gestes.sh` et un bloc à remonter avant une sortie anticipée, la règle récrite dans cinq références et `SKILL.md`, des assertions de banc retournées et cinq bancs neufs ; rien à concevoir hors de la décision `A-223`. Le correctif et ses valeurs ont été essayés en écrivant ce ticket (« Ce qui a été joué »). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/relecture/scripts/gestes.sh` (`diff_relu`, lignes 252 à 273 ; `c1`, lignes 473 à 503) ; `skills/chaine/relecture/references/criteres-session.md` (`C1`, lignes 6 à 15), `gestes.md` (lignes 33, 57 et 60), `verdict.md` (ligne 64), `cas-limites.md` (ligne 66), `CONTENU.md` (ligne 15) ; `skills/chaine/relecture/SKILL.md` (ligne 92) ; `scripts/relecture.test.mjs` (lignes 556, 600-601, 632, 637-638, 947-948, 1291, 1387-1393, et les bancs neufs) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Ce ticket va seul dans sa PR, avec les tickets 98 et 99, fermés `wontfix`, qui ne livrent rien. Les tickets 94 à 96, dans une autre PR, ne touchent aucun de ces fichiers hors des deux fichiers de version : seuls ceux-là entrent en conflit.

## Le besoin

Constat (5) de l'essai réel du régime 8 (carte, entrée « Fin de l'essai réel du régime 8 », et entrées du 2026-11-23 et du 2026-11-24 sur les PR #7, #13, #14, #15, #17 du dépôt jouet) : le critère `C1` de la session de relecture (critère `D4` de l'axe Documentation) compte **bloquant** un index généré périmé, alors que le capitaine le régénère avant toute fusion. Cinq PR sur dix-huit ont pris ce refus. Sur #17, c'est une **impasse** :

1. tour 1 refusé, un seul bloquant `C1` : `docs/agents/couts.md`, index à commande, périmé ;
2. l'auteur régénère l'index, dans un commit qui ne touche que lui ;
3. `meme-contenu.sh` dispense ce commit (index à commande) et dit le nouveau sommet « même » que celui du tour 1 ;
4. la règle 4 de `decision-relecteur.mjs` voit donc le tour 1, refusé, porter sur le contenu de la tête : `à-reprendre`, sans tour neuf, à chaque `à-relire` de l'auteur (trois fois) ;
5. seul un arbitrage `écarté` du conducteur, puis un tour non compté, en sortent.

Le bloquant demande une correction que la chaîne, par construction, ne voit pas. Le besoin : **un index que « même contenu propre » dispense n'est jamais jugé par `C1`** ; `C1` le nomme « Index à régénérer par le capitaine », sans bloquant, sur toute PR.

## Le mécanisme, établi à la source

Lignes lues sur `origin/main` à `b57eae7` (plugin 8.5.0). `skills/chaine/relecture/`, `github.sh`, `passer.sh`, `sujet.sh`, `meme-contenu.sh`, `decision-relecteur.mjs` et `scripts/relecture.test.mjs` n'ont pas changé depuis 8.4.0.

- **`C1` ne laisse au capitaine que sur une PR de mise à jour.** `gestes.sh:473-483` n'écrit `c1/index-fusion.txt` que si `$B/maj` existe (PR de mise à jour d'un sujet), et seulement les index que la fusion a touchés ; partout ailleurs il est vide. `gestes.sh:498` : `perimes.txt` = `c1.txt` moins `index-fusion.txt`. Sur une PR ordinaire, **tout** fichier que la régénération change est un constat bloquant, index à commande dispensé compris.
- **Le diff relu, lui, exclut déjà ces index.** `gestes.sh:266-273` : `dispenses.txt` = les index à commande que la base **et** la tête déclarent par un chemin littéral, moins la liste elle-même ; `gestes.sh:277` les sort de `a-relire.txt`. Aucun axe ne les lit : seul `C1` les juge (`criteres-session.md:6-15`).
- **`dispenses.txt` ne s'écrit pas sur une liste vide.** `gestes.sh:252-256` : `fichiers.txt` vide (PR de mise à jour sans conflit ni retouche), `diff` pose `diff.fait` et sort en 0, « aucun fichier à relire », **avant** la ligne 273. `c1` se joue ensuite seul (`gestes.md:62`) : classer `c1.txt` contre un `dispenses.txt` absent, sous `set -euo pipefail` (`gestes.sh:35`), fait sortir `c1` en 1 (`comm: …/dispenses.txt: No such file or directory`), et `scripts/relecture.test.mjs:1442` (« C1 se joue seul », sortie 0 attendue) rougit. Joué en écrivant ce ticket.
- **« Même contenu propre » les dispense.** `meme-contenu.sh:22-26` et `:302-309` : un chemin de classe `régénéré` (à commande, littéral, déclaré une fois, sur la cible et sur T, couvert par aucun motif) ; `:372-374` : un commit qui ne touche que de tels chemins est accepté ; `:399` : `même`. Ce que `meme-contenu.sh` dispense est un sous-ensemble de `dispenses.txt` (les deux exigent un chemin littéral à commande sur la base et sur la tête ; `meme-contenu.sh` écarte en plus les chemins déclarés deux fois ou couverts par un motif, et un index qui n'est plus un fichier ordinaire).
- **La décision garde le refus.** `decision-relecteur.mjs:267` : un tour porte sur la tête si son sommet est la tête ou si `memeContenu[sommet]` vaut `true` ; `:419-421`, règle 4 : tour refusé sur la tête, sans arbitrage `écarté` plus récent, `à-reprendre`.
- **Le capitaine régénère avant que rien n'entre dans `develop`.** `fusionner/scripts/passer.sh:328-333` : `regenerer_index`, puis un commit si l'index a bougé, à chaque passage, livraison de sujet comprise. Vers un sujet, `sujet.sh:601` (`mettre_a_jour_sous_pr`) régénère quand la sous-PR est en retard ; une sous-PR à jour entre sans régénération (`sujet.sh:1059`, qui ne la met à jour que si l'ascendance n'est pas `à-jour`), et l'index se régénère à la mise à jour du sujet (`sujet.sh:766`) et à sa livraison (`passer.sh:328`). Un index périmé n'arrive donc jamais sur `develop`.
- **Ce que `C1` régénère.** `regenerer_index` (`github.sh:77-94`) ne joue que les `commande` (puis les `verification`) : un index sans commande n'est jamais récrit par `C1`, donc n'entre jamais dans `c1.txt` de lui-même ; il se relit dans le diff (`criteres-session.md:10-11`).

D'où l'impasse : un bloquant qui ne porte que sur ce que la chaîne dit « pas du contenu ».

## Décisions

**`A-223` (décidée le 2026-11-27, amende `A-144`)** — `C1` ne juge jamais un index que `meme-contenu.sh` dispense, sur toute PR. `c1.txt` se classe contre `dispenses.txt` : ce qui y est va dans `c1/au-capitaine.txt` (« Index à régénérer par le capitaine », sans bloquant, jamais un tour compté) ; le reste reste dans `perimes.txt`, bloquant. Le capitaine le régénère avant d'entrer dans `develop` ; une sous-PR à jour entre dans son sujet sans régénération, l'index s'y rattrape à la mise à jour du sujet ou à sa livraison. `A-144` ne dispensait que sur une PR de mise à jour (l'index que la fusion avait touché) : la branche « PR de mise à jour » (`index-fusion.txt`) disparaît, contenue dans la règle générale. Une ADR ajoutée sans son index régénéré cesse d'être un constat : c'est le but. Écartés : faire dire « différent » à `meme-contenu.sh` après un refus (casse la garde du verdict sur la mise à jour du capitaine, `A-81`, `A-106`) et faire lire le verdict à la règle 4 (le Relecteur ne lit jamais un constat). La spec (`relecture-independante.spec.md`, `A-223`) est déjà à jour : ce ticket ne la touche pas.

Conséquence tirée par ce ticket, sans décision de plus : `dispenses.txt` s'écrit **dans tous les cas**, liste vide comprise, puisque `C1` le lit sur toute PR. Les lignes 266-273 de `gestes.sh` remontent avant la sortie anticipée de la ligne 252 (après `resolution`, ligne 251, qui ne le lit pas) ; elles ne lisent que la liste des index de la base (dossier de la session) et de la tête (arbre à part), qui existent tous deux à ce point.

Ce qui ne change pas :

- la régénération se joue toujours, sur le sommet entier (`gestes.md`, étape 2) : une commande d'index en échec, ou une **vérification rouge** sur ce que la PR écrit, reste un bloquant (sortie 15) ;
- un fichier que la régénération change et qui n'est pas dans `dispenses.txt` reste un bloquant : un fichier qu'une commande d'index récrit sans qu'il soit déclaré, un index que la tête déclare par motif, un index à commande de la base que la tête ne déclare plus par un chemin littéral. Un index sans commande n'est jamais régénéré : il ne se juge que dans le diff relu, comme avant ;
- `D4` ne change pas (son texte est celui de `revue-de-ticket`, mot pour mot, `CONTENU.md:23`) : il juge les fichiers générés **du diff relu**, d'où les index dispensés sont déjà sortis.

Ce que la session tranche seule : le libellé des tests neufs et leur place dans le fichier ; la forme des phrases des références hors de celles que les bancs tiennent (« Où », ci-dessous, donne celles-là mot pour mot).

## Quand le ticket est fait

1. Sur une PR ordinaire (vers `develop` ou vers un sujet), un index de `dispenses.txt` que la régénération change est dans `c1/au-capitaine.txt`, pas dans `c1/perimes.txt` ; `c1` l'écrit sous « index à régénérer par le capitaine ».
2. Sur une PR de mise à jour d'un sujet, de même pour **tout** index de `dispenses.txt`, que la fusion l'ait touché ou non, `fichiers.txt` vide compris : `dispenses.txt` y est écrit, `c1` sort en 0.
3. Un fichier changé par la régénération hors de `dispenses.txt` reste dans `perimes.txt`, bloquant ; une vérification rouge reste un bloquant ; les sorties 12, 13, 14 et 15 ne changent pas.
4. `c1/index-fusion.txt` n'est plus écrit, et aucun texte du skill ne le cite ni ne dit « que la fusion a touché ».
5. Les cinq références et `SKILL.md` disent la règle générale, sans la restreindre à la PR de mise à jour (« Où »).
6. Le cas de #17 rejoué au banc : une PR à index dispensé périmé rend `perimes.txt` vide et `au-capitaine.txt` non vide, et le commit qui ne régénère que cet index est « même » pour `meme-contenu.sh`.
7. La suite entière passe ; la version est la suivante de `main` au moment de livrer, au troisième chiffre (8.5.1 sur `main` en 8.5.0), sa note dans `NOTES-DE-VERSION.md`.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecture/scripts/gestes.sh` | `diff_relu` : les lignes 266-273 (le commentaire, `L`, les deux listes, `dispenses.txt`) remontent entre la ligne 251 (`resolution`) et la ligne 252 (`if [ ! -s "$B/fichiers.txt" ]`), inchangées. `c1` : retirer le bloc `index-fusion.txt` (473-483) ; lignes 498-499, `perimes.txt` = `sort -u c1.txt \| comm -23 - "$B/dispenses.txt"`, `au-capitaine.txt` = `sort -u c1.txt \| comm -12 - "$B/dispenses.txt"` ; les deux `dire` (500-503) inchangés |
| `skills/chaine/relecture/references/criteres-session.md` | `C1`, lignes 12-15, après « Un fichier non suivi qu'une commande laisse n'est pas un écart. » : « Un index à commande que la base et la tête déclarent par un chemin littéral (`dispenses.txt`, celui que « même contenu propre » dispense) n'est pas jugé ici, sur aucune PR : le capitaine le régénère avant que rien n'entre dans develop ; le verdict le nomme, sans écart. Tout autre fichier que la régénération change reste un écart. » ; la phrase « Sur une PR de mise à jour … reste jugé. » disparaît ; la phrase des lignes 10-11 (« Un index sans commande n'est vérifié par rien ici : il se relit dans le diff, comme tout fichier. ») reste |
| `skills/chaine/relecture/references/gestes.md` | ligne 33 : « `fichiers.txt` vide : `dispenses.txt` écrit, puis « aucun fichier à relire », sortie 0, sans diff. » ; l'étape 4 (ligne 57) récrite pour toute PR : « 4. **Les index dispensés** : un fichier de `c1.txt` qui est dans `dispenses.txt` n'est pas jugé, sur toute PR : il va dans `c1/au-capitaine.txt` ; il n'est ni un bloquant ni un tour compté : le verdict le nomme, « Index à régénérer par le capitaine ». Tout autre fichier de `c1.txt` va dans `c1/perimes.txt`. » (sans `git diff <fusion>^1 <fusion>`, sans « fusion introuvable ») ; ligne 60 inchangée |
| `skills/chaine/relecture/references/verdict.md` | ligne 64 : « « Index à régénérer par le capitaine » nomme chaque index à commande que `C1` trouve périmé et que la base et la tête déclarent par un chemin littéral : ce n'est pas un constat, le capitaine le régénère avant que rien n'entre dans develop. » |
| `skills/chaine/relecture/references/cas-limites.md` | ligne 66, dernière colonne : « un bloquant par fichier, hors de `dispenses.txt` ; un index de `dispenses.txt` se nomme « Index à régénérer par le capitaine », sans bloquant, sur toute PR » |
| `skills/chaine/relecture/references/CONTENU.md` | ligne 15, fin du paragraphe « L'empreinte et `C1` » : « un index à commande que la base et la tête déclarent par un chemin littéral est laissé au capitaine, sur toute PR. » |
| `skills/chaine/relecture/SKILL.md` | ligne 92 : « Un index à commande que la base et la tête déclarent par un chemin littéral n'est pas jugé, sur aucune PR : le verdict le nomme, « Index à régénérer par le capitaine », sans bloquant. » au lieu de « Sur une PR de mise à jour, un index à commande que la fusion a touché n'est pas jugé … » |
| `scripts/relecture.test.mjs` | les assertions retournées (table ci-dessous) et cinq tests neufs (« Bancs à écrire ») |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante et sa note |

### Les assertions de `scripts/relecture.test.mjs` à retourner

| Ligne | Aujourd'hui | Devient |
| --- | --- | --- |
| 556 (`SKILL.md`) | « Sur une PR de mise à jour, un index à commande que la fusion a touché n'est pas jugé : … sans bloquant. » | la phrase neuve de `SKILL.md:92` (« Où ») |
| 600 (`gestes.md`) | « n'est ni un bloquant ni un tour compté : le verdict le nomme, « Index à régénérer par le capitaine » » | inchangée : l'étape 4 récrite garde ces mots |
| 601 (`gestes.md`) | « rien n'est dispensé, chaque fichier de `c1.txt` reste un constat. » | « un fichier de `c1.txt` qui est dans `dispenses.txt` n'est pas jugé, sur toute PR » ; et dans le même test, pour `gestes.md` : « `fichiers.txt` vide : `dispenses.txt` écrit, puis « aucun fichier à relire » » |
| 632 (`verdict.md`) | « ce n'est pas un constat, le capitaine le régénère quand il fait avancer le sujet » | « ce n'est pas un constat, le capitaine le régénère avant que rien n'entre dans develop » |
| 637 (`criteres-session.md`) | « un index à commande que la fusion a touché n'est pas jugé ici » | « n'est pas jugé ici, sur aucune PR : le capitaine le régénère avant que rien n'entre dans develop » |
| 638 (`criteres-session.md`) | « Un index que la fusion n'a pas touché reste jugé. » | « Tout autre fichier que la régénération change reste un écart. » |
| neuve, même test | — | aucun fichier de `skills/chaine/relecture/` (références, `SKILL.md`, `scripts/gestes.sh`) ne contient « que la fusion a touché » ni « index-fusion » |
| 947 | `perimes.txt` = `["docs/adr/README.md", CONSIGNES]`, « deux index périmés » | `[perimes.txt, au-capitaine.txt]` = `[[], ["docs/adr/README.md", CONSIGNES]]` : les deux index à commande littéraux de la base et de la tête vont au capitaine, le sous-produit non suivi n'est dans aucune des deux listes |
| 948 | `/^index périmés : 2$/m` | `/^index périmés : 0\nindex à régénérer par le capitaine : 2\ndocs\/adr\/README\.md\ndocs\/consignes\.md$/m` |
| 1291 (titre) | « … un index que la fusion a touché est laissé au capitaine, un autre reste jugé (B2) … » | « … tout index dispensé est laissé au capitaine, que la fusion l'ait touché ou non (B2) … » |
| 1387-1388 (commentaire) | « … Le premier est laissé au capitaine, le second reste un constat. » | « C1 (B2) : la régénération change l'index des ADR, que la fusion a touché (`--theirs`), et le sommaire, écrit à la main dans la retouche ; tous deux sont des index dispensés, laissés au capitaine. » |
| 1391 | `[[SOMMAIRE], ["docs/adr/README.md"]]` | `[[], ["docs/adr/README.md", SOMMAIRE]]`, message « tout index dispensé : nommé au verdict, sans bloquant » |
| 1392 | `/^index à régénérer par le capitaine : 1\ndocs\/adr\/README\.md$/m` | `/^index à régénérer par le capitaine : 2\ndocs\/adr\/README\.md\ndocs\/sommaire\.md$/m` |
| 1393 | `index-fusion.txt` = `["docs/adr/README.md"]` | `assert.ok(!existsSync(brouillon("c1/index-fusion.txt")), "index-fusion.txt n'est plus écrit")` |
| 1442 | `c1` sort en 0, « C1 se joue seul » | inchangée : elle tient grâce à `dispenses.txt` écrit sur une liste vide |

## Bancs à écrire

Cinq tests neufs dans `scripts/relecture.test.mjs`, sur le `projetJouet` existant (`relecture.test.mjs:705`), les gestes joués comme la session les joue (`p.joue`). **Banc 5** est une assertion portée par les bancs 1, 2 et 3 : `meme-contenu.sh` est sous `scripts/chaine/` du jouet (copié depuis `skills/chaine/fusionner/scripts` par `POSES_SOUS_CHAINE`, `relecture.test.mjs:37` et `:743-748`) ; il lit la cible dans `refs/remotes/origin/<B>`, à rafraîchir juste avant l'appel (`git fetch origin "+refs/heads/<B>:refs/remotes/origin/<B>"` dans `p.auteur`) ; il se lance `bash scripts/chaine/meme-contenu.sh <V> <T> <B>` dans `p.auteur`, `V` le sommet relu, `T` un commit à un parent, posé sur `V`, qui ne régénère que le chemin en cause, `B` la base de la PR ; il sort en 0 sur `même`, 20 sur `différent`, 21 sur `illisible` (`meme-contenu.sh:78-80`).

1. **L'impasse de #17** : une PR ordinaire vers un sujet qui ajoute une ADR sans régénérer `docs/adr/README.md` (`INDEX_ADR`, index à commande de la base et de la tête) : `c1` sort en 0, `perimes.txt` vide, `au-capitaine.txt` = `docs/adr/README.md`, la sortie porte « index périmés : 0 » et « index à régénérer par le capitaine : 1 ». Banc 5 : le commit qui ne régénère que `docs/adr/README.md` rend `même`, sortie 0.
2. **Un fichier qu'une commande récrit sans le déclarer** : la base et la tête déclarent un index `docs/a.md` dont la commande écrit aussi `docs/y.md`, fichier suivi que la liste ne déclare pas ; la PR change `docs/y.md` à la main : `c1` sort en 0, `perimes.txt` = `docs/y.md`, `au-capitaine.txt` vide. Banc 5 : le commit qui ne récrit que `docs/y.md` rend `différent` (classe `hors`), sortie 20.
3. **La tête le déclare par un motif `*` avec `commande`** : la base déclare `docs/sommaire.md` par un chemin littéral à commande ; la tête remplace cette entrée par `{ chemin: "docs/*.md", commande: <la même> }` et laisse `docs/sommaire.md` périmé. La commande de la tête le régénère (`C1` joue la liste de la tête), il est absent de `dispenses.txt` (la tête ne le déclare plus par un chemin littéral) : `perimes.txt` = `docs/sommaire.md`, `au-capitaine.txt` vide. Banc 5 : le commit qui ne régénère que lui rend `différent`, sortie 20, `meme-contenu.sh` le classant `retiré` (`:307`, `MOTIFS` lu sur la cible, qui n'a pas de motif).
4. **La vérification rouge** : un index dont la `verification` échoue sur ce que la PR écrit : `c1` sort en 15, « régénération en échec », comme avant.
6. **La liste vide** : une PR de mise à jour d'un sujet sans conflit ni retouche (`fichiers.txt` vide, comme `relecture.test.mjs:1435-1442`), où `develop` apporte une ADR sans son index régénéré : `diff` sort en 0, « aucun fichier à relire », `dispenses.txt` existe et porte `docs/adr/README.md` ; `c1` sort en 0, `perimes.txt` vide, `au-capitaine.txt` = `docs/adr/README.md`.

(Le banc 5 n'a pas de test à lui : il rougit, dans les bancs 1 à 3, dès que les deux définitions divergent.)

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir d'`origin/main`

```bash
git fetch origin main
git switch -C claude/c1-index-dispenses origin/main
git log -1 --format=%h origin/main; git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

`main` attendu : `b57eae7`, `"version": "8.5.0"`. Un autre sommet : relire les lignes citées ici (`git show origin/main:<chemin> | sed -n '<a>,<b>p'`) ; si l'une a bougé, s'arrêter et l'écrire au lanceur.

### § 1 — Les bancs neufs d'abord, vus rouges

Écrire les cinq tests neufs et retourner les assertions de la table (le code et les références intacts), puis :

```bash
timeout 600 node --test --test-reporter=tap scripts/relecture.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Attendu : `# tests 44` (39 aujourd'hui, plus 5), **5 rouges** : le test des gestes des étapes 2 à 6 (`:818`, assertions 947-948), le test B2 (`:1291`, 1391-1393), le test des règles de suite par leur texte (`:506`, 556, 601, 632, 637-638 et l'assertion neuve), les bancs neufs 1 et 6 ; les bancs 2, 3 et 4 sont verts (ils gardent ce qui ne change pas). Environ une minute sur un poste de session (54 s mesurées pour les 39 tests d'aujourd'hui).

### § 2 — Le patch, et les bancs verts

`gestes.sh`, puis les six textes, comme le dit « Où ». Puis :

```bash
timeout 600 node --test --test-reporter=tap scripts/relecture.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
git grep -n -e 'index-fusion' -e 'que la fusion a touché' -- skills/chaine/relecture
```

Attendu : `# tests 44`, `# pass 44`, `# fail 0`, aucun `not ok` ; le `git grep` ne rend rien. La version : `.claude-plugin/plugin.json` à la suivante de `main` au troisième chiffre (8.5.1 sur `b57eae7`), et sa note en tête de `NOTES-DE-VERSION.md` (« Ce qui change » : `C1` ne juge plus un index dispensé, sur toute PR, `dispenses.txt` écrit sur une liste vide, `index-fusion.txt` retiré ; « Ce qu'un projet fait pour en profiter » : rien, la session de relecture lit le skill du plugin).

### § 3 — Commiter, les mutations, la suite entière, la PR

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(relecture): C1 laisse au capitaine tout index dispensé, sur toute PR (plugin <version>)"
git status --short
```

Puis les mutations (« Mutations »), chacune seule, le fichier remis par `git checkout -- <fichier>` après, `git status --short` vide à la fin. Puis la suite entière, seule, en tâche de fond (`run_in_background`), le `timeout` de l'outil Bash à `1900000`, la charge notée avant et après :

```bash
uptime; env -u NODE_PATH timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# fail 0`, `# tests` égal à `# pass` : le compte de `main` au départ, plus 5. Puis :

```bash
git push origin claude/c1-index-dispenses
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit. Dans le corps : le § 1 (rouges avant), le § 2 (verts après), le journal des mutations, la suite entière (compte, durée, charge), et `A-223` en une phrase. **La session ne la fusionne pas.** Elle rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` a bougé entre l'ouverture de la PR et sa fusion** : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé. `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit, et eux seuls, se reprennent de `main` (`git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json`), puis la version suivante de ce `main` se pose de nouveau, la note de la branche reposée au-dessus de la dernière. Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis le § 2 de nouveau, la suite entière, et le titre de la PR à la version prise.

## Surfaces

| Surface | Preuve |
| --- | --- |
| une PR ordinaire : un index dispensé périmé va au capitaine, jamais bloquant | assertions 947-948 ; banc 1 ; mutations M1, M2 |
| une PR de mise à jour : tout index dispensé va au capitaine, que la fusion l'ait touché ou non | assertions 1391-1392 ; mutation M2 |
| `fichiers.txt` vide : `dispenses.txt` écrit, `c1` sort en 0, l'index dispensé au capitaine | assertion 1442 ; banc 6 ; mutation M3 |
| hors de `dispenses.txt`, un fichier que la régénération change reste bloquant (récrit sans être déclaré ; déclaré par motif sur la tête) | bancs 2 et 3 ; mutations M2, M4 |
| une vérification rouge reste la sortie 15 | banc 4 |
| ce que `C1` laisse au capitaine, `meme-contenu.sh` le dit « même » ; ce qu'il garde, « différent » | banc 5, dans les bancs 1 à 3 |
| `index-fusion.txt` n'est plus écrit | assertion 1393 ; mutation M6 |
| les références et `SKILL.md` disent la règle générale, sans « que la fusion a touché » | assertions 556, 601, 632, 637-638 et l'assertion neuve ; mutation M5 |

## Mutations

Chacune seule, sur la branche commitée, `timeout 600 node --test --test-reporter=tap scripts/relecture.test.mjs`, le fichier remis après. Comptes attendus sur la suite à 44 tests ; M1 à M3 ont été mesurées en écrivant ce ticket sur une suite d'essai (« Ce qui a été joué »), sans les bancs neufs.

| Mutation | Rouges attendus |
| --- | --- |
| M1 `c1` ne classe contre `dispenses.txt` que si `$B/maj` existe (la restriction remise) | 2 : le test `:818` (947), le banc 1 (mesuré sur l'essai : `:818`) |
| M2 les deux `comm` inversés (`-23` pour `au-capitaine.txt`, `-12` pour `perimes.txt`) | 6 : `:818`, `:1291`, les bancs 1, 2, 3 et 6 (mesuré sur l'essai : `:818`, `:1291`, et le test `:1407` complété du banc 6) |
| M3 les lignes de `dispenses.txt` reposées après la sortie anticipée de `diff` | 2 : le test `:1407` (1442, `c1` en 1), le banc 6 (mesuré sur l'essai : `:1407`) |
| M4 `dispenses.txt` = la liste de la base seule (`cp index-base.txt`, la tête ne retire plus) | 1 : le banc 3 |
| M5 `criteres-session.md` redit « Sur une PR de mise à jour d'un sujet, un index à commande que la fusion a touché n'est pas jugé ici » | 1 : le test `:506` |
| M6 `c1` écrit de nouveau `: > "$B/c1/index-fusion.txt"` | 1 : le test `:1291` (1393) |

Six rouges sur six.

## Vérification

1. § 1 : 5 rouges sur 44, les bancs 2, 3 et 4 verts.
2. § 2 : 44 verts sur 44 ; `git grep` de `index-fusion` et de « que la fusion a touché » vide sous `skills/chaine/relecture`.
3. Les six mutations, rouges, aux comptes de la table.
4. La suite entière : sortie 0, le compte de `main` plus 5, sans `NODE_PATH`.

### Ce qui a été joué en écrivant ce ticket

Dans un arbre de travail détaché de `origin/main` à `b57eae7` (plugin 8.5.0), le 2026-11-27, Node 22.23.5, git 2.43.0, retiré après :

- **Le correctif tel qu'il était écrit d'abord** (le bloc `index-fusion.txt` retiré, `c1` classé contre `dispenses.txt`, `dispenses.txt` laissé à sa place) : le test `:1407` rougit, `c1` sort en 1, `comm: '…/relecture/pr-18-tour-1/dispenses.txt': No such file or directory`.
- **Le correctif de ce ticket** (les lignes 266-273 remontées avant la ligne 252) : les 8 tests « une PR de mise à jour » verts ; la suite `scripts/relecture.test.mjs` entière, les assertions 947-948 et 1391-1393 aux valeurs de la table, **39 sur 39**, 54 s.
- **Le banc 6, en essai** (dans le test `:1407`, une ADR ajoutée sur `develop` sans son index) : `c1` sort en 0, « index périmés : 0 », « index à régénérer par le capitaine : 1 », `docs/adr/README.md`.
- **M1, M2, M3** sur cette suite d'essai : 1, 3 et 1 rouges (table « Mutations »).
- Non joués : les bancs 1 à 5 tels qu'écrits ici, M4 à M6, la suite entière du dépôt. Leurs attendus se lisent à la source (`meme-contenu.sh:302-309`, `github.sh:77-94`, `gestes.sh:266-273`).

## Ce qui n'a pas été établi

1. **L'écart de définition dans l'autre sens** : `dispenses.txt` ne retire ni un chemin déclaré deux fois ni un chemin couvert aussi par un motif, que `meme-contenu.sh` juge comme tout fichier (`ambigu`). Un tel index irait au capitaine sous `A-223` alors qu'un commit qui le régénère serait « différent » (un tour neuf, pas d'impasse). Aucun dépôt connu ne déclare ainsi ; le ticket ne l'aligne pas. À trancher si l'architecte veut une seule définition.
2. **Un index dispensé qui n'est plus un fichier ordinaire** : `meme-contenu.sh:373` rend `différent` pour un index `régénéré` devenu lien symbolique ou sous-module, alors que `dispenses.txt` ne regarde pas le mode. L'écart ne se joue pas : `regenerer_index` refuse en amont un index en lien symbolique (`liens_sur_index`, `github.sh:81-84`), donc `C1` sort en 15 avant tout classement. Pas de banc dans ce ticket.
3. **Le texte de la note de version** : à écrire par la session qui livre, sur la trame du § 2.

## Hors périmètre

- La note sur la PR quand « même contenu propre » garde un refus : ticket 94.
- Le texte de `D4` et le skill `revue-de-ticket` (régime 7).
- La régénération d'une sous-PR à jour à son entrée dans le sujet (`sujet.sh:1059`) : l'index se rattrape à la mise à jour et à la livraison du sujet (`A-223`).

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur le constat (5) de l'essai réel du régime 8, le code lu sur `origin/main` (plugin 8.4.0). Aucun banc joué : le ticket décrit ce qui est à écrire.
- 2026-11-27 — Repris par un agent rédacteur, `A-223` décidée : prêt pour agent. Le correctif d'abord écrit cassait « C1 se joue seul » (`dispenses.txt` absent sur une liste vide) : `dispenses.txt` s'écrit désormais avant la sortie anticipée de `diff`, et un banc neuf le tient. Les bancs 2 et 3 d'abord écrits étaient inconstructibles (`regenerer_index` ne joue que les `commande`) : remplacés. Le correctif, les valeurs retournées et trois mutations joués sur `b57eae7` (« Ce qui a été joué »).
