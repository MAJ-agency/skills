# Gouverner nos boucles — carte du programme

Programme de qualité de la chaîne d'agents et de « preuve suffisante » des règles métier. Cette
carte est la mémoire durable de l'architecte du programme : une session cloud repart d'un
conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la
source, et reprend à la phase indiquée sans reposer une question déjà tranchée.

## Fiche

Phase: 1-grilling (tour 1 validé par le produit le 2026-11-13 ; tour 2 posé)
Architecte du programme: session_017ZgEwMNFyHUf2UViG1WeUv (seul à parler au produit)
Responsable: Guillaume Jauffret
Capitaine d'`anchorpost`: session_017ZgEwKZHhDMQ2ymArgWjdh (lancé par l'architecte le 2026-11-13 à la demande du produit ; tag `role:capitaine`)
Objectif: seize améliorations de la chaîne de production par agents, et un chantier neuf, la preuve suffisante (dire pour chaque règle métier, à chaque PR, si elle est assez testée).
Dépôts: `MAJ-agency/skills` (la méthode), `MAJ-agency/anchorpost` (terrain d'essai), puis `fedora` et `iroki-monorepo` (adoption des deux champs de règle).
Source: [`sources/2026-11-12-passation-qualite-chaine-et-preuve.md`](sources/2026-11-12-passation-qualite-chaine-et-preuve.md) — entrée brute, ni spec ni décision. L'artefact « Gouverner nos boucles » qu'elle cite répond « not found » depuis cette session : la passation fait foi.
Plafond que l'architecte s'applique: 400 000 tokens de contexte ; relevé par `get_session` à chaque fin d'étape, passage de main à une session de suite au-delà.

## Chantiers, dans l'ordre

| n°  | Chantier                                                                    | Dépôt                       | État                                                              |
| --- | --------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| 0   | Corriger ce qui est faux (étape 1 de la source)                             | `anchorpost`, `skills`      | lancé le 2026-11-13 : trois sessions, voir « Chantier 0 »         |
| 1   | Mesurer la solidité des tests (champ `code`, première mesure de mutation)   | `anchorpost`                | attend la fusion de la PR 113 (elle touche les en-têtes de règle) |
| 2   | Limites des sessions, gel d'un chantier, rôles et skill de l'architecte (source § 5 A, points 1, 2, 8) | `skills` | spec écrite le 2026-11-13 ([`plafonds-gel-et-roles.spec.md`](plafonds-gel-et-roles.spec.md)), découpage en cinq tickets à valider par le produit |
| 2 bis | Modèle de données relationnel : étape de grilling, dictionnaire et diagramme générés, axe de revue, section de PR | `skills`, puis `anchorpost` pour l'affichage | décidé (P-5), à spécifier après le chantier 2 |
| 3   | Revue que l'auteur ne contrôle pas, relecture des tickets, fin de chantier  | `skills`                    | grilling, tours suivants                                          |
| 4   | Preuve suffisante : standard, CLI, gates (source § 5 B)                     | `anchorpost`, puis `skills` | grilling, tours suivants                                          |
| 5   | Produit Anchorpost (source § 5 D)                                           | `anchorpost`                | après le chantier 4                                               |

Le chantier 2 passe en premier : c'est lui qui borne l'architecte et ses sessions, donc tous les
chantiers suivants.

## Notes — faits vérifiés le 2026-11-12 au soir, qui corrigent la source

- **Étape 1, points 1 et 2 : déjà fusionnés** sur `develop` d'`anchorpost` (PR 104, encadrés d'état ; PR 105, coût de l'architecte lisible, avec un ticket de durcissement). Le registre `docs/agents/couts.md` affiche 630,56 $ sur 64 sessions et 2 chantiers.
- **`graphify` est installé** dans l'environnement cloud, mais la fin du script de démarrage est cassée (l'`export PATH` est collé au commentaire qui le précède, les guillemets de la boucle sont typographiques) : `graphify update .` ne tourne jamais et `graphify-out/` n'existe dans aucun clone. La boucle corrigée a été jouée à la main : elle produit le graphe d'`anchorpost`, de `skills` et d'`iroki-monorepo`. Correction du script proposée au produit le 2026-11-12.
- **`skills` n'a ni `develop`, ni capitaine, ni CI à lui** (seule l'analyse CodeQL de GitHub tourne sur ses PR, d'après les sessions des tickets 1 à 3) : une PR y vise `main` et attend un humain. PR ouvertes : 44, 55, 56 (la 55 a été fusionnée par le produit dans la nuit du 12 au 13 : `main` est à `342171d`, plugin 4.2.0).
- **`anchorpost`** : `develop` est à `c0ff374` ; une seule PR ouverte, la 113 (brouillon, `SPEC_ALL_ANC-4.49`, une règle rejoint un ou plusieurs modules).
- Les tickets `SPEC_ALL_SOC-1` `.04`, `.05`, `.07` restent `ready-for-human` à juste titre : un commentaire du 2026-11-12 y note « vérifié contre le code, le ticket n'est pas entièrement livré » (base jetable absente pour `.04`, cadence des routes publiques absente pour `.05`, analyse de secrets et deux gates absents pour `.07`). La source se trompait : ils ne sont pas à clore.
- `.claude/rules/tests.md` d'`anchorpost` n'a qu'une phrase inexacte, ligne 21 (« tout le reste tourne partout, au pre-commit comme au pre-push ») : le pre-commit ne joue pas les bancs `node --test` des scripts. À corriger par un ticket d'`anchorpost` (chemin sensible, `Label: architecte`).
- **Les sessions des deux premiers chantiers ne sont pas visibles depuis ce compte** (`get_session` sur le capitaine du chantier `anchorpost-cli` répond « not found ») : l'architecte du programme ne peut ni vérifier qu'un capitaine tourne sur `anchorpost`, ni le prévenir.

## Decisions-so-far

Décisions du produit (tour 1 du grilling, validées en bloc le 2026-11-13) :

- P-1 [terme] — **Les rôles prennent les mots du bâtiment.** L'« Architecte » est la session unique du programme, qui mène l'amont et parle seule au produit ; le « Conducteur de chantier » est la session qui déroule le skill `chantier`. Un ticket de renommage dans `skills` ; les cartes d'avant cette date gardent leur ancien sens et ne sont pas réécrites. Termes posés dans `CONTEXT.md`.
- P-2 — **L'architecte s'arrête à la spec validée.** Le conducteur découpe les tickets, les fait relire par un agent neuf avant la vague, lance les sessions et les suit ; l'architecte ne lit ensuite que les cartes. Un skill dit à l'architecte quoi lire au départ, comment tenir la carte du programme et ce que son environnement doit fournir.
- P-3 — **Arrêt automatique aux plafonds.** Une session de ticket est interrompue à 300 000 tokens de contexte ou à trois fois le coût habituel d'un ticket (environ 20 $), et la question revient au produit : découper, relancer, ou accepter le dépassement par écrit. Un conducteur ou l'architecte, à 400 000 tokens, passe la main à une session de suite. Limite connue : contrôle toutes les 45 minutes.
- P-4 — **`skills` reste relu et fusionné par le produit**, PR vers `main`, sans capitaine ni conducteur, avec un contrôle automatique minimal à chaque PR. L'architecte y lance lui-même les sessions de ticket.
- P-5 — **Le modèle de données relationnel se tient en trois pièces**, plus deux ajouts du produit. Les trois pièces : une étape du grilling qui fixe le modèle (chaque table et colonne rattachée à un terme du glossaire et aux règles qu'elle sert) ; un dictionnaire de données généré depuis les migrations et versionné ; un axe de revue déclenché quand une PR touche les migrations. Les ajouts : un diagramme Mermaid régénéré à chaque création, suppression ou modification de table, visible dans Anchorpost ; et, dans toute PR qui touche le modèle, une section « nouveautés du modèle » (tableau ou visuel).

Décisions de l'architecte (choix techniques, sans effet sur ce que voit un utilisateur) :

- A-1 — **Une seule montée de version du plugin par lot.** Les PR du chantier 0 ne touchent pas la ligne `version` de `.claude-plugin/plugin.json` ; une dernière PR la monte une fois le lot fusionné. Raison : la PR 55, ouverte, modifie déjà cette ligne, et des PR parallèles s'y marcheraient dessus.
- A-2 — **Le skill `anchorpost` est déclaré dans `plugin.json`**, plutôt que retiré du README : il est maintenu (PR 55) et documenté.
- A-3 — **Treize leçons des deux rétros, dix en critères, trois en mécanismes.** Dix deviennent des critères ou un piège (ticket 1). Trois changent un mécanisme et rejoignent le chantier 3 : le gate `tickets` qui n'accepterait que des chemins dans `Fichiers chauds:`, la garde contre un push depuis un `git worktree`, la fusion du sujet dans la PR avant chaque squash.
- A-6 à A-13 — décisions de conception du chantier 2, écrites dans sa spec (label `contre-revue`, lignes `Responsable:` et `Conducteur:` de la carte, carte de programme, clé `plafonds` et script `plafonds.mjs`, renvois comptés sur la PR, ligne `Gel:`, « fille » conservé, contrôle automatique de `skills`).
- A-5 — **Un ticket qui touche deux dépôts se coupe en deux sessions**, une par dépôt, ou se confie à une session ouverte par un humain. Constat du 2026-11-13 : `create_session` ne prend qu'une source ; sans source, la session n'a aucun dépôt malgré la liste de l'environnement ; et l'ajout d'un second dépôt en cours de session (`add_repo`) est refusé par le classifieur de permissions. Deux sessions y ont buté sur `SPEC_ALL_SOC-1.14` (`session_017ZgEwMdAB15RvGMFEuThNT`, 0,70 $, interrompue puis archivée après avoir réservé le ticket ; `session_017ZgEwLZNvoayrikkW3ious`, 0,15 $, archivée).
- A-4 — **Dans `skills`, une session de ticket part de `origin/main` et lit son ticket sur la branche de cadrage** (`git show origin/claude/compassionate-euler-st84s9:<chemin>`). Raison : le dépôt n'a ni sujet ni capitaine ; partir de la branche de cadrage ferait une PR empilée. La session ne modifie pas son ticket : l'architecte tient les statuts ici.

## Chantier 0 — sessions lancées le 2026-11-13 (tag `chantier:gouverner-nos-boucles`)

| Ticket                                                                                                                   | Dépôt                    | Session | PR  | État  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ------- | --- | ----- |
| [`1`](issues/1-criteres-et-pieges-des-deux-retros.issue.md) — dix leçons en critères et piège                            | `skills`                 | `session_017ZgEwMrJhErj5gAFEXirwK` | 59  | livré le 2026-11-13, critères `S15` à `S21`, `T8`, `T9` et le piège lus par l'architecte, attend la fusion humaine ; session archivée |
| [`2`](issues/2-plugin-declare-anchorpost-et-budget-des-skills.issue.md) — plugin complet, banc des 200 lignes            | `skills`                 | `session_017ZgEwHynXjgwREFTcpKqQX` | 58  | livré le 2026-11-13, vérifié par l'architecte (banc joué : 4 cas verts, `SKILL.md` à 189 lignes), attend la fusion humaine |
| [`3`](issues/3-couts-verify-refuse-un-montant-illisible.issue.md) — partie plugin de `SPEC_ALL_SOC-1.14` : un montant illisible fait échouer `couts.mjs --verify` | `skills` | `session_017ZgEwHN4xCPwGoDS3BQSwm` | 60 | livré le 2026-11-13, banc `couts.test.mjs` rejoué par l'architecte (10 cas verts), attend la fusion humaine ; session archivée |
| `SPEC_ALL_SOC-1.14`, repose dans `anchorpost` (branche `fix/spec-all-soc-1-14-couts-verify`, PR 118 en brouillon) | `anchorpost` | — | 118 | attend la fusion humaine de la PR du ticket 3 ; il lui faudra les deux dépôts |

Restent à mettre en tickets dans `anchorpost` : la phrase de `.claude/rules/tests.md`, et la repose des critères du socle une fois le ticket 1 fusionné (la liste `S` d'`anchorpost` saute `S13`).

## Coût

| Session                          | Rôle     | Ticket | Coût $ | Contexte (tokens) |
| -------------------------------- | -------- | ------ | ------ | ----------------- |
| `session_017ZgEwMrJhErj5gAFEXirwK` | ticket   | 1      | 1,32   | 121 699           |
| `session_017ZgEwHynXjgwREFTcpKqQX` | ticket   | 2      | 0,82   | 125 109           |
| `session_017ZgEwHN4xCPwGoDS3BQSwm` | ticket   | 3      | 0,81   | 125 671           |
| `session_017ZgEwMdAB15RvGMFEuThNT` | ticket   | `SPEC_ALL_SOC-1.14` (interrompue, A-5) | 0,70 | 121 835 |
| `session_017ZgEwLZNvoayrikkW3ious` | ticket   | `SPEC_ALL_SOC-1.14` (sans dépôt, A-5)  | 0,15 | 79 375  |
| `session_017ZgEwMNFyHUf2UViG1WeUv` | architecte | —    | 9,20 | 289 647 |

La ligne de l'architecte est un relevé du 2026-11-13 à 8 h 52 UTC, session en cours ; la cellule de coût ne porte qu'un montant, pour rester lisible par `couts.mjs`.

Relevé du 2026-11-13 à 8 h 57 UTC : les trois tickets livrés ont coûté 2,95 $, soit 0,98 $ par ticket ; les deux sessions perdues sur le ticket à deux dépôts, 0,85 $. Les cinq sessions sont archivées.

Repère pour la question des plafonds : une session de ticket démarre déjà au-delà de 100 000 tokens (consignes, skills, `CLAUDE.md`) ; un plafond à 300 000 laisse donc moins de 200 000 tokens de travail.

## Fog

- _(tranché, P-1)_ **Vocabulaire des rôles [terme].** Les cartes des deux premiers chantiers nomment « Conducteur » la session qui parle seule au produit et « Architecte » la session qui déroule le skill `chantier`. Le produit emploie les deux mots dans l'autre sens (12/11). Question 1 du tour 1.
- _(tranché, P-2)_ **Où s'arrête l'amont.** Le skill `chantier` fait tout, du grilling au suivi des vagues ; c'est la session qui a dépassé 700 000 tokens deux fois. Question 2 du tour 1.
- _(tranché, P-3)_ **Plafonds d'une session** (décision 2 de la source). Question 3 du tour 1.
- _(tranché, P-5)_ **Skill « modèle de données relationnel »**, idée du produit (12/11). Question 5 du tour 1.
- **« Aucun nom de modèle dans un commit »** (source § 7) : presque tous les commits fusionnés des deux dépôts en portent un, par la ligne d'attribution que l'outil ajoute seul (« Co-Authored-By »). Soit un réglage la retire pour toutes les sessions, soit la règle ne vise que la prose. À poser au produit.
- _(levé)_ **Capitaine d'`anchorpost`** : le produit a confirmé le 2026-11-13 qu'il n'y en avait plus ; l'architecte en a lancé un. Faute du skill `fusionner` dans une session à un seul dépôt (`Q10`), son mode d'emploi lui est passé en prompt système, copié du plugin 4.2.0. À surveiller : sa mise en place et son premier passage.
- **Session de suite de l'architecte** : elle doit être ouverte par le produit depuis l'application, seule façon d'avoir plusieurs dépôts (A-5).
- **Les skills dans une session créée par une autre session** (`Q10`, posée le 2026-11-13) : une telle session ne reçoit qu'un dépôt, et aucun projet ne porte les skills de la chaîne (`anchorpost` n'a pas de `.claude/skills/`). Elle n'a donc ni `chantier`, ni `revue-de-ticket`, ni `fusionner`. Conditionne le lancement d'un conducteur par l'architecte (P-2) et le ticket 6. Recommandation : recopier les skills d'exploitation dans chaque projet, version comprise.
- **Tour 2 posé le 2026-11-13** : qui vérifie le code avant la fusion (décision 1 de la source), où s'écrivent les cas d'une règle (3), qui fixe la criticité (5), et la portée de la règle sur les noms de modèle.
- Décisions 4, 6, 7, 8 de la source (§ 6), et la colonne « basse » de la grille : tours suivants.
- _(tranché, P-4)_ **Comment `skills` reçoit ses changements** : ni `develop`, ni capitaine, ni CI ; le skill `chantier` ne peut pas s'y dérouler tel quel. Question 4 du tour 1.

## Journal

- 2026-11-12 — Reprise par l'architecte du programme. Lecture de la méthode, du skill `chantier`, de l'environnement. Carte ouverte, tour 1 du grilling posé, inventaire des restes de l'étape 1 lancé (sous-agent de lecture).
- 2026-11-13 — Inventaire rendu : la source se trompait sur les trois tickets du socle et sur `tests.md`. Tickets 1 et 2 écrits, chantier 0 lancé. Script de démarrage de l'environnement corrigé (accepté par le produit ; à prouver par la première session neuve).
- 2026-11-13 — Tickets 1, 2 et 3 livrés (PR 59, 58, 60 de `skills`), vérifiés à la source. Tour 1 validé en bloc par le produit, avec l'ajout du diagramme et de la section de PR pour le modèle de données. Tour 2 posé. Spec du chantier 2 écrite, découpage proposé. Capitaine d'`anchorpost` relancé.
