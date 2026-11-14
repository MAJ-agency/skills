# Ce que contient le skill revue-adversariale, et pourquoi

## `scripts/diff-revue.sh`

Le diff relu, sans le lockfile, les index générés (lus dans `scripts/docs/index-generes.json`, vérifiés par leurs gates) ni les snapshots. Posé dans `scripts/chaine/` du projet : une session cloud le trouve sans connaître le chemin du plugin. Au-delà de 2 000 lignes, il le dit : un lot par zone, un sous-agent par lot. Il sort en 1 sans rien relire quand la base `origin/…` ne se rapatrie pas (une revue sur une base périmée ne se voit pas) ou quand le diff est vide ; il ne fetche jamais une base locale. Banc : `diff-revue.test.mjs`, sur le dépôt jouet du skill `sujet`, qui reste dans le plugin.

## `scripts/chemins-sensibles.mjs`

Les chemins d'un diff qui touchent un motif de `cheminsSensibles` (`.claude/chaine.json`), un `chemin<TAB>motif` par ligne ; sortie 2 si le contrat est illisible ou mal formé, ou si l'entrée est vide (un contrôle de sécurité échoue fermé, comme le gate ; la commande de l'étape 2 porte `set -o pipefail`, pour qu'un `git` en échec ne se lise jamais « rien de sensible »). Il lit les motifs comme le gate `tickets` : `**` tout, `*` un segment, `/` final un dossier. L'ancienne commande les lisait en expressions régulières et ne voyait pas les motifs à `**/` au milieu. Le moteur est celui du gate (`regexDuMotif`, `motifSensibleTouche`), recopié, pas importé : le script posé dans `scripts/chaine/` ne dépend pas de la version du gate posée dans le projet. `chemins-sensibles.test.mjs` garde la parité avec le gate ; il reste dans le plugin (l'étape 0 ne le pose pas), parce qu'il lit le gate par le chemin du plugin. Il joue aussi la commande exacte de l'étape 2 dans un dépôt git temporaire : fichier déplacé hors d'un dossier sensible, chemin accentué.

## `references/criteres-socle.md`

Les vingt et un critères communs à tout projet amorcé par ces socles : sens des dépendances, contrats, tenant, erreurs, migrations, typage, tests, injection, concurrence, configuration, langue des identifiants, clients, parité, chemins sensibles (S1–S14), puis appels sortants et jetons délégués, événements externes et corps entrants, suppression après conversion, artefact publié, expressions régulières sur un fichier, réécriture du dépôt, migration rejouable (S15–S21). Les quatorze premiers renvoient à la règle du projet qu'ils appliquent ; les sept suivants viennent des rétros d'Anchorpost et citent leur cas vécu. Posé une fois comme `docs/agents/criteres-revue.md` (le chemin que `.claude/chaine.json` nomme) ; le projet y ajoute ses critères `P`, et retire ceux qui ne s'appliquent pas. Un projet qui a déjà sa liste la garde.

## `references/prompt.md`

Le prompt exact du sous-agent. Il ne reçoit ni l'historique, ni l'intention, ni la description de la PR : il juge le code. La liste est fermée et le format imposé, pour qu'une revue ouverte ne grossisse pas chaque PR de suggestions.

## `references/section-pr.md`

La section que la session ajoute au corps de la PR. Le capitaine renvoie toute PR de code qui ne la porte pas (`revue-exigee.mjs`, skill `fusionner`). Le relecteur humain la relit et doit pouvoir expliquer le diff à partir d'elle.
