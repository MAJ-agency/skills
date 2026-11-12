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
| 0   | Corriger ce qui est faux (étape 1 de la source)                             | `anchorpost`, `skills`      | à moitié fait, voir Notes ; le reste en tickets après inventaire  |
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
- **`skills` n'a ni `develop`, ni capitaine, ni CI** : une PR y vise `main` et attend un humain. PR ouvertes : 44, 55, 56.
- **`anchorpost`** : `develop` est à `c0ff374` ; une seule PR ouverte, la 113 (brouillon, `SPEC_ALL_ANC-4.49`, une règle rejoint un ou plusieurs modules).
- Les tickets `SPEC_ALL_SOC-1` `.04`, `.05`, `.06`, `.07`, `.12` sont `ready-for-human` sur `develop`.

## Decisions-so-far

Aucune encore : le tour 1 est posé.

## Fog

- **Vocabulaire des rôles [terme].** Les cartes des deux premiers chantiers nomment « Conducteur » la session qui parle seule au produit et « Architecte » la session qui déroule le skill `chantier`. Le produit emploie les deux mots dans l'autre sens (12/11). Question 1 du tour 1.
- **Où s'arrête l'amont.** Le skill `chantier` fait tout, du grilling au suivi des vagues ; c'est la session qui a dépassé 700 000 tokens deux fois. Question 2 du tour 1.
- **Plafonds d'une session** (décision 2 de la source). Question 3 du tour 1.
- **Skill « modèle de données relationnel »**, idée du produit (12/11). Question 4 du tour 1.
- Décisions 1 et 3 à 8 de la source (§ 6), et la colonne « basse » de la grille : tours suivants.
- Aucun moyen vérifié de savoir, depuis une session, si un capitaine tourne sur `anchorpost`.

## Journal

- 2026-11-12 — Reprise par l'architecte du programme. Lecture de la méthode, du skill `chantier`, de l'environnement. Carte ouverte, tour 1 du grilling posé, inventaire des restes de l'étape 1 lancé (sous-agent de lecture).
