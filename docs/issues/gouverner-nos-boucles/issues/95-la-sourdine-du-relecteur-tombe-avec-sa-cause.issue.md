# La sourdine de la veille du Relecteur tombe d'elle-même quand sa cause disparaît

Status: needs-triage
Type: défaut
Modèle: sonnet — une option de `veille` qui prend une clé au lieu d'un numéro, sa levée calculée par le script, la ligne `SOURDINES` que la veille rend, le texte du skill qui suit ; la forme et les cas de levée sont la décision `A-225`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 94
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/scripts/relecteur.mjs` (usage, ligne 10 ; en-tête de la veille, 61-68 ; `veille`, 413-452) et `relecteur.test.mjs` (la veille, 316-333) ; `skills/chaine/relecteur/SKILL.md` (lignes 38, 52, 53, 55, 57, 66, 80, 94-99) ; `scripts/relecteur.test.mjs` (lignes 66, 183, 200, 201, 209) ; `skills/chaine/relecteur/references/CONTENU.md` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Le ticket 94 touche les mêmes fichiers du Relecteur** (`relecteur.mjs`, `SKILL.md`, les deux bancs) et ajoute le geste `noter`, que la veille doit compter parmi les gestes à jouer : même PR, 94 d'abord, d'où `Blocked by: 94`. Le ticket 93 ne touche aucun de ces fichiers. **Le ticket 98, écrit en parallèle, touche aussi `veille` (413-452)** s'il n'est pas `wontfix`, et les tickets 96 et 97 la table et « La veille » de `SKILL.md` : l'ordre est à fixer par l'architecte.

## Le besoin

Constat (17) de l'essai réel du régime 8 (carte, entrée « Fin de l'essai réel du régime 8 ») : **`--taire <PR>` survit à la levée de la cause** ; la PR reste muette jusqu'à un ordre explicite (sur #7, entrée du 2026-11-23 à 10 h 52 : « le Relecteur lève sa sourdine », une fois la cause corrigée, par un geste de sa session). Le besoin : **la sourdine levée quand sa cause disparaît**, sans ordre, sans que la session du Relecteur ait à s'en souvenir.

## Le mécanisme, établi à la source (`origin/main`, plugin 8.4.0)

- `relecteur.mjs:421` lit `--taire` comme un ensemble de **numéros** de PR ; `:445` écarte toute ligne de `passe` dont la PR est dans l'ensemble, quel que soit son geste, sa règle ou sa tête. Une PR tue ne réveille donc plus la veille, même quand son geste a changé.
- La levée n'est écrite qu'en prose, à la charge de la session : `SKILL.md:99`, « Une PR tue le reste, d'une veille à la suivante, tant que la passe lui rend le même geste à la même règle ; son geste ne se joue pas au réveil. Un autre geste, ou une autre règle, la fait sortir de `--taire`. » La veille ne rend rien qui permette de le voir : `VEILLE FINIE` (`:451`) ne nomme aucune PR, et la session relance la veille avec la liste qu'elle tient en mémoire. Après une compaction, un réveil sans passe lue, ou un Relecteur relancé, la liste reste telle quelle.
- Les causes de sourdine : `SKILL.md:38` (`contrat-illisible`), `:52` (sortie 1), `:53` (sortie 2, deux fois), `:55` (sortie 5 de `jouer`, deux fois), `:57` (sortie 7, deux fois), `:66` (`create_session` en échec, deux fois). Chacune est un geste qui ne peut pas se jouer **en l'état de la PR** : un autre état (une autre tête, un autre geste, une autre règle) est une cause neuve.

## Décision proposée

**`A-225` (provisoire)** — **La sourdine est une clé, et la veille la lève.**

1. **La clé** : `--taire <n>:<geste>:<règle>:<tête>[,…]`, recopiée de la ligne de `passe` (ou de `jouer`) qui a fait taire la PR : `pr`, `geste`, `regle` (`—` quand elle vaut `null`) et `tete` (40 caractères). Un numéro seul, ou une clé mal formée : sortie 2, la cause dite.
2. **Tant que la passe rend, pour la PR, la même clé** : la ligne est écartée, comme aujourd'hui.
3. **La passe rend, pour la PR, un geste à jouer sous une autre clé** (autre geste, autre règle ou autre tête) : la sourdine tombe, et la PR réveille la veille comme toute autre (`GESTE <n> …`).
4. **La passe rend `rien` ou `hors-regime` pour la PR, ou ne la nomme plus** (fermée) : la sourdine tombe, sans réveil.
5. **`pause`** (commentaires illisibles) : la sourdine reste ; ce n'est pas un état neuf de la PR.
6. **La veille rend les sourdines qui tiennent** : sa dernière ligne, après `VEILLE GESTE` et ses lignes, après `VEILLE FINIE` et après `VEILLE ARRÊTÉE sortie <c>`, est `SOURDINES <clé>,…` ou `SOURDINES aucune`. La session relance la veille avec cette liste, plus la clé d'une PR qu'elle vient de faire taire, jamais avec sa mémoire.

Raison : la cause d'une sourdine est un état de la PR que la passe voit déjà ; le script compare, la session recopie. Un état neuf de la PR rouvre ses gestes, ce que `SKILL.md:99` dit déjà, sans dépendre de ce dont la session se souvient.

## Quand le ticket est fait

1. Une PR tue sous la clé `12:distribuer:6:<T>` ne réveille pas la veille tant que la passe rend cette clé ; la dernière ligne est `SOURDINES 12:distribuer:6:<T>`.
2. Un push sur la PR (tête T2) : la passe rend `distribuer` règle 6 sur T2 ; la veille sort `VEILLE GESTE`, `GESTE 12 distribuer règle 6`, puis `SOURDINES aucune`.
3. La même tête, un autre geste (un verdict tombé : `etiqueter` règle 2) : de même, réveil et sourdine levée.
4. La PR passe à `rien` (étiquette en place) ou est fermée : aucun réveil, `SOURDINES aucune` à la fin de la veille.
5. Une passe `pause` pour la PR : la sourdine tient.
6. `--taire 12` (sans clé) : sortie 2, la cause dite ; rien n'est veillé.
7. Le geste `noter` du ticket 94 est un geste à jouer : il réveille la veille, et lève une sourdine de clé autre.
8. `SKILL.md` : chaque `--taire <n>` (lignes 38, 52, 53, 55, 57, 66) devient « `--taire` avec la clé de la PR (`<n>:<geste>:<règle>:<tête>`) » ; le paragraphe de la veille (99) dit la levée par la veille et la relance avec la ligne `SOURDINES` ; la liste des lignes de la veille (94-97) porte `SOURDINES`. Les lignes à l'architecte (80) ne changent pas.
9. La suite entière passe ; la version est la suivante de `main` au moment de livrer, au troisième chiffre (8.4.1 sur `main` en 8.4.0 ; une seule montée si 93 et 94 vont dans la même PR), sa note dans `NOTES-DE-VERSION.md`.

## Où

Lignes lues sur `origin/main` (plugin 8.4.0).

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | l'usage (10) et l'en-tête de la veille (61-68) ; `veille` (413-452) : lire les clés (421), garder la ligne seulement à clé égale (445), lever sur un autre geste à jouer, sur `rien`, `hors-regime` ou une PR absente, garder sur `pause`, écrire `SOURDINES` en dernière ligne à chaque fin (447-451, et la sortie `VEILLE ARRÊTÉE`, 441-444) |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | le test de la veille (316-333) : `--taire 12` devient la clé, et sort en 2 seul ; les cas 1 à 7 |
| `skills/chaine/relecteur/SKILL.md` | lignes 38, 52, 53, 55, 57, 66 (la clé) ; 94-99 (`SOURDINES`, la levée par la veille) |
| `scripts/relecteur.test.mjs` | les textes tenus aux lignes 66, 183, 200, 201, 209 suivent `SKILL.md` |
| `skills/chaine/relecteur/references/CONTENU.md` | la phrase de la veille et la liste des cas du banc (17) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante et sa note |

## Bancs à écrire

Les cas 1 à 7, dans `relecteur.test.mjs` du skill, par `d.lancer('veille', '--pause', '0', '--sondes', '<k>', '--taire', '<clé>')` sur le faux GitHub, la tête changée par un push du dépôt jouet, le geste par un verdict ajouté. Mutations, chacune rouge : la clé réduite au numéro ; la tête ôtée de la comparaison ; la règle ôtée ; une sourdine levée sur `pause` ; une sourdine gardée sur `rien` ; la ligne `SOURDINES` absente de `VEILLE FINIE` ; un numéro seul admis.

## Questions à l'architecte

1. **Une cause qui disparaît sans que l'état de la PR change** : une écriture refusée deux fois (sortie 7), un `create_session` en échec, GitHub muet pour `jouer` (sortie 5). La PR garde la même clé, donc la sourdine tient jusqu'à un ordre, comme aujourd'hui. Faut-il une échéance (par exemple `relecture.delai`) après laquelle la sourdine tombe et la PR retente ? Cela change ce que voit l'architecte (une ligne de plus à chaque nouvel échec) et le nombre de réveils. Le ticket ne la pose pas.
2. **Dire la levée à l'architecte** : la ligne « PR <n> : <cause> ; PR tue » a dit la sourdine ; sa levée ne se dit pas (les quatre formes de lignes de `SKILL.md:80` restent). À ajouter ?

## Hors périmètre

- Les autres constats de la famille relecture : (1) la demande modifiée écartée en silence, (2) `interrupt_session` et la veille, (11) la cadence de la passe, (15) la session de relecture réemployée.
- La note de même contenu : ticket 94.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur le constat (17) de l'essai réel du régime 8, le code lu sur `origin/main` (plugin 8.4.0). Aucun banc joué : le ticket décrit ce qui est à écrire.
