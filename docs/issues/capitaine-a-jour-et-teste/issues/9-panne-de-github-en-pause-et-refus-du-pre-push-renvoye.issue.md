# Une panne de GitHub met le capitaine en pause, et un refus du pre-push renvoie la PR au lieu d'arrêter la boucle

Status: en cours — fix/9-panne-github-pre-push
Type: défaut
Modèle: opus — une lecture GitHub unique à faire passer par toutes les lectures qui décident d'une fusion, sans s'en remettre à `set -e` (perdu sous `||` et dans les sous-shells), un code de sortie qui change de sens dans la boucle, et un classement des refus de push qui renvoie une PR à sa session ou arrête le capitaine ; une erreur vide la file, fusionne sur une lecture fausse ou renvoie à tort.
Blocked by: 8 (`skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/SKILL.md`, `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont des fichiers chauds du ticket 8, lui-même après le ticket 1 : partir de `main` après leur fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/github.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/scripts/boucle-outils.test.mjs`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/sujet/scripts/faux-gh.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 9 (points A3 et A4, décisions `A-21`, `A-22` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 3 et 4. Spec du chantier 1 : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 7 (`A-15`, `github.sh:216`), dont ce ticket absorbe une part. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**), puis les tickets 1 et 8 fusionnés. Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut, A3 (panne de GitHub).** Un 502 fait planter un tour, ou pire, se lit comme un état :

- `checks_commit` (`github.sh:202-207`) passe à `jq` le corps de la réponse, quel qu'il soit. Un corps vide donne « aucun check », d'où « CI non déclenchée » au bout de 5 minutes (`passer.sh:310`) ; un corps d'erreur fait échouer `jq` ;
- `checks_exiges` (`github.sh:212-218`) se replie sur `[]` sur toute erreur (l. 215, 217) : une panne se lit « aucun check exigé ». La l. 216 compare la longueur avec `-gt` : une réponse qui en donne deux nombres écrit « integer expression expected » (défaut 8 du chantier 1) ;
- `boucle.sh:347` lit `file.sh` dans un tube sans regarder son code : une file illisible est une file vide, `FILE VIDE`, et la veille s'endort ;
- deux sorties 5 de suite (`boucle.sh:359-363`, puis `*)` l. 388) arrêtent la boucle : `ARRÊT sur #<n> (sortie 5)`.

**Le défaut, A4 (refus du pre-push).** `pousser` (`github.sh:107-115`) range tout push refusé en 3, hook comme distant. `passer.sh` en sort en 3 (l. 279-282) avec un message que la boucle ne reconnaît pas : `ARRÊT` (l. 380-381). Chez Iroki, un pre-push rouge sur la mise à jour avec `develop` a arrêté le capitaine, alors que c'est la PR qui était à corriger. Iroki l'a corrigé (`SPEC_ALL_SOC-4.77`, #633, `ba743007`) sur ses scripts, qui ont divergé : le correctif se **réécrit** ici, il ne se copie pas.

**Quand le ticket est fait** (`A-21`, `A-22`) :

1. Toute lecture GitHub qui décide d'un état ou d'une fusion passe par **une seule fonction** de `github.sh`, qui refuse une réponse vide, non JSON, ou porteuse d'un `message` d'erreur. Ce refus devient la **sortie 5** du script qui lisait.
2. La boucle traite 5 comme une **pause** : elle attend, puis reprend au tour suivant. Une sortie 5 ne l'arrête plus jamais, et une file illisible n'est plus une file vide.
3. Un push refusé se classe par la **trace de husky** : `husky - pre-push script failed (code N)` donne 3, et la PR est renvoyée à sa session avec la sortie du hook ; tout autre refus donne 4 dans `pousser`, un échec fermé, jamais un renvoi. La règle vaut pour chaque appel de `pousser`, dans `passer.sh` comme dans `sujet.sh`.
4. Toute sortie de git ou de hook que les scripts du capitaine relaient (sortie d'erreur, journal, commentaire de PR) passe par `masquer_url` : une URL à identifiants n'y paraît jamais (`A-42`, `SPEC_ALL_SOC-4.52` d'Iroki).
5. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`. Lignes relues sur `4a45634` ; les tickets 1 et 8 auront décalé celles de `github.sh`, `passer.sh`, `boucle.sh` et `sujet.sh` : se repérer aux fonctions nommées.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `fus/github.sh` | après 184 (`pr_json`) | `lire_github <route> [--paginate] [--absent <défaut>]` : la lecture unique (Décision 1). |
| idem | 184, 193 | `pr_json`, `pr_sommet` : par `lire_github` ; refus → 5. |
| idem | 202-207 | `checks_commit` : les deux lectures (`check-runs`, `status`) par `lire_github` ; refus → 5, jamais « aucun check ». |
| idem | 212-218 | `checks_exiges` : les règles (`rules/branches/develop`) par `lire_github`, qui doit rendre un tableau ; puis, s'il est vide, l'ancienne protection par `lire_github --absent '[]'` (un 404 « Branch not protected » est une réponse, pas une panne). Toute autre erreur → 5. La comparaison de la l. 216 ne lit plus qu'un nombre validé : le défaut `github.sh:216` du lot 7 tombe ici. |
| idem | `attendre_ci` (ajoutée par le ticket 1 après la l. 218) | Un code de retour de plus, **5** : GitHub illisible pendant l'attente. Jamais lu comme « encore en attente » ni comme « aucun check ». |
| idem | 95-102 (`jouer_ou_dire`), et une fonction voisine | `masquer_url` (filtre : `://<tout sauf / @ et blanc>@` devient `://***@`) et `git_masque <args>` (joue `git`, sa sortie d'erreur passée par `masquer_url`, même code de sortie) ; `jouer_ou_dire` masque la sortie qu'il relaie et celle qu'il rend (Décision 10). |
| idem | 103-115 (`pousser`) | Classement du refus (Décision 3) : 0 poussé ; 5 la branche a bougé ou le distant ne répond pas (inchangé) ; 3 la trace de husky est dans la sortie de ce push ; 4 tout autre refus. En-tête de la fonction réécrit. |
| `fus/passer.sh` | 28-53 (en-tête) | Sorties : 3 « push refusé par le hook pre-push » (renvoyé par la boucle) et 3 « push refusé par le distant » (arrêt) ; 5 « GitHub illisible » (pause) ; la l. 47-48 (commentaire d'attente impossible) passe de 5 à 3. |
| idem | 75 (`pr=$(pr_json …)`), 170-171 (parente d'une pile) | Une lecture refusée sort en 5, explicitement (`|| sortir 5 …`), jamais par `set -e`. |
| idem | 274-284 (push), et chaque push de la boucle de mise à jour du ticket 1 | `pousser` 3 → `sortir 3 "push refusé par le hook pre-push : sortie ci-dessus ; corriger, jamais en sautant le hook"` ; 4 → `sortir 3 "push refusé par le distant (règle de dépôt, droit, panne ou coupure ; aucune trace du hook pre-push) : sortie ci-dessus"` ; 5 inchangé. |
| idem | 289-336 (attentes, déplacées par le ticket 1 dans `attendre_ci`) | `attendre_ci` 5 → `sortir 5 "GitHub illisible pendant l'attente de la CI : pause, puis reprise"`. |
| idem | 374-375 | Commentaire d'attente impossible : `sortir 3` (message inchangé) au lieu de 5 : la boucle l'arrête par sa branche `3)` finale, sans relance en rond. |
| idem | 102-103 (fetch), 206 (`sortie_merge`), 367 (refus de fusion de GitHub) | Sorties de git et de GitHub relayées : `git_masque fetch …`, `printf '%s\n' "$sortie_merge" \| masquer_url >&2`, idem pour `$message` (Décision 10). |
| `fus/file.sh` | 69-71, 75, 110, 173 | Les lectures de la file (`pulls`), des checks exigés, des checks d'un sommet et de la base d'une parente passent par `lire_github`. Un refus : rien sur la sortie standard (les lignes se rassemblent, puis s'écrivent d'un coup), le motif sur la sortie d'erreur, sortie 5. `gh api user` (l. 63) et les lectures qui ont déjà leur repli écrit (`renvois_de`, `attend_humain`, `revue_proprietaires_exigee`, `proprietaires_de`) ne changent pas. |
| `fus/boucle.sh` | 1-35 (en-tête) | 5 = pause, jamais un arrêt ; le refus du pre-push renvoyé ; le refus du distant arrêté. |
| idem | 347 | La file se lit avec son code : 5 → `PAUSE` puis tour suivant ; un autre code non nul → `ARRÊT : file.sh en échec (sortie <k>)`, sortie 6 ; jamais `FILE VIDE` sur un échec. |
| idem | 359-363, 365-389 | 5 de `passer.sh` : le second essai immédiat reste ; un second 5 donne `[#<n>] PAUSE <hh:mm> (sortie 5) : <dernière ligne de passer.sh>, reprise dans <s> s`, puis le tour suivant, jamais `ARRÊT`. Dans `3)` : une branche `push refusé par le hook pre-push` qui renvoie la PR avec la sortie du hook (Décision 4), avant la branche finale `ARRÊT`. |
| idem | 296-303, 304-320 (`traiter_sujets`) | `relancer` et `fusionner` : `11)` dit `ÉCHEC DU CAPITAINE` (déjà là pour `fusionner`, à ajouter pour `relancer`), sans renvoi ; `5)` de `fusionner` reste `REPRISE`. |
| `suj/sujet.sh` | 83-96 (en-tête) | Sortie 11 élargie : « push refusé par le distant sans trace du hook pre-push (tout geste qui pousse), ou outil du capitaine en échec : aucun renvoi » ; sortie 5 de `fusionner` : aussi « GitHub illisible ». |
| idem | 341-347 (`ecrire_gel`), 468-473 (`ouvrir`), 529-533 (`mettre_a_jour_sous_pr`), 685-690 (`avancer_sujet`), 829-834 (`rafraichir`), 863-868 (`livrer`), 896-901 (`relancer`) | Chaque `pousser` : 3 garde son message de hook et sa sortie 3 ; 4 → sortie 11 (« push refusé par le distant, sans trace du hook : côté capitaine ou du distant, rien à corriger côté PR ») ; `rafraichir` annule d'abord la fusion, comme `abandonner`. |
| idem | `fusionner` (l. 703, 744-745 sur `main` ; l'attente du ticket 1) | `pr_json`, `checks_exiges`, `checks_commit` ou `attendre_ci` refusés → sortie 5, explicitement. |
| idem | 108 (fetch `--unshallow`), 501-507, 797-801, 885-887 (sorties de `git merge` relayées), et chaque `git fetch` qui n'est pas déjà muet | `git_masque` et `masquer_url`, comme dans `passer.sh` (Décision 10). |
| `suj/faux-gh.mjs` | 1-21, 64-91 | `pannes` (Décision 5), documentée dans l'en-tête. |
| `suj/faux-gh.test.mjs` | — | Un test pour `pannes`. |
| Bancs | voir « Ordre de travail » | `fus/github.test.mjs`, `fus/fusionner.test.mjs`, `fus/sujet-fusionner.test.mjs`, `fus/boucle-outils.test.mjs`. |
| Textes | voir « Les textes » | `fusionner/SKILL.md`, `fusionner/references/CONTENU.md`, `sujet/SKILL.md`, `sujet/references/CONTENU.md`. |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

**Ce que les tickets 1 et 8 auront changé** (à relire sur `main` avant de commencer) :

- ticket 1 : `ascendance` et `attendre_ci` dans `github.sh` ; dans `passer.sh`, les étapes 2 à 5 deviennent une boucle de trois tours au plus, donc **plusieurs** appels de `pousser` et d'`attendre_ci` ; dans `sujet.sh fusionner`, `mettre_a_jour_sous_pr` rend la main au lieu de sortir en 8, et chaque tour attend la CI ; la sortie 12 (`ARRÊT`) dans les trois scripts ; `faux-gh.mjs` apprend `strict`, les checks par commit, `pendantCi`, `avantFusion` ;
- ticket 8 : `verifier_echeance` dans `boucle.sh` (tête de tour, avant `passer`, avant `sujet.sh fusionner`) et la ligne `ÉCHÉANCE`. La pause de ce ticket se termine par un nouveau tour, donc repasse par ce contrôle.

Appelants réels :

- `passer.sh` : `boucle.sh` (`passer`), ou le capitaine à la main.
- `sujet.sh` : `boucle.sh` (`traiter_sujets`, `rafraichir_sujets`, `livrer-prets`), `file.sh` (`carte`, `gel`, `livre`), ou une session (`demarrer`, `carte <nom>`, `geler`).
- `file.sh` : `boucle.sh` (l. 225, 274, 347, 393), `veille.sh` (`etat_file`, qui saute déjà une sonde illisible : inchangé).
- `lire_github` : les fonctions de `github.sh` du tableau, `file.sh`, `passer.sh` (parente), `sujet.sh` (`fusionner`).

Aucune CLI nouvelle. `scripts/points-d-entree.test.mjs` ne change pas.

Règles à lire : `fusionner/SKILL.md` § « Boucle » (l. 40-66), l'en-tête de `fus/passer.sh` (l. 1-55) et celui de `suj/sujet.sh` (l. 83-99).

## Décisions

Tenues (spec et programme) : `A-42` (`masquer_url` d'Iroki entre ici, réécrit pour le plugin ; `pousser` rend 4 sur un échec non classé), `A-21` (une seule lecture, qui refuse le vide, le non-JSON et le `message`, sortie 5, la boucle en pause et jamais arrêtée par 5), `A-22` (trace de husky → 3 et renvoi avec la sortie du hook ; tout autre échec → 4, échec fermé ; chaque appel de `pousser`), `A-34`.

Précisions du ticket :

1. **`lire_github <route> [--paginate] [--absent <défaut>]`**, dans `github.sh` :
   - joue `gh api [--paginate] <route>` en gardant la sortie standard, la sortie d'erreur et le code ;
   - **refuse** (code 5, motif `GitHub illisible (<route>) : <cause>` sur la sortie d'erreur) : un code non nul, une sortie vide, une sortie qui n'est pas du JSON (`jq -e . >/dev/null` en échec ; un `--paginate` concatène des pages, chacune doit se lire), ou une page qui est un **objet** portant une clé `message` au premier niveau (le corps d'erreur de GitHub : `{"message": …, "documentation_url": …}`). Un tableau d'objets n'est jamais refusé pour un champ `message` imbriqué ;
   - `--absent <défaut>` : un refus dont la sortie d'erreur porte `(HTTP 404)` rend `<défaut>`, code 0. Seul `checks_exiges` s'en sert (protection absente) ;
   - rend la réponse brute sur la sortie standard ; le filtre `jq` reste chez l'appelant, sur une réponse déjà validée.
2. **Jamais `set -e` pour propager 5.** Une fonction appelée sous `||`, dans un `if` ou dans une substitution l'ignore (cas de `attendre_checks 30 || sortir 3`, `passer.sh:310`). Chaque appelant teste le code et sort en 5 lui-même.
3. **`pousser`** classe sur la sortie de **ce** push seulement (capturée, puis écrite sur la sortie d'erreur préfixée de la commande, comme `jouer_ou_dire`) : la trace est une ligne `^husky - pre-push script failed \(code [0-9]+\)$`, écrite par le `.husky/_/h` de husky 9 (`^9.1.7`, `socle-monorepo/references/racine/package.json:32`). Le contrôle « la branche a bougé » passe avant (inchangé, l. 110-112). Une trace présente donne 3, son absence 4, avec la ligne `push refusé par le distant (ou échec sans trace du hook pre-push) : sortie ci-dessus` sur la sortie d'erreur.
4. **Le renvoi d'un refus du pre-push**, dans la branche `3)` de la boucle, quand la sortie de `passer.sh` porte `push refusé par le hook pre-push` :
   - la cause passée à `renvoyer.sh` est « le pre-push refuse le push de la mise à jour avec develop. Sortie du hook : `<extrait>` » ;
   - l'extrait : les huit dernières lignes préfixées `[git push …]` qui précèdent ce message, préfixe retiré, accents graves retirés, jointes par ` ; `, coupées à 1 500 caractères ; elles ont déjà passé `masquer_url` (Décision 10), et la boucle les y repasse avant de commenter : le commentaire est public ;
   - renvoi en échec : la PR est sautée (`sautees`), comme pour les autres renvois.

   Une sortie de `passer.sh` qui porte `push refusé par le distant` tombe dans la branche finale : `ARRÊT`.
5. **`pannes` du faux GitHub** : une liste `{ route, fois, sortie, erreur, code }` (`route` une expression rationnelle sur le chemin, `sortie` ce que `gh` écrit sur la sortie standard, `erreur` sur la sortie d'erreur, défaut `gh: Bad Gateway (HTTP 502)`, `code` défaut 1). Une requête `GET` dont le chemin correspond à une panne restante y répond, puis décompte `fois` ; à zéro, la panne sort de l'état. Les écritures ne sont jamais en panne (le journal reste celui d'aujourd'hui).
6. **La pause** : `BOUCLE_PAUSE` secondes (défaut 120, comme la sonde de la veille), par `sleep` (le faux des bancs le rend immédiat), puis `continue` : le tour suivant relit l'arrêt, l'échéance du ticket 8 et les scripts de develop. Aucune limite au nombre de pauses : c'est la veille, bornée, qui finit.
7. **Le commentaire d'attente impossible** (`passer.sh:374-375`) sort en 3 au lieu de 5. Sans cela, la boucle, qui ne s'arrête plus sur 5, le repasserait à chaque tour ; la raison de l'arrêt (droits du compte du capitaine) demande un humain.
8. **Les messages lus par les bancs et la boucle** (à garder tels quels) : `GitHub illisible`, `PAUSE`, `push refusé par le hook pre-push`, `push refusé par le distant`, `ÉCHEC DU CAPITAINE`, et ceux du ticket 1 (`checks exigés rouges`, `CI non déclenchée`, `FUSIONNÉE : <sha>, arbre = arbre testé`).
10. **`masquer_url`** (`A-42`, réécrit d'Iroki `SPEC_ALL_SOC-4.52`, `scripts/chaine/github.sh:207-214` d'`origin/develop`, sans en copier la forme) :
    - `masquer_url` lit son entrée standard et remplace toute URL à identifiants, `scheme://<utilisateur[:jeton]>@hôte…`, par `scheme://***@hôte…` (`sed -E 's#://[^/@[:space:]]*@#://***@#g'`) ;
    - `jouer_ou_dire` masque la sortie qu'il relaie sur la sortie d'erreur ; `pousser` classe donc une sortie déjà masquée (la trace de husky n'a pas d'URL) ;
    - `git_masque <args>` joue `git <args>`, passe sa sortie d'erreur par `masquer_url`, et rend le code de git : les `git fetch` et `git push` de `passer.sh` et `sujet.sh` dont la sortie d'erreur n'est pas déjà jetée (`2>/dev/null`) passent par lui ; les sorties de `git merge` capturées puis relayées (`passer.sh:206`, `sujet.sh:507`, `:801`, `:887`) et le refus de fusion de GitHub (`passer.sh:367`) passent par `masquer_url` ;
    - rien n'est masqué de ce que git lit : seule la sortie relayée change.
11. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne de `lire_github` et de `pousser`, la façon de rassembler les lignes de `file.sh`, le découpage des bancs, et les autres lectures `gh api` directes de `sujet.sh` qui décident d'une écriture (chacune passe par `lire_github` si son repli actuel ouvre une garde ; elle les liste). Elle ne tranche **pas** : le code 5 pour toute lecture refusée, la pause sans arrêt, la trace de husky comme seule preuve d'un refus du hook, le renvoi avec l'extrait, l'arrêt sur un refus du distant, la sortie 3 du commentaire d'attente.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, tickets 1 et 8 fusionnés. Chaque banc est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Le faux GitHub en panne (`suj/faux-gh.mjs`), d'abord

`pannes` (Décision 5), et un test dans `suj/faux-gh.test.mjs` : une route en panne deux fois répond deux fois la panne (sortie vide, HTML, `{"message":"Server Error"}`), puis normalement ; une écriture n'est jamais en panne. `pnpm test` complet : tout reste vert.

### 2. Les bancs, chacun vu rouge

Dans `fus/github.test.mjs`, sur le modèle de `regenerer_index` (l. 1-37) :

1. « lire_github refuse une réponse vide, non JSON, porteuse de message ou à code non nul : sortie 5 ; un JSON valide passe ; --absent rend son défaut sur un 404 seulement » — le code non nul est celui d'un 502 : `pannes` à `code: 1`, `erreur: "gh: Bad Gateway (HTTP 502)"`, sortie standard vide puis HTML.
1 bis. « pousser rend 4 sur un push refusé sans trace de husky, 3 avec la trace, 5 quand la branche a bougé » — `pousser` joué par `source github.sh` sur le dépôt jouet : un hook `pre-receive` du dépôt nu qui refuse sans trace (4), un pre-push de banc qui écrit la trace (3), un push après un déplacement de la branche distante (5).
1 ter. « masquer_url : le jeton d'un hook distant est masqué dans ce que relaient jouer_ou_dire, pousser et git_masque, et le code de git est gardé » — sur le modèle de `scripts/chaine/github.test.mjs:217-234` d'Iroki : un `pre-receive` du dépôt nu écrit `refus : https://x:jeton-secret@exemple.test/regles` ; la sortie d'erreur porte `https://***@exemple.test/regles` et jamais `jeton-secret` ; un fetch réussi par `git_masque` ne dit rien et rend 0. **Rouge sur `main`** : le jeton paraît, et `git_masque` n'existe pas.
2. « checks_exiges : une panne n'est jamais « aucun check exigé » (sortie 5) ; des règles vides et une protection absente rendent [] ; une réponse qui n'est pas un tableau sort en 5 ».
3. « checks_commit : un corps vide ou une erreur sort en 5, jamais une liste vide ».

Dans `fus/fusionner.test.mjs`, titres à garder tels quels :

4. « passer.sh : une panne de GitHub pendant l'attente de la CI sort en 5, jamais « CI non déclenchée » » — `pannes` sur `commits/<sha>/check-runs`, corps vide, `fois` 31 au moins (`attendre_checks` lit 30 fois avant de conclure « CI non déclenchée », `passer.sh:298-310`) ; après le ticket 1, autant que l'attente d'`attendre_ci` en lit. **Rouge sur `main`** : sortie 3, `CI non déclenchée`.
5. « file.sh : GitHub illisible, sortie 5 et rien sur la sortie standard » — `pannes` sur `pulls`. **Rouge sur `main`** : sortie 1.
6. « un pre-push refusé avec la trace de husky : passer.sh sort en 3, la boucle renvoie la PR avec la sortie du hook et passe à la suivante » — le commentaire porte la ligne du hook et pas la trace d'une URL à identifiants (le hook en écrit une). **Rouge sur `main`** : `ARRÊT sur #<n> (sortie 3)`.
7. « un push refusé sans trace de husky : échec fermé, passer.sh en 3 « push refusé par le distant », la boucle s'arrête sans renvoyer ; sujet.sh en 11 » — pour `sujet.sh`, chacun des gestes de `GESTES` (l. 1191-1207) et `fusionner`. **Rouge sur `main`** : message et codes d'aujourd'hui.
8. « passer.sh : commentaire d'attente impossible à poser après un refus de fusion pour revue : sortie 3 (arrêt), pas 7 ; la boucle s'arrête sans le repasser » — c'est le test de la l. 1616, réécrit (il attendait 5 puis un second essai).

Dans `fus/boucle-outils.test.mjs`, sur des scripts de remplacement publiés sur le develop du jouet (modèle l. 18-55) :

9. « une sortie 5 de passer.sh met la boucle en pause, puis elle reprend : jamais d'ARRÊT » — `passer.sh` sort en 5 trois fois, puis 0 : la trace porte quatre passages, la sortie `PAUSE`, aucun `ARRÊT`. **Rouge sur `main`** : `ARRÊT sur #<n> (sortie 5)` au second.
10. « file.sh en 5 : PAUSE, puis la PR passe au tour suivant ; jamais FILE VIDE sur un échec » — le `file.sh` de remplacement compte ses appels : `traiter_rouges` (`--rouges`, l. 225) et `traiter_sujets` (l. 274) l'appellent avant la lecture de la l. 347 ; la panne porte sur l'appel **sans argument qui suit celui de `traiter_sujets`** dans le tour (le troisième du tour, ou le premier repéré par une trace des arguments), puis il annonce une PR. **Rouge sur `main`** : `FILE VIDE` au premier tour.

Dans `fus/sujet-fusionner.test.mjs` :

11. « sujet.sh fusionner : GitHub illisible pendant l'attente de la CI de la sous-PR : sortie 5 (REPRISE), aucun renvoi ».

Tests existants qui changent de fixture, chacun gardé et listé dans la PR :

- `fusionner.test.mjs:1032-1036` (`hooks`, `refuse`) : le hook de banc qui refuse écrit aussi `husky - pre-push script failed (code 1)`, comme un hook de husky 9. Les tests qui l'utilisent (l. 1067, 1153, 1219) gardent leur sens : un refus du hook sort en 3.
- `sujet-fusionner.test.mjs:714` : le pre-push du banc écrit la trace de husky, et le renvoi de la l. 726 garde son motif.
- `fusionner.test.mjs:1616` : voir le banc 8.
- Les bancs qui lisent « CI non déclenchée » sur un faux GitHub sans checks (aucune panne) gardent leur sens : une réponse valide vide n'est pas une panne.

### 3. Le code

`github.sh` (`lire_github`, puis les fonctions du tableau, puis `pousser`), `file.sh`, `passer.sh`, `sujet.sh`, `boucle.sh`. `bash -n` sur chacun.

### 4. Les textes

- `skills/chaine/fusionner/SKILL.md` :
  - l. 58 : la boucle ne s'arrête plus sur 5 ; elle se met en pause (`PAUSE`) et reprend ;
  - l. 60 : `PAUSE` dans le filtre du `Monitor` ; « La boucle traite seule les sorties 2 à 5 » : 5 en pause ; un refus du pre-push (trace de husky) renvoie la PR avec la sortie du hook ; un refus du distant (sans trace) arrête la boucle ; `sujet.sh` en 11 sur un refus du distant (`ÉCHEC DU CAPITAINE`, aucun renvoi) ;
  - l. 64 : « Si ce commentaire ne peut pas être posé, `passer.sh` sort en 3 : la boucle s'arrête (`ARRÊT`) ».
  - § « Appels GitHub : REST seulement » (l. 24-26) : une phrase : « Toute lecture qui décide d'un état passe par `lire_github` (`github.sh`) : une réponse vide, non JSON ou d'erreur est une panne, sortie 5, jamais un état. »
- `skills/chaine/fusionner/references/CONTENU.md` : § `github.sh` (l. 5 : `lire_github`, et pourquoi : un 502 lu comme une file vide ou « CI non déclenchée ») ; § `passer.sh`, § `boucle.sh` ; § « Les tests ».
- `skills/chaine/sujet/SKILL.md:34` : la sortie 11 élargie au refus du distant.
- `skills/chaine/sujet/references/CONTENU.md:15` : `pannes` du faux GitHub.

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici une correction, sans clé nouvelle : un patch ; une mineure si l'architecte juge que le sens nouveau des sorties 5 et 11 change le contrat des scripts. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Une panne de GitHub (réponse vide, non JSON, ou corps d'erreur) n'est plus lue comme un état : le script qui lisait sort en 5, et la boucle du capitaine se met en pause (`PAUSE`) puis reprend, sans jamais s'arrêter sur 5 ; une file illisible n'est plus une file vide. Un push refusé par le pre-push (trace de husky 9 `husky - pre-push script failed`) renvoie la PR à sa session avec la sortie du hook ; un refus sans cette trace (règle du dépôt, droit, coupure) arrête la boucle (`passer.sh`) ou sort en 11 (`sujet.sh`), sans renvoi. Un commentaire d'attente d'un propriétaire impossible à poser arrête la boucle en sortie 3. Toute sortie de git ou de hook relayée par les scripts du capitaine (journal, commentaire de PR) masque les URL à identifiants (`masquer_url`, `git_masque`).

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser` (`github.sh`, `passer.sh`, `boucle.sh`, `file.sh`, `sujet.sh`, `faux-gh.mjs` et leurs bancs). Aucune clé de contrat.
  3. Vérifier que `.husky/pre-push` est lancé par husky 9 (`.husky/_/h`, posé par `pnpm install`) : sans la trace de husky, un refus du hook se lit comme un refus du distant et arrête le capitaine.
  4. Relancer le capitaine une fois cette PR entrée dans develop : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

  **Iroki**, hors du plugin : ses scripts portent leur propre correctif de A4 (#633 : `pousser` en 3 ou 4 par `DERNIERE_SORTIE`, `scripts/chaine/github.sh:127-155` ; le renvoi de `boucle.sh:540-545` ; `passer.sh:254-262` ; le banc `boucle-pre-push-refuse.test.mjs`), que la repose remplace. Son masquage des URL à identifiants (`masquer_url`, `git_masque`, `SPEC_ALL_SOC-4.52`, `github.sh:207-214`) est désormais celui du plugin : la repose le garde ; rejouer son banc « SPEC_ALL_SOC-4.52 » contre le `github.sh` du plugin avant de retirer le sien.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Faux GitHub en panne | `skills/chaine/sujet/scripts/faux-gh.test.mjs`, test de `pannes` |
| `lire_github` : vide, non JSON, `message`, 502, 404 avec défaut ; `pousser` en 3, 4, 5 ; `masquer_url` et `git_masque` | `skills/chaine/fusionner/scripts/github.test.mjs`, bancs 1, 1 bis, 1 ter, 2 et 3 |
| `passer.sh` : panne pendant l'attente → 5 | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une panne de GitHub pendant l'attente de la CI sort en 5, jamais « CI non déclenchée » » |
| `file.sh` illisible → 5, rien sur la sortie standard | idem, « file.sh : GitHub illisible, sortie 5 et rien sur la sortie standard » |
| Refus du hook → renvoi avec l'extrait | idem, « un pre-push refusé avec la trace de husky : passer.sh sort en 3, la boucle renvoie la PR avec la sortie du hook et passe à la suivante » |
| Refus du distant → arrêt, `sujet.sh` en 11 | idem, « un push refusé sans trace de husky : échec fermé, passer.sh en 3 « push refusé par le distant », la boucle s'arrête sans renvoyer ; sujet.sh en 11 » |
| Commentaire d'attente impossible → 3 | idem, banc 8 (l. 1616 réécrit) |
| Boucle en pause sur 5, jamais arrêtée ; file illisible | `skills/chaine/fusionner/scripts/boucle-outils.test.mjs`, bancs 9 et 10 |
| `sujet.sh fusionner` : panne pendant l'attente → 5 | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, banc 11 |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/sujet/scripts/faux-gh.test.mjs skills/chaine/fusionner/scripts/github.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/boucle-outils.test.mjs` ;
   - `bash -n` sur chaque script touché.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli ; chaque fixture réécrite nommée dans la PR.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR : `jouer_ou_dire` ne passe plus par `masquer_url` (banc 1 ter) ; `git_masque` jette le code de git (banc 1 ter) ; `lire_github` accepte une sortie vide (bancs 1, 4) ; `lire_github` ne regarde plus `message` (banc 1) ; `pousser` rend 3 sans trace (banc 7) ; la boucle remet `*)` sur 5 (banc 9) ; `file.sh` écrit ses lignes avant la fin (banc 5) ; `attendre_ci` rend « en attente » sur une panne (banc 4).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` : les scripts du capitaine sont des chemins sensibles du gabarit (`scripts/chaine/**`), et ce ticket écrit sur une PR une sortie de hook ; son rendu va dans une section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): panne de GitHub en pause, refus du pre-push renvoyé à la session (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- **Lot 7 du chantier 1** : ce ticket absorbe `github.sh:216` (`checks_exiges` ne compare plus qu'un nombre validé, Décision 1 et tableau). Le ticket 7 ([`7-livrer-sans-label-et-fait-sur-sans-sigpipe.issue.md`](7-livrer-sans-label-et-fait-sur-sans-sigpipe.issue.md), écrit en parallèle) garde `sujet.sh livrer` et `fait_sur`, et renvoie `github.sh:216` ici (il cite une « Décision 3 » : c'est la Décision 1 et la ligne `checks_exiges` du tableau, avec le banc 2).
- Les lots 2 à 4 (conflit lu avant les checks, `fusionsSansEffet`, verrou du passage) : après ce ticket, un à la fois sur les mêmes fichiers.
- La veille (`veille.sh`) : elle saute déjà une sonde dont la lecture échoue (`etat_file`, l. 82-85) ; la boucle ne lui rend plus jamais 5.
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, après relecture de `github.sh`, `passer.sh`, `boucle.sh`, `file.sh`, `sujet.sh`, `faux-gh.mjs` et des bancs sur `4a45634`, et du correctif d'Iroki #633 (`ba743007`, `origin/develop` d'`iroki-monorepo`). Écarts avec la spec et choix à confirmer :
  - **Spec exacte** sur A3 et A4. Précision : la sortie 5 du commentaire d'attente impossible (`passer.sh:375`) arrêtait la boucle au second essai, par choix écrit (`fusionner/SKILL.md:64`) ; avec « 5 ne l'arrête plus jamais », elle passe en 3 (Décision 7), sinon la PR repasserait à chaque tour.
  - **Iroki #633 diverge** : chez lui, `passer.sh` sort en 3 dans les deux cas, et la boucle distingue par le message ; le ticket fait de même, `pousser` seul rend 4. La raison : la sortie 4 de `passer.sh` veut déjà dire « refus corrigeable par l'auteur, renvoyé » (`boucle.sh:383-386`), l'inverse d'un échec fermé.
  - **Un refus du hook n'est pas toujours la faute de la PR** : un environnement du capitaine cassé (la base absente d'Iroki) fait aussi échouer le pre-push, avec la trace de husky. Le ticket 8 (`preparerCapitaine`) réduit ce cas ; le renvoi reste celui que `A-22` décide.
  - **Fichiers chauds partagés avec le ticket 13** (`fusionner.test.mjs`, `sujet-fusionner.test.mjs`) : 13 est bloqué par le ticket 1 seulement ; l'architecte ordonne 9 et 13.
  - **`file.sh` et la boucle** : la spec ne nommait que la l. 347. `traiter_rouges` et `traiter_sujets` lisent aussi `file.sh` dans un tube ; une file illisible les laisse sans rien faire, ce qui est sûr, et le tour principal fait la pause.
- 2026-11-18 — Repris après une relecture neuve (« pas prêt », un bloquant) : `A-42` fait entrer `masquer_url` ici (Décision 10 : `jouer_ou_dire`, donc la sortie que classe `pousser`, et les sorties de git relayées par `passer.sh` et `sujet.sh`, par `git_masque`), avec le banc 1 ter sur le modèle de `github.test.mjs:217` d'Iroki et sa mutation ; la ligne du Hors périmètre est retirée et la note d'Iroki corrigée. Banc 10 : la panne porte sur l'appel de `file.sh` qui suit celui de `traiter_sujets` ; banc 4 : `fois` ≥ 31 ; banc 1 : le 502 nommé ; banc 1 bis : `pousser` testé directement (3, 4, 5).
- 2026-11-18 — Fait par la session du ticket, sur `origin/main` à `085d7d4` (plugin 7.20.0, 814 tests). Choix tranchés seule (Décision 11), par défaut prudent :
  - **Version 7.20.1 (patch)** : une correction, sans clé nouvelle (`README.md:186`). Le sens nouveau des sorties 5 (pause) et 11 (refus du distant) et la sortie 3 du commentaire d'attente vont à l'architecte s'il les juge un changement de contrat (mineure).
  - **`lire_github`** : `gh api` lancé avec `</dev/null`, sortie d'erreur dans un fichier temporaire ; le JSON se valide par `jq -s .` (chaque page d'un `--paginate`), le corps d'erreur par `jq -s 'any(.[]; type == "object" and has("message"))'` ; la cause écrite est la dernière ligne de la sortie d'erreur de `gh`, passée par `masquer_url`. Une option inconnue sort en 64.
  - **`checks_exiges`** : l'ancienne protection se lit par `lire_github --absent '{"contexts":[]}'` (la forme de la réponse de GitHub) plutôt que `'[]'`, puis son `contexts` doit être un tableau ; toute autre forme, des règles comme de la protection, sort en 5. `checks_commit` sort en 5 aussi sur une forme inattendue (champ absent), rien écrit avant que les deux lectures soient faites. `pr_sommet` sort en 5 sur un sommet qui n'est pas un sha de 40 caractères.
  - **`pousser`** : `jouer_ou_dire` garde la sortie masquée de la dernière commande dans `SORTIE_JOUEE`, que `pousser` classe (la sortie de CE push seulement) ; la trace se cherche en début de ligne (`^husky - pre-push script failed \(code [0-9]+\)$`) : une ligne `remote: husky - …` d'un hook distant ne la contrefait pas (banc 1 bis, cas ajouté).
  - **`file.sh`** : les lignes vont dans un fichier temporaire, écrit d'un coup à la fin (`case … esac <"$lignes"`). Le `while` tourne dans le shell du script, ses entrées lues d'une substitution de processus (`done < <(printf …)`) : chaque `exit 5` (checks d'un sommet, base d'une parente) sort du script lui-même, explicitement, jamais par `set -e` (Décision 2 ; bloquant de l'axe Ticket au premier tour, quand le `while` était encore dans un tube).
  - **`boucle.sh`** : la pause d'une file illisible s'écrit `PAUSE <hh:mm> (file.sh, sortie 5) : file illisible, reprise dans <s> s` ; un `BOUCLE_PAUSE` qui n'est pas un entier vaut 120. L'extrait du hook se coupe à 1 500 caractères par `node` (caractères, pas octets). Le message du second essai dit « a bougé ou GitHub illisible, second essai ».
  - **`sujet.sh`** : chaque `pousser` (`ecrire_gel`, `ouvrir`, `mettre_a_jour_sous_pr`, `avancer_sujet`, `rafraichir`, `livrer`, `relancer`) garde 3 pour la trace de husky et sort en 11 sinon, message « push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus » ; `rafraichir` annule la fusion avant de sortir en 11 ; `relancer` revient détaché sur `origin/develop`. `avancer_sujet` sortait déjà en 11 sur tout refus : il distingue maintenant les deux messages, en 11 tous deux.
  - **Autres lectures `gh api` directes de `sujet.sh`** (Décision 11), relues une à une : passent par `lire_github` celles dont le repli ouvrait une garde : `etat` (PR ouvertes et sous-PR fermées : appelée dans une substitution, `set -e` n'y jouait pas, un 502 donnait « sans sous-PR », d'où un sujet actif rafraîchi ou livré trop tôt), et `livrer_prets` (labels des sous-PR : jamais « sans `sujet-manuel` » ; état des sujets illisible : sortie 5). Restent telles quelles, leur repli étant déjà fermé : `regrouper` (`branches/<sujet>` : une panne mène à `ouvrir`, dont le push sur une branche existante sort en 4 ; `pulls/<n>` : sous `set -e`), `regrouper_series` (`existants` : sous `set -e` ; `vers_develop` vide : rien ne bouge), `livrer` (`pulls?base=` : une lecture ratée refuse en 4), `avancer_sujet` (`state` : sans lecture, rien n'est fermé), `series` (affichage), `clore` (déjà 11), `renvoyer.sh` (après le renvoi, pour l'affichage).
  - **Code d'Iroki** : non relu (la session n'a accès qu'à `maj-agency/skills`) ; `masquer_url`, `git_masque` et le classement de `pousser` sont écrits d'après le ticket (Décisions 3 et 10).
  - **Bancs** : ajoutés au-delà de la liste, « passer.sh : la PR illisible sort en 5 avant toute écriture » et « file.sh en échec hors 5 : ARRÊT, sortie 6, jamais FILE VIDE ». Banc 4 : `fois` 40. Banc 7 : les gestes de `GESTES` plus `fusionner`, et un pre-push sans husky (aucune trace) lu comme un refus du distant.
  - **Revue de ticket, premier tour** (corrections) : `carte_sujet` pousse par `git_masque` (Décision 10, bloquant de l'axe Ticket) ; une fusion refusée par GitHub ne sort plus en 5 que pour une branche bougée (409, « not up to date ») ou une panne (5xx, aucun code HTTP) : tout autre refus (403, 405 hors « not up to date », 422) sort en 3 et arrête la boucle (constat de l'axe Règles : sinon, pause sans fin, mise à jour et CI à chaque tour ; le ticket ne nommait pas ce cas, tranché ici par défaut prudent, échec fermé) ; la trace de husky se lit aussi en fin de ligne CRLF, et l'extrait du hook retire les `\r` (S19). `faux-gh.mjs` apprend `PR.refusFusion`.
  - **Sources du fournisseur** (T8), lues le 2026-11-18 :
    - husky v9.1.7, https://raw.githubusercontent.com/typicode/husky/v9.1.7/husky : `[ $c != 0 ] && echo "husky - $n script failed (code $c)"`, sur la sortie standard (`$n` le nom du hook) : la trace que lit `pousser`, en début de ligne, dans la sortie du push (stdout et stderr réunis).
    - GitHub CLI, https://github.com/cli/cli/blob/trunk/pkg/cmd/api/api.go : `fmt.Fprintf(opts.IO.ErrOut, "gh: %s\n", serverError)`, avec `"%s (HTTP %d)"` quand le corps porte un `message`, `"HTTP %d"` sinon : `lire_github --absent` et le classement du refus de fusion lisent `HTTP <code>` sous les deux formes.
    - Corps d'erreur de l'API REST (`{"message": …, "documentation_url": …}`) : docs.github.com n'est pas joignable depuis cette session ; la forme est celle que lit `gh` (`parseErrorResponse`, champ `Message`), et `lire_github` ne refuse qu'un objet portant `message` au premier niveau.
