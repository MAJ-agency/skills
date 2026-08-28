# Poser le pare-feu CI

Status: ready-for-human
Type: task

Les gardes tournent en local (`pnpm check` au `git push`) mais **aucune CI ne les rejoue**. Or le principe est écrit : *aucun invariant critique ne dépend d'un relecteur.*

## À faire

Un workflow qui rejoue, à chaque PR :

- **qualité** — build, lint, typecheck, détection de cycles ;
- **anti-dérive** — régénérer les types de la base et le document OpenAPI, échouer si le diff est non vide ;
- **secrets** — analyse du dépôt, configuration versionnée ;
- **tests** — avec un PostgreSQL de service.

Puis, **au sprint où leur surface apparaît**, les gates propres aux invariants : isolation des données, concurrence sur une ressource plafonnée, canal sûr de transition d'état, accessibilité. Détail et patrons : `docs/methode/pare-feu-ci.md`.

## La règle qui rend ça praticable

Un gate devient bloquant **au moment où apparaît la surface qu'il protège**, et cette surface **ne merge pas sans son gate**. Activer les cinq dès le premier jour teste du vide et donne une fausse assurance. Mais **aucun gate n'est jamais abandonné** : un gate désactivé est une dette, pas une simplification.

## Comments
