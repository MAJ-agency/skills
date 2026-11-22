# Contre-relecture de la PR 157 (« anchorpost », ticket 89) — tour 1, sommet `6feef8d`

**Verdict : non conforme au sommet `6feef8dc9110dab85b5f8dc6f2cf2b746d2c8c23`** — 0 bloquant, 3 à corriger, 6 mineurs. Décisions de l'architecte (`A-213`) : la question 1 tranchée pour `migrate manifest` et `@^2.0.2`, la question 2 pour la fiche qui suit la CLI, les trois retouches retenues, les mineurs 4 à 8 portés. **Une seule retouche** les porte tous : [`retouches/retouche-157-tour-1.patch`](retouches/retouche-157-tour-1.patch), sur `6feef8d`, sha256 `4b0017c8d41873e9bc109d840fa6df12dbcbe90f3c3582d4f489db25e0ff7414` ([`retouches/SHA256SUMS`](retouches/SHA256SUMS)) : 5 fichiers, 40 lignes ajoutées, 12 retirées, aucun test neuf. Son banc posé seul sur `6feef8d` : 2 rouges sur 71 ; le patch entier : 113 sur 113 (les deux bancs du § 2 et les deux qui lisent la note) ; les 13 mutations de l'annexe toutes rouges, et 26 des miennes sur 26 ([« Tour retouché »](#tour-retouché-a-213)). La suite entière n'est pas rejouée sur ce patch : la session la joue.

Clone neuf de `https://github.com/MAJ-agency/skills`, le 2026-11-22 : la PR à `6feef8d`, `main` à `56ba394` (8.2.0), les annexes lues sur `claude/hopeful-lovelace-ouk6tz`. Clone en lecture seule d'Anchorpost `develop` (`31afa3d`). La CLI publiée sur npmjs.com, installée sans jeton dans des dossiers jetables : 2.0.0, 2.0.1 et 2.0.2. Les constats du tour de relecture (`83-89-relecture-tour-1/rapport.md`, n° 5, 6 et 9) sont portés ; ils ne sont pas repris ici.

## Ce qui tient

- **Le contenu** de la PR, hors `plugin.json` et `NOTES-DE-VERSION.md`, est le patch d'annexe (somme `7d0ceced…5381` vérifiée ; `git apply` sur `main`, puis aucune différence avec `6feef8d` hors ces deux fichiers).
- **La CLI publique, sans jeton** : `npm view` rend 0.0.0-stage à 2.0.2, `latest` à 2.0.2 (publiée le 2026-11-22 à 16:41 UTC, quatre heures avant le commit de la PR). Le paquet a `publishConfig.registry` npmjs et `access: public`.
- **L'étape 1 sur un dépôt qui porte la recette d'avant** : dépôt jouet pnpm (`.npmrc` à la ligne de registre et au jeton, `NODE_AUTH_TOKEN` factice) : `pnpm add -Dw @maj-agency/anchorpost@^2` sort en 1 (« not in the npm registry », en-tête d'autorisation envoyé à GitHub Packages) ; les deux lignes retirées d'abord : 2.0.2 installée, sortie 0 ; `pnpm anchorpost:index` écrit un index `"schema": "3"`, avec les alertes `manifest-schema-old` et `manifest-floor-converted` ; `pnpm anchorpost:check` vert sur le manifeste 2. Anchorpost `develop` ne porte pas ces lignes (son `.npmrc` n'a que `engine-strict` et `link-workspace-packages` : la CLI y est un paquet de l'espace de travail), il ne peut donc pas servir d'essai réel.
- **Le gabarit du manifeste** (placeholders remplacés) : accepté par `index` et `check` de la 2.0.2, sans erreur au groupe 1, alors que le plancher n'a pas de `by`.
- **`init` sur un dépôt déjà branché** selon l'étape 4 : `conservé scripts/docs/index-generes.json`, `inchangé package.json`, `conservé scripts/verify/anchorpost.mjs` ; seul le manifeste est réécrit.
- **La fiche contre le gate `tickets` et `preuves.mjs`** de `main` : `ecartsSuffisance` lit `Règles:` et `Prouve:`, refuse en `enforce` et avertit en `observe` une règle « à classer », sans cas, ou un cas que `## Surfaces` ne nomme pas (`RULE_…#<cas>`, même grammaire que la fiche) ; `preuves.mjs` joue `compare --base <base> --json`, ne juge rien sans index au pivot 3. La criticité (`by`, `reason`, `date`), les quatre genres, les deux portées, les dix familles, `caseRevision` et l'étiquette de cas suivent la copie de la spec (§ 1) et le README de la CLI ; `compare` sort 0 en `observe` et 1 en `enforce` (README, et joué).
- **Rien d'un projet client** dans les lignes ajoutées (grep des noms de projets, de personnes et de chemins privés : seule la ligne déjà présente des EPIC d'exemple, « licences », passe). Le nom d'une fédération cliente et un compte d'un projet restent dans `SKILL.md` l. 50 et 70, hors du diff, déjà sur `main`.
- **Le titre** : 110 caractères avec « (#157) ». CI verte au sommet (`bancs`, CodeQL).

## Constats à corriger

**1. [`SKILL.md` l. 112–113, « Passer au pivot 3 », points 1 et 2 ; `NOTES-DE-VERSION.md` l. 10] Le geste de conversion n'est pas celui de la CLI que le skill installe, et le texte ne dit pas ce que fait `init`.**

La CLI que `@^2` installe aujourd'hui, la 2.0.2, a une commande pour ce passage, `anchorpost migrate manifest` (Anchorpost `SPEC_ALL_ANC-5.70`, décisions `A-231` et `A-254`), et l'alerte `manifest-schema-old` que la session lit au point 1 la nomme : « Le passer au schéma 3 : `anchorpost migrate manifest`, puis relire le plancher. » Le point 2 du skill dit `pnpm anchorpost init`. Joué sur un dépôt jouet au manifeste 2, deux contextes dont un sans plancher, une `featureCriticality` de la version 2 :

- `init` (2.0.0 et 2.0.2, sans `--force`) **pose un plancher mesuré, daté du jour, sans `by`, sur le contexte qui n'en avait pas** (`plancher demo : 0 règles prouvées, 1 partielles (2026-11-22)`). Le skill ne le dit pas, sur un chemin qu'il vient de déclarer sensible et dont il dit qu'un plancher se relève « à la main, avec une date nouvelle et la personne qui le pose ».
- `init` **convertit déjà** la `featureCriticality` de la version 2 (`{ feature, level, validation }` → `{ feature, level, by, date }`, dite « convertie ») ; le skill demande de la réécrire ensuite à la main.
- Une `featureCriticality` **basse** de la version 2 n'a pas de raison : `init` refuse (`featureCriticality.0.reason : Une criticité basse sans raison est refusée`), rien n'est écrit, et l'ordre du skill (« `init`, puis, à la main, … `featureCriticality` réécrite ») ne passe pas. `migrate manifest` refuse aussi ; ajouter `reason` dans le manifeste 2 ne sert pas (`migrate` : « le schéma 3 ne porterait pas ces clés… perdues » ; `init` : même refus). Seule une réécriture à la main au schéma 3 passe.
- `migrate manifest --apply` (2.0.2, arbre propre) n'écrit que le manifeste, tel que la CLI le lisait (`proven: 1` → `{ proven: 0, partial: 1 }`, jamais re-mesuré ; aucun plancher posé sur le contexte qui n'en a pas ; `featureCriticality` convertie ; `sufficiency: observe`) ; puis `index` et `check` verts, `compare --base` le commit d'avant : « Aucun écart » ; `migrate manifest --check` : « déjà au schéma 3 ».
- `pnpm add -Dw @maj-agency/anchorpost@^2` sur un dépôt qui a déjà une 2.0.1 la garde (`--version` : 2.0.1) : `migrate manifest` n'y est pas (« Usage : anchorpost migrate <rules-json|markdown-table|identifiers|epics> »). La retouche demande donc `@^2.0.2` au point 1.

*Scénario* : une session reprend un dépôt au schéma 2 par « Passer au pivot 3 ». Au point 1, la CLI lui dit `migrate manifest` ; le skill lui dit `init`. Elle suit le skill : un plancher non signé entre dans le manifeste sans qu'elle le sache, puis elle cherche une `featureCriticality` à réécrire qui l'est déjà ; ou, si une feature est basse, `init` refuse et le skill n'a pas de suite.

*Retouche* (dans [`retouches/retouche-157-tour-1.patch`](retouches/retouche-157-tour-1.patch)) : point 1, `@^2.0.2`, la raison, et « Commiter » (`--apply` exige un arbre propre) ; point 2, `migrate manifest` (le plan, puis `--apply`), ce qu'elle écrit et refuse, le cas d'une feature basse, « Jamais `init --force` », le plancher relevé à la main ; la note 8.3.0 en accord ; le banc exige les passages neufs. Retenue (`A-213`, question 1).

**2. [`references/rules/anchorpost.md` l. 45 (et l. 38) ; `references/manifest.json`, `$comment`] La fiche définit « prouvée » autrement que la CLI et que la fiche des tests posée par 8.2.0.**

La fiche : « une règle est « prouvée » quand chacun de ses cas l'est, « partielle » quand elle a une preuve et qu'un cas manque, ou qu'elle n'en déclare aucun » ; le `$comment` du gabarit : « prouvées (chaque cas attendu prouvé) ». La CLI (README de la 2.0.0 à la 2.0.2, « La réalisation ») exige en plus un cas `nominal` déclaré et, dès `medium`, une réponse à chacune des dix familles. La fiche `.claude/rules/tests.md` du socle, sur `main` (8.2.0), le dit déjà : « Une règle est « prouvée » quand elle déclare un cas normal, que chacun de ses cas est prouvé et, moyenne ou haute, que chacune des dix familles de cas limites a sa réponse ». Les deux fiches, chargées ensemble par un projet, se contredisent. La copie de la spec (§ 2, point 3) porte la forme courte : la décision 4 du ticket dit que la CLI fait foi.

*Preuve* (CLI 2.0.2, dépôt jouet, chaque cas déclaré prouvé) : `RULE_ALL_TST-1`, basse, un seul cas `edge` : `partial`, `missing: { nominal: true }` ; `RULE_ALL_TST-2`, basse, un cas `nominal` : `proven` ; `RULE_ALL_TST-3`, moyenne, un cas `nominal`, aucune famille : `partial`, `missing.families` les dix ([`essais/essais.txt`](essais/essais.txt)).

*Scénario* : une session écrit les cas d'une règle moyenne d'après la fiche, prouve chacun, et dit la règle « prouvée » dans sa PR ou relève le plancher `proven` d'autant ; l'index la dit partielle, et `check` refuse le plancher au-dessus de la mesure.

*Retouche* (dans le même patch) : la phrase de la fiche aux mots de `tests.md` (`realisation.missing` nommé) ; la réponse d'une famille dite (un cas qui la porte, un cas `invalid` pour `invalid-input`, le « sans objet », une question ouverte) ; le `$comment` du gabarit ; le banc exige la phrase de la fiche et celle du commentaire. La fiche reste à 62 lignes. Retenue (`A-213`, question 2).

**3. [`scripts/preuve-suffisante-anchorpost.test.mjs`] Le banc laisse passer des mutations sur les décisions 2, 3 et 4 du ticket.**

Mutations neuves ([`mutations/mutations-contre.mjs`](mutations/mutations-contre.mjs), les deux bancs du § 2), vertes au sommet ([`mutations/contre-sur-6feef8d.txt`](mutations/contre-sur-6feef8d.txt)) :

- décision 2 : C2, l'étape 4 sans le point 5 (le manifeste hors de `cheminsSensibles`) ;
- décision 3 : C1, `init --force` au lieu de « sans `--force` » ; C12, le point 5 qui fait écrire `enforce` par la session « dès que `check` est vert » (le banc ne tient que « est une décision du produit, projet par projet », pas « une PR où une personne écrit ») ; C15, le plancher « ramené » au lieu de « relevé » ; C11, `admin.md` où « un agent écrit » `enforce` ;
- décision 4 : C3, une règle sans criticité dite « basse » au lieu d'« à classer » ; C4, « le plus bas des deux » niveaux ; C7, une étiquette de cas inconnue « ignorée » au lieu de « refusée » ; C8, « Un agent lève un écart en baissant un niveau » ; C10, le manifeste qui ne dit plus qu'un agent n'y baisse rien.

*Retouche* (dans le même patch) : ces passages exigés, dans les deux tests existants (le compte ne change pas). Retenue (`A-213`).

## Mineurs

Les mineurs 4 à 8 sont portés par le patch (`A-213`) ; le 9 est laissé à la session.

4. **Les cinq mutations vertes après les trois retouches** — C6 (les portées inversées), C9 (« la criticité d'une feature descend aussi par `Prouve:` »), C18 (le refus de criticité dit « en `observe` » dans la liste de `check`), C13 et C14 (la note sans `cheminsSensibles`, ou qui installe avant de retirer la ligne de registre). *Porté* : une ligne de banc chacune (la note lue par un `exiger` de `NOTES-DE-VERSION.md`, comme `preuve-suffisante-socle-tests.test.mjs` l. 62) ; les cinq sont rouges.
5. **La fiche, « Ses écarts : »** (l. 49) se lisait comme une liste fermée ; `compare` en a d'autres (`exception-posed`, `proofs-change-unvalidated`, `rule-devalidated`, `business-case-without-validation`, `base-unreadable`…), trop pour une ligne. *Porté* : « Ses écarts, entre autres (la liste fermée est celle du README de la CLI) : ».
6. **« Passer au pivot 3 », point 3** : l'alerte de projet ne compte que les règles **qui ont des preuves** sans cas ni criticité. *Porté* : « (l'alerte de projet de l'index compte celles qui ont des preuves ; les autres ont chacune leur alerte, « sans criticité » ou « aucun cas ») ».
7. **La note 8.3.0, « Ce qu'un projet fait »**, premier point : « Reposer la fiche » n'était pas borné. *Porté* : « dans un dépôt au pivot 3 (un dépôt au schéma 2 la repose au point 4 de « Passer au pivot 3 ») ».
8. **`SKILL.md` l. 82** : « Il n'est jamais généré après `init` » contre une commande qui réécrit le manifeste. *Porté* : « ; `anchorpost migrate manifest` le réécrit au schéma 3 tel que la CLI le lit déjà, sans rien y générer (« Passer au pivot 3 ») ».
9. **Le corps de la PR** ne recopie pas le journal des mutations (seulement « 13 rouges sur 13 »), que le § 3 du ticket demande : la session le fera (`A-213`).

## Questions à l'architecte

Tranchées (`A-213`) :

1. **`migrate manifest` (2.0.2) ou `init` ?** `migrate manifest` et `@^2.0.2`, la retouche du constat 1.
2. **La copie de la spec** (§ 2, point 3) et la spec d'Anchorpost disent « `proven` si la règle déclare au moins un cas et que chacun est prouvé », sans le cas `nominal` ni les familles : la fiche suit la CLI (constat 2) ; l'architecte signale l'écart à l'architecte d'Anchorpost.

Aucune question neuve.

## Ce qui a été joué

- **Le contenu** : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md` du patch d'annexe sur `main` ; aucune différence avec `6feef8d` hors ces deux fichiers.
- **§ 1 et § 2 du ticket** : le banc seul sur `main` : `# tests 2`, `# pass 0`, `# fail 2` ; au sommet, avec `depot.test.mjs` : **71 sur 71**.
- **Les 13 mutations de l'annexe**, au sommet : `sortie 0`, **13 rouges sur 13**, « toutes rouges » ([`mutations/annexe-sur-6feef8d.txt`](mutations/annexe-sur-6feef8d.txt)).
- **Mes 18 premières mutations** (C1 à C18, [`mutations/mutations-contre.mjs`](mutations/mutations-contre.mjs)) : au sommet, 2 rouges, 16 vertes ([`mutations/contre-sur-6feef8d.txt`](mutations/contre-sur-6feef8d.txt)).
- **La CLI publiée** : `npm view` (versions et `dist-tags`) ; 2.0.0, 2.0.1 et 2.0.2 installées à part, sans jeton ; `init` sans `--force` sur un manifeste 2 avec chacune ; `migrate manifest` sur la 2.0.1 (absente) et la 2.0.2 (plan, `--apply`, `--check`) ; `index`, `check` et `compare --base` sur le dépôt converti ; le gabarit du manifeste ; la réalisation de trois règles ; une `featureCriticality` basse de la version 2. Le script qui rejoue l'essai principal : [`essais/jouer.sh`](essais/jouer.sh) (`bash jouer.sh <dossier vide>`), sa sortie : [`essais/essais.txt`](essais/essais.txt).
- **L'étape 1** dans un monorepo pnpm jouet qui porte la recette d'avant (la ligne de registre et le jeton) : `pnpm add` refusé tant que les lignes sont là, installé après leur retrait ; `pnpm anchorpost init` (le repli de `pnpm` sur un binaire) et `pnpm exec anchorpost …` jouent.
- **La suite entière**, une fois, avant `A-213`, sur l'arbre des trois premières retouches (constats 1 à 3, sans les mineurs) posées sur `6feef8d`, `pnpm test` sous `setsid --wait` : `sortie 0`, **1 458 tests, 1 458 verts**, aucun échec, sauté ni annulé ; 21:15:07 → 21:32:04 UTC (`duration_ms` 1015768), charge 1,03 au départ, 2,22 à la fin. Elle n'est pas rejouée sur le patch final.

### Tour retouché (`A-213`)

Le patch unique, sur un arbre détaché à `6feef8d` ([`essais/bancs-avant-apres.txt`](essais/bancs-avant-apres.txt), [`mutations/tour-1-sur-retouche.txt`](mutations/tour-1-sur-retouche.txt)) :

- `git apply --check` : il s'applique sur `6feef8d` ; 5 fichiers (`SKILL.md`, la fiche, le gabarit du manifeste, la note, le banc).
- **Bancs avant** (le banc du patch seul, `git apply --include='scripts/*'`) : `preuve-suffisante-anchorpost.test.mjs` et `depot.test.mjs`, **71 tests, 2 rouges** (les deux tests du banc).
- **Bancs après** (le patch entier) : ces deux bancs, `relecture.test.mjs` et `preuve-suffisante-socle-tests.test.mjs` (qui lisent la note) : **113 sur 113**.
- **Les 13 mutations de l'annexe** : `sortie 0`, toutes rouges.
- **Mes mutations, C1 à C28** (dix ajoutées, C19 à C28 : `init` revenu au point 2, `init --force` permis, `@^2` seul, « prouvée » sans cas `nominal` ou sans les familles, la liste des écarts close, l'alerte qui compte toutes les règles, la note non bornée, la l. 82 sans `migrate manifest`, le commentaire du gabarit d'avant) : **26 rouges sur 26** ; C1 et C17 introuvables, leur texte étant remplacé par le patch (C19, C20, C22 et C23 les remplacent).
- Arbre remis après chaque mutation (`git status` : le seul patch).

## Ce qui n'a pas été établi

1. **Un dépôt client réel au schéma 2** qui porte encore la recette de GitHub Packages : aucun n'était accessible ; l'étape 1 et la conversion sont jouées sur des dépôts jouets. Ce que GitHub Packages sert encore à un vrai jeton (une 1.x publiée là, ou rien) n'est pas établi : le refus vu ici l'est avec un jeton factice.
2. **`migrate manifest` sur un manifeste 1**, sur une clé hors du schéma 3 dans `contexts[]` et sur une date de plancher mal écrite : lus dans le README et le ticket `SPEC_ALL_ANC-5.70` d'Anchorpost, pas joués.
3. **Le comportement de `compare` en `enforce`** sur les écarts que la fiche énumère : lu dans le README de la 2.0.2 ; joué seulement en `observe`, sans écart.
4. **La suite entière sur le patch final** : jouée sur les trois premières retouches seulement (1 458 sur 1 458) ; la session la joue sur le patch (`A-213`).
5. **La 2.0.3 et les suivantes** : le skill suit `@^2` ; ce qu'une version suivante change à `init` ou à `migrate manifest` n'est pas établi.
