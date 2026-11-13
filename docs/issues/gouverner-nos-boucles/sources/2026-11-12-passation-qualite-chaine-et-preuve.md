# Passation — qualité de la chaîne d'agents et preuve suffisante des règles

> Prompt de passation, à donner tel quel à une nouvelle session. Entrée brute au sens de
> `CLAUDE.md` (« `docs/sources/` ») : ce n'est ni une spec ni une décision.
> Analyse complète, avec ses sources : https://claude.ai/artifact/KkAyETCaZb5AjqHXqQJD69
> (artefact privé « Gouverner nos boucles » ; le lire avec l'outil Artifact, action `read`).

## 1. Ta mission

Tu reprends un travail d'analyse terminé et tu en mènes la réalisation. L'analyse a comparé deux
articles sur les boucles d'agents, une conférence d'Anthropic sur la mémoire des agents et un
plugin de Google, à deux dépôts de l'agence Maj :

- `MAJ-agency/skills` : le plugin `maj-skills` (version 4.1.1 au commit `117a365`), qui porte la
  méthode et la chaîne de production par agents ;
- `MAJ-agency/anchorpost` (commit `a880f47` au moment de l'analyse) : le produit Anchorpost, et le
  premier dépôt où la chaîne tourne.

Elle conclut à seize améliorations de la chaîne et à un chantier neuf, la « preuve suffisante » :
pouvoir dire, pour chaque règle métier et à chaque PR, si elle est assez testée. Ce second sujet
vise d'abord les autres projets de l'agence (Fedora, Iroki), Anchorpost n'étant que le terrain
d'essai.

Tu ne décides rien à la place du produit. Huit décisions lui reviennent (§ 6) et la méthode du
dépôt impose un grilling avant toute spec.

## 2. Avant d'agir

1. Lire en entier `CLAUDE.md` des deux dépôts, puis `docs/agents/chaine-de-production.md`,
   `docs/agents/issue-tracker.md` et `docs/methode/grilling.md` d'`anchorpost`.
2. Attacher `MAJ-agency/skills` à la session s'il n'y est pas (`add_repo`), le cloner à côté.
3. Respecter la chaîne sans exception : réserver un ticket avant de coder
   (`node scripts/docs/ticket-libre.mjs <identifiant>`), une branche et une PR brouillon par
   ticket, revue de ticket avant le label `à-fusionner`, ne jamais fusionner soi-même, ne jamais
   remettre une branche à jour avec `develop`. Un lot de plusieurs PR liées vit sur une branche
   `sujet/<nom>` (skill `sujet`). Prose en français, identifiants de code en anglais.
4. Griller avec les skills de Matt Pocock : charger `mattpocock-skills:grilling` puis
   `mattpocock-skills:domain-modeling`. Jamais de grilling à la main.
5. Trois faits d'environnement à connaître :
   - `graphify` est exigé par `CLAUDE.md` mais n'est pas installé dans les sessions cloud, et
     `graphify-out/` n'existe pas. Ne pas tenter de l'utiliser ; c'est l'objet du point 11.
   - Le skill `chantier` et le skill `fusionner` ne se lancent que par un humain.
   - Deux suggestions de tâche ont déjà été proposées à l'utilisateur pour le registre des coûts
     et pour l'encadré d'état de `CLAUDE.md`. Vérifier qu'elles n'ont pas été lancées avant de
     refaire le travail (§ 4, étape 1).

## 3. Ce que l'analyse a établi (faits vérifiés à la source)

Sur la chaîne :

- **Limites écrites, non appliquées.** `chaine-de-production.md` fixe 300 k tokens de contexte
  pour une session fille et 400 k pour l'architecte. Dépassées cinq fois en deux chantiers :
  architecte à 696 k puis 726 k, filles à 407 k, 467 k et 521 k (un ticket à 30,72 $ pour un
  repère de 4 à 7 $). Source : sections `## Coût` et `## Rétro` des deux cartes
  `docs/features/anchorpost/all/SPEC_ALL_ANC-1-anchorpost.map.md` et
  `SPEC_ALL_ANC-4-cli-et-pivot-v2.map.md`.
- **Registre des coûts faux.** `docs/agents/couts.md` affiche 356,56 $. La ligne architecte de la
  carte ANC-4 vaut « 126,65 (le 12/11 à 7 h) » : `scripts/docs/couts.mjs --verify` l'ignore, le
  dit sur stderr et sort en 0. Vrai total : au moins 483,21 $, sans le conducteur ni le capitaine
  du second chantier, ni les tickets `.36`, `.37`, `.39`, `.41`, `.42`.
- **Aucun arrêt d'un chantier.** Seule la boucle bash du capitaine s'arrête
  (`scripts/chaine/boucle.sh --arreter`, fichier local). Aucun skill n'appelle
  `interrupt_session`.
- **Revue contrôlée par son auteur.** La session qui code lance le relecteur, trie ses constats
  et rédige la section. `scripts/chaine/revue-exigee.mjs` ne vérifie que la présence d'un titre
  « Revue… ». Le relecteur tourne sur « le modèle de la session ». Sur les cinq tickets
  `Label: architecte` du premier chantier, la contre-revue de l'architecte a trouvé des défauts
  réels à chaque fois.
- **Leçons non promues.** Au moins huit critères de revue « proposés » dans les deux rétros ne
  sont ni dans `docs/agents/criteres-revue.md` ni dans
  `skills/chaine/revue-adversariale/references/criteres-socle.md`. Un piège connu (pousser depuis
  un worktree) a été vécu deux fois.
- **Garde-fous contournables.** Les hooks de `scripts/agent/` ne voient pas ce qu'écrit un
  programme lancé par l'agent : trois migrations livrées ont été réécrites ainsi. CodeQL
  n'analyse pas les PR vers `sujet/*`.
- **Aucune lecture humaine exigée** entre la validation du découpage et la livraison :
  protection de `develop` à zéro approbation, une centaine de PR fusionnées en quatre jours. Le
  skill `revue-adversariale` parle d'un « relecteur humain » qu'aucun mécanisme ne fait exister.
- **Propriétaires = sessions.** `Architecte:`, `Capitaine:`, `Conducteur:` sont des identifiants
  de session. « Conducteur » n'est pas dans la table des rôles.
- **Skills non testés.** Le dépôt `skills` n'a pas de `.github/`. 
  `skills/monorepo/socle-monorepo/SKILL.md` fait 203 lignes (limite posée : 200). Le skill
  `anchorpost` est au README, pas dans `.claude-plugin/plugin.json`.
- **État du dépôt périmé.** `CLAUDE.md` et `README.md` d'`anchorpost` décrivent un squelette et
  22 règles ; il y en a 23, dont 20 prouvées, la V1 est livrée, la CLI publiée. Tickets
  `SPEC_ALL_SOC-1` `.04`, `.05`, `.07` encore `ready-for-human` alors que leur contenu est livré.
  `.claude/rules/tests.md` dit à tort que `pnpm check` ne joue aucun test.
- **Mémoire.** Une session cloud part d'un conteneur neuf, sans répertoire de mémoire : la seule
  mémoire durable est ce qui est commité.

Sur la preuve des règles (index `anchorpost/anchorpost.json`) :

- 125 preuves pour 20 règles prouvées, de 1 (ANC-17) à 22 (ANC-15) ; 112 unitaires, 10 sur base
  réelle, 3 de propriétés ; aucune au palier P1 (API) ni P2 (bout en bout).
- P0, P1, P2 désignent le type de test, déduit du chemin du fichier (spec
  `SPEC_ALL_ANC-4-cli-et-pivot-v2.spec.md` § 2). Le schéma les nomme `PriorityLevel`.
- Le champ `code` (fichiers qui réalisent une règle) est vide pour les 23 règles ; la mutation
  par règle du skill `socle-tests` n'a donc rien à muter, et Stryker n'est pas installé
  (`apps/api/stryker.config.mjs` : `mutate: []`, `break: 0`).
- Les cas de bord ne sont énumérés nulle part. Le critère T3 de la revue de ticket ne vise que
  « les cas de bord que la règle énonce ».
- Le produit ne garde un instantané que pour la branche d'un espace, n'écoute que l'événement
  `push`, et n'a pas la notion de pull request.

## 4. Le plan, dans l'ordre

Chaque étape donne un ou plusieurs tickets au format du dépôt. Rien ne se code sans ticket.

### Étape 1 — Corriger ce qui est faux (aucune décision à attendre)

1. **Registre des coûts** (`anchorpost`). Corriger la cellule de la carte ANC-4 pour que le
   montant soit lisible. Ne pas éditer `docs/agents/couts.md` à la main : c'est un index généré.
   Le durcissement de `couts.mjs` (montant illisible = sortie en erreur, vérification branchée
   dans `check:gates`) se fait dans `skills`, source du script
   (`skills/chaine/tickets/references/scripts/docs/couts.mjs`), puis se repose dans le projet.
   Fini quand le total du registre égale la somme des cartes.
2. **État du dépôt** (`anchorpost`). Réécrire les encadrés d'état de `CLAUDE.md` et `README.md`
   d'après les tickets, l'index et le code ; corriger `.claude/rules/tests.md` ; vérifier puis
   clore les trois tickets du socle. Rester sous 200 lignes. Poser à l'humain la question de
   `graphify` : l'installer dans le script d'environnement ou retirer l'obligation.
3. **Critères en attente.** Relever dans les deux rétros chaque critère « proposé », l'écrire
   dans `docs/agents/criteres-revue.md` (P4 et suivants, avec la PR d'origine) s'il est propre au
   projet, ou ouvrir un ticket dans `skills` s'il vaut pour tous.
4. **Plugin** (`skills`). Déclarer le skill `anchorpost` dans `plugin.json` ou le retirer du
   README ; ramener `socle-monorepo/SKILL.md` sous 200 lignes.

### Étape 2 — Mesurer la solidité des tests, sans rien bloquer

- Renseigner `code` dans l'en-tête des 20 règles prouvées d'`anchorpost` (chemins depuis la
  racine ; `anchorpost check` refuse un chemin absent). Point de départ : les fichiers
  qu'importent les fichiers de preuve de chaque règle.
- Installer Stryker par le skill `socle-tests` (dépendance à faire valider : le hook demande),
  lancer `mutation:regles` une fois, publier la synthèse par règle.
- Résultat attendu : les premiers chiffres réels. Aucun seuil n'est posé avant cette mesure ;
  c'est le principe écrit du socle (« un plancher se pose sous une mesure du jour »).

### Étape 3 — Griller, puis spécifier

Mener un grilling sur les huit décisions du § 6, puis écrire les specs. Deux specs au moins :

- **Dans `skills`** : les limites des sessions, le gel d'un chantier, la revue que l'auteur ne
  contrôle pas, la relecture des tickets avant la vague, la session de fin de chantier, les
  vérifications refaites en CI, le responsable nommé, les tests des skills (§ 5, points 1 à 10).
- **Dans le standard et la CLI** (`anchorpost`, avec sa copie dans
  `skills/docs/issues/standard-documentation/`) : la preuve suffisante (§ 5, partie B).

### Étape 4 — Réaliser, par tranches de bout en bout

Dans l'ordre : les limites des agents ; puis les cas déclarés avec un pilote sur trois règles
d'Anchorpost, une par criticité ; puis le rapport de PR ; puis le passage en bloquant ; puis le
produit. Fedora et Iroki adoptent les deux champs de règle dès que le standard les porte.

## 5. Le détail de ce qu'il faut construire

### A. La façon dont les agents travaillent (dépôt `skills`)

1. **Arrêter une session qui dépasse.** Clé `plafonds` dans `.claude/chaine.json` (contexte et
   coût d'une fille, contexte de l'architecte, réveils par chantier, renvois par PR). Dans
   `chantier` § 6 : `get_session` de chaque fille à chaque réveil, `interrupt_session` au-delà,
   puis question au produit. L'architecte se l'applique et passe la main. `renvoyer.sh` compte
   les renvois ; au troisième, la PR va à un humain. Le contrôle des cartes refuse un dépassement
   sans décision écrite. Limite connue : contrôle toutes les 45 minutes ; `create_session` ne
   prend pas de budget.
2. **Geler un chantier.** Un état distant (label GitHub ou fichier sur `sujet/<nom>`) que toute
   session lit et qu'un humain pose sans session. `file.sh` ignore les PR d'un sujet gelé.
   Commande d'arrêt : `list_sessions` par tag `chantier:<nom>`, `interrupt_session`,
   `list_triggers`, `delete_trigger`.
3. **Une revue que l'auteur ne contrôle pas.** Bloc structuré dans la section de PR (commit relu,
   bloquants ouverts, constats écartés et leur raison). `revue-exigee.mjs` refuse un commit relu
   périmé ou un bloquant ouvert. Tri en quatre catégories : contesté avec une preuve que le
   relecteur pouvait lire, remonté à l'architecte, corrigé, consigné sans suite ; l'auteur ne
   change jamais une gravité. Relecteur déclaré comme sous-agent du plugin, `tools: [Read, Grep,
   Glob]`, `model` et `effort` au-dessus de ceux de la fille, `maxTurns`. Un axe en échec est
   noté « non exécuté », jamais « zéro constat ». Seconde revue par échantillonnage sur les PR
   ordinaires.
4. **Relire les tickets avant la vague.** Dans `chantier`, avant la validation du découpage : un
   sous-agent neuf reçoit le ticket et les fichiers qu'il nomme, rien d'autre. Il rend une
   paraphrase, les décisions laissées ouvertes, chaque chemin ou symbole cité qui n'existe pas.
   Décision ouverte ou référence morte : `Status: needs-info`.
5. **Session de fin de chantier.** Session à part, avec son budget. Entrées : `list_events` des
   sessions du tag, sections de revue, commentaires de renvoi, `pieges.md`,
   `criteres-revue.md`, `CLAUDE.md`. Sortie : une PR de documentation, chaque ligne avec ses
   exemples et sa fréquence. Le contrôle des cartes refuse `Phase: fini` sans elle.
   `demarrage.mjs` signale un écart de version entre scripts posés et plugin.
6. **Garde-fous en CI.** Job sur les PR vers `develop` et `sujet/**` qui lit le diff : migration
   livrée modifiée, ordre des migrations, chemin sensible sans `Label: architecte`. Protéger
   `sujet/*` pour CodeQL (réglage GitHub, à faire par un administrateur).
7. **Santé de la chaîne.** Index généré `docs/agents/sante-chaine.md` : taux de renvoi, bloquants
   par PR, défauts ouverts après fusion, délai entre label et fusion, coût par ticket et par
   modèle.
8. **Responsable nommé.** `Responsable:` (une personne) dans la carte ; ligne de verdict dans la
   PR de livraison, exigée par `sujet.sh livrer` ; compte rendu du capitaine commité ;
   « Conducteur » dans la table des rôles.
9. **Qui vérifie quoi.** ADR et clé `regimes` dans `chaine.json`. Dépend de la décision 1 (§ 6).
   Dans une session sans humain, le hook qui « demande » doit refuser et prévenir l'architecte.
10. **Tester les skills.** CI du dépôt `skills` ; trois à cinq essais de comportement sur dépôt
    jouet ; preuve par la trace que le relecteur n'a pas vu le contexte du parent.

### B. La preuve suffisante (standard, CLI, `socle-tests`, `tickets`, `revue-de-ticket`)

Principe : écrire l'attendu sur la règle, pour que la machine le compare à l'observé. Jamais de
nombre de tests exigé.

- **Deux champs dans l'en-tête d'une règle** : `criticality` (`low`, `medium`, `high`) et
  `cases[]` (`id`, `kind` : `nominal` | `edge` | `invalid`, `at` facultatif, `title`).
- **Étiquette de cas** : `[RULE_<CTX>_<TRI>-<n>#<cas>]` dans le titre du test ; même identifiant
  dans les fichiers `cas/*.json`.
- **Définitions de criticité, fixées par le produit le 12 novembre 2026** :
  - *Haute* : une erreur casse ou bloque un parcours critique, coûte de l'argent, ouvre un accès,
    expose ou perd une donnée, ou ne se rattrape pas. Exemple : l'enregistrement ou la
    vérification de données le jour d'une épreuve. On ne peut pas attendre le correctif.
  - *Moyenne* : une erreur casse ou bloque un parcours principal, fausse ce que la MOA lit, ou
    laisse entrer des données erronées. Exemple : le CRUD d'une donnée centrale. Les gens
    patientent, on corrige.
  - *Basse* : une erreur gêne, sans conséquence durable.
- **Grille** :

  | Exigence | Basse | Moyenne | Haute |
  | --- | --- | --- | --- |
  | Cas à déclarer | nominal et cas de bord que la règle énonce (à confirmer par le produit) | nominal, cas de bord, entrées invalides, refus | ceux de la moyenne, plus une réponse pour chacune des dix familles |
  | Chaque cas déclaré a sa preuve | toujours | toujours | toujours |
  | Type de preuve | unitaire | celui que la nature impose, plus une preuve à la frontière de l'API par refus et par entrée invalide | ceux de la moyenne, plus le parcours prouvé de bout en bout |
  | Mutation du `code` de la règle | mesurée | ne baisse plus | aucun survivant sans justification écrite |
  | Relecture | revue de ticket | revue de ticket | contre-revue indépendante, puis recette humaine avant l'échéance |

- **Dix familles de cas de bord** : limites ; vide ou absent ; entrée invalide ; doublon et
  rejeu ; ordre et concurrence ; temps ; droits et périmètre ; état rare ; volume ; défaillance
  et reprise.
- **Nature et complexité** ne se déclarent pas : la nature se déduit du `code` (dépôt de données
  → base réelle ; invariant chiffré → propriété ; refus ou entrée externe → API), la complexité
  se mesure par les mutants et les branches.
- **Indicateurs** : cas prouvés sur cas déclarés, types présents sur types exigés, tests creux
  (exacts, dans l'index) ; mutants tués et branches exécutées (mesurés en CI, lus en direct par
  un check run, pour respecter RULE-19) ; verdict `suffisante` / `partielle` / `à construire`.
- **Bloquant** : cas déclaré sans preuve sur une règle que la PR touche ; étiquette de cas
  inconnue ; règle moyenne ou haute à qui manque un type exigé ; mutant survivant non justifié
  sur une règle haute touchée. **Avertissement** : `code` vide, criticité ou cas absents pendant
  la migration, famille sans réponse hors règle haute, mutation en baisse sur une règle moyenne.
- **Répartition** : champs, étiquette, verdict et commande de comparaison entre deux commits dans
  le standard et la CLI ; grille dans `.claude/rules/tests.md` et gate `preuves` dans
  `socle-tests` ; table « cas vers preuve » et refus d'un ticket prêt sans criticité ni cas dans
  `tickets` ; critère T3 réécrit dans `revue-de-ticket` ; gate rejoué en fin de tour par
  `gatesRapides`.
- **Outillage manquant** : aucune preuve à la frontière de l'API aujourd'hui (niveau moyen),
  tests de bout en bout encore en ticket (`SPEC_ALL_SOC-1.12`) et recette humaine jamais jouée
  (niveau haut).

### C. Le dépôt Anchorpost

11. État du dépôt généré depuis l'index (étape 1, puis automatisation).
12. Recette humaine sur l'authentification et les espaces (skill `recette-humaine`, ADR 10) ;
    ajouter gitleaks et `.github/dependabot.yml`.

### D. Le produit Anchorpost (tout passe par un grilling)

13. Pitch : l'outil qui permet à une MOA de répondre d'un logiciel construit par des agents.
14. Page de règle : tableau des cas avec leurs preuves et le verdict ; frise d'histoire calculée
    en comparant les instantanés successifs (méthode à ajouter à `ISnapshotRepository`, fonction
    pure dans le domaine, route, composant).
15. Vue par branche et par PR : règles, specs, tickets nouveaux ou modifiés, leurs preuves, le
    verdict, le coût et qui a vérifié. D'abord le rapport dans la PR ; ensuite l'écran, qui
    demande des instantanés hors branche d'espace, l'événement de PR, et un amendement de
    RULE-18.
16. Chat (V2) : plafond par espace appliqué avant chaque appel au modèle, nombre d'échanges
    borné, jeu de questions hors documentation compté comme preuve de RULE-13.

## 6. Les huit décisions qui reviennent au produit

Les poser en grilling, une à la fois, la recommandation d'abord, sans terme technique.

1. Qui vérifie le code avant la fusion ? Proposé : tests seuls en criticité basse, agent
   indépendant en moyenne, une personne en haute.
2. Quelles limites pour une session ? Proposé : 300 k et 400 k tokens, trois fois le coût
   habituel d'un ticket.
3. Où s'écrivent les cas d'une règle ? Proposé : dans le fichier de règle. À trancher avant que
   les refontes de Fedora et d'Iroki ne figent le format.
4. « Prouvée » change-t-il de sens, avec un statut « partielle » ? Proposé : oui ; amende RULE-6
   et RULE-9.
5. Qui fixe la criticité, et sur quoi ? Proposé : la MOA, sur le parcours déclaré dans la spec ;
   une règle hérite de la plus haute et peut être relevée seule. « Parcours principal » et
   « parcours critique » au glossaire.
6. La mutation tourne-t-elle sur une PR ? Proposé : oui, sur le seul `code` des règles hautes
   touchées ; amende l'ADR du socle.
7. Un cas ajouté à une règle validée demande-t-il une nouvelle validation ? Proposé : seulement
   pour un cas métier.
8. Jusqu'où Anchorpost montre-t-il la fabrication, et à qui ?

Reste à confirmer : le contenu de la colonne « basse » de la grille.

## 7. Ce qu'il ne faut pas faire

- Fixer un nombre de tests par règle, ou un objectif global de couverture.
- Lancer une revue par IA en CI : l'ADR de la chaîne l'a écartée (coût par push, injection par
  le contenu des PR).
- Ajouter des essaims d'agents ou relever `fillesParVague` : sur le second chantier,
  l'architecte a déjà coûté autant que ses 34 filles.
- Ajouter de la prose au harnais sans script ni gate derrière. Le budget de 200 lignes tient.
- Planifier une tâche d'agent récurrente sans humain à l'arrivée.
- Poser un seuil chiffré de mutation ou de couverture avant la première mesure.
- Écrire dans la documentation produit ou dans un commit un identifiant de modèle.

## 8. Comment rendre compte

À la fin de chaque étape : ce qui est fait et vérifié, ce qui reste, les questions ouvertes. Les
écrire en phrases entières, sans abréviation maison : l'utilisateur a rejeté deux fois un style
télégraphique. Être technique et compréhensible : garder les noms de fichiers et de fonctions,
dire à chaque fois ce qu'ils font.
