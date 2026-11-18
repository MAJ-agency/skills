# Capitaine à jour et testé — carte du programme

Le capitaine de fusion ne fait plus entrer une PR dont la combinaison « PR + dernier état de la branche cible » n'a jamais été testée, et les défauts voisins relevés le même jour sur `fedora` sont corrigés dans la même passe. Cette carte est la mémoire durable de l'architecte : une session cloud repart d'un conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la source, et reprend à la phase écrite sans reposer une question tranchée.

## Fiche

Phase: spec — spec du chantier 1 écrite, à valider par le produit
Responsable: Guillaume Jauffret
Architecte: session_012xRpgbiXqFh3uGnL8yRbGh (ouverte par le produit le 2026-11-18 à 16 h 40 UTC, mode « Auto », dépôts `anchorpost` et `skills`)
Objectif: un capitaine qui vérifie l'ascendance avant chaque fusion (vers `develop` comme vers un sujet), un ticket par défaut voisin, une version du plugin publiée avec sa note de version.
Dépôts: `MAJ-agency/skills` (le plugin `maj-skills` : skills `fusionner`, `sujet`, `tickets`, `chantier`, `architecte`, `socle-chaine-de-production`) ; les projets (`fedora` d'abord) le reçoivent par la mise à jour du plugin.
Source: la demande du produit du 2026-11-18, dans le message d'ouverture de cette session, recopiée dans `## Source` ci-dessous — entrée brute, ni spec ni décision.
Capitaines: `skills` : à lancer quand la première PR est prête.

## Chantiers

| n°  | Chantier | Dépôt | Spec | Carte | Conducteur | État |
| --- | -------- | ----- | ---- | ----- | ---------- | ---- |
| 1   | Règle d'ascendance du capitaine, puis défauts voisins | `skills` | [`capitaine-a-jour-et-teste.spec.md`](../issues/capitaine-a-jour-et-teste/capitaine-a-jour-et-teste.spec.md) | à écrire par le conducteur | — | spec écrite le 2026-11-18, à valider |

## Decisions-so-far

Décisions du produit :

- P-1 — (2026-11-18, demande d'ouverture) Avant toute fusion, le capitaine vérifie l'ascendance du sommet de la cible dans le sommet testé ; règle en trois cas (à jour ; retard de documentation seule ; tout autre retard), conflit hors index renvoyé ; chemins « de code » lus dans `.claude/chaine.json`. Un ticket par défaut, le correctif d'ascendance en premier, une version publiée, une note de version qui dit ce qu'un projet doit faire.
- P-2 — (2026-11-18) Plusieurs capitaines sur un même dépôt restent possibles (« parfois Jordan et moi on a chacun notre capitaine »), et leur nombre n'a pas d'importance (« c'est pas gênant d'avoir 1 ou 3 capitaines lancé en même temps sur le même repo en fait on s'en fiche nan ? ») : pas de filtre de file, un verrou visible par PR contre le travail en double.
- P-3 — (2026-11-18) Une PR dont le retard ne porte que de la documentation et des index générés entre sans nouvelle CI (cas 2a), après contrôle de la liste des fichiers et de l'arbre fusionné.

Décisions de l'architecte :

- A-1 à A-16 — écrites, avec leur raison, dans la spec du chantier 1 (`## Décisions de conception`) : règle d'ascendance en une fonction partagée ; clé `cheminsDeCode` (sans elle, tout retard compte comme du code) ; contrôle juste avant l'appel de fusion ; écart d'arbre = arrêt ; `sujet.sh fusionner` met à jour et attend la CI ; faux GitHub « strict » d'abord ; conflit lu avant les checks ; clé `fusionsSansEffet` ; file restreinte par label, base ou titre ; verrou par commentaire marqué ; contrôle de vie à 60 minutes ; `send_message` au premier geste ; contexte lu par `get_session` ; `ticket-libre.mjs` lit les fichiers des PR ouvertes ; ligne 8 ; 7.16.0 et `NOTES-DE-VERSION.md`.

## Fog

- Le « catalogue des gates » absent du gabarit des index générés : aucun générateur de ce catalogue n'existe dans le plugin (relevé du 2026-11-18). À retrouver chez `fedora` (quel fichier, quel script) avant d'en faire un index du gabarit.
- Le squash de `fedora` accepté malgré « strict » : hypothèse d'un compte qui contourne la règle, non vérifiée ; sans effet une fois le lot 1 livré.

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |

## Passation

## Journal

- 2026-11-18 — 16 h 50 UTC. Programme ouvert ; relevé à la source des défauts confié à un sous-agent. Aucun capitaine de `skills` trouvé dans les sessions récentes.

## Source

Demande du produit, 2026-11-18, recopiée telle quelle (relevée sur `MAJ-agency/fedora`, plugin en 7.14.0) :

> Le capitaine doit vérifier lui-même qu'une PR est à jour de sa branche cible et testée sur cet état avant de la fusionner. Aujourd'hui il ne le fait pas partout.
>
> **Le défaut.** Une PR peut entrer alors que la combinaison « PR + dernier état de la branche cible » n'a jamais été testée. Vers une branche de sujet : `sujet.sh fusionner` squashe une sous-PR en retard sur le sujet dès que la fusion est propre ; il ne met à jour que sur conflit d'index générés ; aucune CI ne tourne sur un push vers `sujet/**`. Vers `develop` : le réglage GitHub « strict » ne suffit pas ; le 2026-11-18, la PR #1986 a été squashée sur un `develop` que son sommet testé ne contenait pas (#1985 venait d'entrer) ; même cas la veille avec #1961. Conséquence vécue : deux sous-PR entrées en retard (#1968, #1979) ont apporté un import en double, vu seulement à la PR suivante (#1969, « Duplicate identifier »), puis sur #1971.
>
> **La règle.** Avant toute fusion, `git merge-base --is-ancestor <sommet de la cible> <sommet testé de la PR>`. (1) Le sommet testé contient la cible : fusionner, puis vérifier que l'arbre du squash est identique à l'arbre du sommet testé. (2) Sinon, lire ce que porte le retard par `git diff --name-only <sommet testé>...<cible>`, jamais à l'œil : (a) documentation et index générés seulement (rien sous `apps/`, `packages/`, `scripts/`, `e2e/`, `.github/`, ni fichier de configuration), fusion propre hors index : fusionner si l'arbre du squash est identique à la fusion du sommet testé avec la cible, index régénérés ; (b) tout autre retard : mettre à jour, régénérer les index, attendre la CI verte sur ce sommet, puis fusionner et comparer les arbres. (3) Conflit hors index générés : renvoyer (`fusion-bloquée`), ne pas résoudre. La liste des chemins « de code » vient de `.claude/chaine.json`.
>
> **À changer.** `sujet.sh fusionner` (refus hors 2a, mise à jour et attente de CI lui-même) ; `passer.sh` (contrôle juste avant le squash) ; `SKILL.md` de `fusionner` et sa référence (la règle ; le conducteur n'étiquette qu'une sous-PR de code à la fois par sujet) ; bancs à dépôt jouet (retard de code refusé, retard de documentation accepté, cible qui bouge pendant la CI, arbre du squash différent de l'arbre testé).
>
> **Défauts voisins.** (1) PR en conflit sans CI : `sujet.sh fusionner` sort en 5 sans fin, `file.sh` affiche « prête (sans CI) », `sujet.sh relancer` s'arrête sur tout conflit ; une heure perdue sur #1969. (2) Fusion qui apporte un commentaire de `schema.prisma` : le hook `commit-msg` exige une migration ou `[sans-migration: raison]`, la mise à jour par script sort en 3 ; vérifier par diff que seul un commentaire arrive, écrire la mention, sinon s'arrêter. (3) Deux capitaines sur un dépôt prennent les mêmes PR : restreindre la file (label de programme, sujet ou famille de tickets) et verrou visible sur la PR pendant un passage. (4) Capitaine ou conducteur coupé (limite d'usage) sans que personne le voie, cinq heures : contrôle périodique de l'architecte. (5) Fille démarrée sans `send_message` : son prompt le vérifie au premier message. (6) Contexte sous-estimé par la session (330 000 annoncés, 446 000 réels) : le conducteur lit `get_session` (skill `chantier`). (7) Même numéro de ticket pris par deux sessions (`SPEC_ALL_INF-26.45`) : `ticket-libre.mjs` ne lit pas les arbres des PR ouvertes. (8) Toujours vrais : `sujet.sh livrer` pose toujours `à-fusionner` et passe par `gh api` ; `sujet.sh demarrer` refuse à tort (SIGPIPE sous `pipefail`) ; `github.sh:216` « integer expression expected » ; faux positif de `ticket-libre.mjs` sur le titre d'une PR fermée ; le catalogue des gates manque au gabarit des index générés.
>
> **Attendu.** Un ticket par défaut dans `MAJ-agency/skills`, le correctif de la règle d'ascendance en premier, une version du plugin publiée, et une note de version qui dit ce qu'un projet doit faire pour en profiter.
- 2026-11-18 — 17 h 05 UTC. Relevé à la source rendu (sous-agent, `4a45634`) : défauts confirmés sauf le 2 (le hook `sans-migration` est celui du projet) et le 6 (déjà mesuré par `get_session`) ; le catalogue des gates n'a de générateur dans aucun skill. Spec du chantier 1 écrite, A-1 à A-16 ; présentée au produit pour validation.
- 2026-11-18 — 17 h 20 UTC. Le produit demande pourquoi la spec parle du nombre de capitaines et de l'exception de documentation ; réponses : P-2 (plusieurs capitaines, un par personne) et P-3 (pas de nouvelle CI pour un retard de documentation). Filtre `--auteur` ajouté à A-9.
- 2026-11-18 — 17 h 30 UTC. P-2 amendé par le produit : le nombre de capitaines n'a pas d'importance ; A-9 réécrit (plus de filtres de file, verrou seul).
