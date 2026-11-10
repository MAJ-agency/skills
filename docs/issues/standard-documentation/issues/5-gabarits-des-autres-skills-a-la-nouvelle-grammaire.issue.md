# Passer les gabarits des autres skills à la grammaire des identifiants

Status: ready-for-agent
Type: task
Blocked by: 1

`socle-monorepo` et `tickets` écrivent la nouvelle grammaire ; les autres skills posent encore des ADR nommées `ARC-2-…`, `WEB-1-…`, `MOB-1-…`, `ARC-N-…`, et des fragments de `CLAUDE.md` qui citent `ARC-2`, `ARC-8`, `ARC-9`. Un projet posé aujourd'hui aurait `ADR_ALL_ARC-1` à côté de `ARC-2` : deux grammaires dans un même dossier.

## Où

- `skills/backend/socle-nest-hexagonal/references/adr/ARC-2-…` → `ADR_ALL_ARC-2-…`, titre compris ; `references/api/CLAUDE.md`, `fragments/*.md`, `tickets/*.issue.md`, `rules/*.md` : chaque citation `ARC-n` devient `ADR_ALL_ARC-n`.
- `skills/monorepo/socle-tests/references/adr/ARC-N-*.md` → `ADR_ALL_ARC-N-*.md` ; `SKILL.md` étape 7.
- `skills/chaine/socle-chaine-de-production/references/adr/ARC-N-*.md` → `ADR_ALL_ARC-N-*.md` ; `docs-agents/chaine-de-production.md`, `fragments/claude-md-fusion.md`, `admin.md`, `ci/ci.yml` (commentaires), `SKILL.md`.
- `skills/frontend/socle-web-next/references/adr/web/WEB-1-…` → `ADR_ALL_WEB-1-…` ; `references/web/CLAUDE.md`, fragments, tickets.
- `skills/mobile/socle-mobile-expo/references/adr/mobile/MOB-1-…` → `ADR_ALL_MOB-1-…` ; idem.
- `skills/packages/socle-contrats/references/**` : citations.
- `skills/chaine/revue-adversariale/references/criteres-socle.md`, `skills/chaine/revue-de-ticket/references/*.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/recette-humaine/**` : exemples d'identifiants (`SOC-1.03` → `SPEC_ALL_SOC-1.03`, `FAC-3` → `RULE_ALL_FAC-3`).
- Les tickets de `references/tickets/` de chaque skill de service : `Type: task` déjà présent ; citations.
- `README.md` de ce dépôt et `CLAUDE.md` du gabarit racine (`socle:routing`) : exemples.
- Les appels à `next-id.mjs` sans type ni contexte, qui sortent en `2` depuis le ticket `2` : `node scripts/docs/next-id.mjs ARC` devient `node scripts/docs/next-id.mjs ADR ALL ARC`, `next-id.mjs <TRI>` devient `next-id.mjs SPEC <CTX> <TRI>`. Relevés par la fille du ticket `2` : `skills/chaine/socle-chaine-de-production/SKILL.md` (étape 8 et le bloc de commandes), `references/CONTENU.md` (§ ADR), `references/fragments/readme-commandes.md`, `skills/monorepo/socle-tests/SKILL.md` (étape 7), `skills/chaine/chantier/SKILL.md` (§ Fiche). Un `grep -rn 'next-id.mjs' skills --include=*.md` ne doit plus rendre que des appels à trois arguments.

## Décisions

- Un `grep -rn "\bARC-[0-9N]\+\b\|\bWEB-[0-9]\+\b\|\bMOB-[0-9]\+\b\|\bSOC-[0-9]\+\b" skills` sans préfixe de type doit ne rien rendre à la fin, hors les lignes qui parlent de l'ancienne forme pour la migrer.
- Les fichiers de gabarit se renomment par `git mv` ; les `{{N}}` restent.

## Surfaces

| Surface                       | Preuve                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| appels de `next-id`           | le `grep` de `next-id.mjs` ci-dessus : trois arguments partout                     |
| aucune ancienne grammaire     | le `grep` ci-dessus vide                                                            |
| une pose complète             | `/maj-skills:socle-monorepo` sur un dépôt vide avec api, web, tests, chaîne : `docs/adr/` ne contient que des `ADR_ALL_*` ; `pnpm check` vert ; `references-agent` vert |

## Vérification

`pnpm test` (les bancs ne lisent pas les ADR, mais `settings-json` et `references-agent` tournent sur le dépôt posé).

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`). Les fichiers de `socle-monorepo` sont déjà renommés dans la PR du grilling.
- 2026-11-10 — Ajout de l'architecte, sur le constat de la fille du ticket `2` : les appels `next-id.mjs ARC` et `next-id.mjs <TRI>` des SKILL.md sont à reprendre ici.
