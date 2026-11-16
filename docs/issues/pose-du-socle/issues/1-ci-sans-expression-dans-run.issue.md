# `ci.yml` du gabarit de la chaîne : plus d'expression `${{ }}` dans un `run:`

Status: Fait — PR #97
Type: task

`skills/chaine/socle-chaine-de-production/references/ci/ci.yml`, étape « Messages de commit » (ligne 41 sur `main`) :

```yaml
run: pnpm exec commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }}
```

## Le risque, vérifié

Ce qui entre dans la commande : `github.event.pull_request.base.sha` et `head.sha`, deux empreintes de commit de 40 caractères hexadécimaux calculées par GitHub. Aucun auteur de PR ne peut y mettre de texte : **pas d'injection exploitable aujourd'hui**. C'est de l'hygiène : une expression interpolée dans un script shell est le motif que l'audit `zizmor` (job du même fichier) et les revues signalent, et le prochain qui recopie la ligne avec `head.ref` ou `title` (contrôlés par l'auteur) ouvre une vraie injection.

## Où

- `ci.yml`, étape « Messages de commit » : les deux valeurs passent par `env:` (`BASE_SHA`, `HEAD_SHA`) et le `run:` lit `"$BASE_SHA"` et `"$HEAD_SHA"`, entre guillemets.
- Le même fichier : aucune autre expression `${{ }}` dans un `run:` (vérifier ; les `if:` et `with:` ne sont pas concernés).
- `.github/workflows/` de ce dépôt (CodeQL) : rien à changer.

## Décisions

- Correctif de `main` (3.10.x), patch du plugin. Le sujet `standard-documentation` le reçoit par merge de `main`.
- Les projets déjà posés ne sont pas réécrits par ce ticket : la ligne de `admin.md` ou du README qui dit comment reprendre un gabarit de CI suffit, s'il y en a une.

## Surfaces

| Surface                    | Preuve                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- |
| aucun `${{` dans un `run:` | `grep -nE '^\s*run:.*\$\{\{' skills/**/ci/*.yml` vide                                  |
| commitlint                 | sur un projet posé, la CI d'une PR joue toujours `commitlint` avec les deux bornes     |
| audit                      | `zizmor` (version épinglée du job) sur le fichier : aucune alerte `template-injection` |

## Vérification

`pnpm test` ; `zizmor skills/chaine/socle-chaine-de-production/references/ci/ci.yml` (en local, `pip install zizmor==` la version du job).

## Comments

- 2026-11-10 — Ouvert par l'architecte du lot `standard-documentation` sur le relevé de la pose du ticket `5`. Risque vérifié : seules deux empreintes de commit entrent dans la commande.
- 2026-11-16 — Subsumé par le n° 44 : l'étape « Messages de commit » passe `BASE_SHA` et `HEAD_SHA` par `env:` et ne garde aucune expression `${{ }}` dans un `run:` (vérifié : `grep -rnE '^\s*run:.*\$\{\{' skills --include=*.yml` est vide).
