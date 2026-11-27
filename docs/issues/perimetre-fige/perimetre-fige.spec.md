# PR de documentation à périmètre figé

Programme : [`../../programmes/perimetre-fige.programme.md`](../../programmes/perimetre-fige.programme.md). État : validée par le produit le 2026-11-27 (`P-2`, `P-3`).

## Le problème

En régime 8, une PR de documentation est relue par des sessions de relecture indépendantes. Au troisième tour refusé, elle atteint le plafond et attend une décision. Sur `MAJ-agency/atalian-offer-generator`, les PR de documentation #5 et #6 ont atteint ce plafond et ont été fusionnées à la main, sans verdict validé.

Les constats des relecteurs étaient fondés. La relecture ne convergeait pas parce que le contenu relu changeait d'un tour à l'autre, et parce que rien ne bornait ce qu'un tour pouvait relever.

## Faits établis

Lus le 2026-11-27 sur les commentaires des deux PR et dans les skills du plugin 8.4.0.

1. **La PR grossit entre deux tours.** La PR #5 passe de 86 fichiers au tour 1 à 94 au tour 3. Entre le tour 1 et le tour 2, l'auteur pousse 50 fichiers modifiés, dont quatre ADR et deux tickets absents du tour 1. La PR #6 passe de 15 à 20 fichiers.
2. **Une correction ouvre une nouvelle surface.** Sur la PR #6, annoncée comme la correction de 11 remarques : l'auteur ajoute au journal un fait nouveau, le SOW du client (P-55). Le tour 1 relève que ce fait contredit le registre des questions. L'auteur répond par une décision nouvelle (A-42). Le tour 2 exige l'ADR qui la porte. L'auteur écrit `ADR_ALL_ARC-13`. Le tour 3 relève huit bloquants : six viennent de cette ADR et de ce qu'elle touche, un seul porte sur l'une des 11 corrections annoncées.
3. **Un tour relit tout le diff, sans mémoire.** `relecture/SKILL.md` : « le diff entier, et pas seulement ce qui a changé ». Le tour 4 de la PR #5, joué sur un sommet inchangé depuis le tour 3, relève quatre bloquants nouveaux. Sur un diff de 4 000 lignes, chaque tour trouve des constats que le précédent n'avait pas vus.
4. **Les mêmes faux positifs reviennent.** Sur la PR #6, deux constats (`GLOSSARY.md:320` et le ticket `.14:77`) sont relevés par les sous-agents puis écartés au tri dans les six verdicts des trois tours. Ils n'ont jamais bloqué : ils ont coûté le travail du tri. Sur la PR #5, le vocabulaire général, écarté par un arbitrage du produit au tour 2, est relevé de nouveau aux tours 3 et 4, puis écarté au tri grâce à cet arbitrage, que la session de relecture lit déjà.
5. **Rien ne déclare un périmètre.** Aucun skill ne demande à une PR de dire ce qu'elle contient. Le critère `T6` (« rien dans le diff au-delà du ticket ») ne joue que pour une PR qui a un ticket et du code. L'auteur n'a qu'une consigne entre deux tours : « corriger chaque bloquant ou le contester ».
6. **Deux sessions relisent chaque tour et divergent.** Au tour 1 de la PR #5, l'une relève 44 bloquants, l'autre 21. Un seul verdict refusé suffit à refuser le tour.
7. **Le plafond d'une PR de l'architecte remonte au produit.** L'ADR de la relecture indépendante et `architecte/SKILL.md` § 5 l'écrivent ; `chantier/SKILL.md`, relu à la source, ne le porte pas. Le script qui lit la décision (`decision-relecteur.mjs`) accepte déjà un commentaire `Décision de plafond — …` de toute session. La PR #6 a été fusionnée sans ce commentaire.

## Ce qui change, vu par le produit

- **Périmètre déclaré.** L'auteur d'une PR de documentation écrit sur la PR, avant de demander la relecture, ce qu'elle contient : ses fichiers, ses décisions, ses sujets.
- **Périmètre tenu.** Entre deux tours, l'auteur ne pousse que les corrections des constats du verdict. Le Relecteur refuse de distribuer une PR qui sort de son périmètre, sans compter de tour.
- **Suites.** Un fait nouveau, une décision nouvelle ou une ADR part dans un ticket ou dans une autre PR. La PR courante le cite sur une ligne, sans l'intégrer.
- **Plafond.** Au plafond d'une de ses PR, l'architecte écrit la décision lui-même et en informe le produit en une ligne. Le produit ne fusionne plus à la main.
- **Tours 2 et 3 bornés** (`P-2`). Un constat nouveau sur un texte inchangé ne bloque plus : il est listé et part en suite.

## La règle

Une **PR de documentation** est une PR dont le diff ne contient aucun chemin qui exige la revue, au sens de `revue-exigee.mjs`. C'est la PR pour laquelle l'axe Ticket et son critère `T6` ne jouent pas.

1. **Déclaration.** Avant sa première demande de relecture, l'auteur écrit un commentaire dont la première ligne est `Périmètre — <objet en une ligne>`, suivie de trois lignes : `Fichiers:` (chemins ou dossiers), `Décisions:` (identifiants des décisions et des ADR que la PR écrit, ou « aucune ») et `Sujets:`. Seul le premier commentaire de cette forme compte, et il n'est jamais modifié. Au tour 1, tout fichier du diff est couvert par la ligne `Fichiers:`.
2. **Corrections.** Entre deux tours, les fichiers que l'auteur modifie sont ceux de la ligne `Fichiers:` et ceux que nomme un bloquant du dernier verdict refusé. Dans ces fichiers, il ne corrige que les constats de ce verdict. Il peut aussi clarifier un passage que le verdict nomme sous « Écartés au tri » avec le motif « faux », sans en changer le sens : par exemple citer la règle qui justifie une définition, ou écrire le résultat attendu d'une commande de preuve.
3. **Contenu.** Les axes de documentation reçoivent la déclaration, comme ils reçoivent déjà la section `## Criticité`. Un critère nouveau s'ajoute à chacun : une décision, un fait ou une ADR que la déclaration ne nomme pas est un bloquant. Sa correction est le retrait, jamais l'ajout de ce qui manque autour.
4. **Suite.** Ce qui est retiré, ou ce qu'un constat révèle hors du périmètre, s'écrit dans un ticket ou dans une autre PR. L'auteur le cite sur la PR courante par un commentaire `Suite — <objet> — <ticket ou PR>`. La session de relecture lit ces commentaires, comme elle lit déjà les arbitrages. Au tri, elle classe « renvoyé en suite » un bloquant qui remplit deux conditions : le lever demande une décision, un fait ou un fichier hors du périmètre déclaré, et un commentaire `Suite` nomme un ticket ou une PR qui existe. Un bloquant qui porte sur le périmètre déclaré n'est jamais renvoyé en suite.
5. **Tours 2 et 3** (`P-2`). Un bloquant n'est admis que s'il porte sur une ligne modifiée depuis le sommet du tour précédent, ou s'il reprend un bloquant non levé du verdict précédent. Tout autre constat est ramené à un doute, listé dans le verdict sous « Relevés tardifs ». Exception : un constat de l'axe Règles métier sur une règle de criticité haute bloque à tout tour.
6. **Plafond.** Au plafond d'une PR dont il est l'auteur, l'architecte écrit `Décision de plafond — …`. Elle dit, bloquant par bloquant, ce qui est corrigé dans la PR, ce qui part en suite (avec son commentaire `Suite`) et ce qui est écarté (`Arbitrage — … — écarté — <raison>`). Il en informe le produit en une ligne. Un bloquant sur une règle de criticité haute reste décidé par le produit. Rien ne change pour la PR d'une fille ou d'un conducteur, ni pour l'arbitrage d'une contestation.

## Décisions de conception (architecte)

- **A-1 — La déclaration est un commentaire, pas une section du corps de la PR.** Raison : la chaîne ne retient déjà que les commentaires non modifiés d'un compte de confiance (`verdict.mjs`, `retenir`) ; le corps d'une PR se modifie sans trace.
- **A-2 — Le contrôle des fichiers est fait par le Relecteur, avant la distribution.** `relecteur.mjs` connaît déjà le sommet de chaque tour et la tête. S'il manque la déclaration, ou si un fichier sort du périmètre, il écrit `Périmètre absent` ou `Périmètre dépassé — <fichiers>`, pose `à-reprendre` et ne lance aucune session. Raison : le contrôle est mécanique, il ne coûte aucune session de relecture et ne consomme aucun tour.
- **A-3 — Le contrôle du contenu est un critère des axes de documentation.** Raison : une décision nouvelle peut entrer dans un fichier déjà déclaré (sur la PR #6, P-55 et A-42 entrent dans la carte du programme) ; seul un lecteur le voit.
- **A-4 — Une suite ne lève un bloquant qu'au tri de la session de relecture, jamais par la seule parole de l'auteur.** Raison : l'auteur ne juge pas ses propres bloquants. La session vérifie que le ticket ou la PR nommé existe.
- **A-5 — L'architecte décide au plafond de sa propre PR** (`P-1`). L'ADR de la relecture indépendante et `architecte/SKILL.md` § 5 sont amendés ; `chantier/SKILL.md`, relu à la source, ne porte pas l'ancienne règle et reste inchangé. « L'arbitre n'est jamais l'auteur » reste vrai pour une contestation. Raison : au plafond, la décision est un découpage (ce qui entre, ce qui part en suite), que l'architecte a le droit de faire ; la demander au produit est une demande d'autorisation.
- **A-6 — Les constats « écartés au tri » ne sont pas transmis au tour suivant** (`P-3`). Raison : voir « Questions au produit ».
- **A-9 — Un constat faux qui revient se traite dans le texte relu, pas dans la mémoire des relecteurs.** La règle 2 autorise l'auteur à clarifier un passage écarté au tri comme « faux ». Raison : six sessions neuves ont fait la même mauvaise lecture des deux mêmes passages de la PR #6 (fait 4) ; l'erreur vient du texte, et le clarifier sert tous les lecteurs suivants sans toucher à l'indépendance de la relecture.
- **A-10 — Les fichiers nommés par un bloquant sont tous les chemins que sa ligne du verdict cite, dans la colonne « Fichier et ligne » comme dans le texte du constat.** Raison : un bloquant nomme le lieu de l'écart, et sa correction est parfois ailleurs ; un terme sans entrée au glossaire se corrige dans le glossaire, que le constat cite.
- **A-11 — Une PR de documentation se reconnaît par `revue-exigee.mjs` seul**, pour le Relecteur comme pour la session de relecture. Raison : `gestes.sh axes` compte aussi comme code tout fichier qui n'est pas en Markdown ; deux définitions donneraient deux réponses pour une même PR.
- **A-12 — L'axe Tickets reçoit la déclaration de périmètre, bien qu'il ne reçoive pas la section `## Criticité`.** Raison : la règle 3 vaut pour les trois axes de documentation.
- **A-13 — Le ticket 2 écrit les règles 1, 2 et 3 et la partie auteur de la règle 4 dans `chaine-de-production.md` § 5, mot pour mot, avec leur numéro.** De la règle 3, la phrase « une décision, un fait ou une ADR que la déclaration ne nomme pas est un bloquant. Sa correction est le retrait, jamais l'ajout de ce qui manque autour. » ; de la règle 4, ses deux premières phrases. Raison : la session qui livre ne lit que `chaine-de-production.md` § 5 ; les critères `D9`, `K7` et `M5` du ticket 3 citent ce texte comme leur règle écrite.
- **A-14 — Chaque ticket monte la version mineure suivante de celle de `main` au moment de sa livraison.** 8.6.0, 8.7.0 et 8.8.0 sont les valeurs attendues si aucune autre PR n'est fusionnée avant. Raison : plusieurs programmes livrent dans `skills` en même temps et aucun ne réserve de numéro ; l'architecte du programme voisin l'a écrit le 2026-11-27.
- **A-7 — Pas de conducteur ni de sujet : des tickets hors chantier, en série, lancés par l'architecte.** Raison : le dépôt `skills` n'a pas la chaîne, et les tickets touchent les mêmes fichiers de version.
- **A-8 — Les tickets partent de `main` après la fusion du ticket 2 du programme « définitions d'agents ».** Raison : ce ticket modifie `architecte/SKILL.md` § 5, `plugin.json`, `NOTES-DE-VERSION.md` et `scripts/depot.test.mjs`, que ce programme modifie aussi.

## Articulation avec le programme « définitions d'agents »

Ce programme-là fixe **qui relit** : un sous-agent défini, en lecture seule, sur un modèle fixé, sans les consignes du projet dans son contexte. Deux relecteurs du même diff rendent des verdicts plus proches. Ce programme-ci fixe **ce qui est relu** : un contenu déclaré, qui ne change pas d'un tour à l'autre hors des corrections demandées. Les deux réduisent la non-convergence, par deux causes différentes. Ce programme ne modifie ni le dossier `agents/`, ni le lancement d'un axe par son nom, ni le repli. Il ajoute une entrée aux axes de documentation (la déclaration), dans les prompts que le ticket 1 de l'autre programme a déjà modifiés et que son ticket 2 ne touche pas.

## Vérification

- **Bancs** (`pnpm test`). Les formes `Périmètre — `, `Périmètre absent`, `Périmètre dépassé — ` et `Suite — ` sont lues par `decision-relecteur.mjs` et couvertes par ses tests. Un cas de test rejoue la chronologie de la PR #6 : déclaration des 11 corrections, puis un commit qui ajoute un fichier d'ADR ; le Relecteur ne distribue pas le tour. Les textes des skills que la règle change sont figés dans les bancs existants (`scripts/relecture.test.mjs`, `scripts/depot.test.mjs`).
- **Essai réel**, sur `MAJ-agency/essai-relecture-8`. Une PR de documentation déclare son périmètre. Au tour 1, un bloquant est relevé. L'auteur pousse la correction et, avec elle, une décision hors périmètre. Attendu : le Relecteur ou le critère de périmètre l'arrête. L'auteur retire la décision et écrit la suite. Attendu : un verdict validé avant le plafond. Les commentaires de la PR d'essai font preuve.
- **Cette PR.** La PR qui porte cette spec déclare son périmètre dans son corps et ne reçoit que la carte, la spec et les tickets de ce programme. Le dépôt `skills` n'est pas en régime 8 : la déclaration y est tenue par l'architecte, sans Relecteur.

## Les tickets, dans l'ordre

Relus par un agent neuf avant leur lancement.

| Ticket | Objet | Dépôt | Modèle |
| ------ | ----- | ----- | ------ |
| 1 | La décision de plafond de l'architecte sur sa propre PR (règle 6) : ADR, `architecte`, glossaire | `skills` | sonnet |
| 2 | La déclaration et le contrôle des fichiers par le Relecteur (règles 1 et 2) : scripts, bancs, `chaine-de-production.md`, glossaire | `skills` | opus |
| 3 | Le critère de périmètre, la suite et les tours 2 et 3 (règles 3, 4 et 5) : `relecture`, ses prompts, son verdict, ses bancs | `skills` | opus |
| 4 | L'essai réel | `essai-relecture-8` | sonnet |

## Questions au produit

Les deux questions sont tranchées le 2026-11-27, dans le sens des recommandations : `P-2` pour `Q-1`, `P-3` pour `Q-2`.

- **`Q-1` — Aux tours 2 et 3, un constat nouveau sur un texte inchangé cesse-t-il de bloquer ?** Recommandation : oui (règle 5). Avantage : la relecture se termine, parce que chaque tour ne juge plus que les corrections. Risque : un défaut que le tour 1 n'a pas vu entre dans le dépôt ; il reste écrit dans le verdict, et les règles de criticité haute gardent leur blocage. Si non : le périmètre déclaré réduit le problème sans le fermer (fait 3 : quatre bloquants nouveaux sur un sommet inchangé).
- **`Q-2` — Les constats « écartés au tri » sont-ils transmis au tour suivant ?** Recommandation : non. Ces constats n'ont jamais bloqué une PR : ils coûtent le travail du tri (fait 4). Les transmettre aux sous-agents leur dirait quoi ne pas relever, et un écart décidé à tort au tour 1 ne serait plus jamais revu : la relecture perdrait son indépendance. Les transmettre à la seule étape du tri économise peu et ancre la session sur le jugement précédent. Avec la règle 5, un faux positif sur un texte inchangé ne peut plus bloquer. Ce qui doit se transmettre l'est déjà : les arbitrages, et désormais les suites.

## Hors périmètre

- Les définitions d'agents, leur lancement par nom et leur repli (programme « définitions d'agents »).
- Le nombre de sessions par tour et la règle « un seul verdict refusé suffit » (fait 6).
- Les PR de code : leur périmètre est déjà tenu par le ticket (`T4`, `T6`).
- Le plafond de trois tours lui-même.
