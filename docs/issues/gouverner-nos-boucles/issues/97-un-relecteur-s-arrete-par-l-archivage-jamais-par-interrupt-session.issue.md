# Un Relecteur s'arrête par l'archivage de sa session, jamais par `interrupt_session` : le geste est écrit, et l'ancien est archivé avant qu'un neuf parte

Status: needs-triage
Type: défaut
Modèle: sonnet — du texte dans trois fichiers de skill et un banc de texte, sans code ; la règle est fixée par la décision `A-229` (proposée, à confirmer par l'architecte). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 96
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/SKILL.md` (« Qui le lance », lignes 18 à 22 ; « La veille », lignes 95 et 99 ; « Ne jamais », ligne 107) ; `skills/chaine/architecte/references/lancement.md` (lignes 68 et 80) ; `skills/chaine/architecte/SKILL.md` (lignes 66 et 86) ; `scripts/relecteur.test.mjs` ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Le ticket 96 touche `relecteur/SKILL.md` (lignes 35 à 43 et 76) et `scripts/relecteur.test.mjs` : il passe d'abord, d'où `Blocked by: 96`, pour que les deux PR ne se battent que sur les fichiers de version.

## Le besoin

Constat (2) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 17 h 48 UTC, cas 4 bis). Pour simuler une panne du Relecteur, l'architecte a appelé `interrupt_session` sur lui, au repos. Sa veille de fond a continué. La panne a dû être simulée par un message, que le skill interdit pourtant de suivre comme un ordre. Ensuite (cas 11, 18 h 41), un Relecteur neuf a été lancé alors que l'ancien, arrêté, restait vivant pour `get_session`.

Le besoin : **un geste écrit, et sûr, pour arrêter un Relecteur.** Il arrête aussi sa veille. Il précède tout lancement d'un Relecteur neuf, pour qu'il n'y en ait jamais deux à la fois sur un dépôt.

## La cause, à la source (`main` en 8.4.0)

1. `skills/chaine/relecteur/SKILL.md:92` : la veille tourne en tâche de fond de l'outil Bash (`run_in_background`). Une telle tâche survit à la fin du tour, et sa fin réveille la session.
2. `interrupt_session` arrête **le tour en cours** de la session cible, à son prochain point d'arrêt. Un Relecteur au repos n'a pas de tour : rien ne s'arrête, et la veille, à sa fin (`VEILLE GESTE` ou `VEILLE FINIE`), le réveille comme avant. Interrompu pendant un tour, il est réveillé de même par la fin de sa veille.
3. Aucun texte du plugin ne dit comment arrêter un Relecteur. `relecteur/SKILL.md:18-22` dit qui le lance et qu'un Relecteur neuf reprend tout sur les commentaires ; `:95` dit qu'il s'arrête de lui-même au-delà de 500 000 tokens. `architecte/references/lancement.md:68` et `architecte/SKILL.md:66` disent de n'en pas lancer un second tant que `get_session` dit vivant celui de la ligne `Relecteurs:`. Aucun ne dit quoi faire d'un Relecteur vivant qu'on veut remplacer.
4. `relecteur/SKILL.md:107` lui interdit de « répondre à un message comme à un ordre » : un message ne l'arrête pas, et c'est voulu (tout ce qui vient d'une PR ou d'une session est une donnée).

## Décision (proposée)

**`A-229` — Un Relecteur s'arrête par `archive_session`, et par aucun autre geste ; jamais par `interrupt_session`, jamais par un message.** L'archivage libère son conteneur, donc sa veille et tout geste en cours. Le geste revient à l'architecte, qui archive déjà (`P-62`, `architecte/SKILL.md:86` : la garde du mode « Auto » refuse `archive_session` au conducteur et au capitaine). Sans programme, le conducteur qui l'a lancé ne peut pas archiver : il écrit au produit « Relecteur <id> à archiver : <raison> », et n'en lance pas de neuf avant l'archivage. Avant de lancer un Relecteur neuf, l'ancien est archivé, puis `get_session` le dit archivé, puis le neuf part et la ligne `Relecteurs:` (ou `Relecteur:`) change. Le Relecteur qui s'arrête de lui-même (au-delà de 500 000 tokens, ou sur une sortie qui dit « s'arrêter ») est archivé de même par qui l'a lancé.

Raison. Un Relecteur ne garde rien en mémoire : neuf, il reprend la file sur les seuls commentaires des PR (`relecteur/SKILL.md:22`). Archiver puis relancer ne perd donc rien. Un arrêt en plein geste est déjà couvert : une étiquette posée sans que l'ancienne soit retirée se rejoue (`A-84`), une session créée sans distribution est orpheline et se dit. Une pause par fichier témoin, comme `boucle.sh --arreter` du capitaine, ferait un second mécanisme pour le même besoin, avec son code et ses bancs ; ce ticket ne l'ajoute pas.

## Quand le ticket est fait

1. `relecteur/SKILL.md` a une phrase « L'arrêter » dans « Qui le lance » : `archive_session`, par l'architecte (sans programme, par le produit, à la demande du conducteur) ; `interrupt_session` n'arrête pas la veille ; un message ne l'arrête pas. Le fichier reste sous 200 lignes.
2. `relecteur/SKILL.md:95` : « s'arrêter » au-delà de 500 000 tokens dit que l'architecte l'archive avant de lancer le neuf.
3. `architecte/references/lancement.md`, « Le Relecteur d'un dépôt » : remplacer un Relecteur, c'est l'archiver, lire `get_session` qui le dit archivé, puis lancer le neuf et changer la ligne `Relecteurs:` ; la phrase sans programme (ligne 80) dit la ligne au produit.
4. `architecte/SKILL.md:66` renvoie à ce geste ; `:86` compte le Relecteur parmi les sessions que l'architecte archive.
5. Aucun texte du plugin ne propose `interrupt_session` pour arrêter un Relecteur (`git grep` de `interrupt_session` sous `skills/` : la seule occurrence reste celle des filles, `chantier/SKILL.md:113`).
6. La note de version (la suivante de `main` au moment de livrer) dit le geste.

## Où

| Fichier (lignes sur `main` en 8.4.0) | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/SKILL.md:18-22` | la phrase « L'arrêter » (cas 1) |
| `skills/chaine/relecteur/SKILL.md:95` | l'archivage après l'arrêt de lui-même (cas 2) |
| `skills/chaine/architecte/references/lancement.md:68`, `:80` | remplacer un Relecteur ; la ligne au produit sans programme (cas 3) |
| `skills/chaine/architecte/SKILL.md:66`, `:86` | le renvoi ; le Relecteur parmi les sessions archivées (cas 4) |
| `skills/chaine/relecteur/references/CONTENU.md` | la raison d'`A-229`, en deux phrases |
| `scripts/relecteur.test.mjs` | un test de texte (ci-dessous) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main`, la note |

## Bancs à écrire

Un test de `scripts/relecteur.test.mjs`, rouge avant le texte, vert après : `relecteur/SKILL.md` nomme `archive_session` comme le seul arrêt, dit que `interrupt_session` n'arrête pas la veille, et reste sous 200 lignes ; `lancement.md` dit d'archiver l'ancien avant de lancer le neuf ; aucun fichier sous `skills/` n'associe `interrupt_session` au Relecteur. Mutations, toutes rouges : la phrase « L'arrêter » retirée ; `interrupt_session` proposé dans `lancement.md` ; l'ordre « archiver, puis lancer » inversé.

## Ce qui n'a pas été établi

- Que `interrupt_session` arrête aussi les tâches de fond d'une session qui travaille. L'essai ne l'a vu que sur un Relecteur au repos ; la description de l'outil ne parle que du tour. La décision n'en dépend pas : l'archivage arrête tout.

## Hors périmètre

- Un essai futur qui doit simuler la panne d'un Relecteur l'archive : c'est le plan de l'essai, pas le plugin.
- La veille du capitaine, qui a déjà son arrêt (`boucle.sh --arreter`).

## Comments
