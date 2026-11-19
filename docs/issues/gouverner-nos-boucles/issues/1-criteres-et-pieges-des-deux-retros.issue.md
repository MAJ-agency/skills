# Les leçons des deux premières rétros deviennent des critères de revue et un piège

Status: ready-for-agent
Type: task
Modèle: opus — formuler, à partir de cas vécus sur un projet, des critères qui valent pour tous les projets ; la formulation fait loi pour tous les relecteurs
Fichiers chauds: `skills/chaine/revue-adversariale/references/criteres-socle.md`, `skills/chaine/revue-de-ticket/references/criteres-ticket.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md`

## Le besoin

Les rétros des deux premiers chantiers d'Anchorpost « proposent » des critères de revue qui n'ont jamais été écrits : le relecteur d'une PR ne les connaît donc pas, et le même défaut peut repasser. Inventaire fait le 2026-11-12 sur `origin/develop` d'`anchorpost` (`c0ff374`) : dix leçons sont absentes des trois fichiers ci-dessus, et toutes valent pour n'importe quel projet.

## Où

Sept critères à ajouter à `skills/chaine/revue-adversariale/references/criteres-socle.md`, à la suite du dernier critère `S` du socle et avant la section `## Critères du projet` (ligne 65), dans la forme exacte des critères voisins. Chaque critère cite son cas vécu (dépôt `anchorpost`, numéro de PR).

| Leçon, telle que la rétro l'énonce                                                                                              | Cas vécu (anchorpost)       |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Un segment transmis à une API externe ne peut pas sortir de sa ressource ; un jeton délégué est restreint                       | PR 7 et PR 13               |
| Un état dérivé d'événements externes ne dépend pas de leur ordre d'arrivée ; un corps entrant a une limite adaptée              | PR 24                       |
| Une conversion ne supprime que ce qu'elle a converti                                                                            | PR 57                       |
| L'artefact vérifié est celui qui est publié ; un essai ne produit jamais un artefact au nom d'une vraie version                 | PR 54                       |
| Toute expression régulière qui lit un fichier est testée sur une entrée piégée, fin de ligne CRLF comprise                      | livraison PR 63, ticket .27 |
| Une commande qui réécrit le dépôt ne touche aucun chemin de `cheminsSensibles` sans le dire                                     | PR 85                       |
| Une migration rejouable se rejoue sur son propre résultat, chaînes et échanges compris                                          | PR 96                       |

Le critère existant sur le rejeu et le doublon (`S9`, lignes 43 à 46) ne couvre ni l'ordre d'arrivée ni la taille d'un corps entrant : la deuxième leçon l'étend ou le suit, au choix de la session, sans renuméroter un critère existant.

Deux critères à ajouter à `skills/chaine/revue-de-ticket/references/criteres-ticket.md` (axe Ticket), dans la forme de ses critères `T` :

| Leçon                                                                                                    | Cas vécu (anchorpost) |
| -------------------------------------------------------------------------------------------------------- | --------------------- |
| Une recette qui pilote un service tiers est relue contre la documentation du fournisseur à la date du jour | PR 74                 |
| Une passe qui réécrit un dépôt est essayée sur une copie d'un dépôt réel avant sa fusion                 | vague 8, ticket .39   |

Un piège à ajouter à `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md`, section « Sous-PR d'un sujet » : un `pnpm check` joué sur la seule branche ne voit pas la fusion avec un sujet qui a avancé (PR 54).

## Décisions

- Un critère tient en une règle vérifiable sur un diff, suivie de son cas vécu. Pas de conseil, pas de « veiller à ».
- Aucun critère existant n'est renuméroté ni reformulé.
- Si un fichier `CONTENU.md` ou le `README.md` compte ou liste les critères, il est mis à jour dans la même PR.
- La ligne `version` de `.claude-plugin/plugin.json` ne bouge pas : une seule montée de version clôt le lot (décision `A-1` de la carte).
- Hors périmètre, gardés pour un chantier suivant parce qu'ils changent un mécanisme et pas une liste : le gate `tickets` qui n'accepterait que des chemins dans `Fichiers chauds:`, la garde contre un push depuis un `git worktree`, et la fusion du sujet dans la PR avant chaque squash.

## Surfaces

| Surface                                   | Preuve                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Les sept critères du socle                | `grep -c` de leurs identifiants dans `criteres-socle.md`               |
| Les deux critères de l'axe Ticket         | lecture de `criteres-ticket.md`                                        |
| Le piège                                  | lecture de `pieges.md`                                                 |
| Aucun banc existant cassé                 | `pnpm test` vert                                                       |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Relire chaque critère en se demandant : un relecteur qui ne voit que le diff peut-il dire oui ou non ?

## Livrer

Branche `docs/gnb-1-criteres-des-retros` depuis `origin/main`. Une PR vers `main`, titre en conventional commit, corps en français qui liste les dix ajouts avec leur cas vécu. Ne pas fusionner : un humain relit et fusionne. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
