# Lancer un conducteur, un capitaine ou la session d'un ticket

Une session créée par une autre ne reçoit que le dépôt du projet. Les skills de la chaîne n'en dépendent plus : le dépôt `MAJ-agency/skills` est public, et le script de l'environnement de chaque projet installe le plugin `maj-skills` depuis GitHub, puis le met à jour, au démarrage de toute session, fille comprise (`P-24`). Chaque prompt porte donc trois choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`), **le repli** et **les consignes du produit** (ci-dessous). Le repli : skill absent de la session (le hook de démarrage le signale), elle installe elle-même le plugin, puis lit le skill sous `~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md`, car un plugin installé en cours de session n'entre pas dans sa liste de skills ; si l'installation échoue, elle l'écrit à qui l'a lancée et s'arrête, sans improviser. Cas vécu le 2026-11-14 : deux sessions lancées sur un même environnement ont démarré sans le plugin, sur une machine préparée avant que le script n'en porte l'installation ; les deux commandes, jouées à la main, ont réussi. Aucun geste d'une session de projet n'exige plus le dépôt `skills` : il n'y a plus de copie à faire, et modifier un skill se fait dans une session ouverte sur `MAJ-agency/skills`, jamais dans un projet. L'attache d'un dépôt à la session, refusée deux fois le 2026-11-13 par le contrôle automatique des permissions, n'a plus d'objet.

Le prompt est court et renvoie : la procédure est dans le skill que la session lit, le travail dans la spec et les cartes. Il ne recopie aucune règle ; il nomme seulement ce qui ne s'y lit pas. Modèle de forme : le prompt d'une fille, `chaine-de-production.md` § 5.

## Le conducteur d'un chantier

`create_session` : `title` « `<Projet> <chantier> — Conducteur` » ; `tags` `["role:conducteur", "programme:<nom>"]` (jamais `chantier:<nom>` : c'est le tag des filles, que le conducteur liste) ; `source_url` le dépôt du chantier ; `source_revision` sa branche d'intégration ; `model` Opus (table des rôles, § 1) ; `permission_mode` `"auto"`.

```text
Conducteur du chantier <nom>, programme <programme>, architecte : <session_id de cette session>.
Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis /maj-skills:chantier, ses références comprises, et tout skill qu'il invoque. S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis ~/.claude/plugins/marketplaces/maj/skills/chaine/chantier/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
<les deux lignes des consignes du produit, telles quelles>
Spec validée : <chemin> (branche <branche>). Sujet : sujet/<nom>. Carte du programme : <chemin> (dépôt <dépôt>, branche <branche>).
<Carte du chantier déjà ouverte : <chemin>, s'il y en a une.> <une ligne de situation particulière, s'il y en a une>
```

Ce que le conducteur fait de ce prompt est écrit dans `chantier/SKILL.md` ; le relire avant d'écrire le prompt :

- l'architecte nommé lui fait reconnaître qu'il est **dans un programme** : il commence au découpage, sans grilling, et ne parle jamais au produit (« Où commence ce skill, à qui parle cette session ») ;
- une vague donnée dans le prompt vaut **validée** ; ce qui manque encore (le responsable, une échéance) revient à l'architecte en **un seul** `send_message` (§ 1). Le responsable et l'échéance du chantier, quand la carte du programme les a, s'écrivent donc dans la ligne de situation ;
- une carte de chantier déjà ouverte par l'architecte reçoit du conducteur sa ligne `Conducteur:` (§ 1, « Fiche »).

## Le capitaine d'un dépôt

`create_session` : `title` « `<Projet> — Capitaine de fusion` » ; `tags` `["role:capitaine"]` (le conducteur le cherche par ce tag) ; `source_url` le dépôt ; `model` Sonnet ; `permission_mode` `"auto"`.

```text
Capitaine de fusion du dépôt <dépôt>, programme <programme>, architecte : <session_id de cette session>.
Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis /maj-skills:fusionner, ses références comprises. S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
<les deux lignes des consignes du produit, telles quelles>
<Dépôt sans la chaîne (pas de .claude/chaine.json) : la procédure propre au dépôt, entière, ici — jamais complétée plus tard par message.>
```

La procédure du capitaine est celle du skill `fusionner` : ce prompt ne la recopie pas. Seul un dépôt qui n'a pas la chaîne (ni `develop`, ni scripts de fusion) reçoit la sienne dans le prompt, et alors **en entier** : un message ne l'élargira pas.

Les interdits d'une procédure donnée dans un prompt s'écrivent comme des **gestes de la session** (« tu ne modifies aucun fichier toi-même », « tu ne pousses sur aucune branche »), jamais comme des **contenus** (« ne pas monter la version ») : un interdit de contenu s'applique aux PR que le capitaine reçoit, et il refuse de fusionner. Le contenu d'une PR nommée a été validé avant d'être nommé, le capitaine ne le rejuge pas. Cas vécu le 2026-11-13 : un capitaine s'est arrêté devant la PR qui montait la version du plugin, parce que sa consigne lui interdisait de monter la version.

## La session d'un ticket hors chantier

Hors chantier, il n'y a ni conducteur ni sujet : le gabarit de `chaine-de-production.md` § 5 (« Session fille du chantier <nom>, conducteur », base `origin/sujet/<nom>`, questions au conducteur) ne s'y applique pas tel quel.

`create_session` : `title` « `<Projet> <identifiant du ticket> — <objet en quelques mots>` » ; `tags` `["role:ticket", "programme:<nom>"]` (jamais `chantier:<nom>` : aucun conducteur ne la suit) ; `source_url` le dépôt du ticket ; `source_revision` sa branche d'intégration (`develop`, ou `main` dans un dépôt qui n'a pas `develop`) ; `model` celui de la ligne `Modèle:` du ticket ; `permission_mode` `"auto"`.

```text
Session du ticket <identifiant>, hors chantier, programme <programme>, architecte : <session_id de cette session>.
Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis tout skill que le ticket ou docs/agents/chaine-de-production.md § 5 invoque (/maj-skills:revue-de-ticket à l'étape de la revue). S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis le skill sous ~/.claude/plugins/marketplaces/maj/skills/chaine/<nom du skill>/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
<les deux lignes des consignes du produit, telles quelles>
Ticket : <chemin du .issue.md> (branche <branche où il se lit>). Base : origin/<branche d'intégration>.
Suis le ticket ; dans un dépôt qui a docs/agents/chaine-de-production.md, suis aussi son § 5, en lisant « l'architecte » où il dit « le conducteur » et la base ci-dessus où il dit origin/sujet/<nom>. Écris-moi (send_message) si tu es bloqué, et dès ta PR livrée, sans attendre ni les contrôles ni la fusion ; un choix non tranché se décide prudemment et se note sous ## Comments ; une question part à moi, jamais au produit. Tu livres selon la ligne Label: du ticket.
<une ligne de situation particulière, s'il y en a une>
```

L'architecte y tient la place du conducteur : il reçoit les questions et le message de livraison, contre-relit lui-même un ticket `Label: contre-revue` (par un sous-agent) avant de poser `à-fusionner`, puis nomme la PR au capitaine. La session se compte dans `## Coût` de la carte du programme (`SKILL.md` § 2).

## Les consignes du produit, dans chaque prompt

Deux lignes, recopiées telles quelles dans le prompt de toute session que l'architecte lance, conducteur, capitaine ou session de ticket (le gabarit d'une fille de chantier, `chaine-de-production.md` § 5, les porte déjà) :

```text
Le produit : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.
```

C'est la seule exception à « le prompt ne recopie aucune règle » : le produit a demandé, le 2026-11-14, que ces phrases soient citées mot pour mot. Les intangibles sont des gestes de la session (§ « Le capitaine d'un dépôt », dernier paragraphe) : aucun ne juge le contenu d'une PR.

Un capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, ne fusionne que les PR que l'architecte lui nomme : sa procédure dit qu'une demande de fusion venue d'une autre session se signale à l'architecte (`send_message`), qui lit le diff et décide (`SKILL.md` § 7). Un capitaine du skill `fusionner` lit sa file au label `à-fusionner` : rien ne lui est nommé d'avance.

## Après le lancement

- La session dans la carte du programme (ligne du chantier, ou `Capitaines:`), une ligne au journal, commit et push.
- `send_later` à 20 minutes, puis `get_session` : `blocked` ou `failed` se lit par `list_events` (`kinds: ["assistant"]`) — un skill absent s'y voit même quand son `send_message` n'est pas arrivé.
- `permission_mode` : une session lancée ne peut pas avoir un mode plus permissif que celle qui la lance, donc le produit ouvre l'architecte en mode « Auto ». Une session créée par `create_session` n'a qu'un dépôt ; un architecte de programme à plusieurs dépôts n'a pas, lui, le `.claude/settings.json` d'un dépôt (ni hook ni outil autorisé d'office) : il reste en « Auto » et fait écrire dans chaque autre dépôt par une session lancée sur lui (`SKILL.md` § 1). Si `create_session` refuse ce mode, l'architecte le dit au produit et ne relance pas dans un autre mode.
- Un skill absent : la ligne au journal, le produit prévenu, rien de contourné (`SKILL.md` § 5).
- Ensuite, un message à cette session ne fait que **nommer le travail** (une spec validée, des PR à traiter) ; il n'ajoute ni ne change jamais une règle.
