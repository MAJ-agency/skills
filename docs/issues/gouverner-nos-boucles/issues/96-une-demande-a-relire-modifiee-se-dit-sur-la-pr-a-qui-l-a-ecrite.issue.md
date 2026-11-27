# Une demande `À relire` modifiée se dit, sur la PR et à qui l'a écrite : elle n'est plus écartée en silence

Status: needs-triage
Type: défaut
Modèle: sonnet — une marque lue de plus dans `lireMarques`, un geste de plus dans `decider`, une ligne de plus dans `jouer` et dans la table du skill `relecteur` ; la forme et la place sont fixées par les décisions `A-227` et `A-228` (proposées, à confirmer par l'architecte). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/decision-relecteur.mjs` (en-tête, lignes 23 à 31 ; `lireMarques`, lignes 140 à 187 ; `decider`, lignes 370 à 386) et son banc `decision-relecteur.test.mjs` ; `skills/chaine/relecteur/scripts/relecteur.mjs` (en-tête, lignes 36 à 50 ; `jouerGeste`, ligne 370) et son banc `relecteur.test.mjs` ; `skills/chaine/relecteur/SKILL.md` (la table, lignes 35 à 43 ; « Les lignes », ligne 76) ; `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` (étape 5, ligne 130) ; `scripts/relecteur.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, que toute PR de suite touche. Le ticket 97 touche aussi `relecteur/SKILL.md` et `scripts/relecteur.test.mjs`, à d'autres lignes : ce ticket d'abord. Le ticket de suite du constat (4) (famille `fusionner` : `renvoyer.sh` lit l'auteur sur la demande) lira la même demande : s'il la lit par `lireMarques`, il hérite du même silence, et la règle d'`A-227` vaut pour lui.

## Le besoin

Constat (1) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 17 h 50 UTC, et l'entrée « Fin de l'essai réel du régime 8 »). Sur la PR #10 du jouet, la fille a écrit sa demande `À relire`, puis ce commentaire a été modifié 7 secondes après sa création. Au push suivant, le Relecteur a joué la règle 3 (`à-fusionner` retirée, `à-reprendre` posée, « le contenu a changé depuis le verdict : redemander la relecture »). La ligne est partie sans destinataire : `auteur` et `conducteur` valaient `null`. Personne n'a été averti du retrait, sauf par le relais du conducteur.

Le besoin : **une demande modifiée est écartée, et l'écart se dit.** Un commentaire sur la PR le trace, et une ligne part à qui l'a écrite : la session de sa ligne `Session:` et celle de sa ligne `Conducteur:`.

## La cause, à la source (`main` en 8.4.0)

1. `skills/chaine/fusionner/scripts/verdict.mjs:79-80` (`retenir`) : un commentaire d'un compte qui compte, dont `updated_at` diffère de `created_at`, part dans `ecartes` avec le motif `edite`. C'est voulu (`A-118`) : un commentaire modifié ne décide rien.
2. `skills/chaine/fusionner/scripts/decision-relecteur.mjs:146-148` (`lireMarques`) : la boucle sur `ecartes` ne lit que les verdicts (`lireVerdict`). Tout autre commentaire modifié, une demande comprise, passe par `if (v === null) continue;`. Il n'entre ni dans `demandes`, ni dans `presque`, ni dans aucune liste : aucune trace.
3. `decision-relecteur.mjs:383` : `const demande = marques.demandes.at(-1) ?? { auteur: null, conducteur: null };`. Sans demande intacte, toutes les lignes `auteur` et `conducteur` du geste valent `session: null`. `skills/chaine/relecteur/scripts/relecteur.mjs:300` et `:318` lisent la demande de même, pour `faits` et pour l'illisible.
4. `skills/chaine/relecteur/SKILL.md:76` : `session` vaut `null`, « personne n'est sonné ». La règle est juste pour une PR écrite sans session (`Session: —`) ; elle rend muette une PR dont la demande a été modifiée.

La décision, elle, ne dépend pas de la demande : la règle 6 distribue un tour sur l'étiquette `à-relire` seule (`decision-relecteur.mjs:451`). C'est pourquoi le tour 1 de #10 a été distribué sans demande lisible. Le défaut ne touche que les destinataires.

## Décisions (proposées)

1. **`A-227` — La demande modifiée reste écartée ; ses lignes `Session:` et `Conducteur:` ne servent qu'à dire l'écart.** Elle ne fixe jamais les destinataires des autres lignes, ni rien de la décision. Raison : `A-118` tient (un commentaire modifié ne décide rien). Lire deux identifiants pour leur envoyer un texte fixe ne fait rien décider à la PR : le texte ne reprend rien du commentaire. Le compte qui a modifié est un compte qui compte (`retenir` juge `auteur` avant `edite`). Quand le corps modifié n'a plus la forme de la demande, ou que les deux valent `—`, la ligne part à l'architecte.
2. **`A-228` — L'écart se dit par un geste neuf, `signaler`, rendu par `decider` juste après le contrôle de l'illisible et avant la règle 1.** Il porte un commentaire, la trace, et ses lignes. La trace : `Demande écartée — commentaire <id> modifié après sa création : redemander la relecture d'un commentaire neuf, jamais modifié`. Elle n'est pas une marque : elle ne compte pas dans `dernier`, et un commentaire qui en porte le préfixe sans la forme est ignoré, jamais une lecture illisible (`tourValide`, qui lit sans tolérance, ne change donc pas pour le capitaine). Le geste se rend quand une demande modifiée est plus récente que la dernière demande intacte, et qu'aucune trace ne nomme encore son commentaire. Une fois la trace écrite, la décision suit son cours. Le Relecteur joue `jouer <n>`, envoie ses lignes, puis rejoue `jouer <n>` aussitôt : le geste de la PR ne prend aucun retard sur une passe de la veille. Raison : un seul geste par appel, comme aujourd'hui ; et la trace écrite une fois rend le geste idempotent sans mémoire.

Les deux textes :

- trace sur la PR : ci-dessus ;
- ligne à l'auteur et au conducteur (ou à l'architecte) : `PR <n> : demande de relecture écartée (commentaire <id> modifié après sa création) : en écrire une neuve, jamais modifiée`.

## Quand le ticket est fait

1. Sur une PR dont la seule demande `À relire` est modifiée, `decider` rend `signaler`, avec la trace et deux lignes : `auteur` vers la session de `Session:`, `conducteur` vers celle de `Conducteur:`, lues sur le commentaire modifié.
2. Une demande modifiée dont le corps n'a plus la forme, ou dont les deux champs valent `—` : une seule ligne, à l'architecte.
3. La trace écrite, `decider` rend le geste qu'il rendait avant ce ticket, avec les mêmes lignes (sans destinataire tant qu'aucune demande intacte n'existe).
4. Une demande intacte plus récente que la demande modifiée : aucun `signaler`, et ses destinataires servent comme aujourd'hui.
5. Une demande intacte plus ancienne et une demande modifiée plus récente : `signaler` d'abord ; puis les lignes des autres gestes vont aux destinataires de la demande intacte.
6. Un commentaire au préfixe de la trace sans sa forme ne fait ni `illisible`, ni `pause`, ni `signaler` ; `tourValide` rend le même tour avec ou sans trace.
7. Un commentaire modifié d'un compte qui ne compte pas (motif `auteur`) ne déclenche rien.
8. `relecteur.mjs jouer <n>` écrit la trace (`commenter`) pour `signaler` et rend ses lignes ; une écriture refusée sort en 7, comme pour le plafond.
9. La veille se réveille sur `signaler` (elle le fait déjà : le geste n'est pas dans la liste des gestes muets, `relecteur.mjs:445`) ; le banc le prouve.
10. `relecteur/SKILL.md` a une ligne de table pour `signaler` (« `jouer <n>`, ses lignes, puis `jouer <n>` de nouveau, et son geste ») ; « Les lignes » dit qu'une demande modifiée ne sonne personne d'autre que par cette ligne.
11. `chaine-de-production.md`, étape 5, dit : « la demande ne se modifie jamais ; une erreur (un sha faux) se corrige par une demande neuve ».
12. La note de version (la suivante de `main` au moment de livrer) dit le geste neuf, et qu'un projet repose `fusionner` (le script de la décision est celui de son `develop`) avant que son Relecteur le joue.

## Où

| Fichier (lignes sur `main` en 8.4.0) | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs:9-31` | l'en-tête : la trace, et la troisième exception à « un commentaire modifié est écarté » |
| `decision-relecteur.mjs:140-187` (`lireMarques`) | les demandes modifiées lues dans `ecartes` (motif `edite`, corps au préfixe `À relire — `) dans une liste `demandesModifiees` (`id`, `rang`, `auteur`, `conducteur`, `lisible`) ; les traces lues dans une liste `ecarts`, hors de `dernier` |
| `decision-relecteur.mjs:370-386` (`decider`) | le geste `signaler`, après l'illisible et avant la règle 1 |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs` | les cas 1 à 7 ci-dessus (l'aide `fil` sait déjà `edite: true`, ligne 21) |
| `skills/chaine/relecteur/scripts/relecteur.mjs:36-50`, `:370` | l'en-tête ; `signaler` écrit son commentaire comme `plafonner`, `panne` et `illisible` |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | les cas 8 et 9, sur le faux GitHub (`PR.editions`, `faux-gh.mjs:46` et `:206`) |
| `skills/chaine/relecteur/SKILL.md:35-43`, `:76` | la ligne de table, la phrase des lignes (cas 10) |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:130` | la phrase du cas 11 |
| `scripts/relecteur.test.mjs` | un test de texte : la ligne de table et la phrase de l'étape 5 |
| `skills/chaine/fusionner/references/CONTENU.md` | la trace dans la description des calculs de la relecture |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main`, la note (cas 12) |

## Bancs à écrire

- **Rouges avant le code** : les cas 1, 2, 5 et 8 (aujourd'hui, aucun `signaler`, les lignes valent `null`).
- **Verts avant et après** : les cas 4, 6 et 7, qui gardent ce qui marche.
- **Mutations**, toutes rouges : la trace comptée dans `dernier` ; `signaler` placé après la règle 3 ; la trace non lue (le geste rendu à chaque passe) ; les destinataires de la demande modifiée servis aux autres lignes ; le motif `auteur` traité comme `edite`.

## Ce qui n'a pas été établi

- **Quel geste a modifié la demande de #10.** Le dépôt jouet n'est pas lisible d'ici. Le journal nomme une piste, un outil qui ajoute un pied de page après coup ; elle n'est pas prouvée, et elle n'est pas systématique (la demande du tour 2 de #10 n'a pas été modifiée, journal, 17 h 48). L'historique des modifications du commentaire (`userContentEdits`, API GraphQL) le dirait. Si c'est un outil de la plateforme, le pied connu est déjà retiré par `corpsLu` (`verdict.mjs:45`), mais la date de modification reste : le ticket ne change pas, il se joue plus souvent.

## Hors périmètre

- Changer `A-118` : un commentaire modifié ne décide toujours rien.
- Le script qui écrit la demande depuis `git rev-parse HEAD` (constat (8), famille `chantier`).
- `renvoyer.sh` (constat (4), famille `fusionner`).

## Comments
