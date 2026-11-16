# `sujet.sh clore <nom>` supprime la branche d'un sujet livré, sans option de force : sommet contenu dans develop, aucune PR ouverte, carte livrée, sommet relu juste avant, refus du distant dit

Status: ready-for-agent
Type: feature
Label: contre-revue
Modèle: sonnet — la fonction, ses refus et ses codes sont donnés ci-dessous en diff ; le banc est donné entier, les textes mot pour mot ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification ») ; rien n'est à concevoir. La revue passe `/security-review`.
Blocked by: 40 (`skills/chaine/sujet/scripts/sujet.sh`), 41 (`skills/chaine/fusionner/SKILL.md`)
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/sujet-clore.test.mjs` (créé), `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `scripts/poses.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait.** Aucune voie ne supprime un sujet livré. `sujet.sh` n'a pas de commande de suppression ; la garde d'agent refuse `git push origin --delete sujet/x`, `git push origin :sujet/x` et `gh api -X DELETE …/git/refs/heads/sujet/x`, à raison (une session qui écrit sur un sujet s'autorise elle-même la ligne `Dépendances:`) ; un script, lui, n'est pas lu par la garde. GitHub supprime seul la tête d'une PR fusionnée (`delete_branch_on_merge`, constaté sur `fedora` #1909 : le sujet, tête de sa PR finale, a disparu). Reste ce que GitHub ne supprime pas : un sujet livré par une **livraison intermédiaire** (`livraison/<nom>-<date>`, `sujet.sh:795` : la PR part d'une branche jetable, le sujet survit) ou avant ce réglage. `chantier/SKILL.md:117` renvoie aujourd'hui ce reste « d'un poste local, jamais d'une session cloud, le proxy refuse la suppression ».

**La décision de l'architecte (A-49, `map.md`, 2026-11-16).** `sujet.sh clore <nom>` supprime une branche de sujet livrée, sans aucune option de force : refus si le sommet distant n'est pas contenu dans `origin/develop`, si une PR ouverte a le sujet pour base ou pour tête, ou si la carte ne le dit pas livré ; sommet relu juste avant la suppression ; refus du distant → sortie dite, « à jouer d'un poste local ». Raison : la garde refuse toute écriture sur `sujet/*` pour une session ; un script vérifié est la voie du skill, et l'intangible « jamais de push forcé » reste entier.

Quand le ticket est fait : sur le dépôt jouet, `sujet.sh clore demo` supprime `origin/sujet/demo` d'un sujet livré et rien d'autre ; chaque refus sort avec son code et sans rien supprimer ; un sujet qui avance entre la lecture et la suppression n'est pas supprimé ; un distant ou un hook qui refuse laisse la branche et dit de la supprimer d'un poste local ; le corps de la fonction ne contient aucune option de force.

## Où

Base : `origin/main` à `76d90c7` (plugin **7.9.1**, **528 tests**). Les lignes ont été relevées le 2026-11-16 sur cette base ; la session les retrouve par leur texte (le ticket 40 déplace `sujet.sh`).

### Les faits, à la source

- **`skills/chaine/sujet/scripts/sujet.sh`** : commandes décrites en en-tête (:7-70), codes de sortie (:71-82), aiguillage (:1111-1117, `case "$commande"`, le `*)` imprime l'en-tête et sort en 4). Aucune commande ne supprime. `livrer` (:771-806) : en livraison intermédiaire (carte avant `5-livraison`), la PR part de `livraison/<nom>-<date>` poussée par `pousser` (:791) et **le sujet survit**. `sujet_livre` (:225, quatre lectures de `origin/develop` par son nom court : un tag ou une branche locale du même nom la masquerait) : la carte lue sur `origin/develop`, `Phase: 6-nettoyage` ou `fini`, donne le sujet livré ; sans carte, la branche doit être absente **et** develop porter son commit de merge. `carte_sujet` (:1063) est le seul modèle d'un geste d'écriture d'une session sur un sujet.
- **`pousser`** (`fusionner/scripts/github.sh:107`) : `git push -q origin <refspec>` sous les hooks git, jamais en les sautant ; en échec, il relit le distant : sommet changé → sortie 5, sommet inchangé → sortie 3 (« refusé par le hook pre-push (ou le distant) »). Il ne passe aucune option, mais `clore` ne l'emploie pas (décision 13).
- **GitHub** : `sujet.sh` n'interroge que `gh api` en REST (GraphQL est refusé depuis le cloud). `livrer` (:781) compte les PR ouvertes dont le sujet est la **base** : `gh api "$DEPOT/pulls?state=open&base=$(uri "$branche")"` ; l'idiome pour la **tête** existe dans `passer.sh:149` et `file.sh:146` : `…pulls?…&head={owner}:$(uri "$base")`. Dans les bancs, le faux `gh` (`faux-gh.mjs:151-158`) filtre `state`, `base` et `head` ; `--paginate` est déjà employé avec lui (`sujet.sh:839`, `:907`).
- **La garde d'agent** (`socle-chaine-de-production/references/agent/regles.mjs`) : `RAISON_PUSH_SUJET` (:159), `pousseSurUnSujet` (:361), `decisionCommande` (:427, refus :435-436), routes `gh` en écriture (`CHEMIN_GH_ECRIT`, :546). Joué sur `fa7d3eb`, rejoué sur `76d90c7` : `git push origin --delete sujet/demo`, `git push origin :sujet/demo`, `git push origin :refs/heads/sujet/demo` sont refusés ; `bash scripts/chaine/sujet.sh clore demo` et `… clore demo --force` passent (la décision rend `null` : le hook ne lit pas ce que fait un script).
- **Le pre-push du socle** (`skills/monorepo/socle-monorepo/references/husky/pre-push`) : il lit ses refs sur l'entrée standard ; une suppression a un sha local nul, `rien_de_neuf` la compte (`lues`) sans commit à contrôler, et sort 0 **sans jouer `pnpm run check`**. Joué sur un dépôt jetable avec un faux `pnpm` qui échoue : `git push origin :refs/heads/sujet/x` sort 0, le faux `pnpm` n'est pas appelé, la branche disparaît ; un push d'un commit neuf, lui, joue `pnpm run check` (et échoue). Une suppression passe donc le hook du socle ; le hook d'un projet qui ajoute ses propres contrôles peut la refuser : sortie 3.
- **Le proxy des sessions cloud** : `chantier/SKILL.md:117` et `fusionner/SKILL.md:77` disent qu'il refuse la suppression. Non rejoué ici (voir « Vérification »).

### Ce que `sujet_livre` ne couvre pas

Sans carte, `sujet_livre` répond « pas livré » tant que la branche existe (:225 et suivantes : la branche présente fait sortir 1) : **un sujet sans carte ne se clôt donc pas** par cette commande. C'est voulu : rien ne prouve alors qu'il est livré, hors le test d'ascendance, qui est nécessaire mais pas suffisant (un sujet dont le sommet est contenu dans develop parce qu'il n'a jamais rien porté, par exemple). Le reste se supprime d'un poste local, comme aujourd'hui.

## Décisions

1. **Une commande, `sujet.sh clore <nom>`, dans `sujet.sh`.** Aucune écriture avant que tous les refus soient levés. L'ordre des contrôles, du moins cher au plus cher : nom et options (4) · branche absente de `origin` (0) · fetch de develop et du sujet (11 si en échec) · sommet contenu dans `refs/remotes/origin/develop`, par `git merge-base --is-ancestor` (4 ; 11 si git échoue autrement) · PR ouvertes qui ont le sujet pour base ou pour tête (4 ; 11 si GitHub est illisible) · `sujet_livre` (4) · sommet postérieur au passage de la carte en `6-nettoyage` ou `fini` (4, décision 14) · relecture du sommet distant (5 s'il a bougé) · suppression, puis relecture de `origin` (0, 3, 5 ou 11). Les références se lisent en toutes lettres, décision 12.
2. **Un seul critère de livraison : `sujet_livre`**, appelé **après** le test d'ascendance. La demande y ajoutait « ou la phase de la carte » : `phase_carte` lit la branche du sujet d'abord, puis develop. Quand le sommet est contenu dans develop, la carte de la branche est celle de develop ou plus ancienne, et la carte de develop est ce que lit `sujet_livre` : `phase_carte` n'ajoute aucun cas, et lirait la carte de la branche, que le conducteur peut avoir poussée par `carte <nom>` sans livraison. Une seule source.
3. **Les PR ouvertes se lisent par deux requêtes REST** (`base=sujet/<nom>`, puis `head={owner}:sujet/<nom>`), `--paginate`, `per_page=100`. Une PR ouverte, de base ou de tête, refuse (4) et les numéros sont dits. Une PR fermée ne compte pas. Les deux requêtes se jouent dans un même sous-shell : si l'une échoue, aucune liste partielle ne conclut « rien d'ouvert » (11, rien n'est supprimé).
4. **Jamais d'option de force.** La suppression est `jouer_ou_dire "git push -q origin :refs/heads/$branche"` : un `git push -q origin :refs/heads/sujet/<nom>` sous les hooks, que `clore` joue lui-même (`pousser` rend 5 aussi quand la relecture du distant échoue, ce qui dirait « a bougé » d'une suppression peut-être faite : décision 13). Ni `--force`, ni `--force-with-lease` (un push forcé : l'intangible du produit), ni `--delete`, ni refspec `+` au push. Une option ou un argument de trop sort en 4. Un banc lit le corps de la fonction et refuse ces formes.
5. **La course, et ce qu'on n'en ferme pas.** Le sommet est lu au fetch, puis relu par `git ls-remote` juste avant le push : un sujet qui a bougé sort en 5, rien n'est supprimé. Si le sujet bouge **pendant** le push (le hook pre-push peut durer), `clore` le voit à la relecture qui suit le push (sommet changé → 5). Reste une fenêtre d'un aller-retour réseau entre la relecture et l'exécution du push : un `git push` de suppression n'a **aucune condition sur la valeur supprimée**, et la seule condition que git offre (`--force-with-lease=<ref>:<sha>`) est un push forcé, que le produit interdit. La fenêtre n'est pas fermée ; elle est documentée (`CONTENU.md`) et le sujet n'est écrit que par les scripts de la chaîne, sous le capitaine, ce qui la rend étroite. Les commits que ce push ferait perdre sont ceux d'un sujet déjà entièrement contenu dans develop plus ceux poussés dans cette fenêtre.
6. **Codes de sortie** (les mêmes sens que le reste de `sujet.sh`) : **0** supprimé, ou branche déjà absente (le but est atteint, `clore` se rejoue) ; **3** suppression refusée, par un hook git ou par le distant (protection de branche, proxy) : on ne les distingue pas (`pousser` ne le fait pas non plus : 3 « refusé par le hook pre-push (ou le distant) »), la sortie du push va sur stderr, la branche reste, le message dit « à jouer d'un poste local : `git push origin :refs/heads/sujet/<nom>` » ; **4** refus corrigeable (nom illisible, option, sommet hors de develop, PR ouverte, carte qui ne dit pas livré) ; **5** le sommet a bougé ; **11** `origin` ou GitHub illisible, outil en échec, ou suppression non confirmée (la relecture de `origin` après le push échoue) : même sens que le 11 de `fusionner`, rien à corriger côté sujet ; 69 `jq` absent, comme partout.
7. **Une suppression qui « réussit » mais laisse la branche** (un proxy qui avale la commande) : relue après le push, sortie 3, message « à jouer d'un poste local ».
8. **La garde d'agent ne change pas de motif.** Elle refuse toujours `git push --delete`, `:sujet/…` et `gh api -X DELETE` ; seul le texte du refus (`RAISON_PUSH_SUJET`) cite `clore`, pour que la session qui s'est fait refuser trouve la voie. Un test le prouve, ainsi que le laissez-passer de `bash scripts/chaine/sujet.sh clore …`.
9. **Qui l'appelle.** La session qui nettoie (`chantier/SKILL.md` § 7, point 4) ou l'architecte, à la main. Aucun automatisme : `boucle.sh` n'appelle pas `clore`.
10. **Version : mineure** (`.claude-plugin/plugin.json:3`, 7.9.1 → 7.10.0 aujourd'hui, à recaler sur `origin/main` : 40 passe avant). Deux raisons, chacune suffit : une commande s'ajoute à un script que `poser` copie chez un projet, et un fichier de banc est ajouté à ce que `poser` copie (`sujet-clore.test.mjs`).
11. **`Blocked by: 40, 41`** : 40 modifie `sujet.sh` ; 41 modifie `fusionner/SKILL.md`, que ce ticket touche aussi (ligne 77). La demande n'indiquait que 40 : 41 est ajouté pour ne pas ouvrir deux PR sur un même fichier de documentation dans la même vague.
12. **Les références se lisent en toutes lettres.** `clore` ne lit jamais `origin/develop` ni `origin/sujet/<nom>` par leur nom court : un tag, ou une branche locale, nommé `origin/develop` passe devant `refs/remotes/origin/develop` dans la résolution des noms de git et ferait croire un sujet contenu dans develop. `clore` récupère les deux branches par un refspec explicite (`+refs/heads/develop:refs/remotes/origin/develop`, `+refs/heads/<branche>:refs/remotes/origin/<branche>`) et lit `refs/remotes/origin/develop` (ascendance, comptage), `refs/remotes/origin/<branche>^{commit}` (sommet) ; **`sujet_livre` aussi**, que `clore` appelle : ses quatre lectures de `origin/develop` passent à `refs/remotes/origin/develop` (même résultat hors masquage ; les commandes `livre`, `demarrer`, `regrouper` et `file.sh` en profitent). Test : un tag et une branche locale `origin/develop`, un tag `origin/sujet/demo`, posés pour masquer le distant, sur un sujet pas livré puis sur un sujet livré dont la carte de develop ne dit pas livré : refus (4) dans les deux cas.
13. **La suppression est jouée par `clore`, pas par `pousser`, et le distant a le dernier mot.** Quel que soit le code du push, `clore` relit `origin` : branche absente → supprimée (« supprimée » si le push a réussi, « n'est plus sur origin » s'il a échoué : quelqu'un d'autre l'a retirée) ; sommet changé → 5 ; sommet inchangé → 3 (refusée ou sans effet) ; **relecture impossible → sortie 11, « suppression non confirmée »**, jamais « supprimée ». Une lecture qui échoue ne vaut jamais « branche absente ».
14. **Un sujet rouvert sous le même nom ne se clôt pas d'ici** (limite assumée, non une exception). Une carte restée `fini` ou `6-nettoyage` sur develop est celle du chantier précédent ; un sujet rouvert sous le même nom (`ouvrir` crée `sujet/<nom>` depuis develop, sommet contenu dans develop d'emblée) passerait tous les autres contrôles et serait supprimé. `clore` exige donc que le sommet soit contenu dans le **premier commit des premiers parents de develop** où la carte est passée en `6-nettoyage` ou `fini` (`commit_carte_livree`) : le sommet d'un sujet livré est contenu dans sa livraison, puis dans la PR de documentation qui passe la carte, tandis que celui d'un sujet rouvert est postérieur. Refus (4), « à jouer d'un poste local ». Limite : un nom réutilisé et **livré deux fois** ne se clôt pas d'ici non plus (la première carte livrée est celle d'avant) ; la lecture est bornée aux commits de develop qui touchent la carte, et un historique de develop où la carte aurait été renommée n'est pas suivi (refus). Test des deux sens : sujet livré, carte livrée après la livraison par une PR de documentation, clôt ; develop avance, le nom est rouvert sans commit, refus.
15. **`GH_REPO` est ignoré.** Les deux lectures de PR ouvertes passent par `env -u GH_REPO gh api …` : une variable `GH_REPO` héritée de l'environnement ferait lire les PR d'un autre dépôt (les `{owner}/{repo}` du chemin se résolvent sur `GH_REPO` avant le remote `origin`) et conclure « aucune PR ouverte » à tort. Le dépôt lu est celui de `origin` (résolution par défaut de `gh` dans le clone). Test : `GH_REPO=autre/depot` dans l'environnement du script, un `gh` de banc qui répond « rien » quand la variable est posée : `clore` refuse encore (PR #7 ouverte).
16. PR vers `main`, titre `feat(chaine): sujet.sh clore supprime un sujet livré, sans force (plugin <version>)`. `Label: contre-revue` : PR ouverte hors brouillon, **sans `à-fusionner`**, et un mot à l'architecte dès la PR livrée. Commits sous les hooks, jamais `--no-verify`. Aucun test retiré, sauté ni assoupli.

### Remèdes écartés

- **`--force-with-lease=<ref>:<sha>` pour fermer la fenêtre de la course** : un push forcé. L'intangible du produit (« jamais de push forcé ») est plus fort que la fenêtre.
- **`gh api -X DELETE …/git/refs/heads/sujet/<nom>`** : même suppression sans condition, et c'est la route que la garde refuse (:546) : un script qui l'emploierait ouvrirait la même porte par un autre chemin.
- **Lever la garde pour `git push --delete sujet/…` quand la session cite `clore`** : la garde ne lit pas les intentions.
- **Clore par la boucle du capitaine**, dès qu'un sujet est livré : un geste destructeur sans humain. Hors périmètre ; le geste reste un ordre de la session qui nettoie.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges

1. Créer `skills/chaine/sujet/scripts/sujet-clore.test.mjs` (§ 3), sans toucher `sujet.sh` : `node --test skills/chaine/sujet/scripts/sujet-clore.test.mjs` donne **dix-huit** `not ok`.
2. Dans `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, le remplacement T13 du § 2 : `node --test` sur ce fichier donne un `not ok` (« un push vers un sujet est refusé, quelle que soit la branche et la forme de la commande », le refus ne cite pas `sujet.sh clore <nom>`).
3. `scripts/poses.test.mjs` : sans T14 à T16 du § 2, le banc posé échoue sur le test du pre-push du socle (aucun `.husky/pre-push` dans le projet simulé). Les appliquer avec le § 3, avant de jouer la suite : c'est le même changement.

### 1. `skills/chaine/sujet/scripts/sujet.sh`

Le diff, appliqué à `origin/main` (en-tête, codes de sortie, la fonction `clore` avant `carte_sujet`, l'aiguillage, l'usage) :

````diff
diff --git a/skills/chaine/sujet/scripts/sujet.sh b/skills/chaine/sujet/scripts/sujet.sh
index aedaab9..0a164a9 100755
--- a/skills/chaine/sujet/scripts/sujet.sh
+++ b/skills/chaine/sujet/scripts/sujet.sh
@@ -67,6 +67,17 @@
 #   gel <nom>             lecture : écrit la valeur de `Gel:` (fiche de la carte sur origin/sujet/<nom>) et
 #                         sort en 0 si le sujet est gelé, 1 sinon. Toute valeur non vide gèle, datée ou non
 #                         (ligne écrite à la main dans l'éditeur de GitHub)
+#   clore <nom>           supprime `origin/sujet/<nom>`, un sujet livré, par `git push origin :refs/heads/sujet/<nom>` :
+#                         jamais d'option, jamais de force, pas de `--force-with-lease`. Refuse (4) tant que son
+#                         sommet n'est pas contenu dans `origin/develop`, qu'une PR ouverte l'a pour base ou pour
+#                         tête, ou que sa carte, lue sur develop, n'est pas en `6-nettoyage` ou `fini` (`sujet_livre` ;
+#                         un sujet sans carte ne se clôt pas), ou que son sommet est postérieur au passage de la carte
+#                         en `6-nettoyage` ou `fini` (sujet rouvert sous le même nom). Les références se lisent en
+#                         toutes lettres (`refs/remotes/origin/…`) et `GH_REPO` est ignoré. Le sommet est relu juste
+#                         avant la suppression : s'il a bougé, sortie 5, rien n'est supprimé. Une suppression refusée
+#                         (hook pre-push, protection de branche, proxy d'une session cloud) sort en 3 : la branche
+#                         reste, et la sortie dit de la jouer d'un poste local. Sujet déjà absent : sortie 0. GitHub ou
+#                         origin illisible, ou suppression non confirmée par une relecture de origin : 11
 #
 # Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours, ou fusion, commit ou push refusé par un hook git
 # (sa sortie sur stderr : la lire, corriger, jamais en sautant le hook ; le pre-push contrôle l'arbre de travail) · 4 refus corrigeable par l'auteur (sa
@@ -79,7 +90,8 @@
 # avec le sujet sur des index générés seuls : branche mise à jour (index régénérés) et poussée, CI
 # relancée, aucun squash · 11 `fusionner` d'une PR de mise à jour : échec côté capitaine (git sans
 # `merge-tree --write-tree`, dépendances, régénération, commit ou push refusé), rien à corriger côté PR,
-# aucun renvoi · 69 jq absent du poste
+# aucun renvoi · 11 `clore` : origin ou GitHub illisible, ou suppression non confirmée · `clore` : 3 suppression refusée par
+# un hook ou par le distant, 4 refus (pas livré, PR ouverte, carte, nom ou option), 5 le sommet a bougé · 69 jq absent du poste
 # Tout passe par l'API REST (`gh api`) : GraphQL est refusé depuis les sessions cloud. Depuis la
 # racine du dépôt ; sans argument, affiche cette aide.
 # =============================================================================
@@ -226,14 +238,14 @@ sujet_livre() {
   local nom=${1#sujet/} f trouve='' phase
   git fetch -q origin develop 2>/dev/null || true
   while IFS= read -r f; do
-    git show "origin/develop:$f" | carte_nomme_le_sujet "$nom" || continue
+    git show "refs/remotes/origin/develop:$f" | carte_nomme_le_sujet "$nom" || continue
     trouve=1
-    phase=$(git show "origin/develop:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
+    phase=$(git show "refs/remotes/origin/develop:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
     case "$phase" in 6-nettoyage* | fini*) return 0 ;; esac
-  done < <(git ls-tree -r --name-only origin/develop -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
+  done < <(git ls-tree -r --name-only refs/remotes/origin/develop -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
   [ -z "$trouve" ] || return 1
   git ls-remote --exit-code --heads origin "sujet/$nom" >/dev/null 2>&1 && return 1
-  [ -n "$(git log origin/develop --merges -1 --format=%H -E \
+  [ -n "$(git log refs/remotes/origin/develop --merges -1 --format=%H -E \
     --grep "^Sujet: sujet/${nom}\$" --grep "^Merge pull request #[0-9]+ from [^ ]+/sujet/${nom}\$")" ]
 }
 
@@ -1060,6 +1072,81 @@ carte_cite_le_sujet() {
     END { exit !ok }'
 }
 
+# `clore <nom>` : voir l'en-tête. Le seul geste de suppression d'une branche de sujet : la garde d'agent
+# refuse `git push --delete` et `:sujet/…` à une session (elle ne voit pas ce script). Aucune écriture avant
+# que tous les refus aient été levés, et jamais d'option de force : la suppression est un `git push` simple,
+# sous les hooks, comme `pousser` pour tout le reste.
+# Sommet de la branche `<branche>` sur origin (vide si elle n'y est pas) : le nom se compare en entier,
+# `git ls-remote <motif>` fait correspondre la fin d'un nom.
+sommet_distant() { git ls-remote origin "refs/heads/$1" | awk -v r="refs/heads/$1" '$2 == r { print $1 }'; }
+# Premier commit de develop (premiers parents) où la carte du sujet est en `6-nettoyage` ou `fini` ; vide
+# sinon. Le sommet d'un sujet livré est contenu dans ce commit : un sujet rouvert sous le même nom, après
+# la carte d'un chantier précédent, a un sommet plus récent.
+commit_carte_livree() {
+  local nom=$1 f c phase
+  while IFS= read -r f; do
+    git show "refs/remotes/origin/develop:$f" | carte_nomme_le_sujet "$nom" || continue
+    while IFS= read -r c; do
+      phase=$(git show "$c:$f" 2>/dev/null | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
+      case "$phase" in 6-nettoyage* | fini*) printf '%s\n' "$c"; return 0 ;; esac
+    done < <(git log --first-parent --reverse --format=%H refs/remotes/origin/develop -- "$f")
+  done < <(git ls-tree -r --name-only refs/remotes/origin/develop -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
+}
+# `clore <nom>` : voir l'en-tête. Le seul geste de suppression d'une branche de sujet : la garde d'agent
+# refuse `git push --delete` et `:sujet/…` à une session (elle ne voit pas ce script). Aucune écriture avant
+# que tous les refus aient été levés, et jamais d'option de force : la suppression est un `git push` simple,
+# sous les hooks. Les références se lisent en toutes lettres (`refs/remotes/origin/…`) : un tag ou une
+# branche locale nommés `origin/develop` ne masquent pas le distant. `gh` ne lit pas `GH_REPO` ici : les PR
+# ouvertes sont celles du dépôt de `origin`.
+clore() {
+  local nom=${1-} branche sommet relu ouvertes statut ecart livree develop=refs/remotes/origin/develop
+  shift || true
+  [ $# -eq 0 ] || sortir 4 "clore ne prend que le nom du sujet ($*) : jamais d'option, jamais de push forcé"
+  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || sortir 4 "nom de sujet illisible : « $nom »"
+  branche="sujet/$nom"
+  relu=$(sommet_distant "$branche") || sortir 11 "origin injoignable : rien n'est supprimé"
+  [ -n "$relu" ] || sortir 0 "$branche n'existe pas sur origin : rien à clore"
+  git fetch -q origin "+refs/heads/develop:$develop" "+refs/heads/$branche:refs/remotes/origin/$branche" ||
+    sortir 11 "fetch de develop et de $branche en échec : rien n'est supprimé"
+  sommet=$(git rev-parse --verify "refs/remotes/origin/$branche^{commit}") ||
+    sortir 11 "refs/remotes/origin/$branche illisible : rien n'est supprimé"
+  statut=0
+  git merge-base --is-ancestor "$sommet" "$develop" || statut=$?
+  case $statut in
+    0) ;;
+    1) ecart=$(git rev-list --count "$develop..$sommet")
+       sortir 4 "$branche porte $ecart commit(s) absent(s) de develop : pas livré, rien n'est supprimé" ;;
+    *) sortir 11 "git merge-base en échec sur $branche et origin/develop : rien n'est supprimé" ;;
+  esac
+  ouvertes=$(
+    env -u GH_REPO gh api --paginate "$DEPOT/pulls?state=open&per_page=100&base=$(uri "$branche")" --jq '.[].number' &&
+      env -u GH_REPO gh api --paginate "$DEPOT/pulls?state=open&per_page=100&head={owner}:$(uri "$branche")" --jq '.[].number'
+  ) || sortir 11 "PR ouvertes de $branche illisibles (GitHub) : rien n'est supprimé"
+  [ -z "$ouvertes" ] || sortir 4 "des PR ouvertes ont $branche pour base ou pour tête (#$(sort -un <<<"$ouvertes" | paste -sd' ' - | sed 's/ / #/g')) : les fusionner ou les fermer avant de clore"
+  sujet_livre "$nom" ||
+    sortir 4 "la carte de $nom, lue sur develop, ne le dit pas livré (Phase: 6-nettoyage ou fini) : rien n'est supprimé"
+  livree=$(commit_carte_livree "$nom")
+  { [ -n "$livree" ] && git merge-base --is-ancestor "$sommet" "$livree"; } ||
+    sortir 4 "le sommet de $branche est postérieur au passage de sa carte en 6-nettoyage ou fini (un sujet rouvert sous le même nom ?) : rien n'est supprimé, à jouer d'un poste local"
+  # Le sommet relu juste avant la suppression doit être celui qu'on a vérifié.
+  relu=$(sommet_distant "$branche") || sortir 11 "origin injoignable : rien n'est supprimé"
+  [ "$relu" = "$sommet" ] || sortir 5 "$branche a bougé pendant les vérifications : rien n'est supprimé, relancer"
+  statut=0
+  jouer_ou_dire "git push -q origin :refs/heads/$branche" || statut=$?
+  # Quel que soit le code du push, seul le distant dit ce qu'il est advenu.
+  relu=$(sommet_distant "$branche") ||
+    sortir 11 "suppression non confirmée : origin illisible après le push, relire avec git ls-remote --heads origin $branche"
+  git update-ref -d "refs/remotes/origin/$branche" 2>/dev/null || true
+  if [ -z "$relu" ]; then
+    if [ "$statut" -eq 0 ]; then echo "$branche supprimée (sommet ${sommet:0:12}, contenu dans origin/develop)"
+    else echo "$branche n'est plus sur origin (le push a échoué, la branche avait disparu entre-temps)"; fi
+  elif [ "$relu" != "$sommet" ]; then
+    sortir 5 "$branche a bougé pendant la suppression : rien n'est supprimé, relancer"
+  else
+    sortir 3 "suppression de $branche refusée ou sans effet (hook pre-push, protection de branche ou proxy : sortie ci-dessus). Si c'est le distant, à jouer d'un poste local : git push origin :refs/heads/$branche"
+  fi
+}
+
 carte_sujet() {
   local nom=${1-} branche tete c f meta lignes n i=0 avant tmp
   shift || true
@@ -1109,10 +1196,10 @@ commande=${1:-}
 shift || true
 if [ "$commande" = carte ] && [ $# -gt 0 ]; then carte_sujet "$@"; exit; fi
 case "$commande" in
-  demarrer | ouvrir | fusionner | rafraichir | livrer | relancer | series | regrouper | carte | etat | geler | degeler | gel) "$commande" "$@" ;;
+  demarrer | ouvrir | fusionner | rafraichir | livrer | relancer | series | regrouper | carte | etat | geler | degeler | gel | clore) "$commande" "$@" ;;
   de) sujet_du_ticket "${1:?ticket}" ;;
   livre) sujet_livre "${1:?nom du sujet}" ;;
   livrer-prets) livrer_prets "$@" ;;
   regrouper-series) regrouper_series "$@" ;;
-  *) sed -n '3,/^# =====/p' "$0" | sed '$d; s/^# \{0,1\}//'; sortir 4 "usage : sujet.sh demarrer <ticket|nom> | ouvrir <nom> [--specs <pr>] | fusionner <pr> | rafraichir <nom> | livrer <nom> <titre> | livrer-prets [--dry-run] | relancer <pr> | series | regrouper-series [--dry-run] | regrouper <nom> <pr>… | carte | carte <nom> | etat | geler <nom> \"<raison>\" | degeler <nom> | gel <nom> | de <ticket>" ;;
+  *) sed -n '3,/^# =====/p' "$0" | sed '$d; s/^# \{0,1\}//'; sortir 4 "usage : sujet.sh demarrer <ticket|nom> | ouvrir <nom> [--specs <pr>] | fusionner <pr> | rafraichir <nom> | livrer <nom> <titre> | livrer-prets [--dry-run] | relancer <pr> | series | regrouper-series [--dry-run] | regrouper <nom> <pr>… | carte | carte <nom> | etat | geler <nom> \"<raison>\" | degeler <nom> | gel <nom> | clore <nom> | de <ticket>" ;;
 esac
````

### 2. Les textes, mot pour mot

Chaque « Ancien » apparaît **une seule fois** dans son fichier à `76d90c7` ; si les tickets 40 ou 41 l'ont déplacé ou modifié, la session retrouve la phrase par son sens et applique le « Nouveau » à la même place. Aucun « Nouveau » ne contient son « Ancien », sauf **T3, T7 et T8**, des insertions dont l'ancre est répétée : à appliquer une fois.

#### T1 — `skills/chaine/sujet/SKILL.md`, § « Commandes » (ligne des sorties)

Ancien :

````text
dont le push échoue deux fois. `fusionner` a deux sorties de plus :
````

Nouveau :

````text
dont le push échoue deux fois. `clore` a les siennes (§ « Clore un sujet livré »). `fusionner` a deux sorties de plus :
````

#### T2 — `skills/chaine/sujet/SKILL.md`, § « Étape 0 — poser »

Ancien :

````text
`scripts/sujet-carte.test.mjs`, `scripts/depot-jouet.mjs`
````

Nouveau :

````text
`scripts/sujet-carte.test.mjs`, `scripts/sujet-clore.test.mjs`, `scripts/depot-jouet.mjs`
````

#### T3 — `skills/chaine/sujet/SKILL.md`, nouvelle section avant « Branches fusionnées »

Ancien :

````text
## Branches fusionnées

````

Nouveau :

````text
## Clore un sujet livré (`clore`)

Un sujet livré par sa PR finale disparaît seul avec le réglage « Automatically delete head branches » ; un sujet livré par une livraison intermédiaire (`livraison/<nom>-<date>`), ou avant ce réglage, reste sur `origin`. `bash scripts/chaine/sujet.sh clore <nom>` le supprime par un `git push origin :refs/heads/sujet/<nom>` simple, sous les hooks git, sans option ni force (le hook d'agent refuse toute suppression écrite à la main : `git push --delete`, `:sujet/…`, `gh api -X DELETE …/git/refs/…` ; un script, il ne le voit pas, d'où les refus que la commande se fait à elle-même). Sortie 4, rien n'est supprimé : le sommet de `origin/sujet/<nom>` n'est pas contenu dans `origin/develop` ; une PR ouverte a le sujet pour base ou pour tête ; la carte du sujet, lue sur develop, n'est pas en `Phase: 6-nettoyage` ou `fini` (un sujet sans carte ne se clôt pas) ; le sommet est postérieur au passage de la carte en `6-nettoyage` ou `fini` (un sujet rouvert sous le même nom : à jouer d'un poste local) ; nom illisible ou option. Le sommet est relu juste avant la suppression : s'il a bougé, sortie 5. Une suppression refusée par un hook git ou par le distant (protection de branche, proxy d'une session cloud) sort en 3 et la branche reste : la sortie dit de la jouer d'un poste local. `origin` ou GitHub illisible, ou suppression non confirmée par la relecture de `origin` : sortie 11. Sujet déjà absent : sortie 0. Le pre-push du socle laisse passer une suppression seule : sans commit neuf, il n'a rien à contrôler.

## Branches fusionnées

````

#### T4 — `skills/chaine/sujet/SKILL.md`, § « Branches fusionnées »

Ancien :

````text
et la suppression automatique n'intervient qu'à la fusion de la PR finale.
````

Nouveau :

````text
et la suppression automatique n'intervient qu'à la fusion de la PR finale : un sujet livré autrement se supprime par `sujet.sh clore <nom>`.
````

#### T5 — `skills/chaine/sujet/SKILL.md`, § « Ne jamais »

Ancien :

````text
ou pousser à la main sur un sujet : la carte passe par `sujet.sh carte <nom>`.
````

Nouveau :

````text
ou pousser à la main sur un sujet, ou en supprimer un à la main : la carte passe par `sujet.sh carte <nom>`, la suppression d'un sujet livré par `sujet.sh clore <nom>`.
````

#### T6 — `skills/chaine/sujet/references/CONTENU.md`, liste des commandes

Ancien :

````text
`carte`, `carte <nom>`, `etat`, `geler`, `degeler`, `gel`, `de`.
````

Nouveau :

````text
`carte`, `carte <nom>`, `etat`, `geler`, `degeler`, `gel`, `clore`, `de`.
````

#### T7 — `skills/chaine/sujet/references/CONTENU.md`, avant « `scripts/sujet-carte.test.mjs` »

Ancien :

````text

## `scripts/sujet-carte.test.mjs`

````

Nouveau :

````text

`clore <nom>` est le seul geste de suppression d'une branche de sujet : le hook d'agent refuse `git push --delete`, `:sujet/…` et `gh api -X DELETE …/git/refs/…` à une session, et ne voit pas ce script. Il ne supprime que ce qui est prouvé livré (sommet contenu dans `origin/develop`, aucune PR ouverte qui a le sujet pour base ou pour tête, carte de develop en `6-nettoyage` ou `fini` par `sujet_livre`), relit le sommet juste avant, et pousse une suppression simple, sous les hooks, jamais forcée : un sujet qui avance entre la relecture et le push n'est pas détecté (le `git push` d'une suppression n'a pas de condition sur la valeur à supprimer, et `--force-with-lease` est un push forcé). Le pre-push du socle sort 0 sur une suppression seule, sans jouer `pnpm run check` ; un hook ou un distant qui refuse donne la sortie 3, la branche reste. Les références se lisent en toutes lettres (`refs/remotes/origin/…`, `sujet_livre` comprise) : un tag ou une branche locale nommés `origin/develop` ne masquent pas le distant ; `GH_REPO` est ignoré pour la lecture des PR ouvertes ; après le push, le distant a le dernier mot (relecture impossible : sortie 11, jamais « supprimée »). Limite : un sujet rouvert sous le même nom, ou livré deux fois sous le même nom, ne se clôt pas d'ici (son sommet doit être contenu dans le premier commit de develop où la carte est passée livrée).

## `scripts/sujet-carte.test.mjs`

````

#### T8 — `skills/chaine/sujet/references/CONTENU.md`, avant « `scripts/sujet.test.mjs` »

Ancien :

````text
## `scripts/sujet.test.mjs`
````

Nouveau :

````text
## `scripts/sujet-clore.test.mjs`

`clore <nom>` sur le dépôt jouet : la suppression nominale, un sujet déjà absent, chaque refus en sortie 4 (nom, option, sommet hors de develop, PR ouverte pour base ou pour tête, carte pas livrée ou absente), la course (le sommet avance entre la lecture et la relecture : sortie 5 ; il avance pendant le push, par un pre-push de banc : sortie 5), la suppression refusée par un pre-push et par un `pre-receive` du distant (sortie 3, « à jouer d'un poste local »), GitHub illisible (11), les références locales qui masquent le distant (tag, branche), `GH_REPO` hérité, la relecture de `origin` impossible après le push (11, « suppression non confirmée »), le sujet rouvert sous le même nom, l'absence de toute option de force dans le corps de la fonction, et le pre-push du socle devant une suppression.

## `scripts/sujet.test.mjs`
````

#### T9 — `skills/chaine/chantier/SKILL.md:117`

Ancien :

````text
`Phase: 6-nettoyage`, puis les branches du chantier encore sur `origin` (le réglage « Automatically delete head branches » les supprime seul à la fusion ; le reste se supprime d'un poste local, **jamais d'une session cloud**, le proxy refuse la suppression)
````

Nouveau :

````text
`Phase: 6-nettoyage` dans la carte de develop (par une PR docs : `clore` lit cette carte), puis `bash scripts/chaine/sujet.sh clore <nom>` supprime `origin/sujet/<nom>` si GitHub ne l'a pas fait (livraison intermédiaire, ou avant le réglage « Automatically delete head branches ») : la commande refuse un sujet pas livré ou qui a une PR ouverte, et le proxy d'une session cloud peut refuser la suppression (sortie 3, branche intacte) : la jouer alors d'un poste local, jamais en poussant à la main ; puis les autres branches du chantier encore sur `origin` (le même réglage les supprime seul à la fusion ; le reste se supprime d'un poste local, **jamais d'une session cloud**, le proxy refuse la suppression)
````

#### T10 — `skills/chaine/fusionner/SKILL.md:77`

Ancien :

````text
Les scripts ne suppriment rien : depuis le cloud, le proxy refuse la suppression.
````

Nouveau :

````text
Les scripts du capitaine ne suppriment rien ; seul `sujet.sh clore <nom>` supprime un sujet livré que GitHub a laissé (livraison intermédiaire, ou avant le réglage), et depuis le cloud le proxy peut refuser la suppression : sortie 3, à jouer d'un poste local.
````

#### T11 — `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs:160` (`RAISON_PUSH_SUJET`)

Ancien :

````text
seul sujet.sh y écrit (demarrer, rafraichir, fusionner, livrer, carte). Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. Pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
````

Nouveau :

````text
seul sujet.sh y écrit (demarrer, rafraichir, fusionner, livrer, carte, clore). Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. Pour la carte : `bash scripts/chaine/sujet.sh carte <nom>` ; pour supprimer un sujet livré : `bash scripts/chaine/sujet.sh clore <nom>`.";
````

#### T12 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:13`

Ancien :

````text
la carte du chantier passe par `sujet.sh carte <nom>`, que le refus indique.
````

Nouveau :

````text
la carte du chantier passe par `sujet.sh carte <nom>` et la suppression d'un sujet livré par `sujet.sh clore <nom>`, que le refus indique.
````

#### T13 — `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, test « un push vers un sujet est refusé, quelle que soit la branche et la forme de la commande »

Ancien :

````text
  assert.equal(decisionCommande('git push origin HEAD:sujet/demo')?.decision, 'refuser', 'branche inconnue : refusé aussi');
````

Nouveau :

````text
  for (const commande of ['git push origin --delete sujet/demo', 'git push origin :sujet/demo', 'git push origin :refs/heads/sujet/demo']) {
    const d = decisionCommande(commande);
    assert.equal(d?.decision, 'refuser', commande);
    assert.match(d.raison, /sujet\.sh clore <nom>/, `${commande} : le refus indique la voie de la suppression`);
  }
  assert.equal(decisionCommande('bash scripts/chaine/sujet.sh clore demo'), null, 'le script, lui, passe : le hook ne lit pas son contenu');
  assert.equal(decisionCommande('git push origin HEAD:sujet/demo')?.decision, 'refuser', 'branche inconnue : refusé aussi (la suppression : voir la boucle ci-dessus)');
````

#### T14 — `scripts/poses.test.mjs` : le projet simulé reçoit le pre-push du socle (liste `RACINE_PROJET`)

Ancien :

````text
const RACINE_PROJET = [["skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs", "commitlint.config.mjs"]];
````

Nouveau :

````text
const RACINE_PROJET = [
  ["skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs", "commitlint.config.mjs"],
  // Le pre-push du socle, que `sujet-clore.test.mjs` joue devant une suppression de branche.
  ["skills/monorepo/socle-monorepo/references/husky/pre-push", ".husky/pre-push"],
];
````

#### T15 — `scripts/poses.test.mjs` : droits d'exécution du pre-push

Ancien :

````text
if (/\.sh$|pre-commit$/.test(destination)) chmodSync(join(projet, destination), 0o755);
````

Nouveau :

````text
if (/\.sh$|pre-(commit|push)$/.test(destination)) chmodSync(join(projet, destination), 0o755);
````

#### T16 — `scripts/poses.test.mjs` : le dossier `.husky` existe déjà

Ancien :

````text
mkdirSync(join(projet, ".husky"));
````

Nouveau :

````text
mkdirSync(join(projet, ".husky"), { recursive: true });
````

### 3. `skills/chaine/sujet/scripts/sujet-clore.test.mjs` (créé), entier

````js
// `sujet.sh clore <nom>` sur le dépôt jouet : supprime la branche d'un sujet livré, sans option de force,
// et refuse tout ce qui n'est pas prouvé : sommet hors de develop, PR ouverte, carte qui ne dit pas le
// sujet livré, sommet qui bouge entre la lecture et la suppression, suppression refusée par un hook ou
// par le distant. GitHub est simulé par le faux `gh` du jouet ; aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { depotJouet, script } from "./depot-jouet.mjs";

const SCRIPT = script("sujet", "sujet.sh");
const CARTE = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const carte = (phase) => `# SPEC_ALL_DEM-1 — Carte\n\nSujet: sujet/demo\n\n## Fiche\n\nPhase: ${phase}\n`;

// Sujet `demo` livré dans develop par un commit de merge, sa branche toujours sur origin. La carte est sur
// develop en `4-vague-1` avant le sujet ; elle passe en `phase` dans le sujet (livraison avec la carte livrée)
// ou, avec `apres`, par un commit de develop après la livraison (PR de documentation de la phase 6).
// `livre: false` laisse develop sans son commit.
function sujetLivre({ phase = "6-nettoyage", livre = true, avecCarte = true, apres = false } = {}) {
  const d = depotJouet();
  if (avecCarte) {
    d.ecrire(CARTE, carte("4-vague-1"));
    d.commit("docs: carte");
    d.git("push", "-q", "origin", "HEAD:develop");
  }
  const fichiers = { "docs/x.md": "x\n" };
  if (avecCarte && !apres) fichiers[CARTE] = carte(phase);
  d.branche("sujet/demo", "origin/develop", fichiers, "feat(demo): x (#1)");
  if (livre) {
    d.git("switch", "-q", "-C", "develop", "origin/develop");
    d.git("merge", "-q", "--no-ff", "-m", "Merge pull request #2 from org/sujet/demo\n\nSujet: sujet/demo", "origin/sujet/demo");
    if (avecCarte && apres) {
      d.ecrire(CARTE, carte(phase));
      d.commit("docs: carte livrée");
    }
    d.git("push", "-q", "origin", "develop");
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  return d;
}
const clore = (d, ...a) => d.lancer(SCRIPT, "clore", ...a);
const sommetDistant = (d) => d.git("ls-remote", "--heads", "origin", "sujet/demo").split(/\s/)[0];
const brancheLa = (d) => sommetDistant(d) !== "";
const sortie = (r) => `${r.status} ${r.stdout}${r.stderr}`;

test("clore supprime le sujet livré : sortie 0, la branche a disparu de origin, develop n'a pas bougé", () => {
  const d = sujetLivre();
  const develop = d.git("ls-remote", "origin", "refs/heads/develop");
  const r = clore(d, "demo");
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stdout, /sujet\/demo supprimée/);
  assert.equal(brancheLa(d), false, "sujet/demo supprimée");
  assert.equal(d.git("ls-remote", "origin", "refs/heads/develop"), develop, "develop intact");
  assert.equal(d.lancer(SCRIPT, "livre", "demo").status, 0, "le sujet livré se reconnaît à sa carte sur develop");
});

test("clore d'un sujet déjà absent sort en 0 sans rien écrire ; une PR fermée ne refuse pas", () => {
  const d = sujetLivre();
  d.github({ pulls: [{ number: 5, title: "x", head: "sujet/demo", base: "develop", state: "closed", labels: [] }] });
  assert.equal(clore(d, "demo").status, 0);
  const r = clore(d, "demo");
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stdout, /n'existe pas sur origin : rien à clore/);
});

test("clore refuse en 4 un nom illisible, une option et un nom vide, sans rien supprimer", () => {
  const d = sujetLivre();
  const avant = sommetDistant(d);
  for (const args of [[], ["Demo"], ["../demo"], ["demo", "--force"], ["--force", "demo"], ["demo", "--delete"], ["demo/x"]]) {
    const r = clore(d, ...args);
    assert.equal(r.status, 4, `${JSON.stringify(args)} : ${sortie(r)}`);
  }
  assert.match(clore(d, "demo", "--force").stdout, /jamais d'option, jamais de push forcé/);
  assert.equal(sommetDistant(d), avant, "rien supprimé");
});

test("clore refuse en 4 un sujet dont le sommet n'est pas dans develop, le nombre de commits dit", () => {
  const d = sujetLivre({ livre: false });
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /porte 1 commit\(s\) absent\(s\) de develop/);
  assert.equal(brancheLa(d), true);
});

test("clore refuse en 4 une PR ouverte qui a le sujet pour base, puis une qui l'a pour tête ; une PR sans rapport ne refuse pas", () => {
  const d = sujetLivre();
  const pr = (number, head, base) => ({ number, title: "x", head, base, labels: [] });
  d.github({ pulls: [pr(7, "feat/a", "sujet/demo")] });
  let r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /#7/);
  d.github({ pulls: [pr(8, "sujet/demo", "develop")] });
  r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /#8/);
  assert.equal(brancheLa(d), true);
  d.github({ pulls: [pr(9, "feat/b", "sujet/autre"), pr(10, "sujet/autre", "develop")] });
  assert.equal(clore(d, "demo").status, 0, "des PR d'un autre sujet ne comptent pas");
});

test("clore refuse en 4 quand la carte sur develop ne dit pas le sujet livré, et quand il n'a pas de carte", () => {
  for (const [options, motif] of [
    [{ phase: "4-vague-1" }, /ne le dit pas livré/],
    [{ avecCarte: false }, /ne le dit pas livré/],
  ]) {
    const d = sujetLivre(options);
    const r = clore(d, "demo");
    assert.equal(r.status, 4, `${JSON.stringify(options)} : ${sortie(r)}`);
    assert.match(r.stdout, motif);
    assert.equal(brancheLa(d), true, "rien supprimé");
  }
  const fini = sujetLivre({ phase: "fini" });
  assert.equal(clore(fini, "demo").status, 0, "`fini` suffit comme `6-nettoyage`");
});

// Un `gh` qui, à son premier appel, avance `sujet/demo` sur origin (une autre session a poussé entre la
// lecture du sommet et la suppression), puis laisse répondre le faux `gh` du jouet.
function avancerAuPremierAppel(d) {
  d.git("switch", "-q", "-c", "autre", "origin/sujet/demo");
  d.ecrire("docs/y.md", "y\n");
  d.commit("feat(demo): y (#3)");
  d.git("push", "-q", "origin", "HEAD:refs/heads/autre");
  const nouveau = d.git("rev-parse", "HEAD");
  d.git("switch", "-q", "--detach", "origin/develop");
  const gh = join(d.racine, "bin", "gh");
  const vrai = readFileSync(gh, "utf8").split("\n").find((l) => l.startsWith("exec "));
  const marque = join(d.racine, "avance.fait");
  writeFileSync(
    gh,
    `#!/bin/sh\nif [ ! -e ${JSON.stringify(marque)} ]; then : > ${JSON.stringify(marque)}; git --git-dir=${JSON.stringify(d.origine)} update-ref refs/heads/sujet/demo ${nouveau}; fi\n${vrai}\n`,
  );
  chmodSync(gh, 0o755);
  return nouveau;
}

test("course : le sujet avance entre la lecture et la relecture du sommet, sortie 5, rien n'est supprimé", () => {
  const d = sujetLivre();
  const nouveau = avancerAuPremierAppel(d);
  const r = clore(d, "demo");
  assert.equal(r.status, 5, sortie(r));
  assert.match(r.stdout, /a bougé pendant les vérifications/);
  assert.equal(sommetDistant(d), nouveau, "le sommet poussé par l'autre session est intact");
});

// Hooks du jouet : un pre-push qui journalise ce qu'il reçoit (une ligne par ref poussée) puis agit.
function prePush(d, corps) {
  const dir = join(d.racine, "hooks-clore");
  mkdirSync(dir, { recursive: true });
  const journal = join(d.racine, "pre-push.log");
  writeFileSync(join(dir, "pre-push"), `#!/bin/sh\ncat >> ${JSON.stringify(journal)}\n${corps}\n`);
  chmodSync(join(dir, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", dir);
  return () => (existsSync(journal) ? readFileSync(journal, "utf8").trim() : "");
}

test("clore pousse une suppression pure, sans option : le pre-push reçoit « (delete) » et un sha nul pour sujet/demo", () => {
  const d = sujetLivre();
  const sommet = sommetDistant(d);
  const lu = prePush(d, "exit 0");
  assert.equal(clore(d, "demo").status, 0);
  assert.equal(lu(), `(delete) ${"0".repeat(40)} refs/heads/sujet/demo ${sommet}`);
});

test("course : le sujet avance pendant la suppression (le pre-push le fait bouger, puis refuse), sortie 5, rien n'est supprimé", () => {
  const d = sujetLivre();
  const nouveau = avancerAuPremierAppel(d);
  // Le premier appel de gh a déjà eu lieu avant la relecture : on le rejoue ici au moment du push.
  writeFileSync(join(d.racine, "avance.fait"), "");
  const marque = join(d.racine, "avance-push.fait");
  prePush(d, `if [ ! -e ${JSON.stringify(marque)} ]; then : > ${JSON.stringify(marque)}; git --git-dir=${JSON.stringify(d.origine)} update-ref refs/heads/sujet/demo ${nouveau}; fi\nexit 1`);
  const r = clore(d, "demo");
  assert.equal(r.status, 5, sortie(r));
  assert.match(r.stdout, /a bougé pendant la suppression/);
  assert.equal(sommetDistant(d), nouveau);
});

test("clore : un pre-push qui refuse donne la sortie 3, la branche reste", () => {
  const d = sujetLivre();
  const sommet = sommetDistant(d);
  prePush(d, 'echo "pre-push jouet : refus" >&2\nexit 1');
  const r = clore(d, "demo");
  assert.equal(r.status, 3, sortie(r));
  assert.match(r.stderr, /pre-push jouet : refus/);
  assert.match(r.stdout, /à jouer d'un poste local : git push origin :refs\/heads\/sujet\/demo/);
  assert.equal(sommetDistant(d), sommet);
});

test("clore : un distant qui refuse la suppression (protection de branche, proxy) donne la sortie 3 et « à jouer d'un poste local »", () => {
  const d = sujetLivre();
  const sommet = sommetDistant(d);
  const hook = join(d.origine, "hooks", "pre-receive");
  mkdirSync(join(d.origine, "hooks"), { recursive: true });
  writeFileSync(hook, `#!/bin/sh\nwhile read ancien nouveau ref; do\n  case $nouveau in 0*) echo "GH006: suppression refusée" >&2; exit 1 ;; esac\ndone\n`);
  chmodSync(hook, 0o755);
  const r = clore(d, "demo");
  assert.equal(r.status, 3, sortie(r));
  assert.match(r.stderr, /suppression refusée/);
  assert.match(r.stdout, /à jouer d'un poste local/);
  assert.equal(sommetDistant(d), sommet, "la branche reste");
});

test("clore : GitHub illisible donne la sortie 11, rien n'est supprimé", () => {
  const d = sujetLivre();
  const gh = join(d.racine, "bin", "gh");
  writeFileSync(gh, "#!/bin/sh\necho 'gh: HTTP 502' >&2\nexit 1\n");
  chmodSync(gh, 0o755);
  const r = clore(d, "demo");
  assert.equal(r.status, 11, sortie(r));
  assert.equal(brancheLa(d), true);
});

test("le corps de clore n'emploie aucune option de force, ni --delete, ni refspec « + » au push, et son seul push est la suppression par refspec", () => {
  const source = readFileSync(SCRIPT, "utf8");
  const corps = source.match(/^clore\(\) \{[\s\S]*?^\}/m)?.[0] ?? "";
  assert.ok(corps.length > 200, "le corps de clore() est introuvable");
  assert.doesNotMatch(corps, /--force|--delete|--mirror|--prune|force-with-lease|\bpush\b.* -f\b/);
  const poussees = corps.split("\n").filter((l) => /^\s*(pousser|git push|jouer_ou_dire)\b/.test(l));
  assert.equal(poussees.length, 1, `un seul push : ${poussees.join(" | ")}`);
  assert.match(poussees[0], /jouer_ou_dire "git push -q origin :refs\/heads\/\$branche"/);
  assert.doesNotMatch(corps, /git push[^\n"]*\+/, "aucun refspec « + » au push");
});

// Le pre-push du socle (skill `socle-monorepo`, posé en `.husky/pre-push`) laisse passer une suppression
// seule, sans rejouer `pnpm run check` : une session peut donc clore un sujet sans la porte de qualité.
const PRE_PUSH_SOCLE = [
  new URL("../../../monorepo/socle-monorepo/references/husky/pre-push", import.meta.url),
  new URL("../../.husky/pre-push", import.meta.url),
].find((u) => existsSync(u));

test("le pre-push du socle laisse passer une suppression de branche sans jouer `pnpm run check`", () => {
  assert.ok(PRE_PUSH_SOCLE, "pre-push du socle introuvable (monorepo/socle-monorepo/references/husky/pre-push, ou .husky/pre-push posé)");
  const d = sujetLivre();
  const dir = join(d.racine, "hooks-socle");
  mkdirSync(dir);
  copyFileSync(PRE_PUSH_SOCLE, join(dir, "pre-push"));
  chmodSync(join(dir, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", dir);
  const r = clore(d, "demo");
  assert.equal(r.status, 0, sortie(r));
  const journal = join(d.racine, "faux-gh", "pnpm.log");
  assert.equal(existsSync(journal) ? readFileSync(journal, "utf8") : "", "", "`pnpm run check` n'a pas été joué");
});

test("des références locales nommées origin/develop et origin/sujet/demo (tag, branche) ne masquent pas le distant : refus attendu", () => {
  // Sujet pas livré : un tag `origin/develop` posé sur le sommet du sujet ferait croire qu'il est contenu dans develop.
  const d = sujetLivre({ livre: false });
  const sommet = sommetDistant(d);
  d.git("tag", "origin/develop", sommet);
  d.git("branch", "origin/develop", sommet);
  d.git("tag", "origin/sujet/demo", d.git("rev-parse", "refs/remotes/origin/develop"));
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /absent\(s\) de develop/);
  assert.equal(sommetDistant(d), sommet, "rien supprimé");
  // Sujet livré, carte pas livrée sur develop : un tag `origin/develop` sur un commit dont la carte est `fini` ne la fait pas lire.
  const e = sujetLivre({ phase: "4-vague-1" });
  const reel = e.git("rev-parse", "refs/remotes/origin/develop");
  e.git("switch", "-q", "--detach", reel);
  e.ecrire(CARTE, carte("fini"));
  e.commit("docs: carte fausse, jamais poussée");
  e.git("tag", "origin/develop", e.git("rev-parse", "HEAD"));
  e.git("switch", "-q", "--detach", reel);
  const s = clore(e, "demo");
  assert.equal(s.status, 4, sortie(s));
  assert.match(s.stdout, /ne le dit pas livré/);
  assert.equal(brancheLa(e), true);
});

test("GH_REPO, hérité de l'environnement, n'envoie pas la lecture des PR ouvertes vers un autre dépôt", () => {
  const d = sujetLivre();
  d.github({ pulls: [{ number: 7, title: "x", head: "feat/a", base: "sujet/demo", labels: [] }] });
  const gh = join(d.racine, "bin", "gh");
  const vrai = readFileSync(gh, "utf8").split("\n").find((l) => l.startsWith("exec "));
  // Avec GH_REPO, ce `gh` répond comme le dépôt visé : aucune PR ouverte.
  writeFileSync(gh, `#!/bin/sh\nif [ -n "$GH_REPO" ]; then echo ""; exit 0; fi\n${vrai}\n`);
  chmodSync(gh, 0o755);
  const r = spawnSync("bash", [SCRIPT, "clore", "demo"], { cwd: d.travail, env: { ...d.env, GH_REPO: "autre/depot" }, encoding: "utf8" });
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /#7/);
  assert.equal(brancheLa(d), true);
});

test("un push en échec suivi d'une relecture de origin impossible : sortie 11 « suppression non confirmée », jamais « supprimée »", () => {
  const d = sujetLivre();
  // Le pre-push refuse et retire origin : la relecture après le push échoue.
  prePush(d, `mv ${JSON.stringify(d.origine)} ${JSON.stringify(d.origine + ".parti")}\nexit 1`);
  const r = clore(d, "demo");
  renameSync(d.origine + ".parti", d.origine);
  assert.equal(r.status, 11, sortie(r));
  assert.match(r.stdout, /suppression non confirmée/);
  assert.doesNotMatch(r.stdout, /supprimée \(/);
  assert.equal(brancheLa(d), true);
});

test("la carte passée livrée par une PR de documentation après la livraison : le sujet se clôt ; une carte livrée plus ancienne que le sommet (sujet rouvert sous le même nom) refuse", () => {
  const d = sujetLivre({ apres: true });
  const sommetLivre = sommetDistant(d);
  assert.equal(clore(d, "demo").status, 0, "livré par develop, carte livrée après : se clôt");
  assert.equal(brancheLa(d), false);
  // Develop avance, puis le même nom est rouvert depuis develop, sans commit : sa carte (livrée) est celle du chantier précédent.
  d.git("switch", "-q", "-C", "develop", "origin/develop");
  d.ecrire("docs/z.md", "z\n");
  d.commit("docs: autre chose");
  d.git("push", "-q", "origin", "develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.git("push", "-q", "origin", "refs/remotes/origin/develop:refs/heads/sujet/demo");
  assert.notEqual(sommetDistant(d), sommetLivre);
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /postérieur au passage de sa carte/);
  assert.equal(brancheLa(d), true, "le sujet rouvert est intact");
});
````

### 4. La version

`.claude-plugin/plugin.json:3` : la mineure de `origin/main`, plus un, patch à 0 (7.9.1 → 7.10.0 si rien n'a bougé).

## Surfaces

| Surface | Preuve |
| --- | --- |
| suppression nominale : sortie 0, branche disparue, develop intact, `livre` toujours vrai | `skills/chaine/sujet/scripts/sujet-clore.test.mjs` « clore supprime le sujet livré : sortie 0, la branche a disparu de origin, develop n'a pas bougé » |
| sujet déjà absent : 0 ; une PR fermée ne refuse pas | « clore d'un sujet déjà absent sort en 0 sans rien écrire ; une PR fermée ne refuse pas » |
| nom illisible, option (`--force`, `--delete`), nom vide : 4, rien supprimé | « clore refuse en 4 un nom illisible, une option et un nom vide, sans rien supprimer » |
| sommet hors de develop : 4, nombre de commits dit | « clore refuse en 4 un sujet dont le sommet n'est pas dans develop, le nombre de commits dit » |
| PR ouverte pour base, pour tête : 4 ; PR d'un autre sujet ignorée | « clore refuse en 4 une PR ouverte qui a le sujet pour base, puis une qui l'a pour tête ; une PR sans rapport ne refuse pas » |
| carte pas livrée, sujet sans carte : 4 ; `fini` suffit | « clore refuse en 4 quand la carte sur develop ne dit pas le sujet livré, et quand il n'a pas de carte » |
| course : sujet avancé entre la lecture et la relecture : 5 | « course : le sujet avance entre la lecture et la relecture du sommet, sortie 5, rien n'est supprimé » |
| course : sujet avancé pendant le push : 5 | « course : le sujet avance pendant la suppression (le pre-push le fait bouger, puis refuse), sortie 5, rien n'est supprimé » |
| la suppression est un push de suppression pure, sans option | « clore pousse une suppression pure, sans option : le pre-push reçoit « (delete) » et un sha nul pour sujet/demo » |
| hook qui refuse : 3, branche intacte, « poste local » | « clore : un pre-push qui refuse donne la sortie 3, la branche reste » |
| distant qui refuse (`pre-receive`) : 3, « poste local » | « clore : un distant qui refuse la suppression (protection de branche, proxy) donne la sortie 3 et « à jouer d'un poste local » » |
| GitHub illisible : 11 | « clore : GitHub illisible donne la sortie 11, rien n'est supprimé » |
| jamais de force dans le corps de la fonction | « le corps de clore n'emploie aucune option de force ni --delete, et son seul push est la suppression par refspec » |
| des références locales `origin/develop` (tag, branche) et `origin/sujet/demo` (tag) ne masquent pas le distant, y compris dans `sujet_livre` | « des références locales nommées origin/develop et origin/sujet/demo (tag, branche) ne masquent pas le distant : refus attendu » |
| `GH_REPO` hérité n'envoie pas la lecture des PR ailleurs | « GH_REPO, hérité de l'environnement, n'envoie pas la lecture des PR ouvertes vers un autre dépôt » |
| push en échec puis relecture impossible : 11 « suppression non confirmée » | « un push en échec suivi d'une relecture de origin impossible : sortie 11 « suppression non confirmée », jamais « supprimée » » |
| carte livrée après la livraison : se clôt ; sujet rouvert sous le même nom : 4 | « la carte passée livrée par une PR de documentation après la livraison : le sujet se clôt ; une carte livrée plus ancienne que le sommet (sujet rouvert sous le même nom) refuse » |
| le pre-push du socle laisse passer la suppression | « le pre-push du socle laisse passer une suppression de branche sans jouer `pnpm run check` » |
| la garde d'agent refuse toujours la suppression à la main, cite `clore`, laisse passer le script | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « un push vers un sujet est refusé, quelle que soit la branche et la forme de la commande » (assertions ajoutées) |
| le banc posé chez un projet voit le pre-push du socle | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » |
| les commandes existantes : comme avant | les tests existants de `sujet.test.mjs`, `sujet-carte.test.mjs`, `fusionner.test.mjs`, `sujet-fusionner.test.mjs`, inchangés et verts |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Joué le 2026-11-16 dans un `git worktree` jetable de `76d90c7`, `TMPDIR` sous un dossier jetable, §§ 1 à 4 appliqués mot pour mot (le ticket 41 aussi, d'où le compte ci-dessous) :

- Sur `76d90c7` sans rien : **528 sur 528**.
- Le banc du § 3 sur le `sujet.sh` de `76d90c7` : **dix-huit** `not ok`, zéro vert. Sept mutations jouées sur le code du § 1, chacune seule, chacune rouge : relecture du sommet retirée (course 1) ; contrôle des PR ouvertes retiré ; ascendance lue par `origin/develop` (masquage) ; `sujet_livre` lu par `origin/develop` (masquage) ; `env -u GH_REPO` retiré ; contrôle de la carte rouverte retiré ; relecture impossible traitée comme « branche absente ».
- Avec le § 1 : dix-huit tests verts. Suite entière, tickets 41 et 42 appliqués ensemble : **549 sur 549** (528 + 3 + 18).
- Pre-push du socle, joué sur un dépôt jetable avec un faux `pnpm` qui échoue : suppression seule, sortie 0, faux `pnpm` non appelé ; push d'un commit neuf, `pnpm run check` joué.
- `bash -n skills/chaine/sujet/scripts/sujet.sh` : rien. `shellcheck` n'est pas installé sur le poste.

**Non joué** :

- **GitHub réel** : que `gh api …/pulls?head={owner}:sujet/<nom>` filtre sur la tête comme le faux `gh` (l'idiome est celui de `passer.sh:149`) ; qu'une suppression de `sujet/*` passe, ces branches n'étant pas protégées (`sujet/SKILL.md`, « Branches fusionnées »).
- **Le proxy d'une session cloud** : qu'il refuse bien la suppression, comme le disent `chantier/SKILL.md:117` et `fusionner/SKILL.md:77`. Le banc simule le refus du distant par un `pre-receive`, pas le proxy ; la sortie 3 et son message sont les mêmes.
- **La fenêtre de course après la relecture** (décision 5) : non testable, non fermée.
- **La livraison intermédiaire réelle** : que la carte de develop porte `6-nettoyage` ou `fini` après une livraison de ce genre. Le banc pose la carte sur develop ; le flux de `chantier/SKILL.md` § 7 (phase `6-nettoyage` par une PR docs vers develop) est ce que la commande suppose.

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 18**.
2. Contrôles du diff :
   - `git diff origin/main --stat -- '*.test.mjs'` ne montre que `sujet-clore.test.mjs` (créé), `regles.test.mjs` et `scripts/poses.test.mjs` ;
   - `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0 ;
   - `git diff origin/main -- skills/chaine/socle-chaine-de-production/references/agent/regles.mjs` ne montre qu'une ligne changée, le texte de `RAISON_PUSH_SUJET` ; aucun motif ni aucune décision de `regles.mjs` ne change.
3. `bash -n skills/chaine/sujet/scripts/sujet.sh` : rien.
4. Revue de ticket, puis **`/security-review`** sur la branche : la commande supprime une branche distante, et le texte d'un hook change. Leurs sections vont dans le corps de la PR. Le point à regarder : tout chemin qui mènerait à un push autre que `:refs/heads/sujet/<nom>` (nom validé `^[a-z0-9][a-z0-9-]*$` avant tout appel, aucun argument de plus accepté).
5. La PR vise `main`, hors brouillon, **sans `à-fusionner`** (`Label: contre-revue`) ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Hors périmètre

- **`boucle.sh` ou `livrer-prets` qui clôt seuls** un sujet livré (décision 9, remèdes écartés).
- **Supprimer d'autres branches** que `sujet/<nom>` : `livraison/<nom>-<date>` (GitHub la supprime à la fusion de sa PR), `maj/<nom>`, `feat/*` : d'un poste local, comme aujourd'hui.
- **Un sujet sans carte** : voir « Ce que `sujet_livre` ne couvre pas ».
- **Une protection de `sujet/*` côté GitHub**, seule vraie frontière (`socle-chaine-de-production/references/CONTENU.md`).
- **Le réglage du proxy** des sessions cloud.
- **Les dépôts de projet** : reposer `scripts/chaine/` est leur affaire.

## Comments

- 2026-11-16 — Rédigé sur `fa7d3eb`, recalé sur `76d90c7` (plugin 7.9.1, 528 tests) après relecture (A-53) d'après le constat 5 et la décision A-49 de la carte. Code et bancs joués sur une copie jetable : banc rouge sur `main` (18 sur 18), vert avec le § 1. Écarts avec la demande : (1) « `sujet_livre` ou la phase de la carte » : un seul critère, `sujet_livre`, décision 2 ; (2) `Type: feature`, `Label: contre-revue` (script qui écrit sur le distant, texte d'un hook), `Blocked by: 40, 41` (décision 11) ; (3) le test du pre-push du socle ajoute une ligne au banc des poses (T14 à T16 du § 2) ; (4) la fenêtre de course n'est pas fermée, décision 5 ; (5) le texte du refus de `regles.mjs` cite `clore` (décision 8), non demandé. Après relecture : références en toutes lettres et `sujet_livre` corrigé (12), relecture de `origin` après le push et sortie 11 « suppression non confirmée » (13), sujet rouvert sous le même nom refusé, avec sa limite (14), `GH_REPO` ignoré (15), T13 rendu idempotent, « ni refspec `+` au push » (4).
