# La copie des skills dans les projets se retire : workflow, commande, gate et refus du hook supprimés, plugin 6.0.0

Status: ready-for-agent
Type: feature
Modèle: sonnet
Blocked by: 13
Fichiers chauds: `.github/workflows/recopier-skills.yml`, `scripts/recopier-skills.mjs`, `scripts/recopier-skills.test.mjs`, `scripts/recopie-projets.json`, `docs/agents/recopie-des-skills.md`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies-regles.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/monorepo/socle-monorepo/references/racine/gitignore`, `skills/monorepo/socle-monorepo/references/CONTENU.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

`P-24`, 2026-11-14 : le dépôt `skills` est public, le script de l'environnement de chaque projet installe le plugin dans toute session, et `P-20` tombe. La décision le dit : « le workflow, la commande de copie, le manifeste, le gate `skills-recopies` et le refus d'éditer la copie n'ont plus d'objet ». Les tickets 11 et 12 les ont posés ; ils sont dans `main` à `809d62e`.

Aujourd'hui, un push sur `main` qui touche `.claude-plugin/plugin.json` lance `.github/workflows/recopier-skills.yml`, qui recopierait les skills dans `anchorpost` et `iroki-monorepo` et y ouvrirait une PR ; le socle pose dans chaque projet un gate `skills-recopies` et un hook qui refuse d'éditer un dossier de `.claude/skills/` nommé par un manifeste. Le `.gitignore` du gabarit, lui, ignore `.claude/skills/` : un skill propre au projet (`P-21`) ne se commite qu'en forçant.

Quand le ticket est fait, rien de la copie ne reste dans ce dépôt ni dans ce que le socle pose ; un projet posé par le socle commite ses propres skills sous `.claude/skills/` ; le plugin est en 6.0.0, une seule montée pour les tickets 13 et 14.

## Où

Lignes de `origin/main` à `809d62e` (2026-11-14, plugin 5.0.2), toutes relues. `R` abrège `skills/chaine/socle-chaine-de-production/references`, `M` abrège `skills/monorepo/socle-monorepo/references`. Inventaire par `git grep -n -i "recopi\|maj-skills.json\|skills-recopies\|RECOPIE_TOKEN" 809d62e`, puis `git grep -n "skillsRecopies\|MANIFESTE_SKILLS\|versionSkills\|check:skills\|copie des skills"` ; les autres résultats de « recopi » (la boucle du capitaine qui recopie `scripts/chaine`, « ne recopie aucune règle », les planches recopiées, `docs/issues/`) sont sans rapport.

### 1. Huit fichiers supprimés (`git rm`)

- `.github/workflows/recopier-skills.yml`
- `scripts/recopier-skills.mjs` et son banc `scripts/recopier-skills.test.mjs` (13 tests)
- `scripts/recopie-projets.json` (`anchorpost` et `iroki-monorepo`)
- `docs/agents/recopie-des-skills.md`
- `R/scripts/verify/skills-recopies.mjs`, `R/scripts/verify/skills-recopies-regles.mjs` et `R/scripts/verify/skills-recopies.test.mjs` (9 tests)

### 2. Le refus d'éditer la copie — `R/agent/regles.mjs` et son banc

`garde-fichiers.mjs` (ligne 24) appelle `refusEdition(chemin, { migrationExistante })` sans clé de la copie : il ne change pas.

- `regles.mjs` : lignes 28 et 29 (`MANIFESTE_SKILLS` et sa JSDoc) supprimées, et une seule des deux lignes vides qui les entourent (27 et 30), pour ne pas en laisser deux de suite ; dans la JSDoc de `refusEdition` (lignes 46 à 49), le type du second argument redevient `{ migrationExistante: (chemin: string) => boolean, migrations?: string }` et les lignes `skillsRecopies` et `versionSkills` partent ; lignes 56 et 57 (les deux valeurs par défaut) et 63 à 69 (le bloc du refus) supprimées. Plus rien sous `.claude/skills/` n'est refusé.
- `regles.test.mjs` : ligne 5 (le commentaire) et ligne 6 (`copie`) supprimées ; lignes 7 et 8, `livree` et `nouvelle` sans `...copie`. Le test des lignes 17 à 23 devient « refusEdition laisse éditer .claude/skills : les skills du plugin vivent hors du dépôt, ceux du projet sont à lui » : `refusEdition` rend `null` pour `.claude/skills/chantier/SKILL.md`, `.claude/skills/maj-skills.json` et `.claude/skills/parcours-federation/SKILL.md`, avec `nouvelle`.

### 3. Le gate `skills-recopies` dans ce que pose le socle

- `R/chaine.json` : ligne 19 (`"scripts/verify/skills-recopies.mjs"`) supprimée, et la virgule de la ligne 18. `fin-de-tour.mjs` ne joue que les gates qui existent : un projet qui l'avait posé n'est pas cassé.
- `skills/chaine/socle-chaine-de-production/SKILL.md`, ligne 37 (le point « 4 ter », script `check:skills` et étape de `scripts/check.mjs` comprises) supprimée. Le gabarit `scripts/check.mjs` de `socle-monorepo` ne porte pas cette étape (`git grep -n "check:skills" 809d62e` ne rend que cette ligne) : rien d'autre à retirer.
- `R/CONTENU.md`, ligne 13 : « , d'une migration déjà livrée et de la copie des skills de la chaîne que nomme `.claude/skills/maj-skills.json` ; le gate `skills-recopies` (`scripts/verify/skills-recopies.mjs`) contrôle cette copie contre son manifeste. » devient « `.env` et d'une migration déjà livrée. » : le passage entier se lit alors « … l'édition d'un index généré, du lockfile, d'un `.env` et d'une migration déjà livrée. Les règles sont des fonctions pures … » (la virgule avant « d'une migration » et le tout suivant, jusqu'à « son manifeste. », sont remplacés, sans espace manquante)
- `R/fragments/claude-md-fusion.md`, ligne 10 : « , ainsi que l'édition de la copie des skills de la chaîne, sous .claude/skills : une modification se fait dans MAJ-agency/skills, la copie arrive par PR » supprimé ; la phrase finit à « (le conducteur l'accorde en complétant cette ligne). »
- `R/docs-agents/pieges.md` et `R/docs-agents/chaine-de-production.md` : aucune mention de la copie à `809d62e` (le ticket 12 les avait touchés pour le hook qui ne demande plus) ; rien à faire.

### 4. Le banc du dépôt — `scripts/depot.test.mjs`

- Ligne 59 (`RECOPIE`) et lignes 154 à 194 (les lecteurs `declencheurs`, `filtreChemin`, `permissionsLectureSeule`, `lignesSecret`, `lignesSecretMalFormees` et les quatre tests du workflow de recopie) supprimées. Les tests « aucun workflow … » (lignes 130 et 137) parcourent `.github/workflows/` : il n'y reste que `ci.yml`, ils restent verts.
- Un test nouveau, après celui de la carte de chantier (ligne 242) : « le gabarit .gitignore laisse commiter les skills propres au projet » : dans les lignes de `skills/monorepo/socle-monorepo/references/racine/gitignore`, `!.claude/skills/` existe et vient après `.claude/*`.

### 5. Le `.gitignore` du gabarit — `M/racine/gitignore`

**Il faut ajouter `!.claude/skills/`.** La ligne 2 (`.claude/*`) ignore tout `.claude/` sauf les exceptions des lignes 3, 5 et 6 ; un skill propre au projet (`P-21`) ne se commite donc qu'avec `git add -f`, alors que le socle compte déjà sur ces skills suivis par git : `references-agent.mjs` lit `.claude/skills/**/*.md` parmi les fichiers suivis (ligne 48) et `budget-contexte.mjs` compte leurs `SKILL.md`. Ce que le danger d'hier interdisait n'existe plus : aucune copie du plugin n'arrive plus sous `.claude/skills/`.

- Ligne 4, le commentaire devient : `# les fiches de règles chargées par chemin, le contrat de la chaîne et les skills propres au projet sont du dépôt (ceux du plugin vivent hors du dépôt)`.
- Après la ligne 6 (`!.claude/chaine.json`) : `!.claude/skills/`.
- `M/CONTENU.md`, ligne 28 : la ligne à `809d62e` est : « - **`gitignore`** — stocké sans point pour ne pas s'appliquer au dépôt du skill ; ignore `graphify-out/` (graphe local, reconstruit en continu) et `.husky/*.local` (gardes de la machine). » Elle devient : « - **`gitignore`** — stocké sans point pour ne pas s'appliquer au dépôt du skill ; ignore `graphify-out/` (graphe local, reconstruit en continu), `.husky/*.local` (gardes de la machine) et tout `.claude/` sauf `settings.json`, `rules/`, `chaine.json` et `skills/` (les skills propres au projet, `P-21`, sont du dépôt ; ceux du plugin vivent hors du dépôt). »
- `eslint.config.mjs` et `.prettierignore` du gabarit : rien à exclure, plus de copie. Un skill propre au projet est lint et formaté comme le reste.

### 6. La version — `.claude-plugin/plugin.json`

Ligne 3 : `"version": "6.0.0"`. Règle du `README.md`, « Ajouter un skill », étape 4 (ligne 180) : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat ». La majeure tient à ce ticket seul : le socle de la chaîne ne pose plus le gate `skills-recopies` ni le refus d'éditer `.claude/skills/`, le contrat `gatesRapides` de `.claude/chaine.json` perd une entrée, et les projets qui recevaient la copie par PR (workflow et commande de copie retirés) ne la reçoivent plus ; un projet qui comptait sur l'un d'eux doit l'apprendre par la version. Le ticket 13 change la consigne de lecture des skills sans retirer de contrat ; il n'a plus de part sur les plafonds (sortie le 2026-11-14 vers une autre session), et la version n'en dépend pas. Précédent : le ticket 8, `4.2.0` vers `5.0.0`. Une seule montée, dans ce ticket, comme les tickets 5 à 8 (`A-1`) : le ticket 13 ne la touche pas.

**Le déclenchement du workflow.** `recopier-skills.yml` se lance sur un push de `main` qui touche `.claude-plugin/plugin.json`. GitHub lit les workflows dans le commit poussé : le squash de ce ticket monte la version **et** supprime le fichier du workflow, donc aucun workflow de recopie n'existe à ce commit et rien ne se lance. C'est la raison de monter la version ici et non au ticket 13 : un ticket 13 qui l'aurait montée aurait lancé la recopie, qui, avec le secret `RECOPIE_TOKEN`, aurait rouvert sur `anchorpost` la PR d'une copie que `P-24` retire (et échoué sur `iroki-monorepo`). La version doit donc arriver dans le même commit que la suppression : ne pas la monter dans un commit à part poussé avant.

**Risque de séquencement.** Si une autre session (celle qui refait les contrôles de session) fusionne sur `main` un commit qui touche `.claude-plugin/plugin.json` avant ce ticket, `recopier-skills.yml` se déclenche encore : il échoue à sa première étape si le secret `RECOPIE_TOKEN` n'existe pas, sinon il ouvre des PR de recopie dans les projets. Consigne : avant de sortir sa PR du brouillon, la session de ce ticket vérifie la version portée par `origin/main` (`git show origin/main:.claude-plugin/plugin.json`). Si elle n'est plus 5.0.2 : elle garde 6.0.0 si la version de `main` est inférieure, sinon elle l'écrit à l'architecte et s'arrête.

## Décisions

- `P-24` (dépôt public, plus de copie), `P-21` et `P-22` (un projet garde ses skills et ne touche jamais à ceux du plugin).
- **`!.claude/skills/` dans le gabarit** (point 5) ; aucune exclusion d'`eslint` ni de `prettier`.
- **Le hook n'a plus aucun refus sous `.claude/skills/`** : les skills du plugin ne sont pas dans le dépôt, il n'y a rien à protéger ; ceux du projet sont à lui.
- **6.0.0, une seule montée, dans le commit qui supprime le workflow** (point 6).
- Aucune dépendance nouvelle ; `package.json` ne change pas (ses motifs ne nomment aucun fichier supprimé).

## Surfaces

| Surface | Preuve |
| --- | --- |
| la copie retirée du dépôt | `git grep -n "recopier-skills\|recopie-projets\|recopie-des-skills\|maj-skills.json\|skills-recopies\|RECOPIE_TOKEN\|check:skills\|skillsRecopies\|MANIFESTE_SKILLS\|versionSkills\|copie des skills" -- . ':!docs/issues'` ne rend que le test de `regles.test.mjs` qui laisse éditer `.claude/skills/maj-skills.json` (seize fichiers à `809d62e`) |
| les fichiers supprimés | `git ls-files .github/workflows` ne rend que `ci.yml` ; `git ls-files scripts docs/agents skills/chaine/socle-chaine-de-production/references/scripts/verify \| grep -i recopi` ne rend rien |
| le hook | `regles.test.mjs` : `.claude/skills/…` jamais refusé ; les refus de migration, de lockfile, de `.env` et d'index généré inchangés |
| le `.gitignore` | le test nouveau de `scripts/depot.test.mjs` |
| la version | `.claude-plugin/plugin.json` : `"version": "6.0.0"` ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que cette ligne |

## Vérification

- `pnpm test` vert. À `809d62e` : **410 tests** (joué le 2026-11-14 dans un arbre détaché). Ce ticket en retire 26, tous de la copie (13 de `recopier-skills.test.mjs`, 9 de `skills-recopies.test.mjs`, 4 du workflow de recopie dans `depot.test.mjs`), réécrit celui du refus de `regles.test.mjs` et en ajoute 1 (le `.gitignore`) : **385** attendus après le ticket 13, qui n'en change pas le nombre, plus ceux que la session des plafonds aurait ajoutés si elle a fusionné avant. Aucun test désactivé ; aucun autre retiré.
- Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture.
- La PR vise `main`. La session part de `origin/main` avec le ticket 13 fusionné, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Hors périmètre

- **Le séquencement avec la session des contrôles de session** : si elle fusionne avant ce ticket un commit qui touche `.claude-plugin/plugin.json`, le workflow de recopie se déclenche encore ; la consigne est au point 6, « Risque de séquencement ».
- Le secret `RECOPIE_TOKEN` de ce dépôt et le jeton qu'il porte : à supprimer et révoquer par l'admin après la fusion (réglage GitHub, pas un fichier).
- Les dépôts de projet : le retrait de la copie d'`anchorpost` (PR 121 : `.claude/skills/<nom>/`, le manifeste, ses exclusions d'`eslint` et de `prettier`, le gate `skills-recopies`, le refus du hook), la première copie d'`iroki-monorepo` qui n'a plus lieu (`P-23` se reprend), le `.gitignore` de chaque projet.
- `fedora` : son lot se reprend après `P-24`, par d'autres tickets.
- Le point d'extension de `sujet.sh` qui appelle un script du projet (`A-41`).
- **Les plafonds et le passage de main de l'architecte, du conducteur et des filles** (`P-25` et la refonte des contrôles de session), menés par une autre session : ce ticket ne touche ni `skills/chaine/chantier/SKILL.md`, ni `plafonds.mjs` et son banc, ni les trois fichiers du gate `tickets`. Il partage avec elle deux fichiers, à des lignes distinctes : `R/chaine.json`, dont il ne retire que la ligne 19 et la virgule de la ligne 18 (pas le `$comment` de la ligne 2), et `R/CONTENU.md`, dont il ne change que la ligne 13 (pas la ligne 5).

## Comments

- 2026-11-14 — Écrit après `P-24` et `P-25`, en même temps que la réécriture du ticket 13 : le retrait de la copie en est sorti pour tenir sous vingt fichiers par ticket. Dix-huit fichiers, dont huit supprimés.
- 2026-11-14 — La justification de la 6.0.0 ne s'appuie plus sur l'architecte sans plafond (`passer-la-main`, rôle `architecte` refusé par `plafonds.mjs`), sorti du ticket 13 vers la session qui reprend les contrôles de session : la majeure tient au gate `skills-recopies`, au refus du hook et au service de copie retirés. Version inchangée ; les deux fichiers partagés avec cette session sont nommés sous « Hors périmètre ».
- 2026-11-14 — Relu par un agent neuf, corrections reportées : texte final exact de `R/CONTENU.md:13` et de `M/CONTENU.md:28`, une seule ligne vide à retirer dans `regles.mjs`, et le risque de séquencement avec la session des contrôles de session (consigne sur la version de `origin/main`).
