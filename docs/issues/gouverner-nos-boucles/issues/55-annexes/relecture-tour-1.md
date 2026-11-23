# Ticket 55 — tour 1 (unique, P-65) du relecteur neuf

Base relue : `origin/main` à `d4fe426` (7.33.0, PR 134 entrée) ; PR 138 non entrée, sommet `f40bec4` (7.34.0), descendant de `d4fe426` : « main avec la PR 138 » = `f40bec4` (avance rapide).

## Constats

(au fur et à mesure)

### Rejeu (fait)

- « Si la PR 138 bouge encore », étape 1 : `git diff 7b2be5b f40bec4 -- <les fichiers du ticket>` : vide. Le diff complet `7b2be5b..f40bec4` : 5 fichiers (`plugin.json` 7.33.0 → 7.34.0, `NOTES-DE-VERSION.md`, `fusionner/SKILL.md`, `double-relecture.mjs` et son banc, c'est-à-dire la PR 134). Rien à refaire ; la version commune devient **7.35.0**.
- Tirage indépendant (`outils/tirer.py`, ne lit que le ticket) : 41 sections, 0 faute ; chaque « Ancien » et chaque borne une fois sur `f40bec4`, sur l'arbre du 57 appliqué aussi.
- Ticket 57 appliqué par l'outil de son rédacteur (copie) : les cinq empreintes de « Si le ticket 54 est entré avant » retrouvées (`c608d88c…`, `55675e93…`, `1bc3dd1d…`, `418917f5…`, `16919936…`).
- Banc d'abord : B seuls sur `f40bec4` → 124 tests, 10 rouges (ceux du § 0) ; sur 57 + V1/N1 → 125, 10 rouges, les mêmes.
- Tout appliqué : 124/124 (55 seul), 125/125 (les deux). 55 seul : 17 fichiers, 310 +, 37 − ; `chantier/SKILL.md` `4 6`. Les deux : 25 fichiers (24 M, 1 A), 1 048 +, 56 − ; `5 7`, 126 lignes ; `104 5` ; `1 1` ; `19 0` ; `grep -c "^-.*assert"` : 1 puis 2 ; `couts.mjs` intact. Les deux ordres : même arbre (`git write-tree` `5876c5f7…`, avec 7.35.0 et le 2026-11-19).
- Gate avant/après (`outils/comparer.mjs`, `controlerTicket` et `controlerCarte` des deux versions sur chaque fichier) : ce dépôt, 76 tickets, 41 sans erreur avant comme après, 0 changement ; Anchorpost (`e323464`, copie locale) 164 tickets, 163 sans erreur avant et après ; 7 cartes, 4 sans erreur avant et après ; 0 changement. 6 cartes `fini` d'Anchorpost, toutes avec `## Rétro` ; aucune ligne `Relecture:`/`Sensibles:` (formes d'en-tête) dans tout `docs/`.

- Fait nouveau pendant le tour : la PR 138 est entrée (`origin/main` à `5d05f4b`, 7.34.0, squash) ; `git rev-parse 5d05f4b^{tree} f40bec4^{tree}` : les deux `ddc6454e…`. Tout ce qui précède vaut tel quel sur `origin/main` ; la version commune est 7.35.0.
- Mutations du rédacteur (son outil copié, ses deux numéros recalés 7.34.0 → 7.35.0) : 55 rouges sur 55, les deux vertes attendues (R-8, L-8) ; arbre identique avant et après (`5876c5f7…`).
- La note : le bloc de la Décision 12 du 57 (indentation retirée) = N1 sans ses deux paragraphes et ses points 5 et 6, ligne pour ligne (8 lignes non vides, égales).
- Ligne 95 de `chantier/SKILL.md` : ni « chemin possédé » ni « puis le repose sur la suivante » (0) ; note 7.35.0 en tête.

- Suite entière, une fois, sur l'arbre des deux tickets (`pnpm install --frozen-lockfile`, `pnpm test`) : **1 154 tests, 1 154 verts**, 12 min 13 s (charge 6 à 9), `scripts/poses.test.mjs` compris. 1 154 = 1 080 (PR 138, sa description) + 49 (PR 134, `double-relecture.test.mjs` joué seul : 49) + 25. La base `origin/main` n'a pas été jouée entière : ce compte est déduit.

### Le gate contre le calcul de `main` (`double-relecture.mjs`, `d4fe426`, l. 401-412 et 738-750, recopiées)

`outils/sonde.mjs` : 25 formes de `Relecture:`. Le motif de G2 est celui de `main` caractère pour caractère (`ligneDEnTete`, l. 742). Chaque forme que le gate laisse passer, le calcul la lit `double` ou ne la lit pas ; chaque forme que le calcul rend illisible, le gate la refuse (`double#x`, vide, `# x`, `::`, `-\t`, `*\t`, `***…***`, seconde ligne `- relecture: non`, `‘double’`, `double — voir`). Une seule divergence, du bon côté : `Relecture: "double"` (calcul : `double`, gate : refus). Hors de portée des deux : `  Relecture:` en retrait, `> `, `+ `, `1. `, `- * `, BOM.

### Mutations de mon cru (`outils/mes-mutations.mjs`, sur l'arbre des deux tickets)

17 jouées, 10 rouges, 7 vertes (K2, K6, K8, K13, K14, K16, K17) ; arbre remis (`5876c5f7…`).

## Constats

**C1 (m) — « Ce qui n'a pas été établi », le motif du calcul : périmé.** Le ticket dit le calcul « lu sur la branche du ticket 60 (PR 134, `719f531`), pas dans `main` ». Il est dans `main` depuis `d4fe426` (`git log --oneline -3 origin/main`) ; `ligneDEnTete` y est l. 742, texte identique à G2 ; la sonde ci-dessus le montre lu comme le gate. Retouche : la puce devient « vu sur `main` à `d4fe426`, l. 742, même motif » ; la Décision 4 cite `main`, plus la branche.

**C2 (m) — `Règles:` reste lue moins largement par le gate que par le calcul.** Le gate lit la première ligne `Règles:` seule (`chercher`) et sans la puce étoile (`enTete`) ; le calcul les lit toutes, étoile comprise. Sonde, avant → après : `Règles: —` puis `Règles: n_importe` : gate refus (par accident, sur `—`) → **passe** ; calcul : illisible. `* Règles: n_importe` : gate passe avant et après ; calcul illisible. Le défaut existait (`Règles: RULE_… ` puis une ligne fautive passait déjà), et un « illisible » ne vaut jamais « non exigée » : pas de livraison fausse, mais la Décision 4 (« une ligne que le calcul lira ne passe jamais le gate mal écrite ») ne couvre pas `Règles:`. Retouche : l'écrire dans « Ce qui n'a pas été établi » (ou hors périmètre), sans élargir le ticket.

**C3 (m) — six trous du banc, mutations vertes.**
- K2 : `{}` retiré du refus des chemins (`/[\s`{}]/` → `/[\s`]/`) : vert ; le seul cas à accolades (`` `{{chemin ou motif}}` ``) a des blancs. Ajouter `` [`{{chemin}} — ${ACCORD}`, /n'est pas un chemin/] `` aux refus de B5.
- K8 : `Sensibles:` jugée sur sa première ligne seulement : vert ; « chaque ligne » (Décision 4) n'est tenu que pour `Relecture:`. Ajouter une seconde ligne `Sensibles: a` à `formes`.
- K13 : puce suivie d'une tabulation non lue (`[-*][ \t]+` → `[-*] +`) : vert ; le calcul lit `-\tRelecture: triple` (sonde). Ajouter `-\tRelecture: triple` à `formes`.
- K14 : clé `Sensibles` lue à la casse près : vert (seule `sensibles: —`, valide, est essayée). Ajouter `SENSIBLES: a` à `formes`.
- K6 : commentaire sans blanc devant (`/\s#/` → `/#/`) : vert ; K17 : `Relecture: "double"` admis : vert. Sans conséquence (le calcul lit pareil), à laisser ou à nommer.
- K16 : points 5 et 6 de la note retirés : vert, par choix (B9 n'exige que deux phrases) ; « lecture, en revue ».

**C4 (m) — la grammaire de `Sensibles:` laisse passer ce que la Décision 3 dit refuser, ou presque.** `outils/sens.mjs` : passent `accord de —`, `accord de Session_01Abc`, `accord de https://claude.ai/code/session_01Abc`, `accord de X — accord de Y`, chemins `a\..\b`, `C:\x`, `~/x`, dates `0000-01-01`, `9999-12-31`. La décision dit « ni un identifiant `session_…` » et « sans segment `..` » : `/^session_/` est à la casse près et en tête seulement, `..` n'est cherché que entre `/`. Forme seule, aucune garde ne la lit : retouche facultative (`/(^|[/:])session_/i`, refuser `\`), sinon l'écrire comme limite.

**C5 (m) — R12 : la colonne ne « garde » pas sa largeur.** Ligne 90 du `README.md` : 343 → 344 points de code (`, rétro` = 7, huit espaces ajoutés). Sept espaces la gardent. Le tableau n'est déjà pas aligné (l. 88 : 341, l. 89 : 446) et aucun formateur ne le vérifie en CI : cosmétique. Retouche : sept espaces, ou retirer la phrase.

**C6 (m) — le gabarit de ticket laisse une valeur valide par défaut.** M3 : un ticket copié du gabarit qui oublie de retirer `Relecture: double # …` passe le gate, et le calcul de `main` le lit « exigée » le jour où une garde l'appelle ; `Sensibles:` est sûre (accolades refusées). Même schéma que `Label: contre-revue`, choisi (Décision 9) : à dire dans « Ce qui n'a pas été établi », ou `Relecture: {{double}}`.

**C7 (m) — en-tête : `Modèle: opus` ici, `Modèle: sonnet` au 57, une seule PR, une seule session.** Le lanceur prend le plus fort ; l'écrire dans « Dans la même PR que le ticket 57 ».

**C8 (m) — comptes à relire par la session.** Les chiffres du ticket (1 080, 1 105) sont d'avant la PR 134 ; `main` porte ses 49 tests de plus (`node --test …/double-relecture.test.mjs` : 49). La règle « le compte d'`origin/main` plus 25 » tient ; la session ne doit pas comparer à 1 105. Version : 7.35.0 au jour du tour.

(Un C9 envisagé, « B6 sans plafonds », retiré : `{}` donne les plafonds par défaut, `lirePlafonds` ; les mutations C-1 et C-2 rougissent B6.)

Aucun B.

## Ce que je n'ai pas regardé

- Les deux autres projets du programme (pas de copie locale) ; Anchorpost relu à `e323464` seul.
- Le ticket 57 lui-même (appliqué par l'outil de son rédacteur, empreintes contrôlées) ; ses propres mutations.
- Le comportement de `tickets.mjs` sous `--geler-*` et la dette réelle d'un projet.

## Verdict

**Prêt après retouches** : 0 B, 8 m (C1 à C8). Aucune retouche ne change un bloc qui livre du code faux ; C1, C3 (cas de banc) et C5 sont les seules à faire avant de lancer, le reste peut s'écrire en limites.
