# Contre-relecture de la PR 147 — tickets 67, 68 et 69 (skill `relecteur`), premier tour

Relu du 2026-11-21 à 22:31 au 2026-11-22 à 00:20 UTC, par un agent neuf, en lecture seule vis-à-vis de GitHub, effort extra (`P-64` : la PR touche les scripts du Relecteur).

- **Sommet** : `686dcc6871a877f8796f39c476b27d2fd668ac04`, un commit, sur la base `main` à `25a72c7` (plugin 7.38.0).
- **Machine** : clone neuf de `https://github.com/MAJ-agency/skills`, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec deux autres agents. La charge est allée de 2,0 à 11,9. La suite est partie à 3,3, après une dizaine de minutes d'attente. Les bancs et les mutations sont partis entre 2,0 et 7,1 : la charge ne redescendait plus, je les ai joués en un seul flux, l'un après l'autre.

**Verdict proposé : non conforme** au sommet `686dcc6871a877f8796f39c476b27d2fd668ac04`, **sans bloquant**.

- Le code et le texte font ce que les tickets décident, à un écart mineur près (constat 7).
- Cinq décisions des tickets et d'`A-183` ne sont tenues par aucun banc : neuf de mes dix mutations survivent aux bancs du dépôt (constats 1 à 6).
- Les retouches, [`retouches-tour-1.patch`](retouches-tour-1.patch), ne changent ni le code ni le texte joué par Sonnet : six cas de banc, une phrase de `CONTENU.md` et une ligne de note sous la 7.38.1. Avec elles, mes dix mutations sont rouges et la suite entière est verte.

## 1. L'arbre de la PR

- **Une commande** : depuis `25a72c7`, `git apply --index` du patch commun (`67-annexes/ticket-67-68-69.patch`, sha256 `d88e98898ea490a4cf79d760cc9b1ff6f99a78588237181f462b0293a1a5d7fd`), puis `git write-tree`. Le résultat est `b6aa23b02c2951e5448d57de44ec70974392ea9d`, l'arbre de `686dcc6`.
- **Les trois diffs des tickets**, extraits des fichiers des tickets et appliqués l'un après l'autre sur `25a72c7`, donnent `a3741a7` (67), `73f60bf` (68), puis `b6aa23b`, le même arbre.
- **La CI de `686dcc6`** : `bancs`, `CodeQL` et ses deux analyses sont verts (lus par l'API REST). La PR n'a ni commentaire, ni revue, ni label.

## 2. Les rouges avant le code, ticket par ticket

La session ne les a pas rejoués. Chaque fois, j'ai joué les bancs du ticket seuls, sur l'arbre du ticket précédent ([`essais/journal.txt`](essais/journal.txt)) :

| Ticket | Bancs | Rouges | Les cas rouges |
| --- | --- | --- | --- |
| 67 | `relecteur.test.mjs`, sur `25a72c7` | **4 sur 37** | « X15 », « suite 66 — R3 », « suite 66 — R5 », « suite 66 — 18 » |
| 68 | les trois bancs, sur l'arbre du 67 | **7 sur 98** | « A-182 (2) » (décision), « le plafond », « suite 66 — C11 », « … A-183 point 6 », « … C12 », « suite 66 — A-182 (2) », « faux gh, événements » |
| 69 | `scripts/relecteur.test.mjs`, sur l'arbre du 68 | **2 sur 9** | « contre-relecture de la PR 146 — aucun geste… », « suite du ticket 66 (ticket 69)… » |

Il y a **13 rouges** en tout. Ce sont exactement les cas que les tickets nomment, et aucun autre.

## 3. Les essais rejoués sur l'arbre de la PR

- **Rapport de la PR 146** :
  - C11 et C12 (`essais-c1.test.mjs`) sont verts ;
  - R3 (`essais-c2.test.mjs`) est vert ;
  - R5 (`essais-c3.test.mjs`) : le premier essai est vert, puisqu'il lance la veille sans `--attendre`. Le second est rouge, comme attendu : il documentait l'absence de borne pour 9, et la borne est là.
- **Tour de relecture des tickets** : `essai-marque`, par `lancer-essai.sh`, est vert.

## 4. Ce qui est sûr, point par point

La charge de la preuve est inversée : chaque comportement neuf est listé avec ce qui le prouve. Une ligne sans preuve de machine est un constat.

| Comportement neuf | Preuve |
| --- | --- |
| La veille recopie la sortie d'erreur d'une passe sortie en 0 ou en 5, et elle seule (R3) | « suite 66 — R3 » ; essai R3 ; A1 rouge (échantillon) |
| `--attendre` : une pause avant la première passe, sous la borne de la durée ; sans l'option, rien ne change (R5) | « suite 66 — R5 » ; A2 rouge (échantillon) ; A3 et A4 (journal de l'annexe) |
| La cause « dépendances de develop » dit comment l'installation se retente (17) | « X15 » ; A7 |
| `rapatrier` fait le même `fetch` que la préparation, avec toutes les branches | A6 |
| La tête est relue une fois avant d'être dite introuvable ; absente encore, la cause est inchangée (18) | « suite 66 — 18 » ; « un diff propre qui ne se lit pas (la tête est introuvable) » ; A5 |
| **Un `fetch` en échec à ce moment sort en 12** (ticket 67, décision 4) | aucune : M5 survit (constat 5) ; K5 |
| `marque` n'est rendue qu'avec un geste `etiqueter` | « suite 66 — C12 » ; B9 |
| **La marque est le commentaire à marque le plus récent** (`dernier`, `A-183` point 6) | B8 et B19 la distinguent du premier commentaire et du dernier verdict, **mais pas d'un commentaire ordinaire** : M1 survit (constat 2) ; K2 |
| Une pose strictement après la marque, la dernière, de la même étiquette, comparée en NFC, vaut passage rejoué. Un retrait, une autre étiquette, une pose à la même seconde ou aucune pose font partir les lignes | « suite 66 — C11 » (cinq états), « un passage rejoué », « NFC » ; B3 à B7 (B4 et B6 rouges dans l'échantillon) |
| Sans marque, les lignes partent (ticket 68, décision 1) | les cas du plafond, puisque le plafond ne rend pas de marque : M2 rouge (« contre-relecture — le plafond se dit… », « suite 66 — C12 ») ; pour un `etiqueter`, K3 |
| **Des événements illisibles font sortir `jouer` en 5 sans rien écrire** | aucune : M3 et M4 survivent (constat 3) ; K4 |
| **Les événements se lisent sur toutes leurs pages** | aucune : M6 survit (constat 4 ; le ticket le dit « jouée sur une page seulement ») ; K6 |
| Les écritures de `jouer` se font dans cet ordre : l'étiquette absente, puis la lecture des événements (étiquette déjà là), puis le commentaire (plafond, panne, illisible), puis le retrait | « le plafond », « suite 66 — C12 » (les deux refus) ; B10 et B11 (B11 rouge dans l'échantillon) |
| La boucle de retrait, sortie du bloc des étiquettes, ne touche qu'un geste qui porte `retirer` | lecture de `decider` : seuls `etiqueter` et `plafonner` portent `retirer` (`decision-relecteur.mjs:387-397`) ; `illisible` (`relecteur.mjs:300`), `panne` et les gestes de session n'en ont pas |
| `couple` est admis par `--sessions` et par la décision ; une session `couple` est hors service, remplacée une fois par tour, puis c'est la panne | « A-182 (2) » des deux bancs ; B12 et B13 ; B14 rouge (échantillon) |
| Le capitaine n'est pas touché | lecture : `decider` n'est appelé que par `relecteur.mjs` (lignes 263 et 277) ; aucun autre script ne l'importe |
| Le faux GitHub tient les événements comme GitHub : `{ event, label: { name }, created_at }` à la seconde, dans l'ordre croissant | « faux gh, événements » ; B15, B16 et B18 rouges (échantillon) ; **lu sur de vraies PR de ce dépôt** : `GET issues/108/events` rend `labeled`, `unlabeled`, `labeled`, dans l'ordre, à la seconde, en `Z` |
| Chaque phrase neuve du skill est exigée à sa place | le banc des textes ; C1, C3, C4, C6 et C14 rouges (échantillon). **Ne sont pas tenues** : la liste des quatre formes, et les bornes de 12 et d'une sortie hors de la table (M7 à M10 survivent ; constats 1 et 6) |

## 5. Les attaques : essais K1 à K7

Les essais sont dans [`essais/essais-686dcc6.test.mjs`](essais/essais-686dcc6.test.mjs) (`APRES=<arbre> node --test …`), et leur journal dans [`essais/journal.txt`](essais/journal.txt).

| Essai | Arbre de la PR | `25a72c7` | Arbre retouché | Ce qu'il montre |
| --- | --- | --- | --- | --- |
| K1 | **rouge** | vert | rouge | un plafond rejoué après un retrait refusé redit « décision de plafond attendue » : constat 7 |
| K2 (tenue) | vert | rouge (pas de `marque`) | vert | tue M1 |
| K3 (tenue) | vert | rouge | vert | « sans marque » pour un `etiqueter` ; M2 est déjà tuée par le plafond |
| K4 (tenue) | vert | rouge (pas de lecture) | vert | tue M3 et M4 |
| K5 (tenue) | vert | rouge (pas de relecture) | vert | tue M5 |
| K6 (tenue) | vert | vert (rien n'y repart jamais) | vert | tue M6 |
| K7 (documente) | vert | — | vert | une panne des seuls événements : la veille réveille à chaque sonde, `jouer` sort en 5, sans borne ni ligne (constat 8) |

K2 à K6 entrent au banc du Relecteur par les retouches, sous « contre-relecture 147 ». K1 et K7 restent des essais.

## 6. Les textes joués par Sonnet

**Ce qui tient :**

- chaque sortie de la table a sa suite ;
- chaque seuil a son nombre : 700 000 et 500 000 tokens, 25 minutes, 2 minutes, 5 minutes, « une fois », « la seconde fois », « une fois par tour » ;
- toute ligne à l'architecte que le skill nomme entre dans l'une des quatre formes. Je les ai relevées une à une : mise en place, sorties 1, 2, 3, 6, 7, 9, 12 et « autre », `create_session` (refus de l'effort, autre échec), `VEILLE FINIE`, sessions orphelines, `send_message` perdu. La quatrième forme est celle d'`A-183` point 4, amendée par `A-184` point 3 (« <sa dernière ligne non vide> »), mot pour mot ;
- `--attendre` suit les trois puces de la veille ;
- l'état `couple` se lit pour `reecrire` comme pour une session attendue, la phrase de R2 en garde le sens, et `A-183` point 5 tient.

**Les gestes encore à improviser** sont tous mineurs : constats 8 à 11.

## 7. Mutations

**L'échantillon de 15** de [`67-annexes/mutations.mjs`](../mutations.mjs), graine 686 (mulberry32 et mélange de Fisher-Yates, [`mutations/echantillon.mjs`](mutations/echantillon.mjs)) : A1, A2, B1, B4, B6, B11, B14, B15, B16, B18, C1, C3, C4, C6, C14. Sur l'arbre de la PR, **15 rouges sur 15**, chacune par le cas qui la vise (de 23:28:08 à 23:47:51 UTC, [`mutations/journal-echantillon.txt`](mutations/journal-echantillon.txt)).

**Les dix miennes**, sur ce qui est apparu fragile ([`mutations/mutations-686dcc6.mjs`](mutations/mutations-686dcc6.mjs)). Chacune joue les bancs du dépôt, puis l'essai qui la vise :

| Mutation | Sur la PR, bancs du dépôt | Essai | Sur l'arbre retouché |
| --- | --- | --- | --- |
| M1 la marque est le dernier commentaire, à marque ou non | **survit** | K2 rouge | rouge |
| M2 sans marque, un passage rejoué | rouge (les cas du plafond) | — | rouge |
| M3 des événements illisibles font partir les lignes au lieu de 5 | **survit** | K4 rouge | rouge |
| M4 le retrait avant la lecture des événements, et lui seul (les lignes perdues si elle échoue) | **survit** | K4 rouge | rouge |
| M5 la seconde lecture d'origin en échec se tait | **survit** | K5 rouge | rouge |
| M6 les événements lus sur leur première page | **survit** | K6 rouge | rouge |
| M7 la quatrième forme retirée de la liste des formes | **survit** | — | rouge |
| M8 « Relecteur arrêté » retirée de la liste des formes | **survit** | — | rouge |
| M9 la sortie 12 sans borne | **survit** | — | rouge |
| M10 une sortie hors de la table sans borne | **survit** | — | rouge |

M4 a deux formes. La première laissait le retrait final : le retrait joué deux fois la faisait rougir, sans rien dire de la lecture en panne. Je l'ai réécrite. Les deux formes sont dans les journaux, [`mutations/journal-miennes-pr.txt`](mutations/journal-miennes-pr.txt) et [`mutations/journal-miennes-retouche.txt`](mutations/journal-miennes-retouche.txt).

## 8. La suite entière

`pnpm test`, d'un seul tenant, sur l'arbre retouché. Le patch ne change que des bancs, une note et une phrase de documentation : la suite contient donc les 1 290 cas de la PR, et son vert vaut pour `686dcc6`, que la CI dit aussi vert (`bancs`).

- **1 296 tests, 1 296 verts**, aucun échec, sauté ni annulé ;
- 17 min 43 s, de 22:57:36 à 23:15:19 UTC (`duration_ms` 1062167) ;
- charge 3,27 au départ, 7,93 à la fin.

## Constats

| N° | Gravité | Ticket | Le fait | La preuve | La retouche |
| --- | --- | --- | --- | --- | --- |
| 1 | à corriger | 69 | « Les lignes … ont quatre formes, et aucune autre » : le banc des textes n'exige que le début de la phrase, et la quatrième forme se lit dans le paragraphe de `send_message` de la même section. Une liste à trois formes sous « quatre formes » passe, et rien ne compte « aucune autre » | M7, M8 survivent | banc : la phrase, ses quatre formes, et exactement quatre `«` avant « La `<cause>` » |
| 2 | à corriger | 68 | `A-183` point 6 : la marque est le commentaire **à marque** le plus récent. Si elle devenait le dernier commentaire, un commentaire ordinaire écrit après la pose ferait repartir les lignes d'un passage rejoué, et aucun cas ne le verrait | M1 survit ; K2 | banc « la marque est un commentaire à marque » |
| 3 | à corriger | 68 | des événements illisibles font sortir `jouer` en 5 **sans rien écrire**. Si le retrait passait avant la lecture, le rejeu lirait une PR hors de la file, et les lignes du refus seraient perdues. Aucun cas ne joue cette lecture en panne | M3, M4 survivent ; K4 | banc « les événements de la PR ne se lisent pas » |
| 4 | à corriger | 68 | « toutes pages » (décision 1) : la lecture paginée des événements n'est jouée sur aucune page de plus, ce que le ticket reconnaît | M6 survit ; K6 | banc : un `gh` qui rend la première page seule sans `--paginate` et les deux avec, comme GitHub (la forme de N12) |
| 5 | à corriger | 67 | décision 4 : « Un `fetch` en échec à ce moment sort en 12 » n'est joué par aucun cas. S'il se taisait, la tête serait dite introuvable pour rien, ce que le ticket ferme | M5 survit ; K5 | banc « la seconde lecture d'origin en échec » |
| 6 | mineur | 69 (préexistant) | les bornes de 12 et d'une sortie hors de la table (« à la seconde fois, l'architecte, et s'arrêter ») ne sont exigées qu'au début de leur ligne, alors que celle de 9 l'est en entier. R5 s'appuie sur elles (« compterait pour la seconde fois ») | M9, M10 survivent | banc : la borne de 9, de 12 et d'« autre », à leur ligne (dans le patch, avec le constat 1) |
| 7 | mineur | 68 | **un plafond rejoué redit « décision de plafond attendue »** à l'auteur et au conducteur. Au plafond, l'étiquette se pose maintenant avant le commentaire (`A-183` point 1), et ce commentaire est la marque la plus récente. Si le retrait de `à-relire` est refusé (`retirer_label` le tait) ou coupé, le passage suivant rend `etiqueter` (règle 1), lit l'étiquette posée avant la marque, et les lignes repartent. Le texte dit pourtant « rejoué, il n'en rend aucune ». Sur `25a72c7`, rien ne repartait | K1 rouge sur la PR, vert sur `25a72c7` | question 1 : garder le comportement et l'écrire (recommandé), ou exclure le commentaire du plafond de la marque |
| 8 | mineur | 69 | `--attendre` se déclenche sur une suite « rejouer au réveil suivant ». Deux suites qui renvoient au réveil suivant sont écrites autrement : la sortie 5 (« rien, le réveil suivant rejoue ») et `create_session` en échec (« rejouer le geste au réveil suivant »). Une session qui lit à la lettre relance alors sans pause. De plus, 5 n'a pas de borne, et `jouer` est seul à lire les événements : une panne de cette seule lecture réveille la session à chaque sonde, sans pause, sans fin et sans une ligne | K7 | écrire les deux suites « rejouer au réveil suivant » ; la borne : question 2 |
| 9 | mineur | 69 | « `reecrire` … suit cette règle de « Créer ou relancer » : sans les deux champs, `couple` » se lit aussi « si les deux champs manquent ». La phrase suivante dit pourtant « un champ absent la laisse `vivante` » | lecture | « il lui faut les deux champs : un champ absent, `couple` » (le banc des textes et C8 suivent) |
| 10 | mineur | 69 (préexistant) | la ligne `reecrire` dit que `jouer <n> --sessions <fichier>` « rend `remplacer` ». Il rend `panne` quand une session a déjà été remplacée dans ce tour, ce qu'`A-183` point 2 rend plus probable avec `couple`. `jouer` écrit alors le commentaire de panne, et ses lignes sont à envoyer | lecture de `decider`, règle 5 | « …, qui rend `remplacer`, ou `panne` (une session déjà remplacée dans ce tour) : ses lignes (« Les lignes ») » |
| 11 | mineur | 69 (préexistant, étendu à 9) | « à la seconde fois » ne dit pas « de suite » : une sortie 12 un jour et une autre le lendemain arrêtent-elles le Relecteur ? `A-182` point 4 dit « rejouer une fois, puis… » | lecture | « à la seconde fois de suite » sur 9, 12, « autre » et `create_session` |
| 12 | mineur | 69 (§ 3) | le titre prescrit (139 caractères) dépasse les 120 de la chaîne (`sujet/SKILL.md:26`). La session a raccourci celui de la PR et l'a signalé ; le sujet du commit reste à 139, et le squash prend le titre de la PR | corps de la PR | aucune sur la PR ; dans le gabarit de titre des tickets à venir |

Les constats 1 à 6 sont dans le patch. Les mineurs 7 à 12 peuvent aller à un ticket de suite, et 7 et 8 attendent les questions. Aucun n'est dans le patch : chacun change une phrase jouée par Sonnet, ou attend une réponse.

## Retouches : [`retouches-tour-1.patch`](retouches-tour-1.patch)

- **Ce qu'il change** : quatre fichiers, +88 −1, sha256 `0f1955137c25b00f2d4fed811d9dbb84a77c67e553b21182240abccf729e2c77`.
  - `skills/chaine/relecteur/scripts/relecteur.test.mjs` : cinq cas sous « contre-relecture 147 », K2 à K6 recopiés dans la forme du banc. Leurs faux `gh` ne contiennent rien de variable (`A-181`). K3 n'est exigé par aucune survivante, mais il tient « sans marque » pour un `etiqueter` ; il peut sortir sans rien perdre des constats.
  - `scripts/relecteur.test.mjs` : un cas, pour les quatre formes et les bornes de 9, 12 et « autre ».
  - `skills/chaine/relecteur/references/CONTENU.md` : la phrase du banc.
  - `NOTES-DE-VERSION.md` : une ligne sous la 7.38.1, « Ce qui change ».
  - `plugin.json` ne change pas, et ni le code ni `SKILL.md` ne bougent.
- **Il s'applique** : `git apply --check`, puis `git apply`, sur un clone propre à `686dcc6`.
- **Bancs touchés**, sur l'arbre retouché (de 23:25:40 à 23:27:45 UTC, charge 5,6) :
  - `relecteur.test.mjs` du skill : 47 sur 47 (les 42 de la PR et 5 neufs) ;
  - `scripts/relecteur.test.mjs` : 10 sur 10 ;
  - `scripts/depot.test.mjs` : 69 sur 69, pour la note.
- **Survivantes rouges** : M1, M3 à M10, sur l'arbre retouché, chacune par le cas neuf qui la vise. M2 l'était déjà.
- **Suite entière** : 1 296 sur 1 296 (§ 8).
- **Comptes** :
  - banc du Relecteur : 42 cas, puis 47 ;
  - banc des textes : 9, puis 10 ;
  - suite : 1 290, puis 1 296.

## Questions à l'architecte

1. **Constat 7 : un plafond rejoué redit « décision de plafond attendue ».** Faut-il garder ce comportement et l'écrire, ou le taire ?
   - (a) Le garder, et l'écrire dans « Les lignes » et l'en-tête du script : « Rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur : son étiquette s'est posée avant son commentaire. »
   - (b) Le taire : la marque d'un `etiqueter` ne compterait pas le commentaire du plafond. Mais il y a un cas que GitHub ne distingue pas du retrait refusé : le commentaire écrit, dont la réponse se perd (une coupure après l'écriture). Le premier passage est alors sorti en 7 sans rien envoyer. Avec (b), le rejeu se tairait aussi, et le plafond ne serait dit à personne.
   - **Recommandation : (a).** C'est le côté qu'`A-183` point 3 retient : une ligne en double plutôt qu'une PR que personne ne reprend.
2. **Constat 8 : une borne pour la sortie 5 de `jouer` ?** **Recommandation : oui, comme 7.** Au second 5 de suite sur la même PR, alors que `passe` lit GitHub, l'architecte et `--taire <n>`. Les deux suites qui renvoient au réveil suivant seraient écrites « rejouer au réveil suivant », pour que `--attendre` les suive.

## Ce qui n'a pas été établi

- **Un commentaire du plafond écrit, dont GitHub répond en échec.** Le rejeu prévient l'auteur et le conducteur (« décision de plafond attendue »), mais pas l'architecte. C'est la même chose sur `25a72c7` : un C12 résiduel, que seul le second remède d'origine (la règle 1 qui rend l'architecte) fermerait.
- **Un verdict `validé` rendu par une session à l'ancien couple** compte encore, puisque la décision ne connaît pas le couple d'un verdict. `A-182` point 2 ne vise que les sessions attendues. Je le note pour `P-64`, hors du périmètre de ces tickets.
- **Les gestes du modèle** (`get_session`, `send_message`, `create_session`) ne se jouent sur aucun banc. La forme des événements est lue sur de vraies PR, mais pas une PR à plus de cent événements.

## Comptes

- **Arbre** : `b6aa23b` = `25a72c7` + le patch commun, et les trois diffs des tickets en série donnent le même arbre.
- **Rouges avant le code** : 4 sur 37, 7 sur 98, 2 sur 9, soit 13, ceux que les tickets nomment.
- **Essais du rapport de la PR 146** sur la PR : C11, C12, R3 et R5 (1) verts ; R5 (2) rouge, comme attendu. `essai-marque` est vert.
- **Essais de ce tour** : sur la PR, K1 rouge et six verts ; sur l'arbre retouché, K1 rouge et six verts.
- **Mutations** :
  - l'échantillon : 15 rouges sur 15 ;
  - les miennes sur la PR : 9 survivantes sur 10 (M2 rouge) ;
  - les miennes sur l'arbre retouché : 10 rouges sur 10.
- **Suite entière**, arbre retouché : 1 296 sur 1 296.
- **Temps** : 1 h 50 environ (22:31 → 00:20 UTC), dont une vingtaine de minutes à attendre la charge.

## Second tour

Relu le 2026-11-22, de 00:31 à 00:48 UTC, par le même agent, en lecture seule vis-à-vis de GitHub, sur le seul delta `686dcc6..ffb7e2c`. Les questions du premier tour sont tranchées par `A-189` : le plafond rejoué est gardé et sera écrit ; la borne de la sortie 5 et les mineurs 7 à 12 vont à des tickets de suite. La suite entière n'est pas rejouée, comme demandé. La charge allait de 4,3 à 6,2, avec un autre agent en parallèle ; les mutations ont été jouées une à une. Journaux : [`essais/journal-tour-2.txt`](essais/journal-tour-2.txt), [`mutations/journal-tour-2.txt`](mutations/journal-tour-2.txt).

### 1. L'arbre

- **Sommet** : `ffb7e2c2ed9d338726a2558d754e673f768a8df6`, un commit, parent direct `686dcc6`. Le message est conventionnel : `test(relecteur): retouches du premier tour de contre-relecture de la PR 147 (plugin 7.38.1)`.
- **Une commande** : `686dcc6`, plus `git apply --index retouches-tour-1.patch`, puis `git write-tree`. Le résultat est `52ec3e218bf093894fb7e75659ccdee4fad166b1`, l'arbre de `ffb7e2c`. De plus, `git diff 686dcc6 ffb7e2c` est le patch, octet pour octet (sha256 `0f195513…`).
- **Quatre fichiers**, +88 −1, et rien d'autre : `plugin.json` reste à 7.38.1, ni le code ni `SKILL.md` ne bougent. La ligne de note est sous la 7.38.1, dans « Ce qui change ».
- **La suite** : c'est l'arbre sur lequel j'ai joué la suite entière au premier tour, 1 296 sur 1 296. La session annonce le même compte.
- **Les contrôles GitHub de `ffb7e2c`** (API REST, lecture, à 00:45 UTC) sont verts tous les quatre : `bancs` (fini à 00:44:30), `CodeQL`, `Analyze (actions)` et `Analyze (javascript-typescript)`. `CodeQL` a d'abord été `neutral`, le temps de l'analyse JavaScript, puis `success`.

### 2. Les constats 1 à 6, fermés

Témoin : les bancs neufs seuls, sans mutation, sur `ffb7e2c`. Le banc du Relecteur donne 5 sur 5, celui des textes 1 sur 1.

Mes dix mutations, rejouées sur `ffb7e2c` contre les bancs du dépôt (de 00:35:15 à 00:45:19 UTC) : **10 rouges sur 10**.

- M1 et M3 à M10 sont tuées, chacune par le cas neuf qui la vise :
  - M1 par « la marque est un commentaire à marque » (constat 2) ;
  - M3 et M4 par « les événements de la PR ne se lisent pas » (constat 3) ;
  - M6 par « les événements sur deux pages » (constat 4) ;
  - M5 par « la seconde lecture d'origin en échec » (constat 5) ;
  - M7 à M10 par « les quatre formes… » (constats 1 et 6).
- M2 reste tuée par les cas du plafond, comme au premier tour.
- M4 est jouée dans sa forme réécrite : le retrait avant la lecture, et lui seul.
- Chaque essai qui la vise (K2, K4, K5, K6) la tue aussi.

Les six constats sont fermés.

### 3. Les bancs neufs tiennent-ils ce qu'ils disent ?

Je les ai relus en relecteur neuf, puis attaqués par quatre mutations neuves, jouées contre **les seuls bancs neufs** ([`mutations/mutations-ffb7e2c.mjs`](mutations/mutations-ffb7e2c.mjs)) :

| Mutation | Le banc visé | Ce qu'elle cherche | Résultat |
| --- | --- | --- | --- |
| N1 le retrait avant la lecture des événements, le retrait final laissé | « les événements de la PR ne se lisent pas » | un banc qui ne verrait que la sortie 5 | **rouge** : la sortie est bien 5, mais un retrait est écrit, et le cas l'exige vide (« sans aucune marque » rougit aussi) |
| N2 la relecture se tait, puis une tête absente sort en 12 | « la seconde lecture d'origin en échec » | un 12 qui ne viendrait pas du `fetch` | **rouge** : la sortie d'erreur n'est pas celle du `fetch` |
| N3 les traces d'illisible comptent dans la marque | « la marque est un commentaire à marque » | une marque prise sur un commentaire à préfixe que `dernier` exclut | **survit** aux bancs neufs, et au banc entier (47 cas) : constat 13 |
| N4 la forme « orpheline » remplacée par un doublon de « PR tue » | « les quatre formes… » | un banc qui ne tiendrait que par le compte des `«` | **rouge** : la forme « orpheline » manque |

Le reste tient. Chaque faux `gh` neuf ne contient rien de variable (`A-181`). La panne des événements ne vise que leur route (`^issues/12/events`, une fois). Le `gh` à deux pages rend la première seule sans `--paginate`, et les deux avec, comme GitHub. Le cas « sans marque » est redondant avec les cas du plafond : il les complète pour un `etiqueter`.

### 4. La phrase neuve de `CONTENU.md`

« … et, depuis la contre-relecture de la PR 147, la marque lue sur un commentaire à marque, une PR sans marque, des événements illisibles (rien d'écrit) ou sur deux pages, la tête relue en échec (sortie 12). »

Elle ne contredit rien :

- **les cas** : chacun de ses éléments est un cas du banc ;
- **le paragraphe du script** (« une étiquette déjà là n'est un passage rejoué que si les événements de la PR la disent posée après sa marque la plus récente », « tête introuvable après une seconde lecture d'origin ») ;
- **« Les lignes » du skill** ;
- **`A-189`** : elle ne dit rien du plafond rejoué.

La ligne de note dit la même chose, et ne promet rien de plus.

### 5. Constat neuf

| N° | Gravité | Le fait | La preuve | La suite |
| --- | --- | --- | --- | --- |
| 13 | mineur | La marque d'un `etiqueter` est `dernier`, qui exclut les traces d'illisible (`A-183` point 6). Une marque qui les compterait ferait repartir les lignes d'un passage rejoué. Cela arrive si une trace s'écrit entre la pose et le rejeu : un retrait refusé, puis un calcul en panne, revenu depuis. Le code est juste, mais aucun banc ne tient ce point : le cas neuf ne joue qu'un commentaire ordinaire | N3 survit aux 47 cas du banc du Relecteur. L'essai K8 ([`essais/essais-ffb7e2c.test.mjs`](essais/essais-ffb7e2c.test.mjs)) est vert sur `ffb7e2c` et rouge sous N3 | un ticket de suite : K8 au banc du Relecteur, N3 à la liste des mutations ; il ne retient pas la PR |

### 6. Verdict proposé

**Conforme** au sommet `ffb7e2c2ed9d338726a2558d754e673f768a8df6`.

- **Fermés** : les constats 1 à 6 du premier tour. Les mineurs 7 à 12 vont aux tickets de suite d'`A-189`.
- **Constat neuf** : un mineur (13), pour un ticket de suite, avec son essai. Aucun bloquant, aucun à-corriger.

### 7. Comptes du second tour

- **Arbre** : `ffb7e2c` donne `52ec3e2`, soit `686dcc6` plus le patch, et le delta est le patch octet pour octet.
- **Bancs neufs** sans mutation : 5 sur 5 et 1 sur 1.
- **Mes dix mutations** : 10 rouges sur 10.
- **Les quatre neuves** : 3 rouges, 1 survivante (N3, constat 13). K8 la tue.
- **Contrôles GitHub** : 4 sur 4 verts.
- **Temps** : environ 17 minutes.
