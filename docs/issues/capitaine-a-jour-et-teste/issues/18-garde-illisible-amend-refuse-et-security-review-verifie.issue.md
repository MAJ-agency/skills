# Une garde qui ne charge pas ses règles refuse et dit comment sortir, `git commit --amend` est refusé, et le capitaine vérifie que `/security-review` a été lancée

Status: Fait — PR #125
Type: défaut
Modèle: opus — trois gardes de sécurité à rendre fermées et parlantes quand leur propre module est cassé (un import statique ne se rattrape pas), un refus de plus sur le lecteur par jetons du ticket 17, et une vérification nouvelle du capitaine sur toute PR qui touche un chemin sensible ; `/security-review` obligatoire. Une erreur ouvre les gardes par un fichier cassé, ou renvoie à tort toutes les PR de la chaîne.
Blocked by: 17 et 5 (`skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `regles.test.mjs`, `socle-chaine-de-production/references/CONTENU.md` et `fragments/claude-md-fusion.md` sont des fichiers chauds du ticket 17 ; `docs-agents/chaine-de-production.md` § 5 est touché par le ticket 5, qui y écrit « Jamais d'amend » : partir de `main` après leur fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-github.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/apres-edition.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/fin-de-tour.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-illisible.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/revue-adversariale/SKILL.md`, `skills/chaine/revue-adversariale/references/section-pr.md`, `skills/chaine/revue-de-ticket/SKILL.md`, `skills/chaine/revue-de-ticket/references/section-pr.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 18 (points D17, D18, D19 ; décisions `A-29`, `A-30`, `A-31` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 17, 18 et 19. Ticket 17 : [`17-les-gardes-lisent-git-apres-ses-options-globales.issue.md`](17-les-gardes-lisent-git-apres-ses-options-globales.issue.md) (`appelsGit`, l'ordre de `decisionDuLecteur`). Spec du chantier 1 : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 5 (`A-12`). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`, `A-37`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**), puis le ticket 17 et le lot 5 fusionnés. Faits relus et rejoués à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**D18, la garde illisible.** Les trois gardes `PreToolUse` importent `regles.mjs` en statique : `garde-commandes.mjs:5`, `garde-fichiers.mjs:5`, `garde-github.mjs:12` (et `entree.mjs`, l. 4, 4 et 11). Rejoué sur `4a45634` avec un `regles.mjs` tronqué : chacune sort en **1**, avec une trace de Node pour seul message (`SyntaxError`, le fichier, la ligne). Le fragment de hooks bloque l'outil sur cet échec (`settings-hooks.json`, `"onFailure": "block"`) : la session ne peut plus lancer ni `Bash`, ni `Edit`, ni `Write`, donc plus réparer le fichier, et rien ne lui dit quoi faire. Cas vécu chez Iroki : une fille verrouillée par une `SyntaxError` à mi-réécriture de `regles.mjs` (`SPEC_ALL_SOC-4.70`) ; Iroki n'a écrit qu'une consigne (#653, `8a509afa`, `docs/agents/chaine-de-production.md:126` d'`origin/develop`).

**D19, l'amend.** Rejoué sur `4a45634` : `git commit --amend -m x`, `git commit --amend --no-edit`, `git -C . commit --amend`, `git commit --am -m x` passent tous la garde. Un amend réécrit le sommet qu'une session a annoncé, qu'un relecteur a contre-relu ou qu'un ordre `à-fusionner au sommet <sha>` lie ; poussé, il ne repart que par un push forcé, que la garde refuse. Iroki n'a écrit qu'une consigne (#634, `5f8e1762`, `docs/agents/chaine-de-production.md:124`).

**D17, `/security-review`.** La règle existe (`revue-adversariale/SKILL.md:25`, étape 2 l. 46 : un diff qui touche un chemin sensible passe aussi `/security-review`), et les deux sections de PR portent déjà la ligne « `/security-review` : lancée (chemins : …) | non requise » (`revue-adversariale/references/section-pr.md:4`, `revue-de-ticket/references/section-pr.md:4`). Aucune machine ne la vérifie : `revue-exigee.mjs` ne lit que le titre de la section (`aSectionRevue`, l. 210-221). Chez Iroki, la revue de sécurité a trouvé deux contournements de la garde que deux contre-revues n'avaient pas vus.

**Quand le ticket est fait** (`A-29` à `A-31`) :

1. Une garde qui ne peut pas charger `regles.mjs` ou `entree.mjs` refuse l'outil (sortie 2) et dit comment sortir : faire restaurer `scripts/agent/` par un humain, `git checkout origin/develop -- scripts/agent/`. Jamais d'échec ouvert.
2. Le gabarit `chaine-de-production.md` dit d'écrire un fichier chargé par les gardes **d'un seul coup** : copie, `node --check`, import, pose.
3. La garde refuse `git commit --amend`, sous ses abréviations et derrière toute option globale de git. Les consignes des sessions le disent déjà par le ticket 5 (ligne « Commits : », paragraphe « Jamais d'amend ») ; ce ticket y ajoute que la garde le refuse.
4. Le capitaine renvoie une PR qui touche un chemin sensible sans la ligne « `/security-review` : lancée » dans sa section de revue.
5. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Où

`ag/` abrège `skills/chaine/socle-chaine-de-production/references/agent/`, `fus/` abrège `skills/chaine/fusionner/scripts/`. Lignes relues sur `4a45634` ; le ticket 17 et le lot 5 en auront décalé certaines.

| Fichier | Lignes (`4a45634`) | Ce qu'on y fait |
| --- | --- | --- |
| `ag/garde-commandes.mjs` | 4-5 | Imports de `./entree.mjs` et `./regles.mjs` en dynamique protégé (`await import(…).catch(…)`), avant toute autre chose ; échec → refus de la Décision 1. L'import facultatif d'`identifiants.mjs` (l. 11) ne change pas. |
| `ag/garde-fichiers.mjs` | 4-5 | Idem. |
| `ag/garde-github.mjs` | 11-12 | Idem. |
| `ag/demarrage.mjs` | 22 | Import statique de `./entree.mjs` (`RACINE`), en dynamique protégé : hook `SessionStart` qui ne garde rien, même message sur la sortie d'erreur, puis sortie 0. |
| `ag/apres-edition.mjs`, `ag/fin-de-tour.mjs` | 10-11, 13-14 | Hooks qui ne gardent rien (`PostToolUse`, `Stop`) : même import protégé, même message sur la sortie d'erreur, puis **sortie 0** ; un `Stop` en sortie 2 bouclerait la session. |
| `ag/garde-illisible.test.mjs` | nouveau | Les bancs de D18 (voir « Ordre de travail »). |
| `ag/regles.mjs` | raisons (l. 166-185), après les prédicats du ticket 17, `decisionDuLecteur` (l. 1998-2026) | `RAISON_AMEND` ; `amendeUnCommit(commande)`, exporté, sur `appelsGit` du ticket 17 ; dans `decisionDuLecteur`, après `ecritUneRefDeSuivi` et avant les push (Décision 3). |
| `ag/regles.test.mjs` | fin | Les bancs de D19. |
| `fus/revue-exigee.mjs` | 1-18 (en-tête), 208-231, 253-264 (CLI) | `motifSansSecurite({ corps, fichiers, base })`, exportée (Décision 4), puis dans la CLI après `motifSansRevue` et avant `motifTitreSansCode`. Le ticket 16, qui passe après (`A-43`), le rangera dans `motifsDuCapitaine`, que la CLI et `pr-titre.mjs` appelleront. |
| `fus/revue-exigee.test.mjs` | fin | Les bancs de D17. |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` | après 125 ; paragraphe « Jamais d'amend » du ticket 5 (après l'étape 4) | Un paragraphe « Un fichier que les gardes chargent s'écrit d'un seul coup » (Décision 2) ; le paragraphe « Jamais d'amend » se termine par « La garde (`garde-commandes`) le refuse. » La ligne `Intangibles` et la ligne « Commits : » du ticket 5 ne changent pas (Décision 5). |
| `skills/chaine/socle-chaine-de-production/references/CONTENU.md` | 13 | Les refus de `garde-commandes` gagnent l'amend ; une phrase : une garde qui ne charge pas ses règles refuse et dit comment sortir. |
| `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md` | 11 (ligne « Hooks d'agent », réécrite par le ticket 17) | « … `--no-verify` et toute autre façon de sauter les hooks git (…), `git commit --amend`, … ». |
| `skills/chaine/revue-adversariale/SKILL.md` | 25, 46 | Le capitaine vérifie la ligne : sans elle, sur un chemin sensible, la PR est renvoyée. |
| `skills/chaine/revue-adversariale/references/section-pr.md`, `skills/chaine/revue-de-ticket/references/section-pr.md` | 4 | La ligne garde sa forme ; une note sous le gabarit : « La ligne `/security-review` est lue par le capitaine : `lancée` seulement si la skill a tourné sur ce sommet. » |
| `skills/chaine/revue-de-ticket/SKILL.md` | 58 (étape 5) | Une phrase : sur un chemin sensible, la ligne « `/security-review` : lancée » est exigée par le capitaine. |
| `scripts/depot.test.mjs` | fin | Les contrôles de texte (voir « Ordre de travail »). |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

**Ce que les bloquants auront changé** (à relire sur `main` avant de commencer) :

- ticket 17 : `appelsGit(lectures)` rend `{ globales, sous, args }` par appel de git, les arguments lus sur les mots exacts avec les valeurs d'options de `commit` sautées (`-m`, `--message`, `-F`, `-C`, `-c`, `--fixup`, `--squash`…, décision `A-37`) ; `sauteLesHooks` et `ecritUneRefDeSuivi` dans `decisionDuLecteur`, après les `COMMANDES_INTERDITES` ; `-c alias.*` refusé partout ; `RAISON_HOOKS_GIT`, `RAISON_REF_DE_SUIVI` ; la ligne « Hooks d'agent » de `claude-md-fusion.md` réécrite ; `CONTENU.md:13` réécrit ;
- ticket 5 (lot 5, `A-12`, et `A-30` pour la consigne, décision `A-41`) : le premier geste d'une session lancée (charger `send_message`) dans les trois blocs de `lancement.md` et dans le gabarit de `chaine-de-production.md` § 5 ; juste après la ligne `Intangibles`, inchangée, une ligne « Commits : jamais `git commit --amend` ; une correction est un commit de plus. », identique dans `lancement.md` et dans le gabarit ; un paragraphe « **Jamais d'amend.** » après l'étape 4 du déroulé ; un banc de `scripts/depot.test.mjs` qui rougit si l'amend entre dans la ligne `Intangibles`.

Appelants réels :

- `garde-commandes.mjs`, `garde-fichiers.mjs`, `garde-github.mjs` : les hooks `PreToolUse` d'un projet (`socle/settings-hooks.json`) ; `apres-edition.mjs` (`PostToolUse`), `fin-de-tour.mjs` (`Stop`).
- `amendeUnCommit` : `decisionDuLecteur`, joué par `decisionCommande` (`regles.mjs:1968-1983`), appelé par `garde-commandes.mjs`.
- `motifSansSecurite` : la CLI de `revue-exigee.mjs`, appelée par `passer.sh:186` (PR vers `develop`, hors livraison de sujet) et par `juger` de `sujet.sh:726` (sous-PR, résolution et retouches d'une PR de mise à jour) ; avec le ticket 16, `pr-titre.mjs`.

Ce dépôt n'a pas de garde d'agent (`.claude/settings.json` ne porte que les hooks de graphify) : la session qui édite `regles.mjs` ne se bloque pas elle-même. Sa description de PR et ses messages citeront `--amend` : ils passent par un fichier (`git commit -F <fichier>`, l'outil GitHub MCP), comme le ticket 17 le dit.

Règles à lire : le ticket 17 (Décisions 1, 2, 7) ; `ag/regles.mjs` l. 1960-2026 (décision) ; `fus/revue-exigee.mjs` l. 1-62 et 175-231.

## Décisions

Tenues (spec et programme) : `A-29` (import protégé, refus, message qui dit de faire restaurer `scripts/agent/` par un humain, consigne d'écriture d'un seul coup dans le gabarit), `A-30` (amend refusé par la garde, dit dans les consignes : la consigne est au ticket 5), `A-41` (« jamais d'amend » sur une ligne à part, hors des intangibles cités par le produit), `A-31` (ligne « `/security-review` : lancée » exigée dans la section de revue de toute PR qui touche un chemin sensible, renvoi sinon), `A-34`.

Précisions du ticket :

1. **Le refus d'une garde illisible**, sortie 2, sur la sortie d'erreur, une seule ligne et aucune trace de pile :

   > `<garde> : scripts/agent/<fichier> ne se charge pas (<première ligne du message de l'erreur>) : tout outil est refusé tant qu'il n'est pas restauré, la garde ne s'ouvre jamais sur un fichier cassé. La session s'arrête et le dit à qui l'a lancée ; un humain restaure depuis un terminal : git checkout origin/develop -- scripts/agent/ (ou, si le fichier cassé est déjà sur develop, depuis le dernier commit sain : git checkout <commit> -- scripts/agent/)`

   `<garde>` est le nom du fichier du hook, `<fichier>` le module qui a échoué (`regles.mjs` ou `entree.mjs`). Le code est inline dans chaque garde : un module commun d'aide pourrait être cassé lui aussi. Un module qui se charge mais lève à son évaluation (une erreur au premier niveau) est traité de même : l'import dynamique rejette.
2. **La consigne d'écriture**, dans `chaine-de-production.md`, après la l. 125 :

   > **Un fichier que les gardes chargent s'écrit d'un seul coup.** `scripts/agent/*.mjs` est importé par les hooks d'agent, qui refusent tout outil quand il ne se charge pas : écrit à moitié, il bloque la session, sa réparation comprise. La nouvelle version se prépare dans une copie hors du dépôt (scratchpad), se vérifie (`node --check <copie>`, puis `node -e "import('<copie>')"` qui réussit), puis se pose en une opération (`cp <copie> scripts/agent/<fichier>`, ou un seul `Write` du fichier entier) ; jamais une suite d'`Edit` sur le vrai fichier. Session déjà bloquée : elle s'arrête et le dit à qui l'a lancée, qui fait restaurer le fichier par un humain (`git checkout origin/develop -- scripts/agent/`) ; jamais de contournement.

   Une copie de `regles.mjs` hors du dépôt s'importe : il n'importe que des modules de Node (`regles.mjs:12-13`) et lit son contrat par un chemin relatif qui, absent, rend `{}` (`lireJson`, l. 14-23).
3. **`amendeUnCommit`** est vrai si un appel de git (`appelsGit`) a pour sous-commande `commit`, ou une sous-commande illisible, et un argument qui est `--amend` ou l'une de ses abréviations (`a.length >= 4 && '--amend'.startsWith(a.toLowerCase())` : `--am`, `--ame`, `--amen`, `--amend` ; aucune autre option longue de `commit` ne commence par `--am`). Les arguments se lisent comme au ticket 17 (mots exacts, valeurs d'options sautées) : `git commit -m "--amend"` et `git commit -m "fix --amend"` passent. `git commit --fixup=amend:<sha>` passe (il crée un commit, il n'en réécrit aucun). Raison :

   > `RAISON_AMEND` : « git commit --amend : jamais, même sur un commit pas encore poussé. Le sommet annoncé, contre-relu ou lié par « à-fusionner au sommet <sha> » doit rester dans l'historique, et un amend poussé ne repart que par un push forcé. Une correction est un nouveau commit. »

   Ordre dans `decisionDuLecteur` : `COMMANDES_INTERDITES`, `sauteLesHooks`, `ecritUneRefDeSuivi` (ticket 17), puis `amendeUnCommit`, puis les push.
4. **`motifSansSecurite({ corps, fichiers, base })`** :
   - **exigée** quand un fichier du diff touche un motif de `base.sensibles` (le contrat de la base, et pour un sujet celui d'`origin/develop`, déjà lus par `lireBase`), avec le moteur de motifs de `revue-exigee.mjs` (`regexDuMotif`, `cheminLu`, sans casse ni forme NFD) ; ou quand la base est illisible (`base.illisible`), comme `chemins-sensibles.mjs` rend alors chaque chemin sensible. Sans contrat, aucun chemin sensible : rien n'est exigé ;
   - **trouvée** quand une ligne de la forme `- \`/security-review\` : lancée` (puce `-`, `*` ou `+`, accents graves facultatifs, blancs libres autour des deux-points, suivie d'un blanc, d'une parenthèse ou de la fin de ligne, sans casse, en NFC) se tient **dans** une section « Revue de ticket » ou « Revue adversariale » : après son titre, avant le titre suivant de niveau égal ou supérieur, hors bloc de code. Une ligne « non requise », une ligne hors de la section, une ligne dans un bloc de code ne comptent pas. Attention à `\b` après `é` en JavaScript : le lire avec une anticipation qui admet un blanc, une parenthèse, une ponctuation finale ou la fin de ligne (`(?=[\s(.,;:!]|$)` : « lancée. » compte) ;
   - **le motif** : `section de revue sans la ligne « /security-review : lancée » alors que la PR touche un chemin sensible (<premier chemin>) : lancer la skill /security-review sur ce sommet, puis écrire la ligne dans la section` ;
   - **ordre** : après `motifSansRevue` (une PR sans section reçoit d'abord ce motif-là), avant `motifTitreSansCode`. `passer.sh` sort donc en 4 et la boucle renvoie la PR avec ce motif (`refus.sh`) ; `sujet.sh fusionner` de même. Une livraison de sujet, dispensée de revue (`passer.sh:184-188`), l'est aussi de cette ligne : chaque sous-PR l'a portée.
5. **La ligne `Intangibles` ne change pas** (`A-41`) : le produit l'a demandée mot pour mot (`lancement.md:91`), et le ticket 5 a mis l'amend sur la ligne « Commits : » qui la suit. Ce ticket n'y touche pas ; le banc du ticket 5 le garde.
6. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne des imports protégés et de `motifSansSecurite`, le découpage des bancs, la place exacte des phrases dans les `SKILL.md`. Elle ne tranche **pas** : la sortie 2 et l'absence d'échec ouvert, la commande de restauration du message, la sortie 0 des hooks qui ne gardent rien, les abréviations de `--amend`, la lecture de la ligne dans la section seulement, l'exigence sur base illisible, la ligne `Intangibles` laissée telle quelle.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 17 et lot 5 fusionnés. Chaque banc est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Les bancs, chacun vu rouge

Dans `ag/garde-illisible.test.mjs`, chaque hook copié dans un dossier `scripts/agent/` jouet avec ses modules (modèle : `garde-commandes.test.mjs:33-36`), titres à garder tels quels :

1. « ticket 18 : regles.mjs tronqué : chaque garde refuse (sortie 2) et dit de faire restaurer scripts/agent/, sans trace de pile » — `garde-commandes`, `garde-fichiers`, `garde-github`, chacune avec une entrée valide ; la sortie d'erreur porte `git checkout origin/develop -- scripts/agent/` et `regles.mjs`, et aucune ligne `    at `. **Rouge sur `main`** : sortie 1, trace de Node (rejoué).
2. « ticket 18 : regles.mjs qui lève à son évaluation, et entree.mjs cassé : même refus ».
3. « ticket 18 : apres-edition, fin-de-tour et demarrage sur un regles.mjs ou un entree.mjs cassé : le message, puis sortie 0 ».
4. « ticket 18 : regles.mjs sain : les gardes décident comme avant » — une commande refusée et une permise, par chaque garde.

Dans `ag/regles.test.mjs`, avec `enBranche` du ticket 17 :

5. « ticket 18 : git commit --amend est refusé, sous ses abréviations et derrière toute option globale » — `git commit --amend -m x`, `git commit --amend --no-edit`, `git commit -a --amend`, `git commit --am -m x`, `git commit --AMEND`, `git -C . commit --amend`, `git -c user.name=x commit --amend`, `git --git-dir=.git commit --amend`, `/usr/bin/git commit --amend`, `sudo git commit --amend` (si le lecteur du ticket 17 ne tient pas `sudo` devant `git`, le noter sous `## Comments` au lieu de l'ajouter ici), `git $(echo commit) --amend`, `sh -c "git commit --amend"`, chacune coupée en lignes continuées ; raison `/--amend/`. **Rouge sur `main`**.
6. « ticket 18 : un message qui cite --amend passe, comme --fixup=amend » — `git commit -m "--amend"`, `git commit -m "fix --amend"`, `git commit -F msg.txt`, `git commit --fixup=amend:HEAD~1`, `git log --grep=--amend`, `git commit --allow-empty -m x`.

Dans `fus/revue-exigee.test.mjs` :

7. « ticket 18 : chemin sensible sans la ligne /security-review : lancée dans la section de revue : refusée ; avec elle : éligible » — contrat `{ cheminsSensibles: ['infra/**'] }`, diff `infra/main.tf`, corps avec `## Revue de ticket` sans la ligne, puis avec. **Rouge sur `main`**.
8. « ticket 18 : « non requise », une ligne hors de la section ou dans un bloc de code ne comptent pas ; la ligne d'une section « Revue adversariale » compte ».
9. « ticket 18 : sans chemin sensible, rien n'est exigé ; base illisible : la ligne est exigée ; un chemin NFD ou d'une autre casse touche son motif ».
10. « ticket 18 : la CLI renvoie le motif de la ligne après celui de la section, et avant celui du titre » — par `node revue-exigee.mjs`, comme `passer.sh` l'appelle.

Dans `scripts/depot.test.mjs` :

11. « la consigne d'écriture d'un seul coup est dans le gabarit, et le paragraphe Jamais d'amend dit que la garde le refuse » ; le banc du ticket 5 (ligne « Commits : », intangibles inchangés) reste vert.

Tests existants qui changent de fixture, chacun gardé et listé dans la PR : toute PR de banc qui touche un chemin sensible d'un contrat **avec** une section de revue gagne la ligne « `/security-review` : lancée » (sur `4a45634`, les bancs de `fusionner.test.mjs:1257` et `sujet-fusionner.test.mjs:521`, `:535` n'ont pas de section : inchangés ; le relevé exact se fait au `pnpm test`).

### 2. Le code

Les imports protégés des six hooks ; `RAISON_AMEND`, `amendeUnCommit`, `decisionDuLecteur` ; `motifSansSecurite` et la CLI. Puis les textes du tableau.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici le capitaine exige une ligne de plus sur toute PR qui touche un chemin sensible, et la garde refuse une commande de plus : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Une garde d'agent qui ne peut pas charger `regles.mjs` ou `entree.mjs` refuse l'outil et dit comment sortir (faire restaurer `scripts/agent/` par un humain : `git checkout origin/develop -- scripts/agent/`), au lieu d'une trace de Node ; le gabarit `chaine-de-production.md` dit d'écrire un tel fichier d'un seul coup. La garde refuse `git commit --amend`, sous ses abréviations et derrière toute option globale de git ; le paragraphe « Jamais d'amend » du gabarit le dit. Le capitaine renvoie une PR qui touche un chemin sensible sans la ligne « `/security-review` : lancée » dans sa section de revue.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/chaine/socle-chaine-de-production/references/agent/` vers `scripts/agent/` : `garde-commandes.mjs`, `garde-fichiers.mjs`, `garde-github.mjs`, `apres-edition.mjs`, `fin-de-tour.mjs`, `demarrage.mjs`, `regles.mjs`, `regles.test.mjs`, `garde-illisible.test.mjs`, **chacun d'un seul coup** : copie à côté, `node --check`, import, puis `mv`. `scripts/agent/**` est un chemin sensible : contre-revue et `/security-review`.
  3. Reposer `/maj-skills:fusionner poser` (`revue-exigee.mjs`). Toute PR du projet qui touche un chemin sensible porte désormais la ligne « `/security-review` : lancée » dans sa section de revue : le dire aux sessions en cours, et relancer le capitaine une fois la PR entrée dans develop.
  4. Recopier dans `docs/agents/chaine-de-production.md` le paragraphe « Un fichier que les gardes chargent s'écrit d'un seul coup » et la dernière phrase du paragraphe « Jamais d'amend » du gabarit, et la ligne « Hooks d'agent » du fragment `claude-md-fusion.md` dans `CLAUDE.md`, si le projet les a gardées telles quelles.
  5. `node --test scripts/agent/*.test.mjs scripts/chaine/revue-exigee.test.mjs` : vert.

  **Iroki**, hors du plugin : ses consignes « Jamais d'amend » (#634) et « s'écrit d'un seul coup » (#653, `docs/agents/chaine-de-production.md:124`, `:126`) sont couvertes par ce gabarit et par la garde ; sa garde lit encore les commandes par expressions, et la repose de `regles.mjs` suppose son passage à la lecture par jetons (ticket 17).
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Garde illisible : refus, message, aucune trace | `skills/chaine/socle-chaine-de-production/references/agent/garde-illisible.test.mjs` « ticket 18 : regles.mjs tronqué : chaque garde refuse (sortie 2) et dit de faire restaurer scripts/agent/, sans trace de pile » |
| Module qui lève, `entree.mjs` cassé | idem, « ticket 18 : regles.mjs qui lève à son évaluation, et entree.mjs cassé : même refus » |
| Module chargé sans ses exports ; erreur inattendue d'une garde (contre-relecture, B1) | idem, « ticket 18 (contre-relecture B1) : un module qui se charge sans ses exports (coupé en fin de ligne avant un export, exports retirés, vide) : les gardes refusent (sortie 2), jamais 1 » et « ticket 18 (contre-relecture B1) : une erreur inattendue dans une garde la fait refuser (sortie 2), jamais 1, sans trace de pile » |
| Hooks qui ne gardent rien | idem, « ticket 18 : apres-edition, fin-de-tour et demarrage sur un regles.mjs ou un entree.mjs cassé : le message, puis sortie 0 » |
| Pas de changement sur un fichier sain | idem, « ticket 18 : regles.mjs sain : les gardes décident comme avant » |
| `--amend` refusé | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « ticket 18 : git commit --amend est refusé, sous ses abréviations et derrière toute option globale » |
| Pas de faux refus | idem, « ticket 18 : un message qui cite --amend passe, comme --fixup=amend » |
| Ligne `/security-review` exigée | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, bancs 7 à 9 |
| La CLI que joue le capitaine | idem, banc 10 |
| Textes du gabarit ; intangibles inchangés | `scripts/depot.test.mjs`, banc 11, et le banc du ticket 5 |
| Monotonie de la garde | les tests existants de `regles.test.mjs` et `garde-commandes.test.mjs`, et ceux du ticket 17, inchangés |

## Vérification

1. Ciblée : `node --test skills/chaine/socle-chaine-de-production/references/agent/*.test.mjs skills/chaine/fusionner/scripts/revue-exigee.test.mjs scripts/depot.test.mjs`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli ; aucun refus de la garde retiré.
3. **Non-régression des laissez-passer**, comme la Vérification 3 du ticket 17 : chaque commande `git commit …` des `SKILL.md` et des `references/**/*.md` du plugin, jouée avant et après ; toute commande refusée par la branche et pas par `main` est nommée dans la PR, avec sa raison.
4. **Mutations**, jouées sur une copie jetable, vues rouges, puis annulées, listées dans la PR : l'import protégé rend une garde ouverte (sortie 0) sur un module cassé (banc 1) ; `amendeUnCommit` lit les arguments sur L2 (banc 6) ; `motifSansSecurite` accepte « non requise » (banc 8) ; la ligne lue hors de la section (banc 8).
5. `graphify update .`
6. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
7. **`/security-review`, obligatoire** : les gardes sont un chemin sensible du gabarit (`scripts/agent/**`), et `revue-exigee.mjs` décide de ce que le capitaine laisse entrer. Son rendu va dans une section `## Sécurité` de la PR, chaque constat suivi de son test ; et la section de revue porte elle-même la ligne « `/security-review` : lancée ».
8. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): garde illisible qui dit comment sortir, amend refusé, /security-review vérifié (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Les options globales de git et les autres façons de sauter les hooks : ticket 17.
- Une vérification que `/security-review` a réellement tourné : la ligne est déclarative (`A-31`) ; elle se voit et se renvoie, elle ne se prouve pas.
- Un amend fait sans `git commit --amend` (`git reset --soft HEAD~1` puis `git commit`, `git commit --fixup` puis un rebase) : ces gestes ont des usages légitimes ; le push forcé qui publierait la réécriture reste refusé.
- `fusionner/SKILL.md` (l. 60, liste des refus corrigeables) : fichier chaud des tickets 1, 8 et 9 ; le motif de `revue-exigee.mjs` se dit lui-même au renvoi.
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, après relecture des gardes, de `regles.mjs`, `revue-exigee.mjs`, des sections de PR et des consignes sur `4a45634`, et des consignes d'Iroki #634 et #653. Rejoué sur `4a45634` : un `regles.mjs` tronqué fait sortir les trois gardes en 1 avec une trace de Node ; quatre formes de `--amend` passent la garde. Écarts avec la spec et choix à confirmer :
  - **D18 ne vise pas que `garde-commandes.mjs:5`** : `garde-fichiers.mjs:5` et `garde-github.mjs:12` importent aussi `regles.mjs` en statique, et les trois `entree.mjs` ; `apres-edition.mjs` et `fin-de-tour.mjs` aussi, sans rien garder. Le ticket protège les cinq, et `demarrage.mjs:22` (`entree.mjs`) avec eux : six.
  - **La consigne de `A-30` est au ticket 5** (`A-41` : ligne « Commits : » après les intangibles, inchangés, et paragraphe « Jamais d'amend ») ; ce ticket n'ajoute que la garde et une phrase qui le dit. `lancement.md` sort de ses fichiers chauds.
  - **Ordre avec le ticket 16** : tranché (`A-43`), ce ticket passe avant ; le 16 range le motif de la ligne dans `motifsDuCapitaine`.
  - **`fusionner/SKILL.md`** n'est pas touché, pour ne pas croiser les tickets 1, 8 et 9 : la liste des refus corrigeables de sa l. 60 restera muette sur la ligne jusqu'à un ticket de texte.
- 2026-11-18 — Retouché après relecture (`A-43`) : `demarrage.mjs:22` protégé aussi (sixième hook, sortie 0) ; le message de restauration nomme le dernier commit sain quand le fichier cassé est déjà sur develop ; la ligne « `/security-review` : lancée » admet une ponctuation finale.
- 2026-11-18 — Livré par la session du ticket (PR #125), partie de `origin/main` à `8f8cfd9` (plugin 7.21.1, 850 tests ; 862 sur la branche à `4588545`, zéro échec : le compte de 860 de la première livraison précédait les deux bancs ajoutés à `scripts/depot.test.mjs`). Choix faits par défaut prudent (Décision 6) et écarts :
  - **L'amend est jugé avant les hooks** dans `decisionDuLecteur`, et non après `sauteLesHooks` et `ecritUneRefDeSuivi` comme le dit la Décision 3. Le ticket se contredit : son banc 5 veut la raison `/--amend/` pour `git $(echo commit) --amend`, qu'une sous-commande illisible fait aussi refuser comme hooks sautés ; dans l'ordre de la Décision 3, la raison serait celle des hooks. Les deux branches ne rendent qu'un refus : aucune commande ne passe, seul le message change (constat de la revue de sécurité). L'ordre n'est pas dans la liste de ce que la fille ne tranche pas.
  - **Forme des imports protégés** : dans chaque hook, une fonction `charger(fichier)` inline (import dynamique relatif au hook, suivi de `.catch(…)`), puis `entree.mjs` et `regles.mjs` dans cet ordre, avant toute autre chose ; l'import facultatif d'`identifiants.mjs` ne change pas. Le message suit la mineure (b) de l'architecte : « depuis le dernier commit où les gardes se chargent, jamais en contournant la garde : git checkout origin/develop -- scripts/agent/ si develop est sain, sinon git checkout <commit> -- scripts/agent/ ». Les six hooks relevés sur main : `garde-commandes`, `garde-fichiers`, `garde-github` (sortie 2), `apres-edition`, `fin-de-tour`, `demarrage` (sortie 0) ; aucun autre fichier n'importe `regles.mjs` ou `entree.mjs`.
  - **`motifSansSecurite`** s'appuie sur deux fonctions exportées, `cheminSensible` (moteur de `cheminExige` ; citation mal formée : sensible) et `aLigneSecurite` (section suivie par niveau de titre, blocs de code sautés ; anticipation `(?=[\s(.,;:!?…]|$)`, blancs insécables compris : mineure (c)). Une parité est ajoutée à `scripts/depot.test.mjs` : la ligne des deux gabarits de section, « lancée (chemins : …) », se lit lancée ; « non requise », non.
  - **Fixtures changées** : `regles.test.mjs` l. 471 et l. 1463 affirmaient que `git commit --amend --no-edit` passe (elles gardaient `--no-edit` d'une lecture comme `--no-verify`) ; elles deviennent `git commit --no-edit`, même intention, et l'amend est au banc 5. Aucune autre fixture ne change (le relevé du `pnpm test` n'en trouve aucune).
  - **`echo git commit --amend` est refusé**, comme `echo git commit --no-verify` l'est déjà (le lecteur lit git partout dans un segment, par prudence) : retiré du banc 6, qui garde `git commit -m "--amend"`, `-m "fix --amend"`, `--message=--amend`, `--fixup=amend:` et `-- --amend`. `sudo git commit --amend` est tenu par le lecteur du ticket 17.
  - **CONTENU.md** : la phrase « Quand une garde casse » conseillait `claude --settings '{"disableAllHooks": true}'` ; remplacée par le refus qui dit comment sortir, sans contournement.
  - **Version** : 7.22.0 pris sur 7.21.1 ; `main` a pris 7.22.0 entre-temps (#123) : à la fusion d'`origin/main`, au signal de l'architecte, la version passe à la suivante de celle de main.
  - Vérification 3 : 24 commandes `git commit …` des `SKILL.md` et `references/**/*.md`, jouées sur main puis sur la branche ; seule `git commit --amend` (citée comme interdite) devient refusée.
- 2026-11-18 — Contre-relecture de l'architecte sur `4588545` : non conforme, un bloquant ; l'ordre « amend avant les hooks » est accepté (`A-52`). Corrigé dans la PR #125 :
  - **B1** — un module qui se charge sans l'export attendu (coupé en fin de ligne avant un export, export retiré, fichier vide) passait l'import, puis la garde sortait en 1 sur un `TypeError` ; les bancs ne le voyaient pas (`tronque` coupe au milieu d'un caractère, donc toujours une `SyntaxError`). `charger(fichier, attendus)` vérifie chaque nom lu et son type (`function`, `string`, `object`) : un nom manquant refuse (sortie 2) pour les trois gardes, saute le hook (sortie 0) pour les trois autres ; filet en tête des trois gardes, `uncaughtException` et `unhandledRejection`, qui refusent en 2 avec la consigne de sortie, jamais 1. Bancs 5 et 6 de `garde-illisible.test.mjs`, rouges avant le code ; deux mutations de plus (sans la vérification des exports : banc 5 rouge ; sans le filet : banc 6 rouge). La consigne d'écriture du gabarit vérifie les exports après l'import (`Object.keys` de la copie comparé au fichier en place).
  - Mineurs : `apres-edition`, `fin-de-tour` et `demarrage` disent « ce hook est sauté » (les gardes, elles, refusent) ; `printf -- "--amend\n" | xargs git commit --no-edit` est cité dans « Restent hors de sa lecture » de `CONTENU.md` ; `grep -rn "git commit --amend" docs` est refusé comme `grep -rn "git commit --no-verify" docs` (même lecteur, parité gardée et dite dans `CONTENU.md`), `grep -- --amend` passe ; la ligne « `/security-review` : lancée » ne compte plus quand le gabarit est recopié sans choisir (« | non requise » ou `…` laissés) ni dans un commentaire HTML (banc 11 de `revue-exigee.test.mjs`) ; `pieges.md` ne conseille plus `disableAllHooks` (un banc de `scripts/depot.test.mjs` le garde pour les trois documents) ; `fusionner/references/CONTENU.md` décrit la ligne et ses bancs ; le paragraphe « Jamais d'amend » ne dit le refus qu'une fois (« La garde (`garde-commandes`) refuse l'un et l'autre. ») ; un seul geste de pose, le `cp` depuis la copie hors du dépôt, dans le gabarit comme dans la note de version.
  - `pnpm test` : 865 tests, zéro échec (862 + les bancs 5 et 6 de `garde-illisible.test.mjs` et le banc 11 de `revue-exigee.test.mjs`).
  - `garde-illisible.test.mjs` entre dans `EXCEPTIONS_SAUT` de `scripts/depot.test.mjs` : il rejoue `git commit --no-verify -m x` sur un `regles.mjs` cassé, refusé.
