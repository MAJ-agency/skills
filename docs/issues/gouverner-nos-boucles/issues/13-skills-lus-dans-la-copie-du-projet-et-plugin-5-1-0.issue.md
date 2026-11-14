# Une session lit les skills de la chaîne dans la copie du projet : plus d'attache par `add_repo`, gabarits du socle prêts pour la copie, plugin 5.1.0

Status: ready-for-agent
Type: feature
Modèle: sonnet
Blocked by: 12
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/tickets/references/gabarits/programme.md`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/monorepo/socle-monorepo/references/racine/gitignore`, `skills/monorepo/socle-monorepo/references/racine/.prettierignore`, `skills/monorepo/socle-monorepo/references/racine/eslint.config.mjs`, `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.mjs`, `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-regles.mjs`, `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.test.mjs`, `skills/monorepo/socle-monorepo/references/CONTENU.md`, `scripts/depot.test.mjs`, `docs/agents/recopie-des-skills.md`, `.claude-plugin/plugin.json`

## Le besoin

`P-20`, conséquence écrite dans la décision : « la consigne d'attache de `skills` par `add_repo` disparaît des gabarits de lancement une fois la copie en place ». La copie est en place : PR 121 de `MAJ-agency/anchorpost`, fusionnée le 2026-11-14 (`develop` à `3b168f2`), dix skills sous `.claude/skills/<nom>/` et le manifeste `.claude/skills/maj-skills.json` en 5.0.2. Claude Code charge un skill commité sous `.claude/skills/<nom>/SKILL.md` comme skill du projet, sans préfixe (journal de la carte, 2026-11-14). Une session lancée sur un projet trouve donc les skills de la chaîne dans son dépôt, plugin installé ou non.

Aujourd'hui, les prompts de lancement, la consigne de la fille (§ 5, étape 5), le skill de l'architecte et le hook de démarrage disent encore d'attacher `MAJ-agency/skills` par `add_repo` ; cette attache a été refusée deux fois le 2026-11-13. Et les gabarits du socle ne sont pas prêts à recevoir la copie : le `.gitignore` l'ignore, `eslint` et `prettier` la lisent, le gate `references-agent` y trouve des références vers d'autres dépôts (51 références cassées dans `anchorpost`, que la PR 121 a dû traiter à la main), décision `A-37`.

Quand le ticket est fait, aucune consigne ne demande plus d'attacher `skills` pour lire un skill : la session lit le plugin s'il est installé, sinon la copie du projet, et s'arrête si elle n'a ni l'un ni l'autre. Le hook de démarrage ne signale plus que ce cas. Un projet posé par le socle 5.1.0 commite la copie, ne la passe ni à `eslint` ni à `prettier`, et son gate `references-agent` ne lit pas les dossiers que le manifeste nomme. Le plugin est en 5.1.0.

## Où

Lignes de `origin/main` à `809d62e` (2026-11-14, plugin 5.0.2), toutes relues. `R` abrège `skills/chaine/socle-chaine-de-production/references`, `M` abrège `skills/monorepo/socle-monorepo/references`.

### 1. La consigne d'attache, réduite aux deux gestes qui ont besoin du dépôt `skills`

Le dépôt `skills` ne sert plus à une session lancée sur un projet que pour deux gestes : **modifier un skill** (interdit dans le projet, `P-22` : il se fait dans une session lancée sur `skills`, `source_url` ce dépôt) et **jouer la commande de copie** (`scripts/recopier-skills.mjs`, pour la première copie d'un projet, `A-37` ; ensuite le workflow s'en charge). La consigne ne disparaît donc pas : elle se réduit à ces deux gestes, en un seul endroit, `lancement.md`. Aucune autre occurrence ne la garde.

Toutes les occurrences, relevées par `git grep -n -i 'add_repo\|attache\|clone' 809d62e -- skills/` puis triées à la lecture :

- **`skills/chaine/architecte/references/lancement.md`**
  - ligne 3 : le paragraphe devient : une session créée par une autre ne reçoit que le dépôt du projet ; les skills de la chaîne y sont quand même, par le plugin si le script de démarrage l'a installé, sinon par la copie du projet sous `.claude/skills/<nom>/` (`docs/agents/recopie-des-skills.md` du dépôt `skills`), que Claude Code charge sans préfixe. Chaque prompt porte deux lignes : **la consigne de lecture** et **le repli** (ni plugin ni copie : la session le dit et s'arrête, sans improviser). Puis une phrase sur les deux gestes ci-dessus : modifier un skill se fait dans une session lancée sur `skills`, jamais dans la copie ; la première copie d'un projet se joue dans une session qui a les deux dépôts (celle de l'architecte, ou une session ouverte par le produit) ; c'est le seul cas où `add_repo` peut encore servir, avec le même repli. La phrase sur les deux refus du 2026-11-13 reste, au passé, comme raison.
  - ligne 13 (prompt du conducteur) devient : « Skills : lis et suis le skill chantier, ses références comprises : /maj-skills:chantier si le plugin est installé, sinon .claude/skills/chantier/SKILL.md du dépôt ; tout skill qu'il invoque (/maj-skills:<nom>) se lit de même, sinon sous .claude/skills/<nom>/. Ni l'un ni l'autre : écris-le-moi (send_message) et arrête-toi, sans rien improviser. »
  - ligne 30 (prompt du capitaine) : la même forme pour `fusionner`.
  - ligne 41 : « un refus d'attache s'y voit » devient « un skill introuvable s'y voit ».
  - ligne 43 : « Un refus d'attache » devient « Un skill introuvable (ni plugin ni copie) ». La ligne 42 (`permission_mode`) ne change pas : la passation la donnait à tort dans la plage 41-42.
- **`skills/chaine/architecte/SKILL.md`**
  - ligne 28 (table « Vérifier l'environnement ») : la ligne « le clone de `MAJ-agency/skills` » devient « les skills de la chaîne » | « `/maj-skills:architecte` parmi les skills, ou `.claude/skills/architecte/SKILL.md` dans un dépôt du programme ; un clone de `skills` seulement si `skills` est sur la ligne `Dépôts:` (ligne précédente) ».
  - ligne 44 : « par refus d'attache » devient « par skill introuvable ».
  - ligne 56 : « il porte **la consigne d'attache des skills** et **le repli** si l'attache est refusée » devient « il porte **la consigne de lecture des skills** (le plugin, sinon la copie du projet) et **le repli** si le skill est introuvable ».
  - ligne 70 (paragraphe « Un refus d'attache ») devient « **Un skill introuvable** » : la session le dit et s'arrête ; l'architecte le note au journal (la date, la session, le dépôt), vérifie que le dépôt est dans `scripts/recopie-projets.json` de `skills` et que sa PR de recopie est fusionnée, le dit au produit, et ne contourne pas (aucune procédure dictée de mémoire). La phrase « La recopie des skills ne se décide que si les refus se répètent » disparaît : elle est décidée (`P-20`).
  - ligne 86 (« Ne jamais ») devient : « Contourner un skill introuvable par une procédure dictée de mémoire, ou modifier la copie des skills de la chaîne dans un projet (`P-22`). »
  - Lignes 10, 19 et 74 (« dans le dépôt `skills`, sa source est … ») : inchangées, elles disent où lire la source quand on travaille dans `skills`.
- **`skills/chaine/architecte/references/CONTENU.md`**, ligne 5 (absente de la passation) : « avec la consigne d'attache des skills, son repli » devient « avec la consigne de lecture des skills (le plugin, sinon la copie du projet), son repli ».
- **`R/docs-agents/chaine-de-production.md`**, ligne 115 (§ 5, étape 5) : de « **Skill absent de la session** » à « du clone, ses références comprises. » devient : « **Skill absent de la session** : sans le plugin, les skills de la chaîne sont dans la copie du projet ; lire et suivre .claude/skills/revue-de-ticket/SKILL.md, ses références comprises. » ; « Si l'attache échoue » devient « Ni plugin ni copie ». Le reste de la ligne ne change pas. **Le chemin s'écrit sans accents graves** : ce fichier est posé dans `docs/agents/` d'un projet, que le gate `references-agent` lit, et un projet qui pose le socle n'a pas encore la copie (même précaution que le ticket 12).
- **`skills/chaine/tickets/references/gabarits/programme.md`**, ligne 50 : « refus d'attache » devient « skill introuvable ».
- **`M/racine/CLAUDE.md`**, ligne 44, dernière phrase (absente de la passation) : « un skill absent de la liste installée se lit dans le dépôt `skills` en attendant la session suivante » devient « un skill de la chaîne absent de la liste installée se lit dans la copie du projet, sous .claude/skills, un socle dans le dépôt `skills` ». Sans accents graves autour de `.claude/skills`, pour la même raison. Le reste de la ligne (le plugin installé depuis le clone de `skills` dans le cloud) ne change pas : il vaut pour les socles, qui ne sont pas copiés.
- **`R/agent/demarrage.mjs`** et son banc : point 2.
- Occurrences lues et **laissées** : `skills/monorepo/socle-monorepo/SKILL.md:77-84` et `README.md:23-30` (installer le plugin dans un environnement cloud : vrai pour les socles) ; `R/admin.md:12` (« le dossier du clone » d'un projet) ; `R/agent/regles.mjs:67` et `regles.test.mjs:18` (le texte du refus d'éditer la copie, ticket 12) ; les clones des bancs (`develop.test.mjs`, `depot-jouet.mjs`…).

### 2. Le signalement du hook de démarrage — `R/agent/demarrage.mjs`

Aujourd'hui (lignes 79 à 83), le hook signale les skills absents dès que `maj-skills@maj` n'est pas dans `~/.claude/plugins/installed_plugins.json`, et prescrit `add_repo`. Avec la copie, ce signalement sonnerait dans toute session de projet sans plugin, alors que les skills y sont.

- `signalementsDemarrage` (lignes 70 à 85) reçoit une clé de plus, `etat.manifesteSkills` : le texte de `.claude/skills/maj-skills.json`, ou `null`. Une fonction pure exportée nouvelle, `copieDeclaree(texte)`, sur le modèle de `pluginInstalle` (lignes 54 à 63) : vrai si le texte est un objet JSON dont `skills` est un tableau non vide de chaînes ; absent, illisible ou autre forme : faux.
- Le hook ne signale que si **ni** `pluginInstalle(etat.pluginsInstalles)` **ni** `copieDeclaree(etat.manifesteSkills)`. Texte : `` `démarrage : skills de la chaîne absents de la session (ni le plugin ${PLUGIN_CHAINE}, ni la copie déclarée par .claude/skills/maj-skills.json) — le dire à qui a lancé la session et s'arrêter, sans contourner ; la copie arrive par la PR de recopie de MAJ-agency/skills (docs/agents/chaine-de-production.md § 5, étape 5)` ``. Plus d'`add_repo`.
- Plugin absent et copie déclarée : aucun signalement. Le hook ne signale que des manques (en-tête, ligne 15) ; la copie est déjà dans la liste des skills de la session. Il ne contrôle pas la copie elle-même : c'est le gate `skills-recopies` (ticket 12).
- L'appel (lignes 136 à 142) passe `manifesteSkills: lireOuNull(join(RACINE, '.claude/skills/maj-skills.json'))`. L'en-tête (lignes 12 à 15) et le commentaire de `signalementsDemarrage` (lignes 65 à 69) le disent.
- `R/agent/regles.test.mjs` : `depotPret` (ligne 216) reçoit `manifesteSkills: null`. Le test de la ligne 234 devient « le démarrage signale les skills de la chaîne absents, ni plugin ni copie, sans add_repo » : pour chaque `pluginsInstalles` du tableau `absents` (ligne 236), avec `manifesteSkills` à `null`, `''`, `'{'`, `'[]'`, `'{"skills":"chantier"}'`, `'{"skills":[]}'` et `'{"skills":[1]}'` (`manifesteSkills` est toujours le texte du fichier, donc une chaîne, ou `null`), un signalement qui contient `skills de la chaîne absents`, `maj-skills.json`, `MAJ-agency/skills` et `§ 5, étape 5`, et ne contient pas `add_repo` (l'assertion de la ligne 241 s'inverse). Un cas nouveau : plugin absent, `manifesteSkills` à `'{"version":"5.1.0","skills":["chantier"]}'`, aucun signalement. Les assertions de `pluginInstalle` (lignes 244, 246, 247) restent ; `copieDeclaree` reçoit les siennes.
- `skills/chaine/socle-chaine-de-production/SKILL.md:35` et `R/CONTENU.md:13` décrivent ce signalement par « les skills de la chaîne absents de la session » : y écrire « les skills de la chaîne absents de la session (ni plugin ni copie déclarée) », le reste de la phrase inchangé. Ces deux lignes ne portent aucun des motifs de la première surface : les relire à la main.

### 3. Le `.gitignore` du socle — `M/racine/gitignore`

Après la ligne 6 (`!.claude/chaine.json`), deux lignes : `# la copie des skills de la chaîne (générée depuis MAJ-agency/skills) et les skills propres au projet sont du dépôt`, puis `!.claude/skills/`. La ligne 2 (`.claude/*`) ne change pas. Sans cette exception, l'étape 6 du workflow de recopie refuse le projet.

### 4. `eslint` et `prettier` — `M/racine/eslint.config.mjs`, `M/racine/.prettierignore`

- `eslint.config.mjs`, bloc `ignores` (lignes 43 à 50) : après `"**/eslint.rules.mjs",` (ligne 49), un commentaire `// copie des skills de la chaîne, générée depuis MAJ-agency/skills : jamais modifiée ici` et `".claude/skills/**",` (forme posée dans `anchorpost` par la PR 121). Un projet réinclut un skill à lui par une négation placée après, `"!.claude/skills/<nom>/**"` : le commentaire le dit.
- `.prettierignore` : entre la ligne 9 (`docs/**/*.html`) et le bloc des fichiers générés (ligne 11, où chaque service ajoute les siens en fin de fichier), un bloc : `# Copie des skills de la chaîne (MAJ-agency/skills) : octets identiques à la source, jamais reformatée.` ; `# Un skill propre au projet se réinclut : !.claude/skills/<nom>/` ; `.claude/skills/*`. La forme `/*` (et non `/`) laisse un projet réinclure un de ses skills par une négation.
- **Limite acceptée**, écrite dans le commentaire d'`eslint` aussi : un skill propre au projet n'est ni lint ni formaté tant que le projet ne le réinclut pas. Il reste modifiable (`P-21` : le hook, le gate et la commande de copie l'ignorent). Le filtrage par le manifeste n'est pas fait ici : `.prettierignore` est statique, et `eslint.config.mjs` ne se joue pas dans ce dépôt (aucune dépendance) ; un contrôle qui protège, lui, passe par le manifeste (point 5).
- `M/CONTENU.md`, ligne 28 (`gitignore`) : la phrase dit aussi que `.claude/skills/` est du dépôt, et que la copie est exclue d'`eslint` et de `prettier`.

### 5. Le gate `references-agent` — `M/scripts/verify/references-agent*.mjs`

Le gabarit existe : `references-agent.mjs` lit tout `.claude/skills/**/*.md` suivi (ligne 48) et y vérifie chaque chemin cité contre `git ls-files`. La copie cite les chemins du dépôt `skills` (`skills/chaine/...`) : d'où les 51 références cassées d'`anchorpost`.

- `references-agent-regles.mjs` : deux fonctions pures exportées. `skillsDuManifeste(texte)` : les noms de `skills` du manifeste (les chaînes seulement), `[]` si le texte est `null`, illisible ou sans tableau `skills`. `horsDeLaCopie(fichier, noms)` : faux pour `.claude/skills/<nom>/…` quand `<nom>` est dans `noms`, vrai sinon (un dossier de `.claude/skills/` que le manifeste ne nomme pas est lu).
- `references-agent.mjs` : le manifeste est lu à `join(ROOT, '.claude/skills/maj-skills.json')` (absent : `null`) ; le filtre de `lus` (lignes 43 à 51) garde `horsDeLaCopie(f, noms)`. `skillExiste` (ligne 78) ne change pas : un skill de la copie reste une commande connue. L'en-tête (lignes 10 et 11) dit que les dossiers nommés par le manifeste ne sont pas lus, et pourquoi.
- `references-agent.test.mjs` : un test des deux fonctions (manifeste absent, illisible, `skills` qui n'est pas un tableau, entrées non chaînes ; `chantier` nommé : `.claude/skills/chantier/SKILL.md` hors lecture, `.claude/skills/propre/SKILL.md` et `.claude/skills/chantier-bis/x.md` lus). Et un test de coquille, avec `jouet` et `gate` (lignes 165 à 181) : `.claude/skills/maj-skills.json` qui nomme `chantier`, `.claude/skills/chantier/SKILL.md` et `.claude/skills/propre/SKILL.md` qui citent tous deux `` `scripts/verify/absent.mjs` `` ; code 1, seul `propre` est nommé. Sans le manifeste, les deux sont nommés.
- `M/CONTENU.md`, ligne 59 : une phrase dit que la copie déclarée par le manifeste n'est pas lue.
- **`budget-contexte.mjs`** (lignes 172 à 184) compte les `SKILL.md` de tout `.claude/skills/`, copie comprise : **il ne change pas**. Chaque `SKILL.md` de la copie tient déjà en 200 lignes dans ce dépôt (`scripts/depot.test.mjs:47` ; le plus long, `anchorpost`, en fait 142), et un skill propre au projet doit rester compté.

### 6. La version — `.claude-plugin/plugin.json`

Ligne 3 : `"version": "5.1.0"` (mineure : gabarits et comportement du hook de démarrage changés, `README.md:180`). Aucun autre fichier ne la répète : `marketplace.json` n'a pas de version, et `5.0.2` dans `regles.test.mjs:6,18` et `skills-recopies.test.mjs:31` est une donnée de test, qui ne change pas.

**À savoir :** le push sur `main` qui fusionnera ce ticket touche `.claude-plugin/plugin.json` et déclenche donc `.github/workflows/recopier-skills.yml`. Si le secret `RECOPIE_TOKEN` existe, c'est son premier passage réel : il ouvre la PR de recopie 5.1.0 sur `anchorpost`, et le job d'`iroki-monorepo` échoue à l'étape « Refuser un projet qui ignore .claude/skills/ » tant que sa première copie n'est pas faite (`fail-fast: false` : `anchorpost` n'en dépend pas). Sans le secret, le workflow échoue à sa première étape (« jeton d'écriture absent »). **Ni l'un ni l'autre n'est un échec du ticket** : son passage est suivi par l'architecte.

### 7. Le mode d'emploi — `docs/agents/recopie-des-skills.md`

- Lignes 35 et 36 (liste « Avant sa première copie, un projet ») : un projet posé par le socle 5.1.0 ou plus a déjà l'exception `!.claude/skills/` et les deux exclusions ; un projet plus ancien les ajoute (la ligne garde le texte `!.claude/skills/`, que `scripts/recopier-skills.test.mjs:219` exige). Une puce nouvelle : son gate `references-agent`, s'il en a un, ne lit pas les dossiers que nomme le manifeste (51 références cassées sinon, constat d'`anchorpost`).
- Une phrase nouvelle dans « Ce que la copie n'est pas » ou après : une session lancée sur le projet lit les skills dans la copie ; le dépôt `skills` ne lui sert plus que pour modifier un skill ou jouer la commande de copie.
- La phrase sur `fedora` (ligne 31) ne change pas : un autre ticket s'en charge.

### 8. Le banc du dépôt — `scripts/depot.test.mjs`

Un test nouveau, à la fin (ligne 242) : `M/racine/gitignore` porte `!.claude/skills/` après `.claude/*` ; `M/racine/.prettierignore` porte la ligne `.claude/skills/*` ; `M/racine/eslint.config.mjs` porte `".claude/skills/**"`.

## Décisions

- `P-20` (conséquence sur les gabarits de lancement), `P-21`, `P-22`, `A-33` (seuls les dossiers que nomme le manifeste sont protégés, ou ici exclus d'un contrôle), `A-37` (exclusions avant la première copie).
- **La consigne d'attache se réduit à deux gestes**, écrits une seule fois dans `lancement.md` : modifier un skill (une session sur `skills`, jamais dans la copie) et jouer la commande de copie (une session qui a les deux dépôts). Raison : ce sont les seuls où le contenu du dépôt `skills` sert, et une fille, un conducteur ou un capitaine ne fait ni l'un ni l'autre.
- **Le hook de démarrage signale « ni plugin ni copie », et rien d'autre** : il ne signale que des manques. Il ne compare pas la version de la copie à celle du plugin : la copie suit `main` par le workflow, et le gate `skills-recopies` contrôle son intégrité.
- **`references-agent` filtre par le manifeste ; `eslint` et `prettier` excluent `.claude/skills/` entier** (réinclusion possible pour un skill propre). Raison : le premier est un contrôle de vérité, qui doit continuer de lire un skill propre au projet ; les deux autres sont de la forme, et leurs fichiers de réglage ne lisent pas le manifeste.
- `budget-contexte.mjs` ne change pas (point 5).
- Les noms de commande `/maj-skills:<nom>` cités dans la prose des skills ne changent pas : la consigne de lecture dit où les lire sans le plugin.
- Aucune dépendance nouvelle.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la consigne d'attache retirée | `grep -rn "add_repo" skills/` ne rend que `skills/chaine/architecte/references/lancement.md` (le paragraphe des deux gestes) et `regles.test.mjs` (l'assertion de son absence) ; `grep -rn "refus d'attache\|consigne d'attache\|ttache refusée\|SKILL.md du clone\|dans le clone" skills/chaine/` ne rend rien |
| la consigne de lecture | lecture des lignes 13 et 30 de `lancement.md` : plugin, sinon `.claude/skills/<nom>/SKILL.md`, sinon arrêt |
| le hook de démarrage | `regles.test.mjs` : ni plugin ni copie, un signalement sans `add_repo` ; plugin absent et copie déclarée, aucun ; plugin installé, aucun |
| le `.gitignore`, `eslint`, `prettier` | le test nouveau de `scripts/depot.test.mjs` |
| `references-agent` | `references-agent.test.mjs` : les deux fonctions, et la coquille avec et sans manifeste |
| la prose posée dans un projet | dans `R/docs-agents/chaine-de-production.md` et `M/racine/CLAUDE.md`, aucun chemin sous `.claude/skills` n'est écrit entre accents graves (`git grep` du motif « accent grave suivi de .claude/skills » sur ces deux fichiers ne rend rien, comme à `809d62e`) |
| la version | `.claude-plugin/plugin.json` : `"version": "5.1.0"` |

## Vérification

- `pnpm test` vert (410 tests à `809d62e`), sans test retiré ni désactivé. Les motifs de `package.json` prennent déjà `scripts/depot.test.mjs`, `R/agent/regles.test.mjs` et `M/scripts/verify/references-agent.test.mjs` : `package.json` ne change pas.
- `scripts/depot.test.mjs` contrôle que chaque `SKILL.md` reste sous 200 lignes (`architecte/SKILL.md` en fait 88).
- Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Hors périmètre

- L'entrée de `fedora` dans `scripts/recopie-projets.json`, et la phrase qui la concerne dans `docs/agents/recopie-des-skills.md` : lot de `fedora` (`P-22`, `A-39` à `A-41`).
- Le point d'extension de `sujet.sh` qui appelle un script du projet (`A-41`).
- Les dépôts de projet : le hook de démarrage, le `.gitignore`, `eslint`, `prettier` et `references-agent` d'`anchorpost`, d'`iroki-monorepo` et de `fedora` ne sont pas touchés ici. La recopie ne met à jour que `.claude/skills/` ; le report de `demarrage.mjs` dans `scripts/agent/` d'un projet est un ticket de ce projet.

## Comments
- 2026-11-14 — Relu par un agent neuf : « prêt », aucun bloquant. Trois précisions reportées par l'architecte : deux fichiers ajoutés (`socle-chaine-de-production/SKILL.md:35`, `R/CONTENU.md:13`), les valeurs de `manifesteSkills` écrites comme des textes JSON, la forme de la réinclusion pour `eslint`. Vingt fichiers.
