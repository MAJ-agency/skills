# Pièges connus (chaque ligne a coûté au moins une demi-journée)

La rétro d'un chantier (skill `chantier` § 7) ajoute ici une ligne par incident qui n'a pas encore son gate. Un piège vécu deux fois sans gate est une dette.

## Dépôt, branches, worktrees

- **Pas de Docker en session cloud** : sans base, `db:types`, `test:db` et la régénération des index par le capitaine échouent. `bash scripts/db/demarrer-local.sh` (posé par le socle API) allume la base de `compose.yaml` avec le PostgreSQL de la machine ; le script de démarrage de l'environnement cloud l'appelle pour chaque session (`admin.md`). Il ne repasse pas sur une reprise de session : relancer le script, sans risque, avant `test:db` ou `db:types`.
- **Ne jamais pousser depuis un `git worktree`** : le pre-push lance `pnpm check`, dont les tests des scripts de chaîne écrivent dans la config git partagée (`core.bare=true`, HEAD déplacé, commits « jouet » dans le worktree). Pousser depuis un clone normal (`git clone --no-local <dépôt> <dossier>`, puis `pnpm install`). Lire du code dans un worktree détaché reste sans risque.
- Un **worktree neuf n'a pas de `node_modules`** : le pre-push y échoue avec des erreurs absurdes. `pnpm install --frozen-lockfile --prefer-offline` d'abord.
- `next-id.mjs` lit l'arbre **et** les branches `sujet/*` et `docs/*` : `git fetch origin` avant, sinon deux specs reçoivent le même numéro.
- Un push refusé (« cannot lock ref », non fast-forward) sur une branche de sujet peut venir d'un commit identique poussé par la boucle du capitaine : comparer les arbres avant de forcer quoi que ce soit, et ne jamais forcer.

## Sous-PR d'un sujet

- **Retenir une sous-PR, c'est retirer `à-fusionner`** : un message au capitaine arrive après le squash.
- **Titre de sous-PR au-delà de 120 caractères avec « (#n) »**, ou refusé par commitlint : renvoyée, jamais fusionnée.
- **Le label se pose après le dernier push** : étiquetée sur son seul commit de réservation, une PR entre vide dans son sujet.
- **Un capitaine arrêté ne prévient personne** : l'architecte qui attend une fusion regarde d'abord la date de la dernière fusion sur develop.
