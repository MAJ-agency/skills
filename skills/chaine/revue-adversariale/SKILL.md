---
name: revue-adversariale
description: Revue adversariale d'une PR par un sous-agent en contexte vierge, qui ne voit que le diff et une liste fermée de critères (ceux du socle — dépendances hexagonales, contrats Zod, tenant, erreurs, migrations, typage, tests, injection, concurrence, configuration, langue, clients — plus ceux du projet) et ne rend que des écarts de correction ou d'exigence. À utiliser avant de poser le label à-fusionner sur une PR qui touche du code, et quand on demande une « revue adversariale » ou une « contre-revue » d'une branche. `poser` l'installe une fois dans le dépôt.
argument-hint: '[poser | <numéro de PR>]'
---

# Revue adversariale avant la file de fusion

La session qui a écrit le code est la plus mal placée pour le relire. Un **sous-agent en contexte vierge** reçoit le **diff** et une **liste fermée de critères**, et ne rend que des **écarts de correction ou d'exigence**, chacun rattaché à une règle écrite. Pourquoi une liste fermée, et ce que coûte la revue : l'ADR « chaîne de production » du dépôt (posée par `socle-chaine-de-production`).

## Étape 0 — poser (une fois par dépôt, `poser`)

| Source                                 | Destination                                                            |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `scripts/diff-revue.sh`                | `scripts/chaine/diff-revue.sh` (exécutable)                            |
| `scripts/chemins-sensibles.mjs`        | `scripts/chaine/chemins-sensibles.mjs` (lit le contrat de la base par `revue-exigee.mjs`, et le sujet de la branche par `identifiant.mjs` et `sujet.sh`, posés à côté par `fusionner` et `sujet`) |
| `scripts/*.test.mjs`                   | `scripts/chaine/` (`diff-revue.test.mjs` lit `depot-jouet.mjs`, posé par `sujet poser` ; `chemins-sensibles.test.mjs` lit le gate `scripts/verify/tickets-regles.mjs`, posé par `tickets poser`) |
| `references/criteres-socle.md`         | le fichier que `.claude/chaine.json` nomme (`criteresRevue`, défaut `docs/agents/criteres-revue.md`), **s'il n'existe pas** |

Puis relire la liste : retirer `S3` en mono-tenant, `S13` sans second client ; ajouter sous « Critères du projet » un critère par ADR qui pose une règle de code. Un projet qui a déjà sa liste la garde.

## Quand

- **Obligatoire**, avant `à-fusionner`, pour une PR qui touche du code ou ce que la chaîne exécute : `apps/`, `packages/`, `scripts/`, `e2e/`, un chemin dont un segment commence par un point (`.github/`, `.husky/`, `.claude/`, `.npmrc`), un fichier de la racine hors Markdown (`package.json`, `pnpm-lock.yaml`, `turbo.json`, les configurations d'outils), un `package.json` (ou `package.json5`, `package.yaml`, `package.yml`), un fichier exécutable ou un nom de configuration à toute profondeur (`*.mjs`, `*.sh`, `*.config.*`, `*rc`), un `CLAUDE.md` ou `CLAUDE.local.md`, `docs/agents/`, le fichier des critères, un chemin sensible du contrat de la base, quelle que soit la casse (`revue-exigee.mjs`, skill `fusionner`) ; refaite pour une PR renvoyée (`fusion-bloquée`) dont la correction touche du code hors index générés.
- **Avec `/security-review`** si le diff touche un chemin sensible (étape 2).
- **Non requise** pour une PR de documentation seule (`docs/` hors `docs/agents/` et hors fichier exécutable ou de configuration, `*.md` hors `CLAUDE.md`, `CLAUDE.local.md` et d'un dossier à point) : la section de PR le dit en une ligne.

Elle ne remplace ni `pnpm check` ni les gates : ceux-ci attrapent ce qui se voit à la syntaxe ; la revue vise ce qu'ils ne voient pas, un périmètre filtré par le mauvais paramètre, un `select` qui ramène une colonne d'un autre tenant, un port appelé hors transaction.

## Étape 1 — Préparer le diff

```bash
REVUE_DIR=<scratchpad>/revue bash scripts/chaine/diff-revue.sh [<base>] [<zone>…]
```

Base par défaut `origin/develop` ; `origin/sujet/<nom>` pour une sous-PR de sujet. Le script écrit `diff.patch` et `stat.txt`, sans lockfile, index générés ni snapshots ; migrations, seeds et specs restent. Fini quand `diff.patch` existe, non vide, et que le sommet relu est connu (le script l'affiche). Sortie 1 (base non rapatriée, ou diff vide) : le lire, ne lancer aucun sous-agent ; un lot de zone vide n'a pas de sous-agent.

**Diff de plus de 2 000 lignes :** un lot par zone (`apps/api`, `apps/web`, `apps/mobile`, `packages` + `scripts`), passée en `<zone>` avec un `REVUE_DIR` par lot. Un sous-agent par lot, lancés en parallèle, mêmes critères.

## Étape 2 — Chemins sensibles

```bash
set -o pipefail; git -c core.quotepath=false diff --name-only --no-renames <base>...HEAD | node scripts/chaine/chemins-sensibles.mjs <base>
```

Les chemins sont ceux de `.claude/chaine.json` (`cheminsSensibles`) : authentification, droits, chiffrement, paiement, export. Les motifs se lisent comme le gate `tickets` (`**` tout, `*` un segment, `/` final un dossier) ; un chemin que git cite entre guillemets est décité, en NFC, et la casse ne compte pas. Les motifs du contrat de `<base>` (et, pour un sujet, d'`origin/develop`) (la même qu'à l'étape 1) s'ajoutent à ceux de la branche : une branche qui retire son chemin de `chaine.json` reste sensible. Sans `<base>`, le script prend le sujet du ticket de la branche s'il en déclare un, sinon `origin/develop`. Une base qui ne se lit pas rend chaque chemin sensible (`(base illisible : …)`) : lancer `/security-review`, et corriger la base. Sortie non nulle (contrat illisible, entrée vide, `git` en échec dans le tube) : la revue s'arrête et le dit ; le contrat ou la base se corrige. Script absent (projet posé avant cette version) : la revue s'arrête et le pose d'abord (étape 0), sans revenir à l'ancienne commande. Une ligne au moins : lancer **en plus** la skill `/security-review` sur la branche. Ses constats suivent la même suite (étape 5).

## Étape 3 — Lancer le sous-agent

Outil **Agent**, un sous-agent neuf, en lecture seule : il peut lire le dépôt pour vérifier un constat, il ne modifie rien, il ne lance ni commit ni commande d'écriture. Ne lui transmettre **ni** l'historique de la session, **ni** l'intention de la PR, **ni** sa description : il juge le code, pas l'explication.

**Prompt exact** : [`references/prompt.md`](references/prompt.md). Remplacer `{{PROJET}}` par le nom du projet, `<critères>` par le bloc de code du fichier de critères du projet (socle **et** projet, sans le réduire) et `<diff>` par le contenu de `diff.patch` (ou du lot).

## Étape 4 — Trier les constats

La session relit chaque constat dans le code, ligne citée ouverte. **Sans règle citée** : écarté, sans discussion. **Faux** (la règle ne s'applique pas, ou le code la respecte déjà) : écarté, avec la raison en une phrase dans la section de PR. **Juste** : gardé avec sa gravité. Un constat juste ne se conteste pas parce qu'il est gênant. Un constat faux ne se corrige pas pour faire plaisir au relecteur.

## Étape 5 — Corriger, répondre, étiqueter

1. **Bloquants** : corrigés, chacun avec le test qui l'aurait attrapé quand c'est possible. **À corriger** : corrigés, ou laissés avec une raison écrite. **Doutes** : une ligne de réponse chacun dans la section de PR.
2. Si les corrections débordent des lignes signalées, **relancer une revue** sur le nouveau diff, avec un sous-agent neuf. Deux tours au plus : au-delà, le dire à l'humain plutôt que boucler.
3. **Ajouter** la section de [`references/section-pr.md`](references/section-pr.md) au corps de la PR, sans effacer ce qui y est. Un titre `## Revue adversariale` hors bloc de code : sans lui, le capitaine renvoie toute PR qui touche du code. Lire le corps, concaténer, réécrire le tout : par l'outil GitHub MCP, `pull_request_read` puis `update_pull_request` avec le corps complet ; avec `gh`, en REST (`gh api 'repos/{owner}/{repo}/pulls/<n>' --jq .body`, puis `gh api -X PATCH … -F 'body=@body.md'`) : `gh pr edit` passe par GraphQL, refusé depuis les sessions cloud.
4. Poser `à-fusionner` (`CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine »).

**Le relecteur humain** relit cette section avant que la PR ne passe. Il doit pouvoir **expliquer le diff** à partir d'elle et du code. S'il n'y arrive pas, il retire `à-fusionner` et pose sa question sur la PR. Un code que personne dans l'équipe ne sait expliquer est une dette, même vert en CI.

**Coût** : dans la session, sur l'abonnement, un sous-agent, parfois quatre.

## Ne jamais

- Donner au sous-agent l'historique de la session, l'intention de la PR ou sa description.
- Ajouter au prompt « et toute autre remarque utile » : la liste est fermée.
- Corriger une « amélioration » proposée hors critères.
- Poser `à-fusionner` avec un bloquant ouvert.
- Lancer la revue en CI ou par une Action GitHub.
