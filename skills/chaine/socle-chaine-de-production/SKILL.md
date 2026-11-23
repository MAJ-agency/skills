---
name: socle-chaine-de-production
description: Pose dans un monorepo tout ce que supposent les skills d'exploitation de la chaîne de production (tickets, sujet, fusionner, revue-adversariale, chantier, recette-humaine) — develop qui intègre et main qui livre, les neuf labels, les hooks d'agent, le contrat .claude/chaine.json et sa relecture indépendante, la liste des index générés, une CI minimale, la méthode docs/agents/chaine-de-production.md et quatre ADR — puis dit ce qu'un admin fait à la main. Use when setting up parallel agent sessions, a merge captain, adversarial review or subject branches on a repository, or when a chain skill says the socle is missing.
---

# Socle de la chaîne de production

Pose, une fois, ce que les skills d'exploitation lisent ensuite sans le remettre en question. **Il n'écrit rien de métier**, et il n'exploite rien : fusionner, relire, cadrer sont les skills `fusionner`, `revue-adversariale`, `chantier`.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders `{{PROJET}}`, `{{PROJET_SNAKE}}`, `{{SCOPE}}`, `{{DATE}}`, `{{DEPUIS}}`, `{{ADR_CHAINE}}`, `{{ADR_SUJET}}`, `{{ADR_RELECTURE}}`. Ce que chaque pièce fait et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Avant de commencer — vérifier le terrain

1. **La racine est-elle posée ?** `pnpm-workspace.yaml` absent → invoquer `/maj-skills:socle-monorepo` d'abord.
2. **Le dépôt a-t-il un remote GitHub ?** `git remote get-url origin`. Sans lui, les labels, la CI et la protection des branches n'ont pas de sens : s'arrêter et le dire.
3. Si `.claude/chaine.json` existe, le socle est posé : **s'arrêter et demander** ; une mise à jour se fait pièce par pièce. Un projet posé depuis le plugin 7.13.0 peut porter un `.github/CODEOWNERS` généré, que le produit a retiré : [`references/retrait-codeowners.md`](references/retrait-codeowners.md).
4. Les skills `tickets` et ce socle vont ensemble : `scripts/verify/tickets.mjs` absent → l'étape 2 l'invoque (il exige `scripts/docs/identifiants.mjs`, posé avec la racine).

## Étape 1 — les questions

En un seul tour, chacune avec sa recommandation :

1. **Chemins sensibles** — les dossiers du code où un diff passe en plus `/security-review` : authentification, droits, chiffrement, paiement, export de données. _(Recommandé : `apps/api/src/infrastructure/**/auth/`, et ce que le projet a déjà nommé.)_ Les gardes de la chaîne (`scripts/agent/**`, `scripts/chaine/**`, `scripts/github/**`, `.husky/**`, `.github/workflows/**`, `.github/actions/**`, `scripts/docs/identifiants.mjs`, `.claude/**`) y sont déjà : un diff qui touche un hook, un script de la chaîne ou la CI est relu en régime sensible (effort extra, `/security-review`), et ne s'écrit qu'avec l'accord du produit (ligne `Sensibles:` du ticket).
2. **Filles par vague** — combien de sessions filles en parallèle par défaut. _(Recommandé : 6.)_
3. **Dossier des migrations** — ce que le hook de fichiers protège. _(Recommandé : `apps/api/src/db/migrations/` pour le socle API ; `apps/api/prisma/migrations/` pour un projet Prisma.)_

Rien d'autre : les branches sont `develop` et `main`, les labels ont leurs noms, le fichier de critères s'écrit à l'installation de `revue-adversariale`.

## Étape 2 — poser

1. **Le skill `tickets`** : invoquer `/maj-skills:tickets poser`. Il pose les scripts de `scripts/docs/` et `scripts/verify/`, le tracker et les gabarits.
   Puis `/maj-skills:revue-adversariale poser` (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs` avec leurs bancs, le fichier de critères), l'étape 0 du skill `fusionner` et `/maj-skills:sujet poser` (les scripts du capitaine et du sujet dans `scripts/chaine/`, avec leurs tests), puis l'« Étape 0 — poser » du skill `relecture`, lue et suivie de même dans son fichier, `~/.claude/plugins/marketplaces/maj/skills/chaine/relecture/SKILL.md` (elle vérifie que `fusionner` et `sujet` ont posé ce que la relecture appelle : `scripts/chaine/verdict.mjs`, `sujet.sh a-juger`). `fusionner` ne s'invoque pas d'ici : il porte `disable-model-invocation: true`, réservé à la session du capitaine ; son « Étape 0 — poser » se **lit** dans son fichier, `~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md`, et se suit ; les chemins relatifs s'y lisent depuis le dossier de ce fichier. Le script `check:tickets` joue aussi `node --test scripts/chaine/*.test.mjs`.
2. **Le contrat** : `references/chaine.json` → `.claude/chaine.json`, rempli des réponses de l'étape 1. `{{DEPUIS}}` vaut l'instant de la pose, en UTC : `date -u +%Y-%m-%dT%H:%M:%SZ`. La clé `relecture` allume la relecture indépendante (régime 8) : toute PR ouverte ensuite est relue par une session de relecture que lance le **Relecteur** du dépôt (skill `relecteur`, lancé par l'architecte ou le conducteur : `architecte/references/lancement.md`, « Le Relecteur d'un dépôt ») ; sans Relecteur, aucune PR n'est relue, donc aucune n'entre. Un dépôt déjà posé reçoit la clé par sa repose (skill `architecte`, « La repose d'un dépôt au régime 8 »), jamais par cette étape.
3. **Les index générés** : `references/index-generes.json` → `scripts/docs/index-generes.json`, s'il n'existe pas. Y ajouter les index que le projet connaît déjà (OpenAPI de l'API, index de graphify s'il est versionné). Puis générer chaque index de la liste par sa `commande` : `node scripts/docs/couts.mjs` écrit le registre des coûts, `docs/agents/couts.md`, que `chaine-de-production.md` cite (sans lui, `check:contexte` est rouge).
4. **Les hooks d'agent** : `references/agent/*` → `scripts/agent/`. Fusionner `references/settings-hooks.json` dans la clé `hooks` de `.claude/settings.json` : les trois entrées `PreToolUse` (fichiers, `Bash`, outils GitHub d'écriture : `garde-github.mjs`), chacune avec un `"timeout"` (30, 60 et 40 s) et `"onFailure": "block"` (Claude Code 2.1.295 ou plus récent), **s'ajoutent** à celles de graphify ; la mise à jour des gardes, du gate `settings-json` et de `.claude/settings.json` va dans une même PR, et si l'environnement refuse à la session l'édition de `.claude/settings.json`, elle l'écrit à qui l'a lancée, avec le fragment, et s'arrête : un humain le colle ; `PostToolUse` lance `apres-edition.mjs` (Prettier puis ESLint sur le fichier édité, l'erreur revient à l'agent tout de suite) ; `Stop` lance `fin-de-tour.mjs` (les `gatesRapides` de `.claude/chaine.json` qui existent, une fois, avant de rendre la main) ; `SessionStart` lance `demarrage.mjs` (fetch de develop, `origin/HEAD`, `pnpm install` si le lockfile a changé ; les étapes Postgres et base de test sont écrites, à activer dans `ETAPES_ACTIVES` quand le projet a sa base ; il signale aussi, sans rien lancer, deux manques : graphify demandé par `CLAUDE.md` et sans sa commande ou son `graphify-out/graph.json`, et les skills de la chaîne absents de la session, avec le remède de `chaine-de-production.md` § 5, étape 5). Tester : `node --test scripts/agent/*.test.mjs` (`garde-commandes.test.mjs` lit `scripts/docs/identifiants.mjs`, posé avec la racine, et `depot-jouet.mjs`, posé par `tickets` à l'étape 2.1), puis une commande refusée à la main : `echo '{"tool_input":{"command":"git push --force origin x"}}' | node scripts/agent/garde-commandes.mjs` sort en 2, et `echo '{"tool_name":"mcp__github__push_files","tool_input":{"branch":"sujet/x"}}' | node scripts/agent/garde-github.mjs` aussi.
   4 bis. **Le gate `settings-json`** : `references/scripts/verify/settings-json*` → `scripts/verify/` ; script `check:settings` (`node scripts/verify/settings-json.mjs`) dans `package.json`, étape `check:settings` dans `scripts/check.mjs` après `check:contexte`. Il refuse un `.claude/settings.json` invalide, un `allow` hors de `permissions`, une entrée qui autorise ce que les hooks refusent, une entrée qui pré-approuve `create_session` quand `.claude/chaine.json` porte la clé `relecture` (l'outil refuserait alors l'effort des sessions de relecture ; une session en mode « Auto » l'appelle sans pré-approbation), un hook exigé absent ou qui cite un script inexistant, une garde de `PreToolUse` (fichiers, `Bash`, outils GitHub d'écriture) qui n'est pas lancée par la commande exacte du fragment dans un hook `command`, sans `"onFailure": "block"`, sans `"timeout"` numérique d'au plus 60 s ou en arrière-plan (`async`, `asyncRewake`), et `"disableAllHooks": true`. Il lit, ne corrige pas : une session ne touche pas à ses droits.
   4 ter. **Le check `PR titre`** : `references/scripts/github/pr-titre*` → `scripts/github/` (il appelle `scripts/chaine/revue-exigee.mjs` et `sujet.sh`, posés à l'étape 2.1).
5. **Les labels** : `references/labels.sh` → `scripts/github/labels.sh`. Avec `gh` authentifié, le jouer ; sinon `--liste`, et la ligne va dans `chaine-admin.md`.
6. **La CI** : `references/ci/ci.yml` → `.github/workflows/ci.yml`, placeholders substitués. S'il existe déjà un workflow, y ajouter les trois jobs plutôt que le remplacer. Le job `zizmor` audite les workflows (injection par gabarit `${{ … }}` dans un `run:`, action non épinglée, `pull_request_target`, permissions larges) ; une valeur d'événement passe par `env:`, jamais dans un `run:`. Puis `references/ci/pr-titre.yml` → `.github/workflows/pr-titre.yml`, tel quel : non exigé, il ne s'ajoute pas à la protection de `develop` (le capitaine reste le juge).
7. **La méthode** : `references/docs-agents/chaine-de-production.md` → `docs/agents/chaine-de-production.md`, et `references/docs-agents/pieges.md` → `docs/agents/pieges.md`.
8. **Les ADR** : `node scripts/docs/next-id.mjs ADR ALL ARC` quatre fois, de suite, chaque ADR copiée avant l'appel suivant ; `references/adr/ADR_ALL_ARC-N-chaine-de-production.md`, `ADR_ALL_ARC-N-branches-de-sujet.md`, `ADR_ALL_ARC-N-recette-humaine.md`, `ADR_ALL_ARC-N-relecture-independante.md` → `docs/adr/ADR_ALL_ARC-<n>-….md`, `{{N}}` et `{{DATE}}` substitués. `{{ADR_CHAINE}}`, `{{ADR_SUJET}}` et `{{ADR_RELECTURE}}` valent ces identifiants dans tous les fichiers posés.
9. **La branche `develop`** : `references/scripts/github/develop.sh` → `scripts/github/develop.sh`, puis `bash scripts/github/develop.sh` : crée `develop` sur le distant depuis `origin/main` si elle n'existe pas, et la rapatrie (`origin/develop`). **Jamais `git push origin origin/main:refs/heads/develop` à la main** : le script est idempotent, rapatrie `origin/develop` et donne ses sorties. Il pousse sous le hook pre-push, jamais en le sautant : le push ne porte que `origin/main`, déjà sur le distant, et le pre-push du socle (`husky/pre-push`) conclut qu'il n'a rien à contrôler. Un `.husky/pre-push` antérieur au socle 7.0.1 refuserait ce push (`pnpm check` sur l'arbre de travail, `coverage-diff` sans `origin/develop`) : reposer le hook, jamais le sauter ; l'API GitHub (`POST git/refs`) n'est pas une option, le proxy des sessions cloud la refuse. Push refusé (droits) : la ligne va dans `chaine-admin.md`. La branche par défaut et sa protection sont à l'admin (`chaine-admin.md`).
10. **Les fragments** : chaque fragment s'insère immédiatement au-dessus du marqueur de sa zone, sans le supprimer :

| Fragment                                     | Fichier racine | Zone                                   |
| -------------------------------------------- | -------------- | -------------------------------------- |
| `references/fragments/claude-md-routing.md`  | `CLAUDE.md`    | `<!-- socle:routing -->`               |
| `references/fragments/claude-md-fusion.md`   | `CLAUDE.md`    | en fin de fichier, avant `## graphify` |
| `references/fragments/readme-commandes.md`   | `README.md`    | `<!-- socle:commandes -->`             |
| `references/fragments/readme-ou-vit-quoi.md` | `README.md`    | `<!-- socle:ou-vit-quoi -->`           |
| `references/fragments/readme-prerequis.md`   | `README.md`    | `<!-- socle:prerequis -->`             |

Un fragment d'arborescence prend le style de l'arbre déjà dessiné dans le fichier (indentation ou `├──`), à l'intérieur de son bloc de code, pas en dessous.

11. **La liste de l'admin** : `references/admin.md` → `docs/agents/chaine-admin.md`, cases à cocher par l'humain.

## Étape 3 — vérifier, puis seulement conclure

```bash
pnpm check
pnpm check:tickets        # le gate et les tests des scripts, dont scripts/agent/
node --test scripts/github/*.test.mjs
node scripts/docs/next-id.mjs ADR ALL ARC
```

Au premier `pnpm check` après cette pose, `check:contexte` nomme les références des gabarits de la chaîne vers une brique absente : sans API, les sept sections de `apps/api/CLAUDE.md` que citent les critères S1, S2, S4, S8, S9 et S10 de `docs/agents/criteres-revue.md`, et `scripts/db/demarrer-local.sh` dans `docs/agents/pieges.md`. Celles-là, et elles seules, se gèlent, comme à l'étape 7 de `socle-monorepo` (l'entrée `"<fichier>:<ligne>:<référence>"` de `scripts/verify/references-agent-dette.json`) ; `--elaguer` les retire à l'arrivée de l'API. Le lint et Prettier du projet ne lisent pas les scripts posés ici (bloc `socle:poses-du-plugin` de `.prettierignore`, gabarit de `socle-monorepo`) : un projet posé avant 8.3.1 l'ajoute (`NOTES-DE-VERSION.md`).

Puis : aucun placeholder `{{…}}` restant (chercher `{{[A-Z_]+}}` hors JSX) ; `.claude/settings.json` valide et les quatre hooks présents (deux graphify, deux agent) ; `git ls-remote --heads origin develop` rend une ligne ; `gh api repos/{owner}/{repo}/labels --jq '.[].name'` liste les neuf labels, ou la case correspondante de `chaine-admin.md` est ouverte.

Remettre à l'humain **la liste de `chaine-admin.md`** : rien de la chaîne ne tourne tant que `develop` n'est pas protégée avec « branche à jour exigée ». Et dire à qui a lancé la pose qu'un Relecteur doit tourner pour le dépôt avant la première PR (étape 2, point 2).

## Étape 4 — l'historique

`chore(chaine): pose le socle de la chaîne de production`, puis `docs(adr): consigne la chaîne de production, les branches de sujet, la recette humaine et la relecture indépendante` — aussi quand `socle-monorepo` l'invoque (sa question **chaîne**) : il arrive après le premier push de `main`, la racine est déjà dans l'historique.

## Ce que ce skill ne fait pas

- **Ni critères de revue, ni chemins sensibles inventés.** Le fichier de critères naît avec `revue-adversariale` ; les chemins viennent de la question 1.
- **Aucun réglage GitHub qui demande un admin** : protection, branche par défaut, suppression automatique. Il les liste.
- **Aucun chantier.** Il ne lance pas de session, n'ouvre pas de sujet.

## Anti-patterns

| Tentation                                                          | Pourquoi c'est faux                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| « Je garde `main` comme branche d'intégration, c'est plus simple » | Le capitaine, les sujets et les scripts lisent `develop`. Deux conventions, c'est deux fois les tests.      |
| « Je mets les règles de fusion dans un prompt, pas dans un hook »  | Un prompt se contourne, un hook non. Le push forcé a été vu deux fois avant le hook.                        |
| « Je recopie les ADR d'un autre projet »                           | Une ADR est une décision du projet, datée et signée. Le gabarit porte les faits ; le projet la fait sienne. |
| « J'ajoute un label de plus pour notre cas »                       | Les neuf labels sont le protocole des skills. Un dixième n'est lu par personne.                              |
| « La CI minimale ne suffit pas, j'écris les E2E tout de suite »    | Un E2E sans seed ni parcours est un job rouge. Ils arrivent avec le premier parcours.                       |
