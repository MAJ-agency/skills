# La veille prépare l'environnement du capitaine et ne lance plus un passage qu'elle n'aurait pas le temps de finir

Status: Fait — PR #120
Type: défaut
Modèle: opus — une clé de contrat qui fait exécuter une commande par le capitaine (lue au bon endroit, échec fermé), un redémarrage de machine à reconnaître sans dépendre de l'horloge, et une échéance à faire respecter par deux scripts (la veille et la boucle qu'elle lance) ; une erreur arrête le capitaine de tous les projets ou le laisse fusionner sur un environnement cassé.
Blocked by: 1 (`skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont des fichiers chauds du ticket 1 : partir de `main` après sa fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/veille.sh`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/boucle-outils.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 8 (points A1 et A2, décisions `A-19` pour la part du capitaine, `A-20` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 1 et 2. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**), puis le ticket 1 fusionné (7.16.0 visée). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu chez Iroki** (16 au 18 novembre). La plateforme recycle la machine du capitaine plusieurs fois par jour. La session perd alors sa base locale, et le pre-push de la mise à jour échoue ensuite (coverage-diff sans base). Une base recréée en `SQL_ASCII` a cassé `normalize()`, et une migration de sujet restée en base a cassé `db:migrate`. Rien, dans le plugin, ne prépare l'environnement du capitaine : `veille.sh` lance la boucle sans autre geste. Par ailleurs, la limite de 2 h des tâches de fond tue la veille au milieu d'un passage : sa durée par défaut est de 110 minutes (`veille.sh:22`, `:30`), et elle n'est testée qu'avant chaque sonde (`veille.sh:78-80`). Une boucle lancée à la 109ᵉ minute enchaîne les passages jusqu'à ce que la tâche soit tuée, et laisse une PR à moitié mise à jour.

**Quand le ticket est fait** (`A-19`, `A-20`) :

1. Une clé facultative de `.claude/chaine.json`, `preparerCapitaine`, lue sur `origin/develop` (jamais dans l'arbre de travail), nomme une commande du projet. La veille la joue avant de lancer la boucle, la première fois sur une machine et après chaque redémarrage de celle-ci, reconnu à `/proc/sys/kernel/random/boot_id`.
2. Tant que la préparation n'a pas réussi, aucune boucle n'est lancée, donc rien n'est fusionné. Un échec arrête la veille avec un code dédié, **13** (`VEILLE ARRÊTÉE`), et le capitaine le dit à son lanceur.
3. La veille dure **75 minutes** par défaut. Aucun passage ne commence à moins de **40 minutes** (`--marge`) de la limite de 2 h de la tâche de fond : la veille transmet cette échéance à la boucle, qui la vérifie avant chaque passage.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose et ajoute.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`. Lignes relues sur `4a45634` ; le ticket 1 aura décalé celles de `boucle.sh` (voir « Ce que le ticket 1 aura changé »).

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `fus/veille.sh` | 1-26 | En-tête : la préparation (clé, `boot_id`, fichier gardé, sortie 13), la durée (75 min), la marge (40 min), l'échéance transmise à la boucle (`BOUCLE_ECHEANCE`), la ligne `ÉCHÉANCE` de la boucle. |
| idem | 29-40 | `duree=75` ; option `--marge <min>` (défaut 40) ; validation : `--marge` en minutes entières, strictement sous la limite (120, ou `VEILLE_LIMITE` des bancs) ; `--duree` un nombre positif, décimal permis (`veille.test.mjs:88` passe `--duree 0.04`) ; sinon sortie 64 et un message qui nomme l'option fautive. Ligne de départ : `VEILLE <hh:mm> : durée <d> min, aucun passage après <hh:mm> (marge <m> min)`. |
| idem | après 42 (`heure`) | `preparer_si_besoin` (Décision 1) et le calcul de l'échéance (Décision 3). |
| idem | 52-61 (`lancer`) | Avant `boucle.sh` : `preparer_si_besoin`, puis `BOUCLE_ECHEANCE` exportée. Un échec de préparation sort en 13 sans lancer la boucle. |
| idem | 73-101 | Le `while` s'arrête aussi à l'échéance : passé l'échéance, plus de relance de la boucle, `VEILLE FINIE <hh:mm> (échéance)`. |
| `fus/boucle.sh` | 1-88 (en-tête) | Un paragraphe : `BOUCLE_ECHEANCE` (secondes depuis l'époque Unix, posée par la veille) ; passé l'échéance, plus aucun passage ; `ÉCHÉANCE`, sortie 0. |
| idem | après 177 (`verifier_arret` du démarrage) | `BOUCLE_ECHEANCE` posée mais pas un entier positif : sortie 64, message ; aucune lecture GitHub. |
| idem | `while :` (l. 342-346 sur `main`), `passer` (l. 332-336), `traiter_sujets` (l. 304-305 sur `main`, avant `sujet.sh fusionner` ; sur la PR 115 du ticket 1, le `while` en sous-shell du tube est à la l. 278 et le code y remonte par `PIPESTATUS`, l. 322-330) | `verifier_echeance` en tête de tour, avant chaque `passer` et avant chaque `sujet.sh fusionner` : passé l'échéance, `ÉCHÉANCE <hh:mm> : plus de passage avant la fin de la veille, file laissée`, puis sortie 0 sans le rafraîchissement de fin (l. 391-392 sur `main`). Dans `traiter_sujets`, le `while` tourne dans le sous-shell d'un tube : `verifier_echeance` y fait sortir le sous-shell avec un code dédié, que la boucle relit après le tube (`PIPESTATUS`), comme la sortie 12 du ticket 1, puis écrit `ÉCHÉANCE` et sort en 0. Sans `BOUCLE_ECHEANCE` (boucle lancée à la main), rien ne change. |
| `fus/veille.test.mjs` | 22-62 (`veilleJouet`) | La doublure tourne dans un dépôt git jouet (`git init`, `cwd`), jamais dans le dépôt du plugin ; `VEILLE_BOOT_ID` vise un fichier du banc ; la doublure de `boucle.sh` note `BOUCLE_ECHEANCE`. Puis les bancs de « Ordre de travail ». |
| `fus/boucle-outils.test.mjs` | modèle l. 18-55 (`fileSh`, `passerSh`, `jouet`), l. 228-239 | Le banc de l'échéance, sur des scripts de remplacement publiés sur le develop du jouet. |
| `skills/chaine/socle-chaine-de-production/references/chaine.json` | 2 (`$comment`) | La clé facultative `preparerCapitaine` y est décrite. Le gabarit ne la porte pas : sans elle, rien n'est joué. |
| `skills/chaine/socle-chaine-de-production/references/CONTENU.md` | 5 | « Sept clés, et rien d'autre » : ajouter la clé facultative, son rôle et qui la lit (`veille.sh`). |
| `skills/chaine/fusionner/SKILL.md` | lignes de la PR 115 du ticket 1 : 46-54 (« Mise en place »), 68, 75-76, 78, 106 et suivantes (« Enseignements ») ; sur `4a45634` : 28-36, 50, 57-58, 60, 88 | Voir « Les textes » ; relire les lignes sur `main` après la fusion du ticket 1. |
| `skills/chaine/fusionner/references/CONTENU.md` | 27-29, 51 | § `veille.sh` : la préparation, la durée, la marge, l'échéance ; § « Les tests » : les bancs nouveaux de `veille.test.mjs` et `boucle-outils.test.mjs`. |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (voir « La version et la note »). |

**Ce que le ticket 1 aura changé** (à relire sur `main` avant de commencer) : `boucle.sh` traite la sortie 12 (`ARRÊT`), et `traiter_sujets` fait remonter un code de son sous-shell par `PIPESTATUS` ; `fusionner/SKILL.md` l. 58 et 60 portent la sortie 12 et `ARBRE DIFFÉRENT` ; `NOTES-DE-VERSION.md` existe, ouvert par la note de 7.16.0. Surtout, `sujet.sh fusionner` attend désormais la CI de la sous-PR qu'il met à jour (`attendre_ci`, jusqu'à 60 minutes par tour) : un passage vers un sujet peut durer autant qu'un passage vers `develop`, d'où le contrôle de l'échéance avant chaque `sujet.sh fusionner`. `veille.sh` n'est pas touché par le ticket 1 : la sortie 12 de la boucle la traverse comme les autres codes (`lancer`, l. 55-58).

Appelants réels :

- `veille.sh` est lancé par la session du capitaine, en tâche de fond, depuis une copie (`fusionner/SKILL.md` § « Boucle », l. 46-51).
- `boucle.sh` est lancée par `veille.sh` (`lancer`), ou à la main (`boucle.sh`, `--reprendre`) : sans `BOUCLE_ECHEANCE`, elle se comporte comme aujourd'hui. Son `exec` de relance (l. 211) garde l'environnement, donc l'échéance.
- La commande de `preparerCapitaine` n'est jouée que par `veille.sh`.

Aucune CLI nouvelle. `scripts/points-d-entree.test.mjs` ne change pas.

Règles à lire : `fusionner/SKILL.md` § « Boucle » (l. 40-66), et l'en-tête de `fus/boucle.sh` (l. 1-88).

## Décisions

Tenues (spec et programme) : `A-19` (clé `preparerCapitaine`, redémarrage reconnu par `boot_id`, échec = arrêt sans fusion, contenu de la commande au projet), `A-20` (75 minutes, marge de 40, option `--marge`), `A-34` (la note dit ce qu'Iroki repose). Le gabarit `demarrer-local.sh` en UTF8 est le ticket 10, pas celui-ci.

Précisions du ticket :

1. **`preparer_si_besoin`**, dans `veille.sh`, joué avant chaque lancement de la boucle (le premier compris) :
   - **la clé** se lit sur `origin/develop` seulement, après `git fetch -q origin develop` : `git show origin/develop:.claude/chaine.json`, le contrat de la branche intégrée. **Jamais dans l'arbre de travail** : une sortie de `passer.sh` en plein passage (`sortir 3` après `pnpm install`, l. 249, ou « CI non déclenchée », l. 310) laisse le worktree sur `capitaine/<n>`, donc sur le code d'une PR, qui y ferait jouer sa propre commande. Pour la même raison, avant de jouer la commande, la veille exige un worktree propre et le détache sur `origin/develop` (`git switch -q --detach origin/develop`, comme la trappe de `boucle.sh:179-184`) ; worktree pas propre : sortie 13, « worktree du capitaine pas propre : préparation non jouée ». Un fetch en échec : sortie 13 (« origin/develop illisible : préparation inconnue »), jamais une préparation sautée. Le fichier absent sur `origin/develop`, ou la clé absente, ou une chaîne vide : aucune préparation, aucune ligne, comportement d'aujourd'hui. Un contrat présent mais illisible (JSON invalide), ou une clé qui n'est pas une chaîne : sortie 13 (« contrat illisible : préparation inconnue »), jamais une préparation sautée ;
   - **le redémarrage** : le `boot_id` courant se lit dans `${VEILLE_BOOT_ID:-/proc/sys/kernel/random/boot_id}` (variable réservée aux bancs) ; la valeur de la dernière préparation réussie, dans `<git-common-dir>/capitaine-boot-id` (`git rev-parse --path-format=absolute --git-common-dir`, comme `boucle.sh:94`). La préparation se joue si les deux diffèrent, ou si le fichier gardé manque ;
   - **sans `boot_id` lisible** (un capitaine local sous macOS, par exemple) : la préparation se joue à chaque démarrage de la veille, jamais entre deux lancements de la boucle, et la veille le dit une fois (`VEILLE <hh:mm> : boot_id illisible, préparation jouée à chaque démarrage de la veille`) ;
   - **le jeu** : `sh -c "<commande>"`, entrée standard sur `/dev/null`, depuis la racine du worktree (`git rev-parse --show-toplevel`), sa sortie dans le journal entre deux lignes, `VEILLE <hh:mm> : préparation (« <commande> »)` puis `VEILLE <hh:mm> : préparation réussie`. Aucun délai imposé : la commande appartient au projet ;
   - **la réussite** écrit le `boot_id` dans le fichier gardé, d'un seul coup (fichier voisin, puis `mv`) ;
   - **l'échec** (code non nul) : rien n'est écrit, la boucle n'est pas lancée, `VEILLE ARRÊTÉE <hh:mm> : préparation du capitaine en échec (sortie <k> de « <commande> ») : aucune fusion ; corriger l'environnement, puis relancer la veille`, et la veille sort en 13.
2. **Sortie 13**, la première libre après le 12 du ticket 1 : `grep -rnE '(sortir|exit|return) 1[3-9]\b' skills/chaine` ne rend rien sur `4a45634`. La veille transmet les codes de la boucle, qui transmet ceux de `passer.sh` (`boucle.sh:388`) : 13 ne doit être pris par aucun des trois. Le refaire juste avant le code ; s'il est pris entre-temps, le dire sous `## Comments` et prendre le suivant libre.
3. **L'échéance** est absolue, comptée depuis le démarrage de la veille : `BOUCLE_ECHEANCE = <date +%s au démarrage> + (limite - marge) × 60`. La limite vaut 120 minutes (« limite des tâches de fond », nommée et commentée dans `veille.sh`) ; `VEILLE_LIMITE` (minutes, décimal permis), réservée aux bancs sur le modèle de `VEILLE_BOOT_ID`, la remplace pour qu'un banc atteigne l'échéance en quelques secondes. Avec les défauts, aucun passage ne commence après la 80ᵉ minute : la veille cesse de sonder à la 75ᵉ, et une boucle lancée à la 74ᵉ peut encore commencer un passage jusqu'à la 80ᵉ. Une `--duree` plus longue que `limite - marge` ne repousse pas l'échéance : passé l'échéance, la veille ne relance plus la boucle et finit (`VEILLE FINIE <hh:mm> (échéance)`).
4. **Dans la boucle, `verifier_echeance`** compare `date +%s` à `BOUCLE_ECHEANCE`, aux trois endroits du tableau. Passé l'échéance, la boucle écrit la ligne `ÉCHÉANCE` et sort en 0 : rien n'est en cours, aucune PR n'est touchée. Elle saute le rafraîchissement de fin des sujets, qui pousse sous les hooks et peut durer.
5. **Les messages lus par les bancs et le `Monitor`** (à garder tels quels) : `VEILLE ARRÊTÉE`, `VEILLE FINIE`, `préparation réussie`, `préparation du capitaine en échec`, `ÉCHÉANCE`.
6. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne de `preparer_si_besoin`, le nom du fichier voisin, le découpage des bancs. Elle ne tranche **pas** : le code 13, les défauts 75 et 40, l'échéance absolue transmise par `BOUCLE_ECHEANCE`, la lecture du contrat sur `origin/develop` seulement et le worktree détaché avant la préparation, l'échec fermé sur un contrat illisible, l'entier exigé pour `--marge` seulement.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 1 fusionné. Chaque banc est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Le banc de la veille, isolé du dépôt du plugin

Aujourd'hui `veilleJouet` lance la veille depuis le répertoire du processus de test, c'est-à-dire le dépôt du plugin : une veille qui lit `.claude/chaine.json` et écrit sous `<git-common-dir>` y écrirait. D'abord : le dossier jouet devient un dépôt git (`git init -q`), passé en `cwd`, avec `VEILLE_BOOT_ID` vers un fichier du dossier jouet. Les tests existants restent verts.

### 2. Les bancs, chacun vu rouge

Dans `fus/veille.test.mjs`, titres à garder tels quels :

1. « préparation jouée avant le premier lancement, boot_id gardé ; veille relancée sur le même boot : pas rejouée » — le `develop` du dépôt nu du jouet porte `.claude/chaine.json` avec `preparerCapitaine` qui écrit dans une trace ; deux veilles de suite ; la trace a une ligne, et la préparation précède le premier lancement de la boucle.
2. « boot_id changé entre deux lancements de la boucle : préparation rejouée avant le lancement suivant » — la doublure de `boucle.sh` réécrit le fichier `VEILLE_BOOT_ID` à son premier lancement ; une PR prête à la sonde suivante relance la boucle ; la trace a deux préparations, chacune avant un lancement.
3. « préparation en échec : VEILLE ARRÊTÉE, sortie 13, boucle jamais lancée, boot_id non écrit ».
4. « sans clé preparerCapitaine : rien n'est joué ; contrat illisible ou clé non textuelle : sortie 13 sans lancer la boucle ».
5. « boot_id illisible : préparation jouée au démarrage, une ligne le dit, pas de nouvelle préparation entre deux lancements ».
6. « défauts : durée 75 min, marge 40 min, et BOUCLE_ECHEANCE transmise à la boucle » — `--sondes 0`, sans `--duree` ; la ligne de départ dit `durée 75 min` et `marge 40 min` ; l'échéance que note la doublure tient dans `[départ + 80 min - 5 s, départ + 80 min + 5 s]`.
7. « --marge invalide (non entière, 120 ou plus) : sortie 64, un message qui nomme --marge ; --duree décimale acceptée » — `--duree 0.04` reste valide (le test de la l. 88 reste vert).
7 bis. « preparerCapitaine se lit sur origin/develop, jamais dans l'arbre de travail : la commande d'une branche de PR n'est pas jouée » — le worktree du jouet est laissé sur une branche dont `.claude/chaine.json` nomme une autre commande (qui écrit `PR` dans la trace) ; seule celle d'`origin/develop` est jouée, et le worktree finit détaché sur `origin/develop`. Avec un worktree sale : sortie 13, rien de joué.
7 ter. « échéance passée : plus de relance de la boucle » — `VEILLE_LIMITE` et `--marge` posés pour que l'échéance tombe après le premier lancement ; une PR prête aux sondes suivantes ne relance plus la boucle ; `VEILLE FINIE … (échéance)`.
7 quater. « --duree au-delà de limite - marge : VEILLE FINIE (échéance) avant la fin de la durée » — `VEILLE_LIMITE=0.1`, `--marge 0`, `--duree 1` : la veille finit à l'échéance, la ligne le dit.

La fixture `veilleJouet` gagne un dépôt nu `origin` avec un `develop`, cloné dans le dossier jouet, pour que la veille y fasse son `fetch` et son `git show origin/develop:…`.

Dans `fus/boucle-outils.test.mjs`, sur le modèle de « le fichier d'arrêt est lu au début de chaque tour » (l. 228) :

8. « échéance passée : ÉCHÉANCE, sortie 0, aucun passage » — `BOUCLE_ECHEANCE` à `date +%s - 1`, `file.sh` qui annonce une PR prête : la trace ne porte aucun `passer`.
9. « échéance atteinte entre deux passages : le premier passe, pas le second » — `BOUCLE_ECHEANCE` à `date +%s + 10`, `file.sh` qui annonce une PR prête tant que `passer.sh` n'a pas tourné deux fois (`fileSh(1, 2)`), et un premier `passer.sh` qui dort 11 s par `/bin/sleep 11` (le `sleep` du jouet est factice). La trace ne porte qu'une ligne `passer`, et la sortie la ligne `ÉCHÉANCE`. C'est le seul banc qui dépend de l'horloge, de quelques secondes.
10. « BOUCLE_ECHEANCE illisible : sortie 64, aucun passage ».
11. « échéance avant une sous-PR : la boucle s'arrête sur ÉCHÉANCE, sans lancer sujet.sh fusionner » — `file.sh` annonce une sous-PR `sujet/x : prête`, `BOUCLE_ECHEANCE` passée après le début du tour (un `sujet.sh` de remplacement pour `regrouper-series` qui dort au-delà) ; la trace ne porte aucun `fusionner`, la sortie porte `ÉCHÉANCE`, le code est 0. Sans la remontée par `PIPESTATUS`, le sous-shell sortirait seul et la boucle passerait la PR suivante vers `develop`.

Tous **rouges sur `main`** (sauf la seconde moitié du banc 7, `--duree 0.04`, verte sur `main` et après) : la veille n'a ni préparation, ni `--marge`, ni ligne de départ ; la boucle ne lit pas `BOUCLE_ECHEANCE`. Le banc 7 l'est aussi : `main` répond `usage` sans nommer `--marge`.

### 3. Le code

`veille.sh` (options, ligne de départ, `preparer_si_besoin`, échéance), puis `boucle.sh` (`verifier_echeance`, validation au démarrage). `bash -n` sur les deux.

### 4. Les textes

- `skills/chaine/fusionner/SKILL.md` :
  - § « Mise en place » (l. 46-54 sur la PR 115) : une phrase après le bloc : « Si le projet a besoin d'un environnement que la machine du capitaine perd à un recyclage (base locale), il le déclare dans `preparerCapitaine` de `.claude/chaine.json` (lu sur `origin/develop`) : la veille le prépare avant le premier lancement de la boucle et après chaque redémarrage de la machine, et ne lance rien tant que ce n'est pas fait. »
  - l. 68 sur la PR 115 (50 sur `4a45634`) : `--pause <s> (120), --duree <min> (75), --marge <min> (40)`.
  - l. 75 sur la PR 115 (57) : « durée écoulée (75 min ; aucun passage ne commence à moins de 40 min de la limite de 2 h d'une tâche de fond, la boucle s'arrête sur `ÉCHÉANCE`) ».
  - l. 76 sur la PR 115 (58) : la sortie 13, `préparation du capitaine en échec` : lire la sortie de la commande dans le journal, corriger l'environnement, relancer la veille ; le dire à son lanceur.
  - l. 78 sur la PR 115 (60) : `ÉCHÉANCE|préparation` dans le filtre du `Monitor`.
- `fusionner/references/CONTENU.md` § `veille.sh` et § « Les tests » ; `socle-chaine-de-production/references/chaine.json` (`$comment`) et `CONTENU.md:5`, comme dans « Où ».

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici une clé de contrat nouvelle et facultative, une option et des défauts changés : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier (le ticket 1 l'a créé ; s'il manquait, le créer avec l'en-tête que le ticket 1 donne, recopié tel quel) :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  La veille du capitaine dure 75 minutes, et aucun passage ne commence à moins de 40 minutes de la limite de 2 h d'une tâche de fond (`--marge`) : la boucle s'arrête sur `ÉCHÉANCE` au lieu d'être tuée au milieu d'une mise à jour. Une clé facultative de `.claude/chaine.json`, `preparerCapitaine`, lue sur `origin/develop` seulement, nomme une commande que la veille joue, worktree détaché sur `origin/develop`, avant de lancer la boucle sur une machine neuve et après chaque redémarrage (lu dans `/proc/sys/kernel/random/boot_id`) ; tant qu'elle n'a pas réussi, rien n'est fusionné, et son échec arrête la veille en sortie 13.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser` (`veille.sh`, `boucle.sh` et leurs bancs).
  3. Si la machine du capitaine perd un environnement à son recyclage (base locale), ajouter à `.claude/chaine.json` la clé `"preparerCapitaine": "<commande>"`, dans la même PR ou une autre (`.claude/**` est un chemin sensible : contre-revue). Un projet du socle Nest peut y mettre `bash scripts/db/demarrer-local.sh`.
  4. Relancer le capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée, sans `--duree 110` si le lancement le portait.

  **Iroki**, hors du plugin : sa commande de préparation (base en UTF8, migrée depuis `develop` seul, refus d'une migration absente de `develop`) s'écrit chez lui, puis se déclare dans `preparerCapitaine`.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Préparation au premier lancement, pas rejouée sur le même boot | `skills/chaine/fusionner/scripts/veille.test.mjs` « préparation jouée avant le premier lancement, boot_id gardé ; veille relancée sur le même boot : pas rejouée » |
| Redémarrage reconnu entre deux lancements | idem, « boot_id changé entre deux lancements de la boucle : préparation rejouée avant le lancement suivant » |
| Échec : sortie 13, aucune boucle | idem, « préparation en échec : VEILLE ARRÊTÉE, sortie 13, boucle jamais lancée, boot_id non écrit » |
| Clé absente, contrat illisible | idem, « sans clé preparerCapitaine : rien n'est joué ; contrat illisible ou clé non textuelle : sortie 13 sans lancer la boucle » |
| `boot_id` illisible | idem, « boot_id illisible : préparation jouée au démarrage, une ligne le dit, pas de nouvelle préparation entre deux lancements » |
| Défauts 75 et 40, échéance transmise | idem, « défauts : durée 75 min, marge 40 min, et BOUCLE_ECHEANCE transmise à la boucle » |
| Options invalides, `--duree` décimale | idem, « --marge invalide (non entière, 120 ou plus) : sortie 64, un message qui nomme --marge ; --duree décimale acceptée » |
| Contrat lu sur `origin/develop` seulement, worktree détaché | idem, « preparerCapitaine se lit sur origin/develop, jamais dans l'arbre de travail : la commande d'une branche de PR n'est pas jouée » |
| Plus de relance passé l'échéance ; durée au-delà | idem, « échéance passée : plus de relance de la boucle » et « --duree au-delà de limite - marge : VEILLE FINIE (échéance) avant la fin de la durée » |
| Boucle : échéance passée, atteinte, illisible, avant une sous-PR | `skills/chaine/fusionner/scripts/boucle-outils.test.mjs`, bancs 8 à 11 |
| Scripts posés dans un projet | `scripts/poses.test.mjs` (rejoue les bancs posés) |

## Vérification

1. Ciblée, à chaque étape : `node --test skills/chaine/fusionner/scripts/veille.test.mjs skills/chaine/fusionner/scripts/boucle-outils.test.mjs` ; `bash -n` sur `veille.sh` et `boucle.sh`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli. La fixture réécrite de `veilleJouet` (étape 1) est nommée dans la PR.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR : la préparation ne relit plus le `boot_id` (banc 2) ; un échec de préparation laisse lancer la boucle (banc 3) ; la boucle ne lit plus `BOUCLE_ECHEANCE` avant `passer` (banc 9) ; le code de `verifier_echeance` ne remonte plus du sous-shell de `traiter_sujets` (banc 11) ; le contrat relu dans l'arbre de travail (banc 7 bis) ; l'échéance comptée depuis la durée au lieu de la limite de 2 h (banc 6).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` : la veille exécute une commande lue dans le contrat, et les scripts du capitaine sont des chemins sensibles du gabarit (`scripts/chaine/**`) ; son rendu va dans une section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(chaine): la veille prépare le capitaine et ne commence plus un passage trop tard (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Le gabarit `demarrer-local.sh` du socle Nest en UTF8 : ticket 10.
- La panne de GitHub et le refus du pre-push : ticket 9.
- Ce qui est propre à Iroki : sa commande de préparation, le contrôle de ses migrations.
- La durée d'un passage lui-même : depuis le ticket 1, un passage peut attendre jusqu'à trois CI de 60 minutes. La marge de 40 minutes couvre le passage ordinaire, pas ce cas (voir `## Comments`).
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, après relecture de `veille.sh`, `boucle.sh`, `github.sh` et de `fusionner/SKILL.md` sur `4a45634`, et des remontées d'Iroki. Écarts avec la spec et choix à confirmer :
  - **`boucle.sh` est un fichier chaud de plus** que la spec ne nommait pas : la veille ne voit les passages qu'entre deux boucles, et une boucle lancée juste avant la fin enchaîne les passages. Sans contrôle dans la boucle, la marge de `A-20` ne tient pas.
  - **« Il reste moins de 40 minutes »** se lit ici par rapport à la limite de 2 h, pas à la durée de la veille : la raison de `A-20` est la limite des tâches de fond. Avec 75 et 40, aucun passage après la 80ᵉ minute.
  - **« Au démarrage »** de `A-19` : la préparation se joue quand le `boot_id` diffère de la valeur gardée, absente comprise, donc au premier démarrage sur une machine et après chaque redémarrage, mais pas à chaque relance de la veille sur la même machine. C'est la raison de `A-19` contre un marqueur de `$TMPDIR` et contre une préparation à chaque tour.
  - **Le banc de la veille** lance aujourd'hui la veille depuis le dépôt du plugin (aucun `cwd`) : il faut l'isoler avant d'y lire un contrat ou d'y écrire un fichier.
  - **Un passage peut dépasser 40 minutes** depuis le ticket 1 (`attendre_ci`, 60 minutes, jusqu'à trois tours). La marge ne protège que le passage ordinaire ; la borne de ces attentes n'est pas l'objet de ce ticket.
  - **Sortie 13** : le lot 7 (`livrer` sans `gh`, « un code dédié ») pourrait la viser aussi ; c'est un code de `sujet.sh`, que la boucle ne transmet pas, donc sans collision, mais son ticket devra le vérifier.
- 2026-11-18 — Repris après une relecture neuve (« pas prêt », un bloquant) : `--duree` garde un nombre positif décimal (`veille.test.mjs:88` passe `--duree 0.04`), l'entier n'est exigé que pour `--marge` ; `verifier_echeance` remonte du sous-shell de `traiter_sujets` par `PIPESTATUS` (banc 11) ; `VEILLE_LIMITE` pour les bancs, et deux bancs de l'échéance côté veille (7 ter, 7 quater) ; banc 9 à 10 s et `/bin/sleep 11` ; sécurité : `preparerCapitaine` lu sur `origin/develop` seulement, worktree propre détaché avant la préparation (banc 7 bis), parce qu'un `sortir` de `passer.sh` (l. 249, 310) laisse le worktree sur le code d'une PR ; lignes de `fusionner/SKILL.md` relues sur la PR 115 du ticket 1.
