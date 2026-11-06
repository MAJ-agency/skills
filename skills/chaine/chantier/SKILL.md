---
name: chantier
description: Architecte de chantier — lance ou reprend un chantier de bout en bout. Quelques questions de setup au départ (objectif, échéance, profondeur du grilling, parallélisme ; le modèle se lit sur chaque ticket), fiche écrite dans la carte, puis grilling, specs et tickets prêts pour agent, sujet ouvert, validation du découpage, sessions filles par vagues, suivi sans attente active, livraison par le capitaine et rétro. Reprenable : relancée sur un chantier existant, elle lit la fiche et repart de la phase en cours. À lancer dans une session neuve dédiée, « <Projet> <chantier> — Architecte ».
argument-hint: '[<objectif en une phrase> | <nom du sujet> pour reprendre]'
disable-model-invocation: true
---

# Chantier : l'architecte de bout en bout

Mode d'emploi de fond : `docs/agents/chaine-de-production.md` (rôles § 1, cycle § 2, ticket prêt § 3, fichiers chauds § 4, consignes des filles § 5, économie de tokens § 6), posé par `socle-chaine-de-production`. Cette skill l'exécute dans l'ordre. **Cette session ne tient que ce rôle** : tout autre livrable (deck, étude, recette) part dans une autre session. Contrat du projet : `.claude/chaine.json` (`fillesParVague`).

## 0. Reprendre ou démarrer

1. `git fetch origin develop` puis cherche le chantier : argument = nom de sujet → `git ls-remote origin "sujet/<nom>"` et la carte `docs/**/*.map.md` dont la ligne `Sujet:` le cite (sur `origin/sujet/<nom>`, sinon sur `origin/develop`).
2. **Carte trouvée** : lis sa section `## Fiche` (§ 1) et va à la phase indiquée par sa ligne `Phase:`. Ne repose aucune question déjà répondue.
3. **Rien trouvé** : setup (§ 1).
4. **Le terrain.** `.claude/chaine.json` absent → invoquer `/maj-skills:socle-chaine-de-production` (il pose aussi `tickets`) ; `scripts/verify/coverage-diff.mjs` absent → invoquer `/maj-skills:socle-tests`. Chacun ouvre une PR : elle passe au capitaine comme une PR de cadrage, et **aucune fille ne part avant sa fusion** — un chantier sans gates fait coder des filles que rien ne relit. Poser un socle est du cadrage, pas un ticket : l'architecte le fait lui-même.
5. Vérifie qu'un capitaine tourne : `list_sessions` filtré par `tags: ["role:capitaine"]` (jamais par le titre), une session active. Sinon, dis-le à l'humain (il en ouvre une avec le skill `fusionner`) ; on peut avancer jusqu'à la phase 3 sans lui.

## 1. Setup : les questions

Ne demander que ce que l'argument et la spec ne donnent pas, **en une fois**. D'abord en texte libre si absent : l'objectif en une phrase (« ce qu'on doit pouvoir montrer »). Puis, pour les seules questions restantes, un seul appel `AskUserQuestion`. Une session lancée par une autre session n'a pas d'humain devant `AskUserQuestion` : une vague donnée dans l'argument est **validée**, une spec donnée vaut « grilling : aucun », les défauts du tableau s'appliquent sans demander.

| Question                          | Options (la première est recommandée)                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Échéance ?                        | Démo ou recette datée (la date en « Autre ») · Pas d'échéance                                                                                               |
| Grilling ?                        | Complet : une question à la fois, recherche et recommandation · Court : je ne tranche que les points ouverts · Aucun : la spec existe (chemin en « Autre ») |
| Parallélisme : filles par vague ? | la valeur de `.claude/chaine.json` · 3 · 10                                                                                                                 |

Le **modèle des filles** ne se demande pas : il se lit sur la ligne `Modèle:` de chaque ticket.

Puis :

- **Nom du sujet** : `sujet/<chantier>` en kebab-case, proposé et confirmé dans le même message que le récapitulatif.
- **Fiche** : crée la carte **à côté de sa spec, sous le même identifiant** (`<ID>-<slug>.map.md` ; sans spec encore, `node scripts/docs/next-id.mjs <TRI>` donne l'identifiant de la spec à venir), dans `docs/features/<feature>/`. Gabarit : `docs/agents/gabarits/carte.map.md` ; elle commence par la section `## Fiche` (`Phase: 1-grilling`, `Architecte:` l'id de cette session par `get_session`, `Objectif:`, `Échéance:`, `Grilling:`, `Filles par vague:`, `Capitaine:`).
- **Sujet et PR de cadrage** : `bash scripts/chaine/sujet.sh ouvrir <nom>`, branche `docs/<nom>-cadrage` depuis `origin/sujet/<nom>`, commit de la carte, PR **brouillon** vers `sujet/<nom>` par l'outil GitHub MCP (`create_pull_request`, `draft: true`). Elle porte la carte, puis les specs et les tickets ; c'est la réservation visible du chantier.

Chaque changement de phase met à jour la ligne `Phase:` et se pousse : c'est ce qui rend le skill reprenable sans relire la conversation. **Après la PR de cadrage**, une mise à jour de la carte (phase, sessions d'une vague, coût, incidents, rétro) se pousse **directement sur `sujet/<nom>`**, sans PR : un **clone normal** sur `origin/sujet/<nom>` (jamais un `git worktree` : le pre-push y lance des tests qui corrompent la config git partagée, `docs/agents/pieges.md`), le seul fichier `*.map.md` dans le commit (`docs(<scope>): carte … (<identifiant>)`), Prettier, `git pull --ff-only` puis `git push origin HEAD:sujet/<nom>` (jamais de force). Reste une PR : le cadrage (specs et tickets dont les filles dépendent) et la ligne `Phase: fini`, qui va dans develop.

## 2. Phase 1 — grilling (`Phase: 1-grilling`)

- **Complet** : par les skills de Matt Pocock (`docs/methode/grilling.md` : `grilling` puis `domain-modeling`), une question à la fois. Avant chaque question, la recherche (code de `origin/develop` en worktree détaché, `fichier:ligne` ; registre de règles ; outil en place) — par un sous-agent `Explore` quand elle est large, pour garder ce contexte léger. Chaque question porte une **recommandation**.
- **Court** : la liste des points ouverts en un message, chacun avec sa recommandation ; l'humain répond en bloc.
- **Aucun** : lire la spec donnée, relever ses trous en un message.

Chaque décision va dans `## Decisions-so-far` de la carte (`A-1`, `A-2`…), ce qui reste flou dans `## Fog`. Une décision qui fixe un terme du domaine est marquée `[terme]` (`docs/agents/domain.md`). Rien d'autre dans le dépôt pendant le grilling. Fin : `Phase: 2-decoupage`.

## 3. Phase 2 — specs, tickets, découpage (`Phase: 2-decoupage`)

0. Specs déjà dans le sujet (`origin/sujet/<nom>`) : noter « phase 3 sautée » dans la fiche ; la PR de cadrage (carte seule) ne bloque alors aucune fille.
1. Specs (`docs/agents/issue-tracker.md`, gabarit `docs/agents/gabarits/spec.spec.md`), `Sujet: sujet/<nom>` en tête. Les décisions `[terme]` deviennent des lignes de `GLOSSARY.md` dans la même PR de cadrage ; une spec n'emploie que des termes du glossaire, et cite les règles métier du registre sans les formuler.
2. Tickets **prêts pour agent** au format de `docs/agents/chaine-de-production.md` § 3 (gabarit `docs/agents/gabarits/ticket.issue.md`) : `Blocked by:`, `Modèle:`, `Fichiers chauds:`, sections `Où` / `Décisions` / `Surfaces` / `Vérification`. Toute fonction citée dans `Où` vient avec son **appelant réel** (route, listener, cron). Ticket dont la contre-revue revient à l'architecte (§ 6.5) : ligne `Label: architecte` en tête. Un ticket ≤ 1 jour. Beaucoup de tickets sur le schéma → un ticket « socle » en vague 1 qui pose tout le schéma et les migrations (horodatages réservés dans le brief). Un ticket qui crée un module d'authentification, de droits, de chiffrement, de paiement ou d'export ajoute son dossier à `cheminsSensibles` de `.claude/chaine.json` **dans la même PR de cadrage** : la liste ne se complète qu'ici et à la revue (critère S14).
3. Vagues : `node scripts/docs/vagues.mjs <spec> --max <Filles par vague>` propose les vagues (bloquants faits, fichiers chauds disjoints) ; l'architecte les relit (une raison écrite pour s'en écarter) et les copie dans la carte, section `## Vagues`.
4. **Validation** par `AskUserQuestion` (un seul point de contrôle humain) : le tableau des vagues (ticket, objet, modèle, fichiers chauds) en aperçu ; options « Lancer » · « Modifier » (l'humain dit quoi) · « Arrêter ici ».
5. « Lancer » : PR de cadrage hors brouillon (`update_pull_request`), label `à-fusionner` (`issue_write`). `Phase: 3-specs-en-fusion`.

## 4. Phase 3 — specs dans le sujet (`Phase: 3-specs-en-fusion`)

Le capitaine squashe la PR de cadrage dans le sujet dès sa CI légère verte. **Aucune fille avant** (sauf si les specs sont déjà dans le sujet : phase sautée, § 3 point 0 ; cas vécu : douze PR en conflit). Ne pas sonder : `send_later` à 20 min, puis vérifier que les tickets sont sur `origin/sujet/<nom>`. Fait : `Phase: 4-vague-1`.

## 5. Phase 4 — vagues (`Phase: 4-vague-<k>`)

Pour chaque ticket de la vague, `create_session` :

- `title` : `<Projet> <chantier> — <identifiant> <objet court>` ; `tags` : `["chantier:<nom>"]` ; `source_url` : le dépôt ; `source_revision` : `sujet/<nom>` ; `model` : celui du ticket.
- `prompt` : le gabarit de `docs/agents/chaine-de-production.md` § 5, cité par renvoi et non recopié. La ligne de situation particulière n'y figure que s'il y en a une.

Puis : la vague dans la carte (ticket → session), `/compact`, et `send_later` à 45 min. **Pas d'attente active**, pas de réponse aux fins de session.

**Dernière vague**, si le projet a des E2E joués au passage seulement : poser `ci-complète` sur la première PR qu'une fille ouvre, puis, au réveil qui suit sa sortie du brouillon, relancer son dernier run CI (`actions_list`, puis `actions_run_trigger` `rerun_workflow_run`) : les E2E n'ont tourné sur aucune sous-PR, et le develop reçu par le sujet a pu les casser.

## 6. Suivi (à chaque réveil)

0. **Réarmer d'abord.** Première action du réveil : `send_later` à 45 min ; dernière action : le remplacer si la suite a changé (vague finie, livraison). Un conteneur redémarré au milieu d'un tour, sans réveil armé, a coûté six heures.
1. `node scripts/docs/avancement.mjs sujet/<nom>` (et `bash scripts/chaine/sujet.sh etat` pour le sujet lui-même) : tickets faits, PR renvoyées (`fusion-bloquée`), sessions bloquées (`list_sessions` filtré sur le tag, puis `get_session` : `status_bucket` working, blocked, review_ready, completed ou failed ; `blocked` et `failed` demandent une action).
2. **Une fille `blocked`** : sa question est à lire dans `list_events` (`kinds: ["assistant"]`) : son `send_message` n'arrive pas toujours. Une demande d'autorisation y apparaît aussi : la remonter à l'humain, jamais élargir les permissions.
3. Une PR renvoyée : vérifier que sa fille l'a vue (le capitaine la prévient), sinon `send_message`. Session inactive (`send_message` refusé) : relancer une fille sur la branche de la PR (`source_revision` = la branche) avec, en ligne de situation, le renvoi à lire dans les commentaires de la PR.
4. Une question de fille : y répondre si la carte la tranche, sinon la remonter à l'humain par `AskUserQuestion` (options, la recommandée en premier). Une question en prose est restée 17 h sans réponse : l'humain ne savait pas comment répondre.
5. **Contre-revue de l'architecte** sur toute PR qui touche un chemin sensible (`.claude/chaine.json`), par sous-agent, une fois le code poussé (pas sur le seul commit de réservation) ; des écarts réels ont été trouvés dans chacun des neuf tickets API relus, malgré la revue adversariale de la fille. Écart bloquant : `fusion-bloquée` et la liste à la fille, avant que le capitaine squashe. Le capitaine fusionne dès la CI verte, avant le réveil suivant. Pour un ticket `Label: architecte`, la fille livre **sans** `à-fusionner` ; l'architecte contre-relit, puis pose le label lui-même.
6. Vague entièrement fusionnée dans le sujet → `git show --stat` du squash de chaque sous-PR : une PR étiquetée avant que son push aboutisse entre avec son seul commit de réservation. Puis `bash scripts/chaine/sujet.sh rafraichir <nom>` : entre deux vagues aucune sous-PR n'est ouverte, c'est le moment de recevoir develop. Puis relire le coût de ses filles dans la carte (`## Coût`, § 7) : le capitaine l'a relevé à l'archivage de chacune ; une fille archivée sans ligne de coût est à signaler au capitaine. Le registre transverse `docs/agents/couts.md` en est régénéré à la fusion suivante (index généré) : il donne à tout moment le coût de production de tous les chantiers. Puis vague suivante (§ 5), `Phase: 4-vague-<k+1>`. Sinon `send_later` à 45 min.
7. L'humain demande l'avancement : la sortie de `node scripts/docs/avancement.mjs sujet/<nom>` (pourcentage de tickets faits, PR, CI, bloqués). Pas de réexamen.

## 7. Phase 5 — livraison et rétro (`Phase: 5-livraison`), phase 6 — nettoyage (`Phase: 6-nettoyage`, puis `Phase: fini`)

1. Tous les tickets `Fait` : le capitaine livre le sujet (`sujet.sh livrer-prets`), commit de merge vers develop. Échéance proche ou sujet « VIEUX » : proposer à l'humain `sujet.sh livrer <nom> "<titre>"`.
2. Rétro dans la carte, section `## Rétro` :
   - **Coût** : section `## Coût` (source du registre `docs/agents/couts.md`, index généré), une ligne par session (`get_session` : `external_metadata.usage.cost_usd`, `context_usage.used_tokens`, `last_served_model`) — filles du tag `chantier:<nom>` relevées à chaque fin de vague, puis capitaine et cette session-ci en fin de chantier. Puis le total, le coût moyen par ticket et le rapport architecte / filles, comparés aux repères de `chaine-de-production.md` § 6.
   - **Incidents** : chaque renvoi ou vague ratée donne une ligne de `docs/agents/pieges.md`, un critère de `revue-adversariale` ou un ticket de gate. Un incident vécu deux fois sans gate est signalé à l'humain.
3. Sessions filles finies : le capitaine les archive.
4. **Nettoyage**, une fois le sujet dans develop (`git merge-base --is-ancestor origin/sujet/<nom> origin/develop`) : `Phase: 6-nettoyage`, puis les branches du chantier encore sur `origin` (le réglage « Automatically delete head branches » les supprime seul à la fusion ; le reste se supprime d'un poste local, **jamais d'une session cloud**, le proxy refuse la suppression) ; les sessions filles du tag encore actives : `archive_session` après relevé du coût ; les `send_later` restants : `list_triggers`, `delete_trigger` ; `Phase: fini` dans la carte, par une PR docs vers develop.

## Ne jamais

- Coder un ticket, fusionner une PR, remettre à jour la branche d'une fille.
- Lancer une fille avant que les specs et ses `Blocked by:` soient fusionnés dans le sujet, ou lui faire « fusionner localement » une dépendance.
- Recopier les règles dans un prompt de fille : elles vivent dans `chaine-de-production.md` § 5.
- Produire dans cette session un livrable d'un autre rôle.
- Élargir les permissions d'une session : remonter le besoin à l'humain.
