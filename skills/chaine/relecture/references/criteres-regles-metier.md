# Critères de l'axe Règles métier (liste fermée)

L'axe reçoit le **diff**, la section `## Criticité` du corps de la PR quand elle existe, et la déclaration de périmètre de la PR (le commentaire `Périmètre — …`) quand elle existe, et lit dans l'arbre à part les fichiers de règle touchés, les specs qui les portent, le glossaire du projet (`GLOSSARY.md`, ou `CONTEXT.md`) et l'index `anchorpost/anchorpost.json`. La fiche `.claude/rules/anchorpost.md`, que `M2` cite, se lit sur la base, dans le dossier de la session : l'arbre à part ne porte aucun fichier de `.claude/`. Il est joué quand le diff touche un fichier de règle (`docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`), une criticité (`criticality`, `cases` ou `notApplicableFamilies` d'une règle, `featureCriticality` du manifeste `anchorpost/manifest.json`) ou le glossaire. Il ne rend que des écarts rattachés à l'un de ces critères. Tout écart est un constat **bloquant** ; ce que le dépôt ne permet pas de trancher est un **doute**.

`M1` redit le critère `D8` de l'axe Documentation, mot pour mot (`scripts/relecture.test.mjs` le tient) : quand les deux axes sont joués sur la même PR et relèvent le même écart, le verdict n'en garde qu'un constat. `M5` est le critère de périmètre de l'axe, comme `D9` et `K7` le sont des deux autres ; `D9` est propre au régime 8, et `M1` redit toujours `D8`. Les définitions de `M2` et de `M3` sont celles du skill `criticite` (son prompt, `criticite/references/prompt.md`). L'axe ne sait pas qui a écrit une ligne : là où un critère dit « un agent » ou « une personne », il lit qui la règle ou la section « Criticité » nomme, et la session, au tri, tient toute PR qu'elle relit pour celle d'un agent.

```text
M1  Criticité tracée — skill criticite. Seulement si l'index commis du projet, anchorpost/anchorpost.json,
    porte "schema": "3" : l'axe le lit dans l'index, jamais dans ce que dit la PR. Tout diff
    qui crée un fichier de règle ou change son énoncé, qui écrit ou change criticality, cases ou
    notApplicableFamilies dans un fichier de règle, ou qui retire une règle d'une ligne `Règles:`
    (spec ou ticket), a sa section « Criticité » dans la description de la PR : pour chaque règle,
    la commande exacte jouée depuis la racine du projet, sans variable d'environnement devant, puis
    chaque sortie brute de sous-agent, dans l'ordre (ou le lien du commentaire de la PR qui les
    porte), ou la raison écrite du geste. Écart : un tel geste sans sortie de sous-agent ni
    raison écrite ; un niveau écrit sous le plus haut niveau rendu validement ; une criticité low
    dont la raison est une raison de procédure, ou ne dit pas pourquoi une erreur serait sans
    conséquence durable ; un `by` autre que `agent` dans la PR d'un agent ; un cas rendu disparu, ou
    qui a changé de kind, de scope ou de sens, ou un « sans objet » ajouté, sans sa raison écrite
    dans la section.
    Une famille que le sous-agent laisse en question est acceptée quand son entrée est dans
    `docs/questions-ouvertes.md` du diff, avec la règle sur sa ligne `Bloque :` ; listée dans la
    section seule, sans entrée au registre, elle est un écart ; une famille sans cas, sans « sans
    objet » et sans question est un écart aussi.
M2  Cas et familles — skill criticite, fiche .claude/rules/anchorpost.md de la base. Seulement si l'index
    commis du projet porte "schema": "3". Une règle que le diff crée, ou dont il change l'énoncé,
    porte dans son en-tête ses cas attendus (`cases`) : le cas normal et chaque cas limite que
    l'énoncé énonce ; pour une règle medium ou high, en plus, tous les cas limites, toutes les
    entrées invalides et tous les refus que l'énoncé ou sa spec impliquent. Elle répond à chacune
    des dix familles (limits, empty, invalid-input, duplicate, ordering, time, permissions,
    rare-state, volume, failure) par l'une de ces trois réponses : un cas au moins qui la porte
    (`family` ; un cas de genre invalid répond d'office à invalid-input), une entrée de
    `notApplicableFamilies` avec sa raison, ou une question au registre
    `docs/questions-ouvertes.md` (la règle sur sa ligne `Bloque :`). Écart : un cas que l'énoncé
    dit et qu'aucun cas de `cases` ne porte ; pour une règle medium ou high, un cas limite, une
    entrée invalide ou un refus que l'énoncé ou sa spec impliquent et qu'aucun cas ne porte ; un
    cas que ni l'énoncé ni la spec ne portent ; une famille sans aucune des trois réponses ; une
    famille à la fois portée par un cas et dite sans objet ; un « sans objet » dont la raison ne
    tient pas à ce que la règle exige ; un cas `scope: technical` qui est une décision du métier
    (un refus, une exception que la MOA reconnaîtrait) ; un cas dont le `kind` contredit son
    titre (un refus rangé `invalid`, une entrée mal formée rangée `refusal`).
M3  Criticité et sa raison — skill criticite. Seulement si l'index commis du projet porte
    "schema": "3". `criticality` s'écrit { level, by, reason }, et la raison dit en une ou deux
    phrases ce qu'une erreur coûterait, dans les mots de la règle. Les trois niveaux : high, une
    erreur casse ou bloque un usage essentiel, coûte de l'argent, ouvre un accès, expose ou perd
    une donnée, ou ne se rattrape pas ; medium, une erreur casse ou bloque un usage courant,
    fausse ce que la MOA lit, ou laisse entrer des données erronées ; low, une erreur gêne, sans
    conséquence durable. Écart : une raison qui nomme un coût que ces définitions rangent à un
    niveau plus haut que celui écrit ; un énoncé qui dit lui-même un tel coût, sous un niveau
    plus bas ; une raison qui ne dit pas ce qu'une erreur coûterait ; la forme nue
    (`criticality: high`) écrite par le diff ; un niveau baissé par le diff, ou une règle retirée
    d'une ligne `Règles:`, sans que la section « Criticité » nomme la personne qui l'a décidé ;
    une validation `validated` (`validation.status`) que le diff écrit ou change sans sa `date`,
    ou avec un `by` absent ou qui vaut `agent` : seule une personne valide, et la règle la nomme.
M4  Vocabulaire — glossaire du projet, ADR sur la langue des identifiants. Un terme du domaine
    que le diff introduit dans l'énoncé d'une règle ou dans une spec a son entrée au glossaire,
    avec son nom en code ; l'énoncé d'une règle emploie le terme du glossaire, jamais un mot que
    son entrée déconseille (« Ne pas dire », `_Avoid_`) ; une entrée du glossaire que le diff
    ajoute ou change ne contredit ni une autre entrée, ni l'énoncé d'une règle qui emploie le
    terme ; un même terme n'a pas deux entrées.
M5  Périmètre — docs/agents/chaine-de-production.md § 5 (« Périmètre, règle 3 »). Seulement si la
    PR porte une déclaration de périmètre (l'entrée « Déclaration de périmètre »). Une décision,
    un fait ou une ADR que la déclaration ne nomme pas est un bloquant. Sa correction est le
    retrait, jamais l'ajout de ce qui manque autour. Écart : une règle métier que le diff crée ou
    réénonce, ou une décision de criticité qu'il écrit (un niveau, une validation), absente de la
    ligne `Décisions:` de la déclaration.
```
