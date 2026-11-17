# ADR_ALL_ARC-{{N}} — Un chemin sensible est relu par un humain, et c'est GitHub qui le tient : CODEOWNERS se génère depuis `cheminsSensibles`

- Statut : **accepté**
- Date : {{DATE}}
- Portée : `.github/CODEOWNERS`, `.claude/chaine.json`, la protection de `develop` et de `main`, le capitaine de fusion

## Contexte

`cheminsSensibles` (`.claude/chaine.json`) dit ce qui doit être relu de plus près : les gardes de la chaîne (hooks d'agent, scripts du capitaine et des sujets, hooks git, CI, configuration de l'agent) et les dossiers sensibles du projet. La chaîne s'en sert déjà : contre-revue, `/security-review`, revue exigée au passage du capitaine ({{ADR_CHAINE}}). Mais tout cela est joué par des sessions : la section de revue est écrite par la session qui a fait le travail, et le capitaine exécute ce qui entre. Contre une session qui se trompe de bonne foi, c'est assez ; contre une PR hostile ou une session détournée, seul GitHub tient, et GitHub ne lit qu'un fichier : `CODEOWNERS`, avec la règle « Require review from Code Owners ».

Tenus à la main, `cheminsSensibles` et CODEOWNERS divergent : un chemin ajouté à l'un manque à l'autre, et personne ne le voit avant qu'une PR passe sans relecture.

## Décision

**`.github/CODEOWNERS` est une copie générée du contrat, et GitHub exige l'approbation d'un propriétaire sur `develop` et `main`.**

1. **Une seule source.** `node scripts/github/codeowners.mjs --ecrire` (`pnpm codeowners`) écrit CODEOWNERS depuis `.claude/chaine.json` : chaque motif de `cheminsSensibles`, ancré à la racine, plus `.github/CODEOWNERS` lui-même et `.claude/chaine.json`, tous à `proprietaires`. Un motif que CODEOWNERS lirait autrement (`?`, `[…]`, `!`, `#`, `\`, `~`, un blanc, un `**` qui n'est pas un segment entier, que GitHub lit comme un simple `*`) ou un motif dégénéré (`/` initial, `//`, un segment `.` ou `..`) est refusé, jamais traduit à peu près. Les motifs admis gardent le sens du moteur du gate `tickets`, `*` dans un segment et `**` en segment entier compris ; un chemin sans `/` final y désigne aussi, pour GitHub, ce que contient le dossier du même nom : pour un motif admis, CODEOWNERS ne couvre jamais moins (la casse mise à part, plus bas).
2. **Les propriétaires sont une donnée du contrat** (`proprietaires` : `@utilisateur`, `@organisation/équipe`), pas un placeholder du fichier posé. Un placeholder rempli une fois serait écrasé à la première régénération, ou ferait de CODEOWNERS une seconde source ; dans le contrat, les propriétaires vivent à côté des chemins qu'ils possèdent, se relisent dans le même diff, et `.claude/chaine.json` est lui-même possédé : une PR qui change la liste attend l'approbation de la liste en place.
3. **Un gate** (`scripts/github/codeowners.mjs`, sans argument ; étape `check:codeowners` de `pnpm check` et gate rapide de fin de tour) refuse tout écart entre le fichier et ce que le contrat génère, et donne la commande qui régénère. Un contrat sans propriétaire est refusé.
4. **Une garde d'agent.** `garde-fichiers` refuse l'édition de CODEOWNERS (`.github/`, racine, `docs/`) : le refus dit de modifier `.claude/chaine.json`, puis de régénérer.
5. **La règle de GitHub** (liste de l'admin, `docs/agents/chaine-admin.md`) : sur `develop` et `main`, « Require review from Code Owners » avec « Required approvals » à 0 (à vérifier sur une PR d'essai au premier dépôt posé), « Block force pushes », « Restrict deletions », aucune liste de contournement. Ni « Dismiss stale pull request approvals » ni « Require approval of the most recent reviewable push » : le capitaine pousse la mise à jour avec develop juste avant chaque fusion, l'approbation tomberait à chaque fois. **Le prix : une approbation couvre ce qui est poussé après elle.** Une PR approuvée peut encore recevoir des commits, chemins sensibles compris, et GitHub la laisse fusionner : « relu par un humain » vaut pour le sommet approuvé, et rien ne tient encore un push ultérieur.
6. **Le capitaine attend.** Une PR qui attend l'approbation d'un propriétaire n'est ni rouge ni bloquée : `file.sh` la montre `attend un propriétaire`, le capitaine la saute sans la renvoyer et la reprend au tour suivant, une fois approuvée (skill `fusionner`). Il ne demande ni ne donne l'approbation. Il lit l'attente en REST : la règle de la base, et parmi les relecteurs encore demandés les seuls propriétaires de CODEOWNERS lu sur la base. À défaut, le refus de fusion de GitHub la révèle (l'auteur seul propriétaire, que GitHub ne demande pas) : le capitaine le note d'un commentaire, montre la PR `attend un humain` et ne la remet plus à jour tant qu'aucune revue approuvée nouvelle n'est arrivée.

## Ce que GitHub fait, et que la chaîne ne change pas

- **GitHub lit CODEOWNERS sur la branche visée**, jamais dans la PR. Une PR qui modifie CODEOWNERS ou `.claude/chaine.json` est jugée par l'ancienne version : elle ne retire pas elle-même son propriétaire, et un chemin qu'elle rend sensible n'est tenu qu'après sa fusion.
- **L'auteur d'une PR ne peut pas l'approuver.** Quand les sessions publient sous le compte d'un humain, cet humain ne peut approuver aucune de leurs PR : il faut un **deuxième propriétaire humain**, ou des sessions qui publient sous un compte qui n'est pas propriétaire (un bot, une GitHub App).
- **Avec un seul humain, la règle ne protège pas.** Ou bien toute PR sensible attend une approbation que personne ne peut donner, ou bien l'humain la contourne, et le contournement est l'écart que la règle devait empêcher. La liste de l'admin le dit, et la règle ne se coche pas tant qu'il n'y a pas deux propriétaires.
- **Les sous-PR d'un sujet** entrent dans `sujet/<nom>` sans cette règle (le capitaine et les sessions y poussent sans PR) ; la livraison du sujet vers `develop` la demande, pour tout ce que le sujet apporte.
- **Une PR vers `main`** (PR de livraison) n'est pas lue « attend un propriétaire » par la file : seul le refus de fusion de GitHub la révèle, et le capitaine la saute sans renvoi. Accepté : une livraison vers `main` est rare et conduite par un humain.
- **Les motifs de CODEOWNERS sont sensibles à la casse**, ceux de la chaîne non : `Scripts/agent/` échappe à GitHub, pas à la revue exigée.

## Alternatives écartées

- **CODEOWNERS écrit à la main**, recommandé jusqu'ici sans être posé : il diverge du contrat, et rien ne le voit.
- **Les propriétaires en placeholder dans le fichier posé** : écrasés à la régénération, ou seconde source (décision 2).
- **CODEOWNERS parmi les index générés** (`scripts/docs/index-generes.json`) : le capitaine le régénérerait de lui-même après chaque fusion, et `diff-revue.sh` l'exclurait du diff relu. Son contenu est une frontière : il se relit, et seule une PR qui change le contrat le change.
- **Une approbation qui tombe à chaque push** (« Dismiss stale pull request approvals », « Require approval of the most recent reviewable push ») : la mise à jour du capitaine avec develop la ferait tomber avant chaque fusion, et aucune PR sensible n'entrerait.

Hors du périmètre de cette décision : l'extension de CODEOWNERS au-delà des chemins sensibles, que le produit n'a pas tranchée.

## Conséquences

Ce qu'un humain doit relire, GitHub l'exige, et la liste ne se tient qu'à un endroit. En échange : chaque PR qui touche un chemin sensible, livraisons de sujet comprises, attend l'approbation d'un propriétaire ; un deuxième humain est nécessaire ; ajouter un chemin sensible, c'est une PR sur `.claude/chaine.json` suivie de `pnpm codeowners`, approuvée par un propriétaire en place. Ce qui reste ouvert : un push sur un chemin sensible après l'approbation n'est tenu par rien.

Mode d'emploi : `docs/agents/chaine-de-production.md`, `docs/agents/chaine-admin.md`, skill `fusionner`.
