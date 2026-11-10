# Anchorpost — la CLI, ses lecteurs, le schéma pivot version 2

> À déposer dans `MAJ-agency/anchorpost` comme spec de feature (`docs/features/anchorpost/all/SPEC_ALL_ANC-2-cli-et-pivot-v2.spec.md` une fois le dépôt migré, étape 0 ci-dessous), avec `Origine : second grilling (dépôt skills, 2026-11-10)`. Hors périmètre de `ANC-1` par décision du premier grilling. Rien ici ne rouvre `ANC-1` à `ANC-22` sauf les quatre amendements de la section 6, décidés par la MOA au second grilling.

## Ce qu'on construit

Le paquet npm privé `@maj-agency/anchorpost` : une commande `anchorpost` à quatre sous-commandes (`init`, `index`, `check`, `migrate`) et une bibliothèque de lecture que les gates des projets importent. Il lit un dépôt au **standard de documentation** (dépôt `skills`, `ADR_ALL_ARC-1` et l'ADR du registre), produit l'index `anchorpost/anchorpost.json` au **schéma pivot version 2**, et le vérifie. Il remplace le « générateur minimal » de `ANC-1.03` et les deux adaptateurs prévus par `ANC-2` : il n'y a plus qu'**une forme source**, et `migrate` convertit une fois les anciennes formes.

Le paquet est hors ligne (`ARC-13`) : il lit et écrit dans le dépôt, ne parle jamais au service.

## 1. Ce que la CLI lit : la forme source, unique

| Objet       | Où, par convention                                               | Forme                                                                                      |
| ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| manifeste   | `anchorpost/manifest.json`                                       | JSON écrit à la main, schéma § 4                                                           |
| règles      | `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`               | en-tête YAML entre `---`, validé par le schéma § 3 ; énoncé markdown en corps              |
| specs       | `docs/features/<feature>/<ctx>/SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md` | en-têtes `Sujet:`, `Origine:` ; tableau `## Tickets`                                    |
| tickets     | `…/<ctx>/issues/SPEC_<CTX>_<TRI>-<n>-<slug>.<NN>.issue.md`       | en-têtes `Status:`, `Type:`, `Règles:` ; section `## Surfaces` (défauts)                   |
| demandes    | `docs/demandes/<ctx>/REQ_<CTX>_<TRI>-<n>-<slug>.md`              | en-têtes `Status:`, `Type: demande`, `Cible:`, `Demandeur:`, `Règles:`, `Suite:` ; tableau « Points relevés » |
| questions   | `docs/questions-ouvertes.md`                                     | entrées `### …`, lignes `Ouverte le :`, `Source :`, `Bloque :`, `Échéance :`, `Tranchée le :` |
| glossaire   | le document de rôle `glossary` du manifeste (`GLOSSARY.md`)      | `**code** — libellé :` puis définition, `_Éviter_ :`                                       |
| domaines    | `docs/methode/nomenclature.md`, tableau « Registre des trigrammes » | colonnes Trigramme, Sujet (le nom affiché)                                              |
| preuves     | tous les fichiers de tests du dépôt                              | étiquettes `[RULE_<CTX>_<TRI>-<n>]` dans les titres de `it`, `test`, `describe`            |

Un contexte dont les sources ne sont pas à la place conventionnelle le déclare dans le manifeste (`contexts[].rules`, `.features`, `.requests`). **Un contexte n'a qu'une forme** : un dossier de fichiers par règle. La forme `rules.json` n'est lue que par `migrate`.

Le dossier de contexte `all/` existe toujours. Le contexte s'écrit en minuscules dans les dossiers et le manifeste (`fnsmr`), en majuscules dans les identifiants (`FNSMR`) ; la CLI fait la correspondance.

## 2. Ce que la CLI calcule

**La réalisation d'une règle**, dans cet ordre :

1. `exception.status` écrit dans l'en-tête (`not-applicable`, `contradiction`) : c'est la réalisation, avec sa raison.
2. Au moins une preuve (un test étiqueté, ou hérité de la règle de socle par `instanceOf` tant que la règle n'a ni preuve ni `config` propres) : `proven`, avec la liste des niveaux présents (`P0`, `P1`, `P2`).
3. Sinon, `config` non vide : `configured`.
4. Sinon : `to-build`.

**La catégorie et le niveau d'une preuve**, depuis le chemin et le suffixe du fichier, dans cet ordre, le premier motif qui correspond l'emporte ; le manifeste peut ajouter des motifs en tête (`proofs[]`) :

| Motif                                         | Catégorie         | Niveau |
| --------------------------------------------- | ----------------- | ------ |
| `apps/mobile/e2e/**`, `**/*.e2e.mobile.*`     | `e2e-mobile`      | P2     |
| `e2e/**`, `apps/web/e2e/**`, `tests/**`       | `e2e-web`         | P2     |
| `apps/api/test/**`, `**/*.e2e-spec.ts`        | `api-integration` | P1     |
| `**/*.property.spec.ts`                       | `property`        | P0     |
| `**/*.db.spec.ts`                             | `real-db`         | P0     |
| `**/*.spec.ts`, `**/*.test.ts`, `**/*.test.mjs` | `unit`          | P0     |

Un fichier `recette.*` n'est jamais une preuve, étiquette ou pas : il sort en santé (`warning`). Une étiquette sur un `describe` vaut pour tous ses tests. Un fichier de cas en données (`**/cas/*.json`, forme Fedora `{ domaine, cas: [{ regle, titre, entree, attendu }] }`) compte une preuve `unit` P0 par cas, avec `cases` renseigné.

**L'indicateur de question ouverte** : une entrée de `docs/questions-ouvertes.md` non tranchée (`Tranchée le : —`) dont la ligne `Bloque :` cite un identifiant de règle alimente `rule.questions[]` et met `rule.hasOpenQuestion` à vrai. Les statuts ne bougent pas.

**Les liens** : déclarés (`links[]`, `instanceOf` → `instance-of`) avec `origin: "declared"` ; déduits avec `origin: "deduced"` et la phrase qui les produit : `mentions` quand l'énoncé d'une règle cite l'identifiant complet d'une autre, `cited-with` quand deux règles sont citées par la ligne `Règles:` d'un même ticket. Les liens entre EPIC se déduisent des liens entre règles de domaines différents.

**Les EPIC** : un par domaine, nommé d'après la colonne Sujet du registre des trigrammes (`PLA — Planning`), sauf regroupement déclaré dans `manifest.epics[]`.

**La santé** (`health[]`), ce que la CLI tolère mais signale : une règle `candidate` qui a des preuves ; une règle `validated` sans preuve depuis plus de 90 jours (date de validation) ; un défaut `Fait` sans règle ; un identifiant de règle cité dans une spec, un ticket ou un énoncé et absent ; un test de recette étiqueté ; un nom de personne dans un champ `by` absent de la table des rôles du manifeste ; un `Blocked by:` vers un ticket absent.

**Le déterminisme** : clés et listes triées, aucun horodatage, aucun SHA. Deux générations sur les mêmes sources donnent le même octet. C'est ce que `check` compare.

## 3. Le schéma d'un fichier de règle

```ts
type RuleFile = {
  id: string;                 // RULE_<CTX>_<TRI>-<n>, égal au nom du fichier sans .md
  title: string;
  validation: {
    status: "candidate" | "validated" | "rejected" | "obsolete";
    date?: string;            // AAAA-MM-JJ, obligatoire hors candidate
    by?: string;              // nom de la personne, obligatoire hors candidate
    reason?: string;          // obligatoire pour rejected et obsolete
  };
  exception?: { status: "not-applicable" | "contradiction"; reason: string };
  instanceOf?: string;        // RULE_ALL_<TRI>-<n>, doit exister
  links?: { type: "replaces" | "refines" | "contradicts" | "parameterized-by" | "blocked-by"; target: string }[];
  sources?: { ref: string; path?: string; at?: string }[];
  decisions?: { date: string; text: string; by: string }[];
  config?: { key: string; value?: unknown }[];
  code?: string[];            // fichiers de code qui réalisent la règle, chemins depuis la racine ; périmètre de la mutation par règle
  extensions?: Record<string, unknown>;   // propre au projet, jamais dans l'index
};
// corps : l'énoncé, markdown, dans la langue du projet
```

Le schéma vit dans `packages/schema` (`ANC-1.01`), en Zod, exporté par le paquet pour que les gates des projets le réutilisent.

## 4. Le manifeste, version 2

```ts
type Manifest = {
  schema: "2";
  name: string; pitch: string; audiences: string[];
  contexts: {
    id: string;              // minuscules ; "all" toujours présent
    name: string; pitch?: string;
    rules?: string; features?: string; requests?: string;   // chemins hors convention
    floor?: { date: string; proven: number };               // le plancher cliquet, relevé à la main
  }[];
  epics?: { id: string; name: string; pitch?: string; domains: string[] }[];
  documents: { role: "architecture" | "glossary" | "programme" | "other"; path: string; title: string }[];
  roles: Record<string, "client" | "MOA" | "MOE">;          // nom → rôle, pour l'affichage
  proofs?: { pattern: string; category: ProofCategory; level: "P0" | "P1" | "P2" }[];   // motifs ajoutés en tête de § 2
};
```

## 5. Le schéma pivot, version 2 (`anchorpost/anchorpost.json`)

Clés en anglais, comme les fichiers source : un seul vocabulaire des fichiers du projet jusqu'à l'écran. Trois absences volontaires restent : rien de vivant (CI, PR), rien qui change sans que les sources changent, rien que les sources ne disent pas.

```ts
type Index = {
  schema: "2";
  project: { name: string; pitch: string; audiences: string[] };
  contexts: { id: string; name: string; pitch?: string; floor?: { date: string; proven: number }; proven: number }[];
  domains: { id: string; name: string; epic: string }[];
  epics: { id: string; name: string; pitch?: string; domains: string[]; links: { target: string; count: number }[] }[];
  rules: Rule[]; features: Feature[]; defects: Defect[]; requests: Request[];
  glossary: Term[]; documents: Document[]; people: Record<string, Role>; health: Alert[];
};
type Rule = {
  key: string;                 // "RULE_FNSMR_LIC-05"
  context: string; id: string; domain: string; title: string;
  statement: string;           // markdown, précisions datées comprises
  validation: { status: "candidate" | "validated" | "rejected" | "obsolete"; date?: string; by?: string; reason?: string };
  realisation: { status: "proven" | "configured" | "to-build" | "not-applicable" | "contradiction"; levels: ("P0" | "P1" | "P2")[]; proofCount: number; inherited: boolean; reason?: string };
  hasOpenQuestion: boolean;
  questions: { text: string; openedOn: string; source: string; due?: string }[];
  sources: { ref: string; path?: string; at?: string }[];
  decisions: { date: string; text: string; by: string }[];
  config: { key: string; value?: unknown }[];
  code: string[];              // repris de l'en-tête, [] s'il n'y en a pas
  instanceOf?: string;
  links: { type: LinkType; target: string; origin: "declared" | "deduced"; justification?: string }[];
  proofs: { file: string; title: string; category: ProofCategory; level: "P0" | "P1" | "P2"; cases?: number }[];
  tickets: { id: string; type: TicketType; status: string }[];
  defects: string[]; requests: string[];
};
type LinkType = "instance-of" | "replaces" | "refines" | "contradicts" | "parameterized-by" | "blocked-by" | "cited-with" | "mentions";
type ProofCategory = "unit" | "real-db" | "property" | "api-integration" | "e2e-web" | "e2e-mobile";
type TicketType = "task" | "défaut" | "grilling" | "research";
type Feature = { id: string; context: string; folder: string; title: string; status: string; origin?: string; rules: string[]; tickets: { id: string; type: TicketType; status: string; rules: string[] }[] };
type Defect = { id: string; feature: string; context: string; rules: string[]; status: string; tests: { file: string; title: string; active: boolean }[] };
type Request = { id: string; context: string; title: string; status: string; target: { kind: "new" | "feature" | "rule"; ref?: string }; requester: { role: Role; name?: string }; follow?: string; rules: string[]; points: { class: "nouveau" | "confirme" | "précise" | "contredit"; rule?: string; text: string }[] };
type Term = { codeName: string; label: string; definition: string; avoid: string[] };
type Document = { role: "architecture" | "glossary" | "programme" | "other"; path: string; title: string };
type Alert = { severity: "error" | "warning"; rule?: string; path: string; message: string };
type Role = "client" | "MOA" | "MOE";
```

Ce qui change par rapport à la version 1 de `ANC-2` : clés en anglais ; `en question` quitte les statuts de réalisation et devient `hasOpenQuestion` ; `not-applicable` et `contradiction` viennent d'une exception écrite ; `levels` remplace `niveau` ; les noms de personnes sont portés (`by`, `people`) ; `contexts[].proven` et `floor` ; `epics[].links` ; `features[].tickets[].rules`. Agrégation MOA inchangée (`ANC-9`) : `unit`, `real-db` et `property` s'affichent « unitaire », `api-integration` « intégration », `e2e-web` et `e2e-mobile` « e2e ».

## 6. Les amendements aux règles d'Anchorpost (décision MOA, second grilling, 2026-11-10)

Chaque règle reçoit une entrée `decisions` datée et son énoncé amendé ; aucune n'est supprimée.

- **`ANC-6`** : la réalisation vaut `proven`, `configured`, `to-build`, `not-applicable`, `contradiction`. « En question » n'est plus un statut : une règle citée par une question ouverte porte l'indicateur « a une question ouverte » et garde ses deux statuts.
- **`ANC-13`** : le chat donne le nom d'une personne tel que le dépôt l'écrit, suivi de son rôle entre parenthèses quand la table du manifeste le connaît.
- **`ANC-14`** : les rôles restent un vocabulaire fermé et la MOA porte la décision ; l'index et les textes affichés portent les noms des personnes, avec le rôle entre parenthèses quand il est connu. La table nom → rôle sert à l'affichage, plus à l'anonymisation.
- **`ANC-19`** : l'index est une fonction pure des sources ; « aucun nom de personne » sort de la liste des absences.

Et dans `docs/questions-ouvertes.md`, la première question (forme source unique) se tranche : « 2026-11-10 — un fichier par règle à en-tête YAML, dépôt `skills`, `ADR_ALL_ARC-1` et ADR du registre ».

## 7. Les quatre commandes

### `anchorpost init`

Écrit `anchorpost/manifest.json` depuis le gabarit du skill et les réponses de la session (nom, pitch, publics, contextes, documents, table des rôles). Pour chaque contexte, cherche les sources à la place conventionnelle ; si rien n'est trouvé, **refuse** et nomme le champ à renseigner (`contexts[].rules` par exemple). Mesure le nombre de règles prouvées par contexte et écrit `floor` à cette valeur, datée. Ajoute l'entrée de l'index à `scripts/docs/index-generes.json`, le script `check:anchorpost`, le relais `scripts/verify/anchorpost.mjs`. Ne génère pas l'index : c'est `index`.

### `anchorpost index`

Lit tout (§ 1), calcule tout (§ 2), écrit `anchorpost/anchorpost.json` trié et stable. Sortie 0. Affiche le compte de règles, de preuves et d'alertes de santé par contexte. Ne touche à rien d'autre.

### `anchorpost check`

Liste **fermée** de refus, sortie 1 au premier groupe d'erreurs, toutes listées avec leur chemin :

1. manifeste ou fichier de règle invalide au schéma ;
2. deux règles au même identifiant dans un contexte ; un identifiant de fichier différent de son champ `id` ;
3. une cible de `links`, `instanceOf`, `Règles:`, `Cible:`, `Suite:`, `Origine:`, `Blocked by:` absente ; un `sources[].path` ou un chemin de `code` qui n'existe pas ;
4. un ticket sans `Type:`, ou hors vocabulaire ; un `Status:` hors vocabulaire ;
5. un ticket `Type: défaut` à `Status: Fait` dont un test nommé dans `## Surfaces` n'existe pas ou est désactivé (`it.skip`, `test.skip`, `xit`, `describe.skip`) ;
6. une étiquette de test qui cite une règle absente ;
7. un contexte dont le nombre de règles prouvées est sous `floor.proven`, ou dont `floor.proven` dépasse la mesure ;
8. une validation hors `candidate` sans `date` ou sans `by` ; `rejected` ou `obsolete` sans `reason` ; une `exception` sans `reason` ;
9. un index absent, ou différent, octet pour octet, de celui que les sources donnent.

Tout le reste est de la santé (§ 2), jamais un refus. Un ajout à cette liste est une version du paquet.

### `anchorpost migrate <forme> [--context <ctx>] [--apply]`

Convertit une fois une ancienne forme vers le standard. Dry-run par défaut : il affiche ce qu'il ferait, fichier par fichier, et la table de correspondance des identifiants. `--apply` écrit, un contexte à la fois.

- `rules-json` (forme Fedora) : lit `federations/<slug>/rules.json`, écrit un fichier par règle (§ 8), supprime le `rules.json` converti.
- `markdown-table` (forme socle et Iroki) : lit `docs/metier/regles/<TRI>-regles.md`, écrit un fichier par règle (§ 8), supprime le tableau.
- `identifiers` : réécrit tous les identifiants de l'ancienne grammaire vers la nouvelle dans tout le dépôt (markdown, tests, code, YAML, JSON), d'après la table de correspondance produite par les deux conversions et par la lecture des specs, tickets, ADR, design et guides existants ; renomme les fichiers ; déplace specs et tickets dans leur dossier de contexte ; pose `Type: task` sur les tickets qui n'ont pas de `Type:` ; propose une ligne `Règles:` aux tickets dont le corps cite des règles (la ligne est écrite, à relire au diff).

Un identifiant déjà à la nouvelle grammaire n'est jamais touché. Le script refuse si l'arbre git n'est pas propre.

## 8. Ce que `migrate` écrit pour chaque ancienne forme

**Depuis `rules.json` (Fedora)**, pour chaque entrée :

| Champ Fedora                     | Devient                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id` (`LIC-05`), slug du registre | `id: RULE_<SLUG>_LIC-05`, fichier `docs/metier/regles/<slug>/RULE_<SLUG>_LIC-05.md` ; les zéros restent   |
| `title`                          | `title`, et la première ligne du corps                                                                    |
| `note`                           | le corps, sous le titre                                                                                   |
| `status: couverte`, `configuree`, `a_construire`, `module` | rien : la réalisation se calcule. `module` est noté dans `extensions.fedora.status` pour le tri à la main |
| `status: sans_objet`             | `exception: { status: not-applicable, reason: <note> }`                                                   |
| `status: contradiction`          | `exception: { status: contradiction, reason: <note> }`                                                    |
| `status: question`, `proprietaire`, `echeance` | une entrée de `docs/questions-ouvertes.md` : titre = `title`, `Source :` = `source.ref`, `Bloque :` = l'identifiant de la règle, `Échéance :` = `echeance`, propriétaire dans la source ; la règle reste `candidate` |
| `decision { date, texte, par, en_vigueur }` | `validation: { status: validated, date, by: par }` et une entrée `decisions[]` ; `en_vigueur` dans `extensions.fedora` |
| pas de `decision`                | `validation: { status: candidate }`                                                                       |
| `source { ref, path }`           | `sources: [{ ref, path }]`                                                                                |
| `socle: LIC-01`                  | `instanceOf: RULE_ALL_LIC-01`                                                                             |
| `config[]`                       | `config[]`, tel quel                                                                                      |
| `tickets[]`                      | une ligne `Règles:` ajoutée à chaque ticket cité, avec l'identifiant de la règle ; le champ disparaît     |
| `code[]`                         | `code`, tel quel (champ du standard, décision produit du 2026-11-10)                                       |
| `seed[]`, `portee`, `jours`, `chantier`, `outil` | `extensions.fedora.*`, tels quels : les gates de Fedora les lisent encore                  |
| `plancher { date, couvertes_prouvees }` du registre | `contexts[].floor` dans le manifeste                                                                |

**Depuis un tableau markdown (Iroki, socle)**, pour chaque ligne `| Id | Règle | Source | ex | Statut |` :

| Colonne             | Devient                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Id` (`PLA-2`)      | `id: RULE_ALL_PLA-2`, fichier `docs/metier/regles/all/RULE_ALL_PLA-2.md`                                       |
| `Règle`             | le corps, tel quel, précisions datées et passages barrés compris ; `title` = la première phrase (jusqu'au premier point, 120 caractères au plus), **à relire** : l'alerte de santé « titre dérivé » le rappelle jusqu'à ce qu'un humain le retouche |
| `Source`            | `sources[0].ref` ; chaque fragment séparé par `·` fait une entrée                                               |
| `ex` (`R-22`)       | une entrée `sources[]` de plus : `{ ref: "R-22", path: <compte rendu de la réunion citée en Source, s'il est trouvé> }` |
| `Statut: candidate` | `validation: { status: candidate }`                                                                            |
| `Statut: validée`, `implémentée` | `validation: { status: validated }` sans date ni auteur : **refusé par `check` jusqu'à ce qu'un humain les écrive** ; le dry-run les liste |
| `Statut: rejetée (…)`, `obsolète (…)` | `validation: { status: rejected | obsolete, reason: <le texte entre parenthèses> }`, date et auteur extraits s'ils s'y lisent |
| `_(… tranché par X le JJ/MM)_` dans la règle | reste dans le corps ; le dry-run liste ces lignes pour qu'un humain ajoute `decisions[]`             |

**Les identifiants**, par `migrate identifiers`, d'après la table :

| Ancienne forme                           | Nouvelle                                      | Règle                                                                 |
| ---------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| règle `LIC-05` d'un registre `<slug>`    | `RULE_<SLUG>_LIC-05`                          | le contexte vient du registre d'origine                               |
| étiquette `[FNSMR LIC-05]`               | `[RULE_FNSMR_LIC-05]`                         | dans les titres de tests, et dans `--testNamePattern` des workflows   |
| test `it('ORG-10 — …')`                  | `it('[RULE_ALL_ORG-10] …')`                   | forme socle                                                           |
| spec `ALL-LIC-16-…spec.md`, `FFSA-FIN-2-…` | `SPEC_ALL_LIC-16-…`, `SPEC_FFSA_FIN-2-…`     | le premier segment est le contexte quand il en est un                 |
| spec `SOC-1-…spec.md`, `GEO-1-…`         | `SPEC_ALL_SOC-1-…`, dans `<feature>/all/`     | sans contexte : `ALL`                                                 |
| ticket `….03.issue.md`                   | même nom que sa spec, `.03` conservé          |                                                                       |
| ADR `ARC-11-…`, `ALL-ADR-39-…`, `BEN-1-…` | `ADR_ALL_ARC-11-…`, `ADR_ALL_ARC-39-…`, `ADR_ALL_BEN-1-…` | une ADR dans `docs/adr/` ; `ALL-ADR-n` de Fedora prend `ARC` |
| design `DES-1-…`                         | `DSG_ALL_DES-1-…`                             | un document dans `docs/design/`                                       |
| guide `ALL-ARC-2-…`, `ALL-INF-15-…` (Fedora) | `DOC_ALL_ARC-2-…`, `SPEC_ALL_INF-15-…`    | `.spec.md` → `SPEC`, sinon `DOC`                                      |
| citation en prose `` `LIC-05` ``, `` `ARC-11` `` | l'identifiant complet                 | partout dans `docs/`, le code et les tests ; un mot ambigu (même trigramme pour une règle et une spec sans type) est listé au dry-run et tranché à la main |

## 9. La bibliothèque

Le paquet exporte, pour les gates des projets :

```ts
readManifest(root): Manifest
readRules(root, context?): RuleFile[]          // en-tête parsé et validé, corps brut
readTickets(root): Ticket[]                    // en-têtes et sections
collectProofs(root): Map<ruleKey, Proof[]>     // étiquettes trouvées, catégorie et niveau
readIndex(root): Index                         // l'index commis, validé au schéma
buildIndex(root): Index                        // ce que `index` écrirait
checkProject(root): { errors: Alert[]; health: Alert[] }
ruleFileSchema, manifestSchema, indexSchema    // Zod
```

Fedora réécrit ses trois contrôles propres sur `readRules` et `collectProofs` ; son périmètre de mutation sur `readIndex` (`rules[].proofs`) et `readRules` (`code`).

## 10. Tickets

À découper par le chantier d'Anchorpost, après `ANC-1.01` (le schéma en Zod, qui passe en version 2) :

| Ticket     | Objet                                                                                                        | Bloqué par |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| .01        | `packages/schema` v2 : fichier de règle, manifeste, index ; test de déterminisme                             | —          |
| .02        | Lecteurs : règles, specs, tickets, demandes, questions, glossaire, domaines ; bibliothèque exportée           | .01        |
| .03        | Preuves : étiquettes, catégories et niveaux, cas en données, héritage du socle                                | .02        |
| .04        | `index` : calcul de la réalisation, liens déduits, EPIC, santé, écriture triée                                | .03        |
| .05        | `check` : la liste fermée, sortie et messages                                                                 | .04        |
| .06        | `init` : manifeste, planchers mesurés, `index-generes.json`, scripts, relais                                 | .04        |
| .07        | `migrate rules-json`                                                                                         | .02        |
| .08        | `migrate markdown-table`                                                                                     | .02        |
| .09        | `migrate identifiers`                                                                                        | .07, .08   |
| .10        | Publication sur GitHub Packages, versionnage, accès des dépôts                                                | .05        |
| .11        | Anchorpost migre lui-même (§ 11) et devient le premier espace lu par cette CLI (`ANC-22`)                    | .09, .10   |
| .12        | Amendements `ANC-6`, `ANC-13`, `ANC-14`, `ANC-19` ; `ANC-2` en version 2 ; question ouverte tranchée         | .01        |

## 11. Anchorpost lui-même

Par `migrate markdown-table` puis `migrate identifiers` : `docs/metier/regles/ANC-regles.md` devient 22 fichiers `docs/metier/regles/all/RULE_ALL_ANC-n.md` (validation `validated`, 2026-11-09, `by: Guillaume Jauffret`, source « grilling 2026-11-09, Qn ») ; `docs/features/anchorpost/ANC-1-anchorpost.spec.md` devient `docs/features/anchorpost/all/SPEC_ALL_ANC-1-anchorpost.spec.md` ; `docs/architecture/ANC-2-schema-pivot.md` devient `docs/architecture/DOC_ALL_ANC-2-schema-pivot.md` (version 2) ; `docs/features/socle/SOC-1-socle.spec.md` et ses tickets passent sous `socle/all/` en `SPEC_ALL_SOC-1` ; `docs/adr/ARC-n-…` devient `ADR_ALL_ARC-n-…`, `docs/adr/web/WEB-1-…` devient `ADR_ALL_WEB-1-…`. Le manifeste passe en version 2 (`name`, `pitch`, `audiences`, `contexts: [{ id: "all", … }]`, `roles`). La collision `ANC-1` (règle et spec) disparaît sans renommer le trigramme.

## Hors périmètre

- La mutation par règle, le workflow hebdomadaire et le périmètre « règles prouvées » dans tout projet : skill `socle-tests` (ticket dans le dépôt `skills`).
- Le statut CI par test : question ouverte d'Anchorpost, rien ici.
- Tout appel au service Anchorpost depuis la CLI (`ARC-13`).
