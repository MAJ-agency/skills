# Les skills des rôles à deux régimes : chantier, architecte, fusionner et sujet disent en tête comment lire le régime, décrivent le régime 8, et renvoient à regime-7.md (lot 6b, bascule 8.0.0)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le texte entier est dans le patch commun aux tickets 80, 81 et 82 ([`80-82-annexes/lot-6.patch`](80-82-annexes/lot-6.patch), sha256 `1ceca4a337704551b77ef241668c3549bc02a3819a161cd095cdf5f5ff850818`, `git apply` sur `97d17e3`), décrit fichier par fichier ci-dessous ; les gestes sont ceux du ticket 80, « À faire, dans l'ordre » (une seule PR). Rien n'est à concevoir : qui veut changer une phrase l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/chantier/SKILL.md`, `skills/chaine/chantier/references/regime-7.md` (neuf), `skills/chaine/chantier/references/CONTENU.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/sujet/SKILL.md`, `scripts/veille-du-capitaine.test.mjs` ; et, communs aux trois tickets, `scripts/bascule.test.mjs`, `scripts/depot.test.mjs`, `README.md` (l'arbre), `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`. Recouvrement avec les tickets de suite 75 à 79 : `fusionner/SKILL.md` si l'un d'eux le touche (la sortie 69 des calculs, les PR de fourche, `A-192`) ; ce lot passe alors après lui et le patch se repose par `git apply -3` (ticket 80, § 2), tout conflit hors des fichiers de version arrêtant la session.

## Le besoin

Ce ticket réalise la partie **6b** de la spec (section « Les lots », point 6) : **les skills des rôles à deux régimes** (`A-98`). Les sessions lisent `chantier`, `architecte`, `fusionner` et `sujet` dans le marketplace, quelle que soit la branche de leur PR : ces skills servent une PR en régime 7 comme une PR en régime 8, jusqu'au nettoyage (`A-102`). Chacun dit en tête comment lire le régime, puis décrit le régime 8 ; ce qui est propre au régime 7 part dans `regime-7.md`, qu'ils citent. Aucun `SKILL.md` ne dépasse 200 lignes (`A-98`, `A-108` ; après le patch : 136, 131, 139, 108).

La partie porte en plus, d'après les décisions récentes :

- **`archive_session` refusé au conducteur** (`A-185` point 8, `P-62`) : `chantier` § 6.6 et § 7 lui faisaient archiver ses filles, ce que la garde du mode « Auto » refuse ; il les nomme à l'architecte (`à archiver : <session>, <ticket>, <coût>`), avec leurs sessions de relecture (`A-87`), et l'architecte archive.
- **Le `trigger_id` de la garde de la veille du capitaine** (`A-187` point 3, `A-190` mineur 12) : noté à chaque `send_later`, supprimé (`delete_trigger`) avant l'arrêt et l'archivage du capitaine, retrouvé par `list_triggers` sous « Garde de la veille du capitaine » s'il est perdu.
- **Les mineurs 8, 9, 11, 12 et 13 de la PR 150** (`A-194` point 4 ; rapport `74-annexes/contre-relecture-fb0ecb0/rapport.md`, constats 8, 9 et 11 du premier tour, 12 et 13 du second).
- **La sous-PR sautée qui garde son sujet** (`A-185` point 2).
- **Le régime 8 dans `fusionner/SKILL.md`**, que la relecture du commit de fusion de la PR 149 a relevé (`71-73-annexes/contre-relecture-9eb4e14/rapport.md`, § 3, « Note »).

## Où

| Fichier | Ce qui change (le patch fait foi) |
| --- | --- |
| `skills/chaine/chantier/references/regime-7.md` (neuf) | Comment lire le régime ; puis, par rôle, ce qui ne vaut qu'en régime 7 : le conducteur (`Label: contre-revue`, la contre-revue, l'ordre de passage du régime 7, la livraison après contre-revue, le module sensible et le socle posés au cadrage), la session qui code, l'architecte, le capitaine (la table « La règle » d'avant, la section de revue lue dans le corps), les sujets (le corps type de réception avec sa « Revue de ticket »). |
| `skills/chaine/chantier/SKILL.md` | En tête, **Deux régimes** ; § 0 : le socle posé ensuite sur un dépôt à chaîne est un ticket (`A-73`), et le point 6 vérifie le Relecteur (`A-83`), le point 5 restant celui des capitaines (cité par `architecte`) ; § 1 : la ligne `Relecteur:` de la fiche ; § 3 : **Fichiers sensibles : l'accord avant le code** (`A-74`, `A-75`), `Relecture: double` (`A-90`), le module sensible par un ticket (`A-73`), la section `## Fichiers sensibles` soumise avec le découpage ; § 5 : le régime lu dans `sujet.sh demarrer` ; § 6, point 5 : **la relecture est indépendante** (`A-94`) — arbitrer (`A-88`), recevoir un plafond (`A-89`), la règle haute (`A-90`), les PR sans étiquette (`A-86`) — et le Relecteur qui étiquette ; point 6 : le coût des filles et de leurs sessions de relecture, puis `à archiver` (`P-62`, `A-87`) ; § 7 : la livraison étiquetée aussitôt (`P-60`, `A-92`), les dernières sessions nommées ; « Ne jamais ». ; **retouches du tour de relecture** (`A-196`) : § 3, point 5, la PR de cadrage demande sa relecture en régime 8 (`Conducteur: —`), jamais `à-fusionner`, et le capitaine ne la squashe que validée (§ 4) ; § 6.5, « sur la PR d'une fille » le conducteur ne pose aucune des trois étiquettes, ses propres PR (cadrage, documentation, nettoyage) demandent leur relecture comme celle d'une fille ; « régime 8 » dit au § 3 (fichiers sensibles) et au § 6.5 ; § 0, point 4, la pose du socle sur un dépôt sans la chaîne est en régime 7 (`à-fusionner` par le conducteur) et « aucune autre fille » ; la ligne du Relecteur « remplacée au plafond de contexte » notée dans `## Dépassements` (`A-87`). |
| `skills/chaine/chantier/references/CONTENU.md` | Ce que porte `regime-7.md`, et quand il sort. |
| `skills/chaine/architecte/SKILL.md` | En tête, **Deux régimes** (le dépôt sans la chaîne garde sa procédure) ; § 4 : un Relecteur par dépôt, la ligne `Relecteurs:` ; § 5 : en régime 8, la PR livrée demande sa relecture, l'architecte arbitre les PR du conducteur, décide au plafond, traite les lignes du Relecteur ; le Relecteur relevé au contrôle de vie ; **Archiver** (`P-62`, `A-87`, `A-188`) ; § 7 : sa PR de documentation demande sa relecture, une PR étrangère reçoit `à-relire` ; « § 5 » sans numéro d'étape ; § 8 neuf, **La repose d'un dépôt au régime 8** (`A-99`, quatre gestes ; `depuis` ; `create_session` retiré, `A-182` point 3). |
| `skills/chaine/architecte/references/lancement.md` | Le prompt de la session d'un ticket : la phrase qui portait le régime des dépôts à chaîne et la procédure de `skills` est coupée en deux, seule la première moitié change (`A-94`, `A-101`) ; l'architecte à la place du conducteur ne contre-relit plus en régime 8 ; **Archiver un capitaine** : sa garde d'abord (`A-187` point 3). Une garde introuvable (déjà supprimée par le capitaine) : rien de plus. |
| `skills/chaine/fusionner/SKILL.md` | En tête, **Deux régimes** ; « La règle » : la table du régime 8 (le Relecteur y entre) ; section neuve **Le verdict (régime 8)** (`A-91`, `A-105`, `A-107`, `A-76`, `A-92`, `A-113` ; **une sous-PR sautée ainsi garde son sujet**, `A-185` point 2) ; `CAPITAINE_ID` sans `boucle.sh --reprendre` (mineur 9) ; la sortie 9 « boucle sans veille » dite une fois, avec le pid du `REFUS` et `9>&-` (mineur 12) ; la sortie 10 levée par qui l'a posée (mineur 13) ; le `trigger_id` de la garde (`A-187` point 3) ; le point 2 de la garde nomme la ligne `CAPITAINE_ID requis` (mineur 8) ; le point 3 note l'heure de son `--arreter` et reconnaît son propre arrêt resté posé (mineur 11) ; « Fin de passage » : le capitaine n'archive aucune session. |
| `skills/chaine/sujet/SKILL.md` | En tête, **Deux régimes** ; la session demande la relecture ; « Recevoir develop dans un sujet » récrit pour le régime 8 (`A-98`) : le corps type sans « Revue de ticket », la PR de réception relue sur ce que rend `sujet.sh a-juger` (`A-78`, `A-92`, `A-164`), le verdict contrôlé deux fois ; la livraison étiquetée aussitôt (`P-60`). |
| `scripts/veille-du-capitaine.test.mjs` | Les phrases des mineurs 8, 11, 12, 13 et du `trigger_id`, exigées à leur place ; la ligne `CAPITAINE_ID requis` lue dans `veille.sh`, la forme `date +%FT%T` lue dans `boucle.sh`. |
| `scripts/depot.test.mjs` | « Une sous-PR à la fois » : la phrase du Relecteur dans `chantier`, celle du régime 7 dans `regime-7.md` ; « Recevoir develop » : le corps type du régime 8 sans « Revue de ticket », celui de `regime-7.md` avec. |
| `scripts/bascule.test.mjs` | Les tests des rôles (tête, renvoi, `regime-7.md`, conducteur, capitaine, sujet, architecte, `lancement.md`). |
| `README.md` | L'arbre : `chantier/references/` porte `regime-7.md`. |

## Décisions

1. **Un seul `regime-7.md`, sous `skills/chaine/chantier/references/`**, cité par les quatre skills par un lien relatif (`references/regime-7.md` depuis `chantier`, `../chantier/references/regime-7.md` depuis les trois autres), qui vaut dans le cache du plugin comme dans le marketplace (même arborescence). Chaque skill cite sa section (« L'architecte », « Le capitaine », « Les sujets »). Il sort au nettoyage (`A-102`).
2. **Le texte du régime 8 reste dans les `SKILL.md`** : les quatre tiennent sous 200 lignes avec lui ; aucune référence « régime 8 » n'est nécessaire (`A-98`).
3. **Le régime se lit dans `sujet.sh demarrer`** pour une session (sa ligne `régime 8 : relecture indépendante ; …`, que le lot 5c écrit quand la base porte la clé) ; les scripts du capitaine le lisent eux-mêmes PR par PR. Les skills donnent la règle d'`A-97` en une phrase, sans commande à jouer.
4. **Sur la PR d'une fille, le conducteur ne pose ni ne retire jamais** `à-fusionner`, `à-relire` ou `à-reprendre`, avec une exception : une PR de son sujet qui ne porte aucune des quatre étiquettes et dont la fille est finie ou muette, où il pose `à-relire` avec `Session: —` (question 5 du ticket 82). Une livraison de sujet, il l'étiquette `à-fusionner` aussitôt (`P-60`).
4 bis. **Les PR du conducteur** (cadrage, documentation, nettoyage) demandent leur relecture en régime 8 comme celle d'une fille, avec `Conducteur: —`, jamais `à-fusionner` ; une contestation va à l'architecte (sans programme, au produit) (`A-196` point 1, `A-94`). Sans cela, la PR de cadrage de chaque chantier en régime 8 recevait `à-fusionner` du conducteur, puis `à-reprendre` du Relecteur (règle 3, cause a), et le chantier s'arrêtait en phase 3.
5. **Archiver** (`P-62`) : ni le conducteur ni le capitaine n'appellent `archive_session` ; l'architecte archive, sur les lignes du conducteur ; un capitaine s'archive par son lanceur, sa garde supprimée d'abord (`A-188`).
6. **Le point 5 du § 0 de `chantier` reste celui des capitaines** (« `chantier/SKILL.md` § 0, point 5 » est cité par `architecte` et figé par un banc) : la vérification du Relecteur est le point 6.
7. **La phrase de `lancement.md` coupée en deux** (`A-101`) : la moitié des dépôts à chaîne dit le régime 8 puis, pour le régime 7, « selon la ligne Label: » ; la moitié du dépôt sans la chaîne (`à-fusionner au sommet <sha>`, les verdicts de contre-relecture) ne change pas d'un mot : le dépôt `skills` garde sa procédure jusqu'à son lot (lot 8).

## Questions à l'architecte

Celles de la PR sont au ticket 82, tranchées par `A-195` (les huit du rédacteur) et `A-196` (les cinq du tour de relecture).

## À faire, dans l'ordre

Comme le ticket 80, § 0 à § 3 : une seule PR, un seul patch, la version 8.0.0.

## Surfaces

| Surface | Prouvée par |
| --- | --- |
| La tête des quatre skills, avant leur première section ; le lien vers `regime-7.md` qui mène au fichier ; la section citée | `bascule.test.mjs`, « les quatre skills des rôles… » |
| `regime-7.md` : ses cinq sections, sa lecture du régime | idem |
| Ce qui ne vaut qu'en régime 7 n'est plus dans les skills | `bascule.test.mjs`, « regime-7.md garde… » |
| Le conducteur : relecture indépendante, arbitrage, plafond, règle haute, PR sans étiquette, coût puis « à archiver », Fichiers sensibles, points 5 et 6 du § 0, « Ne jamais » | `bascule.test.mjs`, « le conducteur en régime 8… » |
| La PR de cadrage et les PR du conducteur en régime 8 ; le socle posé en régime 7 ; le plafond de contexte d'une session de relecture | `bascule.test.mjs`, « le conducteur en régime 8… » (R10, R12, R13) |
| Le capitaine : la table, « Le verdict », la sous-PR qui garde son sujet, « Fin de passage », `CAPITAINE_ID` (mineur 9) | `bascule.test.mjs`, « le capitaine en régime 8… » |
| Sujet : demander la relecture, la PR de réception relue, `a-juger`, la livraison | `bascule.test.mjs`, « sujet en régime 8… » ; `depot.test.mjs`, « sujet/SKILL.md a la section Recevoir develop… » |
| L'architecte : Relecteur, arbitrage, plafond, archivage, la repose en quatre gestes dans l'ordre | `bascule.test.mjs`, « l'architecte en régime 8… » |
| `lancement.md` : la phrase coupée en deux, l'archivage d'un capitaine | `bascule.test.mjs`, « lancement.md : la phrase du régime… » |
| Les mineurs 8, 11, 12, 13 de la PR 150 et le `trigger_id` | `veille-du-capitaine.test.mjs`, « une fin sans ligne finale… » et « le réveil de garde… » |
| L'ordre de passage du régime 7 dans `regime-7.md` | `depot.test.mjs`, « une sous-PR à la fois par sujet… » |
| Les `SKILL.md` sous 200 lignes | `depot.test.mjs`, « aucun SKILL.md ne dépasse 200 lignes » |

## Vérification

Celle du ticket 80, pour la PR entière. Les mutations de ce ticket : B1 à B21, V1 à V6, D1, R1, R4 à R7, R10, R12, R13.

## Ce qui n'a pas été établi

1. **Une session réelle de chaque rôle** qui suit son skill en régime 8 (un conducteur qui arbitre, un capitaine qui saute une sous-PR illisible et garde le sujet, un architecte qui décide au plafond) : c'est l'essai réel du ticket 82, cas 15, 18, 21, 22 et 23 ; et en régime 7 sous 8.0.0, son cas 12, joué le jour de la fusion (`A-196` point 3).
2. **`delete_trigger` sur la garde d'un capitaine par l'architecte** : l'outil exige que le scheduled task appartienne au compte de la session qui l'appelle ; toutes les sessions écrivent sous le compte du produit, ce qui devrait suffire, non essayé.
3. **Le refus d'`archive_session` à un capitaine** : vu pour le conducteur (`P-62`), supposé pour le capitaine, qui tourne dans le même mode sans humain.

## Hors périmètre

- Les scripts du capitaine, du Relecteur et des gardes (tickets de suite 75 à 79).
- La procédure du dépôt `skills` (lot 8, `A-101`) ; le nettoyage de `regime-7.md` (lot 9, `A-102`).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur la spec (lot 6, partie b ; `A-73` à `A-76`, `A-83`, `A-86` à `A-94`, `A-98`, `A-101`, `A-185`, `A-187`, `A-188`, `A-190`, `A-194`, `P-62`) et sur `origin/main` à `97d17e3` (plugin 7.39.0).
- 2026-11-22 — Repris par le relecteur des tickets après son tour (`A-196`) : le bloquant (la PR de cadrage du conducteur et ses propres PR en régime 8), « régime 8 » dit au § 3 et au § 6.5 de `chantier`, le § 0 point 4, le plafond de contexte d'une session de relecture, la garde introuvable de `lancement.md` ; bancs et mutations R1, R4 à R7, R10, R12, R13.
