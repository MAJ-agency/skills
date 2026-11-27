# Les bancs qui lancent `git` n'héritent d'aucune variable `GIT_*`

Status: ready-for-agent
Type: task

Relevé le 2026-11-12 dans anchorpost : l'architecte du chantier `SPEC_ALL_ANC-4` poussait depuis un `git worktree`. Depuis un worktree, git exporte aux hooks `GIT_DIR`, un chemin absolu vers `.git/worktrees/<nom>`. Le hook `pre-push` lance `pnpm check`, qui exécute les bancs du socle. Ceux qui lancent `git -C <dépôt jouet> …` sans nettoyer l'environnement ont alors écrit dans le **vrai** dépôt :

- la config locale est passée à `core.bare = true` ;
- des commits factices (« jouet », « fille 1 ») ont été faits sur la branche courante ;
- les refs locales `origin/develop` et `origin/sujet/demo` ont été réécrites ;
- les fichiers du worktree ont été modifiés.

Rien n'est parti sur GitHub, parce que le push avait été refusé par ces mêmes bancs. Mais un banc qui ferait `git push origin` dans ces conditions viserait le dépôt distant réel. Depuis un clone ordinaire, `GIT_DIR` vaut `.git`, un chemin relatif, et le défaut ne se voit pas : il est donc resté caché.

Le remède existe déjà, dans `skills/chaine/sujet/scripts/depot-jouet.mjs` et `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs` : un `ENV_GIT` sans aucune variable `GIT_*` héritée, avec `GIT_CONFIG_GLOBAL=/dev/null`. Les autres bancs ne l'appliquent pas.

## Où

- **Les bancs qui lancent `git`** passent tous un environnement sans `GIT_*` hérité. Le mieux est un seul module partagé, sur le modèle de `depot-jouet.mjs`, plutôt qu'une copie par banc. Au moins ceux-ci :
  - `skills/chaine/socle-chaine-de-production/references/agent/fin-de-tour.test.mjs` (c'est lui qui a écrit dans le vrai dépôt chez anchorpost) ;
  - `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` ;
  - `skills/chaine/tickets/references/scripts/docs/avancement.test.mjs` ;
  - `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.test.mjs`, `budget-contexte.test.mjs` et `scripts/docs/next-id.test.mjs` ;
  - `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff-regles.test.mjs`.
  - Il faut aussi les scripts eux-mêmes, quand un banc les lance sur un dépôt jouet. `fin-de-tour.mjs` et `coverage-diff.mjs` lancent `git` sans passer d'environnement. Ils doivent recevoir leur environnement de l'appelant, ou bien le banc lance le script avec l'environnement nettoyé.
- **Un banc de garde** : lancer un banc qui fait `git` avec `GIT_DIR` pointé sur un dépôt sentinelle, puis vérifier que la sentinelle n'a pas bougé (config, refs, HEAD, index).
- **La documentation** : une ligne dans `.claude/rules/tests.md` (fragment du socle). Un test qui lance `git` passe par le module partagé, et jamais par `process.env` brut.
- **La reprise chez les projets** : anchorpost, Fedora et Iroki ont reçu ces scripts par la pose. La correction leur parvient par une repose ou une PR de rattrapage. D'ici là, ne pas travailler dans un `git worktree`. C'est déjà dit à leurs architectes.

## Décisions

- Déposé par l'architecte de `SPEC_ALL_ANC-4` d'anchorpost, à la demande du conducteur (2026-11-12). Le ticket n'est pas lancé.
- Aucune dépendance nouvelle.

## Comments

- 2026-11-12 — Reproduit dans anchorpost : `GIT_DIR=$(git rev-parse --git-dir) node --test scripts/agent/fin-de-tour.test.mjs` échoue depuis un worktree, et passe sans la variable.
