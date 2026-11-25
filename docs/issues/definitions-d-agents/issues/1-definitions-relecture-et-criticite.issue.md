# Les deux définitions d'agents du plugin, et `relecture` et `criticite` les lancent par leur nom, avec le repli (8.4.0)

Status: ready-for-agent
Type: task
Modèle: opus — deux fichiers neufs dont le frontmatter doit être exact, un banc neuf, deux bancs existants qui figent des textes à réécrire sans les assouplir (`scripts/depot.test.mjs`, `scripts/relecture.test.mjs`), et un essai réel des définitions par `claude -p`, lu dans les transcripts des sous-agents ; les décisions sont prises dans la spec.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `agents/axe-de-relecture.md`, `agents/classeur-de-criticite.md`, `.claude-plugin/plugin.json`, `scripts/agents.test.mjs`, `skills/chaine/relecture/SKILL.md`, `skills/chaine/relecture/references/verdict.md`, `skills/chaine/relecture/references/cas-limites.md`, `skills/chaine/relecture/references/CONTENU.md`, `skills/chaine/criticite/SKILL.md`, `skills/chaine/criticite/references/CONTENU.md`, `scripts/depot.test.mjs`, `NOTES-DE-VERSION.md`, `README.md`, `graphify-out/`

Programme : [`../../../programmes/definitions-d-agents.programme.md`](../../../programmes/definitions-d-agents.programme.md). Spec : [`../definitions-d-agents.spec.md`](../definitions-d-agents.spec.md) (faits établis 1 à 6, décisions `A-1` à `A-10`). Rédigé sur l'option recommandée de `P-1` (contexte sans `CLAUDE.md`) ; si le produit répond non, `omitClaudeMd: true` sort des deux définitions et du banc, le reste du ticket tient.

## Le besoin

Les sous-agents de `relecture` (un par axe) et de `criticite` (un par règle) partent aujourd'hui de l'agent générique : tous les outils, le modèle de la session, et le `CLAUDE.md` et les fiches `.claude/rules/` de la session dans leur contexte (fait 5). La lecture seule et le « contexte vierge » ne tiennent que par le texte du prompt.

**Quand le ticket est fait :**

1. Le plugin livre deux définitions, `maj-skills:axe-de-relecture` (Read, Grep, Glob ; Opus ; sans consignes du projet) et `maj-skills:classeur-de-criticite` (aucun outil ; Opus ; sans consignes du projet), déclarées dans `.claude-plugin/plugin.json`.
2. `relecture` lance chaque axe par `maj-skills:axe-de-relecture`, et `criticite` son sous-agent par `maj-skills:classeur-de-criticite`. Les messages ne changent pas : ce sont toujours les prompts des skills, fabriqués comme aujourd'hui.
3. Une session dont l'instantané n'a pas les définitions (fait 6) relance le même message par l'agent générique, et le dit : une ligne du verdict pour `relecture`, une ligne de la section `## Criticité` pour `criticite`.
4. Un banc (`scripts/agents.test.mjs`) tient les définitions, leur liste et les skills qui les nomment.
5. Un essai réel montre, dans les transcripts, les outils et le modèle de chaque définition, et l'absence des consignes du projet dans leur contexte.
6. Le plugin passe en 8.4.0, avec sa note.

## Où

Tout est lu dans le dépôt le 2026-11-25, sur la branche `docs/definitions-d-agents-programme` (plugin 8.3.3).

- **`agents/`** : n'existe pas. Les deux fichiers sont neufs, à la racine du dépôt, qui est la racine du plugin (`source: "./"` de `.claude-plugin/marketplace.json`).
- **`.claude-plugin/plugin.json`** : `"version": "8.3.3"` (l. 3), le tableau `skills` (l. 27 à 47), pas de clé `agents`. La référence des plugins (`https://code.claude.com/docs/en/plugins-reference`, lue le 2026-11-25) dit : `agents` prend « Path, or array of paths », « Agent `.md` files. Directories aren't accepted. Replaces the default `agents/` scan », chaque chemin commence par `./`, existe et reste dans la racine du plugin ; exemple : `"agents": ["./custom-agents/reviewer.md", "./custom-agents/tester.md"]`. Un chemin qui nomme un fichier du dossier par défaut (`./agents/…`) ne donne pas l'avertissement « Default agents/ folder is ignored ».
- **`package.json`** : `"test": "node --test 'scripts/*.test.mjs' …"` (l. 7) : `scripts/agents.test.mjs` entre dans le premier motif, rien à y ajouter.
- **`skills/chaine/relecture/SKILL.md`**, étape 6 (l. 106 à 120) :
  - l. 110 : « Outil **Agent** : un sous-agent neuf par axe, en lecture seule, tous lancés dans le même tour, sans l'historique de la session. » Le nom de l'agent et la phrase du repli s'écrivent ici ;
  - l. 120 : « Sortie 1 (…) ou sortie hors du format du prompt : un second sous-agent neuf, une fois. Encore, ou l'outil en échec : l'axe est « non exécuté », jamais « sans objet ». » Le second sous-agent se lance aussi par le nom.
- **`skills/chaine/relecture/references/verdict.md`** : l'en-tête (l. 6 à 12) est lu par `verdict.mjs` et ne prend aucune ligne (l. 49) ; le corps (l. 14 à 37, après la ligne vide) n'est pas lu par la machine (l. 3). La ligne du repli va dans le corps, après « Pour lever un « non exécuté » » (l. 24), avec sa règle sous « Remplir le corps » (l. 53 à 62) et dans l'exemple (l. 66 à 100, après l. 85).
- **`skills/chaine/relecture/references/cas-limites.md`** : l. 6 (l'échec d'un outil de la session) et la table de l'étape 6 (l. 73). Le repli y prend sa ligne : ce n'est ni un échec de l'outil ni un « non exécuté ».
- **`skills/chaine/relecture/references/CONTENU.md`** : § `SKILL.md` (l. 7) et § « Les prompts » (l. 17) : dire que les axes partent de la définition, et pourquoi la garde des consignes reste.
- **`skills/chaine/relecture/scripts/gestes.sh`** : `SANS_CONSIGNES` (l. 61), `consignes_autour` (l. 120, appelée l. 152) : **inchangés** (`A-7`).
- **`skills/chaine/criticite/SKILL.md`** : étape 3 (l. 48 à 50), « Outil **Agent**, un sous-agent neuf par règle. Son prompt est la sortie du script, entière, et rien d'autre. Le prompt lui dit de n'utiliser aucun outil : tout ce qu'il lui faut est dans son message. » ; étape 4, point 1 (l. 54, le second sous-agent neuf) et point 2 (l. 55, la section `## Criticité`, où s'écrit la trace du repli).
- **`skills/chaine/criticite/references/CONTENU.md`** : § `SKILL.md` (l. 5) et § `references/prompt.md` (l. 13, « n'utilise aucun outil ») : dire que la définition retire les outils et les consignes, et que le prompt garde sa phrase pour le repli.
- **`skills/chaine/criticite/references/prompt.md`** : inchangé (sa phrase « N'utilise aucun outil » sert encore au repli).
- **`NOTES-DE-VERSION.md`** : la note la plus récente est `## 8.3.3 — 2026-11-23` (l. 5), avec « Ce qui change » et « Ce qu'un projet fait pour en profiter ».
- **`README.md`**, § « Structure » (l. 125 à 189) : l'arbre ne nomme que `.claude-plugin/` et `skills/`, et l. 129 dit « `plugin.json` le plugin « maj-skills », qui déclare ses skills ». Le dossier `agents/` y entre, et la ligne de `plugin.json` dit « ses skills et ses agents ». § « Ajouter un skill » (l. 193 à 200) : rien ne dit comment ajouter une définition.

**Bancs existants qui figent un texte que ce ticket change :**

- `scripts/depot.test.mjs`, test « le skill de criticité : sa description … » (l. 876) : `exiger` (l. 859) cherche à plat la phrase entière de l'étape 3 (l. 887, mot pour mot celle de `criticite/SKILL.md` l. 50) et le paragraphe de l'étape 4 (l. 888). La nouvelle étape 3 se recopie dans le banc, entière, à la place de l'ancienne : la phrase sur le prompt sans outil y reste.
- `scripts/relecture.test.mjs`, test « les règles de suite, par leur texte … » (l. 501) : exige l. 559 « , tous lancés dans le même tour, sans l'historique de la session » et l. 564 « Sortie 1 (un fichier non lu, ou pas de liste) ou sortie hors du format du prompt : un second sous-agent neuf, une fois. Encore, ou l'outil en échec : l'axe est « non exécuté », jamais « sans objet ». » : ces deux passages restent tels quels dans `SKILL.md`, le nom et le repli s'ajoutent autour.
- `scripts/relecture.test.mjs`, test du gabarit du verdict (l. 384 à 390) : aucune ligne du corps ne commence par une marque d'un autre rôle ; la ligne de chaque axe et la ligne `- Session :` sont figées (l. 388 et 389), et l. 406 remplace mot pour mot `- Documentation : <joué | non exécuté, et la cause | sans objet>`. La ligne du repli s'ajoute sans toucher ces lignes, et ne commence par aucune des marques de l. 385.
- `scripts/relecture.test.mjs`, test « le plugin connaît le skill … » (l. 473 à 480) : lit `plugin.skills` et l'arbre du README (`"    relecture/\n      SKILL.md "`). Ajouter la clé `agents` et le dossier `agents/` à l'arbre ne doit pas casser ces passages.
- `scripts/depot.test.mjs` l. 26 à 36 (skills déclarés et fantômes) et l. 1223 à 1230 (la première note commence par la version de `plugin.json`, porte « Ce qui change » et « Ce qu'un projet fait pour en profiter »).

## Décisions

1. **Les définitions** : `A-1` (nom, outils, modèle, `omitClaudeMd`, rien d'autre dans le frontmatter), `A-2` (Read, Grep, Glob, sans Bash), `A-3` (Opus, ni `effort` ni paramètre `model` passé par un skill), `A-4` (corps court et générique, description qui interdit la délégation spontanée), `A-5` (aucun skill préchargé). Le frontmatter, exactement :

   ```yaml
   ---
   name: axe-de-relecture
   description: <une phrase : relecteur en lecture seule et en contexte vierge, lancé seulement par un skill de maj-skills qui le nomme (relecture, revue-de-ticket, revue-adversariale), jamais de lui-même ni pour une autre tâche>
   tools: Read, Grep, Glob
   model: opus
   omitClaudeMd: true
   ---
   ```

   et, pour `classeur-de-criticite`, `tools: []` (fait 1 : la liste vide donne `toolNames: []`), sa description nommant le skill `criticite`. Le corps, quelques lignes : le rôle, puis « Ta mission, ta liste fermée et ton format de sortie sont dans ton message ; tu ne rends que ce qu'il demande. » ; pour l'axe, « tu ne modifies rien » est vrai par construction et n'a pas à s'y écrire, mais rien ne l'interdit. La formulation exacte des deux descriptions et des corps est laissée à la session, dans ces limites ; la description dit « jamais de lui-même » (le banc le lit, décision 4).
2. **La liste** : `"agents": ["./agents/axe-de-relecture.md", "./agents/classeur-de-criticite.md"]`, placée juste après `skills` dans `plugin.json` (`A-1`). `marketplace.json` ne change pas : sa description ne nomme pas les composants (`A-10`).
3. **Le repli** : `A-6`. Tranché ici, ce que la spec laisse ouvert :
   - **Une phrase, la même dans chaque skill**, dont le noyau est exact (le banc le cherche) : « relance le même message, entier, par l'agent générique ». Elle dit : si l'outil Agent répond « Agent type 'maj-skills:<nom>' not found », la session relance le même message, entier, par l'agent générique d'avant cette version, sans paramètre `model`, et le dit dans sa sortie ; ce repli n'est pas un échec de l'outil, l'axe ou la règle est joué ; toute autre erreur garde la règle de l'étape (« non exécuté », second essai).
   - **Chaque lancement essaie le nom**, le second essai compris : l'erreur est immédiate, et la session n'a aucun état à tenir.
   - **`relecture`** : une ligne du corps du verdict, toujours écrite, après « Pour lever un « non exécuté » » : `Agent des axes : maj-skills:axe-de-relecture` ou `Agent des axes : agent générique, maj-skills:axe-de-relecture introuvable dans cette session (repli)`. Raison : l'en-tête ne prend aucune ligne (`verdict.md` l. 49) et le corps n'est pas lu par la machine ; une ligne toujours présente se compte mieux qu'une ligne qui n'apparaît qu'au repli (spec, `A-6`, « le dire permet de compter les replis »). Si un axe a eu la définition et un autre non (cas non vu à l'essai), la ligne nomme les axes du repli.
   - **`criticite`** : dans la section `## Criticité`, pour chaque sortie brute, l'agent qui l'a rendue (`maj-skills:classeur-de-criticite`, ou « agent générique (repli) »), écrit juste avant elle.
   - Le banc de `relecture.test.mjs` sur le gabarit gagne l'exigence de cette ligne ; jamais un banc retiré ou assoupli.
4. **Le banc `scripts/agents.test.mjs`** : `A-9`, pour les deux skills de ce ticket (le ticket 2 l'étend). En plus, tranché ici : la description de chaque définition contient « jamais de lui-même » (`A-4`) ; chaque fichier de `agents/` n'a que les clés `name`, `description`, `tools`, `model`, `omitClaudeMd` ; chaque `maj-skills:<nom>` cité sous `skills/` (hors noms de skills : `maj-skills:<skill>` désigne aussi un skill, comme `/maj-skills:chantier`) désigne une définition ou un skill déclaré, et un nom qui n'est ni l'un ni l'autre rougit ; `relecture/SKILL.md` étape 6 et `criticite/SKILL.md` étape 3 nomment leur agent et portent le noyau du repli ; `verdict.md` porte la ligne `Agent des axes :`. Le banc lit le frontmatter par un petit lecteur à lui, avec ses entrées piégées (comme `lecteur à plat : entrées piégées` de `depot.test.mjs`) : une clé en double, un `tools` sur deux lignes, un frontmatter non fermé.
5. **`A-7`** : la garde des consignes de `relecture` reste ; `CONTENU.md` dit pourquoi en une phrase (fait 5 : un `CLAUDE.md` de sous-dossier arrive encore à la lecture).
6. **Les prompts ne changent pas** (`A-4`) : ni ceux de `relecture`, ni `criticite/references/prompt.md`. Leur phrase « tu ne lances aucune commande » ou « n'utilise aucun outil » sert encore au repli.
7. **Version** : 8.4.0, sur la version de `main` au moment de la PR, après fusion de `origin/main` dans la branche ; si `main` a dépassé 8.3.3, la mineure suivante, notée sous `## Comments`. La note dit : les deux définitions et ce qu'elles fixent ; `relecture` et `criticite` les lancent ; le repli et sa ligne ; une session partie d'un instantané antérieur relit comme avant jusqu'à son renouvellement (fait 6) ; « Ce qu'un projet fait pour en profiter » : **rien à reposer**, les définitions et les skills qui les nomment sont lus dans le plugin ; une session lancée avant la mise à jour du plugin ne les a pas.
8. **README** : le dossier `agents/` entre dans l'arbre de « Structure » (« deux définitions de sous-agents : axe-de-relecture, classeur-de-criticite »), la ligne de `plugin.json` dit « qui déclare ses skills et ses agents », et « Ajouter un skill » gagne une phrase : une définition neuve s'ajoute dans `agents/` et dans la liste `agents` de `plugin.json`, que le banc tient.

## Surfaces

| Surface | Preuve |
| --- | --- |
| `agents/axe-de-relecture.md` | essai réel : `toolNames` vaut `["Read","Grep","Glob"]` et `model` un identifiant Opus dans `agent-*.prefix.json` ; aucune chaîne du `CLAUDE.md` ni de `.claude/rules/` du dossier d'essai dans `agent-*.jsonl` ; `agents.test.mjs` vert |
| `agents/classeur-de-criticite.md` | essai réel : `toolNames` vaut `[]`, `model` Opus, aucune chaîne des consignes dans `agent-*.jsonl` ; `agents.test.mjs` vert |
| liste `agents` de `plugin.json` | `agents.test.mjs` : chaque fichier de `agents/` listé, et inversement ; dans l'essai, les deux noms `maj-skills:…` dans la liste des agents de la session |
| `relecture`, étape 6 | `agents.test.mjs` : le nom et le noyau du repli ; `relecture.test.mjs` vert, ses passages l. 559 et 564 intacts |
| ligne du verdict | `relecture.test.mjs` : le gabarit porte `Agent des axes :`, l'exemple aussi, et le gabarit rempli passe encore `verdict.mjs` |
| `criticite`, étape 3 et trace | `depot.test.mjs` l. 887 recopie la nouvelle étape 3, entière ; `agents.test.mjs` : le nom et le noyau du repli |
| `cas-limites.md` | la ligne du repli dans la table de l'étape 6, relue dans la PR |
| version et note | `depot.test.mjs` l. 1223 à 1230 vert sur 8.4.0 |
| README | l'arbre nomme `agents/` ; `relecture.test.mjs` l. 479 et 480 et `depot.test.mjs` l. 1068 verts |

## Vérification

1. `pnpm test` vert, sa sortie (le bilan, et la sortie de `scripts/agents.test.mjs` en entier) dans la PR. Chaque banc ajouté se voit rouge avant le texte qu'il tient (une définition retirée de la liste, un `tools` changé, la phrase du repli ôtée).
2. **Essai réel**, dans la session, la méthode des « Faits établis » de la spec : un dossier d'essai dans le scratchpad, avec un `CLAUDE.md` et une fiche `.claude/rules/canari.md` portant chacun une chaîne `CANARI-…` ; depuis ce dossier, `claude -p --plugin-dir /home/user/skills` (Claude Code installé, 2.1.332 à la rédaction) avec un prompt qui lance `maj-skills:axe-de-relecture` (une tâche de lecture d'un fichier du dossier) puis `maj-skills:classeur-de-criticite` (un message court, sans outil). Puis, dans `~/.claude/projects/<projet>/<session>/subagents/` : pour chaque agent, `toolNames` et `model` de `agent-*.prefix.json`, et l'absence de la pièce jointe `instructions` et de toute chaîne `CANARI-` dans `agent-*.jsonl`. Les commandes jouées et les extraits lus (ces deux champs, et la recherche de `CANARI-` et de `instructions`) vont dans la PR. Si le plugin `maj-skills` du marketplace est déjà chargé dans la session d'essai, la PR dit lequel a servi (les deux noms n'existent que dans la version de la branche). Un essai qui ne montre pas ces quatre faits est un échec du ticket, pas une ligne de la PR.
3. Le repli, essayé une fois : depuis le même dossier, `claude -p` **sans** `--plugin-dir` (le plugin installé, antérieur à 8.4.0, ou aucun) et un prompt qui lance `maj-skills:axe-de-relecture` : la réponse « Agent type … not found » recopiée dans la PR, pour montrer le message que la phrase du repli attend.
4. `graphify update .` après les modifications (règle du `CLAUDE.md` du dépôt), `graphify-out/` commité avec le reste.
5. Revue de ticket de la branche (trois sous-agents), puis la PR.

## Comments

- 2026-11-25 — Écrit par un sous-agent de l'architecte du programme définitions d'agents, d'après la spec.
