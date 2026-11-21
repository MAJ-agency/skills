# Tickets 67 à 70, tour unique de relecture (`P-65`)

Relu le 2026-11-21, de 20:36 à 21:25 UTC, par un agent neuf, en lecture seule. Branche de documentation `claude/hopeful-lovelace-ouk6tz` à `1edf860`, base `main` à `25a72c7` (plugin 7.38.0). Clones neufs de `https://github.com/MAJ-agency/skills`, Node 22.23.5, quatre cœurs, la machine partagée avec un autre agent (charge de 2,6 à 9,7).

**Verdict proposé : prêts après retouches.** Aucun bloquant. Trois constats à corriger, dont un qui demande d'abord une sonde ou une décision de l'architecte, et quatre mineurs.

## 1. Le besoin

| Constat du rapport de la PR 146 | Ticket | Rejoué |
| --- | --- | --- |
| 13 (C11) | 68 (code), 69 (texte) | essai C11 : rouge sur `25a72c7`, vert sur l'arbre de la PR A |
| 14 (C12) | 68 | essai C12 : rouge, puis vert |
| 15 | 68 (décision), 69 (texte) | lecture ; banc « A-182 (2) » des deux scripts |
| 16 | 69 | lecture ; banc des textes |
| 17 | 67 (cause), 69 (texte) | « X15 » prolongé |
| 18 | 67 | « suite 66 — 18 » |
| R3 | 67 | essai R3 : rouge, puis vert |
| R4 | 69 | banc des textes |
| R5 | 67 (`--attendre`), 69 (borne de 9) | essais R5 : le premier reste vert (il lance la veille sans `--attendre`) ; le second, qui documentait l'absence de borne, devient rouge, la borne est là |
| R6 | 69 | mutations C1 et C2b, qui rejouent E1 et E2 du rapport |
| M4 d'`A-178` | 70 | F1 à F3 |
| commentaire de `trim()` | 70 | la commande de mesure rejouée : `9,a,b,c,d` |

Chaque mineur est porté une fois, avec un remède conforme au rapport. Rien d'autre n'est glissé : `git diff --stat` donne les onze fichiers des « Où » des tickets 67 à 69, et les quatre fichiers du ticket 70.

## 2. Les décisions

- `A-183`, point 1 (C12) : l'étiquette avant le commentaire, `relecteur.mjs` seul. Tenu (mutation B10).
- `A-183`, point 2 (la cause `couple` compte dans le remplacement unique) : tenu. Ma mutation G3, qui la sort du compte, est rouge.
- `A-183`, point 3 (C11 dans le doute : les lignes partent) : tenu (B3, B5, B6).
- `A-183`, point 4 (la quatrième forme) : tenu, mot pour mot.
- `A-183`, point 5 (un champ absent laisse `vivante` une session seulement attendue) : tenu dans le texte.
- `A-183`, point 6 (la marque la plus récente, `dernier`) : le code le fait, mais **aucun banc ne le tient**. Ma mutation G5, qui prend la date du dernier verdict, reste verte (constat 4).
- `A-182`, points 1, 2 et 4 (ce dernier amendé par `A-183`, point 4) : tenus.
- `A-180`, points 1, 2 et 5 : tenus. La borne de la durée vaut aussi pour la première pause de `--attendre` (A3), et la cause 17 ne change pas la règle d'installation.
- `A-84` et `A-118` : tenus, retrait après pose. `retirer_label` ne sort jamais en échec (`github.sh:749`), donc le retrait placé après le commentaire du plafond ne peut pas laisser de plafond à moitié écrit.
- `P-64` : voir le constat 3. Le texte de l'état `couple` peut, dans un environnement qui baisse l'effort rapporté, mettre en panne toute PR sensible.

Aucune contradiction avec une décision plus ancienne de la spec.

## 3. Ce que les tickets supposent de `main`

- **Le patch A** (`0bd773cb…`) : `git apply --check`, puis `git apply` sur un clone neuf à `25a72c7`. Il donne onze fichiers, +343 −55, et l'arbre `c0aa2ddfd07f1651e0da93d8dd97f5bcf77e252c`, celui que le ticket annonce.
- **Les trois diffs extraits des tickets**, appliqués l'un après l'autre sur un autre clone neuf, donnent le même arbre, `c0aa2dd`.
- **Le patch B** (`2657363b…`) :
  - il s'applique sur `25a72c7` (arbre `4fc42e6`) ;
  - il s'applique sur l'arbre de la PR A sans ses deux fichiers de version, et sur l'arbre de la PR A entier avec les `--exclude` du ticket 70 ;
  - le diff du ticket 70 est identique octet pour octet au patch.
- **Le patch A sur l'arbre de la PR B** échoue sur `plugin.json` et `NOTES-DE-VERSION.md`. Il passe avec les deux `--exclude`. Le ticket 67 ne donne pas ce repli (constat 1).
- **Repères de ligne**, tous vérifiés exacts sur `25a72c7` :
  - `relecteur.mjs` : 175, 182, 308 à 318, 314, 375, 378 et 384 ;
  - `relecteur/SKILL.md` (105 lignes) : 58, 66, 72, 78 et 94 ;
  - `scripts/relecteur.test.mjs` : 65 et 66 ;
  - `relecture/SKILL.md` : 104 ;
  - `prompt-regles.md` : 32 ;
  - `verdict.md` : 47 ;
  - `relecture.test.mjs` : 238 ;
  - `tickets.test.mjs` : 227.
- **Rouges avant, verts après** ([`essais/bancs.txt`](essais/bancs.txt)), exactement les cas nommés par les tickets :
  - ticket 67 : 4 rouges sur 37, puis 37 sur 37 ;
  - ticket 68 : 6 rouges sur 97, puis 97 sur 97 ;
  - ticket 69 : 2 rouges sur 9, puis 9 sur 9 ;
  - **12 rouges** en tout, comme annoncé.
  - Ticket 70 : 144 sur 144 avec `depot.test.mjs` et `tickets.test.mjs`.
- **Mutations** :
  - un échantillon de dix de `67-annexes/mutations.mjs` (A1, A3, A5, B3, B5, B8, B9, B10, B14, C2b) : 10 rouges sur 10 ([`mutations/echantillon-67-69.txt`](mutations/echantillon-67-69.txt)) ;
  - les sept du ticket 70 : 7 rouges sur 7 ([`mutations/ticket-70.txt`](mutations/ticket-70.txt)) ;
  - cinq à moi, sur la décision du ticket 68 ([`mutations/mutations-relecteur.mjs`](mutations/mutations-relecteur.mjs), [journal](mutations/journal-relecteur.txt)) : G1 à G4 rouges, **G5 verte**. G5 est rouge sous l'essai [`essais/essai-marque.snippet.mjs`](essais/essai-marque.snippet.mjs).
- **La suite entière**, `pnpm test` sur l'arbre de la PR A, commitée :
  - **1 289 sur 1 289**, aucun échec, sauté ni annulé ;
  - 14 min 31 s (`duration_ms` 870943), de 20:45:38 à 21:00:10 UTC ;
  - charge 2,57 au départ, 7,60 à la fin. Pendant une dizaine de minutes, une boucle d'attente de ma part a tourné à vide et a ajouté à la charge : la suite est verte malgré cela.
- **Essais du rapport rejoués** ([`essais/journal.txt`](essais/journal.txt)) : C11, C12 et R3 sont rouges sur `25a72c7` et verts sur l'arbre A, comme les tickets le disent.

## 4. Ce que jouera une session Sonnet

Les gestes sont donnés pas à pas : appliquer, rouge, vert, mutations, suite, livrer selon `Label: contre-revue`. La ligne « Ticket : » du prompt de lancement nomme la branche de documentation. Restent trois points ouverts, et les textes neufs du skill en laissent deux autres.

## Constats

| N° | Ticket | Gravité | Objet |
| --- | --- | --- | --- |
| 1 | 67 (§ 0) | à corriger | Si la PR du ticket 70 entre d'abord, `git apply` du patch A échoue sur les deux fichiers de version, et le ticket dit de « recopier les diffs ticket par ticket » (environ 700 lignes) alors que deux `--exclude` suffisent (vérifié) ; le ticket 70 a ce repli, le 67 non |
| 2 | 69 et 70 (§ 3) | à corriger | « La suivante de `main` au moment de livrer » : deux sessions lancées ensemble livrent toutes deux 7.38.1, et rien ne dit qui reprend la version, la note et le titre de la PR qui entre la seconde, ni par quel geste (jamais de push forcé ni de rebase) |
| 3 | 69 (décision 2), 68 | à corriger, après sonde | `couple` sur une session seulement attendue compare `session_context.effort_level` à `faits.effort`. Or `get_session` prévient qu'un effort peut être « abaissé, remplacé ou retiré » par l'organisation, le modèle ou l'environnement. Si le niveau rapporté est celui qui tourne, toute session sensible créée en `xhigh` et rapportée plus bas est lue `couple`, remplacée, puis sa remplaçante aussi : la panne, sur chaque PR sensible. Avant ce ticket, une session attendue n'était jamais jugée sur son couple |
| 4 | 68 | mineur | `A-183`, point 6 (la marque la plus récente, `dernier`) n'est tenu par aucun banc : la mutation G5 (date du dernier verdict) reste verte. L'essai `essai-marque` (une demande refaite sans push après la pose) la tue ; il est rouge sur `25a72c7` et vert sur l'arbre A |
| 5 | 69 | mineur | R5 n'est fermé que pour `VEILLE ARRÊTÉE`. Un `jouer` au premier plan sorti en 12 pendant un réveil renvoie aussi « au réveil suivant ». La veille relancée ensuite (puces `VEILLE GESTE` et `VEILLE FINIE`) part sans `--attendre`, sa première passe tombe aussitôt sur la même panne de quelques secondes, et c'est « la seconde fois » : le Relecteur s'arrête |
| 6 | 69 | mineur | « <son message> » (la ligne `send_message` en échec, la cause `create_session` en échec) n'a pas de forme. Les autres causes prennent « la dernière ligne » de la sortie d'erreur ; un message d'outil sur plusieurs lignes se recopierait tel quel |
| 7 | 67 | mineur, déjà là, hors périmètre | Le message d'usage de `relecteur.mjs` omet `--sondes`, que l'en-tête documente. Rien à faire dans cette PR |

## Retouches proposées

**Constat 1.** Ticket 67, « § 0 », remplacer :

> Si `main` est encore à `25a72c7`, `git apply <scratchpad>/ticket-67-68-69.patch` depuis la racine pose les trois tickets ; sinon, recopier les diffs ticket par ticket,

par :

> Si `main` est encore à `25a72c7`, `git apply <scratchpad>/ticket-67-68-69.patch` depuis la racine pose les trois tickets. Si `main` n'a bougé que par la PR du ticket 70 (`git diff --stat 25a72c7 origin/main` ne nomme que ses quatre fichiers), `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md <scratchpad>/ticket-67-68-69.patch`, puis la version et la note à la main, sur la suivante de `main` (ticket 69, décision 9), la note au-dessus de celle du ticket 70. Sinon, recopier les diffs ticket par ticket,

**Constat 2.** Ajouter à la fin du « § 3 — Livrer » des tickets 69 et 70 (pour le ticket 70, « l'autre PR » est celle des tickets 67 à 69) :

> Si l'autre PR de la suite du lot 4 entre dans `main` après ta livraison et avant la tienne, sur le message de l'architecte : `git fetch origin main && git merge origin/main` (jamais de rebase ni de push forcé). Résoudre `.claude-plugin/plugin.json` sur la version de `main` plus un au troisième nombre, et `NOTES-DE-VERSION.md` en gardant les deux notes, la tienne au-dessus, renumérotée, à la date du jour. Puis `node --test scripts/depot.test.mjs`, un commit, un push, le titre de la PR à la nouvelle version, et un message à l'architecte avec le nouveau sommet.

Question à l'architecte : est-ce la session qui reprend, ou lui ? Recommandation : la session, sur son message, puisqu'elle connaît sa branche ; ou bien lancer les deux PR l'une après l'autre, ce qui rend la phrase inutile.

**Constat 3.** D'abord une sonde, avant le lancement : `create_session` en `effort` `xhigh` dans l'environnement du Relecteur, puis `get_session` sur elle. Si `session_context.effort_level` vaut `xhigh`, le risque est théorique : le noter dans « Ce qui n'a pas été établi » du ticket 69, sans autre retouche. S'il vaut autre chose, choisir l'une des deux voies :

- (a) Le texte : dans « L'état des sessions », après « …un champ absent la laisse `vivante`, et elle ne s'écrit jamais `morte` pour son couple. », ajouter : « Une session que tu as créée au couple de `faits` de ce tour et dont le couple n'a pas changé depuis reste `vivante`, quel que soit l'effort que `get_session` rapporte. » Cela suppose que le Relecteur se souvienne de ses créations : c'est la conversation, pas un fichier. Un Relecteur neuf remplace au plus une fois.
- (b) Le code (ticket 68) : `passe` rend aussi le couple de l'autre clé (`faits.autre`), et une session attendue n'est `couple` que si son `effort_level` est celui de `faits.autre`, c'est-à-dire la PR devenue sensible ou « double » que vise le constat 15. Un cas de banc de plus.

Recommandation : la sonde, puis (b) si elle montre l'écart. (b) se teste, (a) s'improvise.

**Constat 4** (mineur). Ajouter au banc du Relecteur, dans la section du ticket 68, le cas d'[`essais/essai-marque.snippet.mjs`](essais/essai-marque.snippet.mjs), recopié tel quel (le titre sans le préfixe « relecture — », par exemple « suite 66 — C11 : une marque plus récente que la pose… »), et G5 à la liste des mutations (B19). Le banc passe à 42 cas, et la suite entière à 1 290.

**Constat 5** (mineur). Dans « La veille », puces `VEILLE GESTE` et `VEILLE FINIE`, remplacer « puis relancer la veille » par « puis relancer la veille, avec `--attendre` si un geste de ce réveil a rendu une suite « rejouer au réveil suivant » ». Le banc des textes l'exige dans les deux puces.

**Constat 6** (mineur). Dans « Les lignes », écrire « <sa dernière ligne non vide> » à la place de « <son message> », aux deux endroits, et dans la décision 4 du ticket 69.

## Questions à l'architecte

1. Le constat 2 : qui reprend la version de la PR qui entre la seconde ? Recommandation : la session, sur son message ; ou bien un lancement l'une après l'autre.
2. Le constat 3 : la sonde de l'effort rapporté, puis (b) si elle montre l'écart. Recommandation : oui.
3. Les questions des tickets 68 et 69, déjà tranchées par `A-183` : aucune objection.

## Comptes

- Bancs : 12 rouges avant le code (4, 6 et 2), verts après (37, 97, 9) ; ticket 70 : 144 sur 144.
- Suite entière, arbre de la PR A : 1 289 sur 1 289, en 14 min 31 s.
- Mutations : 10 sur 10 de l'échantillon, 7 sur 7 du ticket 70, 4 sur 5 des miennes (G5 verte ; rouge sous mon essai).
- Essais du rapport : C11, C12 et R3 rouges sur `25a72c7` et verts sur A. R5 : le premier essai reste vert partout ; le second, vert sur `25a72c7`, devient rouge sur A (le défaut qu'il documentait est fermé).
- Arbres : le patch A et les trois diffs donnent `c0aa2dd` ; le patch B donne `4fc42e6`.
- Temps : environ 50 minutes.
