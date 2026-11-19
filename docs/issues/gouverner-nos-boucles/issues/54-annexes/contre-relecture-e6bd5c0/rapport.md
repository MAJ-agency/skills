# Contre-relecture PR 138 (MAJ-agency/skills) au sommet e6bd5c06

Sommet vérifié : e6bd5c06a8810d748e82ec1f3eeaf5348c4dd094 ; arbres skills 16e842b5, scripts 73f78c84, README c30fba81.
(Rapport final.)

## Notes de travail (provisoires)

- Symboles retirés cherchés dans tout le dépôt hors docs/ et notes (git grep) : aucun reste hors du banc depot.test.mjs, de l'ADR retirée et de retrait-codeowners.md. Chaque fonction et variable de github.sh garde un appelant. `bash -n` vert sur les .sh de fusionner/ et sujet/. shellcheck absent du poste.
- essais/refus.mjs (16 messages de refus, vrai passer.sh) : 409, « Base branch was modified » 405, 502, 503, sans code → 5 ; 403, 405 méthode, 405 revue (4 formes), 422 → 3, dernière ligne = verdict, verrou terminé (PATCH fin), label gardé, tête détachée = origin/develop, capitaine/33 supprimée.
- essais/boucle.mjs : file ordinaire (retard, prête, conflit, CI en cours, bloquée, brouillon, rouge) identique avant/après (diff des journaux normalisés : seule la PR portant un ancien commentaire d'attente change : « attend un humain » avant, « prête » puis fusionnée après).
- essais/boucle.mjs refus : ARRÊT sur #47 (sortie 3) à chacun des trois lancements, #48 jamais prise, un commentaire de passage « terminé » de plus par lancement, label gardé, arbre propre.

- essais/garde.mjs : table des refus de garde-fichiers (79 chemins × file_path/notebook_path + 4 entrées limites, hook réel) avant/après : seules les 9 formes de CODEOWNERS passent de 2 à 0 ; tout le reste identique (68 refus, 90 permis après).
- essais/poser.mjs : pose neuve (138 fichiers) : CODEOWNERS nommé seulement dans scripts/agent/regles.test.mjs (commentaire + 3 chemins) et docs/agents/chaine-admin.md ; aucun {{ADR_CODEOWNERS}} ; gatesRapides sans codeowners.mjs ; package.json et check.mjs sans check:codeowners ; CI sans gate retiré.
- essais/retrait.mjs : marche à suivre jouée à la lettre sur un projet posé à 988a6c3 : arbre obtenu = pose neuve à l'octet, plus l'ADR retirée (diff -r) ; `git grep -il codeowners` rend les trois fichiers annoncés ; CODEOWNERS écrit à la main laissé.
- Repose seule (scripts/agent + scripts du capitaine) sur projet ancien : check:codeowners OK, banc codeowners 10/10, regles 85/85, gates identiques.


## Reprise (second contre-relecteur)

Notes du premier lues ; repose seule revérifiée sur `projets/r1` (scripts/agent et scripts du capitaine neufs, générateur et clé `proprietaires` gardés) : `node scripts/github/codeowners.mjs` → `codeowners : OK`, rc=0 ; `node --test scripts/github/codeowners.test.mjs` → pass 10, fail 0. La dernière phrase de la note 7.32.0 (« son gate `check:codeowners` reste vert ») est donc vue.

### Point 3 — projet à 988a6c3, capitaine en marche, repose au milieu de la vie de la file

`essais/mi-vie.mjs` : dépôt jouet et faux GitHub **d'avant** (`avant/`, qui modélise CODEOWNERS, la règle et les relecteurs demandés), ancienne chaîne publiée sur develop, `.github/CODEOWNERS` généré (`/docs/ @proprietaire`, `/scripts/chaine/ @proprietaire`). File : #60 = PR de repose (les `scripts/chaine/*` du sommet e6bd5c0, approuvée), #61 « attend un propriétaire » (relecteur `proprietaire` demandé, approbation manquante), #62 « attend un humain » (commentaire `<!-- attente-revue-capitaine -->` du capitaine, aucune revue), #63 ordinaire. L'**ancienne** `boucle.sh` est lancée une seule fois, depuis une copie hors worktree comme la veille.

Règle cochée (`essais/mi-vie-cochee.log`) :
```
60 prête / 61 attend un propriétaire / 62 attend un humain / 63 prête      (ancien file.sh)
[#60] FUSIONNÉE : <sha>, arbre = arbre testé
[boucle] boucle.sh a changé sur develop : relance sur la nouvelle version
[#61] DÉBUT hh:mm
[#61] mise à jour poussée (<sha>)
gh: Waiting on code owner review from @proprietaire. (HTTP 405)
[#61] fusion refusée par GitHub pour une autre raison qu'une branche qui a bougé (…) 
ARRÊT sur #61 (sortie 3)
PR : #61 ["à-fusionner"] commentaires=1 (le passage, terminé) ; #62, #63 ["à-fusionner"], non passées
```
Règle décochée (`essais/mi-vie-decochee.log`) : `#60`, puis `#61`, `#62`, `#63` FUSIONNÉES dans le même lancement, `FILE VIDE` ; #62 garde son commentaire `<!-- attente-revue-capitaine -->` « Le capitaine ne met plus cette PR à jour avant une nouvelle approbation », désormais faux.

Ce que cela montre : la boucle en marche prend les nouveaux scripts **au tour qui suit l'entrée de la PR de repose**, sans relance (`rafraichir_outils`, `boucle.sh` l. 246-272 : copie de `origin/develop:scripts/chaine`, `exec` de la nouvelle `boucle.sh`). La veille, elle, garde sa copie (`veille.sh` l. 57 et 179 : `$outils/file.sh` du scratchpad) jusqu'à sa relance.

### Point 1 — les textes contre le code (notes)

- Note 7.32.0, point 4 : « règle cochée, il s'arrête (`ARRÊT`, sortie 3) au refus de fusion de la première PR qui touche un chemin possédé, et de nouveau à chaque relance ». `essais/boucle.mjs` (refus) montre : arrêt sur la première PR **dont GitHub refuse la fusion** dans l'ordre de la file (#47, après #40 et #41 fusionnées et #42 renvoyée), **après sa mise à jour avec develop** (`[#47] mise à jour poussée`, donc une CI), puis à chaque relance (`déjà à jour avec develop`, refus, `ARRÊT sur #47`, trois lancements), label gardé, un commentaire de passage terminé de plus par lancement. Le faux de ce banc ne modélise ni CODEOWNERS ni la règle : « chemin possédé » n'y est pas vu ; `essais/mi-vie.mjs` le voit (faux d'avant, `/docs/ @proprietaire`) : même arrêt, après `mise à jour poussée`. La phrase tait la mise à jour et sa CI avant l'arrêt, et qu'une PR déjà approuvée par un propriétaire passe.
- Note 7.32.0, dernière phrase (repose avant retrait, gate vert) : vue, voir plus haut (`projets/r1`).
- Note 7.32.0, points 4 et 5, et `retrait-codeowners.md` point 4 (« Relancer chaque capitaine une fois cette PR entrée dans `develop` ») : la boucle en marche n'attend aucune relance (point 3 ci-dessus). Le skill `fusionner` le dit lui-même (l. 89 : « reprend au tour suivant, qui relit l'arrêt, l'échéance et les scripts de develop »). La relance ne sert qu'à rafraîchir la copie de la veille.
- `veille.sh` l. 7 et `fusionner/SKILL.md` l. 81, « « attend » » : c'est l'état `attend #N` (empilée, `file.sh` l. 19), antérieur à CODEOWNERS (`git log -S` : 51ac723) ; pas un reste.
- `chantier/SKILL.md`, ADR marquée retirée, `admin.md`, `fusionner/SKILL.md` « Devant un refus durable de fusion » : chaque phrase relue contre `passer.sh`/`boucle.sh` et les journaux ; rien qui dise plus que le code (label gardé, rien d'écrit hors le passage, sortie 3, sous-PR de sujet encore traitées par `traiter_sujets` avant l'arrêt : « aucune PR vers develop » est exact).

### Point 2 — mutations (notes ; script `essais/mutations/muter.mjs`, arbre `mut/`, journaux `essais/mutations/*.log`)

Témoin : `fusionner.test.mjs` complet sans mutation, 106/106 (`essais/temoin-fusionner.log`, 339 s). Tour ciblé (`cible.log`) : M4 rouge, M6 rouge, M9 rouge (regles.test 84/85) ; M1, M2, M3, M5, M7, M8, M10 verts au banc ciblé → rejoués sur `fusionner.test.mjs` entier.

Tour complet (`complet.log`, `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs`, 106 tests chacun) :

| id | mutation | fichier | verdict |
|---|---|---|---|
| M1 | le message exact du refus de GitHub n'est plus écrit (`printf '%s\n' "$message" >&2` retiré) | passer.sh | VERT 106/106 |
| M2 | le message du refus n'est plus masqué (`masquer_url` → `cat`) | passer.sh | VERT 106/106 (ligne antérieure à la PR) |
| M3 | une PR qui porte `<!-- attente-revue-capitaine -->` est encore sautée (sortie 7) | passer.sh | VERT 106/106 |
| M4 | `refus_pour_revue` gardé dans github.sh, refus faute de revue → sortie 5 (pause sans fin) | github.sh + passer.sh | rouge (test « fusion refusée durablement ») |
| M5 | une PR avec un relecteur demandé redevient « attend un propriétaire » | file.sh | VERT 106/106 |
| M6 | `read` garde la colonne `demandes` retirée (colonnes décalées) | file.sh | rouge (3 tests de file.sh) |
| M7 | la boucle met de côté (sans ARRÊT) une sortie 3 dont la sortie de passer.sh nomme une revue | boucle.sh | VERT 106/106 |
| M8 | sortie 7 → `attente_fusion` au lieu de `sautees` | boucle.sh | VERT 106/106 (quasi équivalente : reprise après la fusion suivante) |
| M9 | `refusEdition` ne résout plus les `..` | regles.mjs | rouge (regles.test 84/85) |
| M10 | `renvois_de` compte aussi le commentaire d'attente de l'ancienne version | github.sh | VERT 106/106 |

Faits d'appui : `grep -c requested_reviewers` → `clone/…/faux-gh.mjs:0`, `avant/…/faux-gh.mjs:2` (la PR a retiré du faux les relecteurs demandés) ; `grep -c attente-revue-capitaine` sur tous les `*.test.mjs` de fusionner et sujet → 0 partout. Arbre `mut/` remis (`git status --short` vide).

## Constats

Aucun B. Six m.

**C1 (m) — La note et la marche à suivre placent le geste de l'admin « avant de relancer le capitaine » ; la boucle en marche bascule sans relance.**
Fait : `essais/mi-vie-cochee.log`, un seul lancement de l'**ancienne** boucle : `[#60] FUSIONNÉE` (PR de repose) → `[boucle] boucle.sh a changé sur develop : relance sur la nouvelle version` → `[#61] mise à jour poussée` → `gh: Waiting on code owner review from @proprietaire. (HTTP 405)` → `ARRÊT sur #61 (sortie 3)`. Le skill le dit (fusionner/SKILL.md l. 89, « relit … les scripts de develop » à chaque tour ; `boucle.sh` l. 246-272). La relance des points 5 (note) et 4 (marche à suivre) ne rafraîchit que la copie de la veille (`veille.sh` l. 57, 179).
Effet : l'admin qui suit la note à la lettre trouve le capitaine déjà arrêté. Sans dommage (arrêt, label gardé), mais le texte décrit un autre ordre que le code.
Retouche : note 7.32.0 point 4 et `retrait-codeowners.md` points 4 et 7 : « avant que la PR du retrait entre dans `develop` » au lieu de « avant de relancer le capitaine » ; la boucle en marche prend les nouveaux scripts au tour suivant ; la relance sert seulement à rafraîchir la veille.

**C2 (m) — Rien ne dit ce que deviennent les PR qui attendaient un propriétaire quand les scripts basculent.**
Fait : `essais/mi-vie-decochee.log` (règle décochée, comme le demande la note) : dans le même lancement que la repose, `#61` (relecteur propriétaire encore demandé) et `#62` (« attend un humain », aucune approbation) sont FUSIONNÉES. `#62` garde le commentaire `<!-- attente-revue-capitaine -->` « Le capitaine ne met plus cette PR à jour avant une nouvelle approbation », désormais faux. Règle cochée (`mi-vie-cochee.log`) : `#61` est mise à jour (une CI) puis arrête la boucle.
Effet : des PR sur chemins sensibles qu'un humain devait relire entrent sans cette relecture, sans que le projet en ait été averti. C'est la décision du produit, mais elle n'est écrite nulle part pour ces PR. Le commentaire resté trompe celui qui lit la PR.
Retouche : une phrase dans la note (point 4) et dans `retrait-codeowners.md` (point 7) : avant la repose, relever avec l'**ancien** `file.sh` les PR « attend un propriétaire » ou « attend un humain » (le nouveau les montre « prête ») ; les faire relire, ou leur retirer `à-fusionner` ; leurs commentaires `<!-- attente-revue-capitaine -->` ne sont plus lus et peuvent être supprimés.

**C3 (m) — La phrase « il s'arrête … au refus de fusion de la première PR qui touche un chemin possédé » dit autre chose que l'essai.**
Fait : `essais/boucle-refus-apres.log` : arrêt sur la première PR **dont GitHub refuse la fusion** dans l'ordre de la file, **après** `[#47] mise à jour poussée` (une CI), puis à chaque relance (`déjà à jour avec develop`, trois lancements, un commentaire de passage de plus à chaque fois). Le faux de ce banc ne connaît pas les chemins possédés ; `mi-vie` les voit (même arrêt, après une mise à jour). Une PR qui touche un chemin possédé et qu'un propriétaire a déjà approuvée passe ; avec « Required approvals » ≥ 1, toute PR non approuvée arrête la boucle, qu'elle touche ou non un chemin possédé.
Retouche : « … au refus de fusion de la première PR de la file qu'aucun propriétaire n'a approuvée, après l'avoir mise à jour avec develop (une CI) ; de même pour toute PR si « Required approvals » vaut 1 ou plus ».

**C4 (m) — Le banc ne vérifie pas, au niveau de la boucle, la conduite centrale de la PR (un refus faute de revue arrête la boucle).**
Fait : M7 VERT 106/106. La partie `boucle.sh` du test « fusion refusée durablement » n'utilise que `Merge commits are not allowed` ; le refus faute de revue n'est éprouvé que sur `passer.sh`. Une boucle qui remettrait « de côté » une PR refusée faute de revue, ce qui revient à l'ancienne attente, passerait.
Retouche : dans ce test, jouer aussi `boucle.sh` avec `gh: Waiting on code owner review from @exemple. (HTTP 405)` et une PR suivante : `ARRÊT sur #33 (sortie 3)`, la suivante non fusionnée.

**C5 (m) — Le banc ne voit plus aucune trace laissée par la version d'avant.**
Fait : M3 (passer saute une PR portant l'ancienne marque) et M10 (cette marque compte comme un renvoi) VERTS 106/106 ; aucun `*.test.mjs` ne contient `attente-revue-capitaine`. M5 (un relecteur demandé fait de nouveau attendre) VERT : la PR a retiré `requested_reviewers` du faux, qui ne peut donc plus montrer qu'une PR avec un relecteur demandé reste « prête ».
Retouche : un cas de banc avec une PR qui porte l'ancien commentaire marqué du compte du capitaine **et** un relecteur demandé : `file.sh` la montre « prête », elle est fusionnée, ses renvois restent à 0. Garder `requested_reviewers` dans `versRest` du faux.

**C6 (m) — « avec le message exact de GitHub » (fusionner/SKILL.md, retrait point 7) n'est tenu par aucun test.**
Fait : M1 VERT 106/106 (`printf '%s\n' "$message" >&2` retiré : le capitaine n'a plus le message à rapporter).
Retouche : dans le test « fusion refusée durablement », `assert.match(r.stderr, /<le message gh>/)` pour les cas en 3.

Hors constat : M2 (masquage du message du refus) vert, mais la ligne est antérieure à la PR ; M8 quasi équivalente.

## Ce qui n'a pas été regardé

- La suite entière (consigne) : seuls `fusionner.test.mjs` (témoin et mutations) et `regles.test.mjs` ont été joués.
- `sujet.sh fusionner` face à un refus faute de revue (sous-PR vers un sujet, où la note dit qu'aucune règle de PR ne se pose).
- La veille en marche pendant la bascule : son `file.sh` reste l'ancien jusqu'à sa relance (lu dans le code, pas joué).
- Un vrai dépôt GitHub : les textes exacts des refus 405 viennent du faux et de la mémoire, pas d'un vrai refus.
- shellcheck (absent du poste).
