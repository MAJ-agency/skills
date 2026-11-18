# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.16.0 — 2026-11-18

### Ce qui change

La fiche `.claude/rules/tests.md` du socle gagne « Le jour et l'heure » : le jour se lit dans le fuseau du métier, par l'horloge injectée ; un test crée ses données au lieu de lire celles du seed partagé ; un banc tourne avec une horloge posée. socle-tests pose le gabarit `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier la section « Le jour et l'heure » de `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md` dans `.claude/rules/tests.md`, avec la retouche de la ligne « Déterministe ». La fiche du projet a pu diverger : recopier la section, pas le fichier. `.claude/**` est un chemin sensible : contre-revue.
3. Si socle-tests est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` dans `docs/agents/gabarits/`.
4. Écrire le fuseau du métier comme une constante du domaine, s'il ne l'est pas déjà.

**Iroki** : sa fiche porte la même ligne d'une phrase. Il recopie la section, avec son propre fuseau du métier ; ses correctifs (#622, #638) appliquent déjà les trois points.
