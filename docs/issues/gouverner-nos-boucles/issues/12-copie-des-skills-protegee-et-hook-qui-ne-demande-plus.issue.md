# Dans un projet, la copie des skills ne se modifie pas, et le hook d'agent ne demande plus rien à un humain

Status: ready-for-agent
Type: feature
Modèle: sonnet
Blocked by: 11
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies-regles.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/skills-recopies.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md`, `skills/chaine/anchorpost/SKILL.md`, `skills/monorepo/socle-tests/SKILL.md`

## Le besoin

Deux décisions du produit changent les gabarits que le socle pose dans un projet.

`P-20`, troisième pièce : dans un projet, la copie des skills de la chaîne ne se modifie pas à la main. Le hook d'agent refuse son édition comme il refuse celle d'un index généré, un contrôle de `pnpm check` refuse une copie qui diffère de sa version déclarée, et une ligne de `CLAUDE.md` le dit. La copie et son manifeste, `.claude/skills/maj-skills.json`, sont posés par `scripts/recopier-skills.mjs` (ticket 11, déjà dans `main`).

`P-19`, troisième travail : le produit ne valide plus aucune autorisation technique. Aujourd'hui le hook **demande** à un humain avant une dépendance nouvelle et devant un `git push` illisible. Le dépôt `iroki-monorepo` a déjà changé ce comportement dans sa copie (son ticket `SPEC_ALL_SOC-4.23`, fait) : le hook refuse, dit quoi faire, et n'écrit plus jamais de demande. Ce ticket reporte ce changement dans le gabarit.

Quand le ticket est fait, le gabarit du hook refuse l'édition de la copie et ne rend plus jamais « demander », un gate nouveau contrôle la copie contre son manifeste, et la prose du plugin ne dit plus que le hook demande.

## Où

Lignes de `origin/main` à `480d5c8` (2026-11-14). `R` abrège `skills/chaine/socle-chaine-de-production/references`.

### 1. Le hook refuse d'éditer la copie — `R/agent/regles.mjs`

- Une constante exportée nouvelle, à côté de `INDEX_GENERES` (ligne 26) : le manifeste du projet, lu par `lireJson(new URL('../../.claude/skills/maj-skills.json', import.meta.url))`, `null` quand il est absent ou illisible.
- `refusEdition` (lignes 46 à 59) reçoit deux clés de plus dans son second argument : `skillsRecopies` (tableau de noms ; défaut : le tableau `skills` du manifeste, ou `[]` s'il n'y a pas de manifeste ou si `skills` n'est pas un tableau) et `versionSkills` (défaut : la `version` du manifeste, ou `'?'`). Même façon que `migrations`, dont le défaut est `CHAINE.migrations`.
- Quand `skillsRecopies` n'est pas vide, elle refuse `.claude/skills/maj-skills.json` et tout chemin sous `.claude/skills/<nom>/` dont `<nom>` est dans le tableau. Texte du refus : `` `${c} est une copie des skills de la chaîne (maj-skills ${versionSkills}) : elle ne se modifie pas dans ce projet. Modifier le skill dans MAJ-agency/skills ; la copie arrive par PR.` ``
- Quand `skillsRecopies` est vide, rien n'est refusé à ce titre, pas même le manifeste. Un dossier de `.claude/skills/` que le tableau ne nomme pas est un skill propre au projet : son édition passe.
- **Les tests passent toujours ces deux clés** et ne s'appuient jamais sur le défaut : `regles.test.mjs` est posé dans `scripts/agent/` d'un projet et y est rejoué, où un vrai manifeste existe (même précaution que `migrations`, `regles.test.mjs:5-6`).
- Format du manifeste : `{ "$comment", "source", "version", "skills": ["<nom>", …], "fichiers": { "<nom>/<chemin>": "<sha256 en hexadécimal>" } }`, chemins relatifs à `.claude/skills/`, barres obliques. Pour le voir : `node scripts/recopier-skills.mjs <dossier temporaire>`.

### 2. Le hook ne demande plus rien — `R/agent/regles.mjs`, `R/agent/garde-commandes.mjs`

- `regles.mjs`, ligne 256 (`pushIllisible`) et ligne 263 (dépendance) : `decision: 'demander'` devient `decision: 'refuser'`. `decisionCommande` ne rend plus que `refuser` ou `null` ; son commentaire (lignes 236 à 248) le dit, et dit que le hook ne demande jamais rien à un humain. Le commentaire de la ligne 92 (« demandent toujours ») devient « sont toujours refusées ».
- `RAISON_DEPENDANCE` (lignes 71 et 72) devient : « Dépendance nouvelle refusée : elle n'est pas sur la ligne `Dépendances:` du ticket, lue sur le sujet (ou cette ligne ne se lit pas : origin injoignable, option qui change la source, `.npmrc` modifié, ticket hors sujet, branche sans ticket). Écris à qui a lancé ta session, ton conducteur dans un chantier : le paquet, pourquoi, ce qu'il remplace. C'est lui qui l'accorde, en complétant la ligne sur le sujet. Un paquet prévu par cette ligne passe. »
- `RAISON_PUSH_ILLISIBLE` (lignes 152 et 153) : « L'écrire en clair » devient « Écris le refspec en clair », le reste ne change pas.
- `garde-commandes.mjs` : toute décision non nulle écrit sa raison sur la sortie d'erreur et sort en 2 (lignes 62 à 65, à généraliser) ; le bloc qui écrit `permissionDecision: 'ask'` (lignes 67 à 69) disparaît. Les commentaires suivent : ligne 2 (« soumises à l'humain »), ligne 9 (« demande pour toute dépendance »), ligne 29 (« donc « demander » »), lignes 35 à 37 (« et on demande ») disent désormais un refus.
- `regles.test.mjs` : les attentes `'demander'` (lignes 34, 35, 58 à 64, 69 à 71, 101, 102, 162) deviennent `'refuser'`. Le titre du test de la ligne 151 (« un refspec illisible … demande ») suit : la preuve par `grep` de la prose lit aussi ce fichier.
- `garde-commandes.test.mjs` : l'aide `demande` (ligne 45) est remplacée par deux aides, « la commande est refusée » (code de sortie 2, raison sur la sortie d'erreur) et « la commande passe » (code 0, sortie d'erreur vide). Les assertions qui attendaient `true` (lignes 52, 58, 61, 69, 75, 77, 89, 103, 111, 114, 127, 137) deviennent des refus ; celles qui attendaient `false` (lignes 51, 88, 109, 130) deviennent « la commande passe ». `assert.equal(r.status, 0)` de la ligne 136 attend désormais 2 ; celui de la ligne 50 ne change pas. Un test nouveau affirme que la sortie standard ne contient jamais `permissionDecision`, pour une commande refusée comme pour une commande qui passe. Les titres de test qui disent « demande » suivent.
- **Conséquence voulue sur le gate `settings-json`** : `R/scripts/verify/settings-json-regles.mjs:91-92` signale toute entrée `allow` que `decisionCommande` refuse. Une entrée comme `Bash(pnpm add zod)` ou `Bash(git push --all:*)` devient donc un écart, ce qui est juste : elle autoriserait ce que le hook refuse. Le fichier de règles ne change pas ; `settings-json.test.mjs` gagne un cas qui le prouve (`Bash(pnpm add zod)` est un écart, `Bash(pnpm:*)` n'en est pas un).

### 3. Le gate — `R/scripts/verify/skills-recopies.mjs`

Sur le modèle du gate `settings-json` du même dossier : la logique pure dans `skills-recopies-regles.mjs`, la racine du projet lue dans `PROJET_RACINE` avec le même défaut (`settings-json.mjs:25`), le banc dans `skills-recopies.test.mjs`.

- Sans `.claude/skills/maj-skills.json` : code 0, une ligne « aucune copie de skills déclarée ».
- Manifeste invalide : code 1, le fichier nommé. Il est invalide s'il n'est pas un objet JSON, si `skills` n'est pas un tableau de chaînes, ou si `fichiers` n'est pas un objet dont chaque valeur est une chaîne. Toute autre clé (`$comment`, `source`…) est ignorée ; une `version` absente s'affiche « ? ».
- Pour chaque entrée de `fichiers` : le fichier existe et son sha256 est celui du manifeste ; sinon il est listé « absent » ou « modifié ». Pour chaque nom de `skills` : tout fichier de `.claude/skills/<nom>/` que `fichiers` ne liste pas est listé « en trop ».
- Un écart : code 1, la liste, puis la phrase « la copie des skills diffère de son manifeste (maj-skills <version>) : elle ne se modifie pas dans ce projet. La rétablir depuis la branche d'intégration, ou attendre la PR de recopie. »
- Un dossier de `.claude/skills/` que le manifeste ne nomme pas n'est pas lu.
- **Le banc doit tourner aussi une fois posé dans un projet**, où `check:tickets` joue `scripts/verify/*.test.mjs` et où `scripts/recopier-skills.mjs` n'existe pas. Il construit donc lui-même ses projets temporaires (fichiers et manifeste, sha256 calculé dans le test), et lance le script du gate avec `PROJET_RACINE` pour lire ses codes de sortie. Un seul test joue la vraie commande de copie, pour prouver que les deux empreintes sont les mêmes : il cherche `scripts/recopier-skills.mjs` à la racine du dépôt `skills` par un chemin relatif au banc, et ne s'enregistre que si le fichier existe (même façon de distinguer le plugin d'un projet que `R/agent/garde-commandes.test.mjs:12-15`).
- `R/chaine.json`, `gatesRapides` (dernière entrée ligne 18) : ajouter `"scripts/verify/skills-recopies.mjs"`.
- `skills/chaine/socle-chaine-de-production/SKILL.md`, après l'étape « 4 bis » (ligne 36) : une étape « 4 ter », d'une phrase ou deux, qui pose `references/scripts/verify/skills-recopies*` dans `scripts/verify/`, le script `check:skills` (`node scripts/verify/skills-recopies.mjs`) dans `package.json` et l'étape `check:skills` dans `scripts/check.mjs` après `check:settings`. Le fichier reste sous 200 lignes (85 aujourd'hui).

### 4. La prose

Chaque phrase qui dit que le hook demande devient un refus. Les neuf endroits :

- `R/fragments/claude-md-fusion.md`, ligne 10 (la ligne de `CLAUDE.md` sur les hooks) : « et demandent avant toute dépendance nouvelle que la ligne `Dépendances:` du ticket, lue sur le sujet, ne prévoit pas » devient « et refusent toute dépendance nouvelle que la ligne `Dépendances:` du ticket, lue sur le sujet, ne prévoit pas (le conducteur l'accorde en complétant cette ligne), ainsi que l'édition de la copie des skills de la chaîne, sous .claude/skills : une modification se fait dans MAJ-agency/skills, la copie arrive par PR ». **Le dossier s'écrit sans accents graves** : le gate `references-agent` vérifie tout chemin entre accents graves contre `git ls-files`, et un projet qui pose le socle n'a pas encore la copie.
- `R/docs-agents/chaine-de-production.md`, ligne 68, trois endroits : « un ticket hors sujet ou un `origin` injoignable demande l'accord d'un humain » devient « … est refusé par le hook, qui ne demande jamais rien à un humain » ; « Une destination illisible (variable, substitution, motif, `--all`, `--mirror`) demande l'accord d'un humain » devient « … est refusée » ; « suspend le laissez-passer : on demande » devient « suspend le laissez-passer : le hook refuse ». La ligne 115 de ce fichier (l'attache par `add_repo`) n'est pas à ce ticket.
- `R/docs-agents/pieges.md`, ligne 13 : « et demande confirmation sur une destination illisible » devient « et refuse une destination illisible ».
- `R/CONTENU.md`, ligne 13, deux endroits : « et **demande** avant une dépendance nouvelle, sauf si » devient « et **refuse** une dépendance nouvelle, sauf si » ; « Une destination illisible (variable, substitution, motif, `--all`, `--mirror`) demande. » devient « … est refusée. ». Une phrase y nomme le gate `skills-recopies` et le refus d'éditer la copie.
- `skills/chaine/anchorpost/SKILL.md`, ligne 37 : la parenthèse « l'ajout d'une dépendance demande l'accord humain : le dire » devient « le hook d'agent refuse une dépendance que la ligne `Dépendances:` du ticket ne prévoit pas : la prévoir dans le ticket ».
- `skills/monorepo/socle-tests/SKILL.md`, ligne 25 : « demander avant : le hook d'agent le fait aussi » devient « les prévoir sur la ligne `Dépendances:` du ticket : le hook d'agent refuse le reste ».

## Décisions

- `P-19` et `P-20` du produit. Le manifeste dit ce qui est protégé : seuls les dossiers qu'il nomme. Les deux changements du hook vont dans un même ticket : même fichier.
- Le hook ne voit que les outils d'édition (`Edit`, `Write`, `MultiEdit`, `NotebookEdit`) : une copie modifiée par une commande shell lui échappe, comme un index généré. C'est le gate qui la rattrape.
- **Limite acceptée** : si le manifeste lui-même est supprimé par une commande shell, le hook ne refuse plus rien et le gate dit « aucune copie de skills déclarée ». Deux choses le rattrapent hors de ce ticket : la suppression se voit dans le diff de la PR, et la recopie suivante refuse d'écraser des dossiers sans manifeste (code 1 de `scripts/recopier-skills.mjs`).
- L'empreinte est le sha256 des octets du fichier, en hexadécimal : la même que celle de `scripts/recopier-skills.mjs`.
- `skills/chaine/chantier/SKILL.md`, ligne 61, dit déjà « une dépendance hors de cette ligne est un blocage pour la fille, pas un contournement » : elle ne change pas.
- La consigne d'attache par `add_repo`, le signalement de `R/agent/demarrage.mjs`, les gabarits `gitignore`, `eslint` et `prettier` du socle et la version du plugin ne sont pas à ce ticket : ticket 13.
- Aucune dépendance nouvelle.

## Surfaces

| Surface | Preuve |
| --- | --- |
| refus d'éditer la copie | `regles.test.mjs`, toujours avec `skillsRecopies` et `versionSkills` passés : avec `['chantier']` et `'5.0.2'`, `.claude/skills/chantier/SKILL.md` et `.claude/skills/maj-skills.json` rendent le texte du refus, version comprise ; `.claude/skills/parcours-federation/SKILL.md` et `.claude/skills/chantier-bis/x.md` rendent `null` ; avec `[]`, `.claude/skills/chantier/SKILL.md` et `.claude/skills/maj-skills.json` rendent `null` |
| le hook ne demande plus | `grep -n "demander\|soumises à l'humain\|demandent toujours\|demande pour toute\|on demande\|'ask'" skills/chaine/socle-chaine-de-production/references/agent/regles.mjs skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs` ne rend rien ; `permissionDecision` n'apparaît plus que dans le test qui affirme son absence ; `regles.test.mjs` et `garde-commandes.test.mjs` verts |
| le gate `settings-json` | le cas nouveau de `settings-json.test.mjs` |
| le gate de la copie | `skills-recopies.test.mjs` : copie intacte, code 0 ; fichier modifié, supprimé, ou ajouté dans un dossier recopié, code 1 avec le chemin nommé ; skill propre au projet sans effet ; sans manifeste, code 0 ; manifeste invalide, code 1 ; et le test joué dans ce dépôt seulement : après `scripts/recopier-skills.mjs`, code 0 |
| la prose | `grep -rn -i "demande l'accord\|demandent avant\|\*\*demande\*\* avant\|demander avant\|demande confirmation\|on demande\.\|\`) demande\." skills/` ne rend rien |
| le fragment de `CLAUDE.md` | la ligne 10 de `claude-md-fusion.md` contient « refusent », « copie des skills » et « .claude/skills » hors accents graves |

## Vérification

- `pnpm test` vert (398 tests aujourd'hui), sans test retiré ni désactivé. Le motif `'skills/*/*/references/scripts/*/*.test.mjs'` de `package.json` prend déjà le banc du gate : `package.json` ne change pas.
- `skills/chaine/socle-chaine-de-production/SKILL.md` reste sous 200 lignes (`scripts/depot.test.mjs` le contrôle).
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Comments

- 2026-11-14, architecte — Relu par un agent neuf sur l'arbre de `main` après le ticket 11 (verdict « à compléter », dix points) ; ticket réécrit avec les dix points fermés : banc du gate jouable dans un projet, clés du second argument de `refusEdition`, mention sans accents graves dans le fragment, conséquence sur le gate `settings-json`, trois phrases et cinq commentaires oubliés, les deux occurrences de la ligne 68, preuves par `grep` corrigées, numéros de ligne, cas du manifeste, limite du manifeste supprimé.
