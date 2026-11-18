# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.15.1 — 2026-11-18

### Ce qui change

Le gabarit `scripts/db/demarrer-local.sh` du socle Nest crée sa base en UTF8 (`initdb --encoding=UTF8` avec une locale UTF-8, `createdb -E UTF8 -T template0`) : sur une machine en locale C/POSIX, PostgreSQL choisissait `SQL_ASCII`, et `normalize(…)` échouait au pre-push. Une base ou un serveur existant qui n'est pas en UTF8 est refusé (sortie 6), avec les commandes pour le recréer ; rien n'est supprimé par le script.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier `~/.claude/plugins/marketplaces/maj/skills/backend/socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh` sur `scripts/db/demarrer-local.sh`, tel quel (il n'a aucun marqueur à substituer). Aucune commande `poser` : le socle Nest se pose une fois.
3. Lancer `bash scripts/db/demarrer-local.sh`. S'il sort en 6, suivre les commandes qu'il imprime, puis rejouer les migrations. Le script de l'environnement cloud l'appelle avec `|| true` (`admin.md`) : un refus y passe inaperçu, il se voit au premier appel de la session.

**Iroki** : rien à reposer. Son script (`SPEC_ALL_SOC-4.34`, #486 et #495) fait déjà tout cela, avec `COMPOSE_FICHIER` et son banc en plus ; le gabarit ne doit pas l'écraser.
