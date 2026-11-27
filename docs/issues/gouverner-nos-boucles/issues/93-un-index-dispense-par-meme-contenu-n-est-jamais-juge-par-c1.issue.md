# Un index généré que « même contenu propre » dispense n'est jamais jugé par `C1` : il va au capitaine, sur toute PR

Status: needs-triage
Type: défaut
Modèle: sonnet — un tri de liste à changer dans `gestes.sh`, sa règle récrite dans cinq références, deux assertions de banc retournées et un banc neuf ; rien à concevoir hors de la décision `A-223`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/relecture/scripts/gestes.sh` (`c1`, lignes 473 à 503) ; `skills/chaine/relecture/references/criteres-session.md` (`C1`, lignes 6 à 15), `gestes.md` (lignes 57 et 60), `verdict.md` (ligne 64), `cas-limites.md` (ligne 66), `CONTENU.md` (ligne 15) ; `skills/chaine/relecture/SKILL.md` (ligne 92) ; `scripts/relecture.test.mjs` (lignes 556, 600, 947, 1291 à 1393) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Les tickets 94 et 95 (même famille, relecture) ne touchent aucun de ces fichiers hors des deux fichiers de version : les trois peuvent aller dans une même PR, dans l'ordre 93, 94, 95 ; 93 ne bloque rien et n'attend rien.

## Le besoin

Constat (5) de l'essai réel du régime 8 (carte, entrée « Fin de l'essai réel du régime 8 », et entrées du 2026-11-23 et du 2026-11-24 sur les PR #7, #13, #14, #15, #17 du dépôt jouet) : le critère `C1` de la session de relecture (critère `D4` de l'axe Documentation) compte **bloquant** un index généré périmé, alors que le capitaine le régénère avant toute fusion. Cinq PR sur dix-huit ont pris ce refus. Sur #17, c'est une **impasse** :

1. tour 1 refusé, un seul bloquant `C1` : `docs/agents/couts.md`, index à commande, périmé ;
2. l'auteur régénère l'index, dans un commit qui ne touche que lui ;
3. `meme-contenu.sh` dispense ce commit (index à commande) et dit le nouveau sommet « même » que celui du tour 1 ;
4. la règle 4 de `decision-relecteur.mjs` voit donc le tour 1, refusé, porter sur le contenu de la tête : `à-reprendre`, sans tour neuf, à chaque `à-relire` de l'auteur (trois fois) ;
5. seul un arbitrage `écarté` du conducteur, puis un tour non compté, en sortent.

Le bloquant demande une correction que la chaîne, par construction, ne voit pas. Le besoin : **un index que « même contenu propre » dispense n'est jamais jugé par `C1`** ; `C1` le nomme « Index à régénérer par le capitaine », sans bloquant, sur toute PR.

## Le mécanisme, établi à la source (`origin/main`, plugin 8.4.0)

- **`C1` ne laisse au capitaine que sur une PR de mise à jour.** `gestes.sh:473-484` n'écrit `c1/index-fusion.txt` que si `$B/maj` existe (PR de mise à jour d'un sujet), et seulement les index que la fusion a touchés ; partout ailleurs il est vide. `gestes.sh:498` : `perimes.txt` = `c1.txt` moins `index-fusion.txt`. Sur une PR ordinaire, **tout** fichier que la régénération change est un constat bloquant, index à commande dispensé compris.
- **Le diff relu, lui, exclut déjà ces index.** `gestes.sh:268-273` : `dispenses.txt` = les index à commande que la base **et** la tête déclarent par un chemin littéral, moins la liste elle-même ; `gestes.sh:277` les sort de `a-relire.txt`. Aucun axe ne les lit : seul `C1` les juge (`criteres-session.md:6-15`).
- **« Même contenu propre » les dispense.** `meme-contenu.sh:22-26` et `:302-309` : un chemin de classe `régénéré` (à commande, littéral, déclaré une fois, sur la cible et sur T, couvert par aucun motif) ; `:372-374` : un commit qui ne touche que de tels chemins est accepté ; `:399` : `même`. Ce que `meme-contenu.sh` dispense est un sous-ensemble de `dispenses.txt` (les deux exigent un chemin littéral à commande sur la base et sur la tête ; `meme-contenu.sh` écarte en plus les chemins déclarés deux fois ou couverts par un motif).
- **La décision garde le refus.** `decision-relecteur.mjs:267` : un tour porte sur la tête si son sommet est la tête ou si `memeContenu[sommet]` vaut `true` ; `:419-421`, règle 4 : tour refusé sur la tête, sans arbitrage `écarté` plus récent, `à-reprendre`.
- **Le capitaine régénère toujours avant de fusionner vers `develop`.** `fusionner/scripts/passer.sh:328-333` : `regenerer_index`, puis un commit si l'index a bougé, à chaque passage, PR à jour ou non, livraison de sujet comprise. Vers un sujet, `sujet.sh:601` (`mettre_a_jour_sous_pr`) régénère quand la sous-PR est en retard ; une sous-PR à jour entre sans régénération (`sujet.sh:1058`), et l'index se régénère à la mise à jour du sujet (`sujet.sh:766`) et à sa livraison (`passer.sh:328`). Un index périmé n'arrive donc jamais sur `develop`.

D'où l'impasse : un bloquant qui ne porte que sur ce que la chaîne dit « pas du contenu ».

## Décision proposée

**`A-223` (provisoire)** — `C1` classe ce que la régénération change contre `dispenses.txt`, sur toute PR : un fichier de `c1.txt` qui est dans `dispenses.txt` va dans `c1/au-capitaine.txt` (« Index à régénérer par le capitaine », sans bloquant, jamais un tour compté) ; un autre reste dans `perimes.txt`, bloquant. La branche « PR de mise à jour » (`index-fusion.txt`) disparaît : elle est contenue dans la règle générale. Raison : la relecture ne juge que ce que « même contenu propre » tient pour du contenu ; un bloquant sur le reste ne peut pas se lever par un commit, puisque ce commit ne change pas le contenu jugé. Écartée : faire dire « différent » à `meme-contenu.sh` après un tour refusé, ou lire le corps du verdict dans la règle 4 ; la première casse la garde du verdict sur la mise à jour du capitaine (`A-81`, `A-106`), la seconde fait lire un constat au Relecteur, ce qu'il ne fait jamais.

Ce qui ne change pas :

- la régénération se joue toujours, sur le sommet entier (`gestes.md`, étape 2) : une commande d'index en échec, ou une **vérification rouge** sur ce que la PR écrit, reste un bloquant (sortie 15) ;
- un fichier que la régénération change et qui n'est pas dans `dispenses.txt` (un index sans commande, un index déclaré par motif, un fichier qu'une commande récrit) reste un bloquant ;
- `D4` ne change pas (son texte est celui de `revue-de-ticket`, mot pour mot, `CONTENU.md:23`) : il juge les fichiers générés **du diff relu**, d'où les index dispensés sont déjà sortis.

## Quand le ticket est fait

1. Sur une PR ordinaire (vers `develop` ou vers un sujet), un index de `dispenses.txt` que la régénération change est dans `c1/au-capitaine.txt`, pas dans `c1/perimes.txt` ; `c1` l'écrit sous « index à régénérer par le capitaine ».
2. Sur une PR de mise à jour d'un sujet, de même pour **tout** index de `dispenses.txt`, que la fusion l'ait touché ou non.
3. Un fichier changé par la régénération hors de `dispenses.txt` reste dans `perimes.txt`, bloquant ; une vérification rouge reste un bloquant ; les sorties 12, 13, 14 et 15 ne changent pas.
4. `c1/index-fusion.txt` n'est plus écrit, et aucun texte du skill ne le cite.
5. Les cinq références et `SKILL.md` disent la règle générale, sans la restreindre à la PR de mise à jour : `C1` (`criteres-session.md`), l'étape 4 et le paragraphe qui suit (`gestes.md`), la ligne « Index à régénérer par le capitaine » (`verdict.md`), la ligne 5 de la table (`cas-limites.md`), la phrase de `CONTENU.md:15`.
6. Le cas de #17 rejoué au banc : une PR refusée au tour 1 sur un seul index dispensé ne peut plus l'être ; sur un dépôt jouet, la PR à index périmé rend `perimes.txt` vide et `au-capitaine.txt` non vide.
7. La suite entière passe ; la version est la suivante de `main` au moment de livrer, au troisième chiffre (8.4.1 sur `main` en 8.4.0 ; si 94 et 95 vont dans la même PR, une seule montée pour les trois), sa note dans `NOTES-DE-VERSION.md`.

## Où

Lignes lues sur `origin/main` (plugin 8.4.0).

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecture/scripts/gestes.sh` | `c1` : retirer le bloc `index-fusion.txt` (473-484) ; lignes 498-499, `perimes.txt` = `c1.txt` moins `dispenses.txt`, `au-capitaine.txt` = `c1.txt` inter `dispenses.txt` ; les deux `dire` (500-503) inchangés |
| `skills/chaine/relecture/references/criteres-session.md` | `C1`, lignes 12-15 : « Un index à commande que la base et la tête déclarent par un chemin littéral (celui que « même contenu propre » dispense) n'est pas jugé ici, sur aucune PR : le capitaine le régénère avant de fusionner ; le verdict le nomme, sans écart. » ; la phrase « Un fichier que la régénération change … est un écart » se limite aux autres fichiers |
| `skills/chaine/relecture/references/gestes.md` | l'étape 4 (ligne 57) récrite pour toute PR, sans `git diff <fusion>^1 <fusion>` ; ligne 60, « index à régénérer par le capitaine » sans « sur une PR de mise à jour » |
| `skills/chaine/relecture/references/verdict.md` | ligne 64 : « nomme chaque index à commande que `C1` trouve périmé et que la base et la tête déclarent par un chemin littéral » |
| `skills/chaine/relecture/references/cas-limites.md` | ligne 66 (table, étape 5) |
| `skills/chaine/relecture/references/CONTENU.md` | ligne 15, la fin du paragraphe « L'empreinte et `C1` » |
| `skills/chaine/relecture/SKILL.md` | ligne 92, la phrase « Sur une PR de mise à jour, un index à commande que la fusion a touché n'est pas jugé » |
| `scripts/relecture.test.mjs` | ligne 947 : sur la sous-PR de code, `docs/adr/README.md` et `docs/consignes.md` (deux index à commande littéraux de la base et de la tête) passent dans `au-capitaine.txt`, `perimes.txt` vide ; test B2 (1291-1393) : `docs/sommaire.md`, index à commande écrit à la main dans la retouche, passe aussi au capitaine, et l'assertion d'`index-fusion.txt` (1393) disparaît ; les textes tenus aux lignes 556 et 600 suivent les références ; un test neuf (ci-dessous) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante et sa note |

## Bancs à écrire

Dans `scripts/relecture.test.mjs`, sur le `projetJouet` existant, joués comme la session les joue :

1. **L'impasse de #17** : une PR ordinaire vers un sujet qui ajoute une ADR sans régénérer `docs/adr/README.md` (index à commande de la base et de la tête) : `c1` sort en 0, `perimes.txt` vide, `au-capitaine.txt` = `docs/adr/README.md`, la sortie porte « index périmés : 0 » et « index à régénérer par le capitaine : 1 ».
2. **Ce qui reste bloquant** : la même PR, plus un index **sans commande** que la PR change, et un index déclaré **par motif** que la commande récrit : les deux dans `perimes.txt`, aucun dans `au-capitaine.txt`.
3. **La liste qui retire** : un index à commande sur la base que la tête ne déclare plus à commande (absent de `dispenses.txt`) : `perimes.txt`, comme `meme-contenu.sh` le classe `retiré`.
4. **La vérification rouge** : une `verification` qui échoue sur ce que la PR écrit : sortie 15, comme avant.
5. **La cohérence avec « même contenu propre »**, sur le même dépôt jouet : pour chaque chemin de `au-capitaine.txt` des cas 1 à 3, un commit qui ne régénère que lui, puis `meme-contenu.sh <avant> <après> <base>` rend `même` ; pour chaque chemin de `perimes.txt`, un tel commit rend `différent`. Ce banc rougit dès que les deux définitions divergent dans le sens de l'impasse.

Mutations à prévoir (chacune rouge) : remettre la restriction à `$B/maj` ; classer contre `index-fusion.txt` au lieu de `dispenses.txt` ; inverser les deux `comm` ; une référence qui redit « sur une PR de mise à jour ».

## Ce qui n'a pas été établi

1. **L'écart de définition dans l'autre sens** : `dispenses.txt` ne retire ni un chemin déclaré deux fois ni un chemin couvert aussi par un motif, que `meme-contenu.sh` juge comme tout fichier (`ambigu`). Un tel index irait au capitaine sous `A-223` alors qu'un commit qui le régénère serait « différent » (un tour neuf, pas d'impasse). Aucun dépôt connu ne déclare ainsi ; le ticket ne l'aligne pas. À trancher si l'architecte veut une seule définition (question du rapport).
2. **Le texte de la note de version** : à écrire par la session qui livre.

## Hors périmètre

- La note sur la PR quand « même contenu propre » garde un refus : ticket 94.
- Le texte de `D4` et le skill `revue-de-ticket` (régime 7).
- La régénération d'une sous-PR à jour à son entrée dans le sujet (`sujet.sh:1058`) : l'index se rattrape à la mise à jour et à la livraison du sujet.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur le constat (5) de l'essai réel du régime 8, le code lu sur `origin/main` (plugin 8.4.0). Aucun banc joué : le ticket décrit ce qui est à écrire.
