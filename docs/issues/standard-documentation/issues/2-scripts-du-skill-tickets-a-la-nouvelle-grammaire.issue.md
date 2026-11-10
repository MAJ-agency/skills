# Passer les scripts du skill `tickets` et de la chaîne à la grammaire `<TYPE>_<CTX>_<TRI>-<n>`

Status: resolved
Type: task
Blocked by: 1

Le standard est écrit dans les gabarits (`SKILL.md` de `tickets`, `nomenclature.md`), mais les scripts lisent encore `<PRÉFIXE>-<n>` et `<PRÉFIXE>-<n>.<NN>`. Tant qu'ils n'ont pas suivi, un projet posé avec le plugin a une convention écrite et des scripts qui la contredisent.

## Où

- `skills/chaine/tickets/references/scripts/docs/identifiants.mjs` et son test : la grammaire. `TYPE ∈ RULE|SPEC|ADR|DSG|DOC|REQ`, `CTX = [A-Z][A-Z0-9]*`, `TRI = [A-Z]{2,4}`, `n = \d+` (zéros de tête acceptés pour une règle existante). Exports à ajouter : `REGLE`, `DEMANDE`, `lireIdentifiant(id) → { type, contexte, trigramme, n, index? }`, `identifiantDeLaRegle(nomDeFichier)` (`RULE_ALL_LIC-3.md`), `identifiantDeLaDemande(nomDeFichier)`. `SPEC` exige le type `SPEC` ; `TICKET` = `SPEC` + `.NN`. `slug('SPEC_ALL_SOC-1.03') → 'spec-all-soc-1-03'`.
- `next-id.mjs`, `next-id-branches.mjs` : `node scripts/docs/next-id.mjs RULE ALL LIC` ; le plus grand `n` par type, contexte et trigramme, dans l'arbre et sur les branches ; pour `RULE`, lire les noms de fichiers `RULE_<CTX>_<TRI>-<n>.md`.
- `ticket-libre.mjs`, `avancement.mjs`, `avancement-regles.mjs`, `vagues.mjs`, `archiver-tickets.mjs`, `couts.mjs` : lire les identifiants par `identifiants.mjs`, rien d'autre ne change ; les specs et tickets vivent sous `<feature>/<ctx>/`.
- `migrer-tickets.mjs` : `migrer <feature> <CTX> <TRI>` ; déplace dans `<feature>/<ctx>/` ; pose `Type: task` sur un ticket qui n'a pas de `Type:` ; comprend aussi l'ancienne forme `<TRI>-<n>-<slug>.spec.md`.
- `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/*.sh` et `.mjs` : partout où un identifiant est lu dans un nom de branche ou un titre de PR, la nouvelle forme (`spec-all-soc-1-03` dans une branche, `SPEC_ALL_SOC-1.03` dans un titre).
- `skills/chaine/socle-chaine-de-production/references/agent/*.mjs` et `docs-agents/chaine-de-production.md` : les exemples d'identifiants.
- Les `depot-jouet.mjs` des bancs : des fixtures à la nouvelle grammaire.

## Décisions

- Aucune double grammaire : un script ne lit que la nouvelle forme ; `migrer-tickets.mjs` seul lit l'ancienne, pour la convertir.
- Les dossiers de contexte en minuscules, les identifiants en majuscules : `lireIdentifiant` rend `contexte: 'ALL'`, et un helper `dossierDuContexte('ALL') → 'all'`.

## Surfaces

| Surface                         | Preuve                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| grammaire                       | `identifiants.test.mjs` : chaque type, un ticket, une règle à zéros (`RULE_FNSMR_LIC-05`), les refus (`LIC-3`, `SOC-1`, `SPEC_SOC-1`) |
| numérotation                    | `next-id` sur un dépôt jouet avec `RULE_ALL_LIC-3.md` et `SPEC_ALL_LIC-12-…spec.md` rend `4` et `13` |
| réservation, avancement, vagues | les bancs existants, fixtures migrées                                                    |
| migration                       | `migrer-tickets.test.mjs` : ancienne forme du socle et forme `<TRI>-<n>` sans contexte   |
| sujet, fusionner                | `sujet.test.mjs`, `fusionner.test.mjs` sur le dépôt jouet                                |

## Vérification

`pnpm test` à la racine de ce dépôt (tous les bancs), puis une pose sur un dépôt vide (`/maj-skills:socle-monorepo` avec chaîne) : `pnpm check:tickets` vert, `node scripts/docs/next-id.mjs SPEC ALL SOC` rend `2`.

## Answer

Livré dans une seule PR vers `main`, plugin passé en 4.0.0 (le contrat du skill `tickets` change).

- **La grammaire en un seul module**, `identifiants.mjs` : les six types, `lireIdentifiant`, `REGLE`, `DEMANDE`, `identifiantDeLaRegle`, `identifiantDeLaDemande`, `identifiantDuFichier`, `dossierDuContexte`, `slug` et son inverse `identifiantDeBranche`, `ticketDeLaPr`. Une règle existante garde ses zéros (`RULE_FNSMR_LIC-05`, comptée 5). `LIC-3`, `SOC-1`, `SPEC_SOC-1` sont refusés.
- **`next-id.mjs <TYPE> <CTX> <TRI>`** : le plus grand `n` par type, contexte et trigramme, lu dans les noms de fichiers de l'arbre et des branches `sujet/*` et `docs/*` ; une règle sans slug est vue. Sert `ADR ALL ARC` pour `socle-monorepo`.
- **`ticket-libre`, `avancement`, `avancement-regles`, `vagues`, `archiver-tickets`, `couts`, le gate `tickets.mjs`** : plus aucune expression d'identifiant locale, tout vient d'`identifiants.mjs`.
- **`migrer-tickets.mjs <feature> <CTX> <TRI>`** : seul script qui lit une ancienne forme. Il range sous `<feature>/<ctx>/`, pose `Type: task` sur un ticket sans `Type:`, et convertit aussi `<TRI>-<n>-<slug>` (et `<CTX>-<TRI>-<n>`) en gardant le numéro, mentions réécrites.
- **`sujet.sh`, `file.sh`, `github.sh`** : `ID_SPEC` disparaît. Les `.sh` appellent `identifiant.mjs` (skill `fusionner`), petit point d'entrée `node` qui importe la grammaire ; `boucle.sh` copie aussi `scripts/docs/identifiants.mjs` d'`origin/develop` avec ses outils, et s'arrête (6) s'il manque.
- **Hooks d'agent** : `regles.mjs` ne recopie plus le préfixe ; `garde-commandes.mjs` lit le ticket de la branche par `identifiants.mjs`.
- **`contexte-ticket.mjs`** (ticket `4`) : seul le strict nécessaire pour rester vert, les identifiants cités se lisent par la grammaire ; la lecture d'une règle dans son fichier reste au ticket `4`.
- **Bancs** : fixtures de tous les `depot-jouet.mjs` et tests à la nouvelle grammaire ; bancs ajoutés pour `next-id`, `archiver-tickets`, `identifiant.mjs`.

Tests : 262, 262 verts (231 sur `main`), par `node --test 'skills/*/*/scripts/*.test.mjs' 'skills/*/*/references/scripts/*/*.test.mjs' 'skills/*/*/references/agent/*.test.mjs'`. La vérification par pose a été remplacée, sur décision de l'architecte, par un dépôt vide monté à la main (gabarit `docs/` de `socle-monorepo` et scripts de `tickets`) : gate vert, `next-id SPEC ALL SOC` → `2`, `next-id ADR ALL ARC` → `6`. Sorties dans la PR.

Reste, hors de ce ticket : deux scripts d'autres skills gardent une expression de l'ancienne forme, `references-agent-regles.mjs` et `references-agent.mjs` (`socle-monorepo`), `tests-creux.mjs` (`socle-tests`). Ils ne peuvent pas importer `identifiants.mjs` sans que ces skills dépendent de `tickets` : à décider dans un ticket à part.

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`). Le standard est dans les gabarits ; les scripts suivent ici.
- 2026-11-10 — Résolu : scripts et bancs à la grammaire `<TYPE>_<CTX>_<TRI>-<n>`, 262 tests verts, plugin 4.0.0. Voir `## Answer`.
