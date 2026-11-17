# Le skill de criticité fixe la criticité d'une règle à son écriture, avant tout code, et la session qui écrit la spec rédige la règle

Status: ready-for-agent
Type: task
Modèle: sonnet — un skill nouveau de trois fichiers donnés entiers, treize remplacements de documentation donnés mot pour mot (ancien, nouveau), un banc de cinq tests donné entier, la version ; tout est joué sur une copie jetable de `origin/main`, mutations comprises (voir « Vérification »). Rien à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/criticite/SKILL.md`, `skills/chaine/criticite/references/prompt.md`, `skills/chaine/criticite/references/CONTENU.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/tickets/SKILL.md`, `skills/chaine/tickets/references/agents/issue-tracker.md`, `skills/chaine/tickets/references/gabarits/regle.md`, `skills/chaine/anchorpost/references/rules/anchorpost.md`, `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json`, `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, `README.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**La décision du produit** (`P-36` de la carte « gouverner nos boucles », 2026-11-17 ; amendement (2) du 2026-11-17 de `SPEC_ALL_ANC-5` d'Anchorpost, sur `origin/sujet/preuve-suffisante-cas` ; `RULE_ALL_ANC-24`, réécrite et validée le même jour, sur `origin/develop`). Ses mots : « La criticité est fixée par un agent, plus par l'humain. Un skill de criticité, lancé dans un sous-agent en contexte vierge au moment où la règle s'écrit, avant tout code, fixe le niveau et sa raison, écrit les cas attendus et répond aux dix familles. L'humain ne valide plus règle par règle : il revoit les niveaux dans Anchorpost et corrige par une PR. » Ses deux parades : « le skill ne rend jamais « basse » sans une raison écrite dans la règle ; dans le doute, il rend le niveau supérieur » ; « l'index dit qui a fixé chaque criticité, un agent ou une personne ». Ajout de l'architecte, validé par le produit (`RULE_ALL_ANC-24`) : un agent peut monter un niveau, jamais le baisser. Et `P-35` (même jour, `RULE_ALL_ANC-28`) : les dix familles sont obligatoires dès la criticité moyenne.

**Ce que la spec fixe** (`SPEC_ALL_ANC-5` § 1 et § 2, `RULE_ALL_ANC-26`, `RULE_ALL_ANC-28`) : l'en-tête d'une règle porte `criticality: { level, by, reason }` (`level` : `low`, `medium`, `high` ; `by` : `agent` ou une personne ; `reason` obligatoire pour `low`), `cases` (chaque cas : `id`, `title`, `kind` parmi `nominal`, `edge`, `invalid`, `refusal`, `scope` parmi `business`, `technical`, `family` facultatif) et `notApplicableFamilies` (`{ family, reason }`) ; les dix familles s'écrivent `limits`, `empty`, `invalid-input`, `duplicate`, `ordering`, `time`, `permissions`, `rare-state`, `volume`, `failure`. Une règle déclarée par une feature (`Règles:` de sa spec ou d'un de ses tickets) prend la plus haute des criticités qu'elle reçoit (`RULE_ALL_ANC-24`) : une règle basse ne peut pas vivre dans une feature moyenne (`A-23` de la carte du chantier, constat du pilote).

**La carte du chantier** (`SPEC_ALL_ANC-5-preuve-suffisante.map.md`, « Part de skills ») : `K7`, le skill de criticité, qui « n'attend pas la CLI 2.0.0 pour le texte » ; `K8`, « qui rédige une règle, et quand » (demande du produit, 2026-11-17), avec ce constat : « le skill `architecte` ne cite aujourd'hui ni le gabarit `regle.md` ni la fiche d'écriture `.claude/rules/anchorpost.md` ; il les cite ». Les deux en une PR : ils touchent les mêmes skills.

**Le fait, sur `origin/main`** : aucun skill ne fixe une criticité ; `architecte/SKILL.md` ne cite ni `regle.md` ni `anchorpost.md` (`git grep -n "regle.md\|rules/anchorpost" origin/main -- skills/chaine/architecte` ne rend rien) ; aucun texte ne dit qui écrit le fichier d'une règle, ni à quelle étape ; le gabarit `regle.md` n'a ni `criticality`, ni `cases`, ni `notApplicableFamilies` ; et `maj-skills:anchorpost` manque à `references-agent-integrees.json`, si bien que le gate `references-agent` d'un projet refuse une fiche qui cite le skill par son nom qualifié.

Quand le ticket est fait : le skill `criticite` existe, déclaré partout où le plugin liste ses skills ; il dit quand il se lance, ce que reçoit son sous-agent, ce qu'il rend, ce que l'auteur écrit, ses garde-fous, et comment il sait que la CLI du projet laisse écrire les clés ; son prompt est donné en entier, à liste fermée ; l'architecte, le conducteur, le skill `tickets`, le tracker et la fiche d'Anchorpost disent qui rédige une règle, à l'étape de la spec, et que cette session lance le skill de criticité ; l'architecte cite le gabarit et la fiche ; le gabarit de règle porte les trois clés en commentaire, « à partir de la CLI Anchorpost 2.0.0 » ; un banc tient chaque phrase porteuse de règle, et quarante-deux mutations le font rougir.

Ticket de documentation et de banc : aucun script, aucun hook ne change, aucun fichier n'est posé dans un projet par un script.

## Où

Base : `origin/main` à `c17f88b` (PR 107 du ticket 48 fusionnée, plugin **7.12.3**, **665 tests**). La session retrouve chaque « Ancien » par son texte ; chacun y apparaît une seule fois.

| Texte | Ce qu'il dit | Verdict |
| --- | --- | --- |
| `skills/chaine/criticite/` | — (absent) | N1 à N3 : le skill, trois fichiers |
| `skills/chaine/architecte/SKILL.md:54` (§ 3, point 3, « La spec ») | la spec, ses règles citées ; rien sur le fichier d'une règle, ni gabarit ni fiche | R1 : un point 4, qui rédige, le gabarit, la fiche, le skill de criticité |
| `skills/chaine/chantier/SKILL.md:60` (§ 3, point 1, « Specs ») | « cite les règles métier du registre sans les formuler » | R2 : la règle que le registre n'a pas, écrite au cadrage, puis le skill |
| `skills/chaine/tickets/SKILL.md:62` (« Créer une spec, un ticket, une règle ou une demande ») | « une règle naît `candidate`, seul un humain écrit `validated` » | R3 : qui l'écrit, à quelle étape, le skill |
| `skills/chaine/tickets/references/agents/issue-tracker.md:48` (« Quand un skill dit « publier vers le tracker » ») | « Une règle → …, `candidate`. » | R4 : qui l'écrit, à quelle étape, le skill |
| `skills/chaine/anchorpost/references/rules/anchorpost.md:27` (« Qui écrit quoi ») | la validation écrite par un humain | R5 : le fichier écrit à l'étape de la spec ; la criticité fixée par un agent ; monter, jamais baisser ; la version de la CLI |
| `skills/chaine/tickets/references/gabarits/regle.md:20` (après `# code:`) | — | R6 : `criticality`, `cases`, `notApplicableFamilies`, en commentaire |
| `.claude-plugin/plugin.json:37` et `:3` | la liste des skills ; 7.12.3 | R7 : le skill déclaré ; R8 : 7.13.0 |
| `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json:7` | les skills qualifiés qu'accepte le gate `references-agent` d'un projet ; `maj-skills:anchorpost` y manque | R9 : `maj-skills:anchorpost` et `maj-skills:criticite` |
| `README.md:82`, `:90`, `:153` | le tableau des skills de `chaine/`, l'invocation, l'arbre | R10 à R12 |
| `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md:44` | la liste des skills de la chaîne posée dans le `CLAUDE.md` d'un projet | R13 |
| fin de `scripts/depot.test.mjs` | — | § 0 : cinq tests |

### Les endroits où le plugin liste ses skills, relevés

`git grep -n "recette-humaine" origin/main -- . ':!docs/issues'`, puis lecture de chaque ligne : `.claude-plugin/plugin.json` (`skills`, lu par les tests « chaque skill du dépôt est déclaré dans le plugin » et « chaque skill déclaré existe ») ; `README.md` (tableau, invocation, arbre ; « Ajouter un skill », étapes 2 à 4) ; `references-agent-integrees.json` (le gate d'un projet) ; le `CLAUDE.md` posé par `socle-monorepo`. **Gardés tels quels** : `.claude-plugin/marketplace.json` (aucune liste de skills) ; la description de `socle-chaine-de-production/SKILL.md` (les skills qu'il sert, pas le skill de criticité, qui ne pose rien) ; `scripts/poses.test.mjs` (`POSES`, les dossiers de scripts posés : le skill n'en a pas) ; `scripts/points-d-entree.test.mjs` (scripts en ligne de commande : aucun). Aucun banc ne compte les skills : ils sont comptés par la liste de `plugin.json`, que le test du § 0 croise avec le README et le gate.

### Les limites, relevées

- **Un `SKILL.md` a au plus 200 lignes** (`scripts/depot.test.mjs:12`, `LIMITE`, test « aucun SKILL.md ne dépasse 200 lignes », miroir du gate `budget-contexte` des projets). Après le ticket : `criticite/SKILL.md` **84** lignes, `architecte/SKILL.md` 107, `chantier/SKILL.md` 128, `tickets/SKILL.md` 97.
- **La fiche `anchorpost.md`** est posée dans un projet sous `.claude/rules/` : même plafond de 200 lignes par le gate `budget-contexte` ; elle reste à 47 lignes.
- **Le skill n'est pas marqué `disable-model-invocation`** : la session qui écrit une règle le charge par l'outil Skill (l'architecte, le conducteur ou une session de travail), et le test « aucun SKILL.md ne demande la commande d'un skill marqué » ne s'y applique pas.
- **Le gabarit commenté** : aucun script ni banc ne lit `regle.md` (`git grep -n "regle\.md" origin/main -- '*.mjs'` ne rend rien) ; les lignes ajoutées commencent par `#`, comme les clés facultatives déjà présentes. La suite entière reste verte (« Vérification »).

## Décisions

1. **Le nom : `criticite`**, dossier `skills/chaine/criticite/`, à côté des skills de la chaîne qui écrivent la documentation (`tickets`, `anchorpost`). Sans accent, comme les autres dossiers ; commande `/maj-skills:criticite`. Il ne pose rien dans un projet : ni `poser`, ni script.
2. **Quand** : à l'écriture de la règle, avant tout code, par la session qui écrit la spec qui la porte ; sur une règle « à classer » ; relancé sur une règle classée (étape 5 du skill). Jamais par une session qui code un ticket.
3. **Le sous-agent est lancé par la session elle-même** : un sous-agent ne lance pas de sous-agent. L'architecte, qui confie la rédaction à des sous-agents (`architecte/SKILL.md:10`), lance le skill de criticité lui-même, le fichier écrit.
4. **Ce que reçoit le sous-agent** : le titre et l'énoncé de la règle (sans l'en-tête), la ou les specs qui la déclarent en `Règles:`, et les définitions, écrites dans le prompt. Jamais l'intention de l'auteur, l'historique de la session, la description de la PR, le niveau ni les cas déjà écrits, la criticité d'une feature, le code, les tests. Il ne lit rien du dépôt : tout est dans son prompt.
5. **Ce qu'il rend** : un seul bloc YAML, l'en-tête à écrire (`criticality` avec `by: agent`, `cases`, `notApplicableFamilies`), puis « Questions : ». Les dix familles reçoivent toujours une réponse, quel que soit le niveau : elles sont exigées dès la moyenne (`P-35`), et une famille sans réponse sur une règle basse est un avertissement de santé (`SPEC_ALL_ANC-5` § 3).
6. **Les garde-fous** : jamais « basse » sans raison (une sortie `low` sans `reason` est refusée : un second sous-agent, une fois, puis la règle reste « à classer ») ; le niveau supérieur dans le doute ; la session qui retient ou corrige est un agent, elle ne baisse jamais le niveau rendu ; une règle proposée sous le niveau d'une feature qui la déclare est signalée dans la PR. Relancé : une criticité fixée par une personne (ou la forme ancienne `criticality: high`, sans `by`) ne se réécrit jamais, tout écart se signale ; fixée par un agent, un niveau plus haut s'écrit, un niveau jugé trop haut ne change rien et se signale. Les cas déjà écrits ne se retirent ni ne se réécrivent.
7. **La limite, et comment le skill la connaît.** Tant que le projet n'a pas la CLI Anchorpost qui porte le pivot 3 (2.0.0), le schéma strict des règles refuse ces clés. La session lit, depuis la racine du projet, la version de `node_modules/@maj-agency/anchorpost/package.json` et le champ `schema` de l'index commis `anchorpost/anchorpost.json`. Les clés s'écrivent si la version a une majeure de 2 ou plus, ou si l'index est en `"3"` ou plus (la CLI du projet l'a écrit). `0.0.0` est une CLI de l'espace de travail : dans Anchorpost lui-même (`apps/cli`, `"version": "0.0.0"`), seul l'index fait foi, aujourd'hui `"schema": "2"`. Sinon, et aussi dans un projet sans Anchorpost, rien ne s'écrit dans le fichier : la proposition va dans la section `## Criticité proposée` du corps de la PR.
8. **Qui rédige une règle** (`K8`) : la session qui écrit la spec qui la porte, à l'étape de la spec, après le grilling — l'architecte d'un programme, le conducteur au cadrage d'un chantier (une règle que le registre n'a pas encore), toute session qui publie une règle (skill `tickets`). Elle lance le skill de criticité sur chaque règle, puis retient ou corrige chaque proposition. La validation reste écrite par un humain ; la criticité est fixée par un agent (fiche `anchorpost.md`).
9. **Le gabarit `regle.md`** gagne les trois clés en commentaire, chacune avec « à partir de la CLI Anchorpost 2.0.0 » ; elles restent commentées, comme `exception`, `epics` ou `code`, parce qu'un projet en CLI 1.x copie ce gabarit et que son schéma strict les refuserait.
10. **`maj-skills:anchorpost` et `maj-skills:criticite` entrent dans `references-agent-integrees.json`** : la fiche `anchorpost.md`, posée dans les projets, cite `maj-skills:criticite` par son nom qualifié, que le gate `references-agent` vérifie ; `maj-skills:anchorpost` y manquait déjà. Le test du § 0 exige chaque skill de `plugin.json` dans cette liste et au tableau du README : un oubli futur rougit.
11. **Le banc lit le texte et le tient** : il exige, à plat (blancs et sauts de ligne réduits à une espace), chaque phrase qui porte une règle du skill et de son prompt (jamais « basse » sans raison ; niveau supérieur dans le doute ; un agent ne baisse jamais ; contexte vierge ; avant tout code ; ce que le sous-agent ne reçoit pas ; la vérification de la CLI ; la feature ; une criticité fixée par une personne), de chaque texte qui dit qui rédige une règle, les deux fichiers cités par l'architecte (et qu'ils existent), et la forme commentée du gabarit. **Limite** : il vérifie la présence d'une phrase, pas l'absence de ce qui la contredit (même limite que le ticket 46, décision 12). Aucun test existant n'est retiré, sauté ni assoupli.
12. **Version : mineure** (`.claude-plugin/plugin.json:3`, 7.12.3 → **7.13.0** sur `c17f88b`) : un skill ajouté (`README.md`, « Ajouter un skill », étape 4 : « mineure pour un skill ou un gabarit ajouté »). **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au deuxième nombre, troisième à zéro, puis vérifie la valeur après la fusion (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` et la ligne du skill). La ligne `criticite ≥ 7.13` de R13 suit la version retenue.
13. **Pas de `Label: contre-revue`** : aucun fichier de `cheminsSensibles` (gabarit `socle-chaine-de-production/references/chaine.json` : `scripts/agent/**`, `scripts/chaine/**`, `.husky/**`, `.github/workflows/**`, `.github/actions/**`, `scripts/docs/identifiants.mjs`, `.claude/**`) n'est touché. PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la lit (documentation du plugin), puis la fait entrer. Titre `feat(chaine): le skill de criticité, et la session qui écrit la spec rédige la règle (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Donner au sous-agent la criticité de la feature, ou le niveau déjà écrit** : il jugerait l'écart plutôt que la règle ; la session compare après (étape 4, point 3, et étape 5).
- **Laisser un sous-agent de rédaction lancer le skill** : un sous-agent ne lance pas de sous-agent ; le geste serait perdu sans bruit.
- **Écrire la proposition dans `extensions` de l'en-tête, quand la CLI ne porte pas le pivot 3** : le schéma l'accepte, mais Anchorpost l'ignore et rien ne la ferait passer en clés au passage à 2.0.0 ; la PR, relue, la porte (décision 7). À reprendre si l'architecte la préfère.
- **Un script qui vérifie la version** : le skill ne pose rien dans un projet ; deux commandes `node -e` suffisent et se lisent dans le skill.

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge

Dans `scripts/depot.test.mjs`, après le dernier test (« le plafond de la garde de commandes : CONTENU.md du socle de la chaîne dit 20 000 caractères, le pire cas mesuré et le contournement par un fichier »), une ligne vide, puis, rien d'autre :

````js
// Le skill de criticité (ticket 49) : la criticité d'une règle est fixée par un agent, dans un sous-agent en contexte
// vierge, au moment où la règle s'écrit et avant tout code (décision du produit). Le banc tient chaque phrase qui porte
// une règle du skill, de son prompt, des textes qui disent qui rédige une règle, et du gabarit de règle. Les textes
// sont lus à plat (blancs et sauts de ligne réduits à une espace) : une phrase exigée peut changer de ligne.
const plat = (t) => t.replace(/\s+/g, " ");
const exiger = (chemin, phrases) => {
  const texte = plat(readFileSync(join(RACINE, chemin), "utf8"));
  const absentes = phrases.filter((p) => !texte.includes(plat(p)));
  assert.deepEqual(absentes, [], `${chemin} : phrases absentes : ${absentes.join(" | ")}`);
};
const CRITICITE = `${SKILLS_CHAINE}/criticite`;
const FAMILLES = ["limits", "empty", "invalid-input", "duplicate", "ordering", "time", "permissions", "rare-state", "volume", "failure"];
const GABARIT_REGLE = `${SKILLS_CHAINE}/tickets/references/gabarits/regle.md`;
const FICHE_ANCHORPOST = `${SKILLS_CHAINE}/anchorpost/references/rules/anchorpost.md`;

test("lecteur à plat : entrées piégées", () => {
  assert.equal(plat("a\r\n  b\tc"), "a b c");
  assert.equal(plat("a b").includes(plat("a\nb")), true, "une phrase coupée par un saut de ligne");
  assert.equal(plat("a  bc").includes(plat("a b c")), false, "variante voisine");
});

test("le skill de criticité : avant tout code, un sous-agent en contexte vierge ; jamais « basse » sans raison ; le niveau supérieur dans le doute ; un agent ne baisse jamais", () => {
  exiger(`${CRITICITE}/SKILL.md`, [
    "« le skill ne rend jamais « basse » sans une raison écrite dans la règle ; dans le doute, il rend le niveau supérieur » ; « l'index dit qui a fixé chaque criticité, un agent ou une personne ».",
    "**À l'écriture d'une règle, avant tout code.** La session qui écrit la spec qui porte la règle écrit son fichier, `candidate`, à l'étape de la spec, après le grilling : l'architecte d'un programme, le conducteur au cadrage d'un chantier, ou toute session qui publie une règle (skill `tickets`).",
    "Une session qui code un ticket ne le lance pas : sa règle est déjà écrite.",
    "**Le sous-agent est lancé par la session elle-même** : un sous-agent ne lance pas de sous-agent.",
    "Les clés s'écrivent si la première commande rend une version de majeure 2 ou plus (2.0.0, 2.1.3), ou si la seconde rend `3` ou plus",
    "Une version `0.0.0` est celle d'une CLI de l'espace de travail (Anchorpost lui-même) : seul l'index fait foi.",
    "Sinon (version 1.x, `absente`, index `\"2\"` ou `absent`), **rien ne s'écrit dans le fichier de la règle** : la proposition va dans la PR (étape 4).",
    'node -e \'const f=require("fs"),p="node_modules/@maj-agency/anchorpost/package.json";console.log(f.existsSync(p)?JSON.parse(f.readFileSync(p,"utf8")).version:"absente")\'',
    'node -e \'const f=require("fs"),p="anchorpost/anchorpost.json";console.log(f.existsSync(p)?JSON.parse(f.readFileSync(p,"utf8")).schema:"absent")\'',
    "Il ne reçoit **jamais** l'intention de l'auteur, l'historique de la session, la description de la PR, le niveau ou les cas déjà écrits, la criticité d'une feature, le code ni les tests.",
    "Outil **Agent**, un sous-agent neuf par règle, sans outil d'écriture : il ne lit rien du dépôt, tout ce qu'il juge est dans son prompt.",
    "Hors format, ou `low` sans `reason`, ou une famille sans réponse : un second sous-agent neuf, une fois. Encore hors format : rien ne s'écrit, la règle reste « à classer », et la PR le dit. **Jamais « basse » sans une raison écrite.**",
    "Elle ne baisse jamais le niveau rendu : **un agent peut monter un niveau, jamais le baisser** ; baisser est le geste d'une personne, par une PR.",
    "Une règle basse ne peut donc pas vivre dans une feature moyenne : quand la session voit une règle proposée sous le niveau d'une feature qui la déclare, elle l'écrit dans la PR",
    "le skill ne réécrit jamais une criticité fixée par une personne.",
    "**Une criticité fixée par un agent** : un niveau rendu plus haut s'écrit, avec sa raison ; égal, rien ne change ; s'il juge le niveau trop haut, il ne change rien et le signale dans la PR pour qu'une personne décide.",
    "level: medium # low | medium | high by: agent reason:",
    "- Écrire « basse » sans raison, ou trancher un doute vers le bas.",
    "- Baisser un niveau, ou réécrire une criticité fixée par une personne.",
    "- Écrire `criticality`, `cases` ou `notApplicableFamilies` dans un projet dont la CLI ne porte pas le pivot 3.",
  ]);
  exiger(`${CRITICITE}/references/prompt.md`, [
    "au moment où elle s'écrit, avant tout code. Tu ne sais rien de la session qui l'a écrite ni de son intention : tu ne reçois que l'énoncé de la règle, la spec qui la porte et les définitions ci-dessous.",
    "Tu ne lis rien d'autre : ni le dépôt, ni le code, ni les tests, ni l'historique git ; tu ne lances aucune commande.",
    "- high : une erreur casse ou bloque un usage essentiel, coûte de l'argent, ouvre un accès, expose ou perd une donnée, ou ne se rattrape pas. On ne peut pas attendre le correctif ;",
    "- medium : une erreur casse ou bloque un usage courant, fausse ce que la MOA lit, ou laisse entrer des données erronées. Les gens patientent, on corrige ;",
    "- low : une erreur gêne, sans conséquence durable.",
    "Dans le doute entre deux niveaux, rends le niveau supérieur.",
    "Ne rends jamais low sans une raison écrite qui dit pourquoi une erreur ne laisse aucune conséquence durable.",
    "- nominal : la situation ordinaire que la règle traite ;",
    "- edge : une situation valide, au bord de la règle, où elle doit encore donner la bonne réponse ;",
    "- invalid : la donnée est mal formée ou incomplète, l'application ne peut pas répondre et la rejette ;",
    "- refusal : la donnée est correcte, c'est la règle qui interdit.",
    "chacune des dix familles reçoit une réponse : un cas au moins qui la porte (champ family ; un cas de genre invalid répond d'office à invalid-input), ou une entrée de notApplicableFamilies avec sa raison. Aucune famille sans réponse ;",
    "- by autre que agent.",
    "Règle : <règle> Spec qui la porte : <spec>",
  ]);
  const prompt = plat(readFileSync(join(RACINE, CRITICITE, "references/prompt.md"), "utf8"));
  const absentes = FAMILLES.filter((f) => !prompt.includes(`${f} (`));
  assert.deepEqual(absentes, [], `prompt.md : familles absentes : ${absentes.join(", ")}`);
});

test("qui rédige une règle, et quand : l'architecte, le conducteur, le skill tickets, le tracker et la fiche d'Anchorpost le disent, et l'architecte cite le gabarit et la fiche", () => {
  exiger(`${SKILLS_CHAINE}/architecte/SKILL.md`, [
    "4. **Les règles qu'elle porte** : l'architecte écrit le fichier de chaque règle nouvelle, `candidate`, à cette étape, après le grilling et avant tout code, d'après le gabarit `docs/agents/gabarits/regle.md` et la fiche d'écriture `.claude/rules/anchorpost.md` du projet",
    "(dans `skills`, `skills/chaine/tickets/references/gabarits/regle.md` et `skills/chaine/anchorpost/references/rules/anchorpost.md`)",
    "Puis il lance lui-même le skill `criticite` sur chaque règle, et retient ou corrige chaque proposition. Un sous-agent qui rédige une règle ne lance pas ce skill : l'architecte le lance, le fichier écrit.",
  ]);
  for (const f of [GABARIT_REGLE, FICHE_ANCHORPOST]) assert.ok(existsSync(join(RACINE, f)), `${f} : le fichier que cite l'architecte existe`);
  exiger(`${SKILLS_CHAINE}/chantier/SKILL.md`, [
    "Une règle qu'elle porte et que le registre n'a pas encore, le conducteur en écrit le fichier, `candidate`, dans la même PR de cadrage, avant tout code (gabarit `docs/agents/gabarits/regle.md`, fiche d'écriture `.claude/rules/anchorpost.md`), puis lance lui-même le skill `criticite` sur chaque règle, et retient ou corrige chaque proposition.",
  ]);
  exiger(`${SKILLS_CHAINE}/tickets/SKILL.md`, [
    "une règle naît `candidate`, écrite par la session qui écrit la spec qui la porte, à l'étape de la spec, et cette session lance sur elle le skill `criticite` avant tout code ; seul un humain écrit `validated`.",
  ]);
  exiger(`${SKILLS_CHAINE}/tickets/references/agents/issue-tracker.md`, [
    "- Une règle → `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, `candidate`, écrite par la session qui écrit la spec qui la porte, à l'étape de la spec, après le grilling (l'architecte d'un programme, le conducteur au cadrage d'un chantier, ou la session qui la publie). Cette session lance le skill `criticite` sur chaque règle, avant tout code, puis retient ou corrige chaque proposition.",
  ]);
  exiger(FICHE_ANCHORPOST, [
    "**Un agent n'écrit jamais `validated`** ; il crée une règle `candidate` et le dit. Le fichier d'une règle est écrit par la session qui écrit la spec qui la porte, à l'étape de la spec, avant tout code.",
    "**La criticité est fixée par un agent** : cette session lance le skill `maj-skills:criticite`, dont un sous-agent en contexte vierge rend le niveau et sa raison, les cas attendus et les dix familles ; elle retient ou corrige la proposition, sans jamais baisser le niveau.",
    "Un agent peut monter une criticité, jamais la baisser, et ne réécrit jamais celle qu'une personne a fixée ; une personne la change par une PR.",
    "`criticality`, `cases` et `notApplicableFamilies` s'écrivent à partir de la CLI Anchorpost 2.0.0.",
  ]);
});

test("le gabarit de règle porte `criticality`, `cases` et `notApplicableFamilies` en commentaire, à partir de la CLI Anchorpost 2.0.0", () => {
  const entete = readFileSync(join(RACINE, GABARIT_REGLE), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
  for (const cle of ["criticality", "cases", "notApplicableFamilies"]) {
    const commentees = lignes(entete).filter((l) => new RegExp(`^#\\s*${cle}:`).test(l));
    assert.equal(commentees.length, 1, `${GABARIT_REGLE} : une ligne « # ${cle}: »`);
    assert.match(commentees[0], /à partir de la CLI Anchorpost 2\.0\.0/, `${GABARIT_REGLE} : ${cle} dit sa version`);
    assert.deepEqual(lignes(entete).filter((l) => new RegExp(`^\\s*${cle}:`).test(l)), [], `${GABARIT_REGLE} : ${cle} reste en commentaire`);
  }
  exiger(GABARIT_REGLE, [
    "# criticality: { level: low | medium | high, by: agent | Prénom Nom, reason: … }",
    "fixée par le skill `criticite` (by: agent) à l'écriture de la règle, avant tout code ; reason obligatoire pour low ; un agent ne la baisse jamais",
    "kind: nominal | edge | invalid | refusal, scope: business | technical",
  ]);
  const absentes = FAMILLES.filter((f) => !entete.includes(f));
  assert.deepEqual(absentes, [], `${GABARIT_REGLE} : familles absentes : ${absentes.join(", ")}`);
});

test("chaque skill du plugin a sa ligne au README et passe le gate references-agent d'un projet qui le cite", () => {
  assert.ok(declares.includes(`./${CRITICITE}`), "le skill de criticité est déclaré dans .claude-plugin/plugin.json");
  const readme = readFileSync(join(RACINE, "README.md"), "utf8");
  const integrees = JSON.parse(readFileSync(join(RACINE, "skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json"), "utf8"))["skills-plugins"];
  const sansLigne = declares.filter((s) => !readme.includes(`[\`${s.split("/").pop()}\`](${s.slice(2)}/SKILL.md)`));
  assert.deepEqual(sansLigne, [], `README.md : skills sans ligne au tableau : ${sansLigne.join(", ")}`);
  const refuses = declares.filter((s) => !integrees.includes(`maj-skills:${s.split("/").pop()}`));
  assert.deepEqual(refuses, [], `references-agent-integrees.json : skills que le gate d'un projet refuserait : ${refuses.join(", ")}`);
  assert.ok(readme.includes("    criticite/\n"), "README.md : le skill de criticité dans l'arbre du dépôt");
});
````

Le jouer sur `origin/main` : `node --test scripts/depot.test.mjs` donne **quatre** `not ok` sur 37 :

- « le skill de criticité : avant tout code, un sous-agent en contexte vierge ; jamais « basse » sans raison ; le niveau supérieur dans le doute ; un agent ne baisse jamais » (`ENOENT` : `skills/chaine/criticite/SKILL.md`) ;
- « qui rédige une règle, et quand : l'architecte, le conducteur, le skill tickets, le tracker et la fiche d'Anchorpost le disent, et l'architecte cite le gabarit et la fiche » (phrases absentes de `architecte/SKILL.md`) ;
- « le gabarit de règle porte `criticality`, `cases` et `notApplicableFamilies` en commentaire, à partir de la CLI Anchorpost 2.0.0 » (aucune ligne « # criticality: ») ;
- « chaque skill du plugin a sa ligne au README et passe le gate references-agent d'un projet qui le cite » (le skill n'est pas déclaré ; joué sans cette première assertion, il rougit aussi sur `maj-skills:anchorpost`, absent de la liste du gate).

« lecteur à plat : entrées piégées » est vert sur `origin/main` : il éprouve le lecteur.

### 1. Le skill, trois fichiers nouveaux, mot pour mot

#### N1 — `skills/chaine/criticite/SKILL.md`

````markdown
---
name: criticite
description: Criticité d'une règle métier, fixée au moment où la règle s'écrit, avant tout code, par un sous-agent en contexte vierge qui ne reçoit que l'énoncé de la règle, la spec qui la porte et les définitions du standard (trois niveaux, quatre genres de cas, dix familles) — il rend le niveau et sa raison, les cas attendus et une réponse à chacune des dix familles ; jamais « basse » sans raison écrite, le niveau supérieur dans le doute, un agent ne baisse jamais un niveau. La session qui écrit la règle retient ou corrige la proposition et l'écrit dans le fichier de la règle si la CLI Anchorpost du projet porte le pivot 3 (2.0.0), sinon dans la PR. À utiliser sur chaque règle créée, à l'étape de la spec, après le grilling, et pour classer une règle « à classer ».
argument-hint: '<RULE_…> [<RULE_…>…]'
---

# Criticité d'une règle

La criticité d'une règle dit ce qu'elle doit prouver. Décision du produit : « La criticité est fixée par un agent, plus par l'humain. Un skill de criticité, lancé dans un sous-agent en contexte vierge au moment où la règle s'écrit, avant tout code, fixe le niveau et sa raison, écrit les cas attendus et répond aux dix familles. L'humain ne valide plus règle par règle : il revoit les niveaux dans Anchorpost et corrige par une PR. » Ses deux parades : « le skill ne rend jamais « basse » sans une raison écrite dans la règle ; dans le doute, il rend le niveau supérieur » ; « l'index dit qui a fixé chaque criticité, un agent ou une personne ». Ce skill est le premier geste ; l'index et Anchorpost font le second.

## Quand

- **À l'écriture d'une règle, avant tout code.** La session qui écrit la spec qui porte la règle écrit son fichier, `candidate`, à l'étape de la spec, après le grilling : l'architecte d'un programme, le conducteur au cadrage d'un chantier, ou toute session qui publie une règle (skill `tickets`). Elle lance ce skill sur chaque règle qu'elle crée, avant de livrer la PR qui la porte. Une session qui code un ticket ne le lance pas : sa règle est déjà écrite.
- **Sur une règle « à classer »** (aucune criticité) : de même, par la session qui reprend la règle.
- **Sur une règle déjà classée** : étape 5.
- **Le sous-agent est lancé par la session elle-même** : un sous-agent ne lance pas de sous-agent. Une session qui fait rédiger la règle par un sous-agent lance ce skill une fois le fichier écrit.

## Étape 1 — Ce que la CLI du projet laisse écrire

Tant que le projet n'a pas la CLI Anchorpost qui porte le pivot 3 (2.0.0), le schéma strict des règles refuse `criticality` sous sa forme `{ level, by, reason }`, `cases` et `notApplicableFamilies`. La session le vérifie avant d'écrire, depuis la racine du projet :

```bash
node -e 'const f=require("fs"),p="node_modules/@maj-agency/anchorpost/package.json";console.log(f.existsSync(p)?JSON.parse(f.readFileSync(p,"utf8")).version:"absente")'
node -e 'const f=require("fs"),p="anchorpost/anchorpost.json";console.log(f.existsSync(p)?JSON.parse(f.readFileSync(p,"utf8")).schema:"absent")'
```

Les clés s'écrivent si la première commande rend une version de majeure 2 ou plus (2.0.0, 2.1.3), ou si la seconde rend `3` ou plus : l'index commis est écrit par la CLI du projet, et un index `"schema": "3"` dit qu'elle porte le pivot 3. Une version `0.0.0` est celle d'une CLI de l'espace de travail (Anchorpost lui-même) : seul l'index fait foi. Sinon (version 1.x, `absente`, index `"2"` ou `absent`), **rien ne s'écrit dans le fichier de la règle** : la proposition va dans la PR (étape 4).

## Étape 2 — Ce que reçoit le sous-agent

- **L'énoncé de la règle** : son `title` et le texte qui suit l'en-tête, sans l'en-tête (ni `validation`, ni `decisions`, ni `sources`, ni une criticité déjà écrite).
- **La spec qui la porte** : chaque spec qui la déclare en `Règles:` (dans sa tête ou dans l'un de ses tickets), en entier ; à l'écriture, la spec en cours, telle qu'elle est sur le disque ; aucune : « aucune spec ».
- **Les définitions** : les trois niveaux, les quatre genres de cas et les dix familles, écrits dans le prompt.

Il ne reçoit **jamais** l'intention de l'auteur, l'historique de la session, la description de la PR, le niveau ou les cas déjà écrits, la criticité d'une feature, le code ni les tests.

## Étape 3 — Lancer le sous-agent

Outil **Agent**, un sous-agent neuf par règle, sans outil d'écriture : il ne lit rien du dépôt, tout ce qu'il juge est dans son prompt. Prompt exact : [`references/prompt.md`](references/prompt.md). Remplacer `{{PROJET}}` par le nom du projet, `<règle>` par l'énoncé et `<spec>` par la ou les specs, sans rien y ajouter.

## Étape 4 — Lire, retenir ou corriger, écrire

1. **Lire.** La sortie est un seul bloc YAML au format du prompt, puis la ligne « Questions : ». Hors format, ou `low` sans `reason`, ou une famille sans réponse : un second sous-agent neuf, une fois. Encore hors format : rien ne s'écrit, la règle reste « à classer », et la PR le dit. **Jamais « basse » sans une raison écrite.**
2. **Retenir ou corriger.** La session relit chaque cas et chaque famille contre l'énoncé ; elle corrige un titre, un genre, une portée, ajoute un cas, monte le niveau et réécrit la raison. Elle ne baisse jamais le niveau rendu : **un agent peut monter un niveau, jamais le baisser** ; baisser est le geste d'une personne, par une PR. Les questions du sous-agent vont dans la PR, ou à qui tranche la règle.
3. **La feature.** Une règle déclarée par une feature (`Règles:` de sa spec ou d'un de ses tickets) reçoit la criticité fixée sur cette feature (`featureCriticality` du manifeste), et prend la plus haute des deux. Une règle basse ne peut donc pas vivre dans une feature moyenne : quand la session voit une règle proposée sous le niveau d'une feature qui la déclare, elle l'écrit dans la PR (« la règle prendra le niveau de la feature ; pour rester basse, elle sort du `Règles:` de cette feature »).
4. **Écrire**, si l'étape 1 le permet, dans l'en-tête du fichier de la règle (formes de la spec du standard, `SPEC_ALL_ANC-5` d'Anchorpost) :

   ```yaml
   criticality:
     level: medium # low | medium | high
     by: agent
     reason: "Une erreur fausse ce que la MOA lit sur la page d'une règle."
   cases:
     - id: nominal
       title: Un membre invité par lien magique rejoint l'espace
       kind: nominal # nominal | edge | invalid | refusal
       scope: business # business | technical
     - id: lien-expire
       title: Un lien expiré est refusé
       kind: refusal
       scope: business
       family: time # facultatif : l'une des dix familles
   notApplicableFamilies:
     - { family: volume, reason: "Un espace n'a qu'une poignée d'invitations en cours." }
   ```

   Puis `pnpm anchorpost:index` et `pnpm anchorpost:check`. Sinon, la section `## Criticité proposée` du corps de la PR porte ce bloc, règle par règle, et rien n'est écrit dans le fichier.

## Étape 5 — Relancé sur une règle déjà classée

Le sous-agent ne voit pas le niveau déjà écrit (étape 2) ; la session compare après.

- **Une criticité fixée par une personne** (`by` qui n'est pas `agent`, ou la forme ancienne `criticality: high`, sans `by`) : le skill ne réécrit jamais une criticité fixée par une personne. Tout écart, plus haut ou plus bas, se signale dans la PR pour qu'une personne décide.
- **Une criticité fixée par un agent** : un niveau rendu plus haut s'écrit, avec sa raison ; égal, rien ne change ; s'il juge le niveau trop haut, il ne change rien et le signale dans la PR pour qu'une personne décide.
- **Les cas et les familles déjà écrits** ne se retirent ni ne se réécrivent : un cas nouveau retenu s'ajoute ; un cas métier ajouté à une règle `validated` attend une validation nouvelle, écrite par un humain.

## Ne jamais

- Donner au sous-agent l'intention de l'auteur, l'historique de la session, le niveau déjà écrit, le code ou les tests.
- Écrire « basse » sans raison, ou trancher un doute vers le bas.
- Baisser un niveau, ou réécrire une criticité fixée par une personne.
- Écrire `criticality`, `cases` ou `notApplicableFamilies` dans un projet dont la CLI ne porte pas le pivot 3.
- Écrire `validated` : seul un humain l'écrit.
- Lancer ce skill depuis une session qui code un ticket, ou dans un sous-agent.
````

#### N2 — `skills/chaine/criticite/references/prompt.md`

````text
Tu fixes la criticité d'une règle métier du projet {{PROJET}}, au moment où elle s'écrit, avant
tout code. Tu ne sais rien de la session qui l'a écrite ni de son intention : tu ne reçois que
l'énoncé de la règle, la spec qui la porte et les définitions ci-dessous. Tu ne lis rien d'autre :
ni le dépôt, ni le code, ni les tests, ni l'historique git ; tu ne lances aucune commande.

Ta seule mission : fixer le niveau de la règle et sa raison, écrire ses cas attendus, et répondre à
chacune des dix familles de cas limites, selon les définitions ci-dessous et elles seules.

Les trois niveaux. Juge ce que coûterait une erreur dans ce que la règle exige, pas la difficulté
du code :
- high : une erreur casse ou bloque un usage essentiel, coûte de l'argent, ouvre un accès, expose
  ou perd une donnée, ou ne se rattrape pas. On ne peut pas attendre le correctif ;
- medium : une erreur casse ou bloque un usage courant, fausse ce que la MOA lit, ou laisse entrer
  des données erronées. Les gens patientent, on corrige ;
- low : une erreur gêne, sans conséquence durable.
Dans le doute entre deux niveaux, rends le niveau supérieur. Ne rends jamais low sans une raison
écrite qui dit pourquoi une erreur ne laisse aucune conséquence durable. Quel que soit le niveau,
la raison dit en une ou deux phrases ce qu'une erreur coûterait, dans les mots de la règle.

Les quatre genres d'un cas (kind) :
- nominal : la situation ordinaire que la règle traite ;
- edge : une situation valide, au bord de la règle, où elle doit encore donner la bonne réponse ;
- invalid : la donnée est mal formée ou incomplète, l'application ne peut pas répondre et la
  rejette ;
- refusal : la donnée est correcte, c'est la règle qui interdit.
Pour départager : un cas limite reçoit une réponse correcte ; une entrée invalide n'en reçoit pas,
parce que la donnée ne se lit pas ; un refus en reçoit une, et c'est « non ».

La portée d'un cas (scope) : business quand le cas dit ce que le métier exige, et qu'une personne
du métier le reconnaîtrait ; technical quand il ne tient qu'à la façon de construire (format
d'échange, reprise après une panne, accès concurrent) et que le métier n'en dit rien.

Les dix familles de cas limites (family) : limits (les limites), empty (le vide ou l'absent),
invalid-input (l'entrée invalide), duplicate (le doublon et le rejeu), ordering (l'ordre et la
concurrence), time (le temps), permissions (les droits et le périmètre), rare-state (l'état rare),
volume (le volume), failure (la défaillance et la reprise).

Ce que tu écris :
- au moins un cas nominal ; pour une règle medium ou high, les cas limites, les entrées invalides
  et les refus que l'énoncé ou la spec impliquent ;
- un cas : id (minuscules, chiffres et tirets, unique dans la règle), title (une phrase : ce que
  fait le logiciel dans cette situation), kind, scope, et family s'il en porte une ;
- chacune des dix familles reçoit une réponse : un cas au moins qui la porte (champ family ; un cas
  de genre invalid répond d'office à invalid-input), ou une entrée de notApplicableFamilies avec sa
  raison. Aucune famille sans réponse ; aucune famille à la fois portée par un cas et sans objet ;
- tu n'inventes aucune exigence que l'énoncé et la spec ne portent pas : ce qu'ils ne tranchent
  pas va dans la ligne « Questions ».

Interdits :
- tout conseil sur le code, les tests, le découpage ou la rédaction de la règle ;
- toute clé hors du format ci-dessous ;
- by autre que agent.

Format de sortie, et rien d'autre : un seul bloc yaml, puis une ligne.

```yaml
criticality:
  level: <low | medium | high>
  by: agent
  reason: "<la raison>"
cases:
  - id: <id>
    title: "<titre>"
    kind: <nominal | edge | invalid | refusal>
    scope: <business | technical>
    family: <famille, seulement si le cas en porte une>
notApplicableFamilies:
  - family: <famille>
    reason: "<pourquoi elle est sans objet pour cette règle>"
```

Puis une dernière ligne : « Questions : » suivi de ce que l'énoncé et la spec ne tranchent pas, ou
« aucune ».

Pas d'introduction, pas de résumé.

Règle :

<règle>

Spec qui la porte :

<spec>
````

#### N3 — `skills/chaine/criticite/references/CONTENU.md`

````markdown
# Ce que contient le skill criticite, et pourquoi

## `SKILL.md`

Le geste de la session qui écrit une règle : vérifier ce que la CLI Anchorpost du projet laisse écrire, préparer ce que reçoit le sous-agent, le lancer, lire sa proposition, la retenir ou la corriger, l'écrire. Décision du produit, citée en tête : la criticité est fixée par un agent, en contexte vierge, au moment où la règle s'écrit et avant tout code ; l'humain revoit les niveaux dans Anchorpost et corrige par une PR. Les garde-fous (jamais « basse » sans raison, le niveau supérieur dans le doute, un agent ne baisse jamais, une criticité fixée par une personne ne se réécrit pas) sont les parades de cette décision. Aucun script : le skill ne pose rien dans le projet.

## `references/prompt.md`

Le prompt exact du sous-agent, à liste fermée, sur le modèle de la revue adversariale. Il porte les définitions du standard (les trois niveaux, les quatre genres de cas, les dix familles, tels que la spec de la preuve suffisante d'Anchorpost les fixe) et ne reçoit que l'énoncé de la règle et la spec qui la porte : ni l'intention de l'auteur, ni l'historique de la session, ni le niveau déjà écrit. Le format de sortie est l'en-tête à écrire, pour que la session le relise sans le récrire.
````

### 2. Les remplacements, mot pour mot

Chaque « Ancien » apparaît **une seule fois** à `c17f88b`. Si une PR fusionnée depuis l'a modifié, la session le retrouve par son sens et applique le « Nouveau » à la même place.

#### R1 — `skills/chaine/architecte/SKILL.md:54`

Ancien :

````text
3. **La spec** de chaque chantier : gabarit `docs/agents/gabarits/spec.spec.md`, termes du glossaire, règles métier citées par leur identifiant, jamais formulées. Elle est **validée** quand le produit l'a dit : la date et la décision vont dans la carte. Le chantier passe alors au conducteur (§ 4).
````

Nouveau :

````text
3. **La spec** de chaque chantier : gabarit `docs/agents/gabarits/spec.spec.md`, termes du glossaire, règles métier citées par leur identifiant, jamais formulées. Elle est **validée** quand le produit l'a dit : la date et la décision vont dans la carte. Le chantier passe alors au conducteur (§ 4).
4. **Les règles qu'elle porte** : l'architecte écrit le fichier de chaque règle nouvelle, `candidate`, à cette étape, après le grilling et avant tout code, d'après le gabarit `docs/agents/gabarits/regle.md` et la fiche d'écriture `.claude/rules/anchorpost.md` du projet (dans `skills`, `skills/chaine/tickets/references/gabarits/regle.md` et `skills/chaine/anchorpost/references/rules/anchorpost.md`). Puis il lance lui-même le skill `criticite` sur chaque règle, et retient ou corrige chaque proposition. Un sous-agent qui rédige une règle ne lance pas ce skill : l'architecte le lance, le fichier écrit.
````

#### R2 — `skills/chaine/chantier/SKILL.md:60`

Ancien :

````text
une spec n'emploie que des termes du glossaire, et cite les règles métier du registre sans les formuler. Dans un programme, la spec validée est donnée : ne pas la réécrire, relever ses trous à l'architecte.
````

Nouveau :

````text
une spec n'emploie que des termes du glossaire, et cite les règles métier du registre sans les formuler. Une règle qu'elle porte et que le registre n'a pas encore, le conducteur en écrit le fichier, `candidate`, dans la même PR de cadrage, avant tout code (gabarit `docs/agents/gabarits/regle.md`, fiche d'écriture `.claude/rules/anchorpost.md`), puis lance lui-même le skill `criticite` sur chaque règle, et retient ou corrige chaque proposition. Dans un programme, la spec validée est donnée : ne pas la réécrire, relever ses trous à l'architecte.
````

#### R3 — `skills/chaine/tickets/SKILL.md:62`

Ancien :

````text
`Type:` dès la création ; une règle naît `candidate`, seul un humain écrit `validated`.
````

Nouveau :

````text
`Type:` dès la création ; une règle naît `candidate`, écrite par la session qui écrit la spec qui la porte, à l'étape de la spec, et cette session lance sur elle le skill `criticite` avant tout code ; seul un humain écrit `validated`.
````

#### R4 — `skills/chaine/tickets/references/agents/issue-tracker.md:48`

Ancien :

````text
- Une règle → `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, `candidate`.
````

Nouveau :

````text
- Une règle → `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`, `candidate`, écrite par la session qui écrit la spec qui la porte, à l'étape de la spec, après le grilling (l'architecte d'un programme, le conducteur au cadrage d'un chantier, ou la session qui la publie). Cette session lance le skill `criticite` sur chaque règle, avant tout code, puis retient ou corrige chaque proposition.
````

#### R5 — `skills/chaine/anchorpost/references/rules/anchorpost.md:27`

Ancien :

````text
- **Qui écrit quoi.** `validation` (`candidate`, `validated`, `rejected`, `obsolete`, avec `date`, `by`, `reason`) est écrite par un humain. **Un agent n'écrit jamais `validated`** ; il crée une règle `candidate` et le dit.
````

Nouveau :

````text
- **Qui écrit quoi.** `validation` (`candidate`, `validated`, `rejected`, `obsolete`, avec `date`, `by`, `reason`) est écrite par un humain. **Un agent n'écrit jamais `validated`** ; il crée une règle `candidate` et le dit. Le fichier d'une règle est écrit par la session qui écrit la spec qui la porte, à l'étape de la spec, avant tout code. **La criticité est fixée par un agent** : cette session lance le skill `maj-skills:criticite`, dont un sous-agent en contexte vierge rend le niveau et sa raison, les cas attendus et les dix familles ; elle retient ou corrige la proposition, sans jamais baisser le niveau. Un agent peut monter une criticité, jamais la baisser, et ne réécrit jamais celle qu'une personne a fixée ; une personne la change par une PR. `criticality`, `cases` et `notApplicableFamilies` s'écrivent à partir de la CLI Anchorpost 2.0.0.
````

#### R6 — `skills/chaine/tickets/references/gabarits/regle.md:20`

Ancien :

````text
# code: [ apps/api/src/…/fichier.ts ]   fichiers de code qui réalisent la règle, chemins depuis la racine ; périmètre de la mutation par règle (`socle-tests`)
````

Nouveau :

````text
# code: [ apps/api/src/…/fichier.ts ]   fichiers de code qui réalisent la règle, chemins depuis la racine ; périmètre de la mutation par règle (`socle-tests`)
# criticality: { level: low | medium | high, by: agent | Prénom Nom, reason: … }   à partir de la CLI Anchorpost 2.0.0 ; fixée par le skill `criticite` (by: agent) à l'écriture de la règle, avant tout code ; reason obligatoire pour low ; un agent ne la baisse jamais
# cases:   à partir de la CLI Anchorpost 2.0.0 ; les cas attendus, rendus par le skill `criticite`
#   - { id: {{id-du-cas}}, title: …, kind: nominal | edge | invalid | refusal, scope: business | technical, family: … }   family facultatif
# notApplicableFamilies:   à partir de la CLI Anchorpost 2.0.0 ; chaque famille sans cas, avec sa raison (obligatoire dès medium)
#   - { family: limits | empty | invalid-input | duplicate | ordering | time | permissions | rare-state | volume | failure, reason: … }
````

#### R7 — `.claude-plugin/plugin.json:37`

Ancien :

````json
    "./skills/chaine/anchorpost",
````

Nouveau :

````json
    "./skills/chaine/anchorpost",
    "./skills/chaine/criticite",
````

#### R8 — `.claude-plugin/plugin.json:3`

Ancien :

````json
  "version": "7.12.3",
````

Nouveau :

````json
  "version": "7.13.0",
````

#### R9 — `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json:7`

Ancien :

````json
"maj-skills:socle-chaine-de-production", "maj-skills:tickets", "maj-skills:revue-adversariale",
````

Nouveau :

````json
"maj-skills:socle-chaine-de-production", "maj-skills:tickets", "maj-skills:anchorpost", "maj-skills:criticite", "maj-skills:revue-adversariale",
````

#### R10 — `README.md:82`

Ancien :

````text
| [`revue-adversariale`](skills/chaine/revue-adversariale/SKILL.md)                 |
````

Nouveau :

````text
| [`criticite`](skills/chaine/criticite/SKILL.md)                                   | La criticité d'une règle à son écriture, avant tout code : un sous-agent vierge rend le niveau et sa raison, les cas attendus et les dix familles ; jamais « basse » sans raison, le niveau supérieur dans le doute, un agent ne baisse jamais un niveau |
| [`revue-adversariale`](skills/chaine/revue-adversariale/SKILL.md)                 |
````

#### R11 — `README.md:90`

Ancien :

````text
`/maj-skills:tickets` et `/maj-skills:revue-adversariale` au quotidien dans une session de travail ;
````

Nouveau :

````text
`/maj-skills:tickets` et `/maj-skills:revue-adversariale` au quotidien dans une session de travail ; `/maj-skills:criticite` sur chaque règle, par la session qui écrit la spec qui la porte ;
````

#### R12 — `README.md:153`

Ancien :

````text
    revue-adversariale/
      SKILL.md         poser, quand, le diff, les chemins sensibles, le sous-agent, trier, corriger
````

Nouveau :

````text
    criticite/
      SKILL.md         quand, ce que la CLI laisse écrire, le sous-agent, lire, retenir ou corriger, relancer
      references/      le prompt exact du sous-agent
    revue-adversariale/
      SKILL.md         poser, quand, le diff, les chemins sensibles, le sous-agent, trier, corriger
````

#### R13 — `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md:44`

Ancien :

````text
`fusionner`, `architecte`, `chantier`, `recette-humaine` (plugin ≥ 3.2 ; `architecte` ≥ 5.0)
````

Nouveau :

````text
`fusionner`, `architecte`, `chantier`, `recette-humaine`, `criticite` (plugin ≥ 3.2 ; `architecte` ≥ 5.0 ; `criticite` ≥ 7.13)
````

### 3. La version

R8 : 7.12.3 → 7.13.0 si rien n'a bougé ; règle de repli : décision 12.

## Surfaces

| Surface | Preuve |
| --- | --- |
| le skill dit quand il se lance (à l'écriture, avant tout code, par la session qui écrit la spec ; jamais par une session qui code ; lancé par la session elle-même, jamais dans un sous-agent), ce que le sous-agent ne reçoit jamais, comment la CLI du projet se lit, ses garde-fous (jamais « basse » sans raison, le doute vers le haut, un agent ne baisse jamais, la feature, la criticité d'une personne jamais réécrite, le niveau jugé trop haut signalé) | `scripts/depot.test.mjs` « le skill de criticité : avant tout code, un sous-agent en contexte vierge ; jamais « basse » sans raison ; le niveau supérieur dans le doute ; un agent ne baisse jamais » |
| le prompt du sous-agent : contexte vierge, rien du dépôt, avant tout code, les trois niveaux, les quatre genres, les dix familles, chaque famille répondue, `by: agent`, les deux emplacements `<règle>` et `<spec>` | même test |
| qui rédige une règle et à quelle étape : `architecte`, `chantier`, `tickets`, `issue-tracker.md`, la fiche `anchorpost.md` ; l'architecte cite le gabarit et la fiche, qui existent | `scripts/depot.test.mjs` « qui rédige une règle, et quand : l'architecte, le conducteur, le skill tickets, le tracker et la fiche d'Anchorpost le disent, et l'architecte cite le gabarit et la fiche » |
| le gabarit porte les trois clés, une ligne chacune, en commentaire, avec la version de la CLI, les vocabulaires et les dix familles | `scripts/depot.test.mjs` « le gabarit de règle porte `criticality`, `cases` et `notApplicableFamilies` en commentaire, à partir de la CLI Anchorpost 2.0.0 » |
| le skill déclaré ; chaque skill de `plugin.json` au tableau du README et dans la liste du gate `references-agent` ; le skill dans l'arbre du README | `scripts/depot.test.mjs` « chaque skill du plugin a sa ligne au README et passe le gate references-agent d'un projet qui le cite », et les tests existants « chaque skill du dépôt est déclaré dans le plugin », « le nom d'un skill est celui de son dossier », « aucun SKILL.md ne dépasse 200 lignes » |
| le lecteur à plat | `scripts/depot.test.mjs` « lecteur à plat : entrées piégées » |
| l'invocation du README (R11), le `CLAUDE.md` posé par `socle-monorepo` (R13), `CONTENU.md` du skill | lecture (pas de test) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` et la ligne du skill |

## Vérification

Joué le 2026-11-17 dans un `git worktree` jetable de `c17f88b` (`TMPDIR` sous un dossier jetable), §§ 0 à 3 appliqués mot pour mot, puis le worktree retiré :

- Sur `c17f88b` sans rien : `pnpm install --frozen-lockfile && pnpm test`, **665 sur 665**.
- Le banc du § 0 sur le texte de `c17f88b` : quatre `not ok` sur 37, ceux nommés au § 0.
- Banc, skill, remplacements et version (7.13.0) : `node --test scripts/depot.test.mjs` vert, 37 tests ; la suite entière : **670 sur 670** (665 + 5).
- **Mutations**, chacune jouée seule sur le texte corrigé, puis le texte remis : chacune fait rougir au moins un test de `scripts/depot.test.mjs`. Dans `SKILL.md` : la citation sans « dans le doute, il rend le niveau supérieur » ; « Jamais « basse » sans une raison écrite » retiré ; « un agent peut monter ou baisser un niveau » ; « avant tout code » retiré de « Quand » ; l'intention de l'auteur retirée de ce que le sous-agent ne reçoit pas ; « un sous-agent ne lance pas de sous-agent » retiré ; « le skill réécrit une criticité fixée par une personne » ; « s'il juge le niveau trop haut, il le baisse » ; la règle basse dans une feature moyenne retirée ; l'index en `2` accepté ; la majeure 1 acceptée ; la phrase de `0.0.0` retirée ; la session qui code retirée ; « toute session » à la place des trois rédacteurs ; le fichier porté à 201 lignes. Dans `prompt.md` : le doute vers le niveau inférieur ; `low` « avec ou sans une raison » ; « Tu lis aussi : le dépôt » ; la famille `volume` retirée ; « ni de son intention » retiré ; « avant tout code » retiré ; « by autre que agent » retiré ; la définition de `high` amputée. Dans `architecte/SKILL.md` : le gabarit non cité ; la fiche non citée ; le point 4 dénuméroté ; « un sous-agent lance le skill ». Dans `chantier/SKILL.md`, `tickets/SKILL.md`, `issue-tracker.md` : la phrase retirée ; « avant tout code » retiré ; les trois rédacteurs retirés. Dans la fiche : « et la baisser » ; « fixée par une personne » ; la version de la CLI retirée. Dans le gabarit : `criticality` décommentée ; la version retirée de `cases` ; « un agent ne la baisse jamais » retiré ; la famille `rare-state` retirée. Ailleurs : le skill retiré de `plugin.json` ; `maj-skills:criticite`, puis `maj-skills:anchorpost`, retirés de la liste du gate ; la ligne du README ; l'arbre du README. **Quarante-deux sur quarante-deux.**
- `git diff origin/main --stat` : les quatorze fichiers de « Fichiers chauds », rien d'autre ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` : **0**.

Pour la session :

1. Le § 0 : quatre rouges. Les §§ 1 à 3, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 5**.
2. `git diff origin/main --stat` ne montre que les quatorze fichiers de « Fichiers chauds » ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0 ; `wc -l skills/chaine/*/SKILL.md` : aucun au-dessus de 200.
3. Revue de ticket (ses trois axes), sa section dans le corps de la PR. Pas de `/security-review` : aucun chemin sensible.
4. La PR vise `main`, hors brouillon, **sans `à-fusionner`** ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Le skill joué en vrai sur une règle** : le banc tient le texte, pas le jugement du sous-agent. La première application (`.26` d'Anchorpost, ci-dessous) dira si le format de sortie tient et si les niveaux rendus sont justes.
- **La lecture du champ `schema` par la CLI 2.0.0** : la spec fixe que le pivot 3 est « une nouvelle valeur de `schema` » (`A-20`) ; la CLI qui l'écrit n'est pas publiée. Si l'index 3 nomme sa version autrement, l'étape 1 du skill se corrige au ticket `K5`.

## Hors périmètre

- **`K1` à `K6`** de la carte du chantier : bloqués par la publication de la CLI 2.0.0 (pivot 3) ou par le schéma 3 — la copie de la spec dans `docs/issues/standard-documentation/` (`K1`, dont ce ticket fait la part du gabarit), la grille par criticité et le relais `preuves.mjs` de `socle-tests` (`K2`), le gate des tickets et la ligne `Prouve:` (`K3`), le critère `T3` de `revue-de-ticket` (`K4`), le skill `anchorpost` qui suit la CLI 2.0.0 et sa fiche sur l'écriture d'un cas et d'une étiquette de cas (`K5`), la mutation des règles (`K6`).
- **L'application aux règles existantes d'un projet** : un ticket du projet (dans Anchorpost, `SPEC_ALL_ANC-5.26` fait classer par ce skill les dix-sept règles validées sans criticité).
- **Le filtre dans Anchorpost** des criticités fixées par un agent : `SPEC_ALL_ANC-5.25`, dans Anchorpost.
- **L'arbre du README** : il ne liste ni `anchorpost` ni `revue-de-ticket` ; ce ticket n'y ajoute que `criticite`.

## Comments

- 2026-11-17 — Rédigé sur `c17f88b` (plugin 7.12.3, 665 tests) d'après `P-35` et `P-36` (amendement (2) de `SPEC_ALL_ANC-5`), `RULE_ALL_ANC-24`, `-26`, `-28` et les lignes `K7` et `K8` de la carte du chantier. Joué sur une copie jetable : quatre rouges sur `main`, 670 tests avec le ticket, quarante-deux mutations rouges. Choix du rédacteur, à confirmer : (1) le nom `criticite` ; (2) la CLI se lit par la version installée ou par le `schema` de l'index, et un projet sans Anchorpost n'écrit rien ; (3) la proposition sans CLI 2.0.0 va dans la PR, pas dans `extensions` ; (4) le sous-agent ne voit ni la criticité de la feature ni le niveau déjà écrit ; (5) la forme ancienne `criticality: high` vaut fixée par une personne ; (6) la session lance le skill elle-même, jamais un sous-agent ; (7) les dix familles répondues à tout niveau ; (8) `maj-skills:anchorpost` ajouté au gate, avec un test qui exige chaque skill du plugin dans sa liste et au README.
- 2026-11-17 — Architecte. Choix du rédacteur retenus : le nom `criticite`, chargé par l'outil Skill ; les clés ne s'écrivent que si la CLI du projet est en majeure 2 ou si son index est en `"3"`, sinon la proposition va dans la PR ; le sous-agent ne voit ni la criticité de la feature ni le niveau déjà écrit, la session compare après coup ; la forme ancienne `criticality: <niveau>` sans `by` vaut fixée par une personne ; la session ne baisse jamais le niveau rendu ; une sortie hors format se rejoue une fois, puis la règle reste « à classer » ; les dix familles reçoivent une réponse à tout niveau (le produit : le skill « répond aux dix familles », sans condition de niveau ; elles ne sont exigées par `check` qu'à partir de moyenne) ; `maj-skills:anchorpost` rejoint la liste du gate.
