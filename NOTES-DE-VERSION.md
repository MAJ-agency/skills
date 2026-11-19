# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.25.1 — 2026-11-19

### Ce qui change

`sujet.sh` élague les refs `origin/sujet/*` d'un sujet supprimé du distant (`git fetch --prune` limité aux sujets) : `etat`, `carte`, `de`, `demarrer` et `livrer-prets` ne le lisent plus ; un fetch en échec se dit. Le refus d'une PR de mise à jour faite en plusieurs fusions donne la recette pour la refaire (fetch à refspecs explicites, qui marche dans un clone `--single-branch`), et son renvoi dit de la refaire dans une nouvelle PR, et `sujet/SKILL.md` a une section « Recevoir develop dans un sujet » (recette, corps type de la PR avec « Retouches » et « Revue de ticket »).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (`sujet.sh`, `sujet-refs.test.mjs`), puis `/maj-skills:fusionner poser` (`boucle.sh`, `renvoyer.sh`). Aucune clé de contrat.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend `sujet.sh` de develop au tour suivant ; la veille, elle, appelle `file.sh` de sa copie : nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : son `sujet.sh` a divergé (voie `recevoir` et contrôle de `chore/<nom>-recoit-develop`) ; il ne repose pas `sujet.sh` du plugin, qui effacerait cette voie. Son correctif #643 (`scripts/chaine/sujet.sh:142-147`) équivaut à l'élagage ; il ne lui manque que l'avertissement d'un fetch en échec, à reporter à la main.

## 7.25.0 — 2026-11-19

### Ce qui change

`sujet.sh livrer` ouvre la PR de livraison sans `à-fusionner` : la session qui livre le pose après la relecture de la PR (contre-revue si elle touche un chemin sensible). `livrer-prets`, le geste du capitaine, étiquette toujours ses livraisons. Sans `gh` utilisable (session cloud), `livrer` écrit le titre et le corps dans un fichier, sort en 14 et donne les appels de l'outil GitHub MCP, avec la cause lue (`gh` absent, compte illisible, POST refusé) ; une livraison intermédiaire ne pousse pas sa branche jetable sans `gh`, et la retire si le POST est refusé. `sujet.sh demarrer` ne refuse plus un ticket dont le bloquant est fait dans un fichier long (SIGPIPE).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (et `/maj-skills:fusionner poser` si la version précédente n'a pas été reposée).
3. Dans la même PR, reporter dans `docs/agents/chaine-de-production.md` (§ 2, point 6) la précision du gabarit : la PR d'une livraison intermédiaire s'ouvre sans `à-fusionner`.
4. Relancer le capitaine une fois cette PR entrée dans develop (`livrer-prets` est joué par la boucle, qui prend les scripts de develop au tour suivant ; rien à recopier pour la veille).

**Iroki** : sa remontée A5 (le label posé avant la contre-revue) est corrigée ici. Son `sujet.sh` a divergé de 1 820 lignes : son `fait_sur` est déjà corrigé (`scripts/chaine/sujet.sh`, SOC-4.25), rien à reporter de ce côté ; son `livrer` porte en plus une comparaison e2e (`pas_pire_que_reference`) et les brouillons, absents du skill : reposer `sujet.sh` les ferait perdre, son conducteur reporte donc à la main le retrait du label dans `livrer`, `ETIQUETER=1` dans `livrer_prets` et la sortie 14.

## 7.24.0 — 2026-11-18

### Ce qui change

Une panne de GitHub (réponse vide, non JSON, ou corps d'erreur) n'est plus lue comme un état : le script qui lisait sort en 5, et la boucle du capitaine se met en pause (`PAUSE`) puis reprend, sans jamais s'arrêter sur 5 ; une file illisible n'est plus une file vide. Un push refusé par le pre-push (trace de husky 9 `husky - pre-push script failed`) renvoie la PR à sa session avec la sortie du hook ; un refus sans cette trace (règle du dépôt, droit, coupure) arrête la boucle (`passer.sh`) ou sort en 11 (`sujet.sh`), sans renvoi. Un commentaire d'attente d'un propriétaire impossible à poser arrête la boucle en sortie 3, de même qu'une fusion refusée durablement par GitHub (droit du compte, règle du dépôt, méthode de fusion interdite) ; une fusion refusée parce que la branche ou develop a bougé (règle d'ascendance rejouée avant d'arrêter), ou par une panne, reste en 5. La ligne `PAUSE` nomme la route et le code HTTP de la cause (un `(HTTP 401)` de jeton expiré se voit au journal). Toute sortie de git ou de hook relayée par les scripts du capitaine (journal, commentaire de PR) masque les URL à identifiants (`masquer_url`, `git_masque`).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser` (`github.sh`, `passer.sh`, `boucle.sh`, `file.sh`, `sujet.sh`, `faux-gh.mjs` et leurs bancs). Aucune clé de contrat.
3. Vérifier que `.husky/pre-push` est lancé par husky 9 (`.husky/_/h`, posé par `pnpm install`) : sans la trace de husky, un refus du hook se lit comme un refus du distant et arrête le capitaine.
4. Relancer le capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : ses scripts portent leur propre correctif de A4 (#633 : `pousser` en 3 ou 4 par `DERNIERE_SORTIE`, `scripts/chaine/github.sh:127-155` ; le renvoi de `boucle.sh:540-545` ; `passer.sh:254-262` ; le banc `boucle-pre-push-refuse.test.mjs`), que la repose remplace. Son masquage des URL à identifiants (`masquer_url`, `git_masque`, `SPEC_ALL_SOC-4.52`, `github.sh:207-214`) est désormais celui du plugin : la repose le garde ; rejouer son banc « SPEC_ALL_SOC-4.52 » contre le `github.sh` du plugin avant de retirer le sien.

## 7.23.0 — 2026-11-18

### Ce qui change

Deux modules neufs à côté des scripts du capitaine, avec leurs bancs : `verdict.mjs`, le lecteur du verdict d'une relecture indépendante, et `decision-relecteur.mjs`, la décision du Relecteur, une fonction pure. Rien ne les appelle encore : ils préparent la relecture indépendante. L'étape 0 de `fusionner` (`poser`) les nomme, pour qu'un projet qui repose ne reçoive pas leurs bancs sans eux.

### Ce qu'un projet fait pour en profiter

Rien d'obligatoire : aucun script déjà posé ne change, aucun capitaine à relancer. Un projet qui rejoue `/maj-skills:fusionner poser` reçoit en plus les deux modules et leurs bancs sous `scripts/chaine/`.

## 7.22.0 — 2026-11-18

### Ce qui change

`next-id.mjs` fait un `fetch`, puis lit l'arbre de travail, `origin/develop`, tous les `origin/sujet/*` et `origin/docs/*`, et les fichiers des PR ouvertes (`scripts/docs/pr-ouvertes.mjs`, la lecture de `ticket-libre.mjs`). Il numérote aussi les tickets d'une spec : `node scripts/docs/next-id.mjs SPEC_ALL_SOC-4` rend le prochain index sur deux chiffres. Sans `gh`, le numéro sort, et la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer, dans une PR du projet : `/maj-skills:socle-monorepo` pour `scripts/docs/next-id.mjs`, `next-id-branches.mjs` et `next-id.test.mjs` (la ligne `references/scripts/docs/*` de `TABLE-RACINE.md` ; `pr-ouvertes.mjs` est arrivé avec la version du ticket 6). Aucune clé de contrat. Reposer aussi les documents que la PR change : `docs/methode/nomenclature.md` (socle-monorepo), et, de socle-chaine-de-production, `docs/agents/pieges.md` et le fragment `readme-commandes.md` (le § commandes du README).
3. Numéroter un ticket par `next-id.mjs <SPEC>`, puis le réserver aussitôt (branche et PR brouillon).

**Iroki**, hors du plugin : ses deux `SPEC_ALL_SOC-4.78` et ses deux `ADR_ALL_ARC-18` se renomment chez lui ; la repose de ces scripts suffit ensuite.

## 7.21.1 — 2026-11-18

### Ce qui change

La garde de commandes lit la sous-commande de git après ses options globales (`-C`, `-c`, `--git-dir`, `--config-env`…), valeurs opaques comprises. Elle refuse toute façon de sauter les hooks git : `--no-verify` et `-n` derrière une option globale, `git pull --no-verify`, `git am -n`, `core.hooksPath` ou un `include` posé par `-c`, `--config-env` ou `git config` (`--unset` compris), tout `alias.*` posé par `-c` ou écrit par `git config`, un renommage de section vers ou depuis `core`, `HUSKY`, `GIT_CONFIG_PARAMETERS` et `GIT_CONFIG_COUNT` affectés ou exportés. Elle refuse aussi une ref de suivi fabriquée (`git update-ref refs/remotes/…`), le push « matching » (`git push origin :`) et une destination de push portée par la configuration (`-c remote.origin.push=…`). Une expansion (`$`, substitution) n'est admise que dans une valeur, jamais dans un nom d'option, une sous-commande ou une clé de configuration ; un argument à expansion de `commit`, `am`, `merge`, `rebase` ou `pull` est refusé (« argument illisible : écris-le en clair »). Un message de commit n'est jamais lu comme des options ; un texte cité qui porte une commande git refusée l'est, comme aujourd'hui pour un push vers un sujet.

La recherche adversariale du ticket a fermé en plus : une expansion non citée dans la valeur d'une option globale, devant toute sous-commande (`git -C $dir status` est refusé, `git -C "$dir" status` passe) ; un motif ou des accolades non cités, qui valent une expansion non citée, dans le programme aussi (`/usr/bin/g[i]t commit -n`) (`git commit -m x src/*.ts` est refusé, `git commit -m x -- src/*.ts` passe) ; `"$@"` et `"${a[@]}"`, qui donnent plusieurs mots même cités ; `set -a`, `set -k` et `env "$X" …` ; un `env HUSKY=0` derrière un autre lanceur (`taskset`, `flock`) ; les options abrégées de `git config` (`--unset-a`, `--remove-sec`) ; git par ses programmes internes (`/usr/lib/git-core/git-commit`, et `git-push` vers un sujet, ouvert jusqu'ici) ; un programme à expansion (`$(echo git) commit …`, `$g push …`), lu comme git, et un tableau en programme (`G=(git commit); "${G[@]}" -n`), relu avec ses valeurs s'il est défini une seule fois simplement, refusé sinon (`G+=…`, `${G[@]:1}`, `"$@"`) ; `hash -p` ; la chaîne d'`env -S` et un `alias` défini dans la commande, relus ; le rebase ou `reset --hard` d'une branche partagée derrière les options globales ; une commande que git lance par un shell, tapée dans la commande (`git rebase -x '…'`, `-c core.pager='…'`, `git config core.editor '…'`), relue comme une commande de la session.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier `regles.mjs` et `regles.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/chaine/socle-chaine-de-production/references/agent/` vers `scripts/agent/`, **d'un seul coup** : copie à côté, `node --check`, `node -e "import('./scripts/agent/<copie>')"`, puis `mv`. Un `regles.mjs` à moitié écrit fait refuser toute commande de la session. `scripts/agent/**` est un chemin sensible : contre-revue et `/security-review`.
3. Recopier la ligne « Hooks d'agent » du fragment `claude-md-fusion.md` dans `CLAUDE.md`, si le projet l'a gardée telle quelle.
4. `node --test scripts/agent/*.test.mjs` : vert.

**Iroki** : sa garde lit encore les commandes par expressions (avant 7.12.0). Reposer `regles.mjs` du plugin remplace sa lecture et son correctif #652 : le passage à la lecture par jetons en est le préalable (spec, Hors périmètre). Rejouer ses bancs « SPEC_ALL_SOC-4.70 » contre le fichier du plugin avant de retirer les siens. Au moins dix de ses décisions changent :
  - deviennent des refus : `git config --unset core.hooksPath` (retirer la clé rend `.git/hooks`, sans husky) ; `git -c core.hooksPath=/x status` et `… log` (aucun usage légitime, quelle que soit la sous-commande) ; `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=gc.autoDetach …` (une session n'a jamais à le taper) ;
  - une expansion non citée dans la valeur d'une option globale est refusée devant toute sous-commande : `git -C $(pwd) status`, `git -C $(pwd) fetch origin develop`, `git -C $(git rev-parse --show-toplevel) status` et `… log`, `git -C ${x:-a b} status`, `… diff --stat` et `… commit -m x`, `git -C $(pwd) commit -m x`, qu'il laisse passer, sont refusés (la forme citée, `git -C "$(pwd)" …`, passe) ;
  - passent : `git -C <(echo a b) commit -m x` et `… push origin feat/a`, qu'il refuse comme illisibles (une substitution de processus rend un seul chemin, et ne saute rien) ; `GIT_CONFIG_KEY_0=core.hooks"Path" git commit -m x` et `GIT_CONFIG_KEY_0='core.hooksPath' git commit -m x`, qu'il refuse (sans `GIT_CONFIG_COUNT`, git ne lit pas la clé) ;
  - ses bancs « SPEC_ALL_SOC-4.70 » sont repris dans `regles.test.mjs` sous les titres « banc repris : … », chaque divergence nommée en commentaire.

## 7.21.0 — 2026-11-18

### Ce qui change

Un seul environnement de banc, `scripts/docs/environnement-de-banc.mjs` (socle-monorepo), réexporté par `scripts/chaine/depot-jouet.mjs` : sans `GIT_*`, `FORCE_COLOR`, `NODE_TEST_CONTEXT` ni variables du capitaine, avec `NO_COLOR=1`. Les bancs des skills l'importent : ils ne prennent plus la couleur de `node --test` sous un terminal.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, **d'abord** recopier `environnement-de-banc.mjs` et `environnement-de-banc.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/scripts/docs/` vers `scripts/docs/`, avec `next-id.test.mjs` du même dossier : sans eux, les bancs reposés ensuite ne se chargent pas.
3. Puis reposer : `/maj-skills:tickets poser` (son `depot-jouet.mjs` et `avancement.test.mjs`), `/maj-skills:revue-adversariale poser`, `/maj-skills:fusionner poser`, `/maj-skills:sujet poser`. Et recopier `coverage-diff.test.mjs` de socle-tests (`references/scripts/verify/`) vers `scripts/verify/` s'il est posé.
4. `node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs scripts/chaine/*.test.mjs` : vert.

**Iroki** : son `environnementGitIsole` (`scripts/chaine/git-isole.mjs`, #616) reste à lui, avec ses importeurs. Les bancs reposés depuis le plugin prennent `environnement-de-banc.mjs` ; les deux coexistent. Différence à connaître : le sien garde `GIT_AUTHOR_*` et `GIT_COMMITTER_*`, celui du plugin les retire. Retirer `git-isole.mjs` au profit du module du plugin est un choix de son conducteur, hors de cette version.

## 7.20.0 — 2026-11-18

### Ce qui change

La veille du capitaine dure 75 minutes, et aucun passage ne commence à moins de 40 minutes de la limite de 2 h d'une tâche de fond (`--marge`) : la boucle s'arrête sur `ÉCHÉANCE` au lieu d'être tuée au milieu d'une mise à jour. Une clé facultative de `.claude/chaine.json`, `preparerCapitaine`, lue sur `origin/develop` seulement, nomme une commande que la veille joue, worktree détaché sur `origin/develop`, avant de lancer la boucle sur une machine neuve et après chaque redémarrage (lu dans `/proc/sys/kernel/random/boot_id`) ; tant qu'elle n'a pas réussi, rien n'est fusionné, et son échec arrête la veille en sortie 13.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser` (`veille.sh`, `boucle.sh` et leurs bancs).
3. Si la machine du capitaine perd un environnement à son recyclage (base locale), ajouter à `.claude/chaine.json` la clé `"preparerCapitaine": "<commande>"`, dans la même PR ou une autre (`.claude/**` est un chemin sensible : contre-revue). Un projet du socle Nest peut y mettre `bash scripts/db/demarrer-local.sh`.
4. Relancer le capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée, sans `--duree 110` si le lancement le portait.

**Iroki**, hors du plugin : sa commande de préparation (base en UTF8, migrée depuis `develop` seul, refus d'une migration absente de `develop`) s'écrit chez lui, puis se déclare dans `preparerCapitaine`.

## 7.19.1 — 2026-11-18

### Ce qui change

`coverage-diff` (socle-tests) : sans `DATABASE_URL`, un fichier en échec qu'une suite `*.db.spec.ts` cible passe en avertissement, et la CI, qui a Postgres, le juge ; sous GitHub Actions, rien ne change. À la réception de develop dans un sujet, quand la forme n'est pas celle d'une PR de mise à jour (fusion recalculée), le diff se lit contre `origin/develop` dès que HEAD le contient et que la base ne le contient pas : le code que develop apporte n'est plus remesuré.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/scripts/verify/` vers `scripts/verify/` : `coverage-diff.mjs`, `coverage-diff-regles.mjs`, `coverage-diff.test.mjs` et `coverage-diff-regles.test.mjs`. Aucune commande `poser` : socle-tests se met à jour pièce par pièce (`SKILL.md:16`).
3. Vérifier que l'étape de couverture de la CI porte `DATABASE_URL` (`SKILL.md:32`) : c'est elle qui juge ce que le pre-push signale.

**Iroki** : ses deux correctifs (#633 et #649) sont déjà chez lui, sous une autre forme, sans `fusionRecalculee`. Recopier les fichiers du plugin remplace son `referenceDuDiff` et son `suiteSurBaseCible`, et y ajoute la fusion recalculée. À faire en une PR qui garde ses deux bancs (`coverage-diff-sans-base.test.mjs`, `coverage-diff-reception-develop.test.mjs`) et les rejoue contre les fichiers du plugin ; un message qui diffère se nomme dans la PR.

## 7.19.0 — 2026-11-18

### Ce qui change

`ticket-libre.mjs` lit les fichiers des PR ouvertes : une PR qui ajoute ou modifie le fichier du ticket le prend, même si ni son titre ni sa branche ne portent l'identifiant. La branche distante d'une PR fermée ne prend plus le ticket (sauf si elle a reçu des commits depuis la fermeture). Sans `gh`, le repli fait lire les fichiers des PR ouvertes par l'outil GitHub MCP. La lecture des PR ouvertes est un module du socle, `scripts/docs/pr-ouvertes.mjs`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Dans une PR du projet, **d'abord** recopier `pr-ouvertes.mjs` et `pr-ouvertes.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/scripts/docs/` vers `scripts/docs/` : sans eux, le `ticket-libre.mjs` reposé ne se charge pas.
3. Puis reposer : `/maj-skills:tickets poser` (son `ticket-libre.mjs` et son test, `depot-jouet.mjs`).
4. `node --test scripts/docs/*.test.mjs` : vert.

**Iroki** : son `ticket-libre.mjs` est d'une version plus ancienne, qui lit encore les formes courtes (`ABC-1.03`) et importe de son `identifiants.mjs` `normaliser`, `formeCourte` et `slug`, sans `branchePorte`, `texteCite` ni `fichierDuTicket`. Le reposer tel quel demande aussi l'`identifiants.mjs` du socle, qui ne lit plus les formes courtes. Sinon, son conducteur réécrit le correctif dans sa version : `pr-ouvertes.mjs` recopié, puis la lecture des fichiers et des branches de PR fermées.

## 7.18.2 — 2026-11-18

### Ce qui change

L'architecte et le conducteur relèvent l'état de leurs sessions au plus toutes les 60 minutes (échec, déconnexion, limite d'usage, silence d'une heure) et signalent une session coupée. Toute session lancée charge `send_message` en premier geste, et s'arrête en le disant s'il manque. Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce. Chaque prompt porte, juste après les intangibles, la ligne « Commits : jamais `git commit --amend` ». Une alerte d'usage d'une session se dit au produit une fois par période de limite.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »). Les skills `architecte` et `chantier` et les prompts de lancement viennent avec le plugin : rien à reposer pour eux.
2. Dans une PR du projet, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) les trois changements du gabarit, § 5 : la ligne « Outils : » du prompt d'une fille, la ligne « Commits : » juste après « Intangibles » (qui ne change pas), et le paragraphe « Jamais d'amend » après l'étape 4.
3. Un conducteur ou un architecte en cours reprend ces règles à sa prochaine session ; aucun capitaine à relancer.

**Iroki** : son `docs/agents/chaine-de-production.md` porte déjà le paragraphe « Jamais d'amend » (l. 124, #634) ; il reçoit la ligne « Outils : » et la ligne « Commits : ».

## 7.18.1 — 2026-11-18

### Ce qui change

Le gabarit `scripts/db/demarrer-local.sh` du socle Nest crée sa base en UTF8 (`initdb --encoding=UTF8` avec une locale UTF-8, `createdb -E UTF8 -T template0`) : sur une machine en locale C/POSIX, PostgreSQL choisissait `SQL_ASCII`, et `normalize(…)` échouait au pre-push. Une base ou un serveur existant qui n'est pas en UTF8 est refusé (sortie 6), avec les commandes pour le recréer ; rien n'est supprimé par le script.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier `~/.claude/plugins/marketplaces/maj/skills/backend/socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh` sur `scripts/db/demarrer-local.sh`, tel quel (il n'a aucun marqueur à substituer). Aucune commande `poser` : le socle Nest se pose une fois.
3. Lancer `bash scripts/db/demarrer-local.sh`. S'il sort en 6, suivre les commandes qu'il imprime, puis rejouer les migrations. Le script de l'environnement cloud l'appelle avec `|| true` (`admin.md`) : un refus y passe inaperçu, il se voit au premier appel de la session.

**Iroki** : rien à reposer. Son script (`SPEC_ALL_SOC-4.34`, #486 et #495) fait déjà tout cela, avec `COMPOSE_FICHIER` et son banc en plus ; le gabarit ne doit pas l'écraser.

## 7.18.0 — 2026-11-18

### Ce qui change

Le socle mobile pose `apps/mobile/docs/MOBILE_CI.md`, la méthode des parcours sur appareil en CI : émulateur à 4 cœurs et 4 Go, démarrage à froid avec une relance unique et comptée, `hide_error_dialogs`, incidents de l'app lus dans `events` (un ANR ou un crash de l'app rend le run rouge), un timeout propre à l'étape Maestro, un diagnostic par parcours en échec, et le filtre `paths` qui juge le diff de toute la PR. Le ticket gabarit des parcours sur appareil y renvoie.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Si le socle mobile est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/mobile/socle-mobile-expo/references/mobile/docs/MOBILE_CI.md` dans `apps/mobile/docs/`, dans une PR du projet. Aucune commande `poser`.
2 bis. Un projet déjà posé ajoute la ligne `MOBILE_CI.md` à la carte de son `CLAUDE.md` et de son `README.md`, et le renvoi en tête de `apps/mobile/CLAUDE.md`.
3. Si le ticket des parcours sur appareil du projet n'est pas fait, lui ajouter le renvoi du gabarit. S'il est fait, relire le workflow des parcours point par point contre la référence, et ouvrir un ticket par écart.

**Iroki** : rien à reposer, la référence vient de ses correctifs (#637, #658 et `ADR_ALL_ARC-19`). Il peut la recopier pour ses nouvelles sessions ; ses réglages et ses points ouverts restent chez lui.

## 7.17.0 — 2026-11-18

### Ce qui change

La fiche `.claude/rules/tests.md` du socle gagne « Le jour et l'heure » : le jour se lit dans le fuseau du métier, par l'horloge injectée ; un test crée ses données au lieu de lire celles du seed partagé ; un banc tourne avec une horloge posée. socle-tests pose le gabarit `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier la section « Le jour et l'heure » de `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md` dans `.claude/rules/tests.md`, avec la retouche de la ligne « Déterministe ». La fiche du projet a pu diverger : recopier la section, pas le fichier. `.claude/**` est un chemin sensible : contre-revue.
3. Si socle-tests est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` dans `docs/agents/gabarits/`.
4. Écrire le fuseau du métier comme une constante du domaine, s'il ne l'est pas déjà.

**Iroki** : sa fiche porte la même ligne d'une phrase. Il recopie la section, avec son propre fuseau du métier ; ses correctifs (#622, #638) appliquent déjà les trois points.

## 7.16.0 — 2026-11-18

### Ce qui change

- **La règle d'ascendance.** Juste avant chaque fusion, vers `develop` (`passer.sh`) comme vers un sujet (`sujet.sh fusionner`), le capitaine relit la branche cible et vérifie que la PR a été testée sur son dernier état (`ascendance`, dans `github.sh`). Il ne s'en remet plus au réglage « strict » de GitHub, qui a laissé entrer des PR en retard (`fedora`, 2026-11-18).
- **Toute PR en retard est mise à jour et retestée avant sa fusion, documentation comprise.** Vers un sujet, une sous-PR en retard n'est plus squashée telle quelle : le capitaine y fusionne le sujet, pousse, attend la CI du nouveau sommet, contrôle de nouveau, puis la squashe. Vers `develop`, une cible qui a bougé pendant la CI fait reprendre la mise à jour, deux fois au plus, puis sortie 5. Un conflit hors des index générés est renvoyé, comme avant.
- **Sortie 12 et arrêt du capitaine.** Après chaque fusion, l'arbre du squash est comparé à l'arbre testé. Un écart : commentaire sur la PR (marque `<!-- arbre-different-capitaine -->`), `à-fusionner` retiré, la boucle et la veille s'arrêtent en 12, le capitaine le dit à son lanceur.
- **Une sous-PR étiquetée à la fois par sujet.** Le conducteur ne laisse `à-fusionner` qu'à la plus ancienne des sous-PR étiquetées d'un même sujet, et le repose sur la suivante quand la précédente est entrée (skill `chantier` § 6).
- La sortie 8 de `sujet.sh fusionner` change de sens : mise à jour poussée, CI pas finie, reprise au tour suivant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille, elle, tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).
