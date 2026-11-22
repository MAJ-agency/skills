# Régime 7 : ce qui ne vaut que pour une PR d'avant la relecture indépendante

Les skills `chantier`, `architecte`, `fusionner` et `sujet` décrivent le **régime 8** : la relecture indépendante, où la session qui code ne se relit plus et où le Relecteur du dépôt pose `à-fusionner` sur un verdict validé. Ce fichier garde ce qui ne vaut qu'en **régime 7**, la chaîne d'avant, jusqu'au nettoyage du plugin, quand plus aucune PR des projets n'est en régime 7 : il sort alors avec la branche 7 des scripts.

**Quel régime.** Une PR est en régime 8 quand sa base (`origin/develop` ou `origin/sujet/<nom>`, celle-là seule) porte la clé `relecture` dans `.claude/chaine.json` **et** qu'elle a été ouverte après `relecture.depuis` ; sinon elle est en régime 7. Une session le lit dans la sortie de `bash scripts/chaine/sujet.sh demarrer` : la ligne `régime 8 : relecture indépendante ; …` dit le régime 8, son absence le régime 7. Un ticket se réserve par une PR brouillon avant tout code : un ticket commencé avant la repose finit en régime 7, sur les documents de sa branche (`docs/agents/chaine-de-production.md` tel qu'il y est), quel que soit le moment où `develop` arrive dans son sujet. Un dépôt sans `.claude/chaine.json` n'a pas la chaîne : rien de ceci ne le concerne.

## Le conducteur (skill `chantier`)

- **Le ticket.** Un ticket dont `Fichiers chauds:` touche `cheminsSensibles` de `.claude/chaine.json` porte la ligne `Label: contre-revue` en tête, obligatoire (le gate `tickets` refuse le ticket sans elle ; l'ancienne valeur `Label: architecte` a le même effet) ; c'est elle qui donne à la fille son régime de livraison. Un ticket qui crée un module d'authentification, de droits, de chiffrement, de paiement ou d'export ajoute son dossier à `cheminsSensibles` **dans la même PR de cadrage** ; poser un socle (`socle-chaine-de-production`, `socle-tests`) est du cadrage, que le conducteur fait lui-même.
- **Le prompt d'une fille.** Le régime de livraison se lit sur `Label:` dans l'en-tête du ticket, jamais sur le prompt (cas vécu : un prompt qui annonçait une contre-revue sur un ticket sans `Label:` a fait deviner son régime à la fille, et trois sessions ont perdu du temps).
- **La contre-revue du conducteur** sur toute PR qui touche un chemin sensible (`.claude/chaine.json`), par sous-agent, une fois le code poussé (pas sur le seul commit de réservation) ; des écarts réels ont été trouvés dans chacun des neuf tickets API relus, malgré la revue adversariale de la fille. Écart bloquant : `fusion-bloquée` et la liste à la fille, avant que le capitaine squashe. Le capitaine fusionne dès la CI verte, avant le réveil suivant. Pour un ticket `Label: contre-revue` (ou l'ancien `Label: architecte`), la fille livre **sans** `à-fusionner` ; le conducteur contre-relit, puis pose le label lui-même.
- **L'ordre de passage.** Une sous-PR à la fois par sujet, tenue par le capitaine (skill `chantier` § 6, point 5) : le conducteur étiquette toutes les sous-PR prêtes d'une vague sans attendre que la précédente soit entrée, et il ne retire ni ne repose jamais `à-fusionner` pour régler l'ordre de passage.
- **La livraison d'un sujet** ouverte à la main (`sujet.sh livrer <nom> "<titre>"`) s'ouvre sans `à-fusionner`, que le conducteur pose après sa contre-revue si elle touche un chemin sensible, sinon tout de suite.

## La session qui code (`docs/agents/chaine-de-production.md` § 5, tel que sa branche le porte)

Revue de ticket (skill `revue-de-ticket`), section `## Revue de ticket` dans le corps de la PR, que le capitaine lit ; puis `Status: Fait — PR #<n>`, PR hors brouillon après le dernier push, label `à-fusionner` posé par la session elle-même, sauf pour un ticket `Label: contre-revue`, livré sans lui. Renvoyée par le capitaine (`fusion-bloquée`) : corriger, retirer `fusion-bloquée`, remettre `à-fusionner`.

## L'architecte (skill `architecte` et `references/lancement.md`)

- **Une PR livrée** : la session qui la livre pose `à-fusionner`, l'architecte le pose lui-même sur ses PR de documentation ; pour un ticket `Label: contre-revue` qu'il a lancé hors chantier, il contre-relit lui-même (par un sous-agent) et écrit son verdict sur la PR, avant l'ordre, jamais après (`references/lancement.md`, « La session d'un ticket hors chantier »).
- **Une PR étrangère au programme** : sans risque, il pose lui-même `à-fusionner`, après avoir lu ses commentaires.

## Le capitaine (skill `fusionner`)

| Qui                  | Fait                                                   | Ne fait jamais                                                    |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Session de travail   | label `à-fusionner` dès le push                        | fusionner, remettre la branche à jour avec develop                |
| Capitaine            | fait passer la file dans l'ordre, renvoie ce qui casse | résoudre le conflit de code d'une autre session, pousser en force |
| Propriétaire renvoyé | corrige, retire `fusion-bloquée`, remet `à-fusionner`  | fusionner « puisque c'est corrigé »                               |

En régime 7, le capitaine lit la revue dans le corps de la PR : pour les chemins que `revue-exigee.mjs` désigne, une section « Revue de ticket » ou « Revue adversariale » (un titre Markdown hors bloc de code), et sur un chemin sensible de la base la ligne « - `/security-review` : lancée » de cette section ; une PR qui ne les porte pas est renvoyée (sortie 4), avec son motif. Il ne lit aucun verdict et ne contrôle rien une seconde fois avant l'appel de fusion. Le renvoi dit « corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner` » (`renvoyer.sh`).

## Les sujets (skill `sujet`)

- **Session de travail** : label `à-fusionner` dès le push, posé par la session.
- **Recevoir develop dans un sujet** : la PR de mise à jour est étiquetée `à-fusionner` par la session qui la fait, et son corps porte, après « Réception de develop » et « Retouches », une section « Revue de ticket » :

```markdown
## Réception de develop

`origin/develop` (`<sha court>`) fusionné dans `sujet/<nom>` (`<sha court>`), en une seule fusion.
Conflits résolus : `<fichier>` — <résolution> | aucun

## Retouches

| Fichier | Raison |
| ------- | ------ |
| `<fichier>` | <ce que develop exige du sujet> |

## Revue de ticket

<section de la revue de ticket>
```

  « Revue de ticket » dès qu'une résolution ou une retouche touche un chemin que `revue-exigee.mjs` (skill `fusionner`) exige, formatage compris (une retouche de formatage sous `apps/` l'exige ; `docs/` et le Markdown, non). Une PR de réception sans conflit de code ni retouche de code n'en exige aucune. Après une montée d'outil, la session joue la revue de ticket sur ses retouches ; elle porte sur la résolution (`git show --remerge-diff <fusion>`) et sur l'union des fichiers de chaque retouche (`git log -p --first-parent <fusion>..<sommet>`, commit par commit).
- **Livrer à la main** : la PR s'ouvre sans `à-fusionner` : le poser après la relecture qu'elle demande (contre-revue si elle touche un chemin sensible). Renvoyée : corriger sur le sujet, retirer `fusion-bloquée`, remettre `à-fusionner`.
