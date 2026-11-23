# Quatrième relecture de la spec du chantier 3 par un agent neuf — 2026-11-18

Relecture de la quatrième version de [`relecture-independante.spec.md`](relecture-independante.spec.md) (commit `09a483d`, avant le retrait de la preuve de livraison décidé par `P-60` : le bloquant BQ3 est sans objet). Rapport brut, non retouché hors les chemins de machine. Ses dix-sept histoires jouées sur la fonction de décision du Relecteur deviennent les cas de test du ticket qui l'écrit.

---

**Verdict : pas prête pour 3a, 3b et 5a (trois phrases de la spec à changer, aucune décision du produit rouverte) ; prête après retouches pour 3c, 3d, 4, 5b, 5c, 6 et 9 ; lot 7 : l'ordre de `A-99` est à récrire et une décision est ouverte ; lot 8 : trop peu écrit pour un ticket, sans bloquer les autres.**

Spec relue : `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md`. Lignes citées : `origin/main` (4a45634, 7.15.0), chemins relatifs à `skills/chaine/`. Rien modifié, rien poussé.

## Bloquants

**BQ1 — `A-81` (lot 3b) : « fusion recalculée en conflit → différent » casse la mise à jour par le capitaine.**
- `mettre_a_jour_sous_pr` ne pousse sur une sous-PR que lorsqu'il y a conflit sur des index générés (`sujet/scripts/sujet.sh` l.501-503, l.512-536). La fusion recalculée de V avec M est donc toujours en conflit dans ce cas.
- Essai sur dépôt jouet (deux sous-PR régénèrent le même index, la première entre, le capitaine met la seconde à jour) : `merge-tree V M` sort en 1, l'écart avec T est le seul index. À la lettre : « différent ».
- Conséquences :
  - La règle 3 de `A-85` pose `à-reprendre` avec « poussée après le verdict », alors que c'est le capitaine qui a poussé.
  - `A-91` renvoie la PR (renvoi compté). Chaque mise à jour coûte un tour de relecture.
  - La parenthèse de la règle 2 (« mise à jour par le capitaine, sans nouveau tour ») et la ligne « passe une PR qu'il a lui-même mise à jour » de la Vérification d'ensemble sont fausses pour ce cas.
- `passer.sh` fait l'inverse aujourd'hui : il prend l'arbre même en conflit et compare hors index (`fusionner/scripts/passer.sh` l.123-125).
- Supposé : la fréquence dans les projets (je n'ai lu la liste d'index d'aucun). Le gabarit en a deux, dont `docs/agents/couts.md`.

**BQ2 — `A-85` (lot 3a) : la reprise après arbitrage boucle, et la définition des verdicts ne peut pas servir à la fois la reprise et le remplacement.**
- Histoire H4 : tour 1 refusé sur S1, `Arbitrage — … — écarté`, l'auteur repose `à-relire` sans pousser. La règle 4 écrit `Relecture — tour 1, après arbitrage`.
- À la veille suivante, avant le nouveau verdict : « les verdicts du tour » sont ceux dont `Tour:`, `Sommet relu:` et `Session:` correspondent à la dernière distribution, « le dernier par session ». L'ancien verdict refusé y répond toujours.
- Le tour reste donc « refusé », l'arbitrage reste plus récent que ses verdicts, et la règle 4 rejoue la même redistribution à chaque veille.
- Si la session est morte, la règle 5 n'est jamais atteinte : pas de remplacement, et le réveil de `A-86` se tait puisqu'une distribution existe.
- Exiger des verdicts postérieurs à la dernière distribution casserait la règle 5 : après `(remplace R2)`, le verdict déjà rendu par R1 doit compter (H7).

**BQ3 — `A-92` (lot 5a) : deux formes légitimes oubliées, et aucune sortie pour une preuve qui échoue.**

| Ce que la chaîne écrit sur un sujet | Forme | Reconnue |
| --- | --- | --- |
| `fusionner` (l.771-775) | squash par l'API, titre `… (#n)` | oui |
| `carte`, `geler`, `degeler` (l.1238-1262, l.340) | un commit, un seul `*.map.md` | oui |
| `rafraichir`, fusion (l.797, l.822) | fusion, second parent `develop` | oui |
| `rafraichir`, fusion propre puis index changés (l.823-825) | commit ordinaire `docs: régénère les index après mise à jour avec develop` | **non** |
| PR `maj/<nom>` entrée par avance rapide (l.685) : la fusion | fusion, second parent `develop` | oui |
| PR `maj/<nom>` : ses retouches (l.563-567, l.622-633) | commits ordinaires, fichiers libres | **non** |
| PR `maj/<nom>` : index régénérés par le capitaine (l.680-683) | même commit `docs: régénère…` | **non** |
| `passer.sh` sur la livraison elle-même (l.253-256, poussé sur `sujet/<nom>` l.275) | fusion, ou fusion puis commit `docs: régénère…` | fusion oui, commit **non** |
| `ouvrir`, `regrouper`, `recibler_specs` | aucun commit propre | sans objet |

- Le commit `docs: régénère…` est le cours normal d'un chantier : le conducteur écrit `## Coût` par `sujet.sh carte` (carte seule), le registre `couts.md` n'est régénéré qu'au report suivant de `develop`. Lu dans le code, pas joué.
- Le capitaine juge avant sa mise à jour (`A-91`). Son propre commit d'index fait donc échouer la preuve au second passage (checks rouges relancés, sortie 5 : `boucle.sh` l.359-363, l.374-376). C'est le défaut que le commentaire de `passer.sh` l.110-116 raconte pour les livraisons intermédiaires.
- « Renvoyée avec le commit en cause et attend l'architecte » : l'historique ne se récrit pas, et le Relecteur exclut par leur nom les têtes `sujet/*` et `livraison/*`. Rien ne dit ce que l'architecte peut faire. Même impasse pour une `livraison/*` qui échoue à sa preuve actuelle : `passer.sh` la traite en PR ordinaire, donc verdict exigé, que personne ne rendra.
- Non dit : où le sujet commence (`origin/develop..origin/sujet/<nom>`, tous parents). Une fusion à second parent sur `develop` passe quel que soit son arbre.

## Le troisième rapport, point par point

| Point | État | Décision | Reste |
| --- | --- | --- | --- |
| B1 | à moitié | `A-97` à `A-99` | PR vers `develop` en vol, trois chemins qui reportent `develop` avec une sous-PR ouverte, ordre capitaine/Relecteur (C8 à C10) |
| B2 | à moitié | `A-92` | BQ3 |
| B3 | à moitié | `A-85` | BQ2, C1 à C6 |
| C1 | fermé | `A-73`, `A-74` | — |
| C2 | à moitié | `A-78` | `/security-review` depuis un arbre à part : à sonder ; quelle copie des scripts joue (celle de la base ou celle de la PR) |
| C3 | à moitié | `A-81` | BQ1, C7 |
| C4 | à moitié | `A-82` | nom du champ à relever ; où se lit `Relecture: double` ; index sans champ de criticité (pivot 2) |
| C5 | fermé | `A-88`, `A-89` | C13 |
| C6 | fermé | lot 2 | — |
| C7 | fermé | `A-83` | — |
| C8 | fermé | `A-100` | — |

## `A-85` jouée

Notation : D = distribution, r1 à r6 = règles.

| n° | Histoire | Règles, à la lettre | Constat |
| --- | --- | --- | --- |
| H1 | nominal, validé | r6, r5, r2, puis r2 à chaque veille tant que la PR attend le capitaine | l'étiquette est sans effet, mais « à chaque `à-fusionner` posée, il écrit une ligne » : une ligne par veille (C1) |
| H2 | refusé, corrigé et poussé, validé | r6, r5, r4-sinon, puis r4 ne s'applique plus (contenu différent), r6 tour 2 mêmes sessions, r2 | rien ; compte 1 |
| H3 | refusé, redemandé sans pousser (ou index seul, ou base fusionnée dans la branche) | r4-sinon à chaque demande | rien : c'est l'auteur qui boucle |
| H4 | contestation écartée, tête inchangée | r4-arbitrage, rejouée | BQ2 |
| H5 | contestation maintenue | r4-sinon ; après correction, r6 | rien ; compte 1 |
| H6 | un bloquant écarté, un autre corrigé et poussé | r4 ne s'applique pas, r6 : tour 2 ordinaire | l'arbitrage n'est porté par rien ; « reconnu par son lieu » ne tient plus, les lignes ont bougé (C6) |
| H7 | deux exigés, R1 a rendu, pas R2 | r5 attend, puis `(remplace R2)` ; le verdict de R1 reste | marche. Si R1 a refusé, l'issue est connue mais on attend une heure et on lance un remplaçant pour rien |
| H8 | relecture plus longue que `relecture.delai` | r5 remplace toutes les heures, le verdict tardif est ignoré | ne finit jamais, sans plafond de remplacements (C3) |
| H9 | l'auteur pousse pendant le tour 1 | r5 ne s'applique pas, r6 : « tour suivant », aux mêmes sessions encore occupées | le tour 1 devient refusé après coup ; compte 1 ou 2 selon la lecture (C4) |
| H10 | étiquette effacée par l'écriture de l'auteur | aucune règle : PR non listée | réparée par le réveil de l'auteur, armé deux fois ; auteur mort : vue par personne |
| H11 | trois refus | r4-sinon après le troisième ; l'auteur corrige une quatrième fois ; r6 : plafond ; r1 tant qu'il n'y a pas de décision ; après, r6 tour 4 | le plafond tombe une correction trop tard ; compte indéterminé si le tour 3 est repris après la décision |
| H12 | Relecteur relancé, session orpheline | r5 ou r6 ; verdict orphelin ignoré | marche ; l'orpheline n'est nommée nulle part, donc jamais archivée (`A-87`) |
| H13 | un axe « non exécuté » (`A-80`) | verdict refusé sans bloquant ; r4-sinon à chaque demande | impasse sans arbitrage, et le tour compte (C5) |
| H14 | règle montée à haute sur la base après un tour validé à un verdict | Relecteur : r2 ; capitaine : renvoi | aller-retour jusqu'à trois renvois (C2) |
| H15 | renvoi du capitaine pour contrôle instable | PR non listée ; `à-relire` : r2 | marche ; le réveil de `A-86` ne dit rien pour `fusion-bloquée` (C16) |
| H16 | sous-PR mise à jour par le capitaine | r3 | BQ1 |
| H17 | PR écrite en régime 7 dont la base passe en 8 | r3, ligne « poussée après le verdict » | aucun commentaire `À relire` : la ligne ne part à personne (C9) |

## À corriger

**`A-85`, `A-80`, `A-86`, `A-88`, `A-89`**
- **C1.** La fonction doit rendre « rien » quand l'étiquette cible est déjà seule en place ; la ligne ne part qu'à la transition (H1).
- **C2.** « Tous ses verdicts exigés » : le nombre écrit dans la distribution (Relecteur) ou le calcul de `A-82` refait (capitaine, `A-90`) ? `A-85` dit « les mêmes définitions servent au capitaine », `A-91` dit le contraire (H14).
- **C3.** Règle 5 : le verdict d'une session remplacée mais vivante est ignoré, et chaque remplacement remet l'horloge à zéro (H8).
- **C4.** `(redistribué)` : aucune des six règles ne l'écrit, alors que `A-89` compte « un tour redistribué ». Trancher pour une poussée en plein tour : tour suivant, ou même tour redistribué (H9).
- **C5.** Un axe « non exécuté » devrait refaire le tour, pas le refuser (H13).
- **C6.** `A-88` ne vaut que tête inchangée. Corriger un bloquant et en contester un autre est le cas courant (H6).
- **C13.** `A-89` : « revient à qui arbitrerait » puis « l'architecte pour une PR d'une fille », alors que `A-88` donne le conducteur. Sans programme, personne n'est nommé pour une PR de fille.
- **C16.** `A-86` : le cas `fusion-bloquée` manque (le réveil du régime 7 l'avait, `chaine-de-production.md` l.123). Le plafond devrait s'annoncer au troisième refus (H11).

**`A-81`, `A-82`**
- **C7.** V = T avec deux bases de fusion répond « différent » pour toujours. Essai : une sous-PR qui a fusionné `develop`, puis le sujet rafraîchi, donne 2 bases. Chaque tour est validé, aucun ne compte, la règle 6 redistribue sans fin. Demande une faute de l'auteur. Remède : V = T répond « même ».
- **`A-81` contre `A-91`.** « Une PR dont le capitaine a résolu un conflit par règle est donc relue » : non, il juge avant sa mise à jour et fusionne dans le même passage (`passer.sh` l.185-188, puis l.216-233).
- **C14.** Le calcul de `A-82` joue depuis la copie de la boucle, qui ne contient que `scripts/chaine` et `scripts/docs/identifiants.mjs` (`boucle.sh` l.198-205), sans `node_modules`. L'en-tête YAML des règles (`criticality` sous deux formes, `code:` en liste) se lit donc sans bibliothèque. À écrire dans 3c.

**Passage (`A-97` à `A-99`)**
- **C8.** « Ce qu'il ne fait que sans sous-PR ouverte » n'est vrai que pour `rafraichir_sujets` (`boucle.sh` l.246-250 ; les brouillons comptent, `sujet.sh` l.1032). Trois autres chemins reportent `develop` avec une sous-PR ouverte :
  - `sujet.sh fusionner` l.764-769 ;
  - `regrouper` l.951, lancé par la boucle pour toute PR vers `develop` dont le ticket déclare le sujet ;
  - le conducteur lui-même entre deux vagues (`chantier/SKILL.md` l.96 ; `rafraichir` ne vérifie rien). Dans ce cas, le capitaine ne lui écrit rien.
- **C9.** Les PR ouvertes vers `develop` quand la repose entre :
  - La boucle recopie les scripts de `develop` au tour suivant (`boucle.sh` l.342-346), se relance dessus (l.208-212), et `passer.sh` lit la clé sur `origin/develop`.
  - Chaque PR `hors-sujet`, sans sujet ou de documentation, écrite en 7, est renvoyée dans la même boucle : renvoi compté, avant tout geste de l'architecte.
  - Le § 5 de sa branche dit à l'auteur « remettre `à-fusionner` » (l.127), le renvoi dit `à-relire`. Si elle suit son document : trois renvois.
- **C10.** L'ordre « après la repose, l'architecte relance le capitaine et lance le Relecteur » laisse une fenêtre :
  - Les sujets sans sous-PR passent en 8 dans la boucle qui a fusionné la repose (`rafraichir_sujets` en fin de boucle, l.392).
  - Le capitaine en place a chargé le skill de la 7 : il n'écrit rien aux conducteurs.
  - Le Relecteur n'existe pas encore.
  - Aucun lot ne porte le signal « sujet passé en 8 » : `boucle.sh` n'est pas dans le lot 5.
- **C11.** Les tickets déjà découpés en 7 n'ont pas de ligne `Sensibles:`. Après le report, le hook et `sujet.sh fusionner` refusent leurs filles sur tout chemin sensible. « Personne ne s'arrête » est faux pour eux : l'accord est à obtenir en cours de chantier. Décision ouverte.
- **C12.** Où se lit la clé :
  - Le gate `tickets` tourne sur un arbre de travail (`tickets.mjs` l.111-115) : il n'a pas de « base de la PR ».
  - `lireBase` unit aujourd'hui le contrat du sujet et celui de `develop` (`revue-exigee.mjs` l.118-128). Reprise telle quelle pour la clé, elle ferait passer tous les sujets en 8 d'un coup.
- **Fille lancée après la bascule sur un sujet en 7.** Elle trouve tout ce que son § 5 lance (`issue-tracker.md`, `criticite`, `revue-de-ticket`, l.116-123), grâce à `A-98`.

**Gardes (`A-76`, lot 5b)**
- Pour une PR `maj/<nom>`, « le diff » doit être les listes d'`a-juger`, pas tout ce que `develop` apporte (la repose elle-même).
- Pour une sous-PR qui contient du `develop` plus récent que son sujet, le diff de `sujet.sh` l.735 inclut ce `develop` : faux refus « chemin sensible non couvert ».

**Lot 4**
- **C15.** La frontière script/modèle n'est pas dite. `create_session`, `send_message` et `get_session` sont des gestes du modèle. La veille ne doit le réveiller que pour un geste non nul ; l'état des sessions ne doit être demandé que quand il change la réponse.

## Fidélité aux décisions du produit

- **« À dire » 4** : « un chantier ouvert finit sous l'ancien régime » contredit `A-99`. Il change de régime entre deux vagues, son conducteur est relevé (un coût), et ses tickets restants demandent l'accord des fichiers sensibles (C11, `P-47`).
- **« À dire » 2** : la carte n'est pas qu'un journal. Elle porte les décisions `A-n` du conducteur (`chantier/SKILL.md` l.53-55) et le tableau de la demande d'accord (`A-75`).
- **`P-53`** : sans programme, qui décide au plafond d'une PR de fille (C13) ; la ligne d'information au produit n'est rattachée à personne dans `A-89`.
- **`P-51`** : rien ne dit qui pose `à-relire` sur une PR d'un humain ou d'un outil. Aujourd'hui l'architecte pose `à-fusionner` (`architecte/SKILL.md` l.94).
- **`A-74`** : la branche `maj/<nom>` est couverte par l'union des lignes du sujet, plus large que l'accord par ticket de `P-47`. Non nommé.

## Lots 3 à 9

- **Lot 3.**
  - 3a à 3c créent des fichiers sous `relecture/scripts/` avant que le skill existe (3d). Fait à relever : ce que les tests de la racine exigent d'un dossier de skill. Je ne les ai pas lus, hors périmètre.
  - `references/CONTENU.md` serait écrit par les quatre tickets.
  - 3c : le nom du champ de criticité effective se lit dans le schéma pivot, hors de ce dépôt.
  - 3d touche `sujet.sh` (`a-juger`), comme le lot 5.
- **Lot 4.** C15. La sonde annoncée doit couvrir : une session de relecture qui écrit un verdict sur message d'une autre session, et le Relecteur qui crée des sessions depuis sa veille.
- **Lot 5.** 5a attend BQ3. Manquent à la liste : `boucle.sh` (C10), et `pieges.md` l.19 et l.22 au lot 6a.
- **Fichiers partagés hors spec.** Les deux tickets « hors périmètre » touchent `chantier/SKILL.md` et `passer.sh`, comme les lots 5 et 6. Le premier ferme le troisième chemin de C8 : à placer avant le lot 7.
- **Lot 7.** À écrire dans le ticket de repose : Relecteur lancé et capitaine relancé avant la fusion, file vers `develop` vide, lignes `Sensibles:` des tickets ouverts.
- **Lot 8.** `A-101` tient en un paragraphe. Manquent : ce que le capitaine de `skills` vérifie, les étiquettes, le plafond, la contestation.
- **Lot 9.** Les sources de `diff-revue.sh`, `chemins-sensibles.mjs` et `contexte-ticket.mjs` vivent dans les deux skills à retirer.

## Vérifié, supposé

- **Vérifié** : tout ce qui cite une ligne, lu sur `origin/main`. Deux essais sur dépôts jouets hors du dépôt : `<essais>/jouet1` (deux bases de fusion) et `<essais>/jouet2` (conflit sur index).
- **Supposé** : la fréquence des conflits d'index et du commit `docs: régénère…` dans les projets ; ce que GitHub écrit dans `merge_commit_sha` pour une PR entrée par avance rapide ; que le gate `tickets` d'un projet accepte une ligne d'en-tête inconnue (cherché par motif, pas lu en entier).
- **Non fait** : `graphify`, pour rester dans la liste de lecture donnée.
