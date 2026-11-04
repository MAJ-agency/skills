---
name: tickets
description: Convention et outillage des specs et tickets d'un dépôt — identifiants `<PRÉFIXE>-<n>` et `<PRÉFIXE>-<n>.<NN>`, fichiers sous docs/features/, ligne `Status:` à vocabulaire fermé, ticket « prêt pour agent », réservation d'un ticket entre sessions parallèles, vagues et avancement d'un chantier, archivage. Pose les scripts et les gabarits dans le projet, et migre des tickets existants. Use when creating a spec or a ticket, numbering a document, checking whether a ticket is free before coding, computing waves or progress of a project, or migrating a repo's tickets to this convention.
argument-hint: '[poser | migrer <feature> <TRI> | libre <id> | prochain <PRÉFIXE> | vagues <SPEC> | avancement <sujet/x|SPEC>]'
---

# Tickets

Une seule convention pour les specs et les tickets, et les scripts qui la lisent. Les skills `chantier`, `sujet` et `fusionner` ne connaissent le format d'un ticket que par ces scripts.

**Ce skill décide la convention, il ne la discute pas** : un dépôt qui en a une autre migre (étape 3). Tous les gabarits et scripts vivent dans [`references/`](references/) ; les scripts sont **copiés dans le projet**, pas appelés depuis le plugin : la CI et les hooks git doivent les trouver sans plugin installé.

## La convention

| Quoi                       | Forme                                                       | Exemple                                        |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Identifiant d'une spec     | `<PRÉFIXE>-<n>` — trigramme du sujet, précédé d'une portée s'il y en a une ; `n` unique par préfixe dans tout `docs/` | `SOC-1`, `ALL-FOF-12`, `FFSA-LIC-3`           |
| Identifiant d'un ticket    | `<PRÉFIXE>-<n>.<NN>` — index à deux chiffres dans la spec   | `SOC-1.03`                                     |
| Fichier de spec            | `docs/features/<feature>/[<portée>/]<ID>-<slug>.spec.md`    | `docs/features/socle/SOC-1-socle.spec.md`      |
| Fichier de ticket          | `…/issues/<ID>-<slug>.<NN>.issue.md`, un fichier par ticket | `issues/SOC-1-socle.03.issue.md`               |
| Carte d'un chantier        | `<ID>-<slug>.map.md`, même identifiant que la spec          |                                                |
| Branche d'un ticket        | `<type>/<id en minuscules, point en tiret>-<nom>`           | `feat/soc-1-03-couche-base`                    |
| Titre de PR                | se termine par l'identifiant                                | `feat(api): couche base (SOC-1.03)`            |
| `Status:`                  | vocabulaire fermé : `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `en cours — <branche>`, `Fait — PR #<n>` | |

Le trigramme vient du registre de `docs/methode/nomenclature.md` (`ARC-1`) ; une ADR se numérote de la même façon (`ARC-7`), par le même script. La portée est facultative : un projet qui sert une seule organisation n'en a pas.

## Étape 1 — poser (`poser`)

Dans un dépôt dont la racine est posée (`pnpm-workspace.yaml` présent) :

| Source                                    | Destination                                   |
| ----------------------------------------- | --------------------------------------------- |
| `references/scripts/docs/*`               | `scripts/docs/` (tests `*.test.mjs` compris)  |
| `references/scripts/verify/*`             | `scripts/verify/`                             |
| `references/agents/issue-tracker.md`      | `docs/agents/issue-tracker.md` (remplace celui de `setup-matt-pocock-skills`) |
| `references/agents/triage-labels.md`      | `docs/agents/triage-labels.md`                |
| `references/gabarits/*`                   | `docs/agents/gabarits/`                       |

Puis dans `package.json` racine, un script `check:tickets` : `node scripts/verify/tickets.mjs && node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs scripts/agent/*.test.mjs scripts/chaine/*.test.mjs` (les globs sans fichier sont ignorés par `node --test`), et une étape `check:tickets` dans `scripts/check.mjs`, après `lint`. La CI du socle de la chaîne la joue ; sans ce socle, l'ajouter au job de qualité.

`docs/methode/nomenclature.md` § exclusions : les fichiers `.spec.md`, `.issue.md` et `.map.md` suivent cette convention, pas la nomenclature générale (leur identifiant est celui de la spec).

Vérifier : `pnpm check:tickets` vert (le gate dit `tickets : OK — 0 tickets` sur un dépôt sans ticket). Ne pas commiter si un socle appelle ce skill : il écrit l'historique.

## Étape 2 — au quotidien

- **Numéroter** : `node scripts/docs/next-id.mjs SOC` (ou `ALL FOF`, `ARC`). Lit l'arbre et les branches distantes `sujet/*` et `docs/*` : `git fetch origin` d'abord si le dernier date.
- **Créer une spec ou un ticket** : copier le gabarit de `docs/agents/gabarits/`, nommer d'après la table, `Status: needs-triage` tant qu'il n'est pas prêt. Un ticket `ready-for-agent` porte `Modèle:`, `Fichiers chauds:` et les quatre sections `## Où`, `## Décisions`, `## Surfaces`, `## Vérification` : `docs/agents/chaine-de-production.md` § 3. Le gate le refuse sinon.
- **Avant de coder** : `node scripts/docs/ticket-libre.mjs SOC-1.03`. Sortie 0 libre, 1 pris, 3 libre côté git mais PR non vérifiées (session cloud : la recherche `search_pull_requests` que le script affiche, par l'outil GitHub MCP). Puis réserver : branche, `Status: en cours — <branche>`, PR brouillon. Procédure complète : `docs/agents/issue-tracker.md` § « Réserver un ticket ».
- **Vagues d'un chantier** : `node scripts/docs/vagues.mjs SOC-1 --max 6` propose les vagues (bloquants faits, fichiers chauds disjoints) ; l'architecte décide.
- **Avancement** : `node scripts/docs/avancement.mjs sujet/<nom>` ou `SOC-1`, `--json` pour une page. Sans `gh`, sortie 3 et la recherche MCP à faire.
- **Archiver** : `node scripts/docs/archiver-tickets.mjs` (dry-run), `--appliquer` : les tickets faits depuis plus de 180 jours passent dans `issues/archive/`. Une fois par mois, par le capitaine, jamais en CI.
- **Gate** : `pnpm check:tickets`. Une dette (tickets prêts d'avant le gate, cartes, identifiants en double) se gèle dans `scripts/verify/tickets-dette.json` et ne grandit jamais ; `--elaguer` retire les entrées éteintes.

## Étape 3 — migrer un dépôt (`migrer <feature> <TRI>`)

Pour un dépôt au format du socle (`docs/features/<feature>/<feature>.spec.md`, `issues/<N>-<slug>.issue.md`) :

1. Inscrire le trigramme de la feature au registre de `nomenclature.md` s'il n'y est pas.
2. `node scripts/docs/migrer-tickets.mjs <feature> <TRI>` : dry-run, relire. `--n <n>` pour forcer le numéro.
3. `--appliquer` : `git mv` de la spec et des tickets, liens relatifs et mentions `` `N-slug` `` réécrits dans tous les `docs/**/*.md`, lignes `Blocked by:` / `Bloqué par :` passées en `Blocked by: NN`. Puis `pnpm check:tickets` et `git diff` relu : les statuts hors vocabulaire (`done`, `À faire`) se corrigent à la main.
4. Une feature par passage ; un ticket au-delà de 99 refuse : découper la feature.

## Ce que ce skill ne fait pas

- **Aucun contenu de ticket.** Il pose la forme ; le découpage est l'affaire de l'architecte et du grilling.
- **Aucun appel GitHub en écriture.** Réserver une PR, poser un label : l'outil GitHub MCP ou `gh api`, décrits dans `issue-tracker.md`.
- **Aucune branche de sujet.** C'est le skill `sujet`.

## Anti-patterns

| Tentation                                                   | Pourquoi c'est faux                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| « Je numérote à la main, le prochain est évident »          | Une spec sur une branche de sujet non fusionnée porte peut-être déjà ce numéro. Le script lit les branches. |
| « `Status: done`, c'est pareil que `Fait` »                 | Les scripts lisent un vocabulaire fermé ; `done` est invisible pour `ticket-libre` et l'avancement.    |
| « Je commence, je réserverai après le premier commit »      | Trois sessions ont codé le même ticket. La réservation, c'est la branche poussée et la PR brouillon, avant la première ligne. |
| « Un seul fichier avec tous les tickets, c'est plus lisible » | Un ticket est un fichier : c'est ce qu'une session réserve, cite et livre.                            |
| « Je déclare les deux conventions dans un fichier de config » | Deux formats à parser et à tester dans chaque script, pour toujours. On migre.                         |
