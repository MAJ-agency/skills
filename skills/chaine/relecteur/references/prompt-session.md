# Le prompt d'une session de relecture, et le message qui la relance

Le Relecteur crée une session de relecture par `create_session` (`SKILL.md`, « Créer ou relancer les sessions ») avec ce prompt, rempli. Sa **première ligne est la commande du skill**, seule avec ses arguments : `relecture` porte `disable-model-invocation: true`, et seule la commande en tête du prompt le charge. Tout le reste vient après. Les lignes « Outils : », « Version : » et « Skills : » sont celles de tout prompt de lancement (`architecte/references/lancement.md`), pour ce skill ; les trois lignes des consignes du produit se recopient telles quelles.

Les champs entre chevrons : `<n>`, `<tour>` et `<sommet>` du geste (`tour`, `sommet`), `<dépôt>` le dépôt, `<id du Relecteur>` l'identifiant de la session du Relecteur (`get_session` sans argument). La ligne « Seconde relecture » ne s'écrit que quand le geste demande deux sessions (`nombre` 2, ou `completer`).

```text
/maj-skills:relecture <n> <tour> <sommet>
Session de relecture de la PR <n> du dépôt <dépôt>, tour <tour>, sommet <sommet>. Relecteur : <id du Relecteur>.
Outils : ton premier geste, avant tout autre, est de charger send_message par ToolSearch, requête « select:mcp__claude-code-remote__send_message ». S'il ne se charge pas, écris « send_message absent » dans ta première réponse et arrête-toi : le Relecteur te remplacera.
Argument : ce prompt entier t'arrive comme argument du skill ; ses trois premiers mots après la commande sont le numéro de la PR, le tour et le sommet ; le reste sont tes consignes.
Skills : la première ligne de ce prompt charge le skill relecture ; suis-le, ses références comprises. Si elle n'a rien chargé (le hook de démarrage signale le plugin maj-skills absent) : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj` ; puis lis le fichier ~/.claude/plugins/marketplaces/maj/skills/chaine/relecture/SKILL.md avec ton outil de lecture et suis-le. Si le plugin est installé mais que la première ligne n'a rien chargé : lis quand même ce fichier, de la même façon. Ce skill ne s'invoque pas par l'outil Skill, il se lit. Si l'installation échoue ou si le fichier ne se lit pas : écris-le au Relecteur (send_message) et arrête-toi, sans rien relire.
Version : juste après la ligne « Outils : », note la version chargée (le numéro du dossier de base du skill chargé, …/cache/maj/maj-skills/<version>/…), puis joue `claude plugin marketplace update maj` et `claude plugin update maj-skills@maj`, et lis la version de ~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json. Si elles diffèrent, c'est le fichier du marketplace qui fait foi : lis ~/.claude/plugins/marketplaces/maj/skills/chaine/relecture/SKILL.md et ses références avec ton outil de lecture et suis-les. Tu n'écris pas cette version au Relecteur : ta seule ligne pour lui est celle que le skill te donne.
Seconde relecture : une autre session relit la même PR. Tu ne lis pas son verdict et tu ne lui écris pas.
Le produit : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. »
Intangibles : jamais --no-verify ; jamais de push forcé ni de réécriture d'historique ; jamais de fusion avec un contrôle exigé rouge ; jamais de test sauté ou assoupli ; jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain.
Commits : jamais `git commit --amend` ; une correction est un commit de plus.
```

## Le message qui relance une session

Pour un tour suivant de la même PR, une reprise après arbitrage, ou une relance après un verdict `incomplet`, le Relecteur écrit la distribution, puis ce message à la session, par `send_message`. Il ne dit rien du verdict d'avant ni de ce qu'il faut regarder.

```text
Relance : PR <n>, tour <tour>, sommet <sommet>. Rejoue le skill relecture depuis l'étape 1, sur ce sommet : la distribution qui te nomme est sur la PR.
```
