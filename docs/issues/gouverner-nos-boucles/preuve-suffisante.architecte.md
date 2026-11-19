# Carte de l'architecte B — Anchorpost, la preuve suffisante

Carte de l'architecte B du programme « gouverner nos boucles », ouverte le 2026-11-19 selon la passation [`passation/2026-11-19-architecte-anchorpost.md`](passation/2026-11-19-architecte-anchorpost.md). La carte du programme, [`map.md`](map.md), reste à l'architecte A : rien n'y est écrit d'ici.

## Fiche

Phase: suivi — conducteur et capitaine de ce compte lancés le 2026-11-19 ; premier geste : la mise à jour du sujet avec `develop`, puis `.45`
Architecte: `session_01BxuG2zBnGe6UCP6cqG1F1E` (depuis le 2026-11-19, 08 h 52 UTC)
Objectif: mener le chantier `SPEC_ALL_ANC-5` (la preuve suffisante) jusqu'à sa livraison dans `develop`, puis la publication de la CLI 2.0.0.
Dépôts: `MAJ-agency/anchorpost` ; `MAJ-agency/skills` pour cette carte seule.
Source: la passation ci-dessus ; la carte du chantier, `docs/features/anchorpost/all/SPEC_ALL_ANC-5-preuve-suffisante.map.md`, branche `sujet/preuve-suffisante-cas` d'Anchorpost.
Capitaines: Anchorpost — `session_01BxuG32bZp5xNjwqVZ9U8Fo` (depuis le 2026-11-19, 09 h 44 UTC). `skills` — `session_01BxuG2zz5bdN5uN8N7j4ztk`, archivé le 2026-11-19 après la fusion de la PR 133.

## Chantiers

| Chantier | Dépôt | Spec | Conducteur | État |
| --- | --- | --- | --- | --- |
| La preuve suffisante | `MAJ-agency/anchorpost` | `SPEC_ALL_ANC-5` | `session_01BxuG2zwaHUkcBNJS6VVwiz` (depuis le 2026-11-19, 09 h 44 UTC) | 36 tickets faits sur 54 ; sujet en conflit avec `develop`, à mettre à jour d'abord |

## Décisions

- `A-200` — 2026-11-19. La reprise de main par la PR 133 de `skills` (ticket 4 de `capitaine-a-jour-et-teste`), demandée par le produit à l'ouverture de cette session, part dans une session de ticket lancée sur `skills`, et non dans la session de l'architecte. Raison : quatre fichiers en conflit, dont deux bancs ; l'architecte ne code pas. Version visée : 7.31.0, main étant en 7.30.0.

## Fog

- La PR 133 porte `Label: contre-revue` : la contre-relecture du sommet repris se fait par un sous-agent de l'architecte B avant l'ordre de fusion.

## Coût

| Session | Rôle | Relevé |
| --- | --- | --- |
| `session_01BxuG2zBnGe6UCP6cqG1F1E` | architecte B | 18,03 $, 261 991 tokens à 11 h 05 UTC le 2026-11-19 |
| `session_01BxuG32z1RUgo3HduKXzDCG` | ticket, `skills` PR 133 | 2,39 $, 132 163 tokens, archivée |
| `session_01BxuG2zz5bdN5uN8N7j4ztk` | capitaine de `skills` | 3,71 $, 151 810 tokens, archivé |
| `session_01BxuG32bZp5xNjwqVZ9U8Fo` | capitaine d'Anchorpost | 2,37 $, 136 260 tokens à 11 h 05 UTC |
| sous-agent | contre-relecture de la PR 133 | 321 089 tokens |

## Passation

Rien encore.

## Journal

- 2026-11-19, 08 h 55 UTC — carte ouverte. Plugin chargé et marketplace en 7.30.0, pas d'écart. Carte du chantier lue au sommet `b3984ff` de `sujet/preuve-suffisante-cas` : pas d'entrée « PASSATION AU COMPTE SUIVANT » ; rien n'est engagé sur Anchorpost. Session de ticket `session_01BxuG32z1RUgo3HduKXzDCG` lancée sur `skills` pour la PR 133 (`A-200`), modèle `claude-fable-5-2`, mode « auto ».
- 2026-11-19, 09 h 05 UTC — la session de ticket a poussé la PR 133 au sommet `848bc6c15af53a0b629f52863f5b778531f41f70` (commit de merge de main `f58ccad`, plugin 7.31.0, 1072 tests annoncés) ; sommet et ascendance de main lus sur le dépôt. Contre-relecture du sommet lancée chez un sous-agent neuf.
- 2026-11-19, 09 h 14 UTC — le produit : « sinon lance toi une session capitaine de fusion ici ». Capitaine de `skills` lancé, `session_01BxuG2zz5bdN5uN8N7j4ztk`, prompt de `lancement.md` (7.30.0), procédure d'un dépôt sans la chaîne copiée entière, modèle `claude-fable-5-2`, mode « auto ». Un capitaine de l'autre compte peut tourner aussi sur `skills` : invérifiable d'ici.
- 2026-11-19, 09 h 20 UTC — le produit, à « veux-tu que j'arrête le capitaine de `skills` une fois la PR 133 fusionnée ? » : « oui ». À faire dès la fusion lue sur GitHub : archiver `session_01BxuG2zz5bdN5uN8N7j4ztk`.
- 2026-11-19, 09 h 20 UTC — contre-relecture de la PR 133 au sommet `848bc6c15af53a0b629f52863f5b778531f41f70` par un sous-agent neuf : aucun bloquant, 1072 tests rejoués verts, fusion de main sans perte d'un côté ni de l'autre. Lu sur GitHub avant l'ordre : `head.sha` égal, `mergeable_state` `clean`, quatre contrôles verts. Commentaire `à-fusionner au sommet 848bc6c…` écrit, label `à-fusionner` posé. Une PR 134 est apparue dans la file, sans label.
- 2026-11-19 — écarts de la contre-relecture laissés à un ticket de suite, à passer à l'architecte A par le produit (le plugin est son périmètre) : (1) `sujet.sh` prend le verrou avant ses contrôles sans effet (ascendance de `relancer`, arbre pas propre, checks en cours) : un commentaire « terminé » de plus par tour sur une PR qui n'avance pas ; (2) les trappes de `passer.sh` et de `sujet.sh` sont posées après `prendre_passage` : un TERM pendant la pose laisse un verrou vivant jusqu'à 90 minutes pour les autres capitaines ; (3) `fusionner/SKILL.md` dit qu'une PR sautée « revient au tour suivant », la boucle la range pour toute sa durée. Doutes : un verrou illisible arrête la boucle (sortie 3) quand toute autre lecture illisible est une pause ; `sujet.sh` passe le JSON entier de la PR en argument de `jq` (échec au-delà d'environ 128 Ko) ; `relancer` avec `CAPITAINE_ID` refuse désormais un brouillon ou une PR `fusion-bloquée` ; l'étape 3 de la note de version omet `--reprendre` après `--arreter`.
- 2026-11-19, 09 h 43 UTC — PR 133 de `skills` fusionnée à 09 h 31 UTC (`a3c2a7c` sur main, plugin 7.31.0) : lu sur GitHub, arbre de main identique au sommet relu `848bc6c`. Capitaine de `skills` et session de ticket archivés (accord du produit de 09 h 20). Marketplace de cette session mis à jour en 7.31.0 ; `lancement.md` inchangé depuis 7.30.0.
- 2026-11-19, 09 h 44 UTC — entrée « PASSATION AU COMPTE SUIVANT … la main est libre » lue dans la carte du chantier au sommet `8082189` de `sujet/preuve-suffisante-cas`. Lancés sur Anchorpost, modèle `claude-fable-5-2`, mode « auto », gabarits de `lancement.md` : le capitaine `session_01BxuG32bZp5xNjwqVZ9U8Fo`, puis le conducteur `session_01BxuG2zwaHUkcBNJS6VVwiz` avec les consignes de `passation/2026-11-19-consignes-conducteur.md` dans sa ligne « Situation ». Un autre architecte de ce compte (programme « onglet-projet », `session_01BxuG33BUVsBFzQhEfvKWhV`) s'appuie sur le même capitaine et attend la livraison de la preuve suffisante dans `develop` pour la livraison 2 de la refonte « Registre » : à prévenir à cette livraison.
- 2026-11-19, 10 h 02 UTC — relevé. Capitaine d'Anchorpost et conducteur en vie, tous deux en plugin 7.31.0, quota `allowed`. Conducteur : 154 457 tokens et 2,71 $ (il s'estimait à 100 000 : son estime retarde, relève prévue à 280 000). Fille de mise à jour du sujet : `session_01BxuG33KTiAmyYJEAhaDokf`. `A-130` du conducteur, acceptée : la fusion de `develop` dans le sujet compile rouge sans conflit de texte (`list-space-defects.use-case.spec.ts`, types `v2.Feature` de `develop` contre `v3` du sujet) ; une PR préalable directe vers `develop`, #320, ne touche que ce fichier de test, sans changer d'assertion, et entre par le capitaine en `prio:haute` ; la mise à jour du sujet se refait ensuite. `.45` part après.
- 2026-11-19, 10 h 35 UTC — #320 fusionnée dans `develop` (`e323464`), puis #321, la mise à jour du sujet avec `develop`, entrée dans `sujet/preuve-suffisante-cas` (`258aa4d`) : lu sur le dépôt, `develop` n'a plus aucun commit absent du sujet. Preuves 586 → 589 selon la vérification bornée du conducteur. La mention « agent » d'une criticité : gardée telle que le sujet l'a livrée ; lu à la source, elle n'est jamais rendue à côté de « à classer » (les deux appelants de `criticality-badge.tsx` ne la posent que sur un niveau fixé par un agent) ; l'architecte de « onglet-projet » la porte dans ses planches de la livraison 2 (#319), aucun ticket chez nous. Suite : `.45`.
- 2026-11-19, 10 h 38 UTC — fille de la mise à jour du sujet (`session_01BxuG33KTiAmyYJEAhaDokf`, 6,72 $, 194 729 tokens, comptée dans la carte du chantier) archivée (`P-62`). Deux filles lancées par le conducteur à 10 h 35 : `.45` (`session_01BxuG343cWNFV8Tu9hc9xdr`) et `.53` (`session_01BxuG2z3tFgbZ8SQpqcr3ma`, scanner, porte aussi la limite `A-127` au README de la CLI). Les deux sont `Label: contre-revue` : contre-revue par sous-agent neuf du conducteur, puis lecture et accord de l'architecte avant tout label. `.54`, `.46`, `.38`, `.19` attendent `.45`.
- 2026-11-19, 11 h 05 UTC — relevé. Capitaine d'Anchorpost : en vie, connecté, file vide, quota `allowed`. Conducteur : 186 368 tokens, 5,16 $, au repos depuis 10 h 38, réveil armé par lui à 11 h 21 ; `connection_status` `disconnected` alors qu'aucun tour n'est ouvert (au repos, pas en plein tour) : à relire après 11 h 21 avant de le dire coupé.
