# Les consignes de lancement disent des gestes, et la fille écrit dès sa PR livrée

Status: ready-for-agent
Type: task
Modèle: sonnet
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `.claude-plugin/plugin.json`

## Le besoin

Deux leçons du chantier 2 (carte du programme, [`../map.md`](../map.md), « Rétro du chantier 2 ») ne sont pas encore dans le plugin.

La première est la décision `A-14 bis`. Le second capitaine de `skills` a refusé de fusionner la PR 65 parce que sa consigne lui interdisait « de monter la ligne version ». L'architecte voulait dire « ne modifie rien toi-même » ; les mots disaient « ne laisse pas entrer une montée de version ». Le capitaine a eu raison de s'arrêter : un interdit écrit comme un contenu s'applique aux PR qu'on lui nomme.

La seconde : les filles de la vague 1 n'ont écrit à l'architecte qu'après la fusion de leur PR, parce que le gabarit de prompt dit « une fois à la fin ». L'architecte a donc nommé leurs PR au capitaine avec retard.

La décision `A-14` (une consigne ne s'élargit pas par message) est déjà dans le plugin : `skills/chaine/architecte/SKILL.md` § 4 et `lancement.md`, dernière ligne. Ce ticket n'y touche pas.

Quand le ticket est fait, le mode d'emploi du lancement dit comment écrire un interdit, et le gabarit de prompt d'une fille dit sans ambiguïté quand elle écrit.

## Où

Lignes de `origin/main` à `c939479` (2026-11-13).

- `skills/chaine/architecte/references/lancement.md` (41 lignes), section « Le capitaine d'un dépôt » (ligne 24), après le paragraphe « La procédure du capitaine est celle du skill `fusionner` » (ligne 34) : un paragraphe nouveau, de trois à cinq phrases. Il dit que les interdits d'une procédure donnée dans un prompt s'écrivent comme des **gestes de la session** (« tu ne modifies aucun fichier toi-même », « tu ne pousses sur aucune branche »), jamais comme des **contenus** (« ne pas monter la version ») ; que le contenu d'une PR nommée a été validé avant d'être nommé, et que le capitaine ne le rejuge pas ; et il cite le cas vécu par son fait et sa date (2026-11-13, la PR qui montait la version du plugin), sans identifiant de session.
- `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, gabarit du prompt d'une fille, ligne 102 : « Écris-moi (send_message) si tu es bloqué, et une fois à la fin » devient « Écris-moi (send_message) si tu es bloqué, et dès ta PR livrée, sans attendre ni les contrôles ni la fusion ». L'étape 7 de la même section (ligne 117, « Rendre la main ») place déjà ce message après la livraison : elle ne change pas.
- `skills/chaine/chantier/SKILL.md`, ligne 77 : « si elle est bloquée, et une fois à la fin » reçoit la même formule (« et dès sa PR livrée, sans attendre ni les contrôles ni la fusion »).
- `.claude-plugin/plugin.json`, ligne 3 : `5.0.0` devient `5.0.1`. La description du plugin ne change pas.

## Décisions

- `A-14 bis` de la carte : les interdits d'un capitaine s'écrivent comme des gestes, pas comme des contenus.
- `A-1` de la carte : une seule montée de version par lot. Ce ticket est un lot à lui seul : il monte la version.
- Correctif de prose, sans changement de comportement d'un script : version de correctif (`5.0.1`), modèle sonnet.
- Rien n'est ajouté à `skills/chaine/architecte/SKILL.md` (88 lignes) : le détail vit dans la référence, que le § 4 du skill demande déjà de lire avant d'écrire un prompt.

## Surfaces

| Surface                                                        | Preuve                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lancement.md`, section du capitaine                           | le paragraphe nouveau contient « gestes », la date du cas vécu, et aucun identifiant de session (`session_`) |
| gabarit du prompt d'une fille, `chaine-de-production.md`, et `chantier/SKILL.md` ligne 77 | `grep -rn "une fois à la fin" skills/ --include=*.md` ne rend plus rien ; « dès ta PR livrée » est une fois dans le gabarit |
| `.claude-plugin/plugin.json`                                   | `"version": "5.0.1"`                                                                                      |

## Vérification

- `pnpm test` vert (les bancs lisent des scripts, aucun ne lit ces textes : le nombre de tests ne change pas) ; `skills/chaine/chantier/SKILL.md` reste sous 200 lignes.
- `grep -rn "une fois à la fin" skills/ --include=*.md` ne rend rien.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche `claude/compassionate-euler-st84s9`, ne le modifie pas, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Comments
