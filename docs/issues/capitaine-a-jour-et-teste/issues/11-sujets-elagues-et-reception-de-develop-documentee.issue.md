# Les sujets supprimés du distant disparaissent des lectures, et la réception de develop dans un sujet a sa recette

Status: ready-for-agent
Type: défaut
Modèle: sonnet — un `--prune` limité à un refspec, une ligne d'avertissement, un message de refus réécrit et une section de skill tirée d'un paragraphe existant, sur le modèle du correctif d'Iroki et de ses bancs ; aucune conception.
Blocked by: 9 et 7 (`skills/chaine/sujet/scripts/sujet.sh` et `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` sont des fichiers chauds des deux, après le ticket 1 : partir de `main` après leur fusion). Le ticket 16 passe après celui-ci (`sujet.sh` partagé, `A-43`).
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/sujet-refs.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 11 (points A6 pour sa part documentaire, B7, B8 ; décision `A-23` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 6, 7 et 8. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**), puis les tickets 1, 8, 9 et 7 fusionnés. Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut, B7.** `carte` (`suj/sujet.sh:120-123`) rapatrie les sujets par `git fetch -q origin develop '+refs/heads/sujet/*:refs/remotes/origin/sujet/*'`, sans `--prune`. Un sujet supprimé du distant (livré, puis clos) garde sa ref `origin/sujet/<nom>` dans le clone : `etat` le montre encore ouvert, `carte` et `de` lisent encore ses tickets, `demarrer` cherche encore une spec sur lui (l. 394). Le fetch échoue en silence (`2>/dev/null || true`) : les refs locales sont alors lues sans que rien ne le dise. Iroki l'a corrigé (`SPEC_ALL_SOC-4.79`, #643, `2ed7be6f`, `scripts/chaine/sujet.sh:142-147` d'`origin/develop`) ; ses scripts ont divergé : le correctif se **réécrit** ici.

**Le défaut, B8 et A6.** Une réception de `develop` dans un sujet faite en plusieurs fusions successives est refusée (`suj/sujet.sh:609`, « une seule fusion de develop dans <base>, son premier commit, puis des retouches l'une après l'autre ; jamais une seconde fusion »), sans dire comment refaire. La recette et le corps attendu d'une PR de réception (« Retouches », section de revue quand une retouche touche du code) sont dans l'en-tête du script (l. 548-573) et dans un seul long paragraphe de `sujet/SKILL.md:34`, où personne ne les trouve.

**Quand le ticket est fait** (`A-23`) :

1. `carte` élague `origin/sujet/*` : `git fetch --prune`, limité au refspec des sujets, jamais `origin/develop` ni une autre ref distante.
2. Chaque commande qui lit `branches_sujet` (`carte`, `de`, `demarrer`, `etat`, `livrer-prets`) le fait après ce fetch, dans le même processus ; un fetch en échec se dit sur la sortie d'erreur, puis les refs locales sont lues comme aujourd'hui.
3. Le refus de `sujet.sh:609` donne la recette pour refaire la réception.
4. `sujet/SKILL.md` a une section « Recevoir develop dans un sujet » : la recette (partir du sujet à jour, en une seule fusion), et le corps type d'une PR de réception, avec « Retouches » et « Revue de ticket » quand il y a des retouches.
5. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Où

`suj/` abrège `skills/chaine/sujet/scripts/`. Lignes relues sur `4a45634` ; les tickets 1, 9 et 7 les auront décalées : se repérer aux fonctions nommées.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `suj/sujet.sh` | 112-123 (`branches_sujet`, `carte`) | `carte` : `git fetch -q --prune origin develop '+refs/heads/sujet/*:refs/remotes/origin/sujet/*'`. En échec : une ligne sur la sortie d'erreur (Décision 2), puis `carte_lue`. Le commentaire de la l. 112-117 dit l'élagage et qui le fait. |
| idem | 156-160 (`sujet_du_ticket`), 386-405 (`demarrer`), 1029-1035 (`etat`), 1084-1087 (`livrer_prets`), 1271 (`de`) | Inchangés si la relecture le confirme : chacun appelle `carte` (directement ou par `sujet_du_ticket`) avant de lire `branches_sujet`. Le banc de « Ordre de travail » le prouve commande par commande. |
| idem | 129-153 (`declarations_multiples`, `sujets_multiples_du_ticket`, `carte_lue`) | Inchangés : lus seulement après `carte` (commentaire de la l. 137, à garder vrai). |
| idem | 548-573 (en-tête « PR de mise à jour ») | Une ligne de renvoi à `sujet/SKILL.md` § « Recevoir develop dans un sujet » ; la recette du script reste la référence des gestes. |
| idem | 607-609 (`verifier_mise_a_jour`) | Le motif du refus donne la recette (Décision 3). |
| `suj/sujet-refs.test.mjs` | nouveau | Les bancs de l'élagage et du fetch, sur le modèle de `sujet-carte.test.mjs` (dépôt jouet de `depot-jouet.mjs`). |
| `fus/sujet-fusionner.test.mjs` (`skills/chaine/fusionner/scripts/`) | 638-651 | Le cas « deux fusions » lit aussi la recette dans le motif. |
| `skills/chaine/sujet/SKILL.md` | 13 (poser), 34 | l. 13 : `sujet-refs.test.mjs` dans la liste des bancs posés. l. 34 : la recette et les règles de la PR de mise à jour sortent du paragraphe vers la section nouvelle (Décision 4) ; le paragraphe y renvoie. |
| `skills/chaine/sujet/references/CONTENU.md` | § `sujet.sh`, § « Les tests » | L'élagage, le fetch dit en échec ; le banc nouveau. |
| `scripts/depot.test.mjs` | fin | Un test de texte (voir « Ordre de travail »), avec `exiger` (l. 751-755). |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

**Ce que les bloquants auront changé** (à relire sur `main` avant de commencer) :

- ticket 1 : `fusionner` met à jour et attend la CI d'une sous-PR en retard ; `mettre_a_jour_sous_pr` rend la main ; la PR de mise à jour garde son chemin (`verifier_mise_a_jour`, `avancer_sujet`), inchangé ;
- ticket 9 : chaque `pousser` de `sujet.sh` rend 11 sur un refus du distant ; `fusionner` sort en 5 sur une lecture GitHub refusée ;
- ticket 7 (lot 7, `A-15`) : `livrer` ne pose plus `à-fusionner` et, sans `gh`, écrit la PR dans un fichier avec un code dédié ; `fait_sur` lit tout le flux par `awk`. Aucun ne touche `carte`, `branches_sujet` ni `verifier_mise_a_jour`.

Appelants réels :

- `sujet.sh carte` : `file.sh:78` (`carte=$(bash "$SUJET" carte 2>/dev/null || true)`), à chaque lecture de la file.
- `sujet.sh etat` et `livrer-prets` : `boucle.sh` (`rafraichir_sujets`, fin de boucle ; `traiter_sujets`).
- `sujet.sh demarrer` et `de` : les sessions, et `chemins-sensibles.mjs` (`sujet.sh de`, `revue-adversariale/scripts/chemins-sensibles.mjs:124-128`).
- Le refus de `verifier_mise_a_jour` : `sujet.sh fusionner` d'une PR de mise à jour, lancé par `traiter_sujets` ; la boucle renvoie le motif par `refus.sh`.

Règles à lire : l'en-tête de `suj/sujet.sh` (l. 1-99 et 548-573), et `sujet/SKILL.md:34`.

## Décisions

Tenues (spec et programme) : `A-23` (élagage limité à `sujet/*`, fetch avant toute lecture de `branches_sujet`, recette dans le refus, réception documentée dans `sujet/SKILL.md` avec son corps type), `A-34`. Hors périmètre de `A-23`, gardé hors du plugin : la voie `chore/<nom>-recoit-develop` d'Iroki ; la branche du plugin reste `maj/<nom>` (en-tête de `sujet.sh`, l. 553-554).

Précisions du ticket :

1. **L'élagage** : `--prune` avec des refspecs explicites n'élague que les refs de destination de ces refspecs ; `develop`, sans destination, n'en a pas. Le banc vérifie que `origin/develop` et une ref distante hors `sujet/*` restent intactes après la suppression d'un sujet sur le distant.
2. **Fetch en échec** : `carte` écrit sur la sortie d'erreur `sujet.sh : fetch d'origin impossible : refs locales de develop et des sujets lues telles quelles (un sujet supprimé peut y paraître)`, puis lit les refs locales. Ce n'est pas un échec fermé : `file.sh` et `etat` doivent continuer de répondre hors réseau, comme aujourd'hui ; `file.sh` jette cette sortie d'erreur (`2>/dev/null`), une session la voit.
3. **Le refus de la l. 609**, motif sur une ligne pour `refus.sh`, qui ne garde que la dernière ligne (`refus.sh:17`) :

   > `#<n>, PR de mise à jour : une seule fusion de develop dans <base>, son premier commit, puis des retouches l'une après l'autre ; jamais une seconde fusion. Refaire la réception depuis le sujet à jour, en une seule fusion : git fetch origin develop <base> ; git switch -c maj/<nom>-2 origin/<base> ; git merge origin/develop (conflits résolus dans cette fusion) ; retouches en commits après elle ; nouvelle PR vers <base>, puis fermer celle-ci (skill sujet, « Recevoir develop dans un sujet »)`

   `<nom>` est le nom du sujet (`<base>` sans `sujet/`). Les autres motifs de `verifier_mise_a_jour` gardent leur texte ; celui du premier parent (l. 616-617, « la refaire depuis origin/<base> ») gagne le même renvoi au skill.
4. **La section « Recevoir develop dans un sujet »** de `sujet/SKILL.md`, après « Commandes » :
   - **quand** : `rafraichir` en conflit de code (`SUJET EN CONFLIT`) ou refusé sans conflit par un hook (`SUJET NON MIS À JOUR`) ; une session fille lancée pour ce geste, jamais le conducteur ni le capitaine ;
   - **la recette**, recopiée de l'en-tête de `sujet.sh` (l. 552-569), gestes et ordre inchangés, avec la règle en tête : partir du sujet à jour, une seule fusion, conflits résolus dans cette fusion, tout le reste en retouches après elle ;
   - **le corps type** de la PR, titrée `chore(sujet): met <nom> à jour avec develop` :

     ```markdown
     ## Réception de develop

     `origin/develop` (`<sha court>`) fusionné dans `sujet/<nom>` (`<sha court>`), en une seule fusion.
     Conflits résolus : `<fichier>` — <résolution> | aucun

     ## Retouches

     | Fichier | Raison |
     | ------- | ------ |
     | `<fichier>` | <ce que develop exige du sujet> |

     ## Revue de ticket

     <section de la revue de ticket>
     ```

     « Retouches » quand il y en a ; « Revue de ticket » dès qu'une résolution ou une retouche touche un chemin que `revue-exigee.mjs` (skill `fusionner`) exige, formatage compris. Une PR de réception sans conflit de code ni retouche de code n'en exige aucune ;
   - **ce que le capitaine vérifie** : la forme (une fusion, premier commit, parents), l'écart limité aux fichiers en conflit, chaque retouche jugée comme une sous-PR, et le motif renvoyé sinon ; la section « Retouches » n'est jamais lue pour dispenser.

   Le paragraphe de la l. 34 garde ses phrases sur les sorties de `fusionner`, et renvoie à la section pour le reste.
5. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le découpage des bancs, la place exacte de la section dans `SKILL.md`, la formulation du renvoi dans l'en-tête de `sujet.sh`. Elle ne tranche **pas** : l'élagage limité à `sujet/*`, la lecture locale dite (pas un échec fermé) sur un fetch en échec, la recette dans le motif sur une ligne, le corps type.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, tickets 1, 8, 9 et 7 fusionnés. Chaque banc est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Les bancs, chacun vu rouge

Dans `suj/sujet-refs.test.mjs`, un dépôt jouet avec deux sujets (`a`, `b`) et une branche distante hors `sujet/*` (`autre/x`), lus une première fois (`etat`), titres à garder tels quels :

1. « un sujet supprimé du distant disparaît de etat, carte et de ; les sujets ouverts restent » — `b` supprimé dans le dépôt nu ; `etat` ne montre plus `b` ; `carte` ne rend plus le ticket qui déclare `b` sur sa seule branche ; `de` du ticket de `b` ne rend plus `b`. **Rouge sur `main`**.
2. « l'élagage ne touche ni origin/develop ni une ref distante hors sujet/* » — non-régression, vert sur `main` et après.
3. « un sujet ouvert par un autre clone après la dernière lecture est vu par etat, carte et demarrer » — non-régression du fetch dans le même processus.
4. « fetch en échec : les refs locales sont lues, et la sortie d'erreur le dit » — `remote set-url origin` vers un chemin absent. **Rouge sur `main`** : rien n'est dit.

Dans `fus/sujet-fusionner.test.mjs`, le cas « deux fusions » (l. 650) lit aussi `git switch -c maj/lot-2 origin/sujet/lot` et `en une seule fusion` dans le motif, et la dernière ligne de la sortie porte la recette entière (ce que `refus.sh` renvoie). **Rouge sur `main`**.

Dans `scripts/depot.test.mjs`, un test : « sujet/SKILL.md a la section Recevoir develop dans un sujet, avec son corps type » — la section existe, porte « une seule fusion », et le corps type porte `## Réception de develop`, `## Retouches` et `## Revue de ticket` dans un bloc de code. **Rouge sur `main`**.

### 2. Le code et les textes

`sujet.sh` (`carte`, motif de la l. 609 et renvoi de la l. 616-617, en-tête), puis `sujet/SKILL.md` et `sujet/references/CONTENU.md`. `bash -n` sur `sujet.sh`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici une correction et un texte : un patch. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  `sujet.sh` élague les refs `origin/sujet/*` d'un sujet supprimé du distant (`git fetch --prune` limité aux sujets) : `etat`, `carte`, `de`, `demarrer` et `livrer-prets` ne le lisent plus ; un fetch en échec se dit. Le refus d'une PR de mise à jour faite en plusieurs fusions donne la recette pour la refaire, et `sujet/SKILL.md` a une section « Recevoir develop dans un sujet » (recette, corps type de la PR avec « Retouches » et « Revue de ticket »).

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:sujet poser` (`sujet.sh`, `sujet-refs.test.mjs`). Aucune clé de contrat.
  3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend `sujet.sh` de develop au tour suivant ; la veille, elle, appelle `file.sh` de sa copie : nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée.

  **Iroki**, hors du plugin : son correctif #643 (`scripts/chaine/sujet.sh:142-147`, banc `sujet-refs-elaguees.test.mjs`) est remplacé par la repose. Sa voie de réception `chore/<nom>-recoit-develop` reste la sienne : la recette du plugin nomme `maj/<nom>`.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Sujet supprimé du distant élagué | `skills/chaine/sujet/scripts/sujet-refs.test.mjs` « un sujet supprimé du distant disparaît de etat, carte et de ; les sujets ouverts restent » |
| Élagage limité à `sujet/*` | idem, « l'élagage ne touche ni origin/develop ni une ref distante hors sujet/* » |
| Fetch avant lecture, dans chaque commande | idem, « un sujet ouvert par un autre clone après la dernière lecture est vu par etat, carte et demarrer » |
| Fetch en échec dit | idem, « fetch en échec : les refs locales sont lues, et la sortie d'erreur le dit » |
| Recette dans le refus de la l. 609 | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, cas « deux fusions » (l. 650) |
| Section de `sujet/SKILL.md` | `scripts/depot.test.mjs`, test ajouté |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée : `node --test skills/chaine/sujet/scripts/sujet-refs.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs scripts/depot.test.mjs` ; `bash -n skills/chaine/sujet/scripts/sujet.sh`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, jouées sur une copie jetable, vues rouges, puis annulées, listées dans la PR : `--prune` retiré (banc 1) ; le refspec des sujets remplacé par un `fetch --prune origin` entier (banc 2 : `autre/x` disparaît) ; la ligne d'avertissement retirée (banc 4).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` : `sujet.sh` est un chemin sensible du gabarit (`scripts/chaine/**`) ; son rendu va dans une section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): sujets supprimés élagués, réception de develop dans un sujet documentée (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Le check `pr-titre` et sa lecture de la PR de réception : ticket 16.
- La voie `chore/<nom>-recoit-develop` d'Iroki, ses noms de branche.
- `sujet.sh livrer` et `fait_sur` : lot 7.
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, après relecture de `sujet.sh`, `sujet/SKILL.md`, `refus.sh` et des bancs sur `4a45634`, et du correctif d'Iroki #643 (`2ed7be6f`). Écarts avec la spec et choix à confirmer :
  - **« Refs locales lues sans fetch (l. 119, 129, 144-154, 394) »** : dans le plugin, chacune de ces lectures suit déjà, dans le même processus, le fetch de `carte` (`sujet_du_ticket` → `carte` pour `demarrer`, l. 158 ; `etat`, l. 1031 ; `livrer_prets`, l. 1087 ; `declarations_multiples` et `carte_lue` ne sont appelées qu'après lui). Le constat vaut pour les scripts d'Iroki, qui ont divergé. Il reste deux trous : pas d'élagage, et un fetch en échec muet ; le ticket les ferme, et le banc 3 garde l'ordre « fetch, puis lecture » commande par commande.
  - **A6, « la règle n'est écrite que dans l'en-tête du script »** : elle est aussi dans `sujet/SKILL.md:34`, mais au milieu d'un paragraphe de 600 mots, sans corps type. Le ticket la sort dans une section.
  - **Fichiers chauds partagés avec le ticket 16**, qui ajoute à `sujet.sh` une commande `a-juger` : tranché (`A-43`), le 16 passe après celui-ci.
- 2026-11-18 — Retouché après relecture (`A-43`) : le ticket 16 passe après celui-ci.
