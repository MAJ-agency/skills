---
name: revue-de-ticket
description: Revue d'une branche de ticket par trois sous-agents en contexte vierge, jouée par la session qui pense avoir fini, avant de sortir la PR du brouillon — axe Règles (la revue adversariale, diff seul contre les critères du projet), axe Ticket (surfaces prouvées, décisions tenues, règles citées avec leurs cas de bord, périmètre), axe Documentation (glossaire, registre, ADR, index générés, README, ticket) — puis une seule section de PR. À utiliser quand un ticket est « fini », quand on demande une « revue de ticket » ou « est-ce que ma branche est prête », et avant tout label à-fusionner. `poser` l'installe une fois dans le dépôt.
argument-hint: 'poser | <SPEC_ALL_SOC-1.03>'
---

# Revue de ticket

La session qui a codé un ticket est la plus mal placée pour dire qu'il est fini. Trois sous-agents vierges relisent sa branche, chacun contre une **liste fermée** et depuis un angle différent, et ne rendent que des écarts. La revue adversariale (règles du projet) en est un axe ; les deux autres répondent aux questions qu'elle s'interdit : **le code fait-il ce que le ticket demande, tout, et rien de plus ? et est-ce écrit là où le dépôt le range ?**

Le `code-review` de Matt Pocock relit « standards » et « spec » en deux sous-agents : même idée. Ici les listes sont fermées, le ticket a un format (`Où`, `Décisions`, `Surfaces`, `Vérification`), les règles ont un identifiant, et la sortie est la section de PR que le capitaine lit.

## Étape 0 — poser (une fois par dépôt, `poser`)

`scripts/contexte-ticket.mjs` et son test → `scripts/chaine/` (ils lisent `scripts/docs/identifiants.mjs`, posé par `tickets`). Le skill `revue-adversariale` est posé (`scripts/chaine/diff-revue.sh`, fichier de critères). Puis `docs/agents/issue-tracker.md` § Livrer et `docs/agents/chaine-de-production.md` § 5 nomment cette revue (les gabarits ≥ 3.2 la nomment déjà).

## Quand

- **Obligatoire** avant de sortir du brouillon une PR qui réalise un ticket et touche `apps/`, `packages/` ou `scripts/` ; refaite pour une PR renvoyée (`fusion-bloquée`) dont la correction touche du code.
- **Axe Règles seul** (`revue-adversariale`) pour une PR de code sans ticket (correctif isolé, outillage) : la section de PR le dit.
- **Non requise** pour une PR de documentation seule.

## Étape 1 — préparer

```bash
REVUE_DIR=<scratchpad>/revue bash scripts/chaine/diff-revue.sh [<base>]
node scripts/chaine/contexte-ticket.mjs <ID> > <scratchpad>/revue/contexte.md
```

Base `origin/develop`, ou `origin/sujet/<nom>` pour une sous-PR de sujet. L'identifiant est celui de la branche (`feat/spec-all-soc-1-03-…` → `SPEC_ALL_SOC-1.03`). Un ticket dont `## Surfaces` est vide ou dont une règle citée est « introuvable » dans le contexte : **s'arrêter**, c'est un défaut du ticket, à corriger dans le ticket avant de relire le code. Chemins sensibles : comme la revue adversariale (étape 2 de son SKILL).

## Étape 2 — trois sous-agents, en parallèle

Outil **Agent**, trois sous-agents neufs, lecture seule, lancés dans le même tour, sans l'historique de la session :

| Axe | Prompt | Reçoit |
| --- | --- | --- |
| Règles | `revue-adversariale/references/prompt.md` | les critères du projet (`criteresRevue` de `.claude/chaine.json`) + `diff.patch` — **ni ticket, ni intention** |
| Ticket | [`references/prompt-ticket.md`](references/prompt-ticket.md) | [`criteres-ticket.md`](references/criteres-ticket.md) + `contexte.md` + `diff.patch` |
| Documentation | [`references/prompt-documentation.md`](references/prompt-documentation.md) | [`criteres-documentation.md`](references/criteres-documentation.md) + `diff.patch` |

`{{PROJET}}` substitué ; les critères sont le bloc de code entier du fichier, jamais réduit. Un diff de plus de 2 000 lignes se découpe par zone, comme en revue adversariale, pour les trois axes.

## Étape 3 — trier

Chaque constat est relu dans le code, ligne ouverte. **Sans critère cité** : écarté. **Faux** : écarté, raison en une phrase dans la section de PR. **Juste** : gardé avec sa gravité. Un constat de l'axe Ticket qui révèle un trou du ticket (surface oubliée, règle non citée) se corrige **dans le ticket aussi** : la fille note la surface ou la règle, le chantier apprend.

## Étape 4 — corriger, répondre, relancer

1. Bloquants corrigés, chacun avec le test qui l'aurait attrapé ; à corriger : corrigés, ou laissés avec une raison écrite ; doutes : une ligne de réponse chacun.
2. Si une correction déborde des lignes signalées : nouveau tour, trois sous-agents neufs. **Deux tours au plus** ; au-delà, le dire à l'humain ou à l'architecte.
3. Un bloquant de l'axe Ticket ouvert après deux tours : la PR reste en brouillon, le ticket repasse `en cours`, l'architecte est prévenu.

## Étape 5 — la section de PR, puis le label

Une seule section, [`references/section-pr.md`](references/section-pr.md), titre `## Revue de ticket` hors bloc de code, ajoutée au corps de la PR sans effacer ce qui y est (lire, concaténer, réécrire : `pull_request_read` puis `update_pull_request`). Elle remplace `## Revue adversariale` : le capitaine accepte l'un ou l'autre titre, et renvoie une PR de code qui n'a ni l'un ni l'autre. Puis `Status: Fait — PR #<n>`, PR hors brouillon après le dernier push, label `à-fusionner` (`docs/agents/issue-tracker.md` § Livrer).

**Le relecteur humain** doit pouvoir expliquer le diff à partir de cette section et du ticket. S'il n'y arrive pas, il retire `à-fusionner` et pose sa question sur la PR.

**Coût** : trois sous-agents, parfois six ; dans la session, sur l'abonnement.

## Ne jamais

- Donner à l'axe Règles le ticket, l'intention ou la description de la PR.
- Réduire une liste de critères, ou ajouter « et toute autre remarque utile ».
- Corriger une « amélioration » hors critères, ou ajouter un test « pour être sûr » que ni le ticket ni une règle ne demandent.
- Poser `à-fusionner` avec un bloquant ouvert, ou sans section `## Revue de ticket` sur une PR qui réalise un ticket.
- Lancer la revue en CI ou par une Action GitHub.
