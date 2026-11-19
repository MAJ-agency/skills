# Une PR en conflit ne bloque plus en silence : `relancer` résout un conflit d'index, `file.sh` dit « en conflit »

Status: Fait — PR #128
Type: défaut
Modèle: opus — le ticket s'appuie sur `ascendance` et `mettre_a_jour_sous_pr` tels que le ticket 1 les aura laissés, dont la forme exacte ne se lit qu'au lancement ; il change un état de `file.sh` que lisent la boucle et la veille, et une erreur laisse une sous-PR sans CI ni renvoi.
Blocked by: 1 (`ascendance` et la nouvelle `mettre_a_jour_sous_pr` ; `sujet.sh`, `faux-gh.mjs` et les bancs sont des fichiers chauds du ticket 1 : partir de `main` après sa fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/sujet/scripts/faux-gh.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/sujet/SKILL.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 2 (décision `A-7`, défaut 1). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`P-1`, `A-17`, `A-18`). Ticket 1 : [`1-regle-d-ascendance-avant-chaque-fusion.issue.md`](1-regle-d-ascendance-avant-chaque-fusion.issue.md), dont le « Hors périmètre » laisse à ce ticket `relancer` et l'état « en conflit » de `file.sh`. Base : `origin/main` après la fusion du ticket 1 (plugin **7.16.0** visé par lui ; `4a45634` en 7.15.0, **738 tests**, avant lui). Faits relus à la source sur `4a45634` le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu le 2026-11-18 sur `fedora`** (défaut 1 de la demande) : une heure perdue sur #1969. Une sous-PR en conflit avec son sujet n'a pas de CI : GitHub ne lance pas les workflows `pull_request` d'une PR qu'il ne sait pas fusionner. Alors :

- `file.sh` la montre « `sujet/<nom> : prête (sans CI)` » (`file.sh:113`), comme une PR dont le push s'est perdu ;
- la boucle lui joue `sujet.sh relancer` (`boucle.sh:296-303`), qui s'arrête sur **tout** conflit (`sujet.sh:885-892`, sortie 2) ;
- la boucle la renvoie alors avec « conflit avec `sujet/<nom>` », même quand le conflit ne porte que sur un index généré, qu'aucune session ne doit résoudre à la main ;
- `sujet.sh fusionner`, lui, lisait les checks avant le conflit et sortait en 5 sans fin : **le ticket 1 l'a déjà corrigé** (sa Décision 4 lit `ascendance` avant les checks).

**Quand le ticket est fait** :

1. `sujet.sh relancer` lit le verdict d'`ascendance` (ticket 1) avant toute fusion. Un conflit limité aux index générés suit le chemin de mise à jour du ticket 1 (`mettre_a_jour_sous_pr`) : fusion du sujet, index régénérés, commit, push, CI lancée, sortie 0. Un conflit hors index sort en 2 avec la liste des fichiers.
2. `file.sh` montre « `prête (en conflit)` » (ou « `sujet/<nom> : prête (en conflit)` ») une PR sans CI que GitHub dit en conflit avec sa base, au lieu de « `prête (sans CI)` ».
3. La boucle joue `relancer` sur une sous-PR « `prête (en conflit)` » comme sur une sous-PR « `prête (sans CI)` », et son renvoi nomme les fichiers en conflit.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`. Lignes relues sur `4a45634` ; le ticket 1 déplace `sujet.sh` et `faux-gh.mjs` : retrouver chaque endroit par sa fonction ou son motif.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `suj/sujet.sh` | 35-36 (en-tête, `relancer`) | « fusionne son sujet dans sa branche et pousse » devient : verdict d'`ascendance` d'abord ; conflit limité aux index générés mis à jour comme par `fusionner` (index régénérés, poussé, CI lancée) ; conflit hors index : sortie 2, fichiers listés. |
| `suj/sujet.sh` | 83-96 (en-tête, sorties) | Ajouter à la liste : `relancer` sort en 11 si `ascendance` ne peut pas conclure (côté capitaine, aucun renvoi). |
| `suj/sujet.sh` | 875-903 (`relancer`) | Corps réécrit (Décision 1). Ce qui reste : la lecture de la PR (l. 877-879), le refus d'une base hors `sujet/` (l. 880), `refuser_tete_gardee` (l. 881), l'arbre propre (l. 882, sortie 6), le message final (l. 902). Ce qui part : la fusion locale (l. 884-893) et le push (l. 896-901), remplacés par `ascendance` puis `mettre_a_jour_sous_pr`. |
| `suj/sujet.sh` | `mettre_a_jour_sous_pr` (l. 497-537 sur `4a45634` ; l. 504 sur la PR 115 du ticket 1, `2fdeb77`) | **Réutilisée telle que le ticket 1 la laisse**, avec ses **quatre** arguments `n base tete juge` (PR 115, l. 505) : elle relit la tête de la sous-PR et sort en 5 si elle n'est plus le sommet jugé (`juge`), fusionne `origin/<base>` dans `capitaine/<n>`, prend la version du sujet des index en conflit (`git checkout --theirs`) puis régénère, committe, pousse, pose `SOMMET_POUSSE` et rend la main. Ses sorties propres : 3 (hook, conflit hors index, push refusé), 5 (la sous-PR a bougé, avant ou au push), 6 (arbre sale). Aucune modification ici. |
| `fus/github.sh` | `ascendance <testé> <cible>` (ticket 1, après `index_generes_regex`, l. 122-125) | **Réutilisée, non modifiée** : verdict en ligne 1 (`à-jour`, `retard`, `conflit-index`, `conflit`), puis les fichiers en conflit un par ligne ; sortie 1 si elle ne peut pas conclure. |
| `fus/file.sh` | 7-48 (en-tête, états) | Un état de plus, sous « prête (sans CI) » : « `prête (en conflit)` : aucun check exigé sur le sommet, et GitHub dit la PR en conflit avec sa base (`mergeable_state` `dirty`) ; présentée à `passer.sh` (vers develop) ou à `sujet.sh relancer` (vers un sujet), qui résolvent un conflit d'index et renvoient tout autre conflit ». La ligne 39 (« Sans CI : `sujet.sh relancer` ») ajoute « ou en conflit ». |
| `fus/file.sh` | 108-117 (`ci_de`) | Sur `'sans CI'` (l. 113) : une lecture `pr_json "$n"` ; `mergeable_state` égal à `dirty` donne `prête (en conflit)`, sinon `prête (sans CI)` comme aujourd'hui. Lecture en échec : `prête (sans CI)`. Modèle : Iroki, `scripts/chaine/file.sh:155` sur `develop` (`pr_json "$n" 2>/dev/null \| jq -r '.mergeable_state // ""'`). |
| `fus/boucle.sh` | 25-35 (en-tête) | Une sous-PR « prête (en conflit) » passe par `relancer` : conflit d'index mis à jour et poussé, CI relancée ; conflit hors index renvoyé avec ses fichiers. |
| `fus/boucle.sh` | 296-303 (`traiter_sujets`, cas `relancer`) | Motif du `case` : `sujet/*': prête (sans CI)' \| sujet/*': prête (en conflit)')`. Sortie 2 : le renvoi lit les fichiers dans `$sortie` comme la l. 368 le fait pour `passer.sh` (`conflit avec <base> hors index générés :` puis les fichiers indentés de deux espaces), motif « conflit avec `<base>` hors index générés : `a`, `b`. Fusionner `<base>` dans la branche et le résoudre ». Sortie 11 : `[#<n>] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file (aucun renvoi), cause ci-dessus`, comme la l. 318. |
| `fus/boucle.sh` | 347 | **Inchangée** : « `prête (en conflit)` » vers develop commence par « prête », la boucle la donne à `passer.sh`, qui la met à jour (index) ou sort en 2 (renvoi), comme aujourd'hui pour « prête (sans CI) ». |
| `fus/veille.sh` | 63-71 (`etat_file`) | **Inchangée** : « prête (en conflit) » se lit `prête`. |
| `suj/faux-gh.mjs` | 114-128 (`versRest`), 180-184 (route `pulls/<n>`) | Le faux rend `mergeable_state` sur la **seule** lecture d'une PR (`GET pulls/<n>`), jamais dans la liste (comme GitHub) : `dirty` si `git merge-tree --write-tree <base> <tête>` sort en 1 dans le dépôt nu (le ticket 1 y calcule déjà l'arbre de la fusion : réutiliser son aide), `clean` sinon. Clé de PR `mergeableState` (dont `null`, `"unknown"`) qui prime, pour l'état que GitHub n'a pas encore calculé. Documentée dans l'en-tête (l. 4-21). |
| `suj/faux-gh.test.mjs` | — | Un test pour `mergeable_state`. |
| `skills/chaine/fusionner/SKILL.md` | 60 sur `4a45634`, 78 sur la PR 115 (le paragraphe de la boucle) | Après « Une sous-PR en conflit avec son sujet sur des index générés seuls n'est pas renvoyée » (réécrite par le ticket 1) : « Une sous-PR sans CI que GitHub dit en conflit se lit `prête (en conflit)` : `sujet.sh relancer` la met à jour si le conflit ne porte que sur des index générés (CI relancée), sinon elle est renvoyée avec ses fichiers. » |
| `skills/chaine/fusionner/references/CONTENU.md` | 13 (§ `file.sh`), 21 (§ `boucle.sh`), 51 (§ « Les tests ») | L'état « prête (en conflit) » et sa raison (GitHub ne lance pas la CI d'une PR en conflit : lire les checks d'abord tournait en rond) ; `relancer` sur conflit d'index ; les bancs. |
| `skills/chaine/sujet/SKILL.md` | 34 | `relancer` : sortie 2 sur un conflit hors index (fichiers listés), sortie 11 si le contrôle d'ascendance est illisible ; un conflit d'index est mis à jour et poussé. |
| Version | voir « 3. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

Appelants réels :

- `sujet.sh relancer` est lancé par `traiter_sujets` (`boucle.sh:296-303`), et à la main par une session propriétaire (`fusionner/SKILL.md:93`, « CI en cours sans job en cours »).
- `file.sh` est lu par `boucle.sh` (l. 225, 274, 347, 393), par `veille.sh` (`etat_file`, l. 66) et à la main.
- `ascendance` et `mettre_a_jour_sous_pr` sont aussi appelées par `sujet.sh fusionner` et `passer.sh` (ticket 1) : ce ticket ne les modifie pas.

Règles à lire : l'en-tête de `suj/sujet.sh` (l. 1-99) et l'en-tête de `fus/file.sh` (l. 1-53).

## Décisions

Tenues : `A-7` (le conflit se lit avant les checks ; un conflit d'index suit le chemin de mise à jour ; tout autre conflit est renvoyé ; `file.sh` dit « en conflit »), `A-1` (une seule fonction d'ascendance, celle du ticket 1), `P-1` (conflit hors index renvoyé, jamais résolu).

1. **`relancer`, nouveau corps**, après les gardes qui restent (base, tête gardée, arbre propre) :
   - en tête de la fonction, avec `base` et `tete`, le sommet jugé : `sommet=$(jq -r .head.sha <<<"$pr")` ;
   - `git fetch -q origin "$base" "$tete"`, puis `ascendance "$sommet" "origin/$base"` : le verdict porte sur le sommet lu avec la PR, pas sur la branche, qui a pu bouger depuis ;
   - `à-jour` : sortie 3, le message d'aujourd'hui (« `#<n> contient déjà <base> : aucun commit à pousser, CI non déclenchable` », l. 895) ;
   - `conflit` : la ligne `conflit avec <base> hors index générés :`, puis chaque fichier indenté de deux espaces, puis sortie 2. La branche n'est pas touchée (aucune fusion locale) ;
   - `retard` ou `conflit-index` : `mettre_a_jour_sous_pr "$n" "$base" "$tete" "$sommet"`, puis `#<n> : <base> fusionné dans sa branche (<sha court de SOMMET_POUSSE>), CI lancée`, sortie 0. Ses sorties 3, 5 et 6 remontent telles quelles ; la 5 (« la sous-PR #<n> a bougé depuis sa lecture », ou au push) est la course avec un push de la session : rien n'est poussé, la boucle la reprend au tour suivant ;
   - `ascendance` en sortie 1 : sortie 11, « contrôle d'ascendance illisible : sous-PR laissée dans la file, rien à corriger côté PR ».
   - Raison : une seule copie de la règle de mise à jour, celle du ticket 1. Conséquence assumée : une fusion propre régénère désormais les index, comme `fusionner`, avant de pousser.
2. **`file.sh` : l'état « `prête (en conflit)` »**, et non « en conflit » seul.
   - Il garde le préfixe « prête » : la PR est prête pour le capitaine, dont le passage résout un conflit d'index ou renvoie. Sans ce préfixe, `boucle.sh:347`, `file.sh --next` (l. 182) et `veille.sh` (l. 70) ne la verraient plus, et une PR vers develop en conflit, que `passer.sh` traite aujourd'hui, resterait dans la file sans personne.
   - Seul un état « sans CI » est relu. Une PR dont des checks ont déjà tourné garde leur verdict : `passer.sh` et `sujet.sh fusionner` (ticket 1) lisent l'ascendance avant de fusionner.
   - `mergeable_state` se lit par `GET pulls/<n>`, seule réponse qui le porte ; `null` ou `unknown` (GitHub calcule encore) laissent « prête (sans CI) ».
3. **Codes inchangés pour la boucle**, sauf 11 sur `relancer`, qui ne renvoie rien. La sortie 3 de `relancer` reste silencieuse dans le `case` de la boucle, **et c'est voulu** : elle couvre « rien à pousser », un hook qui refuse, et la course où `mettre_a_jour_sous_pr` trouve un conflit hors index que `ascendance` n'avait pas vu (le sujet a bougé entre les deux, sortie 3 « conflit … : renvoi »). Dans ce dernier cas, la sous-PR reste « prête (en conflit) » : au tour suivant, `relancer` relit `ascendance`, qui rend `conflit`, et la boucle la renvoie avec ses fichiers (sortie 2). Un renvoi sur la sortie 3 renverrait aussi « rien à pousser », qui n'est pas la faute de la session.
4. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le nom des variables, la forme du message de renvoi tant qu'il nomme les fichiers. Elle ne tranche **pas** : le préfixe « prête », la lecture d'`ascendance` avant toute fusion, l'absence de résolution d'un conflit hors index.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 1 fusionné. Chaque banc est vu rouge avant le code qui le rend vert ; « rouge sur `main` » veut dire : avec le faux de l'étape 1, sans le code de l'étape 3.

### 1. Le faux GitHub

`mergeable_state` sur `GET pulls/<n>` (Où). Test dans `suj/faux-gh.test.mjs` : une PR en conflit avec sa base rend `dirty`, une PR sans conflit `clean`, `mergeableState: null` rend `null` ; la liste `GET pulls` ne porte pas la clé. Puis `pnpm test` complet : tout reste vert.

### 2. Les bancs, chacun vu rouge

Dans `fus/sujet-fusionner.test.mjs` :

1. **« relancer : conflit sur un index généré seul, la branche est mise à jour, index régénéré, poussée, sortie 0 »**. Fixture : celle du test « fusionner : conflit sur un index généré seul » (l. 68), PR 80 sans checks. Attendu : sortie 0, la branche de la sous-PR avance d'un commit de fusion (premier parent l'ancien sommet), l'index porte la version régénérée, aucun `PUT`. **Rouge sur `main`** : sortie 2.
2. **« relancer : conflit hors index, sortie 2, fichiers listés, branche intacte »**. Fixture de la l. 89. Attendu : sortie 2, la ligne `conflit avec sujet/<nom> hors index générés :` puis le fichier, la branche distante inchangée. **Rouge sur `main`** : la liste des fichiers manque.

Dans `fus/fusionner.test.mjs` :

3. **« file.sh : une PR sans CI que GitHub dit en conflit se lit prête (en conflit), vers develop comme vers un sujet ; état inconnu : prête (sans CI) »**. **Rouge sur `main`** : « prête (sans CI) ».
4. **« boucle.sh : une sous-PR prête (en conflit) sur un index seul est mise à jour par relancer, jamais renvoyée ; en conflit de code, renvoyée avec ses fichiers »**. Attendu : pour l'index, aucun commentaire de renvoi, `à-fusionner` gardé, la branche poussée ; pour le code, un commentaire marqué `<!-- renvoi-capitaine -->` qui nomme le fichier. **Rouge sur `main`** : la sous-PR d'index est renvoyée, et le renvoi de code ne nomme aucun fichier.

Tests existants qui restent verts sans changer de sens : `fusionner.test.mjs:520` et `:539` (tête gardée, sortie 4), `:1209` et la suite (pre-push réveillé et refusant, cas `relancer` de `GESTES`, l. 1201-1205 : le sujet y est en retard sans conflit, `relancer` passe par `mettre_a_jour_sous_pr` et pousse sous les hooks). Si l'un rougit, le nommer dans la PR avant d'y toucher.

### 3. Le code

`sujet.sh` (`relancer`, en-tête), puis `file.sh`, puis `boucle.sh`. Commits sous les hooks, jamais `--no-verify`.

### 4. Les textes

Ceux du tableau « Où » : `fusionner/SKILL.md:60`, `fusionner/references/CONTENU.md`, `sujet/SKILL.md:34`, les en-têtes de `file.sh`, `boucle.sh` et `sujet.sh`.

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, un état nouveau de `file.sh` et une sortie nouvelle de `relancer` : une mineure, comme le ticket 1 pour ses sorties nouvelles. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Une PR sans CI que GitHub dit en conflit se lit « prête (en conflit) » dans la file du capitaine, au lieu de « prête (sans CI) ». Une sous-PR dans cet état passe par `sujet.sh relancer`, qui lit désormais la règle d'ascendance avant toute fusion : un conflit limité aux index générés est mis à jour (index régénérés, poussé, CI relancée), tout autre conflit est renvoyé à sa session avec la liste des fichiers.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
  3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille et son `file.sh` tournent sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).

  **Iroki** : son `file.sh` signale déjà ce cas par une note au titre (« [conflit avec la base, aucun check : mise à jour par le passage] », `file.sh:18-23` et `:155`), et son `relancer` résout déjà un conflit d'index (SPEC_ALL_SOC-4.28, SPEC_ALL_SOC-4.41), avec d'autres codes (6 outillage, 8 index régénérés, 9 push refusé). Reposer remplace ses deux scripts par ceux du plugin et perd ses ajouts locaux (`file.sh` diffère de 231 lignes, `sujet.sh` de 1 820) : son conducteur reporte ce changement à la main, ou repose puis reporte ses ajouts, et rejoue ses bancs propres (`file-mobile-e2e.test.mjs`, `file-ticket-titre.test.mjs`).
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Faux GitHub : `mergeable_state` sur la lecture d'une PR | `skills/chaine/sujet/scripts/faux-gh.test.mjs`, un test |
| `relancer` : conflit d'index mis à jour et poussé | `sujet-fusionner.test.mjs` « relancer : conflit sur un index généré seul, la branche est mise à jour, index régénéré, poussée, sortie 0 » |
| `relancer` : conflit hors index, fichiers listés | `sujet-fusionner.test.mjs` « relancer : conflit hors index, sortie 2, fichiers listés, branche intacte » |
| `file.sh` : « prête (en conflit) », état inconnu | `fusionner.test.mjs` « file.sh : une PR sans CI que GitHub dit en conflit se lit prête (en conflit), vers develop comme vers un sujet ; état inconnu : prête (sans CI) » |
| `boucle.sh` : routage et renvoi avec fichiers | `fusionner.test.mjs` « boucle.sh : une sous-PR prête (en conflit) sur un index seul est mise à jour par relancer, jamais renvoyée ; en conflit de code, renvoyée avec ses fichiers » |
| `relancer` sous les hooks | `fusionner.test.mjs:1209` et suivant (inchangés) |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/sujet/scripts/faux-gh.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs` ;
   - `node --test scripts/poses.test.mjs` ;
   - `bash -n` sur chaque script touché.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - `relancer` sort en 2 sur `conflit-index` : le banc 1 rougit ;
   - `ci_de` ne lit plus `mergeable_state` : le banc 3 rougit ;
   - le `case` de `traiter_sujets` ne connaît plus « prête (en conflit) » : le banc 4 rougit.
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` (scripts du capitaine : chemins sensibles du gabarit, `scripts/chaine/**`), section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): une PR en conflit se dit en conflit, relancer résout un conflit d'index (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- La part d'`A-7` qui concerne `sujet.sh fusionner` : faite par le ticket 1 (sa Décision 4).
- `passer.sh` : il traite déjà une PR en conflit vers develop (mise à jour, index, ou sortie 2) ; seul son affichage dans la file change.
- Un état « en conflit » pour une PR dont des checks ont tourné : son passage lit l'ascendance (ticket 1).
- Le refus du pre-push classé par la trace de husky (`A-22`) : ticket 9.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, et sur `develop` d'Iroki (`e3dbd235`). Écarts avec la spec :
  - **L'état est « prête (en conflit) »**, pas « en conflit » seul comme le dit `A-7`. Sans le préfixe, trois lecteurs de la file (`boucle.sh:347`, `file.sh --next`, `veille.sh:70`) ne verraient plus une PR vers develop en conflit, que `passer.sh` traite aujourd'hui. Le mot « en conflit » s'affiche comme `A-7` le veut. À confirmer à la contre-relecture.
  - **Lecture de `mergeable_state`** (`dirty`), et non de `mergeable` : c'est le champ qu'Iroki lit en production (`file.sh:155`), et il distingue le conflit d'un retard (`behind`).
  - **Seul un état « sans CI » est relu** : `A-7` ne le dit pas. Relire chaque PR à chaque sonde coûterait une lecture GitHub par PR toutes les deux minutes, pour une information que le passage relit de toute façon.
  - **Sortie 11 de `relancer`** si `ascendance` ne conclut pas : ce code n'existait que pour `fusionner` et `clore` ; il suit la Décision 1 du ticket 1.
  - **Recouvrement avec le chantier 2** : sa spec (`remontees-iroki.spec.md`, « Les tickets, dans l'ordre ») place les lots 2 à 4 et 7 après le ticket 9, qui partage `boucle.sh`, `file.sh` et `sujet.sh`. Le `Blocked by: 1` dit la dépendance de contenu ; l'ordre de lancement suit `A-18`, un ticket à la fois sur ces fichiers.
- 2026-11-18 — Repris après une relecture neuve (« pas prêt »), décision de l'architecte : sur la PR 115 du ticket 1, `mettre_a_jour_sous_pr` prend quatre arguments (`n base tete juge`) ; `relancer` lit le sommet avec la PR, juge l'ascendance de ce sommet et le passe en quatrième argument, et la sortie 5 « bougé » remonte. Ancre de `fusionner/SKILL.md` à la l. 78 de la PR 115 ; sortie 3 de course non traitée par la boucle, voulue (Décision 3).
- 2026-11-19 — Fait par la session du ticket, sur `origin/main` `9a912d3` (plugin 7.25.0, tickets 1, 7, 8 et 9 fusionnés). Choix tranchés, par défaut prudent :
  - **Sous-PR qui a bougé depuis sa lecture : sortie 5 avant `ascendance`.** Après le fetch, `relancer` compare `origin/<tête>` au sommet lu avec la PR ; s'ils diffèrent, rien n'est jugé ni poussé (« a bougé depuis sa lecture », reprise au tour suivant). Sans ce garde, un sommet jamais récupéré rendait `ascendance` illisible (sortie 11, lue comme un échec du capitaine), et un `conflit` jugé sur un sommet périmé aurait renvoyé une session qui venait peut-être de le résoudre. `mettre_a_jour_sous_pr` refait ce contrôle au push. Banc : « relancer : une sous-PR qui a bougé depuis sa lecture n'est ni jugée ni poussée (sortie 5) ».
  - **Fetch par refspecs explicites** (mineure de la relecture) : `+refs/heads/develop:refs/remotes/origin/develop`, de même pour la base et la tête. `develop` est lu aussi : `mettre_a_jour_sous_pr` rend la main détachée sur `origin/develop`. Banc : « relancer : sur un clone --single-branch, le sujet et la tête sont lus par refspec explicite », vu rouge avec un fetch nu.
  - **`file.sh`, lecture de la PR en échec : sortie 5**, et non « prête (sans CI) » comme le dit le tableau « Où ». Le ticket 9, fusionné depuis, fait passer toute lecture GitHub qui décide d'un état par `lire_github`, refus → sortie 5 (`pr_json` l'appelle) : un 502 n'est jamais lu comme un état. Coût : une panne passagère sur cette lecture met la boucle en pause (`PAUSE`), comme toute autre lecture de `file.sh`.
  - **Message de conflit de `relancer`** : la ligne `conflit avec <sujet> hors index générés :`, puis chaque fichier indenté de deux espaces, écrits par `printf` puis `exit 2` (multiligne, sans le préfixe de `sortir`). **Renvoi de la boucle** : « conflit avec `<sujet>` hors index générés : `a`, `b`. Fusionner `<sujet>` dans la branche et le résoudre », les fichiers lus dans la sortie de `relancer` comme la boucle le fait pour `passer.sh` ; sans fichier lisible, « voir la sortie de sujet.sh relancer » à leur place.
  - **Banc 4 dans `sujet-fusionner.test.mjs`**, et non `fusionner.test.mjs` : il reprend la fixture `sousPrEnConflit` des bancs 1 et 2, sans checks.
  - **Faux GitHub** : `mergeable_state` aussi sur la réponse d'un `PATCH pulls/<n>` (GitHub rend la PR entière) ; l'aide `fusionEssayee` (arbre de `git merge-tree --write-tree`) sert à la fusion et à `mergeable_state`.
  - **Faux GitHub, calcul impossible : `mergeable_state` à `null`.** Le banc « fusionner : un échec du capitaine (git sans merge-tree --write-tree) » remplace `git` dans le PATH, que le faux utilise aussi : sa lecture de la PR échouait (GitHub illisible, sortie 5 au lieu de 11). GitHub qui ne sait pas calculer l'état rend `null` ; le faux fait de même. La fusion (`PUT`) échoue toujours sur un `merge-tree` en échec.
  - **`skills/chaine/sujet/references/CONTENU.md`**, hors du tableau « Où » : il décrit chaque comportement du faux GitHub ; `mergeable_state` y est ajouté.
  - **Renvoi de la boucle** : la liste des fichiers s'arrête à la première ligne qui n'est pas un fichier indenté, et tolère une fin de ligne CRLF ; banc à deux fichiers en conflit (revue de ticket, axe Règles, S19).
  - Version : **7.26.0** (mineure sur 7.25.0 de `main`).
