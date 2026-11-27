# Reprise : architecte A (le plugin), passation du 2026-11-27, changement de compte

Ce fichier suffit pour reprendre. Il remplace, pour l'état courant, [`2026-11-23-reprise-architecte-plugin.md`](2026-11-23-reprise-architecte-plugin.md). Restent vraies et à lire ensuite, dans [`2026-11-21-reprise-architecte-plugin.md`](2026-11-21-reprise-architecte-plugin.md), les sections « La méthode qui a payé » et « Règles de travail », et dans celui du 2026-11-23, les sections « Ce qu'on a appris » et « Règles de travail (rappel) ».

- **La carte** : [`../map.md`](../map.md), plus de 1 500 lignes. **Ne la lis jamais en entier**, seulement par `grep -n` puis `sed -n`. Son `## Journal` est en fin de fichier. L'entrée « Fin de l'essai réel du régime 8 » (2026-11-24, 02 h 55 UTC) donne le bilan de l'essai et la liste numérotée des constats : c'est la matière des tickets de suite.
- **Les décisions** : [`../relecture-independante.spec.md`](../relecture-independante.spec.md), à lire de la même façon. La dernière est `A-222` ; la prochaine est `A-223`.
- **La branche de documentation** : `claude-jfrt-fam/lucid-pasteur-q59f3p` de `MAJ-agency/skills`. Tout ce qui est écrit ici y est poussé. Crée ta branche de travail à partir d'elle (ton environnement t'en nommera une).
- **Le dernier ticket du programme** est le 92 (`issues/`) : le prochain est le 93.

## Pourquoi la passation

Le produit l'a demandée le 2026-11-27 : le travail reprend sur un autre compte. Rien n'est en vol : l'essai réel est fini, ses sessions sont archivées, aucun réveil de ce programme n'est armé.

## Reprendre sur un autre compte

Tu ne peux écrire à aucune session de l'ancien compte, et tu n'en as besoin d'aucune. Le prompt d'ouverture se tape dans une session sur le seul dépôt `MAJ-agency/skills`, en mode « Auto » :

```text
/maj-skills:architecte gouverner-nos-boucles
Tu reprends la partie A de ce programme : le plugin MAJ-agency/skills, chantier 3 « relecture indépendante ». L'essai réel du régime 8 est fini ; la suite est d'écrire et de livrer ses tickets de suite. Avant toute autre lecture, lis docs/issues/gouverner-nos-boucles/passation/2026-11-27-reprise-architecte-plugin.md, branche claude-jfrt-fam/lucid-pasteur-q59f3p. Ne lis jamais une carte en entier.
```

Les deux consignes du produit, à citer telles quelles dans le prompt de chaque session que tu lances :

- « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer »
- « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »

Et les deux intangibles, eux aussi tels quels :

- « Le dépôt est public : rien de privé, aucun nom de personne, aucun détail de projet client. »
- « Jamais de push sur main ; jamais de push forcé, d'--amend ni de --no-verify. »

**Le premier geste** : donne au produit l'identifiant de ta session (`get_session` sans argument), pour qu'il le transmette à l'architecte B d'Anchorpost et à l'architecte du programme « définitions d'agents » (ci-dessous).

## Ce qui est fait et vérifié à la source

| PR | Objet | Version | Commit sur `main` |
| --- | --- | --- | --- |
| 158 | ticket 92 : le skill `anchorpost` à `^2.0.3`, `floor.by` une clé de `roles` | 8.3.1 | `6c37fe3` |
| 159 | ticket 91 : un socle posé en chaîne seule passe son propre gate | 8.3.2 | `4403173` |
| 160 | le prompt de lancement sans commande en tête (`create_session` refuse un prompt qui commence par « / ») | 8.3.3 | `1fc5ef8` |

**L'essai réel du régime 8 est fini** (jouet `MAJ-agency/essai-relecture-8`, sujet `essai-regime-8`, 9 tickets, 18 PR) : chantier `fini` sur `develop` (`e0cea1c`), bilan au journal de la carte. Le produit a supprimé toutes les branches de travail du jouet : il ne reste que `develop` et `main`. Le plan d'essai reste sous [`../essai-regime-8/`](../essai-regime-8/) ; **il ne va jamais dans le jouet ni dans un prompt de relecture**.

**Depuis, `main` a bougé hors de ce programme** : PR 163 et 164 (8.4.0), du programme « définitions d'agents » (`docs/programmes/definitions-d-agents.programme.md` sur `main`). Les sous-agents de `relecture` et de `criticite` sont désormais lancés par leur nom, sur des définitions du dossier `agents/`, avec un repli. Ce programme a un ticket 2 ouvert (revues de ticket, revue adversariale, rôles) et touche les skills `relecture`, `criticite`, `revue-de-ticket`, `revue-adversariale`, `architecte` et `chantier`. **Avant d'écrire un ticket de la famille relecture ou chantier, lis sa carte et coordonne-toi avec son architecte** (par le produit), pour ne pas éditer les mêmes fichiers en même temps. Pars toujours du `main` du moment.

Les PR 44 et 56 de `skills` sont ouvertes et hors de ce programme : on n'y touche pas. Le capitaine de `skills` n'existe pas sur ton compte : relance-le à la première PR ordonnée (« Le capitaine d'un dépôt » de `skills/chaine/architecte/references/lancement.md`, procédure d'un dépôt sans la chaîne, sur Sonnet).

## Quoi faire, dans l'ordre

1. **Les tickets de suite de l'essai**, à écrire à partir des constats numérotés du bilan (journal, 2026-11-24, 02 h 55). Un tour de relecture par ticket (`P-65`), trois tickets au plus par PR, regroupés par famille de fichiers.
   - **Famille relecture** (`relecture`, `relecteur`, `meme-contenu.sh`, `decision-relecteur.mjs`), la plus urgente :
     - (5) le critère `C1` (`D4`) ne juge jamais un index généré dispensé par `meme-contenu.sh` : sur la PR 17 du jouet, c'était une impasse (le commit de régénération ne compte pas, la règle 4 maintient le refus, seul un arbitrage en sort) ;
     - (13) une note sur la PR quand `meme-contenu` garde un verdict ou un refus ;
     - (17) `--taire <PR>` levé quand sa cause disparaît ;
     - (1) une demande `À relire` modifiée écartée avec un destinataire, pas en silence ;
     - (2) `interrupt_session` n'arrête pas la veille du Relecteur ; (11) cadence de la passe ; (15) session de relecture réemployée d'un tour et d'un Relecteur à l'autre.
   - **Famille fusionner et sujet** :
     - (3) le verdict contrôlé avant l'attente de CI ;
     - (4) `renvoyer.sh` trouve l'auteur par les champs `Session:` et `Conducteur:` de la demande, pas par un worktree local ;
     - (10) `sujet-auto` ne rouvre pas un sujet livré ; (9) la place d'un ticket ajouté après la livraison ;
     - (14 bis) le journal du capitaine survit à un redémarrage du conteneur ;
     - (16) `sujet.sh clore` dit qu'une session cloud ne peut pas supprimer une branche distante (proxy, HTTP 403) et laisse le geste au poste local.
   - **Famille chantier** :
     - (6) le conducteur réveillé par les commentaires de PR ;
     - (8) la demande `À relire` fabriquée par un script (`git rev-parse HEAD`), jamais tapée ;
     - (12) une alerte au dépassement de `contextePilote` ;
     - (7) les messages de l'architecte en priorité `now` ; (14) vérifier qu'une fille est archivée avant de lui écrire, et le champ `Conducteur:` des demandes du conducteur lui-même.
   - **Les suites d'avant l'essai**, toujours ouvertes : la liste du point 3 de la passation du 2026-11-23, sauf le ticket 91 et `anchorpost` (faits). En particulier `criticite` (une règle portée par plusieurs specs longues dépasse le plafond : ne retenir de chaque spec que son en-tête et les sections qui citent la règle ; l'architecte B attend la réponse).
   - **Le ticket « prêt à être public »** : le dépôt porte encore des noms de projets clients, des trigrammes réels, des identifiants de session, des coûts et le nom du responsable, jusque dans la carte. Refais le relevé toi-même par `git grep -i` (le relevé de l'architecte B n'est pas versé ici, il est privé) et écris le ticket sans recopier aucun de ces noms.
2. **Les lots 8 et 9 de la spec, ensemble** (section « Les lots » de `relecture-independante.spec.md`). Le lot 9 attend le lot 7.
3. **Le lot 7** (la repose du régime 8 dans les projets, `A-99`) revient à leurs architectes : l'essai est fini, ils peuvent l'engager.
4. **Les notes encore sans ticket** : la carte de chantier trop lourde, la lecture des blobs par sha.

## Ce qu'on a appris pendant l'essai (à garder)

- **Un conducteur au plafond de contexte se relaie par un conducteur de suite** (décision du produit du 2026-11-23) : il écrit sa passation dans la carte du sujet, puis s'archive.
- **Un message à une session peut arriver après le geste qu'il annonce** : écris en priorité `now` quand l'ordre compte. Et abonne-toi toi-même aux PR dont tu attends un événement : le conducteur n'est pas réveillé par les commentaires.
- **Une PR bloquée sur un refus que rien ne lève** (même contenu, règle 4) : la sortie prévue est l'arbitrage `Arbitrage — … — écarté — …` du conducteur, puis une redemande ; la règle 4 distribue alors un tour non compté. Vérifie ensuite que le Relecteur n'a pas mis la PR en sourdine.
- **La CI du jouet dure 35 à 40 minutes** : une PR `à-fusionner` qui attend ce temps n'est pas bloquée.
- **Une session cloud ne supprime pas de branche distante** : le produit le fait d'un poste local.
- **Les lignes de situation de l'essai** sont restées privées jusqu'au bout : jamais dans le jouet, la carte, un ticket, une PR ou un prompt de relecture.
