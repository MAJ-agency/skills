# Reprise : architecte A (le plugin), arrêt du 2026-11-20 vers 14 h 20 UTC, limite hebdomadaire du compte

Ce fichier suffit pour reprendre. Il remplace, pour l'état courant, [`2026-11-19-reprise-architecte-plugin.md`](2026-11-19-reprise-architecte-plugin.md). Ce qui y est dit du rôle, des consignes du produit et de la méthode reste vrai. L'histoire est dans la carte, [`../map.md`](../map.md) : **ne jamais la lire en entier** (environ 600 Ko), seulement par `grep -n` puis `sed -n`. Les décisions sont dans [`../relecture-independante.spec.md`](../relecture-independante.spec.md), à lire de la même façon.

## Pourquoi l'arrêt

L'ancien compte a atteint sa limite d'usage hebdomadaire le 2026-11-20 vers 14 h 20 UTC. Elle se lève le 2026-11-22 à 19 h UTC. Le dernier agent lancé, le contre-relecteur de la PR 146, est mort sur cette limite au début de son travail. Aucune session de l'ancien compte ne tourne plus utilement, et aucun réveil programmé n'y reste actif (vérifié le 2026-11-21 à 16 h 50 : la liste des réveils actifs est vide).

## Reprendre sur un autre compte

Un architecte d'un autre compte ne peut écrire à aucune session nommée ici : la réponse sera « introuvable ». Il lit ce fichier, puis relance sur son compte ce qui est marqué « à relancer ». Le prompt d'ouverture se tape dans une session sur le seul dépôt `MAJ-agency/skills`, en mode « Auto » :

```text
/maj-skills:architecte gouverner-nos-boucles
Tu reprends la partie A de ce programme : le plugin MAJ-agency/skills, chantier 3 « relecture indépendante ». Avant toute autre lecture, lis docs/issues/gouverner-nos-boucles/passation/2026-11-21-reprise-architecte-plugin.md, branche claude/compassionate-euler-st84s9. Ne lis jamais une carte en entier.
```

Les deux consignes du produit, à citer telles quelles dans le prompt de chaque session lancée :

- « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer »
- « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »

## Ce qui est fait et vérifié à la source

Le plugin est passé de 7.35.0 à **7.37.3**. `main` est à `5bf4f39`. Pour chaque PR, l'arbre de `main` a été comparé à celui du sommet ordonné.

| PR | Tickets | Version | Commit sur `main` |
| --- | --- | --- | --- |
| 142 | 61, le skill `relecture` (lot 3d) | 7.36.0 | `e64f93b` |
| 141 | 55 et 57 : une sous-PR à la fois par sujet, le gate juge `Sensibles:` et `Relecture:`, le bilan de fin de chantier sort | 7.37.0 | `860cd9c` |
| 143 | 63, les suites du skill `relecture` (la résolution en lots, les binaires de la seule résolution) | 7.37.1 | `b944606` |
| 144 | 64, les bancs de la CI (`tranches.mjs` : la division sur certitude seule, le plafond de `poses`, une précondition rendue déterministe) | 7.37.2 | `4cd047f` |
| 145 | 65, petits correctifs (`\p{Cc}` dans un nom d'accord, la limite de `codeSeul`, les phrases d'`A-178`) | 7.37.3 | `5bf4f39` |

Les tickets 55, 57, 61, 63, 64 et 65 sont à « Fait » sur la branche de documentation. Les 21 tickets de l'autre programme (`../../capitaine-a-jour-et-teste/`) sont tous « Fait » : plus rien ne retient les lots.

**La sonde demandée par `A-162` est jouée, et c'est `A-178`.** Dans le montage de C4, avec le clone sous `<session>/.relecture-securite`, `/security-review` et ses sous-agents lisent le clone. Hors des dossiers de travail, ils lisent la base. Un rapport vide de la commande ne prouve rien : son seuil de 8 a écarté une injection réelle notée 7. Le lot 4 n'attend plus la sonde.

## Ce qui est en vol

| Objet | État exact | Geste suivant |
| --- | --- | --- |
| **PR 146** (ticket 66, lot 4 : le skill `relecteur` et la retouche de `compter`, plugin 7.38.0) | Branche `claude/ticket-66-relecteur`, sommet `d1679f35c22743cac7c0faff61d2b1edf58945a9`, base `main` à `5bf4f39`. D'après sa session : 43 rouges sur 186 bancs avant le code, puis 186 verts ; la suite passe, 1 270 sur 1 270 ; les 73 mutations de l'annexe sont rouges. CodeQL et les deux Analyze sont verts ; le résultat du job `bancs` n'a pas été relevé. **Aucun verdict n'est écrit sur la PR.** | Un **premier tour de contre-relecture neuf**, en effort extra (la PR est sensible). Le tour interrompu n'a fait que l'étape 1 : la PR est identique au patch du ticket, arbre `f314f83e…` (`66-annexes/contre-relecture-d1679f3/rapport.md`). Le brief se reprend tel qu'il est décrit plus bas. |
| **Deux alertes CodeQL** sur la PR 146 (alertes 24 et 25 de l'onglet code-scanning du dépôt) | 24 : `relecteur.test.mjs:526`, « Improper code sanitization » (le faux `bin/gh` écrit par interpolation). 25 : `relecteur.mjs:103`, « Shell command built from environment values » (`spawnSync` sur un tableau d'arguments, sans shell). | Décidé, pas encore écrit dans la spec. La 24 se ferme par le code, dans le commit des retouches du premier tour : le faux `gh` lit ses deux valeurs dans des variables d'environnement. La 25 est une fausse alerte acceptée comme `A-163`, puisque le contrôle CodeQL est vert ; elle s'écrit dans le verdict. **Écrire cette décision comme `A-181`.** |
| **Session de la PR 146** (ancien compte) | En attente du verdict, sans rien pousser. | **À relancer** sur le nouveau compte : une session de ticket neuve, sur Sonnet comme le dit la ligne `Modèle:` du ticket, branche `claude/ticket-66-relecteur`. Elle porte les retouches du tour et la 24 en un seul commit, joue la suite, pousse. |
| **Capitaine de `skills`** (ancien compte) | `session_01BxuG31iuZBtiuRHonvMc1J` : en veille, file vide ; son réveil ne s'est pas réarmé. | **À relancer** sur le nouveau compte, avant la première PR ordonnée. Le prompt se trouve dans `skills/chaine/architecte/references/lancement.md`, § « Le capitaine d'un dépôt », avec la procédure d'un dépôt sans la chaîne **copiée en entier** et sans la ligne `/maj-skills:fusionner`. Le capitaine tourne sur Sonnet. Quand le compte d'origine revient le 22 à 19 h, ce capitaine pourrait se réveiller sur un message : un second capitaine ne double aucune fusion (`expectedHeadSha`), mais il vaut mieux l'archiver dès que possible. |

Les PR 44 et 56 sont ouvertes et hors de ce programme : on n'y touche pas.

## Quoi faire, dans l'ordre

1. **PR 146.**
   - Premier tour de contre-relecture par un agent neuf, Opus en effort extra, sur `d1679f3`. Il rejoue d'abord les essais X1 à X17 du relecteur du ticket, publiés sous `66-annexes/relecture-tour-1/` : `essais.test.mjs`, `essais2.test.mjs` et `mes-mutations.mjs` ; la variable `APRES` doit désigner l'arbre de `main` avec le patch appliqué.
   - Il attaque ensuite `relecteur.mjs` : la veille de 25 minutes, `distribuer` avec un sommet ou un couple périmé, le `flock`, un hook posé, un `pnpm install` en échec, une PR fermée ou de fourche, un verdict édité, le plafond d'`A-89` avec un refus sur un autre sommet, la reprise après arbitrage, les causes d'« illisible ».
   - Il vérifie que les textes joués par une session Sonnet ne laissent aucun geste à improviser. Il joue un échantillon de 20 mutations de l'annexe et en écrit 15 à lui.
   - Puis viennent le verdict, les retouches et la mutation 24 en un commit, puis le second tour par **le même agent**.
   - Ensuite seulement : le verdict `conforme`, l'ordre et le label. Après la fusion, le ticket 66 passe à « Fait ».
2. **Les tickets de suite déjà décidés, à écrire.** Chacun reçoit un seul tour de relecture (`P-65`), et on les regroupe par famille de fichiers, trois au plus par PR :
   - la veille du capitaine (`fusionner`) meurt elle aussi au plafond de 30 minutes des tâches de fond de l'outil Bash (`A-180`, point 1) ;
   - `relecture.test.mjs` : le test des phrases d'`A-178` en vérifie la présence, pas l'emplacement (mutation M4) ;
   - le commentaire de `tickets.test.mjs:227` sur ce que retire `trim()`.
3. **Les lots restants de la spec** (section « Les lots »), dans l'ordre que fixe `A-149` :
   - les lots 5a, 5b et 5c en une PR, avec `A-132` (`sujet.sh etat`), la « veille morte », `archive_session` refusé au conducteur et la veille qui ne repart pas après une panne ;
   - le lot 6, seul (bascule en 8.0.0) ;
   - les lots 8 et 9 ensemble ;
   - le lot 7 (repose dans les projets) revient à leurs architectes.
4. **Les notes encore sans ticket** : la carte de chantier trop lourde, la lecture des blobs par sha.

## La méthode qui a payé (à garder)

- **Un tour de relecture sur le ticket, deux sur la PR** (`P-65`, `A-149`). Le même agent fait les deux tours de la PR. Un tour qui finit sur des bloquants en reçoit un de plus, limité au delta (PR 141, 142 et 144).
- **Inverser la charge de la preuve quand une liste de dangers revient sans cesse.** `A-143`, `A-159` et `A-177` en sont trois exemples : une liste de ce qui est sûr se prouve entière, une liste de ce qui est dangereux ne se prouve jamais. Sur la PR 144, cela a fermé en un passage ce que deux tours de listes n'avaient pas fermé.
- **Les sessions de ticket tournent sur Sonnet** quand la ligne `Modèle:` le dit et que le ticket donne le code entier. Elles ont coûté de 2,76 $ à 19 $ par ticket, contre 73 $ pour la PR 141 sur Opus. Les relectures et contre-relectures tournent sur Opus : effort moyen pour une PR ordinaire, effort extra pour une PR sensible (`P-64`).
- **Le capitaine se relance neuf** quand son contexte grossit sans travail : à 764 000 tokens, il coûtait environ 9 $ de l'heure, contre environ 1 $ pour un capitaine neuf. On désactive d'abord son réveil (`update_trigger enabled=false`), puis on l'archive.
- **Jamais de verdict `non conforme` sur un sommet qui ne bougera pas.** Le capitaine bloque pour de bon un sommet qui porte un `non conforme`. Une retouche du seul corps de la PR se fait sans verdict, puis le verdict `conforme` se pose au même sommet (PR 145).
- **Les agents locaux** : trois au plus en même temps. Chacun reçoit un dossier privé `/home/user/agents/<nom>/` et un `TMPDIR` à l'intérieur, lance ses essais sous `setsid --wait` et ne laisse aucun processus derrière lui. Le classifieur refuse de tuer les processus d'un autre. Chaque rapport et chaque essai se publie sous `issues/<n>-annexes/`, sans aucun chemin privé, avant l'archivage : le conteneur ne survit pas à un changement de compte.
- **Erreurs à ne pas refaire** :
  - Une f-string de Python avale les accolades d'un texte qui contient `\p{Cc}` : écrire la carte par concaténation.
  - Un `git fetch` de deux refs suivi d'un `merge FETCH_HEAD` fait une fusion octopus avec `main` : fusionner une référence nommée.
  - Une suite de gestes qui écrit dans le dépôt s'enchaîne par `&&`, jamais par `;`.

## Règles de travail

- Le dépôt est public : rien de privé, aucun nom de personne, aucun détail de projet client.
- Jamais de push sur `main` ; jamais de push forcé, d'`--amend` ni de `--no-verify`.
- Les versions : la suivante de `main` au moment de livrer. Une PR qui entre en second fusionne `origin/main` par un commit de fusion, jamais de rebase.
- L'ordre de fusion dans `skills` : d'abord un commentaire de verdict, dont la première ligne est exactement `contre-relecture conforme au sommet <sha40>` ; puis un commentaire dont le corps est exactement `à-fusionner au sommet <sha40>`, éventuellement suivi d'une ligne vide, de `---` et du pied de page des sessions cloud ; puis le label `à-fusionner`. Un push après l'ordre l'invalide.
- L'architecte vérifie chaque fusion à la source : l'arbre de `main` doit égaler celui du sommet ordonné, et le parent doit être l'ancien `main`.
