# Le verdict d'une contre-relecture s'écrit sur la PR, et aucun ordre de fusion ne passe un verdict non conforme

Status: ready-for-agent
Type: défaut
Modèle: sonnet — des paragraphes de procédure à réécrire dans `architecte/references/lancement.md` et `architecte/SKILL.md`, sans script, et des bancs de texte dans `scripts/depot.test.mjs` ; les décisions sont prises ici, relues par un agent neuf le 2026-11-19.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/SKILL.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (Journal du 2026-11-19, 09 h 35 et 15 h 20 UTC ; décision `A-48`). Demandé par le produit le 2026-11-19.

## Le besoin

**Le défaut.** Le 2026-11-19, la PR 133 de `skills` est entrée dans `main` sans les corrections de sa contre-relecture. Cette contre-relecture, faite par l'architecte de « capitaine à jour et testé », était non conforme, mais son verdict n'était écrit que dans la carte de ce programme et dans le ticket 4 : rien sur la PR. L'architecte d'un autre programme (« gouverner nos boucles »), ouvert sur un autre compte et sans moyen d'écrire aux sessions du premier, a fait sa propre contre-relecture. Elle concluait « fusionnable » ; il a lu la PR (sommet égal, contrôles verts, aucun commentaire), puis posé l'ordre `à-fusionner au sommet 848bc6c…` et le label. Aucune session n'a fauté : le verdict qui aurait arrêté l'ordre était invisible depuis la PR. La PR 135 (7.31.2) a réparé.

**Quand le ticket est fait :**

1. **Le verdict s'écrit sur la PR.** Toute contre-relecture d'une PR, menée par l'architecte (ou par un conducteur) sur une PR d'un dépôt sans la chaîne, laisse sur la PR, dès son verdict rendu, un commentaire dont la première ligne est exactement l'une des deux suivantes. La revue de ticket qu'une session fait de sa propre PR n'est pas une contre-relecture.
   - `contre-relecture non conforme au sommet <sha40>`, suivie des constats bloquants ou à corriger en une ligne chacun ;
   - ou `contre-relecture conforme au sommet <sha40>`.

   `<sha40>` est le sha complet du sommet relu, en 40 caractères hexadécimaux minuscules. La première ligne se lit après retrait des blancs de tête ; le pied de page qu'une session cloud ajoute ne compte pas.
2. **Aucun ordre ne passe un verdict non conforme.** Un **verdict** est un commentaire de la PR qui remplit trois conditions : sa première ligne est exactement l'une des deux lignes du point 1, son `author_association` est `OWNER`, `MEMBER` ou `COLLABORATOR`, et son `updated_at` est égal à son `created_at`. Avant de poser `à-fusionner au sommet <sha>` ou le label `à-fusionner`, la session lit tous les commentaires de la PR. Elle ne pose rien dans deux cas :
   - un verdict `non conforme` porte sur ce sommet ;
   - la PR porte au moins un verdict, quel qu'en soit le sommet, et aucun verdict `conforme` ne porte sur ce sommet.

   C'est le cas de l'incident : un verdict `non conforme` sur un sommet antérieur arrête l'ordre posé sur un sommet plus récent, tant qu'une contre-relecture de ce sommet ne l'a pas déclaré `conforme`. Une session qui contre-relit une PR portant déjà un verdict `non conforme` lit ses constats et les vérifie dans sa propre contre-relecture. Une PR sans aucun verdict n'est pas arrêtée par cette règle : c'est le cas d'une PR qui ne passe pas de contre-relecture (documentation de l'architecte, PR étrangère lue par l'architecte, ticket sans `Label: contre-revue`). Une session qui contre-relit une PR (`Label: contre-revue`) écrit son verdict avant l'ordre, jamais après.
3. **Le capitaine d'un dépôt sans la chaîne vérifie aussi**, dans le bloc « Procédure : » de `architecte/references/lancement.md`, juste après la vérification « Si P n'est pas le `head.sha` que tu viens de lire ». Il compte les verdicts comme au point 2. Si un verdict `non conforme` porte sur P, ou si la PR porte au moins un verdict et qu'aucun verdict `conforme` ne porte sur P, il renvoie la PR et retire le label dans le même geste, avec le commentaire `à-fusionner retiré par le capitaine : contre-relecture non conforme ou absente au sommet ordonné : contre-relire ce sommet, écrire le verdict sur la PR, puis reposer le label et le commentaire`. Ce renvoi compte dans le plafond de trois. Un verdict édité, c'est-à-dire un commentaire d'un de ces comptes dont la première ligne a la forme d'un verdict et dont `updated_at` diffère de `created_at`, l'empêche de fusionner la PR : il le dit au produit, comme pour un renvoi édité. Une PR sans aucun verdict se traite comme aujourd'hui.
4. `architecte/SKILL.md` (§ 5 « Une PR livrée », § 7) et `lancement.md` (bloc de la session d'un ticket hors chantier, ligne « contre-relit lui-même ») disent la même chose. Le prompt de la session d'un ticket hors chantier (`lancement.md`, sa phrase « Dans un dépôt sans .claude/chaine.json … ») porte la règle du point 2. Les prompts du conducteur et du capitaine du skill `fusionner` ne changent pas (décision 3 ; `lancement.md` : « ce prompt ne la recopie pas »).
5. Le plugin prend une version mineure, sur la version de `main` au moment de la PR, après fusion de `origin/main` dans la branche, et `NOTES-DE-VERSION.md` en donne la note. Elle dit trois choses :
   - un capitaine ou une session déjà lancés gardent l'ancienne procédure jusqu'à leur relance ;
   - une PR déjà ordonnée sans aucun commentaire de verdict n'est pas renvoyée pour cela ; l'architecte qui a contre-relu une PR encore ouverte y écrit son verdict ;
   - Iroki et Fedora, dépôts à la chaîne, n'ont rien à faire : leur capitaine (`fusionner`, `revue-exigee.mjs`) ne lit pas ces commentaires, et un verdict écrit sur leurs PR n'y est qu'une information.

## Décisions

1. **Le verdict vit sur la PR**, pas seulement dans une carte : c'est le seul endroit que lisent toutes les sessions, de tous les programmes et de tous les comptes. Le commentaire est écrit par la session qui a lancé la contre-relecture, jamais par le sous-agent relecteur, qui est en lecture seule.
2. **Le format est une ligne fixe**, lue sur sa première ligne, comme `à-fusionner au sommet <sha>`. Raison : un capitaine sans la chaîne lit des commentaires, il n'exécute pas de script.
3. **Hors périmètre** : les dépôts qui ont la chaîne, dont le capitaine (`fusionner`, `revue-exigee.mjs`) lit déjà la section de revue du corps de la PR. Leur extension fera l'objet d'un ticket séparé, si le produit le veut.
4. **Un verdict sur toute PR a été écarté** : il aurait obligé l'architecte à écrire un verdict sur ses PR de documentation et la session d'un ticket sans contre-revue à en écrire un sur sa propre PR, pour un risque que la règle « au moins un verdict » couvre déjà. Un verdict non conforme ne bloque que si quelqu'un a contre-relu ; c'est exactement le cas de l'incident.
5. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la formulation exacte des textes, à condition de garder les deux lignes de verdict du point 1 et le commentaire de renvoi du point 3, tous trois exacts.

## Ordre de travail

1. Un banc de texte dans `scripts/depot.test.mjs`, rouge avant, qui vérifie trois choses :
   - `lancement.md` contient les deux lignes de verdict ;
   - le bloc « Procédure : » contient le renvoi sur un verdict non conforme ou absent ;
   - le prompt de la session d'un ticket, la ligne « contre-relit lui-même » de `lancement.md` et `architecte/SKILL.md` § 5 et § 7 portent la règle du point 2 (« un verdict `non conforme` ») ;
   - le cas de l'incident est figé : un modèle de décision (comme celui du banc des fils de commentaires) rend « renvoyée » pour un `non conforme` sur un sommet antérieur suivi d'un ordre sur un sommet plus récent sans verdict `conforme`, et « fusionnable » pour une PR sans aucun verdict.
2. Les textes.
3. Version et note.
4. `pnpm test` complet, revue de ticket, PR.

## Comments

- 2026-11-19, la fille : formulation prudente, les deux lignes de verdict et le renvoi exacts. Un verdict édité arrête aussi la session qui ordonne (elle le dit à l'architecte). Version 7.32.0 (mineure suivante de `main` 7.31.2, PR 134 non encore fusionnée). La puce « PR étrangère » de `SKILL.md` § 7 lit aussi les verdicts. Revue de ticket jouée (trois sous-agents), écarts corrigés.
