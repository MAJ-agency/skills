# `sujet.sh livrer` n'étiquette plus et sait faire sans `gh`, `fait_sur` lit tout le flux

Status: Fait — PR #<n>
Type: défaut
Modèle: sonnet — deux corrections locales de `sujet.sh`, chacune décidée ici avec sa sortie et son message, et des bancs sur le modèle de ceux de `sujet.test.mjs`.
Blocked by: 1 (`sujet.sh` et le faux GitHub sont des fichiers chauds du ticket 1 : partir de `main` après sa fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/sujet.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 7 (décision `A-15`, défaut 8) ; [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), point A5 (déjà couvert par `A-15`) et `A-21` (ticket 9, qui réécrit la lecture GitHub de `github.sh`). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`, `## Fog` pour le catalogue des gates). Base : `origin/main` après la fusion du ticket 1 (plugin **7.16.0** visé par lui ; `4a45634` en 7.15.0, **738 tests**, avant lui). Faits relus à la source sur `4a45634` le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Trois défauts « toujours vrais »** (défaut 8 de la demande, relevés sur `fedora` et chez Iroki) :

- **`livrer` étiquette lui-même** la PR de livraison (`sujet.sh:870-871`, `poser_label "$n" à-fusionner`). Une livraison qui touche un chemin sensible doit attendre la contre-revue (remontée A5 d'Iroki) : le label part avant. Et `livrer` ouvre la PR par `gh api` : dans une session cloud sans `gh` utilisable, la commande échoue sans rien dire d'utile. Pire : la vérification des sous-PR ouvertes (l. 848-849) lit une réponse vide comme « des sous-PR visent encore `sujet/<nom>` » (sortie 4, motif faux).
- **`demarrer` refuse à tort** un ticket dont le bloquant est fait. `fait_sur` (l. 189) lit le statut par `git show | grep -m1 | grep -qiE`, sous `set -o pipefail` (l. 100) : sur un fichier plus long que le tampon d'un tube, `grep -m1` s'arrête au premier statut, `git show` reçoit SIGPIPE, le tube sort en 141, et le bloquant passe pour « pas encore fait ». Rejoué le 2026-11-18 sur un fichier de 1 Mo : 141 à chaque essai.
- **`github.sh:216`** (« integer expression expected ») : absorbé par le ticket 9 (la Décision 1 (`lire_github`) et la ligne `checks_exiges` (`github.sh:212-218`) du tableau « Où » du ticket 9, prouvées par son banc 2).

**Quand le ticket est fait** :

1. `sujet.sh livrer <nom> "<titre>"` ouvre la PR sans `à-fusionner` ; la session qui livre le pose après la relecture que la PR demande. `livrer-prets`, le geste du capitaine, étiquette ses livraisons comme aujourd'hui.
2. Sans `gh` utilisable, `livrer` écrit le titre et le corps dans un fichier, sort en **14** et dit d'ouvrir la PR par l'outil GitHub MCP.
3. `fait_sur` lit tout le flux, par `awk`, sans `grep -q` sous `pipefail`.

## Où

`suj/` abrège `skills/chaine/sujet/scripts/`. Lignes relues sur `4a45634` ; le ticket 1 déplace `sujet.sh` sans toucher à `livrer`, `livrer_prets` ni `fait_sur` : retrouver chacune par son nom.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `suj/sujet.sh` | 27-29 (en-tête, `livrer`) | « ouvre la PR sujet/<nom> → develop, étiquetée `à-fusionner` » → « ouvre la PR sujet/<nom> → develop, **sans** `à-fusionner` : la session qui livre le pose après la relecture de la PR ; sans `gh` utilisable, écrit le titre et le corps dans un fichier et sort en 14 ». |
| `suj/sujet.sh` | 30-34 (en-tête, `livrer-prets`) | « (capitaine) livre et étiquette `à-fusionner` chaque sujet prêt » : le capitaine pose le label de ses propres livraisons. |
| `suj/sujet.sh` | 83-96 (en-tête, sorties) | « `livrer` : 14 sans `gh` utilisable (PR non ouverte, fichier écrit, ouverture par l'outil GitHub MCP) ». |
| `suj/sujet.sh` | 189 (`fait_sur`) | `git show "$1:$2" \| awk '…'` (Décision 2). |
| `suj/sujet.sh` | 838-873 (`livrer`) | Décision 1. Ordre : `fetch` (l. 841), gel (l. 842), phase (l. 845-846), puis **le contrôle de `gh`**, puis les sous-PR (l. 848-849), les migrations (l. 851-853), le corps (l. 854-860), la branche jetable (l. 861-869), l'ouverture (l. 870), le label (l. 871, retiré), le message (l. 872). |
| `suj/sujet.sh` | 1084-1115 (`livrer_prets`) | L'appel `livrer "$nom" "$titre"` (l. 1112) devient `ETIQUETER=1 livrer "$nom" "$titre"` : `livrer` pose alors le label et garde le message d'aujourd'hui. |
| `suj/sujet.test.mjs` | 319-380, 519-570 | Les bancs (Ordre de travail). Modèles : « livrer-prets ouvre la PR du seul sujet prêt, étiquetée à-fusionner » (l. 344), « livrer en phase 4 » (l. 541), « demarrer accepte le ticket une fois son bloquant fait sur le sujet » (l. 42). |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs` | 1189-1235 (`GESTES`, « livrer intermédiaire ») | Inchangé : il attend une sortie 0 et le pre-push joué ; il ne compte pas le label. À rejouer. |
| `skills/chaine/sujet/SKILL.md` | 46 | « À la main, pour livrer plus tôt ou un sujet `sujet-manuel` : `livrer <nom> "…"` » + « La PR s'ouvre sans `à-fusionner` : le poser après la relecture qu'elle demande (contre-revue si elle touche un chemin sensible), `issue_write` en session cloud. Sans `gh` utilisable, `livrer` sort en 14 : ouvrir la PR par l'outil GitHub MCP avec le titre et le corps du fichier qu'il nomme. » |
| `skills/chaine/sujet/SKILL.md` | 34 (sorties) | 14, pour `livrer`. |
| `skills/chaine/sujet/references/CONTENU.md` | § `livrer` | La raison : le label est un ordre de fusion, il se pose après la relecture, comme pour toute PR (remontée d'Iroki) ; `livrer-prets`, geste du capitaine sur des sous-PR déjà relues, étiquette seul. |
| `skills/chaine/chantier/SKILL.md` | 112 (§ 7, point 1) | « proposer au produit `sujet.sh livrer <nom> "<titre>"` » + « ; la PR s'ouvre sans `à-fusionner`, que le conducteur pose après sa contre-revue si elle touche un chemin sensible (§ 6, point 5), sinon tout de suite ». |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` | 39 (§ 2, point 6, « Livraison intermédiaire ») | Après « demander `sujet.sh livrer <nom> "<titre>"` » : « (PR ouverte sans `à-fusionner`, posé après sa relecture) ». |
| Version | voir « 3. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

Appelants réels :

- `livrer` : une session, à la main (`sujet/SKILL.md:46`, `chantier/SKILL.md:112`, `chaine-de-production.md:39`) ; `livrer_prets` (l. 1112).
- `livrer_prets` : `traiter_sujets` (`boucle.sh:325`, sortie relue par `sed`, `PR #<n> ouverte` → `LIVRÉ : PR #<n> ouverte`).
- `fait_sur` : `verifier_ticket` (l. 207), appelée par `demarrer` (l. 399, 416, 425).

Règles à lire : l'en-tête de `suj/sujet.sh` (l. 1-99).

## Décisions

Tenues : `A-15` (`livrer` ne pose plus `à-fusionner` ; sans `gh` utilisable, fichier de titre et de corps, code dédié, ouverture par l'outil GitHub MCP ; `fait_sur` lit tout le flux par `awk` ; `github.sh:216` corrigé à la source ; le catalogue des gates reste au `## Fog`). Ce que le ticket précise :

1. **`livrer`.**
   - **`gh` utilisable** : `command -v gh` réussit **et** `gh api user --jq .login` rend un login. Contrôlé après la phase de la carte, avant toute lecture GitHub.
   - **Sans `gh` utilisable** : `livrer` fait tout ce que git permet (gel, migrations, corps, branche jetable poussée d'une livraison intermédiaire), puis écrit le fichier `<git-common-dir>/livraison-<nom>.md` (chemin absolu, hors de l'arbre de travail) : première ligne le titre, une ligne vide, puis le corps. Il affiche, et sort en 14 :

     ```text
     PR NON OUVERTE (gh indisponible) : l'ouvrir par l'outil GitHub MCP.
       D'abord : list_pull_requests(owner: "<owner>", repo: "<repo>", base: "sujet/<nom>", state: "open") ne rend rien ; sinon, ne pas livrer.
       Puis : create_pull_request(owner: "<owner>", repo: "<repo>", base: "develop", head: "<tête>", title: <ligne 1 du fichier>, body: <le fichier à partir de la ligne 3>)
       Fichier : <chemin absolu>
       Puis poser à-fusionner après la relecture de la PR (issue_write).
     ```

     `owner` et `repo` se lisent dans l'URL d'`origin`, comme `ticket-libre.mjs:113`.
   - **Avec `gh`** : la lecture des sous-PR ouvertes (l. 848) se lit dans une variable ; une réponse qui n'est pas un nombre (`^[0-9]+$`) est une lecture GitHub en échec, traitée comme « sans `gh` utilisable » (fichier, sortie 14), jamais comme des sous-PR ouvertes. Un `POST pulls` refusé de même : fichier, la sortie de `gh` sur la sortie d'erreur, sortie 14.
   - **Message**, PR ouverte sans label : `PR #<n> ouverte (<tête> → develop), sans à-fusionner : le poser après la relecture de la PR`. Il garde `PR #<n> ouverte`, que `boucle.sh:325` lit.
   - **`ETIQUETER=1`** (posé par `livrer_prets` seul, sur l'appel de la fonction) : `livrer` pose `à-fusionner` après l'ouverture et écrit `PR #<n> ouverte (<tête> → develop), étiquetée à-fusionner`, le message d'aujourd'hui.
   - Raisons : le label est un ordre de fusion et se pose après relecture, comme pour toute PR ; le capitaine, lui, livre un sujet dont chaque sous-PR est déjà entrée relue, et une livraison qui touche un chemin possédé attend de toute façon l'approbation d'un propriétaire sur develop (`file.sh`, « attend un propriétaire »). Sans `ETIQUETER`, `livrer-prets` ouvrirait des PR que personne n'étiquette.
2. **`fait_sur`** :

   ```bash
   fait_sur() {
     git show "$1:$2" | awk '!vu && /^(- )?\**Status\**[[:space:]]*:/ { vu = 1; l = tolower($0); if (l ~ /:\** *(resolved|fait|done)/) ok = 1 } END { exit !ok }'
   }
   ```

   `awk` lit tout le flux : `git show` ne reçoit jamais SIGPIPE. Même lecture qu'aujourd'hui : la première ligne `Status:`, sans casse. Aucune autre lecture de `sujet.sh` n'a ce motif (`grep -n '| *grep -q'` ne rend que la l. 189) ; celles de la l. 177, 245 et 264 finissent par `|| true` et gardent leur résultat.
3. **`github.sh:216` est absorbé par le ticket 9.** `A-21` (chantier 2) réécrit `checks_exiges` (l. 212-218) en une lecture GitHub qui refuse une réponse vide, non JSON ou porteuse de `message`. Le `[ "$(jq 'length' …)" -gt 0 ]` de la l. 216 disparaît avec elle. Le corriger ici, puis le réécrire au ticket 9, ferait deux fois le même travail sur un fichier chaud. Le ticket 9 ([`9-panne-de-github-en-pause-et-refus-du-pre-push-renvoye.issue.md`](9-panne-de-github-en-pause-et-refus-du-pre-push-renvoye.issue.md), en cours d'écriture le 2026-11-18) le prend dans son objet (`## Comments`, « Lot 7 du chantier 1 ») et en porte le banc : « checks_exiges : une panne n'est jamais « aucun check exigé » (sortie 5) ; … une réponse qui n'est pas un tableau sort en 5 ».
4. **Le catalogue des gates** : hors de ce ticket, sa source n'est pas retrouvée (`## Fog` de la carte du programme).
5. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le nom de la variable, le texte des lignes d'aide tant qu'il porte les quatre gestes. Elle ne tranche **pas** : le code 14, le fichier hors de l'arbre de travail, le label gardé par `livrer-prets`, la lecture en échec traitée comme « sans `gh` ».

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 1 fusionné. Chaque banc est vu rouge avant le code qui le rend vert.

### 1. Les bancs, chacun vu rouge

Dans `suj/sujet.test.mjs` :

1. **« livrer ouvre la PR sans à-fusionner, et le dit »**. Fixture : celle de « livrer en 5-livraison » (l. 552). Attendu : sortie 0, un seul `POST pulls` au journal, aucun `POST issues/<n>/labels`, la ligne `sans à-fusionner`. **Rouge sur `main`** : le label est posé.
2. **« livrer-prets étiquette toujours ses livraisons »** : le test de la l. 344, **inchangé**. Vert sur `main` ; il garde le geste du capitaine.
3. **« livrer sans gh utilisable : sortie 14, fichier de titre et de corps hors de l'arbre, aucune PR, l'aide MCP affichée »**. Le faux GitHub en `compteIllisible` (`user` répond 403), ou `gh` retiré du PATH. Attendu : sortie 14, le fichier à `<git-common-dir>/livraison-demo.md` (ligne 1 le titre, puis le corps), `create_pull_request` et `list_pull_requests` dans la sortie, aucun `POST pulls`, l'arbre de travail propre. Variante en phase 4 : la branche jetable est poussée, le fichier nomme sa tête. **Rouge sur `main`** : sortie 4 « des sous-PR visent encore », ou 1.
4. **« demarrer accepte un bloquant fait même quand son fichier dépasse le tampon d'un tube (SIGPIPE sous pipefail) »**. Fixture : celle de la l. 42, le fichier du bloquant porte `Status: Fait` puis 1 Mo de texte. Attendu : sortie 0, `base=sujet/<nom>`. **Rouge sur `main`** : sortie 4, « bloqué par … pas encore fait ».

Tests existants rejoués sans changement : `sujet.test.mjs:319` (dry-run), `:344`, `:363`, `:519`, `:541`, `:552` ; `fusionner.test.mjs` « sujet.sh : ouvrir, livrer intermédiaire, … réveillent le pre-push » et le suivant (le cas « livrer intermédiaire » refusé par le pre-push n'ouvre toujours aucune PR). Si l'un rougit, le nommer dans la PR avant d'y toucher.

### 2. Le code

`fait_sur`, puis `livrer` et `livrer_prets`, puis l'en-tête. Commits sous les hooks, jamais `--no-verify`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une sortie nouvelle et un geste qui ne pose plus le label : une mineure, comme le ticket 1 pour ses sorties nouvelles. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  `sujet.sh livrer` ouvre la PR de livraison sans `à-fusionner` : la session qui livre le pose après la relecture de la PR (contre-revue si elle touche un chemin sensible). `livrer-prets`, le geste du capitaine, étiquette toujours ses livraisons. Sans `gh` utilisable (session cloud), `livrer` écrit le titre et le corps dans un fichier, sort en 14 et donne les appels de l'outil GitHub MCP. `sujet.sh demarrer` ne refuse plus un ticket dont le bloquant est fait dans un fichier long (SIGPIPE).

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (et `/maj-skills:fusionner poser` si la version précédente n'a pas été reposée).
  3. Dans la même PR, reporter dans `docs/agents/chaine-de-production.md` (§ 2, point 6) la précision du gabarit : la PR d'une livraison intermédiaire s'ouvre sans `à-fusionner`.
  4. Relancer le capitaine une fois cette PR entrée dans develop (`livrer-prets` est joué par la boucle, qui prend les scripts de develop au tour suivant ; rien à recopier pour la veille).

  **Iroki** : sa remontée A5 (le label posé avant la contre-revue) est corrigée ici. Son `sujet.sh` a divergé de 1 820 lignes : reposer remplace sa version ; sinon, son conducteur reporte à la main le retrait du label dans `livrer`, `ETIQUETER=1` dans `livrer_prets`, la sortie 14 et le nouveau `fait_sur`.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `livrer` sans label | `sujet.test.mjs` « livrer ouvre la PR sans à-fusionner, et le dit » |
| `livrer-prets` étiquette | `sujet.test.mjs` « livrer-prets ouvre la PR du seul sujet prêt, étiquetée à-fusionner » (inchangé) |
| `livrer` sans `gh` : sortie 14, fichier, aide MCP | `sujet.test.mjs` « livrer sans gh utilisable : sortie 14, fichier de titre et de corps hors de l'arbre, aucune PR, l'aide MCP affichée » |
| `fait_sur` sans SIGPIPE | `sujet.test.mjs` « demarrer accepte un bloquant fait même quand son fichier dépasse le tampon d'un tube (SIGPIPE sous pipefail) » |
| `livrer` sous les hooks | `fusionner.test.mjs` « sujet.sh : ouvrir, livrer intermédiaire, rafraichir, relancer et geler réveillent le pre-push » (inchangé) |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/sujet/scripts/sujet.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs` ;
   - `node --test scripts/poses.test.mjs` ;
   - `bash -n skills/chaine/sujet/scripts/sujet.sh`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - `fait_sur` remis à `grep -m1 | grep -q` : le banc 4 rougit ;
   - `livrer` repose le label sans `ETIQUETER` : le banc 1 rougit ;
   - `livrer_prets` sans `ETIQUETER=1` : le test de la l. 344 rougit ;
   - la lecture des sous-PR non validée comme un nombre : le banc 3 rougit (sortie 4).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` (scripts des sujets : chemins sensibles du gabarit, `scripts/chaine/**`), section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): sujet.sh livrer sans label ni gh obligatoire, demarrer sans SIGPIPE (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- `github.sh:216` : ticket 9 (la Décision 1 (`lire_github`) et la ligne `checks_exiges` (`github.sh:212-218`) du tableau « Où » du ticket 9, prouvées par son banc 2).
- Le catalogue des gates absent du gabarit des index générés : `## Fog` de la carte du programme, tant que sa source n'est pas retrouvée chez `fedora`.
- Le refus du pre-push classé par la trace de husky (`A-22`), qui touche aussi `livrer` : ticket 9.
- Les autres gestes de `sujet.sh` qui appellent `gh` (`ouvrir --specs`, `regrouper`, `clore`) : `recibler_specs` (l. 483-490) a déjà son repli MCP ; les autres sont des gestes du capitaine.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, et sur `develop` d'Iroki (`e3dbd235`). Écarts avec la spec et choix à confirmer :
  - **`livrer-prets` étiquette toujours** : `A-15` dit « `livrer` ne pose plus `à-fusionner` », sans parler de `livrer-prets`, qui l'appelle (l. 1112). Sans label, ses livraisons ne seraient fusionnées par personne. Le ticket garde le label pour le seul geste du capitaine (`ETIQUETER=1`). **À confirmer par l'architecte** ; l'autre voie (le conducteur pose le label de chaque livraison) changerait `chantier/SKILL.md` § 7.
  - **`github.sh:216` absorbé par le ticket 9** (la Décision 1 (`lire_github`) et la ligne `checks_exiges` (`github.sh:212-218`) du tableau « Où » du ticket 9, prouvées par son banc 2), au lieu d'être « validé avant comparaison » ici : la spec du chantier 2 place ce lot après le ticket 9 (« Les lots 2 à 4 et 7 du chantier 1 se placent après le ticket 9 »), qui réécrit la fonction entière. Le ticket 9, écrit en parallèle, le dit aussi de son côté et en porte le banc.
  - **Code 14** : `grep -E '(sortir|exit|return) 1[2-9]'` ne rend rien dans `sujet.sh` sur `4a45634` ; le 12 est pris par le ticket 1 (arbre du squash différent), le 13 par le ticket 8 (préparation du capitaine en échec, `veille.sh`), le 10 signifie « arrêt demandé » dans `boucle.sh`. Un code distinct dans toute la chaîne évite qu'un `VEILLE ARRÊTÉE` ou une ligne du skill se lise de deux façons.
  - **Une lecture GitHub en échec dans `livrer` vaut « sans `gh` »** : la spec ne le disait pas ; aujourd'hui elle donne un motif faux (« des sous-PR visent encore »).
  - **Le fichier vit sous `<git-common-dir>`**, pas dans l'arbre de travail : un fichier non suivi dans l'arbre ferait refuser le prochain geste du capitaine (« arbre de travail pas propre », sortie 6).
- 2026-11-19 — Fille (session du ticket 7), choix tenus ou tranchés prudemment :
  - Partie de `origin/main` `ebe60ee` (plugin 7.24.0) ; version livrée : **7.25.0** (mineure : sortie 14 nouvelle).
  - `ETIQUETER=1` posé par `livrer_prets` seul ; `livrer` sans lui n'étiquette jamais. Code 14, fichier sous `<git-common-dir>/livraison-<nom>.md`, lecture en échec = « sans gh » : tenus comme décidés.
  - « `gh` utilisable » = `command -v gh` et `gh api user --jq .login` non vide ; la lecture des sous-PR garde `gh api … --jq length` validé `^[0-9]+$` (lecture isolée dans `livrer`, qui sort en 14 plutôt qu'en 5 : le ticket décide que l'échec vaut « sans gh »). Elle ne passe pas par `lire_github`, qui sortirait en 5 : ce serait contredire la Décision 1 ; à contre-lire.
  - `POST pulls` refusé : sortie de `gh` relayée sur stderr par `masquer_url`, puis fichier et 14.
  - Appelé par `livrer-prets` sans `gh` : la sortie 14 interrompt la boucle des sujets (le capitaine a `gh`) ; non traité.
  - Banc ajouté en plus des quatre : lecture des sous-PR vide avec `gh` connecté (panne simulée), rouge sous la mutation « lecture non validée » (le banc 3, `compteIllisible`, ne l'atteint pas : `user` échoue avant).
  - Mutations jouées, toutes rouges : `fait_sur` en `grep -m1 | grep -q` (banc SIGPIPE) ; label posé sans `ETIQUETER` (banc « sans à-fusionner ») ; `livrer_prets` sans `ETIQUETER=1` (« livrer-prets ouvre la PR… » et « livrer refuse un sujet gelé… ») ; sous-PR non validées comme nombre (banc de lecture vide).

