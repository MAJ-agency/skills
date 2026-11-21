# Spec « relecture indépendante » relue contre `main` 7.16.0

Relecture en lecture seule, le 2026-11-18 vers 19 h 40 UTC. Aucun fichier du dépôt modifié.

- Spec lue : `origin/claude/compassionate-euler-st84s9:docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (176 lignes, lue en entier).
- Référence : `origin/main` à `59b8233` (plugin 7.16.0). Sauf mention contraire, tout `fichier:ligne` ci-dessous se lit sur ce commit.
- **`main` a encore avancé pendant la relecture** : `1c4acb1`, plugin **7.17.0** (PR 112, ticket 15 de l'autre programme, fusionnée à 19 h 36 UTC). Elle ne touche aucun fichier de la chaîne (`socle-tests`, la fiche `tests.md`, `plugin.json`, `NOTES-DE-VERSION.md`, un test de `scripts/`).
- Autre programme : `origin/claude/trusting-hamilton-qsxfy7`, carte `docs/programmes/capitaine-a-jour-et-teste.programme.md` (dernière entrée du journal : 19 h 14 UTC), dix-neuf tickets. État des PR relu sur GitHub à 19 h 40 UTC.

Abréviations : `fus/` = `skills/chaine/fusionner/scripts/`, `suj/` = `skills/chaine/sujet/scripts/`, `socle/` = `skills/chaine/socle-chaine-de-production/references/`, `tic/` = `skills/chaine/tickets/references/`.

---

## 1. Repères périmés

La spec ne cite aucun numéro de ligne : rien n'est décalé au sens strict. Ce qui suit est faux, a changé de sens avec la 7.16.0, ou manque à une liste de fichiers.

| n° | Ce que dit la spec | Ce que dit `main` | Correction à écrire |
| --- | --- | --- | --- |
| R1 | `A-81`, dernière phrase, et « Vérification d'ensemble » : « une sous-PR que le capitaine a mise à jour **pour un conflit d'index** garde son verdict » | Le capitaine met à jour **toute** sous-PR en retard sur son sujet, documentation comprise, pas seulement sur conflit d'index : `suj/sujet.sh:792-812` (`controler`, puis `mettre_a_jour` dès que le verdict n'est pas `à-jour`), `suj/sujet.sh:504-553` (`mettre_a_jour_sous_pr`), `skills/chaine/fusionner/SKILL.md:24-40` | « une PR que le capitaine a mise à jour, pour un retard comme pour un conflit d'index, une ou plusieurs fois, garde son verdict » ; l'essai de la partie 6c le rejoue sur un retard sans conflit et sur deux mises à jour de suite |
| R2 | `A-91` : le capitaine juge « au moment où il la juge aujourd'hui, avant sa propre mise à jour » | Toujours avant (`fus/passer.sh:189-197` avant la boucle `:214-342` ; `suj/sujet.sh:753` avant `:811-812`), mais la mise à jour est maintenant une boucle de **trois tours au plus**, chacun avec une attente de CI jusqu'à 60 min (`fus/github.sh:271-302`), et le sommet fusionné (`$sommet`, `fus/passer.sh:286`, `:367` ; `suj/sujet.sh:808`, `:835`) n'est plus le sommet jugé (`$origine`, `fus/passer.sh:116` ; `.head.sha`, `suj/sujet.sh:729`) | Dire sur quel sommet le verdict est exigé, et s'il est relu juste avant l'appel de fusion (voir § 2.1) |
| R3 | `A-84` (tableau) : `à-fusionner` posé par le Relecteur seul ; `A-86` : une PR sans aucune des quatre étiquettes, l'auteur repose `à-relire` | Le **conducteur** retire `à-fusionner` des sous-PR d'un même sujet sauf la plus ancienne, puis le repose sur la suivante : `skills/chaine/chantier/SKILL.md:95`, `skills/chaine/fusionner/SKILL.md:40`, `NOTES-DE-VERSION.md:12`. Un test fige la phrase : `scripts/depot.test.mjs:1040` | Conflit de conception, voir § 2.3 |
| R4 | `A-94` : en régime 8, le point « contre-revue du conducteur » disparaît | Le point 5 du § 6 porte maintenant deux règles dans le même alinéa : la contre-revue **et** « une sous-PR à la fois par sujet » (`skills/chaine/chantier/SKILL.md:95`) | La partie 6b garde la seconde règle (ou la déplace), et le lot 1, qui récrit la moitié CODEOWNERS de ce même alinéa, ne la perd pas |
| R5 | `A-81` : « les trois classes que `passer.sh` (`livraison_intermediaire`) applique », et « la liste des index se lit dans `origin/B:…`, jamais dans un arbre de travail » | Les deux ne vont pas ensemble aujourd'hui. `livraison_intermediaire` (`fus/passer.sh:126-164`) lit la liste par `index_regeneres_regex` et `index_regeneres_motifs_regex` (`fus/github.sh:174-184`), qui passent par `index_json` : **l'arbre de travail d'abord**, `origin/develop` sinon (`fus/github.sh:64-67`). Et elle compare le contenu d'un index au **sommet courant** d'`origin/develop` (`fus/passer.sh:153`, `:157`), pas à la base de fusion | Le calcul de `A-81` ne réutilise pas ces fonctions telles quelles : il lui faut des lecteurs paramétrés par une ref, sur le modèle d'`ascendance` (`fus/github.sh:158-165`), et la classe « sans commande » se compare au contenu de **M**, pas au sommet d'`origin/B` (voir § 2.2) |
| R6 | `A-78` : « une commande nouvelle, `sujet.sh a-juger <n>` » | Absente de `main` (répartiteur : `suj/sujet.sh:1339-1346`). Mais le ticket 16 de l'autre programme (écrit, pas lancé) crée **la même commande avec une autre signature**, `a-juger <sommet> <base> [<n>]`, sans appel GitHub, plus `est-livraison <tête> <sommet>`, et déplace `livraison_intermediaire` de `passer.sh` vers `github.sh` (ticket 16, tableau « Où » et Décisions 4 et 5) | Une seule commande : s'aligner sur la signature du ticket 16 et le faire passer avant 3d ; `A-81` et `A-92` citeront `livraison_intermediaire` dans `github.sh` une fois le 16 entré |
| R7 | `A-84`, `A-92` : `sujet.sh livrer` pose `à-fusionner` « comme aujourd'hui » ; « qui livre repose `à-fusionner` » | Vrai sur `main` (`suj/sujet.sh:941`), mais le ticket 7 de l'autre programme (écrit, pas lancé) le retire : `livrer` n'étiquette plus, `livrer-prets` étiquette par `ETIQUETER=1` (carte, `A-41`) | Écrire qui étiquette une livraison en régime 8 une fois le ticket 7 entré |
| R8 | `A-91` : « `revue-exigee.mjs` reçoit les commentaires de la PR en plus du corps, du titre et de la base » | La CLI lit le corps, le titre et la base en arguments, les fichiers sur l'entrée standard (`fus/revue-exigee.mjs:14`, `:253-259`). Un argument trop long est refusé par le système, `passer.sh` le dit pour le corps du squash (`fus/passer.sh:364-365`). `motifSansRevue` rend `null` dès qu'aucun chemin n'exige la revue (`fus/revue-exigee.mjs:224-226`) | Les commentaires passent par un fichier, pas par un argument ; le contrôle du verdict se place **hors** de `motifSansRevue`, puisque « toute PR est concernée, documentation comprise ». Les tickets 16 (`motifsDuCapitaine`) et 18 (`motifSansSecurite`) de l'autre programme récrivent cette même CLI |
| R9 | Lot 5a : « `revue-exigee.mjs`, `passer.sh`, `sujet.sh`, les deux `depot-jouet.mjs`, bancs » | Le faux GitHub ne rend ni la date d'ouverture d'une PR (`suj/faux-gh.mjs:137-151`, pas de `created_at`), ni `updated_at` ni `author_association` d'un commentaire (`suj/faux-gh.mjs:257-262`). Or `A-97` lit la date d'ouverture et `A-80` compare `updated_at` à `created_at` | Ajouter `suj/faux-gh.mjs` et `suj/faux-gh.test.mjs` au lot 5a (ou les faire porter par 3a) ; le lot 4 ne les cite que pour « commentaires, étiquettes » |
| R10 | `A-82` : la copie de travail de la boucle « n'a que `scripts/chaine` » | Elle porte aussi `scripts/docs/identifiants.mjs`, et se reprend d'`origin/develop` à chaque tour (`fus/boucle.sh:54-60`, `:207-208`). Déjà vrai en 7.15.0 | « `scripts/chaine` et `scripts/docs/identifiants.mjs`, pris d'`origin/develop` » : le lecteur de règles de 3c vit donc sous `scripts/chaine`, et c'est la version de `develop` qui juge une sous-PR |
| R11 | « Hors périmètre » : « une PR en retard dont seul un index généré est périmé une fois fusionnée avec la base part au renvoi alors que `passer.sh` sait la réparer » | **Vers un sujet**, la 7.16.0 l'a corrigé : toute sous-PR en retard est mise à jour et ses index régénérés (`suj/sujet.sh:536-543`), `skills/chaine/fusionner/SKILL.md:24-40`. **Vers `develop`**, le chemin « CI rouge, une relance, puis renvoi » de la boucle (`traiter_rouges`, `fus/boucle.sh:227-246`) n'a pas été touché par la 7.16.0 (17 lignes changées dans `boucle.sh`, toutes pour la sortie 12) | Restreindre le défaut à `develop`. Aucun des dix-neuf tickets ne le porte (recherche de « périmé » et « CI rouge » dans ses specs et tickets : rien). Non rejoué |
| R12 | Lots 1 à 6 : aucune mention de la version ni de la note, sauf « 8.0.0 » au lot 6 | Tout ticket du plugin prend une version **et** écrit sa note en tête de `NOTES-DE-VERSION.md` : `README.md:188`, test `scripts/depot.test.mjs:1032-1041` | Ajouter `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` aux fichiers de chaque lot (voir § 3.3) |
| R13 | Vocabulaire : « Relecteur » = la session qui aiguille ; ne pas dire « relecteur » pour autre chose | `main` emploie déjà « relecteur indépendant » pour celui qui relit, dans des phrases que des tests figent : `scripts/depot.test.mjs:980-1001` (`revue-de-ticket/references/criteres-ticket.md`, `section-pr.md`, `SKILL.md`, `CONTENU.md`). Vrai depuis 7.15.0 | Le lot 3d dit ce que deviennent ces phrases et leur test (les deux skills « restent tels quels pour le régime 7 », `A-78`) |

### Repères du lot 1 sur `main`, pour les tickets en rédaction

La liste de fichiers du lot 1 est juste (chaque fichier nommé porte bien du CODEOWNERS). Lignes à 7.16.0 :

- `fus/github.sh:328-401` : `revue_proprietaires_exigee`, `proprietaires_de`, `demandes_jq`, `proprietaire_demande`, `attend_proprietaire`, `refus_pour_revue`, `MARQUE_ATTENTE`, `TEXTE_ATTENTE`, `attend_humain`, `MOTIF_PROPRIETAIRE`.
- `fus/passer.sh:45-52` (en-tête, sorties 7 et 5), `:94-96` (`attend_humain`), `:113-115` (`attend_proprietaire`), `:370-383` (refus de fusion faute d'approbation, dont une sortie 5).
- `fus/file.sh:19-35` (en-tête des états), `:147-151`, `:159-165`. L'état `humain` (plafond des renvois, `:33-35`, `:147`) ne vient pas de CODEOWNERS et reste.
- `fus/boucle.sh:7-8`, `:10-11`, `:396`.
- `fus/veille.test.mjs:166-171`.
- `suj/faux-gh.mjs:23-30`, `:148-149`, `:263`, `:300-306`.
- `socle/chaine.json:2` (commentaire), `:4` (`proprietaires`), `:19` (entrée de `gatesRapides`).
- `socle/agent/regles.mjs:42-48`, `:63-65`.
- `socle/admin.md:6` (renvoi à la case, récrit par la 7.16.0), `:26-37` (la case).
- `socle/docs-agents/chaine-de-production.md:85`.
- `skills/chaine/chantier/SKILL.md:95`.
- `scripts/points-d-entree.test.mjs:20`, `scripts/poses.test.mjs:23-29`, `:65`, `:87-100`, `scripts/depot.test.mjs:222`, `:734-760`.
- `fus/proprietaire.sh` reste, comme la spec le dit : il rend le worktree d'une branche (`:1-19`), appelé par `fus/renvoyer.sh:37`.

Repères du lot 2 : `tic/scripts/verify/tickets-regles.mjs:582-583` (la section `## Rétro` exigée), `tic/scripts/verify/tickets.mjs:17`, `tic/scripts/verify/tickets.test.mjs:73`, `tic/gabarits/carte.map.md:50`, `tic/scripts/docs/couts.test.mjs:15`, `skills/chaine/chantier/SKILL.md:113`, `socle/docs-agents/chaine-de-production.md:40`, `socle/docs-agents/pieges.md:3`. À noter : le gate ne ferme ni la liste des rôles de `## Coût` (« tout autre rôle n'est pas jugé », `tic/scripts/verify/tickets-regles.mjs:344-345`, `:358-359`) ni celle des lignes d'en-tête d'un ticket (aucun refus d'en-tête inconnu trouvé). « Accepte, sans les exiger, `Sensibles:`, `Relecture: double` et le rôle `relecture` » pourrait donc être déjà vrai : non vérifié par exécution.

---

## 2. Conflits de conception avec la 7.16.0

### 2.1 Où placer le contrôle du verdict

**`fus/passer.sh` (vers `develop`).**

1. **Contrôle d'éligibilité, avant toute CI** : dans l'étape 1, au bloc de la revue exigée, `fus/passer.sh:189-197` (`if [ "$livraison_sujet" = 0 ]`). C'est l'endroit que `A-91` vise, et il tient : il est avant la boucle des tours (`:214`). Trois précisions :
   - T est `$origine` (`:116`, lu après le `git fetch` de `:112`), pas le `head.sha` du JSON lu en `:84`.
   - B est la base de la PR. L'appel actuel passe `origin/develop` en dur (`:195`), même pour une PR empilée dont la base est une autre branche (`:176-187`).
   - Le bloc est déjà sous `livraison_sujet = 0` : la dispense de `A-92` (livraisons reconnues « comme aujourd'hui », `:118-173`) est acquise sans rien ajouter.
2. **Relecture du verdict juste avant la fusion** : à l'étape 5 bis, dans la branche `à-jour) break` (`fus/passer.sh:330`), donc entre le contrôle d'ascendance et le `PUT` (`:366-369`), avec T = `$sommet`. La 7.16.0 l'impose si `P-50` (« son script vérifie que le verdict porte sur ce qu'il fusionne ») se lit à la lettre : ce que le capitaine fusionne est `$sommet`, qu'il a construit lui-même en un à trois tours, jusqu'à trois heures après le contrôle d'éligibilité. Un push de l'auteur pendant ce temps est déjà refusé (`:321`, et le `sha` du `PUT`, `:365-369`) ; ce que rien ne relit, ce sont les étiquettes (lues une fois, `:91-93`) et les commentaires (un `refusé` tardif, une règle montée à haute, `A-90`). Ce second appel ne coûte aucune CI.

**`suj/sujet.sh`, fonction `fusionner` (vers un sujet).**

1. **Contrôle d'éligibilité** : juste après `motif=$(juger "$fichiers")` (`suj/sujet.sh:753`), avant `liens_sur_index` (`:756`). T est `$sommet` (`:729`), B est `$base` (`:722`). Cet endroit sert les deux chemins : la PR de mise à jour (`maj=1`, `:746-749`, que `A-92` n'exempte pas) et la sous-PR ordinaire. Il est avant `controler` (`:811`) : une sous-PR sans verdict est renvoyée sans mise à jour ni CI. Il ne se place pas dans la fonction `juger` (`:742`), que `juger_retouches` rappelle après les checks (`:672-675`, `:778`).
2. **Relecture juste avant la fusion** : dans la boucle `for tour` (`:813-831`), après le `controler` qui rend `à-jour` (`:826-827`) et avant le `PUT` (`:833-838`), avec T = `$sommet`, qui vaut `SOMMET_POUSSE` après une mise à jour (`:806-810`). Pour une PR de mise à jour : avant `avancer_sujet` (`:779`). Avant la 7.16.0, `fusionner` lisait les checks une fois et squashait dans la seconde ; il attend maintenant la CI jusqu'à trois fois (`:813-822`), d'où le même écart de temps que vers `develop`.
3. **Nulle part ailleurs** : ni dans `mettre_a_jour_sous_pr` (`:504-553`), qui garde déjà que la tête est celle jugée (`:509-510`, sortie 5), ni dans `rafraichir` (`:849`), que `A-92` dispense.

**Gardes des fichiers sensibles (`A-76`, lot 5b)** : mêmes deux endroits d'éligibilité (`fus/passer.sh:194-197`, `suj/sujet.sh:751-753`), sur le même diff que la revue lit (`$depart..$origine` ; base de fusion du sommet et du sujet).

**Un passage repris** est le cas où « même contenu propre » sort de la branche « V est T ». Après une sortie 5 (`fus/passer.sh:321`, `:332`, `:384` ; `suj/sujet.sh:821`, `:823`, `:828`), 8 (`suj/sujet.sh:820`) ou 3 (CI rouge relancée), le passage suivant relit tout depuis le début, et T est alors le commit de fusion du capitaine.

### 2.2 « Même contenu propre » après un commit de fusion du capitaine et des index régénérés

**Oui dans le cas ordinaire, rejoué sur trois dépôts jouets** (`<scratchpad>/verif-716/jouet`, `jouet2`, `jouet3`, avec la définition de `A-81` : V ancêtre de T, une seule base de fusion M de T et d'`origin/B`, arbre de T comparé à `git merge-tree --write-tree V M`) :

| Cas rejoué | Résultat |
| --- | --- |
| Un tour, conflit sur un index, index régénéré dans le commit de fusion | « même » (M = la cible fusionnée) |
| Le même, la cible ayant avancé ensuite sans nouvelle mise à jour | « même » (M inchangée) |
| **Deux tours** (7.16.0) : fusion de la cible, CI, la cible bouge, seconde fusion, puis un commit `docs: régénère les index…` | « même » (M = la dernière cible fusionnée) |

Cela tient parce que le capitaine n'écrit que deux sortes de commits sur la branche d'une PR : une fusion de la cible (`fus/passer.sh:220`, `:272` ; `suj/sujet.sh:518`, `:539`) et un commit d'index seuls (`fus/passer.sh:273-274`, `suj/sujet.sh:540-541`, `ajouter_index` : `fus/github.sh:218-222`). La base de fusion de T et de la cible est alors la dernière cible fusionnée.

**Cinq limites, que la spec n'écrit pas** :

1. **La classe « index sans commande » doit se comparer au contenu de M.** `livraison_intermediaire` compare au sommet courant d'`origin/develop` (`fus/passer.sh:153`, `:157`). Repris tel quel, le calcul répondrait « différent » dès que la cible modifie cet index après la mise à jour du capitaine, alors que la PR n'a pas bougé. `A-81` dit « celui de la base » : écrire « celui de M ».
2. **La liste des index** : voir R5. Les fonctions actuelles lisent l'arbre de travail d'abord.
3. **Deux tours ne valent pas toujours une fusion directe.** Rejoué (`jouet2`) : la PR et la cible font le même changement, puis la cible l'annule entre deux tours du capitaine. La branche mise à jour deux fois perd le changement ; la fusion recalculée de V avec M le garde. Résultat : « différent », sur une PR que personne n'a touchée. Le sens est sûr (la PR se relit), mais le cas contredit « le capitaine […] passe une PR qu'il a lui-même mise à jour ».
4. **Deux bases de fusion.** Rejoué (`jouet3`) : une sous-PR qui porte un `develop` plus récent que son sujet, sujet rafraîchi ensuite (le chemin de `suj/sujet.sh:788-791`). Résultat : « différent (2 bases de fusion) » ; il redevient « même » une fois la sous-PR mise à jour avec le sujet par `mettre_a_jour_sous_pr`. Entre les deux, le Relecteur voit « différent ».
5. **Deux écritures du capitaine hors index, non rejouées** : la résolution d'un conflit de pile (`fus/passer.sh:234-251`, qui choisit un côté fichier par fichier), et le `pre-commit` du projet quand le capitaine conclut une fusion en conflit d'index par `git commit` (`fus/passer.sh:272`, `suj/sujet.sh:539` ; le gabarit joue `lint-staged`, `skills/monorepo/socle-monorepo/references/husky/pre-commit:16`, et `suj/sujet.sh:609-610` écrit déjà que ce formatage « n'est pas prouvé »).

**Ce que la 7.16.0 change pour le Relecteur.** Avant elle, T ne s'écartait de V, vers un sujet, que sur un conflit d'index. Maintenant toute PR en retard porte un commit du capitaine pendant l'attente de sa CI. Les règles 2 et 3 de `A-85` tournent à chaque réveil de la veille sur les PR étiquetées `à-fusionner` : la branche non triviale du calcul devient leur chemin ordinaire. Dans les cas 3 à 5, la règle 3 poserait `à-reprendre` sur une PR que le capitaine est en train de passer ; lui ne relit pas les étiquettes avant de fusionner (`fus/passer.sh:91-93` est sa seule lecture ; `fusionner` de `sujet.sh` n'en lit aucune) : la PR entrerait étiquetée `à-reprendre`. Deux parades possibles, à trancher par l'architecte : la relecture tardive de § 2.1, ou une définition pas à pas (chaque commit de V à T sur la ligne des premiers parents est soit une fusion dont le second parent est un ancêtre de la cible et dont l'arbre est celui de `merge-tree` de ses deux parents aux index près, soit un commit qui ne touche que des index), dans l'esprit de `verifier_mise_a_jour` (`suj/sujet.sh:618-667`). La seconde ferme les cas 3 et 4.

Les bancs de 3b couvrent donc au moins : retard sans conflit ; conflit d'index ; deux mises à jour de suite ; cible qui avance après la mise à jour ; index sans commande ; index déclaré par motif ; les cas 3 et 4 ci-dessus.

### 2.3 Ce que la 7.16.0 contredit ou rend inutile

1. **« Une sous-PR étiquetée à la fois par sujet » contre le protocole des quatre étiquettes.** Règle de `main` : `skills/chaine/chantier/SKILL.md:95`, `skills/chaine/fusionner/SKILL.md:40`, test `scripts/depot.test.mjs:1040`. Elle fait retirer `à-fusionner` par le conducteur sur des PR validées, puis le reposer. La spec n'a pas d'étiquette pour « validée, attend son tour », et trois de ses règles défont ce geste :
   - `A-86` : une PR sans aucune des quatre étiquettes, son auteur repose `à-relire` ;
   - `A-85`, règle 2 : tour validé au même contenu propre, le Relecteur repose `à-fusionner` ;
   - `A-84` : seul le Relecteur pose `à-fusionner`.

   Le conducteur retire, l'auteur redemande, le Relecteur repose : une boucle sans fin, et la CI que la règle voulait épargner repasse. À décider : le Relecteur tient lui-même la file par sujet (la règle 2 ne pose `à-fusionner` que si aucune sous-PR plus ancienne du même sujet ne le porte), ou le capitaine ne prend que la plus ancienne par sujet (`fus/file.sh`), ou une cinquième étiquette. Dans les trois cas, la phrase figée par `scripts/depot.test.mjs:1040` bouge avec le lot qui tranche.
2. **`A-100`** suppose que, pendant la bascule, « aucun autre ticket du plugin ne touche `passer.sh`, `sujet.sh`, `chantier/SKILL.md` ni `lancement.md` ». Onze tickets non lancés de l'autre programme et une PR ouverte touchent ces quatre fichiers (§ 3).
3. **Le second défaut de « Hors périmètre »** est à moitié corrigé (R11).
4. **`A-81` et l'essai de 6c** disent « conflit d'index » là où la règle vaut maintenant pour tout retard (R1).
5. **« Ce que cette spec ne ferme pas », le coût** : à « chaque correction rouvre la CI entière » s'ajoute, depuis la 7.16.0, une CI par mise à jour du capitaine, y compris vers un sujet et pour de la documentation (`skills/chaine/fusionner/SKILL.md:36`).

### 2.4 Ce que les tickets non fusionnés de l'autre programme changeront sous la spec

Lus dans leurs tickets ; aucun n'est sur `main`.

- **Ticket 16** (écrit) : `a-juger`, `est-livraison`, `livraison_intermediaire` dans `github.sh`, `motifsDuCapitaine` (R6, R8). Il pose aussi un check de CI `pr-titre`, non exigé, qui « juge comme le capitaine » et exige la section de revue dans le corps. En régime 8 le verdict est un commentaire : ce check serait rouge sur toute PR de code tant que 5a ne le rend pas sensible au régime. `socle/scripts/github/pr-titre.mjs` s'ajoute donc aux fichiers de 5a.
- **Ticket 18** (écrit) : le capitaine renvoie une PR à chemin sensible sans la ligne « `/security-review` : lancée » dans sa section de revue (`motifSansSecurite`). La forme du verdict (`A-80`) n'a pas de champ pour cela ; `A-78` fait jouer `/security-review` par la session de relecture. À porter dans le verdict, sinon la garde du ticket 18 disparaît en régime 8.
- **Ticket 7** (écrit) : `livrer` n'étiquette plus (R7).
- **Ticket 4** (écrit) : le capitaine pose sur chaque PR un commentaire marqué `<!-- capitaine:passage <id> -->` qu'il **réédite** à chaque tour et à la sortie ; `CAPITAINE_ID` devient obligatoire ; la règle « un seul capitaine » disparaît. Le lecteur de commentaires à marque de 3a croisera ces commentaires édités ; `A-83` (« en même temps que le capitaine ») devient « que les capitaines ».
- **Ticket 9** (écrit) : toute lecture GitHub qui décide passe par une seule fonction de `github.sh`, un refus de lecture devient la sortie 5, et la sortie 5 devient une pause de la boucle. La lecture des verdicts par le capitaine (5a) et par le Relecteur (lot 4, `A-83`) passe par cette fonction.
- **Ticket 5** (PR 117 ouverte) : chaque prompt de lancement porte les lignes « Outils : », « Version : », « Commits : » ; le contrôle de vie de l'architecte relève les sessions nommées par la carte (conducteurs, `Capitaines:`, tickets). Le gabarit du Relecteur (lot 4) les porte, et la ligne `Relecteurs:` entre dans ce relevé.
- **Ticket 11** (écrit) : `sujet/SKILL.md` gagne une section « Recevoir develop dans un sujet » avec le corps type d'une PR de réception, « Revue de ticket » comprise. La partie 6b la récrit pour le régime 8.
- **Tickets 3 et 8** (écrits) : deux clés nouvelles dans `socle/chaine.json` (`fusionsSansEffet`, `preparerCapitaine`) et dans la phrase « Sept clés, et rien d'autre » (`socle/CONTENU.md:5`), que le lot 1 (retrait de `proprietaires`) et la partie 6c (clé `relecture`) récrivent aussi.

---

## 3. Ordre avec les dix-neuf tickets

### 3.1 État des tickets (carte, puis GitHub à 19 h 40 UTC)

| Ticket | État | Fichiers de la chaîne touchés (hors `plugin.json` et `NOTES-DE-VERSION.md`) |
| --- | --- | --- |
| 1 règle d'ascendance | **fusionné** (PR 115, 7.16.0) | `github.sh`, `passer.sh`, `boucle.sh`, `sujet.sh`, `faux-gh.mjs`, bancs, `fusionner/SKILL.md`, `sujet/SKILL.md`, `chantier/SKILL.md`, `admin.md`, `CONTEXT.md`, `README.md`, `depot.test.mjs` |
| 15 tests et heure | **fusionné** (PR 112, 7.17.0, après la dernière entrée de la carte) | aucun de la chaîne |
| 5 contrôle de vie | **PR ouverte** (117) | `architecte/SKILL.md`, `lancement.md`, `chantier/SKILL.md`, `chaine-de-production.md`, `depot.test.mjs` |
| 6 `ticket-libre` | **PR ouverte** (118) | `tickets/SKILL.md`, `tic/CONTENU.md`, `tic/agents/issue-tracker.md`, `tic/scripts/docs/ticket-libre.*`, `tic/scripts/docs/depot-jouet.mjs`, `socle-monorepo` (`pr-ouvertes.*`, `TABLE-RACINE.md`) |
| 10 `demarrer-local` | **PR ouverte** (116) | aucun de la chaîne |
| 12 `coverage-diff` | **PR ouverte** (114) | aucun de la chaîne |
| 17 gardes git | **PR ouverte** (119 ; la carte dit « session lancée ») | `socle/agent/regles.mjs`, `regles.test.mjs`, `garde-commandes.test.mjs`, `socle/CONTENU.md`, `socle/fragments/claude-md-fusion.md`, `depot.test.mjs` |
| 19 mobile en CI | **PR ouverte** (113) | aucun de la chaîne |
| 2 PR en conflit | écrit, pas lancé | `file.sh`, `boucle.sh`, `sujet.sh`, `faux-gh.*`, bancs, `fusionner/SKILL.md` et `CONTENU.md`, `sujet/SKILL.md` |
| 3 fusion sans effet | écrit, pas lancé | `github.sh`, `passer.sh`, `sujet.sh`, bancs, `socle/chaine.json`, `socle/CONTENU.md`, `fusionner/SKILL.md` et `CONTENU.md`, `depot.test.mjs` |
| 4 verrou par passage | écrit, pas lancé | `github.sh`, `passer.sh`, `boucle.sh`, `veille.sh`, `sujet.sh`, `faux-gh.*`, `suj/depot-jouet.mjs`, bancs, `fusionner/SKILL.md` et `CONTENU.md`, `chantier/SKILL.md`, `architecte/SKILL.md`, `chaine-de-production.md`, `claude-md-fusion.md`, ADR de la chaîne, `CONTEXT.md`, `README.md`, `depot.test.mjs` |
| 7 `livrer` sans label | écrit, pas lancé | `sujet.sh`, `sujet.test.mjs`, `fusionner.test.mjs`, `sujet/SKILL.md` et `CONTENU.md`, `chantier/SKILL.md`, `chaine-de-production.md` |
| 8 veille | écrit, pas lancé | `veille.sh`, `boucle.sh`, leurs bancs, `fusionner/SKILL.md` et `CONTENU.md`, `socle/chaine.json`, `socle/CONTENU.md` |
| 9 panne de GitHub | écrit, pas lancé (après 8) | `github.sh`, `passer.sh`, `boucle.sh`, `file.sh`, `sujet.sh`, `faux-gh.*`, bancs, `fusionner/SKILL.md` et `CONTENU.md`, `sujet/SKILL.md` et `CONTENU.md` |
| 11 sujets élagués | écrit, pas lancé (après 9 et 7) | `sujet.sh`, `sujet-fusionner.test.mjs`, `sujet/SKILL.md` et `CONTENU.md`, `depot.test.mjs` |
| 13 un seul environnement de banc | écrit, pas lancé (après 1 et 6) | les deux `depot-jouet.mjs`, `fusionner.test.mjs`, `sujet-fusionner.test.mjs`, `revue-exigee.test.mjs`, `chemins-sensibles.test.mjs`, `poses.test.mjs`, `points-d-entree.test.mjs`, `nettoyage-des-bancs.test.mjs` |
| 14 `next-id` | écrit, pas lancé (après 6 et 13) | `tickets/SKILL.md`, `socle-monorepo` (`next-id*`) |
| 16 check `pr-titre` | écrit, pas lancé (après 9, 11, 18) | `revue-exigee.mjs` et son test, `sujet.sh`, `github.sh`, `passer.sh`, bancs, `socle/SKILL.md`, `socle/CONTENU.md`, `sujet/CONTENU.md`, `poses.test.mjs`, `depot.test.mjs` |
| 18 garde illisible | écrit, pas lancé (après 17 et 5) | six gardes de `socle/agent/`, `regles.mjs` et son test, `revue-exigee.mjs` et son test, `chaine-de-production.md`, `socle/CONTENU.md`, `claude-md-fusion.md`, `revue-adversariale/SKILL.md`, `revue-de-ticket/SKILL.md`, leurs `section-pr.md`, `depot.test.mjs` |

La carte ne tient pas de tableau d'état par ticket : l'état vient de son journal (« Les 19 tickets sont écrits et relus », 19 h 05 UTC) et de sa table `## Coût` (sessions lancées : 1, 15, 19, 10, 12, 17, 6, 5).

### 3.2 Lot par lot

Fichiers du plugin que chaque lot modifiera (lecture de la spec, vérifiée par recherche sur `main` ; les fichiers neufs n'ont pas encore de nom), puis les tickets ouverts qui partagent un fichier.

**Lot 1 — retrait de CODEOWNERS.** `socle/scripts/github/codeowners.mjs` et son test, `socle/chaine.json`, `socle/agent/regles.mjs` et son test, `fus/{github,passer,file,boucle}.sh`, `fus/fusionner.test.mjs`, `fus/veille.test.mjs`, `suj/faux-gh.mjs`, `fusionner/SKILL.md` et `CONTENU.md`, `socle-chaine-de-production/SKILL.md` et `CONTENU.md`, `socle/admin.md`, `socle/fragments/claude-md-fusion.md`, `socle/docs-agents/chaine-de-production.md`, `chantier/SKILL.md`, ADR CODEOWNERS, `README.md`, `scripts/{depot,poses,points-d-entree}.test.mjs`.
Partagés avec : 2 (`file.sh`, `boucle.sh`, `faux-gh.mjs`, bancs, `fusionner/SKILL.md`), 3 (`github.sh`, `passer.sh`, `chaine.json`, `socle/CONTENU.md`), 4 (`github.sh`, `passer.sh`, `boucle.sh`, `veille.test.mjs`, `faux-gh.mjs`, `chantier/SKILL.md`, `chaine-de-production.md`, `claude-md-fusion.md`, `README.md`), 5 (PR 117 : `chantier/SKILL.md`, `chaine-de-production.md`), 7 (`chantier/SKILL.md`, `chaine-de-production.md`), 8 (`boucle.sh`, `veille.test.mjs`, `chaine.json`), 9 (`github.sh`, `passer.sh`, `boucle.sh`, `file.sh`, `faux-gh.mjs`), 11 (`depot.test.mjs`), 13 (`poses.test.mjs`, `points-d-entree.test.mjs`, `fusionner.test.mjs`), 16 (`github.sh`, `passer.sh`, `socle/SKILL.md`, `poses.test.mjs`), 17 (PR 119 : `regles.mjs` et son test, `socle/CONTENU.md`, `claude-md-fusion.md`), 18 (`regles.mjs` et son test, `chaine-de-production.md`).

**Lot 2 — bilan supprimé, gate élargi.** `tic/scripts/verify/tickets-regles.mjs`, `tickets.mjs`, `tickets.test.mjs`, `tickets-gate.test.mjs`, `tic/gabarits/ticket.issue.md`, `carte.map.md`, `tic/scripts/docs/couts.mjs` et son test ; puis `chantier/SKILL.md` et son `CONTENU.md`, `socle/docs-agents/chaine-de-production.md`, `pieges.md`, `README.md`.
Partagés avec : 4, 5 (PR 117), 7, 18, tous par `chantier/SKILL.md`, `chaine-de-production.md` ou `README.md`. **La moitié « gate, gabarits, `couts.mjs` » ne partage aucun fichier avec aucun des dix-neuf tickets.** Le ticket 56 de « gouverner nos boucles » (`A-69`) touche aussi `chantier/SKILL.md`.

**Lots 3a, 3b, 3c — les trois calculs.** Fichiers neufs sous `fus/` et leurs bancs ; `fusionner/references/CONTENU.md` ; `scripts/points-d-entree.test.mjs` si le calcul est un `.mjs` lancé en ligne de commande (liste écrite à la main, `scripts/points-d-entree.test.mjs:17-27`) ; pour 3b, `suj/depot-jouet.mjs` seulement s'il doit le modifier. `scripts/poses.test.mjs` n'a pas à changer : il pose les dossiers entiers (`:14-22`, `:61`).
Partagés avec : 2, 3, 4, 8, 9 (`fusionner/references/CONTENU.md`), 13 (`points-d-entree.test.mjs`, `depot-jouet.mjs`), 4 (`depot-jouet.mjs`). Aucun test n'exige que `CONTENU.md` cite chaque script (recherche dans `scripts/depot.test.mjs`).

**Lot 3d — skill `relecture`.** Dossier neuf `skills/chaine/relecture/`, `suj/sujet.sh` (`a-juger`), `sujet/references/CONTENU.md`, `fus/sujet-fusionner.test.mjs`, `.claude-plugin/plugin.json` (liste des skills), `README.md`, `CONTEXT.md`, `socle-monorepo/references/scripts/verify/references-agent-integrees.json`, `scripts/{depot,poses,points-d-entree}.test.mjs`.
Partagés avec : 2, 3, 4, 7, 9, 11, 16 (`sujet.sh`), 13 (bancs), 4 (`CONTEXT.md`, `README.md`), 5, 17, 18 (`depot.test.mjs` seulement). Le 16 écrit la même commande (R6).

**Lot 4 — skill `relecteur`.** Dossier neuf `skills/chaine/relecteur/`, `suj/faux-gh.mjs` et son test, `architecte/references/lancement.md`, `socle/labels.sh`, `socle/admin.md`, `socle-chaine-de-production/SKILL.md` et `CONTENU.md`, `tic/gabarits/programme.md` et `carte.map.md`, `plugin.json`, `README.md`, `references-agent-integrees.json`, `scripts/depot.test.mjs`. La spec n'y met pas `architecte/SKILL.md` (lignes `Capitaines:`, `:41`, `:64`), que `A-83` fait pourtant changer : il est en 6b.
Partagés avec : 2, 4, 9 (`faux-gh.*`), 5 (PR 117 : `lancement.md`), 3, 8, 16, 17, 18 (`socle/CONTENU.md`), 16 (`socle/SKILL.md`), 4 (`README.md`), 11, 13 (tests de `scripts/`).

**Lot 5a — éligibilité par les verdicts.** `fus/revue-exigee.mjs` et son test, `fus/passer.sh`, `suj/sujet.sh`, les deux `depot-jouet.mjs`, `fus/fusionner.test.mjs`, `fus/sujet-fusionner.test.mjs` ; à ajouter : `suj/faux-gh.mjs` et son test (R9), puis `pr-titre.mjs` une fois le 16 entré (§ 2.4).
Partagés avec : 2, 3, 4, 7, 9, 11, 16 (`sujet.sh`, `passer.sh`), 16 et 18 (`revue-exigee.mjs`), 13 (bancs, les deux `depot-jouet.mjs`), 6 (PR 118 : `tic/scripts/docs/depot-jouet.mjs`).

**Lot 5b — gardes des fichiers sensibles.** `socle/agent/garde-fichiers.mjs`, `regles.mjs` et son test, `revue-adversariale/scripts/chemins-sensibles.mjs` et son test, `suj/sujet.sh`, `fus/passer.sh`, bancs.
Partagés avec : 17 (PR 119) et 18 (`regles.mjs`, `garde-fichiers.mjs`), 2, 3, 4, 7, 9, 11, 16 (`sujet.sh`, `passer.sh`), 13 (bancs).

**Lot 5c — renvois, messages, gate selon le régime.** `fus/renvoyer.sh`, `suj/sujet.sh` (`demarrer`, message de `:457`), `fus/github.sh`, `tic/scripts/verify/tickets-regles.mjs` (`:401-416`) et ses tests, bancs.
Partagés avec : 3, 4, 9, 16 (`github.sh`), 2, 3, 4, 7, 9, 11, 16 (`sujet.sh`), 7 (`sujet.test.mjs`), 13 (bancs). `renvoyer.sh` et `tickets-regles.mjs` ne sont touchés par aucun des dix-neuf.

**Lot 6 — bascule 8.0.0.** 6a : `socle/docs-agents/chaine-de-production.md`, `socle/fragments/claude-md-fusion.md`, `socle-monorepo/references/racine/CLAUDE.md`, `socle-monorepo/references/methode/conception.md`, `tic/agents/issue-tracker.md`, `tic/scripts/docs/avancement.mjs`, `criticite/SKILL.md`, `recette-humaine/SKILL.md`. 6b : `chantier/SKILL.md`, `architecte/SKILL.md`, `lancement.md`, `fusionner/SKILL.md`, `sujet/SKILL.md`, un `regime-7.md` neuf. 6c : `socle/chaine.json`, `socle-chaine-de-production/SKILL.md` et `CONTENU.md`, ADR, `plugin.json`. Les huit fichiers existent sur `main`.
Partagés avec : 2, 3, 4, 5 (PR 117), 6 (PR 118 : `issue-tracker.md`), 7, 8, 9, 11, 16, 17 (PR 119), 18.

**Lot 7 — repose dans les trois projets.** Aucun fichier du plugin.

**Lot 8 — `skills` lui-même.** `architecte/references/lancement.md` (`A-101`) et les tests qui figent le prompt du capitaine d'un dépôt sans la chaîne (`scripts/depot.test.mjs:446-681`).
Partagé avec : 5 (PR 117 : `lancement.md`).

**Lot 9 — nettoyage.** `passer.sh`, `sujet.sh`, `revue-exigee.mjs`, `github.sh`, `renvoyer.sh`, `tickets-regles.mjs`, le gabarit de ticket, les deux anciens skills de revue, `regime-7.md`, les skills des rôles.
Partagés avec : 2, 3, 4, 5, 7, 8, 9, 11, 16, 18.

### 3.3 Tableau

Critère : aucun fichier commun autre que `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` avec un ticket non fusionné. Entre parenthèses, le numéro de la PR quand elle est ouverte.

| Lot | Verdict |
| --- | --- |
| 1 | attend 2, 3, 4, 5 (117), 7, 8, 9, 11, 13, 16, 17 (119), 18 |
| 2 | attend 4, 5 (117), 7, 18 ; **sa moitié « gate `tickets`, gabarits, `couts.mjs` » peut partir maintenant** si elle est détachée |
| 3a | **peut partir maintenant**, fichiers neufs seuls ; sa ligne de `fusionner/references/CONTENU.md` attend 2, 3, 4, 8, 9 et `points-d-entree.test.mjs` attend 13 |
| 3b | **peut partir maintenant**, même réserve, et sans modifier `suj/depot-jouet.mjs` (4, 13) |
| 3c | **peut partir maintenant**, même réserve que 3a |
| 3d | attend 2, 3, 4, 7, 9, 11, 13, 16 (et 5, 17, 18 par `depot.test.mjs` seul) |
| 4 | attend 2, 3, 4, 5 (117), 8, 9, 13, 16, 17 (119), 18 (et 11 par `depot.test.mjs` seul) |
| 5a | attend 2, 3, 4, 6 (118), 7, 9, 11, 13, 16, 18 |
| 5b | attend 2, 3, 4, 7, 9, 11, 13, 16, 17 (119), 18 |
| 5c | attend 2, 3, 4, 7, 9, 11, 13, 16 |
| 6 | attend 2, 3, 4, 5 (117), 6 (118), 7, 8, 9, 11, 16, 17 (119), 18 |
| 7 | aucun fichier du plugin : ne dépend que du lot 6 |
| 8 | attend 5 (117) |
| 9 | attend 2, 3, 4, 5 (117), 7, 8, 9, 11, 16, 18 |

Lecture : les tickets 10, 12, 14, 15 et 19 ne gênent aucun lot. La chaîne `1 → 8 → 9 → {7, 11} → 18 → 16` de l'autre programme (ses lignes `Blocked by:`) tient `sujet.sh`, `passer.sh` et `github.sh` jusqu'au ticket 16 : les lots 1, 3d, 4, 5 et 6 passent après lui, ou s'intercalent par accord entre les deux architectes, un seul ticket à la fois sur ces fichiers (règle `A-17` de l'autre carte). Les recouvrements par `scripts/depot.test.mjs` seul sont des ajouts en fin de fichier.

### 3.4 Règles de `main` qu'un ticket du plugin doit maintenant suivre

Nouvelles depuis `4a45634` :

1. **Une version et une note par ticket.** `README.md:188` ; la note s'écrit en tête de `NOTES-DE-VERSION.md` sous le titre `## <version> — <date>`, avec « ### Ce qui change » et « ### Ce qu'un projet fait pour en profiter ». Le test `scripts/depot.test.mjs:1032-1041` exige que la première note commence par la version de `plugin.json` et porte ces deux titres. Deux PR ouvertes ensemble se disputent donc toujours ces deux fichiers : partir de `main` au lancement, reprendre `main` avant de livrer (c'est ce qu'écrivent les en-têtes des tickets de l'autre programme, et le ticket 56).
2. **La note dit le geste du projet** : quel `poser` rejouer, et la relance du capitaine quand un script de la boucle change (`NOTES-DE-VERSION.md:15-19` à 7.16.0).
3. **Le faux GitHub est fidèle** : réglage « strict », arbre de fusion pris de `git merge-tree`, checks par commit et en liste, `pendantCi`, `avantFusion` (`suj/faux-gh.mjs:9-22`, `:34-36`). Un banc de fusion se joue sur lui ; un comportement ajouté au faux a son test dans `suj/faux-gh.test.mjs`.
4. **Une cible se relit par un refspec explicite avant d'être jugée** : `+refs/heads/<b>:refs/remotes/origin/<b>` (`fus/passer.sh:324-326`, `suj/sujet.sh:824-825`). Le calcul de `A-81`, qui lit `origin/B`, suppose ce fetch.
5. **Un contrôle illisible ne vaut jamais un accord** (`fus/github.sh:136-137`) : des commentaires illisibles ne sont pas « validé ».
6. **Codes de sortie pris** : 12 (`fus/passer.sh:59-61`, `suj/sujet.sh:96-97`), 8 et 11 de `sujet.sh fusionner` (`suj/sujet.sh:95-99`), traités par `fus/boucle.sh` ; un lot qui ajoute une sortie ne réemploie pas ces codes.
7. **Une sous-PR étiquetée à la fois par sujet**, phrase figée par `scripts/depot.test.mjs:1040` (§ 2.3).
8. **Le temps des bancs est plus long** : les bancs posés à plat sont rejoués par `scripts/poses.test.mjs` sous un plafond de 600 s (`:49`, `:75`) ; tout banc neuf sous `fus/` ou `suj/` y entre d'office (`:14-22`).
9. **7.17.0** (`1c4acb1`) : la fiche `tests.md` du socle gagne « Le jour et l'heure » (horloge injectée, « un banc tourne avec une horloge posée »). Elle vise les projets, mais la spec a trois délais (`relecture.delai`, les trois heures de `A-86`, `depuis` de `A-97`) : la fonction pure de 3a reçoit l'instant en entrée.

Déjà là en 7.15.0, et qui pèsent sur ces lots : aucun `SKILL.md` au-delà de 200 lignes (`scripts/depot.test.mjs:49` ; `chantier/SKILL.md` en a 128, `fusionner/SKILL.md` 112, avant d'y écrire deux régimes) ; chaque skill déclaré dans `plugin.json`, avec sa ligne au `README.md` (`:29-40`, `:870`) ; un prompt de lancement qui nomme un skill « lancé par une commande » commence par cette commande (`:331-340`) ; aucun texte ne fait nommer une PR à un capitaine, l'étiquette est le seul ordre (`:439`) ; aucun script ne saute un hook (`:287`) ; les bancs retirent leurs dossiers et n'héritent pas de l'environnement du capitaine (`scripts/nettoyage-des-bancs.test.mjs:85-112`, `suj/environnement-des-bancs.test.mjs`).

À venir avec les tickets non fusionnés : une seule fonction de lecture GitHub et la sortie 5 comme pause (9), `CAPITAINE_ID` et le commentaire de passage (4), un seul environnement de banc (13), le check `pr-titre` (16), la ligne « `/security-review` : lancée » (18).

---

## Ce qui n'a pas été vérifié

- La suite de tests du plugin n'a pas été jouée ; les dépôts jouets de § 2.2 sont les miens, pas ceux du plugin.
- Limite 5 de § 2.2 (conflit de pile, `lint-staged` sur une fusion conclue) : lue dans le code, non rejouée.
- Les quatre rapports de relecture de la spec, la carte `map.md` (hors les entrées `A-69`, 886 et 916 du journal) et les décisions `P-47` à `P-61` n'ont pas été relus.
- Les fichiers des tickets non lancés viennent de leur ligne `Fichiers chauds:` ; ceux des PR ouvertes, de cette ligne et du diff de leur branche contre `main`.
- Les fichiers des lots viennent de ma lecture du paragraphe « Les lots » ; un ticket peut en nommer d'autres.
- R11, côté `develop` : conclu de l'absence de changement dans `boucle.sh`, non rejoué.
- La remarque sur le gate du lot 2 (rôles et en-têtes non fermés) : lue dans le code, non jouée.
