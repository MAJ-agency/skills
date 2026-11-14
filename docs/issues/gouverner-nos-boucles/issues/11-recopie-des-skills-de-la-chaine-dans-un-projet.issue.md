# Le dépôt `skills` recopie les skills de la chaîne dans un projet, et ouvre la PR à chaque version

Status: ready-for-agent
Type: feature
Modèle: sonnet
Fichiers chauds: `scripts/recopier-skills.mjs`, `scripts/recopier-skills.test.mjs`, `scripts/recopie-projets.json`, `scripts/depot.test.mjs`, `.github/workflows/recopier-skills.yml`, `docs/agents/recopie-des-skills.md`

## Le besoin

Décision `P-20` du produit : les skills restent privés et voyagent avec chaque projet. Ils sont recopiés dans `.claude/skills/` de chaque projet, et c'est ce dépôt qui pousse la mise à jour : un workflow refait la copie dans chaque projet d'une liste tenue ici et y ouvre une PR, que le capitaine du projet fusionne.

Aujourd'hui, une session créée par une autre ne reçoit que le dépôt du projet et démarre sans les skills de la chaîne : elle doit attacher ce dépôt par `add_repo`, ce qui a été refusé deux fois le 2026-11-13.

Quand le ticket est fait, une commande de ce dépôt pose la copie dans le clone d'un projet, avec un manifeste qui la déclare, et un workflow joue cette commande pour chaque projet de la liste puis ouvre la PR.

Ce ticket ne touche à aucun projet, ni aux gabarits du socle : le refus du hook, le contrôle de `pnpm check` et la ligne de `CLAUDE.md` sont le ticket 12.

## Où

Lignes de `origin/main` à `1446a13` (2026-11-14). Tous les fichiers sont nouveaux, sauf `scripts/depot.test.mjs`.

### La commande : `scripts/recopier-skills.mjs`

`node scripts/recopier-skills.mjs <dossier du projet> [--remplacer] [--source <racine d'un dépôt skills>]`. Un seul fichier : il exporte ses fonctions et ne joue la commande que lancé directement (même garde que `skills/chaine/chantier/scripts/plafonds.mjs`). `--source` vaut par défaut le dépôt qui contient le script ; le banc s'en sert pour jouer la commande sur un faux dépôt `skills` temporaire.

- **La source est ce que git suit** : les fichiers rendus par `git ls-files` sous `skills/chaine/` de la source, groupés par dossier de premier niveau ; un dossier compte s'il porte un `SKILL.md` suivi (dix aujourd'hui : `anchorpost`, `architecte`, `chantier`, `fusionner`, `recette-humaine`, `revue-adversariale`, `revue-de-ticket`, `socle-chaine-de-production`, `sujet`, `tickets`). Un fichier non suivi (`.DS_Store`, `node_modules`) n'est jamais copié. Les skills hors de `skills/chaine/` ne sont pas copiés.
- **La copie est identique** : vers `<projet>/.claude/skills/<nom>/`, même arborescence, mêmes octets, bit exécutable de la source. Rien n'est réécrit dans les fichiers. `.claude/skills/` est créé s'il manque, `.claude/` aussi.
- **Miroir strict** : après la commande, chaque dossier recopié contient exactement les fichiers de la source. Un fichier en trop est supprimé, un fichier modifié est réécrit, sans refus. Un skill nommé par le manifeste précédent du projet et absent de la source voit son dossier supprimé.
- **Rien d'autre n'est touché** : un dossier de `.claude/skills/` que ni la source ni le manifeste précédent ne nomment est un skill propre au projet, la commande ne le lit ni ne l'écrit.
- **Le manifeste** : `<projet>/.claude/skills/maj-skills.json`, écrit par `JSON.stringify(objet, null, 2)` suivi d'une fin de ligne. Clés du premier niveau dans cet ordre : `$comment`, `source`, `version`, `skills`, `fichiers`. `skills` : les noms copiés, triés. `fichiers` : pour chaque fichier copié, sa clé est son chemin relatif à `.claude/skills/` avec des barres obliques, sa valeur le sha256 de ses octets en hexadécimal ; clés triées. Les deux tris sont ceux de `Array.prototype.sort()` sans argument. Aucune date, aucun identifiant de commit : la même source donne le même manifeste, octet pour octet.

  ```json
  {
    "$comment": "Copie générée depuis MAJ-agency/skills par scripts/recopier-skills.mjs. Ne pas modifier : une modification se fait dans skills, la copie arrive par PR.",
    "source": "MAJ-agency/skills",
    "version": "5.0.2",
    "skills": [
      "anchorpost",
      "architecte"
    ],
    "fichiers": {
      "anchorpost/SKILL.md": "<64 caractères hexadécimaux>"
    }
  }
  ```

  `version` est celle de `.claude-plugin/plugin.json` de la source.

- **Codes de sortie.** `0` : la copie est à jour ou vient d'être refaite. `1` : refus, rien n'est écrit, la raison sur la sortie d'erreur. `2` : usage (argument manquant, option inconnue, dossier du projet absent ou qui n'est pas un dossier), une ligne d'usage sur la sortie d'erreur.
- **Les refus (code 1)** :
  - `<projet>/.claude/skills/<nom>/` existe pour un skill de la source alors que le manifeste précédent ne le nomme pas, ou qu'il n'y a pas de manifeste : chaque dossier en cause est nommé. `--remplacer` lève ce refus, et le dossier est alors remplacé en entier.
  - le manifeste précédent est illisible (JSON invalide, ou sans tableau `skills`) : le fichier est nommé. `--remplacer` le traite comme absent. Son champ `source` n'est pas contrôlé.
  - un lien symbolique : dans la source (mode `120000` de `git ls-files -s`), ou côté projet si `.claude`, `.claude/skills` ou `.claude/skills/<nom>` en est un.
- **Sortie standard** : une ligne par skill de la source ou du manifeste précédent, `<nom> : copié`, `<nom> : à jour` ou `<nom> : supprimé`, puis une ligne `maj-skills <version>`. Au second passage sur une copie intacte, les dix lignes disent « à jour » et aucun octet du projet ne change (réécrire à l'identique est permis).

**Connu, hors de ce ticket** : la copie sert à lire les skills et leurs références ; elle n'est pas faite pour exécuter ses scripts sur place. Deux scripts cherchent un fichier hors de `skills/chaine/` (`skills/chaine/fusionner/scripts/identifiant.mjs:27`, `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs:16`) et ne le trouveront pas dans un projet, qui joue ses scripts depuis `scripts/chaine/`. Ne pas le corriger.

### La liste des projets : `scripts/recopie-projets.json`

```json
{
  "$comment": "Projets qui reçoivent la copie des skills de la chaîne. Ajouter un projet : docs/agents/recopie-des-skills.md.",
  "projets": [
    { "depot": "MAJ-agency/anchorpost", "branche": "develop" },
    { "depot": "MAJ-agency/iroki-monorepo", "branche": "develop" }
  ]
}
```

`fedora` n'y est pas : sa chaîne est d'une version antérieure, il entre dans la liste après son alignement.

### Le workflow : `.github/workflows/recopier-skills.yml`

- **Déclencheurs** : `push` sur `main` limité au chemin `.claude-plugin/plugin.json`, et `workflow_dispatch`. Aucun `pull_request`. Les jobs ne tournent que sur `refs/heads/main` (condition `if:` au niveau du job) : un lancement à la main depuis une autre branche ne copie rien.
- **`permissions: contents: read`** : le jeton du workflow ne fait que lire ce dépôt. Toute écriture dans un projet passe par le secret `RECOPIE_TOKEN`.
- **Deux jobs.** Le premier lit `scripts/recopie-projets.json` et écrit le tableau `projets` dans `$GITHUB_OUTPUT`. Le second en dépend (`needs`), avec `strategy.matrix` lue par `fromJSON(needs.<job>.outputs.<sortie>)` et `fail-fast: false`. `concurrency` au niveau de ce second job, un groupe par dépôt de projet, `cancel-in-progress: false`. Limite acceptée : GitHub ne garde qu'une exécution en attente par groupe ; la dernière gagne, et elle copie l'état de `main`.
- **Étapes du second job**, dans l'ordre :
  1. vérifier que le jeton n'est pas vide, sinon échouer avec « jeton d'écriture absent (secret RECOPIE_TOKEN) : voir docs/agents/recopie-des-skills.md ». Un secret ne se lit pas dans un `if:` : il arrive par `env:` et se teste en shell ;
  2. récupérer ce dépôt, `persist-credentials: false` ;
  3. `actions/setup-node`, `node-version: 22`, **sans** `cache` (celui de `ci.yml` exige `pnpm/action-setup`, inutile ici : la commande n'a aucune dépendance) ;
  4. récupérer le projet sur sa branche, dans un sous-dossier, avec `token: ${{ secrets.RECOPIE_TOKEN }}`. Cette récupération garde son jeton : c'est lui qui pousse. C'est la seule exception à `persist-credentials: false` ; un commentaire le dit ;
  5. jouer `node scripts/recopier-skills.mjs <sous-dossier>` ;
  6. si `git check-ignore -q .claude/skills/maj-skills.json` réussit dans le projet, échouer avec « .claude/skills/ est ignoré par git dans ce projet : voir docs/agents/recopie-des-skills.md » ;
  7. si le projet n'a aucun changement (`git status --porcelain` vide), finir en succès en le disant ;
  8. sinon : identité `github-actions[bot]` (`41898282+github-actions[bot]@users.noreply.github.com`), commit `chore(skills): recopie de maj-skills <version>` sur la branche `chore/recopie-maj-skills`, poussée en écrasant l'ancienne (`--force`) ;
  9. s'il n'y a pas de PR ouverte depuis cette branche : `gh pr create` avec `--repo`, `--head`, `--base`, `--title`, `--body`, `--label à-fusionner` explicites. Sinon `gh pr edit` : le titre et le corps sont remis à la version courante, et `à-fusionner` est reposé (`--add-label`). Le workflow ne retire aucun label.
- **La PR** : même titre que le commit ; corps de trois lignes au plus, qui donne la version, renvoie à `docs/agents/recopie-des-skills.md` de ce dépôt et dit que la copie ne se modifie pas dans le projet.
- **Le workflow ne compare pas les versions** : il ouvre ou met à jour la PR dès que la copie du projet diffère de `main`, même à version égale.
- **Hygiène** : actions épinglées par empreinte de 40 caractères avec la version en commentaire (reprendre les empreintes de `ci.yml` pour `actions/checkout` et `actions/setup-node`) ; aucune expression `${{ }}` dans un `run:`, ni sur sa ligne ni dans le corps d'un bloc `run: |`, les valeurs passent par `env:` (`GH_TOKEN` pour `gh`) ; toute ligne du fichier qui contient `secrets.` a la forme `<clé>: ${{ secrets.RECOPIE_TOKEN }}`.

### Le banc du dépôt : `scripts/depot.test.mjs`

- `runAvecExpression` (ligne 62) ne lit aujourd'hui que la ligne qui porte `run:` : une expression dans le corps d'un bloc `run: |` ou `run: >` lui échappe. L'étendre au corps des blocs (les lignes plus indentées que la clé `run:`, jusqu'au retour à son indentation), avec ses cas piégés dans le test « lecteurs du workflow : entrées piégées » (ligne 74), à la manière des cas existants.
- Les deux tests d'hygiène (lignes 100 à 110) lisent le seul `ci.yml` (constante `CI`, ligne 58) : ils lisent désormais chaque fichier de `.github/workflows/`. Le test « se lance sur toute PR vers main et joue pnpm test » reste propre à `ci.yml`.
- Trois tests nouveaux sur `recopier-skills.yml` : ses deux déclencheurs, le filtre de chemin et l'absence de `pull_request` ; `permissions` réduit à `contents: read` ; la forme des lignes qui contiennent `secrets.`. Un lecteur nouveau reçoit ses cas piégés.

### Le mode d'emploi : `docs/agents/recopie-des-skills.md`

Une page, en français, phrases entières : ce qui est copié et où ; le manifeste ; la règle « la copie ne se modifie pas dans le projet » ; ce que la copie n'est pas (un endroit où exécuter les scripts) ; comment ajouter un projet à la liste ; comment lancer le workflow à la main ; la limite de la file ; et deux listes.

- **Avant sa première copie, un projet** : lève l'exclusion de git (le `.gitignore` du socle porte `.claude/*` ligne 2 : ajouter `!.claude/skills/`) ; exclut `.claude/skills/` d'`eslint` et de `prettier` (constat du 2026-11-14 : les scripts copiés font échouer `eslint .` d'`anchorpost`) ; a les labels de la chaîne, dont `à-fusionner` (`skills/chaine/socle-chaine-de-production/references/labels.sh`).
- **Le réglage unique d'un administrateur** : un jeton à accès fin limité aux dépôts de la liste, droits « Contents » et « Pull requests » en lecture et écriture, enregistré comme secret d'Actions `RECOPIE_TOKEN` de ce dépôt.

## Décisions

- `P-20` du produit, et les choix de l'architecte qui en découlent, tous écrits ci-dessus : tout `skills/chaine/` à l'identique (les scripts de `fusionner` et de `sujet` s'appellent par `../../<autre>/scripts/`, la copie garde cette disposition) ; un manifeste ; le refus d'écraser un dossier que la commande n'a pas posé ; une seule PR de recopie ouverte par projet, sur une branche fixe.
- Le jeton par défaut d'un workflow ne peut pas écrire dans un autre dépôt, et une PR qu'il ouvre ne lance pas la CI du projet : d'où le secret.
- La version du plugin ne bouge pas dans ce ticket : elle monte une fois, avec le dernier ticket du lot.
- Aucune dépendance nouvelle : `node:fs`, `node:crypto`, `node:path`, `node:child_process` pour `git`, et `gh` et `git` déjà présents sur le runner.
- Le workflow ne peut pas être essayé avant que le secret existe : ce ticket livre le fichier et ses contrôles statiques. Son premier passage réel est suivi par l'architecte.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la commande, sur un faux dépôt `skills` temporaire (`git init`, fichiers suivis) passé par `--source` | `scripts/recopier-skills.test.mjs` : copie neuve (mêmes chemins, mêmes octets, manifeste dans l'ordre et les tris dits, à la version donnée) ; second passage sans octet changé et dix lignes « à jour » ; fichier en trop supprimé, fichier modifié réécrit ; fichier puis skill retirés de la source, retirés de la copie ; skill propre au projet intact ; fichier non suivi de la source non copié ; refus d'écraser (code 1, dossier nommé, rien d'écrit) puis `--remplacer` ; manifeste précédent illisible (code 1, puis `--remplacer`) ; bit exécutable conservé ; lien symbolique refusé, côté source et côté projet ; usage (code 2) |
| la commande, sur ce dépôt | un test du même banc : sans `--source`, vers un projet temporaire, les skills copiés sont exactement les entrées de `.claude-plugin/plugin.json` qui commencent par `./skills/chaine/` |
| la liste des projets | un test du même banc : chaque entrée a un `depot` de la forme `MAJ-agency/<nom>` et une `branche` non vide |
| le workflow | `scripts/depot.test.mjs` : le lecteur de `run:` étendu et ses cas piégés, les deux tests d'hygiène sur tous les workflows, les trois tests nouveaux |
| le mode d'emploi | un test du banc de la commande : `docs/agents/recopie-des-skills.md` nomme `RECOPIE_TOKEN`, `scripts/recopie-projets.json`, `.claude/skills/maj-skills.json` et `!.claude/skills/` |

## Vérification

- `pnpm test` vert, sans test retiré ni désactivé. Le motif `'scripts/*.test.mjs'` de `package.json` prend déjà le banc nouveau : `package.json` ne change pas.
- Essai à la main, à citer dans le corps de la PR : `node scripts/recopier-skills.mjs <un dossier temporaire vide>` pose dix dossiers et le manifeste ; un second passage dit dix fois « à jour ».
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Comments

- 2026-11-14, architecte — Relu par un agent neuf (verdict « à compléter », dix-sept points) ; ticket réécrit avec les dix-sept points fermés : exclusion de git dans les projets, lecture du secret, lecteur des blocs `run:`, matrice en deux jobs, identité du commit, mise à jour de la PR, déclencheurs, ordre du manifeste, miroir strict, manifeste illisible, usage, source limitée à ce que git suit, preuves par `--source`, sortie, `setup-node` sans cache, `main` à `1446a13`, copie non exécutable sur place.
