# Contre-relecture de la PR 157 (« anchorpost », ticket 89) — tour 2, sommet `8fc10ba`

**Verdict : non conforme au sommet `8fc10ba07df1ff0c99b3ef64dcc03db34607c8e0`**. Aucun bloquant, 2 à corriger, 3 mineurs. Ce que `A-213` demandait est fermé, et la CLI publiée confirme chaque affirmation du delta : `migrate manifest` et `@^2.0.2`, « prouvée » comme la CLI, les bancs des décisions 2 à 4, les mineurs de texte. Les deux points à corriger portent sur le texte que la retouche ajoute :

1. La raison d'une criticité de feature basse, que le texte laisse écrire par la session sous le nom d'une personne.
2. Le banc, qui ne tient pas les phrases neuves de la retouche (9 mutations vertes).

Une seule retouche porte les deux, plus le mineur 1 : [`retouches/retouche-157-tour-2.patch`](retouches/retouche-157-tour-2.patch), sur `8fc10ba`, sha256 `5a45adfafd3d31a35e6ad62a1208210001cc9473ec46ed382990e4e4814743e8` ([`retouches/SHA256SUMS`](retouches/SHA256SUMS)). Elle touche 3 fichiers, ajoute 13 lignes et en retire 2, sans test neuf.

Le périmètre est le delta `6feef8d..8fc10ba` : un commit, cinq fichiers. Le travail part d'un clone neuf de `https://github.com/MAJ-agency/skills`, au 2026-11-22. Les annexes du tour 1 sont lues sur `claude/hopeful-lovelace-ouk6tz`. La CLI publiée est installée sans jeton dans des dépôts jouets jetables.

## Ce qui tient

- **Le delta est la retouche du tour 1.** Le patch `retouche-157-tour-1.patch` (sha256 `4b0017c8…7414`, vérifié contre `SHA256SUMS`) est appliqué sur `6feef8d` : `git diff --quiet 8fc10ba`, aucune différence. Il touche cinq fichiers, ajoute 40 lignes et en retire 12.
- **La CLI publiée.** `npm view` donne de 0.0.0-stage à 2.0.2, avec `latest` à 2.0.2 (2026-11-22, 16:41 UTC). Il n'existe pas de 2.0.3.
- **Le point 1 de « Passer au pivot 3 », joué :**
  - `pnpm add -Dw @maj-agency/anchorpost@^2.0.2` installe la 2.0.2. `pnpm anchorpost:index` écrit un index `"schema": "3"`, où les deux règles à preuves sortent `partial`.
  - Sur une 2.0.0 ou une 2.0.1 déjà installée, `@^2` garde la version en place, et `migrate manifest` n'y est pas (« Usage : anchorpost migrate <rules-json|markdown-table|identifiers|epics> »). `@^2.0.2` passe ensuite à la 2.0.2. La parenthèse du point 1 est exacte pour les deux versions ; le tour 1 n'avait joué que la 2.0.1.
  - « Commiter : la commande suivante exige un arbre propre » est vrai. Sur l'arbre sale du point 1, le plan joue (sortie 0), mais `--apply` refuse (« migrate --apply refuse un arbre git qui n'est pas propre », sortie 2).
- **Le point 2, avec une criticité de feature `high` :**
  - Le plan, puis `--apply` après le commit, n'écrivent que le manifeste. Le manifeste passe au schéma 3, avec `sufficiency: observe` ajouté. `proven: 1` devient `{ proven: 0, partial: 1 }`, à la date gardée, sans être re-mesuré. Aucun plancher n'est posé sur le contexte qui n'en avait pas. `featureCriticality` est écrite `{ feature, level, by, date }`.
  - L'alerte de l'index au manifeste 2 nomme bien la commande : « Le passer au schéma 3 : `anchorpost migrate manifest`, puis relire le plancher. »
  - Ensuite, `index` et `check` sont verts : 0 erreur, 8 avertissements.
  - Le plancher relevé à la main (`{ date, by, proven, partial }`) passe, puis `index` et `check` restent verts.
  - `compare --base` donne « Aucun écart » en sortie 0, contre le commit d'avant comme contre celui d'avant la CLI 2. `migrate manifest --check` répond « déjà au schéma 3 ».
- **Le point 2, avec une criticité de feature `low` :**
  - Le plan, `--apply` et `--check` refusent, sans rien écrire (sortie 2) : `featureCriticality.0.reason : Une criticité basse sans raison est refusée`.
  - `init` refuse aussi (« Init refusé, rien n'est écrit », sortie 2).
  - Avec une `reason` ajoutée au manifeste 2, `migrate manifest` refuse encore : « le schéma 3 ne porterait pas ces clés… featureCriticality.0.reason ». C'est exactement « elle refuse, sans rien écrire, une clé que le schéma 3 perdrait ».
  - La réécriture à la main au schéma 3, aux mêmes conversions et avec la `reason`, passe : `--check` à jour, `index` et `check` verts. `compare --base` contre le manifeste 2 donne « Aucun écart ». L'index lit la règle `low`, `origin: feature`.
- **La définition de « prouvée » de la fiche et du `$comment`**, jouée contre la 2.0.2 sur les trois cas demandés, chaque cas déclaré étant prouvé :
  - basse avec un seul cas `edge` : `partial`, `missing: { nominal: true }` ;
  - basse avec un cas `nominal` : `proven` ;
  - moyenne sans familles : `partial`, `missing.families` les dix.

  Quatre cas de plus confirment la ligne 38 de la fiche :
  - moyenne, `nominal` et les dix familles « sans objet » : `proven` ;
  - un cas `invalid` sans `family` répond à `invalid-input` : aucune famille ne manque ;
  - une question ouverte (`docs/questions-ouvertes.md`, `Bloque : RULE_…`) laisse la règle `partial` (`missing.families: ["volume"]`), sans refus au groupe 8 en `enforce` ;
  - la même famille sans question ni « sans objet » est refusée au groupe 8 en `enforce`.

  La fiche et le `$comment` disent la même chose que la CLI.
- **Les mutations du tour 1 sur `8fc10ba`.**
  - Les 13 de l'annexe (`mutations.mjs`) sont toutes rouges, sortie 0.
  - De C1 à C28 (`mutations-contre.mjs`), 26 sont rouges sur 26.
  - C1 et C17 sont introuvables, leur texte étant remplacé par la retouche ; C19, C20, C22 et C23 couvrent ce texte, et sont rouges.
- **Les bancs touchés**, `preuve-suffisante-anchorpost`, `depot`, `relecture` et `preuve-suffisante-socle-tests` : 113 sur 113.
- **La CI à `8fc10ba`** : `bancs` est `success` (22:08 UTC), comme CodeQL et les deux `Analyze`. La PR est ouverte, hors brouillon, avec `8fc10ba` pour sommet.
- **La fiche** fait 62 lignes. Aucun nom de projet client ni chemin privé n'apparaît dans les lignes ajoutées.

## Constats à corriger

**1. [`SKILL.md` l. 113, « Passer au pivot 3 », point 2] La raison d'une criticité de feature basse : le texte ne dit pas qui l'écrit.**

Le texte dit : « le manifeste se réécrit alors au schéma 3 à la main, aux mêmes conversions, avec la `reason` ». L'entrée garde le `by` de la personne qui a fixé le niveau (au manifeste 2, `validation.by`, écrit `by` par la conversion). La fiche dit de ce `by` « que seule la personne écrit », et le skill de criticité dit « jamais « basse » sans raison écrite ». La raison d'une criticité basse est donc celle de qui l'a fixée.

Le texte laisse la session l'écrire. `compare` ne verra rien (joué : « Aucun écart »), puisque le niveau et le `by` ne changent pas.

*Scénario* : une session reprend un dépôt dont une feature est basse au schéma 2. `migrate manifest` refuse, et elle suit le texte : elle réécrit le manifeste, écrit elle-même une raison plausible sous `by` d'une personne de la MOA, puis commite. La PR passe `check` et `compare` sans écart. Une justification attribuée à une personne qui ne l'a pas donnée entre dans un chemin sensible.

*Retouche* (dans le patch) : « avec la `reason` que donne la personne nommée par `by` : une session ne l'écrit pas à sa place, elle la demande dans sa PR. » Le banc l'exige.

**2. [`scripts/preuve-suffisante-anchorpost.test.mjs`] Le banc ne tient pas les phrases neuves de la retouche : 9 mutations sur 11 restent vertes au sommet.**

Les mutations neuves sont dans [`mutations/mutations-t2.mjs`](mutations/mutations-t2.mjs), jouées sur les quatre bancs touchés ([`mutations/t2-sur-8fc10ba.txt`](mutations/t2-sur-8fc10ba.txt)). Les vertes :

- **D1** : la note 8.3.0 revient à « `anchorpost init` qui réécrit le manifeste ». C'est la substance du constat 1 du tour 1, sur la ligne qu'il nommait.
- **D2** : la note perd « (≥ 2.0.2) ».
- **D3** : le point 1 perd « Commiter : la commande suivante exige un arbre propre ».
- **D4** : le cas d'une feature basse devient « ajouter la `reason` au manifeste 2, puis relancer la commande », le chemin que la CLI refuse (joué).
- **D5** : le plancher devient « re-mesuré et daté du jour ».
- **D6** : « elle retire une clé que le schéma 3 ne porte pas » remplace le refus.
- **D7** : la question ouverte ne laisse plus la règle « partielle ».
- **D8** : un cas `refusal` répondrait à `invalid-input`.
- **D9** : « partielle » sans « pas de cas `nominal` ».

Seules D10 (« dès high » dans le `$comment`) et D11 (le point 2 sans le nom de l'alerte) sont rouges.

C'est la même classe de constat que le n° 3 du tour 1 (`A-213`, « les bancs renforcés »), sur les phrases que la retouche du tour 1 a écrites pour la question 1 (`migrate manifest`) et la question 2 (« prouvée »).

*Retouche* (dans le patch) : sept passages exigés dans les deux tests existants, sans changer le compte de tests. Ce sont trois `exiger` de plus sur `SKILL.md` (« Commiter… », le nom de l'alerte, « jamais re-mesuré », le refus d'une clé perdue, le cas d'une feature basse avec la phrase du constat 1), un sur la note et deux sur la fiche (la ligne 38 et la phrase de « partielle » du mineur 1).

## Mineurs

1. **[Fiche l. 45] « `realisation.missing` de l'index le dit » se lit comme couvrant les quatre raisons d'une « partielle ».** `missing` ne dit que le cas `nominal` et les familles ; le README dit qu'il nomme « ce qui manque au-delà des cas ». Joué sur une règle moyenne au cas `invalid` prouvé en P0 seulement : `partial`, `missing: {}`, et `cases: { declared: 2, proven: 1 }`. Le patch porte la correction : « un cas sans preuve au niveau exigé, que `realisation.cases` compte ; aucun cas déclaré ; pas de cas `nominal` ou une famille sans réponse, que `realisation.missing` nomme ».
2. **[Fiche l. 38] La question ouverte ne nomme pas son registre.** Elle dit « une question ouverte dont la ligne `Bloque :` nomme la règle », sans `docs/questions-ouvertes.md`, que la CLI lit, seul, sous des titres `###`. Ce mineur n'est pas porté : le registre est posé par le socle et nommé ailleurs. Il est laissé à la session.
3. **Hors du delta, pour l'architecte d'Anchorpost.** `check` accepte un `floor.by` qui n'est pas une clé de `roles` (joué : « Inconnu », aucune erreur ni alerte de plus), alors que la CLI signale un tel `by` sur une criticité. Le skill ne promet pas ce contrôle ; il demande « la personne qui le pose ». Ce point n'appelle aucune retouche ici.

## Ce qui a été joué

- **Le contenu du delta** : la somme du patch du tour 1, son application sur `6feef8d`, puis l'égalité avec `8fc10ba`.
- **« Passer au pivot 3 », tel qu'écrit, sur la 2.0.2.** Le dépôt jouet pnpm est au manifeste 2 : deux contextes dont un sans plancher, une criticité de feature. Il est joué deux fois, une fois avec `high` et une fois avec `low`. Script : [`essais/jouer.sh`](essais/jouer.sh) (`bash jouer.sh <dossier vide> <low|high>`). Sorties : [`essais/pivot3-high.txt`](essais/pivot3-high.txt), [`essais/pivot3-high-suite.txt`](essais/pivot3-high-suite.txt), [`essais/pivot3-low.txt`](essais/pivot3-low.txt), [`essais/pivot3-low-suite.txt`](essais/pivot3-low-suite.txt). Ces deux passages couvrent :
  - le point 1, puis le plan et `--apply` sur l'arbre sale et sur l'arbre propre, et `--check` ;
  - `index` et `check` ;
  - le plancher relevé avec `by`, sans `by`, et avec un `by` hors de `roles` ;
  - `compare --base` contre deux bases ;
  - `init` sur le manifeste 2 bas ;
  - la `reason` ajoutée au manifeste 2 ;
  - la réécriture à la main au schéma 3.
- **`@^2` sur une 2.0.0 puis une 2.0.1 déjà installées**, puis `@^2.0.2` : [`essais/init-et-garde.txt`](essais/init-et-garde.txt).
- **La réalisation de sept règles** (les trois cas demandés et quatre de plus), et le groupe 8 en `enforce` : [`essais/realisation.sh`](essais/realisation.sh), [`essais/realisation.txt`](essais/realisation.txt).
- **Les bancs touchés au sommet** : [`essais/bancs-sur-8fc10ba.txt`](essais/bancs-sur-8fc10ba.txt), 113 sur 113.
- **Les mutations au sommet** : celles de l'annexe ([`mutations/annexe-sur-8fc10ba.txt`](mutations/annexe-sur-8fc10ba.txt)), C1 à C28 ([`mutations/contre-sur-8fc10ba.txt`](mutations/contre-sur-8fc10ba.txt)) et D1 à D11 ([`mutations/t2-sur-8fc10ba.txt`](mutations/t2-sur-8fc10ba.txt)). Après chaque série, `git status` est propre.
- **La retouche du tour 2** sur un arbre détaché à `8fc10ba` :
  - le banc seul (`git apply --include='scripts/*'`) donne 2 rouges sur 71, les deux passages neufs du texte ;
  - le patch entier donne 113 sur 113 sur les quatre bancs ;
  - sur cet arbre, D1 à D11, D9b (D9 réécrite sur le texte retouché) et D12 (la phrase du constat 1 retirée) sont toutes rouges, sauf D9, introuvable puisque remplacée par D9b ;
  - C1 à C28 donnent 26 sur 26 (C1 et C17 introuvables comme au sommet), et l'annexe est toute rouge. Relevé : [`mutations/mutations-sur-retouche-t2.txt`](mutations/mutations-sur-retouche-t2.txt).
- **La CI**, lue par l'API de GitHub au sommet `8fc10ba`.

## Ce qui n'a pas été établi

1. **La suite entière** n'a été jouée ni au sommet ni sur la retouche du tour 2. La session l'a jouée au sommet (1 458 sur 1 458), et la CI `bancs` est verte. Le patch ne touche, côté scripts, que le banc `preuve-suffisante-anchorpost`.
2. **Un dépôt client réel au schéma 2** : aucun n'a été joué, seulement des dépôts jouets, comme au tour 1.
3. **`migrate manifest` sur un manifeste 1**, et sur une clé hors du schéma 3 dans `contexts[]` : non joué. La seule clé perdue jouée est `featureCriticality[].reason`.
4. **Le niveau P1 d'une preuve** : le fichier `test/x.integration.spec.ts` du banc de réalisation n'a pas été reconnu P1. Le cas `invalid` de la règle moyenne n'y sort donc pas prouvé. Cela confirme le mineur 1 sans établir la grille par niveau, qui n'est pas dans le delta.
5. **`compare` en `enforce`**, sur les écarts que la fiche énumère : joué en `observe` seulement, sans écart.
