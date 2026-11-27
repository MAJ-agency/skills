# Quand « même contenu propre » garde un verdict ou un refus, le Relecteur l'écrit sur la PR, une fois, avec la raison du calcul

Status: needs-triage
Type: défaut
Modèle: opus — une marque neuve dans la décision que partagent le Relecteur et le capitaine (`decision-relecteur.mjs`), un geste neuf, l'écriture dans `jouer`, et leurs bancs ; la forme exacte de la note est la décision `A-224`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/decision-relecteur.mjs` (en-tête 9-21, `lireMarques` 140-187, règles 2 et 4, lignes 400-422) et `decision-relecteur.test.mjs` ; `skills/chaine/relecteur/scripts/relecteur.mjs` (`decision`, 291-304 ; `jouerGeste`, 349-376) et `relecteur.test.mjs` ; `skills/chaine/relecteur/SKILL.md` (table « À chaque réveil », 35-45) et `references/CONTENU.md` (11, 17) ; `scripts/relecteur.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Le ticket 95 touche aussi `relecteur.mjs`, `SKILL.md` et les deux bancs du Relecteur** : même PR, 94 d'abord, 95 ensuite (`Blocked by: 94` dans 95). Le ticket 93 ne touche aucun de ces fichiers : il peut aller dans la même PR, avant. **Le ticket 96, écrit en parallèle, touche aussi `lireMarques`, `decider`, `jouerGeste` et la table de `SKILL.md`** : l'ordre entre 94 et 96 est à fixer par l'architecte (le second fusionne le premier et reprend ses lignes) ; `Blocked by:` reste vide en attendant.

## Le besoin

Constat (13) de l'essai réel du régime 8 (carte, entrée « Fin de l'essai réel du régime 8 ») : **aucune note sur la PR quand `meme-contenu` garde un verdict ou un refus**. Deux cas vus sur le dépôt jouet :

- **un refus gardé** (#7, puis #17, carte, entrées du 2026-11-23 à 10 h 52 et du 2026-11-24 à 01 h 25) : l'auteur pousse un commit, repose `à-relire` ; le Relecteur rend `à-reprendre` sans tour neuf, trois fois sur #17. La ligne à l'auteur dit « verdict écrit sur la PR <n> : refusé », la PR ne dit rien de plus : ni l'auteur, ni le conducteur, ni l'architecte ne voient que le refus d'un sommet plus ancien vaut pour la tête, ni pourquoi ;
- **un verdict gardé** (#15, entrée du 2026-11-24 à 00 h 07) : la mise à jour du capitaine change la tête ; le tour 2 validé vaut pour elle (même contenu), la PR entre sans distribution, et rien sur la PR ne le dit.

Le besoin : **une note sur la PR qui le dit** — le tour gardé, son sommet, son verdict, la tête pour laquelle il vaut, et la raison que rend `meme-contenu.sh`.

## Le mécanisme, établi à la source (`origin/main`, plugin 8.4.0)

- `relecteur.mjs:291-297` joue `meme-contenu.sh <sommet du tour> <tête> <base>` pour chaque sommet de tour autre que la tête, et ne garde que le code de sortie (`true`, `false`, `illisible`) : la raison, une ligne sur la sortie d'erreur (`meme-contenu.sh:61`, par exemple `de V à T : 1 fusion(s) de origin/<B>, 0 commit(s) d'index générés`, `:399`), est perdue.
- `decision-relecteur.mjs:277-283` (`tourQuiJuge`) et `:267` (`surLaTete`) font porter un tour sur la tête quand `memeContenu[sommet]` vaut `true`. La règle 2 (`:401`) rend `etiqueter` `à-fusionner`, ou `rien` (`etiquette-en-place`) ; la règle 4 (`:419-421`) rend `etiqueter` `à-reprendre`, ou `rien`. Aucun des deux gestes ne dit que le tour qui juge porte sur un autre sommet.
- `jouerGeste` (`relecteur.mjs:349-376`) n'écrit de commentaire que pour `plafonner`, `panne` et `illisible` (`:370-373`).
- Une étiquette déjà en place rend `rien` (`decision-relecteur.mjs:388`) : `passe` ne réveille personne, `jouer` n'est pas joué. C'est le cas de #15 (`à-fusionner` posée avant la mise à jour du capitaine).

## Décision proposée

**`A-224` (provisoire)** — **La note de « même contenu »**, une trace comme `Lecture illisible`, jamais une marque qui décide :

1. **Sa forme**, une ligne : `Même contenu — sommet <tête> — tour <k> <validé|refusé> au sommet <sommet du tour> — <raison de meme-contenu.sh>`, les deux sommets en 40 caractères. `lireMarques` la lit dans une liste `notes` (`{ sommet, tour, verdict }`) ; le préfixe `Même contenu — ` sans la forme est une marque presque à la forme (`presque`), comme pour toute marque. Elle **n'entre pas** dans `dernier`, comme les traces d'illisible (`decision-relecteur.mjs:135-136`) : elle ne change ni la ligne qui repart à la pose d'une étiquette (`poseeApres`), ni `illisible-signale`.
2. **Quand** : la règle 2 ou la règle 4 s'applique, et le tour qui juge (`tourQuiJuge` pour la règle 2, `dernier` pour la règle 4) a un sommet autre que la tête ; et aucune note n'existe déjà pour cette tête et ce tour. Le geste `etiqueter` porte alors `note: { tour, sommet, verdict }` ; quand l'étiquette est déjà en place, la décision rend un geste neuf, `noter`, au lieu de `rien`. La branche « reprise non comptée » de la règle 4 (`distribuer`) n'a pas de note : un tour neuf suit, sur la tête.
3. **Qui l'écrit** : `jouer <n>`, **en dernier** (après la pose et le retrait des étiquettes) : une note refusée (sortie 7) laisse l'étiquette juste, et le rejeu rend `noter`. `relecteur.mjs` garde la raison de chaque calcul `meme-contenu.sh` (sa sortie d'erreur, une ligne) et la place dans la note ; `decision-relecteur.mjs` reste pur, sans la raison. `noter` n'a aucune ligne (`lignes` vide).
4. **Le capitaine** lit la note par `lireMarques` (non tolérant) comme toute marque : une note à la forme ne change pas `tourValide` ; une note presque à la forme est une lecture illisible pour lui aussi.

Raison : la note dit ce que la décision a déjà lu, sur la PR, là où l'auteur, le conducteur et le capitaine la voient ; une trace hors de `dernier` n'ajoute aucun envoi de ligne, et une note par tête et par tour borne les écritures.

## Quand le ticket est fait

1. Le cas de #17 au banc : un tour 1 refusé au sommet V, un commit d'index seul, la tête T, `à-relire` reposée : `jouer` pose `à-reprendre`, retire `à-relire`, puis écrit **une** note `Même contenu — sommet T — tour 1 refusé au sommet V — <raison>` ; `à-relire` reposée une deuxième fois : l'étiquette, aucune seconde note.
2. Le cas de #15 au banc : un tour validé au sommet V, `à-fusionner` en place, la tête T après une fusion de la cible : `passe` rend `noter` (règle 2) ; `jouer` écrit la note, ne touche à aucune étiquette, n'envoie aucune ligne ; la passe suivante rend `rien`.
3. Une tête égale au sommet du tour : aucune note, aucun `noter`.
4. Une note presque à la forme : `illisible` (Relecteur) et `LectureIllisible` (capitaine, `tourValide`) ; une note à la forme ne change pas ce que rend `tourValide`.
5. Une note n'entre pas dans `dernier` : une étiquette posée avant la note, rejouée, ne renvoie pas ses lignes (le cas de `poseeApres`).
6. La raison de la note est la ligne de `meme-contenu.sh` pour ce sommet, à l'octet près (caractères de contrôle déjà remplacés par le calcul, `meme-contenu.sh:74`).
7. `SKILL.md` du Relecteur dit `noter` dans la table « À chaque réveil » (`jouer <n>`, aucune ligne) ; l'en-tête de `decision-relecteur.mjs` et `CONTENU.md` disent la note.
8. La suite entière passe ; la version est la suivante de `main` au moment de livrer, au troisième chiffre (8.4.1 sur `main` en 8.4.0 ; une seule montée si 93 et 95 vont dans la même PR), sa note dans `NOTES-DE-VERSION.md`.

## Où

Lignes lues sur `origin/main` (plugin 8.4.0).

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs` | l'en-tête (9-21) : la note ; une forme `FORME_NOTE` et `ecrireNote` (relue par la forme, comme `ecrireDistribution`, 77-87) ; `lireMarques` (140-187) : `notes`, hors de `dernier` ; règle 2 (401) et règle 4 (419-421) : `note` sur `etiqueter`, le geste `noter` à la place de `rien` |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs` | les cas 1 à 5 ci-dessus, sur la fonction pure |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | `decision` (291-297) : garder la sortie d'erreur de chaque calcul ; `jouerGeste` (349-376) : écrire la note en dernier, pour `etiqueter` avec `note` et pour `noter` ; l'en-tête (39-54) : `noter` |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | les cas 1, 2 et 6, sur le faux GitHub et les vrais scripts de develop |
| `skills/chaine/relecteur/SKILL.md` | la table « À chaque réveil » (35-43) : `noter` avec `etiqueter` ; le paragraphe de `jouer` (45) : « la note de même contenu » |
| `skills/chaine/relecteur/references/CONTENU.md` | lignes 11 et 17 |
| `scripts/relecteur.test.mjs` | ce qu'il tient du texte de `SKILL.md`, s'il cite la table |
| `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` ou `verdict-du-capitaine.test.mjs` | un cas : une note à la forme sur la PR, `verdictDuCapitaine` inchangé |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante et sa note |

## Bancs à écrire

Les cas 1 à 6 de « Quand le ticket est fait », et ces mutations, chacune rouge : la note comptée dans `dernier` ; la note écrite avant la pose de l'étiquette ; une seconde note pour la même tête et le même tour ; `noter` rendu quand la tête est le sommet du tour ; la raison remplacée par un texte fixe ; la branche `distribuer` de la règle 4 qui note.

## Questions à l'architecte

1. **Le texte de la note**, que voient l'auteur et le conducteur : la forme d'`A-224` est une proposition.
2. **La ligne à l'auteur** (`REFUS`, `decision-relecteur.mjs:390`) reste « verdict écrit sur la PR <n> : refusé » : faut-il y ajouter « (même contenu que le sommet <s>) » ? Le ticket ne la change pas.
3. **Un réveil de plus** : `noter` réveille la veille une fois par tête et par tour (le cas de #15, chaque mise à jour du capitaine sur une PR validée). Accepté tel quel par le ticket.

## Hors périmètre

- La cause de l'impasse de #17 (`C1` sur un index dispensé) : ticket 93. La note reste utile après lui : un refus gardé à travers une fusion de la cible.
- Le commentaire de passage du capitaine : il ne dit pas non plus qu'il fusionne sur un verdict de même contenu ; à classer s'il le faut, famille fusionner.
- La sourdine de la veille : ticket 95.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur le constat (13) de l'essai réel du régime 8, le code lu sur `origin/main` (plugin 8.4.0). Aucun banc joué : le ticket décrit ce qui est à écrire.
