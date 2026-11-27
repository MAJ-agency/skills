# La garde des commandes de l'agent ne tourne pas en session cloud, et ses motifs `git` ont des trous

Status: ready-for-agent
Type: task

Relevé le 2026-11-12 dans anchorpost (ticket `SPEC_ALL_ANC-4.53`). Une faille voisine est apparue la veille chez Fedora (ticket `ALL-INF-13.15`) : `git commit -n` n'était pas refusé. Les scripts viennent de `socle-chaine-de-production/references/agent/` (`garde-commandes.mjs` et `regles.mjs`). Le socle les branche par `references/settings-hooks.json`, en `PreToolUse` sur `Bash`.

## Ce qui a été constaté

1. **La garde ne s'applique pas dans les sessions cloud.** Une fille a fait un commit local avec `--no-verify`, et rien ne l'a arrêtée. Elle l'a annulé aussitôt, sans rien pousser. Pourtant, cette commande est **refusée** quand on rejoue la garde à la main (`decisionCommande` donne `refuser`, `garde-commandes.mjs` sort 2).

   La sonde `yarn --version`, que la garde refuse, **passe** dans deux sessions cloud. L'une a pour racine `/home/user` et porte deux dépôts. L'autre a pour racine le dépôt lui-même, avec `.claude/settings.json` présent. Les hooks git (husky), eux, tournent.

2. **La garde ne bloque rien quand le chemin est faux.** Si `$CLAUDE_PROJECT_DIR` n'est pas le dépôt, `node "$CLAUDE_PROJECT_DIR"/scripts/agent/garde-commandes.mjs` ne trouve pas le module et sort en 1. Une sortie 1 n'est pas bloquante pour Claude Code : tout passe, sans avertissement.

3. **Les motifs ont des trous.** `COMMANDES_INTERDITES` exige que la sous-commande suive immédiatement `git`, et ne connaît que la forme longue des options. Chacune de ces commandes rend `null`, donc passe :

| Commande | Ce qu'elle contourne |
| --- | --- |
| `git commit -n`, `git commit -qn` | les hooks |
| `git -C <dir> commit --no-verify`, `git -c k=v commit --no-verify` | les hooks : une option globale avant la sous-commande suffit |
| `git -c core.hooksPath=/dev/null commit` | les hooks, sans écrire `--no-verify` |
| `HUSKY=0 git commit` | les hooks husky |
| `git -C <dir> push --force …` | le refus du push forcé |
| `git push origin +feat/x` | le refus du push forcé, par la refspec `+` |
| `git -C <dir> push origin HEAD:develop` | le refus du push direct |
| `git -C <dir> rebase origin/develop` | le refus du rebase d'une branche partagée |

## Où

- **Le point 1 d'abord** : trouver pourquoi les hooks `PreToolUse` du projet ne s'appliquent pas dans une session cloud. Il faut regarder quels réglages charge une session créée par `create_session`, si les réglages du projet doivent être approuvés, et si une politique gérée écarte les hooks du projet. Le dire ensuite dans `socle-chaine-de-production/SKILL.md` (§ ce qu'un admin fait à la main).
- **Une garde qui bloque par défaut** : dans `settings-hooks.json`, la commande sort en 2 quand le script est introuvable. Par exemple : `node "$(git rev-parse --show-toplevel)/scripts/agent/garde-commandes.mjs" || exit 2`. Ajouter un test.
- **Une sonde** dans les consignes des filles (`docs/agents/chaine-de-production.md`, gabarit) et au démarrage d'une session : `yarn --version` doit être refusé. Si la sonde passe, la session le signale avant tout commit.
- **`regles.mjs`** :
  - normaliser chaque commande `git` en retirant les options globales qui précèdent la sous-commande (`-C`, `-c`, `--git-dir`, `--work-tree`, `--no-pager`, `-P`) ;
  - refuser `-n`, seul ou groupé, pour `commit` et `merge` ;
  - refuser `-c core.hooksPath=…`, `HUSKY=0` (en tête de commande ou par `export`) et une refspec `+` sur `push` ;
  - laisser passer `--force-with-lease`, `push -n` (qui est un `--dry-run`) et `git -c user.email=… commit` ;
  - un cas de test par ligne de la table.
- **La reprise chez les projets** : anchorpost (`SPEC_ALL_ANC-4.53`), Fedora et Iroki.

## Décisions

- Déposé par l'architecte de `SPEC_ALL_ANC-4` d'anchorpost, à la demande du conducteur (2026-11-12), pour durcir un garde-fou. Le ticket n'est pas lancé.
- Une garde par motifs ne remplace pas la discipline C4. Une forme qu'elle ne reconnaît pas reste interdite.

## Comments

- 2026-11-12 — Les motifs sont reproduits avec `decisionCommande` sur le `develop` d'anchorpost. La sonde `yarn --version` passe dans deux sessions cloud.
