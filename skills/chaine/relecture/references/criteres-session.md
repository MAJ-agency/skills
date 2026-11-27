# Critères que la session de relecture juge elle-même (liste fermée)

Quatre contrôles ne passent par aucun sous-agent : la session les joue dans l'arbre à part, par les scripts de la base, et en rend les écarts au verdict sous l'axe « Session ». Leurs commandes sont des sous-commandes de `scripts/gestes.sh` (`references/gestes.md`). Tout écart est un constat **bloquant**. Un contrôle qui n'a pas pu être joué (outil absent, installation en échec, commande en échec pour une cause étrangère à la PR) s'écrit « non exécuté » : le verdict est alors `incomplet`, ou `refusé` s'il reste un bloquant gardé. L'échec d'un outil de la session n'est jamais un écart de la PR ; dans le doute entre les deux, « non exécuté ». Et une commande se lit par son code de sortie : une liste vide après un échec n'est jamais « aucun écart ».

```text
C1  Index générés — scripts/docs/index-generes.json (critère D4 de l'axe Documentation). Sur le
    sommet relu, chaque index à `commande` est celui que sa commande produit, et chaque
    `verification` passe : `regenerer_index` (scripts/chaine/github.sh), joué dans l'arbre à
    part, ne change aucun fichier. Un fichier que la régénération change, ou une vérification
    rouge sur ce que la PR écrit, est un écart : son auteur régénère l'index par sa commande. Un
    index sans commande n'est vérifié par rien ici : il se relit dans le diff, comme tout fichier.
    Un fichier non suivi qu'une commande laisse n'est pas un écart. Un index à commande que la
    base et la tête déclarent par un chemin littéral (`dispenses.txt`, celui que « même contenu
    propre » dispense) n'est pas jugé ici, sur aucune PR : le capitaine le régénère avant que
    rien n'entre dans develop ; le verdict le nomme, sans écart. Tout autre fichier que la
    régénération change reste un écart.
C2  Forme d'une PR de mise à jour — skill sujet, « Recevoir develop dans un sujet ». Pour une PR
    dont la base est un sujet, `sujet.sh a-juger` sort en 0. Une sortie 4 est un écart, et le
    motif que la commande écrit est le constat : plusieurs fusions, un premier parent qui n'est
    pas le sommet du sujet, un message de fusion ou de retouche refusé. Le motif « refusé par
    commitlint » n'est un écart que si l'outil tourne dans la session : sinon le contrôle n'a pas
    été joué.
C3  Accord des fichiers sensibles — ligne `Sensibles:` du ticket. Chaque chemin sensible que le
    diff relu touche (une ligne de `chemins-sensibles.mjs`) est couvert par la ligne `Sensibles:`
    du ticket de la PR : un chemin exact, ou un motif qui le prend, suivi de l'accord (` — accord
    de <nom>, <date>`). La ligne se lit sur la branche du sujet (`origin/sujet/<nom>`, rapatriée
    d'abord quand la PR va vers develop), ou sur `origin/develop` pour un ticket sans sujet ou dont
    le sujet n'est plus sur le distant, jamais dans l'arbre relu ni sur la branche de la PR. Un écart par chemin sensible touché que la ligne ne couvre pas : ligne absente,
    `Sensibles: —`, chemin hors de la liste, ou PR sans ticket. Une PR de mise à jour d'un sujet
    (`maj/<nom>`) n'a pas de ticket : un chemin sensible n'y est couvert que s'il est dans la
    première liste de `sujet.sh a-juger` (la résolution du conflit) et sur la ligne `Sensibles:`
    d'un ticket de ce sujet.
C4  Sécurité — commande intégrée /security-review. Une faille que `/security-review` relève sur
    le diff de la PR, et que la session retrouve dans le code, ligne ouverte : un accès hors
    périmètre, une donnée exposée, un secret, une injection, un droit trop large. La commande ne
    compte pour lancée que si la session a vérifié par une commande, avant de la lancer, que le
    diff qu'elle lit est celui de la PR (`gestes.md`) ; sinon le contrôle n'a pas été joué.
```

Le constat de `C4` cite la faille comme `/security-review` la nomme. Ce que la commande propose sans faille (durcissement, conseil) n'est pas un constat. Un fichier binaire sous un chemin sensible n'est lu ni par elle ni par un axe : le verdict est `incomplet`, sans bloquant. Les fiches de règles (`CLAUDE.md`, `.claude/rules/`) se lisent sur la base : l'arbre relu ne porte aucun fichier de consigne.
