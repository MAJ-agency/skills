# Le dépôt prêt à être public : plus de nom de client, de personne, de session ni de coût dans ce qu'il porte, et un banc qui en refuse le retour

Status: needs-info
Type: tâche
Modèle: opus — un remplacement sur plusieurs centaines de lignes de `docs/` où chaque occurrence se lit (un nom de projet dans un constat n'a pas le même remplaçant qu'un nom de dépôt dans une commande), des exemples de tests de skills à renommer sans casser leurs assertions, et un banc neuf dont les motifs se règlent contre le dépôt entier ; à repasser en `sonnet` si le produit tranche les questions et que le relevé privé est découpé en lots par dossier.
Blocked by: — (les questions au produit, en fin de ticket, bloquent le passage à `ready-for-agent`)
Dépendances: —
Fichiers chauds: `docs/programmes/*.programme.md` et `*.passation.md` (cartes vivantes : l'architecte y écrit à chaque tour) ; `docs/issues/gouverner-nos-boucles/map.md` et `passation/` ; `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` (chaque ticket livré les touche) ; les tests des skills `tickets`, `revue-de-ticket`, `fusionner`, `criticite`, `socle-monorepo`, `socle-tests` (exemples d'identifiants).

## Le besoin

`MAJ-agency/skills` est public. Il porte encore, en clair, ce qu'un dépôt public ne doit pas porter :

- les **noms des dépôts de projets clients** que les programmes ont outillés, et le nom du produit de lecture de la MOA hors du skill qui le branche ;
- les **sigles réels des clients** de ces projets, comme contexte d'identifiant (`RULE_<CTX>_…`, `SPEC_<CTX>_…`), comme chemin d'exemple (`<dossier>/<sigle>/…`) et dans le mot qui nomme leur secteur ;
- les **trigrammes réels** d'un projet (`SPEC_ALL_<TRI>-n` d'une spec réelle, avec son numéro et son ticket), là où le standard n'a besoin que d'un exemple ;
- les **identifiants de session** de la plateforme (architectes, capitaines, conducteurs, filles, rédacteurs), avec leurs dates, leur modèle et le compte qui les a ouvertes ;
- les **coûts** de chaque session, en dollars, souvent à côté de son rôle et de son identifiant ;
- le **nom et le prénom du responsable du produit**, dans les cartes (ligne `Responsable:`), dans des tickets qui citent sa décision, dans un nom de branche qui porte ses initiales, et comme auteur du plugin.

Aucune adresse électronique réelle n'est dans les fichiers : les tests n'utilisent que des domaines réservés (`example.org`) et des adresses de service. L'adresse de l'auteur est dans les métadonnées des commits, pas dans l'arbre.

Le besoin : **ce que l'arbre de `main` porte ne nomme plus ni client, ni projet client, ni personne, ni session, ni coût de session ; et un banc du dépôt refuse qu'ils reviennent**, sans que le banc lui-même ne les écrive.

## Le relevé

Fait le 2026-11-27 sur `origin/main` à `3daedcd` (plugin 8.5.0) et sur la branche du programme, `claude/jolly-mayer-5c9pr2`, dont la documentation est plus récente. **Le détail (fichier, ligne, valeur) est privé, hors du dépôt** : la session qui code ce ticket le reçoit de son lanceur, jamais par un commit, une PR ou un commentaire. Les comptes ci-dessous sont des lignes / fichiers trouvés par `git grep` ; « branche » compte l'arbre de la branche du programme.

| Catégorie | `skills/` (main) | `docs/` (main) | `docs/` (branche) | Hors `skills/` et `docs/` | Nature |
| --- | --- | --- | --- | --- | --- |
| Noms des deux dépôts de projets clients | 24 / 10 | 474 / 54 | 563 / 75 | 24 / 4 (`NOTES-DE-VERSION.md` 21, `scripts/` 3) | constats « vécu sur … », commentaires de tests, cartes, specs, tickets |
| Sigles réels de clients comme contexte d'identifiant (`RULE_<CTX>_`, `SPEC_<CTX>_`) | 104 / 24 | 6 / 3 | 14 / 7 | 0 | exemples des skills et de leurs tests ; trois sigles distincts |
| Sigles réels en chemin, et le mot qui nomme le secteur des clients | 34 / 17 | 28 / 8 | 36 / 14 | 0 | `<dossier>/<sigle>/…` d'exemple ; le mot du secteur |
| Trigramme du produit de lecture comme spec réelle (`SPEC_ALL_<TRI>-n`, `RULE_ALL_<TRI>-n`) | 21 / 14 | 159 / 6 | 565 / 61 | 17 / 5 | numéros de spec et de règle réels d'un projet |
| Nom du produit de lecture | 276 / 61 (dont 89 / 9 dans son propre skill) | 408 / 38 | 2 248 / 202 | 99 / 8 | voir « Ce qui reste douteux », point 1 |
| Identifiants de session réels (`session_0…`) | 0 (un fictif) | 248 / 5 | 473 / 21 | 0 (un fictif, `scripts/`) | lignes `Architecte:`, `Capitaine…:`, journaux, passations |
| Coûts de session en dollars | 0 réel (8 / 3 fictifs de tests ; 5 / 1 ordres de grandeur anonymes, voir plus bas) | 75 / 8 | 217 / 22 | 0 | `N,NN $` à côté d'un rôle ou d'un identifiant |
| Nom de la personne (nom, prénom, initiales) | 0 | 7 / 6 | 30 / 25 | 3 / 3 (`.claude-plugin/plugin.json`, `marketplace.json`, `LICENSE`) | `Responsable:`, « décision de … », nom de branche, auteur |
| Adresses électroniques réelles | 0 | 0 | 0 | 0 | seulement `example.org`, `noreply@…` |

Ce qui **n'est pas** un vrai nom et reste, parce que le standard en a besoin comme exemple : `SPEC_ALL_SOC-1` et ses tickets, `ADR_ALL_ARC-n`, les contextes et trigrammes déjà fictifs des tests (`ALL`, `XYZ`, `ZZZ`, `ABC`, `NORD`, `DEMO`, `X`, `Y`), les trigrammes de domaine génériques (`LIC`, `FAC`, `PAY`, `STR`… : un domaine, pas un client), l'identifiant de session fictif `session_01AbCdEfGhIjKlMnOpQrStUv` de `skills/chaine/relecture/references/verdict.md` et `scripts/relecture.test.mjs`, les coûts fictifs des tests de `tickets` (`couts.test.mjs`, `tickets.test.mjs`), le nom de l'organisation propriétaire du dépôt (`MAJ-agency`), les noms des branches `claude/<mot>-<mot>-<hachage>` (sans initiales).

## Décisions

Numérotées provisoirement, à reporter sur la carte par l'architecte.

**`A-253` (proposée) — La règle de remplacement, par catégorie.** Chaque occurrence se lit ; le remplaçant dépend du rôle de la phrase, jamais un rechercher-remplacer aveugle :

| Catégorie | Remplaçant |
| --- | --- |
| Nom d'un dépôt de projet client | « un projet », « le premier projet », « un deuxième projet » quand la phrase en distingue deux ; dans une commande ou un chemin d'exemple, `<projet>` ; un numéro de PR d'un autre dépôt (`<projet> #1986`) devient « une PR d'un projet » |
| Sigle de client en contexte d'identifiant | un contexte fictif à un seul sens dans tout le dépôt, `NORD` pour le premier, `SUD` pour le second, `EST` pour le troisième ; l'identifiant garde sa forme (`RULE_NORD_LIC-05`), ses assertions et ses chemins (`docs/metier/regles/nord/…`) suivent |
| Sigle en chemin, mot du secteur | `clients/<slug>/` pour le chemin d'exemple, « un client » ou « un contexte » pour le mot |
| Trigramme réel d'un projet, numéro réel | dans `skills/` : `SPEC_ALL_SOC-1` (déjà l'exemple du standard) ou `SPEC_ALL_XYZ-1` ; dans `docs/` : « la spec du produit de lecture » ou « une règle du projet », sans numéro, sauf quand le numéro est la preuve d'un constat, où il devient `<spec du projet>.<NN>` |
| Identifiant de session | `<session>` ; quand la phrase en distingue plusieurs, le rôle (« l'architecte du 2026-11-23 », « le deuxième capitaine ») ; jamais un identifiant abrégé |
| Coût d'une session | retiré ; un coût utile à une décision de méthode s'écrit agrégé et sans rôle ni session (« un ticket Sonnet coûte de l'ordre de 4 $ »), comme le fait déjà `chaine-de-production.md` du socle |
| Nom de la personne | « le responsable du produit » (ligne `Responsable:` comprise) ; « décision du produit » à la place de « décision de … » |
| Initiales dans un nom de branche cité | le nom de la branche est cité tel quel s'il est vivant (on ne renomme pas une branche distante) ; sinon « la branche du 2026-11-23 » |

Les cartes vivantes (`docs/programmes/*.programme.md`, `docs/issues/*/map.md`) suivent la même règle **pour l'avenir** : l'architecte n'y écrit plus d'identifiant de session ni de coût par session. Où se tient alors l'état vivant qui en a besoin (qui est en vie, qui relever, quoi archiver) : question 1.

**`A-254` (proposée) — L'historique git n'est pas réécrit.** Ce ticket corrige l'arbre de `main` par un commit ordinaire. Il ne réécrit, ne force et ne supprime rien : réécrire l'historique est interdit (hooks d'agent : pas de push forcé), et le ticket ne le contourne pas. Ce qu'il ne fait donc **pas**, et qu'il écrit dans sa PR et dans `NOTES-DE-VERSION.md` :

- les anciens commits de `main` gardent tout ce qui est relevé ici, lisibles par `git log -p`, par un clone complet et sur GitHub ;
- les messages de commit gardent leurs lignes d'attribution à identifiant de session, et chaque commit garde son auteur (nom et adresse) ;
- les branches distantes déjà poussées, les PR, leurs corps et leurs commentaires sur GitHub ne sont pas touchés ;
- les attributions des commits à venir (ligne d'identifiant de session) sont fixées par la plateforme, hors de ce dépôt.

Sortir ce qui est dans l'historique demande une décision du produit (question 2) ; aucune session de la chaîne ne la prend.

**`A-255` (proposée) — Un banc du dépôt refuse le retour, en deux couches.** `scripts/depot-public.test.mjs`, joué par `pnpm test` (le motif `scripts/*.test.mjs` de `package.json` le prend déjà, donc la CI aussi), sur `git ls-files` :

1. **Motifs génériques, dans le dépôt** — ils ne nomment rien de réel :
   - un identifiant de session `session_0[0-9A-Za-z]{20,}`, hors une liste d'identifiants fictifs écrite dans le banc (aujourd'hui un seul) ;
   - un montant `[0-9]+([,.][0-9]+)? ?\$` ou `USD` hors d'une liste de chemins permis (les tests de `tickets`, `chaine-de-production.md` du socle et l'ADR qui en dérive) ;
   - une adresse électronique dont le domaine n'est pas réservé (`example.org`, `example.com`, `example.net`) ni de service (`noreply@github.com`, `noreply@anthropic.com`, `git@github.com`) ;
   - un identifiant `(RULE|SPEC|ADR|DSG|DOC|REQ)_<CTX>_` dont le `<CTX>` n'est pas dans la liste fermée des contextes fictifs du standard (`ALL`, `NORD`, `SUD`, `EST`, `ABC`, `XYZ`, `DEMO`, `X`, `Y`…) : c'est cette liste blanche, et non une liste noire, qui tient les sigles de clients hors du dépôt sans les écrire ;
   - une ligne `Responsable:` qui n'est pas « le responsable du produit ».
2. **Une liste privée, hors du dépôt** — les noms de dépôts clients, du produit de lecture hors de son skill, de la personne, et les trigrammes réels qu'aucun motif générique ne prend. Elle n'est jamais commitée, ni en clair ni en empreintes (des empreintes de sigles courts se retrouvent par dictionnaire : elles diraient quels clients sont clients). Le banc la lit dans une variable d'environnement (`DEPOT_PUBLIC_MOTS`, un mot ou un motif par ligne), posée en CI par un secret du dépôt et en local par qui la détient. Sans elle, le banc joue la couche 1 seule et le dit (« liste privée absente : motifs génériques seuls ») ; en CI sur `MAJ-agency/skills` lui-même (`GITHUB_REPOSITORY`), son absence est un échec. Un refus nomme le fichier et la ligne, **jamais le mot de la liste privée** (« mot de la liste privée n° 3 »), pour qu'un journal de CI public ne le recopie pas.

Le banc est un banc **de ce dépôt** : aucun skill ne le pose dans un projet (un projet privé a le droit de nommer ses clients), et il ne s'ajoute pas au contrat du socle.

## Ce qui reste douteux

1. **Le nom du produit de lecture.** C'est aussi le nom d'un skill du plugin, d'un paquet publié publiquement, et il est déjà dans la description du plugin et le `README.md`. Le ticket propose de le garder dans son skill, dans `README.md`, `.claude-plugin/` et `NOTES-DE-VERSION.md` (il y nomme le skill), et de le retirer de `docs/` quand il désigne le dépôt du projet plutôt que le skill. À confirmer (question 3).
2. **Les ordres de grandeur de coût** de `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` (5 lignes, « mesuré sur un premier projet ») sont des coûts réels, mais sans session, sans rôle nominatif ni projet nommé ; ils fondent des règles de méthode. Le ticket les garde, en liste permise du banc.
3. **Le volume de `docs/`** : plus de 2 000 lignes sur la branche du programme, dans des cartes que l'architecte réécrit à chaque tour. Un remplacement qui part de `main` entrera en conflit avec la branche du programme ; le ticket se joue soit après que la documentation du programme est entrée dans `main`, soit en deux temps (`skills/`, `scripts/`, racine d'abord ; `docs/` ensuite).
4. **Les cartes et passations closes** pourraient sortir du dépôt public plutôt que d'être récrites : elles n'y servent plus qu'à l'histoire. Le ticket ne tranche pas (question 4).

## Quand le ticket est fait

1. `git grep` des motifs de la couche 1 sur `main` ne rend que les fictifs et les chemins permis du banc.
2. Joué avec la liste privée, le banc est vert sur l'arbre de `main` ; sans elle, il le dit et joue la couche 1.
3. Chaque test de skill dont un exemple a changé de contexte (`NORD`, `SUD`, `EST`) passe, ses chemins de jouet suivis ; la suite entière passe.
4. Aucun texte, commit, PR ni commentaire de ce ticket ne recopie une valeur du relevé privé ; la PR donne les comptes par catégorie avant et après, pas les valeurs.
5. `NOTES-DE-VERSION.md` dit ce qui a été retiré, par catégorie, et ce qui reste dans l'historique (`A-254`) ; la version est la suivante de `main` au troisième chiffre.
6. `docs/agents/` dit, en une phrase, la règle d'écriture pour l'avenir (catégories et remplaçants d'`A-253`), et que le banc la tient.

## Où

| Dossier | Ce qui change |
| --- | --- |
| `skills/chaine/tickets/`, `revue-de-ticket/`, `fusionner/`, `criticite/`, `sujet/`, `socle-chaine-de-production/`, `architecte/` ; `skills/monorepo/socle-monorepo/`, `socle-tests/` | exemples d'identifiants et de chemins à contexte réel, constats « vécu sur … » des `SKILL.md`, `CONTENU.md` et commentaires de tests ; la description du skill `tickets` (frontmatter) cite un identifiant à contexte réel |
| `skills/chaine/<skill du produit de lecture>/` | un chemin d'exemple au mot du secteur (`SKILL.md`, ligne de l'exemple du manifeste) ; le nom du produit reste (douteux, point 1) |
| `docs/programmes/` | lignes `Responsable:`, `Architecte:`, `Capitaine…:`, journaux, coûts |
| `docs/issues/gouverner-nos-boucles/` (carte, passations, tickets, annexes, relectures), `capitaine-a-jour-et-teste/`, `standard-documentation/`, `definitions-d-agents/` | toutes catégories |
| `NOTES-DE-VERSION.md`, `scripts/` (trois commentaires) | noms de dépôts de projets |
| `.claude-plugin/plugin.json`, `marketplace.json`, `LICENSE` | **inchangés tant que la question 5 n'est pas tranchée** |
| `scripts/depot-public.test.mjs` | neuf (`A-255`) |
| `.github/workflows/ci.yml` | le secret `DEPOT_PUBLIC_MOTS` passé en variable d'environnement au pas `pnpm test` ; le secret lui-même se pose par un admin, hors de ce ticket |

## Surfaces

| Surface | Preuve |
| --- | --- |
| un identifiant de session réel ajouté à un fichier suivi est refusé ; le fictif passe | banc, cas d'un fichier jouet |
| un montant hors des chemins permis est refusé | banc |
| une adresse à domaine non réservé est refusée | banc |
| un contexte d'identifiant hors de la liste blanche est refusé, sans que le banc écrive un contexte réel (le cas de test utilise un contexte inventé, `QWZ`) | banc |
| un mot de la liste privée est refusé et le refus ne le cite pas | banc, liste privée jouet passée par la variable d'environnement |
| sans liste privée, la couche 1 seule, dite ; en CI du dépôt, échec | banc, `GITHUB_REPOSITORY` simulé |
| l'arbre de `main` passe le banc | `pnpm test` |

## Vérification

```bash
timeout 600 node --test scripts/depot-public.test.mjs
DEPOT_PUBLIC_MOTS="$(cat <liste privée hors du dépôt>)" timeout 600 node --test scripts/depot-public.test.mjs
env -u NODE_PATH timeout 1800 pnpm test
```

Mutations, chacune seule, le fichier remis après : un identifiant de session réel de forme valide ajouté à un ticket ; « 12,34 $ » dans une carte ; un contexte inventé dans un exemple de skill ; un mot de la liste privée jouet dans `README.md`. Chacune rougit le banc.

## Questions au produit, non tranchées

1. **Où se tient l'état vivant des programmes** (sessions en vie, à relever, à archiver, coûts) si les cartes du dépôt public ne le portent plus : un dépôt privé, un artefact privé, ou la carte garde `<session>` et l'architecte retrouve les sessions par `list_sessions` et leurs étiquettes ?
2. **L'historique** : le garder tel quel (ce ticket), ou le sortir — ce qui ne se fait que par une décision du produit, hors de la chaîne (nouveau dépôt public à partir d'un arbre propre, l'ancien rendu privé ; ou réécriture faite par un humain) ? Et les PR et commentaires déjà publiés sur GitHub ?
3. **Le nom du produit de lecture** : reste-t-il, puisqu'il nomme un skill et un paquet public (point 1 des doutes) ?
4. **Les cartes et passations closes** : récrites, ou retirées du dépôt public ?
5. **Le responsable du produit comme auteur** : son nom reste-t-il dans `.claude-plugin/plugin.json`, `marketplace.json` et le titulaire du droit d'auteur de `LICENSE`, ou l'organisation le remplace-t-elle ? (Un changement de titulaire de licence n'est pas un changement de texte.)
6. **Le secteur des clients** : le mot qui le nomme est-il à retirer partout, ou seulement quand il accompagne un sigle ?

## Hors périmètre

- La réécriture de l'historique, des branches distantes, des PR et de leurs commentaires (`A-254`).
- Les dépôts des projets : ils sont privés et nomment leurs clients librement ; aucun skill ne leur pose ce banc.
- La ligne d'attribution des commits de la plateforme.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur, relevé fait sur `origin/main` à `3daedcd` et sur `claude/jolly-mayer-5c9pr2`. Le relevé détaillé est privé et n'est pas dans le dépôt. `needs-triage` : six questions au produit avant de le rendre prêt.
