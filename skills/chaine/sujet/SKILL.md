---
name: sujet
description: Branche de sujet — un lot de PR liées vit sur `sujet/<nom>` dès sa première PR et entre dans develop en une PR, par un commit de merge. `demarrer` place une branche de travail sur le sujet de son ticket ; le capitaine fusionne les sous-PR étiquetées `à-fusionner`, tient le sujet à jour avec develop, repère et regroupe les séries ; `livrer` ouvre la PR finale. À utiliser au début de tout travail sur un ticket ou un lot (« démarre SPEC_ALL_SOC-1.02 », « ouvre un sujet pour la démo », « regroupe les PR SPEC_ALL_SOC-1 », « où en sont les sujets », « livre le sujet socle »). `poser` l'installe une fois dans le dépôt.
argument-hint: 'poser | demarrer <ticket|nom> | etat | series | regrouper <nom> <pr>… | livrer <nom> "<titre>" | carte <nom> | geler <nom> "<raison>" | degeler <nom> | gel <nom> | ouvrir | fusionner | rafraichir | relancer'
---

# Branches de sujet

Un lot de PR liées vit sur `sujet/<nom>` **dès sa première PR**, et entre dans develop en **une** PR, par un commit de merge qui garde un commit par sous-PR. Il paie ainsi une passe de CI complète au lieu d'une par PR, et ses conflits internes se règlent dans le sujet, pas au passage du capitaine. Décision et raisons : l'ADR « branches de sujet » du dépôt, posée par `socle-chaine-de-production`.

## Étape 0 — poser (une fois par dépôt, `poser`)

`scripts/sujet.sh` → `scripts/chaine/sujet.sh` (exécutable), avec son banc d'essai `scripts/sujet.test.mjs`, `scripts/sujet-carte.test.mjs`, `scripts/sujet-clore.test.mjs`, `scripts/sujet-refs.test.mjs`, `scripts/depot-jouet.mjs`, `scripts/environnement-des-bancs.test.mjs`, `scripts/faux-gh.mjs` et `scripts/faux-gh.test.mjs` → `scripts/chaine/` (les tests du capitaine s'en servent aussi). Son `depot-jouet.mjs` charge `scripts/docs/environnement-de-banc.mjs` (posé par `socle-monorepo`) et refuse de se charger sans lui. Il s'appuie sur `scripts/chaine/github.sh`, `identifiant.mjs` (qui lit les identifiants par `scripts/docs/identifiants.mjs`, posé par `tickets`) et `revue-exigee.mjs`, posés par `fusionner poser` ; les deux skills se posent ensemble. Dépendances : `git`, `jq`, `gh` authentifié pour tout ce qui écrit sur GitHub (sans lui, le script affiche l'appel de l'outil GitHub MCP à faire). Tests : `node --test scripts/chaine/*.test.mjs` (le socle les joue dans `check:tickets`).

## Quand un sujet

- **Oui** : une spec découpée en plusieurs tickets ; une série du même chantier ; tout travail qui aurait donné une PR empilée sur une autre.
- **Non** : un correctif isolé, et surtout un correctif de démo ou de recette qui doit arriver seul. Il va directement vers develop, avec `prio:haute` s'il presse et `hors-sujet` si son ticket déclare un sujet.

Le sujet se **déclare au découpage** : `Sujet: sujet/<nom>` en tête de la spec (tous ses tickets) ou d'un ticket (`docs/agents/issue-tracker.md`). La PR de specs du lot vise le sujet dès son ouverture : `sujet.sh ouvrir <nom> --specs <pr>`. Sans ticket, la première session du lot choisit le nom et le transmet aux suivantes. Une carte de chantier peut couvrir plusieurs sujets (`Sujet: sujet/a, sujet/b, sujet/c`, virgules) : elle est celle de chacun, et chaque commande de `sujet.sh` la trouve quand l'une de ses valeurs nomme le sujet (sa phase est celle du chantier : `6-nettoyage` ou `fini` donne tous ses sujets pour livrés, donc ne la poser qu'après la livraison du dernier) ; une spec ou un ticket n'en nomme qu'un, et `demarrer` refuse (sortie 4) un ticket dont la ligne en nomme plusieurs.

## Session de travail

1. **Réserver** le ticket : `docs/agents/issue-tracker.md` § « Réserver un ticket ».
2. **Avant le premier commit** : `bash scripts/chaine/sujet.sh demarrer <ticket|nom>`, qui place la branche sur le sujet du ticket et affiche `base=…` (`develop` : le ticket n'a pas de sujet). Ses refus (sortie 4) et leur raison sont dans l'en-tête de `sujet.sh` : spec pas encore sur la base, `Blocked by:` pas fait, branche partie d'une branche de specs. Cas vécu : douze PR en conflit au squash de leurs specs. Une branche qui a déjà des commits partis de develop n'est ni rebasée ni poussée en force : `demarrer` la laisse intacte et affiche la suite qui reprend ses commits sur une branche neuve partie du sujet (`git switch --no-track -c`, `git cherry-pick --no-merges`, `git push -u`) ; la PR de l'ancienne branche se ferme en citant la nouvelle.
3. La PR vise la base affichée. Son titre suit Conventional Commits, car il deviendra un commit de develop, et tient en 120 caractères avec ` (#n)`. Label `à-fusionner` et PR jamais empilée : `CLAUDE.md` § « Fusion vers `develop` : une file, un capitaine » ; la suite d'un travail repart du sujet.

## Capitaine (automatique)

`boucle.sh` du capitaine fusionne les sous-PR, recible, rafraîchit, livre et regroupe les sujets : règles et ordre dans l'en-tête de `scripts/chaine/boucle.sh`. En fin de boucle, le capitaine propose à l'utilisateur les séries restantes ; regrouper une série non déclarée se fait **sur son accord**.

## Commandes

Chaque commande, son effet et ses sorties : en-tête de `sujet.sh` ; `sujet.sh` sans argument affiche l'aide. Sorties : 0 fait · 2 conflit · 3 checks rouges · 4 refus corrigeable par l'auteur · 6 arbre de travail pas propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR) · 7 sautée · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois. 14 `livrer` : `gh` inutilisable ou refus du POST, PR non ouverte, fichier écrit (la cause lue est dite). `clore` a les siennes (§ « Clore un sujet livré »). `fusionner` suit la règle d'ascendance (skill `fusionner`) : **toute sous-PR en retard sur son sujet**, documentation comprise, ou en conflit avec lui sur des index générés seuls, est mise à jour par le capitaine (le sujet fusionné dans sa branche, merge, avance rapide, jamais de force ; index régénérés ; poussée), sa CI attendue sur le nouveau sommet, le sujet relu et le contrôle refait, puis squashée ; jamais squashée telle quelle. Quatre sorties de plus : 5, la sous-PR a bougé pendant sa mise à jour, ses checks sont encore en cours après l'attente sur un sommet que le capitaine n'a pas poussé, ou le sujet a bougé trois fois pendant la CI, ou GitHub est illisible (`lire_github` : réponse vide, non JSON ou d'erreur, jamais lue comme un état) (reprise au tour suivant, aucun renvoi : la PR reste dans la file tant que sa CI ne finit pas) ; 8, mise à jour poussée, CI pas finie : aucun squash, la boucle la laisse dans la file et la reprend au tour suivant (`MISE À JOUR`) ; 11, contrôle d'ascendance illisible (réf absente, git en échec), côté capitaine, ou push refusé par le distant sans trace du hook pre-push (tout geste qui pousse : `fusionner`, `rafraichir`, `relancer`, `livrer`, `ouvrir`, `geler`, `degeler` ; la trace de husky 9 seule fait un refus du hook, sortie 3) : aucun renvoi ; 12, arbre du squash ≠ arbre testé : commentaire sur la PR, `à-fusionner` retiré, la boucle s'arrête. Un conflit hors index reste un renvoi (sortie 3), lu avant toute attente de CI. Verrou du passage (skill `fusionner`, « Plusieurs capitaines ») : `fusionner` et `relancer` posent leur commentaire marqué avant le premier contrôle ; une sous-PR en passage chez un autre capitaine, ou qui n'est plus éligible une fois le verrou pris, sort en 7 (sautée, aucun renvoi) ; verrou illisible, 11 ; `fusionner` exige `CAPITAINE_ID` (64 sans lui ou mal formé) ; `relancer` sans lui, joué à la main par la session propriétaire, ne pose aucun verrou et le dit (64 s'il est mal formé). `relancer` (sous-PR sans CI, ou « prête (en conflit) » dans la file : GitHub ne lance pas la CI d'une PR en conflit) lit la même règle avant toute fusion, sur le sommet lu avec la PR : en retard ou en conflit sur des index générés seuls, la sous-PR est mise à jour et poussée comme par `fusionner` (index régénérés), ce qui lance sa CI ; conflit hors index, sortie 2, la ligne `conflit avec <sujet> hors index générés :` puis chaque fichier hors index générés, branche intacte ; déjà à jour, sortie 3 ; mise à jour refusée par le pre-push, sortie 3 (la boucle renvoie avec la sortie du hook) ; sous-PR qui a bougé depuis sa lecture, sortie 5 ; contrôle d'ascendance illisible, sortie 11, côté capitaine, aucun renvoi. Un conflit de code entre le sujet et develop (`rafraichir`, sortie 2 ; `SUJET EN CONFLIT` de la boucle), ou une fusion sans conflit que les hooks refusent (sortie 3 ; `SUJET NON MIS À JOUR`), ne se pousse pas : une session fille la fait dans une **PR de mise à jour** (§ « Recevoir develop dans un sujet »). `fusionner` la fait entrer par avance rapide, sans squash, sous les conditions de cette section ; sinon sortie 4, motif à la session, recette comprise. Un sujet qui bouge pendant l'avance la laisse dehors (sortie 5, rien d'écrasé, jamais de force) ; un échec côté capitaine (git, dépendances, régénération, push) sort en 11, sans renvoi.

## Recevoir develop dans un sujet

**Quand.** `rafraichir` s'arrête sur un conflit de code (`SUJET EN CONFLIT`, sortie 2) ou une fusion sans conflit que les hooks refusent (`SUJET NON MIS À JOUR`, sortie 3 : un `pnpm check` rouge sur ce que develop apporte, un formateur monté). Le sujet ne se pousse pas : une session fille, lancée pour ce geste (jamais le conducteur ni le capitaine), refait la réception dans une branche de travail `maj/<nom>`.

**La recette : partir du sujet à jour, une seule fusion de develop, ses conflits résolus dans cette fusion, tout le reste en retouches après elle, jamais une seconde fusion.**

```
git fetch origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/<nom>:refs/remotes/origin/sujet/<nom>'
                                  # refspecs explicites : un clone `--single-branch` (clone superficiel, session cloud)
                                  # ne crée ni ne met à jour origin/sujet/<nom> sur un simple `git fetch origin develop sujet/<nom>`
git switch -c maj/<nom> origin/sujet/<nom>
bash -c '. scripts/chaine/github.sh && fusionner_avec origin/develop'
                                  # `git merge origin/develop` avec la mention de `fusionsSansEffet` quand elle
                                  # s'applique (skill fusionner, « Fusion sans effet ») : sans elle, le hook du projet
                                  # qui a refusé `rafraichir` refuse aussi cette fusion ;
                                  # conflit résolu, puis `git add <fichiers résolus>` ; un index généré en
                                  # conflit ne s'édite pas : `git checkout --theirs -- <index>`, puis
                                  # `git add <index>`, le capitaine le régénère
pnpm install --frozen-lockfile --prefer-offline   # les outils avant le commit : le pre-commit formate avec le Prettier installé
git commit --no-edit              # (conflit seulement) message de git, sans ligne `Sujet:`
# retouches : commits ordinaires après la fusion (`pnpm exec prettier --write <fichiers>`, en-têtes exigés par un
# gate), messages Conventional Commits sans ligne `Sujet:` ; chacune se relit comme une sous-PR
git push origin HEAD:maj/<nom>    # arbre propre : le pre-push joue `pnpm check` sur l'arbre de travail
```

Le pre-push juge l'arbre de travail, pas ce qui part : un `git push <sha>:maj/<nom>` depuis un autre arbre passe le hook ; seule la CI exigée sur le sommet, que `fusionner` lit, fait foi. La fusion seule n'est jamais poussée. Refaite après un refus « plusieurs fusions » : `git switch -c maj/<nom>-2 origin/sujet/<nom>`, la même recette, une nouvelle PR, puis fermer l'ancienne.

**Le corps type de la PR**, titrée `chore(sujet): met <nom> à jour avec develop`, étiquetée `à-fusionner` :

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

« Retouches » quand il y en a. « Revue de ticket » dès qu'une résolution ou une retouche touche un chemin que `revue-exigee.mjs` (skill `fusionner`) exige, formatage compris (une retouche de formatage sous `apps/` l'exige ; `docs/` et le Markdown, non). Une PR de réception sans conflit de code ni retouche de code n'en exige aucune. Après une montée d'outil, la session joue la revue de ticket sur ses retouches ; elle porte sur la résolution (`git show --remerge-diff <fusion>`) et sur l'union des fichiers de chaque retouche (`git log -p --first-parent <fusion>..<sommet>`, commit par commit).

**Ce que le capitaine vérifie.** `fusionner` fait entrer la PR par avance rapide, sans squash : la filiation de develop reste, et le capitaine ferme la PR en nommant le sommet. Il exige : l'unique fusion hors du sujet et de develop est le premier commit, seule (message de git, sans ligne `Sujet:`), le sommet du sujet en premier parent et en second un commit de develop absent du sujet ; l'écart limité aux fichiers en conflit et aux index qui ont une `commande` (régénérés) ; le formatage que le pre-commit met dans la fusion n'est pas prouvé : il vient en retouche. **Chaque retouche se juge comme une sous-PR**, commit par commit (décision A-47 ter : aucune dispense par un formateur ; le capitaine n'installe rien et ne joue aucun formateur pour une PR de mise à jour). La section « Retouches » n'est jamais lue pour dispenser. Sinon, sortie 4 avec le motif. Seul le refus « plusieurs fusions » donne la recette pour refaire ; le refus du premier parent dit seulement de refaire la PR depuis `origin/sujet/<nom>` et renvoie ici ; les autres motifs disent ce qui est faux, sans recette.

## Geler un chantier (`geler`, `degeler`, `gel`)

Le gel est une ligne `Gel:` de la fiche de la carte, lue sur `origin/sujet/<nom>` : non vide, le chantier est gelé, quelle qu'en soit la forme (le produit peut l'écrire à la main dans l'éditeur de GitHub, sans session ; le gate ne la refuse jamais). `sujet.sh geler <nom> "<raison>"` écrit `Gel: AAAA-MM-JJ — <raison>` et le pousse, sans toucher à la branche ni à l'arbre de travail de qui l'appelle ; `degeler <nom>` la vide ; `gel <nom>` la lit (sortie 0 si gelé). Un sujet sans carte sur sa branche ne se gèle pas (sortie 4). Effets : `demarrer` et `livrer` refusent (sortie 4, la ligne citée), `fusionner` sort en 7, `file.sh` montre « gelée » pour la sous-PR, la livraison et la PR à recibler, `etat` donne le verdict `gelé` (il prime sur les autres) et `livrer-prets` l'écarte. Le capitaine continue de rafraîchir le sujet. La procédure complète d'arrêt (interrompre les filles, supprimer les réveils) est dans le skill `chantier`.

## Pousser la carte du chantier (`carte <nom>`)

Un sujet ne se pousse jamais à la main : le hook `garde-commandes` refuse tout `git push` vers `sujet/…`, sous toutes ses formes, et `gh` en écriture vers une branche, le hook `garde-github` toute écriture vers `sujet/…` par un outil GitHub (`push_files`, `create_or_update_file`, `delete_file`, `create_branch`, fusion d'une PR dont la base est gardée, mise à jour d'une PR dont la tête est gardée), sans quoi une session écrirait elle-même sur le sujet la ligne `Dépendances:` qui l'autorise. Seule la carte du chantier (`*.map.md`) y avance hors PR, par `bash scripts/chaine/sujet.sh carte <nom>`, depuis un clone normal : commits locaux qui modifient chacun en place ce seul fichier, formaté par Prettier, dont la ligne `Sujet:` nomme `sujet/<nom>`, seul ou parmi plusieurs valeurs séparées par des virgules, avant comme après. La commande rattrape le sujet par `git merge --ff-only`, vérifie chaque commit, puis pousse sans force le sommet vérifié. Elle refuse (sortie 9, rien n'est poussé) un autre fichier, une carte créée, supprimée, renommée ou changée de mode, la carte d'un autre sujet, une ligne `Sujet:` inexacte, un commit de fusion, un historique divergent, un fichier que Prettier changerait, une option ou un nom vide. `carte` sans argument liste toujours « ticket<TAB>sujet ».

## Livrer

Le capitaine livre lui-même un sujet « prêt à livrer » (`livrer-prets`) : plus de sous-PR ouverte **et** tickets déclarés tous faits, ou sujet né d'un regroupement (`sujet-auto`). À la main, pour livrer plus tôt ou un sujet `sujet-manuel` : `livrer <nom> "<type>(<scope>): <résumé du lot>"`. La PR s'ouvre sans `à-fusionner` : le poser après la relecture qu'elle demande (contre-revue si elle touche un chemin sensible), `issue_write` en session cloud. Sans `gh` utilisable, `livrer` sort en 14 : ouvrir la PR par l'outil GitHub MCP avec le titre et le corps du fichier qu'il nomme (livraison intermédiaire : la branche jetable n'est pas poussée, la sortie donne la commande). `livrer` refuse (sortie 4) un sujet qui ajoute une migration pas postérieure à la dernière de develop : le motif nomme le fichier à renommer et l'horodatage libre suivant (`migrations-ordre.mjs`, posé par `fusionner`). Un sujet « VIEUX » (plus de 5 jours) ou « EN RETARD » (plus de 20 commits de develop non fusionnés) se livre en l'état ou se découpe. S'il est renvoyé (conflit, CI rouge) : corriger sur le sujet, retirer `fusion-bloquée`, remettre `à-fusionner`.

## Clore un sujet livré (`clore`)

Un sujet livré par sa PR finale disparaît seul avec le réglage « Automatically delete head branches » ; un sujet livré par une livraison intermédiaire (`livraison/<nom>-<date>`), ou avant ce réglage, reste sur `origin`. `bash scripts/chaine/sujet.sh clore <nom>` le supprime par un `git push origin :refs/heads/sujet/<nom>` simple, sous les hooks git, sans option ni force (le hook d'agent refuse toute suppression écrite à la main : `git push --delete`, `:sujet/…`, `gh api -X DELETE …/git/refs/…` ; un script, il ne le voit pas, d'où les refus que la commande se fait à elle-même). Sortie 4, rien n'est supprimé : le sommet de `origin/sujet/<nom>` n'est pas contenu dans `origin/develop` ; une PR ouverte a le sujet pour base ou pour tête ; la carte du sujet, lue sur develop, n'est pas en `Phase: 6-nettoyage` ou `fini` (un sujet sans carte ne se clôt pas) ; le sommet est postérieur au passage de la carte en `6-nettoyage` ou `fini` (un sujet rouvert sous le même nom : vérifier d'abord) ; nom illisible (ou donné avec le préfixe `sujet/`) ou option ; l'URL de push de `origin` qui diffère de son URL de lecture (`pushurl`, `pushInsteadOf`). Aucun état local ne décide : objets de remplacement et greffes sont ignorés, et les PR ouvertes se lisent sur le dépôt de `origin`, jamais sur un `upstream` ni sur le dépôt par défaut de `gh`. Le sommet est relu juste avant la suppression : s'il a bougé, sortie 5 (le push de suppression, lui, n'a aucune condition sur la valeur supprimée : reste une fenêtre d'un aller-retour réseau, non fermée, voir `references/CONTENU.md`). Une suppression refusée par un hook git ou par le distant (protection de branche, proxy d'une session cloud) sort en 3 et la branche reste : la sortie dit de la jouer d'un poste local. `origin` ou GitHub illisible, ou suppression non confirmée par la relecture de `origin` : sortie 11. Sujet déjà absent : sortie 0. Le pre-push du socle laisse passer une suppression seule : sans commit neuf, il n'a rien à contrôler.

## Branches fusionnées

Avec le réglage « Automatically delete head branches » du dépôt (liste de l'admin), GitHub supprime la branche d'une sous-PR fusionnée dans son sujet, puis recible de lui-même sur le sujet les PR empilées dessus. Les branches `sujet/*` ne sont pas protégées : le push forcé est refusé aux sessions par le hook `garde-commandes`, et la suppression automatique n'intervient qu'à la fusion de la PR finale : un sujet livré autrement se supprime par `sujet.sh clore <nom>`.

## Ne jamais

- Rebaser une branche de sujet, pousser en force une branche, quelle qu'elle soit (la sienne comprise), ou pousser à la main sur un sujet, ou en supprimer un à la main : la carte passe par `sujet.sh carte <nom>`, la suppression d'un sujet livré par `sujet.sh clore <nom>`.
- Fusionner une sous-PR dont un check exigé est rouge ou en cours.
- Regrouper une série non déclarée sans l'accord de l'utilisateur, ou mettre un correctif de démo dans un sujet.
