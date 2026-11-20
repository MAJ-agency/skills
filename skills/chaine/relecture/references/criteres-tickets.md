# Critères de l'axe Tickets (liste fermée)

L'axe reçoit le **diff** et lit dans l'arbre à part les tickets, la spec et la carte que le diff touche, les autres tickets du même chantier, et tout fichier, règle, ADR ou décision qu'ils citent. Il est joué quand le diff écrit ou modifie un ticket (`*.issue.md`), une spec (`*.spec.md`) ou une carte (`*.map.md`) ; un ticket dont seules la ligne `Status:` et la section `## Comments` changent ne le déclenche pas. Il ne rend que des écarts rattachés à l'un de ces critères. Tout écart est un constat **bloquant** ; ce que le dépôt ne permet pas de trancher est un **doute**.

Le gate `tickets` juge déjà la présence des lignes et des sections ; ces critères jugent ce qu'il ne lit pas : leur contenu.

```text
K1  Format prêt pour agent — docs/agents/chaine-de-production.md § 3, gate tickets. Un ticket
    `Status: ready-for-agent` se réalise par une session neuve sans exploration large ni
    question : `Type:` et `Modèle:` (avec sa raison quand ce n'est pas le modèle ordinaire), et les
    sections « Où », « Décisions », « Surfaces », « Vérification » remplies de ce qui s'exécute —
    les fichiers à créer ou modifier par leur chemin, le modèle à imiter par fichier:ligne,
    l'appelant réel de toute fonction citée (route, listener, cron), les commandes ciblées. Une
    section présente mais creuse (« à définir », « voir la spec », un renvoi sans contenu) est
    un écart : le gate ne juge que sa présence.
K2  Paraphrase de la spec — docs/agents/issue-tracker.md, docs/methode/decisions.md. Ce que la
    spec ou la carte décide, le ticket le reprend mot pour mot ou par renvoi (l'identifiant de la
    décision, la section). Une règle, un chiffre, un nom, une forme ou un ordre d'étapes que le
    ticket énonce autrement que sa source est un écart, même si le sens paraît le même : deux
    énoncés divergent, et la session qui code ne lit que le ticket. Ce que le ticket ajoute à sa
    source n'est pas une paraphrase : c'est une décision du ticket, dite telle, avec sa raison
    (K3) ; une précision glissée sans être dite est un écart.
K3  Décision laissée ouverte — docs/agents/chaine-de-production.md § 3 (« Décisions »). Tout
    choix dont dépend le code est tranché dans le ticket, avec sa raison ou son renvoi, ou nommé
    comme laissé à la session « par défaut prudent », ce défaut écrit. Un « à voir », un « selon
    le cas », deux options sans choix, une question que le ticket pose sans y répondre sont des
    écarts.
K4  Référence morte — docs/methode/nomenclature.md. Tout identifiant (règle, spec, ticket, ADR,
    décision de la carte), tout chemin de fichier, toute commande et tout fichier:ligne que le
    ticket, la spec ou la carte citent existent dans l'arbre relu, à l'endroit dit ; un fichier à
    créer est dit tel, par ce ticket ou par un ticket que sa ligne `Blocked by:` nomme. Un repère
    fichier:ligne que le texte donne pour un commit nommé se vérifie à ce commit. Une référence
    hors du dépôt (un autre dépôt, une PR, une adresse) ne se vérifie pas ici : elle n'est jamais
    un écart, un doute au plus. Une ligne `Blocked by:` ne cite que des tickets qui existent, et
    aucun ticket ne se bloque lui-même, directement ou par une chaîne.
K5  Surface sans preuve — docs/agents/chaine-de-production.md § 3 (« Surfaces »). Chaque surface
    que le besoin ou les décisions du ticket font exister (écran, endpoint, commande, script,
    message, fichier posé) a sa ligne dans la table surface → preuve, et chaque ligne nomme une
    preuve qui se joue : un test, par son fichier et son titre, ou une commande et ce qu'elle
    doit rendre. Une surface absente de la table, une preuve qui n'exerce pas la surface qu'elle
    nomme, ou une « lecture du diff » là où un test peut tenir la surface, sont des écarts.
K6  Fichier chaud en double dans une vague — docs/agents/chaine-de-production.md § 4,
    scripts/docs/vagues.mjs. Deux tickets d'une même vague ne touchent pas le même fichier parmi
    ceux qu'ils déclarent. Deux tickets ouverts que rien n'ordonne (aucun `Blocked by:` de l'un à
    l'autre, direct ou par une chaîne) et dont les sections « Où » font modifier un même fichier
    le nomment tous deux sur leur ligne `Fichiers chauds:` ; un tel fichier absent de l'une des
    deux lignes, ou deux tickets que la carte range dans la même vague avec un fichier chaud
    commun, sont des écarts. Les index générés ne comptent pas.
```
