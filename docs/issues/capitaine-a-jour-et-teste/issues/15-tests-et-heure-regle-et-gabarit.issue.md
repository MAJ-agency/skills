# Tests et heure : une règle en trois points dans la fiche des tests du socle, et un gabarit dans socle-tests

Status: Fait — PR #112
Type: task
Modèle: sonnet — un texte de règle court, un gabarit de test sur le modèle d'`exemple.property.spec.ts`, et un banc de texte sur le modèle de ceux de `scripts/depot.test.mjs` ; aucune conception.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md`, `skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts`, `skills/monorepo/socle-tests/SKILL.md`, `skills/monorepo/socle-tests/references/CONTENU.md`, `scripts/tests-et-heure.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 15 (point C15, décision `A-27` ; `A-33` pour l'interdit des termes d'Iroki ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), point 15. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu chez Iroki.** Le seed et des tests en base cassent selon le jour, la date ou l'heure du run. Trois cas, corrigés un par un :

- un test lit le jour UTC (`toISOString().slice(0, 10)`) là où le code juge le jour local : faux entre minuit et une heure, deux heures l'été ;
- des tests cherchent dans le seed partagé une donnée « d'aujourd'hui », ou une année écrite en dur (`/^D-2026-/`) ;
- un parcours joué à 23 h 45 ne trouve plus de passage « à venir », parce que le dernier du seed finit à 23 h 30.

**Dans le plugin**, la fiche des tests du socle n'en dit qu'une ligne : « pas de date système, l'horloge est un port » (`tests.md:29`). Rien ne dit quel jour lire, ni à quels instants jouer un test, et aucun modèle ne le montre.

**Quand le ticket est fait :**

1. La fiche `.claude/rules/tests.md` du socle porte une section « Le jour et l'heure », en trois points : le jour se lit dans le fuseau du métier, par l'horloge injectée ; un test crée ses données au lieu de lire celles du seed partagé ; un banc tourne avec une horloge posée.
2. `socle-tests` pose un gabarit, `docs/agents/gabarits/exemple.jour-metier.spec.ts`, qui montre les trois points.
3. Ni la fiche ni le gabarit ne nomment un fuseau ou un projet réel.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet recopie.

## Où

Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md` | 29 | « pas de date système, l'horloge est un port » devient « pas de date système, l'horloge est un port (voir « Le jour et l'heure ») ». |
| idem | après 30 (fin de « Règles »), avant « Tests creux » (l. 32) | La section nouvelle, texte exact en Décision 1. La fiche passe de 58 à 66 lignes environ, loin du plafond de 200 du gate `budget-contexte` des projets. |
| `skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` (nouveau) | — | Le gabarit (Décision 2). Modèle de forme : `exemple.property.spec.ts` du même dossier (en-tête de commentaires l. 1-7, un `describe`, des `it` nommés en anglais). |
| `skills/monorepo/socle-tests/SKILL.md` | 33 | L'étape 5 pose aussi `references/gabarits/exemple.jour-metier.spec.ts` → `docs/agents/gabarits/`. |
| `skills/monorepo/socle-tests/references/CONTENU.md` | 17-19 | « Les gabarits » : une phrase pour `exemple.jour-metier.spec.ts` et son pourquoi. |
| `scripts/tests-et-heure.test.mjs` (nouveau) | — | Le banc (voir « Ordre de travail »), avec sa lecture à plat recopiée de `exiger` (`scripts/depot.test.mjs:750-755`, trois lignes) : un fichier à lui évite `scripts/depot.test.mjs`, que les tickets 1, 13 et 19 touchent aussi. |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (voir « La version et la note »). |

Qui lit ces textes : toute session qui touche un test dans un projet (`tests.md` est chargée par chemin : `paths:` l. 2-7) ; le gabarit, par renvoi depuis la fiche, comme `exemple.property.spec.ts` l'est à la l. 51.

**Références d'Iroki, pour le comportement seulement** (rien de leur texte n'entre dans le plugin) :

- `SPEC_ALL_SOC-4.74`, PR #622 (`d34523d0`) : `apps/api/src/db/seed.ts`, le dernier passage du jour finit à minuit ; `apps/api/src/db/seed.db.spec.ts:660-671`, un `test.each` à heures posées (10:00, 23:45, 23:59, 00:15).
- `SPEC_ALL_ENT-6.49`, PR #638 (`ec3ae481`) : `apps/api/src/utils/tests/seed-planning-today.ts` (le jour local d'un instant, et le seed amorcé depuis un `now` passé en paramètre), son test `seed-planning-today.spec.ts` (minuit franchi l'hiver et l'été), et `apps/api/src/recette/contrats.db.spec.ts:290` (l'année en dur remplacée par un motif de forme).

Règles à lire : `tests.md` en entier, `exemple.property.spec.ts`.

## Décisions

Tenue (spec) : `A-27` — une règle en trois points dans `.claude/rules/tests.md` du socle, et un gabarit dans `socle-tests` ; « le fuseau est celui du métier, et « Paris » est propre à Iroki ».

Précisions du ticket :

1. **Le texte de la section**, à écrire tel quel (la fille peut couper une phrase trop longue, sans en changer le sens) :

   > ## Le jour et l'heure
   >
   > Un test qui dépend du jour, de la date ou de l'heure casse selon le moment du run s'il lit l'horloge de la machine ou le jour UTC. Trois règles :
   >
   > - **Le jour se lit dans le fuseau du métier, par l'horloge injectée.** Le fuseau du métier est une constante du domaine (un nom IANA), jamais celui de la machine, ni UTC par défaut. Le code reçoit l'instant de l'horloge (`IClock.now()`), ou le jour en paramètre, jamais `new Date()`. `toISOString().slice(0, 10)` rend le jour UTC, faux entre minuit et l'écart du fuseau.
   > - **Un test crée ses données au lieu de lire celles du seed partagé.** Le seed dépend du jour où il a tourné : un test qui y cherche « aujourd'hui » ou une année écrite en dur casse quand la date change. Ce qui dépend du jour se crée dans le test, à partir de l'instant posé ; une année attendue s'écrit comme une forme (`\d{4}`), jamais comme une valeur.
   > - **Un banc tourne avec une horloge posée.** Le code qui dépend de l'heure se joue aux instants qui cassent, dans le fuseau du métier : en journée, juste avant et juste après minuit, et les jours de changement d'heure. Jamais seulement à l'heure du run. Un seed relatif au jour prend l'instant en paramètre, pour qu'un test puisse le poser.
   >
   > Gabarit : `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

2. **Le gabarit**, `exemple.jour-metier.spec.ts`, Vitest, identifiants en anglais, commentaires en français :
   - en tête, comme `exemple.property.spec.ts` : ce qu'il montre, « à copier à côté de la fonction », et que le fuseau d'exemple se remplace par la constante du domaine du projet ;
   - une fonction pure exemple, importée d'à côté (`import { businessDay } from "./business-day"`, comme `splitAmount` dans l'autre gabarit), qui rend le jour `AAAA-MM-JJ` d'un instant dans un fuseau ; le commentaire donne sa forme en une ligne (`Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })`) ;
   - un fuseau d'exemple loin d'UTC et à changement d'heure, `Pacific/Auckland`, dans une constante `EXAMPLE_TIME_ZONE` dont le commentaire dit de la remplacer ;
   - point 1 : « should give the business day, not the UTC day, when the instant passes midnight in the business time zone », en hiver et en été du fuseau ;
   - point 3 : un `it.each` sur des instants posés, en heure locale du fuseau (10:00, 23:45, 23:59, 00:15, et le lendemain d'un changement d'heure), avec une horloge posée (`const clock: IClock = { now: () => instant }`) ;
   - point 2 : un test qui construit sa donnée relative au jour de l'horloge posée (une échéance « demain »), et l'assertion d'une référence par sa forme (`/^Q-\d{4}-\d{4}$/`), jamais par l'année du jour.
3. **Aucun nom propre à un projet**, ni dans la fiche ni dans le gabarit : pas de « Paris », pas de nom de projet, de personne ou d'identifiant de ticket d'un autre dépôt. Le banc le vérifie.
4. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : les instants exacts du `it.each` (dans la liste de la Décision 2), le nom de la référence d'exemple. Elle ne tranche **pas** : les trois points, le nom du gabarit, l'interdit de la Décision 3.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Le banc est vu rouge avant les textes. Commits sous les hooks, jamais `--no-verify`.

### 1. Le banc, vu rouge sur `main`

Dans `scripts/tests-et-heure.test.mjs` (joué par le glob `scripts/*.test.mjs` de `package.json`), un test : « tests et heure : la fiche des tests porte la règle en trois points, socle-tests pose le gabarit, et aucun des deux ne nomme un fuseau réel ni un projet ». Il vérifie :

- par la lecture à plat (comme `exiger`), dans `tests.md` : le titre `## Le jour et l'heure`, et le début gras de chacun des trois points (Décision 1) ;
- le gabarit existe, et porte `EXAMPLE_TIME_ZONE`, `clock` et `it.each` ;
- `socle-tests/SKILL.md` et `socle-tests/references/CONTENU.md` nomment `exemple.jour-metier.spec.ts` ;
- ni `tests.md` ni le gabarit ne contiennent `Paris` ni `Iroki` (insensible à la casse).

**Rouge sur `main`** : la section et le gabarit n'existent pas.

### 2. Les textes

`tests.md` (l. 29, puis la section), le gabarit, puis `SKILL.md:33` et `CONTENU.md`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, un gabarit ajouté : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne, recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  La fiche `.claude/rules/tests.md` du socle gagne « Le jour et l'heure » : le jour se lit dans le fuseau du métier, par l'horloge injectée ; un test crée ses données au lieu de lire celles du seed partagé ; un banc tourne avec une horloge posée. socle-tests pose le gabarit `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
  2. Dans une PR du projet, recopier la section « Le jour et l'heure » de `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md` dans `.claude/rules/tests.md`, avec la retouche de la ligne « Déterministe ». La fiche du projet a pu diverger : recopier la section, pas le fichier. `.claude/**` est un chemin sensible : contre-revue.
  3. Si socle-tests est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` dans `docs/agents/gabarits/`.
  4. Écrire le fuseau du métier comme une constante du domaine, s'il ne l'est pas déjà.

  **Iroki** : sa fiche porte la même ligne d'une phrase. Il recopie la section, avec son propre fuseau du métier ; ses correctifs (#622, #638) appliquent déjà les trois points.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| La règle en trois points dans la fiche des tests | `scripts/tests-et-heure.test.mjs` « tests et heure : la fiche des tests porte la règle en trois points, socle-tests pose le gabarit, et aucun des deux ne nomme un fuseau réel ni un projet » |
| Le gabarit et sa pose par socle-tests | idem |
| Aucun nom propre à un projet | idem |

## Vérification

1. Ciblée : `node --test scripts/tests-et-heure.test.mjs` (un test).
2. `pnpm test` complet : le nombre de `main` au départ (**738** sur `4a45634`), plus le test ajouté, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutation**, jouée sur une copie jetable, vue rouge, puis annulée, dite dans la PR : écrire « Paris » dans le gabarit, puis retirer le troisième point de la fiche ; le banc rougit chaque fois.
4. **Relecture du gabarit** : la fille vérifie à la main, avec `node -e` et `Intl.DateTimeFormat`, que chaque jour attendu du gabarit est juste pour le fuseau d'exemple (hiver, été, lendemain du changement d'heure), et colle ces lignes dans la PR. Le plugin n'a pas Vitest : le gabarit n'y est pas joué.
5. `graphify update .`
6. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
7. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(socle-tests): tests et heure, une règle et un gabarit (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Un gate qui refuserait `new Date()` ou `toISOString().slice(0, 10)` dans le code : la règle se lit, elle n'est pas outillée ici.
- Le port d'horloge du socle Nest (`IClock`, `clock.spi.ts`) : inchangé.
- La phrase de la fiche sur `coverage-diff` (l. 41), que le ticket 12 laisse telle quelle.
- La repose chez Iroki : son conducteur la fait d'après la note.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634` et sur `develop` d'Iroki. Écarts avec la spec : aucun. `tests.md:29` est exact. La fiche des tests est celle du gabarit de `socle-monorepo` (`references/racine/.claude/rules/tests.md`), seul `.claude/rules/tests.md` du plugin ; le gabarit, lui, va dans `socle-tests`, comme `A-27` le dit.
