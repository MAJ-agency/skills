# SPEC_ALL_ANC-5 — La preuve suffisante : criticité, cas attendus, état « partielle »

> **Copie de lecture.** Le fichier qui fait foi est `docs/features/anchorpost/all/SPEC_ALL_ANC-5-preuve-suffisante.spec.md` du dépôt `MAJ-agency/anchorpost` (branche `claude/ecstatic-brahmagupta-bg4l0s`, commit `10dc74c`, en attendant son entrée dans `develop`). Copie du 2026-11-13.

Sujet: sujet/preuve-suffisante
Règles: RULE_ALL_ANC-6, RULE_ALL_ANC-9, RULE_ALL_ANC-24, RULE_ALL_ANC-25, RULE_ALL_ANC-26, RULE_ALL_ANC-27, RULE_ALL_ANC-28, RULE_ALL_ANC-29

> Date : 2026-11-13 — Statut : écrite par l'architecte du programme « gouverner nos boucles », **validée par le produit le 2026-11-13**, pas encore découpée. Origine : la carte du programme (dépôt `MAJ-agency/skills`, branche `claude/compassionate-euler-st84s9`, `docs/issues/gouverner-nos-boucles/map.md`), décisions du produit `P-6` à `P-8` et `P-11` à `P-18`, décisions de l'architecte `A-19` à `A-29`. Une copie de lecture vit dans `skills`, `docs/issues/standard-documentation/preuve-suffisante.spec.md` ; ce fichier fait foi. Faits relevés sur `develop` (`e8c3857`) et sur `main` de `skills` (plugin 5.0.0).

## Ce qu'on construit

Aujourd'hui, une règle est « prouvée » dès qu'un seul test porte son identifiant (`apps/cli/src/build/realisation.ts`, `realisationOf`) : 20 règles sur 23 le sont, avec de 1 à 22 preuves chacune, sans que rien ne dise si c'est assez. On écrit donc l'attendu sur la règle, pour que la machine le compare à l'observé.

- Chaque règle porte une **criticité**, fixée par la MOA sur un **parcours** ou sur la règle seule (`RULE_ALL_ANC-24`, `RULE_ALL_ANC-25`).
- Chaque règle déclare ses **cas attendus** dans son fichier, et une preuve nomme le cas qu'elle prouve (`RULE_ALL_ANC-26`, `RULE_ALL_ANC-27`).
- La réalisation gagne l'état **« partielle »** entre « à construire » et « prouvée » (`RULE_ALL_ANC-6` et `RULE_ALL_ANC-9`, amendées, § 6).
- Ce qu'une règle doit prouver dépend de sa criticité (`RULE_ALL_ANC-28`), et la solidité de ses tests se mesure à une cadence qui en dépend aussi (`RULE_ALL_ANC-29`).
- À chaque PR, un rapport dit quelles règles elle touche, leur criticité, leurs cas prouvés et ce qui manque ; d'abord pour information, puis en refus.

Jamais un nombre de tests exigé, jamais un objectif global de couverture, jamais de seuil chiffré de mutation avant la première mesure.

## Décisions

Les décisions du produit sont dans la carte du programme, `## Decisions-so-far` : `P-6` (qui vérifie selon la criticité), `P-7` (les cas dans le fichier de règle), `P-8` et `P-11` (le parcours), `P-12` (« prouvée » change de sens), `P-13` (cas métier, cas technique), `P-14` (cadence du contrôle de solidité), `P-15` (« à classer »), `P-16` (règle basse), `P-17` (ce qu'Anchorpost montre), `P-18` (« prouvée » veut dire « assez testée pour sa criticité » : un cas n'est prouvé qu'avec la preuve du niveau exigé, § 2). Les décisions de l'architecte, choix techniques sans effet sur ce que voit un utilisateur :

- `A-19` — **Un parcours se déclare dans le manifeste, sous son module** (`epics[].journeys[]`). Un projet sans module déclaré déclare ses modules avant son premier parcours.
- `A-20` — **Le pivot passe en version 3, la CLI en 2.0.0.** C'est l'application d'`ADR_ALL_ARC-15` (« un changement non compatible du pivot est une version majeure du paquet et une nouvelle valeur de `schema` ») : `proven` change de sens et `partial` est une valeur qu'un lecteur de la version 2 refuse. Le service lit les versions 1, 2 et 3, comme il lit déjà la 1 et la 2 (carte de `SPEC_ALL_ANC-4`, `A-24`) : une fonction pure de `packages/schema` convertit un index 2 en index 3, et une règle `proven` sans cas déclaré y devient `partial`. « Prouvée » n'a ainsi qu'un sens dans tout ce qu'Anchorpost affiche.
- `A-21` — **Le plancher garde ce qu'il gardait.** `contexts[].floor` devient `{ date, proven, partial }` : `proven` compte les règles prouvées au sens nouveau, `partial` celles qui ont au moins une preuve sans être prouvées. `check` refuse si `proven` passe sous `floor.proven`, ou si `proven + partial` passe sous `floor.proven + floor.partial`. À la migration d'Anchorpost, `{ proven: 20 }` devient `{ proven: 0, partial: 20 }`, puis `proven` se relève à la main, règle après règle.
- `A-22` — **Un projet passe du constat au refus par une clé du manifeste**, `sufficiency`, qui vaut `observe` (par défaut) ou `enforce`. En `observe`, tout écart de la preuve suffisante est un avertissement ; en `enforce`, les écarts du § 5 marqués « refus » refusent. C'est la forme de « avertissement pendant la migration, puis refus » (`P-15`). La date du passage est une décision du produit, projet par projet.
- `A-23` — **Ce qui se juge par rapport à un état précédent vit dans une commande nouvelle, `anchorpost compare`**, pas dans `check`. `check` ne lit pas git et n'a pas de base ; le refus d'un changement de criticité sans nouvelle validation (`P-15`) et celui d'un cas métier ajouté sans nouvelle validation (`P-13`) comparent deux index. L'index étant commis (`RULE_ALL_ANC-20`), l'index de base se lit par `git show <base>:anchorpost/anchorpost.json`, sans rien recalculer.
- `A-24` — **Une PR touche une règle** quand elle modifie le fichier de la règle, un fichier de son `code`, ou un fichier de test qui porte son étiquette. Rien d'autre : une spec ou un ticket qui la cite ne la touche pas.
- `A-25` — **Le gate ne juge que ce qu'il calcule exactement.** Il vérifie le niveau des preuves (frontière de l'API, bout en bout). Qu'un dépôt de données soit prouvé sur base réelle ou un invariant chiffré par une propriété reste un critère de la revue de ticket (`T3`, réécrit) : la nature du code ne se déduit pas sûrement d'un chemin.
- `A-26` — **Une mesure de solidité ne vit ni dans l'index ni dans le dépôt.** L'index ne porte rien de vivant (`RULE_ALL_ANC-19`) et `develop` refuse un push direct. Le workflow publie la mesure, datée, en artefact et dans le résumé du job ; le passage suivant relit l'artefact précédent pour dire une baisse. La justification d'une altération qui survit s'écrit dans le code, par le commentaire de désactivation de Stryker, avec sa raison.
- `A-27` — **Le chantier 1 du programme devient la première tranche de celui-ci** (renseigner `code`, installer Stryker, publier la première mesure). Même dépôt, même sujet, et la tranche 4 en dépend. La PR 113, qui le bloquait, est fusionnée (`0d43cf2`).
- `A-28` — **Un cas a cinq champs** : `id`, `title`, `kind`, `scope`, et `family`, facultatif (§ 1).
- `A-29` — **La part de `skills` (§ 8) ne passe pas par le conducteur de ce chantier** : `skills` n'a pas de conducteur (`P-4`), l'architecte y lance les sessions de ticket et son capitaine fusionne. Une session créée par une autre ne reçoit qu'un dépôt (`A-5`).

## 1. Ce qu'un dépôt écrit

**Dans l'en-tête d'une règle** (schéma strict de `packages/schema`, version 3), trois clés nouvelles :

```yaml
criticality: high # low | medium | high ; clé absente : la règle ne reçoit rien de son fichier
cases:
  - id: nominal # minuscules, chiffres et tirets ; unique dans la règle
    title: Un membre invité par lien magique rejoint l'espace
    kind: nominal # nominal | edge | invalid | refusal
    scope: business # business | technical
  - id: lien-expire
    title: Un lien expiré est refusé
    kind: refusal
    scope: business
    family: time # facultatif : l'une des dix familles
notApplicableFamilies:
  - { family: volume, reason: "Un espace n'a qu'une poignée d'invitations en cours." }
```

Les dix familles (`RULE_ALL_ANC-28`) s'écrivent `limits`, `empty`, `invalid-input`, `duplicate`, `ordering`, `time`, `permissions`, `rare-state`, `volume`, `failure`. Un cas `kind: invalid` répond d'office à la famille `invalid-input`.

**Dans le manifeste**, sous un module, et à la racine :

```json
{
  "sufficiency": "observe",
  "epics": [
    {
      "id": "membres",
      "name": "Membres",
      "domains": ["ANC"],
      "journeys": [
        {
          "id": "invitation",
          "name": "Inviter un membre",
          "criticality": "high",
          "features": ["SPEC_ALL_ANC-1"],
          "validation": { "date": "2026-11-20", "by": "Guillaume Jauffret" }
        }
      ]
    }
  ]
}
```

Un parcours appartient au module qui le déclare ; ses `features` sont des identifiants de spec, de ce module ou d'un autre (`RULE_ALL_ANC-25`). Sa criticité porte sa propre validation, datée et nommée, comme une règle.

**Dans un test**, l'étiquette de cas : `[RULE_ALL_ANC-3#lien-expire]` en tête du titre. L'étiquette sans `#` reste valable : elle prouve la règle sans prouver de cas. Dans un fichier `cas/*.json`, chaque entrée peut porter `cas`, l'identifiant du cas qu'elle prouve.

## 2. Ce que la CLI calcule

**La criticité d'une règle** : la plus haute entre celle de son fichier et celles des parcours dont une feature la déclare en `Règles:` (dans sa spec ou l'un de ses tickets : la même lecture que le rattachement d'une règle à un module, `SPEC_ALL_ANC-4.49`). L'index dit le niveau, d'où il vient (`declared`, `journey`) et par quels parcours. Sans aucune des deux, la règle est « à classer » : l'index n'écrit pas de niveau.

**Un cas est prouvé** quand une preuve au moins porte son étiquette et que le niveau exigé par la criticité de la règle est là (`RULE_ALL_ANC-28`) :

| Criticité de la règle | Cas `nominal`             | Cas `edge` | Cas `invalid` ou `refusal`        |
| --------------------- | ------------------------- | ---------- | --------------------------------- |
| basse, ou à classer   | une preuve                | une preuve | une preuve                        |
| moyenne               | une preuve                | une preuve | une preuve de niveau `P1` ou `P2` |
| haute                 | une preuve de niveau `P2` | une preuve | une preuve de niveau `P1` ou `P2` |

`P1` est la frontière de l'API, `P2` le bout en bout : les niveaux que la CLI déduit déjà du chemin du fichier (`SPEC_ALL_ANC-4` § 2).

**La réalisation d'une règle**, dans cet ordre :

1. `exception.status` écrit dans l'en-tête : inchangé.
2. Aucune preuve, ni en propre ni héritée : `configured` si `config` n'est pas vide, sinon `to-build`. Des cas déclarés n'y changent rien.
3. Au moins une preuve : `proven` si la règle déclare au moins un cas et que chacun est prouvé ; sinon `partial`. Une règle qui a des preuves et aucun cas déclaré est donc `partial`.

Une règle d'un contexte qui instancie une règle de socle (`instanceOf`) hérite de sa réalisation, cas compris, tant qu'elle n'a ni preuve, ni `config`, ni cas en propre.

**Les familles** : pour une règle haute, chaque famille a une réponse quand un cas la porte ou que `notApplicableFamilies` la nomme avec sa raison.

**Dans l'index, version 3** : `rules[].criticality` (niveau, origine, parcours), `rules[].cases[]` (les champs du cas, ses preuves, `proven`, et ce qui lui manque : `missing`), `rules[].proofs[].case`, `realisation.status` avec `partial`, `realisation.cases` (`declared`, `proven`), `epics[].journeys[]`, `contexts[].partial`, `project.sufficiency`. Clés et listes triées, aucun horodatage (`RULE_ALL_ANC-19`).

## 3. Ce que `check` refuse en plus

La liste de `check` reste fermée (`SPEC_ALL_ANC-4` § 7) ; cette version y ajoute, dans les groupes existants :

- **groupe 1** : une criticité, un genre, une famille ou une portée hors vocabulaire ; deux cas au même identifiant dans une règle ; un parcours sans `validation`, ou écrit dans un manifeste qui ne déclare aucun module ;
- **groupe 3** : une feature de parcours qui ne désigne aucune spec ;
- **groupe 6** : une étiquette de test qui nomme un cas que sa règle ne déclare pas ;
- **groupe 7** : le plancher, selon `A-21` ;
- **groupe 8** : une règle `validated` sans criticité, et une règle haute dont une famille n'a pas de réponse. Ces deux-là sont des avertissements en `observe`, des refus en `enforce`.

Santé, jamais un refus : une règle `validated` qui ne déclare aucun cas ; un `code` vide sur une règle qui a des preuves ; une famille sans réponse sur une règle basse ou moyenne.

## 4. `anchorpost compare --base <ref>`

Commande nouvelle, et fonction de la bibliothèque. Elle lit l'index de la base (`A-23`), construit celui de l'arbre courant, lit la liste des fichiers changés (`git diff --name-only <base>...HEAD`), et rend un rapport en markdown, ou en JSON par `--json` :

- les règles que le changement touche (`A-24`), et pour chacune : sa criticité, sa réalisation avant et après, ses cas prouvés sur ses cas déclarés, les cas sans preuve et les niveaux qui manquent ;
- les règles, cas et parcours ajoutés, retirés ou modifiés ;
- les fichiers de `code` des règles hautes touchées : c'est le périmètre du contrôle de solidité de la PR (§ 7).

Elle sort en erreur, en `enforce` seulement, sur :

1. un cas attendu sans preuve, sur une règle touchée ;
2. un niveau exigé absent, sur une règle moyenne ou haute touchée ;
3. une criticité changée sur une règle `validated`, ou sur un parcours, sans que sa validation ait une date nouvelle (`RULE_ALL_ANC-24`) ;
4. un cas `scope: business` ajouté, retiré ou modifié sur une règle `validated` sans que sa validation ait une date nouvelle (`RULE_ALL_ANC-27`).

En `observe`, les mêmes constats sont écrits au rapport comme avertissements et la sortie est 0. Une « nouvelle validation » est une `validation.date` réécrite par un humain, avec une entrée `decisions` : la CLI compare les dates, elle ne juge pas qui a écrit.

## 5. Le rapport de PR et le gate

- **Le rapport** : un job de `ci.yml` joue `anchorpost compare --base origin/<branche de base>` et écrit le markdown dans le résumé du job. Aucune revue par un modèle en CI (`ADR_ALL_ARC-8`).
- **Le gate `preuves`** : le relais `scripts/verify/preuves.mjs`, posé par `socle-tests` (§ 8), joue la même commande au pre-push et en fin de tour (`gatesRapides`), avec la base choisie comme le fait déjà `coverage-diff`.
- **L'ordre** : d'abord le rapport en `observe`, sur un pilote de trois règles d'Anchorpost, une par criticité ; puis `enforce` sur Anchorpost, quand le produit le décide.

## 6. Les amendements aux règles d'Anchorpost (décision MOA `P-12`, 2026-11-13)

Chaque règle reçoit une entrée `decisions` datée et son énoncé amendé ; aucune n'est supprimée.

- **`RULE_ALL_ANC-6`** : la réalisation vaut `prouvée`, `partielle`, `configurée`, `à construire`, `sans objet`, `contradiction`. Une règle est « partielle » quand elle a au moins une preuve et qu'un de ses cas attendus n'est pas prouvé, ou qu'elle n'en déclare aucun ; « prouvée » quand chacun de ses cas attendus est prouvé.
- **`RULE_ALL_ANC-9`** : une preuve peut nommer le cas attendu qu'elle prouve (`RULE_ALL_ANC-26`).

Les six règles `RULE_ALL_ANC-24` à `RULE_ALL_ANC-29` sont déposées `candidate` avec cette spec : la MOA les valide en relisant la PR de specs.

## 7. Le contrôle de solidité, par criticité (`RULE_ALL_ANC-29`)

- **La première mesure d'abord** (`A-27`) : `code` renseigné dans l'en-tête des 20 règles qui ont des preuves (point de départ : les fichiers qu'importent leurs fichiers de preuve ; `check` refuse déjà un chemin absent, `apps/cli/src/check/targets.ts`) ; Stryker installé par le skill `socle-tests` (dépendance nouvelle : la ligne `Dépendances:` du ticket la prévoit) ; `mutation:regles` lancé une fois, sa synthèse par règle publiée. Aucun seuil avant cette mesure.
- **Chaque semaine** : le workflow `mutation.yml` du socle (`cron: '43 3 * * 0'`, sur la branche par défaut, `develop`), lancé par le planificateur de la CI, jamais par un agent. Il mesure le `code` de toutes les règles qui ont des preuves, publie la mesure datée (`A-26`), et signale une baisse sur une règle moyenne.
- **À chaque PR** : quand `anchorpost compare` rend des fichiers de `code` de règles hautes touchées, un job mute ces seuls fichiers et refuse une altération qui survit sans justification écrite.
- **La mesure périmée** : le job de PR lit la date du dernier passage hebdomadaire réussi et écrit un avertissement au rapport au-delà de huit jours. L'affichage « périmée » dans Anchorpost est au chantier suivant.
- **`ADR_ALL_ARC-17`**, à écrire par la tranche : il amende `ADR_ALL_ARC-7` (« jamais à chaque PR, jamais planifié ») pour le `code` des règles, et laisse le noyau critique à la demande.

## 8. Ce qui change dans `skills`

Tickets du dépôt `skills` (`A-29`), bloqués par la publication de la CLI 2.0.0 :

- **Le standard** : `docs/issues/standard-documentation/` reçoit la copie de cette spec ; le gabarit `skills/chaine/tickets/references/gabarits/regle.md` gagne `criticality`, `cases` et `notApplicableFamilies`.
- **`socle-tests`** : la grille par criticité dans le gabarit de `.claude/rules/tests.md` (elle n'y existe pas : une seule mention de `P0`, `P1`, `P2`, ligne 25) ; le relais `preuves.mjs` et son entrée dans `gatesRapides` ; `mutation-regles.mjs`, qui ne garde aujourd'hui que les règles `proven` (ligne 76), garde les règles `proven` et `partial` ; `mutation.yml` date sa mesure, relit la précédente, et le gabarit d'ADR de mutation suit `ADR_ALL_ARC-17`.
- **`tickets`** : le gate refuse un ticket `ready-for-agent` dont la ligne `Règles:` cite une règle sans criticité ou sans cas (en `enforce` ; avertissement en `observe`, et rien sans index) ; le tableau `## Surfaces` d'un ticket nomme, pour chaque cas attendu des règles citées, la preuve qui le portera.
- **`revue-de-ticket`** : le critère `T3` (`references/criteres-ticket.md`) ne dit plus « les cas de bord que la règle énonce » mais « chaque cas attendu de la règle a sa preuve, du genre que la nature du code impose » (`A-25`), et vérifie qu'un cas dit technique l'est bien (`RULE_ALL_ANC-27`).
- **Le skill `anchorpost`** : CLI 2.0.0 ou une suivante, et la fiche `.claude/rules/anchorpost.md` dit comment écrire une criticité, un cas, une étiquette de cas.

## 9. Le service Anchorpost, au minimum

- `packages/schema` : la version 3, la conversion de 2 en 3 (`A-20`).
- `packages/contracts` (`src/rule.ts`) : « partielle » rejoint les statuts de réalisation ; la criticité d'une règle (`basse`, `moyenne`, `haute`, « à classer »).
- `apps/api` : `v2-vocabulary.ts` et les mappers lisent la version 3.
- `apps/web` : le badge « partielle » et la criticité, sur la page d'une règle (`rule-page.tsx`) et dans le tableau des règles (`rule-table.tsx`).

## Les tranches, dans l'ordre

Le découpage en tickets est le travail du conducteur du chantier ; l'ordre et les dépendances sont ceux-ci.

| Tranche | Contenu                                                                                                                                                                            | Dépôt                      | Dépend de |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------- |
| 0       | Première mesure de solidité : `code` des 20 règles, Stryker, synthèse publiée (§ 7, premier point)                                                                                 | `anchorpost`               | —         |
| 1       | Pivot 3 et CLI 2.0.0 : schéma, calcul, `check`, plancher ; le service lit la version 3 ; Anchorpost migré ; règles amendées, glossaire ; pilote de trois règles, une par criticité | `anchorpost`               | —         |
| 2       | `anchorpost compare` et le rapport de PR, en `observe`                                                                                                                             | `anchorpost`               | 1         |
| 3       | La part de `skills` (§ 8), puis sa repose dans `anchorpost` ; passage d'Anchorpost en `enforce`, sur décision du produit                                                           | `skills`, `anchorpost`     | 2         |
| 4       | Contrôle de solidité par criticité : hebdomadaire, sur PR pour les règles hautes, mesure datée, `ADR_ALL_ARC-17`                                                                   | `anchorpost`, `skills`     | 0, 2      |
| 5       | Fedora et Iroki adoptent les deux champs, en `observe`                                                                                                                             | `fedora`, `iroki-monorepo` | 3         |

La tranche 5 se déroule dans les chantiers de refonte de ces deux dépôts : cette spec n'en porte pas les tickets.

**Le pilote** : trois règles d'Anchorpost, une basse, une moyenne, une haute, et un parcours au moins, ce qui demande de déclarer les modules d'Anchorpost dans son manifeste (`A-19`). Le conducteur propose les trois règles, leurs criticités et leurs cas ; la MOA les fixe (`RULE_ALL_ANC-24`).

## Vérification d'ensemble

- Les 20 règles aujourd'hui « prouvées » sortent « partielles » de la CLI 2.0.0, et `check` est vert avec le plancher `{ proven: 0, partial: 20 }`.
- Les trois règles du pilote sortent « prouvées », avec chacun de leurs cas porté par une preuve du niveau exigé.
- Sur une branche d'essai, retirer la preuve d'un cas d'une règle du pilote : le rapport de PR nomme la règle et le cas ; en `enforce`, `anchorpost compare` sort en erreur.
- Sur une branche d'essai, relever la criticité d'une règle validée sans toucher à sa validation : refus en `enforce`.
- Le passage hebdomadaire a eu lieu une fois sur `develop`, sa mesure porte sa date, et le rapport d'une PR la cite.

## Hors périmètre

- **Qui vérifie le code selon la criticité** (`P-6`) : le mécanisme de la revue que l'auteur ne contrôle pas et de la lecture par une personne nommée est au chantier 3 du programme. Cette spec lui donne ce qu'il lit : la criticité des règles qu'une PR touche (§ 4).
- **Ce qu'Anchorpost montre** (`P-17`) : le tableau des cas avec leurs preuves sur la page d'une règle, l'histoire d'une règle, la vue par PR, « qui a vérifié », l'affichage d'une mesure « périmée » sont au chantier 5. Ici, le service ne fait que lire la version 3 et montrer l'état et la criticité (§ 9).
- Un nombre de tests par règle, un objectif global de couverture, un seuil chiffré de mutation avant la première mesure.
- Une revue par un modèle en CI.
