# Une fille coupée à son plafond laisse son travail sur le dépôt, et sa reprise est écrite

Status: wontfix
Type: task
Blocked by: —
Modèle: sonnet
Fichiers chauds: `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/chantier/references/CONTENU.md`, `skills/chaine/fusionner/SKILL.md`

**Sans objet depuis la décision P-18 du 2026-11-14** : une fille au plafond n'est plus coupée, elle est signalée au produit et continue. Le texte ci-dessous est gardé comme relevé des faits ; voir `## Comments`.

## Le besoin

Depuis le ticket 7 (PR 63), le conducteur coupe par `interrupt_session` une fille qui atteint 300 000 tokens de contexte ou 20 $, puis demande au produit de choisir : découper le ticket, relancer une fille neuve sur la branche, ou accepter le dépassement par écrit.

Le texte s'arrête là. Il ne dit pas ce que devient le travail que la fille n'a pas poussé, et une fille coupée à son plafond n'a, par construction, pas fini. Une fille neuve relancée « sur la branche » ne reçoit que ce qui est sur le dépôt distant ; le reste ne vit que dans le conteneur de la session interrompue, que la plateforme reprend après une période d'inactivité. Entre la coupure et la réponse du produit, il peut se passer des heures.

Ce chemin n'a jamais été joué : sur le chantier 2, aucune fille n'a atteint un plafond (maximum 230 661 tokens et 7,54 $, `map.md`, rétro du chantier 2). Le défaut est lu dans le texte, pas constaté sur un chantier.

Quand le ticket est fait : une fille coupée à son plafond laisse sur le dépôt distant tout ce qu'elle a écrit et un état des lieux, et les trois réponses du produit disent chacune comment le travail reprend.

## Faits vérifiés

Lignes de `origin/main` à `809d62e` (2026-11-14). Si `main` a bougé, retrouver chaque endroit par le texte cité.

- **La coupure.** `skills/chaine/chantier/SKILL.md` § 6, point 1 bis, ligne 89 : `interrupt_session`, la ligne dans `## Dépassements`, la question au produit et ses trois réponses. Rien sur le travail en cours, rien sur la façon de reprendre.
- **Une fille ne connaît pas son plafond.** Le gabarit de son prompt et son déroulé (`chaine-de-production.md` § 5, lignes 95 à 121) n'en disent rien ; seule la ligne 83 le nomme, dans la section du ticket prêt pour agent. Elle ne peut donc pas se préparer à la coupure.
- **Une fille pousse peu.** Elle pousse son commit de réservation (`issue-tracker.md`, « Réserver un ticket », point 2), puis son travail en fin de parcours : le déroulé demande `pnpm check` **une fois** (§ 5, étape 4, ligne 114), et le hook `pre-commit` du socle dit lui-même « un agent commite souvent et ne pousse presque jamais dans une session » (`skills/monorepo/socle-monorepo/references/husky/pre-commit`).
- **Un travail à moitié fait ne passe pas les hooks.** `pre-commit` joue `lint-staged`, puis le typage et les tests des briques touchées ; `pre-push` joue `pnpm run check` en entier (`references/husky/pre-push`). Un état intermédiaire y est le plus souvent rouge.
- **Le contournement est refusé à l'agent.** Le hook d'agent refuse `git commit --no-verify` et `git push --no-verify` tapés par une session (`skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, ligne 86). « Dis à la fille de commiter et de pousser avant de la couper » ne suffit donc pas : la commande sera refusée dès que l'état est rouge.
- **Le précédent existe.** Les scripts de la chaîne passent `--no-verify` eux-mêmes quand le contenu poussé ne peut pas être fautif, et le justifient en tête de fichier : `sujet.sh` (lignes 276, 389, 438, 439, 542, 548, 577, 599), `passer.sh` (lignes 25 et 208), `develop.sh` (lignes 11 et 43).
- **La relance a un modèle, pour un autre cas.** § 6, point 3, ligne 92 : pour une PR renvoyée dont la session ne répond plus, relancer une fille avec `source_revision` = la branche de la PR et, en ligne de situation, le renvoi à lire. Rien d'équivalent pour une relance après plafond.
- **Le gel a le même trou.** « Arrêter un chantier », étape 2, ligne 103 : « Ne rien archiver : leur travail est intact, la reprise les relancera sur leurs branches. » Le travail n'est intact que tant que le conteneur vit, et un gel peut durer des jours.

## À trancher avant de lancer

Une seule décision bloque le ticket : **comment le travail non poussé d'une fille coupée arrive sur le dépôt distant**, sachant qu'il est souvent rouge. C'est un choix technique sans effet sur ce que voit un utilisateur : il revient à l'architecte (`A-n`), ou au produit s'il préfère le prendre.

- **Option 1 — une branche de sauvegarde, écrite par un script (recommandée).** Un script `scripts/chaine/sauvegarder.sh` commite tout l'arbre de travail et le pousse sur `sauvegarde/<branche du ticket>`, avec `--no-verify`, comme le font déjà `sujet.sh` et `passer.sh`. Cette branche n'est jamais la tête d'une PR et n'entre jamais dans un sujet : rien de ce qu'elle contient ne peut être fusionné sans repasser par la branche du ticket, donc par les hooks et la CI. Après `interrupt_session`, le conducteur envoie à la fille un seul message, au texte fixé dans le skill : lancer le script, écrire son état des lieux sous `## Comments` du ticket et en commentaire de la PR, puis s'arrêter. Coût : un tour de plus à contexte plein, un script et son banc.
- **Option 2 — l'état des lieux seul.** Pas de script. Après la coupure, la fille pousse ce qui passe les hooks et décrit le reste en commentaire de la PR (fichiers touchés, où elle en est, ce qui reste). Le code rouge est perdu ; la fille suivante le réécrit d'après la description. Coût : un tour, aucun code.
- **Option 3 — pousser au fil de l'eau.** Le déroulé d'une fille (§ 5) demande un push à chaque étape verte. Rien n'est perdu au-delà de la dernière étape, mais chaque push joue `pnpm run check` en entier, ce qui contredit « `pnpm check` une fois » (§ 5, étape 4) et la section 6 sur l'économie de tokens.

Recommandation : l'option 1. Elle ne perd rien, elle ne change pas le quotidien d'une fille qui finit sous son plafond, et elle suit un motif que le dépôt a déjà justifié trois fois. L'option 3 fait payer à toutes les filles un risque que le chantier 2 n'a rencontré sur aucune.

## Où (une fois l'option choisie)

- `skills/chaine/chantier/SKILL.md` § 6, point 1 bis, verdict `interrompre` (ligne 89) : après `interrupt_session`, le geste de sauvegarde ; puis, pour chacune des trois réponses, la reprise.
  - **Découper** : les nouveaux tickets nomment la branche de sauvegarde et l'état des lieux comme point de départ ; la PR brouillon du ticket d'origine est fermée selon « Abandonner » (`issue-tracker.md`, « Réserver un ticket », point 4), la branche de sauvegarde reste jusqu'à la fusion des nouveaux tickets.
  - **Relancer** : `create_session` avec `source_revision` = la branche du ticket, et une ligne de situation qui nomme la branche de sauvegarde et l'état des lieux à lire. Modèle : le point 3 du même paragraphe (ligne 92). La session interrompue est archivée une fois la sauvegarde vérifiée sur le distant (`git ls-remote`).
  - **Accepter par écrit** : la même session reprend par un `send_message` du conducteur ; le texte dit si un second plafond s'applique, et lequel.
- `skills/chaine/chantier/SKILL.md`, « Arrêter un chantier », étape 2 (ligne 103) : le même geste de sauvegarde avant de s'arrêter, et la phrase « leur travail est intact » accordée à ce qui est vrai.
- `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` : ligne 83 (la phrase sur l'interruption), et § 5 si l'option retenue change le déroulé d'une fille.
- Option 1 seulement : `skills/chaine/chantier/scripts/sauvegarder.sh` et son banc, sur le modèle de `plafonds.mjs` (même dossier) ; `skills/chaine/chantier/references/CONTENU.md`, ligne 3, qui annonce un seul script ; `skills/chaine/fusionner/SKILL.md`, étape 0, ligne 14, qui liste ce que `poser` copie dans `scripts/chaine/`.

## Décisions

La session tranche seule, par défaut prudent, et le dit dans la PR :

- le texte exact du message de sauvegarde et la forme de l'état des lieux (proposé : cinq lignes, comme le rendu d'une fille au § 5, étape 7 : fait, en cours, reste, décision prise par défaut, question) ;
- ce que le conducteur fait si la fille ne répond pas au message de sauvegarde (proposé : le noter dans la ligne de `## Dépassements` et le dire dans la question au produit, sans réessayer) ;
- quand la branche de sauvegarde est supprimée (proposé : par le conducteur, à la fusion de la PR du ticket ou de ses remplaçants).

Hors de ce ticket :

- **Qui contrôle le plafond d'un conducteur ou de l'architecte.** Aujourd'hui chacun se relève lui-même (`chantier/SKILL.md` § 6, point 1 bis, « et le sien » ; `architecte/SKILL.md` § 6) et personne ne l'arrête de l'extérieur. La rétro du chantier 2 l'a constaté sur l'architecte (552 767 tokens pour un plafond de 400 000) et l'a renvoyé au chantier 3.
- Un avertissement à la fille avant son plafond, et un plafond de réveils par chantier : ils attendent une mesure.
- La sortie de l'état « humain » d'une PR renvoyée trois fois, déjà notée dans le brouillard de la carte.

## Surfaces

| Surface                                    | Preuve                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Geste de sauvegarde après la coupure       | lecture de `chantier/SKILL.md` § 6, point 1 bis                                                                            |
| Reprise pour chacune des trois réponses    | lecture du même paragraphe : découper, relancer, accepter ont chacune leur suite                                           |
| Gel d'un chantier                          | lecture de « Arrêter un chantier », étape 2                                                                                |
| Méthode accordée                           | lecture de `chaine-de-production.md`, ligne 83                                                                             |
| Script de sauvegarde (option 1)            | `sauvegarder.test.mjs` « un arbre rouge est poussé sur sauvegarde/<branche>, la branche du ticket n'a pas bougé »          |
| Script de sauvegarde, garde-fou (option 1) | `sauvegarder.test.mjs` « le script refuse de pousser ailleurs que sous sauvegarde/, et refuse depuis develop ou un sujet » |
| Pose dans un projet (option 1)             | lecture de `fusionner/SKILL.md`, étape 0, et de `chantier/references/CONTENU.md`                                           |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Option 1 : `node --test skills/chaine/chantier/scripts/*.test.mjs`. Toute PR vers `main` rejoue seule `pnpm test` (`.github/workflows/ci.yml`, job `bancs`).

## Comments

- 2026-11-14 — Ticket ouvert à la demande du produit, après lecture du chemin « fille au plafond » dans une session de questions. Il n'est rattaché à aucun chantier : la carte du programme n'a pas été modifiée, l'architecte y tient les statuts. Suite du ticket 7 (chantier 2, fini) ; le chantier 3 est son rattachement naturel.
- 2026-11-14 — Clos sans objet. Le produit a décidé le même jour (P-18, `map.md`) qu'aucune session n'est interrompue pour un plafond : le conducteur signale, l'architecte prévient le produit, le produit décide, et la fille continue. Il n'y a donc plus de coupure au plafond, ni de travail perdu par elle. Un fait de ce ticket reste vrai et n'a pas de ticket : au gel d'un chantier, les filles sont toujours interrompues (`chantier/SKILL.md`, « Arrêter un chantier », étape 2), et leur travail non poussé ne survit pas au conteneur.
