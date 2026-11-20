# Contre-relecture de la PR 141, tour 1 (décision `P-65`)

PR relue : `MAJ-agency/skills` 141, branche `claude/tickets-55-57`, sommet `a145da645f89a04c35000b79a37871c2a4e36c47` (vérifié : `git rev-parse origin/claude/tickets-55-57`), base `main` à `5d05f4b` (`git merge-base` le rend), 25 fichiers, +1 073 −56.
Dossier : `<dossier du contre-relecteur>/` — `clone/` (la suite), `w-adv/` (essais adverses), `w-mut/` (mutations), `w-main/` (`main` à `5d05f4b`), `outils/`, `journaux/`.

Rapport fini le 2026-11-20 ; verdict en fin de fichier. `w-mut2/` : second arbre de mutations, ajouté par moi.

## Reprise (second contre-relecteur, 2026-11-20 00:31 UTC, conteneur redémarré : uptime 1 min)

Ce que le premier a laissé et que je compte :
- `journaux/suite.log` : la suite entière, finie (`rc=1`, de 00:14:47 à 00:28 UTC) : `# tests 1154`, `# pass 1153`, `# fail 1` ; le seul rouge est `not ok 136 - les bancs posés à plat sous scripts/chaine/ tournent hors du plugin` (`scripts/poses.test.mjs:80`), après 600 045 ms : le plafond `timeout: 600_000` du `spawnSync` enfant, sous la charge de la suite. Sa relance seule (`journaux/poses-seul.log`, partie à 00:28:08) n'a pas fini : redémarrage. Je la rejoue (`journaux/poses-seul2.log`).
- `journaux/gate-anchorpost-{main,pr}.log` : `tickets : OK — 163 tickets …` des deux côtés ; je les rejoue moi-même.
- `outils/` : `comparer-gate.mjs`, `sonde-gate.mjs`, `ligne95.mjs`, `adv-tete.mjs` + `adv-corps.mjs` (ADV1, ADV2 dans `w-adv/…/adv-contre.test.mjs`) : aucun résultat écrit, je les rejoue.
- `journaux/poses-seul2.log` (moi, 00:31 à 00:37 UTC, charge 1 à 1,5) : `ok 1 - les bancs posés à plat sous scripts/chaine/ tournent hors du plugin`, 356 816 ms, `rc=0`. **La suite : 1 154 sur 1 154**, en deux temps (1 153 d'un tenant, le 1 154e seul) ; l'annonce « d'un seul tenant » ne se rejoue pas sur cette machine sous la charge de la suite (le plafond de 600 s, constat 11 du relecteur du 57, inchangé).

## Constats

### 1. (m) Une sortie 128 de `sujet.sh` (erreur fatale de git) est dite « interrompue par un signal » et tient le sujet, tour après tour

Fait. `boucle.sh` classe `12[89] | 1[3-9][0-9] | 2[0-9][0-9]` en « passage interrompu par un signal » (l. 466 et 495) et tient le sujet (l. 471 et 501). Or 128 n'est pas un signal (128 + 0) : c'est la sortie de toute erreur fatale de git, que `set -euo pipefail` de `sujet.sh` (l. 133) propage telle quelle. Vu : `git fetch origin <ref absente>` sort en 128 (`fatal: couldn't find remote ref`), `git switch` sous un `index.lock` resté aussi (sondé ici : `rc_missing=128`, `rc_lock=128`, `rc_bad=128`). Joué (essai ADV1 laissé par le premier contre-relecteur, rejoué par moi, `journaux/adv12.log`) : un `git fetch … feat/pr-80` qui meurt en 128 donne à deux tours de suite
```
[#80] ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie 128), état de la sous-PR inconnu : laissée dans la file (aucun renvoi)
[sujet/lot] tenu par #80 (sortie 128 de fusionner)
[#81] attend son tour : #80 passe d'abord dans sujet/lot
✔ ADV1 … (7603ms)
```
La ligne est dans le filtre du `Monitor` (le capitaine la voit), mais elle l'envoie chercher un signal qui n'a pas eu lieu ; et une erreur git qui dure tient le sujet sans fin, alors que la sortie 1 (erreur inattendue) le rend. Le ticket écrit « 128 et plus », la décision `A-142` dit « une sortie par signal ».
Retouche : `129 | 1[3-9][0-9] | 2[0-9][0-9]` pour « signal » ; 128 classé à part, « erreur fatale de git (sortie 128) », tenu ou rendu selon ce que l'architecte veut (la Décision 5 dirait « état inconnu : tient »), et le libellé juste ; un cas du banc sur 128.

### 2. (m) Une lecture en panne des commentaires d'une sous-PR qui ne tient rien lui donne le sujet devant celle que la boucle tient : deux mises à jour en vol

Fait. `verrou_d_un_autre` rend « illisible » sur toute panne de `lire_github` (l. 352 à 357), et le pré-passage la fait tenir (l. 381 à 387) avant la mémoire et « CI en cours ». Le passage de cette sous-PR, qui relit les commentaires, lit bien : ce capitaine-ci la prend et la met à jour pendant que la CI de la mise à jour de celle qu'il tenait tourne. Joué (ADV2, rejoué, `journaux/adv12.log`) : tour 1, #80 mise à jour, tient ; tour 2, CI de #80 en cours, un seul 502 sur la lecture brute des commentaires de #81 :
```
[#81] marque de passage d'un autre capitaine (illisible) : elle tient sujet/lot
[#81] #81 en retard sur sujet/lot : mise à jour poussée (0ba0e45), attente de la CI
[sujet/lot] tenu par #81 (sortie 8 de fusionner)
[#80] attend son tour : #81 passe d'abord dans sujet/lot
FILE VIDE 00:43 (CI en cours : #80 #81)
✔ ADV2 … (24133ms)
```
La Décision 4 du ticket dit « au pire elle en prend une autre que la plus ancienne » ; ici, elle prend une autre que celle qui tient, ce que `A-142` voulait empêcher (« une mise à jour ne soit pas refaite ») : un 502 passager coûte une seconde mise à jour de #80 et une CI.
Retouche : « illisible » ne tient le sujet que si personne ne le tient par la mémoire ou « CI en cours » ; ou bien, illisible, ce capitaine ne prend aucune sous-PR du sujet à ce tour (le tour suivant relit). Un cas du banc.

### 3. (m) Deux capitaines, deux mémoires : la plus ancienne reçoit deux mises à jour (lu par le ticket, « non joué » ; joué ici)

Fait. La mémoire `boucle-tenus` vaut pour un clone. Quand la CI de la mise à jour poussée par A (sortie 8) finit verte, la sous-PR n'a plus ni marque ni « CI en cours » : un capitaine B, sans mémoire, prend la plus ancienne et la met à jour ; A fait entrer la sienne, et la plus ancienne est remise à jour. Joué avec deux vraies boucles, deux clones du même dépôt jouet, deux `CAPITAINE_ID`, un seul faux GitHub (`w-adv/skills/chaine/fusionner/scripts/adv-contre2.test.mjs`, ADV3, `journaux/adv34.log`) :
```
--- ADV3 A1   [#81] MISE À JOUR avec sujet/lot poussée, CI pas finie … / [sujet/lot] tenu par #81 (sortie 8 de fusionner)
--- ADV3 B1   [#80] #80 en retard sur sujet/lot : mise à jour poussée (6924fdd) … / [#81] attend son tour : #80 passe d'abord dans sujet/lot
--- ADV3 A2   [#81] FUSIONNÉE dans sujet/lot / [sujet/lot] tenu par #80 (CI en cours)
--- ADV3 A3   [#80] #80 en retard sur sujet/lot : mise à jour poussée (9bbfddc) …
✔ ADV3 … (34038ms)
```
C'est le cas que « Ce qui n'a pas été établi » du ticket 57 dit « lu, non joué » ; `A-142` donnait pour raison « deux capitaines qui mettent à jour deux sous-PR du même sujet ». La fenêtre n'est pas une course de quelques secondes : elle dure de la fin de la CI au prochain tour de A, et les deux veilles voient le même changement de la file.
Retouche (au choix de l'architecte) : la sortie 8 laisse une trace lisible par tous sur la sous-PR (la marque de passage gardée vivante jusqu'à l'entrée, ou une marque « tenu par <capitaine> » que `verrou_d_un_autre` lit), ou le texte du skill et de la note dit la limite à plusieurs capitaines.

### 4. (m) Le gate ne juge que la première ligne `Règles:` de l'en-tête : `Règles: —` puis `Règles: RULE_…` passe, et le calcul de `main` lit la règle

Fait. `controlerTicket` lit `Règles:` par `chercher(tete(lignes), REGLES)` (la première ligne seulement, `tickets-regles.mjs` l. 562), alors que `Sensibles:` et `Relecture:` sont jugées sur chaque ligne de l'en-tête (`A-155`). Le calcul « double relecture exigée » de `main` lit toutes les lignes (`valeursDEnTete`, `double-relecture.mjs` l. 744 à 764). Joué contre le VRAI calcul de `main` (copie de `double-relecture.mjs` à `5d05f4b` dont la seule ligne ajoutée est l'export de `enTeteDuTicket` ; `outils/sonde2.mjs`, `journaux/sonde-rr-*.log`) :
```
main : gate REFUS | "Règles: —\nRègles: RULE_ALL_ZZZ-9" | calcul : double=false regles=[RULE_ALL_ZZZ-9] sansLigne=false | 5:Règles cite « — »…
PR   : gate PASSE | "Règles: —\nRègles: RULE_ALL_ZZZ-9" | calcul : double=false regles=[RULE_ALL_ZZZ-9] sansLigne=false
```
L'en-tête dit « aucune règle » au gate et en cite une au calcul ; la règle citée n'est jugée ni dans sa forme, ni dans son existence, ni dans son contexte. La seconde ligne non jugée existe déjà sur `main` (`Règles: RULE_ALL_ANC-1` puis `Règles: voir plus bas` passe le gate des deux côtés, calcul « illisible ») ; la PR y ajoute la contradiction, que `Règles: —` rend écrivable. Sans danger pour la sûreté (le calcul lit la règle, et « illisible » n'est jamais « non exigée »), mais le gate ne tient pas ce qu'il promet sur la ligne qu'il accepte désormais.
Retouche : juger chaque ligne `Règles:` de l'en-tête (comme `Sensibles:` et `Relecture:`), ou refuser une seconde ligne ; un cas du banc.

### 5. (m) `Sensibles:` : le nom de l'accord est moins gardé que le ticket et le code ne le disent

Fait. Le ticket 55 (Décision 3, durcie par C4 d'`A-156`) : le nom « ni vide, ni un identifiant `session_…`, ni un gabarit » ; le commentaire du code (l. 474) : « ni un tiret seul ni deux accords ». Joué sur `ecartsSensibles` de la PR (`outils/sonde-gate.mjs`, `journaux/sonde-sensibles.log`) :
```
PASSE  "a — accord de -, 2026-11-19"
PASSE  "a — accord de –, 2026-11-19"
REFUS  "a — accord de —, 2026-11-19"
PASSE  "a — accord de la MOA session_01AbC, 2026-11-19"
PASSE  "a — accord de la MOA (session_01AbC), 2026-11-19"
PASSE  "a — accord de x,session_01AbC, 2026-11-19"
REFUS  "a — accord de Session_01AbC, 2026-11-19"
PASSE  "a — accord de https://claude.ai/code/01AbCdEfGhIj, 2026-11-19"
PASSE  "a — accord de ?, 2026-11-19"
```
`/(^|[/:])session_/i` ne voit un identifiant qu'en tête du nom ou après `/` ou `:` ; seul le tiret cadratin est refusé comme nom. Aucune garde ne lit encore `Sensibles:` : sans effet aujourd'hui, mais c'est la ligne que des gardes liront.
Retouche : `session_` refusé partout dans le nom (`/session_/i`), un nom fait de seuls tirets, blancs ou ponctuation refusé (`/^[\p{P}\p{S}\s]+$/u`), une URL refusée (`://`) ; les cas au banc.

### 6. (m) Un trou du banc du gate : un `#` collé à la valeur

Fait. Mutation G7 (`sansCommentaire` coupe au premier `#`, même sans blanc devant : `valeur.search(/\s#/)` → `valeur.indexOf('#')`) : **survit**, 47 tests verts (`journaux/mut-gate.log`). Sous elle, `Relecture: double#x` passerait le gate, que le calcul de `main` lit « illisible » (`journaux/sonde-rr-pr.log` : `gate REFUS | "Relecture: double#x" | calcul : ILLISIBLE`). C'est l'écart que `A-155` veut fermer (« qu'une ligne que le calcul lira ne passe jamais le gate mal écrite »), et aucun cas ne le tient.
Retouche : au banc, `Relecture: double#x` et `Sensibles: — #x` sans blanc (`Sensibles: —#x`) refusés.

## Ce qui tient (vérifié, sans constat)

- **Le gate sur les fichiers réels, avant et après.** CLI réelle `tickets.mjs` (les copies posées `poses/main` et `poses/pr`, identiques octet pour octet aux sources des deux arbres, `cmp`), `PROJET_RACINE=/home/user/anchorpost`, lecture seule (`git status` d'Anchorpost vide après) : `tickets : OK — 163 tickets, dette gelée 0, 0 sans Type: gelé(s), 6 carte(s) dont 0 gelée(s), 2 fiche(s) d'avant Responsable:/Conducteur:` des deux côtés (`journaux/gate-anchorpost-{main,pr}.2.log`). `controlerTicket` et `controlerCarte` des deux versions sur chaque `.md` (`outils/comparer-gate.mjs`, `map.md` du programme exclu sans être lu) : `docs/` du clone (90 fichiers), `<dépôt>/docs` à `f3ae5a1` (140), `<un dépôt de projet>/docs` (254 et 7 cartes) : `"changes":0,"refusNouveaux":0` partout (`journaux/comparer-*.log`). Programmes et fiche d'architecte du plugin jugés en carte et en ticket : mêmes verdicts (`journaux/cartes-gabarits.log`). **Aucun refus nouveau d'un fichier valide.**
- **`Relecture:` contre le calcul de `main`.** Dix-sept formes (guillemets, `#` collé, vide, casse, puce étoile, tabulation, retrait, CRLF, espace insécable, espace de largeur nulle, deux lignes) : toute forme que le gate laisse passer est lue `double` par le calcul, ou n'est lue par aucun des deux (`  Relecture: double`, retrait) ; le gate est plus strict sur `"double"` et `'double'` (`journaux/sonde-rr-pr.log`).
- **`Règles: —`** : les formes que le gate accepte (`—` seul, blancs autour, gras, puce, casse, espace avant le deux-points) sont toutes lues « aucune règle » par le calcul ; `– `, `-`, `— RULE_…`, `` `—` ``, `——`, `—,`, `— # rien` restent refusés comme le dit la Décision 14 (hors constat 4).
- **`Sensibles:`, durcissement C4 et borne** : `..` partout, `~` initial, `\`, `/` initial, blanc (espace insécable comprise), accolades, gabarits, `—` comme nom, `Session_…` en tête, URL `…/session_…`, deux accords, 2026-02-29, 1999, 3000, 0000, chiffres pleine chasse, date sans zéros : refusés ; 2000-01-01, 2999-12-31, 2028-02-29 : acceptés (`journaux/sonde-sensibles.log`). Hors constat 5.
- **La fusion des deux tickets.** `chantier/SKILL.md` l. 95 : ses 637 premiers caractères sont ceux de `main` (la moitié de la PR 138), la suite est mot pour mot la Décision 10 c du ticket 57 ; ni « chemin possédé », ni « puis le repose sur la suivante » ; le fichier ne nomme plus de rétro (`grep -ci rétro` : 0) ; `--numstat` `5 7` (127 lignes). `plugin.json` ne change que `"version"` (7.34.0 → 7.35.0) ; une seule note, en tête, `## 7.35.0 — 2026-11-20`, qui porte le 57 puis le 55. `git ls-remote` : `main` toujours à `5d05f4b`, la branche à `a145da6`. **Rien de perdu de la PR 138** (`outils/perdu138.sh`, `journaux/perdu138.log`) : sur ses 30 fichiers, les seules lignes qu'elle ajoutait et que la PR retire sont la version, `DE_CODEOWNERS` élargi (Décision 15 du 55) et la l. 95 récrite (Décision 10 c du 57).
- **La mémoire `boucle-tenus`** (ADV4, `journaux/adv34.log`) : une sous-PR fermée qu'elle nomme ne tient rien, la plus ancienne prend le sujet dans le tour et la mémoire est récrite (`⏎sujet/lot:80⏎⏎`) ; un `boucle-tenus` qui est un dossier : lecture muette, une ligne `Is a directory` sur la sortie d'erreur à chaque tour, le tour sort en 0, la règle tient par « CI en cours » et le numéro. Deux capitaines ne partagent pas une mémoire (le `flock` vaut pour le `git-common-dir`, où elle vit).
- **La veille, plusieurs verrous** (`w-adv/…/adv-veille.test.mjs`, `journaux/advv.log`, horloge du poste avancée par une doublure de `date`) : ADVV1 montre que, le premier verrou relu à la même date après sa relance, l'expiration d'un second ne relance plus la boucle (`lancements` 2, le témoin à un seul verrou relance). Pas un défaut : un verrou relu à la même date après sa date + 95 min ne vient que d'une horloge du poste en avance de plus de 5 min, et le second verrou serait alors relu vivant de même (cas que le ticket écrit dans « L'horloge du poste »). ADVV2 : une date que `fromdateiso8601` ne lit pas efface toutes les expirations du tour (`lancements` 1) ; la boucle n'écrit jamais une telle date (`date_du_verrou` ne prend que `[0-9TZ:-]+`, issu de `todate`) : non atteignable.
- **La ligne écrite après la ligne de sortie** : sur la sortie 7 d'un verrou, `retirer_passage` et `finir_passage` écrivent avant le `sortir` de `verrouiller`, et la trappe EXIT ne trouve plus rien à terminer (lu, `github.sh` l. 657 à 745) : la date se lit sur la dernière ligne ; la ligne du sujet tenu n'entre jamais dans `$sortie` (cas du banc).

### 7. (m) Les deux lignes d'attente entrent dans le filtre du `Monitor` quand le nom du sujet porte un mot du filtre

Fait. Décision 8 du ticket 57 : « Aucune des deux n'entre dans le filtre du `Monitor` du capitaine : une attente n'est pas un événement. » Le nom du sujet est dans chacune, et le filtre (`fusionner/SKILL.md` l. 89) est une alternance de mots nus (`conflit`, `rouges`, `REFUS`, `PAUSE`…). Sondé avec le filtre recopié de la l. 89 :
```
$ printf '%s\n' "[#81] attend son tour : #80 passe d'abord dans sujet/lot" … "[sujet/conflits-de-dates] tenu par #80 (CI en cours)" | grep -E "$F"
[#81] attend son tour : #80 passe d'abord dans sujet/conflits-de-dates
[sujet/conflits-de-dates] tenu par #80 (CI en cours)
[#81] marque de passage d'un autre capitaine (illisible) : elle tient sujet/conflits-de-dates
```
Ces lignes s'écrivent à chaque tour, pour chaque sous-PR qui attend : un sujet `sujet/…conflit…` réveille le capitaine à chaque tour, sans événement. Les sujets réels d'Anchorpost (`sante`, `onglet-projet`, `refonte-registre`…) n'en ont pas.
Retouche : le dire dans le skill, ou ancrer les motifs du filtre qui sont des mots courants (`] conflit`, `checks exigés rouges`…) ; au moins, un cas qui fige la Décision 8 pour un nom de sujet piégé.

## Ce que je n'ai pas regardé

- Rien contre un GitHub réel ; deux capitaines vraiment simultanés (la course de quelques secondes entre la lecture des marques et la pose, que le ticket dit possible) : non joué ; ADV3 joue deux boucles l'une après l'autre.
- La sortie par signal de la boucle elle-même (TERM entre un geste et l'écriture de `boucle-tenus`) : lue seulement — la mémoire reste celle du tour d'avant, et le tour suivant retombe sur « CI en cours » ou le numéro ; pas joué.
- bash 3.2, awk de BSD, macOS ; un autre projet qu'Anchorpost pour le gate.
- Les 64 et 55 mutations annoncées par la session, `/security-review`, et les constats S19 laissés à l'architecte : ni rejoués ni relus. Le compte de la suite « `origin/main` plus 25 » : vu seulement par les déclarations `test(` (1 058 → 1 083, +29 −4).
- Les textes des skills au-delà de ce que les constats citent (`fusionner/SKILL.md`, `CONTENU.md`, `chaine-de-production.md`, `pieges.md`, l'ADR des branches de sujet) : lus en diff, pas confrontés phrase à phrase au code.

## Ajout : deux capitaines au même instant (joué après la liste ci-dessus)

ADV5 (`w-adv/…/adv-contre3.test.mjs`, `journaux/adv5.log`) : deux vraies boucles lancées ensemble (deux clones, deux `CAPITAINE_ID`, un faux GitHub), sujet à deux sous-PR en retard, trois essais : `essai 1 : A [80], B []` ; `essai 2 : A [80], B []` ; `essai 3 : A [], B [80]`. Sans mémoire ni « CI en cours », les deux prennent la plus ancienne et le verrou du passage départage (`[#80] #80 en passage chez le capitaine capitaine-banc depuis … : sautée sans renvoi` puis `[sujet/lot] tenu par #80 (sortie 7 de fusionner, verrou du …)`) : une seule mise à jour. La course que le ticket dit possible ne s'est pas montrée ici ; le cas qui casse est celui des mémoires divergentes (constat 3). La ligne « deux capitaines vraiment simultanés : non joué » de la liste ci-dessus est donc à lire « joué trois fois, sans double mise à jour ».

### 8. (m) Deux trous du banc de la boucle : « CI en cours, la plus ancienne », et les sorties 128 et 129

Fait. Sur mes douze mutations de la boucle et de la veille, deux survivent, chacune jouée sur les 23 tests `boucle.sh` / `veille.sh et boucle.sh` de `une-sous-pr-a-la-fois.test.mjs` et `sujet-fusionner.test.mjs` (`journaux/mut-boucle-a.log`) :
```
L3 SURVIT (rc 0, 23 tests, 0 rouges, 265 s) « CI en cours » : la plus récente tient, pas la plus ancienne
L4 SURVIT (rc 0, 23 tests, 0 rouges, 274 s) sortie 128 et 129 de fusionner : le sujet est rendu
```
L3 (`$3 == "CI en cours" && !c { c = $2 }` → `$3 == "CI en cours" { c = $2 }`) : aucun cas n'a deux sous-PR « CI en cours » dans un sujet sans mémoire ni marque, alors que la Décision 2 (3) dit « la plus ancienne ». L4 : le banc ne joue que 143 ; 128 et 129, que le code nomme, ne sont tenus par rien (voir constat 1).
Retouche : un cas à deux « CI en cours » sans mémoire (la plus ancienne tient) ; un cas 128 (ou 129, selon la classe que l'architecte retient au constat 1).

## Mutations de mon cru : 23, 20 tuées, 3 survivantes

Appliquées chacune seule dans `w-mut/` ou `w-mut2/` par `outils/muter.mjs` (l'ancien texte doit y être une fois exactement, puis `git checkout`), les arbres propres à la fin (`git status --short` vide).

Boucle et veille (`journaux/mut-boucle-{a,b}.log`, de 245 à 293 s chacune) :

| | Mutation | Résultat |
| --- | --- | --- |
| L1 | date du verrou lue sur la première ligne de la sortie 7 (`tail` → `head`) | tuée |
| L2 | marque illisible lue libre | tuée |
| L3 | « CI en cours » : la plus récente tient | **survit** (constat 8) |
| L4 | sorties 128 et 129 de `fusionner` rendent le sujet | **survit** (constats 1 et 8) |
| L5 | pré-passage pour un sujet à trois sous-PR en route seulement | tuée |
| L6 | « CI en cours » avant la mémoire | tuée |
| L7 | « CI en cours » n'est plus en route | tuée |
| V1 | relance à 90 min, sans la marge | tuée |
| V2 | `max` au lieu de `min` des expirations | tuée |
| V3 | une sous-PR qui attend, sortie de la file, garde sa ligne | tuée |
| V4 | le verrou d'un passage de `relancer` ignoré | tuée |
| V5 | relance à chaque sonde après l'expiration | tuée |

Gate (`journaux/mut-gate.log`, 47 tests de `tickets.test.mjs` et `tickets-gate.test.mjs`, 2 à 3 s chacune) : G1 puce étoile non lue, G2 `..` en tête seulement, G3 borne 2000 à 2999 retirée, G4 `session_` à la casse, G5 jour impossible accepté, G6 `Règles:` à `—` n'importe où, G8 `Relecture:` à toute casse, G9 CRLF gardé, G10 `~` initial, G11 deux accords : **tuées** ; G7 commentaire coupé au premier `#` : **survit** (constat 6).

## Les comptes

- Suite : 1 153 sur 1 154 d'un tenant (le seul rouge, `poses.test.mjs`, au plafond de 600 s sous la charge), puis `poses.test.mjs` seul vert en 357 s : 1 154 sur 1 154 en deux temps.
- Essais adverses joués et finis : ADV1 à ADV5 (boucle, vraies boucles sur dépôts jouets), ADVV1 et ADVV2 (veille), tous verts, chacun affirmant ce qu'il a vu.
- Gate : 484 fichiers réels jugés par les deux versions (90 + 140 + 254), 0 verdict changé ; Anchorpost par la CLI réelle, OK des deux côtés ; 42 formes de `Relecture:` et `Règles:` contre le vrai calcul de `main`, 57 formes de `Sensibles:`.
- Mutations : 23, 20 tuées, 3 survivantes.

## Verdict

**Conforme après retouches.** 0 bloquant, 8 mineurs. Retouches que je demande avant l'entrée, parce qu'elles touchent ce que la PR affirme : constat 1 (128 n'est pas un signal : le code, `fusionner/SKILL.md` et le test de `depot.test.mjs` qui exige « (128 et plus) ») avec le cas du banc du constat 8 ; constat 6 et l'autre cas du constat 8 (trous du banc) ; constat 5 (le gate refuse ce que son code et le ticket disent refuser). Les constats 2, 3, 4 et 7 peuvent aller à l'architecte : le 2 et le 3 coûtent une mise à jour et une CI de plus, jamais une fusion non testée ; le 4 existait sur `main` pour la seconde ligne, la PR y ajoute la contradiction ; le 7 suppose un nom de sujet piégé.
