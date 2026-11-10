# Une seule grammaire pour les gates du socle : `identifiants.mjs` passe dans `socle-monorepo`

Status: ready-for-agent
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

## Comments

- 2026-11-10 — Ouvert par l'architecte sur le constat de la fille du ticket `2` (PR #36) : trois gates hors du skill `tickets` gardaient l'ancienne grammaire. Bloqué par `5` : le `3` et le `4` importent `identifiants.mjs`, le `5` touche les mêmes `SKILL.md`.
