# CODEOWNERS sort du plugin : GitHub ne bloque plus une PR sur les fichiers sensibles ; le générateur, son gate, la clé `proprietaires`, le refus d'édition et l'attente d'un propriétaire par le capitaine sont retirés

Status: needs-info
Type: task
Label: contre-revue
Modèle: sonnet — un patch inverse donné par sa commande et vérifié fichier par fichier, deux fichiers supprimés, quarante-deux retouches données mot pour mot (ancien, nouveau), un fichier nouveau et un banc donnés entiers, la version ; tout est joué sur une copie jetable de `origin/main`, mutations comprises (voir « Vérification »). Rien à concevoir ; la revue passe `/security-review` (la garde de fichiers et les scripts du capitaine).
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-codeowners.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/socle-chaine-de-production/references/retrait-codeowners.md`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/chantier/SKILL.md`, `README.md`, `scripts/depot.test.mjs`, `scripts/poses.test.mjs`, `scripts/points-d-entree.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**La décision du produit** (`P-49` de la carte « gouverner nos boucles », 2026-11-18, grilling du chantier 3, question `Q2`). Ses mots : « Q2: oui pas de blocage Github donc on peut dégager sur fichier CODEOWNERS nan ? ». La carte en tire : « Pas de blocage par GitHub sur les fichiers sensibles, et le fichier CODEOWNERS disparaît », « Le réglage « Require review from Code Owners » ne se coche sur aucun dépôt », et `P-49` remplace `P-41` (les propriétaires).

**Pourquoi.** Toutes les sessions écrivent sous le compte du produit, et GitHub refuse qu'un auteur approuve sa propre PR : avec CODEOWNERS, chaque PR sensible dépendait d'une seconde personne (spec du chantier 3, « Le problème »).

**Le fait, sur `origin/main` à `4a45634`** (plugin 7.15.0, 738 tests). Le ticket 50 (PR 108, plugin 7.13.0) a posé dans le plugin : un générateur de `.github/CODEOWNERS` et son gate, joué aussi en fin de tour ; la clé `proprietaires` du contrat ; le refus d'éditer CODEOWNERS dans la garde de fichiers ; deux états de la file du capitaine, « attend un propriétaire » et « attend un humain », avec la lecture des règles de la branche, des relecteurs demandés et des revues ; une ADR, une case de la liste de l'admin, une ligne dans la méthode et dans le fragment de `CLAUDE.md`. `git grep -il codeowners origin/main -- skills scripts README.md .claude-plugin` rend 24 fichiers ; un 25e, `veille.test.mjs`, ne nomme que l'état « attend un propriétaire ».

Quand le ticket est fait :

1. **Plus rien ne génère, ne compare ni ne garde CODEOWNERS** : le générateur, son banc, son gate rapide et le refus d'édition sont retirés ; le gabarit du contrat n'a plus de clé `proprietaires`.
2. **Le capitaine n'attend plus personne** : les états « attend un propriétaire » et « attend un humain » qui venaient de CODEOWNERS sortent de `file.sh`, `passer.sh`, `boucle.sh` et `github.sh`. L'état `humain` du plafond des renvois ne change pas d'une ligne.
3. **Le socle ne pose plus rien de CODEOWNERS** dans un projet neuf : ni question, ni étape, ni ADR ; il pose trois ADR.
4. **Un projet déjà posé sait s'en défaire** : une marche à suivre, lue depuis le skill, retire `.github/CODEOWNERS` quand il porte l'en-tête du générateur, et seulement alors.
5. **L'ADR « CODEOWNERS » reste, marquée retirée** par la décision du 2026-11-18.
6. **La liste de l'admin dit de ne pas cocher « Require review from Code Owners »**, et garde, dans la protection de branche, ce qui ne tenait pas à CODEOWNERS : pas de push forcé, pas de suppression de branche, aucune liste de contournement.
7. **Un banc tient le retrait** : CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré.

Ce ticket ne pose pas la garde qui prendra la place : l'accord du produit donné avant de toucher un fichier sensible (`P-47`, `P-48`) arrive avec les lots suivants du chantier 3. D'ici là, un chemin sensible reste tenu comme avant le ticket 50 : contre-revue du conducteur, `/security-review`, revue exigée par le capitaine.

## Où

Base : `origin/main` à `4a45634` (PR 110, plugin **7.15.0**, **738 tests**). Les numéros de ligne sont ceux de cette base.

| Fichier | Ce qu'il porte de CODEOWNERS | Ce qu'il devient |
| --- | --- | --- |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs` (147 lignes) | le générateur (`--ecrire`) et le gate (sans argument) | supprimé (§ 1) |
| `…/references/scripts/github/codeowners.test.mjs` (146 lignes, 10 tests) | son banc | supprimé (§ 1) |
| `skills/chaine/fusionner/scripts/github.sh:220-294` | `revue_proprietaires_exigee`, `proprietaires_de`, `demandes_jq`, `proprietaire_demande`, `attend_proprietaire`, `refus_pour_revue`, `MARQUE_ATTENTE`, `TEXTE_ATTENTE`, `attend_humain`, `MOTIF_PROPRIETAIRE` | les 75 lignes sortent (§ 1, patch inverse) |
| `skills/chaine/fusionner/scripts/file.sh:20-32`, `:70-71`, `:103`, `:107`, `:148-151`, `:159-166` | la description des deux états, le champ `demandes` lu sur chaque PR, la branche `attend_humain`, le bloc « Revue des propriétaires » | sortent (§ 1) |
| `skills/chaine/fusionner/scripts/passer.sh:42-48`, `:85-87`, `:104-106`, `:356-357`, `:363-379` | les deux motifs de la sortie 7 et la seconde sortie 5 dans l'en-tête, le saut « attend un humain », le saut « attend un propriétaire », la lecture du refus de fusion et son commentaire marqué | sortent ; le refus de fusion redevient une sortie 5 (décision 6) (§ 1) |
| `skills/chaine/fusionner/scripts/boucle.sh:7-11`, `:387` | l'en-tête et le commentaire de la sortie 7 | reviennent à leur texte d'avant (§ 1) |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs:1430-1630` | onze tests, leurs aides `attenteProprietaire`, `etats`, `commentaireAttente` et trois constantes | sortent (§ 1) |
| `skills/chaine/fusionner/scripts/veille.test.mjs:165-173` | un test | sort (§ 1) |
| `skills/chaine/sujet/scripts/faux-gh.mjs:11-19`, `:125-126`, `:129-130`, `:210`, `:218-219`, `:221-222`, `:238-263`, `:295-296` | les réglages `revueProprietaires`, `PR.relecteurs`, `PR.equipes`, `PR.approbationManquante`, `commentairesRefuses`, `PR.revues`, la date des commentaires, la règle `pull_request` et la route `required_pull_request_reviews`, le refus 405 | sortent (décision 5) (§ 1) |
| `skills/chaine/fusionner/SKILL.md:64-65` | le paragraphe « Une PR qui attend l'approbation d'un propriétaire » | sort (§ 1) |
| `skills/chaine/fusionner/references/CONTENU.md:13`, `:51` | « Attend un propriétaire », « Attend un humain » ; les tests décrits | sortent (§ 1) |
| `…/references/fragments/claude-md-fusion.md:10` | la ligne « Chemin sensible = relu par un humain, tenu par GitHub » | sort (§ 1) |
| `scripts/poses.test.mjs:6`, `:23-29`, `:62`, `:65-70`, `:86-105` | `FICHIERS_POSES`, les bancs de `scripts/github/`, le test du banc posé avec un contrat | reviennent à leur forme d'avant (§ 1) |
| `scripts/points-d-entree.test.mjs:20` | l'entrée `codeowners` de `SCRIPTS` (six tests) | S1 |
| `…/references/agent/regles.mjs:41-49`, `:63-65` | `CODEOWNERS`, `RAISON_CODEOWNERS`, le refus dans `refusEdition` | S2, S3 ; la normalisation du chemin reste (décision 4) |
| `…/references/agent/regles.test.mjs:27-38` | le test du refus | B1 |
| `…/references/chaine.json:2`, `:3`, `:4`, `:19` | le `$comment`, `scripts/github/**` parmi les chemins sensibles, `"proprietaires": []`, le gate rapide | S4 à S7 ; `scripts/github/**` reste (décision 3) |
| `skills/chaine/socle-chaine-de-production/SKILL.md:3`, `:10`, `:16`, `:26`, `:34`, `:38`, `:42`, `:63-64`, `:74`, `:78`, `:89` | la description, le placeholder, la question 4, le point 4 ter, les quatre ADR, deux commandes de vérification, le message de commit, « ni propriétaires inventés », un anti-pattern | R1 à R13 |
| `…/references/CONTENU.md:5`, `:13`, `:19-22`, `:41`, `:45`, `:49` | sept clés, le refus d'édition, la section « CODEOWNERS », quatre gabarits, la ligne du fragment, la règle de l'admin | R14 à R22 |
| `…/references/admin.md:6`, `:26-37` | le renvoi à la case, la case « CODEOWNERS respecté » et ses neuf sous-points | R23, R24 |
| `…/references/adr/ADR_ALL_ARC-N-codeowners.md:3`, `:7` | `Statut : **accepté**` | R25, R26 : marquée retirée, gardée (décision 2) |
| `…/references/docs-agents/chaine-de-production.md:3`, `:85-86` | « CODEOWNERS : `{{ADR_CODEOWNERS}}`. », le paragraphe du § 3 | R27, R28 |
| `skills/chaine/chantier/SKILL.md:95` | « Sauf une PR qui touche un chemin possédé… il n'approuve rien lui-même. » | R29 |
| `README.md:79`, `:150` | « un `.github/CODEOWNERS` généré… quatre ADR », « CODEOWNERS et son gate… quatre ADR » | R30, R31 |
| `scripts/depot.test.mjs:222`, `:734-743` | un chemin d'exemple, le test « le dernier repli du banc de CODEOWNERS… » | B2, B3 ; B4 ajoute trois tests |
| `…/references/retrait-codeowners.md` | — (absent) | N1 : la marche à suivre du retrait dans un projet |
| `.claude-plugin/plugin.json:3` | 7.15.0 | V1 : 7.16.0 |

### « Attend un humain » : deux sens, ligne par ligne

Le même mot dit deux choses sur `origin/main`. **Le plafond des renvois** (ticket 7, `plafonds.renvoisParPR`) : une PR renvoyée trois fois prend l'état `humain`. **L'attente d'une approbation** (ticket 50) : une PR dont GitHub a refusé la fusion faute de revue prend l'état `attend un humain`. Seul le second sort.

| Ligne | Texte | Sens | Verdict |
| --- | --- | --- | --- |
| `fusionner/scripts/github.sh:21`, `:27`, `:34` | « en attente d'un humain », « le plafond (la PR attend un humain) », « compté au plafond : la PR attend un humain » | plafond des renvois (`renvois_de`) | gardé |
| `github.sh:266-292` | « Attente d'un humain (plafond des mises à jour sans approbation) », `attend_humain`, « la PR attend un humain » (`:280`) | approbation | retiré |
| `file.sh:19` | « le gel prime sur « humain », qui revient au dégel » | plafond | gardé |
| `file.sh:27-32` | la description de l'état `attend un humain` | approbation | retiré |
| `file.sh:33-35` | la description de l'état `humain` | plafond | gardé |
| `file.sh:65` | « chaque PR se lit au plafond de renvois et attend un humain » | plafond | gardé |
| `file.sh:146-147` | `elif [ "$(renvois_de "$n")" -ge "$plafond" ]; then etat='humain'` | plafond | gardé |
| `file.sh:148-151` | `elif attend_humain "$n"; then … etat='attend un humain'` | approbation | retiré |
| `passer.sh:44-45`, `:85-87` | « ou qui attend un humain : fusion déjà refusée ainsi », `! attend_humain "$N" \|\| sortir 7 "attend un humain : …"` | approbation | retiré |
| `passer.sh:309` | « la décision revient à l'humain ou à la session » | ni l'un ni l'autre (branche déjà à jour) | gardé |
| `passer.sh:371` | « La PR attend un humain jusqu'à une nouvelle approbation » | approbation | retiré |
| `renvoyer.sh:21`, `:36` | « cette PR attend un humain », « RENVOI $numero sur $plafond : la PR attend un humain » | plafond | gardé |
| `fusionner.test.mjs:340-460`, `:930`, `:983-993` | les tests des renvois et du gel (« humain ») | plafond | gardés, sans retouche |
| `fusionner.test.mjs:1523-1614` | quatre tests et une aide qui nomment « attend un humain » | approbation | retirés |
| `fusionner/SKILL.md:64` | « la PR se lit `attend un humain` (ni mise à jour, ni relancée, ni renvoyée) » | approbation | retiré |
| `fusionner/SKILL.md:70` | « Au troisième renvoi, la sortie dit que la PR attend un humain : le dire au produit. » | plafond | gardé |
| `fusionner/references/CONTENU.md:13` | « « Attend un humain » : plafond des mises à jour sans approbation. » | approbation | retiré |
| `fusionner/references/CONTENU.md:33` | « la marque recopiée par un autre compte ne met pas une PR en attente d'un humain » | plafond | gardé |
| `chantier/SKILL.md:95` | « puis « attend un humain » si GitHub a refusé sa fusion » | approbation | retiré (R29) |
| `…/references/chaine.json:2` | « `renvoisParPR` met une PR renvoyée autant de fois en attente d'un humain » | plafond | gardé |
| `…/references/CONTENU.md:5` | « le nombre de renvois après lequel une PR attend un humain » | plafond | gardé |
| `…/docs-agents/chaine-de-production.md:144` | « une PR renvoyée trois fois attend un humain » | plafond | gardé |
| `…/references/admin.md:37` | « la montre `attend un humain` », « chaque PR qui touche un chemin sensible attend un humain » | approbation | retiré (R24) |
| `README.md:86` | « les renvois comptés (au plafond, la PR attend un humain) » | plafond | gardé |

### Gardé tel quel, après lecture

- **`skills/chaine/fusionner/scripts/proprietaire.sh`** (19 lignes) : il rend le worktree d'une branche, pour retrouver la session qui a écrit une PR (`:4`). Aucun lien avec CODEOWNERS. Restent avec lui `renvoyer.sh:4`, `:37` (« worktree propriétaire »), `passer.sh:310`, `fusionner/SKILL.md:3`, `:22`, `:70`, `:71`, `:84`, `:92`, `:93` (« session propriétaire », « Propriétaire renvoyé »), `fusionner/references/CONTENU.md:31`, `:33`, `sujet/scripts/depot-jouet.mjs:102`, `README.md:167`.
- **`…/references/agent/garde-github.mjs:14`** (« Un nom de dépôt ou de propriétaire ») : le propriétaire d'un dépôt GitHub.
- **Le rôle « propriétaire » de PostgreSQL** dans `skills/backend/socle-nest-hexagonal/` (migrations, RLS) et `skills/monorepo/socle-monorepo/references/tickets/2-hebergement-et-trust-proxy.issue.md:23`.
- **`checks_exiges`** (`github.sh:209-218`) et sa lecture de `rules/branches/develop` : les checks exigés, pas la revue.
- **`…/references/scripts/github/develop.sh` et `develop.test.mjs`**, `…/references/labels.sh` : ce que `scripts/github/` garde.
- **`cheminsSensibles` du gabarit** (`chaine.json:3`), `scripts/github/**` compris (décision 3), et les deux tests qui le lisent : `scripts/depot.test.mjs:213` (un chemin d'exemple change, B2) et `:394`.

### Les tests retirés, et ce qu'ils deviennent

31 tests sortent, 4 entrent : 738 − 31 + 4 = **711**.

| Tests | Ce qu'ils prouvaient | Ce qu'ils deviennent |
| --- | --- | --- |
| `codeowners.test.mjs`, 10 tests | la génération, les motifs refusés, le gate | retirés avec le script ; « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » prouve que ni le script ni ses commandes n'existent plus |
| `regles.test.mjs` « refusEdition refuse CODEOWNERS à ses trois places, toute casse : modifier chaine.json, puis régénérer » | le refus, sur douze chemins normalisés | remplacé (B1) par « refusEdition normalise le chemin avant de juger : un détour (`//`, `/./`, `x/../`, `\\`) ne contourne aucun refus » : la normalisation gardée, prouvée sur le lockfile, un `.env` et une migration livrée, et l'édition de CODEOWNERS que plus rien ne refuse |
| `fusionner.test.mjs`, 11 tests : cinq « file.sh : … attend un propriétaire … », « passer.sh : une PR qui attend un propriétaire sort en 7… », « passer.sh : une fusion refusée faute d'approbation… », « file.sh : « attend un humain » jusqu'à une approbation plus récente… », « boucle.sh : les PR qui attendent un propriétaire sont sautées… », « file.sh : une CI rouge prime sur « attend un humain »… », « passer.sh : commentaire d'attente impossible à poser… » | les deux états | retirés : les états n'existent plus. L'état `humain` du plafond reste prouvé, sans retouche, par « renvoyer.sh : au troisième renvoi… » (`:346`), « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain… » (`:380`), « renvois : seuls les commentaires du compte du capitaine comptent… » (`:404`), « boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée » (`:460`), « file.sh : le gel prime sur « humain »… » (`:983`) |
| `veille.test.mjs` « PR qui attend un propriétaire : pas de relance ; approuvée (prête), boucle relancée » | la veille ne relance pas sur cet état | retiré |
| `poses.test.mjs` « le banc de CODEOWNERS posé passe dans un projet dont le contrat a ses propriétaires » | le banc posé hors du plugin | retiré ; « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » revient à `scripts/chaine/` seul |
| `points-d-entree.test.mjs`, six « codeowners agit quand on le lance : … » | les six accès au script | retirés (S1) |
| `depot.test.mjs` « le dernier repli du banc de CODEOWNERS redit les cheminsSensibles du gabarit » | le repli du banc retiré | retiré (B3) |

### Repose dans un projet

Rien ne se met à jour seul : un projet garde sa copie des scripts posés. Sur les trois projets du programme, deux ont reçu CODEOWNERS (lu sur leur `origin/develop` le 2026-11-18) : `.github/CODEOWNERS`, dont la première ligne est celle du générateur, `scripts/github/codeowners.mjs` et son banc, les scripts `codeowners` et `check:codeowners` de `package.json`, une étape de leur script de contrôle, la clé `proprietaires` et le gate rapide dans `.claude/chaine.json`, l'ADR posée ; le troisième n'a rien de tout cela. Le retrait dans un projet est le travail de son architecte, par la marche à suivre que ce ticket écrit (N1) ; ce ticket ne touche aucun projet.

## Décisions

1. **Tout `A-77` de la spec du chantier 3**, sans rien y ajouter : sortent le générateur et son test, son gate et l'entrée de `gatesRapides`, la clé `proprietaires`, le refus d'éditer CODEOWNERS, les états « attend un propriétaire » et « attend un humain » qui en viennent (`github.sh`, `file.sh`, `passer.sh`, `boucle.sh` et leurs tests), la case de la liste de l'admin. `proprietaire.sh` reste.
2. **L'ADR « CODEOWNERS » du socle est marquée « retirée par la décision `P-49` du 2026-11-18 », pas supprimée** (R25, R26) : sa ligne `Statut` le dit, une section « Retrait » dit ce qui sort et ce qui reste, la suite du texte ne change pas. **Elle ne se pose plus dans un projet neuf** : le socle pose trois ADR, et le placeholder `{{ADR_CODEOWNERS}}` disparaît de tous les fichiers posés. Le gabarit reste dans `references/adr/` pour les projets qui l'ont reçu : la marche à suivre y prend la ligne `Statut` et la section « Retrait ». Elle n'est pas dite « remplacée » : l'ADR qui la remplacera s'écrit avec la bascule du chantier 3 (`A-96`), pas avant.
3. **`scripts/github/**` reste dans `cheminsSensibles`** du gabarit. Le ticket 50 l'y a fait entrer pour le générateur ; `develop.sh` (qui crée `develop` sur le distant) et `labels.sh` (qui écrit les labels du dépôt) y vivent encore, et retirer un chemin sensible n'est pas dans `A-77`.
4. **La normalisation du chemin reste dans `refusEdition`** (`posix.normalize`, `regles.mjs:64`). Le ticket 50 l'a écrite pour CODEOWNERS, mais elle ferme un contournement des autres refus : sans elle, `apps/../pnpm-lock.yaml` et `apps/web/../api/src/db/migrations/<livrée>.ts` passent la garde. Son test change d'objet (B1).
5. **Le faux `gh` revient à ce qu'il était avant le ticket 50** : tout réglage qu'aucun banc ne lit plus sort, y compris ceux qui ne nomment pas CODEOWNERS (`commentairesRefuses`, `PR.revues`, la date `created_at` des commentaires, la route `rules/branches/<branche>` pour une autre branche que `develop`). Les lots 3 et 4 du chantier 3 poseront ce dont ils ont besoin, avec leurs bancs.
6. **Un refus de fusion de GitHub redevient une sortie 5** de `passer.sh` (« fusion refusée (develop ou la PR a bougé), relancer »), comme avant le ticket 50 : la boucle retente une fois, puis s'arrête. Sur un dépôt où « Require review from Code Owners » serait restée cochée, c'est cet arrêt qui le montre ; la marche à suivre le dit à l'admin (N1, point 7).
7. **La liste de l'admin** (R23, R24) : la case « Protection de `develop` » dit de ne pas cocher « Require review from Code Owners », et reçoit « Restrict deletions », « aucune liste de contournement » et « pas de règle de PR sur `sujet/*` » ; une case « Block force pushes » prend la place de la case « CODEOWNERS respecté » ; un paragraphe dit ce que ces règles ne tiennent pas (une PR hostile). Sortent avec la case : les deux propriétaires humains, « Required approvals » à 0, la PR d'essai, « Dismiss stale pull request approvals », l'approbation qui vaut pour le sommet approuvé, la lecture de CODEOWNERS sur la branche visée, la casse des motifs.
8. **Le retrait dans un projet est une marche à suivre, pas un script** : `references/retrait-codeowners.md`, lue depuis le skill et jamais posée, citée par `SKILL.md:16`. Elle retire `.github/CODEOWNERS` **seulement si sa première ligne est celle du générateur**, `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` (`codeowners.mjs:85`, avec `CONTRAT` de `:22`) ; toute autre première ligne, le fichier est celui du projet et reste. Elle ne touche pas un `CODEOWNERS` à la racine ou sous `docs/` : le générateur n'a jamais écrit que `.github/CODEOWNERS` (`codeowners.mjs:21`).
9. **Version : mineure** (`.claude-plugin/plugin.json:3`, 7.15.0 → **7.16.0**) : une pièce posée et une clé du contrat sortent, une référence entre. **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, puis vérifie la valeur (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`).
10. **`Label: contre-revue`** et **`/security-review`** : `regles.mjs` est la garde de fichiers, `github.sh`, `file.sh`, `passer.sh` et `boucle.sh` sont les scripts du capitaine, `chaine.json` est le contrat, tous chemins sensibles d'un projet posé. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): CODEOWNERS sort du plugin, GitHub ne bloque plus une PR sur les fichiers sensibles (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.
11. **Le banc tient le retrait par une liste fermée** (B4) : tout fichier suivi de `README.md`, `.claude-plugin/`, `scripts/` et `skills/` qui nomme CODEOWNERS, les « Code Owners », la clé `proprietaires`, l'état « attend un propriétaire », la marque `attente-revue-capitaine` ou `attend_humain` est une faute, hors six fichiers qui disent le retrait : `SKILL.md` du socle, `retrait-codeowners.md`, `CONTENU.md` du socle, `admin.md`, l'ADR, `regles.test.mjs`, et le banc lui-même. Le lecteur a son test d'entrées piégées : `proprietaire.sh`, « session propriétaire » et « la PR attend un humain » ne sont pas des fautes.

### Remèdes écartés

- **Supprimer l'ADR** : une décision retirée se lit encore ; les projets qui l'ont posée gardent son numéro.
- **Garder l'attente d'un propriétaire pour un projet qui tiendrait CODEOWNERS à la main** : `P-49` dit qu'aucun dépôt ne coche le réglage ; un état que rien ne déclenche est du code mort dans les scripts du capitaine.
- **Un script de retrait posé dans le projet** : il servirait une fois par projet, et vivrait ensuite dans `scripts/` sans objet ; la condition tient en une commande (`head -n 1`), que le banc tient mot pour mot.
- **Garder dans le faux `gh` les réglages sans nom de CODEOWNERS**, pour les lots 3 et 4 : sans lecteur ni test, ils ne prouvent rien ; ces lots les poseront avec leurs bancs.
- **Retirer la normalisation avec le refus** : elle rouvrirait un contournement du lockfile et des migrations livrées (décision 4).
- **Écrire dans la liste de l'admin que l'accord du produit, donné avant, garde les fichiers sensibles** : cette garde n'existe pas encore dans le plugin ; le texte décrirait un régime qui n'est pas là.

## À faire, dans l'ordre

Chaque « Ancien » se retrouve par son texte ; il apparaît une fois, une seule, dans son fichier. Un bloc « Nouveau » se recopie tel quel, sans la ligne de clôture.

### 0. Le banc d'abord, vu rouge

#### B1 — `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs:27`

Le test du refus de CODEOWNERS devient le test de ce qui reste de lui : la normalisation du chemin (décision 4), prouvée sur le lockfile, un `.env` et une migration livrée, et l'édition de CODEOWNERS que plus rien ne refuse.

Bloc retiré : de la ligne qui commence par

````js
test('refusEdition refuse CODEOWNERS à ses trois places
````

jusqu'à la ligne, non comprise, qui commence par

````js
test('decisionCommande refuse le push forcé
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````js
test('refusEdition normalise le chemin avant de juger : un détour (`//`, `/./`, `x/../`, `\\`) ne contourne aucun refus', () => {
  for (const c of ['pnpm-lock.yaml', './pnpm-lock.yaml', './/pnpm-lock.yaml', 'apps/../pnpm-lock.yaml', 'docs/./../pnpm-lock.yaml', '.\\pnpm-lock.yaml'])
    assert.match(refusEdition(c, nouvelle) ?? '', /pnpm install/, c);
  for (const c of ['apps/api/.env', 'apps//api/.env', 'apps/./api/.env', 'apps/web/../api/.env', 'apps\\api\\.env'])
    assert.match(refusEdition(c, nouvelle) ?? '', /secrets/, c);
  for (const c of ['apps/api/src/db/migrations/202611041200-care-plan.ts', 'apps/api/src/db//migrations/202611041200-care-plan.ts', 'apps/api/src/./db/migrations/202611041200-care-plan.ts', 'apps/web/../api/src/db/migrations/202611041200-care-plan.ts'])
    assert.match(refusEdition(c, livree) ?? '', /ne se modifie jamais/, c);
  // CODEOWNERS n'est plus généré ni gardé (décision du produit, 2026-11-18) : plus rien ne refuse son édition.
  for (const c of ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']) assert.equal(refusEdition(c, nouvelle), null, c);
});
````

#### B2 — `scripts/depot.test.mjs:221`

Le test « le gabarit .claude/chaine.json range les gardes de la chaîne parmi les chemins sensibles » garde un exemple sous `scripts/github/**` (décision 3) : le script qui crée `develop`.

Ancien :

````js
    "scripts/chaine/diff-revue.sh",
    "scripts/github/codeowners.mjs",
````

Nouveau :

````js
    "scripts/chaine/diff-revue.sh",
    "scripts/github/develop.sh",
````

#### B3 — `scripts/depot.test.mjs:734`

Le test « le dernier repli du banc de CODEOWNERS redit les cheminsSensibles du gabarit » lisait `codeowners.test.mjs`, qui disparaît : il sort avec lui.

Bloc retiré : de la ligne qui commence par

````js
// Le banc de CODEOWNERS, posé sans contrat ni gabarit à côté
````

jusqu'à la ligne, non comprise, qui commence par

````js
// Le skill de criticité (ticket 49)
````

Rien à la place.

#### B4 — fin de `scripts/depot.test.mjs`

Trois tests. `SKILLS_CHAINE`, `REF`, `lignes`, `titres` et `exiger` existent déjà dans le fichier.

Ajouté à la fin du fichier, après une ligne vide :

````js
// CODEOWNERS sort du plugin (ticket 54 ; décision du produit du 2026-11-18 : pas de blocage par GitHub sur les
// fichiers sensibles, le fichier CODEOWNERS disparaît). Plus rien ne le génère, ne le garde ni ne l'attend : il
// n'est plus nommé que là où le plugin dit qu'il est retiré (l'ADR gardée pour mémoire, la marche à suivre qui le
// retire d'un projet déjà posé et son renvoi dans le skill, la liste de l'admin, le CONTENU.md du socle) et dans les
// bancs qui le prouvent.
const SOCLE_CHAINE = `${SKILLS_CHAINE}/socle-chaine-de-production`;
const ADR_CODEOWNERS = `${REF}/adr/ADR_ALL_ARC-N-codeowners.md`;
const RETRAIT_CODEOWNERS = `${REF}/retrait-codeowners.md`;
const DISENT_LE_RETRAIT = [`${SOCLE_CHAINE}/SKILL.md`, RETRAIT_CODEOWNERS, `${REF}/CONTENU.md`, `${REF}/admin.md`, ADR_CODEOWNERS, `${REF}/agent/regles.test.mjs`, "scripts/depot.test.mjs"];
const DE_CODEOWNERS = /codeowners|code[ _]owners?|\bproprietaires\b|attend un propriétaire|attente-revue-capitaine|attend_humain/i;
const deCodeowners = (ligne) => DE_CODEOWNERS.test(ligne);

test("lecteur des mentions de CODEOWNERS : entrées piégées", () => {
  for (const l of [".github/CODEOWNERS", "pnpm codeowners", "« Require review from Code Owners »", "require_code_owner_review", "Waiting on code owner review", "`proprietaires` du contrat", "etat='attend un propriétaire'", "<!-- attente-revue-capitaine -->", "elif attend_humain \"$n\"; then", "{{ADR_CODEOWNERS}}"])
    assert.equal(deCodeowners(l), true, l);
  // Ce qui reste : la session auteur d'une PR (proprietaire.sh), et l'attente d'un humain au plafond des renvois.
  for (const l of ["bash scripts/chaine/proprietaire.sh <branche>", "worktree propriétaire", "Prévenir la session propriétaire", "RENVOI 3 sur 3 : la PR attend un humain", "etat='humain'", "le rôle propriétaire ne sert qu'aux migrations"])
    assert.equal(deCodeowners(l), false, l);
});

test("CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré", () => {
  const fichiers = execFileSync("git", ["ls-files", "--", "README.md", ".claude-plugin", "scripts", "skills"], { cwd: RACINE, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const fautes = fichiers
    .filter((f) => !DISENT_LE_RETRAIT.includes(f))
    .flatMap((f) => lignes(readFileSync(join(RACINE, f), "utf8")).flatMap((l, i) => (deCodeowners(l) ? [`${f}:${i + 1}`] : [])));
  assert.deepEqual(fautes, [], `CODEOWNERS est retiré du plugin (décision du produit, 2026-11-18) : ${fautes.join(" ; ")}`);
  assert.ok(fichiers.length > 300 && DISENT_LE_RETRAIT.every((f) => fichiers.includes(f)), "le parcours lit le dépôt, et chaque fichier de la liste existe");
  for (const f of ["scripts/github/codeowners.mjs", "scripts/github/codeowners.test.mjs"]) assert.ok(!existsSync(join(RACINE, REF, f)), `${REF}/${f} : retiré`);
  const gabarit = JSON.parse(readFileSync(join(RACINE, REF, "chaine.json"), "utf8"));
  assert.equal("proprietaires" in gabarit, false, "le gabarit du contrat ne porte plus la clé `proprietaires`");
  assert.deepEqual(gabarit.gatesRapides.filter((g) => /github/.test(g)), [], "aucun gate rapide sous scripts/github/");
  assert.ok(gabarit.cheminsSensibles.includes("scripts/github/**"), "scripts/github/** reste un chemin sensible (develop.sh, labels.sh)");
});

test("le socle retire CODEOWNERS d'un projet déjà posé : le fichier seulement s'il porte l'en-tête du générateur, l'ADR marquée retirée, la règle de GitHub jamais cochée", () => {
  exiger(`${SOCLE_CHAINE}/SKILL.md`, [
    "Un projet posé avec le plugin 7.13 à 7.15 porte un `.github/CODEOWNERS` généré, que le produit a retiré : [`references/retrait-codeowners.md`](references/retrait-codeowners.md).",
    "`node scripts/docs/next-id.mjs ADR ALL ARC` trois fois, de suite",
  ]);
  exiger(RETRAIT_CODEOWNERS, [
    "Le produit les a retirés le 2026-11-18 : GitHub ne bloque aucune PR sur les chemins sensibles, et « Require review from Code Owners » ne se coche sur aucun dépôt.",
    "1. **Le fichier.** `head -n 1 .github/CODEOWNERS` rend `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` : c'est la copie du générateur, `git rm .github/CODEOWNERS`. Toute autre première ligne : le fichier est celui du projet, le laisser et le dire à qui a lancé la session. Un `CODEOWNERS` à la racine ou sous `docs/` n'a jamais été généré : ne pas y toucher.",
    "2. **Le générateur et son gate.** `git rm scripts/github/codeowners.mjs scripts/github/codeowners.test.mjs` ; retirer de `package.json` les scripts `codeowners` et `check:codeowners`, de `scripts/check.mjs` l'étape `check:codeowners`,",
    "3. **Le contrat.** Dans `.claude/chaine.json` : retirer la clé `proprietaires` et l'entrée `scripts/github/codeowners.mjs` de `gatesRapides`, reprendre le `$comment` de `references/chaine.json`. `cheminsSensibles` ne change pas.",
    "6. **L'ADR.** L'ADR « CODEOWNERS » du projet garde son numéro et son texte : sa ligne `Statut` devient celle de `references/adr/ADR_ALL_ARC-N-codeowners.md`, et la section « Retrait » de ce gabarit s'y ajoute, placeholders substitués. Ce gabarit ne se pose plus dans un projet neuf.",
    "7. **À l'admin.** Décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était : une session ne le peut pas.",
  ]);
  const adr = readFileSync(join(RACINE, ADR_CODEOWNERS), "utf8");
  assert.ok(lignes(adr).includes("- Statut : **retirée** par la décision du produit du 2026-11-18 (`P-49` de la carte « gouverner nos boucles » du plugin `maj-skills`) ; gardée pour mémoire"), `${ADR_CODEOWNERS} : la ligne Statut dit le retrait`);
  assert.ok(titres(adr).indexOf("## Retrait") === 0, `${ADR_CODEOWNERS} : la section « Retrait » vient en premier`);
  exiger(`${REF}/admin.md`, [
    "« Require a pull request before merging », **sans** « Require review from Code Owners » (le produit l'a retirée le 2026-11-18 : aucun `.github/CODEOWNERS` n'est posé, et GitHub ne bloque aucune PR sur les chemins sensibles)",
    "**« Restrict deletions »** ; « Do not allow bypassing the above settings », et **aucune liste de contournement** (« Bypass list » vide) : un administrateur qui contourne la règle la retire pour tous.",
    "- [ ] **« Block force pushes »** sur toutes les branches (Rulesets, cible `~ALL`), sans liste de contournement.",
  ]);
});
````

Après B1 à B4, sur le texte de `origin/main` : `node --test scripts/depot.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` rend **100 tests, 3 rouges** : « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » (168 lignes dans 19 fichiers), « le socle retire CODEOWNERS d'un projet déjà posé… », « refusEdition normalise le chemin avant de juger… » (sur sa dernière assertion : l'édition de CODEOWNERS est encore refusée). « lecteur des mentions de CODEOWNERS : entrées piégées » est vert dès l'écriture.

### 1. Les retraits

**Onze fichiers par le patch inverse de la PR 108.** Ces onze fichiers n'ont pas bougé depuis la PR 108 (`86daaee`) : `git diff 86daaee origin/main --stat -- <les onze>` ne rend rien. Le retrait y est l'inverse exact de ce que la PR 108 leur a fait, et le résultat est leur contenu à `c17f88b`, le parent de la PR 108 :

```bash
ONZE="skills/chaine/fusionner/scripts/github.sh skills/chaine/fusionner/scripts/file.sh skills/chaine/fusionner/scripts/passer.sh skills/chaine/fusionner/scripts/boucle.sh skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs skills/chaine/sujet/scripts/faux-gh.mjs skills/chaine/fusionner/SKILL.md skills/chaine/fusionner/references/CONTENU.md skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md scripts/poses.test.mjs"
git diff 86daaee origin/main --stat -- $ONZE    # rien : les onze fichiers sont ceux de la PR 108
git diff 86daaee c17f88b -- $ONZE | git apply   # l'inverse de la PR 108, sur ces onze fichiers seuls
git diff c17f88b --stat -- $ONZE                # rien : ils sont revenus à leur contenu d'avant
```

Si la première commande rend quelque chose (un autre ticket a touché l'un des onze fichiers depuis), la session ne joue pas le patch sur ce fichier : elle y retire à la main les plages du tableau de « Où », lit `git diff c17f88b 86daaee -- <fichier>` pour les retrouver, et le dit dans sa PR.

**Deux fichiers supprimés**, par `git rm` et pas par `rm` : le test « aucun script du plugin ne saute un hook git » (`scripts/depot.test.mjs:287`) lit `git ls-files` et tombe sur un fichier suivi qui n'est plus sur le disque.

```bash
git rm skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.test.mjs
```

**Sept retouches**, dans trois fichiers que d'autres tickets ont touchés depuis, ou dont une ligne reste (décisions 3 et 4) :

#### S1 — `scripts/points-d-entree.test.mjs:20`

L'entrée de `SCRIPTS` du générateur : ses six tests (« codeowners agit quand on le lance : … ») sortent avec lui.

Ligne retirée, entière ; blancs de début mis à part, elle commence par :

````js
{ nom: "codeowners", fichier:
````

#### S2 — `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs:41`

Ancien :

````js
/**
 * CODEOWNERS, aux trois places où GitHub le lit (`.github/`, la racine, `docs/` ; la casse ignorée : un système de
 * fichiers insensible à la casse écrit `.GitHub/codeowners` au même endroit). Il se génère depuis `.claude/chaine.json`
 * (`scripts/github/codeowners.mjs`, ADR « CODEOWNERS ») : une seule source, que le gate `codeowners` compare.
 */
const CODEOWNERS = /^(\.github\/|docs\/)?codeowners$/i;
const RAISON_CODEOWNERS = (c) =>
  `${c} ne s'édite pas : il est généré depuis .claude/chaine.json. Modifier \`cheminsSensibles\` ou \`proprietaires\` dans .claude/chaine.json, puis régénérer avec « pnpm codeowners » (node scripts/github/codeowners.mjs --ecrire) ; le gate \`codeowners\` refuse tout écart (ADR « CODEOWNERS »).`;

/**
 * Refus d'éditer un fichier, ou `null` si l'édition est permise.
````

Nouveau :

````js
/**
 * Refus d'éditer un fichier, ou `null` si l'édition est permise.
````

#### S3 — `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs:63`

Le refus sort ; la normalisation reste (décision 4), et `import { posix } from 'node:path';` (`regles.mjs:13`) avec elle.

Ancien :

````js
  // Normalisé avant toute comparaison : `.github//CODEOWNERS`, `.github/./CODEOWNERS` ou `docs/../CODEOWNERS` visent le même fichier.
  const c = posix.normalize(chemin.replace(/\\/g, '/')).replace(/^(\.\/)+/, '');
  if (CODEOWNERS.test(c)) return RAISON_CODEOWNERS(c);
````

Nouveau :

````js
  // Normalisé avant toute comparaison : `.//pnpm-lock.yaml`, `apps/./api/.env` ou `docs/../pnpm-lock.yaml` visent le même fichier.
  const c = posix.normalize(chemin.replace(/\\/g, '/')).replace(/^(\.\/)+/, '');
````

#### S4 — `skills/chaine/socle-chaine-de-production/references/chaine.json:2`

Ancien :

````json
le générateur de CODEOWNERS et les scripts de `scripts/github/`,
````

Nouveau :

````json
les scripts de `scripts/github/` qui créent `develop` et les labels,
````

#### S5 — `skills/chaine/socle-chaine-de-production/references/chaine.json:2`

Ancien :

````json
et le gate `tickets` les contrôle dans les cartes. `proprietaires` : les comptes GitHub (`@utilisateur`, `@organisation/équipe`) à qui `.github/CODEOWNERS` donne chaque chemin sensible, ce fichier et CODEOWNERS lui-même ; CODEOWNERS se régénère par `pnpm codeowners` et le gate `codeowners` refuse tout écart (ADR « CODEOWNERS ») : deux humains au moins quand les sessions publient sous le compte d'un humain.",
````

Nouveau :

````json
et le gate `tickets` les contrôle dans les cartes.",
````

#### S6 — `skills/chaine/socle-chaine-de-production/references/chaine.json:4`

Ligne retirée, entière ; blancs de début mis à part, elle commence par :

````json
"proprietaires": [],
````

#### S7 — `skills/chaine/socle-chaine-de-production/references/chaine.json:18`

Ancien :

````json
    "scripts/verify/settings-json.mjs",
    "scripts/github/codeowners.mjs"
````

Nouveau :

````json
    "scripts/verify/settings-json.mjs"
````

### 2. Les textes, mot pour mot

#### R1 — `skills/chaine/socle-chaine-de-production/SKILL.md:3`

Ancien :

````text
une CI minimale, un .github/CODEOWNERS généré depuis les chemins sensibles avec son gate, la méthode docs/agents/chaine-de-production.md et quatre ADR
````

Nouveau :

````text
une CI minimale, la méthode docs/agents/chaine-de-production.md et trois ADR
````

#### R2 — `skills/chaine/socle-chaine-de-production/SKILL.md:10`

Ancien :

````text
`{{ADR_CHAINE}}`, `{{ADR_SUJET}}`, `{{ADR_CODEOWNERS}}`. Ce que chaque pièce
````

Nouveau :

````text
`{{ADR_CHAINE}}`, `{{ADR_SUJET}}`. Ce que chaque pièce
````

#### R3 — `skills/chaine/socle-chaine-de-production/SKILL.md:16`

Ancien :

````text
une mise à jour se fait pièce par pièce.
````

Nouveau :

````text
une mise à jour se fait pièce par pièce. Un projet posé avec le plugin 7.13 à 7.15 porte un `.github/CODEOWNERS` généré, que le produit a retiré : [`references/retrait-codeowners.md`](references/retrait-codeowners.md).
````

#### R4 — `skills/chaine/socle-chaine-de-production/SKILL.md:26`

La question 4 de l'étape 1 : il n'y a plus de propriétaires à demander.

Ligne retirée, entière ; blancs de début mis à part, elle commence par :

````text
4. **Propriétaires des chemins sensibles**
````

#### R5 — `skills/chaine/socle-chaine-de-production/SKILL.md:34`

Ancien :

````text
rempli des réponses de l'étape 1 (`proprietaires` : la réponse 4, jamais inventée).
````

Nouveau :

````text
rempli des réponses de l'étape 1.
````

#### R6 — `skills/chaine/socle-chaine-de-production/SKILL.md:38`

Le point 4 ter de l'étape 2 : plus rien à poser.

Ligne retirée, entière ; blancs de début mis à part, elle commence par :

````text
4 ter. **CODEOWNERS**
````

#### R7 — `skills/chaine/socle-chaine-de-production/SKILL.md:42`

Ancien :

````text
`node scripts/docs/next-id.mjs ADR ALL ARC` quatre fois, de suite
````

Nouveau :

````text
`node scripts/docs/next-id.mjs ADR ALL ARC` trois fois, de suite
````

#### R8 — `skills/chaine/socle-chaine-de-production/SKILL.md:42`

Ancien :

````text
`ADR_ALL_ARC-N-recette-humaine.md`, `ADR_ALL_ARC-N-codeowners.md` → `docs/adr/ADR_ALL_ARC-<n>-….md`
````

Nouveau :

````text
`ADR_ALL_ARC-N-recette-humaine.md` → `docs/adr/ADR_ALL_ARC-<n>-….md`
````

#### R9 — `skills/chaine/socle-chaine-de-production/SKILL.md:42`

Ancien :

````text
`{{ADR_CHAINE}}`, `{{ADR_SUJET}}` et `{{ADR_CODEOWNERS}}` valent ces identifiants
````

Nouveau :

````text
`{{ADR_CHAINE}}` et `{{ADR_SUJET}}` valent ces identifiants
````

#### R10 — `skills/chaine/socle-chaine-de-production/SKILL.md:62`

Ancien :

````text
pnpm check:tickets        # le gate et les tests des scripts, dont scripts/agent/
pnpm check:codeowners     # .github/CODEOWNERS suit le contrat
node --test scripts/github/*.test.mjs
node scripts/docs/next-id.mjs ADR ALL ARC
````

Nouveau :

````text
pnpm check:tickets        # le gate et les tests des scripts, dont scripts/agent/
node scripts/docs/next-id.mjs ADR ALL ARC
````

#### R11 — `skills/chaine/socle-chaine-de-production/SKILL.md:74`

Ancien :

````text
les branches de sujet, la recette humaine et CODEOWNERS`
````

Nouveau :

````text
les branches de sujet et la recette humaine`
````

#### R12 — `skills/chaine/socle-chaine-de-production/SKILL.md:78`

Ancien :

````text
- **Ni critères de revue, ni chemins sensibles, ni propriétaires inventés.** Le fichier de critères naît avec `revue-adversariale` ; les chemins viennent de la question 1, les propriétaires de la question 4.
````

Nouveau :

````text
- **Ni critères de revue, ni chemins sensibles inventés.** Le fichier de critères naît avec `revue-adversariale` ; les chemins viennent de la question 1.
````

#### R13 — `skills/chaine/socle-chaine-de-production/SKILL.md:89`

La ligne du tableau des anti-patterns.

Ligne retirée, entière ; blancs de début mis à part, elle commence par :

````text
| « Je corrige CODEOWNERS à la main, c'est une ligne »
````

#### R14 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:5`

Ancien :

````text
Sept clés, et rien d'autre,
````

Nouveau :

````text
Six clés, et rien d'autre,
````

#### R15 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:5`

Ancien :

````text
(un diff qui les touche passe en plus `/security-review`, et GitHub exige l'approbation d'un propriétaire), les **propriétaires** (`proprietaires` : les comptes GitHub à qui `.github/CODEOWNERS`, généré, donne chaque chemin sensible), le **fichier de critères**
````

Nouveau :

````text
(un diff qui les touche passe en plus `/security-review`), le **fichier de critères**
````

#### R16 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:5`

Ancien :

````text
`scripts/github/**` (le générateur de CODEOWNERS, `develop.sh`, `labels.sh`)
````

Nouveau :

````text
`scripts/github/**` (`develop.sh`, `labels.sh`)
````

#### R17 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:13`

Ancien :

````text
d'un `.env`, d'une migration déjà livrée et de CODEOWNERS (`.github/`, racine ou `docs/`, toute casse, chemin normalisé : `.github//CODEOWNERS` et `docs/../CODEOWNERS` comptent) : le refus dit de modifier `cheminsSensibles` ou `proprietaires` dans `.claude/chaine.json`, puis de régénérer (`pnpm codeowners`).
````

Nouveau :

````text
d'un `.env` et d'une migration déjà livrée, le chemin normalisé d'abord (`.//pnpm-lock.yaml` et `docs/../pnpm-lock.yaml` comptent).
````

#### R18 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:19`

La section entière : son titre, son paragraphe et la ligne vide qui les suit.

Bloc retiré : de la ligne qui commence par

````text
## CODEOWNERS — `scripts/github/codeowners.mjs`
````

jusqu'à la ligne, non comprise, qui commence par

````text
## Les labels — `labels.sh`
````

Rien à la place.

#### R19 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:41`

Ancien :

````text
Quatre gabarits, numérotés à l'installation
````

Nouveau :

````text
Trois gabarits, numérotés à l'installation
````

#### R20 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:41`

Ancien :

````text
la recette humaine, CODEOWNERS (un chemin sensible relu par un humain et tenu par GitHub, généré depuis le contrat, deux propriétaires humains). Ils portent la décision et les faits mesurés qui la fondent ; le projet les date et peut les réviser. Les skills ne les relisent jamais.
````

Nouveau :

````text
la recette humaine. Ils portent la décision et les faits mesurés qui la fondent ; le projet les date et peut les réviser. Les skills ne les relisent jamais. Un quatrième, `ADR_ALL_ARC-N-codeowners.md`, est marqué retiré (décision du produit du 2026-11-18) et ne se pose plus : il ne sert qu'à mettre à jour l'ADR d'un projet posé avec le plugin 7.13 à 7.15. `retrait-codeowners.md` est la marche à suivre de ce retrait, lue depuis le skill et jamais posée.
````

#### R21 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:45`

Ancien :

````text
la section « Fusion vers `develop` » (dont la ligne « chemin sensible = relu par un humain, tenu par GitHub ») et deux lignes de routage
````

Nouveau :

````text
la section « Fusion vers `develop` » et deux lignes de routage
````

#### R22 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:49`

Ancien :

````text
La protection des branches, la règle qui fait respecter CODEOWNERS (« Require review from Code Owners » sur develop et main, « Block force pushes », « Restrict deletions », aucun contournement ; deux propriétaires humains, sans quoi la règle ne protège pas), la suppression automatique
````

Nouveau :

````text
La protection des branches (dont « Block force pushes », « Restrict deletions » et aucune liste de contournement ; « Require review from Code Owners » ne se coche pas), la suppression automatique
````

#### R23 — `skills/chaine/socle-chaine-de-production/references/admin.md:6`

La case « Protection de `develop` » reprend les sous-règles qui ne tenaient pas à CODEOWNERS : pas de suppression de branche, aucune liste de contournement, pas de règle de PR sur les sujets.

Ancien :

````text
« Require a pull request before merging » ; « Require status checks to pass » avec **« Require branches to be up to date before merging »** (c'est le `strict: true` dont dépend le capitaine) et les checks `qualite` et `test-db` ; la revue des propriétaires relève de la case « CODEOWNERS respecté » ci-dessous, et de sa condition ; « Do not allow bypassing the above settings ». Pas de « Require linear history » : un sujet entre par un commit de merge.
````

Nouveau :

````text
« Require a pull request before merging », **sans** « Require review from Code Owners » (le produit l'a retirée le 2026-11-18 : aucun `.github/CODEOWNERS` n'est posé, et GitHub ne bloque aucune PR sur les chemins sensibles) ; « Require status checks to pass » avec **« Require branches to be up to date before merging »** (c'est le `strict: true` dont dépend le capitaine) et les checks `qualite` et `test-db` ; **« Restrict deletions »** ; « Do not allow bypassing the above settings », et **aucune liste de contournement** (« Bypass list » vide) : un administrateur qui contourne la règle la retire pour tous. Pas de « Require linear history » : un sujet entre par un commit de merge. Pas de règle de PR sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR : elle bloquerait la chaîne.
````

#### R24 — `skills/chaine/socle-chaine-de-production/references/admin.md:26`

La case « CODEOWNERS respecté », ses neuf sous-points et le paragraphe « Le capitaine n'est pas bloqué » (`admin.md:26-37`) sortent. Reste, de ses sous-règles, le refus des pushs forcés, et ce que GitHub ne tient plus.

Bloc retiré : de la ligne qui commence par

````text
- [ ] **CODEOWNERS respecté :
````

jusqu'à la ligne, non comprise, qui commence par

````text
Vérification : `gh api
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````text
- [ ] **« Block force pushes »** sur toutes les branches (Rulesets, cible `~ALL`), sans liste de contournement.

Ce que ces règles ne tiennent pas : toutes les sessions écrivent sous le même compte, la revue exigée par le capitaine est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`). Aucune n'arrête une PR hostile.
````

#### R25 — `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-codeowners.md:3`

Ancien :

````text
- Statut : **accepté**
````

Nouveau :

````text
- Statut : **retirée** par la décision du produit du 2026-11-18 (`P-49` de la carte « gouverner nos boucles » du plugin `maj-skills`) ; gardée pour mémoire
````

#### R26 — `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-codeowners.md:7`

Une section « Retrait » avant « Contexte » ; le reste du fichier ne change pas.

Ancien :

````text
## Contexte
````

Nouveau :

````text
## Retrait

Le produit a retiré cette décision le 2026-11-18 : pas de blocage par GitHub sur les fichiers sensibles, et le fichier CODEOWNERS disparaît. Toutes les sessions publient sous le compte du produit, et GitHub refuse qu'un auteur approuve sa propre PR : chaque PR sensible dépendait d'une seconde personne. Sortent du projet `.github/CODEOWNERS`, `scripts/github/codeowners.mjs` et son gate, la clé `proprietaires` de `.claude/chaine.json`, le refus d'éditer CODEOWNERS, et l'attente d'un propriétaire par le capitaine ; « Require review from Code Owners » ne se coche sur aucun dépôt. Restent `cheminsSensibles`, la contre-revue et `/security-review` sur ces chemins ({{ADR_CHAINE}}), et la protection des branches (`docs/agents/chaine-admin.md`). La suite de ce document est la décision retirée, telle qu'elle était.

## Contexte
````

#### R27 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:3`

Ancien :

````text
Branches de sujet : `{{ADR_SUJET}}`. CODEOWNERS : `{{ADR_CODEOWNERS}}`. Contrat du projet
````

Nouveau :

````text
Branches de sujet : `{{ADR_SUJET}}`. Contrat du projet
````

#### R28 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:85`

Le paragraphe du § 3 et la ligne vide qui le suit.

Bloc retiré : de la ligne qui commence par

````text
**Chemin sensible = relu par un humain, tenu par GitHub.**
````

jusqu'à la ligne, non comprise, qui commence par

````text
Taille : un jour au plus
````

Rien à la place.

#### R29 — `skills/chaine/chantier/SKILL.md:95`

Ancien :

````text
Le capitaine fusionne dès la CI verte, avant le réveil suivant. Sauf une PR qui touche un chemin possédé (`.github/CODEOWNERS`) : vers develop, elle attend l'approbation d'un propriétaire humain, et `file.sh` la montre « attend un propriétaire », puis « attend un humain » si GitHub a refusé sa fusion ; la vague peut s'y arrêter. Le conducteur le dit au produit (par l'architecte dans un programme) : il n'approuve rien lui-même. Pour un ticket `Label: contre-revue`
````

Nouveau :

````text
Le capitaine fusionne dès la CI verte, avant le réveil suivant. Pour un ticket `Label: contre-revue`
````

#### R30 — `README.md:79`

Ancien :

````text
une CI minimale, un `.github/CODEOWNERS` généré depuis les chemins sensibles, la méthode et quatre ADR |
````

Nouveau :

````text
une CI minimale, la méthode et trois ADR |
````

#### R31 — `README.md:150`

Ancien :

````text
labels, CI, CODEOWNERS et son gate, méthode, quatre ADR, fragments, liste admin
````

Nouveau :

````text
labels, CI, méthode, trois ADR, fragments, liste admin
````

### 3. La marche à suivre du retrait

#### N1 — `skills/chaine/socle-chaine-de-production/references/retrait-codeowners.md`, fichier nouveau

Fichier nouveau, mot pour mot :

````text
# Retirer CODEOWNERS d'un projet déjà posé

Un projet posé avec le plugin 7.13 à 7.15 porte un `.github/CODEOWNERS` généré, son générateur et son gate. Le produit les a retirés le 2026-11-18 : GitHub ne bloque aucune PR sur les chemins sensibles, et « Require review from Code Owners » ne se coche sur aucun dépôt. À faire une fois, dans une seule PR vers `develop` ; les points 1 à 3 dans le même tour, parce qu'entre deux le gate `check:codeowners` rougit.

1. **Le fichier.** `head -n 1 .github/CODEOWNERS` rend `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` : c'est la copie du générateur, `git rm .github/CODEOWNERS`. Toute autre première ligne : le fichier est celui du projet, le laisser et le dire à qui a lancé la session. Un `CODEOWNERS` à la racine ou sous `docs/` n'a jamais été généré : ne pas y toucher.
2. **Le générateur et son gate.** `git rm scripts/github/codeowners.mjs scripts/github/codeowners.test.mjs` ; retirer de `package.json` les scripts `codeowners` et `check:codeowners`, de `scripts/check.mjs` l'étape `check:codeowners`, et de tout script ou workflow du projet l'appel à `scripts/github/*.test.mjs` s'il n'y reste aucun banc.
3. **Le contrat.** Dans `.claude/chaine.json` : retirer la clé `proprietaires` et l'entrée `scripts/github/codeowners.mjs` de `gatesRapides`, reprendre le `$comment` de `references/chaine.json`. `cheminsSensibles` ne change pas.
4. **Les gardes et le capitaine.** Reposer `references/agent/*` (`SKILL.md`, étape 2, point 4) et les scripts du capitaine (étape 0 de `fusionner`, `/maj-skills:sujet poser`) : `regles.mjs` ne refuse plus l'édition de CODEOWNERS, la file n'a plus d'état « attend un propriétaire ».
5. **Les textes.** Retirer de `CLAUDE.md` la ligne « Chemin sensible = relu par un humain, tenu par GitHub » ; de `docs/agents/chaine-de-production.md`, le paragraphe du même nom et, dans son en-tête, « CODEOWNERS : » suivi de son ADR ; dans `docs/agents/chaine-admin.md`, reprendre la case « Protection de `develop` » de `references/admin.md` et remplacer la case « CODEOWNERS respecté » par sa case « Block force pushes » et le paragraphe qui la suit (les cases déjà cochées le restent).
6. **L'ADR.** L'ADR « CODEOWNERS » du projet garde son numéro et son texte : sa ligne `Statut` devient celle de `references/adr/ADR_ALL_ARC-N-codeowners.md`, et la section « Retrait » de ce gabarit s'y ajoute, placeholders substitués. Ce gabarit ne se pose plus dans un projet neuf.
7. **À l'admin.** Décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était : une session ne le peut pas.

Puis `pnpm check`. `git grep -il codeowners` ne rend plus que l'ADR, `docs/agents/chaine-admin.md` et `scripts/agent/regles.test.mjs` ; tout autre fichier est propre au projet : le dire à qui a lancé la session.
````

### 4. La version

#### V1 — `.claude-plugin/plugin.json:3`

Ancien :

````json
"version": "7.15.0",
````

Nouveau :

````json
"version": "7.16.0",
````

Le deuxième nombre de la version de `origin/main`, plus un, troisième à zéro (règle de repli : décision 9).

## Surfaces

| Surface | Preuve |
| --- | --- |
| CODEOWNERS n'est plus nommé dans le plugin, hors la liste fermée de la décision 11 ; le générateur et son banc n'existent plus ; le gabarit du contrat n'a plus de clé `proprietaires` ni de gate rapide sous `scripts/github/`, et garde `scripts/github/**` parmi ses chemins sensibles | `scripts/depot.test.mjs` « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » |
| le lecteur du banc reconnaît chaque forme retirée, et laisse `proprietaire.sh`, « session propriétaire » et l'attente d'un humain au plafond des renvois | `scripts/depot.test.mjs` « lecteur des mentions de CODEOWNERS : entrées piégées » |
| la marche à suivre retire `.github/CODEOWNERS` seulement s'il porte l'en-tête du générateur, donné mot pour mot ; le socle pose trois ADR ; l'ADR est marquée retirée, sa section « Retrait » en premier ; la liste de l'admin dit « sans « Require review from Code Owners » », et garde « Restrict deletions », « aucune liste de contournement » et « Block force pushes » | `scripts/depot.test.mjs` « le socle retire CODEOWNERS d'un projet déjà posé : le fichier seulement s'il porte l'en-tête du générateur, l'ADR marquée retirée, la règle de GitHub jamais cochée » |
| la garde de fichiers ne refuse plus l'édition de CODEOWNERS, et normalise toujours le chemin avant de juger le lockfile, un `.env`, une migration livrée | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « refusEdition normalise le chemin avant de juger : un détour (`//`, `/./`, `x/../`, `\\`) ne contourne aucun refus » |
| la file du capitaine n'a plus que ses états d'avant ; l'état `humain` du plafond des renvois est intact | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain, et ni --next ni --rouges ne la rendent », « renvois : seuls les commentaires du compte du capitaine comptent ; compte illisible, la PR attend un humain », « boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée », sans retouche |
| les scripts du capitaine sont revenus à leur contenu d'avant la PR 108 | `git diff c17f88b --stat -- $ONZE` ne rend rien |
| les bancs posés dans un projet tournent hors du plugin, sans `scripts/github/` | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » |
| `chaine-de-production.md`, le fragment de `CLAUDE.md`, `chantier/SKILL.md`, `fusionner/SKILL.md`, les deux `CONTENU.md`, `README.md` ne décrivent plus l'attente d'un propriétaire | « CODEOWNERS n'est plus nommé… » (aucun n'est dans sa liste fermée, sauf le `CONTENU.md` du socle, lu en contre-revue) |
| le retrait dans un projet : fichier généré retiré, fichier écrit à la main laissé | essai réel sur deux dépôts jouets (« Vérification ») |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Joué le 2026-11-18 sur un clone jetable de `4a45634`, sous Node 22.23, puis le clone retiré. Ce ticket a été relu par un script qui en tire chaque bloc « Ancien », « Nouveau », « Ligne retirée », « Bloc retiré », le fichier nouveau et le banc, joue les commandes du § 1 et applique le tout à une copie neuve : ce qui suit est le résultat de ce texte.

- Sur `4a45634` sans rien : `node --test` sur les quatre motifs de `pnpm test`, **738 sur 738**.
- Le banc du § 0 sur le texte de `4a45634` : 100 tests, les 3 rouges nommés au § 0.
- §§ 0 à 4 appliqués : **711 sur 711** (738 − 31 + 4). `git diff c17f88b --stat -- $ONZE` ne rend rien. `git diff 4a45634 --stat` : 27 fichiers, dont 2 supprimés et 1 nouveau, ceux de « Fichiers chauds ».
- `SKILL.md` du socle : 86 lignes (91 avant) ; `fusionner/SKILL.md` : 92 ; `chantier/SKILL.md` : 128, inchangé en nombre.
- **Mutations**, chacune jouée seule sur le texte corrigé, puis le texte remis ; chacune fait rougir au moins un test : `README.md` renomme `.github/CODEOWNERS` ; `posix.normalize` retiré de `refusEdition` ; un refus de CODEOWNERS remis dans `refusEdition` ; l'ADR remise à « accepté » ; `"proprietaires": []` remis dans `chaine.json` ; `scripts/github/**` retiré de `cheminsSensibles` ; l'en-tête du générateur changé dans la marche à suivre ; « attend un propriétaire » remis dans `file.sh` ; « **sans** « Require review from Code Owners » » changé en « avec » dans `admin.md`. Neuf sur neuf.
- **Essai réel du retrait**, sur deux dépôts jouets (`git init`). Le premier reçoit `codeowners.mjs` de `4a45634` et un contrat aux deux propriétaires fictifs ; `node scripts/github/codeowners.mjs --ecrire` écrit `.github/CODEOWNERS` ; `head -n 1 .github/CODEOWNERS` rend, au caractère près, la ligne du point 1 de la marche à suivre : `git rm` retire le fichier et le générateur. Le second porte un `.github/CODEOWNERS` écrit à la main (`# Les nôtres`) : la première ligne diffère, le fichier reste.

Pour la session :

1. Le § 0 : trois rouges. Les §§ 1 à 4, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` moins 27**.
2. `git diff origin/main --stat` ne montre que les 27 fichiers de « Fichiers chauds » ; `git diff c17f88b --stat -- $ONZE` ne rend rien ; `git grep -il 'codeowners' -- skills scripts README.md .claude-plugin` rend sept fichiers, ceux de la décision 11 ; `wc -l skills/chaine/socle-chaine-de-production/SKILL.md` : 86.
3. **L'essai réel du retrait**, rejoué par la session sur deux dépôts jouets, avec les mots de N1 : un fichier généré par `codeowners.mjs` de `origin/main` est retiré, un fichier écrit à la main reste. Le résultat va dans le corps de la PR.
4. Revue de ticket (ses trois axes), puis `/security-review` sur la branche ; leurs sections dans le corps de la PR.
5. La PR vise `main`, hors brouillon, **sans `à-fusionner`** (`Label: contre-revue`) ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Le texte du refus que rend GitHub** quand « Require review from Code Owners » est cochée n'a jamais été lu sur un vrai dépôt (la liste de l'admin du ticket 50 demandait de le noter « au premier dépôt posé ») : `refus_pour_revue` le devinait. Il sort ; un tel refus arrête désormais la boucle en sortie 5 (décision 6).
- **L'état du réglage sur les dépôts des projets** : ce ticket ne lit aucune protection de branche. Si la case a été cochée quelque part, seul un administrateur la décoche (N1, point 7).
- **Le script de contrôle de chaque projet** : la marche à suivre nomme `scripts/check.mjs`, celui du socle ; un projet qui en a un autre retire l'étape où elle est. L'un des deux projets concernés est dans ce cas.
- **Le banc** tient l'absence d'un mot, pas d'un comportement : une attente d'approbation réécrite sans aucun des mots de son lecteur passerait. Les scripts du capitaine sont tenus, eux, par l'égalité avec `c17f88b`.

## Hors périmètre

- **La garde qui prend la place** : la ligne `Sensibles:` du ticket, la demande d'accord dans la carte, les trois gardes mécaniques (`A-73` à `A-76`), et l'ADR « relecture indépendante et accord des fichiers sensibles » (`A-96`). Lots 2, 5 et 6 du chantier 3.
- **Le retrait dans les projets** : par leur architecte, avec la marche à suivre de ce ticket.
- **Les réglages GitHub** : aucune session ne les change.
- **Le relâchement de `Label: contre-revue`** : il reste exigé, et la contre-revue du conducteur reste (`chantier/SKILL.md:95`, moins ses deux phrases sur CODEOWNERS).
- **Les deux défauts de la chaîne relevés le 2026-11-18** (`sujet.sh rafraichir` donné au conducteur, une PR en retard dont seul un index est périmé) : ils ont leurs tickets.

## Comments

- 2026-11-18 — Rédigé sur `4a45634` (plugin 7.15.0, 738 tests) d'après `P-49`, `A-77` et le lot 1 de la spec du chantier 3. Inventaire refait par recherche (`codeowners`, `code owner`, `code_owner`, `proprietaires`, `propriétaire`, `proprietaire`, `attend un propriétaire`, `attend un humain`, `possédé`, `approbation`, sous une locale UTF-8), chaque occurrence lue. Joué sur un clone jetable : 711 tests, neuf mutations rouges, l'essai du retrait sur deux dépôts jouets. Choix du rédacteur, que la spec ne tranche pas : (1) l'ADR n'est plus posée dans un projet neuf, et le socle revient à trois ADR (décision 2) ; (2) `scripts/github/**` reste un chemin sensible (décision 3) ; (3) la normalisation du chemin reste dans `refusEdition` (décision 4) ; (4) le faux `gh` revient entier à son état d'avant le ticket 50 (décision 5) ; (5) le retrait dans un projet est une marche à suivre en référence, pas un script (décision 8) ; (6) le texte de la liste de l'admin (décision 7).

- 2026-11-18 — Architecte : ticket écrit et joué sur `origin/main` à `4a45634` (7.15.0). `main` est depuis à `1c4acb1` (7.17.0) et le programme « capitaine à jour et testé » modifie plusieurs fichiers de ce ticket (`passer.sh`, `boucle.sh`, `faux-gh.mjs`, `regles.mjs`, `chantier/SKILL.md`). **`needs-info` jusqu'au rejeu des blocs sur `main`**, une fois ses tickets chauds entrés : repères de ligne, compte de tests, numéro de version et note dans `NOTES-DE-VERSION.md` (fichier né en 7.16.0) sont à reprendre ; les décisions du ticket, elles, tiennent.
