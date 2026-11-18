# Le bilan de fin de chantier sort du plugin, et le gate `tickets` juge la forme de trois écritures nouvelles sans les exiger : la ligne `Sensibles:`, la ligne `Relecture: double`, le rôle `relecture` d'une ligne de coût

Status: needs-info
Type: task
Modèle: sonnet — une obligation retirée du gate, deux lecteurs de ligne donnés entiers avec leur banc, trente-deux retouches données mot pour mot (ancien, nouveau), la version ; tout est joué sur une copie jetable, mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: 54
Dépendances: —
Fichiers chauds: `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs`, `skills/chaine/tickets/references/scripts/docs/couts.test.mjs`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/tickets/references/gabarits/ticket.issue.md`, `skills/chaine/tickets/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/chantier/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `README.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**La décision du produit** (`P-57` de la carte « gouverner nos boucles », 2026-11-18, grilling du chantier 3, question `Q7`) : « Le bilan de fin de chantier est supprimé, sans rien à la place ». La question acceptée : « supprimer cette obligation, sans rien créer à la place » ; sa réponse : « oui ». Ses mots, avant : « quel est l'intérêt d'une session bilan et quel usage ferait-on du bilan ? revue adversariale sur cette idée », puis, au tableau de chiffres proposé en remplacement : « pas compris: à quel moment on fait ce tableau ? les relectures vont déjà déclencher des écrits sur la PR que le chantier va prendre en compte. » La carte en tire : « L'obligation `## Rétro` non vide pour passer une carte à `fini` sort du plugin. »

**Pourquoi** (revue de l'architecte sur sa propre idée, même ligne de la carte) : aucun bilan n'a produit d'amélioration dans ce programme, toutes sont venues d'incidents traités sur le moment ; un bilan arrive trop tard, coûte une grosse session, tourne à la généralité. D'où `A-95` de la spec du chantier 3 : un incident donne un ticket au moment où il arrive.

**L'autre moitié du ticket** prépare les lots suivants du chantier 3, sans rien en allumer. Trois écritures nouvelles vont apparaître dans les tickets et les cartes : la ligne `Sensibles:` d'un ticket (`A-74` : les chemins sensibles qu'il modifie, et qui a accordé, quand), la ligne `Relecture: double` d'un ticket (`A-82`), et le rôle `relecture` d'une ligne de `## Coût` (`A-87`). Le gate doit les connaître avant que rien ne les exige : une ligne mal écrite se corrige au découpage, pas le jour où une garde la lit.

**Le fait, sur `origin/main` à `4a45634`** (plugin 7.15.0) :

- Le gate refuse une carte `Phase: fini` sans section `## Rétro` non vide (`tickets-regles.mjs:581-584`), le skill `chantier` fait écrire cette section (`chantier/SKILL.md:113-115`), le gabarit de carte la porte (`carte.map.md:50-52`), la méthode en fait la septième étape du cycle (`chaine-de-production.md:29`, `:40`).
- **Le gate ne refuse aujourd'hui aucune des trois écritures nouvelles**, parce qu'il ne les lit pas : `controlerTicket` (`tickets-regles.mjs:479`) ne cherche que les lignes qu'il connaît, et une ligne `Sensibles: n'importe quoi` ou `Relecture: triple` passe ; `plafondsDeLaCarte` ne juge que `fille` et `conducteur` (`:359`), et `couts.mjs` lit le rôle comme un texte libre (`:60`, `:96`). « Accepter sans exiger » veut donc dire ici : **juger la forme quand la ligne est là**, et prouver par des tests que la ligne bien formée, comme son absence, passe.

Quand le ticket est fait :

1. Une carte passe à `fini` sans section `## Rétro` ; une carte d'avant, qui garde la sienne, passe aussi.
2. Le skill `chantier`, la méthode, `pieges.md`, le `README.md` et le gabarit de carte ne demandent plus de bilan, et disent qu'un incident donne un ticket au moment où il arrive.
3. Une ligne `Sensibles:` mal formée, ou une ligne `Relecture:` qui ne vaut pas `double`, est refusée par le gate, le fichier et la ligne nommés ; bien formées ou absentes, le ticket passe.
4. Une ligne de coût de rôle `relecture` passe le gate sans être jugée au plafond, et compte au registre des coûts dans le total, pas dans la part des filles : un test le prouve, le code ne change pas.
5. Les gabarits de ticket et de carte montrent les trois écritures.
6. `Label: contre-revue` reste exigé, comme aujourd'hui.

Rien d'autre du chantier 3 n'entre ici : ni garde, ni hook, ni skill.

## Où

Base : `origin/main` à `4a45634` (plugin 7.15.0, 738 tests), **une fois le ticket 54 fait** (plugin 7.16.0, 711 tests). Les numéros de ligne sont ceux de `4a45634` ; le ticket 54 n'en déplace qu'un, signalé dans le titre de la retouche.

| Fichier | Ce qu'il dit | Ce qu'il devient |
| --- | --- | --- |
| `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:581-584` (`controlerCarte`) | à `fini`, section `## Rétro` absente ou vide : erreur | G1 : les quatre lignes sortent |
| `tickets-regles.mjs:175`, `:430`, `:518` | `LABEL` ; `ecartsRegles` ; `controlerTicket` | G2, G4, G5 : deux motifs, deux fonctions exportées, leur appel |
| `tickets-regles.mjs:345` (commentaire de `plafondsDeLaCarte`) | « Tout autre rôle n'est pas jugé » | G3 : nomme `relecture` ; le code (`:356-359`) ne change pas |
| `skills/chaine/tickets/references/scripts/verify/tickets.mjs:17-19`, `:38` (en-tête) | règle 4 : « `## Rétro` à `fini` » ; onze règles | G6 à G8 : la règle 4 sans le bilan, les règles 12 et 13 |
| `…/scripts/verify/tickets.test.mjs:11`, `:67`, `:73`, `:171`, `:416` | le test de la carte exige le refus sans `## Rétro` | B1 à B5 |
| `…/scripts/verify/tickets-gate.test.mjs` (202 lignes) | — | B6 : un test ajouté |
| `…/scripts/docs/couts.test.mjs:67` | — | B7 : un test ajouté |
| `scripts/depot.test.mjs:194-201` | le test du gabarit de carte | B8 ; B9 ajoute deux tests |
| `skills/chaine/tickets/references/gabarits/carte.map.md:34-36`, `:48-52` | `## Coût` sans ses rôles ; la section `## Rétro` | M1, M2 |
| `…/gabarits/ticket.issue.md:10` | `Label: contre-revue # …` | M3 : deux lignes après elle |
| `skills/chaine/chantier/SKILL.md:3`, `:43`, `:110`, `:113-115` | « livraison par le capitaine et rétro » ; « (…, incidents, rétro) » ; « Phase 5 — livraison et rétro » ; « 2. Rétro dans la carte, section `## Rétro` : » et ses deux puces | R1 à R4 |
| `skills/chaine/chantier/references/CONTENU.md:7` | « `docs/agents/pieges.md` que la rétro alimente » | R5 |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:29-30`, `:35`, `:40` | le schéma du cycle finit par « ──► rétro » ; « (…, incidents, rétro) » ; « 7. **Rétro.** » | R6 à R8 |
| `…/references/docs-agents/pieges.md:3` | « La rétro d'un chantier (skill `chantier` § 7) ajoute ici une ligne… » | R9 |
| `…/references/CONTENU.md:37` | « `pieges.md` : la liste que la rétro de chaque chantier alimente » | R10 |
| `skills/chaine/tickets/references/CONTENU.md:29` | ce que le gate contrôle | R11 |
| `README.md:88` | « suivi sans attente active, rétro ; reprenable » | R12 |
| `.claude-plugin/plugin.json:3` | 7.16.0, une fois le ticket 54 fait | V1 : 7.17.0 |

### Gardé tel quel, après lecture

- **`skills/chaine/tickets/references/scripts/docs/couts.mjs`** (213 lignes) : rien n'y change. Le rôle d'une ligne de coût y est un texte libre (`:60`) ; `bilan` (`:95-96`) ne compte comme filles que le rôle `fille`, et le total prend toutes les lignes. Une ligne `relecture` y est donc déjà comptée comme il faut ; B7 le prouve.
- **Le code de `plafondsDeLaCarte`** (`tickets-regles.mjs:348-377`) : seuls `fille` et `conducteur` sont jugés (`:359`). `tickets.test.mjs:414-415` le prouve déjà pour `capitaine` et pour un rôle libre ; B4 y ajoute `relecture`, vert dès l'écriture.
- **`Label: contre-revue`** : `ecartsFormatPret` (`tickets-regles.mjs:404-428`) ne change pas ; ses tests (`tickets.test.mjs:152`, `tickets-gate.test.mjs:46`) restent verts sans retouche, et B5 prouve que `Sensibles:` ne le remplace pas.
- **`couts.test.mjs:15`**, la section `## Rétro` de la carte d'essai : une carte d'avant garde la sienne ; elle prouve que la lecture de `## Coût` s'arrête à la section suivante.
- **« venus des rétros d'Anchorpost »** (`skills/chaine/revue-de-ticket/references/CONTENU.md:9`, `skills/chaine/revue-adversariale/references/CONTENU.md:13`) : l'origine de sept critères, un fait passé.
- **`chaine-de-production.md:144`** (« Relevé des coûts ») : le relevé reste, et « le coût moyen par ticket, comparé d'un chantier à l'autre » se lit au registre, pas dans un bilan.
- **`chaine-de-production.md:59-68`** (§ 3, l'en-tête d'un ticket prêt) : il ne nomme pas encore les deux lignes ; voir « Hors périmètre ».
- **Les gabarits `programme.md`, `spec.spec.md`, `regle.md`, `demande.md`**, `tickets/SKILL.md`, `tickets/references/agents/issue-tracker.md`, `architecte/SKILL.md` : aucun ne nomme de rétro (`git grep -n -i 'rétro' origin/main -- skills scripts README.md` ne rend que les fichiers de ce ticket et les deux `CONTENU.md` ci-dessus).

### Repose dans un projet

Le gate et les gabarits sont des copies posées (`/maj-skills:tickets poser`) : un projet les reçoit à sa prochaine repose. Lu le 2026-11-18 sur `origin/develop` des trois projets du programme : aucun ticket ne porte de ligne `Sensibles:` ni `Relecture:` dans son en-tête, donc rien n'y rougira ; un ticket porte une ligne `- Relecture : …` dans son corps, sous `## Décisions`, que le gate ne lit pas (décision 4). Les cartes déjà `fini` gardent leur section `## Rétro`, sans effet.

## Décisions

1. **Le bilan sort, rien ne le remplace** (`P-57`, `A-95`). Le gate n'exige plus de section `## Rétro` ; il ne la refuse pas non plus dans une carte d'avant. Ni colonne nouvelle au registre des coûts, ni section de remplacement.
2. **Un incident donne un ticket au moment où il arrive** (`A-95`) : un renvoi du capitaine ou une vague ratée donne, sur le moment, un ticket (un gate, un critère de la revue adversariale) ou, faute de gate, une ligne de `pieges.md`, qui reste la liste des pièges connus. Les textes le disent là où ils demandaient la rétro (R4, R8, R9).
3. **La ligne `Sensibles:`** a deux formes, et pas d'autre :
   - `Sensibles: —` : le ticket ne modifie aucun chemin sensible ;
   - `Sensibles: <chemin>, <chemin> — accord de <nom>, <AAAA-MM-JJ>` : des chemins ou des motifs séparés par des virgules, entre accents graves ou nus, puis ` — accord de ` (une espace, un tiret cadratin, une espace), le nom de qui a accordé, une virgule, le jour de l'accord.

   Un chemin est relatif à la racine du dépôt : sans blanc, sans `/` initial, sans segment `..`, sans accolade (un gabarit non rempli) ; `*` et `**` sont permis. Le nom est celui d'une personne : ni vide, ni un identifiant `session_…`, ni un gabarit (`<nom>`, `{{…}}`) ; il peut porter une virgule, la date est ce qui suit la dernière. La date est un jour qui existe. Des chemins sans accord sont refusés : la ligne ne se remplit qu'une fois l'accord donné (`A-75`). Un commentaire de gabarit (` # …`) peut suivre, comme sur `Type:`.
4. **Les deux lignes se lisent dans l'en-tête seul**, avant la première section `## `, à leur forme nue (`Sensibles: …`, pas `- Sensibles : …`) : comme `Type:` et `Règles:` (`tete`, `tickets-regles.mjs:29`), et comme la garde de commandes lit `Dépendances:` (`skills/chaine/socle-chaine-de-production/references/agent/regles.mjs:156-158`). Un exemple cité dans le corps d'un ticket n'est pas la ligne. Elles sont jugées sur **tout ticket**, quel que soit son `Status:`, même gelé dans la dette : elles n'existaient pas avant, aucune dette n'est à geler.
5. **Jamais exigées, jamais recoupées.** Le gate ne demande ni `Sensibles:` ni `Relecture:`, ne compare pas `Sensibles:` à `Fichiers chauds:` ni à `cheminsSensibles` (`A-74` : « le gate vérifie la forme, pas que le chemin est déjà sensible »), et ne sait pas si l'accord a été donné.
6. **La ligne `Relecture:`** ne vaut que `double`, à la casse près ; toute autre valeur est refusée avec « sinon retirer la ligne ». Un commentaire de gabarit peut suivre.
7. **`Label: contre-revue` reste exigé comme aujourd'hui** quand `Fichiers chauds:` touche un chemin sensible ; `Sensibles:` ne le remplace pas. Il ne tombe qu'avec le régime de la relecture indépendante.
8. **Le rôle `relecture`** d'une ligne de `## Coût` : le gate ne le juge pas au plafond, le registre le compte dans le total et pas dans la part des filles. Aucun code ne change : le vocabulaire des rôles n'est pas fermé, et ne le devient pas.
9. **Les gabarits montrent les écritures nouvelles** : le ticket porte les deux lignes après `Label:`, chacune avec « retirer la ligne » et la mention qu'aucune garde ne la lit encore ; la carte nomme ses rôles sous `## Coût`, `relecture` compris, et perd `## Rétro`.
10. **Lecture en temps linéaire** : les deux lecteurs découpent la valeur par recherche de chaîne (`indexOf`, `lastIndexOf`, un motif de deux caractères), sans quantificateur imbriqué ; le banc lit trois valeurs hostiles de 300 000 caractères en moins de 2 s.
11. **Version : mineure** (`.claude-plugin/plugin.json:3`, 7.16.0 → **7.17.0**, sur le ticket 54 fait) : deux gabarits changent, le gate lit deux lignes de plus. **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, puis vérifie la valeur (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`).
12. **Pas de `Label: contre-revue`** : aucun fichier touché ne se pose sous un chemin sensible du gabarit de `.claude/chaine.json` (`scripts/agent/**`, `scripts/chaine/**`, `scripts/github/**`, `.husky/**`, `.github/workflows/**`, `.github/actions/**`, `scripts/docs/identifiants.mjs`, `.claude/**`) : le gate se pose sous `scripts/verify/`, `couts.test.mjs` sous `scripts/docs/`, les gabarits sous `docs/agents/gabarits/`. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la lit, puis la fait entrer. Titre `feat(chaine): le bilan de fin de chantier sort du plugin, le gate juge la forme de Sensibles et de Relecture (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.
13. **`Blocked by: 54`** : les deux tickets écrivent `skills/chaine/chantier/SKILL.md`, le `CONTENU.md` du socle de la chaîne, `chaine-de-production.md`, `README.md`, `scripts/depot.test.mjs` et `.claude-plugin/plugin.json`. La session part de `origin/main` une fois la PR du ticket 54 entrée.

### Remèdes écartés

- **Remplacer le bilan par une colonne « allers-retours de relecture » au registre des coûts** : la carte dit qu'elle « pourra s'ajouter » ; rien ne la demande, et il n'y a pas encore de relecture à compter.
- **Refuser une section `## Rétro` restée dans une carte** : les cartes finies des projets en ont une ; elles n'ont rien de faux.
- **Fermer le vocabulaire des rôles de `## Coût`** (`fille`, `conducteur`, `architecte`, `capitaine`, `relecture`) : des cartes existantes portent des rôles libres, que le gate laisse passer par décision (`tickets.test.mjs:414`).
- **Exiger `Sensibles:` dès qu'un chemin chaud est sensible**, ou comparer ses chemins à `cheminsSensibles` : c'est la garde des lots suivants, et `A-74` l'écarte pour le gate.
- **Accepter `Relecture: simple`** pour dire « une seule » : l'absence de ligne le dit déjà.
- **Lire les deux lignes dans tout le fichier**, comme `Label:` et `Modèle:` : un ticket qui cite la ligne en exemple (celui-ci le fait) serait refusé.
- **Une expression régulière pour toute la ligne `Sensibles:`** (`^(.+?)\s+—\s+accord de\s+(.+?),\s*(…)$`) : deux quantificateurs paresseux et des blancs répétés, au carré sur une valeur hostile.

## À faire, dans l'ordre

Chaque « Ancien » se retrouve par son texte ; il apparaît une fois, une seule, dans son fichier, le ticket 54 fait. Un bloc « Nouveau » se recopie tel quel, sans la ligne de clôture.

### 0. Le banc d'abord, vu rouge

#### B1 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:11`

Les deux fonctions nouvelles entrent dans la liste importée.

Ancien :

````js
  ecartsFormatPret,
  estArchive,
````

Nouveau :

````js
  ecartsFormatPret,
  ecartsRelecture,
  ecartsSensibles,
  estArchive,
````

#### B2 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:67`

Ancien :

````js
test('carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1, rétro à fini', () => {
````

Nouveau :

````js
test('carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1 ; à fini, aucune section `## Rétro` n’est exigée', () => {
````

#### B3 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:73`

L'assertion qui exigeait le refus devient trois assertions : `fini` sans `## Rétro` passe, une carte d'avant qui garde sa section passe, `## Coût` reste exigée.

Ancien :

````js
  assert.match(carte('fini', '\n## Coût\n\n| a |\n').erreurs[0].message, /Rétro/);
````

Nouveau :

````js
  assert.deepEqual(carte('fini', '\n## Coût\n\n| a |\n').erreurs, [], 'le bilan de fin de chantier est supprimé : `fini` sans `## Rétro` passe');
  assert.deepEqual(carte('fini', '\n## Coût\n\n| a |\n\n## Rétro\n\nRien.\n').erreurs, [], 'une carte d’avant garde sa section, sans effet');
  assert.match(carte('fini').erreurs[0].message, /Coût/, '`## Coût` reste exigée à `fini`');
````

#### B4 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:416`

Dans le test « une ligne de coût au-delà du plafond de son rôle… ».

Ancien :

````js
  // Sans contrat (plafonds null), rien n'est jugé.
````

Nouveau :

````js
  // Une session de relecture d'une PR (rôle `relecture`) n'est pas jugée non plus, même illisible.
  assert.equal(juger(COUT('| relecture | SPEC_ALL_SOC-1.02 | s10 | sonnet | 900 k | 9,00 |', '| relecture | t | s11 | sonnet | beaucoup | 9,00 |')).length, 0);
  // Sans contrat (plafonds null), rien n'est jugé.
````

#### B5 — `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs:171`

Trois tests ajoutés avant le test des chemins chauds, qui ne change pas. `PRET`, `NOM`, `existe`, `sur` et `SENSIBLES` existent déjà dans le fichier.

Ancien :

````js
test('les chemins chauds se lisent entre accents graves ou en liste, et un motif `**/` accepte zéro dossier', () => {
````

Nouveau :

````js
const ACCORD = 'accord de Camille Martin, 2026-11-18';

test('Sensibles: `—`, ou des chemins puis l’accord (nom, date), passe ; toute autre forme est refusée, en temps borné', () => {
  for (const v of [
    '—',
    '— # aucun chemin sensible',
    `\`scripts/chaine/passer.sh\`, \`scripts/chaine/passer*.test.mjs\` — ${ACCORD}`,
    `scripts/agent/**, .claude/chaine.json — ${ACCORD}`,
    'apps/api/src/paiement/ — accord de Martin, Camille, 2026-11-18 # un dossier qu’un ticket précédent rend sensible',
  ])
    assert.deepEqual(ecartsSensibles(v), [], v);
  const FORME = /^Sensibles « .* » : attendu `—`, ou des chemins séparés par des virgules puis ` — accord de <nom>, <AAAA-MM-JJ>`$/;
  for (const v of ['', 'scripts/chaine/passer.sh', 'scripts/chaine/passer.sh, scripts/agent/regles.mjs', 'scripts/chaine/passer.sh — accord de Camille Martin', `— ${ACCORD}`, `scripts/chaine/passer.sh - ${ACCORD}`, `scripts/chaine/passer.sh —  ${ACCORD}`, '— —']) {
    const e = ecartsSensibles(v);
    assert.equal(e.length, 1, v);
    assert.match(e[0], FORME, v);
  }
  const refus = [
    ['scripts/chaine/passer.sh — accord de Camille Martin, 18/11/2026', /date « 18\/11\/2026 »/],
    ['scripts/chaine/passer.sh — accord de Camille Martin, 2026-02-30', /date « 2026-02-30 »/],
    ['scripts/chaine/passer.sh — accord de session_01Abc, 2026-11-18', /accord de « session_01Abc » : attendu la personne qui a accordé/],
    ['scripts/chaine/passer.sh — accord de <nom>, 2026-11-18', /accord de « <nom> »/],
    [`\`{{chemin ou motif}}\` — ${ACCORD}`, /n'est pas un chemin/],
    [`scripts/chaine/passer.sh,, scripts/agent/regles.mjs — ${ACCORD}`, /«  » n'est pas un chemin/],
    [`/scripts/chaine/passer.sh — ${ACCORD}`, /« \/scripts\/chaine\/passer\.sh » n'est pas un chemin/],
    [`scripts/../.claude/chaine.json — ${ACCORD}`, /n'est pas un chemin/],
    [`scripts/chaine/mon script.sh — ${ACCORD}`, /« scripts\/chaine\/mon script\.sh » n'est pas un chemin/],
    [`scripts/chaine/passer.sh, — — ${ACCORD}`, /« — » n'est pas un chemin/],
  ];
  for (const [v, motif] of refus) {
    const e = ecartsSensibles(v);
    assert.equal(e.length, 1, `${v} : ${e.join(' | ')}`);
    assert.match(e[0], motif, v);
  }
  assert.equal(ecartsSensibles('/a, b c — accord de session_x, 2026-13-01').length, 4, 'chaque écart est rendu');
  const debut = performance.now();
  ecartsSensibles(`${'a, '.repeat(100_000)}b — ${ACCORD}`);
  ecartsSensibles(`${' \t'.repeat(150_000)}x`);
  ecartsSensibles(`a${' — accord de '.repeat(20_000)}x, 2026-11-18`);
  assert.ok(performance.now() - debut < 2000, 'trois valeurs hostiles de 300 000 caractères lues en moins de 2 s');
});

test('Relecture: `double` passe ; toute autre valeur est refusée, la valeur nommée', () => {
  for (const v of ['double', 'double # règle de criticité haute']) assert.deepEqual(ecartsRelecture(v), [], v);
  for (const v of ['', 'simple', 'Double', 'double double', 'doubles', '2', 'oui']) {
    const e = ecartsRelecture(v);
    assert.equal(e.length, 1, v);
    assert.match(e[0], /^Relecture « .* » : seule valeur `double` ; sinon retirer la ligne$/, v);
  }
});

test('`Sensibles:` et `Relecture:` ne se lisent que dans l’en-tête, ne sont jamais exigées, et `Label: contre-revue` reste exigé à côté d’elles', () => {
  const avec = (enTete) => PRET.replace('Modèle: sonnet\n', `Modèle: sonnet\n${enTete}`);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: PRET, existe }).erreurs, [], 'absentes : rien n’est exigé');
  assert.deepEqual(controlerTicket({ nom: NOM, texte: avec('Sensibles: —\nRelecture: double\n'), existe }).erreurs, []);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: avec(`Sensibles: scripts/chaine/passer.sh — ${ACCORD}\r\nRelecture: double\r\n`), existe }).erreurs, [], 'CRLF');
  const ko = controlerTicket({ nom: NOM, texte: avec('Sensibles: scripts/chaine/passer.sh\nRelecture: triple\n'), existe });
  assert.deepEqual(ko.erreurs.map((e) => [e.ligne, e.message.split(' ')[0]]), [[7, 'Sensibles'], [8, 'Relecture']]);
  // Dans le corps (un exemple cité par le ticket), la ligne n'est pas lue.
  assert.deepEqual(controlerTicket({ nom: NOM, texte: `${PRET}\nSensibles: scripts/chaine/passer.sh\nRelecture: triple\n`, existe }).erreurs, []);
  // Un ticket qui n'est pas prêt, ou gelé dans la dette, est jugé de même : la forme vaut pour tout ticket.
  assert.equal(controlerTicket({ nom: NOM, texte: '# x\n\nStatus: needs-triage\nType: task\nRelecture: simple\n', existe }).erreurs.length, 1);
  assert.equal(controlerTicket({ nom: NOM, texte: '# x\n\nStatus: ready-for-agent\nType: task\nSensibles: a\n', existe, gele: true }).erreurs.length, 1);
  // `Label: contre-revue` reste exigé sur un chemin sensible : `Sensibles:` ne le remplace pas.
  const accorde = `Sensibles: apps/api/src/infrastructure/auth/jwt.ts — ${ACCORD}\n`;
  const sans = controlerTicket({ nom: NOM, texte: sur('`apps/api/src/infrastructure/auth/jwt.ts`', accorde), existe, cheminsSensibles: SENSIBLES });
  assert.equal(sans.erreurs.length, 1);
  assert.match(sans.erreurs[0].message, /ready-for-agent : ligne `Label: contre-revue` absente/);
  assert.deepEqual(controlerTicket({ nom: NOM, texte: sur('`apps/api/src/infrastructure/auth/jwt.ts`', `Label: contre-revue\n${accorde}`), existe, cheminsSensibles: SENSIBLES }).erreurs, []);
});

test('les chemins chauds se lisent entre accents graves ou en liste, et un motif `**/` accepte zéro dossier', () => {
````

#### B6 — fin de `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs`

Le gate lancé pour de vrai, sur un dépôt jouet. `DETTE`, `depotJouet` et `lancer` existent déjà dans le fichier.

Ajouté à la fin du fichier, après une ligne vide :

````js
test('gate complet : `Sensibles:` ou `Relecture:` mal formée est refusée avec le chemin et la ligne ; bien formées, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture, passe', () => {
  const ticket = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
  const corps = (enTete) => `# x\n\nStatus: needs-triage\nType: task\n${enTete}`;
  const carte = 'docs/features/socle/all/SPEC_ALL_SOC-1-socle.map.md';
  const finie =
    '# Carte\n\nSujet: sujet/socle\n\n## Fiche\n\nPhase: fini\nResponsable: Camille Martin\nConducteur: session_z\n\n## Coût\n\n| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |\n| --- | --- | --- | --- | --- | --- |\n| relecture | SPEC_ALL_SOC-1.01 | session_r | sonnet | 900 k | 2,00 |\n';
  const ok = depotJouet({ fichiers: { ...DETTE, '.claude/chaine.json': '{}\n', [carte]: finie, [ticket]: corps('Sensibles: scripts/chaine/passer.sh, scripts/agent/** — accord de Camille Martin, 2026-11-18\nRelecture: double\n') } });
  const r = lancer(ok);
  assert.equal(r.status, 0, r.stderr);
  const ko = depotJouet({ fichiers: { ...DETTE, [ticket]: corps('Sensibles: scripts/chaine/passer.sh\nRelecture: triple\n') } });
  const r2 = lancer(ko);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:5 : Sensibles « scripts\/chaine\/passer\.sh » : attendu `—`, ou des chemins/);
  assert.match(r2.stderr, /SPEC_ALL_SOC-1-socle\.01\.issue\.md:6 : Relecture « triple » : seule valeur `double`/);
});
````

#### B7 — `skills/chaine/tickets/references/scripts/docs/couts.test.mjs:67`

Un test ajouté avant celui-ci, qui ne change pas.

Ancien :

````js
test("une carte sans section Coût ni Sujet garde le nom de son fichier et n'apparaît pas au registre", () => {
````

Nouveau :

````js
test("une session de relecture compte dans le total et les sessions, pas dans les filles ni dans les tickets", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"],
      ["relecture", "SPEC_ALL_SOC-9.01", "s2", "sonnet", "90 k", "1,50"],
      ["relecture", "SPEC_ALL_SOC-9.02", "s3", "sonnet", "80 k", "0,50"],
    ]),
  );
  assert.deepEqual(bilan(c), { total: 5, filles: 3, tickets: 1, parTicket: 3 });
  const md = plat(enMarkdown([c]));
  assert.match(md, /\*\*Total : 5,00 \$\*\* sur 3 session\(s\) et 1 chantier\(s\)\. Filles : 3,00 \$ pour 1 ticket\(s\), soit 3,00 \$ par ticket\./);
  assert.match(md, /\| demo \| relecture \| SPEC_ALL_SOC-9\.01 \| s2 \| sonnet \| 90 k \| 1,50 \|/);
});

test("une carte sans section Coût ni Sujet garde le nom de son fichier et n'apparaît pas au registre", () => {
````

#### B8 — `scripts/depot.test.mjs:194`

Le test du gabarit de carte gagne deux assertions et un titre plus long.

Bloc retiré : de la ligne qui commence par

````js
// La carte de chantier : son gabarit porte la ligne `Gel:` (vide) dans la fiche
````

jusqu'à la ligne, non comprise, qui commence par

````js
// Un skill propre au projet (`P-21`)
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````js
// La carte de chantier : son gabarit porte la ligne `Gel:` (vide) dans la fiche et la section `## Journal`
// où le conducteur écrit ses arrêts ; le gate des cartes n'exige ni l'une ni l'autre. Il n'a plus de section
// `## Rétro` (ticket 55 : le bilan de fin de chantier est supprimé) et nomme le rôle `relecture` sous `## Coût`.
const CARTE = "skills/chaine/tickets/references/gabarits/carte.map.md";
test("le gabarit de la carte de chantier porte `Gel:` dans sa fiche et la section `## Journal`, nomme le rôle `relecture` sous `## Coût`, et n'a plus de section `## Rétro`", () => {
  const texte = readFileSync(join(RACINE, CARTE), "utf8");
  assert.ok(lignes(section(texte, "Fiche")).includes("Gel:"), `${CARTE} : la fiche porte la ligne Gel: vide`);
  assert.ok(titres(texte).includes("## Journal"), `${CARTE} : section ## Journal`);
  assert.deepEqual(titres(texte), ["## Fiche", "## Decisions-so-far", "## Fog", "## Vagues", "## Coût", "## Dépassements", "## Journal"], `${CARTE} : ses sections, sans ## Rétro`);
  assert.ok(lignes(section(texte, "Coût")).some((l) => /^<!-- Rôles : fille, conducteur, architecte, capitaine, relecture \(/.test(l)), `${CARTE} : la section ## Coût nomme ses rôles, relecture compris`);
});
````

#### B9 — fin de `scripts/depot.test.mjs`

Deux tests, après ceux du ticket 54. `SKILLS_CHAINE`, `REF`, `lignes` et `exiger` existent déjà dans le fichier.

Ajouté à la fin du fichier, après une ligne vide :

````js
// Le bilan de fin de chantier est supprimé (ticket 55 ; décision du produit du 2026-11-18, sans rien à la place) :
// les textes qui le demandaient ne nomment plus de rétro, et disent qu'un incident donne un ticket quand il arrive.
// Le gabarit de ticket montre les deux lignes que le gate accepte sans les exiger.
const SANS_RETRO = [
  `${SKILLS_CHAINE}/chantier/SKILL.md`,
  `${SKILLS_CHAINE}/chantier/references/CONTENU.md`,
  `${REF}/docs-agents/chaine-de-production.md`,
  `${REF}/docs-agents/pieges.md`,
  `${REF}/CONTENU.md`,
  "skills/chaine/tickets/references/gabarits/carte.map.md",
  "README.md",
];
test("le bilan de fin de chantier est supprimé : plus aucune rétro dans les textes du conducteur, un incident donne un ticket au moment où il arrive", () => {
  for (const f of SANS_RETRO) {
    const fautes = lignes(readFileSync(join(RACINE, f), "utf8")).flatMap((l, i) => (/rétro/i.test(l) ? [`${f}:${i + 1}`] : []));
    assert.deepEqual(fautes, [], `le bilan de fin de chantier est supprimé : ${fautes.join(" ; ")}`);
  }
  exiger(`${SKILLS_CHAINE}/chantier/SKILL.md`, [
    "## 7. Phase 5 — livraison (`Phase: 5-livraison`), phase 6 — nettoyage (`Phase: 6-nettoyage`, puis `Phase: fini`)",
    "**Aucun bilan de fin de chantier** : un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive — un gate, un critère de `revue-adversariale` — ou, faute de gate, une ligne de `docs/agents/pieges.md` ; vécu deux fois sans gate, il est signalé au produit.",
  ]);
  exiger(`${REF}/docs-agents/chaine-de-production.md`, [
    "──► vagues de filles ──► sujet livré (produit,",
    "7. **Un incident donne un ticket au moment où il arrive.** Chaque renvoi du capitaine et chaque échec de vague donne, sur le moment, un ticket (un gate, un critère de la revue adversariale) ou, faute de gate, une ligne de `pieges.md`. Il n'y a pas de bilan de fin de chantier. Un piège vécu deux fois sans gate est une dette.",
  ]);
  exiger(`${REF}/docs-agents/pieges.md`, [
    "Un incident qui n'a pas encore son gate reçoit ici sa ligne au moment où il arrive, avec son ticket (skill `chantier` § 7) : il n'y a pas de bilan de fin de chantier.",
  ]);
});

const GABARIT_TICKET = "skills/chaine/tickets/references/gabarits/ticket.issue.md";
test("le gabarit de ticket montre `Sensibles:` et `Relecture: double` dans son en-tête, après `Label:`, chacune à retirer quand elle ne sert pas", () => {
  const enTete = lignes(readFileSync(join(RACINE, GABARIT_TICKET), "utf8").split(/^## /m)[0]);
  const rang = (debut) => enTete.findIndex((l) => l.startsWith(debut));
  const [label, sensibles, relecture, dependances] = ["Label: contre-revue", "Sensibles: ", "Relecture: double # ", "Dépendances: "].map(rang);
  assert.ok(label >= 0 && sensibles === label + 1 && relecture === label + 2 && dependances === label + 3, `${GABARIT_TICKET} : Label, Sensibles, Relecture, Dépendances, dans cet ordre`);
  assert.match(enTete[sensibles], /^Sensibles: `\{\{chemin ou motif\}\}`, `\{\{chemin ou motif\}\}` — accord de \{\{la personne qui a accordé\}\}, \{\{AAAA-MM-JJ\}\} # .*ou `—` s'il n'en modifie aucun.*sans exiger la ligne.*ou retirer la ligne$/);
  assert.match(enTete[relecture], /^Relecture: double # .*seule valeur acceptée par le gate `tickets`, qui n'exige pas la ligne.*sinon retirer la ligne$/);
});
````

Après B1 à B9, le ticket 54 fait et rien d'autre : `node --test scripts/depot.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/docs/couts.test.mjs` rend **107 tests, 8 rouges** : dans `depot.test.mjs`, le test du gabarit de carte et les deux tests ajoutés ; dans `tickets.test.mjs`, le test de la carte et les trois tests ajoutés (les deux fonctions n'existent pas encore) ; dans `tickets-gate.test.mjs`, le test ajouté. Le test ajouté à `couts.test.mjs` et l'assertion de B4 sont **verts dès l'écriture** : ils prouvent un comportement que le code a déjà (décision 8).

### 1. Le gate

#### G1 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:581`

Dans `controlerCarte` : l'obligation sort, rien ne la remplace.

Ancien :

````js
  if (phase && /^fini(\s|$)/.test(phase.valeur)) {
    const retro = corps.get('Rétro');
    if (!retro || retro.length === 0) erreurs.push({ ligne: phase.ligne, message: `carte ${nom} : section \`## Rétro\` absente ou vide (obligatoire à \`fini\`)` });
  }
  const migrations = chercher(lignes, MIGRATIONS);
````

Nouveau :

````js
  const migrations = chercher(lignes, MIGRATIONS);
````

#### G2 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:175`

Ancien :

````js
const LABEL = /^Label\s*:\s*(.*)$/;
````

Nouveau :

````js
const LABEL = /^Label\s*:\s*(.*)$/;
const SENSIBLES = /^Sensibles\s*:\s*(.*)$/;
const RELECTURE = /^Relecture\s*:\s*(.*)$/;
````

#### G3 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:345`

Le commentaire de `plafondsDeLaCarte` nomme le rôle ; son code ne change pas.

Ancien :

````js
 * Tout autre rôle n'est pas jugé ; une cellule
````

Nouveau :

````js
 * Tout autre rôle n'est pas jugé (`capitaine`, `relecture` : une session de relecture d'une PR) ; une cellule
````

#### G4 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:430`

Deux fonctions exportées, `ecartsSensibles` et `ecartsRelecture`, et leurs trois aides, avant `ecartsRegles`, qui ne change pas.

Ancien :

````js
/**
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier.
````

Nouveau :

````js
/** La valeur sans son commentaire de gabarit (` # …`), comme sur `Type:`. Recherche d'un motif de deux caractères : linéaire. */
const sansCommentaire = (valeur) => {
  const i = valeur.search(/\s#/);
  return (i === -1 ? valeur : valeur.slice(0, i)).trim();
};

/** `AAAA-MM-JJ` d'un jour qui existe (`2026-02-30` n'en est pas un). */
const dateValide = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const jour = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(jour.getTime()) && jour.toISOString().slice(0, 10) === date;
};

const ACCORD = ' — accord de ';

/**
 * Écarts de la ligne `Sensibles:` d'un ticket : les chemins sensibles qu'il modifie et l'accord donné avant.
 * Deux formes : `—` seul (aucun chemin sensible), ou des chemins ou des motifs séparés par des virgules, entre
 * accents graves ou nus, puis ` — accord de <nom>, <AAAA-MM-JJ>`. Seule la forme est jugée : ni que le chemin est
 * déjà dans `cheminsSensibles` (un ticket peut nommer le dossier qu'un ticket précédent rendra sensible), ni que
 * l'accord a été donné. La ligne n'est jamais exigée. Lecture par découpes de chaîne : linéaire.
 */
export function ecartsSensibles(valeur) {
  const v = sansCommentaire(valeur);
  if (v === '—') return [];
  const forme = 'attendu `—`, ou des chemins séparés par des virgules puis ` — accord de <nom>, <AAAA-MM-JJ>`';
  const i = v.indexOf(ACCORD);
  const accord = i === -1 ? '' : v.slice(i + ACCORD.length);
  const j = accord.lastIndexOf(',');
  if (i <= 0 || j <= 0) return [`Sensibles « ${v} » : ${forme}`];
  const ecarts = [];
  for (const brut of v.slice(0, i).split(',')) {
    const c = brut.trim().replace(/^`([^`]*)`$/, '$1').trim();
    if (c === '' || /[\s`{}]/.test(c) || c === '—' || c.startsWith('/') || c.split('/').includes('..'))
      ecarts.push(`Sensibles : « ${brut.trim()} » n'est pas un chemin ni un motif relatif à la racine du dépôt (sans blanc, sans \`/\` initial, sans \`..\`) ; ${forme}`);
  }
  const nom = accord.slice(0, j).trim();
  const date = accord.slice(j + 1).trim();
  if (nom === '' || /^session_/.test(nom) || /[<>{}]/.test(nom))
    ecarts.push(`Sensibles : accord de « ${nom} » : attendu la personne qui a accordé, pas un identifiant de session ni un gabarit`);
  if (!dateValide(date)) ecarts.push(`Sensibles : date « ${date} » : attendu le jour de l'accord, AAAA-MM-JJ`);
  return ecarts;
}

/** Écarts de la ligne `Relecture:` d'un ticket : seule valeur `double` (deux relectures indépendantes). Jamais exigée. */
export function ecartsRelecture(valeur) {
  return sansCommentaire(valeur) === 'double' ? [] : [`Relecture « ${valeur} » : seule valeur \`double\` ; sinon retirer la ligne`];
}

/**
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier.
````

#### G5 — `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:518`

Dans `controlerTicket`, après le contrôle de `Sujet:` : pour tout ticket, prêt ou non, gelé ou non.

Ancien :

````js
  const pret = status?.valeur === 'ready-for-agent';
````

Nouveau :

````js
  // Lues dans l'en-tête seul : un exemple cité dans le corps du ticket n'est pas la ligne.
  const sensibles = chercher(tete(lignes), SENSIBLES);
  if (sensibles) for (const e of ecartsSensibles(sensibles.valeur)) erreurs.push({ ligne: sensibles.ligne, message: e });
  const relecture = chercher(tete(lignes), RELECTURE);
  if (relecture) for (const e of ecartsRelecture(relecture.valeur)) erreurs.push({ ligne: relecture.ligne, message: e });
  const pret = status?.valeur === 'ready-for-agent';
````

#### G6 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:17`

Ancien :

````js
`Conducteur:`, `## Coût` dès `4-vague-1`, `## Rétro`
 *      à `fini` ; une ligne de `## Coût`
````

Nouveau :

````js
`Conducteur:`, `## Coût` dès `4-vague-1` (aucune section
 *      `## Rétro` n'est exigée, pas même à `fini`) ; une ligne de `## Coût`
````

#### G7 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:19`

Ancien :

````js
l'`architecte` n'a pas de plafond) exige une
````

Nouveau :

````js
l'`architecte` n'a pas de plafond, tout autre rôle, `relecture` compris, n'est pas jugé) exige une
````

#### G8 — `skills/chaine/tickets/references/scripts/verify/tickets.mjs:38`

Ancien :

````js
 *      (`fichier.test.ts` « titre ») qui existent dans les fichiers de tests suivis et sont actifs.
````

Nouveau :

````js
 *      (`fichier.test.ts` « titre ») qui existent dans les fichiers de tests suivis et sont actifs ;
 *  12. `Sensibles:`, si la ligne est dans l'en-tête, vaut `—` ou des chemins (ou des motifs) séparés par des
 *      virgules puis ` — accord de <nom>, <AAAA-MM-JJ>` : la forme seule est jugée, la ligne n'est jamais exigée ;
 *  13. `Relecture:`, si la ligne est dans l'en-tête, vaut `double` ; elle n'est jamais exigée.
````

### 2. Les gabarits

#### M1 — `skills/chaine/tickets/references/gabarits/carte.map.md:34`

Un commentaire sous le titre, comme celui de la ligne 5 du gabarit ; le tableau ne change pas.

Bloc retiré : de la ligne qui commence par

````text
## Coût
````

jusqu'à la ligne, non comprise, qui commence par

````text
| Rôle | Ticket | Session
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````text
## Coût

<!-- Rôles : fille, conducteur, architecte, capitaine, relecture (une session de relecture d'une PR). Le gate `tickets` ne juge au plafond que fille et conducteur. -->
````

#### M2 — `skills/chaine/tickets/references/gabarits/carte.map.md:48`

La section `## Rétro` sort ; le gabarit finit sur `## Journal`.

Ancien :

````text
- {{AAAA-MM-JJ}} — {{ce qui s'est passé : gel, interruption des filles, dégel}}

## Rétro

{{À la fin : incidents, ce qui a donné un gate ou un critère de revue, coût total et par ticket.}}
````

Nouveau :

````text
- {{AAAA-MM-JJ}} — {{ce qui s'est passé : gel, interruption des filles, dégel}}
````

#### M3 — `skills/chaine/tickets/references/gabarits/ticket.issue.md:10`

Deux lignes après `Label:`, qui ne change pas.

Ancien :

````text
Label: contre-revue # obligatoire quand `Fichiers chauds` touche `cheminsSensibles` (le gate `tickets` le vérifie) — sinon retirer la ligne
````

Nouveau :

````text
Label: contre-revue # obligatoire quand `Fichiers chauds` touche `cheminsSensibles` (le gate `tickets` le vérifie) — sinon retirer la ligne
Sensibles: `{{chemin ou motif}}`, `{{chemin ou motif}}` — accord de {{la personne qui a accordé}}, {{AAAA-MM-JJ}} # les chemins sensibles que le ticket modifie et l'accord donné avant, ou `—` s'il n'en modifie aucun ; le gate `tickets` juge la forme sans exiger la ligne ; aucune garde ne la lit encore — ou retirer la ligne
Relecture: double # deux relectures indépendantes, pour un ticket qui touche une règle de criticité haute ; seule valeur acceptée par le gate `tickets`, qui n'exige pas la ligne ; sans effet pour l'instant — sinon retirer la ligne
````

### 3. Les textes, mot pour mot

#### R1 — `skills/chaine/chantier/SKILL.md:3`

Ancien :

````text
livraison par le capitaine et rétro. Le grilling complet
````

Nouveau :

````text
livraison par le capitaine. Le grilling complet
````

#### R2 — `skills/chaine/chantier/SKILL.md:43`

Ancien :

````text
(phase, sessions d'une vague, coût, incidents, rétro)
````

Nouveau :

````text
(phase, sessions d'une vague, coût, incidents)
````

#### R3 — `skills/chaine/chantier/SKILL.md:110`

Ancien :

````text
## 7. Phase 5 — livraison et rétro (`Phase: 5-livraison`)
````

Nouveau :

````text
## 7. Phase 5 — livraison (`Phase: 5-livraison`)
````

#### R4 — `skills/chaine/chantier/SKILL.md:113`

Le point 2 et ses deux puces (`chantier/SKILL.md:113-115`) deviennent un point d'une ligne : le relevé des coûts reste, le bilan sort, l'incident donne un ticket quand il arrive.

Bloc retiré : de la ligne qui commence par

````text
2. Rétro dans la carte, section `## Rétro` :
````

jusqu'à la ligne, non comprise, qui commence par

````text
3. Sessions filles finies :
````

À la place (les lignes vides qui précèdent la ligne gardée restent) :

````text
2. **Coût** : section `## Coût` de la carte (source du registre `docs/agents/couts.md`, index généré, qui donne le total et le coût par ticket), une ligne par session (`get_session` : `external_metadata.usage.cost_usd`, `context_usage.used_tokens`, `last_served_model`) — filles du tag `chantier:<nom>` relevées à chaque fin de vague, puis capitaine et cette session-ci (rôle `conducteur`) en fin de chantier. **Aucun bilan de fin de chantier** : un incident (un renvoi, une vague ratée) donne un ticket au moment où il arrive — un gate, un critère de `revue-adversariale` — ou, faute de gate, une ligne de `docs/agents/pieges.md` ; vécu deux fois sans gate, il est signalé au produit.
````

#### R5 — `skills/chaine/chantier/references/CONTENU.md:7`

Ancien :

````text
le fichier `docs/agents/pieges.md` que la rétro alimente.
````

Nouveau :

````text
le fichier `docs/agents/pieges.md`, où un incident sans gate reçoit sa ligne au moment où il arrive.
````

#### R6 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:29`

Le schéma du cycle perd sa dernière étape et le rôle écrit dessous.

Ancien :

````text
──► vagues de filles ──► sujet livré ──► rétro
(produit,     (architecte,      (conducteur)          (capitaine)                         (filles)            (capitaine)   (conducteur)
````

Nouveau :

````text
──► vagues de filles ──► sujet livré
(produit,     (architecte,      (conducteur)          (capitaine)                         (filles)            (capitaine)
````

#### R7 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:35`

Ancien :

````text
(phase, sessions, coûts, incidents, rétro)
````

Nouveau :

````text
(phase, sessions, coûts, incidents)
````

#### R8 — `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:40`

Ancien :

````text
7. **Rétro.** Chaque renvoi du capitaine et chaque échec de vague donne une ligne : un piège documenté, un critère de la revue adversariale, ou un gate. Un piège vécu deux fois sans gate est une dette.
````

Nouveau :

````text
7. **Un incident donne un ticket au moment où il arrive.** Chaque renvoi du capitaine et chaque échec de vague donne, sur le moment, un ticket (un gate, un critère de la revue adversariale) ou, faute de gate, une ligne de `pieges.md`. Il n'y a pas de bilan de fin de chantier. Un piège vécu deux fois sans gate est une dette.
````

#### R9 — `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md:3`

Ancien :

````text
La rétro d'un chantier (skill `chantier` § 7) ajoute ici une ligne par incident qui n'a pas encore son gate. Un piège vécu deux fois sans gate est une dette.
````

Nouveau :

````text
Un incident qui n'a pas encore son gate reçoit ici sa ligne au moment où il arrive, avec son ticket (skill `chantier` § 7) : il n'y a pas de bilan de fin de chantier. Un piège vécu deux fois sans gate est une dette.
````

#### R10 — `skills/chaine/socle-chaine-de-production/references/CONTENU.md:37` (ligne 33 une fois le ticket 54 fait)

Ancien :

````text
À côté, `pieges.md` : la liste que la rétro de chaque chantier alimente, amorcée avec les pièges déjà connus.
````

Nouveau :

````text
À côté, `pieges.md` : la liste des pièges déjà connus, où un incident sans gate reçoit sa ligne au moment où il arrive.
````

#### R11 — `skills/chaine/tickets/references/CONTENU.md:29`

Ancien :

````text
(une carte `fini` ne réserve plus : sinon deux chantiers se découvrent à la livraison du second), format prêt pour agent,
````

Nouveau :

````text
(une carte `fini` ne réserve plus : sinon deux chantiers se découvrent à la livraison du second ; aucune section `## Rétro` n'est exigée), lignes `Sensibles:` (des chemins puis l'accord, ou `—`) et `Relecture: double` bien formées quand elles sont là, jamais exigées, format prêt pour agent,
````

#### R12 — `README.md:88`

Huit espaces à la fin du « Nouveau » : la colonne du tableau garde sa largeur.

Ancien :

````text
suivi sans attente active, rétro ; reprenable ; signale un plafond sans rien couper, arrête un chantier gelé
````

Nouveau :

````text
suivi sans attente active ; reprenable ; signale un plafond sans rien couper, arrête un chantier gelé        
````

### 4. La version

#### V1 — `.claude-plugin/plugin.json:3` (texte posé par le ticket 54)

Ancien :

````json
"version": "7.16.0",
````

Nouveau :

````json
"version": "7.17.0",
````

Le deuxième nombre de la version de `origin/main`, plus un, troisième à zéro (règle de repli : décision 11).

## Surfaces

| Surface | Preuve |
| --- | --- |
| une carte `fini` sans `## Rétro` passe ; une carte d'avant qui garde la sienne passe ; `## Coût` reste exigée à `fini` | `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` « carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1 ; à fini, aucune section `## Rétro` n’est exigée » |
| `Sensibles:` : `—`, ou des chemins puis l'accord, passe, avec ou sans accents graves, avec un commentaire ; refusés : valeur vide, chemins sans accord, tiret simple, deux espaces, date mal formée ou qui n'existe pas, nom `session_…` ou gabarit, chemin vide, absolu, à `..`, à blanc, à accolades ; chaque écart est rendu ; trois valeurs hostiles lues en moins de 2 s | `tickets.test.mjs` « Sensibles: `—`, ou des chemins puis l’accord (nom, date), passe ; toute autre forme est refusée, en temps borné » |
| `Relecture:` : `double` passe, avec un commentaire ; toute autre valeur est refusée, majuscule comprise | `tickets.test.mjs` « Relecture: `double` passe ; toute autre valeur est refusée, la valeur nommée » |
| les deux lignes ne se lisent que dans l'en-tête ; absentes, rien n'est exigé ; mal formées, l'erreur porte leur ligne ; elles valent pour un ticket qui n'est pas prêt et pour un ticket gelé ; `Label: contre-revue` reste exigé à côté de `Sensibles:` | `tickets.test.mjs` « `Sensibles:` et `Relecture:` ne se lisent que dans l’en-tête, ne sont jamais exigées, et `Label: contre-revue` reste exigé à côté d’elles » |
| `Label: contre-revue` exigé comme avant | `tickets.test.mjs` « un ticket prêt sur un chemin sensible sans `Label: contre-revue` est refusé ; avec, accepté ; l'ancienne valeur `architecte` reste acceptée ; hors chemin sensible, rien n'est exigé », `tickets-gate.test.mjs` « un ticket prêt dont `Fichiers chauds` touche `cheminsSensibles` sans `Label: contre-revue` est refusé ; avec, ou avec l'ancienne valeur, il passe », sans retouche |
| une ligne de coût de rôle `relecture` n'est pas jugée au plafond, même illisible | `tickets.test.mjs` « une ligne de coût au-delà du plafond de son rôle est refusée sans ligne de dépassement pour sa session ; avec, elle passe » (une assertion ajoutée) |
| le gate lancé pour de vrai : `Sensibles:` et `Relecture:` mal formées refusées avec le chemin et la ligne ; bien formées, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture à 900 k tokens, passe | `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs` « gate complet : `Sensibles:` ou `Relecture:` mal formée est refusée avec le chemin et la ligne ; bien formées, le ticket passe ; une carte `fini` sans `## Rétro`, avec une session de relecture, passe » |
| une session de relecture compte au registre dans le total et les sessions, pas dans les filles ni les tickets | `skills/chaine/tickets/references/scripts/docs/couts.test.mjs` « une session de relecture compte dans le total et les sessions, pas dans les filles ni dans les tickets » |
| le gabarit de carte n'a plus de `## Rétro` et nomme le rôle `relecture` sous `## Coût` | `scripts/depot.test.mjs` « le gabarit de la carte de chantier porte `Gel:` dans sa fiche et la section `## Journal`, nomme le rôle `relecture` sous `## Coût`, et n'a plus de section `## Rétro` » |
| le gabarit de ticket montre les deux lignes après `Label:` | `scripts/depot.test.mjs` « le gabarit de ticket montre `Sensibles:` et `Relecture: double` dans son en-tête, après `Label:`, chacune à retirer quand elle ne sert pas » |
| `chantier/SKILL.md`, son `CONTENU.md`, `chaine-de-production.md`, `pieges.md`, le `CONTENU.md` du socle, le gabarit de carte et `README.md` ne nomment plus de rétro ; le skill, la méthode et `pieges.md` disent qu'un incident donne un ticket au moment où il arrive | `scripts/depot.test.mjs` « le bilan de fin de chantier est supprimé : plus aucune rétro dans les textes du conducteur, un incident donne un ticket au moment où il arrive » |
| l'en-tête de `tickets.mjs` et le `CONTENU.md` du skill `tickets` | lecture, en revue (pas de test) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Joué le 2026-11-18 sur un clone jetable de `4a45634` où le ticket 54 est appliqué (711 tests), sous Node 22.23, puis le clone retiré. Ce ticket a été relu par un script qui en tire chaque bloc « Ancien », « Nouveau », « Bloc retiré » et le banc, et les applique à une copie neuve : ce qui suit est le résultat de ce texte.

- Le ticket 54 fait, sans rien d'autre : **711 sur 711**.
- Le banc du § 0 : 107 tests, les 8 rouges nommés au § 0.
- §§ 0 à 4 appliqués : **718 sur 718** (711 + 7 : trois tests dans `tickets.test.mjs`, un dans `tickets-gate.test.mjs`, un dans `couts.test.mjs`, deux dans `depot.test.mjs`). Aucun test retiré ; une assertion remplacée par trois (B3).
- `git diff --stat` contre le ticket 54 fait : 16 fichiers, ceux de « Fichiers chauds ». `chantier/SKILL.md` : 126 lignes (128 avant).
- **Mutations**, chacune jouée seule sur le texte corrigé, puis le texte remis ; chacune fait rougir au moins un test : la section `## Rétro` de nouveau exigée à `fini` ; `ecartsRelecture` qui accepte tout ; `Relecture:` lue sans égard à la casse ; `Sensibles:` lue dans tout le fichier ; `Relecture:` lue dans tout le fichier ; la date non vérifiée au calendrier ; un nom `session_…` accepté ; le commentaire de gabarit refusé ; des chemins sans accord acceptés ; un segment `..` accepté ; `Sensibles:` qui dispense de `Label: contre-revue` ; le rôle `relecture` jugé au plafond ; le rôle `relecture` compté comme une fille au registre ; `## Rétro` remise dans le gabarit de carte ; le rôle `relecture` retiré du gabarit de carte ; la ligne `Relecture:` retirée du gabarit de ticket ; « et rétro » remis dans `chantier/SKILL.md` ; « La rétro ajoute ici une ligne » remis dans `pieges.md`. Dix-huit sur dix-huit.
- **Le gate lancé pour de vrai**, par B6 : `tickets.mjs` joué en ligne de commande sur deux dépôts jouets (`depotJouet`), l'un conforme, l'autre aux deux lignes mal formées.

Pour la session :

1. Le § 0 : huit rouges. Les §§ 1 à 4, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 7**.
2. `git diff origin/main --stat` ne montre que les seize fichiers de « Fichiers chauds » ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend **1** (l'assertion de B3, remplacée par trois) ; `git diff origin/main --stat -- skills/chaine/tickets/references/scripts/docs/couts.mjs` ne rend rien ; `wc -l skills/chaine/chantier/SKILL.md` : 126.
3. Revue de ticket (ses trois axes), sa section dans le corps de la PR.
4. La PR vise `main`, hors brouillon, **sans `à-fusionner`** ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main`, le ticket 54 entré, et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Que la forme de `Sensibles:` retenue ici soit celle que liront les gardes** : `A-74` donne un exemple et une phrase, pas une grammaire. Les précisions de la décision 3 (accents graves facultatifs, commentaire de gabarit, nom qui n'est pas une session, jour qui existe, `..` refusé) sont du rédacteur. Si le ticket des gardes en veut une autre, le gate et son banc suivent dans ce ticket-là.
- **L'accord lui-même** : c'est une session qui écrit le nom de qui a accordé ; le gate lit une forme, il ne prouve rien (limite écrite dans la spec, « Ce que cette spec ne ferme pas »).
- **Le plafond de contexte d'une session de relecture** : `A-87` dit qu'elle « se signale au conducteur, comme tout plafond » ; ce ticket ne la juge pas, comme tout rôle autre que `fille` et `conducteur`.
- **Les cartes des projets** n'ont pas été relues une à une : seule l'absence des deux lignes dans les tickets a été vérifiée (« Repose dans un projet »).
- **Le banc des textes** tient l'absence du mot « rétro » dans sept fichiers et trois passages mot pour mot ; une phrase qui redemanderait un bilan sous un autre mot passerait.

## Hors périmètre

- **Les gardes des fichiers sensibles** (`A-73` à `A-76`) : le hook d'édition, `sujet.sh fusionner`, `passer.sh`, la section `## Fichiers sensibles` de la carte. Aucune ne lit encore la ligne.
- **`Relecture: double` exigée** sur un ticket qui cite une règle haute, et **`Label: contre-revue` relâché** : avec le régime de la relecture indépendante, pas avant.
- **Le skill `relecture`, le Relecteur**, les lignes `Relecteur:` et `Relecteurs:` des cartes, le coût relevé d'une session de relecture par qui archive.
- **Le § 3 de `chaine-de-production.md`** et `issue-tracker.md`, qui décrivent l'en-tête d'un ticket prêt : ils nommeront les deux lignes quand une garde les lira.
- **Une colonne « allers-retours de relecture »** au registre des coûts.
- **La repose dans les projets** : par leur architecte.

## Comments

- 2026-11-18 — Rédigé sur `4a45634` (plugin 7.15.0, 738 tests) et sur le ticket 54 joué (711 tests), d'après `P-57`, `A-95`, `A-74`, `A-82`, `A-87` et le lot 2 de la spec du chantier 3. Inventaire refait par recherche (`Rétro`, `rétro`, `bilan`, `Sensibles`, `Relecture:`, les rôles de `## Coût`), chaque occurrence lue. Joué sur un clone jetable : 718 tests, dix-huit mutations rouges. Écart avec la spec, relevé : elle fait « accepter » au gate trois écritures qu'il ne refuse pas aujourd'hui, et range `couts.mjs` parmi les fichiers du lot alors que rien n'y change ; ce ticket fait juger la forme (décisions 3 à 6) et prouve le reste par des tests. Choix du rédacteur : (1) la grammaire de `Sensibles:` (décision 3) ; (2) les deux lignes lues dans l'en-tête seul, sur tout ticket (décision 4) ; (3) `Relecture:` à la casse près (décision 6) ; (4) le vocabulaire des rôles laissé ouvert (décision 8) ; (5) `pieges.md` gardé comme liste des pièges, alimenté à l'incident (décision 2) ; (6) les mots des gabarits (décision 9).

- 2026-11-18 — Architecte : ticket écrit et joué sur `origin/main` à `4a45634` (7.15.0). `main` est depuis à `1c4acb1` (7.17.0) et le programme « capitaine à jour et testé » modifie plusieurs fichiers de ce ticket (`passer.sh`, `boucle.sh`, `faux-gh.mjs`, `regles.mjs`, `chantier/SKILL.md`). **`needs-info` jusqu'au rejeu des blocs sur `main`**, une fois ses tickets chauds entrés : repères de ligne, compte de tests, numéro de version et note dans `NOTES-DE-VERSION.md` (fichier né en 7.16.0) sont à reprendre ; les décisions du ticket, elles, tiennent.
