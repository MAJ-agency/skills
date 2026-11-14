# Ce que contient le skill revue-adversariale, et pourquoi

## `scripts/diff-revue.sh`

Le diff relu, sans le lockfile, les index générés (lus dans `scripts/docs/index-generes.json`, vérifiés par leurs gates) ni les snapshots. Posé dans `scripts/chaine/` du projet : une session cloud le trouve sans connaître le chemin du plugin. Au-delà de 2 000 lignes, il le dit : un lot par zone, un sous-agent par lot.

## `references/criteres-socle.md`

Les vingt et un critères communs à tout projet amorcé par ces socles : sens des dépendances, contrats, tenant, erreurs, migrations, typage, tests, injection, concurrence, configuration, langue des identifiants, clients, parité, chemins sensibles (S1–S14), puis appels sortants et jetons délégués, événements externes et corps entrants, suppression après conversion, artefact publié, expressions régulières sur un fichier, réécriture du dépôt, migration rejouable (S15–S21). Les quatorze premiers renvoient à la règle du projet qu'ils appliquent ; les sept suivants viennent des rétros d'Anchorpost et citent leur cas vécu. Posé une fois comme `docs/agents/criteres-revue.md` (le chemin que `.claude/chaine.json` nomme) ; le projet y ajoute ses critères `P`, et retire ceux qui ne s'appliquent pas. Un projet qui a déjà sa liste la garde.

## `references/prompt.md`

Le prompt exact du sous-agent. Il ne reçoit ni l'historique, ni l'intention, ni la description de la PR : il juge le code. La liste est fermée et le format imposé, pour qu'une revue ouverte ne grossisse pas chaque PR de suggestions.

## `references/section-pr.md`

La section que la session ajoute au corps de la PR. Le capitaine renvoie toute PR de code qui ne la porte pas (`revue-exigee.mjs`, skill `fusionner`). Le relecteur humain la relit et doit pouvoir expliquer le diff à partir d'elle.
