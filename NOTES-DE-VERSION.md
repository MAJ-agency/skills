# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 8.5.1 — 2026-11-27

### Ce qui change

- **`criticite` : une spec trop longue entre par son en-tête et les sections qui citent la règle.** Sous 300 000 caractères, le message est celui d'avant, octet pour octet. Au-delà, chaque spec est réduite à son en-tête et aux sections (titre de niveau 1 ou 2, en colonne 0, hors clôture de code) qui portent l'identifiant exact de la règle ; le plafond reste 300 000.
- **Le message nomme ce qui est retenu** : `<nom> (extrait : en-tête, « ## A » ; écartées : k) :`. Une puce du prompt dit au sous-agent qu'une spec peut n'arriver qu'en extrait, et que ce qu'une section écartée dirait ne se suppose pas : la situation va dans « Questions ».
- **La sortie d'erreur dit le tri**, en sortie 0 : la taille avant et après, puis une ligne par spec réduite. La section `## Criticité` de la PR la recopie sous la commande jouée.
- **Le refus ne vient plus qu'après le tri** : toujours au-delà du plafond, le script refuse en sortie 2, avec les tailles avant et après, celle de la règle et, par spec, sa taille entière et en extrait.

### Ce qu'un projet fait pour en profiter

- **Rien** : le script et le prompt sont lus dans le plugin, aucun `poser`.

## 8.5.0 — 2026-11-27

### Ce qui change

- **Les autres relectures de la chaîne se lancent par `maj-skills:axe-de-relecture`**, sans paramètre `model` : les trois axes de `revue-de-ticket` (et leurs tours de correction), le relecteur de `revue-adversariale` et ses lots, la relecture d'un ticket hors chantier que l'architecte lance, la contre-relecture de l'architecte en régime 7 et dans un dépôt sans la chaîne, la contre-revue du conducteur en régime 7. Leurs sous-agents n'ont plus que Read, Grep et Glob, tournent sur Opus et ne reçoivent plus le `CLAUDE.md` ni les fiches `.claude/rules/` de la session.
- **Les prompts de `revue-adversariale` et de `revue-de-ticket` font lire les règles d'abord** : avant de juger, l'agent lit, dans le dépôt, le `CLAUDE.md` de la racine, celui de chaque dossier que le diff touche et les fiches `.claude/rules/`, qui n'arrivent plus d'elles-mêmes. Le reste des messages ne change pas.
- **Le diff de la contre-revue et de la contre-relecture** : l'agent n'a pas Bash. La session qui le lance lui donne le diff dans un fichier (`diff-revue.sh`, ou `git diff` écrit dans le scratchpad) et lui dit de le lire.
- **Une ligne de plus dans la section de PR** : `- Agent des relecteurs :`, dans les deux gabarits `section-pr.md`, juste après `- Résultat :`. Elle nomme `maj-skills:axe-de-relecture` ou le repli.
- **Le repli** : une session dont l'instantané du plugin est antérieur à 8.4.0 n'a pas la définition. L'outil répond « Agent type 'maj-skills:axe-de-relecture' not found » ; la session relance le même message, entier, par l'agent générique, et le dit là où la relecture rend son résultat : la section de PR (`revue-de-ticket`, `revue-adversariale`), la fin du commentaire de verdict de la contre-relecture (jamais sa première ligne), le journal de la carte du chantier pour la contre-revue du conducteur, `## Comments` du ticket pour la relecture que l'architecte fait faire avant un lancement.
- **Le banc `scripts/agents.test.mjs`** tient ces skills comme ceux de 8.4.0 : le nom, le noyau du repli, la ligne de la section de PR, la phrase de lecture des règles.

### Ce qu'un projet fait pour en profiter

- **Rien à reposer** : les skills, les prompts et les gabarits de section sont lus dans le plugin. Une session lancée avant la mise à jour relit par l'agent générique et le dit.

## 8.4.0 — 2026-11-27

### Ce qui change

- **Deux définitions de sous-agents livrées par le plugin** (dossier `agents/`, liste `agents` de `.claude-plugin/plugin.json`) : `maj-skills:axe-de-relecture` (Read, Grep et Glob seulement, Opus) et `maj-skills:classeur-de-criticite` (aucun outil, Opus). Toutes deux portent `omitClaudeMd: true` : le `CLAUDE.md` et les fiches `.claude/rules/` de la session qui les lance n'entrent plus dans leur contexte. Avant, l'agent générique avait tous les outils, le modèle de la session et ces consignes ; la lecture seule et le contexte vierge ne tenaient que par le texte du prompt.
- **`relecture` lance chaque axe par `maj-skills:axe-de-relecture`, `criticite` son sous-agent par `maj-skills:classeur-de-criticite`**, sans paramètre `model`. Les messages restent les prompts des skills, fabriqués comme avant.
- **Les cinq prompts de `relecture` font lire les règles d'abord** : avant de juger, l'axe lit, dans la base, le `CLAUDE.md` de la racine, celui de chaque dossier que le diff touche et les fiches `.claude/rules/`, qui n'arrivent plus d'elles-mêmes. Le prompt de `criticite` ne change pas.
- **Le repli** : une session dont l'instantané du plugin est antérieur à 8.4.0 n'a pas les définitions (les agents se chargent au démarrage de la session, `claude plugin update` ne les recharge pas). L'outil répond « Agent type 'maj-skills:…' not found » ; la session relance le même message, entier, par l'agent générique, et le dit : la ligne `Agent des axes :` du verdict de `relecture`, toujours écrite, et, dans la section `## Criticité`, l'agent qui a rendu chaque sortie brute. Une telle session relit comme avant jusqu'au renouvellement de son instantané.
- **Un banc neuf, `scripts/agents.test.mjs`**, tient les définitions (leurs clés, leurs outils, leur modèle, leur description), la liste du plugin, chaque nom `maj-skills:<nom>` cité sous `skills/`, et les skills qui nomment leur agent avec la phrase du repli. « Agent défini » entre au glossaire (`CONTEXT.md`).

### Ce qu'un projet fait pour en profiter

- **Rien à reposer** : les définitions, les skills et les prompts qui les nomment sont lus dans le plugin. Une session lancée avant la mise à jour du plugin ne les a pas : elle se replie sur l'agent générique et le dit.

## 8.3.3 — 2026-11-23

### Ce qui change

- **Un prompt de lancement ne commence plus par une commande** : le 2026-11-23, vers 10 h UTC, dans une session cloud, `create_session` (serveur MCP `claude-code-remote`) a refusé tout prompt qui s'ouvre par « / », avec l'erreur « create_session: the new session's prompt can't open with "/" or a <system-reminder> tag, which Claude Code may read as a command. Open it with words instead, and say in plain words what to do. » Or `architecte/references/lancement.md` mettait `/maj-skills:chantier`, `/maj-skills:fusionner` et `/maj-skills:relecteur` en première ligne, seule façon de charger un skill marqué `disable-model-invocation: true`. Les prompts du conducteur, du capitaine, du Relecteur et d'une session de relecture (`relecteur/references/prompt-session.md`) s'ouvrent désormais par une phrase (« Tu es le conducteur du chantier <nom> … Ton rôle est le skill chantier de maj-skills, avec pour argument le nom du sujet : <nom> ; la suite de ce message sont tes consignes. »), la ligne « Skills : » demande de **lire** le fichier du skill sous `~/.claude/plugins/marketplaces/maj/skills/` avec l'outil de lecture, sans l'outil Skill (le plugin installé d'abord s'il manque), et la ligne « Version : » lit la version installée, met à jour, puis suit les fichiers du marketplace. Le même jour, un capitaine et deux conducteurs lancés sous cette forme ont lu le fichier et suivi la version du marketplace. La ligne « Argument : » disparaît (l'argument se dit dans la phrase d'ouverture).
- **La règle est écrite** : le prompt d'une session, d'une fille comprise (`chaine-de-production.md` § 5), ne commence jamais par « / » ni par une balise `<system-reminder>` ; `architecte`, `chantier` et `relecteur` le disent, et un banc (`scripts/depot.test.mjs`) refuse un bloc de prompt qui s'ouvre par une commande ou qui nomme celle d'un skill marqué.

### Ce qu'un projet fait pour en profiter

- **Rien à reposer** : `lancement.md` est lu par l'architecte dans le plugin. Dans un dépôt posé, reposer `socle-chaine-de-production` pour que `docs/agents/chaine-de-production.md` § 5 porte la règle ; le gabarit d'une fille, lui, n'a pas changé.

## 8.3.2 — 2026-11-23

### Ce qui change

- **Un socle posé en « chaîne seule » passe son propre gate** (ticket 91, essai réel de la pose du plugin 8.0.0 sur un dépôt neuf, `socle-monorepo` sans service puis `socle-chaine-de-production`).
- **Le lint et Prettier du projet ne lisent plus les scripts posés par le plugin** : le gabarit `.prettierignore` de `socle-monorepo` porte le bloc `socle:poses-du-plugin` (`scripts/agent/`, `scripts/chaine/`, `scripts/docs/`, `scripts/github/`, `scripts/verify/`), que Prettier et lint-staged suivent, et `eslint.config.mjs` le lit pour ses `ignores`. Au plugin 8.3.0, l'ESLint de la racine y trouvait 14 erreurs (`pnpm check` rouge dès la pose) et chaque commit reformatait les scripts posés. `scripts/dossiers-poses.test.mjs` tient la liste égale aux dossiers que les skills posent.
- **Les références d'une brique non posée se gèlent à l'allumage, et le skill le dit** : `socle-monorepo` (étape 7) nomme les quatre de `.claude/rules/tests.md` vers `socle-tests`, `socle-chaine-de-production` (étape 3) les huit de `criteres-revue.md` et `pieges.md` vers l'API, et comment les geler (`scripts/verify/references-agent-dette.json`).
- **Le registre des coûts est généré à la pose** (`socle-chaine-de-production`, étape 2.3 : `node scripts/docs/couts.mjs`) : `chaine-de-production.md` le cite, `check:contexte` était rouge sans lui.
- **La méthode posée par la racine n'a plus de lien vers une brique absente** : `conception.md` et `pare-feu-ci.md` citaient `apps/api/CLAUDE.md` et `ADR_ALL_ARC-2` par un lien, cassé dans un dépôt sans API.
- **Un seul nom pour la liste de l'admin, `docs/agents/chaine-admin.md`** : `socle-monorepo`, `anchorpost` (sa recette de l'administrateur et son ADR) et `pieges.md` nommaient `docs/agents/admin.md`, que rien ne pose.
- **Une règle de checks exigés vide sur `develop` est un réglage du dépôt, dit à la première lecture** : `checks_exiges` (`github.sh`) sort en 6 sur `RÉGLAGE DU DÉPÔT` (la branche, la règle vide, le geste de l'admin), `file.sh` sort en 6 et la boucle s'arrête (`ARRÊT : réglage du dépôt`), `passer.sh` sort en 3 et `sujet.sh fusionner` en 11 sur la même raison ; avant, toute PR s'y lisait « prête (sans CI) » et n'entrait jamais (vu deux fois à l'essai, au bout d'une heure ou plus). Devant une règle vide d'un ruleset, `checks_exiges` lit encore l'ancienne protection de branche, que GitHub cumule avec les rulesets : si elle exige des checks, ce sont eux, et rien n'est dit ; le réglage n'est dit que si aucune des deux n'en exige. `chaine-admin.md` le dit à la protection de `develop`. Un dépôt sans aucune règle de checks reste « sans CI » : rien n'y entre non plus (chaque PR « CI non déclenchée », de côté), et le capitaine ne le dit pas encore ; c'est un ticket de suite, et la ligne `RÉGLAGE DU DÉPÔT` dit d'ajouter les checks, jamais de retirer la règle.
- **Les durées de `regles.test.mjs` se bornent en étalons**, un travail fixe mesuré juste avant et juste après chaque cas : sous 20 boucles à vide sur quatre cœurs, le pire cas à 20 000 caractères prenait 13,6 s pour une borne de 10 s (2,5 s sur un poste libre) ; il y vaut 8,9 étalons pour une borne de 40, contre 7,2 sur un poste libre. Le rapport du cas « contre-relecture C1 » se compare aussi en étalons : en secondes, il rougissait sous charge.

### Ce qu'un projet fait pour en profiter

- **Ajouter le bloc `socle:poses-du-plugin`** du gabarit `socle-monorepo/references/racine/.prettierignore` à son `.prettierignore`, et à son `eslint.config.mjs` la lecture de ce bloc (`posesDuPlugin`, avec `readFileSync`) et `...posesDuPlugin` dans ses `ignores` (sans le bloc, la configuration du gabarit lève une erreur qui le dit, plutôt que de laisser ESLint relire les scripts posés) ; retirer les dossiers posés qu'il avait mis aux `ignores` à la main. Puis reposer les scripts du plugin tels quels (`git diff` contre le plugin : vide).
- **Reposer `socle-chaine-de-production`** (`references/agent/regles.test.mjs`, `references/admin.md` → `docs/agents/chaine-admin.md`, `references/docs-agents/pieges.md`) et les scripts de `fusionner` et `sujet` (`github.sh`, `file.sh`, `boucle.sh`, `passer.sh`, `sujet.sh`, `faux-gh.mjs`, `sujet-fusionner.test.mjs`, `checks-exiges-vides.test.mjs`) sous `scripts/chaine/`.
- **Un dépôt qui a un `docs/agents/admin.md`** (la section Anchorpost d'avant) la reporte dans `docs/agents/chaine-admin.md` ; rien ne lit l'autre.
- **Vérifier la règle de checks exigés de `develop`** : `gh api repos/{owner}/{repo}/rules/branches/develop --jq '[.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context]'` rend `qualite`, `test-db` et `zizmor`, jamais `[]`.

## 8.3.1 — 2026-11-23

### Ce qui change

- **Le skill `anchorpost` installe la CLI à `^2.0.3`** (ticket 92), publiée sur npmjs.com le 2026-11-23, à l'étape 1 comme dans « Passer au pivot 3 » ; la description du skill et sa ligne du README disent ≥ 2.0.3. La 2.0.3 lit en plus une aide de garde importée par un espace de noms, par défaut, par un baril, ou méthode d'un objet ou d'une classe exportés, et une aide importée qui saute sans condition : la preuve qu'elle fait sauter ou couper tombe ; deux formes restent non lues (README de la CLI, « Limites tenues par la revue »). Elle juge une condition de saut qui compare deux fixtures de Playwright ou lit une variable au nom d'une fixture : une preuve n'y tombe plus à tort, et `page !== context`, qui gardait la sienne, la fait tomber. Elle accepte `zod` 3.25 ou 4 comme pair, et `migrate manifest` y garde la mise en forme du manifeste. `@^2` seul gardait une 2.0.x plus ancienne déjà installée.
- **`floor.by` est une clé de `roles`** : la fiche `.claude/rules/anchorpost.md`, le gabarit du manifeste et le skill disent que la personne qui relève un plancher figure dans la table `roles` et écrit elle-même son nom en `floor.by`. La règle vaut dès maintenant (`compare` tient déjà pour un écart la baisse d'un plancher sans `floor.by` connu des `roles` de la base) ; la CLI 2.0.4 alertera, dans la santé de l'index, un `floor.by` inconnu, sans rien refuser.

### Ce qu'un projet fait pour en profiter

- **Monter la CLI** : `pnpm add -Dw @maj-agency/anchorpost@^2.0.3`, puis `pnpm anchorpost:index` et `pnpm anchorpost:check` ; l'index peut perdre des règles prouvées (une preuve qu'une aide importée faisait sauter, ou qu'une condition `page !== context` gardait, tombe) : le relire, et ne baisser aucun plancher sans la personne qui le signe.
- **Reposer la fiche** `.claude/rules/anchorpost.md`, et vérifier que chaque `floor.by` du manifeste est une clé de `roles` : sinon, la personne s'y ajoute avec son rôle, ou corrige le nom, par une PR à part, avant toute baisse de plancher qu'elle signe (le manifeste est un chemin sensible ; une personne ajoutée dans la PR même n'y signe pas).

## 8.3.0 — 2026-11-22

### Ce qui change

- **Le skill `anchorpost` suit la CLI 2.0.0** (K5 de la preuve suffisante, `SPEC_ALL_ANC-5` § 8) : la CLI est publique sur npmjs.com, installée sans jeton ni `.npmrc` (`@maj-agency/anchorpost@^2`) ; la recette de l'administrateur, l'ADR et la description du skill ne parlent plus de clé ni de GitHub Packages. Le gabarit du manifeste est au schéma `"3"` (plancher `{ date, proven, partial }`, `"sufficiency": "observe"`) ; `check` refuse ce que le pivot 3 ajoute, et le manifeste entre dans `cheminsSensibles`.
- **Passer au pivot 3** : une section du skill (`pivot-3`) dit l'ordre d'un dépôt branché avant la CLI 2.0.0 : la CLI (≥ 2.0.2), `anchorpost migrate manifest` qui écrit le manifeste au schéma 3 tel que la CLI le lit déjà, le plancher relevé à la main, chaque règle « à classer » classée par le skill `criticite`, la repose des skills qui lisent le pivot 3, puis `enforce` sur décision du produit.
- **La fiche `.claude/rules/anchorpost.md`** dit comment écrire une criticité (`{ level, by, reason }`, `date` pour la personne qui baisse), des cas attendus (`id`, `title`, `kind`, `scope`, `family`), les familles sans objet et la révision des cas, l'étiquette de cas `[RULE_…#<cas>]`, la ligne `Prouve:`, et ce que dit `anchorpost compare` (ses écarts, `observe` et `enforce`).

### Ce qu'un projet fait pour en profiter

- **Reposer la fiche** `.claude/rules/anchorpost.md`, dans un dépôt au pivot 3 (un dépôt au schéma 2 la repose au point 4 de « Passer au pivot 3 »), et la section Anchorpost de `docs/agents/admin.md`, et ajouter `anchorpost/manifest.json` aux `cheminsSensibles` de `.claude/chaine.json` (étape 4, point 5) ; un dépôt qui installait la CLI depuis GitHub Packages retire d'abord de `.npmrc` les lignes `@maj-agency:registry=…` et `…_authToken=…`, puis installe la CLI, et supprime ses jetons de lecture.
- **Un dépôt au schéma 2** suit « Passer au pivot 3 » du skill, par une PR relue ; tant qu'il ne le fait pas, rien ne change pour lui.

## 8.2.1 — 2026-11-22

### Ce qui change

- **Un dépôt posé de 8.0.0 à 8.2.0 peut pousser** (ticket 90) : le banc posé `scripts/agent/regles.test.mjs` lit une copie de `regles.mjs` posée seule, et plus `./regles.mjs` : le régime, les chemins sensibles et les migrations du `.claude/chaine.json` du projet, et les index de son `scripts/docs/index-generes.json`, n'entrent plus dans ses défauts. Au régime 8, avec le gabarit (`.claude/**` sensible), son cas « `.claude/skills` » était rouge, et `check:tickets` le joue au pre-push et en CI ; un projet qui ajoute `apps/api/**` à ses chemins sensibles, ou un index `docs/*` à ses index générés, en rougissait deux cas de plus. La règle ne change pas : en régime 8, `.claude/skills/` ne s'écrit qu'avec la ligne `Sensibles:` du ticket, comme tout chemin sensible ; le banc le dit.
- **`develop.test.mjs` quitte `references/`** : banc du plugin (il lit le pre-push du gabarit de `socle-monorepo`), il vit sous `socle-chaine-de-production/scripts/`. Copié dans un projet avec `references/scripts/github/`, il y sortait en `ERR_MODULE_NOT_FOUND` à l'étape 3 du skill (`node --test scripts/github/*.test.mjs`).
- **Un garde dans le plugin** (`scripts/references-posees.test.mjs`) : tout banc rangé sous `references/` d'un skill est posé dans un dépôt jouet, à sa place de projet, avec ses voisins, les dépendances de la racine (un lien vers `node_modules` du plugin, comme un projet a les siennes) et le contrat du gabarit au régime 8 puis au régime 7, et joué ; un échec, un saut hors du seul attendu (sous-tests compris), un test « todo », un banc qui, posé, n'écrit aucun test, un banc sans place connue sous `references/` ou moins de 350 tests joués le rougit. Il ne dépend d'aucun module installé hors du dépôt : il joue les bancs sans `NODE_PATH`, et un `typescript` global du poste ne le fait plus passer.

### Ce qu'un projet fait pour en profiter

- **Reposer `socle-chaine-de-production`** : `references/agent/regles.test.mjs` → `scripts/agent/regles.test.mjs`. Un projet qui avait isolé ce banc à la main (paramètres explicites) reprend le fichier du plugin. Un `scripts/github/develop.test.mjs` copié par erreur se supprime : il ne fait pas partie de la pose (étape 9 : `develop.sh` seul).

## 8.2.0 — 2026-11-22

### Ce qui change

- **Le gate `preuves`** (K2 de la preuve suffisante, `SPEC_ALL_ANC-5` § 5) : `scripts/verify/preuves.mjs`, posé par `socle-tests`, relaie `anchorpost compare` (CLI Anchorpost ≥ 2.0.0) contre ce sur quoi le travail sera fusionné, la base choisie comme `coverage-diff --base-auto`. Il résume les règles touchées et chaque écart (cas sans preuve, niveau qui manque, criticité baissée…), rend la sortie de la CLI (1 sur un écart en `enforce`, 0 en `observe`) et, sous GitHub Actions, ajoute le rapport entier au résumé du job. Sans index commis au pivot 3, il ne fait rien. Au pre-push après `check:coverage`, en fin de tour par `gatesRapides`, en CI sur la cible de la PR.
- **La fiche des tests** porte la grille par criticité (ce qu'un cas normal, un cas limite, une entrée invalide ou un refus exigent selon que la règle est basse, moyenne ou haute), l'étiquette de cas `[RULE_ALL_LIC-2#seconde-licence]` et le niveau P2 du bout en bout d'une CLI (`*.e2e-cli.spec.ts`).
- **La mutation du `code` des règles** (K6) lit l'index au pivot 3, et y garde les règles `proven` **et** `partial` (toujours `proven` seules au schéma 2). Sa synthèse est datée et dit, par règle, la criticité et le score, ou « non mesurée » quand aucun test rejoué n'atteint son code, jamais « 0 % ». Le workflow `Mutation` publie la mesure en artefact (`mesure-regles`), relit celle du passage précédent et signale chaque baisse de score d'une règle moyenne, sans rien refuser. Le gabarit d'ADR du score de mutation le dit (point 5).

### Ce qu'un projet fait pour en profiter

- Rien, tant que son index Anchorpost n'est pas au pivot 3 : `preuves.mjs` dit « rien à comparer » (un index présent qui n'est pas un objet JSON le fait sortir en 2), la mutation garde les règles `proven` du schéma 2 ; la synthèse de la mutation porte désormais sa date, une ligne par règle et la section des baisses.
- **Reposer** (skill `socle-tests`, pièce par pièce) : `scripts/verify/preuves.mjs` et son banc (le relais importe `BASE_DEFAUT`, `baseDepuisPush`, `choisirBase` et `decisionSansBase` de `scripts/verify/coverage-diff-regles.mjs`, du socle 3.10.4 ou plus récent, et son banc lit `scripts/docs/environnement-de-banc.mjs` du socle 7.21.0 : un projet à qui l'un manque, ou qui l'a d'avant, le repose avec ; sinon le relais ne se charge pas (`coverage-diff-regles.mjs` d'avant 3.10.1), ou son banc fait échouer `check:tickets` ; dans le dépôt de la CLI elle-même, le relais s'adapte comme son `anchorpost.mjs`), le script `check:preuves`, sa ligne au pre-push après `check:coverage`, son entrée dans `gatesRapides`, l'étape de CI sur `pull_request` ; `mutation-regles.mjs`, `mutation-regles-synthese.mjs` et leurs bancs ; `.github/workflows/mutation.yml` (permission `actions: read`, étapes « Mesure précédente » et « Mesure datée ») ; la grille et l'étiquette de cas dans `.claude/rules/tests.md` ; le point 5 de l'ADR du score de mutation du projet s'amende comme le gabarit.

## 8.1.0 — 2026-11-22

### Ce qui change

- **La ligne `Prouve:`** (K3 de la preuve suffisante, `SPEC_ALL_ANC-5` § 8) : un ticket qui prouve une règle sans la réaliser (il en écrit les tests, une autre feature porte son code) la nomme sur une ligne `Prouve:` de son en-tête, jamais sur `Règles:`, qui dit ce que la feature réalise et seule lui donne sa criticité. Le gate `tickets` la lit comme `Règles:` (identifiant complet, registre, contexte), refuse `Prouve: —` et une règle citée sur les deux lignes ; la revue de ticket la rend sous « Règles du ticket », et `T3` relit les preuves de ses règles ; sa clause (d) accepte aussi un cas porté par un ticket ouvert dont la ligne `Prouve:` cite la règle, au régime 7 (`revue-de-ticket`) comme au régime 8 (`relecture`). Le gabarit de ticket porte la ligne, sous `Règles:`.
- **Le gate `tickets` juge la preuve suffisante d'un ticket prêt** (K3), quand l'index Anchorpost commis est au pivot 3 : chaque règle de `Règles:` ou de `Prouve:` a une criticité et des cas attendus dans l'index, et `## Surfaces` nomme chacun de ces cas (`RULE_ALL_LIC-3#lien-expire`), avec la preuve qui le portera ou le ticket qui la portera. Refus si l'index dit `enforce`, avertissement sinon (`observe`, le défaut) ; **sans index au pivot 3, rien ne change**. Un index présent qui n'est pas du JSON fait sortir le gate en 1.
- **La copie de lecture de `SPEC_ALL_ANC-5`** (`docs/issues/standard-documentation/preuve-suffisante.spec.md`, K1) est celle de la spec amendée (`develop` d'Anchorpost, `2be4e7e`) ; le gabarit de règle montre la `date` facultative d'une criticité et la révision des cas (`caseRevision`), les deux gestes d'une personne que lit la CLI Anchorpost 2.0.0.

### Ce qu'un projet fait pour en profiter

- Rien, tant que son index Anchorpost n'est pas au pivot 3 : le gate se comporte comme avant, deux points mis à part : la ligne `Prouve:` (une ligne nouvelle, que nul ticket ne porte encore), et un index `anchorpost/anchorpost.json` présent qui n'est pas du JSON, qui fait désormais sortir le gate en 1 quel que soit le pivot, régime 7 compris, `--elaguer` et `--geler-*` compris.
- **Reposer** `scripts/verify/tickets.mjs` et `tickets-regles.mjs` (skill `tickets`), `scripts/chaine/contexte-ticket.mjs` (skill `revue-de-ticket`, `poser` ; les critères `criteres-ticket.md` se lisent dans le plugin, rien à reposer), et les gabarits `docs/agents/gabarits/ticket.issue.md` et `regle.md`. Au pivot 3 en `observe`, `pnpm check:tickets` signale les tickets prêts qui citent une règle « à classer » ou sans cas, ou dont `## Surfaces` ne nomme pas un cas ; les corriger avant que le produit ne passe le projet en `enforce`, où ils seront refusés.

## 8.0.2 — 2026-11-22

### Ce qui change

- **Un calcul sorti en 69, ou `jq` absent, est une panne** (ticket 75, `A-192` point 1) : `double-relecture.mjs` ou `meme-contenu.sh` sorti en 69 (git plus ancien que 2.41, la grammaire des identifiants introuvable) arrête le capitaine (`revue-exigee.mjs` sort en 3, `passer.sh` en 3, `sujet.sh fusionner` en 11) et le Relecteur (sortie 6), la cause dite. Ce n'est plus une lecture illisible, qui faisait sauter chaque PR en silence chez le capitaine et la traçait à chaque délai chez le Relecteur. Sans `jq`, `github.sh` sort en 69 dès son chargement, avant tout calcul : `passer.sh` et `sujet.sh` s'arrêtent en 69, comme avant ; le Relecteur, qui lisait cette sortie « GitHub illisible » (5) et faisait une pause sans fin, s'arrête en 6 lui aussi, la cause dite (contre-relecture de la PR 153).
- **Le script du Relecteur** (ticket 76) : son usage nomme `--sondes` ; son en-tête dit qu'un plafond rejoué après un retrait refusé redit « décision de plafond attendue » à l'auteur et au conducteur, ce qui est gardé (`A-189` point 1) ; deux bancs tiennent ce plafond rejoué et une trace d'illisible qui n'est pas la marque.
- **Le texte du Relecteur** (ticket 77) : la sortie 5 de `jouer` a sa borne (à la seconde fois de suite sur la même PR, l'architecte et `--taire <n>`) et se lit, comme `create_session` en échec, « rejouer au réveil suivant », que `--attendre` suit ; chaque borne dit « de suite » ; `reecrire` d'une session hors service peut rendre `panne`, dont les lignes partent ; « un champ absent, `couple` » ; le plafond rejoué y est écrit ; la sortie 6 nomme la sortie 69 des calculs.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1) : le Relecteur lit son skill et son script dans le plugin à son prochain lancement.
2. Reposer, dans une PR du projet : `/maj-skills:fusionner poser` (`revue-exigee.mjs` change), puis relancer le capitaine.

## 8.0.1 — 2026-11-22

### Ce qui change

- **Une PR de fourche est sautée par le capitaine** (ticket 78, `A-192` point 2), dans les deux régimes : `passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer` la sautent sans renvoi (sortie 7), avant tout fetch de sa tête, comme le Relecteur la dit illisible. Une fourche dont la branche portait le nom d'une branche d'origin faisait juger, mettre à jour, pousser et fusionner cette branche d'origin à sa place (`relancer` la mettait à jour et la poussait pour une sous-PR sans CI, `A-199`). Une sous-PR de fourche ne tient pas son sujet, quelle que soit sa CI (`A-201`) : `file.sh` la lit « sujet/<nom> : fourche » sur la liste des PR, `boucle.sh` la dit « sous-PR de fourche, sautée », sans la mettre à jour, la renvoyer ni relancer ses jobs rouges, et l'autre sous-PR du sujet entre au même tour.
- **Une PR de mise à jour d'un sujet** (ticket 78, régime 8) : elle ne joue plus qu'une revue du capitaine au premier contrôle, son régime lu d'abord sur le sujet ; et quand aucun ticket ni aucune spec ne déclare le sujet, son motif dit son geste (un ticket du sujet accorde le chemin sensible), et plus celui d'une PR sans ticket.
- **Le hook d'édition** (ticket 79, régime 8) : l'héritage d'une copie de ticket sur un sujet se juge contre le develop d'origin ; une copie locale de develop en retard ou absente ne juge rien : la copie du sujet ne compte pas, et le refus dit de relire develop (comptée, une copie héritée d'un accord que develop a retiré l'accordait encore, `A-199` point 2). Quand le refus a un geste (relire les copies, approfondir le clone), il vient en tête, avant la demande au conducteur.
- Rien d'autre ne change en régime 7 (un dépôt sans la clé `relecture`) : la fourche y est sautée de même, sans tenir son sujet ; le premier contrôle d'une PR de mise à jour n'y jouait déjà qu'une revue, et la garde des chemins sensibles du capitaine comme le refus du hook n'y tournent pas.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1).
2. Reposer, dans une PR du projet : `/maj-skills:fusionner poser` (`passer.sh`, `boucle.sh`, `file.sh`), `/maj-skills:sujet poser`, `/maj-skills:revue-adversariale poser` et `/maj-skills:socle-chaine-de-production` (le hook d'édition) ; puis relancer le capitaine.

## 8.0.0 — 2026-11-22

### Ce qui change

- **La bascule : le régime 8, la relecture indépendante, devient posable** (lot 6 du chantier « relecture indépendante »). Le gabarit `.claude/chaine.json` du socle porte la clé `relecture` (`depuis`, l'instant de la pose, placeholder `{{DEPUIS}}` ; `delai` ; `ordinaire` et `sensible`, le modèle et l'effort d'une session de relecture) : un dépôt posé avec cette version est en régime 8 dès sa première PR. Toute PR y est relue par une session de relecture que lance le Relecteur du dépôt ; la session qui code ne se relit plus et ne pose jamais `à-fusionner`. Rien n'est retiré : les scripts gardent leur branche 7, et un dépôt déjà posé reste en régime 7 tant que sa repose n'a pas posé la clé.
- **Les documents du régime 8** : `chaine-de-production.md` (les rôles, le Relecteur et la session de relecture ; la relecture dans le cycle ; la ligne `Sensibles:` et l'accord du produit avant le code ; la fille qui demande la relecture, corrige ou conteste, et son réveil de secours ; le relevé des coûts des sessions de relecture et la ligne « à archiver »), le fragment `CLAUDE.md` de la fusion, `issue-tracker.md` (livrer, c'est demander la relecture), `conception.md` et le `CLAUDE.md` du socle, les skills `criticite` et `recette-humaine`. `avancement.mjs` dit les PR « à reprendre » et « en relecture ».
- **Les skills des rôles à deux régimes** : `chantier`, `architecte`, `fusionner` et `sujet` disent en tête comment lire le régime, puis décrivent le régime 8 ; ce qui ne vaut qu'en régime 7 est dans `chantier/references/regime-7.md`. Le conducteur ne contre-relit plus, arbitre, reçoit les plafonds, et n'archive plus : il nomme ses filles et leurs sessions de relecture à l'architecte (`à archiver : …`), qui archive. Le capitaine juge par les verdicts (« Le verdict », dans `fusionner`) et n'archive plus aucune session, en régime 7 aussi (`P-62`) : il nomme à son lanceur une session finie sans tag ; une sous-PR sautée pour une lecture illisible garde son sujet. La PR de réception de develop dans un sujet demande sa relecture. L'architecte lance un Relecteur par dépôt, arbitre les PR du conducteur, décide au plafond, et mène la repose d'un dépôt au régime 8.
- **La veille du capitaine** : le `trigger_id` du réveil de garde est noté et supprimé avant l'archivage du capitaine ; la ligne `CAPITAINE_ID requis` d'une copie d'avant `--etat` se distingue d'un autre 64 ; un arrêt posé par la garde elle-même se reconnaît à son heure ; le pid du `REFUS` se dit une fois ; un arrêt demandé n'est levé que par qui l'a posé.
- **Le gate `settings-json`** refuse, quand le contrat porte la clé `relecture`, une entrée `permissions.allow` qui pré-approuve `create_session` : l'outil refuserait l'effort des sessions de relecture.
- **Une quatrième ADR** : « relecture indépendante et accord des fichiers sensibles », qui remplace l'ADR « CODEOWNERS » et amende les points 1, 4 et 5 de l'ADR de la chaîne.
- **Contre-relecture de la bascule** : l'arbitrage et la décision de plafond sont écrits à l'auteur, qui redemande la relecture ; le réveil de secours sonne à 120 minutes ; le conducteur ne pose `à-relire` ni sur un brouillon ni sur une PR en régime 7, et relève le Relecteur ; un Relecteur ne se lance qu'avec la clé ; une garde se retrouve par son nom et sa session ; `avancement.mjs` range « en relecture », et non « à reprendre », une PR renvoyée dont la relecture est redemandée.

### Ce qu'un projet fait pour en profiter

- Rien, tant que sa repose n'est pas faite : sans la clé `relecture`, tout se passe comme dans la version précédente, aux textes près (les skills `chantier`, `architecte`, `fusionner` et `sujet` renvoient à `regime-7.md`). Les documents posés (`chaine-de-production.md`, le fragment `CLAUDE.md` de la fusion, `issue-tracker.md`) ne décrivent que le régime 8 : ils ne se reposent qu'avec la clé, par la repose, jamais seuls.
- **La repose**, par l'architecte du projet (skill `architecte`, « La repose d'un dépôt au régime 8 »), dans cet ordre : l'accord du produit sur les fichiers sensibles des tickets non commencés ; le Relecteur lancé ; la PR de repose (la clé `relecture`, les scripts de `fusionner`, `sujet`, `relecture` et du socle reposés, les documents du régime 8, la quatrième ADR, les lignes `Sensibles:` accordées, `create_session` retiré des `permissions.allow`) ; puis le capitaine relancé et les conducteurs relevés.

## 7.39.0 — 2026-11-22

### Ce qui change

- **Le capitaine juge l'éligibilité par les verdicts, deux fois** (régime 8, lot 5a de la relecture indépendante) : pour une PR dont la base porte la clé `relecture` de `.claude/chaine.json` et qui a été ouverte après `depuis`, `passer.sh` et `sujet.sh fusionner` ne lisent plus la section de revue du corps ; ils exigent un tour de relecture validé pour le contenu du sommet (la règle 2 du Relecteur, `tourValide`), avant toute mise à jour et toute CI, puis de nouveau juste avant l'appel de fusion, sur le sommet fusionné. Une mise à jour du capitaine garde le verdict (« même contenu propre »). Sans tour validé : renvoi ; lecture illisible : PR sautée sans renvoi ; `à-fusionner` retirée pendant la CI : sautée. Une PR empilée en régime 8 est renvoyée. Le check `PR titre` suit le régime (variable `PR_OUVERTE` du workflow).
- **Les gardes des fichiers sensibles** (régime 8, lot 5b) : le hook d'édition refuse d'écrire un chemin sensible que la ligne `Sensibles:` du ticket de la branche, lue sur le sujet (sur develop pour un ticket sans sujet), ne couvre pas ; `passer.sh` et `sujet.sh fusionner` renvoient une PR dont le diff propre en touche un hors de cette ligne, ou sans ticket (`chemins-sensibles.mjs --garde`) ; une PR de mise à jour d'un sujet ne touche un chemin sensible qu'en conflit et couvert par un ticket du sujet.
- **Les renvois, les messages et le gate selon le régime** (régime 8, lot 5c) : `renvoyer.sh` fait redemander la relecture (`à-relire`), jamais remettre `à-fusionner` ; `sujet.sh demarrer` dit comment demander la relecture, et son refus ne conseille plus `sujet.sh rafraichir` à une session ; le gate `tickets` n'exige plus `Label: contre-revue` et exige `Relecture: double` sur un ticket ouvert qui cite une règle haute.
- **`sujet.sh etat`** liste un sujet sans commit propre ni PR ouverte, en retard sur develop et pas livré (une livraison intermédiaire tout juste entrée, A-132) : la boucle du capitaine y reporte develop.
- Rien ne change pour une PR du régime 7, ni pour un dépôt sans la clé `relecture`, hors `sujet.sh etat` (ci-dessus, A-132) et le refus de `demarrer` (A-69), voulus dans les deux régimes.
- Contre-relecture, tour 1 : un calcul absent à côté de `revue-exigee.mjs` est une panne (3), jamais une lecture illisible ; une PR poussée pendant sa lecture par `passer.sh` est sautée, jamais renvoyée faute de verdict ; `renvoyer.sh` et `demarrer` donnent la forme entière de la demande de relecture (`À relire — sommet <sha> — Session: <id> — Conducteur: <id>`, seule dans son commentaire), `renvoyer.sh` lit le régime d'une PR empilée sur develop et `demarrer` le dit aussi pour une PR vers develop ; le hook d'édition dit de relire le sujet quand sa copie locale du ticket est en retard sur origin ; le refus de `demarrer` dit de passer par le conducteur ; les motifs de la garde du capitaine disent qui demande l'accord, et son fetch élague les sujets supprimés ; une copie de ticket qu'un sujet n'a pas écrite, héritée de develop, ne compte ni pour la garde ni pour le hook (tour 2), et dans un clone superficiel, où la base de fusion ne se lit pas, le refus du hook dit de l'approfondir (tour 3) ; le gate lit la criticité comme le calcul (le plus haut niveau, en vigueur si l'index ou l'en-tête le dit) ; le faux GitHub pagine les commentaires.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1).
2. Reposer, dans une PR du projet : `/maj-skills:fusionner poser`, `/maj-skills:sujet poser`, `/maj-skills:revue-adversariale poser` (la garde `--garde` de `chemins-sensibles.mjs`), `/maj-skills:socle-chaine-de-production` (le hook d'édition, `pr-titre.mjs` et son workflow) et `/maj-skills:tickets` (le gate) ; puis relancer le capitaine (les scripts de la boucle changent).
3. Rien d'autre tant que le dépôt n'est pas en régime 8 : la clé `relecture` arrive avec la bascule (lot 6).

## 7.38.3 — 2026-11-22

### Ce qui change

- **La veille du capitaine ne meurt plus en silence** (ticket 74). Le skill `fusionner` la lance avec le `timeout` de l'outil Bash à `7200000` (l'outil arrête une tâche de fond à 30 minutes par défaut, et la veille compte sur deux heures). `veille.sh` tient un verrou (`<git-common-dir>/veille.verrou` : une seconde veille sort en 9 après 3 s) et écrit son état (`<git-common-dir>/veille.etat`) ; `veille.sh --etat` dit `VEILLE VIVANTE`, `VEILLE TERMINÉE` ou `VEILLE MORTE`, sans `CAPITAINE_ID` ni réseau. Une fin sans ligne finale est une veille morte : `boucle.sh --arreter`, puis la veille relancée avec `--reprendre`, qui retire le fichier d'arrêt dès son verrou pris, avant sa préparation. Le journal de la veille s'ouvre en ajout (`>>`). Un réveil de garde (`send_later`, 60 minutes, réarmé à chaque réveil de garde) relit cet état et relance une veille morte avec son conteneur.
- Contre-relecture de la PR 150 : la boucle lancée par la veille ne reçoit plus `--reprendre` (un arrêt posé pendant le démarrage la tient arrêtée) ; un verrou de la veille qui ne s'ouvre pas sort en 6, jamais `VEILLE VIVANTE` ; la garde ne lève jamais un arrêt demandé, se réarme après une veille vivante, et une boucle qui tient le verrou sans veille a sa suite (sortie 9).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1) : le capitaine lit le skill à jour à son prochain lancement.
2. Reposer les scripts dans une PR du projet : `/maj-skills:fusionner poser` (`veille.sh` change). Un capitaine en marche garde sa copie de la veille jusqu'à une nouvelle copie et une veille relancée.

## 7.38.2 — 2026-11-22

### Ce qui change

Deux bancs disent ce qu'ils tiennent (ticket 70). Pour qui joue la CI du plugin : `scripts/relecture.test.mjs` exige les trois phrases d'`A-178` à leur place, la puce `C4` de l'étape 5 du skill `relecture`, le paragraphe avant « Gravité, deux seulement : » du prompt de l'axe Règles, la puce `/security-review:` des règles du verdict, et plus seulement dans leur fichier ; le commentaire du banc du gate `tickets` dit exactement ce que `trim()` ôte d'un nom d'accord.

### Ce qu'un projet fait pour en profiter

Rien : aucun texte de skill ni aucun script posé ne change.

## 7.38.1 — 2026-11-21

### Ce qui change

Les mineurs de la contre-relecture de la PR 146, sur le skill `relecteur` (tickets 67 à 69) :

- **Une étiquette restée n'étouffe plus une ligne** : `jouer` lit les événements de la PR ; une étiquette déjà posée n'est un passage rejoué que si elle l'a été après la marque la plus récente de la PR. Restée d'un tour d'avant, le refus ou la validation se disent à l'auteur et au conducteur.
- **Le plafond pose l'étiquette avant son commentaire** : un plafond à moitié écrit se rejoue entier, et l'architecte en est prévenu.
- **Une session de relecture à un autre couple que la PR** (`couple`, la PR devenue sensible ou « double » sans push) est remplacée, une fois par tour, cause `couple` (`decision-relecteur.mjs`, `A-182`).
- **La veille** garde l'erreur d'une installation quand GitHub se tait ensuite (sortie 5) ; `--attendre` met une pause avant sa première passe, pour une veille relancée sur une sortie à rejouer ; la sortie 9 s'arrête à la seconde fois, comme 12.
- **La préparation** relit origin avant de dire une tête introuvable ; la cause « dépendances de develop » dit comment l'installation se retente.
- **Le skill** dit la suite d'un `send_message` en échec, les causes des lignes à l'architecte (`create_session` en échec, une commande coupée sans code), et une quatrième forme de ligne, une ligne perdue.
- Le faux GitHub des bancs tient les événements d'étiquette d'une PR (`GET issues/<n>/events`).
- Les bancs tiennent aussi, depuis la contre-relecture de la PR 147, la marque lue sur un commentaire à marque, une PR sans marque, des événements illisibles ou sur deux pages, la tête relue en échec, et les quatre formes des lignes à l'architecte et les bornes de 12 et d'une sortie hors de la table, chacune à sa place.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1).
2. Reposer les scripts dans une PR du projet : `/maj-skills:fusionner poser` (la décision du Relecteur admet l'état `couple` ; sans repose, un Relecteur à jour qui l'écrit sort en 1 sur la décision de develop).
3. Rien d'autre tant que le dépôt n'est pas en régime 8.

## 7.38.0 — 2026-11-20

### Ce qui change

- **Le skill `relecteur`** (régime 8, lot 4 de la relecture indépendante) : le Relecteur d'un dépôt, une session par dépôt, lancée par `/maj-skills:relecteur` en première ligne. Une veille relit la file (`à-relire`, `à-fusionner`) des PR du régime 8 ; `relecteur.mjs` prend la décision du Relecteur (`decision-relecteur.mjs` de develop, la même que celle du capitaine) sur les faits des calculs de develop, pose `à-reprendre` et `à-fusionner` (la nouvelle étiquette avant l'ancienne), écrit les distributions après la création des sessions ; la session crée les sessions de relecture sur la base de la PR, leur écrit et lit leur état. Rien ne change pour une PR du régime 7.
- **Deux labels de plus, `à-relire` et `à-reprendre`** : `labels.sh` en pose neuf. Le gabarit de lancement du Relecteur est dans `architecte/references/lancement.md` ; la carte d'un programme a une ligne `Relecteurs:`, celle d'un chantier une ligne `Relecteur:`.
- **Un refus reste un refus** : sur une PR à chemin sensible, un `refusé` sans la ligne `/security-review: lancée` rend la PR à son auteur (`compter`, `decision-relecteur.mjs`) ; la limite écrite dans le skill `relecture` est retirée.
- Le faux GitHub des bancs rend la date d'ouverture d'une PR et date un commentaire posé à l'heure du banc.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin (comme pour 7.31.0, étape 1).
2. Reposer les scripts dans une PR du projet : `/maj-skills:fusionner poser` (la décision du Relecteur change). Un administrateur joue `bash scripts/github/labels.sh` après avoir reposé le socle (`/maj-skills:socle-chaine-de-production`), pour créer les deux labels.
3. Rien d'autre tant que le dépôt n'est pas en régime 8 : la clé `relecture` de `.claude/chaine.json` arrive avec la bascule (lot 6). Le Relecteur se lance à la repose qui la pose.

## 7.37.3 — 2026-11-20

### Ce qui change

Trois petits correctifs (ticket 65). Pour un projet : un nom d'accord de `Sensibles:` qui porte une tabulation ou un autre caractère de contrôle est refusé, sous le message d'`A-170`. Pour qui joue la CI du plugin : l'en-tête de `codeSeul` écrit sa limite (`await`/`yield` lus comme réservés, donc une source de module) et un test tient que `poses` ne lui donne que des `.test.mjs`. Pour le skill `relecture` (qui se charge depuis le plugin, sans se poser dans un projet) : le clone de C4 reste dans le dossier de la session, et un rapport vide de `/security-review` n'est pas une preuve d'absence de faille.

### Ce qu'un projet fait pour en profiter

Rien d'obligatoire. Pour recevoir le gate `tickets` corrigé : `/maj-skills:fusionner poser` dans une PR du projet.

## 7.37.2 — 2026-11-20

### Ce qui change

La CI du plugin joue mieux ses bancs posés (ticket 64). Pour qui joue la CI du plugin : `scripts/poses.test.mjs` lit les sous-tests dans le code seul (`codeSeul` : le texte d'une chaîne ou d'un commentaire, comme un titre de commit « suite (#2) », ne fait plus jouer un banc entier ; dans le doute il se joue entier), part des travaux les plus lourds en tests, donne à chaque travail une borne qui suit son poids (60 s par test, au moins 300 s) et le tue par son groupe de processus, et prend pour délai un plafond de 1 800 s. Le bilan (part du plafond, pire cas, les trois marges les plus courtes) s'écrit dans le journal en vert comme en rouge (`# poses : …`) ; atteindre le plafond rougit et dit de découper. Pour un projet : le banc posé `double-relecture.test.mjs` date son socle et sa tête, la précondition du test « un environnement hostile … (A-122) » ne dépend plus de l'horloge ni de la version de git.

### Ce qu'un projet fait pour en profiter

Rien d'obligatoire. Pour recevoir le banc posé stable : `/maj-skills:fusionner poser` dans une PR du projet.

## 7.37.1 — 2026-11-20

### Ce qui change

Le skill `relecture` : les suites de la contre-relecture de 7.36.0 (trois mineurs), plus un trou trouvé en préparant le ticket.

- **La résolution d'une PR de mise à jour se découpe en lots** au-delà de 2 000 lignes de `resolution.patch`, comme le diff relu et par la même fonction : par zone, `lots/resolution-<j>/`, leur union vérifiée contre `resolution.txt` (« lots de la résolution : … », sortie 12). L'axe Règles se lance une fois par lot (`lus '<brouillons>' 1 resolution-<j>`). Un seul lot : la résolution entière, comme avant.
- **Un binaire que seule la résolution touche** (sans écart contre le sujet, la version de `develop` jetée par une résolution « ours ») est nommé parmi les binaires du tour, illisible ou sous un chemin sensible selon les mêmes règles : aucun axe n'a à le dire lu, le verdict le nomme. C'est le trou trouvé en préparant le ticket ; une commande de lecture en échec sort en 12 (« liste des binaires de la résolution illisible »).

Dans le dépôt du plugin seulement : un cas de banc tient la branche du tri où `develop` ne fait que retirer et où la résolution insère à ce point ; d'autres tiennent la panne de chaque lecture de binaires, les deux parents de la fusion, le diff relu et la résolution découpés ensemble.

Depuis 7.36.0, la résolution d'une PR de mise à jour se relit : `git show --remerge-diff` du commit de fusion, que l'axe Règles lit en entier ; une ligne de `develop` qu'elle retire est un constat, jamais écartée (`A-164`).

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; rien d'autre (rien n'appelle encore le skill, comme le dit la note 7.36.0).

## 7.37.0 — 2026-11-20

### Ce qui change

« Une sous-PR à la fois par sujet » est tenue par le capitaine, plus par le conducteur. À chaque tour de sa boucle, le capitaine ne prend qu'une sous-PR étiquetée par sujet ; les autres attendent leur tour avec leur étiquette (`[#<n>] attend son tour : #<m> passe d'abord dans sujet/<nom>` dans le journal), sans mise à jour, ni CI, ni renvoi. Qui tient le sujet le garde, avant tout ordre de numéro : une sous-PR en passage chez un autre capitaine, sinon celle que la boucle tenait au tour précédent, sinon une sous-PR dont la CI tourne ; personne ne le tient, la plus ancienne (le plus petit numéro) le prend. La suivante est prise dans le tour où celle qui tient entre ou sort de la file ; tant que le sujet reste tenu, la boucle le dit à chaque tour (`[sujet/<nom>] tenu par #<n> (<raison>)`). La veille relance la boucle quand la sous-PR qui tient un sujet change d'état ou quitte la file, et une fois quand le verrou d'un autre capitaine qui tenait un sujet a expiré. Le conducteur étiquette toutes les sous-PR prêtes d'une vague : il ne retire ni ne repose plus `à-fusionner` (skill `chantier` § 6), ce qui coûtait jusqu'à 45 minutes d'attente par sous-PR. Une PR de mise à jour d'un sujet s'ouvre, comme avant, sans sous-PR étiquetée devant elle : derrière une sous-PR plus ancienne en route, elle attend son tour, puis elle est à refaire. Une sortie 128 de `sujet.sh` est une erreur fatale de git, pas un signal : elle rend le sujet, comme toute erreur ; seules les sorties 129 et plus le tiennent comme un signal. Une lecture GitHub en panne sur une sous-PR d'un sujet ne le donne à personne : à ce tour, aucune sous-PR de ce sujet n'est prise ; le sujet est repris au prochain changement de la file, ou à la veille suivante (au pire à la fin de la veille en cours, 75 minutes par défaut). Le délai du banc des scripts posés (`scripts/poses.test.mjs`, dans ce dépôt) passe de 620 à 900 secondes (décision A-166) : ses tranches jouent désormais les cas de la boucle ; la minuterie de 300 secondes par tranche, la couverture et le plancher restent. Le banc `une-sous-pr-a-la-fois.test.mjs` se joue de nouveau en tranches (décision A-169) : le titre de commit `feat(<nom>): suite (#2)` d'un de ses dépôts jouets était lu comme un sous-test (`suite(`), ce qui le faisait jouer entier ; il devient `feat(<nom>): suite, #2`.

Deux limites connues. Deux capitaines aux mémoires séparées (`boucle-tenus` vaut pour un clone) peuvent mettre à jour deux fois la même sous-PR : une CI de plus, jamais une fusion non testée ; deux capitaines lancés au même instant sont départagés par le verrou du passage. Un nom de sujet qui porte un mot du filtre du `Monitor` du capitaine (`conflit`, `rouges`…) fait entrer ses lignes d'attente dans ce filtre et réveille le capitaine sans objet, à chaque tour.

Le bilan de fin de chantier est supprimé (décision du produit du 2026-11-18), sans rien à la place : le gate `tickets` n'exige plus de section `## Rétro` pour passer une carte à `fini`, et le skill `chantier`, la méthode, `pieges.md` et le gabarit de carte ne la demandent plus. Un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive, ou, faute de gate, une ligne de `docs/agents/pieges.md`. Une carte qui garde sa section `## Rétro` passe aussi.

Le gate `tickets` juge la forme de deux lignes d'en-tête qu'il ne lisait pas, sans les exiger : `Sensibles:` (`—`, ou des chemins puis ` — accord de <nom>, <AAAA-MM-JJ>`) et `Relecture: double`. Il les lit dans l'en-tête seul, sous les formes `X:`, `**X:**`, `- X:` et `* X:`, sans égard à la casse de la clé ; mal formée, une ligne est refusée, le fichier et la ligne nommés. Aucune garde ne les lit encore. Il accepte `Règles: —`, seul, pour un ticket qui ne réalise aucune règle. Le rôle `relecture` d'une ligne de `## Coût` passe sans être jugé au plafond et compte au registre dans le total, pas dans la part des filles. `Label: contre-revue` reste exigé comme avant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts du capitaine, dans une PR du projet : `/maj-skills:fusionner poser`.
3. Relancer chaque capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). La boucle se remplace d'elle-même par la version de develop ; la veille tourne sur sa copie, c'est elle qu'il faut recopier.
4. D'ici là, le conducteur garde l'ancienne discipline, une seule sous-PR étiquetée à la fois par sujet : un capitaine dont les scripts ne sont pas reposés prend encore toutes les sous-PR étiquetées d'un sujet dans le même tour. Avec plusieurs capitaines, il ne l'abandonne qu'une fois tous relancés.
5. Reposer le gate et les gabarits, dans une PR du projet : `/maj-skills:tickets poser` (`scripts/verify/tickets-regles.mjs`, `tickets.mjs` et leurs tests, `scripts/docs/couts.test.mjs`, les gabarits de ticket et de carte). Une ligne `Sensibles:` ou `Relecture:` mal formée dans l'en-tête d'un ticket rougit alors le gate : la corriger, ou la retirer.
6. Dans la même PR, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) le § 2 sans rétro (le schéma du cycle, la parenthèse du point 2 et le point 7), et dans `docs/agents/pieges.md` sa phrase d'en-tête : un incident donne un ticket au moment où il arrive. Une carte déjà `fini` garde sa section `## Rétro`, sans effet.

## 7.36.0 — 2026-11-20

### Ce qui change

Le plugin porte un skill de plus, le skill `relecture` (`skills/chaine/relecture/`) : ce que joue une **session de relecture**, lancée par le Relecteur d'un dépôt et jamais par l'auteur d'une PR. Elle se place sur la base de la PR, extrait le sommet à relire dans un arbre de travail à part, y joue les scripts de la base (`diff-revue.sh`, `chemins-sensibles.mjs`, `contexte-ticket.mjs`, `sujet.sh a-juger` pour une PR vers un sujet, la régénération des index), choisit ses axes selon ce que le diff contient (Règles, Ticket, Documentation, Tickets, Règles métier), lance un sous-agent en contexte vierge par axe, trie chaque constat dans le code, puis écrit sur la PR un verdict de la forme que `verdict.mjs` lit (7.23.0). Il n'y a que deux gravités, bloquant et doute : ce que les deux skills de revue rangent « à corriger » est ici un bloquant. Un bloquant confirmé donne `refusé` même quand un axe n'a pas pu être joué ; `incomplet` veut zéro bloquant. L'échec d'un outil de la session (une installation, un réseau, un sous-agent) n'est jamais un écart de la PR : il s'écrit « non exécuté ». Toute commande dont la sortie sert à décider se lit par son code de sortie : une liste vide après un échec n'est jamais « rien à relire », et ce que la session ne peut ni lire ni jouer donne `incomplet`, avec sa cause et qui la lève. Le diff relu est vérifié contre la liste des fichiers changés : n'en sortent ni ce que la PR déclare elle-même index généré, ni un fichier texte qu'un `.gitattributes` dit binaire, ni du code rangé sous `__snapshots__/` ; le lockfile, les fichiers `.snap` et les binaires que les axes ne lisent pas sont toujours nommés au verdict. L'empreinte de ce que les axes recevront est prise avant que la session n'exécute ce que la PR déclare, et reprise après. `/security-review` ne compte pour lancée que si la session a vérifié par une commande, avant de la lancer, que le diff que la commande intégrée lit est celui de la PR. Deux axes sont neufs : Tickets (K1 à K6), pour une PR de tickets, de spec ou de carte, et Règles métier (M1 à M4), pour une règle, sa criticité ou le glossaire. La session ne colle aucun bloc de shell : chaque geste est une sous-commande d'un script du skill, `scripts/gestes.sh`, lancé depuis le dossier du skill et jamais posé dans un projet, qui s'arrête au premier échec et écrit sa cause (l'outil Bash d'une session ignore `set -e` dans un bloc collé). L'arbre à part et le clone de `/security-review` s'extraient sans les fichiers qu'une session charge comme consignes (`CLAUDE.md`, `CLAUDE.local.md`, `.claude/`, sauf `/.claude/chaine.json`) ; les axes lisent les fiches de règles sur la base, et un `CLAUDE.md` apparu pendant `C1` donne `incomplet`. Au-delà de 2 000 lignes, le script découpe les lots et vérifie leur union. Le skill ne se charge que par sa commande (`disable-model-invocation`). `CONTEXT.md` reçoit le vocabulaire de la relecture indépendante.

**Rien ne l'appelle encore** : le Relecteur et la bascule vers le régime 8 ne sont pas livrés. `revue-de-ticket` et `revue-adversariale` ne changent pas, et restent la revue de toute PR.

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; rien d'autre aujourd'hui. Une session de relecture demande `git` 2.40 ou plus et `jq`. Une session de relecture demande aussi `node`. Les scripts que le skill joue sont déjà dans `scripts/chaine/` d'un projet qui a posé `revue-adversariale`, `revue-de-ticket`, `fusionner` (7.23.0 ou plus, pour `verdict.mjs`) et `sujet` (7.28.0 ou plus, pour `a-juger`) : `/maj-skills:relecture poser` le vérifie et ne copie rien de plus. Un projet qui a le gate `references-agent` ajoute `maj-skills:relecture` à `scripts/verify/references-agent-integrees.json` le jour où l'un de ses textes cite le skill par son nom qualifié.

## 7.35.0 — 2026-11-19

### Ce qui change

Cinq petits correctifs (ticket 62 de `gouverner-nos-boucles`), quatre pour les projets et un dans le dépôt du plugin seulement :

- **`meme-contenu.sh` nomme le clone partiel** : dans un clone fait avec `--filter` (`remote.<nom>.promisor` ou `extensions.partialclone` dans la configuration du dépôt, ses `include` et `config.worktree` compris), le calcul rend `illisible`, sortie 21, avec pour raison « dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l'appeler (git clone sans --filter) », au lieu d'une lecture d'objet en échec qui ne disait pas la cause. `double-relecture.mjs` lit la marque de même, `include` et `config.worktree` compris.
- **`meme-contenu.sh` et `double-relecture.mjs` demandent à git s'il admet le dépôt** (décision `A-159`), au lieu de refaire sa décision : avant toute lecture, chacun joue `git rev-parse --absolute-git-dir` dans le dossier courant, avec l'environnement de la session tel quel (sa configuration et ses variables `GIT_CONFIG_*`). Refusé par git (dépôt d'un autre propriétaire, dépôt nu sous `safe.bareRepository = explicit`, valeur de configuration que git ne lit pas, lieu de configuration relatif…) : `illisible`, sortie 21, « pas dans un dépôt git que git admet : <la ligne `fatal:` de git> ». Admis, le dépôt réel se lit toujours sans configuration d'utilisateur ni de poste, et reçoit seulement `safe.directory` pour le dossier git et l'arbre de travail que git vient d'admettre. Les deux bornes de la recherche, `GIT_CEILING_DIRECTORIES` et `GIT_DISCOVERY_ACROSS_FILESYSTEM`, sont gardées, pour la question comme pour les lectures. Deux cas restent plus stricts que git, et la raison le dit : `GIT_DIR`, `GIT_WORK_TREE` ou `GIT_COMMON_DIR` posée (le calcul les écarte et juge le dépôt du dossier courant ; la raison les nomme) ; un dépôt sous `core.worktree` d'un autre propriétaire (« plus strict que git : … », avec la cause de git). Hors ces deux cas, les deux calculs lisent ainsi exactement ce que git admet : avant, ils refaisaient sa lecture de configuration et lisaient, dans 14 cas trouvés par la contre-relecture, un dépôt que git refuse ; ils refusaient aussi un dépôt déclaré sûr par `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS`, ce qui touchait les sessions cloud, où `GIT_CONFIG_COUNT` est toujours posée.
- **Le gabarit de règle montre `criticality` en bloc**, une clé par ligne (`level`, `by`, `reason` entre guillemets) : Prettier la laisse telle quelle à ses réglages par défaut, la réindente sans la replier sous un autre retrait, et le lecteur d'en-têtes de la double relecture la lit dans les deux cas ; la forme en ligne `{ level, by, reason }` n'est plus montrée.
- **Les noms de tests s'écrivent en français**, comme le veut l'ADR du socle sur la langue (`ADR_ALL_ARC-4`) : `.claude/rules/tests.md` demande `it('<comportement> quand <condition>')`, au présent, sans « should » ; ses exemples, la méthode du socle, la fiche Anchorpost, le gabarit de règle, les gabarits de tests (`exemple.jour-metier.spec.ts`, `exemple.property.spec.ts`) et le `CLAUDE.md` et les guides de l'API le disent de même. Aucun gate ne lisait l'ancienne forme.

Dans le dépôt du plugin seulement : `scripts/poses.test.mjs` joue les bancs posés en tranches parallèles (`scripts/tranches.mjs`), chaque test exactement une fois ; seul, il passe de 324 s à 236 s, et de 360 s à 279 s dans la suite entière, plafonds inchangés.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Reposer les scripts de la chaîne, dans une PR du projet : `/maj-skills:fusionner poser` (`meme-contenu.sh`, `double-relecture.mjs` et leurs bancs). Rien à déclarer de plus : ce que la session lit avec son propre git, les deux calculs le lisent ; un « illisible » qui cite une ligne `fatal:` de git se règle comme git le demande.
3. Reporter dans le projet, par une PR, la ligne « Le nom dit le comportement » de `.claude/rules/tests.md`, ses exemples et ceux de `docs/agents/gabarits/` ; les tests déjà écrits en anglais se renomment à leur prochaine retouche, rien ne les refuse.
4. Une règle qui porte `criticality` en ligne peut être réécrite en bloc à sa prochaine retouche (`level`, `by`, `reason` entre guillemets, une clé par ligne).

## 7.34.0 — 2026-11-19

### Ce qui change

CODEOWNERS sort du plugin (décision du produit du 2026-11-18) : GitHub ne bloque plus aucune PR sur les chemins sensibles. Le socle ne pose plus `.github/CODEOWNERS`, ni son générateur `scripts/github/codeowners.mjs`, ni le gate `check:codeowners` ; le gabarit de `.claude/chaine.json` n'a plus de clé `proprietaires` ni de gate rapide sous `scripts/github/` ; `garde-fichiers` ne refuse plus l'édition de CODEOWNERS, et normalise toujours le chemin avant de juger le lockfile, un `.env` ou une migration livrée. Le capitaine n'attend plus personne : les états « attend un propriétaire » et « attend un humain » (fusion refusée faute d'approbation) sortent de `file.sh`, `passer.sh`, `boucle.sh` et `github.sh`. **Un refus de fusion de GitHub faute de revue approuvée est désormais un refus durable comme un autre : `passer.sh` sort en 3 et la boucle s'arrête**, au lieu d'attendre l'approbation. La PR refusée garde `à-fusionner` et sa place dans la file : tant que la règle demeure, chaque lancement de la boucle s'arrête de nouveau sur elle, et les PR vers `develop` placées après elle attendent ; le capitaine ne retire pas son label, le dit à son lanceur, et un humain lève la règle (skill `fusionner`, « Devant un refus durable de fusion »). L'état `humain` du plafond des renvois ne change pas. Le socle pose trois ADR ; le gabarit de l'ADR « CODEOWNERS » reste dans le plugin, marqué retiré. La liste de l'admin dit de ne pas cocher « Require review from Code Owners », tient « Required approvals » à 0 (une approbation exigée arrête désormais le capitaine), et garde « Block force pushes », « Restrict deletions » et « aucune liste de contournement ». Plus aucun texte ne donne la protection des branches de GitHub pour frontière contre une PR hostile : aucune de ses règles n'arrête ce qu'un compte de confiance fait entrer. Les chemins sensibles, la contre-revue et `/security-review` ne changent pas ; ce qui prendra la place de CODEOWNERS, l'accord du produit donné avant de toucher un fichier sensible, arrive avec la relecture indépendante.

### Ce qu'un projet fait pour en profiter

Un projet qui ne repose rien ne voit rien changer : ses scripts sont des copies, son CODEOWNERS et son gate marchent comme avant.

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Un projet qui n'a jamais reçu CODEOWNERS (pas de `scripts/github/codeowners.mjs`) : rien d'autre à faire.
3. Un projet qui l'a reçu (posé ou reposé depuis le plugin 7.13.0) suit, dans une seule PR vers `develop`, la marche à suivre `socle-chaine-de-production/references/retrait-codeowners.md`. **Aucun `poser` ne fait ce retrait.** Elle retire `.github/CODEOWNERS` seulement si sa première ligne est celle du générateur (`# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.`) : un CODEOWNERS écrit à la main reste, et se dit à qui a lancé la session. Elle retire aussi le générateur, son banc, les scripts `codeowners` et `check:codeowners`, la clé `proprietaires` et le gate rapide du contrat, repose `scripts/agent/` et les scripts du capitaine, corrige `CLAUDE.md`, la méthode et la liste de l'admin, et marque retirée l'ADR « CODEOWNERS » du projet.
4. **À l'admin, avant que la PR du retrait entre dans `develop` : décocher « Require review from Code Owners » sur `develop` et `main` si elle l'était, et tenir « Required approvals » à 0.** La boucle en marche n'attend aucune relance : au tour qui suit l'entrée de cette PR, elle prend les scripts du capitaine de `develop` (même sans le reste du retrait) et n'attend plus personne. Une revue encore exigée l'arrête alors (`ARRÊT`, sortie 3) sur la première PR de la file dont GitHub refuse la fusion, après l'avoir mise à jour avec `develop` (une CI), et de nouveau à chaque relance tant que la règle demeure : règle cochée, la première PR qui touche un chemin possédé sans qu'un propriétaire l'ait approuvée (une PR déjà approuvée passe) ; « Required approvals » à 1 ou plus, toute PR non approuvée, qu'elle touche ou non un chemin possédé.
5. **Avant que la PR du retrait entre dans `develop`, les PR qui attendaient une revue.** Relever avec l'ancien `file.sh` (le nouveau les montre `prête`) les PR « attend un propriétaire » ou « attend un humain » : la règle décochée, le capitaine reposé les fusionne sans la relecture qu'elles attendaient. Les faire relire, ou leur retirer `à-fusionner`. Le commentaire `<!-- attente-revue-capitaine -->` que l'ancien capitaine y a laissé n'est plus lu (ni attente ni renvoi) et peut être supprimé.
6. Relancer la veille de chaque capitaine une fois cette PR entrée dans `develop` (skill `fusionner` § « Mise en place ») : la boucle en marche a déjà pris les nouveaux scripts, la veille garde sa copie de `file.sh` jusqu'à sa relance.

Un projet peut reposer `scripts/agent/` et les scripts du capitaine avant de retirer le fichier : son gate `check:codeowners` reste vert tant que son contrat garde `proprietaires` et que son générateur est là.

## 7.33.0 — 2026-11-19

### Ce qui change

Le skill `fusionner` porte un calcul nouveau, `scripts/double-relecture.mjs` : il dit si une PR exige deux relectures indépendantes, parce que son ticket porte la ligne `Relecture: double` ou cite en `Règles:` une règle de criticité haute (sans cette ligne, celle de sa spec est lue), que son diff touche le fichier d'une règle haute ou un fichier que le champ `code` de cette règle nomme, ou qu'elle change le niveau d'une règle vers ou depuis « haute ». Il rend, en dernière ligne de sa sortie, « exigée », « non exigée » ou « illisible », après les causes ; une lecture en échec ne vaut jamais « non exigée ».

**Le prix, à connaître avant de l'appeler.** L'en-tête d'un fichier de règle est lu sans bibliothèque, par une liste fermée de formes de ligne : `clé: valeur`, `clé:` suivie d'un bloc, `- valeur`, `- clé: valeur`, des scalaires nus ou entre guillemets sur une ligne, un mappage `{ … }` ou une liste `[ … ]` sur une ligne, les commentaires, et les trois formes que Prettier 3 donne à un mappage ou à une liste trop longs, à ses retraits exacts : le flux entier seul sur la ligne qui suit sa clé, au retrait de la clé plus deux (la forme qu'on rencontre d'abord au réglage du socle, `printWidth: 100`, dès qu'une liste `code:` de trois chemins dépasse la ligne) ; l'ouvrant seul sur cette ligne, puis une entrée par ligne avec sa virgule, puis le fermant seul ; l'ouvrant en fin de la ligne de la clé, puis de même. Tout le reste est hors liste : scalaire en bloc (`|`, `>`), texte ou chaîne pliés sur plusieurs lignes, étiquette, ancre, alias, clé entre guillemets, clé explicite (`? `), `clé:valeur` sans espace, tabulation, espace insécable, marque d'ordre des octets. **Un seul fichier de règle dont l'en-tête porte une ligne hors liste fait répondre « exigée » à toute PR du dépôt, tant qu'il n'est pas récrit** : le calcul ne prouve pas ce qu'il ne lit pas. Un en-tête dont les lignes sont dans la liste mais que le calcul refuse au sens fait la même cause : un niveau hors de `low`, `medium`, `high`, une `criticality` sans `level`, un `code` qui n'est pas une liste de chemins (`code:` sans valeur compris), un chemin nu que YAML lit comme un nombre, un fichier sans en-tête. La sortie dit où : une cause `<règle>`, `en-tête illisible`, le fichier, la réf, et une ligne `# illisible : <réf>:<fichier> : ligne <n> : <raison>`. Restent hors liste, sous Prettier : une chaîne pliée sur deux lignes (`proseWrap: always`, qui plie aussi la raison de la forme en bloc), un texte nu à virgule dans un mappage en ligne (à mettre entre guillemets) ; et, sous `trailingComma: none` (aucune virgule après la dernière entrée) ou une largeur de retrait autre que 2 (`tabWidth: 4`), toute forme où le flux est plié sur plusieurs lignes. Le réglage du socle (`printWidth: 100`, `trailingComma: all`, retrait de 2) n'en écrit aucune de celles-là. Le gabarit `regle.md`, tant que ses jokers `{{…}}` ne sont pas remplis, est hors liste aussi. De même, un ticket que la PR nomme (titre ou branche) et qu'aucun arbre ne porte fait répondre « exigée », cause `ticket introuvable` ; un ticket archivé dans tous les arbres l'est aussi. Un index Anchorpost illisible rend tout l'arbre illisible avant que les en-têtes soient lus : « illisible », sortie 21, même à côté d'un en-tête hors liste.

Dans un dépôt superficiel, le clone par défaut d'une session cloud, il rend « illisible » et sa raison nomme la cause et le remède (`git fetch --unshallow origin`) : il n'écrit jamais dans le dépôt et ne lance aucun `fetch`, c'est à qui l'appelle d'approfondir le clone d'abord. Un dépôt partiel (cloné avec `--filter`) est « illisible » de même, cause et remède nommés. Le dépôt d'un autre propriétaire n'est lu que si une déclaration `safe.directory` l'admet : le calcul prend les déclarations que `git config --show-scope` lit hors de tout dépôt aux portées de système et d'utilisateur, et n'en retient qu'une valeur égale au chemin du dépôt, caractère pour caractère, ou `*` ; il ne voit pas une déclaration faite par `git -c`, et n'en admet aucune quand `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` est dans l'environnement. Aucun script ne l'appelle encore : c'est une brique de la relecture indépendante, qui arrive par étapes. L'étape 0 de `fusionner` (`poser`) le nomme parmi les scripts à copier.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Rien d'autre pour l'instant : aucun script de la chaîne n'appelle ce calcul, rien ne change au passage du capitaine, et il n'y a pas à le relancer.
3. À la prochaine repose de `fusionner`, son étape 0 copie `scripts/double-relecture.mjs` dans `scripts/chaine/` avec son banc : rien à faire de plus.
4. Avant qu'un script n'appelle ce calcul : écrire les en-têtes des fichiers de règle dans les formes de la liste, la forme en bloc de préférence (`criticality:` puis `level:`, `by:`, `reason:` en retrait), que Prettier ne plie pas au réglage du socle (il en plie la raison sous `proseWrap: always`).

## 7.32.0 — 2026-11-19

### Ce qui change

Le verdict d'une contre-relecture s'écrit sur la PR, et aucun ordre de fusion ne passe un verdict non conforme (ticket 21 de `capitaine-a-jour-et-teste`). Le 2026-11-19, la PR 133 est entrée dans `main` sans les corrections d'une contre-relecture non conforme dont le verdict n'était écrit que dans une carte : aucune session ne pouvait le lire depuis la PR.

- **Le verdict s'écrit sur la PR** : toute contre-relecture d'une PR, dans un dépôt sans la chaîne, laisse en première ligne d'un commentaire `contre-relecture non conforme au sommet <sha40>` (suivie des constats) ou `contre-relecture conforme au sommet <sha40>`. Elle l'écrit avant l'ordre `à-fusionner`, jamais après.
- **Aucun ordre ne passe un verdict non conforme** : la session qui livre ou ordonne ne pose ni le commentaire ni le label si un verdict `non conforme` porte sur le sommet, ou si la PR porte un verdict et qu'aucun verdict `conforme` ne porte sur ce sommet. Le capitaine sans la chaîne (`architecte/references/lancement.md`) renvoie la PR dans ces cas, renvoi compté dans le plafond de trois, et s'arrête sur un verdict édité ou sur une première ligne qui commence par `contre-relecture non conforme` sans la forme exacte d'un verdict. Une PR sans aucun verdict suit la suite de la procédure.

### Ce qu'un projet fait pour en profiter

- Un capitaine ou une session déjà lancés gardent l'ancienne procédure jusqu'à leur relance.
- Une PR déjà ordonnée sans aucun commentaire de verdict n'est pas renvoyée pour cela ; l'architecte qui a contre-relu une PR encore ouverte y écrit son verdict.
- Iroki et Fedora, dépôts à la chaîne, n'ont rien à faire : leur capitaine (`fusionner`, `revue-exigee.mjs`) ne lit pas ces commentaires, et un verdict écrit sur leurs PR n'y est qu'une information.

## 7.31.2 — 2026-11-19

### Ce qui change

Correctifs du verrou du passage de 7.31.0 (contre-relecture du ticket 4 de `capitaine-a-jour-et-teste`) :

- **Une lecture refusée du verrou est une panne** : des commentaires illisibles à sa relecture (502, réponse vide ou d'erreur) font sortir `passer.sh` et `sujet.sh fusionner` ou `relancer` en 5 (`PAUSE`, `REPRISE`), jamais en 3 ou 11 ; seul un commentaire qui ne se pose pas (écriture refusée) garde 3 (`ARRÊT`) et 11 (`ÉCHEC DU CAPITAINE`).
- **La trappe est posée avant le verrou** : un TERM (`boucle.sh --arreter`) ou un INT pendant la pose ou la relecture termine le commentaire, au lieu de le laisser vivant jusqu'à son expiration. Un signal qui tombe pendant la pose elle-même (réponse de GitHub en vol, `gh` tué avec le groupe) laisse un commentaire posé dont l'id n'est pas lu : la trappe relit alors les commentaires de la PR et termine les marques vivantes du capitaine ; une relecture en panne se dit en une ligne (le verrou expire 90 minutes après sa dernière date comptée). Cette trappe ne sort jamais en échec sous `set -euo pipefail` : une relecture lue dont une date est illisible se dit aussi en une ligne, et le code de sortie reste celui du passage (3, 5, 143…).
- **L'âge du verrou se lit dans la marque** : `<!-- capitaine:passage <id> <epoch> -->`, epoch réécrit à chaque rafraîchissement ; `updated_at` ne sert plus. Une marque de 7.31.0, sans epoch, vit 90 minutes depuis sa création. La date d'une marque est le plus tard de son epoch et de sa création : un epoch en retard (horloge en retard, `0`) ne la rajeunit pas, et un verrou vit au moins 90 minutes depuis sa pose. Un epoch en avance de plus de 5 minutes sur le capitaine qui lit est ignoré tant qu'il le reste (la marque est alors datée par sa création), puis compte quand un lecteur plus tardif le rattrape : une marque posée par une horloge en avance peut donc revivre, jusqu'à son epoch + 90 minutes. Un verrou sans nouvelles meurt 90 minutes après la plus tardive de sa création et de son epoch compté ; jamais de gel, jamais de fusion non testée (décision A-55 de l'architecte). Un epoch illisible (lettres, plus de 12 chiffres, plus de 40 caractères, vide) laisse la marque datée par sa création, jamais ignorée.
- **L'horloge des bancs ne joue que sous le faux GitHub** : `PASSAGE_HORLOGE_BANC` n'est honorée que si `FAUX_GH` est posé et non vide ; posée sans lui, elle est ignorée (horloge de la machine) et retirée de l'environnement, avec un seul avertissement sur la sortie d'erreur, donné une fois, au chargement de `github.sh`, avant tout verdict : la dernière ligne de la sortie reste le verdict que lit la boucle, même quand la trappe de fin du verrou joue après lui.

Aucune clé, aucune sortie nouvelle pour un projet.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer chaque capitaine une fois cette PR entrée dans develop, avec `CAPITAINE_ID` comme en 7.31.0 : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1`.

## 7.31.1 — 2026-11-19

### Ce qui change

Le conducteur d'un chantier ne met plus le sujet à jour avec develop : le capitaine seul le fait, de lui-même, au début de chaque lancement de sa boucle, et à la fin quand la file est vide, dès qu'aucune sous-PR du sujet n'est ouverte. Le skill `chantier` (§ 6, point 6) disait au conducteur de lancer `sujet.sh rafraichir` entre deux vagues ; deux sessions ont ainsi fait ce geste l'une après l'autre sur un même sujet. Le conducteur constate seulement, sans rien écrire : `git fetch -q origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/<nom>:refs/remotes/origin/sujet/<nom>'`, puis `git merge-base --is-ancestor origin/develop origin/sujet/<nom>`. Le fetch porte des refspecs explicites : dans le clone `--single-branch` d'une session cloud, un fetch nu ne met pas `origin/sujet/<nom>` à jour, et le constat lirait une référence périmée. Sujet en retard : aucune vague ne part, et s'il le reste au réveil suivant le conducteur demande pourquoi à un capitaine actif ; sur `SUJET EN CONFLIT` ou `SUJET NON MIS À JOUR (sortie 3, aucun conflit)`, il lance comme avant une session fille qui ouvre la PR de mise à jour. Dans trois cas la boucle ne reporte pas develop d'elle-même (livraison du sujet ouverte, livraison intermédiaire tout juste entrée dans develop, sous-PR hors vague restée ouverte) : le conducteur demande alors au capitaine de le faire à la main, sans le faire lui-même. Un constat qui échoue (fetch en échec, sortie autre que 0 ou 1) ne vaut ni « à jour » ni « en retard » : aucune vague ne part.

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; aucun script à reposer, le capitaine ne se relance pas. Un conducteur déjà lancé garde son ancien skill jusqu'à sa relève : lui dire de ne plus lancer `sujet.sh rafraichir`.

## 7.31.0 — 2026-11-19

### Ce qui change

Plusieurs capitaines peuvent tenir la même file : la règle « un seul capitaine actif » disparaît. Au début de chaque passage, le capitaine pose sur la PR un commentaire « passage du capitaine <id> », et un autre capitaine saute la PR tant que ce passage n'est pas terminé (90 minutes au plus sans nouvelles). La boucle, la veille, `passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer` exigent `CAPITAINE_ID`, l'id de la session du capitaine (sortie 64 sans lui ; `sujet.sh relancer`, joué à la main par la session propriétaire, ne pose alors aucun verrou et le dit ; `boucle.sh --arreter` marche sans lui). Un verrou illisible arrête le passage (`passer.sh` 3, `sujet.sh` 11), jamais un passage sans lui ; `boucle.sh --arreter` laisse 15 s entre TERM et KILL pour que le passage termine son commentaire. Le texte du socle change : fragment `claude-md-fusion.md` (« Seuls les capitaines fusionnent »), gabarit de l'ADR « chaîne de production », table des rôles de `chaine-de-production.md`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`. Dans la même PR, `CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine » : remplacer « **Une seule session fusionne** : le capitaine de fusion (skill `fusionner`) » par la phrase du fragment du socle (`socle-chaine-de-production/references/fragments/claude-md-fusion.md`, l. 3). L'ADR « chaîne de production » du projet reste telle quelle : elle se révise si le projet le veut.
3. Relancer chaque capitaine une fois cette PR entrée dans develop, **avec `CAPITAINE_ID`** : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). Un capitaine relancé sans la variable s'arrête aussitôt, sortie 64 : `VEILLE ARRÊTÉE`.

**Iroki** : ses deux capitaines (un par personne) peuvent tourner ensemble une fois les scripts reposés. Son `boucle.sh` et son `passer.sh` ont divergé de ceux du plugin : reposer remplace ses versions par celles de 7.31.0. Son `CLAUDE.md` reçoit la phrase du fragment.

## 7.30.0 — 2026-11-19

### Ce qui change

`fusionner` porte un script neuf et son banc, `scripts/meme-contenu.sh` et `scripts/meme-contenu.test.mjs`. Le calcul dit si deux sommets d'une PR, celui d'un verdict de relecture et celui qu'on juge, ne sont séparés que par des fusions de la cible et des commits d'index générés : `bash scripts/chaine/meme-contenu.sh <V> <T> <B>`, sorties 0 « même », 20 « différent », 21 « illisible » (69 quand un outil manque). Seul un index à `commande`, de chemin littéral, déclaré tel sur la cible et au sommet jugé, est dispensé ; un index sans commande, déclaré par motif, déclaré plus d'une fois ou couvert aussi par un motif se juge comme tout fichier, et le fichier de la liste des index toujours. Une fusion dont le conflit porte sur autre chose qu'un tel index n'est jamais « même » : le capitaine ne résout aucun conflit de code. Il demande **git ≥ 2.41** (`--attr-source`), bash ≥ 4, `jq`, `mktemp` et `rm`, et un dossier temporaire où écrire ; il ne lit pas le réseau et n'écrit rien dans le dépôt. Rien ne l'appelle encore : il prépare la relecture indépendante.

### Ce qu'un projet fait pour en profiter

Mettre à jour le plugin ; rien d'autre aujourd'hui : aucun script de la boucle ne change, le capitaine ne se relance pas. Le script et son banc arrivent dans `scripts/chaine/` à la prochaine fois que le projet rejoue `/maj-skills:fusionner poser`.

À prévoir pour la suite : **un poste de capitaine ou de Relecteur dont le git est plus ancien que 2.41 rendra « illisible » (sortie 69) à chaque appel**. Relever `git --version` sur ces postes avant que le capitaine et le Relecteur n'appellent ce calcul. De même, **dans un dépôt superficiel** (le clone d'une session cloud, profondeur 50 par défaut), le calcul rend « illisible » et sa raison dit le remède, `git fetch --unshallow origin` : il n'approfondit rien lui-même, c'est à qui l'appelle de le faire une fois avant.

## 7.29.1 — 2026-11-19

### Ce qui change

Le capitaine d'un dépôt sans la chaîne (`architecte/references/lancement.md`, bloc « Procédure : ») renvoie une PR en retard sur la branche par défaut (`mergeable_state` `behind`) au lieu de la mettre à jour : commentaire `à-fusionner retiré par le capitaine : en retard sur <branche par défaut> : …`, label retiré, et le renvoi compte dans le plafond de trois. La garde « mise à jour signée par GitHub » (lecture du sommet par `get_commit`) disparaît : le serveur GitHub MCP d'une session cloud ne rend ni les parents ni `verification`, le capitaine ne pouvait pas la prouver et renvoyait toute PR mise à jour par GitHub (PR 111, 2026-11-18). Un sommet qui n'est pas celui de l'ordre est renvoyé, sans exception ; le capitaine n'appelle plus jamais la mise à jour de branche. Les gardes d'agent du socle ne changent pas.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Un capitaine sans la chaîne déjà lancé garde l'ancienne procédure jusqu'à sa relance : le relancer avec le prompt de `lancement.md`.
3. Une session qui reçoit le renvoi « en retard » fusionne elle-même la branche par défaut dans sa branche (commit de merge, jamais de rebase), pousse, attend la CI, puis repose le label et le commentaire au nouveau sommet.

## 7.29.0 — 2026-11-19

### Ce qui change

Clé de contrat facultative `fusionsSansEffet` (`.claude/chaine.json`) : pour chaque fichier qu'un hook du projet garde, l'expression des lignes sans effet et la mention à écrire. Quand une fusion jouée par le capitaine (mise à jour d'une PR avec develop, d'un sujet avec develop, d'une sous-PR avec son sujet) n'apporte à ce fichier que de telles lignes, son commit de fusion porte la mention, et le hook du projet le laisse passer. Un changement réel n'a pas de mention : le capitaine le dit, et le hook juge comme avant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Si un hook du projet exige une mention sur un fichier, ajouter la clé à `.claude/chaine.json`, dans la même PR (le capitaine la lit sur develop). Pour un projet Prisma dont le `commit-msg` exige une migration ou `[sans-migration: <raison>]` :

   ```json
   "fusionsSansEffet": [
     {
       "fichier": "prisma/schema.prisma",
       "lignesSansEffet": "^[[:space:]]*(//.*)?$",
       "mention": "[sans-migration: commentaire seul, apporté par une mise à jour du capitaine]"
     }
   ]
   ```

   Le chemin du schéma est celui du projet ; l'expression est celle de `grep -E` (POSIX étendue : `[[:space:]]`, jamais `\s`), et chaque ligne ajoutée ou retirée doit lui correspondre en entier.
4. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).

**Iroki** : son `.husky/commit-msg` n'exige aucune mention de migration ; rien à ajouter au contrat. Reposer `passer.sh`, `sujet.sh` et `github.sh` remplace ses versions, qui ont divergé (`github.sh` de 549 lignes) : la repose est celle de 7.16.0, cette version n'en ajoute pas.

**Fedora** (où le défaut a été vécu) : ajouter à `.claude/chaine.json` l'entrée de l'étape 3, avec le chemin de son schéma. Son hook `sans-migration` doit lire **tout** le message de commit : la mention est au deuxième paragraphe, après la ligne `Merge remote-tracking branch '…' into …` de git ; un hook qui ne lit que la première ligne ne la voit pas.

Une session qui reçoit develop dans un sujet (PR de mise à jour, après un `rafraichir` refusé) fusionne par `bash -c '. scripts/chaine/github.sh && fusionner_avec origin/develop'` au lieu de `git merge origin/develop` : sa fusion porte la même mention (skill `sujet`, « Recevoir develop dans un sujet »).

## 7.28.0 — 2026-11-19

### Ce qui change

Le socle de la chaîne pose un check `PR titre` (`.github/workflows/pr-titre.yml`, `scripts/github/pr-titre.mjs`), non exigé : à l'ouverture d'une PR vers `develop` ou un sujet, à chaque retouche de son titre ou de son corps et à chaque push, il montre ce que le capitaine refusera (sujet du squash trop long, commitlint pour une sous-PR, section de revue absente, ligne `/security-review` absente sur un chemin sensible, titre de code sur de la documentation seule). Il juge avec les fonctions du capitaine (`revue-exigee.mjs`, `sujet.sh a-juger`, `sujet.sh est-livraison`) : une PR de réception de `develop` dans un sujet se reconnaît à sa forme et se juge sur sa résolution et ses retouches ; une tête `livraison/…` n'est dispensée de revue que sur la preuve du capitaine, jamais sur son nom.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Dans une PR du projet : `/maj-skills:fusionner poser` et `/maj-skills:sujet poser` (`revue-exigee.mjs`, `github.sh`, `passer.sh`, `sujet.sh` et leurs bancs), puis, de `/maj-skills:socle-chaine-de-production`, les étapes 4 ter (`scripts/github/pr-titre.mjs` et son banc) et 6 (`.github/workflows/pr-titre.yml`). `.github/workflows/**` et `scripts/github/**` sont des chemins sensibles : contre-revue et `/security-review`. Aucune clé de contrat.
3. Ne pas ajouter `PR titre` aux checks exigés de `develop` : le capitaine reste le juge.
4. Relancer le capitaine une fois cette PR entrée dans develop (`passer.sh` et `github.sh` changent, sans changer de comportement) : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : son `scripts/ci/pr-titre.mjs` et son `.github/workflows/pr-titre.yml` (#628, et sa voie de réception, #539) sont à remplacer par ceux du socle ; sa voie `chore/<nom>-recoit-develop`, reconnue par le nom de branche, n'existe pas dans le plugin, qui reconnaît une PR de réception à sa forme (une seule fusion de `develop`, son premier commit, puis des retouches). Ses PR de réception qui n'ont pas cette forme seront refusées par le check comme par le capitaine du plugin.

## 7.27.0 — 2026-11-19

### Ce qui change

Une PR sans CI que GitHub dit en conflit se lit « prête (en conflit) » dans la file du capitaine, au lieu de « prête (sans CI) ». Une sous-PR dans cet état passe par `sujet.sh relancer`, qui lit désormais la règle d'ascendance avant toute fusion : un conflit limité aux index générés est mis à jour (index régénérés, poussé, CI relancée), tout autre conflit est renvoyé à sa session avec la liste des fichiers hors index générés (de même pour `passer.sh`), et une mise à jour que le pre-push refuse est renvoyée avec la sortie du hook.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille et son `file.sh` tournent sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).

**Iroki** : son `file.sh` signale déjà ce cas par une note au titre (« [conflit avec la base, aucun check : mise à jour par le passage] », `file.sh:18-23` et `:155`), et son `relancer` résout déjà un conflit d'index (SPEC_ALL_SOC-4.28, SPEC_ALL_SOC-4.41), avec d'autres codes (6 outillage, 8 index régénérés, 9 push refusé). Reposer remplace ses deux scripts par ceux du plugin et perd ses ajouts locaux (`file.sh` diffère de 231 lignes, `sujet.sh` de 1 820) : son conducteur reporte ce changement à la main, ou repose puis reporte ses ajouts, et rejoue ses bancs propres (`file-mobile-e2e.test.mjs`, `file-ticket-titre.test.mjs`).

## 7.26.1 — 2026-11-19

### Ce qui change

`sujet.sh` élague les refs `origin/sujet/*` d'un sujet supprimé du distant (`git fetch --prune` limité aux sujets) : `etat`, `carte`, `de`, `demarrer` et `livrer-prets` ne le lisent plus ; un fetch en échec se dit. Le refus d'une PR de mise à jour faite en plusieurs fusions donne la recette pour la refaire (fetch à refspecs explicites, qui marche dans un clone `--single-branch`), et son renvoi dit de la refaire dans une nouvelle PR, et `sujet/SKILL.md` a une section « Recevoir develop dans un sujet » (recette, corps type de la PR avec « Retouches » et « Revue de ticket »).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (`sujet.sh`, `sujet-refs.test.mjs`), puis `/maj-skills:fusionner poser` (`boucle.sh`, `renvoyer.sh`). Aucune clé de contrat.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend `sujet.sh` de develop au tour suivant ; la veille, elle, appelle `file.sh` de sa copie : nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : son `sujet.sh` a divergé (voie `recevoir` et contrôle de `chore/<nom>-recoit-develop`) ; il ne repose pas `sujet.sh` du plugin, qui effacerait cette voie. Son correctif #643 (`scripts/chaine/sujet.sh:142-147`) équivaut à l'élagage ; il ne lui manque que l'avertissement d'un fetch en échec, à reporter à la main.

## 7.26.0 — 2026-11-19

### Ce qui change

Une garde d'agent qui ne peut pas charger `regles.mjs` ou `entree.mjs` (ou qui le charge sans l'export attendu) refuse l'outil et dit comment sortir, en une ligne sans trace de Node, et toute autre erreur non rattrapée d'une garde refuse aussi, comme toute sortie autre que 0 ou 2 (jamais la sortie 1, ni le 13 d'un `await` qui ne se résout pas) : la session s'arrête et le dit à qui l'a lancée ; un humain restaure `scripts/agent/` depuis le dernier commit où les gardes se chargent (`git checkout origin/develop -- scripts/agent/` si develop est sain), jamais en contournant la garde. Les six hooks qui chargent ces modules sont couverts (`garde-commandes`, `garde-fichiers`, `garde-github`, qui refusent ; `apres-edition`, `fin-de-tour`, `demarrage`, qui disent que le hook est sauté et sortent en 0). Le gabarit `chaine-de-production.md` dit d'écrire un tel fichier d'un seul coup, par un seul geste : la copie préparée et vérifiée hors du dépôt (`node --check`, l'import qui rend chaque export de la version en place), puis `cp <copie> scripts/agent/<fichier>`. La garde refuse `git commit --amend`, sous ses abréviations (`--am`, `--ame`, `--amen`) et derrière toute option globale de git ; `git commit -m "--amend"` et `--fixup=amend:<sha>` passent ; le paragraphe « Jamais d'amend » du gabarit le dit. Le capitaine renvoie une PR qui touche un chemin sensible sans la ligne « `/security-review` : lancée » dans sa section de revue (`revue-exigee.mjs`, `motifSansSecurite` ; contrat de la base illisible : tout chemin est sensible) ; la ligne n'est lue ni dans un bloc de code, ni dans un commentaire HTML, ni recopiée du gabarit sans choisir (« | non requise » ou « / non requise » laissés, parenthèse « (chemins : …) » vide ou en `…`).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/chaine/socle-chaine-de-production/references/agent/` vers `scripts/agent/` : `garde-commandes.mjs`, `garde-fichiers.mjs`, `garde-github.mjs`, `apres-edition.mjs`, `fin-de-tour.mjs`, `demarrage.mjs`, `regles.mjs`, `regles.test.mjs`, `garde-illisible.test.mjs`, **chacun d'un seul coup**, comme le dit le gabarit : la copie hors du dépôt (scratchpad), `node --check`, l'import qui rend chaque export de la version en place, puis un seul `cp` sur `scripts/agent/<fichier>`. `scripts/agent/**` est un chemin sensible : contre-revue et `/security-review`.
3. Reposer `/maj-skills:fusionner poser` (`revue-exigee.mjs`). Toute PR du projet qui touche un chemin sensible porte désormais la ligne « `/security-review` : lancée » dans sa section de revue : le dire aux sessions en cours, et relancer le capitaine une fois la PR entrée dans develop.
4. Recopier dans `docs/agents/pieges.md` la puce « Une garde d'agent cassée refuse tout outil » (l'ancienne conseillait `disableAllHooks`), dans `docs/agents/chaine-de-production.md` le paragraphe « Un fichier que les gardes chargent s'écrit d'un seul coup » et la dernière phrase du paragraphe « Jamais d'amend » du gabarit, et la ligne « Hooks d'agent » du fragment `claude-md-fusion.md` dans `CLAUDE.md`, si le projet les a gardées telles quelles.
5. `node --test scripts/agent/*.test.mjs scripts/chaine/revue-exigee.test.mjs` : vert.

**Iroki**, hors du plugin : ses consignes « Jamais d'amend » (#634) et « s'écrit d'un seul coup » (#653, `docs/agents/chaine-de-production.md:124`, `:126`) sont couvertes par ce gabarit et par la garde ; sa garde lit encore les commandes par expressions, et la repose de `regles.mjs` suppose son passage à la lecture par jetons (ticket 17).

## 7.25.0 — 2026-11-19

### Ce qui change

`sujet.sh livrer` ouvre la PR de livraison sans `à-fusionner` : la session qui livre le pose après la relecture de la PR (contre-revue si elle touche un chemin sensible). `livrer-prets`, le geste du capitaine, étiquette toujours ses livraisons. Sans `gh` utilisable (session cloud), `livrer` écrit le titre et le corps dans un fichier, sort en 14 et donne les appels de l'outil GitHub MCP, avec la cause lue (`gh` absent, compte illisible, POST refusé) ; une livraison intermédiaire ne pousse pas sa branche jetable sans `gh`, et la retire si le POST est refusé. `sujet.sh demarrer` ne refuse plus un ticket dont le bloquant est fait dans un fichier long (SIGPIPE).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (et `/maj-skills:fusionner poser` si la version précédente n'a pas été reposée).
3. Dans la même PR, reporter dans `docs/agents/chaine-de-production.md` (§ 2, point 6) la précision du gabarit : la PR d'une livraison intermédiaire s'ouvre sans `à-fusionner`.
4. Relancer le capitaine une fois cette PR entrée dans develop (`livrer-prets` est joué par la boucle, qui prend les scripts de develop au tour suivant ; rien à recopier pour la veille).

**Iroki** : sa remontée A5 (le label posé avant la contre-revue) est corrigée ici. Son `sujet.sh` a divergé de 1 820 lignes : son `fait_sur` est déjà corrigé (`scripts/chaine/sujet.sh`, SOC-4.25), rien à reporter de ce côté ; son `livrer` porte en plus une comparaison e2e (`pas_pire_que_reference`) et les brouillons, absents du skill : reposer `sujet.sh` les ferait perdre, son conducteur reporte donc à la main le retrait du label dans `livrer`, `ETIQUETER=1` dans `livrer_prets` et la sortie 14.

## 7.24.0 — 2026-11-18

### Ce qui change

Une panne de GitHub (réponse vide, non JSON, ou corps d'erreur) n'est plus lue comme un état : le script qui lisait sort en 5, et la boucle du capitaine se met en pause (`PAUSE`) puis reprend, sans jamais s'arrêter sur 5 ; une file illisible n'est plus une file vide. Un push refusé par le pre-push (trace de husky 9 `husky - pre-push script failed`) renvoie la PR à sa session avec la sortie du hook ; un refus sans cette trace (règle du dépôt, droit, coupure) arrête la boucle (`passer.sh`) ou sort en 11 (`sujet.sh`), sans renvoi. Un commentaire d'attente d'un propriétaire impossible à poser arrête la boucle en sortie 3, de même qu'une fusion refusée durablement par GitHub (droit du compte, règle du dépôt, méthode de fusion interdite) ; une fusion refusée parce que la branche ou develop a bougé (règle d'ascendance rejouée avant d'arrêter), ou par une panne, reste en 5. La ligne `PAUSE` nomme la route et le code HTTP de la cause (un `(HTTP 401)` de jeton expiré se voit au journal). Toute sortie de git ou de hook relayée par les scripts du capitaine (journal, commentaire de PR) masque les URL à identifiants (`masquer_url`, `git_masque`).

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser` (`github.sh`, `passer.sh`, `boucle.sh`, `file.sh`, `sujet.sh`, `faux-gh.mjs` et leurs bancs). Aucune clé de contrat.
3. Vérifier que `.husky/pre-push` est lancé par husky 9 (`.husky/_/h`, posé par `pnpm install`) : sans la trace de husky, un refus du hook se lit comme un refus du distant et arrête le capitaine.
4. Relancer le capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

**Iroki**, hors du plugin : ses scripts portent leur propre correctif de A4 (#633 : `pousser` en 3 ou 4 par `DERNIERE_SORTIE`, `scripts/chaine/github.sh:127-155` ; le renvoi de `boucle.sh:540-545` ; `passer.sh:254-262` ; le banc `boucle-pre-push-refuse.test.mjs`), que la repose remplace. Son masquage des URL à identifiants (`masquer_url`, `git_masque`, `SPEC_ALL_SOC-4.52`, `github.sh:207-214`) est désormais celui du plugin : la repose le garde ; rejouer son banc « SPEC_ALL_SOC-4.52 » contre le `github.sh` du plugin avant de retirer le sien.

## 7.23.0 — 2026-11-18

### Ce qui change

Deux modules neufs à côté des scripts du capitaine, avec leurs bancs : `verdict.mjs`, le lecteur du verdict d'une relecture indépendante, et `decision-relecteur.mjs`, la décision du Relecteur, une fonction pure. Rien ne les appelle encore : ils préparent la relecture indépendante. L'étape 0 de `fusionner` (`poser`) les nomme, pour qu'un projet qui repose ne reçoive pas leurs bancs sans eux.

### Ce qu'un projet fait pour en profiter

Rien d'obligatoire : aucun script déjà posé ne change, aucun capitaine à relancer. Un projet qui rejoue `/maj-skills:fusionner poser` reçoit en plus les deux modules et leurs bancs sous `scripts/chaine/`.

## 7.22.0 — 2026-11-18

### Ce qui change

`next-id.mjs` fait un `fetch`, puis lit l'arbre de travail, `origin/develop`, tous les `origin/sujet/*` et `origin/docs/*`, et les fichiers des PR ouvertes (`scripts/docs/pr-ouvertes.mjs`, la lecture de `ticket-libre.mjs`). Il numérote aussi les tickets d'une spec : `node scripts/docs/next-id.mjs SPEC_ALL_SOC-4` rend le prochain index sur deux chiffres. Sans `gh`, le numéro sort, et la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer, dans une PR du projet : `/maj-skills:socle-monorepo` pour `scripts/docs/next-id.mjs`, `next-id-branches.mjs` et `next-id.test.mjs` (la ligne `references/scripts/docs/*` de `TABLE-RACINE.md` ; `pr-ouvertes.mjs` est arrivé avec la version du ticket 6). Aucune clé de contrat. Reposer aussi les documents que la PR change : `docs/methode/nomenclature.md` (socle-monorepo), et, de socle-chaine-de-production, `docs/agents/pieges.md` et le fragment `readme-commandes.md` (le § commandes du README).
3. Numéroter un ticket par `next-id.mjs <SPEC>`, puis le réserver aussitôt (branche et PR brouillon).

**Iroki**, hors du plugin : ses deux `SPEC_ALL_SOC-4.78` et ses deux `ADR_ALL_ARC-18` se renomment chez lui ; la repose de ces scripts suffit ensuite.

## 7.21.1 — 2026-11-18

### Ce qui change

La garde de commandes lit la sous-commande de git après ses options globales (`-C`, `-c`, `--git-dir`, `--config-env`…), valeurs opaques comprises. Elle refuse toute façon de sauter les hooks git : `--no-verify` et `-n` derrière une option globale, `git pull --no-verify`, `git am -n`, `core.hooksPath` ou un `include` posé par `-c`, `--config-env` ou `git config` (`--unset` compris), tout `alias.*` posé par `-c` ou écrit par `git config`, un renommage de section vers ou depuis `core`, `HUSKY`, `GIT_CONFIG_PARAMETERS` et `GIT_CONFIG_COUNT` affectés ou exportés. Elle refuse aussi une ref de suivi fabriquée (`git update-ref refs/remotes/…`), le push « matching » (`git push origin :`) et une destination de push portée par la configuration (`-c remote.origin.push=…`). Une expansion (`$`, substitution) n'est admise que dans une valeur, jamais dans un nom d'option, une sous-commande ou une clé de configuration ; un argument à expansion de `commit`, `am`, `merge`, `rebase` ou `pull` est refusé (« argument illisible : écris-le en clair »). Un message de commit n'est jamais lu comme des options ; un texte cité qui porte une commande git refusée l'est, comme aujourd'hui pour un push vers un sujet.

La recherche adversariale du ticket a fermé en plus : une expansion non citée dans la valeur d'une option globale, devant toute sous-commande (`git -C $dir status` est refusé, `git -C "$dir" status` passe) ; un motif ou des accolades non cités, qui valent une expansion non citée, dans le programme aussi (`/usr/bin/g[i]t commit -n`) (`git commit -m x src/*.ts` est refusé, `git commit -m x -- src/*.ts` passe) ; `"$@"` et `"${a[@]}"`, qui donnent plusieurs mots même cités ; `set -a`, `set -k` et `env "$X" …` ; un `env HUSKY=0` derrière un autre lanceur (`taskset`, `flock`) ; les options abrégées de `git config` (`--unset-a`, `--remove-sec`) ; git par ses programmes internes (`/usr/lib/git-core/git-commit`, et `git-push` vers un sujet, ouvert jusqu'ici) ; un programme à expansion (`$(echo git) commit …`, `$g push …`), lu comme git, et un tableau en programme (`G=(git commit); "${G[@]}" -n`), relu avec ses valeurs s'il est défini une seule fois simplement, refusé sinon (`G+=…`, `${G[@]:1}`, `"$@"`) ; `hash -p` ; la chaîne d'`env -S` et un `alias` défini dans la commande, relus ; le rebase ou `reset --hard` d'une branche partagée derrière les options globales ; une commande que git lance par un shell, tapée dans la commande (`git rebase -x '…'`, `-c core.pager='…'`, `git config core.editor '…'`), relue comme une commande de la session.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier `regles.mjs` et `regles.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/chaine/socle-chaine-de-production/references/agent/` vers `scripts/agent/`, **d'un seul coup** : copie à côté, `node --check`, `node -e "import('./scripts/agent/<copie>')"`, puis `mv`. Un `regles.mjs` à moitié écrit fait refuser toute commande de la session. `scripts/agent/**` est un chemin sensible : contre-revue et `/security-review`.
3. Recopier la ligne « Hooks d'agent » du fragment `claude-md-fusion.md` dans `CLAUDE.md`, si le projet l'a gardée telle quelle.
4. `node --test scripts/agent/*.test.mjs` : vert.

**Iroki** : sa garde lit encore les commandes par expressions (avant 7.12.0). Reposer `regles.mjs` du plugin remplace sa lecture et son correctif #652 : le passage à la lecture par jetons en est le préalable (spec, Hors périmètre). Rejouer ses bancs « SPEC_ALL_SOC-4.70 » contre le fichier du plugin avant de retirer les siens. Au moins dix de ses décisions changent :
  - deviennent des refus : `git config --unset core.hooksPath` (retirer la clé rend `.git/hooks`, sans husky) ; `git -c core.hooksPath=/x status` et `… log` (aucun usage légitime, quelle que soit la sous-commande) ; `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=gc.autoDetach …` (une session n'a jamais à le taper) ;
  - une expansion non citée dans la valeur d'une option globale est refusée devant toute sous-commande : `git -C $(pwd) status`, `git -C $(pwd) fetch origin develop`, `git -C $(git rev-parse --show-toplevel) status` et `… log`, `git -C ${x:-a b} status`, `… diff --stat` et `… commit -m x`, `git -C $(pwd) commit -m x`, qu'il laisse passer, sont refusés (la forme citée, `git -C "$(pwd)" …`, passe) ;
  - passent : `git -C <(echo a b) commit -m x` et `… push origin feat/a`, qu'il refuse comme illisibles (une substitution de processus rend un seul chemin, et ne saute rien) ; `GIT_CONFIG_KEY_0=core.hooks"Path" git commit -m x` et `GIT_CONFIG_KEY_0='core.hooksPath' git commit -m x`, qu'il refuse (sans `GIT_CONFIG_COUNT`, git ne lit pas la clé) ;
  - ses bancs « SPEC_ALL_SOC-4.70 » sont repris dans `regles.test.mjs` sous les titres « banc repris : … », chaque divergence nommée en commentaire.

## 7.21.0 — 2026-11-18

### Ce qui change

Un seul environnement de banc, `scripts/docs/environnement-de-banc.mjs` (socle-monorepo), réexporté par `scripts/chaine/depot-jouet.mjs` : sans `GIT_*`, `FORCE_COLOR`, `NODE_TEST_CONTEXT` ni variables du capitaine, avec `NO_COLOR=1`. Les bancs des skills l'importent : ils ne prennent plus la couleur de `node --test` sous un terminal.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, **d'abord** recopier `environnement-de-banc.mjs` et `environnement-de-banc.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/scripts/docs/` vers `scripts/docs/`, avec `next-id.test.mjs` du même dossier : sans eux, les bancs reposés ensuite ne se chargent pas.
3. Puis reposer : `/maj-skills:tickets poser` (son `depot-jouet.mjs` et `avancement.test.mjs`), `/maj-skills:revue-adversariale poser`, `/maj-skills:fusionner poser`, `/maj-skills:sujet poser`. Et recopier `coverage-diff.test.mjs` de socle-tests (`references/scripts/verify/`) vers `scripts/verify/` s'il est posé.
4. `node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs scripts/chaine/*.test.mjs` : vert.

**Iroki** : son `environnementGitIsole` (`scripts/chaine/git-isole.mjs`, #616) reste à lui, avec ses importeurs. Les bancs reposés depuis le plugin prennent `environnement-de-banc.mjs` ; les deux coexistent. Différence à connaître : le sien garde `GIT_AUTHOR_*` et `GIT_COMMITTER_*`, celui du plugin les retire. Retirer `git-isole.mjs` au profit du module du plugin est un choix de son conducteur, hors de cette version.

## 7.20.0 — 2026-11-18

### Ce qui change

La veille du capitaine dure 75 minutes, et aucun passage ne commence à moins de 40 minutes de la limite de 2 h d'une tâche de fond (`--marge`) : la boucle s'arrête sur `ÉCHÉANCE` au lieu d'être tuée au milieu d'une mise à jour. Une clé facultative de `.claude/chaine.json`, `preparerCapitaine`, lue sur `origin/develop` seulement, nomme une commande que la veille joue, worktree détaché sur `origin/develop`, avant de lancer la boucle sur une machine neuve et après chaque redémarrage (lu dans `/proc/sys/kernel/random/boot_id`) ; tant qu'elle n'a pas réussi, rien n'est fusionné, et son échec arrête la veille en sortie 13.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser` (`veille.sh`, `boucle.sh` et leurs bancs).
3. Si la machine du capitaine perd un environnement à son recyclage (base locale), ajouter à `.claude/chaine.json` la clé `"preparerCapitaine": "<commande>"`, dans la même PR ou une autre (`.claude/**` est un chemin sensible : contre-revue). Un projet du socle Nest peut y mettre `bash scripts/db/demarrer-local.sh`.
4. Relancer le capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée, sans `--duree 110` si le lancement le portait.

**Iroki**, hors du plugin : sa commande de préparation (base en UTF8, migrée depuis `develop` seul, refus d'une migration absente de `develop`) s'écrit chez lui, puis se déclare dans `preparerCapitaine`.

## 7.19.1 — 2026-11-18

### Ce qui change

`coverage-diff` (socle-tests) : sans `DATABASE_URL`, un fichier en échec qu'une suite `*.db.spec.ts` cible passe en avertissement, et la CI, qui a Postgres, le juge ; sous GitHub Actions, rien ne change. À la réception de develop dans un sujet, quand la forme n'est pas celle d'une PR de mise à jour (fusion recalculée), le diff se lit contre `origin/develop` dès que HEAD le contient et que la base ne le contient pas : le code que develop apporte n'est plus remesuré.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/scripts/verify/` vers `scripts/verify/` : `coverage-diff.mjs`, `coverage-diff-regles.mjs`, `coverage-diff.test.mjs` et `coverage-diff-regles.test.mjs`. Aucune commande `poser` : socle-tests se met à jour pièce par pièce (`SKILL.md:16`).
3. Vérifier que l'étape de couverture de la CI porte `DATABASE_URL` (`SKILL.md:32`) : c'est elle qui juge ce que le pre-push signale.

**Iroki** : ses deux correctifs (#633 et #649) sont déjà chez lui, sous une autre forme, sans `fusionRecalculee`. Recopier les fichiers du plugin remplace son `referenceDuDiff` et son `suiteSurBaseCible`, et y ajoute la fusion recalculée. À faire en une PR qui garde ses deux bancs (`coverage-diff-sans-base.test.mjs`, `coverage-diff-reception-develop.test.mjs`) et les rejoue contre les fichiers du plugin ; un message qui diffère se nomme dans la PR.

## 7.19.0 — 2026-11-18

### Ce qui change

`ticket-libre.mjs` lit les fichiers des PR ouvertes : une PR qui ajoute ou modifie le fichier du ticket le prend, même si ni son titre ni sa branche ne portent l'identifiant. La branche distante d'une PR fermée ne prend plus le ticket (sauf si elle a reçu des commits depuis la fermeture). Sans `gh`, le repli fait lire les fichiers des PR ouvertes par l'outil GitHub MCP. La lecture des PR ouvertes est un module du socle, `scripts/docs/pr-ouvertes.mjs`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Dans une PR du projet, **d'abord** recopier `pr-ouvertes.mjs` et `pr-ouvertes.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/scripts/docs/` vers `scripts/docs/` : sans eux, le `ticket-libre.mjs` reposé ne se charge pas.
3. Puis reposer : `/maj-skills:tickets poser` (son `ticket-libre.mjs` et son test, `depot-jouet.mjs`).
4. `node --test scripts/docs/*.test.mjs` : vert.

**Iroki** : son `ticket-libre.mjs` est d'une version plus ancienne, qui lit encore les formes courtes (`ABC-1.03`) et importe de son `identifiants.mjs` `normaliser`, `formeCourte` et `slug`, sans `branchePorte`, `texteCite` ni `fichierDuTicket`. Le reposer tel quel demande aussi l'`identifiants.mjs` du socle, qui ne lit plus les formes courtes. Sinon, son conducteur réécrit le correctif dans sa version : `pr-ouvertes.mjs` recopié, puis la lecture des fichiers et des branches de PR fermées.

## 7.18.2 — 2026-11-18

### Ce qui change

L'architecte et le conducteur relèvent l'état de leurs sessions au plus toutes les 60 minutes (échec, déconnexion, limite d'usage, silence d'une heure) et signalent une session coupée. Toute session lancée charge `send_message` en premier geste, et s'arrête en le disant s'il manque. Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce. Chaque prompt porte, juste après les intangibles, la ligne « Commits : jamais `git commit --amend` ». Une alerte d'usage d'une session se dit au produit une fois par période de limite.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »). Les skills `architecte` et `chantier` et les prompts de lancement viennent avec le plugin : rien à reposer pour eux.
2. Dans une PR du projet, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) les trois changements du gabarit, § 5 : la ligne « Outils : » du prompt d'une fille, la ligne « Commits : » juste après « Intangibles » (qui ne change pas), et le paragraphe « Jamais d'amend » après l'étape 4.
3. Un conducteur ou un architecte en cours reprend ces règles à sa prochaine session ; aucun capitaine à relancer.

**Iroki** : son `docs/agents/chaine-de-production.md` porte déjà le paragraphe « Jamais d'amend » (l. 124, #634) ; il reçoit la ligne « Outils : » et la ligne « Commits : ».

## 7.18.1 — 2026-11-18

### Ce qui change

Le gabarit `scripts/db/demarrer-local.sh` du socle Nest crée sa base en UTF8 (`initdb --encoding=UTF8` avec une locale UTF-8, `createdb -E UTF8 -T template0`) : sur une machine en locale C/POSIX, PostgreSQL choisissait `SQL_ASCII`, et `normalize(…)` échouait au pre-push. Une base ou un serveur existant qui n'est pas en UTF8 est refusé (sortie 6), avec les commandes pour le recréer ; rien n'est supprimé par le script.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier `~/.claude/plugins/marketplaces/maj/skills/backend/socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh` sur `scripts/db/demarrer-local.sh`, tel quel (il n'a aucun marqueur à substituer). Aucune commande `poser` : le socle Nest se pose une fois.
3. Lancer `bash scripts/db/demarrer-local.sh`. S'il sort en 6, suivre les commandes qu'il imprime, puis rejouer les migrations. Le script de l'environnement cloud l'appelle avec `|| true` (`admin.md`) : un refus y passe inaperçu, il se voit au premier appel de la session.

**Iroki** : rien à reposer. Son script (`SPEC_ALL_SOC-4.34`, #486 et #495) fait déjà tout cela, avec `COMPOSE_FICHIER` et son banc en plus ; le gabarit ne doit pas l'écraser.

## 7.18.0 — 2026-11-18

### Ce qui change

Le socle mobile pose `apps/mobile/docs/MOBILE_CI.md`, la méthode des parcours sur appareil en CI : émulateur à 4 cœurs et 4 Go, démarrage à froid avec une relance unique et comptée, `hide_error_dialogs`, incidents de l'app lus dans `events` (un ANR ou un crash de l'app rend le run rouge), un timeout propre à l'étape Maestro, un diagnostic par parcours en échec, et le filtre `paths` qui juge le diff de toute la PR. Le ticket gabarit des parcours sur appareil y renvoie.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Si le socle mobile est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/mobile/socle-mobile-expo/references/mobile/docs/MOBILE_CI.md` dans `apps/mobile/docs/`, dans une PR du projet. Aucune commande `poser`.
2 bis. Un projet déjà posé ajoute la ligne `MOBILE_CI.md` à la carte de son `CLAUDE.md` et de son `README.md`, et le renvoi en tête de `apps/mobile/CLAUDE.md`.
3. Si le ticket des parcours sur appareil du projet n'est pas fait, lui ajouter le renvoi du gabarit. S'il est fait, relire le workflow des parcours point par point contre la référence, et ouvrir un ticket par écart.

**Iroki** : rien à reposer, la référence vient de ses correctifs (#637, #658 et `ADR_ALL_ARC-19`). Il peut la recopier pour ses nouvelles sessions ; ses réglages et ses points ouverts restent chez lui.

## 7.17.0 — 2026-11-18

### Ce qui change

La fiche `.claude/rules/tests.md` du socle gagne « Le jour et l'heure » : le jour se lit dans le fuseau du métier, par l'horloge injectée ; un test crée ses données au lieu de lire celles du seed partagé ; un banc tourne avec une horloge posée. socle-tests pose le gabarit `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier la section « Le jour et l'heure » de `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md` dans `.claude/rules/tests.md`, avec la retouche de la ligne « Déterministe ». La fiche du projet a pu diverger : recopier la section, pas le fichier. `.claude/**` est un chemin sensible : contre-revue.
3. Si socle-tests est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` dans `docs/agents/gabarits/`.
4. Écrire le fuseau du métier comme une constante du domaine, s'il ne l'est pas déjà.

**Iroki** : sa fiche porte la même ligne d'une phrase. Il recopie la section, avec son propre fuseau du métier ; ses correctifs (#622, #638) appliquent déjà les trois points.

## 7.16.0 — 2026-11-18

### Ce qui change

- **La règle d'ascendance.** Juste avant chaque fusion, vers `develop` (`passer.sh`) comme vers un sujet (`sujet.sh fusionner`), le capitaine relit la branche cible et vérifie que la PR a été testée sur son dernier état (`ascendance`, dans `github.sh`). Il ne s'en remet plus au réglage « strict » de GitHub, qui a laissé entrer des PR en retard (`fedora`, 2026-11-18).
- **Toute PR en retard est mise à jour et retestée avant sa fusion, documentation comprise.** Vers un sujet, une sous-PR en retard n'est plus squashée telle quelle : le capitaine y fusionne le sujet, pousse, attend la CI du nouveau sommet, contrôle de nouveau, puis la squashe. Vers `develop`, une cible qui a bougé pendant la CI fait reprendre la mise à jour, deux fois au plus, puis sortie 5. Un conflit hors des index générés est renvoyé, comme avant.
- **Sortie 12 et arrêt du capitaine.** Après chaque fusion, l'arbre du squash est comparé à l'arbre testé. Un écart : commentaire sur la PR (marque `<!-- arbre-different-capitaine -->`), `à-fusionner` retiré, la boucle et la veille s'arrêtent en 12, le capitaine le dit à son lanceur.
- **Une sous-PR étiquetée à la fois par sujet.** Le conducteur ne laisse `à-fusionner` qu'à la plus ancienne des sous-PR étiquetées d'un même sujet, et le repose sur la suivante quand la précédente est entrée (skill `chantier` § 6).
- La sortie 8 de `sujet.sh fusionner` change de sens : mise à jour poussée, CI pas finie, reprise au tour suivant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille, elle, tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).
