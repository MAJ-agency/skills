# `ticket-libre.mjs` lit les fichiers des PR ouvertes, et oublie les branches des PR fermées

Status: ready-for-agent
Type: défaut
Modèle: sonnet — un module de lecture à injection (le modèle est `next-id-branches.mjs`), trois règles écrites ici, et des bancs sur le dépôt jouet du skill `tickets` avec un faux `gh` écrit par le test.
Blocked by: — (aucun fichier du capitaine ; mais `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` changent à chaque ticket, et `tickets/references/scripts/docs/depot-jouet.mjs` et `TABLE-RACINE.md` sont aussi touchés par le ticket 13 : partir d'`origin/main` au moment du lancement, jamais en même temps que le ticket 13)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/monorepo/socle-monorepo/references/scripts/docs/pr-ouvertes.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/pr-ouvertes.test.mjs`, `skills/monorepo/socle-monorepo/references/TABLE-RACINE.md`, `skills/chaine/tickets/references/scripts/docs/ticket-libre.mjs`, `skills/chaine/tickets/references/scripts/docs/ticket-libre.test.mjs`, `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs`, `skills/chaine/tickets/SKILL.md`, `skills/chaine/tickets/references/CONTENU.md`, `skills/chaine/tickets/references/agents/issue-tracker.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 6 (décision `A-14`, défaut 7 et le faux positif du défaut 8). Recouvrement : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), `A-26` (le ticket 14, `next-id`, réutilise la lecture des PR ouvertes de ce ticket). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` au lancement (`4a45634` en 7.15.0, **738 tests**, dont 5 dans `ticket-libre.test.mjs`, quand ce ticket a été écrit). Faits relus à la source sur `4a45634` le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu sur `fedora`** (défaut 7 de la demande) : le même ticket, `SPEC_ALL_INF-26.45`, pris par deux sessions. La seconde a lancé `ticket-libre.mjs`, qui a répondu « LIBRE » : la PR de la première ajoutait le fichier du ticket, mais ni son titre ni sa branche ne portaient l'identifiant. Le script ne lit des PR ouvertes que le titre et la branche (`ticket-libre.mjs:88-99`).

**Le faux positif** (défaut 8, « faux positif de `ticket-libre.mjs` sur le titre d'une PR fermée ») : une branche distante qui porte l'identifiant rend le ticket « PRIS » (`ticket-libre.mjs:79-84`), même quand sa PR est fermée. Abandonner un ticket, c'est fermer la PR et supprimer la branche (`issue-tracker.md:30`), mais une session cloud ne peut pas supprimer une branche (le proxy refuse) : la branche reste, et le ticket aussi.

**Quand le ticket est fait** :

1. Une PR ouverte qui ajoute ou modifie le fichier du ticket le rend « PRIS », quels que soient son titre et sa branche.
2. Une branche distante dont la seule PR est fermée ne compte plus. Une branche sans PR compte toujours (réservation en cours, avant la PR brouillon).
3. Sans `gh`, le repli MCP que le script affiche ne retient que des PR ouvertes qui portent l'identifiant entier, et fait lire leurs fichiers.
4. La lecture des PR ouvertes et de leurs fichiers est un module réutilisable, `scripts/docs/pr-ouvertes.mjs`, que le ticket 14 (`next-id`) réutilisera.

## Où

`tk/` abrège `skills/chaine/tickets/references/scripts/docs/`, `sm/` abrège `skills/monorepo/socle-monorepo/references/scripts/docs/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `sm/pr-ouvertes.mjs` | nouveau | Le module (Décision 1). Modèle de forme : `sm/next-id-branches.mjs` (l. 1-37 : en-tête qui dit ce qu'il lit et pourquoi, outil réel par défaut, injecté pour les tests, échec qui ne lève jamais). |
| `sm/pr-ouvertes.test.mjs` | nouveau | Ses tests, avec un `gh` injecté (fonction), sans réseau ni dépôt. |
| `skills/monorepo/socle-monorepo/references/TABLE-RACINE.md` | 14 | La ligne `references/scripts/docs/*` nomme `pr-ouvertes.mjs` à côté de `next-id.mjs` et `next-id-branches.mjs` : « la lecture des PR ouvertes et de leurs fichiers (`pr-ouvertes.mjs`, `gh api` en REST), que `ticket-libre` et `next-id` partagent ». |
| `tk/ticket-libre.mjs` | 1-19 (en-tête) | Les trois sources deviennent : statut ; branches distantes, sauf celles dont la seule PR est fermée ; PR ouvertes, par titre, branche **ou fichiers**. Le repli sans `gh` décrit en Décision 4. |
| `tk/ticket-libre.mjs` | 21 | Import de `lirePrOuvertes` et `prDeBranche` depuis `./pr-ouvertes.mjs`, à côté de `./identifiants.mjs`. |
| `tk/ticket-libre.mjs` | 79-84 (branches distantes) | Une branche qui porte l'identifiant compte, sauf si aucune PR ouverte ne l'a pour tête **et** qu'une PR fermée l'a (Décision 2). |
| `tk/ticket-libre.mjs` | 86-102 (PR ouvertes) | `lirePrOuvertes()` remplace l'appel `gh` en ligne ; une PR compte si son titre cite l'identifiant (`texteCite`), si sa branche le porte (`branchePorte`), ou si l'un de ses fichiers ajoutés, modifiés, renommés ou copiés correspond à `fichierDuTicket(id)` hors archive (Décision 3). La ligne « PRIS » dit laquelle des trois raisons : `PR #<n> (brouillon) : <titre> [<branche>] — ajoute <fichier>`. |
| `tk/ticket-libre.mjs` | 112-121 (repli) | Décision 4. La ligne `search_pull_requests(…, query: "<id> is:open")` reste mot pour mot : le test de la l. 14 la lit. |
| `tk/ticket-libre.test.mjs` | 1-54 | Les bancs (Ordre de travail) ; un faux `gh` écrit dans `bin` par le test, comme `avancement.test.mjs:106-107`. |
| `tk/depot-jouet.mjs` | 42 (`DU_SOCLE`) | `pr-ouvertes.mjs` ajouté à la liste des fichiers du socle copiés dans les scripts posés : sans lui, `ticket-libre.mjs` ne se charge pas dans le plugin. |
| `skills/chaine/tickets/SKILL.md` | 41 | « `identifiants.mjs`, `next-id.mjs` et `next-id-branches.mjs` » → les quatre, avec `pr-ouvertes.mjs` ; « ces trois fichiers » → « ces quatre fichiers ». |
| `skills/chaine/tickets/SKILL.md` | 63 | « 1 pris » : par la ligne `Status:`, une branche (sauf d'une PR fermée), une PR ouverte (titre, branche ou fichiers) ; « 3 » : le repli fait lire les fichiers des PR ouvertes. |
| `skills/chaine/tickets/references/CONTENU.md` | 3-9 | § « Ce que le skill exige » : quatre fichiers. § `ticket-libre.mjs` : les fichiers des PR ouvertes et la raison (`SPEC_ALL_INF-26.45`, pris deux fois) ; les branches de PR fermées et la raison (une session cloud ne supprime pas une branche). |
| `skills/chaine/tickets/references/agents/issue-tracker.md` | 23 | Même précision que `SKILL.md:63`, et le repli. |
| Version | voir « 3. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

Appelants réels :

- `ticket-libre.mjs` : toute session avant de coder (`CLAUDE.md` du projet, fragment `socle-chaine-de-production/references/fragments/claude-md-fusion.md:5` ; `issue-tracker.md:23` ; `recette-humaine/SKILL.md:66`) ; `/maj-skills:tickets libre <id>`.
- `pr-ouvertes.mjs` : `ticket-libre.mjs` seul dans ce ticket ; `next-id.mjs` au ticket 14.

Règles à lire : l'en-tête de `tk/ticket-libre.mjs` (l. 1-19) et `sm/next-id-branches.mjs` (l. 1-37).

## Décisions

Tenues : `A-14` (lire les fichiers des PR ouvertes en REST, `pulls/<n>/files` ; une PR ouverte qui ajoute ou modifie le fichier du ticket le prend ; une branche dont la PR est fermée ne compte plus ; le repli ne retient que les PR ouvertes, sur l'identifiant entier), `A-26` (la lecture est mutualisée avec `next-id`). Ce que le ticket précise :

1. **Le module `pr-ouvertes.mjs`**, dans `socle-monorepo` (`scripts/docs/` d'un projet), à côté d'`identifiants.mjs`.
   - Raison de la place : `next-id.mjs` vit dans `socle-monorepo` et `ticket-libre.mjs` dans `tickets`, qui importe déjà la grammaire du socle ; l'inverse ferait dépendre le socle d'un skill posé après lui.
   - `lirePrOuvertes({ gh = ghReel, fichiers = true } = {})` rend `{ verifiees: true, prs: [{ numero, tete, brouillon, titre, fichiers: [{ chemin, ancien, statut }] }] }`, ou `{ verifiees: false }` si `gh` manque ou échoue, à n'importe quel appel : jamais une liste partielle.
   - Appels : `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open&per_page=100' --jq '.[] | [.number, .head.ref, .draft, .title] | @tsv'` (celui d'aujourd'hui, l. 91), puis, pour chaque PR, `gh api --paginate 'repos/{owner}/{repo}/pulls/<n>/files?per_page=100' --jq '.[] | [.status, .filename, (.previous_filename // "")] | @tsv'`. REST seulement (GraphQL est refusé depuis les sessions cloud).
   - `prDeBranche(branche, { gh })` rend `'ouverte'`, `'fermee'`, `'aucune'`, ou `null` si `gh` manque ou échoue : `gh api 'repos/{owner}/{repo}/pulls?state=all&per_page=100&head={owner}:<branche encodée>' --jq '.[].state'`.
   - `ghReel` : `execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })`, comme aujourd'hui.
   - Aucune sortie sur la console : le module rend, l'appelant dit.
2. **Les branches distantes.** Une branche qui porte l'identifiant (`branchePorte`) :
   - tête d'une PR ouverte (dans `lirePrOuvertes`) : comptée comme aujourd'hui, ligne `branche distante : <b>` ;
   - sinon `prDeBranche` : `'fermee'` (une ou plusieurs PR, toutes fermées) : ignorée, ligne d'information `branche d'une PR fermée, ignorée : <b>` hors de la liste « PRIS » ; `'aucune'` : comptée (réservation avant la PR brouillon) ; `null` (sans `gh`) : comptée, par prudence, avec la mention « (PR non vérifiée) ».
3. **Les fichiers.** Un fichier de PR prend le ticket si son statut est `added`, `modified`, `renamed`, `copied` ou `changed`, si son chemin correspond à `fichierDuTicket(id)` (qui ne lit pas le slug : un même numéro sous un autre nom est pris), et s'il n'est pas sous `issues/archive/` (`estArchive`). Un fichier `removed`, ou l'ancien chemin d'un renommage, ne prend rien.
4. **Le repli sans `gh`** (sortie 3, inchangée), en plus de la ligne `search_pull_requests` d'aujourd'hui :
   - ne retenir d'un résultat que la PR **ouverte** dont le titre ou la branche porte l'identifiant entier : pas `<id>0`, pas la spec seule (règle de `texteCite`, `identifiants.mjs:145`) ;
   - puis `list_pull_requests(owner, repo, state: "open")`, et pour chaque PR `pull_request_read(method: "get_files", owner, repo, pullNumber)` : le ticket est pris si l'une ajoute ou modifie un fichier dont le nom finit par `<spec>-<slug>.<NN>.issue.md` hors de `issues/archive/` (le motif affiché pour l'identifiant demandé) ;
   - une branche distante déjà vue se vérifie de même : `list_pull_requests(owner, repo, head: "<owner>:<branche>", state: "all")`, toutes fermées → elle ne compte pas.
5. **Le coût** : un appel par PR ouverte, joué une fois par réservation. Pas d'arrêt anticipé quand le titre ou la branche ont déjà pris le ticket : le ticket 14 a besoin de la liste entière, et la ligne « PRIS » nomme toutes les raisons.
6. **Codes inchangés** : 0 libre, 1 pris, 2 usage ou ticket introuvable, 3 PR non vérifiées. Le mot reste « PRIS » (voir `## Comments`).
7. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le nom des champs internes du module, le texte des lignes d'information. Elle ne tranche **pas** : la place du module, « jamais une liste partielle », la branche sans PR qui compte, la branche sans `gh` qui compte.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main` au lancement. Chaque banc est vu rouge avant le code qui le rend vert.

### 1. Les bancs, chacun vu rouge

`sm/pr-ouvertes.test.mjs` (le module, `gh` injecté) :

- **« lirePrOuvertes : les PR ouvertes et leurs fichiers, toutes pages lues ; gh absent ou en échec à un appel : verifiees faux, jamais une liste partielle »** ;
- **« prDeBranche : ouverte, fermée, aucune ; gh en échec : null »**.

**Rouge sur `main`** : le module n'existe pas.

`tk/ticket-libre.test.mjs`, avec un faux `gh` (un script Node écrit dans `bin`, qui répond selon l'URL de son argument et ignore `--jq` en rendant directement les lignes TSV attendues) :

1. **« pris : une PR ouverte ajoute le fichier du ticket, sans l'identifiant ni dans son titre ni dans sa branche »**. Attendu : sortie 1, `PRIS`, la ligne nomme la PR et le fichier. **Rouge sur `main`** : sortie 0, `LIBRE` (le cas `SPEC_ALL_INF-26.45`).
2. **« pris : une PR ouverte ajoute le même numéro sous un autre slug »**. **Rouge sur `main`** : `LIBRE`.
3. **« libre : une PR ouverte qui supprime le fichier, ou l'archive, ne prend rien »**. Vert sur `main` ; il garde la règle.
4. **« libre : la branche distante d'une PR fermée ne prend plus le ticket ; sans PR, elle le prend toujours »**. Attendu : sortie 0 et la ligne d'information pour la première ; sortie 1 pour une branche sans PR. **Rouge sur `main`** : sortie 1 pour la première.
5. **« sans gh, le repli fait lire les fichiers des PR ouvertes et ne retient que l'identifiant entier »**. Attendu : sortie 3, la ligne `search_pull_requests(…, query: "SPEC_ALL_SOC-1.03 is:open")` d'aujourd'hui, puis `get_files` et le motif du fichier. **Rouge sur `main`** : ni `get_files` ni motif.

Les tests de la l. 10 à la l. 54 restent verts sans changer : sans `gh` (PATH réduit à `git` et `node`), les branches comptent par prudence, comme aujourd'hui.

### 2. Le code

`pr-ouvertes.mjs`, puis `depot-jouet.mjs` (`DU_SOCLE`), puis `ticket-libre.mjs`, puis les textes (`TABLE-RACINE.md:14`, `tickets/SKILL.md`, `CONTENU.md`, `issue-tracker.md`).

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, un fichier nouveau posé par `socle-monorepo` : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne (sa section 5), recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  `ticket-libre.mjs` lit les fichiers des PR ouvertes : une PR qui ajoute ou modifie le fichier du ticket le prend, même si ni son titre ni sa branche ne portent l'identifiant. La branche distante d'une PR fermée ne prend plus le ticket. Sans `gh`, le repli fait lire les fichiers des PR ouvertes par l'outil GitHub MCP. La lecture des PR ouvertes est un module du socle, `scripts/docs/pr-ouvertes.mjs`.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Dans une PR du projet, **d'abord** recopier `pr-ouvertes.mjs` et `pr-ouvertes.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/scripts/docs/` vers `scripts/docs/` : sans eux, le `ticket-libre.mjs` reposé ne se charge pas.
  3. Puis reposer : `/maj-skills:tickets poser` (son `ticket-libre.mjs` et son test, `depot-jouet.mjs`).
  4. `node --test scripts/docs/*.test.mjs` : vert.

  **Iroki** : son `ticket-libre.mjs` est d'une version plus ancienne, qui lit encore les formes courtes (`ABC-1.03`) et importe de son `identifiants.mjs` `normaliser`, `formeCourte` et `slug`, sans `branchePorte`, `texteCite` ni `fichierDuTicket`. Le reposer tel quel demande aussi l'`identifiants.mjs` du socle, qui ne lit plus les formes courtes. Sinon, son conducteur réécrit le correctif dans sa version : `pr-ouvertes.mjs` recopié, puis la lecture des fichiers et des branches de PR fermées.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Le module : liste entière ou rien, état de la PR d'une branche | `skills/monorepo/socle-monorepo/references/scripts/docs/pr-ouvertes.test.mjs` « lirePrOuvertes : … », « prDeBranche : … » |
| PR ouverte qui ajoute le fichier, sans identifiant | `ticket-libre.test.mjs` « pris : une PR ouverte ajoute le fichier du ticket, sans l'identifiant ni dans son titre ni dans sa branche » |
| Même numéro, autre slug | `ticket-libre.test.mjs` « pris : une PR ouverte ajoute le même numéro sous un autre slug » |
| Suppression et archivage ne prennent rien | `ticket-libre.test.mjs` « libre : une PR ouverte qui supprime le fichier, ou l'archive, ne prend rien » |
| Branche d'une PR fermée ignorée, branche sans PR comptée | `ticket-libre.test.mjs` « libre : la branche distante d'une PR fermée ne prend plus le ticket ; sans PR, elle le prend toujours » |
| Repli sans `gh` | `ticket-libre.test.mjs` « sans gh, le repli fait lire les fichiers des PR ouvertes et ne retient que l'identifiant entier » |
| Scripts posés dans un projet | `scripts/poses.test.mjs` (rejoue `scripts/docs/` posé, `socle-monorepo` compris) |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/monorepo/socle-monorepo/references/scripts/docs/pr-ouvertes.test.mjs` ;
   - `node --test skills/chaine/tickets/references/scripts/docs/ticket-libre.test.mjs` ;
   - `node --test scripts/poses.test.mjs scripts/depot.test.mjs`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - les fichiers des PR non lus : le banc 1 rougit ;
   - une branche de PR fermée comptée : le banc 4 rougit ;
   - `lirePrOuvertes` rend une liste partielle quand un appel de fichiers échoue : le test du module rougit.
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(tickets): ticket-libre lit les fichiers des PR ouvertes, oublie les PR fermées (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- `next-id` (lecture des PR ouvertes, de `origin/develop`, des sujets, numérotation `.NN`) : ticket 14, qui importe `pr-ouvertes.mjs`.
- Une ref de suivi fabriquée sur place (`socle/CONTENU.md:13`, « `ticket-libre`, `next-id` et la couverture du diff la lisent encore ») : inchangé.
- La suppression des branches abandonnées : un geste d'un poste local.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, et sur `develop` d'Iroki (`e3dbd235`) pour son `ticket-libre.mjs`. Écarts avec la spec et choix à confirmer :
  - **« OCCUPÉ »** (`A-14`) : le script dit déjà « PRIS » (l. 108), que lisent ses tests, `tickets/SKILL.md:63` et `issue-tracker.md:23`. Le ticket garde « PRIS » : même sens, aucun mot nouveau.
  - **Le faux positif « sur le titre d'une PR fermée »** (demande, défaut 8) : le script ne lit le titre que des PR ouvertes. Ce qui rend un ticket pris à tort est la branche restée sur `origin` après la fermeture de sa PR ; c'est elle que le ticket corrige (Décision 2), comme le dit `A-14`.
  - **Une branche sans `gh` compte toujours** : `A-14` ne dit pas comment savoir, sans `gh`, qu'une PR est fermée. Par prudence, la branche compte, et le repli dit comment la vérifier.
  - **Place du module** : `socle-monorepo`, à côté de la grammaire, et non `tickets` (Décision 1). Conséquence : le skill `tickets` exige un quatrième fichier du socle, et un projet le recopie avant de reposer (note de version).
  - **Fichiers chauds partagés avec le ticket 13** (`tk/depot-jouet.mjs`, `TABLE-RACINE.md:14`) : le ticket 13 y ajoute `environnement-de-banc.mjs`. Les deux ne partent pas ensemble ; le second rattrape le premier par une fusion de `main`.
