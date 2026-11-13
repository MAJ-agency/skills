# L'architecte a son skill, un programme a sa carte, et le démarrage d'une session dit ce qui lui manque

Status: ready-for-agent
Type: task
Blocked by: 5
Modèle: opus — un skill neuf à concevoir : ce que lit l'architecte, où il s'arrête, comment il lance une session qui démarre sans les skills, et quoi faire quand l'attache du dépôt est refusée
Fichiers chauds: `skills/chaine/architecte/`, `.claude-plugin/plugin.json`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `README.md`

## Le besoin

La session qui parle au produit et mène l'amont d'un programme n'a pas de mode d'emploi dans le plugin : le ticket 5 (PR 62) lui a donné son nom et sa définition, l'architecte, et ce ticket-ci lui donne son skill (`P-2`). Trois faits vécus le fondent : jusqu'au ticket 5, le skill `chantier` faisait tout, du grilling au suivi des vagues, et la session qui le déroulait a dépassé 700 000 tokens deux fois ; un programme n'a pas de carte à lui, celle de « gouverner nos boucles » a été écrite à la main ; et une session créée par une autre démarre sans les skills de la chaîne, ce qu'elle découvre en cours de route.

Quand le ticket est fait : un humain lance `/maj-skills:architecte` et la session sait quoi lire, comment tenir la carte du programme, où s'arrête son travail, comment lancer un conducteur ou un capitaine, et quand passer la main ; un programme a son gabarit de carte ; le hook de démarrage signale deux manques au lieu de les laisser découvrir.

## Où

Les lignes citées sont celles de `origin/main` à `8eb1c9b` (2026-11-13), après la PR 61 (ticket 4, le contrôle automatique) et la PR 62 (ticket 5, les rôles) : elles ont été revérifiées une à une sur ce commit. Si `main` a encore bougé, retrouver chaque endroit par le texte cité.

**Le skill, à créer** : `skills/chaine/architecte/SKILL.md`, et ce qui dépasse une page dans `skills/chaine/architecte/references/`. Modèle pour l'en-tête et la forme : `skills/chaine/chantier/SKILL.md`, lignes 1 à 10 (`name`, `description`, `argument-hint`, `disable-model-invocation: true` : le skill se lance à la main). Il dit, dans l'ordre :

1. quoi lire au départ : la carte du programme, puis sa source ; une session de suite reprend à la phase écrite, sans reposer une question tranchée ;
2. ce que l'environnement doit fournir, et comment le vérifier avant de commencer : les dépôts du programme, le clone de `MAJ-agency/skills`, `graphify`, les outils de session et l'outil GitHub MCP. Une session créée par `create_session` ne reçoit qu'un dépôt (décision `A-5` de la carte) : un travail sur deux dépôts se coupe en deux sessions, et la session de suite de l'architecte est ouverte par le produit depuis l'application ;
3. comment tenir la carte du programme (`A-8`) : la fiche, les chantiers dans l'ordre, les décisions `P-n` (le produit) et `A-n` (l'architecte, avec sa raison), le brouillard, le coût, le journal ; rien ne survit à un conteneur neuf que ce qui est commité ;
4. où s'arrête l'amont (`P-2`) : à la spec validée par le produit. Le conducteur découpe, lance et suit ; l'architecte ne lit ensuite que les cartes. La PR 62 a déjà écrit cette coupure du côté du conducteur : `skills/chaine/chantier/SKILL.md`, lignes 12 à 15 (« Où commence ce skill, à qui parle cette session ») et ligne 47, et la table des rôles de `chaine-de-production.md` (lignes 16 et 17, « Architecte » et « Conducteur de chantier »). Le skill l'écrit du côté de l'architecte et renvoie à ces endroits, sans les redire ni les contredire ;
5. comment une question arrive au produit : la forme de `chaine-de-production.md` § 2, « Une question au produit » (lignes 42 à 51). Que les questions d'un conducteur passent par l'architecte y est déjà écrit (ligne 42), ainsi que dans `chantier/SKILL.md` (ligne 14) : le skill y renvoie ;
6. comment lancer un conducteur et un capitaine : la section ci-dessous ;
7. quand passer la main (`A-9`) : il relève son contexte par `get_session` à chaque fin d'étape, le soumet à `scripts/chaine/plafonds.mjs` (posé par le ticket 7 ; son en-tête dit comment l'appeler) et, au verdict `passer-la-main` (400 000 tokens), écrit la passation dans la carte et demande au produit d'ouvrir la session de suite.

**Les skills dans une session créée par une autre session** (section de la spec, à porter dans le skill). Une session créée par une autre ne reçoit que le dépôt du projet et démarre sans les skills de la chaîne : le script de démarrage de l'environnement ne les installe que si le clone de `skills` est là. Le mécanisme existe, c'est celui de `chaine-de-production.md` § 5, étape 5 (ligne 115) : la session attache `MAJ-agency/skills` par `add_repo`, clone comme l'outil l'indique, puis lit le skill dans le clone. Il a marché sur les chantiers d'Iroki ; il a été refusé deux fois le 2026-11-13 par le contrôle automatique des permissions. Le skill s'appuie dessus :

- le prompt de lancement d'un conducteur porte la consigne d'attache, puis le skill à lire et à suivre dans le clone (`skills/chaine/chantier/SKILL.md`), la spec validée, le sujet, la carte du programme et l'identifiant de l'architecte. Modèle de forme, court et par renvoi : le gabarit du prompt de fille, `chaine-de-production.md` lignes 99 à 104. Ce que le conducteur fait de ce prompt est écrit depuis la PR 62 dans `chantier/SKILL.md`, à lire avant de l'écrire : un architecte nommé dans le prompt lui fait reconnaître qu'il est dans un programme et commencer au découpage (ligne 14) ; une vague donnée dans le prompt vaut validée, et ce qui manque encore (le responsable, une échéance) revient à l'architecte en un seul `send_message` (ligne 27) ; une carte de chantier déjà ouverte par l'architecte reçoit du conducteur sa ligne `Conducteur:` (ligne 40) ;
- le repli est écrit dans ce même prompt : si l'attache est refusée, la session le dit à l'architecte (`send_message`) et s'arrête, sans improviser ;
- `A-14` : la procédure d'un capitaine ou d'un conducteur se donne en entier à son lancement. Un message ne fait ensuite que nommer le travail (la spec validée, les PR à traiter) ; il n'ajoute ni ne change jamais une règle. Cas vécu, à citer (carte du programme, `A-14`) : le premier capitaine de `skills` a refusé, à raison, d'ajouter la mise à jour de branche à sa procédure sur un simple message de l'architecte.

**Déclarer le skill**, partout où le plugin liste les siens :

- `.claude-plugin/plugin.json`, liste `skills` (lignes 28 à 44), dans le groupe `chaine` ;
- `README.md` : la table `chaine/` (lignes 77 à 87), la phrase des invocations (ligne 89), l'arbre de « Structure » (lignes 145 à 166). C'est la règle « Ajouter un skill », étapes 1 à 3 (lignes 171 à 173) ; l'étape 4, la version, revient au ticket 8 ;
- `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json`, ligne 7 : ajouter `maj-skills:architecte`. Sans cela, le gate `references-agent` d'un projet refuse toute fiche qui cite le skill ;
- `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, ligne 44 : la liste des skills de la chaîne.

**La carte de programme** (`A-8`) :

- créer `skills/chaine/tickets/references/gabarits/programme.md`. Modèle : la carte de ce programme, `docs/issues/gouverner-nos-boucles/map.md`, lue sur la branche de cadrage (`git show origin/claude/compassionate-euler-st84s9:docs/issues/gouverner-nos-boucles/map.md`), et pour la forme d'un gabarit `skills/chaine/tickets/references/gabarits/carte.map.md`, dont la fiche nomme depuis la PR 62 `Responsable:`, `Architecte:` et `Conducteur:` (lignes 8 à 10) ;
- `skills/chaine/tickets/SKILL.md` : une ligne dans la table de la convention (après « Carte d'un chantier », ligne 25) ; la pose copie déjà tout le dossier des gabarits (ligne 48) ;
- `skills/chaine/tickets/references/CONTENU.md`, ligne 33 : la liste des gabarits ;
- rien à changer dans les gates : `tickets.mjs` ne contrôle que les `*.map.md` (ligne 160) et `couts.mjs` n'agrège qu'eux (ligne 176). Un fichier `*.programme.md` est donc hors du contrôle des cartes de chantier.

**Les signalements au démarrage** : `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, le hook `SessionStart` (déclaré par `references/settings-hooks.json` ligne 29). Il ne bloque jamais et sort toujours en 0 (ligne 86) ; ses étapes sont listées ligne 17, calculées par `planDemarrage` (ligne 35, appelée ligne 74) et rendues ligne à ligne sur la sortie (lignes 83 à 85). Y ajouter deux signalements, calculés par une fonction pure exportée sur le modèle de `planDemarrage` :

- `CLAUDE.md` du projet demande `graphify`, et la commande ou `graphify-out/graph.json` manque ;
- les skills de la chaîne ne sont pas disponibles dans la session ; le message donne le remède, l'attache de § 5, étape 5.

Test à étendre : `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, à la suite de « planDemarrage ne lance que les étapes manquantes et actives » (lignes 196 à 202). `skills/chaine/socle-chaine-de-production/SKILL.md`, ligne 35, décrit ce que fait le hook : la compléter.

## Décisions

- Relecture du 2026-11-13 par un agent neuf, quatre points fermés. **Titres du gabarit `programme.md`**, exactement ceux que le test vérifie : `## Fiche`, `## Chantiers`, `## Decisions-so-far`, `## Fog`, `## Coût`, `## Passation`, `## Journal` (les mêmes mots que la carte de chantier). **Le hook reconnaît que `CLAUDE.md` demande graphify** à la présence de la chaîne `graphify update` dans le `CLAUDE.md` racine, le même test que le script de démarrage de l'environnement. **Le lancement d'un capitaine** suit la même consigne d'attache que celui d'un conducteur, puis renvoie au skill `fusionner` lu dans le clone ; le skill de l'architecte n'en recopie pas la procédure. **Le script des plafonds** est écrit en même temps par le ticket 7 : le skill y renvoie par son chemin posé (`scripts/chaine/plafonds.mjs`), sans décrire son interface.
- Trois points fermés par l'architecte le 2026-11-13 (`A-16` à `A-18` de la carte). **Le découpage d'un conducteur** : il l'envoie à l'architecte (tableau des vagues), qui le présente au produit pour validation dans la forme d'une question au produit et renvoie la réponse ; l'architecte ne relit pas les tickets lui-même, c'est le rôle de la relecture par un agent neuf. **Le passage de main de l'architecte** : la session de suite met à jour la carte du programme, puis écrit à chaque conducteur en vie, qui met à jour la ligne `Architecte:` de sa carte à son réveil suivant. **La fiche d'une carte de programme** porte la ligne `Architecte:`, le même mot que dans une carte de chantier.
Tranché :

- `P-1`, `P-2`, `A-5`, `A-8`, `A-9`, `A-14` de la carte et de la spec, cités ci-dessus. Le vocabulaire est celui de `CONTEXT.md` (branche de cadrage).
- Le skill ne contient aucune règle métier ; un cas vécu se cite par son fait et sa date, jamais par un identifiant de session.
- Recopier les skills dans chaque projet ne se décide que si les refus d'attache se répètent : ne pas le proposer.
- `A-1` : la ligne `version` de `.claude-plugin/plugin.json` ne bouge pas ; seule la liste `skills` change.
- Vague partagée avec le ticket 7 : ne toucher ni `chaine-de-production.md`, ni `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, ni `skills/chaine/chantier/`, ni les scripts et les tests de `skills/chaine/tickets/references/scripts/verify/`. La phrase de `chaine-de-production.md` qui nommera l'invocation du skill et celle de `CONTENU.md` sur les signalements sont écrites par le ticket 8.

La session tranche seule, par défaut prudent, et le dit dans la PR :

- où vit une carte de programme dans un projet et comment elle se nomme : par défaut `docs/programmes/<nom-en-kebab>.programme.md`, sans identifiant de la nomenclature, écrit dans le skill et dans la table de `tickets/SKILL.md` ;
- les sections du gabarit au-delà des six de `A-8` : par défaut une section « Passation » en plus (c'est là que s'écrit le passage de main), et la section du coût avec l'en-tête exact de la carte de chantier (`carte.map.md` ligne 33) ; faire lire les programmes par `couts.mjs` est hors de ce ticket ;
- comment le hook reconnaît que les skills manquent. Piste observée le 2026-11-13 dans une session cloud, sans garantie de format : `~/.claude/plugins/installed_plugins.json` porte une clé `maj-skills@maj` quand le plugin est installé. Par défaut, fichier absent, illisible ou sans la clé : signalement. Le nom du plugin est une constante en tête du fichier ;
- ce que fait l'architecte après un refus d'attache : par défaut il le note au journal de la carte du programme et le dit au produit, sans contourner ;
- la place du skill dans la liste de `plugin.json` et dans la table du README.

## Surfaces

| Surface                                                  | Preuve                                                                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le skill est déclaré, porte son nom, tient en 200 lignes | `scripts/depot.test.mjs` « chaque skill du dépôt est déclaré dans le plugin », « le nom d'un skill est celui de son dossier », « aucun SKILL.md ne dépasse 200 lignes », déjà en place |
| Le gabarit de programme                                  | `scripts/depot.test.mjs` « le gabarit de programme porte ses sections et aucune ligne `Sujet:` »                                                                                       |
| `graphify` demandé et absent                             | `regles.test.mjs` « le démarrage signale graphify quand CLAUDE.md le demande et que la commande ou le graphe manque »                                                                  |
| Skills de la chaîne absents                              | `regles.test.mjs` « le démarrage signale les skills de la chaîne absents de la session, avec le remède »                                                                               |
| Un dépôt prêt                                            | `regles.test.mjs` « un dépôt prêt ne signale rien »                                                                                                                                    |
| Le hook ne bloque jamais                                 | lecture : aucun chemin nouveau ne sort autrement qu'en 0, et une erreur de lecture se tait                                                                                             |
| Le lancement d'un conducteur, le repli et `A-14`         | lecture du skill par l'architecte du programme : la consigne d'attache, l'arrêt en cas de refus, « un message ne fait que nommer le travail »                                          |
| Le gate d'un projet accepte la citation du skill         | lecture de `references-agent-integrees.json`                                                                                                                                           |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Bancs ciblés : `node --test scripts/depot.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`. Depuis la PR 61, toute PR vers `main` rejoue seule `pnpm install --frozen-lockfile` puis `pnpm test` (`.github/workflows/ci.yml`, job `bancs`). La PR 61 a aussi étendu `scripts/depot.test.mjs` (les tests du workflow, lignes 55 à 119) : le test du gabarit de programme s'écrit à leur suite, sans les toucher.

Avant de commencer, vérifier que le ticket 5 est sur `origin/main` : `git grep -n 'contre-revue' origin/main -- skills/chaine/tickets/references/gabarits/ticket.issue.md` rend une ligne (c'est le cas à `8eb1c9b`, ligne 10).

À la main : relire le skill en se mettant à la place d'une session neuve qui n'a que lui et la carte du programme, puis à la place d'un conducteur qui ne reçoit que le prompt de lancement.

## Livrer

Branche `feat/gnb-6-skill-architecte` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit, corps en français. **Ne jamais la fusionner** : le capitaine de `skills` fusionne les PR que l'architecte lui nomme. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
