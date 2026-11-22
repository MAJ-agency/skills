# Contre-relecture de la PR 153 (tickets 75, 76, 77), tour 1

PR https://github.com/MAJ-agency/skills/pull/153, « fix(relecteur): sortie 69 des calculs en panne, usage entier, borne de
la sortie 5 (plugin 8.0.1) », branche `claude/suites-relecteur` au sommet `5213463dfa2aeac7e573a6571c959b5d393a643e`, base
`main` à `ddb4265` (plugin 8.0.0, le lot 6 entré). Relue le 2026-11-22 sur un clone neuf, Node 22.23.5, git 2.43.0, quatre
cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe). Lecture seule : rien de poussé, aucun
commentaire ni étiquette. Les tickets et leurs annexes : `claude/hopeful-lovelace-ouk6tz` à `d70e517`.

## Verdict : non conforme

Aucun bloquant, un écart **à corriger** : sur un poste sans `jq`, le Relecteur ne s'arrête pas en 6 comme le texte de la PR
le dit ; il fait une pause sans fin, sans une ligne à personne. Sa retouche est essayée (`retouches/retouche-1-jq-absent.patch`,
une ligne de code et son commentaire, un cas de banc ; rouge avant, vert après). Le reste tient : la sortie 69 des deux calculs
est une panne des deux côtés, et elle seule, de bout en bout (essais sans talon, sous un git qui se dit 2.40) ; le régime 7
n'exécute aucune ligne neuve (espion) ; les 27 mutations des annexes sont rouges ; joué après la PR 152, le geste du § 3 du
ticket 77 donne 8.0.2 et la suite entière **1 411 sur 1 411**.

Après les décisions de l'architecte (`A-203`) : `retouches/retouche-153-tour-1.patch` réunit les retouches 1 et 2, la note
corrigée et le banc E1 ; section « Retouche du tour 1 », à la fin (234 tests sur 234 après, 1 rouge avant ; 33 mutations
rouges sur 35, les 2 vertes équivalentes ; un piège du § 3 du ticket 77 pour la note, et son geste).

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | Relecteur, poste sans `jq` : `github.sh` sort en 69 à son chargement, et `lire` (`relecteur.mjs`, ligne 130) le lit « GitHub illisible » (5). La passe sort en 5 à chaque sonde, la veille écrit `PAUSE` puis `VEILLE FINIE`, la session rejoue au réveil suivant, sans borne (celle de la sortie 5 ne vaut que pour `jouer`, qui ne se joue jamais ici) : une boucle silencieuse. Le texte de la PR donne « `jq` absent » pour cause de la sortie 6 (SKILL.md, la ligne 6 ; l'en-tête du script, lignes 72-73 ; la note 8.0.1), et `A-192` point 1 le nomme comme le cas même d'une panne |
| 2 | mineur | Ticket 77, § 3, la table : joué pour cette PR après la PR 152, seul `NOTES-DE-VERSION.md` est en conflit, pas `.claude-plugin/plugin.json` (les deux branches, parties de `ddb4265`, y écrivent le même 8.0.0 → 8.0.1). Le résultat est juste (8.0.2, l'arbre attendu), mais aucune ligne de la table ne décrit ce cas, et une session qui suit « un geste qui ne rend pas ce qui est écrit : s'arrêter » s'arrête |
| 3 | mineur | Ticket 77, décision 2 : « de suite » dans la phrase de `--attendre` n'est tenu par aucun banc (mutation T12 verte) ; une ligne de banc la tient (`retouches/retouche-2-attendre-de-suite.patch`) |
| 4 | mineur | Ticket 75, décision 2, et la note : « `passer.sh` en 3, `sujet.sh fusionner` en 11 » est vrai (essais E1), mais aucun banc ne le tient : le cas neuf ne joue que la CLI (mutations C3 et C4 vertes) |
| 5 | mineur | Ticket 75, « Ce qui n'a pas été établi » 1 : « une pause, puis la borne de la sortie 5 du ticket 77 » est faux (constat 1). La note 8.0.1 range « `jq` absent » sous « `revue-exigee.mjs` sort en 3, `passer.sh` en 3 » : sans `jq`, c'est `passer.sh` qui sort en 69, au chargement de `github.sh` (une panne aussi, que son en-tête dit déjà) |
| 6 | mineur | Le corps de la PR ne porte pas « les trois journaux de mutations » que le ticket 77, § 3, demande : seulement leur compte |

## Les constats

### 1. À corriger — un poste sans `jq` : le Relecteur fait une pause sans fin

**Où.** `skills/chaine/relecteur/scripts/relecteur.mjs`, `lire` (lignes 128 à 132), inchangée par la PR :
`if (r.status !== 0) arreter(5, …)`. `skills/chaine/fusionner/scripts/github.sh`, ligne 12 : `command -v jq >/dev/null || { echo "ARRÊT : jq est requis …" >&2; exit 69; }`.
`lire` source `github.sh` à chaque lecture : sans `jq`, chaque lecture sort en 69, que `lire` rend en 5.

**Le scénario qui casse.** Un Relecteur lancé sur un poste sans `jq` (le cas que `A-192` point 1 nomme avec git trop ancien) :
`preparer` passe (il ne lit pas GitHub), puis la première lecture (`pulls`) sort en 5. La veille lit 5 comme « GitHub n'a pas
répondu » : `PAUSE`, puis la sonde suivante, puis `VEILLE FINIE` à 25 minutes. La session joue « À chaque réveil » : `passe`
d'abord, qui sort en 5 (« rejouer au réveil suivant », sans borne pour `passe`), puis relance la veille. Aucun `jouer` ne se joue
(la veille ne réveille sur aucun geste), donc la borne neuve de la sortie 5 (« `jouer <n>` sorti en 5 pour la seconde fois de
suite ») ne vient jamais. Personne n'est prévenu (sinon, bien plus tard, par la ligne du plafond de contexte de la session
elle-même, à `VEILLE FINIE`), et le poste n'est pas réparé : c'est la boucle silencieuse que la raison
d'`A-197` refuse (« une panne qui n'a pas de suite chez le Relecteur s'arrête et se dit »). Or la PR écrit, pour la sortie 6 :
« un calcul dit qu'un outil de la chaîne manque au poste (sa sortie 69 : git plus ancien que 2.41, **`jq` absent**, la
grammaire des identifiants introuvable) … : l'architecte, et s'arrêter » (SKILL.md, et de même l'en-tête du script et la note).
Sans `jq`, aucun calcul n'est lancé : `meme-contenu.sh` ne dira jamais « `jq` absent » au Relecteur, `github.sh` le dit avant
lui.

**Preuve jouée.** `essais/relecteur-poste.ajout.mjs`, cas E3 (le PATH du jouet sans `jq`, `/usr/bin` et `/bin` en liens sauf
lui), joué par `essais/jouer.sh` : **rouge sur `5213463`** (`passe` sort en 5, attendu 6), rouge sur `main`, vert avec la
retouche (`essais/essais-tete-main-retouche.txt`). Ce que la passe et la veille écrivent sur le sommet, sans rien exiger
(`essais/e3-observe-5213463.txt`) :

```
passe : sortie 5 ; sa sortie d'erreur : relecteur : ARRÊT : jq est requis par les scripts de la chaîne : sudo apt install jq (ou brew install jq)
jouer 12 : sortie 5
veille --pause 0 --sondes 3 : sortie 0 ; son journal :
PAUSE GitHub illisible : relecteur : ARRÊT : jq est requis par les scripts de la chaîne : …
PAUSE GitHub illisible : relecteur : ARRÊT : jq est requis par les scripts de la chaîne : …
PAUSE GitHub illisible : relecteur : ARRÊT : jq est requis par les scripts de la chaîne : …
VEILLE FINIE
écritures sur GitHub : 0
```

**La retouche** (`retouches/retouche-1-jq-absent.patch`, sur `5213463`, `git apply --check` vert) : `sansOutil('github.sh', r)`
en tête de `lire`, avant le test de la sortie 5 (la même fonction que les calculs : sa sortie 69 arrête en 6, la cause dite,
« github.sh : un outil de la chaîne manque au poste (sortie 69) : ARRÊT : jq est requis … ») ; l'en-tête du script le dit ; un
cas de banc après celui du ticket 75, « suite du lot 5 — un poste sans `jq` : `github.sh` sorti en 69, la passe et `jouer` sortent
en 6, rien d'écrit ; la veille s'arrête, jamais une pause sans fin ». `github.sh` ne sort en 69 que là (aucun autre `exit 69` ni
`return 69` dans le fichier) : aucune autre lecture ne change. Le capitaine n'est pas touché, ni le régime 7 (le Relecteur n'y tourne pas). Le SKILL.md et
la note n'ont rien à changer : ils deviennent vrais.

| Banc | Avant (le cas seul posé sur `5213463`) | Après (la retouche posée) |
| --- | --- | --- |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | 52 tests, 51 verts, **1 rouge** (le cas neuf) | 52 sur 52 |
| et `scripts/relecteur.test.mjs`, `scripts/points-d-entree.test.mjs`, `scripts/bascule.test.mjs` (qui lisent le script) | — | 138 sur 138 en tout |
| `essais/jouer.sh` (E1 à E3) | E3 rouge | 5 sur 5 |
| mutation G1 (la ligne retirée) | — | rouge (192 s, le cas neuf) |

Journal : `essais/retouche-1-rouge-vert.txt`. La question 1 dit où la prendre.

### 2. Mineur — la table du § 3 du ticket 77 ne décrit pas l'ordre d'aujourd'hui

Le geste du § 3, joué tel qu'écrit pour cette PR après la PR 152 (`main` simulé : `ddb4265` puis un commit à l'arbre de
`4afd6e2`, comme la fusion par écrasement du capitaine ; `essais/fusion-apres-152.txt`) :

- `git merge --no-ff --no-edit` : sortie 1, **`NOTES-DE-VERSION.md` seul en conflit** ; `plugin.json` fusionné sans conflit (les
  deux côtés font le même changement de ligne) ;
- `git checkout <main> -- NOTES-DE-VERSION.md .claude-plugin/plugin.json`, puis `version-suivante.mjs` : « 8.0.2 — 2026-11-22 »,
  la note de la PR au-dessus de celle de la PR 152 ; rejoué, sortie 1 sans rien écrire ;
- l'arbre obtenu, `e622a9c9…`, est celui de la PR 152 suivie des trois patchs par `git apply --exclude` et `version-suivante.mjs`
  (joué aussi) ;
- la suite entière sur cet arbre : **1 411 tests, 1 411 verts** (`essais/suite-apres-152.txt`).

La version et le compte sont ceux de la ligne « le lot 6, puis la PR B » ; la colonne « fichiers en conflit » ne l'est pas. La
table compte depuis `97d17e3` ; la branche est partie de `ddb4265`, et ce que `main` a reçu depuis, c'est la seule PR B, dont la
ligne dit 7.39.2 et 1 399. Aucune ligne n'est le cas d'aujourd'hui. Le résultat est juste ; seule une session qui lit la table à
la lettre s'arrêterait (« Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur »). Question 2.

### 3. Mineur — « de suite » de `--attendre` n'est tenu par aucun banc

La décision 2 du ticket 77 met « de suite » sur chaque borne « et la phrase de `--attendre` (« compterait pour la seconde fois de
suite ») ». Le banc des textes exige chaque borne à sa ligne et refuse « à la seconde fois, » ; la phrase de `--attendre` finit par
« pour la seconde fois de suite. », que ni l'un ni l'autre ne lit. Mutation T12 (« compterait pour la seconde fois. ») : **verte**
sur `5213463` (`mutations/mutations-contre.txt`). `retouches/retouche-2-attendre-de-suite.patch` (sur `5213463`, une ligne de
`scripts/relecteur.test.mjs`) : 11 sur 11 avec elle ; T12 posée avec elle, **rouge** (10 sur 11). À prendre si une retouche entre
dans la PR (question 1) ; sinon, une suite.

### 4. Mineur — `passer.sh` en 3 et `sujet.sh fusionner` en 11 : vrais, non tenus

Le ticket 75 (décision 2) et la note disent « `revue-exigee.mjs` sort en 3, `passer.sh` en 3, `sujet.sh fusionner` en 11 ». Le
cas neuf de `verdict-du-capitaine.test.mjs` ne lance que la CLI (`revue-exigee.mjs`). Joué de bout en bout, sans talon, le vrai
`meme-contenu.sh` sous un `git` du jouet qui se dit 2.40 (`essais/capitaine-git-240.ajout.mjs`, E1) : `passer.sh` au premier
contrôle (un tour sur un sommet plus ancien, puis un commit de l'auteur) **3**, « revue du capitaine en échec (sortie 3) :
revue du capitaine en échec : meme-contenu.sh : un outil de la chaîne manque au poste (sortie 69) : git ≥ 2.41 requis, ici
2.40 » ; au second contrôle (après la mise à jour du capitaine) **3** ; `sujet.sh fusionner` au second contrôle **11**. Sur
`main` : 7, 7 et 7 (sautées sans bruit, le défaut du besoin). Les branches de `passer.sh` et `sujet.sh` ne changent pas (« leur
branche « autre » d'aujourd'hui, sans retouche ») ; mais les mutations qui leur font lire 3 comme 21 (C3, C4) sont vertes sur le
banc du ticket. Recommandation : verser E1 au banc dans une suite, pas dans cette PR.

### 5. Mineur — deux phrases à côté du fait

- Ticket 75, « Ce qui n'a pas été établi » 1 : « le Relecteur lit chaque lecture de GitHub en 5 (`lire`, « GitHub illisible »),
  une pause, puis la borne de la sortie 5 du ticket 77 ». La borne ne vaut que pour `jouer` (ticket 77, décision 1 : « Une sortie
  5 de `passe` ou de `distribuer` garde « rejouer au réveil suivant », sans borne ») : constat 1.
- La note 8.0.1, première puce : « `double-relecture.mjs` ou `meme-contenu.sh` sorti en 69 (git plus ancien que 2.41, `jq` absent,
  …) arrête le capitaine (`revue-exigee.mjs` sort en 3, `passer.sh` en 3, `sujet.sh fusionner` en 11) ». Sans `jq`, `passer.sh`
  s'arrête en 69 au chargement de `github.sh`, avant tout calcul (son en-tête : « 69 jq absent du poste → l'installer ») : une
  panne aussi, sous un autre code. Avec la retouche 1, la moitié Relecteur de la phrase devient vraie ; la moitié capitaine reste
  approchée. Rien à jouer n'en dépend.

### 6. Mineur — le corps de la PR

Le ticket 77, § 3 : « Dans le corps : les rouges avant et les verts après de chaque ticket, les trois journaux de mutations, la
suite entière (compte, durée, charge avant et après) ». Le corps porte les comptes (74/72/2, 51/50/1, 11/7/4 ; 27 rouges ; 1 402,
852 s, charge 1,23 puis 1,06), pas les journaux. Rejoués ici : `mutations/mutations-annexes.txt`.

## Ce que la PR devait tenir, point par point

### Ticket 75 et `A-192` point 1, `A-197` point 1

| Décision | Tenue ? | Preuve |
| --- | --- | --- |
| 1. Une sortie 69 d'un calcul est une panne, jamais « illisible », des deux côtés ; une sortie 21 reste « illisible » | oui | `sansOutil` ne joue que sur `r.status === 69` (revue-exigee.mjs 493, relecteur.mjs 219) ; les cas neufs (21 toujours 21 ; 21 toujours le geste `illisible`) ; Q5, Q10 rouges |
| 2. Capitaine : sortie 3, la cause dite | oui | CLI : le cas neuf ; `passer.sh` 3 (deux contrôles) et `sujet.sh fusionner` 11 : essais E1 (constat 4) |
| 3. Relecteur : sortie 6, rien d'écrit, la veille arrêtée ; jamais 3 (`A-197` : `passe` en rond) | oui, pour les calculs | les cas neufs ; E2 sans talon (vrai `meme-contenu.sh`, git 2.40) : `jouer` et `passe` 6, `VEILLE ARRÊTÉE sortie 6`, aucune écriture ; Q8 (5) et C5 (3) rouges. **Sans `jq` : 5, pas 6** (constat 1) |
| 4. La cause : la sortie d'erreur puis la sortie standard, `# illisible : ` retiré | oui | les cas neufs (les deux formes) ; Q4, Q9 rouges ; l'ordre des deux sorties (C1, C2) : vertes, et équivalentes avec les vrais calculs : sur une sortie 69, `double-relecture.mjs` n'écrit rien sur sa sortie d'erreur (ses avertissements exigent les trois arbres lus, donc git présent et la grammaire là), `meme-contenu.sh` n'écrit que le mot `illisible` sur sa sortie standard |

**Un chemin où une sortie 69 est encore lue « illisible » ?** Aucun. Les deux calculs ne sont lancés qu'en quatre endroits,
tous gardés : `exigesDe` et `memeContenuDe` (capitaine, seuls appelés par `verdictEnLigne`, donc par les deux contrôles de
`passer.sh` et de `sujet.sh`), `exiges` et la boucle de `memeContenu` (Relecteur, seuls appelés par `decision`, donc par
`passe`, `jouer` et `distribuer`). `chemins-sensibles.mjs` et `tickets.mjs` importent `double-relecture.mjs` comme module (aucun
code de sortie lu). `double-relecture.mjs` sans git sort bien en 69 (joué : PATH sans git, « # illisible : git est requis par les
scripts de la chaîne », `illisible`, sortie 69). **Une sortie 21 lue comme une panne ?** Aucune : Q5 et Q10 (toute sortie non
nulle en panne) sont rouges, et les deux cas « 21 » du banc le tiennent.

### Ticket 76

| Décision | Tenue ? | Preuve |
| --- | --- | --- |
| 1. L'usage nomme chaque option de l'en-tête, dans l'ordre (`--sondes`) | oui | le cas de l'usage ; U1 à U3 rouges |
| 2. Le plafond rejoué, écrit dans l'en-tête de `jouer` | oui | relu, mot pour mot (lignes 46 à 48) |
| 3. Le plafond rejoué, tenu | oui | le cas K1 retourné ; P1, P2 rouges |
| 4. La marque sans les traces d'illisible | oui | le cas K8 ; N3 rouge |

### Ticket 77

Les décisions 1 à 7 sont dans SKILL.md mot pour mot (diff relu phrase par phrase) ; la décision 8 (le banc des textes) aussi,
sauf « de suite » de `--attendre` (constat 3) ; la décision 9 : 8.0.1 sur `ddb4265`, 8.0.2 après la PR 152. T1 à T11 rouges.

### Le Relecteur ne tourne-t-il jamais en rond sur un poste sans outil ?

| Le poste | Ce que fait le Relecteur | Juste ? |
| --- | --- | --- |
| git plus ancien que 2.41 | les PR sans tour plus ancien passent ; la première qui en a un : `meme-contenu.sh` 69, sortie 6, la veille arrêtée (E2) | oui |
| la grammaire des identifiants introuvable | `double-relecture.mjs` 69, sortie 6 (le cas neuf, son vrai texte de cause) | oui |
| `flock` absent | sortie 6 (`sousVerrou`), inchangé | oui |
| **`jq` absent** | **sortie 5 à chaque lecture, pause sans fin** (constat 1) ; 6 avec la retouche | non |
| `gh` absent (hors d'`A-192`) | sortie 5 à chaque lecture (« gh en échec (code 127) »), pause sans fin, retouche comprise (`essais/e4-observe-e3a6226.txt`) | question 3 |

La sortie 3 → `passe` (`A-197`) : une sortie 69 ne rend jamais 3 (C5, rouge). La borne de la sortie 5 et « de suite »
des sorties 7 et 9 sont des règles de la session : le script n'a pas de mémoire, et le texte le dit (« rien ne vit dans sa
mémoire »). Elles correspondent aux sorties du script : 5 de `jouer` (la PR, ses commentaires, ses événements : `lire` et
`poseeApres`), 5 de `passe` changée en `PAUSE` par la veille (d'où « sans borne » pour `passe`, voulu, et le constat 1), 7 de
`ecrire` seul, 9 de `flock -E 9` seul. Rien à reprendre ici.

## Le régime 7 inchangé

Sans la clé `relecture`, aucune ligne neuve ne s'exécute. Le code neuf n'est que `sansOutil` et ses deux appels de chaque côté,
juste après le lancement d'un calcul ; les calculs ne sont lancés que par `verdictEnLigne` (capitaine), que la CLI n'appelle que
si `regime === 8`, et par `decision` (Relecteur), qui rend `hors-regime` avant (`cle === null`). Le reste du diff du code est
fait de commentaires et du texte de l'usage.

Joué par un espion (`essais/espion-regime-7.mjs`) : dans un arbre de la PR, chaque appel de `sansOutil` et le régime lu par
chaque processus de `revue-exigee.mjs` et de `relecteur.mjs` s'écrivent dans un journal, avec le pid ; puis 21 bancs en une passe : les 19 que l'espion de la contre-relecture de la PR 149
jouait (ceux qui lancent les scripts du capitaine en régime 7), plus `verdict-du-capitaine.test.mjs` et le banc du Relecteur.
Chaque appel de `sansOutil` est rattaché à la dernière lecture du régime du même processus. Résultat
(`essais/espion-regime-7.txt`) : **713 tests sur 713** ; 323 processus de la CLI du capitaine au régime 7 (258 avec `--ouverte`,
65 sans), 42 au régime 8 ; 3 PR lues au régime 7 par le Relecteur, 135 au régime 8 ; `sansOutil` appelé 44 fois chez le
capitaine et 122 fois chez le Relecteur, **toutes après une lecture du régime 8, aucune après une lecture du régime 7**. Le
régime 7 exécute donc les mêmes lignes que `main`.

## Le lot 6 (8.0.0)

Le lot 6 a changé `architecte/references/lancement.md` et `fusionner/SKILL.md`, aucun fichier de la PR. `scripts/relecteur.test.mjs`
(qui compare des lignes de `lancement.md`, `A-197`) : 11 sur 11 sur `5213463`. La suite entière, sur l'arbre qui porte le lot 6,
la PR 152 et la PR 153 : 1 411 sur 1 411. Le `fusionner/SKILL.md` du lot 6 dit « un calcul illisible » pour la sortie 21 et « un
calcul absent ou en panne : sortie 3 » : une sortie 69 est désormais une panne, la phrase tient. Les patchs, écrits sur `97d17e3`,
s'appliquent sur `ddb4265` et sur `ddb4265` suivi de la PR 152 (joué : `git apply --exclude`, l'arbre `e622a9c9…`).

## Les mutations

Rejouées sur le sommet `5213463`, chacune seule, le fichier remis après, par les scripts des annexes tels quels
(`mutations/mutations-annexes.txt`) : **27 rouges sur 27** (Q1 à Q10, U1 à U3, P1, P2, N3, T1 à T11 ; de 0 à 185 s, aucune au délai), chacune sur le cas qu'elle vise, trois lignes « toutes rouges », sortie 0, l'arbre propre après ; 14:20:08 → 14:48:21 UTC, charge 3,63 puis 5,10.

Ajoutées (`mutations/mutations-contre.mjs`, journal `mutations/mutations-contre.txt`) :

| Mutation | Banc | Issue |
| --- | --- | --- |
| C1 revue-exigee.mjs : la cause lue sur la sortie standard d'abord | `verdict-du-capitaine.test.mjs` | verte, équivalente (décision 4 : l'ordre n'est pas observable avec les vrais calculs) |
| C2 relecteur.mjs : la cause lue sur la sortie standard d'abord | `relecteur.test.mjs` | verte, équivalente (de même) |
| C3 passer.sh : une revue en échec (3) au premier contrôle lue comme illisible (7) | `verdict-du-capitaine.test.mjs` | **verte** (constat 4) ; rouge sur E1 (`mutations/c3-c4-contre-e1.txt`) |
| C4 sujet.sh `juger_revue` : une revue en échec (3) lue comme illisible (7) | `verdict-du-capitaine.test.mjs` | **verte** (constat 4) ; rouge sur E1 |
| C5 relecteur.mjs : la sortie 69 d'un calcul en 3 (« le geste a changé » : `passe`, en rond ; `A-197` point 1) | `relecteur.test.mjs` | rouge (205 s) |
| T12 SKILL.md : la phrase de `--attendre` sans « de suite » | `scripts/relecteur.test.mjs` | **verte** (constat 3) ; rouge avec la retouche 2 |
| G1 (sur la retouche 1) relecteur.mjs : `sansOutil('github.sh', r)` retiré | `relecteur.test.mjs` | rouge (192 s) |

## La note de version

Elle dit vrai sur les trois tickets, sauf « `jq` absent » (constat 5, et constat 1 pour le Relecteur). Ce qu'elle fait reposer :
`/maj-skills:fusionner poser` (`revue-exigee.mjs` et son banc vont dans `scripts/chaine/`), puis relancer le capitaine ; le
Relecteur lit son script et son skill dans le plugin, mis à jour par l'étape 1. C'est complet : `relecteur.mjs` n'est pas posé
dans le projet, et les calculs qu'il lance (`double-relecture.mjs`, `meme-contenu.sh`, sur develop) ne changent pas. Après la PR
152, la note devient « 8.0.2 », au-dessus de la 8.0.1 de la PR 152, qui fait reposer `fusionner` aussi : aucune repose ne manque.

## Le titre

« fix(relecteur): sortie 69 des calculs en panne, usage entier, borne de la sortie 5 (plugin 8.0.1) (#153) » : 104 caractères (et
104 octets) ; à 8.0.2, 104 aussi. Sous 120 (`A-197` point 2).

## Questions à l'architecte

1. **La retouche 1 : dans cette PR, ou une suite ?** Le ticket 75 met hors périmètre « la sortie 69 de `github.sh` lui-même (`jq`
   absent au chargement), déjà une panne chez le capitaine » : vrai chez le capitaine, faux chez le Relecteur, et le texte que la
   PR écrit promet la sortie 6. **Recommandation : dans cette PR** — une ligne et son commentaire, la fonction que la PR pose, un cas
   de banc, et aucune décision changée : `A-192` point 1 appliqué au seul outil que les textes de la PR nomment sans qu'un calcul le
   voie. Avec elle, la retouche 2 (une ligne de banc). Sans elle : retirer « `jq` absent » des causes de la sortie 6 du Relecteur
   (SKILL.md et son banc, l'en-tête, la note) et ouvrir le ticket.
2. **La table du § 3 du ticket 77** (constat 2). **Recommandation** : quand la PR 153 entre en second, dire à la session qui joue
   le geste « après la PR 152, seul `NOTES-DE-VERSION.md` est en conflit, 8.0.2, 1 411 », ou jouer le geste soi-même ; pas de
   retouche du ticket (il est joué une fois).
3. **`gh` absent du poste du Relecteur** : la même pause sans fin, retouche comprise (« gh en échec (code 127) » lu « GitHub
   illisible »). Hors d'`A-192` (qui ne nomme que git et `jq`), et un 127 ne se distingue pas sans risque d'une panne passagère dans
   `lire_github`. **Recommandation** : une suite, `preparer` qui vérifie `command -v gh` comme `sousVerrou` vérifie `flock` (sortie
   6), pas dans cette PR.

## Ce qui a été joué

Clone neuf de `https://github.com/MAJ-agency/skills`, `origin/main` à `ddb4265`, `claude/suites-relecteur` à `5213463`,
`claude/suites-capitaine` à `4afd6e2`, `claude/hopeful-lovelace-ouk6tz` à `d70e517` ; `pnpm install --frozen-lockfile`. Les
sommes des trois patchs des annexes : celles des tickets. Un arbre de travail par usage (sommet, `main`, retouche, fusion, espion).

- **Le diff** relu en entier (9 fichiers), contre les décisions des trois tickets, `A-192` point 1, `A-197`, `A-199` et le rapport du
  tour de relecture (« Retouches portées » : la sortie 6 nomme la grammaire, T7 la tient ; rien d'autre ne touchait le code de la PR A).
- **Les appelants des deux calculs** cherchés dans tout `skills/` ; `double-relecture.mjs` lancé sans git (69).
- **Les essais** (`essais/jouer.sh`, cas `ESSAI-153` ajoutés à la fin des deux bancs puis retirés ; 13:44 → 13:45 UTC, charge 6,8) :
  E1 (capitaine, 3 cas), E2, E3 sur `5213463` : 4 verts, E3 rouge ; sur `main` : 5 rouges ; sur la retouche : 5 verts
  (`essais/essais-tete-main-retouche.txt`). Les observations E3 (sommet) et E4 (`gh` absent, retouche).
- **La retouche 1**, rouge avant, vert après (13:45 → 13:49, charge 5,7 puis 4,7) ; la retouche 2, 11 sur 11, T12 rouge avec elle.
- **Le geste du § 3 du ticket 77** après la PR 152, et son arbre comparé au chemin `git apply --exclude` (identiques, `e622a9c9…`).
- **La suite entière** sur cet arbre, `setsid --wait timeout 3600 pnpm test` en tâche de fond : **1 411 sur 1 411**, aucun échec,
  annulé ni sauté, 1 802 s (13:49:39 → 14:19:42 UTC, charge 4,87 au départ, 23 au plus pendant, 4,45 à la fin). Une première passe
  à `timeout 1800`, celui que prescrit le § 3, a été coupée à 1 800 s (sortie 124, 727 tests passés, aucun échec) sous une charge
  de 15 : la durée de la suite dépend de la machine plus que du code.
- **Les mutations** : les 27 des annexes sur `5213463` (28 min) ; les 7 ajoutées, C1 à C5 et T12 sur `5213463`, G1 sur la retouche 1 (14:48:52 → 15:01:59 UTC, charge 5,7 puis 9,5) : 2 rouges (C5, G1), 5 vertes (C1, C2 équivalentes ; C3, C4, T12 : constats 3 et 4).
- **L'espion du régime 7** : 21 bancs, 713 sur 713, 15:02:23 → 15:24:36 UTC, charge 8,1 puis 18,1 ; aucun écart.
- **C3 et C4 contre E1** : chacune rougit le cas E1 qu'elle vise (`mutations/c3-c4-contre-e1.txt`).
- `scripts/relecteur.test.mjs` sur `5213463` : 11 sur 11. Le titre de la PR lu sur GitHub (lecture seule).

## Ce qui n'a pas été établi

1. **Un vrai poste à git 2.40, ou sans `jq`, ou sans `gh`** : simulés par le jouet (un `git` qui ne ment qu'à `git version` ; un
   PATH en liens sans l'outil). Le vrai git 2.40 pourrait échouer ailleurs avant `meme-contenu.sh` (une option de `git` plus récente
   dans un autre script) : non cherché.
2. **La suite entière sur le seul sommet `5213463`** (1 402) : non rejouée ; celle de la session de la PR, et la suite sur l'arbre
   fusionné, qui contient chacun de ses tests.
3. **La suite entière avec la retouche 1** : seuls les bancs qui lancent ou lisent `relecteur.mjs` (138 tests).
4. **Une session Sonnet réelle** devant la sortie 6 d'un calcul (la ligne « Relecteur arrêté : … » à l'architecte), et devant la
   table du § 3 (constat 2).
5. **`boucle.sh`** sur la sortie 3 de `passer.sh` et la sortie 11 de `sujet.sh fusionner` pour une sortie 69 : non joué (ticket 75,
   « Ce qui n'a pas été établi » 2).

## Retouche du tour 1

Décisions de l'architecte (`A-203`) sur ce tour : la retouche 1 entre dans cette PR, avec la retouche 2 ; le banc E1 s'il tient
en moins de 30 s sans dépendance ; la note 8.0.1 corrigée (constat 5, la phrase du ticket 75 corrigée par l'architecte) ;
`gh` absent va à une suite ; la table du § 3 sera dite à la session telle qu'elle est. Un patch unique les réunit.

**`retouches/retouche-153-tour-1.patch`**, sur `5213463` (`git apply --check` vert), sha256
**`f52479a6d18733fbc54772bde1d1d41f3e2e6616bc1314d479ed5309c7c9b5f1`** (`retouches/SHA256SUMS`) : six fichiers, 78 lignes
ajoutées, 5 retirées.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | `lire` : `sansOutil('github.sh', r)` avant le test de la sortie 5, et son commentaire ; l'en-tête, la sortie 6 (`jq` absent : `github.sh` le dit aussi, sa sortie 69 à son chargement) — la retouche 1 |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | le cas « suite du lot 5 — un poste sans `jq` … » (un PATH en liens sans `jq`) — la retouche 1 |
| `scripts/relecteur.test.mjs` | « de suite » de `--attendre` exigé dans « La veille » — la retouche 2 |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | le cas « régime 8, de bout en bout : `meme-contenu.sh` sorti en 69 (git 2.40) arrête `passer.sh` en 3 à ses deux contrôles et `sujet.sh fusionner` en 11, la cause dite, jamais sautée en 7 » (l'essai E1, en un cas) ; `chmodSync` importé |
| `NOTES-DE-VERSION.md` | la première puce de 8.0.1 : « `jq` absent » retiré de la parenthèse des calculs, et une phrase : « Sans `jq`, `github.sh` sort en 69 dès son chargement, avant tout calcul : `passer.sh` s'arrête en 69, comme avant ; le Relecteur, qui lisait cette sortie « GitHub illisible » (5) et faisait une pause sans fin, s'arrête en 6 lui aussi, la cause dite (contre-relecture de la PR 153). » |
| `skills/chaine/relecteur/references/CONTENU.md` | « Le banc » : un poste sans `jq` |

SKILL.md ne change pas : sa ligne de la sortie 6 (« `jq` absent ») devient vraie.

**Le banc E1** tient en un cas de trois jouets, sans dépendance (un `git` du jouet qui ne ment qu'à `git version`) :
**12,8 s** sous une charge de 15 (`duration_ms` 12801). Il rougit C3 et C4, et C6 (le second contrôle de `passer.sh`, une
branche de `case` à part).

### Rouges avant, verts après

`essais/retouche-153-rouge-vert.txt`. Avant : `5213463`, les seuls bancs du patch posés (`git apply --include='*.test.mjs'`) ;
après : le patch posé.

| Banc | Avant (15:28 → 15:35 UTC) | Après (15:35 → 15:41 UTC) |
| --- | --- | --- |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | 27 sur 27 (E1 tient le code d'aujourd'hui, voulu) | 27 sur 27 |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | 52, **1 rouge** (« un poste sans `jq` ») | 52 sur 52 |
| `scripts/relecteur.test.mjs` | 11 sur 11 (la ligne de la retouche 2 tient le texte d'aujourd'hui, voulu) | 11 sur 11 |
| `scripts/depot.test.mjs` (la version et la note) | 69 sur 69 | 69 sur 69 |
| `scripts/points-d-entree.test.mjs` | 66 sur 66 | 66 sur 66 |
| `scripts/bascule.test.mjs` | 9 sur 9 | 9 sur 9 |
| **en tout** | **234, 1 rouge** | **234 sur 234** |

Charge 13,4 au départ, 13,5 à la fin. Les deux cas qui tiennent un code déjà juste (E1, la ligne de `--attendre`) sont rougis par
leurs mutations (C3, C4, C6 ; T12), comme ceux du ticket 76 par P1, P2 et N3.

### Mutations sur l'arbre retouché

`mutations/mutations-r153.txt`, l'arbre retouché (5213463 et le patch, commit local `0aae5d5`), chacune seule, le fichier remis
après ; 15:42:00 → 17:05:10 UTC, charge de 4,5 à 29 (d'autres agents jouaient leurs bancs : jusqu'à 401 s pour un banc).

| Mutations | Issue |
| --- | --- |
| les 27 des annexes (Q1 à Q10, U1 à U3, P1, P2, N3, T1 à T11), par leurs scripts tels quels | **27 rouges sur 27**, chacune sur le cas qu'elle vise, trois « toutes rouges », sortie 0 : le patch n'en a déplacé aucune ancre |
| C3, C4, C6 (`passer.sh` aux deux contrôles et `sujet.sh juger_revue` lisant 3 comme 21) | **rouges** (le cas E1 du banc) |
| C5 (la sortie 69 en 3 chez le Relecteur) | rouge (deux cas : le calcul sorti en 69, et le poste sans `jq`) |
| T12 (`--attendre` sans « de suite ») | **rouge** (la ligne de la retouche 2) |
| G1 (`sansOutil('github.sh', r)` retiré) | **rouge** (le poste sans `jq`) |
| C1, C2 (l'ordre des deux sorties pour la cause) | vertes, équivalentes : aucun vrai calcul n'écrit une cause sur l'une et autre chose sur l'autre (« Ce que la PR devait tenir », ticket 75, décision 4) |

En tout, 35 : 33 rouges, 2 vertes équivalentes ; aucune au délai ; l'arbre propre après chaque passe.

### Un piège pour la session : le § 3 du ticket 77 reposerait l'ancienne note

Si la PR 153 entre après la PR 152, le § 3 du ticket 77 fait reprendre `NOTES-DE-VERSION.md` de `main`, puis poser la note par
`version-suivante.mjs "$S/77/ticket-77.patch"` : **la note du patch du ticket, celle d'avant la retouche**. Joué sur la branche
retouchée (`essais/piege-de-la-note.txt`) :

- **A, tel qu'écrit** : 8.0.2, et la note posée a l'ancienne parenthèse (« `jq` absent ») sans la phrase neuve ; la retouche de la
  note est perdue sans un mot, aucun banc ne le voit.
- **B, la note prise sur la branche avant la fusion** : `git diff $(git merge-base origin/main HEAD) HEAD -- NOTES-DE-VERSION.md >
  "$S/note-153.patch"`, puis les mêmes gestes avec `node "$S/77/version-suivante.mjs" "$S/note-153.patch"` : 8.0.2, la note
  posée est celle de la branche retouchée (titre mis à part), au-dessus de la 8.0.1 de la PR 152 ; rejoué, sortie 1 sans rien
  écrire ; `scripts/depot.test.mjs` et `scripts/relecteur.test.mjs` sur cet arbre : 80 sur 80.

À dire à la session avec le cas réel de la table (question 2) : prendre la note sur la branche (B), jamais dans le patch du
ticket, dès qu'une retouche a touché la note.

### Ce qui n'a pas été établi (retouche)

1. **La suite entière sur l'arbre retouché** : laissée à la session de retouche (`A-203`). Les bancs qui lisent ou lancent les
   fichiers touchés : 234 sur 234. Le compte attendu, compté et non joué : deux cas de plus (le poste sans `jq`, E1 ; la
   retouche 2 est une ligne d'un cas existant), soit **1 404** sur `ddb4265` et **1 413** après la PR 152.
2. **L'arbre B après la PR 152 sous la suite entière** : seulement les gestes et la note.
3. **La phrase du ticket 75** (« Ce qui n'a pas été établi » 1) : corrigée par l'architecte, pas relue ici.
