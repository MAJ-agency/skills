---
name: tickets
description: Convention et outillage des specs, tickets, règles et demandes d'un dépôt — identifiants `<TYPE>_<CTX>_<TRI>-<n>` (`SPEC_ALL_SOC-1`, `RULE_FNSMR_LIC-05`) et tickets `.<NN>`, fichiers sous docs/features/<feature>/<ctx>/, docs/metier/regles/<ctx>/ et docs/demandes/<ctx>/, en-têtes `Status:`, `Type:` et `Règles:` à vocabulaire fermé et vérifiés, ticket « prêt pour agent », réservation d'un ticket entre sessions parallèles, vagues et avancement d'un chantier, archivage. Pose les scripts et les gabarits dans le projet, et migre des tickets existants. Use when creating a spec, a ticket, a rule or a request, numbering a document, checking whether a ticket is free before coding, computing waves or progress of a project, or migrating a repo's tickets to this convention.
argument-hint: '[poser | migrer <feature> <CTX> <TRI> | libre <id> | prochain <TYPE> <CTX> <TRI> | vagues <SPEC> | avancement <sujet/x|SPEC>]'
---

# Tickets

Une seule convention pour les specs et les tickets, et les scripts qui la lisent. Les skills `chantier`, `sujet` et `fusionner` ne connaissent le format d'un ticket que par ces scripts.

**Ce skill décide la convention, il ne la discute pas** : un dépôt qui en a une autre migre (étape 3). Tous les gabarits et scripts vivent dans [`references/`](references/) ; les scripts sont **copiés dans le projet**, pas appelés depuis le plugin : la CI et les hooks git doivent les trouver sans plugin installé.

## La convention

La grammaire des identifiants est celle du socle, `docs/methode/nomenclature.md` (`ADR_ALL_ARC-1`) : `<TYPE>_<CTX>_<TRI>-<n>`, le type, le contexte (`ALL` toujours écrit), le trigramme du sujet, le numéro. Le code de cette grammaire (`scripts/docs/identifiants.mjs`) et la numérotation (`next-id.mjs`, aussi celle des tickets) sont posés par `socle-monorepo` ; ce skill pose les scripts et les gabarits de quatre types qui s'en servent : `SPEC` et ses tickets, `RULE`, `REQ`.

| Quoi                        | Forme                                                                     | Exemple                                                  |
| --------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| Identifiant d'une spec      | `SPEC_<CTX>_<TRI>-<n>` ; `n` unique par contexte et trigramme dans tout `docs/` | `SPEC_ALL_SOC-1`, `SPEC_FNSMR_LIC-3`               |
| Identifiant d'un ticket     | `<spec>.<NN>`, index à deux chiffres dans la spec                         | `SPEC_ALL_SOC-1.03`                                      |
| Identifiant d'une règle     | `RULE_<CTX>_<TRI>-<n>` ; un identifiant existant ne se renomme pas, sauf pour résoudre une collision de sigles avant la première lecture par Anchorpost     | `RULE_ALL_LIC-3`, `RULE_FNSMR_LIC-05`                    |
| Identifiant d'une demande   | `REQ_<CTX>_<TRI>-<n>`                                                     | `REQ_ALL_LIC-7`                                          |
| Fichier de spec             | `docs/features/<feature>/<ctx>/<ID>-<slug>.spec.md`                       | `docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md`   |
| Fichier de ticket           | `…/<ctx>/issues/<ID>-<slug>.<NN>.issue.md`, un fichier par ticket         | `issues/SPEC_ALL_SOC-1-socle.03.issue.md`                |
| Carte d'un chantier         | `<ID>-<slug>.map.md`, même identifiant que la spec                        |                                                          |
| Carte d'un programme        | `docs/programmes/<nom-en-kebab>.programme.md`, sans identifiant ; gabarit `programme.md`, hors du gate des cartes de chantier | `docs/programmes/gouverner-nos-boucles.programme.md` |
| Fichier de règle            | `docs/metier/regles/<ctx>/<ID>.md`, sans slug : le titre est dans l'en-tête | `docs/metier/regles/all/RULE_ALL_LIC-3.md`             |
| Fichier de demande          | `docs/demandes/<ctx>/<ID>-<slug>.md`                                      | `docs/demandes/all/REQ_ALL_LIC-7-licence-famille.md`     |
| Branche d'un ticket         | `<type>/<id en minuscules, tirets bas et point en tirets>-<nom>`          | `feat/spec-all-soc-1-03-couche-base`                     |
| Titre de PR                 | se termine par l'identifiant                                              | `feat(api): couche base (SPEC_ALL_SOC-1.03)`             |
| `Status:` (ticket, demande) | vocabulaire fermé : `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, `en cours — <branche>`, `Fait — PR #<n>` ; pour une demande, `Fait — <spec>` | |
| `Type:` (ticket)            | obligatoire, vocabulaire fermé : `task`, `défaut`, `grilling`, `research` | `Type: défaut`                                           |
| `Règles:` (ticket, demande) | facultative ; les règles que le travail réalise ou corrige, par leur identifiant complet, chacune existant dans le registre de son contexte | `Règles: RULE_ALL_LIC-3, RULE_FNSMR_LIC-05` |
| `Prouve:` (ticket)          | facultative ; les règles que le ticket prouve sans les réaliser (il écrit leurs tests, pas leur code), jamais une règle de `Règles:` ; la criticité d'une feature ne descend que par `Règles:` | `Prouve: RULE_ALL_LIC-4` |

Le dossier de contexte s'écrit en minuscules (`all/`, `fnsmr/`) et **existe toujours**, même dans un projet à un seul contexte. Le contexte d'une spec, d'un ticket, d'une règle ou d'une demande est celui de son identifiant ; un ticket ne cite que des règles de son contexte ou du contexte `ALL`.

**Un ticket `Type: défaut`** nomme dans la colonne « Preuve » de `## Surfaces` les tests qui prouvent la correction : le fichier de test entre accents graves, puis le titre exact de chaque test entre guillemets (`` `apps/api/src/licence.spec.ts` « [RULE_ALL_LIC-3] refuse une licence expirée » ``) ; le gate refuse un défaut `Fait` qui n'en nomme aucun, ou dont un test nommé n'existe pas ou est désactivé (`it.skip`, `test.skip`, `xit`, `describe.skip`, `it.todo`, sur le test ou un bloc qui l'englobe). Le skill `recette-humaine` produit ses tickets de défaut ainsi : `Type: défaut`, `Règles:` reprises de l'inventaire, la ligne `D-n` de l'inventaire et le test rouge cités dans le corps.

## Étape 1 — poser (`poser`)

Dans un dépôt dont la racine est posée (`pnpm-workspace.yaml` présent) et qui porte la grammaire du socle (`scripts/docs/identifiants.mjs`, `next-id.mjs`, `next-id-branches.mjs`, `pr-ouvertes.mjs` et `environnement-de-banc.mjs`). L'un des cinq manque : s'arrêter, et poser `/maj-skills:socle-monorepo` d'abord. Ce skill ne pose pas ces cinq fichiers, et ne les remplace pas.

| Source                                    | Destination                                   |
| ----------------------------------------- | --------------------------------------------- |
| `references/scripts/docs/*`               | `scripts/docs/` (tests `*.test.mjs` compris), à côté de la grammaire du socle |
| `references/scripts/verify/*`             | `scripts/verify/`                             |
| `references/agents/issue-tracker.md`      | `docs/agents/issue-tracker.md` (remplace celui de `setup-matt-pocock-skills`) |
| `references/agents/triage-labels.md`      | `docs/agents/triage-labels.md`                |
| `references/gabarits/*`                   | `docs/agents/gabarits/`                       |

Puis dans `package.json` racine, un script `check:tickets` : `node scripts/verify/tickets.mjs && node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs scripts/agent/*.test.mjs scripts/chaine/*.test.mjs` (les globs sans fichier sont ignorés par `node --test`), et une étape `check:tickets` dans `scripts/check.mjs`, après `lint`. La CI du socle de la chaîne la joue ; sans ce socle, l'ajouter au job de qualité.

`docs/methode/nomenclature.md` § exclusions : les fichiers `.spec.md`, `.issue.md` et `.map.md` suivent cette convention, pas la nomenclature générale (leur identifiant est celui de la spec).

Si le projet a déjà un `scripts/verify/tickets-dette.json`, le garder : la dette d'un projet ne se remplace pas par celle du skill. Puis `node scripts/verify/tickets.mjs --geler-types` : à l'arrivée du gate de `Type:`, il gèle sous la clé `types` les tickets qui n'en ont pas encore ; une fois la clé écrite, il refuse de la rejouer. De même, `node scripts/verify/tickets.mjs --geler-fiches` gèle sous la clé `fiches` les cartes de chantier dont la fiche ne nomme pas encore `Responsable:` et `Conducteur:` : pour elles seule l'ancienne règle vaut (`Architecte:` non vide), et `--elaguer` en retire une carte dès qu'elle porte les deux lignes. Aucune carte n'est à réécrire.

Vérifier : `pnpm check:tickets` vert (le gate dit `tickets : OK — 0 tickets` sur un dépôt sans ticket). Ne pas commiter si un socle appelle ce skill : il écrit l'historique.

## Étape 2 — au quotidien

- **Numéroter** : `node scripts/docs/next-id.mjs SPEC ALL SOC` (ou `RULE ALL LIC`, `ADR ALL ARC`, `REQ FNSMR PAY`). Pour un ticket : `node scripts/docs/next-id.mjs SPEC_ALL_SOC-4` → `79` (deux chiffres). Fait lui-même un fetch, puis lit l'arbre, `origin/develop`, les branches `sujet/*` et `docs/*` et les fichiers des PR ouvertes ; sans `gh`, le numéro sort et la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP. **Réserver aussitôt** (branche et PR brouillon) : deux sessions qui numérotent dans la même minute prennent encore le même numéro.
- **Créer une spec, un ticket, une règle ou une demande** : copier le gabarit de `docs/agents/gabarits/` (`spec.spec.md`, `ticket.issue.md`, `regle.md`, `demande.md`), nommer d'après la table, `Status: needs-triage` tant qu'il n'est pas prêt, `Type:` dès la création ; une règle naît `candidate`, écrite par la session qui écrit la spec qui la porte, à l'étape de la spec ; toute session qui crée un fichier de règle ou change son énoncé lance sur elle le skill `criticite` avant tout code ; si l'index du projet est au pivot 3, elle la classe et porte la commande jouée et chaque sortie brute dans la section `## Criticité` de sa PR, sinon le skill s'arrête ; seul un humain écrit `validated`. Un ticket `ready-for-agent` porte `Modèle:`, `Fichiers chauds:`, `Dépendances:` s'il ajoute un paquet, les quatre sections `## Où`, `## Décisions`, `## Surfaces`, `## Vérification`, et `Label: contre-revue` dès que `Fichiers chauds:` touche un motif de `cheminsSensibles` (`.claude/chaine.json`) : `docs/agents/chaine-de-production.md` § 3. Le gate le refuse sinon.
- **Avant de coder** : `node scripts/docs/ticket-libre.mjs SPEC_ALL_SOC-1.03`. Sortie 0 libre, 1 pris (ligne `Status:`, branche distante sauf celle d'une PR fermée, PR ouverte par son titre, sa branche ou ses fichiers), 3 libre côté git mais PR non vérifiées (session cloud : les recherches que le script affiche, par l'outil GitHub MCP, dont la lecture des fichiers des PR ouvertes). Puis réserver : branche, `Status: en cours — <branche>`, PR brouillon. Procédure complète : `docs/agents/issue-tracker.md` § « Réserver un ticket ».
- **Vagues d'un chantier** : `node scripts/docs/vagues.mjs SPEC_ALL_SOC-1 --max 6` propose les vagues (bloquants faits, fichiers chauds disjoints) ; le conducteur décide.
- **Avancement** : `node scripts/docs/avancement.mjs sujet/<nom>` ou `SPEC_ALL_SOC-1`, `--json` pour une page. Sans `gh`, sortie 3 et la recherche MCP à faire.
- **Coûts de production** : `node scripts/docs/couts.mjs` régénère `docs/agents/couts.md` depuis la section `## Coût` des cartes (index généré, `--verify` pour vérifier) ; on corrige la carte, jamais le registre.
- **Archiver** : `node scripts/docs/archiver-tickets.mjs` (dry-run), `--appliquer` : les tickets faits depuis plus de 180 jours passent dans `issues/archive/`. Une fois par mois, par le capitaine, jamais en CI.
- **Gate** : `pnpm check:tickets`. Il vérifie `Status:`, `Type:`, `Règles:` et `Prouve:` (chaque règle citée existe dans le registre de son contexte ou de `ALL` ; une règle n'est jamais sur les deux lignes), `Blocked by:`, `Sujet:`, le format prêt pour agent, et les tests nommés par un défaut `Fait`. **La preuve suffisante** (projet suivi par Anchorpost, index commis au pivot 3) : un ticket prêt dont `Règles:` ou `Prouve:` cite une règle sans criticité ou sans cas attendu dans l'index, ou dont `## Surfaces` ne nomme pas chaque cas attendu de ces règles (`RULE_ALL_LIC-3#lien-expire`, avec la preuve qui le portera), est refusé si l'index dit `enforce`, signalé en `observe` ; sans index au pivot 3, rien n'est jugé. Une dette (tickets prêts d'avant le gate, tickets sans `Type:` d'avant son gate, cartes, identifiants en double) se gèle dans `scripts/verify/tickets-dette.json` et ne grandit jamais ; `--elaguer` retire les entrées éteintes.

## Étape 3 — migrer un dépôt (`migrer <feature> <CTX> <TRI>`)

Pour un dépôt au format du socle d'avant le standard (`docs/features/<feature>/<feature>.spec.md` et `issues/<N>-<slug>.issue.md`, ou `<TRI>-<n>-<slug>.spec.md` sans type ni contexte) :

1. Inscrire le trigramme de la feature au registre de `nomenclature.md` s'il n'y est pas.
2. `node scripts/docs/migrer-tickets.mjs <feature> <CTX> <TRI>` : dry-run, relire. `--n <n>` pour forcer le numéro.
3. `--appliquer` : `git mv` de la spec et des tickets dans `<feature>/<ctx>/`, liens relatifs et mentions réécrits dans tous les `docs/**/*.md`, lignes `Blocked by:` / `Bloqué par :` passées en `Blocked by: NN`, `Type: task` posé sur les tickets qui n'en ont pas. Puis `pnpm check:tickets` et `git diff` relu : les statuts hors vocabulaire (`done`, `À faire`) se corrigent à la main.
4. Une feature par passage ; un ticket au-delà de 99 refuse : découper la feature.

Un registre de règles en tableau markdown et les ADR, design et guides sans type se migrent par `anchorpost migrate` (skill `anchorpost`), qui réécrit les identifiants dans tout le dépôt.

## Ce que ce skill ne fait pas

- **Aucun contenu de ticket.** Il pose la forme ; le découpage est l'affaire du conducteur de chantier, sur la spec que le grilling a validée.
- **Aucun appel GitHub en écriture.** Réserver une PR, poser un label : l'outil GitHub MCP ou `gh api`, décrits dans `issue-tracker.md`.
- **Aucune branche de sujet.** C'est le skill `sujet`.

## Anti-patterns

| Tentation                                                   | Pourquoi c'est faux                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| « Je numérote à la main, le prochain est évident »          | Une spec sur une branche de sujet non fusionnée porte peut-être déjà ce numéro. Le script lit les branches. |
| « `Status: done`, c'est pareil que `Fait` »                 | Les scripts lisent un vocabulaire fermé ; `done` est invisible pour `ticket-libre` et l'avancement.    |
| « `Règles : LIC-05, voir aussi la section 3 de l'ADR » »     | Une ligne libre n'est lue par personne. `Règles:` ne porte que des identifiants complets, et le gate vérifie que chacun existe. |
| « Le projet n'a qu'un contexte, j'omets `ALL` »             | Le jour où un second contexte arrive, tout se renomme. `ALL` s'écrit toujours, et `all/` existe toujours. |
| « Je commence, je réserverai après le premier commit »      | Trois sessions ont codé le même ticket. La réservation, c'est la branche poussée et la PR brouillon, avant la première ligne. |
| « Un seul fichier avec tous les tickets, c'est plus lisible » | Un ticket est un fichier : c'est ce qu'une session réserve, cite et livre.                            |
| « Je déclare les deux conventions dans un fichier de config » | Deux formats à parser et à tester dans chaque script, pour toujours. On migre.                         |
