# Le conducteur apprend ce qu'une PR attend de lui par une ligne, à l'instant ; il ne s'abonne à aucune PR, et le skill le dit

Status: ready-for-agent
Type: défaut
Modèle: sonnet — du texte dans `chantier/SKILL.md` et un banc de texte ; rien à coder ; la règle est la décision `A-233`, l'ordre d'un tour celle d'`A-241` (1). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 102
Dépendances: —
Fichiers chauds: `skills/chaine/chantier/SKILL.md` (§ 5, ligne 82 ; § 6, entre les lignes 89 et 90 ; « Ne jamais », lignes 126 à 136) ; `scripts/bascule.test.mjs` (un test neuf, après celui des lignes 76 à 123) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Une PR pour 104, 102 et 100, dans cet ordre, une seule montée de version** (ticket 104, « À faire », étape 6) : 104 touche `chantier/SKILL.md` aux lignes 67, 96, 98 et 102, 102 aux lignes 22, 86 à 94 et 134 (« Ne jamais »), et tous deux `scripts/bascule.test.mjs` ; ce ticket se joue sur leurs textes, d'où `Blocked by: 102`, et relit chaque ligne citée sur la branche, après eux. Aucun des tickets 93 à 99 ne touche ces fichiers, hors les deux fichiers de version.

## Le besoin

Constat (6) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 21 h 59 UTC, et l'entrée « Fin de l'essai réel du régime 8 »). Sur les PR #14 et #15 du jouet, les tours 1 ont été distribués à 21:53 et refusés à 21:56. Le conducteur a vu les distributions quatre minutes après, trop tard pour les gestes de l'essai : « le conducteur n'est pas réveillé par les commentaires de PR ». L'architecte s'est alors abonné lui-même aux deux PR pour les voir.

Le besoin : **le conducteur apprend un verdict, un refus, une contestation, une décision ou une note qui attend un geste de lui, sans attente active.** Ce que les outils permettent, et ce que la chaîne fait déjà, établis ci-dessous, ne demandent pas d'abonnement : il manque que le skill le dise, et qu'il dise d'agir à la ligne reçue, sans attendre le réveil suivant.

## Ce qui a été établi

**Les outils.**

- `send_message` arrive à la session visée comme un tour : une session au repos se réveille (c'est ce sur quoi repose déjà « Les messages des sessions de relecture » de `relecteur/SKILL.md`).
- `subscribe_pr_activity` livre à la session abonnée chaque événement de la PR (commentaires, revues, résultats de CI) comme un réveil. **Les événements d'une PR ne vont qu'à une session à la fois** : si une autre session est abonnée, l'appel réussit mais la session n'en reçoit aucun. Chaque événement est un tour, donc du contexte, CI comprise.
- `send_later` : le réveil de 45 minutes, déjà en place (`chantier/SKILL.md:82`, `:89`).

**Ce que la chaîne envoie déjà au conducteur** (sur `main` en 8.5.0, `b57eae7`) :

| Ce qui attend son geste | Comment il l'apprend |
| --- | --- |
| un verdict qui change l'étiquette (`à-reprendre`, `à-fusionner`), un plafond, une panne | une ligne du Relecteur, à la session de `Conducteur:` de la demande (`skills/chaine/fusionner/scripts/decision-relecteur.mjs:383-385`, `:397`, `:447` ; « Les lignes », `skills/chaine/relecteur/SKILL.md`, section « Les lignes ») ; sur ses propres PR, à la session de `Session:` |
| une contestation de sa fille (`Contesté — …`) | une ligne de la fille (`chaine-de-production.md:131`, étape 6) |
| une session de relecture remplacée au plafond | sur la PR d'une fille, une ligne du Relecteur au conducteur de la demande (`faits.conducteur`, `relecteur/SKILL.md`, table, geste `remplacer`) ; **sur ses propres PR (`Conducteur: —`), aucune** : la ligne ne va qu'à `faits.conducteur`, donc à personne ; il la lit dans la distribution (`Relecture — tour <k> — sommet <sha> — sessions <…> (remplace <id>)`) au réveil suivant, et rien n'est à décider |
| un arbitrage ou une décision de plafond sur sa propre PR | une ligne de l'architecte (`skills/chaine/architecte/SKILL.md:76`) |
| une demande modifiée, une note « Même contenu » | les lignes des tickets 96 et 94, en vol |
| une distribution (`Relecture — tour …`) | rien, et rien n'est à faire : elle n'attend aucun geste du conducteur |
| une réponse du capitaine (`SUJET EN CONFLIT`, `SUJET NON MIS À JOUR (sortie 3, aucun conflit)`, `PAS PROPRE`…) | une ligne du capitaine, **seulement en réponse** à la question du conducteur sur un sujet en retard (`chantier/SKILL.md` § 6, point 6) : le capitaine ne lui écrit jamais de lui-même |
| un renvoi du capitaine (`fusion-bloquée`) | la fille est prévenue ; le conducteur le voit à son réveil (§ 6, point 3). Le constat (4) (`renvoyer.sh` cherche l'auteur dans un arbre local, absent en cloud) est un ticket de la famille `fusionner`, hors de celui-ci |

Les quatre minutes de #14 et #15 sont celles d'une distribution, qui n'envoie aucune ligne : c'est voulu. Le refus de 21:56, lui, a envoyé ses lignes.

**Ce que disent les skills.** Aucun skill du plugin ne cite `subscribe_pr_activity` (`git grep` sur `main`, hors `docs/issues`). `chantier/SKILL.md:82` dit « **Pas d'attente active** » et le réveil de 45 minutes ; il ne dit pas que les lignes réveillent, ni qu'une ligne se traite au tour qu'elle ouvre.

## Quand le ticket est fait

1. `chantier/SKILL.md` § 6 a un point « Ce qui réveille le conducteur » : son réveil de 45 minutes, et les lignes des sessions (Relecteur, filles, architecte ; le capitaine, en réponse seulement). La table ci-dessus, en une phrase par ligne, celle de la session remplacée au plafond dite pour la PR d'une fille et pour ses propres PR.
2. Le même point dit : **une ligne reçue se traite dans le tour qu'elle ouvre**, et ce tour commence comme tout tour (point 0, ticket 102) : le gel d'abord, puis son propre contexte (le plafond), puis la ligne, lue à la source (les commentaires de la PR, jamais le texte de la ligne seul) ; puis le tour finit ; le réveil de 45 minutes reste armé tel quel.
3. Il dit pourquoi le conducteur ne s'abonne à aucune PR : chaque événement serait un tour (CI comprise), donc du contexte, contre son plafond (§ 6, point 1 bis) ; et un abonnement prend les événements de la PR à toute autre session.
4. « Ne jamais » a la ligne : « S'abonner aux événements d'une PR (`subscribe_pr_activity`) : les lignes des sessions le réveillent. »
5. Un banc de texte dans `scripts/bascule.test.mjs` tient les cas 1 à 4.
6. La note de version le dit en une ligne (une montée pour 104, 102 et 100 : ticket 104, « À faire », étape 6).

## Où

| Fichier (lignes sur `main` à `b57eae7`, plugin 8.5.0) | Ce qui change |
| --- | --- |
| `skills/chaine/chantier/SKILL.md:82` | « Pas d'attente active » renvoie au point neuf du § 6 |
| `skills/chaine/chantier/SKILL.md`, entre `:89` (0 bis) et `:90` (1) | le point neuf, « 0 ter. Ce qui le réveille » (cas 1 à 3). Ne pas renommer « 1 bis. **Plafonds.** » : `scripts/bascule.test.mjs:95` le cherche tel quel |
| `skills/chaine/chantier/SKILL.md:126-136` | la ligne de « Ne jamais » (cas 4) |
| `scripts/bascule.test.mjs` | un test neuf, sur le modèle de celui des lignes 76 à 123 (`entre`, `exiger`) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note, dans la montée de la PR (ticket 104) |

Règles à lire : `chantier/SKILL.md` § 6 ; `relecteur/SKILL.md`, « Les lignes ».

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-233`** et **`A-241`** (1) (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-233` — Le conducteur ne s'abonne à aucune PR ; il apprend par les lignes, et agit au tour qu'elles ouvrent.** Une distribution n'envoie pas de ligne et n'attend rien de lui. Raison : tout ce qui attend un geste de lui arrive déjà par une ligne (table ci-dessus) ; un abonnement ferait de chaque commentaire et de chaque résultat de CI un tour de plus, sur la session dont le contexte a déjà dépassé son plafond pendant l'essai (constat (12), ticket 102) ; et comme une PR ne livre ses événements qu'à une session, il prendrait la place d'une autre (l'architecte qui observe un essai). Ce qui manque est la phrase qui dit d'agir à la ligne reçue.
2. **Un trou de ligne se bouche à la source de la ligne, jamais par un abonnement** : le renvoi du capitaine (constat (4)) se corrige dans `renvoyer.sh`, au ticket de la famille `fusionner`.
3. **`A-241` (1) — Le tour ouvert par une ligne** commence par le gel et le contrôle du plafond (ticket 102, § 6, point 0), puis traite la ligne, lue à la source.
4. **L'architecte peut s'abonner à une PR pour observer un essai** : le skill `chantier` ne l'interdit qu'au conducteur. Rien n'est écrit pour l'architecte dans ce ticket.

## À faire, dans l'ordre

1. Sur la branche de la PR de 104, 102 et 100, le ticket 102 fait ; relire chaque ligne citée ici sur cette branche (104 et 102 ont changé le § 6 et « Ne jamais »).
2. Écrire le test neuf de `scripts/bascule.test.mjs`, le voir rouge : `node --test scripts/bascule.test.mjs`.
3. Écrire les trois passages de `chantier/SKILL.md`. Le fichier reste sous deux cents lignes.
4. Le banc vert, les mutations ; la version et la note, une fois pour les trois tickets (ticket 104, « À faire », étape 6) ; la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| le § 6 dit ce qui réveille le conducteur (réveil, lignes) | `scripts/bascule.test.mjs`, test neuf ; mutation M1 |
| une ligne se traite au tour qu'elle ouvre, après le gel et le plafond, à la source | le même test ; M2, M5 |
| aucun abonnement, avec sa raison (contexte, une session par PR) | le même test ; M3 |
| « Ne jamais » interdit `subscribe_pr_activity` au conducteur | le même test ; M4 |
| les assertions d'avant tiennent (« 1 bis. **Plafonds.** » non renommé) | `scripts/bascule.test.mjs`, test des lignes 76 à 123 |

## Mutations

Toutes rouges sous le test neuf :

- M1 : le point « Ce qui réveille le conducteur » retiré.
- M2 : « dans le tour qu'elle ouvre » remplacé par « au réveil suivant ».
- M3 : la raison du refus d'abonnement retirée (la phrase sans « contexte »).
- M4 : la ligne de « Ne jamais » retirée.
- M5 : « la ligne, lue à la source » placée avant le gel et le contexte.

## Vérification

1. `node --test scripts/bascule.test.mjs` : rouge avant le texte (le test neuf), vert après.
2. `wc -l skills/chaine/chantier/SKILL.md` : moins de deux cents lignes.
3. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **Le poids d'un abonnement** : combien d'événements une PR du jouet aurait livrés (commentaires et jobs de CI). Non mesuré ; la décision tient sans le chiffre, puisque rien ne manque aux lignes.
- **Si une session abonnée reçoit ses propres commentaires.** Non joué.

## Hors périmètre

- Le constat (4) (`renvoyer.sh`, famille `fusionner`).
- Les lignes des tickets 94 et 96 (famille relecture).
- Le contrôle du plafond à chaque tour : ticket 102.

## Comments
