# Rapport du rédacteur — spec d'essai du régime 8 sur `essai-relecture-8`

**Version 2, après les décisions de l'architecte (`A-204`).** Base : `develop` d'`essai-relecture-8` à `9a5e7280ace3771fa2efbdfc84fd75aa87a15fff` (la PR 1 ; même arbre `76accbce…` que `ee8d013`, vérifié). Branche locale `docs/essai-regime-8` du clone `<jouet>` (l'ancienne, partie de `ee8d013`, renommée `docs/essai-regime-8-v1` ; son patch sous `v1/`). Rien poussé, rien écrit sur GitHub.

| Patch | Commit | sha256 |
| --- | --- | --- |
| `cadrage-1-paquet.patch` (sur `develop`) | `beae685` `feat(essai): le paquet à juger…` — 8 fichiers : `packages/essai/`, `pnpm-lock.yaml` | `a8d4f19fb98d301183061f757f47c26132209f832465d88b5fc157843d70657d` |
| `cadrage-2-documentation.patch` (sur le premier) | `b4a4627` `docs(essai): la règle du partage, la spec et les tickets…` — 14 fichiers, tous `.md` | `00801b4d698a5dd4a9c6f5b4f562647755ed58ed9c2b21ae1622be6dd03ddd5d` |

`SHA256SUMS` les redit. Appliqués par `git am`, l'un après l'autre, sur un clone neuf de `develop` : arbres `d3e30547…` puis `b08ca82f…`, ceux des deux commits de la branche.

## Les décisions reçues (`A-204`) et ce qui a changé

1. Défauts plantés hors des tickets : gardés ainsi (lignes de situation particulière, `gestes-de-l-architecte.md`).
2. Cas 9 : `SPEC_ALL_ESS-1.04` récrit, « Prouver le partage du plus grand entier sûr » : `Règles: —`, plus de `Relecture: double`, sa livraison ne touche que `split.test.mjs` (un test, « partage le plus grand entier sûr sans perdre de centime »). Le second push, deux lignes de commentaire dans `split.mjs` sur le message du conducteur, est dans la ligne de situation de son lancement, avec la phrase à mettre au corps de la PR (T4 admet un fichier hors de « Où » « justifié dans la PR »). Spec et carte suivent (titre, `## Fog` vidé). **Ce que cela donnera, et pourquoi pas `(complète)`** : plus bas, question 1.
3. Cas 7, seconde moitié : la forme exacte du verdict d'essai de l'architecte est dans `gestes-de-l-architecte.md` ; son corps dit qu'il est un verdict d'essai et que la relecture n'a pas tourné, `/security-review` comprise, malgré l'en-tête `lancée` (sans elle, une PR sensible compte le verdict `incomplet`, et la garde du capitaine ne serait pas atteinte).
4. Cas 15 : retiré de l'essai réel, laissé aux bancs ; la raison est écrite dans `gestes-de-l-architecte.md` et ci-dessous.
5. Cas 10 : deux PR de cadrage, deux patchs (ci-dessus) ; la carte (`A-1`) le dit.
6. Le banc de durée `regles.test.mjs:1594` : noté pour le ticket 91, rien touché.

**Le gate relève-t-il l'absence de `Règles:` sur `.04` ?** Non : « tickets : OK — 11 tickets » (`Règles:` est facultative, et `—` admis ; la règle 14 ne joue que pour un ticket qui cite une règle haute). **La revue** n'a pas été jouée (elle demande des sessions de relecture). Lue sur ses critères : l'axe Ticket (`T3`) ne relit que les règles de la ligne `Règles:`, ici aucune ; aucun critère des axes Tickets (`K1` à `K6`) ou Règles métier (`M1` à `M4`, d'ailleurs muets sans index au pivot 3) n'exige qu'un ticket qui ajoute un test étiqueté `[RULE_ALL_PAR-1]` cite la règle. Le seul angle est `S7` (axe Règles) : le test porte l'étiquette d'une règle qu'il prouve bien, donc pas d'écart. Une session peut en faire un doute ; un bloquant serait une trouvaille hors liste. Le ticket dit sa raison (« il ne change ni le code ni l'énoncé de `RULE_ALL_PAR-1` »), pour ne pas tomber sous `K3`.

## Choix faits

- **Le code entre avec le cadrage**, en deux PR vers le sujet (`A-204` point 5) : le paquet d'abord, puis la documentation seule (cas 10). Chaque ticket est un cas, aucun ne pose le terrain des autres, et la vague 1 part dès le second cadrage fusionné.
- **Les défauts plantés (cas 1 et 17) ne sont pas dans les tickets** (accepté, `A-204` point 1) : `contexte-ticket.mjs` rend **le ticket entier** à l'axe Ticket (son en-tête, ligne 8), et l'axe Tickets relit tous les tickets au cadrage. Écrit dans le ticket, le défaut serait lu par la session qui doit le trouver, et le cas 17 (`P-64`) ne mesurerait plus rien. Les tickets décrivent le contrat juste ; leur section `## L'essai` renvoie à « la ligne de situation particulière du message de lancement », et ces deux lignes (avec, pour le 17, le code entier à recopier) sont dans `gestes-de-l-architecte.md`. Question 1.
- **Le cas 17 adapte quatre défauts réels** dans un module neuf, `scripts/chaine/gestes-essai.mjs` (sensible, couvert par `P-66`), chacun contraire à une décision écrite du ticket : D1, A-162 constat 3 (un fichier ni code ni `.md` sans axe) ; D2, A-162 constat 7 (un retrait « venu de develop » par son seul texte) ; D3, A-176 B1 (`a.return / 2` lu comme une regex) ; D4, A-190 constat 1 (le fichier d'arrêt retiré après la préparation). Le banc fourni est vert sur le module fautif (4 sur 4) et sur le corrigé (4 sur 4) ; chaque défaut est montré par une sonde (`cas-17/`). Les défauts de `gestes.sh` et `tranches.mjs` ne vivent pas dans un projet, et revenir sur R1/R3 de `veille.sh` du jouet aurait rougi `veille.test.mjs` au pre-push (ou demandé d'en retirer les tests, ce qui désigne le défaut).
- **Les cas 8 et 22 se jouent sur la PR du 17** : la fille corrige un bloquant par tour ; avec quatre trouvés, le plafond tombe au tour 3, la décision de plafond de l'architecte ouvre le tour 4.
- **Le cas 18** conteste `S10` (lecture de `process.env` hors d'un schéma de configuration) : critère que l'axe Règles applique sans lire le ticket, et que la décision du ticket rend contestable (`S10` renvoie à `apps/api/CLAUDE.md`, absent ; la variable est dans `.env.example`).
- **Le cas 7** : la ligne `Sensibles:` du ticket couvre `scripts/agent/**` (`P-66`), la fille tente `.github/workflows/pr-titre.yml` (hors ligne, dans le périmètre de `P-66`) ; la garde des commandes ne lit pas les chemins sensibles, l'écriture par `printf >>` passe (`regles.mjs`, `refusSensible` n'est joué que pour l'édition).
- **Le cas 20** : `timeout-minutes` sur les trois jobs de `ci.yml`, prouvé par un banc neuf, `scripts/verify/ci-timeouts.test.mjs` (lu par `check:tickets`), sans expression régulière, pour ne pas tomber sous `S19`.
- **Le cas 4 et le 4 bis** : un seul ticket, trois étapes, les étapes 2 et 3 sur un message du conducteur ; `Blocked by: 01` sans dépendance de code (le capitaine est tenu à l'arrêt pendant le cas 4).
- **Règle haute, criticité fixée à la main** (`by: agent`, raison écrite) : le jouet n'a pas d'index Anchorpost, le skill `criticite` s'y arrête ; les axes M1 à M3 et D8 ne jouent pas sans index au pivot 3.
- **Aucun nom de personne** : `Responsable: l'équipe produit`, accords `— accord de l'équipe produit (P-66), 2026-11-22` (la forme que lisent `lireSensibles` et le gate).
- **Fichiers chauds disjoints** : `.03` et `.05` ne touchent pas `package.json` (première version retirée : K6 l'aurait relevé, deux tickets sans ordre sur le même fichier).

## Les tickets

| Ticket | Cas | `Sensibles:` | `Règles:` | Autres lignes |
| --- | --- | --- | --- | --- |
| `SPEC_ALL_ESS-1.01` Lire un montant entouré d'espaces | 1, 2 | — | — | |
| `SPEC_ALL_ESS-1.02` Afficher un montant négatif | 4, 4 bis | — | — | `Blocked by: 01` |
| `SPEC_ALL_ESS-1.03` Additionner des montants | 7 | `scripts/agent/**` — accord P-66 | — | |
| `SPEC_ALL_ESS-1.04` Prouver le partage du plus grand entier sûr | 9 | — | — | (ne cite pas la règle : `A-204`) |
| `SPEC_ALL_ESS-1.05` Signaler un montant au seuil d'alerte | 18 | — | — | |
| `SPEC_ALL_ESS-1.06` Borner la durée des jobs de la CI | 20 | `.github/workflows/**` — accord P-66 | — | |
| `SPEC_ALL_ESS-1.07` Quatre gestes de la relecture et de la veille en JavaScript | 17, 8, 22 | `scripts/chaine/**` — accord P-66 | — | |

Tous `ready-for-agent`, `Type: task`, `Modèle: sonnet`, `Fichiers chauds: —`, `Dépendances: —`. Chaque ticket a `Règles: —` explicite : sans ligne, il hériterait de celle de sa spec (`double-relecture.mjs`), et la spec n'en a pas. Aucun ticket ne cite donc la règle haute.

**Vagues** (`node scripts/docs/vagues.mjs SPEC_ALL_ESS-1 --max 6`, reprises dans la carte) : vague 1, `.01`, `.03`, `.04`, `.05`, `.06`, `.07` en parallèle ; vague 2, `.02` (attend `.01`).

**D'autres cas demandent-ils un ticket ?** Non : 2, 3, 5, 6, 11, 14, 19, 21, 23 se jouent sur ces PR et le cadrage, 8 et 22 sur `.07`, 10 et 23 sur le cadrage, 16 sans PR, 12 et 13 sur la copie d'Anchorpost. Le cas 15 est retiré (`A-204` point 4).

## La règle haute, lue par `double-relecture.mjs`

Joué sur la branche v2, dans une copie jetable du clone (`tmp/sonde2`), `origin/develop` à `9a5e7280`, et un `origin/sujet/essai-regime-8` local posé à chaque étape (le sujet ouvert depuis `develop`, puis après chaque cadrage). Commande de chaque sonde : `git -c core.quotePath=false diff --no-renames --name-only <base de fusion> <tête> | node scripts/chaine/double-relecture.mjs --base <base> --tete <sha> --titre "<titre>" --branche <branche>`.

```text
=== cadrage 1, le paquet (base sujet/essai-regime-8 = develop) : packages/essai/… pnpm-lock.yaml
non exigée
sortie 0
=== cadrage 2, la documentation (base : le sujet avec le paquet) : … docs/metier/regles/all/RULE_ALL_PAR-1.md …
RULE_ALL_PAR-1	fichier	docs/metier/regles/all/RULE_ALL_PAR-1.md	b4a4627e92711461e317d125d50e2022c3548614
RULE_ALL_PAR-1	niveau	docs/metier/regles/	b4a4627e92711461e317d125d50e2022c3548614
exigée
sortie 20
=== feat/spec-all-ess-1-04-plus-grand-entier-sur, premier push : packages/essai/src/split.test.mjs
non exigée
sortie 0
=== feat/spec-all-ess-1-04-plus-grand-entier-sur, second push : packages/essai/src/split.mjs packages/essai/src/split.test.mjs
RULE_ALL_PAR-1	code	packages/essai/src/split.mjs	origin/sujet/essai-regime-8
exigée
sortie 20
```

Le test du premier push (celui de « Où ») passe sur le code actuel : 12 sur 12 dans `split.test.mjs`. Sondes de la v1, toujours vraies (les fichiers du paquet et de la règle n'ont pas changé) : une PR qui touche `cents.mjs` ou `format.mjs`, « non exigée », sortie 0 ; une PR sans ticket qui touche `split.mjs`, « exigée », cause `code`. Avec la v1 de `.04` (qui citait la règle), le gate `tickets` refusait le ticket dès qu'on retirait `Relecture: double` (« régime 8 : ligne `Relecture: double` absente alors que le ticket cite RULE_ALL_PAR-1, règle de criticité haute ») : la règle est lue haute par le gate aussi.

## `pnpm check`

**Sur la branche v2 (sommet `b4a4627`), joué une fois** (`setsid --wait pnpm check`, 16 h 32 → 17 h 15 UTC, charge 14,0 au départ, entre 13 et 25 pendant, 13,2 à la fin) : **rouge à `check:tickets`, 989 sur 990**, pour le seul banc de durée déjà vu en v1, `scripts/agent/regles.test.mjs:1594`, « le plafond à 20 000 caractères… sous 10 s », `10808 ms à 20000 caractères`. La branche ne touche aucun fichier sous `scripts/`. Noté pour le ticket 91 (`A-204` point 6), rien touché. Journal : `check-3-v2.log`.

Le reste, joué aussitôt après, étape par étape (charge 12,6) : `check:contexte` 0, `check:settings` 0, `turbo run typecheck` 0, `turbo run test` 0 (le paquet : 29 sur 29), `turbo run check:cycles` 0, `turbo run check:gates` 0 ; `node scripts/verify/tickets.mjs` : « tickets : OK — 11 tickets… 1 carte(s) » ; le banc de durée rejoué seul : vert. `build` et `lint` étaient verts dans le passage complet. Les neuf étapes sont donc vertes, sauf ce banc sous charge.

En v1 (base `ee8d013`, même arbre que `develop`, la branche ne différant que par les textes de `.04`, de la spec et de la carte), un second passage complet avait été vert : « ✔ check — 9 étapes vertes en 2046 s », 990 sur 990 (`v1/check-2.log`) ; le premier, rouge sur le même banc (`v1/check-1.log`).

## Ce qui n'est pas établi

1. **Aucun ticket n'a été codé**, sauf le module du cas 17 (fourni à la fille) et le premier push de `.04` (sondé) : la faisabilité des autres est lue, pas jouée. Les numéros de ligne cités sont vérifiés sur la branche (`cents.test.mjs:14`, `format.test.mjs:6`, `split.test.mjs:16`, `split.mjs:1-19`, `verdict.mjs:1-30`, `settings-json.test.mjs:1-20`).
2. **Le cas 15**, retiré, pourquoi : un en-tête de règle cassé (sondé : `title: >`) fait rendre à `double-relecture.mjs` « exigée », sortie 20, cause « en-tête illisible » (voulu, `A-143`), pas « illisible », et le gate `tickets` reste vert : la sous-PR serait relue en double, jamais sautée. La sortie 7 de `sujet.sh fusionner` (« sautée sans renvoi ») vient de la garde des sensibles quand elle lit mal (sortie 21) ; une ligne `Sensibles:` mal formée sur le sujet la donnerait, mais le gate `tickets` refuse cette forme (règle 12) au pre-push et en CI. Sondé aussi : `Relecture: double!` donne « exigée » et le gate rouge. Aucun geste d'une session n'atteint donc la sortie 7 dans le jouet ; les bancs la tiennent (`sujet-fusionner.test.mjs` et voisins).
3. **Le cas 18** suppose que l'axe Règles relève `S10` ; il peut le juger sans objet (son renvoi, `apps/api/CLAUDE.md`, n'existe pas ici). Le geste de repli est écrit.
4. **Ce que la relecture des deux cadrages rendra** : non joué. Points où elle peut mordre : `P-66` est un identifiant hors du dépôt (K4 n'y voit au plus qu'un doute) ; les sections `## L'essai` décrivent des gestes à venir (étapes 2 et 3 de `.02`), sans surface ; la carte porte quatre champs « à nommer » que l'architecte remplit avant de pousser le second cadrage. Le premier cadrage, sans ticket, n'a que l'axe Règles.
5. **Au cas 9, le second push** est hors de « Où » de `.04` : la phrase au corps de la PR le justifie (T4) ; une session peut encore y voir un écart de périmètre (T6), qui rendrait le tour 2 `refusé` ; la fille le conteste alors, ou l'architecte l'arbitre.
6. **Le temps** : les cas 4 et 9 tiennent tous deux le capitaine à l'arrêt ; le cas 4 bis suppose le Relecteur interrompu pendant un passage du capitaine.

## Question, avec recommandation

1. **Le `(complète)` du cas 9 n'arrivera pas par un push.** `decision-relecteur.mjs` (base de la branche) : un push après un verdict validé change le contenu de la tête, donc règle 3, cause (a), `à-reprendre`, « le contenu a changé depuis le verdict : redemander la relecture » (ligne 570), puis, la relecture redemandée, règle 6, un **tour neuf** à deux sessions (ligne 646). `completer` (la mention `(complète)`) n'est rendu que par la règle 5 (ligne 605), sur un tour qui porte **sur le contenu de la tête** (`surLaTete`, ligne 561), quand le nombre exigé monte sans que la tête change. Le cas, tel que décidé, prouve « pas de fusion sur le seul verdict ; deux sessions dès que le code de la règle est touché » ; c'est un second cas 4, au nombre exigé près. Pour voir `(complète)`, il faut que l'exigence monte **sur la base** pendant que la tête ne bouge pas : la PR de `.04`, validée à une session sur `split.test.mjs`, attend (capitaine arrêté) qu'une autre PR entre dans le sujet et ajoute `packages/essai/src/split.test.mjs` au `code:` de `RULE_ALL_PAR-1` (une PR de documentation sans ticket, relue en double) ; la passe suivante du Relecteur pose `à-relire`, « une seconde relecture est exigée : règle passée à haute », puis `(complète)`. Mais le capitaine prend une sous-PR à la fois, dans l'ordre des numéros : la PR de `.04`, plus ancienne et `à-fusionner`, passerait avant ; il faudrait lui retirer `à-fusionner` à la main pendant ce temps (cas 3 (a) en même temps). **Recommandation : garder la décision `A-204`**, récrire l'attendu du plan pour le cas 9 (« `à-reprendre`, puis un tour neuf à deux sessions, jamais fusionnée sur un verdict »), et laisser `(complète)` aux bancs de `decision-relecteur.test.mjs` : la voie par la base coûte une PR de plus, une étiquette retirée à la main et une course avec le capitaine, pour un chemin que les bancs tiennent déjà.
