# Plusieurs capitaines sur la même file : un verrou par passage, posé par un commentaire marqué sur la PR

Status: Fait — PR #133, correction PR #135
Type: défaut
Modèle: opus — un verrou entre processus de machines différentes, tenu par des commentaires GitHub (ordre, âge, fin, trappe de sortie), branché sur trois gestes du capitaine et sur la boucle du ticket 1, un faux GitHub à étendre, et la règle « un seul capitaine » à retirer de sept textes sans en oublier un.
Blocked by: 1 (`github.sh`, `passer.sh`, `sujet.sh`, `boucle.sh`, `faux-gh.mjs` et les bancs sont des fichiers chauds du ticket 1, dont la boucle de reprises fixe où le verrou se rafraîchit : partir de `main` après sa fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/github.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/veille.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/sujet/scripts/faux-gh.test.mjs`, `skills/chaine/sujet/scripts/depot-jouet.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-chaine-de-production.md`, `CONTEXT.md`, `README.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 4 (décisions `A-9`, `A-10`, défaut 3). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`P-2`, `A-17`, `A-18`). Ticket 1 : [`1-regle-d-ascendance-avant-chaque-fusion.issue.md`](1-regle-d-ascendance-avant-chaque-fusion.issue.md) (son « Hors périmètre » laisse ici « le verrou du passage et plusieurs capitaines », et sa section 4 garde `fusionner/SKILL.md:38` pour ce lot). Base : `origin/main` après la fusion du ticket 1 (plugin **7.16.0** visé par lui ; `4a45634` en 7.15.0, **738 tests**, avant lui). Faits relus à la source sur `4a45634` le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu sur `fedora`** (défaut 3 de la demande) : deux capitaines sur un même dépôt prennent la même PR. Ils la mettent à jour chacun, l'un voit son push refusé (la branche a bougé), et une PR peut être renvoyée à tort à sa session. Rien ne les départage : `file.sh` ne filtre que sur le label (`file.sh:96`), et le verrou de la boucle (`boucle.sh:159-170`, un `flock` sous `<git-common-dir>`) est local au clone.

**Décision du produit `P-2`** : plusieurs capitaines restent possibles (« parfois Jordan et moi on a chacun notre capitaine »), et leur nombre n'importe pas (« c'est pas gênant d'avoir 1 ou 3 capitaines lancé en même temps sur le même repo en fait on s'en fiche nan ? ») : pas de filtre de file, un verrou visible par PR contre le travail en double. Depuis le ticket 1, deux capitaines ne peuvent plus faire entrer une PR non testée : chacun vérifie l'ascendance juste avant de fusionner. Reste le travail en double.

**Quand le ticket est fait** :

1. Au début de chaque passage (`passer.sh`, `sujet.sh fusionner`, `sujet.sh relancer`), le script pose sur la PR un commentaire visible, « passage du capitaine `<id>` depuis `<heure>` », qui porte la marque invisible `<!-- capitaine:passage <id> -->`. Il relit les commentaires : si un autre capitaine y a posé avant lui une marque encore vivante, il supprime la sienne et saute la PR, sans renvoi.
2. À toute sortie, le script réédite son commentaire en « passage terminé ». Pendant l'attente de la CI (ticket 1), il le rafraîchit à chaque tour.
3. L'identifiant vient de `CAPITAINE_ID`, la session du capitaine, toujours exigé d'un capitaine : sans lui, la boucle, la veille, `passer.sh` et `sujet.sh fusionner` refusent de démarrer. `sujet.sh relancer`, que la session propriétaire joue aussi à la main, ne pose alors aucun verrou et le dit.
4. La règle « un seul `role:capitaine` actif » disparaît de `fusionner/SKILL.md` et des textes qui la redisent.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`, `socle/` abrège `skills/chaine/socle-chaine-de-production/references/`. Lignes relues sur `4a45634` ; le ticket 1 déplace ces scripts : retrouver chaque endroit par sa fonction ou son motif.

### Les scripts

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `fus/github.sh` | après `MARQUE_ATTENTE` (l. 270-271), même forme | `prendre_passage <n>`, `rafraichir_passage`, `finir_passage`, `capitaine_id_valide` (Décisions 1 à 4). Leur commentaire en tête, comme `renvois_de` (l. 17-28). |
| `fus/github.sh` | 295-298 | Modèles des appels d'écriture (`commenter`, `retirer_label`). `commenter` ne rend pas l'id du commentaire : `prendre_passage` fait son propre `POST` avec `--jq '.id'`. |
| `fus/passer.sh` | 56-69 (tête du script) | `capitaine_id_valide` sur `CAPITAINE_ID` avant toute lecture GitHub ; absent ou mal formé : sortie 64. La copie de `passer.sh` (l. 59-63) garde l'environnement. |
| `fus/passer.sh` | entre l'éligibilité (l. 79-197) et « ── 2. Mise à jour » (l. 199) | `prendre_passage "$N"` : pris par un autre, sortie 7 ; illisible, sortie 3 (Décision 5). Puis la trappe de sortie (Décision 3). Puis **la PR relue** (Décision 2 bis) : plus éligible, sortie 7. |
| `fus/passer.sh` | 356-357 sur `4a45634` ; 359-361 sur la PR 115 du ticket 1 | La trappe `EXIT` du ticket 1 (`rm -f "$refus_fusion" "$reponse_fusion"`, deux fichiers) est réunie à celle du verrou, en **une** trappe : une seconde remplacerait la première. |
| `fus/passer.sh` | boucle de reprises du ticket 1 (ex-l. 199-337) | `rafraichir_passage` au début de chaque tour. |
| `fus/passer.sh` | 28-53 (en-tête, sorties) | 7 : « ou en passage chez un autre capitaine (son commentaire marqué), sautée sans renvoi » ; 64 : `CAPITAINE_ID` absent ou mal formé ; 3 : verrou illisible. |
| `suj/sujet.sh` | `fusionner` (l. 700-777 ; l. 716 sur la PR 115) | Même chose, juste après `liens_sur_index` (l. 740 ; l. 756 sur la PR 115) et avant `if [ -n "$maj" ]` (l. 762 sur la PR 115), donc avant le premier contrôle d'ascendance du ticket 1 et avant le chemin de la PR de mise à jour : pris, sortie 7 ; illisible, sortie 11 ; puis la PR relue (Décision 2 bis). `rafraichir_passage` à chaque tour de sa boucle (ticket 1, Décision 4). |
| `suj/sujet.sh` | `relancer` (l. 875-903 ; l. 944 sur la PR 115) | Après `refuser_tete_gardee` et l'arbre propre (l. 881-882), avant le `fetch` (l. 883) : pris, sortie 7 ; illisible, sortie 11 ; puis la PR relue (Décision 2 bis). **Joué à la main par la session propriétaire** (`fusionner/SKILL.md:93`, l. 111 sur la PR 115 : « CI en cours sans job en cours ») : sans `CAPITAINE_ID`, `relancer` ne pose aucun verrou et ne refuse pas ; il le dit en une ligne (`relancer sans CAPITAINE_ID : aucun verrou posé`). Raison : la session n'est pas un capitaine, et son push ne fait que relancer la CI. |
| `suj/sujet.sh` | 83-96 (en-tête, sorties) | 7 pour `fusionner` et `relancer` : passage d'un autre capitaine, ou PR qui n'est plus éligible une fois le verrou pris ; 64 : `CAPITAINE_ID` absent ou mal formé, pour `fusionner` ; mal formé seulement, pour `relancer`. |
| `fus/boucle.sh` | 152-171 (démarrage) | `CAPITAINE_ID` vérifié **après** le `case` des options (l. 152-157 : `--arreter` doit marcher sans lui) et avant le verrou `flock` ; absent ou mal formé : `ARRÊT : CAPITAINE_ID requis (l'id de la session du capitaine, skill fusionner § « Mise en place »)`, sortie 64. L'`exec` de relance (l. 211) garde l'environnement. |
| `fus/boucle.sh` | 296-303, 304-320 (`traiter_sujets`) | `relancer` : `7)` « `[#<n>] en passage chez un autre capitaine : sautée (aucun renvoi)` ». `fusionner` : le `7)` (l. 315) dit « non éligible (fermée, en brouillon, ou en passage chez un autre capitaine) ». |
| `fus/boucle.sh` | 123-150 (`arreter_boucle`) | Entre `TERM` et `KILL`, laisser au `PATCH` de fin du passage le temps de partir : l'attente des détenteurs après `TERM` (aujourd'hui 20 × 0,25 s, l. 142-146) passe à 15 s au plus avant `KILL`, la boucle s'arrêtant dès qu'aucun détenteur ne reste. |
| `fus/boucle.sh` | 1-88 (en-tête) | Plusieurs capitaines : le verrou `flock` vaut pour un clone ; entre capitaines, le commentaire marqué de chaque passage. |
| `fus/veille.sh` | 27-39 | `CAPITAINE_ID` vérifié au démarrage, sortie 64, comme `boucle.sh` (la veille ne doit pas dormir deux minutes avant que la boucle refuse). |
| `suj/faux-gh.mjs` | 209-219 (commentaires), en-tête l. 4-21 | Décision 7. |
| `suj/faux-gh.test.mjs` | — | Un test par ajout du faux. |
| `suj/depot-jouet.mjs` | l'environnement des bancs | `CAPITAINE_ID=capitaine-banc` posé d'office, pour que les bancs existants tournent ; un banc qui teste son absence le retire. |

### Les textes : la fin de la règle « un seul capitaine »

| Fichier | Ligne (`4a45634`) | Aujourd'hui → demain |
| --- | --- | --- |
| `skills/chaine/fusionner/SKILL.md` | 3 (description) | « À lancer dans UNE seule session, « Capitaine de fusion » » → « À lancer dans une session dédiée, « Capitaine de fusion » ; plusieurs capitaines peuvent tenir la même file ». |
| `skills/chaine/fusionner/SKILL.md` | 10 | « Un seul capitaine qui fait passer les PR une par une paie exactement une CI par PR » → « Un capitaine qui fait passer les PR une par une paie exactement une CI par PR. Deux capitaines sur la même file se remettent l'un l'autre en retard (une CI de plus), jamais une PR non testée (« La règle d'ascendance »), et un commentaire marqué réserve à l'un la PR qu'il fait passer ». |
| `skills/chaine/fusionner/SKILL.md` | 28-38 (« Mise en place ») | Le tag reste (le conducteur s'en sert). « `list_sessions` filtré par ce tag ne doit rendre qu'une session active ; s'il en rend une autre, s'arrêter et le dire à l'humain » est retiré. À la place : **`CAPITAINE_ID`** : l'id de la session (`get_session` sans argument), donné en préfixe de chaque commande qui lance la veille, la boucle ou un geste à la main, puisqu'une variable exportée ne survit pas d'un appel de l'outil Bash à l'autre : `CAPITAINE_ID=<id> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1`. |
| `skills/chaine/fusionner/SKILL.md` | 48-51 | La commande de la veille porte le préfixe `CAPITAINE_ID=<id>`. |
| `skills/chaine/fusionner/SKILL.md` | 60 | Une phrase : « Une PR en passage chez un autre capitaine (son commentaire `passage du capitaine …` sans « terminé », de moins de 90 minutes) est sautée sans renvoi (sortie 7) ; elle revient au tour suivant si ce passage n'a pas fusionné. » |
| `skills/chaine/fusionner/SKILL.md` | 88-94 (Enseignements) | « **Plusieurs capitaines** : leur nombre n'importe pas (décision du produit) ; la règle d'ascendance garde la sûreté, le commentaire marqué évite le travail en double. Un passage tué par `KILL` laisse un verrou vivant jusqu'à 90 minutes après la plus tardive de sa création et de son epoch compté » (texte amendé par la seconde contre-relecture, A-55 : une marque posée par une horloge en avance peut revivre jusqu'à son epoch + 90 minutes ; jamais de gel). |
| `skills/chaine/chantier/SKILL.md` | 23 | « une session active » → « au moins une session active (plusieurs sont permises) ». Le ticket 5 change le début de la même ligne (`list_sessions` sans `tags`) : le second des deux à fusionner garde les deux changements. |
| `skills/chaine/architecte/SKILL.md` | 60 | « Un conducteur par chantier, un capitaine par dépôt (`chantier/SKILL.md` § 0, point 5, le cherche par `list_sessions` filtré sur `tags: ["role:capitaine"]`) » → « Un conducteur par chantier, un capitaine au moins par dépôt (plusieurs peuvent tenir la même file ; `chantier/SKILL.md` § 0, point 5, les trouve par `list_sessions` sans `tags`, en gardant les lignes dont le champ `tags` contient `role:capitaine`, ou par l'identifiant de la ligne `Capitaines:` de la carte) ». Le filtre `tags` est refusé à une session (« tags filter is not currently available », relecture du ticket 5). |
| `socle/docs-agents/chaine-de-production.md` | 19 (table des rôles, colonne « Combien ») | « un pour le dépôt » → « un ou plusieurs par dépôt (un verrou par PR) ». |
| `socle/docs-agents/chaine-de-production.md` | 91 | « (sujet dès la première PR, jamais de PR empilée, un seul capitaine) » → « (sujet dès la première PR, jamais de PR empilée, seuls les capitaines fusionnent) ». |
| `socle/fragments/claude-md-fusion.md` | 3 | « **Une seule session fusionne** : le capitaine de fusion (skill `fusionner`) » → « **Seuls les capitaines fusionnent** (skill `fusionner`) ; plusieurs peuvent tenir la même file, un commentaire marqué réserve à l'un la PR qu'il fait passer ». Le titre de la section (l. 1) **ne change pas** : d'autres textes et `references-agent.test.mjs:13` y renvoient. |
| `socle/adr/ADR_ALL_ARC-N-chaine-de-production.md` | 1 (titre), 17, 21 | Titre : « …, un seul capitaine » → « …, les capitaines seuls fusionnent ». L. 17 : « capitaine de fusion (un pour le dépôt) » → « (un ou plusieurs par dépôt) ». Point 5 : « **Un seul capitaine fusionne.** » → « **Seuls les capitaines fusionnent.** », et une phrase : leur nombre n'importe pas, la règle d'ascendance et un verrou par PR. Gabarit : un projet garde son ADR posée, la note de version le dit. |
| `CONTEXT.md` | 25-27 | « La session unique d'un dépôt qui fait entrer les PR prêtes dans la branche d'intégration, une par une. » → « Une session qui fait entrer les PR prêtes dans la branche d'intégration, une par une ; plusieurs peuvent tenir la même file. » |
| `README.md` | 86 | « ; une seule session » → « ; plusieurs capitaines peuvent tenir la même file ». |
| `skills/chaine/fusionner/references/CONTENU.md` | 5, 17, 21, 51 | `github.sh` : les fonctions du verrou et leur raison (les sessions d'une même personne publient sous un même compte ; l'ordre des commentaires départage deux capitaines arrivés à la même seconde ; un label de plus changerait les sept labels du socle). `passer.sh`, `boucle.sh` : 7 et 64. Les tests. |
| `scripts/depot.test.mjs` | un test, après ceux des textes de fusion (l. 405-444, dont le test de la l. 439) | Aucun texte de la chaîne ne redit la règle d'un seul capitaine (Surfaces). |
| Version | voir « 5. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

Appelants réels :

- `passer.sh` : `boucle.sh` (`passer`, l. 332-336), lancée par `veille.sh` ; à la main par le capitaine.
- `sujet.sh fusionner` et `relancer` : `traiter_sujets` (`boucle.sh:296-320`) ; à la main.
- `prendre_passage`, `rafraichir_passage`, `finir_passage` : ces trois gestes seulement.

Règles à lire : `fusionner/SKILL.md` § « Mise en place » et § « Boucle » (l. 28-66), et l'en-tête de `fus/passer.sh` (l. 1-55).

## Décisions

Tenues : `P-2` (plusieurs capitaines, nombre sans importance, pas de filtre de file, verrou visible par PR), `A-9` (la sûreté vient de la règle d'ascendance, le verrou ne supprime que le travail en double ; fin de la règle « un seul `role:capitaine` actif »), `A-10` (commentaire marqué, relu après la pose ; une marque plus ancienne d'un autre capitaine, sans fin et de moins de 90 minutes, fait sauter la PR ; « passage terminé » à toute sortie ; `CAPITAINE_ID` toujours exigé). Ce que le ticket précise :

1. **Le commentaire.**
   - Pose : `POST issues/<n>/comments`, corps « `Passage du capitaine \`<id>\` depuis <hh:mm> UTC : un autre capitaine saute cette PR jusqu'à la fin du passage.` », puis la marque `<!-- capitaine:passage <id> -->`, puis le pied de page des scripts (`\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_`, comme `passer.sh:374`). L'id du commentaire se garde (`PASSAGE_COMMENTAIRE`).
   - Fin : `PATCH issues/comments/<id>`, corps « `Passage du capitaine \`<id>\` terminé à <hh:mm> UTC.` », la même marque, puis `<!-- capitaine:fin -->`, puis le pied de page.
   - Rafraîchissement : le même `PATCH`, corps de pose avec l'heure du tour (« `depuis <hh:mm> UTC, tour <k>` »). Il met à jour `updated_at`, qui fait l'âge du verrou.
2. **La lecture**, juste après la pose : `GET issues/<n>/comments?per_page=100`, toutes les pages. Ne comptent que les commentaires dont `author_association` vaut `OWNER`, `MEMBER` ou `COLLABORATOR` : deux capitaines de deux personnes publient sous deux comptes, donc le compte du capitaine (`gh api user`) ne départage rien ici, au contraire des renvois. La PR est **prise** s'il existe un commentaire qui :
   - porte une marque `<!-- capitaine:passage <autre> -->` avec `<autre>` différent de `CAPITAINE_ID` ;
   - ne porte pas `<!-- capitaine:fin -->` ;
   - a un `id` plus petit que le sien (posé avant) ;
   - a un `updated_at` à moins de 90 minutes du `created_at` du sien. Les deux dates viennent de GitHub : aucune horloge locale n'entre dans la comparaison.

   Prise : `DELETE issues/comments/<son id>`, la ligne `en passage chez le capitaine <autre> depuis <updated_at> : sautée sans renvoi`, sortie 7. Une marque vivante de son propre `CAPITAINE_ID` (passage précédent tué) ne compte pas, et se clôt à ce passage : `finir_passage` la réédite en « terminé » avec le sien.
   - **POST réussi, GET en échec** : le script termine (`PATCH` de fin) ou supprime son commentaire avant de sortir (3 ou 11), pour ne pas laisser un verrou que personne ne tient.
2 bis. **La PR relue après la prise.** L'éligibilité a été lue avant le verrou : un autre capitaine a pu finir son passage entre les deux (PR fusionnée, label retiré, renvoyée). Juste après la prise, le script relit la PR (`pr_json`) : état `open`, label `à-fusionner` présent, `fusion-bloquée` absent, et sommet égal à celui lu à l'éligibilité. Sinon : `PR plus éligible une fois le verrou pris (<raison>) : sautée`, sortie 7, la trappe termine le commentaire.
3. **La trappe.** Une fois le commentaire posé, une seule trappe `EXIT` appelle `finir_passage` (et, dans `passer.sh`, retire `$refus_fusion` et `$reponse_fusion`, les deux fichiers du ticket 1). Elle tourne sur une sortie normale, sur `sortir`, et sur `TERM` (celui de `boucle.sh --arreter`), pas sur `KILL` : un verrou laissé par `KILL` expire 90 minutes après sa dernière date comptée (A-55 : la plus tardive de sa création et de son epoch compté). `finir_passage` en échec n'est qu'une ligne sur la sortie d'erreur : il ne change pas le code de sortie.
4. **`CAPITAINE_ID`.** Forme admise : `^[A-Za-z0-9_-]{1,100}$` (`capitaine_id_valide`), parce que l'id entre dans un commentaire HTML ; une valeur hors de cette forme est refusée comme une absence. Il n'a pas de valeur par défaut : la spec l'exige, et une valeur lue de l'environnement de la session (`CLAUDE_CODE_REMOTE_SESSION_ID` en cloud) changerait d'une machine à l'autre sans que le skill le dise.
5. **Codes.**
   - Prise : 7 partout. La boucle range déjà une sortie 7 de `passer.sh` dans `sautees` (l. 387) : la PR n'est plus présentée dans cette boucle, et la boucle suivante (relancée par la veille) la reverra si l'autre passage n'a pas fusionné.
   - Lecture ou pose impossible : `passer.sh` 3 (la boucle s'arrête, `ARRÊT`) ; `sujet.sh` 11 (aucun renvoi, `ÉCHEC DU CAPITAINE`). Comme le contrôle d'ascendance illisible du ticket 1 : jamais un passage sans verrou.
   - `CAPITAINE_ID` absent : 64 (`usage`) pour la boucle, la veille, `passer.sh` et `sujet.sh fusionner` ; `relancer` sans lui ne verrouille pas (joué à la main par la session propriétaire) ; mal formé : 64 partout.
6. **90 minutes, rafraîchies à chaque tour.** Un tour du ticket 1 attend la CI 60 minutes au plus ; trois tours en feraient plus de 90 sans rafraîchissement. `rafraichir_passage` en échec n'est qu'une ligne sur la sortie d'erreur : le passage continue (au pire, le verrou expire et un autre capitaine fait le travail en double, jamais une fusion non testée).
7. **Le faux GitHub** :
   - `POST issues/<n>/comments` rend l'id réel (aujourd'hui `{ id: 1 }`, l. 212), son `created_at` et `author_association` ;
   - `GET` rend `updated_at` (égal à `created_at` sauf édition) et `author_association` (`OWNER` par défaut ; un commentaire objet peut porter le sien, et `NONE`) ;
   - `PATCH issues/comments/<id>` et `DELETE issues/comments/<id>`, journalisés ;
   - `concurrent` : un commentaire d'un autre capitaine, inséré **avant** le prochain commentaire posé (un id plus petit), pour jouer deux capitaines arrivés à la même seconde ;
   - les dates sans valeur restent celles de `dateDuRang` (l. 130).
8. **Ce que le verrou ne couvre pas** (voir `## Comments`) : la relance des jobs rouges (`traiter_rouges`), `livrer-prets`, `regrouper-series`, `rafraichir_sujets`. Chacun y est idempotent ou refusé par git (push refusé, sortie 5), sauf un double renvoi possible par `traiter_rouges`.
9. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le texte visible des commentaires, le nom des variables, le découpage des bancs. Elle ne tranche **pas** : la lecture par `author_association`, l'ordre par `id`, les dates de GitHub seules, les 90 minutes, l'absence de valeur par défaut de `CAPITAINE_ID`.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 1 fusionné. Chaque banc est vu rouge avant le code qui le rend vert.

### 1. Le faux GitHub, d'abord

Décision 7, un test par ajout dans `suj/faux-gh.test.mjs`. Puis `CAPITAINE_ID` dans l'environnement de `depot-jouet.mjs`. Puis `pnpm test` complet : tout reste vert.

### 2. Les bancs, chacun vu rouge

`fus/github.test.mjs` : **« prendre_passage : une marque vivante d'un autre capitaine, posée avant, prend la PR ; finie, vieille de 90 minutes, posée après, du même capitaine ou d'un compte hors de l'organisation, elle ne la prend pas »**. **Rouge sur `main`** : la fonction n'existe pas.

`fus/fusionner.test.mjs` :

1. **« passer.sh : une PR en passage chez un autre capitaine est sautée (sortie 7), son commentaire retiré, rien n'est poussé »**. Un commentaire marqué d'un autre capitaine, sans fin, `updated_at` récent. Attendu : sortie 7, un `POST` puis un `DELETE` de commentaire au journal, aucun push, aucun `PUT`. **Rouge sur `main`** : la PR est mise à jour et fusionnée.
2. **« passer.sh : deux capitaines à la même seconde, le premier commentaire passe, le second saute »** (`concurrent`). Attendu : sortie 7. **Rouge sur `main`** : la PR passe.
3. **« passer.sh : le commentaire du passage se termine à toute sortie, fusion, refus et TERM compris »**. Trois cas : sortie 0, sortie 4 (titre trop long), `TERM` pendant l'attente de la CI. Pour le cas `TERM`, un faux `sleep` en tête du PATH qui bloque (il attend un signal) : le test envoie `TERM` quand le journal du faux montre la lecture des checks, sans dépendre d'une durée. Attendu : le commentaire porte « terminé » et `<!-- capitaine:fin -->`. **Rouge sur `main`** : aucun commentaire.
4. **« boucle.sh, veille.sh, passer.sh et sujet.sh fusionner refusent de démarrer sans CAPITAINE_ID, sortie 64, rien d'écrit sur GitHub ; boucle.sh --arreter marche sans lui ; relancer à la main ne pose aucun verrou »**. Avec `CAPITAINE_ID` retiré, puis égal à `a-->b`. **Rouge sur `main`** : ils démarrent.
4 bis. **« passer.sh : le passage de A finit entre l'éligibilité et la prise du verrou : la PR relue n'est plus éligible, sortie 7, rien n'est poussé »**. Le faux ferme la PR (ou retire `à-fusionner`) au `POST` du commentaire de B, par une clé d'état jouée une fois. Attendu : sortie 7, le commentaire de B terminé, aucun push. **Rouge sur `main`** : aucun verrou, la PR fermée fait sortir plus tard.

`fus/sujet-fusionner.test.mjs` :

5. **« fusionner et relancer : une sous-PR en passage chez un autre capitaine est sautée (sortie 7), rien n'est poussé ; la boucle ne la renvoie pas »**. **Rouge sur `main`** : la sous-PR est mise à jour ou squashée.
6. **« fusionner : le commentaire du passage est rafraîchi à chaque tour d'attente de la CI »**. Avec `pendantCi` du ticket 1 (le sujet bouge pendant la première attente) pour qu'il y ait deux tours : un `PATCH` de rafraîchissement par tour au journal, avant le squash. **Rouge sur `main`** : aucun commentaire.

`scripts/depot.test.mjs` : **« aucun texte de la chaîne ne redit la règle d'un seul capitaine »**. Sur `fusionner/SKILL.md`, `chantier/SKILL.md`, `architecte/SKILL.md`, `architecte/references/lancement.md`, `socle/docs-agents/chaine-de-production.md`, `socle/fragments/claude-md-fusion.md`, l'ADR gabarit, `CONTEXT.md` et `README.md` : aucune ligne ne correspond à `/un seul capitaine|une seule session fusionne|UNE seule session|un pour le dépôt|ne doit rendre qu'(\*\*)?une|La session unique d'un dépôt/i` (le gras de `qu'**une**`, `fusionner/SKILL.md:38`, est attrapé). Et deux lignes qu'aucun motif ne voit sont tenues en positif : `chantier/SKILL.md` § 0, point 5, porte « au moins une session active » ; `architecte/SKILL.md` § 4 porte « un capitaine au moins par dépôt ». Avec un test d'entrées piégées, comme celui de la l. 428. **Rouge sur `main`** : onze lignes exactement, que le test d'entrées piégées liste : `fusionner/SKILL.md:3`, `:10`, `:38` ; `chaine-de-production.md:19`, `:91` ; `claude-md-fusion.md:3` ; l'ADR gabarit `:1`, `:17`, `:21` ; `CONTEXT.md:26` ; `README.md:86` ; et les deux tenues en positif manquent.

Tests existants qui changent de fixture, chacun gardé et nommé dans la PR : aucun ne change de sens ; ceux qui lisent le journal du faux (`d.journal()`) voient désormais un `POST` de commentaire et un `PATCH` de plus par passage. Les assertions qui comptent les écritures exactes (par exemple `sujet.test.mjs:344`, qui ne passe pas par ces trois gestes, n'en voit aucune) sont relues une à une : n'en filtrer que les commentaires de passage, jamais les supprimer.

### 3. Le code

`github.sh`, puis `passer.sh`, `sujet.sh`, `boucle.sh` et `veille.sh`. Commits sous les hooks, jamais `--no-verify`.

### 4. Les textes

Ceux du second tableau « Où ».

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, un comportement nouveau et une variable exigée : une mineure (voir `## Comments` sur la majeure). Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Plusieurs capitaines peuvent tenir la même file : la règle « un seul capitaine actif » disparaît. Au début de chaque passage, le capitaine pose sur la PR un commentaire « passage du capitaine <id> », et un autre capitaine saute la PR tant que ce passage n'est pas terminé (90 minutes au plus sans nouvelles). La boucle, la veille, `passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer` exigent `CAPITAINE_ID`, l'id de la session du capitaine (sortie 64 sans lui).

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`. Dans la même PR, `CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine » : remplacer « **Une seule session fusionne** : le capitaine de fusion (skill `fusionner`) » par la phrase du fragment du socle (`socle-chaine-de-production/references/fragments/claude-md-fusion.md`, l. 3). L'ADR « chaîne de production » du projet reste telle quelle : elle se révise si le projet le veut.
  3. Relancer chaque capitaine une fois cette PR entrée dans develop, **avec `CAPITAINE_ID`** : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `CAPITAINE_ID=<id de la session> bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1` (skill `fusionner` § « Mise en place »). Un capitaine relancé sans la variable s'arrête aussitôt, sortie 64 : `VEILLE ARRÊTÉE`.

  **Iroki** : ses deux capitaines (un par personne) peuvent tourner ensemble une fois les scripts reposés. Son `boucle.sh` et son `passer.sh` ont divergé (319 et 216 lignes) : reposer remplace ses versions, la repose est celle de 7.16.0. Son `CLAUDE.md` reçoit la phrase du fragment.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Faux GitHub : id, dates et `author_association` des commentaires, `PATCH` et `DELETE`, `concurrent` | `skills/chaine/sujet/scripts/faux-gh.test.mjs`, un test par ajout |
| `prendre_passage` : ordre, âge, fin, même capitaine, compte hors de l'organisation | `skills/chaine/fusionner/scripts/github.test.mjs` « prendre_passage : … » |
| `passer.sh` : PR prise, sautée sans écriture | `fusionner.test.mjs` « passer.sh : une PR en passage chez un autre capitaine est sautée (sortie 7), son commentaire retiré, rien n'est poussé » |
| `passer.sh` : deux capitaines à la même seconde | `fusionner.test.mjs` « passer.sh : deux capitaines à la même seconde, le premier commentaire passe, le second saute » |
| Fin du passage à toute sortie, `TERM` compris | `fusionner.test.mjs` « passer.sh : le commentaire du passage se termine à toute sortie, fusion, refus et TERM compris » |
| `CAPITAINE_ID` exigé, `--arreter` et `relancer` à la main sans lui | `fusionner.test.mjs` « boucle.sh, veille.sh, passer.sh et sujet.sh fusionner refusent de démarrer sans CAPITAINE_ID, sortie 64, rien d'écrit sur GitHub ; boucle.sh --arreter marche sans lui ; relancer à la main ne pose aucun verrou » |
| `sujet.sh fusionner` et `relancer` : sous-PR prise | `sujet-fusionner.test.mjs` « fusionner et relancer : une sous-PR en passage chez un autre capitaine est sautée (sortie 7), rien n'est poussé ; la boucle ne la renvoie pas » |
| Rafraîchissement à chaque tour | `sujet-fusionner.test.mjs` « fusionner : le commentaire du passage est rafraîchi à chaque tour d'attente de la CI » |
| PR relue après la prise du verrou | `fusionner.test.mjs` « passer.sh : le passage de A finit entre l'éligibilité et la prise du verrou : la PR relue n'est plus éligible, sortie 7, rien n'est poussé » |
| La règle d'un seul capitaine retirée des textes | `scripts/depot.test.mjs` « aucun texte de la chaîne ne redit la règle d'un seul capitaine » |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/sujet/scripts/faux-gh.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/github.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs` ;
   - `node --test scripts/depot.test.mjs scripts/poses.test.mjs` ;
   - `bash -n` sur chaque script touché.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - l'ordre par `id` inversé : le banc 2 rougit ;
   - la marque de fin ignorée : le cas « finie » de `github.test.mjs` rougit ;
   - la trappe retirée : le banc 3 rougit ;
   - `rafraichir_passage` retiré de la boucle : le banc 6 rougit ;
   - le filtre `author_association` retiré : le cas « compte hors de l'organisation » rougit.
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` (scripts du capitaine, entrée d'un id dans un commentaire), section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(chaine): plusieurs capitaines sur la même file, un verrou par passage (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Un filtre de file (label de programme, sujet, famille de tickets) : refusé par `P-2`.
- Un état « en passage » dans `file.sh` : la boucle saute la PR à son passage, et la veille ne relance rien sur une PR restée « prête ».
- Le verrou `flock` de la boucle : inchangé, il vaut pour un clone.
- La procédure du capitaine d'un dépôt sans la chaîne (`lancement.md`, bloc « Procédure ») : elle ne passe par aucun script.
- `traiter_rouges`, `livrer-prets`, `regrouper-series`, `rafraichir_sujets` (Décision 8).

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`. Écarts avec la spec et choix à confirmer :
  - **Qui compte** : `A-10` ne dit pas de quels comptes une marque compte. Le ticket lit `author_association` (`OWNER`, `MEMBER`, `COLLABORATOR`), comme la procédure du dépôt sans la chaîne (`lancement.md:57`). Le compte du capitaine (`gh api user`, filtre des renvois) ne départagerait pas deux capitaines de deux personnes, cas même de `P-2`.
  - **Âge du verrou** : `A-10` dit « datée de moins de 90 minutes ». Le ticket prend `updated_at` de l'autre commentaire contre `created_at` du sien (deux dates de GitHub), et fait rafraîchir le commentaire à chaque tour : depuis le ticket 1, un passage peut durer trois attentes de CI de 60 minutes, et un verrou non rafraîchi expirerait en plein passage.
  - **Trois gestes verrouillés**, pas seulement `passer.sh` : depuis le ticket 1, `sujet.sh fusionner` attend lui aussi la CI, et deux capitaines s'y croiseraient de même ; `relancer` pousse sur la branche d'une session.
  - **`CAPITAINE_ID` mal formé refusé** comme absent : la spec ne le disait pas ; l'id entre dans un commentaire HTML.
  - **Version** : `README.md:186` dit « majeure quand un skill existant change de contrat ». Exiger `CAPITAINE_ID` change la façon de lancer le capitaine, mais pas la commande du skill, et le skill fixe lui-même la variable : le ticket propose une mineure. **À confirmer par l'architecte.**
  - **Double renvoi par `traiter_rouges`** : deux capitaines qui relancent puis renvoient la même PR rouge peuvent compter deux renvois pour un. Hors de ce ticket (Décision 8), à suivre s'il se voit.
  - **Fichiers chauds partagés avec le ticket 5** (`chantier/SKILL.md`, `architecte/SKILL.md`, `chaine-de-production.md`) : le ticket 5 touche aussi `chantier/SKILL.md:23` (le début de la ligne, `list_sessions` sans `tags` ; ici la fin), et sinon des lignes différentes (60, 19 et 91 ici ; § 5 et § 6 là-bas), mais les deux ne partent pas ensemble (`A-17`). De même `suj/depot-jouet.mjs`, dont le ticket 13 (chantier 2) réécrit l'environnement : `CAPITAINE_ID` s'ajoute à l'environnement tel qu'il sera sur `main` au lancement.
  - **Recouvrement avec le chantier 2** : sa spec place les lots 2 à 4 et 7 après le ticket 9, qui partage `github.sh`, `boucle.sh`, `passer.sh` et `sujet.sh`. Le `Blocked by: 1` dit la dépendance de contenu ; l'ordre de lancement suit `A-18`.
- 2026-11-18 — Repris après une relecture neuve (« pas prêt »), décisions de l'architecte :
  - **Bloquant** : la PR est relue juste après la prise du verrou (Décision 2 bis), avec son banc (4 bis) : l'éligibilité, lue avant, a pu changer pendant que l'autre capitaine finissait.
  - Verrou de `sujet.sh fusionner` après `liens_sur_index`, avant `if [ -n "$maj" ]` ; POST réussi puis GET en échec : commentaire terminé ou supprimé ; `rafraichir_passage` en échec : une ligne, le passage continue ; une marque vivante de son propre id se clôt au passage suivant ; `CAPITAINE_ID` vérifié après `--arreter` ; `relancer` à la main dispensé ; trappe sur les deux fichiers du ticket 1 ; `--arreter` attend 15 s le `PATCH` de fin avant `KILL` ; bancs 3 (faux `sleep` bloquant) et 6 (`pendantCi`) ; test des textes au compte exact, `qu'**une**` attrapé, `chantier:23` et `architecte:60` tenus en positif ; `architecte/SKILL.md:60` sans filtre `tags`.
  - **Compte des lignes rouges** : la relecture disait dix, ce qui est le compte du motif d'origine. Avec `qu'(\*\*)?une`, le motif en attrape onze sur `4a45634` (relu par `grep -niE` ce jour), listées au banc.
  - **Un tiers qui édite** un commentaire de passage relance son délai de 90 minutes (`updated_at`) ; **un tiers qui le supprime** rend la PR à un autre capitaine (travail en double possible, jamais une fusion non testée : ticket 1). Les comptes qui peuvent le faire sont ceux de l'organisation, de confiance.
  - **Liste de commentaires pas encore à jour chez GitHub** : un capitaine peut ne pas voir le commentaire posé une seconde plus tôt par l'autre ; les deux passent alors, avec du travail en double et un push refusé (sortie 5), jamais une fusion non testée.
  - **Un capitaine qui publierait comme application GitHub** (`login` en `[bot]`, `author_association` souvent `NONE`) ne serait jamais compté : ses marques seraient ignorées. Les capitaines de la chaîne publient sous le compte d'une personne.
- 2026-11-19 — Réalisé par la session du ticket, sur `origin/main` `03e4d64` (7.28.0) ; plugin **7.29.0**. Choix tranchés par défaut prudent :
  - **Texte et noms** : les corps du ticket mot pour mot (pose, rafraîchissement « `depuis <hh:mm> UTC, tour <k>` », fin) ; variables `PASSAGE_COMMENTAIRE`, `PASSAGE_ANCIENS` (ses marques d'un passage tué), `PASSAGE_TOUR`, `PASSAGE_MOTIF` ; la décision est une expression jq pure, `FILTRE_PASSAGE`, que `github.test.mjs` joue directement pour le cas « posée après » (le faux ne sait pas insérer un commentaire après le sien).
  - **Retour de `prendre_passage`** : 0 pris, 1 tenu par un autre, 2 illisible ; chaque appelant le traduit (passer.sh 7/3, sujet.sh 7/11). POST réussi puis lecture en échec : `DELETE` du sien, `PATCH` de fin si le `DELETE` est refusé.
  - **Relecture de la PR après la prise (2 bis) dans `sujet.sh`** : `fusionner` ne demandait pas `à-fusionner` jusqu'ici (geste à la main) ; la relecture n'exige le label que s'il était là à la première lecture, pour ne pas changer le geste à la main. Un brouillon relu est aussi « plus éligible ».
  - **Banc 3, cas de refus** : le titre trop long est refusé **avant** le verrou (éligibilité) et ne pose donc aucun commentaire ; le cas de refus joué est « checks exigés rouges » (sortie 3), après le verrou.
  - **Banc 3, TERM** : le faux `sleep` écrit un fichier avant de bloquer (le journal du faux ne garde que les écritures, pas la lecture des checks) ; le banc envoie TERM au groupe, comme `boucle.sh --arreter`.
  - **Clé jouée une fois du faux** (banc 4 bis) : `apresCommentaire`, `{ state, labels… }` assigné à la PR au prochain commentaire posé, puis retiré ; son test dans `faux-gh.test.mjs`. Ids des commentaires du faux : numéro × 1000 + rang + 1, uniques dans le dépôt comme chez GitHub (le `PATCH` et le `DELETE` ne portent pas le numéro de la PR).
  - **Bancs existants** : `ecritures(d)` de `fusionner.test.mjs` et `sujet-fusionner.test.mjs` filtre les seuls commentaires du verrou (corps marqué `<!-- capitaine:passage `, ou `DELETE issues/comments/<id>`) ; aucune assertion retirée ; `veille.test.mjs` reçoit `CAPITAINE_ID` dans son environnement, `depot-jouet.mjs` le pose d'office.
  - **Le test des textes** liste les onze lignes rouges de 7.28.0 par fichier et extrait, sans numéro de ligne (mineure de la relecture).
  - **Version** : mineure (7.29.0), comme proposé ; à reprendre au numéro suivant celui de `main` au signal de l'architecte.
  - **Limite des 90 minutes** (revue de ticket, axe Ticket, bloquant corrigé) : « à moins de 90 minutes » se lit strictement ; une marque rafraîchie il y a 90 minutes tout juste ne prend plus la PR (`> $t - 5400`), une de 89 min 59 s la prend ; les deux cas au banc.
  - **API GitHub** : les appels du verrou sont ceux de la page REST « Issue comments » de GitHub (`POST issues/<n>/comments`, `PATCH` et `DELETE issues/comments/<id>`, lecture paginée qui rend `author_association`, `created_at` et `updated_at`). La page n'a pas pu être relue depuis la session (`docs.github.com` hors du réseau autorisé) : à relire par l'architecte ; le `PATCH` qui avance `updated_at` est l'hypothèse sur laquelle repose l'âge du verrou.
  - **Double renvoi** (revue, axe Règles) : deux capitaines peuvent encore renvoyer deux fois une même PR, par `traiter_rouges` (Décision 8) et aussi sur un refus 4 lu avant le verrou ou une sortie 2/3 après sa fin ; hors de ce ticket, comme la Décision 8 le dit, à suivre s'il se voit (il compte deux renvois au plafond).
- 2026-11-19 — Reprise de main (session de reprise, à la demande de l'architecte) : `origin/main` `f58ccad` (7.30.0) fusionné dans la branche par un commit de merge ; plugin **7.31.0** (7.29.0 était pris par le ticket 3). Choix tranchés par défaut prudent :
  - **Conflits des bancs** (`fusionner.test.mjs`, `github.test.mjs`, `sujet-fusionner.test.mjs`) : les deux côtés ajoutaient leurs tests en fin de fichier ; le bloc du ticket d'abord, celui de main ensuite, entiers. Aucune ligne du ticket retirée ; les seules lignes de main absentes sont celles que le ticket modifiait déjà avant la fusion.
  - **Notes de version** : la note du ticket en tête sous « ## 7.31.0 », les notes 7.30.0, 7.29.1 et 7.29.0 de main mot pour mot ; dans la note du ticket, « celles de 7.29.0 » (Iroki) devient « celles de 7.31.0 ». Les mentions « 7.29.0 » des commentaires ci-dessus restent : elles datent le travail d'alors.
- 2026-11-19 — Contre-relecture de l'architecte (PR #133 à `aa36ff2`, non conforme), décisions et suites :
  - **B1 (A-21), tranché contre la Décision 5** : une lecture GitHub refusée du verrou est une panne. `prendre_passage` rend 3 sur une lecture refusée ou illisible après la pose (son commentaire retiré), 2 sur une écriture refusée ; `passer.sh` et `sujet.sh` sortent alors en 5 (pause, reprise), explicitement ; seul l'échec d'une écriture garde 3 / 11. Banc `pannes: [{ route: "^issues/40/comments", fois: 2 }]`, rouge sur `aa36ff2` (sortie 3).
  - **Trappe avant le verrou** : posée avant `prendre_passage` dans `passer.sh` et `sujet.sh` ; un TERM pendant la relecture termine le commentaire. Banc (un `gh` lent sur la relecture), rouge la trappe posée après.
  - **Bancs des mutations restées vertes** : `rafraichir_passage` de la boucle de `passer.sh` (banc à deux tours, develop qui bouge pendant la CI) et la relecture 2 bis de `sujet.sh` (`fusionner` et `relancer`, `apresCommentaire`) ; chacun rouge sous sa mutation.
  - **Âge dans le corps** : la marque devient `<!-- capitaine:passage <id> <epoch> -->`, epoch réécrit à chaque rafraîchissement, lu sur le seul commentaire marqué d'un compte de confiance ; `updated_at` ne sert plus. Une marque sans epoch lisible ne vit que 90 minutes depuis son `created_at`. Bancs dans `github.test.mjs` (epoch vieux de 90 minutes avec un `updated_at` récent : libre ; sans epoch : par `created_at`). L'epoch d'un capitaine est son horloge locale, comparée au `created_at` du commentaire de l'autre, donné par GitHub : un écart d'horloge entre machines décale l'expiration d'autant.
- 2026-11-19 — La PR #133 est entrée dans main (7.31.0) sans les corrections de la contre-relecture ci-dessus (ordre de fusion posé par une session hors du programme pendant une coupure de la session du ticket). Elles sont reportées par la PR de correction #135 (`fix/4-verrou-contre-relecture`, plugin 7.31.2, après la PR 136 entrée en 7.31.1), cherry-pick de `8143efb`.
  - **Revue de ticket de la correction** (axe Règles, doute S16, tranché prudemment) : un epoch de plus de 5 minutes dans le futur par rapport au `created_at` du sien ne compte pas ; la marque est alors datée par son `created_at`. Sans cette borne, une horloge en avance (ou une valeur fausse) tenait le verrou au-delà de 90 minutes. Bancs dans `github.test.mjs` (5 min admis, 5 min 1 s non).
  - **Revue de ticket de la correction** (axe Ticket, bloquant corrigé) : une marque à l'epoch illisible (lettres, plus de 12 chiffres) passait pour libre ; elle compte désormais, datée par son `created_at`. Bancs dans `github.test.mjs`. La panne de lecture est aussi au banc pour `sujet.sh relancer`. Laissé : la page « Issue comments » de GitHub reste à relire hors de la session (`docs.github.com` inaccessible), l'âge ne dépendant plus de `updated_at`.
- 2026-11-19 — **Contre-relecture du nouvel architecte (2026-11-19)**, PR #135 à `f96565d`, non conforme. Constats, corrections, et le commit `23c4af2` (code, bancs et textes ; ce bloc dans le commit qui suit). `pnpm test` : 1095 tests, 1095 verts (1076 à `f96565d`, 19 bancs nouveaux).
  - **C1 (bloquant)** : un TERM ou un INT pendant la pose du verrou le laissait vivant. `PASSAGE_COMMENTAIRE` n'était affecté qu'après le POST et son `read` : un signal pendant le POST (réponse en vol, `gh` tué avec le groupe) laissait `finir_passage` sans id. Corrigé : `PASSAGE_POSE_LANCEE`, posé avant le POST et effacé avec l'id lu ; sans id, `finir_passage` relit les commentaires de la PR par `lire_github` et termine (PATCH de fin) les marques vivantes du capitaine (même id, `FILTRE_PASSAGE`) ; une relecture en panne se dit en une ligne (« non terminé (relecture impossible : …), il expirera en 90 minutes »), le code de sortie inchangé. Un POST refusé garde la marque levée (GitHub a pu poser le commentaire et perdre la réponse). Bancs (`fusionner.test.mjs`) : TERM et INT, au groupe et au seul pid, pendant un POST lent, pour `passer.sh` et `sujet.sh fusionner` (8), aucun commentaire de verrou vivant à la fin ; rouges tous les 8 sur `f96565d`. Banc de la relecture en panne à la fin (une ligne, sortie 0, rien d'écrit), rouge sur `f96565d`.
  - **C2** : un TERM pendant la relecture du verrou dans `sujet.sh` n'était au banc pour aucun geste (la mutation « trappe posée après `prendre_passage` dans `verrouiller` » restait verte). Bancs : TERM et INT, au groupe et au seul pid, pendant la relecture lente, pour `sujet.sh fusionner` (4, et les mêmes pour `passer.sh`) ; rouges tous les 4 sous la mutation, verts sur la tête (et sur `f96565d`, qui posait déjà la trappe avant). La mention « Laissé » correspondante est retirée du bloc précédent.
  - **C3** : les bancs d'intégration n'éprouvaient jamais l'epoch (le faux date au 2026-11-17T12:00, les scripts écrivaient l'heure réelle : seul le repli sur `created_at` décidait). Corrigé par une horloge injectable : `PASSAGE_HORLOGE_BANC` (secondes, `^[0-9]{1,12}$`, sinon ignorée) fixe l'epoch et l'heure affichée des marques, rien d'autre ; `depot-jouet.mjs` la pose au 2026-11-17T12:00:00Z ; sans elle, l'horloge de la machine. Banc : le rafraîchissement du tour 2 de `passer.sh` (horloge à 11:55) écrit son epoch ; la marque telle qu'il l'a laissée, créée à 10:00, tient la PR d'un second capitaine (sortie 7, « depuis 2026-11-17T11:55:00Z »). Rouge sur `f96565d` (epoch réel), et rouge sous la mutation « date = `created_at` » (sortie 0).
  - **D (décision A-54)** : un epoch en retard n'était pas borné (horloge en retard de 91 minutes : marque libre dès sa pose ; epoch `0` : libre aussitôt). Règle de `FILTRE_PASSAGE` : date = (E valide et E ≤ `$t` + 300) ? max(E, `created_at` de la marque) : `created_at` de la marque, `$t` restant le `created_at` du sien. Un verrou vit au moins 90 minutes depuis sa pose. Précisé par la seconde contre-relecture (A-55, la règle gardée) : `$t` avance d'un lecteur à l'autre, donc un epoch en avance de plus de 5 minutes sur le lecteur est ignoré tant qu'il le reste, puis compte ; un verrou sans nouvelles meurt 90 minutes après la plus tardive de sa création et de son epoch compté, et une marque posée par une horloge en avance peut revivre jusqu'à E + 90 minutes ; jamais de gel. Bancs purs (`github.test.mjs`) : epoch en retard de 91 minutes sur une marque créée il y a 1 minute, tenue ; epoch `0`, tenue, datée par son `created_at` ; créée il y a 2 heures, epoch rafraîchi il y a 10 minutes, tenue. Rouge sur `f96565d`.
  - **Textes** : la trappe posée avant le verrou, un TERM ou un INT pendant la pose ou la relecture qui termine le commentaire, et la date d'une marque au plus tard de l'epoch et de sa création, dits de même dans la note 7.31.2, `github.sh`, `passer.sh`, `sujet.sh`, `fusionner/SKILL.md`, `CONTENU.md`, `sujet/SKILL.md` et `CONTEXT.md`. La version, d'abord 7.31.1, devient 7.31.2 à la reprise de main après la PR 136 (7.31.1).
