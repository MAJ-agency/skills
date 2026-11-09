# {{ID}}.{{NN}} — {{Objet du ticket, en une ligne}}

Status: ready-for-agent
Sujet: sujet/{{nom}}
Blocked by: {{NN, NN — ou retirer la ligne}}
Modèle: sonnet
Fichiers chauds: `{{chemin}}`, `{{chemin}}` — ou `—`
Dépendances: `{{paquet}}`, `{{paquet}}` — ou retirer la ligne
Maquette: {{fichier du dépôt : maquette HTML et section, ou planche recopiée sous docs/design/planches/ — jamais un artefact seul, la fille ne peut pas l'ouvrir}} — ou retirer la ligne si le ticket ne touche aucun écran

## Le besoin

{{Deux ou trois phrases : ce que l'utilisateur doit pouvoir faire quand le ticket est fait.}}

## Où

- `{{fichier à créer ou modifier}}` — {{ce qu'on y fait}}
- Modèle à imiter : `{{fichier:ligne}}`
- Appelant réel de toute fonction citée : {{route, listener, cron}}
- Règles à lire, deux au plus : `{{apps/<service>/CLAUDE.md § « … »}}`

## Décisions

- {{Ce qui est tranché, avec le renvoi à la carte ou à l'ADR.}}
- {{Ce que la fille tranche seule, par défaut prudent, et note sous `## Comments`.}}

## Surfaces

| Surface               | Preuve                     |
| --------------------- | -------------------------- |
| {{écran, endpoint…}}  | {{le test qui la prouve}}  |

## Vérification

{{Commandes ciblées avant `pnpm check` : typecheck du paquet, specs nommées ; index à régénérer ; specs de garde à compléter.}}

## Comments

- {{AAAA-MM-JJ}} — Ticket ouvert au découpage de {{ID}}.
