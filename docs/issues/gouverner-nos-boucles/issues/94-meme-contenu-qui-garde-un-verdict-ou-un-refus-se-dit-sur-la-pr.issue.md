# Quand « même contenu propre » garde un verdict ou un refus, le Relecteur l'écrit sur la PR, une fois, avec la raison du calcul

Status: ready-for-agent
Type: défaut
Modèle: opus — une trace neuve dans la décision que partagent le Relecteur et le capitaine (`decision-relecteur.mjs`), un geste neuf, l'écriture dans `jouer` entre la pose et le retrait des étiquettes, et leurs bancs ; la forme et la place de la note sont les décisions `A-224` et `A-239`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/decision-relecteur.mjs` (en-tête 9-21, `MARQUES` et `PREFIXE_TRACE` 103-119, `lireMarques` 121-187, `etiqueter` 388, règle 2 400-401, règle 4 417-422) et `decision-relecteur.test.mjs` (H16, 279-289) ; `skills/chaine/relecteur/scripts/relecteur.mjs` (en-tête 39-54, `decision` 271-309, `jouerGeste` 349-376) et `relecteur.test.mjs` (« même contenu propre », 213-233) ; `skills/chaine/relecteur/SKILL.md` (table « À chaque réveil » 35-43, paragraphe de `jouer` 45) et `references/CONTENU.md` (11, 17) ; `skills/chaine/fusionner/references/CONTENU.md` (63) ; `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` ; `scripts/relecteur.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Les tickets 95 et 96 vont dans la même PR, après celui-ci** (94, puis 95, puis 96, `A-232`) et touchent `relecteur.mjs`, `SKILL.md`, les deux bancs du Relecteur, `lireMarques`, `decider` et `jouerGeste` : ils reprennent la trace, le geste et la table de ce ticket. Une seule montée de version pour les trois. Le ticket 93 ne touche aucun de ces fichiers.

## Le besoin

Constat (13) de l'essai réel du régime 8 (carte, entrée « Fin de l'essai réel du régime 8 ») : **aucune note sur la PR quand `meme-contenu` garde un verdict ou un refus**. Deux cas vus sur le dépôt jouet :

- **un refus gardé** (#7, puis #17, carte, entrées du 2026-11-23 à 10 h 52 et du 2026-11-24 à 01 h 25) : l'auteur pousse un commit, repose `à-relire` ; le Relecteur rend `à-reprendre` sans tour neuf, trois fois sur #17. La ligne à l'auteur dit « verdict écrit sur la PR <n> : refusé », la PR ne dit rien de plus : ni l'auteur, ni le conducteur, ni l'architecte ne voient que le refus d'un sommet plus ancien vaut pour la tête, ni pourquoi ;
- **un verdict gardé** (#15, entrée du 2026-11-24 à 00 h 07) : la mise à jour du capitaine change la tête ; le tour 2 validé vaut pour elle (même contenu), la PR entre sans distribution, et rien sur la PR ne le dit.

Le besoin : **une note sur la PR qui le dit** — le tour gardé, son sommet, son verdict, la tête pour laquelle il vaut, et la raison que rend `meme-contenu.sh`.

## Le mécanisme, établi à la source

Lignes lues sur `origin/main` à `b57eae7` (plugin 8.5.0 ; `skills/chaine/relecteur/` et les scripts de `fusionner` cités ici sont ceux de 8.4.0, inchangés).

- `relecteur.mjs:291-297` joue `meme-contenu.sh <sommet du tour> <tête> <base>` pour chaque sommet de tour autre que la tête, et ne garde que le code de sortie (`true`, `false`, `illisible`) : la raison, une ligne sur la sortie d'erreur (`meme-contenu.sh:61`, écrite par `rendre`, `:73-77`, caractères de contrôle remplacés par des espaces, `:74` ; par exemple `de V à T : 1 fusion(s) de origin/<B>, 0 commit(s) d'index générés`, `:399`), est perdue.
- `decision-relecteur.mjs:277-283` (`tourQuiJuge`) et `:267` (`surLaTete`) font porter un tour sur la tête quand `memeContenu[sommet]` vaut `true`. La règle 2 (`:401`) rend `etiqueter` `à-fusionner`, ou `rien` (`etiquette-en-place`) ; la règle 4 (`:419-421`) rend `etiqueter` `à-reprendre`. Aucun des deux gestes ne dit que le tour qui juge porte sur un autre sommet.
- `jouerGeste` (`relecteur.mjs:349-376`) pose l'étiquette (`:365`), écrit le commentaire du plafond, de la panne ou de l'illisible (`:370-373`), puis retire les anciennes (`:374`) ; aucune autre écriture.
- Une étiquette déjà en place rend `rien` (`decision-relecteur.mjs:388`) : `passe` ne réveille personne, `jouer` n'est pas joué. C'est le cas de #15 (`à-fusionner` posée avant la mise à jour du capitaine). La règle 4 ne rend jamais ce `rien` : sans `à-relire` ni `à-fusionner`, la PR est hors de la file (`:364-365`) ; avec l'une des deux, `retirer` n'est pas vide.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-224`**, amendée par **`A-239` (1)** et **`A-240` (1)** (spec `relecture-independante.spec.md`, section des décisions). Ce qui suit les applique ; rien n'y est à trancher.

1. **La note est une trace, jamais une marque qui décide.** Sa forme, une ligne : `Même contenu — sommet <tête> — tour <k> <validé|refusé> au sommet <sommet du tour> — <raison>`, les deux sommets en 40 caractères hexadécimaux minuscules. `FORME_NOTE` : `^Même contenu — sommet (<SHA>) — tour ([1-9][0-9]*) (validé|refusé) au sommet (<SHA>) — (\S.*)$`, sur le corps lu (`corpsLu`), sans drapeau `m` : le corps entier tient sur une ligne. **`<raison>`** : la dernière ligne non vide de la sortie d'erreur du calcul `meme-contenu.sh` pour ce sommet, blancs de bord retirés, comme `derniere` (`relecteur.mjs:190`) mais sur la seule sortie d'erreur (la sortie standard est le mot du verdict) ; quand la sortie d'erreur n'a aucune ligne non vide, la raison est le texte fixe `sans raison écrite` (jamais une note vide : `FORME_NOTE` exige un premier caractère non blanc, et une raison vide ne se relirait pas). `ecrireNote({ tete, tour, verdict, sommet, raison })`, exportée par `decision-relecteur.mjs`, compose le texte et le relit par `FORME_NOTE` (comme `ecrireDistribution`, 77-87) : hors de la forme, `TypeError`.
2. **Sa lecture.** `lireMarques` la lit dans une liste `notes` (`{ id, rang, date, tete, tour, verdict, sommet }`). Elle **n'entre pas dans `dernier`**, comme les traces d'illisible (`:135-136`, `:162-168`) : elle ne change ni la ligne qui repart à la pose d'une étiquette (`poseeApres`), ni `illisible-signale`. Un commentaire au préfixe `Même contenu — ` sans la forme est une marque presque à la forme : il entre dans `presque` par le même chemin que `Lecture illisible` presque à la forme (`:169-174`), donc `illisible` pour le Relecteur et `LectureIllisible` pour le capitaine (`tourValide`, non tolérant). Une note à la forme ne change pas ce que rend `tourValide`.
3. **Quand** : la règle 2 ou la règle 4 s'applique, le tour qui juge (`tourQuiJuge` pour la règle 2, `dernier` pour la règle 4) a un sommet autre que la tête, et aucune note de `notes` ne porte déjà cette tête et ce numéro de tour. Le geste `etiqueter` porte alors `note: { tour, sommet, verdict }` (la tête est celle de l'état). Quand l'étiquette est déjà en place (règle 2 seule, voir « Le mécanisme »), la décision rend un geste neuf, **`noter`** (`{ regle: 2, geste: 'noter', note: { tour, sommet, verdict }, lignes: [] }`), au lieu de `rien` ; **`noter` ne sert qu'à la règle 2** (`A-239` (1)). La branche « reprise non comptée » de la règle 4 (`distribuer`, `:421`) n'a pas de note : un tour neuf suit, sur la tête. Une tête égale au sommet du tour : aucune note, aucun `noter`.
4. **Qui l'écrit, et quand** (`A-239` (1), qui remplace « en dernier » d'`A-224`) : `jouer <n>`, **après la pose de la nouvelle étiquette et avant le retrait des anciennes**, à la place où s'écrit le commentaire du plafond (`relecteur.mjs:370-373`). Une note refusée (sortie 7) laisse donc `à-relire` sur la PR : elle reste dans la file, et le rejeu rend `etiqueter` avec sa note ; l'étiquette nouvelle est déjà là, posée après la marque la plus récente (la note est hors de `dernier`), donc `poseeApres` vrai et **aucune ligne ne repart**. **Une note refusée ne fait perdre aucune ligne** (`A-240` (1)) : quand l'écriture de la note échoue, `jouer` écrit d'abord sa ligne JSON (`lignes`, les lignes à envoyer ; `joue` vrai, l'étiquette posée), puis sort en 7 ; la session envoie ces lignes, puis rejoue ; le rejeu, l'étiquette posée après la marque la plus récente, ne les renvoie pas. Les autres écritures refusées gardent leur sortie 7 sans ligne JSON. `noter` n'écrit que la note, ne touche à aucune étiquette, n'a aucune ligne. `relecteur.mjs` garde la raison de chaque calcul `meme-contenu.sh` ; `decision-relecteur.mjs` reste pur, sans la raison.
5. **Le capitaine** lit la note par `lireMarques` (non tolérant), comme toute marque : point 2.
6. **La ligne à l'auteur** (`REFUS`, `:390`) ne change pas (`A-224`).
7. **Un réveil de plus** : `noter` réveille la veille une fois par tête et par tour (le cas de #15) ; accepté (`A-224`, « un coût négligeable »).
8. **L'en-tête de `decision-relecteur.mjs`** (9-21) dit la note parmi les commentaires lus, et dit que **deux traces vivent hors de `dernier`, à règles opposées** : la note de ce ticket, dont la forme abîmée est une lecture illisible (un verdict gardé ne disparaît pas sans bruit), et la trace `Demande écartée — ` du ticket 96, dont la forme abîmée est ignorée. Ce ticket écrit la première moitié de la phrase ; le ticket 96 y ajoute la sienne et amende 19-20.
9. **La version** : une seule montée pour la PR de 94, 95 et 96, la suivante de `main` au moment de livrer, au troisième chiffre (8.5.1 sur `main` en 8.5.0), une seule note dans `NOTES-DE-VERSION.md`, écrite par ce ticket et complétée par 95 et 96 ; elle dit qu'un projet repose `fusionner` (le script de la décision est celui de son `develop`) avant que son Relecteur joue la note.

## Où

Lignes lues sur `origin/main` à `b57eae7`.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs` | l'en-tête (9-21) : la note, hors de `dernier` (décision 8) ; `FORME_NOTE`, `PREFIXE_NOTE` (`'Même contenu — '`), `ecrireNote` exportée, sur le modèle d'`ecrireDistribution` (77-87) ; `lireMarques` (140-187, son JSDoc 121-139) : `notes`, lues avant `MARQUES` comme les traces (162-168), presque à la forme par le chemin de 169-174 ; règle 2 (401) et règle 4 (421) : `note` sur `etiqueter`, `noter` à la place de `rien` (388) pour la règle 2 |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs` | **H16, ligne 282, change à dessein** : `assert.deepEqual(joue({ ...mise, memeContenu: { [V1]: true } }), RIEN_EN_PLACE(2))` devient `{ regle: 2, geste: 'noter', note: { tour: 1, sommet: V1, verdict: 'validé' }, lignes: [] }` ; puis les cas neufs (« À faire », étape 2). Les autres asserts sur `memeContenu` vrai ne lisent que `.regle`, `.poser` ou `.lignes` (86-87, 322, 562, 637) ou portent sur un tour au sommet de la tête (477) : ils ne changent pas |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | l'en-tête (39-54) : `noter`, la note de `etiqueter` et sa place ; `decision` (291-297) : garder la raison de chaque calcul (`raisons[s]`) et la passer au geste rendu (`note.raison`, ou le texte de la note) ; `jouerGeste` (349-376) : écrire la note entre la pose (365-366) et le retrait (374), pour `etiqueter` avec `note` et pour `noter` |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | **ligne 227, change à dessein** : `[[2, 'rien', 'etiquette-en-place']]` devient le cas de #15 (`passe` rend `noter`, `jouer` écrit la note, la passe suivante rend `rien`) ; les cas neufs (étape 4) |
| `skills/chaine/relecteur/SKILL.md` | la table « À chaque réveil » (35-43) : une ligne `noter`, « `jouer <n>` ; aucune ligne » ; le paragraphe de `jouer` (45) : « la note de même contenu, entre la pose et le retrait » |
| `skills/chaine/relecteur/references/CONTENU.md` | ligne 11 (ce que `jouer` écrit) et ligne 17 (les cas du banc) |
| `skills/chaine/fusionner/references/CONTENU.md` | ligne 63, la description de `decision-relecteur.mjs` : la note, trace hors de `dernier`, `noter` |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | un cas : une note à la forme sur la PR, le verdict du capitaine inchangé ; une note presque à la forme, illisible |
| `scripts/relecteur.test.mjs` | il ne cite pas la ligne `etiqueter` de la table : rien à changer, sauf un test de texte pour `noter` (la ligne de table, par `ligne(texte, "## À chaque réveil", "| \`noter\` |")`) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main` et sa note (décision 9) |

Modèle à imiter : `ecrireDistribution` (`decision-relecteur.mjs:77-87`) pour `ecrireNote` ; les traces d'illisible dans `lireMarques` (`:162-168`) pour la lecture hors de `dernier` ; le commentaire du plafond dans `jouerGeste` (`relecteur.mjs:369-373`) pour la place de l'écriture ; le test « le plafond » (`relecteur.test.mjs:198-211`) pour l'ordre des écritures lu dans le journal du faux GitHub (`ecritures`, `:79`).

## À faire, dans l'ordre

1. **Partir de `main`** : `git fetch origin main`, une branche neuve depuis `origin/main` ; noter son sommet et sa version (`b57eae7`, 8.5.0 au moment d'écrire). Les tickets 95 et 96 se font ensuite sur la même branche.
2. **Les bancs de la décision, rouges** (`decision-relecteur.test.mjs`) : H16 ligne 282 à sa nouvelle valeur ; le cas de #17 sur la fonction pure (un tour 1 refusé au sommet V1, la tête T, `memeContenu: { [V1]: true }`, `à-relire` : `etiqueter` règle 4 avec `note: { tour: 1, sommet: V1, verdict: 'refusé' }` ; la note de cette tête et de ce tour ajoutée au fil : `etiqueter` sans `note`) ; une tête égale au sommet : aucune `note` ; une note presque à la forme (`Même contenu — sommet …` tronquée) : `illisible` pour `decider`, `LectureIllisible` pour `tourValide` ; une note à la forme : `tourValide` rend le même tour qu'avant ; une note qui n'entre pas dans `dernier` (`lireMarques(...).dernier` inchangé par une note ajoutée) ; `ecrireNote` qui refuse une raison vide ou sur deux lignes et un sommet mal formé ; la reprise non comptée de la règle 4 (`distribuer`, 421) sans note. Les voir rouges.
3. **Le code de la décision** (`decision-relecteur.mjs`) : décisions 1 à 3, l'en-tête (décision 8). Les bancs de l'étape 2 verts, et tout `decision-relecteur.test.mjs`.
4. **Les bancs du Relecteur, rouges** (`relecteur.test.mjs`, sur le faux GitHub et les vrais scripts de develop, `monter`, `pr`, `ecritures`) :
   - **le cas de #17** : un tour 1 refusé au sommet V, un commit d'index seul (ou une fusion de develop, comme le test de la ligne 213), la tête T, `à-relire` reposée : `jouer 12` écrit, dans l'ordre du journal, `POST issues/12/labels à-reprendre`, `POST issues/12/comments` (la note, `Même contenu — sommet T — tour 1 refusé au sommet V — <raison>`), `DELETE issues/12/labels/à-relire` ; `à-relire` reposée une deuxième fois : l'étiquette, aucune seconde note ;
   - **la note refusée** (`d.github({ commentairesRefuses: '^Même contenu — ' })`, `skills/chaine/sujet/scripts/faux-gh.mjs:37-38`) : `jouer 12` écrit sa ligne JSON (`joue` vrai, `lignes` celles du refus, à l'auteur et au conducteur), puis sort en 7, et la PR porte `à-reprendre` **et** `à-relire` ; le refus levé, `jouer 12` rend `etiqueter` avec la note écrite, `lignes` vide, puis `à-relire` retirée ;
   - **le cas de #15**, à la place de la ligne 227 : un tour validé au sommet V, `à-fusionner` en place, la tête T après une fusion de develop : `passe` rend `noter` (règle 2) ; `jouer 12` écrit la note, ne touche à aucune étiquette (`ecritures` : le seul `POST issues/12/comments`), `lignes` vide ; la passe suivante rend `rien` ;
   - **la raison à l'octet** : la raison de la note est la dernière ligne non vide de la sortie d'erreur de `meme-contenu.sh` pour ce sommet, comparée à celle que rend le même calcul joué par le banc ; un talon de `meme-contenu.sh` (`talon`, `:50-56`) qui sort en 0 sans rien sur la sortie d'erreur : la raison `sans raison écrite`.
   Les voir rouges.
5. **Le code du Relecteur** (`relecteur.mjs`) : décision 4, l'en-tête. Les bancs de l'étape 4 verts, et tout `relecteur.test.mjs`.
6. **Le capitaine** : le cas de `verdict-du-capitaine.test.mjs`.
7. **Les textes** : `relecteur/SKILL.md`, les deux `CONTENU.md`, le test de texte de `scripts/relecteur.test.mjs` (rouge avant la ligne de table, vert après).
8. **La version** : `plugin.json` à la suivante de `main` (8.5.1 sur `main` en 8.5.0), la note de version (décision 9) ; un commit. Les tickets 95 puis 96 suivent sur la branche, sans remonter la version.
9. **Les mutations** (« Mutations »), une à une, chacune remise après, puis **la vérification** (« Vérification »).

## Surfaces

| Surface | Banc |
| --- | --- |
| refus gardé : `à-reprendre`, la note, puis le retrait de `à-relire`, dans cet ordre ; une seule note par tête et par tour | `relecteur.test.mjs`, cas de #17 ; `decision-relecteur.test.mjs`, cas de #17 sur la fonction pure |
| note refusée : la ligne JSON et ses lignes rendues avant la sortie 7 (`A-240` (1)), `à-relire` reste, le rejeu écrit la note sans renvoyer de ligne | `relecteur.test.mjs`, la note refusée |
| verdict gardé, étiquette en place : `noter`, la note seule, aucune étiquette, aucune ligne ; puis `rien` | `relecteur.test.mjs`, cas de #15 (ligne 227) ; `decision-relecteur.test.mjs`, H16 (ligne 282) |
| tête égale au sommet du tour : ni note, ni `noter` | `decision-relecteur.test.mjs` |
| la reprise non comptée de la règle 4 n'a pas de note | `decision-relecteur.test.mjs` |
| note presque à la forme : illisible pour le Relecteur et pour le capitaine ; note à la forme : `tourValide` inchangé | `decision-relecteur.test.mjs` ; `verdict-du-capitaine.test.mjs` |
| la note hors de `dernier` : une étiquette posée avant la note, rejouée, ne renvoie pas ses lignes | `decision-relecteur.test.mjs` (`dernier`) ; `relecteur.test.mjs`, la note refusée (`lignes` vide au rejeu) |
| la raison, à l'octet, et `sans raison écrite` quand elle manque ; `ecrireNote` refuse une raison vide ou sur deux lignes | `relecteur.test.mjs`, la raison ; `decision-relecteur.test.mjs`, `ecrireNote` |
| `noter` dans la table « À chaque réveil » | `scripts/relecteur.test.mjs`, le test de texte |

## Mutations

Chacune seule, le fichier remis après, sur `decision-relecteur.test.mjs`, `relecteur.test.mjs`, `verdict-du-capitaine.test.mjs` et `scripts/relecteur.test.mjs` : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la note comptée dans `dernier` | `dernier` ; la note refusée (une ligne repart au rejeu) |
| la note écrite avant la pose de l'étiquette | cas de #17 (ordre du journal) |
| la note écrite après le retrait de `à-relire` (en dernier, comme `A-224` le disait) | la note refusée (`à-relire` retirée) |
| sortie 7 sans ligne JSON quand la note est refusée | la note refusée (aucune ligne rendue) |
| une seconde note pour la même tête et le même tour | cas de #17, seconde repose ; cas de #15, la passe suivante |
| `noter` rendu quand la tête est le sommet du tour | la tête égale au sommet |
| `noter` rendu par la règle 4 (au lieu de `etiqueter`) | cas de #17 sur la fonction pure |
| la raison remplacée par un texte fixe | la raison à l'octet |
| `sans raison écrite` remplacé par une raison vide | la raison, talon muet ; `ecrireNote` |
| la branche `distribuer` de la règle 4 qui note | la reprise non comptée |
| une note presque à la forme ignorée | note presque à la forme (Relecteur et capitaine) |

## Vérification

1. Les bancs ciblés, depuis la racine : `node --test skills/chaine/fusionner/scripts/decision-relecteur.test.mjs skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs scripts/relecteur.test.mjs`, rouges à l'étape 2, 4 ou 7 selon le banc, verts après ; aucun `not ok`.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` : le compte de `main` au départ plus les tests neufs (les écrire dans la PR, avec la durée).
4. Rejouée après 95 et 96, sur la branche entière, avant la PR.

## Hors périmètre

- La cause de l'impasse de #17 (`C1` sur un index dispensé) : ticket 93. La note reste utile après lui : un refus gardé à travers une fusion de la cible.
- Le commentaire de passage du capitaine : il ne dit pas non plus qu'il fusionne sur un verdict de même contenu ; à classer s'il le faut, famille fusionner.
- La sourdine de la veille : ticket 95 ; la demande modifiée : ticket 96.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur le constat (13) de l'essai réel du régime 8, le code lu sur `origin/main` (plugin 8.4.0). Aucun banc joué : le ticket décrit ce qui est à écrire.
- 2026-11-27 — Passé `ready-for-agent` après relecture : `A-224` décidée, amendée par `A-239` (1) (la note entre la pose et le retrait, le rejeu sans ligne, `noter` pour la règle 2 seule) ; ordre 94, 95, 96 dans une PR, puis 97 (`A-232`) ; les deux bancs qui changent à dessein nommés (H16, `decision-relecteur.test.mjs:282` ; `relecteur.test.mjs:227`) ; la raison et le cas où elle manque ; `fusionner/references/CONTENU.md` ajouté ; lignes relues sur `b57eae7` (8.5.0).
