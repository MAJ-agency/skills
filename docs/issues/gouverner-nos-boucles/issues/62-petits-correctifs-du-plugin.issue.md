# Petits correctifs du plugin : le banc des fichiers posés en tranches, la criticité en bloc, les noms de tests en français, `meme-contenu.sh` et `safe.directory`

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — quatre défauts mesurés, chacun avec sa décision, ses fichiers, ses cas de test et ses mutations ; rien à concevoir au-delà de ce que le ticket donne.
Blocked by: —
Dépendances: —
Fichiers chauds: `scripts/poses.test.mjs` (la PR 138 y touche d'autres lignes : les imports, la liste de CODEOWNERS, le second test ; fusion d'essai propre), `scripts/depot.test.mjs` (les PR 138 et 139 y ajoutent en fin de fichier ; ce ticket écrit à côté du test du gabarit de règle, loin de la fin), `skills/chaine/fusionner/scripts/meme-contenu.sh`, `skills/chaine/fusionner/scripts/meme-contenu.test.mjs`, `skills/chaine/tickets/references/gabarits/regle.md`, `skills/chaine/anchorpost/references/rules/anchorpost.md`, `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md`, `skills/monorepo/socle-monorepo/references/methode/decisions.md`, `skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts`, `skills/monorepo/socle-tests/references/gabarits/exemple.property.spec.ts`, `skills/monorepo/socle-tests/references/scripts/verify/tests-creux.test.mjs`, `skills/backend/socle-nest-hexagonal/references/api/CLAUDE.md`, `skills/backend/socle-nest-hexagonal/references/api/docs/ARCHITECTURE_GUIDELINES.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`. Deux fichiers neufs : `scripts/tranches.mjs` et `scripts/tranches.test.mjs`. Rien sous `skills/chaine/fusionner/scripts/double-relecture*` (PR 134).

## Le besoin

Ce ticket réalise la PR de « petits correctifs aux fichiers que personne d'autre ne tient » de la décision `A-149` (spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md`, branche de l'architecte). Quatre défauts, lus sur `origin/main` à `988a6c3` (plugin 7.31.2) ; `main` est passé depuis à `6087604` (7.32.0, PR 139), qui ne touche aucun des fichiers de ces défauts hors `scripts/depot.test.mjs` (en fin de fichier) et la note de version.

### 1. Le plafond du banc des fichiers posés est trop juste

**Le fait.** `scripts/poses.test.mjs` pose dans un projet jouet ce que les étapes `poser` copient (sous `scripts/chaine/`, `scripts/github/`, `scripts/docs/` et `scripts/verify/`), puis joue par un seul `node --test` les bancs de `scripts/chaine/` et `scripts/github/` ; plafond de l'enfant 600 s, du test 620 s. Sous charge, il a pris 526 s, 572 s puis 575 s, et a déjà dépassé.

**La mesure** (poste à 4 cœurs, Node 22.23.5, rien d'autre ne tourne) :

- Le banc seul : **324 s** (`user` 7 min 1 s, `sys` 2 min 40 s).
- Chaque banc posé, joué seul, l'un après l'autre : **680 s** en tout, dont `fusionner.test.mjs` **322 s** (116 tests), `sujet-fusionner.test.mjs` 145 s (58), `meme-contenu.test.mjs` 46 s, `boucle-outils.test.mjs` 45 s, `sujet.test.mjs` 29 s, `veille.test.mjs` 24 s, `github.test.mjs` 16 s, les seize autres moins de 10 s chacun.
- Dans `fusionner.test.mjs`, les durées sont étalées : le plus long test 23 s, puis 17,7 s, 11,4 s, 9,9 s, 9,1 s, et 2,7 s en moyenne sur 116 (somme 313 s).

**La cause.** `node --test` joue les fichiers en parallèle (3 à la fois ici), mais les tests d'un même fichier l'un après l'autre. `fusionner.test.mjs` est donc le chemin critique : 322 s sur 324, quand le travail entier (680 s de bancs) tiendrait en 227 s sur trois processus. Sous charge (la suite entière tourne à côté, dont ce même `fusionner.test.mjs` joué depuis le plugin), ce chemin unique, qui n'occupe qu'un processus, s'allonge d'autant. La PR 134 ajoutera `double-relecture.test.mjs` (1 488 lignes) au dossier posé : le banc grossira encore.

### 2. Le gabarit de règle montre la criticité en ligne

**Le fait.** `skills/chaine/tickets/references/gabarits/regle.md:21` montre `# criticality: { level: low | medium | high, by: agent | <clé de roles>, reason: … }`, raison sans guillemets. Un formateur replie un mappage en ligne trop long : Prettier 3.6.2, joué sur un en-tête qui porte `criticality: { level: medium, by: agent, reason: "…" }` de plus de 80 caractères, écrit `criticality:` puis `{` seul au retrait 2, une paire par ligne au retrait 4 avec virgule finale, `}` au retrait 2. Le lecteur d'en-têtes de « double relecture exigée » (PR 134, `enTeteDeRegle` de `double-relecture.mjs`, décision `A-143`) n'admet que des formes de ligne fermées ; joué sur les sorties de Prettier :

- repliée aux réglages par défaut, raison entre guillemets : **lue** (`{"niveau":"medium",…}`) ;
- repliée avec `tabWidth: 4` : **illisible** (« ligne 4 : l'ouvrant d'un mappage ou d'une liste pliés suit sa clé, seul sur sa ligne, au retrait 2 ») ;
- raison sans guillemets qui porte une virgule, la forme que le gabarit invite à écrire : **illisible** (« dans un mappage en ligne, attendu `clé: scalaire` »), et `yaml` y lit une raison tronquée et une clé parasite ;
- la forme en bloc du gabarit nouveau, raison entre guillemets qui porte « : » et une virgule : **lue**.

Un en-tête illisible rend la relecture « exigée ».

**Ce qui tient déjà.** Le skill `criticite` (`SKILL.md:52` et `:58`, point 5 « Écrire » de son étape 4, et `references/prompt.md`) montre déjà la forme en bloc, une clé par ligne. Les autres textes du plugin qui écrivent « `{ level, by, reason }` » le font en prose, pour nommer les trois clés, pas comme une ligne de YAML. Aucun autre texte de `skills/` (hors `fusionner/scripts/double-relecture*`) n'écrit `criticality: {`.

### 3. La fiche de tests contredit l'ADR sur la langue

**Le fait.** `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md:24` demande `it('should <comportement> when <condition>')`, et la ligne 25 donne l'exemple `it('[RULE_ALL_LIC-2] should refuse a second licence in the same season')`. L'ADR du socle `skills/monorepo/socle-monorepo/references/adr/ADR_ALL_ARC-4-langue-des-identifiants-de-code.md`, § Décision, met dans la prose, en français, les « noms de tests (qui citent les règles du registre, `<TRI>-<N>`) ».

**Les autres textes qui écrivent la forme anglaise** (recherche de `should` dans `skills/`) : `skills/monorepo/socle-monorepo/references/methode/decisions.md:125` (`it('[RULE_ALL_LIC-2] should <comportement>', …)`), `skills/chaine/anchorpost/references/rules/anchorpost.md:34` (`it('[RULE_ALL_LIC-3] should …')`), `skills/chaine/tickets/references/gabarits/regle.md:33` (`it('[RULE_{{CTX}}_{{TRI}}-{{n}}] should …')`), `skills/backend/socle-nest-hexagonal/references/api/CLAUDE.md:219` (`test("[RULE_ALL_XXX-2] <behaviour>", …)`) et `:220`, et `…/api/docs/ARCHITECTURE_GUIDELINES.md:789` (« names `should [behavior] when [condition]` »), `skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` (trois noms et les libellés de ses `it.each`) et `exemple.property.spec.ts` (un nom). Les squelettes web et mobile écrivent déjà leurs noms en français (`it("lit un corps conforme au contrat ErrorDto", …)`), comme `revue-de-ticket/references/prompt-ticket.md:17` (`it('[RULE_ALL_LIC-3] refuse une seconde licence')`).

**Aucun gate ne lit l'ancienne forme.** `socle-tests/references/scripts/verify/tests-creux.mjs` recopie le titre d'un cas creux sans en lire la langue ; aucun lint du socle (`valid-title`, `mustMatch`) ne contraint le nom ; Anchorpost ne lit que l'étiquette `[RULE_…]` en tête du nom ; aucun banc du dépôt n'exige `should`. Le banc de `tests-creux.mjs` rejoue un cas réel observé, « `should create` » : il reste tel quel.

### 4. `meme-contenu.sh` : le clone partiel muet, et `safe.directory`

Relevé sur le calcul du ticket 60 (PR 134), qui partage avec `meme-contenu.sh` la règle du dépôt propre (`A-119`, `A-122`), et limite connue du ticket 59 (`59-meme-contenu-propre.issue.md`, « Limites connues », 13 (a)).

**Le fait, clone partiel.** Dans un clone `--filter=blob:none --no-checkout`, d'une PR mise à jour avec develop dont la vraie réponse est « même », le calcul rend `illisible` avec la raison « `scripts/docs/index-generes.json de origin/develop illisible` » : un objet manque au dépôt propre, qui ne télécharge rien, et la raison ne nomme pas la cause.

**Le fait, `safe.directory`.** Le calcul retire toute variable `GIT_*` héritée (sauf `GIT_CEILING_DIRECTORIES`) puis lit le dépôt réel sous la configuration de l'utilisateur et du poste, entière : `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM` et `GIT_CONFIG_NOSYSTEM`, retirées, ne disent plus où elle vit (un `safe.directory` déclaré dans le fichier que nomme `GIT_CONFIG_GLOBAL` n'est pas vu : « pas dans un dépôt git ») ; et tout ce que git admet passe, `dossier/*` compris avec un git qui admet ce motif (le git 2.43 de ce poste ne l'admet pas ; non vérifié au-dessus), alors que la règle `A-135` n'admet qu'une valeur égale au chemin du dépôt, ou `*`, et rien quand `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` est dans l'environnement. `A-143` fixe la lecture : `git config --show-scope --includes --get-all safe.directory`, joué depuis `/`, lignes `system` et `global` seules (`git config --global`, nommé, ne lit pas le fichier XDG quand `~/.gitconfig` existe).

## Où

- `scripts/poses.test.mjs`, le premier test : l'appel unique `spawnSync(process.execPath, ["--test", "--test-reporter=spec", ...bancs], …)` et ses trois assertions. Les lignes que la PR 138 change (imports de la ligne 6, liste `FICHIERS_POSES`, commentaire de la ligne 67, second test) ne sont pas touchées.
- `scripts/tranches.mjs` (neuf) et `scripts/tranches.test.mjs` (neuf, joué par `pnpm test` : motif `scripts/*.test.mjs`).
- `skills/chaine/tickets/references/gabarits/regle.md:21` et `:33` ; `scripts/depot.test.mjs`, le test « le gabarit de règle porte `criticality`, `cases` et `notApplicableFamilies` en commentaire… » et deux tests nouveaux juste après lui.
- Les fichiers du défaut 3 listés ci-dessus ; `tests-creux.test.mjs` reçoit un cas.
- `skills/chaine/fusionner/scripts/meme-contenu.sh` : l'en-tête, la lecture des variables avant le retrait des `GIT_*`, les lectures du dépôt réel, la vérification du dépôt partiel après celle du dépôt superficiel ; `meme-contenu.test.mjs`, deux tests en fin de fichier.
- `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`.

## Décisions

### Défaut 1

1. **Raccourcir, pas monter le plafond.** Les plafonds restent 620 s pour le test et, par tranche, 300 s (le plus long test pèse 23 s seul).
2. **Chaque banc posé se joue en tranches, en parallèle.** `scripts/tranches.mjs` lit les noms des tests dans la source (`test(` en début de ligne, nom littéral suivi d'une virgule), et fait d'un banc de plus de `TAILLE = 10` noms distincts une tranche par paquet de 10 noms distincts (`--test-name-pattern`, motif ancré, chaque caractère à la lettre), plus une tranche de reste (`--test-skip-pattern` sur tous les noms lus) qui joue ce que la lecture ne reconnaît pas (nom calculé, test écrit en boucle) : `fusionner.test.mjs` donne 100 noms lus, dix tranches et un reste où tournent ses 16 tests écrits en boucle. Un banc de 10 noms distincts au plus se joue entier, **comme un banc qui écrit des sous-tests** (`<param>.test("…"`, `describe`, `suite`, `it`), quelle que soit sa taille : sous la tranche de reste, un sous-test dont le nom égale un nom lu serait sauté sans être vu. Aucun banc posé n'en écrit aujourd'hui, ni `double-relecture.test.mjs` de la PR 134. Les tranches tournent `max(2, availableParallelism() - 1)` à la fois (le parallélisme par défaut de `node --test`), les plus gros bancs d'abord.
3. **La couverture se prouve, pour les tests de premier niveau.** Un rapporteur de `node --test` écrit, par tranche, les noms des tests de premier niveau joués (les sous-tests ne sont pas comptés, d'où la décision 2). Chaque nom lu tourne exactement autant de fois qu'il est lu, dans sa tranche et nulle part ailleurs ; la tranche de reste ne rejoue aucun nom lu ; deux tests de même nom vont dans la même tranche (ils répondent au même motif). Le plancher de 150 tests joués reste.
4. **Raison, et ce qui ne change pas.** Le travail est le même (environ 9 min 20 s de processeur) : il n'est plus sur un seul chemin, il se répartit sur tous les cœurs. Seul, le banc n'est plus borné par `fusionner.test.mjs` mais par le travail et par sa plus longue tranche (le reste de `fusionner.test.mjs`, 38 s). Ni les bancs posés (dont `fusionner.test.mjs`, fichier chaud de la PR 138), ni la liste des fichiers posés ne changent. Node 22 ne rend aucun nom pour un test écarté par motif (`--test-name-pattern`, `--test-only`, `--test-skip-pattern` essayés) : les noms se lisent dans la source, et la tranche de reste couvre ce que cette lecture manque.

### Défaut 2

5. **Le gabarit montre `criticality` en bloc, une clé par ligne, en commentaire** :

   ```yaml
   # criticality:   à partir de l'index au pivot 3 (CLI Anchorpost 2.0.0) ; en bloc, une clé par ligne, que nul formateur ne replie ; …
   #   level: medium # low | medium | high
   #   by: agent # agent | <clé de roles>
   #   reason: "…" # entre guillemets ; sans eux, une virgule ou « : » coupe la raison
   ```

   `reason` entre guillemets : une raison qui porte « : » reste un texte pour YAML et pour le lecteur de la PR 134 (« nu : ne porte ni `: `, ni `:` final »). Le reste de la ligne (pivot 3, forme nue d'avant, skill `criticite`, `by`, `low`, jamais baisser) ne change pas de sens.
6. **La forme en bloc se lit comme la forme en ligne**, prouvé hors du dépôt (aucune dépendance nouvelle) : `yaml` 2.9.1 rend le même objet pour les deux formes ; la CLI Anchorpost lit l'en-tête par ce même `yaml.parse` (`src/repo/front-matter.ts`, bibliothèque embarquée à 2.9.1 dans la 1.3.0) ; `anchorpost index` 1.3.0, la dernière publiée, rend pour les deux formes le même diagnostic (« criticality : Invalid option: expected one of "low"|"medium"|"high" », le schéma du pivot 2) et un `anchorpost.json` identique octet pour octet ; Prettier 3.6.2 laisse la forme en bloc inchangée (il ne ramène qu'à une espace celles qui précèdent un commentaire de fin de ligne : le gabarit n'en met qu'une) et replie la forme en ligne ; le lecteur de la PR 134 lit la forme en bloc (§ Le besoin). La CLI 2.0.0 (pivot 3) n'est pas publiée : non jouée.
7. **Ailleurs** : rien à aligner (§ Le besoin) ; un banc garde que `skills/` n'écrive `criticality: {` nulle part hors `fusionner/scripts/double-relecture*`.

### Défaut 3

8. **Un nom de test se lit en français, au présent, sans « should »** : `describe('<Sujet>')` puis `it('<comportement> quand <condition>')`, exemple `it('refuse une seconde licence quand la saison en a déjà une')`, le même pour l'exemple étiqueté `[RULE_ALL_LIC-2]` ; un sujet de `describe` qui nomme du code garde le nom du code. Les fichiers en anglais du socle NestJS le disent en anglais (« names in French, since a test name is prose »), avec le même exemple.
9. **Les exemples sont traduits**, libellés d'`it.each` compris ; le code (identifiants, valeurs) ne change pas.
10. **Le banc des tests creux garde son cas « `should create` »** (un cas réel observé) et reçoit un cas nommé en français, étiqueté, accentué, refusé de même et recopié tel quel.

### Défaut 4

11. **Un dépôt partiel est `illisible`, et le dit**, sortie 21, en une ligne : « dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l'appeler (git clone sans --filter) » (la phrase du ticket 60). Reconnu à la configuration du dépôt, pas à ses objets (`git config --local --get-regexp '^(extensions\.partialclone|remote\..+\.promisor)$'`, toute ligne qui ne finit pas par ` false`) ; sortie 1 de `git config` : aucune clé ; toute autre sortie en échec : `illisible`. Lu après le dépôt superficiel, avant la première lecture d'un arbre ou d'un blob (la lecture du commit T et le court-circuit V égal à T le précèdent, comme sur `main` ; un clone `--filter=blob:none` garde ses commits). Seule ` false` dit « non partiel » : `promisor = no`, `0` ou `off` est compté partiel, par prudence.
12. **`safe.directory` suit `A-135` corrigée par `A-143`**, comme `double-relecture.mjs` de la PR 134 (`declareSur`) : `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM` et `GIT_CONFIG_NOSYSTEM` sont lues avant le retrait des `GIT_*`, et sont les seules passées à `git config --show-scope --includes --get-all safe.directory`, joué depuis `/` ; ne valent que les lignes `system` et `global` (toute autre ligne, dont la suite d'une valeur à saut de ligne : rien n'est admis) ; une valeur vide efface celles qui la précèdent ; seule vaut une valeur égale à la racine du dépôt (le premier dossier qui porte `.git` en remontant de `pwd -P`) ou `*` ; `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` présente : rien n'est admis. Un point final ajouté à la sortie de `git config` garde ses sauts de ligne de fin.
13. **Les lectures du dépôt réel se font sans configuration d'utilisateur ni de poste** (`GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`), et reçoivent par `GIT_CONFIG_COUNT` `safe.directory=<racine>` quand la racine est déclarée (jamais le motif qui l'a admise), et `safe.bareRepository` (décision 13 bis). Le calcul lit moins que git, jamais plus. Deux régressions, voulues par `A-135` : un dépôt d'un autre propriétaire admis par `dossier/*` est désormais refusé (« pas dans un dépôt git ») ; et **tout appelant qui a `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` dans son environnement** (un `git -c` en amont d'un hook, certains environnements d'agent, dont les sessions cloud de ce dépôt) voit refuser un dépôt d'un autre propriétaire déclaré sûr. Aucun script du plugin n'appelle `meme-contenu.sh` aujourd'hui (`git grep meme-contenu -- skills/`).
13 bis. **`safe.bareRepository` se lit comme `safe.directory`** (constat de la relecture : sans elle, le dépôt réel, lu sans configuration, aurait admis un dépôt nu trouvé sans `--git-dir` que git refuse sous `explicit`) : mêmes portées, même lecture depuis `/` ; sa dernière valeur est reportée telle quelle ; une lecture illisible, ou `GIT_CONFIG_COUNT` ou `GIT_CONFIG_PARAMETERS` présente : `explicit`. `lecteurGit` de la PR 134 a le même trou : signalé à l'architecte, pas corrigé ici (fichier de la PR 134).
14. **Aucun outil nouveau** : `pwd`, `cd`, `export` et le découpage de chaînes sont ceux de bash ; le cas « un PATH réduit à bash, git, jq, mktemp et rm » reste vert.

### Version

15. Un comportement change pour un projet (`meme-contenu.sh` refuse `dossier/*` et nomme le clone partiel ; la fiche de tests change) : le deuxième nombre, sur la version de `main` au moment de livrer. Les PR 134 et 138 annonçaient 7.32.0, prise par la PR 139 entrée entre-temps : la suivante de `main` au moment de livrer, 7.33.0 sur `main` à `6087604` (7.32.0, PR 139) ; la seconde PR à entrer reprendra `main`.

## Cas de test

Chacun vu rouge avant le correctif et vert après, sauf le cas des tests creux, vert avant comme après : il prouve que le gate ne lit pas la langue.

| Défaut | Cas | Rouge avant |
| --- | --- | --- |
| 1 | `scripts/tranches.test.mjs`, six tests : la lecture des noms ; un banc à sous-tests reconnu ; le motif ancré et littéral ; les travaux d'un banc court, long, à doublons, à sous-tests (seuil en noms distincts) ; la couverture et ses quatre fautes ; un banc jouet de onze tests (motifs spéciaux, préfixes, doublon, nom calculé, nom concaténé) joué tranche par tranche, chaque test une fois | module absent |
| 1 | `scripts/poses.test.mjs` : les bancs posés joués en tranches, chaque test exactement une fois, plancher 150 | (le même test, réécrit) |
| 2 | `depot.test.mjs` : « le gabarit de règle montre `criticality` en bloc, une clé par ligne ; aucun texte du plugin ne la montre en ligne » ; le test du gabarit exige la ligne nouvelle | la ligne porte `{` ; passage absent |
| 3 | `depot.test.mjs` : « les noms de tests montrés par le plugin sont en français, comme le veut ADR_ALL_ARC-4 » (la phrase de la fiche, son exemple, et aucun `should` en tête d'un nom ni donné en modèle dans `skills/`, hors le cas observé du banc des tests creux) | passages absents |
| 3 | `tests-creux.test.mjs` : « un cas creux nommé en français, étiqueté par une règle, est refusé de même » | vert avant : le gate ne lit pas la langue (c'est ce qu'il prouve) |
| 4 | `meme-contenu.test.mjs` : « un clone partiel (`--filter`) : illisible, la raison nomme la cause et le remède ; cloné en entier, la vraie réponse » (partiel, V égal à T, entier, marqué par `remote.origin.promisor` ou `extensions.partialclone`, `promisor = false`) | raison « index-generes.json … illisible » |
| 4 | `meme-contenu.test.mjs` : « un dépôt nu trouvé sans --git-dir, sous `safe.bareRepository = explicit` : refusé comme git le refuse » (témoin, `all`, `explicit`, système puis utilisateur, `GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS`, valeur à saut de ligne) | lu là où git refuse |
| 4 | `meme-contenu.test.mjs` : « le dépôt d'un autre propriétaire : illisible ; déclaré sûr … il est lu » (témoin refusé ; chemin, sous-dossier, `*`, lien symbolique avec `PWD` ; barre finale, `dossier/*`, lien, sous-dossier, `.`, `..` refusés ; `GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS` ; autre dépôt ; remise à zéro et après ; inclusion ; système selon `GIT_CONFIG_NOSYSTEM` ; ordre XDG puis `~/.gitconfig` ; valeur à saut de ligne) | « refusé » là où « lu » est attendu |

Le dépôt d'un autre propriétaire se monte sans droits : un `git` de banc, en tête du `PATH`, pose `GIT_TEST_ASSUME_DIFFERENT_OWNER=1` pour le seul dépôt jouet (le banc de la PR 134 fait de même).

## Surfaces

| Surface | Preuve |
| --- | --- |
| `scripts/tranches.mjs` | `scripts/tranches.test.mjs` |
| `scripts/poses.test.mjs` | lui-même, et sa durée (Vérification) |
| `regle.md`, criticité en bloc | `depot.test.mjs`, deux tests |
| les noms de tests, neuf fichiers | `depot.test.mjs`, un test ; `tests-creux.test.mjs`, un cas |
| `meme-contenu.sh` | `meme-contenu.test.mjs`, trois tests ; le reste du banc (56 tests) inchangé et vert |
| version et note | les tests de version existants de `depot.test.mjs` |

## Vérification

1. La suite entière, `pnpm test`, verte d'un seul tenant.
2. Durée de `scripts/poses.test.mjs` seul, même poste, rien d'autre ne tourne : **324 s avant, 183 s après** (`user` 6 min 57 s, `sys` 2 min 22 s : le travail ne change pas).
3. Mutations, chacune appliquée seule, le cas joué, le fichier restauré ; un passage témoin vert avant chaque série.
   - **Défaut 1** (`scripts/tranches.test.mjs`), 15 sur 15 rouges : le motif n'est plus ancré ; il ne lit plus à la lettre ; plus de tranche de reste ; le reste joue les noms au lieu de les sauter ; la couverture tolère un reste qui rejoue ; un compte faux ; un nom étranger dans une tranche ; les doublons répartis dans deux tranches ; un test en retrait lu comme un test du fichier ; un nom à substitution lu comme littéral ; le banc entier dès qu'il a un nom de trop ; le seuil qui compte les doublons ; un banc à sous-tests découpé ; `describe` qui n'est plus vu ; `<param>.test("…"` qui n'est plus vu.
   - **Défaut 2** (`depot.test.mjs`), 9 sur 9 rouges : le gabarit remontre la forme en ligne ; le mappage en ligne sur la ligne de la clé ; retrait de quatre espaces ; `reason` sans guillemets ; `by` retiré du bloc ; la prose ne dit plus « en bloc » ; la forme en ligne montrée dans la fiche Anchorpost ; la forme en ligne montrée par le skill `criticite` ; deux espaces avant le commentaire de `level`.
   - **Défaut 3** (`depot.test.mjs`, `tests-creux.test.mjs`), 11 sur 11 rouges : la fiche redemande `should … when …` ; son exemple étiqueté en anglais ; l'exemple de propriétés en anglais ; un `it.each` du jour métier en anglais ; le `CLAUDE.md` de l'API ; la fiche Anchorpost ; le gabarit de règle ; la méthode du socle ; les guides de l'API ; le gate des tests creux qui ne recopie plus un nom accentué ; le modèle étiqueté de l'API redevenu `<behaviour>`.
   - **Défaut 4** (`meme-contenu.test.mjs`, ses trois tests), 18 sur 18 rouges : le partiel n'est plus refusé ; `extensions.partialclone` n'est plus lu ; `promisor = false` compté partiel ; « aucune clé » (sortie 1) rendue illisible ; `*` n'est plus admis ; une barre finale admise ; une valeur vide n'efface plus ; `GIT_CONFIG_COUNT` présente n'empêche plus ; lu par `--global` nommé ; sans les variables qui disent où vit la configuration ; la suite d'une valeur à saut de ligne ignorée ; la racine n'est plus cherchée en remontant ; la racine par le chemin logique (`$PWD`) ; la déclaration n'est plus reportée au dépôt réel ; `safe.bareRepository` n'est plus reportée ; `GIT_CONFIG_COUNT` présente ne donne plus `explicit` ; une lecture illisible non plus ; la première valeur au lieu de la dernière.

## Ce qui n'a pas été établi

- **Quatre mutations du défaut 4 restent vertes, équivalentes pour les lectures d'aujourd'hui**, et ne sont pas comptées : jouer `git config` depuis le dossier courant plutôt que depuis `/` (un dépôt d'un autre propriétaire n'apporte aucune ligne `local`, et un dépôt du même propriétaire est lu sans déclaration) ; admettre une ligne d'une autre portée (depuis `/`, sans `GIT_CONFIG_COUNT` ni `GIT_CONFIG_PARAMETERS`, git ne rend que `system` et `global`) ; retirer `--includes` (git suit les inclusions par défaut quand aucun fichier n'est nommé) ; laisser le dépôt réel lire la configuration de l'utilisateur quand la racine est déclarée (aucun réglage d'utilisateur ne change `rev-parse`, `symbolic-ref`, `config --local` au point de se voir). Elles tiennent la règle d'`A-143` et d'`A-122` telle qu'écrite.
- **La garde « `[ -z "$reste" ]` »** (une sortie de `git config` sans saut de ligne final) n'a pas de cas : git finit toujours sa sortie par un saut de ligne.
- **La durée sous charge** se mesure dans `pnpm test` entier (Vérification 2) ; le poste d'ici a 4 cœurs, celui où le banc a pris 575 s n'est pas connu. Sous une charge qui occupe déjà tous les cœurs, le temps dépend du partage du processeur : le gain y est moindre que seul, le travail étant le même.
- **Les tranches d'un même banc tournent en même temps** : une recherche des écritures vers un chemin fixe partagé (le dossier du banc, un nom fixe sous le dossier temporaire) dans les bancs posés ne trouve rien, sans être exhaustive ; chaque banc crée ses dépôts jouets par `mkdtemp`.
- **La CLI Anchorpost 2.0.0** (pivot 3) n'est pas publiée : la lecture de la forme en bloc par son schéma n'est pas jouée ; son lecteur d'en-tête, `yaml.parse`, l'est.

## Hors périmètre

- Les bancs posés eux-mêmes, dont `fusionner.test.mjs` (fichier chaud de la PR 138) : on ne raccourcit aucun de leurs tests.
- `skills/chaine/fusionner/scripts/double-relecture*` (PR 134) : son lecteur d'en-têtes n'est pas touché.
- Les dépôts déjà écrits chez les projets (règles en ligne, noms de tests en anglais) : la note dit quoi faire, rien n'est migré.

## Comments
