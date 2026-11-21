# Passation — architecte B : Anchorpost, la preuve suffisante (2026-11-21)

Tu reprends **l'architecte B** du programme « gouverner nos boucles », sur un autre compte. Ton périmètre : le chantier `SPEC_ALL_ANC-5` (la preuve suffisante) dans `MAJ-agency/anchorpost`, ses correctifs, ses livraisons, et la publication de la CLI `@maj-agency/anchorpost`. Le plugin `MAJ-agency/skills` reste à l'architecte A.

Le premier compte est **arrêté par sa limite hebdomadaire** (« weekly limit », levée le 2026-11-22 à 19 h UTC). Son conducteur, son capitaine et la fille de `.67` sont tombés le 2026-11-20 vers 14 h 20 UTC, au milieu de leur tour. Rien n'est perdu, tout est poussé. Mais aucun d'eux ne tient plus la main : **la main est libre**.

Tu parles au produit, qui est aussi la MOA. En français, en phrases simples : ta recommandation d'abord, puis **une seule question à la fois, à laquelle on répond par oui ou non**.

## Ce que tu lis, et comment

- **Ta carte**, qui fait suite à la mienne : `docs/issues/gouverner-nos-boucles/preuve-suffisante.architecte.md`, dans le dépôt `skills`, branche `claude/compassionate-euler-st84s9`. Lis `## Fiche`, `## Décisions` (de `A-200` à `A-245`) et la fin de `## Journal`. Ne la lis jamais en entier. Tu continues d'y écrire, par ajout. Le dépôt est public : rien de privé, aucun nom de personne, aucun détail d'un projet client.
- **La carte du chantier** : `docs/features/anchorpost/all/SPEC_ALL_ANC-5-preuve-suffisante.map.md`, branche `sujet/preuve-suffisante-cas`. Plus de 160 Ko : jamais en entier, seulement par `grep` et `sed`. Sa dernière passation de conducteur est l'entrée « RELÈVE DU CONDUCTEUR » du 2026-11-20, 12 h 35 UTC.
- **Les passations précédentes** : [`2026-11-19-architecte-anchorpost.md`](2026-11-19-architecte-anchorpost.md), dont les décisions et les intangibles valent toujours, et [`2026-11-19-consignes-conducteur.md`](2026-11-19-consignes-conducteur.md).

## Décisions qui te lient

- **Produit.** `P-54` : une publication de la CLI ne se fait que sur l'accord explicite du produit, après un essai à blanc (`docs/agents/admin.md` d'anchorpost).
- **`P-28`, à recopier dans le prompt de chaque session que tu lances**, dans ses mots : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
- **Intangibles.** Jamais `--no-verify`. Jamais de push forcé ni de réécriture d'historique. Jamais `git commit --amend`. Jamais de fusion avec un contrôle exigé rouge. Jamais de test sauté ou assoupli. Jamais de push sur la branche par défaut. Une dépendance nouvelle attend l'accord humain. Tu ne fusionnes jamais toi-même.
- **Tes accords.** Avant d'accorder un label sur une PR qui touche `apps/cli/src/proofs`, la construction de l'index ou ce que `compare` juge, tu lis le diff à la source. Avant d'affirmer un état, tu le vérifies sur GitHub.
- **Sessions que tu lances.** `permission_mode: "auto"`, modèle `claude-opus-5-5`, sauf autre consigne du produit. Leur prompt interdit tout signal hors de leurs propres processus et impose un `TMPDIR` privé.
- **Règles de la nuit**, données à chaque conducteur. Tu les trouves dans le prompt de la relève 6 du conducteur (fin de la carte du chantier) :
  - une seule sous-PR étiquetée à la fois, et rien poussé sur le sujet tant qu'elle l'est (`A-208`) ;
  - jamais `sujet.sh rafraichir` (`A-69`) ;
  - une contre-revue par un sous-agent neuf, puis ton accord, sur tout ce qui touche le juge ;
  - une relève de session avant 700 000 tokens (`A-210`).
- **Numérotation `A-`.** Elle est partagée entre l'architecte et les conducteurs. La dernière prise est `A-245`.

## État au 2026-11-21, 16 h 40 UTC (à revérifier sur GitHub)

- **CLI 2.0.0 publiée** le 2026-11-20 à 12 h 27 UTC. C'est le run 44735304350, sur develop `e3bfdff`, avec l'accord du produit (`A-240`). Le registre sert `2.0.0` (`latest`) avec `trustedPublisher`. Empreintes : `cli.cjs` `5e1fe90d…f56d`, `lib.cjs` `661723f7…c549`. Le gel de develop pour `apps/cli/` et `packages/schema/` est levé.
- **develop** est à `302abf4` (#371, `.66`, le git d'essai sans signature).
- **Le sujet `sujet/preuve-suffisante-cas`** est à `06d84d5`, c'est-à-dire develop reporté, avec le conflit de carte résolu en gardant les deux journaux. Le ticket `.67` y est (#372, `54c6761`).
- **Seule PR ouverte : #374 (`.67`, vers le sujet, brouillon, sommet `2190590`).** Le code est fait et poussé, en trois commits : 4c9ebe1, 629971f, 2190590. Il reste à faire, dans l'ordre :
  1. la fusion du sujet `06d84d5` dans la branche, car elle part de `54c6761` ;
  2. la contre-revue par un sous-agent neuf ;
  3. ton accord, après lecture du diff de `scan.ts` ;
  4. le label ;
  5. son entrée dans le sujet.
- **La règle de `.67`** est `A-242` (qui corrige `A-241`), complétée par `A-243` et `A-244` :
  - tout saut à condition fait tomber ses preuves, quelle que soit sa forme, comme le dit déjà `apps/cli/README.md` aux lignes 193 à 197 ;
  - chaque forme le dit par une note, aucune ne se tait ;
  - un test qui existe sous condition reste **actif** pour `testTitles`, donc plus aucun faux « désactivé » ni « n'existe pas » au groupe 5 ;
  - la cible : zéro faux refus, zéro chute sans note, le même nombre de preuves qu'en 2.0.0.
- **À écrire dans le journal de la carte du chantier** : `A-242` à `A-245`. Le conducteur devait le faire après le report de develop, et ne l'a pas fait.

## Ce qui reste, dans l'ordre

1. **Lance ton capitaine, puis ton conducteur.** Utilise les gabarits de `skills/chaine/architecte/references/lancement.md` (version du marketplace) et les consignes du conducteur. Dans sa ligne « Situation », donne-lui :
   - l'état ci-dessus ;
   - le premier geste : lire l'entrée de relève du 2026-11-20, 12 h 35 UTC, puis écrire sa ligne `Conducteur:` dans la fiche de la carte ;
   - la file : #374, puis la livraison.
   Sa ligne `Conducteur:` remplace celle du premier compte, `session_01BxuG311iKEx1FHt7nW3rSJ`.
2. **#374 (`.67`).** La fille du premier compte est arrêtée et tu ne peux pas lui écrire. Le conducteur lance une fille neuve sur la branche `fix/spec-all-anc-5-67-saut-a-condition`, qui suit les étapes 1 à 5 de l'état ci-dessus.
3. **Livraison du sujet dans develop** (skill `sujet`, `livrer`). Le conducteur te la signale avant de la lancer, puis un sous-agent vérifie que l'arbre de la PR est celui du sujet.
4. **CLI 2.0.1.** Dans l'ordre : nouvelles empreintes, puis essai à blanc du workflow « Publier la CLI » (`publier=false`), puis essai sur Fedora et Iroki.
   - **Les sessions d'essai distantes ne lisent pas anchorpost** : leur `add_repo` est refusé par la garde du mode auto. Rattache toi-même `MAJ-agency/fedora` et `MAJ-agency/iroki-monorepo` en lecture à **ta** session (`add_repo`, puis `git clone --depth 1`), et joue les essais chez toi ou chez un sous-agent.
   - **L'hôte des artefacts change d'un run à l'autre** (`productionresultssa1…`, `productionresultssa17…`). S'il est refusé, `update_environment` sur l'environnement du compte, avec l'accord du produit.
   - Montre ensuite les chiffres au produit et demande son accord explicite (`P-54`). Tu peux lancer toi-même la publication par l'outil `actions_run_trigger` (`publier-cli.yml`, ref `develop`, `version`, `publier: true`), puis vérifier avec `npm view @maj-agency/anchorpost@<v> version _npmUser`.
5. **Ensuite, hors de la 2.0.1** :
   - `.22`, le rapport de PR rendu bloquant : décision du produit après lecture du rapport en mode observe. On y a déposé les restes non bloquants des contre-revues ;
   - `.21`, `.23`, `.24` et `.26` : ils attendent des tickets du dépôt `skills` (K1 à K6) ou la 2.0.0 publiée, qui l'est maintenant ; `.21` et `.26` sont donc peut-être débloqués ;
   - un ticket `migrate manifest`, qui passerait un manifeste au schéma 3 : à écrire (`A-231`).

## Ce qui attend le produit

- **Question en suspens, sans réponse.** Un test que la CI ne joue que sous un seed (`describe` ou `test.skip` à condition) doit-il compter comme preuve ?
  - Ma recommandation : **non**. C'est la règle écrite, du côté sûr (`A-66`, `A-242`).
  - Ce qui en découle : Fedora perd 52 preuves venues de ces tests et reste sous trois planchers. Pour passer à la 2.0.x, ses planchers doivent être baissés par une personne (`A-55`), ou ses tests réécrits sans condition.
  - Si le produit répond oui, `.67` change de voie avant d'entrer dans le sujet.
- **Une décision métier, toujours en suspens** : réécrire le cas `RULE_ALL_ANC-19#source-invalide` pour qu'il décrive le comportement réel. Le comportement réel : l'index est écrit sans la règle, une erreur s'affiche dans Fiabilité, et `check` bloque. Ma recommandation : oui.
- **Côté Fedora, avant de passer à la 2.0.x** :
  - corriger cinq entrées de `code` qui citent un dossier au lieu d'un fichier (règles `CMP-02`, `CMP-06`, `ESP-07`, `LIC-16`) ;
  - régler ses planchers, comme au premier point.

## Sessions du premier compte, pour mémoire

**Toutes archivées le 2026-11-21 vers 16 h 50 UTC**, comme les autres filles du chantier : aucune ne reprendra à la levée du quota. Aucun réveil (`send_later`) n'est armé sur ce compte.

| Rôle | Session |
| --- | --- |
| Conducteur, relève 6 | `session_01BxuG311iKEx1FHt7nW3rSJ` |
| Capitaine d'Anchorpost | `session_01BxuG34gQKsuhqcM71Hgxxi` |
| Fille de `.67` | `session_01BxuG2zGVHcMBXLe2ohtr5q` |
| Fille de la mise à jour du sujet | `session_01BxuG31vrtctdAEDXxnhURa` |

## Ce que tu dois savoir du coût et du rythme

- **Ce qui coûte.** Un conducteur fait entre 450 000 et 650 000 tokens en cinq à six heures, pour 45 à 60 $. Une fille coûte 5 à 20 $ par ticket.
- **Ce qui ralentit.** Le contrôle `qualite` met environ 17 minutes, et une seule sous-PR passe à la fois. Compter 25 à 35 minutes par entrée dans le sujet.
- **Ce qui fait gagner du temps.** Regrouper dans une même PR des tickets qui touchent les mêmes fichiers : six passages épargnés la nuit du 19 au 20.
