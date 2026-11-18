# Remontées d'Iroki — spec du chantier 2

Programme : [`../../programmes/capitaine-a-jour-et-teste.programme.md`](../../programmes/capitaine-a-jour-et-teste.programme.md). Source : [`sources/2026-11-18-remontees-iroki.md`](sources/2026-11-18-remontees-iroki.md), 21 points envoyés par le conducteur d'Iroki et transmis par le produit le 2026-11-18. État : **validée par le produit le 2026-11-18** (`P-5`). Les tickets se numérotent à la suite des lots 1 à 7 du chantier 1 ([`capitaine-a-jour-et-teste.spec.md`](capitaine-a-jour-et-teste.spec.md)).

## Le problème

Iroki a relevé, du 16 au 18 novembre, 21 défauts de la chaîne qui relèvent du plugin et non du projet.

- **Le capitaine s'arrête ou s'égare** sur des incidents ordinaires : une machine recyclée qui perd sa base, la limite de 2 h des tâches de fond, un 502 de GitHub, un refus du pre-push.
- **Les sujets, les contrôles et les gardes d'agent** ont des trous qu'Iroki a parfois déjà bouchés chez lui.
- **Le mobile en CI** a été stabilisé dans Iroki, mais le plugin ne transmet rien de cette expérience.

Les scripts d'Iroki ont divergé de ceux du plugin : sa garde lit encore les commandes par expressions, alors que le plugin les lit par jetons depuis 7.12.0. Un correctif d'Iroki se **réécrit** donc dans le plugin, il ne se copie jamais.

## Faits relevés à la source (plugin 7.15.0, `main` à `4a45634` ; `develop` et `sujet/alignement-de-la-chaine` d'Iroki)

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`, `socle/` abrège `skills/chaine/socle-chaine-de-production/references/`, `cov/` abrège `skills/monorepo/socle-tests/references/scripts/verify/`.

| Point | Iroki | Plugin |
| ----- | ----- | ------ |
| A1 préparation | UTF8 fait (`scripts/db/demarrer-local.sh`, SOC-4.34) ; étape de préparation absente | `veille.sh` ne prépare rien ; le gabarit `socle-nest-hexagonal/…/demarrer-local.sh` lance `initdb`/`createdb` sans UTF8 (l. 112, 128) |
| A2 durée | non corrigé | `veille.sh:22,30` : 110 min, testé seulement avant le tour (l. 80) |
| A3 panne GitHub | non corrigé | `boucle.sh:347` lit un échec comme une file vide ; `github.sh:202-207` passe un corps d'erreur à `jq` ; `github.sh:214-217` se replie sur `[]`, d'où « CI non déclenchée » ; deux 5 de suite = ARRÊT (`boucle.sh:361-389`) |
| A4 pre-push | corrigé, #633 (trace husky → 3, le reste → 4, renvoi) | `github.sh:107-116` range tout refus en 3, puis ARRÊT |
| A5 `livrer` | non corrigé | `sujet.sh:870-871` ; déjà couvert par `A-15` (lot 7) |
| A6 check `titre` | check propre à Iroki | le plugin n'a pas ce check ; la règle du capitaine sur la réception (`sujet.sh:571-573`, `:656-660`) n'est écrite que dans l'en-tête du script |
| B7 refs | corrigé, #643 | `sujet.sh:121` sans `--prune` ; refs locales lues sans `fetch` (l. 119, 129, 144-154, 394) |
| B8 lignée | non corrigé | refus en `sujet.sh:609`, sans la recette pour refaire |
| C9 coverage sans base | corrigé, #633 | `cov/coverage-diff.mjs:275` saute les suites sur base, puis échoue (l. 305-319) |
| C10 coverage à la réception | corrigé, #649 | déjà remonté en 7.10.1 pour la forme stricte (`fusionRecalculee`, l. 108-122) ; les autres formes sont mesurées en entier |
| C11 identifiants nus | corrigé, #631 (`scripts/chaine/identifiants-nus.mjs`) | absent |
| C12 `pr-titre` | corrigé, #628 | absent |
| C13 couleurs | corrigé, #616 (`environnementGitIsole`) | défense des bancs absente ; neuf bancs recopient chacun leur filtre d'environnement |
| C14 numéros en double | non corrigé | `next-id-branches.mjs:13-37` sans `fetch`, sans `origin/develop`, sans les PR ouvertes ; aucun outil ne numérote un ticket `.NN` |
| C15 heure | corrigé au cas par cas (#622, #638) | une ligne dans `.claude/rules/tests.md:29`, sans modèle ni banc |
| D16 options globales de git | corrigé, #652 | défaut joué sur 7.15.0 : `git -C . commit --no-verify`, `-c core.hooksPath=…`, `GIT_CONFIG_COUNT`, `git config core.hooksPath`, `--config-env` passent ; c'est le ticket 34 de `gouverner-nos-boucles`, `needs-triage`, débloqué |
| D17 `/security-review` | consigne seule | règle écrite (`revue-adversariale/SKILL.md:25,46`), vérifiée par aucune machine |
| D18 garde illisible | consigne seule (#653) | `garde-commandes.mjs:5` importe `regles.mjs` en statique : un fichier invalide bloque tout outil, avec une trace Node pour seul message |
| D19 amend | consigne seule (#634) | absent ; `git commit --amend` passe la garde |
| E20 émulateur | corrigé, #637 (develop) et #658 (`alignement` seulement), `ADR_ALL_ARC-19` | rien hors un ticket gabarit (`socle-mobile-expo/references/tickets/15-…`) |
| E21 filtre `paths` | non corrigé | la CI du socle n'a pas de `paths` |

## Ce qui change, vu par le produit

- **Le capitaine ne tombe plus sur les incidents ordinaires.**
  - Il prépare son environnement au démarrage et après chaque recyclage de sa machine, et ne fusionne rien tant que cette préparation n'a pas réussi.
  - Il ne lance plus de passage qu'il n'aurait pas le temps de finir.
  - Une panne de GitHub le met en pause, au lieu de vider sa file ou de l'arrêter.
  - Un refus du pre-push renvoie la PR à sa session au lieu d'arrêter le capitaine.
- **Un projet qui adopte le socle reçoit les correctifs d'Iroki** : base en UTF8, mesure de couverture sans base locale, bancs insensibles aux couleurs du terminal, règle et modèle des tests qui dépendent de l'heure, numéros de ticket réservés entre sessions, référence pour le mobile en CI.
- **Les gardes d'agent se contournent moins.** Les options globales de git ne les trompent plus, `--amend` est refusé, et une garde cassée dit comment s'en sortir.
- **La revue de sécurité devient vérifiée** sur toute PR qui touche un chemin sensible.

## Décisions de conception (architecte)

- `A-19` — **Clé de contrat `preparerCapitaine`** (facultative) : une commande du projet que `veille.sh` joue au démarrage et à chaque redémarrage de la machine. Un redémarrage se reconnaît à `/proc/sys/kernel/random/boot_id`, différent de la valeur gardée sous `<git-common-dir>`. Un échec arrête la veille avec un code dédié, sans aucune fusion. Le contenu de la commande appartient au projet : chez Iroki, la base en UTF8, migrée depuis `develop` seul, et le refus d'une migration absente de `develop`. Le gabarit `demarrer-local.sh` du socle Nest crée désormais sa base en UTF8 (`initdb --encoding=UTF8`, `createdb -E UTF8 -T template0`). Raisons :
  - `boot_id` change à chaque démarrage du noyau, et rien d'autre ne le fait varier ;
  - un marqueur dans `$TMPDIR` survit à certains recyclages ;
  - jouer la préparation à chaque tour serait lent.
- `A-20` — **Veille de 75 minutes par défaut, et pas de nouveau passage s'il reste moins de 40 minutes** (option `--marge`). Raison : la limite des tâches de fond est de 2 h, un passage peut durer 40 minutes, et un passage tué au milieu laisse une PR à moitié mise à jour.
- `A-21` — **Une seule lecture GitHub, qui refuse une réponse vide, non JSON ou porteuse de `message`**, avec la sortie 5. La boucle traite 5 comme une pause : elle attend, puis reprend, et un 5 ne l'arrête plus jamais. Raison : un 502 est passager, alors que le lire comme une file vide ou un ARRÊT coûte des heures.
- `A-22` — **Refus du pre-push classé par la trace de husky**, comme dans #633 d'Iroki :
  - `^husky - pre-push script failed` donne 3, et la PR est renvoyée avec la sortie du hook ;
  - tout autre échec donne 4, un échec fermé.

  La règle vaut pour chaque appel de `pousser`, dans `passer.sh` comme dans `sujet.sh`. Raison : c'est le cas vécu, et la trace est celle du husky 9 que pose le socle.
- `A-23` — **Réception de `develop` dans un sujet, documentée dans `sujet/SKILL.md`** :
  - la recette : partir du sujet à jour, en une seule fusion ;
  - le corps type d'une PR de réception, avec les sections « Retouches » et « Revue de ticket » quand il y a des retouches.

  Le message de refus de `sujet.sh:609` donne la recette. `sujet.sh` élague `origin/sujet/*` (`fetch --prune` limité à ce refspec) et fait un `fetch` avant toute lecture de `branches_sujet`. Raison : la règle existe déjà dans le script, mais personne ne la lit là.
- `A-24` — **coverage-diff.** Un fichier couvert seulement par des suites sur base passe en avertissement quand `DATABASE_URL` manque ; la CI, elle, a la base et juge. À la réception de `develop`, le mécanisme du plugin (`fusionRecalculee`) reste, et le critère d'Iroki s'y ajoute en repli : quand HEAD contient `origin/develop` et que la base ne le contient pas, le diff se lit contre `origin/develop`. Raison : la comparaison à la fusion recalculée est plus juste quand elle s'applique, et le repli couvre les autres formes.
- `A-25` — **Un seul environnement de banc**, exporté par `suj/depot-jouet.mjs` : il retire les variables `GIT_*` et `FORCE_COLOR`, et pose `NO_COLOR=1`. Les neuf bancs qui recopient leur propre filtre l'importent. Raison : une copie de plus finirait par diverger.
- `A-26` — **Numéros réservés entre sessions.** `next-id` fait un `fetch`, puis lit `origin/develop`, tous les `origin/sujet/*` et les fichiers des PR ouvertes ; il mutualise cette lecture avec `ticket-libre.mjs` (`A-14`). Il numérote aussi les tickets `.NN` d'une spec. Raison : aucun outil ne numérote un ticket aujourd'hui, et c'est de là que viennent les deux `SOC-4.78`.
- `A-27` — **Tests et heure** : une règle en trois points dans `.claude/rules/tests.md` du socle, et un gabarit dans `socle-tests`. Les trois points :
  - le jour se lit dans le fuseau du métier, par l'horloge injectée ;
  - un test crée ses données au lieu de lire celles du seed partagé ;
  - un banc tourne avec une horloge posée.

  Raison : le fuseau est celui du métier, et « Paris » est propre à Iroki.
- `A-28` — **Ticket 34 de `gouverner-nos-boucles` repris ici** (D16). Les cas d'Iroki (#652) et les cinq contournements joués sur 7.15.0 deviennent ses bancs. Il est réécrit sur la lecture par jetons de 7.12.0. Raison : le ticket existe et n'est plus bloqué ; en refaire un autre doublerait la matière.
- `A-29` — **Une garde qui ne peut pas charger ses règles refuse, et dit comment sortir** (D18). L'import de `regles.mjs` est protégé, et le message demande de faire restaurer `scripts/agent/<fichier>` par un humain (`git checkout origin/develop -- scripts/agent/`). La consigne d'écrire un tel fichier d'un seul coup (copie, `node --check`, import, pose) entre dans le gabarit `chaine-de-production.md`. Raison : un échec ouvert rendrait les gardes contournables par un fichier cassé.
- `A-30` — **La garde refuse `git commit --amend`** (D19), et les consignes des sessions le disent. Raison : les scripts du capitaine ne passent pas par la garde, et une session n'a jamais besoin d'amender.
- `A-31` — **`/security-review` vérifié par le capitaine** (D17) : une PR qui touche un chemin sensible sans la ligne « `/security-review` : lancée » dans sa section de revue est renvoyée. Raisons :
  - la règle existe déjà pour tous les chemins sensibles, il ne manquait que la machine ;
  - la vérification est déclarative, mais elle est visible et elle se renvoie.
- `A-32` — **Le check `pr-titre` entre dans le socle** (`socle-chaine-de-production`), réécrit pour lire le diff comme `revue-exigee.mjs` (C12, et A6 pour sa voie de réception). **Les identifiants nus n'entrent pas dans ce chantier** (C11) : ils relèvent du standard Anchorpost et iront au skill `anchorpost`, par un ticket à part. Raison : le check de titre montre à l'auteur, avant le capitaine, ce que le capitaine refusera ; les identifiants nus dépendent du registre de la nomenclature, qui est l'affaire d'`anchorpost`.
- `A-33` — **Mobile en CI : une référence dans `socle-mobile-expo`** (E20, E21). Elle porte :
  - l'émulateur à 4 cœurs et 4 Go ;
  - le sous-flux cold-start, avec une relance unique et comptée ;
  - `hide_error_dialogs` ;
  - le compteur d'incidents par processus, lu dans `events` ;
  - un timeout propre à l'étape Maestro ;
  - un diagnostic par parcours en échec ;
  - la note sur le filtre `paths`, qui juge le diff de toute la PR.

  Le ticket gabarit 15 du socle mobile y renvoie. Rien d'Iroki n'y entre : ni l'identifiant de l'app, ni les noms de parcours, ni les points encore ouverts (SOC-4.83, SOC-4.85). Raison : le plugin porte la méthode, Iroki ses réglages.
- `A-34` — **Chaque PR dit ce qu'Iroki repose**, dans la note de version (`A-16`) : les fichiers, la clé de `chaine.json`, la commande `poser` à rejouer. Le conducteur d'Iroki prépare sa mise à jour à partir de cette note.

## Les tickets, dans l'ordre

Ordre d'`A-18` : le lot 1 du chantier 1, puis le groupe A, puis le reste. Les tickets qui ne touchent aucun fichier du capitaine partent en parallèle du lot 1.

| Ticket | Objet (points) | Fichiers chauds | Bloqué par | Modèle |
| ------ | -------------- | --------------- | ---------- | ------ |
| 8 | Veille : `preparerCapitaine`, redémarrage reconnu, 75 min et marge (A1, A2) | `veille.sh`, `socle/chaine.json`, `fusionner/SKILL.md` | 1 | opus |
| 9 | Panne de GitHub en pause, refus du pre-push classé et renvoyé (A3, A4) | `github.sh`, `boucle.sh`, `passer.sh`, `file.sh`, `sujet.sh` | 8 | opus |
| 10 | `demarrer-local.sh` du socle Nest en UTF8 (A1) | — | — | sonnet |
| 11 | Sujets : élagage, `fetch` avant lecture, réception documentée (A6, B7, B8) | `sujet.sh`, `sujet/SKILL.md` | 9 et lot 7 | sonnet |
| 12 | coverage-diff sans base, repli à la réception (C9, C10) | — | — | sonnet |
| 13 | Un seul environnement de banc (C13) | `suj/depot-jouet.mjs` | — | sonnet |
| 14 | `next-id` : `fetch`, `develop`, sujets, PR ouvertes, tickets `.NN` (C14) | — | lot 6 | sonnet |
| 15 | Tests et heure : règle et gabarit (C15) | — | — | sonnet |
| 16 | Check `pr-titre` dans le socle (A6, C12) | `socle/ci/ci.yml` | 9 | opus |
| 17 | Ticket 34 de `gouverner-nos-boucles` repris, cas d'Iroki (D16) | `socle/agent/regles.mjs` | — | opus |
| 18 | Garde illisible, `--amend` refusé, `/security-review` vérifié (D17 à D19) | `garde-*.mjs`, `revue-exigee.mjs`, `lancement.md` | 17, lot 5 | opus |
| 19 | Référence « mobile en CI » (E20, E21) | — | — | sonnet |

Les lots 2 à 4 et 7 du chantier 1 se placent après le ticket 9 : ils partagent `github.sh`, `passer.sh` et `sujet.sh`, un ticket à la fois.

## Hors périmètre

- Les identifiants nus (C11) : ticket à part pour le skill `anchorpost` (`A-32`).
- Ce qui est propre à Iroki : la commande de préparation et le contrôle de ses migrations, la voie `chore/<nom>-recoit-develop`, l'identifiant de l'app mobile, les points mobiles encore ouverts.
- La repose dans Iroki : son conducteur la fait d'après chaque note de version. Le passage de ses gardes à la lecture par jetons de 7.12.0 en est le préalable, sans quoi son correctif #652 se perd.
