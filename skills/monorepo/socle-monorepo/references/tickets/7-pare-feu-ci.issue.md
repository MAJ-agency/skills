# Poser le pare-feu CI

Status: ready-for-human
Type: task

Les gardes tournent en local (`pnpm check` au `git push`) mais **aucune CI ne les rejoue**. Or le principe est écrit : _aucun invariant critique ne dépend d'un relecteur._

## À faire

Un workflow qui rejoue, à chaque PR :

- **qualité** — build, lint, typecheck, détection de cycles ;
- **anti-dérive** — régénérer les types de la base et le document OpenAPI, échouer si le diff est non vide ;
- **secrets** — analyse du dépôt, configuration versionnée ;
- **tests** — avec une base de service si une brique en exige une ;
- **les gates déjà posés par les briques** (`pnpm check:gates`), que `pnpm check` joue en local : chaque brique expose le sien, la racine n'a pas à les connaître ; le plus long (un bundle mobile, par exemple) va dans un job séparé.

Puis, **au sprint où leur surface apparaît**, les gates propres aux invariants : isolation des données, concurrence sur une ressource plafonnée, canal sûr de transition d'état, accessibilité. Détail et patrons : `docs/methode/pare-feu-ci.md`.

<!-- ══ TENANT-B ══ -->
Le gate anti-fuite tenant de `ADR_ALL_ARC-2` ne suit pas cette cadence : il est bloquant **dès la première table**, parce que la surface qu'il protège apparaît avec elle. Une migration qui crée une table sans sa politique RLS ne merge pas.
<!-- ══ /TENANT-B ══ -->

## La règle qui rend ça praticable

Un gate devient bloquant **au moment où apparaît la surface qu'il protège**, et cette surface **ne merge pas sans son gate**. Activer les cinq dès le premier jour teste du vide et donne une fausse assurance. Mais **aucun gate n'est jamais abandonné** : un gate désactivé est une dette, pas une simplification.

## Comments
