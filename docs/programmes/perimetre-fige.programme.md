# PR de documentation à périmètre figé — carte du programme

Une PR de documentation déclare son périmètre à l'ouverture et le garde jusqu'à sa fusion : sa relecture indépendante converge avant le plafond. Cette carte est la mémoire durable de l'architecte : une session cloud repart d'un conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la source, et reprend à la phase écrite sans reposer une question tranchée.

## Fiche

Phase: spec — spec écrite le 2026-11-27, deux questions posées au produit (`Q-1`, `Q-2`), tickets à écrire après sa réponse
Responsable: Guillaume Jauffret
Architecte: session_01BxuG31gJXv41A7jRRFEAWi (ouverte par le produit le 2026-11-27, mode « Auto », dépôts `skills`, `anchorpost`, `essai-relecture-8`, `anchorpost-essai`, et `atalian-offer-generator` en lecture)
Objectif: une règle du régime 8, écrite dans les skills et vérifiée par des bancs et par un essai réel — périmètre déclaré, corrections limitées aux constats du verdict, fait nouveau renvoyé en suite, décision de plafond écrite par l'architecte.
Dépôts: `MAJ-agency/skills` (skills `relecture`, `relecteur`, `fusionner`, `architecte`, `chantier`, `socle-chaine-de-production`, glossaire `CONTEXT.md`) ; `MAJ-agency/essai-relecture-8` (l'essai réel) ; les projets reçoivent la règle par la mise à jour du plugin et la repose des scripts.
Source: le prompt d'ouverture de cette session (2026-11-27), résumé dans `## Source` — entrée brute, ni spec ni décision.
Capitaines: `skills` : absent — à lancer par l'architecte à la première PR prête (celui du programme « définitions d'agents » est archivé)
Relecteurs: `skills` : absent (dépôt sans la chaîne)

## Chantiers

| n°  | Chantier | Dépôt | Spec | Carte | Conducteur | État |
| --- | -------- | ----- | ---- | ----- | ---------- | ---- |
| 1   | Périmètre figé | `skills`, puis `essai-relecture-8` pour l'essai | [`perimetre-fige.spec.md`](../issues/perimetre-fige/perimetre-fige.spec.md) | sans carte de chantier (A-7) | l'architecte (A-7) | spec écrite, à valider par le produit |

## Decisions-so-far

Décisions du produit :

- P-1 — (2026-11-27, prompt d'ouverture) Les quatre premiers points de l'objectif sont demandés : périmètre déclaré à l'ouverture, corrections limitées aux constats du verdict, fait nouveau renvoyé à une autre PR ou à un ticket, et, au plafond d'une PR de l'architecte, décision de plafond écrite par l'architecte lui-même. Ses mots : « il en a le droit ».

Décisions de l'architecte : A-1 à A-8, écrites avec leur raison dans la spec (`## Décisions de conception`).

## Fog

- `Q-1` — Aux tours 2 et 3 d'une PR de documentation, un constat nouveau sur un texte inchangé depuis le tour précédent cesse-t-il de bloquer ? Recommandation : oui. Posée au produit le 2026-11-27.
- `Q-2` — Les constats « écartés au tri » sont-ils transmis au tour suivant ? Recommandation : non. Posée au produit le 2026-11-27.
- Deux sessions relisent un même tour et un seul verdict refusé suffit à refuser le tour ; leurs verdicts divergent en nombre et en gravité (spec, « Faits établis », fait 6). Hors de ce programme : à reprendre si la non-convergence persiste après la règle.
- La PR `atalian-offer-generator#6` a été fusionnée le 2026-11-27 sans commentaire `Décision de plafond`. Rien à faire ici : c'est le fait que la règle A-5 évite.

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |
| architecte | — | session_01BxuG31gJXv41A7jRRFEAWi | — | — | — |

## Passation

Écrite le 2026-11-27, à la demande du produit d'archiver la session.

- **Où en est le chantier.** La carte et la spec sont dans la PR brouillon `MAJ-agency/skills#165` (branche `claude-jfrt-fam/great-lovelace-pwm6uo`), contrôles verts au sommet de la spec. Aucun ticket n'est écrit. Aucun fichier de skill n'est modifié.
- **Ce qui attend le produit.** `Q-1` et `Q-2` (spec, « Questions au produit »), posées le 2026-11-27, sans réponse. La spec n'est pas validée.
- **Suite, dans l'ordre.** Réponses du produit portées dans la carte (`P-2`, `P-3`) et dans la spec ; les quatre tickets écrits par un sous-agent, relus par un agent neuf, ajoutés à la PR #165, dont le périmètre déclaré les couvre ; PR sortie du brouillon, commentaire `à-fusionner au sommet <sha>` puis label `à-fusionner` ; un capitaine pour `skills` s'il n'y en a pas en vie ; ticket 1 lancé depuis `main` après la fusion de `MAJ-agency/skills#166`.
- **Sessions en vie.** Aucune session lancée par cet architecte. L'architecte du programme « définitions d'agents » (session_01BxuG2z7ypDYopx6aF3M1sd) a dit qu'il préviendrait de la fusion de la PR #166 : la session de suite lit l'état de cette PR sur GitHub.
- **Environnement de la session de suite.** Ouverte par le produit, en « Auto », sur `MAJ-agency/skills` ; `MAJ-agency/essai-relecture-8` pour le ticket 4 ; `MAJ-agency/atalian-offer-generator` en lecture, seulement pour relire les verdicts d'origine.

## Journal

- 2026-11-27 — Programme ouvert par le produit. Plugin chargé 8.4.0, marketplace 8.4.0. Relevés faits par deux sous-agents : les commentaires des PR `atalian-offer-generator#5` et `#6`, et le texte actuel des skills du régime 8. L'architecte du programme « définitions d'agents » (session_01BxuG2z7ypDYopx6aF3M1sd) a été prévenu avant tout fichier de skill : son ticket 2 ne touche ni `relecture/`, ni `relecteur/`, ni `chaine-de-production.md` ; il touche `architecte/SKILL.md` § 5, les fichiers de version et `scripts/depot.test.mjs`. Accord : les tickets de ce programme partent de `main` après la fusion de son ticket 2. Spec écrite ; `Q-1` et `Q-2` posées au produit. Alerte d'usage déjà notée par l'autre carte : limite hebdomadaire du compte, levée le 2026-11-29 à 19 h UTC.
- 2026-11-27 20 h 47 UTC — PR brouillon #165 ouverte, périmètre déclaré dans son corps ; quatre contrôles verts. Le ticket 2 du programme « définitions d'agents » est livré (PR #166, 8.5.0), pas encore fusionné. Le produit demande s'il peut archiver la session : passation écrite, rappel programmé supprimé.
- 2026-11-27 21 h 10 UTC — L'architecte du programme « définitions d'agents » écrit que la PR #166 est fusionnée sur `main` (plugin 8.5.0) : les tickets de ce programme peuvent partir de `main`, en 8.6.0. Son programme passe à un architecte d'un autre compte, qui ne peut pas écrire à cette session, et son capitaine est archivé : ce programme lance son propre capitaine pour `skills` à la première PR prête.

## Source

Prompt d'ouverture du 2026-11-27 (résumé). Constat, sur `MAJ-agency/atalian-offer-generator`, régime 8 : les PR de documentation #5 et #6 ont atteint le plafond de trois tours refusés et ont été fusionnées à la main ; la relecture ne convergeait pas parce que la PR grossissait en cours de route ; deux faux positifs identiques revenaient à chaque tour. Objectif en cinq points : (1) périmètre déclaré à l'ouverture (fichiers, décisions, sujets) ; (2) entre deux tours, la session ne corrige que les constats du verdict ; (3) un fait nouveau, une décision nouvelle ou une ADR qu'un constat révèle part dans une autre PR ou un ticket, cité en suite ; (4) au plafond, l'architecte écrit la décision de plafond lui-même ; (5) à étudier : transmettre ou non les constats « écartés au tri ». Hors périmètre : les définitions d'agents, programme voisin (PR `MAJ-agency/skills#163`). Consigne : l'architecte applique la règle à sa propre PR de documentation.
