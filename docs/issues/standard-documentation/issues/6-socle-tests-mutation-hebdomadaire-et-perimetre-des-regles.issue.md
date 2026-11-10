# `socle-tests` : le workflow de mutation hebdomadaire et le périmètre « règles prouvées » depuis l'index

Status: ready-for-human
Type: task
Blocked by: 1

Fedora lance Stryker chaque dimanche par un workflow GitHub, sur le périmètre des fichiers de code des règles prouvées, et à la demande sur le noyau avec un plancher. Le skill `socle-tests` pose Stryker avec un périmètre vide et sans workflow. Dès qu'un projet a un index Anchorpost, la liste des règles prouvées et leurs fichiers de code sont lisibles : le périmètre « règles » se calcule partout.

## Le besoin

Un projet du socle suivi par Anchorpost peut lancer, sans rien écrire, la mutation hebdomadaire sur ses règles prouvées, et lire un rapport des survivants par règle ; le plancher sur le noyau reste à la demande.

## Où

- `skills/monorepo/socle-tests/references/ci/mutation.yml` (nouveau) : repris de `fedora/.github/workflows/mutation.yml` : `workflow_dispatch` avec le choix `noyau | regles`, `schedule` hebdomadaire, `pnpm --filter <api> mutation` et `mutation:regles`.
- `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs` (nouveau, repris de Fedora) : le périmètre depuis `readIndex(root).rules` (`realisation.status === 'proven'`) et les fichiers de code déclarés par les règles ; **où une règle déclare ses fichiers de code** est à trancher : `extensions.code` (comme Fedora) ou un champ `code` du standard. Recommandation : un champ `code: string[]` du standard, facultatif, parce que le périmètre de mutation est utile à tout projet.
- `references/gabarits/stryker.regles.config.mjs` (nouveau) ; `SKILL.md` étape 5 et la fiche `tests.md` § Commandes.
- `skills/chaine/anchorpost/SKILL.md` : dit que `socle-tests` lit l'index pour le périmètre, si le champ `code` entre au standard.

## Décisions

- À trancher par l'humain : le champ `code` dans l'en-tête d'une règle entre-t-il au standard (donc dans le schéma de la CLI), ou reste-t-il une extension de Fedora ? C'est pour cela que le ticket est `ready-for-human`.
- Le workflow ne tourne que si le projet a un index ; sinon il sort vert sans rien muter et le dit.

## Surfaces

| Surface                 | Preuve                                                                          |
| ----------------------- | ------------------------------------------------------------------------------- |
| périmètre               | `mutation-regles.test.mjs` sur un index jouet : deux règles prouvées, trois fichiers |
| workflow                | un `workflow_dispatch` sur un projet posé rend un rapport                        |

## Vérification

`pnpm test` ; sur un projet posé avec Anchorpost, `pnpm --filter <api> mutation:regles` liste le périmètre.

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`), à la question de l'humain « est-ce qu'on l'implémente côté Iroki ? ».
