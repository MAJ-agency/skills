# Dans un projet, la copie des skills ne se modifie pas, et le hook d'agent ne demande plus rien à un humain

Status: ready-for-agent
Type: feature
Modèle: sonnet
Blocked by: 11
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies-regles.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/anchorpost/SKILL.md`, `skills/monorepo/socle-tests/SKILL.md`

## Le besoin

Deux décisions du produit (carte du programme, [`../map.md`](../map.md)) changent les gabarits que le socle pose dans un projet.

`P-20`, troisième pièce : dans un projet, la copie des skills de la chaîne ne se modifie pas à la main. Le hook d'agent refuse son édition comme il refuse celle d'un index généré, un contrôle de `pnpm check` refuse une copie qui diffère de sa version déclarée, et une ligne de `CLAUDE.md` le dit. La copie et son manifeste, `.claude/skills/maj-skills.json`, sont posés par `scripts/recopier-skills.mjs` (ticket 11, fusionné avant celui-ci).

`P-19`, troisième travail : le produit ne valide plus aucune autorisation technique. Aujourd'hui le hook **demande** à un humain avant une dépendance nouvelle et devant un `git push` illisible. Le dépôt `iroki-monorepo` a déjà changé ce comportement dans sa copie (son ticket `SPEC_ALL_SOC-4.23`, fait) : le hook refuse, dit quoi faire, et n'écrit plus jamais de demande. Ce ticket reporte ce changement dans le gabarit.

Quand le ticket est fait, le gabarit du hook refuse l'édition de la copie et ne rend plus jamais « demander », un gate nouveau contrôle la copie contre son manifeste, et la prose du plugin ne dit plus que le hook demande.

## Où

Lignes de `origin/main` à `0a39329` (2026-11-13). `R` abrège `skills/chaine/socle-chaine-de-production/references`.

### 1. Le hook refuse d'éditer la copie — `R/agent/regles.mjs`

- Une constante exportée nouvelle, à côté de `INDEX_GENERES` (ligne 26) : le manifeste du projet, lu par `lireJson(new URL('../../.claude/skills/maj-skills.json', import.meta.url))`, `null` quand il est absent ou illisible.
- `refusEdition` (lignes 46 à 49) reçoit, dans son second argument, la liste des skills recopiés et leur version, avec pour défaut ceux du manifeste (même façon que `migrations`, dont le défaut est `CHAINE.migrations`). Elle refuse `.claude/skills/maj-skills.json` et tout chemin sous `.claude/skills/<nom>/` quand `<nom>` est dans la liste. Texte du refus : `` `${c} est une copie des skills de la chaîne (maj-skills ${version}) : elle ne se modifie pas dans ce projet. Modifier le skill dans MAJ-agency/skills ; la copie arrive par PR.` ``
- Sans manifeste, rien n'est refusé à ce titre. Un dossier de `.claude/skills/` que le manifeste ne nomme pas est un skill propre au projet : son édition passe.
- Format du manifeste (écrit par le ticket 11) : `{ "source", "version", "skills": ["<nom>", …], "fichiers": { "<nom>/<chemin>": "<sha256 en hexadécimal>" } }`, chemins relatifs à `.claude/skills/`, barres obliques.

### 2. Le hook ne demande plus rien — `R/agent/regles.mjs`, `R/agent/garde-commandes.mjs`

- `regles.mjs`, ligne 256 (`pushIllisible`) et ligne 263 (dépendance) : `decision: 'demander'` devient `decision: 'refuser'`. `decisionCommande` ne rend plus que `refuser` ou `null` ; son commentaire (lignes 236 à 248) le dit, et dit que le hook ne demande jamais rien à un humain.
- `RAISON_DEPENDANCE` (lignes 71 et 72) devient : « Dépendance nouvelle refusée : elle n'est pas sur la ligne `Dépendances:` du ticket, lue sur le sujet (ou cette ligne ne se lit pas : origin injoignable, option qui change la source, `.npmrc` modifié, ticket hors sujet, branche sans ticket). Écris à qui a lancé ta session, ton conducteur dans un chantier : le paquet, pourquoi, ce qu'il remplace. C'est lui qui l'accorde, en complétant la ligne sur le sujet. Un paquet prévu par cette ligne passe. »
- `RAISON_PUSH_ILLISIBLE` (lignes 152 et 153) : « L'écrire en clair » devient « Écris le refspec en clair », le reste ne change pas.
- `garde-commandes.mjs`, lignes 60 à 69 : toute décision non nulle écrit sa raison sur la sortie d'erreur et sort en 2. Le bloc qui écrit `permissionDecision: 'ask'` (lignes 67 et 68) disparaît.
- Bancs. `regles.test.mjs` : les attentes `'demander'` (lignes 34, 35, 58 à 64, 69 à 71, 101, 102, 162) deviennent `'refuser'`. `garde-commandes.test.mjs` : l'aide `demande` (ligne 45) et les assertions qui l'emploient (lignes 51 à 103) deviennent des assertions de refus (code de sortie 2, raison sur la sortie d'erreur) ; un test nouveau affirme que la sortie standard ne contient jamais `permissionDecision`. Les titres de test qui disent « demande » suivent.

### 3. Le gate — `R/scripts/verify/skills-recopies.mjs`

Sur le modèle du gate `settings-json` du même dossier : la logique pure dans `skills-recopies-regles.mjs`, le banc dans `skills-recopies.test.mjs`.

- Sans `.claude/skills/maj-skills.json` : code 0, une ligne « aucune copie de skills déclarée ».
- Manifeste illisible, ou sans `skills` ni `fichiers` : code 1.
- Pour chaque entrée de `fichiers` : le fichier existe et son sha256 est celui du manifeste ; sinon il est listé « absent » ou « modifié ». Pour chaque nom de `skills` : tout fichier de `.claude/skills/<nom>/` que `fichiers` ne liste pas est listé « en trop ».
- Un écart : code 1, la liste, puis la phrase « la copie des skills diffère de son manifeste (maj-skills <version>) : elle ne se modifie pas dans ce projet. La rétablir depuis la branche d'intégration, ou attendre la PR de recopie. »
- Un dossier de `.claude/skills/` que le manifeste ne nomme pas n'est pas lu.
- `R/chaine.json`, `gatesRapides` (dernière entrée ligne 25) : ajouter `"scripts/verify/skills-recopies.mjs"`.
- `skills/chaine/socle-chaine-de-production/SKILL.md`, après l'étape « 4 bis » (ligne 36) : une étape « 4 ter », d'une phrase ou deux, qui pose `references/scripts/verify/skills-recopies*` dans `scripts/verify/`, le script `check:skills` (`node scripts/verify/skills-recopies.mjs`) dans `package.json` et l'étape `check:skills` dans `scripts/check.mjs` après `check:settings`. Le fichier reste sous 200 lignes (85 aujourd'hui).

### 4. La prose

- `R/fragments/claude-md-fusion.md`, ligne 10 (la ligne de `CLAUDE.md` sur les hooks) : « et demandent avant toute dépendance nouvelle que la ligne `Dépendances:` du ticket, lue sur le sujet, ne prévoit pas » devient un refus, avec qui l'accorde ; la même ligne gagne le refus d'éditer la copie des skills (`.claude/skills/`, manifeste `maj-skills.json`) : une modification se fait dans `MAJ-agency/skills`, la copie arrive par PR.
- `R/docs-agents/chaine-de-production.md`, ligne 68 : « demande l'accord d'un humain » devient « est refusé par le hook, qui ne demande jamais rien à un humain ». La ligne 115 de ce fichier (l'attache par `add_repo`) n'est pas à ce ticket.
- `R/CONTENU.md`, ligne 13 : « et **demande** avant une dépendance nouvelle, sauf si » devient « et **refuse** une dépendance nouvelle, sauf si » ; une phrase y nomme le gate `skills-recopies` et le refus d'éditer la copie.
- `skills/chaine/anchorpost/SKILL.md`, ligne 37 : la parenthèse « l'ajout d'une dépendance demande l'accord humain : le dire » devient « le hook d'agent refuse une dépendance que la ligne `Dépendances:` du ticket ne prévoit pas : la prévoir dans le ticket ».
- `skills/monorepo/socle-tests/SKILL.md`, ligne 25 : « demander avant : le hook d'agent le fait aussi » devient « les prévoir sur la ligne `Dépendances:` du ticket : le hook d'agent refuse le reste ».

## Décisions

- `P-19` et `P-20` de la carte ; `A-33` (le manifeste dit ce qui est protégé : seuls les dossiers qu'il nomme) ; `A-38` (les deux changements du hook dans un même ticket : même fichier).
- Le hook ne voit que les outils d'édition (`Edit`, `Write`, `MultiEdit`, `NotebookEdit`) : une copie modifiée par une commande shell lui échappe, comme un index généré. C'est le gate qui la rattrape.
- L'empreinte est le sha256 des octets du fichier, en hexadécimal : la même que celle du ticket 11. Le banc du gate le prouve en jouant la vraie commande de copie.
- `skills/chaine/chantier/SKILL.md`, ligne 61, dit déjà « une dépendance hors de cette ligne est un blocage pour la fille, pas un contournement » : elle ne change pas.
- La consigne d'attache par `add_repo`, le signalement de `R/agent/demarrage.mjs` et la version du plugin ne sont pas à ce ticket : ticket 13.
- Aucune dépendance nouvelle.

## Surfaces

| Surface | Preuve |
| --- | --- |
| refus d'éditer la copie | `regles.test.mjs` : avec `skills: ['chantier']`, `refusEdition('.claude/skills/chantier/SKILL.md', …)` et `refusEdition('.claude/skills/maj-skills.json', …)` rendent le texte du refus, version comprise ; `.claude/skills/parcours-federation/SKILL.md` rend `null` ; sans manifeste, `.claude/skills/chantier/SKILL.md` rend `null` ; un chemin voisin (`.claude/skills/chantier-bis/x.md`) rend `null` |
| le hook ne demande plus | `grep -rn "demander\|permissionDecision" skills/chaine/socle-chaine-de-production/references/agent/*.mjs` ne rend que des lignes de test qui affirment l'absence ; `regles.test.mjs` et `garde-commandes.test.mjs` verts avec leurs attentes de refus |
| le gate | `skills-recopies.test.mjs` : sur un projet temporaire où le banc joue `scripts/recopier-skills.mjs` du dépôt, le gate sort en 0 ; un fichier copié modifié, supprimé, ou ajouté dans un dossier recopié le fait sortir en 1 avec le chemin nommé ; un skill propre au projet ne change rien ; sans manifeste, code 0 |
| la prose | `grep -rn -i "demande l'accord\|demandent avant\|\*\*demande\*\* avant\|demander avant" skills/` ne rend rien |
| le fragment de `CLAUDE.md` | la ligne 10 de `claude-md-fusion.md` contient « refusent », `.claude/skills/` et `maj-skills.json` |

## Vérification

- `pnpm test` vert, sans test retiré ni désactivé. Le motif `'skills/*/*/references/scripts/*/*.test.mjs'` de `package.json` prend déjà le banc du gate : `package.json` ne change pas.
- `skills/chaine/socle-chaine-de-production/SKILL.md` reste sous 200 lignes (`scripts/depot.test.mjs` le contrôle).
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Comments
