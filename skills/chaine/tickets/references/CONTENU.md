# Ce que contient le skill tickets, et pourquoi

## Ce que le skill exige : `scripts/docs/identifiants.mjs`, `next-id.mjs`, `next-id-branches.mjs`

La grammaire `<TYPE>_<CTX>_<TRI>-<n>` en un seul module, et la numérotation, posées par `socle-monorepo` (son `references/CONTENU.md`) : les gates de la racine et de `socle-tests` la lisent aussi, sans dépendre de ce skill. Tous les scripts ci-dessous l'importent (`./identifiants.mjs`, `../docs/identifiants.mjs`) ; aucun n'écrit la grammaire de son côté.

## `ticket-libre.mjs`

Trois sources croisées avant de commencer : la ligne `Status:` sur `develop` et sur chaque sujet, les branches distantes qui portent le slug, les PR ouvertes. Sans `gh` authentifié (session cloud), il ne conclut pas et donne la recherche MCP à faire : un « libre » faux coûte un ticket codé deux fois.

## `vagues.mjs`

Les vagues d'un chantier d'après les tickets : bloquants faits, fichiers chauds disjoints, au plus N. Il propose, le conducteur décide : trois sous-PR d'une même vague sont revenues en conflit sur un fichier chaud commun quand les vagues se faisaient à la main.

## `avancement.mjs`, `avancement-regles.mjs`

Le tableau d'avancement en une commande : le produit demandait « en % ? » cinq fois par jour, chaque réponse coûtant un tour du conducteur sur un gros contexte.

## `archiver-tickets.mjs`

Les tickets faits depuis 180 jours sortent du chemin des gates et de la réservation, sans quitter git ; les liens sont réécrits.

## `migrer-tickets.mjs`

Le passage d'une feature vers cette convention (`migrer <feature> <CTX> <TRI>`), depuis le format du socle d'avant le standard ou depuis `<TRI>-<n>` sans type ni contexte : fichiers rangés sous `<feature>/<ctx>/`, liens et mentions réécrits, `Type: task` posé sur un ticket qui n'en a pas. C'est le seul script qui lit une ancienne forme, pour la convertir. Dry-run par défaut.

## `scripts/verify/tickets.mjs`, `tickets-regles.mjs`, `tickets-dette.json`

Le gate : vocabulaire fermé de `Status:` et de `Type:`, `Règles:` dont chaque identifiant existe dans le registre de son contexte ou de `ALL`, `Blocked by:` qui existent, `Sujet:` bien formé, identifiant porté par une seule spec, carte de chantier complète (ligne `Migrations:` bien formée si présente, horodatages de 12 ou 14 chiffres), deux cartes ouvertes jamais sur le même horodatage de migration (une carte `fini` ne réserve plus : sinon deux chantiers se découvrent à la livraison du second), format prêt pour agent, et tests nommés par un défaut `Fait` présents et actifs. La dette gelée ne grandit jamais.

## `agents/`, `gabarits/`

Le tracker et les labels tels que les skills de Matt Pocock les attendent (`docs/agents/`), complétés par la réservation, l'archivage et le ticket prêt pour agent ; les gabarits d'une spec, d'un ticket, d'une carte de chantier, d'une carte de programme (`programme.md` : la mémoire de l'architecte, que le gate des cartes `*.map.md` ne lit pas), d'une règle (`regle.md` : en-tête YAML validé, énoncé en markdown) et d'une demande (`demande.md`).

## `depot-jouet.mjs` et les tests

Chaque script a son test ; ceux qui parlent à git tournent sur un dépôt jouet, avec un `origin` nu local et un PATH sans `gh`, comme une session cloud. `node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs`. Les tests jouent les scripts par `script()` et `module()` de `depot-jouet.mjs` : dans un projet, ceux de `scripts/` tels quels ; dans le plugin, une copie où la grammaire de `socle-monorepo` est posée à côté, comme dans un projet.

Les dossiers temporaires du banc (`depotJouet()`, la copie des scripts, `dossierTemporaire(prefixe)`) sont retirés à la sortie du processus de test ; `GARDER_JOUETS=1` les garde pour lire un échec.
