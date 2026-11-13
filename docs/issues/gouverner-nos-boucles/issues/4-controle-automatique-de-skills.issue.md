# Chaque PR vers `main` joue les bancs du dépôt, sans qu'une session y pense

Status: ready-for-agent
Type: task
Modèle: sonnet
Fichiers chauds: `.github/workflows/ci.yml`, `scripts/depot.test.mjs`

## Le besoin

Sur `main` (`1f29a3a`, relevé du 2026-11-13), ce dépôt n'a aucun dossier `.github/` : la seule vérification automatique d'une PR est l'analyse CodeQL que GitHub lance de lui-même. Les bancs (338 tests, verts ce jour-là en 27 secondes) ne tournent que si la session pense à lancer `pnpm test`. Le produit a décidé qu'un contrôle automatique minimal précède toute lecture d'une PR de `skills` (`P-4` et `P-4 bis` de la carte).

Quand le ticket est fait, toute PR vers `main` affiche un check qui installe le dépôt puis joue `pnpm test`, et ce check est rouge dès qu'un banc échoue.

## Où

- Créer `.github/workflows/ci.yml`. Modèle à imiter : `skills/chaine/socle-chaine-de-production/references/ci/ci.yml`, lignes 6 à 31 : le déclencheur `pull_request`, la concurrence par référence (lignes 15 à 17), `permissions: contents: read` (lignes 18 et 19), le runner `ubuntu-24.04` (ligne 23), les trois actions épinglées par empreinte complète avec leur version en commentaire (lignes 25, 27 et 28), `persist-credentials: false` (ligne 26), `pnpm install --frozen-lockfile` (ligne 30).
- Ne pas reprendre du modèle : sa ligne 41, qui écrit deux expressions `${{ … }}` dans un `run:` (c'est le défaut que décrit `docs/issues/pose-du-socle/issues/1-ci-sans-expression-dans-run.issue.md`, encore ouvert) ; les jobs `test-db` et `zizmor` ; les marques `{{…}}` ; le filtre des brouillons de la ligne 22.
- Le modèle lit la version de Node dans `.nvmrc` (ligne 29) et celle de pnpm dans le champ `packageManager` de `package.json` (c'est ce que fait `pnpm/action-setup`, ligne 27). Ce dépôt n'a ni l'un ni l'autre : le workflow doit donner les deux versions.
- `package.json`, ligne 7 : le script `test` et ses quatre motifs. Il joue déjà tous les bancs (35 fichiers `*.test.mjs` sur `main`, tous couverts) : ne pas le modifier.
- `scripts/depot.test.mjs` : y ajouter le test de `## Surfaces` qui lit le workflow. Modèle pour la forme : le test « aucun SKILL.md ne dépasse 200 lignes », lignes 47 à 53.

Les trois empreintes du modèle ont été vérifiées le 2026-11-13 contre les dépôts des actions (`git ls-remote`) : `actions/checkout` `11d5960a326750d5838078e36cf38b85af677262` est l'étiquette `v4.4.0`, `pnpm/action-setup` `fc06bc1257f339d1d5d8b3a19a8cae5388b55320` est le commit de `v4.4.0`, `actions/setup-node` `49933ea5288caeca8642d1e84afbd3f7d6820020` est `v4.4.0`.

## Décisions

- Relecture du 2026-11-13 par un agent neuf, deux points fermés : le `checkout` garde la profondeur par défaut (pas de `fetch-depth: 0`, aucun banc ne lit l'historique du dépôt) ; le déclencheur `pull_request` n'a pas de ligne `types:` (ceux de GitHub par défaut, brouillons compris).
- `A-13` : un seul workflow, un seul job, deux commandes (installer, puis `pnpm test`), sur toute PR vers `main`, brouillons compris. Ni lint, ni audit des workflows, ni matrice de versions.
- `A-13` : rendre ce check obligatoire est un réglage GitHub, fait par un administrateur. La session ne le tente pas ; elle donne le nom exact du check dans le corps de la PR et dans son message à l'architecte.
- Aucune expression `${{ … }}` dans un `run:` ; toute action est épinglée par une empreinte de quarante caractères, sa version en commentaire.
- La session tranche seule, et le dit dans la PR :
  - les versions de Node et de pnpm. Défaut prudent : celles sur lesquelles elle a vu `pnpm install --frozen-lockfile` puis `pnpm test` passer, écrites dans le workflow (`with:` des deux actions), sans ajouter `packageManager` ni `.nvmrc` : ces deux fichiers changeraient le comportement de pnpm et de Node pour toutes les sessions du dépôt. Jamais en dessous de Node 22 : les motifs entre guillemets du script `test` sont développés par `node --test`, pas par le shell ;
  - le nom du job, court et stable : c'est le nom que l'administrateur rendra obligatoire ;
  - un déclencheur `push` sur `main` : par défaut non, `A-13` ne parle que des PR.
- `pnpm-lock.yaml` ne change pas.
- La ligne `version` de `.claude-plugin/plugin.json` ne bouge pas (`A-1`) : le ticket 8 la monte une fois pour tout le lot.
- Hors de ce ticket : corriger la ligne 41 du modèle (ticket de `pose-du-socle`), toucher `README.md` (le ticket 5, lancé en même temps, le modifie).

## Surfaces

| Surface                                                         | Preuve                                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Le workflow n'écrit aucune expression dans un `run:`            | `scripts/depot.test.mjs` « le workflow de contrôle n'écrit aucune expression dans un `run:` »                                               |
| Chaque action est épinglée par son empreinte                    | `scripts/depot.test.mjs` « le workflow de contrôle n'utilise que des actions épinglées par empreinte »                                      |
| Le workflow se lance sur une PR vers `main` et joue `pnpm test` | `scripts/depot.test.mjs` « le workflow de contrôle se lance sur toute PR vers main et joue pnpm test » ; et le run vert sur la PR du ticket |
| Un banc rouge rend le check rouge                               | l'essai à la main de `## Vérification`, les deux runs cités dans le corps de la PR                                                          |
| Aucun banc existant cassé                                       | `pnpm test` vert, au moins 338 tests                                                                                                        |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`.

Deux essais à la main, sur la PR elle-même (un workflow ajouté par une PR tourne sur cette PR) :

1. Lire le run du workflow sur le sommet de la PR par l'outil GitHub MCP et l'attendre une fois : il doit être vert.
2. Prouver que le check mord : pousser un commit qui fait échouer un banc (une assertion inversée dans `scripts/depot.test.mjs`), constater le run rouge, puis pousser le commit qui l'annule (`git revert`, jamais de push forcé) et constater le run vert.

## Livrer

Branche `ci/gnb-4-controle-automatique` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit, corps en français, qui donne le nom du check et les liens des deux runs de l'essai. **Ne jamais la fusionner** : le capitaine de `skills` fusionne les PR que l'architecte lui nomme. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
