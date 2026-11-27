# Une demande `À relire` modifiée se dit, sur la PR et à qui l'a écrite : elle n'est plus écartée en silence

Status: ready-for-agent
Type: défaut
Modèle: opus — une lecture de plus dans `lireMarques` (les demandes modifiées et une seconde trace hors de `dernier`, à la règle inverse de la note du ticket 94), un geste de plus dans `decider` placé avant la règle 1, une écriture de plus dans `jouer`, la table du skill, et leurs bancs ; la forme et la place sont les décisions `A-227` et `A-228`, l'ordre `A-232`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 94, 95
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/decision-relecteur.mjs` (en-tête 9-31, dont 19-20 et 23-31 ; `lireMarques` 121-187 ; `decider` 370-392) et `decision-relecteur.test.mjs` ; `skills/chaine/relecteur/scripts/relecteur.mjs` (en-tête 39-54 ; `jouerGeste` 349-376, l'écriture 370-373) et `relecteur.test.mjs` ; `skills/chaine/relecteur/SKILL.md` (table 35-43, paragraphe de `jouer` 45, « Les lignes » 76) ; `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` (étape 5, ligne 130) ; `skills/chaine/fusionner/references/CONTENU.md` (63) ; `scripts/relecteur.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 94 et 95, en dernier** (`A-232`) : ce ticket reprend la trace de 94 (la note, hors de `dernier`), son geste `noter` et sa ligne de table, et la veille réécrite par 95 (la clé, `SOURDINES`) ; **ses numéros de ligne sont lus sur `main` avant 94 et 95**, qui décalent `lireMarques`, `decider`, `relecteur.mjs` et `SKILL.md` : relire chaque ligne citée après eux. Le ticket 97 touche ensuite `relecteur/SKILL.md` et `scripts/relecteur.test.mjs`, une PR plus tard. Le ticket de suite du constat (4) (famille `fusionner` : `renvoyer.sh` lit l'auteur sur la demande) lira la même demande : s'il la lit par `lireMarques`, il hérite du même silence, et la règle d'`A-227` vaut pour lui.

## Le besoin

Constat (1) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 17 h 50 UTC, et l'entrée « Fin de l'essai réel du régime 8 »). Sur la PR #10 du jouet, la fille a écrit sa demande `À relire`, puis ce commentaire a été modifié 7 secondes après sa création. Au push suivant, le Relecteur a joué la règle 3 (`à-fusionner` retirée, `à-reprendre` posée, « le contenu a changé depuis le verdict : redemander la relecture »). La ligne est partie sans destinataire : `auteur` et `conducteur` valaient `null`. Personne n'a été averti du retrait, sauf par le relais du conducteur.

Le besoin : **une demande modifiée est écartée, et l'écart se dit.** Un commentaire sur la PR le trace, et une ligne part à qui l'a écrite : la session de sa ligne `Session:` et celle de sa ligne `Conducteur:`.

## La cause, à la source

Lignes lues sur `origin/main` à `b57eae7` (plugin 8.5.0 ; ces fichiers sont ceux de 8.4.0, inchangés), avant les tickets 94 et 95.

1. `skills/chaine/fusionner/scripts/verdict.mjs:79-80` (`retenir`) : un commentaire dont l'`author_association` n'est pas celle d'un compte qui compte part dans `ecartes` avec le motif `auteur` ; sinon, un commentaire dont `updated_at` diffère de `created_at` y part avec le motif `edite`. C'est voulu (`A-118`) : un commentaire modifié ne décide rien. `retenir` juge l'association de **l'auteur du commentaire** : l'API ne dit pas qui l'a modifié.
2. `skills/chaine/fusionner/scripts/decision-relecteur.mjs:146-148` (`lireMarques`) : la boucle sur `ecartes` ne lit que les verdicts (`lireVerdict`). Tout autre commentaire modifié, une demande comprise, passe par `if (v === null) continue;`. Il n'entre ni dans `demandes`, ni dans `presque`, ni dans aucune liste : aucune trace.
3. `decision-relecteur.mjs:383` : `const demande = marques.demandes.at(-1) ?? { auteur: null, conducteur: null };`. Sans demande intacte, toutes les lignes `auteur` et `conducteur` du geste valent `session: null`. `skills/chaine/relecteur/scripts/relecteur.mjs:300` et `:318` lisent la demande de même, pour `faits` et pour l'illisible.
4. `skills/chaine/relecteur/SKILL.md:76` : `session` vaut `null`, « personne n'est sonné ». La règle est juste pour une PR écrite sans session (`Session: —`) ; elle rend muette une PR dont la demande a été modifiée.

La décision, elle, ne dépend pas de la demande : la règle 6 distribue un tour sur l'étiquette `à-relire` seule (`decision-relecteur.mjs:451`). C'est pourquoi le tour 1 de #10 a été distribué sans demande lisible. Le défaut ne touche que les destinataires.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-227`** et **`A-228`**, l'ordre des tickets par **`A-232`** (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-227` — La demande modifiée reste écartée ; ses lignes `Session:` et `Conducteur:` ne servent qu'à dire l'écart.** Elle ne fixe jamais les destinataires des autres lignes, ni rien de la décision. Une demande modifiée se lit dans `ecartes`, motif `edite`, corps au préfixe `À relire — ` : son auteur compte (`retenir` a jugé son `author_association` avant `edite`) ; qui l'a modifiée, nul ne le sait, et le texte envoyé ne reprend rien du commentaire. Un commentaire modifié d'un compte qui ne compte pas (motif `auteur`) ne déclenche rien ; un commentaire modifié qui ne porte plus le préfixe n'est plus une demande, et ne déclenche rien non plus.
2. **Les destinataires de `signaler`** : `Session:` non nul, une ligne `auteur` vers cette session ; `Conducteur:` non nul, une ligne `conducteur` vers celle-ci ; **un seul des deux à `—`, seule la ligne de l'autre part** ; les deux à `—`, ou un corps qui a le préfixe sans la forme de la demande (`FORME_DEMANDE`, `:51`), **une seule ligne, à l'architecte**.
3. **`A-228` — L'écart se dit par un geste neuf, `signaler`**, rendu par `decider` après le contrôle de l'illisible (`:372-379`) et avant la règle 1 (`:392`) : `{ regle: null, geste: 'signaler', commentaire: <trace>, lignes }`. Il se rend quand la demande modifiée la plus récente est plus récente que la dernière demande intacte (ou qu'il n'y en a pas), et qu'aucune trace ne nomme encore son commentaire. Une fois la trace écrite, la décision suit son cours, avec les destinataires de la dernière demande intacte (aucun s'il n'y en a pas). Le Relecteur joue `jouer <n>`, envoie ses lignes, puis rejoue `jouer <n>` aussitôt, et le geste qu'il rend : la PR ne prend aucun retard sur une passe de la veille. Un seul geste par appel, comme aujourd'hui.
4. **La trace** : `Demande écartée — commentaire <id> modifié après sa création : redemander la relecture d'un commentaire neuf, jamais modifié`, `<id>` l'identifiant entier du commentaire (`id` de l'API, que `retenir` rend). `FORME_ECART` la lit exactement. Elle n'est pas une marque : elle n'entre pas dans `dernier`, et **un commentaire qui porte son préfixe (`Demande écartée — `) sans sa forme est ignoré**, jamais une lecture illisible : `tourValide`, qui lit sans tolérance, ne change pas pour le capitaine. C'est la règle inverse de la note du ticket 94 (presque à la forme : illisible) : l'en-tête le dit (décision 7).
5. **Les traces se lisent parmi les `retenus` seulement** (intactes, d'un compte qui compte), dans une liste `ecarts` (`{ id, rang, date, commentaire }`). **Une trace elle-même modifiée** part dans `ecartes` et n'est pas lue : `signaler` se rend alors une fois de plus, écrit une trace neuve, intacte, et ses lignes repartent une fois ; il ne se rejoue pas à chaque passe, la trace neuve suffit. Une trace d'un compte qui ne compte pas ne vaut rien de même : nul hors de l'organisation ne fait taire l'écart.
6. **Les deux textes** : la trace (décision 4) ; la ligne à l'auteur et au conducteur (ou à l'architecte) : `PR <n> : demande de relecture écartée (commentaire <id> modifié après sa création) : en écrire une neuve, jamais modifiée`.
7. **L'en-tête de `decision-relecteur.mjs`** : la trace parmi les commentaires lus (9-18) ; **19-20 amendées explicitement** : « Un commentaire qui porte le préfixe d'une marque sans en avoir la forme n'est jamais ignoré : c'est une lecture illisible » devient « … c'est une lecture illisible, sauf la trace `Demande écartée — `, ignorée (A-228) » ; 23 : « à deux exceptions près » devient « à trois exceptions près », la troisième étant la demande modifiée, qui ne sert qu'à dire l'écart (A-227) ; et la phrase du ticket 94 sur les deux traces hors de `dernier`, à règles opposées, est complétée par celle-ci.
8. **La veille** : `signaler` est un geste à jouer ; il la réveille, et, dans la veille réécrite par le ticket 95 (la liste des gestes muets, `relecteur.mjs:445` sur `main`, y est devenue la comparaison des clés), il lève une sourdine d'une autre clé. Ce ticket n'ajoute rien à la veille ; le banc le prouve.
9. **La version** : celle du ticket 94 (une seule montée pour 94, 95 et 96) ; ce ticket ajoute à sa note le geste `signaler`, et la note dit qu'un projet repose `fusionner` (le script de la décision est celui de son `develop`) avant que son Relecteur le joue.

## Où

Lignes lues sur `origin/main` à `b57eae7`, avant les tickets 94 et 95.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs:9-31` | l'en-tête (décision 7) |
| `decision-relecteur.mjs:121-187` (`lireMarques` et son JSDoc) | les demandes modifiées lues dans `ecartes` (motif `edite`, corps au préfixe `À relire — `) dans une liste `demandesModifiees` (`id`, `rang`, `date`, `auteur`, `conducteur`, `lisible`) ; les traces lues dans `retenus` seulement, dans `ecarts`, hors de `dernier`, avant `MARQUES` comme les traces d'illisible (`:162-168`) ; le préfixe sans la forme : `continue`, rien d'autre |
| `decision-relecteur.mjs:370-392` (`decider`) | le geste `signaler`, après l'illisible (379) et avant la règle 1 (392) |
| `skills/chaine/fusionner/scripts/decision-relecteur.test.mjs` | les cas de « À faire », étape 2 (l'aide `fil`, lignes 15-23, sait déjà `edite: true` et `de`) |
| `skills/chaine/relecteur/scripts/relecteur.mjs:39-54` | l'en-tête de `passe` (39-43) et de `jouer` (44-54) : `signaler`, son commentaire, et le rejeu aussitôt |
| `relecteur.mjs:370-373` (`jouerGeste`) | `signaler` écrit son commentaire comme `plafonner`, `panne` et `illisible` |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | les cas de l'étape 4, sur le faux GitHub (`skills/chaine/sujet/scripts/faux-gh.mjs` : un commentaire objet à `updated_at`, en-tête 42-45 ; `PR.editions`, 46 et 206) |
| `skills/chaine/relecteur/SKILL.md:35-43`, `:45`, `:76` | une ligne de table `signaler` (« `jouer <n>`, ses lignes, puis `jouer <n>` de nouveau, et son geste »), à côté de celle de `noter` (ticket 94) ; le paragraphe de `jouer` : la trace ; « Les lignes » : une demande modifiée ne sonne personne d'autre que par la ligne de `signaler` |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:130` | l'étape 5 : « la demande ne se modifie jamais ; une erreur (un sha faux) se corrige par une demande neuve » |
| `scripts/relecteur.test.mjs` | un test de texte : la ligne de table de `signaler` (`ligne(texte, "## À chaque réveil", "| \`signaler\` |")`) et la phrase de l'étape 5 |
| `skills/chaine/fusionner/references/CONTENU.md:63` | la trace, et la demande modifiée qui ne décide rien, dans la description de `decision-relecteur.mjs` |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note du ticket 94, complétée (décision 9) ; aucune montée de plus |

Modèle à imiter : les verdicts modifiés lus dans `ecartes` (`decision-relecteur.mjs:146-151`) pour les demandes modifiées ; les traces d'illisible (`:162-168`) pour la lecture hors de `dernier` ; la ligne `plafonner` de `decider` (`:397`) pour la forme du geste ; le geste `illisible` de `jouerGeste` (`relecteur.mjs:370-373`) pour l'écriture.

## À faire, dans l'ordre

1. **Sur la branche de 94 et 95**, leurs commits faits : relire chaque ligne citée ici, que 94 et 95 ont décalées.
2. **Les bancs de la décision** (`decision-relecteur.test.mjs`) :
   - **rouges avant le code** : (a) la seule demande `À relire` modifiée : `signaler`, la trace, deux lignes (`auteur` vers `Session:`, `conducteur` vers `Conducteur:`, lues sur le commentaire modifié), y compris sur une PR à `à-fusionner` dont le contenu a changé depuis le verdict (le cas de #10 : `signaler` avant la règle 3) ; (b) `Session: —` seul : la ligne `conducteur` seule ; `Conducteur: —` seul : la ligne `auteur` seule ; (c) les deux à `—`, ou le préfixe sans la forme : une ligne, à l'architecte ; (d) la trace ajoutée au fil : le geste d'avant ce ticket, avec les mêmes lignes (sans destinataire tant qu'aucune demande intacte n'existe) ; (e) une demande intacte plus ancienne et une modifiée plus récente : `signaler` d'abord, puis, la trace écrite, les lignes des autres gestes aux destinataires de la demande intacte ; (f) une trace modifiée (`edite: true`) : `signaler` de nouveau, puis, une trace intacte ajoutée, plus rien ;
   - **verts avant et après** : (g) une demande intacte plus récente que la modifiée : aucun `signaler`, ses destinataires servent comme aujourd'hui ; (h) un commentaire au préfixe de la trace sans sa forme : ni `illisible`, ni `pause`, ni `signaler` ; `tourValide` rend le même tour avec ou sans lui, avec ou sans trace à la forme ; (i) une demande modifiée d'un compte qui ne compte pas (`de: 'NONE'`, motif `auteur`) : rien ; (j) un commentaire modifié qui ne porte plus le préfixe `À relire — ` : rien.
   Voir les rouges rouges.
3. **Le code de la décision** : décisions 1 à 7. Tout `decision-relecteur.test.mjs` vert.
4. **Les bancs du Relecteur, rouges** (`relecteur.test.mjs`) : `jouer 12` sur une PR dont la demande est modifiée écrit la trace (`ecritures` : `POST issues/12/comments` seul) et rend ses lignes ; rejoué aussitôt, il rend le geste de la PR ; une écriture refusée (`d.github({ commentairesRefuses: '^Demande écartée — ' })`) sort en 7, comme pour le plafond ; la veille se réveille sur `signaler` : `'VEILLE GESTE\nGESTE 12 signaler règle —\nSOURDINES aucune\n'`.
5. **Le code du Relecteur** : `jouerGeste` et l'en-tête. Tout `relecteur.test.mjs` vert.
6. **Les textes** : `SKILL.md`, `chaine-de-production.md`, `CONTENU.md`, le test de texte de `scripts/relecteur.test.mjs` (rouge avant, vert après).
7. **La note de version** du ticket 94, complétée ; un commit.
8. **Les mutations**, puis **la vérification** de la branche entière (94, 95, 96), puis la PR des trois tickets vers `main`, son titre la version prise.

## Surfaces

| Surface | Banc |
| --- | --- |
| une demande modifiée seule rend `signaler`, la trace et ses lignes | `decision-relecteur.test.mjs` (a) |
| un seul champ à `—` : seule la ligne non nulle ; les deux, ou le corps hors forme : l'architecte | `decision-relecteur.test.mjs` (b), (c) |
| la trace écrite, la décision d'avant reprend ; elle ne se rejoue pas | `decision-relecteur.test.mjs` (d), (e) |
| une trace modifiée : un `signaler` de plus, puis rien | `decision-relecteur.test.mjs` (f) |
| ce qui marche ne change pas : demande intacte plus récente, motif `auteur`, préfixe de demande perdu | `decision-relecteur.test.mjs` (g), (i), (j) |
| une trace presque à la forme est ignorée, et `tourValide` n'en dépend pas | `decision-relecteur.test.mjs` (h) |
| `jouer` écrit la trace et rend ses lignes ; refusé, sortie 7 ; rejoué, le geste de la PR | `relecteur.test.mjs` |
| la veille se réveille sur `signaler` | `relecteur.test.mjs` |
| la table et l'étape 5 disent le geste et la règle | `scripts/relecteur.test.mjs` |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la trace comptée dans `dernier` | (d) (la ligne d'un geste d'étiquette rejoué) ; le rejeu de `relecteur.test.mjs` |
| `signaler` placé après la règle 3 | (a) avec `à-fusionner` sur un contenu changé |
| la trace non lue (le geste rendu à chaque passe) | (d) |
| une trace modifiée lue comme une trace (lue dans `ecartes`) | (f) |
| une trace presque à la forme lue comme une lecture illisible | (h) |
| les destinataires de la demande modifiée servis aux autres lignes | (d), (e) |
| le motif `auteur` traité comme `edite` | (i) |
| un seul champ à `—` qui envoie aussi la ligne à l'architecte | (b) |
| les deux champs à `—` qui n'envoient rien | (c) |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/fusionner/scripts/decision-relecteur.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs scripts/relecteur.test.mjs`, rouges à l'étape 2, 4 ou 6, verts après ; puis `verdict-du-capitaine.test.mjs`, toujours vert.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` ; le compte de `main` au départ de 94, plus les tests neufs des trois tickets, recopié dans la PR avec la durée.

## Ce qui n'a pas été établi

- **Quel geste a modifié la demande de #10.** Le dépôt jouet n'est pas lisible d'ici. Le journal nomme une piste, un outil qui ajoute un pied de page après coup ; elle n'est pas prouvée, et elle n'est pas systématique (la demande du tour 2 de #10 n'a pas été modifiée, journal, 17 h 48). L'historique des modifications du commentaire (`userContentEdits`, API GraphQL) le dirait. Si c'est un outil de la plateforme, le pied connu est déjà retiré par `corpsLu` (`verdict.mjs:45`), mais la date de modification reste : le ticket ne change pas, il se joue plus souvent.

## Hors périmètre

- Changer `A-118` : un commentaire modifié ne décide toujours rien.
- Le script qui écrit la demande depuis `git rev-parse HEAD` (constat (8), famille `chantier`).
- `renvoyer.sh` (constat (4), famille `fusionner`).

## Comments

- 2026-11-27 — Passé `ready-for-agent` après relecture : `A-227` et `A-228` décidées ; ordre 94, 95, 96 dans une PR (`A-232`), Opus ; un seul champ à `—` ; « le compte qui a modifié » reformulé (`retenir` juge l'auteur du commentaire) ; les traces lues dans les `retenus` seuls, une trace modifiée rejouée une fois ; le chemin entier de `faux-gh.mjs` ; l'en-tête de `jouer` jusqu'à 54 ; l'amendement de 19-20 écrit ; la veille lue dans sa réécriture par 95 ; lignes relues sur `b57eae7` (8.5.0).
