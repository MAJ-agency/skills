# ADR_ALL_ARC-{{N}} — Relecture indépendante et accord des fichiers sensibles : toute PR est relue par une session que son auteur ne contrôle pas, et un chemin sensible ne se touche qu'avec l'accord du produit

- Statut : **accepté**
- Date : {{DATE}}
- Portée : la relecture des PR, les fichiers sensibles (`cheminsSensibles` de `.claude/chaine.json`), le capitaine de fusion, les rôles de la chaîne ({{ADR_CHAINE}})
- Remplace : l'ADR « CODEOWNERS », retirée par le produit ; amende les points 1, 4 et 5 de {{ADR_CHAINE}}

## Contexte

Jusqu'ici, la session qui code un ticket lançait elle-même ses relecteurs, triait leurs constats et écrivait la section de revue de sa PR ; le capitaine vérifiait la présence de cette section ; le conducteur contre-relisait les PR sensibles dans son propre contexte, contre un ticket qu'il avait écrit. Les PR de documentation du conducteur et de l'architecte (tickets, règles, specs) n'étaient relues par personne d'indépendant. Le fichier CODEOWNERS aurait fait dépendre chaque PR sensible d'une seconde personne, alors que toutes les sessions écrivent sous le compte du produit et que GitHub refuse qu'un auteur approuve sa propre PR : le produit l'a retiré.

## Décision

1. **Toute PR a une relecture indépendante**, quel que soit son auteur, documentation comprise. **La session qui code ne se relit plus.** Elle demande la relecture après son dernier push : un commentaire `À relire — sommet <sha> — Session: <id> — Conducteur: <id>`, puis l'étiquette `à-relire`. Elle ne pose jamais `à-fusionner`.
2. **Un Relecteur par dépôt** (skill `relecteur`) aiguille : il lance une session de relecture par PR, deux pour une règle de criticité haute, et pose `à-fusionner` sur un tour validé, `à-reprendre` sur un refus. Sur une PR de documentation sans déclaration de périmètre, ou qui touche un fichier hors de son périmètre, il pose aussi `à-reprendre`, sans lancer de session de relecture ni compter de tour (`Périmètre absent`, `Périmètre dépassé — <fichiers>`). Il ne transporte jamais un constat, ne le résume pas, n'arbitre rien. Sa décision est une fonction pure, et sa veille un script.
3. **La session de relecture** (skill `relecture`), lancée sur la base de la PR, choisit ses axes selon ce que le diff contient, lance un sous-agent en contexte vierge par axe contre une liste fermée de critères, relit chaque constat dans le code, puis écrit sur la PR un verdict de forme fixe, que la machine lit : `validé`, `refusé` ou `incomplet`, des constats **bloquants** (un écart à un critère écrit) ou **doutes**. Elle ne modifie aucun fichier et ne pousse rien. Sur un chemin sensible, elle joue `/security-review` et le verdict le dit. Son modèle et son effort suivent le risque (`relecture.ordinaire`, `relecture.sensible` de `.claude/chaine.json`).
4. **Le capitaine ne relit rien.** Une PR n'entre qu'avec un tour validé pour le contenu du sommet qu'il fusionne, contrôlé deux fois : à l'éligibilité, puis juste avant l'appel de fusion. Une mise à jour faite par le capitaine (fusion de `develop`, index régénérés) garde le verdict (« même contenu propre »). La livraison d'un sujet et le report de `develop` dans un sujet n'ont pas de verdict propre : ce qui y entre a été relu sous-PR par sous-PR.
5. **Trois tours refusés au plus.** Au-delà, la décision de plafond : l'architecte pour une PR d'une fille ou du conducteur, ou dont il est l'auteur (le contenu de sa décision : skill `architecte`, § 5) ; sans programme, le conducteur pour une PR d'une fille quand la cause est technique, le produit sinon ; qui décide en informe le produit. Au plafond, la décision est un découpage (ce qui entre, ce qui part en suite), que l'architecte a le droit de faire ; la demander au produit est une demande d'autorisation. Un bloquant se corrige avec son test, ou se conteste ; l'arbitre n'est jamais l'auteur.
6. **Un chemin sensible ne se touche qu'avec l'accord du produit, donné avant, une fois**, quand il valide le découpage d'un chantier : le conducteur dit quels fichiers, pourquoi, et ce qui va y changer. La ligne `Sensibles:` du ticket porte les chemins et l'accord ; elle se lit sur le sujet, jamais dans l'arbre de travail. Trois gardes la lisent : le hook d'édition refuse l'écriture d'un chemin qu'elle ne couvre pas, et le capitaine, à la fusion d'une sous-PR (`sujet.sh fusionner`) comme d'une PR vers `develop` (`passer.sh`), renvoie une PR dont le diff en touche un, comme une PR sans ticket qui en touche un. Aucun blocage par GitHub ; CODEOWNERS n'est pas posé.
7. **Le régime se lit sur la base et sur la date.** La clé `relecture` de `.claude/chaine.json`, avec `depuis`, allume ce régime : une PR est relue ainsi quand sa base porte la clé et qu'elle a été ouverte après `depuis` ; une PR ouverte avant finit sous les règles d'avant.

## Ce que cette décision ne ferme pas

- **Toutes les sessions écrivent sous le compte du produit.** Une étiquette, un verdict, une ligne `Sensibles:` peuvent être écrits par n'importe quelle session : ces gardes tiennent face à une session de bonne foi qui suit son skill, pas face à une PR hostile. Il reste la protection de branche.
- **C'est un agent qui écrit le nom de qui a accordé** un fichier sensible ; rien ne prouve l'accord, sinon la conversation du produit.
- **Le Relecteur est un point de passage** : arrêté, plus aucune PR n'est relue. Il se relance sans rien perdre, et le réveil de secours de l'auteur le signale.
- **Deux sessions de relecture d'une même PR peuvent lire le verdict l'une de l'autre** : la consigne l'interdit, rien ne l'empêche.
- **Une règle haute sans champ `code:`**, touchée par une PR sans ticket, n'a qu'une relecture ; sans index Anchorpost, une criticité reçue d'une feature n'est pas vue.

## Alternatives écartées

- **CODEOWNERS et l'approbation d'un propriétaire** : avec un seul humain, la règle bloque toute PR sensible ou se contourne.
- **La revue par l'auteur, contrôlée par le capitaine** (la section de revue dans le corps de la PR) : l'auteur choisit ses relecteurs, trie leurs constats et écrit ce que le capitaine lit.
- **La contre-revue du conducteur** : il relit dans son contexte d'orchestration, contre un ticket qu'il a écrit.
- **Un compte propre aux agents** : écarté par le produit, trop compliqué.

## Conséquences

Toute PR passe un regard qui n'a pas écrit le code, et aucune session ne contrôle sa propre relecture. En échange : une session de relecture par PR, documentation comprise, deux pour une règle haute ; tout écart à un critère écrit devient bloquant, donc plus de tours refusés ; un Relecteur à faire tourner par dépôt.

Mode d'emploi : `docs/agents/chaine-de-production.md`. Skills : `relecteur`, `relecture`, `fusionner`, `chantier`. Contrat du projet : `.claude/chaine.json`, clé `relecture`.
