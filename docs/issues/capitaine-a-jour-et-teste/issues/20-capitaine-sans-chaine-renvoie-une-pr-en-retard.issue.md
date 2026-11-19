# Le capitaine d'un dépôt sans la chaîne renvoie une PR en retard au lieu de la faire mettre à jour par GitHub

Status: ready-for-agent
Type: défaut
Modèle: sonnet — un paragraphe de procédure à réécrire dans `architecte/references/lancement.md`, sans script, et un banc de texte dans `scripts/depot.test.mjs` ; la décision est prise ici.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/SKILL.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (Fog, « Procédure du capitaine d'un dépôt sans la chaîne » ; décision `A-48` ; `P-6` : jamais de PR en retard sans nouveau test). Constat du 2026-11-18 : la PR 111 renvoyée deux fois par le capitaine de `skills`.

## Le besoin

**Le défaut.** La procédure du capitaine d'un dépôt sans la chaîne (`architecte/references/lancement.md`, le bloc « Procédure : » du prompt du capitaine) traite `mergeable_state` `behind` par `update_pull_request_branch`, puis, au réveil suivant, reconnaît la mise à jour faite par GitHub en lisant le nouveau sommet par `get_commit` : deux parents (P puis un commit de la branche par défaut), `commit.verification.verified` vrai, `commit.committer.email` égal à `noreply@github.com`. L'outil `get_commit` du serveur GitHub MCP d'une session cloud ne rend ni les parents ni `verification` : le capitaine ne peut jamais prouver la mise à jour, et renvoie toute PR mise à jour par GitHub (« le sommet a bougé »). Vécu sur `skills` le 2026-11-18 : la PR 111 renvoyée deux fois ; depuis, chaque session fusionne elle-même la branche par défaut avant le label (`A-48`), et la garde ne sert plus.

**Quand le ticket est fait :**

1. Une PR en retard (`mergeable_state` `behind`) est **renvoyée**, jamais mise à jour par le capitaine : commentaire `à-fusionner retiré par le capitaine : en retard sur <branche par défaut> : fusionner <branche par défaut> dans la branche (commit de merge, jamais de rebase), pousser, puis reposer le label et le commentaire au nouveau sommet`, label retiré dans le même geste. Raison : la session qui fusionne la branche par défaut relance la CI sur le nouveau sommet et le relit (`P-6`) ; le capitaine sans la chaîne ne peut ni prouver une mise à jour faite par GitHub ni attendre la CI qu'elle relance.
2. La garde « mise à jour signée par GitHub » (lecture par `get_commit`, écriture par le capitaine de `à-fusionner au sommet <head.sha>`) disparaît de la procédure, et le paragraphe **Limite** qui la commente perd la phrase sur l'éditeur web de résolution de conflits. Un sommet qui n'est pas P est renvoyé (« le sommet a bougé »), sans exception.
3. Le capitaine n'appelle plus jamais `update_pull_request_branch` ; la procédure le dit.
4. `architecte/SKILL.md` et tout autre texte qui décrit la procédure du capitaine sans la chaîne disent la même chose (chercher `update_pull_request_branch`, `noreply@github.com`, `verification` dans `skills/`). Les gardes d'agent du socle (`garde-github.mjs`, `regles.mjs`, `settings-hooks.json`, `settings-json-regles.mjs`) qui nomment `update_pull_request_branch` pour les sessions d'un dépôt à la chaîne ne changent pas.
5. Le plugin prend une version (patch) ; `NOTES-DE-VERSION.md` dit qu'un capitaine sans la chaîne déjà lancé garde l'ancienne procédure jusqu'à sa relance, et qu'une session qui reçoit le renvoi « en retard » fusionne la branche par défaut elle-même.

## Décisions

1. **Renvoi plutôt que mise à jour** (ci-dessus, point 1). Écartée : lire les parents par `list_commits` (`sha` le sommet) ; ses champs varient selon le serveur MCP, et la mise à jour faite par GitHub resterait suivie d'une CI que le capitaine sans la chaîne n'attend pas.
2. **Le compteur de renvois** (plafond à trois) compte aussi les renvois « en retard » : une PR renvoyée trois fois va au produit, comme aujourd'hui.
3. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la formulation exacte des textes, à condition de garder la forme exacte du commentaire de renvoi (`à-fusionner retiré par le capitaine : ` puis le motif).

## Ordre de travail

1. Un banc de texte dans `scripts/depot.test.mjs`, rouge avant : la procédure du capitaine sans la chaîne ne contient plus `update_pull_request_branch`, ni la garde par `get_commit`, et contient le renvoi « en retard ».
2. Les textes.
3. Version et note.
4. `pnpm test` complet, revue de ticket, PR.

## Comments

- 2026-11-19 — Textes : le bloc « Procédure : » de `lancement.md` renvoie `behind` avec le commentaire exact du ticket (`<branche par défaut>` nommée) et dit « Tu ne mets jamais une branche à jour toi-même » sans nommer l'outil, pour que le banc du ticket (« ne contient plus `update_pull_request_branch` ») tienne. `architecte/SKILL.md` et `references/CONTENU.md` ne décrivaient pas la garde : rien à y changer. Les gardes d'agent du socle sont intactes.
- 2026-11-19 — Bancs existants réécrits, pas assouplis : la liste de phrases attendues de la procédure (ancien `behind`, garde par `get_commit`) devient celle du renvoi, et le modèle `decider` du banc des commentaires perd `miseAJourParGithub` (une tête qui n'est pas l'ordre est « sommet-bouge », sans exception).
- 2026-11-19 — Version : patch 7.28.1 sur 7.28.0 ; à reprendre à la version suivante de main au signal de l'architecte (PR 131 et ticket 4 passent avant).
- 2026-11-19 — Revue de ticket : le banc local « la tête qui n'est pas l'ordre… » ne vérifiait rien (le modèle `decider` ne lit plus le sommet) et la constante `BASE` était morte : tous deux retirés ; le bloc de texte de `lancement.md` reste tenu par le banc final. Le Fog du programme (`capitaine-a-jour-et-teste.programme.md`) est hors périmètre du ticket : laissé à l'architecte.
