# Lancer un conducteur ou un capitaine

Une session créée par une autre ne reçoit que le dépôt du projet. Les skills de la chaîne n'en dépendent plus : le dépôt `MAJ-agency/skills` est public, et le script de l'environnement de chaque projet installe le plugin `maj-skills` depuis GitHub, puis le met à jour, au démarrage de toute session, fille comprise (`P-24`). Chaque prompt porte donc deux choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`) et **le repli** : skill absent de la session, elle l'écrit à qui l'a lancée et s'arrête, sans improviser ; le hook de démarrage signale ce manque. Aucun geste d'une session de projet n'exige plus le dépôt `skills` : il n'y a plus de copie à faire, et modifier un skill se fait dans une session ouverte sur `MAJ-agency/skills`, jamais dans un projet. L'attache d'un dépôt à la session, refusée deux fois le 2026-11-13 par le contrôle automatique des permissions, n'a plus d'objet.

Le prompt est court et renvoie : la procédure est dans le skill que la session lit, le travail dans la spec et les cartes. Il ne recopie aucune règle ; il nomme seulement ce qui ne s'y lit pas. Modèle de forme : le prompt d'une fille, `chaine-de-production.md` § 5.

## Le conducteur d'un chantier

`create_session` : `title` « `<Projet> <chantier> — Conducteur` » ; `tags` `["role:conducteur", "programme:<nom>"]` (jamais `chantier:<nom>` : c'est le tag des filles, que le conducteur liste) ; `source_url` le dépôt du chantier ; `source_revision` sa branche d'intégration ; `model` Opus (table des rôles, § 1) ; `permission_mode` `"auto"`.

```text
Conducteur du chantier <nom>, programme <programme>, architecte : <session_id de cette session>.
Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis /maj-skills:chantier, ses références comprises, et tout skill qu'il invoque. S'il n'est pas parmi tes skills : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
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
Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis /maj-skills:fusionner, ses références comprises. S'il n'est pas parmi tes skills : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
<Dépôt sans la chaîne (pas de .claude/chaine.json) : la procédure propre au dépôt, entière, ici — jamais complétée plus tard par message.>
```

La procédure du capitaine est celle du skill `fusionner` : ce prompt ne la recopie pas. Seul un dépôt qui n'a pas la chaîne (ni `develop`, ni scripts de fusion) reçoit la sienne dans le prompt, et alors **en entier** : un message ne l'élargira pas.

Les interdits d'une procédure donnée dans un prompt s'écrivent comme des **gestes de la session** (« tu ne modifies aucun fichier toi-même », « tu ne pousses sur aucune branche »), jamais comme des **contenus** (« ne pas monter la version ») : un interdit de contenu s'applique aux PR que le capitaine reçoit, et il refuse de fusionner. Le contenu d'une PR nommée a été validé avant d'être nommé, le capitaine ne le rejuge pas. Cas vécu le 2026-11-13 : un capitaine s'est arrêté devant la PR qui montait la version du plugin, parce que sa consigne lui interdisait de monter la version.

## Après le lancement

- La session dans la carte du programme (ligne du chantier, ou `Capitaines:`), une ligne au journal, commit et push.
- `send_later` à 20 minutes, puis `get_session` : `blocked` ou `failed` se lit par `list_events` (`kinds: ["assistant"]`) — un skill absent s'y voit même quand son `send_message` n'est pas arrivé.
- `permission_mode` : une session lancée ne peut pas avoir un mode plus permissif que celle qui la lance, donc le produit ouvre l'architecte en mode « Auto ». Si `create_session` refuse ce mode, l'architecte le dit au produit et ne relance pas dans un autre mode.
- Un skill absent : la ligne au journal, le produit prévenu, rien de contourné (`SKILL.md` § 5).
- Ensuite, un message à cette session ne fait que **nommer le travail** (une spec validée, des PR à traiter) ; il n'ajoute ni ne change jamais une règle.
