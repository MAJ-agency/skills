# {{ID}}.{{NN}} — {{Objet du ticket, en une ligne}}

Status: ready-for-agent
Type: task # task | défaut | grilling | research — obligatoire, vérifié par le gate
Règles: {{RULE_ALL_<TRI>-<n>, RULE_<CTX>_<TRI>-<n> — les règles que le ticket réalise ou corrige, par leur identifiant complet ; `—` seul s'il n'en réalise aucune ; ou retirer la ligne}}
Sujet: sujet/{{nom}}
Blocked by: {{NN, NN — ou retirer la ligne}}
Modèle: sonnet
Fichiers chauds: `{{chemin}}`, `{{chemin}}` — ou `—`
Label: contre-revue # obligatoire quand `Fichiers chauds` touche `cheminsSensibles` (le gate `tickets` le vérifie) — sinon retirer la ligne
Sensibles: `{{chemin ou motif}}`, `{{chemin ou motif}}` — accord de {{la personne qui a accordé}}, {{AAAA-MM-JJ}} # les chemins sensibles que le ticket modifie et l'accord donné avant, ou `—` s'il n'en modifie aucun ; le gate `tickets` juge la forme sans exiger la ligne ; aucune garde ne la lit encore — ou retirer la ligne
Relecture: double # deux relectures indépendantes, pour un ticket qui touche une règle de criticité haute ; seule valeur acceptée par le gate `tickets`, qui n'exige pas la ligne ; sans effet pour l'instant — sinon retirer la ligne
Dépendances: `{{paquet}}`, `{{paquet}}` — ou `—`
Maquette: {{fichier du dépôt : maquette HTML et section, ou planche recopiée sous docs/design/planches/ — jamais un artefact seul, la fille ne peut pas l'ouvrir}} — ou retirer la ligne si le ticket ne touche aucun écran

## Le besoin

{{Deux ou trois phrases : ce que l'utilisateur doit pouvoir faire quand le ticket est fait. Pour un défaut : le constat `D-n` de l'inventaire de recette et le test rouge qui le prouve.}}

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
| {{écran, endpoint…}}  | {{le test qui la prouve — pour un défaut : `chemin/du/fichier.spec.ts` « titre exact du test », le gate vérifie qu'il existe et n'est pas désactivé quand le ticket est `Fait`}} |

## Vérification

{{Commandes ciblées avant `pnpm check` : typecheck du paquet, specs nommées ; index à régénérer (`pnpm anchorpost:index` si le projet est suivi) ; specs de garde à compléter.}}

## Comments

- {{AAAA-MM-JJ}} — Ticket ouvert au découpage de {{ID}}.
