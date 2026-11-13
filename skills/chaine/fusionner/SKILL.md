---
name: fusionner
description: Capitaine de fusion — fait passer vers develop, une par une, les PR portant le label `à-fusionner` (mise à jour avec develop, index régénérés, checks exigés attendus, squash vérifié), fusionne les sous-PR dans leur sujet, livre les sujets finis, et renvoie conflits et CI rouges à la session propriétaire. À lancer dans UNE seule session, « Capitaine de fusion », jamais dans une session de travail. `poser` l'installe une fois dans le dépôt.
argument-hint: 'poser | [numéro de PR]'
disable-model-invocation: true
---

# Capitaine de fusion

`develop` exige une PR à jour avant fusion. Chaque fusion remet donc **toutes** les autres PR en retard. Quand chaque session fusionne elle-même, elle relance sa CI pour rien dès qu'une autre passe avant elle, et le travail grandit au carré du nombre de PR. Un seul capitaine qui fait passer les PR une par une paie **exactement une CI par PR**, sans personne pour surveiller. La merge queue de GitHub ferait ce travail, mais sur un dépôt privé elle demande Enterprise Cloud. Décision : l'ADR « chaîne de production » du dépôt.

## Étape 0 — poser (une fois par dépôt, `poser`)

`scripts/*.sh` (dont `veille.sh`), `scripts/identifiant.mjs`, `scripts/revue-exigee.mjs`, `scripts/migrations-ordre.mjs` → `scripts/chaine/` (exécutables), avec `sujet.sh` du skill `sujet`. Dans `package.json` racine, `check:migrations-ordre` : `node scripts/chaine/migrations-ordre.mjs origin/develop HEAD` (le dossier vient de la clé `migrations` de `.claude/chaine.json` ; sans elle, rien à contrôler). Les tests `scripts/*.test.mjs` suivent ; ils lisent `depot-jouet.mjs` et `faux-gh.mjs`, posés par `sujet poser` : `node --test scripts/chaine/*.test.mjs`. Dépendances : `git`, `jq`, `node`, `gh` authentifié (le capitaine écrit sur GitHub ; depuis une session cloud, `gh api` passe par le proxy), et `scripts/docs/identifiants.mjs` du skill `tickets` : `file.sh` et `sujet.sh` lisent les identifiants par `identifiant.mjs`, qui l'importe.

## La règle (`CLAUDE.md` § « Fusion vers develop »)

| Qui                  | Fait                                                   | Ne fait jamais                                                    |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Session de travail   | label `à-fusionner` dès le push                        | fusionner, remettre la branche à jour avec develop                |
| Capitaine            | fait passer la file dans l'ordre, renvoie ce qui casse | résoudre le conflit de code d'une autre session, pousser en force |
| Propriétaire renvoyé | corrige, retire `fusion-bloquée`, remet `à-fusionner`  | fusionner « puisque c'est corrigé »                               |

## Appels GitHub : REST seulement

Les scripts n'appellent GitHub qu'en REST (`gh api`), via `github.sh`. Les commandes `gh pr …` passent par GraphQL, que GitHub refuse depuis les sessions cloud (403). Un nouvel appel passe par `github.sh` ou par `gh api`, jamais par `gh pr`.

## Mise en place (une fois par session capitaine)

`passer.sh` change de branche : il lui faut un worktree **dédié et propre**, avec ses dépendances.

```bash
git fetch origin
git worktree add <scratchpad>/capitaine --detach origin/develop
cd <scratchpad>/capitaine && pnpm install --frozen-lockfile --prefer-offline
```

**Tag `role:capitaine`.** Au démarrage, la session se tague elle-même : `get_session` (sans argument) donne son id, puis `set_session_tags` `add: ["role:capitaine"]`. `list_sessions` filtré par ce tag ne doit rendre qu'**une** session active ; s'il en rend une autre, s'arrêter et le dire à l'humain. Le skill `chantier` trouve le capitaine par ce tag.

## Boucle

**Les scripts joués sont ceux de develop, à chaque tour.** `boucle.sh` se lance depuis le worktree, sans copie manuelle : à chaque tour elle fait `git fetch origin develop`, recopie `scripts/chaine` et `scripts/docs/identifiants.mjs` d'`origin/develop` dans `<git-common-dir>/boucle-outils` (hors de l'arbre de travail, partagé par les worktrees ; `BOUCLE_COPIE` le remplace) et n'appelle que cette copie, jamais les scripts du worktree, que `passer.sh` fait changer de branche. Un correctif de la chaîne fusionné pendant la boucle est joué au tour suivant ; si `boucle.sh` lui-même a changé sur develop, elle se relance dessus (`exec`), PR sautées gardées. `origin/develop`, `scripts/chaine` ou `scripts/docs/identifiants.mjs` introuvable, ou fetch en échec trois fois : `ARRÊT`, sortie 6, jamais de scripts périmés.

**Une seule boucle à la fois, arrêt d'un geste.** Un verrou `flock` (`<git-common-dir>/boucle.verrou`, tenu à travers l'`exec` de relance) refuse une seconde boucle : `REFUS`, sortie 9, même relancée par un processus d'attente oublié. `flock` (util-linux) absent : sortie 6. **Arrêter** : `bash scripts/chaine/boucle.sh --arreter`, jamais un simple `kill` ni `TaskStop` seul. Il pose `<git-common-dir>/boucle-arret`, puis termine la boucle et le passage en cours (les détenteurs réels du verrou, leurs descendants et le groupe noté ; la veille qui la porte n'est tuée que si elle partage ce groupe) ; la trappe remet le worktree propre (`merge --abort` ou `reset --hard`, puis `switch --detach origin/develop`), sortie 143 (TERM) ou 130 (INT). La boucle relit ce fichier au démarrage, en tête de tour, avant `livrer-prets`, avant chaque passage et avant le rafraîchissement final : `ARRÊT demandé`, sortie 10 ; une relance le refuse tant qu'il existe. **Reprendre** : `bash scripts/chaine/boucle.sh --reprendre` retire le fichier puis lance la boucle (refusé, sortie 9 et fichier gardé, si une boucle tient encore le verrou), puis relancer la veille. Option inconnue : `usage`, sortie 64, rien n'est lancé.

**Automatique (le cas normal) : la veille.** Seule la veille tourne sur une copie, puisqu'elle appelle `file.sh` et `boucle.sh` à côté d'elle pendant que `passer.sh` change la branche du worktree ; la boucle qu'elle lance se remplace d'elle-même par la version de develop. Copier, puis lancer depuis le worktree, **en tâche de fond**, la veille et non la boucle seule, sortie dans un journal :

```bash
mkdir -p <scratchpad>/outils && cp scripts/chaine/*.sh scripts/chaine/identifiant.mjs scripts/docs/identifiants.mjs <scratchpad>/outils/
bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1   # --pause <s> (120), --duree <min> (110) ; --sondes <n> n'existe que pour les tests
```

`boucle.sh` s'arrête sur `FILE VIDE` : une PR étiquetée ensuite ne serait vue par personne. `veille.sh` lance la boucle, puis sonde `file.sh` toutes les 2 min (une lecture GitHub, aucune CI) et relance la boucle dès qu'une PR est « prête » ou « CI rouge » sans l'avoir été à la sonde précédente : une PR que la boucle vient de sauter ne la relance pas en rond. Une PR mise de côté « sans CI » la relance quand sa CI apparaît. « CI en cours », « attend », « bloquée » et brouillon ne relancent rien. Journal : `VEILLE <hh:mm> : file vide` au plus toutes les 10 min.

La veille s'arrête d'elle-même, et sa fin réveille la session :

- **`VEILLE FINIE`** (sortie 0) : durée écoulée (110 min, sous la limite de 2 h d'une tâche de fond). La relancer telle quelle.
- **`VEILLE ARRÊTÉE`** : la boucle est sortie en code non nul (`ARRÊT` : gates, install, CI bloquée), et la veille avec le même code. Traiter le cas (suite par code : en-tête de `passer.sh`), puis relancer la veille. Sortie 9 : une autre boucle tient le verrou, ne rien relancer avant de savoir laquelle ; sortie 10 : arrêt demandé, `--reprendre` quand on veut repartir.

Suivre le journal avec un `Monitor` filtré sur `VEILLE FINIE|VEILLE ARRÊTÉE|FUSIONNÉE|MISE À JOUR|sortie=|ARRÊT|conflit|rouges|RELANCE|RENVOI|REGROUPÉE|RECIBLÉE|SUJET EN CONFLIT|LIVRÉ|REFUS|PAS PROPRE`. La boucle traite seule les sorties 2 à 5 de `passer.sh` et la CI rouge (une relance, puis renvoi) ; un refus corrigeable (sortie 4 : titre trop long ou refusé par commitlint, revue adversariale absente, base hors `sujet/`) renvoie la PR avec son motif (`refus.sh`) ; une PR non éligible sans correction possible (sortie 7 : fermée, brouillon, sans label, déjà `fusion-bloquée`, empilée sur une parente non fusionnée) est sautée sans bruit. Un worktree du capitaine pas propre n'est jamais un renvoi : sortie 6 de `passer.sh` (arrêt) comme de `sujet.sh fusionner`, `relancer`, `rafraichir` ou `regrouper` (`PAS PROPRE`, sous-PR laissée dans la file) ; le nettoyer, puis relancer. Une livraison de sujet, tête `sujet/<nom>` ou `livraison/<nom>-<date>`, passe avant `prio:haute`. Une sous-PR en conflit avec son sujet **sur des index générés seuls** n'est pas renvoyée : `sujet.sh fusionner` la met à jour, régénère et pousse (sortie 8, `MISE À JOUR`) ; elle repasse au tour suivant, CI verte. Sur un `RENVOI`, le capitaine prévient la session.

**Sans veille en cours** (capitaine démarré avant que `veille.sh` soit posé, veille arrêtée et pas encore relancée), qui pose `à-fusionner` prévient le capitaine par `send_message` : `docs/agents/chaine-de-production.md` § 2.

La file lit la CI de chaque PR : états dans l'en-tête de `file.sh`. **À la main** (`file.sh`, `file.sh --next`, `passer.sh`), ordre de la file, sujets et regroupement : en-tête de `boucle.sh`. Codes de sortie de `passer.sh` et la suite à donner : en-tête de `passer.sh`.

## Renvoyer une PR

1. `bash scripts/chaine/renvoyer.sh <n> "<cause en une phrase, fichiers en conflit ou checks rouges>"` : échange les labels, commente la PR et affiche le worktree propriétaire.
2. Prévenir la session propriétaire : `list_sessions` donne la session dont le `cwd` est ce worktree, puis `send_message`. Si aucune session n'est ouverte, le noter pour le compte rendu.

## Fin de passage

Compte rendu à l'utilisateur : PR fusionnées, avec squash et arbre vérifié ; PR renvoyées, avec la cause et la session prévenue ; PR restantes, avec leur état dans `file.sh`. Une fois par mois : `node scripts/docs/archiver-tickets.mjs` (dry-run, sortie relue) puis `--appliquer`.

**Les filles d'un chantier, c'est leur conducteur qui les archive** (skill `chantier` § 6.6), après avoir relevé leur coût : le capitaine n'y touche pas. Il archive seulement une session « completed », sans PR ouverte, **sans tag `chantier:`**, qui n'organise aucun chantier. Jamais une session qui attend une réponse, ni une session active.

**Branches fusionnées : supprimées par GitHub** (réglage « Automatically delete head branches », liste de l'admin). Les scripts ne suppriment rien : depuis le cloud, le proxy refuse la suppression.

## Ne jamais

- Fusionner une PR sans label, même verte, ou celle d'un autre membre de l'équipe qui ne l'a pas étiquetée lui-même.
- Résoudre un conflit de code à la place de la session propriétaire. Les index générés font exception : ils se régénèrent.
- Rebaser ou pousser en force la branche d'une autre session.
- Contourner la protection de develop avec les droits admin.

## Enseignements

- **La boucle rejoue develop, la veille sa copie.** La boucle recopie `scripts/chaine` d'`origin/develop` à chaque tour : un correctif fusionné s'applique au tour suivant, sans rien relancer (cas vécu : des livraisons parties en double alors que le correctif était déjà dans develop, la boucle jouant la copie faite à son lancement). Seuls `veille.sh` et `file.sh`, qu'elle sonde, restent ceux de `<scratchpad>/outils/` : un correctif de la veille ne s'applique qu'après une nouvelle copie et une veille relancée.
- **Arrêter la veille (`TaskStop`) et la boucle (`boucle.sh --arreter`) avant toute action manuelle** (`passer.sh`, `sujet.sh rafraichir … --abandon-si-conflit`) : deux processus dans le worktree le laissent en pleine fusion. Le fichier d'arrêt empêche aussi un processus d'attente oublié de relancer la boucle derrière soi (cas vécu : une livraison intermédiaire rouverte par une boucle qu'on croyait arrêtée).
- **Rouge réelle ou instable ?** Lire l'échec avant de relancer. Erreur de typage ou de test déterministe : prévenir la session propriétaire tout de suite, la relance ne sert à rien.
- **« CI en cours » sans job en cours** : aucun run sur le sommet (push perdu). Seul un vrai push la relance (`sujet.sh relancer <pr>` par la session propriétaire), jamais une fusion côté serveur du capitaine.
- **« Arbre du squash ≠ arbre testé »** : chercher une PR fusionnée hors file entre-temps (`git diff <sommet testé> <squash>`).
