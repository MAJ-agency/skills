# Une seule grammaire pour les gates du socle : `identifiants.mjs` passe dans `socle-monorepo`

Status: resolved
Type: task
Blocked by: 5

Depuis le ticket `2`, les scripts du skill `tickets` et de la chaîne lisent les identifiants par `identifiants.mjs`. Trois gates posés par d'autres skills gardent leur propre expression de l'ancienne forme, parce qu'ils ne peuvent pas importer un fichier du skill `tickets` sans que leur skill en dépende :

- `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.mjs` (ligne 69 : `/\/((?:[A-Z][A-Z0-9]*-)+\d+)-[a-z0-9-]+\.(\d{2})\.issue\.md$/`) et `references-agent-regles.mjs` ;
- `skills/monorepo/socle-tests/references/scripts/verify/tests-creux.mjs` : l'identifiant de ticket d'un cas désactivé. Effet réel : un `it.skip` annoté `SPEC_ALL_SOC-1.07` est refusé « sans ticket ».

## Où

- **Le module change de propriétaire.** `skills/chaine/tickets/references/scripts/docs/identifiants.mjs` et `identifiants.test.mjs` passent par `git mv` dans `skills/monorepo/socle-monorepo/references/scripts/docs/`. `socle-monorepo` les pose toujours, à `scripts/docs/identifiants.mjs`, même sans chaîne ; le skill `tickets` ne le pose plus, il l'exige (et refuse sans, comme il refuse sans socle).
- Les imports du dépôt : chaque `import … from '…/identifiants.mjs'` des skills `tickets`, `sujet`, `fusionner`, `revue-de-ticket`, `socle-chaine-de-production`, et `skills/chaine/fusionner/scripts/identifiant.mjs`, vise le nouveau chemin **dans le projet posé** (`scripts/docs/identifiants.mjs`, inchangé) ; dans ce dépôt, les bancs (`depot-jouet.mjs`, tests) copient le fichier depuis son nouvel emplacement.
- `references-agent.mjs`, `references-agent-regles.mjs`, `tests-creux.mjs` : importent `../docs/identifiants.mjs` (`fichierDuTicket`, `identifiantsCites` ou ce qui sert) ; plus aucune regex d'identifiant locale.
- Les `SKILL.md` et `CONTENU.md` de `socle-monorepo` (liste des fichiers posés), `tickets` (ce qu'il pose, ce qu'il exige), `socle-tests` (`tests-creux` exige `scripts/docs/identifiants.mjs`) ; `.claude/chaine.json` du gabarit : `cheminsSensibles` cite déjà `scripts/docs/identifiants.mjs`, rien à changer.

## Décisions

- Défaut de l'architecte (choix technique) : la grammaire est écrite dans `socle-monorepo` (`nomenclature.md`), son code y vit aussi. Écartés : copier l'expression dans chaque gate (deux grammaires, contraire au ticket `2`) ; importer le fichier de `tickets` depuis `socle-tests` (dépendance d'un socle vers un skill de chaîne).
- Le chemin dans un projet posé ne change pas (`scripts/docs/identifiants.mjs`) : aucun projet déjà posé n'a rien à migrer.

## Surfaces

| Surface             | Preuve                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| grammaire           | `identifiants.test.mjs` sous `socle-monorepo`, inchangé et vert                                          |
| `tests-creux`       | `tests-creux.test.mjs` : un `it.skip` annoté `SPEC_ALL_SOC-1.07` accepté ; annoté `SOC-1.07` refusé        |
| `references-agent`  | `references-agent.test.mjs` : un ticket `SPEC_ALL_SOC-1.03-….issue.md` reconnu                           |
| aucune regex locale | `grep -rnE '\[A-Z\]\[A-Z0-9\]\*-|\[A-Z\]\{2,4\}-' skills --include=*.mjs` ne rend que `identifiants.mjs` et `migrer-tickets.mjs` |

## Vérification

`pnpm test` à la racine (tous les bancs, total noté dans la PR) ; le grep ci-dessus.

## Answer

- **Trois modules changent de propriétaire** : `identifiants.mjs`, `next-id.mjs`, `next-id-branches.mjs` et leurs tests (`identifiants.test.mjs`, `next-id.test.mjs`, qui teste aussi `next-id-branches`) passent par `git mv` sous `skills/monorepo/socle-monorepo/references/scripts/docs/`. `socle-monorepo` pose `references/scripts/docs/*` à `scripts/docs/` (la copie croisée depuis `tickets` disparaît) ; `tickets` ne les pose plus, les exige à l'étape 1, et son gate `tickets.mjs` sort en 2 en nommant la grammaire quand elle manque. `next-id.test.mjs` porte son propre dépôt jouet : le socle le pose sans la chaîne.
- **Les trois gates** importent `../docs/identifiants.mjs` : `references-agent.mjs` (`identifiantDuTicket` sur le nom de fichier), `references-agent-regles.mjs` (`ticketsCites` pour un ticket cité, `identifiantsCites` pour un document nommé avant un `§`), `tests-creux.mjs` (un cas désactivé porte une spec ou un ticket de la grammaire ; l'ancienne forme et une règle ne comptent pas ; sans grammaire, sortie 2). Plus aucune expression d'identifiant locale.
- **Les bancs** : les tests de `tickets` jouent leurs scripts par `script()` et `module()` de `depot-jouet.mjs` (dans un projet, `scripts/` tel quel ; dans le plugin, une copie où la grammaire du socle est posée à côté) ; `tests-creux.test.mjs` joue une copie posée ; `depot-jouet.mjs` du skill `sujet`, `identifiant.mjs` (repli plugin), `identifiant.test.mjs`, `contexte-ticket.test.mjs`, `garde-commandes.test.mjs` visent `socle-monorepo`.
- Hors périmètre, nécessaire à la pose de vérification : `references/agents/issue-tracker.md` de `tickets` citait `docs/agents/chaine-de-production.md` comme un chemin, rouge pour `references-agent` sans le socle de la chaîne (déjà rouge au sommet `a050988`) ; la phrase nomme le fichier et le skill qui le pose.

## Comments

- 2026-11-10 — Ouvert par l'architecte sur le constat de la fille du ticket `2` (PR #36) : trois gates hors du skill `tickets` gardaient l'ancienne grammaire. Bloqué par `5` : le `3` et le `4` importent `identifiants.mjs`, le `5` touche les mêmes `SKILL.md`.
- 2026-11-10 — Résolu : trois modules sous `socle-monorepo`, trois gates sur `identifiants.mjs`, `pnpm test` 278 verts ; cinq passages au sommet `a050988` verts, l'instabilité signalée n'est pas reproduite.
