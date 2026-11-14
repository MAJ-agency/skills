# L'architecte lance sans demander, et les consignes du produit entrent dans chaque prompt de lancement, plugin 6.2.0

Status: ready-for-agent
Type: feature
Modèle: sonnet — tous les textes à écrire sont donnés ci-dessous, mot pour mot ou par leur plan précis ; rien n'est à concevoir.
Blocked by: —
Fichiers chauds: `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `README.md`, `.claude-plugin/plugin.json`

## Le besoin

Le 2026-11-14, le produit a donné à l'architecte de ce programme une série de consignes sur sa façon de travailler. Elles ne sont écrites que dans la carte du programme (`docs/issues/gouverner-nos-boucles/map.md`, décisions `P-26`, `P-27`, `P-28` et `A-46` ; `A-47` dans le journal, 9 h 26 UTC) :

- `P-26` : à la question « est-ce que je lance la session du ticket `SPEC_ALL_SOC-1.18` ? », le produit a répondu « oui lance tout tu es architecte ». Une session de ticket prête et relue, un conducteur, un capitaine se lancent sans question ; l'architecte le dit après coup, avec le fait et la preuve.
- `P-27` : « oui ouvre les PR de doc toi-même ». L'architecte ouvre les PR qui ne portent que des tickets et de la documentation, pose le label, les nomme au capitaine.
- `P-28` : deux phrases du produit à citer mot pour mot dans chaque prompt de session lancée, la forme des messages au produit, et la liste des intangibles.
- `A-46` : une session lancée peut démarrer sans le plugin ; son prompt lui dit de l'installer elle-même.
- `A-47` : une PR étrangère au programme, signalée par un capitaine, se nomme quand son diff est lu, sans risque, et qu'elle porte le label.

Le même jour, un architecte lancé sur un autre programme, sans ces consignes, a demandé au produit l'autorisation de lancer un capitaine : exactement ce que le produit ne veut plus. Sa session était ouverte hors du mode « Auto » et sur deux dépôts (carte, section « Demandes d'autorisation relevées », ligne du 2026-11-14 à 9 h 42 UTC).

Quand le ticket est fait, tout architecte applique ces consignes dès son démarrage, parce que son skill les porte ; toute session qu'il lance (conducteur, capitaine, session de ticket) reçoit dans son prompt les deux phrases du produit et les intangibles ; une session lancée sans le plugin l'installe elle-même au lieu de s'arrêter.

## Où

Lignes de `main` à `ba0f550` (2026-11-14, plugin 6.1.0), toutes relues dans le plugin installé (`~/.claude/plugins/marketplaces/maj/`, `git log -1` = `ba0f550`). `R` abrège `skills/chaine/socle-chaine-de-production/references`, `A` abrège `skills/chaine/architecte`.

### Ce que le skill 6.1.0 dit déjà, et qui ne se redit pas

| Point | Déjà dit | Où |
| --- | --- | --- |
| 1. lancer sans demander | non : § 4 dit comment lancer, jamais qu'on ne demande pas ; la description (ligne 3) et « Ne jamais » (ligne 85) interdisent de « lancer une fille », alors que la section Coût (ligne 43) compte déjà les « sessions de ticket qu'il lance lui-même » | `A/SKILL.md:3,43,56,85` |
| 2. les deux phrases dans les prompts | non : aucun des trois gabarits ne les porte | `A/references/lancement.md:11-16,28-32`, `R/docs-agents/chaine-de-production.md:99-104` |
| 3. ce qui reste une question | en partie : le filtre (« ne lui arrive que si elle a une conséquence pour lui »), la recommandation d'abord, une seule décision, aucun terme technique | `R/docs-agents/chaine-de-production.md:42-51` ; `A/SKILL.md:51` y renvoie |
| 3. bis : oui ou non, vouvoiement, le sens d'une règle métier, « une autorisation n'est pas une question » | non | — |
| 4. PR de documentation par l'architecte | non ; la vérification du titre existe pour une fille seulement (étape 6) | `R/docs-agents/chaine-de-production.md:116` |
| 5. relire le diff, vérifier à la source, transmettre tel quel | en partie : la réponse du produit « telle quelle » vers un conducteur (découpage, plafond) | `A/SKILL.md:66,67` |
| 6. PR étrangère au programme | non ; `fusionner/SKILL.md` fait passer toute PR qui porte `à-fusionner` et ne connaît pas de nomination : seul un capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, ne fusionne que ce qu'on lui nomme | `A/references/lancement.md:31,34` |
| 7. mode « Auto », un seul dépôt, hook qui demande | en partie : « une session lancée ne peut pas avoir un mode plus permissif que celle qui la lance, donc le produit ouvre l'architecte en mode « Auto » » ; rien sur le dépôt unique ni sur le hook ; § 1 dit au contraire que la session de suite « a besoin de tous les dépôts » | `A/references/lancement.md:42` ; `A/SKILL.md:33,80` |
| 8. installer le plugin soi-même | non : depuis le ticket 13 (PR 70), le repli est « skill absent, la session l'écrit à qui l'a lancée et s'arrête » ; le hook de démarrage dit pareil | `A/references/lancement.md:3,13,30` ; `A/SKILL.md:71` ; `R/docs-agents/chaine-de-production.md:115` ; `R/agent/demarrage.mjs:81` |
| 9. déléguer lecture et écriture | en partie : « Cette session ne tient que ce rôle : un deck, une étude, une contre-revue longue partent dans une autre session ou un sous-agent » | `A/SKILL.md:10` |

Les plafonds et le passage de main (`A/SKILL.md:67` : un plafond se signale, aucune session n'est interrompue ; `:75` : l'architecte n'a pas de plafond, seul le produit décide de changer d'architecte) sont refaits par la PR 73 : ce ticket ne les touche pas et ne les contredit pas.

### 1. `A/SKILL.md` (91 lignes à `ba0f550`, environ 110 après)

- **Ligne 3, description** : « Ne découpe pas, ne lance pas de fille, ne code pas, ne fusionne pas. » devient « Lance sans demander au produit les sessions prêtes et ouvre lui-même les PR de documentation, et ne lui pose que des décisions. Ne découpe pas, ne lance pas la fille d'un chantier qui a son conducteur, ne code pas, ne fusionne pas. »
- **Ligne 10, point 9** : après « … partent dans une autre session ou un sous-agent. », ajouter : « Le travail de lecture et d'écriture aussi : relevés, rédaction et reprise de tickets, relectures par un agent neuf, contre-revues vont à des sous-agents. L'architecte n'en lit que la conclusion et vérifie à la source les faits sur lesquels il décide. »
- **Après la ligne 33, point 7**, un paragraphe :

  > **Le mode et le dépôt de la session.** Le produit ouvre l'architecte en mode « Auto », sur le seul dépôt du projet, et l'architecte lance chaque capitaine de même (`references/lancement.md`). Une session à plusieurs dépôts ne lit pas le `.claude/settings.json` du projet (ni ses hooks ni ses outils autorisés d'office), et une session hors « Auto » fait remonter chaque outil au produit. Cas vécu le 2026-11-14 : un architecte ouvert hors « Auto » et sur deux dépôts a demandé au produit l'autorisation de lancer un capitaine. Un écart (mode, dépôts) se dit au produit en un message, avec le remède : rouvrir la session en « Auto », sur un seul dépôt. Un programme sur plusieurs dépôts garde sa carte dans l'un ; ce qui s'écrit dans un autre dépôt part dans une session lancée sur lui.

  Puis, à la même ligne 33, « La session de suite de l'architecte, qui a besoin de tous les dépôts, est donc ouverte par le produit depuis l'application » devient « La session de suite de l'architecte est donc ouverte par le produit depuis l'application, en « Auto », sur le dépôt de la carte ». Ligne 80, « (§ 1 : `create_session` ne lui donnerait qu'un dépôt) » devient « (§ 1 : en « Auto », sur le dépôt de la carte) ».
- **Ligne 56, point 2** : « il porte **la consigne de lecture des skills** (le plugin installé par le script de l'environnement) et **le repli** si le skill est absent » devient « il porte **la consigne de lecture des skills**, **le repli** si le skill est absent (l'installer soi-même) et **les consignes du produit** (§ 7) ».
- **Ligne 71, point 8** : « **Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session le dit et s'arrête. » devient « **Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session installe elle-même le plugin (`references/lancement.md`) ; si l'installation échoue, elle le dit et s'arrête. » Le reste de la ligne (journal, produit prévenu, rien de contourné, `P-24`) ne change pas.
- **Une section nouvelle, avant « Ne jamais »** (points 1, 3, 4, 5, 6, 7) :

  ```markdown
  ## 7. Avancer sans demander

  Le produit, le 2026-11-14 : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » Ces deux phrases se citent mot pour mot, avec les intangibles, dans le prompt de toute session que l'architecte lance (`references/lancement.md` ; pour une session de ticket, `chaine-de-production.md` § 5).

  - **Se lance sans question** : une session de ticket prête et relue (hors chantier, l'architecte y tient la place du conducteur), un conducteur, un capitaine, une sonde. Le produit l'apprend après coup, par le fait et sa preuve : la session, la PR, le commit.
  - **S'ouvre sans question** : une PR qui ne porte que des tickets et de la documentation. L'architecte la pousse, l'ouvre hors brouillon, joue la vérification de `chaine-de-production.md` § 5, étape 6 (« titre (#n) » sous la limite du dépôt, et `commitlint` dans un dépôt qui l'a), pose `à-fusionner` et la nomme au capitaine. Cas vécu le 2026-11-14 : une PR de l'architecte renvoyée par le capitaine pour un titre de 121 caractères. Une PR de code reste ouverte par la session du ticket.
  - **Reste une question au produit** : une décision technique ou métier, au sens de `chaine-de-production.md` § 2 (ce que voit un utilisateur, un coût, un délai, le sens d'une règle métier), et un réglage d'environnement ou de dépôt qu'il est seul à pouvoir faire. Jamais une autorisation.
  - **Une PR étrangère au programme**, signalée par un capitaine : l'architecte en lit le diff à la source ; sans risque et portant `à-fusionner`, il la nomme au capitaine et le dit au produit ; sinon, il le lui demande.
  - **Dire vrai** : avant d'annoncer une fusion, relire le diff fusionné ; avant d'affirmer un état (PR fusionnée, branche poussée, session finie), le lire à la source (GitHub, `git ls-remote`, `get_session`). Les paroles du produit se transmettent telles quelles, sans rien y ajouter.
  - **Les destinations de push s'écrivent en clair**, par l'architecte et par ses sous-agents (`git push origin <branche>`, jamais une variable) : un hook du projet qui répond « demander » passe devant le mode « Auto » et fait remonter l'outil au produit. Cas vécu le 2026-11-14 : un `git push` à destination variable, joué par un sous-agent dans un dépôt jouet.
  ```

- **« Ne jamais »** : ligne 85, « lancer une fille » devient « lancer la fille d'un chantier qui a son conducteur ». Deux lignes s'ajoutent à la fin de la liste : « - Demander au produit une autorisation : lancer une session prête, ouvrir une PR de documentation, pousser se font, puis se disent avec leur preuve (§ 7). » et « - Annoncer une fusion ou un état sans l'avoir lu à la source. »

La carte du programme cite les décisions par leur identifiant (`P-26` à `P-28`, `A-46`, `A-47`) ; le skill, qui sert à tous les programmes, les dit par leur fait et leur date, comme il le fait déjà pour ses cas vécus (`A/SKILL.md:90`).

### 2. `A/references/lancement.md` (44 lignes)

- **Ligne 3, point 8** : « Chaque prompt porte donc deux choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`) et **le repli** : skill absent de la session, elle l'écrit à qui l'a lancée et s'arrête, sans improviser ; le hook de démarrage signale ce manque. » devient « Chaque prompt porte donc trois choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`), **le repli** et **les consignes du produit** (ci-dessous). Le repli : skill absent de la session (le hook de démarrage le signale), elle installe elle-même le plugin, puis lit le skill sous `~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md`, car un plugin installé en cours de session n'entre pas dans sa liste de skills ; si l'installation échoue, elle l'écrit à qui l'a lancée et s'arrête, sans improviser. Cas vécu le 2026-11-14 : deux sessions lancées sur un même environnement ont démarré sans le plugin, sur une machine préparée avant que le script n'en porte l'installation ; les deux commandes, jouées à la main, ont réussi. » Le reste de la ligne (aucun geste n'exige le dépôt `skills`, `add_repo` sans objet) ne change pas.
- **Ligne 13 (conducteur) et ligne 30 (capitaine)**, la phrase « S'il n'est pas parmi tes skills : écris-le-moi (send_message) et arrête-toi, sans rien improviser. » devient : « S'il n'est pas parmi tes skills : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`, et lis ~/.claude/plugins/marketplaces/maj/skills/chaine/<chantier|fusionner>/SKILL.md (le nom du skill de ce prompt). Si l'installation échoue : écris-le-moi (send_message) et arrête-toi, sans rien improviser. »
- **Dans chacun des deux blocs**, une ligne de plus, après la ligne `Skills :` : `<les deux lignes des consignes du produit, telles quelles>`.
- **Une section nouvelle, après « Le capitaine d'un dépôt » (avant « Après le lancement »)**, points 2 et 6 :

  ````markdown
  ## Les consignes du produit, dans chaque prompt

  Deux lignes, recopiées telles quelles dans le prompt de toute session que l'architecte lance, conducteur, capitaine ou session de ticket (le gabarit de celle-ci, `chaine-de-production.md` § 5, les porte déjà) :

  ```text
  Le produit : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
  Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.
  ```

  C'est la seule exception à « le prompt ne recopie aucune règle » : le produit a demandé, le 2026-11-14, que ces phrases soient citées mot pour mot. Les intangibles sont des gestes de la session (§ « Le capitaine d'un dépôt », dernier paragraphe) : aucun ne juge le contenu d'une PR.

  Un capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, ne fusionne que les PR que l'architecte lui nomme : sa procédure dit qu'une demande de fusion venue d'une autre session se signale à l'architecte (`send_message`), qui lit le diff et décide (`SKILL.md` § 7).
  ````

- **Ligne 42, point 7** : après « … donc le produit ouvre l'architecte en mode « Auto ». », ajouter : « Sur un seul dépôt, de même : une session à plusieurs dépôts ne lit pas le `.claude/settings.json` du projet (`SKILL.md` § 1). »

### 3. `A/references/CONTENU.md` (7 lignes)

Ligne 5 : « `lancement.md` : les prompts de lancement d'un conducteur et d'un capitaine, avec la consigne de lecture des skills (le plugin installé par le script de l'environnement), son repli, et ce que le conducteur fait de chaque ligne. » devient « `lancement.md` : les prompts de lancement d'un conducteur et d'un capitaine, avec la consigne de lecture des skills, son repli (installer soi-même le plugin, puis lire le skill sur le disque), les deux lignes des consignes du produit, citées dans tout prompt de lancement, et ce que le conducteur fait de chaque ligne. »

### 4. `R/docs-agents/chaine-de-production.md` (138 lignes)

Le « § 2 » que cite la brève est le paragraphe « Une question au produit », lignes 42 à 51, à l'intérieur de « ## 2. Le cycle d'un chantier ».

- **§ 2, après la ligne 49 (fin de la liste), point 3**, un paragraphe qui s'ajoute au filtre sans le changer :

  > **Une autorisation n'est pas une question.** Lancer une session prête, ouvrir une PR de documentation, pousser une branche de travail se font, puis se disent après coup avec leur preuve. Le produit, le 2026-11-14 : « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » Une décision technique au sens de cette phrase est celle qui passe le filtre ci-dessus ; le sens d'une règle métier en est une aussi. La question qui passe se pose **une à la fois**, formulée pour qu'un oui ou un non suffise (« Je recommande X, parce que Y. On y va ? ») ; les options, s'il y en a, viennent après. On vouvoie le produit, même quand il tutoie.

- **§ 5, gabarit (lignes 99 à 104), point 2** : après la ligne 102 (« Suis docs/agents/chaine-de-production.md § 5, puis le ticket. … »), deux lignes :

  ```text
  Le produit : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
  Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.
  ```

- **Ligne 106**, après « _Cette ligne ne redit jamais une règle de ce document._ », ajouter : « _Les deux lignes du produit sont la seule exception : elles se citent telles quelles, à sa demande (2026-11-14)._ » (la phrase sur `Label:` reste).
- **§ 5, étape 5 (ligne 115), point 8** : « S'il manque, le hook de démarrage le signale : la fille l'écrit à son conducteur (`send_message`) et s'arrête ; » devient « S'il manque, le hook de démarrage le signale : la fille l'installe elle-même (si `claude plugin marketplace list` ne rend pas `maj`, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj`) et lit le skill sous `~/.claude/plugins/marketplaces/maj/skills/chaine/revue-de-ticket/SKILL.md`, un plugin installé en cours de session n'entrant pas dans sa liste de skills ; si l'installation échoue, elle l'écrit à son conducteur (`send_message`) et s'arrête ; ». La suite (PR en brouillon, jamais de PR livrée sans revue, le cas vécu) ne change pas.

### 5. `R/agent/demarrage.mjs` et son banc `R/agent/regles.test.mjs`

Sans ce point, le hook de démarrage dirait « s'arrêter » à une session dont le prompt dit « installer ».

- `demarrage.mjs:81`, le texte du signalement devient (apostrophes typographiques, comme le reste du fichier) : « `démarrage : skills de la chaîne absents de la session (plugin ${PLUGIN_CHAINE} non installé) — les installer soi-même : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; puis lire le skill sous ~/.claude/plugins/marketplaces/maj/skills/ (installé en cours de session, il n’entre pas dans la liste des skills). Le script de l’environnement doit l’installer et le mettre à jour à chaque démarrage : claude plugin marketplace add MAJ-agency/skills ; claude plugin install maj-skills@maj ; claude plugin marketplace update maj ; claude plugin update maj-skills@maj (docs/agents/chaine-de-production.md § 5, étape 5). Si l’installation échoue : le dire à qui a lancé la session et s’arrêter, sans contourner` ».
- `regles.test.mjs:235`, dans la liste des textes attendus, ajouter `'~/.claude/plugins/marketplaces/maj/skills/'` et `'Si l’installation échoue'`. Le test reste un seul test ; l'assertion `doesNotMatch(/add_repo|clone/)` (ligne 238) reste vraie.

### 6. `README.md`

Ligne 86, la description du skill `architecte` : « … lance conducteurs et capitaines avec leur procédure entière, relaie les plafonds au produit » devient « … lance sans lui demander conducteurs, capitaines et sessions prêtes, avec leur procédure entière et ses consignes, ouvre lui-même les PR de documentation, relaie les plafonds au produit ».

### 7. La version — `.claude-plugin/plugin.json`

Ligne 3 : la version qui suit celle de `main`, **mineure** : `6.2.0`, que `main` soit en 6.1.0 ou en 6.1.1 (ticket 16 passé avant). Règle du `README.md`, « Ajouter un skill », étape 4 (ligne 180) : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat ». Ce ticket n'est pas une correction : il ajoute une conduite (lancer sans demander, PR de documentation) et une section de gabarit (les consignes du produit) ; il ne retire aucun contrat sur lequel un projet compte (aucun gate, aucun script, aucune clé de `chaine.json`). Précédent : la PR 73, conduite nouvelle des plafonds, 6.0.0 vers 6.1.0. Avant de sortir la PR du brouillon, la session lit `git show origin/main:.claude-plugin/plugin.json` : si la version n'y est ni 6.1.0 ni 6.1.1, elle l'écrit à l'architecte et s'arrête.

### Ce qui ne change pas, vérifié

- `skills/chaine/chantier/SKILL.md:75` cite le gabarit de § 5 « par renvoi et non recopié » : le conducteur reçoit les deux lignes nouvelles sans que son skill change ; `:123` (« Recopier les règles dans un prompt de fille ») ne vise pas une citation que le gabarit porte lui-même.
- `skills/chaine/fusionner/SKILL.md` : la file se lit par le label `à-fusionner` (lignes 3, 20, 60), sans nomination ; un capitaine posé avec la chaîne n'a rien à apprendre du point 6.
- `skills/chaine/socle-chaine-de-production/SKILL.md:35` et `R/CONTENU.md:13` disent le signalement « avec le remède de `chaine-de-production.md` § 5, étape 5 » : toujours vrai.

## Décisions

- `P-26`, `P-27`, `P-28`, `A-46`, `A-47` de la carte du programme, reportées dans le plugin.
- **Pas de fichier de référence nouveau** : le skill passe d'environ 91 à 110 lignes, loin des 200 ; une section courte (§ 7) se lit mieux qu'un renvoi. `references/consignes-du-produit.md` ne se crée que si une suite fait passer le skill au-dessus de 150 lignes.
- **Le repli d'installation est durable**, pas « tant que » comme le prévoyait `A-46` : il est idempotent, sans effet sur l'environnement, et le seuil de retrait (« deux filles de suite ») ne se constate qu'à la main. Il entre donc aussi dans le hook de démarrage (point 5), pour que le hook et le prompt disent la même chose.
- **Une session de ticket hors chantier se lance par l'architecte** (cas de ce programme pour les tickets de `skills`) ; la fille d'un chantier conduit, jamais : la ligne 85 et la description le précisent.
- **Un seul dépôt par session d'architecte** (point 7) ; un programme sur plusieurs dépôts garde sa carte dans l'un, et ce qui s'écrit ailleurs part dans une session lancée sur l'autre dépôt.
- **« Décisions techniques »** de la phrase du produit se lit à travers le filtre de § 2 (la conséquence pour lui) : un choix purement technique reste tranché par la session et écrit en `A-n`, comme aujourd'hui.
- Aucune dépendance nouvelle.

## Surfaces

| Surface | Preuve |
| --- | --- |
| les deux phrases dans les trois gabarits | `grep -c "arrête de me demander des autorisations fais tout ce qu'il faut pour avancer" skills/chaine/architecte/references/lancement.md skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md skills/chaine/architecte/SKILL.md` rend au moins 1 pour chacun ; même commande avec « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » ; dans `chaine-de-production.md`, `sed -n '/^## 5\./,/^Déroulé/p' … \| grep -c "arrête de me demander"` rend 1 (le gabarit de la fille) |
| les intangibles | `grep -c "Intangibles : jamais --no-verify" skills/chaine/architecte/references/lancement.md skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` rend 1 et 1 |
| le repli d'installation | `grep -n "claude plugin install maj-skills@maj" skills/chaine/architecte/references/lancement.md` rend les lignes des deux gabarits ; `grep -n "plugins/marketplaces/maj/skills/chaine" skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` rend l'étape 5 ; plus aucun « S'il n'est pas parmi tes skills : écris-le-moi » dans `lancement.md` |
| le hook de démarrage | `regles.test.mjs` : le signalement contient le chemin et « Si l’installation échoue » |
| le skill sous 200 lignes | `wc -l skills/chaine/architecte/SKILL.md` sous 120 ; le test « aucun SKILL.md ne dépasse 200 lignes » de `scripts/depot.test.mjs` vert |
| la conduite | `grep -n "^## 7. Avancer sans demander" skills/chaine/architecte/SKILL.md` rend une ligne ; `grep -n "lancer une fille," skills/chaine/architecte/SKILL.md` ne rend rien |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version": "6.2.0"` |

## Vérification

- `pnpm test` vert. À `ba0f550` : **387 tests**, tous verts (joué le 2026-11-14 dans un arbre extrait de `ba0f550`, `node --test` sur les motifs du script `test`). Ce ticket n'ajoute ni ne retire de test (il complète celui du signalement) : **387** attendus, plus ceux que le ticket 16 aurait ajoutés s'il a fusionné avant. Aucun test désactivé.
- Ce dépôt n'a pas de gate des tickets ni de `commitlint` : ce ticket n'est contrôlé que par sa relecture et ses surfaces.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Hors périmètre

- **Les plafonds de session et le passage de main** (`A/SKILL.md:67` et `:75`, refaits par la PR 73) : non touchés, non contredits.
- **Les scripts de fusion et les hooks git** (`passer.sh`, `sujet.sh`, `develop.sh`, les hooks husky) : ticket 16. Seul fichier partagé avec lui : `.claude-plugin/plugin.json`, ligne 3 (point 7).
- **Les dépôts de projet** : leur copie de `docs/agents/chaine-de-production.md`, posée par le socle, ne reçoit le § 2 et le § 5 nouveaux qu'à une repose du socle ; les outils de coordination autorisés d'office dans le `.claude/settings.json` d'`anchorpost` (`P-28`, point 6) ; le hook d'`anchorpost` qui « demande » au lieu de refuser (`SPEC_ALL_SOC-1.15`).
- La publication de la CLI d'`anchorpost` (`P-28`) : propre à ce dépôt, elle vit dans son `docs/agents/admin.md`.
- Un test du dépôt qui garderait les deux phrases dans les gabarits : utile, mais `scripts/depot.test.mjs` est un fichier chaud du ticket 16 ; les `grep` des surfaces suffisent ici.

## Comments

- 2026-11-14 — Écrit par un rédacteur (sous-agent) depuis `main` à `ba0f550` (plugin 6.1.0, 387 tests rejoués). Huit fichiers, aucun créé. Le point 6 ne touche pas `fusionner/SKILL.md` : un capitaine posé avec la chaîne fait passer toute PR étiquetée et ne connaît pas de nomination ; seul le capitaine d'un dépôt sans la chaîne, dont la procédure est dans le prompt, l'apprend par `lancement.md`.
- 2026-11-14 — **Point à confirmer par l'architecte avant le lancement** : « un seul dépôt par session d'architecte » (point 7) suit `P-28` à la lettre, mais ce programme a lui-même travaillé sur deux dépôts depuis une session (carte dans `skills`, tickets et PR de documentation dans `anchorpost`). Si la règle doit tolérer un second dépôt cloné dans la session, ou si une session sur un seul dépôt peut pousser dans un autre, la phrase du § 1 se réécrit ; non vérifié par le rédacteur.
- 2026-11-14 — Non vérifié : le nom du champ de `get_session` qui rend le mode de permission d'une session (le § 1 nouveau dit seulement « un écart se dit au produit ») ; la limite de 120 caractères ne vaut que là où la chaîne est posée, d'où « la limite du dépôt ».
