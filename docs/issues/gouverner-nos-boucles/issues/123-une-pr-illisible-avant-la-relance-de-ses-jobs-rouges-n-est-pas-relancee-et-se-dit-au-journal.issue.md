# Une PR illisible avant la relance de ses jobs rouges n'est pas relancée et se dit au journal ; le banc du régime illisible lit le régime de chaque cas

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une branche de `traiter_rouges` dans `boucle.sh`, une ligne au journal, un banc sur un faux `gh` qui tombe en panne à la lecture qui suit celle des runs, et l'assertion d'un banc existant resserrée ; la règle est `A-243` (« avant toute relance d'une CI rouge »). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/boucle.sh` (en-tête 4-7 ; le commentaire de `traiter_rouges` 320-324 ; `traiter_rouges` 325-347, la lecture de la PR 332-334) ; `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` (le banc du régime illisible, 566-583, l'assertion 579 ; deux tests neufs après 745) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Seul dans sa PR.** La PR de 119 à 121 touche `boucle.sh:51-54` et `:517-525` (le regroupement), loin de `:320-347`, et les fichiers de version ; la PR du ticket 122, les fichiers de version : la seconde à entrer se remet sur `main`. Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

## Le besoin

Deux remarques de la relecture de la PR #178 (ticket 105), laissées pour une suite (journal de la carte, 2026-11-28, 05 h 50 UTC) : « le banc du régime illisible accepte `(7|illisible)` » ; « un `pr_json` en échec dans `traiter_rouges` relance sans ligne au journal ».

1. **La relance sans contrôle.** En régime 8, `A-243` veut le verdict contrôlé « avant toute relance d'une CI rouge » : une PR sans tour validé est renvoyée, ses jobs jamais relancés. Quand la lecture de la PR échoue, `traiter_rouges` saute ce contrôle **et relance quand même**, sans une ligne qui le dise. Une PR refusée peut ainsi voir sa CI relancée, ce que le ticket 105 devait empêcher, et le journal ne garde aucune trace du saut.
2. **Le banc trop large.** Le banc du ticket 105 joue trois contrats : deux en régime 7, un en régime illisible. Il accepte « régime 7 » ou « régime illisible » pour chacun des trois : un régime 7 lu illisible, ou l'inverse, y passe vert.

Le besoin : **une PR illisible avant la relance n'est ni relancée ni renvoyée, et la boucle le dit** ; **le banc lit, pour chaque cas, le régime attendu**.

## La cause, à la source

Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

1. `skills/chaine/fusionner/scripts/boucle.sh:332-334` :

   ```bash
   if pr=$(pr_json "$n" </dev/null); then
     eligibilite "$n" "$(jq -r '.base.ref // ""' <<<"$pr")" 0 </dev/null || continue
   fi
   ```

   Sans `else` : un `pr_json` en échec (GitHub illisible, sortie 5 de `lire_github`, la cause sur la sortie d'erreur) laisse passer à la relance (`:335-345`). L'en-tête (`:4-7`) et le commentaire (`:323-324`) disent « avant cette relance […] son verdict est contrôlé ».
2. Les autres lectures de `traiter_rouges` sautent la PR au tour suivant : `pr_sommet` (`:328`, `|| continue`) et les runs (`:329-331`, `|| continue`). Seule la lecture de la PR laisse la relance se faire.
3. `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs:566-583` : `cas` porte trois couples `[contrat, plus]` (`:567-571`) sans le régime attendu ; l'assertion (`:579`) est `/éligibilité avant la CI : régime (7|illisible), rien à juger avant le passage/` pour les trois. Le troisième, `{ relecture: { depuis: "jamais" } }`, est le seul régime illisible ; les deux premiers (sans la clé, et une PR ouverte avant `depuis`) sont des régimes 7.
4. Le faux GitHub des bancs ne sait pas faire tomber une lecture après une autre de la même route (`faux-gh.mjs:262-274`, `panne` : la première lecture qui correspond la prend). `pr_sommet` (`github.sh:557-563`) et `pr_json` (`:465`) lisent la même route, `pulls/<n>`, et `pr_sommet` passe avant : une panne sur `^pulls/30$` est prise par lui, et la PR est sautée avant la lecture fautive.

## Décisions

La décision 1 applique `A-243` ; la décision 2 resserre un banc. Le régime 7 suit `A-271` (3).

1. **`traiter_rouges`**, la lecture de la PR en échec : `echo "[#$n] PR illisible avant la relance de ses jobs rouges (cause ci-dessus) : ni relance ni renvoi, reprise au tour suivant"`, puis `continue`. La ligne contient « jobs rouges » : le `Monitor` du capitaine la voit par le filtre existant (`fusionner/SKILL.md:104`, `rouges`), rien à ajouter au filtre. Le commentaire de `traiter_rouges` (`:323-324`) le dit.
2. **Le banc du régime illisible** : chaque cas porte son régime, `[contrat, plus, regime]`, `7`, `7` et `illisible` ; l'assertion lit `` `éligibilité avant la CI : régime ${regime}, rien à juger avant le passage` `` (texte constant pour chaque cas, sans motif alterné).
3. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre. La note dit qu'une PR illisible avant la relance n'est plus relancée, et que les projets reposent les scripts de `fusionner` (`boucle.sh`, posé sous `scripts/chaine/`) pour en profiter.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/boucle.sh:332-334` | l'`else` : la ligne, `continue` (décision 1) |
| `skills/chaine/fusionner/scripts/boucle.sh:323-324`, `:4-7` | le commentaire, l'en-tête : la PR illisible n'est pas relancée |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs:566-583` | **change à dessein** : le régime de chaque cas (décision 2) |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs`, après 745 | deux tests neufs (« Surfaces ») |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèles : `verdict-du-capitaine.test.mjs:707-723` (régime 8, une PR « CI rouge », `tourDeBoucle`, la route `rerun-failed-jobs` cherchée au journal) et `:725-745` (régime 7). La panne de la seule lecture fautive se fait par un faux `gh` du banc, posé dans `<racine>/bin/gh` du jouet (`depot-jouet.mjs:116-124`), comme `relecteur.test.mjs:726` : il passe tout au faux GitHub, écrit un témoin quand il lit `actions/runs`, et, le témoin présent, rend `gh: Bad Gateway (HTTP 502)` et 1 à la lecture de `pulls/30`. La lecture fautive est ainsi celle qui suit les runs, quel que soit le nombre de lectures de `pulls/30` avant elle.

## À faire, dans l'ordre

1. **Partir de `main`** : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** : les deux tests neufs ; `:566-583` resserré reste vert (la décision 2 ne change aucun code : elle se juge par sa mutation).
3. **`traiter_rouges`** (décision 1), puis le commentaire et l'en-tête. Les bancs verts.
4. Un commit ; **la version** et sa note.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| régime 8, une PR « CI rouge », la lecture de la PR en panne après celle des runs : la ligne `[#30] PR illisible avant la relance de ses jobs rouges`, aucune route `rerun-failed-jobs` au journal du faux GitHub, aucun `RENVOI`, ses étiquettes inchangées (`à-fusionner`) | `verdict-du-capitaine.test.mjs`, test neuf |
| régime 7, la même panne : la même ligne, aucune relance (`A-271` (3)) ; sans la panne, la relance comme aujourd'hui (`:725-745`, inchangé) | `verdict-du-capitaine.test.mjs`, test neuf |
| `passer.sh --eligibilite` : « régime 7 » pour les deux premiers contrats, « régime illisible » pour le troisième, chacun lu à part | `verdict-du-capitaine.test.mjs:566-583`, à dessein |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| l'`else` retiré (le code d'aujourd'hui) | les deux tests neufs (une relance au journal) |
| l'`else` qui écrit la ligne sans `continue` | les deux tests neufs |
| l'`else` qui `continue` sans la ligne | les deux tests neufs |
| `regime_de_la_pr` qui rend `7` pour une clé `relecture` dont `depuis` est illisible | `:566-583` resserré (le troisième cas) ; vert avec l'assertion d'aujourd'hui |

## Vérification

1. Le banc ciblé : `env -u NODE_PATH node --test skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs`, les deux tests neufs rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges ; la dernière jouée aussi contre l'assertion de `main`, verte, pour montrer ce que la décision 2 resserre.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` plus `# skipped`. Le relevé part du compte de `main` au départ, plus les deux tests neufs ; il est recopié dans la PR. La session lit le job `bancs` de sa PR avant de rendre la main (`A-212`).

## Ce qui n'a pas été établi

- Si la relance d'une PR refusée est arrivée pendant l'essai : la remarque de la PR #178 est une lecture du code, pas un cas vécu.

## Hors périmètre

- La relance puis le renvoi d'une PR de fourche vers develop à CI rouge (`A-201` (5), `A-208`, liste des suites).
- La clé d'un `origin/sujet/*` non rapatrié, non lue (autre remarque de la PR #178, côté sûr) : inchangée.

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `b5c7ac3` (plugin 8.9.5), sur les remarques de relecture de la PR #178. Chaque ligne citée a été relue à ce sommet. `Status: ready-for-agent` ; la question 1 attend l'architecte.
- 2026-11-28 — Question de l'architecte tranchée sur la recommandation du rédacteur : `A-271` (3) ; la section « Questions à l'architecte » est retirée.
