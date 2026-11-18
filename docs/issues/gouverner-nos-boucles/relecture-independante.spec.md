# La relecture que l'auteur ne contrôle pas — spec du chantier 3

Programme : [`map.md`](map.md) (« gouverner nos boucles »). Décisions du produit : `P-47` à `P-53` et `P-55` à `P-58` de la carte, prises le 2026-11-18 dans le grilling du chantier 3. Elles amendent `P-6` et `P-38` et remplacent `P-41`. État : **troisième version**, reprise sur deux relectures par des agents neufs ([première](relecture-independante.relecture-1.md), [seconde](relecture-independante.relecture-2.md)) ; à faire relire une troisième fois, puis à découper. Quatre points sont à dire au produit (fin de ce document).

## Le problème

Aujourd'hui, la session qui code un ticket lance elle-même ses relecteurs, trie leurs constats et écrit la section de revue de sa PR (`revue-de-ticket/SKILL.md`, étapes 2 à 5). Le capitaine vérifie, pour les chemins que `revue-exigee.mjs` désigne (`cheminExige`), la présence d'un titre « Revue… » dans le corps de la PR. Le conducteur contre-relit les PR à chemin sensible par un sous-agent (`chantier/SKILL.md` § 6, point 5), dans son propre contexte, et il a écrit le ticket contre lequel il juge. Les PR de documentation du conducteur et de l'architecte (tickets, règles, specs) ne sont relues par personne d'indépendant.

Le fichier CODEOWNERS ferait dépendre chaque PR sensible d'une seconde personne : toutes les sessions écrivent sous le compte du produit, et GitHub refuse qu'un auteur approuve sa propre PR.

## Ce qui change, vu par le produit

- **Fichiers sensibles** (`P-47`, `P-48`, `P-49`) : l'accord du produit est demandé **avant** d'y toucher, une fois, quand il valide le découpage d'un chantier. Le conducteur dit quels fichiers, pourquoi, et ce qui va y changer. Sans l'accord noté, la machine refuse la modification. Aucun blocage par GitHub ; le fichier CODEOWNERS disparaît.
- **Toute PR a une relecture indépendante** (`P-51`), quel que soit son auteur. **La session qui code ne se relit plus** (`P-52`).
- **Un Relecteur par dépôt** (`P-55`) aiguille : il lance une session de relecture par PR. Il ne transporte jamais les constats, ne les résume pas, n'arbitre rien. Le verdict s'écrit sur la PR.
- **Un skill unique de relecture** (`P-55`) choisit les contrôles selon ce que la PR contient.
- **Le capitaine ne relit rien** (`P-50`) : son script vérifie que le verdict porte sur ce qu'il fusionne.
- **Trois allers-retours au plus** (`P-53`) : au-delà, l'architecte tranche si la cause est technique et informe le produit ; il ne lui pose une question que si elle est métier.
- **Règle de criticité haute** (`P-56`) : deux relectures indépendantes, et un message d'information au produit, sans que la PR l'attende.
- **Le bilan de fin de chantier est supprimé** (`P-57`).
- **Le signal d'un verdict** (`P-58`) : une étiquette sur la PR, un message d'une ligne à l'auteur et au conducteur (où lire, jamais le contenu), un réveil de secours chez l'auteur.

## Vocabulaire

Un mot, un sens. Ces termes entrent dans `CONTEXT.md` avec le lot 3.

| Terme | Sens | Ne pas dire |
| --- | --- | --- |
| **Relecteur** | la session qui aiguille les relectures d'un dépôt ; elle ne relit rien | « relecteur » pour autre chose |
| **session de relecture** | la session lancée par le Relecteur pour relire une PR | relecteur |
| **axe** | un sous-agent en contexte vierge lancé par la session de relecture, avec une liste fermée de critères | relecteur, revue |
| **constat** | ce qu'un axe relève. Deux gravités : **bloquant** (un écart à un critère écrit : il se corrige, ou se conteste) et **doute** (une question, sans obligation) | défaut, « à corriger », mineur |
| **verdict** | le commentaire de la session de relecture ; il vaut **validé** (aucun bloquant) ou **refusé** | « à corriger » |
| **tour** | une demande de relecture d'une PR et le ou les verdicts qui y répondent | aller-retour |
| **même contenu propre** | deux versions d'une PR dont le diff propre ne diffère que par des index générés (`A-81`) | « aux index près » sans définition |
| **contestation**, **arbitrage** | l'auteur conteste un bloquant ; un arbitre le maintient ou l'écarte | — |
| **décision de plafond** | ce que décide l'architecte après le troisième tour refusé | arbitrage |
| **étiquette** | un label GitHub | label, dans la prose |
| **auteur** | la session qui a écrit la PR | propriétaire |

## Décisions de conception (architecte)

Numérotées dans la suite de la carte ; elles remplacent celles des deux premières versions.

### Fichiers sensibles

- `A-73` — **Un chemin sensible ne se modifie que sur la branche d'un ticket.** Il n'y a pas d'exception pour la branche de cadrage : ce que le plugin fait aujourd'hui écrire au cadrage sur un chemin sensible (ajouter le dossier d'un module à `cheminsSensibles`, poser un socle) devient un ticket du chantier, le premier quand d'autres en dépendent. `chantier/SKILL.md` et `chaine-de-production.md` § 3 le disent à la place de « dans la même PR de cadrage ».
- `A-74` — **La ligne `Sensibles:` du ticket.** Elle nomme des chemins exacts ou des motifs, tous sous un chemin sensible (`cheminsSensibles` de `.claude/chaine.json`), puis qui a accordé et quand : `Sensibles: scripts/chaine/passer.sh, scripts/chaine/passer*.test.mjs — accord de <nom>, 2026-11-18`, ou `Sensibles: —`. Elle se lit sur `origin/sujet/*`, comme `Dépendances:` (`agent/garde-commandes.mjs`), jamais dans l'arbre de travail ni sur la branche de la session ; pour un ticket sans sujet, sur `origin/develop`, où le ticket entre d'abord par sa propre PR de documentation. Une branche de mise à jour d'un sujet (`maj/<nom>`) est couverte par l'union des lignes des tickets de ce sujet.
- `A-75` — **La demande d'accord est un tableau de la carte**, section `## Fichiers sensibles` : une ligne par fichier (ticket, chemin, pourquoi, ce qui y change). Le conducteur l'écrit au découpage ; l'architecte la soumet au produit avec le découpage (sans programme, le conducteur la soumet lui-même) ; les lignes `Sensibles:` des tickets ne sont remplies qu'après l'accord, dans la PR de cadrage, qui est relue. Un fichier découvert en route : la session s'arrête et l'écrit au conducteur, qui obtient l'accord par la même voie, puis ajoute le chemin au ticket par une PR de documentation vers le sujet, relue comme les autres.
- `A-76` — **Trois gardes mécaniques**, qui lisent la même ligne et ne s'activent que sur un dépôt en régime 8 (`A-97`) : le hook d'édition (`agent/garde-fichiers.mjs`, `regles.mjs`) refuse l'écriture d'un chemin sensible que la ligne ne couvre pas ; `sujet.sh fusionner` (sous-PR) et `passer.sh` (PR vers `develop`) renvoient une PR dont le diff touche un chemin sensible non couvert. Une livraison de sujet n'y repasse pas. Une PR sans ticket qui touche un chemin sensible est renvoyée. Le hook lit le sujet par le réseau, comme `garde-commandes` ; il ne voit pas une écriture faite par une commande, que les deux autres gardes rattrapent.
- `A-77` — **CODEOWNERS sort du plugin.** Retirés : `scripts/github/codeowners.mjs` et son test, son gate et l'entrée de `gatesRapides`, la clé `proprietaires`, le refus d'éditer CODEOWNERS dans `regles.mjs`, les états « attend un propriétaire » et « attend un humain » qui en viennent (`fusionner/scripts/github.sh`, `file.sh`, `passer.sh`, `boucle.sh` et leurs tests), la case correspondante d'`admin.md` — ses sous-règles (pas de push forcé, pas de suppression de branche, aucune liste de contournement) restent, dans la protection de branche. **`proprietaire.sh` reste** : il retrouve la session auteur d'une PR. L'ADR « CODEOWNERS » est marquée remplacée. La repose retire `.github/CODEOWNERS` quand il porte l'en-tête du générateur.

### Le skill `relecture`, le verdict, les deux calculs partagés

- `A-78` — **Un skill `relecture`** (`skills/chaine/relecture/`), joué par une session de relecture, jamais par l'auteur. La session de relecture est créée sur **la base** de la PR, pas sur sa tête : elle ne charge ni le `CLAUDE.md` ni les hooks que la PR modifie. Elle lit le diff de la PR contre sa base et choisit ses axes :

  | Le diff contient | Axes |
  | --- | --- |
  | un chemin que `revue-exigee.mjs` désigne (`cheminExige`), avec un ticket | Règles, Ticket, Documentation |
  | un tel chemin, sans ticket | Règles |
  | un chemin sensible | en plus : la ligne `Sensibles:` couvre chaque chemin touché ; `/security-review`, comme `revue-adversariale` aujourd'hui |
  | des tickets, une spec, une carte | Tickets : format prêt pour agent, paraphrase de la spec, décision laissée ouverte, référence morte, surface sans preuve, fichier chaud en double dans une vague |
  | une règle métier, une criticité, le glossaire | Règles métier : critère `D8`, cas et familles, criticité et sa raison, vocabulaire |
  | toute autre documentation (ADR, README, méthode, planches) | Documentation |

  Un diff qui relève de plusieurs lignes reçoit l'union de leurs axes. Pour une PR de mise à jour d'un sujet, le diff relu est celui que le capitaine juge : la résolution du conflit et les retouches (les listes que `sujet.sh verifier_mise_a_jour` calcule), pas tout `develop`. Les prompts et les critères de `revue-de-ticket` et de `revue-adversariale` deviennent des références de `relecture`, récrits avec les deux gravités ; leurs scripts (`diff-revue.sh`, `chemins-sensibles.mjs`, `contexte-ticket.mjs`) et le fichier de critères sont posés par `relecture poser`. `T3` est joué par la session de relecture pour toutes les criticités : la précision provisoire de `P-38` tombe.
- `A-79` — **La session de relecture trie avant d'écrire.** Elle relit chaque constat d'un axe dans le code, ligne ouverte : sans critère cité, ou faux, il est écarté, et le verdict dit combien et pourquoi en une phrase chacun. Elle ne modifie aucun fichier et ne pousse rien.
- `A-80` — **Le verdict est un commentaire de la PR**, de forme fixe, que la machine lit : une marque invisible ; `Sommet relu:` (sha de 40 caractères) ; `Tour:` (le numéro que le Relecteur lui a donné) ; `Verdict:` (`validé` ou `refusé`) ; `Bloquants:` (nombre) ; `Session:` (son identifiant) ; puis les constats (gravité, critère, fichier et ligne, constat, et pour un bloquant le test qui l'aurait attrapé). Un axe en échec s'écrit « non exécuté » et le verdict est `refusé`. Le lecteur tolère le pied de page des sessions cloud, et ignore un commentaire modifié après sa création (`updated_at` différent de `created_at`), comme la procédure de `skills` le fait déjà.
- `A-81` — **« Même contenu propre », un seul calcul**, écrit une fois (`relecture/scripts/`), posé dans `scripts/chaine/`, appelé par le Relecteur et par le capitaine. Deux versions V (relue) et T (la tête) d'une PR ont le même contenu propre quand l'arbre de T égale la fusion recalculée (`git merge-tree`) de V avec le commit de base que T contient, hors index générés ; et un index généré n'est dispensé que selon les trois classes que `passer.sh` (`livraison_intermediaire`) applique déjà : régénéré par une commande ; sans commande, seulement si son contenu est celui de la base ; déclaré par motif, seulement sur un contenu déjà connu. C'est la généralisation de ce calcul existant, pas une notion nouvelle.
- `A-82` — **« Double relecture exigée », un seul calcul**, de même. Une PR l'exige quand son diff touche le fichier d'une règle de criticité haute, ou un fichier nommé par le champ `code:` d'une telle règle, ou quand son ticket porte la ligne `Relecture: double`. Le niveau se lit sur la base de la PR : dans l'index Anchorpost quand le dépôt en a un (niveau effectif), sinon dans l'en-tête des fichiers de règle (`criticality`, valeur `high`, sous ses deux formes). Sans ticket, sans ligne `Règles:`, ou pour une règle devenue haute après l'écriture du ticket, le calcul répond donc quand même.

### Le Relecteur et les étiquettes

- `A-83` — **Un rôle, un skill, une session par dépôt.** Skill `skills/chaine/relecteur/`, lancé par l'architecte en même temps que le capitaine (gabarit dans `architecte/references/lancement.md`), qui l'inscrit sur la ligne `Relecteurs:` de la carte du programme, comme il le fait pour `Capitaines:`, et n'en lance pas un second tant que cette ligne nomme une session vivante. Sans programme : qui lance le capitaine, sur une ligne `Relecteur:` de la fiche de la carte du chantier. Sa consigne vient du gabarit mot pour mot. `chantier` vérifie qu'un Relecteur tourne, comme il le fait pour le capitaine.
- `A-84` — **Les étiquettes.** Deux nouvelles, `à-relire` et `à-reprendre`, ajoutées à `labels.sh` et à `admin.md` (un administrateur les crée avant la repose). **Une PR en relecture garde `à-relire`** : il n'existe aucun état sans étiquette.

  | État de la PR | Étiquette | Qui la fait passer | Vers |
  | --- | --- | --- | --- |
  | à relire, puis en relecture | `à-relire` | **l'auteur** la pose à la place de `à-reprendre` ou de `fusion-bloquée`, avec un commentaire `À relire — Session: <la sienne, ou —> — Conducteur: <celle du conducteur, ou —>` | verdict |
  | tour refusé | `à-reprendre` | **le Relecteur**, à la lecture des verdicts du tour, à la place de `à-relire` | à relire, après correction |
  | tous les verdicts exigés `validé`, et la tête de même contenu propre que le sommet relu | `à-fusionner` | **le Relecteur**, à la place de `à-relire` | le capitaine |
  | renvoyée par le capitaine | `fusion-bloquée` | **le capitaine** | à relire |
  | poussée après un verdict validé | `à-reprendre` | **le Relecteur**, à la place d'un `à-fusionner` périmé, avec une ligne « poussée après le verdict » | à relire |

  L'auteur ne pose jamais `à-fusionner`. Seule exception, qui n'est pas un auteur : `sujet.sh livrer`, qui continue de poser `à-fusionner` sur la livraison d'un sujet (`A-91`). Le Relecteur et le capitaine ajoutent et retirent une étiquette à la fois, par les fonctions de `github.sh` ; une étiquette perdue par deux écritures croisées se répare d'elle-même, parce que le Relecteur recalcule l'état d'une PR à chaque passage à partir de ses commentaires, jamais de l'étiquette seule.
- `A-85` — **Sans mémoire, et sans dépendre d'un message.** À chaque réveil de sa veille, le Relecteur liste les PR ouvertes qui portent `à-relire` ou `à-fusionner`, hors sujet gelé (`Gel:`), et lit les commentaires de chacune :
  1. pas de commentaire `Relecture — tour k` pour la demande en cours : il lance la ou les sessions de relecture, **puis** écrit `Relecture — tour k — sommet <sha> — sessions <…> — verdicts exigés <1 ou 2>` ;
  2. un tour distribué, des verdicts manquants : il lit l'état de la session attendue ; morte ou au plafond de contexte, il en lance une autre et écrit un nouveau commentaire de même forme, `… (remplace <identifiant>)`, puis le dit au conducteur ; vivante, il attend ;
  3. tous les verdicts du tour écrits : il pose l'étiquette (`A-84`), puis écrit une ligne à l'auteur et au conducteur nommés par le commentaire `À relire` : « verdict écrit sur la PR n : refusé » ou « validé ». Jamais un constat, jamais un résumé ;
  4. la tête a changé pendant le tour : il redistribue sur la nouvelle tête, commentaire `… (redistribué)`, sans compter un tour ;
  5. `à-relire` sur une PR dont le contenu propre n'a pas changé depuis un tour validé (renvoyée pour un contrôle instable, ou mise à jour par le capitaine) : il repose `à-fusionner` sans nouveau tour.

  La session de relecture, son verdict écrit, lui écrit une ligne : ce message ne fait que hâter le réveil ; perdu, le passage suivant de la veille fait le même travail. Il n'arbitre rien.
- `A-86` — **Le réveil de secours de l'auteur** : si la PR porte `à-reprendre`, lire le verdict et corriger ; si elle porte `à-relire` depuis plus d'une heure sans commentaire `Relecture — tour` pour sa demande, l'écrire au conducteur (un Relecteur arrêté) ; sinon rien, et le réarmer une fois.
- `A-87` — **Le coût et l'archivage.** Une session de relecture a le rôle `relecture` dans `## Coût` (gate `tickets`, `couts.mjs`). Qui archive l'auteur archive aussi les sessions de relecture de la PR, lues sur elle, et note leur coût : le conducteur pour ses filles, l'auteur lui-même pour une PR du conducteur ou de l'architecte. Le modèle d'une session de relecture est celui de la clé `relecture.modele` de `chaine.json`. Une session de relecture remplacée au plafond de contexte se signale au conducteur, comme tout plafond.

### Contester, plafonner

- `A-88` — **Contester.** L'auteur répond sur la PR, `Contesté — <critère, fichier et ligne> — <raison>`, et écrit une ligne à l'arbitre. L'arbitre écrit `Arbitrage — … — maintenu` ou `écarté — <raison>`. L'auteur repose `à-relire` ; le Relecteur renvoie la PR à la même session (`Relecture — tour k, après arbitrage`), qui rend un verdict où un bloquant écarté ne compte plus, reconnu par son critère et son lieu. Cette reprise appartient au même tour. L'arbitre n'est jamais l'auteur : pour une PR d'une fille, le conducteur ; pour une PR du conducteur, l'architecte (sans programme, le produit) ; pour une PR de l'architecte, **le produit**, que l'architecte évite en corrigeant.
- `A-89` — **Le plafond.** Un tour est **refusé** si l'un de ses verdicts l'est ; un tour redistribué ou repris après arbitrage ne se compte qu'une fois ; un tour validé puis renvoyé par le capitaine ne compte pas. Au **troisième tour refusé** depuis la dernière décision de plafond, le Relecteur pose `à-reprendre`, écrit `Plafond — décision attendue` sur la PR, et écrit une ligne au conducteur et à l'architecte (sans programme, au conducteur, qui va au produit si la cause est métier). Tant que ce commentaire est le dernier de son genre, il ignore un `à-relire` reposé sur cette PR. L'architecte écrit `Décision de plafond — …` (ticket récrit ou découpé, désaccord tranché) ; le compte repart de zéro. Ce plafond n'est pas celui des renvois du capitaine (`renvoisParPR`), qui reste tel quel.

### Criticité haute

- `A-90` — **Deux sessions de relecture** quand le calcul de `A-82` le dit. Le Relecteur en lance deux, écrit « verdicts exigés 2 » ; chacune a pour consigne de ne pas lire le verdict de l'autre. Le capitaine ne se fie pas à ce commentaire : il refait le calcul et exige lui-même deux verdicts validés de deux sessions distinctes. Le gate `tickets` exige en outre la ligne `Relecture: double` sur un ticket ouvert qui cite une règle haute, pour que le conducteur le sache au découpage. Le message d'information au produit part du conducteur, qui connaît le ticket, par l'architecte : la règle, ce qui change, les deux verdicts.

### Le capitaine

- `A-91` — **`revue-exigee.mjs` lit les verdicts**, au moment où il juge l'éligibilité, avant sa propre mise à jour de la PR, comme aujourd'hui. Il veut, pour le dernier tour distribué, le nombre de verdicts `validé` que le calcul de `A-82` exige, de sessions distinctes, et que leur `Sommet relu` ait le même contenu propre que la tête (`A-81`). Une PR qu'il a lui-même mise à jour au passage précédent reste donc valable. Sinon : renvoi, avec le motif ; `renvoyer.sh` dit désormais « corriger, puis poser `à-relire` à la place de `fusion-bloquée` ». Toute PR est concernée, documentation comprise.
- `A-92` — **Deux gestes seulement ne demandent pas de verdict.** Le report de `develop` dans un sujet par le capitaine (`sujet.sh rafraichir`, un push sans PR). Et la livraison d'un sujet, **quand le calcul prouve qu'elle n'apporte que le sujet fusionné avec `develop`** : la preuve que `passer.sh` exige aujourd'hui d'une livraison intermédiaire (`livraison/*`) s'applique aussi à la livraison finale, dont la tête est `sujet/*` et qui n'est dispensée aujourd'hui que sur son nom. Une livraison qui ne passe pas cette preuve redevient une PR ordinaire. **La PR de mise à jour d'un sujet, ouverte par une session, n'est pas exemptée.**

### Les sessions qui codent, le conducteur, l'architecte

- `A-93` — **La session qui code** (`chaine-de-production.md` § 5) : l'étape « revue de ticket » devient « demander la relecture » — dernier push, PR hors brouillon, commentaire `À relire` et étiquette, une ligne au conducteur, le réveil de secours. Sur `à-reprendre` : lire le verdict sur la PR, corriger chaque bloquant avec son test ou le contester, pousser, reposer `à-relire`. Elle ne lance aucun relecteur et ne pose jamais `à-fusionner`.
- `A-94` — **Le conducteur** ne contre-relit plus et ne relaie aucun constat. Il arbitre les contestations de ses filles et reçoit les plafonds. `Label: contre-revue` n'a plus d'effet : le gate cesse de l'exiger et garde la valeur lisible sur les tickets existants ; `lancement.md` ne fait plus livrer « selon la ligne `Label:` ». Ses propres PR passent par `à-relire`. La carte, qu'il tient à jour sur le sujet sans PR (`sujet.sh carte`), reste hors relecture : c'est un journal, et elle ne porte plus aucun accord (`A-73`).
- `A-95` — **Le bilan sort du plugin** : l'obligation d'une section `## Rétro` non vide pour passer une carte à `fini` est retirée du gate, de `chantier/SKILL.md`, des gabarits, de `pieges.md`, du `README.md` et de leurs tests. Un incident donne un ticket au moment où il arrive.
- `A-96` — **Une ADR « relecture indépendante et accord des fichiers sensibles »** remplace l'ADR « CODEOWNERS » et amende les points de l'ADR de la chaîne qui décrivent la revue par l'auteur et la contre-revue. Elle est écrite avec la bascule, pas avant : elle décrirait sinon un régime qui n'est pas encore là.

### Passage de la 7 à la 8

- `A-97` — **La clé `relecture` de `.claude/chaine.json` est l'interrupteur du régime 8.** Elle est posée par la repose, et ajoutée au gabarit `chaine.json` du socle par le lot de bascule seulement. Tout ce qui est fusionné avant la bascule est sans effet tant qu'elle manque : les skills neufs ne sont lancés par personne, les gardes de `A-76` ne s'activent pas, le gate accepte les lignes nouvelles sans les exiger.
- `A-98` — **Trois cas pour une session lancée après la bascule**, écrits en tête de `chantier`, `fusionner`, `relecteur`, et du § « demander la relecture » : pas de `.claude/chaine.json` — le dépôt n'a pas la chaîne, rien ne change (c'est le cas de `skills`, et celui d'un socle à poser) ; un contrat avec la clé — régime 8 ; un contrat sans la clé — le dépôt n'est pas reposé, la session s'arrête et le dit à qui l'a lancée. Le skill `architecte` ne s'arrête pas : il ne lance aucune session sur un dépôt dont le contrat n'a pas la clé, hors la repose. `revue-de-ticket/SKILL.md` et `revue-adversariale/SKILL.md` restent lisibles, réduits à ce même renvoi.
- `A-99` — **La repose ne se fait pas sur un chantier en marche.** Les sessions déjà lancées ne relisent pas le marketplace : elles resteraient en 7 avec des scripts de la 8, que la boucle du capitaine recopie de `develop` à chaque tour. Ordre, pour chaque dépôt : l'architecte du projet gèle ses chantiers ouverts (`Gel:`), laisse entrer les PR en vol, arrête le conducteur, les filles et le capitaine ; la bascule une fois dans `main` de `skills`, il joue la repose (une PR, relue selon la 7, puisque le dépôt n'est pas encore en 8) ; il relance un capitaine, un Relecteur et les conducteurs, sessions neuves ; il dégèle. Entre la bascule et la repose d'un dépôt, aucune session nouvelle n'y travaille : c'est un délai, à dire au produit.
- `A-100` — **Le lot de bascule est une seule PR dans `skills`**, qui n'a ni `develop` ni sujet et dont le capitaine ne fusionne que vers la branche par défaut. Elle est écrite sur une branche par des sessions qui se relaient, une par partie (`a` à `f` ci-dessous), chacune poussant sur la même branche. L'architecte fait contre-relire chaque partie par un agent neuf sur les fichiers de cette partie, puis l'ensemble une fois, et un essai réel sur un dépôt jouet précède l'ordre de fusion.
- `A-101` — **Le dépôt `skills`** garde sa procédure actuelle jusqu'au dernier lot : la bascule ne touche pas les paragraphes de `lancement.md` qui la portent. Le dernier lot lui donne un Relecteur, par une procédure dans les prompts, et l'ordre `à-fusionner au sommet <sha>` est alors écrit par le Relecteur quand le verdict est validé.

## Les lots

Deux lots qui touchent un même fichier se suivent. Les lots 1 à 4 sont sans effet sur un dépôt (`A-97`).

1. **Retrait de CODEOWNERS** (`A-77`). `socle/scripts/github/codeowners*`, `socle/chaine.json`, `socle/agent/regles.mjs` et son test, `fusionner/scripts/{github,passer,file,boucle}.sh`, `fusionner.test.mjs`, `veille.test.mjs`, `sujet/scripts/faux-gh.mjs`, `fusionner/SKILL.md` et son `CONTENU.md`, `socle/SKILL.md` et son `CONTENU.md`, `admin.md`, `fragments/claude-md-fusion.md`, `chaine-de-production.md`, `chantier/SKILL.md`, `README.md`, `scripts/{depot,poses,points-d-entree}.test.mjs`.
2. **Ce qui ajoute ou relâche dans le gate et les gabarits**, après 1 : le gate `tickets` accepte `Sensibles:`, `Relecture: double`, le rôle `relecture`, cesse d'exiger `Label: contre-revue` et `## Rétro` (`A-95`) ; gabarits `ticket.issue.md` et `carte.map.md` ; `couts.mjs` ; `chantier`, `pieges.md`, `README.md` pour le bilan.
3. **Skill `relecture`, verdict, les deux calculs** (`A-78` à `A-82`), après 2 : le skill, ses prompts et critères récrits, `relecture poser`, le lecteur de verdict, « même contenu propre », « double relecture exigée », leurs tests ; `plugin.json`, `README.md`, `CONTEXT.md`, `socle-monorepo/.../references-agent-integrees.json`, les tests de `scripts/` qui connaissent les skills.
4. **Skill `relecteur`** (`A-83` à `A-90`), après 3 : le skill, sa file et sa veille, le gabarit dans `lancement.md`, `labels.sh`, `admin.md`, « sept labels » dans `socle/SKILL.md`, `gabarits/programme.md` (`Relecteurs:`) et `carte.map.md` (`Relecteur:`), `plugin.json`, `README.md`, `references-agent-integrees.json`.
5. **Bascule, version 8.0.0** (`A-73` à `A-76`, `A-91` à `A-94`, `A-96` à `A-100`), après 4, une PR en six parties :
   - a. éligibilité : `revue-exigee.mjs`, `passer.sh`, `sujet.sh` (`fusionner`, preuve de la livraison finale), les deux `depot-jouet.mjs`, bancs ;
   - b. gardes des fichiers sensibles : `agent/garde-fichiers.mjs`, `regles.mjs`, `revue-adversariale/scripts/chemins-sensibles.mjs`, `sujet.sh`, `passer.sh` ;
   - c. renvois et messages : `renvoyer.sh`, `sujet.sh` (`livrer`, `demarrer`), `github.sh` ;
   - d. documents des sessions : `chaine-de-production.md` (rôles, § 3, § 5), `fragments/claude-md-fusion.md`, `socle-monorepo/.../racine/CLAUDE.md` et `methode/conception.md`, `tickets/.../issue-tracker.md`, `avancement.mjs`, `criticite/SKILL.md`, `recette-humaine/SKILL.md` ;
   - e. skills des rôles : `chantier`, `architecte`, `lancement.md` (hors les paragraphes de `skills`), `fusionner/SKILL.md`, `sujet/SKILL.md`, la tête à trois cas (`A-98`) ;
   - f. interrupteur et version : clé `relecture` dans `socle/chaine.json`, `socle/SKILL.md` (`relecture poser`), `revue-de-ticket` et `revue-adversariale` réduits et retirés des points d'entrée, l'ADR, `plugin.json` 8.0.0, et l'essai réel de la « Vérification d'ensemble ».
6. **Repose** dans Anchorpost, Fedora et Iroki (`A-99`), par leurs architectes.
7. **`skills` lui-même** (`A-101`).

## Ce que cette spec ne ferme pas

- **Toutes les sessions écrivent sous le compte du produit.** Une étiquette, un verdict, une ligne `Sensibles:` peuvent être écrits par n'importe quelle session : ces gardes tiennent face à une session de bonne foi qui suit son skill, pas face à une PR hostile. Le retrait de CODEOWNERS retire la seule protection de GitHub qui visait ce cas ; il reste la protection de branche.
- **C'est un agent qui écrit le nom de qui a accordé** un fichier sensible. Rien ne prouve l'accord, sinon la conversation du produit.
- **Le Relecteur est un point de passage** : arrêté, plus aucune PR n'est relue. Il se relance sans rien perdre ; le réveil de secours de l'auteur le signale (`A-86`).
- **Le coût** : une session de relecture par PR, deux pour une règle haute ; chaque correction rouvre la CI entière, la PR n'étant plus en brouillon.
- **Deux sessions de relecture d'une même PR peuvent lire le verdict l'une de l'autre** : la consigne l'interdit, rien ne l'empêche.
- **Une PR écrite par un humain ou par un outil**, sans session auteur : le commentaire `À relire` porte `Session: —`, la relecture se fait, personne n'est sonné.
- **Un index généré modifié à la main** entre aujourd'hui tel quel dans un sujet quand la fusion est propre ; la relecture ne lit pas les index. Ce n'est pas nouveau, et ce chantier ne le ferme pas.
- **À sonder avant le lot 4** : qu'une session réveillée par le message d'une autre accepte d'écrire une étiquette. Le dessin n'en dépend plus (`A-85` passe par la veille), le message ne fait que hâter.

## Hors périmètre

Deux défauts de la chaîne relevés le 2026-11-18, qui ont leurs tickets à part : `chantier` § 6 donne `sujet.sh rafraichir` au conducteur alors que c'est le geste du capitaine (`A-69`) ; une PR en retard dont seul un index généré est périmé une fois fusionnée avec la base part au renvoi alors que `passer.sh` sait la réparer. Et un compte propre aux agents, écarté par le produit comme trop compliqué.

## À dire au produit

1. **Qui arbitre une PR de l'architecte** : personne d'autre que lui (`A-88`). À confirmer.
2. **La livraison d'un sujet n'a pas de relecture propre** quand le script prouve qu'elle n'apporte que le sujet et `develop` (`A-92`). Elle contient les PR déjà relues une à une, et la carte du chantier, que le conducteur tient sans PR. À confirmer.
3. **Chaque repose du plugin touche des fichiers sensibles** : elle lui demandera son accord, une fois, sur la liste de ces fichiers (`P-47`). Pour information.
4. **Le passage à la 8 arrête chaque projet le temps de sa repose** (`A-99`) : quelques heures sans session nouvelle. Pour information.

## Vérification d'ensemble

Partie `f` du lot 5, sur un dépôt jouet monté avec les vrais outils et, pour ce qui demande de vraies sessions, sur une copie d'un dépôt réel : une PR de code avec un bloquant planté reçoit `à-reprendre`, puis `à-fusionner` après correction, sans que son auteur ait lancé un relecteur ; le message de la session de relecture au Relecteur est supprimé exprès, et l'étiquette arrive quand même au passage suivant ; le capitaine refuse une PR sans verdict, une PR dont le contenu propre a changé depuis le verdict, et passe une PR qu'il a lui-même mise à jour ; une sous-PR qui touche un chemin sensible hors de sa ligne `Sensibles:` est refusée par le hook et par `sujet.sh fusionner` ; trois tours refusés arrêtent la distribution ; une PR qui touche le code d'une règle haute n'entre pas avec un seul verdict validé, même si le commentaire du Relecteur dit « 1 » ; une PR de tickets passe par l'axe « Tickets » ; un Relecteur relancé à neuf en plein tour reprend la file ; un conducteur lancé sur un dépôt sans la clé `relecture` s'arrête et le dit ; une livraison finale qui porte un commit de plus que le sujet repasse par la relecture.
