# Le gate des tickets vérifie `Type:`, `Règles:` et les tests d'un défaut

Status: resolved
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

## Answer

Livré dans une PR vers `sujet/standard-documentation`, sans bump du plugin (le sujet est en 4.0.0).

- **`Type:`** obligatoire, lu dans l'en-tête seul (avant le premier `## `) : `task`, `défaut`, `grilling`, `research` ; un commentaire de gabarit (`Type: task # …`) est toléré. Absente : refus, sauf ticket gelé sous la clé `types` de `tickets-dette.json`. Cette clé n'existe pas dans la dette livrée : `tickets.mjs --geler-types` l'écrit une fois, à l'arrivée du gate, avec les tickets sans `Type:` du moment, puis refuse de la rejouer ; `--elaguer` retire les entrées éteintes.
- **`Règles:`** : absente, rien à vérifier ; présente, au moins une règle. Virgules ou espaces, accents graves ou non, rien d'autre sur la ligne. Chaque identifiant passe par `REGLE` d'`identifiants.mjs`, sans regex locale, et doit avoir son fichier `docs/metier/regles/<ctx>/RULE_….md` dans le dossier de son contexte. Il est écrit tel quel, zéros compris : `RULE_FNSMR_LIC-5` ne vaut pas `-05`. Il est du contexte du ticket (celui de son identifiant) ou de `ALL` ; un ticket au nom illisible n'accepte que `ALL`.
- **Défaut `Fait — PR #n`** : la colonne « Preuve » de `## Surfaces` nomme `` `fichier.spec.ts` « titre exact » `` (ou `"…"`). Le gate refuse :
  - un défaut qui ne nomme aucun test ;
  - un fichier nommé sans titre ;
  - un test introuvable ;
  - un test désactivé (`.skip`, `.todo`, `xit`/`xdescribe`, `{ skip }`/`{ todo }` de node:test), sur sa ligne ou sur un bloc qui l'englobe.

  Les fichiers lus sont les `*.test.*`, `*.spec.*` et `*.e2e-spec.*` de code suivis par git. Limite documentée dans `etatDuTest` : l'analyse se fait ligne à ligne, les blocs englobants se lisent par l'indentation.
- Tests : `pnpm test` à 271 verts (262 avant). `Type: task` a été ajouté aux fixtures existantes, assertions inchangées. Il y a 6 nouveaux tests unitaires et 3 tests du gate sur dépôt jouet (registre de deux règles, dette `types`).

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`).
- 2026-11-10 — Résolu : `Type:`, `Règles:` et tests d'un défaut `Fait` vérifiés par le gate, dette `types` par `--geler-types`, 271 tests verts. Voir `## Answer`.
