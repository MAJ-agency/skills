# Refonte de la documentation d'Iroki au standard, pas à pas

> À déposer dans `MAJ-agency/iroki-monorepo` comme spec (`docs/features/programme/all/SPEC_ALL_PRG-<n>-refonte-documentation-standard.spec.md`, numéro par `next-id.mjs`), `Sujet: sujet/refonte-documentation`, `Origine : second grilling (dépôt skills, 2026-11-10)`. Elle prend la suite de `PRG-2` (toilettage des registres, fait) et en reprend le principe : **une règle ne change pas de sens sans une source datée**. Chaque étape est un ticket prêt pour agent, dans cet ordre.

## Ce qu'on obtient à la fin

Iroki est lu par Anchorpost. Ses 156 règles sont des fichiers, un par règle, dans le contexte `all` ; ses tests portent `[RULE_ALL_ORG-10]` ; ses 127 tickets portent `Type:` et, quand ils réalisent des règles, `Règles:` ; ses ADR, specs et documents de design portent leur type ; les collisions `BEN-1`, `BEN-2`, `DOC-1` ont disparu sans renommer un trigramme ; les 53 questions ouvertes qui citent une règle la marquent dans Anchorpost ; les prototypes citent les règles par leur identifiant complet.

## Prérequis, hors de ce dépôt

1. Le dépôt `skills` a livré le standard et le skill `anchorpost` (voir la spec Fedora, mêmes prérequis).
2. Le paquet `@maj-agency/anchorpost` est publié avec `migrate markdown-table` et `migrate identifiers`.

## Étape 1 — relever l'état avant de toucher

```bash
grep -hcE '^\| [A-Z]{2,4}-[0-9]+ \|' docs/metier/regles/*-regles.md | paste -sd+ | bc     # 156
grep -rhoE "(it|test)\((['\"])[A-Z]{2,4}-[0-9]+ — " apps packages --include='*.ts' | sort -u | wc -l
find docs/features -name '*.issue.md' | wc -l                                              # 127
grep -c '^### ' docs/questions-ouvertes.md                                                 # 54, gabarit compris
```

Noter les nombres dans `## Comments`. **Vérification** : ils sont écrits.

## Étape 2 — installer le paquet et poser la structure

1. `/maj-skills:tickets poser` depuis le plugin à jour : scripts et gabarits à la nouvelle grammaire (`regle.md`, `demande.md`).
2. `/maj-skills:anchorpost poser`, étapes 0 à 1 et 4 à 7 : `.npmrc`, devDependency, scripts, relais, `index-generes.json`, fiche `.claude/rules/anchorpost.md`, section admin, ADR. Pas encore `init` ni `index`.
3. `mkdir -p docs/metier/regles/all docs/demandes/all` avec un `.gitkeep` ; et pour chaque feature de `docs/features/`, un sous-dossier `all/` (le déplacement des fichiers est l'étape 4).

**Vérification** : `pnpm install` vert avec `NODE_AUTH_TOKEN` ; `pnpm anchorpost --version` répond ; `pnpm check` vert.

## Étape 3 — convertir les dix registres

**But** : 156 fichiers, un par règle, et pas une virgule perdue.

```bash
pnpm anchorpost migrate markdown-table                 # dry-run : liste, titres dérivés, statuts à compléter, décisions à extraire
pnpm anchorpost migrate markdown-table --apply         # écrit docs/metier/regles/all/RULE_ALL_<TRI>-<n>.md, supprime les dix tableaux
ls docs/metier/regles/all | wc -l                      # 156
```

Ce que la conversion fait de chaque colonne : spec Anchorpost § 8. À relire au `git diff` :

- **Les titres** : Iroki n'en avait pas, le script prend la première phrase de la règle. L'alerte de santé « titre dérivé » reste tant qu'un humain n'a pas retouché le titre. Un lot de relecture des 156 titres, par registre, par le produit : étape 8.
- **`ex`** (100 règles) : une source `{ ref: "R-22", path: docs/metier/reunions/reunion-2026-09-17-lancement.md }` à côté de la source horodatée.
- **Les statuts** : 154 `candidate` ; `PLA-11` `obsolete` avec la raison « remplacée par `RULE_ALL_PLA-18` (22/10) » et un lien `replaces` sur `PLA-18` ; `BEN-2` `rejected`, `date: 2026-10-29`, `by: Guillaume Jauffret`, `reason` le texte de la cellule.
- **Les précisions datées et le texte barré** restent dans le corps, tels quels.
- **Les décisions** : le dry-run liste les 20 à 30 lignes `_(… tranché par X le JJ/MM)_` ; pour chacune, un humain ajoute une entrée `decisions: [{ date, text, by }]`. C'est l'étape 8 aussi.

**Vérification** : 156 fichiers ; `pnpm anchorpost check` ne refuse que ce qui attend un humain (titres dérivés sont de la santé, pas des refus) ; `git grep -c 'status: obsolete' docs/metier/regles/all` = 1, `rejected` = 1.

## Étape 4 — réécrire les identifiants et déplacer les features

```bash
pnpm anchorpost migrate identifiers
pnpm anchorpost migrate identifiers --apply
```

Ce qui change :

| Avant                                                   | Après                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `docs/features/socle/SOC-1-socle.spec.md`, `issues/SOC-1-socle.17.issue.md` | `docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md`, `all/issues/SPEC_ALL_SOC-1-socle.17.issue.md` |
| `docs/features/cartographie/GEO-1-cartographie.spec.md`, `.map.md` | `cartographie/all/SPEC_ALL_GEO-1-…` ; la carte suit                      |
| `docs/features/documents/DOC-1-documents-et-fichiers.spec.md` | `documents/all/SPEC_ALL_DOC-1-…` ; ne se confond plus avec `RULE_ALL_DOC-1` |
| `docs/features/programme/PRG-1-programme-iroki.md` (sans suffixe) | `programme/all/SPEC_ALL_PRG-1-programme-iroki.spec.md` ; document de rôle `programme` dans le manifeste |
| `docs/features/programme/PRG-2-toilettage-des-registres.spec.md` et ses six tickets | `programme/all/SPEC_ALL_PRG-2-…`                                 |
| `docs/adr/ARC-1-…` à `ARC-16-…`                         | `docs/adr/ADR_ALL_ARC-1-…` à `ADR_ALL_ARC-16-…`                          |
| `docs/adr/dossiers/BEN-1-…`, `BEN-2-…`                  | `docs/adr/dossiers/ADR_ALL_BEN-1-…`, `ADR_ALL_BEN-2-…` ; plus de collision avec les règles |
| `docs/adr/web/WEB-1-…`, `WEB-2-…`, `docs/adr/mobile/MOB-1-…`, `MOB-3-…` | `ADR_ALL_WEB-1-…`, `ADR_ALL_MOB-1-…`                                |
| `docs/design/DES-1-jetons-et-etats.md`                  | `docs/design/DSG_ALL_DES-1-jetons-et-etats.md`                           |
| `it("ORG-10 — …")`, `test("ORG-8 — …")`                  | `it("[RULE_ALL_ORG-10] …")`                                              |
| `` `BEN-1` `` cité comme ADR dans une règle ou un ticket | `` `ADR_ALL_BEN-1` `` ; cité comme règle : `` `RULE_ALL_BEN-1` `` : **le dry-run liste chaque occurrence ambiguë**, un humain tranche d'après le contexte de la phrase (« ADR `BEN-1` » est une ADR) |
| commentaires des protos `// … (PLA-24)`                  | `// … (RULE_ALL_PLA-24)`                                                 |
| 127 tickets                                             | `Type: task` sur les 103 qui n'en ont pas ; `Règles:` proposée aux 64 qui citent une règle dans leur corps, **à relire** |

**Vérification** : `find docs -name '*.md' | grep -vE 'RULE_|SPEC_|ADR_|DSG_|DOC_|REQ_|reunion-|methode/|agents/|sources/|questions-ouvertes|recette/|GLOSSARY|README|CLAUDE|planches/|proto/'` ne rend rien ; `grep -rE "(it|test)\(['\"][A-Z]{2,4}-[0-9]+ — " apps packages` ne rend rien ; 127 tickets ; `pnpm check:tickets` vert ; `pnpm test` vert.

## Étape 5 — les liens déclarés et `ORG-1`

**But** : ce qui était dit en prose devient un lien lisible par Anchorpost.

- `RULE_ALL_ORG-1` (« paramètre d'organisation, jamais une constante ») : les règles qui dépendent d'un paramètre d'organisation (`PAI-2`, `PAI-6`, `PAI-7`, `TEL-8`, les seuils de relance et de remplacement) déclarent `links: [{ type: parameterized-by, target: RULE_ALL_ORG-1 }]`.
- `RULE_ALL_PLA-11` déclare `replaces` vers `PLA-18` (fait à l'étape 3 si le script l'a lu, sinon ici).
- Les contradictions tranchées par `PRG-2` (`CTR-2` / `BEN-1`, `ORG-1` / `TEL-11`) : la règle qui l'emporte garde son texte ; l'autre porte le passage barré et, si elle reste en vigueur sur le reste, un lien `refines` ou `contradicts` selon le cas, décidé par le produit.

**Vérification** : `pnpm anchorpost index` puis lecture des `links` de `RULE_ALL_ORG-1` dans l'index : toutes les règles paramétrées y sont, `origin: declared`.

## Étape 6 — le manifeste et le premier index

```bash
pnpm anchorpost init      # name, pitch, audiences, contexts: [all], documents, roles ; floor posé à la mesure
pnpm anchorpost index
pnpm anchorpost check
```

Dans le manifeste : `documents` (le glossaire ; `SPEC_ALL_PRG-1` en `programme` ; `ADR_ALL_ARC-2` ou le document d'architecture que `CLAUDE.md` nomme) ; `roles` pour les personnes nommées dans les décisions ; **pas d'`epics`** : un EPIC par domaine (`BEN`, `CTR`, `DOC`, `FAC`, `INT`, `ORG`, `PAI`, `PLA`, `QUA`, `TEL`), nommés d'après le registre des trigrammes de `nomenclature.md`, dont la colonne Sujet est relue pour que chaque nom soit celui que lit la MOA (« PLA — Planning »). Les lots de `PRG-1` ne sont pas des EPIC.

**Vérification** : `check` vert ; `health` relue : attendues, quatre `candidate` avec preuves (`ORG-8`, `ORG-10`, `ORG-11`, `ORG-16`) et 156 « titre dérivé » ; l'index commis ; l'espace Iroki créé par l'admin.

## Étape 7 — les gates et les scripts du dépôt

- `scripts/chaine/contexte-ticket.mjs` : il vient du skill `revue-de-ticket`, rejoué à jour (`/maj-skills:revue-de-ticket poser`) : il lit une règle dans son fichier, plus dans une ligne de tableau.
- `scripts/check.mjs` : `check:anchorpost` après `check:tickets` ; `.claude/chaine.json` : le relais dans `gatesRapides`.
- `docs/agents/criteres-revue.md` : le critère qui parle de l'identifiant d'une règle dans un nom de test dit la forme entre crochets.

**Vérification** : `pnpm check` vert ; `node scripts/chaine/contexte-ticket.mjs SPEC_ALL_SOC-1.17` rend le fichier d'une règle citée.

## Étape 8 — ce que le produit relit

Trois lots, par le produit, chacun une PR de documentation :

1. **Les 156 titres dérivés**, registre par registre (`BEN` 23, `CTR` 10, `DOC` 9, `FAC` 24, `INT` 10, `ORG` 16, `PAI` 11, `PLA` 24, `QUA` 11, `TEL` 18) : garder ou réécrire ; l'alerte de santé s'éteint au premier changement du titre.
2. **Les décisions** listées par le dry-run de l'étape 3 : une entrée `decisions[]` chacune, date, texte, nom.
3. **Les quatre règles testées encore `candidate`** (`ORG-8`, `ORG-10`, `ORG-11`, `ORG-16`) et toutes celles que le produit juge tranchées : `validated`, date, `by`. C'est le geste humain que la méthode exige ; aucune machine ne le fait.

**Vérification** : `health` de l'index sans « titre dérivé » ; au moins quatre `validated`.

## Étape 9 — fermer

`CLAUDE.md` § « État du dépôt » : « dix registres de règles `candidate` » devient « 156 règles dans `docs/metier/regles/all/`, lues par Anchorpost ». `PRG-1` et `PRG-2` : leurs chiffres (« neuf registres, 113 règles ») mis à jour. `docs/methode/decisions.md` et `nomenclature.md` : rejoués depuis le gabarit du socle à jour (`/maj-skills:socle-monorepo` ne se rejoue pas sur un dépôt plein : copier les deux fichiers de `references/methode/` et relire le diff). Le ticket note les nombres de l'étape 1 et ceux de la fin.

## Hors périmètre

- Valider une règle sans le produit : étape 8 seulement, à la main.
- Toucher au code au-delà des noms de tests et des commentaires de protos.
- Le workflow de mutation hebdomadaire : skill `socle-tests`, plus tard.
