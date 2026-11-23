# Troisième relecture de la spec du chantier 3 par un agent neuf — 2026-11-18

Relecture de la troisième version de [`relecture-independante.spec.md`](relecture-independante.spec.md) (commit `5cfbf9b`), par un agent en contexte vierge. Rapport brut, non retouché. La quatrième version de la spec y répond.

---

**Verdict : pas prête.** Trois mécanismes ne marchent pas tels qu'écrits : l'ordre du passage à la 8 (`A-98`, `A-99`), la preuve de la livraison finale (`A-92`) et la table de décision du Relecteur (`A-84`, `A-85`, `A-89`). Aucun ne rouvre une décision du produit, chacun se ferme par une reprise locale. Les lots 1 et 2 peuvent être découpés maintenant, à une ligne près (C6).

Lu : la spec, les deux rapports, les lignes `P-6`, `P-38`, `P-41`, `P-47` à `P-58` de la carte, et le plugin sur `origin/main` (4a45634, 7.15.0) sous `skills/chaine/` et `skills/monorepo/`, plus `CONTEXT.md` et `plugin.json`. Rien modifié, rien poussé. Chemins relatifs à `/home/user/skills/skills/chaine/`, lignes sur `origin/main`. Tout est vérifié dans le fichier cité, sauf mention « supposé ». Deux essais sur des dépôts jouets, hors du dépôt.

## Bloquants

**B1 — `A-99` : l'ordre du passage ne tient pas.**
- **Geler, puis « laisser entrer les PR en vol ».** Un sujet gelé ne laisse rien entrer : `sujet/scripts/sujet.sh` l.709-711 (sortie 7), l.842 (`livrer` refuse), `fusionner/scripts/file.sh` l.144-145 (« gelée » : ni passée, ni renvoyée).
- **Personne ne fusionne la PR de repose.** Le capitaine est arrêté avant elle. Le capitaine neuf suit le skill de la 8 : le contrat de `develop` n'a pas la clé, donc il s'arrête (`A-98`, troisième cas).
- **« Relue selon la 7 » n'a plus de texte.** Les scripts de `develop` exigent encore un titre « Revue de ticket » (`fusionner/scripts/passer.sh` l.185-187, `revue-exigee.mjs` l.211-229). La session de repose, lancée après la bascule, suit le marketplace (`architecte/references/lancement.md` l.11, l.73). Or `revue-de-ticket` n'y est plus qu'un renvoi (`A-98`) et ses prompts sont dans `relecture` (`A-78`).
- **Après le dégel, les filles repartent en 7.** Elles sont relancées sur leurs branches (`chantier/SKILL.md` l.108). Ces branches portent le § 5 de la 7, que leur prompt leur dit de suivre (`socle-chaine-de-production/references/docs-agents/chaine-de-production.md` l.106), les hooks de la 7, et un contrat sans la clé, que le hook lit dans l'arbre de travail (`agent/regles.mjs` l.24).
- **Les sujets actifs restent en 7.** Un sujet qui a une sous-PR ouverte n'est pas rafraîchi (`boucle.sh` l.244-250). Les sous-PR restées ouvertes portent `à-fusionner` sans verdict : un renvoi compté chacune.
- **Non dit :** où chaque garde lit la clé (arbre de travail, base de la PR, `develop`).

**B2 — `A-92` : la preuve est vide pour une tête `sujet/*`.**
- `livraison_intermediaire` (`passer.sh` l.117-155) cherche un ancêtre commun de la tête et du sujet. Quand la tête est le sujet, cet ancêtre est la tête elle-même, et l'écart est toujours vide.
- Essai : un commit poussé directement sur `sujet/x`, sans PR, puis `develop` fusionné. Écart vide, livraison dispensée.
- Cartes, gels et reports de `develop` ne font donc jamais échouer la preuve. Un commit sans relecture non plus.
- La dernière ligne de la « Vérification d'ensemble » (« une livraison finale qui porte un commit de plus que le sujet ») ne peut pas être construite.
- Le point 2 de « À dire au produit » annonce une preuve qui n'existe que pour `livraison/*`.
- Une livraison renvoyée n'a pas de retour. `sujet/SKILL.md` l.46 dit « remettre `à-fusionner` », la spec l'interdit à tous sauf `livrer`, et `livrer` ne peut pas rouvrir une PR ouverte. Si quelqu'un pose `à-relire`, le Relecteur, qui ne connaît pas la dispense, lance une relecture sur tout le sujet.

**B3 — `A-84`, `A-85`, `A-89` : la table du Relecteur ne détermine pas son geste.**
- **Étiquette perdue.** Il ne liste que `à-relire` et `à-fusionner` : une PR sans étiquette n'est vue par personne, alors que `A-84` dit qu'elle « se répare d'elle-même ». « Une étiquette à la fois » (`github.sh` l.295-297) fait deux appels : retirer puis poser crée l'état sans étiquette que `A-84` nie. `renvoyer.sh` l.24-25 pose d'abord.
- **« La demande en cours » n'est pas définie.** Le tableau fait écrire un commentaire `À relire` à chaque demande ; `A-93` et `A-88` disent seulement « reposer `à-relire` ». Sans nouveau commentaire, ou si l'étiquette part avant lui : le Relecteur voit un tour dont tous les verdicts sont écrits, refusés, et repose `à-reprendre` sur l'ancien verdict.
- **Les pas se recouvrent, sans priorité.** Après un renvoi pour contrôle instable, le pas 1 (lancer) et le pas 5 (reposer `à-fusionner`) s'appliquent tous deux. De même 3 et 4 quand les verdicts portent sur un sommet dépassé. Le pas 5 ne laisse aucune trace : à la veille suivante, le pas 1 s'applique encore.
- **Session vivante sans verdict** (tour fini sur une question, verdict mal formé ou édité, que le lecteur ignore) : « vivante, il attend », sans borne. Le réveil de l'auteur (`A-86`) se tait, puisqu'un commentaire `Relecture — tour` existe.
- **« Les verdicts du tour » ne sont pas définis.** Trois suites où le compte de `A-89` hésite :
  1. Une session remplacée écrit quand même, en retard, un refus ; la remplaçante valide.
  2. Tour redistribué : un refus sur l'ancien sommet, une validation sur le nouveau.
  3. Tour repris après arbitrage et validé : `A-89` le dit refusé (« si l'un de ses verdicts l'est »), le tableau de `A-84` donne `à-fusionner`.
- **Le capitaine** (`A-91`) compte les `validé` « de sessions distinctes » sans dire « parmi celles du dernier commentaire ».
- **Fenêtre lancement puis commentaire.** Deux réveils ne se croisent pas, une session joue ses tours l'un après l'autre. Un conteneur relancé entre les deux lance deux fois ; rien ne dit d'ignorer le verdict de la session orpheline.

## À corriger

**C1 — `A-73` contre `A-98` : le socle de la chaîne ne peut pas être « un ticket du chantier ».**
- Sur un dépôt sans `.claude/chaine.json`, il n'y a ni gate, ni `sujet.sh`, ni capitaine possible (`boucle.sh` l.199-201 s'arrête sans `scripts/chaine` dans `develop`).
- `chantier/SKILL.md` l.22 le fait poser par le conducteur. `A-98` dit « rien ne change », `A-73` dit « pas d'exception ». L'accord du produit pour cette pose n'est écrit nulle part.
- Autre trou de `A-74` : « tous sous un chemin sensible ». Le ticket 2 d'un module que le ticket 1 rend sensible ne peut pas avoir sa ligne valide au cadrage.

**C2 — `A-78` : les scripts repris relisent `HEAD` et l'arbre de travail.**
- `revue-adversariale/scripts/diff-revue.sh` fait `git diff "$base...HEAD"`. `contexte-ticket.mjs` lit les fichiers du disque. Depuis une session créée sur la base : « diff vide », sortie 1.
- `/security-review` porte sur la branche courante (`revue-adversariale/SKILL.md`, étape 2).
- `revue-de-ticket/SKILL.md`, étape 1, joue les gates des index, donc du code de la PR.
- Les listes de `verifier_mise_a_jour` (`sujet.sh` l.602-651) sont des variables internes de `fusionner` : aucune commande ne les rend (l.1270).

**C3 — `A-81` : trois bornes manquent.**
- **La base.** C'est celle de la PR, pas `develop`. Recopier la l.120 telle quelle ferait perdre son verdict à toute sous-PR mise à jour par le capitaine. Essai : une sous-PR qui a fusionné `develop` avant le rafraîchissement du sujet a deux bases communes.
- **V ancêtre de T** n'est pas exigé. Après un rebase, V peut être introuvable : le calcul doit répondre « différent ».
- **La liste des index** se lit d'abord dans l'arbre de travail (`github.sh` l.64-67). Celui du Relecteur date de son lancement, celui du capitaine est rafraîchi à chaque tour : deux réponses possibles.
- Le Relecteur peut jouer le calcul : `git merge-tree` et `diff` sur des objets, sans arbre de travail, clone complet requis.
- « Une PR qu'il a lui-même mise à jour reste donc valable » (`A-91`) est faux pour un conflit de pile résolu par règle (`passer.sh` l.216-233). Pour un index par motif régénéré vers un contenu nouveau : supposé, je n'ai vu la liste d'aucun projet.

**C4 — `A-82` : le lecteur n'existe pas et sa source n'est pas bornée.**
- Aucun script du plugin ne lit les règles de l'index. Seul `schema` l'est (`criticite/SKILL.md` l.26) ; le reste est de la prose pour sous-agents. Champ et pivot à nommer.
- Le niveau par l'effet d'une feature vient de `featureCriticality` du manifeste (`criticite/SKILL.md` l.57) : le repli sur l'en-tête ne le voit pas.
- `code:` est facultatif (`tickets/references/gabarits/regle.md` l.20). « Le calcul répond donc quand même » est trop fort pour une PR sans ticket.
- Lu sur la base, le calcul ne voit pas la PR qui monte elle-même une règle à haute.

**C5 — `A-88`, `A-89`.**
- La décision de plafond d'une PR de l'architecte revient à l'architecte, son auteur. De même le conducteur sans programme.
- Une décision de plafond qui écarte un bloquant n'a pas de forme que la session de relecture reconnaisse, contrairement à `Arbitrage`.

**C6 — Lot 2 : « cesse d'exiger `Label: contre-revue` » avant la bascule ouvre le régime 7.**
- Le gate est la seule tenue mécanique du label (`tickets/references/scripts/verify/tickets-regles.mjs` l.401-416).
- Sans lui, la fille livre avec `à-fusionner` et le capitaine fusionne avant la contre-revue (`chantier/SKILL.md` l.95).
- Sont touchés : tout dépôt posé ou reposé entre le lot 2 et le lot 5. À porter au lot 5, ou sous la clé.

**C7 — `A-83`.**
- « Comme il le fait pour le capitaine », c'est `list_sessions` filtré par tag (`chantier/SKILL.md` l.23). La description de l'outil dit ce filtre refusé depuis une session (lu, pas essayé). La ligne `Relecteur:` et `get_session` suffiraient.
- Sans programme : qui lance, et une ligne par carte pour une seule session.

**C8 — `A-100` : fusionnable, à quatre conditions non écrites.**
- La procédure de `skills` le permet : étiquette, commentaire au sha, tous les contrôles verts, squash (`lancement.md` l.57).
- PR en brouillon jusqu'au bout.
- Les sessions des parties n'ordonnent pas la fusion. Aujourd'hui c'est `Label: contre-revue`, l.76, la ligne que la partie e récrit.
- L'ordre est écrit par l'architecte au sommet relu (l.80). Tout push ensuite vaut renvoi, et trois renvois font le plafond.
- Supposé : d'autres tickets du programme touchent `passer.sh` et `chantier/SKILL.md` dans `main` pendant ce temps.

## Notes
- **Axe « Tickets » partout.** Toute PR de ticket modifie son ticket (`Status:`) : par l'union des axes (`A-78`), elle le reçoit.
- **Deux gravités.** Tout ancien « à corriger » devient bloquant : plus de tours refusés, plafond plus proche.
- **Information du produit (`A-90`).** La ligne du Relecteur au conducteur ne dit pas « double ». Avec `Conducteur: —`, personne n'informe.
- **« À dire au produit » 1.** « Personne d'autre que lui » se lit « l'architecte lui-même », l'inverse de `A-88`.
- **`gh` en session cloud.** `fusionner/SKILL.md` l.14 dit qu'il passe ; `lancement.md` l.54 et `architecte/SKILL.md` l.31 disent qu'il n'y en a pas. `A-84` en dépend pour le Relecteur.
- **Skill `relecteur`.** `disable-model-invocation` et commande en première ligne, comme `chantier` : non dit.

## 1. La seconde relecture, point par point

| Point | État | Réponse | Reste |
| --- | --- | --- | --- |
| N1 | à moitié | `A-73`, `A-74` | chantier fermé (cadrage fusionné avant les filles : `chantier/SKILL.md` l.68, `sujet.sh` l.201-202) ; pose du socle : C1 |
| N2 | à moitié | `A-84` à `A-86` | B3 |
| N3 | à moitié | `A-97` à `A-99` | B1 |
| N4 | fermé | `A-100` | conditions, C8 |
| Ligne de tête | fermé | `A-98` | où la clé se lit, B1 |
| Livraison et `à-fusionner` | à moitié | `A-84`, `A-92` | livraison renvoyée, B2 |
| Notion à définir | à moitié | `A-81` | C3 |
| Le compte | à moitié | `A-89` | B3 |
| Double relecture | à moitié | `A-82`, `A-90` | C4 ; le gate qui exige `Relecture: double` n'est dans aucun lot |
| Transitions | fermé | `A-84`, `A-85` | ordre des deux écritures, B3 |
| Mineurs | fermé | vocabulaire, `A-78` | — |
| PR de mise à jour | fermé | `A-78` | listes non appelables, C2 |
| Scripts des skills retirés | fermé | `A-78`, lot 5 f | où vivent les sources après f |
| `Relecteurs:` | à moitié | `A-83` | C7 |
| Accord sans relecture | fermé | `A-73`, `A-94` | — |
| `skills` entre 5 et 7 | fermé | `A-98`, `A-101` | — |
| Clé du gabarit | fermé | lot 5 f | — |
| Gardes hors interrupteur | fermé | `A-76`, lot 5 b | — |
| Notes (révision de la session, verdict édité, PR sans auteur, étiquettes, essai d'ensemble, « Restrict deletions ») | fermées | `A-78`, `A-80`, `A-84`, `A-77`, lot 5 f | C2 pour la première |

Les quatre faits « faux » de la seconde relecture sont corrigés.

## 3. Fidélité aux décisions du produit
- **`P-51`** : la dispense des livraisons lui est présentée comme prouvée par le script (B2).
- **`P-52`** dit « renvoie à la même session relecture ». `A-85` pas 1 dit « il lance » à chaque demande ; seule la reprise après arbitrage garde la session. À trancher et à dire.
- **`P-53`, `P-50`** : l'auteur décide de son propre plafond dans deux cas (C5). « À dire » 1 ne couvre que l'arbitrage.
- **`P-47`** : la pose d'un socle et la première repose se font sans ligne d'accord. « À dire » 3 promet l'accord à chaque repose sans dire par quel ticket. `A-74` l'impose pourtant : un ticket, entré dans `develop` avant, dont la ligne couvre des dizaines de chemins.
- **Coût**, absent de « À dire » : une session par PR, documentation comprise, et tout écart désormais bloquant.

## 4. Faits nouveaux sur l'existant

| Fait | Jugement | Preuve |
| --- | --- | --- |
| `cheminExige` | vrai | `revue-exigee.mjs` l.177-203. La ligne de commande (l.253-264) ne reçoit que corps, titre et base : « lit les verdicts » demande de lui passer les commentaires |
| Deux `depot-jouet.mjs` | vrai | `sujet/scripts/`, `tickets/references/scripts/docs/` |
| `garde-fichiers.mjs` ne voit que les outils d'édition | vrai | l.2 et `settings-hooks.json` |
| Hook réseau « comme `garde-commandes` » | vrai | `garde-commandes.mjs`, `ls-remote` ; délai du hook 30 s |
| Une étiquette à la fois | vrai pour le capitaine | `github.sh` l.295-297. L'auteur écrit la liste complète (`tickets/references/agents/issue-tracker.md` l.29) |
| `sujet.sh carte`, `geler`, `livrer`, `demarrer` | vrais | l.1221-1264, l.351-363, l.871, l.451-452 |
| « Dispensée aujourd'hui sur son nom » | vrai | `passer.sh` l.158-160 |
| « Sept labels » | vrai, liste incomplète | `socle-chaine-de-production/SKILL.md` l.3, 68, 90 ; `admin.md` l.10 ; oublié : `references/CONTENU.md` l.25 |
| `Capitaines:` | vrai | `gabarits/programme.md` l.15 ; `Capitaine:` dans `carte.map.md` l.18 |
| `chantier` vérifie le capitaine | vrai, par tag | `chantier/SKILL.md` l.23 |
| La boucle recopie `develop` | vrai | `boucle.sh` l.190-216 |
| `/security-review` « comme aujourd'hui » | approximatif | aujourd'hui joué sur la branche de l'auteur |
| Index Anchorpost, « niveau effectif » | approximatif | aucun lecteur dans le plugin |
| « Les lots 1 à 4 sont sans effet » | faux pour 1 et 2 | la repose retire CODEOWNERS ; C6 |

Non vérifié : les tests de `scripts/` à la racine, hors de mon périmètre.

## 5. Lots et ordre
- **Fichiers partagés.** Les lots se suivent tous : aucun fichier n'est touché par deux lots non ordonnés.
- **Dans aucun lot.** Le gate qui exige `Relecture: double` (`A-90`), et celui qui croiserait `Fichiers chauds:` et `Sensibles:`.
- **Lot 3, trop gros pour une session.** Quatre tickets au moins : lecteur de verdict ; « même contenu propre » avec ses bancs ; « double relecture » avec son lecteur d'index ; skill, prompts et `poser`, dont la reprise des trois scripts (C2).
- **Lot 4.** Sa file et sa veille demandent `sujet/scripts/faux-gh.mjs` (commentaires, étiquettes), absent de sa liste.
- **Lot 5, parties a, b, c.** Toutes écrivent `sujet.sh` et `passer.sh` : ordre a, b, c obligatoire. La partie a dépend des scripts du lot 3, à trouver à côté ou dans le skill (comme `sujet.sh` l.101-103). Ses bancs affirment le texte de renvoi que c change.
- **Lot 5, parties d, e, f.** e renvoie au § « demander la relecture » écrit par d. f dépend de tout.
- **`lancement.md` l.76.** Une même phrase porte le régime des dépôts à chaîne et celui de `skills` : « hors les paragraphes de `skills` » coupe au milieu d'elle.
- **ADR.** `A-77` marque l'ADR « CODEOWNERS » remplacée au lot 1 par une ADR que `A-96` n'écrit qu'au lot 5 ; son fichier n'est pas dans la liste du lot 1.

Spec relue : `/home/user/skills/docs/issues/gouverner-nos-boucles/relecture-independante.spec.md`.
