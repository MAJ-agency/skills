# Une session coupée se voit dans l'heure : contrôle de vie de l'architecte et du conducteur, `send_message` au premier geste, contexte lu par `get_session`

Status: Fait — PR #117
Type: défaut
Modèle: sonnet — du texte de skills, chaque phrase donnée ou cadrée ici, et des bancs de texte sur le modèle de ceux de `scripts/depot.test.mjs` ; aucun script.
Blocked by: — (aucun fichier du capitaine ; mais `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` changent à chaque ticket, et `chantier/SKILL.md` § 6 est touché par le ticket 1 : partir d'`origin/main` au moment du lancement, et ne pas partir en même temps que le ticket 1 ni que le ticket 4)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 5 (décisions `A-11` à `A-13`, défauts 4, 5 et 6) ; [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), `A-30` (D19, « jamais d'amend » dans les consignes des sessions ; la garde qui refuse `--amend` est au ticket 18). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` au lancement (`4a45634` en 7.15.0, **738 tests**, quand ce ticket a été écrit). Faits relus à la source sur `4a45634` le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Les défauts vécus le 2026-11-18 sur `fedora`** :

- **Défaut 4** : un capitaine et un conducteur coupés par la limite d'usage, sans que personne le voie, pendant cinq heures. L'architecte ne se réveille que « tant qu'une session attend une réponse » (`architecte/SKILL.md:73`) ; le conducteur relève ses filles à chaque réveil (`chantier/SKILL.md:87`), mais ni le capitaine ni les signes d'une coupure (déconnexion, limite d'usage, silence).
- **Défaut 5** : une fille démarrée sans l'outil `send_message`. Elle ne pouvait ni dire qu'elle était bloquée, ni rendre sa PR. Aucun prompt ne fait vérifier l'outil d'abord (`chaine-de-production.md` § 5, `lancement.md:70-77`).
- **Défaut 6** : un contexte sous-estimé par la session elle-même (330 000 tokens annoncés, 446 000 réels). Déjà en grande partie traité : `chantier/SKILL.md:88` mesure le contexte par `get_session` ; il manque la phrase qui interdit de croire ce qu'une session annonce.
- **D19 d'Iroki** (`A-30`) : « jamais d'amend » n'est écrit dans aucune consigne de session du plugin. Iroki l'a écrit chez lui (#634, `docs/agents/chaine-de-production.md:124` d'Iroki).

**Quand le ticket est fait** :

1. L'architecte et le conducteur relèvent l'état de leurs sessions en vie au plus toutes les 60 minutes, par `get_session`, et signalent une session coupée.
2. Toute session lancée (conducteur, capitaine, session de ticket, fille de chantier) charge `send_message` en premier geste. Sans lui, elle le dit dans sa première réponse et s'arrête.
3. Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce.
4. Chaque prompt porte, juste après la ligne « Intangibles », une ligne à part : « Commits : jamais `git commit --amend` ; une correction est un commit de plus. »

## Où

`socle/` abrège `skills/chaine/socle-chaine-de-production/references/`. Lignes relues sur `4a45634` ; si `main` a bougé, retrouver chaque endroit par sa phrase.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `skills/chaine/architecte/SKILL.md` | 66-73 (§ 5) | Le point « Pas d'attente active : `send_later` à 45 minutes tant qu'une session attend une réponse, `/compact` entre deux étapes » devient le contrôle de vie (Décision 1), qui le garde : 45 minutes tant qu'une session attend une réponse, 60 sinon, tant que la carte nomme une session en vie. |
| `skills/chaine/architecte/SKILL.md` | 30 (§ 1, « les outils de session ») | Rien : `get_session`, `send_later` et `send_message` y sont déjà. |
| `skills/chaine/architecte/references/lancement.md` | 11 (§ « La mise à niveau ») | « jouée avant tout autre geste, hors l'installation du repli » → « jouée juste après le chargement de `send_message` (ligne « Outils : »), avant tout autre geste, hors l'installation du repli ». |
| `skills/chaine/architecte/references/lancement.md` | 19-29, 42-50, 70-78 (les trois blocs de prompt) | Une ligne « Outils : » juste après la ligne du rôle (l. 21, 44, 71), texte exact en Décision 2. Dans la ligne « Version : » de chaque bloc (l. 24, 47, 73), « avant tout autre geste, hors l'installation de la ligne « Skills : » » → « juste après la ligne « Outils : », avant tout autre geste, hors l'installation de la ligne « Skills : » ». |
| `skills/chaine/architecte/references/lancement.md` | 82-91 (§ « Les consignes du produit, dans chaque prompt ») | La ligne « Intangibles » (l. 88) **ne change pas** : elle est citée mot pour mot, avec la ligne qui la précède. Juste après elle, dans le même bloc, une ligne à part : « Commits : jamais `git commit --amend` ; une correction est un commit de plus. » Le texte d'avant le bloc (l. 84) et celui d'après (l. 91) disent que cette troisième ligne est de l'architecte (`A-30`, `A-41`), pas une citation du produit, et qu'elle se recopie elle aussi dans chaque prompt. Dans les trois blocs de prompt, le repère « `<les deux lignes des consignes du produit, telles quelles>` » (l. 26, 48, 74) devient « `<les deux lignes des consignes du produit, telles quelles, puis la ligne « Commits : »>` ». |
| `skills/chaine/architecte/references/lancement.md` | 95-102 (§ « Après le lancement ») | Après le point du `send_later` à 20 minutes (l. 98) : « Puis la session entre dans le contrôle de vie (`SKILL.md` § 5) tant que la carte la nomme en vie. Un premier message « send_message absent » se lit au relevé de 20 minutes (`list_events`) : l'architecte relance la session une fois, puis le dit au produit. » |
| `skills/chaine/chantier/SKILL.md` | 23 (§ 0, point 5) | « `list_sessions` filtré par `tags: ["role:capitaine"]` (jamais par le titre) » → « `list_sessions` sans `tags`, puis garder les lignes dont `tags` contient `role:capitaine` (jamais par le titre ; le filtre `tags` est refusé à une session : « tags filter is not currently available ») ». Le ticket 4 change la fin de la même ligne (« au moins une session active ») : le second des deux à fusionner garde les deux changements. |
| `skills/chaine/chantier/SKILL.md` | 87 (§ 6, point 1) | « `list_sessions` filtré sur le tag » → « `list_sessions` sans `tags`, puis les lignes dont `tags` contient `chantier:<nom>` » (même défaut). Le relevé des filles s'étend aux capitaines du dépôt (même lecture, `role:capitaine`) et aux quatre signes de la Décision 1. Le réveil reste à 45 minutes (§ 6, point 0 bis), sous les 60 de `A-11`. |
| `skills/chaine/chantier/SKILL.md` | 104 (« Arrêter un chantier », point 2) | « `list_sessions` filtré sur le tag `chantier:<nom>` » → la même lecture sans `tags` (même défaut). |
| `skills/chaine/chantier/SKILL.md` | 88 (§ 6, point 1 bis) | Une phrase en tête : « Le contexte d'une session se lit par `get_session` (`context_usage.used_tokens`), jamais dans ce qu'elle annonce : une session a annoncé 330 000 tokens pour 446 000 relevés. » |
| `skills/chaine/chantier/SKILL.md` | 72-75 (§ 5, prompt des filles) | Rien : le prompt cite le gabarit de `chaine-de-production.md` § 5, qui porte la ligne « Outils : ». |
| `socle/docs-agents/chaine-de-production.md` | 103-110 (gabarit du prompt d'une fille) | La ligne « Outils : » après la deuxième ligne (« Ticket : … Base : … »), texte en Décision 2, « moi » y devenant « ton conducteur ». La ligne « Intangibles » (l. 108) ne change pas ; la ligne « Commits : » de `lancement.md` la suit, mot pour mot. |
| `socle/docs-agents/chaine-de-production.md` | 112 (note sous le gabarit) | « Les deux lignes du produit sont la seule exception : elles se citent telles quelles » + « ; la ligne « Commits : » qui les suit vient de l'architecte (`A-30`, `A-41`), comme dans `lancement.md`, et se recopie elle aussi ». |
| `socle/docs-agents/chaine-de-production.md` | 114-123 (déroulé) | Un paragraphe après l'étape 4 (« Coder ») : « **Jamais d'amend.** Une correction est un commit de plus, jamais `git commit --amend`, même sur un commit pas encore poussé : le sommet annoncé, contre-relu ou étiqueté doit rester dans l'historique, et un amend déjà poussé ne repart que par un push forcé, que le hook refuse. » (Réécrit de celui d'Iroki, l. 124 de son fichier.) |
| `scripts/depot.test.mjs` | après les tests des prompts de lancement (l. 378-391) | Trois tests (Surfaces). Pas à la fin du fichier : le ticket 1 y ajoute le sien. |
| Version | voir « La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

Lecteurs réels de ces textes :

- `lancement.md` : l'architecte, avant d'écrire un prompt (`architecte/SKILL.md:60`) ; ses trois blocs sont les prompts de `create_session`.
- `chaine-de-production.md` § 5 : le conducteur, qui le cite dans chaque prompt de fille (`chantier/SKILL.md:75`) ; posé dans chaque projet par `socle-chaine-de-production`.
- `architecte/SKILL.md` § 5 et `chantier/SKILL.md` § 6 : les sessions qui tiennent ces rôles, à chaque réveil.

Règles à lire : `architecte/SKILL.md` § 5 et § 7 (l. 66-96), `chantier/SKILL.md` § 6 (l. 83-97).

## Décisions

Tenues : `A-11` (relevé `get_session` à 60 minutes par `send_later`, tant que la carte nomme une session en vie ; quatre signes ; forme de `chaine-de-production.md` § 2), `A-12` (premier geste : `ToolSearch` `select:mcp__claude-code-remote__send_message` ; absent, la session le dit dans sa première réponse et s'arrête ; dans les trois blocs de `lancement.md` et le gabarit § 5), `A-13` (une phrase dans `chantier/SKILL.md`), `A-30` (les consignes des sessions disent « jamais d'amend »). Ce que le ticket précise :

1. **Le contrôle de vie.**
   - **Qui l'architecte relève** : chaque session que sa carte nomme encore en vie, c'est-à-dire non archivée, non `completed` : conducteurs (`## Chantiers`), capitaines (`Capitaines:`), et sessions de ticket hors chantier qu'il a lancées (`## Coût`).
   - **Qui le conducteur relève** : ses filles et les capitaines du dépôt (plusieurs peuvent tourner, `P-2`, ticket 4). Il les trouve par `list_sessions` **sans** `tags` (le filtre est refusé à une session : « tags filter is not currently available »), en gardant les lignes dont `tags` contient `chantier:<nom>` ou `role:capitaine` ; dans un programme, aussi par les identifiants de la ligne `Capitaines:` de la carte du programme.
   - **Qui l'architecte trouve, et comment** : par les identifiants de sa carte, jamais par un filtre `tags`.
   - **Quand** : à chaque réveil, quel qu'en soit le motif. L'architecte réarme un `send_later` à 60 minutes tant que sa carte nomme une session en vie, à 45 tant qu'une session attend une réponse : un seul réveil armé, le plus proche. Le conducteur garde son réveil de 45 minutes (§ 6, point 0 bis), qui tient déjà sous les 60.
   - **Les quatre signes**, lus dans la réponse de `get_session` :
     - `status_bucket` qui finit par `FAILED` (la réponse porte `SESSION_STATUS_BUCKET_FAILED`) ;
     - `connection_status` égal à `disconnected` ;
     - `external_metadata.rate_limit_info.status` autre que `allowed`, `allowed_warning` compris : une alerte d'usage, pas une coupure (Décision 1, « Le signalement ») ;
     - `session_status` qui finit par `RUNNING` (un tour en cours) et `updated_at` vieux de plus de 60 minutes : un tour qui ne produit plus rien. Pas `status_bucket` `WORKING` : une session qui a fini son tour et attend une réponse est en `SESSION_STATUS_IDLE` et en bucket `WORKING` (constaté le 2026-11-18 sur la session du ticket 10), et serait signalée à tort. Un worker mort reste couvert par `connection_status`.
   - **Le signalement** : toujours une ligne au journal de la carte (date, session, rôle, signe), puis au produit (par l'architecte, qui reçoit aussi ceux du conducteur dans un programme) :
     - **une coupure** (`FAILED`, `disconnected`, tour silencieux depuis une heure) se signale toujours, dans la forme de `chaine-de-production.md` § 2 : le besoin en une phrase, sans terme technique (« le capitaine de `fedora` est arrêté depuis 14 h 10 »), la recommandation d'abord ;
     - **une alerte d'usage** (`rate_limit_info.status` autre que `allowed`, `allowed_warning` compris) se dit au produit en une ligne (« le compte approche de sa limite d'usage hebdomadaire, levée le <date et heure de `resetsAt`> »). La limite est celle du **compte**, pas de la session : une alerte par couple (`rateLimitType`, `resetsAt`), quelle que soit la session qui la porte, et le couple se note au journal pour ne pas la redire. `resetsAt` est en secondes depuis l'époque Unix (`date -u -d @<resetsAt>`).
   - Rien n'est relancé ni interrompu sans le produit : relancer une session prête reste un geste sans question (`architecte/SKILL.md` § 7), mais une session coupée par la limite d'usage ne se relance pas avant sa levée.
2. **La ligne « Outils : »**, identique dans les trois blocs de `lancement.md` :

   ```text
   Outils : ton premier geste, avant tout autre, est de charger send_message par ToolSearch, requête « select:mcp__claude-code-remote__send_message ». S'il ne se charge pas, écris « send_message absent » dans ta première réponse et arrête-toi : je le verrai à mon relevé.
   ```

   Dans le gabarit d'une fille, « je le verrai à mon relevé » devient « ton conducteur le verra à son relevé ». Raison du premier geste : la ligne « Version : » finit par un `send_message` à qui a lancé la session ; sans l'outil, ce message se perd.
3. **« Jamais d'amend », une ligne à part** (`A-41`). La ligne « Intangibles » est citée mot pour mot par le produit avec la ligne qui la précède (`lancement.md:91`, `architecte/SKILL.md:89`) : elle ne reçoit rien. La ligne « Commits : jamais `git commit --amend` ; une correction est un commit de plus. » vient juste après elle, identique dans `lancement.md` et dans le gabarit de `chaine-de-production.md` § 5. Le paragraphe « Jamais d'amend » du gabarit en donne la raison.
4. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le mot à mot des phrases non données ici, tant qu'elles portent la règle. Elle ne tranche **pas** : la ligne « Outils : » (Décision 2), les quatre signes, les 60 minutes.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main` au lancement. Chaque banc est vu rouge avant le texte qui le rend vert.

### 1. Les bancs, chacun vu rouge

Dans `scripts/depot.test.mjs`, avec `blocsPrompt` (l. 362, les trois blocs de `lancement.md`), `blocsTexte` (l. 309, pour le gabarit de `chaine-de-production.md`), `lignes` (l. 67) et `exiger` (l. 751-755 ; les tests tournent après le chargement du module, un test placé plus haut peut l'appeler) :

1. **« chaque prompt lancé charge send_message en premier geste, avant la ligne Version : »**. Pour chacun des trois blocs de `lancement.md` et pour le gabarit de `chaine-de-production.md` § 5 : une ligne qui commence par `Outils : ` et contient `select:mcp__claude-code-remote__send_message`, placée avant la ligne `Version : ` quand le bloc en a une. **Rouge sur `main`** : aucune ligne « Outils : ».
2. **« jamais d'amend : une ligne Commits juste après les intangibles, la même dans lancement.md et dans le gabarit d'une fille ; les intangibles restent ceux du produit »**. Dans le bloc des consignes de `lancement.md` et dans le gabarit de `chaine-de-production.md` § 5 : la ligne qui suit `Intangibles : …` commence par `Commits : ` et contient `` `git commit --amend` ``, égale dans les deux fichiers ; les deux lignes `Intangibles : …` restent **égales au littéral de `main`**, recopié dans le test : `Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.` **Rouge sur `main`** : la ligne « Commits : » manque.
3. **« l'architecte et le conducteur relèvent leurs sessions dans l'heure, sans filtre tags, et lisent le contexte par get_session »**. Les passages se cherchent dans la seule section concernée, découpée du titre `## 5.` au titre `## 6.` de `architecte/SKILL.md`, et du titre `## 6.` au titre `## 7.` de `chantier/SKILL.md` (`get_session` et `role:capitaine` figurent déjà ailleurs dans ces fichiers) : dans chacune, `get_session`, `connection_status`, `session_status`, `rate_limit_info.status`, `resetsAt`, `60 minutes` ; dans celle de `chantier/SKILL.md` en plus, « jamais dans ce qu'elle annonce » et `role:capitaine`. Et dans tout `chantier/SKILL.md`, aucune ligne ne correspond à `` /`list_sessions` filtré/ `` ni à `` /tags: \[/ `` (lignes 23, 87 et 104 sur `main`). **Rouge sur `main`** : ces passages manquent, et les trois lignes filtrent par `tags`.

Les tests existants des prompts (l. 316-390 : commande en tête, mise à niveau) restent verts : la ligne « Outils : » ne nomme aucun skill marqué et n'ôte aucune phrase de `MISE_A_NIVEAU`.

### 2. Les textes

Ceux du tableau « Où », dans l'ordre : `lancement.md`, `chaine-de-production.md`, `architecte/SKILL.md`, `chantier/SKILL.md`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une correction de textes, sans skill ni gabarit ajouté : un patch. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne (sa section 5), recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  L'architecte et le conducteur relèvent l'état de leurs sessions au plus toutes les 60 minutes (échec, déconnexion, limite d'usage, silence d'une heure) et signalent une session coupée. Toute session lancée charge `send_message` en premier geste, et s'arrête en le disant s'il manque. Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce. Chaque prompt porte, juste après les intangibles, la ligne « Commits : jamais `git commit --amend` ». Une alerte d'usage d'une session se dit au produit une fois par période de limite.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »). Les skills `architecte` et `chantier` et les prompts de lancement viennent avec le plugin : rien à reposer pour eux.
  2. Dans une PR du projet, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) les trois changements du gabarit, § 5 : la ligne « Outils : » du prompt d'une fille, la ligne « Commits : » juste après « Intangibles » (qui ne change pas), et le paragraphe « Jamais d'amend » après l'étape 4.
  3. Un conducteur ou un architecte en cours reprend ces règles à sa prochaine session ; aucun capitaine à relancer.

  **Iroki** : son `docs/agents/chaine-de-production.md` porte déjà le paragraphe « Jamais d'amend » (l. 124, #634) ; il reçoit la ligne « Outils : » et la ligne « Commits : ».
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `send_message` au premier geste, dans les trois blocs et le gabarit | `scripts/depot.test.mjs` « chaque prompt lancé charge send_message en premier geste, avant la ligne Version : » |
| Ligne « Commits : » après les intangibles, intangibles inchangés | `scripts/depot.test.mjs` « jamais d'amend : une ligne Commits juste après les intangibles, la même dans lancement.md et dans le gabarit d'une fille ; les intangibles restent ceux du produit » |
| Contrôle de vie, sessions trouvées sans filtre `tags`, contexte lu par `get_session` | `scripts/depot.test.mjs` « l'architecte et le conducteur relèvent leurs sessions dans l'heure, sans filtre tags, et lisent le contexte par get_session » |
| Prompts : commande en tête, mise à niveau | `scripts/depot.test.mjs` l. 316-390 (inchangés) |

## Vérification

1. Ciblée : `node --test scripts/depot.test.mjs`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les trois tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - la ligne « Outils : » d'un seul bloc déplacée après « Version : » : le banc 1 rougit ;
   - la ligne « Commits : » retirée de `lancement.md` seulement, ou l'amend glissé dans la ligne « Intangibles » : le banc 2 rougit.
   - `list_sessions` filtré par `tags` remis à la l. 23 de `chantier/SKILL.md` : le banc 3 rougit.
4. Relire à plat les trois blocs de `lancement.md` : la première ligne d'un conducteur et d'un capitaine reste la commande seule (`lancement.md:3`).
5. `graphify update .`
6. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
7. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): contrôle de vie à 60 min, send_message au premier geste, jamais d'amend (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- La garde qui refuse `git commit --amend` : ticket 18 (`A-30`), bloqué par ce ticket.
- La procédure d'un capitaine sans la chaîne (`lancement.md`, bloc « Procédure ») : elle n'a pas la ligne « Architecte : » qui fait un prompt, et le bloc du capitaine qui l'entoure reçoit la ligne « Outils : ».
- Un outil qui relève les sessions à la place de l'architecte : la règle reste un geste de session (`send_later` survit au conteneur, une attente active non).
- La ligne « Filles : » du prompt d'un conducteur (`lancement.md:25`), qui recopie la ligne « Version : » dans le prompt d'une fille : inchangée.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, et sur `develop` d'Iroki (`e3dbd235`) pour le paragraphe d'amend. Écarts avec la spec et choix à confirmer :
  - **Conducteur à 45 minutes, pas 60** : son réveil (`chantier/SKILL.md` § 6, point 0 bis) est déjà de 45 minutes ; le relevé s'y joint, plutôt qu'un second réveil à 60.
  - **L'architecte relève aussi les sessions de ticket hors chantier** qu'il lance : `A-11` ne nommait que conducteurs et capitaines. Ce programme-ci en lance plusieurs, et l'architecte y tient la place du conducteur.
  - **`allowed_warning`** : lu le 2026-11-18 dans la réponse de `get_session` d'une session qui travaillait. Tranché par l'architecte (`A-41`) : toute valeur autre que `allowed` se dit au produit en une ligne, une fois par période de limite (`resetsAt`), et se note au journal ; une coupure se signale toujours.
  - **`status_bucket`** se lit préfixé (`SESSION_STATUS_BUCKET_WORKING`), et non `working` comme l'écrit `chantier/SKILL.md:87` : la Décision 1 compare la fin de la valeur.
  - **« Avant tout autre geste »** : la ligne « Version : » de chaque bloc le disait déjà d'elle-même. Le ticket la place juste après « Outils : », sans quoi les deux lignes se contrediraient.
  - **L'amend hors de la ligne « Intangibles »** : tranché par l'architecte (`A-41`), la ligne « Intangibles » est citée mot pour mot par le produit avec celle qui la précède ; « Commits : » vient juste après, à part.
- 2026-11-18 — Repris après une relecture neuve (« pas prêt »), décisions de l'architecte : le quatrième signe lit `session_status` `RUNNING` (B1, faux positifs garantis avec le bucket `WORKING`) ; les sessions se trouvent par `list_sessions` sans `tags`, et `chantier/SKILL.md:23`, `:87` et `:104` sont corrigés (B2) ; banc 3 limité aux sections, banc 2 contre le littéral de `main` ; alerte d'usage par couple (`rateLimitType`, `resetsAt`), limite du compte ; `chaine-de-production.md:112` ; « les capitaines du dépôt ». `architecte/SKILL.md:60` cite aussi le filtre `tags` : le ticket 4 réécrit cette ligne et y reprend la lecture sans `tags`.
- 2026-11-18 — Repris après `A-41` (architecte) : amend sur une ligne à part, alerte d'usage dite au produit une fois par période de limite. Retenus tels quels : réveil du conducteur à 45 minutes, sessions de ticket hors chantier relevées par l'architecte, « Version : » juste après « Outils : ».
