# Quatre écarts mineurs d'une pose complète

Status: ready-for-agent
Type: task

Relevés par la pose complète du ticket `5` du lot `standard-documentation` (PR #43), sur un dépôt vide : monorepo, contrats, api, web, tests, chaîne. Aucun ne casse `pnpm check` ; chacun laisse un projet posé moins propre que promis.

## Où

1. **`docs/agents/couts.md` jamais généré à la pose.** Il est déclaré comme index généré (`scripts/docs/index-generes.json`, `node scripts/docs/couts.mjs`), mais la pose de `socle-chaine-de-production` ne le crée pas : le premier passage du capitaine le régénère et produit un diff hors sujet. La pose le génère une fois (registre vide) et le commit avec le reste.
2. **Pas de ligne `test:db` dans `.claude/rules/tests.md`.** `socle-monorepo/SKILL.md` (zone `<!-- socle:tests -->` et `<!-- socle:tests-commandes -->`) dit que chaque service y insère la ligne de ses suites à infrastructure et leur commande ; `socle-nest-hexagonal` ne le fait pas pour `*.db.spec.ts` et `pnpm --filter … test:db`. Ajouter le fragment et l'étape qui l'insère.
3. **`apps/web/AGENTS.md` écrit par Next.** `create-next-app` (ou l'installation de Next) pose un `AGENTS.md` que le socle ne prévoit pas et que `references-agent` ou le budget de contexte ne connaissent pas. Le skill `socle-web-next` le supprime après la génération, ou le remplace par un renvoi vers `apps/web/CLAUDE.md` ; trancher et le dire dans le `SKILL.md`.
4. **Ligne vide de Prettier avant une zone `socle:`.** Prettier insère une ligne vide entre un tableau markdown et le commentaire `<!-- socle:… -->` qui le suit ; une pose suivante qui insère « immédiatement au-dessus » du marqueur coupe alors le tableau. Soit les gabarits portent déjà la ligne vide et l'insertion se fait au-dessus de la ligne vide, soit le marqueur passe dans la dernière ligne du tableau ; trancher par l'essai.

## Décisions

- Correctifs de `main` (3.10.x), un patch du plugin. Le sujet `standard-documentation` les reçoit par merge de `main`.
- Chaque point se **reproduit d'abord** sur une pose (dépôt vide du scratchpad, skills lus dans le clone) ; un point qui ne se reproduit pas sur `main` est noté tel dans la PR et laissé.

## Surfaces

| Surface       | Preuve                                                                             |
| ------------- | ---------------------------------------------------------------------------------- |
| `couts.md`    | après la pose, `node scripts/docs/couts.mjs --verify` vert et le fichier commité   |
| `test:db`     | `.claude/rules/tests.md` du projet posé contient la ligne et la commande `test:db` |
| `AGENTS.md`   | `apps/web/AGENTS.md` absent (ou renvoi), `references-agent` vert                   |
| zone `socle:` | deux poses de service successives : le tableau de `tests.md` reste un seul tableau |

## Vérification

`pnpm test` ; une pose complète sur un dépôt vide, `pnpm check` vert, sorties dans la PR.

## Comments

- 2026-11-10 — Ouvert par l'architecte du lot `standard-documentation` sur le relevé de la pose du ticket `5`.
