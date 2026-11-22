# ADR_ALL_ARC-{{N}} — Chaîne de production : un rôle par session, un ticket prêt par fille, une revue adversariale avant la file, les capitaines seuls fusionnent

- Statut : **accepté**
- Date : {{DATE}}
- Portée : le processus de développement, les sessions de l'assistant, la fusion vers `develop`

## Contexte

Le code de ce dépôt est écrit, pour l'essentiel, par des sessions de l'assistant de développement, plusieurs en parallèle. Trois faits, mesurés sur un premier projet mené ainsi, fondent cette décision.

- **La session qui écrit est la plus mal placée pour se relire.** Elle lit son intention, pas son code. Les gates attrapent ce qui se voit à la syntaxe, pas un périmètre filtré par le mauvais paramètre. Les études disponibles (CodeRabbit 2025, Veracode 2025, DORA 2025) mesurent plus de défauts dans le code généré, et l'ANSSI demande qu'il soit relu.
- **Le cadrage se paie N fois quand il n'est pas écrit une fois.** Chaque prompt de fille recopiait trois mille caractères de règles, avec des consignes qui divergeaient d'un conducteur de chantier à l'autre ; une fille passait quatorze minutes avant sa première ligne de code. Douze PR parties d'une branche de specs non fusionnée sont toutes tombées en conflit.
- **Le contexte de l'orchestrateur est le poste le plus cher.** Un conducteur de chantier a relu six cent mille tokens à chaque réveil, quatre-vingt-dix-neuf dollars dans la journée. Chaque fusion remettait toutes les autres PR en retard, et chaque session relançait sa CI pour rien.

## Décision

1. **Un rôle par session** : produit (une personne), architecte (un par programme : il mène l'amont et parle seul au produit), conducteur de chantier (un par chantier), session fille (un ticket), capitaine de fusion (un ou plusieurs par dépôt), relecteur adversaire (sous-agent). Un livrable d'un autre rôle part dans une autre session.
2. **Le chantier se cadre une fois.** Le conducteur ne lance une fille que sur un ticket **prêt pour agent** : `Sujet:`, `Blocked by:`, `Modèle:`, `Fichiers chauds:` en tête ; `## Où`, `## Décisions`, `## Surfaces`, `## Vérification` dans le corps. Le gate `tickets` le vérifie. Le prompt de fille tient en trois lignes et renvoie aux consignes communes de `docs/agents/chaine-de-production.md`.
3. **Ordre de fusion avant parallélisme.** La PR de specs est fusionnée dans le sujet avant la première fille. Un ticket ne commence que quand ses `Blocked by:` sont fusionnés. Deux tickets d'une même vague ne touchent pas le même fichier chaud.
4. **Toute PR qui touche du code, ou ce que la chaîne exécute ou lit (liste de `revue-exigee.mjs`), passe une revue avant `à-fusionner`**, dans la session, jamais en CI : la **revue adversariale** — un sous-agent en contexte vierge, le diff seul, une liste fermée de critères, un format imposé où chaque constat cite une règle écrite. Une PR qui réalise un ticket passe la **revue de ticket**, qui garde cette revue comme axe Règles et y ajoute deux sous-agents vierges aux listes fermées : le ticket (surfaces prouvées, décisions tenues, règles citées avec leurs cas de bord, périmètre) et la documentation (glossaire, registre, ADR, index générés, fiches). Une seule section de PR, « Revue de ticket » ou « Revue adversariale », que le capitaine exige. Le relecteur humain la relit et doit pouvoir expliquer le diff.
5. **Seuls les capitaines fusionnent.** Leur nombre n'importe pas : la règle d'ascendance garde la sûreté, et un verrou par PR (un commentaire marqué, posé au début de chaque passage) évite le travail en double. La file `à-fusionner` passe dans l'ordre, une PR à la fois, mise à jour avec `develop`, checks exigés attendus, squash vérifié. Juste avant chaque fusion, le capitaine vérifie lui-même que la PR a été testée sur l'état de la branche où elle entre (règle d'ascendance, skill `fusionner`), sans s'en remettre au réglage « strict » de GitHub ; un arbre du squash différent de l'arbre testé l'arrête. Ce qui casse revient à sa session avec `fusion-bloquée`. Personne d'autre ne fusionne ni ne remet une branche à jour.
6. **`develop` intègre, `main` livre.** `develop` est protégée et exige une branche à jour ; `main` ne reçoit que des livraisons.
7. **L'état du chantier vit hors du contexte du conducteur** : la carte et le tableau d'avancement. **Chaque incident nourrit la chaîne** : un renvoi ou un échec de vague donne un critère de revue, un gate ou une entrée de pièges.
8. **Les gardes d'agent échouent fermées.** Les hooks `PreToolUse` (fichiers, `Bash`, outils GitHub d'écriture) refusent ce que les règles disent « jamais », d'après une seule définition de la branche gardée (un sujet, `develop`, `main`, la branche par défaut) ; chacun porte `"onFailure": "block"` et un `"timeout"` d'au plus 60 s, et le gate `settings-json` l'exige : une garde qui plante ou dépasse son délai bloque l'outil au lieu de le laisser passer. Cela impose Claude Code 2.1.295 au moins. Une garde vaut pour des sessions de bonne foi ; la frontière, ce sont les règles de dépôt côté GitHub.

## Alternatives écartées

- **Une session par chantier qui code tout en séquence** — pas de parallélisme ; un contexte qui grossit au fil des tickets coûte plus cher par ticket qu'une fille neuve.
- **Des filles lancées sur une consigne courte, qui explorent seules** — exploration, questions et vérifications répétées N fois, consignes divergentes : c'est ce qui a été mesuré.
- **Une Action GitHub de revue par IA** — tokens facturés à l'API à chaque push, et un modèle doté de secrets exposé à l'injection de prompt par le contenu des PR.
- **Une revue ouverte, « fais tes remarques »** — elle trouve toujours quelque chose ; chaque suggestion suivie grossit le diff sans le rendre plus juste.
- **La merge queue de GitHub** — demande Enterprise Cloud sur un dépôt privé.
- **Chaque session fusionne elle-même** — le travail grandit au carré du nombre de PR.

## Conséquences

Le coût d'un ticket se rapproche du coût de son code. Les consignes ne divergent plus. Les conflits de fusion deviennent l'exception. Un regard qui n'a pas écrit le code précède la fusion. En échange : des tickets plus longs à écrire avant de lancer les filles, une section de plus dans chaque PR, une liste de critères à tenir, et une session de capitaine à faire tourner.

Mode d'emploi : `docs/agents/chaine-de-production.md`. Skills : `chantier`, `tickets`, `revue-adversariale`, `fusionner`. Contrat du projet : `.claude/chaine.json`.

## Amendements du grill (16/11/2026)

- Point 4 : « Toute PR de code » devient « Toute PR qui touche du code, ou ce que la chaîne exécute ou lit (liste de `revue-exigee.mjs`) ». Raison : la revue exigée ne voyait que `apps/`, `packages/` et `scripts/`, alors que la CI, les hooks, la configuration de l'agent et `docs/agents/` pilotent ce que le capitaine exécute (PR MAJ-agency/skills#94, plugin maj-skills 7.9.1).

## Amendements de la relecture indépendante ({{ADR_RELECTURE}})

- Point 1 : le « relecteur adversaire (sous-agent) » de la session qui code devient le **Relecteur** (un par dépôt, il aiguille les relectures) et la **session de relecture** (une par PR, deux pour une règle de criticité haute), qu'aucun auteur ne lance ni ne contrôle.
- Point 4 : la revue par l'auteur et la contre-revue du conducteur sont remplacées par la relecture indépendante : toute PR, documentation comprise, est relue par une session de relecture, qui écrit son verdict sur la PR ; la session qui code ne se relit plus et ne pose jamais `à-fusionner`, que le Relecteur pose sur un verdict validé.
- Point 5 : le capitaine ne lit plus de section de revue dans le corps de la PR ; il fusionne une PR dont un tour de relecture est validé pour le sommet qu'il fusionne, contrôlé à l'éligibilité puis juste avant l'appel de fusion.
- Une PR ouverte avant la clé `relecture` de `.claude/chaine.json` finit sous la version d'avant de ces trois points.
