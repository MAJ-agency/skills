# `revue-de-ticket`, `revue-adversariale`, la relecture de l'architecte et la contre-revue du régime 7 lancent `maj-skills:axe-de-relecture`, avec le repli (8.5.0)

Status: ready-for-agent
Type: task
Modèle: sonnet — des paragraphes de procédure à reprendre dans quatre skills et deux gabarits de section, sans script ; la définition, la phrase du repli et le banc existent après le ticket 1, que ce ticket étend ; les décisions sont prises dans la spec et ici.
Blocked by: 1
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/revue-de-ticket/SKILL.md`, `skills/chaine/revue-de-ticket/references/section-pr.md`, `skills/chaine/revue-de-ticket/references/CONTENU.md`, `skills/chaine/revue-adversariale/SKILL.md`, `skills/chaine/revue-adversariale/references/section-pr.md`, `skills/chaine/revue-adversariale/references/CONTENU.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/lancement.md`, `skills/chaine/chantier/references/regime-7.md`, `scripts/agents.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `graphify-out/`

Programme : [`../../../programmes/definitions-d-agents.programme.md`](../../../programmes/definitions-d-agents.programme.md). Spec : [`../definitions-d-agents.spec.md`](../definitions-d-agents.spec.md) (décisions `A-1`, `A-6`, `A-8`, `A-9`, `A-10`). Suit le ticket [1](1-definitions-relecture-et-criticite.issue.md), qui livre la définition `maj-skills:axe-de-relecture`, la phrase du repli et le banc `scripts/agents.test.mjs`.

## Le besoin

Après le ticket 1, `relecture` lance ses axes par la définition ; les autres relectures de la chaîne partent encore de l'agent générique, avec tous ses outils, le modèle de la session et les consignes du projet dans leur contexte (spec, fait 5) : les trois axes de `revue-de-ticket`, le relecteur de `revue-adversariale` et ses lots, la relecture par un agent neuf d'un ticket hors chantier que l'architecte lance, la contre-revue du conducteur et la contre-relecture de l'architecte en régime 7 et dans un dépôt sans la chaîne.

**Quand le ticket est fait :**

1. Chacune de ces relectures se lance par `subagent_type: "maj-skills:axe-de-relecture"`, avec la phrase du repli du ticket 1, et le message qu'elle reçoit ne change pas.
2. Le repli se dit là où chaque relecture rend son résultat : la section de PR (`revue-de-ticket`, `revue-adversariale`), le commentaire de verdict de contre-relecture, la note de l'architecte sur la relecture d'un ticket, le journal du conducteur.
3. `scripts/agents.test.mjs` tient ces skills comme ceux du ticket 1.
4. Le plugin passe en 8.5.0, avec sa note.

## Où

Lu dans le dépôt le 2026-11-25, sur la branche `docs/definitions-d-agents-programme` (plugin 8.3.3, avant le ticket 1 : relire les lignes sur la branche du ticket 1 fusionnée).

- **`skills/chaine/revue-de-ticket/SKILL.md`** :
  - étape 2 (l. 32 à 42), l. 34 : « Outil **Agent**, trois sous-agents neufs, lecture seule, lancés dans le même tour, sans l'historique de la session : » ; l. 42 : les lots d'un diff de plus de 2 000 lignes, « pour les trois axes » ;
  - étape 4, point 2 (l. 51) : « nouveau tour, trois sous-agents neufs » : eux aussi par le nom ;
  - étape 5 (l. 56 à 62) : la section de PR, `references/section-pr.md`.
- **`skills/chaine/revue-de-ticket/references/section-pr.md`** : l. 3 à 7, les lignes de tête de `## Revue de ticket` (`Ticket`, `/security-review`, `Contrôle des preuves`, `Cas laissés`, `Résultat`) ; la ligne du repli s'y ajoute.
- **`skills/chaine/revue-de-ticket/references/CONTENU.md`** : l. 13, « Un sous-agent par axe, en contexte vierge, en lecture seule, sans l'historique de la session. »
- **`skills/chaine/revue-adversariale/SKILL.md`** :
  - l. 38 : « **Diff de plus de 2 000 lignes :** un lot par zone (…). Un sous-agent par lot, lancés en parallèle, mêmes critères. » ;
  - étape 3 (l. 48 à 52), l. 50 : « Outil **Agent**, un sous-agent neuf, en lecture seule : il peut lire le dépôt pour vérifier un constat, il ne modifie rien, il ne lance ni commit ni commande d'écriture. » ;
  - étape 5, point 2 (l. 61) : « relancer une revue sur le nouveau diff, avec un sous-agent neuf » ; point 3 (l. 62), la section de PR.
- **`skills/chaine/revue-adversariale/references/section-pr.md`** : l. 3 à 5, les lignes de tête de `## Revue adversariale` (`Sommet relu`, `/security-review`, `Résultat`).
- **`skills/chaine/revue-adversariale/references/CONTENU.md`** : l. 17, § du prompt (« Le prompt exact du sous-agent. Il ne reçoit ni l'historique, ni l'intention, ni la description de la PR »).
- **`skills/chaine/architecte/SKILL.md`** :
  - § 5 (l. 70 à 82), l. 74 : « Un ticket hors chantier qu'il lance lui-même, il le fait relire par un agent neuf (un sous-agent) avant le lancement et n'en lit que la conclusion (point 9). » ;
  - l. 10 : « relevés, rédaction et reprise de tickets, relectures par un agent neuf, contre-revues vont à des sous-agents » : une phrase générale sur la délégation, qui mêle des sous-agents de relevé et de rédaction (hors périmètre, `A-8`) ; **inchangée** (décision 4) ;
  - l. 62 et l. 104 (« relu par un agent neuf ») renvoient à la même relecture : inchangées, § 5 la dit.
- **`skills/chaine/architecte/references/lancement.md`**, « La session d'un ticket hors chantier » (l. 82), l. 99 : « contre-relit lui-même un ticket `Label: contre-revue` (par un sous-agent) et écrit son verdict sur la PR (…) (le sous-agent relecteur est en lecture seule : c'est l'architecte qui écrit ; …) ». C'est la contre-relecture de l'architecte en régime 7 et dans un dépôt sans la chaîne, celle que `regime-7.md` l. 21 renvoie ici ; aucun autre passage de `lancement.md` ne parle d'une relecture par un sous-agent (recherche de « sous-agent », « agent neuf », « contre-reli » : l. 99 seule).
- **`skills/chaine/chantier/references/regime-7.md`** :
  - l. 11 : « **La contre-revue du conducteur** sur toute PR qui touche un chemin sensible (`.claude/chaine.json`), par sous-agent, une fois le code poussé (…) ; le conducteur contre-relit, puis pose le label lui-même. » ;
  - l. 21 : « il contre-relit lui-même (par un sous-agent) et écrit son verdict sur la PR, avant l'ordre, jamais après (`references/lancement.md`, « La session d'un ticket hors chantier ») ».
- **`skills/chaine/architecte/references/CONTENU.md`** et **`skills/chaine/chantier/references/CONTENU.md`** : ne décrivent pas le sous-agent de relecture (l. 5 et l. 9) : inchangés.
- **`scripts/agents.test.mjs`** (ticket 1) : la liste des skills qui nomment leur agent et portent le noyau du repli.

**Bancs existants qui figent un texte que ce ticket change :**

- `scripts/bascule.test.mjs`, test « regime-7.md garde ce qui ne vaut qu'en régime 7 … » (l. 62 à 72) : exige dans `regime-7.md` « **La contre-revue du conducteur** sur toute PR qui touche un chemin sensible » et « la fille livre **sans** `à-fusionner` ; le conducteur contre-relit, puis pose le label lui-même. » (l. 65 et 66) ; l. 58, les titres `## …` de `regime-7.md`, exacts. Le nom de l'agent s'insère dans la phrase de l. 11 sans couper ces deux passages, et aucun titre ne s'ajoute.
- `scripts/bascule.test.mjs` l. 190 : dans la ligne « contre-relit lui-même » de `lancement.md`, « En régime 8, il ne contre-relit rien » vient avant « contre-relit lui-même ».
- `scripts/depot.test.mjs`, test « verdict de contre-relecture … » (l. 1629 à 1651) : la ligne de `lancement.md` qui contient « contre-relit lui-même » porte « un verdict `non conforme` », « écrit son verdict sur la PR », « les vérifie », « ni si la PR porte un verdict et qu'aucun verdict `conforme` ne porte sur ce sommet » et « Il écrit son verdict avant l'ordre, jamais après » ; `architecte/SKILL.md` § 5 et § 7 portent les deux cas d'arrêt. Ces passages restent tels quels, et la ligne reste une seule ligne.
- `scripts/depot.test.mjs` l. 955 à 965 : la ligne `| Documentation | …` de l'étape 2 de `revue-de-ticket/SKILL.md` (l. 40), mot pour mot : ne pas la toucher.
- `scripts/depot.test.mjs`, test « ticket 18 » (l. 1318 à 1330) : dans les deux `section-pr.md`, la ligne `` `/security-review` : `` est lue par `aLigneSecurite` de `fusionner/scripts/revue-exigee.mjs`. La ligne du repli ne contient pas `` `/security-review` : ``, et le titre de section reste la première ligne.
- `scripts/depot.test.mjs` l. 1223 à 1230 : la première note et la version de `plugin.json`.

## Décisions

1. **L'agent et le message** : `A-1` (la définition, pour ces cinq usages), `A-2` (aucun prompt ne demande une commande), `A-3` (aucun paramètre `model`). Les prompts ne changent pas (`revue-adversariale/references/prompt.md`, `revue-de-ticket/references/prompt-ticket.md` et `prompt-documentation.md`) : ils disent déjà « tu ne modifies rien » et ne demandent aucune commande. La phrase de `revue-adversariale` l. 50 (« il peut lire le dépôt pour vérifier un constat, il ne modifie rien, il ne lance ni commit ni commande d'écriture ») reste vraie et se garde ; elle peut dire que la définition le rend impossible.
2. **Le repli** : `A-6`, la phrase du ticket 1, son noyau exact (« relance le même message, entier, par l'agent générique »), dans chaque passage qui lance l'agent, le second tour et les lots compris : une phrase par étape, pas une par lancement. Chaque lancement essaie le nom (ticket 1, décision 3).
3. **Où se dit le repli**, tranché ici prudemment :
   - `revue-de-ticket` et `revue-adversariale` : une ligne de tête de plus dans chaque `section-pr.md`, toujours écrite, `- Agent des relecteurs : maj-skills:axe-de-relecture | agent générique, maj-skills:axe-de-relecture introuvable dans cette session (repli)`, comme la ligne `Agent des axes :` du verdict du ticket 1 ;
   - la contre-relecture de l'architecte (`lancement.md` l. 99, `regime-7.md` l. 21) : une ligne **à la fin** du commentaire de verdict, jamais en première ligne (la première ligne est le verdict, lu exactement : ticket 21 de « capitaine à jour et testé ») ; écrite seulement au repli ;
   - la contre-revue du conducteur (`regime-7.md` l. 11) : une ligne au journal de la carte du chantier, et dans la liste à la fille s'il y en a une ; seulement au repli ;
   - la relecture d'un ticket hors chantier (`architecte/SKILL.md` § 5) : l'architecte note le repli sous `## Comments` du ticket, sur la ligne qui date la relecture ; seulement au repli. Le sous-agent ne le sait pas : c'est la session qui a reçu « not found » qui l'écrit.
4. **`A-8`** : rien d'autre des skills de rôle ne change. `architecte/SKILL.md` l. 10 reste : elle parle aussi des sous-agents de relevé et de rédaction, qui gardent tous leurs outils, et § 5 porte la règle. La relecture des tickets d'un chantier par un agent neuf, avant la vague (`chantier/SKILL.md`), n'est pas dans `A-1` : elle ne change pas ici ; un ticket de suite si le produit le veut.
5. **Le message de la contre-revue et de la relecture de l'architecte**, qui n'ont pas de prompt écrit : la session qui lance le sous-agent lui donne le diff dans un fichier (`diff-revue.sh` là où la chaîne est posée, sinon `git diff <base>...<sommet>` écrit dans le scratchpad) et lui dit de le lire, puisque l'agent n'a pas Bash (`A-2`). Une phrase le dit dans `regime-7.md` l. 11 et dans `lancement.md` l. 99 ; le reste de leur procédure ne change pas.
6. **Le banc** : `A-9`. `scripts/agents.test.mjs` ajoute `revue-de-ticket/SKILL.md` (étape 2), `revue-adversariale/SKILL.md` (étape 3 et la ligne des lots), `architecte/SKILL.md` § 5, `architecte/references/lancement.md` (la ligne « contre-relit lui-même ») et `chantier/references/regime-7.md` (l. 11 et l. 21) à ce qu'il lit : chacun nomme `maj-skills:axe-de-relecture` et porte le noyau du repli ; les deux `section-pr.md` portent la ligne `Agent des relecteurs :`. Rouge avant le texte, vert après ; aucun banc existant assoupli.
7. **Version** : 8.5.0, sur la version de `main` au moment de la PR, après fusion de `origin/main` (qui porte le ticket 1) ; si `main` a dépassé 8.4.0, la mineure suivante, notée sous `## Comments`. La note dit les relectures qui passent sur la définition, la ligne de section neuve, le repli ; « Ce qu'un projet fait pour en profiter » : **rien à reposer** (les skills et les gabarits de section sont lus dans le plugin) ; une session lancée avant la mise à jour relit par l'agent générique et le dit.

## Surfaces

| Surface | Preuve |
| --- | --- |
| `revue-de-ticket`, étapes 2 et 4 | `agents.test.mjs` : le nom et le noyau du repli ; `depot.test.mjs` l. 960 vert |
| `revue-adversariale`, lots, étapes 3 et 5 | `agents.test.mjs` : le nom et le noyau du repli |
| les deux `section-pr.md` | `agents.test.mjs` : la ligne `Agent des relecteurs :` ; `depot.test.mjs` « ticket 18 » vert |
| `architecte/SKILL.md` § 5 | `agents.test.mjs` ; `depot.test.mjs` l. 1629 vert |
| `lancement.md`, ligne « contre-relit lui-même » | `agents.test.mjs` ; `depot.test.mjs` l. 1641 à 1650 et `bascule.test.mjs` l. 190 verts |
| `regime-7.md` l. 11 et l. 21 | `agents.test.mjs` ; `bascule.test.mjs` l. 58 et l. 62 à 72 verts |
| `CONTENU.md` des deux revues | relus dans la PR : ils disent la définition et le repli |
| version et note | `depot.test.mjs` l. 1223 à 1230 vert sur 8.5.0 |

## Vérification

1. `pnpm test` vert, sa sortie (le bilan, et `scripts/agents.test.mjs` en entier) dans la PR ; chaque exigence ajoutée au banc vue rouge avant son texte.
2. `grep -rn "maj-skills:axe-de-relecture" skills` recopié dans la PR : les cinq fichiers de ce ticket et ceux du ticket 1, rien d'autre.
3. `graphify update .` après les modifications, `graphify-out/` commité avec le reste.
4. Revue de ticket de la branche (trois sous-agents, lancés par la définition si la session l'a, sinon par le repli, dit dans la section), puis la PR.

## Comments

- 2026-11-25 — Écrit par un sous-agent de l'architecte du programme définitions d'agents, d'après la spec.
