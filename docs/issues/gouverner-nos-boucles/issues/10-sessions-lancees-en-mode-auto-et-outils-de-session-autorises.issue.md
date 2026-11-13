# Une session lancée par une autre part en mode « auto », et les outils de session sont autorisés d'avance

Status: ready-for-agent
Type: task
Modèle: sonnet
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/chantier/SKILL.md`, `.claude/settings.json`, `skills/monorepo/socle-monorepo/references/racine/.claude/settings.json`, `.claude-plugin/plugin.json`

## Le besoin

Décision `P-19` du produit (carte du programme, [`../map.md`](../map.md)) : il ne valide plus aucune autorisation technique, ni dans une session qu'il ouvre, ni dans celles qu'un architecte ou un conducteur lance.

Deux faits relevés le 2026-11-13. Une session de ticket créée sans mode de permission est restée bloquée sur une demande d'autorisation pour écrire à l'architecte (`send_message`) : aucun gabarit de lancement ne nomme de mode. Et seul le dépôt `fedora` autorise d'avance les outils de session dans son `.claude/settings.json` ; `skills`, `anchorpost` et `iroki-monorepo` ne le font pas.

Quand le ticket est fait, les trois gabarits de lancement demandent le mode « auto », ce dépôt autorise d'avance les cinq outils de session, et le gabarit de réglages que le socle pose dans un projet aussi.

## Où

Lignes de `origin/main` à `0a39329` (2026-11-13).

- `skills/chaine/architecte/references/lancement.md`, ligne 9 (le conducteur) et ligne 26 (le capitaine) : la liste des paramètres de `create_session` gagne `permission_mode` `"auto"`.
- Même fichier, section « Après le lancement » : une ligne nouvelle, qui contient le mot `permission_mode`. Une session lancée ne peut pas avoir un mode plus permissif que celle qui la lance : l'architecte est donc ouvert par le produit en mode « Auto », et si `create_session` refuse ce mode, l'architecte le dit au produit et ne relance pas dans un autre mode.
- `skills/chaine/chantier/SKILL.md`, ligne 74 (première puce sous « Pour chaque ticket de la vague, `create_session` : », ligne 72) : la liste des paramètres gagne `permission_mode` : `"auto"`. Le fichier reste sous 200 lignes (126 aujourd'hui).
- `.claude/settings.json` de ce dépôt, clé `permissions.allow` (57 règles, aucune ne commence par `mcp__`) : ajouter `mcp__claude-code-remote__list_sessions`, `mcp__claude-code-remote__get_session`, `mcp__claude-code-remote__list_events`, `mcp__claude-code-remote__send_message`, `mcp__claude-code-remote__send_later`.
- `skills/monorepo/socle-monorepo/references/racine/.claude/settings.json`, le gabarit que `socle-monorepo` pose à la racine d'un projet : les cinq mêmes règles dans `permissions.allow`, la clé étant créée si elle manque. Le gate `skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json-regles.mjs` exige seulement un `allow` non vide (ligne 84) et ne juge que les règles `Bash(...)` (ligne 90) : les règles `mcp__` passent, et son banc `settings-json.test.mjs` reste vert sans être modifié.
- `.claude-plugin/plugin.json`, ligne 3 : `5.0.1` devient `5.0.2`.

## Décisions

- `P-19` de la carte. Les cinq noms de règle écrits sous `## Où` font foi (ce sont ceux du dépôt `fedora`, absent de la session).
- La recopie dans `anchorpost` et `iroki-monorepo` se fait par un ticket de chacun de ces dépôts : ce ticket n'y touche pas.
- Aucune autre règle d'autorisation n'est ajoutée, et `add_repo` n'en fait pas partie : la façon dont une session lancée reçoit les skills est une question ouverte du produit (`Q19` de la carte).
- Correctif sans changement de comportement d'un script : version de correctif, modèle sonnet.

## Surfaces

| Surface                                             | Preuve                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| les trois gabarits de lancement                     | `grep -n "permission_mode" skills/chaine/architecte/references/lancement.md skills/chaine/chantier/SKILL.md` rend quatre lignes : trois de paramètres, et la ligne nouvelle de « Après le lancement » |
| `.claude/settings.json` du dépôt                    | `node -e 'const a=require("./.claude/settings.json").permissions.allow;console.log(a.filter(r=>r.startsWith("mcp__claude-code-remote__")).length)'` affiche `5` |
| gabarit `racine/.claude/settings.json`              | la même commande, avec le chemin `./skills/monorepo/socle-monorepo/references/racine/.claude/settings.json`, affiche `5`                                                |
| `.claude-plugin/plugin.json`                        | `"version": "5.0.2"`                                                                                                    |

## Vérification

- `pnpm test` vert, sans test retiré ni désactivé.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Comments
