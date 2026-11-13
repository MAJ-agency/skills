# Lancer un conducteur ou un capitaine

Une session créée par une autre ne reçoit que le dépôt du projet et démarre **sans les skills de la chaîne** : le script de démarrage de l'environnement ne les installe que si le clone de `skills` est là, et le hook de démarrage le signale. Le remède est celui de `chaine-de-production.md` § 5, étape 5 : la session attache `MAJ-agency/skills` par `add_repo`, clone comme l'outil l'indique, puis lit le skill dans le clone. Il a marché sur des chantiers entiers ; il a aussi été refusé deux fois le 2026-11-13 par le contrôle automatique des permissions. D'où les deux lignes que porte chaque prompt : **la consigne d'attache**, et **le repli** — attache refusée, la session le dit et s'arrête, sans improviser.

Le prompt est court et renvoie : la procédure est dans le skill que la session lit, le travail dans la spec et les cartes. Il ne recopie aucune règle ; il nomme seulement ce qui ne s'y lit pas. Modèle de forme : le prompt d'une fille, `chaine-de-production.md` § 5.

## Le conducteur d'un chantier

`create_session` : `title` « `<Projet> <chantier> — Conducteur` » ; `tags` `["role:conducteur", "programme:<nom>"]` (jamais `chantier:<nom>` : c'est le tag des filles, que le conducteur liste) ; `source_url` le dépôt du chantier ; `source_revision` sa branche d'intégration ; `model` Opus (table des rôles, § 1).

```text
Conducteur du chantier <nom>, programme <programme>, architecte : <session_id de cette session>.
Skills : si /maj-skills:chantier n'est pas parmi tes skills, attache MAJ-agency/skills par add_repo, clone-le comme l'outil l'indique, puis lis et suis skills/chaine/chantier/SKILL.md du clone, ses références comprises ; tout skill qu'il invoque (/maj-skills:<nom>) se lit de même dans le clone. Attache refusée ou clone impossible : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
Spec validée : <chemin> (branche <branche>). Sujet : sujet/<nom>. Carte du programme : <chemin> (dépôt <dépôt>, branche <branche>).
<Carte du chantier déjà ouverte : <chemin>, s'il y en a une.> <une ligne de situation particulière, s'il y en a une>
```

Ce que le conducteur fait de ce prompt est écrit dans `chantier/SKILL.md` ; le relire avant d'écrire le prompt :

- l'architecte nommé lui fait reconnaître qu'il est **dans un programme** : il commence au découpage, sans grilling, et ne parle jamais au produit (« Où commence ce skill, à qui parle cette session ») ;
- une vague donnée dans le prompt vaut **validée** ; ce qui manque encore (le responsable, une échéance) revient à l'architecte en **un seul** `send_message` (§ 1). Le responsable et l'échéance du chantier, quand la carte du programme les a, s'écrivent donc dans la ligne de situation ;
- une carte de chantier déjà ouverte par l'architecte reçoit du conducteur sa ligne `Conducteur:` (§ 1, « Fiche »).

## Le capitaine d'un dépôt

`create_session` : `title` « `<Projet> — Capitaine de fusion` » ; `tags` `["role:capitaine"]` (le conducteur le cherche par ce tag) ; `source_url` le dépôt ; `model` Sonnet.

```text
Capitaine de fusion du dépôt <dépôt>, programme <programme>, architecte : <session_id de cette session>.
Skills : si /maj-skills:fusionner n'est pas parmi tes skills, attache MAJ-agency/skills par add_repo, clone-le comme l'outil l'indique, puis lis et suis skills/chaine/fusionner/SKILL.md du clone, ses références comprises. Attache refusée ou clone impossible : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
<Dépôt sans la chaîne (pas de .claude/chaine.json) : la procédure propre au dépôt, entière, ici — jamais complétée plus tard par message.>
```

La procédure du capitaine est celle du skill `fusionner` : ce prompt ne la recopie pas. Seul un dépôt qui n'a pas la chaîne (ni `develop`, ni scripts de fusion) reçoit la sienne dans le prompt, et alors **en entier** : un message ne l'élargira pas.

Les interdits d'une procédure donnée dans un prompt s'écrivent comme des **gestes de la session** (« tu ne modifies aucun fichier toi-même », « tu ne pousses sur aucune branche »), jamais comme des **contenus** (« ne pas monter la version ») : un interdit de contenu s'applique aux PR que le capitaine reçoit, et il refuse de fusionner. Le contenu d'une PR nommée a été validé avant d'être nommé, le capitaine ne le rejuge pas. Cas vécu le 2026-11-13 : un capitaine s'est arrêté devant la PR qui montait la version du plugin, parce que sa consigne lui interdisait de monter la version.

## Après le lancement

- La session dans la carte du programme (ligne du chantier, ou `Capitaines:`), une ligne au journal, commit et push.
- `send_later` à 20 minutes, puis `get_session` : `blocked` ou `failed` se lit par `list_events` (`kinds: ["assistant"]`) — un refus d'attache s'y voit même quand son `send_message` n'est pas arrivé.
- Un refus d'attache : la ligne au journal, le produit prévenu, rien de contourné (`SKILL.md` § 5).
- Ensuite, un message à cette session ne fait que **nommer le travail** (une spec validée, des PR à traiter) ; il n'ajoute ni ne change jamais une règle.
