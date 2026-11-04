---
name: fusionner
description: Capitaine de fusion — fait passer vers develop, une par une, les PR portant le label `à-fusionner` (mise à jour avec develop, index régénérés, checks exigés attendus, squash vérifié), fusionne les sous-PR dans leur sujet, livre les sujets finis, et renvoie conflits et CI rouges à la session propriétaire. À lancer dans UNE seule session, « Capitaine de fusion », jamais dans une session de travail. `poser` l'installe une fois dans le dépôt.
argument-hint: 'poser | [numéro de PR]'
disable-model-invocation: true
---

# Capitaine de fusion

`develop` exige une PR à jour avant fusion. Chaque fusion remet donc **toutes** les autres PR en retard. Quand chaque session fusionne elle-même, elle relance sa CI pour rien dès qu'une autre passe avant elle, et le travail grandit au carré du nombre de PR. Un seul capitaine qui fait passer les PR une par une paie **exactement une CI par PR**, sans personne pour surveiller. La merge queue de GitHub ferait ce travail, mais sur un dépôt privé elle demande Enterprise Cloud. Décision : l'ADR « chaîne de production » du dépôt.

## Étape 0 — poser (une fois par dépôt, `poser`)

`scripts/*.sh`, `scripts/revue-exigee.mjs` → `scripts/chaine/` (exécutables), avec `sujet.sh` du skill `sujet`. Les tests `scripts/*.test.mjs` suivent ; ils lisent `depot-jouet.mjs` et `faux-gh.mjs`, posés par `sujet poser` : `node --test scripts/chaine/*.test.mjs`. Dépendances : `git`, `jq`, `gh` authentifié (le capitaine écrit sur GitHub ; depuis une session cloud, `gh api` passe par le proxy).

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

**Automatique (le cas normal).** Copier les scripts hors du worktree (`passer.sh` change de branche), puis lancer la boucle depuis le worktree **en arrière-plan**, sortie dans un journal :

```bash
mkdir -p <scratchpad>/outils && cp scripts/chaine/*.sh scripts/chaine/revue-exigee.mjs <scratchpad>/outils/
bash <scratchpad>/outils/boucle.sh > <scratchpad>/boucle.log 2>&1
```

Suivre le journal avec un `Monitor` filtré sur `FUSIONNÉE|sortie=|ARRÊT|FILE VIDE|conflit|rouges|RELANCE|RENVOI|REGROUPÉE|RECIBLÉE|SUJET EN CONFLIT|LIVRÉ`. La boucle traite seule les sorties 2 à 5 de `passer.sh` et la CI rouge (une relance, puis renvoi) ; un refus corrigeable (sortie 4 : titre trop long ou refusé par commitlint, revue adversariale absente, base hors `sujet/`) renvoie la PR avec son motif (`refus.sh`) ; une PR non éligible sans correction possible (sortie 7 : fermée, brouillon, sans label, déjà `fusion-bloquée`, empilée sur une parente non fusionnée) est sautée sans bruit. Sur un `ARRÊT`, le capitaine traite le cas (suite par code : en-tête de `passer.sh`), puis relance ; sur un `RENVOI`, il prévient la session.

La file lit la CI de chaque PR : états dans l'en-tête de `file.sh`. **À la main** (`file.sh`, `file.sh --next`, `passer.sh`), ordre de la file, sujets et regroupement : en-tête de `boucle.sh`. Codes de sortie de `passer.sh` et la suite à donner : en-tête de `passer.sh`.

## Renvoyer une PR

1. `bash scripts/chaine/renvoyer.sh <n> "<cause en une phrase, fichiers en conflit ou checks rouges>"` : échange les labels, commente la PR et affiche le worktree propriétaire.
2. Prévenir la session propriétaire : `list_sessions` donne la session dont le `cwd` est ce worktree, puis `send_message`. Si aucune session n'est ouverte, le noter pour le compte rendu.

## Fin de passage

Compte rendu à l'utilisateur : PR fusionnées, avec squash et arbre vérifié ; PR renvoyées, avec la cause et la session prévenue ; PR restantes, avec leur état dans `file.sh`. Une fois par mois : `node scripts/docs/archiver-tickets.mjs` (dry-run, sortie relue) puis `--appliquer`.

**Sessions terminées : archivées d'office.** Le capitaine archive (`archive_session`) une session « completed », sans PR ouverte, qui n'organise aucun chantier. Jamais une session qui attend une réponse, ni une session active. **Coût relevé avant d'archiver une fille `chantier:<nom>`** : `get_session` → `external_metadata.usage.cost_usd`, `context_usage.used_tokens`, `last_served_model` ; une ligne dans la section `## Coût` de la carte du chantier, commit sur le sujet ; **puis** `archive_session`. Carte introuvable : ne pas archiver, le dire à l'architecte.

**Branches fusionnées : supprimées par GitHub** (réglage « Automatically delete head branches », liste de l'admin). Les scripts ne suppriment rien : depuis le cloud, le proxy refuse la suppression.

## Ne jamais

- Fusionner une PR sans label, même verte, ou celle d'un autre membre de l'équipe qui ne l'a pas étiquetée lui-même.
- Résoudre un conflit de code à la place de la session propriétaire. Les index générés font exception : ils se régénèrent.
- Rebaser ou pousser en force la branche d'une autre session.
- Contourner la protection de develop avec les droits admin.

## Enseignements

- **Veille de fond + moniteur.** Un moniteur expire ; la veille (tâche de fond qui lit `file.sh`, lance `boucle.sh` sur les PR prêtes et les rouges nouvelles) doit tourner à part, et le moniteur se ré-arme. Une file laissée à elle-même ne se vide pas.
- **Arrêter la veille avant toute action manuelle** (`passer.sh`, `sujet.sh rafraichir … --abandon-si-conflit`) : deux processus dans le worktree le laissent en pleine fusion.
- **Rouge réelle ou instable ?** Lire l'échec avant de relancer. Erreur de typage ou de test déterministe : prévenir la session propriétaire tout de suite, la relance ne sert à rien.
- **« CI en cours » sans job en cours** : aucun run sur le sommet (push perdu). Seul un vrai push la relance (`sujet.sh relancer <pr>` par la session propriétaire), jamais une fusion côté serveur du capitaine.
- **« Arbre du squash ≠ arbre testé »** : chercher une PR fusionnée hors file entre-temps (`git diff <sommet testé> <squash>`).
