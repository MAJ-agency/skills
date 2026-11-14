# Une session lancée se met à niveau et suit le plugin à jour : le fichier du marketplace fait foi sur le skill chargé, patch du plugin

Status: Fait — PR #83
Type: défaut
Label: contre-revue
Modèle: sonnet — tous les textes à écrire sont donnés ci-dessous, mot pour mot ; le test est donné entier ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/CONTENU.md`, `README.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**Les faits**, établis le 2026-11-14 par quatre sessions réelles lancées par `create_session` dans un environnement cloud dont le script de configuration porte bien les quatre lignes du `README.md` (`claude plugin marketplace add MAJ-agency/skills`, `claude plugin install maj-skills@maj`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj`) :

1. Les sessions démarrent avec le plugin en **5.0.2** alors que `main` est à 7.3.2 : `~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json` dit 5.0.2, le clone du marketplace est au commit de la PR 69, `~/.claude/plugins/cache/maj/maj-skills/` ne contient que `5.0.2`. La session part d'une machine préparée à l'avance (son résultat porte `warm_spare_claimed: true`) : le script de l'environnement n'est pas rejoué à chaque session, contrairement à ce que disent nos documents.
2. Dans la session, `claude plugin marketplace update maj` réussit en 2 secondes (le clone passe à `main`, 7.3.2) et `claude plugin update maj-skills@maj` en moins d'une seconde : « Plugin "maj-skills" updated from 5.0.2 to 7.3.2 for scope user. Restart to apply changes. » Le cache contient alors `5.0.2` et `7.3.2`.
3. **La mise à jour ne prend pas effet dans la session en cours** : un skill invoqué ensuite par l'outil Skill se charge encore depuis `…/cache/maj/maj-skills/5.0.2/…`. Une session cloud ne se redémarre pas.
4. Les **fichiers** du marketplace sont à jour après l'étape 2 : `~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md` se lit avec l'outil de lecture, y compris pour un skill marqué `disable-model-invocation` (lecture réussie, sans refus).
5. Une commande en première ligne du prompt (`/maj-skills:chantier <nom>`) charge bien le skill — dans la version figée au démarrage, 5.0.2 ici — et **tout le reste du prompt arrive dans l'argument du skill** (`ARGUMENTS`), rien de tronqué : l'argument ne vaut pas le seul nom du sujet.
6. L'outil Skill refuse un skill marqué : « Skill maj-skills:fusionner cannot be used with Skill tool due to disable-model-invocation. Ask the user to run /maj-skills:fusionner themselves — it cannot be invoked via the Skill tool. Do not replicate this skill's workflow by other means — it is reserved for explicit user invocation. »
7. Aucun hook `SessionStart` ne met le plugin à jour (ni dans `~/.claude/settings.json`, ni dans un dépôt).
8. **Le remède fonctionne** : une session lancée le même jour avec la consigne (mise à jour du marketplace, skills lus dans leurs fichiers) a suivi le plugin à jour et l'a dit dans son message de fin.
9. Dans un autre environnement cloud dont le script avait été modifié le jour même, une session neuve démarre avec la version courante du plugin : la règle documentée de l'instantané (ci-dessous) se confirme.

**La conséquence.** Un conducteur ou un capitaine lancé avec le gabarit de `skills/chaine/architecte/references/lancement.md` (commande en tête, ticket 21, PR 80) suit un skill vieux de plusieurs versions sans le savoir : scripts qui sautent encore les hooks git, plafonds de session retirés depuis, etc. Une session de ticket qui invoque `revue-de-ticket` ou `revue-adversariale` par l'outil Skill lit la version figée. L'architecte lui-même, ouvert dans le même environnement, lit `lancement.md` dans la version figée.

**Quand le ticket est fait** : chaque bloc de prompt de `lancement.md` porte une ligne « Version : » qui fait noter à la session la version chargée, la fait se mettre à niveau, comparer à la version du marketplace et, si elles diffèrent, lire et suivre le fichier du marketplace (« c'est le fichier du marketplace qui fait foi »), sans l'outil Skill, puis dire à l'architecte la version qu'elle suit ; une ligne « Argument : » dit au conducteur et au capitaine que l'argument reçu est tout le prompt ; l'architecte fait la même vérification pour lui-même ; le `README.md` et `lancement.md` ne disent plus que le plugin se met à jour « à chaque démarrage » ; un test du dépôt le garde.

### Ce que dit la documentation de Claude Code (lue le 2026-11-14)

- Environnements cloud, `https://code.claude.com/docs/en/cloud-environments.md`, § « Environment caching » : « The setup script runs the first time you start a session in an environment. When setup completes within roughly five minutes, Anthropic snapshots the filesystem and reuses that snapshot as the starting point for later sessions. New sessions start with your dependencies, tools, and Docker images already on disk, and skip the setup script step. » ; « The setup script runs again to rebuild the cache when you change the environment's setup script or allowed network hosts, and when the cache reaches its expiry after roughly seven days. » Ni à la reprise d'une machine endormie : « In an Anthropic-hosted environment, the setup script doesn't run when a session's VM is restored after being idle ». Le tableau « Setup scripts vs. SessionStart hooks » : setup script « Before Claude Code launches, skipped when a cached environment exists » ; hook `SessionStart` « After Claude Code launches, on every session including resumed ». **Le fait 1 est donc documenté** : nos textes qui disent « à chaque démarrage » sont faux pour le cloud.
- Chargement des plugins, `https://code.claude.com/docs/en/plugins/loading.md` : « Loaded, in the running session: the plugin set Claude Code loaded at startup or at the last `/reload-plugins`. Changes to settings or to disk don't reach this layer until you run `/reload-plugins` or start a new session. That is why `claude plugin update` ends with `Restart to apply changes.` » ; « Plugins load at session start from `installed_plugins.json` and the cache without using the network. » ; « When you update or uninstall a plugin, Claude Code writes an `.orphaned_at` marker into the previous version directory. It removes that directory in a background cleanup 14 days later, so a session that already loaded the old version keeps running. » ; `installed_plugins.json` « records each install with its `scope`, `installPath`, and `version` » ; `marketplaces/<name>/` « The clone or download of a marketplace added from GitHub ». **Les faits 2 et 3 sont documentés.**
- Page d'installation des plugins, `https://code.claude.com/docs/en/plugins/install.md` (servie aussi sous `discover-plugins`) : « The running session keeps the versions it already loaded. After an update, you see `Plugin updated: <name> · Run /reload-plugins to apply`, and the next session loads the new versions automatically. » ; « Off by default: every other marketplace, including the community marketplace, third-party marketplaces » (l'auto-update ne joue pas pour `maj`).
- Commandes de plugin, `https://code.claude.com/docs/en/plugins/cli-reference.md`, § « /reload-plugins » : « Apply pending plugin changes to the running session without restarting it. Pending changes are plugins you installed, updated, enabled, disabled, or edited on disk since the session started. » : un plugin mis à jour dans la session serait donc bien appliqué par lui ; seul son déclenchement sans humain est inconnu ; § « Sessions without an interactive terminal » : « In those sessions, the command runs only when you type it into the session yourself, such as in the `-p` prompt or the desktop app's prompt box. When it arrives another way, such as through Remote Control or a message relayed from Slack, the command replies `/reload-plugins isn't available over a remote connection in this session.` and reloads nothing. » ; § « plugin update » : « The new version loads in your next session, or after you run `/reload-plugins` in a running one. »
- Page des plugins, `https://code.claude.com/docs/en/plugins` : « Session: plugins load at startup, or when you reload plugins. »

**Ce que la documentation ne dit pas, et reste à prouver** : si `/reload-plugins` peut se déclencher sans humain, par exemple si un prompt de `create_session` dont la première ligne est `/reload-plugins` compte comme « typed into the session yourself » (la page ne nomme pas `create_session` ; un modèle ne tape pas de commande, et la commande n'est qu'en première ligne, déjà prise par celle du rôle) ; que le reste du prompt arrive entier dans l'argument (fait 5, observé, contraire à la page des skills : « Claude Code loads only the first skill, with the rest of the line as its arguments ») ; que `installed_plugins.json` garde, avant `claude plugin update`, la version chargée (documenté pour le chargement, et la forme `plugins['maj-skills@maj'][0].version` est celle relevée sur une machine le 2026-11-14 ; non relevé dans une session de l'environnement). La sonde (§ Vérification) prouve ces points.

## Où

Lignes de `origin/main` à `1748f73` (2026-11-14, plugin 7.4.0). Si `main` a bougé, **la session retrouve chaque endroit par le texte cité**, pas par le numéro de ligne.

Relevé complet (`git grep -n -i "à chaque démarrage\|script de l'environnement\|figée au démarrage\|plugin update\|marketplace update" origin/main -- skills README.md CLAUDE.md`, `CLAUDE.md` absent de ce dépôt), et ce qu'en fait ce ticket :

| Endroit | Ce qu'il dit | Ce ticket |
| --- | --- | --- |
| `README.md:23` | le script « le met à jour **à chaque démarrage**, dans toute session, celles lancées par une autre comprises » | réécrit (point 4) |
| `skills/chaine/architecte/references/lancement.md:3` | le script « puis le met à jour, au démarrage de toute session, fille comprise » ; « trois choses » | réécrit (point 1) |
| `skills/chaine/architecte/references/lancement.md:51` | « le plugin maj-skills est installé par le script de l'environnement » | nuancé (point 1) |
| `skills/chaine/architecte/references/lancement.md:22` | « la première ligne est l'argument du skill » | nuancé (point 1, fait 5) |
| `skills/chaine/architecte/SKILL.md:28` | l'architecte vérifie le plugin installé, pas sa version | complété (point 2) |
| `skills/chaine/architecte/SKILL.md:58` | ce que porte un prompt : commande, repli, consignes | complété (point 2) |
| `skills/chaine/architecte/SKILL.md:73` | « c'est le script de l'environnement de ce dépôt qui manque ou a échoué » | nuancé (point 2) |
| `skills/chaine/architecte/references/CONTENU.md:5` | ce que porte `lancement.md` | complété (point 3) |
| `README.md:16-21`, l'étape 4 de « Ajouter un skill » | mise à jour locale, « puis redémarrer Claude Code » ; la version que compare `claude plugin update` | **inchangés** : justes |
| `skills/chaine/socle-chaine-de-production/references/admin.md:12` | le script « le met à jour à chaque démarrage » | **hors périmètre** (un ticket de suite) |
| `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs:14`, `:81` | « Le script de l'environnement doit l'installer et le mettre à jour à chaque démarrage » (gardé par `regles.test.mjs:228-243`) | **hors périmètre** (un ticket de suite) |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:119` | « installé par le script de l'environnement, dans toute session, fille comprise » ; gabarit d'une fille, `:101-108`, sans mise à niveau | **hors périmètre** (un ticket de suite) |
| `skills/monorepo/socle-monorepo/SKILL.md:90` | « les huit lignes se jouent à chaque démarrage » | **hors périmètre** (un ticket de suite) |
| `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md:42`, `:44` | « et les met à jour à chaque démarrage » ; « La version du plugin est figée au démarrage d'une session » | **hors périmètre** (un ticket de suite) |

Les lignes hors périmètre sont des fichiers que le socle **pose dans un projet** : leur correction n'atteint un projet qu'à sa prochaine pose, et elle va avec le hook de démarrage, dans un ticket de suite (§ Hors périmètre). Ce ticket corrige ce que lisent l'architecte et les sessions qu'il lance, qui se lit dans le plugin même.

### 1. `skills/chaine/architecte/references/lancement.md`

**Ligne 3**, remplacer « le script de l'environnement de chaque projet installe le plugin `maj-skills` depuis GitHub, puis le met à jour, au démarrage de toute session, fille comprise (`P-24`). Chaque prompt porte donc trois choses : **la commande du skill**, **le repli** et **les consignes du produit** (ci-dessous). » par :

```text
le script de l'environnement de chaque projet installe le plugin `maj-skills` depuis GitHub, puis le met à jour (`P-24`). Ce script ne se rejoue pas à chaque session : une session part de l'instantané de son environnement, avec la version du plugin qu'il porte (§ « La mise à niveau »). Chaque prompt porte donc quatre choses : **la commande du skill**, **la mise à niveau**, **le repli** et **les consignes du produit** (ci-dessous).
```

(Le reste de la ligne 3 reste tel quel.)

**Nouvelle section**, insérée entre le paragraphe de la ligne 5 (« Le prompt est court et renvoie : … ») et `## Le conducteur d'un chantier` (ligne 7), précédée et suivie d'une ligne vide :

```text
## La mise à niveau, en tête de toute session lancée

Une session cloud ne joue pas le script de son environnement : elle part d'un instantané du disque pris au dernier passage du script (« New sessions start with your dependencies, tools, and Docker images already on disk, and skip the setup script step », documentation de Claude Code, page des environnements cloud) ; le script ne repasse qu'à un changement du script ou des hôtes autorisés, ou à l'expiration de l'instantané (« after roughly seven days »). Constat du 2026-11-14 : quatre sessions lancées dans un même environnement cloud sont parties avec le plugin en 5.0.2 quand `main` était en 7.3.2. Dans la session, `claude plugin marketplace update maj` puis `claude plugin update maj-skills@maj` réussissent en quelques secondes, mais ne changent pas les skills chargés : « Changes to settings or to disk don't reach this layer until you run `/reload-plugins` or start a new session » (page du chargement des plugins), et `/reload-plugins`, que la documentation dit sans effet quand il n'est pas tapé dans la session par un humain (page des commandes de plugin), n'est pas joué ici : la première ligne du prompt est déjà prise par la commande du rôle. Constaté le même jour : un skill invoqué après la mise à jour par l'outil Skill se charge encore depuis l'ancienne version, alors que les fichiers du marketplace, sous `~/.claude/plugins/marketplaces/maj/`, sont à jour et se lisent avec l'outil de lecture, le `SKILL.md` d'un skill marqué compris ; une session lancée avec cette consigne a suivi le plugin à jour et l'a dit.

D'où la ligne « Version : » de chaque prompt, jouée avant tout autre geste, hors l'installation du repli : la session note la version qu'elle a chargée, se met à niveau, puis lit la version du marketplace. La version chargée fiable est le numéro du dossier de base d'un skill chargé (`…/cache/maj/maj-skills/<version>/…`) ; sans skill chargé, elle se lit dans `~/.claude/plugins/installed_plugins.json`, à l'entrée de portée `user` (sinon la première), avant `claude plugin update`, qui la réécrit ; sur une session reprise, ou qui a déjà joué cette commande, elle peut y être déjà la nouvelle. Un plugin que le repli vient d'installer n'a pas d'écart à relever. Si elles diffèrent, **c'est le fichier du marketplace qui fait foi** : elle lit le `SKILL.md` de son skill et ses références sous `~/.claude/plugins/marketplaces/maj/skills/`, les suit à la place du texte chargé, et lit de même tout skill qu'il invoque, sans l'outil Skill ; les chemins relatifs d'un skill lu ainsi partent de son dossier dans le marketplace. Mise à jour en échec : elle lit quand même la version du marketplace, suit la plus récente des deux, et dit l'échec. Dès cette vérification faite, elle écrit à qui l'a lancée la version qu'elle suit : un écart se voit au premier message. Le gabarit d'une fille (`chaine-de-production.md` § 5) n'a pas encore cette ligne : le conducteur la recopie dans les prompts de ses filles (ligne « Filles : » de son prompt).

La commande en tête reçoit **tout le prompt** comme argument du skill, pas sa seule première ligne : constaté le 2026-11-14 pour `/maj-skills:chantier`, rien de tronqué. La ligne « Argument : » le dit à la session : le nom du sujet d'un conducteur est la première ligne de l'argument, la suite sont ses consignes ; l'argument d'un capitaine n'est ni `poser` ni un numéro de PR.
```

**Bloc du conducteur** (lignes 11-18). Après la ligne « Conducteur du chantier <nom>, programme <programme>, architecte : <session_id de cette session>. », insérer :

```text
Argument : ce prompt entier t'arrive comme argument du skill ; le nom du sujet est sa première ligne seule, la suite sont tes consignes.
```

Après la ligne « Skills : la première ligne de ce prompt charge le skill chantier ; … sans rien improviser. », insérer ces deux lignes :

```text
Version : avant tout autre geste, hors l'installation de la ligne « Skills : », note la version chargée : le numéro du dossier de base du skill chargé (…/cache/maj/maj-skills/<version>/…), la seule fiable ; sans skill chargé, `node -p "try { const e = require(process.env.HOME + '/.claude/plugins/installed_plugins.json').plugins['maj-skills@maj'] || []; (e.find((x) => x.scope === 'user') || e[0]).version } catch { 'absent' }"` (l'entrée de portée user, sinon la première ; sur une session reprise, ou qui a déjà joué `claude plugin update`, elle peut déjà donner la nouvelle version). Si le plugin vient d'être installé par ce repli, il n'y a pas d'écart à relever : tu suis déjà le fichier du marketplace. Sinon, joue `claude plugin marketplace update maj` puis `claude plugin update maj-skills@maj` ; lis la version de ~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json (`node -p "try { require(process.env.HOME + '/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json').version } catch { 'absent' }"`). Si elles diffèrent, c'est le fichier du marketplace qui fait foi : lis ~/.claude/plugins/marketplaces/maj/skills/chaine/chantier/SKILL.md et ses références avec ton outil de lecture et suis-les à la place du texte chargé ; tout skill qu'il invoque, lis-le de même sous ~/.claude/plugins/marketplaces/maj/skills/<groupe>/<nom>/SKILL.md, sans l'outil Skill, qui rendrait l'ancienne version. Si la mise à jour échoue, lis quand même la version du marketplace : si elle est plus récente que la version chargée, suis-la ; sinon suis le texte chargé ; dans les deux cas, dis dans ton message que la mise à jour a échoué. Dès cette vérification faite, écris-moi (send_message) en une ligne la version que tu suis, celle chargée et celle du marketplace.
Filles : tant que docs/agents/chaine-de-production.md § 5 n'a pas de ligne « Version : », recopie dans le prompt de chaque fille la ligne « Version : » du prompt d'une session de ticket, lue dans ~/.claude/plugins/marketplaces/maj/skills/chaine/architecte/references/lancement.md, « moi » y désignant toi.
```

Les autres lignes du bloc ne changent pas ; la première reste `/maj-skills:chantier <nom du sujet, sans le préfixe sujet/>`.

**Liste sous ce bloc**, ligne 22 : remplacer le début « - la première ligne est l'argument du skill (`chantier/SKILL.md` § 0, point 1) : » par le texte ci-dessous ; la suite de la puce (« le nom du sujet, sans `sujet/`, … ») ne change pas :

```text
- la première ligne porte l'argument du skill (`chantier/SKILL.md` § 0, point 1 ; le skill reçoit tout le prompt comme argument, et la ligne « Argument : » le dit au conducteur) :
```

**Bloc du capitaine** (lignes 31-37). Après la ligne « Capitaine de fusion du dépôt <dépôt>, programme <programme>, architecte : <session_id de cette session>. », insérer :

```text
Argument : ce prompt entier t'arrive comme argument du skill ; il n'est ni `poser` ni un numéro de PR : ce sont tes consignes.
```

Après la ligne « Skills : la première ligne de ce prompt charge le skill fusionner ; … sans rien improviser. », insérer :

```text
Version : avant tout autre geste, hors l'installation de la ligne « Skills : », note la version chargée : le numéro du dossier de base du skill chargé (…/cache/maj/maj-skills/<version>/…), la seule fiable ; sans skill chargé, `node -p "try { const e = require(process.env.HOME + '/.claude/plugins/installed_plugins.json').plugins['maj-skills@maj'] || []; (e.find((x) => x.scope === 'user') || e[0]).version } catch { 'absent' }"` (l'entrée de portée user, sinon la première ; sur une session reprise, ou qui a déjà joué `claude plugin update`, elle peut déjà donner la nouvelle version). Si le plugin vient d'être installé par ce repli, il n'y a pas d'écart à relever : tu suis déjà le fichier du marketplace. Sinon, joue `claude plugin marketplace update maj` puis `claude plugin update maj-skills@maj` ; lis la version de ~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json (`node -p "try { require(process.env.HOME + '/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json').version } catch { 'absent' }"`). Si elles diffèrent, c'est le fichier du marketplace qui fait foi : lis ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md et ses références avec ton outil de lecture et suis-les à la place du texte chargé ; tout skill qu'il invoque, lis-le de même sous ~/.claude/plugins/marketplaces/maj/skills/<groupe>/<nom>/SKILL.md, sans l'outil Skill, qui rendrait l'ancienne version. Si la mise à jour échoue, lis quand même la version du marketplace : si elle est plus récente que la version chargée, suis-la ; sinon suis le texte chargé ; dans les deux cas, dis dans ton message que la mise à jour a échoué. Dès cette vérification faite, écris-moi (send_message) en une ligne la version que tu suis, celle chargée et celle du marketplace.
```

**Ligne 39**, la phrase « Ce prompt-là ne commence pas par `/maj-skills:fusionner` et n'a pas de ligne « Skills : » : le skill chargé contredirait la procédure donnée. » devient :

```text
Ce prompt-là ne commence pas par `/maj-skills:fusionner` et n'a ni ligne « Argument : », ni ligne « Skills : », ni ligne « Version : » : le skill chargé contredirait la procédure donnée.
```

**Bloc de la session d'un ticket** (lignes 49-56). La ligne 51, de « Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis » à la fin, devient :

```text
Skills : le plugin maj-skills est installé par le script de l'environnement, dans la version de son instantané ; lis et suis tout skill que le ticket ou docs/agents/chaine-de-production.md § 5 invoque (/maj-skills:revue-de-ticket à l'étape de la revue). S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis le skill sous ~/.claude/plugins/marketplaces/maj/skills/chaine/<nom du skill>/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
```

et, juste après elle, insérer :

```text
Version : avant tout autre geste, hors l'installation de la ligne « Skills : », note la version chargée : `node -p "try { const e = require(process.env.HOME + '/.claude/plugins/installed_plugins.json').plugins['maj-skills@maj'] || []; (e.find((x) => x.scope === 'user') || e[0]).version } catch { 'absent' }"` (l'entrée de portée user, sinon la première ; sur une session reprise, ou qui a déjà joué `claude plugin update`, elle peut déjà donner la nouvelle version). Si le plugin vient d'être installé par ce repli, il n'y a pas d'écart à relever : tu suis déjà le fichier du marketplace. Sinon, joue `claude plugin marketplace update maj` puis `claude plugin update maj-skills@maj` ; lis la version de ~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json (`node -p "try { require(process.env.HOME + '/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json').version } catch { 'absent' }"`). Si elles diffèrent, c'est le fichier du marketplace qui fait foi : tout skill que tu dois suivre (/maj-skills:revue-de-ticket compris), lis-le sous ~/.claude/plugins/marketplaces/maj/skills/<groupe>/<nom>/SKILL.md avec ton outil de lecture, ses références comprises, et suis-le, sans l'outil Skill, qui rendrait l'ancienne version. Si la mise à jour échoue, lis quand même la version du marketplace : si elle est plus récente que la version chargée, suis-la ; sinon suis le texte chargé ; dans les deux cas, dis dans ton message que la mise à jour a échoué. Dès cette vérification faite, écris-moi (send_message) en une ligne la version que tu suis, celle chargée et celle du marketplace.
```

**Après le lancement**, insérer avant la puce « - Un skill absent : la ligne au journal, … » (ligne 78) :

```text
- Le premier message de la session dit la version qu'elle suit (ligne « Version : ») ; s'il ne la dit pas, ou s'il dit suivre une version plus ancienne que celle du marketplace sans en avoir lu les fichiers, l'architecte le note au journal et lui répond de jouer sa ligne « Version : ».
```

### 2. `skills/chaine/architecte/SKILL.md` (106 lignes, autant après)

**Ligne 28**, la cellule de droite de la ligne « les skills de la chaîne » devient (la colonne de gauche ne change pas) :

```text
le plugin `maj-skills` installé : le hook de démarrage ne le signale pas absent, et `test -f ~/.claude/plugins/marketplaces/maj/skills/chaine/chantier/SKILL.md` réussit. `chantier` et `fusionner` n'apparaissent jamais dans la liste des skills d'une session (`disable-model-invocation: true`) : ils ne se chargent que par leur commande en première ligne d'un prompt (`references/lancement.md`). Absent, l'architecte installe le plugin lui-même par les commandes de `references/lancement.md`, puis le dit au produit. Présent, il vérifie aussi sa propre version, avant de lire `references/lancement.md` : celle du skill chargé (le numéro de son dossier de base, `…/cache/maj/maj-skills/<version>/…`) contre celle de `~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json`, lue après `claude plugin marketplace update maj` et `claude plugin update maj-skills@maj` ; si elles diffèrent, c'est le fichier du marketplace qui fait foi : l'architecte lit et suit `~/.claude/plugins/marketplaces/maj/skills/chaine/architecte/SKILL.md` et ses références, `lancement.md` compris, et le dit au produit
```

**Ligne 58**, insérer devant « **le repli** si elle n'a rien chargé » :

```text
**la mise à niveau** (une session part de l'instantané de son environnement : si la version chargée diffère de celle du marketplace, c'est le fichier du marketplace qui fait foi),
```

suivi d'une espace (la phrase devient « … seule avec ses arguments (…), **la mise à niveau** (…), **le repli** si elle n'a rien chargé … »).

**Ligne 73**, remplacer « c'est le script de l'environnement de ce dépôt qui manque ou a échoué (les quatre lignes du `README.md` de `skills`, § « Installer »). » par :

```text
c'est le script de l'environnement de ce dépôt qui manque, a échoué, ou n'a pas repassé depuis qu'il porte l'installation (instantané plus ancien que lui ; les quatre lignes du `README.md` de `skills`, § « Installer »).
```

Aucun texte ajouté ne nomme `/maj-skills:architecte`, `/maj-skills:chantier` ni `/maj-skills:fusionner` : le test « aucun SKILL.md ne demande la commande d'un skill marqué… » (ticket 21) le refuserait.

### 3. `skills/chaine/architecte/references/CONTENU.md`

Ligne 5, insérer après « avec la commande du skill en première ligne (`chantier` et `fusionner` ne se chargent pas autrement), » :

```text
la mise à niveau (une session part de l'instantané de son environnement ; si la version chargée diffère de celle du marketplace, le fichier du marketplace fait foi)
```

(la virgule et « son repli (installer soi-même le plugin, … » suivent sans changement).

### 4. `README.md`

Ligne 23, le paragraphe « **Dans un environnement cloud** … `install` ne touche pas à un plugin déjà présent. » devient :

```text
**Dans un environnement cloud** (sessions Claude Code sur claude.ai), le script de configuration de l'environnement de chaque projet installe le plugin depuis GitHub et le met à jour. Il ne se rejoue pas à chaque session : l'environnement garde un instantané du disque pris à son dernier passage, et toute session, celles lancées par une autre comprises, part de cet instantané, avec la version du plugin qu'il porte ; le script ne repasse qu'à un changement du script ou des hôtes autorisés, ou à l'expiration de l'instantané (environ sept jours, documentation de Claude Code, page des environnements cloud). Une mise à jour jouée dans la session change les fichiers du marketplace, pas les skills déjà chargés : une session lancée par l'architecte se met à niveau en tête de son prompt (`skills/chaine/architecte/references/lancement.md`, § « La mise à niveau »). `install` ne touche pas à un plugin déjà présent.
```

Le bloc des quatre lignes qui suit (lignes 25-30) ne change pas : le script les joue bien, à chaque construction de l'instantané. Le ticket 19, livré (PR 82, plugin 7.4.0), y a ajouté une phrase de prérequis avant `## Ajouter un skill` : autre endroit, sans effet sur celui-ci.

### 5. `scripts/depot.test.mjs` : le test, écrit d'abord et vu rouge

À la fin du fichier, après le bloc du ticket 21, ajouter ce bloc. Il réutilise `blocsTexte`, `lignes`, `LANCEMENT`, `RACINE`, `readFileSync`, `join`, déjà définis.

```js
// Une session part de l'instantané de son environnement, avec la version du plugin qu'il porte, et une
// mise à jour en cours de session ne recharge pas ses skills (documentation de Claude Code, pages des
// environnements cloud et du chargement des plugins) : chaque prompt de lancement fait se mettre à
// niveau la session, et le fichier du marketplace fait foi quand les versions diffèrent.
const MISE_A_NIVEAU = [
  "claude plugin marketplace update maj",
  "claude plugin update maj-skills@maj",
  "~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json",
  "c'est le fichier du marketplace qui fait foi",
  "sans l'outil Skill",
  "la version que tu suis",
];
const blocsPrompt = (texte) => blocsTexte(texte).filter((b) => b.includes("architecte : <session_id de cette session>"));
const manquesMiseANiveau = (bloc) => MISE_A_NIVEAU.filter((m) => !bloc.includes(m));
const DIT_A_CHAQUE_DEMARRAGE = /à chaque démarrage|au démarrage de toute session/;
const TEXTES_DE_LANCEMENT = ["README.md", LANCEMENT, "skills/chaine/architecte/SKILL.md", "skills/chaine/architecte/references/CONTENU.md"];

test("lecteurs de la mise à niveau : entrées piégées", () => {
  const deuxBlocs = "```text\nConducteur, architecte : <session_id de cette session>.\n```\n```text\nLe produit : « … »\n```\n";
  assert.deepEqual(blocsPrompt(deuxBlocs), ["Conducteur, architecte : <session_id de cette session>.\n"], "le bloc des consignes du produit n'est pas un prompt");
  assert.deepEqual(manquesMiseANiveau(MISE_A_NIVEAU.join(" ; ")), []);
  assert.deepEqual(manquesMiseANiveau("claude plugin marketplace update maj"), MISE_A_NIVEAU.slice(1));
  assert.deepEqual(manquesMiseANiveau("C'est le fichier du marketplace qui fait foi"), MISE_A_NIVEAU, "la phrase exacte, casse comprise");
  assert.equal(DIT_A_CHAQUE_DEMARRAGE.test("le met à jour à chaque démarrage"), true);
  assert.equal(DIT_A_CHAQUE_DEMARRAGE.test("puis le met à jour, au démarrage de toute session"), true);
  assert.equal(DIT_A_CHAQUE_DEMARRAGE.test("ce script ne se rejoue pas à chaque session"), false);
});

test("chaque prompt de lancement fait se mettre à niveau la session, et le fichier du marketplace fait foi", () => {
  const blocs = blocsPrompt(readFileSync(join(RACINE, LANCEMENT), "utf8"));
  assert.equal(blocs.length, 3, `${LANCEMENT} : trois blocs de prompt (conducteur, capitaine, session de ticket)`);
  const fautes = blocs.flatMap((b, i) => manquesMiseANiveau(b).map((m) => `bloc ${i + 1} : « ${m} » absent`));
  assert.deepEqual(fautes, [], `${LANCEMENT} : ${fautes.join(" ; ")}`);
});

test("aucun texte de lancement n'affirme que le plugin se met à jour à chaque démarrage de session", () => {
  const fautes = TEXTES_DE_LANCEMENT.flatMap((f) =>
    lignes(readFileSync(join(RACINE, f), "utf8")).flatMap((l, i) => (DIT_A_CHAQUE_DEMARRAGE.test(l) ? [`${f}:${i + 1}`] : [])),
  );
  assert.deepEqual(fautes, [], `une session part de l'instantané de son environnement : ${fautes.join(" ; ")}`);
});
```

Les prompts se reconnaissent à la ligne d'identité que portent les trois (« architecte : <session_id de cette session> ») : le quatrième bloc `text` de `lancement.md`, les consignes du produit, n'est pas un prompt. `TEXTES_DE_LANCEMENT` nomme les quatre fichiers que ce ticket écrit ; le ticket de suite y ajoutera ceux du socle.

**Vu rouge par le rédacteur**, le 2026-11-14, dans une copie jetable de `1748f73` (dépôt git initialisé, bloc ajouté seul) : « lecteurs de la mise à niveau » vert ; « chaque prompt de lancement fait se mettre à niveau… » rouge, `bloc 1 : « claude plugin marketplace update maj » absent ; …` (six manques par bloc, trois blocs) ; « aucun texte de lancement n'affirme… » rouge, `README.md:23 ; skills/chaine/architecte/references/lancement.md:3`. Puis, avec les points 1 à 4 appliqués : les 20 tests du fichier verts, et `npm test` entier vert. La session rejoue cet ordre : test d'abord, rouge vu et noté dans la PR, puis les textes.

### 6. La version — `.claude-plugin/plugin.json`

Règle du `README.md` (« Ajouter un skill », étape 4, « Patch pour une correction ») : un correctif des gabarits, donc **le correctif qui suit la version de `origin/main` à l'ouverture de la PR**, lue par `git show origin/main:.claude-plugin/plugin.json` juste avant le dernier commit. Le numéro et l'objet entrent dans le titre de la PR.

## Décisions

- **La commande reste en tête** : c'est elle qui donne le rôle (ticket 21). La mise à niveau ne la remplace pas ; elle décide seulement quel texte la session suit.
- **Le fichier du marketplace fait foi quand les versions diffèrent**, plutôt qu'un rechargement : `/reload-plugins` ne se joue que tapé par un humain (documentation), la première ligne est déjà prise par la commande du rôle, et une session cloud ne redémarre pas. La lecture du fichier est le seul geste prouvé (faits 4 et 6).
- **La version chargée se lit avant la mise à jour** : dans le dossier de base du skill chargé (`…/cache/maj/maj-skills/<version>/…`, fait 3), la seule fiable ; ou, sans skill chargé (session de ticket), dans `installed_plugins.json`, que `claude plugin update` réécrit ensuite, à l'entrée de portée `user`, sinon la première (un plugin peut y avoir une entrée par portée). Sur une session reprise, ou qui a déjà joué `claude plugin update`, ce fichier peut déjà donner la nouvelle version : la ligne le dit. La commande sort `absent` au lieu de planter quand le plugin manque ; un plugin que le repli vient d'installer n'a pas d'écart à relever. La version du marketplace se lit dans son `plugin.json`, après `claude plugin marketplace update maj`. Les deux commandes de mise à jour se jouent : la première rafraîchit les fichiers que la session lit, la seconde sert une session suivante sur la même machine (une session reprise, un conteneur gardé).
- **Les skills invoqués se lisent aussi**, sans l'outil Skill : l'outil rend la version chargée (fait 3). Le chemin donne le groupe (`skills/<groupe>/<nom>/SKILL.md`) : `socle-tests` est sous `monorepo`, `revue-de-ticket` sous `chaine`.
- **Mise à jour en échec** (réseau, marketplace absent) : la session lit quand même la version du marketplace, suit la plus récente des deux, et dit l'échec dans son message. S'arrêter bloquerait tout lancement hors ligne ; l'architecte, qui lit la version suivie, décide. La ligne « Version : » de chaque bloc l'écrit, pas seulement la section.
- **Le premier message dit la version, dès la vérification**, en une ligne : un conducteur peut ne rien écrire avant son découpage. Le coût est un `send_message` par session ; il rend l'écart visible au journal.
- **La ligne « Argument : »** dit à la session ce que la documentation ne dit pas et que le fait 5 montre : l'argument est tout le prompt. Sans elle, `chantier/SKILL.md` § 0, point 1 (« argument = nom de sujet ») chercherait une branche au nom d'un paragraphe, et `fusionner` pourrait lire ses consignes comme un argument (`poser | [numéro de PR]`).
- **L'architecte se vérifie lui-même** (point 2, ligne 28) : ouvert dans le même environnement, il lit `lancement.md` dans la version figée, et écrirait des prompts sans la ligne « Version : ».
- **Le hook de démarrage ne joue pas la mise à jour dans ce ticket** : instruit au § Hors périmètre, renvoyé à un ticket de suite.
- **Jusqu'au ticket de suite, les fichiers que le socle pose dans les projets répètent « à chaque démarrage »** ; pour une session lancée par l'architecte, le prompt fait foi.
- **Le gabarit d'une fille** (`chaine-de-production.md` § 5) n'a pas encore la ligne « Version : » ; d'ici là, le conducteur la recopie dans les prompts de ses filles : c'est la ligne « Filles : » de son prompt.

## Surfaces

Six fichiers, aucun créé.

| Surface | Point | Preuve |
| --- | --- | --- |
| `skills/chaine/architecte/references/lancement.md` | 1 | `scripts/depot.test.mjs` « chaque prompt de lancement fait se mettre à niveau la session, et le fichier du marketplace fait foi » ; `scripts/depot.test.mjs` « aucun texte de lancement n'affirme que le plugin se met à jour à chaque démarrage de session » ; `scripts/depot.test.mjs` « chaque prompt de lancement qui nomme un skill marqué commence par sa commande » (ticket 21, reste vert) |
| `skills/chaine/architecte/SKILL.md` | 2 | `scripts/depot.test.mjs` « aucun SKILL.md ne demande la commande d'un skill marqué, que le modèle ne peut pas invoquer » (reste vert) ; `scripts/depot.test.mjs` « aucun SKILL.md ne dépasse 200 lignes » (reste vert) ; relecture pour le texte |
| `skills/chaine/architecte/references/CONTENU.md` | 3 | relecture (texte seul) |
| `README.md` | 4 | `scripts/depot.test.mjs` « aucun texte de lancement n'affirme que le plugin se met à jour à chaque démarrage de session » |
| `scripts/depot.test.mjs` | 5 | `scripts/depot.test.mjs` « lecteurs de la mise à niveau : entrées piégées » |
| `.claude-plugin/plugin.json` | 6 | relecture (version) |

Fichiers partagés avec d'autres tickets : `README.md` et `.claude-plugin/plugin.json` avec le ticket 19, livré (PR 82, plugin 7.4.0) : la session part d'un `main` qui l'a. Aucun ticket en cours ne partage un fichier avec celui-ci.

## Vérification

Critères, chacun vérifiable par une commande depuis la racine du dépôt :

- `pnpm test` vert : le compte de `origin/main` à l'ouverture de la PR plus 3, aucun test retiré, sauté ou assoupli (le test des sauts de hook lit `git ls-files` : jouer dans un dépôt git).
- `node --test scripts/depot.test.mjs` : les trois tests nouveaux, vus rouges avant les textes (point 5), verts après ; les 17 autres verts.
- `grep -c "^Version : avant tout autre geste" skills/chaine/architecte/references/lancement.md` rend `3`.
- `grep -c "^Argument : ce prompt entier" skills/chaine/architecte/references/lancement.md` rend `2`.
- `grep -c "^Filles : " skills/chaine/architecte/references/lancement.md` rend `1`.
- `grep -c "c'est le fichier du marketplace qui fait foi" skills/chaine/architecte/references/lancement.md` rend `4` (les trois lignes « Version : » et la section « La mise à niveau »).
- `grep -n "^/maj-skills:" skills/chaine/architecte/references/lancement.md` rend toujours exactement deux lignes, `/maj-skills:chantier <nom du sujet, sans le préfixe sujet/>` et `/maj-skills:fusionner`.
- `git grep -n "à chaque démarrage\|au démarrage de toute session" -- README.md skills/chaine/architecte` ne rend rien.
- `wc -l < skills/chaine/architecte/SKILL.md` rend `106`.
- `git diff --stat origin/main` ne nomme que les six fichiers des Surfaces.
- Le dépôt n'a ni gate des tickets ni `commitlint` : le reste se contrôle à la relecture.

**La sonde de l'architecte, après la fusion** (seule une session réelle prouve ce qui suit ; ni rédacteur ni session de ticket ne lancent de session). L'environnement garde son instantané : les sessions de la sonde partiront sans doute d'une version plus ancienne que `main`, ce qui est le cas à prouver. Avant de lancer, l'architecte joue lui-même sa vérification (point 2) et lit `lancement.md` dans le marketplace. Deux `create_session` sur `MAJ-agency/skills`, branche `main`, `permission_mode` `"auto"`, tag `role:sonde`, archivées aussitôt relevées :

1. **Conducteur** : le bloc du conducteur tel que ce ticket l'écrit, première ligne `/maj-skills:chantier sonde-23`, une ligne de situation « Sonde : joue seulement les lignes « Argument : » et « Version : », puis réponds par send_message et arrête-toi : la première ligne de ton argument, la version du skill chargé, celle du marketplace, la version que tu suis, et le titre de la section de ~/.claude/plugins/marketplaces/maj/skills/chaine/architecte/references/lancement.md qui commence par « ## La mise ». » Prouve : la ligne « Version : » se joue, la version chargée et celle du marketplace se lisent, le fichier du marketplace se lit (le titre n'existe que dans la version de ce ticket), l'argument se lit par sa première ligne (`sonde-23`).
2. **Session de ticket** : le bloc de la session d'un ticket, ligne « Ticket : » remplacée par « Sonde : joue seulement la ligne « Version : », puis lis le skill revue-de-ticket comme elle le dit, sans l'outil Skill, et réponds par send_message : la version chargée selon installed_plugins.json, celle du marketplace, la version que tu suis, et le titre de premier niveau du SKILL.md lu ; puis arrête-toi. » Prouve : sans skill chargé, `installed_plugins.json` donne la version chargée avant la mise à jour (la valeur attendue est celle du dossier `cache/` le plus ancien), et un skill non marqué se lit dans le marketplace.

Une sonde facultative, si l'architecte veut savoir s'il existe un chemin plus court : une troisième session dont la première ligne est `/reload-plugins`, puis « Réponds par send_message : la réponse reçue de /reload-plugins, puis arrête-toi. » Si elle recharge (« Reloaded: … »), un ticket suivra pour l'étudier ; si elle répond « isn't available over a remote connection », la lecture du fichier reste la seule voie, comme ce ticket la pose.

Les réponses, avec le coût des sessions, vont au journal de la carte du programme. Si une session suit la version chargée alors que celle du marketplace est plus récente, ou n'envoie pas la ligne de version, le ticket est rouvert.

## Hors périmètre

- **Le hook de démarrage du socle** (`skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`), instruit pour ce ticket et **renvoyé à un ticket de suite**. Ce qu'il fait aujourd'hui : `fetch-develop`, `origin-head`, `install` (seulement si l'état n'est pas prêt), le certificat du proxy des sessions cloud ; il signale graphify absent et le plugin absent (`installed_plugins.json` sans `maj-skills@maj`) ; il ne bloque jamais, sort toujours en 0, chaque commande sous un délai. Y jouer `claude plugin marketplace update maj` (2 secondes observées ; hors ligne, un échec dit en une ligne, sans bloquer) garderait les fichiers du marketplace à jour dans **toute** session d'un projet, filles et sessions ouvertes par un humain comprises, et lui permettrait de signaler l'écart (« plugin chargé X, marketplace Y : lire le fichier du marketplace »). Mais : la documentation dit que le hook tourne « After Claude Code launches », donc **après** le chargement des skills, et il ne change rien à la version chargée ; il n'atteint un projet qu'à la prochaine pose du socle ; il ne tourne pas dans une session à plusieurs dépôts (« a session with several repositories doesn't load hooks from any repository's `.claude/settings.json` »), celle d'un architecte de programme ; il écrit hors du dépôt, sous `~/.claude/plugins/`, à chaque démarrage. Le prompt couvre déjà, sans pose ni réseau supplémentaire, les sessions que l'architecte lance. Ce ticket de suite regroupe ce hook, son banc (`regles.test.mjs:228-243`), le gabarit d'une fille (`chaine-de-production.md` § 5, qui n'a pas de ligne « Version : » et dont la copie dans un projet ne suit pas le plugin), et les phrases « à chaque démarrage » des fichiers que le socle pose (`admin.md:12`, `demarrage.mjs:14`, `:81`, `chaine-de-production.md:119`, `socle-monorepo/SKILL.md:90`, `racine/CLAUDE.md:42`, `:44`).
- **Reconstruire l'instantané de l'environnement** : un changement du script de l'environnement le fait repasser (documentation) ; c'est un réglage du produit, hors dépôt, que l'architecte peut lui proposer à chaque version importante du plugin.
- **`chantier/SKILL.md` et `fusionner/SKILL.md`** : rien n'y change ; la ligne « Argument : » du prompt suffit à dire ce qu'est l'argument.
- **Les dépôts de projet** : leurs prompts déjà écrits ne changent qu'au prochain lancement par un architecte qui suit ce ticket.

## Intangibles

Jamais `--no-verify` ; jamais de push forcé ni de réécriture d'historique ; jamais de test retiré, sauté ou assoupli ; pas de dépendance nouvelle ; jamais de push sur `main`. La PR vise `main` ; la session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion. `Label: contre-revue` : l'architecte contre-relit avant de poser `à-fusionner`.

## Comments

- 2026-11-14 — Écrit par un rédacteur (sous-agent) depuis `origin/main` à `d0aaaf8` (plugin 7.3.2). 415 tests rejoués verts dans une copie jetable ; les trois tests du point 5 vus rouges sur la même copie, puis verts, et 418/418, avec les textes des points 1 à 4 appliqués tels qu'écrits ici (le ticket est généré depuis cette copie). Documentation de Claude Code lue le même jour (pages des environnements cloud, du chargement des plugins, de leur installation, de leurs commandes). Non vérifié : qu'une session de l'environnement lise `installed_plugins.json` sous la forme `plugins['maj-skills@maj'][0].version` (forme relevée sur une autre machine) ; qu'un `/reload-plugins` en tête d'un prompt de `create_session` soit refusé — d'où la sonde. À relire par un agent neuf avant le lancement.
- 2026-11-14 — Relu par un agent neuf : « prêt après corrections mineures », aucun défaut de conception (textes appliqués sur `1748f73`, plugin 7.4.0). Reportés : compteurs de tests non figés ; ticket 19 au présent, base `1748f73` ; « ticket 24 », déjà pris, remplacé par « un ticket de suite » ; `/reload-plugins` dit sans effet selon la documentation, plus affirmé comme un fait ; dans les lignes « Version : », l'entrée `user` de `installed_plugins.json`, une commande qui ne plante pas sans plugin, la version chargée fiable (dossier de base), l'échec de mise à jour (suivre la plus récente) et la ligne « Filles : » du conducteur ; `TEXTES_DE_LANCEMENT` porté à quatre fichiers ; faits 8 et 9 ; reprise d'une machine endormie et effet de `/reload-plugins` dans la documentation. Rejoué par le rédacteur sur une copie jetable de `1748f73` : 419 tests verts avant ; les deux tests attendus rouges avec le bloc seul ; 20/20 dans `depot.test.mjs` et 422/422 avec les textes.
