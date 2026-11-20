# Une sous-PR à la fois par sujet : le capitaine le tient, qui tient le sujet le garde, le conducteur ne retire plus l'étiquette

Status: Fait — PR 141 (`860cd9c`, plugin 7.37.0)
Type: task
Label: contre-revue
Modèle: sonnet — `traiter_sujets` récrite, les retouches de `veille.sh`, les cas des bancs, les textes des skills, le test de dépôt et la note de version sont donnés mot pour mot (Décisions 10 à 12, annexes A à F) et ont été joués sur un clone neuf d'`origin/main` à `988a6c3`, puis sur l'arbre de la PR 138 (ticket 54). Rien à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Si `main` a touché `traiter_sujets`, `veille.sh`, le verrou du passage (`github.sh`) ou les sorties de `sujet.sh` depuis `988a6c3`, la Décision 13 dit quoi faire ; si la PR 138 est entrée (c'est attendu), « Si le ticket 54 est entré avant » ; ce ticket part dans une même PR que le ticket 55, « Dans la même PR que le ticket 55 ».
Blocked by: 54
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/veille.sh`, `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` (nouveau), `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

Ce ticket réalise la décision `A-104` de la carte `docs/issues/gouverner-nos-boucles/map.md` (2026-11-18), précisée par `A-139` et `A-142` (2026-11-19, spec `../relecture-independante.spec.md`).

**Ce que la 7.16.0 a posé**, relu sur `origin/main` à `988a6c3` (plugin 7.31.2). Depuis la règle d'ascendance, le capitaine met à jour et reteste toute sous-PR en retard sur son sujet. Deux sous-PR étiquetées ensemble se remettent donc l'une l'autre en retard, et la CI repasse à chaque fois. La 7.16.0 a confié la parade au conducteur :

- `skills/chaine/fusionner/SKILL.md:40` : « Dans un sujet, une seule sous-PR porte `à-fusionner` à la fois : le conducteur y veille (skill `chantier` § 6) » ;
- `skills/chaine/chantier/SKILL.md:95`, § 6 point 5 : « **Une sous-PR à la fois par sujet.** […] À chaque réveil, quand plusieurs sous-PR d'un même sujet portent `à-fusionner`, le conducteur ne le laisse qu'à la plus ancienne », puis il le repose sur la suivante ;
- `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md:14` (le gabarit d'ADR posé dans un projet) : « dans un sujet, une seule sous-PR porte `à-fusionner` à la fois » ;
- `scripts/depot.test.mjs:1155` exige la première phrase.

**Pourquoi le changer.**

1. Le conducteur ne se réveille que toutes les 45 minutes : après chaque fusion, la sous-PR suivante attend son étiquette jusqu'à 45 minutes, alors qu'elle est prête.
2. C'est une discipline tenue par une session, pas un calcul : un conducteur coupé, relevé ou en retard laisse deux sous-PR étiquetées, et le défaut revient sans que rien le dise.
3. Le chantier « relecture indépendante » (spec `../relecture-independante.spec.md`) pose l'étiquette `à-fusionner` par le Relecteur, sur verdict. Une étiquette retirée d'une PR validée y ferait tourner trois règles en boucle (rapport `../relecture-independante.verif-716.md`, § 2.3).

**La règle nouvelle.** À chaque tour de sa boucle, le capitaine ne prend qu'**une sous-PR étiquetée par sujet**. **Qui tient le sujet le garde, avant tout ordre de numéro** (`A-142`) : une sous-PR en passage chez un autre capitaine, sinon celle que la boucle tenait au tour précédent, sinon une sous-PR dont la CI tourne ; personne ne le tient, **la plus ancienne (le plus petit numéro)** le prend. Les autres attendent : ni mise à jour, ni CI, ni renvoi, et elles gardent leur étiquette. Le conducteur n'a plus rien à retirer ni à reposer. La règle existe pour qu'une mise à jour ne soit pas refaite parce qu'une autre sous-PR est entrée entre-temps.

**Ce que `main` a changé depuis l'écriture du ticket (2026-11-18, `1c4acb1`), et ce que cela fait à la règle.**

- PR 128 (7.26.0) : `file.sh` rend un état de plus, « prête (en conflit) », que la boucle confie à `sujet.sh relancer` comme « prête (sans CI) ». `relancer` lit la règle d'ascendance avant toute fusion : sortie 2 avec les fichiers (conflit hors index, renvoi), sortie 3 dont la dernière ligne nomme le pre-push (renvoi), toute autre sortie 3 muette, sortie 5 quand la sous-PR a bougé, sortie 11 quand le contrôle est illisible.
- PR 131 (7.29.0) : aucune sortie nouvelle (la mention d'une fusion sans effet, et le texte d'une sortie 4).
- PR 133 (7.31.0) : plusieurs capitaines tiennent la même file. `sujet.sh fusionner` et `relancer` posent un verrou par passage (un commentaire marqué) : **la sortie 7 est désormais d'abord « en passage chez un autre capitaine »** (et « plus éligible une fois le verrou pris »). La règle doit donc tenir aussi entre deux capitaines (Décision 4).
- PR 136 (7.31.1, le ticket 56) : la ligne 96 de `chantier/SKILL.md`, voisine de celle de ce ticket ; aucun des scripts ni des bancs de ce ticket.
- PR 135 (7.31.2) : le verrou du passage corrigé. La marque porte l'heure de sa pose ou de son dernier rafraîchissement (`<!-- capitaine:passage <id> <epoch> -->`), `FILTRE_PASSAGE` date une marque par le plus tard de cet epoch et de son `created_at`, et l'horloge du verrou est `epoch_passage` de `github.sh` (`PASSAGE_HORLOGE_BANC` sous le faux GitHub des bancs). Des commentaires illisibles à la relecture du verrou sortent en **5** (une panne), plus en 11 ; un commentaire non posé reste en 11. La sortie 7 d'un verrou dit sa date (`#<n> en passage chez le capitaine <id> depuis <date> : sautée sans renvoi`) : c'est là que la veille lit l'expiration (Décision 7). Et un fait relevé à sa contre-relecture : **rien ne s'écrit après la ligne du `sortir`**, trappe EXIT comprise, parce que la boucle classe `sujet.sh` sur son code et sur sa dernière ligne, et que `refus.sh` prend cette ligne pour motif (Décision 8).
- PR 137 (documentation du programme « capitaine à jour et testé ») : `git diff --stat 19eeb8e 988a6c3` ne rend que des fichiers sous `docs/` ; aucun repère de ce ticket ne bouge.
- La veille (`veille.sh`) ne relance la boucle que sur une ligne « prête » ou « rouge » nouvelle. Une sous-PR qui attend son tour reste « prête », la même ligne de sonde en sonde : sans retouche, elle n'est reprise par personne quand celle qui tient son sujet quitte la file sans y entrer, ni quand le verrou d'un capitaine mort expire (Décision 7 ; les deux reproduits, voir « Ce qui a été joué »).

## Où

- `skills/chaine/fusionner/scripts/boucle.sh`, fonction `traiter_sujets` (l. 326 à 412 à `988a6c3`), appelée une fois par tour de la boucle principale (l. 444), avant la PR suivante vers develop. Elle lit la file (`file.sh` : sous-PR de sujet, livraisons de sujet, `prio:haute`, puis numéro croissant ; `sort -k1,1n -k2,2n`, l. 122) et passe chaque sous-PR « prête » à `sujet.sh fusionner`, chaque sous-PR « prête (sans CI) » ou « prête (en conflit) » à `sujet.sh relancer`. Une sous-PR « CI en cours » ou « CI rouge » ne reçoit aucun geste d'elle.
- `skills/chaine/fusionner/scripts/veille.sh` : l'en-tête (l. 7 et l. 13), `lancer` (l. 164 à 174), `etat_file` (l. 176 à 184), et la relance de la boucle principale (l. 213 à 216).
- Le verrou du passage, lu et non modifié : `skills/chaine/fusionner/scripts/github.sh`, `epoch_passage` (l. 681), `FILTRE_PASSAGE` (l. 714), `prendre_passage` (l. 732) et le texte de la sortie 7 (`PASSAGE_MOTIF`, l. 764) ; `skills/chaine/sujet/scripts/sujet.sh`, `verrouiller` (l. 834 à 855).
- Les bancs : un fichier nouveau, `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` (dépôt jouet et faux GitHub du skill `sujet`), `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` (un banc retouché, deux cas qui demandent son aide `miseAJour`) et `skills/chaine/fusionner/scripts/veille.test.mjs` (doublures de `boucle.sh` et de `file.sh`). Les bancs posés se lisent par dossier (`scripts/poses.test.mjs`, `fusionner poser` : « les tests `scripts/*.test.mjs` suivent ») : le fichier nouveau n'est à déclarer nulle part.
- Les textes : `skills/chaine/fusionner/SKILL.md` (l. 40 et l. 81), `skills/chaine/chantier/SKILL.md` (l. 95), le gabarit d'ADR (l. 14), `skills/chaine/fusionner/references/CONTENU.md` (l. 25, 32, 35 et la fin du fichier).
- `scripts/depot.test.mjs` : le test de la ligne 1146, qui exige l'ancienne phrase (l. 1155).

**Un tour**, dans tout ce ticket : un passage de la boucle principale de `boucle.sh` (`while :`, l. 439), soit `traiter_rouges`, `traiter_sujets`, puis une PR vers develop. Sans PR prête vers develop, la boucle sort sur `FILE VIDE` après un seul tour : le tour suivant est alors celui de la boucle que la veille relance. **En route** : une sous-PR que `file.sh` lit « prête », « prête (sans CI) », « prête (en conflit) » ou « CI en cours ».

## Décisions

Les décisions 1 et 6 sont celles du 2026-11-18. Les décisions 2, 3, 4 et 7, écrites le 2026-11-19 sur le code de `main`, ont été acceptées par l'architecte (`A-139`), puis amendées par `A-142` après le premier tour de relecture adversariale : ce qui vient d'`A-142` est dit à chaque fois. Les choix que ces décisions ne tranchaient pas sont marqués **(choix du rédacteur)**, avec leur raison ; ils sont repris dans « Comments ».

1. **La règle vit dans `traiter_sujets`, pas dans `file.sh`.** `file.sh` reste la lecture de la file, que le conducteur et l'architecte lisent aussi : une sous-PR qui attend son tour continue d'y paraître « prête ».

2. **Qui tient un sujet** (`A-139`, amendée par `A-142`). À chaque tour, une seule sous-PR en route tient son sujet. Au début du tour, pour un sujet qui a plusieurs sous-PR en route, la boucle cherche qui le tient déjà, dans cet ordre :
   1. **une sous-PR qui porte la marque de passage vivante d'un autre capitaine** (Décision 4), lue sur chaque sous-PR en route du sujet, la plus ancienne d'abord ;
   2. sinon **celle que cette boucle tenait à la fin du tour précédent**, si elle est encore en route (Décision 9, la mémoire) ;
   3. sinon **une sous-PR « CI en cours »**, la plus ancienne ;
   4. sinon personne : dans l'ordre de `file.sh`, **la plus ancienne en route (le plus petit numéro)** prend le sujet à son passage.

   Celle qui tient déjà son sujet passe la première ; les autres lignes de la file suivent dans l'ordre de `file.sh`. Les autres sous-PR en route du sujet sont sautées, avec une ligne de journal : `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>`.
   - **« CI en cours » tient, bien que la boucle n'y fasse aucun geste.** Après une sortie 8, la sous-PR se lit « CI en cours » au tour suivant : si elle ne tenait plus le sujet, une autre serait prise pendant sa CI, ce qui est le défaut même (mutations T4, N2 et N29).
   - **La mémoire passe avant « CI en cours »** (choix du rédacteur). La sous-PR que la boucle tenait est celle qu'elle a déjà mise à jour : elle entre dès que sa CI est verte, même si la CI d'une autre tourne entre-temps (un push de sa session). L'ordre inverse la ferait attendre derrière une sous-PR qui devra de toute façon être mise à jour, et lui coûterait une seconde mise à jour (cas « qui tient le sujet le garde », `sujet/lot-2`, mutation N3).
   - **La marque d'un autre capitaine passe avant la mémoire** (choix du rédacteur) : c'est la phrase d'`A-142`, « un capitaine qui voit une sous-PR d'un sujet sous le verrou d'un autre ne prend aucune autre sous-PR de ce sujet à ce tour », y compris celle qu'il tenait lui-même (mutation N7).
   - **Ne tiennent rien** : « CI rouge » (son sort appartient à `traiter_rouges`, relance puis renvoi, et un check rouge qui n'est pas un run d'Actions n'est jamais ni relancé ni renvoyé : il tiendrait le sujet sans limite), « bloquée », « brouillon », « humain », « attend un humain » (elles attendent quelqu'un d'autre que le capitaine), « gelée » (tout le sujet l'est). Coût accepté : une sous-PR rouge relancée avec succès repasse derrière celle qui tient le sujet à ce moment-là, et reçoit une mise à jour.

3. **Ce qui rend le sujet dans le tour, ce qui le tient.** Le sujet est **rendu** quand la sous-PR qui le tient n'est plus en route : la plus ancienne qui attend le prend dans le même tour. Il reste **tenu** tant qu'elle est en route. Sortie par sortie, sur la liste réelle de `main` à `988a6c3` (en-tête de `skills/chaine/sujet/scripts/sujet.sh`, l. 104 à 131, et les branches de `traiter_sujets`). La boucle ne lit de `sujet.sh` que son code de sortie et, pour les sorties 3 de `relancer` et 7, sa dernière ligne.

   `sujet.sh fusionner` (état « prête ») :

   | Sortie | Ce qu'elle dit sur `main` | Ligne de la boucle | Le sujet |
   | ------ | ------------------------- | ------------------ | -------- |
   | 0 | squashée dans le sujet, ou PR de mise à jour entrée par avance rapide | `FUSIONNÉE` | rendu |
   | 3 | checks rouges, conflit avec le sujet hors index, hook, fusion refusée par GitHub | renvoi (`refus.sh`) | rendu |
   | 4 | titre, commitlint, revue, lien symbolique sur un index, base, tête gardée, forme d'une PR de mise à jour | renvoi (`refus.sh`) | rendu |
   | 5 | GitHub illisible (la PR, les checks, les commentaires du verrou à sa relecture), sous-PR ou sujet bougé, checks encore en cours, sujet bougé trois fois pendant la CI | `REPRISE` | tenu |
   | 6 | worktree du capitaine pas propre | `PAS PROPRE` | tenu |
   | 7 | en passage chez un autre capitaine ; ou fermée, en brouillon, sujet gelé, plus éligible une fois le verrou pris | `sous-PR non éligible (…)` | **tenu** (Décision 4) |
   | 8 | mise à jour poussée, CI pas finie | `MISE À JOUR` | tenu |
   | 11 | ascendance illisible, verrou non posé (écriture refusée), push refusé par le distant, échec côté capitaine d'une PR de mise à jour | `ÉCHEC DU CAPITAINE` | tenu |
   | 12 | arbre du squash ≠ arbre testé | `ARRÊT`, la boucle sort | sans objet |
   | 128 et plus | le passage est interrompu par un signal : 143 (TERM) et 130 (INT), les trappes de `verrouiller` ; 137 (KILL) | `ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie <n>)` | **tenu à ce tour** (`A-142`) : l'état du passage interrompu est inconnu (quelque chose a pu être poussé), son verrou peut rester |
   | 2 | non classée : `fusionner` a joué `rafraichir --abandon-si-conflit`, le sujet est en conflit avec develop | `sous-PR non éligible (sortie 2)` | rendu : la PR de mise à jour qui résout ce conflit est plus loin dans la file |
   | autre (1, 64, 69) | erreur inattendue, `CAPITAINE_ID`, `jq` absent | `sous-PR non éligible (sortie <n>)` | rendu |

   `sujet.sh relancer` (états « prête (sans CI) » et « prête (en conflit) ») :

   | Sortie | Ce qu'elle dit sur `main` | Ligne de la boucle | Le sujet |
   | ------ | ------------------------- | ------------------ | -------- |
   | 0 | sujet fusionné dans la branche, poussé, CI lancée | aucune | tenu |
   | 2 | conflit avec le sujet hors index générés, fichiers listés | renvoi (`renvoyer.sh`) | rendu |
   | 3, dernière ligne « mise à jour de #<n> refusée par le hook pre-push » | le pre-push refuse la mise à jour | renvoi (`renvoyer.sh`) | rendu |
   | 3, toute autre | « contient déjà » (à jour, CI non déclenchable), conflit apparu entre le contrôle et la fusion, hook de commit, install ou gate des index | aucune (muette) | **rendu** : rien n'est poussé, aucune CI ne court, et rien ne dit qu'elle passera un jour ; une sous-PR à jour dont la CI n'a jamais été déclenchée sort ainsi à chaque tour, et personne n'en est prévenu |
   | 4 | tête gardée, ne vise pas un sujet | renvoi (`refus.sh`) | rendu |
   | 5 | GitHub illisible (la PR, les commentaires du verrou), sous-PR bougée depuis sa lecture | `REPRISE` | tenu |
   | 6 | worktree du capitaine pas propre | `PAS PROPRE` | tenu |
   | 7 | en passage chez un autre capitaine ; plus éligible une fois le verrou pris | `en passage chez un autre capitaine` | **tenu** (Décision 4) |
   | 11 | verrou non posé, ascendance illisible, push refusé par le distant | `ÉCHEC DU CAPITAINE` | tenu |
   | 128 et plus | le passage est interrompu par un signal | `ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie <n>)` | **tenu à ce tour** (`A-142`) |
   | autre (1, 64, 69) | erreur inattendue, `CAPITAINE_ID`, `jq` absent | aucune | rendu |

   Le renvoi rend le sujet même s'il échoue (GitHub refuse l'écriture) : la sous-PR n'avance pas, et le tour suivant la rejuge. La ligne d'un passage interrompu porte `ÉCHEC DU CAPITAINE`, qui est dans le filtre du `Monitor` du capitaine (choix du rédacteur : le capitaine doit le voir, et le filtre ne change pas).

   **Après une sortie 8 sans CI apparue, le sujet est rendu** (`A-142`, comportement inchangé). `sujet.sh fusionner` sort en 8 dans deux cas (`attendre_ci`, `github.sh` l. 504) : la CI tourne encore après 60 minutes, ou aucun check exigé n'est apparu en 5 minutes sur le sommet poussé. Dans le premier, la sous-PR se lit « CI en cours » au tour suivant et tient. Dans le second, elle se lit « prête (sans CI) » : `relancer` sort en 3 (« contient déjà »), le sujet est rendu, et la suivante est mise à jour. Si la CI de la première arrive ensuite, les deux sont en CI et l'une sera remise à jour : c'est le coût accepté, parce que l'inverse (la sortie 3 muette tient) affamerait tout le sujet derrière une sous-PR dont la CI ne viendra jamais. Joué (cas 9, tour 2 : la sous-PR mise à jour au tour 1, sans CI apparue, rend le sujet, et la suivante est mise à jour).

4. **Une sous-PR en passage chez un autre capitaine tient son sujet** (`A-139`, amendée par `A-142`). Ce capitaine-ci ne prend alors aucune autre sous-PR de ce sujet à ce tour. Il la voit de deux façons.
   - **Avant de prendre quoi que ce soit dans un sujet qui a plusieurs sous-PR en route**, la boucle lit les commentaires de chacune, sans rien écrire, et y cherche la marque vivante d'un autre capitaine (`verrou_d_un_autre`) : `FILTRE_PASSAGE` de `github.sh`, la décision du verrou elle-même, lue comme le ferait un passage qui poserait sa marque à cet instant (`epoch_passage`, l'horloge du verrou). La sous-PR marquée tient le sujet, que sa mise à jour attende sa CI (« CI en cours ») ou que la marque vienne d'être posée (elle se lit encore « prête ») : `[#<n>] marque de passage d'un autre capitaine (<capitaine> <date>) : elle tient sujet/<nom>`. Coût : une lecture GitHub par sous-PR en route d'un sujet qui en a plusieurs, à chaque tour ; aucune pour un sujet à une seule sous-PR en route.
   - **Par la sortie 7 de son propre passage**, quand la boucle passe la sous-PR qui tient le sujet (elle pose alors son commentaire et le retire, comme avant ce ticket).
   - **Une marque expirée ne tient rien** (plus de 90 minutes, règle de `FILTRE_PASSAGE`) : la plus ancienne prend le sujet. **Des commentaires ou une date illisibles : dans le doute, elle tient** (choix du rédacteur) ; son propre passage tranche ensuite, par `prendre_passage` (joué : la marque encore illisible, sortie 5 ; libre, il la prendrait, et tenue, il sortirait en 7). La boucle ne prend donc jamais deux sous-PR d'un sujet dans un tour, et au pire elle en prend une autre que la plus ancienne.
   - **La sortie 7 ne distingue pas le verrou des autres refus sans correction** (fermée, en brouillon, sujet gelé, plus éligible une fois le verrou pris) autrement que par sa dernière ligne. Ces autres cas sont des courses entre la lecture de `file.sh` et le passage : tenir le sujet y coûte au plus un tour, car le tour suivant relit la file, où une PR fermée ne paraît plus et où une PR en brouillon ou gelée ne tient rien. Toute sortie 7 tient donc ; seule la sortie 7 d'un verrou porte sa date dans la ligne du sujet tenu (Décision 8).
   - **Le délai réel quand l'autre capitaine est mort.** Un passage se termine de lui-même (marque de fin). Un passage tué par KILL laisse une marque qui expire 90 minutes après sa dernière date comptée (`github.sh`, `FILTRE_PASSAGE`). Rien ne change alors dans la file : la veille relance la boucle une fois, à la première sonde qui suit cette date de plus de 95 minutes (Décision 7). Le sujet est donc repris **au plus 97 minutes après la dernière date du verrou** (90, 5 de marge d'horloge, une sonde de 2), si l'horloge du poste est à moins de 5 minutes de celle de GitHub ; sinon, ou si la veille n'a pas vu ce verrou, à la veille suivante (elle finit d'elle-même au bout de 75 minutes, réveille la session, qui la relance : chaque veille commence par un tour de boucle).
   - **Ce qui reste possible** : deux capitaines qui lisent les marques d'un sujet dans les mêmes secondes, avant que l'un ait posé la sienne, prennent chacun une sous-PR. La règle d'ascendance garantit qu'aucun code non testé n'entre : seul le travail en double est en jeu (« Ce qui n'a pas été établi »).

5. **Classer une sortie nouvelle.** Une sortie de `sujet.sh fusionner` ou `relancer` ajoutée après ce ticket tient le sujet si elle laisse la sous-PR en route (quelque chose est poussé, une CI court ou va courir, un autre capitaine y travaille, une reprise est annoncée au tour suivant) ou si son état est inconnu (un signal) ; elle le rend si la sous-PR sort de la file, ou si rien n'est poussé et que rien ne dit qu'elle passera. Dans le code, les sorties qui tiennent sont nommées, tout le reste rend.

6. **Les autres gestes de `traiter_sujets` ne tiennent pas le sujet** (regrouper, recibler, `hors-sujet`). **La PR de mise à jour d'un sujet suit la même règle** : elle passe à son rang dans la file. Le cas où elle est le remède (une sous-PR plus ancienne que `fusionner` arrête en sortie 2 parce que le sujet est en conflit avec develop) est couvert par la Décision 3 : la sortie 2 rend le sujet, la PR de mise à jour entre dans le même tour. Ouverte derrière une sous-PR plus ancienne **en route**, elle attend son tour, puis elle est renvoyée dès que cette sous-PR entre (« le premier parent n'est pas le sommet ») : elle est à refaire (joué). Le skill `chantier` la fait ouvrir entre deux vagues, sans sous-PR étiquetée devant elle : la note de version le rappelle.

7. **La veille suit celle qui tient le sujet, et l'expiration du verrou d'un autre capitaine** (`A-139`, amendée par `A-142`).
   - **L'état de celle qui tient.** Une sous-PR qui attend reste « prête » : la veille, qui ne relance la boucle que sur une ligne nouvelle, ne la relancerait pas quand celle qui tient le sujet quitte la file sans y entrer (étiquette retirée, `fusion-bloquée` posé par une contre-revue, fermée, mise en brouillon). `lancer` relève donc dans le journal de la boucle les paires « <n> attend #<m> », et `etat_file` ajoute pour chacune une ligne « <n> attend #<m> (<état de #<m> dans la file>) », ou « (hors de la file) », tant que <n> est dans la file. Cette ligne est nouvelle à la première sonde qui suit la boucle (un second regard, qui couvre aussi un changement survenu entre la lecture de la boucle et la sonde), puis chaque fois que l'état de #<m> change ou que #<m> quitte la file : la veille relance alors la boucle, qui rejuge. Tant que #<m> ne bouge pas, rien n'est relancé.
   - **L'expiration du verrou** (`A-142`). Depuis la PR 135, la date du verrou est dans la marque, et la sortie 7 de `sujet.sh` la dit sur sa dernière ligne. `traiter_sujets` la lit là (`date_du_verrou`, sur le code 7 et la dernière ligne, jamais sur un motif cherché dans toute la sortie) et l'écrit dans la ligne du sujet tenu : `[sujet/<nom>] tenu par #<n> (sortie 7 de fusionner, verrou du <date>)`. `lancer` relève ces dates et garde la plus proche expiration (date + 90 minutes) ; la veille relance la boucle **une fois**, à la première sonde où l'horloge du poste dépasse cette expiration de plus de 5 minutes : `VEILLE <hh:mm> : verrou d'un autre capitaine expiré (sa date a plus de 95 min), boucle relancée`. Si la boucle retrouve le même verrou à la même date, la veille ne relance plus pour lui (une horloge du poste en avance de plus de 5 minutes ne fait pas tourner la boucle en rond) ; une date nouvelle (le capitaine a rafraîchi son verrou) rouvre le compte. Cela vaut aussi pour une sous-PR seule dans son sujet (cas 12, `sujet/seule`). **(choix du rédacteur)** : la date est lue par `traiter_sujets`, dans `boucle.sh` que ce ticket récrit déjà (une fonction de six lignes et deux appels), et non par la veille dans le texte de `sujet.sh` : la veille ne lit que les lignes de la boucle, et la sortie de `sujet.sh` n'est lue que sur son code et sa dernière ligne ; la retouche de `veille.sh` pour l'expiration tient en 17 lignes, commentaires compris. La marge de 5 minutes est celle que `FILTRE_PASSAGE` accorde aux horloges.
   - Écarté : relancer la boucle à chaque sonde tant qu'une sous-PR attend, ou toutes les N sondes, parce qu'une passe reposerait à chaque fois un commentaire de verrou sur une sous-PR tenue par un autre capitaine, et multiplierait les lectures de GitHub pendant toute la CI.

8. **Deux lignes de la boucle sont des contrats avec la veille** ; les bancs les tiennent à la lettre, avec la vraie boucle (annexe F) et dans le source (`veille.test.mjs`, « les lignes que la veille lit… »).
   - `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>`, que `veille.sh` lit par `^\[#([0-9]+)\] attend son tour : #([0-9]+) `.
   - `[sujet/<nom>] tenu par #<n> (<raison>)` : **à chaque tour, la boucle nomme le sujet tenu et la sous-PR qui le tient** (`A-142`), pour tout sujet encore tenu après le passage de celle qui le tient. La raison est `CI en cours` (aucun geste) ou `sortie <code> de fusionner` ou `de relancer`, suivie de `, verrou du <date>` sur la sortie 7 d'un verrou. Un sujet rendu n'a pas de ligne.
   - **Cette ligne ne suit pas la ligne de sortie de `sujet.sh` dans ce que la boucle classe, et n'est jamais prise pour un motif.** Elle est écrite par `boucle.sh` sur sa propre sortie, une fois la sortie de `sujet.sh` classée (son code, sa dernière ligne dans `$sortie`), jamais dans `$sortie`, que `refus.sh` lit et que le `tee` du geste suivant récrit. La ligne `[#<n>] marque de passage d'un autre capitaine…` est écrite avant tout geste du tour. Un cas du banc le tient (« la ligne du sujet tenu… »).
   - Aucune des deux n'entre dans le filtre du `Monitor` du capitaine (`fusionner/SKILL.md`, § « Boucle ») : une attente n'est pas un événement. Les sorties 5, 6, 8 et 11 gardent leurs lignes du filtre (`REPRISE`, `PAS PROPRE`, `MISE À JOUR`, `ÉCHEC DU CAPITAINE`).

9. **`tenus` est une chaîne, la mémoire un fichier, et les clés se comparent entières.**
   - `tenus` : « sujet/<nom>:<numéro> », entre espaces : un nom de branche ne contient ni espace ni deux-points (`git check-ref-format`), et il vient de GitHub ; l'indice d'un tableau associatif passé à `unset` serait évalué par bash.
   - **La mémoire** (choix du rédacteur) : à la fin de la lecture de la file, `tenus` est écrit dans `<git-common-dir>/boucle-tenus`, un « sujet/<nom>:<numéro> » par ligne, à côté de `boucle.verrou` et de `boucle-arret`. C'est elle qui fait garder le sujet à une sous-PR dont la CI vient de finir verte (plus de marque, plus « CI en cours ») devant une plus ancienne entrée entre-temps : sans elle, la plus ancienne reprendrait le sujet et l'autre recevrait une seconde mise à jour (l'histoire jouée par le relecteur, mutation N1). Elle vaut pour un capitaine et un clone ; perdue (machine recyclée), la règle retombe sur la marque, « CI en cours » et le numéro. Une file illisible (`file.sh` en 5) ne l'efface pas (mutation N16) ; une sous-PR qui n'est plus en route n'y reste pas (elle est récrite à chaque tour).
   - **Les clés.** Un nom de sujet peut être le début d'un autre (`sujet/lot`, `sujet/lot-2`), un numéro le début d'un autre (#8, #83) : chaque comparaison porte ses deux bornes (` sujet/<nom>:<numéro> `) ou une égalité de champs (`awk`). Un cas du banc les entrelace (mutations R27, R28, N9, N10, N18).

10. **Les textes, mot pour mot.** Chaque ancien texte est remplacé en entier, bornes comprises ; chaque remplacement dans un `SKILL.md` tient sur la même ligne que l'ancien (aucun `SKILL.md` ne change de nombre de lignes : 124 et 128).

    a. `skills/chaine/fusionner/SKILL.md`, § « La règle d'ascendance », le paragraphe « Dans un sujet, une seule sous-PR porte `à-fusionner` à la fois : […] et la CI repasse à chaque fois. » (l. 40, tout le paragraphe) devient :

    > **Une sous-PR à la fois par sujet.** À chaque tour, la boucle ne prend qu'une sous-PR étiquetée par sujet, parmi celles qui sont en route (« prête », « prête (sans CI) », « prête (en conflit) », « CI en cours ») : deux sous-PR prises ensemble se remettent l'une l'autre en retard, et la CI repasse à chaque fois. Qui tient le sujet le garde, avant tout ordre de numéro : une sous-PR en passage chez un autre capitaine (sa marque de passage, lue sur chaque sous-PR en route du sujet), sinon celle que la boucle tenait au tour précédent, sinon une sous-PR « CI en cours » ; personne ne le tient, la plus ancienne (le plus petit numéro) le prend. Les autres attendent leur tour, `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` : ni mise à jour, ni CI, ni renvoi, et elles gardent `à-fusionner` ; personne ne retire ni ne repose une étiquette pour tenir cet ordre. Le sujet est rendu dans le tour dès que celle qui le tient entre ou n'est plus en route (fusionnée, renvoyée, sortie non classée de `sujet.sh`) : la plus ancienne qui attend est prise aussitôt. Il reste tenu tant qu'elle est en route, et la boucle le dit à chaque tour, `[sujet/<nom>] tenu par #<n> (<raison>)` : mise à jour poussée et CI pas finie (sortie 8, puis « CI en cours » si sa CI est apparue), reprise (5), worktree pas propre (6), échec du capitaine (11), passage interrompu par un signal (128 et plus), passage chez un autre capitaine (7) : un capitaine ne prend aucune autre sous-PR d'un sujet dont il voit une sous-PR en passage chez un autre. Une sous-PR rouge, bloquée, en brouillon, au plafond de renvois, ou sans CI et déjà à jour ne tient rien ; après une mise à jour dont la CI n'apparaît pas, elle est « sans CI et déjà à jour », et le sujet est rendu.

    b. `skills/chaine/fusionner/SKILL.md`, § « Boucle » (l. 81) : la phrase « « CI en cours », « attend », « bloquée » et brouillon ne relancent rien. » devient :

    > Une sous-PR qui attend son tour dans son sujet la relance une fois à la sonde suivante, puis chaque fois que celle qui tient le sujet change d'état ou quitte la file ; un sujet tenu par le verrou d'un autre capitaine la relance une fois quand ce verrou a expiré (sa date a plus de 95 minutes). « CI en cours », « attend », « bloquée » et brouillon ne relancent rien d'eux-mêmes.

    c. `skills/chaine/chantier/SKILL.md`, § 6 point 5 (l. 95) : le passage qui va de « **Une sous-PR à la fois par sujet.** Le capitaine met à jour et reteste toute sous-PR en retard sur son sujet » à « puis le repose sur la suivante dès que la précédente est entrée. » (la fin du point 5) devient :

    > **Une sous-PR à la fois par sujet : le capitaine tient cet ordre, pas le conducteur.** Le capitaine met à jour et reteste toute sous-PR en retard sur son sujet, même pour de la documentation (skill `fusionner`, « La règle d'ascendance ») : deux sous-PR prises ensemble se remettraient l'une l'autre en retard. À chaque tour, il ne prend donc qu'une sous-PR étiquetée par sujet : celle qui tient déjà le sujet (sa mise à jour attend sa CI, ou un capitaine est dessus), sinon la plus ancienne (le plus petit numéro, pas la première étiquetée) ; les autres attendent leur tour avec leur étiquette, et `file.sh` les montre « prête » sans qu'elles bougent : ce n'est pas une file arrêtée. Le conducteur étiquette toutes les sous-PR prêtes d'une vague sans attendre que la précédente soit entrée, et il ne retire ni ne repose jamais `à-fusionner` pour régler l'ordre de passage.

    d. Le gabarit `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md` (l. 14) : « ; dans un sujet, une seule sous-PR porte `à-fusionner` à la fois. » devient :

    > ; dans un sujet, le capitaine ne prend qu'une sous-PR étiquetée à la fois, celle qui tient déjà le sujet, sinon la plus ancienne (le plus petit numéro), et les autres attendent leur tour avec leur étiquette.

    e. `skills/chaine/fusionner/references/CONTENU.md`, quatre retouches. Section « `scripts/boucle.sh` » (l. 25), après « Sa CI qui ne finit pas sur le sommet poussé sort en 8 (`MISE À JOUR`, reprise au tour suivant). », insérer, précédé d'une espace :

    > Une sous-PR à la fois par sujet (décisions A-104 et A-142) : à chaque tour, une seule sous-PR en route (« prête », « prête (sans CI) », « prête (en conflit) », « CI en cours ») tient son sujet, et les autres attendent leur tour (`attend son tour`), sans mise à jour, ni CI, ni renvoi. Qui le tient le garde, avant tout ordre de numéro : une sous-PR qui porte la marque de passage vivante d'un autre capitaine (`verrou_d_un_autre` : `FILTRE_PASSAGE` lu sans rien écrire, à l'heure de `epoch_passage`), sinon celle que la boucle tenait au tour précédent (`<git-common-dir>/boucle-tenus`), sinon une sous-PR « CI en cours », sinon la plus ancienne (le plus petit numéro). Il est rendu dans le tour quand elle entre ou n'est plus en route, et reste tenu sur les sorties 5, 6, 7, 8, 11 et 128 et plus (un signal) de `sujet.sh fusionner` (0, 5, 6, 7, 11 et 128 et plus de `relancer`) ; la boucle le dit à chaque tour, `[sujet/<nom>] tenu par #<n> (<raison>)`, une fois la sortie de `sujet.sh` classée, jamais dans cette sortie, et avec la date du verrou sur une sortie 7 (lue sur la dernière ligne de `sujet.sh`).

    Paragraphe « Plusieurs capitaines » (l. 32) : « est sautée sans renvoi. » devient :

    > est sautée sans renvoi, et tient son sujet : la boucle ne prend aucune autre sous-PR de ce sujet à ce tour.

    Section « `scripts/veille.sh` » (l. 35) : « ou qu'une PR renvoyée ou relancée par la boucle revient dans la file ; elle s'arrête » devient :

    > ou qu'une PR renvoyée ou relancée par la boucle revient dans la file, ou qu'une sous-PR attend son tour dans son sujet (un second regard à la sonde suivante, puis à chaque changement d'état de celle qui tient le sujet, sortie de la file comprise), ou que le verrou d'un autre capitaine qui tenait un sujet a expiré (une fois, quand sa date a plus de 95 minutes) ; elle s'arrête

    Section « Les tests », à la fin du fichier, après une ligne vide, un paragraphe de plus :

    > `une-sous-pr-a-la-fois.test.mjs`, `sujet-fusionner.test.mjs` et `veille.test.mjs`, ticket 57 du chantier `gouverner-nos-boucles` (décisions A-104 et A-142) : une seule sous-PR en route prise par sujet et par tour, une mise à jour par sous-PR ; ce qui rend le sujet (fusion, renvoi, sortie non classée, états qui ne sont pas en route) et ce qui le tient (les sorties 5, 6, 7, 8 et 11, `relancer` réussi, un signal), geste par geste ; qui tient le sujet le garde devant une sous-PR de numéro plus petit entrée après elle ; deux capitaines (marque de passage lue, illisible ou expirée, « CI en cours ») ; des noms de sujet et des numéros dont l'un commence l'autre ; la ligne du sujet tenu, hors de ce que la boucle classe ; la PR de mise à jour derrière une sous-PR plus ancienne ; la veille qui suit celle qui tient le sujet, et qui relance la boucle à l'expiration du verrou d'un capitaine mort, avec les doublures comme avec la vraie boucle.

11. **Le test de `scripts/depot.test.mjs`** (`A-139`). Le test de la ligne 1146 perd sa dernière ligne (l'appel `exiger` qui porte l'ancienne phrase, l. 1155) et la fin de son titre (« , une sous-PR étiquetée à la fois »). Un test nouveau le suit (annexe E) : il exige les phrases nouvelles des deux skills, du gabarit d'ADR et de la note par `exiger`, et refuse sept morceaux de l'ancienne discipline par `assert.ok(!plat(…).includes(…))` (il n'existe pas d'aide pour refuser un texte). **Il ne porte aucun numéro de version**, ni dans son titre, ni dans ses assertions : la version et la note en tête sont déjà tenues ensemble par le test « la règle d'ascendance du plugin 7.16.0… » (la première note commence par la version de `plugin.json`).

12. **Version et note** (`A-139`). **La version est la suivante de `main` au moment de livrer**, mineure (un comportement du capitaine change) : aucun numéro n'est écrit dans ce ticket, parce que d'autres PR ouvertes du plugin prendront les numéros suivants avant lui. Elle s'écrit à deux endroits, ensemble : `.claude-plugin/plugin.json` et le titre de la note. La note, en tête de `NOTES-DE-VERSION.md`, `<version>` remplacé par ce numéro et `<AAAA-MM-JJ>` par le jour de la livraison, mot pour mot :

    ```markdown
    ## <version> — <AAAA-MM-JJ>

    ### Ce qui change

    « Une sous-PR à la fois par sujet » est tenue par le capitaine, plus par le conducteur. À chaque tour de sa boucle, le capitaine ne prend qu'une sous-PR étiquetée par sujet ; les autres attendent leur tour avec leur étiquette (`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` dans le journal), sans mise à jour, ni CI, ni renvoi. Qui tient le sujet le garde, avant tout ordre de numéro : une sous-PR en passage chez un autre capitaine, sinon celle que la boucle tenait au tour précédent, sinon une sous-PR dont la CI tourne ; personne ne le tient, la plus ancienne (le plus petit numéro) le prend. La suivante est prise dans le tour où celle qui tient entre ou sort de la file ; tant que le sujet reste tenu, la boucle le dit à chaque tour (`[sujet/<nom>] tenu par #<n> (<raison>)`). La veille relance la boucle quand la sous-PR qui tient un sujet change d'état ou quitte la file, et une fois quand le verrou d'un autre capitaine qui tenait un sujet a expiré. Le conducteur étiquette toutes les sous-PR prêtes d'une vague : il ne retire ni ne repose plus `à-fusionner` (skill `chantier` § 6), ce qui coûtait jusqu'à 45 minutes d'attente par sous-PR. Une PR de mise à jour d'un sujet s'ouvre, comme avant, sans sous-PR étiquetée devant elle : derrière une sous-PR plus ancienne en route, elle attend son tour, puis elle est à refaire.

    ### Ce qu'un projet fait pour en profiter

    1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
    2. Reposer les scripts du capitaine, dans une PR du projet : `/maj-skills:fusionner poser`.
    3. Relancer chaque capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). La boucle se remplace d'elle-même par la version de develop ; la veille tourne sur sa copie, c'est elle qu'il faut recopier.
    4. D'ici là, le conducteur garde l'ancienne discipline, une seule sous-PR étiquetée à la fois par sujet : un capitaine dont les scripts ne sont pas reposés prend encore toutes les sous-PR étiquetées d'un sujet dans le même tour. Avec plusieurs capitaines, il ne l'abandonne qu'une fois tous relancés.
    ```

    `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont disputés par toute PR ouverte du plugin : partir de `main`, et **reprendre `main` avant de livrer** (version et note recalées sur ce que `main` porte alors).

13. **Si `main` a bougé depuis `988a6c3`.** Avant de coller quoi que ce soit : `git diff 988a6c3 origin/main -- skills/chaine/fusionner/scripts/boucle.sh skills/chaine/fusionner/scripts/veille.sh skills/chaine/fusionner/scripts/github.sh skills/chaine/sujet/scripts/sujet.sh skills/chaine/fusionner/scripts/file.sh`.
    - Vide pour `boucle.sh` et `veille.sh` : les annexes A et B se collent telles quelles, et les empreintes de l'étape 3 font foi.
    - `boucle.sh` a changé hors de `traiter_sujets` (l. 326 à 412), ou `veille.sh` hors des cinq endroits de l'annexe B : coller quand même, les empreintes ne valent plus, le banc fait foi.
    - `traiter_sujets`, `lancer`, `etat_file` ou la relance de la boucle principale de la veille ont changé : ne pas coller l'annexe. Reporter à la main, sur le code de `main`, les retouches de l'annexe A (elles sont énumérées en tête de l'annexe) ou les cinq de l'annexe B, sans toucher au reste.
    - `github.sh` a changé `FILTRE_PASSAGE`, ses trois arguments (`moi`, `mien`, `cree`), `epoch_passage` ou le texte de la sortie 7 (`PASSAGE_MOTIF` : « en passage chez le capitaine <id> depuis <date> : ») : `verrou_d_un_autre` et `date_du_verrou` en dépendent. **S'arrêter et l'écrire au lanceur**, avec le diff.
    - `sujet.sh fusionner` ou `relancer` a une sortie nouvelle, ou `file.sh` un état nouveau d'une sous-PR : la classer par les Décisions 2 et 5. Si elle ne s'y classe pas d'évidence, **s'arrêter et l'écrire au lanceur**, avec la sortie et son texte.
    - La PR 138 (ticket 54) entrée : ce qu'elle change à ces cinq fichiers est connu et n'arrête rien (« Si le ticket 54 est entré avant »).

14. **Toute tenue a une fin écrite** (`A-142`). Un sujet tenu n'attend jamais sans issue ; la boucle dit qui le tient à chaque tour (Décision 8), et chaque veille commence par un tour.

    | Ce qui tient le sujet | Ce qui y met fin |
    | --------------------- | ---------------- |
    | sortie 8, puis « CI en cours » | la CI finit : verte, la sous-PR entre ; rouge, elle ne tient plus (« CI rouge »). La veille relance la boucle à ce changement d'état |
    | sortie 8 sans CI apparue, `relancer` réussi sans CI apparue | au tour suivant, `relancer` sort en 3 (« contient déjà ») : le sujet est rendu |
    | « CI en cours » qui ne finit pas (runner absent, check exigé jamais posté) | **le capitaine** : il retire `à-fusionner` de celle qui tient (joué, cas 12), ou la passe en brouillon ; la veille relance alors la boucle et la suivante est prise (« Ce qui n'a pas été établi ») |
    | sortie 5 (reprise) | le tour suivant la rejuge : au prochain changement de la file, ou à la veille suivante |
    | sortie 6 (worktree pas propre), sortie 11 (échec du capitaine), signal | le capitaine, prévenu par le `Monitor` (`PAS PROPRE`, `ÉCHEC DU CAPITAINE`), corrige ; le tour suivant la reprend la première (la mémoire) |
    | sortie 7, verrou vivant d'un autre capitaine | l'autre capitaine finit son passage : la sous-PR entre ou change d'état, et la veille relance la boucle |
    | sortie 7, verrou d'un capitaine mort | le verrou expire : la veille relance la boucle une fois, au plus 97 minutes après sa dernière date (Décision 4) |
    | sortie 7 sans verrou (course) | le tour suivant : la file relue ne la montre plus en route |
    | marque illisible | son propre passage tranche dans le tour (Décision 4) |

## Si le ticket 54 est entré avant

**C'est le cas attendu** : `A-149` fait partir ce ticket, avec le 55, après l'entrée de la PR 138 (ticket 54, lot 1, branche `claude/ticket-54-codeowners-sort-du-plugin`, un commit, `e6bd5c0`, posé sur `988a6c3`). Le second à livrer reprend `main` par un commit de fusion (`A-138`). Joué le 2026-11-19 sur cette branche telle qu'elle était ce jour-là, de deux façons (« Ce qui a été joué ») : ce ticket appliqué par ses seules bornes sur l'arbre de la PR 138, et la fusion à trois voies, fichier par fichier, de l'arbre de ce ticket joué sur `988a6c3` avec celui de la PR 138 (`git merge-file`, ce que fait `git merge`).

- **Toutes les bornes de ce ticket sont uniques sur l'arbre de la PR 138** : aucune annexe ni aucune citation à retoucher.
- **Deux conflits, dont un seul de texte : `skills/chaine/chantier/SKILL.md`, l. 95.** Les deux tickets récrivent la même ligne en phrases disjointes. Le 54 en retire deux phrases, au milieu : « Sauf une PR qui touche un chemin possédé (`.github/CODEOWNERS`) : […] la vague peut s'y arrêter. » et « Le conducteur le dit au produit (par l'architecte dans un programme) : il n'approuve rien lui-même. ». Ce ticket en récrit la fin, de « **Une sous-PR à la fois par sujet.** » à la fin du point 5 (Décision 10 c). À la résolution, garder **de `main` (le 54)** le début de la ligne, jusqu'à « puis pose le label lui-même. » compris, donc sans les deux phrases retirées ; garder **de ce ticket** tout ce qui suit, le texte de la Décision 10 c. C'est la ligne qu'on obtient en appliquant la Décision 10 c sur l'arbre de la PR 138. Contrôle : la ligne ne porte plus ni « chemin possédé », ni « puis le repose sur la suivante » ; le fichier garde 128 lignes ; le test de l'annexe E est vert. L'autre conflit est `NOTES-DE-VERSION.md` : deux notes en tête ; celle de ce ticket va au-dessus de celle du 54.
- **`.claude-plugin/plugin.json` se fusionne sans conflit, et c'est le piège.** Si la branche de ce ticket a pris la même version suivante que le 54, git garde ce numéro sans rien dire, partagé par deux notes. Après la fusion, la version de ce ticket est la suivante de celle que `main` porte avec le 54 (Décision 12), mineure : la relever et la recaler dans `plugin.json` et dans le titre de la note.
- **Le reste se fusionne seul**, et donne, à l'octet, l'arbre obtenu par les bornes (les huit autres fichiers retouchés ; le banc nouveau n'est que d'un côté). Dans `boucle.sh`, le 54 récrit deux commentaires de l'en-tête (deux lignes de moins) et un de la boucle principale, hors de `traiter_sujets` : elle est l. 324 à 410, la boucle principale l. 437 (`while :`), l'appel l. 442. Dans `veille.test.mjs`, il retire le test « PR qui attend un propriétaire… », qui suit le banc « les lignes que la veille lit… » que ce ticket retouche. Dans `scripts/depot.test.mjs`, le test de l'ancienne phrase est l. 1136, la ligne retirée l. 1145. Dans `fusionner/SKILL.md`, `CONTENU.md` et le gabarit d'ADR, les lignes des deux tickets sont disjointes ; aucune ligne ajoutée par ce ticket ne nomme CODEOWNERS, un propriétaire ni un humain (le test du 54 « CODEOWNERS n'est plus nommé que là où le plugin dit qu'il est retiré » reste vert).
- **Les empreintes de l'étape 3** : `boucle.sh` rend `c608d88c18e305d3045b87224cca8255f0f689b0` et `veille.test.mjs` `55675e934ac2a9ad92401eeb768b78e53ef840c5` ; `veille.sh`, `une-sous-pr-a-la-fois.test.mjs` et `sujet-fusionner.test.mjs` gardent les leurs.
- **Le contrôle de la Décision 13 n'est pas vide, et c'est attendu** : `boucle.sh` hors de `traiter_sujets` (deuxième cas : coller, les empreintes ci-dessus font foi) ; `github.sh`, 75 lignes de moins avant le verrou (les fonctions de la revue des propriétaires et de la marque d'attente), le verrou intact : `epoch_passage` l. 606, `FILTRE_PASSAGE` l. 639, `prendre_passage` l. 657, `PASSAGE_MOTIF` l. 689, leurs textes inchangés ; `file.sh` perd deux états, « attend un propriétaire » et « attend un humain », sans en gagner. `sujet.sh` et `veille.sh` ne bougent pas. Rien de cela n'arrête la session. La Décision 2 cite « attend un humain » parmi les états qui ne tiennent rien : sans effet, le code ne nomme que les quatre états en route.
- **Joué sur cet arbre** : le ticket par ses bornes, puis `pnpm test` : 1 094 tests, 1 094 verts (650 s, charge de 1 à 10), dont ceux du 54 et le test de l'annexe E. **Ce que la session fait** : partir d'`origin/main` où le 54 est entré, appliquer ce ticket par ses bornes (étapes 1 à 7 telles quelles, la ligne 95 de `chantier/SKILL.md` étant alors la ligne obtenue ci-dessus, sans conflit), contrôler les empreintes de la liste précédente, prendre la version suivante de celle du 54 ; si elle est partie d'avant le 54, fusionner `origin/main` dans sa branche, résoudre les deux conflits comme ci-dessus, relever `plugin.json`, et rejouer les étapes 4 à 7.

Si le 54 n'est pas entré, rien de cette section ne s'applique : c'est lui qui reprendra `main`.

## Dans la même PR que le ticket 55

`A-149` met les tickets 55 et 57 dans une PR : une version, une note. La note de ce ticket (Décision 12) y entre telle quelle, à côté de ce que le 55 écrit ; le test de l'annexe E exige deux de ses phrases n'importe où dans `NOTES-DE-VERSION.md`, et aucun numéro. Selon le ticket 55 (non joué ici), il touche aussi `skills/chaine/chantier/SKILL.md`, à d'autres lignes (l. 3, 43, 110 et 113 à 115, deux lignes de moins), et `scripts/depot.test.mjs` (l. 194 et la fin du fichier) : la « Vérification » 4 et la Décision 10 (`1 1`, 128 lignes) se lisent sur le diff de ce ticket seul, avant les retouches du 55. Les bancs et la suite se rejouent sur la PR entière.

## À faire, dans l'ordre

1. Partir d'`origin/main` à jour. Relever sa version (`.claude-plugin/plugin.json`) et jouer le contrôle de la Décision 13 ; si le ticket 54 est entré (c'est attendu), lire « Si le ticket 54 est entré avant » ; dans la PR commune avec le ticket 55, « Dans la même PR que le ticket 55 ».
2. **Banc d'abord.** Créer `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` (annexe F). Dans `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` : les deux retouches du banc existant « deux sous-PR en conflit d'index » et, en fin de fichier, les deux cas nouveaux (annexe C). Dans `skills/chaine/fusionner/scripts/veille.test.mjs` : les deux cas nouveaux et la retouche du banc des lignes (annexe D). Dans `scripts/depot.test.mjs` : les retouches de l'annexe E. Les jouer et **les voir rouges** : `node --test skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs` rend douze tests, dix rouges et deux verts (les cas 2 et 3 gardent ce que le code d'aujourd'hui fait déjà : ils rougissent sous les mutations T9, T11, R20 à R22, R25 et R33) ; `node --test --test-name-pattern="la seconde lue dans le même tour|^boucle.sh : une sous-PR arrêtée|^boucle.sh : une PR de mise à jour ouverte" skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` rend deux rouges et un vert (le cas 14 garde lui aussi ce que le code fait déjà : il rougit sous la mutation T8) ; `node --test --test-name-pattern="^sous-PR qui attend son tour|^sujet tenu par le verrou|^les lignes que la veille lit" skills/chaine/fusionner/scripts/veille.test.mjs` rend trois rouges (`1 !== 4`, `1 !== 2`, et le banc des lignes) ; le test nouveau de `scripts/depot.test.mjs` est rouge.
3. **Le code.** `boucle.sh` : remplacer, du commentaire « # Sous-PR et reciblages : rapides, faits avant chaque passage vers develop. » à l'accolade fermante de `traiter_sujets`, par l'annexe A, mot pour mot. `veille.sh` : les cinq retouches de l'annexe B. Contrôle, si la Décision 13 a rendu un diff vide : `git hash-object` rend `a87d0456a0b6f3c747a99b3e26627c9585afb7a3` pour `boucle.sh` et `1bc3dd1d58bf007a61ec6a31a4db1b9de5116db4` pour `veille.sh` ; pour les bancs, si `main` ne les a pas touchés non plus, `418917f5de5f037104d24ab9938b1efb9283e3e1` (`une-sous-pr-a-la-fois.test.mjs`), `16919936c2cb728b28858b0889a82517f3d91949` (`sujet-fusionner.test.mjs`) et `76a756589efaa1aa1f43782129660d26f20e6f45` (`veille.test.mjs`).
4. Rejouer les bancs de l'étape 2 : verts, sauf celui de `scripts/depot.test.mjs`.
5. **Les textes** (Décision 10, a à e), puis la version et la note (Décision 12). `node --test scripts/depot.test.mjs` : vert.
6. Les mutations de « Vérification », une à la fois, chacune retirée avant la suivante.
7. La suite entière : `pnpm install --frozen-lockfile`, puis `pnpm test`, verte. Relever la durée du test « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (plafond de 600 s, `scripts/poses.test.mjs`) : il rejoue les bancs posés, fichier par fichier en parallèle, dont le fichier nouveau. **Si ce test est le seul rouge et qu'il l'est par son plafond, sur une machine chargée, le rejouer seul** (`node --test scripts/poses.test.mjs`) : c'est un défaut connu de ce test sous charge, vu deux fois dans la suite avec ce ticket, vert rejoué seul (« Comments »), et la PR de petits correctifs d'`A-149` porte son plafond. S'il dépasse encore son plafond seul et au calme, le dire au lanceur avec la durée, sans retirer de cas.
8. Reprendre `main`, recaler version et note, rejouer l'étape 7 si `main` a bougé, puis livrer : une PR vers `main`, selon la procédure du dépôt. Un cas rouge ne se corrige pas en changeant ce qu'il attend : il se dit au lanceur, avec sa sortie.

## Les cas du banc

Dans `une-sous-pr-a-la-fois.test.mjs` (annexe F). L'aide `sousPrDeSujets` monte un dépôt jouet : chaque sous-PR part de son sujet, verte sur son sommet de départ ; un sujet « en retard » avance ensuite ; une sous-PR « en conflit » voit son sujet écrire son propre fichier. Le sommet qu'une mise à jour du capitaine pousse n'a aucun check : `sujet.sh fusionner` sort en 8. `tenu(sujet, n, raison)` est la ligne `[sujet/<sujet>] tenu par #<n> (<raison>)`, exigée entière.

| n° | Cas | Ce qu'il tient |
| -- | --- | -------------- |
| 1 | **Une sous-PR à la fois par sujet** : trois sous-PR en retard dans `sujet/lot` (#80, #81, #82), une à jour dans `sujet/autre` (#83). Tour 1 : #80 mise à jour (sortie 8), #81 et #82 ni mises à jour ni fusionnées, #83 entre. Tour 2, la CI de #80 en cours : rien ne bouge. Tour 3, CI verte : #80 entre et #81 est prise dans le même tour (mise à jour), #82 attend #81. Tour 4 : #81 entre, #82 est mise à jour. | la règle, la sortie 8 et l'état « CI en cours » qui tiennent, la sortie 0 qui rend, la clé par sujet ; trois mises à jour en tout, une par sous-PR (une fusion du capitaine par branche) ; la ligne du sujet tenu à chaque tour, aucune pour un sujet rendu ; aucune étiquette ni commentaire écrits |
| 2 | **Ce qui ne tient pas** : cinq sujets à deux sous-PR, la plus ancienne renvoyée (titre trop long, sortie 4), rouge, bloquée, en brouillon, ou sans CI et déjà à jour (`relancer`, sortie 3 muette). La seconde de chaque sujet entre dans le tour. | le renvoi qui rend, les états qui ne tiennent rien, la sortie 3 muette de `relancer` |
| 3 | **Un renvoi rend le sujet** : conflit hors index vu par `fusionner` (sortie 3) et par `relancer` (sortie 2, « prête (en conflit) »), tête gardée vue par `relancer` (sortie 4). La suivante de chaque sujet est prise dans le tour. | les sorties 3 de `fusionner`, 2 et 4 de `relancer` qui rendent |
| 4 | **Le verrou, par la sortie 7.** Tour 1 : #78 perd son étiquette pendant la pose du verrou (sortie 7 sans verrou d'un autre capitaine) : elle tient son sujet un tour, #79 attend, la ligne du sujet tenu ne porte aucune date. Tour 2 : #79 entre ; #80 porte la marque de passage d'un autre capitaine, sous un outil (`git fetch`) qui écrit avant la ligne de sortie une ligne de la même forme : #81 attend, rien n'est écrit sur elle, pas même un verrou ; la ligne du sujet tenu porte la date du verrou, celle de la dernière ligne. Tour 3 : la marque terminée, #80 entre et #81 dans le même tour. | la sortie 7 de `fusionner` qui tient ; la date lue sur la dernière ligne seule ; aucune date sans verrou ; une sortie 7 sans verrou qui ne coûte qu'un tour |
| 5 | **Reprise et échec** : #80 illisible à sa lecture (sortie 5 de `fusionner`), le commentaire de verrou refusé (sortie 11, de `fusionner` et de `relancer`). Les suivantes attendent. | les sorties 5 et 11 de `fusionner`, 11 de `relancer` qui tiennent |
| 6 | **`relancer` qui tient** : une sous-PR sans CI et en retard (sortie 0), une en passage chez un autre capitaine (7, avec la date), une bougée depuis sa lecture (5). Les suivantes attendent, aucune n'est poussée. | les sorties 0, 7 et 5 de `relancer` qui tiennent ; « prête (sans CI) » en route |
| 7 | **Worktree pas propre** : sortie 6 de `fusionner` et de `relancer`. Les suivantes attendent. | les sorties 6 qui tiennent |
| 8 | **Un signal** : le faux `pnpm` envoie TERM au passage pendant l'install d'une mise à jour (sortie 143 de `fusionner` et de `relancer`). Les suivantes attendent, rien n'est renvoyé ni poussé. | une sortie par signal qui tient, la ligne `ÉCHEC DU CAPITAINE : passage interrompu…` |
| 9 | **La ligne du sujet tenu et la ligne de sortie.** Tour 1 : #80 tient son sujet (sortie 8), et sa ligne suit aussitôt celle de la boucle ; dans le même tour, #82 est renvoyée et #84 sort en 3 muette. Le commentaire de renvoi de #82 a pour motif la dernière ligne de `sujet.sh fusionner 82`, mot pour mot, sans la ligne du sujet tenu ; #84 reste classée sur sa dernière ligne. Tour 2, rien n'a changé sur GitHub : la CI de la mise à jour de #80 n'est pas apparue, `relancer` sort en 3, le sujet est rendu, #81 est mise à jour. | la ligne du sujet tenu hors de ce que la boucle classe et de ce que `refus.sh` prend pour motif ; après une sortie 8 sans CI apparue, le sujet rendu (Décision 3) |
| 10 | **Qui tient le sujet le garde** (l'histoire jouée par le relecteur, sur deux sujets dont un nom commence l'autre, `lot` et `lot-2`, et deux numéros dont l'un commence l'autre, #8 et #83). Tour 1 : #81 et #83 mises à jour, #80 et #8 pas encore étiquetées. Tour 2 : la CI tourne, #80 et #8 étiquetées : elles attendent, bien que plus anciennes. Tour 3, après une lecture illisible de la file (`PAUSE`) : #83, verte, entre d'abord, et #8 est prise dans le même tour ; #81 entre d'abord alors que la CI de #80 tourne, et #80 tient ensuite. Tour 4 : #8 entre, #80 est mise à jour. | la mémoire, avant le numéro et avant « CI en cours » ; celle qui tient passe la première ; la plus ancienne prise dans le tour où le sujet est rendu ; une mise à jour par sous-PR (une fusion du capitaine par branche) ; les clés entières ; les lignes d'attente et du sujet tenu qui nomment la bonne sous-PR ; la mémoire gardée sur une file illisible |
| 11 | **Deux capitaines** (l'autre histoire du relecteur, et ses voisines). Tour 1 : `adv`, #81 marquée et « CI en cours », #80 plus ancienne attend ; `verrou`, #83 marquée, encore « prête » : la marque est lue, #82 attend, le passage de #83 sort en 7 ; `doute`, marque à la date illisible : #85 tient, son passage sort en 5 ; `expire`, marque d'un capitaine mort, expirée : elle ne tient rien, #86 est mise à jour ; `ci`, #89 « CI en cours » sans marque : #88, à jour et verte, n'entre pas. Rien n'est écrit sur celles qui attendent. Tour 2 : le passage de l'autre capitaine sur #83 terminé, #83 entre d'abord et #82 est prise dans le tour ; une marque posée sur #87 la fait tenir devant #86, que la boucle tenait. | la marque d'un autre capitaine lue avant de prendre ; son âge ; le doute qui tient ; « CI en cours » sans mémoire ; la marque avant la mémoire |
| 12 | **La veille réelle et la vraie boucle** (les deux essais du relecteur sur la veille, retournés). #80 porte la marque d'un capitaine mort, datée de plus de 95 minutes à l'horloge du poste, et #81 attend ; #84, seule dans son sujet, porte la même marque ; la CI de #82 tourne et ne finit pas, #83 attend. La veille relance la boucle au second regard ; puis, les marques expirées pour GitHub sans que la file change, une fois pour le verrou expiré : #80, #81 et #84 entrent ; puis, le capitaine ayant retiré `à-fusionner` de #82, une fois encore : #83 entre. Trois relances en cinq sondes. | la relance à l'expiration, de bout en bout, y compris pour une sous-PR seule dans son sujet ; les deux lignes que la veille lit, écrites par la vraie boucle ; une CI qui ne finit pas, dite à chaque tour, et le geste du capitaine qui rend le sujet |

Dans `sujet-fusionner.test.mjs` (annexe C), parce qu'ils demandent l'aide `miseAJour` de ce fichier :

| n° | Cas | Ce qu'il tient |
| -- | --- | -------------- |
| 13 | (retouche du banc existant « deux sous-PR en conflit d'index ») #80 mise à jour par `relancer` ; #81 est lue dans le tour, et attend. | `relancer` réussi qui tient sur « prête (en conflit) » ; l'entrée de la boucle qu'un outil ne mange pas (ce que ce banc gardait déjà) |
| 14 | **La sortie 2** : le sujet est en conflit avec develop, #80 (partie de develop) sort en 2 ; la PR de mise à jour #81, plus récente, entre dans le même tour. | une sortie non classée qui rend ; aucun blocage entre une sous-PR et la PR de mise à jour qui la débloque |
| 15 | **La PR de mise à jour derrière une sous-PR plus ancienne en route** : elle attend son tour (#80 « CI en cours »), puis, #80 entrée, elle est renvoyée (« le premier parent n'est pas le sommet »). | ce que la Décision 6 annonce ; la ligne du sujet tenu sur « CI en cours » |

Dans `veille.test.mjs` (annexe D), deux cas et une retouche :

| n° | Cas | Ce qu'il tient |
| -- | --- | -------------- |
| 16 | #81 attend #80. La boucle est relancée à la première sonde (second regard), pas à la suivante (même état), puis quand #80 passe « bloquée », pas à la suivante, puis quand #80 quitte la file : quatre lancements. Elle ne l'est plus dès que la boucle ne dit plus que #81 attend (deux lancements), jamais sans cette ligne (un lancement), ni quand #81 a quitté la file et que #80 change ensuite d'état (deux lancements). | la veille qui suit l'état de celle qui tient ; plus rien quand celle qui attendait est partie |
| 17 | Un sujet tenu par le verrou d'un autre capitaine : une relance quand sa date a plus de 95 minutes (96), aucune à 92 ni à 10 minutes, ni pour une sortie 7 sans date ; une seule pour la même date ; une de plus pour une date nouvelle ; la première expiration de deux verrous ; un passage de `relancer` comme de `fusionner`. | l'expiration lue dans la ligne de la boucle, la marge, la relance unique |
| 18 | (retouche du banc « les lignes que la veille lit… ») le source de `boucle.sh` écrit les deux lignes que la veille lit, à la lettre. | le contrat de la Décision 8 |

## Surfaces

| Surface | Preuve |
| ------- | ------ |
| `traiter_sujets` : une sous-PR en route par sujet et par tour, qui tient le sujet le garde | cas 1 à 15 |
| `traiter_sujets` : la ligne du sujet tenu, hors de ce que la boucle classe | cas 1, 4, 9, 10 |
| `veille.sh` : la boucle relancée quand celle qui tient un sujet change d'état ou quitte la file, et à l'expiration du verrou d'un autre capitaine | cas 12, 16, 17, 18 |
| `fusionner/SKILL.md`, `chantier/SKILL.md`, le gabarit d'ADR, la note de version | le test nouveau de `scripts/depot.test.mjs` |
| `fusionner/references/CONTENU.md` | relecture (aucun test ne le lit) |

## Vérification

1. La suite entière du dépôt, verte (étape 7).
2. **Les mutations**, chacune appliquée seule, le cas nommé rejoué, puis retirée. « T » : les quatorze du ticket au premier tour ; « R » : les vingt du relecteur ; « N » : celles de la fonction récrite. Toutes ont été jouées à l'écriture, toutes rouges sur le cas nommé (« Ce qui a été joué »). `FUS` et `REL` : les listes des sorties qui tiennent, `5 | 6 | 7 | 8 | 11 | <signaux>` et `0 | 5 | 6 | 7 | 11 | <signaux>`.

   | n° | Mutation | Où | Cas qui rougit |
   | -- | -------- | -- | -------------- |
   | T1 | **la règle retirée** : `*" $tient:"*)` ne correspond jamais | `boucle.sh` | 1, tour 1 : trois mises à jour poussées au lieu d'une |
   | T2 | **le sujet tenu après une fusion** : `0` ajouté à `FUS` | `boucle.sh` | 1, tour 3 |
   | T3 | **le sujet rendu après une sortie 8** : `8` retiré de `FUS` | `boucle.sh` | 1, tour 1 |
   | T4 | « CI en cours » retiré du motif des états en route | `boucle.sh` | 1, tour 2 |
   | T5 | le verrou rend : `7` retiré de `FUS` | `boucle.sh` | 4 |
   | T6 | une reprise rend : `5` retiré de `FUS` | `boucle.sh` | 5 |
   | T7 | un échec du capitaine rend : `11` retiré de `FUS` | `boucle.sh` | 5 |
   | T8 | une sortie non classée tient : `2` ajouté à `FUS` | `boucle.sh` | 14 |
   | T9 | un renvoi tient : `4` ajouté à `FUS` | `boucle.sh` | 2 |
   | T10 | `relancer` réussi rend : `0` retiré de `REL` | `boucle.sh` | 6 |
   | T11 | la sortie 3 de `relancer` tient : `3` ajouté à `REL` | `boucle.sh` | 2 |
   | T12 | une clé commune à tous les sujets : `tient=sujet/tous` | `boucle.sh` | 1, tour 1 |
   | T13 | la veille ne suit plus rien : `if (0) print` dans `etat_file` | `veille.sh` | 16 |
   | T14 | la veille ne lit plus l'état de celle qui tient (une constante à sa place) | `veille.sh` | 16 |
   | R15 | `5` retiré de `REL` | `boucle.sh` | 6 |
   | R16 | `6` retiré de `REL` | `boucle.sh` | 7 |
   | R17 | `7` retiré de `REL` | `boucle.sh` | 6 |
   | R18 | `11` retiré de `REL` | `boucle.sh` | 5 |
   | R19 | `6` retiré de `FUS` | `boucle.sh` | 7 |
   | R20 | `2` ajouté à `REL` | `boucle.sh` | 3 |
   | R21 | `4` ajouté à `REL` | `boucle.sh` | 3 |
   | R22 | `3` ajouté à `FUS` | `boucle.sh` | 3 |
   | R23 | « prête (en conflit) » retiré du motif des états en route | `boucle.sh` | 13 |
   | R24 | « prête (sans CI) » retiré du motif des états en route | `boucle.sh` | 6 |
   | R25 | « CI rouge » ajouté au motif | `boucle.sh` | 2 |
   | R26 | `continue` retiré : l'attente est dite, la sous-PR est traitée quand même | `boucle.sh` | 1 |
   | R27 | `par=${tenus##*:}` : la ligne d'attente nomme la dernière sous-PR qui tient un sujet, quel qu'il soit | `boucle.sh` | 10 |
   | R28 | `*"$tient"*)` : clé sans ses bornes | `boucle.sh` | 10 |
   | R29 | `file.sh` : tri par numéro décroissant | `file.sh` | 1 |
   | R30 | veille : `if (1) print` (ligne écrite même quand celle qui attend a quitté la file) | `veille.sh` | 16 |
   | R31 | veille : les attentes s'accumulent d'une boucle à l'autre | `veille.sh` | 16 |
   | R32 | veille : l'état lu est celui de la sous-PR qui attend | `veille.sh` | 16 |
   | R33 | `relancer` : le sujet n'est jamais rendu | `boucle.sh` | 2 |
   | R34 | `break` à la place de `continue` | `boucle.sh` | 1 |
   | N1 | la mémoire ignorée | `boucle.sh` | 10, tour 3 : la plus ancienne reprend le sujet |
   | N2 | « CI en cours » ne tient plus au début du tour | `boucle.sh` | 11 |
   | N3 | « CI en cours » avant la mémoire | `boucle.sh` | 10, tour 3 |
   | N4 | la marque d'un autre capitaine n'est plus lue | `boucle.sh` | 11 |
   | N5 | marque illisible : personne | `boucle.sh` | 11 |
   | N6 | la marque lue sans âge : une marque expirée tient | `boucle.sh` | 11 |
   | N7 | la mémoire avant la marque d'un autre capitaine | `boucle.sh` | 11, tour 2 |
   | N8 | celle qui tient ne passe plus la première | `boucle.sh` | 10, tour 3 |
   | N9 | l'ordre de passage : clé sans son espace de fin (#8 pris pour #83) | `boucle.sh` | 10 |
   | N10 | l'attente : clé sans son espace de fin (#8 pris pour #83) | `boucle.sh` | 10 |
   | N11 | **la ligne du sujet tenu nomme une autre sous-PR** | `boucle.sh` | 10 |
   | N12 | la ligne du sujet tenu nomme un autre sujet | `boucle.sh` | 10 |
   | N13 | la ligne du sujet tenu n'est plus écrite | `boucle.sh` | 15 |
   | N14 | un signal rend le sujet : les signaux retirés de `FUS` | `boucle.sh` | 8 |
   | N15 | un signal rend le sujet : les signaux retirés de `REL` | `boucle.sh` | 8 |
   | N16 | la mémoire écrite sur une file illisible | `boucle.sh` | 10, tour 3 |
   | N17 | la mémoire jamais écrite | `boucle.sh` | 10 |
   | N18 | la mémoire lue par le début du nom du sujet | `boucle.sh` | 10 |
   | N19 | la date du verrou lue sur la première ligne de la sortie | `boucle.sh` | 4 |
   | N20 | la date du verrou n'est plus dite | `boucle.sh` | 12 |
   | N22 | une sortie 7 sans verrou porte une date | `boucle.sh` | 4 |
   | N23 | veille : la marge de 5 minutes retirée | `veille.sh` | 17 |
   | N24 | veille : relance répétée pour le même verrou | `veille.sh` | 17 |
   | N25 | veille : la dernière expiration au lieu de la première | `veille.sh` | 17 |
   | N26 | veille : le verrou expire dès sa date | `veille.sh` | 17 |
   | N27 | veille : le verrou d'un passage de `relancer` n'est pas lu | `veille.sh` | 17 |
   | N28 | veille : l'expiration du verrou n'est plus lue | `veille.sh` | 12 |
   | N29 | « CI en cours » retiré de la liste des sous-PR en route du début du tour | `boucle.sh` | 11 |
   | N30 | « prête (sans CI) » retiré de cette liste | `boucle.sh` | 11, tour 2 |
   | N31 | la ligne d'attente change de texte dans `boucle.sh` | `boucle.sh` | 18 |

   **Deux mutations qui ne peuvent pas rougir**, et pourquoi. (a) La ligne du sujet tenu écrite aussi dans `$sortie` (`| tee -a "$sortie"`) : elle est la dernière instruction du passage d'une sous-PR, et le `tee` du geste suivant récrit `$sortie` avant toute lecture ; la propriété tient par la construction, et le cas 9 garde ce qui s'en observe. (b) La marque lue aussi sur un sujet à une seule sous-PR en route (`++k[$1] == 2` devenu `== 1`) : elle ne coûte que des lectures, qui ne se voient pas dans le journal du faux GitHub (il ne garde que les écritures).

3. Dans les cas 1 et 10, compter les mises à jour poussées : une par sous-PR. Le banc le compte deux fois : par les lignes « mise à jour poussée » de chaque tour, et par le nombre de fusions sur chaque branche (`git rev-list --merges --count`, 1).
4. `git diff origin/main --numstat -- skills/chaine/chantier/SKILL.md skills/chaine/fusionner/SKILL.md` : `1 1` puis `2 2` (trois lignes changées en tout).

## Ce qui a été joué

Sur un clone neuf de `MAJ-agency/skills`, `origin/main` à `988a6c3` (plugin 7.31.2), un arbre de travail par étape (`pnpm install --frozen-lockfile` dans ceux de la suite), le 2026-11-19 : node 22.23.5, git 2.43.0, bash 5.2.21, jq 1.7, mawk 1.3.4. La machine, à quatre cœurs, était partagée avec d'autres suites (charge de 1 à 9) : les durées se lisent avec la charge. La retouche a été écrite et jouée sur `a018502` puis sur `19eeb8e` (PR 135) ; `main` ayant pris la PR 137 (documentation seule), tout ce qui suit a été rejoué sur `988a6c3`, et sur l'arbre de la PR 138 (ticket 54) tel qu'il était ce jour-là.

1. **Le ticket appliqué par ses seules bornes.** Un outil qui ne lit que ce fichier (les blocs des annexes A à F, les citations de la Décision 10, la note de la Décision 12) l'applique sur un arbre neuf de `988a6c3` : chaque borne s'y trouve une fois. L'arbre obtenu est, à l'octet, celui où le code a été écrit et joué (les douze fichiers comparés un à un), et donne les cinq empreintes de l'étape 3. `git diff --numstat` : `107 4` pour `boucle.sh`, `38 4` pour `veille.sh`, `1 1` pour `chantier/SKILL.md`, `2 2` pour `fusionner/SKILL.md` (124 et 128 lignes, comme avant) ; douze fichiers, dont un nouveau.
2. **Les bancs seuls, avant le code** (étape 2, sur un arbre qui ne porte que les annexes C à F). `une-sous-pr-a-la-fois.test.mjs` : douze tests, dix rouges, deux verts (les cas 2 et 3). Cas 1 : une mise à jour poussée pour chacune des trois sous-PR de `sujet/lot` au tour 1, le défaut même ; cas 8 : `[#80] sous-PR non éligible (sortie 143)`, et #81 prise ; cas 12 : la veille ne relance rien. Les trois cas de `sujet-fusionner.test.mjs` : deux rouges, un vert (le cas 14). Les trois de `veille.test.mjs` : rouges (`4` attendu, `1` lu ; `2` attendu, `1` lu ; et le banc des lignes). Le test nouveau de `scripts/depot.test.mjs` : rouge, les 58 autres verts.
3. **Les mêmes bancs sur le code** (étape 4) : douze verts sur douze (288 s), trois sur trois, trois sur trois, et `node --test scripts/depot.test.mjs` 59 sur 59, charge de 1 à 2.
4. **Les soixante-quatre mutations** de « Vérification » (quatorze « T », vingt « R », trente « N ») : toutes rouges, chacune sur le cas nommé (1 199 s de bancs, charge de 1 à 7). Jouées sur un second arbre du même sommet portant le même diff, les trois scripts remis d'origine après chacune ; la sortie de chacune, gardée, montre une assertion en échec, aucun test annulé. Les vingt du relecteur y sont reportées sur la fonction récrite, avec la même intention : sa borne telle quelle là où elle existe encore (R23 à R32, R34) ; dans R15 à R22 et R33, les listes des sorties qui tiennent portent désormais les codes des signaux, qui restent dans la mutation. Les deux histoires du relecteur s'y revoient : sans la mémoire (N1), le cas 10 rougit sur son défaut, `[#8] … mise à jour poussée` puis `[#83] attend son tour : #8 passe d'abord dans sujet/lot` ; sans la lecture de la marque (N4), le cas 11 rougit, et son journal montre `[#82] FUSIONNÉE dans sujet/verrou` pendant le passage de l'autre capitaine sur #83. L'arbre des mutations, comparé à la fin à celui de l'étape 1 : identique.
5. **La suite entière, une fois**, sur l'arbre de l'étape 1 (le code, les bancs, les textes, la version suivante de 7.31.2 et la note) : `pnpm test` rend 1 119 tests, 1 119 verts, en 610 s, charge de 1 à 7 ; « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (`scripts/poses.test.mjs`) a pris 444 s, sous son plafond de 600 s.
6. **La PR 138 (ticket 54) entrée d'abord**, sur sa branche telle qu'elle était le 2026-11-19 (`e6bd5c0`) : ce ticket appliqué par ses seules bornes sur l'arbre de la PR 138 (chaque borne une fois, le même `git diff --numstat` que sur `988a6c3`) ; la fusion à trois voies de l'arbre de l'étape 1 avec celui de la PR 138 (`git merge-file`, fichier par fichier) : deux conflits, `chantier/SKILL.md` l. 95 et `NOTES-DE-VERSION.md`, `plugin.json` fusionné sans conflit sur le même numéro, et les huit autres fichiers retouchés identiques, à l'octet, à ceux de l'arbre des bornes ; sur cet arbre, `pnpm test` : 1 094 tests, 1 094 verts, en 650 s, charge de 1 à 10, le test de `scripts/poses.test.mjs` en 498 s.
7. **Écarté après essai.** Une relance de la boucle toutes les quinze sondes tant qu'une sous-PR attend (la retouche (b) du constat 4 du relecteur) a été codée et jouée, puis remplacée par la relance à l'expiration, lue dans la date du verrou. Une règle (la mémoire, puis « CI en cours », puis la marque lue sans son âge sur les seules suivantes) a été jouée et remplacée par celle de la Décision 2 : elle laissait une marque expirée désigner une sous-PR, et la mémoire passer devant la marque d'un autre capitaine.
8. **Non joué** : la suite sur `main` intact ; la PR commune avec le ticket 55 ; ce que « Ce qui n'a pas été établi » énumère.

## Ce qui n'a pas été établi

- **Rien n'a tourné contre un GitHub réel.** Le faux GitHub du banc ne rejoue pas : l'état que rend `file.sh` juste après une relance des jobs rouges (« CI rouge » encore, ou déjà « CI en cours ») ; les notifications que reçoit une PR quand un second capitaine y pose puis retire son commentaire de verrou ; deux capitaines réels en même temps, que le banc imite par une marque posée dans l'état, jamais par deux boucles.
- **La fenêtre entre la lecture des marques et la pose de la sienne.** Deux capitaines qui lisent les marques d'un sujet avant que l'un ait posé la sienne prennent chacun une sous-PR de ce sujet : travail en double, jamais du code non testé. Non joué (il faudrait deux boucles en même temps). De même, la mémoire vaut pour un capitaine : après une sortie 8 d'un capitaine A dont la CI finit verte (plus de marque, plus « CI en cours »), un capitaine B qui passe avant A prend la plus ancienne. Lu, non joué.
- **Une « CI en cours » qui ne finit pas tient tout le sujet.** La boucle ne fait aucun geste sur une sous-PR « CI en cours » et ne lit aucune sortie : si sa CI ne conclut pas (runner absent, run en file d'attente, check exigé jamais posté sur ce sommet : `ci_jq` de `file.sh` rend « en cours » dès qu'un check exigé sur plusieurs manque ; lu, non joué), les autres sous-PR du sujet attendent, et avec `A-142` aussi une plus ancienne entrée après elle. **Ce que voit le capitaine** : à chaque tour, `[sujet/<nom>] tenu par #<n> (CI en cours)`, les lignes `[#<m>] attend son tour : #<n> passe d'abord…`, et `FILE VIDE <hh:mm> (CI en cours : #<n>)` ; aucune n'est dans le filtre du `Monitor`, et la veille ne relance rien tant que l'état ne change pas : il les lit dans son journal quand `VEILLE FINIE` le réveille (75 minutes au plus), puis à chaque veille. **Son geste** : retirer `à-fusionner` de celle qui tient ; la veille relance alors la boucle et la suivante est prise (joué avec la veille réelle et la vraie boucle, cas 12). La passer en brouillon, ou y poser `fusion-bloquée`, change de même son état dans la file (la moitié « veille » est tenue par le cas 16, sur « bloquée »).
- **Une sortie 11, 6 ou 5 qui dure tient son sujet sans limite** (un push que le distant refuse à chaque tour sur la branche d'une sous-PR, par exemple). C'est la décision du 2026-11-18. La boucle le dit à chaque passe (`ÉCHEC DU CAPITAINE`, `PAS PROPRE`, `REPRISE`, dans le filtre du `Monitor`), mais la veille ne relance rien tant que rien ne change dans la file : c'est déjà vrai aujourd'hui pour la sous-PR elle-même, cela le devient pour celles qui attendent derrière elle, et, avec la mémoire, pour une plus ancienne entrée après elle.
- **L'horloge du poste.** La relance à l'expiration compare la date du verrou à l'horloge du poste, avec 5 minutes de marge. Sur un poste en avance de plus de 5 minutes, la relance unique tombe trop tôt et le sujet attend la veille suivante ; en retard, elle tombe d'autant plus tard. Non joué.
- **La durée au calme.** La machine de l'essai était partagée (quatre cœurs). `scripts/poses.test.mjs`, qui rejoue tous les bancs posés sous un plafond de 600 s, a pris 357 s seul sur `main` intact (`19eeb8e`, machine chargée), et, dans la suite avec ce ticket, de 444 s à plus de 600 s selon la charge (« Comments »). Les cas de la boucle sont dans un fichier à eux pour ne pas allonger `sujet-fusionner.test.mjs` : ce que ce fichier ajoute au test posé sur une machine au calme n'est pas mesuré ; l'étape 7 le relève.
- **Le coût des lectures et des passes de plus.** Une lecture des commentaires par sous-PR en route d'un sujet qui en a plusieurs, à chaque tour ; une passe au second regard, à chaque changement d'état de celle qui tient un sujet, et une à l'expiration d'un verrou. Le nombre d'appels à GitHub d'une passe à vide n'a pas été compté.
- **La composition avec la relecture indépendante** (lots 4 à 6 du chantier 3), qui suppose ce ticket entré : non rejouée.
- **bash 3.2, awk de BSD, macOS** : seuls bash 5.2 et mawk 1.3.4 ont tourné.
- **La PR 138 telle qu'elle entrera, et la PR commune avec le ticket 55.** La branche de la PR 138 a été jouée telle qu'elle était le 2026-11-19 (`e6bd5c0`) ; une retouche de sa relecture qui touche `boucle.sh`, `veille.test.mjs` ou la l. 95 de `chantier/SKILL.md` se rejoue par l'étape 1. Le ticket 55 n'a été ni appliqué ni joué avec celui-ci.

## Hors périmètre

- `sujet.sh`, `passer.sh`, `file.sh`, `github.sh` : rien à y changer. `file.sh` continue de montrer « prête » une sous-PR qui attend son tour. `boucle.sh` lit `FILTRE_PASSAGE` et `epoch_passage` de `github.sh` sans les modifier.
- Les PR vers `develop` : la file y est déjà traitée une PR à la fois.
- Le protocole des étiquettes de la relecture indépendante : spec du chantier 3, lots 4 à 6.
- Une sous-PR restée « prête » après une sortie 5, 6 ou 11 n'est reprise qu'au prochain changement de la file ou à la veille suivante : défaut d'avant ce ticket, à déposer à part s'il gêne. **La sortie 7 n'en est plus** : le verrou d'un capitaine mort fait relancer la boucle à son expiration (Décision 7), y compris pour une sous-PR seule dans son sujet. Une sortie 7 d'un verrou vivant attend, comme avant, que l'autre capitaine ait fini.
- La ligne de la boucle pour une sortie 7 de `fusionner`, qui ne dit pas si c'est un verrou : inchangée ; la ligne du sujet tenu le dit par sa date.
- Le filtre du `Monitor` du capitaine : inchangé.
- L'ADR « branches de sujet » déjà posée dans un projet : elle reste telle quelle, le projet la révise s'il le veut.

## Comments

- 2026-11-18 — Architecte : écrit au niveau de la décision, sans repère de ligne, parce que `boucle.sh` bouge sous les tickets de l'autre programme. **`needs-info` jusqu'à leur entrée** ; il passe alors `ready-for-agent` après une relecture par un agent neuf sur `main`.
- 2026-11-19 — Remis à jour sur `origin/main` à `a3c2a7c` (plugin 7.31.0, les tickets de l'autre programme entrés jusqu'à la PR 133) et passé `ready-for-agent`. Ce que cette remise à jour change : (1) la Décision 3 est récrite sur les sorties réelles de `sujet.sh fusionner` et `relancer`, une table par geste ; (2) **la sortie 7 tient désormais le sujet**, parce qu'elle est d'abord, depuis la PR 133, le verrou d'un autre capitaine (Décision 4) : le texte d'origine la rangeait parmi celles qui rendent ; (3) **l'état « CI en cours » tient le sujet** bien que la boucle n'y fasse aucun geste, sans quoi la règle tombait au tour qui suit une sortie 8 (Décision 2) ; (4) la sortie 3 muette de `relancer` rend le sujet (Décision 3) ; (5) **`veille.sh` entre dans le ticket** : sans retouche, une sous-PR qui attend n'était reprise par personne quand celle qui tenait son sujet quittait la file sans y entrer, reproduit puis corrigé (Décision 7) ; le texte d'origine disait « aucun autre script n'est touché » ; (6) le gabarit d'ADR « branches de sujet » et `fusionner/references/CONTENU.md` portaient aussi l'ancienne discipline (Décision 10) ; (7) le code, les bancs, les textes, le test de dépôt et la note sont donnés mot pour mot et joués, d'où `Modèle: sonnet` ; (8) `Blocked by: 56`. **À trancher par l'architecte**, parce qu'aucune décision écrite ne les portait : les Décisions 2 (« CI en cours » tient, « CI rouge » non), 3 (la sortie 3 muette de `relancer` rend), 4 (toute sortie 7 tient) et 7 (la veille suit l'état de celle qui tient le sujet, plutôt qu'une relance à chaque sonde). [Tranché le même jour : `A-139`.]
- 2026-11-19 — **Retouché après le premier tour de relecture adversariale (« prêt après retouches », 2 bloquants, 9 mineurs ; décisions `A-139`, `A-142`, `A-149`, `P-65`) et recalé sur `origin/main` à `988a6c3` (plugin 7.31.2).** C'est la dernière écriture du ticket avant le code (`P-65` : un tour de relecture sur le ticket, déjà fait ; deux sur la PR). Écrite et jouée sur `a018502`, puis sur `19eeb8e` (PR 135) ; tout a été rejoué sur `988a6c3` (PR 137, documentation seule, aucun fichier de ce ticket) et sur l'arbre de la PR 138 (« Ce qui a été joué »).
  - **Ce que la PR 135 a déplacé.** Le verrou porte sa date (`<!-- capitaine:passage <id> <epoch> -->`, `FILTRE_PASSAGE`, `epoch_passage`) : la marque d'un autre capitaine se lit à l'horloge du verrou, et la veille lit l'expiration dans la date que la sortie 7 donne (Décisions 4 et 7). Des commentaires du verrou illisibles sortent en 5, plus en 11 (les deux tables de la Décision 3). Rien ne s'écrit après la ligne du `sortir` : la ligne du sujet tenu est écrite par la boucle après le classement, hors de `$sortie` (Décision 8, cas 9). Repères relus : `sujet.sh` (l. 104 à 131, `verrouiller` l. 834 à 855) ; les autres fichiers de ce ticket n'ont pas bougé.
  - **Les onze constats, dans leur ordre.**
    1. (B) Qui tient le sujet le garde : `traiter_sujets` récrite (annexe A ; Décisions 2 et 4 : marque vivante d'un autre capitaine, mémoire de la boucle, « CI en cours », puis le plus petit numéro) ; les trois textes faux récrits ; ses deux histoires sont les cas 10 et 11.
    2. (B) Aucun numéro de version en dur : retiré de l'annexe E (titre, `plugin.json`, `auMoins`), des Décisions 11 et 12 (deux endroits au lieu de quatre) et du titre de la note (`<version>`).
    3. Sortie 8 sans CI apparue : le sujet est rendu, écrit dans la Décision 3 et dans `fusionner/SKILL.md` (« si sa CI est apparue »), tenu par le cas 9 ; comportement inchangé.
    4. Verrou d'un capitaine mort : la veille relance la boucle une fois à son expiration, lue dans la ligne du sujet tenu (Décision 7, annexe B, cas 12 et 17) ; la Décision 4 dit le délai réel (97 minutes au plus).
    5. « CI en cours » qui ne finit pas : dans « Ce qui n'a pas été établi » et la Décision 14, avec ce que voit le capitaine (la ligne du sujet tenu, Décision 8) et son geste (joué, cas 12).
    6. PR de mise à jour derrière une sous-PR plus ancienne : « non rejoué » remplacé par ce qui a été joué (Décision 6, cas 15) ; rappel dans la note.
    7. Sortie par signal : elle tient le sujet à ce tour (`A-142`), dans les deux tables, le code (128 et plus, ligne `ÉCHEC DU CAPITAINE : passage interrompu…`) et le cas 8.
    8. Trous du banc : les douze mutations vertes du relecteur sont rouges (R15 à R22, R24, R27, R28, R30) ; ses cinq cas sont repris (cas 3, 6, 7, 10, 16).
    9. Recalage : sur `988a6c3`, repères relus, `Blocked by: 54` (`A-149`), « Si le ticket 54 est entré avant » récrit sur la PR 138 réelle.
    10. Les quatre textes : « la plus ancienne (le plus petit numéro) », « ne relancent rien d'eux-mêmes » (et « d'elle-même » dans `veille.sh`), « si sa CI est apparue », `poussees` lit `sujet\/\S+`.
    11. Plafond de `scripts/poses.test.mjs` : aucune retouche au code ; l'étape 7 dit de le rejouer seul quand il est le seul rouge sous charge.
  - **Les choix du rédacteur, avec leur raison** (ce que les décisions ne tranchaient pas ; côté sûr : tenir le sujet plutôt que mettre deux sous-PR à jour).
    1. **Une mémoire** (`<git-common-dir>/boucle-tenus`) : sans elle, à la fin verte de la CI de celle qui tient, la plus ancienne reprend le sujet et l'histoire du relecteur se rejoue (mutation N1).
    2. **La marque d'un autre capitaine lue avant de prendre**, et avant la mémoire : la sortie 7 seule ne voit le verrou que sur la sous-PR passée, trop tard (mutations N4, N7).
    3. **Marque illisible : elle tient**, son propre passage tranche : jamais deux sous-PR d'un sujet dans un tour.
    4. **La mémoire avant « CI en cours »** : celle que la boucle a déjà mise à jour entre d'abord (mutation N3).
    5. **L'expiration lue dans la ligne de la boucle** (`date_du_verrou`, sur le code 7 et la dernière ligne), pas dans la sortie de `sujet.sh` : la veille ne lit que les lignes de la boucle. Cela touche `boucle.sh`, dans la fonction que l'annexe A récrit, et aucun autre script.
    6. **Une relance par date, 5 minutes de marge** : une horloge en avance ne fait pas tourner la boucle en rond.
    7. **Un fichier de banc nouveau** : `scripts/poses.test.mjs` rejoue les fichiers en parallèle, le plus long borne.
    8. **`ÉCHEC DU CAPITAINE` pour un passage interrompu, la ligne du sujet tenu hors du filtre du `Monitor`** : le filtre ne change pas.
    9. **`Blocked by: 54`** : `A-149` fait partir ce ticket après l'entrée de la PR 138 ; « Si le ticket 54 est entré avant » devient le cas attendu, avec les empreintes qui valent alors, et une section dit ce que la PR commune avec le ticket 55 change aux contrôles.
    10. **Le plafond de `scripts/poses.test.mjs` n'est plus dit « vu sur `main` intact »** : seul sur `19eeb8e` il a pris 357 s ; il n'a été vu rouge que dans la suite avec ce ticket.
  - **Ce qui n'a pas pu être porté** : rien des onze constats. Deux mutations ne peuvent pas rougir (« Vérification » dit pourquoi). Restent non établis : deux boucles réelles en même temps, un GitHub réel, une horloge du poste décalée, la durée au calme, la PR commune avec le ticket 55.
  - **Les comptes vus** : sur `988a6c3`, étape 2 : 10 rouges et 2 verts, 2 rouges et 1 vert, 3 rouges, le test nouveau de `scripts/depot.test.mjs` rouge (58 autres verts) ; étape 4 : 12, 3, 3 et 59 verts ; mutations : 64 sur 64 rouges ; suite : 1 119 tests verts sur 1 119, 610 s, `scripts/poses.test.mjs` à 444 s. Sur l'arbre de la PR 138 : bornes toutes uniques, deux conflits de fusion, 1 094 tests verts sur 1 094, 650 s. Dans les tours précédents, le test de `scripts/poses.test.mjs` a été vu rouge à son plafond deux fois dans la suite avec ce ticket (sur `a018502` et sur `19eeb8e`, machine chargée), vert rejoué seul (509 s, 591 s) ; seul sur `19eeb8e` intact, 357 s.

## Annexe A — `traiter_sujets`, dans `skills/chaine/fusionner/scripts/boucle.sh`

Remplace, sur `main` à `988a6c3`, les lignes 326 à 412 (324 à 410 si la PR 138 est entrée) : du commentaire « # Sous-PR et reciblages : rapides, faits avant chaque passage vers develop. » à l'accolade fermante de la fonction `traiter_sujets`. Les retouches par rapport à `main`, tout le reste de la fonction étant repris tel quel : (1) le commentaire de tête, `TENUS`, et les deux fonctions `verrou_d_un_autre` et `date_du_verrou`, avant `traiter_sujets` ; (2) les variables locales ; (3) la file lue une fois dans `liste`, la liste `enroute`, et la boucle qui cherche qui tient déjà chaque sujet ; (4) la boucle des gestes lit `liste` remise en ordre par `awk`, et écrit `TENUS` quand `read` arrive au bout ; (5) le bloc `tient='' geste=''` … `esac` qui fait attendre, avant le `case "$etat"` des gestes ; (6) dans les branches de `relancer` et de `fusionner` : `geste`, la date du verrou sur une sortie 7, la ligne d'un passage interrompu par un signal, et, après le `esac` des lignes (le `esac ;;` d'origine devient `esac`), le `case "$rc"` qui rend le sujet ; (7) après le `esac </dev/null` des gestes, la ligne du sujet tenu.

````bash
# Sous-PR et reciblages : rapides, faits avant chaque passage vers develop.
# Une sous-PR à la fois par sujet (décisions A-104 et A-142). Une sous-PR est « en route » quand file.sh la lit
# « prête », « prête (sans CI) », « prête (en conflit) » ou « CI en cours ». À chaque tour, une seule tient son sujet ;
# les autres sous-PR en route du même sujet attendent leur tour, sans mise à jour, ni CI, ni renvoi, et gardent leur
# étiquette (`[#n] attend son tour : #m passe d'abord dans sujet/<nom>`, que la veille lit).
# Qui tient le sujet le garde, avant tout ordre de numéro. Au début du tour, pour un sujet qui a plusieurs sous-PR en
# route, dans cet ordre : (1) une sous-PR qui porte la marque de passage vivante d'un autre capitaine
# (`verrou_d_un_autre`, lue sur chacune, la plus ancienne d'abord) : ce capitaine-ci ne prend alors aucune autre sous-PR
# du sujet à ce tour ; (2) sinon celle que cette boucle tenait à la fin du tour précédent, si elle est encore en route
# (`TENUS`, gardé d'un tour et d'une boucle à l'autre) ; (3) sinon une sous-PR « CI en cours », la plus ancienne ;
# (4) sinon personne : la plus ancienne en route (le plus petit numéro) prend le sujet. Celle qui tient déjà son sujet
# passe la première ; les autres lignes suivent dans l'ordre de file.sh.
# Le sujet est rendu dans le tour quand celle qui le tient n'est plus en route vers l'entrée (fusionnée, renvoyée, ou
# refusée par une sortie non classée) : la plus ancienne qui attend le prend aussitôt. Il reste tenu sur une sortie qui
# la laisse en route : 5, 6, 8, 11, `relancer` réussi, 7 (le verrou d'un autre capitaine) et toute sortie par signal
# (128 et plus : l'état du passage interrompu est inconnu, son verrou peut rester). Un sujet encore tenu après le
# passage de celle qui le tient est dit à chaque tour : `[sujet/<nom>] tenu par #n (<raison>)`, écrit par la boucle une
# fois la sortie de `sujet.sh` classée (son code, et sa dernière ligne dans `$sortie`), jamais dans `$sortie` : la ligne
# ne suit pas celle du `sortir`, et `refus.sh` ne la prend pas pour un motif. Sur une sortie 7, la raison porte la date
# du verrou de l'autre capitaine (`, verrou du <date>`), que la veille lit pour relancer la boucle à son expiration.
# `tenus` : « sujet/<nom>:<numéro> », entre espaces (un nom de branche ne contient ni espace ni deux-points) ; jamais
# un tableau associatif, dont l'indice, un nom de branche, serait évalué. `TENUS` : les mêmes, un par ligne.
TENUS="$COMMUN/boucle-tenus"
# Marque de passage vivante d'un autre capitaine sur la sous-PR `<n>`, lue sans rien écrire : `FILTRE_PASSAGE` de
# github.sh (la décision du verrou) sur ses commentaires, comme le lirait un passage qui poserait sa marque maintenant
# (`mien` au-dessus de tout id, `cree` à l'heure de `epoch_passage`, l'horloge du verrou). Écrit « <capitaine> <date
# du verrou> » ; rien : personne, ou une marque expirée (90 minutes) ; « illisible » : commentaires ou dates
# illisibles, et dans le doute elle tient. Son passage, lui, pose sa marque et tranche (`prendre_passage`).
verrou_d_un_autre() {
  local lus
  lus=$(lire_github "$DEPOT/issues/$1/comments?per_page=100" --paginate) &&
    jq -rs --arg moi "$CAPITAINE_ID" --argjson mien 9007199254740991 --arg cree "$(jq -nr --argjson e "$(epoch_passage)" '$e | todate')" \
      "$FILTRE_PASSAGE | .tenu // \"\"" <<<"$lus" 2>/dev/null ||
    echo illisible
}
# Date du verrou d'un autre capitaine, lue sur la DERNIÈRE ligne d'une sortie 7 de `sujet.sh` (son `sortir` :
# « #<n> en passage chez le capitaine <id> depuis <date> : … », `PASSAGE_MOTIF` de github.sh), jamais sur un motif cherché
# dans toute la sortie. Écrit « , verrou du <date> » ; rien quand la sortie 7 a une autre cause (fermée, en brouillon,
# sujet gelé, plus éligible une fois le verrou pris).
date_du_verrou() { # <n> <fichier de la sortie>
  local fin
  fin=$({ grep . "$2" || true; } | tail -n 1 | tr -d '\r')
  [[ "$fin" =~ ^"#$1 en passage chez le capitaine "[A-Za-z0-9_-]+" depuis "([0-9TZ:-]+)" : " ]] || return 0
  printf ', verrou du %s' "${BASH_REMATCH[1]}"
}
traiter_sujets() {
  local n etat sujet rc tient par liste lue enroute verrou geste tenus=' '
  verifier_arret
  # Séries par spec et piles : regroupées d'office (hors prio:haute et hors-sujet).
  bash "$SUJET" regrouper-series 2>&1 | sed 's#^série #[sujets] REGROUPÉE série #; s#^#  #'
  # La file, lue une fois. Illisible (file.sh en 5, rien sur sa sortie) : aucun geste, et `TENUS` reste tel quel.
  liste=$(bash "$outils/file.sh") && lue=1 || lue=''
  # Sous-PR en route, « sujet<TAB>numéro<TAB>état », dans l'ordre de file.sh (numéro croissant).
  enroute=$(awk -F '\t' -v s="$sautees" 'index(s, " " $1 " ") == 0 && match($2, /^sujet\/[^ ]+ : /) {
      e = substr($2, RLENGTH + 1)
      if (e == "prête" || e == "prête (sans CI)" || e == "prête (en conflit)" || e == "CI en cours") print substr($2, 1, RLENGTH - 3) "\t" $1 "\t" e
    }' <<<"$liste")
  # Qui tient déjà chaque sujet qui a plusieurs sous-PR en route, au début du tour (en-tête : marque d'un autre
  # capitaine, mémoire, « CI en cours »).
  while IFS= read -r sujet; do
    par=''
    for n in $(awk -F '\t' -v s="$sujet" '$1 == s { print $2 }' <<<"$enroute"); do
      verrou=$(verrou_d_un_autre "$n" </dev/null)
      [ -n "$verrou" ] || continue
      echo "[#$n] marque de passage d'un autre capitaine ($verrou) : elle tient $sujet"
      par=$n
      break
    done
    if [ -z "$par" ]; then
      par=$(awk -F ':' -v s="$sujet" '$1 == s { print $2; exit }' "$TENUS" 2>/dev/null)
      par=$(awk -F '\t' -v s="$sujet" -v m="$par" '$1 != s { next } $2 == m { g = $2 } $3 == "CI en cours" && !c { c = $2 } END { print (g ? g : c) }' <<<"$enroute")
    fi
    [ -z "$par" ] || tenus="$tenus$sujet:$par "
  done < <(awk -F '\t' '$1 != "" && ++k[$1] == 2 { print $1 }' <<<"$enroute")
  # Le corps lit /dev/null, jamais l'entrée de la boucle : un outil lancé qui lit son entrée (pnpm, un hook, `cat`)
  # mangeait les lignes suivantes de file.sh, et les sous-PR suivantes n'étaient pas traitées dans le tour.
  # Celles qui tiennent déjà leur sujet d'abord, puis les autres lignes dans l'ordre de file.sh. La file lue jusqu'au
  # bout, `tenus` est gardé dans `TENUS` pour le tour suivant (dans le sous-shell du tube, où il vit).
  awk -F '\t' -v t="$tenus" '$1 == "" { next } { s = $2; sub(/ : .*/, "", s) }
    index(t, " " s ":" $1 " ") { print; next } { reste = reste $0 "\n" } END { printf "%s", reste }' <<<"$liste" |
  while IFS="$(printf '\t')" read -r n etat _ livre || { [ -z "$lue" ] || tr ' ' '\n' <<<"$tenus" >"$TENUS"; false; }; do
    case " $sautees " in *" $n "*) continue ;; esac
    # Ticket d'un sujet déjà livré : PR directe vers develop, `hors-sujet` posé.
    if [ -n "$livre" ]; then
      poser_label "$n" hors-sujet &&
        commenter "$n" "$(printf 'Le sujet de ce ticket est déjà livré dans develop : PR laissée vers \`develop\` (label \`hors-sujet\`), jamais reciblée sur la branche de sujet.\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_')" &&
        echo "[#$n] hors-sujet posé ($livre)"
    fi </dev/null
    tient='' geste=''
    case "$etat" in
      sujet/*' : prête' | sujet/*' : prête (sans CI)' | sujet/*' : prête (en conflit)' | sujet/*' : CI en cours')
        tient=${etat%% : *}
        case "$tenus" in
          *" $tient:$n "*) ;;
          *" $tient:"*)
            par=${tenus#*" $tient:"}
            echo "[#$n] attend son tour : #${par%% *} passe d'abord dans $tient"
            continue ;;
          *) tenus="$tenus$tient:$n " ;;
        esac ;;
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
        geste="sortie $rc de relancer"
        [ "$rc" != 7 ] || geste="$geste$(date_du_verrou "$n" "$sortie")"
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
          # Passage interrompu par un signal (128 et plus) : rien que la session puisse corriger, état inconnu.
          12[89] | 1[3-9][0-9] | 2[0-9][0-9]) echo "[#$n] ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie $rc), état de la sous-PR inconnu : laissée dans la file (aucun renvoi)" ;;
        esac
        # Mise à jour poussée (0), reprise (5, 6, 11), verrou d'un autre capitaine (7) ou passage interrompu par un
        # signal (128 et plus) : le sujet reste tenu. Renvoyée (2, 4, 3 du pre-push), ou sortie 3 muette (rien de
        # poussé, et rien ne dit qu'elle passera un jour) : rendu.
        case "$rc" in 0 | 5 | 6 | 7 | 11 | 12[89] | 1[3-9][0-9] | 2[0-9][0-9]) ;; *) tenus=${tenus/" $tient:$n "/ } ;; esac ;;
      sujet/*': prête')
        # Passé l'échéance, aucun `sujet.sh fusionner` (il peut attendre une CI) : le code remonte du sous-shell.
        ! echeance_passee || exit "$ECHEANCE_TUBE"
        bash "$SUJET" fusionner "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        geste="sortie $rc de fusionner"
        [ "$rc" != 7 ] || geste="$geste$(date_du_verrou "$n" "$sortie")"
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
          # Passage interrompu par un signal (128 et plus) : rien que la session puisse corriger, état inconnu.
          12[89] | 1[3-9][0-9] | 2[0-9][0-9]) echo "[#$n] ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie $rc), état de la sous-PR inconnu : laissée dans la file (aucun renvoi)" ;;
          *) echo "[#$n] sous-PR non éligible (sortie $rc)" ;;
        esac
        # Reprise (5, 6, 11), verrou d'un autre capitaine (7), CI de la mise à jour en cours (8) ou passage interrompu
        # par un signal (128 et plus) : le sujet reste tenu. Fusionnée (0), renvoyée (3, 4) ou sortie non classée (2,
        # le sujet en conflit avec develop : la PR de mise à jour qui le résout est plus loin dans la file) : rendu.
        case "$rc" in 5 | 6 | 7 | 8 | 11 | 12[89] | 1[3-9][0-9] | 2[0-9][0-9]) ;; *) tenus=${tenus/" $tient:$n "/ } ;; esac ;;
    esac </dev/null
    # Le sujet reste tenu après le passage de celle qui le tient : dit à chaque tour, avec la raison.
    case "$tenus" in *" ${tient:-?}:$n "*) echo "[$tient] tenu par #$n (${geste:-CI en cours})" ;; esac
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

## Annexe B — `skills/chaine/fusionner/scripts/veille.sh`, cinq retouches

1. Dans l'en-tête (l. 7), la ligne :

````bash
# « CI en cours », « attend », « bloquée » ou en brouillon ne relance rien.
````

devient :

````bash
# « CI en cours », « attend », « bloquée » ou en brouillon ne relance rien d'elle-même.
````

2. Dans l'en-tête, après la ligne « # la boucle. » (l. 13) et avant « # « prête (sans CI) » est un état à part », insérer :

````bash
# Une sous-PR qui attend son tour dans son sujet (`[#n] attend son tour : #m passe d'abord…`, boucle.sh) reste
# « prête », la même ligne de sonde en sonde, et celle qui tient le sujet peut quitter la file sans qu'aucune ligne
# n'apparaisse (étiquette retirée, `fusion-bloquée`, fermée, brouillon). La sonde ajoute donc, pour chaque sous-PR
# qui attend, la ligne « n attend #m (<état de #m dans la file>) » : nouvelle à la première sonde qui suit la boucle
# (un second regard), puis chaque fois que l'état de #m change ou que #m quitte la file, elle relance la boucle.
# Un sujet tenu par une sous-PR en passage chez un autre capitaine (`[sujet/<nom>] tenu par #n (sortie 7 de …, verrou
# du <date>)`, boucle.sh) : si ce capitaine est mort, son verrou expire 90 minutes après cette date sans que rien ne
# change dans la file. La veille relance donc la boucle une fois, à la première sonde qui suit cette date de plus de
# 95 minutes (90, et 5 de marge entre l'horloge de ce poste et celle de GitHub) : « verrou d'un autre capitaine
# expiré ». Si la boucle retrouve le même verrou à la même date, la veille ne relance plus pour lui.
````

3. Dans `lancer`, après la ligne qui retire les PR `agies` de `vu` et avant l'accolade fermante, insérer :

````bash
  # Sous-PR qui attendent leur tour, « n:m » (n attend que #m, qui tient son sujet, soit passée) : etat_file les suit.
  attentes=$(sed -nE 's/^\[#([0-9]+)\] attend son tour : #([0-9]+) .*/\1:\2/p' "$journal_boucle" | tr '\n' ' ')
  # Verrous d'un autre capitaine qui tiennent un sujet : la plus proche de leurs expirations (date + 90 min), en
  # secondes depuis l'époque Unix ; vide : aucun, ou une date illisible.
  expire=$(sed -nE 's/^\[sujet\/[^]]+\] tenu par #[0-9]+ \(sortie 7 de (fusionner|relancer), verrou du ([0-9TZ:-]+)\)$/\2/p' "$journal_boucle" |
    jq -Rrs '[split("\n")[] | select(. != "") | fromdateiso8601] | min // empty | . + 5400' 2>/dev/null)
````

4. Le commentaire et la fonction `etat_file` (l. 176 à 184) deviennent :

````bash
# Lignes « numéro état » des PR à traiter (prêtes ou rouges), triées ; puis, pour chaque sous-PR qui attend son tour
# et qui est encore dans la file, « n attend #m (<état de #m>) », l'état de celle qui tient son sujet.
# `expire` : l'expiration lue au dernier lancement (lancer) ; `tire` : celle pour laquelle la boucle a déjà été relancée.
attentes=""
expire=""
tire=""
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

5. Dans la boucle principale (l. 213 à 216), le bloc :

````bash
  if [ -n "$nouveau" ]; then
    echo "VEILLE $(heure) : file à traiter ($(printf '%s' "$nouveau" | tr '\n' ',' | sed 's/,$//')), boucle relancée"
    lancer
  fi
````

devient :

````bash
  if [ -n "$nouveau" ]; then
    echo "VEILLE $(heure) : file à traiter ($(printf '%s' "$nouveau" | tr '\n' ',' | sed 's/,$//')), boucle relancée"
    lancer
  elif [ -n "$expire" ] && [ "$expire" != "$tire" ] && [ "$(date +%s)" -gt $((expire + 300)) ]; then
    # Le verrou d'un autre capitaine qui tenait un sujet a expiré sans que la file change : une relance, une seule.
    tire=$expire
    echo "VEILLE $(heure) : verrou d'un autre capitaine expiré (sa date a plus de 95 min), boucle relancée"
    lancer
  fi
````

## Annexe C — `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`

Deux retouches du banc existant (l. 221 et l. 236 à `988a6c3`). Son titre :

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
  assert.match(r.stdout, /^\[sujet\/lot\] tenu par #80 \(sortie 0 de relancer\)$/m, r.stdout);
  assert.equal(d.git("rev-parse", "origin/docs/autre"), autre, "#81 n'est pas mise à jour tant que #80 tient le sujet");
````

Puis, en fin de fichier, après une ligne vide :

````js
// ── Une sous-PR à la fois par sujet (ticket 57 de gouverner-nos-boucles, décisions A-104 et A-142) ───────────────
// Les deux cas qui demandent une PR de mise à jour (`miseAJour`) ; les autres sont dans une-sous-pr-a-la-fois.test.mjs.
const tourDeBoucle = (d) => {
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r;
};
const sousPrDeLot = (d, depuis, checks = {}) => {
  const sommet = d.branche("feat/sous", depuis, { "docs/sous.md": "sous\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    pulls: [{ number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }, ...d.etat().pulls],
    checks: { ...d.etat().checks, ...(checks.qualite ? { [sommet]: checks } : {}) },
  });
  d.publierChaine();
  return sommet;
};

test("boucle.sh : une sous-PR arrêtée par le conflit de son sujet avec develop (sortie 2) rend le sujet : la PR de mise à jour, plus récente, entre dans le même tour", () => {
  const { d } = miseAJour();
  sousPrDeLot(d, "origin/develop");
  const r = tourDeBoucle(d);
  assert.match(r.stdout, /\[#80\] sous-PR non éligible \(sortie 2\)/);
  assert.match(r.stdout, /\[#81\] FUSIONNÉE dans sujet\/lot/);
  assert.doesNotMatch(r.stdout, /attend son tour|tenu par/);
});

test("boucle.sh : une PR de mise à jour ouverte derrière une sous-PR plus ancienne en route attend son tour, puis est renvoyée dès que cette sous-PR entre (elle est à refaire)", () => {
  const { d } = miseAJour();
  const sommet = sousPrDeLot(d, "origin/sujet/lot", { qualite: "IN_PROGRESS" });
  let r = tourDeBoucle(d);
  assert.match(r.stdout, /^\[#81\] attend son tour : #80 passe d'abord dans sujet\/lot$/m);
  assert.match(r.stdout, /^\[sujet\/lot\] tenu par #80 \(CI en cours\)$/m);
  d.github({ checks: { ...d.etat().checks, [sommet]: { qualite: "SUCCESS" } } });
  r = tourDeBoucle(d);
  assert.match(r.stdout, /\[#80\] FUSIONNÉE dans sujet\/lot/);
  assert.match(r.stdout, /\[#81\] RENVOI : #81, PR de mise à jour : le premier parent n'est pas le sommet de sujet\/lot/);
});
````

## Annexe D — `skills/chaine/fusionner/scripts/veille.test.mjs`

À insérer avant le test « PR sautée par la boucle, renvoi d'une autre : pas de relance en rond » (l. 216 à `988a6c3`), suivi d'une ligne vide :

````js
// Ticket 57 de gouverner-nos-boucles (A-104, A-142) : une sous-PR qui attend son tour reste « prête », la même ligne de
// sonde en sonde ; celle qui tient son sujet peut quitter la file sans qu'aucune ligne n'apparaisse (étiquette retirée,
// `fusion-bloquée`, fermée). La sonde suit donc l'état de celle qui tient le sujet.
test("sous-PR qui attend son tour dans son sujet : un second regard à la sonde suivante, puis une relance chaque fois que celle qui tient le sujet change d'état ou quitte la file ; plus aucune quand celle qui attendait a quitté la file", () => {
  const file = (etat80, attente = true) => `${etat80 === null ? "" : `80\t${etat80}\t\n`}${attente ? "81\tsujet/lot : prête\t\n" : ""}`;
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
  // #81, qui attendait, quitte la file ; #80 change ensuite d'état : plus rien n'attend, rien n'est relancé.
  const partie = [enCours, enCours, file("sujet/lot : CI en cours", false), file("bloquée", false)];
  assert.equal(veilleJouet(partie, { sorties: [attend, attend], sondes: 3 }).lancements, 2);
});

// Ticket 57 (A-142) : un sujet tenu par une sous-PR en passage chez un autre capitaine. Si ce capitaine est mort, son
// verrou expire sans que rien ne change dans la file : la veille lit la date du verrou dans la ligne de la boucle.
test("sujet tenu par le verrou d'un autre capitaine : la boucle est relancée une fois quand ce verrou a expiré (sa date a plus de 95 minutes), pas avant, et pas deux fois pour la même date", () => {
  const ilYA = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString().replace(/\.\d+Z$/, "Z");
  const tenu = (n, geste, date) => `[sujet/lot-${n}] tenu par #${n} (sortie 7 de ${geste}, verrou du ${date})\n`;
  const file = [prete(80) + prete(82)];
  const lancements = (...sorties) => veilleJouet(file, { sorties, sondes: 3 });
  // Expiré : une relance. La boucle retrouve le même verrou à la même date : la veille ne relance plus pour lui.
  const expire = ilYA(96);
  const r = lancements(tenu(80, "fusionner", expire), tenu(80, "fusionner", expire));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2, r.stdout);
  assert.match(r.stdout, /^VEILLE \d\d:\d\d : verrou d'un autre capitaine expiré \(sa date a plus de 95 min\), boucle relancée$/m);
  // Le verrou d'un passage de `relancer` se lit de même.
  assert.equal(lancements(tenu(82, "relancer", expire), "").lancements, 2);
  // Pas avant : 90 minutes passées, mais pas la marge de 5 ; ni un verrou récent ; ni une sortie 7 sans verrou.
  assert.equal(lancements(tenu(80, "fusionner", ilYA(92))).lancements, 1);
  assert.equal(lancements(tenu(80, "fusionner", ilYA(10))).lancements, 1);
  assert.equal(lancements("[sujet/lot-80] tenu par #80 (sortie 7 de fusionner)\n").lancements, 1);
  // Deux verrous : le premier à expirer relance la boucle.
  assert.equal(lancements(tenu(80, "fusionner", ilYA(10)) + tenu(82, "fusionner", expire), "").lancements, 2);
  // Le capitaine a rafraîchi son verrou entre deux tours (une autre date), qui expire à son tour : une relance de plus.
  assert.equal(lancements(tenu(80, "fusionner", ilYA(97)), tenu(80, "fusionner", expire), tenu(80, "fusionner", expire)).lancements, 3);
});
````

Et, dans le test « les lignes que la veille lit sont celles qu'écrivent renvoyer.sh et boucle.sh » (l. 228), la ligne :

````js
  assert.ok(lire("boucle.sh").includes('echo "[#$n] RELANCE des jobs rouges'));
````

devient :

````js
  assert.ok(lire("boucle.sh").includes('echo "[#$n] RELANCE des jobs rouges'));
  // Ticket 57 : la sous-PR qui attend son tour, et le sujet tenu avec la date du verrou d'un autre capitaine.
  assert.ok(lire("boucle.sh").includes(`echo "[#$n] attend son tour : #\${par%% *} passe d'abord dans $tient"`));
  assert.ok(lire("boucle.sh").includes('echo "[$tient] tenu par #$n (${geste:-CI en cours})"'));
  assert.ok(lire("boucle.sh").includes('geste="sortie $rc de fusionner"') && lire("boucle.sh").includes('geste="sortie $rc de relancer"'));
  assert.ok(lire("boucle.sh").includes(`printf ', verrou du %s' "\${BASH_REMATCH[1]}"`));
````

## Annexe E — `scripts/depot.test.mjs`

Le titre du test de la ligne 1146 :

````js
test("la règle d'ascendance du plugin 7.16.0 : version, note de version en tête, renvoi du README, une sous-PR étiquetée à la fois", () => {
````

perd « , une sous-PR étiquetée à la fois » :

````js
test("la règle d'ascendance du plugin 7.16.0 : version, note de version en tête, renvoi du README", () => {
````

Sa dernière ligne (l. 1155) est supprimée :

````js
  exiger(`${SKILLS_CHAINE}/fusionner/SKILL.md`, ["une seule sous-PR porte `à-fusionner` à la fois"]);
````

Après ce test, une ligne vide, puis :

````js
// Ticket 57 de gouverner-nos-boucles (A-104, A-142) : « une sous-PR à la fois par sujet » est tenue par le capitaine,
// et qui tient le sujet le garde ; le conducteur ne retire ni ne repose plus `à-fusionner`. L'ancienne discipline ne
// revient pas. Aucun numéro de version ici : la version est la suivante de `main` au moment de livrer, et le test des
// notes de version tient déjà ensemble `plugin.json` et la note en tête.
test("une sous-PR à la fois par sujet : le capitaine tient l'ordre, qui tient le sujet le garde, le conducteur ne retire plus l'étiquette", () => {
  const ADR_SUJET = `${SKILLS_CHAINE}/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-branches-de-sujet.md`;
  exiger(`${SKILLS_CHAINE}/fusionner/SKILL.md`, [
    "**Une sous-PR à la fois par sujet.** À chaque tour, la boucle ne prend qu'une sous-PR étiquetée par sujet, parmi celles qui sont en route",
    "Qui tient le sujet le garde, avant tout ordre de numéro : une sous-PR en passage chez un autre capitaine (sa marque de passage, lue sur chaque sous-PR en route du sujet), sinon celle que la boucle tenait au tour précédent, sinon une sous-PR « CI en cours » ; personne ne le tient, la plus ancienne (le plus petit numéro) le prend.",
    "`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` : ni mise à jour, ni CI, ni renvoi, et elles gardent `à-fusionner` ; personne ne retire ni ne repose une étiquette pour tenir cet ordre.",
    "la boucle le dit à chaque tour, `[sujet/<nom>] tenu par #<n> (<raison>)`",
    "passage interrompu par un signal (128 et plus), passage chez un autre capitaine (7) : un capitaine ne prend aucune autre sous-PR d'un sujet dont il voit une sous-PR en passage chez un autre.",
    "après une mise à jour dont la CI n'apparaît pas, elle est « sans CI et déjà à jour », et le sujet est rendu.",
    "Une sous-PR qui attend son tour dans son sujet la relance une fois à la sonde suivante, puis chaque fois que celle qui tient le sujet change d'état ou quitte la file ; un sujet tenu par le verrou d'un autre capitaine la relance une fois quand ce verrou a expiré (sa date a plus de 95 minutes).",
    "« CI en cours », « attend », « bloquée » et brouillon ne relancent rien d'eux-mêmes.",
  ]);
  exiger(`${SKILLS_CHAINE}/chantier/SKILL.md`, [
    "**Une sous-PR à la fois par sujet : le capitaine tient cet ordre, pas le conducteur.**",
    "celle qui tient déjà le sujet (sa mise à jour attend sa CI, ou un capitaine est dessus), sinon la plus ancienne (le plus petit numéro, pas la première étiquetée)",
    "Le conducteur étiquette toutes les sous-PR prêtes d'une vague sans attendre que la précédente soit entrée, et il ne retire ni ne repose jamais `à-fusionner` pour régler l'ordre de passage.",
  ]);
  exiger(ADR_SUJET, ["dans un sujet, le capitaine ne prend qu'une sous-PR étiquetée à la fois, celle qui tient déjà le sujet, sinon la plus ancienne (le plus petit numéro), et les autres attendent leur tour avec leur étiquette."]);
  exiger("NOTES-DE-VERSION.md", ["« Une sous-PR à la fois par sujet » est tenue par le capitaine, plus par le conducteur.", "Qui tient le sujet le garde, avant tout ordre de numéro"]);
  for (const [fichier, ancien] of [
    [`${SKILLS_CHAINE}/fusionner/SKILL.md`, "une seule sous-PR porte `à-fusionner` à la fois"],
    [`${SKILLS_CHAINE}/fusionner/SKILL.md`, "le conducteur y veille"],
    [`${SKILLS_CHAINE}/fusionner/SKILL.md`, "brouillon ne relancent rien."],
    [`${SKILLS_CHAINE}/chantier/SKILL.md`, "ne le laisse qu'à la plus ancienne"],
    [`${SKILLS_CHAINE}/chantier/SKILL.md`, "retiré par le conducteur"],
    [`${SKILLS_CHAINE}/chantier/SKILL.md`, "puis le repose sur la suivante"],
    [ADR_SUJET, "une seule sous-PR porte `à-fusionner` à la fois"],
  ])
    assert.ok(!plat(readFileSync(join(RACINE, fichier), "utf8")).includes(ancien), `${fichier} : l'ancienne discipline y est encore (« ${ancien} »)`);
});
````

## Annexe F — `skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs`, fichier nouveau

Le fichier entier :

````js
// Une sous-PR à la fois par sujet (ticket 57 de gouverner-nos-boucles, décisions A-104 et A-142) : `traiter_sujets`
// de boucle.sh ne prend, à chaque tour, qu'une sous-PR en route par sujet (celle qui tient déjà le sujet, sinon la plus
// ancienne) ; les autres attendent leur tour, sans mise à jour, ni CI, ni renvoi. Dépôt jouet et faux `gh` du skill
// sujet : aucun réseau. Les deux cas qui demandent une PR de mise à jour sont dans sujet-fusionner.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const BOUCLE = scriptDe("fusionner", "boucle.sh");
const VEILLE = scriptDe("fusionner", "veille.sh");
// La marque de passage d'un autre capitaine, sans epoch : datée par le `created_at` que le faux lui donne.
const marqueDe = (id) => `Passage du capitaine \`${id}\` depuis 12:00 UTC.\n<!-- capitaine:passage ${id} -->`;
const DATE_DU_FAUX = "2026-11-17T12:00:00Z";
// Écritures sur GitHub hors commentaires du verrou du passage (posé, rafraîchi, terminé ou retiré par chaque passage).
const passage = (e) => (/^issues\/\d+\/comments$|^issues\/comments\/\d+$/.test(e.route) && (e.methode === "DELETE" || (e.champs?.body ?? "").includes("<!-- capitaine:passage ")));
const ecritures = (d) => d.journal().filter((e) => !passage(e)).map((e) => `${e.methode} ${e.route}`);
// Tout ce qui est écrit sur la PR `n`, verrou compris.
const ecritesSur = (d, n) => d.journal().filter((e) => new RegExp(`^(issues|pulls)/${n}/`).test(e.route)).map((e) => `${e.methode} ${e.route}`);

// `sujets` : { <nom>: [numéros] } ; chaque sous-PR part de son sujet et ajoute `docs/pr-<n>.md` ; un sujet nommé dans
// `retard` reçoit ensuite un fichier : ses sous-PR sont en retard ; une sous-PR nommée dans `conflit` voit son sujet
// écrire son propre fichier : elle est en conflit avec lui, hors index. Checks : verts sur les sommets de départ (par
// sha) ; aucun sur un autre commit (le sommet d'une mise à jour du capitaine, dont `sujet.sh fusionner` sort alors
// en 8), jusqu'à `ci` ou `checksDe`.
function sousPrDeSujets(sujets, { retard = [], conflit = [] } = {}) {
  const d = depotJouet();
  const checks = {};
  const pulls = [];
  for (const [nom, numeros] of Object.entries(sujets)) {
    d.branche(`sujet/${nom}`, "origin/develop", { [`docs/${nom}.md`]: `${nom}\n` }, `feat(${nom}): lot (#1)`);
    for (const n of numeros) {
      checks[d.branche(`feat/pr-${n}`, `origin/sujet/${nom}`, { [`docs/pr-${n}.md`]: `${n}\n` })] = { qualite: "SUCCESS" };
      pulls.push({ number: n, title: `docs(${nom}): pr ${n}`, head: `feat/pr-${n}`, base: `sujet/${nom}`, labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" });
    }
    const suite = Object.fromEntries(numeros.filter((n) => conflit.includes(n)).map((n) => [`docs/pr-${n}.md`, "sujet\n"]));
    if (retard.includes(nom)) suite[`docs/${nom}-suite.md`] = "suite\n";
    if (Object.keys(suite).length) d.branche(`sujet/${nom}`, `origin/sujet/${nom}`, suite, `feat(${nom}): suite (#2)`);
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  d.publierChaine();
  return d;
}
const teteDe = (d, n) => d.git("ls-remote", "origin", `refs/heads/feat/pr-${n}`).split("\t")[0];
// Numéros des sous-PR que la boucle a mises à jour et poussées dans ce tour, dans l'ordre du journal.
const poussees = (r) => [...r.stdout.matchAll(/^\[#(\d+)\] #\d+ en retard sur sujet\/\S+ : mise à jour poussée/gm)].map((m) => Number(m[1]));
const attend = (n, par, sujet = "lot") => new RegExp(`^\\[#${n}\\] attend son tour : #${par} passe d'abord dans sujet/${sujet}$`, "m");
// La ligne que la boucle écrit à chaque tour pour un sujet encore tenu après le passage de celle qui le tient.
const tenu = (sujet, n, raison) => new RegExp(`^\\[sujet/${sujet}\\] tenu par #${n} \\(${raison}\\)$`, "m");
const entree = (n, sujet = "lot") => new RegExp(`^\\[#${n}\\] FUSIONNÉE dans sujet/${sujet} $`, "m");
const fusionnees = (d) => d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number).sort((a, b) => a - b);
// La CI des commits sans entrée à leur sha : `ci(d, "IN_PROGRESS")` la dit en cours, `ci(d, null)` la retire.
const ci = (d, etat) => {
  const { "*": _, ...checks } = d.etat().checks;
  d.github({ checks: etat === null ? checks : { ...checks, "*": { qualite: etat } } });
};
// La CI du sommet courant de ces sous-PR ; `sansCi` la retire (aucun check sur leur sommet).
const checksDe = (d, etat, ...numeros) => d.github({ checks: { ...d.etat().checks, ...Object.fromEntries(numeros.map((n) => [teteDe(d, n), { qualite: etat }])) } });
const sansCi = (d, ...numeros) => {
  const tetes = numeros.map((n) => teteDe(d, n));
  d.github({ checks: Object.fromEntries(Object.entries(d.etat().checks).filter(([sha]) => !tetes.includes(sha))) });
};
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
  assert.match(r.stdout, entree(83, "autre"));
  // La boucle nomme le sujet tenu, celle qui le tient et la raison ; un sujet rendu n'a pas de ligne.
  assert.match(r.stdout, tenu("lot", 80, "sortie 8 de fusionner"));
  assert.doesNotMatch(r.stdout, /\[sujet\/autre\] tenu par/);
  // Tour 2 : la CI de #80 tourne (« CI en cours », aucun geste de la boucle) : elle tient toujours le sujet.
  ci(d, "IN_PROGRESS");
  r = tour(d);
  assert.deepEqual(poussees(r), [], `aucune mise à jour pendant la CI de #80 : ${r.stdout}`);
  intactes(81, 82);
  assert.deepEqual(fusionnees(d), [83]);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, attend(82, 80));
  assert.match(r.stdout, tenu("lot", 80, "CI en cours"));
  // Tour 3 : la CI de #80 est verte : elle entre, le sujet est rendu, #81 est prise dans le même tour (mise à jour
  // poussée, sortie 8) et tient le sujet à son tour.
  ci(d, null);
  checksDe(d, "SUCCESS", 80);
  r = tour(d);
  assert.match(r.stdout, entree(80));
  assert.deepEqual(poussees(r), [81], r.stdout);
  assert.match(r.stdout, attend(82, 81));
  assert.match(r.stdout, tenu("lot", 81, "sortie 8 de fusionner"));
  intactes(82);
  // Tour 4 : #81 entre, #82 est mise à jour à son tour, et plus rien n'attend.
  checksDe(d, "SUCCESS", 81);
  r = tour(d);
  assert.match(r.stdout, entree(81));
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
  sansCi(d, 88);
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] RENVOI : sujet du squash à \d+ caractères/);
  assert.match(r.stdout, /\[#88\] #88 contient déjà sujet\/sans-ci : aucun commit à pousser/);
  for (const [n, sujet] of [[81, "renvoi"], [83, "rouge"], [85, "bloquee"], [87, "brouillon"], [89, "sans-ci"]]) assert.match(r.stdout, entree(n, sujet), r.stdout);
  assert.doesNotMatch(r.stdout, /attend son tour|tenu par/);
  assert.deepEqual(fusionnees(d), [81, 83, 85, 87, 89]);
});

test("boucle.sh : un renvoi rend le sujet, la suivante est prise dans le même tour (conflit hors index vu par fusionner, sortie 3, et par relancer, sortie 2 ; tête gardée vue par relancer, sortie 4)", () => {
  const d = sousPrDeSujets({ code: [80, 81], "sans-ci": [82, 83], garde: [85] }, { conflit: [80, 82] });
  // #80 : verte sur son sommet, en conflit avec son sujet hors index (`fusionner`, sortie 3). #82 : la même sans CI,
  // « prête (en conflit) » (`relancer`, sortie 2). #84 : sans CI, sa tête est develop, branche gardée (`relancer`, 4).
  sansCi(d, 82);
  d.github({ pulls: [...d.etat().pulls, { number: 84, title: "docs(garde): pr 84", head: "develop", base: "sujet/garde", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }] });
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] RENVOI : fusion refusée par GitHub \(conflit avec sujet\/code hors index générés/);
  assert.match(r.stdout, /\[#82\] RENVOI : conflit avec sujet\/sans-ci hors index générés : `docs\/pr-82\.md`/);
  assert.match(r.stdout, /\[#84\] RENVOI : #84 : tête develop, branche gardée/);
  // Les suivantes sont prises dans le tour : #81 et #83, en retard, sont mises à jour ; #85, à jour, entre.
  assert.deepEqual(poussees(r), [81, 83], r.stdout);
  assert.match(r.stdout, entree(85, "garde"));
  assert.doesNotMatch(r.stdout, /attend son tour/);
});

test("boucle.sh : une sous-PR en passage chez un autre capitaine tient son sujet (sortie 7, la date du verrou lue sur la dernière ligne et dite dans la ligne du sujet tenu) ; ce passage terminé, elle entre et la suivante est prise dans le même tour ; une sortie 7 sans verrou tient le sujet un tour, sans date", () => {
  const d = sousPrDeSujets({ course: [78, 79], lot: [80, 81] });
  ci(d, "SUCCESS");
  // Tour 1, `sujet/course` seul dans la file. #78 perd son étiquette pendant que le capitaine pose son verrou (le
  // premier commentaire posé du tour) : relue une fois le verrou pris, elle n'est plus éligible, sortie 7 sans verrou
  // d'un autre capitaine. Elle tient le sujet à ce tour, et la ligne du sujet tenu ne porte aucune date.
  changerPr(d, 80, { labels: [] });
  changerPr(d, 81, { labels: [] });
  d.github({ apresCommentaire: { labels: [] } });
  let r = tour(d);
  assert.match(r.stdout, /\[#78\] #78 : PR plus éligible une fois le verrou pris \(sans le label à-fusionner\) : sautée/);
  assert.match(r.stdout, attend(79, 78, "course"));
  assert.match(r.stdout, tenu("course", 78, "sortie 7 de fusionner"));
  // Tour 2 : #78 n'est plus dans la file, #79 entre. #80 porte la marque de passage d'un autre capitaine. Un outil du
  // passage (ici `git fetch`) écrit avant la ligne de sortie une ligne de la même forme : seule la dernière compte.
  changerPr(d, 80, { labels: ["à-fusionner"], commentaires: [marqueDe("capitaine-jordan")] });
  changerPr(d, 81, { labels: ["à-fusionner"] });
  writeFileSync(join(d.racine, "bin", "git"), '#!/bin/sh\n[ "$1" != fetch ] || echo "#80 en passage chez le capitaine un-outil depuis 2020-01-01T00:00:00Z : ligne d\'un outil" >&2\nPATH=${PATH#*:} exec git "$@"\n', { mode: 0o755 });
  r = tour(d);
  assert.match(r.stdout, entree(79, "course"));
  assert.match(r.stdout, /^\[#80\] #80 en passage chez le capitaine un-outil depuis 2020-01-01T00:00:00Z : ligne d'un outil$/m, "la ligne de l'outil est dans la sortie du passage");
  assert.match(r.stdout, /\[#80\] sous-PR non éligible \(fermée, en brouillon, ou en passage chez un autre capitaine\)/);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, tenu("lot", 80, `sortie 7 de fusionner, verrou du ${DATE_DU_FAUX}`));
  assert.deepEqual(fusionnees(d), [79]);
  assert.deepEqual(ecritesSur(d, 81), [], "rien d'écrit sur #81, pas même un verrou");
  // Tour 3 : l'autre capitaine a terminé son passage (marque de fin) sans faire entrer #80.
  changerPr(d, 80, { commentaires: [`${marqueDe("capitaine-jordan")}\n<!-- capitaine:fin -->`], supprimes: [], editions: {} });
  r = tour(d);
  assert.match(r.stdout, entree(80));
  assert.match(r.stdout, entree(81));
  assert.deepEqual(fusionnees(d), [79, 80, 81]);
});

test("boucle.sh : une reprise (sortie 5) et un échec du capitaine (sortie 11, de fusionner et de relancer) laissent le sujet tenu : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ reprise: [80, 81], echec: [82, 83], "echec-r": [84, 85] }, { retard: ["echec-r"] });
  // #80 : GitHub illisible à la lecture de la PR par `fusionner` (5). #82 et #84 : le commentaire du verrou du passage
  // est refusé (11), à `fusionner` et à `relancer` (#84 est sans CI).
  sansCi(d, 84);
  d.github({ pannes: [{ route: "^pulls/80$" }], commentairesRefuses: "capitaine:passage" });
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] REPRISE au tour suivant \(sous-PR ou sujet bougé/);
  assert.match(r.stdout, attend(81, 80, "reprise"));
  assert.match(r.stdout, tenu("reprise", 80, "sortie 5 de fusionner"));
  for (const [n, sujet, geste] of [[82, "echec", "fusionner"], [84, "echec-r", "relancer"]]) {
    assert.match(r.stdout, new RegExp(`^\\[#${n}\\] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file`, "m"));
    assert.match(r.stdout, attend(n + 1, n, sujet));
    assert.match(r.stdout, tenu(sujet, n, `sortie 11 de ${geste}`));
  }
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.deepEqual(poussees(r), []);
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : relancer laisse le sujet tenu quand il met à jour une sous-PR sans CI et en retard (sortie 0), la trouve en passage chez un autre capitaine (7) ou bougée depuis sa lecture (5) : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ retard: [80, 81], verrou: [82, 83], bouge: [84, 85] }, { retard: ["retard", "verrou"] });
  sansCi(d, 80, 82);
  changerPr(d, 82, { commentaires: [marqueDe("capitaine-jordan")] });
  // #84 : le sommet que GitHub rend n'est plus celui de sa branche (elle a bougé depuis sa lecture), et il est sans CI.
  changerPr(d, 84, { sha: d.git("rev-parse", "origin/sujet/bouge") });
  const depart = Object.fromEntries([81, 82, 83, 84, 85].map((n) => [n, teteDe(d, n)]));
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] #80 : sujet\/retard fusionné dans sa branche \([0-9a-f]+\), CI lancée/);
  assert.match(r.stdout, attend(81, 80, "retard"));
  assert.match(r.stdout, tenu("retard", 80, "sortie 0 de relancer"));
  assert.match(r.stdout, /\[#82\] en passage chez un autre capitaine : sautée \(aucun renvoi\)/);
  assert.match(r.stdout, attend(83, 82, "verrou"));
  assert.match(r.stdout, tenu("verrou", 82, `sortie 7 de relancer, verrou du ${DATE_DU_FAUX}`));
  assert.match(r.stdout, /\[#84\] REPRISE au tour suivant \(sous-PR bougée ou GitHub illisible\)/);
  assert.match(r.stdout, attend(85, 84, "bouge"));
  assert.match(r.stdout, tenu("bouge", 84, "sortie 5 de relancer"));
  for (const n of [81, 82, 83, 84, 85]) assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`);
  assert.deepEqual(poussees(r), [80]);
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : worktree du capitaine pas propre (sortie 6 de fusionner et de relancer), le sujet reste tenu : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81], "sans-ci": [82, 83] });
  sansCi(d, 82);
  d.ecrire("brouillon.txt", "en cours\n");
  const r = tour(d);
  for (const [n, sujet, geste] of [[80, "lot", "fusionner"], [82, "sans-ci", "relancer"]]) {
    assert.match(r.stdout, new RegExp(`^\\[#${n}\\] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file`, "m"));
    assert.match(r.stdout, attend(n + 1, n, sujet));
    assert.match(r.stdout, tenu(sujet, n, `sortie 6 de ${geste}`));
  }
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : un passage interrompu par un signal (sortie 143 de fusionner et de relancer) laisse le sujet tenu à ce tour : la suivante attend, rien n'est renvoyé", () => {
  const d = sousPrDeSujets({ lot: [80, 81], "sans-ci": [82, 83] }, { retard: ["lot", "sans-ci"] });
  sansCi(d, 82);
  // Le faux pnpm envoie TERM au passage qui le lance pour l'install d'une mise à jour (`sujet.sh`, son parent).
  writeFileSync(join(d.racine, "bin", "pnpm"), '#!/bin/sh\ncat > /dev/null\nif [ "$1" = install ]; then kill -TERM $PPID; sleep 1; fi\nexit 0\n');
  const depart = Object.fromEntries([80, 81, 82, 83].map((n) => [n, teteDe(d, n)]));
  const r = tour(d);
  for (const [n, sujet, geste] of [[80, "lot", "fusionner"], [82, "sans-ci", "relancer"]]) {
    assert.match(r.stdout, new RegExp(`^\\[#${n}\\] ÉCHEC DU CAPITAINE : passage interrompu par un signal \\(sortie 143\\), état de la sous-PR inconnu`, "m"), r.stdout);
    assert.match(r.stdout, attend(n + 1, n, sujet));
    assert.match(r.stdout, tenu(sujet, n, `sortie 143 de ${geste}`));
  }
  assert.doesNotMatch(r.stdout, /RENVOI|non éligible/);
  for (const n of [80, 81, 82, 83]) assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`);
});

// Rien ne s'écrit après la ligne du `sortir` de sujet.sh : la boucle classe sa sortie sur son code et sur sa dernière
// ligne, et refus.sh prend cette dernière ligne pour motif. La ligne du sujet tenu est écrite par la boucle, après ce
// classement, jamais dans la sortie classée.
test("boucle.sh : la ligne du sujet tenu ne suit pas la ligne de sortie de sujet.sh dans ce que la boucle classe — le renvoi qui la suit dans le tour garde pour motif la dernière ligne de sujet.sh, et la sortie 3 de relancer reste classée sur la sienne ; après une sortie 8 sans CI apparue, le sujet est rendu au tour suivant", () => {
  const d = sousPrDeSujets({ tenu: [80, 81], renvoi: [82, 83], muette: [84, 85] }, { retard: ["tenu"] });
  changerPr(d, 82, { title: `docs(renvoi): ${"x".repeat(120)}` });
  sansCi(d, 84);
  const r = tour(d);
  // Dans l'ordre du journal : la sortie 8 de #80, la ligne du sujet tenu, puis le renvoi de #82 et la sortie 3 de #84.
  const lignes = r.stdout.split("\n");
  const rang = (re) => lignes.findIndex((l) => re.test(l));
  assert.equal(rang(/^\[sujet\/tenu\] tenu par #80 \(sortie 8 de fusionner\)$/), rang(/^\[#80\] MISE À JOUR avec sujet\/tenu poussée/) + 1, r.stdout);
  assert.ok(rang(/^\[sujet\/tenu\] tenu par #80/) < rang(/^\[#82\] RENVOI : /), r.stdout);
  // Le motif du renvoi de #82 est la dernière ligne de `sujet.sh fusionner 82`, mot pour mot, et rien d'autre.
  const renvoi = d.journal().find((e) => e.methode === "POST" && e.route === "issues/82/comments" && !passage(e));
  assert.match(renvoi.champs.body, /^\*\*Renvoyée par le capitaine de fusion\*\* : sujet du squash à \d+ caractères \(> 120\) : raccourcir le titre\.\n/);
  assert.doesNotMatch(renvoi.champs.body, /tenu par|attend son tour/);
  // #84, sans CI et déjà à jour : sortie 3 dont la dernière ligne n'est pas celle du pre-push, donc muette, le sujet
  // rendu (#85 entre) ; la ligne du sujet tenu, écrite plus haut dans le tour, n'y change rien.
  assert.match(r.stdout, entree(83, "renvoi"));
  assert.match(r.stdout, entree(85, "muette"));
  assert.deepEqual(ecritesSur(d, 84).filter((e) => !/comments/.test(e)), [], "ni étiquette ni renvoi sur #84");
  // Tour 2, rien n'a changé sur GitHub : la CI de la mise à jour de #80 n'est pas apparue. #80, que la boucle tenait,
  // se lit « prête (sans CI) » et déjà à jour : `relancer` sort en 3, le sujet est rendu, et #81 est prise à son tour.
  const suite = tour(d);
  assert.match(suite.stdout, /\[#80\] #80 contient déjà sujet\/tenu : aucun commit à pousser/);
  // (#84, sans CI, en retard depuis l'entrée de #85, est mise à jour par `relancer` dans ce même tour.)
  assert.deepEqual(poussees(suite), [81, 84], suite.stdout);
  assert.match(suite.stdout, tenu("tenu", 81, "sortie 8 de fusionner"));
  assert.doesNotMatch(suite.stdout, /attend son tour/);
});

// Qui tient le sujet le garde, avant tout ordre de numéro (A-142). Deux sujets dont un nom est le début de l'autre
// (`lot`, `lot-2`), et un numéro (#8) qui est le début d'un autre (#83) : les clés se comparent entières.
test("boucle.sh : qui tient le sujet le garde — une sous-PR de numéro plus petit, étiquetée pendant la CI de celle qui tient, attend son tour ; la CI verte, celle qui tenait entre d'abord, et la plus ancienne est prise dans le même tour ; une mise à jour par sous-PR", () => {
  const d = sousPrDeSujets({ "lot-2": [80, 81], lot: [8, 83] }, { retard: ["lot", "lot-2"] });
  const depart = { 8: teteDe(d, 8), 80: teteDe(d, 80) };
  const intactes = (...numeros) => numeros.forEach((n) => assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`));
  // Tour 1 : #8 et #80 ne sont pas encore étiquetées. #81 et #83 sont mises à jour, leur CI ne finit pas (sortie 8).
  changerPr(d, 8, { labels: [] });
  changerPr(d, 80, { labels: [] });
  let r = tour(d);
  assert.deepEqual(poussees(r), [81, 83], r.stdout);
  assert.match(r.stdout, tenu("lot-2", 81, "sortie 8 de fusionner"));
  assert.match(r.stdout, tenu("lot", 83, "sortie 8 de fusionner"));
  // Tour 2 : la CI des deux mises à jour tourne ; #8 et #80 reçoivent leur étiquette. Chacune attend celle qui tient
  // son sujet, bien que son numéro soit plus petit ; la ligne de chaque sujet nomme la bonne sous-PR.
  ci(d, "IN_PROGRESS");
  changerPr(d, 8, { labels: ["à-fusionner"] });
  changerPr(d, 80, { labels: ["à-fusionner"] });
  r = tour(d);
  assert.deepEqual(poussees(r), [], `aucune mise à jour pendant la CI de celle qui tient : ${r.stdout}`);
  assert.match(r.stdout, attend(80, 81, "lot-2"));
  assert.match(r.stdout, attend(8, 83));
  assert.match(r.stdout, tenu("lot-2", 81, "CI en cours"));
  assert.match(r.stdout, tenu("lot", 83, "CI en cours"));
  assert.equal((r.stdout.match(/tenu par #/g) ?? []).length, 2, r.stdout);
  intactes(8, 80);
  // Tour 3. `sujet/lot` : les deux sous-PR sont « prête », #83 verte sur sa mise à jour : elle tenait le sujet, elle
  // entre d'abord, et #8, la plus ancienne, est prise dans le même tour (sa mise à jour, sortie 8).
  // `sujet/lot-2` : #81 est verte, et la CI de #80 tourne (un push de sa session) : #81, que la boucle tenait, entre
  // d'abord ; #80 tient ensuite le sujet par sa CI.
  // GitHub est d'abord illisible à la lecture de la file (`traiter_sujets` ne lit rien, puis PAUSE) : la boucle
  // n'oublie pas pour autant qui tenait.
  ci(d, null);
  checksDe(d, "SUCCESS", 81, 83);
  checksDe(d, "IN_PROGRESS", 80);
  d.github({ pannes: [{ route: "^pulls\\?state=open", fois: 12 }] });
  r = tour(d);
  assert.match(r.stdout, /^PAUSE \d\d:\d\d \(file\.sh, sortie 5\) : file illisible/m);
  // Selon l'endroit où GitHub redevient lisible, les gestes du tour sont dans cette boucle ou dans la suivante.
  d.github({ pannes: [] });
  r = { stdout: r.stdout + tour(d).stdout };
  assert.match(r.stdout, entree(83));
  assert.match(r.stdout, entree(81, "lot-2"));
  assert.deepEqual(poussees(r), [8], r.stdout);
  assert.ok(r.stdout.indexOf("[#83] FUSIONNÉE") < r.stdout.indexOf("[#8] #8 en retard"), "celle qui tenait passe avant la plus ancienne");
  assert.match(r.stdout, tenu("lot", 8, "sortie 8 de fusionner"));
  assert.match(r.stdout, tenu("lot-2", 80, "CI en cours"));
  assert.doesNotMatch(r.stdout, /attend son tour/);
  intactes(80);
  // Tour 4 : #8 entre ; #80, verte sur son sommet mais en retard, reçoit sa mise à jour.
  checksDe(d, "SUCCESS", 8, 80);
  r = tour(d);
  assert.match(r.stdout, entree(8));
  assert.deepEqual(poussees(r), [80], r.stdout);
  assert.deepEqual(fusionnees(d), [8, 81, 83]);
  // Une mise à jour du capitaine par sous-PR, jamais deux.
  d.git("fetch", "-q", "origin");
  for (const n of [8, 80, 81, 83]) assert.equal(d.git("rev-list", "--merges", "--count", `origin/feat/pr-${n}`), "1", `#${n}`);
});

// Deux capitaines sur la même file (A-142) : ce capitaine-ci ne prend aucune autre sous-PR d'un sujet dont une sous-PR
// est en passage chez un autre, que sa mise à jour attende sa CI ou que sa marque de passage vienne d'être posée.
test("boucle.sh : deux capitaines — une sous-PR en passage chez un autre capitaine tient son sujet devant une plus ancienne (marque de passage et CI en cours, marque seule, CI en cours seule, marque illisible), et devant celle que cette boucle tenait ; une marque expirée ne tient rien ; rien n'est écrit sur celle qui attend", () => {
  const d = sousPrDeSujets({ adv: [80, 81], verrou: [82, 83], doute: [84, 85], expire: [86, 87], ci: [88, 89] }, { retard: ["adv", "doute", "expire"] });
  // #81 : l'autre capitaine l'a mise à jour et attend sa CI, verrou posé. #83 : il vient de poser sa marque, rien n'est
  // poussé. #85 : une marque dont la date est illisible. #87 : la marque d'un capitaine mort, expirée. #89 : sa CI
  // tourne, sans marque (le passage de l'autre capitaine est sorti en 8, ou sa session vient de pousser).
  const marque = { commentaires: [marqueDe("capitaine-jordan")] };
  changerPr(d, 81, marque);
  checksDe(d, "IN_PROGRESS", 81, 89);
  changerPr(d, 83, marque);
  changerPr(d, 85, { commentaires: [{ body: marqueDe("capitaine-jordan"), created_at: "une date illisible" }] });
  changerPr(d, 87, { commentaires: [{ body: marqueDe("capitaine-mort"), created_at: "2020-01-01T00:00:00Z" }] });
  const depart = Object.fromEntries([80, 81, 82, 83, 84, 85, 87, 88, 89].map((n) => [n, teteDe(d, n)]));
  const marqueLue = (n, lue, sujet) => new RegExp(`^\\[#${n}\\] marque de passage d'un autre capitaine \\(${lue}\\) : elle tient sujet/${sujet}$`, "m");
  let r = tour(d);
  // `sujet/adv` : #81, marquée et « CI en cours », tient ; #80, plus ancienne, n'est pas mise à jour.
  assert.match(r.stdout, marqueLue(81, `capitaine-jordan ${DATE_DU_FAUX}`, "adv"));
  assert.match(r.stdout, attend(80, 81, "adv"));
  assert.match(r.stdout, tenu("adv", 81, "CI en cours"));
  // `sujet/verrou` : la marque de l'autre capitaine sur #83 est lue avant que #82 soit prise ; le passage de #83 sort en 7.
  assert.match(r.stdout, marqueLue(83, `capitaine-jordan ${DATE_DU_FAUX}`, "verrou"));
  assert.match(r.stdout, attend(82, 83, "verrou"));
  assert.match(r.stdout, tenu("verrou", 83, `sortie 7 de fusionner, verrou du ${DATE_DU_FAUX}`));
  // `sujet/doute` : marque illisible, dans le doute #85 tient ; son passage ne lit pas mieux le verrou (sortie 5).
  assert.match(r.stdout, marqueLue(85, "illisible", "doute"));
  assert.match(r.stdout, attend(84, 85, "doute"));
  assert.match(r.stdout, tenu("doute", 85, "sortie 5 de fusionner"));
  // `sujet/expire` : la marque expirée ne tient rien ; #86, la plus ancienne, prend le sujet (sa mise à jour).
  assert.doesNotMatch(r.stdout, /\[#87\] marque de passage/);
  assert.match(r.stdout, attend(87, 86, "expire"));
  // `sujet/ci` : sans marque, #89, « CI en cours », tient ; #88, à jour et verte, n'entre pas.
  assert.match(r.stdout, attend(88, 89, "ci"));
  assert.match(r.stdout, tenu("ci", 89, "CI en cours"));
  assert.deepEqual(poussees(r), [86], r.stdout);
  for (const n of [80, 81, 82, 83, 84, 85, 87, 88, 89]) assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`);
  for (const n of [80, 82, 84, 87, 88]) assert.deepEqual(ecritesSur(d, n), [], `rien d'écrit sur #${n}, pas même un verrou`);
  assert.deepEqual(fusionnees(d), []);
  // Tour 2, deux sujets gardés dans la file. `sujet/verrou` : l'autre capitaine a terminé son passage sur #83 sans la
  // faire entrer : #83, que cette boucle tenait, entre d'abord, et #82, la plus ancienne, est prise dans le même tour
  // (en retard depuis l'entrée de #83 : sa mise à jour). `sujet/expire` : cette boucle tenait #86 (sa mise à jour, sans
  // CI apparue) ; l'autre capitaine pose sa marque sur #87 : c'est #87 qui tient, et #86 attend.
  for (const n of [80, 81, 84, 85, 88, 89]) changerPr(d, n, { labels: [] });
  changerPr(d, 83, { commentaires: [`${marqueDe("capitaine-jordan")}\n<!-- capitaine:fin -->`], supprimes: [], editions: {} });
  changerPr(d, 87, marque);
  r = tour(d);
  assert.match(r.stdout, entree(83, "verrou"));
  assert.deepEqual(poussees(r), [82], r.stdout);
  assert.ok(r.stdout.indexOf("[#83] FUSIONNÉE") < r.stdout.indexOf("[#82] #82 en retard"), r.stdout);
  assert.match(r.stdout, marqueLue(87, `capitaine-jordan ${DATE_DU_FAUX}`, "expire"));
  assert.match(r.stdout, attend(86, 87, "expire"));
  assert.match(r.stdout, tenu("expire", 87, `sortie 7 de fusionner, verrou du ${DATE_DU_FAUX}`));
  assert.deepEqual(fusionnees(d), [83]);
});

// La veille du plugin lance la vraie boucle sur le dépôt jouet ; le `sleep` du jouet joue, à chaque pause de la veille
// (argument 7777), l'étape suivante : du JavaScript qui retouche `etat`, l'état du faux GitHub.
function veilleReelle(d, etapes, sondes) {
  const etat = JSON.stringify(join(d.racine, "faux-gh", "etat.json"));
  etapes.forEach((corps, k) => {
    if (corps) writeFileSync(join(d.racine, `etape.${k}.mjs`), `import { readFileSync, writeFileSync } from "node:fs";\nconst etat = JSON.parse(readFileSync(${etat}, "utf8"));\n${corps}\nwriteFileSync(${etat}, JSON.stringify(etat));\n`);
  });
  const k = JSON.stringify(join(d.racine, "k"));
  const etape = JSON.stringify(join(d.racine, "etape."));
  writeFileSync(join(d.racine, "bin", "sleep"), `#!/bin/sh\nif [ "$1" = 7777 ]; then k=$(cat ${k} 2>/dev/null || echo 0); echo $((k + 1)) > ${k}; [ ! -f ${etape}$k.mjs ] || node ${etape}$k.mjs; fi\nexit 0\n`);
  return spawnSync("bash", [VEILLE, "--pause", "7777", "--sondes", String(sondes)], { cwd: d.travail, env: d.env, encoding: "utf8" });
}

test("veille.sh et boucle.sh : le verrou d'un capitaine mort tient un sujet ; il expire sans que rien ne change dans la file, et la veille relance la boucle une fois : les sous-PR entrent ; une CI qui ne finit pas tient un sujet jusqu'au geste du capitaine, qui fait relancer la boucle", () => {
  const d = sousPrDeSujets({ lot: [80, 81], ci: [82, 83], seule: [84] });
  ci(d, "SUCCESS");
  // La marque du capitaine mort (sur #80, et sur #84, seule dans son sujet) date de plus de 95 minutes à l'horloge de
  // ce poste, celle de la veille ; le faux GitHub, dont les dates sont figées au 2026-11-17, la compte vivante tant que
  // l'étape ne l'a pas vieillie. La CI de #82 tourne et ne finit pas.
  const pose = new Date(Date.now() - 96 * 60_000).toISOString().replace(/\.\d+Z$/, "Z");
  for (const n of [80, 84]) changerPr(d, n, { commentaires: [{ body: marqueDe("capitaine-mort"), created_at: pose }] });
  checksDe(d, "IN_PROGRESS", 82);
  // Avant la sonde 2, GitHub compte les marques expirées à son tour (datées de 2020) : un passage les prendrait, la
  // file ne change pas. Avant la sonde 3, le capitaine retire `à-fusionner` de #82, dont la CI ne finit pas.
  const expire = 'for (const n of [80, 84]) etat.pulls.find((p) => p.number === n).commentaires[0].created_at = "2020-01-01T00:00:00Z";';
  const geste = "etat.pulls.find((p) => p.number === 82).labels = [];";
  const r = veilleReelle(d, [null, expire, geste], 5);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const relances = r.stdout.split("\n").filter((l) => /boucle relancée$/.test(l)).map((l) => l.replace(/^VEILLE \d\d:\d\d : /, ""));
  assert.deepEqual(relances, [
    "file à traiter (81 attend #80 (sujet/lot : prête),83 attend #82 (sujet/ci : CI en cours)), boucle relancée",
    "verrou d'un autre capitaine expiré (sa date a plus de 95 min), boucle relancée",
    "file à traiter (83 attend #82 (hors de la file)), boucle relancée",
  ], r.stdout);
  // Avant l'expiration, chaque tour laisse #80 et #84 tenir leur sujet (sortie 7) ; à la relance, elles entrent, et #81
  // avec #80. Tant que la CI de #82 tourne, la boucle le dit à chaque tour ; #82 sortie de la file, #83 entre.
  for (const [sujet, n] of [["lot", 80], ["seule", 84]])
    assert.equal((r.stdout.match(new RegExp(`^\\[sujet/${sujet}\\] tenu par #${n} \\(sortie 7 de fusionner, verrou du ${pose}\\)$`, "gm")) ?? []).length, 2, r.stdout);
  assert.equal((r.stdout.match(/^\[sujet\/ci\] tenu par #82 \(CI en cours\)$/gm) ?? []).length, 3, r.stdout);
  assert.deepEqual(fusionnees(d), [80, 81, 83, 84]);
});
````
