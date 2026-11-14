# Un conflit de code entre un sujet et develop entre dans le sujet par une PR de mise à jour : `sujet.sh fusionner` la reconnaît, vérifie qu'elle n'apporte que la résolution et avance le sujet sans squash ni force

Status: Fait — PR #93
Type: task
Label: contre-revue
Modèle: sonnet — trois fonctions et cinq remplacements dans `sujet.sh`, une fonction dans `github.sh`, trois remplacements dans `boucle.sh` et autant dans `passer.sh`, une ligne du faux `gh` et une de `revue-exigee.mjs`, quinze tests donnés mot pour mot, les phrases de documentation et la version. Tout est joué sur une copie jetable de `origin/main` (voir « Vérification ») ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/revue-exigee.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

Rapporté le 2026-11-14 par l'architecte d'un projet qui pose le socle. Quand `sujet.sh rafraichir <nom>` bute sur un conflit de code avec develop (sortie 2), **aucune voie outillée** ne fait entrer la résolution dans le sujet :

- (a) une session ne pousse pas sur `sujet/*` : le hook d'agent refuse tout `git push` vers un sujet ;
- (b) une PR de mise à jour (branche partie du sujet, develop fusionné et résolu) passée à `sujet.sh fusionner` n'entre pas. Sa revue est exigée sur tout le develop qu'elle apporte, puis `rafraichir --abandon-si-conflit` retombe sur le même conflit et abandonne. Sans ce conflit, elle serait squashée et perdrait la filiation de develop ;
- (c) la fusion par un outil GitHub d'une PR de base `sujet/…` est refusée depuis 7.7.0 (`garde-github`).

Seul un humain la fait entrer aujourd'hui. Sa proposition : `sujet.sh rafraichir <nom> --depuis <branche>`, qui vérifie la descendance, régénère les index et pousse `<branche>` sur le sujet en avance rapide. Ce ticket garde le mécanisme (vérifier, régénérer, avancer sans force) mais **pas l'option** : il le met dans `sujet.sh fusionner`, derrière les contrôles de toute sous-PR (décision 1).

En chemin, trois lectures `git diff --name-only` qui dispensent de la revue se laissaient tromper par la détection des renommages ou par les guillemets de git, et `revue-exigee.mjs` ne reconnaissait pas un chemin de code cité entre guillemets : c'est corrigé ici (décision 11).

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : une session fille, lancée pour ce geste (jamais le conducteur ni le capitaine), résout le conflit dans une branche de travail et ouvre une PR vers le sujet, étiquetée `à-fusionner`. La boucle du capitaine la reconnaît et la fait entrer dans le sujet par avance rapide : le sommet de la PR devient le sujet, avec develop pour second parent, les index sont régénérés et le capitaine ferme la PR. Une PR de mise à jour d'une autre forme est renvoyée avec son motif (sortie 4). Un échec des outils du capitaine sort en 11, sans renvoi. Rien de ce que la chaîne refuse aujourd'hui ne devient possible.

## Où

Base : `origin/main` à `2826309` (PR 92, ticket 31 fusionné), plugin **7.8.2**, **484 tests**. Lignes relues sur ce commit : `sujet.sh` et `boucle.sh` n'ont pas bougé depuis `ce61357`. La session retrouve chaque ancrage par son texte. `S` abrège `skills/chaine/sujet/scripts/sujet.sh`, `B` abrège `skills/chaine/fusionner/scripts/boucle.sh`, `P` abrège `skills/chaine/fusionner/scripts/passer.sh`, `A` abrège `skills/chaine/socle-chaine-de-production/references/agent`.

### Les faits, à la source

- **`S:590-646`, `rafraichir`** : `git switch -q -C "$branche" "origin/$branche"` (`:599`), puis `git merge origin/develop`. Sur un conflit hors index :
  - avec `--abandon-si-conflit` : `git merge --abort`, sortie 2 (`:616-620`) ;
  - sans : « conflit avec develop, à résoudre sur $branche (merge en cours) », sortie 2 (`:621-624`), la fusion laissée en cours sur la branche locale `sujet/<nom>`.

  Relancer `rafraichir` remet la branche sur `origin/sujet/<nom>` (`:599`) : la résolution est perdue.
- **`S:530-588`, `fusionner`** :
  - revue exigée sur `git diff --name-only <merge-base(sommet, sujet)> <sommet>` (`:555-556`), donc, pour une PR de mise à jour, sur tout le develop qu'elle apporte ;
  - puis, si la PR contient du develop plus récent que le sujet, `rafraichir "${base#sujet/}" --abandon-si-conflit` (`:577-579`) ;
  - puis le squash (`:582-586`, `merge_method: "squash"` à `:584`).
- **`B:300`** : une sortie de `sujet.sh fusionner` hors de 0, 3 à 8 donne « sous-PR non éligible (sortie $rc) ». La sortie 2 laisse donc la PR dans la file, sans renvoi ni message à la session. **`B:293`** : la sortie 3 renvoie la PR avec « fusionner <sujet> dans la branche et le résoudre ».
- **`B:246`** : un sujet en conflit dit « à résoudre par une session (sujet.sh rafraichir $nom) », c'est-à-dire le piège ci-dessus.
- **`A/regles.mjs:159-160`** (`RAISON_PUSH_SUJET`) et **`:435-436`** : tout `git push` vers `sujet/…`, et un push nu depuis une branche `sujet/…`, sont refusés. La raison : « Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. » **`A/regles.mjs:500-501`** et `garde-github` : la fusion par outil d'une PR de base gardée est refusée.
- **`skills/chaine/socle-chaine-de-production/references/CONTENU.md:13`** : « La garde vaut pour des sessions de bonne foi. Restent hors de sa lecture : un script lancé par la session ». Le hook ne voit ni ce que fait `sujet.sh`, ni son `git push`.
- **Qui fait quoi** : `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:19` et `skills/chaine/fusionner/SKILL.md:21` : le capitaine ne résout **jamais** un conflit de code d'une autre session. `skills/chaine/chantier/SKILL.md:96` : le conducteur lance `sujet.sh rafraichir <nom>` entre deux vagues ; il ne code pas.
- **`S:220-234`, `sujet_livre`** : un sujet sans carte ni branche est « livré » si un commit de fusion de develop porte une ligne `^Sujet: sujet/<nom>$` ou `^Merge pull request #n from …/sujet/<nom>$`.
- **Précédent** : `P:104-119` (`livraison_intermediaire`) recalcule une fusion par `git merge-tree --write-tree` et n'admet d'écart qu'aux index générés. La forme est reprise ici, avec les fichiers en conflit en plus.

### Les lectures `git diff --name-only` des scripts de la chaîne

Relevé `grep -rn 'diff[^|]*--name-only\|diff-tree\|--name-status'` sur `S`, `P`, `B`, `skills/chaine/fusionner/scripts/*.mjs` et `skills/chaine/revue-adversariale/scripts/`. `git diff` détecte les renommages par défaut (`diff.renames`) et cite entre guillemets un chemin non ASCII (`core.quotePath`).

| Lecture | Ce qu'elle décide | Sort |
| --- | --- | --- |
| `S:555` (`fusionner`, sous-PR) | revue exigée si `apps/`, `packages/`, `scripts/` | **corrigée** : un script déplacé de `scripts/` vers `docs/` ne montre que `docs/…` (joué : sortie 0, squashé sans revue) |
| `P:147` (PR vers develop) | revue exigée | **corrigée**, de même ; et `apps/api/éligibilité.ts`, cité `"apps/api/\303\251…"`, ne commence plus par `apps/` (joué : sortie 0) |
| `P:115` (`livraison_intermediaire`) | dispense de revue d'une livraison | **corrigée** : un script supprimé, recréé sous un chemin d'index généré (`docs/generes/*.json`), ne montre que l'index (joué : livraison fusionnée sans revue). Et `P:116` : un index sans `commande` n'y est plus dispensé que s'il est celui de develop (décision 14) |
| la lecture nouvelle de `verifier_mise_a_jour` | écart hors conflit | écrite d'emblée `--no-renames` (bloquante de relecture : conflit renommage/renommage) |
| `skills/chaine/fusionner/scripts/revue-exigee.mjs:18` (`CHEMINS_CODE`), qui lit ces listes | ce qui est du code | **corrigée** : un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne, git le cite `"apps/…"` même sous `core.quotePath=false`, et `/^(apps|packages|scripts)\//` ne le prenait pas (seconde relecture, jouée : sous-PR, PR vers develop et PR de mise à jour entraient sans revue) |
| `S:486`, `S:610`, `S:696`, `P:160` (`--diff-filter=U`) | fichiers en conflit dans l'index | inchangées : elles lisent les entrées non fusionnées, sans paire de renommage à former |
| `S:961` (`carte`, `git diff-tree --no-renames`) | carte seule modifiée | déjà sans renommage |
| `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs` (usage) | chemins sensibles | déjà `--no-renames`, `core.quotepath=false` |
| `skills/chaine/revue-adversariale/scripts/diff-revue.sh:27-28` | le diff relu | inchangée : diff entier, un renommage y montre `rename from` ; ne décide d'aucune dispense |

Hors du périmètre demandé : `A/garde-commandes.mjs:39` lit `git diff --name-only origin/develop -- .npmrc pnpm-workspace.yaml` ; la restriction aux deux chemins empêche toute paire de renommage cachée. Non touchée.

### Reproduit, dépôt jouet (`depot-jouet.mjs`, faux `gh`)

Sur `ce61357`, rejoué sur `2826309`. Sujet et develop changent tous deux `docs/f.md`.

1. `rafraichir lot` : sortie 2, « merge en cours » sur la branche locale `sujet/lot`. La session résout et committe.
2. `decisionCommande` refuse `git push origin HEAD:sujet/lot`, `git push origin sujet/lot` et `git push` nu depuis `sujet/lot`. Relancer `rafraichir lot` : sortie 2 de nouveau, la résolution perdue. `git switch` ne quitte pas une fusion en cours (« cannot switch branch while merging »).
3. PR de mise à jour #81 (`maj/lot` partie du sujet, develop fusionné, `docs/f.md` résolu, poussée). `fusionner 81` :
   - avec une section de revue : sortie 2, « conflit avec develop sur sujet/lot, fusion annulée », sujet inchangé, aucune écriture ;
   - sans section, develop touchant `apps/` : sortie 4, revue exigée sur le diff de develop, puis `RENVOI` par la boucle.
4. Le squash de cette PR par le faux `gh` (qui fusionne pour de vrai dans le dépôt nu) donne un commit à **un seul parent** ; develop n'est plus ancêtre du sujet.
5. `decisionOutilGithub('mcp__github__merge_pull_request', …)` sur base `sujet/lot` : refusé.
6. `decisionCommande('bash scripts/chaine/sujet.sh rafraichir lot --depuis maj/lot')` : **passe**, et de même avec `--depuis sujet/lot`. Le hook ne lit pas le script. Aujourd'hui, `--depuis` est ignoré : `rafraichir` lit son second argument et ne connaît que `--abandon-si-conflit`.

## Décisions

1. **La voie est la PR de mise à jour, passée par `sujet.sh fusionner`** (la boucle du capitaine, ou le capitaine à la main sur l'ordre d'un humain, comme toute sous-PR). Pas d'option `rafraichir --depuis` (remèdes écartés) : le hook laisse toute session lancer `sujet.sh` (joué, § 6 de la reproduction) et ne voit pas son `git push`. L'écriture dans le sujet reste donc derrière ce que `fusionner` exige déjà : gel (sortie 7), titre et commitlint, revue exigée, checks exigés verts sur le sommet. La recette de la session, dans l'en-tête de `sujet.sh` :
   1. `git fetch origin develop sujet/<nom>` ;
   2. `git switch -c maj/<nom> origin/sujet/<nom>` ;
   3. `git merge origin/develop`, conflit résolu, puis `git add <fichiers résolus>`. Un index généré en conflit ne s'édite pas (`garde-fichiers` le refuse) : `git checkout --theirs -- <index>`, puis `git add <index>` ; le capitaine le régénère ;
   4. `git commit --no-edit` : le message de git ;
   5. `git push origin HEAD:maj/<nom>`, puis PR vers `sujet/<nom>`, titre **`chore(sujet): met <nom> à jour avec develop`**, étiquetée `à-fusionner`. Un `fix(…)` ou `feat(…)` sur une résolution qui ne touche que `docs/` serait refusé (sortie 4, `motifTitreSansCode`).

   Chaque commande passe le hook, joué. `git push origin maj/lot:sujet/lot` et `--force-with-lease` restent refusés.
2. **Reconnaître une PR de mise à jour** (`est_mise_a_jour`) : hors du sujet et de develop, sa tête n'apporte que des commits de fusion, au moins un. Une sous-PR qui porte un commit ordinaire garde le chemin d'aujourd'hui (sujet rafraîchi, puis squash), inchangé, même si elle a fusionné develop.
3. **Elle n'entre que si elle est exactement la résolution** (`verifier_mise_a_jour`), sinon sortie 4. La boucle la renvoie alors avec le motif (`refus.sh`). Les conditions :
   - un seul commit hors du sujet et de develop, son sommet ;
   - un message sans ligne `Sujet:` ni `Merge pull request` : `sujet_livre` les lit dans les fusions de develop, et une ligne forgée ferait passer pour livré un sujet fantôme ;
   - une fusion à deux parents ;
   - premier parent : le sommet **actuel** du sujet. L'avance rapide l'exige, et `livrer` lit le sujet par ses premiers parents (`git log --first-parent`).
   - second parent : **un commit de develop absent du sujet**, pas forcément le sommet de develop (décision de l'architecte). Develop avance à chaque fusion du capitaine, et exiger son sommet ferait refaire la mise à jour à chaque tour. Le reste de develop entre par le `rafraichir` suivant de la boucle.
   - un arbre qui ne s'écarte de la fusion recalculée (`git merge-tree --write-tree --name-only`, git ≥ 2.38, déjà requis par `passer.sh`) **que sur les fichiers en conflit et les index générés qui ont une `commande`**. Ces index sont régénérés à l'entrée, donc écrasés. Un index sans commande (chaîne nue de `index-generes.json`) n'est jamais régénéré : réécrit hors conflit, il est refusé (variante stricte, décision de l'architecte ; bloquante de relecture : `apps/genere.json` y entrait sans revue). La liste de ces index ne s'ouvre jamais faute de se lire : `index_regeneres_regex` absente (une copie de `github.sh` plus ancienne) ou `jq` en échec rendait `grep -Ev ""`, qui retire tout, et une ligne `Dépendances:` entrait (seconde relecture, jouée). Une liste vide ou illisible sort en 11. Un projet sans aucun index généré rend `^()$`, comme `index_generes_regex` : la regex n'est pas vide et ne prend aucun chemin (les lignes vides sont retirées).
   - l'écart se lit **sans détection des renommages** (`--no-renames`, et `core.quotePath=false`). Bloquante de relecture : dans un conflit renommage/renommage, `merge-tree` liste le chemin d'origine. Une résolution qui le recrée avec le contenu d'un script de garde, puis supprime ce script, ne montrait que le chemin recréé, et le script disparaissait du sujet sans revue.

   Un fichier hors conflit (une ligne `Dépendances:`, du code), ou un commit de correction, part en sous-PR à part, squashée comme les autres. Une configuration de fusion différente chez la session ferait refuser (écart hors conflit), jamais accepter : la vérification échoue fermée.
4. **La revue exigée porte sur tout ce que la PR écrit et sur tout ce qui était en conflit** (`RESOLUTION` : l'écart entier, index compris, comme le chemin ordinaire, **et les fichiers en conflit**), pas sur le develop apporté. Seconde relecture, jouée : dans un conflit modifier/supprimer ou binaire, l'arbre de `git merge-tree` porte déjà la version du sujet, sans marqueurs ; une résolution qui la garde ne fait aucun écart, et la revue n'était pas exigée. Le develop apporté reste hors de la revue, déjà revu à son entrée dans develop. La section de revue se fait sur `git show --remerge-diff <sommet>`. Gel, titre, commitlint et checks exigés restent ceux d'une sous-PR. **Dit ici, comme pour toute sous-PR** : dans les fichiers en conflit, la résolution est libre. Hors de `apps/`, `packages/` et `scripts/` (un workflow, une ligne `Gel:` ou `Dépendances:` en conflit), elle n'exige aucune revue. C'est monotone : une sous-PR ordinaire qui touche ces fichiers n'en exige pas non plus.
5. **L'entrée** (`avancer_sujet`) :
   - le sommet de la PR est détaché dans le worktree du capitaine ;
   - `pnpm install`, puis `regenerer_index` (régénérations et contrôles) ; un commit `docs: régénère les index après mise à jour avec develop` s'ils changent, comme `rafraichir` ;
   - puis `pousser "HEAD:refs/heads/sujet/<nom>"`, un `git push` simple sous les hooks, jamais de `+` ni de `--force*` : le distant refuse ce qui n'est pas une avance rapide depuis le sommet lu.

   Un sujet qui bouge entre la lecture et le push : sortie 5, rien n'est écrasé, la PR reste ouverte. Au tour suivant, le premier parent n'est plus le sommet : renvoi (4), la session refait la mise à jour.
6. **Après l'entrée, le capitaine ferme la PR** si elle est encore ouverte : un commentaire « Entrée dans sujet/<nom> par avance rapide au sommet <sha> », puis `PATCH pulls/<n>` `state=closed`. Sans cela, une PR restée ouverte serait reprise au tour suivant par le chemin ordinaire (diff vide) et `fusionner` tenterait un squash. GitHub peut l'avoir déjà marquée fusionnée (son sommet est dans la base) : `state` n'est alors plus `open`, rien n'est écrit. Écarté : faire reconnaître par `fusionner` une PR dont le sommet est déjà dans le sujet ; ce serait un second chemin, pour un cas que la fermeture évite à la source. Le faux `gh` applique `state` d'un `PATCH` (une ligne) pour le prouver.
7. **Un échec côté capitaine sort en 11, sans renvoi.** Les causes : git sans `merge-tree --write-tree`, diff illisible, liste des index régénérés illisible, `pnpm install` ou régénération en échec, commit ou push refusé par un hook. La boucle dit `ÉCHEC DU CAPITAINE` et laisse la PR dans la file. Sortir en 3 la faisait renvoyer avec « fusionner <sujet> dans la branche et le résoudre » : suivre ce conseil crée une seconde fusion, refusée ensuite en 4. La sortie 11 n'est prise par aucun script de la chaîne (`sujet.sh` : 0, 2 à 9, 69 ; le 10 de `boucle.sh` est sa propre sortie, le fichier d'arrêt).
8. **Les hooks d'agent ne changent pas.** `A/regles.mjs`, `A/regles.test.mjs`, `A/garde-github.mjs` : aucune ligne. Le `git push` de `sujet.sh` reste hors de leur lecture, comme aujourd'hui pour `rafraichir`, `fusionner` et `carte`.
9. **Monotonie** : rien de ce que la chaîne refuse aujourd'hui ne devient possible.
   - Le push forcé, le push sur `develop` ou `main` et le push d'une session vers `sujet/…` sont refusés par les mêmes hooks, non touchés.
   - **Aucune réécriture du sujet** : test « ne réécrit jamais le sujet ». Un pre-push du jouet place sur le sujet le commit d'une autre session pendant l'avance : sortie 5, ce commit reste le sommet.
   - Avant ce ticket, une sous-PR aux checks verts et revue entrait déjà dans le sujet, squashée, avec un contenu quelconque. La PR de mise à jour passe les mêmes contrôles et n'apporte que develop et la résolution des fichiers en conflit : un sous-ensemble.
   - **Une écriture hors conflit est refusée** : ligne `Dépendances:`, suppression cachée derrière un renommage, index sans commande. Tests « hors des fichiers en conflit » et « d'une autre forme ».
   - Un sujet gelé refuse la PR de mise à jour (sortie 7, comme toute sous-PR ; test « sujet gelé »). Le `rafraichir` du capitaine, sans conflit, reste la seule voie d'un sujet gelé.
10. **Qui résout** : **une session fille lancée pour ce geste** (décision de l'architecte). Jamais le conducteur, qui ne code pas, ni le capitaine, qui ne résout jamais un conflit de code d'une autre session. Le conducteur, entre deux vagues, la lance (`chantier/SKILL.md`, une phrase). `rafraichir` sans `--abandon-si-conflit` garde sa fusion en cours : un humain peut encore résoudre là et pousser lui-même, la seule voie d'aujourd'hui. Une ligne de plus dans son message dit d'abandonner et de lancer la fille.
11. **Les lectures `git diff --name-only` qui décident d'une dispense** se lisent `git -c core.quotePath=false diff --no-renames --name-only` : `S:555`, `P:115` et `P:147` (relevé ci-dessus). Une suppression ou un déplacement compte à son ancien chemin. Un chemin non ASCII n'est plus cité entre guillemets, qui le sortaient de `apps/`. Un chemin que git cite encore (`"`, `\`, tabulation, saut de ligne) est pris par `CHEMINS_CODE = /^"?(apps|packages|scripts)\//` de `revue-exigee.mjs`. Dans `verifier_mise_a_jour`, `merge-tree --name-only` et `diff --name-only` le citent de la même façon (joué : `"apps/q\"x.ts"` des deux côtés), la comparaison avec les conflits tient. Ce n'est que plus strict : un chemin de plus dans la liste ne peut qu'exiger une revue ou refuser une dispense.
12. Ni `--no-verify`, ni test retiré, sauté ou assoupli. Aucune dépendance nouvelle. Les tests existants ne changent pas ; `sujet-fusionner.test.mjs` gagne trois imports et neuf tests, `fusionner.test.mjs` cinq, `revue-exigee.test.mjs` un.
13. **Version : mineure.** Une voie nouvelle de `fusionner`. La session prend la version de `origin/main` à l'ouverture de la PR et monte le deuxième chiffre (sur `2826309` : 7.8.2 → 7.9.0). Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la mineure qui suit la sienne.
14. **Un index sans `commande` dans `livraison_intermediaire`** (`P:116`, décision de l'architecte) n'est dispensé de revue que si son blob au sommet de la livraison est celui d'`origin/develop` : `git rev-parse <sommet>:<chemin>` égal à `git rev-parse origin/develop:<chemin>`. Un chemin absent d'un côté diffère. C'est le cas légitime : la mise à jour par `passer.sh` a pris la version de develop d'un tel index en conflit (`git checkout --theirs`), sans pouvoir le régénérer. Tout autre contenu, ou l'index retiré, va à la revue, comme B2. Un index qui a une `commande` reste dispensé : `passer.sh` le régénère. La liste de ceux-là, `index_regeneres_regex`, passe dans `github.sh`, que `sujet.sh` et `passer.sh` sourcent tous deux. Illisible, la livraison n'est pas reconnue et va à la revue : sans cette garde, `grep -qE ""` prenait tout index pour régénéré, la dispense d'avant.

### Remèdes écartés

- **`sujet.sh rafraichir <nom> --depuis <branche>`** (la proposition).
  - **Sans PR** : le hook la laisse lancer par toute session (joué) et ne voit pas le `git push` qu'elle fait. Elle pousserait dans le sujet, sans checks ni revue, ce que le hook refuse à cette même session : la ligne `Dépendances:` qui l'autorise.
  - **Avec PR et ses contrôles** : elle double `sujet.sh fusionner <n>`, avec deux points d'entrée à tenir.
- **Squasher la PR de mise à jour** : un commit à un seul parent (joué) ; develop n'est plus ancêtre du sujet, et ses changements reviennent en double à la livraison.
- **Fusion par l'API GitHub (`merge_method: merge`)** : aucune régénération des index, un commit de fusion de plus par mise à jour, et `garde-github` refuse déjà la fusion par outil d'une PR de base gardée.
- **Exiger que la PR descende du sommet de develop** : develop avance à chaque fusion du capitaine, la mise à jour serait à refaire à chaque tour (décision 3).
- **Admettre des commits de correction après la fusion** : ils entreraient dans le sujet un par un, non squashés, avec des titres que rien n'a vérifiés, contre « un commit par sous-PR ».
- **Dispenser du filtre « hors conflit » tous les index générés** (première rédaction) : un index sans commande n'est jamais régénéré, il entrait tel quel, sans revue (bloquante de relecture).
- **Refuser tout index sans commande dans une livraison** (variante stricte) : elle renverrait à la revue la livraison que `passer.sh` a lui-même mise à jour avec la version de develop d'un tel index (décision 14 ; joué : le test « est celui de develop » rougit sous cette variante).
- **Changer `rafraichir` pour qu'il abandonne toujours** : il fermerait la voie de l'humain (décision 10).
- **Sortir en 3 sur un échec du capitaine** : la boucle renvoie, avec un conseil qui casse la PR (décision 7).

## À faire, dans l'ordre

Les blocs de code ci-dessous qui commencent par une ligne vide se collent sans elle : la ligne vide du fichier suffit.

### 0. Les tests d'abord, vus rouges

Sur `origin/main` :

1. faire les §§ 6 et 7 ;
2. jouer `node --test skills/chaine/fusionner/scripts/revue-exigee.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs` ;
3. voir **treize `not ok`**, et les soixante et un autres verts. Deux tests nouveaux sont verts dès `main`, gardes de non-régression : « sujet gelé », et la livraison « dont un index sans commande est celui de develop », qui rougit sous la variante stricte (décision 14) ;
4. **puis** seulement écrire le code.

### 1. `S` (`skills/chaine/sujet/scripts/sujet.sh`)

**a. En-tête, `fusionner`.** La ligne `#                         (lancé par le capitaine pour une sous-PR étiquetée \`à-fusionner\`)` (`:20`) devient :

```bash
#                         (lancé par le capitaine pour une sous-PR étiquetée `à-fusionner`) ;
#                         PR de mise à jour (sa tête n'apporte que la fusion de develop dans le sujet, conflit
#                         résolu) : entre par avance rapide, sans squash, si elle est exactement la résolution
#                         (voir « PR de mise à jour » plus bas), sinon sortie 4
```

**b. En-tête, les sorties.** Les deux lignes `:76-77` :

```bash
# avec le sujet sur des index générés seuls : branche mise à jour (index régénérés) et poussée, CI
# relancée, aucun squash · 69 jq absent du poste
```

deviennent :

```bash
# avec le sujet sur des index générés seuls : branche mise à jour (index régénérés) et poussée, CI
# relancée, aucun squash · 11 `fusionner` d'une PR de mise à jour : échec côté capitaine (git sans
# `merge-tree --write-tree`, dépendances, régénération, commit ou push refusé), rien à corriger côté PR,
# aucun renvoi · 69 jq absent du poste
```

**c. Trois fonctions.** Entre la fonction `refuser_tete_gardee` (son `}` fermant, `:528`, puis la ligne vide) et `fusionner() {` (`:530`), insérer :

```bash
# PR de mise à jour d'un sujet : un conflit de code entre le sujet et develop, que `rafraichir` ne résout pas
# (sortie 2) et qu'aucune session ne pousse (le hook refuse tout push vers sujet/…). Une session fille,
# lancée pour ce geste, résout dans une branche de travail :
#   git fetch origin develop sujet/<nom>
#   git switch -c maj/<nom> origin/sujet/<nom>
#   git merge origin/develop                 conflit résolu, puis `git add <fichiers résolus>` ; un index
#                                            généré en conflit ne s'édite pas (le hook le refuse) :
#                                            `git checkout --theirs -- <index>`, puis `git add <index>`, le
#                                            capitaine le régénère
#   git commit --no-edit                     message de git, sans ligne `Sujet:`
#   git push origin HEAD:maj/<nom>, puis PR vers sujet/<nom>, titre `chore(sujet): met <nom> à jour avec
#   develop`, étiquetée `à-fusionner`
# Le capitaine la reconnaît : hors du sujet et de develop, sa tête n'apporte que des commits de fusion. Une
# sous-PR qui porte un commit ordinaire garde le chemin ordinaire (sujet rafraîchi, puis squash).
est_mise_a_jour() {
  [ -n "$(git rev-list --merges -n 1 "$1" "^origin/$2" ^origin/develop)" ] &&
    [ -z "$(git rev-list --no-merges -n 1 "$1" "^origin/$2" ^origin/develop)" ]
}

# Elle n'entre que si elle est exactement la résolution, sinon sortie 4 (motif à la session) : un seul
# commit hors du sujet et de develop, son sommet ; un message sans ligne `Sujet:` ni `Merge pull request`
# (`sujet_livre` les cherche dans les fusions de develop) ; une fusion à deux parents, le sommet du sujet
# d'abord (avance rapide, et `livrer` lit le sujet par ses premiers parents), puis un commit de develop
# absent du sujet ; un arbre qui ne s'écarte de la fusion recalculée (`git merge-tree`, git ≥ 2.38, comme
# passer.sh) que sur les fichiers en conflit et les index régénérés. L'écart se lit sans détection des
# renommages : un fichier supprimé derrière un chemin en conflit recréé compte. Rien d'autre n'entre par
# cette voie : un fichier hors conflit (une ligne `Dépendances:`, du code) part en sous-PR, squashée comme
# les autres. RESOLUTION : l'écart, index compris, et les fichiers en conflit, que lit la revue exigée.
# Un outil du capitaine en échec (git sans `merge-tree --write-tree`) : sortie 11, rien à corriger côté PR.
verifier_mise_a_jour() {
  local n=$1 sommet=$2 base=$3 s p1 p2 reste fusion rc arbre conflits ecart hors regeneres
  s=$(git rev-parse "origin/$base")
  [ "$(git rev-list --count "$sommet" "^origin/$base" ^origin/develop)" = 1 ] ||
    sortir 4 "#$n, PR de mise à jour : une seule fusion de develop dans $base, rien d'autre ; une correction part ensuite en sous-PR"
  ! grep -qE '^(- )?\**Sujet ?:|^Merge pull request' <<<"$(git log -1 --format=%B "$sommet")" ||
    sortir 4 "#$n, PR de mise à jour : le message de la fusion porte une ligne « Sujet: » ou « Merge pull request » : refaire la fusion avec le message de git"
  read -r _ p1 p2 reste <<<"$(git rev-list --parents -n 1 "$sommet")"
  [ -n "$p2" ] && [ -z "$reste" ] ||
    sortir 4 "#$n, PR de mise à jour : une fusion à deux parents, le sommet de $base puis develop"
  [ "$p1" = "$s" ] ||
    sortir 4 "#$n, PR de mise à jour : le premier parent n'est pas le sommet de $base (le sujet a avancé, ou develop est le premier parent) : la refaire depuis origin/$base"
  if ! git merge-base --is-ancestor "$p2" origin/develop || git merge-base --is-ancestor "$p2" "$s"; then
    sortir 4 "#$n, PR de mise à jour : le second parent n'est pas un commit de develop absent de $base"
  fi
  fusion=$(git -c core.quotePath=false merge-tree --write-tree --name-only --no-messages "$p1" "$p2") && rc=0 || rc=$?
  [ "$rc" -le 1 ] || sortir 11 "#$n : git merge-tree --write-tree en échec (git ≥ 2.38 requis), côté capitaine : PR laissée dans la file"
  arbre=$(sed -n 1p <<<"$fusion")
  conflits=$(sed -n '2,$p' <<<"$fusion")
  ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$arbre" "$sommet") ||
    sortir 11 "#$n : diff de la résolution illisible, côté capitaine : PR laissée dans la file"
  # La liste des index régénérés illisible (fonction absente, jq en échec) : jamais une garde ouverte. Un projet
  # sans index généré a une liste vide, `^()$`, qui ne prend aucun chemin.
  regeneres=$(index_regeneres_regex) && [ -n "$regeneres" ] ||
    sortir 11 "#$n : liste des index régénérés illisible (index_regeneres_regex de github.sh), côté capitaine : PR laissée dans la file"
  # Un chemin cité par git (`"apps/a\"b.ts"`) l'est de même dans les deux listes : la comparaison tient.
  hors=$(comm -23 <(printf '%s\n' "$ecart" | grep -Ev "$regeneres" | sed '/^$/d' | sort -u) <(printf '%s\n' "$conflits" | sort -u))
  [ -z "$hors" ] ||
    sortir 4 "#$n, PR de mise à jour : elle écrit hors des fichiers en conflit ($(tr '\n' ' ' <<<"$hors")) : elle n'apporte que la résolution, le reste part en sous-PR"
  # La revue porte sur l'écart et sur les fichiers en conflit : un conflit modifier/supprimer ou binaire dont la
  # résolution garde la version du sujet ne fait aucun écart avec l'arbre recalculé, qui la porte déjà.
  RESOLUTION=$(printf '%s\n%s\n' "$ecart" "$conflits" | sed '/^$/d' | sort -u)
}

# Avance rapide du sujet jusqu'à la PR de mise à jour vérifiée : index régénérés et contrôlés sur son sommet
# (un commit de plus s'ils changent), puis `git push` simple, jamais forcé, sous les hooks. Un sujet qui a
# bougé depuis la lecture refuse le push : sortie 5, rien n'est écrasé ; au tour suivant, la PR, dont le
# premier parent n'est plus le sommet du sujet, est renvoyée (4). Dépendances, régénération, commit ou push
# refusés côté capitaine : sortie 11, rien à corriger côté PR, aucun renvoi. Entrée : la PR est fermée avec
# le sommet qui l'a fait entrer (GitHub peut l'avoir déjà marquée fusionnée), le tour suivant ne la squashe pas.
avancer_sujet() {
  local n=$1 base=$2 sommet=$3 avant statut tete
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  avant=$(git rev-parse "origin/$base")
  git switch -q --detach "$sommet"
  local echec
  echec() {
    git reset -q --hard
    git switch -q --detach origin/develop
    sortir 11 "$1, côté capitaine : #$n non fusionnée dans $base, PR laissée dans la file"
  }
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || echec "pnpm install en échec"
  regenerer_index || echec "gate des index/registres en échec (sortie ci-dessus)"
  if ! git diff --cached --quiet; then
    jouer_ou_dire "git commit -q -m 'docs: régénère les index après mise à jour avec develop'" ||
      echec "commit refusé par un hook git (sortie ci-dessus)"
  fi
  tete=$(git rev-parse HEAD)
  pousser "HEAD:refs/heads/$base" "$base" "$avant" && statut=0 || statut=$?
  git switch -q --detach origin/develop
  case $statut in
    0) ;;
    5) sortir 5 "$base a bougé pendant l'avance : #$n non fusionnée, reprise au tour suivant" ;;
    *) sortir 11 "avance de $base refusée par le hook pre-push (ou le distant), côté capitaine : sortie ci-dessus, PR laissée dans la file" ;;
  esac
  if [ "$(gh api "$DEPOT/pulls/$n" --jq .state 2>/dev/null)" = open ]; then
    commenter "$n" "Entrée dans $base par avance rapide au sommet $(git rev-parse --short "$tete") (mise à jour avec develop) : PR fermée par le capitaine." &&
      gh api -X PATCH "$DEPOT/pulls/$n" -f state=closed >/dev/null ||
      echo "#$n : PR NON fermée (gh refusé) : la fermer à la main, elle est déjà dans $base"
  fi
  echo "#$n fusionnée dans $base par avance rapide (mise à jour avec develop, $(git rev-parse --short "$sommet"))"
}

```

`echec` reprend la forme de celui de `mettre_a_jour_sous_pr` (`:501-506`). `commenter`, `DEPOT` et `index_regeneres_regex` (§ 5) viennent de `github.sh`.

**d. `fusionner`, la revue.** Ces six lignes (`:551-556`) :

```bash
  local revue motif
  revue="$ici/revue-exigee.mjs"
  [ -f "$revue" ] || revue="$ici/../../fusionner/scripts/revue-exigee.mjs"
  git fetch -q origin "$base" "$(jq -r .head.ref <<<"$pr")"
  motif=$(git diff --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet" |
    node "$revue" "$(jq -r '.body // ""' <<<"$pr")" "$titre") || sortir 4 "#$n $motif"
```

sont remplacées par :

```bash
  local revue motif fichiers maj=''
  revue="$ici/revue-exigee.mjs"
  [ -f "$revue" ] || revue="$ici/../../fusionner/scripts/revue-exigee.mjs"
  git fetch -q origin develop "$base" "$(jq -r .head.ref <<<"$pr")"
  # PR de mise à jour : la revue porte sur la résolution seule, pas sur le develop qu'elle apporte.
  if est_mise_a_jour "$sommet" "$base"; then
    verifier_mise_a_jour "$n" "$sommet" "$base"
    maj=1
    fichiers=$RESOLUTION
  else
    fichiers=$(git -c core.quotePath=false diff --no-renames --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet")
  fi
  motif=$(printf '%s\n' "$fichiers" | node "$revue" "$(jq -r '.body // ""' <<<"$pr")" "$titre") || sortir 4 "#$n $motif"
```

`git fetch` prend `develop` en plus : `est_mise_a_jour` lit `origin/develop`. Le chemin ordinaire lit la même liste qu'avant, sans renommage ni guillemets (décision 11) ; `revue-exigee.mjs` écarte les lignes vides.

**e. `fusionner`, l'avance.** Juste après la ligne `[ "$attente" = 0 ] || sortir 3 "checks encore en cours sur #$n : attendre leur fin"` (`:572`), insérer :

```bash
  if [ -n "$maj" ]; then
    avancer_sujet "$n" "$base" "$sommet"
    return 0
  fi
```

La suite de `fusionner` (rafraîchir, mettre à jour la sous-PR, squasher) ne change pas.

**f. `rafraichir`, le message.** Dans la branche `elif [ -n "$autres" ]; then` (`:621-624`), entre `printf '  %s\n' $autres` et `exit 2`, insérer :

```bash
      echo "une session ne pousse pas un sujet : git merge --abort, puis une session fille lancée pour ce geste ouvre la PR de mise à jour (en-tête de sujet.sh)"
```

La branche `--abandon-si-conflit` (`:616-620`) ne change pas.

### 2. `B` (`skills/chaine/fusionner/scripts/boucle.sh`)

- `:25-26`, les deux lignes `# Un conflit est annulé et signalé (SUJET EN CONFLIT), jamais résolu ici : une session le` / `# résout avec \`sujet.sh rafraichir <nom>\`.` deviennent :

```bash
# Un conflit est annulé et signalé (SUJET EN CONFLIT), jamais résolu ici : une session le
# résout dans une PR de mise à jour (en-tête de sujet.sh), que `sujet.sh fusionner` fait entrer par
# avance rapide.
```

- `:246`, la ligne `      *) echo "[sujet/$nom] SUJET EN CONFLIT avec develop : à résoudre par une session (sujet.sh rafraichir $nom)" ;;` devient :

```bash
      *) echo "[sujet/$nom] SUJET EN CONFLIT avec develop : à résoudre par une session, PR de mise à jour vers sujet/$nom (en-tête de sujet.sh)" ;;
```

- `:299`, juste après la ligne `          8) echo "[#$n] MISE À JOUR avec ${etat%% :*} (index régénérés), CI relancée" ;;` (dans le `case` de `sujet.sh fusionner`), insérer :

```bash
          # PR de mise à jour : un outil du capitaine en échec, rien que la session puisse corriger.
          11) echo "[#$n] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file (aucun renvoi), cause ci-dessus" ;;
```

Le filtre du `Monitor` (`fusionner/SKILL.md:60`) lit toujours `SUJET EN CONFLIT`, et gagne `ÉCHEC DU CAPITAINE` (§ 8).

### 3. `P` (`skills/chaine/fusionner/scripts/passer.sh`)

- `:115`, la ligne `    ecart=$(git diff --name-only "$attendu" "$origine") || continue` devient :

```bash
    # Sans détection des renommages : une suppression ne se cache pas derrière un index généré ajouté.
    ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$attendu" "$origine") || continue
```

- `:105`, la ligne `  local nom=$1 d s attendu ecart` devient `  local nom=$1 d s attendu ecart hors regeneres`, et `:116`, la ligne `    [ -n "$(printf '%s\n' "$ecart" | grep -Ev "$GENERES" || true)" ] || return 0` devient (décision 14) :

```bash
    # Un index qui a une `commande` est régénéré : dispensé. Un index sans commande ne l'est que si son
    # blob au sommet est celui d'origin/develop (la version de develop prise au conflit par la mise à
    # jour) ; absent d'un côté, il diffère et va à la revue.
    # Liste illisible (fonction absente, jq en échec) : pas une livraison, la revue est exigée.
    regeneres=$(index_regeneres_regex) && [ -n "$regeneres" ] || return 1
    hors=$(printf '%s\n' "$ecart" | sed '/^$/d' | while IFS= read -r f; do
      if ! grep -qE "$GENERES" <<<"$f"; then
        printf '%s\n' "$f"
      elif ! grep -qE "$regeneres" <<<"$f"; then
        a=$(git rev-parse -q --verify "$origine:$f" 2>/dev/null) || a=''
        b=$(git rev-parse -q --verify "origin/develop:$f" 2>/dev/null) || b=''
        [ -n "$a" ] && [ "$a" = "$b" ] || printf '%s\n' "$f"
      fi
    done)
    [ -n "$hors" ] || return 0
```

  `a`, `b` et `f` vivent dans le sous-shell du tube : rien ne fuit hors de la fonction.
- `:147`, dans `  motif=$(git diff --name-only "$depart" "$origine" | node …`, `git diff --name-only` devient `git -c core.quotePath=false diff --no-renames --name-only` ; le reste de la ligne ne change pas.

### 4. `skills/chaine/sujet/scripts/faux-gh.mjs`

`:175`, la ligne `      Object.assign(pr(m[1]), champs.base ? { base: champs.base } : {});` devient :

```js
      Object.assign(pr(m[1]), champs.base ? { base: champs.base } : {}, champs.state ? { state: champs.state } : {});
```

### 5. `skills/chaine/fusionner/scripts/github.sh`

Juste après la fonction `index_generes_regex` (son `}` fermant, `:119`), insérer :

```bash
# Ceux qui ont une `commande`, de même : régénérés, donc écrasés à chaque mise à jour. Un index sans
# commande (chaîne nue de la liste) n'est jamais régénéré : `sujet.sh` (PR de mise à jour) et `passer.sh`
# (livraison intermédiaire) ne le dispensent pas sur sa seule place dans la liste.
index_regeneres_regex() {
  index_json | jq -r '.index[] | objects | select((.commande // "") != "") | .chemin' |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
```

Et dans `skills/chaine/fusionner/scripts/revue-exigee.mjs`, la ligne `const CHEMINS_CODE = /^(apps|packages|scripts)\//;` (`:18`) devient :

```js
// `"?` : git cite entre guillemets un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne, même sous
// `core.quotePath=false` (`"apps/a\"b.ts"`) ; cité, il reste du code.
const CHEMINS_CODE = /^"?(apps|packages|scripts)\//;
```

Rien d'autre dans le code : `A/*`, `file.sh`, `refus.sh`, `depot-jouet.mjs` ne changent pas.

### 6. `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`

La ligne `import { existsSync } from "node:fs";` devient (trois imports de plus, et `join`) :

```js
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
```

Puis ajouter à la fin du fichier, après le test « sujet.sh fusionner : une sous-PR d'un sujet gelé sort en 7, jamais en 4, sans rien écrire ». `depotJouet`, `SUJET`, `BOUCLE`, `ADR`, `index` et `ecritures` existent déjà :

```js

// PR de mise à jour #81 : le sujet et develop changent tous deux `conflit` (conflit de code) et ajoutent
// chacun une ADR (conflit sur l'index généré) ; develop touche aussi apps/a.ts, hors conflit. `base`,
// `sujetEnPlus`, `developEnPlus` et `resolution` : { chemin: contenu }, `null` retire le fichier. La
// branche maj/lot part de `depuis`, fusionne `fusion`, résout `conflit` et l'index (à la main et mal : la
// régénération le refait), committe (`message`, sinon celui de git), puis `avantPush(d)` et le push ;
// `apres(d)` agit ensuite sur le distant.
const TICKET = "docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.01.issue.md";
const CARTE = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const GARDE = "scripts/verify/gate-securite.mjs";
const appliquer = (d, fichiers) => {
  for (const [chemin, contenu] of Object.entries(fichiers))
    if (contenu === null) d.git("rm", "-q", "-f", "--", chemin);
    else d.ecrire(chemin, contenu);
};
function miseAJour({
  conflit = "docs/f.md",
  base = {},
  sujetEnPlus = {},
  developEnPlus = {},
  resolution = {},
  message = null,
  depuis = "origin/sujet/lot",
  fusion = "origin/develop",
  avantPush = () => {},
  apres = () => {},
  body = "Met lot à jour avec develop.\n",
} = {}) {
  const d = depotJouet();
  appliquer(d, { [conflit]: "0\n", [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: —\n", ...base });
  d.commit("docs: base");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", "sujet/lot", "origin/develop");
  appliquer(d, {
    [conflit]: "sujet\n",
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-3-c.md"),
    ...sujetEnPlus,
  });
  d.commit("feat: sujet avance");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/lot");
  d.git("switch", "-q", "--detach", "origin/develop");
  appliquer(d, {
    [conflit]: "develop\n",
    "apps/a.ts": "export const a = 1;\n",
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-2-b.md"),
    ...developEnPlus,
  });
  d.commit("feat: develop avance");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", "maj/lot", depuis);
  const m = spawnSync("git", ["merge", "-q", "--no-edit", fusion], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(m.status, 1, "conflit attendu : " + m.stdout + m.stderr);
  appliquer(d, { [conflit]: "résolu\n", [`${ADR}/README.md`]: index("ADR_ALL_ARC-3-c.md"), ...resolution });
  d.git("add", "-A");
  if (message === null) d.git("commit", "-q", "--no-edit");
  else d.git("commit", "-q", "-m", message);
  avantPush(d);
  d.git("push", "-q", "origin", "HEAD:refs/heads/maj/lot");
  const sommet = d.git("rev-parse", "HEAD");
  apres(d);
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "sujet/lot", labels: ["à-fusionner"], body }],
  });
  return { d, sommet, sujet: d.git("rev-parse", "origin/sujet/lot"), develop: d.git("rev-parse", "origin/develop") };
}
const sujetDistant = (d) => {
  d.git("fetch", "-q", "origin");
  return d.git("rev-parse", "origin/sujet/lot");
};

test("fusionner : une PR de mise à jour entre dans le sujet par avance rapide, develop pour parent, index régénérés, aucun squash, PR fermée", () => {
  const { d, sommet, sujet, develop } = miseAJour();
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#81 fusionnée dans sujet\/lot par avance rapide \(mise à jour avec develop, [0-9a-f]+\)/);
  const tete = sujetDistant(d);
  // L'index résolu à la main était faux : la régénération le refait, un commit de plus sur la résolution.
  assert.equal(d.git("rev-parse", `${tete}^1`), sommet, "le sommet de la PR est dans le sujet, tel quel");
  assert.equal(d.git("rev-parse", `${sommet}^1`), sujet, "premier parent : l'ancien sommet du sujet");
  assert.equal(d.git("rev-parse", `${sommet}^2`), develop, "second parent : develop");
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", develop, tete], { cwd: d.travail, env: d.env }).status, 0);
  assert.equal(d.git("show", `${tete}:${ADR}/README.md`) + "\n", index("ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"));
  assert.equal(d.git("show", `${tete}:docs/f.md`), "résolu");
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
  // La PR est fermée par le capitaine, avec le sommet qui l'a fait entrer : le tour suivant ne la squashe pas.
  const pr81 = d.etat().pulls[0];
  assert.equal(pr81.state, "closed");
  assert.match(pr81.commentaires.at(-1), new RegExp(`Entrée dans sujet/lot par avance rapide au sommet ${d.git("rev-parse", "--short", tete)}`));
  assert.equal(d.git("status", "--porcelain"), "");
});

test("fusionner : une PR de mise à jour qui écrit hors des fichiers en conflit (ligne Dépendances: d'un ticket) sort en 4, sujet inchangé", () => {
  const { d, sujet } = miseAJour({ resolution: { [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: `paquet-pirate`\n" } });
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /hors des fichiers en conflit.*SPEC_ALL_DEM-1-demo\.01\.issue\.md/);
  assert.equal(sujetDistant(d), sujet);
  assert.deepEqual(ecritures(d), []);
});

test("fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire, commit de plus)", () => {
  const indexSansCommande = JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "apps/genere.json"] });
  const cas = [
    [{ apres: (d) => d.branche("sujet/lot", "origin/sujet/lot", { "docs/autre.md": "autre\n" }, "docs: autre") }, 4, /premier parent.*sommet de sujet\/lot/],
    [{ depuis: "origin/develop", fusion: "origin/sujet/lot" }, 4, /premier parent.*sommet de sujet\/lot/],
    [{ conflit: "apps/x.ts" }, 4, /Revue/],
    // Conflit renommage/renommage : la résolution recrée le chemin d'origine avec le contenu d'un script de
    // garde et supprime ce script ; la détection des renommages ne montrerait que le chemin recréé.
    [
      {
        base: { "docs/ren.md": "à renommer\n", [GARDE]: "export const garde = true;\n" },
        sujetEnPlus: { "docs/ren.md": null, "docs/a.md": "à renommer\n" },
        developEnPlus: { "docs/ren.md": null, "docs/b.md": "à renommer\n" },
        resolution: { "docs/ren.md": "export const garde = true;\n", [GARDE]: null },
      },
      4,
      /hors des fichiers en conflit.*gate-securite\.mjs/,
    ],
    // Un index généré sans commande n'est jamais régénéré : réécrit hors conflit, il n'entre pas.
    [
      { base: { "scripts/docs/index-generes.json": indexSansCommande, "apps/genere.json": "{}\n" }, resolution: { "apps/genere.json": '{"pirate":true}\n' } },
      4,
      /hors des fichiers en conflit.*apps\/genere\.json/,
    ],
    // `sujet.sh livre` lit ces lignes dans les fusions de develop : une ligne forgée ferait passer un sujet pour livré.
    [{ message: "Merge remote-tracking branch 'origin/develop' into maj/lot\n\nSujet: sujet/fantome\n" }, 4, /message de la fusion/],
    [{ message: "Merge pull request #9 from o/sujet/fantome\n" }, 4, /message de la fusion/],
    // Un chemin de code que git cite entre guillemets (`"apps/q\"x.ts"`) : en conflit, il exige la revue.
    [{ conflit: 'apps/q"x.ts' }, 4, /Revue/],
    // Conflit modifier/supprimer, puis binaire : l'arbre recalculé porte déjà la version du sujet, la garder
    // ne fait aucun écart ; la revue porte aussi sur les fichiers en conflit.
    [{ base: { "apps/api/legacy.ts": "export const l = 0;\n" }, sujetEnPlus: { "apps/api/legacy.ts": "export const l = 1;\n" }, developEnPlus: { "apps/api/legacy.ts": null } }, 4, /Revue/],
    [{ base: { "apps/img.bin": "\0base\n" }, sujetEnPlus: { "apps/img.bin": "\0sujet\n" }, developEnPlus: { "apps/img.bin": "\0develop\n" } }, 4, /Revue/],
    [{ avantPush: (d) => (d.ecrire("docs/g.md", "g\n"), d.commit("docs: en plus")), body: "## Revue de ticket\n\nRien.\n" }, 2, /conflit avec develop sur sujet\/lot, fusion annulée/],
  ];
  for (const [options, sortie, motif] of cas) {
    const { d } = miseAJour(options);
    const avant = sujetDistant(d);
    const r = d.lancer(SUJET, "fusionner", "81");
    assert.equal(r.status, sortie, r.stdout + r.stderr);
    assert.match(r.stdout, motif);
    assert.equal(sujetDistant(d), avant, "sujet inchangé");
    assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
    assert.equal(d.git("status", "--porcelain"), "");
  }
});

test("fusionner : une PR de mise à jour d'un sujet gelé sort en 7, sans rien écrire", () => {
  const { d, sujet } = miseAJour({ sujetEnPlus: { [CARTE]: "# carte\n\nSujet: sujet/lot\n\n## Fiche\n\nPhase: 4-vague-1\nGel: 2026-11-14 — pause\n" } });
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/lot est gelé/);
  assert.equal(sujetDistant(d), sujet);
  assert.deepEqual(ecritures(d), []);
});

// Monotonie : la voie nouvelle pousse sans force. Un sujet qui bouge entre la lecture et le push (le
// pre-push du jouet y écrit un commit d'une autre session) n'est jamais réécrit : sortie 5, rien d'écrasé.
test("fusionner : une PR de mise à jour ne réécrit jamais le sujet, un sujet qui bouge pendant le push la laisse dehors (sortie 5)", () => {
  const { d, sommet } = miseAJour();
  const autre = d.branche("autre", "origin/sujet/lot", { "docs/autre.md": "autre\n" }, "docs: autre session");
  d.git("switch", "-q", "--detach", "origin/develop");
  const hooks = join(d.racine, "hooks");
  mkdirSync(hooks);
  writeFileSync(join(hooks, "pre-push"), `#!/bin/sh\ngit --git-dir=${JSON.stringify(d.origine)} update-ref refs/heads/sujet/lot ${autre}\n`);
  chmodSync(join(hooks, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", hooks);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.equal(sujetDistant(d), autre, "le commit de l'autre session reste le sommet du sujet");
  assert.notEqual(spawnSync("git", ["merge-base", "--is-ancestor", sommet, "origin/sujet/lot"], { cwd: d.travail, env: d.env }).status, 0);
  assert.equal(d.etat().pulls[0].state ?? "open", "open", "PR laissée ouverte");
  assert.equal(d.git("status", "--porcelain"), "");
});

// Un échec côté capitaine (ici un git sans `merge-tree --write-tree`) n'est rien que la session puisse
// corriger : sortie 11, la boucle le dit et ne renvoie pas la PR.
test("fusionner : un échec du capitaine (git sans merge-tree --write-tree) sort en 11, et la boucle ne renvoie pas la PR", () => {
  const { d, sujet } = miseAJour();
  d.publierChaine();
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  writeFileSync(
    join(d.racine, "bin", "git"),
    `#!/bin/sh\nfor a in "$@"; do [ "$a" = merge-tree ] && { echo "git: merge-tree --write-tree inconnu" >&2; exit 129; }; done\nexec ${JSON.stringify(vrai)} "$@"\n`,
  );
  chmodSync(join(d.racine, "bin", "git"), 0o755);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 11, r.stdout + r.stderr);
  assert.match(r.stdout, /merge-tree/);
  const b = d.lancer(BOUCLE);
  assert.match(b.stdout, /\[#81\] ÉCHEC DU CAPITAINE/);
  assert.doesNotMatch(b.stdout, /RENVOI/);
  assert.ok(!ecritures(d).some((e) => /issues\/81\/(labels|comments)/.test(e)), ecritures(d).join());
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
  assert.equal(sujetDistant(d), sujet);
});

test("boucle.sh : une PR de mise à jour prête est fusionnée (FUSIONNÉE), sans renvoi, et fermée", () => {
  const { d, sommet } = miseAJour();
  d.publierChaine();
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#81\] FUSIONNÉE dans sujet\/lot/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", sommet, sujetDistant(d)], { cwd: d.travail, env: d.env }).status, 0);
  assert.equal(d.etat().pulls[0].state, "closed");
});

// Un déplacement hors de scripts/ ne cache pas la suppression : la revue est exigée sur les deux chemins.
test("fusionner : une sous-PR qui déplace un script hors de scripts/ exige la revue (renommage lu comme suppression et ajout)", () => {
  const d = depotJouet();
  d.ecrire(GARDE, "export const garde = true;\n");
  d.commit("chore: garde");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.git("switch", "-q", "-C", "docs/deplace", "origin/sujet/lot");
  d.git("mv", GARDE, "docs/garde.md");
  d.git("commit", "-q", "-m", "docs: déplace la garde");
  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/deplace");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 82, title: "docs(lot): déplace la garde", head: "docs/deplace", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }],
  });
  const r = d.lancer(SUJET, "fusionner", "82");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
  assert.deepEqual(ecritures(d), []);
});

// Les outils de la chaîne copiés dans un dossier du jouet, `github.sh` sans `index_regeneres_regex` : une
// copie du capitaine plus ancienne que `sujet.sh` ou `passer.sh`. La liste des index régénérés ne se lit pas.
function outilsSansRegeneres(d) {
  const dossier = join(d.racine, "outils");
  mkdirSync(dossier);
  const outils = [["sujet", "sujet.sh"], ...["passer.sh", "github.sh", "revue-exigee.mjs", "migrations-ordre.mjs", "identifiant.mjs"].map((n) => ["fusionner", n])];
  for (const [skill, nom] of outils) {
    const texte = readFileSync(scriptDe(skill, nom), "utf8");
    writeFileSync(join(dossier, nom), nom === "github.sh" ? texte.replace(/\nindex_regeneres_regex\(\) \{\n[\s\S]*?\n\}\n/, "\n") : texte);
  }
  assert.doesNotMatch(readFileSync(join(dossier, "github.sh"), "utf8"), /index_regeneres_regex\(\)/);
  return dossier;
}

// La garde « hors conflit » ne s'ouvre jamais faute de liste : `index_regeneres_regex` introuvable, sortie 11.
// Un projet sans aucun index généré a une liste vide, qui ne dispense aucun chemin.
test("fusionner : une PR de mise à jour sans liste lisible des index régénérés sort en 11 ; un projet sans index généré passe, et rien n'y est dispensé", () => {
  const pirate = { [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: `paquet-pirate`\n" };
  const { d, sujet } = miseAJour({ resolution: pirate });
  const r = d.lancer(join(outilsSansRegeneres(d), "sujet.sh"), "fusionner", "81");
  assert.equal(r.status, 11, r.stdout + r.stderr);
  assert.match(r.stdout, /liste des index régénérés illisible/);
  assert.equal(sujetDistant(d), sujet);
  assert.deepEqual(ecritures(d), []);
  const aucun = { "scripts/docs/index-generes.json": JSON.stringify({ index: [] }) };
  const sans = miseAJour({ base: aucun });
  const r2 = sans.d.lancer(SUJET, "fusionner", "81");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.equal(sujetDistant(sans.d), sans.sommet, "aucun index à régénérer : le sommet de la PR, tel quel");
  const sansPirate = miseAJour({ base: aucun, resolution: pirate });
  const r3 = sansPirate.d.lancer(SUJET, "fusionner", "81");
  assert.equal(r3.status, 4, r3.stdout + r3.stderr);
  assert.match(r3.stdout, /hors des fichiers en conflit.*SPEC_ALL_DEM-1-demo\.01\.issue\.md/);
});
```

Ce que prouve chaque cas du troisième test, dans l'ordre :

1. **Sujet avancé** : une sous-PR squashée entre-temps, le premier parent n'est plus le sommet.
2. **Develop premier parent** : la fusion est faite du mauvais côté.
3. **Résolution dans `apps/` sans section de revue** : refusée par `revue-exigee.mjs` sur `RESOLUTION`. Le premier test montre l'inverse : le `apps/a.ts` de develop n'exige aucune revue.
4. **Renommage/renommage** (bloquante B1) : le script de garde supprimé derrière `docs/ren.md` recréé est vu.
5. **Index sans commande** (bloquante B2) : `apps/genere.json` réécrit hors conflit est refusé.
6. et 7. **Message forgé**, ligne `Sujet:` ou `Merge pull request` : refusé.
8. **Chemin cité** (`apps/q"x.ts`, seconde relecture B1) : en conflit, il exige la revue, et il est bien dans la liste des conflits (sinon le motif serait « hors des fichiers en conflit »).
9. et 10. **Conflit modifier/supprimer, puis binaire** (seconde relecture B2) : la PR garde la version du sujet, la revue est exigée.
11. **Commit de plus** : la PR n'est plus reconnue. Elle prend le chemin ordinaire d'aujourd'hui (sortie 2, sujet inchangé).

Le test « sans liste lisible des index régénérés » copie les outils dans un dossier du jouet, `github.sh` sans `index_regeneres_regex` (`outilsSansRegeneres`). Il joue aussi les deux sens d'un projet sans aucun index généré : la PR entre telle quelle, et la ligne `Dépendances:` réécrite hors conflit reste refusée.

Le test « ne réécrit jamais » utilise le refus du distant : le `receive-pack` du dépôt nu compare l'ancien sommet annoncé au sommet réel, et `pousser` lit ensuite le distant (sortie 5). Le `pre-push` du jouet est posé par `core.hooksPath`, comme ceux de `fusionner.test.mjs`. Le test de l'échec du capitaine met en tête de `PATH` un faux `git` qui refuse `merge-tree` et passe tout le reste au vrai. Dans les tests de la boucle, `publierChaine()` fait avancer develop après la PR : le second parent n'est plus le sommet de develop, et la PR entre (décision 3).

### 7. `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Juste avant le test « passer.sh : la livraison d'une branche sujet/ nomme son sujet dans le corps du commit de merge », insérer (`LIVRAISON`, `ADR`, `PERIMETRE`, `pr`, `script`, `scriptDe` et les imports de `node:fs` et `node:path` existent déjà) :

```js

// Les lectures `git diff --name-only` qui décident d'une dispense lisent sans détection des renommages :
// un fichier déplacé ou supprimé derrière un renommage compte à son ancien chemin.
const GARDE = "scripts/verify/gate-securite.mjs";
// Chaque cas : le geste de la PR sur sa branche, partie de develop (qui porte la garde).
const DISPENSES = {
  "un script déplacé hors de scripts/": (d) => d.git("mv", GARDE, "docs/garde.md"),
  "un fichier de code à nom accentué (chemin cité par git sans core.quotePath=false)": (d) => {
    d.ecrire("apps/api/éligibilité.ts", "export const e = 1;\n");
    d.git("add", "-A");
  },
};
test("passer.sh : la revue exigée lit les chemins sans renommage ni guillemets (script déplacé hors de scripts/, code à nom accentué)", () => {
  for (const [cas, geste] of Object.entries(DISPENSES)) {
    const d = depotJouet();
    d.ecrire(GARDE, "export const garde = true;\n");
    d.commit("chore: garde");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "-C", "docs/deplace", "origin/develop");
    geste(d);
    d.git("commit", "-q", "-m", "docs: déplace la garde");
    d.git("push", "-q", "origin", "HEAD:refs/heads/docs/deplace");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
      pulls: [pr(31, "docs/deplace", { body: "Rien.\n" })],
    });
    const r = d.lancer(script("passer.sh"), "31");
    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, cas);
    assert.deepEqual(d.journal(), [], cas);
  }
});

test("passer.sh : une livraison intermédiaire qui supprime un fichier derrière un index généré renommé repasse par la revue", () => {
  const d = depotJouet();
  // Un index généré par motif (`docs/generes/*.json`) : un chemin neuf sous ce motif est un index.
  d.ecrire(
    "scripts/docs/index-generes.json",
    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "docs/generes/*.json"] }),
  );
  d.ecrire(GARDE, "export const garde = true;\n");
  d.commit("chore: garde");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n" });
  d.git("switch", "-q", "-C", LIVRAISON, "origin/sujet/lot");
  d.ecrire("docs/generes/garde.json", "export const garde = true;\n");
  d.git("rm", "-q", GARDE);
  d.commit("docs: index");
  d.git("push", "-q", "origin", `HEAD:refs/heads/${LIVRAISON}`);
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
  assert.deepEqual(d.journal(), []);
});

// Livraison intermédiaire d'un sujet qui change `docs/genere.json`, index généré sans `commande` (chaîne
// nue de la liste) que develop change aussi. Le premier passage la met à jour avec develop : le conflit,
// sur un index seul, prend la version de develop ; puis il s'arrête sur des checks rouges (sortie 3).
// `apres(d)` agit ensuite sur la livraison, avant le second passage, checks verts.
function livraisonIndexSansCommande(apres = () => {}) {
  const d = depotJouet();
  d.ecrire(
    "scripts/docs/index-generes.json",
    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "docs/genere.json"] }),
  );
  d.ecrire("docs/genere.json", "0\n");
  d.commit("docs: index sans commande");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n", "docs/genere.json": "sujet\n" });
  d.git("push", "-q", "origin", `origin/sujet/lot:refs/heads/${LIVRAISON}`);
  d.branche("develop", "origin/develop", { "docs/genere.json": "develop\n" }, "docs: genere (#39)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "FAILURE" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  const premier = d.lancer(script("passer.sh"), "40");
  assert.equal(premier.status, 3, premier.stdout + premier.stderr);
  assert.match(premier.stdout, /mise à jour poussée/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("show", `origin/${LIVRAISON}:docs/genere.json`), "develop", "version de develop prise au conflit");
  apres(d);
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } } });
  return d;
}

test("passer.sh : une livraison intermédiaire dont un index sans commande est celui de develop reste une livraison (sans revue)", () => {
  const d = livraisonIndexSansCommande();
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-list", "--parents", "-1", "origin/develop").split(" ").length, 3, "commit de merge : deux parents");
});

test("passer.sh : une livraison intermédiaire dont un index sans commande n'est pas celui de develop (autre contenu, ou retiré) repasse par la revue", () => {
  const gestes = {
    "autre contenu": (d) => d.branche(LIVRAISON, `origin/${LIVRAISON}`, { "docs/genere.json": '{"pirate":true}\n' }, "docs: genere"),
    retiré: (d) => {
      d.git("switch", "-q", "-C", LIVRAISON, `origin/${LIVRAISON}`);
      d.git("rm", "-q", "docs/genere.json");
      d.git("commit", "-q", "-m", "docs: genere retiré");
      d.git("push", "-q", "origin", `HEAD:refs/heads/${LIVRAISON}`);
    },
  };
  for (const [cas, geste] of Object.entries(gestes)) {
    const d = livraisonIndexSansCommande(geste);
    const avant = d.git("rev-parse", "origin/develop");
    const r = d.lancer(script("passer.sh"), "40");
    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, cas);
    d.git("fetch", "-q", "origin");
    assert.equal(d.git("rev-parse", "origin/develop"), avant, `${cas} : develop inchangé`);
  }
});

// Les outils de la chaîne copiés dans un dossier du jouet, `github.sh` sans `index_regeneres_regex` : une
// copie du capitaine plus ancienne que `sujet.sh` ou `passer.sh`. La liste des index régénérés ne se lit pas.
function outilsSansRegeneres(d) {
  const dossier = join(d.racine, "outils");
  mkdirSync(dossier);
  const outils = [["sujet", "sujet.sh"], ...["passer.sh", "github.sh", "revue-exigee.mjs", "migrations-ordre.mjs", "identifiant.mjs"].map((n) => ["fusionner", n])];
  for (const [skill, nom] of outils) {
    const texte = readFileSync(scriptDe(skill, nom), "utf8");
    writeFileSync(join(dossier, nom), nom === "github.sh" ? texte.replace(/\nindex_regeneres_regex\(\) \{\n[\s\S]*?\n\}\n/, "\n") : texte);
  }
  assert.doesNotMatch(readFileSync(join(dossier, "github.sh"), "utf8"), /index_regeneres_regex\(\)/);
  return dossier;
}

test("passer.sh : sans liste lisible des index régénérés, une livraison dont un index sans commande n'est pas celui de develop repasse par la revue", () => {
  const d = livraisonIndexSansCommande((d) => d.branche(LIVRAISON, `origin/${LIVRAISON}`, { "docs/genere.json": '{"pirate":true}\n' }, "docs: genere"));
  const r = d.lancer(join(outilsSansRegeneres(d), "passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
});
```

Puis à la fin de `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` :

```js

// Un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne, git le cite entre guillemets même sous
// `core.quotePath=false` (`"apps/…"`) : il exige la revue comme le chemin nu.
test('exigeRevue : un chemin de code que git cite entre guillemets l’exige aussi', () => {
  for (const cite of ['"apps/api/migrations/2026\\"x.ts"', '"apps/api/migrations/2026\\\\x.ts"', '"scripts/verify/gate\\tx.mjs"', '"packages/a\\nb.ts"'])
    assert.equal(exigeRevue([cite]), true, cite);
  assert.equal(exigeRevue(['"docs/a\\"b.md"']), false);
});
```

### 8. Les textes, mot pour mot

- **`skills/chaine/sujet/SKILL.md`**, § « Commandes » : après « Un conflit hors index reste un renvoi (sortie 3). », sur la même ligne, ajouter :

```text
 Un conflit de code entre le sujet et develop (`rafraichir`, sortie 2 ; `SUJET EN CONFLIT` de la boucle) ne se pousse pas : une session fille, lancée pour ce geste (jamais le conducteur ni le capitaine), le résout dans une **PR de mise à jour** : `git fetch origin develop sujet/<nom>`, `git switch -c maj/<nom> origin/sujet/<nom>`, `git merge origin/develop`, conflit résolu puis `git add <fichiers résolus>` (un index généré en conflit ne s'édite pas : `git checkout --theirs -- <index>`, puis `git add <index>`, le capitaine le régénère), `git commit --no-edit`, push de la branche, PR vers `sujet/<nom>` titrée `chore(sujet): met <nom> à jour avec develop`, `à-fusionner`. `fusionner` la fait entrer par avance rapide, sans squash : la filiation de develop reste, et le capitaine ferme la PR en nommant le sommet. Elle n'entre que si elle n'apporte que cette fusion (message de git, sans ligne `Sujet:`), le sommet du sujet en premier parent et en second un commit de develop absent du sujet, et n'écrit que dans les fichiers en conflit (et les index qui ont une `commande`, régénérés) ; sinon sortie 4, motif à la session. Sa revue exigée porte sur ce qu'elle écrit et sur les fichiers en conflit (`git show --remerge-diff <sommet>`) : comme pour une sous-PR, une résolution hors de `apps/`, `packages/` et `scripts/` (un workflow, une ligne `Gel:` ou `Dépendances:` en conflit) n'en exige pas. Un sujet qui bouge pendant l'avance la laisse dehors (sortie 5, rien d'écrasé, jamais de force) ; un échec côté capitaine (git, dépendances, régénération, push) sort en 11, sans renvoi.
```

- **`skills/chaine/sujet/references/CONTENU.md`** :
  - après le paragraphe qui commence par « `carte <nom>` est, avec `geler` et `degeler` » (il finit par « pour citer celui-ci. »), une ligne vide puis ce paragraphe :

```text
La PR de mise à jour (`fusionner`) fait entrer dans un sujet la résolution d'un conflit de code avec develop : `rafraichir` s'arrête sur ce conflit (sortie 2), la session ne pousse pas le sujet, et le squash d'une telle PR perdait la filiation de develop. Elle passe par le capitaine, comme toute sous-PR (gel, titre, revue, checks exigés), puis entre par un `git push` simple du sommet de la PR sur le sujet (avance rapide), et le capitaine ferme la PR. La forme est vérifiée : un seul commit hors du sujet et de develop, au message sans ligne `Sujet:` ni `Merge pull request` (`sujet_livre` les lit dans les fusions de develop), une fusion dont le premier parent est le sommet du sujet et le second un commit de develop, un arbre qui ne s'écarte de la fusion recalculée par `git merge-tree` (git ≥ 2.38, comme `passer.sh`) que sur les fichiers en conflit et les index générés qui ont une `commande` (régénérés, donc écrasés ; un index sans commande ne l'est jamais). L'écart se lit sans détection des renommages : sinon un conflit renommage/renommage laissait recréer le chemin d'origine avec le contenu d'un script de garde et supprimer ce script, la suppression cachée derrière le chemin recréé. La revue exigée lit l'écart et les fichiers en conflit : un conflit modifier/supprimer ou binaire dont la résolution garde la version du sujet ne fait aucun écart. Une liste des index régénérés illisible sort en 11, jamais une garde ouverte. Elle n'ouvre rien que `fusionner` n'ouvrait : une sous-PR aux checks verts et revue entrait déjà, squashée, avec un contenu quelconque ; la PR de mise à jour n'apporte que develop et la résolution des fichiers en conflit, et un sujet qui bouge refuse son push (sortie 5). Un outil du capitaine en échec sort en 11 : la boucle le dit (`ÉCHEC DU CAPITAINE`) et ne renvoie pas la PR, car le conseil d'un renvoi (« fusionner le sujet dans la branche ») lui ferait une seconde fusion, refusée ensuite. Le hook d'agent ne change pas : il ne lit pas le `git push` de `sujet.sh`, et refuse toujours le push d'une session vers `sujet/…`. Pas d'option `rafraichir --depuis <branche>` : le hook la laisserait lancer par toute session, sans checks ni revue. La revue exigée d'une sous-PR se lit de même sans renommage et sans guillemets (`core.quotePath=false`) : un script déplacé hors de `scripts/`, ou un fichier de code à nom accentué, que git citait entre guillemets, l'exigent ; un chemin que git cite encore (`"`, `\`, tabulation, saut de ligne) est pris par `revue-exigee.mjs`, qui admet le guillemet de tête.
```

  - dans le paragraphe de `depot-jouet.mjs` et `faux-gh.mjs`, « Le faux `gh` sérialise ses appels » devient « Il applique `base` et `state` d'un `PATCH pulls/<n>` (reciblage, fermeture). Le faux `gh` sérialise ses appels ».
- **`skills/chaine/fusionner/SKILL.md:60`** :
  - après « elle repasse au tour suivant, CI verte. », sur la même ligne, ajouter :

```text
 Une PR de mise à jour d'un sujet (sa tête n'apporte que la fusion de develop, conflit résolu par une session fille : en-tête de `sujet.sh`) entre par avance rapide, sans squash, et le capitaine la ferme (`FUSIONNÉE`) ; d'une autre forme, elle est renvoyée avec son motif (sortie 4) ; un échec de ses outils (git sans `merge-tree --write-tree`, dépendances, régénération, push refusé) sort en 11, `ÉCHEC DU CAPITAINE`, sans renvoi : le capitaine lit la cause et la corrige chez lui.
```

  - dans le filtre du `Monitor`, `|LIVRÉ|REFUS|PAS PROPRE\`` devient `|LIVRÉ|REFUS|PAS PROPRE|ÉCHEC DU CAPITAINE\``.
- **`skills/chaine/fusionner/references/CONTENU.md`** :
  - `:17` (`passer.sh`), « aux index générés près : vrai après la mise à jour » devient « aux index générés près (écart lu sans détection des renommages : une suppression ne se cache pas derrière un index ajouté ; un index sans `commande`, jamais régénéré, seulement s'il est celui de develop) : vrai après la mise à jour » ;
  - `:45`, « checks exigés rouges ou non exigés, renvoi, titre trop long, boucle qui renvoie et saute. » devient :

```text
checks exigés rouges ou non exigés, renvoi, titre trop long, boucle qui renvoie et saute, revue exigée lue sans renommage ni guillemets (script déplacé hors de `scripts/`, code à nom accentué), livraison intermédiaire dont une suppression se cache derrière un index généré ajouté renvoyée à la revue, livraison dont un index sans `commande` est celui de develop dispensée, d'un autre contenu ou retiré renvoyée à la revue, et de même quand la liste des index régénérés ne se lit pas ; `revue-exigee.test.mjs` : un chemin de code cité entre guillemets par git exige la revue.
```

  - `:45` encore, « le worktree du capitaine pas propre (sortie 6, aucun renvoi). » (fin de la phrase sur `sujet-fusionner.test.mjs`) devient :

```text
le worktree du capitaine pas propre (sortie 6, aucun renvoi) ; la PR de mise à jour d'un sujet entrée par avance rapide (develop en second parent, index régénérés, aucun squash, PR fermée), refusée (sortie 4, sujet inchangé) quand elle écrit hors des fichiers en conflit (ligne `Dépendances:`, suppression cachée derrière un renommage, index sans commande), quand le sujet a avancé, quand develop est son premier parent, quand son message porte une ligne `Sujet:` ou `Merge pull request` ou quand sa résolution de code n'a pas de revue (chemin cité par git, conflit modifier/supprimer ou binaire gardé compris), d'un sujet gelé (sortie 7), jamais poussée sur un sujet qui bouge (sortie 5, le commit de l'autre session reste), un git sans `merge-tree --write-tree` (sortie 11, la boucle ne la renvoie pas), une liste des index régénérés illisible (sortie 11) et un projet sans index généré (rien n'y est dispensé), passée par la boucle (`FUSIONNÉE`) ; une sous-PR qui déplace un script hors de `scripts/` exige la revue.
```

- **`skills/chaine/chantier/SKILL.md:96`** : après « c'est le moment de recevoir develop. », sur la même ligne, ajouter :

```text
 Conflit de code (sortie 2) : `git merge --abort`, puis il lance une session fille pour ce geste, qui ouvre la PR de mise à jour du sujet (en-tête de `sujet.sh`) ; il ne résout jamais lui-même. Le capitaine la fait entrer avant la vague suivante.
```

### 9. La version : `.claude-plugin/plugin.json:3`

Mineure (décision 13). Rien d'autre ne change dans ce fichier.

## Surfaces

| Surface | Preuve |
| --- | --- |
| PR de mise à jour entrée par avance rapide, develop en second parent, index régénérés, aucun squash, PR fermée | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une PR de mise à jour entre dans le sujet par avance rapide, develop pour parent, index régénérés, aucun squash, PR fermée » |
| rien hors des fichiers en conflit (ligne `Dépendances:` d'un ticket) | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une PR de mise à jour qui écrit hors des fichiers en conflit (ligne Dépendances: d'un ticket) sort en 4, sujet inchangé » |
| forme vérifiée : sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire, commit de plus | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire, commit de plus) » |
| liste des index régénérés illisible : sortie 11 ; projet sans index généré : la PR entre, rien n'y est dispensé | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une PR de mise à jour sans liste lisible des index régénérés sort en 11 ; un projet sans index généré passe, et rien n'y est dispensé » |
| livraison : liste des index régénérés illisible, revue exigée | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : sans liste lisible des index régénérés, une livraison dont un index sans commande n'est pas celui de develop repasse par la revue » |
| un chemin de code cité entre guillemets par git exige la revue | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : un chemin de code que git cite entre guillemets l’exige aussi » |
| sujet gelé : sortie 7 | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une PR de mise à jour d'un sujet gelé sort en 7, sans rien écrire » |
| monotonie : jamais de force ni de réécriture du sujet | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une PR de mise à jour ne réécrit jamais le sujet, un sujet qui bouge pendant le push la laisse dehors (sortie 5) » |
| échec du capitaine : sortie 11, aucun renvoi (M1) | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : un échec du capitaine (git sans merge-tree --write-tree) sort en 11, et la boucle ne renvoie pas la PR » |
| la boucle la fait entrer et la ferme (M6) | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « boucle.sh : une PR de mise à jour prête est fusionnée (FUSIONNÉE), sans renvoi, et fermée » |
| revue d'une sous-PR lue sans renommage (`S:555`) | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une sous-PR qui déplace un script hors de scripts/ exige la revue (renommage lu comme suppression et ajout) » |
| revue d'une PR vers develop lue sans renommage ni guillemets (`P:147`) | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : la revue exigée lit les chemins sans renommage ni guillemets (script déplacé hors de scripts/, code à nom accentué) » |
| livraison intermédiaire lue sans renommage (`P:115`) | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une livraison intermédiaire qui supprime un fichier derrière un index généré renommé repasse par la revue » |
| livraison : un index sans `commande` qui est celui de develop reste dispensé (`P:116`) | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une livraison intermédiaire dont un index sans commande est celui de develop reste une livraison (sans revue) » |
| livraison : un index sans `commande` d'un autre contenu, ou retiré, va à la revue (`P:116`) | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une livraison intermédiaire dont un index sans commande n'est pas celui de develop (autre contenu, ou retiré) repasse par la revue » |
| monotonie : les hooks d'agent refusent toujours le push d'une session vers un sujet et tout push forcé | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « tout push forcé est refusé, sur toute branche et sous toute forme ; la consigne de sujet.sh demarrer passe », « tout git push vers un sujet est refusé, quelle que soit la branche, et le refus indique sujet.sh carte », inchangés et verts ; `git diff origin/main --stat -- 'skills/chaine/socle-chaine-de-production/references/agent/'` est vide |
| sous-PR ordinaire, livraisons, `passer.sh` : comme avant | les tests existants de `sujet-fusionner.test.mjs` et `fusionner.test.mjs`, inchangés et verts |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit |

## Vérification

Joué le 2026-11-14 dans un `git worktree` jetable de `2826309`, §§ 1-9 appliqués mot pour mot, `TMPDIR` sous un dossier jetable :

- `pnpm install --frozen-lockfile && pnpm test` : **499 sur 499** (484 + 15). Sur `2826309` sans rien : 484 sur 484. La rédaction d'avant, appliquée sur `2826309` : 489 sur 489.
- Les quinze tests nouveaux sur le code de `origin/main` (`sujet.sh`, `boucle.sh`, `passer.sh`, `github.sh`, `revue-exigee.mjs` et `faux-gh.mjs` remis) : **treize `not ok`**, les soixante et un autres des trois fichiers verts. Le « sujet gelé » et la livraison « dont un index sans commande est celui de develop » sont verts dès `main` ; la seconde rougit sous la variante stricte, jouée en mutation (sortie 4 au lieu de 0). La livraison « n'est pas celui de develop » sort en 0 au lieu de 4 sur `main`, pour chacun de ses deux cas joué seul. Les trois tests de lecture sans renommage y sortent en 0 au lieu de 4 : sous-PR squashée sans revue, PR vers develop fusionnée sans revue (déplacement, puis nom accentué, chaque cas joué seul), livraison fusionnée sans revue. Avec le code : verts.
- Sur le code de la rédaction d'avant (496 verts) : `exigeRevue` des quatre chemins cités, les cas « chemin cité », « modifier/supprimer » et « binaire » du troisième test (chacun seul : sortie 0 au lieu de 4), la liste illisible dans `sujet.sh` (sortie 0 au lieu de 11, la ligne `Dépendances:` entrée) et dans `passer.sh` (sortie 0 au lieu de 4) : rouges.
- Les cas B1, B2 et les deux messages forgés du troisième test, chacun seul, sur le code de la rédaction d'avant : rouges (sortie 0). Les quatre autres cas y étaient verts.
- `decisionCommande` sur la recette de la décision 1 : tout passe. Les commandes : `git fetch origin develop sujet/lot`, `git switch -c maj/lot origin/sujet/lot`, `git merge origin/develop`, `git checkout --theirs -- docs/adr/README.md`, `git merge --abort`, `git commit --no-edit`, `git push origin HEAD:maj/lot`, `bash scripts/chaine/sujet.sh fusionner 81`. `git push origin maj/lot:sujet/lot` et `git push --force-with-lease origin HEAD:maj/lot` : refusés.

**Non joué** :

- **GitHub réel** : qu'il marque la PR fusionnée, ou accepte `state=closed`, une fois son sommet dans le sujet. Le faux `gh` applique le `PATCH`. Si `gh` refuse, `avancer_sujet` le dit (« PR NON fermée ») et sort quand même en 0 : le sujet a avancé.
- `shellcheck`, absent du poste.
- Un vrai git antérieur à 2.38 : simulé par le faux `git` du test (sortie 11).

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 15**.
2. Contrôles du diff :
   - `git diff origin/main --stat -- '*.test.mjs'` ne montre que `sujet-fusionner.test.mjs`, `fusionner.test.mjs` et `revue-exigee.test.mjs` ;
   - `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0 ;
   - `git diff origin/main --stat -- skills/chaine/socle-chaine-de-production/references/agent/` est vide.
3. `bash -n skills/chaine/sujet/scripts/sujet.sh skills/chaine/fusionner/scripts/boucle.sh skills/chaine/fusionner/scripts/passer.sh skills/chaine/fusionner/scripts/github.sh` : rien.
4. Revue de ticket, puis `/security-review` sur la branche : la voie nouvelle écrit sur un sujet. Leurs sections vont dans le corps de la PR.
5. La PR vise `main`, titre `feat(chaine): une PR de mise à jour fait entrer dans le sujet la résolution d'un conflit avec develop (plugin <version>)`. La session :
   - part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier ;
   - commite sous les hooks, jamais `--no-verify` ;
   - ouvre sa PR hors brouillon, **sans poser `à-fusionner`** (`Label: contre-revue`) ;
   - écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- **Ticket 37** : la sortie 2 de `sujet.sh fusionner` reste « sous-PR non éligible » dans `B:300`, sans renvoi ni message. C'est le cas d'une sous-PR ordinaire qui apporte du develop plus récent sur un sujet en conflit avec develop, et d'une PR de mise à jour suivie d'un commit de plus.
- **Ticket 38** : la revue adversariale d'une fusion par `git show --remerge-diff`. `diff-revue.sh` donne aujourd'hui le diff de la PR contre sa base, donc tout le develop apporté.
- **Ticket 39** (l'architecte l'écrit) :
  - `.github/workflows/`, `.husky/`, `.claude/settings.json` et le `package.json` racine ne sont pas du code pour `revue-exigee.mjs` : une sous-PR ordinaire comme une résolution y entrent sans revue ;
  - la casse : `Apps/…` n'est pas du code pour `CHEMINS_CODE` ;
  - `chemins-sensibles.mjs` lit aussi des chemins que git peut citer entre guillemets ;
  - le capitaine exécute `pnpm install` et les hooks git du sommet de la PR (`avancer_sujet`, comme `passer.sh` et `rafraichir`).
  - **Limite** : dans une livraison intermédiaire, un index généré déclaré par motif et qui a une `commande` reste dispensé, et sa régénération ne retire pas un fichier en trop sous ce motif (`apps/gen/pirate.ts` sous `apps/gen/*.ts`). Aucun projet connu n'a de tel motif.
- **`A/regles.mjs`** : aucun motif nouveau (décision de l'architecte après la PR 89). `garde-github` reste tel quel.
- **Une protection de `sujet/*` côté GitHub**, seule vraie frontière (`CONTENU.md` du socle).
- **Les dépôts de projet** : reposer `scripts/chaine/` est leur affaire.

## Comments

- 2026-11-14 — **Fait** : PR 93, fusionnée `fa7d3eb`, plugin 7.9.0. Contre-relue conforme (aucune bloquante ; ses attaques propres refusées). Restes portés au ticket 39 : lien symbolique sur un index généré qui fait écrire la régénération hors du dépôt (déjà vrai pour `rafraichir`), `commande` d'index exécutée chez le capitaine. « PR de mise à jour » à porter au glossaire du plugin.
- 2026-11-14 — **Décisions de l'architecte sur les trois choix laissés ouverts après correction** : (1) un index généré sans `commande` dans `livraison_intermediaire` (`passer.sh`) n'est dispensé de revue que si son contenu est celui d'`origin/develop` (même blob : `git rev-parse <sommet>:<chemin>` égal à `git rev-parse origin/develop:<chemin>`) — c'est le cas légitime, où `passer.sh` a pris la version de develop d'un tel index en conflit ; tout autre contenu va à la revue, comme B2 ; test des deux sens, vus rouges ; (2) sortie 11 sans renvoi de la PR, même quand la cause peut venir de la résolution : gardé, le capitaine lit la cause et le dit ; (3) fermeture de la PR juste après l'avance : gardé. Les deux trous vivants trouvés en chemin (`passer.sh:147` et `sujet.sh:555` : un script déplacé de `scripts/` vers `docs/`, ou un chemin à accent cité entre guillemets par git, échappait à la revue) sont la raison d'aller vite sur ce ticket.
- 2026-11-14 — **Décisions de l'architecte** sur les questions du rédacteur : (1) `--depuis` écarté au profit de la PR de mise à jour, qui passe par les mêmes contrôles que toute sous-PR (gel, titre, commitlint, revue, checks exigés) — l'option aurait ouvert une écriture dans le sujet sans revue ; (2) la PR de mise à jour est ouverte par une session fille lancée pour ce geste, jamais par le conducteur, qui ne code pas ; (3) sujet gelé : la PR de mise à jour sort en 7 comme toute sous-PR, on garde (le gel suspend toute entrée ; `rafraichir` du capitaine reste la voie sans conflit) ; (4) second parent : tout commit atteignable depuis `origin/develop` et absent du sujet, pas forcément son sommet ; (5) deux tickets à part : la sortie 2 silencieuse de `boucle.sh` (renvoi sans message) et la revue adversariale d'une fusion (montrer `git show --remerge-diff` plutôt que tout le develop apporté). `main` a bougé depuis l'écriture : `2826309`, plugin 7.8.2, 484 tests — la version visée reste la mineure suivante (7.9.0), le compte attendu devient 489 ; `depot-jouet.mjs` du skill `sujet` et `passer.sh` ont changé (PR 92), à revérifier.
- 2026-11-14 — Instruit sur `ce61357` (plugin 7.8.0, 467 tests).
  - Manque reproduit sur le dépôt jouet : rafraîchir relancé perd la résolution, `fusionner` d'une PR de mise à jour sort en 2 ou en 4, le squash perd la filiation.
  - Le hook laisse passer `sujet.sh rafraichir … --depuis …`.
  - Proposition `--depuis` écartée au profit de la PR de mise à jour dans `fusionner` (décision 1).
  - Joué : 472 sur 472, cinq rouges sans le code.
- 2026-11-14 — **Corrigé après relecture** (agent neuf, opus, sur `2826309` : pas prêt, deux bloquantes). Rejoué sur `2826309` (plugin 7.8.2, 484 tests) :
  - B1 : l'écart se lit `--no-renames`, un script supprimé derrière un chemin en conflit recréé est vu ;
  - B2 : seuls les index qui ont une `commande` sont dispensés du filtre « hors conflit », et `RESOLUTION` les compte pour la revue ;
  - ajout de l'architecte : `passer.sh:115` (livraison) et `:147` (revue), et `sujet.sh:555` (revue d'une sous-PR), lus sans renommage ni guillemets, chacun prouvé rouge sur `main` (sortie 0 au lieu de 4) ; relevé des autres lectures dans « Où » ;
  - M1 : sortie 11 sans renvoi, faux `git` ; M2 et M3 : la recette (titre, `git fetch`, index en conflit) ; M4 : message de la fusion sans `Sujet:` ni `Merge pull request` ; M5 : dit en décision 4 ; M6 : le capitaine ferme la PR après l'entrée, le faux `gh` applique `state` ;
  - décisions de l'architecte portées dans le corps : session fille lancée pour ce geste, second parent, test du gel, tickets 37 et 38.
  - Joué : 494 sur 494 (484 + 10), neuf rouges sur `main`, le gel vert dès `main` (garde) ; B1, B2 et M4 rouges sur la rédaction d'avant.
- 2026-11-14 — **Porté après la décision (1) de l'architecte** : dans `livraison_intermediaire`, un index sans `commande` n'est dispensé de revue que si son blob au sommet est celui d'`origin/develop` (décision 14, `P:116`) ; `index_regeneres_regex` passe de `sujet.sh` à `github.sh`, partagé. Deux tests de livraison dans `fusionner.test.mjs` : « n'est pas celui de develop » (autre contenu, retiré) rouge sur `main` (sortie 0 au lieu de 4) ; « est celui de develop » vert sur `main` et rouge sous la variante stricte jouée en mutation. Joué sur un worktree neuf de `2826309`, ticket appliqué mot pour mot : 496 sur 496 (484 + 12), dix rouges sur `main`.
- 2026-11-14 — **Corrigé après la seconde relecture** (agent neuf, opus, sur `2826309` : pas prêt, deux bloquantes, correctifs du relecteur retenus par l'architecte) :
  - B1 : `CHEMINS_CODE = /^"?(apps|packages|scripts)\//` dans `revue-exigee.mjs`, un chemin cité par git reste du code ; vérifié que `merge-tree --name-only` et `diff --name-only` le citent de même (`"apps/q\"x.ts"`) ;
  - B2 : `RESOLUTION` porte l'écart et les fichiers en conflit (modifier/supprimer, binaire) ;
  - mineures : liste des index régénérés illisible, sortie 11 dans `sujet.sh` et revue exigée dans `passer.sh`, projet sans index généré joué dans les deux sens (`^()$`) ; `git add` dans la recette ; la limite des index par motif et les sujets du ticket 39 en Hors périmètre.
  - Joué sur un worktree neuf de `2826309`, ticket appliqué mot pour mot : 499 sur 499 (484 + 15), treize rouges sur `main`, les nouveautés rouges sur la rédaction d'avant.
