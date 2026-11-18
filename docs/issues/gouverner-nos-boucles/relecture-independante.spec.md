# La relecture que l'auteur ne contrôle pas — spec du chantier 3

Programme : [`map.md`](map.md) (« gouverner nos boucles »). Décisions du produit : `P-47` à `P-58` de la carte, prises le 2026-11-18 dans le grilling du chantier 3 (skills `grilling` puis `domain-modeling`, une question à la fois). Elles amendent `P-6` et remplacent `P-41`. État : spec écrite, à faire relire par un agent neuf, puis à découper en tickets.

## Le problème

Aujourd'hui, la session qui code un ticket lance elle-même ses relecteurs, trie leurs constats et écrit la section de revue de sa PR (`revue-de-ticket/SKILL.md`, étapes 2 à 5). Le capitaine ne vérifie que la présence d'un titre « Revue… » (`fusionner/scripts/revue-exigee.mjs`). Le conducteur contre-relit les PR à chemin sensible par un sous-agent (`chantier/SKILL.md` § 5), dans son propre contexte, et il a écrit le ticket contre lequel il juge. Les PR de documentation du conducteur et de l'architecte (tickets, règles, specs) ne sont relues par personne d'indépendant.

Faits vécus les 17 et 18 novembre : une revue de ticket et une contre-revue du conducteur ont rendu « aucun écart » là où un relecteur indépendant a trouvé six régressions qui laissaient les tests verts (Anchorpost #239) ; la contre-relecture de l'architecte a encore trouvé des zéros muets après celle du conducteur (#277) ; un conducteur a atteint son plafond de contexte en cinquante minutes ; le fichier CODEOWNERS, posé le 17, aurait fait dépendre chaque PR sensible d'une seconde personne, parce que toutes les sessions écrivent sous le compte du produit et que GitHub refuse qu'un auteur approuve sa propre PR.

## Ce qui change, vu par le produit

- **Fichiers sensibles** (`P-47`, `P-48`, `P-49`) : l'accord du produit est demandé **avant** d'y toucher, une fois, quand il valide le découpage d'un chantier. Le conducteur dit quels fichiers, pourquoi, et ce qui va y changer. L'accord est noté sur le ticket ; sans lui, la machine refuse la modification. Aucun blocage par GitHub ; le fichier CODEOWNERS disparaît.
- **Toute PR a une relecture indépendante** (`P-51`), quel que soit son auteur : session qui code, conducteur ou architecte. **La session qui code ne se relit plus** (`P-52`).
- **Un Relecteur par dépôt** (`P-55`) aiguille les relectures : il lance une session de relecture par PR. Il ne transporte jamais les défauts, ne les résume pas, n'arbitre rien. Le verdict s'écrit sur la PR.
- **Un skill unique de relecture** (`P-55`) choisit les contrôles selon ce que la PR contient.
- **Le capitaine ne relit rien** (`P-50`) : son script vérifie que le verdict porte sur la version à fusionner et ne laisse aucun défaut bloquant.
- **Trois allers-retours au plus** (`P-53`) : au-delà, l'architecte tranche si la cause est technique et informe le produit ; il ne lui pose une question que si la cause est métier.
- **Règle de criticité haute** (`P-56`) : deux relectures indépendantes, et un message d'information au produit, sans que la PR l'attende.
- **Le bilan de fin de chantier est supprimé** (`P-57`).
- **Le signal d'un verdict** (`P-58`) : une étiquette sur la PR, un message d'une ligne du Relecteur à l'auteur et au conducteur (l'endroit où lire, jamais le contenu), et un réveil de secours chez l'auteur.

## Décisions de conception (architecte)

Numérotées dans la suite de la carte.

### Fichiers sensibles

- `A-73` — **La ligne `Sensibles:` du ticket.** En-tête de ticket, sur le modèle de `Dépendances:` : les chemins sensibles (`cheminsSensibles` de `.claude/chaine.json`) que le ticket modifiera, puis qui a accordé et quand. Forme : `Sensibles: scripts/chaine/passer.sh, .claude/chaine.json — accord du produit, 2026-11-18`, ou `Sensibles: —`. Elle se lit **sur le sujet** (ou sur `develop` hors sujet), jamais sur la branche de travail : une session ne s'accorde rien à elle-même.
- `A-74` — **La demande d'accord est un tableau du découpage.** La carte du chantier gagne une section `## Fichiers sensibles` : une ligne par fichier (ticket, chemin, pourquoi, ce qui y change). Le conducteur l'écrit au découpage ; l'architecte la soumet au produit avec le découpage ; le conducteur ne remplit les lignes `Sensibles:` qu'après l'accord. Un fichier sensible découvert en route : la session s'arrête, écrit au conducteur, qui remonte à l'architecte, qui pose la question au produit avec les mêmes trois éléments. Hors chantier, l'architecte fait le tout.
- `A-75` — **Deux gardes mécaniques.** Le hook d'édition (`scripts/agent/`) refuse l'écriture d'un chemin sensible absent de la ligne `Sensibles:` du ticket de la branche. `passer.sh` renvoie une PR dont le diff touche un chemin sensible que la ligne du ticket, lue sur la base, ne nomme pas. Une PR sans ticket qui touche un chemin sensible est renvoyée.
- `A-76` — **CODEOWNERS sort du plugin.** Retirés : le générateur `scripts/github/codeowners.mjs` et son test, son gate, la clé `proprietaires` de `chaine.json`, les états « attend un propriétaire » du capitaine et `proprietaire.sh`, l'entrée de `gatesRapides`. L'ADR « CODEOWNERS » est marquée remplacée par celle de ce chantier. La repose retire `.github/CODEOWNERS` quand il porte l'en-tête du générateur. Le réglage « Require review from Code Owners » n'est demandé nulle part.

### Le skill unique et le verdict

- `A-77` — **Un skill `relecture`** (`skills/chaine/relecture/`), joué par une session de relecture, jamais par l'auteur. Il lit le diff de la PR contre sa base et choisit ses axes par ce que le diff contient :

  | La PR contient | Axes |
  | --- | --- |
  | du code, avec un ticket | Règles, Ticket, Documentation (les trois axes actuels de `revue-de-ticket`) |
  | du code, sans ticket | Règles |
  | des tickets, une spec, une carte | Tickets : format prêt pour agent, paraphrase de la spec, décision laissée ouverte, référence morte, surface sans preuve, fichier chaud en double dans une vague |
  | une règle métier, une criticité, le glossaire | Règles métier : critère `D8`, cas et familles, criticité et sa raison, vocabulaire |
  | un chemin sensible | en plus : la ligne `Sensibles:` du ticket couvre chaque chemin touché |

  Chaque axe reste un sous-agent en contexte vierge, lancé par la session de relecture, contre une liste fermée de critères. Les fichiers de critères de `revue-de-ticket` et de `revue-adversariale` deviennent les références de `relecture` ; ces deux skills ne se lancent plus seuls. `T3` est joué par la session de relecture pour toutes les criticités (fin de la précision provisoire de `P-38`).
- `A-78` — **Le verdict est un commentaire de la PR**, écrit par la session de relecture, de forme fixe : une marque invisible, `Sommet relu:` (sha de 40 caractères), `Verdict:` (`validé` ou `à corriger`), `Bloquants:` (nombre), `Tour:` (n sur 3), `Session:` (l'identifiant de la session de relecture), puis les constats (identifiant, gravité, critère, fichier et ligne, constat, et pour un bloquant le test qui l'aurait attrapé). Un axe en échec s'écrit « non exécuté », jamais « aucun constat ». La session de relecture ne modifie aucun fichier et ne pousse rien.
- `A-79` — **Trois étiquettes font l'état.** `à-relire` : posée par l'auteur quand sa PR est prête. `à-corriger` : posée par la session de relecture avec un verdict « à corriger ». `à-fusionner` : posée par la session de relecture avec un verdict « validé » ; l'auteur ne la pose plus jamais. Deux étiquettes nouvelles (`à-relire`, `à-corriger`), à créer par l'administrateur (`admin.md`).
- `A-80` — **Contester.** L'auteur répond sur la PR : `Contesté: <identifiant> — <raison>`, et sonne le conducteur (l'architecte hors chantier). L'arbitre écrit `Arbitrage: <identifiant> maintenu` ou `écarté — <raison>`. Un constat écarté ne bloque plus. L'arbitre n'est jamais l'auteur : pour une PR du conducteur, l'architecte ; pour une PR de l'architecte, une seconde session de relecture, puis le produit si le désaccord tient et qu'il est métier.
- `A-81` — **Le plafond de trois tours se compte sur la PR**, aux verdicts « à corriger ». Au troisième, le Relecteur ne lance plus de relecture ; il sonne le conducteur et l'architecte ; la PR montre l'état « arbitrage » dans la file. L'architecte écrit sa décision sur la PR (ticket récrit ou découpé, désaccord tranché) ; ce commentaire rouvre un tour.

### Le Relecteur

- `A-82` — **Un rôle, un skill, une session par dépôt.** Skill `skills/chaine/relecteur/`, lancé par l'architecte en même temps que le capitaine (`architecte/references/lancement.md` gagne son gabarit ; hors programme, par qui lance le capitaine), tag `role:relecteur`. Sa consigne vient du gabarit mot pour mot : aucune ligne de situation n'y change une règle de relecture.
- `A-83` — **Sans mémoire.** Tout son état est sur les PR : les étiquettes, et un commentaire `Relecture lancée — Session: <identifiant>` qu'il pose au premier lancement. À chaque réveil (une veille, comme le capitaine) il liste les PR ouvertes qui portent `à-relire`, toutes bases confondues. Pour chacune : pas de session de relecture connue, il en lance une ; une session connue, il lui envoie une ligne (« PR n, nouveau sommet, tour k ») ; une session connue mais morte ou au plafond de contexte, il en lance une autre et le note sur la PR. Tombé, il se relance en une minute et reprend la file.
- `A-84` — **Il ne lit pas les verdicts pour les redire.** La session de relecture, son verdict posé, lui écrit une ligne. Il sonne alors l'auteur (la session nommée par la ligne `Claude-Session:` du sommet) et le conducteur du sujet (ligne `Conducteur:` de la carte ; l'architecte hors chantier) : « verdict écrit sur la PR n : à corriger » ou « validé ». Jamais un constat, jamais un résumé. Il n'arbitre rien.
- `A-85` — **Le modèle d'une session de relecture** est au moins celui de l'auteur ; clé `relecture.modele` de `chaine.json`. Le Relecteur archive la session de relecture quand la PR est fusionnée ou fermée ; le conducteur archive la fille, comme aujourd'hui.
- `A-86` — **Criticité haute : deux sessions.** Quand le dépôt a un index Anchorpost en version 3 et que `anchorpost compare --json` dit que la PR touche une règle haute, le Relecteur lance deux sessions de relecture qui ne se connaissent pas. Les deux verdicts doivent être « validé ». Il envoie à l'architecte trois lignes pour le produit : la règle, ce qui change, les deux verdicts. Un ticket peut aussi demander la double relecture par une ligne `Relecture: double`.

### Le capitaine, les sessions qui codent, le conducteur

- `A-87` — **`revue-exigee.mjs` lit le verdict.** Une PR passe si son dernier verdict est « validé », sans bloquant, et si son `Sommet relu` est la tête, ou un ancêtre de la tête dont tous les commits suivants sont des mises à jour avec la base sans diff propre (la lecture de `commits-a-relire.mjs`). Sinon : renvoi, avec le motif. Exemptées : les PR que le capitaine fabrique lui-même (mise à jour d'un sujet, livraison d'un sujet), qui n'apportent que des sommets déjà relus. Le capitaine ne lance rien et ne juge aucun contenu.
- `A-88` — **La session qui code** (`chaine-de-production.md` § 5) : l'étape « revue de ticket » devient « demander la relecture » — dernier push, PR hors brouillon, étiquette `à-relire`, une ligne au conducteur, un réveil de secours. Sur `à-corriger` : lire le verdict sur la PR, corriger (chaque bloquant avec son test), pousser, reposer `à-relire`. Elle ne pose jamais `à-fusionner` et ne lance aucun relecteur.
- `A-89` — **Le conducteur** ne contre-relit plus (`chantier/SKILL.md` § 5) et ne relaie aucun constat. Il arbitre une contestation, compte sur les verdicts, et agit au troisième tour. `Label: contre-revue` n'a plus d'effet ; le gate garde la valeur lisible sur les tickets existants. Ses propres PR (cadrage, tickets) passent par `à-relire` comme les autres.
- `A-90` — **Le bilan sort du plugin.** L'obligation d'une section `## Rétro` non vide pour passer une carte à `fini` est retirée du gate et de `chantier/SKILL.md` § 7. Un incident donne un ticket au moment où il arrive. La ligne de coût d'un ticket, dans la carte, peut noter son nombre de tours.

### Passage

- `A-91` — **Version 8.0.0**, puis une repose par dépôt (Anchorpost, Fedora, Iroki), faite par l'architecte de chaque projet : labels créés, Relecteur lancé, gabarits et documents remplacés, `.github/CODEOWNERS` retiré. D'ici là, les chantiers en cours gardent les règles de la 7.
- `A-92` — **Le dépôt `skills`**, qui n'a pas la chaîne, reçoit la même règle par la procédure de son capitaine : un Relecteur dont la procédure est dans le prompt, et l'ordre `à-fusionner au sommet <sha>` écrit par la session de relecture au lieu de l'architecte. Dernier lot.

## Les lots

1. **Fichiers sensibles** (`A-73` à `A-75`) : gabarit de ticket, gate `tickets`, hook d'édition, `passer.sh`, section de la carte, `chantier` (découpage), `architecte` (la demande au produit).
2. **Retrait de CODEOWNERS** (`A-76`).
3. **Skill `relecture` et verdict** (`A-77`, `A-78`, `A-80`) : le skill, ses prompts, les critères « Tickets » et « Règles métier », le format du verdict et son lecteur testé.
4. **Le Relecteur** (`A-79`, `A-81` à `A-85`) : skill, scripts de file et de veille, gabarit de lancement, labels au socle et dans `admin.md`.
5. **Le capitaine** (`A-87`) : `revue-exigee.mjs`, l'état « arbitrage » de la file.
6. **Sessions qui codent, conducteur, architecte** (`A-88`, `A-89`) : `chaine-de-production.md`, `chantier`, `architecte`, `tickets`.
7. **Criticité haute** (`A-86`).
8. **Bilan supprimé** (`A-90`).
9. **Repose et `skills`** (`A-91`, `A-92`).

Les lots 3 et 4 se suivent ; 5 dépend de 3 ; 6 dépend de 4 et 5 ; 1, 2 et 8 sont indépendants.

## Ce que cette spec ne ferme pas

- **Toutes les sessions écrivent sous le compte du produit.** Une étiquette, un verdict, une ligne `Sensibles:` peuvent être écrits par n'importe quelle session : les gardes tiennent face à une session de bonne foi qui suit son skill, pas face à une PR hostile. La frontière contre une PR hostile reste la protection de GitHub décrite dans `admin.md`.
- **C'est un agent qui écrit le nom de qui a accordé** un fichier sensible. Rien ne prouve l'accord, sinon la conversation du produit avec l'architecte.
- **Le Relecteur est un point de passage** : arrêté, plus aucune PR n'est relue. Il se relance sans rien perdre ; une PR étiquetée `à-relire` que rien ne relit signale un Relecteur arrêté (`pieges.md`).
- **Le coût** : une session de relecture par PR, deux pour une règle haute. La relecture lancée par l'auteur et la contre-revue du conducteur disparaissent en échange.
- **Le ticket contre lequel on relit peut être faux** : il est maintenant relu lui aussi avant d'entrer, par l'axe « Tickets ».

## Hors périmètre

Deux défauts de la chaîne relevés le 18 novembre, qui auront leurs tickets à part : `chantier` § 6 donne `sujet.sh rafraichir` au conducteur alors que c'est le geste du capitaine (`A-69`) ; une PR en retard dont seul un index généré est périmé une fois fusionnée avec la base part au renvoi alors que `passer.sh` sait la réparer. Et l'identité des sessions (un compte propre aux agents), écartée par le produit comme trop compliquée.

## Vérification d'ensemble

Sur un dépôt jouet monté avec les vrais outils : une PR de code avec un défaut planté reçoit `à-corriger`, puis `à-fusionner` après correction, sans que la session qui code ait lancé un relecteur ; le capitaine refuse une PR dont le verdict porte sur un sommet périmé, et une PR sans verdict ; un fichier sensible hors de la ligne `Sensibles:` est refusé par le hook et par `passer.sh` ; trois verdicts « à corriger » arrêtent la boucle ; une PR de tickets passe par l'axe « Tickets » ; un Relecteur relancé à neuf reprend la file sans rien demander à personne.
