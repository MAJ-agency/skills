# Une spec trop longue entre dans le message de `criticite` par son en-tête et les sections qui citent la règle ; le plafond reste, et la sortie dit ce qui est retenu

Status: ready-for-agent
Type: amélioration
Modèle: sonnet. Une fonction pure de découpage (titres, clôtures), le tri appelé par la ligne de commande seulement au-delà du plafond, une note dans le message, une phrase du prompt, deux paragraphes de `SKILL.md`, deux assertions de banc retournées (`scripts/depot.test.mjs:886` et `:901`) et sept bancs neufs. Rien n'est à concevoir hors des décisions `A-250` à `A-252`. Le découpage a été essayé en écrivant ce ticket (« Ce qui a été joué »). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/criticite/scripts/contexte-regle.mjs` (le commentaire de tête, 16-19 et 26-27 ; `ligneNomme`, 78 ; `message`, 91-101 ; la ligne de commande, 181-190) ; `skills/chaine/criticite/scripts/contexte-regle.test.mjs` (l'import, 11 ; des bancs neufs après 285) ; `skills/chaine/criticite/references/prompt.md` (après 56) ; `skills/chaine/criticite/SKILL.md` (44 et 46) ; `skills/chaine/criticite/references/CONTENU.md` (9, 13) ; `scripts/depot.test.mjs` (886 ; 901, le paragraphe « Ce que tu écris : … » du prompt) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

## Le besoin

Demande d'un architecte de projet, le 2026-11-23. Le script du skill `criticite` refuse une règle portée par plusieurs specs longues. Dans un cas réel, le message fait 408 676 caractères pour un plafond de 300 000. Le skill s'arrête, à juste titre, et la règle ne se classe pas. La proposition retenue par l'architecte :

- ne retenir de chaque spec que son en-tête et les sections qui citent la règle, titre et corps ;
- garder le plafond ;
- dire dans la sortie quelles sections sont retenues.

Rien ne presse.

## Le mécanisme, établi à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0). Le ticket 1 du programme « définitions d'agents » (8.4.0) a changé le lancement du sous-agent (`maj-skills:classeur-de-criticite`, `SKILL.md`, étape 3). Il n'a touché ni le script ni son banc.

- **Comment les specs sont lues.** `contexteDeLaRegle` (`contexte-regle.mjs:125-160`) retient toute `*.spec.md` sous `docs/` qui porte un identifiant lisible, quand sa ligne `Règles:` nomme la règle (`:148`) ou qu'un de ses tickets la nomme dans `Règles:` ou `Prouve:` (`:149-150`). Chaque spec retenue passe **entière** : `texte: sansCommentaires(readFileSync(p))` (`:156`), commentaires retirés et rien d'autre. Le banc `contexte-regle.test.mjs:153-174` et `:251-259` le tient : « la spec passe octet pour octet ».
- **Le plafond.** `PLAFOND = 300000` (`:37`). La ligne de commande compose le message entier (`:183`) et refuse au-delà, en sortie 2 (`:184-189`). Elle donne alors la taille du message, celle de la règle et celle de chaque spec, puis « rien n'est tronqué : la session s'arrête et le dit ». La taille est une longueur JavaScript (`texte.length`, en unités UTF-16), pas un compte d'octets. Le banc `contexte-regle.test.mjs:273-285` le tient.
- **Ce qu'est l'en-tête aujourd'hui.** `ligneNomme` (`:76-82`) lit la ligne `Règles:` dans `split(/\r?\n## /)[0]` : l'en-tête d'un document est ce qui précède sa première ligne `## `. Elle ne connaît pas les clôtures de code : un `## ` dans une clôture avant la première section y coupe aussi.
- **Ce qu'est « nommer la règle ».** Le motif de `ligneNomme` (`:78`) borne l'identifiant des deux côtés : `(?<![\w-])<ID>(?![\w-]|\.\d+(?!\w))`. `RULE_X_Y-30`, `RULE_X_Y-3-slug` et `RULE_X_Y-3.03` ne nomment pas `RULE_X_Y-3`. `…/RULE_X_Y-3.md` et « RULE_X_Y-3. » en fin de phrase la nomment.
- **Le message.** `message` (`:91-101`) écrit chaque spec sous la forme `<nom> :`, puis sa clôture (`cloture`, `:85-88`). Il n'existe aucune place pour dire qu'une spec est partielle. Le prompt (`references/prompt.md:1-5`) dit au sous-agent qu'il reçoit « la spec qui la porte ».
- **Ce que dit le skill.** `SKILL.md:44` : « chaque spec copiée au mot près ». `SKILL.md:46` : « Un contexte de plus de 300 000 caractères est refusé, avec la taille de la règle et de chaque spec : la session s'arrête, le dit, et ne tronque rien à la main. » Les deux phrases sont exigées mot pour mot par `scripts/depot.test.mjs:886`.

D'où le refus : une règle que citent quelques sections de plusieurs specs longues ne peut pas se classer, même quand ses passages tiennent largement sous le plafond.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-250`**, **`A-251`** et **`A-252`**. Ce qui suit les applique : rien n'y est à trancher.

1. **`A-250`. Le tri ne joue qu'au-delà du plafond.** Le message se compose d'abord comme aujourd'hui, chaque spec entière. S'il tient sous `PLAFOND`, il sort tel quel, octet pour octet celui de `main`. S'il le dépasse, **chaque** spec (pas seulement la plus longue) est réduite à son extrait (décision 2), puis le message est recomposé. L'énoncé de la règle n'est jamais réduit. `PLAFOND` reste 300 000, et la taille reste une longueur JavaScript.
   Raison : une spec dit souvent ce qu'exige une règle sans citer son identifiant. Le tri perd donc du contexte, et il n'a sa place que là où le refus serait la seule autre issue. Réduire toutes les specs, et non la seule plus longue, donne un résultat qui ne dépend ni de l'ordre des specs ni d'un choix de la session.
2. **`A-251`. L'en-tête, une section, citer la règle.**
   - **L'en-tête** d'une spec est ce qui précède son premier titre de niveau 2. C'est la coupe de `ligneNomme`, à ceci près que la clôture compte (point suivant). L'en-tête est **toujours** retenu, qu'il cite la règle ou non, puisqu'une spec peut ne porter la règle que par un ticket.
   - **Un titre** est une ligne qui commence en colonne 0 par `#` ou `##`, suivis d'une espace ou d'une tabulation, et qui est hors d'une clôture de code. Seuls les blocs de code à clôture comptent : un bloc indenté (quatre espaces) n'en est pas un, et ses lignes se lisent comme les autres, d'où un `## ` en retrait qui n'est jamais un titre (colonne 0). Une clôture s'ouvre par une ligne de 0 à 3 espaces, puis au moins trois `` ` `` ou trois `~`. Elle se ferme par une ligne qui ne porte que le même caractère, en au moins autant d'exemplaires. Non refermée, elle court jusqu'à la fin du fichier. Les titres soulignés (`===`, `---`) ne sont pas des titres ici.
   - **Une section** va d'un titre de niveau 1 ou 2, placé après l'en-tête, jusqu'au titre de niveau 1 ou 2 suivant, quel que soit le niveau qui l'a ouverte (un `##` ferme aussi une section ouverte par `#`), ou jusqu'à la fin du fichier. Les titres `###` et plus profonds restent dans leur section : une sous-section n'est jamais retenue seule.
   - **Une section cite la règle** quand son texte, titre compris, porte l'identifiant exact, borné par le motif de `ligneNomme`. Ce motif devient une fonction exportée, partagée par les deux usages. La citation compte où qu'elle soit : un tableau, une liste, un lien, une clôture. Une citation dans un commentaire ne compte pas : `sansCommentaires` l'a déjà retirée.
   - **L'extrait** est l'en-tête, puis les sections qui citent la règle, dans leur ordre, chaque morceau au mot près (CRLF compris). Rien n'est ajouté entre eux. Une citation dans un tableau garde **la section entière**, jamais la seule rangée.
   - **Une spec qui ne cite la règle que dans son en-tête** (sa ligne `Règles:`), ou qui n'entre que par un ticket, se réduit à son en-tête seul. Une spec sans section passe entière.
   Raison : le titre de niveau 2 est déjà la frontière de l'en-tête pour `ligneNomme` et pour le gate tickets. Un `###` retenu seul perdrait le titre qui le situe. La clôture compte, sinon un exemple de markdown dans une spec couperait une section en deux.
3. **`A-252`. Ce que dit la sortie, et le refus après le tri.**
   - **Dans le message** (la sortie standard, que la session passe telle quelle) : une spec réduite s'écrit `<nom> (extrait : en-tête, « ## A », « ## B » ; écartées : <k>) :`, ou, quand aucune section ne cite la règle, `<nom> (extrait : en-tête seul ; écartées : <k>) :`. Chaque titre est recopié tel que la ligne le porte, sans les espaces de bord. Une spec dont le tri n'écarte rien garde la forme `<nom> :`. Le texte dans la clôture est l'extrait seul.
   - **Le prompt** porte une puce neuve, après « un cas n'affirme que ce que l'énoncé ou la spec disent de cette règle… » (`prompt.md:54-56`) : « une spec peut n'arriver qu'en extrait : son en-tête et les sections qui citent la règle, nommées sur la ligne qui la présente. Ce qu'une section écartée dirait ne se suppose pas : une situation que l'extrait ne tranche pas va dans « Questions » ; ». Elle tombe dans le paragraphe « Ce que tu écris : … » (`prompt.md:43-60`), que `scripts/depot.test.mjs:901` exige mot pour mot : cette assertion change à dessein (« Où »).
   - **Sur la sortie d'erreur, en sortie 0**, quand le tri a joué : `contexte-regle : contexte réduit : <avant> caractères, <après> après le tri (plafond 300000) ; chaque spec réduite à son en-tête et aux sections qui citent la règle`. Suit une ligne par spec réduite : `<nom> : <entier> caractères, <extrait> en extrait (en-tête, « ## A », …)`, ou `(en-tête seul)` quand aucune section n'est retenue. La section `## Criticité` de la PR recopie ces lignes sous la commande jouée.
   - **Après le tri, toujours au-delà du plafond**, le script refuse, en sortie 2, la sortie standard vide. Le message d'erreur : `contexte-regle : contexte trop long : <après> caractères (plafond 300000) après le tri, <avant> avant ; règle : <n> caractères`. Suit une ligne par spec : `<nom> : <entier> caractères, <extrait> en extrait (en-tête, « ## A », …)`, ou `(en-tête seul)` quand aucune section n'est retenue. Le message finit, comme aujourd'hui, par « rien n'est tronqué : la session s'arrête et le dit ». Cette forme garde les motifs du banc `contexte-regle.test.mjs:282-285`, qui ne change pas : son cas, une spec sans section, se réduit à elle-même et reste refusé.
   Raison : le sous-agent doit savoir qu'il lit un extrait, sans quoi il prendrait un silence pour une réponse. Le relecteur de la PR doit voir ce qui a été écarté. Le refus garde les mots d'aujourd'hui, pour que la session s'arrête comme avant.

Ce qui ne change pas :

- le choix des specs : `contexteDeLaRegle` rend toujours chaque spec entière. Le tri est une étape de la ligne de commande, sur ce qu'elle rend ;
- l'énoncé de la règle, les liens symboliques, les noms à caractère de contrôle, les specs hors convention et leurs notes ;
- `PLAFOND` et sa valeur ; la sortie 2 et ses autres causes ;
- les phrases du prompt que `scripts/depot.test.mjs:894-909` exige, hors l'entrée de `:901`, qui reçoit la puce neuve. La puce s'ajoute, elle ne remplace rien.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/criticite/scripts/contexte-regle.mjs` | `nommePar(id)` exportée, le motif de `:78`, que `ligneNomme` emploie. `decouper(texte)` exportée, qui rend `[{ titre: null, texte }, { titre, texte }…]` (l'en-tête, puis les sections). `extrait(texte, id)` exportée, qui rend `{ texte, titres, ecartees }`. `message` (`:91-101`) : une spec peut porter `titres` et `ecartees`, et quand `ecartees > 0`, sa ligne prend la forme de la décision 3. `messageBorne({ prompt, regle, specs, ignorees, horsConvention, id })` exportée, qui rend `{ texte, avant, reduites }` : `reduites` vaut `null` sans tri, sinon c'est la liste `{ nom, entier, extrait, titres, ecartees }`. La ligne de commande (`:181-190`) appelle `messageBorne` et écrit la sortie d'erreur et le refus de la décision 3. Le commentaire de tête (`:16-19`, `:26-27`) dit le tri. |
| `skills/chaine/criticite/scripts/contexte-regle.test.mjs` | l'import (`:11`) et sept bancs neufs (« Bancs à écrire ») ; les 24 tests de `main` inchangés |
| `skills/chaine/criticite/references/prompt.md` | la puce neuve, après `:56` (décision 3) |
| `skills/chaine/criticite/SKILL.md:44` | après « même si elle porte un niveau » : « ; quand le message entier passerait 300 000 caractères, chaque spec n'y entre que par son en-tête et les sections qui citent la règle (titre de niveau 1 ou 2, hors clôture de code), et le message nomme les sections retenues » |
| `skills/chaine/criticite/SKILL.md:46` | « Un contexte de plus de 300 000 caractères est refusé, avec la taille de la règle et de chaque spec : » devient « Un contexte qui passe encore 300 000 caractères après ce tri est refusé, avec sa taille avant et après le tri, celle de la règle et celle de chaque spec, entière et en extrait : ». La suite, « la session s'arrête, le dit, et ne tronque rien à la main », ne change pas. Puis une phrase : « Un tri se dit sur la sortie d'erreur du script, en sortie 0 : la section `## Criticité` recopie ces lignes sous la commande. » |
| `skills/chaine/criticite/references/CONTENU.md:9` | après « copiée au mot près, ses commentaires (…) retirés » : « ; au-delà de 300 000 caractères, chaque spec réduite à son en-tête et aux sections qui citent la règle, et le refus seulement si le message passe encore le plafond » ; la liste du banc y ajoute « le tri des specs au-delà du plafond » |
| `skills/chaine/criticite/references/CONTENU.md:13` | « Il ne reçoit que l'énoncé de la règle et la spec qui la porte » se nuance : « ou, au-delà du plafond, son extrait (en-tête et sections qui citent la règle), que le message nomme » ; puis une phrase sur la puce de l'extrait, et pourquoi (un silence de l'extrait n'est pas une réponse) |
| `scripts/depot.test.mjs:886` | **banc existant qui change à dessein** : la phrase exigée prend le texte neuf de `SKILL.md:44` et de `SKILL.md:46` (lignes ci-dessus), mot pour mot |
| `scripts/depot.test.mjs:901` | **banc existant qui change à dessein** : l'entrée « Ce que tu écris : … » reçoit la puce neuve, mot pour mot, entre « … elle va dans « Questions » ; » et « - tu t'en tiens à ce que cette règle exige … » |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main` au moment de livrer, au troisième chiffre (8.5.1 si `main` est encore `3daedcd`), et sa note |

Modèle à imiter : les fonctions pures et exportées de `contexte-regle.mjs`, testées une à une (`sansCommentaires`, `ligneNomme`), et les bancs en ligne de commande sur un projet jouet (`projet`, `lancer`, `contexte-regle.test.mjs:36-46`, `:273-285`).

## Bancs à écrire

Dans `skills/chaine/criticite/scripts/contexte-regle.test.mjs`, identifiant `RULE_ALL_LIC-3` comme le reste du banc.

1. **`extrait` : l'en-tête et les sections qui citent la règle.** Une spec `# S`, `Règles: —`, puis `## A` qui cite la règle dans une rangée de tableau, `## B` sans citation, et `## Ce que dit RULE_ALL_LIC-3` sans corps qui la cite. L'extrait vaut l'en-tête, `## A` entière (tableau compris) et la troisième section, octet pour octet. `titres` vaut `["## A", "## Ce que dit RULE_ALL_LIC-3"]` et `ecartees` vaut 1.
2. **`extrait` : l'en-tête seul.** Une spec dont seule la ligne `Règles:` nomme la règle, avec deux sections sans citation : l'extrait est l'en-tête, `titres` est vide et `ecartees` vaut 2. Une spec sans aucune section : l'extrait vaut la spec, `ecartees` vaut 0.
3. **`decouper` : la clôture et les sous-sections.** Un `## ` dans une clôture `` ``` `` (puis `~~~~` refermée par `~~~~~`) ne coupe pas. Une clôture non refermée court jusqu'à la fin. `### A.1` reste dans `## A`. Un `# Annexe` après la première section en ouvre une, et un `## ` qui la suit la ferme. Un titre en retrait de deux espaces ne coupe pas, ni un `## ` dans un bloc indenté de quatre espaces. Les fins CRLF sont gardées.
4. **`nommePar` : l'identifiant borné.** `RULE_ALL_LIC-30`, `RULE_ALL_LIC-3-slug` et `RULE_ALL_LIC-3.03` ne citent pas ; `[r](../RULE_ALL_LIC-3.md)` et « voir RULE_ALL_LIC-3. » citent. Une citation dans un commentaire HTML, retirée par `sansCommentaires`, ne garde pas la section.
5. **En ligne de commande, sous le plafond : rien ne change.** Deux specs avec des sections sans citation, le tout sous le plafond : la sortie standard est égale à `message(...)` des specs entières, la sortie d'erreur est vide, et la sortie vaut 0.
6. **En ligne de commande, le tri.** Deux specs qui citent la règle dans une section chacune ; chaque spec porte sa propre section sans citation, `"x".repeat(PLAFOND)`. Sortie 0. Le message ne contient pas les `x` et porte `(extrait : en-tête, « ## A » ; écartées : 1) :` pour chacune. La sortie d'erreur porte `contexte réduit : \d+ caractères, \d+ après le tri (plafond 300000)` et une ligne par spec. Le message contient la puce neuve du prompt.
7. **En ligne de commande, le refus après le tri.** Une spec dont la section qui cite la règle passe à elle seule le plafond. Sortie 2, sortie standard vide. La sortie d'erreur porte `contexte trop long : \d+ caractères \(plafond 300000\) après le tri, \d+ avant`, puis `<nom> : \d+ caractères, \d+ en extrait \(en-tête, « ## A »\)`, puis « rien n'est tronqué ».

## Ce qui a été joué

En écrivant ce ticket, un prototype de `decouper` et `extrait` (règles de la décision 2, titres en colonne 0 ou jusqu'à trois espaces) a été joué sur sept cas : l'en-tête seul, le tableau, la clôture, les voisins de l'identifiant, la sous-section et l'annexe, la citation dans un titre, les fins CRLF. Chacun a rendu ce que disent les bancs 1 à 4. Le banc de `main` (`node --test skills/chaine/criticite/scripts/contexte-regle.test.mjs`) donne `# tests 24`, `# pass 24` à `3daedcd`. La décision a ensuite fixé la colonne 0, pour suivre `ligneNomme` : le banc 3 tient le titre en retrait.

## À faire, dans l'ordre

1. **Partir d'`origin/main`** : `git fetch origin main`, une branche neuve depuis `origin/main`. Relire chaque ligne citée ici. Si l'une a bougé, s'arrêter et l'écrire au lanceur.
2. **Les bancs, rouges** : les sept bancs neufs et les deux assertions retournées de `scripts/depot.test.mjs:886` et `:901`, le code et les textes intacts. Les voir rouges : les sept bancs neufs (les fonctions n'existent pas encore) et le test de `depot.test.mjs` qui porte `:886` et `:901`.
3. **Le code** (`contexte-regle.mjs`), puis **les textes** (`prompt.md`, `SKILL.md`, `CONTENU.md`). Les bancs verts.
4. **La version** et sa note : « Ce qui change » dit le tri au-delà du plafond, la note du message, la puce du prompt et le refus après le tri. « Ce qu'un projet fait pour en profiter » dit : rien, le script et le prompt sont lus dans le plugin, aucun `poser`. Puis un commit.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| sous le plafond, le message est celui de `main`, octet pour octet | banc 5 ; les 24 tests de `main` |
| au-delà, chaque spec réduite à son en-tête et aux sections qui citent la règle | bancs 1 et 6 |
| l'en-tête toujours retenu ; une spec qui ne cite la règle que dans son en-tête, réduite à lui | banc 2 |
| un titre de niveau 1 ou 2, en colonne 0, hors clôture ; une sous-section jamais seule | banc 3 |
| une citation dans un tableau garde la section entière | banc 1 |
| l'identifiant exact, borné comme `ligneNomme` ; un commentaire ne cite pas | banc 4 |
| le message nomme les sections retenues ; le prompt dit ce qu'est un extrait | banc 6 ; `scripts/depot.test.mjs:901` |
| la sortie d'erreur dit le tri, en sortie 0 | banc 6 |
| après le tri, toujours trop long : refus, avec les tailles avant et après et les sections | banc 7 ; `contexte-regle.test.mjs:273-285`, inchangé |
| `SKILL.md` dit le tri et le refus après le tri | `scripts/depot.test.mjs:886` |

## Mutations

Chacune seule, le fichier remis après (`git checkout -- <fichier>`) : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| le tri joue toujours, même sous le plafond | banc 5 |
| seule la plus longue spec est réduite | banc 6 |
| la clôture ignorée (un `## ` dans une clôture coupe) | banc 3 |
| `###` ouvre une section | banc 3 |
| l'en-tête retiré quand aucune section ne cite la règle | banc 2 |
| le motif de l'identifiant sans sa borne droite (`RULE_ALL_LIC-30` cite) | banc 4 |
| la note `(extrait : …)` retirée du message | banc 6 |
| le refus après le tri retiré (le message sort quand même) | banc 7 |
| la ligne de la sortie d'erreur retirée quand le tri a joué | banc 6 |
| la puce du prompt retirée | banc 6 ; `scripts/depot.test.mjs:901` |

## Vérification

1. Le banc ciblé : `node --test skills/chaine/criticite/scripts/contexte-regle.test.mjs scripts/depot.test.mjs`, rouge à l'étape 2 et vert après. Le compte de `contexte-regle.test.mjs` vaut 31 (24, plus 7).
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`. Attendu : sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus 7), recopié dans la PR.

## Ce qui n'a pas été établi

- Que le cas réel tienne sous le plafond après le tri. Le ticket n'a pas eu ses specs : il ne connaît que le compte de 408 676 caractères. S'il passe encore le plafond, le refus de la décision 3 dit ce qui reste, section par section. Le geste suivant, découper la spec ou relever le plafond, est une autre décision.
- La part des specs qui décrivent une règle sans citer son identifiant. C'est la raison d'`A-250` : le tri ne joue que là où, sans lui, le script refuserait.

## Hors périmètre

- Relever `PLAFOND`, ou le compter en octets.
- Choisir les sections par leur sens (sans l'identifiant), ou laisser la session les choisir : le script choisit l'entrée, jamais la session (`SKILL.md`, étape 2).
- Les tickets : ils ne passent toujours pas dans le message.
- `ligneNomme` et sa coupe de l'en-tête, qui ne connaît pas les clôtures : inchangée, elle ne fait que partager son motif.

## Comments
