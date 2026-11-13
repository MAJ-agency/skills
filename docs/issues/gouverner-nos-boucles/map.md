# Gouverner nos boucles — carte du programme

Programme de qualité de la chaîne d'agents et de « preuve suffisante » des règles métier. Cette
carte est la mémoire durable de l'architecte du programme : une session cloud repart d'un
conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la
source, et reprend à la phase indiquée sans reposer une question déjà tranchée.

## Fiche

Phase: 1-grilling (tour 1 posé le 2026-11-12, réponses attendues)
Architecte du programme: session_017ZgEwMNFyHUf2UViG1WeUv (seul à parler au produit)
Responsable: Guillaume Jauffret
Objectif: seize améliorations de la chaîne de production par agents, et un chantier neuf, la preuve suffisante (dire pour chaque règle métier, à chaque PR, si elle est assez testée).
Dépôts: `MAJ-agency/skills` (la méthode), `MAJ-agency/anchorpost` (terrain d'essai), puis `fedora` et `iroki-monorepo` (adoption des deux champs de règle).
Source: [`sources/2026-11-12-passation-qualite-chaine-et-preuve.md`](sources/2026-11-12-passation-qualite-chaine-et-preuve.md) — entrée brute, ni spec ni décision. L'artefact « Gouverner nos boucles » qu'elle cite répond « not found » depuis cette session : la passation fait foi.
Plafond que l'architecte s'applique: 400 000 tokens de contexte ; relevé par `get_session` à chaque fin d'étape, passage de main à une session de suite au-delà.

## Chantiers, dans l'ordre

| n°  | Chantier                                                                    | Dépôt                       | État                                                              |
| --- | --------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| 0   | Corriger ce qui est faux (étape 1 de la source)                             | `anchorpost`, `skills`      | lancé le 2026-11-13 : trois sessions, voir « Chantier 0 »         |
| 1   | Mesurer la solidité des tests (champ `code`, première mesure de mutation)   | `anchorpost`                | attend la fusion de la PR 113 (elle touche les en-têtes de règle) |
| 2   | Limites des sessions, gel d'un chantier, rôles (source § 5 A, points 1, 2, 8) | `skills`                    | grilling, tour 1                                                  |
| 3   | Revue que l'auteur ne contrôle pas, relecture des tickets, fin de chantier  | `skills`                    | grilling, tours suivants                                          |
| 4   | Preuve suffisante : standard, CLI, gates (source § 5 B)                     | `anchorpost`, puis `skills` | grilling, tours suivants                                          |
| 5   | Produit Anchorpost (source § 5 D)                                           | `anchorpost`                | après le chantier 4                                               |

Le chantier 2 passe en premier : c'est lui qui borne l'architecte et ses sessions, donc tous les
chantiers suivants.

## Notes — faits vérifiés le 2026-11-12 au soir, qui corrigent la source

- **Étape 1, points 1 et 2 : déjà fusionnés** sur `develop` d'`anchorpost` (PR 104, encadrés d'état ; PR 105, coût de l'architecte lisible, avec un ticket de durcissement). Le registre `docs/agents/couts.md` affiche 630,56 $ sur 64 sessions et 2 chantiers.
- **`graphify` est installé** dans l'environnement cloud, mais la fin du script de démarrage est cassée (l'`export PATH` est collé au commentaire qui le précède, les guillemets de la boucle sont typographiques) : `graphify update .` ne tourne jamais et `graphify-out/` n'existe dans aucun clone. La boucle corrigée a été jouée à la main : elle produit le graphe d'`anchorpost`, de `skills` et d'`iroki-monorepo`. Correction du script proposée au produit le 2026-11-12.
- **`skills` n'a ni `develop`, ni capitaine, ni CI** : une PR y vise `main` et attend un humain. PR ouvertes : 44, 55, 56 (la 55 a été fusionnée par le produit dans la nuit du 12 au 13 : `main` est à `342171d`, plugin 4.2.0).
- **`anchorpost`** : `develop` est à `c0ff374` ; une seule PR ouverte, la 113 (brouillon, `SPEC_ALL_ANC-4.49`, une règle rejoint un ou plusieurs modules).
- Les tickets `SPEC_ALL_SOC-1` `.04`, `.05`, `.07` restent `ready-for-human` à juste titre : un commentaire du 2026-11-12 y note « vérifié contre le code, le ticket n'est pas entièrement livré » (base jetable absente pour `.04`, cadence des routes publiques absente pour `.05`, analyse de secrets et deux gates absents pour `.07`). La source se trompait : ils ne sont pas à clore.
- `.claude/rules/tests.md` d'`anchorpost` n'a qu'une phrase inexacte, ligne 21 (« tout le reste tourne partout, au pre-commit comme au pre-push ») : le pre-commit ne joue pas les bancs `node --test` des scripts. À corriger par un ticket d'`anchorpost` (chemin sensible, `Label: architecte`).
- **Les sessions des deux premiers chantiers ne sont pas visibles depuis ce compte** (`get_session` sur le capitaine du chantier `anchorpost-cli` répond « not found ») : l'architecte du programme ne peut ni vérifier qu'un capitaine tourne sur `anchorpost`, ni le prévenir.

## Decisions-so-far

Décisions de l'architecte (choix techniques, sans effet sur ce que voit un utilisateur) :

- A-1 — **Une seule montée de version du plugin par lot.** Les PR du chantier 0 ne touchent pas la ligne `version` de `.claude-plugin/plugin.json` ; une dernière PR la monte une fois le lot fusionné. Raison : la PR 55, ouverte, modifie déjà cette ligne, et des PR parallèles s'y marcheraient dessus.
- A-2 — **Le skill `anchorpost` est déclaré dans `plugin.json`**, plutôt que retiré du README : il est maintenu (PR 55) et documenté.
- A-3 — **Treize leçons des deux rétros, dix en critères, trois en mécanismes.** Dix deviennent des critères ou un piège (ticket 1). Trois changent un mécanisme et rejoignent le chantier 3 : le gate `tickets` qui n'accepterait que des chemins dans `Fichiers chauds:`, la garde contre un push depuis un `git worktree`, la fusion du sujet dans la PR avant chaque squash.
- A-5 — **Un ticket qui touche deux dépôts se coupe en deux sessions**, une par dépôt, ou se confie à une session ouverte par un humain. Constat du 2026-11-13 : `create_session` ne prend qu'une source ; sans source, la session n'a aucun dépôt malgré la liste de l'environnement ; et l'ajout d'un second dépôt en cours de session (`add_repo`) est refusé par le classifieur de permissions. Deux sessions y ont buté sur `SPEC_ALL_SOC-1.14` (`session_017ZgEwMdAB15RvGMFEuThNT`, 0,64 $, interrompue ; `session_017ZgEwLZNvoayrikkW3ious`, 0,15 $, archivée).
- A-4 — **Dans `skills`, une session de ticket part de `origin/main` et lit son ticket sur la branche de cadrage** (`git show origin/claude/compassionate-euler-st84s9:<chemin>`). Raison : le dépôt n'a ni sujet ni capitaine ; partir de la branche de cadrage ferait une PR empilée. La session ne modifie pas son ticket : l'architecte tient les statuts ici.

## Chantier 0 — sessions lancées le 2026-11-13 (tag `chantier:gouverner-nos-boucles`)

| Ticket                                                                                                                   | Dépôt                    | Session | PR  | État  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ------- | --- | ----- |
| [`1`](issues/1-criteres-et-pieges-des-deux-retros.issue.md) — dix leçons en critères et piège                            | `skills`                 | `session_017ZgEwMrJhErj5gAFEXirwK` | 59  | livré le 2026-11-13, critères `S15` à `S21`, `T8`, `T9` et le piège lus par l'architecte, attend la fusion humaine ; coût à relever |
| [`2`](issues/2-plugin-declare-anchorpost-et-budget-des-skills.issue.md) — plugin complet, banc des 200 lignes            | `skills`                 | `session_017ZgEwHynXjgwREFTcpKqQX` | 58  | livré le 2026-11-13, vérifié par l'architecte (banc joué : 4 cas verts, `SKILL.md` à 189 lignes), attend la fusion humaine |
| [`3`](issues/3-couts-verify-refuse-un-montant-illisible.issue.md) — partie plugin de `SPEC_ALL_SOC-1.14` : un montant illisible fait échouer `couts.mjs --verify` | `skills` | à noter | — | lancé le 2026-11-13 |
| `SPEC_ALL_SOC-1.14`, repose dans `anchorpost` (branche `fix/spec-all-soc-1-14-couts-verify`, PR 118 en brouillon) | `anchorpost` | — | 118 | attend la fusion humaine de la PR du ticket 3 ; il lui faudra les deux dépôts |

Restent à mettre en tickets dans `anchorpost` : la phrase de `.claude/rules/tests.md`, et la repose des critères du socle une fois le ticket 1 fusionné (la liste `S` d'`anchorpost` saute `S13`).

## Coût

| Session                          | Rôle     | Ticket | Coût $ | Contexte (tokens) |
| -------------------------------- | -------- | ------ | ------ | ----------------- |
| `session_017ZgEwHynXjgwREFTcpKqQX` | ticket   | 2      | 0,77   | 123 602           |

Repère pour la question des plafonds : une session de ticket démarre déjà au-delà de 100 000 tokens (consignes, skills, `CLAUDE.md`) ; un plafond à 300 000 laisse donc moins de 200 000 tokens de travail.

## Fog

- **Vocabulaire des rôles [terme].** Les cartes des deux premiers chantiers nomment « Conducteur » la session qui parle seule au produit et « Architecte » la session qui déroule le skill `chantier`. Le produit emploie les deux mots dans l'autre sens (12/11). Question 1 du tour 1.
- **Où s'arrête l'amont.** Le skill `chantier` fait tout, du grilling au suivi des vagues ; c'est la session qui a dépassé 700 000 tokens deux fois. Question 2 du tour 1.
- **Plafonds d'une session** (décision 2 de la source). Question 3 du tour 1.
- **Skill « modèle de données relationnel »**, idée du produit (12/11). Question 5 du tour 1.
- **« Aucun nom de modèle dans un commit »** (source § 7) : presque tous les commits fusionnés des deux dépôts en portent un, par la ligne d'attribution que l'outil ajoute seul (« Co-Authored-By »). Soit un réglage la retire pour toutes les sessions, soit la règle ne vise que la prose. À poser au produit.
- Décisions 1 et 3 à 8 de la source (§ 6), et la colonne « basse » de la grille : tours suivants.
- **Comment `skills` reçoit ses changements** : ni `develop`, ni capitaine, ni CI ; le skill `chantier` ne peut pas s'y dérouler tel quel. Question 4 du tour 1.

## Journal

- 2026-11-12 — Reprise par l'architecte du programme. Lecture de la méthode, du skill `chantier`, de l'environnement. Carte ouverte, tour 1 du grilling posé, inventaire des restes de l'étape 1 lancé (sous-agent de lecture).
- 2026-11-13 — Inventaire rendu : la source se trompait sur les trois tickets du socle et sur `tests.md`. Tickets 1 et 2 écrits, chantier 0 lancé. Script de démarrage de l'environnement corrigé (accepté par le produit ; à prouver par la première session neuve).
