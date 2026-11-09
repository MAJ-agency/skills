# Ce que contient le socle des tests, et pourquoi

## Le lint des tests — `racine/eslint.tests.mjs`

Un bloc ESLint pour les specs, chargé par `eslint.config.mjs` de la racine quand le fichier existe. Chaque règle ferme un cas vu sur un premier projet : un `it` sans assertion (`expect-expect`, helpers maison reconnus par leur nom), une assertion sous `if`/`try` qui ne s'exécute jamais (`no-conditional-expect`), un `it.skip` sans ticket (`no-disabled-tests`, désactivable ligne à ligne avec la mention du ticket), un `.only` oublié, un `expect` hors d'un cas, un `setTimeout` qui parie sur la vitesse de la machine.

## Le gate `tests-creux` — `scripts/verify/tests-creux.mjs`

ESLint garantit qu'un `it` contient une assertion, pas qu'elle contraint quelque chose : `expect(r).toBeDefined()` est vert sur `{}`. Ce gate lit l'AST TypeScript de chaque spec et refuse un cas dont toutes les assertions sont `toBeDefined` ou `toBeTruthy`. Échappatoire motivée sur la ligne au-dessus. Dans `pnpm check`, après lint : quelques centaines de millisecondes.

## Le gate `coverage-diff` — `scripts/verify/coverage-diff.mjs` et `coverage-diff-regles.mjs`

Un plancher global de couverture ne voit pas un fichier neuf à 0 % : 10 % du dépôt l'absorbent. Ce gate regarde le diff : chaque fichier de code modifié ou ajouté par rapport à la base est exécuté par au moins un test, et assez (80 % de lignes, 70 % de branches ; 90 % de lignes pour un fichier neuf). Par paquet, `vitest related <fichiers>` sous couverture v8, rapport istanbul ; si le paquet a un `vitest.db.config.ts` et que `DATABASE_URL` est définie, les suites sur base sont jouées aussi et les deux rapports additionnés — un repository n'est prouvé que contre Postgres. Les règles (périmètre, lecture du rapport, fusion, décision quand la base manque, verdict) sont pures et testées ; le script orchestre git et Vitest. Au pre-push et dans le job CI qui a la base. Sur un distant vide (premier push d'un dépôt neuf, `git ls-remote --heads origin` sans aucune branche), le gate ne compare rien et passe : la base naîtra avec la chaîne. Tout autre distant est un refus (sortie 2) qui dit où la base manque : listée sur le distant, `git fetch origin develop` ; des branches mais pas elle, la créer depuis `main` (`scripts/github/develop.sh` du socle de la chaîne, qui pousse hors du hook : la commande à la main passerait sous ce gate même, sans base) ; distant muet. Le gate ne cherche jamais à deviner que le push en cours est celui qui crée la base.

## Les gabarits — `gabarits/`

`exemple.property.spec.ts` : la forme d'un test de propriétés `fast-check`, oracle indépendant en entiers, budget de tirages. `stryker.config.mjs` : la mutation du noyau critique sous Vitest, périmètre vide et plancher à zéro jusqu'à la première mesure.

## Les ADR — `adr/`

Trois gabarits numérotés à la pose : les suites sans infrastructure dans la porte de qualité et les suites sur base en CI avec le service ; les invariants métier testés par propriétés ; le score de mutation plancher sur le noyau critique, mesuré à la demande. Ils portent les faits mesurés sur un premier projet qui ont fondé chaque décision.
