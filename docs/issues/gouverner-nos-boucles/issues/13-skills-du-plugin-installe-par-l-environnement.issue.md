# Les skills de la chaîne viennent du plugin installé par l'environnement

Status: ready-for-agent
Type: feature
Modèle: sonnet
Blocked by: 12
Fichiers chauds: `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `skills/chaine/tickets/references/gabarits/programme.md`, `skills/monorepo/socle-monorepo/SKILL.md`, `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, `README.md`

## Le besoin

Une décision du produit, prise le 2026-11-14, change la façon dont une session trouve les skills de la chaîne.

- **`P-24` : le dépôt `skills` est public.** Le script de l'environnement cloud de chaque projet installe le plugin `maj-skills` depuis GitHub au démarrage de toute session, fille comprise, puis le met à jour : `claude plugin marketplace add MAJ-agency/skills`, `claude plugin install maj-skills@maj`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj`. Avant, cette installation échouait en silence dans toute session qui n'avait pas `skills` parmi ses dépôts ; d'où l'attache par `add_repo`, refusée deux fois le 2026-11-13, puis la copie des skills dans chaque projet (`P-20`), qui tombe. Un projet garde ses propres skills dans `.claude/skills/` (`P-21`, `P-22`) et ne touche jamais à ceux du plugin, qui vivent hors de son dépôt.

Aujourd'hui, les prompts de lancement, la consigne de la fille (§ 5, étape 5), le skill de l'architecte et le hook de démarrage disent d'attacher `MAJ-agency/skills` par `add_repo` et de lire le skill dans un clone ; le `README.md`, le `CLAUDE.md` du gabarit et le skill `socle-monorepo` décrivent un dépôt privé, cloné à côté du projet, installé depuis ce clone.

Quand le ticket est fait, aucune consigne ne parle plus d'attache ni de clone pour lire un skill : le plugin est installé par le script de l'environnement ; une session qui ne l'a pas l'écrit à qui l'a lancée et s'arrête. Le hook de démarrage signale ce manque avec les quatre lignes du script. Les plafonds de session, l'architecte compris, ne bougent pas ici : une autre session les reprend (« Hors périmètre »). La version du plugin ne bouge pas ici : ticket 14.

## Où

Lignes de `origin/main` à `809d62e` (2026-11-14, plugin 5.0.2), toutes relues. `R` abrège `skills/chaine/socle-chaine-de-production/references`, `M` abrège `skills/monorepo/socle-monorepo/references`, `T` abrège `skills/chaine/tickets/references`.

### 1. La consigne d'attache disparaît, remplacée par la consigne de lecture et le repli

La phrase à porter partout où une consigne d'attache existait : **le plugin `maj-skills` est installé par le script de l'environnement ; si le skill n'est pas parmi ceux de la session, elle l'écrit à qui l'a lancée et s'arrête.** Occurrences relevées par `git grep -n -i "add_repo\|attache\|du clone\|dans le clone\|privé" 809d62e -- skills/ docs/agents/ README.md CLAUDE.md`, triées à la lecture (les autres résultats, « rattache », « méthodes privées », la CLI privée d'Anchorpost, la merge queue « sur un dépôt privé » des ADR, sont sans rapport et ne changent pas).

- **`skills/chaine/architecte/references/lancement.md`**
  - ligne 3, le paragraphe entier devient : « Une session créée par une autre ne reçoit que le dépôt du projet. Les skills de la chaîne n'en dépendent plus : le dépôt `MAJ-agency/skills` est public, et le script de l'environnement de chaque projet installe le plugin `maj-skills` depuis GitHub, puis le met à jour, au démarrage de toute session, fille comprise (`P-24`). Chaque prompt porte donc deux choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`) et **le repli** : skill absent de la session, elle l'écrit à qui l'a lancée et s'arrête, sans improviser ; le hook de démarrage signale ce manque. Aucun geste d'une session de projet n'exige plus le dépôt `skills` : il n'y a plus de copie à faire, et modifier un skill se fait dans une session ouverte sur `MAJ-agency/skills`, jamais dans un projet. L'attache par `add_repo`, refusée deux fois le 2026-11-13 par le contrôle automatique des permissions, n'a plus d'objet. » C'est le seul endroit qui le dit.
  - ligne 13 (prompt du conducteur) devient : « Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis /maj-skills:chantier, ses références comprises, et tout skill qu'il invoque. S'il n'est pas parmi tes skills : écris-le-moi (send_message) et arrête-toi, sans rien improviser. »
  - ligne 30 (prompt du capitaine) : la même forme pour `/maj-skills:fusionner`.
  - ligne 41 : « un refus d'attache s'y voit » devient « un skill absent s'y voit ».
  - ligne 43 : « Un refus d'attache » devient « Un skill absent ». La ligne 42 (`permission_mode`) ne change pas.
- **`skills/chaine/architecte/SKILL.md`** (seules ces lignes ; le reste du fichier, plafond compris, est hors périmètre)
  - ligne 28 (table « Vérifier l'environnement ») : « le clone de `MAJ-agency/skills` » | « `skills/chaine/architecte/SKILL.md` lisible dans le clone » devient « les skills de la chaîne » | « `/maj-skills:chantier` et `/maj-skills:fusionner` parmi les skills de la session (le plugin, installé par le script de l'environnement) ». Un clone de `skills` ne se vérifie que si `skills` est sur la ligne `Dépôts:` : la ligne 27 le couvre déjà.
  - ligne 44 : « par refus d'attache » devient « par skill absent ».
  - ligne 56 : « il porte **la consigne d'attache des skills** et **le repli** si l'attache est refusée » devient « il porte **la consigne de lecture des skills** (le plugin installé par le script de l'environnement) et **le repli** si le skill est absent ».
  - ligne 70 devient : « **Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session le dit et s'arrête. L'architecte le note au journal de la carte (la date, la session, le dépôt) et le dit au produit : c'est le script de l'environnement de ce dépôt qui manque ou a échoué (les quatre lignes du `README.md` de `skills`, § « Installer »). Il **ne contourne pas** : ni procédure dictée de mémoire, ni skills du plugin recopiés dans le projet (`P-24`). » (Pas la suite de mots « copie des skills » : la preuve du ticket 14 la cherche.)
  - ligne 86 (« Ne jamais ») devient : « Contourner un skill absent par une procédure dictée de mémoire, ou recopier les skills du plugin dans un projet (`P-24`). »
  - Ligne 33 : **ne change pas.** Sa dernière phrase (la session de suite de l'architecte « ouverte par le produit depuis l'application », parce que `create_session` ne donne qu'un dépôt) tient aux dépôts, pas aux skills : elle reste vraie avec le plugin installé partout. Le reste de la ligne touche au passage de main, hors périmètre.
  - Lignes 10, 19 et 74 (« dans le dépôt `skills`, sa source est … ») : ne changent pas, elles disent où lire la source quand on travaille dans `skills` ; la 74 est de plus dans le § 6, hors périmètre.
- **`skills/chaine/architecte/references/CONTENU.md`**, ligne 5 : « avec la consigne d'attache des skills, son repli » devient « avec la consigne de lecture des skills (le plugin installé par le script de l'environnement), son repli ». Les lignes 3 et 7 ne changent pas.
- **`R/docs-agents/chaine-de-production.md`**, ligne 115 (§ 5, étape 5) : de « **Skill absent de la session** » à « jamais de PR livrée sans revue. » devient : « **Skill absent de la session** : le plugin `maj-skills` est installé par le script de l'environnement, dans toute session, fille comprise. S'il manque, le hook de démarrage le signale : la fille l'écrit à son conducteur (`send_message`) et s'arrête sans réserver le ticket, plutôt que de livrer une PR sans revue. » La phrase « Cas vécu : cinq filles d'une même journée livrées sans revue de ticket. » reste. Aucun chemin sous `.claude/skills` n'y est écrit (le fichier est posé dans `docs/agents/` d'un projet, que le gate `references-agent` lit). Seule cette ligne change dans le fichier.
- **`T/gabarits/programme.md`**, ligne 50 : « refus d'attache » devient « skill absent ». Seule cette ligne change ; le test de `scripts/depot.test.mjs:223` (sections, `Phase:`, `Responsable:`, `Architecte:`) reste vert.
- **`M/racine/CLAUDE.md`**, ligne 44 : point 3.
- **`R/agent/demarrage.mjs`** et son banc : point 2.

### 2. Le hook de démarrage — `R/agent/demarrage.mjs`

Il signale déjà ce qu'il faut : le plugin `maj-skills@maj` absent de `~/.claude/plugins/installed_plugins.json` (lignes 54 à 63, `pluginInstalle`). Seul le remède change. Il ne lit aucun manifeste et n'en lira pas.

- Lignes 79 à 83, le texte devient : `` `démarrage : skills de la chaîne absents de la session (plugin ${PLUGIN_CHAINE} non installé) — le script de l’environnement doit l’installer et le mettre à jour à chaque démarrage : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; claude plugin marketplace update maj ; claude plugin update maj-skills@maj (docs/agents/chaine-de-production.md § 5, étape 5) ; le dire à qui a lancé la session et s’arrêter, sans contourner` ``.
- En-tête, lignes 13 et 14 : « les skills de la chaîne ne sont pas installés dans la session (une session créée par une autre ne reçoit que le dépôt du projet) » devient « le plugin des skills de la chaîne n'est pas installé dans la session (le script de l'environnement ne l'a pas installé) ».
- `R/agent/regles.test.mjs`, test de la ligne 234, renommé « le démarrage signale les skills de la chaîne absents, avec les lignes du script de l'environnement » : pour chaque valeur du tableau `absents` (ligne 236), un signalement qui contient `skills de la chaîne absents`, `claude plugin marketplace add MAJ-agency/skills`, `claude plugin install maj-skills@maj`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj`, `§ 5, étape 5` et `s’arrêter` ; l'assertion de la ligne 241 s'inverse en `assert.doesNotMatch(s[0], /add_repo|clone/)`. Les assertions de `pluginInstalle` (lignes 244, 246, 247) et le test « un dépôt prêt ne signale rien » (ligne 250) restent.
- `skills/chaine/socle-chaine-de-production/SKILL.md:35` et `R/CONTENU.md:13` disent « les skills de la chaîne absents de la session, avec le remède de `chaine-de-production.md` § 5, étape 5 » : toujours vrai, ils ne changent pas.

### 3. Le script de l'environnement, dit partout de la même façon

Les lignes d'installation se lisent, à `809d62e` (`git grep -n "marketplace add" 809d62e`), dans `README.md:9-30`, `skills/monorepo/socle-monorepo/SKILL.md:77-84` et `M/racine/CLAUDE.md:44` ; `R/admin.md:12-14` décrit le script de l'environnement sans elles. Partout : installation depuis GitHub, mise à jour à chaque démarrage, plus de « dépôt privé », plus de clone à côté, plus de condition sur un dossier `skills`. Les quatre lignes, dans cet ordre, chacune suivie de `|| true` dans un script d'environnement (un échec ne doit pas empêcher la session de démarrer ; le hook de démarrage signale alors le plugin absent) :

```bash
claude plugin marketplace add MAJ-agency/skills || true
claude plugin install maj-skills@maj || true
claude plugin marketplace update maj || true
claude plugin update maj-skills@maj || true
```

- **`README.md`** : ligne 9, « Le dépôt est **privé** : il faut un accès en lecture … ou une clé SSH). » devient « Le dépôt est **public** : aucun accès à demander, aucune authentification GitHub pour installer. » Lignes 23 à 30, le paragraphe et son bloc deviennent : « **Dans un environnement cloud** (sessions Claude Code sur claude.ai), le script de configuration de l'environnement de chaque projet installe le plugin depuis GitHub et le met à jour **à chaque démarrage**, dans toute session, celles lancées par une autre comprises : l'image de l'environnement garde la version de son dernier build, et `install` ne touche pas à un plugin déjà présent. » suivi du bloc ci-dessus. Les lignes 11 à 21 (installation locale et mise à jour) ne changent pas, ni le tableau des skills (lignes 86 et 87) ni l'arbre (lignes 164 et 168).
- **`skills/monorepo/socle-monorepo/SKILL.md`**, lignes 77 à 84 : la phrase « Pour la session courante et pour un script de configuration cloud, vérifier ce qui est déjà installé (`claude plugin list`) puis : » reste ; le bloc reçoit, après ses quatre lignes, `claude plugin marketplace update mattpocock`, `claude plugin update mattpocock-skills@mattpocock`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj` ; une phrase après le bloc : « Dans le script de configuration cloud, les huit lignes se jouent à chaque démarrage, chacune suivie de `|| true` : le hook de démarrage de la chaîne signale un plugin absent. »
- **`M/racine/CLAUDE.md`**, ligne 44 : de « ; le dépôt est **privé** » à « toujours à la version du clone. » devient « ; le dépôt est **public** : en local, Claude Code propose de l'installer à l'ouverture du dépôt ; dans le cloud, le script de configuration de l'environnement l'installe depuis GitHub (`claude plugin marketplace add MAJ-agency/skills`, puis `claude plugin install maj-skills@maj`) **et le met à jour à chaque démarrage** (`claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`), dans toute session, celles lancées par une autre comprises. Ces skills vivent hors du dépôt : un projet ne les modifie jamais, il garde les siens sous .claude/skills. » La dernière phrase (« un skill absent de la liste installée se lit dans le dépôt `skills` en attendant la session suivante ») devient « un skill absent de la liste installée attend la session suivante ; s'il manque à une session lancée par une autre, elle l'écrit à qui l'a lancée et s'arrête. » Sans accents graves autour de `.claude/skills` : le gate `references-agent` d'un projet le lirait comme un chemin.
- **`R/admin.md`**, lignes 12 à 14 (case « Environnement cloud Claude Code ») : « `<dépôt>` étant le dossier du clone » devient « `<dépôt>` étant le dossier du dépôt » ; la case reçoit, avant la boucle de la base : « Pour que chaque session, fille comprise, ait les skills de la chaîne, le script installe le plugin depuis GitHub et le met à jour à chaque démarrage : » puis les quatre commandes, une par ligne, avec `|| true`.

## Décisions

- `P-24` (dépôt public, plugin installé par le script de l'environnement, plus de copie), `P-21` et `P-22` (un projet garde ses skills, ne touche jamais à ceux du plugin).
- **Aucun geste d'une session de projet n'exige plus le dépôt `skills`** : écrit une fois, dans `lancement.md`. Modifier un skill se fait dans une session ouverte sur `MAJ-agency/skills`.
- **Le hook signale le plugin absent, et donne les quatre lignes du script** : c'est le seul manque possible désormais ; il ne lit aucun manifeste et ne compare aucune version (le script met à jour à chaque démarrage).
- **Ce ticket ne touche à aucune ligne de plafond ni de passage de main** : dans un fichier qu'il partage avec la session qui reprend les contrôles de session, il ne change que les lignes nommées aux points 1 à 3.
- Aucune dépendance nouvelle. La version ne bouge pas : le ticket 14 la monte une seule fois pour les deux (pratique de `A-1`, tickets 5 à 8), dans le commit qui supprime le workflow de recopie.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la consigne d'attache retirée | `git grep -n "add_repo\|d'attache\|ttache refusée\|du clone\|dans le clone" -- skills/ README.md` ne rend que la ligne `doesNotMatch` de `regles.test.mjs` (dix-huit lignes à `809d62e`) |
| le dépôt public, sans clone | `git grep -n -i "privé" -- README.md skills/monorepo/socle-monorepo/references/racine/CLAUDE.md` ne rend que `README.md:81` (la CLI privée d'Anchorpost, sans rapport) ; `git grep -n 'PWD/skills' -- README.md skills/` ne rend rien |
| les lignes du script | `git grep -n "claude plugin update maj-skills@maj" -- README.md skills/` rend `README.md`, `socle-monorepo/SKILL.md`, `M/racine/CLAUDE.md`, `R/admin.md`, `R/agent/demarrage.mjs` et `regles.test.mjs` |
| le hook de démarrage | `regles.test.mjs` : plugin absent, un signalement avec les quatre lignes, sans `add_repo` ni `clone` ; plugin installé, aucun |
| les plafonds intacts | `git diff origin/main --stat` ne nomme aucun des huit fichiers laissés à l'autre session (« Hors périmètre ») ; `git diff origin/main -- skills/chaine/architecte/SKILL.md` ne touche ni la ligne 3, ni les lignes 33, 39 et 42, ni le § 6 |
| la prose posée dans un projet | dans `R/docs-agents/chaine-de-production.md` et `M/racine/CLAUDE.md`, aucun chemin sous `.claude/skills` entre accents graves (comme à `809d62e`) |

## Vérification

- `pnpm test` vert : **410 tests** à `809d62e` (joué le 2026-11-14 dans un arbre détaché, sans installation : les bancs n'ont aucune dépendance). Ce ticket n'en retire ni n'en ajoute (il réécrit un test de `regles.test.mjs`) : 410 à la fin, plus ceux que la session des plafonds aurait ajoutés si elle a fusionné avant. Aucun test désactivé.
- `scripts/depot.test.mjs` contrôle que chaque `SKILL.md` reste sous 200 lignes (`architecte/SKILL.md` en fait 88 ; ce ticket n'en ajoute aucune).
- Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Hors périmètre

- **Les plafonds et le passage de main de l'architecte, du conducteur et des filles** (`P-25` et la refonte des contrôles de session décidée par le produit le 2026-11-14), menés par une autre session. Pour que les deux ne se croisent pas :
  - fichiers que ce ticket laisse **entièrement intacts** : `skills/chaine/chantier/SKILL.md`, `skills/chaine/chantier/scripts/plafonds.mjs`, `skills/chaine/chantier/scripts/plafonds.test.mjs`, `T/scripts/verify/tickets-regles.mjs`, `T/scripts/verify/tickets.mjs`, `T/scripts/verify/tickets.test.mjs`, `R/chaine.json`, `R/CONTENU.md` ;
  - lignes que ce ticket laisse intactes dans les fichiers qu'il partage avec elle : `skills/chaine/architecte/SKILL.md` lignes 3, 33, 39, 42 et 72 à 80 (le § 6, « Passer la main ») ; `skills/chaine/architecte/references/CONTENU.md` lignes 3 et 7 ; `T/gabarits/programme.md` lignes 3, 16 et 46 ; `R/docs-agents/chaine-de-production.md` lignes 16 et 134 ; `README.md` lignes 86, 87, 164 et 168.
- Le retrait de la mécanique de copie (workflow, commande, manifeste, gate `skills-recopies`, refus d'éditer la copie), le `.gitignore` du gabarit et la version du plugin : ticket 14.
- Les dépôts de projet : le script d'environnement de chacun (réglage du compte, fait par le produit), le retrait de la copie d'`anchorpost` (PR 121), le report du nouveau `demarrage.mjs` dans `scripts/agent/` d'un projet, qui garde sa version posée jusqu'à une nouvelle pose.
- `fedora` : son lot se reprend après `P-24` (ses skills de la chaîne rangés à plat cèdent la place au plugin), par d'autres tickets.
- Le point d'extension de `sujet.sh` qui appelle un script du projet (`A-41`).

## Comments

- 2026-11-14 — Réécrit après `P-24` et `P-25` : la lecture des skills dans une copie du projet (version du matin) n'a plus d'objet ; le ticket couvre la consigne de lecture, le hook de démarrage, le script d'environnement et l'architecte sans plafond ; le retrait de la copie passe au ticket 14. Dix-neuf fichiers.
- 2026-11-14 — L'architecte sans plafond (`P-25`) sort du ticket, et avec lui huit fichiers (`plafonds.mjs` et son banc, `chantier/SKILL.md`, les trois fichiers du gate `tickets`, `R/chaine.json`, `R/CONTENU.md`) et les lignes de plafond des fichiers partagés : le produit confie tous les contrôles de session, plafonds compris, à une autre session, et deux sessions ne modifient pas les mêmes lignes. Fichier renommé (sans « et-architecte-sans-plafond »). Onze fichiers. Relu à `809d62e` : la preuve de l'attache compte dix-huit lignes, non dix-neuf, et « privé » rend encore `README.md:81` (la CLI d'Anchorpost).
