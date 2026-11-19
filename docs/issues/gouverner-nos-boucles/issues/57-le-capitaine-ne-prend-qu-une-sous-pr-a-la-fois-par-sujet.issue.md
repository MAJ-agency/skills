# Une sous-PR à la fois par sujet : le capitaine le tient par l'ordre de sa file, le conducteur ne retire plus l'étiquette

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — `traiter_sujets` récrite, les retouches de `veille.sh`, les cas des bancs, les textes des skills, le test de dépôt et la note de version sont donnés mot pour mot (Décisions 10 à 12, annexes A à E) et ont été joués sur un clone neuf d'`origin/main` à `a3c2a7c`. Rien à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Si `main` a touché `traiter_sujets`, `etat_file` ou les sorties de `sujet.sh` depuis `a3c2a7c`, la Décision 13 dit quoi faire.
Blocked by: 56 (même § 6 de `skills/chaine/chantier/SKILL.md`, le point voisin ; mêmes `scripts/depot.test.mjs`, `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : l'un après l'autre, celui-ci part d'un `main` où le 56 est entré)
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/veille.sh`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

Ce ticket réalise la décision `A-104` de la carte `docs/issues/gouverner-nos-boucles/map.md` (2026-11-18).

**Ce que la 7.16.0 a posé**, relu sur `origin/main` à `a3c2a7c` (plugin 7.31.0). Depuis la règle d'ascendance, le capitaine met à jour et reteste toute sous-PR en retard sur son sujet. Deux sous-PR étiquetées ensemble se remettent donc l'une l'autre en retard, et la CI repasse à chaque fois. La 7.16.0 a confié la parade au conducteur :

- `skills/chaine/fusionner/SKILL.md:40` : « Dans un sujet, une seule sous-PR porte `à-fusionner` à la fois : le conducteur y veille (skill `chantier` § 6) » ;
- `skills/chaine/chantier/SKILL.md:95`, § 6 point 5 : « **Une sous-PR à la fois par sujet.** […] À chaque réveil, quand plusieurs sous-PR d'un même sujet portent `à-fusionner`, le conducteur ne le laisse qu'à la plus ancienne », puis il le repose sur la suivante ;
- `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md:14` (le gabarit d'ADR posé dans un projet) : « dans un sujet, une seule sous-PR porte `à-fusionner` à la fois » ;
- `scripts/depot.test.mjs:1142` exige la première phrase.

**Pourquoi le changer.**

1. Le conducteur ne se réveille que toutes les 45 minutes : après chaque fusion, la sous-PR suivante attend son étiquette jusqu'à 45 minutes, alors qu'elle est prête.
2. C'est une discipline tenue par une session, pas un calcul : un conducteur coupé, relevé ou en retard laisse deux sous-PR étiquetées, et le défaut revient sans que rien le dise.
3. Le chantier « relecture indépendante » (spec `../relecture-independante.spec.md`) pose l'étiquette `à-fusionner` par le Relecteur, sur verdict. Une étiquette retirée d'une PR validée y ferait tourner trois règles en boucle (rapport `../relecture-independante.verif-716.md`, § 2.3).

**La règle nouvelle.** Le capitaine ne prend, à chaque tour de sa boucle, que **la plus ancienne des sous-PR étiquetées de chaque sujet**. Les autres attendent : ni mise à jour, ni CI, ni renvoi, et elles gardent leur étiquette. Le conducteur n'a plus rien à retirer ni à reposer.

**Ce que `main` a changé depuis l'écriture du ticket (2026-11-18, `1c4acb1`), et ce que cela fait à la règle.**

- PR 128 (7.26.0) : `file.sh` rend un état de plus, « prête (en conflit) », que la boucle confie à `sujet.sh relancer` comme « prête (sans CI) ». `relancer` lit la règle d'ascendance avant toute fusion : sortie 2 avec les fichiers (conflit hors index, renvoi), sortie 3 dont la dernière ligne nomme le pre-push (renvoi), toute autre sortie 3 muette, sortie 5 quand la sous-PR a bougé, sortie 11 quand le contrôle est illisible.
- PR 131 (7.29.0) : aucune sortie nouvelle (la mention d'une fusion sans effet, et le texte d'une sortie 4).
- PR 133 (7.31.0) : plusieurs capitaines tiennent la même file. `sujet.sh fusionner` et `relancer` posent un verrou par passage (un commentaire marqué) : **la sortie 7 est désormais d'abord « en passage chez un autre capitaine »** (et « plus éligible une fois le verrou pris »), la sortie 11 compte un verrou illisible. La règle doit donc tenir aussi entre deux capitaines (Décision 4).
- La veille (`veille.sh`) ne relance la boucle que sur une ligne « prête » ou « rouge » nouvelle. Une sous-PR qui attend son tour reste « prête », la même ligne de sonde en sonde : sans retouche, elle n'est reprise par personne quand celle qui tient son sujet quitte la file sans y entrer (Décision 7 ; reproduit, voir « Ce qui a été joué »).

## Où

- `skills/chaine/fusionner/scripts/boucle.sh`, fonction `traiter_sujets` (l. 326 à 412 à `a3c2a7c`), appelée une fois par tour de la boucle principale (l. 444), avant la PR suivante vers develop. Elle lit la file (`file.sh` : sous-PR de sujet, livraisons de sujet, `prio:haute`, puis numéro croissant ; `sort -k1,1n -k2,2n`, l. 122) et passe chaque sous-PR « prête » à `sujet.sh fusionner`, chaque sous-PR « prête (sans CI) » ou « prête (en conflit) » à `sujet.sh relancer`. Une sous-PR « CI en cours » ou « CI rouge » ne reçoit aucun geste d'elle.
- `skills/chaine/fusionner/scripts/veille.sh`, fonctions `lancer` (l. 164 à 174) et `etat_file` (l. 176 à 184).
- Les bancs : `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` (c'est lui qui porte les bancs de la boucle sur des sous-PR, dépôt jouet et faux GitHub `skills/chaine/sujet/scripts/faux-gh.mjs`) et `skills/chaine/fusionner/scripts/veille.test.mjs` (doublures de `boucle.sh` et de `file.sh`).
- Les textes : `skills/chaine/fusionner/SKILL.md` (l. 40 et l. 81), `skills/chaine/chantier/SKILL.md` (l. 95), le gabarit d'ADR (l. 14), `skills/chaine/fusionner/references/CONTENU.md` (l. 25, 32 et 35).
- `scripts/depot.test.mjs` : le test de la ligne 1133, qui exige l'ancienne phrase.

**Un tour**, dans tout ce ticket : un passage de la boucle principale de `boucle.sh` (`while :`, l. 439), soit `traiter_rouges`, `traiter_sujets`, puis une PR vers develop. Sans PR prête vers develop, la boucle sort sur `FILE VIDE` après un seul tour : le tour suivant est alors celui de la boucle que la veille relance.

## Décisions

Les décisions 1, 6 et la moitié de la 3 sont celles du 2026-11-18. Les autres ont été écrites ou récrites le 2026-11-19 sur le code de `main` ; celles que l'architecte n'avait pas tranchées sont marquées **(à confirmer)**.

1. **La règle vit dans `traiter_sujets`, pas dans `file.sh`.** `file.sh` reste la lecture de la file, que le conducteur et l'architecte lisent aussi : une sous-PR qui attend son tour continue d'y paraître « prête ».

2. **Qui tient un sujet (à confirmer).** Dans l'ordre de `file.sh`, la première sous-PR d'un sujet dont l'état est **en route** tient ce sujet pour le tour : « prête », « prête (sans CI) », « prête (en conflit) » ou « CI en cours ». Les sous-PR suivantes du même sujet qui sont elles aussi en route sont sautées, avec une ligne de journal : `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>`.
   - **« CI en cours » tient, bien que la boucle n'y fasse aucun geste.** Après une sortie 8, la sous-PR se lit « CI en cours » au tour suivant : si elle ne tenait plus le sujet, la suivante serait prise pendant sa CI, ce qui est le défaut même (mutation 4).
   - **Ne tiennent rien** : « CI rouge » (son sort appartient à `traiter_rouges`, relance puis renvoi, et un check rouge qui n'est pas un run d'Actions n'est jamais ni relancé ni renvoyé : il tiendrait le sujet sans limite), « bloquée », « brouillon », « humain », « attend un humain » (elles attendent quelqu'un d'autre que le capitaine), « gelée » (tout le sujet l'est). Coût accepté : une sous-PR rouge relancée avec succès repasse derrière celle qui est entrée pendant ce temps, et reçoit une mise à jour.

3. **Ce qui rend le sujet dans le tour, ce qui le tient.** Le sujet est **rendu** quand la sous-PR qui le tient n'est plus en route : la suivante est alors prise dans le même tour. Il reste **tenu** tant qu'elle est en route. Sortie par sortie, sur la liste réelle de `main` (en-tête de `skills/chaine/sujet/scripts/sujet.sh`, l. 104 à 129, et les branches de `traiter_sujets`) :

   `sujet.sh fusionner` (état « prête ») :

   | Sortie | Ce qu'elle dit sur `main` | Ligne de la boucle | Le sujet |
   | ------ | ------------------------- | ------------------ | -------- |
   | 0 | squashée dans le sujet, ou PR de mise à jour entrée par avance rapide | `FUSIONNÉE` | rendu |
   | 3 | checks rouges, conflit avec le sujet hors index, hook, fusion refusée par GitHub | renvoi (`refus.sh`) | rendu |
   | 4 | titre, commitlint, revue, lien symbolique sur un index, base, tête gardée, forme d'une PR de mise à jour | renvoi (`refus.sh`) | rendu |
   | 5 | GitHub illisible, sous-PR ou sujet bougé, checks encore en cours, sujet bougé trois fois pendant la CI | `REPRISE` | tenu |
   | 6 | worktree du capitaine pas propre | `PAS PROPRE` | tenu |
   | 7 | en passage chez un autre capitaine ; ou fermée, en brouillon, sujet gelé, plus éligible une fois le verrou pris | `sous-PR non éligible (…)` | **tenu** (Décision 4) |
   | 8 | mise à jour poussée, CI pas finie | `MISE À JOUR` | tenu |
   | 11 | ascendance illisible, verrou illisible, push refusé par le distant, échec côté capitaine d'une PR de mise à jour | `ÉCHEC DU CAPITAINE` | tenu |
   | 12 | arbre du squash ≠ arbre testé | `ARRÊT`, la boucle sort | sans objet |
   | 2 | non classée : `fusionner` a joué `rafraichir --abandon-si-conflit`, le sujet est en conflit avec develop | `sous-PR non éligible (sortie 2)` | rendu : la PR de mise à jour qui résout ce conflit est plus loin dans la file |
   | autre (1, 64, 69) | erreur inattendue, `CAPITAINE_ID`, `jq` absent | `sous-PR non éligible (sortie <n>)` | rendu |

   `sujet.sh relancer` (états « prête (sans CI) » et « prête (en conflit) ») :

   | Sortie | Ce qu'elle dit sur `main` | Ligne de la boucle | Le sujet |
   | ------ | ------------------------- | ------------------ | -------- |
   | 0 | sujet fusionné dans la branche, poussé, CI lancée | aucune | tenu |
   | 2 | conflit avec le sujet hors index générés, fichiers listés | renvoi (`renvoyer.sh`) | rendu |
   | 3, dernière ligne « mise à jour de #<n> refusée par le hook pre-push » | le pre-push refuse la mise à jour | renvoi (`renvoyer.sh`) | rendu |
   | 3, toute autre | « contient déjà » (à jour, CI non déclenchable), conflit apparu entre le contrôle et la fusion, hook de commit, install ou gate des index | aucune (muette) | **rendu** (à confirmer) : rien n'est poussé, aucune CI ne court, et rien ne dit qu'elle passera un jour ; une sous-PR à jour dont la CI n'a jamais été déclenchée sort ainsi à chaque tour, et personne n'en est prévenu |
   | 4 | tête gardée, ne vise pas un sujet | renvoi (`refus.sh`) | rendu |
   | 5 | GitHub illisible, sous-PR bougée depuis sa lecture | `REPRISE` | tenu |
   | 6 | worktree du capitaine pas propre | `PAS PROPRE` | tenu |
   | 7 | en passage chez un autre capitaine ; plus éligible une fois le verrou pris | `en passage chez un autre capitaine` | **tenu** (Décision 4) |
   | 11 | verrou ou ascendance illisible, push refusé par le distant | `ÉCHEC DU CAPITAINE` | tenu |
   | autre (1, 64, 69) | erreur inattendue, `CAPITAINE_ID`, `jq` absent | aucune | rendu |

   Par rapport au texte du 2026-11-18 : la sortie 7 passe de « rend » à « tient » ; les sorties 2, 3 et 4 de `relancer` sont précisées ; le reste est inchangé. Le renvoi rend le sujet même s'il échoue (GitHub refuse l'écriture) : la sous-PR n'avance pas, et le tour suivant la rejuge.

4. **Une sous-PR verrouillée par un autre capitaine tient son sujet (sortie 7) (à confirmer).** Trois raisons.
   - Rendre le sujet reproduirait le défaut entre deux capitaines : pendant que le capitaine A met à jour #<m> et attend sa CI, le capitaine B prendrait #<n>, la ferait entrer ou la mettrait à jour, et #<m> repartirait pour une mise à jour et une CI. La règle d'ascendance garantit qu'aucun code non testé n'entre dans les deux cas : seul le travail en double est en jeu, et c'est lui que `A-104` supprime.
   - L'attente est bornée : un passage se termine de lui-même, et un verrou orphelin expire en 90 minutes (`github.sh`, `FILTRE_PASSAGE`).
   - La sortie 7 ne distingue pas le verrou des autres refus sans correction (fermée, en brouillon, sujet gelé, plus éligible une fois le verrou pris) autrement que par le texte de sa dernière ligne. Ces autres cas sont tous des courses entre la lecture de `file.sh` et le passage : tenir le sujet y coûte au plus un tour, car le tour suivant relit la file, où une PR fermée ne paraît plus et où une PR en brouillon ou gelée ne tient rien. La boucle ne lit donc pas le texte : toute sortie 7 tient.

5. **Classer une sortie nouvelle.** Une sortie de `sujet.sh fusionner` ou `relancer` ajoutée après ce ticket tient le sujet si elle laisse la sous-PR en route (quelque chose est poussé, une CI court ou va courir, un autre capitaine y travaille, une reprise est annoncée au tour suivant) ; elle le rend si la sous-PR sort de la file, ou si rien n'est poussé et que rien ne dit qu'elle passera. Dans le code, les sorties qui tiennent sont nommées, tout le reste rend.

6. **Les autres gestes de `traiter_sujets` ne tiennent pas le sujet** (regrouper, recibler, `hors-sujet`). **La PR de mise à jour d'un sujet suit la même règle** : elle passe à son rang dans la file. Le cas où elle est le remède (une sous-PR plus ancienne que `fusionner` arrête en sortie 2 parce que le sujet est en conflit avec develop) est couvert par la Décision 3 : la sortie 2 rend le sujet, la PR de mise à jour entre dans le même tour (cas 6 du banc).

7. **La veille suit celle qui tient le sujet (à confirmer).** Une sous-PR qui attend reste « prête » : la veille, qui ne relance la boucle que sur une ligne nouvelle, ne la relancerait pas quand celle qui tient le sujet quitte la file sans y entrer (étiquette retirée, `fusion-bloquée` posé par une contre-revue, fermée, mise en brouillon) : la sous-PR qui attend resterait « prête » sans que personne la prenne. `lancer` relève donc dans le journal de la boucle les paires « <n> attend #<m> », et `etat_file` ajoute pour chacune une ligne « <n> attend #<m> (<état de #<m> dans la file>) », ou « (hors de la file) ». Cette ligne est nouvelle à la première sonde qui suit la boucle (un second regard, qui couvre aussi un changement survenu entre la lecture de la boucle et la sonde), puis chaque fois que l'état de #<m> change ou que #<m> quitte la file : la veille relance alors la boucle, qui rejuge. Tant que #<m> ne bouge pas, rien n'est relancé. Écarté : relancer la boucle à chaque sonde tant qu'une sous-PR attend (une alternative d'un mot dans l'expression de `lancer`), parce qu'une passe toutes les deux minutes reposerait à chaque fois un commentaire de verrou sur une sous-PR tenue par un autre capitaine, et multiplierait les lectures de GitHub pendant toute la CI.

8. **La ligne `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` est un contrat** entre `boucle.sh`, qui l'écrit, et `veille.sh`, qui la lit (`^\[#([0-9]+)\] attend son tour : #([0-9]+) `). Les deux bancs la tiennent à la lettre. Elle n'entre pas dans le filtre du `Monitor` du capitaine (`fusionner/SKILL.md`, § « Boucle ») : une attente n'est pas un événement.

9. **`tenus` est une chaîne, pas un tableau associatif.** « sujet/<nom>:<numéro> », entre espaces : un nom de branche ne contient ni espace ni deux-points (`git check-ref-format`), et il vient de GitHub ; l'indice d'un tableau associatif passé à `unset` serait évalué par bash.

10. **Les textes, mot pour mot.** Chaque ancien texte est remplacé en entier, bornes comprises ; chaque remplacement tient sur la même ligne que l'ancien (aucun `SKILL.md` ne change de nombre de lignes).

    a. `skills/chaine/fusionner/SKILL.md`, § « La règle d'ascendance », le paragraphe « Dans un sujet, une seule sous-PR porte `à-fusionner` à la fois : […] et la CI repasse à chaque fois. » (l. 40, tout le paragraphe) devient :

    > **Une sous-PR à la fois par sujet.** À chaque tour, la boucle ne prend que la plus ancienne des sous-PR étiquetées de chaque sujet, parmi celles qui sont en route (« prête », « prête (sans CI) », « prête (en conflit) », « CI en cours ») : deux sous-PR prises ensemble se remettent l'une l'autre en retard, et la CI repasse à chaque fois. Les suivantes attendent leur tour, `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` : ni mise à jour, ni CI, ni renvoi, et elles gardent `à-fusionner` ; personne ne retire ni ne repose une étiquette pour tenir cet ordre. Le sujet est rendu dans le tour dès que celle qui le tient entre ou n'est plus en route (fusionnée, renvoyée, sortie non classée de `sujet.sh`) : la suivante est prise aussitôt. Il reste tenu tant qu'elle est en route : mise à jour poussée et CI pas finie (sortie 8, puis « CI en cours »), reprise (5), worktree pas propre (6), échec du capitaine (11), et passage chez un autre capitaine (7), pour que deux capitaines ne mettent pas à jour deux sous-PR d'un même sujet à la fois. Une sous-PR rouge, bloquée, en brouillon, au plafond de renvois, ou sans CI et déjà à jour ne tient rien.

    b. `skills/chaine/fusionner/SKILL.md`, § « Boucle » (l. 81) : entre « Une PR mise de côté « sans CI » la relance quand sa CI apparaît. » et « « CI en cours », « attend », « bloquée » et brouillon ne relancent rien. », insérer la phrase :

    > Une sous-PR qui attend son tour dans son sujet la relance une fois à la sonde suivante, puis chaque fois que celle qui tient le sujet change d'état ou quitte la file.

    c. `skills/chaine/chantier/SKILL.md`, § 6 point 5 (l. 95) : le passage qui va de « **Une sous-PR à la fois par sujet.** Le capitaine met à jour et reteste toute sous-PR en retard sur son sujet » à « puis le repose sur la suivante dès que la précédente est entrée. » (la fin du point 5) devient :

    > **Une sous-PR à la fois par sujet : le capitaine tient cet ordre, pas le conducteur.** Le capitaine met à jour et reteste toute sous-PR en retard sur son sujet, même pour de la documentation (skill `fusionner`, « La règle d'ascendance ») : deux sous-PR prises ensemble se remettraient l'une l'autre en retard. À chaque tour, il ne prend donc que la plus ancienne des sous-PR étiquetées de chaque sujet ; les autres attendent leur tour avec leur étiquette, et `file.sh` les montre « prête » sans qu'elles bougent : ce n'est pas une file arrêtée. Le conducteur étiquette toutes les sous-PR prêtes d'une vague sans attendre que la précédente soit entrée, et il ne retire ni ne repose jamais `à-fusionner` pour régler l'ordre de passage.

    d. Le gabarit `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md` (l. 14) : « ; dans un sujet, une seule sous-PR porte `à-fusionner` à la fois. » devient :

    > ; dans un sujet, le capitaine ne prend qu'une sous-PR étiquetée à la fois, la plus ancienne, et les autres attendent leur tour avec leur étiquette.

    e. `skills/chaine/fusionner/references/CONTENU.md`, trois retouches. Section « `scripts/boucle.sh` » (l. 25), après « Sa CI qui ne finit pas sur le sommet poussé sort en 8 (`MISE À JOUR`, reprise au tour suivant). », insérer :

    > Une sous-PR à la fois par sujet (décision A-104) : à chaque tour, la plus ancienne des sous-PR étiquetées d'un sujet qui est en route (« prête », « prête (sans CI) », « prête (en conflit) », « CI en cours ») le tient, et les suivantes attendent leur tour (`attend son tour`), sans mise à jour, ni CI, ni renvoi ; il est rendu dans le tour quand elle entre ou n'est plus en route, et reste tenu sur les sorties 5, 6, 7, 8 et 11 de `sujet.sh fusionner` (0, 5, 6, 7 et 11 de `relancer`).

    Paragraphe « Plusieurs capitaines » (l. 32) : « est sautée sans renvoi. » devient « est sautée sans renvoi, et tient son sujet pour ce tour. ». Section « `scripts/veille.sh` » (l. 35) : « ou qu'une PR renvoyée ou relancée par la boucle revient dans la file ; elle s'arrête » devient :

    > ou qu'une PR renvoyée ou relancée par la boucle revient dans la file, ou qu'une sous-PR attend son tour dans son sujet (un second regard à la sonde suivante, puis à chaque changement d'état de celle qui tient le sujet, sortie de la file comprise) ; elle s'arrête

11. **Le test de `scripts/depot.test.mjs`.** Le test de la ligne 1133 perd sa dernière ligne (l'appel `exiger` qui porte l'ancienne phrase, l. 1142) et la fin de son titre (« , une sous-PR étiquetée à la fois »). Un test nouveau le suit (annexe E) : il exige les phrases nouvelles des deux skills et du gabarit d'ADR par `exiger`, et refuse six morceaux de l'ancienne discipline par `assert.ok(!plat(…).includes(…))` (il n'existe pas d'aide pour refuser un texte), version comprise.

12. **Version et note.** La mineure suivante de la version de `main` au moment de livrer (un comportement du capitaine change) : 7.32.0 tant que `main` porte une 7.31.x. Le numéro paraît à quatre endroits, à recaler ensemble : `.claude-plugin/plugin.json`, le titre de la note, et, dans le test de l'annexe E, son titre et l'appel `auMoins(version, "7.32.0")`. La note, en tête de `NOTES-DE-VERSION.md`, date du jour de la livraison, mot pour mot :

    ```markdown
    ## 7.32.0 — <AAAA-MM-JJ>

    ### Ce qui change

    « Une sous-PR à la fois par sujet » est tenue par le capitaine, plus par le conducteur. À chaque tour de sa boucle, le capitaine ne prend que la plus ancienne des sous-PR étiquetées de chaque sujet ; les autres attendent leur tour avec leur étiquette (`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` dans le journal), sans mise à jour, ni CI, ni renvoi, et la suivante est prise dans le tour où la précédente entre ou sort de la file. Une sous-PR en passage chez un autre capitaine tient aussi son sujet. La veille relance la boucle quand la sous-PR qui tient un sujet change d'état ou quitte la file. Le conducteur étiquette toutes les sous-PR prêtes d'une vague : il ne retire ni ne repose plus `à-fusionner` (skill `chantier` § 6), ce qui coûtait jusqu'à 45 minutes d'attente par sous-PR.

    ### Ce qu'un projet fait pour en profiter

    1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
    2. Reposer les scripts du capitaine, dans une PR du projet : `/maj-skills:fusionner poser`.
    3. Relancer chaque capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). La boucle se remplace d'elle-même par la version de develop ; la veille tourne sur sa copie, c'est elle qu'il faut recopier.
    4. D'ici là, le conducteur garde l'ancienne discipline, une seule sous-PR étiquetée à la fois par sujet : un capitaine dont les scripts ne sont pas reposés prend encore toutes les sous-PR étiquetées d'un sujet dans le même tour. Avec plusieurs capitaines, il ne l'abandonne qu'une fois tous relancés.
    ```

    `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont disputés par toute PR ouverte du plugin : partir de `main`, et **reprendre `main` avant de livrer** (version et note recalées sur ce que `main` porte alors).

13. **Si `main` a bougé depuis `a3c2a7c`.** Avant de coller quoi que ce soit : `git diff a3c2a7c origin/main -- skills/chaine/fusionner/scripts/boucle.sh skills/chaine/fusionner/scripts/veille.sh skills/chaine/sujet/scripts/sujet.sh skills/chaine/fusionner/scripts/file.sh`.
    - Vide pour `boucle.sh` et `veille.sh` : les annexes A et B se collent telles quelles, et les empreintes de l'étape 3 font foi.
    - `boucle.sh` a changé hors de `traiter_sujets` (l. 326 à 412), ou `veille.sh` hors de `lancer` et d'`etat_file` : coller quand même, les empreintes ne valent plus, le banc fait foi.
    - `traiter_sujets`, `lancer` ou `etat_file` ont changé : ne pas coller l'annexe. Reporter à la main, sur la fonction de `main`, les quatre retouches de l'annexe A (le commentaire et les variables ; le bloc qui fait attendre ; les deux `case "$rc"` qui rendent le sujet) ou les trois de l'annexe B, sans toucher au reste.
    - `sujet.sh fusionner` ou `relancer` a une sortie nouvelle, ou `file.sh` un état nouveau d'une sous-PR : la classer par les Décisions 2 et 5. Si elle ne s'y classe pas d'évidence, **s'arrêter et l'écrire au lanceur**, avec la sortie et son texte.

## À faire, dans l'ordre

1. Partir d'`origin/main` à jour, le ticket 56 entré. Relever sa version (`.claude-plugin/plugin.json`) et jouer le contrôle de la Décision 13.
2. **Banc d'abord.** Dans `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` : les deux retouches du banc existant « deux sous-PR en conflit d'index » et, en fin de fichier, les cinq cas nouveaux (annexe C). Dans `skills/chaine/fusionner/scripts/veille.test.mjs` : le cas nouveau (annexe D). Dans `scripts/depot.test.mjs` : les retouches de l'annexe E. Les jouer et **les voir rouges** : `node --test --test-name-pattern="^boucle.sh : une sous-PR (à la fois|qui sort|en passage|arrêtée)|^boucle.sh : une reprise|la seconde lue dans le même tour" skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` rend quatre rouges et deux verts (les cas 2 et 6 gardent ce que le code d'aujourd'hui fait déjà : ils rougissent sous les mutations 8, 9 et 11) ; `node --test --test-name-pattern="attend son tour" skills/chaine/fusionner/scripts/veille.test.mjs` rend un rouge (`1 !== 4`) ; le test nouveau de `scripts/depot.test.mjs` est rouge.
3. **Le code.** `boucle.sh` : remplacer, du commentaire « # Sous-PR et reciblages : rapides, faits avant chaque passage vers develop. » à l'accolade fermante de `traiter_sujets`, par l'annexe A, mot pour mot. `veille.sh` : les trois retouches de l'annexe B. Contrôle, si la Décision 13 a rendu un diff vide : `git hash-object` rend `351c56e1670dda544c02ea1d800c14893c3d5014` pour `boucle.sh` et `a57892ae85978a3fc953b75819722d55bacba507` pour `veille.sh` ; pour les bancs, si `main` ne les a pas touchés non plus, `56ac502d2ae643c050f0a158327d8731a5117c2d` (`sujet-fusionner.test.mjs`) et `edf2a78e49fe2ddb7d19fce974a17258842623d2` (`veille.test.mjs`).
4. Rejouer les bancs de l'étape 2 : verts, sauf celui de `scripts/depot.test.mjs`.
5. **Les textes** (Décision 10, a à e), puis la version et la note (Décision 12). `node --test scripts/depot.test.mjs` : vert.
6. Les mutations de « Vérification », une à la fois, chacune retirée avant la suivante.
7. La suite entière : `pnpm install --frozen-lockfile`, puis `pnpm test`, verte. Relever la durée du test « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (plafond de 600 s, `scripts/poses.test.mjs`) : les cinq cas nouveaux y sont rejoués (voir « Ce qui n'a pas été établi »). S'il dépasse son plafond sur une machine au calme, le dire au lanceur avec la durée, sans retirer de cas.
8. Reprendre `main`, recaler version et note, rejouer l'étape 7 si `main` a bougé, puis livrer : une PR vers `main`, selon la procédure du dépôt. Un cas rouge ne se corrige pas en changeant ce qu'il attend : il se dit au lanceur, avec sa sortie.

## Les cas du banc

Dans `sujet-fusionner.test.mjs` (annexe C). L'aide `sousPrDeSujets` monte un dépôt jouet : chaque sous-PR part de son sujet, verte sur son sommet de départ ; un sujet « en retard » avance ensuite. Le sommet qu'une mise à jour du capitaine pousse n'a aucun check : `sujet.sh fusionner` sort en 8.

| n° | Cas | Ce qu'il tient |
| -- | --- | -------------- |
| 1 | **Une sous-PR à la fois par sujet** : trois sous-PR en retard dans `sujet/lot` (#80, #81, #82), une à jour dans `sujet/autre` (#83). Tour 1 : #80 mise à jour (sortie 8), #81 et #82 ni mises à jour ni fusionnées, #83 entre. Tour 2, la CI de #80 en cours : rien ne bouge. Tour 3, CI verte : #80 entre et #81 est prise dans le même tour (mise à jour), #82 attend #81. Tour 4 : #81 entre, #82 est mise à jour. | la règle, la sortie 8 et l'état « CI en cours » qui tiennent, la sortie 0 qui rend, la clé par sujet ; trois mises à jour en tout, une par sous-PR (une fusion du capitaine par branche) ; aucune étiquette ni commentaire écrits |
| 2 | **Ce qui ne tient pas** : cinq sujets à deux sous-PR, la plus ancienne renvoyée (titre trop long, sortie 4), rouge, bloquée, en brouillon, ou sans CI et déjà à jour (`relancer`, sortie 3 muette). La seconde de chaque sujet entre dans le tour. | le renvoi qui rend, les états qui ne tiennent rien, la sortie 3 muette de `relancer` |
| 3 | **Le verrou** : #80 porte la marque de passage d'un autre capitaine. #81 attend, rien n'est écrit sur elle, pas même un verrou. La marque terminée, #80 entre et #81 dans le même tour. | la sortie 7 qui tient |
| 4 | **Reprise et échec** : #80 illisible à sa lecture (sortie 5), le commentaire de verrou de #82 refusé (sortie 11). #81 et #83 attendent. | les sorties 5 et 11 qui tiennent |
| 5 | (retouche du banc existant « deux sous-PR en conflit d'index ») #80 mise à jour par `relancer` ; #81 est lue dans le tour, et attend. | `relancer` réussi qui tient ; l'entrée de la boucle qu'un outil ne mange pas (ce que ce banc gardait déjà) |
| 6 | **La sortie 2** : le sujet est en conflit avec develop, #80 (partie de develop) sort en 2 ; la PR de mise à jour #81, plus récente, entre dans le même tour. | une sortie non classée qui rend ; aucun blocage entre une sous-PR et la PR de mise à jour qui la débloque |

Dans `veille.test.mjs` (annexe D), un cas : #81 attend #80. La boucle est relancée à la première sonde (second regard), pas à la suivante (même état), puis quand #80 passe « bloquée », pas à la suivante, puis quand #80 quitte la file : quatre lancements. Elle ne l'est plus dès que la boucle ne dit plus que #81 attend (deux lancements), et jamais sans cette ligne (un lancement).

## Surfaces

| Surface | Preuve |
| ------- | ------ |
| `traiter_sujets` : un sujet tenu par sa plus ancienne sous-PR en route | cas 1 à 6 du banc |
| `veille.sh` : la boucle relancée quand celle qui tient un sujet change d'état ou quitte la file | le cas de `veille.test.mjs` |
| `fusionner/SKILL.md`, `chantier/SKILL.md`, le gabarit d'ADR | le test nouveau de `scripts/depot.test.mjs` |
| `fusionner/references/CONTENU.md` | relecture (aucun test ne le lit) |

## Vérification

1. La suite entière du dépôt, verte (étape 7).
2. **Les mutations**, chacune appliquée seule, le cas nommé rejoué, puis retirée. Les trois premières sont celles du ticket d'origine ; toutes ont été jouées à l'écriture, toutes rouges.

   | n° | Mutation | Où | Cas qui rougit |
   | -- | -------- | -- | -------------- |
   | 1 | **la règle retirée** : `*" $tient:"*)` ne correspond jamais | `boucle.sh` | cas 1, tour 1 : trois mises à jour poussées au lieu d'une |
   | 2 | **le sujet tenu après une fusion** : `0` ajouté à `5 \| 6 \| 7 \| 8 \| 11` | `boucle.sh` | cas 1, tour 3 : #81 attend un tour de trop |
   | 3 | **le sujet rendu après une sortie 8** : `8` retiré de cette liste | `boucle.sh` | cas 1, tour 1 : #81 est mise à jour pendant la CI de #80 |
   | 4 | « CI en cours » ne tient plus (retiré du motif des états) | `boucle.sh` | cas 1, tour 2 |
   | 5 | le verrou rend : `7` retiré de la liste de `fusionner` | `boucle.sh` | cas 3 |
   | 6 | une reprise rend : `5` retiré | `boucle.sh` | cas 4 |
   | 7 | un échec du capitaine rend : `11` retiré | `boucle.sh` | cas 4 |
   | 8 | une sortie non classée tient : `2` ajouté | `boucle.sh` | cas 6 |
   | 9 | un renvoi tient : `4` ajouté | `boucle.sh` | cas 2 |
   | 10 | `relancer` réussi rend : `0` retiré de `0 \| 5 \| 6 \| 7 \| 11` | `boucle.sh` | cas 5 |
   | 11 | la sortie 3 de `relancer` tient : `3` ajouté | `boucle.sh` | cas 2 |
   | 12 | une clé commune à tous les sujets : `tient=sujet/tous` | `boucle.sh` | cas 1, tour 1 |
   | 13 | la veille ne suit plus rien : `if (0) print` dans `etat_file` | `veille.sh` | le cas de `veille.test.mjs` |
   | 14 | la veille ne lit plus l'état de celle qui tient le sujet (une constante à sa place) | `veille.sh` | le cas de `veille.test.mjs` |

3. Dans le cas 1, compter les mises à jour poussées : une par tour aux tours 1, 3 et 4, aucune au tour 2, trois en tout, une par sous-PR. Le banc le compte deux fois : par les lignes « mise à jour poussée » de chaque tour, et par le nombre de fusions sur chaque branche (`git rev-list --merges --count`, 1).
4. `git diff origin/main -- skills/chaine/chantier/SKILL.md skills/chaine/fusionner/SKILL.md` : trois lignes changées en tout (une, puis deux).

## Ce qui a été joué

Sur un clone neuf d'`origin/main` à `a3c2a7c` (`git clone`, `git fetch https://github.com/MAJ-agency/skills main`, `git checkout FETCH_HEAD`, `pnpm install --frozen-lockfile`), le 2026-11-19 : node 22.23, git 2.43, bash 5.2, jq 1.7, mawk 1.3.4. La machine, à quatre cœurs, était partagée avec d'autres suites pendant tout l'essai : les durées se lisent avec la charge.

1. **`main` intact.** `pnpm test` : 1 072 tests, 1 071 verts, 1 rouge, en 1 181 s. Le rouge est « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin », qui dépasse son plafond de 600 s (charge de 22 à 28) ; rejoué seul sur `main` intact à la même charge, il le dépasse encore (603 s). Ce rouge ne doit rien au ticket.
2. **Les bancs seuls, avant le code** (étape 2). Boucle : quatre rouges, deux verts. Cas 1 : au tour 1, les mises à jour poussées sont `[80, 81, 82]` au lieu de `[80]`, le défaut même ; cas 3, 4 et 5 : aucune ligne `attend son tour`. Veille : rouge, `1 !== 4`, un seul lancement : la sous-PR qui attend n'est reprise par personne, ni quand celle qui tient son sujet passe « bloquée », ni quand elle quitte la file. Dépôt : rouge.
3. **Avec le code, les textes, la version et la note** : `pnpm test`, **1 079 tests, 1 079 verts, aucun rouge**, en 608 s (charge de 6 à 14). Sept tests de plus que `main` : cinq dans `sujet-fusionner.test.mjs`, un dans `veille.test.mjs`, un dans `scripts/depot.test.mjs`. Un seul banc existant a dû changer, celui de l'annexe C (« deux sous-PR en conflit d'index ») : il attendait que la seconde sous-PR du même sujet soit mise à jour dans le tour. Durées dans cette passe : les cinq cas nouveaux de la boucle, 47, 29, 20, 13 et 11 s (120 s en tout) ; le cas de la veille, 4 s ; « les bancs posés à plat… », 487 s.
4. **Les quatorze mutations** de « Vérification » : toutes rouges, chacune sur le cas nommé. Jouées sur un second clone du même sommet portant le même diff (même `git diff | sha256sum`), les deux scripts remis d'origine après chacune, l'empreinte du diff revérifiée à la fin.
5. **« Les bancs posés à plat… », seul, deux fois de suite à charge comparable** : mesure lancée, interrompue avant son premier résultat (quota de la session) : non établi. Le seul relevé avec le ticket est celui du point 3 (487 s, sous le plafond de 600 s) ; à refaire à l'étape 7.
6. **Les annexes relues depuis ce fichier** : les blocs des annexes A à E, extraits de ce ticket et reportés sur les fichiers de `a3c2a7c`, redonnent octet pour octet les cinq fichiers joués (les quatre empreintes de l'étape 3, et `scripts/depot.test.mjs`) ; les six textes cités à la Décision 10 et la note de la Décision 12 sont ceux des fichiers joués.
7. La variante écartée à la Décision 7 (relancer la boucle à chaque sonde tant qu'une sous-PR attend) a été jouée aussi : rouge sans elle, verte avec elle, puis remplacée par le suivi de l'état.

## Ce qui n'a pas été établi

- **Rien n'a tourné contre un GitHub réel.** Le faux GitHub du banc ne rejoue pas : l'état que rend `file.sh` juste après une relance des jobs rouges (« CI rouge » encore, ou déjà « CI en cours ») ; les notifications que reçoit une PR quand un second capitaine y pose puis retire son commentaire de verrou (une fois au second regard, puis à chaque changement d'état de celle qui tient le sujet) ; deux capitaines réels en même temps, que le banc imite par une marque posée dans l'état.
- **La durée au calme.** La machine de l'essai était partagée (quatre cœurs, charge entre 14 et 28 pendant tout l'essai, par d'autres suites). Les cinq cas nouveaux du banc de la boucle y ont pris 120 s à une charge de 6 à 14 (210 s à une charge de 28) ; `scripts/poses.test.mjs`, qui rejoue tous les bancs posés sous un plafond de 600 s, y dépasse ce plafond **sur `main` intact** (voir « Ce qui a été joué »). Ce que ces cas ajoutent à ce test sur une machine au calme n'est pas mesuré : l'étape 7 le relève.
- **Le coût des passes de plus.** Une sous-PR qui attend fait relancer la boucle une fois à la sonde suivante, puis à chaque changement d'état de celle qui tient son sujet. Le nombre d'appels à GitHub d'une passe à vide n'a pas été compté.
- **Une sortie 11 ou 6 qui dure tient son sujet sans limite** (un push que le distant refuse à chaque tour sur la branche d'une sous-PR, par exemple). C'est la décision du 2026-11-18. La boucle le dit à chaque passe (`ÉCHEC DU CAPITAINE`, `PAS PROPRE`, dans le filtre du `Monitor`), mais la veille ne relance rien tant que rien ne change dans la file : c'est déjà vrai aujourd'hui pour la sous-PR elle-même, cela le devient pour celles qui la suivent.
- **Une PR de mise à jour ouverte pendant qu'une sous-PR plus ancienne est en route** attend son tour, puis est refusée (sortie 4, « le premier parent n'est pas le sommet ») dès que cette sous-PR entre : elle est à refaire. Le skill `chantier` la fait ouvrir entre deux vagues, sans sous-PR ouverte ; hors de ce cas, avant ce ticket, elle pouvait entrer pendant la CI d'une sous-PR plus ancienne. Non rejoué.
- **La composition avec la relecture indépendante** (lots 4 à 6 du chantier 3), qui suppose ce ticket entré : non rejouée.

## Hors périmètre

- `sujet.sh`, `passer.sh`, `file.sh`, `github.sh` : rien à y changer. `file.sh` continue de montrer « prête » une sous-PR qui attend son tour.
- Les PR vers `develop` : la file y est déjà traitée une PR à la fois.
- Le protocole des étiquettes de la relecture indépendante : spec du chantier 3, lots 4 à 6.
- Une sous-PR restée « prête » après une sortie 5, 6 ou 11 n'est reprise qu'au prochain changement de la file : défaut d'avant ce ticket, à déposer à part s'il gêne.
- La ligne de la boucle pour une sortie 7 de `fusionner`, qui ne dit pas si c'est un verrou : inchangée.
- L'ADR « branches de sujet » déjà posée dans un projet : elle reste telle quelle, le projet la révise s'il le veut.

## Comments

- 2026-11-18 — Architecte : écrit au niveau de la décision, sans repère de ligne, parce que `boucle.sh` bouge sous les tickets de l'autre programme. **`needs-info` jusqu'à leur entrée** ; il passe alors `ready-for-agent` après une relecture par un agent neuf sur `main`.
- 2026-11-19 — Remis à jour sur `origin/main` à `a3c2a7c` (plugin 7.31.0, les tickets de l'autre programme entrés jusqu'à la PR 133) et passé `ready-for-agent`. Ce que cette remise à jour change : (1) la Décision 3 est récrite sur les sorties réelles de `sujet.sh fusionner` et `relancer`, une table par geste ; (2) **la sortie 7 tient désormais le sujet**, parce qu'elle est d'abord, depuis la PR 133, le verrou d'un autre capitaine (Décision 4) : le texte d'origine la rangeait parmi celles qui rendent ; (3) **l'état « CI en cours » tient le sujet** bien que la boucle n'y fasse aucun geste, sans quoi la règle tombait au tour qui suit une sortie 8 (Décision 2) ; (4) la sortie 3 muette de `relancer` rend le sujet (Décision 3) ; (5) **`veille.sh` entre dans le ticket** : sans retouche, une sous-PR qui attend n'était reprise par personne quand celle qui tenait son sujet quittait la file sans y entrer, reproduit puis corrigé (Décision 7) ; le texte d'origine disait « aucun autre script n'est touché » ; (6) le gabarit d'ADR « branches de sujet » et `fusionner/references/CONTENU.md` portaient aussi l'ancienne discipline (Décision 10) ; (7) le code, les bancs, les textes, le test de dépôt et la note sont donnés mot pour mot et joués, d'où `Modèle: sonnet` ; (8) `Blocked by: 56`. **À trancher par l'architecte**, parce qu'aucune décision écrite ne les portait : les Décisions 2 (« CI en cours » tient, « CI rouge » non), 3 (la sortie 3 muette de `relancer` rend), 4 (toute sortie 7 tient) et 7 (la veille suit l'état de celle qui tient le sujet, plutôt qu'une relance à chaque sonde).

## Annexe A — `traiter_sujets`, dans `skills/chaine/fusionner/scripts/boucle.sh`

Remplace, sur `main` à `a3c2a7c`, les lignes 326 à 412 : du commentaire « # Sous-PR et reciblages : rapides, faits avant chaque passage vers develop. » à l'accolade fermante de la fonction. Quatre retouches par rapport à `main` : le commentaire de tête et les variables `tient`, `par`, `tenus` ; le bloc `tient=''` … `esac` qui fait attendre, avant le `case "$etat"` des gestes ; et, à la fin des branches de `relancer` et de `fusionner`, un `case "$rc"` qui rend le sujet (le `esac ;;` d'origine devient `esac`, suivi de ce `case`).

````bash
# Sous-PR et reciblages : rapides, faits avant chaque passage vers develop.
# Une sous-PR à la fois par sujet (décision A-104). Dans l'ordre de file.sh (numéro croissant), la première sous-PR
# d'un sujet en état de passer (« prête », « prête (sans CI) », « prête (en conflit) », « CI en cours ») tient ce sujet :
# les suivantes du même sujet attendent leur tour, sans mise à jour, ni CI, ni renvoi, et gardent leur étiquette
# (`attend son tour`, que la veille lit : elle relance la boucle à la sonde suivante, puis quand celle qui tient le
# sujet change d'état ou quitte la file). Le sujet est rendu dans le tour quand celle qui le tient n'est plus en route
# vers l'entrée : fusionnée, renvoyée, ou refusée par une sortie non classée. Il reste tenu sur une sortie qui la
# laisse en route : 5, 6, 8, 11, `relancer` réussi, et 7, qui est d'abord le verrou d'un autre capitaine (deux
# capitaines ne mettent pas à jour deux sous-PR d'un même sujet à la fois).
# `tenus` : « sujet/<nom>:<numéro> », entre espaces (un nom de branche ne contient ni espace ni deux-points) ; jamais
# un tableau associatif, dont l'indice, un nom de branche, serait évalué.
traiter_sujets() {
  local n etat sujet rc tient par tenus=' '
  verifier_arret
  # Séries par spec et piles : regroupées d'office (hors prio:haute et hors-sujet).
  bash "$SUJET" regrouper-series 2>&1 | sed 's#^série #[sujets] REGROUPÉE série #; s#^#  #'
  # Le corps lit /dev/null, jamais l'entrée de la boucle : un outil lancé qui lit son entrée (pnpm, un hook, `cat`)
  # mangeait les lignes suivantes de file.sh, et les sous-PR suivantes n'étaient pas traitées dans le tour.
  bash "$outils/file.sh" | while IFS="$(printf '\t')" read -r n etat _ livre; do
    case " $sautees " in *" $n "*) continue ;; esac
    # Ticket d'un sujet déjà livré : PR directe vers develop, `hors-sujet` posé.
    if [ -n "$livre" ]; then
      poser_label "$n" hors-sujet &&
        commenter "$n" "$(printf 'Le sujet de ce ticket est déjà livré dans develop : PR laissée vers \`develop\` (label \`hors-sujet\`), jamais reciblée sur la branche de sujet.\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_')" &&
        echo "[#$n] hors-sujet posé ($livre)"
    fi </dev/null
    tient=''
    case "$etat" in
      sujet/*' : prête' | sujet/*' : prête (sans CI)' | sujet/*' : prête (en conflit)' | sujet/*' : CI en cours')
        tient=${etat%% : *}
        case "$tenus" in
          *" $tient:"*)
            par=${tenus#*" $tient:"}
            echo "[#$n] attend son tour : #${par%% *} passe d'abord dans $tient"
            continue ;;
        esac
        tenus="$tenus$tient:$n " ;;
    esac
    case "$etat" in
      'vers sujet/'*)
        sujet=${etat#vers sujet/}
        bash "$SUJET" regrouper "$sujet" "$n" 2>&1 | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        case "$rc" in
          0) echo "[#$n] REGROUPÉE dans sujet/$sujet (son ticket le déclare)" ;;
          6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, regroupement repris au tour suivant (aucun renvoi)" ;;
          *) echo "[#$n] regroupement dans sujet/$sujet impossible (SUJET EN CONFLIT ?)" ;;
        esac ;;
      'prête (à recibler sur sujet/'*)
        sujet=${etat#prête (à recibler sur }
        sujet=${sujet%)}
        gh api -X PATCH "$DEPOT/pulls/$n" -f base="$sujet" >/dev/null && echo "[#$n] RECIBLÉE sur $sujet (parente fusionnée dedans)" ;;
      sujet/*': prête (sans CI)' | sujet/*': prête (en conflit)')
        bash "$SUJET" relancer "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        case "$rc" in
          # Conflit hors index : `relancer` écrit `conflit avec <sujet> hors index générés :`, puis les fichiers indentés de
          # deux espaces ; la liste s'arrête à la première autre ligne (fin de ligne CRLF tolérée).
          2)
            fichiers=$(awk -v d="conflit avec ${etat%% :*} hors index générés :" '{ sub(/\r$/, "") } index($0, d) == 1 { f = 1; next } f && /^  [^ ]/ { sub(/^  /, ""); printf "%s`%s`", (k++ ? ", " : ""), $0; next } { f = 0 }' "$sortie")
            bash "$outils/renvoyer.sh" "$n" "conflit avec ${etat%% :*} hors index générés : ${fichiers:-voir la sortie de sujet.sh relancer}. Fusionner ${etat%% :*} dans la branche et le résoudre" ;;
          # Classée sur la DERNIÈRE ligne de relancer (son `sortir`), jamais sur un motif cherché dans toute la sortie :
          # celle d'un hook relayée peut porter ces mots. Trace de husky (A-22) : le pre-push refuse la mise à jour,
          # la sous-PR est renvoyée avec la sortie du hook. Toute autre sortie 3 (rien à pousser, conflit apparu
          # entre le contrôle et la fusion, hook de commit) reste silencieuse : le tour suivant la rejuge.
          3)
            fin=$({ grep . "$sortie" || true; } | tail -n 1 | tr -d '\r')
            if [[ "$fin" == "mise à jour de #$n refusée par le hook pre-push"* ]]; then
              bash "$outils/renvoyer.sh" "$n" "le pre-push refuse le push de la mise à jour avec ${etat%% :*}. Sortie du hook : $(extrait_hook "$sortie")"
            fi ;;
          4) bash "$outils/refus.sh" "$n" "$sortie" ;; # tête gardée : renvoyée avec le motif
          6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file (aucun renvoi)" ;;
          5) echo "[#$n] REPRISE au tour suivant (sous-PR bougée ou GitHub illisible), aucun renvoi" ;;
          7) echo "[#$n] en passage chez un autre capitaine : sautée (aucun renvoi)" ;;
          # Push refusé par le distant, sans trace du hook : côté capitaine ou du distant, jamais un renvoi.
          11) echo "[#$n] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file (aucun renvoi), cause ci-dessus" ;;
        esac
        # Mise à jour poussée (0), reprise (5, 6, 11) ou verrou d'un autre capitaine (7) : le sujet reste tenu. Renvoyée
        # (2, 4, 3 du pre-push), ou sortie 3 muette (rien de poussé, et rien ne dit qu'elle passera un jour) : rendu.
        case "$rc" in 0 | 5 | 6 | 7 | 11) ;; *) tenus=${tenus/" $tient:$n "/ } ;; esac ;;
      sujet/*': prête')
        # Passé l'échéance, aucun `sujet.sh fusionner` (il peut attendre une CI) : le code remonte du sous-shell.
        ! echeance_passee || exit "$ECHEANCE_TUBE"
        bash "$SUJET" fusionner "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        case "$rc" in
          0) echo "[#$n] FUSIONNÉE dans ${etat%%:*}" ;;
          # Checks rouges, conflit avec le sujet, hook : le motif est celui de sujet.sh, jamais un conflit supposé.
          3) bash "$outils/refus.sh" "$n" "$sortie" 3 ;;
          4) bash "$outils/refus.sh" "$n" "$sortie" ;; # corrigeable (titre, revue, base) : renvoyée
          5) echo "[#$n] REPRISE au tour suivant (sous-PR ou sujet bougé, checks en cours, GitHub illisible), aucun renvoi" ;;
          # Worktree du capitaine sale : rien que l'auteur puisse corriger, jamais un renvoi.
          6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file (aucun renvoi)" ;;
          7) echo "[#$n] sous-PR non éligible (fermée, en brouillon, ou en passage chez un autre capitaine)" ;;
          8) echo "[#$n] MISE À JOUR avec ${etat%% :*} poussée, CI pas finie : repasse au tour suivant" ;;
          # Arbre du squash ≠ arbre testé : arrêt. Le `while` tourne dans le sous-shell du tube : le code remonte
          # après lui (PIPESTATUS), et la boucle sort en 12.
          12) echo "ARRÊT sur #$n (sortie 12) : arbre du squash ≠ arbre testé"; exit 12 ;;
          # Outil du capitaine en échec, ou push refusé par le distant : rien que la session puisse corriger.
          11) echo "[#$n] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file (aucun renvoi), cause ci-dessus" ;;
          *) echo "[#$n] sous-PR non éligible (sortie $rc)" ;;
        esac
        # Reprise (5, 6, 11), verrou d'un autre capitaine (7) ou CI de la mise à jour en cours (8) : le sujet reste tenu.
        # Fusionnée (0), renvoyée (3, 4) ou sortie non classée (2, le sujet en conflit avec develop : la PR de mise à
        # jour qui le résout est plus loin dans la file) : rendu.
        case "$rc" in 5 | 6 | 7 | 8 | 11) ;; *) tenus=${tenus/" $tient:$n "/ } ;; esac ;;
    esac </dev/null
  done
  rc=${PIPESTATUS[1]}
  [ "$rc" != 12 ] || exit 12
  [ "$rc" != "$ECHEANCE_TUBE" ] || finir_echeance
  # Sujets finis : PR finale ouverte, elle entre dans la file au tour suivant.
  verifier_arret
  bash "$SUJET" livrer-prets 2>&1 | sed 's#^#[sujets] #; s#PR \(\#[0-9]*\) ouverte#LIVRÉ : PR \1 ouverte#'
  git switch -q --detach origin/develop 2>/dev/null || true
}
````

## Annexe B — `skills/chaine/fusionner/scripts/veille.sh`, trois retouches

1. Dans l'en-tête, après la ligne « # la boucle. » (l. 13) et avant « # « prête (sans CI) » est un état à part », insérer :

````bash
# Une sous-PR qui attend son tour dans son sujet (`[#n] attend son tour : #m passe d'abord…`, boucle.sh) reste
# « prête », la même ligne de sonde en sonde, et celle qui tient le sujet peut quitter la file sans qu'aucune ligne
# n'apparaisse (étiquette retirée, `fusion-bloquée`, fermée, brouillon). La sonde ajoute donc, pour chaque sous-PR
# qui attend, la ligne « n attend #m (<état de #m dans la file>) » : nouvelle à la première sonde qui suit la boucle
# (un second regard), puis chaque fois que l'état de #m change ou que #m quitte la file, elle relance la boucle.
````

2. Dans `lancer`, après la ligne qui retire les PR `agies` de `vu` et avant l'accolade fermante, insérer :

````bash
  # Sous-PR qui attendent leur tour, « n:m » (n attend que #m, qui tient son sujet, soit passée) : etat_file les suit.
  attentes=$(sed -nE 's/^\[#([0-9]+)\] attend son tour : #([0-9]+) .*/\1:\2/p' "$journal_boucle" | tr '\n' ' ')
````

3. Le commentaire et la fonction `etat_file` (l. 176 à 184) deviennent :

````bash
# Lignes « numéro état » des PR à traiter (prêtes ou rouges), triées ; puis, pour chaque sous-PR qui attend son tour
# et qui est encore dans la file, « n attend #m (<état de #m>) », l'état de celle qui tient son sujet.
attentes=""
etat_file() {
  local sortie
  sortie=$(bash "$outils/file.sh" 2>/dev/null) || return 1
  printf '%s\n' "$sortie" | awk -F '\t' -v attentes="$attentes" '
    { etat[$1] = $2 }
    $2 ~ /CI rouge/ { print $1 " rouge"; next }
    $2 ~ /sans CI/  { print $1 " sans-ci"; next }
    $2 ~ /prête/    { print $1 " prête" }
    END {
      k = split(attentes, a, " ")
      for (i = 1; i <= k; i++) {
        split(a[i], p, ":")
        if (p[1] in etat) print p[1] " attend #" p[2] " (" (p[2] in etat ? etat[p[2]] : "hors de la file") ")"
      }
    }' | sort
}
````

## Annexe C — `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`

Deux retouches du banc existant (l. 221 et l. 236 à `a3c2a7c`). Son titre :

````js
test("boucle.sh : deux sous-PR en conflit d'index, la première mise à jour par relancer sous un outil qui lit l'entrée, la seconde traitée dans le même tour", () => {
````

devient :

````js
test("boucle.sh : deux sous-PR en conflit d'index, la première mise à jour par relancer sous un outil qui lit l'entrée, la seconde lue dans le même tour : elle attend son tour", () => {
````

et sa dernière assertion :

````js
  assert.equal(d.git("rev-parse", "origin/docs/autre^1"), autre, `#81 mise à jour dans le même tour : ${r.stdout}`);
````

devient :

````js
  // La ligne de #81 est lue (l'entrée de la boucle n'est pas mangée), et #81 attend : #80 tient le sujet (ticket 57).
  assert.match(r.stdout, /^\[#81\] attend son tour : #80 passe d'abord dans sujet\/lot$/m, r.stdout);
  assert.equal(d.git("rev-parse", "origin/docs/autre"), autre, "#81 n'est pas mise à jour tant que #80 tient le sujet");
````

Puis, en fin de fichier, après une ligne vide :

````js
// ── Une sous-PR à la fois par sujet (ticket 57 de gouverner-nos-boucles, décision A-104) ─────────────────────────
// La boucle ne prend, à chaque tour, que la plus ancienne des sous-PR étiquetées de chaque sujet encore en route ; les
// autres attendent leur tour, sans mise à jour, ni CI, ni renvoi. `sujets` : { <nom>: [numéros] } ; chaque sous-PR part
// de son sujet et ajoute `docs/pr-<n>.md` ; un sujet nommé dans `retard` reçoit ensuite un fichier : ses sous-PR sont en
// retard. Checks : verts sur les sommets de départ (par sha) ; aucun sur un autre commit (le sommet d'une mise à jour du
// capitaine, dont `sujet.sh fusionner` sort alors en 8), jusqu'à `ci` ou `checksDe`.
function sousPrDeSujets(sujets, { retard = [] } = {}) {
  const d = depotJouet();
  const checks = {};
  const pulls = [];
  for (const [nom, numeros] of Object.entries(sujets)) {
    d.branche(`sujet/${nom}`, "origin/develop", { [`docs/${nom}.md`]: `${nom}\n` }, `feat(${nom}): lot (#1)`);
    for (const n of numeros) {
      checks[d.branche(`feat/pr-${n}`, `origin/sujet/${nom}`, { [`docs/pr-${n}.md`]: `${n}\n` })] = { qualite: "SUCCESS" };
      pulls.push({ number: n, title: `docs(${nom}): pr ${n}`, head: `feat/pr-${n}`, base: `sujet/${nom}`, labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" });
    }
    if (retard.includes(nom)) d.branche(`sujet/${nom}`, `origin/sujet/${nom}`, { [`docs/${nom}-suite.md`]: "suite\n" }, `feat(${nom}): suite (#2)`);
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  d.publierChaine();
  return d;
}
const teteDe = (d, n) => d.git("ls-remote", "origin", `refs/heads/feat/pr-${n}`).split("\t")[0];
// Numéros des sous-PR que la boucle a mises à jour et poussées dans ce tour, dans l'ordre du journal.
const poussees = (r) => [...r.stdout.matchAll(/^\[#(\d+)\] #\d+ en retard sur sujet\/[a-z-]+ : mise à jour poussée/gm)].map((m) => Number(m[1]));
const attend = (n, par, sujet = "lot") => new RegExp(`^\\[#${n}\\] attend son tour : #${par} passe d'abord dans sujet/${sujet}$`, "m");
const fusionnees = (d) => d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number).sort((a, b) => a - b);
// La CI des commits sans entrée à leur sha : `ci(d, "IN_PROGRESS")` la dit en cours, `ci(d, null)` la retire.
const ci = (d, etat) => {
  const { "*": _, ...checks } = d.etat().checks;
  d.github({ checks: etat === null ? checks : { ...checks, "*": { qualite: etat } } });
};
// La CI du sommet courant de ces sous-PR.
const checksDe = (d, etat, ...numeros) => d.github({ checks: { ...d.etat().checks, ...Object.fromEntries(numeros.map((n) => [teteDe(d, n), { qualite: etat }])) } });
const changerPr = (d, n, champs) => d.github({ pulls: d.etat().pulls.map((p) => (p.number === n ? { ...p, ...champs } : p)) });
const tour = (d) => {
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r;
};

test("boucle.sh : une sous-PR à la fois par sujet — la plus ancienne tient le sujet tant qu'elle est en route, la suivante est prise dans le tour où elle entre ; trois sous-PR, trois mises à jour, une par sous-PR ; un autre sujet n'attend pas", () => {
  const d = sousPrDeSujets({ lot: [80, 81, 82], autre: [83] }, { retard: ["lot"] });
  const depart = { 81: teteDe(d, 81), 82: teteDe(d, 82) };
  const intactes = (...numeros) => numeros.forEach((n) => assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`));
  // Tour 1 : #80, en retard, est mise à jour et poussée ; sa CI ne finit pas (sortie 8). #81 et #82 ne sont ni mises à
  // jour ni fusionnées. #83, d'un autre sujet, entre dans le même tour.
  let r = tour(d);
  assert.match(r.stdout, /\[#80\] MISE À JOUR avec sujet\/lot poussée, CI pas finie : repasse au tour suivant/);
  assert.deepEqual(poussees(r), [80], `une seule mise à jour poussée dans le tour : ${r.stdout}`);
  intactes(81, 82);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, attend(82, 80));
  assert.match(r.stdout, /\[#83\] FUSIONNÉE dans sujet\/autre/);
  // Tour 2 : la CI de #80 tourne (« CI en cours », aucun geste de la boucle) : elle tient toujours le sujet.
  ci(d, "IN_PROGRESS");
  r = tour(d);
  assert.deepEqual(poussees(r), [], `aucune mise à jour pendant la CI de #80 : ${r.stdout}`);
  intactes(81, 82);
  assert.deepEqual(fusionnees(d), [83]);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, attend(82, 80));
  // Tour 3 : la CI de #80 est verte : elle entre, le sujet est rendu, #81 est prise dans le même tour (mise à jour
  // poussée, sortie 8) et tient le sujet à son tour.
  ci(d, null);
  checksDe(d, "SUCCESS", 80);
  r = tour(d);
  assert.match(r.stdout, /\[#80\] FUSIONNÉE dans sujet\/lot/);
  assert.deepEqual(poussees(r), [81], r.stdout);
  assert.match(r.stdout, attend(82, 81));
  intactes(82);
  // Tour 4 : #81 entre, #82 est mise à jour à son tour, et plus rien n'attend.
  checksDe(d, "SUCCESS", 81);
  r = tour(d);
  assert.match(r.stdout, /\[#81\] FUSIONNÉE dans sujet\/lot/);
  assert.deepEqual(poussees(r), [82], r.stdout);
  assert.doesNotMatch(r.stdout, /attend son tour/);
  assert.deepEqual(fusionnees(d), [80, 81, 83]);
  // Trois mises à jour en tout, une par sous-PR : une seule fusion du capitaine sur chaque branche.
  d.git("fetch", "-q", "origin");
  for (const n of [80, 81, 82]) assert.equal(d.git("rev-list", "--merges", "--count", `origin/feat/pr-${n}`), "1", `#${n}`);
  // Aucune étiquette touchée, aucun commentaire hors ceux du verrou du passage : chaque sous-PR a gardé `à-fusionner`.
  assert.ok(!ecritures(d).some((e) => /issues\/\d+\/(labels|comments)/.test(e)), ecritures(d).join());
});

test("boucle.sh : une sous-PR qui sort de la file ou n'est pas en route ne tient pas son sujet, la suivante est prise dans le même tour (renvoyée, CI rouge, bloquée, en brouillon, sans CI et déjà à jour)", () => {
  const d = sousPrDeSujets({ renvoi: [80, 81], rouge: [82, 83], bloquee: [84, 85], brouillon: [86, 87], "sans-ci": [88, 89] });
  changerPr(d, 80, { title: `docs(renvoi): ${"x".repeat(120)}` });
  checksDe(d, "FAILURE", 82);
  changerPr(d, 84, { labels: ["à-fusionner", "fusion-bloquée"] });
  changerPr(d, 86, { draft: true });
  // Sans CI et déjà à jour : `sujet.sh relancer` sort en 3 (« contient déjà »), sans rien pousser, à chaque tour.
  d.github({ checks: Object.fromEntries(Object.entries(d.etat().checks).filter(([sha]) => sha !== teteDe(d, 88))) });
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] RENVOI : sujet du squash à \d+ caractères/);
  assert.match(r.stdout, /\[#88\] #88 contient déjà sujet\/sans-ci : aucun commit à pousser/);
  for (const [n, sujet] of [[81, "renvoi"], [83, "rouge"], [85, "bloquee"], [87, "brouillon"], [89, "sans-ci"]])
    assert.match(r.stdout, new RegExp(`\\[#${n}\\] FUSIONNÉE dans sujet/${sujet}`), r.stdout);
  assert.doesNotMatch(r.stdout, /attend son tour/);
  assert.deepEqual(fusionnees(d), [81, 83, 85, 87, 89]);
});

test("boucle.sh : une sous-PR en passage chez un autre capitaine tient son sujet ; ce passage terminé, elle entre et la suivante est prise dans le même tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81] });
  ci(d, "SUCCESS");
  changerPr(d, 80, { commentaires: [marqueDe("capitaine-jordan")] });
  let r = tour(d);
  assert.match(r.stdout, /\[#80\] sous-PR non éligible \(fermée, en brouillon, ou en passage chez un autre capitaine\)/);
  assert.match(r.stdout, attend(81, 80));
  assert.deepEqual(fusionnees(d), []);
  assert.ok(!d.journal().some((e) => /issues\/81\/|pulls\/81\//.test(e.route)), "rien d'écrit sur #81, pas même un verrou");
  // L'autre capitaine a terminé son passage (marque de fin) sans faire entrer #80.
  changerPr(d, 80, { commentaires: [`${marqueDe("capitaine-jordan")}\n<!-- capitaine:fin -->`], supprimes: [], editions: {} });
  r = tour(d);
  assert.match(r.stdout, /\[#80\] FUSIONNÉE dans sujet\/lot/);
  assert.match(r.stdout, /\[#81\] FUSIONNÉE dans sujet\/lot/);
  assert.deepEqual(fusionnees(d), [80, 81]);
});

test("boucle.sh : une reprise (sortie 5) et un échec du capitaine (sortie 11) laissent le sujet tenu : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ reprise: [80, 81], echec: [82, 83] });
  // #80 : GitHub illisible à la lecture de la PR (sortie 5). #82 : le commentaire du verrou du passage est refusé (11).
  d.github({ pannes: [{ route: "^pulls/80$" }], commentairesRefuses: "capitaine:passage" });
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] REPRISE au tour suivant/);
  assert.match(r.stdout, attend(81, 80, "reprise"));
  assert.match(r.stdout, /\[#82\] ÉCHEC DU CAPITAINE/);
  assert.match(r.stdout, attend(83, 82, "echec"));
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : une sous-PR arrêtée par le conflit de son sujet avec develop (sortie 2) rend le sujet : la PR de mise à jour, plus récente, entre dans le même tour", () => {
  const { d } = miseAJour();
  d.branche("feat/sous", "origin/develop", { "docs/sous.md": "sous\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [{ number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }, ...d.etat().pulls] });
  d.publierChaine();
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] sous-PR non éligible \(sortie 2\)/);
  assert.match(r.stdout, /\[#81\] FUSIONNÉE dans sujet\/lot/);
  assert.doesNotMatch(r.stdout, /attend son tour/);
});
````

## Annexe D — `skills/chaine/fusionner/scripts/veille.test.mjs`

À insérer avant le test « PR sautée par la boucle, renvoi d'une autre : pas de relance en rond », suivi d'une ligne vide :

````js
// Ticket 57 de gouverner-nos-boucles (A-104) : une sous-PR qui attend son tour reste « prête », la même ligne de sonde
// en sonde ; celle qui tient son sujet peut quitter la file sans qu'aucune ligne n'apparaisse (étiquette retirée,
// `fusion-bloquée`, fermée). La sonde suit donc l'état de celle qui tient le sujet.
test("sous-PR qui attend son tour dans son sujet : un second regard à la sonde suivante, puis une relance chaque fois que celle qui tient le sujet change d'état ou quitte la file", () => {
  const file = (etat80) => `${etat80 === null ? "" : `80\t${etat80}\t\n`}81\tsujet/lot : prête\t\n`;
  const attend = "[#81] attend son tour : #80 passe d'abord dans sujet/lot\n";
  const enCours = file("sujet/lot : CI en cours");
  // Lecture initiale, puis cinq sondes : second regard, rien (même état), #80 bloquée, rien, #80 hors de la file.
  const etats = [enCours, enCours, enCours, file("bloquée"), file("bloquée"), file(null)];
  const r = veilleJouet(etats, { sorties: [attend, attend, attend, attend], sondes: 5 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 4, r.stdout);
  for (const etat of ["sujet\\/lot : CI en cours", "bloquée", "hors de la file"])
    assert.match(r.stdout, new RegExp(`file à traiter \\(81 attend #80 \\(${etat}\\)\\), boucle relancée`));
  // La boucle ne dit plus que #81 attend (elle l'a prise, ou #81 a quitté la file) : plus aucune relance.
  assert.equal(veilleJouet(etats, { sorties: [attend, ""], sondes: 5 }).lancements, 2);
  // Témoin : sans la ligne de la boucle, la même file ne relance rien.
  assert.equal(veilleJouet(etats, { sondes: 5 }).lancements, 1);
});
````

## Annexe E — `scripts/depot.test.mjs`

Le titre du test de la ligne 1133 perd « , une sous-PR étiquetée à la fois » :

````js
test("la règle d'ascendance du plugin 7.16.0 : version, note de version en tête, renvoi du README", () => {
````

Sa dernière ligne (l. 1142) est supprimée :

````js
  exiger(`${SKILLS_CHAINE}/fusionner/SKILL.md`, ["une seule sous-PR porte `à-fusionner` à la fois"]);
````

Après ce test, une ligne vide, puis :

````js
// Ticket 57 de gouverner-nos-boucles (A-104) : « une sous-PR à la fois par sujet » est tenue par le capitaine, dans
// l'ordre de sa file ; le conducteur ne retire ni ne repose plus `à-fusionner`. L'ancienne discipline ne revient pas.
test("une sous-PR à la fois par sujet : le capitaine tient l'ordre (plugin 7.32.0), le conducteur ne retire plus l'étiquette", () => {
  const { version } = JSON.parse(readFileSync(join(RACINE, ".claude-plugin/plugin.json"), "utf8"));
  assert.ok(auMoins(version, "7.32.0"), `.claude-plugin/plugin.json : version ${version} ; le capitaine tient l'ordre des sous-PR à partir du plugin 7.32.0`);
  const ADR_SUJET = `${SKILLS_CHAINE}/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md`;
  exiger(`${SKILLS_CHAINE}/fusionner/SKILL.md`, [
    "**Une sous-PR à la fois par sujet.** À chaque tour, la boucle ne prend que la plus ancienne des sous-PR étiquetées de chaque sujet, parmi celles qui sont en route",
    "`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` : ni mise à jour, ni CI, ni renvoi, et elles gardent `à-fusionner` ; personne ne retire ni ne repose une étiquette pour tenir cet ordre.",
    "et passage chez un autre capitaine (7), pour que deux capitaines ne mettent pas à jour deux sous-PR d'un même sujet à la fois.",
    "Une sous-PR qui attend son tour dans son sujet la relance une fois à la sonde suivante, puis chaque fois que celle qui tient le sujet change d'état ou quitte la file.",
  ]);
  exiger(`${SKILLS_CHAINE}/chantier/SKILL.md`, [
    "**Une sous-PR à la fois par sujet : le capitaine tient cet ordre, pas le conducteur.**",
    "Le conducteur étiquette toutes les sous-PR prêtes d'une vague sans attendre que la précédente soit entrée, et il ne retire ni ne repose jamais `à-fusionner` pour régler l'ordre de passage.",
  ]);
  exiger(ADR_SUJET, ["dans un sujet, le capitaine ne prend qu'une sous-PR étiquetée à la fois, la plus ancienne, et les autres attendent leur tour avec leur étiquette."]);
  for (const [fichier, ancien] of [
    [`${SKILLS_CHAINE}/fusionner/SKILL.md`, "une seule sous-PR porte `à-fusionner` à la fois"],
    [`${SKILLS_CHAINE}/fusionner/SKILL.md`, "le conducteur y veille"],
    [`${SKILLS_CHAINE}/chantier/SKILL.md`, "ne le laisse qu'à la plus ancienne"],
    [`${SKILLS_CHAINE}/chantier/SKILL.md`, "retiré par le conducteur"],
    [`${SKILLS_CHAINE}/chantier/SKILL.md`, "puis le repose sur la suivante"],
    [ADR_SUJET, "une seule sous-PR porte `à-fusionner` à la fois"],
  ])
    assert.ok(!plat(readFileSync(join(RACINE, fichier), "utf8")).includes(ancien), `${fichier} : l'ancienne discipline y est encore (« ${ancien} »)`);
});
````
