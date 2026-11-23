non conforme
Lu : le diff `6c37fe3..bf5a1c4` en entier (28 fichiers), arbre `0b434d3c…`, puis le ticket 91 et ses annexes pour savoir ce qui était demandé. Joué : les 9 tests neufs et celui de `sujet-fusionner.test.mjs` (verts) ; deux sondes sur `checks_exiges`, avant et après la PR ; la mutation M1 contre trois bancs ; V13, V14, V15, V16 et V22 de `mutations.mjs` ; cinq mutations à moi sur le cas C1, chacune contre le banc du patch et contre celui d'avant ; `essai-chaine-seule.sh --geler`, avec des sondes ESLint et Prettier dans le jouet posé ; la suite entière, 1 472 tests sur 1 472, sortie 0 ; le job `bancs` du sommet, `completed success`.

## Constats

**à corriger — 1. Le texte annonce 8.3.1 pour le bloc `socle:poses-du-plugin`, qui arrive en 8.3.2.**
- Où : `skills/chaine/socle-chaine-de-production/SKILL.md:66` (« un projet posé avant 8.3.1 l'ajoute ») et `skills/monorepo/socle-monorepo/references/racine/eslint.config.mjs:33` (le message d'erreur : « NOTES-DE-VERSION.md du plugin, 8.3.1 »).
- Le fait : le patch a été écrit pour 8.3.1, sur `24fbd72`. Sur le `main` qui a bougé, le geste n'a changé que `plugin.json` et la note, pas ces deux textes. Pourtant la note du bloc est celle de 8.3.2, et la note 8.3.1 parle de la CLI anchorpost.
- Ce que ça coûte : un projet posé en 8.3.1 (le `main` d'aujourd'hui) n'a pas le bloc, mais le skill lui dit qu'il n'a rien à ajouter. Et l'erreur d'`eslint.config.mjs` envoie lire la mauvaise note.
- Joué : `git grep -n '8\.3\.1' bf5a1c4 -- skills scripts README.md` ne rend que ces deux lignes. Sur la note 8.3.1, `awk '/^## 8.3.1/,/^## 8.3.0/' NOTES-DE-VERSION.md | grep -c poses-du-plugin` rend `0`.
- Retouche : écrire 8.3.2 aux deux endroits. Ou bien ne citer aucun numéro (« la note qui introduit le bloc »), et un prochain déplacement de `main` ne le casse plus.

**à corriger — 2. Une règle de checks vide dans un ruleset fait ignorer l'ancienne protection, même quand celle-ci exige des checks.**
- Où : `skills/chaine/fusionner/scripts/github.sh:566-569`.
- Le fait : si un ruleset porte une règle `required_status_checks` vide, `checks_exiges` sort aussitôt en 6, sans lire l'ancienne protection. Or GitHub additionne les règles des rulesets et celles de l'ancienne protection. Quand l'ancienne protection exige `qualite`, la bonne réponse est donc `["qualite"]`.
- Avant / après : `6c37fe3` rendait cette liste. Le patch sort en 6, et la boucle s'arrête sur un dépôt qui fonctionnait. Le message est faux en plus : « toute PR vers develop s'y lirait « prête (sans CI) » et n'entrerait jamais ».
- Le cas inverse va bien : un ruleset qui exige des checks plus une ancienne protection vide rend la liste du ruleset.
- Gravité : aucune fusion n'entre sans CI, l'erreur bloque au lieu de laisser passer, d'où « à corriger » et pas « bloquant ».
- Joué : un faux `gh` réduit à deux routes, `rules/branches/develop` et `branches/develop/protection/required_status_checks` (un 404 répond `gh: Branch not protected (HTTP 404)`). Sur ce faux, `checks_exiges` est sourcé depuis le `github.sh` d'avant et depuis celui d'après :

| Cas | Avant (`6c37fe3`) | Après (`bf5a1c4`) |
| --- | --- | --- |
| S1 : ruleset 7 avec une règle `required_status_checks` vide, et l'ancienne protection qui exige `qualite` (`{"strict":true,"contexts":["qualite"],…}`) | `rc=0 ["qualite"]` | `rc=6`, `RÉGLAGE DU DÉPÔT : la branche develop (ruleset 7) …` |

- Retouche : devant une règle vide d'un ruleset, lire d'abord l'ancienne protection. Si elle exige des checks, rendre sa liste. Si elle répond 404 ou une liste vide, appeler `reglage_checks_vides` en nommant le ruleset. Ajouter le test S1. Le test 1 de `checks-exiges-vides.test.mjs` reste vert avec cette retouche : la règle vide et le 404 donnent toujours 6.

**à corriger — 3. Le faux `gh` ne rend jamais les autres règles d'un ruleset : les tests ne prouvent ni le filtre du test de présence, ni l'ordre de lecture.**
- Où : `skills/chaine/sujet/scripts/faux-gh.mjs:400-412` (et `checks-exiges-vides.test.mjs`).
- Le fait : pour un ruleset, le faux ne rend que sa règle `required_status_checks`, et `[]` quand aucun check n'est exigé. Il ne rend jamais les autres règles. Or GitHub les rend dans `rules/branches/develop` (`pull_request`, `deletion`, que `chaine-admin.md` fait poser). Et `protectionClassique` vide les rulesets, donc le faux ne sait pas montrer un ruleset à côté d'une ancienne protection.
- Ce qui n'est donc pas prouvé : le `select(.type == "required_status_checks")` du test de présence neuf (ligne 566), et l'ordre « rulesets puis ancienne protection » (le constat 2 passe sans test rouge).
- Joué, la mutation M1 : à `github.sh:566`, `[.[] | select(.type == "required_status_checks")] | length` remplacé par `length`. `checks-exiges-vides.test.mjs`, `github.test.mjs` et `fusionner.test.mjs` restent verts, 146 tests sur 146 ; le fichier a été remis ensuite.
- Ce que M1 ferait en production :
  - S2 : un ruleset sans règle de checks (le vrai GitHub rend `[pull_request, deletion]`) et une protection en 404. La réponse attendue est `[]`, c'est ce que rend le code du patch (sonde avant et après : `rc=0 []`). M1 y dirait `RÉGLAGE DU DÉPÔT` et nommerait une règle qui n'existe pas.
  - Le même ruleset, avec des checks portés par l'ancienne protection : M1 arrêterait la boucle.
- Retouche :
  - dès que le faux modèle un ruleset, lui faire rendre aussi `pull_request` et `deletion` ;
  - lui ajouter une option « ruleset et ancienne protection ensemble » ;
  - ajouter trois tests : S1 (constat 2) ; S2 (ruleset sans règle de checks, autres règles présentes, protection en 404 : `[]`) ; S3 (ruleset sans règle de checks, protection à liste vide : 6, déjà rendu ainsi par le patch).

## Vérifié, conforme

**(1) `checks_exiges` et ses appelants.**
- Avant et après la PR, sur le faux à deux routes, chaque cas rend la bonne sortie :
  - aucune règle et protection en 404 : `[]` ;
  - ruleset sans règle de checks et protection en 404 : `[]` ;
  - règle vide seule : 6 ;
  - deux rulesets, l'un vide, l'autre qui exige : la liste ;
  - ruleset sans règle de checks et protection à liste vide : 6.
- Les erreurs de lecture :
  - une panne de `lire_github`, une réponse qui n'est pas un tableau, une ancienne protection mal formée : sortie 5 ;
  - un 404 de l'ancienne protection : `null`, puis `[]`.
- `jq` en échec : le second `jq` relit le tableau sur lequel le premier vient de réussir. S'il échouait quand même, le code passerait au 6, donc fermé.
- Pagination : `rules/branches/develop` n'est lu que sur sa première page (30 règles par défaut, sans `--paginate`). Ce code n'a pas changé dans le diff, et une règle au-delà de la première page reste fermée : rien n'entre.
- Aucun chemin n'ouvre une fusion sans CI exigée :
  - `[]` donne « prête (sans CI) ». `attendre_ci` ne voit alors aucun check exigé et rend 2 ; `passer.sh` sort en 3 (« CI non déclenchée »).
  - Dans `sujet.sh`, la lecture unique d'une PR de mise à jour lit un nom vide « en attente » : sortie 5.
- Le 6 se propage bien partout :
  - `file.sh` : `exit $?` ;
  - `attendre_ci` : `return $?` ;
  - `sujet.sh` : `[ $? != 6 ]` (11, aux deux lectures) ;
  - `boucle.sh` : `ARRÊT`, sortie 6 ; avant lui, `traiter_rouges` et `traiter_sujets` ne font aucun geste (`lue=''`) ;
  - `passer.sh` : sortie 3, que la boucle classe en ARRÊT (sa dernière ligne n'est pas « CI non déclenchée ») ;
  - la veille : `finir 6`.

**(2) Le faux `gh`.**
- Sans check exigé, il rend ce que rend un vrai GitHub sans protection : des rulesets vides, et une ancienne protection en 404 « Branch not protected » (ou « Required status checks not enabled » sous `protectionClassique`).
- Les bancs « sans CI » gardent leur sortie `[]`, et le cas `regleVide` modèle celui de l'essai. Seule réserve : le constat 3.

**(3) `eslint.config.mjs` et `.prettierignore`.**
- `essai-chaine-seule.sh --geler`, rejoué : les attendus du § 2. `pnpm lint` sort en 0. On compte 12 lignes `gelée :` et `references-agent : OK — 17 fichiers, 0 nouvelle, 12 gelée(s)`. Aucun lien cassé. Le premier commit sort en 0, et aucun `scripts/…` n'est reformaté.
- Sondes dans le jouet :
  - ESLint lit toujours le code du projet. Il rapporte `scripts/outil-du-projet.mjs`, `scripts/chainex/y.mjs`, `apps/demo/scripts/chaine/z.mjs` et `docs/scripts/agent/w.mjs` (4 erreurs). Il ignore `scripts/chaine/…` et `scripts/verify/sous/…`.
  - Prettier fait de même.
  - `prettier --write` sur un script posé : sortie 0, rien de changé.
  - `eslint --max-warnings 0 --no-warn-ignored` sur un `.ts` posé : sortie 0 ; sortie 1 sans l'option.

**(4) Les bornes en étalons de `regles.test.mjs`.**
- Les mutations du ticket sont toutes rouges :

| Mutation | Mesure | Borne |
| --- | --- | --- |
| V13 | 25,1 étalons | 4 |
| V14 | 7,8 | 4 |
| V15 | 79,2 | 40 |
| V22 | 2,23 | 1,46 |
| V16 | l'étalon ne mesure plus (0,07 ms) | — |

- Mes mutations à moi :
  - `split(' ')` à chaque expansion : rouge 3 fois sur 3 contre le banc du patch, 2 fois sur 3 contre celui d'avant ;
  - deux lectures quadratiques plus légères (`indexOf`, une boucle de `charCodeAt`) : vertes contre les deux bancs. C'est la limite que le ticket écrit déjà (« pas de croissance quadratique coûteuse »), pas un affaiblissement.
- L'étalon lui-même : stable, de 240 à 290 ms. Rien n'y vient du passage de l'interpréteur au code compilé. Le repli linéaire de V8 est désactivé par défaut.

**(5) Note, version, longueur, confidentialité.**
- `plugin.json` est à 8.3.2, et la note 8.3.2 est en tête (ses consignes aux projets suivent le patch).
- Aucun `SKILL.md` ne dépasse 200 lignes (`socle-monorepo` : 197).
- Les lignes ajoutées ne contiennent ni nom de personne, ni projet client, ni chemin local.
