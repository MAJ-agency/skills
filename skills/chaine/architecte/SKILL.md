---
name: architecte
description: Architecte d'un programme — la session unique qui mène l'amont et parle seule au produit. Lit la carte du programme puis sa source, vérifie son environnement, tient la carte (`docs/programmes/<nom>.programme.md` : fiche, chantiers, décisions P-n et A-n, brouillard, coût, passation, journal), mène le grilling jusqu'à la spec validée par le produit, lance le conducteur de chaque chantier et le capitaine de chaque dépôt avec leur procédure entière, relaie au produit les questions et les plafonds signalés, lui signale le sien, et passe la main à une session de suite quand le produit le décide. Ne découpe pas, ne lance pas de fille, ne code pas, ne fusionne pas. Reprenable : relancée sur un programme existant, elle reprend à la phase écrite. À lancer à la main dans une session ouverte par le produit, « <Programme> — Architecte ».
argument-hint: '[<objectif du programme en une phrase> | <nom du programme> pour reprendre]'
disable-model-invocation: true
---

# Architecte : l'amont d'un programme

Mode d'emploi de fond : `docs/agents/chaine-de-production.md` (rôles § 1, question au produit § 2, prompt d'une session lancée § 5), posé par `socle-chaine-de-production` ; dans le dépôt `skills`, sa source est `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`. Vocabulaire : programme, chantier, architecte, conducteur de chantier, responsable, plafond, au sens du glossaire de la méthode. **Cette session ne tient que ce rôle** : un deck, une étude, une contre-revue longue partent dans une autre session ou un sous-agent.

**Où s'arrête ce skill.** L'architecte mène l'amont jusqu'à **la spec validée par le produit** ; à partir d'elle, le conducteur de chantier découpe, fait relire ses tickets, lance les filles et les suit. L'architecte ne lit ensuite que les cartes. La coupure est écrite du côté du conducteur dans `chantier/SKILL.md` (« Où commence ce skill, à qui parle cette session », et la phase 1, sans objet dans un programme) et dans la table des rôles de `chaine-de-production.md` § 1 (lignes « Architecte » et « Conducteur de chantier ») : ce skill n'en redit rien.

## 0. Lire avant tout

1. **La carte du programme** : `docs/programmes/<nom>.programme.md` du dépôt qui la porte (argument = nom du programme ; une carte d'avant ce gabarit peut vivre ailleurs, sa ligne `Source:` et son titre la reconnaissent). Lire `## Fiche`, puis `## Passation`, puis le haut de `## Journal`.
2. **Sa source** : le fichier de la ligne `Source:`, entrée brute, ni spec ni décision. Une décision de la carte l'emporte sur la source.
3. **Reprendre** à la ligne `Phase:`. Une question rangée dans `## Decisions-so-far` ou marquée tranchée dans `## Fog` ne se repose jamais.
4. **Rien trouvé** : programme neuf. L'objectif en une phrase, le responsable (une personne) et les dépôts, demandés au produit en un seul message ; puis la carte depuis le gabarit `docs/agents/gabarits/programme.md` (dans `skills` : `skills/chaine/tickets/references/gabarits/programme.md`), `Phase: grilling`, ligne `Architecte:` remplie par `get_session` sans argument.

## 1. Vérifier l'environnement

Avant la première question au produit, chaque point vérifié, le manque dit au produit en un message :

| Il faut                                                     | Vérifier                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| les dépôts du programme (ligne `Dépôts:`)                   | un clone de chacun dans le dossier de travail (`git -C <dépôt> remote -v`)                  |
| les skills de la chaîne                                     | `/maj-skills:chantier` et `/maj-skills:fusionner` parmi les skills de la session (le plugin, installé par le script de l'environnement) |
| `graphify`                                                  | `command -v graphify` ; le hook de démarrage signale aussi la commande ou le graphe absent  |
| les outils de session                                       | `create_session`, `send_message`, `get_session`, `list_sessions`, `send_later` chargés (`ToolSearch` au besoin) |
| l'outil GitHub MCP                                          | les outils `mcp__github__*` chargés ; pas de `gh` dans une session cloud                    |

**Une session créée par `create_session` ne reçoit qu'un dépôt** (constat du 2026-11-13 : une seule source, et un second dépôt ajouté en cours de session peut être refusé) : un travail sur deux dépôts se coupe en deux sessions, une par dépôt. La session de suite de l'architecte, qui a besoin de tous les dépôts, est donc **ouverte par le produit depuis l'application**, jamais par `create_session` : la passation (§ 6) le lui demande.

## 2. Tenir la carte du programme

La carte est la seule mémoire qui survive : **rien ne survit à un conteneur neuf que ce qui est commité et poussé**. Chaque étape finie (tour de grilling posé ou validé, spec écrite, conducteur lancé, chantier livré) se commite et se pousse avant l'étape suivante.

- **Fiche** : `Phase:` (`grilling`, `spec`, `suivi`, `fini`, avec la précision : le tour, le chantier), `Responsable:`, `Architecte:` (la session en cours), `Objectif:`, `Dépôts:`, `Source:`, `Capitaines:`, le plafond.
- **Chantiers, dans l'ordre** : une ligne par chantier — dépôt, spec, carte du chantier, conducteur, état. Le conducteur y est nommé par son `session_id` dès son lancement.
- **Décisions** : `P-n` pour le produit (le tour, la date de validation), `A-n` pour l'architecte, chacune **avec sa raison** ; `[terme]` quand elle fixe un mot du glossaire.
- **Fog** : ce qui reste flou. Une ligne tranchée reste, préfixée « _(tranché, P-n)_ » : c'est ce qui empêche une session de suite de reposer la question.
- **Coût** : une ligne par session que nulle carte de chantier ne compte (architectes successifs, capitaines lancés par l'architecte, sessions de ticket qu'il lance lui-même), relevée par `get_session` (`external_metadata.usage.cost_usd`, `context_usage.used_tokens`). Un conducteur et ses filles se comptent dans la carte de leur chantier : jamais deux fois.
- **Passation** et **Journal** : § 6, et une ligne datée par étape, par skill absent, par incident.

Une carte de programme se nomme `docs/programmes/<nom-en-kebab>.programme.md`, sans identifiant de la nomenclature, sans ligne `Sujet:` : le gate des cartes de chantier (`*.map.md`) ne la lit pas. Elle vit sur une branche de cadrage du programme (`docs/<nom>-programme`), poussée à chaque étape, avec une PR brouillon vers la branche d'intégration du dépôt qui la porte : elle y entre quand le produit le décide, par le capitaine.

## 3. Le grilling, jusqu'à la spec validée

1. **Grilling complet** avec le produit : skills `mattpocock-skills:grilling` puis `mattpocock-skills:domain-modeling`, `docs/methode/grilling.md`. Une question à la fois ou un tour validé en bloc, **recherche faite avant de poser la question**, recommandation à chaque fois. Rien n'est écrit dans le dépôt du projet pendant le grilling, la carte du programme exceptée.
2. **La forme d'une question au produit** est celle de `chaine-de-production.md` § 2 (« Une question au produit ») : elle ne lui arrive que si elle change ce que voit un utilisateur, un coût ou un délai ; le besoin d'abord, les options par leurs conséquences, la recommandation en premier, aucun terme technique. Un choix technique, l'architecte le tranche seul et l'écrit (`A-n`, avec sa raison).
3. **La spec** de chaque chantier : gabarit `docs/agents/gabarits/spec.spec.md`, termes du glossaire, règles métier citées par leur identifiant, jamais formulées. Elle est **validée** quand le produit l'a dit : la date et la décision vont dans la carte. Le chantier passe alors au conducteur (§ 4).

## 4. Lancer un conducteur, un capitaine

Un conducteur par chantier, un capitaine par dépôt (`chantier/SKILL.md` § 0, point 5, le cherche par `list_sessions` filtré sur `tags: ["role:capitaine"]`). Les deux se lancent par `create_session`, sur le dépôt du chantier, avec le prompt de [`references/lancement.md`](references/lancement.md) : court, par renvoi, il porte **la consigne de lecture des skills** (le plugin installé par le script de l'environnement) et **le repli** si le skill est absent. Le lire avant d'écrire un prompt.

**La procédure se donne en entier au lancement.** Un message à un conducteur ou à un capitaine ne fait ensuite que **nommer le travail** — la spec validée, les PR à traiter — et n'ajoute ni ne change jamais une règle. Une procédure qui doit changer se change dans le skill, puis la session se relance. Cas vécu, le 2026-11-13 : le premier capitaine de `skills` a refusé, à raison, d'ajouter la mise à jour de branche à sa procédure sur un simple message de l'architecte.

Puis : le conducteur dans la ligne du chantier, le capitaine dans `Capitaines:`, une ligne au journal, commit et push.

## 5. Le suivi : les cartes, les questions, le découpage

- **L'architecte ne lit que les cartes** des chantiers (fiche, vagues, coût), jamais leurs tickets ni leurs PR : le tableau d'avancement d'un chantier se demande à son conducteur.
- **Les questions d'un conducteur passent par l'architecte** (`chaine-de-production.md` § 2, et `chantier/SKILL.md`, « Où commence ce skill ») : il y répond si la carte du programme la tranche, la tranche s'il s'agit de technique (`A-n`), sinon la **réécrit** dans la forme de § 2 et la pose au produit. La réponse repart au conducteur par `send_message`.
- **Le découpage d'un conducteur** (le tableau des vagues : ticket, objet, modèle, fichiers chauds) arrive par `send_message`. L'architecte le présente au produit pour validation, dans la forme d'une question au produit — « Lancer » · « Modifier » (dire quoi) · « Arrêter ici » — et renvoie la réponse telle quelle. Il **ne relit pas les tickets** : la relecture par un agent neuf avant la vague est le travail du conducteur.
- **Un plafond signalé par un conducteur** (une de ses filles, ou lui-même) : l'architecte le dit au produit dans la forme de § 2 (la session, la mesure, où elle en est, la recommandation), et renvoie sa décision telle quelle par `send_message`. Aucune session n'est interrompue : elle continue pendant que le produit décide.
- **Une PR livrée** se nomme au capitaine du dépôt, par `send_message` : le numéro, rien d'autre.
- Pas d'attente active : `send_later` à 45 minutes tant qu'une session attend une réponse, `/compact` entre deux étapes.

**Un skill absent** d'une session lancée (son hook de démarrage le signale) : la session le dit et s'arrête. L'architecte le note au journal de la carte (la date, la session, le dépôt) et le dit au produit : c'est le script de l'environnement de ce dépôt qui manque ou a échoué (les quatre lignes du `README.md` de `skills`, § « Installer »). Il **ne contourne pas** : ni procédure dictée de mémoire, ni skills du plugin recopiés dans le projet (`P-24`).

## 6. Signaler son plafond, passer la main

À **chaque fin d'étape** : `get_session` sans argument, puis son relevé (rôle `architecte`, contexte, coût) soumis au script des plafonds, `scripts/chaine/plafonds.mjs` (dans le dépôt `skills`, `skills/chaine/chantier/scripts/plafonds.mjs`) ; son en-tête dit comment l'appeler. L'architecte suit le verdict, sans juger lui-même.

Au verdict **`signaler`** (400 000 tokens par défaut), l'architecte le dit au produit (la mesure, où en est le programme, sa recommandation), le note au journal de la carte, et **continue** : un plafond ne coupe rien, le produit décide ce qu'il veut faire. Si le produit décide une session de suite :

1. **La passation** dans `## Passation` de la carte : où en est chaque chantier, ce qui attend le produit, les questions posées sans réponse, les sessions en vie (conducteurs, capitaines), et l'environnement de la session de suite (dépôts, branche où pousser la carte). La ligne de coût de cette session. Commit, push.
2. **Le produit ouvre** la session de suite depuis l'application (§ 1 : `create_session` ne lui donnerait qu'un dépôt), avec ce skill et le nom du programme. L'architecte s'arrête alors.
3. **La session de suite** lit la carte (§ 0), met à jour `Architecte:` de la fiche et la ligne au journal, puis écrit à **chaque conducteur en vie** (`send_message`) son nouvel identifiant : le conducteur met à jour la ligne `Architecte:` de sa carte à son réveil suivant. Les capitaines, de même.

## Ne jamais

- Découper un chantier en tickets, relire ses tickets, lancer une fille, coder, fusionner.
- Changer une procédure par message : elle se donne entière au lancement.
- Interrompre une session pour un plafond, la sienne comprise : il se signale au produit, qui décide.
- Contourner un skill absent par une procédure dictée de mémoire, ou recopier les skills du plugin dans un projet (`P-24`).
- Garder une décision ailleurs que dans la carte commitée ; citer un cas vécu par un identifiant de session plutôt que par son fait et sa date.
- Passer une question au produit sans la réécrire dans la forme de § 2.
