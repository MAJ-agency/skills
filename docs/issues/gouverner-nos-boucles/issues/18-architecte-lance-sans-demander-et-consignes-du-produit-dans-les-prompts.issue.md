# L'architecte lance sans demander, et les consignes du produit entrent dans chaque prompt de lancement, version mineure du plugin

Status: Fait — PR #77
Type: feature
Modèle: sonnet — tous les textes à écrire sont donnés ci-dessous, mot pour mot ou par leur plan précis ; rien n'est à concevoir.
Blocked by: — (ordre souhaité : après le ticket 16, voir Décisions)
Fichiers chauds: `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `README.md`, `.claude-plugin/plugin.json`

## Le besoin

Le 2026-11-14, le produit a donné à l'architecte de ce programme une série de consignes sur sa façon de travailler. Elles ne sont écrites que dans la carte du programme (`docs/issues/gouverner-nos-boucles/map.md`, décisions `P-26`, `P-27`, `P-28` et `A-46` ; `A-47` dans le journal, 9 h 26 UTC) :

- `P-26` : à la question « est-ce que je lance la session du ticket `SPEC_ALL_SOC-1.18` ? », le produit a répondu « oui lance tout tu es architecte ». Une session de ticket prête et relue, un conducteur, un capitaine se lancent sans question ; l'architecte le dit après coup, avec le fait et la preuve.
- `P-27` : « oui ouvre les PR de doc toi-même ». L'architecte ouvre les PR qui ne portent que des tickets et de la documentation, pose le label, les nomme au capitaine.
- `P-28` : deux phrases du produit à citer mot pour mot dans chaque prompt de session lancée, la forme des messages au produit, et la liste des intangibles.
- `A-46` : une session lancée peut démarrer sans le plugin ; son prompt lui dit de l'installer elle-même.
- `A-47` : une PR étrangère au programme, signalée par un capitaine, se nomme quand son diff est lu, sans risque, et qu'elle porte le label.

Le même jour, un architecte lancé sur un autre programme, sans ces consignes, a demandé au produit l'autorisation de lancer un capitaine : exactement ce que le produit ne veut plus. Sa session était ouverte hors du mode « Auto » et sur deux dépôts (carte, section « Demandes d'autorisation relevées », ligne du 2026-11-14 à 9 h 42 UTC).

Quand le ticket est fait, tout architecte applique ces consignes dès son démarrage, parce que son skill les porte ; toute session qu'il lance (conducteur, capitaine, session de ticket hors chantier) reçoit dans son prompt les deux phrases du produit et les intangibles ; une session lancée sans le plugin l'installe elle-même au lieu de s'arrêter.

## Où

Lignes de `main` à `ba0f550` (2026-11-14, plugin 6.1.0), toutes relues dans le plugin installé (`~/.claude/plugins/marketplaces/maj/`). Relevé de nouveau à la correction du ticket, le 2026-11-14 (`git fetch origin main`, puis `git log --oneline -3 origin/main`) : `main` est toujours à `ba0f550`, plugin 6.1.0 ; **la PR 74** (« le script des plafonds disparaît, le conducteur lit les seuils lui-même », plugin 7.0.0) **n'y est pas entrée**, ni le ticket 16. Toutes les lignes ci-dessous valent donc pour `ba0f550`. **La session relève chaque `fichier:ligne` sur sa base** avant d'écrire : si `main` a bougé (PR 74, qui peut toucher `A/SKILL.md` et `chaine-de-production.md`, ou ticket 16), elle retrouve chaque phrase par son texte, l'écrit sous `## Comments` de sa PR, et ne s'arrête que si une phrase à remplacer a disparu ou changé de sens (elle l'écrit alors à l'architecte).

`R` abrège `skills/chaine/socle-chaine-de-production/references`, `A` abrège `skills/chaine/architecte`.

### Ce que le skill 6.1.0 dit déjà, et qui ne se redit pas

| Point | Déjà dit | Où |
| --- | --- | --- |
| 1. lancer sans demander | non : § 4 dit comment lancer, jamais qu'on ne demande pas ; la description (ligne 3), « Ne jamais » (ligne 85) et la table des rôles (`chaine-de-production.md:16`) interdisent de « lancer une fille » ou « des filles », alors que la section Coût (ligne 43) compte déjà les « sessions de ticket qu'il lance lui-même » | `A/SKILL.md:3,43,56,85` ; `R/docs-agents/chaine-de-production.md:16` |
| 2. les deux phrases dans les prompts | non : aucun des trois gabarits ne les porte, et aucun gabarit n'existe pour une session de ticket hors chantier (celui du § 5 suppose un conducteur et un sujet) | `A/references/lancement.md:11-16,28-32`, `R/docs-agents/chaine-de-production.md:99-104` |
| 3. ce qui reste une question | en partie : le filtre (« ne lui arrive que si elle a une conséquence pour lui »), la recommandation d'abord, une seule décision, aucun terme technique | `R/docs-agents/chaine-de-production.md:42-51` ; `A/SKILL.md:51` y renvoie |
| 3. bis : oui ou non, vouvoiement, le sens d'une règle métier, « une autorisation n'est pas une question » | non | — |
| 4. PR de documentation par l'architecte | non ; la vérification du titre existe pour une fille seulement (étape 6) | `R/docs-agents/chaine-de-production.md:116` |
| 5. relire le diff, vérifier à la source, transmettre tel quel | en partie : la réponse du produit « telle quelle » vers un conducteur (découpage, plafond) ; et deux phrases disent le contraire (« ne lit ensuite que les cartes », « jamais leurs tickets ni leurs PR ») | `A/SKILL.md:12,64,66,67` |
| 6. PR étrangère au programme | non ; `fusionner/SKILL.md` fait passer toute PR qui porte `à-fusionner` et ne connaît pas de nomination : seul un capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, ne fusionne que ce qu'on lui nomme | `A/references/lancement.md:31,34` |
| 7. mode « Auto », dépôts, hook qui demande | en partie : « une session lancée ne peut pas avoir un mode plus permissif que celle qui la lance, donc le produit ouvre l'architecte en mode « Auto » » ; rien sur ce qu'un architecte à plusieurs dépôts perd du `.claude/settings.json`, ni sur le hook | `A/references/lancement.md:42` ; `A/SKILL.md:27,33,80` |
| 8. installer le plugin soi-même | non : depuis le ticket 13 (PR 70), le repli est « skill absent, la session l'écrit à qui l'a lancée et s'arrête » ; le hook de démarrage dit pareil | `A/references/lancement.md:3,13,30` ; `A/SKILL.md:71,89` ; `R/docs-agents/chaine-de-production.md:115` ; `R/agent/demarrage.mjs:81` |
| 9. déléguer lecture et écriture | en partie : « Cette session ne tient que ce rôle : un deck, une étude, une contre-revue longue partent dans une autre session ou un sous-agent » | `A/SKILL.md:10` |

Les plafonds et le passage de main (`A/SKILL.md:67` : un plafond se signale, aucune session n'est interrompue ; `:75` : l'architecte n'a pas de plafond, seul le produit décide de changer d'architecte) sont refaits par la PR 73 : ce ticket ne les touche pas et ne les contredit pas.

### 1. `A/SKILL.md` (91 lignes à `ba0f550`, environ 106 après)

Dans l'ordre des lignes :

- **Ligne 3, description** : « Ne découpe pas, ne lance pas de fille, ne code pas, ne fusionne pas. » devient « Lance sans demander au produit les sessions prêtes et ouvre lui-même les PR de documentation, et ne lui pose que des décisions. Ne découpe pas, ne lance pas la fille d'un chantier qui a son conducteur, ne code pas, ne fusionne pas. » Dans la même description, « lance le conducteur de chaque chantier et le capitaine de chaque dépôt avec leur procédure entière » devient « lance le conducteur de chaque chantier, le capitaine de chaque dépôt et la session de chaque ticket hors chantier avec leur procédure entière ».
- **Ligne 10, point 9** : après « … partent dans une autre session ou un sous-agent. », ajouter : « Le travail de lecture et d'écriture aussi : relevés, rédaction et reprise de tickets, relectures par un agent neuf, contre-revues vont à des sous-agents. L'architecte n'en lit que la conclusion et vérifie à la source les faits sur lesquels il décide. »
- **Ligne 12, point 5** : « L'architecte ne lit ensuite que les cartes. » devient « L'architecte ne lit ensuite que les cartes, sauf pour lire à la source ce qu'il annonce ou ce sur quoi il décide (§ 7 : le diff d'une PR, l'état d'une session ou d'une branche). » La règle du découpage ne change pas : « le conducteur de chantier découpe, fait relire ses tickets, lance les filles et les suit » reste tel quel.
- **Ligne 28, point 8** : « (le plugin, installé par le script de l'environnement) » devient « (le plugin, installé par le script de l'environnement ; absent, l'architecte l'installe lui-même par les commandes de `references/lancement.md`, puis le dit au produit) ».
- **Après la ligne 33, point 7**, un paragraphe :

  > **Le mode et les dépôts de la session.** Le produit ouvre l'architecte en mode « Auto », et l'architecte lance chaque session de même (`references/lancement.md`) : une session hors « Auto » fait remonter chaque outil au produit. Un architecte de projet est ouvert sur le seul dépôt du projet. Un architecte de programme à plusieurs dépôts (ligne `Dépôts:` de la fiche) sait que le `.claude/settings.json` d'un dépôt ne s'applique pas à sa session : il n'en tire ni hook ni outil autorisé d'office, reste en mode « Auto », et fait écrire dans chaque autre dépôt par une session lancée sur lui. Cas vécu le 2026-11-14 : un architecte ouvert hors « Auto » a demandé au produit l'autorisation de lancer un capitaine. Une session d'architecte hors « Auto » est un écart : il se dit au produit en un message, avec le remède (rouvrir la session en « Auto »).

  Ligne 33, la phrase « La session de suite de l'architecte, qui a besoin de tous les dépôts, est donc **ouverte par le produit depuis l'application**, jamais par `create_session` » garde son sens et reçoit le mode : « … **ouverte par le produit depuis l'application**, en « Auto », jamais par `create_session` ». Ligne 80, « (§ 1 : `create_session` ne lui donnerait qu'un dépôt) » devient « (§ 1 : `create_session` ne lui donnerait qu'un dépôt ; en « Auto ») ».
- **Ligne 51, point 3** : « elle ne lui arrive que si elle change ce que voit un utilisateur, un coût ou un délai » devient « elle ne lui arrive que si elle change ce que voit un utilisateur, un coût, un délai ou le sens d'une règle métier ; jamais pour une autorisation (§ 7) ».
- **Ligne 54, titre** : « ## 4. Lancer un conducteur, un capitaine » devient « ## 4. Lancer un conducteur, un capitaine, une session de ticket ».
- **Ligne 56, points 2 et 8** : « Un conducteur par chantier, un capitaine par dépôt (…). Les deux se lancent par `create_session`, sur le dépôt du chantier, avec le prompt de [`references/lancement.md`](references/lancement.md) : court, par renvoi, il porte **la consigne de lecture des skills** (le plugin installé par le script de l'environnement) et **le repli** si le skill est absent. Le lire avant d'écrire un prompt. » devient « Un conducteur par chantier, un capitaine par dépôt (…, inchangé), et, hors chantier, la session d'un ticket prêt et relu par un agent neuf, où l'architecte tient la place du conducteur. Les trois se lancent par `create_session`, sur un seul dépôt, avec le prompt de [`references/lancement.md`](references/lancement.md) (un bloc par rôle) : court, par renvoi, il porte **la consigne de lecture des skills**, **le repli** si le skill est absent (l'installer soi-même) et **les consignes du produit** (§ 7). Le lire avant d'écrire un prompt. La fille d'un chantier qui a son conducteur, jamais : c'est lui qui la lance. »
- **Ligne 60** : « Puis : le conducteur dans la ligne du chantier, le capitaine dans `Capitaines:`, une ligne au journal, commit et push. » devient « Puis : le conducteur dans la ligne du chantier, le capitaine dans `Capitaines:`, la session de ticket dans `## Coût`, une ligne au journal, commit et push. »
- **Ligne 64, point 5** : « **L'architecte ne lit que les cartes** des chantiers (fiche, vagues, coût), jamais leurs tickets ni leurs PR : le tableau d'avancement d'un chantier se demande à son conducteur. » devient « **L'architecte ne lit que les cartes** des chantiers (fiche, vagues, coût), jamais leurs tickets ni leurs PR, sauf pour vérifier à la source ce qu'il annonce ou ce sur quoi il décide (§ 7) : le tableau d'avancement d'un chantier se demande à son conducteur. »
- **Ligne 66, point 3 et mineur** : « L'architecte le présente au produit pour validation, dans la forme d'une question au produit — « Lancer » · « Modifier » (dire quoi) · « Arrêter ici » — et renvoie la réponse telle quelle. Il **ne relit pas les tickets** : la relecture par un agent neuf avant la vague est le travail du conducteur. » devient « L'architecte le présente au produit pour validation, dans la forme d'une question au produit, avec sa recommandation : la réponse attendue est « Lancer » ; sinon le produit dit quoi changer, ou « Arrêter ici ». Il renvoie la réponse telle quelle. Il **ne relit pas les tickets d'un chantier** : la relecture par un agent neuf avant la vague est le travail du conducteur. Un ticket hors chantier qu'il lance lui-même, il le fait relire par un agent neuf (un sous-agent) avant le lancement et n'en lit que la conclusion (point 9). »
- **Ligne 71, point 8** : « **Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session le dit et s'arrête. » devient « **Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session installe elle-même le plugin (`references/lancement.md`) ; si l'installation échoue, elle le dit et s'arrête. » Le reste de la ligne (journal, produit prévenu, rien de contourné, `P-24`) ne change pas.
- **Une section nouvelle, avant « Ne jamais »** (points 1, 3, 4, 5, 6, 7) :

  ```markdown
  ## 7. Avancer sans demander

  Le produit, le 2026-11-14 : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » Ces deux phrases se citent mot pour mot, avec les intangibles, dans le prompt de toute session que l'architecte lance (`references/lancement.md`, ses trois blocs) ; le gabarit d'une fille de chantier (`chaine-de-production.md` § 5), que le conducteur cite, les porte aussi.

  - **Se lance sans question** : une session de ticket hors chantier, prête et relue par un agent neuf (l'architecte y tient la place du conducteur), un conducteur, un capitaine, une sonde. Le produit l'apprend après coup, par le fait et sa preuve : la session, la PR, le commit.
  - **S'ouvre sans question** : une PR qui ne porte que des tickets et de la documentation. L'architecte la pousse, l'ouvre hors brouillon, joue la vérification de `chaine-de-production.md` § 5, étape 6 (« titre (#n) » sous la limite du dépôt, et `commitlint` dans un dépôt qui l'a), pose `à-fusionner` et la nomme au capitaine. Cas vécu le 2026-11-14 : une PR de l'architecte renvoyée par le capitaine pour un titre de 121 caractères. Une PR de code reste ouverte par la session du ticket.
  - **Reste une question au produit** : une décision technique ou métier, au sens de `chaine-de-production.md` § 2 (ce que voit un utilisateur, un coût, un délai, le sens d'une règle métier), et un réglage d'environnement ou de dépôt qu'il est seul à pouvoir faire. Jamais une autorisation. Elle se pose une à la fois, pour qu'il y réponde par oui ou par non ; un découpage se présente avec sa recommandation et attend « Lancer » (§ 5).
  - **Une PR étrangère au programme**, signalée par un capitaine qui ne fusionne que ce que l'architecte lui nomme (dépôt sans la chaîne, procédure donnée dans son prompt) : l'architecte en lit le diff à la source ; sans risque et portant `à-fusionner`, il la nomme au capitaine et le dit au produit ; sinon, il le lui demande. Un capitaine du skill `fusionner` lit sa file au label et ne signale rien : il n'y a rien à nommer.
  - **Dire vrai** : avant d'annoncer une fusion, relire le diff fusionné ; avant d'affirmer un état (PR fusionnée, branche poussée, session finie), le lire à la source (GitHub, `git ls-remote`, `get_session`). Les paroles du produit se transmettent telles quelles, sans rien y ajouter.
  - **Les destinations de push s'écrivent en clair**, par l'architecte et par ses sous-agents (`git push origin <branche>`, jamais une variable) : un hook du projet qui répond « demander » passe devant le mode « Auto » et fait remonter l'outil au produit. Cas vécu le 2026-11-14 : un `git push` à destination variable, joué par un sous-agent dans un dépôt jouet.
  ```

- **« Ne jamais »** : ligne 85, « Découper un chantier en tickets, relire ses tickets, lancer une fille, coder, fusionner. » devient « Découper un chantier en tickets, relire ses tickets, lancer la fille d'un chantier qui a son conducteur, coder, fusionner. » Ligne 89, « Contourner un skill absent par une procédure dictée de mémoire, ou recopier les skills du plugin dans un projet (`P-24`). » devient « Contourner un skill absent par une procédure dictée de mémoire, ou recopier les skills du plugin dans un projet (`P-24`) ; installer le plugin par ses deux commandes n'est pas un contournement. » Deux lignes s'ajoutent à la fin de la liste : « - Demander au produit une autorisation : lancer une session prête, ouvrir une PR de documentation, pousser se font, puis se disent avec leur preuve (§ 7). » et « - Annoncer une fusion ou un état sans l'avoir lu à la source. »

La carte du programme cite les décisions par leur identifiant (`P-26` à `P-28`, `A-46`, `A-47`) ; le skill, qui sert à tous les programmes, les dit par leur fait et leur date, comme il le fait déjà pour ses cas vécus (`A/SKILL.md:90`).

**Relu en entier, et laissé tel quel** : ligne 50 (« Une question à la fois ou un tour validé en bloc ») s'accorde avec le oui ou non, un tour se présentant avec ses recommandations ; ligne 58 (un message ne fait que nommer le travail) couvre la nomination d'une PR ; ligne 65 (une question de conducteur tranchée, ou réécrite) suit le filtre ; ligne 68 (une PR livrée se nomme au capitaine) couvre les PR de documentation ; ligne 86 (aucune procédure changée par message) reste vraie, la procédure d'une session de ticket se donnant entière dans son prompt.

Estimation : 91 lignes, plus 2 (paragraphe du § 1 et sa ligne vide), plus 11 (§ 7 : titre, introduction, six puces, lignes vides), plus 2 (« Ne jamais »), soit **environ 106 lignes**, loin des 200 du test de `scripts/depot.test.mjs` (ligne 47).

### 2. `A/references/lancement.md` (44 lignes, environ 75 après)

- **Ligne 1, titre** : « # Lancer un conducteur ou un capitaine » devient « # Lancer un conducteur, un capitaine ou la session d'un ticket ».
- **Ligne 3, point 8** : « Chaque prompt porte donc deux choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`) et **le repli** : skill absent de la session, elle l'écrit à qui l'a lancée et s'arrête, sans improviser ; le hook de démarrage signale ce manque. » devient « Chaque prompt porte donc trois choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`), **le repli** et **les consignes du produit** (ci-dessous). Le repli : skill absent de la session (le hook de démarrage le signale), elle installe elle-même le plugin, puis lit le skill sous `~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md`, car un plugin installé en cours de session n'entre pas dans sa liste de skills ; si l'installation échoue, elle l'écrit à qui l'a lancée et s'arrête, sans improviser. Cas vécu le 2026-11-14 : deux sessions lancées sur un même environnement ont démarré sans le plugin, sur une machine préparée avant que le script n'en porte l'installation ; les deux commandes, jouées à la main, ont réussi. » Le reste de la ligne (aucun geste n'exige le dépôt `skills`, `add_repo` sans objet) ne change pas.
- **Ligne 13 (conducteur)**, la phrase « S'il n'est pas parmi tes skills : écris-le-moi (send_message) et arrête-toi, sans rien improviser. » devient : « S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis ~/.claude/plugins/marketplaces/maj/skills/chaine/chantier/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser. »
- **Ligne 30 (capitaine)**, la même phrase devient la même, avec `fusionner` : « … et lis ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser. »
- **Dans chacun des deux blocs**, une ligne de plus, après la ligne `Skills :` : `<les deux lignes des consignes du produit, telles quelles>`.
- **Une section nouvelle, après « Le capitaine d'un dépôt » (avant « Après le lancement »)**, point 3 du relecteur : la session d'un ticket hors chantier. Hors chantier, il n'y a ni conducteur ni sujet : le gabarit de `chaine-de-production.md` § 5 (« Session fille du chantier <nom>, conducteur », base `origin/sujet/<nom>`, questions au conducteur) ne s'y applique pas tel quel.

  ````markdown
  ## La session d'un ticket hors chantier

  `create_session` : `title` « `<Projet> <identifiant du ticket> — <objet en quelques mots>` » ; `tags` `["role:ticket", "programme:<nom>"]` (jamais `chantier:<nom>` : aucun conducteur ne la suit) ; `source_url` le dépôt du ticket ; `source_revision` sa branche d'intégration (`develop`, ou `main` dans un dépôt qui n'a pas `develop`) ; `model` celui de la ligne `Modèle:` du ticket ; `permission_mode` `"auto"`.

  ```text
  Session du ticket <identifiant>, hors chantier, programme <programme>, architecte : <session_id de cette session>.
  Skills : le plugin maj-skills est installé par le script de l'environnement ; lis et suis tout skill que le ticket ou docs/agents/chaine-de-production.md § 5 invoque (/maj-skills:revue-de-ticket à l'étape de la revue). S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis le skill sous ~/.claude/plugins/marketplaces/maj/skills/chaine/<nom du skill>/SKILL.md. Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
  <les deux lignes des consignes du produit, telles quelles>
  Ticket : <chemin du .issue.md> (branche <branche où il se lit>). Base : origin/<branche d'intégration>.
  Suis le ticket ; dans un dépôt qui a docs/agents/chaine-de-production.md, suis aussi son § 5, en lisant « l'architecte » où il dit « le conducteur » et la base ci-dessus où il dit origin/sujet/<nom>. Écris-moi (send_message) si tu es bloqué, et dès ta PR livrée, sans attendre ni les contrôles ni la fusion ; un choix non tranché se décide prudemment et se note sous ## Comments ; une question part à moi, jamais au produit. Tu livres selon la ligne Label: du ticket.
  <une ligne de situation particulière, s'il y en a une>
  ```

  L'architecte y tient la place du conducteur : il reçoit les questions et le message de livraison, contre-relit lui-même un ticket `Label: contre-revue` (par un sous-agent) avant de poser `à-fusionner`, puis nomme la PR au capitaine. La session se compte dans `## Coût` de la carte du programme (`SKILL.md` § 2).
  ````

- **Une section nouvelle encore, après celle-ci (avant « Après le lancement »)**, points 2 et 6 :

  ````markdown
  ## Les consignes du produit, dans chaque prompt

  Deux lignes, recopiées telles quelles dans le prompt de toute session que l'architecte lance, conducteur, capitaine ou session de ticket (le gabarit d'une fille de chantier, `chaine-de-production.md` § 5, les porte déjà) :

  ```text
  Le produit : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
  Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.
  ```

  C'est la seule exception à « le prompt ne recopie aucune règle » : le produit a demandé, le 2026-11-14, que ces phrases soient citées mot pour mot. Les intangibles sont des gestes de la session (§ « Le capitaine d'un dépôt », dernier paragraphe) : aucun ne juge le contenu d'une PR.

  Un capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, ne fusionne que les PR que l'architecte lui nomme : sa procédure dit qu'une demande de fusion venue d'une autre session se signale à l'architecte (`send_message`), qui lit le diff et décide (`SKILL.md` § 7). Un capitaine du skill `fusionner` lit sa file au label `à-fusionner` : rien ne lui est nommé d'avance.
  ````

- **Ligne 42, point 7** : après « … donc le produit ouvre l'architecte en mode « Auto ». », ajouter : « Une session créée par `create_session` n'a qu'un dépôt ; un architecte de programme à plusieurs dépôts n'a pas, lui, le `.claude/settings.json` d'un dépôt (ni hook ni outil autorisé d'office) : il reste en « Auto » et fait écrire dans chaque autre dépôt par une session lancée sur lui (`SKILL.md` § 1). »

### 3. `A/references/CONTENU.md` (7 lignes)

Ligne 5 : « `lancement.md` : les prompts de lancement d'un conducteur et d'un capitaine, avec la consigne de lecture des skills (le plugin installé par le script de l'environnement), son repli, et ce que le conducteur fait de chaque ligne. » devient « `lancement.md` : les prompts de lancement d'un conducteur, d'un capitaine et de la session d'un ticket hors chantier, avec la consigne de lecture des skills, son repli (installer soi-même le plugin, puis lire le skill sur le disque), les deux lignes des consignes du produit, citées dans tout prompt de lancement, et ce que le conducteur fait de chaque ligne. »

### 4. `R/docs-agents/chaine-de-production.md` (138 lignes)

- **§ 1, table des rôles, ligne 16 (Architecte)** : dans la colonne « Fait », « lance le conducteur de chaque chantier et lui répond (`send_message`) » devient « lance sans demander le conducteur de chaque chantier, le capitaine de chaque dépôt et la session d'un ticket hors chantier, et répond au conducteur (`send_message`) » ; dans la colonne « Ne fait jamais », « découper un chantier en tickets, lancer des filles, coder, fusionner » devient « découper un chantier en tickets, lancer la fille d'un chantier qui a son conducteur, coder, fusionner ». La ligne « Conducteur de chantier » (découpage, lancement des filles par vagues) ne change pas : le découpage d'un chantier et le lancement de ses filles restent au conducteur.

Le « § 2 » que cite la brève est le paragraphe « Une question au produit », lignes 42 à 51, à l'intérieur de « ## 2. Le cycle d'un chantier ».

- **§ 2, après la ligne 49 (fin de la liste), point 3**, un paragraphe qui s'ajoute au filtre sans le changer :

  > **Une autorisation n'est pas une question.** Lancer une session prête, ouvrir une PR de documentation, pousser une branche de travail se font, puis se disent après coup avec leur preuve. Le produit, le 2026-11-14 : « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » Une décision technique au sens de cette phrase est celle qui passe le filtre ci-dessus ; le sens d'une règle métier en est une aussi. La question qui passe se pose **une à la fois**, formulée pour qu'un oui ou un non suffise (« Je recommande X, parce que Y. On y va ? ») ; les options, s'il y en a, viennent après. La validation d'un découpage suit la même forme : le tableau, la recommandation, et la réponse attendue « Lancer » ; sinon le produit dit quoi changer. On vouvoie le produit, même quand il tutoie.

- **§ 5, gabarit (lignes 99 à 104), point 2** : après la ligne 102 (« Suis docs/agents/chaine-de-production.md § 5, puis le ticket. … »), deux lignes :

  ```text
  Le produit : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
  Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.
  ```

  Ce gabarit reste celui d'une fille de chantier ; la session d'un ticket hors chantier a le sien, dans `architecte/references/lancement.md`.
- **Ligne 106**, après « _Cette ligne ne redit jamais une règle de ce document._ », ajouter : « _Les deux lignes du produit sont la seule exception : elles se citent telles quelles, à sa demande (2026-11-14)._ » (la phrase sur `Label:` reste).
- **§ 5, étape 5 (ligne 115), point 8** : « S'il manque, le hook de démarrage le signale : la fille l'écrit à son conducteur (`send_message`) et s'arrête ; » devient « S'il manque, le hook de démarrage le signale : la fille l'installe elle-même (si `claude plugin marketplace list` ne rend pas `maj`, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`) et lit le skill sous `~/.claude/plugins/marketplaces/maj/skills/chaine/revue-de-ticket/SKILL.md`, un plugin installé en cours de session n'entrant pas dans sa liste de skills ; si l'installation échoue, elle l'écrit à son conducteur (`send_message`) et s'arrête ; ». La suite (PR en brouillon, jamais de PR livrée sans revue, le cas vécu) ne change pas.

### 5. `R/agent/demarrage.mjs` et son banc `R/agent/regles.test.mjs`

Sans ce point, le hook de démarrage dirait « s'arrêter » à une session dont le prompt dit « installer ».

- `demarrage.mjs:81`, le texte du signalement devient (apostrophes typographiques, comme le reste du fichier) : « `démarrage : skills de la chaîne absents de la session (plugin ${PLUGIN_CHAINE} non installé) — les installer soi-même : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; puis lire le skill sous ~/.claude/plugins/marketplaces/maj/skills/ (installé en cours de session, il n’entre pas dans la liste des skills). Le script de l’environnement doit l’installer et le mettre à jour à chaque démarrage : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; claude plugin marketplace update maj ; claude plugin update maj-skills@maj (docs/agents/chaine-de-production.md § 5, étape 5). Si l’installation échoue : le dire à qui a lancé la session et s’arrêter, sans contourner` ».
- `regles.test.mjs:235`, dans la liste des textes attendus, ajouter `'~/.claude/plugins/marketplaces/maj/skills/'` et `'Si l’installation échoue'`. Le test reste un seul test ; l'assertion `doesNotMatch(/add_repo|clone/)` (ligne 238) reste vraie.

### 6. `README.md`

Ligne 86, la description du skill `architecte` : « … lance conducteurs et capitaines avec leur procédure entière, relaie les plafonds au produit » devient « … lance sans lui demander conducteurs, capitaines et sessions de ticket prêtes, avec leur procédure entière et ses consignes, ouvre lui-même les PR de documentation, relaie les plafonds au produit ».

### 7. La version — `.claude-plugin/plugin.json`

Ligne 3 : **la mineure qui suit la version de `main` au moment du ticket**, c'est-à-dire de `origin/main` quand la session sort sa PR du brouillon (`git show origin/main:.claude-plugin/plugin.json`) : 6.1.0 donne 6.2.0 ; 6.1.1 (ticket 16 passé avant) donne 6.2.0 ; 7.0.0 (PR 74 passée avant) donne 7.1.0. Règle du `README.md`, « Ajouter un skill », étape 4 (ligne 180), qui « vaut pour tout changement de contenu » (ligne 182) : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat ». Ce ticket n'est pas une correction : il ajoute une conduite (lancer sans demander, PR de documentation) et un gabarit (la session d'un ticket hors chantier, les consignes du produit) ; il ne retire aucun contrat sur lequel un projet compte (aucun gate, aucun script, aucune clé de `chaine.json`). Précédent : la PR 73, conduite nouvelle des plafonds, 6.0.0 vers 6.1.0.

### Ce qui ne change pas, vérifié

- `skills/chaine/chantier/SKILL.md:75` cite le gabarit de § 5 « par renvoi et non recopié » : le conducteur reçoit les deux lignes nouvelles sans que son skill change ; `:123` (« Recopier les règles dans un prompt de fille ») ne vise pas une citation que le gabarit porte lui-même.
- `skills/chaine/fusionner/SKILL.md` : la file se lit par le label `à-fusionner` (lignes 3, 20, 60), sans nomination ; un capitaine posé avec la chaîne n'a rien à apprendre du point 6.
- `skills/chaine/socle-chaine-de-production/SKILL.md:35` et `R/CONTENU.md:13` disent le signalement « avec le remède de `chaine-de-production.md` § 5, étape 5 » : toujours vrai.

## Décisions

- `P-26`, `P-27`, `P-28`, `A-46`, `A-47` de la carte du programme, reportées dans le plugin.
- **Trois extensions viennent de l'architecte, pas du produit**, et se gardent : la « sonde » parmi ce qui se lance sans question (`P-26` ne nomme que la session de ticket, le conducteur et le capitaine ; une sonde est une session de constat, sans écriture, lancée trois fois le 2026-11-14) ; « sinon il le lui demande » pour une PR étrangère qui n'est pas sans risque (`A-47` ne dit que le cas où elle l'est) ; les deux phrases et les intangibles dans le prompt de **toute** session lancée (`P-28` dit « chaque prompt de session fille »), parce qu'un conducteur ou un capitaine qui demande une autorisation fait remonter la même question au produit.
- **Pas de fichier de référence nouveau** : le skill passe d'environ 91 à 106 lignes, loin des 200 ; une section courte (§ 7) se lit mieux qu'un renvoi. `references/consignes-du-produit.md` ne se crée que si une suite fait passer le skill au-dessus de 150 lignes.
- **Le repli d'installation est durable**, pas « tant que » comme le prévoyait `A-46` : il est idempotent, sans effet sur l'environnement, et le seuil de retrait (« deux filles de suite ») ne se constate qu'à la main. Il entre donc aussi dans le hook de démarrage (point 5), pour que le hook et le prompt disent la même chose.
- **Une session de ticket hors chantier se lance par l'architecte**, avec son propre gabarit (`lancement.md`, troisième bloc) : celui du § 5 suppose un conducteur et un sujet. La fille d'un chantier conduit, jamais : la description, la ligne 85 et la table des rôles (`chaine-de-production.md:16`) le précisent.
- **Le mode et les dépôts** (point 7) : `P-28` (point 6 de Fedora) dit que la documentation doit dire que « l'architecte et le capitaine se lancent en « Auto » sur le seul dépôt ». Le ticket l'écrit ainsi : un architecte de projet est ouvert sur le seul dépôt du projet ; un architecte de programme à plusieurs dépôts sait que le `.claude/settings.json` d'un dépôt ne s'applique pas à sa session, n'en tire ni hook ni outil autorisé d'office, reste en « Auto » et fait écrire dans chaque autre dépôt par une session lancée sur lui ; un capitaine, lancé par `create_session`, n'a jamais qu'un dépôt. Seul le mode fait un **écart** à dire au produit (une session hors « Auto ») : les dépôts n'en font pas, puisque `A/SKILL.md:27` demande « un clone de chacun » des dépôts du programme et que ce programme-ci en a deux (`skills` et `anchorpost`).
- **« Décisions techniques »** de la phrase du produit se lit à travers le filtre de § 2 (la conséquence pour lui) : un choix purement technique reste tranché par la session et écrit en `A-n`, comme aujourd'hui.
- **Oui ou non, et la validation d'un découpage** : une question se pose pour qu'un oui ou un non suffise ; un découpage reste présenté avec sa recommandation, et la réponse attendue est « Lancer », sinon le produit dit quoi changer. Les trois options « Lancer · Modifier · Arrêter ici » de `A/SKILL.md:66` se réécrivent ainsi.
- **`--no-verify` et le ticket 16** : les intangibles disent « jamais --no-verify », alors que le plugin le pousse encore (`skills/chaine/fusionner/scripts/passer.sh:194` et `:208`, et `skills/chaine/sujet/scripts/sujet.sh`) tant que le ticket 16 n'est pas livré. **Ordre retenu : le 16 avant le 18.** Raison : un capitaine dont le prompt porte « jamais --no-verify » peut refuser de jouer un `passer.sh` qui le contient, et fusionner hors procédure, comme la session de Fedora le 2026-11-13. L'inverse ne casse rien dans le plugin (les fichiers des deux tickets sont disjoints, `plugin.json` excepté, et la version se calcule sur `main`) : si le 18 entre le premier, l'architecte ne lance pas de capitaine avec la ligne des intangibles sur un dépôt dont `passer.sh` pousse encore `--no-verify` (dans un projet, jusqu'à la repose du socle qui suit le 16).
- Aucune dépendance nouvelle.

## Surfaces

| Surface | Preuve |
| --- | --- |
| les deux phrases dans les gabarits | `grep -c "arrête de me demander des autorisations fais tout ce qu'il faut pour avancer" skills/chaine/architecte/references/lancement.md skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md skills/chaine/architecte/SKILL.md` rend au moins 1 pour chacun ; même commande avec « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » ; dans `chaine-de-production.md`, `sed -n '/^## 5\./,/^Déroulé/p' … \| grep -c "arrête de me demander"` rend 1 (le gabarit de la fille) ; `grep -c "<les deux lignes des consignes du produit, telles quelles>" skills/chaine/architecte/references/lancement.md` rend 3 (les trois blocs) |
| les intangibles | `grep -c "Intangibles : jamais --no-verify" skills/chaine/architecte/references/lancement.md skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` rend 1 et 1 |
| la session d'un ticket hors chantier | `grep -n "^## La session d'un ticket hors chantier" skills/chaine/architecte/references/lancement.md` rend une ligne ; dans ce bloc, `Tu livres selon la ligne Label: du ticket` et `"auto"` |
| le repli d'installation | `grep -c "claude plugin install maj-skills@maj" skills/chaine/architecte/references/lancement.md` rend au moins 3 (les trois gabarits) ; `grep -n "<chantier|fusionner>" skills/chaine/architecte/references/lancement.md` ne rend rien ; `grep -n "plugins/marketplaces/maj/skills/chaine" skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` rend l'étape 5 ; plus aucun « S'il n'est pas parmi tes skills : écris-le-moi » dans `lancement.md` |
| le hook de démarrage | `regles.test.mjs` : le signalement contient le chemin et « Si l’installation échoue » |
| le skill sous 200 lignes | `wc -l skills/chaine/architecte/SKILL.md` sous 120 (environ 106 attendues) ; le test « aucun SKILL.md ne dépasse 200 lignes » de `scripts/depot.test.mjs` vert |
| la conduite | `grep -n "^## 7. Avancer sans demander" skills/chaine/architecte/SKILL.md` rend une ligne ; `grep -n "lancer une fille," skills/chaine/architecte/SKILL.md` ne rend rien ; `grep -n "lancer des filles" skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` ne rend rien ; `grep -n "sauf pour vérifier à la source\|sauf pour lire à la source" skills/chaine/architecte/SKILL.md` rend les lignes des points 5 et 12 ; `grep -n "sur le seul dépôt du projet" skills/chaine/architecte/SKILL.md` ne rend que la phrase de l'architecte de projet |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit celle de `origin/main` |

## Vérification

- `pnpm test` vert. À `ba0f550` : **387 tests**, tous verts (joué le 2026-11-14 dans un arbre extrait de `ba0f550`, `node --test` sur les motifs du script `test`). Ce ticket n'ajoute ni ne retire de test (il complète celui du signalement) : **387** attendus, plus ceux que le ticket 16 ou la PR 74 auraient ajoutés ou retirés s'ils ont fusionné avant. Aucun test désactivé.
- Ce dépôt n'a pas de gate des tickets ni de `commitlint` : ce ticket n'est contrôlé que par sa relecture et ses surfaces.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Hors périmètre

- **Les plafonds de session et le passage de main** (`A/SKILL.md:67` et `:75`, refaits par la PR 73 ; la PR 74 touche aux seuils du conducteur) : non touchés, non contredits.
- **Les scripts de fusion et les hooks git** (`passer.sh`, `sujet.sh`, `develop.sh`, les hooks husky), et donc le `--no-verify` qu'ils poussent encore : ticket 16, à livrer avant celui-ci (Décisions). Seul fichier partagé avec lui : `.claude-plugin/plugin.json`, ligne 3 (point 7).
- **Les dépôts de projet** : leur copie de `docs/agents/chaine-de-production.md`, posée par le socle, ne reçoit le § 1, le § 2 et le § 5 nouveaux qu'à une repose du socle ; les outils de coordination autorisés d'office dans le `.claude/settings.json` d'`anchorpost` (`P-28`, point 6) ; le hook d'`anchorpost` qui « demande » au lieu de refuser (`SPEC_ALL_SOC-1.15`).
- La publication de la CLI d'`anchorpost` (`P-28`) : propre à ce dépôt, elle vit dans son `docs/agents/admin.md`.
- Un test du dépôt qui garderait les deux phrases dans les gabarits : utile, mais `scripts/depot.test.mjs` est un fichier chaud du ticket 16 ; les `grep` des surfaces suffisent ici.

## Comments

- 2026-11-14 — Écrit par un rédacteur (sous-agent) depuis `main` à `ba0f550` (plugin 6.1.0, 387 tests rejoués). Huit fichiers, aucun créé. Le point 6 ne touche pas `fusionner/SKILL.md` : un capitaine posé avec la chaîne fait passer toute PR étiquetée et ne connaît pas de nomination ; seul le capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, l'apprend par `lancement.md`.
- 2026-11-14 — **Point à confirmer par l'architecte avant le lancement** : « un seul dépôt par session d'architecte » (point 7) suit `P-28` à la lettre, mais ce programme a lui-même travaillé sur deux dépôts depuis une session (carte dans `skills`, tickets et PR de documentation dans `anchorpost`). Si la règle doit tolérer un second dépôt cloné dans la session, ou si une session sur un seul dépôt peut pousser dans un autre, la phrase du § 1 se réécrit ; non vérifié par le rédacteur. _(tranché par la correction du 2026-11-14 ci-dessous : architecte de projet sur un dépôt, architecte de programme sur plusieurs.)_
- 2026-11-14 — Non vérifié : le nom du champ de `get_session` qui rend le mode de permission d'une session (le § 1 nouveau dit seulement « un écart se dit au produit ») ; la limite de 120 caractères ne vaut que là où la chaîne est posée, d'où « la limite du dépôt ».
- 2026-11-14 — Relu par un agent neuf : « pas prêt ». Corrections reportées par un correcteur (sous-agent), `main` relevé à `ba0f550`, plugin 6.1.0, PR 74 non entrée : les contradictions laissées dans le skill et la table des rôles (lignes 12, 28, 51, 56, 60, 64, 66, 89, description, `chaine-de-production.md:16`) sont corrigées, « un seul dépôt » devient la distinction entre architecte de projet et architecte de programme, la session d'un ticket hors chantier reçoit son bloc dans `lancement.md`, et les mineurs (noms de skill en clair dans les deux blocs, oui ou non et « Lancer », capitaine qui nomme, `--no-verify` et l'ordre 16 puis 18, extensions de l'architecte, règle de version) sont écrits. Toujours huit fichiers, aucun créé ; le skill passe à environ 106 lignes. Non vérifié : le tag `role:ticket` n'existe encore nulle part (aucune session ne le cherche), et la conduite d'un capitaine devant `passer.sh` après la ligne des intangibles n'a pas été jouée.
