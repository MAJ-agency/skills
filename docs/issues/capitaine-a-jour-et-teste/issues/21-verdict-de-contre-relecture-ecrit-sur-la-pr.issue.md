# Le verdict d'une contre-relecture s'écrit sur la PR, et aucun ordre de fusion ne passe un verdict non conforme

Status: ready-for-agent
Type: défaut
Modèle: sonnet — des paragraphes de procédure à réécrire dans `architecte/references/lancement.md` et `architecte/SKILL.md`, sans script, et un banc de texte dans `scripts/depot.test.mjs` ; les décisions sont prises ici.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/SKILL.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (Journal du 2026-11-19, 09 h 35 et 15 h 20 UTC ; décision `A-48`). Demandé par le produit le 2026-11-19.

## Le besoin

**Le défaut.** Le 2026-11-19, la PR 133 de `skills` est entrée dans `main` sans les corrections de sa contre-relecture. Cette contre-relecture, faite par l'architecte de « capitaine à jour et testé », était non conforme, mais son verdict n'était écrit que dans la carte de ce programme et dans le ticket 4 : rien sur la PR. L'architecte d'un autre programme (« gouverner nos boucles »), ouvert sur un autre compte et sans moyen d'écrire aux sessions du premier, a fait sa propre contre-relecture. Elle concluait « fusionnable » ; il a lu la PR (sommet égal, contrôles verts, aucun commentaire), puis posé l'ordre `à-fusionner au sommet 848bc6c…` et le label. Aucune session n'a fauté : le verdict qui aurait arrêté l'ordre était invisible depuis la PR. La PR 135 (7.31.2) a réparé.

**Quand le ticket est fait :**

1. **Le verdict s'écrit sur la PR.** Toute contre-relecture d'une PR, menée par un architecte ou un conducteur, ou par la session d'un ticket hors chantier, laisse sur la PR, dès son verdict rendu, un commentaire dont la première ligne est exactement :
   - `contre-relecture non conforme au sommet <sha40>`, suivie des constats bloquants ou à corriger en une ligne chacun ;
   - ou `contre-relecture conforme au sommet <sha40>`.

   `<sha40>` est le sha complet du sommet relu.
2. **Aucun ordre ne passe un verdict non conforme.** Avant de poser `à-fusionner au sommet <sha>` ou le label `à-fusionner`, la session lit les commentaires de la PR. Elle ne pose rien si le dernier commentaire de verdict, c'est-à-dire le plus récent dont la première ligne commence par `contre-relecture `, est `non conforme`. Elle ne pose rien non plus si aucun verdict `conforme` ne porte sur le sommet qu'elle ordonne. Une PR non conforme repasse par une contre-relecture, et seul un nouveau verdict `conforme` sur son nouveau sommet la libère.
3. **Le capitaine d'un dépôt sans la chaîne vérifie aussi**, dans le bloc « Procédure : » de `architecte/references/lancement.md`. Avant de fusionner, il lit le dernier commentaire de verdict. S'il est `non conforme`, ou s'il ne porte pas sur le sommet ordonné, la PR est renvoyée, avec le commentaire `à-fusionner retiré par le capitaine : ` suivi du motif, et le label est retiré dans le même geste.
4. `architecte/SKILL.md` (§ 5 « Une PR livrée », § 7) et `lancement.md` (bloc de la session d'un ticket hors chantier, ligne « contre-relit lui-même ») disent la même chose. Les prompts des trois rôles portent la règle du point 2.
5. Le plugin prend une version mineure, et `NOTES-DE-VERSION.md` en donne la note. Elle dit trois choses :
   - un capitaine ou une session déjà lancés gardent l'ancienne procédure jusqu'à leur relance ;
   - une PR déjà ordonnée sans commentaire de verdict est renvoyée par un capitaine relancé, et repasse donc par une contre-relecture ou un verdict écrit ;
   - ce que font Iroki et Fedora.

## Décisions

1. **Le verdict vit sur la PR**, pas seulement dans une carte : c'est le seul endroit que lisent toutes les sessions, de tous les programmes et de tous les comptes. Le commentaire est écrit par la session qui a lancé la contre-relecture, jamais par le sous-agent relecteur, qui est en lecture seule.
2. **Le format est une ligne fixe**, lue sur sa première ligne, comme `à-fusionner au sommet <sha>`. Raison : un capitaine sans la chaîne lit des commentaires, il n'exécute pas de script.
3. **Hors périmètre** : les dépôts qui ont la chaîne, dont le capitaine (`fusionner`, `revue-exigee.mjs`) lit déjà la section de revue du corps de la PR. Leur extension fera l'objet d'un ticket séparé, si le produit le veut.
4. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la formulation exacte des textes, à condition de garder les trois lignes exactes du point 1 et du point 3.

## Ordre de travail

1. Un banc de texte dans `scripts/depot.test.mjs`, rouge avant, qui vérifie trois choses :
   - `lancement.md` contient les deux lignes de verdict ;
   - le bloc « Procédure : » contient le renvoi sur un verdict non conforme ou absent ;
   - les trois prompts portent la règle du point 2.
2. Les textes.
3. Version et note.
4. `pnpm test` complet, revue de ticket, PR.

## Comments
