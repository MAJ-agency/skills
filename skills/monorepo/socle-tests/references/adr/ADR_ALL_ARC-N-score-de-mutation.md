# ADR_ALL_ARC-{{N}} — Le noyau critique a un score de mutation plancher, mesuré à la demande

- Statut : **accepté**
- Date : {{DATE}}
- Portée : les fonctions pures qui portent l'argent, les dates et les fichiers (`apps/api`), la revue adversariale

## Contexte

La couverture dit « exécuté », pas « vérifié » : un test qui appelle une fonction sans rien contraindre couvre toutes ses lignes. Le gate des tests creux attrape les assertions vides, pas les assertions faibles. Avec un agent, le risque est structurel : le même agent écrit le code et le test qui le valide.

Le test de mutation retourne le problème : il altère le code (un `<` en `<=`, un `+` en `-`, une constante) et vérifie qu'un test au moins devient rouge. Un mutant qui survit désigne une assertion manquante. Mesuré sur un premier projet, à la première passe sur six fichiers d'argent et d'export : 72 % des mutants tués, 100 % sur les frais, 12 % sur un échéancier dont les autres fonctions n'étaient prouvées que sur base.

## Décision

1. **Stryker mute le noyau critique pur** : les fonctions sans I/O qui portent l'argent, les heures, les dates, les exports (`mutate` de `stryker.config.mjs`). Il rejoue les suites sans base.
2. **Plancher daté** : `thresholds.break`, posé sous la mesure du jour ; relevé quand elle progresse, jamais baissé. Tant qu'il n'y a pas de mesure, `break: 0`.
3. **Lancé à la demande, coût nul par défaut** : `pnpm --filter <api> mutation` en local (incrémental), ou un workflow manuel. Jamais à chaque PR, jamais planifié.
4. **Quand le lancer** : après une modification d'un fichier du périmètre, et avant de relever le plancher. La revue adversariale demande la mesure quand un fichier du périmètre change.
5. **Élargir le périmètre** quand une fonction pure nouvelle porte un invariant chiffré : la propriété (ADR « tests de propriétés ») tue l'essentiel de ses mutants.

## Alternatives écartées

- **Mutation à chaque PR** — plusieurs minutes de runner par PR pour un signal qui bouge peu.
- **Nocturne planifié** — coût récurrent ; le besoin est ponctuel, l'incrémental local suffit.
- **Tout `apps/api`** — les suites sur base rejouées par mutant : des heures. Le noyau pur concentre le risque.

## Conséquences

La force des tests du noyau critique est mesurée, nommée par fichier, et ne peut que monter. Un mutant équivalent (sans effet observable) qui survit toujours se documente dans le rapport, il ne justifie pas de baisser le plancher. Le plancher n'est vérifié que si quelqu'un lance la mesure : la revue adversariale la demande.

## Liens

- `apps/api/stryker.config.mjs` — périmètre et plancher ; `apps/api/reports/` ignoré par git.
- ADR « tests de propriétés ».
