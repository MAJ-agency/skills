# Déposer les trois specs dans leurs dépôts

Status: ready-for-human
Type: task
Blocked by: 1

Les trois specs écrites par le grilling vivent ici en attendant d'être déposées là où elles seront jouées. Un dépôt par PR, par la chaîne de chacun.

## Où

- `../anchorpost-cli-et-pivot-v2.spec.md` → `MAJ-agency/anchorpost`, `docs/features/anchorpost/` (le nom suit la nomenclature du dépôt au moment du dépôt ; après sa migration, `all/SPEC_ALL_ANC-2-cli-et-pivot-v2.spec.md`). Son ticket `.12` amende `ANC-6`, `ANC-13`, `ANC-14`, `ANC-19` et tranche la première question ouverte.
- `../refonte-fedora.spec.md` → `MAJ-agency/fedora`, `docs/features/platform/all/` ; **bloquée par la publication du paquet** (spec Anchorpost, tickets .01 à .10).
- `../refonte-iroki.spec.md` → `MAJ-agency/iroki-monorepo`, `docs/features/programme/all/` ; même blocage.

## Décisions

- L'ordre : Anchorpost d'abord (le paquet), puis Fedora (il migre avant d'être branché), puis Iroki.
- Chaque spec se découpe en tickets prêts pour agent par `/maj-skills:chantier` dans son dépôt ; ce ticket ne fait que déposer.

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`).
