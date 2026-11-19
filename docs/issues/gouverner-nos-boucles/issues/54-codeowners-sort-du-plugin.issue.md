# CODEOWNERS sort du plugin : GitHub ne bloque plus une PR sur les fichiers sensibles ; le générateur, son gate, la clé `proprietaires`, le refus d'édition et l'attente d'un propriétaire par le capitaine sont retirés

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — quatre-vingt-seize blocs donnés mot pour mot, appliqués par un script donné entier et vérifié par son empreinte (rien ne se recopie à la main), une note de version donnée mot pour mot ; le tout a été joué sur un clone neuf d'`origin/main` à `a018502` : @@SUITE_MODELE@@, quarante-quatre mutations rouges, l'essai du retrait sur deux dépôts jouets (voir « Vérification »). Rien à concevoir : la session applique, rejoue, et suit la règle de repli si `main` a bougé ; la revue passe `/security-review` (la garde de fichiers et les scripts du capitaine).
Blocked by: — (le ticket 56 est entré par la PR 136, `a018502` ; le ticket 57 n'est plus un préalable, `A-138` : celui des deux qui livre en second reprend `main` par un commit de fusion, et la règle de repli du § 6 nomme le conflit attendu)
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs` (supprimé), `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.test.mjs` (supprimé), `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-codeowners.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/socle-chaine-de-production/references/retrait-codeowners.md` (créé), `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/sujet/scripts/faux-gh.test.mjs`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `README.md`, `scripts/depot.test.mjs`, `scripts/poses.test.mjs`, `scripts/points-d-entree.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

Ce ticket réalise le lot 1 de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` : la décision `A-77`, voulue par la décision du produit `P-49`, avec les alignements `A-94` (le § 6 de `chantier/SKILL.md`) et `A-108` (le compte des clés du contrat, la version et la note).

**La décision du produit** (`P-49` de la carte « gouverner nos boucles », 2026-11-18, grilling du chantier 3, question `Q2`). Ses mots : « Q2: oui pas de blocage Github donc on peut dégager sur fichier CODEOWNERS nan ? ». La carte en tire : « Pas de blocage par GitHub sur les fichiers sensibles, et le fichier CODEOWNERS disparaît », « Le réglage « Require review from Code Owners » ne se coche sur aucun dépôt », et `P-49` remplace `P-41` (les propriétaires).

**Pourquoi.** Toutes les sessions écrivent sous le compte du produit, et GitHub refuse qu'un auteur approuve sa propre PR : avec CODEOWNERS, chaque PR sensible dépendait d'une seconde personne (spec, « Le problème »).

**`A-77`, mot pour mot** : « **CODEOWNERS sort du plugin.** Retirés : `scripts/github/codeowners.mjs` et son test, son gate et l'entrée de `gatesRapides`, la clé `proprietaires`, le refus d'éditer CODEOWNERS dans `regles.mjs`, les états « attend un propriétaire » et « attend un humain » qui en viennent (`fusionner/scripts/github.sh`, `file.sh`, `passer.sh`, `boucle.sh` et leurs tests), la case correspondante d'`admin.md` — ses sous-règles (pas de push forcé, pas de suppression de branche, aucune liste de contournement) restent, dans la protection de branche. **`proprietaire.sh` reste** : il retrouve la session auteur d'une PR. L'ADR « CODEOWNERS » est marquée remplacée. La repose retire `.github/CODEOWNERS` quand il porte l'en-tête du générateur. »

**Le fait, sur `origin/main` à `a018502`** (PR 136, plugin 7.31.1, 1 073 tests). Le ticket 50 (PR 108, plugin 7.13.0) a posé dans le plugin : un générateur de `.github/CODEOWNERS` et son gate, joué aussi en fin de tour ; la clé `proprietaires` du contrat ; le refus d'éditer CODEOWNERS dans la garde de fichiers ; deux états de la file du capitaine, « attend un propriétaire » et « attend un humain », avec la lecture des règles de la branche, des relecteurs demandés et des revues ; une ADR, une case de la liste de l'admin, une ligne dans la méthode et dans le fragment de `CLAUDE.md`. Depuis, vingt-six commits sont entrés dans `main` (`git rev-list --count 86daaee..a018502`), dont dix-huit sur les fichiers que les blocs touchent : ils ont déplacé presque toutes ses lignes, et changé ce que le capitaine fait d'un refus de fusion (« Où », « Ce que le rejeu a changé »). `git grep -il codeowners origin/main -- skills scripts README.md .claude-plugin` rend 24 fichiers ; deux autres ne nomment que l'état « attend un propriétaire » (`veille.test.mjs`) ou la marque du commentaire d'attente (`faux-gh.test.mjs`).

Quand le ticket est fait :

1. **Plus rien ne génère, ne compare ni ne garde CODEOWNERS** : le générateur, son banc, son gate rapide et le refus d'édition sont retirés ; le gabarit du contrat n'a plus de clé `proprietaires`.
2. **Le capitaine n'attend plus personne** : les états « attend un propriétaire » et « attend un humain » qui venaient de CODEOWNERS sortent de `file.sh`, `passer.sh`, `boucle.sh` et `github.sh`. L'état `humain` du plafond des renvois ne change pas d'une ligne.
3. **Un refus de fusion de GitHub faute de revue approuvée arrête la boucle**, comme tout refus durable (`passer.sh`, sortie 3) : il n'est plus ni attendu, ni commenté. Le skill dit au capitaine ce qu'il fait alors : il ne retire pas le label, n'écrit rien sur la PR, le dit à son lanceur avec le message exact, et un humain lève la règle du dépôt.
4. **Le socle ne pose plus rien de CODEOWNERS** dans un projet neuf : ni question, ni étape, ni ADR ; il pose trois ADR. Le point 4 ter de son étape 2 ne pose plus que le check `PR titre`.
5. **Un projet déjà posé sait s'en défaire** : une marche à suivre, lue depuis le skill, retire `.github/CODEOWNERS` quand il porte l'en-tête du générateur, et seulement alors.
6. **L'ADR « CODEOWNERS » reste, marquée retirée** par la décision du 2026-11-18.
7. **La liste de l'admin dit de ne pas cocher « Require review from Code Owners »**, tient « Required approvals » à 0, et garde, dans la protection de branche, ce qui ne tenait pas à CODEOWNERS : pas de push forcé, pas de suppression de branche, aucune liste de contournement.
8. **Un banc tient le retrait** : CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré, par des passages donnés mot pour mot ; le compte des clés que dit le `CONTENU.md` du socle est celui du gabarit, et le compte des ADR que le socle pose est celui de ses gabarits.
9. **Plus aucun texte ne donne la protection de GitHub pour frontière contre une PR hostile** : `lancement.md` et le `CONTENU.md` de `fusionner` disent, comme la liste de l'admin, ce que ces règles tiennent, et qu'aucune n'arrête une PR hostile venue d'un compte de confiance.

Ce ticket ne pose pas la garde qui prendra la place : l'accord du produit donné avant de toucher un fichier sensible (`P-47`, `P-48`) arrive avec les lots suivants. D'ici là, un chemin sensible reste tenu comme avant le ticket 50 : contre-revue du conducteur, `/security-review`, revue exigée par le capitaine.

## Où

Base : `origin/main` à `a018502` (PR 136, plugin 7.31.1, **1 073 tests**). Les numéros de ligne sont ceux de cette base : recalculés bloc par bloc le 2026-11-19, aucun n'a bougé depuis `a3c2a7c` (la PR 136 ne touche que `plugin.json`, `NOTES-DE-VERSION.md`, `scripts/depot.test.mjs` après sa ligne 907 et le point 6 de `chantier/SKILL.md`). Recherche, sous une locale UTF-8 : `codeowners`, `code owner`, `code_owner`, `proprietaires`, `propriétaire`, `proprietaire`, `attend un propriétaire`, `attend un humain`, `attente-revue`, `d'attente`, `possédé`, `approbation`, `approuv`, `relecteurs`, `equipes`, `revues`, `requested_`, `required_pull_request_reviews`, et le nom de chaque fonction, constante et réglage du ticket 50 ; chaque occurrence lue. Et, pour ce que CODEOWNERS garantissait sans être nommé (premier tour de relecture, constat 1) : `hostile`, `frontière`, `protection de`, `protection des branches`, `tenu par GitHub`, `GitHub tient`, `GitHub exige`, `GitHub bloque`, `relu par un humain`, `deux humains`, `seconde personne`, `Required approvals`, `non posé par défaut`, `détourn`, hors de `docs/` et de `NOTES-DE-VERSION.md` : deux phrases, celles des blocs R43 et R44, et aucune autre (décision 17).

### L'inventaire, fichier par fichier

Lignes qui nomment CODEOWNERS, les « Code Owners », la clé `proprietaires`, l'état « attend un propriétaire », « l'approbation d'un propriétaire », un « chemin possédé », « tenu par GitHub », la marque `attente-revue-capitaine` ou `attend_humain` (le lecteur du banc, décision 11) : **228 lignes dans 26 fichiers** hors de `docs/` avant le ticket, **82 lignes dans 8 fichiers** après, ceux de la liste fermée (46 dans le banc lui-même, 19 dans l'ADR, 10 dans la marche à suivre, 7 dans les cinq fichiers à passages).

| Fichier | Ce qu'il porte, à `a018502` | Blocs | Ce qu'il devient |
| --- | --- | --- | --- |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs` (147 lignes) | le générateur (`--ecrire`) et le gate (sans argument) | S1 | supprimé |
| `…/references/scripts/github/codeowners.test.mjs` (146 lignes, 10 tests) | son banc | S2 | supprimé |
| `scripts/points-d-entree.test.mjs:21` | l'entrée `codeowners` de `SCRIPTS` (six tests) | S3 | retirée |
| `…/references/agent/regles.mjs:41-49`, `:63-65` | `CODEOWNERS`, `RAISON_CODEOWNERS`, le refus dans `refusEdition` | S4, S5 | retirés ; la normalisation du chemin reste (décision 4) |
| `…/references/agent/regles.test.mjs:27-38` | le test du refus | B1 | remplacé par le test de la normalisation |
| `…/references/chaine.json:2`, `:4`, `:19-20` | le `$comment` (deux passages), `"proprietaires": []`, le gate rapide | S6 à S9 | retirés ; `scripts/github/**` reste un chemin sensible (décision 3), les descriptions de `preparerCapitaine` et de `fusionsSansEffet` restent |
| `skills/chaine/fusionner/scripts/github.sh:564-637` | `revue_proprietaires_exigee`, `proprietaires_de`, `demandes_jq`, `proprietaire_demande`, `attend_proprietaire`, `refus_pour_revue`, `MARQUE_ATTENTE`, `TEXTE_ATTENTE`, `attend_humain`, `MOTIF_PROPRIETAIRE` | S10 | les 74 lignes et la ligne vide qui les suit sortent |
| `skills/chaine/fusionner/scripts/file.sh:24-36`, `:82`, `:119`, `:123`, `:170-173`, `:182-189` | la description des deux états, le champ `demandes` lu sur chaque PR, la branche `attend_humain`, le bloc « Revue des propriétaires » | S11 à S16 | sortent |
| `skills/chaine/fusionner/scripts/passer.sh:56-64`, `:67-68`, `:124-126`, `:143-145`, `:393-394`, `:397-406`, `:408`, `:432` | les deux motifs de la sortie 7 et la sortie 3 du commentaire d'attente dans l'en-tête, le saut « attend un humain », le saut « attend un propriétaire », la lecture du refus faute de revue et son commentaire marqué, « ni pour la revue » dans le refus durable | S17 à S24 | sortent ; le refus faute de revue devient un refus durable (décision 6) |
| `skills/chaine/fusionner/scripts/boucle.sh:7-8`, `:18-19`, `:505` | l'en-tête de la sortie 7, « commentaire d'attente impossible à poser », le commentaire de la sortie 7 | S25 à S27 | reviennent à leur texte d'avant le ticket 50 |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs:1485-1686` | onze tests, leurs aides `attenteProprietaire`, `etats`, `commentaireAttente` et trois constantes | S28 | sortent |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs:2078`, `:2084`, `:2099-2101`, `:2129` | deux tests du refus durable, qui lisent « ni pour la revue » | B5 à B8 | lisent le nouveau message ; deux cas ajoutés : le refus faute de revue, sous deux textes ; une assertion ajoutée : après un refus durable, le worktree est revenu sur `origin/develop` |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs`, fin de fichier | — | B9 | un test de remplacement : la boucle saute une PR sortie en 7 et passe la suivante |
| `skills/chaine/fusionner/scripts/veille.test.mjs:231-238` | un test | S29 | sort |
| `skills/chaine/sujet/scripts/faux-gh.mjs:24-29`, `:31`, `:35`, `:172-173`, `:351-352`, `:370-395`, `:452-453` | les réglages `revueProprietaires`, `PR.relecteurs`, `PR.equipes`, `PR.approbationManquante`, `PR.revues`, la règle `pull_request`, la route `required_pull_request_reviews`, la route des revues, le refus 405 ; l'exemple de `commentairesRefuses` | S30 à S36 | sortent (décision 5) ; `commentairesRefuses` et les dates des commentaires restent |
| `skills/chaine/sujet/scripts/faux-gh.test.mjs:277-279` | l'exemple du test de `commentairesRefuses` : la marque `attente-revue-capitaine` | S37 | prend la marque du renvoi |
| `scripts/poses.test.mjs:6`, `:24-25`, `:28-29`, `:67`, `:88-107` | deux entrées de `FICHIERS_POSES`, trois commentaires, le test du banc posé avec un contrat | S38 à S42 | sortent ; les deux entrées du check `PR titre` restent |
| `skills/chaine/fusionner/SKILL.md:93`, `:89`, `:91` | le paragraphe « Une PR qui attend l'approbation d'un propriétaire » ; la liste des refus durables ; « Sans veille en cours » | R1, R2, R42 | le paragraphe sort ; « revue exigée » entre dans la liste ; un alinéa « Devant un refus durable de fusion » entre avant « Sans veille en cours » (décision 6) |
| `skills/chaine/fusionner/references/CONTENU.md:15`, `:19`, `:65` (trois passages), `:49` | « Attend un propriétaire », « Attend un humain » ; la liste des refus durables ; les tests décrits ; « la frontière… la protection des branches chez GitHub » | R3 à R7, R44 | sortent ; la liste et la description des tests suivent la décision 6 ; la phrase de la PR hostile dit ce qui reste vrai (décision 17) |
| `skills/chaine/architecte/references/lancement.md:62` | « la frontière reste la protection de GitHub recommandée dans… `admin.md` (« la frontière contre une PR hostile ») » | R43 | la même phrase, récrite (décision 17) |
| `…/references/fragments/claude-md-fusion.md:10` | la ligne « Chemin sensible = relu par un humain, tenu par GitHub » | R8 | sort |
| `skills/chaine/socle-chaine-de-production/SKILL.md:3`, `:10`, `:16`, `:26`, `:34`, `:38`, `:42` (trois passages), `:63`, `:74`, `:78`, `:89` | la description, le placeholder, la question 4, le point 4 ter, les quatre ADR, une commande de vérification, le message de commit, « ni propriétaires inventés », un anti-pattern | R9 à R21 | le point 4 ter garde le check `PR titre` (décision 13) ; `:16` reçoit le renvoi à la marche à suivre |
| `…/references/CONTENU.md:5` (quatre passages), `:13`, `:19-22`, `:45` (deux passages), `:49`, `:53` | « Huit clés », les propriétaires, « Une neuvième », `scripts/github/**`, le refus d'édition, la section « CODEOWNERS », quatre gabarits, la ligne du fragment, la règle de l'admin | R22 à R31 | « Sept clés » et « Une huitième » (décision 14) |
| `…/references/admin.md:6`, `:26-37` | le renvoi à la case, la case « CODEOWNERS respecté », ses neuf sous-points et le paragraphe « Le capitaine n'est pas bloqué » | R32 à R34 | décision 7 |
| `…/references/adr/ADR_ALL_ARC-N-codeowners.md:3`, `:7` | `Statut : **accepté**` | R35, R36 | marquée retirée, gardée (décision 2) |
| `…/references/docs-agents/chaine-de-production.md:3`, `:85` | « CODEOWNERS : `{{ADR_CODEOWNERS}}`. », le paragraphe du § 3 | R37, R38 | sortent |
| `skills/chaine/chantier/SKILL.md:95` | deux phrases du point 5 du § 6 : « Sauf une PR qui touche un chemin possédé… il n'approuve rien lui-même. » | R39 | sortent, elles seules (décision 15) |
| `README.md:81`, `:152` | « un `.github/CODEOWNERS` généré… quatre ADR », « CODEOWNERS et son gate… quatre ADR » | R40, R41 | trois ADR |
| `scripts/depot.test.mjs:222`, `:835-843` | un chemin d'exemple, le test « le dernier repli du banc de CODEOWNERS… » | B2, B3 | B4 ajoute quatre tests en fin de fichier |
| `…/references/retrait-codeowners.md` | — (absent) | N1 | la marche à suivre du retrait dans un projet |
| `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` | la version de `main` ; vingt-trois notes | § 4 | la version suivante de `main`, sa note en tête |

### Ce que le rejeu a changé à l'inventaire du 2026-11-18

L'inventaire d'origine valait à `4a45634` (7.15.0, 738 tests).

**Disparu.**

- **Le patch inverse de la PR 108.** Il ramenait onze fichiers à leur contenu de `c17f88b` en trois commandes. Au rejeu sur `a3c2a7c`, `git diff --stat 86daaee a3c2a7c` nommait ces onze fichiers, tous (2 369 lignes ajoutées, 416 retirées) : le patch ne s'applique plus à aucun. Le retrait est donné bloc par bloc.
- **« Un refus de fusion redevient une sortie 5 »** (décision 6 d'origine). Sur `main`, `passer.sh` classe un refus de fusion : branche bougée ou panne en 5, tout autre refus en 3 après avoir rejoué la règle d'ascendance (ticket 9 de l'autre programme, sa décision `A-51`). La décision 6 est récrite.
- **« Le commentaire d'attente impossible à poser sort en 5 »** : c'est une sortie 3 sur `main` (`passer.sh:63-64`, `:404`). Elle sort avec le reste.
- **« Le faux `gh` revient entier à son état d'avant le ticket 50 »** (décision 5 d'origine) : `commentairesRefuses` est lu par `github.test.mjs:445`, `:451` (le verrou du passage, ticket 4 de l'autre programme), et les dates des commentaires par ce même verrou. La décision 5 est récrite.
- **Deux textes d'origine** : « Sept clés, et rien d'autre, » (`CONTENU.md` du socle : « Huit clés » sur `main`) et « c'est le `strict: true` dont dépend le capitaine » (`admin.md:6`, récrit par la 7.16.0).

**Nouveau.**

- `skills/chaine/sujet/scripts/faux-gh.test.mjs` (né avec le ticket 4 de l'autre programme) nomme la marque `attente-revue-capitaine` : bloc S37.
- `passer.sh:67-68`, `:408`, `:432` et `fusionner.test.mjs:2078`, `:2129` disent « ni pour la revue » d'un refus durable : blocs S18, S23, S24, B5, B7. Un cas de test neuf prouve ce que devient un refus faute de revue : B6.
- `boucle.sh:18-19` (« commentaire d'attente impossible à poser »), `fusionner/SKILL.md:89` et `fusionner/references/CONTENU.md:19` (la liste des refus durables), `CONTENU.md:65` (« le commentaire d'attente impossible en 3 ») : blocs S26, R2, R4, R7.
- Le point 4 ter du socle (`SKILL.md:38`) et `FICHIERS_POSES` (`scripts/poses.test.mjs:26-31`) portent aussi le check `PR titre` (ticket 16 de l'autre programme) : ils ne reviennent pas à leur forme d'avant, ils perdent leur moitié CODEOWNERS (R14, S39 à S41). `node --test scripts/github/*.test.mjs` reste à l'étape 3 du socle.
- Le `$comment` de `chaine.json` décrit deux clés entrées depuis, `preparerCapitaine` et `fusionsSansEffet`, après `proprietaires` : S7 ne retire que la sienne. Le `CONTENU.md` du socle dit « Huit clés » et « Une neuvième » : R22, R24.
- `NOTES-DE-VERSION.md` (né en 7.16.0) : la note du § 4. Sa note 7.24.0 nomme « un commentaire d'attente d'un propriétaire » : c'est de l'histoire, elle reste.
- `chantier/SKILL.md:95` porte deux règles depuis la 7.16.0 (`A-94`) : R39 se resserre sur deux phrases.

**Bougé.** Aux mêmes lignes qu'à `4a45634`, texte inchangé : `regles.mjs:41-49` et `:63-65`, `regles.test.mjs:27-38`, `scripts/depot.test.mjs:222`, `chantier/SKILL.md:95`, le fragment `:10`, `chaine-de-production.md:3` et `:85`, `admin.md:26-37`, et tous les repères du `SKILL.md` du socle. Déplacés : `points-d-entree.test.mjs:20` → `:21` ; `depot.test.mjs:734-743` → `:835-843` ; `README.md:79`, `:150` → `:81`, `:152` ; `CONTENU.md` du socle `:41`, `:45`, `:49` → `:45`, `:49`, `:53` ; `chaine.json:19` → `:20` ; `fusionner/SKILL.md:64` → `:93` ; `fusionner/references/CONTENU.md:13`, `:51` → `:15`, `:65` ; `github.sh:220-294` → `:564-637` ; `fusionner.test.mjs:1430-1630` → `:1485-1686` ; `veille.test.mjs:165-173` → `:231-238` ; `file.sh`, `passer.sh`, `boucle.sh`, `faux-gh.mjs` et `poses.test.mjs` partout.

### « Attend un humain » : deux sens

Le même mot dit deux choses sur `origin/main`. **Le plafond des renvois** (ticket 7, `plafonds.renvoisParPR`) : une PR renvoyée trois fois prend l'état `humain`. **L'attente d'une approbation** (ticket 50) : une PR dont GitHub a refusé la fusion faute de revue prend l'état `attend un humain`. Seul le second sort.

| Fichier | Plafond des renvois : gardé, sans retouche | Approbation : retiré |
| --- | --- | --- |
| `fusionner/scripts/github.sh` | `:21`, `:27`, `:34` (`renvois_de`) | `:610-636` (S10) |
| `fusionner/scripts/file.sh` | `:23`, `:37-39` (l'état `humain`), `:75`, `:168-169` | `:31-36`, `:170-173` (S11, S15) |
| `fusionner/scripts/passer.sh` | — | `:58-59`, `:124-126`, `:400` (S17, S19, S22) |
| `fusionner/scripts/renvoyer.sh` | `:25`, `:40` | — |
| `fusionner/scripts/fusionner.test.mjs` | `:344` à `:511`, `:981`, `:1034` (renvois, gel) | `:1489` à `:1668` (S28) |
| `fusionner/SKILL.md` | `:99` | `:93` (R1) |
| `fusionner/references/CONTENU.md` | `:41` | `:15`, `:65` (R3, R5) |
| `chantier/SKILL.md` | — | `:95` (R39) |
| `socle…/references/admin.md` | — | `:37` (R34) |
| `socle…/references/chaine.json`, `CONTENU.md`, `docs-agents/chaine-de-production.md`, `README.md:88` | « en attente d'un humain », « attend un humain » au plafond | — |

### Gardé tel quel, après lecture

- **`skills/chaine/fusionner/scripts/proprietaire.sh`** (19 lignes) : il rend le worktree d'une branche, pour retrouver la session qui a écrit une PR. Aucun lien avec CODEOWNERS (`A-77` : « `proprietaire.sh` reste »). Restent avec lui « worktree propriétaire » et « session propriétaire » dans `renvoyer.sh`, `passer.sh:339`, `sujet.sh`, `fusionner/SKILL.md`, `fusionner/references/CONTENU.md:39-41`, `sujet/SKILL.md:34`, `sujet/scripts/depot-jouet.mjs:101`, `README.md:169`, `NOTES-DE-VERSION.md:19`.
- **`…/references/agent/garde-github.mjs:51`** (« Un nom de dépôt ou de propriétaire ») : le propriétaire d'un dépôt GitHub.
- **Le rôle « propriétaire » de PostgreSQL** et la « ressource possédée » dans `skills/backend/socle-nest-hexagonal/`, `skills/monorepo/socle-monorepo/references/methode/pare-feu-ci.md:34` et `…/tickets/2-hebergement-et-trust-proxy.issue.md:23`.
- **`checks_exiges`** (`github.sh:485`) et sa lecture de `rules/branches/develop` : les checks exigés, pas la revue.
- **`…/references/scripts/github/develop.sh`, `develop.test.mjs`, `pr-titre.mjs`, `pr-titre.test.mjs`**, `…/references/labels.sh` : ce que `scripts/github/` garde.
- **`cheminsSensibles` du gabarit** (`chaine.json:3`), `scripts/github/**` compris (décision 3).
- **Le faux GitHub** : `commentairesRefuses`, les dates et les ids des commentaires, `PR.refusFusion`, `protectionClassique` (lue par `checks_exiges`).
- **Les notes de version déjà publiées** (`NOTES-DE-VERSION.md`) et **tout `docs/`** : les tickets 39 et 50 de ce programme, le ticket 16 de l'autre, la carte et la spec nomment CODEOWNERS ; c'est l'histoire des décisions, elle ne se récrit pas. Le banc ne lit ni l'un ni l'autre.
- **Le texte de l'ADR « CODEOWNERS »** sous sa section « Retrait » : la décision retirée, telle qu'elle était, « attend un propriétaire » et « attend un humain » compris.

### Les tests retirés, ajoutés, modifiés

31 tests sortent, 6 entrent : 1 073 − 31 + 6 = **1 048**. Aucun n'est retiré pour verdir : chacun prouvait une chose qui disparaît. Un seul prouvait aussi une chose qui reste, la boucle qui saute une PR sortie en 7 et fait passer la suivante : un test de remplacement la reprend (B9).

| Tests | Ce qu'ils prouvaient | Ce qu'ils deviennent |
| --- | --- | --- |
| `codeowners.test.mjs`, 10 tests | la génération, les motifs refusés, le gate | retirés avec le script (S2) ; « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » prouve que ni le script ni ses commandes n'existent plus |
| `regles.test.mjs` « refusEdition refuse CODEOWNERS à ses trois places, toute casse : modifier chaine.json, puis régénérer » | le refus, sur douze chemins normalisés | remplacé (B1) par « refusEdition normalise le chemin avant de juger : un détour (`//`, `/./`, `x/../`, `\\`) ne contourne aucun refus » : la normalisation gardée, prouvée sur le lockfile, un `.env` et une migration livrée, et l'édition de CODEOWNERS que plus rien ne refuse |
| `fusionner.test.mjs`, 11 tests (S28) : « file.sh : une PR vers develop qui attend un propriétaire se lit « attend un propriétaire »… », « file.sh : seul un propriétaire du CODEOWNERS de la base fait attendre… », « file.sh : CODEOWNERS lu comme GitHub (racine, puis docs/)… », « file.sh : approuvée (relecteurs retirés par GitHub), la PR revient prête… », « file.sh : une CI rouge reste « CI rouge » même quand la PR attend un propriétaire… », « passer.sh : une PR qui attend un propriétaire sort en 7 avant toute mise à jour… », « passer.sh : une fusion refusée faute d'approbation d'un propriétaire sort en 7, pas en 5… », « file.sh : « attend un humain » jusqu'à une approbation plus récente… », « boucle.sh : les PR qui attendent un propriétaire sont sautées sans renvoi ni relance… », « file.sh : une CI rouge prime sur « attend un humain »… », « passer.sh : commentaire d'attente impossible à poser après un refus de fusion pour revue : sortie 3 (arrêt), pas 7… » | les deux états, le commentaire marqué | retirés : les états et le commentaire n'existent plus. Ce que devient un refus faute de revue est prouvé par les deux cas ajoutés en B6. « boucle.sh : les PR qui attendent un propriétaire sont sautées sans renvoi ni relance… » prouvait aussi la branche `7)` de la boucle, qui sert encore au brouillon, à l'empilée, à la PR déjà bloquée et au passage d'un autre capitaine : B9 la reprend sur ce dernier cas. L'état `humain` du plafond reste prouvé, sans retouche, par « renvoyer.sh : au troisième renvoi, le commentaire dit que la PR attend un humain », « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain… », « renvois : seuls les commentaires du compte du capitaine comptent ; compte illisible, la PR attend un humain », « boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée », « file.sh : le gel prime sur « humain »… » |
| `veille.test.mjs` « PR qui attend un propriétaire : pas de relance ; approuvée (prête), boucle relancée » | la veille ne relance pas sur cet état | retiré (S29) : `file.sh` ne rend plus cet état |
| `poses.test.mjs` « le banc de CODEOWNERS posé passe dans un projet dont le contrat a ses propriétaires » | le banc posé hors du plugin, avec un contrat rempli | retiré (S42) : ce banc n'existe plus |
| `points-d-entree.test.mjs`, six « codeowners agit quand on le lance : … » | les six accès au script | retirés (S3) avec le script |
| `depot.test.mjs` « le dernier repli du banc de CODEOWNERS redit les cheminsSensibles du gabarit » | le repli du banc retiré | retiré (B3) |
| **Ajoutés** : `depot.test.mjs`, quatre tests (B4) ; `regles.test.mjs`, un test (B1) ; `fusionner.test.mjs`, un test (B9) | — | « lecteur des mentions de CODEOWNERS : entrées piégées », « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré », « le socle retire CODEOWNERS d'un projet déjà posé… », « sans CODEOWNERS : une fusion refusée faute de revue arrête la boucle et le capitaine le dit sans toucher à la PR ; aucune règle de GitHub n'est plus donnée pour frontière contre une PR hostile », « refusEdition normalise le chemin avant de juger… », « boucle.sh : une PR que passer.sh rend en 7 (en passage chez un autre capitaine) est sautée sans renvoi ni arrêt, la suivante passe » |
| **Modifié** : `fusionner.test.mjs` « passer.sh : une fusion refusée durablement par GitHub sort en 3 et la boucle s'arrête ; branche bougée ou panne : 5 » (B5, B6, B8) | le refus durable et son message | le message attendu change (décision 6) ; un quatorzième et un quinzième cas entrent : le refus faute de revue approuvée sort en 3, que GitHub dise « approving review » ou « code owner review » ; après chaque refus durable, le worktree du capitaine est lu : tête détachée sur `origin/develop`, branche `capitaine/33` supprimée (ce que `passer.sh` faisait déjà, sans test). Rien n'y est retiré |
| **Modifié** : `fusionner.test.mjs` « passer.sh : un refus de fusion 405 après un develop qui a bougé sort en 5 (course) ; le même 405 sans develop bougé, en 3 » (B7) | la course et le refus durable | le message attendu change, rien d'autre |
| **Modifié** : `faux-gh.test.mjs` « faux gh, commentairesRefuses : true refuse tout commentaire posé, une chaîne seulement ceux dont le corps y correspond » (S37) | la forme en chaîne du réglage | l'exemple prend la marque du renvoi ; ce qu'il prouve ne change pas |
| **Modifié** : `depot.test.mjs` « le gabarit .claude/chaine.json range les gardes de la chaîne parmi les chemins sensibles » (B2) | `scripts/github/**` est sensible | l'exemple devient `scripts/github/develop.sh` ; ce qu'il prouve ne change pas |
| **Modifié** : `poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (S40) | les bancs posés tournent hors du plugin | il pose deux fichiers de moins ; le banc du check `PR titre` y tourne toujours |

### Ce que voit un projet

Rien ne se met à jour seul : un projet garde sa copie des scripts posés, et une version publiée ne change rien chez qui ne repose pas.

- **Un projet qui n'a jamais reçu CODEOWNERS** (posé avant le plugin 7.13.0 et pas reposé depuis) : rien à retirer. À sa prochaine repose des scripts du capitaine, la file perd deux états qu'elle n'y affichait jamais.
- **Un projet qui l'a reçu** porte `.github/CODEOWNERS`, `scripts/github/codeowners.mjs` et son banc, les scripts `codeowners` et `check:codeowners` de `package.json`, une étape de son script de contrôle, la clé `proprietaires` et le gate rapide dans `.claude/chaine.json`, et l'ADR posée. **Aucun `poser` ne les retire** : reposer un skill copie ses fichiers, sans retirer ceux qu'une version antérieure a posés. Le retrait est le travail de l'architecte du projet, par la marche à suivre que ce ticket écrit (N1), dans une PR du projet.
- **Ce que la marche à suivre fait du fichier déjà posé** : elle le retire (`git rm .github/CODEOWNERS`) **si, et seulement si, sa première ligne est celle du générateur**, `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` ; toute autre première ligne, le fichier est celui du projet : il reste, et la session le dit à qui l'a lancée. Un `CODEOWNERS` à la racine ou sous `docs/` n'a jamais été généré : elle n'y touche pas.
- **Une repose partielle ne casse rien, mais change le capitaine.** Un projet qui repose `scripts/agent/` et les scripts du capitaine sans suivre le reste garde un gate `check:codeowners` vert (son contrat porte encore `proprietaires`, son générateur est encore là) ; sa garde ne refuse plus l'édition de CODEOWNERS, que le gate rattrape. Mais son capitaine n'attend plus : sur un dépôt où « Require review from Code Owners » est cochée, il s'arrête (`ARRÊT`, sortie 3) au premier refus de fusion d'une PR qui touche un chemin possédé, et de nouveau à chaque relance tant que la règle reste cochée (décision 6). La note de version le dit, et fait décocher la règle avant de relancer le capitaine.
- **Relevé du 2026-11-19**, sur les clones locaux de trois projets posés (leur `origin/develop` tel qu'il y était, sans le rafraîchir) : deux portent `.github/CODEOWNERS`, dont la première ligne est celle du générateur au caractère près ; le troisième, posé avant la 7.13.0, n'a rien de tout cela. Ce ticket ne touche aucun projet.

## Décisions

Les décisions 1 à 4, 7, 8 et 10 sont celles du ticket d'origine, relues sur `main` : elles tiennent. Les décisions 5, 6, 9 et 11 sont récrites sur ce que `main` est devenu ; les décisions 12 à 16 sont nouvelles. L'architecte a accepté les décisions 5, 6, 8, 9, 10 et 11 (`A-138`). Le premier tour de relecture (2026-11-19) a fait compléter les décisions 6, 7, 9, 11, 12 et 15, sans en renverser aucune ; la décision 17 en vient.

1. **Tout `A-77`**, sans rien y ajouter : sortent le générateur et son test, son gate et l'entrée de `gatesRapides`, la clé `proprietaires`, le refus d'éditer CODEOWNERS, les états « attend un propriétaire » et « attend un humain » qui en viennent (`github.sh`, `file.sh`, `passer.sh`, `boucle.sh` et leurs tests), la case de la liste de l'admin. `proprietaire.sh` reste.
2. **L'ADR « CODEOWNERS » du socle est marquée « retirée par la décision `P-49` du 2026-11-18 », pas supprimée** (R35, R36) : sa ligne `Statut` le dit, une section « Retrait » dit ce qui sort et ce qui reste, la suite du texte ne change pas. **Elle ne se pose plus dans un projet neuf** : le socle pose trois ADR, et le placeholder `{{ADR_CODEOWNERS}}` disparaît de tous les fichiers posés. Le gabarit reste dans `references/adr/` pour les projets qui l'ont reçu : la marche à suivre y prend la ligne `Statut` et la section « Retrait ». Elle n'est pas dite « remplacée » (le mot d'`A-77`) : l'ADR qui la remplacera s'écrit avec la bascule (`A-96`), pas avant ; la ligne du lot 1 de la spec dit « marquée retirée par `P-49` ».
3. **`scripts/github/**` reste dans `cheminsSensibles`** du gabarit. Le ticket 50 l'y a fait entrer pour le générateur ; `develop.sh` (qui crée `develop` sur le distant), `labels.sh` (qui écrit les labels du dépôt) et, depuis la 7.28.0, le check `PR titre` y vivent, et retirer un chemin sensible n'est pas dans `A-77`.
4. **La normalisation du chemin reste dans `refusEdition`** (`posix.normalize`, `regles.mjs:64`). Le ticket 50 l'a écrite pour CODEOWNERS, mais elle ferme un contournement des autres refus : sans elle, `apps/../pnpm-lock.yaml` et `apps/web/../api/src/db/migrations/<livrée>.ts` passent la garde. Son test change d'objet (B1).
5. **Le faux `gh` ne garde que ce qu'un banc lit encore.** Sortent les réglages que seuls les onze tests retirés lisaient : `revueProprietaires`, `PR.relecteurs`, `PR.equipes`, `PR.approbationManquante`, `PR.revues` et la route `pulls/<n>/reviews`, la règle `pull_request` et la route `required_pull_request_reviews` ; la route des règles redevient `rules/branches/develop`, la seule que `checks_exiges` lit. **Restent**, parce que d'autres bancs les lisent depuis : `commentairesRefuses` (`github.test.mjs`, et son propre test dans `faux-gh.test.mjs`), les dates et les ids des commentaires (le verrou du passage), `PR.refusFusion`. Le lot 5a ajoutera au faux ce dont il a besoin, avec son test (`A-108`).
6. **Un refus de fusion de GitHub faute de revue approuvée est un refus durable : sortie 3, la boucle s'arrête.** Sur `main`, `passer.sh` classe déjà un refus de fusion : branche bougée ou panne en 5 (pause, puis reprise) ; tout autre refus en 3, après avoir relu develop et rejoué la règle d'ascendance (décision `A-51` de l'autre programme). Le ticket 50 avait glissé devant ce classement une branche propre à la revue (commentaire marqué, sortie 7). Elle sort (S21, S22), et le refus faute de revue tombe dans le classement commun, sans une ligne de code nouvelle : `passer.sh` ne lit plus le texte du refus pour y chercher une revue. Le message de la sortie 3 ne peut plus dire « ni pour la revue » : il dit « pour une autre raison qu'une branche qui a bougé (droit du compte, règle du dépôt, revue exigée, méthode de fusion) » (S18, S23, S24), et les deux tests qui le lisent suivent (B5, B7). Un cas de plus le prouve (B6). C'est le comportement voulu sur un dépôt où « Require review from Code Owners » serait restée cochée : la boucle s'arrête, un humain lit la cause et décoche la règle (N1, point 7). **Ce que l'arrêt coûte, et ce que le capitaine en fait** (premier tour de relecture, constat 9 ; l'architecte a maintenu la décision). Joué sur un dépôt jouet, trois PR dans la file : celle placée avant la PR refusée passe ; la boucle s'arrête sur la PR refusée à chacun de trois lancements, un essai de fusion par lancement, sans nouvelle mise à jour ni CI une fois la PR à jour ; la PR placée après elle ne passe pas ; la PR refusée garde `à-fusionner`, et rien n'est écrit sur elle hors le commentaire de passage. Là où le ticket 50 sautait cette PR (sortie 7) et laissait passer les autres, une PR refusée arrête donc celles qui la suivent, tant que la cause demeure. Le capitaine ne retire pas le label, n'écrit rien sur la PR, le dit à son lanceur (au produit hors programme) avec le message exact de GitHub, et un humain lève la règle du dépôt : `fusionner/SKILL.md` le dit là où le capitaine lit ses sorties (R42), la marche à suivre aussi (N1, point 7), et un test tient ces phrases (B4, quatrième test). **Le code ne change pas** : aucun bloc ne touche à ce que `passer.sh` et `boucle.sh` font d'une sortie 3.
7. **La liste de l'admin** (R32 à R34) : la case « Protection de `develop` » dit de ne pas cocher « Require review from Code Owners », et reçoit « Restrict deletions », « aucune liste de contournement » et « pas de règle de PR sur `sujet/*` » ; une case « Block force pushes » prend la place de la case « CODEOWNERS respecté » ; un paragraphe dit ce que ces règles ne tiennent pas (une PR hostile). Sortent avec la case : les deux propriétaires humains, la PR d'essai, « Dismiss stale pull request approvals », l'approbation qui vaut pour le sommet approuvé, la lecture de CODEOWNERS sur la branche visée, la casse des motifs. **« Required approvals » à 0 reste**, dans la case « Protection de `develop` », avec sa raison nouvelle (premier tour de relecture, constat 8) : toutes les sessions publient sous un même compte, que GitHub ne laisse pas approuver ses propres PR ; une approbation exigée ferait refuser chaque fusion, et ce refus arrête désormais le capitaine (décision 6), là où le ticket 50 le faisait attendre. Ce que la 7.16.0 a écrit dans la même case sur l'ascendance n'est pas touché.
8. **Le retrait dans un projet est une marche à suivre, pas un script** : `references/retrait-codeowners.md`, lue depuis le skill et jamais posée, citée par `SKILL.md:16`. Elle retire `.github/CODEOWNERS` **seulement si sa première ligne est celle du générateur**, `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` (`codeowners.mjs:85`, avec `CONTRAT` de `:22`) ; toute autre première ligne, le fichier est celui du projet et reste. Elle ne touche pas un `CODEOWNERS` à la racine ou sous `docs/` : le générateur n'a jamais écrit que `.github/CODEOWNERS` (`codeowners.mjs:21`). Elle dit « depuis le plugin 7.13.0 », sans version de fin : le texte ne dépend pas de la version que ce ticket prendra.
9. **Version : mineure**, la suivante de `main` au moment de livrer (deuxième nombre de la version d'`origin/main` plus un, troisième à zéro), avec sa note en tête de `NOTES-DE-VERSION.md`, donnée mot pour mot au § 4. Raisons : (a) la règle du `README.md` réserve la majeure à « un skill existant [qui] change de contrat », et un projet qui ne repose rien ne voit rien changer ; un contrat qui porte encore `proprietaires` est lu sans erreur par les scripts de cette version (plus aucun ne lit la clé) ; (b) la spec réserve la **8.0.0** à la bascule (lot 6) et nomme ses deux régimes d'après elle (« régime 7 », « régime 8 ») : une majeure prise ici décalerait ces noms. Contre : la 7.0.0 était une majeure pour un script posé retiré (`plafonds.mjs`), et le capitaine reposé change de conduite devant un refus faute de revue ; c'est pourquoi la note le dit en gras. L'architecte a tranché : mineure (`A-138`). **Aucun numéro de version n'est écrit en dur**, ni dans un test, ni comme prérequis : deux PR ouvertes le 2026-11-19 prendront une version avant celle-ci, et un numéro en dur rougirait à la première fusion d'un autre (`A-139`). **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase, de push forcé ni d'`--amend`), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, remonte sa note en tête du fichier, rejoue la suite, puis vérifie (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`).
10. **`Label: contre-revue`** et **`/security-review`** : `regles.mjs` est la garde de fichiers, `github.sh`, `file.sh`, `passer.sh` et `boucle.sh` sont les scripts du capitaine, `chaine.json` est le contrat, tous chemins sensibles d'un projet posé. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `feat(chaine): CODEOWNERS sort du plugin, le capitaine n'attend plus de propriétaire (plugin <version>)` (cent caractères environ : le sujet du squash reste sous 120). Jamais `--no-verify`, jamais `git commit --amend`.
11. **Le banc tient le retrait par une liste fermée, et par des passages** (B4). Son lecteur reconnaît une ligne qui nomme CODEOWNERS, les « Code Owners », la clé `proprietaires`, l'état « attend un propriétaire », « l'approbation d'un propriétaire », un « chemin possédé », « tenu par GitHub » (le titre de la ligne retirée du fragment et de la méthode), la marque `attente-revue-capitaine` ou `attend_humain`. Dans tout fichier suivi de `README.md`, `.claude-plugin/`, `scripts/` et `skills/`, une telle ligne est une faute, hors huit fichiers. **Trois sont libres** : l'ADR (la décision retirée, telle qu'elle était), `retrait-codeowners.md` (dont les phrases sont exigées une à une par le troisième test), et le banc lui-même. **Cinq ne nomment CODEOWNERS que par des passages donnés mot pour mot, chacun présent une fois** : le `SKILL.md` du socle (le renvoi à la marche à suivre), son `CONTENU.md` (deux passages), `admin.md` (« **sans** « Require review from Code Owners »… »), `regles.test.mjs` (le commentaire et la boucle qui prouvent que plus rien ne refuse l'édition), et `fusionner.test.mjs` (le cas « Waiting on code owner review… » de B6, sans lequel un refus de ce texte pourrait de nouveau être sauté sans qu'aucun test rougisse). Ces passages retirés du texte, plus aucune ligne de ces cinq fichiers ne doit être reconnue : une mention ajoutée, sur une autre ligne ou sur la même, un passage remplacé ou répété, et le test rougit. Le premier tour de relecture avait essayé un plafond de lignes par fichier (1, 2, 1) : il laisse passer une ligne remplacée par une autre à nombre égal (le `CONTENU.md` du socle qui referait cocher la règle), que les passages arrêtent. Le lecteur a son test d'entrées piégées : `proprietaire.sh`, « session propriétaire », « la PR attend un humain », une « ressource possédée » ne sont pas des fautes ; les passages admis y sont éprouvés aussi. `NOTES-DE-VERSION.md` et `docs/` ne sont pas lus (l'histoire) ; la note du § 4 nomme donc CODEOWNERS librement. **Le même test tient deux comptes.** Celui des clés : la phrase « <N> clés, et rien d'autre, » du `CONTENU.md` du socle porte le nombre de clés du gabarit `chaine.json`, hors `$comment`, et « Une <N+1>ième, facultative et absente du gabarit : `preparerCapitaine` » le suit ; la partie 6c, qui ajoutera la clé `relecture`, verra ce test rougir tant qu'elle n'aura pas recompté (`A-108`). Celui des ADR : le nombre que disent la description et l'étape 8 du skill du socle, son `CONTENU.md` et le `README.md` (deux fois) est celui des gabarits de `references/adr/`, moins celui de CODEOWNERS ; le skill nomme chacun d'eux. La bascule, qui ajoutera une ADR (`A-96`), verra ce test rougir tant qu'elle n'aura pas recompté. **Un quatrième test tient les phrases de la décision 6 et de la décision 17**, là où le capitaine et l'architecte les lisent.
12. **Rien ne se recopie à la main.** Les blocs du § 1 au § 3 sont appliqués par le script du § 5, donné entier, que la session tire du ticket par ses bornes et vérifie par son empreinte. Tout ou rien : un bloc dont le texte « Ancien » manque ou paraît deux fois, un bloc retiré d'une autre taille ou d'une autre empreinte, **un bloc déjà appliqué** (son « Nouveau » est en place et son « Ancien » absent, ou le rejouer doublerait un texte), et rien n'est écrit, le bloc est nommé. **Toutes les vérifications passent avant la première écriture**, celles des suppressions comprises (fichier suivi par git, index non verrouillé) ; puis l'index de git d'abord, en une seule commande qui passe entière ou ne change rien, puis le disque (§ 5, « L'ordre des écritures »). C'est ce script, lancé sur ce fichier, qui a produit l'arbre vérifié (« Vérification »). Le patch inverse de la PR 108 ne s'applique plus (« Ce que le rejeu a changé »).
13. **Le point 4 ter du socle garde le check `PR titre`** (R14) : sa phrase, entrée avec le ticket 16 de l'autre programme, reste mot pour mot ; seul son début CODEOWNERS sort. `node --test scripts/github/*.test.mjs` reste à l'étape 3 : il joue le banc de ce check.
14. **Le compte des clés du contrat, refait sur `main`** (`A-108`) : le gabarit porte huit clés à `a018502` (`cheminsSensibles`, `proprietaires`, `criteresRevue`, `fillesParVague`, `plafonds`, `migrations`, `fusionsSansEffet`, `gatesRapides`), sept sans `proprietaires` ; `preparerCapitaine`, facultative et absente du gabarit, passe de neuvième à huitième (R22, R24). Si `main` a changé ce compte avant la livraison, le test de la décision 11 rougit et dit le nombre.
15. **Dans `chantier/SKILL.md`, deux phrases et elles seules** (R39, `A-94`) : « Sauf une PR qui touche un chemin possédé… la vague peut s'y arrêter. » et « Le conducteur le dit au produit… il n'approuve rien lui-même. ». Le bloc cite, avant et après, quatre mots de contexte que ni le ticket 56 (point 6, ligne voisine, entré par la PR 136) ni le ticket 57 (« Une sous-PR à la fois par sujet », plus loin dans le même alinéa) ne récrivent : le bloc s'applique donc sur un `main` où le 57 est entré. Mais l'alinéa tient sur une seule ligne : si le 57 entre pendant que la PR de ce ticket est ouverte, la fusion de `main` dans la branche y entre en conflit, les deux retouches portant sur des phrases disjointes de la même ligne. La règle de repli (§ 6) dit laquelle garder de chaque côté ; elle a été jouée sur un `main` simulé. `wc -l` du fichier ne change pas.
16. **L'histoire ne se récrit pas** : les notes de version déjà publiées et tout `docs/` (tickets, carte, spec, les deux programmes) gardent leurs mentions de CODEOWNERS.
17. **Plus aucun texte ne donne la protection de GitHub pour frontière contre une PR hostile** (R43, R44 ; premier tour de relecture, constat 1). Avant le ticket 50, la liste de l'admin portait une case « Recommandé, non posé par défaut : la frontière contre une PR hostile », faite de CODEOWNERS et de « Require review from Code Owners ». Deux textes y renvoient encore sans nommer CODEOWNERS : la « Limite » du capitaine d'un dépôt sans la chaîne (`architecte/references/lancement.md:62`) et « Ce que le capitaine exécute » (`fusionner/references/CONTENU.md:49`). Après R34, la liste de l'admin dit « Aucune n'arrête une PR hostile » : le plugin dirait les deux choses. Les deux phrases sont récrites sur ce qui reste vrai : ces règles tiennent l'entrée par une PR, les checks exigés sur une branche à jour, le refus des pushs forcés et des suppressions de branche, et aucune n'arrête ce qu'un compte de confiance fait entrer ; le capitaine sur un poste jetable, sans autre secret que son jeton, reste ce qui borne l'effet. **La famille est fermée par recherche** (les mots sont dans « Où ») : hors de `docs/` et de `NOTES-DE-VERSION.md`, aucune autre phrase ne s'appuie sur ce que CODEOWNERS garantissait ; l'ADR « CODEOWNERS » le dit (« seul GitHub tient »), sous sa section « Retrait », comme la décision retirée qu'elle est. Le quatrième test de B4 tient les trois phrases (celle de `admin.md` comprise), et refuse le mot « frontière » sur toute ligne de ces deux fichiers qui parle d'une PR hostile. **Ces phrases ne nomment pas la garde à venir** (l'accord du produit donné avant, la relecture indépendante) : elle n'existe pas encore dans le plugin, et un texte de skill ne décrit pas un régime qui n'est pas là (même raison que pour la liste de l'admin, « Remèdes écartés »). Elles ne nomment pas non plus CODEOWNERS : ni l'un ni l'autre fichier n'est dans la liste fermée de la décision 11.

### Remèdes écartés

- **Supprimer l'ADR** : une décision retirée se lit encore ; les projets qui l'ont posée gardent son numéro.
- **Garder l'attente d'un propriétaire pour un projet qui tiendrait CODEOWNERS à la main** : `P-49` dit qu'aucun dépôt ne coche le réglage ; un état que rien ne déclenche est du code mort dans les scripts du capitaine.
- **Sauter sans renvoi (sortie 7) une PR dont GitHub refuse la fusion faute de revue, sans le commentaire marqué** : elle repasserait à chaque tour, mise à jour et CI comprises ; c'est ce que le commentaire du ticket 50 empêchait. **La renvoyer à son auteur (sortie 4)** : l'auteur ne peut pas corriger une règle de GitHub. L'arrêt est la seule sortie qui amène un humain devant la cause.
- **Un script de retrait posé dans le projet** : il servirait une fois par projet, et vivrait ensuite dans `scripts/` sans objet ; la condition tient en une commande (`head -n 1`), que le banc tient mot pour mot.
- **Garder dans le faux `gh` les réglages de la revue**, pour les lots suivants : sans lecteur ni test, ils ne prouvent rien ; `A-108` fait ajouter au faux ce dont un lot a besoin, avec son test.
- **Retirer la normalisation avec le refus** : elle rouvrirait un contournement du lockfile et des migrations livrées (décision 4).
- **Écrire dans la liste de l'admin que l'accord du produit, donné avant, garde les fichiers sensibles** : cette garde n'existe pas encore dans le plugin ; le texte décrirait un régime qui n'est pas là.
- **Redonner les blocs en « Ancien, Nouveau » à recopier à la main**, comme le ticket d'origine : quatre-vingt-onze copies, dont des blocs de deux cents lignes, sur des fichiers que `main` déplace chaque jour ; une copie fautive ne se voit qu'à la suite rouge, ou pas du tout dans un commentaire.
- **Une majeure, 8.0.0** : réservée à la bascule (décision 9).
- **Faire retirer `à-fusionner` par le capitaine pour laisser passer les PR qui suivent la PR refusée** (proposé au premier tour de relecture) : écarté par l'architecte. Le capitaine ne change pas l'état d'une PR que son auteur ne peut pas corriger ; il dit la cause, et un humain la lève (décision 6).
- **Un plafond de lignes par fichier pour les trois textes du socle** (essayé au premier tour) : une ligne qui dit le retrait, remplacée par une ligne qui le défait, passe à nombre égal. Les passages mot pour mot l'arrêtent (décision 11).
- **Écrire le cas « code owner » de B6 en coupant le mot, pour que le lecteur ne le voie pas** : le banc se contournerait lui-même. Le fichier entre dans la liste fermée, pour cette ligne et elle seule.
- **`git rm` au fil des blocs, ou avant les écritures** (le script d'avant, et la retouche proposée au premier tour) : `git rm` puis `git add` sont deux écritures de l'index, et un verrou posé entre les deux laisserait l'arbre à moitié écrit. Une seule commande d'index, avant toute écriture sur le disque (§ 5).

## À faire, dans l'ordre

Chaque bloc porte un identifiant, le fichier qu'il touche et une opération, annoncée par une ligne de marque : « Ancien : » puis « Nouveau : » (un texte, présent une fois et une seule dans le fichier, remplacé par un autre) ; « Lignes retirées, entières : » (des lignes entières, présentes une fois, retirées avec leur fin de ligne) ; « Bloc retiré (N lignes, empreinte `…`), de la ligne qui commence par : » puis « jusqu'à la ligne, non comprise, qui commence par : », blancs de début mis à part, et parfois « À la place : » ; « Ajouté à la fin du fichier, après une ligne vide : » ; « Fichier nouveau, mot pour mot : » ; ou, dans le titre du bloc, « fichier supprimé ». L'empreinte d'un bloc est le début (douze caractères) du SHA-256 de ses lignes, fins de ligne comprises. **Les blocs ne se recopient pas à la main** : le script du § 5 les lit dans ce fichier et les applique, tout ou rien.

### § 0 — Partir de `main`, tirer le script du ticket

```bash
git fetch origin main && git switch -c <branche de travail> origin/main
git rev-parse --short HEAD          # a3c2a7c : ce ticket a été joué sur ce commit ; un autre commit, lire la règle de repli (§ 6)
pnpm install --frozen-lockfile && pnpm test 2>&1 | tail -n 12     # la suite de départ, verte : 1 072 tests sur a3c2a7c
```

Le ticket se lit sur la branche de documentation du programme, que nomme le prompt de lancement, sans y écrire. La session en prend une copie dans un dossier temporaire, et en tire le script du § 5 par ses bornes :

```bash
export TMPDIR="$(mktemp -d)"
TICKET="$TMPDIR/ticket-54.md"
git fetch origin <branche de documentation>
git show FETCH_HEAD:docs/issues/gouverner-nos-boucles/issues/54-codeowners-sort-du-plugin.issue.md > "$TICKET"
awk '/^<!-- début : appliquer.mjs -->$/ { f = 1; next } /^<!-- fin : appliquer.mjs -->$/ { f = 0 } f' "$TICKET" | grep -v '^````' > "$TMPDIR/appliquer.mjs"
sha256sum "$TMPDIR/appliquer.mjs"   # ba80c0dfc34fe6ff716219cc32244679d15940da152480ddf80f690f51e1ad61
```

L'empreinte vaut pour le script de ce ticket tel qu'il est écrit ici. Une autre empreinte : la copie du ticket n'est pas la bonne, ne rien appliquer et l'écrire à l'architecte.

### § 1 — Le banc d'abord, vu rouge

`node "$TMPDIR/appliquer.mjs" "$TICKET" B` applique les sept blocs qui suivent, et eux seuls.

#### B1 — `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`

Le test du refus de CODEOWNERS devient le test de ce qui reste de lui : la normalisation du chemin (décision 4), prouvée sur le lockfile, un `.env` et une migration livrée, et l'édition de CODEOWNERS que plus rien ne refuse.

Bloc retiré (13 lignes, empreinte `f32512b21641`), de la ligne qui commence par :

````js
test('refusEdition refuse CODEOWNERS à ses trois places
````

jusqu'à la ligne, non comprise, qui commence par :

````js
test('decisionCommande refuse le push forcé
````

À la place :

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

#### B2 — `scripts/depot.test.mjs`

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

#### B3 — `scripts/depot.test.mjs`

Le test « le dernier repli du banc de CODEOWNERS redit les cheminsSensibles du gabarit » lisait `codeowners.test.mjs`, qui disparaît : il sort avec lui.

Bloc retiré (10 lignes, empreinte `e88689266577`), de la ligne qui commence par :

````js
// Le banc de CODEOWNERS, posé sans contrat ni gabarit à côté
````

jusqu'à la ligne, non comprise, qui commence par :

````js
// Le skill de criticité (ticket 49)
````

#### B4 — `scripts/depot.test.mjs`

Quatre tests. `SKILLS_CHAINE`, `REF`, `LANCEMENT`, `lignes`, `titres`, `exiger`, `existsSync`, `readdirSync` et `execFileSync` existent déjà dans le fichier.

Ajouté à la fin du fichier, après une ligne vide :

````js
// CODEOWNERS sort du plugin (ticket 54 ; décision du produit du 2026-11-18 : pas de blocage par GitHub sur les
// fichiers sensibles, le fichier CODEOWNERS disparaît). Plus rien ne le génère, ne le garde ni ne l'attend : il
// n'est plus nommé que là où le plugin dit qu'il est retiré, et dans les bancs qui le prouvent. La liste est fermée :
// trois fichiers libres (`null` : l'ADR gardée pour mémoire, la marche à suivre qui le retire d'un projet déjà posé,
// ce banc) et cinq fichiers qui ne le nomment que par les passages donnés ici, mot pour mot, chacun une fois. Hors de
// ces passages, une mention y est une faute, comme dans tout autre fichier.
const SOCLE_CHAINE = `${SKILLS_CHAINE}/socle-chaine-de-production`;
const FUSIONNER = `${SKILLS_CHAINE}/fusionner`;
const ADR_CODEOWNERS = `${REF}/adr/ADR_ALL_ARC-N-codeowners.md`;
const RETRAIT_CODEOWNERS = `${REF}/retrait-codeowners.md`;
const DISENT_LE_RETRAIT = new Map([
  [ADR_CODEOWNERS, null],
  [RETRAIT_CODEOWNERS, null],
  ["scripts/depot.test.mjs", null],
  [`${SOCLE_CHAINE}/SKILL.md`, ["Un projet posé depuis le plugin 7.13.0 peut porter un `.github/CODEOWNERS` généré, que le produit a retiré : [`references/retrait-codeowners.md`](references/retrait-codeowners.md)."]],
  [
    `${REF}/CONTENU.md`,
    [
      "Un quatrième, `ADR_ALL_ARC-N-codeowners.md`, est marqué retiré (décision du produit du 2026-11-18) et ne se pose plus : il ne sert qu'à mettre à jour l'ADR d'un projet qui l'a reçue. `retrait-codeowners.md` est la marche à suivre de ce retrait, lue depuis le skill et jamais posée.",
      "« Require review from Code Owners » ne se coche pas",
    ],
  ],
  [`${REF}/admin.md`, ["**sans** « Require review from Code Owners » (le produit l'a retirée le 2026-11-18 : aucun `.github/CODEOWNERS` n'est posé, et GitHub ne bloque aucune PR sur les chemins sensibles)"]],
  [
    `${REF}/agent/regles.test.mjs`,
    [
      "// CODEOWNERS n'est plus généré ni gardé (décision du produit, 2026-11-18) : plus rien ne refuse son édition.",
      "for (const c of ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']) assert.equal(refusEdition(c, nouvelle), null, c);",
    ],
  ],
  [`${FUSIONNER}/scripts/fusionner.test.mjs`, ['["gh: Waiting on code owner review from @exemple. (HTTP 405)", 3, DURABLE],']],
]);
const DE_CODEOWNERS = /codeowners|code[ _]owners?|\bproprietaires\b|attend un propriétaire|approbation d['’]un propriétaire|chemin possédé|tenu par GitHub|attente-revue-capitaine|attend_humain/i;
const deCodeowners = (ligne) => DE_CODEOWNERS.test(ligne);
// Les mentions fautives d'un fichier : ses passages admis doivent y être, une fois chacun ; eux retirés, plus aucune
// ligne ne doit être reconnue par le lecteur.
const mentionsFautives = (fichier, texte, passages = []) => {
  const fautes = [];
  for (const p of passages) {
    const n = texte.split(p).length - 1;
    if (n !== 1) fautes.push(`${fichier} : passage présent ${n} fois, attendu une : ${p.slice(0, 70)}…`);
    texte = texte.split(p).join("");
  }
  lignes(texte).forEach((l, i) => deCodeowners(l) && fautes.push(`${fichier}:${i + 1}`));
  return fautes;
};

test("lecteur des mentions de CODEOWNERS : entrées piégées", () => {
  for (const l of [".github/CODEOWNERS", "pnpm codeowners", "« Require review from Code Owners »", "require_code_owner_review", "Waiting on code owner review", "`proprietaires` du contrat", "etat='attend un propriétaire'", "elle attend l'approbation d'un propriétaire humain", "attend l’approbation d’un propriétaire", "une PR qui touche un chemin possédé", "Chemin sensible = relu par un humain, tenu par GitHub", "<!-- attente-revue-capitaine -->", "elif attend_humain \"$n\"; then", "{{ADR_CODEOWNERS}}"])
    assert.equal(deCodeowners(l), true, l);
  // Ce qui reste : la session auteur d'une PR (proprietaire.sh), et l'attente d'un humain au plafond des renvois.
  for (const l of ["bash scripts/chaine/proprietaire.sh <branche>", "worktree propriétaire", "Prévenir la session propriétaire", "RENVOI 3 sur 3 : la PR attend un humain", "etat='humain'", "le rôle propriétaire ne sert qu'aux migrations", "une ressource possédée par un autre compte", "l'accord du produit, donné avant", "un manifeste validé par un humain"])
    assert.equal(deCodeowners(l), false, l);
  // Un fichier de la liste fermée : son passage admis passe, une fois ; hors de lui, ou répété, la mention est une faute.
  const admis = "**sans** « Require review from Code Owners »";
  assert.deepEqual(mentionsFautives("f", `a\n- ${admis} ; b\n`, [admis]), []);
  assert.deepEqual(mentionsFautives("f", `a\n- ${admis} ; puis cocher « Require review from Code Owners »\n`, [admis]), ["f:2"]);
  assert.deepEqual(mentionsFautives("f", `a\n- ${admis}\npnpm codeowners\n`, [admis]), ["f:3"]);
  assert.equal(mentionsFautives("f", `- ${admis}\n- ${admis}\n`, [admis]).length, 1, "passage répété");
  assert.equal(mentionsFautives("f", "a\n- avec « Require review from Code Owners »\n", [admis]).length, 2, "passage absent, mention hors de lui");
  assert.deepEqual(mentionsFautives("f", "a\n.github/CODEOWNERS\n"), ["f:2"]);
});

test("CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré", () => {
  const fichiers = execFileSync("git", ["ls-files", "--", "README.md", ".claude-plugin", "scripts", "skills"], { cwd: RACINE, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const fautes = fichiers.filter((f) => DISENT_LE_RETRAIT.get(f) !== null).flatMap((f) => mentionsFautives(f, readFileSync(join(RACINE, f), "utf8"), DISENT_LE_RETRAIT.get(f)));
  assert.deepEqual(fautes, [], `CODEOWNERS est retiré du plugin (décision du produit, 2026-11-18) : ${fautes.join(" ; ")}`);
  assert.ok(fichiers.length > 300 && [...DISENT_LE_RETRAIT.keys()].every((f) => fichiers.includes(f)), "le parcours lit le dépôt, et chaque fichier de la liste existe");
  for (const f of ["scripts/github/codeowners.mjs", "scripts/github/codeowners.test.mjs"]) assert.ok(!existsSync(join(RACINE, REF, f)), `${REF}/${f} : retiré`);
  const gabarit = JSON.parse(readFileSync(join(RACINE, REF, "chaine.json"), "utf8"));
  assert.equal("proprietaires" in gabarit, false, "le gabarit du contrat ne porte plus la clé `proprietaires`");
  assert.deepEqual(gabarit.gatesRapides.filter((g) => /github/.test(g)), [], "aucun gate rapide sous scripts/github/");
  assert.ok(gabarit.cheminsSensibles.includes("scripts/github/**"), "scripts/github/** reste un chemin sensible (develop.sh, labels.sh, le check PR titre)");
  // Le compte des clés que dit le CONTENU.md du socle est celui du gabarit (hors `$comment`), la facultative en plus.
  const NOMBRES = ["Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix", "Onze", "Douze"];
  const ORDINAUX = ["première", "deuxième", "troisième", "quatrième", "cinquième", "sixième", "septième", "huitième", "neuvième", "dixième", "onzième", "douzième", "treizième"];
  const cles = Object.keys(gabarit).filter((c) => c !== "$comment").length;
  exiger(`${REF}/CONTENU.md`, [`${NOMBRES[cles - 1]} clés, et rien d'autre,`, `Une ${ORDINAUX[cles]}, facultative et absente du gabarit : \`preparerCapitaine\``]);
  // Le compte des ADR que le socle pose est celui des gabarits de references/adr/, moins celui de CODEOWNERS, gardé
  // pour mémoire : le skill, son CONTENU.md et le README disent ce nombre, et le skill nomme chaque gabarit posé.
  const poses = readdirSync(join(RACINE, REF, "adr")).filter((f) => `${REF}/adr/${f}` !== ADR_CODEOWNERS);
  const combien = NOMBRES[poses.length - 1];
  exiger(`${SOCLE_CHAINE}/SKILL.md`, [`la méthode docs/agents/chaine-de-production.md et ${combien.toLowerCase()} ADR`, `\`node scripts/docs/next-id.mjs ADR ALL ARC\` ${combien.toLowerCase()} fois, de suite`, ...poses.map((f) => `${f}\``)]);
  exiger(`${REF}/CONTENU.md`, [`${combien} gabarits, numérotés à l'installation`]);
  exiger("README.md", [`une CI minimale, la méthode et ${combien.toLowerCase()} ADR |`, `labels, CI, méthode, ${combien.toLowerCase()} ADR, fragments, liste admin`]);
});

test("le socle retire CODEOWNERS d'un projet déjà posé : le fichier seulement s'il porte l'en-tête du générateur, l'ADR marquée retirée, la règle de GitHub jamais cochée", () => {
  exiger(RETRAIT_CODEOWNERS, [
    "Le produit les a retirés le 2026-11-18 : GitHub ne bloque aucune PR sur les chemins sensibles, et « Require review from Code Owners » ne se coche sur aucun dépôt.",
    "Aucun `poser` ne fait ce retrait : reposer un skill copie ses fichiers, sans retirer ceux qu'une version antérieure a posés.",
    "1. **Le fichier.** `head -n 1 .github/CODEOWNERS` rend `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` : c'est la copie du générateur, `git rm .github/CODEOWNERS`. Toute autre première ligne : le fichier est celui du projet, le laisser et le dire à qui a lancé la session. Un `CODEOWNERS` à la racine ou sous `docs/` n'a jamais été généré : ne pas y toucher.",
    "2. **Le générateur et son gate.** `git rm scripts/github/codeowners.mjs scripts/github/codeowners.test.mjs` ; retirer de `package.json` les scripts `codeowners` et `check:codeowners`, de `scripts/check.mjs` l'étape `check:codeowners`,",
    "3. **Le contrat.** Dans `.claude/chaine.json` : retirer la clé `proprietaires` et l'entrée `scripts/github/codeowners.mjs` de `gatesRapides`, reprendre le `$comment` de `references/chaine.json`. `cheminsSensibles` ne change pas.",
    "Relancer chaque capitaine une fois cette PR entrée dans `develop`.",
    "6. **L'ADR.** L'ADR « CODEOWNERS » du projet garde son numéro et son texte : sa ligne `Statut` devient celle de `references/adr/ADR_ALL_ARC-N-codeowners.md`, et la section « Retrait » de ce gabarit s'y ajoute, placeholders substitués. Ce gabarit ne se pose plus dans un projet neuf.",
    "7. **À l'admin.** Décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était, et tenir « Required approvals » à 0 : une session ne le peut pas.",
  ]);
  const adr = readFileSync(join(RACINE, ADR_CODEOWNERS), "utf8");
  assert.ok(lignes(adr).includes("- Statut : **retirée** par la décision du produit du 2026-11-18 (`P-49` de la carte « gouverner nos boucles » du plugin `maj-skills`) ; gardée pour mémoire"), `${ADR_CODEOWNERS} : la ligne Statut dit le retrait`);
  assert.ok(titres(adr).indexOf("## Retrait") === 0, `${ADR_CODEOWNERS} : la section « Retrait » vient en premier`);
  assert.equal(titres(adr).filter((t) => t === "## Retrait").length, 1, `${ADR_CODEOWNERS} : une seule section « Retrait »`);
  exiger(`${REF}/admin.md`, [
    "« Require a pull request before merging », **sans** « Require review from Code Owners » (le produit l'a retirée le 2026-11-18 : aucun `.github/CODEOWNERS` n'est posé, et GitHub ne bloque aucune PR sur les chemins sensibles)",
    "et avec **« Required approvals » à 0** (toutes les sessions publient sous un même compte, et GitHub ne laisse pas un auteur approuver sa propre PR : avec une approbation exigée, GitHub refuse la fusion de toute PR que personne d'autre n'a approuvée, et le capitaine s'arrête sur ce refus, `passer.sh` sortie 3)",
    "**« Restrict deletions »** ; « Do not allow bypassing the above settings », et **aucune liste de contournement** (« Bypass list » vide) : un administrateur qui contourne la règle la retire pour tous.",
    "Pas de règle de PR sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR : elle bloquerait la chaîne.",
    "- [ ] **« Block force pushes »** sur toutes les branches (Rulesets, cible `~ALL`), sans liste de contournement.",
  ]);
});

test("sans CODEOWNERS : une fusion refusée faute de revue arrête la boucle et le capitaine le dit sans toucher à la PR ; aucune règle de GitHub n'est plus donnée pour frontière contre une PR hostile", () => {
  // Ce que devient un refus de fusion faute de revue (décision 6 du ticket 54) : un refus durable, et ce que le
  // capitaine en fait, là où il le lit.
  exiger(`${FUSIONNER}/SKILL.md`, [
    "une fusion refusée durablement par GitHub (droit, règle du dépôt, revue exigée, méthode interdite) sort en 3 et l'arrête",
    "**Devant un refus durable de fusion** (`ARRÊT`, `passer.sh` sortie 3, « fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé » : droit du compte, règle du dépôt, revue exigée, méthode de fusion interdite), le capitaine n'y peut rien.",
    "La PR garde `à-fusionner` et sa place dans la file : tant que la cause demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et aucune PR vers develop placée après elle ne passe.",
    "Il ne retire pas ce label, n'écrit rien sur la PR hors le commentaire de passage que `passer.sh` pose et termine, et ne la renvoie pas (son auteur n'y peut rien) ; il le dit à son lanceur (au produit hors programme), avec le message exact de GitHub. Un humain lève la règle du dépôt (ou rend son droit au compte), puis le capitaine relance sa veille.",
  ]);
  exiger(`${FUSIONNER}/references/CONTENU.md`, ["tout autre refus (droit du compte, règle du dépôt, revue exigée, méthode de fusion interdite) est durable et sort en 3", "une fusion refusée durablement par GitHub en 3, faute de revue approuvée comprise (la boucle s'arrête),"]);
  exiger(RETRAIT_CODEOWNERS, [
    "il s'arrête sur ce refus (`passer.sh`, sortie 3, `ARRÊT`), et le dit.",
    "La PR refusée garde `à-fusionner` et sa place dans la file : tant que la cause demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et aucune PR vers `develop` placée après elle ne passe.",
    "Le capitaine ne retire pas ce label et n'écrit rien sur la PR, hors le commentaire de passage que `passer.sh` pose et termine ; il le dit à son lanceur (au produit hors programme), avec le message exact de GitHub, et un humain lève la règle du dépôt.",
  ]);
  // Une PR hostile : la protection des branches n'est plus donnée pour frontière, nulle part. Trois textes le disent.
  exiger(`${REF}/admin.md`, ["Ce que ces règles ne tiennent pas : toutes les sessions écrivent sous le même compte, la revue exigée par le capitaine est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`). Aucune n'arrête une PR hostile."]);
  exiger(LANCEMENT, [
    "Ni le commentaire ni le label ne tiennent contre une PR hostile venue d'un de ces comptes, et la protection des branches de GitHub non plus : les règles de `socle-chaine-de-production/references/admin.md` tiennent l'entrée par une PR, les checks exigés sur une branche à jour, le refus des pushs forcés et des suppressions de branche, et aucune n'arrête ce qu'un compte de confiance fait entrer (« Ce que ces règles ne tiennent pas »).",
  ]);
  exiger(`${FUSIONNER}/references/CONTENU.md`, [
    "Contre une PR hostile venue d'un compte de confiance, aucune garde ne l'arrête, ni dans la chaîne ni chez GitHub : la protection des branches (`admin.md` du socle) tient l'entrée par une PR, les checks exigés sur une branche à jour, le refus des pushs forcés et des suppressions de branche, pas ce qui entre (« Ce que ces règles ne tiennent pas »). Reste, pour borner ce qu'elle atteint, un capitaine sur un poste jetable, sans autre secret que son jeton GitHub.",
  ]);
  for (const f of [LANCEMENT, `${FUSIONNER}/references/CONTENU.md`])
    for (const l of lignes(readFileSync(join(RACINE, f), "utf8")).filter((x) => /PR hostile/.test(x))) assert.doesNotMatch(l, /frontière/i, `${f} : plus de « frontière » contre une PR hostile chez GitHub`);
});
````

#### B5 — `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Le test « passer.sh : une fusion refusée durablement par GitHub sort en 3 et la boucle s'arrête ; branche bougée ou panne : 5 » : le message du refus durable ne dit plus « ni pour la revue » (décision 6).

Ancien :

````js
  const DURABLE = /fusion refusée par GitHub, ni pour la revue ni pour une branche qui a bougé/;
````

Nouveau :

````js
  const DURABLE = /fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé \(droit du compte, règle du dépôt, revue exigée, méthode de fusion\)/;
````

#### B6 — `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Le même test reçoit deux cas : un refus de GitHub faute de revue approuvée, sous deux textes plausibles (une approbation exigée, la revue d'un propriétaire du code). Sur `main` ils sortent en 7, avec un commentaire d'attente ; ils deviennent des refus durables comme les autres. La ligne du second cas est la seule de ce fichier que le lecteur du banc reconnaît : elle est dans sa liste fermée, mot pour mot (B4, décision 11).

Ancien :

````js
    ["gh: HTTP 403", 3, DURABLE],
````

Nouveau :

````js
    ["gh: HTTP 403", 3, DURABLE],
    // Une revue exigée par une règle de GitHub n'est plus attendue (ticket 54) : un refus durable comme un autre, quel
    // que soit le texte du refus (une approbation exigée, la revue d'un propriétaire du code).
    ["gh: At least 1 approving review is required by reviewers with write access. (HTTP 405)", 3, DURABLE],
    ["gh: Waiting on code owner review from @exemple. (HTTP 405)", 3, DURABLE],
````

#### B7 — `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Le test « passer.sh : un refus de fusion 405 après un develop qui a bougé sort en 5 (course) ; le même 405 sans develop bougé, en 3 » lit le même message.

Ancien :

````js
  assert.match(durable.stdout, /fusion refusée par GitHub, ni pour la revue ni pour une branche qui a bougé/);
````

Nouveau :

````js
  assert.match(durable.stdout, /fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé/);
````

#### B8 — `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Le même test, dans sa boucle : après un refus durable (sortie 3), le worktree du capitaine est revenu sur `origin/develop`, tête détachée, et la branche de passage `capitaine/33` est supprimée. Aucun test ne le lisait : les deux lignes de `passer.sh` qui le font précèdent le message que S24 récrit (premier tour de relecture, mutation X8).

Ancien :

````js
    assert.match(r.stdout, motif, JSON.stringify(message));
    assert.equal(d.git("status", "--porcelain"), "");
  }
````

Nouveau :

````js
    assert.match(r.stdout, motif, JSON.stringify(message));
    assert.equal(d.git("status", "--porcelain"), "");
    // Après un refus durable, le capitaine ne reste pas sur sa branche de passage : tête détachée sur develop, branche supprimée.
    if (attendu === 3) assert.deepEqual([d.git("rev-parse", "--abbrev-ref", "HEAD"), d.git("rev-parse", "HEAD"), d.git("branch", "--list", "capitaine/33")], ["HEAD", d.git("rev-parse", "origin/develop"), ""], JSON.stringify(message));
  }
````

#### B9 — `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Un test de remplacement. Le banc « boucle.sh : les PR qui attendent un propriétaire sont sautées sans renvoi ni relance… », que S28 retire, était le seul à prouver aussi que la boucle saute une PR que `passer.sh` rend en 7 et fait passer la suivante : cette branche de `boucle.sh` sert encore au brouillon, à l'empilée, à la PR déjà bloquée et au passage d'un autre capitaine. Le cas est repris sur ce dernier, avec les aides `prVerrou` et `marqueDe` du fichier. Il est vert dès l'écriture : la boucle se conduit déjà ainsi sur `main`.

Ajouté à la fin du fichier, après une ligne vide :

````js
// La boucle saute une PR que passer.sh rend en 7 et fait passer la suivante. Le banc qui le prouvait est sorti avec
// l'attente d'une approbation (ticket 54) : le cas est repris ici sur le passage d'un autre capitaine.
test("boucle.sh : une PR que passer.sh rend en 7 (en passage chez un autre capitaine) est sautée sans renvoi ni arrêt, la suivante passe", () => {
  const { d, avant, sommet } = prVerrou();
  d.branche("docs/suivante", "origin/develop", { "docs/suivante.md": "s\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.publierChaine();
  const e = d.etat();
  e.pulls[0].commentaires = [marqueDe("capitaine-jordan")];
  e.pulls.push(pr(41, "docs/suivante"));
  d.github(e);
  const r = d.lancer(script("boucle.sh"));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#40\] sortie=7/);
  assert.match(r.stdout, /\[#41\] FUSIONNÉE/);
  assert.match(r.stdout, /FILE VIDE/);
  assert.doesNotMatch(r.stdout, /RENVOI|ARRÊT/);
  const pr40 = d.etat().pulls.find((p) => p.number === 40);
  assert.deepEqual([pr40.labels, pr40.merged_at ?? null, sommet()], [["à-fusionner"], null, avant], "#40 garde son label, n'est ni fusionnée ni poussée");
});
````

Après ces sept blocs, sur le texte d'`origin/main` à `a3c2a7c` : `node --test scripts/depot.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` rend **144 tests, 3 rouges** : « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » (171 lignes dans 20 fichiers), « le socle retire CODEOWNERS d'un projet déjà posé… », « refusEdition normalise le chemin avant de juger… » (sur sa dernière assertion : l'édition de CODEOWNERS est encore refusée). « lecteur des mentions de CODEOWNERS : entrées piégées » est vert dès l'écriture. Et `node --test --test-name-pattern='fusion refusée durablement|refus de fusion 405' skills/chaine/fusionner/scripts/fusionner.test.mjs` rend **2 rouges** : les deux tests du refus durable.

### § 2 — Les retraits : le générateur, la garde, le contrat, le capitaine et ses bancs

`node "$TMPDIR/appliquer.mjs" "$TICKET" S` applique les quarante-deux blocs qui suivent.

#### S1 — `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs` (fichier supprimé, 147 lignes, empreinte `8397aa4a4ed8`)

Le générateur et son gate. Le script le retire par `git rm`, pas par `rm` : le test « aucun script du plugin ne saute un hook git » de `scripts/depot.test.mjs` lit `git ls-files` et tombe sur un fichier suivi qui n'est plus sur le disque.

#### S2 — `skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.test.mjs` (fichier supprimé, 146 lignes, empreinte `fd167fc02e5a`)

Son banc, dix tests.

#### S3 — `scripts/points-d-entree.test.mjs`

L'entrée de `SCRIPTS` du générateur : ses six tests (« codeowners agit quand on le lance : … ») sortent avec lui.

Lignes retirées, entières :

````js
  { nom: "codeowners", fichier: "skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs", args: [], statut: 2, sortie: /codeowners : \.claude\/chaine\.json illisible/ },
````

#### S4 — `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`

Le motif et la raison du refus d'éditer CODEOWNERS.

Lignes retirées, entières :

````js
/**
 * CODEOWNERS, aux trois places où GitHub le lit (`.github/`, la racine, `docs/` ; la casse ignorée : un système de
 * fichiers insensible à la casse écrit `.GitHub/codeowners` au même endroit). Il se génère depuis `.claude/chaine.json`
 * (`scripts/github/codeowners.mjs`, ADR « CODEOWNERS ») : une seule source, que le gate `codeowners` compare.
 */
const CODEOWNERS = /^(\.github\/|docs\/)?codeowners$/i;
const RAISON_CODEOWNERS = (c) =>
  `${c} ne s'édite pas : il est généré depuis .claude/chaine.json. Modifier \`cheminsSensibles\` ou \`proprietaires\` dans .claude/chaine.json, puis régénérer avec « pnpm codeowners » (node scripts/github/codeowners.mjs --ecrire) ; le gate \`codeowners\` refuse tout écart (ADR « CODEOWNERS »).`;

````

#### S5 — `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`

Le refus sort de `refusEdition` ; la normalisation reste (décision 4), et `import { posix } from 'node:path';` avec elle.

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

#### S6 — `skills/chaine/socle-chaine-de-production/references/chaine.json`

Le `$comment` du gabarit : ce que `scripts/github/` porte encore.

Ancien :

````text
le générateur de CODEOWNERS et les scripts de `scripts/github/`,
````

Nouveau :

````text
les scripts de `scripts/github/` (création de `develop`, labels, check `PR titre`),
````

#### S7 — `skills/chaine/socle-chaine-de-production/references/chaine.json`

Le `$comment` : la description de la clé `proprietaires`. Celles de `preparerCapitaine` et de `fusionsSansEffet`, entrées depuis, restent.

Ancien :

````text
les contrôle dans les cartes. `proprietaires` : les comptes GitHub (`@utilisateur`, `@organisation/équipe`) à qui `.github/CODEOWNERS` donne chaque chemin sensible, ce fichier et CODEOWNERS lui-même ; CODEOWNERS se régénère par `pnpm codeowners` et le gate `codeowners` refuse tout écart (ADR « CODEOWNERS ») : deux humains au moins quand les sessions publient sous le compte d'un humain. `preparerCapitaine`
````

Nouveau :

````text
les contrôle dans les cartes. `preparerCapitaine`
````

#### S8 — `skills/chaine/socle-chaine-de-production/references/chaine.json`

La clé.

Lignes retirées, entières :

````json
  "proprietaires": [],
````

#### S9 — `skills/chaine/socle-chaine-de-production/references/chaine.json`

Le gate rapide de fin de tour.

Ancien :

````json
    "scripts/verify/settings-json.mjs",
    "scripts/github/codeowners.mjs"
````

Nouveau :

````json
    "scripts/verify/settings-json.mjs"
````

#### S10 — `skills/chaine/fusionner/scripts/github.sh`

`revue_proprietaires_exigee`, `proprietaires_de`, `demandes_jq`, `proprietaire_demande`, `attend_proprietaire`, `refus_pour_revue`, `MARQUE_ATTENTE`, `TEXTE_ATTENTE`, `attend_humain`, `MOTIF_PROPRIETAIRE`, avec leurs commentaires et la ligne vide qui les suit. Plus rien ne les appelle une fois S11 à S24 appliqués.

Bloc retiré (75 lignes, empreinte `0feb60f83d98`), de la ligne qui commence par :

````bash
# Revue des propriétaires exigée sur `<base>`
````

jusqu'à la ligne, non comprise, qui commence par :

````bash
# Verrou du passage (plusieurs capitaines sur la même file
````

#### S11 — `skills/chaine/fusionner/scripts/file.sh`

L'en-tête : la description des états « attend un propriétaire » et « attend un humain ». Celle de l'état `humain` du plafond des renvois, juste dessous, ne change pas.

Bloc retiré (13 lignes, empreinte `470ffd467c13`), de la ligne qui commence par :

````bash
#   attend un propriétaire
````

jusqu'à la ligne, non comprise, qui commence par :

````bash
#   humain              PR déjà renvoyée autant de fois que le plafond
````

#### S12 — `skills/chaine/fusionner/scripts/file.sh`

Le champ `demandes` (relecteurs demandés) n'est plus lu sur chaque PR.

Ancien :

````bash
  head: .head.ref, sommet: .head.sha, base: .base.ref, labels: [.labels[].name],
  demandes: '"$demandes_jq"'}]' <<<"$prs")
````

Nouveau :

````bash
  head: .head.ref, sommet: .head.sha, base: .base.ref, labels: [.labels[].name]}]' <<<"$prs")
````

#### S13 — `skills/chaine/fusionner/scripts/file.sh`

Lignes retirées, entières :

````bash
    .demandes,
````

#### S14 — `skills/chaine/fusionner/scripts/file.sh`

Ancien :

````bash
read -r prio n sommet base brouillon bloquee hors_sujet demandes tete titre; do
````

Nouveau :

````bash
read -r prio n sommet base brouillon bloquee hors_sujet tete titre; do
````

#### S15 — `skills/chaine/fusionner/scripts/file.sh`

La branche « attend un humain » (approbation). La branche `humain` (plafond des renvois), juste au-dessus, ne change pas.

Lignes retirées, entières :

````bash
  elif attend_humain "$n"; then
    # Une CI rouge prime, comme sur « attend un propriétaire » : relancée, puis renvoyée, comme une autre.
    etat=$(ci_de) || exit 5
    if [[ "$etat" == 'CI rouge'* ]]; then [[ "$base" != sujet/* ]] || etat="$base : $etat"; else etat='attend un humain'; fi
````

#### S16 — `skills/chaine/fusionner/scripts/file.sh`

La revue des propriétaires d'une PR vers develop.

Lignes retirées, entières :

````bash
    # Revue des propriétaires : la règle et le CODEOWNERS de develop se lisent une fois pour toute la file.
    if [ "$demandes" != - ] && [[ "$etat" != 'CI rouge'* ]]; then
      if [ -z "${proprietaires_develop+lu}" ]; then
        proprietaires_develop=$(proprietaires_de develop)
        if [ -n "$proprietaires_develop" ] && ! revue_proprietaires_exigee develop; then proprietaires_develop=''; fi
      fi
      ! proprietaire_demande "$demandes" "$proprietaires_develop" || etat='attend un propriétaire'
    fi
````

#### S17 — `skills/chaine/fusionner/scripts/passer.sh`

L'en-tête, sortie 7 : les deux attentes sortent ; ce que le ticket 4 de l'autre programme y a ajouté (le passage chez un autre capitaine, le verrou pris) reste, mot pour mot. La sortie 3 du commentaire d'attente sort avec elles.

Ancien :

````bash
#   7  pas éligible, rien à corriger côté auteur (non ouverte, brouillon, sans `à-fusionner`,
#      déjà `fusion-bloquée`, empilée sur une parente pas encore fusionnée, ou qui attend l'approbation d'un
#      propriétaire : CODEOWNERS et « Require review from Code Owners » sur la base, vu à l'éligibilité ou au refus
#      de fusion de GitHub, qui fait poser un commentaire marqué ; ou qui attend un humain : fusion déjà refusée
#      ainsi, aucune revue APPROVED plus récente que ce commentaire) : la boucle la saute sans renvoi et la reprend
#      au tour suivant ; ou en passage chez un autre capitaine (son commentaire marqué `<!-- capitaine:passage <id> -->`,
#      sans fin, de moins de 90 minutes, posé avant le sien), sautée sans renvoi ; ou qui n'est plus éligible une fois le
#      verrou pris (relue : fermée, label retiré, sommet changé)
#   3  fusion refusée faute d'approbation d'un propriétaire et commentaire d'attente impossible à poser : la boucle
#      s'arrête (ARRÊT, sortie 3), sans le repasser → lire la cause (droits du compte du capitaine), relancer
````

Nouveau :

````bash
#   7  pas éligible, rien à corriger côté auteur (non ouverte, brouillon, sans `à-fusionner`,
#      déjà `fusion-bloquée`, empilée sur une parente pas encore fusionnée) : la boucle la saute sans renvoi et la
#      reprend au tour suivant ; ou en passage chez un autre capitaine (son commentaire marqué `<!-- capitaine:passage <id> -->`,
#      sans fin, de moins de 90 minutes, posé avant le sien), sautée sans renvoi ; ou qui n'est plus éligible une fois le
#      verrou pris (relue : fermée, label retiré, sommet changé)
````

#### S18 — `skills/chaine/fusionner/scripts/passer.sh`

L'en-tête, sortie 3 du refus durable : la revue n'est plus un cas à part (décision 6).

Ancien :

````bash
#   3  fusion refusée par GitHub pour une autre raison que la revue ou une branche qui a bougé (droit du compte, règle
#      du dépôt, méthode de fusion interdite : un refus durable) : la boucle s'arrête (ARRÊT) → lire le message, traiter.
````

Nouveau :

````bash
#   3  fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé (droit du compte, règle du dépôt,
#      revue exigée, méthode de fusion interdite : un refus durable) : la boucle s'arrête (ARRÊT) → lire le message, traiter.
````

#### S19 — `skills/chaine/fusionner/scripts/passer.sh`

L'éligibilité : le saut « attend un humain ».

Lignes retirées, entières :

````bash
# Fusion déjà refusée faute d'approbation, sans approbation plus récente que le commentaire du capitaine : attend
# un humain, aucune mise à jour (au plus une CI par nouvelle approbation).
! attend_humain "$N" || sortir 7 "attend un humain : fusion refusée faute d'approbation d'un propriétaire (CODEOWNERS), aucune approbation depuis ; sautée sans renvoi"
````

#### S20 — `skills/chaine/fusionner/scripts/passer.sh`

L'éligibilité : le saut « attend un propriétaire ».

Lignes retirées, entières :

````bash
# Revue des propriétaires (CODEOWNERS de la base) attendue : ni rouge ni bloquée, rien à corriger côté auteur. Vu
# avant la mise à jour : une CI pour rien sinon, à chaque tour, jusqu'à l'approbation.
! attend_proprietaire "$pr" || sortir 7 "$MOTIF_PROPRIETAIRE"
````

#### S21 — `skills/chaine/fusionner/scripts/passer.sh`

Le refus de fusion : le commentaire qui annonçait la sortie 7.

Lignes retirées, entières :

````bash
  # Refus faute d'approbation d'un propriétaire (un propriétaire du CODEOWNERS demandé, ou seul propriétaire = l'auteur, que
  # GitHub ne demande pas) : sortie 7, jamais 5, que la boucle relancerait puis arrêterait.
````

#### S22 — `skills/chaine/fusionner/scripts/passer.sh`

Le refus de fusion : la reconnaissance du refus faute de revue, le commentaire marqué, les sorties 3 et 7. Ce qui suit dans le script (branche bougée ou panne : 5 ; règle d'ascendance rejouée, décision `A-51` de l'autre programme ; refus durable : 3) ne change pas et juge désormais ce refus comme les autres.

Lignes retirées, entières :

````bash
  if refus_pour_revue "$message" || attend_proprietaire "$(pr_json "$N" 2>/dev/null || echo '{}')"; then
    git switch -q --detach origin/develop
    git branch -q -D "capitaine/$N" 2>/dev/null || true
    # La PR attend un humain jusqu'à une nouvelle approbation : le commentaire marqué l'arrête (file.sh, attend_humain).
    # Commentaire impossible à poser : sortie 3 (la boucle s'arrête), jamais 7, qui ferait repasser la PR, mise à jour
    # et CI comprises, à chaque tour, ni 5, que la boucle met en pause puis reprend sans fin.
    commenter "$N" "$(printf '%s\n%s\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_' "$MARQUE_ATTENTE" "$TEXTE_ATTENTE")" ||
      sortir 3 "fusion refusée faute d'approbation d'un propriétaire (CODEOWNERS) et commentaire d'attente non posé : sans lui, la PR repasserait à chaque tour ; lire la cause (droits du compte du capitaine), relancer"
    sortir 7 "$MOTIF_PROPRIETAIRE"
  fi
````

#### S23 — `skills/chaine/fusionner/scripts/passer.sh`

Ancien :

````bash
Tout autre refus (droit, règle du dépôt, méthode de fusion interdite) est
````

Nouveau :

````bash
Tout autre refus (droit, règle du dépôt, revue exigée, méthode de fusion interdite) est
````

#### S24 — `skills/chaine/fusionner/scripts/passer.sh`

Le message du refus durable (décision 6).

Ancien :

````bash
  sortir 3 "fusion refusée par GitHub, ni pour la revue ni pour une branche qui a bougé (droit du compte, règle du dépôt, méthode de fusion) : message ci-dessus ; la boucle s'arrête, un humain lit la cause"
````

Nouveau :

````bash
  sortir 3 "fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé (droit du compte, règle du dépôt, revue exigée, méthode de fusion) : message ci-dessus ; la boucle s'arrête, un humain lit la cause"
````

#### S25 — `skills/chaine/fusionner/scripts/boucle.sh`

L'en-tête, sortie 7 : la phrase revient à une ligne, comme avant le ticket 50.

Ancien :

````bash
# (refus.sh) ; une PR non éligible sans correction possible (sortie 7, dont « attend un propriétaire » :
# CODEOWNERS) est sautée sans renvoi ; une PR sans CI déclenchée (sortie 3, déjà à jour,
````

Nouveau :

````bash
# (refus.sh) ; une PR non éligible sans correction possible (sortie 7) est sautée sans renvoi ; une PR sans CI déclenchée (sortie 3, déjà à jour,
````

#### S26 — `skills/chaine/fusionner/scripts/boucle.sh`

L'en-tête, les arrêts : le commentaire d'attente n'existe plus.

Ancien :

````bash
# Tout autre code arrête la boucle (gates des registres, install, CI bloquée, commentaire d'attente impossible à
# poser) : le capitaine traite, puis relance.
````

Nouveau :

````bash
# Tout autre code arrête la boucle (gates des registres, install, CI bloquée) : le capitaine traite, puis relance.
````

#### S27 — `skills/chaine/fusionner/scripts/boucle.sh`

Ancien :

````bash
(empilée, brouillon, déjà renvoyée, attend un propriétaire)
````

Nouveau :

````bash
(empilée, brouillon, déjà renvoyée)
````

#### S28 — `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Onze tests, leurs aides (`attenteProprietaire`, `etats`, `commentaireAttente`) et trois constantes (`MOTIF_PROPRIETAIRE`, `MARQUE_ATTENTE`, `CODEOWNERS`), que rien d'autre n'emploie dans le fichier. Le tableau « Les tests retirés » dit ce que chacun prouvait.

Bloc retiré (203 lignes, empreinte `346d7fa71262`), de la ligne qui commence par :

````js
// Revue des propriétaires (CODEOWNERS, « Require review from Code Owners » sur la base)
````

jusqu'à la ligne, non comprise, qui commence par :

````js
// ── Règle d'ascendance : la cible qui bouge pendant la CI
````

#### S29 — `skills/chaine/fusionner/scripts/veille.test.mjs`

Le test de la veille sur l'état « attend un propriétaire », et la ligne vide qui le suit.

Lignes retirées, entières :

````js
test("PR qui attend un propriétaire : pas de relance ; approuvée (prête), boucle relancée", () => {
  const attend = `31\tattend un propriétaire\t\n`;
  const r = veilleJouet([attend, attend], { sondes: 2 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 1);
  const r2 = veilleJouet([attend, attend, prete(31)]);
  assert.equal(r2.lancements, 2);
});

````

#### S30 — `skills/chaine/sujet/scripts/faux-gh.mjs`

Le faux GitHub : les réglages que seuls les bancs retirés lisaient (décision 5). En-tête : `revueProprietaires`, `PR.relecteurs`, `PR.equipes`, `PR.approbationManquante`.

Lignes retirées, entières :

````js
//   revueProprietaires  branches dont la règle de PR exige la revue des propriétaires (« Require review
//               from Code Owners ») : ruleset `pull_request`, ou ancienne protection avec `protectionClassique`
//   PR.relecteurs / PR.equipes  relecteurs demandés (`requested_reviewers` logins, `requested_teams` slugs) : GitHub y
//               met d'office les propriétaires CODEOWNERS et les retire quand ils approuvent
//   PR.approbationManquante  sur une base de `revueProprietaires`, la fusion est refusée (405, « Waiting on code
//               owner review ») : l'approbation d'un propriétaire manque (le faux ne lit pas CODEOWNERS)
````

#### S31 — `skills/chaine/sujet/scripts/faux-gh.mjs`

`commentairesRefuses` reste : `github.test.mjs` le lit (`true`), et `faux-gh.test.mjs` éprouve sa forme en chaîne. Son exemple ne nomme plus le commentaire d'attente.

Ancien :

````js
cette expression rationnelle seulement (le commentaire d'attente refusé, celui du verrou du passage posé)
````

Nouveau :

````js
cette expression rationnelle seulement (un commentaire refusé, celui du verrou du passage posé)
````

#### S32 — `skills/chaine/sujet/scripts/faux-gh.mjs`

Lignes retirées, entières :

````js
//   PR.revues   revues de la PR (`pulls/<n>/reviews`) : [{ state, submitted_at, auteur }]
````

#### S33 — `skills/chaine/sujet/scripts/faux-gh.mjs`

Les relecteurs demandés d'une PR.

Lignes retirées, entières :

````js
    requested_reviewers: (pr.relecteurs ?? []).map((login) => ({ login })),
    requested_teams: (pr.equipes ?? []).map((slug) => ({ slug })),
````

#### S34 — `skills/chaine/sujet/scripts/faux-gh.mjs`

La route des revues d'une PR.

Lignes retirées, entières :

````js
  if ((m = route.match(/^pulls\/(\d+)\/reviews$/)) && methode === "GET")
    return (pr(m[1]).revues ?? []).map((r, i) => ({ id: i + 1, state: r.state, submitted_at: r.submitted_at, user: { login: r.auteur ?? "relecteur" } }));
````

#### S35 — `skills/chaine/sujet/scripts/faux-gh.mjs`

Les règles d'une branche : la règle `pull_request` et la route `required_pull_request_reviews` sortent ; la route redevient celle de `develop`, la seule que `checks_exiges` lit.

Ancien :

````js
  // Revue des propriétaires : une règle `pull_request` du ruleset sur les branches de `revueProprietaires`.
  if ((m = route.match(/^rules\/branches\/([^/]+)$/))) {
    const branche = decodeURIComponent(m[1]);
    if (etat.protectionClassique) return [];
    return [
      ...(branche === "develop"
        ? [
            {
              type: "required_status_checks",
              parameters: {
                required_status_checks: (etat.exiges ?? []).map((context) => ({
                  context,
                })),
              },
            },
          ]
        : []),
      ...((etat.revueProprietaires ?? []).includes(branche)
        ? [{ type: "pull_request", parameters: { require_code_owner_review: true, required_approving_review_count: 1 } }]
        : []),
    ];
  }
  if ((m = route.match(/^branches\/([^/]+)\/protection\/required_pull_request_reviews$/)))
    return etat.protectionClassique && (etat.revueProprietaires ?? []).includes(decodeURIComponent(m[1]))
      ? { require_code_owner_reviews: true, required_approving_review_count: 1 }
      : echec("gh: Branch not protected (HTTP 404)");
````

Nouveau :

````js
  if (route === "rules/branches/develop")
    return etat.protectionClassique
      ? []
      : [
          {
            type: "required_status_checks",
            parameters: {
              required_status_checks: (etat.exiges ?? []).map((context) => ({
                context,
              })),
            },
          },
        ];
````

#### S36 — `skills/chaine/sujet/scripts/faux-gh.mjs`

Le refus 405 faute d'approbation. `PR.refusFusion`, entré depuis, rend tout message de refus qu'un banc lui donne (B6).

Lignes retirées, entières :

````js
  if ((etat.revueProprietaires ?? []).includes(p.base) && p.approbationManquante)
    echec("gh: Waiting on code owner review from @proprietaire. (HTTP 405)");
````

#### S37 — `skills/chaine/sujet/scripts/faux-gh.test.mjs`

Le test de `commentairesRefuses` prenait pour exemple la marque du commentaire d'attente, qui n'existe plus : il prend celle du renvoi. Ce qu'il prouve ne change pas.

Ancien :

````js
  d.github({ commentairesRefuses: 'attente-revue' });
  assert.equal(gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=<!-- capitaine:passage x -->').status, 0);
  assert.match(gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=<!-- attente-revue-capitaine -->').stderr, /HTTP 403/);
````

Nouveau :

````js
  d.github({ commentairesRefuses: 'renvoi-capitaine' });
  assert.equal(gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=<!-- capitaine:passage x -->').status, 0);
  assert.match(gh(d, '-X', 'POST', COMMENTAIRES, '-f', 'body=<!-- renvoi-capitaine -->').stderr, /HTTP 403/);
````

#### S38 — `scripts/poses.test.mjs`

`readFileSync` ne servait qu'au test retiré par S42.

Ancien :

````js
readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
````

Nouveau :

````js
readdirSync, rmSync, writeFileSync } from "node:fs";
````

#### S39 — `scripts/poses.test.mjs`

Ancien :

````js
// Fichiers posés un à un, et non par dossier : de `references/scripts/github/`, le socle de la chaîne ne pose que
// CODEOWNERS et le check `PR titre`, avec leurs bancs (étape 4 ter) ; `develop.sh` part seul, sans son banc (étape 9).
````

Nouveau :

````js
// Fichiers posés un à un, et non par dossier : de `references/scripts/github/`, le socle de la chaîne ne pose que
// le check `PR titre`, avec son banc (étape 4 ter) ; `develop.sh` part seul, sans son banc (étape 9).
````

#### S40 — `scripts/poses.test.mjs`

Lignes retirées, entières :

````js
  [`${SOCLE_GITHUB}/codeowners.mjs`, "scripts/github/codeowners.mjs"],
  [`${SOCLE_GITHUB}/codeowners.test.mjs`, "scripts/github/codeowners.test.mjs"],
````

#### S41 — `scripts/poses.test.mjs`

Ancien :

````js
(socle de la chaîne : CODEOWNERS, PR titre)
````

Nouveau :

````js
(socle de la chaîne : PR titre)
````

#### S42 — `scripts/poses.test.mjs`

Le test « le banc de CODEOWNERS posé passe dans un projet dont le contrat a ses propriétaires », son commentaire et la ligne vide qui les précède, en fin de fichier : le banc qu'il posait n'existe plus.

Lignes retirées, entières :

````js

// Un projet réel a son contrat, propriétaires remplis (question 4 du socle) : le banc de CODEOWNERS posé le lit et
// doit y passer aussi, pas seulement dans un projet sans contrat.
test("le banc de CODEOWNERS posé passe dans un projet dont le contrat a ses propriétaires", { timeout: 60_000 }, () => {
  const projet = mkdtempSync(join(tmpdir(), "poses-contrat-"));
  try {
    for (const [source, destination] of FICHIERS_POSES) {
      mkdirSync(join(projet, destination, ".."), { recursive: true });
      copyFileSync(join(RACINE, source), join(projet, destination));
    }
    mkdirSync(join(projet, ".claude"));
    const gabarit = JSON.parse(readFileSync(join(RACINE, "skills/chaine/socle-chaine-de-production/references/chaine.json"), "utf8"));
    const contrat = { ...gabarit, proprietaires: ["@exemple-une", "@exemple/relecteurs"], cheminsSensibles: [...gabarit.cheminsSensibles, "apps/api/src/auth/"] };
    writeFileSync(join(projet, ".claude/chaine.json"), JSON.stringify(contrat, null, 2));
    const r = spawnSync(process.execPath, ["--test", "scripts/github/codeowners.test.mjs"], { cwd: projet, env: env(), encoding: "utf8", timeout: 50_000 });
    assert.equal(r.status, 0, (r.stdout + r.stderr).split("\n").filter((l) => /not ok|✖|Error/.test(l)).join("\n"));
  } finally {
    rmSync(projet, { recursive: true, force: true });
  }
});
````

### § 3 — Les textes, mot pour mot

`node "$TMPDIR/appliquer.mjs" "$TICKET" R N` applique les quarante-quatre blocs `R` et le bloc `N1`.

#### R1 — `skills/chaine/fusionner/SKILL.md`

Le paragraphe « Une PR qui attend l'approbation d'un propriétaire » et la ligne vide qui le suit.

Bloc retiré (2 lignes, empreinte `b15b5033c073`), de la ligne qui commence par :

````text
**Une PR qui attend l'approbation d'un propriétaire**
````

jusqu'à la ligne, non comprise, qui commence par :

````text
La file lit la CI de chaque PR : états dans l'en-tête de `file.sh`.
````

#### R2 — `skills/chaine/fusionner/SKILL.md`

Ancien :

````text
une fusion refusée durablement par GitHub (droit, règle du dépôt, méthode interdite) sort en 3
````

Nouveau :

````text
une fusion refusée durablement par GitHub (droit, règle du dépôt, revue exigée, méthode interdite) sort en 3
````

#### R3 — `skills/chaine/fusionner/references/CONTENU.md`

La section de `file.sh` : les deux états, jusqu'à la fin du paragraphe.

Ancien :

````text
ne prouve pas que la CI a démarré. « Attend un propriétaire » : la base exige la revue des propriétaires (« Require review from Code Owners ») et un propriétaire du CODEOWNERS de la base (lu sur `origin/<base>`, `.github/`, racine puis `docs/`, comme GitHub ; une fois par file) reste demandé comme relecteur (GitHub les demande d'office et les retire à l'approbation ; un relecteur demandé à la main qui n'est pas propriétaire ne compte pas, CODEOWNERS illisible : aucun propriétaire connu) ; ni rouge ni bloquée, la PR est sautée sans renvoi ni relance et reprise au tour suivant, une fois approuvée. `passer.sh` le voit à l'éligibilité, avant toute mise à jour (une CI pour rien sinon, à chaque tour), et au refus de fusion de GitHub qui tient à la revue (seul propriétaire = l'auteur, que GitHub ne demande pas) : sortie 7, jamais 5, que la boucle relancerait puis arrêterait. « Attend un humain » : plafond des mises à jour sans approbation. Sur ce refus, `passer.sh` commente la PR (marque invisible `<!-- attente-revue-capitaine -->`, comptée sous le seul compte du capitaine, comme celle des renvois) ; tant qu'aucune revue `APPROVED` n'est plus récente que le dernier commentaire marqué, ni `file.sh` ni `passer.sh` ne la font passer : au plus une CI par nouvelle approbation, au lieu d'une à chaque tour (cas : l'auteur seul propriétaire, que GitHub ne demande pas). Compte du capitaine illisible : fermé, comme les renvois, dont le compte n'est pas touché. Une CI rouge prime sur les deux attentes (relancée, puis renvoyée, comme une autre). Un commentaire d'attente impossible à poser fait sortir `passer.sh` en 3, jamais en 7 ni en 5 : la boucle s'arrête sans le repasser, au lieu de refaire mise à jour et CI à chaque tour (la pause sur 5 la ferait repasser sans fin). Le capitaine ne demande ni ne donne l'approbation, et ne contourne jamais la règle (ADR « CODEOWNERS » du projet).
````

Nouveau :

````text
ne prouve pas que la CI a démarré.
````

#### R4 — `skills/chaine/fusionner/references/CONTENU.md`

Ancien :

````text
tout autre refus (droit du compte, règle du dépôt, méthode de fusion interdite) est durable et sort en 3
````

Nouveau :

````text
tout autre refus (droit du compte, règle du dépôt, revue exigée, méthode de fusion interdite) est durable et sort en 3
````

#### R5 — `skills/chaine/fusionner/references/CONTENU.md`

« Les tests » : ce que les onze tests retirés prouvaient.

Ancien :

````text
(`null` ou `unknown` : « prête (sans CI) ») ; la revue des propriétaires (faux `gh` : règle `pull_request` du ruleset ou ancienne protection, relecteurs et équipes demandés, fusion refusée en 405) : `attend un propriétaire` dans la file, ni `--next` ni `--rouges`, seul un propriétaire du CODEOWNERS (utilisateur ou équipe, casse ignorée, aux trois emplacements) et jamais un relecteur demandé à la main, CODEOWNERS absent sans attente, prête une fois approuvée, rien sans la règle sur develop, CI rouge qui prime, `passer.sh` en 7 sans rien pousser, commenter ni étiqueter, un refus de fusion pour revue en 7 et non en 5 avec le commentaire marqué, puis `attend un humain` jusqu'à une approbation plus récente (une plus ancienne ne suffit pas, la marque d'un autre compte ne compte pas, compte illisible fermé), la boucle qui la saute sans renvoi, fait passer la suivante et ne pousse rien au tour suivant, une CI rouge qui prime sur l'attente d'un humain, un commentaire d'attente refusé qui sort en 3 et arrête la boucle sans le repasser.
````

Nouveau :

````text
(`null` ou `unknown` : « prête (sans CI) »).
````

#### R6 — `skills/chaine/fusionner/references/CONTENU.md`

« Les tests » : la veille.

Ancien :

````text
pas sur « CI en cours » ni sur « attend un propriétaire », relance dès qu'elle est approuvée, une seule relance
````

Nouveau :

````text
pas sur « CI en cours », une seule relance
````

#### R7 — `skills/chaine/fusionner/references/CONTENU.md`

« Les tests » : le refus durable.

Ancien :

````text
le commentaire d'attente impossible en 3, une fusion refusée durablement par GitHub en 3 (la boucle s'arrête),
````

Nouveau :

````text
une fusion refusée durablement par GitHub en 3, faute de revue approuvée comprise (la boucle s'arrête),
````

#### R8 — `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`

La ligne « Chemin sensible = relu par un humain, tenu par GitHub » du fragment de `CLAUDE.md`.

Lignes retirées, entières :

````text
- **Chemin sensible = relu par un humain, tenu par GitHub** : `.github/CODEOWNERS` se génère depuis `cheminsSensibles` et `proprietaires` de `.claude/chaine.json` (`pnpm codeowners`, jamais à la main) ; une PR qui touche un chemin sensible attend l'approbation d'un propriétaire, et le capitaine l'attend sans la renvoyer. Décision : `{{ADR_CODEOWNERS}}`.
````

#### R9 — `skills/chaine/socle-chaine-de-production/SKILL.md`

La description du skill.

Ancien :

````text
une CI minimale, un .github/CODEOWNERS généré depuis les chemins sensibles avec son gate, la méthode docs/agents/chaine-de-production.md et quatre ADR
````

Nouveau :

````text
une CI minimale, la méthode docs/agents/chaine-de-production.md et trois ADR
````

#### R10 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
`{{ADR_CHAINE}}`, `{{ADR_SUJET}}`, `{{ADR_CODEOWNERS}}`. Ce que chaque pièce
````

Nouveau :

````text
`{{ADR_CHAINE}}`, `{{ADR_SUJET}}`. Ce que chaque pièce
````

#### R11 — `skills/chaine/socle-chaine-de-production/SKILL.md`

« Avant de commencer », point 3 : le renvoi à la marche à suivre du retrait (N1).

Ancien :

````text
une mise à jour se fait pièce par pièce.
````

Nouveau :

````text
une mise à jour se fait pièce par pièce. Un projet posé depuis le plugin 7.13.0 peut porter un `.github/CODEOWNERS` généré, que le produit a retiré : [`references/retrait-codeowners.md`](references/retrait-codeowners.md).
````

#### R12 — `skills/chaine/socle-chaine-de-production/SKILL.md`

La question 4 de l'étape 1 : il n'y a plus de propriétaires à demander.

Lignes retirées, entières :

````text
4. **Propriétaires des chemins sensibles** — les comptes GitHub (`@utilisateur`, `@organisation/équipe`) qui approuvent une PR qui touche un chemin sensible : `proprietaires` du contrat, d'où `.github/CODEOWNERS` est généré. _(Recommandé : deux humains au moins, ou une équipe qui en compte deux ; l'auteur d'une PR ne peut pas l'approuver, et quand les sessions publient sous le compte d'un humain, cet humain n'approuve aucune de leurs PR. Avec un seul humain, le dire : la règle ne le protège pas, et `chaine-admin.md` laisse sa case ouverte.)_
````

#### R13 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
rempli des réponses de l'étape 1 (`proprietaires` : la réponse 4, jamais inventée).
````

Nouveau :

````text
rempli des réponses de l'étape 1.
````

#### R14 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Le point 4 ter de l'étape 2 : il ne pose plus que le check `PR titre`, que le ticket 16 de l'autre programme y a ajouté ; sa phrase reste mot pour mot.

Ancien :

````text
4 ter. **CODEOWNERS** : `references/scripts/github/codeowners*` → `scripts/github/` ; scripts `codeowners` (`node scripts/github/codeowners.mjs --ecrire`) et `check:codeowners` (`node scripts/github/codeowners.mjs`) dans `package.json`, étape `check:codeowners` dans `scripts/check.mjs` après `check:settings` ; puis `pnpm codeowners`, qui écrit `.github/CODEOWNERS` depuis `cheminsSensibles` et `proprietaires` (plus CODEOWNERS lui-même et `.claude/chaine.json`). Un CODEOWNERS déjà là est remplacé : ses lignes qui ne sont pas des chemins sensibles vont d'abord dans `cheminsSensibles` si le projet les veut, sinon le dire à l'humain. Le gate refuse tout écart avec la commande qui régénère ; `garde-fichiers` refuse l'édition du fichier ; le gate rapide de fin de tour le rejoue (`gatesRapides`). La règle de GitHub qui le fait respecter est à l'admin (`admin.md`, case « CODEOWNERS respecté »). Avec lui, le check `PR titre` :
````

Nouveau :

````text
4 ter. **Le check `PR titre`** :
````

#### R15 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
`node scripts/docs/next-id.mjs ADR ALL ARC` quatre fois, de suite
````

Nouveau :

````text
`node scripts/docs/next-id.mjs ADR ALL ARC` trois fois, de suite
````

#### R16 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
`ADR_ALL_ARC-N-recette-humaine.md`, `ADR_ALL_ARC-N-codeowners.md` → `docs/adr/ADR_ALL_ARC-<n>-….md`
````

Nouveau :

````text
`ADR_ALL_ARC-N-recette-humaine.md` → `docs/adr/ADR_ALL_ARC-<n>-….md`
````

#### R17 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
`{{ADR_CHAINE}}`, `{{ADR_SUJET}}` et `{{ADR_CODEOWNERS}}` valent ces identifiants
````

Nouveau :

````text
`{{ADR_CHAINE}}` et `{{ADR_SUJET}}` valent ces identifiants
````

#### R18 — `skills/chaine/socle-chaine-de-production/SKILL.md`

L'étape 3 : le gate n'existe plus. La ligne suivante, `node --test scripts/github/*.test.mjs`, reste : elle joue le banc du check `PR titre`.

Lignes retirées, entières :

````text
pnpm check:codeowners     # .github/CODEOWNERS suit le contrat
````

#### R19 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
les branches de sujet, la recette humaine et CODEOWNERS`
````

Nouveau :

````text
les branches de sujet et la recette humaine`
````

#### R20 — `skills/chaine/socle-chaine-de-production/SKILL.md`

Ancien :

````text
- **Ni critères de revue, ni chemins sensibles, ni propriétaires inventés.** Le fichier de critères naît avec `revue-adversariale` ; les chemins viennent de la question 1, les propriétaires de la question 4.
````

Nouveau :

````text
- **Ni critères de revue, ni chemins sensibles inventés.** Le fichier de critères naît avec `revue-adversariale` ; les chemins viennent de la question 1.
````

#### R21 — `skills/chaine/socle-chaine-de-production/SKILL.md`

La ligne du tableau des anti-patterns.

Lignes retirées, entières :

````text
| « Je corrige CODEOWNERS à la main, c'est une ligne »               | Il se régénère depuis `.claude/chaine.json` : le gate rougit et la garde refuse. Le chemin va dans `cheminsSensibles`, puis `pnpm codeowners`. |
````

#### R22 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Le compte des clés du contrat, refait sur `main` (`A-108`) : le gabarit en porte huit depuis `fusionsSansEffet` (ticket 3 de l'autre programme), sept sans `proprietaires` ; `preparerCapitaine` (son ticket 8), facultative et absente du gabarit, devient la huitième (R24).

Ancien :

````text
Huit clés, et rien d'autre,
````

Nouveau :

````text
Sept clés, et rien d'autre,
````

#### R23 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
(un diff qui les touche passe en plus `/security-review`, et GitHub exige l'approbation d'un propriétaire), les **propriétaires** (`proprietaires` : les comptes GitHub à qui `.github/CODEOWNERS`, généré, donne chaque chemin sensible), le **fichier de critères**
````

Nouveau :

````text
(un diff qui les touche passe en plus `/security-review`), le **fichier de critères**
````

#### R24 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
Une neuvième, facultative et absente du gabarit : `preparerCapitaine`
````

Nouveau :

````text
Une huitième, facultative et absente du gabarit : `preparerCapitaine`
````

#### R25 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
`scripts/github/**` (le générateur de CODEOWNERS, `develop.sh`, `labels.sh`)
````

Nouveau :

````text
`scripts/github/**` (`develop.sh`, `labels.sh`, le check `PR titre`)
````

#### R26 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ce que `garde-fichiers` refuse.

Ancien :

````text
d'un `.env`, d'une migration déjà livrée et de CODEOWNERS (`.github/`, racine ou `docs/`, toute casse, chemin normalisé : `.github//CODEOWNERS` et `docs/../CODEOWNERS` comptent) : le refus dit de modifier `cheminsSensibles` ou `proprietaires` dans `.claude/chaine.json`, puis de régénérer (`pnpm codeowners`).
````

Nouveau :

````text
d'un `.env` et d'une migration déjà livrée, le chemin normalisé d'abord (`.//pnpm-lock.yaml` et `docs/../pnpm-lock.yaml` comptent).
````

#### R27 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

La section « CODEOWNERS » entière : son titre, son paragraphe et les deux lignes vides.

Bloc retiré (4 lignes, empreinte `0196b5786ad0`), de la ligne qui commence par :

````text
## CODEOWNERS — `scripts/github/codeowners.mjs`
````

jusqu'à la ligne, non comprise, qui commence par :

````text
## Les labels — `labels.sh`
````

#### R28 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
Quatre gabarits, numérotés à l'installation
````

Nouveau :

````text
Trois gabarits, numérotés à l'installation
````

#### R29 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
la recette humaine, CODEOWNERS (un chemin sensible relu par un humain et tenu par GitHub, généré depuis le contrat, deux propriétaires humains). Ils portent la décision et les faits mesurés qui la fondent ; le projet les date et peut les réviser. Les skills ne les relisent jamais.
````

Nouveau :

````text
la recette humaine. Ils portent la décision et les faits mesurés qui la fondent ; le projet les date et peut les réviser. Les skills ne les relisent jamais. Un quatrième, `ADR_ALL_ARC-N-codeowners.md`, est marqué retiré (décision du produit du 2026-11-18) et ne se pose plus : il ne sert qu'à mettre à jour l'ADR d'un projet qui l'a reçue. `retrait-codeowners.md` est la marche à suivre de ce retrait, lue depuis le skill et jamais posée.
````

#### R30 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
la section « Fusion vers `develop` » (dont la ligne « chemin sensible = relu par un humain, tenu par GitHub ») et deux lignes de routage
````

Nouveau :

````text
la section « Fusion vers `develop` » et deux lignes de routage
````

#### R31 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md`

Ancien :

````text
La protection des branches, la règle qui fait respecter CODEOWNERS (« Require review from Code Owners » sur develop et main, « Block force pushes », « Restrict deletions », aucun contournement ; deux propriétaires humains, sans quoi la règle ne protège pas), la suppression automatique
````

Nouveau :

````text
La protection des branches (dont « Block force pushes », « Restrict deletions » et aucune liste de contournement ; « Require review from Code Owners » ne se coche pas), la suppression automatique
````

#### R32 — `skills/chaine/socle-chaine-de-production/references/admin.md`

La case « Protection de `develop` » dit de ne pas cocher la règle, et garde « Required approvals » à 0 avec sa raison nouvelle : une approbation exigée arrête désormais le capitaine (décisions 6 et 7).

Ancien :

````text
« Require a pull request before merging » ; « Require status checks to pass »
````

Nouveau :

````text
« Require a pull request before merging », **sans** « Require review from Code Owners » (le produit l'a retirée le 2026-11-18 : aucun `.github/CODEOWNERS` n'est posé, et GitHub ne bloque aucune PR sur les chemins sensibles) et avec **« Required approvals » à 0** (toutes les sessions publient sous un même compte, et GitHub ne laisse pas un auteur approuver sa propre PR : avec une approbation exigée, GitHub refuse la fusion de toute PR que personne d'autre n'a approuvée, et le capitaine s'arrête sur ce refus, `passer.sh` sortie 3) ; « Require status checks to pass »
````

#### R33 — `skills/chaine/socle-chaine-de-production/references/admin.md`

La même case reprend les sous-règles qui ne tenaient pas à CODEOWNERS : pas de suppression de branche, aucune liste de contournement, pas de règle de PR sur les sujets. Ce que la 7.16.0 y a écrit sur l'ascendance, plus haut dans la phrase, n'est pas touché.

Ancien :

````text
 ; la revue des propriétaires relève de la case « CODEOWNERS respecté » ci-dessous, et de sa condition ; « Do not allow bypassing the above settings ». Pas de « Require linear history » : un sujet entre par un commit de merge.
````

Nouveau :

````text
 ; **« Restrict deletions »** ; « Do not allow bypassing the above settings », et **aucune liste de contournement** (« Bypass list » vide) : un administrateur qui contourne la règle la retire pour tous. Pas de « Require linear history » : un sujet entre par un commit de merge. Pas de règle de PR sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR : elle bloquerait la chaîne.
````

#### R34 — `skills/chaine/socle-chaine-de-production/references/admin.md`

La case « CODEOWNERS respecté », ses neuf sous-points, le paragraphe « Le capitaine n'est pas bloqué » et la ligne vide qui les suit. Reste, de ses sous-règles, le refus des pushs forcés, et ce que GitHub ne tient plus.

Bloc retiré (13 lignes, empreinte `94b8b6361709`), de la ligne qui commence par :

````text
- [ ] **CODEOWNERS respecté :
````

jusqu'à la ligne, non comprise, qui commence par :

````text
Vérification : `gh api
````

À la place :

````text
- [ ] **« Block force pushes »** sur toutes les branches (Rulesets, cible `~ALL`), sans liste de contournement.

Ce que ces règles ne tiennent pas : toutes les sessions écrivent sous le même compte, la revue exigée par le capitaine est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`). Aucune n'arrête une PR hostile.

````

#### R35 — `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-codeowners.md`

L'ADR est marquée retirée, pas supprimée (décision 2).

Ancien :

````text
- Statut : **accepté**
````

Nouveau :

````text
- Statut : **retirée** par la décision du produit du 2026-11-18 (`P-49` de la carte « gouverner nos boucles » du plugin `maj-skills`) ; gardée pour mémoire
````

#### R36 — `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-codeowners.md`

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

#### R37 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`

Ancien :

````text
Branches de sujet : `{{ADR_SUJET}}`. CODEOWNERS : `{{ADR_CODEOWNERS}}`. Contrat du projet
````

Nouveau :

````text
Branches de sujet : `{{ADR_SUJET}}`. Contrat du projet
````

#### R38 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`

Le paragraphe du § 3 et la ligne vide qui le suit.

Bloc retiré (2 lignes, empreinte `736d9a416597`), de la ligne qui commence par :

````text
**Chemin sensible = relu par un humain, tenu par GitHub.**
````

jusqu'à la ligne, non comprise, qui commence par :

````text
Taille : un jour au plus
````

#### R39 — `skills/chaine/chantier/SKILL.md`

§ 6, point 5 : **la moitié CODEOWNERS de l'alinéa, et elle seule** (`A-94`). Deux phrases sortent ; la contre-revue du conducteur, avant elles, et « Une sous-PR à la fois par sujet », après elles, ne sont pas touchées (le ticket 57 récrit cette seconde moitié, le ticket 56 le point 6, sur la ligne voisine).

Ancien :

````text
avant le réveil suivant. Sauf une PR qui touche un chemin possédé (`.github/CODEOWNERS`) : vers develop, elle attend l'approbation d'un propriétaire humain, et `file.sh` la montre « attend un propriétaire », puis « attend un humain » si GitHub a refusé sa fusion ; la vague peut s'y arrêter. Le conducteur le dit au produit (par l'architecte dans un programme) : il n'approuve rien lui-même. Pour un ticket `Label: contre-revue`
````

Nouveau :

````text
avant le réveil suivant. Pour un ticket `Label: contre-revue`
````

#### R40 — `README.md`

Ancien :

````text
une CI minimale, un `.github/CODEOWNERS` généré depuis les chemins sensibles, la méthode et quatre ADR |
````

Nouveau :

````text
une CI minimale, la méthode et trois ADR |
````

#### R41 — `README.md`

Ancien :

````text
labels, CI, CODEOWNERS et son gate, méthode, quatre ADR, fragments, liste admin
````

Nouveau :

````text
labels, CI, méthode, trois ADR, fragments, liste admin
````

#### R42 — `skills/chaine/fusionner/SKILL.md`

Ce que le capitaine fait devant un refus durable de fusion, là où il le lit (décision 6) : un alinéa de plus, avant « Sans veille en cours ». Le code ne change pas : l'alinéa dit ce que `boucle.sh` et `passer.sh` font déjà, et ce que le capitaine ne fait pas.

Ancien :

````text
**Sans veille en cours** (capitaine démarré
````

Nouveau :

````text
**Devant un refus durable de fusion** (`ARRÊT`, `passer.sh` sortie 3, « fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé » : droit du compte, règle du dépôt, revue exigée, méthode de fusion interdite), le capitaine n'y peut rien. La PR garde `à-fusionner` et sa place dans la file : tant que la cause demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et aucune PR vers develop placée après elle ne passe. Il ne retire pas ce label, n'écrit rien sur la PR hors le commentaire de passage que `passer.sh` pose et termine, et ne la renvoie pas (son auteur n'y peut rien) ; il le dit à son lanceur (au produit hors programme), avec le message exact de GitHub. Un humain lève la règle du dépôt (ou rend son droit au compte), puis le capitaine relance sa veille.

**Sans veille en cours** (capitaine démarré
````

#### R43 — `skills/chaine/architecte/references/lancement.md`

La « Limite » du capitaine d'un dépôt sans la chaîne renvoyait à la protection de GitHub comme à « la frontière contre une PR hostile » : c'était la case CODEOWNERS de la liste de l'admin, que R34 retire, et le titre cité n'existe plus dans `admin.md` depuis la 7.13.0. La phrase dit ce qui reste vrai : ce que ces règles tiennent, et qu'aucune n'arrête une PR hostile venue d'un compte de confiance.

Ancien :

````text
Ni le commentaire ni le label ne tiennent contre une PR hostile venue d'un de ces comptes : la frontière reste la protection de GitHub recommandée dans `socle-chaine-de-production/references/admin.md` (« la frontière contre une PR hostile »).
````

Nouveau :

````text
Ni le commentaire ni le label ne tiennent contre une PR hostile venue d'un de ces comptes, et la protection des branches de GitHub non plus : les règles de `socle-chaine-de-production/references/admin.md` tiennent l'entrée par une PR, les checks exigés sur une branche à jour, le refus des pushs forcés et des suppressions de branche, et aucune n'arrête ce qu'un compte de confiance fait entrer (« Ce que ces règles ne tiennent pas »).
````

#### R44 — `skills/chaine/fusionner/references/CONTENU.md`

« Ce que le capitaine exécute » : la même frontière, donnée pour « recommandation non posée par défaut » de la liste de l'admin. Le poste jetable reste ; la protection des branches n'est plus dite frontière.

Ancien :

````text
Contre une PR hostile, la frontière n'est pas dans la chaîne : un capitaine sur un poste jetable, sans autre secret que son jeton GitHub, et la protection des branches chez GitHub (`admin.md` du socle, recommandation non posée par défaut).
````

Nouveau :

````text
Contre une PR hostile venue d'un compte de confiance, aucune garde ne l'arrête, ni dans la chaîne ni chez GitHub : la protection des branches (`admin.md` du socle) tient l'entrée par une PR, les checks exigés sur une branche à jour, le refus des pushs forcés et des suppressions de branche, pas ce qui entre (« Ce que ces règles ne tiennent pas »). Reste, pour borner ce qu'elle atteint, un capitaine sur un poste jetable, sans autre secret que son jeton GitHub.
````

#### N1 — `skills/chaine/socle-chaine-de-production/references/retrait-codeowners.md`

La marche à suivre du retrait dans un projet déjà posé (décision 8), lue depuis le skill (R11) et jamais posée.

Fichier nouveau, mot pour mot :

````text
# Retirer CODEOWNERS d'un projet déjà posé

Un projet posé ou reposé depuis le plugin 7.13.0 peut porter un `.github/CODEOWNERS` généré, son générateur et son gate. Le produit les a retirés le 2026-11-18 : GitHub ne bloque aucune PR sur les chemins sensibles, et « Require review from Code Owners » ne se coche sur aucun dépôt. Aucun `poser` ne fait ce retrait : reposer un skill copie ses fichiers, sans retirer ceux qu'une version antérieure a posés. À faire une fois, dans une seule PR vers `develop` ; les points 1 à 3 dans le même tour, parce qu'entre deux le gate `check:codeowners` rougit.

1. **Le fichier.** `head -n 1 .github/CODEOWNERS` rend `# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.` : c'est la copie du générateur, `git rm .github/CODEOWNERS`. Toute autre première ligne : le fichier est celui du projet, le laisser et le dire à qui a lancé la session. Un `CODEOWNERS` à la racine ou sous `docs/` n'a jamais été généré : ne pas y toucher.
2. **Le générateur et son gate.** `git rm scripts/github/codeowners.mjs scripts/github/codeowners.test.mjs` ; retirer de `package.json` les scripts `codeowners` et `check:codeowners`, de `scripts/check.mjs` l'étape `check:codeowners`, et de tout autre script ou workflow du projet l'appel à l'un d'eux. Le check `PR titre` et son banc, posés depuis le plugin 7.28.0, restent sous `scripts/github/`.
3. **Le contrat.** Dans `.claude/chaine.json` : retirer la clé `proprietaires` et l'entrée `scripts/github/codeowners.mjs` de `gatesRapides`, reprendre le `$comment` de `references/chaine.json`. `cheminsSensibles` ne change pas.
4. **Les gardes et le capitaine.** Reposer `references/agent/*` (`SKILL.md`, étape 2, point 4) et les scripts du capitaine et des sujets (« Étape 0 — poser » du skill `fusionner`, puis `/maj-skills:sujet poser`) : `regles.mjs` ne refuse plus l'édition de CODEOWNERS, la file n'a plus d'état « attend un propriétaire ». Relancer chaque capitaine une fois cette PR entrée dans `develop`.
5. **Les textes.** Retirer de `CLAUDE.md` la ligne « Chemin sensible = relu par un humain, tenu par GitHub » ; de `docs/agents/chaine-de-production.md`, le paragraphe du même nom et, dans son en-tête, « CODEOWNERS : » suivi de son ADR ; dans `docs/agents/chaine-admin.md`, reprendre la case « Protection de `develop` » de `references/admin.md` et remplacer la case « CODEOWNERS respecté » par sa case « Block force pushes » et le paragraphe qui la suit (les cases déjà cochées le restent).
6. **L'ADR.** L'ADR « CODEOWNERS » du projet garde son numéro et son texte : sa ligne `Statut` devient celle de `references/adr/ADR_ALL_ARC-N-codeowners.md`, et la section « Retrait » de ce gabarit s'y ajoute, placeholders substitués. Ce gabarit ne se pose plus dans un projet neuf.
7. **À l'admin.** Décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était, et tenir « Required approvals » à 0 : une session ne le peut pas. Tant qu'une revue reste exigée (la règle cochée : toute PR qui touche un chemin possédé ; une approbation exigée : toute PR que personne d'autre que son auteur n'a approuvée), GitHub refuse la fusion, et le capitaine reposé ne l'attend plus : il s'arrête sur ce refus (`passer.sh`, sortie 3, `ARRÊT`), et le dit. La PR refusée garde `à-fusionner` et sa place dans la file : tant que la cause demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et aucune PR vers `develop` placée après elle ne passe. Le capitaine ne retire pas ce label et n'écrit rien sur la PR, hors le commentaire de passage que `passer.sh` pose et termine ; il le dit à son lanceur (au produit hors programme), avec le message exact de GitHub, et un humain lève la règle du dépôt.

Puis `pnpm check`. `git grep -il codeowners` ne rend plus que l'ADR, `docs/agents/chaine-admin.md` et `scripts/agent/regles.test.mjs` ; tout autre fichier est propre au projet : le dire à qui a lancé la session.
````


### § 4 — La version et la note

À la main, après les blocs : le script du § 5 ne lit pas ce paragraphe.

`.claude-plugin/plugin.json:3` : `"version": "<version d'origin/main>"` devient la version suivante, mineure (décision 9) : deuxième nombre plus un, troisième à zéro. Aucun numéro n'est écrit dans ce ticket, ni dans ses tests : d'autres PR ouvertes prendront une version avant celle-ci, lire donc celle d'`origin/main` au moment de livrer, et la relire à chaque fusion de `main` dans la branche (règle de repli, § 6).

`NOTES-DE-VERSION.md` : cette note, entre le paragraphe d'introduction et la première note du fichier, avec la version prise et la date du jour de la livraison à la place de `<version>` et de `<date>` :

````markdown
## <version> — <date>

### Ce qui change

CODEOWNERS sort du plugin (décision du produit du 2026-11-18) : GitHub ne bloque plus aucune PR sur les chemins sensibles. Le socle ne pose plus `.github/CODEOWNERS`, ni son générateur `scripts/github/codeowners.mjs`, ni le gate `check:codeowners` ; le gabarit de `.claude/chaine.json` n'a plus de clé `proprietaires` ni de gate rapide sous `scripts/github/` ; `garde-fichiers` ne refuse plus l'édition de CODEOWNERS, et normalise toujours le chemin avant de juger le lockfile, un `.env` ou une migration livrée. Le capitaine n'attend plus personne : les états « attend un propriétaire » et « attend un humain » (fusion refusée faute d'approbation) sortent de `file.sh`, `passer.sh`, `boucle.sh` et `github.sh`. **Un refus de fusion de GitHub faute de revue approuvée est désormais un refus durable comme un autre : `passer.sh` sort en 3 et la boucle s'arrête**, au lieu d'attendre l'approbation. La PR refusée garde `à-fusionner` et sa place dans la file : tant que la règle demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et les PR vers `develop` placées après elle attendent ; le capitaine ne retire pas son label, le dit à son lanceur, et un humain lève la règle (skill `fusionner`, « Devant un refus durable de fusion »). L'état `humain` du plafond des renvois ne change pas. Le socle pose trois ADR ; le gabarit de l'ADR « CODEOWNERS » reste dans le plugin, marqué retiré. La liste de l'admin dit de ne pas cocher « Require review from Code Owners », tient « Required approvals » à 0 (une approbation exigée arrête désormais le capitaine), et garde « Block force pushes », « Restrict deletions » et « aucune liste de contournement ». Plus aucun texte ne donne la protection des branches de GitHub pour frontière contre une PR hostile : aucune de ses règles n'arrête ce qu'un compte de confiance fait entrer. Les chemins sensibles, la contre-revue et `/security-review` ne changent pas ; ce qui prendra la place de CODEOWNERS, l'accord du produit donné avant de toucher un fichier sensible, arrive avec la relecture indépendante.

### Ce qu'un projet fait pour en profiter

Un projet qui ne repose rien ne voit rien changer : ses scripts sont des copies, son CODEOWNERS et son gate marchent comme avant.

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Un projet qui n'a jamais reçu CODEOWNERS (pas de `scripts/github/codeowners.mjs`) : rien d'autre à faire.
3. Un projet qui l'a reçu (posé ou reposé depuis le plugin 7.13.0) suit, dans une seule PR vers `develop`, la marche à suivre `socle-chaine-de-production/references/retrait-codeowners.md`. **Aucun `poser` ne fait ce retrait.** Elle retire `.github/CODEOWNERS` seulement si sa première ligne est celle du générateur (`# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.`) : un CODEOWNERS écrit à la main reste, et se dit à qui a lancé la session. Elle retire aussi le générateur, son banc, les scripts `codeowners` et `check:codeowners`, la clé `proprietaires` et le gate rapide du contrat, repose `scripts/agent/` et les scripts du capitaine, corrige `CLAUDE.md`, la méthode et la liste de l'admin, et marque retirée l'ADR « CODEOWNERS » du projet.
4. **À l'admin, avant de relancer le capitaine : décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était, et tenir « Required approvals » à 0.** Dès que les scripts du capitaine sont reposés à cette version, même sans le reste du retrait, il n'attend plus un propriétaire : règle cochée, il s'arrête (`ARRÊT`, sortie 3) au refus de fusion de la première PR qui touche un chemin possédé, et de nouveau à chaque relance tant qu'elle le reste.
5. Relancer chaque capitaine une fois cette PR entrée dans `develop` (skill `fusionner` § « Mise en place »).

Un projet peut reposer `scripts/agent/` et les scripts du capitaine avant de retirer le fichier : son gate `check:codeowners` reste vert tant que son contrat garde `proprietaires` et que son générateur est là.
````

`scripts/depot.test.mjs` tient la forme : la première note du fichier commence par la version de `plugin.json` et porte les deux titres `### Ce qui change` et `### Ce qu'un projet fait pour en profiter`.

### § 5 — Le script qui applique les blocs

Donné entier. La session le tire de ce fichier par ses bornes (§ 0), vérifie son empreinte, et ne le commite pas : il ne vit que dans son dossier temporaire.

<!-- début : appliquer.mjs -->
````js
#!/usr/bin/env node
// Applique à l'arbre de travail courant les blocs « À faire » d'un ticket (ticket 54 : CODEOWNERS sort du plugin).
// Usage, depuis la racine du dépôt : node appliquer.mjs <ticket.md> [<choix>…]
//   sans choix, tous les blocs ; « B » (des lettres seules) : ceux dont l'identifiant commence par B ; « S12 » : ce bloc.
// Tout ou rien, en trois temps.
// 1. Chaque bloc choisi est joué en mémoire. Est une faute un bloc qui ne s'applique pas (texte absent ou présent deux
//    fois, bloc d'une autre taille ou d'une autre empreinte) et un bloc déjà appliqué (son texte « Nouveau » est en
//    place et son « Ancien » absent, ou le rejouer doublerait un texte).
// 2. Ce que l'écriture suppose est vérifié avant elle : la racine du dépôt, chaque fichier à supprimer suivi par git,
//    aucun fichier nouveau ignoré, l'index de git non verrouillé, chaque fichier à écrire ouvert en écriture.
//    À la moindre faute, rien n'est écrit, les blocs en cause sont nommés, sortie 1.
// 3. L'index de git d'abord, en une seule commande (`git update-index` : les fichiers supprimés en sortent, le fichier
//    nouveau y entre) : elle passe entière ou ne change rien, et rien n'est encore écrit sur le disque. Puis le
//    disque : fichiers écrits, fichiers supprimés retirés. Une écriture interrompue là est dite, sortie 2.
// Aucune dépendance.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [ticket, ...choix] = process.argv.slice(2);
if (!ticket) {
  console.error("usage : node appliquer.mjs <ticket.md> [<lettres d'un groupe de blocs, ou identifiant d'un bloc>…]");
  process.exit(64);
}
const empreinte = (texte) => createHash("sha256").update(texte).digest("hex").slice(0, 12);
const lignes = readFileSync(ticket, "utf8").split("\n");
const debut = lignes.indexOf("## À faire, dans l'ordre");
if (debut < 0) {
  console.error(`${ticket} : section « ## À faire, dans l'ordre » introuvable`);
  process.exit(64);
}

// Une ligne de marque annonce le bloc de code qui la suit ; un bloc de code sans marque est ignoré.
const MARQUES = [
  [/^Ancien :$/, "ancien"],
  [/^Nouveau :$/, "nouveau"],
  [/^Lignes retirées, entières :$/, "lignes"],
  [/^Bloc retiré \((\d+) lignes, empreinte `([0-9a-f]{12})`\), de la ligne qui commence par :$/, "de"],
  [/^jusqu'à la ligne, non comprise, qui commence par :$/, "jusqua"],
  [/^À la place :$/, "place"],
  [/^Ajouté à la fin du fichier, après une ligne vide :$/, "fin"],
  [/^Fichier nouveau, mot pour mot :$/, "entier"],
];
const blocs = [];
let bloc = null;
let attente = null;
for (let i = debut + 1; i < lignes.length; i++) {
  const l = lignes[i];
  if (l.startsWith("## ")) break; // la section suivante du ticket ; un « ## » dans un bloc de code n'arrive pas ici
  if (l.startsWith("#")) {
    const m = /^#### (\S+) — `([^`]+)`(.*)$/.exec(l);
    bloc = m ? { id: m[1], fichier: m[2], parties: {} } : null;
    attente = null;
    if (!m) continue;
    const s = /fichier supprimé, (\d+) lignes, empreinte `([0-9a-f]{12})`/.exec(m[3]);
    if (s) Object.assign(bloc, { supprime: true, taille: Number(s[1]), empreinte: s[2] });
    blocs.push(bloc);
    continue;
  }
  const cloture = /^(`{3,})/.exec(l)?.[1];
  if (cloture) {
    const f = lignes.indexOf(cloture, i + 1);
    if (bloc && attente) bloc.parties[attente] = lignes.slice(i + 1, f).join("\n");
    attente = null;
    i = f;
    continue;
  }
  if (!bloc) continue;
  for (const [motif, nom] of MARQUES) {
    const m = motif.exec(l);
    if (!m) continue;
    attente = nom;
    if (nom === "de") Object.assign(bloc, { taille: Number(m[1]), empreinte: m[2] });
  }
}

// 1. Les blocs, en mémoire.
const occurrences = (texte, morceau) => texte.split(morceau).length - 1;
const choisis = blocs.filter((b) => choix.length === 0 || choix.some((p) => (/^[A-Z]+$/.test(p) ? b.id.startsWith(p) : b.id === p)));
const textes = new Map(); // fichier → contenu (null : supprimé)
const nouveaux = [];
const fautes = [];
const lire = (f) => (textes.has(f) ? textes.get(f) : existsSync(f) ? readFileSync(f, "utf8") : null);
for (const b of choisis) {
  const p = b.parties;
  const t = lire(b.fichier);
  const faute = (motif) => fautes.push(`${b.id} — ${b.fichier} : ${motif}`);
  if ("entier" in p) {
    if (t === `${p.entier}\n`) faute("déjà appliqué : le fichier existe, avec ce texte");
    else if (t !== null) faute("le fichier existe déjà, avec un autre texte");
    else {
      textes.set(b.fichier, `${p.entier}\n`);
      nouveaux.push(b.fichier);
    }
    continue;
  }
  if (t === null) {
    faute(b.supprime ? "déjà appliqué, ou fichier absent : il n'y a rien à supprimer" : "fichier absent");
    continue;
  }
  if (b.supprime) {
    const taille = t.split("\n").length - 1;
    if (taille !== b.taille || empreinte(t) !== b.empreinte) faute(`fichier de ${taille} lignes, empreinte ${empreinte(t)} : il a changé, le relire avant de le supprimer`);
    else textes.set(b.fichier, null);
  } else if ("ancien" in p && "nouveau" in p) {
    const n = occurrences(t, p.ancien);
    // Déjà appliqué : « Nouveau » contient « Ancien » (un texte ajouté à côté d'un repère gardé) et s'y trouve déjà, le
    // rejouer l'ajouterait une seconde fois ; ou « Nouveau » est en place et « Ancien » n'y est plus (sauf si « Nouveau »
    // n'est qu'un morceau d'« Ancien » : sa présence ne prouve alors rien, et la faute dit seulement « Ancien » absent).
    const enPlace = p.nouveau !== "" && t.includes(p.nouveau);
    if (enPlace && p.nouveau.includes(p.ancien)) faute("déjà appliqué : « Nouveau » est en place, le rejouer le doublerait");
    else if (enPlace && n === 0 && !p.ancien.includes(p.nouveau)) faute("déjà appliqué : « Nouveau » est en place, « Ancien » n'y est plus");
    else if (n !== 1) faute(`« Ancien » trouvé ${n} fois, attendu une`);
    else textes.set(b.fichier, t.replace(p.ancien, () => p.nouveau));
  } else if ("lignes" in p) {
    const morceau = `${p.lignes}\n`;
    const n = occurrences(`\n${t}`, `\n${morceau}`);
    if (n !== 1) faute(`lignes à retirer trouvées ${n} fois, attendu une${n === 0 ? " (déjà retirées ?)" : ""}`);
    else textes.set(b.fichier, `\n${t}`.replace(`\n${morceau}`, () => "\n").slice(1));
  } else if ("de" in p && "jusqua" in p) {
    const ls = t.split("\n");
    const commence = (prefixe) => (l) => l.trimStart().startsWith(prefixe);
    const departs = ls.flatMap((l, i) => (commence(p.de)(l) ? [i] : []));
    const arrivee = departs.length === 1 ? ls.findIndex((l, i) => i > departs[0] && commence(p.jusqua)(l)) : -1;
    if (departs.length === 0 && "place" in p && t.includes(p.place)) faute("déjà appliqué : le texte « À la place » est en place");
    else if (departs.length !== 1) faute(`première ligne du bloc trouvée ${departs.length} fois, attendu une${departs.length === 0 ? " (déjà retiré ?)" : ""}`);
    else if (arrivee < 0) faute("ligne de fin du bloc introuvable");
    else {
      const retire = ls.slice(departs[0], arrivee);
      const e = empreinte(`${retire.join("\n")}\n`);
      if (retire.length !== b.taille || e !== b.empreinte) faute(`bloc de ${retire.length} lignes, empreinte ${e} : attendu ${b.taille} lignes, empreinte ${b.empreinte} ; le bloc a changé, le relire`);
      else textes.set(b.fichier, [...ls.slice(0, departs[0]), ...("place" in p ? p.place.split("\n") : []), ...ls.slice(arrivee)].join("\n"));
    }
  } else if ("fin" in p) {
    if (t.includes(p.fin)) faute("déjà appliqué : le texte est déjà dans le fichier");
    else textes.set(b.fichier, `${t.replace(/\n*$/, "\n")}\n${p.fin}\n`);
  } else faute(`bloc sans opération reconnue (${Object.keys(p).join(", ") || "aucune marque"})`);
}
if (choisis.length === 0) fautes.push("aucun bloc choisi");

// 2. Ce que l'écriture suppose, vérifié avant elle.
const git = (args, entree) => execFileSync("git", args, { encoding: "utf8", input: entree ?? "", stdio: ["pipe", "pipe", "pipe"] }).trim();
const tente = (action) => {
  try {
    return action();
  } catch (e) {
    return e;
  }
};
const supprimes = [...textes].filter(([, texte]) => texte === null).map(([f]) => f);
const ecrits = [...textes].filter(([, texte]) => texte !== null);
if (fautes.length === 0) {
  const racine = tente(() => git(["rev-parse", "--show-toplevel"]));
  if (racine instanceof Error || realpathSync(racine) !== realpathSync(".")) fautes.push("à lancer depuis la racine du dépôt git");
  else {
    for (const f of supprimes) if (tente(() => git(["ls-files", "--error-unmatch", "--", f])) instanceof Error) fautes.push(`${f} : à supprimer, mais git ne le suit pas`);
    for (const f of nouveaux) if (!(tente(() => git(["check-ignore", "-q", "--", f])) instanceof Error)) fautes.push(`${f} : fichier nouveau, mais git l'ignore`);
    const verrou = git(["rev-parse", "--git-path", "index.lock"]);
    if (supprimes.length + nouveaux.length > 0 && existsSync(verrou)) fautes.push(`l'index de git est verrouillé (${verrou}) : un autre git tourne, ou son verrou est resté`);
    for (const f of [...ecrits.map(([f]) => f), ...supprimes])
      if (tente(() => accessSync(existsSync(f) ? f : dirname(f), constants.W_OK)) instanceof Error) fautes.push(`${f} : pas d'accès en écriture`);
  }
}
if (fautes.length > 0) {
  console.error(`${fautes.length} faute(s), rien n'est écrit :\n${fautes.map((f) => `  ${f}`).join("\n")}`);
  process.exit(1);
}

// 3. L'index d'abord, en une commande ; puis le disque.
if (supprimes.length + nouveaux.length > 0) {
  const index = ["update-index", "--add"];
  for (const f of nouveaux) index.push("--cacheinfo", `100644,${git(["hash-object", "-w", "--path", f, "--stdin"], textes.get(f))},${f}`);
  if (supprimes.length > 0) index.push("--force-remove", "--", ...supprimes);
  const r = tente(() => git(index));
  if (r instanceof Error) {
    console.error(`git update-index a échoué, rien n'est écrit :\n${String(r.stderr ?? r.message).trim()}`);
    process.exit(1);
  }
}
const faits = [];
try {
  for (const [fichier, texte] of ecrits) {
    writeFileSync(fichier, texte);
    faits.push(fichier);
  }
  for (const fichier of supprimes) {
    rmSync(fichier);
    faits.push(fichier);
  }
} catch (e) {
  console.error(`ÉCRITURE INTERROMPUE après ${faits.length} fichier(s) sur ${textes.size} : ${e.message}\nDéjà écrits : ${faits.join(" ") || "aucun"}. L'arbre est à moitié écrit : ne pas relancer, l'écrire à l'architecte.`);
  process.exit(2);
}
console.log(`${choisis.length} blocs appliqués (${choisis.map((b) => b.id).join(" ")}), ${textes.size} fichiers`);
````
<!-- fin : appliquer.mjs -->

Ce qu'il rend : `7 blocs appliqués (B1 … B7), 3 fichiers` au § 1 ; `42 blocs appliqués (S1 … S42), 14 fichiers` au § 2 ; `42 blocs appliqués (R1 … R41 N1), 11 fichiers` au § 3. Lancé sans préfixe sur un arbre neuf, `91 blocs appliqués`, 27 fichiers. Un bloc déjà appliqué ne s'applique pas deux fois : relancé, le script le nomme et n'écrit rien.

### § 6 — Livrer

1. « Vérification », points 1 à 6.
2. Commit (`git add -A`, les deux fichiers supprimés et le fichier nouveau compris), push, PR vers `main` hors brouillon, sans `à-fusionner` (décision 10). Dans le corps de la PR : ce que la suite a rendu, avant et après ; la sortie de `git grep -il codeowners -- skills scripts README.md .claude-plugin` ; le résultat de l'essai du retrait ; les sections de la revue de ticket et de `/security-review` ; les six points de « Ce qui n'a pas été établi », pour que l'architecte les lise à la contre-revue.
3. Écrire à l'architecte dès la PR livrée, puis s'arrêter.

**Règle de repli.** `main` n'est plus à `a3c2a7c`, ou bouge entre l'ouverture et la fusion :

- **Avant d'appliquer** : `git diff --stat a3c2a7c origin/main -- <les fichiers de « Fichiers chauds »>`. Rien : le ticket s'applique tel quel, et l'empreinte de l'arbre vaut pour ces fichiers. Quelque chose : lancer le script quand même, il dit quels blocs ne s'appliquent plus. Pour chacun, lire `git diff a3c2a7c origin/main -- <fichier>`, retrouver le texte déplacé ou récrit, faire le retrait à la main dans l'esprit du bloc (ce qu'il retire est dit dans sa phrase), et le dire dans la PR, bloc par bloc. Les autres blocs s'appliquent par leurs préfixes (`node appliquer.mjs "$TICKET" S1 S2 …`). Un bloc qui retirerait autre chose que CODEOWNERS (un texte qu'un autre ticket a mêlé au sien) ne se joue pas : l'écrire à l'architecte.
- **Le banc ajouté en fin de `scripts/depot.test.mjs`** (B4) s'ajoute après ce que d'autres tickets y auront ajouté : pas de conflit de sens.
- **Après la PR ouverte** : fusionner `origin/main` dans la branche par un commit de fusion (jamais de rebase, de push forcé ni d'`--amend`), reprendre la version (décision 9), remonter la note en tête, puis « Vérification » à nouveau. Le test « CODEOWNERS n'est plus nommé… » dit si le `main` reçu a réintroduit une mention ; le test du compte des clés dit si une clé est entrée.

## Surfaces

| Surface | Preuve |
| --- | --- |
| CODEOWNERS n'est plus nommé dans le plugin, hors la liste fermée de la décision 11 ; le générateur et son banc n'existent plus ; le gabarit du contrat n'a plus de clé `proprietaires` ni de gate rapide sous `scripts/github/`, et garde `scripts/github/**` parmi ses chemins sensibles ; le `CONTENU.md` du socle dit le compte des clés du gabarit | `scripts/depot.test.mjs` « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » |
| le lecteur du banc reconnaît chaque forme retirée, et laisse `proprietaire.sh`, « session propriétaire » et l'attente d'un humain au plafond des renvois | `scripts/depot.test.mjs` « lecteur des mentions de CODEOWNERS : entrées piégées » |
| la marche à suivre retire `.github/CODEOWNERS` seulement s'il porte l'en-tête du générateur, donné mot pour mot, et dit qu'aucun `poser` ne fait ce retrait ; le socle pose trois ADR ; l'ADR est marquée retirée, sa section « Retrait » en premier ; la liste de l'admin dit « sans « Require review from Code Owners » », et garde « Restrict deletions », « aucune liste de contournement » et « Block force pushes » | `scripts/depot.test.mjs` « le socle retire CODEOWNERS d'un projet déjà posé : le fichier seulement s'il porte l'en-tête du générateur, l'ADR marquée retirée, la règle de GitHub jamais cochée » |
| la garde de fichiers ne refuse plus l'édition de CODEOWNERS, et normalise toujours le chemin avant de juger le lockfile, un `.env`, une migration livrée | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « refusEdition normalise le chemin avant de juger : un détour (`//`, `/./`, `x/../`, `\\`) ne contourne aucun refus » |
| un refus de fusion de GitHub faute de revue approuvée sort en 3, avec le message du refus durable, et la boucle s'arrête sur un refus durable | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une fusion refusée durablement par GitHub sort en 3 et la boucle s'arrête ; branche bougée ou panne : 5 » (le cas ajouté par B6), « passer.sh : un refus de fusion 405 après un develop qui a bougé sort en 5 (course) ; le même 405 sans develop bougé, en 3 » |
| la file du capitaine n'a plus que ses autres états ; l'état `humain` du plafond des renvois est intact | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain, et ni --next ni --rouges ne la rendent », « renvois : seuls les commentaires du compte du capitaine comptent ; compte illisible, la PR attend un humain », « boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée », sans retouche ; et la suite entière de `fusionner.test.mjs`, `sujet-fusionner.test.mjs`, `github.test.mjs`, `boucle-outils.test.mjs`, verte sans les fonctions retirées |
| le faux GitHub répond encore à tout ce que les bancs lui demandent | `skills/chaine/sujet/scripts/faux-gh.test.mjs` (quatorze tests, dont « faux gh, commentairesRefuses : … »), et la suite entière |
| les bancs posés dans un projet tournent hors du plugin, celui du check `PR titre` compris, sans le générateur | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » |
| `chaine-de-production.md`, le fragment de `CLAUDE.md`, `chantier/SKILL.md`, `fusionner/SKILL.md`, le `CONTENU.md` de `fusionner`, `README.md`, les quatre scripts du capitaine et le faux GitHub ne décrivent plus l'attente d'un propriétaire | « CODEOWNERS n'est plus nommé… » (aucun n'est dans sa liste fermée) |
| les textes du socle gardés dans la liste fermée (`SKILL.md`, `CONTENU.md`, `admin.md`) ne nomment CODEOWNERS que pour dire le retrait | lus en contre-revue : quatre lignes en tout (une dans `SKILL.md`, deux dans `CONTENU.md`, une dans `admin.md`) |
| le retrait dans un projet : fichier généré retiré, fichier écrit à la main laissé | essai réel sur deux dépôts jouets (« Vérification ») |
| l'arbre obtenu est celui que ce ticket a vérifié | `git write-tree` après `git add -A`, avant le § 4 : `5fde574ba0ae0d0d77dcf2560a10d6774e764777` (si `main` est à `a3c2a7c`) |
| la version et la note | `scripts/depot.test.mjs` « la règle d'ascendance du plugin 7.16.0 : version, note de version en tête… » ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

### Pour la session

1. **Le départ** (§ 0) : `pnpm install --frozen-lockfile && pnpm test` sur `origin/main`, vert ; relever le compte (1 072 tests sur `a3c2a7c`).
2. **Le banc, vu rouge** (§ 1, après `node "$TMPDIR/appliquer.mjs" "$TICKET" B`) : les deux commandes de la fin du § 1 rendent **3 rouges** (deux de `scripts/depot.test.mjs`, un de `regles.test.mjs`), puis **2 rouges** (les deux tests du refus durable de `fusionner.test.mjs` : le message, et le cas du refus faute de revue, qui sort encore en 7). Cinq rouges, ceux-là.
3. **Le vert** (§§ 2 à 4) : `pnpm test`, vert, **le compte du départ moins 27** (1 045 sur `a3c2a7c`).
4. **L'arbre.** Avant le § 4, `git add -A && git write-tree` rend `5fde574ba0ae0d0d77dcf2560a10d6774e764777` si la branche part de `a3c2a7c` ; sinon, `git diff --stat a3c2a7c origin/main -- <fichiers chauds>` dit sur quels fichiers l'empreinte ne vaut plus. `git diff --stat origin/main`, après le § 4 : 29 fichiers, dont 2 supprimés et 1 nouveau, ceux de « Fichiers chauds » :

   ```text
   .claude-plugin/plugin.json                         |   2 +-
   NOTES-DE-VERSION.md                                |  18 ++
   README.md                                          |   4 +-
   scripts/depot.test.mjs                             |  77 ++++++--
   scripts/points-d-entree.test.mjs                   |   1 -
   scripts/poses.test.mjs                             |  28 +--
   skills/chaine/chantier/SKILL.md                    |   2 +-
   skills/chaine/fusionner/SKILL.md                   |   4 +-
   skills/chaine/fusionner/references/CONTENU.md      |   6 +-
   skills/chaine/fusionner/scripts/boucle.sh          |   8 +-
   skills/chaine/fusionner/scripts/file.sh            |  31 +--
   skills/chaine/fusionner/scripts/fusionner.test.mjs | 209 +--------------------
   skills/chaine/fusionner/scripts/github.sh          |  75 --------
   skills/chaine/fusionner/scripts/passer.sh          |  35 +---
   skills/chaine/fusionner/scripts/veille.test.mjs    |   9 -
   skills/chaine/socle-chaine-de-production/SKILL.md  |  19 +-
   .../references/CONTENU.md                          |  14 +-
   .../socle-chaine-de-production/references/admin.md |  15 +-
   .../references/adr/ADR_ALL_ARC-N-codeowners.md     |   6 +-
   .../references/agent/regles.mjs                    |  12 +-
   .../references/agent/regles.test.mjs               |  20 +-
   .../references/chaine.json                         |   6 +-
   .../references/docs-agents/chaine-de-production.md |   4 +-
   .../references/fragments/claude-md-fusion.md       |   1 -
   .../references/retrait-codeowners.md               |  13 ++
   .../references/scripts/github/codeowners.mjs       | 147 ---------------
   .../references/scripts/github/codeowners.test.mjs  | 146 --------------
   skills/chaine/sujet/scripts/faux-gh.mjs            |  52 ++---
   skills/chaine/sujet/scripts/faux-gh.test.mjs       |   4 +-
   29 files changed, 172 insertions(+), 796 deletions(-)
   ```

   `git grep -il codeowners -- skills scripts README.md .claude-plugin` rend sept fichiers, ceux de la décision 11 ; `wc -l` : `skills/chaine/socle-chaine-de-production/SKILL.md` 88 (91 avant), `skills/chaine/fusionner/SKILL.md` 122 (124 avant), `skills/chaine/chantier/SKILL.md` 128, inchangé.
5. **Les mutations** : le script ci-dessous, tiré par ses bornes comme celui du § 5, lancé depuis la racine : **13 rouges sur 13**, témoin vert. Il remet chaque fichier après sa mutation ; `git status --short` est le même avant et après.
6. **L'essai réel du retrait**, sur deux dépôts jouets, avec les mots de N1 : les commandes ci-dessous. Un fichier écrit par `codeowners.mjs` d'`origin/main` est retiré, un fichier écrit à la main reste. Le résultat va dans le corps de la PR.
7. Revue de ticket (ses trois axes), puis `/security-review` sur la branche ; leurs sections dans le corps de la PR.
8. La PR vise `main`, hors brouillon, **sans `à-fusionner`** (`Label: contre-revue`) ; la session écrit à l'architecte dès sa PR livrée. Elle part d'`origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

### Ce qui a été joué en écrivant ce ticket

Le 2026-11-19, sous Node 22.23.4, sur un clone neuf d'`origin/main` à `a3c2a7c`, dans un dossier temporaire privé, retiré ensuite. Ce fichier a été lu par le script du § 5, tiré de lui par ses bornes ; ce qui suit est le résultat de ce texte, pas d'un brouillon.

- **Le départ.** `pnpm install --frozen-lockfile && pnpm test` sur `a3c2a7c` : 1 072 tests, 1 071 verts et un hors délai. « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (`scripts/poses.test.mjs`) a atteint son plafond de 600 s : la machine, quatre cœurs, jouait au même moment les suites d'autres sessions (charge de 13 à 28). Rejoué seul sur `a3c2a7c`, sous une charge de 16 : même plafond, 601 s. Ce banc n'est pas en cause, et ce ticket n'y change que deux fichiers posés en moins.
- **Le banc, vu rouge.** Après les sept blocs `B` : 144 tests, 3 rouges (171 lignes dans 20 fichiers nommées par le premier), puis 2 rouges de `fusionner.test.mjs` ; les cinq attendus.
- **Les blocs.** Sur un clone neuf, en trois lancements du script tiré de ce fichier par ses bornes : 7 blocs et 3 fichiers, 42 et 14, 42 et 11 ; `git write-tree` : `5fde574ba0ae0d0d77dcf2560a10d6774e764777`. Sur deux autres clones neufs, en un lancement : même arbre. Relancé sur un arbre déjà transformé : rien n'est écrit, les blocs sont nommés. `bash -n` des quatre scripts du capitaine, `node --check` de chaque `.mjs` touché, `JSON.parse` du gabarit : sans faute.
- **La suite après les §§ 1 à 3** : **1 045 tests** (1 072 − 31 + 4), 1 043 verts, 2 rouges dus à la charge, hors de ce que le ticket change : le même banc des fichiers posés, au même plafond de 600 s, et « ticket 33, contre-relecture C1 : ce qui suit un mot à expansion se relit en temps et mémoire linéaires » de `regles.test.mjs`, qui compare deux durées (« 0,027 s puis 0,552 s »). Rejoués seuls sur l'arbre transformé : `regles.test.mjs` 85 sur 85, deux fois ; `scripts/poses.test.mjs` vert en 593 s.
- **La version et la note**, jouées avec 7.32.0 en exemple : `scripts/depot.test.mjs` et `regles.test.mjs`, 144 sur 144 ; `git diff --stat a3c2a7c` : 29 fichiers, 172 insertions, 796 retraits.
- **Les mutations** : 13 rouges sur 13, témoin vert ; `git status --short` identique avant et après.
- **L'essai du retrait** : les cinq lignes attendues.
- **Non attendu** : un dernier lancement de la suite entière sur l'arbre final (blocs, version et note), parti sous une charge retombée à 6, n'était pas fini quand la rédaction a été arrêtée. **Une suite entière verte d'un seul tenant n'a donc pas été vue** : chaque test l'a été, deux d'entre eux à part.

### Le script des mutations

<!-- début : mutations.mjs -->
````js
#!/usr/bin/env node
// Mutations du retrait de CODEOWNERS (ticket 54). Usage, depuis la racine du dépôt, le ticket appliqué :
//   node mutations.mjs
// D'abord le témoin : les quatre bancs, sans mutation, sont verts. Puis chaque mutation est jouée seule : le fichier
// est modifié, le banc nommé est lancé, le fichier est remis.
// « rouge » : un banc au moins échoue, la mutation est vue. Sortie 1 si une mutation survit, ne s'applique pas ou
// reste sans verdict (banc non fini).
// Les treize premières sont celles du ticket rejoué ; les dix-huit suivantes (T…, X…), celles que le premier tour de
// relecture a vues vertes ; les dernières (N…) éprouvent ce que ce tour a fait ajouter.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SOCLE = "skills/chaine/socle-chaine-de-production";
const REF = `${SOCLE}/references`;
const FUSIONNER = "skills/chaine/fusionner";
const LANCEMENT = "skills/chaine/architecte/references/lancement.md";
const DEPOT = ["scripts/depot.test.mjs"];
const REGLES = [`${REF}/agent/regles.test.mjs`];
const REFUS = ["--test-name-pattern=fusion refusée durablement|refus de fusion 405", `${FUSIONNER}/scripts/fusionner.test.mjs`];
const SAUT = ["--test-name-pattern=que passer.sh rend en 7", `${FUSIONNER}/scripts/fusionner.test.mjs`];
const NORMALISE = "  const c = posix.normalize(chemin.replace(/\\\\/g, '/')).replace(/^(\\.\\/)+/, '');";
const AVANT_LE_CLASSEMENT = "  # La branche ou develop a bougé (409,";
const MUTATIONS = [
  ["le README nomme de nouveau le fichier", "README.md", "une CI minimale, la méthode et trois ADR |", "une CI minimale, un `.github/CODEOWNERS`, la méthode et trois ADR |", DEPOT],
  ["refusEdition ne normalise plus le chemin", `${REF}/agent/regles.mjs`, NORMALISE, "  const c = chemin.replace(/\\\\/g, '/').replace(/^(\\.\\/)+/, '');", REGLES],
  ["refusEdition refuse de nouveau l'édition du fichier", `${REF}/agent/regles.mjs`, NORMALISE, `${NORMALISE}\n  if (/^(\\.github\\/|docs\\/)?codeowners$/i.test(c)) return \`\${c} ne s'édite pas\`;`, REGLES],
  ["l'ADR redevient acceptée", `${REF}/adr/ADR_ALL_ARC-N-codeowners.md`, "- Statut : **retirée** par", "- Statut : **accepté** ; retirée par", DEPOT],
  ["la clé revient dans le gabarit du contrat", `${REF}/chaine.json`, '  "criteresRevue":', '  "proprietaires": [],\n  "criteresRevue":', DEPOT],
  ["scripts/github/** n'est plus un chemin sensible", `${REF}/chaine.json`, '"scripts/github/**", ', "", DEPOT],
  ["l'en-tête du générateur change dans la marche à suivre", `${REF}/retrait-codeowners.md`, "(cheminsSensibles, proprietaires) : ne pas éditer.", ": ne pas éditer.", DEPOT],
  ["l'état revient dans l'en-tête de file.sh", `${FUSIONNER}/scripts/file.sh`, "#   humain              PR déjà renvoyée", "#   attend un propriétaire\n#   humain              PR déjà renvoyée", DEPOT],
  ["la liste de l'admin fait cocher la règle", `${REF}/admin.md`, "**sans** « Require review from Code Owners »", "avec « Require review from Code Owners »", DEPOT],
  ["le compte des clés reste à huit", `${REF}/CONTENU.md`, "Sept clés, et rien d'autre,", "Huit clés, et rien d'autre,", DEPOT],
  ["le socle numérote encore quatre ADR", `${SOCLE}/SKILL.md`, "trois fois, de suite", "quatre fois, de suite", DEPOT],
  ["un refus faute de revue est de nouveau sauté (sortie 7)", `${FUSIONNER}/scripts/passer.sh`, AVANT_LE_CLASSEMENT, `  if grep -qi 'approving review' <<<"$message"; then sortir 7 "attend une approbation"; fi\n${AVANT_LE_CLASSEMENT}`, REFUS],
  ["le refus durable dit encore « ni pour la revue »", `${FUSIONNER}/scripts/passer.sh`, "pour une autre raison qu'une branche qui a bougé (droit du compte, règle du dépôt, revue exigée, méthode de fusion) :", ", ni pour la revue ni pour une branche qui a bougé (droit du compte, règle du dépôt, méthode de fusion) :", REFUS],
  // Les dix-huit que le premier tour de relecture a vues vertes.
  ["T1 le skill du socle redemande les propriétaires (question 4 revenue)", `${SOCLE}/SKILL.md`, "\n\nRien d'autre : les branches sont", "\n4. **Propriétaires des chemins sensibles** — les comptes GitHub qui approuvent une PR qui touche un chemin sensible : `proprietaires` du contrat, d'où `.github/CODEOWNERS` est généré.\n\nRien d'autre : les branches sont", DEPOT],
  ["T2 l'étape 3 du socle rejoue pnpm check:codeowners", `${SOCLE}/SKILL.md`, "\nnode --test scripts/github/*.test.mjs", "\npnpm check:codeowners     # .github/CODEOWNERS suit le contrat\nnode --test scripts/github/*.test.mjs", DEPOT],
  ["T3 le socle pose de nouveau l'ADR CODEOWNERS (étape 8)", `${SOCLE}/SKILL.md`, "`ADR_ALL_ARC-N-recette-humaine.md` → `docs/adr/", "`ADR_ALL_ARC-N-recette-humaine.md`, `ADR_ALL_ARC-N-codeowners.md` → `docs/adr/", DEPOT],
  ["T4 la liste de l'admin retrouve une case « CODEOWNERS respecté » qui fait cocher la règle", `${REF}/admin.md`, "- [ ] **« Block force pushes »**", "- [ ] **CODEOWNERS respecté** : sur `develop` et `main`, cocher « Require review from Code Owners ».\n- [ ] **« Block force pushes »**", DEPOT],
  ["T5 le CONTENU.md du socle redécrit le générateur", `${REF}/CONTENU.md`, "## Les labels — `labels.sh`", "## CODEOWNERS — `scripts/github/codeowners.mjs`\n\nGénère `.github/CODEOWNERS` depuis le contrat.\n\n## Les labels — `labels.sh`", DEPOT],
  ["T6 la marche à suivre dit que le capitaine saute la PR (sortie 7) au lieu de s'arrêter", `${REF}/retrait-codeowners.md`, "il s'arrête sur ce refus (`passer.sh`, sortie 3, `ARRÊT`), et le dit.", "il la saute (`passer.sh`, sortie 7).", DEPOT],
  ["T7 fusionner/SKILL.md ne range plus la revue exigée parmi les refus durables", `${FUSIONNER}/SKILL.md`, "(droit, règle du dépôt, revue exigée, méthode interdite)", "(droit, règle du dépôt, méthode interdite)", DEPOT],
  ["T8 chantier/SKILL.md refait attendre un propriétaire, sans un mot du lecteur d'avant", "skills/chaine/chantier/SKILL.md", "avant le réveil suivant. Pour un ticket `Label: contre-revue`", "avant le réveil suivant. Sauf une PR qui touche un chemin possédé : elle attend l'approbation d'un propriétaire humain, la vague peut s'y arrêter. Pour un ticket `Label: contre-revue`", DEPOT],
  ["T9 le README annonce encore quatre ADR", "README.md", "une CI minimale, la méthode et trois ADR |", "une CI minimale, la méthode et quatre ADR |", DEPOT],
  ["T11 CONTENU.md compte encore quatre gabarits d'ADR posés", `${REF}/CONTENU.md`, "Trois gabarits, numérotés", "Quatre gabarits, numérotés", DEPOT],
  ["T12 admin.md perd « Pas de règle de PR sur sujet/* »", `${REF}/admin.md`, " Pas de règle de PR sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR : elle bloquerait la chaîne.", "", DEPOT],
  ["T13 le fragment de CLAUDE.md retrouve sa ligne, sans un mot du lecteur d'avant", `${REF}/fragments/claude-md-fusion.md`, "- **`fusion-bloquée`** :", "- **Chemin sensible = relu par un humain, tenu par GitHub** : une PR qui touche un chemin sensible attend l'approbation d'un propriétaire, et le capitaine l'attend sans la renvoyer.\n- **`fusion-bloquée`** :", DEPOT],
  ["T14 la marche à suivre ne fait plus relancer le capitaine (point 4)", `${REF}/retrait-codeowners.md`, " Relancer chaque capitaine une fois cette PR entrée dans `develop`.", "", DEPOT],
  ["T15 la description du skill du socle annonce quatre ADR", `${SOCLE}/SKILL.md`, "la méthode docs/agents/chaine-de-production.md et trois ADR", "la méthode docs/agents/chaine-de-production.md et quatre ADR", DEPOT],
  ["T17 le skill fusionner redécrit l'attente, sans un mot du lecteur d'avant", `${FUSIONNER}/SKILL.md`, "La file lit la CI de chaque PR : états dans l'en-tête de `file.sh`.", "**Une PR qui attend l'approbation d'un propriétaire** n'est ni rouge ni renvoyée : le capitaine la saute et la reprend au tour suivant.\n\nLa file lit la CI de chaque PR : états dans l'en-tête de `file.sh`.", DEPOT],
  ["X2 un refus « owner review » est de nouveau sauté (sortie 7)", `${FUSIONNER}/scripts/passer.sh`, AVANT_LE_CLASSEMENT, `  if grep -qi 'owner review' <<<"$message"; then sortir 7 "attend une approbation"; fi\n${AVANT_LE_CLASSEMENT}`, REFUS],
  ["X6 boucle.sh s'arrête sur une sortie 7 de passer.sh au lieu de sauter la PR", `${FUSIONNER}/scripts/boucle.sh`, '    7) sautees="$sautees$n " ;; # rien', '    7) echo "ARRÊT sur #$n (sortie 7)"; exit 7 ;; # rien', SAUT],
  ["X8 le refus durable ne ramène plus le worktree sur origin/develop", `${FUSIONNER}/scripts/passer.sh`, '  git switch -q --detach origin/develop\n  git branch -q -D "capitaine/$N" 2>/dev/null || true\n  sortir 3 "fusion refusée par GitHub pour', '  sortir 3 "fusion refusée par GitHub pour', REFUS],
  // Ce que le premier tour de relecture a fait ajouter.
  ["N1 le CONTENU.md du socle refait cocher la règle, à nombre de lignes égal", `${REF}/CONTENU.md`, "« Require review from Code Owners » ne se coche pas", "« Require review from Code Owners » sur develop et main", DEPOT],
  ["N2 la liste de l'admin fait cocher la règle sur main, sur la ligne même qui la retire", `${REF}/admin.md`, " ; « Require status checks to pass »", ", puis « Require review from Code Owners » sur `main` ; « Require status checks to pass »", DEPOT],
  ["N3 la liste de l'admin exige une approbation", `${REF}/admin.md`, "**« Required approvals » à 0**", "**« Required approvals » à 1**", DEPOT],
  ["N4 lancement.md redit que la frontière est la protection de GitHub", LANCEMENT, ", et aucune n'arrête ce qu'un compte de confiance fait entrer (« Ce que ces règles ne tiennent pas »).", " : la frontière reste la protection de GitHub.", DEPOT],
  ["N5 le CONTENU.md de fusionner ajoute que la frontière est chez GitHub", `${FUSIONNER}/references/CONTENU.md`, "Reste, pour borner ce qu'elle atteint,", "La frontière reste la protection des branches chez GitHub. Reste, pour borner ce qu'elle atteint,", DEPOT],
  ["N6 fusionner/SKILL.md fait retirer le label devant un refus durable", `${FUSIONNER}/SKILL.md`, "Il ne retire pas ce label, n'écrit rien sur la PR hors le commentaire de passage que `passer.sh` pose et termine, et ne la renvoie pas (son auteur n'y peut rien) ;", "Il retire `à-fusionner` de cette PR pour laisser passer les autres ;", DEPOT],
  ["N7 la marche à suivre fait retirer le label devant un refus durable", `${REF}/retrait-codeowners.md`, "Le capitaine ne retire pas ce label et n'écrit rien sur la PR, hors le commentaire de passage que `passer.sh` pose et termine ;", "Le capitaine retire `à-fusionner` de cette PR pour laisser passer les autres ;", DEPOT],
  ["N8 l'ADR porte deux sections « Retrait » (un bloc rejoué)", `${REF}/adr/ADR_ALL_ARC-N-codeowners.md`, "\n## Contexte\n", "\n## Retrait\n\n## Contexte\n", DEPOT],
  ["N9 le banc du capitaine redécrit l'état retiré", `${FUSIONNER}/scripts/fusionner.test.mjs`, "\nconst PERIMETRE = ", "\n// file.sh : une PR vers develop qui attend un propriétaire\nconst PERIMETRE = ", DEPOT],
  ["N10 le banc du refus durable perd le cas de la revue d'un propriétaire du code", `${FUSIONNER}/scripts/fusionner.test.mjs`, '    ["gh: Waiting on code owner review from @exemple. (HTTP 405)", 3, DURABLE],\n', "", DEPOT],
  ["N11 le banc des règles nomme de nouveau la commande du générateur", `${REF}/agent/regles.test.mjs`, "\nconst livree = ", "\n// pnpm codeowners régénère le fichier\nconst livree = ", DEPOT],
  ["N12 le skill du socle renvoie deux fois à la marche à suivre (un bloc rejoué)", `${SOCLE}/SKILL.md`, " Un projet posé depuis le plugin 7.13.0 peut porter", " Un projet posé depuis le plugin 7.13.0 peut porter un `.github/CODEOWNERS` généré, que le produit a retiré : [`references/retrait-codeowners.md`](references/retrait-codeowners.md). Un projet posé depuis le plugin 7.13.0 peut porter", DEPOT],
  ["N13 le fragment de CLAUDE.md retrouve son titre, sans l'attente", `${REF}/fragments/claude-md-fusion.md`, "- **`fusion-bloquée`** :", "- **Chemin sensible = relu par un humain, tenu par GitHub** : GitHub exige l'accord d'un second compte.\n- **`fusion-bloquée`** :", DEPOT],
];

const env = Object.fromEntries(Object.entries(process.env).filter(([cle]) => cle !== "NODE_TEST_CONTEXT"));
const jouer = (bancs) => spawnSync(process.execPath, ["--test", ...bancs], { env, stdio: "ignore", timeout: 900_000 }).status;
// Le témoin : sans mutation, chaque banc est vert. Sinon un rouge ne dirait rien.
for (const bancs of [DEPOT, REGLES, REFUS, SAUT]) {
  if (jouer(bancs) === 0) continue;
  console.log(`TÉMOIN ROUGE : ${bancs.at(-1)} échoue sans mutation, aucune mutation jouée`);
  process.exit(1);
}
let survivantes = 0;
for (const [nom, fichier, ancien, nouveau, bancs] of MUTATIONS) {
  const texte = readFileSync(fichier, "utf8");
  if (texte.split(ancien).length !== 2) {
    console.log(`INAPPLICABLE  ${nom} (${fichier})`);
    survivantes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(ancien, () => nouveau));
  let statut;
  try {
    statut = jouer(bancs);
  } finally {
    writeFileSync(fichier, texte);
  }
  // Statut nul : le banc n'a pas fini (délai dépassé, signal). Ce n'est pas un rouge.
  if (statut === 0 || statut === null) survivantes++;
  console.log(`${statut === 0 ? "VERT (survit)" : statut === null ? "SANS VERDICT " : "rouge        "}  ${nom}`);
}
console.log(`${MUTATIONS.length - survivantes} rouges sur ${MUTATIONS.length}`);
process.exit(survivantes === 0 ? 0 : 1);
````
<!-- fin : mutations.mjs -->

```bash
awk '/^<!-- début : mutations.mjs -->$/ { f = 1; next } /^<!-- fin : mutations.mjs -->$/ { f = 0 } f' "$TICKET" | grep -v '^````' > "$TMPDIR/mutations.mjs"
node "$TMPDIR/mutations.mjs"        # depuis la racine du dépôt, le ticket appliqué
```

### L'essai du retrait

```bash
# L'essai du retrait, sur deux dépôts jouets. Depuis la racine du dépôt du plugin, le ticket appliqué.
PLUGIN=$PWD
N1=$PLUGIN/skills/chaine/socle-chaine-de-production/references/retrait-codeowners.md
R=$(mktemp -d)
jouet() { git init -q "$R/$1" && cd "$R/$1" && git config user.name essai && git config user.email essai@example.invalid; }
# 1. Un fichier écrit par le générateur d'origin/main : la première ligne est celle du point 1, il est retiré.
jouet genere
mkdir -p .claude scripts/github
git -C "$PLUGIN" show origin/main:skills/chaine/socle-chaine-de-production/references/scripts/github/codeowners.mjs > scripts/github/codeowners.mjs
printf '{"cheminsSensibles":["scripts/agent/**","apps/api/src/auth/"],"proprietaires":["@exemple-une","@exemple/relecteurs"]}\n' > .claude/chaine.json
node scripts/github/codeowners.mjs --ecrire
git add -A && git commit -q -m "chore: pose"
grep -cF "\`$(head -n 1 .github/CODEOWNERS)\`" "$N1"     # 1 : la ligne du point 1, au caractère près
git rm -q .github/CODEOWNERS scripts/github/codeowners.mjs && test ! -e .github/CODEOWNERS && echo "généré : retiré"
# 2. Un fichier écrit à la main : une autre première ligne, il reste.
jouet a-la-main
mkdir .github && printf '# Les nôtres\n* @exemple-une\n' > .github/CODEOWNERS
grep -cF "\`$(head -n 1 .github/CODEOWNERS)\`" "$N1"     # 0 : ce n'est pas la ligne du générateur
test -e .github/CODEOWNERS && echo "écrit à la main : laissé"
cd "$PLUGIN" && rm -rf "$R"
```

Ce qu'il rend, dans l'ordre : `codeowners : .github/CODEOWNERS régénéré depuis .claude/chaine.json`, `1`, `généré : retiré`, `0`, `écrit à la main : laissé`.

## Ce qui n'a pas été établi

- **Le texte du refus que rend GitHub** quand une règle exige une revue approuvée n'a jamais été lu sur un vrai dépôt (la liste de l'admin du ticket 50 demandait de le noter « au premier dépôt posé »). Le cas ajouté par B6 emploie un message plausible, pas un message relevé. `passer.sh` ne lit plus ce texte pour y chercher une revue ; il le classe comme tout refus : un code 409 ou 5xx, ou les mots « branch was modified », « not up to date », valent une branche bougée (sortie 5, pause puis reprise) ; tout autre refus à code HTTP est durable (sortie 3). Si GitHub rendait un refus faute de revue sous l'une des formes de la sortie 5, la boucle le reprendrait à chaque tour au lieu de s'arrêter. Rien ne le laisse penser ; rien ne le prouve.
- **L'état du réglage sur les dépôts des projets** : ce ticket ne lit aucune protection de branche. Si « Require review from Code Owners » a été cochée quelque part, seul un administrateur la décoche (N1, point 7), et jusque-là un capitaine reposé s'y arrête (décision 6).
- **Le script de contrôle de chaque projet** : la marche à suivre nomme `scripts/check.mjs`, celui du socle ; un projet qui en a un autre retire l'étape où elle est.
- **Les projets posés** : le relevé de « Ce que voit un projet » lit des clones locaux sans les rafraîchir ; un projet a pu changer depuis.
- **Le banc tient l'absence d'un mot, pas d'un comportement**, sauf pour le refus de fusion (B6) : une attente d'approbation réécrite sans aucun des mots de son lecteur passerait. Le ticket d'origine tenait les scripts du capitaine par l'égalité avec leur contenu d'avant le ticket 50 ; cette égalité n'existe plus sur `main`. Ils sont tenus par les blocs à empreinte, par l'empreinte de l'arbre, par leurs bancs restés verts, et par la contre-revue.
- **Le `main` de la livraison.** Les tickets 60, 56 et 57 entreront avant ce ticket et touchent plusieurs de ses fichiers (`fusionner/SKILL.md`, `chantier/SKILL.md`, `boucle.sh`, `fusionner.test.mjs`, `scripts/depot.test.mjs`, `plugin.json`, `NOTES-DE-VERSION.md`). Ce ticket n'a été joué que sur `a3c2a7c`. Le script dit quels blocs ne s'appliquent plus ; la règle de repli dit quoi en faire.
- **La suite entière verte en un seul lancement** n'a pas été obtenue en écrivant ce ticket (« Ce qui a été joué ») : sur la machine partagée du rejeu, `scripts/poses.test.mjs` tient à quelques secondes de son plafond de 600 s, sur `main` comme sur l'arbre transformé. La session la voit verte au point 3 de sa vérification, ou rejoue à part le banc hors délai et le dit.
- **Le relecteur neuf n'est pas encore passé** sur ce rejeu.

## Hors périmètre

- **La garde qui prend la place** : la ligne `Sensibles:` du ticket, la demande d'accord dans la carte, les trois gardes mécaniques (`A-73` à `A-76`), et l'ADR « relecture indépendante et accord des fichiers sensibles » (`A-96`). Lots 2, 5 et 6.
- **Le retrait dans les projets** : par leur architecte, avec la marche à suivre de ce ticket.
- **Les réglages GitHub** : aucune session ne les change.
- **Le relâchement de `Label: contre-revue`** : il reste exigé, et la contre-revue du conducteur reste (`chantier/SKILL.md:95`, moins ses deux phrases sur CODEOWNERS).
- **L'autre moitié du point 5 et le point 6 du § 6 de `chantier/SKILL.md`** : tickets 57 et 56.
- **Ce que le faux GitHub ne rend pas encore** (date d'ouverture d'une PR, date de modification d'un commentaire au sens d'`A-108`) : lot 5a.
- **Les notes de version déjà publiées et `docs/`** : décision 16.

## Comments

- 2026-11-18 — Rédigé sur `4a45634` (plugin 7.15.0, 738 tests) d'après `P-49`, `A-77` et le lot 1 de la spec du chantier 3. Inventaire refait par recherche (`codeowners`, `code owner`, `code_owner`, `proprietaires`, `propriétaire`, `proprietaire`, `attend un propriétaire`, `attend un humain`, `possédé`, `approbation`, sous une locale UTF-8), chaque occurrence lue. Joué sur un clone jetable : 711 tests, neuf mutations rouges, l'essai du retrait sur deux dépôts jouets. Choix du rédacteur, que la spec ne tranche pas : (1) l'ADR n'est plus posée dans un projet neuf, et le socle revient à trois ADR (décision 2) ; (2) `scripts/github/**` reste un chemin sensible (décision 3) ; (3) la normalisation du chemin reste dans `refusEdition` (décision 4) ; (4) le faux `gh` revient entier à son état d'avant le ticket 50 (décision 5) ; (5) le retrait dans un projet est une marche à suivre en référence, pas un script (décision 8) ; (6) le texte de la liste de l'admin (décision 7).

- 2026-11-18 — Architecte : ticket écrit et joué sur `origin/main` à `4a45634` (7.15.0). `main` est depuis à `1c4acb1` (7.17.0) et le programme « capitaine à jour et testé » modifie plusieurs fichiers de ce ticket (`passer.sh`, `boucle.sh`, `faux-gh.mjs`, `regles.mjs`, `chantier/SKILL.md`). **`needs-info` jusqu'au rejeu des blocs sur `main`**, une fois ses tickets chauds entrés : repères de ligne, compte de tests, numéro de version et note dans `NOTES-DE-VERSION.md` (fichier né en 7.16.0) sont à reprendre ; les décisions du ticket, elles, tiennent.

- 2026-11-19 — **Rejoué sur `origin/main` à `a3c2a7c` (plugin 7.31.0), `ready-for-agent`.** Ce que le rejeu a changé : (1) **la méthode** : le patch inverse de la PR 108 ne s'applique plus à aucun de ses onze fichiers ; le retrait est donné en quatre-vingt-onze blocs, appliqués par un script donné entier (décision 12) ; (2) **l'inventaire**, refait sur `main` : 221 lignes dans 26 fichiers avant, 64 lignes dans 7 fichiers après ; ce qui a disparu, ce qui est nouveau et ce qui a bougé est dans « Où » ; (3) **la décision 6** : un refus de fusion faute de revue devient un refus durable, sortie 3 et arrêt de la boucle, là où le ticket d'origine le rendait à la sortie 5 ; `main` classe désormais les refus de fusion, et le message « ni pour la revue » change avec ses deux tests ; (4) **la décision 5** : le faux `gh` ne revient plus à son état d'avant, il garde `commentairesRefuses` et les dates des commentaires, que le verrou du passage lit ; (5) **le socle** : le point 4 ter garde le check `PR titre`, le contrat compte sept clés et une huitième facultative, un test tient ce compte ; (6) **`chantier/SKILL.md`** : deux phrases, elles seules ; (7) **les tests** : 31 sortent toujours, 4 entrent, 5 sont modifiés dont un reçoit un cas ; 1 072 − 31 + 4 = **1 045** ; treize mutations au lieu de neuf ; (8) **la version** : la suivante de `main` au moment de livrer, mineure, avec sa note. Choix du rédacteur que rien d'écrit ne tranche, pour la contre-revue : l'arrêt en sortie 3 sur un refus faute de revue et le nouveau message (décision 6) ; ce que le faux `gh` garde (décision 5) ; mineure plutôt que majeure (décision 9) ; le test du compte des clés (décision 11) ; le titre de PR raccourci (décision 10) ; « depuis le plugin 7.13.0 » sans version de fin (décision 8) ; `Blocked by: 56, puis 57`, repris d'`A-109`.
