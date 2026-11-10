# Refonte de la documentation de Fedora au standard, pas à pas

> À déposer dans `MAJ-agency/fedora` comme spec (`docs/features/platform/all/SPEC_ALL_PLAT-<n>-refonte-documentation-standard.spec.md`, numéro par `next-id.mjs`), `Sujet: sujet/refonte-documentation`, `Origine : second grilling (dépôt skills, 2026-11-10)`. Chaque étape est un ticket prêt pour agent, dans cet ordre ; aucune ne commence avant que la précédente soit fusionnée et que sa vérification soit verte. **Rien ne bouge dans `config.json` ni `federation.json`** : ce sont les fichiers chargés à l'exécution. `rules.json` n'est pas chargé par l'API ; il est lu par les gates, le README généré et le périmètre de mutation, et c'est lui qu'on convertit.

## Ce qu'on obtient à la fin

Fedora est lu par Anchorpost. Ses 1 682 règles sont des fichiers, un par règle, dans sept contextes (`all` et six fédérations) ; ses tests portent `[RULE_FNSMR_LIC-05]` ; ses 818 tickets portent `Type:` et `Règles:` ; ses gates lisent les règles par la bibliothèque du paquet `@maj-agency/anchorpost` et ne gardent que ce qui est propre à Fedora ; le périmètre de mutation est inchangé pour l'utilisateur ; `CONTEXT.md` est devenu `GLOSSARY.md` ; les 36 domaines ont un nom dans le registre des trigrammes ; les 71 questions sont dans `docs/questions-ouvertes.md`.

## Prérequis, hors de ce dépôt

1. Le dépôt `skills` a livré le standard (`ADR_ALL_ARC-1`, le registre un fichier par règle, le skill `tickets` avec sa nouvelle grammaire et son gate `Type:`/`Règles:`, le skill `anchorpost`).
2. Le paquet `@maj-agency/anchorpost` est publié avec `index`, `check`, `init` et `migrate` (spec « Anchorpost — la CLI, ses lecteurs, le schéma pivot version 2 », tickets .01 à .10), et ce dépôt a l'accès au paquet (recette admin du skill `anchorpost`).

## Étape 1 — relever l'état avant de toucher

**But** : avoir les chiffres qui diront, à la fin, que rien ne s'est perdu.

```bash
node -e 'const fs=require("fs");let t=0;for(const s of ["all","ffbad","ffdanse","ffsa","ffsavate","ffsb","fnsmr"]){const r=JSON.parse(fs.readFileSync(`federations/${s}/rules.json`)).rules;t+=r.length;console.log(s,r.length)}console.log("total",t)'
grep -rhoE '\[[A-Z0-9]+ [A-Z]+-[0-9]{2,3}\]' apps packages e2e --include='*.ts' --include='*.tsx' | sort -u | wc -l
find docs/features -name '*.issue.md' | wc -l
node scripts/verify/mutation-regles.mjs --list > /tmp/perimetre-avant.txt 2>/dev/null || node -e 'import("./scripts/verify/mutation-regles.mjs").then(m=>console.log(m.fichiersDesReglesProuvees(process.cwd()).join("\n")))' > /tmp/perimetre-avant.txt
```

**Attendu** : 1 682 règles (9 + 303 + 545 + 117 + 217 + 346 + 145), le nombre d'étiquettes distinctes, 818 tickets, et la liste des fichiers du périmètre de mutation. Les noter dans `## Comments` du ticket. **Vérification** : les quatre nombres sont écrits.

## Étape 2 — installer le paquet et poser la structure

**But** : la CLI est là, les dossiers de contexte existent, rien n'est encore converti.

1. Rejouer `/maj-skills:tickets poser` depuis le plugin à jour : les scripts de `scripts/docs/` et `scripts/verify/tickets*.mjs` passent à la nouvelle grammaire, les gabarits `regle.md` et `demande.md` arrivent dans `docs/agents/gabarits/`.
2. `/maj-skills:anchorpost poser`, étapes 0 à 1 et 4 à 7 du skill : `.npmrc`, devDependency, scripts `anchorpost:index` et `anchorpost:check`, `scripts/verify/anchorpost.mjs`, `index-generes.json`, `.claude/rules/anchorpost.md`, la section de `docs/agents/admin.md`, l'ADR. **Ne pas lancer `init` ni `index`** : les règles ne sont pas encore à leur place.
3. Créer `docs/metier/regles/{all,ffbad,ffdanse,ffsa,ffsavate,ffsb,fnsmr}/` avec un `.gitkeep`.

**Vérification** : `pnpm install` vert avec `NODE_AUTH_TOKEN` ; `pnpm anchorpost --version` répond ; `pnpm check` encore vert (les gates existants n'ont pas bougé).

## Étape 3 — le registre des trigrammes et le glossaire

**But** : les 36 domaines ont un nom lisible, le glossaire a le nom et le format attendus.

1. Dans `docs/methode/nomenclature.md` (à créer depuis le gabarit du socle si Fedora n'a pas ce fichier ; Fedora a `docs/architecture/all/ALL-ARC-5-dev-conventions.md`, qui renvoie alors au registre), tableau « Registre des trigrammes » : une ligne par clé de `RULE_DOMAINS` (`packages/shared-validators/src/federation-rules/rules.ts`), 36 lignes, avec son libellé. `FOR` et `FORM` restent deux lignes au même libellé « Formations », `CMP` et `COMP` « Compétitions » : un identifiant ne se renomme jamais. Plus les trigrammes structurels (`ARC`, `INF`, `PLAT`, `ADR` devient `ARC`). Et la table « Contextes du projet » : `all`, `ffbad`, `ffdanse`, `ffsa`, `ffsavate`, `ffsb`, `fnsmr`, avec les noms des fédérations.
2. `git mv CONTEXT.md GLOSSARY.md`, puis le mettre au format `**code** — libellé :` / définition / `_Éviter_ :` (gabarit `GLOSSARY.md` du socle). Remplacer `CONTEXT.md` par `GLOSSARY.md` dans `CLAUDE.md`, `docs/agents/domain.md` et partout où il est cité (`grep -rn CONTEXT.md --include='*.md' .`).

**Vérification** : `grep -c '^| \`' docs/methode/nomenclature.md` donne au moins 36 lignes de domaines ; `grep -rn 'CONTEXT.md' --include='*.md' . | grep -v GLOSSARY` ne rend rien ; `pnpm check` vert.

## Étape 4 — convertir les règles, contexte par contexte

**But** : chaque `rules.json` devient un dossier de fichiers, sans perte, `all` d'abord parce que les autres l'instancient.

Pour chaque contexte dans l'ordre `all`, `fnsmr`, `ffsa`, `ffsb`, `ffsavate`, `ffbad`, `ffdanse` :

```bash
pnpm anchorpost migrate rules-json --context <slug>            # dry-run : lire la liste et les alertes
pnpm anchorpost migrate rules-json --context <slug> --apply    # écrit docs/metier/regles/<slug>/RULE_<SLUG>_*.md, supprime federations/<slug>/rules.json
ls docs/metier/regles/<slug> | wc -l                           # = le nombre de règles relevé à l'étape 1
```

Ce que la conversion fait de chaque champ : spec Anchorpost § 8. Trois points à relire au `git diff` :

- les règles `status: question` (71) sont devenues des entrées de `docs/questions-ouvertes.md` (créer le fichier depuis le gabarit du socle au premier contexte) : titre, source, `Bloque :` l'identifiant, `Échéance :` ; la règle reste `candidate` ;
- les règles `module` (269) sont des règles `candidate` à construire, avec `extensions.fedora.status: module` : **le tri à la main** entre vraies règles et descriptions de module ou dépendances partenaire est l'étape 10 ;
- les règles avec `decision` sont `validated` à la date de la décision, `by` le nom écrit dans `par`.

Le plancher de chaque registre (`plancher.couvertes_prouvees`) est reporté par `migrate` dans `anchorpost/manifest.json` (créé à cette occasion s'il manque, en version 2) : `contexts[].floor`. Le socle `all` n'en avait pas : `init` le posera à l'étape 7.

**Vérification par contexte** : le compte de fichiers égale le compte de règles ; `git grep -c 'instanceOf: RULE_ALL_' docs/metier/regles/<slug>` égale le nombre d'entrées `socle` du `rules.json` converti (21 en tout) ; aucune `exception` sans `reason`. Un contexte par PR, chacune fusionnée avant la suivante.

## Étape 5 — réécrire les étiquettes de tests et les identifiants

**But** : une seule grammaire dans tout le dépôt.

```bash
pnpm anchorpost migrate identifiers           # dry-run : la table de correspondance et les ambiguïtés
pnpm anchorpost migrate identifiers --apply
```

Ce qui change (spec Anchorpost § 8) : `[FNSMR LIC-05]` devient `[RULE_FNSMR_LIC-05]` dans les titres de tests ; `ALL-LIC-16-…spec.md` devient `docs/features/licences/all/SPEC_ALL_LIC-16-…spec.md` (le dossier de contexte existe déjà chez Fedora) ; `ALL-ADR-39-…adr.md` devient `ADR_ALL_ARC-39-…md` ; `ALL-ARC-2-…spec.md` devient `SPEC_ALL_ARC-2-…`, `ALL-PRD-2-…spec.md` devient `SPEC_ALL_PRD-2-…` ; les citations en prose suivent. Les 818 tickets reçoivent `Type: task` s'ils n'ont pas de `Type:`, et une ligne `Règles:` quand `rules.json` les citait (`tickets[]`, 151 règles) ou quand une section `## Règles à prouver` les listait (117 tickets) : la section est remplacée par la ligne.

Puis à la main, ce que le script liste comme ambigu : les lignes `Règles :` libres qui citaient des ADR ou des fichiers `.claude/rules/*.md` (7 formes relevées) deviennent `Règles à lire :` dans `## Où` ; les specs `…-defauts-recette-…` gardent leur nom.

Deux fichiers de code à retoucher, que le script ne devine pas :

- `packages/shared-validators/src/federation-rules/rules.ts` : `RULE_TAG_PATTERN` devient `/\[RULE_([A-Z0-9]+)_((?:[A-Z]+)-\d{2,3})\]/g` ; `ruleIdPattern` inchangé pour l'identifiant court ;
- `.github/workflows/ci.yml`, job `e2e-api-federation` : `--testNamePattern '\[${{ matrix.code }} '` devient `--testNamePattern '\[RULE_${{ matrix.code }}_'`.

**Vérification** : `grep -rE '\[[A-Z0-9]+ [A-Z]+-[0-9]{2,3}\]' apps packages e2e` ne rend rien ; `grep -rhoE '\[RULE_[A-Z0-9]+_[A-Z]+-[0-9]{2,3}\]' apps packages e2e | sort -u | wc -l` égale le compte d'étiquettes de l'étape 1 ; `find docs/features -name '*.issue.md' | wc -l` égale 818 ; `pnpm check:tickets` vert (il lit maintenant `Type:` et `Règles:`) ; les tests unitaires passent.

## Étape 6 — réécrire les gates propres à Fedora sur la bibliothèque

**But** : Fedora ne garde que ses contrôles à lui, lus par le paquet ; le reste est à la CLI.

Dans `packages/shared-validators/src/federation-rules/` :

1. Supprimer `repo-rules.ts` et `rules-doc.ts`, `rules-doc.cli.ts` (le README généré n'existe plus : l'index est l'annuaire), le script `docs:federation-rules` de `package.json`, et l'entrée `docs/produit/federations/*/README.md` de `scripts/docs/index-generes.json` ; `git rm` les README générés.
2. Réécrire `federation-rules.registry.spec.ts` sur `readRules(root, slug)` et `collectProofs(root)` du paquet, en ne gardant que : les clés `config[].key` connues du contrat (`federationConfigShape`) ou du manifeste, et posées avec la bonne valeur dans `config.json` pour une règle `configured` ; les fichiers de `extensions.fedora.code` et `extensions.fedora.seed` existants, et les extraits de seed présents ; `configFederation('<slug>')` (ou `configsServies(` pour `all`) dans tout test P0 de `apps/api/src/` étiqueté pour une fédération servie ; les règles de mode étude (`ffbad`, `ffsavate`) qui portent toutes `decisions` et `extensions.fedora.outil` ; les cas en données valides (`cas.ts`). Tout ce que la CLI vérifie (schéma, identifiants, cibles, étiquettes vers une règle absente, plancher, tickets) **sort** de ce test.
3. `rules.ts` ne garde que `RULE_DOMAINS`, `RULE_TAG_PATTERN`, les schémas de `cas.ts` et ce que l'API lit encore ; `federationRuleSchema` et `federationRulesSchema` disparaissent avec `rules.json`.
4. `scripts/check.mjs` : l'étape 6 (registre) appelle `anchorpost check` par `check:anchorpost` ; la CI joue `pnpm check` donc le gate.

**Vérification** : `pnpm anchorpost:index` puis `pnpm anchorpost:check` verts ; `pnpm --filter @fedora/shared-validators test` vert ; le fichier `federation-rules.registry.spec.ts` fait moins de 150 lignes ; `pnpm check` vert.

## Étape 7 — le manifeste, les planchers, le premier index

**But** : Anchorpost peut lire Fedora.

```bash
pnpm anchorpost init      # complète anchorpost/manifest.json : nom, pitch, publics, documents, rôles ; pose floor pour all
pnpm anchorpost index
pnpm anchorpost check
```

Dans le manifeste : `documents` (le glossaire, `SPEC_ALL_ARC-2` architecture, `SPEC_ALL_PRD-2` programme) ; `roles` pour les personnes nommées dans les décisions (les noms restent, le rôle s'affiche entre parenthèses) ; `epics` : un EPIC par module de `federation.json` (`licences`, `finances`, `planning`, … quatorze), chacun listant ses domaines, correspondance écrite à la main et relue par le produit. Le PRD (`SPEC_ALL_PRD-2`, EPIC-001 à 013) n'est pas lu comme structure : il est un document.

**Vérification** : `check` vert ; la section `health` de l'index relue et ses alertes notées dans `## Comments` (attendues : des `candidate` qui ont des preuves, parce que Fedora n'avait pas d'axe validation ; des règles « dites couvertes sans test » venues du mode étude) ; `anchorpost/anchorpost.json` commis ; l'admin crée l'espace Fedora (contexte `fnsmr` d'abord) et voit les règles.

## Étape 8 — le périmètre de mutation

**But** : Stryker tourne comme avant.

`scripts/verify/mutation-regles.mjs` : `reglesProuvees` lit `readIndex(root).rules` filtrées sur `realisation.status === "proven"` ; `fichiersDesReglesProuvees` lit `extensions.fedora.code` par `readRules` ; `ETIQUETTE` disparaît. `mutation-regles-synthese.mjs` suit. Le workflow `mutation.yml` ne change pas.

**Vérification** : la liste produite est identique, ligne pour ligne, à `/tmp/perimetre-avant.txt` de l'étape 1 (`diff`) ; `node --test scripts/verify/mutation-regles*.test.mjs` vert ; un `workflow_dispatch` de `mutation.yml` sur « règles » rend un rapport.

## Étape 9 — le skill `reunion-federation`

**But** : une réunion produit des fichiers de règles, plus des entrées JSON.

`.claude/skills/reunion-federation/compte-rendu.md` § 7 : « mises à jour proposées du registre » devient « fichiers de règles proposés » : pour une règle nouvelle, un fichier `RULE_<SLUG>_<TRI>-<n>.md` complet, `candidate`, numéro par `next-id.mjs RULE <SLUG> <TRI>` ; pour une précision, le diff du corps avec la mention datée ; pour une contradiction, une entrée de `docs/questions-ouvertes.md` qui bloque la règle. Toujours additif : rien ne se rétrograde ni ne se renomme. `SKILL.md` ligne 76 suit. `integration-federation/pieges.md` : les pièges qui parlaient de `rules.json` parlent de fichiers.

**Vérification** : `pnpm check:contexte` vert (les références citées existent) ; une réunion rejouée sur un transcript ancien produit des fichiers valides au schéma (`pnpm anchorpost check`).

## Étape 10 — le tri des règles `module`

**But** : les 269 entrées `module` sont, chacune, soit une règle à construire, soit sortie du registre.

Pour chaque fichier avec `extensions.fedora.status: module` (`git grep -l 'status: module' docs/metier/regles`), un humain ou une session sous validation produit tranche : une vraie règle métier (FFSB `STR-17`, `LIC-28`) garde son fichier, `extensions.fedora.status` retiré ; une description de module ou une dépendance partenaire (FFDanse `STA-11`, `FIN-18`) passe `obsolete` avec la raison « description de module, pas une règle ; voir `SPEC_<CTX>_<TRI>-<n>` » et sa phrase va dans la spec du module concerné. Un fichier par PR de lot, contexte par contexte ; FFBaD (123) et FFSB (98) d'abord.

**Vérification** : `git grep -c 'status: module' docs/metier/regles` tend vers zéro ; chaque `obsolete` a une `reason` qui nomme une spec existante (`check` le vérifie).

## Étape 11 — fermer

`docs/produit/federations/<slug>/<CODE>-FED-n-registre-regles-metier.md` : les narrations restent, renommées `DOC_<SLUG>_FED-n-…` par l'étape 5 ; leur première ligne dit que l'état des règles est dans `docs/metier/regles/<slug>/` et dans Anchorpost. `CLAUDE.md` et `.claude/rules/federations.md` : `rules.json` disparaît des textes, remplacé par le dossier des règles et l'index ; `budget-contexte` tient. Le ticket de cette spec note les quatre nombres de l'étape 1 et leurs équivalents à la fin.

## Hors périmètre

- `config.json`, `federation.json`, le contrat `Federation.config` et tout ce qui est chargé à l'exécution.
- Valider une règle : aucun `candidate` ne passe `validated` par cette refonte. Les 586 règles qui avaient une `decision` sont `validated` parce qu'un humain l'avait écrit ; les autres attendent.
- La relecture des titres : Fedora a des titres, rien à dériver.
- Le PRD et le sprint plan : des documents, pas une structure.
