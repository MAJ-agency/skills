# Passation — architecte A : le plugin, la relecture indépendante (2026-11-19)

Décision du produit du 2026-11-19 (« oui ») : le rôle d'architecte du programme « gouverner nos boucles » se coupe en deux. **Tu es l'architecte A** : le plugin `MAJ-agency/skills`, et d'abord le chantier 3, la relecture indépendante. L'architecte B prend Anchorpost (voir [`2026-11-19-architecte-anchorpost.md`](2026-11-19-architecte-anchorpost.md)). L'architecte sortant, `session_017ZgEwLrqQyenjLrzHpv1Kt`, s'arrête une fois les deux suites en place.

Tu parles au produit : en français, phrases simples, recommandation d'abord, **une seule question à la fois, à laquelle on répond par oui ou non**. Il écarte ce qui lui paraît compliqué : une seule voie simple, avec ce qu'elle ne couvre pas. `skills` est public : rien de privé, aucun nom de personne, aucun chemin de poste, aucun détail d'un projet client.

## Ce que tu lis, et comment

- **La carte du programme** : `docs/issues/gouverner-nos-boucles/map.md`, branche `claude/compassionate-euler-st84s9`. Elle est très longue : `## Fiche`, cette passation, et le journal du 18 et du 19 novembre ; une décision se lit par `grep -n "<n> —"`. Tu la tiens : mets `Architecte:` à jour, écris au journal, commits par chemin (`git commit … -- <chemins>`).
- **La spec du chantier 3** : `relecture-independante.spec.md` (sixième version, décisions `A-73` à `A-126`), même dossier. Le rapport `relecture-independante.verif-716.md` dit ce que le plugin 7.16.0 et les tickets de l'autre programme changent sous elle.
- **Les tickets** : `issues/54-…` à `issues/60-…`, même dossier.

## État du chantier 3 au 2026-11-19, 08 h UTC (à revérifier sur GitHub)

| Lot | Ticket | État |
| --- | --- | --- |
| 3a, lecteur de verdict et décision du Relecteur | 58 | **Fait**, PR 122, plugin 7.23.0 |
| 3b, « même contenu propre » | 59 | **Fait**, PR 126, plugin 7.30.0 (`f58ccad`), arbre vérifié, session archivée |
| 3c, « double relecture exigée » | 60 | Trois tours de relecture adversariale faits ; dernière retouche portée ou en cours (apostrophe doublée, clone partiel nommé, `safe.directory`) ; **à lancer** dès qu'elle est commitée |
| 1, CODEOWNERS sort du plugin | 54 | Écrit, `needs-info` : à rejouer sur `main` |
| 2, bilan supprimé, gate des trois écritures | 55 | Écrit, `needs-info` ; doit aussi faire accepter `Règles: —` par le gate (`A-117`) |
| hors lots, le conducteur ne rafraîchit plus le sujet | 56 | Prêt, attend les tickets de l'autre programme sur `chantier/SKILL.md` |
| hors lots, une sous-PR à la fois tenue par le capitaine | 57 | Écrit, `needs-info`, même attente (`boucle.sh`) |
| 3d, 4, 5a à 5c, 6, 7, 8, 9 | — | À écrire ; ordre et attentes dans le tableau de la spec, « Les lots » |

- **Quand une PR est renvoyée pour un numéro de version repris par `main`** (arrivé aux PR 122 et 126) : fusion de `main` et version suivante, rien d'autre, par une session neuve si l'ancienne dépasse 300 000 ; vérifier que seuls la version et la note changent ; reposer l'ordre. **À chaque fusion** : vérifier que l'arbre de `main` est celui du sommet relu, passer le ticket à « Fait », relever le coût de la session, l'archiver.
- **Ordre de fusion dans `skills`** (dépôt sans la chaîne) : un commentaire dont le corps est exactement `à-fusionner au sommet <sha de 40 caractères>` suivi du pied de page des sessions cloud, puis le label `à-fusionner`. Jamais avant la contre-relecture d'un ticket `Label: contre-revue`. Le capitaine de `skills` renvoie une PR en conflit ou en retard sur `main`.

## La méthode qui a payé, à garder

- **Chaque ticket passe trois tours de relecture adversariale** par un agent neuf (« cherche à casser, pas à confirmer »), le même relecteur d'un tour à l'autre ; au troisième, l'architecte tranche (`P-53`). **Chaque PR passe une contre-relecture** par un autre agent neuf, sur le code réel, qui rejoue les attaques. Bilan sur les lots 3a à 3c : une trentaine de défauts réels, dont des validations à tort, trouvés avant toute fusion ; deux venaient de règles écrites par l'architecte lui-même (`A-118`, `A-121`).
- **Fermer une famille, pas un cas** : pour « même contenu propre », les trous sont tombés quand la règle est devenue de structure (dépôt propre pour calculer, « même » qui se prouve, dispense retirée), `A-119`, `A-123`, `A-125`.
- Les prompts d'agents interdisent tout signal hors de leurs propres processus et imposent un `TMPDIR` privé ; un clone jetable par agent, retiré à la fin.

## L'autre programme sur le plugin

« Capitaine à jour et testé » livre vite sur `main` (7.16.0 à 7.29.1 en un jour), sur les fichiers que les lots 1, 2, 3d, 4, 5 et 6 doivent toucher. Sa carte : `docs/programmes/capitaine-a-jour-et-teste.programme.md`. Son architecte est sur un autre compte : `send_message` répond « introuvable », la coordination passe par le produit. Règle tenue : aucun ticket du chantier 3 ne touche un fichier chaud de ce programme avant l'entrée de ses tickets ; tout ticket part de `main` et reprend `main` avant de livrer (version suivante, note en tête de `NOTES-DE-VERSION.md`).

## Tickets du plugin notés, pas encore écrits

1. La carte d'un chantier grossit sans limite et le skill dit de la lire : passation courte en tête, journal archivé par jour, règle de lecture à la reprise (mesuré : 160 Ko, 150 000 tokens de lectures de départ).
2. Une veille de capitaine morte avec son conteneur, file vide, ne prévient personne (cinq heures quarante sans lecture de la file le 19).
3. `archive_session` est refusé au conducteur par la garde, alors que le skill lui en fait un geste (`P-62` en attendant).
4. La fiche `tests.md` du socle (titres `should … when …`) contredit l'ADR sur la langue des noms de tests.
5. `meme-contenu.sh` : nommer la cause d'un clone partiel, et le cas `safe.directory` (relevés sur le calcul du ticket 60, à porter au 59).
6. Le clone superficiel des sessions cloud : la préparation du capitaine et celle du Relecteur approfondissent une fois (`A-126`, lots 4 et 5a).
7. Suites relevées à la contre-relecture de la PR 122, pour le lot 4 : relire le fil juste avant d'écrire une distribution ; le geste « illisible » prévient aussi l'auteur ; l'exécutant ne renvoie pas des lignes déjà écrites.

## Ce qui attend le produit, de ton côté

Rien qui bloque. En attente depuis le 18 au matin : six descriptions de specs à valider une à une ; la signature du plancher d'Anchorpost ; le glossaire ; une PR de documentation qui porte la carte vers `main`. Le 2026-11-23, le quota revient : décider du retour aux modèles d'origine. À lui redire à la bascule du chantier 3 : l'accord sur les fichiers sensibles de chaque repose, le passage ticket par ticket, le coût d'une session de relecture par PR.

## Coût

Session de l'architecte sortant : 1 856,86 $ au 2026-11-19 à 07 h UTC, contexte 800 000 tokens ; c'est la première raison de cette coupe.
