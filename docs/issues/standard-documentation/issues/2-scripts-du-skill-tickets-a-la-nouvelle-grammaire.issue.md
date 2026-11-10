# Passer les scripts du skill `tickets` et de la chaîne à la grammaire `<TYPE>_<CTX>_<TRI>-<n>`

Status: ready-for-agent
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

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`). Le standard est dans les gabarits ; les scripts suivent ici.
