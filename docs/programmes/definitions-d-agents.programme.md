# Définitions d'agents — carte du programme

Les sous-agents de revue de la chaîne deviennent des sous-agents définis, livrés par le plugin `maj-skills`, qui fixent leur rôle, leurs outils et leur modèle ; les skills les lancent par leur nom et fabriquent toujours le message de la tâche par leurs scripts. Cette carte est la mémoire durable de l'architecte : une session cloud repart d'un conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la source, et reprend à la phase écrite sans reposer une question tranchée.

## Fiche

Phase: spec — spec et deux tickets relus par un agent neuf (PR brouillon #163), en attente de `P-1`
Responsable: Guillaume Jauffret
Architecte: session_01BxuG2z7ypDYopx6aF3M1sd (lancée le 2026-11-25 par la session mère session_01BxuG32BaRcgwrMvCr1hiet, l'architecte du programme Atalian, mode « Auto », dépôt `skills`)
Objectif: les sous-agents de relecture et de criticité lancés par leur nom, sur des définitions du plugin qui fixent outils (lecture seule, ou aucun), modèle et contexte ; un repli pour une session dont l'instantané ne les a pas ; une version du plugin et sa note.
Dépôts: `MAJ-agency/skills` (dossier `agents/`, `.claude-plugin/plugin.json`, skills `relecture`, `criticite`, `revue-de-ticket`, `revue-adversariale`, `architecte`, `chantier`) ; les projets le reçoivent par la mise à jour du plugin, sans rien reposer.
Source: le prompt de lancement de cette session (2026-11-25), recopié dans `## Source` ci-dessous — entrée brute, ni spec ni décision.
Capitaines: `skills` : session_01BxuG2zzeL4A2u7UmWKeD2S (lancé le 2026-11-25 à 15 h 32 UTC par l'architecte, procédure d'un dépôt sans la chaîne, file au label, Sonnet)
Relecteurs: `skills` : absent (dépôt sans la chaîne)

## Chantiers

| n°  | Chantier | Dépôt | Spec | Carte | Conducteur | État |
| --- | -------- | ----- | ---- | ----- | ---------- | ---- |
| 1   | Définitions d'agents | `skills` | [`definitions-d-agents.spec.md`](../issues/definitions-d-agents/definitions-d-agents.spec.md) | sans carte de chantier (A-10) | l'architecte (A-10) | tickets 1 et 2 `needs-info`, en attente de `P-1` |

## Decisions-so-far

Décisions du produit :

- P-1 — _(question posée le 2026-11-25, en attente)_ Les agents de relecture et le classeur de criticité partent-ils sans le `CLAUDE.md` ni les fiches `.claude/rules/` du projet dans leur contexte (`omitClaudeMd: true`) ? Recommandé : oui.

Décisions de l'architecte : A-1 à A-10, écrites avec leur raison dans la spec (`## Décisions de conception`) — deux définitions (`maj-skills:axe-de-relecture`, Read/Grep/Glob ; `maj-skills:classeur-de-criticite`, aucun outil), listées dans `plugin.json` ; lecture seule sans Bash ; Opus, effort non fixé ; corps court, description qui interdit la délégation spontanée ; aucun skill préchargé ; repli sur l'agent générique, dit dans la sortie ; garde des consignes de `relecture` gardée ; skills de rôle inchangés hors deux points ; un banc ; deux tickets en série (8.4.0, 8.5.0), sessions hors chantier.

## Fog

- _(tranché, journal du 2026-11-25)_ Le capitaine de `skills` : aucun en vie (relevé par la session mère) ; lancé par l'architecte.

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |

## Passation

—

## Journal

- 2026-11-25 — Architecte lancé par la session mère. Plugin chargé 8.3.3, marketplace 8.3.3 (le prompt nommait 8.3.0 ; aucun écart avec le marketplace). Faits établis par la documentation et six essais réels (`claude -p --plugin-dir`, transcripts lus) : spec, « Faits établis ». Question `P-1` posée au produit par la session mère. Alerte d'usage : le compte approche de sa limite hebdomadaire, levée le 2026-11-29 à 19 h UTC.

- 2026-11-25 — Tickets 1 et 2 écrits par un sous-agent, relus par un agent neuf (« pas prêt » : P-1 non tranchée, et des écarts), corrigés ; spec amendée (A-8 étendue à `lancement.md`, A-11, A-12). PR brouillon #163. Découpage envoyé à la session mère.
- 2026-11-25 — Capitaine de `skills` lancé (session_01BxuG2zzeL4A2u7UmWKeD2S) : la session mère n'en voyait aucun en vie. La session mère n'objecte pas à Opus (A-3).

## Source

Prompt de lancement du 2026-11-25 (extrait) : « Aujourd'hui, nos skills lancent leurs sous-agents de revue par l'outil Agent avec un agent générique et un prompt construit à la volée : la lecture seule et le contexte vierge ne tiennent que par le texte du prompt, et le modèle dépend de la session qui lance. Le produit veut que ces sous-agents soient des sous-agents **définis** (fichiers de définition d'agents livrés par le plugin maj-skills, dossier agents/ d'un plugin Claude Code), qui fixent leur rôle, leurs outils et leur modèle, et que les skills les lancent par leur nom en continuant à fabriquer le message de la tâche par leurs scripts. » Relevé fourni : `relecture` (le plus important), `revue-de-ticket`, `revue-adversariale`, `criticite`, `architecte` (relecture d'un ticket hors chantier), `chantier/references/regime-7.md` (contre-revue) ; les sous-agents de relevé ou de rédaction hors périmètre. À établir d'abord : ce qu'un sous-agent défini reçoit d'office, la restriction des outils, le champ modèle, le nom d'un agent de plugin, le préchargement d'un skill, le cas d'un instantané plus ancien ; si le `CLAUDE.md` arrive, poser la question au produit avant de coder.
