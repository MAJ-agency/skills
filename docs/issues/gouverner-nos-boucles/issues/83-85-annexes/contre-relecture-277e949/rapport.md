# Contre-relecture de la PR 155, tour 2 — sommet `277e949`

**Verdict : non conforme au sommet `277e949e621527355c5564ad796cdc8e8ce556e4`.** Aucun bloquant ; un à corriger, qui se lève par un geste sur GitHub, sans commit ; un mineur, hors du delta.

PR « tickets » (tickets 83 à 85 de gouverner-nos-boucles), branche `claude/preuve-suffisante-tickets`. Tour limité au delta entre le sommet du tour 1, `a95ab892c120a618e0010e3a0552af1d7c610a05`, et `277e949`, c'est-à-dire un commit, `test(tickets): bancs du régime 8, de l'index illisible et des formes de Prouve:, note précisée (retouche du tour 1)`, qui touche quatre fichiers (+66, −2). Relu le 2026-11-22 sur un clone neuf de `https://github.com/MAJ-agency/skills`, Node 22.23.5, `pnpm install --frozen-lockfile`, sur une machine partagée (charge de 8 à 10).

Le code du delta fait ce que décide `A-206`. Le delta est **exactement** les quatre retouches du contre-relecteur du tour 1. Les quatorze mutations X1 à X15 (sans X12, que le harnais ne porte pas) sont **toutes rouges** au sommet. Treize mutations nouvelles, écrites contre les bancs neufs, sont toutes rouges elles aussi. La note dit vrai. Le titre est le message du commit `a95ab89`. La CI de GitHub est verte sur `277e949`. L'écart est ailleurs : **le corps de la PR donne encore les comptes de `a95ab89`**, alors que le ticket 83 fait de ce corps la source du compte pour les PR sœurs.

## Constats

### Bloquant

Aucun.

### À corriger

**1. [ticket 83, § 3 et « `main` bouge »] Le corps de la PR donne les comptes du tour 1, pas ceux du sommet.**
Le corps de la PR, lu par l'outil GitHub (`pull_request_read`, méthode `get`, mis à jour pour la dernière fois à 17:28:31 UTC), écrit encore :
- § 1 : `# tests 137`, `# fail 11` ;
- § 2 : `# tests 176` ;
- la suite : `# tests 1405`, « 1 396 […] + 9 = 1 405 ».

Les comptes au sommet `277e949` sont les suivants (rejoués ici : § 1 et § 2, voir « Ce qui a été joué ») :
- § 1 : `# tests 141`, `# pass 126`, `# fail 15` ;
- § 2 : `# tests 180`, `# pass 180` ;
- la suite : 1 409, soit 1 396 + 13. C'est le compte du commentaire de la session (« suite entière 1409 tests / 1409 pass »), que ce tour n'a pas rejoué.

Le ticket 83 dit deux choses à ce sujet. Au § 3 : « Recopier le calcul dans la PR ». Au cas « `main` bouge » : « Une PR qui n'était pas fusionnée […] donne son compte dans le corps de sa PR (« la suite entière ») : c'est lui qui compte ». Une PR sœur, ou le capitaine, qui lit ce corps attend 4 tests de moins que ce qui arrive. Le bon compte n'est que dans un commentaire, et sans le calcul.
**Retouche** (un geste, pas un commit) : [`retouches/corps-pr-155.diff`](retouches/corps-pr-155.diff), un diff du corps qui récrit les trois sections, rien d'autre. Pour vérifier : le corps lu par `pull_request_read` contient `# tests 1409` et `1 396 (main `ddb4265`, aucune PR entrée) + 13 = 1 409`.

### Mineur

**1. [ticket 85, hors delta] La ligne « Reposer » de la note 8.1.0 nomme les scripts et pas leurs bancs.** `NOTES-DE-VERSION.md`, l. 16, nomme `tickets.mjs`, `tickets-regles.mjs` et `contexte-ticket.mjs`. Or les bancs qui tiennent K3 (`tickets.test.mjs`, `tickets-gate.test.mjs`, `contexte-ticket.test.mjs`) changent eux aussi. Ils sont posés par les mêmes étapes `poser` (`references/scripts/verify/*` ; « `contexte-ticket.mjs` et son test »), et la note de 7.x, l. 165, écrit « et leurs tests ». Ce n'est pas faux, et c'est sans danger : les bancs de `main` restent verts sur les scripts de `277e949` (37/37, 12/12, 10/10 : [`essais/bancs-de-main-sur-277e949.txt`](essais/bancs-de-main-sur-277e949.txt)). Un projet qui ne repose que les fichiers nommés perd seulement les bancs neufs. La phrase que le delta change (la parenthèse sur `criteres-ticket.md`) est juste ; ce mineur porte sur le reste de la ligne, déjà là au tour 1. Pas de retouche exigée. Si l'architecte la veut : « […] `tickets-regles.mjs` et leurs tests (skill `tickets`), `scripts/chaine/contexte-ticket.mjs` et son test (skill `revue-de-ticket`, `poser` ; […]) ».

## Ce que le delta ferme (les points demandés)

1. **Le delta est la retouche décidée.** `retouche-155-tour-1.patch` du tour 1 a pour somme `c2eecadb…6f4a`, celle que cite le commentaire de la session, et elle se vérifie (`sha256sum -c`). `git apply --check -R` passe sur `277e949`. Les quatre retouches unitaires, posées une à une sur `a95ab89`, donnent un arbre identique à `277e949` (`git diff 277e949` vide).
2. **Les bancs du régime 8 et de l'index illisible.** Le premier test neuf de `tickets-gate.test.mjs` est rouge sur le code de `main` et sous X1 à X5. Les mutations neuves Y1 à Y5 sont rouges aussi :
   - Y1 : la dette est récrite avant la sortie 1 sous `--geler-types` ;
   - Y2 : `--geler-fiches` est le seul à se taire ;
   - Y3 et Y4 : en régime 8, le mode est forcé à `observe` ou à `enforce` ;
   - Y5 : l'index illisible ne dit pas sa cause.

   Le banc tient donc chaque branche de la décision 3 du ticket 84 : régime 8 en `enforce` (trois refus) et en `observe` (deux avertissements, sortie 0), index illisible en régime 8, et index illisible sous chacune des trois options, la dette non récrite. Le test construit son régime 8 comme le banc du lot 5c du même fichier (l. 222-227, même aide `premier`, mêmes deux chemins). Il ne crée donc pas de dépendance nouvelle d'un banc posé à `scripts/chaine/double-relecture.mjs`.
3. **Les gardes d'un index `null` ou sans `rules`.** Le second test neuf est rouge sur `main`, sous X6 et X7, et sous Y6 (au pivot 3 sans `rules`, rien n'est jugé) et Y7 (un index `null` jugé comme un pivot 3 vide).
4. **Les formes de `Prouve:`.** Chaque forme est jugée par son propre refus « absente du registre ». Le test est rouge sur `main` et sous X13. Il est rouge aussi sous Y8 (sans puces), Y9 (sans la puce étoile) et Y10 (sensible à la casse). Il en ressort que la ligne passe par `ligneDEnTete`, celle que lisent `Règles:`, `Sensibles:` et le calcul « double relecture exigée ».
5. **`caseRevision` du gabarit.** Le test est rouge sur `main` et sous X11. Il est rouge aussi sous Y11 (`by` retiré), Y12 (« jamais écrite par un agent » retiré) et Y13 (un `# caseRevision:` placé avant `notApplicableFamilies`).
6. **La note 8.1.0 dit vrai** sur les trois points :
   - `criteres-ticket.md` se lit dans le plugin. L'étape 0 de `revue-de-ticket` ne pose que `contexte-ticket.mjs` et son test. `relecture` « ne pose aucun script » et lit ses critères dans son propre dossier. Aucun script ne copie `criteres-ticket.md`.
   - La clause (d) de `T3` accepte « sa ligne `Règles:` ou `Prouve:` cite la règle » dans les deux copies : `revue-de-ticket/references/criteres-ticket.md`, l. 54-55, pour le régime 7 ; `relecture/references/criteres-ticket.md`, l. 56-57, pour le régime 8.
   - L'index illisible en sortie 1 « régime 7 compris, `--elaguer` et `--geler-*` compris » est inchangé par le delta, et désormais tenu par un banc (point 2).
7. **Le titre.** Le titre de la PR, lu par `pull_request_read`, est `feat(tickets): la ligne Prouve:, la preuve suffisante d'un ticket prêt, la spec amendée (plugin 8.1.0)`. Il est égal, caractère pour caractère, au sujet de `a95ab89` : 102 caractères, 109 avec ` (#155)`, sans ` A-197`. Ce n'est pas le sujet de la tête (`277e949`, le commit de retouche), et c'est ce qu'il faut : le squash écrit l'objet de la PR, et `A-206` dit « la PR retitrée du message du commit », le commit du ticket.
8. **La CI de GitHub sur `277e949`** : `bancs` en succès (17:28:36 → 17:40:15 UTC), `CodeQL` et ses deux `Analyze` en succès. Ce sont les quatre checks que rend `get_check_runs`.

## Ce qui a été joué

- Clone neuf, `git fetch origin claude/preuve-suffisante-tickets claude/hopeful-lovelace-ouk6tz`, `pnpm install --frozen-lockfile`. L'annexe du tour 1 lue sur la branche de documentation (`61fa0c2`). `sha256sum -c` des retouches, `git apply` des quatre sur `a95ab89`, puis comparaison à `277e949`, et `git apply --check -R` de `retouche-155-tour-1.patch`.
- Les bancs touchés au sommet ([`essais/bancs-touches.txt`](essais/bancs-touches.txt)) :
  - `tickets.test.mjs` : 41/41 ;
  - `tickets-gate.test.mjs` : 17/17 ;
  - `preuve-suffisante-standard.test.mjs` : 3/3 ;
  - `depot.test.mjs` : 69/69 ;
  - `contexte-ticket.test.mjs` : 11/11.

  Avec `relecture.test.mjs`, le § 2 donne `# tests 180`, `# pass 180`. Le § 1 a été joué avec les bancs de `277e949` sur le code de `ddb4265` : 15 rouges sur 141 hors `relecture.test.mjs`. Les quatre tests neufs sont parmi eux.
- `mutations-contre.mjs` du tour 1 au sommet : sortie 0, quatorze rouges, « toutes rouges » ([`mutations/mutations-contre-sur-277e949.txt`](mutations/mutations-contre-sur-277e949.txt)). X1 à X5 tombent sur le test neuf du régime 8, X6 et X7 sur celui de l'index `null` ou sans `rules`, X11 sur `caseRevision`, X13 sur les formes de `Prouve:`.
- Treize mutations neuves Y1 à Y13, même harnais ([`mutations/mutations-tour-2.mjs`](mutations/mutations-tour-2.mjs)) : toutes rouges, chacune sur le test neuf qu'elle vise ([`mutations/mutations-tour-2-sur-277e949.txt`](mutations/mutations-tour-2-sur-277e949.txt)). L'arbre est resté propre après chaque passe.
- Les bancs de `main` sur les scripts de `277e949`, pour le mineur 1.
- Lus par l'outil GitHub, en lecture seule : la PR (titre, corps), ses deux commentaires et ses checks.

## Ce qui n'a pas été établi

1. **La suite entière** : non rejouée, comme demandé. Le 1 409 est celui de la session (commentaire du 17:28:31 UTC) ; la CI `bancs` verte le recoupe sans en donner le compte ici.
2. **Les tickets 83 à 85** de la branche de documentation parlent encore de « + 9 », de « 1 405 », de 137 et de 176 (ticket 83, l. 110, 134, 164, 184). Ce n'est pas la PR. C'est le geste de l'architecte que recommandait la question 1 du tour 1, et `A-206` ne l'a pas encore décidé.
3. **La combinaison du régime 8 avec `--elaguer` ou `--geler-*`** sur un index illisible : aucun banc ne la joue. Chaque axe est tenu séparément, et le code lit l'index avant toute option, indépendamment du régime : une mutation qui ne casserait que la combinaison devrait tester les deux ensemble. Pas exigé par la décision.
