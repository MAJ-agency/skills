# Pièges connus (chaque ligne a coûté au moins une demi-journée)

La rétro d'un chantier (skill `chantier` § 7) ajoute ici une ligne par incident qui n'a pas encore son gate. Un piège vécu deux fois sans gate est une dette.

## Dépôt, branches, worktrees

- **Pas de Docker en session cloud** : sans base, `db:types`, `test:db` et la régénération des index par le capitaine échouent. `bash scripts/db/demarrer-local.sh` (posé par le socle API) allume la base de `compose.yaml` avec le PostgreSQL de la machine ; le script de démarrage de l'environnement cloud l'appelle pour chaque session (`admin.md`). Il ne repasse pas sur une reprise de session : relancer le script, sans risque, avant `test:db` ou `db:types`.
- **Pousser depuis un `git worktree` exige les hooks du socle ≥ 7.0.1.** Cause : sous un worktree, git exporte `GIT_DIR` au pre-push (et `GIT_DIR` plus `GIT_INDEX_FILE` au pre-commit) ; les tests qui font un `git init` jouet puis un `commit` écrivaient alors dans le dépôt réel (`core.bare=true` dans la config partagée, HEAD déplacé, commits « jouet » sur la branche du worktree). Remède : `.husky/pre-push` et `.husky/pre-commit` font `unset GIT_DIR GIT_INDEX_FILE` avant de lancer `pnpm run check` / `check:commit` ; le capitaine reste donc dans son worktree, `pnpm install` y installe les hooks. Le piège demeure pour un projet dont `.husky/` est antérieur au socle 7.0.1 : n'y pas pousser depuis un worktree tant qu'il n'a pas reposé ses hooks. Les scripts de la chaîne ne sautent jamais un hook (`--no-verify`) : un refus de hook sort en 3, sa sortie sur stderr.
- Un **worktree neuf n'a pas de `node_modules`** : le pre-push y échoue avec des erreurs absurdes. `pnpm install --frozen-lockfile --prefer-offline` d'abord.
- **La couverture du pre-push se mesure contre la base de la fusion** (`check:coverage --base-auto` : le sujet visé par le push, sinon le plus proche de develop et des `origin/sujet/*`) : sans `git fetch origin`, les `origin/sujet/*` manquent et un commit poussé sur un sujet mesure contre develop tout le code du sujet. Fetcher, ne pas contourner par une base locale.
- **Un horodatage de migration n'est valable qu'à l'arrivée dans develop** : le migrateur refuse une migration plus ancienne que la dernière jouée, et les chantiers parallèles livrent dans un ordre imprévisible (un sujet livré après un autre au même horodatage, ou plus ancien, casse la recette). Juste avant la livraison, une migration non livrée prend un horodatage postérieur à la dernière de develop ; `passer.sh`, `sujet.sh livrer` et l'étape CI « Ordre des migrations » refusent le reste, le message donne le fichier à renommer (`git mv`) et l'horodatage libre suivant. Les réservations se déclarent sur la ligne `Migrations:` de la fiche de la carte, que `check:tickets` lit pour refuser deux cartes ouvertes sur le même horodatage. Ne jamais renommer une migration déjà livrée.
- `next-id.mjs` lit l'arbre **et** les branches `sujet/*` et `docs/*` : `git fetch origin` avant, sinon deux specs reçoivent le même numéro.
- **Une carte se pousse sur son sujet par `bash scripts/chaine/sujet.sh carte <nom>`, jamais par `git push origin HEAD:sujet/<nom>`** : le hook d'agent refuse tout push vers un sujet, sous toutes ses formes (guillemets, `git -C`, chemin absolu de git, préfixe comme `timeout`, `git push` nu depuis une branche `sujet/…`), et refuse une destination illisible (variable, substitution, motif). `carte` ne pousse qu'un seul `*.map.md` par commit, modifié en place (ni création, ni suppression, ni renommage), jamais de force.
- Un push refusé (« cannot lock ref », non fast-forward) sur une branche de sujet peut venir d'un commit identique poussé par la boucle du capitaine : comparer les arbres avant de forcer quoi que ce soit, et ne jamais forcer.

## Sous-PR d'un sujet

- **Retenir une sous-PR, c'est retirer `à-fusionner`** : un message au capitaine arrive après le squash.
- **Titre de sous-PR au-delà de 120 caractères avec « (#n) »**, ou refusé par commitlint : renvoyée, jamais fusionnée.
- **Le label se pose après le dernier push** : étiquetée sur son seul commit de réservation, une PR entre vide dans son sujet.
- **Un `pnpm check` vert sur la seule branche ne dit rien de sa fusion** avec un sujet qui a avancé depuis son départ (cas vécu : anchorpost PR 54) : avant de poser `à-fusionner`, `git fetch origin`, fusionner le sujet dans la branche et rejouer `pnpm check` sur le résultat.
- **Un capitaine arrêté ne prévient personne** : le conducteur qui attend une fusion regarde d'abord la date de la dernière fusion sur develop.

## Boucle du capitaine

- **Une boucle arrêtée peut être relancée par un processus d'attente oublié** que `pgrep` ne voit pas (cas vécu : une livraison intermédiaire rouverte puis fermée sans fusion) : arrêter la boucle par `bash scripts/chaine/boucle.sh --arreter` (fichier d'arrêt + verrou d'instance unique), jamais par un simple `kill` ; `--reprendre` pour repartir.
- **Le pid noté dans un verrou ne prouve rien** : boucle morte (`kill -9`), ses orphelins (passer.sh, `tee`, `git gc` détaché) gardent le verrou, et le pid peut être recyclé par un processus étranger. `--arreter` ne tue que les détenteurs réels (`/proc/*/fd` → verrou) et le groupe noté s'ils en sont membres ; `scripts/db/demarrer-local.sh` ferme le descripteur 9 par hasard, couplage fragile : un script qui lance un démon le ferme (`9>&-`).
