# Une session coupée se voit dans l'heure : contrôle de vie de l'architecte et du conducteur, `send_message` au premier geste, contexte lu par `get_session`

Status: ready-for-agent
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
4. Les intangibles cités dans chaque prompt portent « jamais de `git commit --amend` ».

## Où

`socle/` abrège `skills/chaine/socle-chaine-de-production/references/`. Lignes relues sur `4a45634` ; si `main` a bougé, retrouver chaque endroit par sa phrase.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `skills/chaine/architecte/SKILL.md` | 66-73 (§ 5) | Le point « Pas d'attente active : `send_later` à 45 minutes tant qu'une session attend une réponse, `/compact` entre deux étapes » devient le contrôle de vie (Décision 1), qui le garde : 45 minutes tant qu'une session attend une réponse, 60 sinon, tant que la carte nomme une session en vie. |
| `skills/chaine/architecte/SKILL.md` | 30 (§ 1, « les outils de session ») | Rien : `get_session`, `send_later` et `send_message` y sont déjà. |
| `skills/chaine/architecte/references/lancement.md` | 11 (§ « La mise à niveau ») | « jouée avant tout autre geste, hors l'installation du repli » → « jouée juste après le chargement de `send_message` (ligne « Outils : »), avant tout autre geste, hors l'installation du repli ». |
| `skills/chaine/architecte/references/lancement.md` | 19-29, 42-50, 70-78 (les trois blocs de prompt) | Une ligne « Outils : » juste après la ligne du rôle (l. 21, 44, 71), texte exact en Décision 2. Dans la ligne « Version : » de chaque bloc (l. 24, 47, 73), « avant tout autre geste, hors l'installation de la ligne « Skills : » » → « juste après la ligne « Outils : », avant tout autre geste, hors l'installation de la ligne « Skills : » ». |
| `skills/chaine/architecte/references/lancement.md` | 88 (l'intangible) | « jamais de push forcé ni de réécriture d'historique » → « jamais de push forcé ni de réécriture d'historique (ni `git commit --amend`) ». Le même texte, mot pour mot, que `chaine-de-production.md:108`. |
| `skills/chaine/architecte/references/lancement.md` | 95-102 (§ « Après le lancement ») | Après le point du `send_later` à 20 minutes (l. 98) : « Puis la session entre dans le contrôle de vie (`SKILL.md` § 5) tant que la carte la nomme en vie. Un premier message « send_message absent » se lit au relevé de 20 minutes (`list_events`) : l'architecte relance la session une fois, puis le dit au produit. » |
| `skills/chaine/chantier/SKILL.md` | 87 (§ 6, point 1) | Le relevé des filles s'étend au capitaine du dépôt (les sessions `role:capitaine`) et aux quatre signes de la Décision 1. Le réveil reste à 45 minutes (§ 6, point 0 bis), sous les 60 de `A-11`. |
| `skills/chaine/chantier/SKILL.md` | 88 (§ 6, point 1 bis) | Une phrase en tête : « Le contexte d'une session se lit par `get_session` (`context_usage.used_tokens`), jamais dans ce qu'elle annonce : une session a annoncé 330 000 tokens pour 446 000 relevés. » |
| `skills/chaine/chantier/SKILL.md` | 72-75 (§ 5, prompt des filles) | Rien : le prompt cite le gabarit de `chaine-de-production.md` § 5, qui porte la ligne « Outils : ». |
| `socle/docs-agents/chaine-de-production.md` | 103-110 (gabarit du prompt d'une fille) | La ligne « Outils : » après la deuxième ligne (« Ticket : … Base : … »), texte en Décision 2, « moi » y devenant « ton conducteur ». L'intangible (l. 108) reçoit le même ajout que `lancement.md:88`. |
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
   - **Qui le conducteur relève** : ses filles (tag `chantier:<nom>`, comme aujourd'hui) et les sessions `role:capitaine` du dépôt.
   - **Quand** : à chaque réveil, quel qu'en soit le motif. L'architecte réarme un `send_later` à 60 minutes tant que sa carte nomme une session en vie, à 45 tant qu'une session attend une réponse : un seul réveil armé, le plus proche. Le conducteur garde son réveil de 45 minutes (§ 6, point 0 bis), qui tient déjà sous les 60.
   - **Les quatre signes**, lus dans la réponse de `get_session` :
     - `status_bucket` qui finit par `FAILED` (la réponse porte `SESSION_STATUS_BUCKET_FAILED`) ;
     - `connection_status` égal à `disconnected` ;
     - `external_metadata.rate_limit_info.status` autre que `allowed`. `allowed_warning` se note au journal une fois par session, sans signalement : la session travaille encore ;
     - `updated_at` vieux de plus de 60 minutes alors que `status_bucket` finit par `WORKING`.
   - **Le signalement** : une ligne au journal de la carte (date, session, rôle, signe), puis, dans la forme de `chaine-de-production.md` § 2, au produit (par l'architecte, qui reçoit aussi ceux du conducteur dans un programme). Le besoin en une phrase, sans terme technique (« le capitaine de `fedora` est arrêté depuis 14 h 10 : sa limite d'usage est atteinte »), la recommandation d'abord. Une session déjà signalée pour le même signe ne l'est pas de nouveau.
   - Rien n'est relancé ni interrompu sans le produit : relancer une session prête reste un geste sans question (`architecte/SKILL.md` § 7), mais une session coupée par la limite d'usage ne se relance pas avant sa levée.
2. **La ligne « Outils : »**, identique dans les trois blocs de `lancement.md` :

   ```text
   Outils : ton premier geste, avant tout autre, est de charger send_message par ToolSearch, requête « select:mcp__claude-code-remote__send_message ». S'il ne se charge pas, écris « send_message absent » dans ta première réponse et arrête-toi : je le verrai à mon relevé.
   ```

   Dans le gabarit d'une fille, « je le verrai à mon relevé » devient « ton conducteur le verra à son relevé ». Raison du premier geste : la ligne « Version : » finit par un `send_message` à qui a lancé la session ; sans l'outil, ce message se perd.
3. **L'intangible.** L'ajout entre dans la ligne qui existe, mot pour mot dans les deux fichiers, plutôt qu'une ligne de plus : « Intangibles » est déjà la liste citée dans chaque prompt (`architecte/SKILL.md:89`), et le produit a validé `A-30` (`P-5`). Le paragraphe « Jamais d'amend » du gabarit en donne la raison.
4. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le mot à mot des phrases non données ici, tant qu'elles portent la règle. Elle ne tranche **pas** : la ligne « Outils : » (Décision 2), les quatre signes, les 60 minutes.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main` au lancement. Chaque banc est vu rouge avant le texte qui le rend vert.

### 1. Les bancs, chacun vu rouge

Dans `scripts/depot.test.mjs`, avec `blocsPrompt` (l. 362, les trois blocs de `lancement.md`), `blocsTexte` (l. 309, pour le gabarit de `chaine-de-production.md`), `lignes` (l. 67) et `exiger` (l. 751-755 ; les tests tournent après le chargement du module, un test placé plus haut peut l'appeler) :

1. **« chaque prompt lancé charge send_message en premier geste, avant la ligne Version : »**. Pour chacun des trois blocs de `lancement.md` et pour le gabarit de `chaine-de-production.md` § 5 : une ligne qui commence par `Outils : ` et contient `select:mcp__claude-code-remote__send_message`, placée avant la ligne `Version : ` quand le bloc en a une. **Rouge sur `main`** : aucune ligne « Outils : ».
2. **« les intangibles sont les mêmes dans lancement.md et dans le gabarit d'une fille, et refusent git commit --amend »**. La ligne `Intangibles : …` de `lancement.md` et celle de `chaine-de-production.md`, égales, contiennent `` `git commit --amend` ``. **Rouge sur `main`** : l'amend manque.
3. **« l'architecte et le conducteur relèvent leurs sessions dans l'heure, et lisent le contexte par get_session »**. `exiger` sur `architecte/SKILL.md` et `chantier/SKILL.md` : `get_session`, `connection_status`, `rate_limit_info.status`, `60 minutes` ; sur `chantier/SKILL.md` en plus : « jamais dans ce qu'elle annonce », `role:capitaine` au § 6. **Rouge sur `main`** : ces passages manquent.

Les tests existants des prompts (l. 316-390 : commande en tête, mise à niveau) restent verts : la ligne « Outils : » ne nomme aucun skill marqué et n'ôte aucune phrase de `MISE_A_NIVEAU`.

### 2. Les textes

Ceux du tableau « Où », dans l'ordre : `lancement.md`, `chaine-de-production.md`, `architecte/SKILL.md`, `chantier/SKILL.md`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une correction de textes, sans skill ni gabarit ajouté : un patch. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne (sa section 5), recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  L'architecte et le conducteur relèvent l'état de leurs sessions au plus toutes les 60 minutes (échec, déconnexion, limite d'usage, silence d'une heure) et signalent une session coupée. Toute session lancée charge `send_message` en premier geste, et s'arrête en le disant s'il manque. Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce. Les intangibles cités dans chaque prompt refusent `git commit --amend`.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »). Les skills `architecte` et `chantier` et les prompts de lancement viennent avec le plugin : rien à reposer pour eux.
  2. Dans une PR du projet, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) les trois changements du gabarit, § 5 : la ligne « Outils : » du prompt d'une fille, l'ajout à la ligne « Intangibles », et le paragraphe « Jamais d'amend » après l'étape 4.
  3. Un conducteur ou un architecte en cours reprend ces règles à sa prochaine session ; aucun capitaine à relancer.

  **Iroki** : son `docs/agents/chaine-de-production.md` porte déjà le paragraphe « Jamais d'amend » (l. 124, #634) ; il reçoit la ligne « Outils : » et l'ajout à « Intangibles ».
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `send_message` au premier geste, dans les trois blocs et le gabarit | `scripts/depot.test.mjs` « chaque prompt lancé charge send_message en premier geste, avant la ligne Version : » |
| Intangibles identiques, amend refusé | `scripts/depot.test.mjs` « les intangibles sont les mêmes dans lancement.md et dans le gabarit d'une fille, et refusent git commit --amend » |
| Contrôle de vie et contexte lu par `get_session` | `scripts/depot.test.mjs` « l'architecte et le conducteur relèvent leurs sessions dans l'heure, et lisent le contexte par get_session » |
| Prompts : commande en tête, mise à niveau | `scripts/depot.test.mjs` l. 316-390 (inchangés) |

## Vérification

1. Ciblée : `node --test scripts/depot.test.mjs`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les trois tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - la ligne « Outils : » d'un seul bloc déplacée après « Version : » : le banc 1 rougit ;
   - l'amend retiré de l'intangible de `lancement.md` seulement : le banc 2 rougit.
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
- La ligne « Version : » du gabarit d'une fille (`lancement.md:11`, « Filles : ») : inchangée.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, et sur `develop` d'Iroki (`e3dbd235`) pour le paragraphe d'amend. Écarts avec la spec et choix à confirmer :
  - **Conducteur à 45 minutes, pas 60** : son réveil (`chantier/SKILL.md` § 6, point 0 bis) est déjà de 45 minutes ; le relevé s'y joint, plutôt qu'un second réveil à 60.
  - **L'architecte relève aussi les sessions de ticket hors chantier** qu'il lance : `A-11` ne nommait que conducteurs et capitaines. Ce programme-ci en lance plusieurs, et l'architecte y tient la place du conducteur.
  - **`allowed_warning`** : lu le 2026-11-18 dans la réponse de `get_session` d'une session qui travaillait. `A-11` (« différent de `allowed` ») le signalerait à chaque relevé ; le ticket le note une fois au journal, sans signalement.
  - **`status_bucket`** se lit préfixé (`SESSION_STATUS_BUCKET_WORKING`), et non `working` comme l'écrit `chantier/SKILL.md:87` : la Décision 1 compare la fin de la valeur.
  - **« Avant tout autre geste »** : la ligne « Version : » de chaque bloc le disait déjà d'elle-même. Le ticket la place juste après « Outils : », sans quoi les deux lignes se contrediraient.
  - **L'amend dans la ligne « Intangibles »** plutôt qu'une ligne nouvelle : la liste est celle de `P-28` (programme « gouverner nos boucles »), que `A-30`, validée par le produit (`P-5`), complète. **À confirmer par l'architecte** ; sinon, une ligne « Commits : jamais `git commit --amend` » après « Intangibles », dans les mêmes fichiers.
