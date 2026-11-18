# La relecture que l'auteur ne contrôle pas — spec du chantier 3

Programme : [`map.md`](map.md) (« gouverner nos boucles »). Décisions du produit : `P-47` à `P-53` et `P-55` à `P-58` de la carte, prises le 2026-11-18 dans le grilling du chantier 3. Elles amendent `P-6` et `P-38` et remplacent `P-41`. État : **deuxième version**, reprise sur la relecture d'un agent neuf ([`relecture-independante.relecture-1.md`](relecture-independante.relecture-1.md) : huit bloquants, quinze points à corriger) ; à faire relire une seconde fois, puis à découper. Deux points restent à confirmer par le produit (fin de ce document).

## Le problème

Aujourd'hui, la session qui code un ticket lance elle-même ses relecteurs, trie leurs constats et écrit la section de revue de sa PR (`revue-de-ticket/SKILL.md`, étapes 2 à 5). Le capitaine vérifie, pour les chemins de la liste `exigeRevue`, la présence d'un titre « Revue… » dans le corps de la PR (`fusionner/scripts/revue-exigee.mjs`). Le conducteur contre-relit les PR à chemin sensible par un sous-agent (`chantier/SKILL.md` § 6, point 5), dans son propre contexte, et il a écrit le ticket contre lequel il juge. Les PR de documentation du conducteur et de l'architecte (tickets, règles, specs) ne sont relues par personne d'indépendant.

Le fichier CODEOWNERS, posé le 2026-11-17, ferait dépendre chaque PR sensible d'une seconde personne : toutes les sessions écrivent sous le compte du produit, et GitHub refuse qu'un auteur approuve sa propre PR.

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

Un mot, un sens. Ces termes entrent dans `CONTEXT.md` avec le premier lot.

| Terme | Sens | Ne pas dire |
| --- | --- | --- |
| **Relecteur** | la session qui aiguille les relectures d'un dépôt ; elle ne relit rien | « relecteur » pour autre chose |
| **session de relecture** | la session lancée par le Relecteur pour relire une PR | relecteur |
| **axe** | un sous-agent en contexte vierge lancé par la session de relecture, avec une liste fermée de critères | relecteur, revue |
| **constat** | ce qu'un axe relève, avec sa gravité : **bloquant**, **mineur**, **doute** | défaut, « à corriger » |
| **verdict** | le commentaire de la session de relecture ; il vaut **validé** ou **refusé** | « à corriger » |
| **tour** | une demande de relecture et le verdict qui y répond | aller-retour |
| **contestation**, **arbitrage** | l'auteur conteste un constat ; un arbitre le maintient ou l'écarte | — |
| **décision de plafond** | ce que décide l'architecte au troisième verdict refusé | arbitrage |
| **étiquette** | un label GitHub | label, dans la prose |
| **auteur** | la session qui a écrit la PR | propriétaire |

## Décisions de conception (architecte)

Numérotées dans la suite de la carte. `A-73` à `A-92` de la première version sont remplacées par celles-ci.

### Fichiers sensibles

- `A-73` — **La ligne `Sensibles:`**, en en-tête d'un ticket et dans la fiche d'une carte de chantier. Elle nomme des chemins exacts ou des motifs, tous sous un chemin sensible (`cheminsSensibles` de `.claude/chaine.json`), puis qui a accordé et quand : `Sensibles: scripts/chaine/passer.sh, scripts/chaine/passer*.test.mjs — accord de <nom>, 2026-11-18`, ou `Sensibles: —`. La ligne d'un ticket couvre la branche de ce ticket. Celle de la fiche couvre la branche de cadrage du chantier (`docs/<nom>-cadrage`), qui n'a pas de ticket et où le plugin fait écrire `.claude/chaine.json`.
- `A-74` — **Où elle se lit.** Sur `origin/sujet/*`, comme `Dépendances:` (`agent/garde-commandes.mjs`) : jamais dans l'arbre de travail ni sur la branche de la session. Pour un ticket sans sujet (correctif isolé), sur `origin/develop` : le ticket y entre d'abord, par une PR de documentation. La fiche de la carte arrive sur le sujet par `sujet.sh carte`, le seul geste qui écrit un sujet sans PR. Une branche de mise à jour d'un sujet (`maj/<nom>`) est couverte par l'union des lignes des tickets du sujet et de la fiche.
- `A-75` — **La demande d'accord est un tableau de la carte**, section `## Fichiers sensibles` : une ligne par fichier (ticket ou « cadrage », chemin, pourquoi, ce qui y change). Le conducteur l'écrit au découpage ; l'architecte la soumet au produit avec le découpage (sans programme, le conducteur la soumet lui-même) ; les lignes `Sensibles:` ne sont remplies qu'après l'accord. Un fichier découvert en route : la session s'arrête et l'écrit au conducteur, qui obtient l'accord par la même voie, puis ajoute le chemin par une PR de documentation vers le sujet, relue comme les autres.
- `A-76` — **Trois gardes mécaniques**, qui lisent la même ligne : le hook d'édition (`agent/garde-fichiers.mjs`, `regles.mjs`) refuse l'écriture d'un chemin sensible que la ligne ne couvre pas ; `sujet.sh fusionner` (sous-PR) et `passer.sh` (PR vers `develop`) renvoient une PR dont le diff touche un chemin sensible non couvert. Une livraison de sujet n'y repasse pas : ses sous-PR l'ont été une à une. Une PR sans ticket ni carte qui touche un chemin sensible est renvoyée.
- `A-77` — **CODEOWNERS sort du plugin.** Retirés : `scripts/github/codeowners.mjs` et son test, son gate et l'entrée de `gatesRapides`, la clé `proprietaires`, le refus d'éditer CODEOWNERS dans `regles.mjs`, les états « attend un propriétaire » et « attend un humain » qui en viennent (`fusionner/scripts/github.sh`, `file.sh`, `passer.sh`, `boucle.sh` et leurs tests), la case correspondante d'`admin.md` (ses sous-règles « pas de push forcé » et « aucune liste de contournement » restent, dans la protection de branche). **`proprietaire.sh` reste** : il retrouve la session auteur d'une PR et n'a aucun lien avec CODEOWNERS. L'ADR « CODEOWNERS » est marquée remplacée. La repose retire `.github/CODEOWNERS` quand il porte l'en-tête du générateur.

### Le skill `relecture` et le verdict

- `A-78` — **Un skill `relecture`** (`skills/chaine/relecture/`), joué par une session de relecture, jamais par l'auteur. Il lit le diff de la PR contre sa base et choisit ses axes :

  | Le diff contient | Axes |
  | --- | --- |
  | un chemin de la liste `exigeRevue` (`revue-exigee.mjs`), avec un ticket | Règles, Ticket, Documentation |
  | un chemin de cette liste, sans ticket | Règles |
  | un chemin sensible | en plus : la ligne `Sensibles:` couvre chaque chemin touché ; `/security-review`, comme `revue-adversariale` le fait aujourd'hui |
  | des tickets, une spec, une carte | Tickets : format prêt pour agent, paraphrase de la spec, décision laissée ouverte, référence morte, surface sans preuve, fichier chaud en double dans une vague |
  | une règle métier, une criticité, le glossaire | Règles métier : critère `D8`, cas et familles, criticité et sa raison, vocabulaire |
  | toute autre documentation (ADR, README, méthode, planches) | Documentation |

  Un diff qui relève de plusieurs lignes reçoit l'union de leurs axes. Les fichiers de critères de `revue-de-ticket` et de `revue-adversariale` deviennent des références de `relecture` ; ces deux skills cessent d'être des points d'entrée (retirés de `plugin.json`, de leur `poser` et des tests qui les connaissent). `T3` est joué par la session de relecture pour toutes les criticités : la précision provisoire de `P-38` (« Qui joue `T3` ») tombe.
- `A-79` — **La session de relecture trie avant d'écrire.** Elle relit chaque constat d'un axe dans le code, ligne ouverte : sans critère cité, ou faux, il est écarté, et le verdict dit combien et pourquoi en une phrase chacun. C'est le tri que l'auteur faisait ; il passe au relecteur. Elle ne modifie aucun fichier et ne pousse rien.
- `A-80` — **Le verdict est un commentaire de la PR**, de forme fixe, que la machine lit : une marque invisible ; `Sommet relu:` (sha de 40 caractères) ; `Verdict:` (`validé` ou `refusé`) ; `Bloquants:` (nombre) ; `Session:` (l'identifiant de la session de relecture) ; puis les constats (gravité, critère, fichier et ligne, constat, et pour un bloquant le test qui l'aurait attrapé). `validé` veut dire aucun bloquant ; les mineurs et les doutes y figurent, l'auteur en fait ce qu'il juge. Un axe en échec s'écrit « non exécuté » et le verdict est alors `refusé`, jamais « aucun constat ». Le lecteur tolère le pied de page que les sessions cloud ajoutent à leurs commentaires.

### Le Relecteur et les étiquettes

- `A-81` — **Un rôle, un skill, une session par dépôt.** Skill `skills/chaine/relecteur/`, lancé par l'architecte en même temps que le capitaine (gabarit dans `architecte/references/lancement.md` ; sans programme, par qui lance le capitaine). Sa consigne vient du gabarit mot pour mot. Il se tague `role:relecteur` et s'inscrit sur la ligne `Relecteurs:` de la carte du programme (ou de la carte du chantier, sans programme) ; `chantier` vérifie qu'un Relecteur tourne, comme il le fait pour le capitaine. Un second Relecteur qui trouve cette ligne tenue par une session vivante s'arrête.
- `A-82` — **Le Relecteur est le seul à écrire les étiquettes de relecture, hors la demande.** Deux étiquettes nouvelles, `à-relire` et `à-reprendre`, ajoutées à `labels.sh` et à `admin.md`.

  | État de la PR | Étiquette | Qui la fait passer | Vers |
  | --- | --- | --- | --- |
  | prête à être relue | `à-relire` | **l'auteur** la pose, avec un commentaire `À relire — Session: <la sienne> — Conducteur: <celle du conducteur, ou —>` | en relecture |
  | en relecture | aucune des trois | **le Relecteur** retire `à-relire` et écrit `Relecture — tour k — sommet <sha> — sessions <…> — verdicts exigés <n>` | verdict |
  | verdict `refusé` | `à-reprendre` | **le Relecteur**, sur la ligne que lui écrit la session de relecture | prête à être relue, après correction |
  | tous les verdicts exigés `validé`, et la tête toujours au `Sommet relu` | `à-fusionner` | **le Relecteur** | le capitaine |
  | renvoyée par le capitaine | `fusion-bloquée` | le capitaine la pose ; **l'auteur** la retire en reposant `à-relire` | prête à être relue |

  L'auteur ne pose plus jamais `à-fusionner` ; `renvoyer.sh` et `sujet.sh livrer` changent leur message et leur geste en conséquence. La tête a bougé pendant la relecture : le Relecteur ne pose rien, il redistribue le tour sur la nouvelle tête, sans le compter. Qui écrit une étiquette relit la liste après l'avoir écrite (`issue_write` remplace la liste entière).
- `A-83` — **Sans mémoire.** Tout son état est sur les PR : les étiquettes et son commentaire `Relecture — tour k…`, qui dit quelles sessions relisent. À chaque réveil (une veille, comme le capitaine) il liste les PR ouvertes qui portent `à-relire`, toutes bases confondues, hors sujet gelé (`Gel:`). Pas de session de relecture connue pour la PR : il en lance une. Une session connue : il lui écrit une ligne (« PR n, tour k, sommet »). Une session morte ou au plafond de contexte : il en lance une autre, le note sur la PR, et le dit au conducteur.
- `A-84` — **Il ne lit pas un verdict pour le redire.** La session de relecture, son verdict écrit, lui écrit une ligne. Il met l'étiquette, puis écrit une ligne à l'auteur et au conducteur nommés par le commentaire `À relire` : « verdict écrit sur la PR n : refusé » ou « validé ». Jamais un constat, jamais un résumé. Il n'arbitre rien. Si le diff propre de la PR n'a pas changé depuis son dernier verdict validé (un renvoi du capitaine pour un conflit d'index ou un contrôle instable), il repose `à-fusionner` sans nouveau tour.
- `A-85` — **Le coût et l'archivage.** Une session de relecture a le rôle `relecture` dans `## Coût` (gate `tickets`, `couts.mjs`). Qui archive l'auteur archive aussi les sessions de relecture de la PR, lues sur elle, et note leur coût : le conducteur pour ses filles, l'auteur lui-même pour une PR du conducteur ou de l'architecte. Le modèle d'une session de relecture est celui de la clé `relecture.modele` de `chaine.json`.

### Contester, plafonner

- `A-86` — **Contester.** L'auteur répond sur la PR, `Contesté — <fichier et ligne, critère> — <raison>`, et écrit une ligne à l'arbitre. L'arbitre écrit `Arbitrage — … — maintenu` ou `écarté — <raison>`. L'auteur repose `à-relire` ; la session de relecture rend un nouveau verdict où un constat écarté ne compte plus, reconnu par son critère et son lieu. L'arbitre n'est jamais l'auteur : pour une PR d'une fille, le conducteur ; pour une PR du conducteur, l'architecte (sans programme, le produit) ; pour une PR de l'architecte, **le produit**, à qui l'architecte porte le désaccord, ou qu'il évite en corrigeant.
- `A-87` — **Le plafond** se compte aux commentaires `Relecture — tour k` du Relecteur depuis la dernière décision de plafond. Au troisième verdict `refusé`, le Relecteur ne distribue plus : il l'écrit sur la PR et écrit une ligne au conducteur et à l'architecte (sans programme, au conducteur, qui va au produit si la cause est métier). L'architecte écrit sa `Décision de plafond — …` sur la PR (ticket récrit ou découpé, désaccord tranché) ; le compte repart de un. Ce plafond n'est pas celui des renvois du capitaine (`renvoisParPR`), qui reste tel quel pour ses propres renvois.

### Criticité haute

- `A-88` — **`Relecture: double`**, ligne d'en-tête d'un ticket. Le gate `tickets` l'exige quand une règle citée par la ligne `Règles:` a une criticité haute dans son fichier de règle. Le Relecteur lit cette ligne sur la base de la PR, lance deux sessions de relecture et écrit « verdicts exigés 2 ». Chacune ne lit pas le verdict de l'autre. `à-fusionner` n'est posée que si les deux sont `validé` ; un seul `refusé` donne `à-reprendre` et un seul tour. Le message d'information au produit part du conducteur, qui connaît le ticket, par l'architecte : la règle, ce qui change, les deux verdicts. Le Relecteur n'écrit rien de tel.

### Le capitaine

- `A-89` — **`revue-exigee.mjs` lit les verdicts**, au moment où il juge l'éligibilité, c'est-à-dire avant sa propre mise à jour de la PR, comme aujourd'hui. Il lit le dernier commentaire `Relecture — tour k` : le nombre de verdicts exigés et les sessions. Pour chacune, il veut un verdict `validé` sans bloquant. Le `Sommet relu` doit être la tête, **ou une version dont le diff propre est le même que celui de la tête, aux index générés près** : la notion que `passer.sh` (`livraison_intermediaire`) et `sujet.sh` (`verifier_mise_a_jour`) calculent déjà. Une PR que le capitaine a lui-même mise à jour au passage précédent reste donc valable. Sinon : renvoi, avec le motif. Toute PR est concernée, documentation comprise.
- `A-90` — **Deux cas seulement ne demandent pas de verdict** : le report de `develop` dans un sujet par le capitaine (`sujet.sh rafraichir`, un push sans PR), et la livraison d'un sujet, reconnue comme aujourd'hui (elle n'apporte que des sommets déjà entrés par des sous-PR relues, fusionnés avec `develop`, aux index générés près). **La PR de mise à jour d'un sujet, ouverte par une session, n'est pas exemptée** : elle porte une résolution de conflit et passe par `à-relire`.

### Les sessions qui codent, le conducteur, l'architecte

- `A-91` — **La session qui code** (`chaine-de-production.md` § 5) : l'étape « revue de ticket » devient « demander la relecture » — dernier push, PR hors brouillon, commentaire `À relire` et étiquette, une ligne au conducteur, un réveil de secours. Sur `à-reprendre` : lire le verdict sur la PR, corriger chaque bloquant avec son test, pousser, reposer `à-relire`. Elle ne lance aucun relecteur et ne pose jamais `à-fusionner`.
- `A-92` — **Le conducteur** ne contre-relit plus et ne relaie aucun constat. Il arbitre les contestations de ses filles et reçoit les plafonds. `Label: contre-revue` n'a plus d'effet : le gate cesse de l'exiger et garde la valeur lisible sur les tickets existants ; `lancement.md` ne fait plus livrer « selon la ligne `Label:` ». Ses propres PR passent par `à-relire`.
- `A-93` — **Le bilan sort du plugin** : l'obligation d'une section `## Rétro` non vide pour passer une carte à `fini` est retirée du gate, de `chantier/SKILL.md`, des gabarits et de leurs tests. Un incident donne un ticket au moment où il arrive.
- `A-94` — **Une ADR « relecture indépendante et accord des fichiers sensibles »** remplace l'ADR « CODEOWNERS » et amende les points de l'ADR de la chaîne qui décrivent la revue par l'auteur et la contre-revue.

### Passage de la 7 à la 8

- `A-95` — **Deux temps.** D'abord des lots qui ajoutent sans rien changer au régime : le skill `relecture`, le skill `relecteur`, le lecteur de verdict, les étiquettes, la ligne `Sensibles:` acceptée par le gate sans être exigée. Puis **un seul lot de bascule**, fusionné en dernier, version 8.0.0 : tout ce qui change le comportement des sessions et du capitaine.
- `A-96` — **La clé `relecture` de `.claude/chaine.json` est l'interrupteur.** Elle est posée par la repose. Les skills que les sessions lisent dans le marketplace (`chantier`, `architecte`, `fusionner`, `sujet`, `tickets`) portent, depuis la bascule, une ligne de tête : sans cette clé, le dépôt n'est pas reposé en 8, la session s'arrête et le dit à l'architecte, qui fait la repose d'abord. Une session lancée entre la bascule et la repose d'un projet ne mélange donc pas un skill de la 8 avec des scripts posés de la 7. La repose de chaque projet est préparée avant la bascule, en PR brouillon, et fusionnée dans la foulée.
- `A-97` — **Le dépôt `skills`**, qui n'a pas la chaîne, reçoit la même règle par les procédures données dans les prompts de son capitaine et de son Relecteur : l'ordre `à-fusionner au sommet <sha>` est écrit par le Relecteur quand le verdict est validé, au lieu de la session qui livre. Dernier lot.

## Les lots

Les lots qui touchent les mêmes fichiers se suivent ; seuls 1 et 2 peuvent aller de front avec 3 et 4, qui n'écrivent que des fichiers neufs.

1. **Retrait de CODEOWNERS** (`A-77`). Fichiers : `socle/scripts/github/codeowners*`, `socle/chaine.json`, `socle/agent/regles.mjs` et son test, `fusionner/scripts/{github,passer,file,boucle}.sh`, `fusionner.test.mjs`, `veille.test.mjs`, `sujet/scripts/faux-gh.mjs`, `fusionner/SKILL.md` et son `CONTENU.md`, `socle/SKILL.md` et son `CONTENU.md`, `admin.md`, `fragments/claude-md-fusion.md`, `chaine-de-production.md`, `chantier/SKILL.md`, `README.md`, `scripts/{depot,poses,points-d-entree}.test.mjs`.
2. **Fichiers sensibles** (`A-73` à `A-76`, `A-94`), après 1 : gabarits `ticket.issue.md` et `carte.map.md`, gate `tickets-regles.mjs`, `agent/garde-fichiers.mjs` et `regles.mjs`, `revue-adversariale/scripts/chemins-sensibles.mjs`, `sujet.sh` (`fusionner`), `passer.sh`, `chantier` (découpage), `architecte` (la demande au produit), `chaine-de-production.md` § 3, l'ADR.
3. **Skill `relecture`, verdict et son lecteur** (`A-78` à `A-80`) : fichiers neufs, plus `plugin.json`, `README.md`, `CONTEXT.md`, `socle-monorepo/.../references-agent-integrees.json`.
4. **Skill `relecteur`** (`A-81` à `A-88`) : fichiers neufs (skill, file, veille, gabarit de lancement), plus `labels.sh`, `admin.md`, `gabarits/programme.md` (ligne `Relecteurs:`).
5. **Bascule, version 8.0.0** (`A-89` à `A-93`, `A-95`, `A-96`), après 1 à 4 : `revue-exigee.mjs`, `passer.sh`, `sujet.sh` (éligibilité, `livrer`), `renvoyer.sh`, `github.sh`, leurs tests et `depot-jouet.mjs` ; `chaine-de-production.md` (rôles, § 5), `chantier`, `architecte`, `lancement.md`, `fusionner/SKILL.md`, `sujet/SKILL.md`, `tickets` (`issue-tracker.md`, `avancement.mjs`, gate : `Label:`, `Relecture: double`, `## Rétro`, rôle `relecture`), `couts.mjs`, `fragments/claude-md-fusion.md`, `socle-monorepo/.../racine/CLAUDE.md` et `methode/conception.md`, `pieges.md`, `criticite/SKILL.md`, `recette-humaine/SKILL.md` ; `revue-de-ticket` et `revue-adversariale` retirés des points d'entrée. Ce lot se découpe en tickets qui se suivent sur une même branche de travail et n'entre dans `main` qu'entier.
6. **Repose** dans Anchorpost, Fedora et Iroki (leurs architectes), préparée avant la bascule.
7. **`skills` lui-même** (`A-97`).

## Ce que cette spec ne ferme pas

- **Toutes les sessions écrivent sous le compte du produit.** Une étiquette, un verdict, une ligne `Sensibles:` peuvent être écrits par n'importe quelle session : ces gardes tiennent face à une session de bonne foi qui suit son skill, pas face à une PR hostile. Le retrait de CODEOWNERS retire la seule protection de GitHub qui visait ce cas ; il reste la protection de branche (contrôles exigés, pas de push forcé, pas de liste de contournement).
- **C'est un agent qui écrit le nom de qui a accordé** un fichier sensible. Rien ne prouve l'accord, sinon la conversation du produit.
- **Le Relecteur est un point de passage** : arrêté, plus aucune PR n'est relue. Il se relance sans rien perdre ; une PR `à-relire` que rien ne relit signale un Relecteur arrêté (`pieges.md`).
- **Le coût** : une session de relecture par PR, deux pour une règle haute ; chaque correction rouvre la CI entière, la PR n'étant plus en brouillon.
- **Deux sessions de relecture d'une même PR peuvent lire le verdict l'une de l'autre** : la consigne l'interdit, rien ne l'empêche.
- **Une PR sans ticket qui touche le code d'une règle haute** n'a qu'une relecture : la double relecture se déclenche par le ticket.
- **À sonder avant le lot 4** : qu'une session réveillée par le message d'une autre accepte de poser une étiquette (le mode « auto » a déjà refusé un ordre venu d'une session, `lancement.md`). Si elle refuse, le Relecteur pose l'étiquette à la lecture du verdict lors de sa veille, sans message.

## Hors périmètre

Deux défauts de la chaîne relevés le 2026-11-18, qui ont leurs tickets à part : `chantier` § 6 donne `sujet.sh rafraichir` au conducteur alors que c'est le geste du capitaine (`A-69`) ; une PR en retard dont seul un index généré est périmé une fois fusionnée avec la base part au renvoi alors que `passer.sh` sait la réparer. Et un compte propre aux agents, écarté par le produit comme trop compliqué.

## À confirmer par le produit

1. **Qui arbitre une PR de l'architecte** : personne d'autre que le produit (`A-86`). L'architecte corrige, ou lui porte le désaccord.
2. **La livraison d'un sujet n'a pas de relecture propre** (`A-90`) : elle ne contient que des PR déjà relues une à une. C'est la seule exception à « toutes les PR ».

## Vérification d'ensemble

Sur un dépôt jouet monté avec les vrais outils, et pour ce qui demande de vraies sessions, sur une copie d'un dépôt réel : une PR de code avec un bloquant planté reçoit `à-reprendre`, puis `à-fusionner` après correction, sans que son auteur ait lancé un relecteur ; le capitaine refuse une PR sans verdict, une PR dont le diff propre a changé depuis le verdict, et passe une PR qu'il a lui-même mise à jour ; une sous-PR qui touche un chemin sensible hors de sa ligne `Sensibles:` est refusée par le hook et par `sujet.sh fusionner` ; trois verdicts refusés arrêtent la distribution ; une PR `Relecture: double` n'entre pas avec un seul verdict validé ; une PR de tickets passe par l'axe « Tickets » ; un Relecteur relancé à neuf reprend la file ; un conducteur lancé sur un dépôt sans la clé `relecture` s'arrête et le dit.
