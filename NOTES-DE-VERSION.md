# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.16.0 — 2026-11-18

### Ce qui change

Le socle mobile pose `apps/mobile/docs/MOBILE_CI.md`, la méthode des parcours sur appareil en CI : émulateur à 4 cœurs et 4 Go, démarrage à froid avec une relance unique et comptée, `hide_error_dialogs`, incidents de l'app lus dans `events` (un ANR ou un crash de l'app rend le run rouge), un timeout propre à l'étape Maestro, un diagnostic par parcours en échec, et le filtre `paths` qui juge le diff de toute la PR. Le ticket gabarit des parcours sur appareil y renvoie.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Si le socle mobile est posé, recopier `~/.claude/plugins/marketplaces/maj/skills/mobile/socle-mobile-expo/references/mobile/docs/MOBILE_CI.md` dans `apps/mobile/docs/`, dans une PR du projet. Aucune commande `poser`.
2 bis. Un projet déjà posé ajoute la ligne `MOBILE_CI.md` à la carte de son `CLAUDE.md` et de son `README.md`, et le renvoi en tête de `apps/mobile/CLAUDE.md`.
3. Si le ticket des parcours sur appareil du projet n'est pas fait, lui ajouter le renvoi du gabarit. S'il est fait, relire le workflow des parcours point par point contre la référence, et ouvrir un ticket par écart.

**Iroki** : rien à reposer, la référence vient de ses correctifs (#637, #658 et `ADR_ALL_ARC-19`). Il peut la recopier pour ses nouvelles sessions ; ses réglages et ses points ouverts restent chez lui.
