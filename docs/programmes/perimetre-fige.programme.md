# PR de documentation à périmètre figé — carte du programme

Une PR de documentation déclare son périmètre à l'ouverture et le garde jusqu'à sa fusion : sa relecture indépendante converge avant le plafond. Cette carte est la mémoire durable de l'architecte : une session cloud repart d'un conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la source, et reprend à la phase écrite sans reposer une question tranchée.

## Fiche

Phase: suivi — tickets 1 et 2 fusionnés (#172, #173) ; ticket 3 au plafond des renvois (#175), décision du produit attendue ; ticket 4 attend l'accord du produit
Responsable: Guillaume Jauffret
Architecte: session_012xRpgZFExW5jmAkFg9zCdF (session de suite, ouverte par le produit le 2026-11-27, mode « Auto », dépôts `skills`, `anchorpost`, `fedora` ; `essai-relecture-8` à ajouter pour le ticket 4) ; précédente : session_01BxuG31gJXv41A7jRRFEAWi
Objectif: une règle du régime 8, écrite dans les skills et vérifiée par des bancs et par un essai réel — périmètre déclaré, corrections limitées aux constats du verdict, fait nouveau renvoyé en suite, décision de plafond écrite par l'architecte.
Dépôts: `MAJ-agency/skills` (skills `relecture`, `relecteur`, `fusionner`, `architecte`, `chantier`, `socle-chaine-de-production`, glossaire `CONTEXT.md`) ; `MAJ-agency/essai-relecture-8` (l'essai réel) ; les projets reçoivent la règle par la mise à jour du plugin et la repose des scripts.
Source: le prompt d'ouverture de cette session (2026-11-27), résumé dans `## Source` — entrée brute, ni spec ni décision.
Capitaines: `skills` : session_012xRpgZn85fsbtT8FpRj93L (lancé par le programme « définitions d'agents », procédure d'un dépôt sans la chaîne, file au label)
Relecteurs: `skills` : absent (dépôt sans la chaîne)

## Chantiers

| n°  | Chantier | Dépôt | Spec | Carte | Conducteur | État |
| --- | -------- | ----- | ---- | ----- | ---------- | ---- |
| 1   | Périmètre figé | `skills`, puis `essai-relecture-8` pour l'essai | [`perimetre-fige.spec.md`](../issues/perimetre-fige/perimetre-fige.spec.md) | sans carte de chantier (A-7) | l'architecte (A-7) | spec validée le 2026-11-27 ; PR #165 fusionnée le 2026-11-27 ; ticket 1 fusionné (#172, 8.6.0) ; tickets 1 et 2 fusionnés (#172 8.6.0, #173 8.8.0) ; ticket 3 livré, PR #175, au plafond de trois renvois (décision du produit attendue) |

## Decisions-so-far

Décisions du produit :

- P-1 — (2026-11-27, prompt d'ouverture) Les quatre premiers points de l'objectif sont demandés : périmètre déclaré à l'ouverture, corrections limitées aux constats du verdict, fait nouveau renvoyé à une autre PR ou à un ticket, et, au plafond d'une PR de l'architecte, décision de plafond écrite par l'architecte lui-même. Ses mots : « il en a le droit ».
- P-2 — (2026-11-27) `Q-1` : aux tours 2 et 3 d'une PR de documentation, un constat nouveau sur un texte que l'auteur n'a pas touché ne bloque plus (spec, règle 5). Sa réponse à « doit-il encore bloquer la PR ? » : « ok non ».
- P-3 — (2026-11-27) `Q-2` : les constats « écartés au tri » ne sont pas transmis au tour suivant ; un constat faux qui revient se traite en clarifiant le texte (A-9). Le produit a lu cette conclusion et n'a rien objecté ; sa réponse « ok non » la couvre.

Décisions de l'architecte : A-1 à A-19, écrites avec leur raison dans la spec (`## Décisions de conception`) ; A-16 à A-19, prises après la fusion de la spec, y sont reportées par cette branche :

- A-16 — (2026-11-27) L'entrée `**Suite**:` du glossaire (`CONTEXT.md`, § « Relecture indépendante ») est écrite par le ticket 3, qui porte le tri « renvoyé en suite » ; elle se donne dans la ligne de situation de son prompt. Raison : la revue de ticket du ticket 1 a relevé que la marque `Suite — <objet> — <ticket ou PR>` n'a pas d'entrée au glossaire ; le ticket 2 n'ajoute que « PR de documentation » et « Périmètre ».
- A-17 — (2026-11-27) Le ticket 2 part de `main` après la fusion de la PR #170 du programme « gouverner nos boucles », relue à la source. Ordre d'entrée convenu : #169, #172, #170, #171. Raison : #170 modifie en profondeur `decision-relecteur.mjs`, `relecteur.mjs`, `relecteur/SKILL.md`, les deux `CONTENU.md`, l'étape 5 de `chaine-de-production.md` et `scripts/relecteur.test.mjs`, que le ticket 2 touche ; partir après elle évite de les recouper.
- A-18 — (2026-11-28) L'ADR de la relecture indépendante (point 2) est amendée d'une phrase par le ticket 3, donnée dans la ligne de situation de son prompt : le Relecteur pose aussi `à-reprendre` sur un périmètre absent ou dépassé, sans session de relecture (A-2). Raison : la session du ticket 2 l'a relevé ; l'ADR n'est pas dans le périmètre du ticket 2.
- A-19 — (2026-11-28) Les tickets 2 et 3 montent la version mineure, non la majeure. Raison : comme pour 8.4.0 à 8.7.0, un projet qui ne repose pas ses scripts ne voit rien changer, et un projet qui les repose le fait par une PR qu'il relit.

## Fog

- _(tranché, P-2)_ `Q-1` — Aux tours 2 et 3 d'une PR de documentation, un constat nouveau sur un texte inchangé depuis le tour précédent cesse-t-il de bloquer ? Recommandation : oui. Posée au produit le 2026-11-27.
- _(tranché, P-3)_ `Q-2` — Les constats « écartés au tri » sont-ils transmis au tour suivant ? Recommandation : non. Posée au produit le 2026-11-27.
- Deux sessions relisent un même tour et un seul verdict refusé suffit à refuser le tour ; leurs verdicts divergent en nombre et en gravité (spec, « Faits établis », fait 6). Hors de ce programme : à reprendre si la non-convergence persiste après la règle.
- La PR `atalian-offer-generator#6` a été fusionnée le 2026-11-27 sans commentaire `Décision de plafond`. Rien à faire ici : c'est le fait que la règle A-5 évite.

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |
| architecte | — | session_01BxuG31gJXv41A7jRRFEAWi | — | — | — |
| architecte (suite) | — | session_012xRpgZFExW5jmAkFg9zCdF | opus | — | — |
| ticket 1 (archivée) | 1 | session_012xRpga5RtL9vtvNsYUD6Np | sonnet | 149 k | 2,12 |
| ticket 2 (archivée) | 2 | session_012xRpgavCXiUbFQrAWtdNLG | opus | 405 k | 15,91 |
| ticket 3 | 3 | session_012xRpgYw3Ki5Zn9ykjuB7kr | opus | — | — |
| capitaine `skills` (doublon, archivé) | — | session_012xRpgZd6cEEptHdS4amcfr | sonnet | 112 k | 0,47 |

## Passation

Écrite le 2026-11-27, le produit ayant demandé un prompt pour qu'un autre architecte reprenne.

- **Où en est le chantier.** La spec est validée par le produit (`P-1` à `P-3`). La carte et la spec sont dans la PR brouillon `MAJ-agency/skills#165` (branche `claude-jfrt-fam/great-lovelace-pwm6uo`, à jour avec `main` en 8.5.0). Aucun fichier de skill n'est modifié.
- **Tickets.** Les quatre tickets sont écrits par un sous-agent et commités sous `docs/issues/perimetre-fige/issues/` (versions 8.6.0, 8.7.0, 8.8.0, puis l'essai). Ils ne sont pas relus : un agent neuf les relit avant tout lancement, et vérifie qu'ils portent A-10, A-11 et A-12, écrites après eux. Le rapport du sous-agent est résumé au journal.
- **Suite, dans l'ordre.** Tickets relus par un agent neuf et corrigés ; PR #165 sortie du brouillon, sans sortir de son périmètre déclaré (carte, spec, tickets) ; commentaire `à-fusionner au sommet <sha>` puis label `à-fusionner` ; un capitaine lancé pour `skills` (procédure d'un dépôt sans la chaîne, `architecte/references/lancement.md`) ; ticket 1 lancé depuis `main`, puis les tickets 2 et 3 en série ; ticket 4 sur `essai-relecture-8`.
- **Ce qui attend le produit.** Rien aujourd'hui. Avant le ticket 4 : l'accord du produit sur la repose des scripts dans `essai-relecture-8`, qui touche un chemin sensible (`scripts/chaine/**`).
- **Sessions en vie.** Aucune session lancée par cet architecte, aucun réveil programmé, aucun suivi de PR.
- **À transmettre au programme Atalian.** Deux passages de `atalian-offer-generator` provoquent un constat faux à chaque tour (`GLOSSARY.md:320`, ticket `.14:77`) : journal du 2026-11-27, A-9.
- **Environnement de la session de suite.** Ouverte par le produit, en « Auto », sur `MAJ-agency/skills` ; `MAJ-agency/essai-relecture-8` pour le ticket 4.

## Journal

- 2026-11-27 — Programme ouvert par le produit. Plugin chargé 8.4.0, marketplace 8.4.0. Relevés faits par deux sous-agents : les commentaires des PR `atalian-offer-generator#5` et `#6`, et le texte actuel des skills du régime 8. L'architecte du programme « définitions d'agents » (session_01BxuG2z7ypDYopx6aF3M1sd) a été prévenu avant tout fichier de skill : son ticket 2 ne touche ni `relecture/`, ni `relecteur/`, ni `chaine-de-production.md` ; il touche `architecte/SKILL.md` § 5, les fichiers de version et `scripts/depot.test.mjs`. Accord : les tickets de ce programme partent de `main` après la fusion de son ticket 2. Spec écrite ; `Q-1` et `Q-2` posées au produit. Alerte d'usage déjà notée par l'autre carte : limite hebdomadaire du compte, levée le 2026-11-29 à 19 h UTC.
- 2026-11-27 20 h 47 UTC — PR brouillon #165 ouverte, périmètre déclaré dans son corps ; quatre contrôles verts. Le ticket 2 du programme « définitions d'agents » est livré (PR #166, 8.5.0), pas encore fusionné. Le produit demande s'il peut archiver la session : passation écrite, rappel programmé supprimé.
- 2026-11-27 21 h 10 UTC — L'architecte du programme « définitions d'agents » écrit que la PR #166 est fusionnée sur `main` (plugin 8.5.0) : les tickets de ce programme peuvent partir de `main`, en 8.6.0. Son programme passe à un architecte d'un autre compte, qui ne peut pas écrire à cette session, et son capitaine est archivé : ce programme lance son propre capitaine pour `skills` à la première PR prête.
- 2026-11-27 — A-9 ajoutée à la spec après un échange avec le produit sur les deux constats faux répétés de la PR #6 : l'auteur peut clarifier un passage écarté au tri comme « faux ». Les deux passages eux-mêmes sont dans `atalian-offer-generator` (`GLOSSARY.md:320`, ticket `.14:77`) : leur correction revient au programme Atalian, cette session n'y écrit pas.
- 2026-11-27 — Le produit tranche `Q-1` et `Q-2` (`P-2`, `P-3`) : spec validée. Le produit n'a pas archivé la session : la passation ci-dessus reste écrite, l'architecte continue. Tickets confiés à un sous-agent.
- 2026-11-27 — Quatre tickets écrits par un sous-agent, commités, non relus. Son rapport : versions mineures 8.6.0, 8.7.0, 8.8.0 (le README dit « majeure quand un skill existant change de contrat » : l'usage des notes 8.4.0 et 8.5.0 est la mineure, retenue) ; `chantier/SKILL.md` ne porte pas l'ancienne règle du plafond (A-5 corrigée) ; un bloquant nomme le lieu de l'écart et non celui de la correction (A-10) ; deux lectures de « PR de documentation » (A-11) ; l'axe Tickets ne reçoit pas la criticité (A-12) ; le critère `D9` casse un banc d'égalité avec le régime 7, que le ticket 3 borne à `D1`–`D8` ; `relecteur/SKILL.md` dit que le Relecteur ne lit pas le corps d'un verdict, alors que le script le lira pour lui (ticket 2). Avant le ticket 4 : accord du produit sur le chemin sensible, Relecteur et capitaine à lancer sur `essai-relecture-8` ; le « relevé tardif » ne se provoque pas à coup sûr, le ticket 4 traite les trois issues.
- 2026-11-27 21 h 40 UTC — Session de suite ouverte par le produit (session_012xRpgZFExW5jmAkFg9zCdF), sans message de la précédente. Plugin chargé 8.4.0, marketplace 8.5.0 : le fichier du marketplace fait foi. Branche remise à jour avec `main` (#167). Suite de la passation : relecture des quatre tickets par un agent neuf.
- 2026-11-27 21 h 42 UTC — Capitaine de `skills` lancé (session_012xRpgZd6cEEptHdS4amcfr), procédure d'un dépôt sans la chaîne, entière dans son prompt. Relecture des quatre tickets en cours par un agent neuf.
- 2026-11-27 21 h 45 UTC — L'architecte de « définitions d'agents » (reprise : session_012xRpgXxfn5diB9dcvjpSes) signale un capitaine de `skills` déjà en vie (session_012xRpgZn85fsbtT8FpRj93L), vérifié par `get_session`. Le capitaine lancé ici, en double, est archivé, son réveil supprimé d'abord. Point de contact du ticket 3 : garder verts `scripts/agents.test.mjs` et les passages recopiés de `scripts/depot.test.mjs` ; aucun numéro de version réservé, la première PR livrée prend la suivante de `main`.
- 2026-11-27 22 h UTC — Première relecture des tickets par un agent neuf : 10 bloquants (A-10, A-11, A-12 non portés ; paraphrases de la spec ; partie auteur des règles 3 et 4 portée par aucun ticket ; surfaces sans preuve) et 5 doutes, tranchés par l'architecte : A-13 (les règles 1 à 4, côté auteur, mot pour mot dans `chaine-de-production.md` § 5, par le ticket 2) et A-14 (version : la mineure suivante de `main` à la livraison) ; fait 7 de la spec accordé à A-5. Corrections faites par un sous-agent (`13098d9`), puis seconde relecture du diff entier par un agent neuf.
- 2026-11-27 22 h 20 UTC — Seconde relecture par un agent neuf : 6 bloquants de forme (contradictions internes, preuves qui n'exercent pas la surface) et 7 doutes, tranchés par l'architecte ; corrigés par un sous-agent (`361c3f2`). Défaut prudent du ticket 3 accepté : « le tour précédent » est le dernier tour `refuse` avec `nonCompte: false`, et non `compte`, qui écarterait les tours d'avant une décision de plafond. A-15 : pas de troisième relecture ; un écart restant se tranche par la session du ticket.
- 2026-11-27 22 h 25 UTC — PR #165 sortie du brouillon, corps mis à jour (périmètre : `P-1` à `P-3`, `A-1` à `A-15`, complété avant toute relecture), ordre `à-fusionner au sommet 36bfd22…` et label. CI verte ; `main` avancé en 8.5.1 (#168) : `main` fusionné dans la branche, ordre reposé au sommet `7203bdf…`. `pnpm test` local : 2 échecs de `tests-creux` posé, faute de `node_modules` dans la session ; `bancs` vert en CI.
- 2026-11-27 22 h 41 UTC — PR #165 fusionnée par le capitaine (`78f6f85`) ; diff fusionné relu à la source : les six fichiers du périmètre, identiques au sommet ordonné.
- 2026-11-27 22 h 57 UTC — Session du ticket 1 lancée depuis `main` (session_012xRpga5RtL9vtvNsYUD6Np, sonnet). La carte se tient désormais sur la branche `claude/clever-babbage-p00ozi`.
- 2026-11-27 23 h 33 UTC — Ticket 1 livré : PR #172 (8.6.0), ordre et label posés par la session ; diff lu à la source par l'architecte, dans le périmètre du ticket (ADR, `architecte` § 5, tableau des rôles, glossaire en renvoi, banc, version). Deux doutes de sa revue tranchés : `Arbitrage — … — écarté` au plafond maintenu (règle 6, P-1, A-5) ; entrée `Suite` du glossaire renvoyée au ticket 3 (A-16). Deux échecs locaux de `references-posees` (faute de `node_modules`) déjà vus sur `main`.
- 2026-11-27 23 h 45 UTC — Coordination avec l'architecte de « gouverner nos boucles » (session_012xRpgZdqkCb5i5yCUrnRSt), qui partage le capitaine : file au premier entré, le second fusionne `main` et reprend la version suivante. Ses tickets qui touchent `architecte/SKILL.md`, `chantier/SKILL.md`, `chaine-de-production.md` et `scripts/bascule.test.mjs` partent de `main` après la fusion du ticket 2 ; je le lui écris à cette fusion, lue à la source.
- 2026-11-27 23 h 45 UTC — A-17 convenue avec l'architecte de « gouverner nos boucles » : le ticket 2 attend la fusion de #170.
- 2026-11-28 00 h 16 UTC — PR #172 fusionnée par le capitaine le 2026-11-27 à 23 h 54 UTC (`7e63b12`, 8.6.0) ; arbre fusionné identique au sommet ordonné `78a4f81`, lu à la source. Session du ticket 1 archivée (finie, aucun réveil en attente ; 2,12 $). Le ticket 2 attend la fusion de #170 (A-17).
- 2026-11-28 01 h 41 UTC — #169 (8.6.1) et #170 (8.7.0, `6f05d71`) fusionnées, lues sur `main` ; l'architecte de « gouverner nos boucles » l'a écrit. Ticket 2 lancé depuis `main` (session_012xRpgavCXiUbFQrAWtdNLG, opus) : repères à relire à la source après #170, version 8.8.0 attendue (A-14), entrée `Suite` laissée au ticket 3 (A-16).
- 2026-11-28 02 h 40 UTC — Ticket 2 livré : PR #173 (8.8.0 ; `main` passé en 8.7.1 par #171, fusionné par la session), ordre au sommet `344a7db`. Fichiers lus à la source : tous dans `Fichiers chauds:` du ticket, hors le ticket lui-même. Deux questions tranchées : A-18 (ADR point 2 au ticket 3), A-19 (mineure). Neuf choix par défaut prudent notés sous `## Comments` du ticket.
- 2026-11-28 03 h 12 UTC — PR #173 fusionnée par le capitaine à 02 h 51 UTC (`2436313`, 8.8.0) ; arbre identique au sommet ordonné `344a7db`, lu à la source. Session du ticket 2 archivée (finie, aucun réveil ; 15,91 $). Fusion écrite à l'architecte de « gouverner nos boucles ». Ticket 3 lancé depuis `main` (session_012xRpgYw3Ki5Zn9ykjuB7kr, opus), avec A-16 et A-18 dans sa ligne de situation, 8.9.0 attendue.
- 2026-11-28 03 h 42 UTC — Ticket 3 livré : PR #175 (8.9.0), ordre au sommet `1b5d188`. Fichiers lus à la source : ceux du ticket, plus `CONTEXT.md` (A-16), l'ADR de la relecture indépendante et son banc `scripts/bascule.test.mjs` (A-18). Question de sa revue (D6) : A-16 à A-19 reportées dans la spec par cette branche.
- 2026-11-28 03 h 45 UTC — Question posée au produit : l'accord sur `scripts/chaine/**` d'`essai-relecture-8`, pour le ticket 4.
- 2026-11-28 04 h 13 UTC — PR #175 renvoyée par le capitaine à 04 h 07 UTC : conflit avec `main` après la #174 (8.8.1, « gouverner nos boucles »). Session du ticket 3 prévenue : fusion de `main` par commit de merge, version suivante, ordre reposé. Accord du produit pour le ticket 4 toujours attendu.
- 2026-11-28 04 h 30 UTC — #175 reprise par sa session au sommet `7d6b49a` (main fusionné, 8.9.0), lue à la source : mêmes 19 fichiers, seule la note de version change.
- 2026-11-28 04 h 47 UTC — La #176 (« gouverner nos boucles ») entre à `c15f90a` et prend 8.9.0 : la session du ticket 3 est priée de fusionner `main` sans attendre le renvoi et de prendre 8.10.0. Recoupement dit à l'autre architecte : `scripts/bascule.test.mjs` seul (une assertion, A-18) avec son ticket 104.
- 2026-11-28 05 h 11 UTC — PR #175 au plafond de trois renvois du capitaine (signalé par l'architecte de « définitions d'agents », relu à la source) : un conflit après #174, puis deux « le sommet a bougé », parce que les ordres de 04 h 30 et 05 h 05 de la session ajoutaient un paragraphe après la ligne `à-fusionner au sommet <sha>`. Au sommet `f709ea1` : 4 contrôles verts, aucun verdict. Question posée au produit (nouvelle PR, recommandée, ou fusion à la main). Fait à reprendre dans le skill : le prompt d'une session de ticket dit la forme exacte de l'ordre, mais une session l'a enrichie ; un banc ou un message de refus plus explicite l'éviterait.

## Source

Prompt d'ouverture du 2026-11-27 (résumé). Constat, sur `MAJ-agency/atalian-offer-generator`, régime 8 : les PR de documentation #5 et #6 ont atteint le plafond de trois tours refusés et ont été fusionnées à la main ; la relecture ne convergeait pas parce que la PR grossissait en cours de route ; deux faux positifs identiques revenaient à chaque tour. Objectif en cinq points : (1) périmètre déclaré à l'ouverture (fichiers, décisions, sujets) ; (2) entre deux tours, la session ne corrige que les constats du verdict ; (3) un fait nouveau, une décision nouvelle ou une ADR qu'un constat révèle part dans une autre PR ou un ticket, cité en suite ; (4) au plafond, l'architecte écrit la décision de plafond lui-même ; (5) à étudier : transmettre ou non les constats « écartés au tri ». Hors périmètre : les définitions d'agents, programme voisin (PR `MAJ-agency/skills#163`). Consigne : l'architecte applique la règle à sa propre PR de documentation.
