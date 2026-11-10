# Le gate des tickets vérifie `Type:`, `Règles:` et les tests d'un défaut

Status: ready-for-agent
Type: task
Blocked by: 2

La convention dit que chaque ticket porte `Type:` et que `Règles:` ne cite que des règles existantes ; le gate `tickets.mjs` ne lit encore ni l'un ni l'autre.

## Où

- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs` : `TYPES = ['task', 'défaut', 'grilling', 'research']` ; `controlerTicket` reçoit `regleExiste(id)` et refuse : `Type:` absent ou hors vocabulaire ; un identifiant de `Règles:` qui n'est pas une règle (`RULE_…`), ou absent, ou d'un contexte autre que celui du ticket et `ALL` ; un `Type: défaut` à `Status: Fait — PR #n` dont la colonne « Preuve » de `## Surfaces` nomme un test introuvable ou désactivé (`testExiste(fichier, titre) → 'actif' | 'désactivé' | 'absent'`, fourni par `tickets.mjs`).
- `tickets.mjs` : construit `regleExiste` depuis `docs/metier/regles/<ctx>/RULE_*.md` (le nom de fichier suffit) ; construit `testExiste` depuis les fichiers de tests du dépôt (grep du titre, détection de `it.skip`, `test.skip`, `xit`, `describe.skip` sur la ligne ou le bloc).
- `tickets-dette.json` : une clé `types` pour geler les tickets d'avant le gate qui n'ont pas de `Type:` ; la dette ne grandit pas.
- Les fiches `docs/agents/issue-tracker.md` et `triage-labels.md` : déjà à jour.

## Décisions

- `Règles:` accepte la virgule ou l'espace comme séparateur, des backticks ou pas ; rien d'autre sur la ligne.
- Un défaut `Fait` dont le test est désactivé est un **refus**, pas une alerte : c'est la promesse de `ANC-11`.

## Surfaces

| Surface                    | Preuve                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `Type:`                    | `tickets.test.mjs` : absent, hors vocabulaire, gelé dans la dette                      |
| `Règles:`                  | règle existante, absente, d'un autre contexte, mal formée (`LIC-3`)                    |
| défaut `Fait`              | test actif, test `it.skip`, test absent                                                |
| gate complet               | `tickets-gate.test.mjs` sur un dépôt jouet avec un registre de deux règles             |

## Vérification

`pnpm test` ; sur un dépôt posé, `pnpm check:tickets` dit `tickets : OK — n tickets` et refuse un ticket de test sans `Type:`.

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`).
