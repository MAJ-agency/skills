# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.18.0 — 2026-11-18

### Ce qui change

Le socle mobile pose `apps/mobile/docs/MOBILE_CI.md`, la méthode des parcours sur appareil en CI : émulateur à 4 cœurs et 4 Go, démarrage à froid avec une relance unique et comptée, `hide_error_dialogs`, incidents de l'app lus dans `events` (un ANR ou un crash de l'app rend le run rouge), un timeout propre à l'étape Maestro, un diagnostic par parcours en échec, et le filtre `paths` qui juge le diff de toute la PR. Le ticket gabarit des parcours sur appareil y renvoie.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Si le socle mobile est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/mobile/socle-mobile-expo/references/mobile/docs/MOBILE_CI.md` dans `apps/mobile/docs/`, dans une PR du projet. Aucune commande `poser`.
2 bis. Un projet déjà posé ajoute la ligne `MOBILE_CI.md` à la carte de son `CLAUDE.md` et de son `README.md`, et le renvoi en tête de `apps/mobile/CLAUDE.md`.
3. Si le ticket des parcours sur appareil du projet n'est pas fait, lui ajouter le renvoi du gabarit. S'il est fait, relire le workflow des parcours point par point contre la référence, et ouvrir un ticket par écart.

**Iroki** : rien à reposer, la référence vient de ses correctifs (#637, #658 et `ADR_ALL_ARC-19`). Il peut la recopier pour ses nouvelles sessions ; ses réglages et ses points ouverts restent chez lui.

## 7.17.0 — 2026-11-18

### Ce qui change

La fiche `.claude/rules/tests.md` du socle gagne « Le jour et l'heure » : le jour se lit dans le fuseau du métier, par l'horloge injectée ; un test crée ses données au lieu de lire celles du seed partagé ; un banc tourne avec une horloge posée. socle-tests pose le gabarit `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier la section « Le jour et l'heure » de `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md` dans `.claude/rules/tests.md`, avec la retouche de la ligne « Déterministe ». La fiche du projet a pu diverger : recopier la section, pas le fichier. `.claude/**` est un chemin sensible : contre-revue.
3. Si socle-tests est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/gabarits/exemple.jour-metier.spec.ts` dans `docs/agents/gabarits/`.
4. Écrire le fuseau du métier comme une constante du domaine, s'il ne l'est pas déjà.

**Iroki** : sa fiche porte la même ligne d'une phrase. Il recopie la section, avec son propre fuseau du métier ; ses correctifs (#622, #638) appliquent déjà les trois points.

## 7.16.0 — 2026-11-18

### Ce qui change

- **La règle d'ascendance.** Juste avant chaque fusion, vers `develop` (`passer.sh`) comme vers un sujet (`sujet.sh fusionner`), le capitaine relit la branche cible et vérifie que la PR a été testée sur son dernier état (`ascendance`, dans `github.sh`). Il ne s'en remet plus au réglage « strict » de GitHub, qui a laissé entrer des PR en retard (`fedora`, 2026-11-18).
- **Toute PR en retard est mise à jour et retestée avant sa fusion, documentation comprise.** Vers un sujet, une sous-PR en retard n'est plus squashée telle quelle : le capitaine y fusionne le sujet, pousse, attend la CI du nouveau sommet, contrôle de nouveau, puis la squashe. Vers `develop`, une cible qui a bougé pendant la CI fait reprendre la mise à jour, deux fois au plus, puis sortie 5. Un conflit hors des index générés est renvoyé, comme avant.
- **Sortie 12 et arrêt du capitaine.** Après chaque fusion, l'arbre du squash est comparé à l'arbre testé. Un écart : commentaire sur la PR (marque `<!-- arbre-different-capitaine -->`), `à-fusionner` retiré, la boucle et la veille s'arrêtent en 12, le capitaine le dit à son lanceur.
- **Une sous-PR étiquetée à la fois par sujet.** Le conducteur ne laisse `à-fusionner` qu'à la plus ancienne des sous-PR étiquetées d'un même sujet, et le repose sur la suivante quand la précédente est entrée (skill `chantier` § 6).
- La sortie 8 de `sujet.sh fusionner` change de sens : mise à jour poussée, CI pas finie, reprise au tour suivant.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille, elle, tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).
