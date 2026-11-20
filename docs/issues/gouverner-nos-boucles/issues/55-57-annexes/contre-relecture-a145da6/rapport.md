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

---

# Second tour (dernier, `P-65`), sommet `26cf5a4`

Demandé par l'architecte après `A-161` (constats 1, 2, 4, 5, 6 et 8 portés ; 3 et 7 écrits en limite). `git fetch` : `origin/claude/tickets-55-57` = `26cf5a4edb21c75e2f1e436d72060e3c48c54d8e`, `origin/main` = `8a644532eeef770b7e88dff2c8dc5e603aff8141` ; `21a8abd` (retouches A-161), `788e452` (cas posé à plat), `26cf5a4` (fusion d'`origin/main`). Contre `main` : 25 fichiers, +1 179 −59 (`git diff --stat`). Arbres : `w-adv2/` et `w-mut3/` à `26cf5a4`, `poses/pr2/` le gate posé.

## 1. Les six constats portés, rejoués sur `26cf5a4`

Mes essais du premier tour, recopiés tels quels dans `w-adv2/` (`journaux/t2-adv-rejeu.log`) : ADV3, ADV4, ADV5, ADVV1 et ADVV2 verts comme au premier tour (ADV3 : la limite écrite du constat 3 ; ADV5 : `essai 1 : A [80], B []`, `essai 2 : A [80], B []`, `essai 3 : A [80], B []`) ; **ADV1 et ADV2 rouges**, parce qu'ils affirmaient le défaut : leurs lignes montrent la correction.
```
--- ADV1 tour 1
[#80] sous-PR non éligible (sortie 128)
[#81] #81 en retard sur sujet/lot : mise à jour poussée (dc9dc60), attente de la CI
--- ADV2 tour 2
[#81] REPRISE au tour suivant : commentaires de #81 illisibles (GitHub), aucune sous-PR de sujet/lot n'est prise à ce tour
[#80] sautée à ce tour : sujet/lot suspendu (lecture GitHub en panne)
[#81] sautée à ce tour : sujet/lot suspendu (lecture GitHub en panne)
```
Les mêmes, récrits pour affirmer la correction, avec leur famille (`w-adv2/…/adv-t2.test.mjs`, `journaux/t2-adv-nouveaux.log`, 4 sur 4 verts) :
- **Constat 1 fermé.** T2-ADV1 : une sortie 128 de `fusionner` donne `[#80] sous-PR non éligible (sortie 128)`, aucune ligne `signal`, pas de `tenu par #80`, et #81 est mise à jour dans le tour. Famille, T2-ADV1r : la même sortie 128 de `relancer` (sous-PR sans CI) rend le sujet, sans ligne de signal (silencieuse comme toute « autre » sortie de `relancer`, la table du ticket). Textes : `fusionner/SKILL.md` dit « 129 et plus ; une erreur fatale de git, 128, rend le sujet », `depot.test.mjs` l'exige et refuse « signal (128 et plus) » ; les commentaires de `boucle.sh` disent 129.
- **Constat 2 fermé.** T2-ADV2 : tour 1, #80 mise à jour ; tour 2, CI de #80 en cours, un 502 sur les commentaires de #81 : `REPRISE … aucune sous-PR de sujet/lot n'est prise à ce tour`, rien de poussé, la mémoire garde `sujet/lot:80` ; tour 3, `[sujet/lot] tenu par #80 (CI en cours)`, `[#81] attend son tour` ; tour 4, #80 entre et #81 est mise à jour : une mise à jour par sous-PR. La « marque illisible » (`jq` sur des dates illisibles) tient toujours le sujet, comme `A-153` l'accepte : la donnée est la même au passage, qui sort en 5.
- **Constat 4 fermé, sauf un reste de famille.** Le gate juge chaque ligne `Règles:` (`journaux/t2-sonde-regles.log`, vrai calcul de `main` à côté) : `Règles: —` puis `Règles: RULE_ALL_ZZZ-9` **REFUS** (`5:Règles: — dit que le ticket ne réalise aucune règle : pas av…`), de même en CRLF, sous `**Règles:**` puis `- Règles:`, et `—` deux fois ; `Règles: RULE_ALL_ANC-1` puis `Règles: voir plus bas` **REFUS** (la seconde ligne est jugée). Reste : `gate PASSE | "Règles: —\n* Règles: RULE_ALL_ZZZ-9" | calcul : regles=[RULE_ALL_ZZZ-9]` : le gate lit toujours `Règles:` sans la puce étoile (`enTete`), le calcul la lit ; la contradiction passe par là. Essayé : `Règles:` lue par le motif de `Sensibles:` (`ligneDEnTete`, puce étoile et tabulation) refuse ce cas et ne change le verdict d'aucun des fichiers réels (`poses/essai-etoile`, 91 + 145 + 254 fichiers, `"changes":0` partout). Voir constat 10.
- **Constat 5 fermé**, à un reste près. Les 57 formes du premier tour rejouées (`journaux/t2-sonde-sensibles.log`) : `-`, `–`, `?`, `.`, `session_` hors de la tête (trois formes) et l'URL sans `session_` passent de PASSE à REFUS ; rien d'autre ne bouge. Vingt-deux formes de plus (`journaux/t2-sonde-sensibles2.log`) : des noms de personnes passent (`Jeanne d'Arc`, `J.-P. Dupont`, `O'Neil`, `l'équipe produit`) ; `‐`, `−`, `~`, `💬`, `.-`, `a://b`, `SESSION_01` refusés. Reste : `PASSE "a — accord de \u200b, 2026-11-19"` (un nom fait d'une espace de largeur nulle : ni `\s`, ni `\p{P}`, ni `\p{S}`) et `PASSE "… www.claude.ai/code/session-1 …"` (adresse sans `://` ni `session_`). Voir constat 10.
- **Constats 6 et 8 fermés** : G7, L3 et les deux moitiés de L4 rejouées rouges (§ 5).

## 2. La limite nouvelle : une panne de lecture, puis une file qui ne change plus

Joué avec la vraie veille sur la vraie boucle (T2-ADV6, même montage que le cas 12 du banc : `sleep 7777` du jouet joue une sonde ; `journaux/t2-adv-nouveaux.log`). Sujet à deux sous-PR prêtes ; un 502 sur la lecture des commentaires de #80 au premier tour de la veille seulement :
```
--- T2-ADV6 veille 1
VEILLE 02:39 : durée 75 min, aucun passage après 03:59 (marge 40 min)
[#80] REPRISE au tour suivant : commentaires de #80 illisibles (GitHub), aucune sous-PR de sujet/lot n'est prise à ce tour
[#80] sautée à ce tour : sujet/lot suspendu (lecture GitHub en panne)
[#81] sautée à ce tour : sujet/lot suspendu (lecture GitHub en panne)
FILE VIDE 02:39
VEILLE FINIE 02:39
--- T2-ADV6 veille 2
[#80] FUSIONNÉE dans sujet/lot
[sujet/lot] tenu par #81 (sortie 8 de fusionner)
```
Huit sondes, aucune relance : les lignes « sautée » ne sont pas des lignes « attend son tour », la veille n'a rien à suivre, et la file ne change pas. La veille suivante reprend le sujet à son premier tour.
**Au pire** : le reste de la veille en cours. Elle finit à `--duree` (75 min par défaut) ou à l'échéance, `120 − --marge` minutes après son départ (80 par défaut ; 120 au plus, avec `--marge 0`) ; donc au plus 75 min par défaut, 120 min aux réglages extrêmes, plus le temps que la session du capitaine mette à relancer la veille sur `VEILLE FINIE` (règle du skill). **Jamais pour toujours**, tant que le capitaine relance sa veille et que la panne passe : une panne qui dure (jeton expiré, GitHub tombé) laisse le sujet suspendu autant qu'elle dure, avec une ligne `REPRISE` (dans le filtre du `Monitor`) à chaque tour ; une panne propre aux commentaires d'une seule PR, qui durerait, je n'en ai pas trouvé (`lire_github` refuse une page vide, non JSON, ou un objet `message` : rien de cela n'est propre à une PR ouverte). Plus tôt si la file change pour une autre raison, ou si la boucle fait un autre tour dans le même lancement (une PR vers develop).
C'est la famille de la sortie 5 (« Hors périmètre » du ticket 57 : « reprise qu'au prochain changement de la file ou à la veille suivante »), et la ligne dit `REPRISE au tour suivant`. Mais la limite n'est écrite dans aucun texte livré : ni `fusionner/SKILL.md`, ni la note 7.36.0, ni `CONTENU.md` ne disent qu'après une panne la veille ne relance pas (`grep -n "veille suivante\|prochain changement"` : rien dans ces fichiers). Voir constat 9.

## 3. Le gate sur les fichiers réels, au sommet `26cf5a4`

Le gate posé de `26cf5a4` (`poses/pr2`) contre celui de `main` à `5d05f4b` (`outils/comparer-gate.mjs`, `journaux/t2-comparer.log`) : `docs/` du clone à `a145da6` (90 fichiers), `w-adv2/docs` à `26cf5a4` (91), `<dépôt>/docs` (145 : le dépôt a reçu les annexes de la PR 141 depuis le premier tour), `<un dépôt de projet>/docs` (254 et 7 cartes) : `"changes":0,"refusNouveaux":0` partout. CLI réelle sur Anchorpost, `PROJET_RACINE`, lecture seule (`git status` vide) : `tickets : OK — 163 tickets, dette gelée 0, 0 sans Type: gelé(s), 6 carte(s) dont 0 gelée(s), 2 fiche(s) d'avant Responsable:/Conducteur:`. **Aucun verdict ne change.**

## 4. La fusion de `main` (PR 140)

`26cf5a4` a pour parents `788e452` et `8a64453` (`origin/main`). Sur les 21 fichiers de la PR 140 (`git diff 5d05f4b 8a64453`), les seules lignes qu'elle ajoutait et que la branche retire (`git diff 8a64453 26cf5a4`) : `"version": "7.35.0"` (devenue 7.36.0). **`scripts/poses.test.mjs` et `scripts/tranches.mjs` : identiques à `main`** (`git diff --quiet`). Fichiers communs aux deux PR : `plugin.json`, `NOTES-DE-VERSION.md`, `README.md`, `scripts/depot.test.mjs` ; les lignes que la branche retire de `depot.test.mjs` sont exactement celles du premier tour. Notes : `## 7.36.0 — 2026-11-20` l. 5, au-dessus de `## 7.35.0 — 2026-11-19` l. 26 ; tout ce qui suit la 7.36.0 est la note de `main`, octet pour octet (`diff` vide). La note 7.36.0 est celle du premier tour plus les retouches A-161 (128, panne) et un paragraphe « Deux limites connues » (constats 3 et 7).

## Constats du second tour

### 9. (m) La limite de la panne tient et est bornée, mais aucun texte livré ne l'écrit

Fait : § 2 ci-dessus (T2-ADV6) ; au pire le reste de la veille en cours, 75 min par défaut, 120 aux réglages extrêmes, jamais pour toujours tant que la veille est relancée et que la panne passe. La ligne de la boucle dit `REPRISE au tour suivant`, ce que la veille ne tient pas sur une file calme ; ni `fusionner/SKILL.md` (l. 40 : « Une lecture GitHub en panne ne donne jamais le sujet : à ce tour, aucune sous-PR de ce sujet n'est prise. »), ni la note 7.36.0, ni `CONTENU.md` ne disent quand le sujet est repris.
Retouche (au choix) : l'écrire là où la panne est dite (skill et note : « repris au prochain changement de la file ou à la veille suivante ») ; ou que la veille relève la ligne `sautée à ce tour : … suspendu` comme une attente (un second regard à la sonde suivante, 2 min), ce qui ramène le pire à une sonde.

### 10. (m) Le code d'A-161 est juste, mais son banc laisse passer six mutations ; et deux restes de famille

Fait. Sur douze mutations du code nouveau (§ 5), six survivent au banc de la PR (`journaux/t2-mut-{a,b,gate}.log`) :
```
N3 SURVIT (rc 0, 27 tests, 0 rouges, 277 s) le sujet en panne n'est pas suspendu
N4 SURVIT (rc 0, 27 tests, 0 rouges, 276 s) suspendu, la mémoire est perdue
N5 SURVIT (rc 0, 27 tests, 0 rouges, 274 s) suspendu, les sous-PR du sujet sont traitées quand même
N8 SURVIT (rc 0, 47 tests, 0 rouges, 3 s) les lignes `Règles:` lues dans le corps aussi
N9 SURVIT (rc 0, 47 tests, 0 rouges, 3 s) fin de ligne CRLF gardée sur `Règles:` (la ligne n'est plus lue)
N11 SURVIT (rc 0, 47 tests, 0 rouges, 3 s) un nom de symboles seuls (`~`, `−`) accepté
```
- N3, N4, N5 : le seul cas de panne du banc a pour mémoire la plus ancienne, « CI en cours » : la boucle n'y ferait aucun geste, suspendue ou non. Mes deux essais les tuent (`journaux/t2-mut-essais.log` : `N3/essais TUÉE`, `N4/essais TUÉE`, `N5/essais TUÉE`) : T2-ADV6 (panne sans mémoire, deux sous-PR prêtes : personne n'est pris) et T2-ADV7 (panne pendant que la mémoire tient #81, plus récente que #80 : la mémoire survit, `⏎sujet/lot:81⏎⏎`, et #81 entre la première au tour suivant ; `journaux/t2-adv7.log`).
- N8 n'est pas anodin : sous elle, deux fichiers réels deviennent rouges (`poses/essai-N8`, `outils/comparer-gate.mjs`) : `docs/issues/gouverner-nos-boucles/issues/61-le-skill-relecture.issue.md` l. 2997 et, chez Anchorpost, `docs/adr/ADR_ALL_DES-1-…md` l. 45 : une ligne `Règles:` du corps. Aucun cas ne dit qu'une ligne `Règles:` après la première section n'est pas jugée.
- N9 : un ticket CRLF à `Règles: pas une règle` est refusé par le gate de la PR (`5:Règles cite « pas »…`) et passe sous la mutation (`essai-N9 []`) : aucun cas CRLF sur `Règles:` depuis que la lecture n'est plus `chercher`.
- Restes de famille (§ 1) : `Règles: —` puis `* Règles: RULE_…` passe encore (le gate lit `Règles:` sans la puce étoile, le calcul avec) ; un nom d'accord fait d'une espace de largeur nulle passe.
Retouches : au banc, T2-ADV6 et T2-ADV7 (ou leur équivalent), une ligne `Règles:` du corps non jugée, un ticket CRLF à `Règles:` mal formée refusé, un nom de symboles seuls refusé ; `Règles:` lue par `ligneDEnTete` (essayé : 0 verdict changé sur les 490 fichiers réels) ; `\p{Cf}` et `\p{Z}` dans la classe des noms refusés.

## 5. Mutations du second tour : 16 jouées, 10 tuées, 6 survivantes

Appliquées une à une dans `w-mut3/` et `w-mut4/` (`outils/muter.mjs`), les arbres remis propres (`git status --short` vide).

| | Mutation | Résultat |
| --- | --- | --- |
| L3 | (survivante du 1er tour) « CI en cours » : la plus récente tient | **tuée** (cas « deux sous-PR CI en cours… la plus ancienne tient ») |
| L4a | (survivante du 1er tour, dans le sens du code nouveau) 128 tient de nouveau le sujet | **tuée** (cas 128) |
| L4b | (survivante du 1er tour) 129 rend le sujet | **tuée** (cas 129) |
| G7 | (survivante du 1er tour) commentaire coupé au premier `#` | **tuée** (2 rouges) |
| N1 | panne lue « illisible » (elle tiendrait le sujet) | tuée |
| N2 | panne lue libre | tuée |
| N3 | le sujet en panne n'est pas suspendu | **survit** (tuée par T2-ADV6 et T2-ADV7) |
| N4 | suspendu, la mémoire est perdue | **survit** (tuée par T2-ADV7) |
| N5 | suspendu, ses sous-PR traitées quand même | **survit** (tuée par T2-ADV6 et T2-ADV7) |
| N6 | la ligne de la panne perd « REPRISE » | tuée |
| N7 | `Règles: —` avec une autre ligne, accepté jusqu'à deux | tuée |
| N8 | `Règles:` lues dans le corps | **survit** |
| N9 | CRLF gardé sur `Règles:` | **survit** |
| N10 | `session_` en tête seulement (l'avant A-161) | tuée |
| N11 | nom de symboles seuls accepté (`\p{S}` retiré) | **survit** |
| N12 | URL acceptée comme nom | tuée |

Les trois survivantes du premier tour sont rouges (quatre jeux, L4 dans les deux sens). Sur le code nouveau : douze, six tuées, six survivantes (constat 10).

## Hors demande, joué une fois

`scripts/poses.test.mjs` seul à `26cf5a4` (les tranches de la PR 140, le cas posé à plat de `788e452`) : `# pass 1`, `# fail 0`, 494 s, `rc=0` (`journaux/t2-poses.log`). Mes essais du second tour sont dans `essais-t2/` (sortis de `w-adv2/` avant ce jeu, pour qu'il ne les pose pas).

## Second tour : ce que je n'ai pas regardé

La suite entière (demandé : non) ; les 32 mutations de la session ; un GitHub réel ; la panne qui durerait sur les commentaires d'une seule PR ouverte (lue dans `lire_github`, pas provoquée) ; macOS ; les textes au-delà des lignes citées.

## Second tour : comptes et verdict

- Essais : ADV1 à ADV5, ADVV1, ADVV2 rejoués (5 verts ; ADV1 et ADV2 rouges parce que le défaut qu'ils affirmaient est corrigé) ; six essais nouveaux, T2-ADV1, T2-ADV1r, T2-ADV2, T2-ADV6, T2-ADV7, tous verts.
- Gate : 90 + 91 + 145 + 254 fichiers réels et 7 cartes, 0 verdict changé ; Anchorpost par la CLI, OK ; 42 + 8 formes de `Règles:` et `Relecture:` contre le calcul de `main`, 57 + 22 de `Sensibles:`.
- Fusion de `main` : rien de la PR 140 perdu, `poses.test.mjs` et `tranches.mjs` identiques à `main`, 7.36.0 au-dessus de 7.35.0.
- Mutations : 16 jouées, 10 tuées, 6 survivantes (les 3 survivantes du premier tour toutes rouges).

**Verdict du second tour : conforme après retouches** — 0 B ; constats 1, 2, 6 et 8 fermés ; 4 et 5 fermés à un reste près ; 2 m nouveaux : 9 (limite de la panne bornée, non écrite) et 10 (six mutations survivantes sur le code d'A-161, deux restes de famille). Retouches : celles du constat 10 (les cas de banc, `Règles:` lue avec la puce étoile, `\p{Cf}`/`\p{Z}` dans la classe des noms) et l'écriture de la limite du constat 9 (ou la relance de la veille après un tour suspendu).
