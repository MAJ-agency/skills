# Un tour à deux sessions de relecture n'annonce son refus qu'une fois ses deux verdicts sur la PR

Status: ready-for-agent
Type: défaut
Modèle: opus — le changement tient en quelques lignes de `decider`, mais il se place entre les règles 1, 3 et 4 de la décision du Relecteur, le cœur du régime 8. Son banc fait 1 264 lignes, et l'ordre des règles y est tenu cas par cas (`decision-relecteur.test.mjs:729-769`). Il faut lire l'existant avant de toucher une ligne. Rien n'est à concevoir hors des décisions ci-dessous. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/decision-relecteur.mjs` (en-tête 1-56 ; `tours`, 387-424, **inchangé** ; `decider` : la règle 1, 565-571 ; la règle 4, 597-602 ; la règle 5, 604-627, dont `depuis`, 616) ; `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs` (H7, 123-143 ; l'ordre des règles, 757 ; un test neuf en fin de fichier, après 1264) ; `skills/chaine/relecteur/SKILL.md` (la table des gestes, 38 ; « L'état des sessions », 75 ; « Les lignes », 77-83) ; `skills/chaine/fusionner/references/CONTENU.md` (65) ; `scripts/bascule.test.mjs` (un test neuf en fin de fichier, après 325 à `b5c7ac3`) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Les tickets 115 et 116 (`ready-for-agent`) ajoutent eux aussi un test à `scripts/bascule.test.mjs` : la PR qui entre la seconde rejoue ce fichier sur `main`. Aucun ticket ouvert ne touche `decision-relecteur.mjs`. Le ticket 97 est livré (PR #174, plugin 8.8.1) : rien n'attend. Lignes lues sur `origin/main` à `bfa7fc0` (plugin 8.9.4).

## Le besoin

Constat de l'essai réel du régime 8 (journal de la carte, 2026-11-22). La PR 3 du dépôt jouet de l'essai porte une règle haute. Elle exige donc deux verdicts validés à chaque tour (double relecture).

- **22 h 46 UTC, tour 2.** La session A refuse, avec deux bloquants. Le Relecteur annonce « refusé, double » à l'auteur **avant** que le verdict de la session B soit sur la PR. Le conducteur corrige les deux bloquants de A seul (`0c5f026`), puis redemande la relecture.
- **23 h 14 UTC, tour 3.** La session A valide, la session B refuse avec deux bloquants, sur `.05` et `.03`. C'est le troisième tour refusé, et le plafond tombe : il faut une décision de plafond de l'architecte.
- **Tour 4.** B refuse de nouveau, un bloquant.
- **2026-11-23, 00 h 20 UTC.** La PR est validée, double, au tour 5.

Le verdict de B au tour 2 a été compté contre le tour, mais aucune ligne ne l'a annoncé : la PR, passée de `à-relire` à `à-reprendre` au refus de A, avait quitté la file du Relecteur. L'auteur n'a corrigé que ce qu'il avait reçu. Le tour suivant a échoué sur les bloquants qu'il n'avait jamais lus, et la PR est allée au plafond (`A-265`, raison).

Le besoin : **un tour n'annonce son refus qu'une fois tous ses verdicts sur la PR**, pour que l'auteur corrige tous les bloquants d'un coup. Un verdict qui ne vient pas ne doit pas faire attendre la PR sans fin.

## La cause, à la source

Lignes lues sur `origin/main` à `bfa7fc0` (plugin 8.9.4).

1. **Le tour est refusé dès son premier refus, et c'est voulu.** `decision-relecteur.mjs:418-421`, dans `tours` : `refus` réunit les verdicts `refusé` des sessions du tour, et `etat` vaut `'refuse'` dès que `refus` n'est pas vide, avant toute comparaison au nombre exigé. C'est la définition de la spec : « **Un tour est refusé** dès qu'un de ses verdicts est `refusé` » (`relecture-independante.spec.md:88`). Le défaut n'est pas là. Le compte des tours (`compte`, `:423`) et `tourValide`, que lit le capitaine, s'appuient sur cet état, et ils ont raison : un tour refusé ne sera jamais validé.
2. **Le geste part sur l'état, sans regarder qui manque.** La règle 4 (`:599-601`) : `surLaTete && dernier.etat === 'refuse'` rend `etiqueter(4, 'à-reprendre', REFUS)`, et `REFUS` vaut `verdict écrit sur la PR <n> : refusé, double` dès que `exiges >= 2` (`:555`, `:559`). La règle 1 (`:568-571`) rend `plafonner` dès que trois tours sont comptés, avec la même ligne `REFUS` à l'auteur. Aucune des deux ne regarde si une session de la dernière distribution n'a pas encore rendu son verdict.
3. **Un verdict plus tardif ne sonne personne.** Le geste de la règle 4 pose `à-reprendre` et retire `à-relire` (`retirer`, `:556-557`). Quand B écrit plus tard, la PR ne porte plus ni `à-relire` ni `à-fusionner` : `decider` sort avant toute règle par `rien(null, 'hors-file')` (`:522-523`), sans lire les commentaires. Le banc le tient : `decision-relecteur.test.mjs:73`, le même fil avec `etiquettes: ['à-reprendre']`, rend `HORS_FILE`. Le verdict de B est compté contre le tour (`refus`, `:418`) quand une décision relit le fil, mais jamais annoncé. C'est aussi `hors-file` qui fait taire le verdict tardif de la décision 4, arrivé après l'annonce.
4. **Le banc tient le défaut pour une règle.** `decision-relecteur.test.mjs:139-141` : « Un refus suffit : le tour est refusé dès qu'un de ses verdicts l'est, sans attendre R2 ». Avec `D(1, V1, ['r1', 'r2'])` et le seul refus de `r1`, le banc attend `[4, 'à-reprendre', 'verdict écrit sur la PR 12 : refusé, double']`. Le cas `:757` (« 4 avant 5 ») joue la même histoire, mais à `DEBUT + 9 * H`, bien au-delà du délai.
5. **Ce que l'attente peut reprendre.** La règle 5 attend déjà une session muette (`:604-627`) : elle rend `rien` avec la raison `attente`, les `attendues` et une `echeance`, calculée par `depuis` (`:616`) plus `delaiMs`. `relecteur/SKILL.md:75` fait lire l'état des sessions (`get_session`, le fichier `--sessions`) « pour les règles 4, 5 et 6 seulement » : les `preferees` d'un geste `distribuer` (règles 4 et 6), et les sessions attendues des seules PR rangées en règle 5 (`reecrire`, ou `rien` avec la raison `attente`), comme le dit la table de `:38`. Les sessions attendues d'un tour refusé n'y sont jamais lues.
6. **Les textes.** `relecteur/SKILL.md` ne dit nulle part quand un refus s'annonce. `fusionner/references/CONTENU.md:65` décrit `decider` sans le dire non plus. `fusionner/SKILL.md:29` (le capitaine, `tourValide`) et `chantier/SKILL.md:101` (« deux verdicts validés exigés ») restent vrais tels quels.

## Décisions

Décidées par l'architecte : **`A-265` (1)** le 2026-11-27, **`A-269`** et **`A-270`** le 2026-11-28 (spec `relecture-independante.spec.md`). Les décisions 1 à 3 et 5 à 7 appliquent `A-265` (1) et se déduisent des définitions d'`A-85` et d'`A-115` ; la décision 4 applique `A-269`. `A-270` dit ce que l'attente amende : (1) `A-85`, l'état d'une session se demande aussi pour les attendues d'un tour refusé, en règles 1 et 4 (décision 7) ; (2) `A-89`, au troisième tour compté, le plafond tombe à la fin de l'attente (décision 5) ; (3) un refus tardif sur une PR `à-fusionner` n'attend jamais (décision 6). Rien n'y est à trancher.

1. **`A-265` (1) — Un refus attend les verdicts de son tour.** Cinq conditions : le dernier tour porte sur le contenu de la tête (`dernier.surLaTete`) ; il est refusé (`dernier.etat === 'refuse'`) ; une session de sa dernière distribution n'a encore aucun verdict pour ce tour (`dernier.verdicts[s] === undefined`) ; l'attente n'est pas finie (décision 4) ; la PR ne porte pas `à-fusionner` (décision 6, `A-270` (3)). Alors `decider` rend `{ regle, geste: 'rien', raison: 'attente', attendues, echeance }`, de la même forme qu'en règle 5 :
   - `regle` vaut 1 si ce tour est le troisième compté, 4 sinon ;
   - `attendues` : ces sessions, dans l'ordre de la distribution ;
   - `echeance` : le plus petit `depuis(s)` des attendues, plus `delaiMs`.

   `depuis` sort de la règle 5 pour servir aux deux règles, sans changer de définition. Pendant l'attente, aucune étiquette ne change (`à-relire` reste), aucune ligne ne part, aucun commentaire de plafond ne s'écrit. La règle vaut quel que soit `exiges`. Un tour d'une seule session refusé n'attend jamais : sa session a rendu. Les attendues se lisent dans la seule dernière distribution du tour (`dernier.sessions`), jamais dans toutes ses distributions : une session remplacée n'est pas attendue, même sans verdict, et sa remplaçante l'est ; le refus d'une remplacée compte encore contre le tour (`A-115`).
2. **Ce qui compte comme rendu** : tout verdict du tour que lit `dernierVerdict` (`:400-411`), qu'il soit `validé`, `refusé` ou `incomplet`, ou modifié après coup (il est alors lu `incomplet`, ou refus). Dans un tour refusé, un verdict `incomplet` n'est pas relancé (pas de `reecrire`), pour deux raisons. La relance ferait relire un sommet que l'auteur va changer ; et un `incomplet` qui porte des bloquants (`skills/chaine/relecture/references/verdict.md:47` : la machine l'accepte, et lit `incomplet` un `validé` à bloquants) les a déjà écrits sur la PR, où l'auteur les lit avec les autres verdicts du tour.
3. **Les cas, une fois les verdicts tous rendus.** Un `validé` et un `refusé`, ou deux `refusé` : la règle 4, ou la règle 1, rend ce qu'elle rend aujourd'hui, au passage où arrive le dernier verdict. La ligne reste `verdict écrit sur la PR <n> : refusé, double`, envoyée à l'auteur et au conducteur. L'auteur lit alors sur la PR tous les verdicts du tour.
4. **Le verdict qui n'arrive pas** (`A-269`). L'attente finit dans deux cas : quand `maintenant` dépasse `echeance`, ou dès qu'une session attendue est `morte` ou `plafond` dans `sessions`. Le refus s'annonce alors avec les verdicts présents, sans remplacer la session et sans `Relecture en panne`. La ligne `REFUS` y prend un suffixe : `verdict écrit sur la PR <n> : refusé, double (sans le verdict de <id>[, <id>…])`, dans l'ordre d'`attendues`. Elle sert aussi de première ligne de `plafonner`. Une session `couple` ne finit pas l'attente : elle tourne, et son verdict compte (`compter`, `:398`, ne lit pas le couple). Un verdict qui arrive après l'annonce, avant la distribution suivante, compte contre le tour, mais aucune ligne ne part de plus. C'est une limite tolérée, sur le modèle d'`A-264` (1), écrite dans `relecteur/SKILL.md`. Après la distribution suivante, il est ignoré, comme aujourd'hui (`cloture`, `:394`).
5. **Le compte des tours ne change pas.** `tours` reste tel quel. Un tour refusé compte une fois dès son premier refus (`compte`, `:423`), et `tourValide` rend ce qu'il rend : le capitaine ne voit rien de neuf. Ce qui attend, c'est le geste, pas l'état. Le troisième tour compté reste donc le plafond. La règle 1 ne pose `Plafond — décision attendue` qu'à la fin de l'attente (tous les verdicts rendus, ou `A-269`) : l'auteur et l'architecte reçoivent ainsi les bloquants des deux sessions. C'est l'amendement d'`A-89` par `A-270` (2) : `A-89` disait le plafond tombé « au moment du refus » (`relecture-independante.spec.md:107`).
6. **L'ordre des règles.** L'attente joue juste après la première branche de la règle 1 (un `Plafond — décision attendue` plus récent que toute décision de plafond : inchangée) et avant sa seconde branche (trois tours comptés). Elle précède donc aussi les deux branches de la règle 4, la reprise après arbitrage comprise : un arbitrage du refus de A, écrit avant le verdict de B, ne lance pas la reprise, puisque le refus de B pourrait encore venir. La règle 2 ne s'applique jamais à un dernier tour refusé. **Un refus tardif sur une PR `à-fusionner` (règle 3 (b)) n'attend jamais** (`A-270` (3)) : il s'annonce et retire `à-fusionner` au passage où il arrive, comme aujourd'hui (`A-110`), même si une session du tour n'a pas rendu. Attendre laisserait `à-fusionner` sur une PR refusée, que le capitaine pourrait fusionner. Le cas : `exiges: 1`, deux sessions nommées, `r1` valide (`à-fusionner`), puis `r1` refuse, `r2` sans verdict. Si la tête change de contenu pendant l'attente (`surLaTete` faux), rien n'attend : on garde le comportement d'aujourd'hui (règle 1 si trois tours sont comptés, sinon règle 6 et un tour neuf aux sessions préférées).
7. **Les textes.**
   - `relecteur/SKILL.md:38` : « `rien` avec la raison `attente` (règle 5) » devient « (règles 1, 4 et 5) ».
   - `relecteur/SKILL.md:75` (`A-270` (1), qui amende `A-85`) : le début de la phrase, « Il se lit par `get_session`, pour les règles 4, 5 et 6 seulement : les `preferees` d'un geste `distribuer`, et, pour chaque PR que la passe range en règle 5 (`reecrire`, ou `rien` avec la raison `attente`), chaque session attendue, », devient « Il se lit par `get_session`, pour les règles 1, 4, 5 et 6 seulement : les `preferees` d'un geste `distribuer`, et, pour chaque PR que la passe range en règle 5 (`reecrire`, ou `rien` avec la raison `attente`) ou en règle 1 ou 4 (`rien` avec la raison `attente` : un tour refusé qui attend ses verdicts), chaque session attendue, » ; la suite de la phrase ne change pas. Une phrase est ajoutée à la fin du paragraphe : « En règle 1 ou 4, une attendue `morte` ou `plafond` finit l'attente : `jouer <n> --sessions <fichier>` annonce le refus ; `couple` ne la finit pas. »
   - `relecteur/SKILL.md`, « Les lignes » (77-83) : une phrase dit qu'un tour refusé ne s'annonce qu'avec tous ses verdicts sur la PR, ou à l'échéance, ou une fois une session attendue morte ou au plafond (le suffixe « sans le verdict de »). Elle dit aussi la limite du verdict tardif (décision 4).
   - `fusionner/references/CONTENU.md:65` : la même règle, en une phrase.
   - Les commentaires de `decision-relecteur.mjs` qui précèdent les règles 1 et 4 la disent aussi.

   Le fichier `relecteur/SKILL.md` reste sous 200 lignes (il en a 112).

   **La spec n'est pas éditée par le ticket.** Les deux phrases que l'attente contredit, l'état d'une session « n'est demandé que pour la règle 5 » (`relecture-independante.spec.md:99`, `A-85`) et le plafond tombé « au moment du refus » (`:107`, `A-89`), sont amendées par `A-270` (1) et (2), écrites dans la spec par l'architecte.
8. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre. Ce sera 8.9.6 si la PR en cours qui a réservé 8.9.5 est entrée avant ; sinon, la suivante de ce que `main` porte alors. La note dans `NOTES-DE-VERSION.md` dit trois choses : un refus double s'annonce avec ses deux verdicts, l'échéance existe, et un projet repose `fusionner` (`/maj-skills:socle-chaine-de-production`, après `claude plugin marketplace update maj`), parce que `decision-relecteur.mjs` est copié dans `scripts/chaine/` des projets. Le texte du skill `relecteur`, lui, se lit dans le marketplace.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs:565-571` | l'attente, entre les deux branches de la règle 1 (décisions 1, 4, 5 et 6) ; la ligne `REFUS` à suffixe quand l'attente finit sans tous les verdicts |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs:604-627` | `depuis` sorti de la règle 5, sans changer de définition |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs:387-424` | **inchangé** : `tours`, `etat`, `compte` (décision 5) |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs:1-56`, `:565`, `:597-598` | les commentaires : l'en-tête et les règles 1 et 4 disent l'attente |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs:139-141` | **change à dessein** : le seul refus de `r1` avec `r2` attendue rend l'attente en règle 4, puis l'annonce au verdict de `r2` |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs:757` | **inchangé** : à `DEBUT + 9 * H`, l'échéance est passée, le refus s'annonce en règle 4 (le texte de la ligne n'y est pas lu) |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs`, après 1264 | un test neuf (« Surfaces ») |
| `skills/chaine/relecteur/SKILL.md:38`, `:75`, `:77-83` | décision 7 |
| `skills/chaine/fusionner/references/CONTENU.md:65` | décision 7 |
| `scripts/bascule.test.mjs`, après 325 (fin du fichier à `b5c7ac3`, 8.9.5) | un test neuf, de texte (« Surfaces ») ; jamais dans un banc posé |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note (décision 8) |

Modèles : la règle 5 (`:604-627`) pour la forme de l'attente et de l'échéance ; H7 (`decision-relecteur.test.mjs:123-143`) pour un tour double joué pas à pas ; les tests de texte de `scripts/bascule.test.mjs` (`entre`, `exiger`, `interdire`, `:26-42`).

## À faire, dans l'ordre

1. **Partir de `main`** : une branche neuve depuis `origin/main` ; relire chaque ligne citée. La spec n'est pas touchée : `A-270` amende `A-85` (`:99`) et `A-89` (`:107`).
2. **Les bancs, rouges** : `decision-relecteur.test.mjs:139-141` changé à dessein, le test neuf de `decision-relecteur.test.mjs`, le test neuf de `scripts/bascule.test.mjs`. Les voir rouges.
3. **`decider`** (décisions 1 à 6), puis **les textes** (décision 7). Les bancs verts.
4. Un commit ; la version et sa note.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `exiges: 2`, `D(1, V1, ['r1', 'r2'])`, `r1` refuse : `{ regle: 4, geste: 'rien', raison: 'attente', attendues: ['r2'], echeance: DEBUT + 60_000 + 2 * H }` ; puis `r2` valide : `etiqueter`, `à-reprendre`, `LIGNES('verdict écrit sur la PR 12 : refusé, double')` ; puis `r2` refuse au lieu de valider : le même geste | `decision-relecteur.test.mjs:139-141`, changé |
| la même attente avec `r2` en `incomplet` : le refus s'annonce, sans `reecrire` | le test neuf |
| l'échéance passée (`maintenant` au-delà d'`echeance`) : `etiqueter`, ligne `verdict écrit sur la PR 12 : refusé, double (sans le verdict de r2)` ; `sessions: { r2: 'morte' }`, puis `{ r2: 'plafond' }`, avant l'échéance : le même geste ; `sessions: { r2: 'couple' }` : l'attente | le test neuf |
| deux tours refusés comptés, puis un troisième tour double où seule `r1` a refusé : l'attente en règle 1, sans `plafonner` ; `r2` rend son verdict : `plafonner`, dont la ligne à l'auteur est `… : refusé, double` ; l'échéance passée : `plafonner`, sa ligne à suffixe | le test neuf |
| `r1` refuse, un `Arbitrage — … — écarté` de son refus, `r2` attendue : l'attente, pas la reprise après arbitrage | le test neuf |
| remplacement (`A-115`) : `exiges: 2`, `D(1, V1, ['r1', 'r2'])`, `r1` muette remplacée par `r3` (`D(1, V1, ['r3', 'r2'], 'remplace', 'r1')`), `r2` refuse : l'attente, `attendues: ['r3']`, jamais `r1` ; à l'échéance, la ligne `… : refusé, double (sans le verdict de r3)` | le test neuf |
| deux attendues : `exiges: 2`, le délai du banc porté à 360 minutes (`delaiMs`, pour que l'attente tienne après le remplacement), `D(1, V1, ['r1', 'r2'])` à la minute 1, la remplaçante `r3` de `r1` écrite à la minute 130 (commentaire du banc, sans passer par la règle 5), puis le refus tardif de `r1` à la minute 131 (il compte, `A-115`). À `maintenant` = minute 132 : `rien`, raison `attente`, `attendues: ['r3', 'r2']`, dans l'ordre de la distribution, `echeance` = minute 1 + 360 (le plus petit `depuis`, celui de `r2`). À `maintenant` = minute 362 : `… : refusé, double (sans le verdict de r3, r2)` (avec `Math.max`, l'échéance serait la minute 490 et l'attente durerait encore) | le test neuf |
| refus tardif sur `à-fusionner` (`A-270` (3)) : `exiges: 1`, `D(1, V1, ['r1', 'r2'])`, `r1` valide, `etiquettes: ['à-fusionner']`, puis `r1` refuse, `r2` sans verdict : `{ regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-fusionner'] }`, ligne `verdict écrit sur la PR 12 : refusé`, sans attente | le test neuf |
| `r1` refuse, `r2` attendue, la tête change de contenu (`tete: T`, `memeContenu: { [V1]: false }`) : la règle 6 distribue le tour 2 | le test neuf |
| le compte : `comptes(...)` vaut 1 pendant l'attente comme après l'annonce ; `tourValide` rend `null` dans les deux cas | le test neuf |
| un tour d'une seule session refusé : le geste d'aujourd'hui, sans attente (H2, H3, H11 inchangés) | `decision-relecteur.test.mjs`, inchangé et vert |
| `relecteur/SKILL.md` : la table dit « (règles 1, 4 et 5) » ; « L'état des sessions » lit les attendues des règles 1 et 4 ; « Les lignes » dit l'annonce avec tous les verdicts, l'échéance, « sans le verdict de » et la limite du verdict tardif ; la phrase « (règle 5) » seule n'y est plus ; le fichier sous 200 lignes. `fusionner/references/CONTENU.md` : la phrase de l'attente dans la section de `decision-relecteur.mjs` | `scripts/bascule.test.mjs`, test neuf |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| l'attente retirée (le refus annoncé au premier verdict) | `decision-relecteur.test.mjs:139-141` et le test neuf |
| l'attente placée après la seconde branche de la règle 1 (le plafond posé au premier refus du troisième tour) | le test neuf (plafond) |
| l'attente placée après la reprise après arbitrage de la règle 4 | le test neuf (arbitrage) |
| un `incomplet` tenu pour non rendu | le test neuf (`incomplet`) |
| l'échéance ignorée | le test neuf (échéance) |
| `morte` ou `plafond` ignorés | le test neuf (`sessions`) |
| `couple` qui finit l'attente | le test neuf (`couple`) |
| la condition `surLaTete` retirée de l'attente | le test neuf (tête changée) |
| les attendues lues dans `distributions.flatMap((d) => d.sessions)` au lieu de la dernière distribution | le test neuf (remplacement : `r1` attendue) |
| l'ordre des attendues inversé | le test neuf (deux attendues : `attendues` et le suffixe) |
| `Math.max` au lieu de `Math.min` pour `echeance` | le test neuf (deux attendues : l'échéance) |
| la condition « sans `à-fusionner` » retirée de l'attente | le test neuf (refus tardif sur `à-fusionner`) |
| le suffixe « (sans le verdict de …) » retiré | le test neuf (échéance) |
| `compte` qui attend lui aussi la fin de l'attente (le tour compté seulement une fois annoncé) | le test neuf (le compte) |
| « (règle 5) » remis à `relecteur/SKILL.md:38` | `scripts/bascule.test.mjs`, test neuf |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test skills/chaine/fusionner/scripts/decision-relecteur.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs scripts/bascule.test.mjs scripts/relecture.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` plus `# skipped`. Le relevé part du compte de `main` au départ, plus les tests neufs, et il est recopié dans la PR. Le banc posé `decision-relecteur.test.mjs` passe aussi sous `scripts/poses.test.mjs` sans saut (`A-267`). La session lit le job `bancs` de sa PR avant de rendre la main (`A-212`).

## Ce qui n'a pas été établi

- Que la session B de l'essai ait écrit son verdict du tour 2 avant la distribution du tour 3. Le journal le dit compté (`A-265`, raison), mais ne donne pas l'heure de ce verdict. La décision n'en dépend pas : compté ou ignoré, il n'a jamais été annoncé.
- La durée qui sépare d'habitude les deux verdicts d'un tour double. Elle n'a pas été mesurée sur l'essai, d'où l'échéance gardée à `relecture.delai`, comme en règle 5.

## Hors périmètre

- La définition de la spec, « Un tour est refusé dès qu'un de ses verdicts est `refusé` » (`relecture-independante.spec.md:88`) : elle reste vraie. `A-265` (1) dit quand le refus s'annonce, pas quand le tour l'est.
- `tourValide` et le capitaine (`fusionner/SKILL.md:29`) : inchangés (décision 5).
- Une marque d'annonce sur la PR, qui permettrait de sonner l'auteur sur un verdict tardif : hors du ticket (`A-269`).
- Le conducteur sans PR de code hors du socle (`A-265` (2)) : ticket 116.

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `bfa7fc0` (plugin 8.9.4), d'après `A-265` (1) et le journal de la carte (2026-11-22, 22 h 46 et 23 h 14 UTC ; 2026-11-23, 00 h 20 UTC). La cause a été lue dans `decision-relecteur.mjs` et dans son banc. Le ticket 97 est livré (PR #174), d'où `Blocked by: —`. La question 1 est ouverte ; la décision 4 suit sa recommandation.
- 2026-11-28 — Question 1 (le second verdict qui n'arrive pas) tranchée par l'architecte : option (a), décision `A-269` ; la section « Questions à l'architecte » est retirée.
- 2026-11-28 — Relu ; cinq écarts corrigés ; `A-270`. La cause 3 dit `hors-file` (`:522-523`, banc `:73`), pas `etiquette-en-place` ; `A-270` (1) et (2) cités comme amendements d'`A-85` et d'`A-89`, la spec non éditée ; la phrase exacte de `relecteur/SKILL.md:75` ; surfaces et mutations du remplacement et de deux attendues ; le refus tardif sur `à-fusionner` n'attend jamais (`A-270` (3)).
- 2026-11-28 — Second tour de relecture : quatre écarts corrigés par l'architecte (repère de `bascule.test.mjs` lu sur `main` à `b5c7ac3`, plage des modèles 26-42, raison de ne pas relancer un `incomplet`, `maintenant` et délai de la surface « deux attendues »).
