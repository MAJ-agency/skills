# Contre-relecture du commit de fusion `9eb4e14` (PR 149, lot 5, plugin 7.39.0)

Sommet relu : `9eb4e14db94f3b896be4d4d35bbfb7d7b1dd6868`, le 2026-11-22. Lecture seule : rien poussé, rien commenté.

**Verdict proposé : conforme.**

## 1. Parents et arbre

`git log -1 --format='%H %P %T' 9eb4e14` donne les parents `9d989dc62f7b0384e8bdd2cb9f7e6f0bd247f87d` (dernier sommet relu « conforme ») et `37233f8abcfa5e5e703e2c9413ac456cf0c78764` (`origin/main`), et l'arbre `bc131956ba1eb56876613c2d027a3868efae7069`. La base de fusion est `2e87bae`. C'est ce qu'annonce l'architecte.

## 2. Le commit n'apporte rien d'autre

- Hors de `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, `git diff 9d989dc 9eb4e14` est identique octet pour octet à `git diff 2e87bae 37233f8`. Les sept fichiers sont ceux de la PR 150 : `veille.sh`, `veille.test.mjs`, `une-sous-pr-a-la-fois.test.mjs`, `fusionner/SKILL.md`, `references/CONTENU.md`, `scripts/veille-du-capitaine.test.mjs`, plus les notes.
- `plugin.json` : la version vaut `7.39.0`. Le fichier est identique entre `9d989dc` et `9eb4e14`, et il ne diffère de `main` que par `7.38.3` → `7.39.0`.
- `NOTES-DE-VERSION.md` : de `9d989dc` à `9eb4e14`, le seul ajout est le bloc 7.38.3, placé entre la note 7.39.0 et la note 7.38.2. La note 7.39.0 n'a pas bougé. De `37233f8` à `9eb4e14`, le seul ajout est le bloc 7.39.0, en tête et au-dessus de la note 7.38.3, qui n'a pas bougé non plus. Les deux notes sont donc entières, dans le bon ordre.

## 3. Les deux changements se croisent-ils ?

Aucun défaut trouvé à leur croisement.

- **Codes de sortie.** Le lot 5 n'invente aucun code. `passer.sh` emploie 3, 4, 5 et 7 ; `sujet.sh fusionner` emploie 4, 5, 7 et 11. Tous existaient déjà et `boucle.sh` les classe tous (7 voulait déjà dire « sautée » : brouillon, gel, verrou). La veille ne lit que le code final de la boucle, et la boucle ne change pas.
- **Lignes que la veille lit dans le journal de la boucle.** Le format de `[#n] RENVOI` est inchangé (`renvoyer.sh` ne change que le texte de la suite). Le format de `attend son tour` aussi. Une sous-PR sautée en 7 par le lot 5 (verdict illisible, garde des sensibles, PR devenue inéligible) donne `tenu par #n (sortie 7 de fusionner)`, sans `verrou du`. La regex d'expiration de la veille ne la retient donc pas, et cela ne relance rien à tort.
- **Une PR sautée sans renvoi** reste « prête » dans la file. La veille ne relance la boucle que pour une entrée nouvelle ou changée, donc il n'y a pas de boucle sans fin. Une PR renvoyée en régime 8 porte `à-relire` et non `à-fusionner` : elle sort de la file jusqu'au verdict du Relecteur.
- **Le texte du skill `fusionner`.** La PR 150 n'y change que la veille, la garde, `--reprendre` et le journal en ajout. Le lot 5 ne touche pas `SKILL.md`. Rien dans l'un ne contredit l'autre.
- **Note (information, pas un défaut de la fusion) :** `SKILL.md` ne dit encore rien du régime 8 (renvoi vers `à-relire`, double contrôle du verdict). C'est cohérent avec la note 7.39.0 : rien ne change avant la clé `relecture`, qui arrive avec la bascule (lot 6). C'est à écrire au lot 6.

## Bancs rejoués au sommet

`node --test` sur `skills/chaine/fusionner/scripts/*.test.mjs`, `skills/chaine/sujet/scripts/*.test.mjs`, `scripts/veille-du-capitaine.test.mjs`, `scripts/points-d-entree.test.mjs` et `scripts/depot.test.mjs` : **801 sur 801**, 0 échec, 500 s. Clone neuf, arbre propre, aucun processus laissé.

## 4. Contrôles GitHub au sommet `9eb4e14`

Quatre contrôles sur quatre au vert : `CodeQL`, `Analyze (actions)` et `Analyze (javascript-typescript)` (terminés à 06 h 13 UTC), et `bancs` (06 h 13 → 06 h 24 UTC, `success`). Aucun statut commit (`total_count` 0).

La PR est `mergeable: true` et `mergeable_state: blocked` (relevé pendant que `bancs` tournait, ou revue exigée). Elle ne porte aucun label. Sa base est `main`.
