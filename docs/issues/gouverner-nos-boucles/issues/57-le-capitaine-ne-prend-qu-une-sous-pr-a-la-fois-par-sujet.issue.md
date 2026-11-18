# Une sous-PR à la fois par sujet : le capitaine le tient par l'ordre de sa file, le conducteur ne retire plus l'étiquette

Status: needs-info
Type: task
Label: contre-revue
Modèle: opus — une règle d'ordre dans la boucle du capitaine, avec ses cas de reprise, et son banc sur le faux GitHub ; deux phrases de skills et un test de dépôt.
Blocked by: — dans ce programme. Hors programme : `skills/chaine/fusionner/scripts/boucle.sh` est un fichier chaud des tickets 2, 3, 4, 8 et 9 du programme « capitaine à jour et testé », `skills/chaine/chantier/SKILL.md` de ses tickets 4 et 5 ; partir de `main` une fois leurs PR entrées. Dans ce programme, le ticket 56 touche le même alinéa voisin de `chantier/SKILL.md` : l'un après l'autre.
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs` (ou le banc de la boucle, à lire sur `main`), `skills/chaine/fusionner/SKILL.md`, `skills/chaine/chantier/SKILL.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

Ce ticket réalise la décision `A-104` de la carte `docs/issues/gouverner-nos-boucles/map.md` (2026-11-18).

**Ce que la 7.16.0 a posé**, lu sur `origin/main` à `1c4acb1` (7.17.0). Depuis la règle d'ascendance, le capitaine met à jour et reteste toute sous-PR en retard sur son sujet. Deux sous-PR étiquetées ensemble se remettent donc l'une l'autre en retard, et la CI repasse à chaque fois. La 7.16.0 a confié la parade au conducteur :

- `skills/chaine/fusionner/SKILL.md` : « Dans un sujet, une seule sous-PR porte `à-fusionner` à la fois : le conducteur y veille (skill `chantier` § 6) » ;
- `skills/chaine/chantier/SKILL.md`, § 6 point 5 : « **Une sous-PR à la fois par sujet.** […] À chaque réveil, quand plusieurs sous-PR d'un même sujet portent `à-fusionner`, le conducteur ne le laisse qu'à la plus ancienne », puis il le repose sur la suivante ;
- `scripts/depot.test.mjs` exige la première phrase.

**Pourquoi le changer.**

1. Le conducteur ne se réveille que toutes les 45 minutes : après chaque fusion, la sous-PR suivante attend son étiquette jusqu'à 45 minutes, alors qu'elle est prête.
2. C'est une discipline tenue par une session, pas un calcul : un conducteur coupé, relevé ou en retard laisse deux sous-PR étiquetées, et le défaut revient sans que rien le dise.
3. Le chantier « relecture indépendante » (spec `../relecture-independante.spec.md`) pose l'étiquette `à-fusionner` par le Relecteur, sur verdict. Une étiquette retirée d'une PR validée y ferait tourner trois règles en boucle (rapport `../relecture-independante.verif-716.md`, § 2.3).

**La règle nouvelle.** Le capitaine ne prend, à chaque tour de sa boucle, que **la plus ancienne des sous-PR étiquetées de chaque sujet**. Les autres attendent : ni mise à jour, ni CI, ni renvoi, et elles gardent leur étiquette. Le conducteur n'a plus rien à retirer ni à reposer.

## Où

- `skills/chaine/fusionner/scripts/boucle.sh`, fonction `traiter_sujets` : elle lit la file (`file.sh`, ordre « sous-PR de sujet, livraisons de sujet, `prio:haute`, puis numéro croissant ») et passe chaque sous-PR prête à `sujet.sh fusionner`, ou à `sujet.sh relancer` quand elle est sans CI. C'est là que la règle se place : aucun autre script n'est touché.
- `skills/chaine/fusionner/SKILL.md` et `skills/chaine/chantier/SKILL.md` : les deux phrases citées.
- `scripts/depot.test.mjs` : le test qui exige la phrase de `fusionner/SKILL.md`.

## Décisions

1. **La règle vit dans `traiter_sujets`, pas dans `file.sh`.** `file.sh` reste la lecture de la file, que le conducteur et l'architecte lisent aussi : une sous-PR qui attend son tour doit continuer d'y paraître.
2. **Un sujet est « tenu » pendant un tour par la première de ses sous-PR que la boucle traite**, dans l'ordre de `file.sh`. Les suivantes du même sujet sont sautées avec une ligne de journal : `[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>`.
3. **Le sujet est rendu, dans le même tour, quand sa sous-PR sort de la file** : fusionnée (sortie 0), renvoyée (sorties 3 et 4, `relancer` en 2 ou 4), ou non éligible (sortie 7, autre sortie non classée). La suivante est alors traitée dans le même tour. **Il reste tenu** quand la sous-PR reste dans la file : reprise (5), arbre de travail pas propre (6), mise à jour poussée et CI en cours (8), échec d'un outil du capitaine (11), `relancer` réussi ou en 6. La sortie 12 arrête la boucle, comme aujourd'hui.
4. **Tout état d'une sous-PR que la boucle fait passer par `sujet.sh fusionner` ou `sujet.sh relancer` suit la règle**, y compris un état ajouté par un ticket entré avant celui-ci (par exemple « en conflit »). Les autres gestes de `traiter_sujets` (regrouper, recibler, `hors-sujet`) ne tiennent pas le sujet.
5. **La PR de mise à jour d'un sujet suit la même règle** : elle passe à son rang dans la file.
6. **Les deux phrases des skills changent de sujet grammatical** : c'est le capitaine qui ne prend qu'une sous-PR à la fois par sujet ; le conducteur peut étiqueter toutes les sous-PR prêtes d'une vague. La phrase « le conducteur ne le laisse qu'à la plus ancienne » et le geste de reposer l'étiquette disparaissent.
7. **Version : mineure** (un comportement du capitaine change), avec sa note : « Ce qu'un projet fait pour en profiter » dit de reposer les scripts du capitaine (`/maj-skills:fusionner poser`) et de relancer sa boucle ; d'ici là, le conducteur garde l'ancienne discipline.

## À faire, dans l'ordre

1. Relire sur `main` l'état de `traiter_sujets` et la liste des sorties de `sujet.sh fusionner` et `relancer` : les tickets entrés depuis ont pu en ajouter. Classer chaque sortie dans « rend le sujet » ou « le tient » selon la Décision 3 ; une sortie nouvelle qui laisse la sous-PR dans la file tient le sujet.
2. Banc d'abord, sur le faux GitHub, rouge avant le code : deux sous-PR étiquetées d'un même sujet, la plus ancienne en retard ; au premier tour la plus ancienne est mise à jour (sortie 8) et **la seconde n'est ni mise à jour ni fusionnée** ; au tour suivant la première entre, et la seconde est prise dans le même tour. Puis : la plus ancienne renvoyée, la seconde prise dans le même tour ; deux sujets, une sous-PR chacun, les deux traités dans le même tour ; trois sous-PR, une seule mise à jour poussée par tour.
3. Le code dans `traiter_sujets`.
4. Les deux phrases des skills, puis le test de `scripts/depot.test.mjs` : il exige la phrase nouvelle de `fusionner/SKILL.md` et refuse l'ancienne (`assert.ok(!texte.includes(…))`).
5. Version et note.

## Surfaces

| Surface | Preuve |
| ------- | ------ |
| `traiter_sujets` : un sujet tenu par sa plus ancienne sous-PR | le banc du point 2, ses quatre cas |
| `fusionner/SKILL.md`, `chantier/SKILL.md` | le test de `scripts/depot.test.mjs` |

## Vérification

1. La suite entière du dépôt, verte.
2. Mutations, chacune rouge puis retirée : la règle retirée (les deux sous-PR sont mises à jour au même tour) ; le sujet tenu après une fusion (la seconde attend un tour de trop) ; le sujet rendu après une sortie 8 (la seconde est mise à jour pendant la CI de la première).
3. Compter les mises à jour poussées dans le journal du banc à trois sous-PR : trois en tout, une par sous-PR.

## Ce qui n'a pas été établi

- L'ordre de `file.sh` entre deux sous-PR d'un même sujet est le numéro croissant, lu dans son en-tête ; non rejoué.
- Le nom du banc de la boucle sur `main` au moment de partir.

## Hors périmètre

- `sujet.sh` et `passer.sh` : rien à y changer.
- Les PR vers `develop` : la file y est déjà traitée une PR à la fois.
- Le protocole des étiquettes de la relecture indépendante : spec du chantier 3, lots 4 à 6, qui supposent ce ticket entré.

## Comments

- 2026-11-18 — Architecte : écrit au niveau de la décision, sans repère de ligne, parce que `boucle.sh` bouge sous les tickets de l'autre programme. **`needs-info` jusqu'à leur entrée** ; il passe alors `ready-for-agent` après une relecture par un agent neuf sur `main`.
