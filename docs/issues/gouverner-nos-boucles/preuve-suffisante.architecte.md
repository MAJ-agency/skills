# Carte de l'architecte B — Anchorpost, la preuve suffisante

Carte de l'architecte B du programme « gouverner nos boucles », ouverte le 2026-11-19 selon la passation [`passation/2026-11-19-architecte-anchorpost.md`](passation/2026-11-19-architecte-anchorpost.md). La carte du programme, [`map.md`](map.md), reste à l'architecte A : rien n'y est écrit d'ici.

## Fiche

Phase: suivi — en attente de l'entrée « PASSATION AU COMPTE SUIVANT » de la carte du chantier (« la main est libre »)
Architecte: `session_01BxuG2zBnGe6UCP6cqG1F1E` (depuis le 2026-11-19, 08 h 52 UTC)
Objectif: mener le chantier `SPEC_ALL_ANC-5` (la preuve suffisante) jusqu'à sa livraison dans `develop`, puis la publication de la CLI 2.0.0.
Dépôts: `MAJ-agency/anchorpost` ; `MAJ-agency/skills` pour cette carte seule.
Source: la passation ci-dessus ; la carte du chantier, `docs/features/anchorpost/all/SPEC_ALL_ANC-5-preuve-suffisante.map.md`, branche `sujet/preuve-suffisante-cas` d'Anchorpost.
Capitaines: `skills` — `session_01BxuG2zz5bdN5uN8N7j4ztk` (depuis le 2026-11-19, 09 h 14 UTC, procédure d'un dépôt sans la chaîne) ; Anchorpost — aucun de ce compte encore.

## Chantiers

| Chantier | Dépôt | Spec | Conducteur | État |
| --- | --- | --- | --- | --- |
| La preuve suffisante | `MAJ-agency/anchorpost` | `SPEC_ALL_ANC-5` | aucun de ce compte encore | le premier compte finit #318 ; #316 entrée dans le sujet (`b3984ff`) |

## Décisions

- `A-200` — 2026-11-19. La reprise de main par la PR 133 de `skills` (ticket 4 de `capitaine-a-jour-et-teste`), demandée par le produit à l'ouverture de cette session, part dans une session de ticket lancée sur `skills`, et non dans la session de l'architecte. Raison : quatre fichiers en conflit, dont deux bancs ; l'architecte ne code pas. Version visée : 7.31.0, main étant en 7.30.0.

## Fog

- La PR 133 porte `Label: contre-revue` : la contre-relecture du sommet repris se fait par un sous-agent de l'architecte B avant l'ordre de fusion.

## Coût

| Session | Rôle | Relevé |
| --- | --- | --- |
| `session_01BxuG2zBnGe6UCP6cqG1F1E` | architecte B | 0,24 $ à 08 h 54 UTC le 2026-11-19 |
| `session_01BxuG32z1RUgo3HduKXzDCG` | ticket, `skills` PR 133 | lancée à 08 h 55 UTC |
| `session_01BxuG2zz5bdN5uN8N7j4ztk` | capitaine de `skills` | lancée à 09 h 14 UTC |

## Passation

Rien encore.

## Journal

- 2026-11-19, 08 h 55 UTC — carte ouverte. Plugin chargé et marketplace en 7.30.0, pas d'écart. Carte du chantier lue au sommet `b3984ff` de `sujet/preuve-suffisante-cas` : pas d'entrée « PASSATION AU COMPTE SUIVANT » ; rien n'est engagé sur Anchorpost. Session de ticket `session_01BxuG32z1RUgo3HduKXzDCG` lancée sur `skills` pour la PR 133 (`A-200`), modèle `claude-fable-5-2`, mode « auto ».
- 2026-11-19, 09 h 05 UTC — la session de ticket a poussé la PR 133 au sommet `848bc6c15af53a0b629f52863f5b778531f41f70` (commit de merge de main `f58ccad`, plugin 7.31.0, 1072 tests annoncés) ; sommet et ascendance de main lus sur le dépôt. Contre-relecture du sommet lancée chez un sous-agent neuf.
- 2026-11-19, 09 h 14 UTC — le produit : « sinon lance toi une session capitaine de fusion ici ». Capitaine de `skills` lancé, `session_01BxuG2zz5bdN5uN8N7j4ztk`, prompt de `lancement.md` (7.30.0), procédure d'un dépôt sans la chaîne copiée entière, modèle `claude-fable-5-2`, mode « auto ». Un capitaine de l'autre compte peut tourner aussi sur `skills` : invérifiable d'ici.
- 2026-11-19, 09 h 20 UTC — le produit, à « veux-tu que j'arrête le capitaine de `skills` une fois la PR 133 fusionnée ? » : « oui ». À faire dès la fusion lue sur GitHub : archiver `session_01BxuG2zz5bdN5uN8N7j4ztk`.
- 2026-11-19, 09 h 20 UTC — contre-relecture de la PR 133 au sommet `848bc6c15af53a0b629f52863f5b778531f41f70` par un sous-agent neuf : aucun bloquant, 1072 tests rejoués verts, fusion de main sans perte d'un côté ni de l'autre. Lu sur GitHub avant l'ordre : `head.sha` égal, `mergeable_state` `clean`, quatre contrôles verts. Commentaire `à-fusionner au sommet 848bc6c…` écrit, label `à-fusionner` posé. Une PR 134 est apparue dans la file, sans label.
- 2026-11-19 — écarts de la contre-relecture laissés à un ticket de suite, à passer à l'architecte A par le produit (le plugin est son périmètre) : (1) `sujet.sh` prend le verrou avant ses contrôles sans effet (ascendance de `relancer`, arbre pas propre, checks en cours) : un commentaire « terminé » de plus par tour sur une PR qui n'avance pas ; (2) les trappes de `passer.sh` et de `sujet.sh` sont posées après `prendre_passage` : un TERM pendant la pose laisse un verrou vivant jusqu'à 90 minutes pour les autres capitaines ; (3) `fusionner/SKILL.md` dit qu'une PR sautée « revient au tour suivant », la boucle la range pour toute sa durée. Doutes : un verrou illisible arrête la boucle (sortie 3) quand toute autre lecture illisible est une pause ; `sujet.sh` passe le JSON entier de la PR en argument de `jq` (échec au-delà d'environ 128 Ko) ; `relancer` avec `CAPITAINE_ID` refuse désormais un brouillon ou une PR `fusion-bloquée` ; l'étape 3 de la note de version omet `--reprendre` après `--arreter`.
