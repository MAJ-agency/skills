# Reprise : architecte A (le plugin), passation du 2026-11-23 vers 08 h UTC, changement de compte

Ce fichier suffit pour reprendre. Il remplace, pour l'état courant, [`2026-11-21-reprise-architecte-plugin.md`](2026-11-21-reprise-architecte-plugin.md), dont le rôle, les consignes du produit, la méthode et les règles de travail restent vrais : lis ses sections « La méthode qui a payé » et « Règles de travail » après celui-ci.

- **La carte** : [`../map.md`](../map.md), environ 1 400 lignes et plus de 600 Ko. **Ne la lis jamais en entier**, seulement par `grep -n` puis `sed -n`. Son `## Journal` est en fin de fichier : ses dernières entrées (du 2026-11-22, 12 h 27, au 2026-11-23, 08 h) racontent tout ce qui suit.
- **Les décisions** : [`../relecture-independante.spec.md`](../relecture-independante.spec.md), à lire de la même façon. Les dernières sont `A-200` à `A-216` et `P-66`.
- **La branche de documentation** : `claude/hopeful-lovelace-ouk6tz` de `MAJ-agency/skills`. Tout ce qui est écrit ici y est poussé. Crée ta propre branche de travail à partir d'elle (ton environnement t'en nommera une) : rien n'empêche de continuer à écrire sur celle-ci si ta session y est autorisée.

## Pourquoi la passation

Le produit l'a demandée le 2026-11-23 : le travail reprend sur un autre compte. Le compte d'avant était en alerte de limite hebdomadaire. La session de l'architecte A d'avant (`session_012xRpgYDsq5D6zHAnLX65vB`) a coûté environ 1 081 $ du 2026-11-21 au 2026-11-23.

## Reprendre sur un autre compte

**Tu ne peux écrire à aucune session nommée ici** : depuis ton compte, `send_message` les dira introuvables. Tu relances sur ton compte ce qui est marqué « à relancer ». Le prompt d'ouverture se tape dans une session sur le seul dépôt `MAJ-agency/skills`, en mode « Auto » :

```text
/maj-skills:architecte gouverner-nos-boucles
Tu reprends la partie A de ce programme : le plugin MAJ-agency/skills, chantier 3 « relecture indépendante », et l'essai réel du régime 8. Avant toute autre lecture, lis docs/issues/gouverner-nos-boucles/passation/2026-11-23-reprise-architecte-plugin.md, branche claude/hopeful-lovelace-ouk6tz. Ne lis jamais une carte en entier.
```

Ajoute ensuite à ta session les dépôts `MAJ-agency/essai-relecture-8`, `MAJ-agency/anchorpost` et, au besoin, `MAJ-agency/anchorpost-essai` (outil `add_repo`).

Les deux consignes du produit, à citer telles quelles dans le prompt de chaque session que tu lances :

- « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer »
- « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »

Et les deux intangibles, eux aussi tels quels :

- « Le dépôt est public : rien de privé, aucun nom de personne, aucun détail de projet client. »
- « Jamais de push sur main ; jamais de push forcé, d'--amend ni de --no-verify. »

**Le premier geste, avant tout autre** : donne au produit l'identifiant de ta session (`get_session` sans argument), pour qu'il le transmette à l'architecte B d'Anchorpost, qui t'écrira désormais à toi (voir « L'architecte B »).

## Ce qui est fait et vérifié à la source

Le plugin est passé de **8.0.0 à 8.3.0**. `main` est à `24fbd728cbca7f5ddb84d6956e2a53da117138ba`. Pour chaque fusion, l'arbre de `main` a été comparé à celui du sommet ordonné, et le parent à l'ancien `main`.

| PR | Tickets | Version | Commit sur `main` |
| --- | --- | --- | --- |
| 152 | 78, 79 : suites du capitaine | 8.0.1 | `61bf51b` |
| 153 | 75, 76, 77 : suites du Relecteur | 8.0.2 | `2a2d215` |
| 155 | 83, 84, 85 : `tickets` et la preuve suffisante | 8.1.0 | `679df86` |
| 154 | 86, 87, 88 : `socle-tests` et la preuve suffisante | 8.2.0 | `56ba394` |
| 156 | 90 : les bancs posés isolés du contrat du projet, `develop.test.mjs` hors de `references/`, le garde qui pose les bancs (`scripts/pose-du-socle.mjs`, `scripts/references-posees.test.mjs`) | 8.2.1 | `51596e5` |
| 157 | 89 : le skill `anchorpost` suit la CLI 2.0.0 (publique, manifeste au schéma 3, « Passer au pivot 3 », fiche des cas et de `compare`) ; c'est K5 de l'architecte B | 8.3.0 | `24fbd72` |

Les tickets 75 à 90 sont à « Fait » sur la branche de documentation. Les PR 44 et 56 sont ouvertes et hors de ce programme : on n'y touche pas.

**Le défaut relayé par le produit le 2026-11-22**, vu par un autre projet à la pose de sa chaîne en 8.2.0 (le banc posé `regles.test.mjs`, test « refusEdition laisse éditer .claude/skills… », rouge), **est corrigé à partir de 8.2.1** ; le produit a reçu la version. Ne nomme jamais ce projet dans le dépôt.

**La copie de lecture de `SPEC_ALL_ANC-5`** (`docs/issues/standard-documentation/preuve-suffisante.spec.md`) est alignée sur l'amendement `A-279` d'Anchorpost (§ 2, point 3, l'instance, les familles ; commit `05cc4e1`).

**L'essai réel, cas 12** (régime 7 sous le plugin 8.0.0, dépôt `anchorpost-essai`) : **joué, conforme**, toutes ses sessions archivées. Trouvailles au journal (2026-11-22, de 11 h 33 à 14 h 48).

## Ce qui est en vol

| Objet | État exact | Geste suivant |
| --- | --- | --- |
| **Ticket 91** — un socle posé en « chaîne seule » passe son propre gate (`issues/91-un-socle-pose-en-chaine-seule-passe-son-propre-gate.issue.md`, annexes `91-annexes/`) | Écrit par un agent rédacteur sur `main` à `24fbd72` ; patch `91-annexes/ticket-91.patch`, sha256 `bbfa70393ee72bed67b71da5e426e1c51c787c483291ed52aaa7f15885281320` ; suite 1 471 sur 1 471 (`91-annexes/suite.txt`), 21 mutations rouges (`91-annexes/mutations.txt`). Sept défauts : le lint et Prettier sortis des scripts posés par une liste unique tenue par un banc ; les références d'une brique absente gelées et dites ; un seul nom, `docs/agents/chaine-admin.md` ; une règle `required_status_checks` vide dite réglage du dépôt dès la première lecture (`checks_exiges`, `attendre_ci`) ; les cas de durée de `regles.test.mjs` sous charge corrigés sans saut. Aucune question à l'architecte ; deux choix écrits en décisions (3 : le gel écrit à la main ; 6 : la boucle s'arrête sur le réglage du dépôt) que tu peux changer. **Pas encore relu.** Le rapport final du rédacteur s'est perdu dans un redémarrage du conteneur : le ticket et ses annexes sont complets (vérifié : en-tête, sha256, suite, mutations, aucun chemin privé). | **Un tour de relecture du ticket** par un agent Opus neuf (`P-65`), qui rejoue le patch sur un clone neuf de `main` (s'il a bougé, sur `24fbd72` d'abord), puis tes décisions sur ses constats (`A-217` et suivantes), puis une session de ticket Sonnet aux gestes exacts (§ 0 à § 3 du ticket), puis deux tours de contre-relecture sur la PR. Version : 8.3.1 si rien n'entre avant. |
| **Essai réel du régime 8, `essai-relecture-8`** | Socle posé (PR 1, `9a5e728`), le paquet à juger dans `develop` (PR 2, `52c1c64`), le cadrage dans le sujet `sujet/essai-regime-8` (PR 3, fusionnée le 2026-11-23 à 00 h 32 ; validée double au tour 5, sommet `66ce758`). **Cas déjà joués en réel** : le cycle complet d'un refus contesté et arbitré (PR 2) ; le cas 8, plafond au troisième refus, décision de plafond de l'architecte, compte des tours remis à zéro (PR 3) ; la règle haute `RULE_ALL_PAR-1` relue en double, le produit informé. **La vague 1 n'est pas lancée.** | Voir « L'essai, à reprendre » ci-dessous. |
| **Sessions de l'essai sur l'ancien compte** | Le conducteur (`session_012xRpgZWnLSw6gZnNZHEK7F`, contexte à 396 k, plafond de 400 k atteint), le Relecteur (`session_012xRpgcB5kqdE7UDSsHELdy`) et le capitaine (`session_012xRpgbcYfXwFpUcf27TQn8`) du dépôt ont reçu l'ordre, le 2026-11-23 vers 07 h 55 UTC, d'écrire sa passation dans la carte du sujet (le conducteur) et d'arrêter leur veille sans réveil (les trois). **Vérifie-le sur le dépôt** : la carte du sujet porte la passation du conducteur (`sujet.sh carte`), et plus aucun commentaire ni geste du Relecteur ou du capitaine n'arrive après cette heure. Deux Relecteurs sur un même dépôt distribueraient deux fois : si l'ancien n'est pas arrêté, demande au produit de l'archiver avant de relancer le tien. | **À relancer** sur ton compte : un Relecteur, un capitaine et un conducteur de suite (`skills/chaine/architecte/references/lancement.md`). |
| **Capitaine de `skills`** (ancien compte) | `session_012xRpgZtjwXRpXFHzfzaXUc` : arrêté seul après six réveils à file vide, après avoir fusionné 156 et 157. | **À relancer** sur ton compte avant la première PR ordonnée : le prompt de « Le capitaine d'un dépôt » de `lancement.md`, avec la procédure d'un dépôt sans la chaîne copiée en entier, sur Sonnet. Il s'arrête après six réveils à file vide : relance-le à chaque PR ordonnée s'il est arrêté. |

## L'essai, à reprendre

Le plan de l'architecte est publié sous [`../essai-regime-8/`](../essai-regime-8/) :

- `gestes-de-l-architecte.md` : les gestes par cas, les lignes de situation particulière de `.01`, `.04` et `.07`, et les cas sans ticket ;
- `rapport.md` : le rapport du rédacteur de la spec d'essai ;
- `cas-17/` : le module volontairement défectueux de `.07`, sa version corrigée et le diff de ses défauts.

**Ces fichiers ne vont jamais dans `essai-relecture-8`, ni dans un prompt de relecture.** Les lignes de situation se donnent au conducteur, qui les recopie dans le seul prompt de la fille. Les cas ne prouvent rien si les relecteurs savent où sont les écarts. La ligne de `.01` dit « trois tests neufs » : le ticket en a gagné un en relecture.

Dans l'ordre :

1. Lis la carte du sujet (`docs/features/essai/all/` sur `sujet/essai-regime-8`), et sa passation du conducteur. Ne lance rien avant d'avoir vu les trois anciennes sessions arrêtées.
2. Relance sur ton compte le Relecteur du dépôt et son capitaine. Puis un conducteur de suite, qui reprend par la passation de la carte. Les prompts sont dans `lancement.md`. La clé `relecture` du contrat porte le couple ordinaire Opus/medium et le couple sensible Opus/xhigh ; la branche par défaut du dépôt est `develop`.
3. Envoie au conducteur les trois lignes de situation, recopiées de `gestes-de-l-architecte.md`, et ce que tu attends de lui pour tes gestes :
   - `.01`, cas 2 : il te nomme la session du tour 2 dès sa distribution, tu l'interromps et tu écris le verdict à sa place ;
   - `.04`, cas 9 : la veille du capitaine s'arrête avant le tour 1 ; « étape 2 : pousse » seulement au tour 1 validé ;
   - `.07`, cas 17 et 22 : au plafond, tu écris la décision.
4. La vague 1 : `.03`, `.05`, `.06` d'emblée, puis `.01`, `.04`, `.07`. La vague 2 : `.02` (cas 4 et 4 bis). Puis les cas sans ticket, dans l'ordre de `gestes-de-l-architecte.md` : 3, 6, 11, 14, 16, 19, 21, 5 en dernier, 23. Le cas 15 est retiré (`A-204`). Le cas 13 (copie d'Anchorpost) n'est pas joué.
5. Fin de l'essai : les coûts dans la carte, les sessions interrompues archivées, puis le **lot 7** (la repose dans les projets) revient aux architectes des projets.

**L'accord `P-66`** du produit vaut pour l'essai seulement : les fichiers sensibles `scripts/chaine/**`, `scripts/agent/**` et `.github/workflows/**` d'`essai-relecture-8`, pour les cas 7, 17 et 20.

**Les protections de `develop` d'`essai-relecture-8`** sont posées par le produit : PR exigée, contrôles `qualite`, `test-db` et `zizmor` exigés. Le dépôt `anchorpost-essai` n'a plus de travail en cours.

## L'architecte B (Anchorpost, preuve suffisante)

Session `session_012xRpgbZfY6XDgxCUwg1LXD`, sur l'ancien compte : tu ne peux pas lui écrire. Le produit lui transmettra l'identifiant de ta session, et il t'écrira. Il a été prévenu de la passation. Entre vous, il reste :

- **La cible `^2.0.3`** : quand il publie la CLI 2.0.3 (un dernier correctif, `.76`, est en cours chez lui), le skill `anchorpost` passe de `@maj-agency/anchorpost@^2` à `^2.0.3` là où il le faut, par un petit ticket.
- **`floor.by` est une clé de `roles`** : la CLI 2.0.4 l'alertera ; le skill `anchorpost` (la fiche `.claude/rules/anchorpost.md`, le gabarit du manifeste) doit le dire.
- K1 à K3, K5 et K6 sont servis.

**L'architecte de Fedora** a signalé un client Prisma périmé à la régénération des index. Conseil donné : régénérer Prisma d'abord, dans leur `index-generes.json`, avec une `verification`. Il reste une phrase de documentation à écrire dans `socle-chaine-de-production` (liste des suites).

## Quoi faire, dans l'ordre

1. **Le ticket 91** : relecture, décisions, session, deux tours sur la PR, fusion (8.3.1).
2. **L'essai réel du régime 8** (section précédente). Il se mène en parallèle du point 1 : les deux ne partagent aucun fichier.
3. **Les tickets de suite, à écrire** : un tour de relecture chacun (`P-65`), regroupés par famille de fichiers, trois au plus par PR.
   - **`fusionner` et `sujet`** :
     - le clone superficiel ;
     - `regrouper` sur une fourche ;
     - `gh` et `jq` absents ou cassés dans `preparer` (`A-203` : `jq` absent rend la sortie 6) ;
     - `livrer` qui régénère les index générés ;
     - les petits-enfants orphelins au délai de `spawnSync`.
   - **`relecture`, `relecteur` et `double-relecture`** :
     - `double-relecture` qui lit `Prouve:`, avec la règle 14 du gate ;
     - le pied de page « À relire » dans la documentation ;
     - le Relecteur qui annonce « refusé, double » avant que le verdict de la session B soit sur la PR (vu sur la PR 3 de l'essai, à vérifier dans les commentaires).
   - **`socle-tests`** : `mutation-regles.test.mjs` sans `apps/api/`.
   - **Les bancs** :
     - les dossiers laissés dans `TMPDIR` par une dizaine de bancs de `references/` (ticket 90, « trouvé en plus », 6) ;
     - aucun banc ne prouve que le hook refuse l'édition d'un index généré (ticket 90, 8).
   - **Le ticket 91, hors périmètre** :
     - les 18 fichiers posés que Prettier reformate encore ;
     - l'entrée OpenAPI du gabarit `index-generes.json` posée sans API ;
     - les autres bornes en millisecondes des bancs posés.
   - **Le garde étendu** à `pnpm lint` et `check:contexte` (ticket 90, « L'extension ») : un ticket de taille moyenne, après le 91.
   - **La documentation** :
     - les phrases m2 et m3 de README et `CONTENU.md` relevées sur la PR 156 ;
     - la note 8.0.1 : la fourche vers `develop` ;
     - la phrase Prisma pour Fedora ;
     - le skill `chantier` sur la PR du conducteur lui-même vers `develop` ;
     - la longueur du pre-push ;
     - l'avertissement de commitlint sur le pied de page.
   - **`anchorpost`** : `^2.0.3` et `floor.by` (section précédente).
   - **Les trouvailles du cas 12** :
     - les anciens scripts n'ont pas la règle d'ascendance (Anchorpost la tient par son `A-208`, repose au ticket `A-261` chez lui) ;
     - `livrer` ne régénère pas les index.
4. **Les lots 8 et 9 de la spec, ensemble** (section « Les lots » de `relecture-independante.spec.md`) :
   - le lot 8, `skills` lui-même (`A-101`) : un Relecteur pour ce dépôt, par une procédure dans les prompts ; la phrase de `lancement.md` qui mêle le régime des dépôts à chaîne et la procédure de `skills` est coupée en deux ;
   - le lot 9, le nettoyage (`A-102`) : quand plus aucune PR des projets n'est en régime 7, la branche 7 des scripts, `regime-7.md`, les deux anciens skills de revue comme points d'entrée et `Label: contre-revue` sortent du plugin, avec les phrases « relecteur indépendant » de la 7.15.0 et leur test (`A-108`). Il dépend du lot 7 : ne le livre pas avant que les projets aient reposé.
5. **Le lot 7** (repose dans Anchorpost, Fedora et Iroki, `A-99`) revient à leurs architectes après l'essai.
6. **Les notes encore sans ticket** : la carte de chantier trop lourde, la lecture des blobs par sha.

## Ce qu'on a appris depuis la passation du 2026-11-21 (à garder)

- **Une liste vide de contrôles exigés se lit comme « sans CI »**, et la PR ne passe jamais. Elle s'est vue deux fois, au bout d'une heure ou plus chaque fois. Avant toute première PR d'un dépôt, lis toi-même ses règles de protection de `develop`. Le ticket 91 le corrige dans le script.
- **À la fusion de `main` dans une PR, la note de version se repose depuis la branche, jamais depuis l'annexe** (`A-205`, point 2) : `git diff $(git merge-base origin/main HEAD) HEAD -- NOTES-DE-VERSION.md`. Le geste qui a marché sur les PR 155, 154 et 157 :
  1. `git merge --no-ff --no-edit origin/main` ;
  2. `git checkout origin/main -- .claude-plugin/plugin.json NOTES-DE-VERSION.md` ;
  3. monter la version à la main (le README : le troisième chiffre pour un correctif, le deuxième pour un skill ou une fonction neuve ; il n'y a pas de script de version dans le dépôt) ;
  4. réinsérer la section de la branche, prise par `awk` entre son titre et le titre suivant, avec son sha256 donné à la session.

  Calcule toi-même l'arbre attendu dans un worktree à part. La session n'a plus qu'à atteindre ce sha par `git write-tree` : s'il diffère, elle s'arrête.
- **Un delta qui n'est que texte ou bancs de texte n'est pas relu par un sous-agent** (`A-211`, `A-216`). L'architecte vérifie que le commit est égal au patch (diff octet pour octet) et que la CI est verte, puis écrit le verdict `conforme`. Pas de tour 3.
- **Le job `bancs` de la CI de `skills`** (arrivé avec la PR 156) dure plus que les trois autres contrôles. Le capitaine l'attend : pose quand même le verdict et l'ordre dès que l'arbre est vérifié.
- **Une décision de plafond remet à zéro le compte des tours** (`decision-relecteur.mjs` : seuls comptent les tours distribués après la décision la plus récente). Après elle, un refus se traite comme d'habitude, et le Relecteur reposera le plafond au troisième refus compté.
- **Le plafond de contexte du conducteur** (400 k) arrive vite sur un chantier de relecture : environ 400 k en sept heures. Au plafond, la chaîne fait décider le produit. Mais une passation écrite dans la carte change le sommet d'une PR ouverte, et y fait perdre ses verdicts. Elle s'écrit donc par `sujet.sh carte` sur le sujet, une fois la PR entrée.
- **Un redémarrage du conteneur** perd le rapport final d'un sous-agent en vol, mais pas ses fichiers sous `/home/user/agents/<nom>/publier/`. Publie toujours dans ce dossier, au fil de l'eau.
- **Un `find` sur `/home/user/agents`** traverse des `node_modules` et dépasse le délai de l'outil. Cherche par le chemin publié dans la branche de documentation.

## Règles de travail (rappel)

Celles de la passation du 2026-11-21 tiennent toutes. En particulier :

- **L'ordre de fusion dans `skills`**, dans cet ordre :
  1. un commentaire de verdict dont la première ligne est exactement `contre-relecture conforme au sommet <sha40>` ;
  2. un commentaire dont le corps est exactement `à-fusionner au sommet <sha40>`, éventuellement suivi d'une ligne vide, de `---` et du pied de page des sessions cloud ;
  3. le label `à-fusionner`.

  Un push après l'ordre l'invalide.
- **L'architecte vérifie chaque fusion à la source** : l'arbre du squash égal à celui du sommet ordonné, et la version de `.claude-plugin/plugin.json`.
- **Les sessions de ticket et de retouche tournent sur Sonnet**, avec des gestes exacts et le sha256 du patch. Elles poussent, commentent, lisent la CI une fois et s'arrêtent. Les relectures et contre-relectures tournent sur Opus, en sous-agent, dans un dossier privé `/home/user/agents/<nom>/`, avec un dossier `publier/` copié dans la branche de documentation après un `grep -rn '/home/\|/tmp/'` qui ne rend rien.
- **Chaque geste se journalise** dans le `## Journal` de la carte, une entrée datée en UTC par événement. Les coûts vont dans `## Coût`, et les décisions dans la spec, numérotées à la suite (la prochaine est `A-217`).
