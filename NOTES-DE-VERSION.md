# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.38.0 — 2026-11-20

### Ce qui change

- **Le skill `relecteur`** (régime 8, lot 4 de la relecture indépendante) : le Relecteur d'un dépôt, une session par dépôt, lancée par `/maj-skills:relecteur` en première ligne. Une veille relit la file (`à-relire`, `à-fusionner`) des PR du régime 8 ; `relecteur.mjs` prend la décision du Relecteur (`decision-relecteur.mjs` de develop, la même que celle du capitaine) sur les faits des calculs de develop, pose `à-reprendre` et `à-fusionner` (la nouvelle étiquette avant l'ancienne), écrit les distributions après la création des sessions ; la session crée les sessions de relecture sur la base de la PR, leur écrit et lit leur état. Rien ne change pour une PR du régime 7.
- **Deux labels de plus, `à-relire` et `à-reprendre`** : `labels.sh` en pose neuf. Le gabarit de lancement du Relecteur est dans `architecte/references/lancement.md` ; la carte d'un programme a une ligne `Relecteurs:`, celle d'un chantier une ligne `Relecteur:`.
- **Un refus reste un refus** : sur une PR à chemin sensible, un `refusé` sans la ligne `/security-review: lancée` rend la PR à son auteur (`compter`, `decision-relecteur.mjs`) ; la limite écrite dans le skill `relecture` est retirée.
- Le faux GitHub des bancs rend la date d'ouverture d'une PR et date un commentaire posé à l'heure du banc.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1).
2. Reposer les scripts dans une PR du projet : `/maj-skills:fusionner poser` (la décision du Relecteur change). Un administrateur joue `bash scripts/github/labels.sh` après avoir reposé le socle (`/maj-skills:socle-chaine-de-production`), pour créer les deux labels.
3. Rien d'autre tant que le dépôt n'est pas en régime 8 : la clé `relecture` de `.claude/chaine.json` arrive avec la bascule (lot 6). Le Relecteur se lance à la repose qui la pose.

## 7.37.3 — 2026-11-20

### Ce qui change

Trois petits correctifs (ticket 65). Pour un projet : un nom d'accord de `Sensibles:` qui porte une tabulation ou un autre caractère de contrôle est refusé, sous le message d'`A-170`. Pour qui joue la CI du plugin : l'en-tête de `codeSeul` écrit sa limite (`await`/`yield` lus comme réservés, donc une source de module) et un test tient que `poses` ne lui donne que des `.test.mjs`. Pour le skill `relecture` (qui se charge depuis le plugin, sans se poser dans un projet) : le clone de C4 reste dans le dossier de la session, et un rapport vide de `/security-review` n'est pas une preuve d'absence de faille.

### Ce qu'un projet fait pour en profiter

Rien d'obligatoire. Pour recevoir le gate `tickets` corrigé : `/maj-skills:fusionner poser` dans une PR du projet.

## 7.37.2 — 2026-11-20

### Ce qui change

La CI du plugin joue mieux ses bancs posés (ticket 64). Pour qui joue la CI du plugin : `scripts/poses.test.mjs` lit les sous-tests dans le code seul (`codeSeul` : le texte d'une chaîne ou d'un commentaire, comme un titre de commit « suite (#2) », ne fait plus jouer un banc entier ; dans le doute il se joue entier), part des travaux les plus lourds en tests, donne à chaque travail une borne qui suit son poids (60 s par test, au moins 300 s) et le tue par son groupe de processus, et prend pour délai un plafond de 1 800 s. Le bilan (part du plafond, pire cas, les trois marges les plus courtes) s'écrit dans le journal en vert comme en rouge (`# poses : …`) ; atteindre le plafond rougit et dit de découper. Pour un projet : le banc posé `double-relecture.test.mjs` date son socle et sa tête, la précondition du test « un environnement hostile … (A-122) » ne dépend plus de l'horloge ni de la version de git.

### Ce qu'un projet fait pour en profiter

Rien d'obligatoire. Pour recevoir le banc posé stable : `/maj-skills:fusionner poser` dans une PR du projet.

## 7.37.1 — 2026-11-20

### Ce qui change

Le skill `relecture` : les suites de la contre-relecture de 7.36.0 (trois mineurs), plus un trou trouvé en préparant le ticket.

- **La résolution d'une PR de mise à jour se découpe en lots** au-delà de 2 000 lignes de `resolution.patch`, comme le diff relu et par la même fonction : par zone, `lots/resolution-<j>/`, leur union vérifiée contre `resolution.txt` (« lots de la résolution : … », sortie 12). L'axe Règles se lance une fois par lot (`lus '<brouillons>' 1 resolution-<j>`). Un seul lot : la résolution entière, comme avant.
- **Un binaire que seule la résolution touche** (sans écart contre le sujet, la version de `develop` jetée par une résolution « ours ») est nommé parmi les binaires du tour, illisible ou sous un chemin sensible selon les mêmes règles : aucun axe n'a à le dire lu, le verdict le nomme. C'est le trou trouvé en préparant le ticket ; une commande de lecture en échec sort en 12 (« liste des binaires de la résolution illisible »).

Dans le dépôt du plugin seulement : un cas de banc tient la branche du tri où `develop` ne fait que retirer et où la résolution insère à ce point ; d'autres tiennent la panne de chaque lecture de binaires, les deux parents de la fusion, le diff relu et la résolution découpés ensemble.

Depuis 7.36.0, la résolution d'une PR de mise à jour se relit : `git show --remerge-diff` du commit de fusion, que l'axe Règles lit en entier ; une ligne de `develop` qu'elle retire est un constat, jamais écartée (`A-164`).

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; rien d'autre (rien n'appelle encore le skill, comme le dit la note 7.36.0).

## 7.37.0 — 2026-11-20

### Ce qui change

« Une sous-PR à la fois par sujet » est tenue par le capitaine, plus par le conducteur. À chaque tour de sa boucle, le capitaine ne prend qu'une sous-PR étiquetée par sujet ; les autres attendent leur tour avec leur étiquette (`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` dans le journal), sans mise à jour, ni CI, ni renvoi. Qui tient le sujet le garde, avant tout ordre de numéro : une sous-PR en passage chez un autre capitaine, sinon celle que la boucle tenait au tour précédent, sinon une sous-PR dont la CI tourne ; personne ne le tient, la plus ancienne (le plus petit numéro) le prend. La suivante est prise dans le tour où celle qui tient entre ou sort de la file ; tant que le sujet reste tenu, la boucle le dit à chaque tour (`[sujet/<nom>] tenu par #<n> (<raison>)`). La veille relance la boucle quand la sous-PR qui tient un sujet change d'état ou quitte la file, et une fois quand le verrou d'un autre capitaine qui tenait un sujet a expiré. Le conducteur étiquette toutes les sous-PR prêtes d'une vague : il ne retire ni ne repose plus `à-fusionner` (skill `chantier` § 6), ce qui coûtait jusqu'à 45 minutes d'attente par sous-PR. Une PR de mise à jour d'un sujet s'ouvre, comme avant, sans sous-PR étiquetée devant elle : derrière une sous-PR plus ancienne en route, elle attend son tour, puis elle est à refaire. Une sortie 128 de `sujet.sh` est une erreur fatale de git, pas un signal : elle rend le sujet, comme toute erreur ; seules les sorties 129 et plus le tiennent comme un signal. Une lecture GitHub en panne sur une sous-PR d'un sujet ne le donne à personne : à ce tour, aucune sous-PR de ce sujet n'est prise ; le sujet est repris au prochain changement de la file, ou à la veille suivante (au pire à la fin de la veille en cours, 75 minutes par défaut). Le délai du banc des scripts posés (`scripts/poses.test.mjs`, dans ce dépôt) passe de 620 à 900 secondes (décision A-166) : ses tranches jouent désormais les cas de la boucle ; la minuterie de 300 secondes par tranche, la couverture et le plancher restent. Le banc `une-sous-pr-a-la-fois.test.mjs` se joue de nouveau en tranches (décision A-169) : le titre de commit `feat(<nom>): suite (#2)` d'un de ses dépôts jouets était lu comme un sous-test (`suite(`), ce qui le faisait jouer entier ; il devient `feat(<nom>): suite, #2`.

Deux limites connues. Deux capitaines aux mémoires séparées (`boucle-tenus` vaut pour un clone) peuvent mettre à jour deux fois la même sous-PR : une CI de plus, jamais une fusion non testée ; deux capitaines lancés au même instant sont départagés par le verrou du passage. Un nom de sujet qui porte un mot du filtre du `Monitor` du capitaine (`conflit`, `rouges`…) fait entrer ses lignes d'attente dans ce filtre et réveille le capitaine sans objet, à chaque tour.

Le bilan de fin de chantier est supprimé (décision du produit du 2026-11-18), sans rien à la place : le gate `tickets` n'exige plus de section `## Rétro` pour passer une carte à `fini`, et le skill `chantier`, la méthode, `pieges.md` et le gabarit de carte ne la demandent plus. Un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive, ou, faute de gate, une ligne de `docs/agents/pieges.md`. Une carte qui garde sa section `## Rétro` passe aussi.

Le gate `tickets` juge la forme de deux lignes d'en-tête qu'il ne lisait pas, sans les exiger : `Sensibles:` (`—`, ou des chemins puis ` — accord de <nom>, <AAAA-MM-JJ>`) et `Relecture: double`. Il les lit dans l'en-tête seul, sous les formes `X:`, `**X:**`, `- X:` et `* X:`, sans égard à la casse de la clé ; mal formée, une ligne est refusée, le fichier et la ligne nommés. Aucune garde ne les lit encore. Il accepte `Règles: —`, seul, pour un ticket qui ne réalise aucune règle. Le rôle `relecture` d'une ligne de `## Coût` passe sans être jugé au plafond et compte au registre dans le total, pas dans la part des filles. `Label: contre-revue` reste exigé comme avant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts du capitaine, dans une PR du projet : `/maj-skills:fusionner poser`.
3. Relancer chaque capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). La boucle se remplace d'elle-même par la version de develop ; la veille tourne sur sa copie, c'est elle qu'il faut recopier.
4. D'ici là, le conducteur garde l'ancienne discipline, une seule sous-PR étiquetée à la fois par sujet : un capitaine dont les scripts ne sont pas reposés prend encore toutes les sous-PR étiquetées d'un sujet dans le même tour. Avec plusieurs capitaines, il ne l'abandonne qu'une fois tous relancés.
5. Reposer le gate et les gabarits, dans une PR du projet : `/maj-skills:tickets poser` (`scripts/verify/tickets-regles.mjs`, `tickets.mjs` et leurs tests, `scripts/docs/couts.test.mjs`, les gabarits de ticket et de carte). Une ligne `Sensibles:` ou `Relecture:` mal formée dans l'en-tête d'un ticket rougit alors le gate : la corriger, ou la retirer.
6. Dans la même PR, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) le § 2 sans rétro (le schéma du cycle, la parenthèse du point 2 et le point 7), et dans `docs/agents/pieges.md` sa phrase d'en-tête : un incident donne un ticket au moment où il arrive. Une carte déjà `fini` garde sa section `## Rétro`, sans effet.

## 7.36.0 — 2026-11-20

### Ce qui change

Le plugin porte un skill de plus, le skill `relecture` (`skills/chaine/relecture/`) : ce que joue une **session de relecture**, lancée par le Relecteur d'un dépôt et jamais par l'auteur d'une PR. Elle se place sur la base de la PR, extrait le sommet à relire dans un arbre de travail à part, y joue les scripts de la base (`diff-revue.sh`, `chemins-sensibles.mjs`, `contexte-ticket.mjs`, `sujet.sh a-juger` pour une PR vers un sujet, la régénération des index), choisit ses axes selon ce que le diff contient (Règles, Ticket, Documentation, Tickets, Règles métier), lance un sous-agent en contexte vierge par axe, trie chaque constat dans le code, puis écrit sur la PR un verdict de la forme que `verdict.mjs` lit (7.23.0). Il n'y a que deux gravités, bloquant et doute : ce que les deux skills de revue rangent « à corriger » est ici un bloquant. Un bloquant confirmé donne `refusé` même quand un axe n'a pas pu être joué ; `incomplet` veut zéro bloquant. L'échec d'un outil de la session (une installation, un réseau, un sous-agent) n'est jamais un écart de la PR : il s'écrit « non exécuté ». Toute commande dont la sortie sert à décider se lit par son code de sortie : une liste vide après un échec n'est jamais « rien à relire », et ce que la session ne peut ni lire ni jouer donne `incomplet`, avec sa cause et qui la lève. Le diff relu est vérifié contre la liste des fichiers changés : n'en sortent ni ce que la PR déclare elle-même index généré, ni un fichier texte qu'un `.gitattributes` dit binaire, ni du code rangé sous `__snapshots__/` ; le lockfile, les fichiers `.snap` et les binaires que les axes ne lisent pas sont toujours nommés au verdict. L'empreinte de ce que les axes recevront est prise avant que la session n'exécute ce que la PR déclare, et reprise après. `/security-review` ne compte pour lancée que si la session a vérifié par une commande, avant de la lancer, que le diff que la commande intégrée lit est celui de la PR. Deux axes sont neufs : Tickets (K1 à K6), pour une PR de tickets, de spec ou de carte, et Règles métier (M1 à M4), pour une règle, sa criticité ou le glossaire. La session ne colle aucun bloc de shell : chaque geste est une sous-commande d'un script du skill, `scripts/gestes.sh`, lancé depuis le dossier du skill et jamais posé dans un projet, qui s'arrête au premier échec et écrit sa cause (l'outil Bash d'une session ignore `set -e` dans un bloc collé). L'arbre à part et le clone de `/security-review` s'extraient sans les fichiers qu'une session charge comme consignes (`CLAUDE.md`, `CLAUDE.local.md`, `.claude/`, sauf `/.claude/chaine.json`) ; les axes lisent les fiches de règles sur la base, et un `CLAUDE.md` apparu pendant `C1` donne `incomplet`. Au-delà de 2 000 lignes, le script découpe les lots et vérifie leur union. Le skill ne se charge que par sa commande (`disable-model-invocation`). `CONTEXT.md` reçoit le vocabulaire de la relecture indépendante.

**Rien ne l'appelle encore** : le Relecteur et la bascule vers le régime 8 ne sont pas livrés. `revue-de-ticket` et `revue-adversariale` ne changent pas, et restent la revue de toute PR.

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; rien d'autre aujourd'hui. Une session de relecture demande `git` 2.40 ou plus et `jq`. Une session de relecture demande aussi `node`. Les scripts que le skill joue sont déjà dans `scripts/chaine/` d'un projet qui a posé `revue-adversariale`, `revue-de-ticket`, `fusionner` (7.23.0 ou plus, pour `verdict.mjs`) et `sujet` (7.28.0 ou plus, pour `a-juger`) : `/maj-skills:relecture poser` le vérifie et ne copie rien de plus. Un projet qui a le gate `references-agent` ajoute `maj-skills:relecture` à `scripts/verify/references-agent-integrees.json` le jour où l'un de ses textes cite le skill par son nom qualifié.

## 7.35.0 — 2026-11-19

### Ce qui change

Cinq petits correctifs (ticket 62 de `gouverner-nos-boucles`), quatre pour les projets et un dans le dépôt du plugin seulement :

- **`meme-contenu.sh` nomme le clone partiel** : dans un clone fait avec `--filter` (`remote.<nom>.promisor` ou `extensions.partialclone` dans la configuration du dépôt, ses `include` et `config.worktree` compris), le calcul rend `illisible`, sortie 21, avec pour raison « dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l'appeler (git clone sans --filter) », au lieu d'une lecture d'objet en échec qui ne disait pas la cause. `double-relecture.mjs` lit la marque de même, `include` et `config.worktree` compris.
- **`meme-contenu.sh` et `double-relecture.mjs` demandent à git s'il admet le dépôt** (décision `A-159`), au lieu de refaire sa décision : avant toute lecture, chacun joue `git rev-parse --absolute-git-dir` dans le dossier courant, avec l'environnement de la session tel quel (sa configuration et ses variables `GIT_CONFIG_*`). Refusé par git (dépôt d'un autre propriétaire, dépôt nu sous `safe.bareRepository = explicit`, valeur de configuration que git ne lit pas, lieu de configuration relatif…) : `illisible`, sortie 21, « pas dans un dépôt git que git admet : <la ligne `fatal:` de git> ». Admis, le dépôt réel se lit toujours sans configuration d'utilisateur ni de poste, et reçoit seulement `safe.directory` pour le dossier git et l'arbre de travail que git vient d'admettre. Les deux bornes de la recherche, `GIT_CEILING_DIRECTORIES` et `GIT_DISCOVERY_ACROSS_FILESYSTEM`, sont gardées, pour la question comme pour les lectures. Deux cas restent plus stricts que git, et la raison le dit : `GIT_DIR`, `GIT_WORK_TREE` ou `GIT_COMMON_DIR` posée (le calcul les écarte et juge le dépôt du dossier courant ; la raison les nomme) ; un dépôt sous `core.worktree` d'un autre propriétaire (« plus strict que git : … », avec la cause de git). Hors ces deux cas, les deux calculs lisent ainsi exactement ce que git admet : avant, ils refaisaient sa lecture de configuration et lisaient, dans 14 cas trouvés par la contre-relecture, un dépôt que git refuse ; ils refusaient aussi un dépôt déclaré sûr par `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS`, ce qui touchait les sessions cloud, où `GIT_CONFIG_COUNT` est toujours posée.
- **Le gabarit de règle montre `criticality` en bloc**, une clé par ligne (`level`, `by`, `reason` entre guillemets) : Prettier la laisse telle quelle à ses réglages par défaut, la réindente sans la replier sous un autre retrait, et le lecteur d'en-têtes de la double relecture la lit dans les deux cas ; la forme en ligne `{ level, by, reason }` n'est plus montrée.
- **Les noms de tests s'écrivent en français**, comme le veut l'ADR du socle sur la langue (`ADR_ALL_ARC-4`) : `.claude/rules/tests.md` demande `it('<comportement> quand <condition>')`, au présent, sans « should » ; ses exemples, la méthode du socle, la fiche Anchorpost, le gabarit de règle, les gabarits de tests (`exemple.jour-metier.spec.ts`, `exemple.property.spec.ts`) et le `CLAUDE.md` et les guides de l'API le disent de même. Aucun gate ne lisait l'ancienne forme.

Dans le dépôt du plugin seulement : `scripts/poses.test.mjs` joue les bancs posés en tranches parallèles (`scripts/tranches.mjs`), chaque test exactement une fois ; seul, il passe de 324 s à 236 s, et de 360 s à 279 s dans la suite entière, plafonds inchangés.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Reposer les scripts de la chaîne, dans une PR du projet : `/maj-skills:fusionner poser` (`meme-contenu.sh`, `double-relecture.mjs` et leurs bancs). Rien à déclarer de plus : ce que la session lit avec son propre git, les deux calculs le lisent ; un « illisible » qui cite une ligne `fatal:` de git se règle comme git le demande.
3. Reporter dans le projet, par une PR, la ligne « Le nom dit le comportement » de `.claude/rules/tests.md`, ses exemples et ceux de `docs/agents/gabarits/` ; les tests déjà écrits en anglais se renomment à leur prochaine retouche, rien ne les refuse.
4. Une règle qui porte `criticality` en ligne peut être réécrite en bloc à sa prochaine retouche (`level`, `by`, `reason` entre guillemets, une clé par ligne).

## 7.34.0 — 2026-11-19

### Ce qui change

CODEOWNERS sort du plugin (décision du produit du 2026-11-18) : GitHub ne bloque plus aucune PR sur les chemins sensibles. Le socle ne pose plus `.github/CODEOWNERS`, ni son générateur `scripts/github/codeowners.mjs`, ni le gate `check:codeowners` ; le gabarit de `.claude/chaine.json` n'a plus de clé `proprietaires` ni de gate rapide sous `scripts/github/` ; `garde-fichiers` ne refuse plus l'édition de CODEOWNERS, et normalise toujours le chemin avant de juger le lockfile, un `.env` ou une migration livrée. Le capitaine n'attend plus personne : les états « attend un propriétaire » et « attend un humain » (fusion refusée faute d'approbation) sortent de `file.sh`, `passer.sh`, `boucle.sh` et `github.sh`. **Un refus de fusion de GitHub faute de revue approuvée est désormais un refus durable comme un autre : `passer.sh` sort en 3 et la boucle s'arrête**, au lieu d'attendre l'approbation. La PR refusée garde `à-fusionner` et sa place dans la file : tant que la règle demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et les PR vers `develop` placées après elle attendent ; le capitaine ne retire pas son label, le dit à son lanceur, et un humain lève la règle (skill `fusionner`, « Devant un refus durable de fusion »). L'état `humain` du plafond des renvois ne change pas. Le socle pose trois ADR ; le gabarit de l'ADR « CODEOWNERS » reste dans le plugin, marqué retiré. La liste de l'admin dit de ne pas cocher « Require review from Code Owners », tient « Required approvals » à 0 (une approbation exigée arrête désormais le capitaine), et garde « Block force pushes », « Restrict deletions » et « aucune liste de contournement ». Plus aucun texte ne donne la protection des branches de GitHub pour frontière contre une PR hostile : aucune de ses règles n'arrête ce qu'un compte de confiance fait entrer. Les chemins sensibles, la contre-revue et `/security-review` ne changent pas ; ce qui prendra la place de CODEOWNERS, l'accord du produit donné avant de toucher un fichier sensible, arrive avec la relecture indépendante.

### Ce qu'un projet fait pour en profiter

Un projet qui ne repose rien ne voit rien changer : ses scripts sont des copies, son CODEOWNERS et son gate marchent comme avant.

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Un projet qui n'a jamais reçu CODEOWNERS (pas de `scripts/github/codeowners.mjs`) : rien d'autre à faire.
3. Un projet qui l'a reçu (posé ou reposé depuis le plugin 7.13.0) suit, dans une seule PR vers `develop`, la marche à suivre `socle-chaine-de-production/references/retrait-codeowners.md`. **Aucun `poser` ne fait ce retrait.** Elle retire `.github/CODEOWNERS` seulement si sa première ligne est celle du générateur (`# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.`) : un CODEOWNERS écrit à la main reste, et se dit à qui a lancé la session. Elle retire aussi le générateur, son banc, les scripts `codeowners` et `check:codeowners`, la clé `proprietaires` et le gate rapide du contrat, repose `scripts/agent/` et les scripts du capitaine, corrige `CLAUDE.md`, la méthode et la liste de l'admin, et marque retirée l'ADR « CODEOWNERS » du projet.
4. **À l'admin, avant que la PR du retrait entre dans `develop` : décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était, et tenir « Required approvals » à 0.** La boucle en marche n'attend aucune relance : au tour qui suit l'entrée de cette PR, elle prend les scripts du capitaine de `develop` (même sans le reste du retrait) et n'attend plus personne. Une revue encore exigée l'arrête alors (`ARRÊT`, sortie 3) sur la première PR de la file dont GitHub refuse la fusion, après l'avoir mise à jour avec `develop` (une CI), et de nouveau à chaque relance tant que la règle demeure : règle cochée, la première PR qui touche un chemin possédé sans qu'un propriétaire l'ait approuvée (une PR déjà approuvée passe) ; « Required approvals » à 1 ou plus, toute PR non approuvée, qu'elle touche ou non un chemin possédé.
5. **Avant que la PR du retrait entre dans `develop`, les PR qui attendaient une revue.** Relever avec l'ancien `file.sh` (le nouveau les montre `prête`) les PR « attend un propriétaire » ou « attend un humain » : la règle décochée, le capitaine reposé les fusionne sans la relecture qu'elles attendaient. Les faire relire, ou leur retirer `à-fusionner`. Le commentaire `<!-- attente-revue-capitaine -->` que l'ancien capitaine y a laissé n'est plus lu (ni attente ni renvoi) et peut être supprimé.
6. Relancer la veille de chaque capitaine une fois cette PR entrée dans `develop` (skill `fusionner` § « Mise en place ») : la boucle en marche a déjà pris les nouveaux scripts, la veille garde sa copie de `file.sh` jusqu'à sa relance.

Un projet peut reposer `scripts/agent/` et les scripts du capitaine avant de retirer le fichier : son gate `check:codeowners` reste vert tant que son contrat garde `proprietaires` et que son générateur est là.

## 7.33.0 — 2026-11-19

### Ce qui change

Le skill `fusionner` porte un calcul nouveau, `scripts/double-relecture.mjs` : il dit si une PR exige deux relectures indépendantes, parce que son ticket porte la ligne `Relecture: double` ou cite en `Règles:` une règle de criticité haute (sans cette ligne, celle de sa spec est lue), que son diff touche le fichier d'une règle haute ou un fichier que le champ `code` de cette règle nomme, ou qu'elle change le niveau d'une règle vers ou depuis « haute ». Il rend, en dernière ligne de sa sortie, « exigée », « non exigée » ou « illisible », après les causes ; une lecture en échec ne vaut jamais « non exigée ».

**Le prix, à connaître avant de l'appeler.** L'en-tête d'un fichier de règle est lu sans bibliothèque, par une liste fermée de formes de ligne : `clé: valeur`, `clé:` suivie d'un bloc, `- valeur`, `- clé: valeur`, des scalaires nus ou entre guillemets sur une ligne, un mappage `{ … }` ou une liste `[ … ]` sur une ligne, les commentaires, et les trois formes que Prettier 3 donne à un mappage ou à une liste trop longs, à ses retraits exacts : le flux entier seul sur la ligne qui suit sa clé, au retrait de la clé plus deux (la forme qu'on rencontre d'abord au réglage du socle, `printWidth: 100`, dès qu'une liste `code:` de trois chemins dépasse la ligne) ; l'ouvrant seul sur cette ligne, puis une entrée par ligne avec sa virgule, puis le fermant seul ; l'ouvrant en fin de la ligne de la clé, puis de même. Tout le reste est hors liste : scalaire en bloc (`|`, `>`), texte ou chaîne pliés sur plusieurs lignes, étiquette, ancre, alias, clé entre guillemets, clé explicite (`? `), `clé:valeur` sans espace, tabulation, espace insécable, marque d'ordre des octets. **Un seul fichier de règle dont l'en-tête porte une ligne hors liste fait répondre « exigée » à toute PR du dépôt, tant qu'il n'est pas récrit** : le calcul ne prouve pas ce qu'il ne lit pas. Un en-tête dont les lignes sont dans la liste mais que le calcul refuse au sens fait la même cause : un niveau hors de `low`, `medium`, `high`, une `criticality` sans `level`, un `code` qui n'est pas une liste de chemins (`code:` sans valeur compris), un chemin nu que YAML lit comme un nombre, un fichier sans en-tête. La sortie dit où : une cause `<règle>`, `en-tête illisible`, le fichier, la réf, et une ligne `# illisible : <réf>:<fichier> : ligne <n> : <raison>`. Restent hors liste, sous Prettier : une chaîne pliée sur deux lignes (`proseWrap: always`, qui plie aussi la raison de la forme en bloc), un texte nu à virgule dans un mappage en ligne (à mettre entre guillemets) ; et, sous `trailingComma: none` (aucune virgule après la dernière entrée) ou une largeur de retrait autre que 2 (`tabWidth: 4`), toute forme où le flux est plié sur plusieurs lignes. Le réglage du socle (`printWidth: 100`, `trailingComma: all`, retrait de 2) n'en écrit aucune de celles-là. Le gabarit `regle.md`, tant que ses jokers `{{…}}` ne sont pas remplis, est hors liste aussi. De même, un ticket que la PR nomme (titre ou branche) et qu'aucun arbre ne porte fait répondre « exigée », cause `ticket introuvable` ; un ticket archivé dans tous les arbres l'est aussi. Un index Anchorpost illisible rend tout l'arbre illisible avant que les en-têtes soient lus : « illisible », sortie 21, même à côté d'un en-tête hors liste.

Dans un dépôt superficiel, le clone par défaut d'une session cloud, il rend « illisible » et sa raison nomme la cause et le remède (`git fetch --unshallow origin`) : il n'écrit jamais dans le dépôt et ne lance aucun `fetch`, c'est à qui l'appelle d'approfondir le clone d'abord. Un dépôt partiel (cloné avec `--filter`) est « illisible » de même, cause et remède nommés. Le dépôt d'un autre propriétaire n'est lu que si une déclaration `safe.directory` l'admet : le calcul prend les déclarations que `git config --show-scope` lit hors de tout dépôt aux portées de système et d'utilisateur, et n'en retient qu'une valeur égale au chemin du dépôt, caractère pour caractère, ou `*` ; il ne voit pas une déclaration faite par `git -c`, et n'en admet aucune quand `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` est dans l'environnement. Aucun script ne l'appelle encore : c'est une brique de la relecture indépendante, qui arrive par étapes. L'étape 0 de `fusionner` (`poser`) le nomme parmi les scripts à copier.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Rien d'autre pour l'instant : aucun script de la chaîne n'appelle ce calcul, rien ne change au passage du capitaine, et il n'y a pas à le relancer.
3. À la prochaine repose de `fusionner`, son étape 0 copie `scripts/double-relecture.mjs` dans `scripts/chaine/` avec son banc : rien à faire de plus.
4. Avant qu'un script n'appelle ce calcul : écrire les en-têtes des fichiers de règle dans les formes de la liste, la forme en bloc de préférence (`criticality:` puis `level:`, `by:`, `reason:` en retrait), que Prettier ne plie pas au réglage du socle (il en plie la raison sous `proseWrap: always`).

## 7.32.0 — 2026-11-19

### Ce qui change

Le verdict d'une contre-relecture s'écrit sur la PR, et aucun ordre de fusion ne passe un verdict non conforme (ticket 21 de `capitaine-a-jour-et-teste`). Le 2026-11-19, la PR 133 est entrée dans `main` sans les corrections d'une contre-relecture non conforme dont le verdict n'était écrit que dans une carte : aucune session ne pouvait le lire depuis la PR.

- **Le verdict s'écrit sur la PR** : toute contre-relecture d'une PR, dans un dépôt sans la chaîne, laisse en première ligne d'un commentaire `contre-relecture non conforme au sommet <sha40>` (suivie des constats) ou `contre-relecture conforme au sommet <sha40>`. Elle l'écrit avant l'ordre `à-fusionner`, jamais après.
- **Aucun ordre ne passe un verdict non conforme** : la session qui livre ou ordonne ne pose ni le commentaire ni le label si un verdict `non conforme` porte sur le sommet, ou si la PR porte un verdict et qu'aucun verdict `conforme` ne porte sur ce sommet. Le capitaine sans la chaîne (`architecte/references/lancement.md`) renvoie la PR dans ces cas, renvoi compté dans le plafond de trois, et s'arrête sur un verdict édité ou sur une première ligne qui commence par `contre-relecture non conforme` sans la forme exacte d'un verdict. Une PR sans aucun verdict suit la suite de la procédure.

### Ce qu'un projet fait pour en profiter

- Un capitaine ou une session déjà lancés gardent l'ancienne procédure jusqu'à leur relance.
- Une PR déjà ordonnée sans aucun commentaire de verdict n'est pas renvoyée pour cela ; l'architecte qui a contre-relu une PR encore ouverte y écrit son verdict.
- Iroki et Fedora, dépôts à la chaîne, n'ont rien à faire : leur capitaine (`fusionner`, `revue-exigee.mjs`) ne lit pas ces commentaires, et un verdict écrit sur leurs PR n'y est qu'une information.

## 7.31.2 — 2026-11-19

### Ce qui change

Correctifs du verrou du passage de 7.31.0 (contre-relecture du ticket 4 de `capitaine-a-jour-et-teste`) :

- **Une lecture refusée du verrou est une panne** : des commentaires illisibles à sa relecture (502, réponse vide ou d'erreur) font sortir `passer.sh` et `sujet.sh fusionner` ou `relancer` en 5 (`PAUSE`, `REPRISE`), jamais en 3 ou 11 ; seul un commentaire qui ne se pose pas (écriture refusée) garde 3 (`ARRÊT`) et 11 (`ÉCHEC DU CAPITAINE`).
- **La trappe est posée avant le verrou** : un TERM (`boucle.sh --arreter`) ou un INT pendant la pose ou la relecture termine le commentaire, au lieu de le laisser vivant jusqu'à son expiration. Un signal qui tombe pendant la pose elle-même (réponse de GitHub en vol, `gh` tué avec le groupe) laisse un commentaire posé dont l'id n'est pas lu : la trappe relit alors les commentaires de la PR et termine les marques vivantes du capitaine ; une relecture en panne se dit en une ligne (le verrou expire 90 minutes après sa dernière date comptée). Cette trappe ne sort jamais en échec sous `set -euo pipefail` : une relecture lue dont une date est illisible se dit aussi en une ligne, et le code de sortie reste celui du passage (3, 5, 143…).
- **L'âge du verrou se lit dans la marque** : `<!-- capitaine:passage <id> <epoch> -->`, epoch réécrit à chaque rafraîchissement ; `updated_at` ne sert plus. Une marque de 7.31.0, sans epoch, vit 90 minutes depuis sa création. La date d'une marque est le plus tard de son epoch et de sa création : un epoch en retard (horloge en retard, `0`) ne la rajeunit pas, et un verrou vit au moins 90 minutes depuis sa pose. Un epoch en avance de plus de 5 minutes sur le capitaine qui lit est ignoré tant qu'il le reste (la marque est alors datée par sa création), puis compte quand un lecteur plus tardif le rattrape : une marque posée par une horloge en avance peut donc revivre, jusqu'à son epoch + 90 minutes. Un verrou sans nouvelles meurt 90 minutes après la plus tardive de sa création et de son epoch compté ; jamais de gel, jamais de fusion non testée (décision A-55 de l'architecte). Un epoch illisible (lettres, plus de 12 chiffres, plus de 40 caractères, vide) laisse la marque datée par sa création, jamais ignorée.
- **L'horloge des bancs ne joue que sous le faux GitHub** : `PASSAGE_HORLOGE_BANC` n'est honorée que si `FAUX_GH` est posé et non vide ; posée sans lui, elle est ignorée (horloge de la machine) et retirée de l'environnement, avec un seul avertissement sur la sortie d'erreur, donné une fois, au chargement de `github.sh`, avant tout verdict : la dernière ligne de la sortie reste le verdict que lit la boucle, même quand la trappe de fin du verrou joue après lui.

Aucune clé, aucune sortie nouvelle pour un projet.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer chaque capitaine une fois cette PR entrée dans develop, avec `CAPITAINE_ID` comme en 7.31.0 : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1`.

## 7.31.1 — 2026-11-19

### Ce qui change

Le conducteur d'un chantier ne met plus le sujet à jour avec develop : le capitaine seul le fait, de lui-même, au début de chaque lancement de sa boucle, et à la fin quand la file est vide, dès qu'aucune sous-PR du sujet n'est ouverte. Le skill `chantier` (§ 6, point 6) disait au conducteur de lancer `sujet.sh rafraichir` entre deux vagues ; deux sessions ont ainsi fait ce geste l'une après l'autre sur un même sujet. Le conducteur constate seulement, sans rien écrire : `git fetch -q origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/<nom>:refs/remotes/origin/sujet/<nom>'`, puis `git merge-base --is-ancestor origin/develop origin/sujet/<nom>`. Le fetch porte des refspecs explicites : dans le clone `--single-branch` d'une session cloud, un fetch nu ne met pas `origin/sujet/<nom>` à jour, et le constat lirait une référence périmée. Sujet en retard : aucune vague ne part, et s'il le reste au réveil suivant le conducteur demande pourquoi à un capitaine actif ; sur `SUJET EN CONFLIT` ou `SUJET NON MIS À JOUR (sortie 3, aucun conflit)`, il lance comme avant une session fille qui ouvre la PR de mise à jour. Dans trois cas la boucle ne reporte pas develop d'elle-même (livraison du sujet ouverte, livraison intermédiaire tout juste entrée dans develop, sous-PR hors vague restée ouverte) : le conducteur demande alors au capitaine de le faire à la main, sans le faire lui-même. Un constat qui échoue (fetch en échec, sortie autre que 0 ou 1) ne vaut ni « à jour » ni « en retard » : aucune vague ne part.

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; aucun script à reposer, le capitaine ne se relance pas. Un conducteur déjà lancé garde son ancien skill jusqu'à sa relève : lui dire de ne plus lancer `sujet.sh rafraichir`.

## 7.31.0 — 2026-11-19

### Ce qui change

Plusieurs capitaines peuvent tenir la même file : la règle « un seul capitaine actif » disparaît. Au début de chaque passage, le capitaine pose sur la PR un commentaire « passage du capitaine <id> », et un autre capitaine saute la PR tant que ce passage n'est pas terminé (90 minutes au plus sans nouvelles). La boucle, la veille, `passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer` exigent `CAPITAINE_ID`, l'id de la session du capitaine (sortie 64 sans lui ; `sujet.sh relancer`, joué à la main par la session propriétaire, ne pose alors aucun verrou et le dit ; `boucle.sh --arreter` marche sans lui). Un verrou illisible arrête le passage (`passer.sh` 3, `sujet.sh` 11), jamais un passage sans lui ; `boucle.sh --arreter` laisse 15 s entre TERM et KILL pour que le passage termine son commentaire. Le texte du socle change : fragment `claude-md-fusion.md` (« Seuls les capitaines fusionnent »), gabarit de l'ADR « chaîne de production », table des rôles de `chaine-de-production.md`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`. Dans la même PR, `CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine » : remplacer « **Une seule session fusionne** : le capitaine de fusion (skill `fusionner`) » par la phrase du fragment du socle (`socle-chaine-de-production/references/fragments/claude-md-fusion.md`, l. 3). L'ADR « chaîne de production » du projet reste telle quelle : elle se révise si le projet le veut.
3. Relancer chaque capitaine une fois cette PR entrée dans develop, **avec `CAPITAINE_ID`** : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). Un capitaine relancé sans la variable s'arrête aussitôt, sortie 64 : `VEILLE ARRÊTÉE`.

**Iroki** : ses deux capitaines (un par personne) peuvent tourner ensemble une fois les scripts reposés. Son `boucle.sh` et son `passer.sh` ont divergé de ceux du plugin : reposer remplace ses versions par celles de 7.31.0. Son `CLAUDE.md` reçoit la phrase du fragment.

## 7.30.0 — 2026-11-19

### Ce qui change

`fusionner` porte un script neuf et son banc, `scripts/meme-contenu.sh` et `scripts/meme-contenu.test.mjs`. Le calcul dit si deux sommets d'une PR, celui d'un verdict de relecture et celui qu'on juge, ne sont séparés que par des fusions de la cible et des commits d'index générés : `bash scripts/chaine/meme-contenu.sh <V> <T> <B>`, sorties 0 « même », 20 « différent », 21 « illisible » (69 quand un outil manque). Seul un index à `commande`, de chemin littéral, déclaré tel sur la cible et au sommet jugé, est dispensé ; un index sans commande, déclaré par motif, déclaré plus d'une fois ou couvert aussi par un motif se juge comme tout fichier, et le fichier de la liste des index toujours. Une fusion dont le conflit porte sur autre chose qu'un tel index n'est jamais « même » : le capitaine ne résout aucun conflit de code. Il demande **git ≥ 2.41** (`--attr-source`), bash ≥ 4, `jq`, `mktemp` et `rm`, et un dossier temporaire où écrire ; il ne lit pas le réseau et n'écrit rien dans le dépôt. Rien ne l'appelle encore : il prépare la relecture indépendante.

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; rien d'autre aujourd'hui : aucun script de la boucle ne change, le capitaine ne se relance pas. Le script et son banc arrivent dans `scripts/chaine/` à la prochaine fois que le projet rejoue `/maj-skills:fusionner poser`.

À prévoir pour la suite : **un poste de capitaine ou de Relecteur dont le git est plus ancien que 2.41 rendra « illisible » (sortie 69) à chaque appel**. Relever `git --version` sur ces postes avant que le capitaine et le Relecteur n'appellent ce calcul. De même, **dans un dépôt superficiel** (le clone d'une session cloud, profondeur 50 par défaut), le calcul rend « illisible » et sa raison dit le remède, `git fetch --unshallow origin` : il n'approfondit rien lui-même, c'est à qui l'appelle de le faire une fois avant.

## 7.29.1 — 2026-11-19

### Ce qui change

Le capitaine d'un dépôt sans la chaîne (`architecte/references/lancement.md`, bloc « Procédure : ») renvoie une PR en retard sur la branche par défaut (`mergeable_state` `behind`) au lieu de la mettre à jour : commentaire `à-fusionner retiré par le capitaine : en retard sur <branche par défaut> : …`, label retiré, et le renvoi compte dans le plafond de trois. La garde « mise à jour signée par GitHub » (lecture du sommet par `get_commit`) disparaît : le serveur GitHub MCP d'une session cloud ne rend ni les parents ni `verification`, le capitaine ne pouvait pas la prouver et renvoyait toute PR mise à jour par GitHub (PR 111, 2026-11-18). Un sommet qui n'est pas celui de l'ordre est renvoyé, sans exception ; le capitaine n'appelle plus jamais la mise à jour de branche. Les gardes d'agent du socle ne changent pas.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Un capitaine sans la chaîne déjà lancé garde l'ancienne procédure jusqu'à sa relance : le relancer avec le prompt de `lancement.md`.
3. Une session qui reçoit le renvoi « en retard » fusionne elle-même la branche par défaut dans sa branche (commit de merge, jamais de rebase), pousse, attend la CI, puis repose le label et le commentaire au nouveau sommet.

## 7.29.0 — 2026-11-19

### Ce qui change

Clé de contrat facultative `fusionsSansEffet` (`.claude/chaine.json`) : pour chaque fichier qu'un hook du projet garde, l'expression des lignes sans effet et la mention à écrire. Quand une fusion jouée par le capitaine (mise à jour d'une PR avec develop, d'un sujet avec develop, d'une sous-PR avec son sujet) n'apporte à ce fichier que de telles lignes, son commit de fusion porte la mention, et le hook du projet le laisse passer. Un changement réel n'a pas de mention : le capitaine le dit, et le hook juge comme avant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Si un hook du projet exige une mention sur un fichier, ajouter la clé à `.claude/chaine.json`, dans la même PR (le capitaine la lit sur develop). Pour un projet Prisma dont le `commit-msg` exige une migration ou `[sans-migration: <raison>]` :

   ```json
   "fusionsSansEffet": [
     {
       "fichier": "prisma/schema.prisma",
       "lignesSansEffet": "^[[:space:]]*(//.*)?$",
       "mention": "[sans-migration: commentaire seul, apporté par une mise à jour du capitaine]"
     }
   ]
   ```

   Le chemin du schéma est celui du projet ; l'expression est celle de `grep -E` (POSIX étendue : `[[:space:]]`, jamais `\s`), et chaque ligne ajoutée ou retirée doit lui correspondre en entier.
4. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).

**Iroki** : son `.husky/commit-msg` n'exige aucune mention de migration ; rien à ajouter au contrat. Reposer `passer.sh`, `sujet.sh` et `github.sh` remplace ses versions, qui ont divergé (`github.sh` de 549 lignes) : la repose est celle de 7.16.0, cette version n'en ajoute pas.

**Fedora** (où le défaut a été vécu) : ajouter à `.claude/chaine.json` l'entrée de l'étape 3, avec le chemin de son schéma. Son hook `sans-migration` doit lire **tout** le message de commit : la mention est au deuxième paragraphe, après la ligne `Merge remote-tracking branch '…' into …` de git ; un hook qui ne lit que la première ligne ne la voit pas.

Une session qui reçoit develop dans un sujet (PR de mise à jour, après un `rafraichir` refusé) fusionne par `bash -c '. scripts/chaine/github.sh && fusionner_avec origin/develop'` au lieu de `git merge origin/develop` : sa fusion porte la même mention (skill `sujet`, « Recevoir develop dans un sujet »).

## 7.28.0 — 2026-11-19

### Ce qui change

Le socle de la chaîne pose un check `PR titre` (`.github/workflows/pr-titre.yml`, `scripts/github/pr-titre.mjs`), non exigé : à l'ouverture d'une PR vers `develop` ou un sujet, à chaque retouche de son titre ou de son corps et à chaque push, il montre ce que le capitaine refusera (sujet du squash trop long, commitlint pour une sous-PR, section de revue absente, ligne `/security-review` absente sur un chemin sensible, titre de code sur de la documentation seule). Il juge avec les fonctions du capitaine (`revue-exigee.mjs`, `sujet.sh a-juger`, `sujet.sh est-livraison`) : une PR de réception de `develop` dans un sujet se reconnaît à sa forme et se juge sur sa résolution et ses retouches ; une tête `livraison/…` n'est dispensée de revue que sur la preuve du capitaine, jamais sur son nom.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Dans une PR du projet : `/maj-skills:fusionner poser` et `/maj-skills:sujet poser` (`revue-exigee.mjs`, `github.sh`, `passer.sh`, `sujet.sh` et leurs bancs), puis, de `/maj-skills:socle-chaine-de-production`, les étapes 4 ter (`scripts/github/pr-titre.mjs` et son banc) et 6 (`.github/workflows/pr-titre.yml`). `.github/workflows/**` et `scripts/github/**` sont des chemins sensibles : contre-revue et `/security-review`. Aucune clé de contrat.
3. Ne pas ajouter `PR titre` aux checks exigés de `develop` : le capitaine reste le juge.
4. Relancer le capitaine une fois cette PR entrée dans develop (`passer.sh` et `github.sh` changent, sans changer de comportement) : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : son `scripts/ci/pr-titre.mjs` et son `.github/workflows/pr-titre.yml` (#628, et sa voie de réception, #539) sont à remplacer par ceux du socle ; sa voie `chore/<nom>-recoit-develop`, reconnue par le nom de branche, n'existe pas dans le plugin, qui reconnaît une PR de réception à sa forme (une seule fusion de `develop`, son premier commit, puis des retouches). Ses PR de réception qui n'ont pas cette forme seront refusées par le check comme par le capitaine du plugin.

## 7.27.0 — 2026-11-19

### Ce qui change

Une PR sans CI que GitHub dit en conflit se lit « prête (en conflit) » dans la file du capitaine, au lieu de « prête (sans CI) ». Une sous-PR dans cet état passe par `sujet.sh relancer`, qui lit désormais la règle d'ascendance avant toute fusion : un conflit limité aux index générés est mis à jour (index régénérés, poussé, CI relancée), tout autre conflit est renvoyé à sa session avec la liste des fichiers hors index générés (de même pour `passer.sh`), et une mise à jour que le pre-push refuse est renvoyée avec la sortie du hook.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille et son `file.sh` tournent sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).

**Iroki** : son `file.sh` signale déjà ce cas par une note au titre (« [conflit avec la base, aucun check : mise à jour par le passage] », `file.sh:18-23` et `:155`), et son `relancer` résout déjà un conflit d'index (SPEC_ALL_SOC-4.28, SPEC_ALL_SOC-4.41), avec d'autres codes (6 outillage, 8 index régénérés, 9 push refusé). Reposer remplace ses deux scripts par ceux du plugin et perd ses ajouts locaux (`file.sh` diffère de 231 lignes, `sujet.sh` de 1 820) : son conducteur reporte ce changement à la main, ou repose puis reporte ses ajouts, et rejoue ses bancs propres (`file-mobile-e2e.test.mjs`, `file-ticket-titre.test.mjs`).

## 7.26.1 — 2026-11-19

### Ce qui change

`sujet.sh` élague les refs `origin/sujet/*` d'un sujet supprimé du distant (`git fetch --prune` limité aux sujets) : `etat`, `carte`, `de`, `demarrer` et `livrer-prets` ne le lisent plus ; un fetch en échec se dit. Le refus d'une PR de mise à jour faite en plusieurs fusions donne la recette pour la refaire (fetch à refspecs explicites, qui marche dans un clone `--single-branch`), et son renvoi dit de la refaire dans une nouvelle PR, et `sujet/SKILL.md` a une section « Recevoir develop dans un sujet » (recette, corps type de la PR avec « Retouches » et « Revue de ticket »).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (`sujet.sh`, `sujet-refs.test.mjs`), puis `/maj-skills:fusionner poser` (`boucle.sh`, `renvoyer.sh`). Aucune clé de contrat.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend `sujet.sh` de develop au tour suivant ; la veille, elle, appelle `file.sh` de sa copie : nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : son `sujet.sh` a divergé (voie `recevoir` et contrôle de `chore/<nom>-recoit-develop`) ; il ne repose pas `sujet.sh` du plugin, qui effacerait cette voie. Son correctif #643 (`scripts/chaine/sujet.sh:142-147`) équivaut à l'élagage ; il ne lui manque que l'avertissement d'un fetch en échec, à reporter à la main.

## 7.26.0 — 2026-11-19

### Ce qui change

Une garde d'agent qui ne peut pas charger `regles.mjs` ou `entree.mjs` (ou qui le charge sans l'export attendu) refuse l'outil et dit comment sortir, en une ligne sans trace de Node, et toute autre erreur non rattrapée d'une garde refuse aussi, comme toute sortie autre que 0 ou 2 (jamais la sortie 1, ni le 13 d'un `await` qui ne se résout pas) : la session s'arrête et le dit à qui l'a lancée ; un humain restaure `scripts/agent/` depuis le dernier commit où les gardes se chargent (`git checkout origin/develop -- scripts/agent/` si develop est sain), jamais en contournant la garde. Les six hooks qui chargent ces modules sont couverts (`garde-commandes`, `garde-fichiers`, `garde-github`, qui refusent ; `apres-edition`, `fin-de-tour`, `demarrage`, qui disent que le hook est sauté et sortent en 0). Le gabarit `chaine-de-production.md` dit d'écrire un tel fichier d'un seul coup, par un seul geste : la copie préparée et vérifiée hors du dépôt (`node --check`, l'import qui rend chaque export de la version en place), puis `cp <copie> scripts/agent/<fichier>`. La garde refuse `git commit --amend`, sous ses abréviations (`--am`, `--ame`, `--amen`) et derrière toute option globale de git ; `git commit -m "--amend"` et `--fixup=amend:<sha>` passent ; le paragraphe « Jamais d'amend » du gabarit le dit. Le capitaine renvoie une PR qui touche un chemin sensible sans la ligne « `/security-review` : lancée » dans sa section de revue (`revue-exigee.mjs`, `motifSansSecurite` ; contrat de la base illisible : tout chemin est sensible) ; la ligne n'est lue ni dans un bloc de code, ni dans un commentaire HTML, ni recopiée du gabarit sans choisir (« | non requise » ou « / non requise » laissés, parenthèse « (chemins : …) » vide ou en `…`).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/chaine/socle-chaine-de-production/references/agent/` vers `scripts/agent/` : `garde-commandes.mjs`, `garde-fichiers.mjs`, `garde-github.mjs`, `apres-edition.mjs`, `fin-de-tour.mjs`, `demarrage.mjs`, `regles.mjs`, `regles.test.mjs`, `garde-illisible.test.mjs`, **chacun d'un seul coup**, comme le dit le gabarit : la copie hors du dépôt (scratchpad), `node --check`, l'import qui rend chaque export de la version en place, puis un seul `cp` sur `scripts/agent/<fichier>`. `scripts/agent/**` est un chemin sensible : contre-revue et `/security-review`.
3. Reposer `/maj-skills:fusionner poser` (`revue-exigee.mjs`). Toute PR du projet qui touche un chemin sensible porte désormais la ligne « `/security-review` : lancée » dans sa section de revue : le dire aux sessions en cours, et relancer le capitaine une fois la PR entrée dans develop.
4. Recopier dans `docs/agents/pieges.md` la puce « Une garde d'agent cassée refuse tout outil » (l'ancienne conseillait `disableAllHooks`), dans `docs/agents/chaine-de-production.md` le paragraphe « Un fichier que les gardes chargent s'écrit d'un seul coup » et la dernière phrase du paragraphe « Jamais d'amend » du gabarit, et la ligne « Hooks d'agent » du fragment `claude-md-fusion.md` dans `CLAUDE.md`, si le projet les a gardées telles quelles.
5. `node --test scripts/agent/*.test.mjs scripts/chaine/revue-exigee.test.mjs` : vert.

**Iroki**, hors du plugin : ses consignes « Jamais d'amend » (#634) et « s'écrit d'un seul coup » (#653, `docs/agents/chaine-de-production.md:124`, `:126`) sont couvertes par ce gabarit et par la garde ; sa garde lit encore les commandes par expressions, et la repose de `regles.mjs` suppose son passage à la lecture par jetons (ticket 17).

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
