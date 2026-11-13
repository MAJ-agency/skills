# Les rôles prennent les mots du bâtiment : architecte, conducteur de chantier, responsable, et `Label: contre-revue`

Status: ready-for-agent
Type: task
Modèle: opus — chaque occurrence d'« architecte » demande de juger de quel rôle on parle, et la coupure entre l'amont et le chantier s'écrit dans un skill que toutes les sessions suivent à la lettre
Fichiers chauds: `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.mjs`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/tickets/references/gabarits/ticket.issue.md`, `README.md`

## Le besoin

Le plugin appelle « architecte » la session qui déroule le skill `chantier`. Le produit emploie le mot dans l'autre sens, et l'a tranché (`P-1`) : l'**architecte** est la session unique d'un programme, qui mène l'amont et parle seule au produit ; le **conducteur de chantier** est la session qui fait tourner un chantier à partir d'une spec validée ; chaque carte nomme un **responsable**, une personne. Les définitions font foi dans `CONTEXT.md`, qui n'est pas encore sur `main` : le lire sur la branche de cadrage, comme ce ticket (`git show origin/claude/compassionate-euler-st84s9:CONTEXT.md`).

Quand le ticket est fait : la prose du plugin emploie les trois mots dans ce sens ; le skill `chantier` est celui du conducteur et dit où commence son travail (`P-2`) ; un ticket sur un chemin sensible porte `Label: contre-revue` ; la fiche d'une carte nomme `Responsable:` et `Conducteur:`. Aucun projet n'a de carte ni de ticket à réécrire.

## Où

Relevé fait sur `origin/main` (`1f29a3a`) le 2026-11-13. Le mot « architecte » vit dans 21 fichiers hors `docs/` (`git grep -ci architecte origin/main -- . ':!docs' ':!graphify-out'`).

**Prose à relire, occurrence par occurrence** (entre parenthèses, le nombre d'occurrences) :

- `skills/chaine/chantier/SKILL.md` (18, lignes 3, 8, 17, 35, 46, 54, 55, 68, 70, 83, 84, 91, 93) ;
- `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` (34 ; la table des rôles est lignes 13 à 19, le gabarit du prompt de fille ligne 96, le plafond ligne 130, le relevé des coûts ligne 134 ; « conducteur » n'y apparaît qu'une fois, ligne 35) ;
- `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-chaine-de-production.md` (5, lignes 12, 13, 17, 18, 23) ;
- `skills/chaine/tickets/SKILL.md` (3, lignes 61, 63, 82) et `skills/chaine/tickets/references/CONTENU.md` (2, lignes 13 et 17) ;
- `skills/chaine/revue-de-ticket/SKILL.md` (2, lignes 51 et 52), `skills/chaine/fusionner/SKILL.md` (1, ligne 75) ;
- `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md` (1, ligne 22), `skills/chaine/socle-chaine-de-production/references/fragments/readme-commandes.md` (1, ligne 4) ;
- six endroits que la spec ne nomme pas : `README.md` ligne 86 ; les commentaires de `skills/chaine/sujet/scripts/sujet.sh` ligne 41, de `skills/chaine/tickets/references/scripts/docs/avancement.mjs` ligne 6, de `couts.mjs` ligne 5 et de `vagues.mjs` lignes 5 et 7 (même dossier) ; et le message qu'affiche `vagues.mjs` ligne 123, qu'aucun test ne lit.

**Valeurs lues par la machine** (`skills/chaine/tickets/references/` abrégé en `tickets/`) :

- `tickets/scripts/verify/tickets-regles.mjs` :
  - `ecartsFormatPret` (ligne 311, appelée par `controlerTicket` ligne 427, lui-même appelé par `tickets.mjs` ligne 126) : le test de la ligne 318 n'accepte que `architecte`, le message de la ligne 323 le nomme, le commentaire de la ligne 309 aussi ;
  - `controlerCarte` (ligne 444, appelée par `tickets.mjs` ligne 158) : le motif `ARCHITECTE` ligne 436, l'exigence lignes 459 et 460.
- `tickets/scripts/verify/tickets.mjs` : l'en-tête décrit les règles 4 et 7 (lignes 16 et 24) ; la dette se lit lignes 69 à 73, se gèle lignes 142 à 153 (`--geler-types`), s'élague lignes 170 à 186.
- `tickets/scripts/verify/tickets-dette.json` : son `$comment` décrit les clés.
- Tests à étendre : `tickets/scripts/verify/tickets.test.mjs` (lignes 64 et 65 pour la carte, 90 à 99 pour le label, 124 pour `carteAvec`) et `tickets-gate.test.mjs` (lignes 46 à 54 pour le label ; lignes 99 à 125, le test de la dette `types`, modèle du test de la dette nouvelle).
- Gabarits : `tickets/gabarits/carte.map.md` ligne 8, `tickets/gabarits/ticket.issue.md` ligne 10 ; l'exemple d'en-tête de `chaine-de-production.md` ligne 59 et la phrase sur le gate ligne 77.
- `tickets/scripts/docs/couts.mjs` ne compare aucun rôle à « architecte » : `bilan` (ligne 90, appelée par `enMarkdown` lignes 116, 117 et 135) ne filtre que `fille`, ligne 91. Seuls les jeux d'essai de `couts.test.mjs` changent (lignes 31, 40 et 52, et le titre de la ligne 45).
- `skills/chaine/tickets/SKILL.md` ligne 54 décrit le gel de la dette `types` à la pose : la dette nouvelle s'y ajoute.

**La coupure entre l'architecte et le conducteur**, dans `skills/chaine/chantier/SKILL.md` : la description et le titre (lignes 3 et 8), le cas d'une session lancée par une autre (ligne 22), la question du grilling (ligne 27), la fiche (ligne 35), la phase de grilling (lignes 40 à 48), la validation du découpage (ligne 56), les questions des filles (ligne 82). `README.md` ligne 86 résume le skill en une ligne.

## Décisions

Tranché :

- `P-1` et `CONTEXT.md` : le sens des trois mots. « Architecte de chantier » et « chef de chantier » ne s'emploient plus.
- `P-2` : lancé avec une spec validée, le skill `chantier` commence au découpage ; le grilling complet appartient à l'architecte.
- Conséquence de `P-1` (l'architecte parle seul au produit) : dans un programme, le conducteur ne s'adresse pas au produit ; ses questions et la validation du découpage passent par l'architecte (`send_message`).
- `A-6` : `Label: contre-revue` remplace `Label: architecte`. Le label dit ce qui se passe, pas qui le fait : ne nommer aucun rôle dans le message du gate.
- `A-7` : la fiche d'une carte nomme `Responsable:` (une personne), `Architecte:` (la session du programme, facultative quand le chantier n'a pas de programme) et `Conducteur:` (la session qui mène le chantier). Le gate exige `Responsable:` et `Conducteur:`.
- `A-12` : « fille » reste le mot, dans la prose comme dans le code (`fillesParVague`, rôle `fille` du registre des coûts).
- `A-1` : la ligne `version` de `.claude-plugin/plugin.json` ne bouge pas ; le ticket 8 la monte une fois pour tout le lot.

Compatibilité, précisément (`A-6`, `A-7`) :

- **Tickets.** Le gate accepte les deux valeurs, `contre-revue` et `architecte`, sur n'importe quel ticket et sans liste de dette : l'ancienne valeur a le même effet, et rien ne distingue un ticket ancien d'un ticket neuf. Les messages et les gabarits ne nomment plus que `contre-revue`.
- **Cartes.** Une carte d'avant ce changement n'a ni `Responsable:` ni, le plus souvent, `Conducteur:`. Elle n'est pas réécrite : elle entre dans une dette gelée, et pour elle l'ancienne règle vaut seule (`Architecte:` non vide). La dette vit dans `scripts/verify/tickets-dette.json` du projet, sous une clé nouvelle écrite une seule fois par une option de `tickets.mjs`, à la pose, exactement comme `types` et `--geler-types` : elle liste les cartes qui, ce jour-là, n'ont pas les deux lignes nouvelles ; rejouée, l'option refuse ; `--elaguer` en retire une carte dès qu'elle les porte. Ni la clé `cartes` (elle dispense une carte de tout contrôle), ni un second fichier.
- **Un piège vérifié dans le dépôt `anchorpost`** : ses deux cartes de chantier portent déjà `Conducteur:`, dans l'ancien sens (la session qui parlait au produit), à côté d'`Architecte:`. Le gate ne juge pas le sens d'une ligne ; ces cartes n'ont pas de `Responsable:`, elles entrent donc dans la dette, et la prose ne demande nulle part de les corriger.

La session tranche seule, par défaut prudent, et le dit dans la PR :

- le nom de la clé de dette et de son option (piste : `fiches` et `--geler-fiches`) ;
- `Responsable:` : non vide, et refusé s'il a la forme d'un identifiant de session (`session_…`), puisque c'est une personne ;
- ce qui reste de la phase de grilling dans `chantier` pour un chantier sans programme, donc sans architecte : par défaut, les formes « court » et « aucun » restent au conducteur, qui parle alors au produit comme aujourd'hui, et la forme « complet » renvoie à l'architecte ;
- la ligne de la table des rôles pour l'architecte du programme (combien, ce qu'il fait, ce qu'il ne fait jamais) ;
- le rôle écrit dans la colonne « Rôle » de `## Coût` pour la session du chantier : `conducteur` ;
- pour chaque occurrence relue, le mot juste. L'ancien « architecte » devient presque partout « conducteur » ; la contre-revue du § 6.5 de `chantier` reste faite par la session du chantier, le chantier 3 redira qui relit.

Hors de ce ticket :

- le skill de l'architecte (ticket 6). Il n'existe pas encore : la prose nomme le rôle, jamais une invocation `/maj-skills:architecte` ;
- les plafonds et la section `## Dépassements` (ticket 7), la ligne `Gel:` (ticket 8) ;
- la relecture des tickets par un agent neuf avant la vague (chantier 3) ;
- `docs/` de ce dépôt, `CONTEXT.md` (il arrive sur `main` par la PR de cadrage, ne pas le créer ici), et tout fichier d'un projet.

## Surfaces

| Surface                                         | Preuve                                                                                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ticket prêt sur un chemin sensible, règle pure  | `tickets.test.mjs` « un ticket prêt sur un chemin sensible sans `Label: contre-revue` est refusé ; avec, accepté ; l'ancienne valeur `architecte` reste acceptée ; hors chemin sensible, rien n'est exigé » |
| Le même, gate complet sur un dépôt jouet        | `tickets-gate.test.mjs` « un ticket prêt dont `Fichiers chauds` touche `cheminsSensibles` sans `Label: contre-revue` est refusé ; avec, ou avec l'ancienne valeur, il passe »                               |
| Fiche d'une carte nouvelle                      | `tickets.test.mjs` « carte de chantier : fiche, phase, responsable et conducteur, coût dès la vague 1, rétro à fini »                                                                                       |
| `Responsable:` est une personne                 | `tickets.test.mjs` « une carte sans `Responsable:`, ou dont le responsable est un identifiant de session, est refusée, la ligne nommée »                                                                    |
| Carte d'avant le changement                     | `tickets.test.mjs` « une carte gelée passe avec `Architecte:` seul ; non gelée, la même carte est refusée »                                                                                                 |
| Dette des cartes, de bout en bout               | `tickets-gate.test.mjs` « dette des fiches : gelée une fois, jamais agrandie, élaguée quand la carte nomme son responsable et son conducteur »                                                              |
| Registre des coûts                              | `couts.test.mjs` « le bilan compte les tickets distincts des filles et leur coût moyen, hors conducteur »                                                                                                   |
| Prose : plus aucune occurrence de l'ancien sens | `git grep -n -i architecte -- skills README.md`, chaque occurrence restante justifiée dans le corps de la PR                                                                                                |
| Gabarits                                        | lecture de `carte.map.md` (trois lignes dans la fiche) et de `ticket.issue.md` (`Label: contre-revue`)                                                                                                      |
| Aucun `SKILL.md` au-dessus de 200 lignes        | `scripts/depot.test.mjs` « aucun SKILL.md ne dépasse 200 lignes », déjà en place                                                                                                                            |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. En cours de route, les bancs ciblés : `node --test skills/chaine/tickets/references/scripts/verify/*.test.mjs skills/chaine/tickets/references/scripts/docs/couts.test.mjs`.

À la main : relire `skills/chaine/chantier/SKILL.md` en entier en se demandant, à chaque phrase, quelle session la lit (un conducteur lancé par un architecte, ou un conducteur sans programme) et à qui elle parle ; puis `git grep -n -i 'architecte de chantier' -- skills README.md`, qui ne doit rien rendre.

Le ticket touche 22 fichiers (les 21 du relevé et `tickets-dette.json`), dont une douzaine ne changent que de quelques mots : au-delà, c'est qu'il déborde.

## Livrer

Branche `feat/gnb-5-roles-et-contre-revue` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit, corps en français, qui liste les occurrences d'« architecte » gardées et dit ce que le gate accepte encore. **Ne jamais la fusionner** : le capitaine de `skills` fusionne les PR que l'architecte lui nomme. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
