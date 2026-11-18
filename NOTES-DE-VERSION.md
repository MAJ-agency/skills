# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.15.1 — 2026-11-18

### Ce qui change

`coverage-diff` (socle-tests) : sans `DATABASE_URL`, un fichier en échec qu'une suite `*.db.spec.ts` cible passe en avertissement, et la CI, qui a Postgres, le juge ; sous GitHub Actions, rien ne change. À la réception de develop dans un sujet, quand la forme n'est pas celle d'une PR de mise à jour (fusion recalculée), le diff se lit contre `origin/develop` dès que HEAD le contient et que la base ne le contient pas : le code que develop apporte n'est plus remesuré.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-tests/references/scripts/verify/` vers `scripts/verify/` : `coverage-diff.mjs`, `coverage-diff-regles.mjs`, `coverage-diff.test.mjs` et `coverage-diff-regles.test.mjs`. Aucune commande `poser` : socle-tests se met à jour pièce par pièce (`SKILL.md:16`).
3. Vérifier que l'étape de couverture de la CI porte `DATABASE_URL` (`SKILL.md:32`) : c'est elle qui juge ce que le pre-push signale.

**Iroki** : ses deux correctifs (#633 et #649) sont déjà chez lui, sous une autre forme, sans `fusionRecalculee`. Recopier les fichiers du plugin remplace son `referenceDuDiff` et son `suiteSurBaseCible`, et y ajoute la fusion recalculée. À faire en une PR qui garde ses deux bancs (`coverage-diff-sans-base.test.mjs`, `coverage-diff-reception-develop.test.mjs`) et les rejoue contre les fichiers du plugin ; un message qui diffère se nomme dans la PR.
