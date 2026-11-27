# La cadence de la veille du Relecteur et un `à-fusionner` posé à la main : la garde est celle du capitaine, la cadence reste à deux minutes

Status: wontfix — A-230
Type: défaut
Modèle: sonnet — rien à coder : la décision `A-230` (décidée) ferme le ticket en `wontfix` ; l'option B reste décrite pour qui rouvrirait la question. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: aucun si `wontfix`. Sinon `skills/chaine/relecteur/scripts/relecteur.mjs` (`veille`, lignes 413 à 452 ; la pause par défaut, ligne 418), `skills/chaine/relecteur/SKILL.md` (« La veille », ligne 92), leurs bancs, et les fichiers de version ; après les tickets 96 et 97.

## Le besoin

Constat (11) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 22 h 05 UTC, cas 3 (a)). Sur la PR #14 du jouet, en plein tour 2, l'architecte a posé `à-fusionner` à la main à 22:00:13, pour voir le Relecteur la retirer (règle 3, « étiquette `à-fusionner` posée sans relecture validée »). Le verdict validé du tour est tombé à 22:01:32. La passe suivante du Relecteur, à 22:01:55, a trouvé l'étiquette légitime (règle 2). La course était perdue : 80 secondes sans passe. Le cas 3 (b) a été manqué de même. Le cas 3 est laissé aux bancs (bilan de fin d'essai).

Le besoin dit par le constat : un `à-fusionner` posé à la main ne reste pas sans contrôle pendant tout un tour court.

## La cause, à la source (`origin/main` à `b57eae7`, plugin 8.5.0 ; ces fichiers n'ont pas bougé depuis 8.4.0)

1. `skills/chaine/relecteur/scripts/relecteur.mjs:418` : la veille lance une passe toutes les `--pause` secondes, 120 par défaut ; `skills/chaine/relecteur/SKILL.md:92` le dit (« toutes les 2 minutes »). Entre deux passes, rien ne lit les étiquettes. Le Relecteur n'a pas d'autre réveil qu'un message d'une session de relecture.
2. **Rien n'est entré dans le sujet** pendant la fenêtre, et rien ne le pouvait : le capitaine exige, avant toute mise à jour et toute CI, un tour validé pour le contenu du sommet, puis le contrôle de nouveau avant la fusion (`A-105`). Pour une sous-PR vers un sujet, le premier contrôle est `revue_du_capitaine`, juste après le jugement des fichiers et avant le premier contrôle d'ascendance, donc avant toute mise à jour et toute CI (`skills/chaine/sujet/scripts/sujet.sh:966-970`) ; le second, `verdict_avant_fusion` sur le sommet fusionné (`sujet.sh:1086`, la fonction aux lignes 895-912). Pour une PR vers `develop`, le premier contrôle est `passer.sh:198` (`skills/chaine/fusionner/scripts/passer.sh`) ; `passer.sh:8` et `:192-194` le disent en commentaire, pour `develop` seulement. Le cas 4 bis l'a vu jouer (journal, 18 h 42 : renvoi « aucun tour de relecture validé pour le contenu de ce sommet »). Le cas 3 est prouvé aux bancs de la décision (`skills/chaine/fusionner/scripts/decision-relecteur.test.mjs:361`).
3. Ce que la fenêtre coûte : la ligne de la règle 3 n'est jamais partie, et elle n'avait plus lieu d'être (le tour a été validé). Aucune PR n'a été fusionnée sur un verdict absent.

## Les options

- **A — la cadence reste à 120 secondes** (retenue, `A-230`). La garde d'un `à-fusionner` posé à la main est le capitaine, et elle tient. Poser `à-fusionner` à la main est déjà hors des règles (l'auteur ne la pose jamais, `A-84` ; seul le Relecteur la pose en régime 8) ; seul un essai le fait exprès.
- **B — une pause de 60 secondes.** Deux fois plus de passes. Chaque passe prépare le dossier (`git fetch` de toutes les branches) et lit GitHub : la liste des PR ouvertes, puis tous les commentaires de chaque PR de la file. Une passe sans geste ne réveille pas la session et ne coûte aucun token de modèle ; elle coûte des appels à GitHub, sur le même quota que le capitaine. La fenêtre passe de 2 minutes à 1 : la course du cas 3 (a) (80 secondes) aurait pu être gagnée, ou perdue de même.
- **C — un réveil sur événement** (`subscribe_pr_activity` sur chaque PR de la file). Écarté : les événements d'une PR ne vont qu'à une session à la fois (non vérifié à la source) ; l'architecte et le conducteur s'y abonnent déjà pour voir les distributions (journal, 21 h 59). Et il n'est pas établi que la pose d'une étiquette soit livrée comme événement.

## Décision

**`A-230` (décidée le 2026-11-27) — La cadence de la veille du Relecteur ne change pas (120 secondes) ; le ticket se ferme `wontfix`.** Raison : la fenêtre ne laisse rien fusionner (le capitaine contrôle le verdict avant la mise à jour, la CI et la fusion) ; ce qu'elle retarde, une ligne à l'auteur, n'a plus d'objet si le verdict valide entre-temps ; l'option B double les lectures de GitHub pour un geste que les règles interdisent ; l'option C n'est pas jouable. Le délai que l'essai a mesuré ailleurs, une PR au verdict périmé qui tient le sujet pendant toute sa CI (cas 4 bis, 36 minutes), est le constat (3) de la famille `fusionner`, pas celui-ci.

## Quand le ticket est fait

- **`wontfix` accepté** : la ligne `Status: wontfix — A-230` et la raison sous `## Comments` ; rien d'autre.
- **Si la question se rouvre (option B)** : la pause par défaut à 60 secondes (`relecteur.mjs:418`), le texte de `relecteur/SKILL.md:92`, la borne de 25 minutes inchangée, le banc de la veille (`skills/chaine/relecteur/scripts/relecteur.test.mjs:316`, qui ne tient aujourd'hui que `--duree`, ligne 317) étendu à la nouvelle valeur de `--pause` ; une mesure des appels à GitHub par passe, sur une file de dix PR, écrite dans la note de version.

## Comments

- 2026-11-27 — Fermé `wontfix` sur `A-230` : la fenêtre entre deux passes de la veille ne laisse rien entrer dans un sujet ni dans `develop`, le capitaine contrôlant le verdict avant la mise à jour, la CI et la fusion ; 60 secondes doubleraient les lectures de GitHub pour un geste que les règles interdisent ; un réveil sur événement n'est pas jouable. Citations du point 2 de « La cause » reprises sur `origin/main` à `b57eae7` (plugin 8.5.0) : `sujet.sh:966-970` et `:1086` avec `verdict_avant_fusion` (895-912) pour une sous-PR, `passer.sh:198` pour `develop`. Rien à coder.
