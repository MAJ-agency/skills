# Définitions d'agents — carte du programme

Les sous-agents de revue de la chaîne deviennent des sous-agents définis, livrés par le plugin `maj-skills`, qui fixent leur rôle, leurs outils et leur modèle ; les skills les lancent par leur nom et fabriquent toujours le message de la tâche par leurs scripts. Cette carte est la mémoire durable de l'architecte : une session cloud repart d'un conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la source, et reprend à la phase écrite sans reposer une question tranchée.

## Fiche

Phase: fini — ticket 1 fusionné (PR #164, 8.4.0), ticket 2 fusionné (PR #166, `b57eae7`, 8.5.0) ; reste la fusion de cette carte (PR #167) par le capitaine
Responsable: le produit (aucun nom de personne dans ce dépôt public)
Architecte: session_012xRpgXxfn5diB9dcvjpSes (architecte de suite, ouverte le 2026-11-27 à 21 h 06 UTC par le produit sur un autre compte, mode « Auto », dépôts `skills`, `anchorpost`, `fedora`) ; avant elle session_01BxuG2z7ypDYopx6aF3M1sd (lancée le 2026-11-25 par la session mère session_01BxuG32BaRcgwrMvCr1hiet, architecte d'un autre programme)
Objectif: les sous-agents de relecture et de criticité lancés par leur nom, sur des définitions du plugin qui fixent outils (lecture seule, ou aucun), modèle et contexte ; un repli pour une session dont l'instantané ne les a pas ; une version du plugin et sa note.
Dépôts: `MAJ-agency/skills` (dossier `agents/`, `.claude-plugin/plugin.json`, skills `relecture`, `criticite`, `revue-de-ticket`, `revue-adversariale`, `architecte`, `chantier`) ; les projets le reçoivent par la mise à jour du plugin, sans rien reposer.
Source: le prompt de lancement de cette session (2026-11-25), recopié dans `## Source` ci-dessous — entrée brute, ni spec ni décision.
Capitaines: `skills` : session_012xRpgZn85fsbtT8FpRj93L (lancé le 2026-11-27 à 21 h 10 UTC sur le compte de l'architecte de suite, procédure d'un dépôt sans la chaîne, file au label, Sonnet ; il sert aussi « gouverner nos boucles ») ; sur le compte sortant, session_01BxuG2zbkutBrxsG2irw7br (lancé le 2026-11-27 à 18 h 53 UTC sur le compte de l'architecte sortant, procédure d'un dépôt sans la chaîne, file au label, Sonnet) ; avant lui session_01BxuG2zzeL4A2u7UmWKeD2S (archivé le 2026-11-25)
Relecteurs: `skills` : absent (dépôt sans la chaîne)

## Chantiers

| n°  | Chantier | Dépôt | Spec | Carte | Conducteur | État |
| --- | -------- | ----- | ---- | ----- | ---------- | ---- |
| 1   | Définitions d'agents | `skills` | [`definitions-d-agents.spec.md`](../issues/definitions-d-agents/definitions-d-agents.spec.md) | sans carte de chantier (A-10) | l'architecte (A-10) | tickets 1 et 2 faits (PR #164, `4dba1de`, 8.4.0 ; PR #166, `b57eae7`, 8.5.0) ; chantier livré |

## Decisions-so-far

Décisions du produit :

- P-1 — (2026-11-27, relayée par la session mère, architecte d'un autre programme) Les agents de relecture et le classeur de criticité partent sans le `CLAUDE.md` ni les fiches `.claude/rules/` du projet (`omitClaudeMd: true`) : **oui**. Ses mots : « avoir un contexte vierge et ne pas aller voir tout le projet ».

Décisions de l'architecte : A-1 à A-10, écrites avec leur raison dans la spec (`## Décisions de conception`) — deux définitions (`maj-skills:axe-de-relecture`, Read/Grep/Glob ; `maj-skills:classeur-de-criticite`, aucun outil), listées dans `plugin.json` ; lecture seule sans Bash ; Opus, effort non fixé ; corps court, description qui interdit la délégation spontanée ; aucun skill préchargé ; repli sur l'agent générique, dit dans la sortie ; garde des consignes de `relecture` gardée ; skills de rôle inchangés hors deux points ; un banc ; deux tickets en série (8.4.0, 8.5.0), sessions hors chantier.

## Fog

- _(tranché, journal du 2026-11-25)_ Le capitaine de `skills` : aucun en vie (relevé par la session mère) ; lancé par l'architecte.

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |
| architecte | — | session_01BxuG2z7ypDYopx6aF3M1sd | opus | 764 k | 68,32 (au 2026-11-27, 21 h 05 UTC) |
| ticket | 1 | session_01BxuG2yyaJXUKmMh7bRUzzt (archivée) | opus | 269 k | 7,33 |
| ticket | 2 | session_01BxuG32TNSuYP6pzFEkLeWS | sonnet | 190 k | 2,80 (dernier relevé de l'architecte sortant ; session du compte sortant, à archiver par lui ou par le produit) |
| architecte | — | session_012xRpgXxfn5diB9dcvjpSes | opus | 213 k | 2,52 (au 2026-11-27, 21 h 12 UTC) |
| capitaine | — | session_012xRpgZn85fsbtT8FpRj93L | sonnet | 111 k | 0,27 (en vie, au 2026-11-27, 21 h 12 UTC) |
| capitaine | — | session_01BxuG2zbkutBrxsG2irw7br | sonnet | 406 k | 8,12 (au 2026-11-27, 20 h 48 UTC, dernier relevé ; compte sortant, à archiver par lui ou par le produit) |
| capitaine | — | session_01BxuG2zzeL4A2u7UmWKeD2S | sonnet | 236 k | 2,68 |

## Passation

Écrite le 2026-11-27 vers 21 h 05 UTC, sur décision du produit : le programme est repris par un architecte ouvert sur un autre compte, qui se coordonne avec l'architecte A du programme « gouverner nos boucles » (même compte que lui). La session sortante ne peut écrire à aucune session du nouveau compte, ni l'inverse.

- **Où en est le chantier.** Ticket 1 fait : PR #164 fusionnée (`4dba1de`, plugin 8.4.0), arbre fusionné identique au sommet relu. Ticket 2 livré : PR #166 (`feat/agents-revues-de-ticket-et-roles`, sommet `452a29c`, plugin 8.5.0), ordre `à-fusionner au sommet 452a29c…` et label posés par la session du ticket, CI verte sur ce sommet, `mergeable_state` `clean`, aucun verdict ; lue à la source par l'architecte sortant (17 fichiers, tous dans le périmètre du ticket). Elle attend le capitaine du compte sortant, qui passe toutes les 20 minutes.
- **Ce qui reste au programme**, une fois la #166 fusionnée : vérifier à la source l'arbre fusionné contre `452a29c` ; passer le ticket 2 à `Status: Fait — PR #166` sur `main` s'il ne l'est pas ; noter le coût final du ticket 2 et du capitaine ici ; `Phase: fini`. Le ticket 2 porte encore, ligne 66, le nom d'un programme client (la session mère, dans la décision `P-1`) : à remplacer par « la session mère, architecte d'un autre programme » dans la même PR de documentation que la fin du programme (nom d'un projet client dans un dépôt public ; la #166 touche ce fichier, d'où le report).
- **Sessions en vie sur le compte sortant** : la session du ticket 2 (session_01BxuG32TNSuYP6pzFEkLeWS, elle corrige si le capitaine renvoie la #166) et le capitaine (session_01BxuG2zbkutBrxsG2irw7br). Le nouvel architecte ne peut pas les joindre : si la #166 est renvoyée (commentaire `à-fusionner retiré par le capitaine : …`), il relance une session de ticket sur son compte (`architecte/references/lancement.md`, « La session d'un ticket hors chantier », ticket 2 sur `main`, branche `feat/agents-revues-de-ticket-et-roles`), et un capitaine si besoin (même fichier, procédure d'un dépôt sans la chaîne). L'architecte sortant archive ses sessions dès la fusion de la #166 s'il est encore là ; sinon le produit les archive depuis l'application.
- **Coordination.** Le programme « PR de documentation à périmètre figé » (PR brouillon #165, carte et spec sous `docs/issues/perimetre-fige/`) attend la fusion de la #166 pour lancer ses tickets de code depuis `main`, en 8.6.0 et suivantes ; son seul point de contact avec ce programme est une entrée « périmètre déclaré » ajoutée aux prompts des axes de documentation de `relecture/` (son ticket 3). L'architecte A de « gouverner nos boucles » (passation du 2026-11-27, branche `claude-jfrt-fam/lucid-pasteur-q59f3p`) écrira des tickets des familles relecture, fusionner et chantier : ils partent de `main` après la #166. Les PR #161 (8.3.4) et #162 (8.4.1), ouvertes avant 8.4.0 et hors de ce programme, ont des numéros de version à reprendre avant toute fusion.
- **Ce qui attend le produit** : rien. Une suite proposée, non décidée : faire lister par chaque axe de relecture les fichiers de règles lus (`CLAUDE.md`, `.claude/rules/`), comme il liste déjà les fichiers du diff, pour contrôler que la lecture demandée par A-11 a eu lieu. À poser au produit avant d'en faire un ticket.
- **Environnement de la session de suite** : dépôt `MAJ-agency/skills` seul, mode « Auto » ; la carte se pousse sur une branche `docs/…` puis par une PR de documentation vers `main`. Le dépôt est public : aucun nom de personne ni de projet client, ni dans la carte, ni dans un ticket, une PR ou un prompt.

## Journal

- 2026-11-25 — Architecte lancé par la session mère. Plugin chargé 8.3.3, marketplace 8.3.3 (le prompt nommait 8.3.0 ; aucun écart avec le marketplace). Faits établis par la documentation et six essais réels (`claude -p --plugin-dir`, transcripts lus) : spec, « Faits établis ». Question `P-1` posée au produit par la session mère. Alerte d'usage : le compte approche de sa limite hebdomadaire, levée le 2026-11-29 à 19 h UTC.

- 2026-11-25 — Tickets 1 et 2 écrits par un sous-agent, relus par un agent neuf (« pas prêt » : P-1 non tranchée, et des écarts), corrigés ; spec amendée (A-8 étendue à `lancement.md`, A-11, A-12). PR brouillon #163. Découpage envoyé à la session mère.
- 2026-11-25 — Capitaine de `skills` lancé (session_01BxuG2zzeL4A2u7UmWKeD2S) : la session mère n'en voyait aucun en vie. La session mère n'objecte pas à Opus (A-3).
- 2026-11-25 16 h 49 UTC — `P-1` sans réponse ; capitaine archivé (file vide, 2,68 $ en 1 h 15, compte en alerte d'usage hebdomadaire), son réveil désactivé (la suppression a été refusée par le contrôle du mode « Auto »). Il se relance à la première PR prête.
- 2026-11-27 18 h 51 UTC — `P-1` tranchée par le produit (oui : « avoir un contexte vierge et ne pas aller voir tout le projet »), relayée par la session mère. Tickets 1 et 2 `ready-for-agent`. Session du ticket 1 lancée (session_01BxuG2yyaJXUKmMh7bRUzzt, Opus). PR #163 sortie du brouillon, ordre de fusion posé ; capitaine relancé. Un second architecte travaille sur `skills` (périmètre des PR de documentation), hors de ce programme.

- 2026-11-27 19 h 51 UTC — PR #164 fusionnée (`4dba1de`, 8.4.0), arbre identique au sommet relu ; session du ticket 1 archivée (7,33 $). Ticket 2 lancé (session_01BxuG32TNSuYP6pzFEkLeWS, Sonnet).
- 2026-11-27 20 h 42 UTC — PR #166 livrée (8.5.0, sommet `452a29c`), lue à la source ; coordination écrite avec l'architecte « périmètre figé » (ses tickets de code partent après la #166, en 8.6.0).
- 2026-11-27 21 h 05 UTC — Passation décidée par le produit (reprise sur un autre compte) ; `## Passation` écrite.
- 2026-11-27 21 h 10 UTC — Architecte de suite (session_012xRpgXxfn5diB9dcvjpSes) : carte et passation lues. Plugin 8.4.0 chargé, marketplace 8.4.0. PR #166 lue à la source : ouverte, label et ordre `à-fusionner au sommet 452a29c…` posés, quatre contrôles verts, `clean`, aucun verdict ; elle attend le capitaine du compte sortant.
- 2026-11-27 21 h 13 UTC — PR #166 fusionnée le 2026-11-27 à 21 h 09 UTC (`b57eae7`, par le capitaine du compte sortant) ; arbre fusionné identique au sommet relu `452a29c`, plugin 8.5.0 sur `main`. Ticket 2 déjà `Fait — PR #166`. Nom du programme client retiré du ticket 2 (l. 66). `main` fusionné dans cette branche. `Phase: fini` ; la #167 part à la fusion.
- 2026-11-27 21 h 12 UTC — Abonnement à la #166 refusé par l'outil ; un relevé est programmé à 21 h 39 UTC à la place. L'architecte A de « gouverner nos boucles » (session_012xRpgZdqkCb5i5yCUrnRSt, même compte) a reçu ce que le programme change et le point de départ de ses tickets (main après la #166). Aucun capitaine de `skills` en vie sur ce compte.
- 2026-11-27 21 h 10 UTC — Capitaine de `skills` lancé sur ce compte (session_012xRpgZn85fsbtT8FpRj93L, Sonnet) à la demande de l'architecte A, qui n'en avait aucun. Ses versions : la première PR livrée prend la suivante de `main`, sans numéro réservé.

## Source

Prompt de lancement du 2026-11-25 (extrait) : « Aujourd'hui, nos skills lancent leurs sous-agents de revue par l'outil Agent avec un agent générique et un prompt construit à la volée : la lecture seule et le contexte vierge ne tiennent que par le texte du prompt, et le modèle dépend de la session qui lance. Le produit veut que ces sous-agents soient des sous-agents **définis** (fichiers de définition d'agents livrés par le plugin maj-skills, dossier agents/ d'un plugin Claude Code), qui fixent leur rôle, leurs outils et leur modèle, et que les skills les lancent par leur nom en continuant à fabriquer le message de la tâche par leurs scripts. » Relevé fourni : `relecture` (le plus important), `revue-de-ticket`, `revue-adversariale`, `criticite`, `architecte` (relecture d'un ticket hors chantier), `chantier/references/regime-7.md` (contre-revue) ; les sous-agents de relevé ou de rédaction hors périmètre. À établir d'abord : ce qu'un sous-agent défini reçoit d'office, la restriction des outils, le champ modèle, le nom d'un agent de plugin, le préchargement d'un skill, le cas d'un instantané plus ancien ; si le `CLAUDE.md` arrive, poser la question au produit avant de coder.
