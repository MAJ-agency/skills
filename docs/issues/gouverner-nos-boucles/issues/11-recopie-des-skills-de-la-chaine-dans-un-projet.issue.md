# Le dépôt `skills` recopie les skills de la chaîne dans un projet, et ouvre la PR à chaque version

Status: ready-for-agent
Type: feature
Modèle: sonnet
Fichiers chauds: `scripts/recopier-skills.mjs`, `scripts/recopier-skills-regles.mjs`, `scripts/recopier-skills.test.mjs`, `scripts/recopie-projets.json`, `scripts/depot.test.mjs`, `.github/workflows/recopier-skills.yml`, `docs/agents/recopie-des-skills.md`

## Le besoin

Décision `P-20` du produit (carte du programme, [`../map.md`](../map.md)) : les skills restent privés et voyagent avec chaque projet. Ils sont recopiés dans `.claude/skills/` de chaque projet, et c'est ce dépôt qui pousse la mise à jour : à chaque nouvelle version du plugin, un workflow refait la copie dans chaque projet d'une liste tenue ici et y ouvre une PR, que le capitaine du projet fusionne.

Aujourd'hui, une session créée par une autre ne reçoit que le dépôt du projet et démarre sans les skills de la chaîne : elle doit attacher ce dépôt par `add_repo`, ce qui a été refusé deux fois le 2026-11-13.

Quand le ticket est fait, une commande de ce dépôt pose la copie dans le clone d'un projet, avec un manifeste qui la déclare, et un workflow joue cette commande pour chaque projet de la liste puis ouvre la PR.

Ce ticket ne touche à aucun projet, ni aux gabarits du socle : le refus du hook, le contrôle de `pnpm check` et la ligne de `CLAUDE.md` (troisième pièce de `P-20`) sont le ticket 12.

## Où

Lignes de `origin/main` à `0a39329` (2026-11-13). Tous les fichiers sont nouveaux, sauf `scripts/depot.test.mjs`.

### La commande : `scripts/recopier-skills.mjs`

`node scripts/recopier-skills.mjs <dossier du projet> [--remplacer]`. La logique vit dans `scripts/recopier-skills-regles.mjs`, en fonctions qui reçoivent leurs chemins (la source, le projet, la version) : le banc les joue sur des arbres temporaires, jamais sur le vrai `skills/chaine/`.

- **Ce qui est copié** : chaque dossier de `skills/chaine/` qui porte un `SKILL.md` (dix aujourd'hui : `anchorpost`, `architecte`, `chantier`, `fusionner`, `recette-humaine`, `revue-adversariale`, `revue-de-ticket`, `socle-chaine-de-production`, `sujet`, `tickets`), en entier et à l'identique, vers `<projet>/.claude/skills/<nom>/`, même arborescence, mêmes octets, bit exécutable conservé. Rien n'est réécrit dans les fichiers. Les skills hors de `skills/chaine/` ne sont pas copiés.
- **Le manifeste** : `<projet>/.claude/skills/maj-skills.json`, écrit par la commande, en JSON indenté de deux espaces avec une fin de ligne finale, clés triées :

  ```json
  {
    "$comment": "Copie générée depuis MAJ-agency/skills par scripts/recopier-skills.mjs. Ne pas modifier : une modification se fait dans skills, la copie arrive par PR.",
    "source": "MAJ-agency/skills",
    "version": "5.0.1",
    "skills": ["anchorpost", "architecte"],
    "fichiers": { "anchorpost/SKILL.md": "<sha256 du contenu, en hexadécimal>" }
  }
  ```

  `version` est celle de `.claude-plugin/plugin.json`. `fichiers` liste chaque fichier copié, chemin relatif à `.claude/skills/`, barres obliques. Aucune date, aucun identifiant de commit : la même source donne le même manifeste, octet pour octet.

- **Miroir** : un fichier disparu de la source disparaît de la copie ; un skill nommé par le manifeste précédent du projet et absent de la source voit son dossier supprimé.
- **Rien d'autre n'est touché** : un dossier de `.claude/skills/` que ni la source ni le manifeste précédent ne nomment est un skill propre au projet, la commande ne le lit ni ne l'écrit.
- **Refus d'écraser** : si `<projet>/.claude/skills/<nom>/` existe pour un skill de la source alors que le manifeste précédent ne le nomme pas (ou qu'il n'y a pas de manifeste), la commande sort en 1, nomme chaque dossier en cause et n'écrit rien. `--remplacer` lève ce refus.
- **Lien symbolique** dans la source : la commande sort en 1 sans rien écrire.
- **Sortie** : une ligne par skill copié ou supprimé, puis la version ; code 0 quand la copie est à jour ou vient d'être refaite.

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

`fedora` n'y est pas (décision `A-36` de la carte).

### Le workflow : `.github/workflows/recopier-skills.yml`

- **Déclencheurs** : `push` sur `main` limité au chemin `.claude-plugin/plugin.json`, et `workflow_dispatch`. Aucun `pull_request`.
- **`permissions: contents: read`** : le jeton du workflow ne fait que lire ce dépôt. Toute écriture dans un projet passe par le secret `RECOPIE_TOKEN`.
- **Un job par projet** de la liste (matrice lue dans `scripts/recopie-projets.json`, `fail-fast: false`), et une file par projet (`concurrency`, sans annulation).
- **Étapes d'un job** : vérifier que `RECOPIE_TOKEN` n'est pas vide, sinon échouer avec la phrase « secret RECOPIE_TOKEN absent : voir docs/agents/recopie-des-skills.md » ; récupérer ce dépôt ; récupérer le projet sur sa branche, dans un sous-dossier, avec le secret ; jouer la commande ; si le projet n'a aucun changement (`git status --porcelain` vide), finir en succès en le disant ; sinon créer le commit `chore(skills): recopie de maj-skills <version>` sur la branche `chore/recopie-maj-skills`, la pousser en écrasant l'ancienne, puis ouvrir la PR vers la branche du projet, ou mettre à jour le titre de celle qui est déjà ouverte depuis cette branche.
- **La PR** : même titre que le commit ; label `à-fusionner` ; corps de trois lignes au plus, qui donne la version, renvoie à `docs/agents/recopie-des-skills.md` de ce dépôt et dit que la copie ne se modifie pas dans le projet.
- **Hygiène**, celle de `ci.yml` : actions épinglées par empreinte de 40 caractères avec la version en commentaire (reprendre les empreintes de `ci.yml` pour `actions/checkout` et `actions/setup-node`) ; aucune expression `${{ }}` dans un `run:`, les valeurs passent par `env:` ; `persist-credentials: false` sur la récupération de ce dépôt ; le secret n'apparaît dans aucune ligne de commande.

### Le banc du dépôt : `scripts/depot.test.mjs`

Les deux tests d'hygiène (lignes 100 à 110 : aucune expression dans un `run:`, actions épinglées) lisent aujourd'hui le seul `ci.yml` (constante `CI`, ligne 58). Ils lisent désormais chaque fichier de `.github/workflows/`. Le test « se lance sur toute PR vers main et joue pnpm test » reste propre à `ci.yml`. Trois assertions nouvelles sur `recopier-skills.yml` : ses deux déclencheurs et l'absence de `pull_request` ; `permissions` réduit à `contents: read` ; la chaîne `RECOPIE_TOKEN` absente de toute ligne `run:`.

### Le mode d'emploi : `docs/agents/recopie-des-skills.md`

Une page, en français, phrases entières : ce qui est copié et où ; le manifeste ; la règle « la copie ne se modifie pas dans le projet » ; ce qu'un projet doit avoir fait avant sa première copie (exclure `.claude/skills/` d'`eslint` et de `prettier` : constat du 2026-11-14, les scripts copiés font échouer `eslint .` d'`anchorpost`) ; comment ajouter un projet à la liste ; comment lancer le workflow à la main ; le réglage unique d'un administrateur, à savoir un jeton à accès fin limité aux dépôts de la liste, droits « Contents » et « Pull requests » en lecture et écriture, enregistré comme secret d'Actions `RECOPIE_TOKEN` de ce dépôt.

## Décisions

- `P-20` de la carte, et les décisions `A-32` à `A-37` : tout `skills/chaine/` à l'identique (`A-32`, les scripts de `fusionner` et de `sujet` s'appellent par `../../<autre>/scripts/`, la copie doit garder cette disposition) ; le manifeste (`A-33`) ; le refus d'écraser (`A-34`) ; une seule PR de recopie ouverte par projet, sur une branche fixe (`A-35`) ; `fedora` hors de la liste (`A-36`) ; l'exclusion d'`eslint` et de `prettier` côté projet (`A-37`).
- Le jeton par défaut d'un workflow ne peut pas écrire dans un autre dépôt, et une PR qu'il ouvre ne lance pas la CI du projet : d'où le secret.
- La version du plugin ne bouge pas dans ce ticket (`A-1` : une montée par lot, elle vient avec le dernier ticket du lot).
- Aucune dépendance nouvelle : `node:fs`, `node:crypto`, `node:path`, et `gh` et `git` déjà présents sur le runner.
- Le workflow ne peut pas être essayé avant que le secret existe : ce ticket livre le fichier et ses contrôles statiques. Son premier passage réel est suivi par l'architecte.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la commande, sur un arbre temporaire | `scripts/recopier-skills.test.mjs` : copie neuve (mêmes chemins, mêmes octets, manifeste trié à la version donnée) ; second passage sans aucun octet changé ; fichier puis skill retirés de la source, retirés de la copie ; skill propre au projet intact ; refus d'écraser (code 1, dossier nommé, rien d'écrit) puis `--remplacer` ; bit exécutable conservé ; lien symbolique refusé |
| la commande, sur le vrai dépôt | un test : les skills copiés sont exactement les entrées de `.claude-plugin/plugin.json` qui commencent par `./skills/chaine/` |
| la liste des projets | un test : chaque entrée a un `depot` de la forme `MAJ-agency/<nom>` et une `branche` non vide |
| le workflow | les deux tests d'hygiène étendus à tous les workflows, et les trois assertions nouvelles, dans `scripts/depot.test.mjs` |
| le mode d'emploi | `docs/agents/recopie-des-skills.md` nomme `RECOPIE_TOKEN`, `scripts/recopie-projets.json` et `.claude/skills/maj-skills.json` |

## Vérification

- `pnpm test` vert, sans test retiré ni désactivé. Le motif `'scripts/*.test.mjs'` de `package.json` prend déjà le banc nouveau : `package.json` ne change pas.
- Essai à la main, à citer dans le corps de la PR : `node scripts/recopier-skills.mjs <un dossier temporaire vide>` pose dix dossiers et le manifeste ; un second passage n'écrit rien.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Comments
