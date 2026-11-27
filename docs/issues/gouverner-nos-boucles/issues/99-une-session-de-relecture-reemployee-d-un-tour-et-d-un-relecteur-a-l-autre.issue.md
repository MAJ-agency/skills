# Une session de relecture réemployée d'un tour et d'un Relecteur à l'autre : c'est voulu, le ticket propose `wontfix`

Status: needs-triage
Type: défaut
Modèle: aucun si `wontfix` est accepté. Le seuil de réemploi est une question de coût, posée à l'architecte (« La question »), que ce ticket ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: aucun si `wontfix`. Si le seuil change : `skills/chaine/relecteur/SKILL.md` (lignes 65 et 72, « 700 000 tokens »), `scripts/relecteur.test.mjs` (lignes 60 et 76, dans les tests `A-180` et de la contre-relecture de la PR 146), la spec (`A-180`, point 3) et les fichiers de version ; après les tickets 96 et 97.

## Le constat

Constat (15) de l'essai réel du régime 8 (journal de la carte, 2026-11-23 : 10 h 01, 17 h 00, 18 h 49, 22 h 00). Une même session de relecture a relu tous les tours d'une PR : six tours sur la PR #7 du jouet, cinq sur la #6, trois sur la #10. Sur la #10, le tour 3 a été distribué par un Relecteur neuf à la session des tours 1 et 2, lancée par l'ancien Relecteur. La session de #7 finissait à 717 000 tokens de contexte. Le journal (17 h 00) note la suite : le contexte, donc le prix d'un tour, grossit à chaque réemploi.

## C'est voulu, et par quelles décisions

1. **`P-52`** (le produit, 2026-11-18) : une session de relecture par PR. La spec en tire la règle 6 d'`A-85` (`relecture-independante.spec.md:96`) : un tour neuf se distribue « **aux mêmes sessions qu'au tour précédent quand elles vivent et ne sont pas au plafond de contexte** », à des sessions neuves sinon.
2. **`A-111`** : la fonction rend les sessions du tour précédent comme préférées (`preferees`), pour la règle 6 comme pour la reprise après arbitrage de la règle 4. Code : `skills/chaine/fusionner/scripts/decision-relecteur.mjs:389` (`preferees: dernier?.sessions ?? []`).
3. **`A-180`**, points 2 et 3 (`relecture-independante.spec.md:372` et `:377`) : réemploi à couple égal seulement ; « au plafond » se lit dans `get_session`, au-delà de 700 000 tokens. Skill : `skills/chaine/relecteur/SKILL.md:65` (réemployer jusqu'à 700 000 tokens) et `:72` (`plafond` au-delà).
4. **D'un Relecteur à l'autre** : un Relecteur ne garde rien en mémoire et reprend la file sur les seuls commentaires (`relecteur/SKILL.md:22`). Les `preferees` se lisent sur la dernière distribution de la PR, pas dans la mémoire du Relecteur qui l'a écrite : le Relecteur neuf réemploie donc la même session, comme l'ancien l'aurait fait. Rien ne distingue les deux cas, et c'est voulu.

Le comportement de l'essai est celui que ces décisions fixent. Ce qui n'est pas établi : le contexte de la session de #7 au moment du réemploi de son dernier tour. Le journal ne donne que sa valeur finale (717 000 tokens). Si elle avait passé 700 000 avant d'être réemployée, ce serait un défaut du relevé de `get_session` par le Relecteur, à ouvrir à part ; rien dans le journal ne le dit.

## Proposé

**`wontfix`**, avec cette raison : le réemploi est la règle 6 d'`A-85`, tirée de `P-52` et bornée par `A-180`. Le changer change le sens d'une décision du produit.

## La question (à l'architecte, puis au produit s'il le juge utile)

Le seuil de 700 000 tokens fixe quand une session neuve remplace la session réemployée. Le journal (17 h 00) avance un seuil plus bas, « par exemple 300 000 », où une session neuve coûterait moins cher qu'un tour de plus sur un long contexte. C'est un arbitrage de coût, donc une question, pas une décision de ce ticket. Pour la trancher, il faut mesurer, sur les PR de l'essai : le coût par tour d'une session réemployée selon son contexte, contre celui d'une session neuve (qui relit tout : le ticket, les règles, le diff). Ce qu'une session neuve perd : la mémoire des tours d'avant (les bloquants qu'elle a écrits, les arbitrages). Le verdict de chaque tour les porte sur la PR, mais une session neuve les relira.

## Quand le ticket est fait

- **`wontfix` accepté** : `Status: wontfix — P-52, A-85 (règle 6), A-180` et la raison sous `## Comments`.
- **Seuil changé** (décision de l'architecte ou du produit) : un ticket neuf, qui change la valeur à `relecteur/SKILL.md:65` et `:72`, la spec et son banc de texte ; pas ce ticket.

## Comments
