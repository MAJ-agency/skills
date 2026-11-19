# Mobile en CI : une référence dans socle-mobile-expo, et le ticket gabarit des parcours sur appareil qui y renvoie

Status: Fait — PR #113
Type: task
Modèle: sonnet — un document de méthode à écrire d'après une source relue (le workflow et la décision d'Iroki), sans rien en recopier de propre au projet, et un banc de texte sur le modèle de ceux de `scripts/depot.test.mjs`.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/mobile/socle-mobile-expo/references/mobile/docs/MOBILE_CI.md`, `skills/mobile/socle-mobile-expo/references/tickets/15-parcours-sur-appareil.issue.md`, `skills/mobile/socle-mobile-expo/references/CONTENU.md`, `scripts/mobile-en-ci.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 19 (points E20 et E21, décision `A-33` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 20 et 21. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Ce qu'Iroki a appris.** Ses parcours Maestro clignotaient sur l'émulateur Android de la CI. L'émulateur, à 2 cœurs, perdait le lancement de l'app après `launchApp: { clearState: true }`. Le lanceur Android faisait des ANR, et son dialogue couvrait l'écran. Une étape bloquée attendait le timeout du job. Un rouge ne disait pas pourquoi. Iroki l'a stabilisé en deux PR (#637, #658), avec une décision d'architecture. Et le filtre `paths` de son workflow relance les parcours sur un commit de documentation seule, parce qu'il lit le diff de toute la PR.

**Dans le plugin**, rien de cela n'existe. Le socle mobile ne porte qu'un ticket gabarit, « Poser les parcours de bout en bout sur appareil » (`socle-mobile-expo/references/tickets/15-parcours-sur-appareil.issue.md`), qui dit « simulateur Android, Maestro Cloud ou runner dédié » (l. 16), sans plus.

**Quand le ticket est fait :**

1. Le socle mobile pose une référence, `apps/mobile/docs/MOBILE_CI.md`, qui porte les sept points d'`A-33`, chacun avec sa raison.
2. Le ticket gabarit 15 y renvoie.
3. Rien d'un projet réel n'y entre : ni identifiant d'app, ni nom de parcours, ni identifiant de ticket ou d'ADR d'un autre dépôt, ni point encore ouvert chez Iroki.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet recopie.

## Où

`mob/` abrège `skills/mobile/socle-mobile-expo/references/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `mob/mobile/docs/MOBILE_CI.md` (nouveau) | — | La référence (Décision 1). Elle part avec la ligne existante de `socle-mobile-expo/SKILL.md:29` (`references/mobile/docs/*` → `apps/mobile/docs/`) : aucune ligne de table à ajouter. Prose en français, identifiants en anglais, extraits YAML et shell courts. |
| `mob/tickets/15-parcours-sur-appareil.issue.md` | 16 | Le point 4 renvoie à la référence : « Le job CI : build preview, émulateur Android, Maestro Cloud ou runner dédié ; rapport en artefact sur échec. **Avant de l'écrire, lire `apps/mobile/docs/MOBILE_CI.md`** : réglage de l'émulateur, démarrage à froid, incidents comptés, diagnostic, filtre `paths`. » |
| idem | 18-21 | Un rappel de plus : « La relance unique d'un lancement perdu (`MOBILE_CI.md`) est la seule exception à « jamais un `retry` » : elle se décide par une ADR du projet, avec son seuil. » |
| `mob/CONTENU.md` | 7-8 | Une ligne sous « Règles mobile » : « **`docs/MOBILE_CI.md`** — les parcours sur appareil en CI : l'émulateur, le démarrage à froid, les dialogues d'erreur et les incidents comptés, les bornes de temps, le diagnostic, le filtre `paths`. Méthode tirée d'un premier projet, sans ses réglages. » |
| idem | 29-31 | « Tickets » : le `15` renvoie à `docs/MOBILE_CI.md`. |
| `scripts/mobile-en-ci.test.mjs` (nouveau) | — | Le banc (voir « Ordre de travail »), avec sa lecture à plat recopiée de `exiger` (`scripts/depot.test.mjs:750-755`, trois lignes) : un fichier à lui évite `scripts/depot.test.mjs`, que les tickets 1, 13 et 15 touchent aussi. |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (voir « La version et la note »). |

Qui lit la référence : la session qui fait le ticket 15 dans un projet, et toute session qui touche le workflow des parcours.

**La source, à relire pour la méthode et jamais à recopier** (dépôt `MAJ-agency/iroki-monorepo`) :

- `SPEC_ALL_SOC-4.55`, PR #637 (`09655963`, sur `develop`) : `.github/workflows/mobile-e2e.yml:125-154` (l'étape Maestro : `timeout-minutes: 30` l. 129 et son commentaire l. 126-128, `cores: 4` et `ram-size: 4096M` l. 141-142 et leur raison l. 137-140, le script l. 145-154 avec les journaux `events`, le compteur des relances et le diagnostic sur échec), `:155-191` (« Diagnostic Maestro en texte », par flux) ; `apps/mobile/e2e/commons/cold-start.yaml` (attente de 30 s, relance unique `stopApp: false`, marqueur compté) ; `docs/adr/ADR_ALL_ARC-19-relance-unique-d-un-lancement-perdu.md` (Contexte, Décision, Seuil, Sortie, Alternatives écartées).
- `SPEC_ALL_SOC-4.84`, PR #658 (`ace67af7`, sur `sujet/alignement-de-la-chaine` seulement) : `.github/workflows/mobile-e2e.yml:154-155` (`settings put global hide_error_dialogs 1`, valeur relue et `mCurrentFocus` imprimés avant Maestro) ; `scripts/ci/incidents-events.mjs:1-65` (lignes `am_anr` et `am_crash` du tampon `events`, par processus ; un processus secondaire `<app>:<suffixe>` est l'app ; un ANR ou un crash de l'app rend le run rouge, même parcours verts ; `events` illisible aussi) ; l'amendement du 2026-11-18 de `ADR_ALL_ARC-19`.
- Le filtre `paths` : `.github/workflows/mobile-e2e.yml:6-18` (non corrigé chez Iroki, point E21).

Règles à lire : `mob/tickets/15-parcours-sur-appareil.issue.md` en entier, et `mob/mobile/docs/MOBILE_GUIDELINES.md` pour le ton.

## Décisions

Tenue (spec) : `A-33` — une référence dans `socle-mobile-expo`, qui porte les sept points ; le ticket gabarit 15 y renvoie ; rien d'Iroki n'y entre (ni l'identifiant de l'app, ni les noms de parcours, ni les points ouverts `SOC-4.83` et `SOC-4.85`). « Le plugin porte la méthode, Iroki ses réglages. »

Précisions du ticket :

1. **Le plan de `MOBILE_CI.md`**, une section par point, chacune dans l'ordre : le symptôme vécu (dit sans numéro de job ni nom de projet : « sur un premier projet »), la règle, l'extrait, ce qu'on lit quand ça casse.
   1. **L'émulateur à 4 cœurs et 4 Go.** Par défaut, `reactivecircus/android-emulator-runner` donne 2 cœurs et un peu plus de 2,5 Go ; affamé (rendu logiciel, services de l'image, API et base sur le même runner), il perd le lancement de l'app. Extrait : `cores: 4`, `ram-size: 4096M`, `disable-animations: true`. Plus de cœurs rétrécit la fenêtre sans la fermer : d'où le point 2.
   2. **Le sous-flux de démarrage à froid, avec une relance unique et comptée.** Le `pm clear` de `clearState` retire la tâche de l'app de façon asynchrone et peut tuer le processus que Maestro vient de lancer (lu dans `events` : `am_kill … remove task` juste après `am_proc_start`, sans `am_proc_bound`). Chaque parcours commence par un sous-flux commun (`e2e/commons/cold-start.yaml`) : attendre l'écran d'entrée 30 s ; sinon relancer **une fois** l'activité (`launchApp` avec `stopApp: false`, sans `clearState`) ; puis attendre 60 s. Aucune commande du parcours n'est rejouée : ce n'est pas un `retry`. La relance laisse un marqueur (`evalScript` qui écrit une ligne), que le workflow compte à chaque run (« relances : N »), avec le nombre de lancements de l'app lu dans `events`. Au-delà d'une relance par run en moyenne, c'est un défaut à reprendre. Cette exception à « jamais un `retry` » se décide par une ADR du projet.
   3. **`hide_error_dialogs`.** Un dialogue « Application Not Responding » d'un autre processus (le lanceur) reste au premier plan et masque l'app ; un tap sur « Attendre » ne le ferme pas toujours. Le script de l'émulateur pose `adb shell settings put global hide_error_dialogs 1` juste avant Maestro, relit la valeur et imprime le `mCurrentFocus` de `dumpsys window`. Le réglage cache aussi les dialogues de l'app : le point 4 est donc obligatoire avec lui.
   4. **Le compteur d'incidents par processus, lu dans `events`.** Le workflow enregistre `adb logcat -b events` pendant les parcours, puis lit les lignes `am_anr` et `am_crash` (format `EventLogTags.logtags` d'AOSP : `[user,pid,processus,…]`) et les compte par processus. Un ANR ou un crash de l'app (son identifiant, ou `<identifiant>:<suffixe>` pour un processus secondaire) rend le run rouge, même quand les parcours sont verts. Un `events` illisible aussi : sans lui, rien ne dit que l'app n'a pas eu d'incident caché. Un incident d'un autre processus est compté et imprimé, jamais rouge. Extrait : un script court du projet (`scripts/ci/<nom>.mjs`), avec son banc, dont la référence donne l'entrée, la sortie et les codes, pas le code.
   5. **Un timeout propre à l'étape Maestro.** Une étape bloquée (le gestionnaire de SDK, une image système) attend sinon le timeout du job. `timeout-minutes` sur l'étape, réglé sur la durée normale mesurée plus la pire relance, et sur l'étape de build à part. Chaque `adb shell` du diagnostic sous `timeout 20`.
   6. **Un diagnostic par parcours en échec.** Le rouge doit se lire dans le journal du job, sans télécharger l'artefact : pour chaque flux, les dernières commandes Maestro avec leur statut et leur erreur (fichiers `commands-*.json` du `--debug-output`, et de `~/.maestro/tests/`), l'écran réel à l'échec (`uiautomator dump`, ses `text`, `resource-id`, `content-desc`), le `logcat` de JS et des erreurs, la fin du journal de l'API. Puis l'artefact (`if: failure()`).
   7. **Le filtre `paths`.** Le filtre `paths` d'un `pull_request` juge le diff de **toute** la PR, pas celui du dernier commit : un commit de documentation seule sur une PR qui a touché l'app relance les parcours. Et un workflow sauté par son filtre laisse un check exigé « en attente » : un workflow filtré par `paths` ne devient pas un check exigé. Le parcours entre au gate quand il est vert trois fois de suite (ticket 15).
2. **Ce qui n'entre pas** : l'identifiant de l'app, les noms des parcours, les variables d'environnement et comptes d'un seed, les numéros de job, les identifiants de ticket ou d'ADR d'Iroki, `close-anr.yaml` (le tap sur « Attendre », que le point 3 remplace, voir `## Comments`), l'image d'émulateur sans services Google et les taps captés par la navigation par gestes (points ouverts d'Iroki). Le banc le vérifie.
3. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la longueur des extraits, l'ordre des paragraphes dans une section. Elle ne tranche **pas** : les sept points, l'exclusion du point 2, le nom du fichier.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Le banc est vu rouge avant les textes. Commits sous les hooks, jamais `--no-verify`.

### 1. Le banc, vu rouge sur `main`

Dans `scripts/mobile-en-ci.test.mjs` (joué par le glob `scripts/*.test.mjs` de `package.json`), un test : « mobile en CI : la référence porte les sept points, le ticket gabarit 15 y renvoie, et rien d'un projet n'y entre ». Il vérifie :

- `mob/mobile/docs/MOBILE_CI.md` existe et porte `cores: 4`, `ram-size: 4096M`, `stopApp: false`, `hide_error_dialogs`, `am_anr`, `am_crash`, `events`, `timeout-minutes` et `paths` ;
- par la lecture à plat (comme `exiger`), la phrase du point 7 sur le diff de toute la PR, et celle du point 4 sur l'ANR ou le crash de l'app qui rend le run rouge ;
- `mob/tickets/15-parcours-sur-appareil.issue.md` et `mob/CONTENU.md` nomment `MOBILE_CI.md` ;
- la référence ne contient ni `iroki`, ni `majagency`, ni `etxen`, ni `SOC-4.`, ni `ARC-19`, ni `close-anr` (insensible à la casse).

**Rouge sur `main`** : la référence n'existe pas.

### 2. Les textes

La référence, puis le ticket gabarit 15, puis `CONTENU.md`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une référence ajoutée à un skill : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne, recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Le socle mobile pose `apps/mobile/docs/MOBILE_CI.md`, la méthode des parcours sur appareil en CI : émulateur à 4 cœurs et 4 Go, démarrage à froid avec une relance unique et comptée, `hide_error_dialogs`, incidents de l'app lus dans `events` (un ANR ou un crash de l'app rend le run rouge), un timeout propre à l'étape Maestro, un diagnostic par parcours en échec, et le filtre `paths` qui juge le diff de toute la PR. Le ticket gabarit des parcours sur appareil y renvoie.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
  2. Si le socle mobile est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/mobile/socle-mobile-expo/references/mobile/docs/MOBILE_CI.md` dans `apps/mobile/docs/`, dans une PR du projet. Aucune commande `poser`.
  3. Si le ticket des parcours sur appareil du projet n'est pas fait, lui ajouter le renvoi du gabarit. S'il est fait, relire le workflow des parcours point par point contre la référence, et ouvrir un ticket par écart.

  **Iroki** : rien à reposer, la référence vient de ses correctifs (#637, #658 et `ADR_ALL_ARC-19`). Il peut la recopier pour ses nouvelles sessions ; ses réglages et ses points ouverts restent chez lui.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| La référence et ses sept points | `scripts/mobile-en-ci.test.mjs` « mobile en CI : la référence porte les sept points, le ticket gabarit 15 y renvoie, et rien d'un projet n'y entre » |
| Le renvoi du ticket gabarit 15 et de `CONTENU.md` | idem |
| Rien d'un projet dans la référence | idem |

## Vérification

1. Ciblée : `node --test scripts/mobile-en-ci.test.mjs` (un test).
2. `pnpm test` complet : le nombre de `main` au départ (**738** sur `4a45634`), plus le test ajouté, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutation**, jouée sur une copie jetable, vue rouge, puis annulée, dite dans la PR : écrire un identifiant d'app d'Iroki dans la référence ; retirer la section `paths` ; le banc rougit chaque fois.
4. **Relecture contre la source** : la fille relit chaque point contre les lignes citées d'Iroki et le note dans la PR, point par point (source lue, ce qui est repris, ce qui est laissé).
5. `graphify update .`
6. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
7. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(socle-mobile): référence des parcours sur appareil en CI (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Un gabarit de workflow (`mobile-e2e.yml`) ou un script de comptage posé par le socle : la référence décrit, le projet écrit (ticket 15 du socle).
- Un tri des relances par le diff du dernier commit (E21, piste d'Iroki) : la référence documente le comportement de `paths`, elle ne le contourne pas.
- Les points ouverts d'Iroki (`SOC-4.83`, `SOC-4.85`) et son sous-flux `close-anr.yaml`.
- La CI du socle de la chaîne (`ci.yml`, sans `paths`) : inchangée.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, sur `develop` et sur `sujet/alignement-de-la-chaine` d'Iroki. Écarts avec la spec :
  - Faits de la spec exacts : le plugin n'a que le ticket gabarit 15 ; #658 n'est que sur `sujet/alignement-de-la-chaine` ; la CI du socle n'a pas de `paths`.
  - Répartition des sept points entre les deux PR d'Iroki, que la spec ne donne pas : `develop` (#637) porte les 4 cœurs, le démarrage à froid, le timeout de l'étape et le diagnostic ; `hide_error_dialogs` et le compteur d'incidents (`scripts/ci/incidents-events.mjs`) ne sont que sur le sujet (#658).
  - #658 apporte aussi `close-anr.yaml`, un tap sur « Attendre » qu'`A-33` ne nomme pas, et dont l'amendement de l'ADR d'Iroki dit lui-même qu'il « ne ferme pas le dialogue » (un filet) : laissé hors de la référence, que l'architecte l'y ajoute s'il le veut.
  - Le comportement d'un workflow sauté par `paths` sur un check exigé (point 7, second fait) n'est pas dans la source d'Iroki : c'est le comportement documenté de GitHub, que la fille cite par sa page de documentation dans la PR.
