# Déposer les trois specs dans leurs dépôts

Status: ready-for-human
Type: task
Blocked by: 1

Les trois specs écrites par le grilling vivent ici en attendant d'être déposées là où elles seront jouées. Un dépôt par PR, par la chaîne de chacun.

## Où

- `../anchorpost-cli-et-pivot-v2.spec.md` → `MAJ-agency/anchorpost`, `docs/features/anchorpost/` (le nom suit la nomenclature du dépôt au moment du dépôt ; après sa migration, `all/SPEC_ALL_ANC-4-cli-et-pivot-v2.spec.md`). **Fait** : `ANC-4-cli-et-pivot-v2.spec.md`, PR anchorpost #27. Son ticket `.12` amende `ANC-6`, `ANC-13`, `ANC-14`, `ANC-19` et tranche la première question ouverte.
- `../refonte-fedora.spec.md` → `MAJ-agency/fedora`, `docs/features/platform/all/` ; **bloquée par la publication du paquet** (spec Anchorpost, tickets .01 à .10).
- `../refonte-iroki.spec.md` → `MAJ-agency/iroki-monorepo`, `docs/features/programme/all/` ; même blocage.

## Décisions

- L'ordre : Anchorpost d'abord (le paquet), puis Fedora (il migre avant d'être branché), puis Iroki.
- Chaque spec se découpe en tickets prêts pour agent par `/maj-skills:chantier` dans son dépôt ; ce ticket ne fait que déposer.

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`).
- 2026-11-10 — Anchorpost : accord du produit relayé par le conducteur ; déposée par l'architecte du lot, PR `MAJ-agency/anchorpost#27` vers `develop` (squash `3891db5`), sous `docs/features/anchorpost/ANC-4-cli-et-pivot-v2.spec.md`. `ANC-3` était promis par la spec ANC-1 à sa V2 (signalé par l'architecte d'ANC-1) ; le générateur minimal est `ANC-1.07`, pas `ANC-1.03` ; `.01` attend la fusion d'`ANC-1.08`. Les index générés d'anchorpost ont été régénérés par son capitaine (un document ajouté change `anchorpost/anchorpost.json`). La copie `../anchorpost-cli-et-pivot-v2.spec.md` reçoit les mêmes corrections et renvoie à anchorpost. Fedora et Iroki : hors périmètre tant que le produit n'a pas reconfirmé ; le ticket reste `ready-for-human`.
- 2026-11-14 — Les specs `refonte-fedora.spec.md` et `refonte-iroki.spec.md` sont supprimées de ce dépôt à la demande du produit, qui les dit terminées ; elles restent lisibles dans l'historique git de `main`, jusqu'à la fusion de la PR 73 qui les supprime. Le statut de ce ticket n'a pas été changé.
