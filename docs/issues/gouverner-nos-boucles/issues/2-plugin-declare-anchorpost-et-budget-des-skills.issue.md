# Le plugin déclare tous ses skills, et un banc tient chaque `SKILL.md` sous 200 lignes

Status: ready-for-agent
Type: task
Modèle: sonnet
Fichiers chauds: `.claude-plugin/plugin.json`, `package.json`, `skills/monorepo/socle-monorepo/SKILL.md`

## Le besoin

Deux écarts constatés le 2026-11-12 sur `main` (`117a365`), que rien ne détecte parce que le dépôt n'a aucun banc sur lui-même :

- le skill `skills/chaine/anchorpost` figure au `README.md` (ligne 81) mais pas dans la liste `skills` de `.claude-plugin/plugin.json` (lignes 28 à 42) : il n'est donc pas installé avec le plugin ;
- `skills/monorepo/socle-monorepo/SKILL.md` fait 203 lignes, alors que la limite que le socle impose aux projets est de 200 (`budget-contexte.mjs`, qui ne regarde que les skills d'un projet amorcé, pas ceux de ce dépôt).

## Où

- `.claude-plugin/plugin.json` : ajouter `"./skills/chaine/anchorpost"` à la liste `skills`, à sa place dans le groupe `chaine`.
- `skills/monorepo/socle-monorepo/SKILL.md` : le ramener à 200 lignes au plus en déplaçant du détail vers un fichier de `skills/monorepo/socle-monorepo/references/`, cité par un renvoi. Aucune consigne ne disparaît.
- Nouveau banc `scripts/depot.test.mjs` à la racine (`node:test`, aucune dépendance), et son motif ajouté au script `test` de `package.json`. Modèle à imiter pour la forme d'un banc : `skills/chaine/fusionner/scripts/identifiant.test.mjs`.

## Décisions

- Le skill `anchorpost` est déclaré plutôt que retiré du README (décision `A-2` de la carte) : il est maintenu et documenté.
- Le banc lit le dépôt tel qu'il est, sans liste d'exceptions : s'il est rouge sur un autre skill que `socle-monorepo`, corriger ce skill dans la même PR ou le signaler à l'architecte si la correction dépasse le déplacement de détail.
- La ligne `version` de `.claude-plugin/plugin.json` ne bouge pas (décision `A-1` de la carte). La PR 55, ouverte, modifie cette ligne : ne pas y toucher évite le conflit.

## Surfaces

| Surface                                                                     | Preuve (`scripts/depot.test.mjs`)                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Tout dossier `skills/*/*/` qui contient un `SKILL.md` est dans `plugin.json` | « chaque skill du dépôt est déclaré dans le plugin »                           |
| Toute entrée de `plugin.json` désigne un dossier qui contient un `SKILL.md`  | « chaque skill déclaré existe »                                                |
| Le champ `name` de l'en-tête d'un `SKILL.md` égale le nom de son dossier     | « le nom d'un skill est celui de son dossier »                                 |
| Aucun `SKILL.md` ne dépasse 200 lignes                                       | « aucun SKILL.md ne dépasse 200 lignes », message qui nomme le fichier fautif |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Vérifier que le banc est bien rouge avant la correction (sur `main`, deux cas échouent), vert après.

## Livrer

Branche `fix/gnb-2-plugin-et-budget-des-skills` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit, corps en français. Ne pas fusionner : un humain relit et fusionne. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
