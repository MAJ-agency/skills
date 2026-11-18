# Capitaine à jour et testé — spec du chantier 1

Programme : [`../../programmes/capitaine-a-jour-et-teste.programme.md`](../../programmes/capitaine-a-jour-et-teste.programme.md). Décisions du produit : `P-1`, `P-2`, `P-4` et `P-6` (2026-11-18 ; `P-3` remplacée par `P-6`). État : **validée par le produit le 2026-11-18** (`P-4`) ; un ticket par lot ci-dessous, le lot 1 en premier, lancés par l'architecte (`A-17`).

## Le problème

Une PR peut entrer alors que la combinaison « PR + dernier état de la branche cible » n'a jamais été testée. Le 2026-11-18, sur `fedora` (plugin 7.14.0), deux sous-PR entrées en retard sur leur sujet ont apporté chacune le même import ; l'erreur n'est apparue qu'à la PR suivante. Vers `develop`, deux PR ont été squashées sur un `develop` que leur sommet testé ne contenait pas, malgré le réglage « strict » de GitHub. Le même jour, d'autres défauts de la chaîne ont fait perdre des heures : une PR en conflit bloquée sans issue, deux capitaines qui prennent la même PR, des sessions coupées que personne n'a vues.

## Faits relevés à la source (`main` de `skills` à `4a45634`, plugin 7.15.0)

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`, `socle/` abrège `skills/chaine/socle-chaine-de-production/references/`.

- **Vers un sujet.** `suj/sujet.sh` `fusionner` lit les checks une fois sur le sommet de la sous-PR (l. 742-756), sans attente. `mettre_a_jour_sous_pr` (l. 497-537) ne pousse rien quand la fusion du sujet est propre (l. 501-503) : elle ne pousse que sur un conflit limité aux index générés. Le squash se fait ensuite sur l'ancien sommet (l. 771-775). Aucune CI ne tourne sur un push vers `sujet/**` : `socle/ci/ci.yml` ne déclenche `push` que sur `develop` et `main`.
- **Vers `develop`.** `fus/passer.sh` met la PR à jour au début de son passage (l. 202) et attend sa CI (l. 289-336). Ensuite, il ne revérifie que le sommet de la PR (l. 337), jamais `develop`. Le `sha` passé à l'API de fusion (l. 363) ne protège que la tête de la PR. Après le squash, un arbre différent de l'arbre testé produit seulement le log « à examiner » ; le script sort en 0 (l. 381-393).
- **Les bancs.** Le faux GitHub (`suj/faux-gh.mjs`) n'applique pas « strict » : sa fusion (l. 285-310) ne refuse que si la tête a bougé. Ses checks sont rangés par PR, pas par commit (`checksDe`, l. 137).
- **Défauts voisins.**
  - Confirmés : 1 (`file.sh:83-90` et `:113`, `boucle.sh:296-303`, `sujet.sh:885-892`), 3 (`file.sh:96` ne filtre que sur le label ; le verrou `boucle.sh:59-62` est local au clone), 4 (`architecte/SKILL.md:73`, `chantier/SKILL.md:23` et `:87`), 5 (`chaine-de-production.md` § 5, `lancement.md:72-77`), 7 (`tickets/references/scripts/docs/ticket-libre.mjs:88-99` ne lit que le titre et la branche des PR ouvertes).
  - Défaut 8, confirmé pour `livrer` (`sujet.sh:870-871`), pour `fait_sur` (`sujet.sh:189`, `grep -m1 | grep -q` sans `|| true`, appelé par `demarrer`) et pour `github.sh:216`.
  - Défaut 6, déjà en grande partie traité : `chantier/SKILL.md:88` mesure le contexte par `get_session`.
  - Défaut 2, mécanisme confirmé : les commits de fusion des scripts portent le message par défaut de git, sans mention possible (`passer.sh:202`, `:254-263`, `sujet.sh:501`, `:528`, `:797`, `:822`, `:885`). Le hook qui exige `[sans-migration: …]` appartient au projet, pas au plugin.
  - Le catalogue des gates n'a de générateur dans aucun skill du plugin.

## Ce qui change, vu par le produit

- **Aucune PR n'entre sans avoir été testée sur l'état de la branche où elle entre.** Cela vaut vers `develop` comme vers un sujet. Le capitaine le vérifie juste avant de fusionner, et compare après coup ce qui est entré à ce qui a été testé. Sans exception (`P-6`) : même un retard de documentation fait mettre à jour la PR et la retester. Un écart découvert après la fusion arrête le capitaine et se signale.
- **Une sous-PR en retard de code est mise à jour et retestée par le capitaine**, plus jamais squashée telle quelle. Le conducteur n'étiquette qu'une sous-PR de code à la fois par sujet : sinon, chacune remet la suivante en retard et la CI repasse à chaque fois.
- **Une PR en conflit ne bloque plus personne en silence.** Un conflit limité aux index générés est résolu par le capitaine. Tout autre conflit est renvoyé à sa session.
- **Le nombre de capitaines sur un dépôt n'a plus d'importance** (`P-2`) : ils prennent tous la même file, et une PR en cours de passage porte un commentaire qui la réserve au capitaine qui la traite.
- **Une session coupée se voit dans l'heure** : l'architecte et le conducteur relèvent l'état de leurs sessions à intervalle fixe et le disent au produit.
- **Chaque version du plugin a sa note**, qui dit ce qu'un projet doit faire pour en profiter.

## Décisions de conception (architecte)

- `A-1` — **La règle d'ascendance est une seule fonction, partagée par `passer.sh` et `sujet.sh`**, dans `github.sh` ou un module Node testé à part. Elle prend le sommet testé et la cible, et rend l'un de quatre verdicts : `à-jour`, `retard`, `conflit-index` (conflit limité aux index générés), `conflit`. Elle se fonde sur `git merge-base --is-ancestor` et sur un essai de fusion, jamais sur une lecture à l'œil. Raison : deux copies de la règle divergeraient, et c'est exactement ce qui s'est passé entre `passer.sh` et `sujet.sh`.
- `A-2` — **Aucune exception pour la documentation** (`P-6`, qui remplace `P-3`) : tout retard, quels que soient ses fichiers, fait mettre à jour la PR et attendre sa CI. Il n'y a donc ni clé `cheminsDeCode`, ni tri du retard, ni lecture du réglage « à jour » de GitHub. Raisons :
  - plusieurs contrôles du dépôt lisent la documentation (gate des tickets, index Anchorpost, identifiants), donc une combinaison non testée peut casser même sans code ;
  - une seule règle partout, sans réglage par projet ;
  - le coût se limite à une CI de plus quand le retard n'est que de la documentation.
- `A-3` — **Le contrôle se fait juste avant l'appel de fusion**, après un `git fetch` de la cible, et non plus seulement au début du passage. Selon le verdict :
  - `à-jour` : fusion ;
  - `retard` ou `conflit-index` : le script reprend la mise à jour et l'attente de la CI, deux fois au plus dans un même passage. Au-delà, il sort en 5, et la boucle relance comme aujourd'hui ;
  - `conflit` hors index : renvoi (`fusion-bloquée`), sans résolution.

  Raison : la cible bouge pendant l'attente de la CI (cas vécu le 2026-11-18).
- `A-4` — **Après le squash, l'arbre du squash est comparé à l'arbre attendu** : l'arbre du sommet testé. Un écart devient une **sortie dédiée** (un code non utilisé aujourd'hui). La boucle la traite en ARRÊT : elle écrit sur la PR le commentaire « arbre du squash ≠ arbre testé », avec les deux arbres et la liste des fichiers qui diffèrent, puis s'arrête. Le capitaine le dit à son lanceur. Raison : une fusion ne se défait pas d'elle-même, il faut un humain ; aujourd'hui l'écart n'est qu'un log que personne ne lit.
- `A-5` — **`sujet.sh fusionner` suit la même règle et attend la CI lui-même.** L'attente de `passer.sh` (apparition du nouveau sommet, apparition des checks exigés, verdict) passe dans `github.sh`, et les deux scripts l'appellent. Le cas `retard` d'une sous-PR fait donc trois choses : fusionner le sujet dans la branche de la sous-PR, régénérer les index et pousser ; attendre la CI de la PR sur ce sommet ; refaire le contrôle, puis squasher. La sortie 8 actuelle (« mise à jour poussée, repasser plus tard ») ne sert plus que si l'attente dépasse son délai. Raison : le produit veut que le capitaine fasse la mise à jour lui-même, et la CI d'une PR vers `sujet/**` est la seule qui teste « sous-PR + sujet ».
- `A-6` — **Les bancs d'abord : le faux GitHub apprend « strict » et range ses checks par commit.** Sans cela, aucun banc ne peut montrer le défaut. Les quatre bancs demandés par le produit sont exigés dans le ticket du lot 1, chacun vu rouge sur `main` :
  - sous-PR en retard de code refusée puis mise à jour ;
  - retard de documentation seule : mis à jour et retesté lui aussi ;
  - cible qui bouge pendant la CI ;
  - arbre du squash différent de l'arbre testé.
- `A-7` — **Un conflit se détecte avant la lecture des checks** (défaut 1). `sujet.sh fusionner` et `relancer` essaient d'abord la fusion localement :
  - un conflit limité aux index générés suit le chemin de mise à jour de `A-5`, et `relancer` ne sort plus en 2 dans ce cas ;
  - tout autre conflit est renvoyé.

  `file.sh` lit l'état de fusion de la PR et affiche « en conflit » au lieu de « prête (sans CI) ». Raison : GitHub ne lance pas la CI d'une PR en conflit, donc lire les checks d'abord tourne en rond.
- `A-8` — **Clé de contrat `fusionsSansEffet`**, une liste d'entrées `{ "fichier", "lignesSansEffet", "mention" }`. Elle s'applique quand un commit de fusion joué par un script apporte un changement à `fichier` (diff entre le sommet de la branche avant la fusion et le résultat). Si chaque ligne ajoutée ou retirée correspond à l'expression `lignesSansEffet` (un commentaire, une ligne vide), le script ajoute `mention` au message du commit. Sinon, il s'arrête en disant quel fichier porte un changement réel. Le gabarit la laisse vide ; la note de version donne l'entrée de `schema.prisma` pour un projet Prisma. Raison : le hook appartient au projet, le plugin ne connaît ni Prisma ni la mention. Une clé générique, vérifiée par diff, fait ce que demande le produit sans écrire un projet en dur dans le plugin.
- `A-9` — **Le nombre de capitaines sur un dépôt n'a pas d'importance, et la file ne se filtre pas** (`P-2`). Deux capitaines ne peuvent plus faire entrer une PR non testée : la règle d'ascendance (`A-1` à `A-4`) le garantit, quel que soit le nombre. Le seul risque qui reste est le travail en double, quand deux capitaines prennent la même PR en même temps : double mise à jour, push refusé, et un renvoi à tort à la session. Le verrou de `A-10` le supprime. Avec lui, la règle « un seul `role:capitaine` actif » de `fusionner/SKILL.md` disparaît. Raison : un filtre de file demanderait un réglage à chaque lancement, sans rien ajouter à la sûreté.
- `A-10` — **Le verrou d'un passage est un commentaire marqué sur la PR**. Le commentaire est visible (« passage du capitaine `<id>` depuis `<heure>` ») et porte une marque invisible `<!-- capitaine:passage <id> -->`. Le script le pose au début du passage, puis relit les commentaires :
  - si une marque d'un autre capitaine, plus ancienne, sans marque de fin et datée de moins de 90 minutes, existe, il supprime la sienne et saute la PR ;
  - à toute sortie, il édite son commentaire en « passage terminé ».

  L'identifiant vient de `CAPITAINE_ID`, la session du capitaine, toujours exigé. Raisons :
  - les sessions d'une même personne publient sous le même compte, donc l'auteur d'un label ne départage pas deux de ses capitaines ;
  - l'ordre des commentaires, lui, départage deux capitaines arrivés à la même seconde ;
  - un label de plus changerait les sept labels du socle.
- `A-11` — **Contrôle de vie périodique** (défaut 4). Tant que la carte nomme une session en vie (un conducteur ou un capitaine pour l'architecte ; ses filles et son capitaine pour le conducteur), un `send_later` à 60 minutes relance un relevé `get_session` de chacune. Les cas suivants vont au produit dans la forme de `chaine-de-production.md` § 2 :
  - `status_bucket` `failed` ;
  - déconnectée ;
  - `rate_limit_info.status` différent de `allowed` ;
  - aucun événement depuis 60 minutes alors qu'elle devait travailler.

  Ce contrôle s'écrit dans `architecte/SKILL.md` § 5 et `chantier/SKILL.md` § 6. Raison : `send_later` survit au conteneur, une attente active non.
- `A-12` — **Le premier geste d'une session lancée est de charger `send_message`** (défaut 5), par `ToolSearch` `select:mcp__claude-code-remote__send_message`. Si l'outil est absent, elle le dit dans sa première réponse et s'arrête ; son lanceur le voit au relevé de `A-11`. Ce geste s'écrit dans les trois blocs de `lancement.md` et dans le gabarit de `chaine-de-production.md` § 5.
- `A-13` — **Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce** (défaut 6). C'est une phrase dans `chantier/SKILL.md`, à côté de la mesure qui existe déjà.
- `A-14` — **`ticket-libre.mjs` lit les fichiers des PR ouvertes** (défaut 7), en REST (`pulls/<n>/files`). Une PR ouverte qui ajoute ou modifie le fichier du ticket le rend « OCCUPÉ ». Une branche distante dont la PR est fermée ne compte plus, et le repli par recherche ne retient que les PR ouvertes, sur l'identifiant entier.
- `A-15` — **Les défauts de la ligne 8, chacun corrigé à la source.**
  - `sujet.sh livrer` ne pose plus `à-fusionner` : la session qui livre le pose après sa revue, comme pour toute PR. Sans `gh` utilisable, il écrit le titre et le corps dans un fichier, sort avec un code dédié et dit d'ouvrir la PR par l'outil GitHub MCP.
  - `fait_sur` lit tout le flux (`awk`, sans `grep -q` sous `pipefail`).
  - `github.sh:216` valide le nombre avant de le comparer.
  - Le catalogue des gates : aucun générateur dans le plugin ; le lot 7 ne le traite que si sa source est retrouvée (`## Fog` de la carte du programme).
- `A-16` — **Versions et notes de version.**
  - Chaque PR bumpe le plugin, comme aujourd'hui : le lot 1 prend **7.16.0** (mineure : une clé de contrat nouvelle et facultative, un comportement plus strict, rien de retiré), les lots suivants une mineure ou un patch selon `README.md:186`.
  - Une note par version dans un fichier nouveau, `NOTES-DE-VERSION.md` à la racine de `skills`, la plus récente en haut. Chaque note a deux parties, « Ce qui change » et « Ce qu'un projet fait pour en profiter ». La seconde dit les commandes exactes : mettre à jour le plugin, rejouer `/maj-skills:fusionner poser` et `/maj-skills:sujet poser`, ajouter les clés de contrat, relancer le capitaine.
  - `README.md` renvoie à ce fichier.

  Raison : les scripts sont copiés dans chaque projet par `poser`, donc une version publiée ne change rien chez un projet qui ne les repose pas. La note doit le dire, et le titre d'un squash ne suffit pas.

## Les lots, dans l'ordre

Un ticket par lot, sous `docs/issues/capitaine-a-jour-et-teste/issues/`, numérotés depuis `1`.

| Lot | Objet | Décisions | Bloqué par |
| --- | ----- | --------- | ---------- |
| 1 | Règle d'ascendance vers `develop` et vers un sujet, comparaison des arbres, faux GitHub « strict » et checks par commit, `SKILL.md` de `fusionner` et sa référence (dont « une sous-PR de code étiquetée à la fois par sujet »), `NOTES-DE-VERSION.md` ouvert, 7.16.0 | A-1 à A-6, A-16 | — |
| 2 | PR en conflit : conflit lu avant les checks, `relancer` sur index, `file.sh` « en conflit » | A-7 | 1 |
| 3 | Mention d'une fusion sans effet (`fusionsSansEffet`) | A-8 | 1 |
| 4 | Verrou du passage, plusieurs capitaines sur la même file | A-9, A-10 | 1 |
| 5 | Contrôle de vie, `send_message` au premier geste, contexte lu par `get_session` (texte des skills `architecte`, `chantier`, `socle-chaine-de-production`) | A-11 à A-13 | — |
| 6 | `ticket-libre.mjs` : fichiers des PR ouvertes, branches de PR fermées | A-14 | — |
| 7 | Ligne 8 : `livrer`, `fait_sur`, `github.sh:216` | A-15 | 1 |

Les lots 1 à 4 et 7 touchent `fus/github.sh`, `fus/passer.sh` et `suj/sujet.sh` : ils se suivent, un à la fois. Les lots 5 et 6 ne touchent pas ces fichiers et peuvent partir en même temps que le lot 1.

## Hors périmètre

- La repose dans les projets (`fedora`, `anchorpost`, `iroki-monorepo`) : chacun la fait par sa propre session, d'après la note de version.
- Vérifier sur `fedora` pourquoi GitHub a accepté un squash que « strict » aurait dû refuser. L'hypothèse est un compte qui contourne la règle. Le lot 1 rend la question sans effet, puisque le capitaine vérifie lui-même.
