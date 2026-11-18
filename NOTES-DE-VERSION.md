# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.15.1 — 2026-11-18

### Ce qui change

La garde de commandes lit la sous-commande de git après ses options globales (`-C`, `-c`, `--git-dir`, `--config-env`…), valeurs opaques comprises. Elle refuse toute façon de sauter les hooks git : `--no-verify` et `-n` derrière une option globale, `git pull --no-verify`, `git am -n`, `core.hooksPath` ou un `include` posé par `-c`, `--config-env` ou `git config` (`--unset` compris), tout `alias.*` posé par `-c` ou écrit par `git config`, un renommage de section vers ou depuis `core`, `HUSKY`, `GIT_CONFIG_PARAMETERS` et `GIT_CONFIG_COUNT` affectés ou exportés. Elle refuse aussi une ref de suivi fabriquée (`git update-ref refs/remotes/…`), le push « matching » (`git push origin :`) et une destination de push portée par la configuration (`-c remote.origin.push=…`). Une expansion (`$`, substitution) n'est admise que dans une valeur, jamais dans un nom d'option, une sous-commande ou une clé de configuration ; un argument à expansion de `commit`, `am`, `merge`, `rebase` ou `pull` est refusé (« argument illisible : écris-le en clair »). Un message de commit n'est jamais lu comme des options ; un texte cité qui porte une commande git refusée l'est, comme aujourd'hui pour un push vers un sujet.

La recherche adversariale du ticket a fermé en plus : une expansion non citée dans la valeur d'une option globale, devant toute sous-commande (`git -C $dir status` est refusé, `git -C "$dir" status` passe) ; un motif ou des accolades non cités, qui valent une expansion non citée (`git commit -m x src/*.ts` est refusé, `git commit -m x -- src/*.ts` passe) ; `"$@"` et `"${a[@]}"`, qui donnent plusieurs mots même cités ; `set -a`, `set -k` et `env "$X" …` ; un `env HUSKY=0` derrière un autre lanceur (`taskset`, `flock`) ; les options abrégées de `git config` (`--unset-a`, `--remove-sec`) ; git par ses programmes internes (`/usr/lib/git-core/git-commit`, et `git-push` vers un sujet, ouvert jusqu'ici) ; une commande que git lance par un shell, tapée dans la commande (`git rebase -x '…'`, `-c core.pager='…'`, `git config core.editor '…'`), relue comme une commande de la session.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
2. Dans une PR du projet, recopier `regles.mjs` et `regles.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/chaine/socle-chaine-de-production/references/agent/` vers `scripts/agent/`, **d'un seul coup** : copie à côté, `node --check`, `node -e "import('./scripts/agent/<copie>')"`, puis `mv`. Un `regles.mjs` à moitié écrit fait refuser toute commande de la session. `scripts/agent/**` est un chemin sensible : contre-revue et `/security-review`.
3. Recopier la ligne « Hooks d'agent » du fragment `claude-md-fusion.md` dans `CLAUDE.md`, si le projet l'a gardée telle quelle.
4. `node --test scripts/agent/*.test.mjs` : vert.

**Iroki** : sa garde lit encore les commandes par expressions (avant 7.12.0). Reposer `regles.mjs` du plugin remplace sa lecture et son correctif #652 : le passage à la lecture par jetons en est le préalable (spec, Hors périmètre). Rejouer ses bancs « SPEC_ALL_SOC-4.70 » contre le fichier du plugin avant de retirer les siens. Quatre de ses décisions changent : `git config --unset core.hooksPath`, `git -c core.hooksPath=/x status` et `GIT_CONFIG_COUNT=…` d'une autre clé deviennent des refus ; `git -C <(…) commit -m x`, qu'il refuse comme illisible, passe (il est lu, et ne saute rien).
