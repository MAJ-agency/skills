# Les skills de la chaîne viennent du plugin installé par l'environnement, et l'architecte n'a plus de plafond de session

Status: ready-for-agent
Type: feature
Modèle: sonnet
Blocked by: 12
Fichiers chauds: `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/tickets/references/gabarits/programme.md`, `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/chantier/scripts/plafonds.mjs`, `skills/chaine/chantier/scripts/plafonds.test.mjs`, `skills/monorepo/socle-monorepo/SKILL.md`, `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, `README.md`

## Le besoin

Deux décisions du produit, prises le 2026-11-14, changent la conduite des sessions.

- **`P-24` : le dépôt `skills` est public.** Le script de l'environnement cloud de chaque projet installe le plugin `maj-skills` depuis GitHub au démarrage de toute session, fille comprise, puis le met à jour : `claude plugin marketplace add MAJ-agency/skills`, `claude plugin install maj-skills@maj`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj`. Avant, cette installation échouait en silence dans toute session qui n'avait pas `skills` parmi ses dépôts ; d'où l'attache par `add_repo`, refusée deux fois le 2026-11-13, puis la copie des skills dans chaque projet (`P-20`), qui tombe. Un projet garde ses propres skills dans `.claude/skills/` (`P-21`, `P-22`) et ne touche jamais à ceux du plugin, qui vivent hors de son dépôt.
- **`P-25` : l'architecte n'a plus de plafond de session.** Seul le produit décide d'un changement d'architecte ; l'architecte ne propose plus de passer la main et ne prépare plus de prompt de suite de lui-même. Les plafonds du conducteur et de la fille ne changent pas.

Aujourd'hui, les prompts de lancement, la consigne de la fille (§ 5, étape 5), le skill de l'architecte et le hook de démarrage disent d'attacher `MAJ-agency/skills` par `add_repo` et de lire le skill dans un clone ; le `README.md`, le `CLAUDE.md` du gabarit et le skill `socle-monorepo` décrivent un dépôt privé, cloné à côté du projet, installé depuis ce clone ; le skill de l'architecte le fait passer la main à 400 000 tokens, par le verdict `passer-la-main` de `plafonds.mjs`, et le gate `tickets` juge encore une ligne `architecte` contre ce plafond.

Quand le ticket est fait, aucune consigne ne parle plus d'attache ni de clone pour lire un skill : le plugin est installé par le script de l'environnement ; une session qui ne l'a pas l'écrit à qui l'a lancée et s'arrête. Le hook de démarrage signale ce manque avec les quatre lignes du script. L'architecte relève son contexte et son coût à chaque étape et les dit au produit, tient la passation à jour à chaque étape, et ne passe jamais la main de lui-même. `plafonds.mjs` et le gate `tickets` ne jugent plus que la fille et le conducteur. La version du plugin ne bouge pas ici : ticket 14.

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
- **`skills/chaine/architecte/SKILL.md`**
  - ligne 28 (table « Vérifier l'environnement ») : « le clone de `MAJ-agency/skills` » | « `skills/chaine/architecte/SKILL.md` lisible dans le clone » devient « les skills de la chaîne » | « `/maj-skills:chantier` et `/maj-skills:fusionner` parmi les skills de la session (le plugin, installé par le script de l'environnement) ». Un clone de `skills` ne se vérifie que si `skills` est sur la ligne `Dépôts:` : la ligne 27 le couvre déjà.
  - ligne 33 : point 3 ci-dessous.
  - ligne 44 : « par refus d'attache » devient « par skill absent ».
  - ligne 56 : « il porte **la consigne d'attache des skills** et **le repli** si l'attache est refusée » devient « il porte **la consigne de lecture des skills** (le plugin installé par le script de l'environnement) et **le repli** si le skill est absent ».
  - ligne 70 devient : « **Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session le dit et s'arrête. L'architecte le note au journal de la carte (la date, la session, le dépôt) et le dit au produit : c'est le script de l'environnement de ce dépôt qui manque ou a échoué (les quatre lignes du `README.md` de `skills`, § « Installer »). Il **ne contourne pas** : ni procédure dictée de mémoire, ni skills du plugin recopiés dans le projet (`P-24`). » (Pas la suite de mots « copie des skills » : la preuve du ticket 14 la cherche.)
  - ligne 86 (« Ne jamais ») devient : « Contourner un skill absent par une procédure dictée de mémoire, ou recopier les skills du plugin dans un projet (`P-24`). »
  - Lignes 10, 19 et 74 (« dans le dépôt `skills`, sa source est … ») : la ligne 74 disparaît avec le § 6 (point 3) ; 10 et 19 restent, elles disent où lire la source quand on travaille dans `skills`.
- **`skills/chaine/architecte/references/CONTENU.md`**, ligne 5 : « avec la consigne d'attache des skills, son repli » devient « avec la consigne de lecture des skills (le plugin installé par le script de l'environnement), son repli ».
- **`R/docs-agents/chaine-de-production.md`**, ligne 115 (§ 5, étape 5) : de « **Skill absent de la session** » à « jamais de PR livrée sans revue. » devient : « **Skill absent de la session** : le plugin `maj-skills` est installé par le script de l'environnement, dans toute session, fille comprise. S'il manque, le hook de démarrage le signale : la fille l'écrit à son conducteur (`send_message`) et s'arrête sans réserver le ticket, plutôt que de livrer une PR sans revue. » La phrase « Cas vécu : cinq filles d'une même journée livrées sans revue de ticket. » reste. Aucun chemin sous `.claude/skills` n'y est écrit (le fichier est posé dans `docs/agents/` d'un projet, que le gate `references-agent` lit).
- **`T/gabarits/programme.md`**, ligne 50 : « refus d'attache » devient « skill absent ».
- **`M/racine/CLAUDE.md`**, ligne 44 : point 4.
- **`R/agent/demarrage.mjs`** et son banc : point 2.

### 2. Le hook de démarrage — `R/agent/demarrage.mjs`

Il signale déjà ce qu'il faut : le plugin `maj-skills@maj` absent de `~/.claude/plugins/installed_plugins.json` (lignes 54 à 63, `pluginInstalle`). Seul le remède change. Il ne lit aucun manifeste et n'en lira pas.

- Lignes 79 à 83, le texte devient : `` `démarrage : skills de la chaîne absents de la session (plugin ${PLUGIN_CHAINE} non installé) — le script de l’environnement doit l’installer et le mettre à jour à chaque démarrage : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; claude plugin marketplace update maj ; claude plugin update maj-skills@maj (docs/agents/chaine-de-production.md § 5, étape 5) ; le dire à qui a lancé la session et s’arrêter, sans contourner` ``.
- En-tête, lignes 13 et 14 : « les skills de la chaîne ne sont pas installés dans la session (une session créée par une autre ne reçoit que le dépôt du projet) » devient « le plugin des skills de la chaîne n'est pas installé dans la session (le script de l'environnement ne l'a pas installé) ».
- `R/agent/regles.test.mjs`, test de la ligne 234, renommé « le démarrage signale les skills de la chaîne absents, avec les lignes du script de l'environnement » : pour chaque valeur du tableau `absents` (ligne 236), un signalement qui contient `skills de la chaîne absents`, `claude plugin marketplace add MAJ-agency/skills`, `claude plugin install maj-skills@maj`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj`, `§ 5, étape 5` et `s’arrêter` ; l'assertion de la ligne 241 s'inverse en `assert.doesNotMatch(s[0], /add_repo|clone/)`. Les assertions de `pluginInstalle` (lignes 244, 246, 247) et le test « un dépôt prêt ne signale rien » (ligne 250) restent.
- `skills/chaine/socle-chaine-de-production/SKILL.md:35` et `R/CONTENU.md:13` disent « les skills de la chaîne absents de la session, avec le remède de `chaine-de-production.md` § 5, étape 5 » : toujours vrai, ils ne changent pas pour ce point.

### 3. L'architecte sans plafond — `P-25`

- **`skills/chaine/architecte/SKILL.md`**
  - ligne 3 (description) : « et passe la main à une session de suite au plafond de contexte » devient « relève son contexte et son coût à chaque étape pour le produit, seul à décider d'un changement d'architecte ».
  - ligne 33 : la première phrase reste (une session créée par `create_session` ne reçoit qu'un dépôt ; un travail sur deux dépôts se coupe en deux sessions). Ajouter : « Les skills n'en dépendent pas : le plugin est installé par le script de l'environnement dans toute session. » La dernière phrase devient : « Un changement d'architecte, qui a besoin de tous les dépôts, n'est décidé que par le produit (§ 6) : il ouvre lui-même la nouvelle session depuis l'application ; l'architecte ne la crée jamais par `create_session` et ne la propose pas. »
  - ligne 39 : « , le plafond » disparaît de la liste de la fiche.
  - ligne 42 : « c'est ce qui empêche une session de suite de reposer la question » devient « c'est ce qui empêche une nouvelle session d'architecte de reposer la question ».
  - lignes 72 à 80, le § 6 entier devient « ## 6. Le relevé et la passation, à chaque étape », en trois paragraphes :
    - « À **chaque fin d'étape** : `get_session` sans argument ; le contexte (`context_usage.used_tokens`) et le coût (`external_metadata.usage.cost_usd`) vont sur la ligne de cette session dans `## Coût` de la carte, et en une ligne dans le message au produit qui clôt l'étape. **L'architecte n'a pas de plafond** (`P-25`) : il ne passe pas ses relevés à `plafonds.mjs`, ne propose jamais de passer la main et ne prépare pas de prompt de suite. `/compact` entre deux étapes reste permis. »
    - « **La passation** dans `## Passation` de la carte, réécrite à chaque fin d'étape, dans le même commit que l'étape : où en est chaque chantier, ce qui attend le produit, les questions posées sans réponse, les sessions en vie (conducteurs, capitaines), et l'environnement d'une nouvelle session (dépôts, branche où pousser la carte). Elle rend un changement d'architecte possible à tout moment. »
    - « **Seul le produit décide d'un changement d'architecte.** Quand il le dit : la passation relue et poussée, la ligne de coût à jour, puis s'arrêter. La nouvelle session, ouverte par le produit avec ce skill et le nom du programme, lit la carte (§ 0), met à jour `Architecte:` de la fiche et la ligne au journal, puis écrit à **chaque conducteur en vie** (`send_message`) son nouvel identifiant : le conducteur met à jour la ligne `Architecte:` de sa carte à son réveil suivant. Les capitaines, de même. »
  - « Ne jamais » (ligne 82 et suivantes) : une ligne de plus, « Proposer de passer la main, ou préparer de soi-même le prompt d'une session de suite : seul le produit change d'architecte (`P-25`). »
- **`skills/chaine/architecte/references/CONTENU.md`**, ligne 3 : « sur le script des plafonds posé dans `scripts/chaine/`, » disparaît. Ligne 7 : « Une session de suite ouverte par le produit lit la fiche » devient « Une nouvelle session d'architecte, ouverte par le produit quand il en décide une, lit la fiche ».
- **`T/gabarits/programme.md`** : ligne 3, « Une session de suite lit cette carte » devient « Une nouvelle session d'architecte, que seul le produit décide, lit cette carte » ; ligne 16 (`Plafond de l'architecte:`) supprimée ; ligne 46 devient « {{Tenue à jour à chaque fin d'étape, pour qu'un changement d'architecte, décidé par le produit seul, reste possible à tout moment : où en est chaque chantier, ce qui attend le produit, les questions posées sans réponse, les sessions en vie (conducteurs, capitaines) à prévenir, et l'environnement à ouvrir pour la nouvelle session (dépôts, droit de pousser).}} ». Le test de `scripts/depot.test.mjs:223` (sections, `Phase:`, `Responsable:`, `Architecte:`) reste vert.
- **`skills/chaine/chantier/scripts/plafonds.mjs`**
  - lignes 2 à 7 (en-tête) : « le conducteur (et l'architecte, à chaque fin d'étape) » devient « le conducteur » ; « rôles `conducteur` et `architecte` → `passer-la-main` » devient « rôle `conducteur` → `passer-la-main` » ; une phrase : « Le rôle `architecte` est refusé : l'architecte n'a pas de plafond (P-25), seul le produit décide d'un changement d'architecte. »
  - ligne 72 : `if (role === "conducteur")`. Juste avant : `if (role === "architecte") throw new Error("rôle « architecte » sans plafond (P-25) : seul le produit décide d'un changement d'architecte");`.
  - ligne 77 : « sous le plafond du pilote » devient « sous le plafond du conducteur ».
  - ligne 79 : « (fille, conducteur ou architecte) » devient « (fille ou conducteur) ».
  - La clé `contextePilote` garde son nom : elle est lue dans le `.claude/chaine.json` des projets, et le gate `tickets` refuse une clé inconnue.
- **`skills/chaine/chantier/scripts/plafonds.test.mjs`** : le test de la ligne 35 devient « un conducteur au plafond de contexte passe la main ; l'architecte n'a pas de plafond » : les assertions de la boucle pour `conducteur` seul ; puis `assert.throws(() => juger({ role: "architecte", contexte: 900000, cout: 0 }), /sans plafond/)` ; et par la CLI, `lancer([{ session: "a", role: "architecte", contexte: 1, cout: 1 }])` sort en 2, `stdout` vide.
- **`skills/chaine/chantier/SKILL.md`** : ligne 88, « (`role` : `fille`, `conducteur` ou `architecte`) » devient « (`role` : `fille` ou `conducteur` ; l'architecte n'a pas de plafond et ne passe jamais au script) » ; ligne 90, « (le conducteur ou l'architecte, à 400 k tokens) » devient « (le conducteur, à 400 k tokens) ».
- **`R/chaine.json`**, ligne 2 (`$comment`) : « `contextePilote` fait passer la main à un conducteur ou à un architecte » devient « `contextePilote` fait passer la main à un conducteur (l'architecte n'a pas de plafond : seul le produit décide d'un changement d'architecte) ». Les valeurs ne changent pas : aucune n'est propre à l'architecte.
- **`R/CONTENU.md`**, ligne 5 : « le contexte au-delà duquel un conducteur ou un architecte passe la main » devient « le contexte au-delà duquel un conducteur passe la main (l'architecte n'en a pas) ».
- **`R/docs-agents/chaine-de-production.md`** : ligne 16 (rôle « Architecte »), colonne « Ne fait jamais », ajouter « , proposer de passer la main (seul le produit change d'architecte) » ; ligne 134, « Plafond du conducteur et de l'architecte : » devient « Plafond du conducteur : », et la cellule finit par « ; l'architecte n'a pas de plafond : il relève son contexte et son coût à chaque fin d'étape et les dit au produit, seul à décider d'un changement d'architecte ». La colonne « Pourquoi » ne change pas.
- **Le gate `tickets`** juge encore une ligne `architecte` de `## Coût` d'une carte de chantier contre `contextePilote`. Les coûts de l'architecte vont dans la carte du programme, que ce gate ne lit pas ; une ligne `architecte` dans une carte de chantier ne vient que d'une carte d'avant les rôles, où elle nommait la session du chantier.
  - `T/scripts/verify/tickets-regles.mjs` : ligne 339, « (`fille`, `conducteur`, `architecte`) » devient « (`fille`, `conducteur`) » ; ligne 355, `if (!fille && r !== 'conducteur') continue;`. Une phrase au commentaire : l'architecte n'a pas de plafond (`P-25`), sa ligne n'est pas jugée.
  - `T/scripts/verify/tickets.mjs`, ligne 19 : « `conducteur` et `architecte` 400 k tokens » devient « `conducteur` 400 k tokens, `architecte` jamais jugé ».
  - `T/scripts/verify/tickets.test.mjs` : ligne 389, la ligne `architecte` passe à `900 k` et `90,00`, toujours sans erreur, et le commentaire de la ligne 390 devient « un capitaine, un architecte ou un rôle libre n'est pas jugé » ; test de la ligne 411, la carte ancienne reçoit une seconde ligne `| conducteur | t | s2 | opus | 410 k | 9,00 |` : gelée, aucune erreur ; non gelée, exactement une erreur `Dépassements`, qui nomme `s2 (conducteur)`, aucune pour la ligne `architecte`.
- **`README.md`** : ligne 86, « passe la main au plafond » devient « relève son contexte et son coût pour le produit, seul à décider d'un changement d'architecte » ; ligne 164, « passer la main » devient « la passation tenue à chaque étape ».

### 4. Le script de l'environnement, dit partout de la même façon

Les lignes d'installation se lisent, à `809d62e` (`git grep -n "marketplace add" 809d62e`), dans `README.md:9-30`, `skills/monorepo/socle-monorepo/SKILL.md:77-84` et `M/racine/CLAUDE.md:44` ; `R/admin.md:12-14` décrit le script de l'environnement sans elles. Partout : installation depuis GitHub, mise à jour à chaque démarrage, plus de « dépôt privé », plus de clone à côté, plus de condition sur un dossier `skills`. Les quatre lignes, dans cet ordre, chacune suivie de `|| true` dans un script d'environnement (un échec ne doit pas empêcher la session de démarrer ; le hook de démarrage signale alors le plugin absent) :

```bash
claude plugin marketplace add MAJ-agency/skills || true
claude plugin install maj-skills@maj || true
claude plugin marketplace update maj || true
claude plugin update maj-skills@maj || true
```

- **`README.md`** : ligne 9, « Le dépôt est **privé** : il faut un accès en lecture … ou une clé SSH). » devient « Le dépôt est **public** : aucun accès à demander, aucune authentification GitHub pour installer. » Lignes 23 à 30, le paragraphe et son bloc deviennent : « **Dans un environnement cloud** (sessions Claude Code sur claude.ai), le script de configuration de l'environnement de chaque projet installe le plugin depuis GitHub et le met à jour **à chaque démarrage**, dans toute session, celles lancées par une autre comprises : l'image de l'environnement garde la version de son dernier build, et `install` ne touche pas à un plugin déjà présent. » suivi du bloc ci-dessus. Les lignes 11 à 21 (installation locale et mise à jour) ne changent pas.
- **`skills/monorepo/socle-monorepo/SKILL.md`**, lignes 77 à 84 : la phrase « Pour la session courante et pour un script de configuration cloud, vérifier ce qui est déjà installé (`claude plugin list`) puis : » reste ; le bloc reçoit, après ses quatre lignes, `claude plugin marketplace update mattpocock`, `claude plugin update mattpocock-skills@mattpocock`, `claude plugin marketplace update maj`, `claude plugin update maj-skills@maj` ; une phrase après le bloc : « Dans le script de configuration cloud, les huit lignes se jouent à chaque démarrage, chacune suivie de `|| true` : le hook de démarrage de la chaîne signale un plugin absent. »
- **`M/racine/CLAUDE.md`**, ligne 44 : de « ; le dépôt est **privé** » à « toujours à la version du clone. » devient « ; le dépôt est **public** : en local, Claude Code propose de l'installer à l'ouverture du dépôt ; dans le cloud, le script de configuration de l'environnement l'installe depuis GitHub (`claude plugin marketplace add MAJ-agency/skills`, puis `claude plugin install maj-skills@maj`) **et le met à jour à chaque démarrage** (`claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`), dans toute session, celles lancées par une autre comprises. Ces skills vivent hors du dépôt : un projet ne les modifie jamais, il garde les siens sous .claude/skills. » La dernière phrase (« un skill absent de la liste installée se lit dans le dépôt `skills` en attendant la session suivante ») devient « un skill absent de la liste installée attend la session suivante ; s'il manque à une session lancée par une autre, elle l'écrit à qui l'a lancée et s'arrête. » Sans accents graves autour de `.claude/skills` : le gate `references-agent` d'un projet le lirait comme un chemin.
- **`R/admin.md`**, lignes 12 à 14 (case « Environnement cloud Claude Code ») : « `<dépôt>` étant le dossier du clone » devient « `<dépôt>` étant le dossier du dépôt » ; la case reçoit, avant la boucle de la base : « Pour que chaque session, fille comprise, ait les skills de la chaîne, le script installe le plugin depuis GitHub et le met à jour à chaque démarrage : » puis les quatre commandes, une par ligne, avec `|| true`.

## Décisions

- `P-24` (dépôt public, plugin installé par le script de l'environnement, plus de copie), `P-25` (l'architecte sans plafond, seul le produit décide d'un changement d'architecte), `P-21` et `P-22` (un projet garde ses skills, ne touche jamais à ceux du plugin).
- **Aucun geste d'une session de projet n'exige plus le dépôt `skills`** : écrit une fois, dans `lancement.md`. Modifier un skill se fait dans une session ouverte sur `MAJ-agency/skills`.
- **« La session de suite est ouverte par le produit » devient « un changement d'architecte n'est décidé que par le produit, qui ouvre lui-même la nouvelle session »** : la contrainte d'un seul dépôt par `create_session` reste, mais ce n'est plus l'architecte qui demande la session ; il tient la passation pour qu'elle soit possible à tout moment.
- **Le hook signale le plugin absent, et donne les quatre lignes du script** : c'est le seul manque possible désormais ; il ne lit aucun manifeste et ne compare aucune version (le script met à jour à chaque démarrage).
- **`plafonds.mjs` refuse le rôle `architecte`** (sortie 2) plutôt que de rendre `ok` : le script ne rend jamais `ok` sur une entrée douteuse (en-tête, lignes 14 et 15), et un appelant resté sur l'ancienne règle doit l'apprendre plutôt que recevoir un verdict. Le gate `tickets`, lui, ne juge plus la ligne `architecte`, sans erreur : il lit des cartes, dont les anciennes.
- `contextePilote` garde son nom (compatibilité des contrats de projet).
- Aucune dépendance nouvelle. La version ne bouge pas : le ticket 14 la monte une seule fois pour les deux (pratique de `A-1`, tickets 5 à 8), dans le commit qui supprime le workflow de recopie.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la consigne d'attache retirée | `git grep -n "add_repo\|d'attache\|ttache refusée\|du clone\|dans le clone" -- skills/ README.md` ne rend que la ligne `doesNotMatch` de `regles.test.mjs` (dix-neuf lignes à `809d62e`) |
| le dépôt public, sans clone | `git grep -n -i "privé" -- README.md skills/monorepo/socle-monorepo/references/racine/CLAUDE.md` et `git grep -n 'PWD/skills' -- README.md skills/` ne rendent rien |
| les lignes du script | `git grep -n "claude plugin update maj-skills@maj" -- README.md skills/` rend `README.md`, `socle-monorepo/SKILL.md`, `M/racine/CLAUDE.md`, `R/admin.md`, `R/agent/demarrage.mjs` et `regles.test.mjs` |
| le hook de démarrage | `regles.test.mjs` : plugin absent, un signalement avec les quatre lignes, sans `add_repo` ni `clone` ; plugin installé, aucun |
| l'architecte sans plafond | `git grep -n "passer-la-main\|plafonds.mjs\|Plafond de l'architecte\|400 000" -- skills/chaine/architecte skills/chaine/tickets/references/gabarits/programme.md` ne rend que la phrase du § 6 qui dit que l'architecte ne passe pas ses relevés à `plafonds.mjs` ; `git grep -n "architecte" -- skills/chaine/chantier/scripts/plafonds.mjs` ne rend que l'en-tête et le refus |
| `plafonds.mjs` | `plafonds.test.mjs` : le conducteur passe la main à 400 000, l'architecte est refusé par la règle et par la CLI (sortie 2) |
| le gate `tickets` | `tickets.test.mjs` : une ligne `architecte` à 900 k n'est pas jugée ; la carte ancienne non gelée n'a d'erreur que pour son conducteur |
| la prose posée dans un projet | dans `R/docs-agents/chaine-de-production.md` et `M/racine/CLAUDE.md`, aucun chemin sous `.claude/skills` entre accents graves (comme à `809d62e`) |

## Vérification

- `pnpm test` vert : **410 tests** à `809d62e` (joué le 2026-11-14 dans un arbre détaché, sans installation : les bancs n'ont aucune dépendance). Ce ticket n'en retire ni n'en ajoute : 410 à la fin. Aucun test désactivé.
- `scripts/depot.test.mjs` contrôle que chaque `SKILL.md` reste sous 200 lignes (`architecte/SKILL.md` en fait 88).
- À la main : `echo '[{"session":"a","role":"architecte","contexte":1,"cout":1}]' | node skills/chaine/chantier/scripts/plafonds.mjs` sort en 2 et nomme `P-25`.
- Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Hors périmètre

- Le retrait de la mécanique de copie (workflow, commande, manifeste, gate `skills-recopies`, refus d'éditer la copie), le `.gitignore` du gabarit et la version du plugin : ticket 14.
- Les dépôts de projet : le script d'environnement de chacun (réglage du compte, fait par le produit), le retrait de la copie d'`anchorpost` (PR 121), le report du nouveau `demarrage.mjs` et du nouveau `plafonds.mjs` dans `scripts/agent/` et `scripts/chaine/` d'un projet, qui gardent leur version posée jusqu'à une nouvelle pose.
- `fedora` : son lot se reprend après `P-24` (ses skills de la chaîne rangés à plat cèdent la place au plugin), par d'autres tickets.
- Le point d'extension de `sujet.sh` qui appelle un script du projet (`A-41`).

## Comments

- 2026-11-14 — Réécrit après `P-24` et `P-25` : la lecture des skills dans une copie du projet (version du matin) n'a plus d'objet ; le ticket couvre la consigne de lecture, le hook de démarrage, le script d'environnement et l'architecte sans plafond ; le retrait de la copie passe au ticket 14. Dix-neuf fichiers.
