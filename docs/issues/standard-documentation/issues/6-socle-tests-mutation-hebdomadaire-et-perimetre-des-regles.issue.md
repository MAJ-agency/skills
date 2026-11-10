# `socle-tests` : le workflow de mutation hebdomadaire et le périmètre « règles prouvées » depuis l'index

Status: resolved
Type: task
Blocked by: 5

Fedora lance Stryker chaque dimanche par un workflow GitHub, sur le périmètre des fichiers de code des règles prouvées, et à la demande sur le noyau avec un plancher. Le skill `socle-tests` pose Stryker avec un périmètre vide et sans workflow. Dès qu'un projet a un index Anchorpost, la liste des règles prouvées et leurs fichiers de code sont lisibles : le périmètre « règles » se calcule partout.

## Le besoin

Un projet du socle suivi par Anchorpost peut lancer, sans rien écrire, la mutation hebdomadaire sur ses règles prouvées, et lire un rapport des survivants par règle ; le plancher sur le noyau reste à la demande.

## Où

- `skills/monorepo/socle-tests/references/ci/mutation.yml` (nouveau) : repris de `fedora/.github/workflows/mutation.yml` : `workflow_dispatch` avec le choix `noyau | regles`, `schedule` hebdomadaire, `pnpm --filter <api> mutation` et `mutation:regles`.
- `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs` (nouveau, repris de Fedora) : le périmètre = l'union des `code` des règles de l'index commis `anchorpost/anchorpost.json` (schéma `"2"`, spec `../anchorpost-cli-et-pivot-v2.spec.md` § 5) dont `realisation.status === 'proven'`. Le script lit ce JSON lui-même : il n'importe pas le paquet `@maj-agency/anchorpost`, qui n'est pas encore publié ; un index absent ou d'un autre schéma rend un périmètre vide, dit pourquoi, et sort 0. Un chemin de `code` absent du dépôt est signalé et écarté (c'est `anchorpost check` qui le refuse).
- `skills/chaine/tickets/references/gabarits/regle.md` : une ligne commentée `# code: [ apps/api/src/…/fichier.ts ]   fichiers de code qui réalisent la règle ; périmètre de la mutation par règle`, après `config`. `skills/monorepo/socle-monorepo/references/methode/decisions.md` § registre et `nomenclature.md` s'ils listent les champs d'en-tête d'une règle : le champ y entre.
- `references/gabarits/stryker.regles.config.mjs` (nouveau) ; `SKILL.md` étape 5 et la fiche `tests.md` § Commandes.
- `skills/chaine/anchorpost/SKILL.md` : dit que `socle-tests` lit l'index pour le périmètre, et que `code` est un champ du standard.
- Source à reprendre : `MAJ-agency/fedora`, `.github/workflows/mutation.yml` et `scripts/verify/mutation-regles.mjs`, en lecture seule (`add_repo` en `read`) ; rien ne s'écrit dans Fedora.

## Décisions

- **Le champ `code: string[]` entre au standard**, facultatif, dans l'en-tête d'une règle : ce n'est plus une extension propre à Fedora (décision du produit, 2026-11-10, relayée par le conducteur). Il entre aussi au schéma de la CLI et à l'index (`rules[].code`), et `anchorpost check` refuse un chemin de `code` absent : écrit dans `../anchorpost-cli-et-pivot-v2.spec.md` § 3, § 5, § 7 et § 8, et dans `../refonte-fedora.spec.md` (`code[]` de `rules.json` devient `code`, plus `extensions.fedora.code`).
- Le périmètre se lit dans l'index commis, pas dans le paquet (défaut de l'architecte) : le ticket ne dépend pas de la publication de la CLI.
- Le workflow ne tourne que si le projet a un index ; sinon il sort vert sans rien muter et le dit.

## Surfaces

| Surface                 | Preuve                                                                          |
| ----------------------- | ------------------------------------------------------------------------------- |
| périmètre               | `mutation-regles.test.mjs` sur un index jouet : deux règles prouvées, trois fichiers ; une règle `to-build` ignorée ; un chemin absent écarté ; pas d'index → périmètre vide, sortie 0 |
| workflow                | un `workflow_dispatch` sur un projet posé rend un rapport                        |

## Vérification

`pnpm test` ; sur un projet posé avec Anchorpost, `pnpm --filter <api> mutation:regles` liste le périmètre.

## Answer

- **Le périmètre** : `references/scripts/verify/mutation-regles.mjs` exporte `perimetre(index, existe)`, pure, qui rend `{ fichiers, regles, ecartes, raison? }` (`regles` : règle → fichiers retenus, pour la synthèse ; `ecartes` porte un `motif` en plus de `{ regle, chemin }`). Il lit l'index commis `anchorpost/anchorpost.json` lui-même, sans importer `@maj-agency/anchorpost` : schéma `"2"`, règles dont `realisation.status` vaut `proven`, union de leurs `code`. Index absent, illisible, d'un autre schéma ou sans règle prouvée : périmètre vide, `raison` dite, sortie 0. Écarté et signalé : un chemin absent du dépôt (c'est `anchorpost check` qui le refuse), hors du dépôt (absolu, `..`, octet nul), ou hors périmètre de la mutation (test, `.d.ts`, contrôleur, module, dto, gabarit, autre langage). Une clé de règle est portée telle que l'index l'écrit, zéros compris ; aucun identifiant n'est analysé, donc aucune expression locale.
- **Les points d'entrée** : `mutation-regles.mjs --list` (périmètre du dépôt, un fichier par ligne sur stdout, écarts et raison sur stderr) et `--lancer` (depuis un paquet : Stryker sur les fichiers du paquet ; périmètre vide, rien n'est lancé) ; `mutation-regles-synthese.mjs` (`synthese()`, la synthèse par règle en Markdown : règle → fichiers → survivants, puis le hors périmètre ; « pas de rapport » si le passage a été interrompu).
- **La configuration** : `references/gabarits/stryker.regles.config.mjs` hérite de la configuration du noyau, `break: 0`, fichier incrémental séparé, reporter `json`, `STRYKER_MUTATE` pour un essai local ; son `mutate` vient de `perimetreDuPaquet()` (import de la fonction, pas d'appel shell), avec les globs échappés (`[id].ts`). Une configuration **par paquet qui teste** : les configurations Vitest sont par paquet ; les fichiers d'une règle d'un autre paquet se mutent par la configuration de cet autre paquet.
- **Le workflow** : `references/ci/mutation.yml` : `workflow_dispatch` avec `cible: noyau | regles` (défaut `noyau`), `schedule` le dimanche à 03 h 43 UTC sur `regles`, `permissions: contents: read`, `timeout-minutes: 120`, `concurrency` sans annulation, la cible par `env:` (aucune expression `${{ }}` dans un `run:`), actions épinglées par empreinte, étape de synthèse `always()` vers `$GITHUB_STEP_SUMMARY`.
- **Les documents** : gabarit `regle.md` (`# code:` après `config`), `decisions.md` § registre (le champ y entre, et quitte l'exemple des `extensions`), `skills/chaine/anchorpost/SKILL.md` (une phrase, et le refus d'un chemin de `code` absent), `socle-tests` (`SKILL.md` étapes 2, 3 et 6, `CONTENU.md`), ADR « score de mutation » (le noyau reste à la demande, les règles se mesurent chaque semaine, sans plancher). `nomenclature.md` ne liste aucun champ d'en-tête : rien n'y change.
- **Fedora** : mécanique reprise de `fedora@4bca7dc`, lue par le conducteur (workflow, filtres, configuration, synthèse) ; rien de métier ni de fédération n'est repris, rien n'est écrit dans fedora.
- **Vérification** : `pnpm test` 308 verts ; sur un projet jouet, `--list` avec et sans index, et un vrai Stryker de bout en bout (synthèse par règle, fichier `[id].ts` compris).

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`), à la question de l'humain « est-ce qu'on l'implémente côté Iroki ? ».
- 2026-11-10 — Décision du produit, relayée par le conducteur : le champ `code` entre au standard, facultatif, comme le recommandait le ticket. `## Où` et `## Décisions` mis à jour, specs Anchorpost et Fedora alignées dans la même PR ; ticket passé `ready-for-agent`, bloqué par `5` (même `SKILL.md` de `socle-tests`, ADR renommées par le `5`). Architecte.
- 2026-11-10 — Résolu : périmètre pur lu dans l'index, `--list` et `--lancer`, configuration Stryker par paquet, workflow `mutation.yml` hebdomadaire, champ `code` au gabarit, au registre et au skill Anchorpost ; `pnpm test` 308 verts. mécanique reprise de `fedora@4bca7dc`, lue par le conducteur.
