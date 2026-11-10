# Ce que contient le skill tickets, et pourquoi

## `scripts/docs/identifiants.mjs`

La convention en un seul module : la grammaire `<TYPE>_<CTX>_<TRI>-<n>` du socle (`ADR_ALL_ARC-1`), les six types, l'identifiant de spec, de ticket, de règle et de demande, les noms de fichiers, le slug de branche. Tous les autres scripts l'importent : changer la convention, c'est changer ce fichier et ses tests.

## `next-id.mjs`, `next-id-branches.mjs`

Le prochain numéro d'un type, d'un contexte et d'un trigramme (`next-id.mjs RULE ALL LIC`), lu dans les noms de fichiers de l'arbre **et** des branches distantes `sujet/*` et `docs/*` : une spec écrite sur une branche non fusionnée a déjà reçu le même numéro qu'une autre, deux fois. Une règle n'a pas de slug (`RULE_ALL_LIC-3.md`) et une règle existante garde ses zéros (`RULE_FNSMR_LIC-05` compte pour 5) : le numéro se lit par `identifiantDuFichier` et `lireIdentifiant`, pas par une expression locale.

## `ticket-libre.mjs`

Trois sources croisées avant de commencer : la ligne `Status:` sur `develop` et sur chaque sujet, les branches distantes qui portent le slug, les PR ouvertes. Sans `gh` authentifié (session cloud), il ne conclut pas et donne la recherche MCP à faire : un « libre » faux coûte un ticket codé deux fois.

## `vagues.mjs`

Les vagues d'un chantier d'après les tickets : bloquants faits, fichiers chauds disjoints, au plus N. Il propose, l'architecte décide : trois sous-PR d'une même vague sont revenues en conflit sur un fichier chaud commun quand les vagues se faisaient à la main.

## `avancement.mjs`, `avancement-regles.mjs`

Le tableau d'avancement en une commande : l'humain demandait « en % ? » cinq fois par jour, chaque réponse coûtant un tour d'architecte sur un gros contexte.

## `archiver-tickets.mjs`

Les tickets faits depuis 180 jours sortent du chemin des gates et de la réservation, sans quitter git ; les liens sont réécrits.

## `migrer-tickets.mjs`

Le passage d'une feature vers cette convention (`migrer <feature> <CTX> <TRI>`), depuis le format du socle d'avant le standard ou depuis `<TRI>-<n>` sans type ni contexte : fichiers rangés sous `<feature>/<ctx>/`, liens et mentions réécrits, `Type: task` posé sur un ticket qui n'en a pas. C'est le seul script qui lit une ancienne forme, pour la convertir. Dry-run par défaut.

## `scripts/verify/tickets.mjs`, `tickets-regles.mjs`, `tickets-dette.json`

Le gate : vocabulaire fermé de `Status:` et de `Type:`, `Règles:` dont chaque identifiant existe dans le registre de son contexte ou de `ALL`, `Blocked by:` qui existent, `Sujet:` bien formé, identifiant porté par une seule spec, carte de chantier complète (ligne `Migrations:` bien formée si présente), deux cartes ouvertes jamais sur le même horodatage de migration (une carte `fini` ne réserve plus : sinon deux chantiers se découvrent à la livraison du second), format prêt pour agent, et tests nommés par un défaut `Fait` présents et actifs. La dette gelée ne grandit jamais.

## `agents/`, `gabarits/`

Le tracker et les labels tels que les skills de Matt Pocock les attendent (`docs/agents/`), complétés par la réservation, l'archivage et le ticket prêt pour agent ; les gabarits d'une spec, d'un ticket, d'une carte, d'une règle (`regle.md` : en-tête YAML validé, énoncé en markdown) et d'une demande (`demande.md`).

## `depot-jouet.mjs` et les tests

Chaque script a son test ; ceux qui parlent à git tournent sur un dépôt jouet, avec un `origin` nu local et un PATH sans `gh`, comme une session cloud. `node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs`.
